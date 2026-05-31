// resources/js/Components/Panels/FormLayoutDesignerPanel.tsx - Visual Form Layout Designer
import React, { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import FormLivePreviewModal from './FormLivePreviewModal';
import AnchorSection from './AnchorSection';
import FormTableGridNode from './FormTableGridNode';
import type { FormTableGridNodeData, FormTableColumn } from './FormTableGridNode';
import { Button } from 'primereact/button';
import { Menu } from 'primereact/menu';
import TabOrderModal from '../Modals/TabOrderModal';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Checkbox } from 'primereact/checkbox';
import { Toast } from 'primereact/toast';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Dialog } from 'primereact/dialog';
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
  useReactFlow,
  ReactFlowProvider,
  SelectionMode,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useProject } from '@/contexts/ProjectContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation, SupportedLanguage, getStoredLanguage } from '@/i18n';
import { apiClient } from '@/lib/api';

// Stable reference for ReactFlow's multiSelectionKeyCode prop — must NOT be
// recreated each render, otherwise the internal store loops on updates.
const MULTI_SELECTION_KEYS = ['Control', 'Shift', 'Meta'];

// Marquee-selection mouse routing:
//   - LEFT button (0) → lasso (selectionOnDrag)
//   - MIDDLE (1) / RIGHT (2) → pan the canvas
// Figma/Sketch-style: drag empty space with left mouse = select multiple
// controls. Dragging a node still moves it (ReactFlow auto-distinguishes
// node vs pane). Without this swap, ReactFlow's default left-drag-pans
// behaviour wins over selectionOnDrag and the lasso is unreachable.
// Plain number[] (not readonly tuple) — ReactFlow's panOnDrag prop expects
// a mutable array type. Module-level const keeps the reference stable.
const PAN_ON_DRAG_BUTTONS: number[] = [1, 2];

// ========== INTERFACES ==========

interface FormSet {
  id: number;
  name: string;
  description?: string;
  creator_user_id: number;
  visibility: 'private' | 'team' | 'public';
  default_background_color: string;
  default_window_color: string;
  default_text_color: string;
  default_button_color: string;
  default_button_text_color: string;
  is_active: boolean;
  windows?: FormWindow[];
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
  container_orientation?: string;
  max_fields?: number;
  container_gap?: number;
  container_columns?: number;
  button_label?: string;
  button_icon?: string;
  button_action?: string;
  button_background_color?: string;
  button_text_color?: string;
  tab_label?: string;
  parent_tab_container_id?: number;
  sort_order: number;
  tab_order?: number;
  is_visible: boolean;
  default_control_height?: number;
  // WinDev-style anchors (stored as 0..100 percentages on form_elements).
  // anchor_right / _bottom shift position when the window resizes;
  // anchor_width / _height stretch the element's size. Used by the Layout
  // Designer to make the container follow the per-table window override.
  anchor_right?: number | null;
  anchor_bottom?: number | null;
  anchor_width?: number | null;
  anchor_height?: number | null;
}

interface FormFieldPlacement {
  id?: number;
  form_window_id: number;
  schema_table_id: number;
  schema_field_id: number;
  container_element_id: number;
  tab_panel_id?: number | null;
  x_position: number;
  y_position: number;
  width: number;
  height: number;
  caption_override?: string | null;
  caption_labels?: Record<string, string> | null;  // {"de": "Vorname", "en": "First Name"}
  label_position?: string | null;  // 'top', 'left', 'right'
  label_width?: number | null;     // Width in px when label_position is 'left'
  control_type_override?: string | null;  // Legacy alias
  control_type?: string | null;
  // Combobox/lookup fields
  lookup_table_id?: number | null;
  lookup_value_field?: string | null;
  lookup_display_field?: string | null;
  lookup_sort_field?: string | null;
  lookup_sort_direction?: string | null;
  sort_order: number;
  tab_order?: number;
  is_visible: boolean;
  schema_field?: SchemaField;
  // Report control styling (reuses button_* columns from form_item_placements)
  button_background_color?: string | null;  // Used as line/border/bg color for report controls
  button_text_color?: string | null;        // Used as text/font color for report controls
  button_icon?: string | null;
  // Generic style config (JSON) for font, alignment, decoration etc.
  style_config?: {
    fontSize?: number;
    fontFamily?: string;
    fontWeight?: string;    // 'normal' | 'bold'
    fontStyle?: string;     // 'normal' | 'italic'
    textDecoration?: string; // 'none' | 'underline' | 'line-through'
    textAlign?: string;     // 'left' | 'center' | 'right'
  } | null;
}

interface SchemaField {
  id: number;
  table_id: number;
  field_name: string;
  field_type: string;
  control_type?: string;
  is_primary_key?: boolean;
  is_nullable?: boolean;
  is_auto_increment?: boolean;
}

interface SchemaTableInfo {
  id: number;
  table_name: string;
  singular_name?: string;
  // User-designated "file key" — sortable business id like user_no. Used as
  // the default ORDER BY in the Live Preview's main list query so records
  // appear in a stable, user-meaningful order rather than physical InnoDB
  // insertion order. Falls back to primarykeyfield if not set.
  filekeyname?: string | null;
  primarykeyfield?: string | null;
  fields?: SchemaField[];
}

interface FloatingSchema {
  id: number;
  name: string;
  latest_version?: { id: number; version_number: number; tables?: SchemaTableInfo[] };
  versions?: Array<{ id: number; version_number: number; tables?: SchemaTableInfo[] }>;
}

// ========== NODE DATA INTERFACES ==========

interface WindowFrameNodeData {
  label: string;
  windowWidth: number;
  windowHeight: number;
  backgroundColor: string;
  windowColor: string;
  textColor: string;
  [key: string]: unknown;
}

interface ContainerFrameNodeData {
  label: string;
  elementType: string;
  columns: number;
  maxFields?: number;
  borderColor: string;
  // Tab-related fields (only populated for tab_container). The strip is
  // rendered inline in ContainerFrameNode when tabs.length > 0.
  containerElementId?: number;
  tabs?: FormLayoutTab[];
  activeTabId?: number | null;
  selectedTabId?: number | null;
  onSelectTab?: (tabId: number) => void;
  onAddTab?: () => void;
  selectedLanguage?: string | null;
  [key: string]: unknown;
}

interface FormLayoutTab {
  id: number;
  form_window_id: number;
  schema_table_id: number;
  tab_container_element_id: number;
  sort_order: number;
  tab_label: string | null;
  tab_labels: Record<string, string> | null;
}

interface ButtonPlacementData {
  id?: number;
  form_window_id: number;
  form_element_id?: number | null;
  button_type: string;
  button_label?: string | null;
  button_labels?: Record<string, string> | null;  // {"de": "Speichern", "en": "Save"}
  button_icon?: string | null;
  button_action?: string | null;
  button_background_color?: string | null;
  button_text_color?: string | null;
  x_position: number;
  y_position: number;
  width: number;
  height: number;
  sort_order: number;
  tab_order?: number;
  is_visible: boolean;
}

interface ButtonPlacementNodeData {
  buttonPlacement: ButtonPlacementData;
  buttonType: string;
  label: string;
  icon: string;
  backgroundColor: string;
  textColor: string;
  isVisible: boolean;
  [key: string]: unknown;
}

interface MenuItemPlacementData {
  id?: number;
  temp_id?: string;
  form_window_id: number;
  container_element_id?: number | null;
  schema_table_id?: number | null;
  caption_override?: string | null;
  caption_labels?: Record<string, string> | null;
  menu_icon?: string | null;
  menu_action?: string | null;
  menu_role_required?: string | null;
  menu_depth: number;
  parent_placement_id?: number | string | null;  // string for temp_ids before save
  x_position: number;
  y_position: number;
  width: number;
  height: number;
  sort_order: number;
  tab_order?: number;
  is_visible: boolean;
}

interface MenuItemNodeData {
  menuItem: MenuItemPlacementData;
  label: string;
  icon: string;
  depth: number;
  roleRequired?: string | null;
  isGroup: boolean;
  isSeparator: boolean;
  isVisible: boolean;
  tableName?: string;
  [key: string]: unknown;
}

interface FieldPlacementNodeData {
  placement: FormFieldPlacement;
  fieldName: string;
  fieldType: string;
  controlType: string;
  captionOverride?: string | null;
  labelPosition: string;
  labelWidth: number;
  isVisible: boolean;
  isSelected: boolean;
  colorBar: string;
  [key: string]: unknown;
}

// ========== HELPERS ==========

const getFieldColorBar = (fieldType: string, isPrimaryKey?: boolean): string => {
  const lower = fieldType.toLowerCase();
  if (isPrimaryKey) return '#ef4444'; // red for PK/FK
  if (lower.includes('int') || lower.includes('decimal') || lower.includes('float') || lower.includes('double') || lower.includes('numeric')) return '#22c55e';
  if (lower.includes('bool') || lower.includes('tinyint')) return '#f97316';
  if (lower.includes('date') || lower.includes('time') || lower.includes('timestamp')) return '#a855f7';
  return '#3b82f6'; // blue for string types
};

const formatFieldName = (name: string): string => {
  return name.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
};

const WINDOW_TYPE_OPTIONS = [
  { label: 'Main Menu', value: 'main_menu' },
  { label: 'Create/Edit', value: 'create_edit' },
  { label: 'Data Table', value: 'data_table' },
  // Reports removed — now handled by Report Pattern/Layout Designers
];

const BUTTON_DEFAULT_ICONS: Record<string, string> = {
  button_nav_first: 'pi-angle-double-left',
  button_nav_prev: 'pi-angle-left',
  button_nav_next: 'pi-angle-right',
  button_nav_last: 'pi-angle-double-right',
  button_save: 'pi-save',
  button_cancel: 'pi-times',
  button_close: 'pi-times',
  button_new: 'pi-plus',
  button_delete: 'pi-trash',
  button_print: 'pi-print',
  button_custom: 'pi-cog',
};

// Single hardcoded fallback if neither template button nor FormSet provides a
// color. Per-type "category colors" (green Save, red Delete, gray Cancel etc.)
// were removed — the FormSet's `default_button_color` is the single source of
// truth, so the auto-placed layout looks consistent with how it'll render at
// runtime in the generated forms.
const BUTTON_FALLBACK_COLOR = '#3b82f6';

const BUTTON_DEFAULT_LABELS: Record<string, string> = {
  button_nav_first: 'First',
  button_nav_prev: 'Previous',
  button_nav_next: 'Next',
  button_nav_last: 'Last',
  button_save: 'Save',
  button_cancel: 'Cancel',
  button_close: 'Close',
  button_new: 'New',
  button_delete: 'Delete',
  button_print: 'Print',
  button_custom: 'Custom',
};

// All available button types for the palette
const BUTTON_PALETTE = [
  { type: 'button_nav_first', category: 'navigation' },
  { type: 'button_nav_prev', category: 'navigation' },
  { type: 'button_nav_next', category: 'navigation' },
  { type: 'button_nav_last', category: 'navigation' },
  { type: 'button_save', category: 'actions' },
  { type: 'button_cancel', category: 'actions' },
  { type: 'button_close', category: 'actions' },
  { type: 'button_new', category: 'actions' },
  { type: 'button_delete', category: 'actions' },
  { type: 'button_print', category: 'actions' },
  { type: 'button_custom', category: 'actions' },
];

// Report-specific controls for report_single / report_list
const REPORT_CONTROLS = [
  { type: 'static_text', icon: 'pi-align-left', label: 'Static Text', category: 'text', defaultWidth: 300, defaultHeight: 24 },
  { type: 'heading', icon: 'pi-header', label: 'Heading', category: 'text', defaultWidth: 400, defaultHeight: 32 },
  { type: 'line_horizontal', icon: 'pi-minus', label: 'Horiz. Line', category: 'layout', defaultWidth: 400, defaultHeight: 4 },
  { type: 'line_vertical', icon: 'pi-ellipsis-v', label: 'Vert. Line', category: 'layout', defaultWidth: 4, defaultHeight: 200 },
  { type: 'box', icon: 'pi-stop', label: 'Box / Frame', category: 'layout', defaultWidth: 300, defaultHeight: 150 },
  { type: 'page_number', icon: 'pi-hashtag', label: 'Page Number', category: 'placeholders', defaultWidth: 80, defaultHeight: 20 },
  { type: 'page_date', icon: 'pi-calendar', label: 'Print Date', category: 'placeholders', defaultWidth: 120, defaultHeight: 20 },
  { type: 'page_total', icon: 'pi-sort-numeric-up', label: 'Total Pages', category: 'placeholders', defaultWidth: 80, defaultHeight: 20 },
  { type: 'image_placeholder', icon: 'pi-image', label: 'Image / Logo', category: 'media', defaultWidth: 150, defaultHeight: 80 },
];

// Menu item defaults for main_menu window type
const _MENU_DEFAULT_ICONS: Record<string, string> = {
  menu_group: 'pi-folder',
  menu_separator: 'pi-minus',
  menu_table: 'pi-table',
};

const MENU_ROLE_OPTIONS = [
  { label: 'All Users', value: null },
  { label: 'Admin Only', value: 'admin' },
  { label: 'System Only', value: 'system' },
];

// Common PrimeReact icons for menu items
const MENU_ICON_OPTIONS = [
  { label: 'pi-table', value: 'pi-table' },
  { label: 'pi-home', value: 'pi-home' },
  { label: 'pi-cog', value: 'pi-cog' },
  { label: 'pi-users', value: 'pi-users' },
  { label: 'pi-user', value: 'pi-user' },
  { label: 'pi-folder', value: 'pi-folder' },
  { label: 'pi-file', value: 'pi-file' },
  { label: 'pi-chart-bar', value: 'pi-chart-bar' },
  { label: 'pi-chart-line', value: 'pi-chart-line' },
  { label: 'pi-shopping-cart', value: 'pi-shopping-cart' },
  { label: 'pi-inbox', value: 'pi-inbox' },
  { label: 'pi-envelope', value: 'pi-envelope' },
  { label: 'pi-calendar', value: 'pi-calendar' },
  { label: 'pi-clock', value: 'pi-clock' },
  { label: 'pi-tag', value: 'pi-tag' },
  { label: 'pi-bookmark', value: 'pi-bookmark' },
  { label: 'pi-star', value: 'pi-star' },
  { label: 'pi-heart', value: 'pi-heart' },
  { label: 'pi-globe', value: 'pi-globe' },
  { label: 'pi-database', value: 'pi-database' },
  { label: 'pi-wrench', value: 'pi-wrench' },
  { label: 'pi-sliders-h', value: 'pi-sliders-h' },
  { label: 'pi-list', value: 'pi-list' },
  { label: 'pi-th-large', value: 'pi-th-large' },
  { label: 'pi-minus', value: 'pi-minus' },
  { label: 'pi-arrows-alt', value: 'pi-arrows-alt' },
];

const CONTROL_TYPE_OPTIONS = [
  { label: 'Text Input', value: 'text' },
  { label: 'Integer', value: 'integer' },
  { label: 'Float / Decimal', value: 'float' },
  { label: 'Currency', value: 'currency' },
  { label: 'Textarea', value: 'textarea' },
  { label: 'Combobox / Dropdown', value: 'combobox' },
  { label: 'Checkbox', value: 'checkbox' },
  { label: 'Date', value: 'date' },
  { label: 'Time', value: 'time' },
  { label: 'Date & Time', value: 'datetime' },
  { label: 'Color Picker', value: 'colorpicker' },
  { label: 'File / Image Upload', value: 'file' },
  { label: 'Password', value: 'password' },
  { label: 'Hidden', value: 'hidden' },
  { label: 'Read Only', value: 'readonly' },
];

// ========== CUSTOM NODES (outside component for React memo stability) ==========

const WindowFrameNode = ({ data }: { data: WindowFrameNodeData }) => {
  // Standard window frame — paper-view for report types removed (reports now
  // live under ReportPattern, see ReportLayoutDesignerPanel).
  return (
    <div
      style={{
        width: data.windowWidth,
        height: data.windowHeight,
        backgroundColor: data.backgroundColor || '#1e1e2e',
        border: `2px solid ${data.windowColor || '#3b82f6'}`,
        borderRadius: 8,
        overflow: 'hidden',
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          backgroundColor: data.windowColor || '#3b82f6',
          padding: '6px 12px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <div style={{ display: 'flex', gap: 4 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#ff5f57' }} />
          <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#febc2e' }} />
          <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#28c840' }} />
        </div>
        <span style={{ color: data.textColor || '#ffffff', fontSize: 13, fontWeight: 600 }}>
          {data.label}
        </span>
      </div>
      <div
        style={{
          padding: 8,
          fontSize: 10,
          color: data.textColor || '#ffffff',
          opacity: 0.5,
          textAlign: 'right',
        }}
      >
        {data.windowWidth} x {data.windowHeight}
      </div>
    </div>
  );
};

const ContainerFrameNode = ({ data }: { data: ContainerFrameNodeData }) => {
  const isTabContainer = data.elementType === 'tab_container';
  const tabs = Array.isArray(data.tabs) ? data.tabs : [];
  // Always render the tab strip for tab_container — even with 0 tabs we need
  // the "+" button visible so the user has a way out of the empty state.
  // (Earlier requirement was tabs.length > 0, which created a chicken-and-egg:
  // no tabs ⇒ no strip ⇒ no "+" ⇒ no way to add the first tab.)
  const showTabStrip = isTabContainer;

  // Resolve a tab's label for display: per-language > fallback string > "Tab N+1".
  const labelForTab = (tab: FormLayoutTab): string => {
    const lang = data.selectedLanguage;
    if (lang && tab.tab_labels && typeof tab.tab_labels[lang] === 'string' && tab.tab_labels[lang]) {
      return tab.tab_labels[lang];
    }
    if (tab.tab_label && tab.tab_label !== '') return tab.tab_label;
    return `Tab ${tab.sort_order + 1}`;
  };

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        border: `2px dashed ${data.borderColor || '#6b7280'}`,
        borderRadius: 6,
        backgroundColor: 'rgba(55, 65, 81, 0.15)',
        overflow: 'visible',
        // pointerEvents: 'none' on the wrapper would kill the tab clicks.
        // Children re-enable pointer events where they need to be clickable
        // (the tab strip); the empty body stays click-through so fields
        // underneath are still draggable.
        pointerEvents: showTabStrip ? 'auto' : 'none',
      }}
    >
      {showTabStrip ? (
        // Tab strip: one button per tab, plus a "+" to add.
        <div
          style={{
            backgroundColor: 'rgba(31, 41, 55, 0.85)',
            padding: '4px 6px 0 6px',
            display: 'flex',
            alignItems: 'flex-end',
            gap: 2,
            borderBottom: `1px solid ${data.borderColor || '#6b7280'}`,
            overflowX: 'auto',
            // Reserve header height ≈ 32 px (matches backend TAB_HEADER_HEIGHT)
            height: 32,
            boxSizing: 'border-box',
          }}
        >
          {tabs.map((tab) => {
            const isActive = data.activeTabId === tab.id;
            const isSelected = data.selectedTabId === tab.id;
            return (
              <button
                key={tab.id}
                onClick={(e) => {
                  e.stopPropagation();
                  data.onSelectTab?.(tab.id);
                }}
                style={{
                  padding: '4px 10px',
                  fontSize: 11,
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? '#fff' : '#9ca3af',
                  backgroundColor: isActive ? 'rgba(79, 70, 229, 0.6)' : 'rgba(55, 65, 81, 0.4)',
                  border: isSelected ? '1px solid #fbbf24' : `1px solid ${isActive ? 'rgba(79, 70, 229, 0.8)' : 'transparent'}`,
                  borderBottom: 'none',
                  borderTopLeftRadius: 4,
                  borderTopRightRadius: 4,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transform: isActive ? 'translateY(1px)' : 'translateY(0)',
                  pointerEvents: 'auto',
                }}
                title={`Tab ${tab.sort_order + 1}`}
              >
                {labelForTab(tab)}
              </button>
            );
          })}
          {tabs.length === 0 && (
            <span style={{
              fontSize: 10, color: '#6b7280', fontStyle: 'italic',
              padding: '4px 6px', pointerEvents: 'none',
            }}>
              📑 {data.label}
            </span>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              data.onAddTab?.();
            }}
            style={{
              padding: '4px 10px',
              fontSize: 12,
              color: '#9ca3af',
              backgroundColor: 'transparent',
              border: '1px dashed #4b5563',
              borderBottom: 'none',
              borderTopLeftRadius: 4,
              borderTopRightRadius: 4,
              cursor: 'pointer',
              pointerEvents: 'auto',
            }}
            title="Add tab"
          >
            +
          </button>
          <div style={{ flex: 1 }} />
          {data.maxFields != null && data.maxFields > 0 && (
            <span style={{
              fontSize: 9, backgroundColor: 'rgba(249,115,22,0.3)',
              color: '#fdba74', padding: '1px 5px', borderRadius: 3,
              marginBottom: 4, pointerEvents: 'none',
            }}>
              max: {data.maxFields}
            </span>
          )}
        </div>
      ) : (
        // Plain header for non-tab containers (unchanged classic look).
        <div
          style={{
            backgroundColor: isTabContainer ? 'rgba(79, 70, 229, 0.3)' : 'rgba(55, 65, 81, 0.4)',
            padding: '3px 8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: `1px dashed ${data.borderColor || '#6b7280'}`,
          }}
        >
          <span style={{ fontSize: 11, fontWeight: 600, color: '#d1d5db' }}>
            {isTabContainer ? '📑 ' : '📦 '}{data.label}
          </span>
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            {data.columns > 0 && (
              <span style={{
                fontSize: 9, backgroundColor: 'rgba(59,130,246,0.3)',
                color: '#93c5fd', padding: '1px 5px', borderRadius: 3,
              }}>
                {data.columns} col
              </span>
            )}
            {data.maxFields != null && data.maxFields > 0 && (
              <span style={{
                fontSize: 9, backgroundColor: 'rgba(249,115,22,0.3)',
                color: '#fdba74', padding: '1px 5px', borderRadius: 3,
              }}>
                max: {data.maxFields}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const getControlPlaceholder = (controlType: string): string => {
  switch (controlType) {
    case 'integer': return '1234';
    case 'float': case 'currency': return '1234.56';
    case 'date': return '22.03.2026';
    case 'time': return '18:42';
    case 'datetime': return '22.03.2026 18:42';
    case 'checkbox': return '';
    case 'textarea': return 'Text...';
    case 'file': return 'Choose file...';
    case 'password': return '********';
    case 'colorpicker': return '#3b82f6';
    default: return 'Text input...';
  }
};

const FieldPlacementNode = ({ data, selected }: { data: FieldPlacementNodeData; selected?: boolean }) => {
  const displayName = data.captionOverride || formatFieldName(data.fieldName);
  const opacity = data.isVisible ? 1 : 0.4;
  const controlType = data.controlType || 'text';
  const labelPos = data.labelPosition || 'top';
  const labelW = data.labelWidth || 100;
  const isCheckbox = controlType === 'checkbox';
  const isCombobox = controlType === 'combobox';
  const isColorpicker = controlType === 'colorpicker';
  const isFile = controlType === 'file';
  const isTextarea = controlType === 'textarea';
  const isLeft = labelPos === 'left';
  const isRight = labelPos === 'right'; // Only for checkboxes

  // ===== REPORT CONTROLS - special rendering =====
  const isReportControl = ['static_text', 'heading', 'line_horizontal', 'line_vertical', 'box', 'page_number', 'page_date', 'page_total', 'image_placeholder'].includes(controlType);

  if (isReportControl) {
    const text = data.captionOverride || '';
    const sc = data.placement?.style_config;
    const fontSize = sc?.fontSize || (controlType === 'heading' ? 18 : 12);
    const fontWeight = sc?.fontWeight || (controlType === 'heading' ? 'bold' : 'normal');
    const fontStyle = sc?.fontStyle || 'normal';
    const textDecoration = sc?.textDecoration || 'none';
    const textAlign = (sc?.textAlign || 'left') as 'left' | 'center' | 'right';
    const fontFamily = sc?.fontFamily || 'inherit';

    return (
      <div style={{ width: '100%', height: '100%', position: 'relative', opacity }}>
        {selected && (
          <NodeResizer color="#a855f7" isVisible={selected} minWidth={20} minHeight={4}
            handleStyle={{ width: 8, height: 8, borderRadius: 2 }} lineStyle={{ borderWidth: 2 }} />
        )}

        {/* Horizontal Line */}
        {controlType === 'line_horizontal' && (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center' }}>
            <div style={{ width: '100%', height: Math.max(1, Math.min(data.placement?.height || 2, 20)),
              backgroundColor: data.placement?.button_background_color || '#6b7280',
              borderRadius: 1,
            }} />
          </div>
        )}

        {/* Vertical Line */}
        {controlType === 'line_vertical' && (
          <div style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center' }}>
            <div style={{ width: Math.max(1, Math.min(data.placement?.width || 2, 20)), height: '100%',
              backgroundColor: data.placement?.button_background_color || '#6b7280',
              borderRadius: 1,
            }} />
          </div>
        )}

        {/* Box / Frame */}
        {controlType === 'box' && (
          <div style={{
            width: '100%', height: '100%',
            border: `${data.placement?.label_width || 1}px solid ${data.placement?.button_background_color || '#6b7280'}`,
            borderRadius: data.placement?.sort_order || 4,
            backgroundColor: data.placement?.button_text_color || 'transparent',
          }} />
        )}

        {/* Static Text */}
        {controlType === 'static_text' && (
          <div style={{
            width: '100%', height: '100%', padding: '2px 4px',
            display: 'flex', alignItems: 'center',
            justifyContent: textAlign === 'center' ? 'center' : textAlign === 'right' ? 'flex-end' : 'flex-start',
            color: data.placement?.button_text_color || '#e5e7eb',
            fontSize, fontWeight, fontStyle, textDecoration, fontFamily,
          }}>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {text || 'Static Text'}
            </span>
          </div>
        )}

        {/* Heading */}
        {controlType === 'heading' && (
          <div style={{
            width: '100%', height: '100%', padding: '2px 4px',
            display: 'flex', alignItems: 'center',
            justifyContent: textAlign === 'center' ? 'center' : textAlign === 'right' ? 'flex-end' : 'flex-start',
            color: data.placement?.button_text_color || '#ffffff',
            fontSize, fontWeight, fontStyle, textDecoration, fontFamily,
            borderBottom: '2px solid rgba(107,114,128,0.4)',
          }}>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {text || 'Heading'}
            </span>
          </div>
        )}

        {/* Page Number */}
        {controlType === 'page_number' && (
          <div style={{
            width: '100%', height: '100%', padding: '2px 4px',
            display: 'flex', alignItems: 'center',
            justifyContent: textAlign === 'center' ? 'center' : textAlign === 'right' ? 'flex-end' : 'flex-start',
            color: data.placement?.button_text_color || '#9ca3af',
            fontSize, fontWeight, fontStyle, fontFamily,
            border: '1px dashed rgba(168,85,247,0.3)', borderRadius: 3,
          }}>
            <i className="pi pi-hashtag" style={{ fontSize: 9, marginRight: 3 }} />
            {text || 'Page {n}'}
          </div>
        )}

        {/* Print Date */}
        {controlType === 'page_date' && (
          <div style={{
            width: '100%', height: '100%', padding: '2px 4px',
            display: 'flex', alignItems: 'center',
            justifyContent: textAlign === 'center' ? 'center' : textAlign === 'right' ? 'flex-end' : 'flex-start',
            color: data.placement?.button_text_color || '#9ca3af',
            fontSize, fontWeight, fontStyle, fontFamily,
            border: '1px dashed rgba(168,85,247,0.3)', borderRadius: 3,
          }}>
            <i className="pi pi-calendar" style={{ fontSize: 9, marginRight: 3 }} />
            {text || '{date}'}
          </div>
        )}

        {/* Total Pages */}
        {controlType === 'page_total' && (
          <div style={{
            width: '100%', height: '100%', padding: '2px 4px',
            display: 'flex', alignItems: 'center',
            justifyContent: textAlign === 'center' ? 'center' : textAlign === 'right' ? 'flex-end' : 'flex-start',
            color: data.placement?.button_text_color || '#9ca3af',
            fontSize, fontWeight, fontStyle, fontFamily,
            border: '1px dashed rgba(168,85,247,0.3)', borderRadius: 3,
          }}>
            <i className="pi pi-sort-numeric-up" style={{ fontSize: 9, marginRight: 3 }} />
            {text || '{pages}'}
          </div>
        )}

        {/* Image Placeholder */}
        {controlType === 'image_placeholder' && (
          <div style={{
            width: '100%', height: '100%',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column',
            border: '2px dashed rgba(168,85,247,0.3)', borderRadius: 4,
            backgroundColor: 'rgba(168,85,247,0.05)',
            color: '#a855f7', gap: 4,
          }}>
            <i className="pi pi-image" style={{ fontSize: 20, opacity: 0.5 }} />
            <span style={{ fontSize: 9 }}>Image / Logo</span>
          </div>
        )}

        {/* Control type label */}
        <span style={{
          position: 'absolute', top: -14, right: 2,
          fontSize: 8, backgroundColor: 'rgba(168,85,247,0.2)', color: '#c084fc',
          padding: '0px 4px', borderRadius: 2,
        }}>
          {controlType}
        </span>
      </div>
    );
  }

  // ===== NORMAL FIELD RENDERING =====
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: isLeft || isRight ? 'row' : 'column',
        borderRadius: 4,
        border: selected ? '2px solid #fbbf24' : '1px solid rgba(107,114,128,0.3)',
        backgroundColor: 'rgba(30, 30, 46, 0.85)',
        overflow: 'hidden',
        opacity,
        padding: 4,
        gap: 2,
      }}
    >
      {selected && (
        <NodeResizer
          color="#fbbf24"
          isVisible={selected}
          minWidth={40}
          minHeight={10}
          handleStyle={{ width: 8, height: 8, borderRadius: 2 }}
          lineStyle={{ borderWidth: 2 }}
        />
      )}

      {/* Type badge - top right */}
      <span style={{
        position: 'absolute', top: 2, right: 4,
        fontSize: 8, backgroundColor: 'rgba(107,114,128,0.3)', color: '#9ca3af',
        padding: '0px 3px', borderRadius: 2,
      }}>
        {data.fieldType}
      </span>

      {/* Color bar left */}
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0, width: 3,
        backgroundColor: data.colorBar, borderRadius: '4px 0 0 4px',
      }} />

      {/* CHECKBOX layout */}
      {isCheckbox ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '2px 6px', flex: 1 }}>
          {isRight ? null : (
            <span style={{ fontSize: 11, color: '#e5e7eb', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {displayName}
            </span>
          )}
          <div style={{
            width: 16, height: 16, border: '2px solid #6b7280', borderRadius: 3,
            backgroundColor: 'rgba(59,130,246,0.2)', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ color: '#3b82f6', fontSize: 11, fontWeight: 700 }}>✓</span>
          </div>
          {isRight ? (
            <span style={{ fontSize: 11, color: '#e5e7eb', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {displayName}
            </span>
          ) : null}
        </div>
      ) : (
        <>
          {/* Label */}
          {!isRight && (
            <div style={{
              ...(isLeft ? { width: labelW, flexShrink: 0, display: 'flex', alignItems: 'center' } : {}),
              paddingLeft: 6,
            }}>
              <span style={{
                fontSize: 11, color: '#e5e7eb', fontWeight: 500,
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                display: 'block',
              }}>
                {displayName}
              </span>
            </div>
          )}

          {/* Input visualization */}
          <div style={{
            flex: 1, display: 'flex', alignItems: 'center',
            paddingLeft: isLeft ? 0 : 6, paddingRight: 4,
          }}>
            {isColorpicker ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1 }}>
                <div style={{
                  width: 22, height: 18, borderRadius: 3,
                  backgroundColor: '#3b82f6', border: '1px solid rgba(107,114,128,0.5)',
                }} />
                <div style={{
                  flex: 1, height: 22, borderRadius: 3,
                  backgroundColor: 'rgba(17,24,39,0.6)', border: '1px solid rgba(107,114,128,0.4)',
                  display: 'flex', alignItems: 'center', paddingLeft: 6,
                }}>
                  <span style={{ fontSize: 10, color: '#6b7280' }}>#3b82f6</span>
                </div>
              </div>
            ) : isFile ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1 }}>
                <div style={{
                  height: 22, borderRadius: 3, padding: '0 8px',
                  backgroundColor: 'rgba(59,130,246,0.2)', border: '1px solid rgba(59,130,246,0.4)',
                  display: 'flex', alignItems: 'center',
                }}>
                  <span style={{ fontSize: 10, color: '#93c5fd' }}>Browse...</span>
                </div>
                <span style={{ fontSize: 10, color: '#6b7280' }}>No file</span>
              </div>
            ) : isTextarea ? (
              <div style={{
                flex: 1, height: '100%', minHeight: 36, borderRadius: 3,
                backgroundColor: 'rgba(17,24,39,0.6)', border: '1px solid rgba(107,114,128,0.4)',
                padding: '3px 6px',
              }}>
                <span style={{ fontSize: 10, color: '#6b7280' }}>Text...</span>
              </div>
            ) : (
              <div style={{
                flex: 1, height: 22, borderRadius: 3,
                backgroundColor: 'rgba(17,24,39,0.6)', border: '1px solid rgba(107,114,128,0.4)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                paddingLeft: 6, paddingRight: isCombobox ? 0 : 6,
              }}>
                <span style={{ fontSize: 10, color: '#6b7280' }}>
                  {getControlPlaceholder(controlType)}
                </span>
                {isCombobox && (
                  <div style={{
                    width: 20, height: '100%',
                    backgroundColor: 'rgba(107,114,128,0.3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    borderLeft: '1px solid rgba(107,114,128,0.4)',
                    borderRadius: '0 3px 3px 0',
                  }}>
                    <span style={{ fontSize: 8, color: '#9ca3af' }}>▼</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

const ButtonPlacementNode = ({ data, selected }: { data: ButtonPlacementNodeData; selected?: boolean }) => {
  const opacity = data.isVisible ? 1 : 0.4;
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        borderRadius: 5,
        border: selected ? '2px solid #fbbf24' : '1px solid rgba(255,255,255,0.2)',
        backgroundColor: data.backgroundColor || '#3b82f6',
        color: data.textColor || '#ffffff',
        fontSize: 12,
        fontWeight: 600,
        cursor: 'grab',
        opacity,
        padding: '0 10px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
      }}
    >
      {selected && (
        <NodeResizer
          color="#fbbf24"
          isVisible={selected}
          minWidth={60}
          minHeight={28}
          handleStyle={{ width: 8, height: 8, borderRadius: 2 }}
          lineStyle={{ borderWidth: 2 }}
        />
      )}
      {data.icon && <i className={`pi ${data.icon}`} style={{ fontSize: 12 }} />}
      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {data.label}
      </span>
    </div>
  );
};

// Collapsible section for sidebar palette
const CollapsibleSection: React.FC<{
  title: string;
  defaultOpen?: boolean;
  colors: any;
  children: React.ReactNode;
}> = ({ title, defaultOpen = true, colors, children }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div>
      <div
        onClick={() => setIsOpen(!isOpen)}
        style={{
          padding: '6px 10px',
          fontSize: 12,
          fontWeight: 600,
          color: colors.textSecondary,
          borderBottom: `1px solid ${colors.borderPrimary}`,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          userSelect: 'none',
        }}
      >
        <span>{title}</span>
        <i className={`pi ${isOpen ? 'pi-chevron-down' : 'pi-chevron-right'}`} style={{ fontSize: 10, color: colors.textMuted }} />
      </div>
      {isOpen && <div style={{ padding: 6 }}>{children}</div>}
    </div>
  );
};

// ========== MENU ITEM NODE ==========

const MenuItemNode = React.memo(({ data, selected }: { data: MenuItemNodeData; selected?: boolean }) => {
  const { label, icon, depth, roleRequired, isGroup, isSeparator, isVisible } = data;

  if (isSeparator) {
    return (
      <div style={{
        width: '100%', height: '100%', display: 'flex', alignItems: 'center',
        paddingLeft: depth * 20 + 8, opacity: isVisible ? 1 : 0.4,
        border: selected ? '1px dashed #3b82f6' : '1px dashed transparent',
        borderRadius: 4,
      }}>
        <i className="pi pi-arrows-v" style={{ fontSize: 10, color: '#555', marginRight: 6 }} />
        <div style={{ flex: 1, height: 1, backgroundColor: selected ? '#3b82f6' : '#555' }} />
        <NodeResizer isVisible={selected} minWidth={100} minHeight={20} />
      </div>
    );
  }

  return (
    <div style={{
      width: '100%', height: '100%', display: 'flex', alignItems: 'center', gap: 6,
      paddingLeft: depth * 20 + 4, paddingRight: 8,
      backgroundColor: selected ? 'rgba(59,130,246,0.25)' : (isGroup ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)'),
      border: selected ? '1px solid rgba(59,130,246,0.6)' : '1px solid transparent',
      borderLeft: selected ? '3px solid #3b82f6' : (isGroup ? '3px solid #f59e0b' : '3px solid transparent'),
      borderRadius: 4, cursor: 'grab', opacity: isVisible ? 1 : 0.4,
      fontWeight: isGroup ? 600 : 400, fontSize: isGroup ? 13 : 12,
      color: selected ? '#ffffff' : '#e0e0e0',
      transition: 'background-color 0.1s, border 0.1s',
    }}>
      <i className="pi pi-arrows-v" style={{ fontSize: 9, color: '#555', cursor: 'grab' }} />
      <i className={`pi ${icon}`} style={{ fontSize: 13, color: isGroup ? '#f59e0b' : '#94a3b8' }} />
      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
      {roleRequired && (
        <span style={{ fontSize: 9, padding: '1px 4px', borderRadius: 3, backgroundColor: roleRequired === 'system' ? '#7c3aed' : '#d97706', color: '#fff' }}>
          {roleRequired}
        </span>
      )}
      <NodeResizer isVisible={selected} minWidth={100} minHeight={20} />
    </div>
  );
});
MenuItemNode.displayName = 'MenuItemNode';

// Node types registry - defined outside the component
const nodeTypes = {
  windowFrame: WindowFrameNode,
  containerFrame: ContainerFrameNode,
  fieldPlacement: FieldPlacementNode,
  buttonPlacement: ButtonPlacementNode,
  menuItemNode: MenuItemNode,
  formTableGrid: FormTableGridNode,
};

// ========== FIELD TYPE ICON ==========

const FieldTypeIcon: React.FC<{ fieldType: string; isPK?: boolean }> = ({ fieldType, isPK }) => {
  const color = getFieldColorBar(fieldType, isPK);
  let icon = 'pi-align-left';
  const lower = fieldType.toLowerCase();
  if (isPK) icon = 'pi-key';
  else if (lower.includes('int') || lower.includes('decimal') || lower.includes('float') || lower.includes('double')) icon = 'pi-hashtag';
  else if (lower.includes('bool') || lower.includes('tinyint')) icon = 'pi-check-square';
  else if (lower.includes('date') || lower.includes('time')) icon = 'pi-calendar';
  else if (lower.includes('text') || lower.includes('longtext') || lower.includes('mediumtext')) icon = 'pi-file';

  return <i className={`pi ${icon}`} style={{ color, fontSize: 12 }} />;
};

// ========== PROPS ==========

interface FormLayoutDesignerPanelProps {
  onOpenPanel?: (panelId: string, data?: Record<string, unknown>) => void;
}

// ========== INNER COMPONENT (needs ReactFlowProvider wrapper) ==========

const FormLayoutDesignerInner: React.FC<FormLayoutDesignerPanelProps> = ({ onOpenPanel: _onOpenPanel }) => {
  const [currentLanguage] = useState<SupportedLanguage>(getStoredLanguage());
  const { t } = useTranslation(currentLanguage);
  const { colors } = useTheme();
  const { selectedProject } = useProject();
  const toast = useRef<Toast>(null);
  const reactFlowInstance = useReactFlow();

  // Read pre-selection from localStorage (set by FormSet Management or Form Designer)
  const formPreselect = useMemo(() => {
    try {
      const raw = localStorage.getItem('form_layout_preselect');
      if (raw) {
        const data = JSON.parse(raw);
        if (data.timestamp && Date.now() - data.timestamp < 5000) {
          localStorage.removeItem('form_layout_preselect');
          return data as { formSetId?: number; windowType?: string; language?: string };
        }
        localStorage.removeItem('form_layout_preselect');
      }
    } catch { /* ignore */ }
    return null;
  }, []);

  // ---- Toolbar state ----
  const [formSets, setFormSets] = useState<FormSet[]>([]);
  const [selectedFormSetId, setSelectedFormSetId] = useState<number | null>(formPreselect?.formSetId || null);
  const [selectedWindowType, setSelectedWindowType] = useState<string | null>(formPreselect?.windowType || null);
  const [schemas, setSchemas] = useState<FloatingSchema[]>([]);
  const [selectedSchemaId, setSelectedSchemaId] = useState<number | null>(null);
  const [tables, setTables] = useState<SchemaTableInfo[]>([]);
  const [selectedTableId, setSelectedTableId] = useState<number | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(formPreselect?.language || null);

  // ---- Data state ----
  const [currentFormSet, setCurrentFormSet] = useState<FormSet | null>(null);
  const [currentWindow, setCurrentWindow] = useState<FormWindow | null>(null);
  const [currentFields, setCurrentFields] = useState<SchemaField[]>([]);
  const [placements, setPlacements] = useState<FormFieldPlacement[]>([]);
  const [buttonPlacements, setButtonPlacements] = useState<ButtonPlacementData[]>([]);
  const [menuPlacements, setMenuPlacements] = useState<MenuItemPlacementData[]>([]);
  const [selectedPlacementId, setSelectedPlacementId] = useState<number | null>(null);
  const [selectedButtonNodeId, setSelectedButtonNodeId] = useState<string | null>(null);
  const [selectedMenuNodeId, setSelectedMenuNodeId] = useState<string | null>(null);
  // Tab state: persistent tabs for current (window × table), keyed by container
  // element id → active tab id. selectedTabId controls the properties panel.
  const [layoutTabs, setLayoutTabs] = useState<FormLayoutTab[]>([]);
  const [activeTabByContainer, setActiveTabByContainer] = useState<Record<number, number>>({});
  const [selectedTabId, setSelectedTabId] = useState<number | null>(null);
  // Tab Order: ordered multi-selection of placement DB ids in click order
  const [orderedSelection, setOrderedSelection] = useState<number[]>([]);
  // Parallel selection tracker by ReactFlow node id (string) — required for
  // unsaved buttons/fields/menus that don't have a DB id yet so they would
  // otherwise be invisible to orderedSelection's number[] path. Multi-edit
  // (W/H/Anchor) reads from this so 4 freshly-dropped buttons can still be
  // edited as a group.
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);
  const [tabOrderModalVisible, setTabOrderModalVisible] = useState(false);
  const tabOrderMenuRef = useRef<Menu>(null);
  // Stable callback ref for ReactFlow's onPaneClick — inline arrows would be a
  // new function each render and trigger ReactFlow's StoreUpdater into a loop.
  const handlePaneClick = useCallback(() => {
    setOrderedSelection((prev) => (prev.length === 0 ? prev : []));
    setSelectedNodeIds((prev) => (prev.length === 0 ? prev : []));
  }, []);
  // Stable references for ReactFlow's array/object props (snapGrid, fitViewOptions).
  // Inline literals would be re-created each render and feed ReactFlow's
  // StoreUpdater into an infinite loop after our orderedSelection-driven rebuilds.
  const snapGridRef = useMemo<[number, number]>(() => {
    const g = selectedProject?.form_designer_grid_size || 10;
    return [g, g];
  }, [selectedProject?.form_designer_grid_size]);
  const fitViewOptionsRef = useMemo(() => ({ padding: 0.15 }), []);
  const [showContainerSettings, setShowContainerSettings] = useState(false);
  const [showLivePreview, setShowLivePreview] = useState(false);

  // Schema tables for menu stash
  const [schemaTables, setSchemaTables] = useState<Array<{ id: number; table_name: string; singular_name?: string; caption?: string }>>([]);
  const [hoveredStashId, setHoveredStashId] = useState<string | null>(null);
  const [pressedStashId, setPressedStashId] = useState<string | null>(null);
  const dragImageRef = useRef<HTMLDivElement | null>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [dragOverMenuIdx, setDragOverMenuIdx] = useState<number | null>(null);
  const [_menuDragIdx, setMenuDragIdx] = useState<number | null>(null);

  // Live geometry tracking for the properties panel (updated on mouse drag/resize without full node rebuild)
  const [liveGeometry, setLiveGeometry] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const suppressDeselect = useRef(false); // Prevent deselection during language switch

  // ---- UI state ----
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  // Live-geometry tick: incremented after every drag/resize end so
  // buildAllNodes re-runs and the container auto-grow picks up the new
  // field positions from placementsRef. Without this, the container only
  // refits on Save (when `placements` state updates), and the user sees
  // the container border lag behind their drag.
  const [geometryTick, setGeometryTick] = useState(0);

  // ---- Layout Designer Defaults (Zahnrad-Settings) ----
  // Persisted in localStorage so the user doesn't have to re-set them every
  // session. Window dimensions are NOT persisted here — they live on the
  // FormWindow itself (default_width/default_height) and get saved through
  // the dedicated API on dialog confirm.
  const SETTINGS_LS_KEY = 'form_layout_designer_defaults_v1';
  type DesignerDefaults = {
    labelPosition: 'top' | 'left';
    controlHeight: number;
    gap: number;
  };
  const readDesignerDefaults = (): DesignerDefaults => {
    try {
      const raw = localStorage.getItem(SETTINGS_LS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          labelPosition: parsed.labelPosition === 'left' ? 'left' : 'top',
          controlHeight: Number.isFinite(parsed.controlHeight) && parsed.controlHeight > 0 ? Number(parsed.controlHeight) : 56,
          gap: Number.isFinite(parsed.gap) && parsed.gap >= 0 ? Number(parsed.gap) : 8,
        };
      }
    } catch { /* corrupted localStorage — fall through to defaults */ }
    return { labelPosition: 'top', controlHeight: 56, gap: 8 };
  };
  const [designerDefaults, setDesignerDefaults] = useState<DesignerDefaults>(readDesignerDefaults);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  // Draft state while editing the dialog — applied only on "Save"
  const [draftSettings, setDraftSettings] = useState<DesignerDefaults & { windowWidth: number; windowHeight: number }>({
    labelPosition: 'top',
    controlHeight: 56,
    gap: 8,
    windowWidth: 800,
    windowHeight: 600,
  });

  // ---- Per-Layout Dimension Override ----
  // Window width/height that this PARTICULAR table's layout uses, stored in
  // form_table_layouts. Null means "no override → fall back to the FormWindow
  // template's default_width/height". Changing this MUST NOT touch the
  // template, so multiple tables sharing the same window can have different
  // layout dimensions.
  const [tableLayoutOverride, setTableLayoutOverride] = useState<{ width: number | null; height: number | null } | null>(null);

  // Effective dimensions used for rendering this layout: per-table override
  // wins, else FormWindow template default. The TEMPLATE itself is never
  // changed from here — that would propagate to every other table sharing
  // the same window.
  const effectiveWindowWidth = useMemo(
    () => tableLayoutOverride?.width ?? currentWindow?.default_width ?? 800,
    [tableLayoutOverride, currentWindow]
  );
  const effectiveWindowHeight = useMemo(
    () => tableLayoutOverride?.height ?? currentWindow?.default_height ?? 600,
    [tableLayoutOverride, currentWindow]
  );

  // ---- ReactFlow state ----
  const [nodes, setNodes, onNodesChange] = useNodesState([] as Node[]);
  const [edges, , onEdgesChange] = useEdgesState([] as Edge[]);

  // ---- Derived data ----
  const placedFieldIds = useMemo(() => {
    return new Set(placements.map((p) => p.schema_field_id));
  }, [placements]);

  const selectedPlacement = useMemo(() => {
    if (selectedPlacementId == null) return null;
    return placements.find((p) => Number(p.id) === Number(selectedPlacementId) || Number(p.schema_field_id) === Number(selectedPlacementId)) || null;
  }, [placements, selectedPlacementId]);

  const selectedButton = useMemo(() => {
    if (selectedButtonNodeId == null) return null;
    // Match by node ID format: "button-{id|type}-{sort}"
    return buttonPlacements.find((b) => {
      const nodeId = `button-${b.id || b.button_type}-${b.sort_order}`;
      return nodeId === selectedButtonNodeId;
    }) || null;
  }, [buttonPlacements, selectedButtonNodeId]);

  const selectedMenuItem = useMemo(() => {
    if (selectedMenuNodeId == null) return null;
    return menuPlacements.find((m) => `menu-${m.id || m.temp_id}` === selectedMenuNodeId) || null;
  }, [menuPlacements, selectedMenuNodeId]);

  // Track which button types are already placed (for palette dimming)
  const placedButtonTypes = useMemo(() => {
    return new Set(buttonPlacements.map((b) => b.button_type));
  }, [buttonPlacements]);

  const enabledLanguages = useMemo(() => {
    if (!selectedProject?.enabled_languages) return [];
    return selectedProject.enabled_languages.map((code: string) => ({ label: code.toUpperCase(), value: code }));
  }, [selectedProject]);

  const containerElements = useMemo(() => {
    if (!currentWindow?.elements) return [];
    return currentWindow.elements.filter(
      (el) => el.element_type === 'container' || el.element_type === 'tab_container' || el.element_type === 'tab_panel' || el.element_type === 'menu_container'
    );
  }, [currentWindow]);

  // Detect horizontal vs vertical menu layout based on menu_container dimensions
  const isMenuHorizontal = useMemo(() => {
    if (!currentWindow?.elements) return false;
    const mc = currentWindow.elements.find((el: any) => el.element_type === 'menu_container');
    if (!mc) return false;
    return (mc.width || 200) > (mc.height || 400);
  }, [currentWindow]);

  // Detect if vertical menu is on the right side of the window
  const isMenuRightAligned = useMemo(() => {
    if (!currentWindow?.elements || isMenuHorizontal) return false;
    const mc = currentWindow.elements.find((el: any) => el.element_type === 'menu_container');
    if (!mc) return false;
    const winW = currentWindow.default_width || 800;
    return (mc.x_position || 0) > winW / 2;
  }, [currentWindow, isMenuHorizontal]);

  // ========== LOAD FORM SETS ==========

  const loadFormSets = useCallback(async () => {
    try {
      const data = await apiClient.get('/form-sets');
      const list = Array.isArray(data) ? data : (data.data || []);
      setFormSets(list);
    } catch {
      // silent
    }
  }, []);

  // ========== LOAD SCHEMAS ==========

  const loadSchemas = useCallback(async () => {
    if (!selectedProject) return;
    try {
      const data = await apiClient.get(`/projects/${selectedProject.id}/schemas`);
      setSchemas(Array.isArray(data) ? data : (data.data || []));
    } catch {
      // silent
    }
  }, [selectedProject]);

  // ========== LOAD TABLES FOR SCHEMA ==========

  const loadTablesForSchema = useCallback(async (schemaId: number) => {
    try {
      // Step 1: Get versions for the schema
      const versionsData = await apiClient.get(`/floating-schemas/${schemaId}/versions`);
      const versions = Array.isArray(versionsData) ? versionsData : (versionsData.data || versionsData.versions || []);
      if (versions.length === 0) {
        setTables([]);
        return;
      }
      // Find latest version
      const latestVersion = versions.reduce((a: { id: number; version_number: number }, b: { id: number; version_number: number }) =>
        Number(a.version_number) > Number(b.version_number) ? a : b
      , versions[0]);

      // Step 2: Load tables for this version (versions endpoint does NOT include tables)
      try {
        const tablesData = await apiClient.get(`/schema-versions/${latestVersion.id}/tables`);
        const tablesArray = Array.isArray(tablesData) ? tablesData : (tablesData.data || []);
        setTables(tablesArray);
      } catch {
        setTables([]);
      }
    } catch {
      setTables([]);
    }
  }, []);

  // ========== LOAD LAYOUT TABS ==========

  // Pulls all FormLayoutTab rows for the current (window × table) and sets
  // the first tab per tab_container as the active one. Safe to call on
  // any window type — main_menu / data_table returns an empty list and
  // the rest of the component degrades gracefully.
  const loadLayoutTabs = useCallback(async (windowId: number, tableId: number) => {
    try {
      const resp: any = await apiClient.get(`/form-windows/${windowId}/tables/${tableId}/tabs`);
      const tabs: FormLayoutTab[] = Array.isArray(resp) ? resp : (resp.data || []);
      setLayoutTabs(tabs);
      // Pick the first tab per container as active. Without this default,
      // a tab_container with 3 tabs would render an empty body until the
      // user clicks a header.
      const active: Record<number, number> = {};
      for (const tab of tabs) {
        if (active[tab.tab_container_element_id] === undefined) {
          active[tab.tab_container_element_id] = tab.id;
        }
      }
      setActiveTabByContainer(active);
      setSelectedTabId(null);
    } catch {
      setLayoutTabs([]);
      setActiveTabByContainer({});
      setSelectedTabId(null);
    }
  }, []);

  // ========== LOAD PLACEMENTS ==========

  const loadPlacements = useCallback(async (windowId: number, tableId: number) => {
    try {
      if (selectedWindowType === 'main_menu') {
        // Main menu: only load menu items (no fields/buttons)
        setPlacements([]);
        setButtonPlacements([]);
        try {
          const menuData = await apiClient.get(`/form-layout/${windowId}/menu-items`);
          setMenuPlacements(menuData.data || []);
        } catch {
          setMenuPlacements([]);
        }
      } else {
        // Other window types: load field + button placements
        setMenuPlacements([]);
        const fieldP = apiClient.get(`/form-layout/${windowId}/placements?table_id=${tableId}`)
          .then((data: any) => setPlacements(Array.isArray(data) ? data : (data.data || [])))
          .catch(() => setPlacements([]));
        const btnP = apiClient.get(`/form-layout/${windowId}/buttons`)
          .then((btnData: any) => setButtonPlacements(Array.isArray(btnData) ? btnData : (btnData.data || [])))
          .catch(() => setButtonPlacements([]));
        await Promise.all([fieldP, btnP]);
      }
    } catch {
      setPlacements([]);
      setButtonPlacements([]);
      setMenuPlacements([]);
    }
  }, [selectedWindowType]);

  // ========== TAB CRUD ==========
  // Declared after loadPlacements so handleDeleteTab can include it in its
  // deps without hitting the TDZ during the initial render. JavaScript hoists
  // `const` declarations but leaves them in the temporal dead zone until
  // evaluation, so a useCallback dep referencing an undeclared-as-of-here
  // const would throw at registration time.

  // Activate a tab AND open its properties panel. Both pieces of state are
  // updated together — clicking a tab header is a navigation gesture and an
  // edit gesture rolled into one. Deselects other element kinds so the
  // properties pane shows the tab, not whatever was selected before.
  const handleSelectTab = useCallback((tabId: number) => {
    const tab = layoutTabs.find((t) => t.id === tabId);
    if (!tab) return;
    setActiveTabByContainer((prev) => ({
      ...prev,
      [tab.tab_container_element_id]: tabId,
    }));
    setSelectedTabId(tabId);
    setSelectedPlacementId(null);
    setSelectedButtonNodeId(null);
    setSelectedMenuNodeId(null);
  }, [layoutTabs]);

  // Create a new tab for a given tab_container via the API and add it to
  // local state. The backend assigns sort_order = max+1, so the new tab
  // lands at the right end of the strip. We immediately activate it (so
  // the user sees the empty panel they just created) and open its
  // properties for labeling.
  const handleAddTab = useCallback(async (containerElementId: number) => {
    if (!currentWindow?.id || selectedTableId == null) return;
    try {
      const resp: any = await apiClient.post(
        `/form-windows/${currentWindow.id}/tables/${selectedTableId}/tabs`,
        { tab_container_element_id: containerElementId }
      );
      const newTab: FormLayoutTab = resp.data || resp;
      setLayoutTabs((prev) => [...prev, newTab]);
      setActiveTabByContainer((prev) => ({ ...prev, [containerElementId]: newTab.id }));
      setSelectedTabId(newTab.id);
      setSelectedPlacementId(null);
      setSelectedButtonNodeId(null);
      setSelectedMenuNodeId(null);
      // Tabs persist immediately via the API call, but we still mark the
      // window as dirty so the Save button turns green — the user expects
      // visual feedback that *anything* changed, and clicking Save then
      // commits whatever pending placement edits exist (no-op for tabs).
      setHasUnsavedChanges(true);
    } catch (err) {
      toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Failed to add tab: ' + String(err), life: 4000 });
    }
  }, [currentWindow, selectedTableId]);

  // Update a tab's label / per-language map. Optimistically updates local
  // state, then PATCHes. The optimistic update keeps the strip / properties
  // panel responsive without a round-trip wait.
  const handleUpdateTab = useCallback(async (tabId: number, updates: Partial<FormLayoutTab>) => {
    setLayoutTabs((prev) => prev.map((t) => (t.id === tabId ? { ...t, ...updates } : t)));
    setHasUnsavedChanges(true);
    try {
      await apiClient.patch(`/form-layout-tabs/${tabId}`, updates);
    } catch (err) {
      toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Failed to save tab: ' + String(err), life: 4000 });
    }
  }, []);

  // Delete a tab. Fields whose tab_panel_id pointed at this tab get nulled
  // by the FK onDelete=set null — they become "tab-less" until the user
  // moves them or re-runs auto-place. We refresh placements to reflect that.
  const handleDeleteTab = useCallback(async (tabId: number) => {
    const tab = layoutTabs.find((tb) => tb.id === tabId);
    if (!tab) return;
    const confirmed = window.confirm(t.formlayoutdesigner_delete_tab_confirm || 'Delete this tab? Fields in it will lose their tab assignment but won\'t be deleted.');
    if (!confirmed) return;
    try {
      await apiClient.delete(`/form-layout-tabs/${tabId}`);
      const remaining = layoutTabs.filter((tb) => tb.id !== tabId);
      setLayoutTabs(remaining);
      const stillInContainer = remaining.filter((tb) => tb.tab_container_element_id === tab.tab_container_element_id);
      setActiveTabByContainer((prev) => {
        const next = { ...prev };
        if (stillInContainer.length > 0) {
          next[tab.tab_container_element_id] = stillInContainer[0].id;
        } else {
          delete next[tab.tab_container_element_id];
        }
        return next;
      });
      setSelectedTabId(null);
      setHasUnsavedChanges(true);
      // Refresh placements so tab_panel_id values for the orphaned fields
      // are reloaded as NULL.
      if (currentWindow?.id && selectedTableId != null) {
        await loadPlacements(currentWindow.id, selectedTableId);
      }
    } catch (err) {
      toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Failed to delete tab: ' + String(err), life: 4000 });
    }
  }, [layoutTabs, currentWindow, selectedTableId, loadPlacements, t]);

  // ========== INITIAL LOADS ==========

  useEffect(() => {
    loadFormSets();
  }, [loadFormSets]);

  useEffect(() => {
    loadSchemas();
  }, [loadSchemas]);

  useEffect(() => {
    if (selectedSchemaId != null) {
      loadTablesForSchema(selectedSchemaId);
    } else {
      setTables([]);
    }
  }, [selectedSchemaId, loadTablesForSchema]);

  // Load translated table captions for menu stash
  const loadTranslatedTables = useCallback(async (langCode: string) => {
    if (tables.length === 0) return;
    const translatedTables = await Promise.all(
      tables.map(async (tbl: any) => {
        let caption = tbl.singular_name || tbl.table_name.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
        try {
          const trData = await apiClient.get(`/schema-translation?item_name=${encodeURIComponent(tbl.table_name)}&code=${langCode}`);
          if (trData.translated_text) {
            caption = trData.translated_text;
          }
        } catch { /* silent */ }
        return { id: tbl.id, table_name: tbl.table_name, singular_name: tbl.singular_name, caption };
      })
    );
    setSchemaTables(translatedTables);
  }, [tables]);

  // Auto-populate schemaTables when tables loaded or language changes (for main_menu)
  useEffect(() => {
    if (selectedWindowType === 'main_menu' && tables.length > 0 && selectedLanguage) {
      loadTranslatedTables(selectedLanguage);
    }
  }, [tables, selectedWindowType, selectedLanguage, loadTranslatedTables]);

  // Set default language
  useEffect(() => {
    if (enabledLanguages.length > 0 && selectedLanguage == null) {
      setSelectedLanguage(enabledLanguages[0].value);
    }
  }, [enabledLanguages, selectedLanguage]);

  // ========== LOAD LAYOUT (the main Load button) ==========

  const handleLoad = useCallback(async () => {
    // For main_menu: table selection is not required
    const needsTable = selectedWindowType !== 'main_menu';
    if (selectedFormSetId == null || selectedWindowType == null || (needsTable && selectedTableId == null)) {
      toast.current?.show({ severity: 'warn', summary: t.formlayoutdesigner_warning , detail: t.formlayoutdesigner_select_all, life: 3000 });
      return;
    }

    // Confirm if there are unsaved changes
    if (hasUnsavedChanges) {
      const confirmed = window.confirm(t.formlayoutdesigner_unsaved_confirm || 'You have unsaved changes. Do you want to discard them and load a new layout?');
      if (!confirmed) return;
    }

    setLoading(true);
    setSelectedPlacementId(null);
    setSelectedButtonNodeId(null);
    setSelectedMenuNodeId(null);
    setLiveGeometry(null);
    setHasUnsavedChanges(false);

    try {
      // Load the full form set with windows and elements
      let fsData: any;
      try {
        fsData = await apiClient.get(`/form-sets/${selectedFormSetId}`);
      } catch {
        throw new Error('Failed to load form set');
      }
      const formSet: FormSet = fsData.data || fsData;
      setCurrentFormSet(formSet);

      // Find matching window
      const windows = formSet.windows || [];
      const matchingWindow = windows.find((w) => w.window_type === selectedWindowType && w.is_active);
      if (!matchingWindow) {
        toast.current?.show({ severity: 'info', summary: t.formlayoutdesigner_info || 'Info', detail: t.formlayoutdesigner_no_window || 'No active window found for this type.', life: 3000 });
        setCurrentWindow(null);
        setPlacements([]);
        setButtonPlacements([]);
        setNodes([]);
        setLoading(false);
        return;
      }
      setCurrentWindow(matchingWindow);

      // Load per-table dimension override (form_table_layouts) so the canvas
      // and the Settings dialog know the *effective* size for this specific
      // (window × table) pair. Missing row → both nulls, fall back to template
      // default_width/height at render time.
      if (selectedTableId != null && selectedWindowType !== 'main_menu') {
        try {
          const ov: any = await apiClient.get(`/form-windows/${matchingWindow.id}/table-layouts/${selectedTableId}`);
          setTableLayoutOverride({ width: ov?.width ?? null, height: ov?.height ?? null });
        } catch {
          setTableLayoutOverride(null);
        }
      } else {
        setTableLayoutOverride(null);
      }

      // Load fields for selected table
      const selectedTable = tables.find((tbl) => Number(tbl.id) === Number(selectedTableId));
      setCurrentFields(selectedTable?.fields || []);

      // For main_menu: load translated table names BEFORE placements (so labels are ready)
      if (selectedWindowType === 'main_menu') {
        await loadTranslatedTables(selectedLanguage || 'en');
      } else {
        setSchemaTables([]);
      }

      // Load existing placements
      await loadPlacements(matchingWindow.id, selectedTableId || 0);

      // Load tabs (only meaningful for non-main_menu types where we have
      // a table; for main_menu we just clear).
      if (selectedWindowType !== 'main_menu' && selectedTableId != null) {
        await loadLayoutTabs(matchingWindow.id, selectedTableId);
      } else {
        setLayoutTabs([]);
        setActiveTabByContainer({});
        setSelectedTabId(null);
      }
    } catch (err) {
      toast.current?.show({ severity: 'error', summary: t.formlayoutdesigner_error || 'Error', detail: String(err), life: 4000 });
    } finally {
      setLoading(false);
    }
  }, [selectedFormSetId, selectedWindowType, selectedTableId, selectedSchemaId, selectedLanguage, tables, loadPlacements, loadTranslatedTables, t, setNodes]);

  // ========== BUILD REACTFLOW NODES ==========

  // Header height offset — containers in FormSet start at y=0 but the window
  // has a title bar that needs to be accounted for in placements.
  const WINDOW_HEADER_HEIGHT = 32;

  // Build ALL nodes when data changes (window load, placement add/remove, auto-place)
  // IMPORTANT: Do NOT include selectedPlacementId here - selection is managed by ReactFlow internally
  const buildAllNodes = useCallback(() => {
    if (!currentWindow || !currentFormSet) {
      setNodes([]);
      return;
    }

    const bgColor = currentWindow.background_color || currentFormSet.default_background_color || '#1e1e2e';
    const winColor = currentWindow.window_color || currentFormSet.default_window_color || '#3b82f6';
    const txtColor = currentWindow.text_color || currentFormSet.default_text_color || '#ffffff';

    const newNodes: Node[] = [];

    // Window frame node
    newNodes.push({
      id: 'window-frame',
      type: 'windowFrame',
      position: { x: 0, y: 0 },
      draggable: false,
      selectable: false,
      data: {
        label: currentWindow.display_name || currentWindow.name,
        // Use the EFFECTIVE dims (per-table override > template default) so the
        // canvas reflows when the user changes window size in Settings — without
        // mutating the FormWindow template.
        windowWidth: effectiveWindowWidth,
        windowHeight: effectiveWindowHeight,
        backgroundColor: bgColor,
        windowColor: winColor,
        textColor: txtColor,
      } as WindowFrameNodeData,
    });

    // Container frame nodes - offset by header height
    const elements = currentWindow.elements || [];
    // Window-size delta vs. the template's original size. Anchors stretch the
    // container width/height by this delta × (anchor_width|height / 100), so
    // a fully-anchored container (anchor_width=100, anchor_height=100) grows
    // 1:1 with the window — exactly what the user expects when changing
    // window size in the Settings dialog.
    const tplWidth = currentWindow.default_width || 800;
    const tplHeight = currentWindow.default_height || 600;
    const winDeltaW = effectiveWindowWidth - tplWidth;
    const winDeltaH = effectiveWindowHeight - tplHeight;

    for (const el of elements) {
      const isContainer = el.element_type === 'container' || el.element_type === 'tab_container' || el.element_type === 'tab_panel' || el.element_type === 'menu_container';
      if (!isContainer) continue;

      // Apply anchors so the container follows the window size.
      // anchor_width / anchor_height are stored as 0..100 percentages.
      const anchW = Number(el.anchor_width ?? 0);
      const anchH = Number(el.anchor_height ?? 0);
      const anchoredWidth = Math.max(40, (el.width || 0) + (winDeltaW * anchW / 100));
      const anchoredHeight = Math.max(40, (el.height || 0) + (winDeltaH * anchH / 100));

      // CONTENT-AUTO-GROW: scan placements for this container; if any field
      // sits below the anchored container height, grow the container so it
      // wraps all its children. Stops the "fields stack at the bottom edge"
      // issue when auto-place generates more rows than fit. The grown height
      // wins only when it exceeds the anchored size — so anchor stretching
      // still works as designed for sparsely populated containers.
      //
      // IMPORTANT: read positions/sizes from placementsRef, not the state
      // `placements`. handleNodesChange updates ref live (drag/resize) but
      // not state — so reading state would give stale values and the
      // container wouldn't shrink back after the user resizes a field
      // smaller. Ref has the freshest geometry; state is just for data
      // props (control type, captions, ...).
      const childPlacements = placements.filter(
        (p) => Number(p.container_element_id) === Number(el.id)
      );
      let contentBottom = 0;
      for (const cp of childPlacements) {
        const cpKey = cp.id || cp.schema_field_id || `rc-${cp.sort_order}`;
        const live = placementsRef.current.find(
          (pp) => String(pp.id || pp.schema_field_id || `rc-${pp.sort_order}`) === String(cpKey)
        );
        const liveY = live?.y_position ?? cp.y_position ?? 0;
        const liveH = live?.height ?? cp.height ?? 32;
        const bottom = liveY + liveH;
        if (bottom > contentBottom) contentBottom = bottom;
      }
      const containerWidth = anchoredWidth;
      const containerHeight = Math.max(anchoredHeight, contentBottom + 20);

      const containerLabel = el.tab_label || el.button_label || el.element_type.replace(/_/g, ' ');
      // For tab_container, attach the tabs that belong to this container
      // (filtered out of the flat layoutTabs list) plus the active tab id
      // and the click handlers. ContainerFrameNode reads these to draw
      // the tab strip.
      const tabsForContainer = el.element_type === 'tab_container'
        ? layoutTabs
            .filter((tb) => Number(tb.tab_container_element_id) === Number(el.id))
            .sort((a, b) => a.sort_order - b.sort_order)
        : [];
      newNodes.push({
        id: `container-${el.id || el.sort_order}`,
        type: 'containerFrame',
        position: { x: el.x_position, y: el.y_position + WINDOW_HEADER_HEIGHT },
        draggable: false,
        selectable: false,
        style: { width: containerWidth, height: containerHeight },
        data: {
          label: containerLabel,
          elementType: el.element_type,
          columns: el.container_columns || 1,
          maxFields: el.max_fields,
          borderColor: '#6b7280',
          containerElementId: el.id,
          tabs: tabsForContainer,
          activeTabId: el.id != null ? (activeTabByContainer[Number(el.id)] ?? null) : null,
          selectedTabId,
          onSelectTab: handleSelectTab,
          onAddTab: el.id != null ? () => handleAddTab(Number(el.id)) : undefined,
          selectedLanguage,
        } as ContainerFrameNodeData,
      });
    }

    // DATA TABLE MODE: render a single FormTableGridNode instead of individual field nodes
    if (currentWindow.window_type === 'data_table' && placements.length > 0) {
      const container = elements.find(el => el.element_type === 'container');
      const sortedCols = [...placements]
        .filter(p => p.is_visible)
        .sort((a, b) => a.sort_order - b.sort_order);

      const tableColumns: FormTableColumn[] = sortedCols.map(p => {
        const field = p.schema_field || currentFields.find(f => Number(f.id) === Number(p.schema_field_id));
        const langLabel = selectedLanguage && p.caption_labels ? p.caption_labels[selectedLanguage] : null;
        const headerText = langLabel || p.caption_override || (field ? formatFieldName(field.field_name) : 'Column');
        const pKey = String(p.id || p.schema_field_id);
        return {
          key: pKey,
          fieldName: field?.field_name || '',
          headerText,
          width: p.width || 150,
          sortOrder: p.sort_order,
          isSelected: selectedPlacementId != null && pKey === String(selectedPlacementId),
        };
      });

      const cX = container ? container.x_position : 0;
      const cY = container ? container.y_position + WINDOW_HEADER_HEIGHT : WINDOW_HEADER_HEIGHT;
      const containerW = container ? container.width : (currentWindow.default_width || 800);
      const headerBg = 'rgba(255,255,255,0.08)';

      newNodes.push({
        id: 'form-table-grid',
        type: 'formTableGrid',
        position: { x: cX, y: cY },
        parentId: 'window-frame',
        draggable: false,
        selectable: false,
        data: {
          columns: tableColumns,
          rowHeight: container?.default_control_height || 32,
          windowWidth: containerW,
          bgColor: bgColor,
          textColor: txtColor,
          headerBgColor: headerBg,
          selectedColumnKey: selectedPlacementId != null ? String(selectedPlacementId) : null,
          onSelectColumn: (key: string | null) => {
            if (key) {
              setSelectedPlacementId(Number(key) || key as any);
              setSelectedButtonNodeId(null);
              setSelectedMenuNodeId(null);
            } else {
              setSelectedPlacementId(null);
            }
          },
          onColumnResized: (key: string, newWidth: number) => {
            setPlacements(prev => prev.map(p => {
              const pKey = String(p.id || p.schema_field_id);
              if (pKey === key) return { ...p, width: Math.max(50, newWidth) };
              return p;
            }));
            setHasUnsavedChanges(true);
          },
          onColumnsReordered: (orderedKeys: string[]) => {
            setPlacements(prev => {
              const reordered = orderedKeys.map((key, idx) => {
                const p = prev.find(pp => String(pp.id || pp.schema_field_id) === key);
                return p ? { ...p, sort_order: idx } : null;
              }).filter(Boolean) as typeof prev;
              const nonField = prev.filter(pp => !orderedKeys.includes(String(pp.id || pp.schema_field_id)));
              return [...nonField, ...reordered];
            });
            setHasUnsavedChanges(true);
          },
        } as FormTableGridNodeData,
      });

      // Also render button nodes for data_table (New, Delete, Close etc.)
      for (const btn of buttonPlacements) {
        if (!btn.is_visible) continue;
        const btnKey = `button-${btn.id || btn.button_type}-${btn.sort_order}`;
        const isSelected = selectedButtonNodeId === btnKey;
        const bLabel = (btn.button_labels && selectedLanguage ? btn.button_labels[selectedLanguage] : null) || btn.button_label || btn.button_type.replace('button_', '');
        newNodes.push({
          id: btnKey,
          type: 'buttonPlacement',
          position: { x: btn.x_position, y: btn.y_position + WINDOW_HEADER_HEIGHT },
          parentId: 'window-frame',
          draggable: true,
          selectable: true,
          selected: isSelected,
          style: { width: btn.width, height: btn.height },
          data: {
            buttonPlacement: btn,
            buttonType: btn.button_type,
            label: bLabel,
            icon: btn.button_icon || '',
            backgroundColor: btn.button_background_color || currentFormSet.default_button_color || '#3b82f6',
            textColor: btn.button_text_color || currentFormSet.default_button_text_color || '#fff',
            isVisible: btn.is_visible,
          } as ButtonPlacementNodeData,
        });
      }

      setNodes(newNodes);
      return;
    }

    // Field placement nodes - use parentId to constrain to container
    // Use placementsRef for position/size (has latest drag/resize values), placements for data props
    for (const placement of placements) {
      const isReportCtrl = ['static_text', 'heading', 'line_horizontal', 'line_vertical', 'box', 'page_number', 'page_date', 'page_total', 'image_placeholder'].includes(placement.control_type || '');
      const field = isReportCtrl ? null : (placement.schema_field || currentFields.find((f) => Number(f.id) === Number(placement.schema_field_id)));
      if (!field && !isReportCtrl) continue;

      // Tab filter: if this placement's container is a tab_container, only
      // render the field when it belongs to the currently active tab. A
      // null tab_panel_id on a field inside a tab_container means the field
      // was orphaned (e.g. its tab was deleted) — we show those on the
      // currently active tab so the user can re-assign them.
      const containerEl = (currentWindow.elements || []).find((e: any) => Number(e.id) === Number(placement.container_element_id));
      if (containerEl?.element_type === 'tab_container') {
        const activeId = activeTabByContainer[Number(containerEl.id)] ?? null;
        const placementTabId = placement.tab_panel_id ?? null;
        if (placementTabId != null && placementTabId !== activeId) continue;
        // If placementTabId == null AND there's an active tab, show it on the
        // active tab; if no active tab at all, render (the user will see
        // orphans on every container view).
      }

      // Get latest geometry from ref (may have been updated by drag/resize)
      const placementKey = placement.id || placement.schema_field_id || `rc-${placement.sort_order}`;
      const refPlacement = placementsRef.current.find((p) => {
        const pKey = p.id || p.schema_field_id || `rc-${p.sort_order}`;
        return String(pKey) === String(placementKey);
      });
      const px = refPlacement?.x_position ?? placement.x_position;
      const py = refPlacement?.y_position ?? placement.y_position;
      const pw = refPlacement?.width ?? placement.width ?? 180;
      const ph = refPlacement?.height ?? placement.height ?? 32;

      const nodeId = `placement-${placementKey}`;
      newNodes.push({
        id: nodeId,
        type: 'fieldPlacement',
        position: { x: px, y: py },
        parentId: `container-${placement.container_element_id}`,
        // No `extent` and no `expandParent` here. Earlier attempts to use
        // either led to either (a) a hard horizontal clamp the user didn't
        // want or (b) ReactFlow growing the container in unwanted directions
        // because `extent` is interpreted in ABSOLUTE flow coordinates (not
        // parent-relative) and `expandParent` doesn't discriminate which
        // edge was crossed. We now handle the desired behaviour in two
        // simple places instead:
        //   1. handleNodesChange clamps x/y to >= 0 (no escape left/up)
        //      and prevents the field from drifting past the container's
        //      right edge during drag.
        //   2. Render-time container auto-grow (max field y+h + 20) sets
        //      the container height authoritatively after the user releases.
        //      Downward drag just works — the container fits on the next
        //      paint, no live expansion needed.
        draggable: true,
        selectable: true,
        // `selected` is NOT set here — it is preserved from ReactFlow's internal
        // store via the merge in setNodes((prev) => ...) below.
        style: { width: pw, height: ph },
        data: {
          placement,
          fieldName: isReportCtrl ? (placement.control_type || 'report') : (field?.field_name || ''),
          fieldType: isReportCtrl ? (placement.control_type || '') : (field?.field_type || ''),
          controlType: placement.control_type || placement.control_type_override || 'text',
          captionOverride: (placement.caption_labels && selectedLanguage ? placement.caption_labels[selectedLanguage] : null) || placement.caption_override,
          labelPosition: placement.label_position || 'top',
          labelWidth: placement.label_width || 100,
          isVisible: placement.is_visible,
          isSelected: false,
          colorBar: isReportCtrl ? '#a855f7' : getFieldColorBar(field?.field_type || '', field?.is_primary_key || false),
        } as FieldPlacementNodeData,
      });
    }

    // Button placement nodes - placed directly on window frame (not inside containers)
    for (const btn of buttonPlacements) {
      const nodeId = `button-${btn.id || btn.button_type}-${btn.sort_order}`;
      const bgColor2 = btn.button_background_color || currentFormSet?.default_button_color || BUTTON_FALLBACK_COLOR;
      const txtColor2 = btn.button_text_color || '#ffffff';
      const icon = btn.button_icon || BUTTON_DEFAULT_ICONS[btn.button_type] || '';
      const label = (btn.button_labels && selectedLanguage ? btn.button_labels[selectedLanguage] : null) || btn.button_label || BUTTON_DEFAULT_LABELS[btn.button_type] || btn.button_type;

      // Get latest geometry from ref
      const refBtn = buttonPlacementsRef.current.find((b) =>
        `button-${b.id || b.button_type}-${b.sort_order}` === nodeId
      );
      const bx = refBtn?.x_position ?? btn.x_position;
      const by = refBtn?.y_position ?? btn.y_position;
      const bw = refBtn?.width ?? btn.width ?? 120;
      const bh = refBtn?.height ?? btn.height ?? 36;

      newNodes.push({
        id: nodeId,
        type: 'buttonPlacement',
        position: { x: bx, y: by + WINDOW_HEADER_HEIGHT },
        parentId: 'window-frame',
        draggable: true,
        selectable: true,
        // `selected` preserved by the merge in setNodes((prev) => ...) below.
        style: { width: bw, height: bh },
        data: {
          buttonPlacement: btn,
          buttonType: btn.button_type,
          label,
          icon,
          backgroundColor: bgColor2,
          textColor: txtColor2,
          isVisible: btn.is_visible,
        } as ButtonPlacementNodeData,
      });
    }

    // Menu item nodes (only for main_menu window type)
    if (selectedWindowType === 'main_menu') {
      const containerNodes = newNodes.filter(n => n.id.startsWith('container-'));
      // Use STATE for data properties (labels, icons etc.) but REF for live positions (drag/resize)
      menuPlacements.forEach((item, idx) => {
        const nodeId = `menu-${item.id || item.temp_id || idx}`;
        const refItem = menuPlacementsRef.current.find(m => (m.id || m.temp_id) === (item.id || item.temp_id));
        const tableInfo = schemaTables.find(t => Number(t.id) === Number(item.schema_table_id));
        const label = (item.caption_labels && selectedLanguage && item.caption_labels[selectedLanguage])
          || item.caption_override
          || tableInfo?.caption || tableInfo?.singular_name || tableInfo?.table_name || 'Menu Item';
        const isGroup = !item.schema_table_id && item.menu_icon !== 'pi-minus';
        const isSeparator = item.menu_icon === 'pi-minus';

        // Use ref positions if available (latest from drag), otherwise state
        const x = refItem?.x_position ?? item.x_position;
        const y = refItem?.y_position ?? item.y_position;
        const w = refItem?.width ?? item.width;
        const h = refItem?.height ?? item.height;

        newNodes.push({
          id: nodeId,
          type: 'menuItemNode',
          parentId: containerNodes.length > 0 ? containerNodes[0].id : 'window-frame',
          extent: 'parent' as const,
          position: { x, y },
          draggable: true,
          selectable: true,
          // `selected` preserved by the merge in setNodes((prev) => ...) below.
          style: { width: w, height: h },
          data: {
            menuItem: item,
            label,
            icon: item.menu_icon || 'pi-table',
            depth: item.menu_depth || 0,
            roleRequired: item.menu_role_required,
            isGroup,
            isSeparator,
            isVisible: item.is_visible,
            tableName: tableInfo?.table_name,
          } satisfies MenuItemNodeData,
        });
      });
    }

    // Merge: preserve ReactFlow's internal `selected` flag from the previous
    // node array. This decouples buildAllNodes from selection state — selection
    // changes never re-trigger this rebuild, and rebuilds (data updates) never
    // overwrite ReactFlow's current selection. Both directions of the previous
    // infinite-loop are broken.
    setNodes((prev) => {
      const selectedById = new Map<string, boolean>();
      for (const n of prev) {
        if (n.selected) selectedById.set(n.id, true);
      }
      return newNodes.map((n) => (selectedById.get(n.id) ? { ...n, selected: true } : n));
    });
  }, [currentWindow, currentFormSet, placements, currentFields, buttonPlacements, menuPlacements, selectedLanguage, selectedWindowType, schemaTables, geometryTick, layoutTabs, activeTabByContainer, selectedTabId, handleSelectTab, handleAddTab, setNodes]);

  // Rebuild nodes when data changes (NOT on selection change)
  useEffect(() => {
    buildAllNodes();
  }, [buildAllNodes]);

  // Selection-only patch for the data_table grid node.
  // The grid renders all columns inside a SINGLE ReactFlow node, so the
  // selection state lives in the node's data (column[].isSelected) rather
  // than in ReactFlow's own `selected` flag. buildAllNodes deliberately
  // doesn't include selectedPlacementId in its deps (would re-run the whole
  // canvas rebuild on every click). So we patch JUST the grid node's data
  // here when the selection changes — cheap, no full rebuild.
  useEffect(() => {
    const currentKey = selectedPlacementId != null ? String(selectedPlacementId) : null;
    setNodes((prev) => {
      let changed = false;
      const next = prev.map((n) => {
        if (n.type !== 'formTableGrid') return n;
        const data = n.data as FormTableGridNodeData;
        if (data.selectedColumnKey === currentKey) return n;
        changed = true;
        return {
          ...n,
          data: {
            ...data,
            selectedColumnKey: currentKey,
            columns: data.columns.map((c) => ({ ...c, isSelected: c.key === currentKey })),
          } as FormTableGridNodeData,
        };
      });
      return changed ? next : prev;
    });
  }, [selectedPlacementId, setNodes]);

  // ========== NODE INTERACTION HANDLERS ==========

  const handleSelectionChange = useCallback(({ nodes: selectedNodes }: { nodes: Node[] }) => {
    const placementNodes = selectedNodes.filter((n) => n.type === 'fieldPlacement');
    const buttonNodes = selectedNodes.filter((n) => n.type === 'buttonPlacement');
    const menuNodes = selectedNodes.filter((n) => n.type === 'menuItemNode');

    // ── Tab-order multi-selection: derive orderedSelection from the
    //    authoritative ReactFlow selection across all three placement types.
    //    Resolve each node id to its underlying form_item_placements.id.
    const collectIds: number[] = [];
    for (const n of placementNodes) {
      const idStr = n.id.replace('placement-', '');
      const p = placementsRef.current.find((pp) => Number(pp.id || pp.schema_field_id) === Number(idStr));
      if (p?.id != null) collectIds.push(p.id);
    }
    for (const n of buttonNodes) {
      const b = buttonPlacementsRef.current.find((bb) => `button-${bb.id || bb.button_type}-${bb.sort_order}` === n.id);
      if (b?.id != null) collectIds.push(b.id);
    }
    for (const n of menuNodes) {
      const m = menuPlacementsRef.current.find((mm) => `menu-${mm.id || mm.temp_id}` === n.id);
      if (m?.id != null) collectIds.push(m.id);
    }
    // Parallel selection tracker keyed by ReactFlow node id (string). Covers
    // unsaved buttons/fields/menus (no DB id yet) so multi-edit still works
    // for freshly-dropped items.
    const collectNodeIds: string[] = [
      ...placementNodes.map((n) => n.id),
      ...buttonNodes.map((n) => n.id),
      ...menuNodes.map((n) => n.id),
    ];
    setSelectedNodeIds((prev) => {
      if (prev.length === collectNodeIds.length && prev.every((v, i) => v === collectNodeIds[i])) {
        return prev;
      }
      return collectNodeIds;
    });

    setOrderedSelection((prev) => {
      const stillSelected = prev.filter((id) => collectIds.includes(id));
      const newlyAdded = collectIds.filter((id) => !prev.includes(id));
      const next = [...stillSelected, ...newlyAdded];
      // Bail out if nothing actually changed — returning a new array reference
      // would re-render and make ReactFlow re-issue onSelectionChange → loop.
      if (next.length === prev.length && next.every((id, i) => id === prev[i])) {
        return prev;
      }
      return next;
    });

    // Pick the LAST node of each kind so the multi-edit panel still has a
    // representative single-state to render against. The properties-panel body
    // gates on selectedPlacement / selectedButton / selectedMenuItem and would
    // otherwise stay empty in multi-mode.
    const lastPlacement = placementNodes.length > 0 ? placementNodes[placementNodes.length - 1] : null;
    const lastButton = buttonNodes.length > 0 ? buttonNodes[buttonNodes.length - 1] : null;
    const lastMenu = menuNodes.length > 0 ? menuNodes[menuNodes.length - 1] : null;

    if (lastPlacement && !lastButton && !lastMenu) {
      const idStr = lastPlacement.id.replace('placement-', '');
      setSelectedPlacementId(Number(idStr));
      setSelectedButtonNodeId(null);
      setSelectedMenuNodeId(null);
      setSelectedTabId(null);
      const p = placementsRef.current.find((p) => Number(p.id || p.schema_field_id) === Number(idStr));
      setLiveGeometry(p ? { x: p.x_position, y: p.y_position, w: p.width, h: p.height } : null);
    } else if (lastButton && !lastPlacement && !lastMenu) {
      setSelectedButtonNodeId(lastButton.id);
      setSelectedPlacementId(null);
      setSelectedMenuNodeId(null);
      setSelectedTabId(null);
      const b = buttonPlacementsRef.current.find((b) => `button-${b.id || b.button_type}-${b.sort_order}` === lastButton.id);
      setLiveGeometry(b ? { x: b.x_position, y: b.y_position, w: b.width, h: b.height } : null);
    } else if (lastMenu && !lastPlacement && !lastButton) {
      setSelectedMenuNodeId(lastMenu.id);
      setSelectedPlacementId(null);
      setSelectedButtonNodeId(null);
      setSelectedTabId(null);
      const m = menuPlacementsRef.current.find((item) => `menu-${item.id || item.temp_id}` === lastMenu.id);
      setLiveGeometry(m ? { x: m.x_position, y: m.y_position, w: m.width, h: m.height } : null);
    } else if (!lastPlacement && !lastButton && !lastMenu) {
      // Don't clear selection if focus is inside the properties panel or during language switch
      const activeEl = document.activeElement;
      if ((activeEl && activeEl.closest('.properties-panel')) || suppressDeselect.current) {
        return;
      }
      setSelectedPlacementId(null);
      setSelectedButtonNodeId(null);
      setSelectedMenuNodeId(null);
      // Tab selection persists on pane click — the tab strip is not a
      // ReactFlow node, so an empty canvas click shouldn't deselect the
      // tab the user just clicked. handlePaneClick handles the explicit
      // empty-canvas-deselect path if we ever need that.
    }
    // Mixed selection (e.g. fields + buttons): we leave the existing single
    // states untouched — selectedKind === 'mixed' renders an info box.
  }, []);

  // Use refs to track placements for node change handler (avoids triggering useEffect rebuild)
  const placementsRef = useRef<FormFieldPlacement[]>(placements);
  useEffect(() => { placementsRef.current = placements; }, [placements]);
  const buttonPlacementsRef = useRef<ButtonPlacementData[]>(buttonPlacements);
  useEffect(() => { buttonPlacementsRef.current = buttonPlacements; }, [buttonPlacements]);
  const menuPlacementsRef = useRef<MenuItemPlacementData[]>(menuPlacements);
  useEffect(() => { menuPlacementsRef.current = menuPlacements; }, [menuPlacements]);

  // Helper: update a menu item property while preserving latest drag positions from ref.
  // Same cascade fix as updateButtonProps/updatePlacementProp: every menu row must
  // have its ref geometry merged in, otherwise the ref←state sync useEffect discards
  // pending drags on the rows that aren't being edited. Ref is also updated
  // synchronously so the next render sees the new geometry without a double-Enter.
  const updateMenuItemProp = useCallback((nodeId: string, updates: Partial<MenuItemPlacementData>) => {
    const next = menuPlacementsRef.current.map((m) => {
      const refItem = menuPlacementsRef.current.find(r => (r.id || r.temp_id) === (m.id || m.temp_id));
      const withRefGeom = refItem ? {
        ...m,
        x_position: refItem.x_position,
        y_position: refItem.y_position,
        width: refItem.width,
        height: refItem.height,
      } : m;
      if (`menu-${m.id || m.temp_id}` !== nodeId) return withRefGeom;
      return { ...withRefGeom, ...updates };
    });
    menuPlacementsRef.current = next;
    setMenuPlacements(next);
    setHasUnsavedChanges(true);
  }, []);

  const handleNodesChange = useCallback((changes: Parameters<typeof onNodesChange>[0]) => {
    // Filter out remove changes for our managed nodes (prevents ReactFlow from deleting them on re-render)
    const safeChanges = changes.filter((c) => {
      if (c.type === 'remove') {
        return !c.id.startsWith('window-') && !c.id.startsWith('container-') && !c.id.startsWith('placement-') && !c.id.startsWith('button-') && !c.id.startsWith('menu-');
      }
      return true;
    });

    onNodesChange(safeChanges);

    // Track position/dimension changes for placement/button nodes
    // IMPORTANT: Only 'position' changes with dragging===false (user finished dragging)
    // and 'dimensions' changes with resizing===true (user is actively resizing)
    // mark as unsaved. Pure 'dimensions' from ReactFlow measuring nodes are ignored.
    let userChanged = false;
    let geometryChanged = false;
    for (const change of safeChanges) {
      // Field placement position (drag end)
      if (change.type === 'position' && change.position && change.dragging === false) {
        const nodeId = change.id;
        if (nodeId.startsWith('placement-')) {
          const idStr = nodeId.replace('placement-', '');
          placementsRef.current = placementsRef.current.map((p) => {
            if (String(p.id || p.schema_field_id) === idStr) {
              // Clamp to >= 0 so the user can't drag the field above or to
              // the left of the container. Downward (y) and rightward (x)
              // are intentionally unbounded — the container's render-time
              // auto-grow handles the height when the user drops below the
              // current bottom, and the field can still sit on the right
              // edge horizontally. ReactFlow doesn't ship a direction-
              // discriminating extent, so a tiny clamp here is the cleanest
              // way to forbid only the two "bad" directions.
              const clampedX = Math.max(0, Math.round(change.position!.x));
              const clampedY = Math.max(0, Math.round(change.position!.y));
              return { ...p, x_position: clampedX, y_position: clampedY };
            }
            return p;
          });
          userChanged = true;
          geometryChanged = true;
        } else if (nodeId.startsWith('button-')) {
          const HEADER = 32;
          buttonPlacementsRef.current = buttonPlacementsRef.current.map((b) => {
            if (`button-${b.id || b.button_type}-${b.sort_order}` === nodeId) {
              return { ...b, x_position: Math.round(change.position!.x), y_position: Math.round(change.position!.y) - HEADER };
            }
            return b;
          });
          userChanged = true;
          geometryChanged = true;
        } else if (nodeId.startsWith('menu-')) {
          menuPlacementsRef.current = menuPlacementsRef.current.map((m) => {
            if (`menu-${m.id || m.temp_id}` === nodeId) {
              return { ...m, x_position: Math.round(change.position!.x), y_position: Math.round(change.position!.y) };
            }
            return m;
          });
          userChanged = true;
          geometryChanged = true;
        }
      }

      // Dimensions: only from user resizing (resizing flag), NOT from ReactFlow auto-measuring
      if (change.type === 'dimensions' && change.dimensions && (change as any).resizing) {
        const nodeId = change.id;
        if (nodeId.startsWith('placement-')) {
          const idStr = nodeId.replace('placement-', '');
          placementsRef.current = placementsRef.current.map((p) => {
            if (String(p.id || p.schema_field_id) === idStr) {
              return { ...p, width: Math.round(change.dimensions!.width || p.width), height: Math.round(change.dimensions!.height || p.height) };
            }
            return p;
          });
          userChanged = true;
          geometryChanged = true;
        } else if (nodeId.startsWith('button-')) {
          buttonPlacementsRef.current = buttonPlacementsRef.current.map((b) => {
            if (`button-${b.id || b.button_type}-${b.sort_order}` === nodeId) {
              return { ...b, width: Math.round(change.dimensions!.width || b.width), height: Math.round(change.dimensions!.height || b.height) };
            }
            return b;
          });
          userChanged = true;
          geometryChanged = true;
        } else if (nodeId.startsWith('menu-')) {
          menuPlacementsRef.current = menuPlacementsRef.current.map((m) => {
            if (`menu-${m.id || m.temp_id}` === nodeId) {
              return { ...m, width: Math.round(change.dimensions!.width || m.width), height: Math.round(change.dimensions!.height || m.height) };
            }
            return m;
          });
          userChanged = true;
          geometryChanged = true;
        }
      }
    }

    if (userChanged) {
      setHasUnsavedChanges(true);
    }

    if (geometryChanged) {
      // Tick the geometry counter — pulls buildAllNodes back through its
      // useEffect dep so the container auto-grow recomputes against the
      // fresh placementsRef geometry. Without this, the container would
      // only refit after Save (which mutates the placements state).
      setGeometryTick((t) => t + 1);

      // Update liveGeometry for the selected node so properties panel shows real-time values
      if (selectedPlacementId != null) {
        const p = placementsRef.current.find((p) => Number(p.id || p.schema_field_id) === Number(selectedPlacementId));
        if (p) setLiveGeometry({ x: p.x_position, y: p.y_position, w: p.width, h: p.height });
      } else if (selectedButtonNodeId != null) {
        const b = buttonPlacementsRef.current.find((b) => `button-${b.id || b.button_type}-${b.sort_order}` === selectedButtonNodeId);
        if (b) setLiveGeometry({ x: b.x_position, y: b.y_position, w: b.width, h: b.height });
      } else if (selectedMenuNodeId != null) {
        const m = menuPlacementsRef.current.find((item) => `menu-${item.id || item.temp_id}` === selectedMenuNodeId);
        if (m) setLiveGeometry({ x: m.x_position, y: m.y_position, w: m.width, h: m.height });
      }
    }
  }, [onNodesChange, selectedPlacementId, selectedButtonNodeId, selectedMenuNodeId]);

  // ========== DRAG & DROP FROM PALETTE ==========

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
  }, []);

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();

    // Menu item drop
    const menuTableId = event.dataTransfer.getData('application/menu-table-id');
    const menuGroupType = event.dataTransfer.getData('application/menu-group');
    if ((menuTableId || menuGroupType) && currentWindow) {
      const flowPos = reactFlowInstance.screenToFlowPosition({ x: event.clientX, y: event.clientY });
      const containerElems = (currentWindow.elements || []).filter((el: any) =>
        el.element_type === 'menu_container'
      );
      const container = containerElems[0];

      const newItem: MenuItemPlacementData = {
        temp_id: `temp_${Date.now()}`,
        form_window_id: currentWindow.id,
        container_element_id: container?.id || null,
        schema_table_id: menuTableId ? Number(menuTableId) : null,
        caption_override: menuGroupType === 'group' ? 'New Group' : (menuGroupType === 'separator' ? '---' : null),
        caption_labels: null,
        menu_icon: menuGroupType === 'separator' ? 'pi-minus' : (menuGroupType === 'group' ? 'pi-folder' : 'pi-table'),
        menu_action: null,
        menu_role_required: null,
        menu_depth: 0,
        parent_placement_id: null,
        x_position: container ? Math.max(0, flowPos.x - container.x_position) : flowPos.x,
        y_position: container ? Math.max(0, flowPos.y - container.y_position - 32) : flowPos.y,
        width: container?.width || 200,
        height: 32,
        sort_order: menuPlacements.length,
        is_visible: true,
      };
      setMenuPlacements(prev => [...prev, newItem]);
      setHasUnsavedChanges(true);
      return;
    }

    // Handle button drops
    const buttonTypeStr = event.dataTransfer.getData('application/button-type');
    if (buttonTypeStr && currentWindow) {
      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newBtn: ButtonPlacementData = {
        form_window_id: currentWindow.id,
        form_element_id: null,
        button_type: buttonTypeStr,
        button_label: BUTTON_DEFAULT_LABELS[buttonTypeStr] || 'Button',
        button_icon: BUTTON_DEFAULT_ICONS[buttonTypeStr] || null,
        button_action: null,
        button_background_color: currentFormSet?.default_button_color || BUTTON_FALLBACK_COLOR,
        button_text_color: '#ffffff',
        x_position: Math.max(0, Math.round(position.x)),
        y_position: Math.max(0, Math.round(position.y) - WINDOW_HEADER_HEIGHT),
        width: 120,
        height: 36,
        sort_order: buttonPlacements.length + 1,
        is_visible: true,
      };

      setButtonPlacements((prev) => [...prev, newBtn]);
      setHasUnsavedChanges(true);
      return;
    }

    // Handle report control drops
    const reportControlType = event.dataTransfer.getData('application/report-control');
    if (reportControlType && currentWindow) {
      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      const ctrlDef = REPORT_CONTROLS.find(c => c.type === reportControlType);
      const container = containerElements[0];

      const newPlacement: FormFieldPlacement = {
        id: undefined as any,
        form_window_id: currentWindow.id,
        schema_table_id: null as any,
        schema_field_id: null as any,  // No schema field - this is a report control
        container_element_id: container?.id || 0,
        tab_panel_id: null,
        x_position: Math.max(0, Math.round(position.x) - (container?.x_position || 0)),
        y_position: Math.max(0, Math.round(position.y) - WINDOW_HEADER_HEIGHT - (container?.y_position || 0)),
        width: ctrlDef?.defaultWidth || 200,
        height: ctrlDef?.defaultHeight || 24,
        caption_override: reportControlType === 'static_text' ? 'Text here...'
          : reportControlType === 'heading' ? 'Heading'
          : reportControlType === 'page_number' ? 'Page {n}'
          : reportControlType === 'page_date' ? '{date}'
          : reportControlType === 'page_total' ? '{pages}'
          : null,
        control_type: reportControlType,
        sort_order: placements.length,
        is_visible: true,
      };

      setPlacements((prev) => [...prev, newPlacement]);
      setHasUnsavedChanges(true);
      return;
    }

    const fieldIdStr = event.dataTransfer.getData('application/field-id');
    if (!fieldIdStr || !currentWindow) return;

    const fieldId = Number(fieldIdStr);
    if (placedFieldIds.has(fieldId)) return;

    const field = currentFields.find((f) => Number(f.id) === fieldId);
    if (!field) return;

    // Convert screen position to flow coordinates
    const bounds = (event.target as HTMLElement).closest('.react-flow')?.getBoundingClientRect();
    if (!bounds) return;
    const position = reactFlowInstance.screenToFlowPosition({
      x: event.clientX,
      y: event.clientY,
    });

    // Hit test: find which container the drop is over (containers are offset by WINDOW_HEADER_HEIGHT)
    let targetContainer: FormElement | null = null;
    for (const el of containerElements) {
      const containerY = el.y_position + WINDOW_HEADER_HEIGHT;
      const elRight = el.x_position + el.width;
      const elBottom = containerY + el.height;
      if (position.x >= el.x_position && position.x <= elRight && position.y >= containerY && position.y <= elBottom) {
        targetContainer = el;
        break;
      }
    }

    if (!targetContainer) {
      toast.current?.show({ severity: 'warn', summary: t.formlayoutdesigner_warning || 'Warning', detail: t.formlayoutdesigner_drop_on_container || 'Please drop the field onto a container.', life: 3000 });
      return;
    }

    // Check max_fields (skip for data_table — tables have unlimited columns with horizontal scroll)
    if (selectedWindowType !== 'data_table' && targetContainer.max_fields && targetContainer.max_fields > 0) {
      const placedInContainer = placements.filter((p) => Number(p.container_element_id) === Number(targetContainer!.id));
      if (placedInContainer.length >= targetContainer.max_fields) {
        toast.current?.show({ severity: 'warn', summary: t.formlayoutdesigner_warning || 'Warning', detail: t.formlayoutdesigner_container_full || 'This container has reached its maximum number of fields.', life: 3000 });
        return;
      }
    }

    // Create placement - position is RELATIVE to the container (parentId feature)
    const newPlacement: FormFieldPlacement = {
      form_window_id: currentWindow.id,
      schema_table_id: Number(selectedTableId),
      schema_field_id: fieldId,
      container_element_id: Number(targetContainer.id),
      tab_panel_id: targetContainer.element_type === 'tab_panel' ? Number(targetContainer.id) : null,
      x_position: Math.max(0, Math.round(position.x - targetContainer.x_position)),
      y_position: Math.max(0, Math.round(position.y - targetContainer.y_position - WINDOW_HEADER_HEIGHT)),
      width: 180,
      height: 32,
      caption_override: null,
      control_type_override: null,
      sort_order: placements.length + 1,
      is_visible: true,
      schema_field: field,
    };

    setPlacements((prev) => [...prev, newPlacement]);
    setHasUnsavedChanges(true);
  }, [currentWindow, currentFields, placedFieldIds, containerElements, placements, buttonPlacements, menuPlacements, selectedTableId, reactFlowInstance, t]);

  // ========== SAVE PLACEMENTS ==========

  const handleSave = useCallback(async () => {
    if (!currentWindow) return;
    setSaving(true);
    try {
      // Use ref for latest positions (handleNodesChange updates ref, not state, to avoid rebuild loop)
      const currentPlacements = placementsRef.current;
      const payload = currentPlacements.map((p, idx) => ({
        id: p.id || undefined,
        form_window_id: currentWindow.id,
        schema_table_id: p.schema_table_id || null,
        schema_field_id: p.schema_field_id || null,
        container_element_id: p.container_element_id,
        tab_panel_id: p.tab_panel_id,
        x_position: p.x_position,
        y_position: p.y_position,
        width: p.width,
        height: p.height,
        caption_override: p.caption_override,
        caption_labels: p.caption_labels || null,
        label_position: p.label_position || 'top',
        label_width: p.label_width || 100,
        control_type_override: p.control_type_override,
        control_type: p.control_type || p.control_type_override,
        button_background_color: p.button_background_color || null,
        button_text_color: p.button_text_color || null,
        button_icon: p.button_icon || null,
        style_config: p.style_config || null,
        anchor_right: (p as any).anchor_right ?? null,
        anchor_bottom: (p as any).anchor_bottom ?? null,
        anchor_width: (p as any).anchor_width ?? null,
        anchor_height: (p as any).anchor_height ?? null,
        sort_order: idx + 1,
        tab_order: p.tab_order ?? 0,
        is_visible: p.is_visible,
      }));

      // Save field placements and button placements in parallel
      const currentButtons = buttonPlacementsRef.current;
      const buttonPayload = currentButtons.map((b, idx) => ({
        id: b.id || undefined,
        form_window_id: currentWindow.id,
        form_element_id: b.form_element_id,
        button_type: b.button_type,
        button_label: b.button_label,
        button_labels: b.button_labels || null,
        button_icon: b.button_icon,
        button_action: b.button_action,
        button_background_color: b.button_background_color,
        button_text_color: b.button_text_color,
        x_position: b.x_position,
        y_position: b.y_position,
        width: b.width,
        height: b.height,
        anchor_right: (b as any).anchor_right ?? null,
        anchor_bottom: (b as any).anchor_bottom ?? null,
        anchor_width: (b as any).anchor_width ?? null,
        anchor_height: (b as any).anchor_height ?? null,
        sort_order: idx + 1,
        tab_order: b.tab_order ?? 0,
        is_visible: b.is_visible,
      }));

      // Only save field/button placements for non-menu window types
      if (selectedWindowType !== 'main_menu') {
        // Run the two saves in parallel but keep the original semantics:
        // a placement save failure aborts (throws), a button save failure
        // is non-fatal (we just keep the existing local state).
        const fieldP = apiClient.put(`/form-layout/${currentWindow.id}/placements`, {
          placements: payload,
          table_id: selectedTableId,
        });
        const btnP = apiClient.put(`/form-layout/${currentWindow.id}/buttons`, {
          buttons: buttonPayload,
        });

        let data: any;
        try {
          data = await fieldP;
        } catch (err: any) {
          throw new Error(err?.response?.data?.message || 'Save failed');
        }
        const savedPlacements = Array.isArray(data) ? data : (data.data || data.placements || []);
        if (savedPlacements.length > 0) {
          setPlacements(savedPlacements);
        }

        try {
          const btnData: any = await btnP;
          const savedButtons = Array.isArray(btnData) ? btnData : (btnData.data || []);
          setButtonPlacements(savedButtons);
        } catch {
          // Button save failure is non-fatal - keep existing state
        }
      }

      // Save menu items (for main_menu) - also save when empty to delete all DB items
      if (selectedWindowType === 'main_menu') {
        const menuPayload = menuPlacementsRef.current.map((item, idx) => ({
          ...item,
          sort_order: idx,
          tab_order: item.tab_order ?? 0,
        }));

        try {
          const menuData: any = await apiClient.put(`/form-layout/${currentWindow.id}/menu-items`, {
            menu_items: menuPayload,
          });
          setMenuPlacements(menuData.data || []);
        } catch {
          // Menu save failure is non-fatal
        }
      }

      setHasUnsavedChanges(false);
      setSelectedPlacementId(null);
      setSelectedButtonNodeId(null);
      setSelectedMenuNodeId(null);
      setLiveGeometry(null);
      toast.current?.show({ severity: 'success', summary: t.formlayoutdesigner_saved || 'Saved', detail: t.formlayoutdesigner_save_success || 'Layout saved successfully.', life: 3000 });
    } catch (err) {
      toast.current?.show({ severity: 'error', summary: t.formlayoutdesigner_error || 'Error', detail: String(err), life: 4000 });
    } finally {
      setSaving(false);
    }
  }, [currentWindow, placements, selectedTableId, selectedWindowType, t]);

  // ========== TAB ORDER HELPERS ==========

  // Apply a {placementId → tab_order} map across all three placement collections.
  const applyTabOrderMap = useCallback((map: Map<number, number>) => {
    setPlacements((prev) => prev.map((p) => (p.id != null && map.has(p.id) ? { ...p, tab_order: map.get(p.id)! } : p)));
    setButtonPlacements((prev) => prev.map((b) => (b.id != null && map.has(b.id) ? { ...b, tab_order: map.get(b.id)! } : b)));
    setMenuPlacements((prev) => prev.map((m) => (m.id != null && map.has(m.id) ? { ...m, tab_order: map.get(m.id)! } : m)));
    setHasUnsavedChanges(true);
  }, []);

  // Assign 1..N to ids in orderedSelection (click order).
  const tabOrderFromSelection = useCallback(() => {
    if (orderedSelection.length < 2) {
      toast.current?.show({
        severity: 'warn',
        summary: t.formdesignerpanel_taborder_from_selection || 'Tab Order from Selection',
        detail: 'Please Ctrl/Shift+Click at least two controls first.',
        life: 3000,
      });
      return;
    }
    const map = new Map<number, number>();
    orderedSelection.forEach((id, idx) => map.set(id, idx + 1));
    applyTabOrderMap(map);
  }, [orderedSelection, applyTabOrderMap, t]);

  // Assign tab order automatically by visual order: top→bottom (20px row buckets), left→right.
  // Items with tab_order === -1 (no tab stop) are skipped and stay -1.
  const tabOrderAuto = useCallback(() => {
    const ROW_BUCKET = 20;
    type Item = { id: number; x: number; y: number; rowBucket: number };
    const all: Item[] = [];
    const collect = (id: number | undefined, x: number, y: number, currentTab: number | undefined) => {
      if (id == null || currentTab === -1) return;
      all.push({ id, x, y, rowBucket: Math.round(y / ROW_BUCKET) });
    };
    placementsRef.current.forEach((p) => collect(p.id, p.x_position, p.y_position, p.tab_order));
    buttonPlacementsRef.current.forEach((b) => collect(b.id, b.x_position, b.y_position, b.tab_order));
    menuPlacementsRef.current.forEach((m) => collect(m.id, m.x_position, m.y_position, m.tab_order));
    all.sort((a, b) => {
      if (a.rowBucket !== b.rowBucket) return a.rowBucket - b.rowBucket;
      if (a.x !== b.x) return a.x - b.x;
      return a.y - b.y;
    });
    const map = new Map<number, number>();
    all.forEach((item, idx) => map.set(item.id, idx + 1));
    applyTabOrderMap(map);
  }, [applyTabOrderMap]);

  // Modal apply: activeIds get 1..N, excludedIds get -1.
  const tabOrderApplyFromModal = useCallback((activeIds: number[], excludedIds: number[]) => {
    const map = new Map<number, number>();
    activeIds.forEach((id, idx) => map.set(id, idx + 1));
    excludedIds.forEach((id) => map.set(id, -1));
    applyTabOrderMap(map);
    setTabOrderModalVisible(false);
  }, [applyTabOrderMap]);

  // Memoized menu model — must be stable to avoid PrimeReact TieredMenu loops.
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

  // Adapter: build the modal's element list from all three placement collections.
  const tabOrderModalElements = useMemo(() => {
    const result: Array<{ id?: number; element_type: string; x_position: number; y_position: number; button_label?: string; tab_label?: string; tab_order?: number }> = [];
    for (const p of placements) {
      if (p.id == null) continue;
      const label = p.caption_override || p.schema_field?.field_name || `field #${p.id}`;
      result.push({
        id: p.id,
        element_type: 'field',
        x_position: p.x_position,
        y_position: p.y_position,
        button_label: label,
        tab_order: p.tab_order ?? 0,
      });
    }
    for (const b of buttonPlacements) {
      if (b.id == null) continue;
      result.push({
        id: b.id,
        element_type: 'button',
        x_position: b.x_position,
        y_position: b.y_position,
        button_label: b.button_label || b.button_type,
        tab_order: b.tab_order ?? 0,
      });
    }
    for (const m of menuPlacements) {
      if (m.id == null) continue;
      result.push({
        id: m.id,
        element_type: 'menu',
        x_position: m.x_position,
        y_position: m.y_position,
        button_label: m.caption_override || `menu #${m.id}`,
        tab_order: m.tab_order ?? 0,
      });
    }
    return result;
  }, [placements, buttonPlacements, menuPlacements]);

  // ========== AUTO-PLACE ==========

  const handleAutoPlace = useCallback(async () => {
    if (!currentWindow) return;
    // For non-menu types, table selection is required
    if (selectedWindowType !== 'main_menu' && selectedTableId == null) return;

    // Confirm if fields/buttons/menu items already exist
    if (placements.length > 0 || buttonPlacements.length > 0 || menuPlacements.length > 0) {
      const confirmed = window.confirm(t.formlayoutdesigner_autoplace_confirm || 'Existing fields and buttons will be replaced. Continue?');
      if (!confirmed) return;
    }

    // Main menu: auto-place all tables as menu items
    if (selectedWindowType === 'main_menu') {
      const containerElements2 = (currentWindow!.elements || []).filter((el: any) =>
        el.element_type === 'menu_container'
      );
      const container = containerElements2[0];
      if (!container) {
        toast.current?.show({ severity: 'warn', summary: t.formlayoutdesigner_warning || 'Warning', detail: 'No menu container found', life: 3000 });
        return;
      }

      const containerWidth = container.width || 200;
      const containerHeight = container.height || 400;
      const isHoriz = containerWidth > containerHeight;
      const gap = 2;

      if (schemaTables.length === 0) {
        toast.current?.show({ severity: 'warn', summary: t.formlayoutdesigner_warning || 'Warning', detail: 'No schema tables loaded. Please load the layout first.', life: 3000 });
        return;
      }

      // Horizontal: items side by side, equal width based on container
      // Vertical: items stacked, full container width
      const menuItemHeight = isHoriz ? (containerHeight - 4) : 32;
      const menuItemWidth = isHoriz ? Math.max(80, Math.floor((containerWidth - (schemaTables.length - 1) * gap) / schemaTables.length)) : containerWidth;

      const newMenuItems: MenuItemPlacementData[] = schemaTables.map((table, idx) => ({
        temp_id: `temp_${Date.now()}_${idx}`,
        form_window_id: currentWindow!.id,
        container_element_id: container.id,
        schema_table_id: table.id,
        caption_override: null,
        caption_labels: null,
        menu_icon: 'pi-table',
        menu_action: null,
        menu_role_required: null,
        menu_depth: 0,
        parent_placement_id: null,
        x_position: isHoriz ? idx * (menuItemWidth + gap) : 0,
        y_position: isHoriz ? 0 : idx * (menuItemHeight + gap),
        width: menuItemWidth,
        height: menuItemHeight,
        sort_order: idx,
        is_visible: true,
      }));

      setMenuPlacements(newMenuItems);
      setPlacements([]);
      setButtonPlacements([]);
      setHasUnsavedChanges(true);
      return;
    }

    // Data table: auto-place ALL fields as columns (no max_fields limit — table scrolls horizontally)
    if (selectedWindowType === 'data_table') {
      const container = (currentWindow.elements || []).find((el: any) => el.element_type === 'container');
      const containerWidth = container?.width || 600;
      const fieldsToPlace = currentFields.filter(f => !f.is_auto_increment && !['created_at', 'updated_at', 'deleted_at'].includes(f.field_name));
      // Distribute width evenly, minimum 100px per column
      const colWidth = Math.max(100, Math.floor(containerWidth / Math.max(1, fieldsToPlace.length)));

      const newPlacements: FormFieldPlacement[] = fieldsToPlace.map((field, idx) => ({
        id: undefined as any,
        form_window_id: currentWindow!.id,
        schema_table_id: Number(selectedTableId),
        schema_field_id: field.id,
        container_element_id: container?.id || 0,
        tab_panel_id: null,
        x_position: 0,
        y_position: 0,
        width: colWidth,
        height: 32,
        caption_override: null,
        control_type: null,
        sort_order: idx,
        is_visible: true,
        schema_field: field,
      }));

      setPlacements(newPlacements);

      // Also auto-place buttons (with FormSet default colors as fallback)
      const buttonElements = (currentWindow.elements || []).filter((el: any) =>
        el.element_type.startsWith('button_')
      );
      const defaultBtnBg = currentFormSet?.default_button_color || '#3b82f6';
      const defaultBtnText = currentFormSet?.default_button_text_color || '#ffffff';
      const newButtons = buttonElements.map((el: any, idx: number) => ({
        id: undefined as any,
        form_window_id: currentWindow!.id,
        form_element_id: el.id,
        button_type: el.element_type,
        button_label: el.button_label,
        button_labels: null,
        button_icon: el.button_icon || BUTTON_DEFAULT_ICONS[el.element_type] || null,
        button_action: el.button_action,
        button_background_color: el.button_background_color || defaultBtnBg,
        button_text_color: el.button_text_color || defaultBtnText,
        x_position: el.x_position,
        y_position: el.y_position,
        width: el.width || 120,
        height: el.height || 36,
        anchor_right: el.anchor_right ?? null,
        anchor_bottom: el.anchor_bottom ?? null,
        anchor_width: el.anchor_width ?? null,
        anchor_height: el.anchor_height ?? null,
        sort_order: idx,
        tab_order: el.tab_order ?? 0,
        is_visible: el.is_visible,
      }));
      setButtonPlacements(newButtons);
      setHasUnsavedChanges(true);
      return;
    }

    // Find containers in current window. tab_panel is intentionally absent —
    // it's a Layout-level concept now (form_layout_tabs), not a Template-level
    // element that the user drops into the window.
    const elements = currentWindow.elements || [];
    const containers = elements.filter((el: any) =>
      el.element_type === 'container' || el.element_type === 'tab_container'
    );

    if (containers.length === 0) {
      toast.current?.show({ severity: 'warn', summary: t.formlayoutdesigner_warning || 'Warning', detail: 'No containers found in this window.', life: 3000 });
      return;
    }

    // ── Tab pre-step ──
    // Auto-Place may need to spawn multiple tab_panel records for a single
    // tab_container (when max_fields × N covers fewer fields than the table
    // has). We wipe any existing tabs for the affected tab_containers first
    // so the run is idempotent, then create new ones lazily during the
    // placement loop. Tabs hit the DB immediately (one POST per tab) so we
    // get real IDs to write into tab_panel_id; if the user abandons the
    // Auto-Place by not saving, leftover empty tabs remain — harmless and
    // overwritten on the next Auto-Place.
    const tabContainerIds = containers
      .filter((c: any) => c.element_type === 'tab_container')
      .map((c: any) => Number(c.id));
    const tabsToWipe = layoutTabs.filter((tb) => tabContainerIds.includes(tb.tab_container_element_id));
    for (const tb of tabsToWipe) {
      try {
        await apiClient.delete(`/form-layout-tabs/${tb.id}`);
      } catch { /* silent — the next call will surface real errors */ }
    }
    const newTabsByContainer: Record<number, FormLayoutTab[]> = {};
    const spawnTab = async (containerId: number): Promise<FormLayoutTab | null> => {
      try {
        const resp: any = await apiClient.post(
          `/form-windows/${currentWindow.id}/tables/${selectedTableId}/tabs`,
          { tab_container_element_id: containerId }
        );
        const newTab: FormLayoutTab = resp.data || resp;
        if (!newTabsByContainer[containerId]) newTabsByContainer[containerId] = [];
        newTabsByContainer[containerId].push(newTab);
        return newTab;
      } catch {
        return null;
      }
    };
    // Matches FormLayoutController::TAB_HEADER_HEIGHT. The visible tab strip
    // is 32 px; the extra 10 px is breathing room so the first row of fields
    // doesn't touch the strip's bottom edge.
    const TAB_HEADER_HEIGHT = 42;

    // Auto-place fields (frontend-only, no DB save until user clicks Save).
    //
    // Defaults source: the Zahnrad-Settings (designerDefaults) are AUTHORITATIVE
    // for height/gap/label_position. We deliberately do NOT fall through to
    // `currentContainer.container_gap` / `default_control_height` even though
    // the DB carries defaults (8 / 56) for those columns — otherwise the
    // user's global preference would silently be overruled by the per-
    // container row's default, which surprised the user ("ignored my
    // settings"). Per-container fine-tuning is a future-feature; today
    // Auto-Place follows the Zahnrad uniformly.
    // Scrollbar gutter: native vertical scrollbar steals ~15-17px from the
    // container's content width when the form gets long enough to overflow
    // (which the Live Preview shows with overflow:auto). Reserving that gutter
    // up-front avoids a horizontal scrollbar appearing as soon as a single
    // pixel of horizontal overflow exists. 17px matches Chrome/Edge default;
    // Firefox is similar. The few pixels we "lose" on short forms (no scroll
    // needed) are imperceptible at field widths of 400+.
    const SCROLLBAR_GUTTER = 17;

    const computeFieldWidth = (container: FormElement, gapPx: number, cols: number): number => {
      const usable = Math.max(40, (container.width || 0) - SCROLLBAR_GUTTER);
      return cols > 1 ? Math.floor((usable - (cols - 1) * gapPx) / cols) : usable;
    };

    const newPlacements: FormFieldPlacement[] = [];
    let containerIdx = 0;
    let fieldCount = 0;
    let currentContainer = containers[containerIdx];
    let columns = currentContainer.container_columns || 1;
    let maxFields = currentContainer.max_fields || 0;
    let gap = designerDefaults.gap;
    let fieldHeight = designerDefaults.controlHeight;
    let fieldWidth = computeFieldWidth(currentContainer, gap, columns);
    // Active tab for the current container. Only non-null when the current
    // container is a tab_container — gets spawned lazily so we only create
    // tabs that will actually hold fields.
    let currentTab: FormLayoutTab | null = null;
    if (currentContainer.element_type === 'tab_container') {
      currentTab = await spawnTab(Number(currentContainer.id));
    }

    for (const field of currentFields) {
      if (field.is_auto_increment) continue;
      if (['created_at', 'updated_at', 'deleted_at'].includes(field.field_name)) continue;

      // Container/tab full: tab_container spawns a NEW tab on the same
      // container; plain container jumps to the NEXT container in the list.
      if (maxFields > 0 && fieldCount >= maxFields) {
        if (currentContainer.element_type === 'tab_container') {
          currentTab = await spawnTab(Number(currentContainer.id));
          fieldCount = 0;
        } else {
          containerIdx++;
          if (containerIdx >= containers.length) break;
          currentContainer = containers[containerIdx];
          columns = currentContainer.container_columns || 1;
          maxFields = currentContainer.max_fields || 0;
          gap = designerDefaults.gap;
          fieldHeight = designerDefaults.controlHeight;
          fieldWidth = computeFieldWidth(currentContainer, gap, columns);
          fieldCount = 0;
          currentTab = currentContainer.element_type === 'tab_container'
            ? await spawnTab(Number(currentContainer.id))
            : null;
        }
      }

      const col = fieldCount % columns;
      const row = Math.floor(fieldCount / columns);
      const x = col * (fieldWidth + gap);
      // tab_container: reserve TAB_HEADER_HEIGHT for the strip so the first
      // row doesn't draw on top of the tabs.
      const yBase = currentContainer.element_type === 'tab_container' ? TAB_HEADER_HEIGHT : 0;
      const y = yBase + row * (fieldHeight + gap);

      // Determine control type based on field type
      let controlType = 'text';
      const ft = field.field_type.toUpperCase();
      if (ft.includes('INT') || ft === 'BIGINT' || ft === 'SMALLINT' || ft === 'TINYINT' || ft === 'MEDIUMINT') controlType = 'integer';
      else if (ft.includes('DECIMAL') || ft.includes('FLOAT') || ft.includes('DOUBLE') || ft.includes('NUMERIC')) controlType = 'float';
      else if (ft === 'DATE') controlType = 'date';
      else if (ft === 'TIME') controlType = 'time';
      else if (ft === 'DATETIME' || ft === 'TIMESTAMP') controlType = 'datetime';
      else if (ft === 'BOOLEAN' || ft === 'TINYINT(1)' || ft === 'BIT') controlType = 'checkbox';
      else if (ft.includes('TEXT') || ft.includes('LONGTEXT') || ft.includes('MEDIUMTEXT')) controlType = 'textarea';
      else if (ft.includes('BLOB') || ft.includes('BINARY')) controlType = 'file';

      newPlacements.push({
        form_window_id: currentWindow.id,
        schema_table_id: Number(selectedTableId),
        schema_field_id: field.id,
        container_element_id: Number(currentContainer.id),
        // tab_panel_id points at the spawned FormLayoutTab row when we're
        // inside a tab_container; null for plain containers.
        tab_panel_id: currentTab?.id ?? null,
        x_position: x,
        y_position: y,
        width: fieldWidth,
        height: fieldHeight,
        caption_override: null,
        control_type_override: controlType,
        control_type: controlType,
        label_position: designerDefaults.labelPosition,
        label_width: 100,
        sort_order: newPlacements.length + 1,
        is_visible: true,
        schema_field: field,
      });

      fieldCount++;
    }

    // Auto-place buttons from FormWindow elements (frontend-only).
    // No more report-type skip — reports are handled by ReportPattern now.
    let newButtons: ButtonPlacementData[] = [];

    {
      const buttonElements = elements.filter((el: any) =>
        ['button_nav_first', 'button_nav_prev', 'button_nav_next', 'button_nav_last',
         'button_save', 'button_cancel', 'button_close', 'button_new', 'button_delete', 'button_custom', 'button_print'
        ].includes(el.element_type)
      );

      newButtons = buttonElements.map((el: any, idx: number) => ({
        form_window_id: currentWindow.id,
        form_element_id: el.id,
        button_type: el.element_type,
        button_label: el.button_label,
        button_icon: el.effective_icon || el.button_icon,
        button_action: el.button_action,
        button_background_color: el.button_background_color,
        button_text_color: el.button_text_color,
        x_position: el.x_position,
        y_position: el.y_position,
        width: el.width || 120,
        height: el.height || 36,
        // Anchors from the template — so the auto-placed layout already
        // inherits whatever the template designer set on each button.
        anchor_right: el.anchor_right ?? null,
        anchor_bottom: el.anchor_bottom ?? null,
        anchor_width: el.anchor_width ?? null,
        anchor_height: el.anchor_height ?? null,
        sort_order: idx,
        tab_order: el.tab_order ?? 0,
        is_visible: el.is_visible !== false,
      }) as any);
    }

    // ── Tab-Order expansion ──
    // Walk template elements in their tab_order. Containers "loan" their slot
    // to the field placements they hold (in field order); buttons keep their
    // own slot. Result: a single sequential 1..N numbering across the whole
    // window. Elements with tab_order === -1 stay -1 (no tab stop) and are
    // skipped from numbering. Containers with tab_order 0 (= unset) only
    // produce numbered fields if they actually have placements; their fields
    // then default to the position the container would have had.
    {
      type Slot = { kind: 'field'; placementIdx: number } | { kind: 'button'; buttonIdx: number };
      const slots: Slot[] = [];

      // Sort all template elements by tab_order ascending; -1 goes last and is excluded.
      const tabRelevant = elements
        .filter((el: any) => (el.tab_order ?? 0) !== -1)
        .slice()
        .sort((a: any, b: any) => (a.tab_order ?? 0) - (b.tab_order ?? 0));

      const consumedFieldIdx = new Set<number>();
      const consumedButtonIdx = new Set<number>();

      for (const el of tabRelevant) {
        const isContainer = el.element_type === 'container'
          || el.element_type === 'tab_container'
          || el.element_type === 'tab_panel';
        const isButton = typeof el.element_type === 'string' && el.element_type.startsWith('button_');

        if (isContainer) {
          // Append all fields belonging to this container, in their existing
          // order (sort_order from the placement loop above).
          newPlacements.forEach((p, idx) => {
            if (consumedFieldIdx.has(idx)) return;
            if (Number(p.container_element_id) !== Number(el.id)) return;
            slots.push({ kind: 'field', placementIdx: idx });
            consumedFieldIdx.add(idx);
          });
        } else if (isButton) {
          const bIdx = newButtons.findIndex((b, i) => !consumedButtonIdx.has(i) && Number(b.form_element_id) === Number(el.id));
          if (bIdx >= 0) {
            slots.push({ kind: 'button', buttonIdx: bIdx });
            consumedButtonIdx.add(bIdx);
          }
        }
      }

      // Append any leftovers (fields/buttons whose template element had no
      // tab_order, or whose container wasn't tab-relevant) at the end.
      newPlacements.forEach((_, idx) => {
        if (!consumedFieldIdx.has(idx)) slots.push({ kind: 'field', placementIdx: idx });
      });
      newButtons.forEach((_, idx) => {
        if (!consumedButtonIdx.has(idx)) slots.push({ kind: 'button', buttonIdx: idx });
      });

      // Assign sequential 1..N tab_order. Items with original tab_order === -1
      // were excluded above and keep -1.
      slots.forEach((slot, i) => {
        const num = i + 1;
        if (slot.kind === 'field') {
          newPlacements[slot.placementIdx] = { ...newPlacements[slot.placementIdx], tab_order: num };
        } else {
          newButtons[slot.buttonIdx] = { ...newButtons[slot.buttonIdx], tab_order: num };
        }
      });

      // Buttons that came from a template element with tab_order === -1 keep -1.
      newButtons.forEach((b, i) => {
        const tplEl = elements.find((el: any) => Number(el.id) === Number(b.form_element_id));
        if (tplEl && (tplEl.tab_order ?? 0) === -1) {
          newButtons[i] = { ...newButtons[i], tab_order: -1 };
        }
      });
    }

    setPlacements(newPlacements);
    setButtonPlacements(newButtons);
    setHasUnsavedChanges(true); // Mark as unsaved - user must click Save

    // Reflect the freshly-spawned tabs in local state so the canvas
    // strip + properties panel see them without another round-trip.
    const allNewTabs = Object.values(newTabsByContainer).flat();
    if (allNewTabs.length > 0 || tabsToWipe.length > 0) {
      setLayoutTabs(allNewTabs);
      const activeMap: Record<number, number> = {};
      for (const tb of allNewTabs) {
        if (activeMap[tb.tab_container_element_id] === undefined) {
          activeMap[tb.tab_container_element_id] = tb.id;
        }
      }
      setActiveTabByContainer(activeMap);
      setSelectedTabId(null);
    }
    setSelectedPlacementId(null);
    setSelectedButtonNodeId(null);
    setLiveGeometry(null);
    toast.current?.show({ severity: 'success', summary: t.formlayoutdesigner_success || 'Success', detail: t.formlayoutdesigner_auto_placed || 'Fields and buttons auto-placed. Click Save to persist.', life: 3000 });
  }, [currentWindow, selectedTableId, selectedWindowType, currentFields, placements, buttonPlacements, menuPlacements, schemaTables, layoutTabs, t]);

  // ========== DELETE PLACEMENT ==========

  const handleDeletePlacement = useCallback(async () => {
    if (!selectedPlacement) return;

    if (selectedPlacement.id) {
      try {
        await apiClient.delete(`/form-layout/placements/${selectedPlacement.id}`);
      } catch (err: any) {
        const detail = err?.response?.data?.message || err?.message || 'Delete failed';
        toast.current?.show({ severity: 'error', summary: t.formlayoutdesigner_error || 'Error', detail, life: 4000 });
        return;
      }
    }

    setPlacements((prev) => prev.filter((p) => Number(p.id || p.schema_field_id) !== Number(selectedPlacementId)));
    setSelectedPlacementId(null);
    setHasUnsavedChanges(true);
  }, [selectedPlacement, selectedPlacementId, t]);

  // ========== PROPERTY UPDATES ==========

  const updatePlacementProp = useCallback(<K extends keyof FormFieldPlacement>(key: K, value: FormFieldPlacement[K]) => {
    if (selectedPlacementId == null) return;
    // CRITICAL: merge ref geometry for EVERY field, not just the selected one,
    // AND sync ref synchronously before setState. The useEffect that syncs
    // `placementsRef.current = placements` runs AFTER buildAllNodes, so without
    // the synchronous ref update the user would have to press Enter twice
    // before the new size is reflected. Same pattern applied to buttons.
    const next = placementsRef.current.map((p) => {
      const refP = placementsRef.current.find((rp) =>
        Number(rp.id || rp.schema_field_id) === Number(p.id || p.schema_field_id)
      );
      const withRefGeom = refP ? {
        ...p,
        x_position: refP.x_position,
        y_position: refP.y_position,
        width: refP.width,
        height: refP.height,
      } : p;
      if (Number(p.id || p.schema_field_id) !== Number(selectedPlacementId)) return withRefGeom;
      return { ...withRefGeom, [key]: value };
    });
    placementsRef.current = next;
    setPlacements(next);
    // Also patch the corresponding ReactFlow node IMMEDIATELY so the canvas
    // reflects the change in the same frame instead of waiting for the
    // buildAllNodes useEffect to fire after React commits state. Geometry-only
    // updates (x/y/w/h) get translated into ReactFlow's position/style; other
    // properties only need a data refresh so the custom node re-renders.
    const targetNodeId = `placement-${selectedPlacementId}`;
    setNodes((prev) => prev.map((n) => {
      if (n.id !== targetNodeId) return n;
       
      const next: any = { ...n, data: { ...n.data } };
      if (key === 'x_position' && typeof value === 'number') next.position = { ...next.position, x: value };
      if (key === 'y_position' && typeof value === 'number') next.position = { ...next.position, y: value };
      if (key === 'width' && typeof value === 'number') { next.style = { ...next.style, width: value }; next.width = value; }
      if (key === 'height' && typeof value === 'number') { next.style = { ...next.style, height: value }; next.height = value; }
      // Refresh the placement data inside the node so custom node re-renders.
      if (next.data?.placement) {
        next.data = { ...next.data, placement: { ...next.data.placement, [key]: value } };
      }
      return next;
    }));
    setHasUnsavedChanges(true);
  }, [selectedPlacementId, setNodes]);

  // ========== MULTI-EDIT HELPERS ==========

  // Apply updates to ALL placements selected via selectedNodeIds (works for
  // unsaved placements too). Mirrors updatePlacementProp's geometry-merge so
  // positions/sizes from a recent drag/resize aren't lost.
  const updateMultiplePlacements = useCallback((updates: Partial<FormFieldPlacement>) => {
    // Driven by selectedNodeIds so unsaved placements participate.
    const selectedFieldKeys = selectedNodeIds.filter((id) => id.startsWith('placement-'));
    if (selectedFieldKeys.length === 0) return;
    const next = placementsRef.current.map((p) => {
      const pKey = `placement-${p.id || p.schema_field_id || `rc-${p.sort_order}`}`;
      const refP = placementsRef.current.find((rp) =>
        Number(rp.id || rp.schema_field_id) === Number(p.id || p.schema_field_id)
      );
      const withRefGeom = refP ? {
        ...p,
        x_position: refP.x_position,
        y_position: refP.y_position,
        width: refP.width,
        height: refP.height,
      } : p;
      if (!selectedFieldKeys.includes(pKey)) return withRefGeom;
      return { ...withRefGeom, ...updates };
    });
    placementsRef.current = next;
    setPlacements(next);
    setHasUnsavedChanges(true);
  }, [selectedNodeIds]);

  const updateMultipleButtons = useCallback((updates: Partial<ButtonPlacementData>) => {
    // Driven by selectedNodeIds (string keys) so unsaved buttons are included.
    const selectedButtonKeys = selectedNodeIds.filter((id) => id.startsWith('button-'));
    if (selectedButtonKeys.length === 0) return;
    const next = buttonPlacementsRef.current.map((b) => {
      const bKey = `button-${b.id || b.button_type}-${b.sort_order}`;
      // Pull ref geometry into the new state for EVERY row — this prevents
      // pending drags on non-edited buttons from being clobbered when the
      // ref←state sync useEffect fires.
      const refB = buttonPlacementsRef.current.find((rb) =>
        `button-${rb.id || rb.button_type}-${rb.sort_order}` === bKey
      );
      const withRefGeom = refB ? {
        ...b,
        x_position: refB.x_position,
        y_position: refB.y_position,
        width: refB.width,
        height: refB.height,
      } : b;
      if (!selectedButtonKeys.includes(bKey)) return withRefGeom;
      return { ...withRefGeom, ...updates };
    });
    // Update ref FIRST (synchronous) so the next buildAllNodes pass — which
    // may run before the sync useEffect — already sees the new values. This
    // is the fix for the "double-Enter required" symptom.
    buttonPlacementsRef.current = next;
    setButtonPlacements(next);
    setHasUnsavedChanges(true);
  }, [selectedNodeIds]);

  // Categorize the current multi-selection. 'single' = nothing or one item;
  // 'fields'/'buttons'/'menus' = ≥2 items all of one kind; 'mixed' = ≥2 of different kinds.
  // Driven by selectedNodeIds (string keys) so freshly-dropped, not-yet-saved
  // items still count toward multi-edit — the older DB-id path missed them.
  const selectedKind = useMemo<'single' | 'fields' | 'buttons' | 'menus' | 'mixed'>(() => {
    if (selectedNodeIds.length < 2) return 'single';
    let fCount = 0, bCount = 0, mCount = 0;
    for (const nodeId of selectedNodeIds) {
      if (nodeId.startsWith('placement-')) fCount++;
      else if (nodeId.startsWith('button-')) bCount++;
      else if (nodeId.startsWith('menu-')) mCount++;
    }
    const total = fCount + bCount + mCount;
    if (fCount === total) return 'fields';
    if (bCount === total) return 'buttons';
    if (mCount === total) return 'menus';
    return 'mixed';
  }, [selectedNodeIds]);

  const multiSelectedFields = useMemo(
    () => placements.filter((p) => {
      const nodeId = `placement-${p.id || p.schema_field_id || `rc-${p.sort_order}`}`;
      return selectedNodeIds.includes(nodeId);
    }),
    [placements, selectedNodeIds]
  );
  const multiSelectedButtons = useMemo(
    () => buttonPlacements.filter((b) => {
      const nodeId = `button-${b.id || b.button_type}-${b.sort_order}`;
      return selectedNodeIds.includes(nodeId);
    }),
    [buttonPlacements, selectedNodeIds]
  );

  // Returns the common value across `items[key]` if all rows agree; null otherwise.
  // Used to drive multi-edit input values: shared values display the value, mixed
  // values display empty so the user sees they would overwrite all rows.
   
  const commonValue = <T extends Record<string, any>>(items: T[], key: string): any => {
    if (items.length === 0) return null;
    const first = items[0][key];
    for (let i = 1; i < items.length; i++) {
      if (items[i][key] !== first) return null;
    }
    return first;
  };

  // ========== MULTI-EDIT RENDER HELPERS ==========
  // Read & write helpers used inside the Properties Panel JSX. They route to
  // single-edit (the existing updatePlacementProp / setButtonPlacements path)
  // or multi-edit (updateMultiplePlacements / updateMultipleButtons) depending
  // on selectedKind. The "shared value" reads return commonValue() in multi
  // mode so the input shows the agreed value (or empty if rows differ).
  const multiEditFields = selectedKind === 'fields';
  const multiEditButtons = selectedKind === 'buttons';
   
  const fieldSharedValue = (key: string, fallback: any = null): any => {
    if (multiEditFields) {
       
      const c = commonValue(multiSelectedFields as any[], key);
      return c ?? fallback;
    }
     
    return (selectedPlacement as any)?.[key] ?? fallback;
  };
   
  const buttonSharedValue = (key: string, fallback: any = null): any => {
    if (multiEditButtons) {
       
      const c = commonValue(multiSelectedButtons as any[], key);
      return c ?? fallback;
    }
     
    return (selectedButton as any)?.[key] ?? fallback;
  };
   
  const updateFieldShared = (key: string, value: any) => {
    if (multiEditFields) {
       
      updateMultiplePlacements({ [key]: value } as any);
    } else {
       
      updatePlacementProp(key as any, value);
    }
  };
   
  const updateButtonShared = (key: string, value: any) => {
    updateButtonProps({ [key]: value });
  };

  // Apply a set of property updates to the currently selected button (single
  // edit) or delegate to updateMultipleButtons (multi edit). Every button row
  // in state has its ref geometry merged in first so in-flight drags on the
  // non-edited buttons aren't discarded by the buttonPlacementsRef←state sync.
  // This is the academically correct fix to the "property change reverts drag"
  // cascade: the bug isn't in any single helper — it's that the ref sync over-
  // writes pending drags whenever state mutates for any reason.
  function updateButtonProps(updates: Partial<ButtonPlacementData>) {
    if (multiEditButtons) {
      updateMultipleButtons(updates);
      return;
    }
    if (!selectedButtonNodeId) return;
    const next = buttonPlacementsRef.current.map((b) => {
      const bKey = `button-${b.id || b.button_type}-${b.sort_order}`;
      const refB = buttonPlacementsRef.current.find(
        (rb) => `button-${rb.id || rb.button_type}-${rb.sort_order}` === bKey
      );
      const withRefGeom = refB ? {
        ...b,
        x_position: refB.x_position,
        y_position: refB.y_position,
        width: refB.width,
        height: refB.height,
      } : b;
      if (bKey !== selectedButtonNodeId) return withRefGeom;
      return { ...withRefGeom, ...updates } as any;
    });
    // Sync ref FIRST so a buildAllNodes run that fires before the ref-sync
    // useEffect already sees the new values — fixes "needs Enter twice".
    buttonPlacementsRef.current = next;
    setButtonPlacements(next);
    setHasUnsavedChanges(true);
  }
  // Visual styling for grayed-out per-item inputs in multi-edit mode.
  const disabledStyle = { opacity: 0.4, pointerEvents: 'none' as const };

  // ========== RENDER ==========

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: colors.bgPrimary,
        color: colors.textPrimary,
      }}
    >
      <Toast ref={toast} />

      {/* Hidden drag image element for custom drag preview */}
      <div
        ref={dragImageRef}
        style={{
          position: 'fixed', top: -100, left: -100,
          padding: '4px 10px', borderRadius: 4, fontSize: 12, fontWeight: 500,
          backgroundColor: '#3b82f6', color: '#fff',
          whiteSpace: 'nowrap', pointerEvents: 'none', zIndex: -1,
          display: 'none',
        }}
      />

      {/* ===== TOOLBAR ===== */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 12px',
        backgroundColor: colors.bgSecondary,
        borderBottom: `1px solid ${colors.borderPrimary}`,
        flexShrink: 0,
        flexWrap: 'wrap',
      }}>
        {/* FormSet dropdown */}
        <Dropdown
          value={selectedFormSetId}
          options={formSets.map((fs) => ({ label: fs.name, value: fs.id }))}
          onChange={(e) => setSelectedFormSetId(e.value)}
          placeholder={t.formlayoutdesigner_select_formset || 'Form Set'}
          style={{ width: 160, fontSize: 12 }}
          className="p-inputtext-sm"
        />

        {/* Window Type dropdown */}
        <Dropdown
          value={selectedWindowType}
          options={WINDOW_TYPE_OPTIONS}
          onChange={(e) => setSelectedWindowType(e.value)}
          placeholder={t.formlayoutdesigner_window_type || 'Window Type'}
          style={{ width: 140, fontSize: 12 }}
          className="p-inputtext-sm"
        />

        {/* Schema dropdown */}
        <Dropdown
          value={selectedSchemaId}
          options={schemas.map((s) => ({ label: s.name, value: s.id }))}
          onChange={(e) => { setSelectedSchemaId(e.value); setSelectedTableId(null); }}
          placeholder={t.formlayoutdesigner_schema || 'Schema'}
          style={{ width: 150, fontSize: 12 }}
          className="p-inputtext-sm"
        />

        {/* Table dropdown - hidden for main_menu */}
        {selectedWindowType !== 'main_menu' && (
          <Dropdown
            value={selectedTableId}
            options={tables.map((tbl) => ({ label: tbl.table_name, value: tbl.id }))}
            onChange={(e) => setSelectedTableId(e.value)}
            placeholder={t.formlayoutdesigner_table || 'Table'}
            style={{ width: 150, fontSize: 12 }}
            className="p-inputtext-sm"
            disabled={tables.length === 0}
          />
        )}

        {/* Load button */}
        <Button
          label={t.formlayoutdesigner_load || 'Load'}
          icon="pi pi-download"
          onClick={handleLoad}
          loading={loading}
          className="p-button-sm"
          style={{ fontSize: 12 }}
        />

        {/* Separator */}
        <div style={{ width: 1, height: 24, backgroundColor: colors.borderPrimary }} />

        {/* Language dropdown (independent of Load - changes labels live) */}
        <Dropdown
          value={selectedLanguage}
          options={enabledLanguages}
          onChange={(e) => { suppressDeselect.current = true; setSelectedLanguage(e.value); setTimeout(() => { suppressDeselect.current = false; }, 300); }}
          placeholder={t.formlayoutdesigner_language || 'Language'}
          style={{ width: 90, fontSize: 12 }}
          className="p-inputtext-sm"
          disabled={enabledLanguages.length === 0}
        />

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Unsaved indicator */}
        {hasUnsavedChanges && (
          <span style={{ fontSize: 11, color: colors.errorText, fontWeight: 600 }}>
            {t.formlayoutdesigner_unsaved || 'Unsaved changes'}
          </span>
        )}

        {/* Clear/Reset button - deletes from DB immediately */}
        <Button
          icon="pi pi-trash"
          onClick={async () => {
            if (placements.length === 0 && buttonPlacements.length === 0 && menuPlacements.length === 0 && layoutTabs.length === 0) return;
            const confirmed = window.confirm(t.formlayoutdesigner_clear_confirm || 'Remove all fields and buttons from this layout?');
            if (!confirmed) return;

            // Clear from DB immediately
            if (currentWindow) {
              try {
                const promises: Promise<any>[] = [];
                if (selectedWindowType === 'main_menu') {
                  promises.push(apiClient.put(`/form-layout/${currentWindow.id}/menu-items`, { menu_items: [] }));
                } else {
                  if (selectedTableId) {
                    promises.push(apiClient.put(`/form-layout/${currentWindow.id}/placements`, { placements: [], table_id: selectedTableId }));
                  }
                  promises.push(apiClient.put(`/form-layout/${currentWindow.id}/buttons`, { buttons: [] }));
                  // Tabs are independent rows in form_layout_tabs, NOT cleared
                  // by the placements/buttons endpoints. Without this loop a
                  // "Clear" would leave orphan tabs in the DB — and the next
                  // Auto-Place would try to recreate sort_order=0 against
                  // those orphans, hitting the unique constraint or stacking
                  // a fresh set after the leftovers.
                  for (const tb of layoutTabs) {
                    promises.push(apiClient.delete(`/form-layout-tabs/${tb.id}`));
                  }
                }
                await Promise.all(promises);
              } catch {
                // DB delete failed silently - local state still cleared
              }
            }

            setPlacements([]);
            setButtonPlacements([]);
            setMenuPlacements([]);
            setLayoutTabs([]);
            setActiveTabByContainer({});
            setSelectedTabId(null);
            setSelectedPlacementId(null);
            setSelectedButtonNodeId(null);
            setSelectedMenuNodeId(null);
            setLiveGeometry(null);
            setHasUnsavedChanges(false);
            toast.current?.show({ severity: 'info', summary: t.formlayoutdesigner_saved || 'Cleared', detail: t.formlayoutdesigner_clear || 'All items deleted.', life: 3000 });
          }}
          disabled={!currentWindow || (placements.length === 0 && buttonPlacements.length === 0 && menuPlacements.length === 0 && layoutTabs.length === 0)}
          className="p-button-sm p-button-danger p-button-outlined"
          style={{ fontSize: 12 }}
          tooltip={t.formlayoutdesigner_clear || 'Clear all'}
          tooltipOptions={{ position: 'bottom' }}
        />

        {/* Live Preview button */}
        <Button
          icon="pi pi-eye"
          tooltip="Live Preview"
          tooltipOptions={{ position: 'bottom' }}
          onClick={() => setShowLivePreview(true)}
          disabled={!currentWindow || (placements.length === 0 && menuPlacements.length === 0 && buttonPlacements.length === 0)}
          className="p-button-sm p-button-info p-button-outlined"
          style={{ fontSize: 12 }}
        />

        {/* Tab Order menu */}
        {currentWindow && (
          <>
            <Menu model={tabOrderMenuModel} popup ref={tabOrderMenuRef} id="layout-tab-order-menu" />
            <Button
              label={t.formdesignerpanel_taborder_menu}
              icon="pi pi-sort-numeric-down"
              className="p-button-sm p-button-info p-button-outlined"
              style={{ fontSize: 12 }}
              onClick={(e) => tabOrderMenuRef.current?.toggle(e)}
              aria-controls="layout-tab-order-menu"
              aria-haspopup
            />
          </>
        )}

        {/* Save button */}
        <Button
          label={t.formlayoutdesigner_save || 'Save'}
          icon="pi pi-save"
          onClick={handleSave}
          loading={saving}
          disabled={!currentWindow || !hasUnsavedChanges}
          className="p-button-sm p-button-success"
          style={{ fontSize: 12 }}
        />

        {/* Auto-Place button */}
        <Button
          label={t.formlayoutdesigner_auto_place || 'Auto-Place'}
          icon="pi pi-th-large"
          onClick={handleAutoPlace}
          disabled={!currentWindow || (selectedWindowType !== 'main_menu' && selectedTableId == null)}
          className="p-button-sm p-button-outlined"
          style={{ fontSize: 12 }}
        />

        {/* Settings (Zahnrad): Defaults for auto-place + per-layout window dimensions.
            Pre-fill with the *effective* dimensions: per-table override if set,
            else the FormWindow template defaults. */}
        <Button
          icon="pi pi-cog"
          onClick={() => {
            setDraftSettings({
              ...designerDefaults,
              windowWidth: tableLayoutOverride?.width ?? currentWindow?.default_width ?? 800,
              windowHeight: tableLayoutOverride?.height ?? currentWindow?.default_height ?? 600,
            });
            setShowSettingsDialog(true);
          }}
          tooltip="Layout-Defaults & Fenstergröße (pro Tabelle)"
          tooltipOptions={{ position: 'bottom' }}
          disabled={!currentWindow || selectedTableId == null}
          className="p-button-sm p-button-text"
          style={{ fontSize: 12 }}
        />
      </div>

      {/* ===== SETTINGS DIALOG ===== */}
      <Dialog
        header="Layout-Designer Einstellungen"
        visible={showSettingsDialog}
        onHide={() => setShowSettingsDialog(false)}
        style={{ width: 460 }}
        modal
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '6px 2px' }}>
          {/* --- Auto-Place Defaults (persisted in localStorage) --- */}
          <div style={{ fontSize: 11, fontWeight: 600, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Defaults für Auto-Place
          </div>

          <div>
            <label style={{ fontSize: 12, color: colors.textSecondary, display: 'block', marginBottom: 4 }}>
              Label-Position
            </label>
            <Dropdown
              value={draftSettings.labelPosition}
              options={[
                { label: 'Über dem Feld (top)', value: 'top' },
                { label: 'Links vom Feld (left)', value: 'left' },
              ]}
              onChange={(e) => setDraftSettings(prev => ({ ...prev, labelPosition: e.value }))}
              className="w-full"
            />
          </div>

          <div>
            <label style={{ fontSize: 12, color: colors.textSecondary, display: 'block', marginBottom: 4 }}>
              Control-Höhe (px)
            </label>
            <InputNumber
              value={draftSettings.controlHeight}
              onValueChange={(e) => setDraftSettings(prev => ({ ...prev, controlHeight: e.value ?? 56 }))}
              min={20} max={300}
              className="w-full"
            />
          </div>

          <div>
            <label style={{ fontSize: 12, color: colors.textSecondary, display: 'block', marginBottom: 4 }}>
              Abstand zwischen Controls (px)
            </label>
            <InputNumber
              value={draftSettings.gap}
              onValueChange={(e) => setDraftSettings(prev => ({ ...prev, gap: e.value ?? 8 }))}
              min={0} max={100}
              className="w-full"
            />
          </div>

          {/* --- Window Dimensions (saved to FormWindow) --- */}
          <div style={{ fontSize: 11, fontWeight: 600, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 8 }}>
            Fenstergröße ({currentWindow?.display_name || ''})
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 12, color: colors.textSecondary, display: 'block', marginBottom: 4 }}>
                Breite (px)
              </label>
              <InputNumber
                value={draftSettings.windowWidth}
                onValueChange={(e) => setDraftSettings(prev => ({ ...prev, windowWidth: e.value ?? 800 }))}
                min={200} max={4000}
                className="w-full"
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 12, color: colors.textSecondary, display: 'block', marginBottom: 4 }}>
                Höhe (px)
              </label>
              <InputNumber
                value={draftSettings.windowHeight}
                onValueChange={(e) => setDraftSettings(prev => ({ ...prev, windowHeight: e.value ?? 600 }))}
                min={200} max={4000}
                className="w-full"
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
            <Button
              label="Abbrechen"
              icon="pi pi-times"
              onClick={() => setShowSettingsDialog(false)}
              className="p-button-sm p-button-text"
            />
            <Button
              label="Übernehmen"
              icon="pi pi-check"
              onClick={async () => {
                // Persist auto-place defaults locally
                const newDefaults: DesignerDefaults = {
                  labelPosition: draftSettings.labelPosition,
                  controlHeight: draftSettings.controlHeight,
                  gap: draftSettings.gap,
                };
                try {
                  localStorage.setItem(SETTINGS_LS_KEY, JSON.stringify(newDefaults));
                } catch { /* localStorage full / disabled — keep in-memory state at least */ }
                setDesignerDefaults(newDefaults);

                // Persist per-table window dimension OVERRIDE (NOT the FormWindow
                // template itself — that would propagate to every table using the
                // same window, which was the bug the user hit). The override lives
                // in form_table_layouts keyed by (form_window_id, schema_table_id).
                if (currentWindow && selectedTableId != null) {
                  try {
                    await apiClient.put(`/form-windows/${currentWindow.id}/table-layouts/${selectedTableId}`, {
                      width: draftSettings.windowWidth,
                      height: draftSettings.windowHeight,
                    });
                    setTableLayoutOverride({ width: draftSettings.windowWidth, height: draftSettings.windowHeight });
                    toast.current?.show({ severity: 'success', summary: 'Gespeichert', detail: `Layout-Größe: ${draftSettings.windowWidth}×${draftSettings.windowHeight}px.`, life: 2500 });
                  } catch {
                    toast.current?.show({ severity: 'error', summary: 'Fehler', detail: 'Layout-Größe konnte nicht gespeichert werden.', life: 4000 });
                  }
                }
                setShowSettingsDialog(false);
              }}
              className="p-button-sm p-button-success"
            />
          </div>
        </div>
      </Dialog>

      {/* ===== MAIN BODY ===== */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* ===== LEFT SIDEBAR: UNIFIED PALETTE ===== */}
        <div style={{
          width: 240,
          flexShrink: 0,
          backgroundColor: colors.bgTertiary,
          borderRight: `1px solid ${colors.borderPrimary}`,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {/* ---- FIELDS & BUTTONS (non-main_menu) ---- */}
            {selectedWindowType !== 'main_menu' && (
              <>
                {/* ---- FIELDS SECTION (collapsible) ---- */}
                <CollapsibleSection
                  title={`${t.formlayoutdesigner_fields || 'Fields'}${currentFields.length > 0 ? ` (${currentFields.length})` : ''}`}
                  defaultOpen={true}
                  colors={colors}
                >
                  {currentFields.length === 0 && (
                    <div style={{ padding: 12, textAlign: 'center', color: colors.textMuted, fontSize: 11 }}>
                      {t.formlayoutdesigner_no_fields || 'Load a layout to see fields.'}
                    </div>
                  )}
                  {currentFields.map((field) => {
                    const isPlaced = placedFieldIds.has(field.id);
                    return (
                      <div
                        key={field.id}
                        draggable={!isPlaced}
                        onDragStart={(e) => {
                          if (isPlaced) { e.preventDefault(); return; }
                          e.dataTransfer.setData('application/field-id', String(field.id));
                          e.dataTransfer.effectAllowed = 'copyMove';
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '5px 8px',
                          marginBottom: 3,
                          borderRadius: 4,
                          backgroundColor: isPlaced ? 'rgba(107,114,128,0.15)' : 'rgba(59,130,246,0.08)',
                          border: `1px solid ${isPlaced ? 'transparent' : 'rgba(59,130,246,0.2)'}`,
                          cursor: isPlaced ? 'default' : 'grab',
                          opacity: isPlaced ? 0.55 : 1,
                          fontSize: 11,
                        }}
                      >
                        {isPlaced ? (
                          <i className="pi pi-check" style={{ color: '#22c55e', fontSize: 11 }} />
                        ) : (
                          <FieldTypeIcon fieldType={field.field_type} isPK={field.is_primary_key} />
                        )}
                        <span style={{
                          flex: 1,
                          color: isPlaced ? colors.textMuted : colors.textPrimary,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}>
                          {field.field_name}
                        </span>
                        <span style={{
                          fontSize: 9, color: colors.textMuted,
                          backgroundColor: 'rgba(107,114,128,0.2)',
                          padding: '1px 4px', borderRadius: 3, flexShrink: 0,
                        }}>
                          {field.field_type}
                        </span>
                      </div>
                    );
                  })}
                </CollapsibleSection>

                {/* ---- BUTTONS SECTION (collapsible) - hidden for report types ---- */}
                <CollapsibleSection
                  title={t.formlayoutdesigner_buttons || 'Buttons'}
                  defaultOpen={true}
                  colors={colors}
                >
                  {(() => {
                    const navButtons = BUTTON_PALETTE.filter((b) => b.category === 'navigation');
                    const actionButtons = BUTTON_PALETTE.filter((b) => b.category === 'actions');

                    const renderBtn = (btn: typeof BUTTON_PALETTE[0]) => {
                      const isPlaced = placedButtonTypes.has(btn.type) && btn.type !== 'button_custom';
                      return (
                        <div
                          key={btn.type}
                          draggable={btn.type === 'button_custom' || !isPlaced}
                          onDragStart={(e) => {
                            if (isPlaced && btn.type !== 'button_custom') { e.preventDefault(); return; }
                            e.dataTransfer.setData('application/button-type', btn.type);
                            e.dataTransfer.effectAllowed = 'copyMove';
                          }}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            padding: '5px 8px', marginBottom: 3, borderRadius: 4,
                            backgroundColor: isPlaced && btn.type !== 'button_custom' ? 'rgba(107,114,128,0.15)' : `${currentFormSet?.default_button_color || BUTTON_FALLBACK_COLOR}22`,
                            border: `1px solid ${isPlaced && btn.type !== 'button_custom' ? 'transparent' : (currentFormSet?.default_button_color || BUTTON_FALLBACK_COLOR) + '44'}`,
                            cursor: isPlaced && btn.type !== 'button_custom' ? 'default' : 'grab',
                            opacity: isPlaced && btn.type !== 'button_custom' ? 0.55 : 1, fontSize: 11,
                          }}
                        >
                          {isPlaced && btn.type !== 'button_custom' ? (
                            <i className="pi pi-check" style={{ color: '#22c55e', fontSize: 11 }} />
                          ) : (
                            <i className={`pi ${BUTTON_DEFAULT_ICONS[btn.type]}`} style={{ color: currentFormSet?.default_button_color || BUTTON_FALLBACK_COLOR, fontSize: 12 }} />
                          )}
                          <span style={{ flex: 1, color: isPlaced && btn.type !== 'button_custom' ? colors.textMuted : colors.textPrimary, fontSize: 11 }}>
                            {BUTTON_DEFAULT_LABELS[btn.type]}{btn.type === 'button_custom' ? ' +' : ''}
                          </span>
                        </div>
                      );
                    };

                    return (
                      <>
                        {navButtons.length > 0 && (
                          <>
                            <div style={{ fontSize: 10, fontWeight: 600, color: colors.textMuted, padding: '4px 4px 2px', textTransform: 'uppercase' }}>
                              Navigation
                            </div>
                            {navButtons.map(renderBtn)}
                          </>
                        )}
                        <div style={{ fontSize: 10, fontWeight: 600, color: colors.textMuted, padding: '8px 4px 2px', textTransform: 'uppercase' }}>
                          Actions
                        </div>
                        {actionButtons.map(renderBtn)}
                      </>
                    );
                  })()}
                </CollapsibleSection>
              </>
            )}

            {/* ---- MENU ITEMS (main_menu only) ---- */}
            {selectedWindowType === 'main_menu' && (
              <>
                {/* Tables section */}
                <CollapsibleSection
                  title={`${t.formlayoutdesigner_menu_tables || 'Tables'} (${schemaTables.length})`}
                  defaultOpen={true}
                  colors={colors}
                >
                  {schemaTables.length === 0 && (
                    <div style={{ padding: 12, textAlign: 'center', color: colors.textMuted, fontSize: 11 }}>
                      {t.formlayoutdesigner_no_fields || 'Load a layout to see tables.'}
                    </div>
                  )}
                  {schemaTables.map((table) => {
                    const placedCount = menuPlacements.filter(m => m.schema_table_id === table.id).length;
                    const isTableSelected = selectedMenuNodeId != null && menuPlacements.some(
                      m => m.schema_table_id === table.id && `menu-${m.id || m.temp_id}` === selectedMenuNodeId
                    );
                    const stashId = `table-${table.id}`;
                    const isHovered = hoveredStashId === stashId;
                    const isPressed = pressedStashId === stashId;
                    return (
                      <div
                        key={table.id}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData('application/menu-table-id', String(table.id));
                          e.dataTransfer.effectAllowed = 'copyMove';
                          // Custom drag image
                          const el = dragImageRef.current;
                          if (el) {
                            el.textContent = table.caption || table.singular_name || table.table_name;
                            el.style.display = 'block';
                            e.dataTransfer.setDragImage(el, 10, 16);
                            requestAnimationFrame(() => { el.style.display = 'none'; });
                          }
                          setPressedStashId(null);
                        }}
                        onDragEnd={() => setPressedStashId(null)}
                        onMouseEnter={() => setHoveredStashId(stashId)}
                        onMouseLeave={() => { setHoveredStashId(null); setPressedStashId(null); }}
                        onMouseDown={() => setPressedStashId(stashId)}
                        onMouseUp={() => setPressedStashId(null)}
                        style={{
                          padding: '6px 8px', marginBottom: 2, borderRadius: 4, fontSize: 12,
                          display: 'flex', alignItems: 'center', gap: 6, cursor: 'grab',
                          backgroundColor: isPressed ? 'rgba(59,130,246,0.35)' : isTableSelected ? 'rgba(59,130,246,0.2)' : isHovered ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.05)',
                          borderLeft: isPressed || isTableSelected ? '3px solid #3b82f6' : '3px solid transparent',
                          color: isPressed ? '#fff' : isTableSelected ? colors.textPrimary : colors.textSecondary,
                          transition: 'all 0.1s ease',
                          transform: isPressed ? 'scale(0.97)' : 'scale(1)',
                        }}
                      >
                        <i className={`pi ${isPressed ? 'pi-arrow-circle-right' : 'pi-table'}`} style={{ fontSize: 12, color: isPressed ? '#60a5fa' : '#3b82f6' }} />
                        <span style={{ flex: 1 }}>{table.caption || table.singular_name || table.table_name}</span>
                        {placedCount > 0 && (
                          <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 8, backgroundColor: '#3b82f6', color: '#fff' }}>
                            {placedCount}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </CollapsibleSection>

                {/* Free menu items */}
                <CollapsibleSection
                  title={t.formlayoutdesigner_menu_free || 'Free Items'}
                  defaultOpen={true}
                  colors={colors}
                >
                  {[
                    { id: 'group', icon: 'pi-folder', iconColor: '#f59e0b', label: t.formlayoutdesigner_menu_group || 'Menu Group' },
                    { id: 'separator', icon: 'pi-minus', iconColor: '#6b7280', label: t.formlayoutdesigner_menu_separator || 'Separator' },
                  ].map((item) => {
                    const stashId = `free-${item.id}`;
                    const isHovered = hoveredStashId === stashId;
                    const isPressed = pressedStashId === stashId;
                    return (
                      <div
                        key={item.id}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData('application/menu-group', item.id);
                          e.dataTransfer.effectAllowed = 'copyMove';
                          const el = dragImageRef.current;
                          if (el) {
                            el.textContent = item.label;
                            el.style.display = 'block';
                            e.dataTransfer.setDragImage(el, 10, 16);
                            requestAnimationFrame(() => { el.style.display = 'none'; });
                          }
                          setPressedStashId(null);
                        }}
                        onDragEnd={() => setPressedStashId(null)}
                        onMouseEnter={() => setHoveredStashId(stashId)}
                        onMouseLeave={() => { setHoveredStashId(null); setPressedStashId(null); }}
                        onMouseDown={() => setPressedStashId(stashId)}
                        onMouseUp={() => setPressedStashId(null)}
                        style={{
                          padding: '6px 8px', marginBottom: 2, borderRadius: 4, fontSize: 12,
                          display: 'flex', alignItems: 'center', gap: 6, cursor: 'grab',
                          backgroundColor: isPressed ? 'rgba(59,130,246,0.35)' : isHovered ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.05)',
                          borderLeft: isPressed ? '3px solid #3b82f6' : '3px solid transparent',
                          color: isPressed ? '#fff' : colors.textSecondary,
                          transition: 'all 0.1s ease',
                          transform: isPressed ? 'scale(0.97)' : 'scale(1)',
                        }}
                      >
                        <i className={`pi ${isPressed ? 'pi-arrow-circle-right' : item.icon}`} style={{ fontSize: 12, color: isPressed ? '#60a5fa' : item.iconColor }} />
                        <span>{item.label}</span>
                      </div>
                    );
                  })}
                </CollapsibleSection>
              </>
            )}
          </div>
        </div>

        {/* ===== CENTER CANVAS ===== */}
        <div style={{ flex: 1, position: 'relative' }}>
          {loading && (
            <div style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(0,0,0,0.4)',
              zIndex: 50,
            }}>
              <ProgressSpinner style={{ width: 40, height: 40 }} />
            </div>
          )}

          {/* ---- MENU TREE LIST (for main_menu only) ---- */}
          {selectedWindowType === 'main_menu' && currentWindow ? (
            <div
              style={{ height: '100%', overflow: 'auto', padding: 16 }}
              onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; }}
              onDrop={(e) => {
                e.preventDefault();
                const menuTableId = e.dataTransfer.getData('application/menu-table-id');
                const menuGroupType = e.dataTransfer.getData('application/menu-group');
                if (!menuTableId && !menuGroupType) return;

                const menuContainer = (currentWindow.elements || []).find((el: any) => el.element_type === 'menu_container');
                const newItem: MenuItemPlacementData = {
                  temp_id: `temp_${Date.now()}`,
                  form_window_id: currentWindow.id,
                  container_element_id: menuContainer?.id || null,
                  schema_table_id: menuTableId ? Number(menuTableId) : null,
                  caption_override: menuGroupType === 'group' ? 'New Group' : (menuGroupType === 'separator' ? '---' : null),
                  caption_labels: null,
                  menu_icon: menuGroupType === 'separator' ? 'pi-minus' : (menuGroupType === 'group' ? 'pi-folder' : 'pi-table'),
                  menu_action: menuTableId ? 'data_table' : null,
                  menu_role_required: null,
                  menu_depth: 0,
                  parent_placement_id: null,
                  x_position: 0,
                  y_position: 0,
                  width: 200,
                  height: 32,
                  sort_order: menuPlacements.length,
                  is_visible: true,
                };
                setMenuPlacements(prev => [...prev, newItem]);
                setHasUnsavedChanges(true);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Delete' && selectedMenuNodeId && !((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA')) {
                  setMenuPlacements(prev => prev.filter(m => `menu-${m.id || m.temp_id}` !== selectedMenuNodeId));
                  setSelectedMenuNodeId(null);
                  setLiveGeometry(null);
                  setHasUnsavedChanges(true);
                }
              }}
              tabIndex={0}
            >
              {/* Menu window frame */}
              <div style={{
                width: currentWindow.default_width || 800,
                maxWidth: '100%',
                border: `2px solid ${currentFormSet?.default_window_color || '#374151'}`,
                borderRadius: 8,
                overflow: 'hidden',
                position: 'relative',
              }}>
              {/* Menu preview header */}
              <div style={{
                backgroundColor: currentFormSet?.default_window_color || '#374151',
                padding: '8px 16px',
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <div style={{ display: 'flex', gap: 4 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#ff5f57' }} />
                  <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#febc2e' }} />
                  <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#28c840' }} />
                </div>
                <span style={{ color: currentFormSet?.default_text_color || '#fff', fontSize: 13, fontWeight: 600 }}>
                  {currentWindow.display_name || 'Main Menu'}
                </span>
              </div>

              {/* Menu body area (window interior) */}
              <div style={{
                backgroundColor: currentFormSet?.default_background_color || '#1f2937',
                minHeight: Math.max(200, (currentWindow.default_height || 600) - 40),
                position: 'relative',
                overflow: 'visible',
              }}>
                {/* Menu container outline from FormSet */}
                {(() => {
                  const mc = (currentWindow.elements || []).find((el: any) => el.element_type === 'menu_container');
                  if (!mc) return null;
                  return (
                    <div style={{
                      position: 'absolute',
                      left: mc.x_position || 0,
                      top: mc.y_position || 0,
                      width: mc.width || 200,
                      height: mc.height || 400,
                      border: '1px dashed rgba(107,114,128,0.4)',
                      borderRadius: 4,
                      pointerEvents: 'none',
                      zIndex: 0,
                    }}>
                      <span style={{
                        position: 'absolute', top: -16, left: 4,
                        fontSize: 9, color: 'rgba(107,114,128,0.6)',
                        whiteSpace: 'nowrap',
                      }}>
                        menu_container ({mc.width || 200} x {mc.height || 400})
                      </span>
                    </div>
                  );
                })()}

                {/* Menu items list - positioned at container location */}
                <div style={{
                  position: 'absolute',
                  ...(isMenuRightAligned ? {
                    // Right-aligned vertical menu: anchor from right edge, grow left
                    right: (() => {
                      const mc = (currentWindow.elements || []).find((el: any) => el.element_type === 'menu_container');
                      const winW = currentWindow.default_width || 800;
                      return winW - ((mc?.x_position || 0) + (mc?.width || 200));
                    })(),
                  } : {
                    left: ((currentWindow.elements || []).find((el: any) => el.element_type === 'menu_container'))?.x_position || 0,
                  }),
                  top: ((currentWindow.elements || []).find((el: any) => el.element_type === 'menu_container'))?.y_position || 0,
                  zIndex: 1,
                  overflow: 'visible',
                  display: isMenuHorizontal ? 'flex' : 'block',
                  flexDirection: isMenuHorizontal ? 'row' : undefined,
                  alignItems: isMenuHorizontal ? 'flex-start' : undefined,
                }}>
                {menuPlacements.length === 0 && (
                  <div style={{ padding: 32, textAlign: 'center', color: colors.textMuted, fontSize: 12 }}>
                    <i className={`pi ${isMenuHorizontal ? 'pi-arrow-right' : 'pi-arrow-down'}`} style={{ fontSize: 24, opacity: 0.3, display: 'block', marginBottom: 8 }} />
                    {t.formlayoutdesigner_menu_drop_hint || 'Drag tables or menu items here'}
                  </div>
                )}

                {/* Drop zone for inserting at the very top */}
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    e.dataTransfer.dropEffect = 'move';
                    setDragOverMenuIdx(-1);
                  }}
                  onDragLeave={() => setDragOverMenuIdx(null)}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const fromIdxStr = e.dataTransfer.getData('application/menu-reorder');
                    if (fromIdxStr !== '') {
                      const fromIdx = Number(fromIdxStr);
                      if (fromIdx > 0) {
                        const newList = [...menuPlacements];
                        const [moved] = newList.splice(fromIdx, 1);
                        moved.parent_placement_id = null;
                        moved.menu_depth = 0;
                        newList.unshift(moved);
                        setMenuPlacements(newList.map((m, i) => ({ ...m, sort_order: i })));
                        setHasUnsavedChanges(true);
                      }
                    }
                    setDragOverMenuIdx(null);
                    setMenuDragIdx(null);
                  }}
                  style={isMenuHorizontal ? {
                    width: dragOverMenuIdx === -1 ? 12 : 4,
                    borderLeft: dragOverMenuIdx === -1 ? '2px solid #3b82f6' : '2px solid transparent',
                    backgroundColor: dragOverMenuIdx === -1 ? 'rgba(59,130,246,0.08)' : 'transparent',
                    transition: 'all 0.15s',
                    flexShrink: 0,
                  } : {
                    height: dragOverMenuIdx === -1 ? 12 : 4,
                    borderTop: dragOverMenuIdx === -1 ? '2px solid #3b82f6' : '2px solid transparent',
                    backgroundColor: dragOverMenuIdx === -1 ? 'rgba(59,130,246,0.08)' : 'transparent',
                    transition: 'all 0.15s',
                  }}
                />

                {(() => {
                  // Build hierarchical view: root items, then their children
                  const rootItems = menuPlacements.filter(m => !m.parent_placement_id || m.menu_depth === 0);
                  const getChildren = (parentId: number | string | undefined) =>
                    menuPlacements.filter(m => m.parent_placement_id && String(m.parent_placement_id) === String(parentId));

                  const renderItem = (item: MenuItemPlacementData, depth: number) => {
                    const nodeId = `menu-${item.id || item.temp_id}`;
                    const isSelected = selectedMenuNodeId === nodeId;
                    const tableInfo = schemaTables.find(t => Number(t.id) === Number(item.schema_table_id));
                    const label = (item.caption_labels && selectedLanguage && item.caption_labels[selectedLanguage])
                      || item.caption_override
                      || tableInfo?.caption || tableInfo?.singular_name || tableInfo?.table_name || 'Menu Item';
                    const isGroup = !item.schema_table_id && item.menu_icon !== 'pi-minus';
                    const isSeparator = item.menu_icon === 'pi-minus';
                    const children = getChildren(item.id || item.temp_id);
                    const isCollapsed = collapsedGroups.has(nodeId);
                    const isDragOver = dragOverMenuIdx !== null && menuPlacements[dragOverMenuIdx] === item;

                    return (
                      <div key={nodeId}>
                        {/* The menu item row */}
                        <div
                          draggable
                          onDragStart={(e) => {
                            setMenuDragIdx(menuPlacements.indexOf(item));
                            e.dataTransfer.setData('application/menu-reorder', String(menuPlacements.indexOf(item)));
                            e.dataTransfer.effectAllowed = 'copyMove';
                          }}
                          onDragOver={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            e.dataTransfer.dropEffect = 'move';
                            setDragOverMenuIdx(menuPlacements.indexOf(item));
                          }}
                          onDragLeave={() => setDragOverMenuIdx(null)}
                          onDrop={(e) => {
                            e.preventDefault();
                            e.stopPropagation();

                            // Check if this is a new item from stash
                            const menuTableId = e.dataTransfer.getData('application/menu-table-id');
                            const menuGroupType = e.dataTransfer.getData('application/menu-group');
                            if (menuTableId || menuGroupType) {
                              // New item from stash dropped ON this item
                              const menuContainer = (currentWindow?.elements || []).find((el: any) => el.element_type === 'menu_container');
                              const isTargetGroup = isGroup || (!item.schema_table_id && item.menu_icon !== 'pi-minus');
                              const newItem: MenuItemPlacementData = {
                                temp_id: `temp_${Date.now()}`,
                                form_window_id: currentWindow!.id,
                                container_element_id: menuContainer?.id || null,
                                schema_table_id: menuTableId ? Number(menuTableId) : null,
                                caption_override: menuGroupType === 'group' ? 'New Group' : (menuGroupType === 'separator' ? '---' : null),
                                caption_labels: null,
                                menu_icon: menuGroupType === 'separator' ? 'pi-minus' : (menuGroupType === 'group' ? 'pi-folder' : 'pi-table'),
                                menu_action: menuTableId ? 'data_table' : null,
                                menu_role_required: null,
                                menu_depth: isTargetGroup ? depth + 1 : depth,
                                parent_placement_id: isTargetGroup ? (item.id || item.temp_id || null) : item.parent_placement_id,
                                x_position: 0, y_position: 0, width: 200, height: 32,
                                sort_order: menuPlacements.length,
                                is_visible: true,
                              };
                              // Insert after this item
                              const toIdx = menuPlacements.indexOf(item);
                              const newList = [...menuPlacements];
                              newList.splice(toIdx + 1, 0, newItem);
                              setMenuPlacements(newList.map((m, i) => ({ ...m, sort_order: i })));
                              setHasUnsavedChanges(true);
                              if (isTargetGroup) {
                                // Auto-expand the group
                                setCollapsedGroups(prev => { const next = new Set(prev); next.delete(nodeId); return next; });
                              }
                              setDragOverMenuIdx(null);
                              setMenuDragIdx(null);
                              return;
                            }

                            // Reorder existing item
                            const fromIdxStr = e.dataTransfer.getData('application/menu-reorder');
                            if (fromIdxStr !== '') {
                              const fromIdx = Number(fromIdxStr);
                              const toIdx = menuPlacements.indexOf(item);
                              if (fromIdx !== toIdx && fromIdx >= 0) {
                                const movedItem = menuPlacements[fromIdx];
                                const isTargetGroup = isGroup || (!item.schema_table_id && item.menu_icon !== 'pi-minus');

                                const newList = [...menuPlacements];
                                const [moved] = newList.splice(fromIdx, 1);

                                // If dropping ON a group → make it a child
                                if (isTargetGroup && movedItem !== item) {
                                  moved.parent_placement_id = item.id || item.temp_id || null;
                                  moved.menu_depth = depth + 1;
                                  // Insert right after the group
                                  const groupIdx = newList.indexOf(item);
                                  newList.splice(groupIdx + 1, 0, moved);
                                  // Auto-expand
                                  setCollapsedGroups(prev => { const next = new Set(prev); next.delete(nodeId); return next; });
                                } else {
                                  // Normal reorder (same level)
                                  const adjustedToIdx = newList.indexOf(item);
                                  newList.splice(adjustedToIdx, 0, moved);
                                }

                                setMenuPlacements(newList.map((m, i) => ({ ...m, sort_order: i })));
                                setHasUnsavedChanges(true);
                              }
                            }
                            setDragOverMenuIdx(null);
                            setMenuDragIdx(null);
                          }}
                          onDragEnd={() => { setDragOverMenuIdx(null); setMenuDragIdx(null); }}
                          onClick={() => {
                            setSelectedMenuNodeId(isSelected ? null : nodeId);
                            setSelectedPlacementId(null);
                            setSelectedButtonNodeId(null);
                            if (!isSelected) {
                              setLiveGeometry({ x: item.x_position, y: item.y_position, w: item.width, h: item.height });
                            } else {
                              setLiveGeometry(null);
                            }
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            flexDirection: isMenuRightAligned ? 'row-reverse' : 'row',
                            justifyContent: isMenuRightAligned ? 'flex-start' : 'flex-start',
                            gap: 8,
                            padding: isSeparator ? '4px 12px' : '8px 12px',
                            paddingLeft: isMenuRightAligned ? 12 : (depth * 24 + 12),
                            paddingRight: isMenuRightAligned ? (depth * 24 + 12) : 12,
                            cursor: 'grab',
                            backgroundColor: isSelected ? 'rgba(59,130,246,0.25)' : isDragOver ? 'rgba(59,130,246,0.1)' : 'transparent',
                            borderRight: isMenuRightAligned ? (isSelected ? '3px solid #3b82f6' : '3px solid transparent') : undefined,
                            borderLeft: isMenuRightAligned ? undefined : (isSelected ? '3px solid #3b82f6' : '3px solid transparent'),
                            borderTop: isDragOver ? '2px solid #3b82f6' : '2px solid transparent',
                            transition: 'background-color 0.1s',
                            opacity: item.is_visible ? 1 : 0.4,
                            userSelect: 'none',
                          }}
                        >
                          {/* Collapse toggle for groups with children */}
                          {(isGroup || children.length > 0) && !isSeparator ? (
                            <i
                              className={`pi ${isCollapsed ? 'pi-chevron-right' : 'pi-chevron-down'}`}
                              style={{ fontSize: 10, color: '#888', cursor: 'pointer', flexShrink: 0, width: 14, textAlign: 'center' }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setCollapsedGroups(prev => {
                                  const next = new Set(prev);
                                  if (next.has(nodeId)) next.delete(nodeId); else next.add(nodeId);
                                  return next;
                                });
                              }}
                            />
                          ) : (
                            <span style={{ width: 14, flexShrink: 0 }} />
                          )}

                          {/* Separator */}
                          {isSeparator ? (
                            <div style={{ flex: 1, height: 1, backgroundColor: '#444' }} />
                          ) : (
                            <>
                              {/* Icon */}
                              <i className={`pi ${item.menu_icon || 'pi-table'}`} style={{
                                fontSize: 14,
                                color: isGroup ? '#f59e0b' : isSelected ? '#60a5fa' : '#94a3b8',
                                flexShrink: 0,
                              }} />

                              {/* Label */}
                              <span style={{
                                flex: 1,
                                fontSize: isGroup ? 13 : 12,
                                fontWeight: isGroup ? 700 : 400,
                                color: isSelected ? '#fff' : (currentFormSet?.default_text_color || '#e0e0e0'),
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                textAlign: isMenuRightAligned ? 'right' : 'left',
                              }}>
                                {label}
                              </span>

                              {/* Action badge */}
                              {item.menu_action && item.schema_table_id && (
                                <span style={{
                                  fontSize: 9, padding: '1px 5px', borderRadius: 3,
                                  backgroundColor: 'rgba(59,130,246,0.2)', color: '#60a5fa',
                                  flexShrink: 0,
                                }}>
                                  {item.menu_action === 'data_table' ? 'Table' : item.menu_action === 'create_edit' ? 'Form' : item.menu_action}
                                </span>
                              )}

                              {/* Role badge */}
                              {item.menu_role_required && (
                                <span style={{
                                  fontSize: 9, padding: '1px 4px', borderRadius: 3,
                                  backgroundColor: item.menu_role_required === 'system' ? '#7c3aed' : '#d97706',
                                  color: '#fff', flexShrink: 0,
                                }}>
                                  {item.menu_role_required}
                                </span>
                              )}
                            </>
                          )}
                        </div>

                        {/* Render children recursively (if not collapsed) */}
                        {!isCollapsed && children.map(child => renderItem(child, depth + 1))}
                      </div>
                    );
                  };

                  if (isMenuHorizontal) {
                    // Horizontal layout: root items in a row, children as dropdown below
                    return (
                      <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: 0 }}>
                        {rootItems.map(item => {
                          const nodeId = `menu-${item.id || item.temp_id}`;
                          const isSelected = selectedMenuNodeId === nodeId;
                          const tableInfo = schemaTables.find(t => Number(t.id) === Number(item.schema_table_id));
                          const itemLabel = (item.caption_labels && selectedLanguage && item.caption_labels[selectedLanguage])
                            || item.caption_override
                            || tableInfo?.caption || tableInfo?.singular_name || tableInfo?.table_name || 'Menu Item';
                          const isGroupItem = !item.schema_table_id && item.menu_icon !== 'pi-minus';
                          const isSep = item.menu_icon === 'pi-minus';
                          const childItems = getChildren(item.id || item.temp_id);
                          const isCol = collapsedGroups.has(nodeId);
                          const isDragOverItem = dragOverMenuIdx !== null && menuPlacements[dragOverMenuIdx] === item;

                          return (
                            <div key={nodeId} style={{ position: 'relative' }}>
                              <div
                                draggable
                                onDragStart={(e) => {
                                  setMenuDragIdx(menuPlacements.indexOf(item));
                                  e.dataTransfer.setData('application/menu-reorder', String(menuPlacements.indexOf(item)));
                                  e.dataTransfer.effectAllowed = 'copyMove';
                                }}
                                onDragOver={(e) => {
                                  e.preventDefault(); e.stopPropagation();
                                  e.dataTransfer.dropEffect = 'move';
                                  setDragOverMenuIdx(menuPlacements.indexOf(item));
                                }}
                                onDragLeave={() => setDragOverMenuIdx(null)}
                                onDrop={(e) => {
                                  e.preventDefault(); e.stopPropagation();
                                  // Reuse same drop logic
                                  const menuTableId = e.dataTransfer.getData('application/menu-table-id');
                                  const menuGroupType = e.dataTransfer.getData('application/menu-group');
                                  if (menuTableId || menuGroupType) {
                                    const mc = (currentWindow?.elements || []).find((el: any) => el.element_type === 'menu_container');
                                    const newItem: MenuItemPlacementData = {
                                      temp_id: `temp_${Date.now()}`,
                                      form_window_id: currentWindow!.id,
                                      container_element_id: mc?.id || null,
                                      schema_table_id: menuTableId ? Number(menuTableId) : null,
                                      caption_override: menuGroupType === 'group' ? 'New Group' : (menuGroupType === 'separator' ? '---' : null),
                                      caption_labels: null,
                                      menu_icon: menuGroupType === 'separator' ? 'pi-minus' : (menuGroupType === 'group' ? 'pi-folder' : 'pi-table'),
                                      menu_action: menuTableId ? 'data_table' : null,
                                      menu_role_required: null,
                                      menu_depth: isGroupItem ? 1 : 0,
                                      parent_placement_id: isGroupItem ? (item.id || item.temp_id || null) : null,
                                      x_position: 0, y_position: 0, width: 200, height: 32,
                                      sort_order: menuPlacements.length,
                                      is_visible: true,
                                    };
                                    const toIdx = menuPlacements.indexOf(item);
                                    const newList = [...menuPlacements];
                                    newList.splice(toIdx + 1, 0, newItem);
                                    setMenuPlacements(newList.map((m, i) => ({ ...m, sort_order: i })));
                                    setHasUnsavedChanges(true);
                                  } else {
                                    const fromIdxStr = e.dataTransfer.getData('application/menu-reorder');
                                    if (fromIdxStr !== '') {
                                      const fromIdx = Number(fromIdxStr);
                                      const toIdx = menuPlacements.indexOf(item);
                                      if (fromIdx !== toIdx && fromIdx >= 0) {
                                        const newList = [...menuPlacements];
                                        const [moved] = newList.splice(fromIdx, 1);
                                        if (isGroupItem) {
                                          moved.parent_placement_id = item.id || item.temp_id || null;
                                          moved.menu_depth = 1;
                                          const gIdx = newList.indexOf(item);
                                          newList.splice(gIdx + 1, 0, moved);
                                          setCollapsedGroups(prev => { const next = new Set(prev); next.delete(nodeId); return next; });
                                        } else {
                                          const aIdx = newList.indexOf(item);
                                          newList.splice(aIdx, 0, moved);
                                        }
                                        setMenuPlacements(newList.map((m, i) => ({ ...m, sort_order: i })));
                                        setHasUnsavedChanges(true);
                                      }
                                    }
                                  }
                                  setDragOverMenuIdx(null); setMenuDragIdx(null);
                                }}
                                onDragEnd={() => { setDragOverMenuIdx(null); setMenuDragIdx(null); }}
                                onClick={() => {
                                  setSelectedMenuNodeId(isSelected ? null : nodeId);
                                  setSelectedPlacementId(null); setSelectedButtonNodeId(null);
                                  setLiveGeometry(isSelected ? null : { x: item.x_position, y: item.y_position, w: item.width, h: item.height });
                                }}
                                onKeyDown={(e) => { if (e.key === 'Delete' && isSelected) { e.preventDefault(); const idx = menuPlacements.indexOf(item); if (idx >= 0) { setMenuPlacements(prev => prev.filter((_, i) => i !== idx).map((m, i) => ({ ...m, sort_order: i }))); setSelectedMenuNodeId(null); setHasUnsavedChanges(true); } } }}
                                tabIndex={0}
                                style={{
                                  display: 'flex', alignItems: 'center', gap: 6,
                                  padding: isSep ? '4px 8px' : '8px 14px',
                                  cursor: 'grab',
                                  backgroundColor: isSelected ? 'rgba(59,130,246,0.25)' : isDragOverItem ? 'rgba(59,130,246,0.1)' : 'transparent',
                                  borderBottom: isSelected ? '3px solid #3b82f6' : '3px solid transparent',
                                  borderRight: isDragOverItem ? '2px solid #3b82f6' : '2px solid transparent',
                                  transition: 'background-color 0.1s',
                                  opacity: item.is_visible ? 1 : 0.4,
                                  userSelect: 'none',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {(isGroupItem || childItems.length > 0) && !isSep ? (
                                  <i
                                    className={`pi ${isCol ? 'pi-chevron-right' : 'pi-chevron-down'}`}
                                    style={{ fontSize: 10, color: '#888', cursor: 'pointer', flexShrink: 0 }}
                                    onClick={(e) => { e.stopPropagation(); setCollapsedGroups(prev => { const next = new Set(prev); if (next.has(nodeId)) next.delete(nodeId); else next.add(nodeId); return next; }); }}
                                  />
                                ) : null}
                                {isSep ? (
                                  <div style={{ width: 2, height: 20, backgroundColor: '#444' }} />
                                ) : (
                                  <>
                                    <i className={`pi ${item.menu_icon || 'pi-table'}`} style={{
                                      fontSize: 13, color: isGroupItem ? '#f59e0b' : isSelected ? '#60a5fa' : '#94a3b8', flexShrink: 0,
                                    }} />
                                    <span style={{
                                      fontSize: isGroupItem ? 13 : 12, fontWeight: isGroupItem ? 700 : 400,
                                      color: isSelected ? '#fff' : (currentFormSet?.default_text_color || '#e0e0e0'),
                                    }}>{itemLabel}</span>
                                  </>
                                )}
                              </div>
                              {/* Children dropdown (below parent for horizontal menu) */}
                              {!isCol && childItems.length > 0 && (
                                <div style={{
                                  position: 'absolute',
                                  left: (() => {
                                    const mc = (currentWindow?.elements || []).find((el: any) => el.element_type === 'menu_container');
                                    const winW = currentWindow?.default_width || 800;
                                    const mcRight = (mc?.x_position || 0) + (mc?.width || 200);
                                    return mcRight > winW / 2 ? undefined : 0;
                                  })(),
                                  right: (() => {
                                    const mc = (currentWindow?.elements || []).find((el: any) => el.element_type === 'menu_container');
                                    const winW = currentWindow?.default_width || 800;
                                    const mcRight = (mc?.x_position || 0) + (mc?.width || 200);
                                    return mcRight > winW / 2 ? 0 : undefined;
                                  })(),
                                  top: '100%', zIndex: 10,
                                  backgroundColor: currentFormSet?.default_background_color || '#1f2937',
                                  border: '1px solid rgba(107,114,128,0.3)',
                                  borderRadius: 4, minWidth: 160, boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                                }}>
                                  {childItems.map(child => renderItem(child, 1))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  }
                  return rootItems.map(item => renderItem(item, 0));
                })()}

                {/* Drop zone at the bottom for inserting at end */}
                {menuPlacements.length > 0 && (
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      e.dataTransfer.dropEffect = 'move';
                      setDragOverMenuIdx(-2);
                    }}
                    onDragLeave={() => setDragOverMenuIdx(null)}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const fromIdxStr = e.dataTransfer.getData('application/menu-reorder');
                      if (fromIdxStr !== '') {
                        const fromIdx = Number(fromIdxStr);
                        const newList = [...menuPlacements];
                        const [moved] = newList.splice(fromIdx, 1);
                        moved.parent_placement_id = null;
                        moved.menu_depth = 0;
                        newList.push(moved);
                        setMenuPlacements(newList.map((m, i) => ({ ...m, sort_order: i })));
                        setHasUnsavedChanges(true);
                      }
                      // Also handle stash drops at bottom
                      const menuTableId = e.dataTransfer.getData('application/menu-table-id');
                      const menuGroupType = e.dataTransfer.getData('application/menu-group');
                      if (menuTableId || menuGroupType) {
                        const menuContainer = (currentWindow?.elements || []).find((el: any) => el.element_type === 'menu_container');
                        const newItem: MenuItemPlacementData = {
                          temp_id: `temp_${Date.now()}`,
                          form_window_id: currentWindow!.id,
                          container_element_id: menuContainer?.id || null,
                          schema_table_id: menuTableId ? Number(menuTableId) : null,
                          caption_override: menuGroupType === 'group' ? 'New Group' : (menuGroupType === 'separator' ? '---' : null),
                          caption_labels: null,
                          menu_icon: menuGroupType === 'separator' ? 'pi-minus' : (menuGroupType === 'group' ? 'pi-folder' : 'pi-table'),
                          menu_action: menuTableId ? 'data_table' : null,
                          menu_role_required: null,
                          menu_depth: 0,
                          parent_placement_id: null,
                          x_position: 0, y_position: 0, width: 200, height: 32,
                          sort_order: menuPlacements.length,
                          is_visible: true,
                        };
                        setMenuPlacements(prev => [...prev, newItem]);
                        setHasUnsavedChanges(true);
                      }
                      setDragOverMenuIdx(null);
                      setMenuDragIdx(null);
                    }}
                    style={{
                      height: dragOverMenuIdx === -2 ? 24 : 40,
                      borderBottom: dragOverMenuIdx === -2 ? '2px solid #3b82f6' : '2px solid transparent',
                      backgroundColor: dragOverMenuIdx === -2 ? 'rgba(59,130,246,0.08)' : 'transparent',
                      transition: 'all 0.15s',
                    }}
                  />
                )}
              </div>{/* end menu items list */}
              </div>{/* end menu body area */}
              </div>{/* end menu window frame */}

              {/* Size indicator below the window */}
              <div style={{
                width: currentWindow.default_width || 800,
                maxWidth: '100%',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                marginTop: 8,
                position: 'relative',
              }}>
                {/* Left ruler line */}
                <div style={{ flex: 1, height: 1, backgroundColor: colors.borderPrimary }} />
                <span style={{
                  fontSize: 10,
                  color: colors.textMuted,
                  padding: '0 8px',
                  whiteSpace: 'nowrap',
                }}>
                  {currentWindow.default_width || 800} x {currentWindow.default_height || 600} px
                </span>
                {/* Right ruler line */}
                <div style={{ flex: 1, height: 1, backgroundColor: colors.borderPrimary }} />
              </div>
            </div>
          ) : selectedWindowType === 'data_table_DISABLED' && currentWindow ? (
            /* ---- DATA TABLE VIEW (legacy HTML — disabled, now uses ReactFlow below) ---- */
            <div
              style={{ height: '100%', overflow: 'hidden', position: 'relative', backgroundColor: colors.bgTertiary }}
              onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; }}
              onDrop={(e) => {
                e.preventDefault();
                const fieldId = e.dataTransfer.getData('application/field-id');
                if (!fieldId || !currentWindow) return;
                const field = currentFields.find(f => f.id === Number(fieldId));
                if (!field) return;
                // Check if already placed
                if (placements.some(p => p.schema_field_id === Number(fieldId))) return;
                const container = containerElements.find((el: any) => el.element_type === 'container');
                const newPlacement: FormFieldPlacement = {
                  id: undefined as any,
                  form_window_id: currentWindow.id,
                  schema_table_id: Number(selectedTableId),
                  schema_field_id: field.id,
                  container_element_id: container?.id || 0,
                  tab_panel_id: null,
                  x_position: 0,
                  y_position: 0,
                  width: 150,
                  height: 32,
                  caption_override: null,
                  control_type: null,
                  sort_order: placements.length,
                  is_visible: true,
                  schema_field: field,
                };
                setPlacements(prev => [...prev, newPlacement]);
                setHasUnsavedChanges(true);
              }}
            >
              {/* Window frame */}
              <div style={{
                maxWidth: currentWindow.default_width || 800,
                border: `1px solid ${colors.borderPrimary}`,
                borderRadius: 8,
                overflow: 'hidden',
                boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                position: 'relative',
              }}>
                {/* Window header */}
                <div style={{
                  backgroundColor: currentFormSet?.default_window_color || '#374151',
                  padding: '8px 16px',
                  display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#ff5f57' }} />
                    <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#febc2e' }} />
                    <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#28c840' }} />
                  </div>
                  <span style={{ color: currentFormSet?.default_text_color || '#fff', fontSize: 13, fontWeight: 600 }}>
                    {currentWindow.display_name || 'Data Table'}
                  </span>
                </div>

                {/* Window body */}
                <div style={{
                  backgroundColor: currentFormSet?.default_background_color || '#1f2937',
                  minHeight: Math.max(200, (currentWindow.default_height || 600) - 40),
                  position: 'relative',
                  overflow: 'visible',
                }}>
                  {/* Container outline */}
                  {(() => {
                    const container = containerElements.find((el: any) => el.element_type === 'container');
                    if (!container) return null;
                    const cX = container.x_position || 0;
                    const cY = container.y_position || 0;
                    const cW = container.width || 600;
                    const cH = container.height || 500;

                    return (
                      <div style={{
                        position: 'absolute', left: cX, top: cY, width: cW, height: cH,
                        border: '1px dashed rgba(107,114,128,0.4)', borderRadius: 4,
                        overflow: 'auto',
                      }}>
                        <span style={{
                          position: 'absolute', top: -16, left: 4,
                          fontSize: 9, color: 'rgba(107,114,128,0.6)', whiteSpace: 'nowrap',
                        }}>
                          container ({cW} x {cH})
                        </span>

                        {/* Settings gear icon */}
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowContainerSettings(!showContainerSettings);
                            setSelectedPlacementId(null);
                            setSelectedButtonNodeId(null);
                            setSelectedMenuNodeId(null);
                          }}
                          style={{
                            position: 'absolute', bottom: 4, right: 4, zIndex: 5,
                            width: 24, height: 24, borderRadius: 4,
                            backgroundColor: showContainerSettings ? 'rgba(59,130,246,0.3)' : 'rgba(107,114,128,0.2)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer',
                            border: showContainerSettings ? '1px solid #3b82f6' : '1px solid transparent',
                            transition: 'all 0.15s',
                          }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(59,130,246,0.3)'; }}
                          onMouseLeave={(e) => { if (!showContainerSettings) (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(107,114,128,0.2)'; }}
                          title={t.formdesignerpanel_row_height || 'Table Settings'}
                        >
                          <i className="pi pi-cog" style={{ fontSize: 12, color: showContainerSettings ? '#60a5fa' : '#9ca3af' }} />
                        </div>

                        {placements.length === 0 ? (
                          <div style={{ padding: 32, textAlign: 'center', color: colors.textMuted, fontSize: 12 }}>
                            <i className="pi pi-arrow-down" style={{ fontSize: 24, opacity: 0.3, display: 'block', marginBottom: 8 }} />
                            {t.formlayoutdesigner_menu_drop_hint || 'Drag fields here'}
                          </div>
                        ) : (
                          <div style={{ width: '100%', height: '100%' }}>
                            {/* Table header row */}
                            <div style={{
                              display: 'flex', borderBottom: '2px solid rgba(107,114,128,0.5)',
                              backgroundColor: 'rgba(55,65,81,0.5)',
                              position: 'sticky', top: 0, zIndex: 2,
                            }}>
                              {placements.filter(p => p.is_visible !== false).map((p, idx) => {
                                const field = p.schema_field || currentFields.find(f => Number(f.id) === Number(p.schema_field_id));
                                const colCaption = (() => {
                                  if (p.caption_labels && selectedLanguage && p.caption_labels[selectedLanguage]) return p.caption_labels[selectedLanguage];
                                  if (p.caption_override) return p.caption_override;
                                  if (!field) return 'Column';
                                  return field.field_name.split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                                })();
                                const placementId = p.id || p.schema_field_id || idx;
                                const isSelected = selectedPlacementId === Number(placementId);
                                const colWidth = p.width || 150;
                                // Find the real index in the full placements array (not filtered)
                                const realIdx = placements.indexOf(p);
                                const isDragOverCol = dragOverMenuIdx === realIdx;

                                return (
                                  <div
                                    key={`col-${placementId}`}
                                    draggable
                                    onDragStart={(e) => {
                                      setMenuDragIdx(realIdx);
                                      e.dataTransfer.setData('application/column-reorder', String(realIdx));
                                      e.dataTransfer.effectAllowed = 'move';
                                    }}
                                    onDragOver={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      e.dataTransfer.dropEffect = 'move';
                                      setDragOverMenuIdx(realIdx);
                                    }}
                                    onDragLeave={() => setDragOverMenuIdx(null)}
                                    onDrop={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      const fromIdxStr = e.dataTransfer.getData('application/column-reorder');
                                      if (fromIdxStr !== '') {
                                        const fromIdx = Number(fromIdxStr);
                                        if (fromIdx !== realIdx && fromIdx >= 0) {
                                          const newList = [...placements];
                                          const [moved] = newList.splice(fromIdx, 1);
                                          const toIdx = newList.indexOf(p);
                                          newList.splice(toIdx, 0, moved);
                                          setPlacements(newList.map((pp, i) => ({ ...pp, sort_order: i })));
                                          setHasUnsavedChanges(true);
                                        }
                                      }
                                      // Also handle drop from stash
                                      const fieldId = e.dataTransfer.getData('application/field-id');
                                      if (fieldId) {
                                        const field2 = currentFields.find(f => f.id === Number(fieldId));
                                        if (field2 && !placements.some(pp => pp.schema_field_id === Number(fieldId))) {
                                          const container2 = containerElements.find((el: any) => el.element_type === 'container');
                                          const newPlacement: FormFieldPlacement = {
                                            id: undefined as any,
                                            form_window_id: currentWindow!.id,
                                            schema_table_id: Number(selectedTableId),
                                            schema_field_id: field2.id,
                                            container_element_id: container2?.id || 0,
                                            tab_panel_id: null,
                                            x_position: 0, y_position: 0,
                                            width: 150, height: 32,
                                            caption_override: null, control_type: null,
                                            sort_order: realIdx,
                                            is_visible: true,
                                            schema_field: field2,
                                          };
                                          const newList = [...placements];
                                          newList.splice(realIdx, 0, newPlacement);
                                          setPlacements(newList.map((pp, i) => ({ ...pp, sort_order: i })));
                                          setHasUnsavedChanges(true);
                                        }
                                      }
                                      setDragOverMenuIdx(null);
                                      setMenuDragIdx(null);
                                    }}
                                    onDragEnd={() => { setDragOverMenuIdx(null); setMenuDragIdx(null); }}
                                    onClick={() => {
                                      setSelectedPlacementId(isSelected ? null : Number(placementId));
                                      setSelectedButtonNodeId(null);
                                      setSelectedMenuNodeId(null);
                                      setShowContainerSettings(false);
                                      setLiveGeometry(isSelected ? null : { x: 0, y: 0, w: colWidth, h: 32 });
                                    }}
                                    style={{
                                      width: colWidth,
                                      minWidth: 50,
                                      flexShrink: 0,
                                      padding: '8px 8px',
                                      fontSize: 12,
                                      fontWeight: 600,
                                      color: isSelected ? '#60a5fa' : (currentFormSet?.default_text_color || '#e0e0e0'),
                                      backgroundColor: isSelected ? 'rgba(59,130,246,0.15)' : 'transparent',
                                      borderRight: '1px solid rgba(107,114,128,0.3)',
                                      borderLeft: isDragOverCol ? '3px solid #3b82f6' : '3px solid transparent',
                                      cursor: 'grab',
                                      userSelect: 'none',
                                      position: 'relative',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap',
                                      textAlign: (p.label_position === 'right' || p.label_position === 'left') ? (p.label_position as any) : 'left',
                                    }}
                                  >
                                    {colCaption}
                                    {/* Resize handle (right edge) */}
                                    <div
                                      onMouseDown={(e) => {
                                        e.stopPropagation();
                                        e.preventDefault();
                                        const startX = e.clientX;
                                        const startW = colWidth;
                                        const onMove = (me: MouseEvent) => {
                                          const newW = Math.max(50, startW + (me.clientX - startX));
                                          setPlacements(prev => prev.map((pp) => pp === p ? { ...pp, width: newW } : pp));
                                          setHasUnsavedChanges(true);
                                        };
                                        const onUp = () => {
                                          document.removeEventListener('mousemove', onMove);
                                          document.removeEventListener('mouseup', onUp);
                                        };
                                        document.addEventListener('mousemove', onMove);
                                        document.addEventListener('mouseup', onUp);
                                      }}
                                      style={{
                                        position: 'absolute', right: 0, top: 0, bottom: 0, width: 5,
                                        cursor: 'col-resize',
                                        backgroundColor: isSelected ? 'rgba(59,130,246,0.4)' : 'transparent',
                                      }}
                                      onMouseEnter={(e) => { (e.target as HTMLElement).style.backgroundColor = 'rgba(59,130,246,0.4)'; }}
                                      onMouseLeave={(e) => { (e.target as HTMLElement).style.backgroundColor = isSelected ? 'rgba(59,130,246,0.4)' : 'transparent'; }}
                                    />
                                  </div>
                                );
                              })}
                            </div>

                            {/* Sample data rows - use container's default_control_height as row height */}
                            {[0, 1, 2, 3, 4].map(rowIdx => (
                              <div key={`row-${rowIdx}`} style={{
                                display: 'flex',
                                height: container.default_control_height || undefined,
                                borderBottom: '1px solid rgba(107,114,128,0.2)',
                                backgroundColor: rowIdx % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent',
                              }}>
                                {placements.filter(p => p.is_visible !== false).map(p => {
                                  const field = p.schema_field || currentFields.find(f => Number(f.id) === Number(p.schema_field_id));
                                  const colWidth = p.width || 150;
                                  const fieldType = field?.field_type || '';
                                  const controlType = p.control_type || p.control_type_override;

                                  // Generate sample data based on type
                                  const sampleValue = (() => {
                                    if (controlType === 'checkbox' || fieldType.toLowerCase().includes('bool') || fieldType.toLowerCase() === 'tinyint') return rowIdx % 2 === 0 ? '\u2611' : '\u2610';
                                    if (controlType === 'date' || fieldType.toLowerCase() === 'date') return '2026-03-24';
                                    if (controlType === 'datetime' || fieldType.toLowerCase() === 'datetime' || fieldType.toLowerCase() === 'timestamp') return '2026-03-24 08:30';
                                    if (controlType === 'time' || fieldType.toLowerCase() === 'time') return '08:30:00';
                                    if (controlType === 'currency') return '\u20AC 1.234,56';
                                    if (controlType === 'color' || fieldType.toLowerCase().includes('color')) return '#3b82f6';
                                    if (fieldType.toLowerCase().includes('int') || fieldType.toLowerCase().includes('bigint')) return String(1000 + rowIdx * 100 + Math.floor(Math.random() * 100));
                                    if (fieldType.toLowerCase().includes('decimal') || fieldType.toLowerCase().includes('float') || fieldType.toLowerCase().includes('double')) return (123.45 + rowIdx * 10).toFixed(2);
                                    if (fieldType.toLowerCase().includes('blob') || fieldType.toLowerCase().includes('binary')) return '[BLOB]';
                                    if (fieldType.toLowerCase().includes('text') || fieldType.toLowerCase().includes('mediumtext')) return 'Lorem ipsum dolor sit...';
                                    return `Sample ${rowIdx + 1}`;
                                  })();

                                  return (
                                    <div key={`cell-${p.schema_field_id}-${rowIdx}`} style={{
                                      width: colWidth,
                                      minWidth: 50,
                                      flexShrink: 0,
                                      padding: '6px 8px',
                                      fontSize: 11,
                                      color: controlType === 'color' ? sampleValue : 'rgba(200,200,200,0.7)',
                                      borderRight: '1px solid rgba(107,114,128,0.15)',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap',
                                      textAlign: (p.label_position === 'right') ? 'right' : 'left',
                                      backgroundColor: controlType === 'color' ? sampleValue + '20' : 'transparent',
                                    }}>
                                      {sampleValue}
                                    </div>
                                  );
                                })}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Button placements - interactive with drag/resize + snap-to-grid */}
                  {buttonPlacements.map((b, idx) => {
                    const btnNodeId = `button-${b.id || b.button_type}-${b.sort_order}`;
                    const isBtnSelected = selectedButtonNodeId === btnNodeId;
                    const bLabel = (b.button_labels && selectedLanguage && b.button_labels[selectedLanguage]) || b.button_label || '';
                    const btnW = b.width || 120;
                    const btnH = b.height || 36;
                    const gridSize = selectedProject?.form_designer_grid_size || 10;
                    const snapEnabled = selectedProject?.form_designer_snap_to_grid !== false;
                    const snap = (v: number) => snapEnabled ? Math.round(v / gridSize) * gridSize : v;

                    return (
                      <div
                        key={`dt-btn-${idx}`}
                        onMouseDown={(e) => {
                          if ((e.target as HTMLElement).closest('[data-resize]')) return;
                          e.stopPropagation();
                          const startX = e.clientX;
                          const startY = e.clientY;
                          const startBX = b.x_position;
                          const startBY = b.y_position;
                          let moved = false;
                          const onMove = (me: MouseEvent) => {
                            moved = true;
                            const dx = me.clientX - startX;
                            const dy = me.clientY - startY;
                            const newX = snap(Math.max(0, startBX + dx));
                            const newY = snap(Math.max(0, startBY + dy));
                            setButtonPlacements(prev => prev.map((bb, i) => i === idx ? { ...bb, x_position: newX, y_position: newY } : bb));
                            setLiveGeometry({ x: newX, y: newY, w: btnW, h: btnH });
                            setHasUnsavedChanges(true);
                          };
                          const onUp = () => {
                            document.removeEventListener('mousemove', onMove);
                            document.removeEventListener('mouseup', onUp);
                            if (!moved) {
                              setSelectedButtonNodeId(isBtnSelected ? null : btnNodeId);
                              setSelectedPlacementId(null);
                              setSelectedMenuNodeId(null);
                              setShowContainerSettings(false);
                              setLiveGeometry(isBtnSelected ? null : { x: b.x_position, y: b.y_position, w: btnW, h: btnH });
                            }
                          };
                          document.addEventListener('mousemove', onMove);
                          document.addEventListener('mouseup', onUp);
                        }}
                        style={{
                          position: 'absolute',
                          left: b.x_position, top: b.y_position,
                          width: btnW, height: btnH,
                          backgroundColor: b.button_background_color || currentFormSet?.default_button_color || '#3b82f6',
                          color: b.button_text_color || currentFormSet?.default_button_text_color || '#fff',
                          borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                          fontSize: 12, cursor: isBtnSelected ? 'move' : 'pointer',
                          border: isBtnSelected ? '3px solid #60a5fa' : '1px solid rgba(255,255,255,0.15)',
                          boxShadow: isBtnSelected ? '0 0 12px rgba(96,165,250,0.5)' : 'none',
                          userSelect: 'none',
                          outline: isBtnSelected ? '1px dashed rgba(96,165,250,0.4)' : 'none',
                          outlineOffset: 3,
                        }}
                      >
                        {(b.button_icon || BUTTON_DEFAULT_ICONS[b.button_type]) && (
                          <i className={`pi ${b.button_icon || BUTTON_DEFAULT_ICONS[b.button_type]}`} style={{ fontSize: 14 }} />
                        )}
                        {bLabel && <span>{bLabel}</span>}

                        {/* Resize handles (4 corners) */}
                        {isBtnSelected && ['nw', 'ne', 'sw', 'se'].map(corner => (
                          <div
                            key={corner}
                            data-resize={corner}
                            onMouseDown={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              const startMX = e.clientX;
                              const startMY = e.clientY;
                              const startW = btnW;
                              const startH = btnH;
                              const startBX = b.x_position;
                              const startBY = b.y_position;
                              const onMove = (me: MouseEvent) => {
                                const dx = me.clientX - startMX;
                                const dy = me.clientY - startMY;
                                let newW = startW, newH = startH, newX = startBX, newY = startBY;
                                if (corner.includes('e')) newW = snap(Math.max(40, startW + dx));
                                if (corner.includes('w')) { newW = snap(Math.max(40, startW - dx)); newX = snap(startBX + (startW - newW)); }
                                if (corner.includes('s')) newH = snap(Math.max(20, startH + dy));
                                if (corner.includes('n')) { newH = snap(Math.max(20, startH - dy)); newY = snap(startBY + (startH - newH)); }
                                setButtonPlacements(prev => prev.map((bb, i) => i === idx ? { ...bb, x_position: newX, y_position: newY, width: newW, height: newH } : bb));
                                setLiveGeometry({ x: newX, y: newY, w: newW, h: newH });
                                setHasUnsavedChanges(true);
                              };
                              const onUp = () => {
                                document.removeEventListener('mousemove', onMove);
                                document.removeEventListener('mouseup', onUp);
                              };
                              document.addEventListener('mousemove', onMove);
                              document.addEventListener('mouseup', onUp);
                            }}
                            style={{
                              position: 'absolute',
                              ...(corner === 'nw' ? { left: -4, top: -4, cursor: 'nw-resize' } :
                                 corner === 'ne' ? { right: -4, top: -4, cursor: 'ne-resize' } :
                                 corner === 'sw' ? { left: -4, bottom: -4, cursor: 'sw-resize' } :
                                 { right: -4, bottom: -4, cursor: 'se-resize' }),
                              width: 8, height: 8,
                              backgroundColor: '#60a5fa', borderRadius: 2,
                              border: '1px solid #fff',
                            }}
                          />
                        ))}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Window size label */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, color: colors.textMuted }}>
                <div style={{ flex: 1, height: 1, backgroundColor: colors.borderPrimary }} />
                <span style={{ fontSize: 11 }}>{currentWindow.default_width || 800} x {currentWindow.default_height || 600} px</span>
                <div style={{ flex: 1, height: 1, backgroundColor: colors.borderPrimary }} />
              </div>
            </div>
          ) : (
            /* ---- REACTFLOW CANVAS (for create_edit, etc.) ---- */
            <>
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={handleNodesChange}
                onEdgesChange={onEdgesChange}
                nodeTypes={nodeTypes}
                multiSelectionKeyCode={MULTI_SELECTION_KEYS}
                // Marquee/lasso: left-drag on empty pane selects everything
                // it touches. Pan moves to middle/right mouse. Partial mode
                // marks a node as selected the moment the rectangle touches
                // its bounding box (vs Full = must be entirely inside) —
                // less frustrating when picking a row of fields where the
                // last column extends past where the user stopped dragging.
                selectionOnDrag
                selectionMode={SelectionMode.Partial}
                panOnDrag={PAN_ON_DRAG_BUTTONS}
                onPaneClick={handlePaneClick}
                onSelectionChange={handleSelectionChange}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                fitView
                fitViewOptions={fitViewOptionsRef}
                snapToGrid={selectedProject?.form_designer_snap_to_grid !== false}
                snapGrid={snapGridRef}
                deleteKeyCode={null}
                onKeyDown={(e) => {
                  if (e.key === 'Delete' && !((e.target as HTMLElement).closest('.properties-panel'))) {
                    const selected = nodes.filter((n) => n.selected && (n.type === 'fieldPlacement' || n.type === 'buttonPlacement'));
                    for (const dn of selected) {
                      if (dn.type === 'fieldPlacement') {
                        const idStr = dn.id.replace('placement-', '');
                        setPlacements((prev) => prev.filter((p) => Number(p.id || p.schema_field_id) !== Number(idStr)));
                        setSelectedPlacementId(null);
                        setHasUnsavedChanges(true);
                      } else if (dn.type === 'buttonPlacement') {
                        setButtonPlacements((prev) => prev.filter((b) => `button-${b.id || b.button_type}-${b.sort_order}` !== dn.id));
                        setSelectedButtonNodeId(null);
                        setHasUnsavedChanges(true);
                      }
                    }
                  }
                }}
                onNodesDelete={(deletedNodes) => {
                  for (const dn of deletedNodes) {
                    if (dn.type === 'fieldPlacement') {
                      const idStr = dn.id.replace('placement-', '');
                      setPlacements((prev) => prev.filter((p) => Number(p.id || p.schema_field_id) !== Number(idStr)));
                      setHasUnsavedChanges(true);
                    } else if (dn.type === 'buttonPlacement') {
                      setButtonPlacements((prev) => prev.filter((b) => `button-${b.id || b.button_type}-${b.sort_order}` !== dn.id));
                      setSelectedButtonNodeId(null);
                      setHasUnsavedChanges(true);
                    }
                  }
                }}
                proOptions={{ hideAttribution: true }}
                style={{ backgroundColor: colors.bgPrimary }}
              >
                <Background variant={BackgroundVariant.Dots} gap={selectedProject?.form_designer_grid_size || 10} size={1} color={'rgba(107,114,128,0.3)'} />
                <Controls
                  showZoom
                  showFitView
                  showInteractive={false}
                  style={{ backgroundColor: colors.bgSecondary, borderColor: colors.borderPrimary }}
                />
                <MiniMap
                  nodeStrokeColor={() => '#6b7280'}
                  nodeColor={(n) => {
                    if (n.type === 'windowFrame') return 'rgba(59,130,246,0.3)';
                    if (n.type === 'containerFrame') return 'rgba(55,65,81,0.3)';
                    return 'rgba(96,165,250,0.5)';
                  }}
                  style={{ backgroundColor: colors.bgTertiary, borderColor: colors.borderPrimary }}
                />
              </ReactFlow>
            </>
          )}

          {/* Empty state overlay */}
          {!currentWindow && !loading && (
            <div style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none',
            }}>
              <div style={{ textAlign: 'center', color: colors.textMuted }}>
                <i className="pi pi-objects-column" style={{ fontSize: 48, opacity: 0.3, display: 'block', marginBottom: 12 }} />
                <div style={{ fontSize: 14, fontWeight: 600 }}>
                  {t.formlayoutdesigner_empty_title || 'Form Layout Designer'}
                </div>
                <div style={{ fontSize: 12, marginTop: 4, maxWidth: 300 }}>
                  {t.formlayoutdesigner_empty_hint || 'Select a Form Set, Window Type, Schema, and Table, then click Load to start designing.'}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ===== RIGHT SIDEBAR: PROPERTIES PANEL ===== */}
        {/* Container/Table Settings (data_table gear icon) */}
        {showContainerSettings && selectedWindowType === 'data_table' && (
          <div className="properties-panel" style={{
            width: 260,
            flexShrink: 0,
            backgroundColor: colors.bgTertiary,
            borderLeft: `1px solid ${colors.borderPrimary}`,
            padding: 16,
            overflowY: 'auto',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h4 style={{ color: colors.textPrimary, fontSize: 14, fontWeight: 600, margin: 0 }}>
                <i className="pi pi-cog" style={{ marginRight: 6 }} />
                {t.formlayoutdesigner_properties || 'Properties'}
              </h4>
              <Button
                icon="pi pi-times"
                className="p-button-text p-button-sm p-button-rounded"
                onClick={() => setShowContainerSettings(false)}
                style={{ width: 24, height: 24 }}
              />
            </div>

            {/* Container info */}
            <div style={{
              padding: 8, borderRadius: 6, marginBottom: 12,
              backgroundColor: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)',
            }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: colors.textPrimary }}>
                <i className="pi pi-table" style={{ marginRight: 6 }} />
                {'Table Settings'}
              </div>
              <div style={{ fontSize: 10, color: colors.textMuted, marginTop: 2 }}>
                {(() => { const c = containerElements.find((el: any) => el.element_type === 'container'); return c ? `${(c as any).width} x ${(c as any).height} px` : ''; })()}
              </div>
            </div>

            {/* Row Height */}
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 11, color: colors.textSecondary, display: 'block', marginBottom: 3 }}>
                {t.formdesignerpanel_row_height || 'Standard Row Height (px)'}
              </label>
              <InputNumber
                value={(() => { const c = containerElements.find((el: any) => el.element_type === 'container'); return (c as any)?.default_control_height ?? 28; })()}
                onValueChange={(e) => {
                  // Update the container element's default_control_height locally
                  if (currentWindow) {
                    const updatedElements = (currentWindow.elements || []).map((el: any) =>
                      el.element_type === 'container' ? { ...el, default_control_height: e.value || 28 } : el
                    );
                    setCurrentWindow({ ...currentWindow, elements: updatedElements });
                    setHasUnsavedChanges(true);
                  }
                }}
                min={16}
                max={100}
                suffix=" px"
                style={{ width: '100%', fontSize: 12 }}
                inputClassName="p-inputtext-sm"
              />
            </div>

            {/* Max columns */}
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 11, color: colors.textSecondary, display: 'block', marginBottom: 3 }}>
                {t.formdesignerpanel_max_columns || 'Max. Number of Columns'}
              </label>
              <InputNumber
                value={(() => { const c = containerElements.find((el: any) => el.element_type === 'container'); return (c as any)?.max_fields || null; })()}
                onValueChange={(e) => {
                  if (currentWindow) {
                    const updatedElements = (currentWindow.elements || []).map((el: any) =>
                      el.element_type === 'container' ? { ...el, max_fields: e.value || null } : el
                    );
                    setCurrentWindow({ ...currentWindow, elements: updatedElements });
                    setHasUnsavedChanges(true);
                  }
                }}
                min={0}
                max={50}
                placeholder={t.formdesignerpanel_all_columns || 'All Columns'}
                style={{ width: '100%', fontSize: 12 }}
                inputClassName="p-inputtext-sm"
              />
              <div style={{ fontSize: 10, color: colors.textMuted, marginTop: 3 }}>
                {placements.filter(p => p.is_visible !== false).length} / {placements.length} {'columns visible'}
              </div>
            </div>
          </div>
        )}

        {/* Field/Button/Menu/Tab Properties */}
        {(selectedPlacement || selectedButton || selectedMenuItem || selectedTabId != null || selectedKind !== 'single') && (
          <div className="properties-panel" style={{
            width: 260,
            flexShrink: 0,
            backgroundColor: colors.bgTertiary,
            borderLeft: `1px solid ${colors.borderPrimary}`,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}>
            <div style={{
              padding: '8px 10px',
              fontSize: 12,
              fontWeight: 600,
              color: colors.textSecondary,
              borderBottom: `1px solid ${colors.borderPrimary}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <span>{t.formlayoutdesigner_properties || 'Properties'}</span>
              {selectedPlacement && (
                <Button
                  icon="pi pi-trash"
                  onClick={handleDeletePlacement}
                  className="p-button-sm p-button-text p-button-danger"
                  style={{ width: 24, height: 24 }}
                  tooltip={t.formlayoutdesigner_remove_field || 'Remove field'}
                />
              )}
              {selectedButton && (
                <Button
                  icon="pi pi-trash"
                  onClick={() => {
                    setButtonPlacements((prev) => prev.filter((b) => `button-${b.id || b.button_type}-${b.sort_order}` !== selectedButtonNodeId));
                    setSelectedButtonNodeId(null);
                    setHasUnsavedChanges(true);
                  }}
                  className="p-button-sm p-button-text p-button-danger"
                  style={{ width: 24, height: 24 }}
                  tooltip="Remove button"
                />
              )}
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: 10 }}>
              {/* ===== MIXED multi-selection — show info, no editor ===== */}
              {selectedKind === 'mixed' && (
                <div style={{
                  padding: '10px 12px',
                  backgroundColor: 'rgba(245,158,11,0.1)',
                  border: '1px solid rgba(245,158,11,0.3)',
                  borderRadius: 4,
                  fontSize: 11,
                  color: colors.textSecondary,
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 8,
                }}>
                  <i className="pi pi-info-circle" style={{ fontSize: 14, marginTop: 1 }} />
                  <span>{orderedSelection.length} {t.formlayoutdesigner_mixed_selection}</span>
                </div>
              )}

              {/* ===== Multi-edit header for fields ===== */}
              {selectedKind === 'fields' && (
                <div style={{
                  marginBottom: 10,
                  padding: '6px 10px',
                  backgroundColor: 'rgba(59,130,246,0.12)',
                  border: '1px solid rgba(59,130,246,0.35)',
                  borderRadius: 4,
                  fontSize: 11,
                  color: colors.textPrimary,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}>
                  <i className="pi pi-objects-column" />
                  <span>{multiSelectedFields.length} {t.formlayoutdesigner_fields_selected}</span>
                </div>
              )}

              {/* ===== Multi-edit header for buttons ===== */}
              {selectedKind === 'buttons' && (
                <div style={{
                  marginBottom: 10,
                  padding: '6px 10px',
                  backgroundColor: 'rgba(59,130,246,0.12)',
                  border: '1px solid rgba(59,130,246,0.35)',
                  borderRadius: 4,
                  fontSize: 11,
                  color: colors.textPrimary,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}>
                  <i className="pi pi-objects-column" />
                  <span>{multiSelectedButtons.length} {t.formlayoutdesigner_buttons_selected}</span>
                </div>
              )}

              {/* ===== FIELD PROPERTIES ===== */}
              {selectedPlacement && selectedKind !== 'buttons' && selectedKind !== 'menus' && selectedKind !== 'mixed' && (
                <>
                  {/* Field/Report-Control info header */}
                  {(() => {
                    const isRC = ['static_text', 'heading', 'line_horizontal', 'line_vertical', 'box', 'page_number', 'page_date', 'page_total', 'image_placeholder'].includes(selectedPlacement.control_type || '');
                    const rcDef = isRC ? REPORT_CONTROLS.find(c => c.type === selectedPlacement.control_type) : null;
                    return (
                      <div style={{
                        marginBottom: 12, padding: '6px 8px', borderRadius: 4,
                        backgroundColor: isRC ? 'rgba(168,85,247,0.1)' : 'rgba(59,130,246,0.1)',
                        border: `1px solid ${isRC ? 'rgba(168,85,247,0.2)' : 'rgba(59,130,246,0.2)'}`,
                      }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: colors.textPrimary }}>
                          {isRC ? (
                            <><i className={`pi ${rcDef?.icon || 'pi-align-left'}`} style={{ marginRight: 6, color: '#a855f7' }} />{rcDef?.label || selectedPlacement.control_type}</>
                          ) : (
                            selectedPlacement.schema_field?.field_name || '\u2014'
                          )}
                        </div>
                        <div style={{ fontSize: 10, color: colors.textMuted, marginTop: 2 }}>
                          {isRC ? 'Report Control' : (
                            <>{selectedPlacement.schema_field?.field_type || '\u2014'}{selectedPlacement.schema_field?.is_primary_key && ' (PK)'}{selectedPlacement.schema_field?.is_nullable && ' \u2022 nullable'}</>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Move Left / Move Right (data_table only) \u2014 placed right
                      under the field badge so the user spots them immediately
                      when they pick a column. Blue, prominent: the action is
                      "swap column order" which used to be a mouse-drag on the
                      header (removed because it stole focus from the row and
                      broke the amber selection visual). Arrow buttons keep
                      focus on the same placement id so the user can chain
                      \u2190 \u2190 \u2190 without re-clicking. Disabled at the boundaries. */}
                  {selectedWindowType === 'data_table' && (() => {
                    const sorted = [...placements].filter(p => p.is_visible).sort((a, b) => a.sort_order - b.sort_order);
                    const currentKey = String(selectedPlacementId);
                    const idx = sorted.findIndex(p => String(p.id || p.schema_field_id) === currentKey);
                    const canLeft = idx > 0;
                    const canRight = idx >= 0 && idx < sorted.length - 1;
                    const swap = (newIdx: number) => {
                      const keys = sorted.map(p => String(p.id || p.schema_field_id));
                      const [moved] = keys.splice(idx, 1);
                      keys.splice(newIdx, 0, moved);
                      setPlacements(prev => {
                        const reordered = keys.map((key, i) => {
                          const p = prev.find(pp => String(pp.id || pp.schema_field_id) === key);
                          return p ? { ...p, sort_order: i } : null;
                        }).filter(Boolean) as typeof prev;
                        const nonField = prev.filter(pp => !keys.includes(String(pp.id || pp.schema_field_id)));
                        return [...nonField, ...reordered];
                      });
                      setHasUnsavedChanges(true);
                    };
                    // Blue palette mirrors the "Speichern" / primary-action
                    // colour family elsewhere \u2014 signals "this is the column-
                    // ordering action" at a glance vs the neutral grey of
                    // the surrounding inputs.
                    const BLUE_BG = '#3b82f6';
                    const BLUE_HOVER = '#2563eb';
                    return (
                      <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
                        <button
                          onClick={() => canLeft && swap(idx - 1)}
                          disabled={!canLeft}
                          title={t.formlayoutdesigner_move_left || 'Move column left'}
                          onMouseEnter={(e) => { if (canLeft) (e.currentTarget.style.background = BLUE_HOVER); }}
                          onMouseLeave={(e) => { if (canLeft) (e.currentTarget.style.background = BLUE_BG); }}
                          style={{
                            flex: 1, padding: '8px 0', fontSize: 12, fontWeight: 600,
                            background: canLeft ? BLUE_BG : 'rgba(59,130,246,0.15)',
                            color: '#fff',
                            border: 'none', borderRadius: 4,
                            cursor: canLeft ? 'pointer' : 'not-allowed',
                            opacity: canLeft ? 1 : 0.4,
                            transition: 'background 0.12s',
                          }}
                        >
                          \u2190 {t.formlayoutdesigner_move_left_short || 'Left'}
                        </button>
                        <button
                          onClick={() => canRight && swap(idx + 1)}
                          disabled={!canRight}
                          title={t.formlayoutdesigner_move_right || 'Move column right'}
                          onMouseEnter={(e) => { if (canRight) (e.currentTarget.style.background = BLUE_HOVER); }}
                          onMouseLeave={(e) => { if (canRight) (e.currentTarget.style.background = BLUE_BG); }}
                          style={{
                            flex: 1, padding: '8px 0', fontSize: 12, fontWeight: 600,
                            background: canRight ? BLUE_BG : 'rgba(59,130,246,0.15)',
                            color: '#fff',
                            border: 'none', borderRadius: 4,
                            cursor: canRight ? 'pointer' : 'not-allowed',
                            opacity: canRight ? 1 : 0.4,
                            transition: 'background 0.12s',
                          }}
                        >
                          {t.formlayoutdesigner_move_right_short || 'Right'} \u2192
                        </button>
                      </div>
                    );
                  })()}

                  {/* --- REPORT CONTROL SPECIFIC PROPERTIES --- */}
                  {['static_text', 'heading', 'line_horizontal', 'line_vertical', 'box', 'page_number', 'page_date', 'page_total', 'image_placeholder'].includes(selectedPlacement.control_type || '') && (
                    <>
                      {/* Text content (for static_text, heading) */}
                      {['static_text', 'heading'].includes(selectedPlacement.control_type || '') && (
                        <div style={{ marginBottom: 10 }}>
                          <label style={{ fontSize: 11, color: colors.textSecondary, display: 'block', marginBottom: 3 }}>
                            {t.formlayoutdesigner_report_static_text || 'Text content'}
                          </label>
                          <InputText
                            value={selectedPlacement.caption_override || ''}
                            onChange={(e) => {
                              updatePlacementProp('caption_override', e.target.value || null);
                            }}
                            className="w-full p-inputtext-sm"
                          />
                        </div>
                      )}

                      {/* Font Settings (text controls) */}
                      {['static_text', 'heading', 'page_number', 'page_date', 'page_total'].includes(selectedPlacement.control_type || '') && (
                        <>
                          {/* Font Size */}
                          <div style={{ marginBottom: 10 }}>
                            <label style={{ fontSize: 11, color: colors.textSecondary, display: 'block', marginBottom: 3 }}>
                              {t.formlayoutdesigner_report_font_size || 'Font Size (px)'}
                            </label>
                            <InputNumber
                              value={selectedPlacement.style_config?.fontSize || (selectedPlacement.control_type === 'heading' ? 18 : 12)}
                              onValueChange={(e) => {
                                const sc = { ...(selectedPlacement.style_config || {}), fontSize: e.value || 12 };
                                updatePlacementProp('style_config', sc);
                              }}
                              min={6} max={72} suffix=" px"
                              style={{ width: '100%', fontSize: 12 }}
                              inputClassName="p-inputtext-sm"
                            />
                          </div>

                          {/* Font Family */}
                          <div style={{ marginBottom: 10 }}>
                            <label style={{ fontSize: 11, color: colors.textSecondary, display: 'block', marginBottom: 3 }}>
                              Font
                            </label>
                            <Dropdown
                              value={selectedPlacement.style_config?.fontFamily || 'inherit'}
                              options={[
                                { label: 'Default', value: 'inherit' },
                                { label: 'Arial', value: 'Arial, sans-serif' },
                                { label: 'Times New Roman', value: 'Times New Roman, serif' },
                                { label: 'Courier New', value: 'Courier New, monospace' },
                                { label: 'Georgia', value: 'Georgia, serif' },
                                { label: 'Verdana', value: 'Verdana, sans-serif' },
                                { label: 'Tahoma', value: 'Tahoma, sans-serif' },
                              ]}
                              onChange={(e) => {
                                const sc = { ...(selectedPlacement.style_config || {}), fontFamily: e.value };
                                updatePlacementProp('style_config', sc);
                              }}
                              className="w-full"
                              style={{ fontSize: 12 }}
                            />
                          </div>

                          {/* Text Align */}
                          <div style={{ marginBottom: 10 }}>
                            <label style={{ fontSize: 11, color: colors.textSecondary, display: 'block', marginBottom: 3 }}>
                              Alignment
                            </label>
                            <div style={{ display: 'flex', gap: 4 }}>
                              {(['left', 'center', 'right'] as const).map(align => (
                                <button
                                  key={align}
                                  onClick={() => {
                                    const sc = { ...(selectedPlacement.style_config || {}), textAlign: align };
                                    updatePlacementProp('style_config', sc);
                                  }}
                                  style={{
                                    flex: 1, padding: '4px 0', borderRadius: 4, border: 'none', cursor: 'pointer',
                                    backgroundColor: (selectedPlacement.style_config?.textAlign || 'left') === align ? '#3b82f6' : colors.bgTertiary,
                                    color: (selectedPlacement.style_config?.textAlign || 'left') === align ? '#fff' : colors.textSecondary,
                                    fontSize: 11,
                                  }}
                                >
                                  <i className={`pi pi-align-${align}`} />
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Font Decorations (Bold, Italic, Underline, Strikethrough) */}
                          <div style={{ marginBottom: 10 }}>
                            <label style={{ fontSize: 11, color: colors.textSecondary, display: 'block', marginBottom: 3 }}>
                              Style
                            </label>
                            <div style={{ display: 'flex', gap: 4 }}>
                              {([
                                { key: 'fontWeight', value: 'bold', icon: 'pi-bold', label: 'B' },
                                { key: 'fontStyle', value: 'italic', icon: 'pi-italic', label: 'I' },
                                { key: 'textDecoration', value: 'underline', icon: 'pi-underline', label: 'U' },
                                { key: 'textDecoration', value: 'line-through', icon: 'pi-strikethrough', label: 'S' },
                              ] as const).map((deco) => {
                                const currentVal = (selectedPlacement.style_config as any)?.[deco.key] || (deco.key === 'fontWeight' ? 'normal' : deco.key === 'fontStyle' ? 'normal' : 'none');
                                const isActive = currentVal === deco.value;
                                return (
                                  <button
                                    key={`${deco.key}-${deco.value}`}
                                    onClick={() => {
                                      const sc = { ...(selectedPlacement.style_config || {}), [deco.key]: isActive ? (deco.key === 'textDecoration' ? 'none' : 'normal') : deco.value };
                                      updatePlacementProp('style_config', sc);
                                    }}
                                    style={{
                                      flex: 1, padding: '4px 0', borderRadius: 4, border: 'none', cursor: 'pointer',
                                      backgroundColor: isActive ? '#3b82f6' : colors.bgTertiary,
                                      color: isActive ? '#fff' : colors.textSecondary,
                                      fontSize: 12, fontWeight: deco.key === 'fontWeight' ? 'bold' : 'normal',
                                      fontStyle: deco.key === 'fontStyle' ? 'italic' : 'normal',
                                      textDecoration: deco.key === 'textDecoration' ? deco.value : 'none',
                                    }}
                                  >
                                    {deco.label}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </>
                      )}

                      {/* Font Color (text controls) */}
                      {['static_text', 'heading', 'page_number', 'page_date', 'page_total'].includes(selectedPlacement.control_type || '') && (
                        <div style={{ marginBottom: 10 }}>
                          <label style={{ fontSize: 11, color: colors.textSecondary, display: 'block', marginBottom: 3 }}>
                            {t.formlayoutdesigner_report_font_color || 'Font Color'}
                          </label>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <input type="color" value={selectedPlacement.button_text_color || '#e5e7eb'}
                              onChange={(e) => updatePlacementProp('button_text_color', e.target.value)}
                              style={{ width: 32, height: 24, border: 'none', cursor: 'pointer' }}
                            />
                            <span style={{ fontSize: 11, color: colors.textMuted }}>{selectedPlacement.button_text_color || '#e5e7eb'}</span>
                          </div>
                        </div>
                      )}

                      {/* Line/Border Color */}
                      {['line_horizontal', 'line_vertical', 'box'].includes(selectedPlacement.control_type || '') && (
                        <div style={{ marginBottom: 10 }}>
                          <label style={{ fontSize: 11, color: colors.textSecondary, display: 'block', marginBottom: 3 }}>
                            {selectedPlacement.control_type === 'box' ? (t.formlayoutdesigner_report_border_color || 'Border Color') : (t.formlayoutdesigner_report_line_color || 'Line Color')}
                          </label>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <input type="color" value={selectedPlacement.button_background_color || '#6b7280'}
                              onChange={(e) => updatePlacementProp('button_background_color', e.target.value)}
                              style={{ width: 32, height: 24, border: 'none', cursor: 'pointer' }}
                            />
                            <span style={{ fontSize: 11, color: colors.textMuted }}>{selectedPlacement.button_background_color || '#6b7280'}</span>
                          </div>
                        </div>
                      )}

                      {/* Box background color */}
                      {selectedPlacement.control_type === 'box' && (
                        <div style={{ marginBottom: 10 }}>
                          <label style={{ fontSize: 11, color: colors.textSecondary, display: 'block', marginBottom: 3 }}>
                            {t.formlayoutdesigner_report_bg_color || 'Background'}
                          </label>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <input type="color" value={selectedPlacement.button_text_color || '#1f2937'}
                              onChange={(e) => updatePlacementProp('button_text_color', e.target.value)}
                              style={{ width: 32, height: 24, border: 'none', cursor: 'pointer' }}
                            />
                            <span style={{ fontSize: 11, color: colors.textMuted }}>{selectedPlacement.button_text_color || 'transparent'}</span>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {/* --- NORMAL FIELD PROPERTIES (only for non-report controls) --- */}
                  {!['static_text', 'heading', 'line_horizontal', 'line_vertical', 'box', 'page_number', 'page_date', 'page_total', 'image_placeholder'].includes(selectedPlacement.control_type || '') && (<>

                  {/* Caption Override (per language) — DISABLED in multi-edit (per-item) */}
                  <div style={{ marginBottom: 10, ...(multiEditFields ? disabledStyle : {}) }}>
                    <label style={{ fontSize: 11, color: colors.textSecondary, display: 'block', marginBottom: 3 }}>
                      {t.formlayoutdesigner_caption || 'Caption'} {selectedLanguage ? `(${selectedLanguage.toUpperCase()})` : ''}
                    </label>
                    <InputText
                      value={(selectedPlacement.caption_labels && selectedLanguage ? selectedPlacement.caption_labels[selectedLanguage] : null) || selectedPlacement.caption_override || ''}
                      onChange={(e) => {
                        const val = e.target.value || '';
                        if (selectedLanguage) {
                          // If caption_labels is empty, initialize ALL languages with the current caption first
                          const labels = { ...(selectedPlacement.caption_labels || {}) };
                          if (Object.keys(labels).length === 0) {
                            const currentCaption = selectedPlacement.caption_override || formatFieldName(selectedPlacement.schema_field?.field_name || '');
                            for (const lang of enabledLanguages) {
                              labels[lang.value] = currentCaption;
                            }
                          }
                          labels[selectedLanguage] = val;
                          updatePlacementProp('caption_labels', labels);
                        }
                        updatePlacementProp('caption_override', val || null);
                      }}
                      placeholder={formatFieldName(selectedPlacement.schema_field?.field_name || '')}
                      style={{ width: '100%', fontSize: 12 }}
                      className="p-inputtext-sm"
                    />
                  </div>

                  {/* Control Type Override (shared in multi-edit) */}
                  <div style={{ marginBottom: 10 }}>
                    <label style={{ fontSize: 11, color: colors.textSecondary, display: 'block', marginBottom: 3 }}>
                      {t.formlayoutdesigner_control_type || 'Control Type'}
                    </label>
                    <Dropdown
                      value={multiEditFields ? fieldSharedValue('control_type') : (selectedPlacement.control_type || selectedPlacement.control_type_override || null)}
                      options={CONTROL_TYPE_OPTIONS}
                      onChange={(e) => {
                        if (multiEditFields) {
                          updateMultiplePlacements({ control_type: e.value || null, control_type_override: e.value || null });
                        } else {
                          updatePlacementProp('control_type', e.value || null);
                          updatePlacementProp('control_type_override', e.value || null);
                        }
                      }}
                      placeholder={selectedPlacement.schema_field?.control_type || 'Auto'}
                      style={{ width: '100%', fontSize: 12 }}
                      className="p-inputtext-sm"
                      showClear
                    />
                  </div>

                  {/* Label Position */}
                  <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: 11, color: colors.textSecondary, display: 'block', marginBottom: 3 }}>
                        Label Position
                      </label>
                      <Dropdown
                        value={multiEditFields ? fieldSharedValue('label_position', 'top') : (selectedPlacement.label_position || 'top')}
                        options={
                          (selectedPlacement.control_type || selectedPlacement.control_type_override) === 'checkbox'
                            ? [{ label: 'Top', value: 'top' }, { label: 'Left', value: 'left' }, { label: 'Right', value: 'right' }]
                            : [{ label: 'Top', value: 'top' }, { label: 'Left', value: 'left' }]
                        }
                        onChange={(e) => updateFieldShared('label_position', e.value)}
                        style={{ width: '100%', fontSize: 12 }}
                        className="p-inputtext-sm"
                      />
                    </div>
                    {((multiEditFields ? fieldSharedValue('label_position') : selectedPlacement.label_position) === 'left') && (
                      <div style={{ width: 70 }}>
                        <label style={{ fontSize: 11, color: colors.textSecondary, display: 'block', marginBottom: 3 }}>
                          Label W
                        </label>
                        <InputNumber
                          value={multiEditFields ? fieldSharedValue('label_width', 100) : (selectedPlacement.label_width || 100)}
                          onValueChange={(e) => updateFieldShared('label_width', e.value || 100)}
                          min={40} max={300} step={5}
                          style={{ width: '100%', fontSize: 12 }}
                          inputClassName="p-inputtext-sm"
                        />
                      </div>
                    )}
                  </div>

                  {/* Position & Size (X / Y) - hidden for data_table columns. Per-item: disabled in multi-edit. */}
                  {selectedWindowType !== 'data_table' && (
                    <div style={{ display: 'flex', gap: 4, marginBottom: 8, maxWidth: 200, ...(multiEditFields ? disabledStyle : {}) }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <label style={{ fontSize: 10, color: colors.textSecondary, display: 'block', marginBottom: 2 }}>X</label>
                        <InputNumber
                          value={liveGeometry?.x ?? selectedPlacement.x_position}
                          onValueChange={(e) => { updatePlacementProp('x_position', e.value || 0); setLiveGeometry((g) => g ? { ...g, x: e.value || 0 } : null); }}
                          min={0} step={1}
                          inputStyle={{ width: '100%', fontSize: 11, padding: '4px 6px' }}
                          className="p-inputtext-sm"
                        />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <label style={{ fontSize: 10, color: colors.textSecondary, display: 'block', marginBottom: 2 }}>Y</label>
                        <InputNumber
                          value={liveGeometry?.y ?? selectedPlacement.y_position}
                          onValueChange={(e) => { updatePlacementProp('y_position', e.value || 0); setLiveGeometry((g) => g ? { ...g, y: e.value || 0 } : null); }}
                          min={0} step={1}
                          inputStyle={{ width: '100%', fontSize: 11, padding: '4px 6px' }}
                          className="p-inputtext-sm"
                        />
                      </div>
                    </div>
                  )}

                  {/* Width / Height (Height hidden for data_table) */}
                  <div style={{ display: 'flex', gap: 4, marginBottom: 8, maxWidth: 200 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <label style={{ fontSize: 10, color: colors.textSecondary, display: 'block', marginBottom: 2 }}>
                        {t.formlayoutdesigner_width || 'W'}
                      </label>
                      <InputNumber
                        value={multiEditFields ? fieldSharedValue('width') : (liveGeometry?.w ?? selectedPlacement.width)}
                        onValueChange={(e) => {
                          if (multiEditFields) {
                            updateMultiplePlacements({ width: e.value || 180 });
                          } else {
                            updatePlacementProp('width', e.value || 180);
                            setLiveGeometry((g) => g ? { ...g, w: e.value || 180 } : null);
                          }
                        }}
                        min={60} max={800} step={10}
                        inputStyle={{ width: '100%', fontSize: 11, padding: '4px 6px' }}
                        className="p-inputtext-sm"
                      />
                    </div>
                    {selectedWindowType !== 'data_table' && (
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <label style={{ fontSize: 10, color: colors.textSecondary, display: 'block', marginBottom: 2 }}>
                          {t.formlayoutdesigner_height || 'H'}
                        </label>
                        <InputNumber
                          value={multiEditFields ? fieldSharedValue('height') : (liveGeometry?.h ?? selectedPlacement.height)}
                          onValueChange={(e) => {
                            if (multiEditFields) {
                              updateMultiplePlacements({ height: e.value || 10 });
                            } else {
                              updatePlacementProp('height', e.value || 10);
                              setLiveGeometry((g) => g ? { ...g, h: e.value || 10 } : null);
                            }
                          }}
                          min={10} max={600} step={2}
                          inputStyle={{ width: '100%', fontSize: 11, padding: '4px 6px' }}
                          className="p-inputtext-sm"
                        />
                      </div>
                    )}
                  </div>

                  {/* Tab Order — DISABLED in multi-edit (per-item) */}
                  <div style={{ marginBottom: 8, maxWidth: 200, ...(multiEditFields ? disabledStyle : {}) }}>
                    <label style={{ fontSize: 10, color: colors.textSecondary, display: 'block', marginBottom: 2 }}>{t.formdesignerpanel_taborder || 'Tab Order'}</label>
                    <InputNumber
                      value={selectedPlacement.tab_order ?? 0}
                      onValueChange={(e) => {
                        const v = Math.max(-1, Math.min(999999, e.value ?? 0));
                        updatePlacementProp('tab_order' as any, v);
                      }}
                      min={-1} max={999999} step={1}
                      inputStyle={{ width: '100%', fontSize: 11, padding: '4px 6px' }}
                      className="p-inputtext-sm"
                    />
                  </div>

                  {/* Anchor (shared in multi-edit) */}
                  {selectedWindowType !== 'data_table' && (
                    <AnchorSection
                      values={multiEditFields ? {
                        anchor_right: fieldSharedValue('anchor_right'),
                        anchor_bottom: fieldSharedValue('anchor_bottom'),
                        anchor_width: fieldSharedValue('anchor_width'),
                        anchor_height: fieldSharedValue('anchor_height'),
                      } : {
                        anchor_right: (selectedPlacement as any).anchor_right ?? null,
                        anchor_bottom: (selectedPlacement as any).anchor_bottom ?? null,
                        anchor_width: (selectedPlacement as any).anchor_width ?? null,
                        anchor_height: (selectedPlacement as any).anchor_height ?? null,
                      }}
                      onChange={(updates) => {
                        if (multiEditFields) {
                          updateMultiplePlacements(updates as any);
                        } else {
                          for (const [key, val] of Object.entries(updates)) {
                            updatePlacementProp(key as any, val);
                          }
                        }
                      }}
                      colors={colors}
                    />
                  )}

                  {/* Visible (shared in multi-edit) */}
                  <div style={{ marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Checkbox
                      inputId="placement-visible"
                      checked={multiEditFields ? !!fieldSharedValue('is_visible', true) : selectedPlacement.is_visible}
                      onChange={(e) => updateFieldShared('is_visible', e.checked ?? true)}
                    />
                    <label htmlFor="placement-visible" style={{ fontSize: 11, color: colors.textSecondary, cursor: 'pointer' }}>
                      {t.formlayoutdesigner_visible || 'Visible'}
                    </label>
                  </div>
                </>)}
                </>
              )}

              {/* ===== BUTTON PROPERTIES ===== */}
              {selectedButton && selectedKind !== 'fields' && selectedKind !== 'menus' && selectedKind !== 'mixed' && (
                <>
                  {/* Button info header */}
                  <div style={{
                    marginBottom: 12, padding: '6px 8px', borderRadius: 4,
                    backgroundColor: `${selectedButton.button_background_color || '#3b82f6'}22`,
                    border: `1px solid ${selectedButton.button_background_color || '#3b82f6'}44`,
                  }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: colors.textPrimary, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <i className={`pi ${selectedButton.button_icon || BUTTON_DEFAULT_ICONS[selectedButton.button_type] || 'pi-cog'}`} style={{ fontSize: 12 }} />
                      {selectedButton.button_label || BUTTON_DEFAULT_LABELS[selectedButton.button_type] || selectedButton.button_type}
                    </div>
                    <div style={{ fontSize: 10, color: colors.textMuted, marginTop: 2 }}>
                      {selectedButton.button_type.replace(/_/g, ' ')}
                    </div>
                  </div>

                  {/* Button Label (per language) — DISABLED in multi-edit (per-item) */}
                  <div style={{ marginBottom: 10, ...(multiEditButtons ? disabledStyle : {}) }}>
                    <label style={{ fontSize: 11, color: colors.textSecondary, display: 'block', marginBottom: 3 }}>
                      Label {selectedLanguage ? `(${selectedLanguage.toUpperCase()})` : ''}
                    </label>
                    <InputText
                      value={(selectedButton.button_labels && selectedLanguage ? selectedButton.button_labels[selectedLanguage] : null) || selectedButton.button_label || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setButtonPlacements((prev) => prev.map((b) => {
                          if (`button-${b.id || b.button_type}-${b.sort_order}` !== selectedButtonNodeId) return b;
                          // If button_labels is empty, initialize ALL languages with the current label first
                          // This prevents overwriting other languages with the new value
                          const labels = { ...(b.button_labels || {}) };
                          if (Object.keys(labels).length === 0) {
                            const currentLabel = b.button_label || BUTTON_DEFAULT_LABELS[b.button_type] || '';
                            for (const lang of enabledLanguages) {
                              labels[lang.value] = currentLabel;
                            }
                          }
                          if (selectedLanguage) {
                            labels[selectedLanguage] = val;
                          }
                          return { ...b, button_label: val || null, button_labels: labels };
                        }));
                        setHasUnsavedChanges(true);
                      }}
                      placeholder={BUTTON_DEFAULT_LABELS[selectedButton.button_type] || 'Button'}
                      style={{ width: '100%', fontSize: 12 }}
                      className="p-inputtext-sm"
                    />
                  </div>

                  {/* Button Icon — DISABLED in multi-edit (per-item) */}
                  <div style={{ marginBottom: 10, ...(multiEditButtons ? disabledStyle : {}) }}>
                    <label style={{ fontSize: 11, color: colors.textSecondary, display: 'block', marginBottom: 3 }}>Icon (pi-xxx)</label>
                    <InputText
                      value={selectedButton.button_icon || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setButtonPlacements((prev) => prev.map((b) =>
                          `button-${b.id || b.button_type}-${b.sort_order}` === selectedButtonNodeId ? { ...b, button_icon: val || null } : b
                        ));
                        setHasUnsavedChanges(true);
                      }}
                      placeholder={BUTTON_DEFAULT_ICONS[selectedButton.button_type] || 'pi-cog'}
                      style={{ width: '100%', fontSize: 12 }}
                      className="p-inputtext-sm"
                    />
                  </div>

                  {/* Background Color (shared in multi-edit) */}
                  <div style={{ marginBottom: 10 }}>
                    <label style={{ fontSize: 11, color: colors.textSecondary, display: 'block', marginBottom: 3 }}>Background</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <input
                        type="color"
                        value={(multiEditButtons ? buttonSharedValue('button_background_color') : selectedButton.button_background_color) || currentFormSet?.default_button_color || BUTTON_FALLBACK_COLOR}
                        onChange={(e) => updateButtonShared('button_background_color', e.target.value)}
                        style={{ width: 32, height: 28, border: 'none', cursor: 'pointer', borderRadius: 3 }}
                      />
                      <span style={{ fontSize: 11, color: colors.textMuted }}>
                        {(multiEditButtons ? buttonSharedValue('button_background_color') : selectedButton.button_background_color) || currentFormSet?.default_button_color || BUTTON_FALLBACK_COLOR}
                      </span>
                    </div>
                  </div>

                  {/* Text Color (shared in multi-edit) */}
                  <div style={{ marginBottom: 10 }}>
                    <label style={{ fontSize: 11, color: colors.textSecondary, display: 'block', marginBottom: 3 }}>Text Color</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <input
                        type="color"
                        value={(multiEditButtons ? buttonSharedValue('button_text_color') : selectedButton.button_text_color) || '#ffffff'}
                        onChange={(e) => updateButtonShared('button_text_color', e.target.value)}
                        style={{ width: 32, height: 28, border: 'none', cursor: 'pointer', borderRadius: 3 }}
                      />
                      <span style={{ fontSize: 11, color: colors.textMuted }}>
                        {(multiEditButtons ? buttonSharedValue('button_text_color') : selectedButton.button_text_color) || '#ffffff'}
                      </span>
                    </div>
                  </div>

                  {/* Visible (shared in multi-edit) */}
                  <div style={{ marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Checkbox
                      inputId="button-visible"
                      checked={multiEditButtons ? !!buttonSharedValue('is_visible', true) : selectedButton.is_visible}
                      onChange={(e) => updateButtonShared('is_visible', e.checked ?? true)}
                    />
                    <label htmlFor="button-visible" style={{ fontSize: 11, color: colors.textSecondary, cursor: 'pointer' }}>
                      {t.formlayoutdesigner_visible || 'Visible'}
                    </label>
                  </div>

                  {/* Position & Size (X / Y) — DISABLED in multi-edit (per-item) */}
                  <div style={{ display: 'flex', gap: 4, marginBottom: 8, maxWidth: 200, ...(multiEditButtons ? disabledStyle : {}) }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <label style={{ fontSize: 10, color: colors.textSecondary, display: 'block', marginBottom: 2 }}>X</label>
                      <InputNumber
                        value={liveGeometry?.x ?? selectedButton.x_position}
                        onValueChange={(e) => {
                          updateButtonShared('x_position', e.value || 0);
                          setLiveGeometry((g) => g ? { ...g, x: e.value || 0 } : null);
                        }}
                        min={0} step={1}
                        inputStyle={{ width: '100%', fontSize: 11, padding: '4px 6px' }}
                        className="p-inputtext-sm"
                      />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <label style={{ fontSize: 10, color: colors.textSecondary, display: 'block', marginBottom: 2 }}>Y</label>
                      <InputNumber
                        value={liveGeometry?.y ?? selectedButton.y_position}
                        onValueChange={(e) => {
                          updateButtonShared('y_position', e.value || 0);
                          setLiveGeometry((g) => g ? { ...g, y: e.value || 0 } : null);
                        }}
                        min={0} step={1}
                        inputStyle={{ width: '100%', fontSize: 11, padding: '4px 6px' }}
                        className="p-inputtext-sm"
                      />
                    </div>
                  </div>

                  {/* Width / Height (shared in multi-edit) */}
                  <div style={{ display: 'flex', gap: 4, marginBottom: 8, maxWidth: 200 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <label style={{ fontSize: 10, color: colors.textSecondary, display: 'block', marginBottom: 2 }}>W</label>
                      <InputNumber
                        value={multiEditButtons ? buttonSharedValue('width') : (liveGeometry?.w ?? selectedButton.width)}
                        onValueChange={(e) => {
                          updateButtonShared('width', e.value || 120);
                          if (!multiEditButtons) setLiveGeometry((g) => g ? { ...g, w: e.value || 120 } : null);
                        }}
                        min={40} max={400} step={10}
                        inputStyle={{ width: '100%', fontSize: 11, padding: '4px 6px' }}
                        className="p-inputtext-sm"
                      />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <label style={{ fontSize: 10, color: colors.textSecondary, display: 'block', marginBottom: 2 }}>H</label>
                      <InputNumber
                        value={multiEditButtons ? buttonSharedValue('height') : (liveGeometry?.h ?? selectedButton.height)}
                        onValueChange={(e) => {
                          updateButtonShared('height', e.value || 36);
                          if (!multiEditButtons) setLiveGeometry((g) => g ? { ...g, h: e.value || 36 } : null);
                        }}
                        min={20} max={200} step={4}
                        inputStyle={{ width: '100%', fontSize: 11, padding: '4px 6px' }}
                        className="p-inputtext-sm"
                      />
                    </div>
                  </div>

                  {/* Tab Order — DISABLED in multi-edit (per-item) */}
                  <div style={{ marginBottom: 8, maxWidth: 200, ...(multiEditButtons ? disabledStyle : {}) }}>
                    <label style={{ fontSize: 10, color: colors.textSecondary, display: 'block', marginBottom: 2 }}>{t.formdesignerpanel_taborder || 'Tab Order'}</label>
                    <InputNumber
                      value={selectedButton.tab_order ?? 0}
                      onValueChange={(e) => {
                        const v = Math.max(-1, Math.min(999999, e.value ?? 0));
                        updateButtonShared('tab_order', v);
                      }}
                      min={-1} max={999999} step={1}
                      inputStyle={{ width: '100%', fontSize: 11, padding: '4px 6px' }}
                      className="p-inputtext-sm"
                    />
                  </div>

                  {/* Anchor for buttons (shared in multi-edit) */}
                  <AnchorSection
                    values={multiEditButtons ? {
                      anchor_right: buttonSharedValue('anchor_right'),
                      anchor_bottom: buttonSharedValue('anchor_bottom'),
                      anchor_width: buttonSharedValue('anchor_width'),
                      anchor_height: buttonSharedValue('anchor_height'),
                    } : {
                      anchor_right: (selectedButton as any).anchor_right ?? null,
                      anchor_bottom: (selectedButton as any).anchor_bottom ?? null,
                      anchor_width: (selectedButton as any).anchor_width ?? null,
                      anchor_height: (selectedButton as any).anchor_height ?? null,
                    }}
                    onChange={(updates) => {
                      updateButtonProps(updates as any);
                    }}
                    colors={colors}
                  />
                </>
              )}

              {/* ---- MENU ITEM PROPERTIES ---- */}
              {selectedMenuItem && selectedKind === 'single' && (
                <>
                  <div style={{
                    padding: '8px 10px', marginBottom: 4,
                    backgroundColor: 'rgba(245,158,11,0.08)',
                    border: '1px solid rgba(245,158,11,0.25)',
                    borderRadius: 4,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: colors.textPrimary }}>
                      <i className={`pi ${selectedMenuItem.menu_icon || 'pi-table'}`} style={{ fontSize: 12 }} />
                      {selectedMenuItem.caption_override || (() => { const ti = schemaTables.find(tbl => Number(tbl.id) === Number(selectedMenuItem.schema_table_id)); return ti?.caption || ti?.singular_name || ti?.table_name || 'Menu Item'; })()}
                    </div>
                    <div style={{ fontSize: 9, color: colors.textMuted, marginTop: 2 }}>
                      {selectedMenuItem.schema_table_id ? 'Table Link' : (selectedMenuItem.menu_icon === 'pi-minus' ? 'Separator' : 'Group')}
                    </div>
                  </div>

                  {/* Caption (multilingual) */}
                  {selectedMenuItem.menu_icon !== 'pi-minus' && (
                    <div style={{ marginBottom: 8 }}>
                      <label style={{ fontSize: 10, color: colors.textMuted, display: 'block', marginBottom: 2 }}>
                        {t.formlayoutdesigner_caption || 'Caption'} {selectedLanguage ? `(${selectedLanguage.toUpperCase()})` : ''}
                      </label>
                      <InputText
                        value={(selectedMenuItem.caption_labels && selectedLanguage ? selectedMenuItem.caption_labels[selectedLanguage] : null) || selectedMenuItem.caption_override || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setMenuPlacements(prev => prev.map(m => {
                            if (`menu-${m.id || m.temp_id}` !== selectedMenuNodeId) return m;
                            // Preserve latest drag positions from ref
                            const refItem = menuPlacementsRef.current.find(r => (r.id || r.temp_id) === (m.id || m.temp_id));
                            const base = { ...m, x_position: refItem?.x_position ?? m.x_position, y_position: refItem?.y_position ?? m.y_position, width: refItem?.width ?? m.width, height: refItem?.height ?? m.height };
                            if (selectedLanguage) {
                              const labels = { ...(base.caption_labels || {}), [selectedLanguage]: val };
                              return { ...base, caption_labels: labels };
                            }
                            return { ...base, caption_override: val };
                          }));
                          setHasUnsavedChanges(true);
                        }}
                        placeholder={(() => { const ti = schemaTables.find(tbl => Number(tbl.id) === Number(selectedMenuItem.schema_table_id)); return ti?.caption || ti?.singular_name || ti?.table_name || 'Menu Item'; })()}
                        className="p-inputtext-sm"
                        style={{ width: '100%', fontSize: 12 }}
                      />
                    </div>
                  )}

                  {/* Icon */}
                  <div style={{ marginBottom: 8 }}>
                    <label style={{ fontSize: 10, color: colors.textMuted, display: 'block', marginBottom: 2 }}>
                      {t.formlayoutdesigner_icon || 'Icon'}
                    </label>
                    <Dropdown
                      value={selectedMenuItem.menu_icon || 'pi-table'}
                      options={MENU_ICON_OPTIONS}
                      onChange={(e) => {
                        updateMenuItemProp(selectedMenuNodeId!, { menu_icon: e.value });
                      }}
                      className="p-inputtext-sm"
                      style={{ width: '100%', fontSize: 12 }}
                      itemTemplate={(option) => (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <i className={`pi ${option.value}`} style={{ fontSize: 14 }} />
                          <span>{option.label}</span>
                        </div>
                      )}
                    />
                  </div>

                  {/* Role */}
                  <div style={{ marginBottom: 8 }}>
                    <label style={{ fontSize: 10, color: colors.textMuted, display: 'block', marginBottom: 2 }}>
                      {t.formlayoutdesigner_role || 'Role Required'}
                    </label>
                    <Dropdown
                      value={selectedMenuItem.menu_role_required}
                      options={MENU_ROLE_OPTIONS}
                      onChange={(e) => {
                        updateMenuItemProp(selectedMenuNodeId!, { menu_role_required: e.value });
                      }}
                      className="p-inputtext-sm"
                      style={{ width: '100%', fontSize: 12 }}
                      showClear
                    />
                  </div>

                  {/* Menu Action / Window Type */}
                  {selectedMenuItem.schema_table_id && (
                    <div style={{ marginBottom: 8 }}>
                      <label style={{ fontSize: 10, color: colors.textMuted, display: 'block', marginBottom: 2 }}>
                        {t.formlayoutdesigner_menu_action || 'Opens as'}
                      </label>
                      <Dropdown
                        value={selectedMenuItem.menu_action || 'data_table'}
                        options={[
                          { label: t.formlayoutdesigner_menu_action_table || 'Data Table', value: 'data_table' },
                          { label: t.formlayoutdesigner_menu_action_form || 'Create/Edit Form', value: 'create_edit' },
                        ]}
                        onChange={(e) => {
                          updateMenuItemProp(selectedMenuNodeId!, { menu_action: e.value });
                        }}
                        className="p-inputtext-sm"
                        style={{ width: '100%', fontSize: 12 }}
                      />
                    </div>
                  )}

                  {/* Parent menu item */}
                  <div style={{ marginBottom: 8 }}>
                    <label style={{ fontSize: 10, color: colors.textMuted, display: 'block', marginBottom: 2 }}>
                      Parent Item
                    </label>
                    <Dropdown
                      value={selectedMenuItem.parent_placement_id}
                      options={[
                        { label: t.formlayoutdesigner_menu_no_parent || '(Root Level)', value: null },
                        ...menuPlacements
                          .filter(m => `menu-${m.id || m.temp_id}` !== selectedMenuNodeId && m.menu_icon !== 'pi-minus')
                          .map(m => {
                            const ti = m.schema_table_id ? schemaTables.find(tbl => Number(tbl.id) === Number(m.schema_table_id)) : null;
                            const lbl = (m.caption_labels && selectedLanguage && m.caption_labels[selectedLanguage])
                              || m.caption_override
                              || ti?.caption || ti?.singular_name || ti?.table_name
                              || 'Group';
                            return { label: lbl, value: m.id || m.temp_id };
                          }),
                      ]}
                      onChange={(e) => {
                        const parentId = e.value;
                        const parentItem = parentId ? menuPlacements.find(m => (m.id || m.temp_id) === parentId) : null;
                        const newDepth = parentItem ? (parentItem.menu_depth || 0) + 1 : 0;
                        updateMenuItemProp(selectedMenuNodeId!, { parent_placement_id: parentId, menu_depth: newDepth });
                      }}
                      className="p-inputtext-sm"
                      style={{ width: '100%', fontSize: 12 }}
                      showClear
                    />
                  </div>

                  {/* Depth (read-only) */}
                  <div style={{ marginBottom: 8 }}>
                    <label style={{ fontSize: 10, color: colors.textMuted, display: 'block', marginBottom: 2 }}>
                      Depth
                    </label>
                    <InputNumber
                      value={selectedMenuItem.menu_depth || 0}
                      disabled
                      className="p-inputtext-sm"
                      style={{ width: '100%', fontSize: 12 }}
                      inputClassName="p-inputtext-sm"
                    />
                  </div>

                  {/* Visible */}
                  <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Checkbox
                      checked={selectedMenuItem.is_visible}
                      onChange={(e) => {
                        updateMenuItemProp(selectedMenuNodeId!, { is_visible: e.checked || false });
                      }}
                    />
                    <label style={{ fontSize: 11, color: colors.textSecondary }}>
                      {t.formlayoutdesigner_visible || 'Visible'}
                    </label>
                  </div>

                  {/* Position & Size */}
                  <div style={{ fontSize: 10, fontWeight: 600, color: colors.textMuted, marginBottom: 4, textTransform: 'uppercase' }}>
                    {t.formlayoutdesigner_geometry || 'Position & Size'}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, marginBottom: 8 }}>
                    <div>
                      <label style={{ fontSize: 9, color: colors.textMuted }}>X</label>
                      <InputNumber
                        value={liveGeometry?.x ?? selectedMenuItem.x_position}
                        onValueChange={(e) => {
                          updateMenuItemProp(selectedMenuNodeId!, { x_position: e.value || 0 });
                          setLiveGeometry(g => g ? { ...g, x: e.value || 0 } : null);
                          setHasUnsavedChanges(true);
                        }}
                        min={0} step={4}
                        style={{ width: '100%', fontSize: 12 }}
                        inputClassName="p-inputtext-sm"
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 9, color: colors.textMuted }}>Y</label>
                      <InputNumber
                        value={liveGeometry?.y ?? selectedMenuItem.y_position}
                        onValueChange={(e) => {
                          updateMenuItemProp(selectedMenuNodeId!, { y_position: e.value || 0 });
                          setLiveGeometry(g => g ? { ...g, y: e.value || 0 } : null);
                          setHasUnsavedChanges(true);
                        }}
                        min={0} step={4}
                        style={{ width: '100%', fontSize: 12 }}
                        inputClassName="p-inputtext-sm"
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 9, color: colors.textMuted }}>W</label>
                      <InputNumber
                        value={liveGeometry?.w ?? selectedMenuItem.width}
                        onValueChange={(e) => {
                          updateMenuItemProp(selectedMenuNodeId!, { width: e.value || 100 });
                          setLiveGeometry(g => g ? { ...g, w: e.value || 100 } : null);
                          setHasUnsavedChanges(true);
                        }}
                        min={50} step={4}
                        style={{ width: '100%', fontSize: 12 }}
                        inputClassName="p-inputtext-sm"
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 9, color: colors.textMuted }}>H</label>
                      <InputNumber
                        value={liveGeometry?.h ?? selectedMenuItem.height}
                        onValueChange={(e) => {
                          updateMenuItemProp(selectedMenuNodeId!, { height: e.value || 32 });
                          setLiveGeometry(g => g ? { ...g, h: e.value || 32 } : null);
                          setHasUnsavedChanges(true);
                        }}
                        min={20} max={200} step={4}
                        style={{ width: '100%', fontSize: 12 }}
                        inputClassName="p-inputtext-sm"
                      />
                    </div>
                  </div>

                  {/* Tab Order */}
                  <div style={{ marginBottom: 8, maxWidth: 200 }}>
                    <label style={{ fontSize: 10, color: colors.textSecondary, display: 'block', marginBottom: 2 }}>{t.formdesignerpanel_taborder || 'Tab Order'}</label>
                    <InputNumber
                      value={selectedMenuItem.tab_order ?? 0}
                      onValueChange={(e) => {
                        const v = Math.max(-1, Math.min(999999, e.value ?? 0));
                        updateMenuItemProp(selectedMenuNodeId!, { tab_order: v });
                        setHasUnsavedChanges(true);
                      }}
                      min={-1} max={999999} step={1}
                      inputStyle={{ width: '100%', fontSize: 11, padding: '4px 6px' }}
                      className="p-inputtext-sm"
                    />
                  </div>

                  {/* Delete menu item */}
                  <Button
                    label={t.formlayoutdesigner_delete || 'Delete'}
                    icon="pi pi-trash"
                    severity="danger"
                    size="small"
                    outlined
                    onClick={() => {
                      setMenuPlacements(prev => prev.filter(m => `menu-${m.id || m.temp_id}` !== selectedMenuNodeId));
                      setSelectedMenuNodeId(null);
                      setLiveGeometry(null);
                      setHasUnsavedChanges(true);
                    }}
                    style={{ width: '100%', fontSize: 11 }}
                  />
                </>
              )}

              {/* ---- TAB PROPERTIES ---- */}
              {selectedTabId != null && !selectedPlacement && !selectedButton && !selectedMenuItem && (() => {
                const tab = layoutTabs.find((tb) => tb.id === selectedTabId);
                if (!tab) return null;
                return (
                  <>
                    <div style={{
                      padding: '8px 10px', marginBottom: 8,
                      backgroundColor: 'rgba(79,70,229,0.08)',
                      border: '1px solid rgba(79,70,229,0.25)',
                      borderRadius: 4,
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: colors.textPrimary }}>
                        <i className="pi pi-folder" style={{ fontSize: 12 }} />
                        {(tab.tab_labels && selectedLanguage ? tab.tab_labels[selectedLanguage] : null) || tab.tab_label || `Tab ${tab.sort_order + 1}`}
                      </div>
                      <div style={{ fontSize: 9, color: colors.textMuted, marginTop: 2 }}>
                        {t.formlayoutdesigner_tab || 'Tab'} #{tab.sort_order + 1}
                      </div>
                    </div>

                    {/* Default label (fallback when no per-language entry) */}
                    <div style={{ marginBottom: 8 }}>
                      <label style={{ fontSize: 10, color: colors.textMuted, display: 'block', marginBottom: 2 }}>
                        {t.formlayoutdesigner_tab_default_label || 'Default Label'}
                      </label>
                      <InputText
                        value={tab.tab_label || ''}
                        onChange={(e) => handleUpdateTab(tab.id, { tab_label: e.target.value })}
                        className="p-inputtext-sm"
                        style={{ width: '100%', fontSize: 12 }}
                        placeholder={`Tab ${tab.sort_order + 1}`}
                      />
                    </div>

                    {/* Per-language label */}
                    {selectedLanguage && (
                      <div style={{ marginBottom: 8 }}>
                        <label style={{ fontSize: 10, color: colors.textMuted, display: 'block', marginBottom: 2 }}>
                          {t.formlayoutdesigner_caption || 'Caption'} ({selectedLanguage.toUpperCase()})
                        </label>
                        <InputText
                          value={(tab.tab_labels && tab.tab_labels[selectedLanguage]) || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            const nextLabels = { ...(tab.tab_labels || {}) };
                            if (val) nextLabels[selectedLanguage] = val;
                            else delete nextLabels[selectedLanguage];
                            handleUpdateTab(tab.id, {
                              tab_labels: Object.keys(nextLabels).length > 0 ? nextLabels : null,
                            });
                          }}
                          className="p-inputtext-sm"
                          style={{ width: '100%', fontSize: 12 }}
                          placeholder={tab.tab_label || `Tab ${tab.sort_order + 1}`}
                        />
                      </div>
                    )}

                    {/* Delete tab — danger zone, kept at the bottom and full-width
                        so the user has to consciously go past everything else. */}
                    <div style={{ marginTop: 16, paddingTop: 12, borderTop: `1px solid ${colors.borderPrimary}` }}>
                      <Button
                        icon="pi pi-trash"
                        label={t.formlayoutdesigner_delete_tab || 'Delete Tab'}
                        onClick={() => handleDeleteTab(tab.id)}
                        className="p-button-sm p-button-danger p-button-outlined"
                        style={{ width: '100%', fontSize: 11 }}
                      />
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        )}
      </div>

      {/* Live Preview Modal */}
      {currentFormSet && currentWindow && (
        <FormLivePreviewModal
          visible={showLivePreview}
          onHide={() => setShowLivePreview(false)}
          formSet={currentFormSet as any}
          window={currentWindow as any}
          placements={placements as any[]}
          buttons={buttonPlacements as any[]}
          menuItems={menuPlacements as any[]}
          schemaFields={currentFields as any[]}
          selectedLanguage={selectedLanguage}
          enabledLanguages={enabledLanguages}
          layoutTabs={layoutTabs as any[]}
          allTables={tables as any[]}
          tableName={tables.find(t => Number(t.id) === Number(selectedTableId))?.table_name}
          fileKeyName={tables.find(t => Number(t.id) === Number(selectedTableId))?.filekeyname}
          primaryKeyField={tables.find(t => Number(t.id) === Number(selectedTableId))?.primarykeyfield}
          projectId={selectedProject?.id}
          projectDbSettings={selectedProject ? {
            database_type: selectedProject.database_type,
            database_server: selectedProject.database_server,
            database_port: selectedProject.database_port,
            database_name: selectedProject.database_name,
            database_username: selectedProject.database_username,
            database_password: selectedProject.database_password,
          } : undefined}
        />
      )}

      {/* Tab Order Modal */}
      <TabOrderModal
        visible={tabOrderModalVisible}
        elements={tabOrderModalElements}
        onCancel={() => setTabOrderModalVisible(false)}
        onApply={tabOrderApplyFromModal}
      />
    </div>
  );
};

// ========== MAIN EXPORT (with ReactFlowProvider) ==========

const FormLayoutDesignerPanel: React.FC<FormLayoutDesignerPanelProps> = (props) => {
  return (
    <ReactFlowProvider>
      <FormLayoutDesignerInner {...props} />
    </ReactFlowProvider>
  );
};

export default FormLayoutDesignerPanel;
