// resources/js/Components/Panels/FormDesignerPanel.tsx - Visual Form/Window Designer
import React, { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import AnchorSection from './AnchorSection';
import TabOrderModal from '../Modals/TabOrderModal';
import { confirmDialog } from 'primereact/confirmdialog';
import { ConfirmDialog } from 'primereact/confirmdialog';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { Menu } from 'primereact/menu';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { AutoComplete } from 'primereact/autocomplete';
import { InputTextarea } from 'primereact/inputtextarea';
import { InputNumber } from 'primereact/inputnumber';
// ColorPicker, TabView, TabPanel - reserved for future use
import { Toast } from 'primereact/toast';
import { ProgressSpinner } from 'primereact/progressspinner';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  BackgroundVariant,
  NodeResizer,
  SelectionMode,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { TabContentProps } from '@/types';
import { useProject } from '@/contexts/ProjectContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation, SupportedLanguage, getStoredLanguage } from '@/i18n';
import { apiClient } from '@/lib/api';

// ========== INTERFACES ==========

interface FormSet {
  id: number;
  name: string;
  description?: string;
  creator_user_id: number;
  visibility: 'private' | 'team' | 'public';
  cloned_from_id?: number;
  default_background_color: string;
  default_window_color: string;
  default_text_color: string;
  default_button_color: string;
  default_button_text_color: string;
  is_active: boolean;
  windows?: FormWindow[];
  windows_count?: number;
  creator?: { id: number; name: string };
}

interface FormWindow {
  id: number;
  form_set_id: number;
  name: string;
  display_name?: string;
  window_type: 'main_menu' | 'create_edit' | 'data_table';
  min_width: number;
  min_height: number;
  default_width: number;
  default_height: number;
  background_color?: string;
  window_color?: string;
  text_color?: string;
  is_active: boolean;
  sort_order: number;
  elements?: FormElement[];
}

interface FormElement {
  id?: number;
  form_window_id: number;
  element_type: string;
  x_position: number;
  y_position: number;
  width: number;
  height: number;
  // Anchor
  anchor_right?: number | null;
  anchor_bottom?: number | null;
  anchor_width?: number | null;
  anchor_height?: number | null;
  // Container-spezifisch
  container_orientation?: 'vertical' | 'horizontal';
  max_fields?: number;
  container_gap?: number;
  container_columns?: number;
  default_control_height?: number;
  // Button-spezifisch
  button_label?: string;
  button_icon?: string;
  button_action?: string;
  button_background_color?: string;
  button_text_color?: string;
  // Tab-spezifisch
  tab_label?: string;
  parent_tab_container_id?: number;
  custom_style?: Record<string, unknown>;
  sort_order: number;
  tab_order?: number;
  is_visible: boolean;
}

interface AccessStatus {
  has_access: boolean;
  access_type?: 'credits' | 'patron';
  patron_level?: string;
  credits_paid?: number;
  granted_at?: string;
  expires_at?: string;
  days_remaining?: number;
  is_patron?: boolean;
  is_expired?: boolean;
  can_renew?: boolean;
  unlock_cost?: number;
  user_credits?: number;
}

const DEFAULT_ICONS: Record<string, string> = {
  button_nav_first: 'pi-angle-double-left',
  button_nav_prev: 'pi-angle-left',
  button_nav_next: 'pi-angle-right',
  button_nav_last: 'pi-angle-double-right',
  button_save: 'pi-save',
  button_cancel: 'pi-times',
  button_close: 'pi-times',
  button_new: 'pi-plus',
  button_delete: 'pi-trash',
};

// Stable reference for ReactFlow's multiSelectionKeyCode prop — must NOT be
// recreated each render, otherwise the internal store loops on updates.
const MULTI_SELECTION_KEYS = ['Control', 'Shift', 'Meta'];

// Suggested actions for user-defined (button_custom) buttons. The field is an
// editable combobox: these are only SUGGESTIONS — the user may type any free
// value (e.g. "print-form1"). Templates branch on it via {:layoutsingle.action:}
// / {:layoutbutton.action:}. Standard buttons (save/cancel/…) don't use it.
const BUTTON_ACTION_PRESETS = ['print', 'bulk_modify', 'recycle', 'export', 'duplicate', 'archive', 'refresh'];

// Marquee-selection mouse routing:
//   - LEFT button (0) → lasso (selectionOnDrag)
//   - MIDDLE (1) / RIGHT (2) → pan the canvas
// This mirrors what design tools like Figma do: drag empty space with left
// mouse = select multiple controls; use middle-mouse or right-mouse to pan.
// Dragging a node still moves it (ReactFlow auto-distinguishes node vs pane).
// Without this swap, left-drag would pan AND lasso at the same time — the
// "pan wins" default makes the lasso unreachable.
// Plain (non-readonly) array because ReactFlow's panOnDrag prop is typed
// as `number[]`. Module-level const = stable reference, no re-renders.
const PAN_ON_DRAG_BUTTONS: number[] = [1, 2];

// ========== HELPER FUNCTIONS ==========

const getElementColor = (elementType: string): string => {
  if (elementType.startsWith('container') || elementType === 'tab_container' || elementType === 'menu_container') {
    return '#374151'; // Gray for containers
  }
  if (elementType.startsWith('button_nav')) {
    return '#1e40af'; // Blue for navigation
  }
  if (elementType === 'button_save' || elementType === 'button_new') {
    return '#059669'; // Green for positive actions
  }
  if (elementType === 'button_delete') {
    return '#dc2626'; // Red for delete
  }
  if (elementType === 'button_cancel' || elementType === 'button_close') {
    return '#6b7280'; // Gray for cancel
  }
  if (elementType === 'tab_panel') {
    return '#4f46e5'; // Indigo for tabs
  }
  return '#6b7280'; // Default gray
};

// ========== CUSTOM NODES ==========

interface FormElementNodeData {
  element: FormElement;
  onSelect: (element: FormElement) => void;
  isSelected: boolean;
  isReadOnly: boolean;
  defaultButtonColor?: string;
  defaultButtonTextColor?: string;
  t: Record<string, string>; // Translation-Objekt
  [key: string]: unknown; // Index signature for xyflow v12 compatibility
}

const FormElementNode = ({ data, selected }: { data: FormElementNodeData; selected?: boolean }) => {
  const element = data.element;
  const bgColor = getElementColor(element.element_type);
  const icon = element.button_icon || DEFAULT_ICONS[element.element_type] || 'pi-box';
  const label = element.button_label || element.tab_label || '';

  // Button-Farben: Element-spezifisch oder FormSet-Standard
  const buttonBgColor = element.button_background_color || data.defaultButtonColor || '#3b82f6';
  const buttonTextColor = element.button_text_color || data.defaultButtonTextColor || '#ffffff';

  const isButton = element.element_type.startsWith('button_');
  const isSpacer = element.element_type === 'spacer';
  const isSeparator = element.element_type === 'separator';

  // Buttons: Centered content, no header - mit anpassbaren Farben
  if (isButton) {
    return (
      <div
        className={`rounded border-2 flex items-center justify-center ${selected ? 'border-yellow-400' : 'border-gray-500'}`}
        style={{
          backgroundColor: buttonBgColor,
          width: '100%',
          height: '100%',
          minWidth: 40,
          minHeight: 30,
        }}
      >
        {selected && !data.isReadOnly && (
          <NodeResizer
            color="#fbbf24"
            isVisible={selected}
            minWidth={40}
            minHeight={30}
            handleStyle={{ width: '8px', height: '8px', borderRadius: '2px' }}
            lineStyle={{ borderWidth: '2px' }}
          />
        )}
        <div className="flex items-center justify-center gap-1 px-2">
          <i className={`pi ${icon} text-sm`} style={{ color: buttonTextColor }}></i>
          {label && <span className="text-xs font-medium" style={{ color: buttonTextColor }}>{label}</span>}
        </div>
      </div>
    );
  }

  // Spacer: Simple dashed box
  if (isSpacer) {
    return (
      <div
        className={`rounded border-2 border-dashed flex items-center justify-center ${selected ? 'border-yellow-400' : 'border-gray-600'}`}
        style={{
          backgroundColor: 'transparent',
          width: '100%',
          height: '100%',
          minWidth: 20,
          minHeight: 20,
        }}
      >
        {selected && !data.isReadOnly && (
          <NodeResizer
            color="#fbbf24"
            isVisible={selected}
            minWidth={20}
            minHeight={20}
            handleStyle={{ width: '8px', height: '8px', borderRadius: '2px' }}
            lineStyle={{ borderWidth: '2px' }}
          />
        )}
        <span className="text-gray-500 text-xs">{data.t.formdesignerpanel237}</span>
      </div>
    );
  }

  // Separator: Horizontal line
  if (isSeparator) {
    return (
      <div
        className={`flex items-center justify-center ${selected ? 'border-2 border-yellow-400 rounded' : ''}`}
        style={{
          width: '100%',
          height: '100%',
          minWidth: 50,
          minHeight: 10,
        }}
      >
        {selected && !data.isReadOnly && (
          <NodeResizer
            color="#fbbf24"
            isVisible={selected}
            minWidth={50}
            minHeight={8}
            handleStyle={{ width: '8px', height: '8px', borderRadius: '2px' }}
            lineStyle={{ borderWidth: '2px' }}
          />
        )}
        <div className="w-full h-0.5 bg-gray-500"></div>
      </div>
    );
  }

  // Containers: Header + Body
  // Menu containers can be smaller than data containers
  const isMenuContainer = element.element_type === 'menu_container';
  const minW = isMenuContainer ? 60 : 150;
  const minH = isMenuContainer ? 30 : 80;

  return (
    <div
      className={`rounded border-2 flex flex-col ${selected ? 'border-yellow-400' : 'border-gray-500'}`}
      style={{
        backgroundColor: bgColor,
        width: '100%',
        height: '100%',
        minWidth: minW,
        minHeight: minH,
      }}
    >
      {selected && !data.isReadOnly && (
        <NodeResizer
          color="#fbbf24"
          isVisible={selected}
          minWidth={minW}
          minHeight={minH}
          handleStyle={{ width: '8px', height: '8px', borderRadius: '2px' }}
          lineStyle={{ borderWidth: '2px' }}
        />
      )}

      {/* Header for Containers */}
      <div className="flex items-center justify-between px-2 py-1 bg-black bg-opacity-30 rounded-t flex-shrink-0">
        <div className="flex items-center gap-1">
          <i className={`pi ${icon} text-white text-xs`}></i>
          <span className="text-white text-xs font-medium">
            {element.element_type === 'container' && data.t.formdesignerpanel302}
            {element.element_type === 'tab_container' && data.t.formdesignerpanel303}
            {element.element_type === 'menu_container' && data.t.formdesignerpanel304}
            {element.element_type === 'tab_panel' && (label || data.t.formdesignerpanel305)}
          </span>
          {/* Show orientation for menu_container */}
          {isMenuContainer && element.container_orientation && (
            <span className="text-blue-300 text-xs ml-1">
              ({element.container_orientation === 'horizontal' ? '→' : '↓'})
            </span>
          )}
        </div>
        {element.max_fields && (
          <span className="text-yellow-300 text-xs">max:{element.max_fields}</span>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 p-2 border-t border-gray-600 border-dashed overflow-hidden">
        <div className="text-gray-400 text-xs text-center">
          {element.element_type === 'container' && data.t.formdesignerpanel322}
          {element.element_type === 'tab_container' && data.t.formdesignerpanel323}
          {element.element_type === 'menu_container' && (
            element.container_orientation === 'horizontal' ? data.t.formdesignerpanel325 : data.t.formdesignerpanel325_2
          )}
          {element.element_type === 'tab_panel' && data.t.formdesignerpanel327}
        </div>
      </div>
    </div>
  );
};

// Window Frame Node - shows the visual boundaries of the window
interface WindowFrameNodeData {
  windowName: string;
  windowType: string;
  windowTypeLabel: string;
  minSizeLabel: string;
  defaultWidth: number;
  defaultHeight: number;
  minWidth: number;
  minHeight: number;
  windowColor: string;
  textColor: string;
  [key: string]: unknown; // Index signature for xyflow v12 compatibility
}

const WindowFrameNode = ({ data }: { data: WindowFrameNodeData }) => {
  const { t } = useTranslation(getStoredLanguage());
  const HEADER_H = 32;
  return (
    <div
      className="pointer-events-none"
      style={{
        width: data.defaultWidth,
        height: data.defaultHeight,
        border: '2px solid #6366f1',
        borderRadius: '8px',
        backgroundColor: data.windowColor || '#374151',
        position: 'relative',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
        overflow: 'hidden',
      }}
    >
      {/* Window title bar — INSIDE the window (32px), elements start below this */}
      <div
        style={{
          height: HEADER_H,
          backgroundColor: '#6366f1',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 8px',
          borderTopLeftRadius: 6,
          borderTopRightRadius: 6,
          color: 'white',
          fontSize: 12,
        }}
      >
        <span className="font-medium">
          <i className="pi pi-window-maximize mr-1"></i>
          {data.windowName || data.windowTypeLabel || t.formdesignerpanel374}
        </span>
        <span className="opacity-75">
          {data.defaultWidth} × {data.defaultHeight} px
        </span>
      </div>

      {/* Min size indicator (inner dashed rectangle, offset by header) */}
      {(data.minWidth < data.defaultWidth || data.minHeight < data.defaultHeight) && (
        <div
          className="absolute pointer-events-none"
          style={{
            top: HEADER_H,
            left: 0,
            width: data.minWidth,
            height: data.minHeight - HEADER_H,
            border: '1px dashed rgba(255,255,255,0.3)',
            borderRadius: '4px',
          }}
          title={`${data.minSizeLabel}${data.minWidth} × ${data.minHeight} px`}
        />
      )}

      {/* Corner indicators */}
      <div className="absolute -bottom-1 -right-1 w-3 h-3 border-r-2 border-b-2 border-indigo-500 rounded-br"></div>
      <div className="absolute -bottom-1 -left-1 w-3 h-3 border-l-2 border-b-2 border-indigo-500 rounded-bl"></div>

      {/* Size labels at edges */}
      <div
        className="absolute -right-8 top-1/2 -translate-y-1/2 text-xs text-indigo-400 transform rotate-90 whitespace-nowrap"
        style={{ fontSize: '10px' }}
      >
        {data.defaultHeight}px
      </div>
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-5 text-xs text-indigo-400 whitespace-nowrap"
        style={{ fontSize: '10px' }}
      >
        {data.defaultWidth}px
      </div>
    </div>
  );
};

// Node types registry
const nodeTypes = {
  formElement: FormElementNode,
  windowFrame: WindowFrameNode
};

// ========== TAB CONTENT WRAPPER ==========

const TabContent: React.FC<TabContentProps> = ({ children, style = {}, ...rest }) => {
  const ref = useRef<HTMLDivElement>(null);
  const { colors } = useTheme();
  const setFocus = () => ref.current?.focus();

  return (
    <div
      {...rest}
      ref={ref}
      tabIndex={-1}
      style={{
        flex: 1,
        padding: '0',
        height: '100%',
        backgroundColor: colors.bgPrimary,
        color: colors.textPrimary,
        ...style
      }}
      onMouseDownCapture={setFocus}
      onTouchStartCapture={setFocus}
      className="form-designer-panel"
    >
      {children}
    </div>
  );
};

// ========== MAIN PANEL COMPONENT ==========

interface FormDesignerPanelProps {
  formSetId?: number;
  onOpenPanel?: (panelType: string, data?: Record<string, unknown>) => void;
}

export default function FormDesignerPanel({ formSetId: initialFormSetId, onOpenPanel }: FormDesignerPanelProps) {
  // i18n
  const [currentLanguage] = useState<SupportedLanguage>(getStoredLanguage());
  const { t } = useTranslation(currentLanguage);

  // Theme
  const { colors } = useTheme();

  // Refs
  const toastRef = useRef<Toast>(null);
  const isDraggingRef = useRef<boolean>(false);
  const isResizingRef = useRef<boolean>(false);

  // Context
  const { selectedProject } = useProject();

  // State - Access Control
  const [accessStatus, setAccessStatus] = useState<AccessStatus | null>(null);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [unlocking, setUnlocking] = useState(false);

  // State - FormSets
  const [formSets, setFormSets] = useState<FormSet[]>([]);
  const [selectedFormSet, setSelectedFormSet] = useState<FormSet | null>(null);
  // Always-current selection, so loadFormSets() (a stable useCallback) can tell
  // whether the open Form Set was deleted elsewhere without a stale closure.
  const selectedFormSetRef = useRef<FormSet | null>(null);
  selectedFormSetRef.current = selectedFormSet;
  const [loadingFormSets, setLoadingFormSets] = useState(false);

  // State - Windows
  const [selectedWindow, setSelectedWindow] = useState<FormWindow | null>(null);

  // LocalStorage keys
  const STORAGE_KEY_FORMSET = 'formDesigner_selectedFormSetId';
  const STORAGE_KEY_WINDOW = 'formDesigner_selectedWindowId';

  // State - Elements (React Flow)
   
  const [nodes, setNodes, onNodesChange] = useNodesState<any>([]);
  const [edges, _setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [selectedElement, setSelectedElement] = useState<FormElement | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  // Filtered suggestions for the editable button-action combobox.
  const [actionSuggestions, setActionSuggestions] = useState<string[]>(BUTTON_ACTION_PRESETS);
  // Ordered multi-selection of ReactFlow NODE ids, in click order. We key on
  // node id (not element.id) so controls freshly dragged from the stash — which
  // have no DB id until saved — are first-class members of the selection and
  // therefore obey multi-edit (width/anchor/…) just like persisted controls.
  const [orderedSelection, setOrderedSelection] = useState<string[]>([]);
  const [tabOrderModalVisible, setTabOrderModalVisible] = useState(false);
  const tabOrderMenuRef = useRef<Menu>(null);

  // State - Modals
  const [createFormSetModalVisible, setCreateFormSetModalVisible] = useState(false);
  const [editFormSetModalVisible, setEditFormSetModalVisible] = useState(false);
  const [propertiesPanelVisible, setPropertiesPanelVisible] = useState(true);
  const [unlockModalVisible, setUnlockModalVisible] = useState(false);

  // State - Form Data
  const [newFormSetName, setNewFormSetName] = useState('');
  const [newFormSetDescription, setNewFormSetDescription] = useState('');
  const [newFormSetVisibility, setNewFormSetVisibility] = useState<'private' | 'team' | 'public'>('private');

  // State - Saving
  const [saving, setSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Grid/Snap - read from project settings
  const snapToGrid = selectedProject?.form_designer_snap_to_grid ?? true;
  const gridSize = selectedProject?.form_designer_grid_size ?? 20;

  // ── Multi-select edit support ──
  // The set of ALL ReactFlow node ids the user has selected, so property
  // handlers can patch every selected control (not just one). orderedSelection
  // already holds node ids, so this is a direct lift — and because it's keyed
  // on node id (not element.id) it works for unsaved stash controls too. In
  // single-select it collapses to the one selectedNodeId, so existing call
  // sites keep working unchanged.
  const selectedNodeIds = useMemo<Set<string>>(() => {
    if (orderedSelection.length > 0) {
      return new Set(orderedSelection);
    }
    return new Set(selectedNodeId ? [selectedNodeId] : []);
  }, [orderedSelection, selectedNodeId]);

  // Apply a property patch to every node in selectedNodeIds (or just the
  // single selected node, depending on the selection). The element patch is
  // merged into each node's OWN data.element — we don't broadcast the full
  // selectedElement object, otherwise every selected control would inherit
  // unrelated fields (label, color, ...) from the representative one. The
  // optional nodePatch lets handlers also tweak the ReactFlow node's width/
  // height/position/style at the same time so the canvas reflects geometry
  // changes immediately.
  const applyToSelected = useCallback((
    elementPatch: Partial<FormElement>,
    nodePatch?: (n: any) => Partial<any>,
  ) => {
    if (selectedNodeIds.size === 0) return;
    setNodes((prev: any[]) => prev.map((n) => {
      if (!selectedNodeIds.has(n.id)) return n;
      const currentEl = (n.data?.element ?? {}) as FormElement;
      return {
        ...n,
        ...(nodePatch?.(n) ?? {}),
        data: { ...n.data, element: { ...currentEl, ...elementPatch } },
      };
    }));
    setSelectedElement((prev) => (prev ? { ...prev, ...elementPatch } : prev));
    setHasUnsavedChanges(true);
  }, [selectedNodeIds, setNodes]);

  const WINDOW_TYPE_LABELS: Record<string, string> = {
    main_menu: t.formdesignerpanel520,
    create_edit: t.formdesignerpanel521,
    data_table: t.formdesignerpanel522,
  };

  // ========== ELEMENT TYPE DEFINITIONS ==========
  const ELEMENT_TYPES = {
    containers: [
      { value: 'container', label: t.formdesignerpanel116, icon: 'pi-table' },
      { value: 'tab_container', label: t.formdesignerpanel531, icon: 'pi-folder' },
      // tab_panel is intentionally NOT droppable here. Tabs (tab_panel rows) are
      // generated dynamically at the Layout level (per FormSet × Schema-Table)
      // based on the tab_container's max_fields / container_columns and the
      // actual field count. Hard-coding a tab count in the template would defeat
      // that. The DB schema still keeps tab_panel as a valid element_type so the
      // Layout editor can create instances on the fly.
      { value: 'menu_container', label: t.formdesignerpanel533, icon: 'pi-bars' },
    ],
    navigation: [
      { value: 'button_nav_first', label: t.formdesignerpanel536, icon: 'pi-angle-double-left' },
      { value: 'button_nav_prev', label: t.formdesignerpanel537, icon: 'pi-angle-left' },
      { value: 'button_nav_next', label: t.formdesignerpanel538, icon: 'pi-angle-right' },
      { value: 'button_nav_last', label: t.formdesignerpanel539, icon: 'pi-angle-double-right' },
    ],
    actions: [
      { value: 'button_save', label: t.formdesignerpanel542, icon: 'pi-save' },
      { value: 'button_cancel', label: t.formdesignerpanel543, icon: 'pi-times' },
      { value: 'button_close', label: t.formdesignerpanel544, icon: 'pi-times' },
      { value: 'button_new', label: t.formdesignerpanel545, icon: 'pi-plus' },
      { value: 'button_delete', label: t.formdesignerpanel546, icon: 'pi-trash' },
      { value: 'button_custom', label: t.formdesignerpanel547, icon: 'pi-cog' },
    ],
    layout: [
      { value: 'separator', label: t.formdesignerpanel550, icon: 'pi-minus' },
      { value: 'spacer', label: t.formdesignerpanel551, icon: 'pi-arrows-h' },
    ],
  };

  // ========== API FUNCTIONS ==========
  const showToast = useCallback((severity: 'success' | 'info' | 'warn' | 'error', summary: string, detail?: string) => {
    toastRef.current?.show({ severity, summary, detail, life: 3000 });
  }, []);

  const checkAccess = useCallback(async () => {
    try {
      setCheckingAccess(true);
      const data = await apiClient.get('/form-designer/access');
      setAccessStatus(data);
    } catch (error) {
      console.error(t.formdesignerpanel573, error);
      showToast('error', t.messageError, t.formdesignerpanel574);
    } finally {
      setCheckingAccess(false);
    }
  }, [showToast]);

  const _unlockFeature = useCallback(async () => {
    try {
      setUnlocking(true);
      const data = await apiClient.post('/form-designer/unlock');
      if (data.success) {
        showToast('success', t.formdesignerpanel589, data.message);
        await checkAccess();
      } else {
        showToast('error', t.messageError, data.error || t.formdesignerpanel592);
      }
    } catch (error) {
      console.error(t.formdesignerpanel595, error);
      showToast('error', t.messageError, t.formdesignerpanel596);
    } finally {
      setUnlocking(false);
    }
  }, [checkAccess, showToast]);

  const loadFormSets = useCallback(async () => {
    try {
      setLoadingFormSets(true);
      const data = await apiClient.get('/form-sets?own_only=true');
      const formSetList = data.data || [];
      setFormSets(formSetList);

      // If the Form Set currently open in the editor no longer exists (it was
      // deleted here or in another panel), drop the stale selection so the
      // canvas doesn't keep editing a ghost and save/load can't 404.
      const cur = selectedFormSetRef.current;
      if (cur && !formSetList.some((fs: FormSet) => Number(fs.id) === Number(cur.id))) {
        setSelectedFormSet(null);
        setSelectedWindow(null);
        localStorage.removeItem(STORAGE_KEY_FORMSET);
        localStorage.removeItem(STORAGE_KEY_WINDOW);
        return; // nothing left to restore
      }

      // Determine which FormSet to select (priority: prop > localStorage > none)
      const storedFormSetId = localStorage.getItem(STORAGE_KEY_FORMSET);
      const storedWindowId = localStorage.getItem(STORAGE_KEY_WINDOW);
      const targetFormSetId = initialFormSetId ?? (storedFormSetId ? parseInt(storedFormSetId, 10) : null);

      if (targetFormSetId != null && formSetList.length > 0) {
        // Coerce both sides: API may serialise ids as strings while the prop
        // is a number (or vice-versa). Strict === silently missed the match,
        // leaving selectedFormSet null → blank combobox + unloaded canvas.
        const found = formSetList.find((fs: FormSet) => Number(fs.id) === Number(targetFormSetId));
        if (found) {
          // Load full details for this FormSet
          try {
            const detailData = await apiClient.get(`/form-sets/${found.id}`);
            setSelectedFormSet(detailData.data);

            // Restore window selection from localStorage or select first
            if (detailData.data?.windows?.length > 0) {
              const targetWindowId = storedWindowId ? parseInt(storedWindowId, 10) : null;
              const targetWindow = targetWindowId
                ? detailData.data.windows.find((w: FormWindow) => w.id === targetWindowId)
                : detailData.data.windows[0];
              setSelectedWindow(targetWindow || detailData.data.windows[0]);
            }
          } catch {
            // Detail load failure is non-critical - list is still shown
          }
        }
      }
    } catch (error) {
      console.error(t.formdesignerpanel642, error);
      showToast('error', t.messageError, t.formdesignerpanel643);
    } finally {
      setLoadingFormSets(false);
    }
  }, [initialFormSetId, showToast, STORAGE_KEY_FORMSET, STORAGE_KEY_WINDOW]);

  // Refresh the Form Set list when another panel (Form Template - Management)
  // reports a change, so a blueprint created there appears here too. A ref keeps
  // the once-registered listener pointing at the latest loader.
  const loadFormSetsRef = useRef(loadFormSets);
  loadFormSetsRef.current = loadFormSets;
  useEffect(() => {
    const handler = () => loadFormSetsRef.current();
    window.addEventListener('formSetsChanged', handler);
    return () => window.removeEventListener('formSetsChanged', handler);
  }, []);

  const loadFormSetDetails = useCallback(async (formSetId: number) => {
    try {
      const data = await apiClient.get(`/form-sets/${formSetId}`);
      setSelectedFormSet(data.data);

      // Save to localStorage for persistence
      localStorage.setItem(STORAGE_KEY_FORMSET, String(formSetId));

      // Auto-select first window
      if (data.data?.windows?.length > 0) {
        const firstWindow = data.data.windows[0];
        setSelectedWindow(firstWindow);
        localStorage.setItem(STORAGE_KEY_WINDOW, String(firstWindow.id));
      }
    } catch (error) {
      console.error(t.formdesignerpanel669, error);
      showToast('error', t.messageError, t.formdesignerpanel670);
    }
  }, [showToast, STORAGE_KEY_FORMSET, STORAGE_KEY_WINDOW]);

  // Targeted open from the Form Template Management "Edit in Blueprint Designer"
  // button. When this panel is ALREADY open, openPanel only re-activates the
  // tab — the new formSetId never reaches us as a prop (that's why the editor
  // stayed empty). The button also fires this event, which we always catch (a
  // ref keeps it pointing at the latest loader) and load the requested Form
  // Set. The fresh-create case is covered by the formSetId prop on mount.
  const loadFormSetDetailsRef = useRef(loadFormSetDetails);
  loadFormSetDetailsRef.current = loadFormSetDetails;
  useEffect(() => {
    const handler = (e: Event) => {
      const id = (e as CustomEvent).detail?.formSetId;
      if (id != null) loadFormSetDetailsRef.current(Number(id));
    };
    window.addEventListener('formDesigner:open', handler);
    return () => window.removeEventListener('formDesigner:open', handler);
  }, []);

  const createFormSet = useCallback(async () => {
    if (!newFormSetName.trim()) {
      showToast('warn', t.formdesignerpanel676, t.formdesignerpanel676_2);
      return;
    }

    try {
      setSaving(true);
      let data: any;
      try {
        data = await apiClient.post('/form-sets', {
          name: newFormSetName,
          description: newFormSetDescription,
          visibility: newFormSetVisibility,
        });
      } catch (err: any) {
        data = err?.response?.data || { success: false };
      }
      if (data.success) {
        showToast('success', t.formdesignerpanel694, t.formdesignerpanel694_2);
        setCreateFormSetModalVisible(false);
        setNewFormSetName('');
        setNewFormSetDescription('');
        setNewFormSetVisibility('private');

        if (data.data) {
          // Save to localStorage immediately
          localStorage.setItem(STORAGE_KEY_FORMSET, String(data.data.id));
          setSelectedFormSet(data.data);

          if (data.data.windows?.length > 0) {
            const firstWindow = data.data.windows[0];
            setSelectedWindow(firstWindow);
            localStorage.setItem(STORAGE_KEY_WINDOW, String(firstWindow.id));
          }
        }

        // Reload list after setting localStorage
        await loadFormSets();

        // Notify other panels (e.g. Form Template - Management) to refresh
        // their list so the newly created blueprint appears there too.
        window.dispatchEvent(new CustomEvent('formSetsChanged'));

        // Offer to set the new FormSet as project default — but only if no
        // default is currently set, so we don't pester the user on every create.
        if (data.data?.id && selectedProject?.id) {
          const newId = data.data.id as number;
          const projectId = selectedProject.id;
          try {
            const checkData = await apiClient.get(`/projects/${projectId}/form-set`);
            if (!checkData?.data?.id) {
              confirmDialog({
                group: 'form-designer',
                header: t.formsetdefault_prompt_title,
                message: t.formsetdefault_prompt_message,
                icon: 'pi pi-question-circle',
                acceptLabel: t.formdesignerpanel_yes,
                rejectLabel: t.formdesignerpanel_no,
                accept: async () => {
                  try {
                    await apiClient.post(`/projects/${projectId}/form-set`, { form_set_id: newId });
                  } catch {
                    // ignore — user can always set it manually in project settings
                  }
                },
              });
            }
          } catch {
            // ignore — fallback path: user sets default manually in project settings
          }
        }
      } else {
        showToast('error', t.messageError, data.error || t.formdesignerpanel715);
      }
    } catch (error) {
      console.error(t.formdesignerpanel718, error);
      showToast('error', t.messageError, t.formdesignerpanel719);
    } finally {
      setSaving(false);
    }
  }, [newFormSetName, newFormSetDescription, newFormSetVisibility, loadFormSets, showToast, selectedProject?.id, t]);

  const saveElements = useCallback(async () => {
    if (!selectedWindow) return;

    try {
      setSaving(true);

      // Convert nodes back to elements (exclude window-frame node)
      // In xyflow v12, measured dimensions are in node.measured, fallback to node.width/height, style, then original element
      const elementNodes = nodes.filter(node => node.type === 'formElement');
      const elements: FormElement[] = elementNodes.map((node, index) => {
        // Get width: first from measured (after resize), then from node, then from style, then from original element
        const width = node.measured?.width
          ?? node.width
          ?? (node.style?.width ? parseInt(String(node.style.width)) : null)
          ?? node.data.element.width;

        // Get height: first from measured (after resize), then from node, then from style, then from original element
        const height = node.measured?.height
          ?? node.height
          ?? (node.style?.height ? parseInt(String(node.style.height)) : null)
          ?? node.data.element.height;

        return {
          id: node.data.element.id,
          form_window_id: selectedWindow.id,
          element_type: node.data.element.element_type,
          x_position: Math.round(node.position.x),
          y_position: Math.round(node.position.y - 32), // Subtract header offset (elements are displayed +32px)
          width: Math.round(width),
          height: Math.round(height),
          // Anchor
          anchor_right: node.data.element.anchor_right ?? null,
          anchor_bottom: node.data.element.anchor_bottom ?? null,
          anchor_width: node.data.element.anchor_width ?? null,
          anchor_height: node.data.element.anchor_height ?? null,
          // Container-spezifisch
          container_orientation: node.data.element.container_orientation,
          max_fields: node.data.element.max_fields,
          container_gap: node.data.element.container_gap,
          container_columns: node.data.element.container_columns,
          default_control_height: node.data.element.default_control_height,
          // Button-spezifisch
          button_label: node.data.element.button_label,
          button_icon: node.data.element.button_icon,
          button_action: node.data.element.button_action,
          button_background_color: node.data.element.button_background_color,
          button_text_color: node.data.element.button_text_color,
          // Tab-spezifisch
          tab_label: node.data.element.tab_label,
          parent_tab_container_id: node.data.element.parent_tab_container_id,
          custom_style: node.data.element.custom_style,
          sort_order: index,
          tab_order: node.data.element.tab_order ?? 0,
          is_visible: node.data.element.is_visible ?? true,
        };
      });

      let data: any;
      try {
        data = await apiClient.put(`/form-windows/${selectedWindow.id}/elements`, { elements });
      } catch (err: any) {
        data = err?.response?.data || { success: false };
      }
      if (data.success) {
        showToast('success', t.formdesignerpanel783, t.formdesignerpanel783_2);
        setHasUnsavedChanges(false);

        // Update window with new elements AND sync node IDs with server data
        if (data.data && Array.isArray(data.data)) {
          const serverElements = data.data as FormElement[];

          // First, compute the ID mapping from current element nodes state
          // (we do this synchronously before setNodes)
          let newSelectedNodeId: string | null = null;
          let newSelectedElement: FormElement | null = null;

          // Calculate which node was selected and what its new ID should be
          // Filter to only element nodes (skip window-frame)
          const currentElementNodes = nodes.filter(n => n.type === 'formElement');
          currentElementNodes.forEach((node, index) => {
            const serverElement = serverElements[index];
            if (serverElement && serverElement.id) {
              const newNodeId = `element-${serverElement.id}`;
              if (selectedNodeId === node.id && newNodeId !== node.id) {
                newSelectedNodeId = newNodeId;
                newSelectedElement = serverElement;
              }
            }
          });

          // Update nodes with server data - use server positions to ensure consistency
          setNodes(prevNodes => {
            let elementIndex = 0;
            return prevNodes.map((node) => {
              // Skip window-frame node - keep it unchanged
              if (node.type !== 'formElement') {
                return node;
              }
              // Find matching server element by sort_order (elementIndex)
              const serverElement = serverElements[elementIndex];
              elementIndex++;
              if (serverElement && serverElement.id) {
                const newNodeId = `element-${serverElement.id}`;
                return {
                  ...node,
                  id: newNodeId,
                  // Use server-returned positions + header offset for display
                  position: {
                    x: serverElement.x_position,
                    y: serverElement.y_position + 32,
                  },
                  // Update dimensions from server
                  width: serverElement.width,
                  height: serverElement.height,
                  style: {
                    ...node.style,
                    width: serverElement.width,
                    height: serverElement.height,
                  },
                  data: {
                    ...node.data,
                    element: serverElement,
                  },
                };
              }
              return node;
            });
          });

          // Update selectedNodeId if the selected node's ID changed
          if (newSelectedNodeId) {
            setSelectedNodeId(newSelectedNodeId);
            setSelectedElement(newSelectedElement);
          }

          // Update selectedWindow with saved elements
          setSelectedWindow(prev => {
            if (!prev) return null;
            return { ...prev, elements: data.data };
          });

          // IMPORTANT: Also update the window in selectedFormSet.windows
          // This ensures that when switching tabs and back, we don't lose saved changes
          setSelectedFormSet(prev => {
            if (!prev?.windows) return prev;
            return {
              ...prev,
              windows: prev.windows.map(w =>
                w.id === selectedWindow.id
                  ? { ...w, elements: data.data }
                  : w
              ),
            };
          });
        }
      } else {
        showToast('error', t.messageError, data.error || t.formdesignerpanel875);
      }
    } catch (error) {
      console.error(t.formdesignerpanel878, error);
      showToast('error', t.messageError, t.formdesignerpanel879);
    } finally {
      setSaving(false);
    }
  }, [selectedWindow, nodes, selectedNodeId, showToast]);

  // ========== TAB ORDER HELPERS ==========

  // Apply a mapping of {elementId -> tab_order} to the element nodes and selectedElement.
  const applyTabOrderMap = useCallback((map: Map<number, number>) => {
    setNodes(prev => prev.map(n => {
      if (n.type !== 'formElement') return n;
      const el = n.data?.element as FormElement | undefined;
      if (!el || el.id == null) return n;
      const newOrder = map.get(el.id);
      if (newOrder == null) return n;
      const updatedEl = { ...el, tab_order: newOrder };
      return { ...n, data: { ...n.data, element: updatedEl } };
    }));
    setSelectedElement(prev => {
      if (!prev || prev.id == null) return prev;
      const newOrder = map.get(prev.id);
      if (newOrder == null) return prev;
      return { ...prev, tab_order: newOrder };
    });
    setHasUnsavedChanges(true);
  }, [setNodes]);

  // Assign 1..N to ids in orderedSelection in click order.
  const tabOrderFromSelection = useCallback(() => {
    if (orderedSelection.length < 2) {
      showToast('warn', t.formdesignerpanel_taborder_from_selection,
        'Please Ctrl/Shift+Click at least two elements first.');
      return;
    }
    // orderedSelection holds node ids; resolve each to its element id for the
    // tab-order map. Unsaved controls (no element id yet) are skipped — tab
    // order is a persisted property, so it only applies once an element exists.
    const map = new Map<number, number>();
    orderedSelection.forEach((nodeId, idx) => {
      const el = nodes.find(n => n.id === nodeId)?.data?.element as FormElement | undefined;
      if (typeof el?.id === 'number') map.set(el.id, idx + 1);
    });
    applyTabOrderMap(map);
  }, [orderedSelection, nodes, applyTabOrderMap, showToast, t]);

  // Assign tab order automatically by visual order: top→bottom (row buckets), then left→right.
  // Elements with tab_order === -1 (no tab stop) are skipped and stay at -1.
  const tabOrderAuto = useCallback(() => {
    const elementNodes = nodes.filter(n => n.type === 'formElement');
    const ROW_BUCKET = 20; // group elements within 20px Y-distance into the same row
    const sorted = [...elementNodes]
      .map(n => {
        const el = n.data.element as FormElement;
        // n.position.y has +32 header offset; use actual element y
        const y = (typeof n.position?.y === 'number') ? n.position.y - 32 : el.y_position;
        const x = (typeof n.position?.x === 'number') ? n.position.x : el.x_position;
        return { id: el.id, tab_order: el.tab_order ?? 0, x, y, rowBucket: Math.round(y / ROW_BUCKET) };
      })
      .filter(item => item.id != null && item.tab_order !== -1)
      .sort((a, b) => {
        if (a.rowBucket !== b.rowBucket) return a.rowBucket - b.rowBucket;
        if (a.x !== b.x) return a.x - b.x;
        return a.y - b.y;
      });
    const map = new Map<number, number>();
    sorted.forEach((item, idx) => map.set(item.id as number, idx + 1));
    applyTabOrderMap(map);
  }, [nodes, applyTabOrderMap]);

  // Memoized SplitButton menu model — must be stable across renders to avoid
  // PrimeReact TieredMenu's "Maximum update depth exceeded" loop.
  const tabOrderMenuModel = useMemo(() => ([
    {
      label: t.formdesignerpanel_taborder_from_selection,
      icon: 'pi pi-list',
      disabled: orderedSelection.length < 2,
      command: () => tabOrderFromSelection(),
    },
    {
      label: t.formdesignerpanel_taborder_auto,
      icon: 'pi pi-sort-numeric-down',
      command: () => tabOrderAuto(),
    },
    {
      label: t.formdesignerpanel_taborder_edit,
      icon: 'pi pi-pencil',
      command: () => setTabOrderModalVisible(true),
    },
  ]), [
    t.formdesignerpanel_taborder_from_selection,
    t.formdesignerpanel_taborder_auto,
    t.formdesignerpanel_taborder_edit,
    orderedSelection.length,
    tabOrderFromSelection,
    tabOrderAuto,
  ]);

  // Modal apply: activeIds get 1..N (in array order); excludedIds get -1 (no tab stop).
  const tabOrderApplyFromModal = useCallback((activeIds: number[], excludedIds: number[]) => {
    const map = new Map<number, number>();
    activeIds.forEach((id, idx) => map.set(id, idx + 1));
    excludedIds.forEach(id => map.set(id, -1));
    applyTabOrderMap(map);
    setTabOrderModalVisible(false);
  }, [applyTabOrderMap]);

  // Update window property and refresh the window frame node
  const updateWindowProperty = useCallback((property: string, value: number | string | null) => {
    if (!selectedWindow) return;

    // Update selectedWindow state
    const updatedWindow = { ...selectedWindow, [property]: value };
    setSelectedWindow(updatedWindow);

    // Also update in selectedFormSet.windows
    setSelectedFormSet(prev => {
      if (!prev?.windows) return prev;
      return {
        ...prev,
        windows: prev.windows.map(w =>
          w.id === selectedWindow.id ? { ...w, [property]: value } : w
        ),
      };
    });

    // Update the window frame node to reflect the change immediately
    setNodes(prevNodes => prevNodes.map(node => {
      if (node.type === 'windowFrame') {
        return {
          ...node,
          data: {
            ...node.data,
            defaultWidth: property === 'default_width' ? value : node.data.defaultWidth,
            defaultHeight: property === 'default_height' ? value : node.data.defaultHeight,
            minWidth: property === 'min_width' ? value : node.data.minWidth,
            minHeight: property === 'min_height' ? value : node.data.minHeight,
            windowName: property === 'display_name' ? value : node.data.windowName,
            windowColor: property === 'window_color' ? value : node.data.windowColor,
            textColor: property === 'text_color' ? value : node.data.textColor,
          },
        };
      }
      return node;
    }));

    setHasUnsavedChanges(true);
  }, [selectedWindow]);

  // Save window properties to backend
  const saveWindowProperties = useCallback(async () => {
    if (!selectedWindow) return;

    try {
      setSaving(true);
      let data: any;
      try {
        data = await apiClient.put(`/form-windows/${selectedWindow.id}`, {
          display_name: selectedWindow.display_name,
          min_width: selectedWindow.min_width,
          min_height: selectedWindow.min_height,
          default_width: selectedWindow.default_width,
          default_height: selectedWindow.default_height,
          background_color: selectedWindow.background_color,
          window_color: selectedWindow.window_color,
          text_color: selectedWindow.text_color,
        });
      } catch (err: any) {
        data = err?.response?.data || { success: false };
      }
      if (data.success) {
        showToast('success', t.formdesignerpanel950, t.formdesignerpanel950_2);
        // Note: hasUnsavedChanges is handled by saveElements, we keep it for element changes
      } else {
        showToast('error', t.messageError, data.error || t.formdesignerpanel953);
      }
    } catch (error) {
      console.error(t.formdesignerpanel956, error);
      showToast('error', t.messageError, t.formdesignerpanel957);
    } finally {
      setSaving(false);
    }
  }, [selectedWindow, showToast]);

  const addElement = useCallback((elementType: string) => {
    if (!selectedWindow) return;

    // Find free position
    const existingPositions = nodes.map(n => ({ x: n.position.x, y: n.position.y }));
    let x = 20;
    let y = 20;

    // Find a free spot
    while (existingPositions.some(p => Math.abs(p.x - x) < 100 && Math.abs(p.y - y) < 50)) {
      x += 120;
      if (x > 600) {
        x = 20;
        y += 60;
      }
    }

    const isContainer = elementType === 'container' || elementType === 'tab_container' || elementType === 'menu_container';

    const newElement: FormElement = {
      form_window_id: selectedWindow.id,
      element_type: elementType,
      x_position: x,
      y_position: y,
      width: isContainer ? 300 : 100,
      height: isContainer ? 200 : 40,
      sort_order: nodes.length,
      is_visible: true,
    };

    const newNode = {
      id: `new-${Date.now()}`,
      type: 'formElement',
      position: { x, y: y + 32 }, // Offset by header height
      data: {
        element: newElement,
        onSelect: setSelectedElement,
        isSelected: false,
        isReadOnly: false,
        defaultButtonColor: selectedFormSet?.default_button_color || '#3b82f6',
        defaultButtonTextColor: selectedFormSet?.default_button_text_color || '#ffffff',
        t,
      },
      style: {
        width: newElement.width,
        height: newElement.height,
      },
    };

    setNodes((prev: Node[]) => [...prev, newNode]);
    setHasUnsavedChanges(true);
    showToast('info', t.formdesignerpanel1014, `${elementType}${t.formdesignerpanel1014_2}`);
  }, [selectedWindow, selectedFormSet, nodes, setNodes, showToast]);

  const deleteSelectedElement = useCallback(() => {
    // Delete EVERY selected control, not just the representative one. Same
    // node-id-based selection as the property handlers, so it also covers
    // unsaved stash controls (which have no DB id yet).
    if (selectedNodeIds.size === 0) return;

    confirmDialog({
      group: 'form-designer',
      message: t.formdesignerpanel1021,
      header: t.formdesignerpanel1022,
      icon: 'pi pi-exclamation-triangle',
      acceptClassName: 'p-button-danger',
      accept: () => {
        setNodes(prev => prev.filter(n => !selectedNodeIds.has(n.id)));
        setSelectedElement(null);
        setSelectedNodeId(null);
        setOrderedSelection([]);
        setHasUnsavedChanges(true);
        showToast('info', t.formdesignerpanel1030, t.formdesignerpanel1030_2);
      },
    });
  }, [selectedNodeIds, setNodes, showToast, t]);

  // Keyboard shortcut: Delete key to remove selected element
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle Delete key when an element is selected
      if (event.key === 'Delete' && selectedElement && selectedNodeId) {
        // Don't trigger if user is typing in an input field
        const target = event.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
          return;
        }
        event.preventDefault();
        deleteSelectedElement();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedElement, selectedNodeId, deleteSelectedElement]);

  // Handle FormSet change with unsaved changes check
  const handleFormSetChange = useCallback((newFormSet: FormSet) => {
    if (hasUnsavedChanges) {
      confirmDialog({
        group: 'form-designer',
        message: t.formdesignerpanel1058,
        header: t.formdesignerpanel1059,
        icon: 'pi pi-exclamation-triangle',
        acceptLabel: t.formdesignerpanel1061,
        rejectLabel: t.formdesignerpanel1062,
        acceptClassName: 'p-button-success',
        rejectClassName: 'p-button-danger',
        accept: async () => {
          // Save first, then switch
          await saveElements();
          loadFormSetDetails(newFormSet.id);
        },
        reject: () => {
          // Discard changes and switch
          setHasUnsavedChanges(false);
          loadFormSetDetails(newFormSet.id);
        },
      });
    } else {
      loadFormSetDetails(newFormSet.id);
    }
  }, [hasUnsavedChanges, saveElements, loadFormSetDetails]);

  // Handle Window tab change with unsaved changes check
  const handleWindowChange = useCallback((newWindow: FormWindow) => {
    if (selectedWindow?.id === newWindow.id) return; // Same window, do nothing

    if (hasUnsavedChanges) {
      confirmDialog({
        group: 'form-designer',
        message: t.formdesignerpanel1087,
        header: t.formdesignerpanel1088,
        icon: 'pi pi-exclamation-triangle',
        acceptLabel: t.formdesignerpanel1090,
        rejectLabel: t.formdesignerpanel1091,
        acceptClassName: 'p-button-success',
        rejectClassName: 'p-button-danger',
        accept: async () => {
          // Save first, then switch
          await saveElements();
          setSelectedWindow(newWindow);
          setSelectedElement(null);
          setSelectedNodeId(null);
          localStorage.setItem(STORAGE_KEY_WINDOW, String(newWindow.id));
        },
        reject: () => {
          // Discard changes and switch
          setHasUnsavedChanges(false);
          setSelectedWindow(newWindow);
          setSelectedElement(null);
          setSelectedNodeId(null);
          localStorage.setItem(STORAGE_KEY_WINDOW, String(newWindow.id));
        },
      });
    } else {
      setSelectedWindow(newWindow);
      setSelectedElement(null);
      setSelectedNodeId(null);
      localStorage.setItem(STORAGE_KEY_WINDOW, String(newWindow.id));
    }
  }, [selectedWindow?.id, hasUnsavedChanges, saveElements, STORAGE_KEY_WINDOW]);

  // Handle "+" button click - check access and unsaved changes first
  const handleCreateFormSetClick = useCallback(async () => {
    // Helper function to proceed with creating
    const proceedWithCreate = async () => {
      // Refresh access status first
      try {
        setCheckingAccess(true);
        const data = await apiClient.get('/form-designer/access');
        setAccessStatus(data);

        if (data.has_access) {
          setCreateFormSetModalVisible(true);
        } else {
          setUnlockModalVisible(true);
        }
      } catch (error) {
        console.error(t.formdesignerpanel1142, error);
        setUnlockModalVisible(true);
      } finally {
        setCheckingAccess(false);
      }
    };

    // Check for unsaved changes first
    if (hasUnsavedChanges) {
      confirmDialog({
        group: 'form-designer',
        message: t.formdesignerpanel1152,
        header: t.formdesignerpanel1153,
        icon: 'pi pi-exclamation-triangle',
        acceptLabel: t.formdesignerpanel1155,
        rejectLabel: t.formdesignerpanel1156,
        acceptClassName: 'p-button-success',
        rejectClassName: 'p-button-danger',
        accept: async () => {
          // Save first, then proceed
          await saveElements();
          await proceedWithCreate();
        },
        reject: async () => {
          // Discard changes and proceed
          setHasUnsavedChanges(false);
          await proceedWithCreate();
        },
      });
    } else {
      await proceedWithCreate();
    }
  }, [hasUnsavedChanges, saveElements]);

  // ========== EFFECTS ==========

  // Check access on mount
  useEffect(() => {
    checkAccess();
  }, [checkAccess]);

  // Load FormSets when access granted
  useEffect(() => {
    if (accessStatus?.has_access) {
      loadFormSets();
    }
  }, [accessStatus?.has_access, loadFormSets]);

  // Convert elements to nodes ONLY when window elements data changes (load/save)
  // NOT when selection changes - that would reset all positions!
  useEffect(() => {
    if (!selectedWindow) {
      setNodes([]);
      return;
    }

    // Create the window frame node (visual boundary indicator)
    const windowFrameNode = {
      id: 'window-frame',
      type: 'windowFrame',
      position: { x: 0, y: 0 },
      draggable: false,
      selectable: false,
      data: {
        windowName: selectedWindow.display_name || selectedWindow.name,
        windowType: selectedWindow.window_type,
        windowTypeLabel: WINDOW_TYPE_LABELS[selectedWindow.window_type] || 'Fenster',
        minSizeLabel: t.formdesignerpanel389,
        defaultWidth: selectedWindow.default_width,
        defaultHeight: selectedWindow.default_height,
        minWidth: selectedWindow.min_width,
        minHeight: selectedWindow.min_height,
        windowColor: selectedWindow.window_color || selectedFormSet?.default_window_color || '#374151',
        textColor: selectedWindow.text_color || selectedFormSet?.default_text_color || '#f3f4f6',
        t, // ganzes Translation-Objekt übergeben
      },
      style: {
        zIndex: -1, // Behind all other nodes
      },
    };

    // Create element nodes - offset by header height (32px) so elements appear below the title bar
    const HEADER_OFFSET = 32;
    const defaultButtonColor = selectedFormSet?.default_button_color || '#3b82f6';
    const defaultButtonTextColor = selectedFormSet?.default_button_text_color || '#ffffff';
    const elementNodes = (selectedWindow.elements || []).map((element, index) => ({
      id: `element-${element.id || index}`,
      type: 'formElement',
      position: { x: element.x_position, y: element.y_position + HEADER_OFFSET },
      data: {
        element,
        onSelect: setSelectedElement,
        isSelected: false, // Selection is handled by React Flow's selected prop
        isReadOnly: false,
        defaultButtonColor,
        defaultButtonTextColor,
        t,
      },
      style: {
        width: element.width,
        height: element.height,
      },
    }));

    // Window frame first (behind), then elements
    setNodes([windowFrameNode, ...elementNodes]);
    // Reset unsaved changes flag and drag/resize tracking since we just loaded fresh data
    setHasUnsavedChanges(false);
    isDraggingRef.current = false;
    isResizingRef.current = false;
     
  }, [selectedWindow?.id, selectedWindow?.elements?.length, selectedFormSet?.default_window_color, selectedFormSet?.default_text_color, selectedFormSet?.default_button_color, selectedFormSet?.default_button_text_color]); // Only rebuild when window changes or element count changes or button colors change


  // ========== RENDER HELPERS ==========

  // Get current node position/dimensions (for properties panel)
  // This ensures we display the actual dragged position, not the old element data
  const selectedNodeData = useMemo(() => {
    if (!selectedNodeId) return null;
    const node = nodes.find(n => n.id === selectedNodeId);
    if (!node) return null;

    // Parse width/height - could be number or string like "100px"
    const parseSize = (value: unknown, fallback: number): number => {
      if (typeof value === 'number') return Math.round(value);
      if (typeof value === 'string') return parseInt(value, 10) || fallback;
      return fallback;
    };

    return {
      x: Math.round(node.position.x),
      y: Math.round(node.position.y - 32), // Subtract header offset for display
      width: parseSize(node.measured?.width ?? node.width ?? node.style?.width, selectedElement?.width ?? 100),
      height: parseSize(node.measured?.height ?? node.height ?? node.style?.height, selectedElement?.height ?? 40),
    };
  }, [selectedNodeId, nodes, selectedElement?.width, selectedElement?.height]);

  // Show loading spinner while checking access
  if (checkingAccess) {
    return (
      <TabContent>
        <div className="flex items-center justify-center h-full">
          <ProgressSpinner />
        </div>
      </TabContent>
    );
  }

  // ========== MAIN RENDER ==========

  return (
    <TabContent>
      <Toast ref={toastRef} />
      <ConfirmDialog group="form-designer" />

      {/* Main Layout */}
      <div className="flex flex-col h-full">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-4 py-2" style={{ backgroundColor: colors.bgSecondary, borderBottom: `1px solid ${colors.borderPrimary}` }}>
          {/* Left - FormSet Selection */}
          <div className="flex items-center gap-3">
            <Dropdown
              value={selectedFormSet}
              options={formSets}
              onChange={(e) => {
                if (e.value) {
                  handleFormSetChange(e.value);
                }
              }}
              optionLabel="name"
              dataKey="id"
              placeholder={t.formdesignerpanel1312}
              className="w-64"
              panelClassName="form-designer-dropdown-panel"
              loading={loadingFormSets}
              emptyMessage={t.formdesignerpanel1316}
            />
            <Button
              icon="pi pi-plus"
              className="p-button-success p-button-sm"
              tooltip={t.formdesignerpanel1321}
              onClick={handleCreateFormSetClick}
            />
            {selectedFormSet && (
              <Button
                icon="pi pi-pencil"
                className="p-button-secondary p-button-sm"
                tooltip={t.formdesignerpanel1328}
                onClick={() => setEditFormSetModalVisible(true)}
              />
            )}
          </div>

          {/* Center - Window Tabs */}
          {selectedFormSet?.windows && (
            <div className="flex items-center gap-1">
              {selectedFormSet.windows.map(window => (
                <Button
                  key={window.id}
                  label={WINDOW_TYPE_LABELS[window.window_type] || window.name}
                  className={`p-button-sm ${selectedWindow?.id === window.id ? 'p-button-primary' : 'p-button-secondary p-button-outlined'}`}
                  onClick={() => handleWindowChange(window)}
                />
              ))}
            </div>
          )}

          {/* Right - Actions */}
          <div className="flex items-center gap-2">
            {/* Subscription Status */}
            {accessStatus?.has_access && !accessStatus.is_patron && accessStatus.days_remaining !== undefined && (
              <span
                className="text-xs px-2 py-1 rounded"
                style={{
                  backgroundColor: accessStatus.days_remaining > 30 ? colors.successBg :
                    accessStatus.days_remaining > 7 ? colors.warningBg : colors.errorBg,
                  color: accessStatus.days_remaining > 30 ? colors.successText :
                    accessStatus.days_remaining > 7 ? colors.warningText : colors.errorText,
                  border: `1px solid ${accessStatus.days_remaining > 30 ? colors.successBorder :
                    accessStatus.days_remaining > 7 ? colors.warningBorder : colors.errorBorder}`
                }}
                title={`${t.formdesignerpanel1362}${accessStatus.expires_at ? new Date(accessStatus.expires_at).toLocaleDateString(currentLanguage) : t.formdesignerpanel1362_2}`}
              >
                <i className="pi pi-clock mr-1"></i>
                {accessStatus.days_remaining}{t.formdesignerpanel1365}
              </span>
            )}
            {accessStatus?.has_access && accessStatus.is_patron && (
              <span
                className="text-xs px-2 py-1 rounded"
                style={{ backgroundColor: colors.infoBg, color: colors.infoText, border: `1px solid ${colors.infoBorder}` }}
                title={t.formdesignerpanel1372}
              >
                <i className="pi pi-star mr-1"></i>
                {t.formdesignerpanel1375}
              </span>
            )}
            {hasUnsavedChanges && (
              <span className="text-sm" style={{ color: colors.warningText }}>
                <i className="pi pi-exclamation-circle mr-1"></i>
                {t.formdesignerpanel1381}
              </span>
            )}
            {selectedFormSet && (
              <Button
                icon="pi pi-th-large"
                className="p-button-help p-button-sm p-button-outlined"
                tooltip={t.formsetmanagementpanel_open_layout || 'Open in Layout Designer'}
                tooltipOptions={{ position: 'bottom' }}
                onClick={() => {
                  localStorage.setItem('form_layout_preselect', JSON.stringify({
                    formSetId: selectedFormSet.id,
                    windowType: selectedWindow?.window_type,
                    timestamp: Date.now(),
                  }));
                  onOpenPanel?.('form-layout-designer', {
                    title: `Form Layout: ${selectedFormSet.name}`,
                    forceNew: true,
                  });
                }}
              />
            )}
            {selectedWindow && (
              <>
                <Menu model={tabOrderMenuModel} popup ref={tabOrderMenuRef} id="tab-order-menu" />
                <Button
                  label={t.formdesignerpanel_taborder_menu}
                  icon="pi pi-sort-numeric-down"
                  className="p-button-info p-button-sm p-button-outlined"
                  onClick={(e) => tabOrderMenuRef.current?.toggle(e)}
                  aria-controls="tab-order-menu"
                  aria-haspopup
                />
              </>
            )}
            <Button
              icon="pi pi-save"
              label={t.formdesignerpanel1386}
              className="p-button-success p-button-sm"
              onClick={saveElements}
              loading={saving}
              disabled={!hasUnsavedChanges}
            />
            <Button
              icon={propertiesPanelVisible ? 'pi pi-chevron-right' : 'pi pi-chevron-left'}
              className="p-button-secondary p-button-sm"
              tooltip={propertiesPanelVisible ? t.formdesignerpanel1395 : t.formdesignerpanel1395_2}
              onClick={() => setPropertiesPanelVisible(!propertiesPanelVisible)}
            />
          </div>
        </div>

        {/* Content Area */}
        <div className="flex flex-1 overflow-hidden">
          {/* Element Toolbar (Left) */}
          <div className="w-48 overflow-y-auto" style={{ backgroundColor: colors.bgSecondary, borderRight: `1px solid ${colors.borderPrimary}` }}>
            <div className="p-2">
              <h4 className="text-xs font-semibold uppercase mb-2" style={{ color: colors.textMuted }}>{t.formdesignerpanel1407}</h4>
              <div className="space-y-1">
                {ELEMENT_TYPES.containers.map(elem => (
                  <button
                    key={elem.value}
                    className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded transition-colors element-toolbar-btn"
                    style={{ color: colors.textSecondary }}
                    onClick={() => addElement(elem.value)}
                    disabled={!selectedWindow}
                  >
                    <i className={`pi ${elem.icon}`}></i>
                    <span>{elem.label}</span>
                  </button>
                ))}
              </div>

              <h4 className="text-xs font-semibold uppercase mt-4 mb-2" style={{ color: colors.textMuted }}>{t.formdesignerpanel1423}</h4>
              <div className="space-y-1">
                {ELEMENT_TYPES.navigation.map(elem => (
                  <button
                    key={elem.value}
                    className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded transition-colors element-toolbar-btn"
                    style={{ color: colors.textSecondary }}
                    onClick={() => addElement(elem.value)}
                    disabled={!selectedWindow}
                  >
                    <i className={`pi ${elem.icon}`}></i>
                    <span>{elem.label}</span>
                  </button>
                ))}
              </div>

              <h4 className="text-xs font-semibold uppercase mt-4 mb-2" style={{ color: colors.textMuted }}>{t.formdesignerpanel1438}</h4>
              <div className="space-y-1">
                {ELEMENT_TYPES.actions.map(elem => (
                  <button
                    key={elem.value}
                    className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded transition-colors element-toolbar-btn"
                    style={{ color: colors.textSecondary }}
                    onClick={() => addElement(elem.value)}
                    disabled={!selectedWindow}
                  >
                    <i className={`pi ${elem.icon}`}></i>
                    <span>{elem.label}</span>
                  </button>
                ))}
              </div>

              <h4 className="text-xs font-semibold uppercase mt-4 mb-2" style={{ color: colors.textMuted }}>{t.formdesignerpanel1455}</h4>
              <div className="space-y-1">
                {ELEMENT_TYPES.layout.map(elem => (
                  <button
                    key={elem.value}
                    className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded transition-colors element-toolbar-btn"
                    style={{ color: colors.textSecondary }}
                    onClick={() => addElement(elem.value)}
                    disabled={!selectedWindow}
                  >
                    <i className={`pi ${elem.icon}`}></i>
                    <span>{elem.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Canvas (Center) */}
          <div className="flex-1 relative">
            {selectedWindow ? (
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={(changes) => {
                  // Clamp element positions and dimensions to window inner bounds
                  // Window = 800x600 total, Header = 32px, usable area = 800x568
                  const HEADER_HEIGHT = 32;
                  const maxW = selectedWindow?.default_width || 800;
                  const windowH = selectedWindow?.default_height || 600;

                  // Check if any position change is part of a resize (drag flag on position during resize)
                  const isResizeInProgress = changes.some((c) => c.type === 'dimensions');

                  const clampedChanges = changes.map((change) => {
                    if (change.type === 'position' && change.position && !change.id.startsWith('window-')) {
                      const node = nodes.find((n) => n.id === change.id);
                      const nodeW = (node?.style as Record<string, number>)?.width || node?.measured?.width || 100;
                      const nodeH = (node?.style as Record<string, number>)?.height || node?.measured?.height || 40;
                      return {
                        ...change,
                        position: {
                          x: Math.max(0, Math.min(change.position.x, maxW - nodeW)),
                          // During resize from top: allow y to change freely within window bounds
                          // During drag: keep above header
                          y: isResizeInProgress
                            ? Math.max(HEADER_HEIGHT, Math.min(change.position.y, windowH - 20))
                            : Math.max(HEADER_HEIGHT, Math.min(change.position.y, windowH - nodeH)),
                        },
                      };
                    }
                    if (change.type === 'dimensions' && change.dimensions && !change.id.startsWith('window-')) {
                      const node = nodes.find((n) => n.id === change.id);
                      const nodeX = node?.position?.x || 0;
                      const nodeY = node?.position?.y || HEADER_HEIGHT;
                      return {
                        ...change,
                        dimensions: {
                          width: Math.min(change.dimensions.width, maxW - nodeX),
                          height: Math.min(change.dimensions.height, windowH - nodeY),
                        },
                      };
                    }
                    return change;
                  });
                  onNodesChange(clampedChanges);
                  // Track drag/resize state to detect when operations complete
                  // On initial load: dragging/resizing are undefined (we ignore these)
                  // During mouse drag/resize: dragging/resizing are true, then false at end
                  // Keyboard moves: dragging is false with position (no true beforehand)
                  let hasRealChange = false;

                  for (const change of clampedChanges) {
                    if (change.type === 'position') {
                      const posChange = change as { type: 'position'; dragging?: boolean; position?: { x: number; y: number } };
                      if (posChange.dragging === true) {
                        // Mouse drag started - track it
                        isDraggingRef.current = true;
                      } else if (posChange.dragging === false) {
                        if (isDraggingRef.current) {
                          // Mouse drag ended - this is a real change
                          hasRealChange = true;
                          isDraggingRef.current = false;
                        } else if (posChange.position !== undefined) {
                          // Keyboard move: dragging=false with position, but no drag was tracked
                          // (On initial load, dragging is undefined, not false)
                          hasRealChange = true;
                        }
                      }
                    }
                    if (change.type === 'dimensions') {
                      const dimChange = change as { type: 'dimensions'; resizing?: boolean; dimensions?: { width: number; height: number } };
                      if (dimChange.resizing === true) {
                        // Resize started - track it
                        isResizingRef.current = true;
                      } else if (dimChange.resizing === false && isResizingRef.current) {
                        // Resize ended - this is a real change
                        hasRealChange = true;
                        isResizingRef.current = false;
                      }
                    }
                  }

                  if (hasRealChange) {
                    setHasUnsavedChanges(true);
                  }
                }}
                onEdgesChange={onEdgesChange}
                nodeTypes={nodeTypes}
                multiSelectionKeyCode={MULTI_SELECTION_KEYS}
                // Marquee/lasso: left-drag on empty pane selects everything
                // it touches. Pan moves to middle/right mouse to free the
                // left button for selection. SelectionMode.Partial counts
                // a node as selected the moment the rectangle touches its
                // bounding box (vs Full = must be entirely inside) — much
                // less frustrating when picking a row of fields where the
                // last column extends past where you stopped dragging.
                selectionOnDrag
                selectionMode={SelectionMode.Partial}
                panOnDrag={PAN_ON_DRAG_BUTTONS}
                onPaneClick={() => {
                  setOrderedSelection([]);
                }}
                onSelectionChange={({ nodes: selectedNodes }) => {
                  // Filter to only formElement nodes (exclude window-frame)
                  const elementNodes = selectedNodes.filter(n => n.type === 'formElement');

                  // Sync orderedSelection from the authoritative ReactFlow selection.
                  // Keep elements already in our list (preserving click order),
                  // append newly-selected elements at the end, drop removed ones.
                  // Track by ReactFlow node id — present on every node, saved or
                  // not — so unsaved stash controls join the ordered selection.
                  const currentlySelectedIds = elementNodes.map(n => n.id);
                  // Compute the new order OUTSIDE the setter so the rest of this
                  // handler can use it to find the LAST-clicked element — that's
                  // the one that should drive the properties panel (matches user
                  // intuition: "the one I just clicked is the one I'm editing").
                  const prevOrdered = orderedSelection;
                  const stillSelected = prevOrdered.filter(id => currentlySelectedIds.includes(id));
                  const newlyAdded = currentlySelectedIds.filter(id => !prevOrdered.includes(id));
                  const nextOrdered = [...stillSelected, ...newlyAdded];
                  setOrderedSelection(prev => {
                    // Bail out if nothing actually changed — returning a new
                    // array reference here would re-render and feed ReactFlow
                    // a new onSelectionChange ref, triggering an update loop.
                    if (nextOrdered.length === prev.length && nextOrdered.every((id, i) => id === prev[i])) {
                      return prev;
                    }
                    return nextOrdered;
                  });

                  if (elementNodes.length > 0) {
                    // Track the LAST element in click order — not elementNodes[0].
                    // ReactFlow's selectedNodes array is in internal node order
                    // (not click order), so [0] would be unpredictable: usually
                    // the second-to-last clicked, occasionally the first dropped.
                    // That's why the user saw "manchmal vorletzte". orderedSelection
                    // has authoritative click order; the tail is the most recent.
                    const lastId = nextOrdered[nextOrdered.length - 1];
                    const lastNode = elementNodes.find(n => n.id === lastId) ?? elementNodes[0];
                    if (lastNode.id !== selectedNodeId) {
                      setSelectedElement(lastNode.data.element);
                      setSelectedNodeId(lastNode.id);
                    }
                  } else {
                    setSelectedElement(null);
                    setSelectedNodeId(null);
                  }
                }}
                fitView
                style={{
                  backgroundColor: selectedWindow?.background_color || selectedFormSet?.default_background_color || '#1f2937',
                }}
                minZoom={0.25}
                maxZoom={2}
                snapToGrid={snapToGrid}
                snapGrid={[gridSize, gridSize]}
              >
                <Background
                  variant={snapToGrid ? BackgroundVariant.Lines : BackgroundVariant.Dots}
                  gap={gridSize}
                  size={snapToGrid ? 1 : 1}
                  color={snapToGrid ? '#4b5563' : '#374151'}
                />
                <Controls />
                <MiniMap
                  nodeColor={(node) => {
                    // Window frame node has different data structure
                    if (node.type === 'windowFrame') return '#6366f1';
                    const element = (node.data as { element?: FormElement })?.element;
                    return getElementColor(element?.element_type || 'unknown');
                  }}
                  maskColor="rgba(0,0,0,0.7)"
                />
              </ReactFlow>
            ) : (
              <div className="flex items-center justify-center h-full" style={{ color: colors.textMuted }}>
                <div className="text-center">
                  <i className="pi pi-window-maximize text-4xl mb-2"></i>
                  <p>{t.formdesignerpanel1559}</p>
                </div>
              </div>
            )}
          </div>

          {/* Properties Panel (Right) */}
          {propertiesPanelVisible && (
            <div className="w-72 overflow-y-auto" style={{ backgroundColor: colors.bgSecondary, borderLeft: `1px solid ${colors.borderPrimary}` }}>
              <div className="p-3">
                {selectedElement ? (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold" style={{ color: colors.textPrimary }}>{t.formdesignerpanel1581}</h4>
                      <Button
                        icon="pi pi-trash"
                        className="p-button-danger p-button-sm p-button-text"
                        tooltip={t.formdesignerpanel1585}
                        onClick={deleteSelectedElement}
                      />
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs mb-1" style={{ color: colors.textMuted }}>{t.formdesignerpanel1593}</label>
                        <InputText
                          value={selectedElement.element_type}
                          disabled
                          className="w-full p-inputtext-sm"
                        />
                      </div>

                      {selectedElement.element_type.startsWith('button_') && (
                        <>
                          <div>
                            <label className="block text-xs mb-1" style={{ color: colors.textMuted }}>
                              {t.formdesignerpanel1603} {selectedProject?.enabled_languages && selectedProject.enabled_languages.length > 0 ? `(Default)` : ''}
                            </label>
                            <InputText
                              value={selectedElement.button_label || ''}
                              onChange={(e) => {
                                const newElement = { ...selectedElement, button_label: e.target.value };
                                setSelectedElement(newElement);
                                if (selectedNodeId) {
                                  setNodes(prev => prev.map(n =>
                                    n.id === selectedNodeId
                                      ? { ...n, data: { ...n.data, element: newElement } }
                                      : n
                                  ));
                                }
                                setHasUnsavedChanges(true);
                              }}
                              className="w-full p-inputtext-sm"
                            />
                          </div>
                          {/* Per-language button labels */}
                          {selectedProject?.enabled_languages && selectedProject.enabled_languages.length > 0 && (
                            <div>
                              <label className="block text-xs mb-1" style={{ color: colors.textMuted }}>Label per Language</label>
                              {selectedProject.enabled_languages.map((langCode: string) => {
                                const labels = (selectedElement.custom_style?.button_labels || {}) as Record<string, string>;
                                return (
                                  <div key={langCode} className="flex items-center gap-2 mb-1">
                                    <span style={{ fontSize: 10, width: 24, textAlign: 'right', color: colors.textMuted, fontWeight: 600 }}>{langCode.toUpperCase()}</span>
                                    <InputText
                                      value={labels[langCode] || ''}
                                      onChange={(e) => {
                                        const newLabels = { ...labels };
                                        if (e.target.value) newLabels[langCode] = e.target.value;
                                        else delete newLabels[langCode];
                                        const newStyle = { ...(selectedElement.custom_style || {}), button_labels: Object.keys(newLabels).length > 0 ? newLabels : undefined };
                                        const newElement = { ...selectedElement, custom_style: newStyle };
                                        setSelectedElement(newElement);
                                        if (selectedNodeId) {
                                          setNodes(prev => prev.map(n =>
                                            n.id === selectedNodeId ? { ...n, data: { ...n.data, element: newElement } } : n
                                          ));
                                        }
                                        setHasUnsavedChanges(true);
                                      }}
                                      placeholder={selectedElement.button_label || ''}
                                      className="flex-1 p-inputtext-sm"
                                      style={{ fontSize: 11 }}
                                    />
                                  </div>
                                );
                              })}
                            </div>
                          )}
                          <div>
                            <label className="block text-xs mb-1" style={{ color: colors.textMuted }}>Icon (pi-xxx)</label>
                            <InputText
                              value={selectedElement.button_icon || ''}
                              onChange={(e) => {
                                const newElement = { ...selectedElement, button_icon: e.target.value };
                                setSelectedElement(newElement);
                                if (selectedNodeId) {
                                  setNodes(prev => prev.map(n =>
                                    n.id === selectedNodeId
                                      ? { ...n, data: { ...n.data, element: newElement } }
                                      : n
                                  ));
                                }
                                setHasUnsavedChanges(true);
                              }}
                              className="w-full p-inputtext-sm"
                              placeholder={DEFAULT_ICONS[selectedElement.element_type] || 'pi-cog'}
                            />
                          </div>
                          {/* Action — only for user-defined buttons. Editable
                              combobox: pick a preset or type any free value. */}
                          {selectedElement.element_type === 'button_custom' && (
                            <div>
                              <label className="block text-xs mb-1" style={{ color: colors.textMuted }}>Action</label>
                              <AutoComplete
                                value={selectedElement.button_action || ''}
                                suggestions={actionSuggestions}
                                completeMethod={(e) =>
                                  setActionSuggestions(
                                    BUTTON_ACTION_PRESETS.filter(a => a.toLowerCase().includes(e.query.toLowerCase()))
                                  )
                                }
                                onChange={(e) => {
                                  const newElement = { ...selectedElement, button_action: (e.value as string) || undefined };
                                  setSelectedElement(newElement);
                                  if (selectedNodeId) {
                                    setNodes(prev => prev.map(n =>
                                      n.id === selectedNodeId
                                        ? { ...n, data: { ...n.data, element: newElement } }
                                        : n
                                    ));
                                  }
                                  setHasUnsavedChanges(true);
                                }}
                                dropdown
                                forceSelection={false}
                                placeholder="z.B. print, bulk_modify, print-form1 …"
                                className="w-full p-inputtext-sm"
                                inputClassName="w-full"
                              />
                              <div className="text-xs mt-1" style={{ color: colors.textMuted }}>
                                Frei wählbar — im Template via {'{:layoutsingle.action:}'}
                              </div>
                            </div>
                          )}
                          {/* Button-Farben - kompaktes Layout mit Reset */}
                          <div className="flex gap-3">
                            <div>
                              <label className="block text-xs mb-1" style={{ color: colors.textMuted }}>{t.formdesignerpanel1645}</label>
                              <div className="flex gap-1 items-center">
                                <input
                                  type="color"
                                  value={selectedElement.button_background_color || selectedFormSet?.default_button_color || '#3b82f6'}
                                  onChange={(e) => {
                                    const newElement = { ...selectedElement, button_background_color: e.target.value };
                                    setSelectedElement(newElement);
                                    if (selectedNodeId) {
                                      setNodes(prev => prev.map(n =>
                                        n.id === selectedNodeId
                                          ? { ...n, data: { ...n.data, element: newElement } }
                                          : n
                                      ));
                                    }
                                    setHasUnsavedChanges(true);
                                  }}
                                  className="w-7 h-7 rounded cursor-pointer border border-gray-600"
                                />
                                <InputText
                                  value={selectedElement.button_background_color || ''}
                                  onChange={(e) => {
                                    const newElement = { ...selectedElement, button_background_color: e.target.value || undefined };
                                    setSelectedElement(newElement);
                                    if (selectedNodeId) {
                                      setNodes(prev => prev.map(n =>
                                        n.id === selectedNodeId
                                          ? { ...n, data: { ...n.data, element: newElement } }
                                          : n
                                      ));
                                    }
                                    setHasUnsavedChanges(true);
                                  }}
                                  className="p-inputtext-sm"
                                  style={{ width: '60px' }}
                                  maxLength={7}
                                  placeholder={t.formdesignerpanel1680}
                                />
                                {selectedElement.button_background_color && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const newElement = { ...selectedElement, button_background_color: undefined };
                                      setSelectedElement(newElement);
                                      if (selectedNodeId) {
                                        setNodes(prev => prev.map(n =>
                                          n.id === selectedNodeId
                                            ? { ...n, data: { ...n.data, element: newElement } }
                                            : n
                                        ));
                                      }
                                      setHasUnsavedChanges(true);
                                    }}
                                    className="w-5 h-5 flex items-center justify-center rounded color-reset-btn"
                                    style={{ color: colors.textMuted }}
                                    title={t.formdesignerpanel1699}
                                  >
                                    <i className="pi pi-times text-xs"></i>
                                  </button>
                                )}
                              </div>
                            </div>
                            <div>
                              <label className="block text-xs mb-1" style={{ color: colors.textMuted }}>{t.formdesignerpanel1708}</label>
                              <div className="flex gap-1 items-center">
                                <input
                                  type="color"
                                  value={selectedElement.button_text_color || selectedFormSet?.default_button_text_color || '#ffffff'}
                                  onChange={(e) => {
                                    const newElement = { ...selectedElement, button_text_color: e.target.value };
                                    setSelectedElement(newElement);
                                    if (selectedNodeId) {
                                      setNodes(prev => prev.map(n =>
                                        n.id === selectedNodeId
                                          ? { ...n, data: { ...n.data, element: newElement } }
                                          : n
                                      ));
                                    }
                                    setHasUnsavedChanges(true);
                                  }}
                                  className="w-7 h-7 rounded cursor-pointer border border-gray-600"
                                />
                                <InputText
                                  value={selectedElement.button_text_color || ''}
                                  onChange={(e) => {
                                    const newElement = { ...selectedElement, button_text_color: e.target.value || undefined };
                                    setSelectedElement(newElement);
                                    if (selectedNodeId) {
                                      setNodes(prev => prev.map(n =>
                                        n.id === selectedNodeId
                                          ? { ...n, data: { ...n.data, element: newElement } }
                                          : n
                                      ));
                                    }
                                    setHasUnsavedChanges(true);
                                  }}
                                  className="p-inputtext-sm"
                                  style={{ width: '60px' }}
                                  maxLength={7}
                                  placeholder={t.formdesignerpanel1744}
                                />
                                {selectedElement.button_text_color && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const newElement = { ...selectedElement, button_text_color: undefined };
                                      setSelectedElement(newElement);
                                      if (selectedNodeId) {
                                        setNodes(prev => prev.map(n =>
                                          n.id === selectedNodeId
                                            ? { ...n, data: { ...n.data, element: newElement } }
                                            : n
                                        ));
                                      }
                                      setHasUnsavedChanges(true);
                                    }}
                                    className="w-5 h-5 flex items-center justify-center rounded color-reset-btn"
                                    style={{ color: colors.textMuted }}
                                    title={t.formdesignerpanel1762}
                                  >
                                    <i className="pi pi-times text-xs"></i>
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </>
                      )}

                      {(selectedElement.element_type === 'container' || selectedElement.element_type === 'tab_container') && (
                        <div>
                          <label className="block text-xs mb-1" style={{ color: colors.textMuted }}>
                            {selectedElement.element_type === 'tab_container'
                              ? (t.formdesignerpanel_max_controls_per_tab || 'Max. Controls pro Tab')
                              : selectedWindow?.window_type === 'data_table'
                                ? (t.formdesignerpanel_max_columns || 'Max. Anzahl Spalten')
                                : t.formdesignerpanel1776}
                          </label>
                          <InputNumber
                            value={selectedElement.max_fields || null}
                            onChange={(e) => {
                              const newElement = { ...selectedElement, max_fields: e.value || undefined };
                              setSelectedElement(newElement);
                              if (selectedNodeId) {
                                setNodes(prev => prev.map(n =>
                                  n.id === selectedNodeId
                                    ? { ...n, data: { ...n.data, element: newElement } }
                                    : n
                                ));
                              }
                              setHasUnsavedChanges(true);
                            }}
                            className="w-full"
                            min={0}
                            placeholder={selectedElement.element_type === 'tab_container'
                              ? (t.formdesignerpanel_max_controls_per_tab_placeholder || 'z.B. 8 (wechselt zum nächsten Tab)')
                              : selectedWindow?.window_type === 'data_table'
                                ? (t.formdesignerpanel_all_columns || 'Alle Spalten')
                                : t.formdesignerpanel1793}
                          />
                        </div>
                      )}

                      {/* Container-Eigenschaften: Gap, Columns, Control Height */}
                      {['container', 'menu_container', 'tab_container'].includes(selectedElement.element_type) && (
                        <>
                          {/* Gap - hidden for data_table */}
                          {selectedWindow?.window_type !== 'data_table' && (
                            <div>
                              <label className="block text-xs mb-1" style={{ color: colors.textMuted }}>{t.formdesignerpanel1801}</label>
                              <InputNumber
                                value={selectedElement.container_gap ?? 8}
                                onChange={(e) => {
                                  const newElement = { ...selectedElement, container_gap: e.value ?? 8 };
                                  setSelectedElement(newElement);
                                  if (selectedNodeId) {
                                    setNodes(prev => prev.map(n =>
                                      n.id === selectedNodeId
                                        ? { ...n, data: { ...n.data, element: newElement } }
                                        : n
                                    ));
                                  }
                                  setHasUnsavedChanges(true);
                                }}
                                className="w-full"
                                min={0}
                                max={50}
                                suffix=" px"
                              />
                            </div>
                          )}
                          {/* Columns - hidden for data_table */}
                          {selectedWindow?.window_type !== 'data_table' && (
                            <div>
                              <label className="block text-xs mb-1" style={{ color: colors.textMuted }}>
                                {selectedElement.element_type === 'tab_container'
                                  ? (t.formdesignerpanel_max_columns || 'Max. Anzahl Spalten')
                                  : t.formdesignerpanel1823}
                              </label>
                              <select
                                value={selectedElement.container_columns ?? 1}
                                onChange={(e) => {
                                  const newElement = { ...selectedElement, container_columns: parseInt(e.target.value) };
                                  setSelectedElement(newElement);
                                  if (selectedNodeId) {
                                    setNodes(prev => prev.map(n =>
                                      n.id === selectedNodeId
                                        ? { ...n, data: { ...n.data, element: newElement } }
                                        : n
                                    ));
                                  }
                                  setHasUnsavedChanges(true);
                                }}
                                className="w-full p-2 rounded text-sm focus:outline-none"
                                style={{ backgroundColor: colors.bgTertiary, borderColor: colors.borderPrimary, color: colors.textPrimary, border: `1px solid ${colors.borderPrimary}` }}
                              >
                                <option value={1}>1 Spalte</option>
                                <option value={2}>2 Spalten</option>
                                <option value={3}>3 Spalten</option>
                              </select>
                            </div>
                          )}
                          <div>
                            <label className="block text-xs mb-1" style={{ color: colors.textMuted }}>
                              {selectedWindow?.window_type === 'data_table'
                                ? (t.formdesignerpanel_row_height || 'Standard Zeilenhoehe (px)')
                                : (t.formdesignerpanel_default_control_height || 'Standard Feldhoehe (px)')}
                            </label>
                            <InputNumber
                              value={selectedElement.default_control_height ?? 56}
                              onValueChange={(e) => {
                                const newElement = { ...selectedElement, default_control_height: e.value ?? 56 };
                                setSelectedElement(newElement);
                                if (selectedNodeId) {
                                  setNodes(prev => prev.map(n =>
                                    n.id === selectedNodeId
                                      ? { ...n, data: { ...n.data, element: newElement } }
                                      : n
                                  ));
                                }
                                setHasUnsavedChanges(true);
                              }}
                              className="w-full"
                              min={10}
                              max={200}
                              suffix=" px"
                            />
                          </div>
                        </>
                      )}

                      {selectedElement.element_type === 'menu_container' && (
                        <div>
                          <label className="block text-xs mb-1" style={{ color: colors.textMuted }}>{t.formdesignerpanel1851}</label>
                          <select
                            value={selectedElement.container_orientation || 'vertical'}
                            onChange={(e) => {
                              const newElement = { ...selectedElement, container_orientation: e.target.value as 'vertical' | 'horizontal' };
                              setSelectedElement(newElement);
                              if (selectedNodeId) {
                                setNodes(prev => prev.map(n =>
                                  n.id === selectedNodeId
                                    ? { ...n, data: { ...n.data, element: newElement } }
                                    : n
                                ));
                              }
                              setHasUnsavedChanges(true);
                            }}
                            className="w-full p-2 rounded text-sm focus:outline-none"
                              style={{ backgroundColor: colors.bgTertiary, borderColor: colors.borderPrimary, color: colors.textPrimary, border: `1px solid ${colors.borderPrimary}` }}
                          >
                            <option value="vertical">{t.formdesignerpanel1869}</option>
                            <option value="horizontal">{t.formdesignerpanel1870}</option>
                          </select>
                        </div>
                      )}

                      {/* tab_panel.tab_label editor lives in the Layout editor now,
                          not here. Template-level tab_container has no per-tab
                          metadata — tabs are generated dynamically by auto-place
                          on the Layout side, and labels are then set there
                          (per language) once the tabs actually exist. */}

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs mb-1" style={{ color: colors.textMuted }}>X</label>
                          <InputNumber
                            value={selectedNodeData?.x ?? selectedElement.x_position}
                            onValueChange={(e) => {
                              // X/Y keep snap-to-grid for typed values: position
                              // alignment is the usual intent, and absolute pixel
                              // precision here matters less than for W/H. Users who
                              // need exact pixel positions can disable snap in
                              // project settings.
                              const newX = snapToGrid
                                ? Math.round((e.value ?? 0) / gridSize) * gridSize
                                : e.value ?? 0;
                              applyToSelected(
                                { x_position: newX },
                                (n) => ({ position: { ...n.position, x: newX } }),
                              );
                            }}
                            useGrouping={false}
                            inputStyle={{ width: '110px' }}
                            min={0}
                            step={snapToGrid ? gridSize : 1}
                          />
                        </div>
                        <div>
                          <label className="block text-xs mb-1" style={{ color: colors.textMuted }}>Y</label>
                          <InputNumber
                            value={selectedNodeData?.y ?? selectedElement.y_position}
                            onValueChange={(e) => {
                              const newY = snapToGrid
                                ? Math.round((e.value ?? 0) / gridSize) * gridSize
                                : e.value ?? 0;
                              // ReactFlow's node y is offset by +32 (window header
                              // height) — preserve that offset in the nodePatch.
                              applyToSelected(
                                { y_position: newY },
                                (n) => ({ position: { ...n.position, y: newY + 32 } }),
                              );
                            }}
                            useGrouping={false}
                            inputStyle={{ width: '110px' }}
                            min={0}
                            step={snapToGrid ? gridSize : 1}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs mb-1" style={{ color: colors.textMuted }}>{t.formdesignerpanel1950}</label>
                          <InputNumber
                            value={selectedNodeData?.width ?? selectedElement.width}
                            onValueChange={(e) => {
                              // Pixel-precise: a typed value bypasses snap-to-grid.
                              // Snap is for canvas drag/resize; when the user
                              // explicitly types "40" in the property panel they
                              // mean 40, not the nearest grid multiple. Previously
                              // grid=21 (or any non-divisor of 40) would round 40 → 42.
                              const newWidth = e.value ?? 40;
                              applyToSelected(
                                { width: newWidth },
                                (n) => ({ width: newWidth, style: { ...n.style, width: newWidth } }),
                              );
                            }}
                            useGrouping={false}
                            inputStyle={{ width: '110px' }}
                            min={20}
                            step={1}
                          />
                        </div>
                        <div>
                          <label className="block text-xs mb-1" style={{ color: colors.textMuted }}>{t.formdesignerpanel1979}</label>
                          <InputNumber
                            value={selectedNodeData?.height ?? selectedElement.height}
                            onValueChange={(e) => {
                              const newHeight = e.value ?? 20;
                              applyToSelected(
                                { height: newHeight },
                                (n) => ({ height: newHeight, style: { ...n.style, height: newHeight } }),
                              );
                            }}
                            useGrouping={false}
                            inputStyle={{ width: '110px' }}
                            min={10}
                            step={1}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs mb-1" style={{ color: colors.textMuted }}>{t.formdesignerpanel_taborder}</label>
                        <InputNumber
                          value={selectedElement.tab_order ?? 0}
                          onValueChange={(e) => {
                            const newTabOrder = Math.max(-1, Math.min(9999, e.value ?? 0));
                            const newElement = { ...selectedElement, tab_order: newTabOrder };
                            setSelectedElement(newElement);
                            if (selectedNodeId) {
                              setNodes(prev => prev.map(n =>
                                n.id === selectedNodeId
                                  ? { ...n, data: { ...n.data, element: newElement } }
                                  : n
                              ));
                            }
                            setHasUnsavedChanges(true);
                          }}
                          useGrouping={false}
                          inputStyle={{ width: '110px' }}
                          min={-1}
                          max={9999}
                          step={1}
                        />
                      </div>

                      {/* Anchor — multi-select aware (applies to all in orderedSelection) */}
                      <AnchorSection
                        values={{
                          anchor_right: selectedElement.anchor_right ?? null,
                          anchor_bottom: selectedElement.anchor_bottom ?? null,
                          anchor_width: selectedElement.anchor_width ?? null,
                          anchor_height: selectedElement.anchor_height ?? null,
                        }}
                        onChange={(updates) => {
                          applyToSelected(updates as Partial<FormElement>);
                        }}
                        colors={colors}
                      />
                    </div>
                  </div>
                ) : selectedWindow ? (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold" style={{ color: colors.textPrimary }}>{t.formdesignerpanel2013}</h4>
                      <Button
                        icon="pi pi-save"
                        className="p-button-success p-button-sm p-button-text"
                        tooltip={t.formdesignerpanel2017}
                        onClick={saveWindowProperties}
                        loading={saving}
                      />
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs mb-1" style={{ color: colors.textMuted }}>{t.formdesignerpanel2024}</label>
                        <InputText
                          value={WINDOW_TYPE_LABELS[selectedWindow.window_type]}
                          disabled
                          className="w-full p-inputtext-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs mb-1" style={{ color: colors.textMuted }}>{t.formdesignerpanel2032}</label>
                        <InputText
                          value={selectedWindow.display_name || ''}
                          onChange={(e) => updateWindowProperty('display_name', e.target.value || null)}
                          className="w-full p-inputtext-sm"
                          placeholder={WINDOW_TYPE_LABELS[selectedWindow.window_type]}
                        />
                      </div>

                      {/* Standard Window Sizes (paper/margin block removed —
                          legacy report_single/report_list FormWindow types are
                          gone; reports now live under ReportPattern). */}
                      <>
                          <div className="border-t pt-3" style={{ borderColor: colors.borderPrimary }}>
                            <h5 className="text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>{t.formdesignerpanel2044}</h5>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-xs mb-1" style={{ color: colors.textMuted }}>{t.formdesignerpanel2047}</label>
                                <InputNumber
                                  value={selectedWindow.default_width}
                                  onValueChange={(e) => updateWindowProperty('default_width', e.value ?? 800)}
                                  useGrouping={false}
                                  inputStyle={{ width: '110px' }}
                                  min={100}
                                  step={10}
                                />
                              </div>
                              <div>
                                <label className="block text-xs mb-1" style={{ color: colors.textMuted }}>Höhe</label>
                                <InputNumber
                                  value={selectedWindow.default_height}
                                  onValueChange={(e) => updateWindowProperty('default_height', e.value ?? 600)}
                                  useGrouping={false}
                                  inputStyle={{ width: '110px' }}
                                  min={100}
                                  step={10}
                                />
                              </div>
                            </div>
                          </div>

                          <div>
                            <h5 className="text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>{t.formdesignerpanel2069}</h5>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-xs mb-1" style={{ color: colors.textMuted }}>{t.formdesignerpanel2072}</label>
                                <InputNumber
                                  value={selectedWindow.min_width}
                                  onValueChange={(e) => updateWindowProperty('min_width', e.value ?? 400)}
                                  useGrouping={false}
                                  inputStyle={{ width: '110px' }}
                                  min={100}
                                  step={10}
                                />
                              </div>
                              <div>
                                <label className="block text-xs mb-1" style={{ color: colors.textMuted }}>{t.formdesignerpanel2082}</label>
                                <InputNumber
                                  value={selectedWindow.min_height}
                                  onValueChange={(e) => updateWindowProperty('min_height', e.value ?? 300)}
                                  useGrouping={false}
                                  inputStyle={{ width: '110px' }}
                                  min={100}
                                  step={10}
                                />
                              </div>
                            </div>
                          </div>
                      </>

                      {/* Window Colors */}
                      <div className="border-t pt-3 mt-3" style={{ borderColor: colors.borderPrimary }}>
                        <h5 className="text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>{t.formdesignerpanel2096}</h5>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-xs" style={{ color: colors.textMuted }}>{t.formdesignerpanel2099}</label>
                            <div className="flex items-center gap-2">
                              <input
                                type="color"
                                value={selectedWindow.background_color || selectedFormSet?.default_background_color || '#1f2937'}
                                onChange={(e) => updateWindowProperty('background_color', e.target.value)}
                                className="w-6 h-6 rounded border border-gray-600 cursor-pointer bg-transparent"
                                style={{ padding: 0 }}
                              />
                              <InputText
                                value={selectedWindow.background_color || ''}
                                onChange={(e) => updateWindowProperty('background_color', e.target.value || null)}
                                placeholder={selectedFormSet?.default_background_color || '#1f2937'}
                                className="w-20 p-inputtext-sm"
                              />
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <label className="text-xs" style={{ color: colors.textMuted }}>{t.formdesignerpanel2117}</label>
                            <div className="flex items-center gap-2">
                              <input
                                type="color"
                                value={selectedWindow.window_color || selectedFormSet?.default_window_color || '#374151'}
                                onChange={(e) => updateWindowProperty('window_color', e.target.value)}
                                className="w-6 h-6 rounded border border-gray-600 cursor-pointer bg-transparent"
                                style={{ padding: 0 }}
                              />
                              <InputText
                                value={selectedWindow.window_color || ''}
                                onChange={(e) => updateWindowProperty('window_color', e.target.value || null)}
                                placeholder={selectedFormSet?.default_window_color || '#374151'}
                                className="w-20 p-inputtext-sm"
                              />
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <label className="text-xs" style={{ color: colors.textMuted }}>{t.formdesignerpanel2135}</label>
                            <div className="flex items-center gap-2">
                              <input
                                type="color"
                                value={selectedWindow.text_color || selectedFormSet?.default_text_color || '#f3f4f6'}
                                onChange={(e) => updateWindowProperty('text_color', e.target.value)}
                                className="w-6 h-6 rounded border border-gray-600 cursor-pointer bg-transparent"
                                style={{ padding: 0 }}
                              />
                              <InputText
                                value={selectedWindow.text_color || ''}
                                onChange={(e) => updateWindowProperty('text_color', e.target.value || null)}
                                placeholder={selectedFormSet?.default_text_color || '#f3f4f6'}
                                className="w-20 p-inputtext-sm"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* FormSet Default Colors */}
                    {selectedFormSet && (
                      <div className="border-t border-gray-700 pt-3 mt-4">
                        <h5 className="text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>{t.formdesignerpanel2159}</h5>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-xs" style={{ color: colors.textMuted }}>{t.formdesignerpanel2162}</label>
                            <div className="flex items-center gap-2">
                              <div
                                className="w-6 h-6 rounded border border-gray-600"
                                style={{ backgroundColor: selectedFormSet.default_background_color }}
                              ></div>
                              <span className="text-xs" style={{ color: colors.textMuted }}>{selectedFormSet.default_background_color}</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <label className="text-xs" style={{ color: colors.textMuted }}>{t.formdesignerpanel2172}</label>
                            <div className="flex items-center gap-2">
                              <div
                                className="w-6 h-6 rounded border border-gray-600"
                                style={{ backgroundColor: selectedFormSet.default_window_color }}
                              ></div>
                              <span className="text-xs" style={{ color: colors.textMuted }}>{selectedFormSet.default_window_color}</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <label className="text-xs" style={{ color: colors.textMuted }}>{t.formdesignerpanel2182}</label>
                            <div className="flex items-center gap-2">
                              <div
                                className="w-6 h-6 rounded border border-gray-600"
                                style={{ backgroundColor: selectedFormSet.default_text_color }}
                              ></div>
                              <span className="text-xs" style={{ color: colors.textMuted }}>{selectedFormSet.default_text_color}</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <label className="text-xs" style={{ color: colors.textMuted }}>{t.formdesignerpanel2192}</label>
                            <div className="flex items-center gap-2">
                              <div
                                className="w-6 h-6 rounded border border-gray-600"
                                style={{ backgroundColor: selectedFormSet.default_button_color }}
                              ></div>
                              <span className="text-xs" style={{ color: colors.textMuted }}>{selectedFormSet.default_button_color}</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <label className="text-xs" style={{ color: colors.textMuted }}>{t.formdesignerpanel2202}</label>
                            <div className="flex items-center gap-2">
                              <div
                                className="w-6 h-6 rounded border border-gray-600"
                                style={{ backgroundColor: selectedFormSet.default_button_text_color }}
                              ></div>
                              <span className="text-xs" style={{ color: colors.textMuted }}>{selectedFormSet.default_button_text_color}</span>
                            </div>
                          </div>
                        </div>
                        <p className="text-xs mt-2 italic" style={{ color: colors.textMuted }}>
                          {t.formdesignerpanel2213}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8" style={{ color: colors.textMuted }}>
                    <i className="pi pi-info-circle text-2xl mb-2"></i>
                    <p className="text-sm">{t.formdesignerpanel2212}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create FormSet Modal */}
      <Dialog
        visible={createFormSetModalVisible}
        onHide={() => setCreateFormSetModalVisible(false)}
        header={t.formdesignerpanel2234}
        style={{ width: '500px' }}
        modal
        className="form-designer-modal"
        contentStyle={{ backgroundColor: colors.bgPrimary, color: colors.textPrimary }}
        headerStyle={{ backgroundColor: colors.dialogHeader, color: colors.textPrimary, border: 'none' }}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm mb-1" style={{ color: colors.textSecondary }}>{t.formdesignerpanel2243}</label>
            <InputText
              value={newFormSetName}
              onChange={(e) => {
                // Sanitize: only allow lowercase letters, numbers, and underscores
                const sanitized = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
                setNewFormSetName(sanitized);
              }}
              className="w-full"
              placeholder={t.formdesignerpanel2252}
            />
            <small className="mt-1 block" style={{ color: colors.textMuted }}>
              {t.formdesignerpanel2255}
            </small>
          </div>
          <div>
            <label className="block text-sm mb-1" style={{ color: colors.textSecondary }}>{t.formdesignerpanel2259}</label>
            <InputTextarea
              value={newFormSetDescription}
              onChange={(e) => setNewFormSetDescription(e.target.value)}
              className="w-full"
              rows={3}
              placeholder={t.formdesignerpanel2265}
            />
          </div>
          <div>
            <label className="block text-sm mb-1" style={{ color: colors.textSecondary }}>{t.formdesignerpanel2269}</label>
            <Dropdown
              value={newFormSetVisibility}
              options={[
                { value: 'private', label: t.formdesignerpanel2273 },
                { value: 'team', label: t.formdesignerpanel2274 },
                { value: 'public', label: t.formdesignerpanel2275 },
              ]}
              onChange={(e) => setNewFormSetVisibility(e.value)}
              optionLabel="label"
              optionValue="value"
              className="w-full"
              panelClassName="form-designer-dropdown-panel"
            />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button
              label={t.formdesignerpanel2286}
              className="p-button-secondary"
              onClick={() => setCreateFormSetModalVisible(false)}
            />
            <Button
              label={t.formdesignerpanel2291}
              icon="pi pi-plus"
              className="p-button-success"
              onClick={createFormSet}
              loading={saving}
            />
          </div>
        </div>
      </Dialog>

      {/* Edit FormSet Modal */}
      <Dialog
        visible={editFormSetModalVisible}
        onHide={() => setEditFormSetModalVisible(false)}
        header={t.formdesignerpanel2305}
        style={{ width: '600px' }}
        modal
        className="form-designer-modal"
        contentStyle={{ backgroundColor: colors.bgPrimary, color: colors.textPrimary }}
        headerStyle={{ backgroundColor: colors.dialogHeader, color: colors.textPrimary, border: 'none' }}
      >
        {selectedFormSet && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm mb-1" style={{ color: colors.textSecondary }}>{t.formdesignerpanel2316}</label>
                <InputText
                  value={selectedFormSet.name}
                  onChange={(e) => {
                    // Sanitize: only allow lowercase letters, numbers, and underscores
                    const sanitized = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
                    setSelectedFormSet({ ...selectedFormSet, name: sanitized });
                  }}
                  className="w-full"
                />
                <small className="mt-1 block" style={{ color: colors.textMuted }}>
                  {t.formdesignerpanel2327}
                </small>
              </div>
              <div>
                <label className="block text-sm mb-1" style={{ color: colors.textSecondary }}>{t.formdesignerpanel2331}</label>
                <Dropdown
                  value={selectedFormSet.visibility}
                  options={[
                    { value: 'private', label: t.formdesignerpanel2335 },
                    { value: 'team', label: t.formdesignerpanel2336 },
                    { value: 'public', label: t.formdesignerpanel2337 },
                  ]}
                  onChange={(e) => setSelectedFormSet({ ...selectedFormSet, visibility: e.value })}
                  optionLabel="label"
                  optionValue="value"
                  className="w-full"
                  panelClassName="form-designer-dropdown-panel"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm mb-1" style={{ color: colors.textSecondary }}>{t.formdesignerpanel2349}</label>
              <InputTextarea
                value={selectedFormSet.description || ''}
                onChange={(e) => setSelectedFormSet({ ...selectedFormSet, description: e.target.value })}
                className="w-full"
                rows={2}
              />
            </div>

            {/* Default Colors Section */}
            <div className="border-t pt-4" style={{ borderColor: colors.borderPrimary }}>
              <h4 className="font-semibold mb-3" style={{ color: colors.textPrimary }}>{t.formdesignerpanel2360}</h4>
              <p className="text-xs mb-3" style={{ color: colors.textMuted }}>
                {t.formdesignerpanel2362}
              </p>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-2" style={{ color: colors.textSecondary }}>{t.formdesignerpanel2367}</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      id="formset-bg-color"
                      value={selectedFormSet.default_background_color}
                      onChange={(e) => setSelectedFormSet({ ...selectedFormSet, default_background_color: e.target.value })}
                      className="sr-only"
                    />
                    <div
                      className="w-10 h-10 rounded border-2 cursor-pointer hover:opacity-80 transition-opacity"
                      style={{ backgroundColor: selectedFormSet.default_background_color, borderColor: colors.borderPrimary }}
                      onClick={() => document.getElementById('formset-bg-color')?.click()}
                      title={t.formdesignerpanel2380}
                    ></div>
                    <InputText
                      value={selectedFormSet.default_background_color}
                      onChange={(e) => setSelectedFormSet({ ...selectedFormSet, default_background_color: e.target.value })}
                      className="flex-1 p-inputtext-sm"
                      placeholder="#1f2937"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm mb-2" style={{ color: colors.textSecondary }}>{t.formdesignerpanel2391}</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      id="formset-window-color"
                      value={selectedFormSet.default_window_color}
                      onChange={(e) => setSelectedFormSet({ ...selectedFormSet, default_window_color: e.target.value })}
                      className="sr-only"
                    />
                    <div
                      className="w-10 h-10 rounded border-2 cursor-pointer hover:opacity-80 transition-opacity"
                      style={{ backgroundColor: selectedFormSet.default_window_color, borderColor: colors.borderPrimary }}
                      onClick={() => document.getElementById('formset-window-color')?.click()}
                      title={t.formdesignerpanel2404}
                    ></div>
                    <InputText
                      value={selectedFormSet.default_window_color}
                      onChange={(e) => setSelectedFormSet({ ...selectedFormSet, default_window_color: e.target.value })}
                      className="flex-1 p-inputtext-sm"
                      placeholder="#374151"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm mb-2" style={{ color: colors.textSecondary }}>{t.formdesignerpanel2415}</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      id="formset-text-color"
                      value={selectedFormSet.default_text_color}
                      onChange={(e) => setSelectedFormSet({ ...selectedFormSet, default_text_color: e.target.value })}
                      className="sr-only"
                    />
                    <div
                      className="w-10 h-10 rounded border-2 cursor-pointer hover:opacity-80 transition-opacity"
                      style={{ backgroundColor: selectedFormSet.default_text_color, borderColor: colors.borderPrimary }}
                      onClick={() => document.getElementById('formset-text-color')?.click()}
                      title={t.formdesignerpanel2428}
                    ></div>
                    <InputText
                      value={selectedFormSet.default_text_color}
                      onChange={(e) => setSelectedFormSet({ ...selectedFormSet, default_text_color: e.target.value })}
                      className="flex-1 p-inputtext-sm"
                      placeholder="#f3f4f6"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm mb-2" style={{ color: colors.textSecondary }}>{t.formdesignerpanel2439}</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      id="formset-button-color"
                      value={selectedFormSet.default_button_color}
                      onChange={(e) => setSelectedFormSet({ ...selectedFormSet, default_button_color: e.target.value })}
                      className="sr-only"
                    />
                    <div
                      className="w-10 h-10 rounded border-2 cursor-pointer hover:opacity-80 transition-opacity"
                      style={{ backgroundColor: selectedFormSet.default_button_color, borderColor: colors.borderPrimary }}
                      onClick={() => document.getElementById('formset-button-color')?.click()}
                      title={t.formdesignerpanel2452}
                    ></div>
                    <InputText
                      value={selectedFormSet.default_button_color}
                      onChange={(e) => setSelectedFormSet({ ...selectedFormSet, default_button_color: e.target.value })}
                      className="flex-1 p-inputtext-sm"
                      placeholder="#3b82f6"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm mb-2" style={{ color: colors.textSecondary }}>{t.formdesignerpanel2463}</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      id="formset-button-text-color"
                      value={selectedFormSet.default_button_text_color}
                      onChange={(e) => setSelectedFormSet({ ...selectedFormSet, default_button_text_color: e.target.value })}
                      className="sr-only"
                    />
                    <div
                      className="w-10 h-10 rounded border-2 cursor-pointer hover:opacity-80 transition-opacity"
                      style={{ backgroundColor: selectedFormSet.default_button_text_color, borderColor: colors.borderPrimary }}
                      onClick={() => document.getElementById('formset-button-text-color')?.click()}
                      title={t.formdesignerpanel2476}
                    ></div>
                    <InputText
                      value={selectedFormSet.default_button_text_color}
                      onChange={(e) => setSelectedFormSet({ ...selectedFormSet, default_button_text_color: e.target.value })}
                      className="flex-1 p-inputtext-sm"
                      placeholder="#ffffff"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Color Preview */}
            <div className="border-t pt-4" style={{ borderColor: colors.borderPrimary }}>
              <h4 className="font-semibold mb-2" style={{ color: colors.textPrimary }}>{t.formdesignerpanel2491}</h4>
              <div
                className="formset-color-preview rounded-lg p-4"
                style={{
                  backgroundColor: selectedFormSet.default_background_color,
                  border: `1px solid ${colors.borderPrimary}`,
                  '--preview-text-color': selectedFormSet.default_text_color,
                  '--preview-button-text-color': selectedFormSet.default_button_text_color
                } as React.CSSProperties}
              >
                <div
                  className="rounded p-3"
                  style={{ backgroundColor: selectedFormSet.default_window_color }}
                >
                  <p className="text-sm mb-2 preview-text">
                    {t.formdesignerpanel2506}
                  </p>
                  <button
                    className="px-3 py-1 rounded text-sm preview-button"
                    style={{ backgroundColor: selectedFormSet.default_button_color }}
                  >
                    {t.formdesignerpanel2512}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t" style={{ borderColor: colors.borderPrimary }}>
              <Button
                label={t.formdesignerpanel2520}
                icon="pi pi-trash"
                className="p-button-danger p-button-outlined"
                onClick={() => {
                  confirmDialog({
                    group: 'form-designer',
                    message: `${t.formdesignerpanel2525}"${selectedFormSet.name}"${t.formdesignerpanel2525_2}`,
                    header: t.formdesignerpanel2526,
                    icon: 'pi pi-exclamation-triangle',
                    acceptClassName: 'p-button-danger',
                    accept: async () => {
                      try {
                        await apiClient.delete(`/form-sets/${selectedFormSet.id}`);
                        showToast('success', t.formdesignerpanel2536, t.formdesignerpanel2536_2);
                        setEditFormSetModalVisible(false);
                        setSelectedFormSet(null);
                        setSelectedWindow(null);
                        // Clear localStorage
                        localStorage.removeItem(STORAGE_KEY_FORMSET);
                        localStorage.removeItem(STORAGE_KEY_WINDOW);
                        loadFormSets();
                        // Tell other panels (Management, Layout editor) to refresh
                        // and drop the now-deleted Form Set.
                        window.dispatchEvent(new CustomEvent('formSetsChanged'));
                      } catch {
                        showToast('error', t.messageError, t.formdesignerpanel2546);
                      }
                    },
                  });
                }}
              />
              <div className="flex gap-2">
                <Button
                  label={t.formdesignerpanel2554}
                  className="p-button-secondary"
                  onClick={() => setEditFormSetModalVisible(false)}
                />
                <Button
                  label={t.formdesignerpanel2559}
                  icon="pi pi-save"
                  className="p-button-success"
                  onClick={async () => {
                    try {
                      setSaving(true);
                      let data: any;
                      try {
                        data = await apiClient.put(`/form-sets/${selectedFormSet.id}`, {
                          name: selectedFormSet.name,
                          description: selectedFormSet.description,
                          visibility: selectedFormSet.visibility,
                          default_background_color: selectedFormSet.default_background_color,
                          default_window_color: selectedFormSet.default_window_color,
                          default_text_color: selectedFormSet.default_text_color,
                          default_button_color: selectedFormSet.default_button_color,
                          default_button_text_color: selectedFormSet.default_button_text_color,
                        });
                      } catch (err: any) {
                        data = err?.response?.data || { success: false };
                      }
                      if (data.success) {
                        showToast('success', t.formdesignerpanel2581, t.formdesignerpanel2581_2);
                        setEditFormSetModalVisible(false);
                        loadFormSets();
                        if (data.data) {
                          setSelectedFormSet(data.data);
                        }
                      } else {
                        showToast('error', t.messageError, data.error || t.formdesignerpanel2588);
                      }
                    } catch {
                      showToast('error', t.messageError,t.formdesignerpanel2591);
                    } finally {
                      setSaving(false);
                    }
                  }}
                  loading={saving}
                />
              </div>
            </div>
          </div>
        )}
      </Dialog>

      {/* Unlock Form Designer Modal */}
      <Dialog
        visible={unlockModalVisible}
        onHide={() => setUnlockModalVisible(false)}
        header={t.formdesignerpanel2609}
        style={{ width: '500px' }}
        modal
        className="form-designer-modal"
        contentStyle={{ backgroundColor: colors.bgPrimary, color: colors.textPrimary }}
        headerStyle={{ backgroundColor: colors.dialogHeader, color: colors.textPrimary, border: 'none' }}
      >
        <div className="space-y-6">
          {/* Info Section */}
          <div className="text-center">
            <i className="pi pi-lock text-5xl text-yellow-400 mb-4"></i>
            <h3 className="text-xl font-bold mb-2" style={{ color: colors.textPrimary }}>{t.formdesignerpanel2619}</h3>
            <p className="text-sm" style={{ color: colors.textSecondary }}>
              {t.formdesignerpanel2621}
              {t.formdesignerpanel2622}
            </p>
          </div>

          {/* Pricing Info */}
          <div className="rounded-lg p-4" style={{ backgroundColor: colors.bgSecondary }}>
            <div className="flex items-center justify-between mb-3">
              <span style={{ color: colors.textMuted }}>{t.formdesignerpanel2630}</span>
              <span className="text-xl font-bold text-blue-400">
                {accessStatus?.unlock_cost || 50}{t.formdesignerpanel2631}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span style={{ color: colors.textMuted }}>{t.formdesignerpanel2635}</span>
              <span className={`text-xl font-bold ${(accessStatus?.user_credits || 0) >= (accessStatus?.unlock_cost || 50) ? 'text-green-400' : 'text-red-400'}`}>
                {accessStatus?.user_credits || 0}{t.formdesignerpanel2638}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          {(accessStatus?.user_credits || 0) >= (accessStatus?.unlock_cost || 50) ? (
            <div className="space-y-3">
              <Button
                label={t.formdesignerpanel2647}
                icon="pi pi-unlock"
                className="p-button-success w-full"
                onClick={async () => {
                  try {
                    setUnlocking(true);
                    let data: any;
                    try {
                      data = await apiClient.post('/form-designer/unlock');
                    } catch (err: any) {
                      data = err?.response?.data || { success: false };
                    }
                    if (data.success) {
                      showToast('success', t.formdesignerpanel2658_2, data.message || t.formdesignerpanel2658);
                      setUnlockModalVisible(false);
                      // Refresh access status
                      await checkAccess();
                      // Open the create modal
                      setCreateFormSetModalVisible(true);
                    } else {
                      showToast('error', t.messageError, data.error || t.formdesignerpanel2665);
                    }
                  } catch (error) {
                    console.error('Unlock failed:', error);
                    showToast('error', t.messageError, t.formdesignerpanel2669);
                  } finally {
                    setUnlocking(false);
                  }
                }}
                loading={unlocking}
              />
              <p className="text-xs text-center" style={{ color: colors.textMuted }}>
                {t.formdesignerpanel2677}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-red-900/30 border border-red-700 rounded-lg p-3 text-center">
                <p className="text-red-400 text-sm">
                  {t.formdesignerpanel2684}<strong>{(accessStatus?.unlock_cost || 50) - (accessStatus?.user_credits || 0)} Credits</strong>.
                </p>
              </div>

              <div className="border-t pt-4" style={{ borderColor: colors.borderPrimary }}>
                <p className="text-sm text-center mb-3" style={{ color: colors.textMuted }}>{t.formdesignerpanel2689}</p>
                <div className="flex gap-3">
                  <Button
                    label={t.formdesignerpanel2692}
                    icon="pi pi-credit-card"
                    className="p-button-info flex-1"
                    onClick={() => {
                      setUnlockModalVisible(false);
                      onOpenPanel?.('credits-purchase', { provider: 'stripe' });
                    }}
                  />
                  <Button
                    label={t.formdesignerpanel2701}
                    icon="pi pi-paypal"
                    className="p-button-warning flex-1"
                    onClick={() => {
                      setUnlockModalVisible(false);
                      onOpenPanel?.('credits-purchase', { provider: 'paypal' });
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Patron Info */}
          <div className="border-t pt-4 text-center" style={{ borderColor: colors.borderPrimary }}>
            <p className="text-xs" style={{ color: colors.textMuted }}>
              <i className="pi pi-star text-yellow-400 mr-1"></i>
              {t.formdesignerpanel2718}
            </p>
          </div>

          {/* Cancel Button */}
          <div className="flex justify-end">
            <Button
              label={t.formdesignerpanel2725}
              className="p-button-secondary"
              onClick={() => setUnlockModalVisible(false)}
            />
          </div>
        </div>
      </Dialog>

      {/* Tab Order Modal */}
      <TabOrderModal
        visible={tabOrderModalVisible}
        elements={nodes
          .filter(n => n.type === 'formElement')
          .map(n => n.data?.element as FormElement)
          .filter(el => el && el.id != null)}
        onCancel={() => setTabOrderModalVisible(false)}
        onApply={tabOrderApplyFromModal}
      />
    </TabContent>
  );
}
