// resources/js/Components/Panels/FormDesignerPanel.tsx - Visual Form/Window Designer
import React, { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import { confirmDialog } from 'primereact/confirmdialog';
import { ConfirmDialog } from 'primereact/confirmdialog';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { InputNumber } from 'primereact/inputnumber';
// ColorPicker, TabView, TabPanel - reserved for future use
import { Toast } from 'primereact/toast';
import { ProgressSpinner } from 'primereact/progressspinner';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  BackgroundVariant,
  NodeResizer,
  NodeProps,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { TabContentProps } from '@/types';
import { useProject } from '@/contexts/ProjectContext';
import { useTranslation, SupportedLanguage, getStoredLanguage } from '@/i18n';

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
  window_type: 'main_menu' | 'create_edit' | 'data_table' | 'report_single' | 'report_list';
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
  // Container-spezifisch
  container_orientation?: 'vertical' | 'horizontal';
  max_fields?: number;
  container_gap?: number;
  container_columns?: number;
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

// ========== ELEMENT TYPE DEFINITIONS ==========

const ELEMENT_TYPES = {
  containers: [
    { value: 'container', label: 'Daten-Container', icon: 'pi-table' },
    { value: 'tab_container', label: 'Tab-Container', icon: 'pi-folder' },
    { value: 'tab_panel', label: 'Tab-Panel', icon: 'pi-file' },
    { value: 'menu_container', label: 'Menu-Container', icon: 'pi-bars' },
  ],
  navigation: [
    { value: 'button_nav_first', label: 'Erster', icon: 'pi-angle-double-left' },
    { value: 'button_nav_prev', label: 'Vorheriger', icon: 'pi-angle-left' },
    { value: 'button_nav_next', label: 'Nächster', icon: 'pi-angle-right' },
    { value: 'button_nav_last', label: 'Letzter', icon: 'pi-angle-double-right' },
  ],
  actions: [
    { value: 'button_save', label: 'Speichern', icon: 'pi-save' },
    { value: 'button_cancel', label: 'Abbrechen', icon: 'pi-times' },
    { value: 'button_close', label: 'Schließen', icon: 'pi-times' },
    { value: 'button_new', label: 'Neu', icon: 'pi-plus' },
    { value: 'button_delete', label: 'Löschen', icon: 'pi-trash' },
    { value: 'button_custom', label: 'Benutzerdefiniert', icon: 'pi-cog' },
  ],
  layout: [
    { value: 'separator', label: 'Trennlinie', icon: 'pi-minus' },
    { value: 'spacer', label: 'Abstandshalter', icon: 'pi-arrows-h' },
  ],
};

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

const WINDOW_TYPE_LABELS: Record<string, string> = {
  main_menu: 'Hauptmenü',
  create_edit: 'Formular (Erstellen/Bearbeiten)',
  data_table: 'Datentabelle',
  report_single: 'Einzelbericht',
  report_list: 'Listenbericht',
};

// ========== HELPER FUNCTIONS ==========

const getAuthHeaders = () => {
  const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };
};

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
}

const FormElementNode: React.FC<NodeProps<FormElementNodeData>> = ({ data, selected }) => {
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
        <span className="text-gray-500 text-xs">Spacer</span>
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
            {element.element_type === 'container' && 'Container'}
            {element.element_type === 'tab_container' && 'Tab-Container'}
            {element.element_type === 'menu_container' && 'Menü'}
            {element.element_type === 'tab_panel' && (label || 'Tab')}
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
          {element.element_type === 'container' && 'Felder werden hier generiert'}
          {element.element_type === 'tab_container' && 'Tab-Panels hier platzieren'}
          {element.element_type === 'menu_container' && (
            element.container_orientation === 'horizontal' ? 'Horizontales Menü' : 'Vertikales Menü'
          )}
          {element.element_type === 'tab_panel' && 'Tab-Inhalt'}
        </div>
      </div>
    </div>
  );
};

// Window Frame Node - shows the visual boundaries of the window
interface WindowFrameNodeData {
  windowName: string;
  windowType: string;
  defaultWidth: number;
  defaultHeight: number;
  minWidth: number;
  minHeight: number;
  windowColor: string;
  textColor: string;
}

const WindowFrameNode: React.FC<NodeProps<WindowFrameNodeData>> = ({ data }) => {
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
      }}
    >
      {/* Window title bar */}
      <div
        className="absolute -top-7 left-0 right-0 flex items-center justify-between px-2 py-1 rounded-t text-xs"
        style={{
          backgroundColor: '#6366f1',
          color: 'white',
        }}
      >
        <span className="font-medium">
          <i className="pi pi-window-maximize mr-1"></i>
          {data.windowName || WINDOW_TYPE_LABELS[data.windowType] || 'Fenster'}
        </span>
        <span className="opacity-75">
          {data.defaultWidth} × {data.defaultHeight} px
        </span>
      </div>

      {/* Min size indicator (inner dashed rectangle) */}
      {(data.minWidth < data.defaultWidth || data.minHeight < data.defaultHeight) && (
        <div
          className="absolute top-0 left-0 pointer-events-none"
          style={{
            width: data.minWidth,
            height: data.minHeight,
            border: '1px dashed rgba(255,255,255,0.3)',
            borderRadius: '4px',
          }}
          title={`Minimalgröße: ${data.minWidth} × ${data.minHeight} px`}
        />
      )}

      {/* Corner indicators */}
      <div className="absolute -bottom-1 -right-1 w-3 h-3 border-r-2 border-b-2 border-indigo-500 rounded-br"></div>
      <div className="absolute -bottom-1 -left-1 w-3 h-3 border-l-2 border-b-2 border-indigo-500 rounded-bl"></div>
      <div className="absolute -top-1 -right-1 w-3 h-3 border-r-2 border-t-2 border-indigo-500 rounded-tr"></div>
      <div className="absolute -top-1 -left-1 w-3 h-3 border-l-2 border-t-2 border-indigo-500 rounded-tl"></div>

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
  windowFrame: WindowFrameNode,
};

// ========== TAB CONTENT WRAPPER ==========

const TabContent: React.FC<TabContentProps> = ({ children, style = {}, ...rest }) => {
  const ref = useRef<HTMLDivElement>(null);
  const setFocus = () => ref.current?.focus();

  return (
    <div
      {...rest}
      ref={ref}
      tabIndex={-1}
      style={{ flex: 1, padding: '0', height: '100%', ...style }}
      onMouseDownCapture={setFocus}
      onTouchStartCapture={setFocus}
      className="bg-gray-800 text-gray-100"
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

  // ========== API FUNCTIONS ==========

  const showToast = useCallback((severity: 'success' | 'info' | 'warn' | 'error', summary: string, detail?: string) => {
    toastRef.current?.show({ severity, summary, detail, life: 3000 });
  }, []);

  const checkAccess = useCallback(async () => {
    try {
      setCheckingAccess(true);
      const response = await fetch('/api/form-designer/access', {
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        const data = await response.json();
        setAccessStatus(data);
      } else {
        showToast('error', 'Fehler', t.formdesignerpanel555);
      }
    } catch (error) {
      console.error('Access check failed:', error);
      showToast('error', 'Fehler', 'Netzwerkfehler bei Zugriffsprüfung');
    } finally {
      setCheckingAccess(false);
    }
  }, [showToast]);

  const _unlockFeature = useCallback(async () => {
    try {
      setUnlocking(true);
      const response = await fetch('/api/form-designer/unlock', {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      if (data.success) {
        showToast('success', 'Erfolgreich', data.message);
        await checkAccess();
      } else {
        showToast('error', 'Fehler', data.error || 'Freischaltung fehlgeschlagen');
      }
    } catch (error) {
      console.error('Unlock failed:', error);
      showToast('error', 'Fehler', 'Netzwerkfehler bei Freischaltung');
    } finally {
      setUnlocking(false);
    }
  }, [checkAccess, showToast]);

  const loadFormSets = useCallback(async () => {
    try {
      setLoadingFormSets(true);
      const response = await fetch('/api/form-sets?own_only=true', {
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        const data = await response.json();
        const formSetList = data.data || [];
        setFormSets(formSetList);

        // Determine which FormSet to select (priority: prop > localStorage > none)
        const storedFormSetId = localStorage.getItem(STORAGE_KEY_FORMSET);
        const storedWindowId = localStorage.getItem(STORAGE_KEY_WINDOW);
        const targetFormSetId = initialFormSetId || (storedFormSetId ? parseInt(storedFormSetId, 10) : null);

        if (targetFormSetId && formSetList.length > 0) {
          const found = formSetList.find((fs: FormSet) => fs.id === targetFormSetId);
          if (found) {
            // Load full details for this FormSet
            const detailResponse = await fetch(`/api/form-sets/${found.id}`, {
              headers: getAuthHeaders(),
            });
            if (detailResponse.ok) {
              const detailData = await detailResponse.json();
              setSelectedFormSet(detailData.data);

              // Restore window selection from localStorage or select first
              if (detailData.data?.windows?.length > 0) {
                const targetWindowId = storedWindowId ? parseInt(storedWindowId, 10) : null;
                const targetWindow = targetWindowId
                  ? detailData.data.windows.find((w: FormWindow) => w.id === targetWindowId)
                  : detailData.data.windows[0];
                setSelectedWindow(targetWindow || detailData.data.windows[0]);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Load FormSets failed:', error);
      showToast('error', 'Fehler', 'FormSets konnten nicht geladen werden');
    } finally {
      setLoadingFormSets(false);
    }
  }, [initialFormSetId, showToast, STORAGE_KEY_FORMSET, STORAGE_KEY_WINDOW]);

  const loadFormSetDetails = useCallback(async (formSetId: number) => {
    try {
      const response = await fetch(`/api/form-sets/${formSetId}`, {
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        const data = await response.json();
        setSelectedFormSet(data.data);

        // Save to localStorage for persistence
        localStorage.setItem(STORAGE_KEY_FORMSET, String(formSetId));

        // Auto-select first window
        if (data.data?.windows?.length > 0) {
          const firstWindow = data.data.windows[0];
          setSelectedWindow(firstWindow);
          localStorage.setItem(STORAGE_KEY_WINDOW, String(firstWindow.id));
        }
      }
    } catch (error) {
      console.error('Load FormSet details failed:', error);
      showToast('error', 'Fehler', 'FormSet-Details konnten nicht geladen werden');
    }
  }, [showToast, STORAGE_KEY_FORMSET, STORAGE_KEY_WINDOW]);

  const createFormSet = useCallback(async () => {
    if (!newFormSetName.trim()) {
      showToast('warn', 'Warnung', 'Name ist erforderlich');
      return;
    }

    try {
      setSaving(true);
      const response = await fetch('/api/form-sets', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name: newFormSetName,
          description: newFormSetDescription,
          visibility: newFormSetVisibility,
        }),
      });

      const data = await response.json();
      if (data.success) {
        showToast('success', 'Erfolgreich', 'FormSet erstellt');
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
      } else {
        showToast('error', 'Fehler', data.error || 'Erstellen fehlgeschlagen');
      }
    } catch (error) {
      console.error('Create FormSet failed:', error);
      showToast('error', 'Fehler', 'Netzwerkfehler');
    } finally {
      setSaving(false);
    }
  }, [newFormSetName, newFormSetDescription, newFormSetVisibility, loadFormSets, showToast]);

  const saveElements = useCallback(async () => {
    if (!selectedWindow) return;

    try {
      setSaving(true);

      // Convert nodes back to elements (exclude window-frame node)
      // NodeResizer stores dimensions in node.width/height, fallback to style, then to original element
      const elementNodes = nodes.filter(node => node.type === 'formElement');
      const elements: FormElement[] = elementNodes.map((node, index) => {
        // Get width: first from node (resized), then from style, then from original element
        const width = node.width
          ?? (node.style?.width ? parseInt(String(node.style.width)) : null)
          ?? node.data.element.width;

        // Get height: first from node (resized), then from style, then from original element
        const height = node.height
          ?? (node.style?.height ? parseInt(String(node.style.height)) : null)
          ?? node.data.element.height;

        return {
          id: node.data.element.id,
          form_window_id: selectedWindow.id,
          element_type: node.data.element.element_type,
          x_position: Math.round(node.position.x),
          y_position: Math.round(node.position.y),
          width: Math.round(width),
          height: Math.round(height),
          // Container-spezifisch
          container_orientation: node.data.element.container_orientation,
          max_fields: node.data.element.max_fields,
          container_gap: node.data.element.container_gap,
          container_columns: node.data.element.container_columns,
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
          is_visible: node.data.element.is_visible ?? true,
        };
      });

      const response = await fetch(`/api/form-windows/${selectedWindow.id}/elements`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ elements }),
      });

      const data = await response.json();
      if (data.success) {
        showToast('success', 'Gespeichert', 'Elemente wurden gespeichert');
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
                  // Use server-returned positions to ensure consistency
                  position: {
                    x: serverElement.x_position,
                    y: serverElement.y_position,
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
        showToast('error', 'Fehler', data.error || 'Speichern fehlgeschlagen');
      }
    } catch (error) {
      console.error('Save elements failed:', error);
      showToast('error', 'Fehler', 'Netzwerkfehler beim Speichern');
    } finally {
      setSaving(false);
    }
  }, [selectedWindow, nodes, selectedNodeId, showToast]);

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
      const response = await fetch(`/api/form-windows/${selectedWindow.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          display_name: selectedWindow.display_name,
          min_width: selectedWindow.min_width,
          min_height: selectedWindow.min_height,
          default_width: selectedWindow.default_width,
          default_height: selectedWindow.default_height,
          background_color: selectedWindow.background_color,
          window_color: selectedWindow.window_color,
          text_color: selectedWindow.text_color,
        }),
      });

      const data = await response.json();
      if (data.success) {
        showToast('success', 'Gespeichert', 'Fenster-Eigenschaften wurden gespeichert');
        // Note: hasUnsavedChanges is handled by saveElements, we keep it for element changes
      } else {
        showToast('error', 'Fehler', data.error || 'Speichern fehlgeschlagen');
      }
    } catch (error) {
      console.error('Save window failed:', error);
      showToast('error', 'Fehler', 'Netzwerkfehler beim Speichern');
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
      position: { x, y },
      data: {
        element: newElement,
        onSelect: setSelectedElement,
        isSelected: false,
        isReadOnly: false,
        defaultButtonColor: selectedFormSet?.default_button_color || '#3b82f6',
        defaultButtonTextColor: selectedFormSet?.default_button_text_color || '#ffffff',
      },
      style: {
        width: newElement.width,
        height: newElement.height,
      },
    };

    setNodes((prev: Node[]) => [...prev, newNode]);
    setHasUnsavedChanges(true);
    showToast('info', 'Element hinzugefügt', `${elementType} wurde hinzugefügt`);
  }, [selectedWindow, selectedFormSet, nodes, setNodes, showToast]);

  const deleteSelectedElement = useCallback(() => {
    if (!selectedElement || !selectedNodeId) return;

    confirmDialog({
      message: 'Möchten Sie dieses Element wirklich löschen?',
      header: 'Element löschen',
      icon: 'pi pi-exclamation-triangle',
      acceptClassName: 'p-button-danger',
      accept: () => {
        setNodes(prev => prev.filter(n => n.id !== selectedNodeId));
        setSelectedElement(null);
        setSelectedNodeId(null);
        setHasUnsavedChanges(true);
        showToast('info', 'Gelöscht', 'Element wurde entfernt');
      },
    });
  }, [selectedElement, selectedNodeId, setNodes, showToast]);

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
        message: 'Sie haben ungespeicherte Änderungen. Was möchten Sie tun?',
        header: 'Ungespeicherte Änderungen',
        icon: 'pi pi-exclamation-triangle',
        acceptLabel: 'Speichern & Wechseln',
        rejectLabel: 'Verwerfen & Wechseln',
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
        message: 'Sie haben ungespeicherte Änderungen. Was möchten Sie tun?',
        header: 'Ungespeicherte Änderungen',
        icon: 'pi pi-exclamation-triangle',
        acceptLabel: 'Speichern & Wechseln',
        rejectLabel: 'Verwerfen & Wechseln',
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
        const response = await fetch('/api/form-designer/access', {
          headers: getAuthHeaders(),
        });
        if (response.ok) {
          const data = await response.json();
          setAccessStatus(data);

          if (data.has_access) {
            setCreateFormSetModalVisible(true);
          } else {
            setUnlockModalVisible(true);
          }
        } else {
          setUnlockModalVisible(true);
        }
      } catch (error) {
        console.error('Access check failed:', error);
        setUnlockModalVisible(true);
      } finally {
        setCheckingAccess(false);
      }
    };

    // Check for unsaved changes first
    if (hasUnsavedChanges) {
      confirmDialog({
        message: 'Sie haben ungespeicherte Änderungen. Was möchten Sie tun?',
        header: 'Ungespeicherte Änderungen',
        icon: 'pi pi-exclamation-triangle',
        acceptLabel: 'Speichern & Fortfahren',
        rejectLabel: 'Verwerfen & Fortfahren',
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
        defaultWidth: selectedWindow.default_width,
        defaultHeight: selectedWindow.default_height,
        minWidth: selectedWindow.min_width,
        minHeight: selectedWindow.min_height,
        windowColor: selectedWindow.window_color || selectedFormSet?.default_window_color || '#374151',
        textColor: selectedWindow.text_color || selectedFormSet?.default_text_color || '#f3f4f6',
      },
      style: {
        zIndex: -1, // Behind all other nodes
      },
    };

    // Create element nodes - mit default Button-Farben aus dem FormSet
    const defaultButtonColor = selectedFormSet?.default_button_color || '#3b82f6';
    const defaultButtonTextColor = selectedFormSet?.default_button_text_color || '#ffffff';
    const elementNodes = (selectedWindow.elements || []).map((element, index) => ({
      id: `element-${element.id || index}`,
      type: 'formElement',
      position: { x: element.x_position, y: element.y_position },
      data: {
        element,
        onSelect: setSelectedElement,
        isSelected: false, // Selection is handled by React Flow's selected prop
        isReadOnly: false,
        defaultButtonColor,
        defaultButtonTextColor,
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
      y: Math.round(node.position.y),
      width: parseSize(node.width ?? node.style?.width, selectedElement?.width ?? 100),
      height: parseSize(node.height ?? node.style?.height, selectedElement?.height ?? 40),
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
      <ConfirmDialog />

      {/* Main Layout */}
      <div className="flex flex-col h-full">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-4 py-2 bg-gray-900 border-b border-gray-700">
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
              placeholder="FormSet auswählen..."
              className="w-64"
              loading={loadingFormSets}
              emptyMessage="Keine FormSets vorhanden"
            />
            <Button
              icon="pi pi-plus"
              className="p-button-success p-button-sm"
              tooltip="Neues FormSet erstellen"
              onClick={handleCreateFormSetClick}
            />
            {selectedFormSet && (
              <Button
                icon="pi pi-pencil"
                className="p-button-secondary p-button-sm"
                tooltip="FormSet bearbeiten"
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
                className={`text-xs px-2 py-1 rounded ${
                  accessStatus.days_remaining > 30 ? 'bg-green-900/50 text-green-400' :
                  accessStatus.days_remaining > 7 ? 'bg-yellow-900/50 text-yellow-400' :
                  'bg-red-900/50 text-red-400'
                }`}
                title={`Läuft ab am: ${accessStatus.expires_at ? new Date(accessStatus.expires_at).toLocaleDateString('de-DE') : 'Unbekannt'}`}
              >
                <i className="pi pi-clock mr-1"></i>
                {accessStatus.days_remaining} Tage
              </span>
            )}
            {accessStatus?.has_access && accessStatus.is_patron && (
              <span className="text-xs px-2 py-1 rounded bg-purple-900/50 text-purple-400" title="Patron Mitglied">
                <i className="pi pi-star mr-1"></i>
                Patron
              </span>
            )}
            {hasUnsavedChanges && (
              <span className="text-yellow-400 text-sm">
                <i className="pi pi-exclamation-circle mr-1"></i>
                Ungespeicherte Änderungen
              </span>
            )}
            <Button
              icon="pi pi-save"
              label="Speichern"
              className="p-button-success p-button-sm"
              onClick={saveElements}
              loading={saving}
              disabled={!hasUnsavedChanges}
            />
            <Button
              icon={propertiesPanelVisible ? 'pi pi-chevron-right' : 'pi pi-chevron-left'}
              className="p-button-secondary p-button-sm"
              tooltip={propertiesPanelVisible ? 'Properties ausblenden' : 'Properties einblenden'}
              onClick={() => setPropertiesPanelVisible(!propertiesPanelVisible)}
            />
          </div>
        </div>

        {/* Content Area */}
        <div className="flex flex-1 overflow-hidden">
          {/* Element Toolbar (Left) */}
          <div className="w-48 bg-gray-900 border-r border-gray-700 overflow-y-auto">
            <div className="p-2">
              <h4 className="text-gray-400 text-xs font-semibold uppercase mb-2">Container</h4>
              <div className="space-y-1">
                {ELEMENT_TYPES.containers.map(elem => (
                  <button
                    key={elem.value}
                    className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-gray-300 hover:bg-gray-700 rounded transition-colors"
                    onClick={() => addElement(elem.value)}
                    disabled={!selectedWindow}
                  >
                    <i className={`pi ${elem.icon}`}></i>
                    <span>{elem.label}</span>
                  </button>
                ))}
              </div>

              <h4 className="text-gray-400 text-xs font-semibold uppercase mt-4 mb-2">Navigation</h4>
              <div className="space-y-1">
                {ELEMENT_TYPES.navigation.map(elem => (
                  <button
                    key={elem.value}
                    className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-gray-300 hover:bg-gray-700 rounded transition-colors"
                    onClick={() => addElement(elem.value)}
                    disabled={!selectedWindow}
                  >
                    <i className={`pi ${elem.icon}`}></i>
                    <span>{elem.label}</span>
                  </button>
                ))}
              </div>

              <h4 className="text-gray-400 text-xs font-semibold uppercase mt-4 mb-2">Aktionen</h4>
              <div className="space-y-1">
                {ELEMENT_TYPES.actions.map(elem => (
                  <button
                    key={elem.value}
                    className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-gray-300 hover:bg-gray-700 rounded transition-colors"
                    onClick={() => addElement(elem.value)}
                    disabled={!selectedWindow}
                  >
                    <i className={`pi ${elem.icon}`}></i>
                    <span>{elem.label}</span>
                  </button>
                ))}
              </div>

              <h4 className="text-gray-400 text-xs font-semibold uppercase mt-4 mb-2">Layout</h4>
              <div className="space-y-1">
                {ELEMENT_TYPES.layout.map(elem => (
                  <button
                    key={elem.value}
                    className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-gray-300 hover:bg-gray-700 rounded transition-colors"
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
                  onNodesChange(changes);
                  // Track drag/resize state to detect when operations complete
                  // On initial load: dragging/resizing are undefined (we ignore these)
                  // During mouse drag/resize: dragging/resizing are true, then false at end
                  // Keyboard moves: dragging is false with position (no true beforehand)
                  let hasRealChange = false;

                  for (const change of changes) {
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
                onSelectionChange={({ nodes: selectedNodes }) => {
                  // Filter to only formElement nodes (exclude window-frame)
                  const elementNodes = selectedNodes.filter(n => n.type === 'formElement');
                  if (elementNodes.length > 0) {
                    // Only update selectedElement if the selection actually changed (different node)
                    // This prevents overwriting property changes made via the Properties Panel
                    if (elementNodes[0].id !== selectedNodeId) {
                      setSelectedElement(elementNodes[0].data.element);
                      setSelectedNodeId(elementNodes[0].id);
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
                    return getElementColor(node.data?.element?.element_type || 'unknown');
                  }}
                  maskColor="rgba(0,0,0,0.7)"
                />
              </ReactFlow>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <i className="pi pi-window-maximize text-4xl mb-2"></i>
                  <p>Wählen Sie ein FormSet und ein Fenster aus</p>
                </div>
              </div>
            )}
          </div>

          {/* Properties Panel (Right) */}
          {propertiesPanelVisible && (
            <div className="w-72 bg-gray-900 border-l border-gray-700 overflow-y-auto">
              <div className="p-3">
                {selectedElement ? (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-white font-semibold">Element-Eigenschaften</h4>
                      <Button
                        icon="pi pi-trash"
                        className="p-button-danger p-button-sm p-button-text"
                        tooltip="Element löschen"
                        onClick={deleteSelectedElement}
                      />
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-gray-400 text-xs mb-1">Typ</label>
                        <InputText
                          value={selectedElement.element_type}
                          disabled
                          className="w-full p-inputtext-sm"
                        />
                      </div>

                      {selectedElement.element_type.startsWith('button_') && (
                        <>
                          <div>
                            <label className="block text-gray-400 text-xs mb-1">Label</label>
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
                          <div>
                            <label className="block text-gray-400 text-xs mb-1">Icon (pi-xxx)</label>
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
                          {/* Button-Farben - kompaktes Layout mit Reset */}
                          <div className="flex gap-3">
                            <div>
                              <label className="block text-gray-400 text-xs mb-1">Hintergrund</label>
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
                                  placeholder="Standard"
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
                                    className="w-5 h-5 flex items-center justify-center text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded"
                                    title="Auf Standard zurücksetzen"
                                  >
                                    <i className="pi pi-times text-xs"></i>
                                  </button>
                                )}
                              </div>
                            </div>
                            <div>
                              <label className="block text-gray-400 text-xs mb-1">Schrift</label>
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
                                  placeholder="Standard"
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
                                    className="w-5 h-5 flex items-center justify-center text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded"
                                    title="Auf Standard zurücksetzen"
                                  >
                                    <i className="pi pi-times text-xs"></i>
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </>
                      )}

                      {selectedElement.element_type === 'container' && (
                        <div>
                          <label className="block text-gray-400 text-xs mb-1">Max. Felder (für Tabs)</label>
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
                            placeholder="Alle Felder"
                          />
                        </div>
                      )}

                      {/* Container-Eigenschaften: Gap und Columns */}
                      {['container', 'menu_container', 'tab_container'].includes(selectedElement.element_type) && (
                        <>
                          <div>
                            <label className="block text-gray-400 text-xs mb-1">Abstand (Gap in px)</label>
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
                          <div>
                            <label className="block text-gray-400 text-xs mb-1">Spalten</label>
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
                              className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:border-blue-500 focus:outline-none"
                            >
                              <option value={1}>1 Spalte</option>
                              <option value={2}>2 Spalten</option>
                              <option value={3}>3 Spalten</option>
                            </select>
                          </div>
                        </>
                      )}

                      {selectedElement.element_type === 'menu_container' && (
                        <div>
                          <label className="block text-gray-400 text-xs mb-1">Ausrichtung</label>
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
                            className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:border-blue-500 focus:outline-none"
                          >
                            <option value="vertical">Vertikal (↓)</option>
                            <option value="horizontal">Horizontal (→)</option>
                          </select>
                        </div>
                      )}

                      {selectedElement.element_type === 'tab_panel' && (
                        <div>
                          <label className="block text-gray-400 text-xs mb-1">Tab-Titel</label>
                          <InputText
                            value={selectedElement.tab_label || ''}
                            onChange={(e) => {
                              const newElement = { ...selectedElement, tab_label: e.target.value };
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
                      )}

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-gray-400 text-xs mb-1">X</label>
                          <InputNumber
                            value={selectedNodeData?.x ?? selectedElement.x_position}
                            onChange={(e) => {
                              const newX = snapToGrid
                                ? Math.round((e.value ?? 0) / gridSize) * gridSize
                                : e.value ?? 0;
                              const newElement = { ...selectedElement, x_position: newX };
                              setSelectedElement(newElement);
                              if (selectedNodeId) {
                                setNodes(prev => prev.map(n =>
                                  n.id === selectedNodeId
                                    ? { ...n, position: { ...n.position, x: newX }, data: { ...n.data, element: newElement } }
                                    : n
                                ));
                              }
                              setHasUnsavedChanges(true);
                            }}
                            className="w-full"
                            min={0}
                            step={snapToGrid ? gridSize : 1}
                          />
                        </div>
                        <div>
                          <label className="block text-gray-400 text-xs mb-1">Y</label>
                          <InputNumber
                            value={selectedNodeData?.y ?? selectedElement.y_position}
                            onChange={(e) => {
                              const newY = snapToGrid
                                ? Math.round((e.value ?? 0) / gridSize) * gridSize
                                : e.value ?? 0;
                              const newElement = { ...selectedElement, y_position: newY };
                              setSelectedElement(newElement);
                              if (selectedNodeId) {
                                setNodes(prev => prev.map(n =>
                                  n.id === selectedNodeId
                                    ? { ...n, position: { ...n.position, y: newY }, data: { ...n.data, element: newElement } }
                                    : n
                                ));
                              }
                              setHasUnsavedChanges(true);
                            }}
                            className="w-full"
                            min={0}
                            step={snapToGrid ? gridSize : 1}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-gray-400 text-xs mb-1">Breite</label>
                          <InputNumber
                            value={selectedNodeData?.width ?? selectedElement.width}
                            onChange={(e) => {
                              const newWidth = snapToGrid
                                ? Math.round((e.value ?? 40) / gridSize) * gridSize
                                : e.value ?? 40;
                              const newElement = { ...selectedElement, width: newWidth };
                              setSelectedElement(newElement);
                              if (selectedNodeId) {
                                setNodes(prev => prev.map(n =>
                                  n.id === selectedNodeId
                                    ? {
                                        ...n,
                                        width: newWidth,
                                        style: { ...n.style, width: newWidth },
                                        data: { ...n.data, element: newElement }
                                      }
                                    : n
                                ));
                              }
                              setHasUnsavedChanges(true);
                            }}
                            className="w-full"
                            min={20}
                            step={snapToGrid ? gridSize : 1}
                          />
                        </div>
                        <div>
                          <label className="block text-gray-400 text-xs mb-1">Höhe</label>
                          <InputNumber
                            value={selectedNodeData?.height ?? selectedElement.height}
                            onChange={(e) => {
                              const newHeight = snapToGrid
                                ? Math.round((e.value ?? 20) / gridSize) * gridSize
                                : e.value ?? 20;
                              const newElement = { ...selectedElement, height: newHeight };
                              setSelectedElement(newElement);
                              if (selectedNodeId) {
                                setNodes(prev => prev.map(n =>
                                  n.id === selectedNodeId
                                    ? {
                                        ...n,
                                        height: newHeight,
                                        style: { ...n.style, height: newHeight },
                                        data: { ...n.data, element: newElement }
                                      }
                                    : n
                                ));
                              }
                              setHasUnsavedChanges(true);
                            }}
                            className="w-full"
                            min={10}
                            step={snapToGrid ? gridSize : 1}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ) : selectedWindow ? (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-white font-semibold">Fenster-Eigenschaften</h4>
                      <Button
                        icon="pi pi-save"
                        className="p-button-success p-button-sm p-button-text"
                        tooltip="Fenster-Eigenschaften speichern"
                        onClick={saveWindowProperties}
                        loading={saving}
                      />
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-gray-400 text-xs mb-1">Typ</label>
                        <InputText
                          value={WINDOW_TYPE_LABELS[selectedWindow.window_type]}
                          disabled
                          className="w-full p-inputtext-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-400 text-xs mb-1">Anzeigename</label>
                        <InputText
                          value={selectedWindow.display_name || ''}
                          onChange={(e) => updateWindowProperty('display_name', e.target.value || null)}
                          className="w-full p-inputtext-sm"
                          placeholder={WINDOW_TYPE_LABELS[selectedWindow.window_type]}
                        />
                      </div>

                      {/* Window Sizes */}
                      <div className="border-t border-gray-700 pt-3">
                        <h5 className="text-gray-300 text-sm font-medium mb-2">Standard-Größe (Default)</h5>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-gray-400 text-xs mb-1">Breite</label>
                            <InputNumber
                              value={selectedWindow.default_width}
                              onChange={(e) => updateWindowProperty('default_width', e.value ?? 800)}
                              className="w-full"
                              min={100}
                              step={10}
                            />
                          </div>
                          <div>
                            <label className="block text-gray-400 text-xs mb-1">Höhe</label>
                            <InputNumber
                              value={selectedWindow.default_height}
                              onChange={(e) => updateWindowProperty('default_height', e.value ?? 600)}
                              className="w-full"
                              min={100}
                              step={10}
                            />
                          </div>
                        </div>
                      </div>

                      <div>
                        <h5 className="text-gray-300 text-sm font-medium mb-2">Minimal-Größe</h5>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-gray-400 text-xs mb-1">Min. Breite</label>
                            <InputNumber
                              value={selectedWindow.min_width}
                              onChange={(e) => updateWindowProperty('min_width', e.value ?? 400)}
                              className="w-full"
                              min={100}
                              step={10}
                            />
                          </div>
                          <div>
                            <label className="block text-gray-400 text-xs mb-1">Min. Höhe</label>
                            <InputNumber
                              value={selectedWindow.min_height}
                              onChange={(e) => updateWindowProperty('min_height', e.value ?? 300)}
                              className="w-full"
                              min={100}
                              step={10}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Window Colors */}
                      <div className="border-t border-gray-700 pt-3 mt-3">
                        <h5 className="text-gray-300 text-sm font-medium mb-2">Fenster-Farben</h5>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-gray-400 text-xs">Hintergrund</label>
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
                            <label className="text-gray-400 text-xs">Fensterfarbe</label>
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
                            <label className="text-gray-400 text-xs">Textfarbe</label>
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
                        <h5 className="text-gray-300 text-sm font-medium mb-2">FormSet Standard-Farben</h5>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-gray-400 text-xs">Hintergrund</label>
                            <div className="flex items-center gap-2">
                              <div
                                className="w-6 h-6 rounded border border-gray-600"
                                style={{ backgroundColor: selectedFormSet.default_background_color }}
                              ></div>
                              <span className="text-gray-500 text-xs">{selectedFormSet.default_background_color}</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <label className="text-gray-400 text-xs">Fenster</label>
                            <div className="flex items-center gap-2">
                              <div
                                className="w-6 h-6 rounded border border-gray-600"
                                style={{ backgroundColor: selectedFormSet.default_window_color }}
                              ></div>
                              <span className="text-gray-500 text-xs">{selectedFormSet.default_window_color}</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <label className="text-gray-400 text-xs">Text</label>
                            <div className="flex items-center gap-2">
                              <div
                                className="w-6 h-6 rounded border border-gray-600"
                                style={{ backgroundColor: selectedFormSet.default_text_color }}
                              ></div>
                              <span className="text-gray-500 text-xs">{selectedFormSet.default_text_color}</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <label className="text-gray-400 text-xs">Button-BG</label>
                            <div className="flex items-center gap-2">
                              <div
                                className="w-6 h-6 rounded border border-gray-600"
                                style={{ backgroundColor: selectedFormSet.default_button_color }}
                              ></div>
                              <span className="text-gray-500 text-xs">{selectedFormSet.default_button_color}</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <label className="text-gray-400 text-xs">Button-Text</label>
                            <div className="flex items-center gap-2">
                              <div
                                className="w-6 h-6 rounded border border-gray-600"
                                style={{ backgroundColor: selectedFormSet.default_button_text_color }}
                              ></div>
                              <span className="text-gray-500 text-xs">{selectedFormSet.default_button_text_color}</span>
                            </div>
                          </div>
                        </div>
                        <p className="text-gray-500 text-xs mt-2 italic">
                          Standard-Farben werden im FormSet-Bearbeiten-Dialog geändert.
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-gray-500 text-center py-8">
                    <i className="pi pi-info-circle text-2xl mb-2"></i>
                    <p className="text-sm">Wählen Sie ein Element aus, um dessen Eigenschaften zu bearbeiten</p>
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
        header="Neues FormSet erstellen"
        style={{ width: '500px' }}
        modal
        contentStyle={{ backgroundColor: '#1f2937', color: 'white' }}
        headerStyle={{ backgroundColor: '#111827', color: 'white', border: 'none' }}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-gray-300 text-sm mb-1">Name *</label>
            <InputText
              value={newFormSetName}
              onChange={(e) => setNewFormSetName(e.target.value)}
              className="w-full"
              placeholder="z.B. laravel_primereact"
            />
          </div>
          <div>
            <label className="block text-gray-300 text-sm mb-1">Beschreibung</label>
            <InputTextarea
              value={newFormSetDescription}
              onChange={(e) => setNewFormSetDescription(e.target.value)}
              className="w-full"
              rows={3}
              placeholder="Optional: Beschreibung des FormSets"
            />
          </div>
          <div>
            <label className="block text-gray-300 text-sm mb-1">Sichtbarkeit</label>
            <Dropdown
              value={newFormSetVisibility}
              options={[
                { value: 'private', label: 'Privat (nur ich)' },
                { value: 'team', label: 'Team (meine Teams)' },
                { value: 'public', label: 'Öffentlich (alle)' },
              ]}
              onChange={(e) => setNewFormSetVisibility(e.value)}
              optionLabel="label"
              optionValue="value"
              className="w-full"
            />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button
              label="Abbrechen"
              className="p-button-secondary"
              onClick={() => setCreateFormSetModalVisible(false)}
            />
            <Button
              label="Erstellen"
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
        header="FormSet bearbeiten"
        style={{ width: '600px' }}
        modal
        contentStyle={{ backgroundColor: '#1f2937', color: 'white' }}
        headerStyle={{ backgroundColor: '#111827', color: 'white', border: 'none' }}
      >
        {selectedFormSet && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-300 text-sm mb-1">Name *</label>
                <InputText
                  value={selectedFormSet.name}
                  onChange={(e) => setSelectedFormSet({ ...selectedFormSet, name: e.target.value })}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-gray-300 text-sm mb-1">Sichtbarkeit</label>
                <Dropdown
                  value={selectedFormSet.visibility}
                  options={[
                    { value: 'private', label: 'Privat' },
                    { value: 'team', label: 'Team' },
                    { value: 'public', label: 'Öffentlich' },
                  ]}
                  onChange={(e) => setSelectedFormSet({ ...selectedFormSet, visibility: e.value })}
                  optionLabel="label"
                  optionValue="value"
                  className="w-full"
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-300 text-sm mb-1">Beschreibung</label>
              <InputTextarea
                value={selectedFormSet.description || ''}
                onChange={(e) => setSelectedFormSet({ ...selectedFormSet, description: e.target.value })}
                className="w-full"
                rows={2}
              />
            </div>

            {/* Default Colors Section */}
            <div className="border-t border-gray-700 pt-4">
              <h4 className="text-white font-semibold mb-3">Standard-Farben</h4>
              <p className="text-gray-400 text-xs mb-3">
                Diese Farben werden als Standard für alle Fenster verwendet, sofern nicht überschrieben.
              </p>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-300 text-sm mb-2">Hintergrund</label>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-10 h-10 rounded border-2 border-gray-600 cursor-pointer"
                      style={{ backgroundColor: selectedFormSet.default_background_color }}
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
                  <label className="block text-gray-300 text-sm mb-2">Fensterfarbe</label>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-10 h-10 rounded border-2 border-gray-600 cursor-pointer"
                      style={{ backgroundColor: selectedFormSet.default_window_color }}
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
                  <label className="block text-gray-300 text-sm mb-2">Textfarbe</label>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-10 h-10 rounded border-2 border-gray-600 cursor-pointer"
                      style={{ backgroundColor: selectedFormSet.default_text_color }}
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
                  <label className="block text-gray-300 text-sm mb-2">Button-Hintergrundfarbe</label>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-10 h-10 rounded border-2 border-gray-600 cursor-pointer"
                      style={{ backgroundColor: selectedFormSet.default_button_color }}
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
                  <label className="block text-gray-300 text-sm mb-2">Button-Textfarbe</label>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-10 h-10 rounded border-2 border-gray-600 cursor-pointer"
                      style={{ backgroundColor: selectedFormSet.default_button_text_color }}
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
            <div className="border-t border-gray-700 pt-4">
              <h4 className="text-white font-semibold mb-2">Vorschau</h4>
              <div
                className="rounded-lg p-4 border border-gray-600"
                style={{ backgroundColor: selectedFormSet.default_background_color }}
              >
                <div
                  className="rounded p-3"
                  style={{ backgroundColor: selectedFormSet.default_window_color }}
                >
                  <p style={{ color: selectedFormSet.default_text_color }} className="text-sm mb-2">
                    Beispieltext in der Fensterfarbe
                  </p>
                  <button
                    className="px-3 py-1 rounded text-sm"
                    style={{ backgroundColor: selectedFormSet.default_button_color, color: selectedFormSet.default_button_text_color }}
                  >
                    Button-Beispiel
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-gray-700">
              <Button
                label="Löschen"
                icon="pi pi-trash"
                className="p-button-danger p-button-outlined"
                onClick={() => {
                  confirmDialog({
                    message: `Möchten Sie das FormSet "${selectedFormSet.name}" wirklich löschen? Alle Fenster und Elemente werden ebenfalls gelöscht.`,
                    header: 'FormSet löschen',
                    icon: 'pi pi-exclamation-triangle',
                    acceptClassName: 'p-button-danger',
                    accept: async () => {
                      try {
                        const response = await fetch(`/api/form-sets/${selectedFormSet.id}`, {
                          method: 'DELETE',
                          headers: getAuthHeaders(),
                        });
                        if (response.ok) {
                          showToast('success', 'Gelöscht', 'FormSet wurde gelöscht');
                          setEditFormSetModalVisible(false);
                          setSelectedFormSet(null);
                          setSelectedWindow(null);
                          // Clear localStorage
                          localStorage.removeItem(STORAGE_KEY_FORMSET);
                          localStorage.removeItem(STORAGE_KEY_WINDOW);
                          loadFormSets();
                        }
                      } catch {
                        showToast('error', 'Fehler', 'Löschen fehlgeschlagen');
                      }
                    },
                  });
                }}
              />
              <div className="flex gap-2">
                <Button
                  label="Abbrechen"
                  className="p-button-secondary"
                  onClick={() => setEditFormSetModalVisible(false)}
                />
                <Button
                  label="Speichern"
                  icon="pi pi-save"
                  className="p-button-success"
                  onClick={async () => {
                    try {
                      setSaving(true);
                      const response = await fetch(`/api/form-sets/${selectedFormSet.id}`, {
                        method: 'PUT',
                        headers: getAuthHeaders(),
                        body: JSON.stringify({
                          name: selectedFormSet.name,
                          description: selectedFormSet.description,
                          visibility: selectedFormSet.visibility,
                          default_background_color: selectedFormSet.default_background_color,
                          default_window_color: selectedFormSet.default_window_color,
                          default_text_color: selectedFormSet.default_text_color,
                          default_button_color: selectedFormSet.default_button_color,
                          default_button_text_color: selectedFormSet.default_button_text_color,
                        }),
                      });
                      const data = await response.json();
                      if (data.success) {
                        showToast('success', 'Gespeichert', 'FormSet wurde aktualisiert');
                        setEditFormSetModalVisible(false);
                        loadFormSets();
                        if (data.data) {
                          setSelectedFormSet(data.data);
                        }
                      } else {
                        showToast('error', 'Fehler', data.error || 'Speichern fehlgeschlagen');
                      }
                    } catch {
                      showToast('error', 'Fehler', 'Netzwerkfehler');
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
        header="Form Designer freischalten"
        style={{ width: '500px' }}
        modal
        contentStyle={{ backgroundColor: '#1f2937', color: 'white' }}
        headerStyle={{ backgroundColor: '#111827', color: 'white', border: 'none' }}
      >
        <div className="space-y-6">
          {/* Info Section */}
          <div className="text-center">
            <i className="pi pi-lock text-5xl text-yellow-400 mb-4"></i>
            <h3 className="text-xl font-bold text-white mb-2">Feature freischalten</h3>
            <p className="text-gray-300 text-sm">
              Der Form Designer ermöglicht es Ihnen, visuelle Formular-Vorlagen für Ihre Projekte zu erstellen.
              Gestalten Sie Fenster, Buttons, Container und mehr per Drag & Drop.
            </p>
          </div>

          {/* Pricing Info */}
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-gray-400">Kosten:</span>
              <span className="text-xl font-bold text-blue-400">
                {accessStatus?.unlock_cost || 50} Credits / Jahr
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Ihre Credits:</span>
              <span className={`text-xl font-bold ${(accessStatus?.user_credits || 0) >= (accessStatus?.unlock_cost || 50) ? 'text-green-400' : 'text-red-400'}`}>
                {accessStatus?.user_credits || 0} Credits
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          {(accessStatus?.user_credits || 0) >= (accessStatus?.unlock_cost || 50) ? (
            <div className="space-y-3">
              <Button
                label="Jetzt freischalten (50 Credits)"
                icon="pi pi-unlock"
                className="p-button-success w-full"
                onClick={async () => {
                  try {
                    setUnlocking(true);
                    const response = await fetch('/api/form-designer/unlock', {
                      method: 'POST',
                      headers: getAuthHeaders(),
                    });
                    const data = await response.json();
                    if (data.success) {
                      showToast('success', 'Erfolgreich', data.message || 'Form Designer freigeschaltet!');
                      setUnlockModalVisible(false);
                      // Refresh access status
                      await checkAccess();
                      // Open the create modal
                      setCreateFormSetModalVisible(true);
                    } else {
                      showToast('error', 'Fehler', data.error || 'Freischaltung fehlgeschlagen');
                    }
                  } catch (error) {
                    console.error('Unlock failed:', error);
                    showToast('error', 'Fehler', 'Netzwerkfehler bei Freischaltung');
                  } finally {
                    setUnlocking(false);
                  }
                }}
                loading={unlocking}
              />
              <p className="text-gray-500 text-xs text-center">
                Die Freischaltung gilt für 1 Jahr und kann danach verlängert werden.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-red-900/30 border border-red-700 rounded-lg p-3 text-center">
                <p className="text-red-400 text-sm">
                  Sie benötigen noch <strong>{(accessStatus?.unlock_cost || 50) - (accessStatus?.user_credits || 0)} Credits</strong>.
                </p>
              </div>

              <div className="border-t border-gray-700 pt-4">
                <p className="text-gray-400 text-sm text-center mb-3">Credits kaufen mit:</p>
                <div className="flex gap-3">
                  <Button
                    label="Stripe"
                    icon="pi pi-credit-card"
                    className="p-button-info flex-1"
                    onClick={() => {
                      setUnlockModalVisible(false);
                      onOpenPanel?.('credits-purchase', { provider: 'stripe' });
                    }}
                  />
                  <Button
                    label="PayPal"
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
          <div className="border-t border-gray-700 pt-4 text-center">
            <p className="text-gray-500 text-xs">
              <i className="pi pi-star text-yellow-400 mr-1"></i>
              Patron Monthly-Mitglieder haben kostenlosen Zugang zu allen Features.
            </p>
          </div>

          {/* Cancel Button */}
          <div className="flex justify-end">
            <Button
              label="Abbrechen"
              className="p-button-secondary"
              onClick={() => setUnlockModalVisible(false)}
            />
          </div>
        </div>
      </Dialog>
    </TabContent>
  );
}
