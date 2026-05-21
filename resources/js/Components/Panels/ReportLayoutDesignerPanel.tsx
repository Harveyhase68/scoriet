// resources/js/Components/Panels/ReportLayoutDesignerPanel.tsx - Report Layout Designer
import React, { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import TableHeaderGridNode, { TableDetailGridNode } from './ReportListGridRenderer';
import ImageUploadSection from './ReportImageUpload';
import type { TableGridNodeData, ColumnInfo } from './ReportListGridRenderer';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Checkbox } from 'primereact/checkbox';
import { Toast } from 'primereact/toast';
import { ProgressSpinner } from 'primereact/progressspinner';
// ColorPicker: using native <input type="color"> (auto-closes, no overlay issues)
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
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useProject } from '@/contexts/ProjectContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation, SupportedLanguage, getStoredLanguage } from '@/i18n';
import ReportLivePreviewModal from './ReportLivePreviewModal';
import { apiClient } from '@/lib/api';

// ========== INTERFACES ==========

interface ReportPattern {
  id: number;
  name: string;
  forms?: ReportPatternForm[];
}

interface ReportPatternForm {
  id: number;
  form_type: 'report_single' | 'report_list';
  paper_size: string;
  paper_orientation: string;
  paper_unit: string;
  paper_width?: number;
  paper_height?: number;
  margin_top: number;
  margin_right: number;
  margin_bottom: number;
  margin_left: number;
  row_height?: number;
  max_columns?: number;
  header_height?: number;
  footer_height?: number;
  list_style_config?: Record<string, unknown>;
  elements?: ReportPatternElement[];
}

interface ReportPatternElement {
  id: number;
  element_type: string;
  x_position: number;
  y_position: number;
  width: number;
  height: number;
  container_columns: number;
  container_gap: number;
  max_fields?: number;
  field_height?: number;
  content?: string;
  font_family?: string;
  font_size?: number;
  font_weight?: string;
  border_width?: number;
  border_color?: string;
  background_color?: string;
  label?: string;
  linked_element_id?: number;
}

interface ReportLayoutElement {
  id?: number;
  report_pattern_form_id: number;
  container_element_id?: number;
  element_type: 'field' | 'static_text' | 'heading' | 'line_horizontal' | 'line_vertical' | 'box' | 'page_number' | 'page_date' | 'page_total' | 'image_placeholder';
  schema_table_id?: number;
  schema_field_id?: number;
  x_position: number;
  y_position: number;
  width: number;
  height: number;
  content?: string;
  font_family: string;
  font_size: number;
  font_weight: string;
  font_style: string;
  text_decoration: string;
  text_align: string;
  text_color: string;
  border_width?: number;
  border_color?: string;
  background_color?: string;
  caption_override?: string;
  caption_labels?: Record<string, string>;
  label_position?: string;
  label_width?: number;
  control_type?: string;
  header_style?: Record<string, unknown>;
  sort_order: number;
  is_visible: boolean;
}

interface SchemaField {
  id: number;
  field_name: string;
  field_type: string;
  is_auto_increment: boolean;
  is_primary_key: boolean;
  link_table?: string;
  link_field?: string;
  link_display_field?: string;
  control_type?: string;
  is_nullable: boolean;
}

interface SchemaTableInfo {
  id: number;
  table_name: string;
  singular_name?: string;
  fields: SchemaField[];
}

interface FloatingSchema {
  id: number;
  name: string;
  latest_version?: { id: number; version_number: number; tables?: SchemaTableInfo[] };
  versions?: Array<{ id: number; version_number: number; tables?: SchemaTableInfo[] }>;
}

// ========== NODE DATA INTERFACES ==========

interface PaperNodeData {
  label: string;
  paperWidth: number;
  paperHeight: number;
  paperUnit: string;
  marginTop: number;
  marginRight: number;
  marginBottom: number;
  marginLeft: number;
  showRuler: boolean;
  headerHeight: number;
  footerHeight: number;
  [key: string]: unknown;
}

interface ContainerRefNodeData {
  label: string;
  elementType: string;
  columns: number;
  gap: number;
  maxFields?: number;
  [key: string]: unknown;
}

interface LayoutElementNodeData {
  element: ReportLayoutElement;
  elementType: string;
  displayText: string;
  fieldName?: string;
  fieldType?: string;
  isVisible: boolean;
  [key: string]: unknown;
}

// ========== CONSTANTS ==========

const MM_TO_PX = 96 / 25.4;
const INCH_TO_PX = 96;

const unitToPx = (val: number, unit: string): number =>
  unit === 'inch' ? val * INCH_TO_PX : val * MM_TO_PX;

const pxToUnit = (val: number, unit: string): number =>
  unit === 'inch' ? val / INCH_TO_PX : val / MM_TO_PX;

const PAPER_SIZES: Record<string, { width: number; height: number }> = {
  A4: { width: 210, height: 297 },
  A3: { width: 297, height: 420 },
  A5: { width: 148, height: 210 },
  Letter: { width: 215.9, height: 279.4 },
  Legal: { width: 215.9, height: 355.6 },
};

const REPORT_CONTROLS = [
  { type: 'static_text' as const, icon: 'pi-align-left', label: 'Static Text', category: 'text', defaultWidth: 80, defaultHeight: 5 },
  { type: 'heading' as const, icon: 'pi-header', label: 'Heading', category: 'text', defaultWidth: 100, defaultHeight: 7 },
  { type: 'line_horizontal' as const, icon: 'pi-minus', label: 'Horiz. Line', category: 'layout', defaultWidth: 100, defaultHeight: 0.5 },
  { type: 'line_vertical' as const, icon: 'pi-ellipsis-v', label: 'Vert. Line', category: 'layout', defaultWidth: 0.5, defaultHeight: 50 },
  { type: 'box' as const, icon: 'pi-stop', label: 'Box / Frame', category: 'layout', defaultWidth: 80, defaultHeight: 40 },
  { type: 'page_number' as const, icon: 'pi-hashtag', label: 'Page Number', category: 'placeholders', defaultWidth: 20, defaultHeight: 5 },
  { type: 'page_date' as const, icon: 'pi-calendar', label: 'Print Date', category: 'placeholders', defaultWidth: 30, defaultHeight: 5 },
  { type: 'page_total' as const, icon: 'pi-sort-numeric-up', label: 'Total Pages', category: 'placeholders', defaultWidth: 20, defaultHeight: 5 },
  { type: 'image_placeholder' as const, icon: 'pi-image', label: 'Image / Logo', category: 'media', defaultWidth: 40, defaultHeight: 20 },
];

const FONT_FAMILY_OPTIONS = [
  { label: 'Arial', value: 'Arial' },
  { label: 'Helvetica', value: 'Helvetica' },
  { label: 'Times New Roman', value: 'Times New Roman' },
  { label: 'Courier New', value: 'Courier New' },
  { label: 'Georgia', value: 'Georgia' },
  { label: 'Verdana', value: 'Verdana' },
  { label: 'Tahoma', value: 'Tahoma' },
];

const FONT_WEIGHT_OPTIONS = [
  { label: 'Normal', value: 'normal' },
  { label: 'Bold', value: 'bold' },
];

const FONT_STYLE_OPTIONS = [
  { label: 'Normal', value: 'normal' },
  { label: 'Italic', value: 'italic' },
];

const TEXT_DECORATION_OPTIONS = [
  { label: 'None', value: 'none' },
  { label: 'Underline', value: 'underline' },
  { label: 'Line-through', value: 'line-through' },
];

const TEXT_ALIGN_OPTIONS = [
  { label: 'Left', value: 'left' },
  { label: 'Center', value: 'center' },
  { label: 'Right', value: 'right' },
];

const FORM_TYPE_OPTIONS = [
  { label: 'Report Single', value: 'report_single' },
  { label: 'Report List', value: 'report_list' },
];

// ========== HELPERS ==========

const getFieldColorBar = (fieldType: string, isPrimaryKey?: boolean): string => {
  const lower = fieldType.toLowerCase();
  if (isPrimaryKey) return '#ef4444';
  if (lower.includes('int') || lower.includes('decimal') || lower.includes('float') || lower.includes('double') || lower.includes('numeric')) return '#22c55e';
  if (lower.includes('bool') || lower.includes('tinyint')) return '#f97316';
  if (lower.includes('date') || lower.includes('time') || lower.includes('timestamp')) return '#a855f7';
  return '#3b82f6';
};

const formatFieldName = (name: string): string => {
  return name.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
};

const createDefaultElement = (
  formId: number,
  elementType: ReportLayoutElement['element_type'],
  x: number,
  y: number,
  width: number,
  height: number,
  sortOrder: number,
): ReportLayoutElement => ({
  report_pattern_form_id: formId,
  element_type: elementType,
  x_position: x,
  y_position: y,
  width,
  height,
  content: elementType === 'static_text' ? 'Text here...'
    : elementType === 'heading' ? 'Heading'
    : elementType === 'page_number' ? 'Page {n}'
    : elementType === 'page_date' ? '{date}'
    : elementType === 'page_total' ? '{pages}'
    : undefined,
  font_family: 'Arial',
  font_size: elementType === 'heading' ? 14 : 10,
  font_weight: elementType === 'heading' ? 'bold' : 'normal',
  font_style: 'normal',
  text_decoration: 'none',
  text_align: 'left',
  text_color: '#000000',
  border_width: (elementType === 'line_horizontal' || elementType === 'line_vertical' || elementType === 'box') ? 1 : undefined,
  border_color: (elementType === 'line_horizontal' || elementType === 'line_vertical' || elementType === 'box') ? '#000000' : undefined,
  background_color: undefined,
  sort_order: sortOrder,
  is_visible: true,
});

// ========== CUSTOM NODES ==========

const PaperNode = ({ data }: { data: PaperNodeData }) => {
  const unit = data.paperUnit || 'mm';
  const pxPerUnit = unit === 'inch' ? INCH_TO_PX : MM_TO_PX;
  const mTop = data.marginTop * pxPerUnit;
  const mRight = data.marginRight * pxPerUnit;
  const mBottom = data.marginBottom * pxPerUnit;
  const mLeft = data.marginLeft * pxPerUnit;
  const headerH = (data.headerHeight || 0) * pxPerUnit;
  const footerH = (data.footerHeight || 0) * pxPerUnit;

  // Ruler tick generation: major (number) every 10mm/1in, medium every 5mm/0.5in, minor every 1mm/0.1in
  const majorStep = unit === 'inch' ? 1 : 10;
  const mediumStep = unit === 'inch' ? 0.5 : 5;
  const minorStep = unit === 'inch' ? 0.125 : 1;

  const buildTicks = (maxPx: number) => {
    const maxUnits = maxPx / pxPerUnit;
    const ticks: Array<{ pos: number; unitVal: number; type: 'major' | 'medium' | 'minor' }> = [];
    for (let u = 0; u <= maxUnits; u += minorStep) {
      const rounded = Math.round(u * 1000) / 1000;
      const isMajor = Math.abs(rounded % majorStep) < 0.001 || Math.abs(rounded % majorStep - majorStep) < 0.001;
      const isMedium = !isMajor && (Math.abs(rounded % mediumStep) < 0.001 || Math.abs(rounded % mediumStep - mediumStep) < 0.001);
      ticks.push({ pos: rounded * pxPerUnit, unitVal: rounded, type: isMajor ? 'major' : isMedium ? 'medium' : 'minor' });
    }
    return ticks;
  };

  const hTicks = data.showRuler ? buildTicks(data.paperWidth) : [];
  const vTicks = data.showRuler ? buildTicks(data.paperHeight) : [];

  return (
    <div style={{ position: 'relative', pointerEvents: 'none' }}>
      {/* Horizontal ruler */}
      {data.showRuler && (
        <div style={{
          position: 'absolute', top: -20, left: 0,
          width: data.paperWidth, height: 18,
          backgroundColor: 'rgba(30,40,60,0.85)', borderRadius: '4px 4px 0 0',
          overflow: 'hidden',
        }}>
          {hTicks.map(tick => (
            <div key={`rh-${tick.unitVal}`} style={{
              position: 'absolute', left: tick.pos, bottom: 0,
            }}>
              <div style={{
                width: 1,
                height: tick.type === 'major' ? 10 : tick.type === 'medium' ? 6 : 3,
                backgroundColor: tick.type === 'major' ? '#d1d5db' : tick.type === 'medium' ? '#9ca3af' : '#6b7280',
              }} />
              {tick.type === 'major' && (
                <span style={{
                  position: 'absolute', bottom: 10, left: 2,
                  fontSize: 8, color: '#d1d5db', whiteSpace: 'nowrap', lineHeight: 1,
                }}>
                  {unit === 'inch' ? tick.unitVal : Math.round(tick.unitVal)}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Vertical ruler */}
      {data.showRuler && (
        <div style={{
          position: 'absolute', top: 0, left: -22,
          width: 20, height: data.paperHeight,
          backgroundColor: 'rgba(30,40,60,0.85)', borderRadius: '4px 0 0 4px',
          overflow: 'hidden',
        }}>
          {vTicks.map(tick => (
            <div key={`rv-${tick.unitVal}`} style={{
              position: 'absolute', top: tick.pos, right: 0,
            }}>
              <div style={{
                height: 1,
                width: tick.type === 'major' ? 10 : tick.type === 'medium' ? 6 : 3,
                backgroundColor: tick.type === 'major' ? '#d1d5db' : tick.type === 'medium' ? '#9ca3af' : '#6b7280',
              }} />
              {tick.type === 'major' && (
                <span style={{
                  position: 'absolute', right: 12, top: -4,
                  fontSize: 8, color: '#d1d5db', whiteSpace: 'nowrap', lineHeight: 1,
                }}>
                  {unit === 'inch' ? tick.unitVal : Math.round(tick.unitVal)}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Paper */}
      <div style={{
        width: data.paperWidth,
        height: data.paperHeight,
        backgroundColor: '#ffffff',
        border: '1px solid #d1d5db',
        boxShadow: '4px 4px 12px rgba(0,0,0,0.3)',
        position: 'relative',
      }}>
        {/* Margin guides */}
        <div style={{
          position: 'absolute',
          top: mTop, left: mLeft,
          right: mRight, bottom: mBottom,
          border: '1px dashed rgba(59,130,246,0.3)',
          pointerEvents: 'none',
        }} />

        {/* Header zone */}
        {headerH > 0 && (
          <div style={{
            position: 'absolute',
            top: mTop, left: mLeft,
            right: mRight, height: headerH,
            borderBottom: '1px dashed rgba(34,197,94,0.4)',
            pointerEvents: 'none',
          }}>
            <span style={{
              position: 'absolute', top: 2, left: 4,
              fontSize: 8, color: 'rgba(34,197,94,0.6)',
            }}>Header</span>
          </div>
        )}

        {/* Footer zone */}
        {footerH > 0 && (
          <div style={{
            position: 'absolute',
            bottom: mBottom, left: mLeft,
            right: mRight, height: footerH,
            borderTop: '1px dashed rgba(239,68,68,0.4)',
            pointerEvents: 'none',
          }}>
            <span style={{
              position: 'absolute', bottom: 2, left: 4,
              fontSize: 8, color: 'rgba(239,68,68,0.6)',
            }}>Footer</span>
          </div>
        )}

        {/* Paper size label */}
        <div style={{
          position: 'absolute', bottom: 4, right: 8,
          fontSize: 9, color: '#9ca3af',
        }}>
          {data.label}
        </div>
      </div>
    </div>
  );
};

const ContainerRefNode = ({ data }: { data: ContainerRefNodeData }) => {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        border: '2px dashed rgba(156,163,175,0.5)',
        borderRadius: 4,
        backgroundColor: 'transparent',
        overflow: 'visible',
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          position: 'absolute', top: -16, left: 4,
          fontSize: 9, color: '#9ca3af',
          backgroundColor: 'rgba(30,30,46,0.7)',
          padding: '1px 6px', borderRadius: 3,
          display: 'flex', alignItems: 'center', gap: 4,
        }}
      >
        <span>{data.label}</span>
        {data.columns > 1 && (
          <span style={{
            fontSize: 8, backgroundColor: 'rgba(59,130,246,0.3)',
            color: '#93c5fd', padding: '0px 4px', borderRadius: 2,
          }}>
            {data.columns} col
          </span>
        )}
        {data.maxFields != null && data.maxFields > 0 && (
          <span style={{
            fontSize: 8, backgroundColor: 'rgba(249,115,22,0.3)',
            color: '#fdba74', padding: '0px 4px', borderRadius: 2,
          }}>
            max: {data.maxFields}
          </span>
        )}
      </div>
    </div>
  );
};

const LayoutElementNode = ({ data, selected }: { data: LayoutElementNodeData; selected?: boolean }) => {
  const el = data.element;
  const opacity = data.isVisible ? 1 : 0.4;
  const elType = data.elementType;

  const fontStyle: React.CSSProperties = {
    fontFamily: el.font_family || 'Arial',
    fontSize: el.font_size || 10,
    fontWeight: el.font_weight as any || 'normal',
    fontStyle: el.font_style as any || 'normal',
    textDecoration: el.text_decoration || 'none',
    color: el.text_color || '#000000',
  };

  const textAlignStyle = (el.text_align || 'left') as 'left' | 'center' | 'right';
  const justifyContent = textAlignStyle === 'center' ? 'center' : textAlignStyle === 'right' ? 'flex-end' : 'flex-start';

  // Field element
  if (elType === 'field') {
    return (
      <div style={{ width: '100%', height: '100%', position: 'relative', opacity }}>
        {selected && (
          <NodeResizer color="#3b82f6" isVisible={selected} minWidth={20} minHeight={4}
            handleStyle={{ width: 7, height: 7, borderRadius: 2 }} lineStyle={{ borderWidth: 1.5 }} />
        )}
        <div style={{
          width: '100%', height: '100%', padding: '1px 4px',
          display: 'flex', alignItems: 'center', justifyContent,
          backgroundColor: el.background_color || 'transparent',
          border: selected ? '1px solid #3b82f6' : '1px dashed rgba(59,130,246,0.25)',
          borderRadius: 2,
          ...fontStyle,
        }}>
          {/* Color bar */}
          <div style={{
            position: 'absolute', left: 0, top: 0, bottom: 0, width: 3,
            backgroundColor: getFieldColorBar(data.fieldType || '', false),
            borderRadius: '2px 0 0 2px',
          }} />
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingLeft: 4 }}>
            {data.displayText}
          </span>
        </div>
        <span style={{
          position: 'absolute', top: -12, right: 2,
          fontSize: 7, backgroundColor: 'rgba(59,130,246,0.15)', color: '#93c5fd',
          padding: '0px 3px', borderRadius: 2,
        }}>
          {data.fieldName}
        </span>
      </div>
    );
  }

  // Static text
  if (elType === 'static_text') {
    return (
      <div style={{ width: '100%', height: '100%', position: 'relative', opacity }}>
        {selected && (
          <NodeResizer color="#3b82f6" isVisible={selected} minWidth={20} minHeight={4}
            handleStyle={{ width: 7, height: 7, borderRadius: 2 }} lineStyle={{ borderWidth: 1.5 }} />
        )}
        <div style={{
          width: '100%', height: '100%', padding: '1px 4px',
          display: 'flex', alignItems: 'center', justifyContent,
          backgroundColor: el.background_color || 'transparent',
          border: selected ? '1px solid #3b82f6' : 'none',
          ...fontStyle,
        }}>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {data.displayText || 'Static Text'}
          </span>
        </div>
      </div>
    );
  }

  // Heading
  if (elType === 'heading') {
    return (
      <div style={{ width: '100%', height: '100%', position: 'relative', opacity }}>
        {selected && (
          <NodeResizer color="#3b82f6" isVisible={selected} minWidth={20} minHeight={4}
            handleStyle={{ width: 7, height: 7, borderRadius: 2 }} lineStyle={{ borderWidth: 1.5 }} />
        )}
        <div style={{
          width: '100%', height: '100%', padding: '1px 4px',
          display: 'flex', alignItems: 'center', justifyContent,
          backgroundColor: el.background_color || 'transparent',
          border: selected ? '1px solid #3b82f6' : 'none',
          borderBottom: '1px solid rgba(0,0,0,0.15)',
          ...fontStyle,
        }}>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {data.displayText || 'Heading'}
          </span>
        </div>
      </div>
    );
  }

  // Horizontal line
  if (elType === 'line_horizontal') {
    return (
      <div style={{ width: '100%', height: '100%', position: 'relative', opacity, display: 'flex', alignItems: 'center' }}>
        {selected && (
          <NodeResizer color="#3b82f6" isVisible={selected} minWidth={10} minHeight={2}
            handleStyle={{ width: 7, height: 7, borderRadius: 2 }} lineStyle={{ borderWidth: 1.5 }} />
        )}
        <div style={{
          width: '100%',
          height: Math.max(1, el.border_width || 1),
          backgroundColor: el.border_color || '#000000',
        }} />
      </div>
    );
  }

  // Vertical line
  if (elType === 'line_vertical') {
    return (
      <div style={{ width: '100%', height: '100%', position: 'relative', opacity, display: 'flex', justifyContent: 'center' }}>
        {selected && (
          <NodeResizer color="#3b82f6" isVisible={selected} minWidth={2} minHeight={10}
            handleStyle={{ width: 7, height: 7, borderRadius: 2 }} lineStyle={{ borderWidth: 1.5 }} />
        )}
        <div style={{
          width: Math.max(1, el.border_width || 1),
          height: '100%',
          backgroundColor: el.border_color || '#000000',
        }} />
      </div>
    );
  }

  // Box / Frame
  if (elType === 'box') {
    return (
      <div style={{ width: '100%', height: '100%', position: 'relative', opacity }}>
        {selected && (
          <NodeResizer color="#3b82f6" isVisible={selected} minWidth={10} minHeight={10}
            handleStyle={{ width: 7, height: 7, borderRadius: 2 }} lineStyle={{ borderWidth: 1.5 }} />
        )}
        <div style={{
          width: '100%', height: '100%',
          border: `${el.border_width || 1}px solid ${el.border_color || '#000000'}`,
          borderRadius: 2,
          backgroundColor: el.background_color || 'transparent',
        }} />
      </div>
    );
  }

  // Page number
  if (elType === 'page_number') {
    return (
      <div style={{ width: '100%', height: '100%', position: 'relative', opacity }}>
        {selected && (
          <NodeResizer color="#3b82f6" isVisible={selected} minWidth={10} minHeight={4}
            handleStyle={{ width: 7, height: 7, borderRadius: 2 }} lineStyle={{ borderWidth: 1.5 }} />
        )}
        <div style={{
          width: '100%', height: '100%', padding: '1px 4px',
          display: 'flex', alignItems: 'center', justifyContent,
          border: '1px dashed rgba(168,85,247,0.3)', borderRadius: 3,
          backgroundColor: el.background_color || 'transparent',
          ...fontStyle, color: el.text_color || '#666666',
        }}>
          <i className="pi pi-hashtag" style={{ fontSize: 9, marginRight: 3, color: '#a855f7' }} />
          {data.displayText || 'Page {n}'}
        </div>
      </div>
    );
  }

  // Print date
  if (elType === 'page_date') {
    return (
      <div style={{ width: '100%', height: '100%', position: 'relative', opacity }}>
        {selected && (
          <NodeResizer color="#3b82f6" isVisible={selected} minWidth={10} minHeight={4}
            handleStyle={{ width: 7, height: 7, borderRadius: 2 }} lineStyle={{ borderWidth: 1.5 }} />
        )}
        <div style={{
          width: '100%', height: '100%', padding: '1px 4px',
          display: 'flex', alignItems: 'center', justifyContent,
          border: '1px dashed rgba(168,85,247,0.3)', borderRadius: 3,
          backgroundColor: el.background_color || 'transparent',
          ...fontStyle, color: el.text_color || '#666666',
        }}>
          <i className="pi pi-calendar" style={{ fontSize: 9, marginRight: 3, color: '#a855f7' }} />
          {data.displayText || '{date}'}
        </div>
      </div>
    );
  }

  // Total pages
  if (elType === 'page_total') {
    return (
      <div style={{ width: '100%', height: '100%', position: 'relative', opacity }}>
        {selected && (
          <NodeResizer color="#3b82f6" isVisible={selected} minWidth={10} minHeight={4}
            handleStyle={{ width: 7, height: 7, borderRadius: 2 }} lineStyle={{ borderWidth: 1.5 }} />
        )}
        <div style={{
          width: '100%', height: '100%', padding: '1px 4px',
          display: 'flex', alignItems: 'center', justifyContent,
          border: '1px dashed rgba(168,85,247,0.3)', borderRadius: 3,
          backgroundColor: el.background_color || 'transparent',
          ...fontStyle, color: el.text_color || '#666666',
        }}>
          <i className="pi pi-sort-numeric-up" style={{ fontSize: 9, marginRight: 3, color: '#a855f7' }} />
          {data.displayText || '{pages}'}
        </div>
      </div>
    );
  }

  // Image placeholder
  if (elType === 'image_placeholder') {
    // Try to resolve image URL from content JSON ({"all": 5, "de": 7})
    let imageUrl: string | null = null;
    try {
      if (el.content) {
        const imgIds = JSON.parse(el.content);
        const imgId = imgIds[data.fieldName || 'all'] || imgIds['all']; // fieldName carries selectedLanguage
        if (imgId) imageUrl = `/api/report-images/${imgId}/data`;
      }
    } catch { /* not JSON */ }

    return (
      <div style={{ width: '100%', height: '100%', position: 'relative', opacity }}>
        {selected && (
          <NodeResizer color="#3b82f6" isVisible={selected} minWidth={20} minHeight={15}
            handleStyle={{ width: 7, height: 7, borderRadius: 2 }} lineStyle={{ borderWidth: 1.5 }} />
        )}
        {imageUrl ? (
          <img src={imageUrl} alt="Image" style={{
            width: '100%', height: '100%', objectFit: 'contain',
            border: selected ? '1px solid #3b82f6' : '1px dashed rgba(168,85,247,0.2)',
            borderRadius: 4,
          }} />
        ) : (
          <div style={{
            width: '100%', height: '100%',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column',
            border: '2px dashed rgba(168,85,247,0.3)', borderRadius: 4,
            backgroundColor: el.background_color || 'transparent',
            color: '#a855f7', gap: 2,
          }}>
            <i className="pi pi-image" style={{ fontSize: 16, opacity: 0.5 }} />
            <span style={{ fontSize: 8 }}>Image / Logo</span>
          </div>
        )}
      </div>
    );
  }

  // Fallback
  return (
    <div style={{ width: '100%', height: '100%', border: '1px dashed #ccc', opacity }}>
      {selected && <NodeResizer color="#3b82f6" isVisible={selected} minWidth={10} minHeight={10} />}
      <span style={{ fontSize: 9, color: '#999', padding: 4 }}>{elType}</span>
    </div>
  );
};

// Collapsible section
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

// Field type icon
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

// Node types registry
const nodeTypes = {
  paperNode: PaperNode,
  containerRef: ContainerRefNode,
  layoutElement: LayoutElementNode,
  tableHeaderGrid: TableHeaderGridNode,
  tableDetailGrid: TableDetailGridNode,
};

// ========== PROPS ==========

interface ReportLayoutDesignerPanelProps {
  reportPatternId?: number;
  formType?: string;
  language?: string;
  onOpenPanel?: (panelId: string, data?: Record<string, unknown>) => void;
}

// ========== INNER COMPONENT ==========

const ReportLayoutDesignerInner: React.FC<ReportLayoutDesignerPanelProps> = ({ reportPatternId: propPatternId, formType: propFormType, language: propLanguage, onOpenPanel: _onOpenPanel }) => {

  // Read pre-selection from localStorage (set by Pattern Designer "Open Layout Designer" button)
  const preselect = useMemo(() => {
    try {
      const raw = localStorage.getItem('report_layout_preselect');
      if (raw) {
        const data = JSON.parse(raw);
        // Only use if fresh (within 5 seconds)
        if (data.timestamp && Date.now() - data.timestamp < 5000) {
          localStorage.removeItem('report_layout_preselect');
          return data as { patternId?: number; formType?: string; language?: string };
        }
        localStorage.removeItem('report_layout_preselect');
      }
    } catch { /* ignore */ }
    return null;
  }, []);

  const initialPatternId = preselect?.patternId || propPatternId || null;
  const initialFormType = preselect?.formType || propFormType || null;
  const initialLanguage = preselect?.language || propLanguage || null;
  const [currentLanguage] = useState<SupportedLanguage>(getStoredLanguage());
  const { t } = useTranslation(currentLanguage);
  const { colors } = useTheme();
  const { selectedProject } = useProject();
  const toast = useRef<Toast>(null);
  const reactFlowInstance = useReactFlow();

  // ---- Toolbar state ----
  const [patterns, setPatterns] = useState<ReportPattern[]>([]);
  const [selectedPatternId, setSelectedPatternId] = useState<number | null>(initialPatternId || null);
  const [selectedFormType, setSelectedFormType] = useState<string | null>(initialFormType || null);
  const [schemas, setSchemas] = useState<FloatingSchema[]>([]);
  const [selectedSchemaId, setSelectedSchemaId] = useState<number | null>(null);
  const [tables, setTables] = useState<SchemaTableInfo[]>([]);
  const [selectedTableId, setSelectedTableId] = useState<number | null>(null);

  // ---- Data state ----
  const [currentPattern, setCurrentPattern] = useState<ReportPattern | null>(null);
  const [currentForm, setCurrentForm] = useState<ReportPatternForm | null>(null);
  const [currentFields, setCurrentFields] = useState<SchemaField[]>([]);
  const [layoutElements, setLayoutElements] = useState<ReportLayoutElement[]>([]);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);

  // Live geometry tracking for properties panel
  const [liveGeometry, setLiveGeometry] = useState<{ x: number; y: number; w: number; h: number } | null>(null);

  // ---- UI state ----
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showRuler, setShowRuler] = useState(true);
  const [showLivePreview, setShowLivePreview] = useState(false);
  const [snapToGrid, setSnapToGrid] = useState(selectedProject?.report_designer_snap_to_grid ?? true);
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(initialLanguage || null);
  const [columnSelectionMode, setColumnSelectionMode] = useState<'header' | 'detail'>('detail');
  const projectGridUnit = (selectedProject?.report_designer_grid_unit as string) || 'mm';
  const projectGridSize = Number(selectedProject?.report_designer_grid_size) || 5;

  // Stash interaction
  const [hoveredStashId, setHoveredStashId] = useState<string | null>(null);
  const [pressedStashId, setPressedStashId] = useState<string | null>(null);
  const dragImageRef = useRef<HTMLDivElement | null>(null);

  // ---- ReactFlow state ----
  const [nodes, setNodes, onNodesChange] = useNodesState([] as Node[]);
  const [edges, , onEdgesChange] = useEdgesState([] as Edge[]);

  // ---- Refs for live position tracking ----
  const layoutElementsRef = useRef<ReportLayoutElement[]>(layoutElements);
  // Counter to trigger rebuild when elements are loaded/set from external sources
  const [_elementsVersion, setElementsVersion] = useState(0);
  useEffect(() => { layoutElementsRef.current = layoutElements; setElementsVersion(v => v + 1); }, [layoutElements]);

  // ---- Derived data ----
  const placedFieldIds = useMemo(() => {
    return new Set(layoutElements.filter(el => el.element_type === 'field' && el.schema_field_id).map(el => el.schema_field_id));
  }, [layoutElements]);

  const selectedElement = useMemo(() => {
    if (selectedElementId == null) return null;
    return layoutElements.find(el => {
      const key = el.id || `new-${el.sort_order}`;
      return String(key) === selectedElementId;
    }) || null;
  }, [layoutElements, selectedElementId]);

  const paperUnit = currentForm?.paper_unit || 'mm';

  // Compute paper dimensions in pixels
  const paperDimsPx = useMemo(() => {
    if (!currentForm) return { width: 0, height: 0 };
    let wMm: number;
    let hMm: number;
    if (currentForm.paper_width && currentForm.paper_height) {
      wMm = currentForm.paper_unit === 'inch' ? currentForm.paper_width * 25.4 : currentForm.paper_width;
      hMm = currentForm.paper_unit === 'inch' ? currentForm.paper_height * 25.4 : currentForm.paper_height;
    } else {
      const size = PAPER_SIZES[currentForm.paper_size] || PAPER_SIZES.A4;
      wMm = size.width;
      hMm = size.height;
    }
    if (currentForm.paper_orientation === 'landscape') {
      const tmp = wMm;
      wMm = hMm;
      hMm = tmp;
    }
    return { width: wMm * MM_TO_PX, height: hMm * MM_TO_PX };
  }, [currentForm]);

  const enabledLanguages = useMemo(() => {
    if (!selectedProject?.enabled_languages) return [];
    return selectedProject.enabled_languages.map((code: string) => ({ label: code.toUpperCase(), value: code }));
  }, [selectedProject]);

  // Auto-select first language
  useEffect(() => {
    if (enabledLanguages.length > 0 && selectedLanguage == null) {
      setSelectedLanguage(enabledLanguages[0].value);
    }
  }, [enabledLanguages, selectedLanguage]);

  // Load project translations (date/time formats per language) for report preview
  const [projectDateFormats, setProjectDateFormats] = useState<Record<string, { date_format: string; time_format: string }>>({});
  useEffect(() => {
    if (!selectedProject?.id) return;
    apiClient.get(`/projects/${selectedProject.id}/translations`)
      .then((data: any) => {
        if (!data) return;
        const fmts: Record<string, { date_format: string; time_format: string }> = {};
        if (Array.isArray(data)) {
          for (const t of data) {
            if (t.language_code) fmts[t.language_code] = { date_format: t.date_format || 'd.m.Y', time_format: t.time_format || 'H:i' };
          }
        } else if (typeof data === 'object') {
          for (const [key, val] of Object.entries(data)) {
            const t = val as Record<string, string>;
            if (t.date_format || t.time_format) fmts[key] = { date_format: t.date_format || 'd.m.Y', time_format: t.time_format || 'H:i' };
          }
        }
        setProjectDateFormats(fmts);
      })
      .catch(() => {});
  }, [selectedProject?.id]);

  // ========== LOAD PATTERNS ==========

  const loadPatterns = useCallback(async () => {
    try {
      const data = await apiClient.get('/report-patterns?own_only=true');
      const list = Array.isArray(data) ? data : (data.data || []);
      setPatterns(list);
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
      const versionsData = await apiClient.get(`/floating-schemas/${schemaId}/versions`);
      const versions = Array.isArray(versionsData) ? versionsData : (versionsData.data || versionsData.versions || []);
      if (versions.length === 0) {
        setTables([]);
        return;
      }
      const latestVersion = versions.reduce(
        (a: { id: number; version_number: number }, b: { id: number; version_number: number }) =>
          Number(a.version_number) > Number(b.version_number) ? a : b,
        versions[0],
      );
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

  // ========== LOAD LAYOUT ELEMENTS ==========

  const loadLayoutElements = useCallback(async (formId: number, tableId: number) => {
    try {
      const data = await apiClient.get(`/report-layout/${formId}/elements?table_id=${tableId}`);
      setLayoutElements(Array.isArray(data) ? data : (data.data || []));
    } catch {
      setLayoutElements([]);
    }
  }, []);

  // ========== INITIAL LOADS ==========

  useEffect(() => {
    loadPatterns();
  }, [loadPatterns]);

  // When a pattern is preselected (via prop or localStorage), fetch its
  // details so we can (a) show it in the dropdown even if it isn't part of
  // the own-only list, and (b) default the form-type to the first available
  // form of that pattern. We keep the loaded pattern in its own piece of
  // state because `loadPatterns` later calls `setPatterns(list)` and would
  // otherwise overwrite an entry we had injected directly — that race was
  // the reason the ReportSet combobox came up empty when arriving from the
  // Report Management "Open in Layout Designer" button.
  const [pinnedPattern, setPinnedPattern] = useState<ReportPattern | null>(null);

  useEffect(() => {
    if (!selectedPatternId) {
      setPinnedPattern(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const json = await apiClient.get(`/report-patterns/${selectedPatternId}`);
        const pattern: ReportPattern = json.data || json;
        if (cancelled || !pattern?.id) return;
        setPinnedPattern(pattern);
        // Default form type to the first form if none was provided.
        const forms = (pattern.forms || []) as ReportPatternForm[];
        if (forms.length > 0 && forms[0].form_type) {
          setSelectedFormType(prev => prev ?? forms[0].form_type);
        }
      } catch { /* ignore */ }
    })();
    return () => { cancelled = true; };
  }, [selectedPatternId]);

  // Merge the pinned (preselected) pattern into the dropdown options so the
  // value stays resolvable no matter when `loadPatterns` finishes.
  const patternOptions = useMemo(() => {
    const opts = patterns.map(p => ({ label: p.name, value: p.id }));
    if (pinnedPattern && !opts.some(o => Number(o.value) === Number(pinnedPattern.id))) {
      opts.push({ label: pinnedPattern.name, value: pinnedPattern.id });
    }
    return opts;
  }, [patterns, pinnedPattern]);

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

  // ========== LOAD LAYOUT (main Load button) ==========

  const handleLoad = useCallback(async () => {
    if (selectedPatternId == null || selectedFormType == null || selectedTableId == null) {
      toast.current?.show({ severity: 'warn', summary: t.formlayoutdesigner_warning || 'Warning', detail: 'Please select a pattern, form type, and table.', life: 3000 });
      return;
    }

    if (hasUnsavedChanges) {
      const confirmed = window.confirm('You have unsaved changes. Do you want to discard them and load a new layout?');
      if (!confirmed) return;
    }

    setLoading(true);
    setSelectedElementId(null);
    setLiveGeometry(null);
    setHasUnsavedChanges(false);

    try {
      // Load the full pattern with forms and elements
      let patData: any;
      try {
        patData = await apiClient.get(`/report-patterns/${selectedPatternId}`);
      } catch {
        throw new Error('Failed to load report pattern');
      }
      const pattern: ReportPattern = patData.data || patData;
      setCurrentPattern(pattern);

      // Find matching form
      const forms = pattern.forms || [];
      const matchingForm = forms.find(f => f.form_type === selectedFormType);
      if (!matchingForm) {
        toast.current?.show({ severity: 'info', summary: 'Info', detail: 'No form found for this type.', life: 3000 });
        setCurrentForm(null);
        setLayoutElements([]);
        setNodes([]);
        setLoading(false);
        return;
      }
      setCurrentForm(matchingForm);

      // Load fields for selected table
      const selectedTable = tables.find(tbl => Number(tbl.id) === Number(selectedTableId));
      setCurrentFields(selectedTable?.fields || []);

      // Copy pattern controls as editable layout elements (if not yet copied)
      try {
        await apiClient.post(`/report-layout/${matchingForm.id}/copy-pattern-controls`);
      } catch {
        // Non-critical — continue loading
      }

      // Load existing layout elements (now includes copied pattern controls)
      await loadLayoutElements(matchingForm.id, Number(selectedTableId));
    } catch (err) {
      toast.current?.show({ severity: 'error', summary: 'Error', detail: String(err), life: 4000 });
    } finally {
      setLoading(false);
    }
  }, [selectedPatternId, selectedFormType, selectedTableId, tables, loadLayoutElements, hasUnsavedChanges, t, setNodes]);

  // ========== LIST MODE: Column select & resize callbacks ==========

  const handleColumnSelect = useCallback((key: string | null, mode: 'header' | 'detail' = 'detail') => {
    setSelectedElementId(key);
    setColumnSelectionMode(mode);
    if (key) {
      const el = layoutElementsRef.current.find(e => String(e.id || `new-${e.sort_order}`) === key);
      if (el) setLiveGeometry({ x: el.x_position, y: el.y_position, w: el.width, h: el.height });
    } else {
      setLiveGeometry(null);
    }
  }, []);

  // Called when column resize finishes (from TableGridNode)
  const handleColumnResized = useCallback((colKey: string, newWidth: number) => {
    layoutElementsRef.current = layoutElementsRef.current.map(el => {
      if (String(el.id || `new-${el.sort_order}`) === colKey) return { ...el, width: newWidth };
      return el;
    });
    let xOff = 0;
    layoutElementsRef.current = layoutElementsRef.current.map(el => {
      if (el.element_type === 'field') {
        const updated = { ...el, x_position: Math.round(xOff * 100) / 100 };
        xOff += el.width;
        return updated;
      }
      return el;
    });
    setLayoutElements([...layoutElementsRef.current]);
    setHasUnsavedChanges(true);
  }, []);

  // Called when columns are reordered via drag (from TableGridNode)
  const handleColumnsReordered = useCallback((orderedKeys: string[]) => {
    const fieldElements = layoutElementsRef.current.filter(el => el.element_type === 'field');
    const nonFieldElements = layoutElementsRef.current.filter(el => el.element_type !== 'field');
    const reordered = orderedKeys.map((key, idx) => {
      const el = fieldElements.find(e => String(e.id || `new-${e.sort_order}`) === key);
      return el ? { ...el, sort_order: idx } : null;
    }).filter(Boolean) as typeof fieldElements;
    let xOff = 0;
    const withPositions = reordered.map(el => {
      const updated = { ...el, x_position: Math.round(xOff * 100) / 100 };
      xOff += el.width;
      return updated;
    });
    layoutElementsRef.current = [...nonFieldElements, ...withPositions];
    setLayoutElements([...layoutElementsRef.current]);
    setHasUnsavedChanges(true);
  }, []);

  // ========== BUILD REACTFLOW NODES ==========

  const buildAllNodes = useCallback(() => {
    if (!currentForm || !currentPattern) {
      setNodes([]);
      return;
    }

    const unit = currentForm.paper_unit || 'mm';
    const newNodes: Node[] = [];

    // Paper node
    newNodes.push({
      id: 'paper',
      type: 'paperNode',
      position: { x: showRuler ? 22 : 0, y: showRuler ? 20 : 0 },
      draggable: false,
      selectable: false,
      data: {
        label: `${currentForm.paper_size || 'A4'} ${currentForm.paper_orientation === 'landscape' ? 'Landscape' : 'Portrait'} - ${Math.round(pxToUnit(paperDimsPx.width, unit) * 10) / 10} x ${Math.round(pxToUnit(paperDimsPx.height, unit) * 10) / 10} ${unit}`,
        paperWidth: paperDimsPx.width,
        paperHeight: paperDimsPx.height,
        paperUnit: unit,
        marginTop: currentForm.margin_top,
        marginRight: currentForm.margin_right,
        marginBottom: currentForm.margin_bottom,
        marginLeft: currentForm.margin_left,
        showRuler,
        headerHeight: currentForm.header_height || 0,
        footerHeight: currentForm.footer_height || 0,
      } as PaperNodeData,
    });

    // Container reference frames from pattern elements
    // Pattern element positions are stored relative to the printable area (after margins)
    const marginLeftPx = unitToPx(currentForm.margin_left, unit);
    const marginRightPx = unitToPx(currentForm.margin_right, unit);
    const marginTopPx = unitToPx(currentForm.margin_top, unit);

    const SECTION_TYPES = ['container', 'header_section', 'detail_section', 'footer_section', 'table_header'];
    const patternElements = currentForm.elements || [];
    for (const pel of patternElements) {
      const pxX = marginLeftPx + unitToPx(pel.x_position, unit);
      const pxY = marginTopPx + unitToPx(pel.y_position, unit);
      const pxW = unitToPx(pel.width, unit);
      const pxH = unitToPx(pel.height, unit);

      if (SECTION_TYPES.includes(pel.element_type)) {
        // Section elements → dashed container outline
        newNodes.push({
          id: `container-ref-${pel.id}`,
          type: 'containerRef',
          position: { x: pxX, y: pxY },
          parentId: 'paper',
          draggable: false,
          selectable: false,
          style: { width: pxW, height: pxH },
          data: {
            label: pel.label || pel.element_type || 'Container',
            elementType: pel.element_type,
            columns: pel.container_columns || 1,
            gap: pel.container_gap || 0,
            maxFields: pel.max_fields,
          } as ContainerRefNodeData,
        });
      } else {
        // Report controls from pattern → only show ghost if no editable copy exists
        const currentLayoutElements = layoutElementsRef.current;
        const hasEditableCopy = currentLayoutElements.some(el => Number(el.container_element_id) === Number(pel.id));
        if (hasEditableCopy) continue; // Editable copy shown as normal layout element

        const displayText = pel.content || pel.label || pel.element_type.replace(/_/g, ' ');
        newNodes.push({
          id: `pattern-ctrl-${pel.id}`,
          type: 'layoutElement',
          position: { x: pxX, y: pxY },
          parentId: 'paper',
          draggable: false,
          selectable: false,
          style: { width: pxW, height: pxH, opacity: 0.7 },
          data: {
            element: {
              element_type: pel.element_type,
              x_position: pel.x_position,
              y_position: pel.y_position,
              width: pel.width,
              height: pel.height,
              content: pel.content,
              font_family: pel.font_family || 'Arial',
              font_size: pel.font_size || (pel.element_type === 'heading' ? 14 : 10),
              font_weight: pel.font_weight || (pel.element_type === 'heading' ? 'bold' : 'normal'),
              font_style: 'normal',
              text_decoration: 'none',
              text_align: 'left',
              text_color: '#000000',
              border_width: pel.border_width,
              border_color: pel.border_color,
              background_color: pel.background_color,
              is_visible: true,
            } as unknown as ReportLayoutElement,
            elementType: pel.element_type,
            displayText,
            isVisible: true,
          } as LayoutElementNodeData,
        });
      }
    }

    // Layout elements - always read from ref (single source of truth for geometry)
    const currentLayoutElements = layoutElementsRef.current;
    const isListMode = currentForm.form_type === 'report_list';

    if (isListMode) {
      // ===== LIST MODE: field elements become a tableGrid node, non-fields are free controls =====
      const fieldElements = currentLayoutElements
        .filter(el => el.element_type === 'field' && el.is_visible)
        .sort((a, b) => a.sort_order - b.sort_order);

      const columns: ColumnInfo[] = fieldElements.map(el => {
        const key = String(el.id || `new-${el.sort_order}`);
        let headerText = 'Column';
        let sampleData = 'ABC';
        if (el.schema_field_id) {
          const field = currentFields.find(f => Number(f.id) === Number(el.schema_field_id));
          if (field) {
            const langLabel = selectedLanguage && el.caption_labels ? el.caption_labels[selectedLanguage] : null;
            headerText = langLabel || el.caption_override || formatFieldName(field.field_name);
            const lower = field.field_type.toLowerCase();
            sampleData = lower.includes('int') || lower.includes('decimal') || lower.includes('float') ? '123'
              : lower.includes('date') ? '01.01.2026'
              : lower.includes('bool') || lower.includes('tinyint') ? 'Yes'
              : 'ABC';
          }
        }
        return {
          key,
          width: el.width,
          widthPx: unitToPx(el.width, unit),
          headerText,
          sampleData,
          fontFamily: el.font_family || 'Arial',
          fontSize: el.font_size || 10,
          fontWeight: el.font_weight || 'normal',
          fontStyle: el.font_style || 'normal',
          textDecoration: el.text_decoration || 'none',
          textAlign: el.text_align || 'left',
          textColor: el.text_color || '#000000',
          backgroundColor: el.background_color,
          isSelected: selectedElementId === key,
          sortOrder: el.sort_order,
          // Per-column header style (fallback to list_style_config then column font)
          headerFontFamily: (el.header_style?.font_family as string) || (currentForm.list_style_config?.header_font_family as string) || el.font_family || 'Arial',
          headerFontSize: Number(el.header_style?.font_size || currentForm.list_style_config?.header_font_size || el.font_size || 10),
          headerFontWeight: (el.header_style?.font_weight as string) || (currentForm.list_style_config?.header_font_weight as string) || 'bold',
          headerTextColor: (el.header_style?.text_color as string) || (currentForm.list_style_config?.header_text_color as string) || '#000000',
        };
      });

      const rowHeightPx = unitToPx(Number(currentForm.row_height || 5), unit);
      const printableW = paperDimsPx.width - marginLeftPx - marginRightPx;

      // Find table_header pattern element for positioning
      const patternEls = currentForm.elements || [];
      const tableHeaderEl = patternEls.find(e => e.element_type === 'table_header');
      const detailSectionEl = patternEls.find(e => e.element_type === 'detail_section');

      // Position header grid at BOTTOM of table_header section (aligned to bottom)
      // Position detail grid at TOP of detail_section
      let headerGridYPx: number;
      let detailGridYPx: number;

      if (tableHeaderEl && detailSectionEl) {
        // Header grid: bottom-aligned inside table_header zone
        const thTopPx = marginTopPx + unitToPx(Number(tableHeaderEl.y_position), unit);
        const thHeightPx = unitToPx(Number(tableHeaderEl.height), unit);
        headerGridYPx = thTopPx + thHeightPx - rowHeightPx; // bottom-aligned
        // Detail grid: top of detail_section
        detailGridYPx = marginTopPx + unitToPx(Number(detailSectionEl.y_position), unit);
      } else if (detailSectionEl) {
        headerGridYPx = marginTopPx + unitToPx(Number(detailSectionEl.y_position), unit) - rowHeightPx;
        detailGridYPx = marginTopPx + unitToPx(Number(detailSectionEl.y_position), unit);
      } else {
        const fallbackH = unitToPx(Number(currentForm.header_height || 0), unit);
        headerGridYPx = marginTopPx + fallbackH - rowHeightPx;
        detailGridYPx = marginTopPx + fallbackH;
      }

      // Use container width for grid, not full printable width
      const gridWidthPx = tableHeaderEl
        ? unitToPx(Number(tableHeaderEl.width), unit)
        : detailSectionEl
          ? unitToPx(Number(detailSectionEl.width), unit)
          : printableW;

      const sharedGridData = {
        columns,
        rowHeightPx,
        printableWidthPx: gridWidthPx,
        pxPerUnit: unit === 'inch' ? INCH_TO_PX : MM_TO_PX,
        listStyle: currentForm.list_style_config || {},
        selectedElementId,
        columnSelectionMode,
      };

      // Table Header Grid — inside table_header section, bottom-aligned
      // X position from table_header or detail_section element (not just margin)
      const gridXPx = tableHeaderEl
        ? marginLeftPx + unitToPx(Number(tableHeaderEl.x_position), unit)
        : detailSectionEl
          ? marginLeftPx + unitToPx(Number(detailSectionEl.x_position), unit)
          : marginLeftPx;

      newNodes.push({
        id: 'table-header-grid',
        type: 'tableHeaderGrid',
        position: { x: gridXPx, y: Math.max(marginTopPx, headerGridYPx) },
        parentId: 'paper',
        draggable: false,
        selectable: false,
        data: {
          ...sharedGridData,
          selectionMode: 'header' as const,
          onSelectColumn: handleColumnSelect,
          onColumnResized: handleColumnResized,
          onColumnsReordered: handleColumnsReordered,
        } as TableGridNodeData,
      });

      // Table Detail Grid — inside detail_section, top-aligned
      newNodes.push({
        id: 'table-detail-grid',
        type: 'tableDetailGrid',
        position: { x: gridXPx, y: detailGridYPx },
        parentId: 'paper',
        draggable: false,
        selectable: false,
        data: {
          ...sharedGridData,
          selectionMode: 'detail' as const,
          onSelectColumn: handleColumnSelect,
        } as TableGridNodeData,
      });

      // Non-field controls (static_text, heading, etc.) are free-positioned
      for (const el of currentLayoutElements) {
        if (el.element_type === 'field') continue;
        const key = el.id || `new-${el.sort_order}`;
        const nodeId = `element-${key}`;
        const px = marginLeftPx + unitToPx(el.x_position, unit);
        const py = marginTopPx + unitToPx(el.y_position, unit);
        const pw = unitToPx(el.width, unit);
        const ph = unitToPx(el.height, unit);
        const isSelected = selectedElementId === String(key);

        newNodes.push({
          id: nodeId,
          type: 'layoutElement',
          position: { x: px, y: py },
          parentId: 'paper',
          extent: 'parent' as const,
          draggable: true,
          selectable: true,
          selected: isSelected,
          style: { width: pw, height: ph, zIndex: (el.sort_order || 0) + 1 },
          data: {
            element: el,
            elementType: el.element_type,
            displayText: (selectedLanguage && el.caption_labels ? el.caption_labels[selectedLanguage] : null) || el.content || '',
            fieldName: el.element_type === 'image_placeholder' ? (selectedLanguage || 'all') : '',
            fieldType: '',
            isVisible: el.is_visible,
          } as LayoutElementNodeData,
        });
      }
    } else {
      // ===== SINGLE MODE: all elements free-positioned =====
      for (const el of currentLayoutElements) {
        const key = el.id || `new-${el.sort_order}`;
        const nodeId = `element-${key}`;
        const px = marginLeftPx + unitToPx(el.x_position, unit);
        const py = marginTopPx + unitToPx(el.y_position, unit);
        const pw = unitToPx(el.width, unit);
        const ph = unitToPx(el.height, unit);

        let fieldName = '';
        let fieldType = '';
        let displayText = el.content || '';
        if (el.element_type === 'field' && el.schema_field_id) {
          const field = currentFields.find(f => Number(f.id) === Number(el.schema_field_id));
          if (field) {
            fieldName = field.field_name;
            fieldType = field.field_type;
            const langLabel = selectedLanguage && el.caption_labels ? el.caption_labels[selectedLanguage] : null;
            displayText = langLabel || el.caption_override || formatFieldName(field.field_name);
          }
        }
        if (!displayText && el.element_type !== 'field') {
          const langText = selectedLanguage && el.caption_labels ? el.caption_labels[selectedLanguage] : null;
          displayText = langText || el.content || '';
        }
        // For image_placeholder: pass selectedLanguage via fieldName so the node can resolve the correct image
        if (el.element_type === 'image_placeholder') {
          fieldName = selectedLanguage || 'all';
        }

        const isSelected = selectedElementId === String(key);

        newNodes.push({
          id: nodeId,
          type: 'layoutElement',
          position: { x: px, y: py },
          parentId: 'paper',
          extent: 'parent' as const,
          draggable: true,
          selectable: true,
          selected: isSelected,
          style: { width: pw, height: ph, zIndex: (el.sort_order || 0) + 1 },
          data: {
            element: el,
            elementType: el.element_type,
            displayText,
            fieldName,
            fieldType,
            isVisible: el.is_visible,
          } as LayoutElementNodeData,
        });
      }
    }

    setNodes(newNodes);
  }, [currentForm, currentPattern, currentFields, selectedElementId, showRuler, paperDimsPx, setNodes, _elementsVersion, selectedLanguage, handleColumnSelect, handleColumnResized, handleColumnsReordered, columnSelectionMode]);

  // Rebuild when form/pattern/ruler changes
  useEffect(() => {
    buildAllNodes();
  }, [buildAllNodes]);

  // ========== NODE INTERACTION HANDLERS ==========

  const handleSelectionChange = useCallback(({ nodes: selectedNodes }: { nodes: Node[] }) => {
    const elementNodes = selectedNodes.filter(n => n.type === 'layoutElement');

    if (elementNodes.length === 1) {
      const nodeId = elementNodes[0].id;
      const keyStr = nodeId.replace('element-', '');
      setSelectedElementId(keyStr);
      const el = layoutElementsRef.current.find(e => String(e.id || `new-${e.sort_order}`) === keyStr);
      if (el) {
        setLiveGeometry({ x: el.x_position, y: el.y_position, w: el.width, h: el.height });
      }
    } else {
      const activeEl = document.activeElement;
      if (activeEl && activeEl.closest('.properties-panel')) {
        return;
      }
      setSelectedElementId(null);
      setLiveGeometry(null);
    }
  }, []);

  // Track whether user is actively interacting (to distinguish from initial placement)
  const isDraggingRef = useRef(false);

  const handleNodesChange = useCallback((changes: Parameters<typeof onNodesChange>[0]) => {
    // Filter out remove changes for managed nodes
    const safeChanges = changes.filter(c => {
      if (c.type === 'remove') {
        return !c.id.startsWith('paper') && !c.id.startsWith('container-ref-') && !c.id.startsWith('element-');
      }
      return true;
    });

    onNodesChange(safeChanges);

    const unit = currentForm?.paper_unit || 'mm';
    let dragEnded = false;
    let resizeEnded = false;
    let geometryChanged = false;

    for (const change of safeChanges) {
      // Track active dragging
      if (change.type === 'position' && change.id.startsWith('element-')) {
        if ((change as any).dragging === true) {
          isDraggingRef.current = true;
        }
        // Only commit position when drag ENDS and user was actually dragging
        if ((change as any).dragging === false && isDraggingRef.current && change.position) {
          isDraggingRef.current = false;
          const keyStr = change.id.replace('element-', '');
          const mLeftPx = unitToPx(currentForm?.margin_left || 0, unit);
          const mTopPx = unitToPx(currentForm?.margin_top || 0, unit);
          const posUnit = pxToUnit(change.position.x - mLeftPx, unit);
          const posUnitY = pxToUnit(change.position.y - mTopPx, unit);

          layoutElementsRef.current = layoutElementsRef.current.map(el => {
            if (String(el.id || `new-${el.sort_order}`) === keyStr) {
              return { ...el, x_position: Math.round(posUnit * 100) / 100, y_position: Math.round(posUnitY * 100) / 100 };
            }
            return el;
          });
          dragEnded = true;
          geometryChanged = true;
        }
      }

      // Dimensions: update ref for live geometry display,
      // only sync state when resize ENDS.
      // IMPORTANT: Resizing from left/top also changes position — capture that too.
      if (change.type === 'dimensions' && change.dimensions && change.id.startsWith('element-')) {
        const isResizing = (change as any).resizing === true;
        const keyStr = change.id.replace('element-', '');
        const wUnit = pxToUnit(change.dimensions.width || 0, unit);
        const hUnit = pxToUnit(change.dimensions.height || 0, unit);

        // Also read the current node position (resize from left/top moves x/y)
        const mLeftPx = unitToPx(currentForm?.margin_left || 0, unit);
        const mTopPx = unitToPx(currentForm?.margin_top || 0, unit);
        const posChange = safeChanges.find(
          c => c.type === 'position' && c.id === change.id && (c as any).position
        );
        const posUpdate: Record<string, number> = {};
        if (posChange && (posChange as any).position) {
          const pos = (posChange as any).position;
          posUpdate.x_position = Math.round(pxToUnit(pos.x - mLeftPx, unit) * 100) / 100;
          posUpdate.y_position = Math.round(pxToUnit(pos.y - mTopPx, unit) * 100) / 100;
        }

        layoutElementsRef.current = layoutElementsRef.current.map(el => {
          if (String(el.id || `new-${el.sort_order}`) === keyStr) {
            return {
              ...el,
              ...posUpdate,
              width: Math.round(wUnit * 100) / 100,
              height: Math.round(hUnit * 100) / 100,
            };
          }
          return el;
        });
        geometryChanged = true;
        if (!isResizing) {
          resizeEnded = true;
        }
      }
    }

    // Mark as changed (ref already updated above — no state sync needed,
    // buildAllNodes reads from ref directly)
    if (dragEnded || resizeEnded) {
      setHasUnsavedChanges(true);
    }

    if (geometryChanged && selectedElementId != null) {
      const el = layoutElementsRef.current.find(e => String(e.id || `new-${e.sort_order}`) === selectedElementId);
      if (el) {
        setLiveGeometry({ x: el.x_position, y: el.y_position, w: el.width, h: el.height });
      }
    }
  }, [onNodesChange, currentForm, snapToGrid, selectedElementId]);

  // ========== DRAG & DROP FROM PALETTE ==========

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
  }, []);

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    if (!currentForm) return;

    const unit = currentForm.paper_unit || 'mm';
    const flowPos = reactFlowInstance.screenToFlowPosition({ x: event.clientX, y: event.clientY });

    // Offset for paper node position (ruler offset)
    const paperOffsetX = showRuler ? 22 : 0;
    const paperOffsetY = showRuler ? 20 : 0;
    // Subtract margin offset - positions stored relative to printable area
    const mLeftPx = unitToPx(currentForm.margin_left, unit);
    const mTopPx = unitToPx(currentForm.margin_top, unit);
    const relX = flowPos.x - paperOffsetX - mLeftPx;
    const relY = flowPos.y - paperOffsetY - mTopPx;

    // Convert pixel position to unit
    const xUnit = pxToUnit(Math.max(0, relX), unit);
    const yUnit = pxToUnit(Math.max(0, relY), unit);

    // Snap
    const snapVal = snapToGrid ? (unit === 'inch' ? 0.25 : 5) : 0;
    const snappedX = snapVal > 0 ? Math.round(xUnit / snapVal) * snapVal : xUnit;
    const snappedY = snapVal > 0 ? Math.round(yUnit / snapVal) * snapVal : yUnit;

    // Add element to ref and rebuild nodes (no state update → no rebuild loop)
    const addToRefAndRebuild = (newEl: ReportLayoutElement) => {
      layoutElementsRef.current = [...layoutElementsRef.current, newEl];
      setLayoutElements([...layoutElementsRef.current]);
      setHasUnsavedChanges(true);
      buildAllNodes();
    };

    // Handle report control drops
    const reportControlType = event.dataTransfer.getData('application/report-control');
    if (reportControlType) {
      const ctrlDef = REPORT_CONTROLS.find(c => c.type === reportControlType);
      const newEl = createDefaultElement(
        currentForm.id,
        reportControlType as ReportLayoutElement['element_type'],
        Math.round(snappedX * 100) / 100,
        Math.round(snappedY * 100) / 100,
        ctrlDef?.defaultWidth || 80,
        ctrlDef?.defaultHeight || 5,
        layoutElementsRef.current.length,
      );
      addToRefAndRebuild(newEl);
      return;
    }

    // Handle field drops
    const fieldIdStr = event.dataTransfer.getData('application/field-id');
    if (fieldIdStr) {
      const fieldId = Number(fieldIdStr);
      if (placedFieldIds.has(fieldId)) return;

      const field = currentFields.find(f => Number(f.id) === fieldId);
      if (!field) return;

      const newEl: ReportLayoutElement = {
        report_pattern_form_id: currentForm.id,
        element_type: 'field',
        schema_table_id: Number(selectedTableId),
        schema_field_id: fieldId,
        x_position: Math.round(snappedX * 100) / 100,
        y_position: Math.round(snappedY * 100) / 100,
        width: 40,
        height: 5,
        font_family: 'Arial',
        font_size: 10,
        font_weight: 'normal',
        font_style: 'normal',
        text_decoration: 'none',
        text_align: 'left',
        text_color: '#000000',
        sort_order: layoutElementsRef.current.length,
        is_visible: true,
      };

      addToRefAndRebuild(newEl);
      return;
    }
  }, [currentForm, reactFlowInstance, showRuler, snapToGrid, placedFieldIds, currentFields, selectedTableId, buildAllNodes]);

  // ========== SAVE ==========

  const handleSave = useCallback(async () => {
    if (!currentForm) return;
    setSaving(true);
    try {
      const current = layoutElementsRef.current;
      const payload = current.map((el, idx) => ({
        id: el.id || undefined,
        report_pattern_form_id: currentForm.id,
        container_element_id: el.container_element_id || undefined,
        element_type: el.element_type,
        schema_table_id: el.schema_table_id || undefined,
        schema_field_id: el.schema_field_id || undefined,
        x_position: el.x_position,
        y_position: el.y_position,
        width: el.width,
        height: el.height,
        content: el.content || undefined,
        font_family: el.font_family,
        font_size: el.font_size,
        font_weight: el.font_weight,
        font_style: el.font_style,
        text_decoration: el.text_decoration,
        text_align: el.text_align,
        text_color: el.text_color,
        border_width: el.border_width || undefined,
        border_color: el.border_color || undefined,
        background_color: el.background_color || undefined,
        caption_override: el.caption_override || null,
        caption_labels: el.caption_labels || null,
        label_position: el.label_position || 'top',
        label_width: el.label_width || null,
        control_type: el.control_type || null,
        header_style: el.header_style || null,
        sort_order: idx,
        is_visible: el.is_visible,
      }));

      let data: any;
      try {
        data = await apiClient.put(`/report-layout/${currentForm.id}/elements`, {
          elements: payload,
          table_id: selectedTableId,
        });
      } catch (err: any) {
        throw new Error(err?.response?.data?.message || 'Save failed');
      }
      const savedElements = Array.isArray(data) ? data : (data.data || data.elements || []);
      if (savedElements.length > 0) {
        setLayoutElements(savedElements);
      }

      setHasUnsavedChanges(false);
      setSelectedElementId(null);
      setLiveGeometry(null);
      toast.current?.show({ severity: 'success', summary: 'Saved', detail: 'Report layout saved successfully.', life: 3000 });
    } catch (err) {
      toast.current?.show({ severity: 'error', summary: 'Error', detail: String(err), life: 4000 });
    } finally {
      setSaving(false);
    }
  }, [currentForm, selectedTableId]);

  // ========== AUTO-PLACE ==========

  const handleAutoPlace = useCallback(async () => {
    if (!currentForm || selectedTableId == null) return;

    if (layoutElements.length > 0) {
      const confirmed = window.confirm('Existing layout elements will be replaced. Continue?');
      if (!confirmed) return;
    }

    setLoading(true);
    try {
      let data: any;
      let serverPlaced = false;
      try {
        // Pass language so the backend picks the right caption for the
        // persisted `caption` column; the full caption_labels map is always
        // snapshotted from schema_translations regardless of this value.
        data = await apiClient.post(`/report-layout/${currentForm.id}/auto-place`, {
          table_id: selectedTableId,
          language: selectedLanguage,
        });
        serverPlaced = true;
      } catch {
        serverPlaced = false;
      }

      if (serverPlaced) {
        const elements = Array.isArray(data) ? data : (data.data || data.elements || []);
        setLayoutElements(elements);
        setHasUnsavedChanges(true);
        toast.current?.show({ severity: 'success', summary: 'Auto-placed', detail: `${elements.length} elements placed.`, life: 3000 });
      } else {
        // Fallback: client-side auto-place
        const patternElements = currentForm.elements || [];
        const firstContainer = patternElements[0];
        if (!firstContainer) {
          toast.current?.show({ severity: 'warn', summary: 'Warning', detail: 'No container elements in pattern.', life: 3000 });
          setLoading(false);
          return;
        }

        //const unit = currentForm.paper_unit || 'mm';
        const columns = firstContainer.container_columns || 1;
        const gap = firstContainer.container_gap || 2;
        const containerW = firstContainer.width;
        const fieldW = columns > 1 ? (containerW - (columns - 1) * gap) / columns : containerW;
        const fieldH = currentForm.row_height || 5;

        const fieldsToPlace = currentFields.filter(f =>
          !f.is_auto_increment && !['created_at', 'updated_at', 'deleted_at'].includes(f.field_name)
        );

        const newElements: ReportLayoutElement[] = fieldsToPlace.map((field, idx) => {
          const col = idx % columns;
          const row = Math.floor(idx / columns);
          return {
            report_pattern_form_id: currentForm.id,
            container_element_id: firstContainer.id,
            element_type: 'field' as const,
            schema_table_id: Number(selectedTableId),
            schema_field_id: field.id,
            x_position: firstContainer.x_position + col * (fieldW + gap),
            y_position: firstContainer.y_position + row * (fieldH + gap),
            width: fieldW,
            height: fieldH,
            font_family: 'Arial',
            font_size: 10,
            font_weight: 'normal',
            font_style: 'normal',
            text_decoration: 'none',
            text_align: 'left',
            text_color: '#000000',
            sort_order: idx,
            is_visible: true,
          };
        });

        setLayoutElements(newElements);
        setHasUnsavedChanges(true);
        toast.current?.show({ severity: 'success', summary: 'Auto-placed', detail: `${newElements.length} fields placed (client-side).`, life: 3000 });
      }
    } catch (err) {
      toast.current?.show({ severity: 'error', summary: 'Error', detail: String(err), life: 4000 });
    } finally {
      setLoading(false);
    }
  }, [currentForm, selectedTableId, layoutElements, currentFields]);

  // ========== DELETE ELEMENT ==========

  const handleDeleteElement = useCallback(async () => {
    if (selectedElementId == null) return;

    const el = layoutElementsRef.current.find(e => String(e.id || `new-${e.sort_order}`) === selectedElementId);
    if (!el) return;

    // Delete from server if it has an id
    if (el.id) {
      try {
        await apiClient.delete(`/report-layout/elements/${el.id}`);
      } catch {
        // Continue with local delete
      }
    }

    layoutElementsRef.current = layoutElementsRef.current.filter(e => String(e.id || `new-${e.sort_order}`) !== selectedElementId);
    setLayoutElements([...layoutElementsRef.current]);
    setSelectedElementId(null);
    setLiveGeometry(null);
    setHasUnsavedChanges(true);
    buildAllNodes();
  }, [selectedElementId, buildAllNodes]);

  // ========== UPDATE ELEMENT PROPERTY ==========

  const updateElementProp = useCallback((updates: Partial<ReportLayoutElement>) => {
    if (selectedElementId == null) return;
    layoutElementsRef.current = layoutElementsRef.current.map(el => {
      if (String(el.id || `new-${el.sort_order}`) !== selectedElementId) return el;
      return { ...el, ...updates };
    });
    setLayoutElements([...layoutElementsRef.current]);
    setHasUnsavedChanges(true);
    buildAllNodes();
  }, [selectedElementId, buildAllNodes]);

  // ========== KEYBOARD SHORTCUTS ==========

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' && selectedElementId != null) {
        const activeEl = document.activeElement;
        if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) return;
        handleDeleteElement();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedElementId, handleDeleteElement]);

  // ========== RENDER ==========

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: colors.bgPrimary }}>
      <Toast ref={toast} />

      {/* Hidden drag image */}
      <div
        ref={dragImageRef}
        style={{
          position: 'fixed', top: -100, left: -100,
          padding: '4px 10px', borderRadius: 4,
          backgroundColor: '#3b82f6', color: '#fff',
          fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap',
          pointerEvents: 'none', zIndex: 9999,
        }}
      />

      {/* Toolbar */}
      <div style={{
        padding: '8px 12px',
        borderBottom: `1px solid ${colors.borderPrimary}`,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        flexWrap: 'wrap',
        backgroundColor: colors.bgSecondary,
      }}>
        {/* Pattern selector */}
        <Dropdown
          value={selectedPatternId}
          options={patternOptions}
          onChange={(e) => setSelectedPatternId(e.value)}
          placeholder="Report Pattern..."
          style={{ width: 180, fontSize: 12 }}
          className="p-inputtext-sm"
        />

        {/* Form type selector */}
        <Dropdown
          value={selectedFormType}
          options={FORM_TYPE_OPTIONS}
          onChange={(e) => setSelectedFormType(e.value)}
          placeholder="Form Type..."
          style={{ width: 140, fontSize: 12 }}
          className="p-inputtext-sm"
        />

        {/* Schema selector */}
        <Dropdown
          value={selectedSchemaId}
          options={schemas.map(s => ({ label: s.name, value: s.id }))}
          onChange={(e) => { setSelectedSchemaId(e.value); setSelectedTableId(null); setCurrentFields([]); }}
          placeholder="Schema..."
          style={{ width: 140, fontSize: 12 }}
          className="p-inputtext-sm"
        />

        {/* Table selector */}
        <Dropdown
          value={selectedTableId}
          options={tables.map(t => ({ label: t.table_name, value: t.id }))}
          onChange={(e) => setSelectedTableId(e.value)}
          placeholder="Table..."
          style={{ width: 150, fontSize: 12 }}
          className="p-inputtext-sm"
          disabled={tables.length === 0}
        />

        {/* Load button */}
        <Button
          label={t.formlayoutdesigner_load || 'Load'}
          icon="pi pi-download"
          size="small"
          onClick={handleLoad}
          loading={loading}
          style={{ fontSize: 11 }}
        />

        {/* Auto-place button */}
        <Button
          label={t.reportlayoutdesignerpanel2077}
          icon="pi pi-th-large"
          size="small"
          severity="secondary"
          onClick={handleAutoPlace}
          disabled={!currentForm || selectedTableId == null}
          style={{ fontSize: 11 }}
        />

        {/* Language selector */}
        {enabledLanguages.length > 0 && (
          <>
            <div style={{ width: 1, height: 24, backgroundColor: colors.borderPrimary }} />
            <Dropdown
              value={selectedLanguage}
              options={enabledLanguages}
              onChange={(e) => setSelectedLanguage(e.value)}
              placeholder={t.formlayoutdesigner_language || 'Language'}
              style={{ width: 90, fontSize: 12 }}
              className="p-inputtext-sm"
            />
          </>
        )}

        <div style={{ flex: 1 }} />

        {/* Unsaved indicator */}
        {hasUnsavedChanges && (
          <span style={{ fontSize: 10, color: '#f59e0b', display: 'flex', alignItems: 'center', gap: 4 }}>
            <i className="pi pi-exclamation-circle" style={{ fontSize: 12 }} />
            Unsaved
          </span>
        )}

        {/* Live Preview button */}
        <Button
          icon="pi pi-eye"
          tooltip="Live Preview"
          size="small"
          severity="info"
          outlined
          onClick={() => setShowLivePreview(true)}
          disabled={!currentForm || layoutElements.length === 0}
          style={{ fontSize: 11 }}
        />

        {/* Save button */}
        <Button
          label={t.formlayoutdesigner_save || 'Save'}
          icon="pi pi-save"
          size="small"
          severity="success"
          onClick={handleSave}
          loading={saving}
          disabled={!hasUnsavedChanges || !currentForm}
          style={{ fontSize: 11 }}
        />
      </div>

      {/* Main content area: Left | Center | Right */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* ===== LEFT PANEL: Field Stash + Report Controls ===== */}
        <div style={{
          width: 240, minWidth: 200, maxWidth: 300,
          borderRight: `1px solid ${colors.borderPrimary}`,
          backgroundColor: colors.bgSecondary,
          overflowY: 'auto',
          display: 'flex', flexDirection: 'column',
        }}>
          {/* Field stash */}
          <CollapsibleSection
            title={`Fields (${currentFields.length})`}
            defaultOpen={true}
            colors={colors}
          >
            {currentFields.length === 0 && (
              <div style={{ padding: 12, textAlign: 'center', color: colors.textMuted, fontSize: 11 }}>
                Load a layout to see fields.
              </div>
            )}
            {currentFields.map(field => {
              const isPlaced = placedFieldIds.has(field.id);
              const stashId = `field-${field.id}`;
              const isHovered = hoveredStashId === stashId;
              const isPressed = pressedStashId === stashId;
              const isListMode = currentForm?.form_type === 'report_list';

              // List mode: click to add/remove column
              const handleListToggle = () => {
                if (!currentForm) return;
                if (isPlaced) {
                  // Remove column
                  layoutElementsRef.current = layoutElementsRef.current.filter(
                    el => !(el.element_type === 'field' && Number(el.schema_field_id) === field.id)
                  );
                } else {
                  // Add as new column
                  const existingCols = layoutElementsRef.current.filter(el => el.element_type === 'field');
                  const newEl: ReportLayoutElement = {
                    report_pattern_form_id: currentForm.id,
                    element_type: 'field',
                    schema_table_id: Number(selectedTableId),
                    schema_field_id: field.id,
                    x_position: 0,
                    y_position: 0,
                    width: 30,
                    height: Number(currentForm.row_height) || 5,
                    font_family: 'Arial',
                    font_size: 10,
                    font_weight: 'normal',
                    font_style: 'normal',
                    text_decoration: 'none',
                    text_align: 'left',
                    text_color: '#000000',
                    sort_order: existingCols.length,
                    is_visible: true,
                  };
                  layoutElementsRef.current = [...layoutElementsRef.current, newEl];
                }
                // Recalculate x_positions
                let xOff = 0;
                layoutElementsRef.current = layoutElementsRef.current.map(el => {
                  if (el.element_type === 'field') {
                    const updated = { ...el, x_position: Math.round(xOff * 100) / 100 };
                    xOff += el.width;
                    return updated;
                  }
                  return el;
                });
                setLayoutElements([...layoutElementsRef.current]);
                setHasUnsavedChanges(true);
              };

              return (
                <div
                  key={field.id}
                  draggable={!isPlaced && !isListMode}
                  onDragStart={(e) => {
                    if (isPlaced || isListMode) { e.preventDefault(); return; }
                    e.dataTransfer.setData('application/field-id', String(field.id));
                    e.dataTransfer.effectAllowed = 'copyMove';
                    const el = dragImageRef.current;
                    if (el) {
                      el.textContent = formatFieldName(field.field_name);
                      el.style.display = 'block';
                      e.dataTransfer.setDragImage(el, 10, 16);
                      requestAnimationFrame(() => { el.style.display = 'none'; });
                    }
                    setPressedStashId(null);
                  }}
                  onDragEnd={() => setPressedStashId(null)}
                  onClick={isListMode ? handleListToggle : undefined}
                  onMouseEnter={() => setHoveredStashId(stashId)}
                  onMouseLeave={() => { setHoveredStashId(null); setPressedStashId(null); }}
                  onMouseDown={() => !isPlaced && !isListMode && setPressedStashId(stashId)}
                  onMouseUp={() => setPressedStashId(null)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '5px 8px', marginBottom: 2, borderRadius: 4,
                    backgroundColor: isPlaced
                      ? (isListMode ? 'rgba(34,197,94,0.15)' : 'rgba(107,114,128,0.15)')
                      : isPressed ? 'rgba(59,130,246,0.35)'
                      : isHovered ? 'rgba(255,255,255,0.12)'
                      : 'rgba(255,255,255,0.05)',
                    borderLeft: isPressed ? '3px solid #3b82f6' : '3px solid transparent',
                    cursor: isListMode ? 'pointer' : (isPlaced ? 'default' : 'grab'),
                    opacity: isPlaced && !isListMode ? 0.5 : 1,
                    fontSize: 11,
                    color: isPlaced ? (isListMode ? '#22c55e' : colors.textMuted) : colors.textSecondary,
                    transition: 'all 0.1s ease',
                    transform: isPressed ? 'scale(0.97)' : 'scale(1)',
                  }}
                >
                  {isPlaced ? (
                    <i className={`pi ${isListMode ? 'pi-check-circle' : 'pi-check'}`} style={{ color: '#22c55e', fontSize: 11 }} />
                  ) : (
                    <FieldTypeIcon fieldType={field.field_type} isPK={field.is_primary_key} />
                  )}
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {formatFieldName(field.field_name)}
                  </span>
                  <span style={{ fontSize: 9, color: colors.textMuted }}>
                    {field.field_type}
                  </span>
                </div>
              );
            })}
          </CollapsibleSection>

          {/* Report controls palette */}
          <CollapsibleSection
            title="Report Controls"
            defaultOpen={true}
            colors={colors}
          >
            {['text', 'layout', 'placeholders', 'media'].map(category => {
              const items = REPORT_CONTROLS.filter(c => c.category === category);
              if (items.length === 0) return null;
              const catLabels: Record<string, string> = {
                text: 'Text',
                layout: 'Layout',
                placeholders: 'Placeholders',
                media: 'Media',
              };
              return (
                <div key={category}>
                  <div style={{ fontSize: 10, fontWeight: 600, color: colors.textMuted, padding: '6px 4px 2px', textTransform: 'uppercase' }}>
                    {catLabels[category]}
                  </div>
                  {items.map(ctrl => (
                    <div
                      key={ctrl.type}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('application/report-control', ctrl.type);
                        e.dataTransfer.effectAllowed = 'copyMove';
                        const el = dragImageRef.current;
                        if (el) {
                          el.textContent = ctrl.label;
                          el.style.display = 'block';
                          e.dataTransfer.setDragImage(el, 10, 16);
                          requestAnimationFrame(() => { el.style.display = 'none'; });
                        }
                      }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '5px 8px', marginBottom: 2, borderRadius: 4,
                        backgroundColor: 'rgba(168,85,247,0.08)',
                        border: '1px solid rgba(168,85,247,0.2)',
                        cursor: 'grab', fontSize: 11,
                        color: colors.textPrimary,
                      }}
                    >
                      <i className={`pi ${ctrl.icon}`} style={{ fontSize: 12, color: '#a855f7' }} />
                      <span style={{ flex: 1 }}>{ctrl.label}</span>
                      <span style={{ fontSize: 8, color: colors.textMuted }}>
                        {ctrl.defaultWidth}x{ctrl.defaultHeight}{paperUnit}
                      </span>
                    </div>
                  ))}
                </div>
              );
            })}
          </CollapsibleSection>
        </div>

        {/* ===== CENTER PANEL: ReactFlow Canvas ===== */}
        <div style={{ flex: 1, position: 'relative' }}>
          {loading ? (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              height: '100%', gap: 12,
            }}>
              <ProgressSpinner style={{ width: 40, height: 40 }} />
              <span style={{ color: colors.textSecondary, fontSize: 13 }}>Loading layout...</span>
            </div>
          ) : !currentForm ? (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              height: '100%', flexDirection: 'column', gap: 12,
            }}>
              <i className="pi pi-file" style={{ fontSize: 40, color: colors.textMuted, opacity: 0.3 }} />
              <span style={{ color: colors.textMuted, fontSize: 13 }}>
                Select a pattern, form type, and table, then click Load.
              </span>
            </div>
          ) : (
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={handleNodesChange}
              onEdgesChange={onEdgesChange}
              onSelectionChange={handleSelectionChange}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              nodeTypes={nodeTypes}
              fitView
              fitViewOptions={{ padding: 0.15, maxZoom: 1.5 }}
              minZoom={0.2}
              maxZoom={3}
              snapToGrid={snapToGrid}
              snapGrid={[unitToPx(projectGridSize, projectGridUnit), unitToPx(projectGridSize, projectGridUnit)]}
              proOptions={{ hideAttribution: true }}
              style={{ backgroundColor: '#f0f0f4' }}
            >
              <Background variant={BackgroundVariant.Dots} gap={unitToPx(projectGridSize, projectGridUnit)} size={1} color="rgba(100,100,140,0.3)" />
              <Controls position="bottom-left" showInteractive={false} />
              <MiniMap
                position="bottom-right"
                style={{ marginBottom: 50 }}
                nodeStrokeColor="#6b7280"
                nodeColor={(node) => {
                  if (node.type === 'paperNode') return '#ffffff';
                  if (node.type === 'containerRef') return 'rgba(156,163,175,0.2)';
                  return '#3b82f6';
                }}
                maskColor="rgba(0,0,0,0.7)"
              />
            </ReactFlow>
          )}

          {/* Settings gear */}
          <div style={{ position: 'absolute', bottom: 12, right: 12, zIndex: 10 }}>
            <Button
              icon="pi pi-cog"
              rounded
              text
              severity="secondary"
              onClick={() => setShowSettings(!showSettings)}
              style={{ width: 32, height: 32, fontSize: 14 }}
            />
            {showSettings && (
              <div style={{
                position: 'absolute', bottom: 40, right: 0,
                backgroundColor: colors.bgSecondary,
                border: `1px solid ${colors.borderPrimary}`,
                borderRadius: 8, padding: 12, minWidth: 200,
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: colors.textPrimary, marginBottom: 8 }}>
                  Canvas Settings
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <Checkbox
                    checked={showRuler}
                    onChange={(e) => setShowRuler(e.checked || false)}
                  />
                  <span style={{ fontSize: 11, color: colors.textSecondary }}>Show Ruler</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Checkbox
                    checked={snapToGrid}
                    onChange={(e) => setSnapToGrid(e.checked || false)}
                  />
                  <span style={{ fontSize: 11, color: colors.textSecondary }}>Snap to Grid</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ===== RIGHT PANEL: Properties ===== */}
        <div
          className="properties-panel"
          style={{
            width: 230, minWidth: 200, maxWidth: 280,
            borderLeft: `1px solid ${colors.borderPrimary}`,
            backgroundColor: colors.bgSecondary,
            overflowY: 'auto',
            display: 'flex', flexDirection: 'column',
          }}
        >
          {selectedElement == null ? (
            <div style={{
              padding: 20, textAlign: 'center', color: colors.textMuted, fontSize: 12,
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, marginTop: 40,
            }}>
              <i className="pi pi-info-circle" style={{ fontSize: 24, opacity: 0.3 }} />
              <span>Select an element to edit its properties.</span>
            </div>
          ) : (
            <div style={{ padding: '8px 6px', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {/* Mode indicator for list columns */}
              {currentForm?.form_type === 'report_list' && selectedElement.element_type === 'field' && (
                <div style={{ display: 'flex', gap: 2, marginBottom: 2 }}>
                  <button
                    onClick={() => { setColumnSelectionMode('header'); }}
                    style={{
                      flex: 1, padding: '4px 8px', fontSize: 10, fontWeight: 600,
                      border: `1px solid ${columnSelectionMode === 'header' ? '#f59e0b' : colors.borderPrimary}`,
                      borderRadius: '4px 0 0 4px', cursor: 'pointer',
                      backgroundColor: columnSelectionMode === 'header' ? 'rgba(245,158,11,0.15)' : colors.bgTertiary,
                      color: columnSelectionMode === 'header' ? '#f59e0b' : colors.textMuted,
                    }}
                  >
                    <i className="pi pi-arrow-up" style={{ fontSize: 9, marginRight: 4 }} />Header
                  </button>
                  <button
                    onClick={() => { setColumnSelectionMode('detail'); }}
                    style={{
                      flex: 1, padding: '4px 8px', fontSize: 10, fontWeight: 600,
                      border: `1px solid ${columnSelectionMode === 'detail' ? '#f59e0b' : colors.borderPrimary}`,
                      borderRadius: '0 4px 4px 0', cursor: 'pointer',
                      backgroundColor: columnSelectionMode === 'detail' ? 'rgba(245,158,11,0.15)' : colors.bgTertiary,
                      color: columnSelectionMode === 'detail' ? '#f59e0b' : colors.textMuted,
                    }}
                  >
                    <i className="pi pi-list" style={{ fontSize: 9, marginRight: 4 }} />Data
                  </button>
                </div>
              )}
              {/* Element type header */}
              <div style={{
                padding: '6px 10px', borderRadius: 6,
                backgroundColor: 'rgba(59,130,246,0.1)',
                border: '1px solid rgba(59,130,246,0.2)',
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <i className={`pi ${
                  selectedElement.element_type === 'field' ? 'pi-align-left'
                  : selectedElement.element_type === 'heading' ? 'pi-header'
                  : selectedElement.element_type === 'static_text' ? 'pi-align-left'
                  : selectedElement.element_type === 'line_horizontal' ? 'pi-minus'
                  : selectedElement.element_type === 'line_vertical' ? 'pi-ellipsis-v'
                  : selectedElement.element_type === 'box' ? 'pi-stop'
                  : selectedElement.element_type === 'page_number' ? 'pi-hashtag'
                  : selectedElement.element_type === 'page_date' ? 'pi-calendar'
                  : selectedElement.element_type === 'page_total' ? 'pi-sort-numeric-up'
                  : 'pi-image'
                }`} style={{ fontSize: 14, color: '#3b82f6' }} />
                <span style={{ fontSize: 12, fontWeight: 600, color: colors.textPrimary, textTransform: 'capitalize' }}>
                  {selectedElement.element_type.replace(/_/g, ' ')}
                </span>
              </div>

              {/* Visibility toggle */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' }}>
                <Checkbox
                  checked={selectedElement.is_visible}
                  onChange={(e) => updateElementProp({ is_visible: e.checked || false })}
                />
                <span style={{ fontSize: 11, color: colors.textSecondary }}>Visible</span>
              </div>

              {/* Caption / Content */}
              {selectedElement.element_type === 'field' && (
                <>
                  <label style={{ fontSize: 10, color: colors.textMuted, fontWeight: 600, textTransform: 'uppercase' }}>
                    Caption Override
                  </label>
                  <InputText
                    value={selectedElement.caption_override || ''}
                    onChange={(e) => updateElementProp({ caption_override: e.target.value || undefined })}
                    placeholder="Auto from field name"
                    style={{ fontSize: 11 }}
                    className="p-inputtext-sm"
                  />

                  {/* Multi-language caption labels */}
                  {enabledLanguages.length > 0 && (
                    <>
                      <label style={{ fontSize: 10, color: colors.textMuted, fontWeight: 600, textTransform: 'uppercase', marginTop: 4 }}>
                        Caption Labels
                      </label>
                      {enabledLanguages.map((lang: { label: string; value: string }) => {
                        const isActiveLang = lang.value === selectedLanguage;
                        return (
                        <div key={lang.value} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <span style={{
                            fontSize: 10, width: 24, textAlign: 'right',
                            color: isActiveLang ? '#3b82f6' : colors.textMuted,
                            fontWeight: isActiveLang ? 600 : 400,
                          }}>
                            {lang.label}
                          </span>
                          <InputText
                            value={(selectedElement.caption_labels || {})[lang.value] || ''}
                            onChange={(e) => {
                              const labels = { ...(selectedElement.caption_labels || {}) };
                              if (e.target.value) {
                                labels[lang.value] = e.target.value;
                              } else {
                                delete labels[lang.value];
                              }
                              updateElementProp({ caption_labels: Object.keys(labels).length > 0 ? labels : undefined });
                            }}
                            placeholder={formatFieldName((currentFields.find(f => Number(f.id) === Number(selectedElement.schema_field_id))?.field_name) || '')}
                            style={{ fontSize: 10, flex: 1 }}
                            className="p-inputtext-sm"
                          />
                        </div>
                        );
                      })}
                    </>
                  )}
                  {/* Label Position + Width + Control Type */}
                  <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: 10, color: colors.textMuted, fontWeight: 600, textTransform: 'uppercase' }}>Label</label>
                      <Dropdown
                        value={selectedElement.label_position || 'top'}
                        options={[
                          { label: 'Top', value: 'top' },
                          { label: 'Left', value: 'left' },
                          { label: 'None', value: 'none' },
                        ]}
                        onChange={(e) => updateElementProp({ label_position: e.value })}
                        style={{ width: '100%', fontSize: 11 }}
                        className="p-inputtext-sm"
                      />
                    </div>
                    {selectedElement.label_position === 'left' && (
                      <div style={{ width: 65 }}>
                        <label style={{ fontSize: 10, color: colors.textMuted, fontWeight: 600, textTransform: 'uppercase' }}>W (mm)</label>
                        <InputNumber
                          value={selectedElement.label_width || 25}
                          onValueChange={(e) => updateElementProp({ label_width: e.value || 25 })}
                          min={5} max={100} step={1}
                          style={{ width: '100%' }}
                          inputStyle={{ fontSize: 11, width: '100%' }}
                          className="p-inputtext-sm"
                        />
                      </div>
                    )}
                  </div>

                  {/* Control Type Override */}
                  <div style={{ marginTop: 4 }}>
                    <label style={{ fontSize: 10, color: colors.textMuted, fontWeight: 600, textTransform: 'uppercase' }}>Control</label>
                    <Dropdown
                      value={selectedElement.control_type || 'auto'}
                      options={[
                        { label: 'Auto', value: 'auto' },
                        { label: 'Checkbox', value: 'checkbox' },
                        { label: 'Combobox (Linked)', value: 'combobox' },
                      ]}
                      onChange={(e) => updateElementProp({ control_type: e.value === 'auto' ? null : e.value })}
                      style={{ width: '100%', fontSize: 11 }}
                      className="p-inputtext-sm"
                    />
                  </div>
                </>
              )}

              {(selectedElement.element_type === 'static_text' || selectedElement.element_type === 'heading') && (
                <>
                  <label style={{ fontSize: 10, color: colors.textMuted, fontWeight: 600, textTransform: 'uppercase' }}>
                    Content
                  </label>
                  <InputText
                    value={selectedElement.content || ''}
                    onChange={(e) => updateElementProp({ content: e.target.value })}
                    placeholder="Enter text..."
                    style={{ fontSize: 11 }}
                    className="p-inputtext-sm"
                  />
                </>
              )}

              {(selectedElement.element_type === 'page_number' || selectedElement.element_type === 'page_date' || selectedElement.element_type === 'page_total') && (
                <>
                  <label style={{ fontSize: 10, color: colors.textMuted, fontWeight: 600, textTransform: 'uppercase' }}>
                    Format
                  </label>
                  <InputText
                    value={selectedElement.content || ''}
                    onChange={(e) => updateElementProp({ content: e.target.value })}
                    placeholder={
                      selectedElement.element_type === 'page_number' ? 'Page {n}'
                      : selectedElement.element_type === 'page_date' ? '{date}'
                      : '{pages}'
                    }
                    style={{ fontSize: 11 }}
                    className="p-inputtext-sm"
                  />
                </>
              )}

              {/* Content translations for non-field text elements */}
              {['static_text', 'heading', 'page_number', 'page_date', 'page_total'].includes(selectedElement.element_type) && enabledLanguages.length > 0 && (
                <>
                  <label style={{ fontSize: 10, color: colors.textMuted, fontWeight: 600, textTransform: 'uppercase', marginTop: 4 }}>
                    Content Labels
                  </label>
                  {enabledLanguages.map((lang: { label: string; value: string }) => {
                    const isActiveLang = lang.value === selectedLanguage;
                    return (
                      <div key={lang.value} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{
                          fontSize: 10, width: 24, textAlign: 'right',
                          color: isActiveLang ? '#3b82f6' : colors.textMuted,
                          fontWeight: isActiveLang ? 600 : 400,
                        }}>
                          {lang.label}
                        </span>
                        <InputText
                          value={(selectedElement.caption_labels || {})[lang.value] || ''}
                          onChange={(e) => {
                            const labels = { ...(selectedElement.caption_labels || {}) };
                            if (e.target.value) {
                              labels[lang.value] = e.target.value;
                            } else {
                              delete labels[lang.value];
                            }
                            updateElementProp({ caption_labels: Object.keys(labels).length > 0 ? labels : undefined });
                          }}
                          placeholder={selectedElement.content || ''}
                          style={{ fontSize: 10, flex: 1 }}
                          className="p-inputtext-sm"
                        />
                      </div>
                    );
                  })}
                </>
              )}

              {/* Font properties (for text-bearing elements) */}
              {['field', 'static_text', 'heading', 'page_number', 'page_date', 'page_total'].includes(selectedElement.element_type) && (() => {
                // In list mode header: read/write from header_style JSON
                const isListHeader = currentForm?.form_type === 'report_list' && selectedElement.element_type === 'field' && columnSelectionMode === 'header';
                const hs = (selectedElement.header_style || {}) as Record<string, unknown>;
                const getFontVal = (prop: string, fallback: unknown) => isListHeader ? (hs[prop] ?? fallback) : (selectedElement as any)[prop] ?? fallback;
                const setFontVal = (prop: string, value: unknown) => {
                  if (isListHeader) {
                    updateElementProp({ header_style: { ...hs, [prop]: value } });
                  } else {
                    updateElementProp({ [prop]: value });
                  }
                };
                const sectionLabel = isListHeader ? 'Header Font' : 'Data Font';

                return (
                <>
                  <div style={{ borderTop: `1px solid ${colors.borderPrimary}`, margin: '4px 0' }} />
                  <label style={{ fontSize: 10, color: isListHeader ? '#f59e0b' : colors.textMuted, fontWeight: 600, textTransform: 'uppercase' }}>
                    {sectionLabel}
                  </label>

                  {/* Font family */}
                  <Dropdown
                    value={getFontVal('font_family', 'Arial') as string}
                    options={FONT_FAMILY_OPTIONS}
                    onChange={(e) => setFontVal('font_family', e.value)}
                    style={{ fontSize: 11 }}
                    className="p-inputtext-sm"
                  />

                  {/* Font size */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 10, color: colors.textMuted, width: 40 }}>Size</span>
                    <InputNumber
                      value={Number(getFontVal('font_size', 10))}
                      onValueChange={(e) => setFontVal('font_size', e.value || 10)}
                      min={4}
                      max={72}
                      suffix=" pt"
                      style={{ fontSize: 11, flex: 1 }}
                      className="p-inputtext-sm"
                    />
                  </div>

                  {/* Font weight */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 10, color: colors.textMuted, width: 40 }}>Weight</span>
                    <Dropdown
                      value={getFontVal('font_weight', 'normal') as string}
                      options={FONT_WEIGHT_OPTIONS}
                      onChange={(e) => setFontVal('font_weight', e.value)}
                      style={{ fontSize: 11, flex: 1 }}
                      className="p-inputtext-sm"
                    />
                  </div>

                  {/* Font style */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 10, color: colors.textMuted, width: 40 }}>Style</span>
                    <Dropdown
                      value={getFontVal('font_style', 'normal') as string}
                      options={FONT_STYLE_OPTIONS}
                      onChange={(e) => setFontVal('font_style', e.value)}
                      style={{ fontSize: 11, flex: 1 }}
                      className="p-inputtext-sm"
                    />
                  </div>

                  {/* Text decoration */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 10, color: colors.textMuted, width: 40 }}>Decor</span>
                    <Dropdown
                      value={getFontVal('text_decoration', 'none') as string}
                      options={TEXT_DECORATION_OPTIONS}
                      onChange={(e) => setFontVal('text_decoration', e.value)}
                      style={{ fontSize: 11, flex: 1 }}
                      className="p-inputtext-sm"
                    />
                  </div>

                  {/* Text align */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 10, color: colors.textMuted, width: 40 }}>Align</span>
                    <Dropdown
                      value={getFontVal('text_align', 'left') as string}
                      options={TEXT_ALIGN_OPTIONS}
                      onChange={(e) => setFontVal('text_align', e.value)}
                      style={{ fontSize: 11, flex: 1 }}
                      className="p-inputtext-sm"
                    />
                  </div>

                  {/* Text color */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 10, color: colors.textMuted, width: 40 }}>Color</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1 }}>
                      <input type="color" value={String(getFontVal('text_color', '#000000')) || '#000000'} onChange={(e) => setFontVal('text_color', e.target.value)} style={{ width: 28, height: 22, padding: 0, border: "1px solid var(--theme-border-primary)", borderRadius: 3, cursor: "pointer" }} />
                      <InputText
                        value={String(getFontVal('text_color', '#000000'))}
                        onChange={(e) => setFontVal('text_color', e.target.value)}
                        style={{ fontSize: 10, flex: 1 }}
                        className="p-inputtext-sm"
                      />
                    </div>
                  </div>
                </>
                );
              })()}

              {/* Line properties */}
              {(selectedElement.element_type === 'line_horizontal' || selectedElement.element_type === 'line_vertical') && (
                <>
                  <div style={{ borderTop: `1px solid ${colors.borderPrimary}`, margin: '4px 0' }} />
                  <label style={{ fontSize: 10, color: colors.textMuted, fontWeight: 600, textTransform: 'uppercase' }}>
                    Line
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 10, color: colors.textMuted, width: 50 }}>Width</span>
                    <InputNumber
                      value={selectedElement.border_width || 1}
                      onValueChange={(e) => updateElementProp({ border_width: e.value || 1 })}
                      min={0.5}
                      max={20}
                      minFractionDigits={1}
                      maxFractionDigits={1}
                      suffix=" px"
                      style={{ fontSize: 11, flex: 1 }}
                      className="p-inputtext-sm"
                    />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 10, color: colors.textMuted, width: 50 }}>Color</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1 }}>
                      <input type="color" value={selectedElement.border_color || '#000000'} onChange={(e) => updateElementProp({ border_color: e.target.value })} style={{ width: 28, height: 22, padding: 0, border: "1px solid var(--theme-border-primary)", borderRadius: 3, cursor: "pointer" }} />
                      <InputText
                        value={selectedElement.border_color || '#000000'}
                        onChange={(e) => updateElementProp({ border_color: e.target.value })}
                        style={{ fontSize: 10, flex: 1 }}
                        className="p-inputtext-sm"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Box properties */}
              {selectedElement.element_type === 'box' && (
                <>
                  <div style={{ borderTop: `1px solid ${colors.borderPrimary}`, margin: '4px 0' }} />
                  <label style={{ fontSize: 10, color: colors.textMuted, fontWeight: 600, textTransform: 'uppercase' }}>
                    Box / Frame
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 10, color: colors.textMuted, width: 60 }}>Border W</span>
                    <InputNumber
                      value={selectedElement.border_width || 1}
                      onValueChange={(e) => updateElementProp({ border_width: e.value || 1 })}
                      min={0}
                      max={20}
                      minFractionDigits={1}
                      maxFractionDigits={1}
                      suffix=" px"
                      style={{ fontSize: 11, flex: 1 }}
                      className="p-inputtext-sm"
                    />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 10, color: colors.textMuted, width: 60 }}>Border C</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1 }}>
                      <input type="color" value={selectedElement.border_color || '#000000'} onChange={(e) => updateElementProp({ border_color: e.target.value })} style={{ width: 28, height: 22, padding: 0, border: "1px solid var(--theme-border-primary)", borderRadius: 3, cursor: "pointer" }} />
                      <InputText
                        value={selectedElement.border_color || '#000000'}
                        onChange={(e) => updateElementProp({ border_color: e.target.value })}
                        style={{ fontSize: 10, flex: 1 }}
                        className="p-inputtext-sm"
                      />
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 10, color: colors.textMuted, width: 60 }}>Bg Color</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1 }}>
                      <input type="color" value={selectedElement.background_color || '#ffffff'} onChange={(e) => updateElementProp({ background_color: e.target.value })} style={{ width: 28, height: 22, padding: 0, border: "1px solid var(--theme-border-primary)", borderRadius: 3, cursor: "pointer" }} />
                      <InputText
                        value={selectedElement.background_color || ''}
                        onChange={(e) => updateElementProp({ background_color: e.target.value || undefined })}
                        placeholder="transparent"
                        style={{ fontSize: 10, flex: 1 }}
                        className="p-inputtext-sm"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Image upload (for image_placeholder) */}
              {selectedElement.element_type === 'image_placeholder' && currentPattern && (() => {
                let imgIds: Record<string, number> = {};
                try { if (selectedElement.content) imgIds = JSON.parse(selectedElement.content); } catch { /* not JSON */ }
                return (
                  <ImageUploadSection
                    patternId={currentPattern.id}
                    elementId={selectedElement.id}
                    selectedLanguage={selectedLanguage}
                    enabledLanguages={enabledLanguages}
                    imageIds={imgIds}
                    onImageIdsChange={(ids) => updateElementProp({ content: Object.keys(ids).length > 0 ? JSON.stringify(ids) : undefined })}
                    colors={colors}
                  />
                );
              })()}

              {/* Position & Size */}
              <div style={{ borderTop: `1px solid ${colors.borderPrimary}`, margin: '4px 0' }} />
              <label style={{ fontSize: 10, color: colors.textMuted, fontWeight: 600, textTransform: 'uppercase' }}>
                Position & Size ({paperUnit})
              </label>

              <div className="report-pos-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                <div>
                  <span style={{ fontSize: 9, color: colors.textMuted }}>X</span>
                  <InputNumber
                    value={liveGeometry?.x ?? selectedElement.x_position}
                    onValueChange={(e) => {
                      const val = e.value ?? 0;
                      updateElementProp({ x_position: val });
                      setLiveGeometry(prev => prev ? { ...prev, x: val } : null);
                    }}
                    min={0}
                    minFractionDigits={1}
                    maxFractionDigits={1}
                    inputStyle={{ fontSize: 10, padding: '4px 6px', width: '100%' }}
                    className="p-inputtext-sm report-pos-input"
                  />
                </div>
                <div>
                  <span style={{ fontSize: 9, color: colors.textMuted }}>Y</span>
                  <InputNumber
                    value={liveGeometry?.y ?? selectedElement.y_position}
                    onValueChange={(e) => {
                      const val = e.value ?? 0;
                      updateElementProp({ y_position: val });
                      setLiveGeometry(prev => prev ? { ...prev, y: val } : null);
                    }}
                    min={0}
                    minFractionDigits={1}
                    maxFractionDigits={1}
                    inputStyle={{ fontSize: 10, padding: '4px 6px', width: '100%' }}
                    className="p-inputtext-sm report-pos-input"
                  />
                </div>
                <div>
                  <span style={{ fontSize: 9, color: colors.textMuted }}>W</span>
                  <InputNumber
                    value={liveGeometry?.w ?? selectedElement.width}
                    onValueChange={(e) => {
                      const val = e.value ?? 1;
                      updateElementProp({ width: val });
                      setLiveGeometry(prev => prev ? { ...prev, w: val } : null);
                    }}
                    min={0.1}
                    minFractionDigits={1}
                    maxFractionDigits={1}
                    inputStyle={{ fontSize: 10, padding: '4px 6px', width: '100%' }}
                    className="p-inputtext-sm report-pos-input"
                  />
                </div>
                <div>
                  <span style={{ fontSize: 9, color: colors.textMuted }}>H</span>
                  <InputNumber
                    value={liveGeometry?.h ?? selectedElement.height}
                    onValueChange={(e) => {
                      const val = e.value ?? 1;
                      updateElementProp({ height: val });
                      setLiveGeometry(prev => prev ? { ...prev, h: val } : null);
                    }}
                    min={0.1}
                    minFractionDigits={1}
                    maxFractionDigits={1}
                    inputStyle={{ fontSize: 10, padding: '4px 6px', width: '100%' }}
                    className="p-inputtext-sm report-pos-input"
                  />
                </div>
              </div>

              {/* Z-Order + Delete */}
              <div style={{ borderTop: `1px solid ${colors.borderPrimary}`, margin: '4px 0' }} />
              <div style={{ display: 'flex', gap: 4 }}>
                <Button
                  icon="pi pi-angle-down" label="Back"
                  severity="secondary" size="small" outlined
                  onClick={() => {
                    if (!selectedElement) return;
                    updateElementProp({ sort_order: (selectedElement.sort_order || 0) - 1 });
                  }}
                  style={{ flex: 1, fontSize: 10 }}
                />
                <Button
                  icon="pi pi-angle-up" label="Front"
                  severity="secondary" size="small" outlined
                  onClick={() => {
                    if (!selectedElement) return;
                    updateElementProp({ sort_order: (selectedElement.sort_order || 0) + 1 });
                  }}
                  style={{ flex: 1, fontSize: 10 }}
                />
              </div>
              <Button
                label="Delete"
                icon="pi pi-trash"
                severity="danger"
                size="small"
                outlined
                onClick={handleDeleteElement}
                style={{ width: '100%', fontSize: 11 }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Compact styles for position/size inputs */}
      <style>{`
        .report-pos-input .p-inputnumber { width: 100% !important; }
        .report-pos-input .p-inputnumber-input { width: 100% !important; min-width: 0 !important; }
        .report-pos-grid { max-width: 100%; overflow: hidden; }
        .properties-panel .p-inputtext-sm .p-inputnumber-input { min-width: 0 !important; }
        .properties-panel .p-inputtext-sm { width: 100% !important; }
        .properties-panel .p-dropdown { width: 100% !important; }
      `}</style>

      {/* Live Preview Modal */}
      {currentForm && (
        <ReportLivePreviewModal
          visible={showLivePreview}
          onHide={() => setShowLivePreview(false)}
          form={currentForm}
          elements={currentForm.elements || []}
          layoutElements={layoutElements}
          schemaFields={currentFields}
          tableName={tables.find(t => Number(t.id) === Number(selectedTableId))?.table_name}
          projectId={selectedProject?.id}
          projectDbSettings={selectedProject ? {
            database_type: selectedProject.database_type,
            database_server: selectedProject.database_server,
            database_port: selectedProject.database_port,
            database_name: selectedProject.database_name,
            database_username: selectedProject.database_username,
            database_password: selectedProject.database_password,
          } : undefined}
          selectedLanguage={selectedLanguage}
          enabledLanguages={enabledLanguages}
          patternName={patterns.find(p => p.id === selectedPatternId)?.name}
          dateFormats={projectDateFormats}
        />
      )}
    </div>
  );
};

// ========== MAIN EXPORT (with ReactFlowProvider) ==========

const ReportLayoutDesignerPanel: React.FC<ReportLayoutDesignerPanelProps> = (props) => {
  return (
    <ReactFlowProvider>
      <ReportLayoutDesignerInner {...props} />
    </ReactFlowProvider>
  );
};

export default ReportLayoutDesignerPanel;
