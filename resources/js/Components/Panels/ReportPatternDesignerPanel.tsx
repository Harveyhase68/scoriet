import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Checkbox } from 'primereact/checkbox';
// ColorPicker: using native <input type="color"> instead of PrimeReact (auto-closes, no overlay issues)
import { ProgressSpinner } from 'primereact/progressspinner';
import {
    ReactFlow, MiniMap, Controls, Background, BackgroundVariant,
    useNodesState, useEdgesState, Node, NodeResizer,
    ReactFlowProvider, useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useTheme } from '@/contexts/ThemeContext';
import { useToast } from '@/contexts/ToastContext';
import { useProject } from '@/contexts/ProjectContext';
import { useTranslation, SupportedLanguage, getStoredLanguage } from '@/i18n';
import ImageUploadSection from './ReportImageUpload';

// ============ INTERFACES ============

interface ReportPattern {
    id: number;
    name: string;
    description?: string;
    creator_user_id: number;
    visibility: string;
    is_active: boolean;
    forms?: ReportPatternForm[];
    creator?: { id: number; name: string };
}

interface ReportPatternForm {
    id: number;
    report_pattern_id: number;
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
    sort_order: number;
    elements?: ReportPatternElement[];
}

interface ReportPatternElement {
    id?: number;
    report_pattern_form_id: number;
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
    content_labels?: Record<string, string>;
    font_family?: string;
    font_size?: number;
    font_weight?: string;
    font_style?: string;
    text_decoration?: string;
    text_align?: string;
    text_color?: string;
    border_width?: number;
    border_color?: string;
    background_color?: string;
    label?: string;
    linked_element_id?: number;
    sort_order: number;
    is_visible: boolean;
}

interface PaperNodeData {
    paperWidth: number;
    paperHeight: number;
    marginTop: number;
    marginRight: number;
    marginBottom: number;
    marginLeft: number;
    paperUnit: string;
    paperSizeLabel: string;
    showRuler: boolean;
    [key: string]: unknown;
}

interface PatternElementNodeData {
    element: ReportPatternElement;
    linkedHeader?: ReportPatternElement;
    listStyleConfig?: Record<string, unknown>;
    onSelect: (element: ReportPatternElement) => void;
    onHeaderDividerDrag?: (headerHeight: number, detailHeight: number) => void;
    onTableSectionSelect?: (section: 'header' | 'detail' | null) => void;
    isSelected: boolean;
    paperUnit: string;
    selectedLanguage: string | null;
    selectedTableSection?: 'header' | 'detail' | null;
    [key: string]: unknown;
}

interface ReportPatternDesignerPanelProps {
    reportPatternId?: number;
    onOpenPanel?: (panelType: string, data?: Record<string, unknown>) => void;
}

// ============ CONSTANTS ============

const MM_TO_PX = 96 / 25.4; // ~3.78
const INCH_TO_PX = 96;

const unitToPx = (val: number, unit: string): number =>
    unit === 'inch' ? val * INCH_TO_PX : val * MM_TO_PX;

const pxToUnit = (val: number, unit: string): number =>
    unit === 'inch' ? val / INCH_TO_PX : val / MM_TO_PX;

const PAPER_SIZES: Record<string, { width: number; height: number }> = {
    'A4': { width: 210, height: 297 },
    'A3': { width: 297, height: 420 },
    'A5': { width: 148, height: 210 },
    'Letter': { width: 215.9, height: 279.4 },
    'Legal': { width: 215.9, height: 355.6 },
};

// Normalize color value for <input type="color"> — must be exactly #rrggbb
const safeColor = (val: unknown, fallback = '#000000'): string => {
  if (!val || typeof val !== 'string' || val.trim() === '') return fallback;
  let c = val.trim();
  // Add # if missing
  if (c.length === 6 && !c.startsWith('#')) c = '#' + c;
  if (c.length === 3 && !c.startsWith('#')) c = '#' + c;
  // Expand shorthand #rgb to #rrggbb
  if (c.length === 4 && c.startsWith('#')) c = '#' + c[1] + c[1] + c[2] + c[2] + c[3] + c[3];
  // Validate
  if (c.length === 7 && c.startsWith('#')) return c;
  return fallback;
};

const SECTION_PALETTE = [
    { type: 'container', icon: 'pi-box', label: 'Container', defaultWidth: 180, defaultHeight: 80, category: 'sections' },
    { type: 'header_section', icon: 'pi-arrow-up', label: 'Header Section', defaultWidth: 180, defaultHeight: 30, category: 'sections' },
    { type: 'detail_section', icon: 'pi-list', label: 'Detail Section', defaultWidth: 180, defaultHeight: 150, category: 'sections' },
    { type: 'footer_section', icon: 'pi-arrow-down', label: 'Footer Section', defaultWidth: 180, defaultHeight: 30, category: 'sections' },
];

const REPORT_CONTROLS_PALETTE = [
    { type: 'static_text', icon: 'pi-align-left', label: 'Static Text', defaultWidth: 80, defaultHeight: 5, category: 'text', defaultContent: '{:tablename:}' },
    { type: 'heading', icon: 'pi-header', label: 'Heading', defaultWidth: 100, defaultHeight: 7, category: 'text', defaultContent: '{:tablename:}' },
    { type: 'line_horizontal', icon: 'pi-minus', label: 'Horiz. Line', defaultWidth: 180, defaultHeight: 0.5, category: 'layout' },
    { type: 'line_vertical', icon: 'pi-ellipsis-v', label: 'Vert. Line', defaultWidth: 0.5, defaultHeight: 50, category: 'layout' },
    { type: 'box', icon: 'pi-stop', label: 'Box / Frame', defaultWidth: 80, defaultHeight: 40, category: 'layout' },
    { type: 'page_number', icon: 'pi-hashtag', label: 'Page Number', defaultWidth: 30, defaultHeight: 5, category: 'placeholders', defaultContent: '{:pagenumber:} / {:pagestotal:}' },
    { type: 'page_date', icon: 'pi-calendar', label: 'Print Date', defaultWidth: 30, defaultHeight: 5, category: 'placeholders', defaultContent: '{:printdate:} {:printtime:}' },
    { type: 'page_total', icon: 'pi-sort-numeric-up', label: 'Total Pages', defaultWidth: 20, defaultHeight: 5, category: 'placeholders', defaultContent: '{:pagestotal:}' },
    { type: 'image_placeholder', icon: 'pi-image', label: 'Image / Logo', defaultWidth: 40, defaultHeight: 20, category: 'media' },
];

// Combined palette for lookup
const ELEMENT_PALETTE = [...SECTION_PALETTE, ...REPORT_CONTROLS_PALETTE];

const PAPER_SIZE_OPTIONS = [
    { label: 'A4 (210 x 297 mm)', value: 'A4' },
    { label: 'A3 (297 x 420 mm)', value: 'A3' },
    { label: 'A5 (148 x 210 mm)', value: 'A5' },
    { label: 'Letter (215.9 x 279.4 mm)', value: 'Letter' },
    { label: 'Legal (215.9 x 355.6 mm)', value: 'Legal' },
    { label: 'Custom', value: 'Custom' },
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


const getAuthHeaders = () => {
    const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
    return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    };
};

// ============ CUSTOM NODES ============

const PaperNode = React.memo(({ data }: { data: PaperNodeData }) => {
    const { paperWidth, paperHeight, marginTop, marginRight, marginBottom, marginLeft, paperUnit, paperSizeLabel, showRuler } = data;

    const pxPerUnit = paperUnit === 'inch' ? INCH_TO_PX : MM_TO_PX;
    const unitLabel = paperUnit === 'inch' ? 'in' : 'mm';

    // Ruler ticks: major (number) every 10mm/1in, medium every 5mm/0.5in, minor every 1mm/0.1in
    const majorStep = paperUnit === 'inch' ? 1 : 10;
    const mediumStep = paperUnit === 'inch' ? 0.5 : 5;
    const minorStep = paperUnit === 'inch' ? 0.125 : 1;

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

    const hTicks = showRuler ? buildTicks(paperWidth) : [];
    const vTicks = showRuler ? buildTicks(paperHeight) : [];

    return (
        <div style={{ position: 'relative', pointerEvents: 'none' }}>
            {/* Horizontal Ruler */}
            {showRuler && (
                <div style={{
                    position: 'absolute', top: -20, left: 0, width: paperWidth, height: 20,
                    backgroundColor: 'rgba(30,40,60,0.85)', overflow: 'hidden',
                }}>
                    {hTicks.map(tick => (
                        <div key={`h-${tick.unitVal}`} style={{
                            position: 'absolute', left: tick.pos, bottom: 0,
                        }}>
                            <div style={{
                                width: 1,
                                height: tick.type === 'major' ? 12 : tick.type === 'medium' ? 7 : 3,
                                backgroundColor: tick.type === 'major' ? '#d1d5db' : tick.type === 'medium' ? '#9ca3af' : '#6b7280',
                            }} />
                            {tick.type === 'major' && (
                                <span style={{
                                    position: 'absolute', bottom: 12, left: 2,
                                    fontSize: 8, color: '#d1d5db', whiteSpace: 'nowrap', lineHeight: 1,
                                }}>
                                    {paperUnit === 'inch' ? tick.unitVal : Math.round(tick.unitVal)}
                                </span>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Vertical Ruler */}
            {showRuler && (
                <div style={{
                    position: 'absolute', top: 0, left: -22, width: 22, height: paperHeight,
                    backgroundColor: 'rgba(30,40,60,0.85)', overflow: 'hidden',
                }}>
                    {vTicks.map(tick => (
                        <div key={`v-${tick.unitVal}`} style={{
                            position: 'absolute', top: tick.pos, right: 0,
                        }}>
                            <div style={{
                                height: 1,
                                width: tick.type === 'major' ? 12 : tick.type === 'medium' ? 7 : 3,
                                backgroundColor: tick.type === 'major' ? '#d1d5db' : tick.type === 'medium' ? '#9ca3af' : '#6b7280',
                            }} />
                            {tick.type === 'major' && (
                                <span style={{
                                    position: 'absolute', right: 14, top: -4,
                                    fontSize: 8, color: '#d1d5db', whiteSpace: 'nowrap', lineHeight: 1,
                                }}>
                                    {paperUnit === 'inch' ? tick.unitVal : Math.round(tick.unitVal)}
                                </span>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Paper */}
            <div style={{
                width: paperWidth, height: paperHeight,
                backgroundColor: '#ffffff', border: '1px solid #d1d5db',
                boxShadow: '4px 4px 12px rgba(0,0,0,0.3)', position: 'relative',
            }}>
                {/* Margin guides */}
                <div style={{ position: 'absolute', top: marginTop, left: 0, width: '100%', height: 0, borderTop: '1px dashed rgba(59,130,246,0.4)' }} />
                <div style={{ position: 'absolute', bottom: marginBottom, left: 0, width: '100%', height: 0, borderTop: '1px dashed rgba(59,130,246,0.4)' }} />
                <div style={{ position: 'absolute', left: marginLeft, top: 0, width: 0, height: '100%', borderLeft: '1px dashed rgba(59,130,246,0.4)' }} />
                <div style={{ position: 'absolute', right: marginRight, top: 0, width: 0, height: '100%', borderLeft: '1px dashed rgba(59,130,246,0.4)' }} />

                {/* Paper size label */}
                <div style={{
                    position: 'absolute', bottom: 4, right: 8, fontSize: 9, color: '#9ca3af',
                    pointerEvents: 'none',
                }}>
                    {paperSizeLabel} {unitLabel}
                </div>
            </div>
        </div>
    );
});
PaperNode.displayName = 'PaperNode';

// Separate component for combined detail+header so it has its own useState for divider drag
const CombinedDetailHeaderNode: React.FC<{
    data: PatternElementNodeData;
    element: ReportPatternElement;
    linkedHeader: ReportPatternElement;
    selected?: boolean;
    paperUnit: string;
    unitLabel: string;
}> = ({ data, element, linkedHeader, selected, paperUnit, unitLabel }) => {
    const [dividerOffset, setDividerOffset] = useState(0);
    const draggingRef = useRef(false);

    const baseHeaderHPx = unitToPx(Number(linkedHeader.height), paperUnit);
    const headerHPx = baseHeaderHPx + dividerOffset;
    const ls = (data.listStyleConfig || {}) as Record<string, unknown>;
    const selSection = data.selectedTableSection;

    // Dummy columns based on available width
    const widthPx = unitToPx(Number(element.width), paperUnit);
    const numCols = widthPx > 500 ? 7 : widthPx > 300 ? 5 : 4;
    const colW = widthPx / numCols;
    const rowH = unitToPx(Number(element.field_height || 5), paperUnit);
    const numDetailRows = Math.max(2, Math.floor((unitToPx(Number(element.height), paperUnit) - 4) / Math.max(rowH, 12)));
    const sampleHeaders = ['ID', 'Name', 'Description', 'Price', 'Qty', 'Date', 'Status'];
    const sampleData = [
        ['1', 'Product A', 'Description...', '29.90', '150', '01.01.2026', 'Active'],
        ['2', 'Product B', 'Lorem ipsum', '49.50', '85', '15.03.2026', 'Pending'],
        ['3', 'Product C', 'Sample text', '12.00', '320', '22.06.2026', 'Active'],
        ['4', 'Product D', 'Test entry', '99.99', '42', '30.09.2026', 'Inactive'],
        ['5', 'Product E', 'Another one', '5.75', '999', '12.12.2026', 'Active'],
    ];

    // Style values from list_style_config (with per-side fallbacks)
    const hdrBg = (ls.header_bg_color as string) || '#e0e0e0';
    const hdrColor = (ls.header_text_color as string) || '#000000';
    const outerBorderW = Number(ls.outer_border_width ?? 1);
    const outerBorderColor = (ls.outer_border_color as string) || '#000000';

    // Header borders per side
    const hdrBorderTop = `${Number(ls.header_border_top_width ?? outerBorderW)}px ${(ls.header_border_top_style as string) || 'solid'} ${(ls.header_border_top_color as string) || outerBorderColor}`;
    const hdrBorderLeft = `${Number(ls.header_border_left_width ?? outerBorderW)}px ${(ls.header_border_left_style as string) || 'solid'} ${(ls.header_border_left_color as string) || outerBorderColor}`;
    const hdrBorderRight = `${Number(ls.header_border_right_width ?? outerBorderW)}px ${(ls.header_border_right_style as string) || 'solid'} ${(ls.header_border_right_color as string) || outerBorderColor}`;
    const hdrBorderBottom = `${Number(ls.header_border_bottom_width ?? ls.header_border_bottom ?? 1)}px ${(ls.header_border_bottom_style as string) || 'solid'} ${(ls.header_border_bottom_color as string) || outerBorderColor}`;

    // Detail borders per side
    const detBorderLeft = `${Number(ls.detail_border_left_width ?? outerBorderW)}px ${(ls.detail_border_left_style as string) || 'solid'} ${(ls.detail_border_left_color as string) || outerBorderColor}`;
    const detBorderRight = `${Number(ls.detail_border_right_width ?? outerBorderW)}px ${(ls.detail_border_right_style as string) || 'solid'} ${(ls.detail_border_right_color as string) || outerBorderColor}`;
    const detBorderBottom = `${Number(ls.detail_border_bottom_width ?? outerBorderW)}px ${(ls.detail_border_bottom_style as string) || 'solid'} ${(ls.detail_border_bottom_color as string) || outerBorderColor}`;

    // Row + column separators
    const evenBg = (ls.row_even_bg_color as string) || '#ffffff';
    const oddBg = (ls.row_odd_bg_color as string) || '#f5f5f5';
    const rowBorderBtm = `${Number(ls.row_border_bottom_width ?? ls.row_border_bottom ?? 0.5)}px ${(ls.row_border_bottom_style as string) || 'solid'} ${(ls.row_border_bottom_color as string) || (ls.row_border_color as string) || '#cccccc'}`;
    const colSep = `${Number(ls.column_separator_width ?? 0.5)}px ${(ls.column_separator_style as string) || 'solid'} ${(ls.column_separator_color as string) || '#cccccc'}`;

    const handleDividerMouseDown = useCallback((e: React.MouseEvent) => {
        e.stopPropagation(); e.preventDefault();
        draggingRef.current = true;
        const startY = e.clientY;
        const onMove = (ev: MouseEvent) => { if (draggingRef.current) setDividerOffset(ev.clientY - startY); };
        const onUp = (ev: MouseEvent) => {
            draggingRef.current = false;
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
            const ppu = paperUnit === 'inch' ? INCH_TO_PX : MM_TO_PX;
            const deltaUnit = (ev.clientY - startY) / ppu;
            const minH = paperUnit === 'inch' ? 0.3 : 5;
            setDividerOffset(0);
            if (data.onHeaderDividerDrag) {
                data.onHeaderDividerDrag(
                    Math.max(minH, Math.round((Number(linkedHeader.height) + deltaUnit) * 100) / 100),
                    Math.max(minH, Math.round((Number(element.height) - deltaUnit) * 100) / 100)
                );
            }
        };
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
    }, [data, element, linkedHeader, paperUnit]);

    return (
        <div style={{ width: '100%', height: '100%', position: 'relative', cursor: 'move' }}>
            <NodeResizer color="#fbbf24" isVisible={!!selected} minWidth={60} minHeight={40}
                handleStyle={{ width: 8, height: 8, borderRadius: 2 }} lineStyle={{ borderWidth: 2 }} />

            {/* === TABLE HEADER ZONE (top) === */}
            <div
                className="nopan"
                onClick={(e) => { e.stopPropagation(); data.onTableSectionSelect?.('header'); }}
                style={{
                    position: 'absolute', top: 0, left: 0, right: 0,
                    height: Math.max(16, headerHPx),
                    borderRadius: '4px 4px 0 0',
                    overflow: 'hidden', cursor: 'pointer',
                    boxShadow: selSection === 'header' ? 'inset 0 0 0 2px #f59e0b' : 'none',
                }}
            >
                {/* Label */}
                <div style={{
                    padding: '1px 6px', fontSize: 8, fontWeight: 600, color: '#06b6d4',
                    backgroundColor: 'rgba(6,182,212,0.1)',
                    display: 'flex', justifyContent: 'space-between',
                }}>
                    <span><i className="pi pi-link" style={{ fontSize: 7, marginRight: 2 }} />Table Header</span>
                    <span style={{ color: '#9ca3af' }}>{(Number(linkedHeader.height) + pxToUnit(dividerOffset, paperUnit)).toFixed(1)} {unitLabel}</span>
                </div>
                {/* Dummy header row (bottom-aligned) */}
                <div style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0,
                    display: 'flex', height: Math.min(rowH, headerHPx - 12),
                    backgroundColor: hdrBg,
                    borderTop: hdrBorderTop,
                    borderLeft: hdrBorderLeft,
                    borderRight: hdrBorderRight,
                    borderBottom: hdrBorderBottom,
                }}>
                    {Array.from({ length: numCols }).map((_, i) => (
                        <div key={`h-${i}`} style={{
                            width: colW, display: 'flex', alignItems: 'center', padding: '0 3px',
                            fontSize: 8, fontWeight: 'bold', color: hdrColor,
                            borderRight: i < numCols - 1 ? colSep : 'none',
                            overflow: 'hidden', whiteSpace: 'nowrap',
                        }}>
                            {sampleHeaders[i] || `Col ${i + 1}`}
                        </div>
                    ))}
                </div>
            </div>

            {/* === DIVIDER === */}
            <div className="nopan nodrag nowheel" style={{
                position: 'absolute', top: Math.max(6, headerHPx - 5), left: 0, right: 0,
                height: 11, cursor: 'row-resize', zIndex: 20,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
            }} onMouseDown={handleDividerMouseDown}>
                <div style={{
                    width: '40%', height: 3,
                    backgroundColor: dividerOffset !== 0 ? '#fbbf24' : (selected ? '#fbbf24' : '#9ca3af'),
                    borderRadius: 2,
                }} />
            </div>

            {/* === DETAIL ZONE (bottom) === */}
            <div
                className="nopan"
                onClick={(e) => { e.stopPropagation(); data.onTableSectionSelect?.('detail'); }}
                style={{
                    position: 'absolute', top: Math.max(16, headerHPx), left: 0, right: 0, bottom: 0,
                    borderRadius: '0 0 4px 4px',
                    overflow: 'hidden', cursor: 'pointer',
                    boxShadow: selSection === 'detail' ? 'inset 0 0 0 2px #f59e0b' : 'none',
                }}
            >
                {/* Label */}
                <div style={{
                    padding: '1px 6px', fontSize: 8, fontWeight: 600, color: '#8b5cf6',
                    backgroundColor: 'rgba(139,92,246,0.1)',
                    display: 'flex', justifyContent: 'space-between',
                }}>
                    <span>{element.label || 'Detail'}</span>
                    <span style={{ color: '#9ca3af' }}>{Number(element.width).toFixed(1)} x {Number(element.height).toFixed(1)} {unitLabel}</span>
                </div>
                {/* Dummy data rows */}
                <div style={{
                    borderLeft: detBorderLeft,
                    borderRight: detBorderRight,
                    borderBottom: detBorderBottom,
                }}>
                    {Array.from({ length: Math.min(numDetailRows, sampleData.length) }).map((_, rowIdx) => (
                        <div key={`r-${rowIdx}`} style={{
                            display: 'flex',
                            height: Math.min(rowH, 16),
                            backgroundColor: rowIdx % 2 === 0 ? evenBg : oddBg,
                            borderBottom: rowIdx < numDetailRows - 1 ? rowBorderBtm : 'none',
                        }}>
                            {Array.from({ length: numCols }).map((_, colIdx) => (
                                <div key={`c-${rowIdx}-${colIdx}`} style={{
                                    width: colW, display: 'flex', alignItems: 'center', padding: '0 3px',
                                    fontSize: 7, color: '#333',
                                    borderRight: colIdx < numCols - 1 ? colSep : 'none',
                                    overflow: 'hidden', whiteSpace: 'nowrap',
                                }}>
                                    {sampleData[rowIdx]?.[colIdx] || '—'}
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const PatternElementNode = React.memo(({ data, selected }: { data: PatternElementNodeData; selected?: boolean }) => {
    const { element, paperUnit, selectedLanguage: lang } = data;
    const et = element.element_type;
    const unitLabel = paperUnit === 'inch' ? 'in' : 'mm';
    // Use language-specific content if available
    const displayContent = (lang && element.content_labels && element.content_labels[lang]) || element.content || element.label;

    const sectionTypes = ['container', 'header_section', 'detail_section', 'footer_section', 'table_header'];
    const isSection = sectionTypes.includes(et);

    const typeLabels: Record<string, string> = {
        container: 'Container', header_section: 'Header', detail_section: 'Detail', footer_section: 'Footer',
        table_header: 'Table Header',
        static_text: 'Static Text', heading: 'Heading',
        line_horizontal: 'H-Line', line_vertical: 'V-Line', box: 'Box',
        page_number: 'Page #', page_date: 'Date', page_total: 'Total Pages',
        image_placeholder: 'Image',
    };

    const typeColors: Record<string, string> = {
        container: '#3b82f6', header_section: '#10b981', detail_section: '#8b5cf6', footer_section: '#f59e0b',
        table_header: '#06b6d4',
        static_text: '#6b7280', heading: '#6b7280', line_horizontal: '#374151', line_vertical: '#374151',
        box: '#374151', page_number: '#a855f7', page_date: '#a855f7', page_total: '#a855f7',
        image_placeholder: '#a855f7',
    };

    const borderColor = selected ? '#fbbf24' : (typeColors[et] || '#6b7280');

    // Report control rendering
    if (!isSection) {
        // Horizontal line
        if (et === 'line_horizontal') {
            return (
                <div style={{ width: '100%', height: '100%', position: 'relative', display: 'flex', alignItems: 'center', cursor: 'move' }}>
                    <NodeResizer color="#fbbf24" isVisible={!!selected} minWidth={10} minHeight={2} handleStyle={{ width: 7, height: 7 }} />
                    <div style={{ width: '100%', height: Math.max(1, element.border_width || 1), backgroundColor: element.border_color || '#000000' }} />
                </div>
            );
        }
        // Vertical line
        if (et === 'line_vertical') {
            return (
                <div style={{ width: '100%', height: '100%', position: 'relative', display: 'flex', justifyContent: 'center', cursor: 'move' }}>
                    <NodeResizer color="#fbbf24" isVisible={!!selected} minWidth={2} minHeight={10} handleStyle={{ width: 7, height: 7 }} />
                    <div style={{ width: Math.max(1, element.border_width || 1), height: '100%', backgroundColor: element.border_color || '#000000' }} />
                </div>
            );
        }
        // Box/Frame
        if (et === 'box') {
            return (
                <div style={{ width: '100%', height: '100%', position: 'relative', cursor: 'move' }}>
                    <NodeResizer color="#fbbf24" isVisible={!!selected} minWidth={10} minHeight={10} handleStyle={{ width: 7, height: 7 }} />
                    <div style={{ width: '100%', height: '100%', border: `${element.border_width || 1}px solid ${element.border_color || '#000000'}`, borderRadius: 2, backgroundColor: element.background_color || 'transparent' }} />
                </div>
            );
        }
        // Image placeholder
        if (et === 'image_placeholder') {
            let imageUrl: string | null = null;
            try {
                if (element.content) {
                    const imgIds = JSON.parse(element.content);
                    const imgId = imgIds[lang || 'all'] || imgIds['all'];
                    if (imgId) imageUrl = `/api/report-images/${imgId}/data`;
                }
            } catch { /* not JSON */ }
            return (
                <div style={{ width: '100%', height: '100%', position: 'relative', cursor: 'move' }}>
                    <NodeResizer color="#fbbf24" isVisible={!!selected} minWidth={15} minHeight={10} handleStyle={{ width: 7, height: 7 }} />
                    {imageUrl ? (
                        <img src={imageUrl} alt="Image" style={{
                            width: '100%', height: '100%', objectFit: 'contain',
                            border: selected ? '1px solid #fbbf24' : '1px dashed rgba(168,85,247,0.2)',
                            borderRadius: 4,
                        }} />
                    ) : (
                        <div style={{ width: '100%', height: '100%', border: '2px dashed rgba(168,85,247,0.3)', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: '#a855f7', gap: 2 }}>
                            <i className="pi pi-image" style={{ fontSize: 14, opacity: 0.5 }} />
                            <span style={{ fontSize: 8 }}>Image / Logo</span>
                        </div>
                    )}

                </div>
            );
        }
        // Text-based controls (static_text, heading, page_number, page_date, page_total)
        const fontStyle: React.CSSProperties = {
            fontFamily: element.font_family || 'Arial',
            fontSize: element.font_size || (et === 'heading' ? 14 : 10),
            fontWeight: (element.font_weight || (et === 'heading' ? 'bold' : 'normal')) as any,
            fontStyle: (element.font_style || 'normal') as any,
            textDecoration: element.text_decoration || 'none',
            textAlign: (element.text_align || 'left') as any,
            color: element.text_color || '#000000',
        };
        const isPh = ['page_number', 'page_date', 'page_total'].includes(et);
        return (
            <div style={{ width: '100%', height: '100%', position: 'relative', cursor: 'move' }}>
                <NodeResizer color="#fbbf24" isVisible={!!selected} minWidth={15} minHeight={4} handleStyle={{ width: 7, height: 7 }} />
                <div style={{
                    width: '100%', height: '100%', padding: '1px 4px',
                    display: 'flex', alignItems: 'center',
                    justifyContent: element.text_align === 'center' ? 'center' : element.text_align === 'right' ? 'flex-end' : 'flex-start',
                    backgroundColor: element.background_color || 'transparent',
                    border: selected ? '1px solid #fbbf24' : isPh ? '1px dashed rgba(168,85,247,0.3)' : 'none',
                    borderBottom: et === 'heading' ? '1px solid rgba(0,0,0,0.15)' : undefined,
                    ...fontStyle,
                }}>
                    {isPh && <i className={`pi ${et === 'page_number' ? 'pi-hashtag' : et === 'page_date' ? 'pi-calendar' : 'pi-sort-numeric-up'}`} style={{ fontSize: 9, marginRight: 3, color: '#a855f7' }} />}
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {displayContent || typeLabels[et]}
                    </span>
                </div>
            </div>
        );
    }

    // table_header alone: hidden (rendered as part of detail_section)
    if (et === 'table_header') {
        return <div style={{ display: 'none' }} />;
    }

    // detail_section with linked table_header: combined control
    const linkedHeader = data.linkedHeader;
    if (et === 'detail_section' && linkedHeader) {
        return <CombinedDetailHeaderNode data={data} element={element} linkedHeader={linkedHeader} selected={selected} paperUnit={paperUnit} unitLabel={unitLabel} />;
    }

    // Regular section elements (container, header_section, footer_section)
    return (
        <div
            style={{
                width: '100%', height: '100%',
                border: `2px ${selected ? 'solid' : 'dashed'} ${borderColor}`,
                borderRadius: 4,
                backgroundColor: selected ? `${typeColors[et] || '#6b7280'}08` : 'transparent',
                position: 'relative',
                cursor: 'move',
            }}
        >
            <NodeResizer
                color="#fbbf24"
                isVisible={!!selected}
                minWidth={40}
                minHeight={20}
                handleStyle={{ width: 8, height: 8, borderRadius: 2 }}
                lineStyle={{ borderWidth: 2 }}
            />
            {/* Header bar */}
            <div style={{
                padding: '2px 6px', fontSize: 10, fontWeight: 600,
                color: typeColors[et] || '#6b7280',
                backgroundColor: `${typeColors[et] || '#6b7280'}15`,
                borderBottom: `1px dashed ${borderColor}`,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                borderRadius: '2px 2px 0 0',
            }}>
                <span>{element.label || typeLabels[et]}</span>
                <span style={{ fontSize: 8, color: '#9ca3af' }}>
                    {Number(element.width).toFixed(1)} x {Number(element.height).toFixed(1)} {unitLabel}
                </span>
            </div>
            {/* Info */}
            <div style={{ padding: '4px 6px', fontSize: 9, color: '#9ca3af' }}>
                {element.container_columns > 1 ? `${element.container_columns} col` : ''}
                {element.max_fields ? ` max: ${element.max_fields}` : ''}
                {element.field_height ? ` h: ${element.field_height}${unitLabel}` : ''}
            </div>
        </div>
    );
});
PatternElementNode.displayName = 'PatternElementNode';

const nodeTypes = {
    paper: PaperNode,
    patternElement: PatternElementNode,
};

// ============ MAIN COMPONENT ============

const ReportPatternDesignerPanelInner: React.FC<ReportPatternDesignerPanelProps> = ({ reportPatternId, onOpenPanel }) => {
    const { colors } = useTheme();
    const toast = useToast();

    const { selectedProject } = useProject();
    const reactFlowInstance = useReactFlow();
    const [currentLanguage] = useState<SupportedLanguage>(getStoredLanguage());
    const { t } = useTranslation(currentLanguage);

    // State
    const [patterns, setPatterns] = useState<ReportPattern[]>([]);
    const [selectedPattern, setSelectedPattern] = useState<ReportPattern | null>(null);
    const [selectedForm, setSelectedForm] = useState<ReportPatternForm | null>(null);
    const [selectedElement, setSelectedElement] = useState<ReportPatternElement | null>(null);
    const [selectedTableSection, setSelectedTableSection] = useState<'header' | 'detail' | null>(null);
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    // Settings
    const [showRuler, setShowRuler] = useState(true);
    const [snapToGrid, setSnapToGrid] = useState(selectedProject?.report_designer_snap_to_grid ?? true);
    const [showSettings, setShowSettings] = useState(false);
    const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);

    const enabledLanguages = useMemo(() => {
        if (!selectedProject?.enabled_languages) return [];
        return selectedProject.enabled_languages.map((code: string) => ({ label: code.toUpperCase(), value: code }));
    }, [selectedProject]);

    useEffect(() => {
        if (enabledLanguages.length > 0 && selectedLanguage == null) {
            setSelectedLanguage(enabledLanguages[0].value);
        }
    }, [enabledLanguages, selectedLanguage]);

    // ReactFlow
    const [nodes, setNodes, onNodesChange] = useNodesState([] as Node[]);
    const [edges, , onEdgesChange] = useEdgesState([]);

    // ============ DATA LOADING ============

    // Read pre-selection from localStorage (set by Report Management
    // "Open in Pattern Designer" button). We read it once on mount so that
    // subsequent re-renders don't accidentally consume a stale value.
    const preselectPatternId = useMemo<number | null>(() => {
        try {
            const raw = localStorage.getItem('report_pattern_preselect');
            if (raw) {
                const data = JSON.parse(raw);
                // Only use if fresh (within 5 seconds)
                if (data?.timestamp && Date.now() - data.timestamp < 5000 && data.patternId) {
                    localStorage.removeItem('report_pattern_preselect');
                    return Number(data.patternId);
                }
                localStorage.removeItem('report_pattern_preselect');
            }
        } catch { /* ignore */ }
        return null;
    }, []);

    useEffect(() => {
        loadPatterns();
    }, []);

    // Load the target pattern details directly when we receive a pattern id
    // (via prop or via localStorage preselect). This must not wait for the
    // patterns dropdown list, because the list fetches own-patterns only and
    // can arrive later — blocking preselection on it caused an empty combo.
    useEffect(() => {
        const targetId = reportPatternId != null ? Number(reportPatternId) : preselectPatternId;
        if (targetId) {
            loadPatternDetails(targetId);
        }

    }, [reportPatternId, preselectPatternId]);

    // Derived dropdown options: always include the currently selected pattern,
    // even when it's not part of the `patterns` list yet (loadPatterns still in
    // flight, or the pattern is shared/public and not in own-patterns). This
    // replaces a brittle inject-effect that could race with loadPatterns().
    const patternDropdownOptions = useMemo(() => {
        const list: ReportPattern[] = [...patterns];
        if (selectedPattern && !list.some(p => Number(p.id) === Number(selectedPattern.id))) {
            list.push(selectedPattern);
        }
        return list.map(p => ({ label: p.name, value: p.id }));
    }, [patterns, selectedPattern]);

    const loadPatterns = async () => {
        try {
            const response = await fetch('/api/report-patterns?own_only=true', { headers: getAuthHeaders() });
            if (response.ok) {
                const data = await response.json();
                setPatterns(data.data || []);
            }
        } catch (error) {
            console.error('Error loading patterns:', error);
        }
    };

    const loadPatternDetails = async (patternId: number, preserveFormType?: string) => {
        setLoading(true);
        try {
            const response = await fetch(`/api/report-patterns/${patternId}`, { headers: getAuthHeaders() });
            if (response.ok) {
                const data = await response.json();
                const pattern = data.data;
                setSelectedPattern(pattern);
                if (pattern.forms && pattern.forms.length > 0) {
                    // Preserve the currently selected form type if requested
                    const targetType = preserveFormType || selectedForm?.form_type;
                    const matchingForm = targetType
                        ? pattern.forms.find((f: ReportPatternForm) => f.form_type === targetType)
                        : null;
                    const formToSelect = matchingForm || pattern.forms[0];
                    setSelectedForm(formToSelect);
                    buildNodes(formToSelect);
                    setHasUnsavedChanges(false);
                    setSelectedTableSection(null);
                }
            }
        } catch (error) {
            console.error('Error loading pattern:', error);
        } finally {
            setLoading(false);
        }
    };

    // ============ NODE BUILDING ============

    const getEffectivePaperSize = useCallback((form: ReportPatternForm): { width: number; height: number } => {
        let w: number, h: number;
        if (form.paper_size === 'Custom') {
            w = form.paper_width || 210;
            h = form.paper_height || 297;
        } else {
            const size = PAPER_SIZES[form.paper_size] || PAPER_SIZES['A4'];
            w = size.width;
            h = size.height;
        }
        // Standard sizes are always in mm; convert custom inch to mm for px calculation
        if (form.paper_unit === 'inch' && form.paper_size === 'Custom') {
            w = w * 25.4;
            h = h * 25.4;
        }
        if (form.paper_orientation === 'landscape') {
            return { width: h, height: w };
        }
        return { width: w, height: h };
    }, []);

    const buildNodes = useCallback((form: ReportPatternForm) => {
        const paperSizeMm = getEffectivePaperSize(form);
        const paperWidthPx = paperSizeMm.width * MM_TO_PX;
        const paperHeightPx = paperSizeMm.height * MM_TO_PX;
        const unit = form.paper_unit || 'mm';

        // Margin conversion: stored in paper_unit, need px
        const marginTopPx = unitToPx(Number(form.margin_top), unit);
        const marginRightPx = unitToPx(Number(form.margin_right), unit);
        const marginBottomPx = unitToPx(Number(form.margin_bottom), unit);
        const marginLeftPx = unitToPx(Number(form.margin_left), unit);

        const paperSizeLabel = form.paper_size === 'Custom'
            ? `Custom ${form.paper_width} x ${form.paper_height}`
            : `${form.paper_size} ${paperSizeMm.width} x ${paperSizeMm.height}`;

        const newNodes: Node[] = [];

        // Paper node
        newNodes.push({
            id: 'paper',
            type: 'paper',
            position: { x: 0, y: 0 },
            data: {
                paperWidth: paperWidthPx,
                paperHeight: paperHeightPx,
                marginTop: marginTopPx,
                marginRight: marginRightPx,
                marginBottom: marginBottomPx,
                marginLeft: marginLeftPx,
                paperUnit: unit,
                paperSizeLabel,
                showRuler,
            } as PaperNodeData,
            selectable: false,
            draggable: false,
            style: { width: paperWidthPx, height: paperHeightPx, zIndex: 0 },
        });

        // Element nodes - positions are stored in paper_unit, relative to printable area
        const elements = form.elements || [];

        // Build lookup: find table_header for each detail_section
        const headerByDetailId: Record<number, ReportPatternElement> = {};
        const tableHeaderIds = new Set<number>();
        for (const el of elements) {
            if (el.element_type === 'table_header' && el.linked_element_id) {
                headerByDetailId[el.linked_element_id] = el;
                if (el.id) tableHeaderIds.add(el.id);
            }
        }

        elements.forEach((el, index) => {
            // Skip table_header - rendered as part of detail_section
            if (el.id && tableHeaderIds.has(el.id)) return;

            const linkedHeader = el.element_type === 'detail_section' && el.id
                ? headerByDetailId[el.id] : undefined;

            let xPx: number, yPx: number, wPx: number, hPx: number;

            if (linkedHeader) {
                // Combined node: starts at table_header.y, combined height
                xPx = marginLeftPx + unitToPx(Number(el.x_position), unit);
                yPx = marginTopPx + unitToPx(Number(linkedHeader.y_position), unit);
                wPx = unitToPx(Number(el.width), unit);
                hPx = unitToPx(Number(linkedHeader.height), unit) + unitToPx(Number(el.height), unit);
            } else {
                xPx = marginLeftPx + unitToPx(Number(el.x_position), unit);
                yPx = marginTopPx + unitToPx(Number(el.y_position), unit);
                wPx = unitToPx(Number(el.width), unit);
                hPx = unitToPx(Number(el.height), unit);
            }

            newNodes.push({
                id: `element-${el.id || index}`,
                type: 'patternElement',
                position: { x: xPx, y: yPx },
                data: {
                    element: el,
                    linkedHeader,
                    onSelect: handleElementSelect,
                    onHeaderDividerDrag: linkedHeader ? (newHeaderH: number, newDetailH: number) => {
                        // Immutable update: replace elements array, update form & pattern state, then rebuild
                        if (!selectedForm) return;
                        const updatedElements = (selectedForm.elements || []).map(uel => {
                            if (uel.id === linkedHeader.id) {
                                return { ...uel, height: newHeaderH };
                            }
                            if (uel.id === el.id) {
                                return {
                                    ...uel,
                                    height: newDetailH,
                                    y_position: Number(linkedHeader.y_position) + newHeaderH,
                                };
                            }
                            return uel;
                        });
                        const updatedForm = { ...selectedForm, elements: updatedElements };
                        setSelectedForm(updatedForm);
                        if (selectedPattern) {
                            const updatedForms = (selectedPattern.forms || []).map(f =>
                                f.id === updatedForm.id ? updatedForm : f
                            );
                            setSelectedPattern({ ...selectedPattern, forms: updatedForms });
                        }
                        buildNodes(updatedForm);
                        setHasUnsavedChanges(true);
                    } : undefined,
                    onTableSectionSelect: linkedHeader ? (section: 'header' | 'detail' | null) => {
                        setSelectedTableSection(section);
                        // Pick the actual element behind the section so "Back to Element" shows the right props
                        setSelectedElement(section === 'header' ? linkedHeader : el);
                        const nodeId = `element-${el.id || index}`;
                        setSelectedNodeId(nodeId);
                        // Programmatically select this node and deselect others in ReactFlow
                        setNodes(prev => prev.map(n => ({
                            ...n,
                            selected: n.id === nodeId,
                        })));
                    } : undefined,
                    listStyleConfig: form.list_style_config as Record<string, unknown> | undefined,
                    selectedTableSection,
                    isSelected: false,
                    paperUnit: unit,
                    selectedLanguage,
                } as PatternElementNodeData,
                style: { width: wPx, height: hPx, zIndex: (el.sort_order || 0) + 1 },
            });
        });

        setNodes(newNodes);
        setSelectedElement(null);
        setSelectedNodeId(null);
    }, [showRuler, selectedLanguage, selectedTableSection]);

    // Rebuild paper node when ruler toggle changes
    useEffect(() => {
        if (selectedForm) {
            setNodes(prev => prev.map(n => {
                if (n.id === 'paper') return { ...n, data: { ...n.data, showRuler } };
                if (n.type === 'patternElement') return { ...n, data: { ...n.data, selectedLanguage } };
                return n;
            }));
        }
    }, [showRuler, selectedLanguage]);

    // ============ ELEMENT SELECTION ============

    const handleElementSelect = useCallback((element: ReportPatternElement) => {
        setSelectedElement(element);
        const nodeId = `element-${element.id}`;
        setSelectedNodeId(nodeId);
        // Reset table section selection when selecting a non-detail element
        if (element.element_type !== 'detail_section') {
            setSelectedTableSection(null);
        }
        // Sync ReactFlow selection
        setNodes(prev => prev.map(n => ({ ...n, selected: n.id === nodeId })));
    }, [setNodes]);

    const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
        if (node.type === 'paper') return;
        if (node.type === 'patternElement') {
            const el = (node.data as PatternElementNodeData).element;
            handleElementSelect(el);
        }
    }, [handleElementSelect]);

    // Also handle selection change (fires on first click, not just second)
    const onSelectionChange = useCallback(({ nodes: selectedNodes }: { nodes: Node[] }) => {
        const elementNodes = selectedNodes.filter(n => n.type === 'patternElement');
        if (elementNodes.length === 1) {
            const el = (elementNodes[0].data as PatternElementNodeData).element;
            handleElementSelect(el);
        }
    }, [handleElementSelect]);

    const onPaneClick = useCallback(() => {
        setSelectedElement(null);
        setSelectedNodeId(null);
        setSelectedTableSection(null);
        // Clear ReactFlow selection
        setNodes(prev => prev.map(n => ({ ...n, selected: false })));
    }, [setNodes]);

    // Track drag/resize for unsaved changes
    const onNodeDragStop = useCallback(() => {
        setHasUnsavedChanges(true);
    }, []);

    const onNodesChangeWrapped = useCallback((changes: any) => {
        onNodesChange(changes);
        // Only mark as changed if user actively resized (not initial dimension measurement)
        const hasUserResize = changes.some((c: any) => c.type === 'dimensions' && c.resizing === true);
        if (hasUserResize) setHasUnsavedChanges(true);
    }, [onNodesChange]);

    // ============ ELEMENT CRUD ============

    const addElement = useCallback(async (elementType: string, dropX?: number, dropY?: number) => {
        if (!selectedForm) return;
        const palette = ELEMENT_PALETTE.find(e => e.type === elementType);
        const defaultW = palette?.defaultWidth || 100;
        const defaultH = palette?.defaultHeight || 50;
        const defaultContent = (palette as any)?.defaultContent || undefined;

        const isSection = ['container', 'header_section', 'detail_section', 'footer_section', 'table_header'].includes(elementType);

        try {
            const body: Record<string, unknown> = {
                element_type: elementType,
                x_position: dropX ?? 0,
                y_position: dropY ?? 0,
                width: defaultW,
                height: defaultH,
                label: palette?.label || elementType,
                container_columns: isSection ? 1 : undefined,
                container_gap: isSection ? 2.0 : undefined,
            };
            if (defaultContent) body.content = defaultContent;
            if (elementType === 'heading') { body.font_size = 14; body.font_weight = 'bold'; }
            if (['line_horizontal', 'line_vertical', 'box'].includes(elementType)) { body.border_width = 1; body.border_color = '#000000'; }

            const response = await fetch(`/api/report-pattern-forms/${selectedForm.id}/elements`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(body),
            });
            if (response.ok) {
                const result = await response.json();
                // Add new element(s) locally instead of full reload (prevents panel jump)
                const newElements = Array.isArray(result.data) ? result.data : [result.data];
                if (selectedForm && selectedPattern) {
                    const currentElements = selectedForm.elements || [];
                    const updatedForm = { ...selectedForm, elements: [...currentElements, ...newElements] };
                    setSelectedForm(updatedForm);
                    // Update pattern forms array
                    const updatedForms = (selectedPattern.forms || []).map(f =>
                        f.id === updatedForm.id ? updatedForm : f
                    );
                    setSelectedPattern({ ...selectedPattern, forms: updatedForms });
                    buildNodes(updatedForm);
                    setHasUnsavedChanges(true);
                }
            }
        } catch (error) {
            console.error('Error adding element:', error);
        }
    }, [selectedForm, selectedPattern, buildNodes]);

    // Drag & Drop handlers for palette → canvas
    const handleDragOver = useCallback((event: React.DragEvent) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'copy';
    }, []);

    const handleDrop = useCallback((event: React.DragEvent) => {
        event.preventDefault();
        if (!selectedForm) return;
        const elementType = event.dataTransfer.getData('application/pattern-element');
        if (!elementType) return;

        const unit = selectedForm.paper_unit || 'mm';
        const flowPos = reactFlowInstance.screenToFlowPosition({ x: event.clientX, y: event.clientY });

        // Subtract margin offset to get position relative to printable area
        const marginLeftPx = unitToPx(Number(selectedForm.margin_left), unit);
        const marginTopPx = unitToPx(Number(selectedForm.margin_top), unit);
        const xUnit = pxToUnit(Math.max(0, flowPos.x - marginLeftPx), unit);
        const yUnit = pxToUnit(Math.max(0, flowPos.y - marginTopPx), unit);

        addElement(elementType, Math.round(xUnit * 10) / 10, Math.round(yUnit * 10) / 10);
    }, [selectedForm, reactFlowInstance, addElement]);

    const deleteElement = useCallback(async () => {
        if (!selectedElement?.id) return;
        try {
            const response = await fetch(`/api/report-pattern-elements/${selectedElement.id}`, {
                method: 'DELETE',
                headers: getAuthHeaders(),
            });
            if (response.ok) {
                // Remove locally instead of full reload (prevents blink)
                if (selectedForm && selectedPattern) {
                    const deletedId = selectedElement.id;
                    const currentElements = selectedForm.elements || [];
                    // Also remove linked table_header if deleting a detail_section
                    const filteredElements = currentElements.filter(el =>
                        el.id !== deletedId && !(el.element_type === 'table_header' && el.linked_element_id === deletedId)
                    );
                    const updatedForm = { ...selectedForm, elements: filteredElements };
                    setSelectedForm(updatedForm);
                    const updatedForms = (selectedPattern.forms || []).map(f =>
                        f.id === updatedForm.id ? updatedForm : f
                    );
                    setSelectedPattern({ ...selectedPattern, forms: updatedForms });
                    buildNodes(updatedForm);
                }
                setSelectedElement(null);
                setSelectedNodeId(null);
                setSelectedTableSection(null);
                setHasUnsavedChanges(true);
            }
        } catch (error) {
            console.error('Error deleting element:', error);
            toast.showError('Error deleting element');
        }
    }, [selectedElement, selectedPattern, selectedForm, buildNodes]);

    // ============ SAVE ============

    const saveElements = useCallback(async () => {
        if (!selectedForm) return;
        setSaving(true);
        const unit = selectedForm.paper_unit || 'mm';
        const marginLeftPx = unitToPx(Number(selectedForm.margin_left), unit);
        const marginTopPx = unitToPx(Number(selectedForm.margin_top), unit);

        try {
            const elementNodes = nodes.filter(n => n.type === 'patternElement');
            const elements: Array<Record<string, unknown>> = [];

            const buildElData = (el: ReportPatternElement, x: number, y: number, w: number, h: number, sortIdx: number) => ({
                id: el.id,
                element_type: el.element_type,
                x_position: parseFloat(x.toFixed(2)),
                y_position: parseFloat(y.toFixed(2)),
                width: parseFloat(w.toFixed(2)),
                height: parseFloat(h.toFixed(2)),
                container_columns: el.container_columns || 1,
                container_gap: el.container_gap || 2.0,
                max_fields: el.max_fields,
                field_height: el.field_height,
                content: el.content,
                content_labels: el.content_labels,
                font_family: el.font_family,
                font_size: el.font_size,
                font_weight: el.font_weight,
                font_style: el.font_style,
                text_decoration: el.text_decoration,
                text_align: el.text_align,
                text_color: el.text_color,
                border_width: el.border_width,
                border_color: el.border_color,
                background_color: el.background_color,
                label: el.label,
                linked_element_id: el.linked_element_id || null,
                sort_order: sortIdx,
                is_visible: el.is_visible !== false,
            });

            let sortIdx = 0;
            elementNodes.forEach((node) => {
                const nodeData = node.data as PatternElementNodeData;
                const el = nodeData.element;
                const linkedHeader = nodeData.linkedHeader;
                const wPx = node.measured?.width ?? (node.style?.width as number) ?? unitToPx(Number(el.width), unit);
                const totalHPx = node.measured?.height ?? (node.style?.height as number) ?? unitToPx(Number(el.height), unit);

                const nodeXUnit = pxToUnit(node.position.x - marginLeftPx, unit);
                const nodeYUnit = pxToUnit(node.position.y - marginTopPx, unit);
                const nodeWUnit = pxToUnit(wPx, unit);

                if (el.element_type === 'detail_section' && linkedHeader) {
                    // Combined node: split back into table_header + detail_section
                    const headerHUnit = Number(linkedHeader.height);
                    const totalHUnit = pxToUnit(totalHPx, unit);
                    const detailHUnit = Math.max(5, totalHUnit - headerHUnit);

                    // table_header: starts at node top, has its own height
                    elements.push(buildElData(linkedHeader, nodeXUnit, nodeYUnit, nodeWUnit, headerHUnit, sortIdx++));
                    // detail_section: starts below header
                    elements.push(buildElData(el, nodeXUnit, nodeYUnit + headerHUnit, nodeWUnit, detailHUnit, sortIdx++));
                } else {
                    const hPx = totalHPx;
                    elements.push(buildElData(el,
                        nodeXUnit, nodeYUnit, nodeWUnit, pxToUnit(hPx, unit),
                        sortIdx++
                    ));
                }
            });

            // Enforce constraints: table_header x/width must match linked detail_section
            for (const th of elements) {
                if (th.element_type === 'table_header' && th.linked_element_id) {
                    const detail = elements.find(e => Number(e.id) === Number(th.linked_element_id));
                    if (detail) {
                        th.x_position = detail.x_position;
                        th.width = detail.width;
                    }
                }
            }

            const response = await fetch(`/api/report-pattern-forms/${selectedForm.id}/elements`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify({ elements }),
            });

            if (response.ok) {
                // Save form properties in background (non-blocking) — includes list_style_config
                if (selectedForm) {
                    fetch(`/api/report-pattern-forms/${selectedForm.id}`, {
                        method: 'PUT',
                        headers: getAuthHeaders(),
                        body: JSON.stringify({
                            paper_size: selectedForm.paper_size,
                            paper_orientation: selectedForm.paper_orientation,
                            paper_unit: selectedForm.paper_unit,
                            paper_width: selectedForm.paper_width,
                            paper_height: selectedForm.paper_height,
                            margin_top: selectedForm.margin_top,
                            margin_right: selectedForm.margin_right,
                            margin_bottom: selectedForm.margin_bottom,
                            margin_left: selectedForm.margin_left,
                            row_height: selectedForm.row_height,
                            max_columns: selectedForm.max_columns,
                            header_height: selectedForm.header_height,
                            footer_height: selectedForm.footer_height,
                            list_style_config: selectedForm.list_style_config || null,
                        }),
                    }).catch(() => {}); // fire-and-forget
                }
                toast.showSuccess(t.reportpatterndesigner_saved || 'Elements saved');
                setHasUnsavedChanges(false);
            } else {
                toast.showError('Error saving elements');
            }
        } catch (error) {
            console.error('Error saving:', error);
            toast.showError('Error saving elements');
        } finally {
            setSaving(false);
        }
    }, [selectedForm, selectedPattern, nodes]);

    const saveFormProperties = useCallback(async () => {
        if (!selectedForm) return;
        setSaving(true);
        try {
            const response = await fetch(`/api/report-pattern-forms/${selectedForm.id}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    paper_size: selectedForm.paper_size,
                    paper_orientation: selectedForm.paper_orientation,
                    paper_unit: selectedForm.paper_unit,
                    paper_width: selectedForm.paper_width,
                    paper_height: selectedForm.paper_height,
                    margin_top: selectedForm.margin_top,
                    margin_right: selectedForm.margin_right,
                    margin_bottom: selectedForm.margin_bottom,
                    margin_left: selectedForm.margin_left,
                    row_height: selectedForm.row_height,
                    max_columns: selectedForm.max_columns,
                    header_height: selectedForm.header_height,
                    footer_height: selectedForm.footer_height,
                    list_style_config: selectedForm.list_style_config || null,
                }),
            });
            if (response.ok) {
                toast.showSuccess(t.reportpatterndesigner_form_saved || 'Form properties saved');
                if (selectedPattern) {
                    loadPatternDetails(selectedPattern.id);
                }
            }
        } catch (error) {
            console.error('Error saving form:', error);
            toast.showError('Error saving form properties');
        } finally {
            setSaving(false);
        }
    }, [selectedForm, selectedPattern]);

    // ============ FORM PROPERTY UPDATES ============

    const updateFormProp = useCallback((prop: string, value: unknown) => {
        if (!selectedForm) return;
        const updated = { ...selectedForm, [prop]: value };
        setSelectedForm(updated);
        // Update the pattern's forms array
        if (selectedPattern) {
            const updatedForms = (selectedPattern.forms || []).map(f =>
                f.id === updated.id ? updated : f
            );
            setSelectedPattern({ ...selectedPattern, forms: updatedForms });
        }
        // Rebuild nodes with new form data
        buildNodes(updated);
        setHasUnsavedChanges(true);
    }, [selectedForm, selectedPattern, buildNodes]);

    const updateElementProp = useCallback((prop: string, value: unknown) => {
        if (!selectedElement) return;
        const updated = { ...selectedElement, [prop]: value };
        setSelectedElement(updated);

        // Update the node data — and for spatial props also sync ReactFlow's position/style
        // so the canvas reflects the change and the field doesn't snap back to the old value.
        const unit = selectedForm?.paper_unit || 'mm';
        const marginLeftPx = unitToPx(Number(selectedForm?.margin_left ?? 0), unit);
        const marginTopPx = unitToPx(Number(selectedForm?.margin_top ?? 0), unit);

        setNodes(prev => prev.map(n => {
            if (n.id !== selectedNodeId || n.type !== 'patternElement') return n;
            const nodeData = n.data as PatternElementNodeData;

            // Detect if we're editing the linkedHeader (table_header) of a combined node.
            // In that case we must update n.data.linkedHeader, NOT n.data.element — otherwise
            // the renderer would replace the detail_section with table_header (which renders
            // as display:none) and the table would visually disappear.
            const editingLinkedHeader = !!(nodeData.linkedHeader && nodeData.linkedHeader.id === updated.id);

            const newData: PatternElementNodeData = editingLinkedHeader
                ? { ...nodeData, linkedHeader: updated }
                : { ...nodeData, element: updated };

            const newNode: Node = { ...n, data: newData };

            if (prop === 'x_position' && !editingLinkedHeader) {
                newNode.position = { ...n.position, x: marginLeftPx + unitToPx(Number(value), unit) };
            } else if (prop === 'y_position' && !editingLinkedHeader) {
                newNode.position = { ...n.position, y: marginTopPx + unitToPx(Number(value), unit) };
            } else if (prop === 'width' && !editingLinkedHeader) {
                newNode.style = { ...n.style, width: unitToPx(Number(value), unit) };
            } else if (prop === 'height') {
                // Combined header+detail node: visual height = header.height + detail.height
                if (editingLinkedHeader) {
                    // table_header height changed: keep detail height, total = newHeader + detail
                    const detailH = Number(nodeData.element?.height) || 0;
                    newNode.style = { ...n.style, height: unitToPx(Number(value) + detailH, unit) };
                } else if (nodeData.linkedHeader && updated.element_type === 'detail_section') {
                    // detail_section height changed: total = header + newDetail
                    newNode.style = { ...n.style, height: unitToPx(Number(nodeData.linkedHeader.height) + Number(value), unit) };
                } else {
                    newNode.style = { ...n.style, height: unitToPx(Number(value), unit) };
                }
            }
            return newNode;
        }));

        // Also update the form's elements array (for consistency on rebuild / save)
        if (selectedForm && selectedPattern) {
            const updatedElements = (selectedForm.elements || []).map(el =>
                el.id === updated.id ? updated : el
            );
            const updatedForm = { ...selectedForm, elements: updatedElements };
            setSelectedForm(updatedForm);
            const updatedForms = (selectedPattern.forms || []).map(f =>
                f.id === updatedForm.id ? updatedForm : f
            );
            setSelectedPattern({ ...selectedPattern, forms: updatedForms });
        }

        setHasUnsavedChanges(true);
    }, [selectedElement, selectedNodeId, selectedForm, selectedPattern, setNodes]);

    // ============ DERIVED VALUES ============

    const projectGridUnit = (selectedProject?.report_designer_grid_unit as string) || 'mm';
    const projectGridSize = Number(selectedProject?.report_designer_grid_size) || 5;

    const gridSizePx = useMemo(() => {
        return unitToPx(projectGridSize, projectGridUnit);
    }, [projectGridSize, projectGridUnit]);

    const unitLabel = selectedForm?.paper_unit === 'inch' ? 'in' : 'mm';

    // ============ DELETE KEY ============

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Delete' && selectedElement?.id) {
                const active = document.activeElement;
                if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.tagName === 'SELECT')) return;
                deleteElement();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedElement, deleteElement]);

    // ============ RENDER ============

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full" style={{ backgroundColor: colors.bgPrimary }}>
                <ProgressSpinner />
            </div>
        );
    }

    return (
        <div className="flex h-full" style={{ backgroundColor: colors.bgPrimary, color: colors.textPrimary }}>

            {/* LEFT PANEL */}
            <div className="flex flex-col" style={{ width: 240, borderRight: `1px solid ${colors.borderPrimary}`, backgroundColor: colors.bgSecondary }}>
                <div className="p-3 space-y-3 overflow-y-auto flex-1">
                    {/* Pattern selector */}
                    <div>
                        <label className="block text-xs font-medium mb-1" style={{ color: colors.textMuted }}>
                            {t.reportpatterndesigner_pattern || 'Report Pattern'}
                        </label>
                        <Dropdown
                            value={selectedPattern?.id}
                            options={patternDropdownOptions}
                            onChange={(e) => {
                                // Load details directly by id — don't rely on `patterns`
                                // list since the chosen option may be the currently
                                // selected (not-yet-in-list) pattern.
                                if (e.value != null) loadPatternDetails(Number(e.value));
                            }}
                            placeholder={t.reportpatterndesigner_select || 'Select...'}
                            className="w-full text-sm"
                        />
                    </div>

                    {/* Form type selector */}
                    {selectedPattern?.forms && selectedPattern.forms.length > 0 && (
                        <div>
                            <label className="block text-xs font-medium mb-1" style={{ color: colors.textMuted }}>
                                {t.reportpatterndesigner_form_type || 'Report Type'}
                            </label>
                            <div className="flex gap-1">
                                {selectedPattern.forms.map(form => (
                                    <Button
                                        key={form.id}
                                        label={form.form_type === 'report_single'
                                            ? (t.reportpatterndesigner_single || 'Single')
                                            : (t.reportpatterndesigner_list || 'List')}
                                        className={`p-button-sm flex-1 ${selectedForm?.id === form.id ? 'p-button-primary' : 'p-button-secondary p-button-outlined'}`}
                                        onClick={() => {
                                            if (hasUnsavedChanges) {
                                                if (!window.confirm('You have unsaved changes. Switch form type and discard changes?')) return;
                                            }
                                            setSelectedForm(form); buildNodes(form);
                                            setHasUnsavedChanges(false);
                                            setSelectedTableSection(null);
                                        }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Language selector */}
                    {enabledLanguages.length > 0 && (
                        <div>
                            <label className="block text-xs font-medium mb-1" style={{ color: colors.textMuted }}>
                                {t.reportpatterndesigner_language || 'Language'}
                            </label>
                            <Dropdown
                                value={selectedLanguage}
                                options={enabledLanguages}
                                onChange={(e) => setSelectedLanguage(e.value)}
                                className="w-full text-sm"
                            />
                        </div>
                    )}

                    {/* Section Elements */}
                    {selectedForm && (
                        <div>
                            <label className="block text-xs font-medium mb-2" style={{ color: colors.textMuted }}>
                                {t.reportpatterndesigner_sections || 'Sections'}
                            </label>
                            <div className="space-y-1">
                                {SECTION_PALETTE.map(item => (
                                    <div
                                        key={item.type}
                                        draggable
                                        onDragStart={(e) => {
                                            e.dataTransfer.setData('application/pattern-element', item.type);
                                            e.dataTransfer.effectAllowed = 'copyMove';
                                        }}
                                        className="w-full flex items-center gap-2 px-3 py-2 rounded text-sm transition-colors"
                                        style={{
                                            backgroundColor: colors.bgTertiary,
                                            color: colors.textPrimary,
                                            border: `1px solid ${colors.borderPrimary}`,
                                            cursor: 'grab',
                                        }}
                                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = colors.bgPrimary)}
                                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = colors.bgTertiary)}
                                    >
                                        <i className={`pi ${item.icon}`} style={{ fontSize: 14 }} />
                                        <span>{item.label}</span>
                                        <span className="ml-auto" style={{ fontSize: 8, color: colors.textMuted }}>{item.defaultWidth}x{item.defaultHeight}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Report Controls */}
                    {selectedForm && (
                        <div>
                            <label className="block text-xs font-medium mb-2" style={{ color: colors.textMuted }}>
                                {t.reportpatterndesigner_report_controls || 'Report Controls'}
                            </label>
                            {['text', 'layout', 'placeholders', 'media'].map(cat => {
                                const items = REPORT_CONTROLS_PALETTE.filter(c => c.category === cat);
                                if (items.length === 0) return null;
                                const catLabels: Record<string, string> = { text: 'TEXT', layout: 'LAYOUT', placeholders: 'PLACEHOLDERS', media: 'MEDIA' };
                                return (
                                    <div key={cat} className="mb-2">
                                        <div className="text-xs font-semibold mb-1 px-1" style={{ color: colors.textMuted, fontSize: 9, textTransform: 'uppercase' }}>
                                            {catLabels[cat]}
                                        </div>
                                        <div className="space-y-1">
                                            {items.map(item => (
                                                <div
                                                    key={item.type}
                                                    draggable
                                                    onDragStart={(e) => {
                                                        e.dataTransfer.setData('application/pattern-element', item.type);
                                                        e.dataTransfer.effectAllowed = 'copyMove';
                                                    }}
                                                    className="w-full flex items-center gap-2 px-3 py-1.5 rounded text-sm transition-colors"
                                                    style={{
                                                        backgroundColor: 'rgba(168,85,247,0.08)',
                                                        color: colors.textPrimary,
                                                        border: '1px solid rgba(168,85,247,0.2)',
                                                        cursor: 'grab',
                                                    }}
                                                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(168,85,247,0.15)')}
                                                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(168,85,247,0.08)')}
                                                >
                                                    <i className={`pi ${item.icon}`} style={{ fontSize: 12, color: '#a855f7' }} />
                                                    <span style={{ fontSize: 11 }}>{item.label}</span>
                                                    <span className="ml-auto" style={{ fontSize: 8, color: colors.textMuted }}>
                                                        {item.defaultWidth}x{item.defaultHeight}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Save button + Open Layout Designer at bottom */}
                {selectedForm && (
                    <div className="p-3 space-y-2" style={{ borderTop: `1px solid ${colors.borderPrimary}` }}>
                        <Button
                            label={saving ? (t.reportpatterndesigner_saving || 'Saving...') : (t.reportpatterndesigner_save || 'Save')}
                            icon={saving ? 'pi pi-spinner pi-spin' : 'pi pi-save'}
                            className={`p-button-sm w-full ${hasUnsavedChanges ? 'p-button-warning' : 'p-button-success'}`}
                            onClick={saveElements}
                            loading={saving}
                        />
                        {selectedPattern && (
                            <Button
                                label={t.reportpatterndesigner_open_layout || 'Open Layout Designer'}
                                icon="pi pi-th-large"
                                className="p-button-sm p-button-outlined p-button-help w-full"
                                onClick={() => {
                                    // Store pre-selection in localStorage for the Layout Designer to pick up
                                    localStorage.setItem('report_layout_preselect', JSON.stringify({
                                        patternId: selectedPattern.id,
                                        formType: selectedForm?.form_type,
                                        language: selectedLanguage,
                                        timestamp: Date.now(),
                                    }));
                                    onOpenPanel?.('report-layout-designer', {
                                        title: `${t.reportmanagementpanel_layout_designer || 'Report Layout'}: ${selectedPattern.name}`,
                                        forceNew: true,
                                    });
                                }}
                            />
                        )}
                    </div>
                )}
            </div>

            {/* CENTER - CANVAS */}
            <div className="flex-1 relative">
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChangeWrapped}
                    onEdgesChange={onEdgesChange}
                    onNodeClick={onNodeClick}
                    onSelectionChange={onSelectionChange}
                    onPaneClick={onPaneClick}
                    onNodeDragStop={onNodeDragStop}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    nodeTypes={nodeTypes}
                    snapToGrid={snapToGrid}
                    snapGrid={[gridSizePx, gridSizePx]}
                    minZoom={0.15}
                    maxZoom={2}
                    fitView
                    fitViewOptions={{ padding: 0.2 }}
                    style={{ backgroundColor: colors.bgTertiary }}
                    deleteKeyCode={null}
                >
                    {snapToGrid && (
                        <Background variant={BackgroundVariant.Dots} gap={gridSizePx} size={1} color="#4b5563" />
                    )}
                    <Controls />
                    <MiniMap
                        style={{ backgroundColor: colors.bgSecondary }}
                        nodeColor={(node) => node.type === 'paper' ? '#ffffff' : '#3b82f6'}
                    />
                </ReactFlow>

                {/* Settings Gear */}
                <div style={{
                    position: 'absolute', bottom: 12, right: 12, zIndex: 10,
                }}>
                    <Button
                        icon="pi pi-cog"
                        className="p-button-rounded p-button-sm"
                        style={{ backgroundColor: colors.bgSecondary, color: colors.textPrimary, border: `1px solid ${colors.borderPrimary}` }}
                        onClick={() => setShowSettings(!showSettings)}
                    />
                    {showSettings && (
                        <div style={{
                            position: 'absolute', bottom: 44, right: 0, width: 200,
                            backgroundColor: colors.bgSecondary, border: `1px solid ${colors.borderPrimary}`,
                            borderRadius: 8, padding: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                        }}>
                            <div className="flex items-center gap-2 mb-2">
                                <Checkbox checked={showRuler} onChange={(e) => setShowRuler(e.checked ?? true)} inputId="ruler" />
                                <label htmlFor="ruler" className="text-sm" style={{ color: colors.textPrimary }}>
                                    {t.reportpatterndesigner_show_ruler || 'Show Ruler'}
                                </label>
                            </div>
                            <div className="flex items-center gap-2">
                                <Checkbox checked={snapToGrid} onChange={(e) => setSnapToGrid(e.checked ?? true)} inputId="snap" />
                                <label htmlFor="snap" className="text-sm" style={{ color: colors.textPrimary }}>
                                    {t.reportpatterndesigner_snap_grid || 'Snap to Grid'}
                                </label>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* RIGHT PANEL - PROPERTIES */}
            <div className="flex flex-col" style={{
                width: 260, borderLeft: `1px solid ${colors.borderPrimary}`,
                backgroundColor: colors.bgSecondary, overflowY: 'auto',
            }}>
                <div className="p-3 space-y-3">
                    {/* Table Section Border Properties */}
                    {selectedTableSection && selectedForm && (() => {
                        const ls = (selectedForm.list_style_config || {}) as Record<string, unknown>;
                        const updateLs = (updates: Record<string, unknown>) => {
                            const updated = { ...ls, ...updates };
                            // Update form state only — NO buildNodes (style changes don't affect node layout)
                            const updatedForm = { ...selectedForm, list_style_config: updated };
                            setSelectedForm(updatedForm);
                            if (selectedPattern) {
                                const updatedForms = (selectedPattern.forms || []).map(f =>
                                    f.id === updatedForm.id ? updatedForm : f
                                );
                                setSelectedPattern({ ...selectedPattern, forms: updatedForms });
                            }
                            setHasUnsavedChanges(true);
                        };

                        const isHeader = selectedTableSection === 'header';
                        const sectionLabel = isHeader ? 'Table Header Style' : 'Detail Rows Style';
                        const sectionColor = isHeader ? '#06b6d4' : '#8b5cf6';

                        // Border configs for this section
                        const borderSides = isHeader
                            ? [
                                { key: 'header_border_top', label: 'Top', defaultW: 1 },
                                { key: 'header_border_left', label: 'Left', defaultW: 1 },
                                { key: 'header_border_right', label: 'Right', defaultW: 1 },
                                { key: 'header_border_bottom', label: 'Bottom', defaultW: 1 },
                                { key: 'column_separator', label: 'Column Separator', defaultW: 0.5 },
                            ]
                            : [
                                { key: 'detail_border_left', label: 'Left', defaultW: 1 },
                                { key: 'detail_border_right', label: 'Right', defaultW: 1 },
                                { key: 'detail_border_bottom', label: 'Bottom', defaultW: 1 },
                                { key: 'row_border_bottom', label: 'Row Separator', defaultW: 0.5 },
                                { key: 'column_separator', label: 'Column Separator', defaultW: 0.5 },
                            ];

                        return (
                            <>
                                <div style={{
                                    padding: '6px 10px', borderRadius: 6,
                                    backgroundColor: `${sectionColor}15`,
                                    border: `1px solid ${sectionColor}30`,
                                    display: 'flex', alignItems: 'center', gap: 8,
                                }}>
                                    <i className="pi pi-table" style={{ fontSize: 14, color: sectionColor }} />
                                    <span style={{ fontSize: 11, fontWeight: 600, color: colors.textPrimary }}>
                                        {sectionLabel}
                                    </span>
                                </div>

                                {/* Background color */}
                                {isHeader && (
                                    <div className="flex items-center gap-2">
                                        <span style={{ fontSize: 10, color: colors.textMuted, width: 55 }}>Bg Color</span>
                                        <div className="flex items-center gap-2 flex-1">
                                            <input type="color" value={safeColor(ls.header_bg_color, '#e0e0e0')} onChange={(e) => updateLs({ header_bg_color: e.target.value })} style={{ width: 28, height: 22, padding: 0, border: "1px solid var(--theme-border-primary)", borderRadius: 3, cursor: "pointer" }} />
                                            <InputText
                                                value={(ls.header_bg_color as string) || '#e0e0e0'}
                                                onChange={(e) => updateLs({ header_bg_color: e.target.value })}
                                                style={{ fontSize: 9, flex: 1 }} className="p-inputtext-sm"
                                            />
                                        </div>
                                    </div>
                                )}
                                {isHeader && (
                                    <div className="flex items-center gap-2">
                                        <span style={{ fontSize: 10, color: colors.textMuted, width: 55 }}>Text Color</span>
                                        <div className="flex items-center gap-2 flex-1">
                                            <input type="color" value={safeColor(ls.header_text_color, '#333333')} onChange={(e) => updateLs({ header_text_color: e.target.value })} style={{ width: 28, height: 22, padding: 0, border: "1px solid var(--theme-border-primary)", borderRadius: 3, cursor: "pointer" }} />
                                            <InputText
                                                value={(ls.header_text_color as string) || '#000000'}
                                                onChange={(e) => updateLs({ header_text_color: e.target.value })}
                                                style={{ fontSize: 9, flex: 1 }} className="p-inputtext-sm"
                                            />
                                        </div>
                                    </div>
                                )}
                                {!isHeader && (
                                    <>
                                        <div className="flex items-center gap-2">
                                            <span style={{ fontSize: 10, color: colors.textMuted, width: 55 }}>Even Row</span>
                                            <div className="flex items-center gap-2 flex-1">
                                                <input type="color" value={safeColor(ls.row_even_bg_color, '#ffffff')} onChange={(e) => updateLs({ row_even_bg_color: e.target.value })} style={{ width: 28, height: 22, padding: 0, border: "1px solid var(--theme-border-primary)", borderRadius: 3, cursor: "pointer" }} />
                                                <InputText value={(ls.row_even_bg_color as string) || '#ffffff'}
                                                    onChange={(e) => updateLs({ row_even_bg_color: e.target.value })}
                                                    style={{ fontSize: 9, flex: 1 }} className="p-inputtext-sm" />
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span style={{ fontSize: 10, color: colors.textMuted, width: 55 }}>Odd Row</span>
                                            <div className="flex items-center gap-2 flex-1">
                                                <input type="color" value={safeColor(ls.row_odd_bg_color, '#f5f5f5')} onChange={(e) => updateLs({ row_odd_bg_color: e.target.value })} style={{ width: 28, height: 22, padding: 0, border: "1px solid var(--theme-border-primary)", borderRadius: 3, cursor: "pointer" }} />
                                                <InputText value={(ls.row_odd_bg_color as string) || '#f5f5f5'}
                                                    onChange={(e) => updateLs({ row_odd_bg_color: e.target.value })}
                                                    style={{ fontSize: 9, flex: 1 }} className="p-inputtext-sm" />
                                            </div>
                                        </div>
                                    </>
                                )}

                                {/* Border properties per side */}
                                <div style={{ borderTop: `1px solid ${colors.borderPrimary}`, margin: '4px 0' }} />
                                <label style={{ fontSize: 10, color: colors.textMuted, fontWeight: 600, textTransform: 'uppercase' }}>
                                    Borders
                                </label>
                                {borderSides.map(side => {
                                    const wKey = `${side.key}_width`;
                                    const cKey = `${side.key}_color`;
                                    const sKey = `${side.key}_style`;
                                    return (
                                        <div key={side.key}>
                                            <div style={{ fontSize: 9, fontWeight: 600, color: colors.textMuted, marginBottom: 2 }}>{side.label}</div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span style={{ fontSize: 9, color: colors.textMuted, width: 35 }}>Width</span>
                                                <InputNumber
                                                    value={Number(ls[wKey] ?? side.defaultW)}
                                                    onValueChange={(e) => updateLs({ [wKey]: e.value })}
                                                    min={0} max={10} minFractionDigits={1} maxFractionDigits={1} suffix=" px"
                                                    style={{ fontSize: 9, flex: 1 }} className="p-inputtext-sm"
                                                />
                                            </div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span style={{ fontSize: 9, color: colors.textMuted, width: 35 }}>Color</span>
                                                <input type="color" value={safeColor(ls[cKey], '#000000')} onChange={(e) => updateLs({ [cKey]: e.target.value })} style={{ width: 28, height: 22, padding: 0, border: "1px solid var(--theme-border-primary)", borderRadius: 3, cursor: "pointer" }} />
                                                <InputText
                                                    value={(ls[cKey] as string) || '#000000'}
                                                    onChange={(e) => updateLs({ [cKey]: e.target.value })}
                                                    style={{ fontSize: 9, flex: 1 }} className="p-inputtext-sm"
                                                />
                                            </div>
                                            <div className="flex items-center gap-2 mb-2">
                                                <span style={{ fontSize: 9, color: colors.textMuted, width: 35 }}>Style</span>
                                                <Dropdown
                                                    value={(ls[sKey] as string) || 'solid'}
                                                    options={[
                                                        { label: 'Solid', value: 'solid' },
                                                        { label: 'Dashed', value: 'dashed' },
                                                        { label: 'Dotted', value: 'dotted' },
                                                        { label: 'None', value: 'none' },
                                                    ]}
                                                    onChange={(e) => updateLs({ [sKey]: e.value })}
                                                    style={{ fontSize: 9, flex: 1 }} className="p-inputtext-sm"
                                                />
                                            </div>
                                        </div>
                                    );
                                })}

                                {/* Outer border */}
                                <div style={{ borderTop: `1px solid ${colors.borderPrimary}`, margin: '4px 0' }} />
                                <label style={{ fontSize: 10, color: colors.textMuted, fontWeight: 600, textTransform: 'uppercase' }}>
                                    Outer Border
                                </label>
                                <div className="flex items-center gap-2 mb-1">
                                    <span style={{ fontSize: 9, color: colors.textMuted, width: 35 }}>Width</span>
                                    <InputNumber
                                        value={Number(ls.outer_border_width ?? 1)}
                                        onValueChange={(e) => updateLs({ outer_border_width: e.value })}
                                        min={0} max={10} minFractionDigits={1} maxFractionDigits={1} suffix=" px"
                                        style={{ fontSize: 9, flex: 1 }} className="p-inputtext-sm"
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <span style={{ fontSize: 9, color: colors.textMuted, width: 35 }}>Color</span>
                                    <input type="color" value={safeColor(ls.outer_border_color, '#000000')} onChange={(e) => updateLs({ outer_border_color: e.target.value })} style={{ width: 28, height: 22, padding: 0, border: "1px solid var(--theme-border-primary)", borderRadius: 3, cursor: "pointer" }} />
                                    <InputText
                                        value={(ls.outer_border_color as string) || '#000000'}
                                        onChange={(e) => updateLs({ outer_border_color: e.target.value })}
                                        style={{ fontSize: 9, flex: 1 }} className="p-inputtext-sm"
                                    />
                                </div>

                                <div style={{ marginTop: 8 }}>
                                    <Button
                                        label="Back to Element"
                                        icon="pi pi-arrow-left"
                                        className="p-button-text p-button-sm w-full"
                                        style={{ fontSize: 10 }}
                                        onClick={() => setSelectedTableSection(null)}
                                    />
                                </div>
                            </>
                        );
                    })()}

                    {!selectedTableSection && selectedElement ? (
                        <>
                            {/* Element Properties */}
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-semibold" style={{ color: colors.textPrimary }}>
                                    {t.reportpatterndesigner_element_props || 'Element Properties'}
                                </span>
                                <div className="flex gap-1">
                                    <Button icon="pi pi-angle-down" className="p-button-text p-button-secondary p-button-sm"
                                        tooltip="Move back" tooltipOptions={{ position: 'top' }}
                                        onClick={() => {
                                            if (!selectedElement) return;
                                            updateElementProp('sort_order', (selectedElement.sort_order || 0) - 1);
                                        }}
                                    />
                                    <Button icon="pi pi-angle-up" className="p-button-text p-button-secondary p-button-sm"
                                        tooltip="Move forward" tooltipOptions={{ position: 'top' }}
                                        onClick={() => {
                                            if (!selectedElement) return;
                                            updateElementProp('sort_order', (selectedElement.sort_order || 0) + 1);
                                        }}
                                    />
                                    <Button icon="pi pi-trash" className="p-button-text p-button-danger p-button-sm" onClick={deleteElement} />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs mb-1" style={{ color: colors.textMuted }}>
                                    {t.reportpatterndesigner_type || 'Type'}
                                </label>
                                <InputText value={selectedElement.element_type} disabled className="w-full text-sm" />
                            </div>

                            {/* Label only for sections - report controls use Content instead */}
                            {['container', 'header_section', 'detail_section', 'footer_section', 'table_header'].includes(selectedElement.element_type) && (
                                <div>
                                    <label className="block text-xs mb-1" style={{ color: colors.textMuted }}>
                                        {t.reportpatterndesigner_label || 'Label'}
                                    </label>
                                    <InputText
                                        value={selectedElement.label || ''}
                                        onChange={(e) => updateElementProp('label', e.target.value)}
                                        className="w-full text-sm"
                                    />
                                </div>
                            )}

                            {/* Position & Size — compact 2×2 grid matching the Report Layout
                                Designer (report-pos-grid + report-pos-input classes). The trick
                                that kills the horizontal scrollbar is `min-width: 0` on the inner
                                <input> — without it PrimeReact's InputNumber defaults push the
                                cells past the sidebar width. CSS rules live at the bottom of the
                                component (see <style> block). */}
                            <div className="report-pos-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                                <div>
                                    <span style={{ fontSize: 9, color: colors.textMuted }}>X ({unitLabel})</span>
                                    <InputNumber
                                        value={Number(selectedElement.x_position) || 0}
                                        onValueChange={(e) => updateElementProp('x_position', e.value ?? 0)}
                                        mode="decimal" minFractionDigits={1} maxFractionDigits={2}
                                        inputStyle={{ fontSize: 10, padding: '4px 6px', width: '100%' }}
                                        className="p-inputtext-sm report-pos-input"
                                    />
                                </div>
                                <div>
                                    <span style={{ fontSize: 9, color: colors.textMuted }}>Y ({unitLabel})</span>
                                    <InputNumber
                                        value={Number(selectedElement.y_position) || 0}
                                        onValueChange={(e) => updateElementProp('y_position', e.value ?? 0)}
                                        mode="decimal" minFractionDigits={1} maxFractionDigits={2}
                                        inputStyle={{ fontSize: 10, padding: '4px 6px', width: '100%' }}
                                        className="p-inputtext-sm report-pos-input"
                                    />
                                </div>
                                <div>
                                    <span style={{ fontSize: 9, color: colors.textMuted }}>{t.reportpatterndesigner_width || 'W'} ({unitLabel})</span>
                                    <InputNumber
                                        value={Number(selectedElement.width) || 0}
                                        onValueChange={(e) => updateElementProp('width', e.value ?? 1)}
                                        mode="decimal" minFractionDigits={1} maxFractionDigits={2} min={1}
                                        inputStyle={{ fontSize: 10, padding: '4px 6px', width: '100%' }}
                                        className="p-inputtext-sm report-pos-input"
                                    />
                                </div>
                                <div>
                                    <span style={{ fontSize: 9, color: colors.textMuted }}>{t.reportpatterndesigner_height || 'H'} ({unitLabel})</span>
                                    <InputNumber
                                        value={Number(selectedElement.height) || 0}
                                        onValueChange={(e) => updateElementProp('height', e.value ?? 1)}
                                        mode="decimal" minFractionDigits={1} maxFractionDigits={2} min={1}
                                        inputStyle={{ fontSize: 10, padding: '4px 6px', width: '100%' }}
                                        className="p-inputtext-sm report-pos-input"
                                    />
                                </div>
                            </div>

                            {/* Content (for report controls with text) */}
                            {['static_text', 'heading', 'page_number', 'page_date', 'page_total'].includes(selectedElement.element_type) && (
                                <>
                                    <div>
                                        <label className="block text-xs mb-1" style={{ color: colors.textMuted }}>
                                            {t.reportpatterndesigner_content || 'Content'}
                                        </label>
                                        <InputText
                                            value={selectedElement.content || ''}
                                            onChange={(e) => updateElementProp('content', e.target.value)}
                                            className="w-full text-sm"
                                            placeholder={selectedElement.element_type === 'static_text' ? '{:tablename:}'
                                                : selectedElement.element_type === 'heading' ? '{:tablename:}'
                                                : selectedElement.element_type === 'page_number' ? '{:pagenumber:} / {:pagestotal:}'
                                                : selectedElement.element_type === 'page_date' ? '{:printdate:} {:printtime:}'
                                                : '{:pagestotal:}'}
                                        />
                                    </div>
                                    {/* Multi-language content labels */}
                                    {enabledLanguages.length > 0 && (
                                        <div>
                                            <label className="block text-xs mb-1" style={{ color: colors.textMuted }}>
                                                {t.reportpatterndesigner_content_labels || 'Content Labels'}
                                            </label>
                                            {enabledLanguages.map((lang: { label: string; value: string }) => {
                                                const isActiveLang = lang.value === selectedLanguage;
                                                return (
                                                    <div key={lang.value} className="flex items-center gap-2 mb-1">
                                                        <span style={{
                                                            fontSize: 10, width: 24, textAlign: 'right',
                                                            color: isActiveLang ? '#3b82f6' : colors.textMuted,
                                                            fontWeight: isActiveLang ? 600 : 400,
                                                        }}>
                                                            {lang.label}
                                                        </span>
                                                        <InputText
                                                            value={(selectedElement.content_labels || {})[lang.value] || ''}
                                                            onChange={(e) => {
                                                                const labels = { ...(selectedElement.content_labels || {}) };
                                                                if (e.target.value) {
                                                                    labels[lang.value] = e.target.value;
                                                                } else {
                                                                    delete labels[lang.value];
                                                                }
                                                                updateElementProp('content_labels', Object.keys(labels).length > 0 ? labels : undefined);
                                                            }}
                                                            placeholder={selectedElement.content || ''}
                                                            className="flex-1 text-sm report-pos-input"
                                                            style={{ fontSize: 10 }}
                                                        />
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </>
                            )}

                            {/* Font properties (for text-bearing elements) */}
                            {/* Font / text styling — shown for text-bearing elements AND for
                                containers. For containers this acts as the "default look" that
                                auto-placed fields inherit (see ReportLayoutElement::inheritContainerStyle).
                                Without this block, containers in the DB have font_family / font_size /
                                text_color columns but no way to set them — the cascade gets nothing
                                to inherit. */}
                            {['static_text', 'heading', 'page_number', 'page_date', 'page_total',
                              'container', 'header_section', 'detail_section', 'footer_section', 'table_header'
                            ].includes(selectedElement.element_type) && (
                                <>
                                    <div style={{ borderTop: `1px solid ${colors.borderPrimary}`, margin: '4px 0' }} />
                                    <label className="block text-xs font-medium mb-1" style={{ color: colors.textMuted }}>
                                        {['container', 'header_section', 'detail_section', 'footer_section', 'table_header'].includes(selectedElement.element_type)
                                            ? 'Font (inherited by fields)'
                                            : 'Font'}
                                    </label>

                                    {/* Font Family */}
                                    <Dropdown
                                        value={selectedElement.font_family || 'Arial'}
                                        options={FONT_FAMILY_OPTIONS}
                                        onChange={(e) => updateElementProp('font_family', e.value)}
                                        className="w-full text-sm"
                                    />

                                    {/* Font Size */}
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs" style={{ color: colors.textMuted, width: 40 }}>Size</span>
                                        <InputNumber
                                            value={selectedElement.font_size || 10}
                                            onValueChange={(e) => updateElementProp('font_size', e.value || 10)}
                                            min={4} max={72} suffix=" pt"
                                            className="flex-1 text-sm report-pos-input"
                                        />
                                    </div>

                                    {/* Font Weight */}
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs" style={{ color: colors.textMuted, width: 40 }}>Weight</span>
                                        <Dropdown
                                            value={selectedElement.font_weight || 'normal'}
                                            options={FONT_WEIGHT_OPTIONS}
                                            onChange={(e) => updateElementProp('font_weight', e.value)}
                                            className="flex-1 text-sm report-pos-input"
                                        />
                                    </div>

                                    {/* Font Style */}
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs" style={{ color: colors.textMuted, width: 40 }}>Style</span>
                                        <Dropdown
                                            value={selectedElement.font_style || 'normal'}
                                            options={FONT_STYLE_OPTIONS}
                                            onChange={(e) => updateElementProp('font_style', e.value)}
                                            className="flex-1 text-sm report-pos-input"
                                        />
                                    </div>

                                    {/* Text Decoration */}
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs" style={{ color: colors.textMuted, width: 40 }}>Decor</span>
                                        <Dropdown
                                            value={selectedElement.text_decoration || 'none'}
                                            options={TEXT_DECORATION_OPTIONS}
                                            onChange={(e) => updateElementProp('text_decoration', e.value)}
                                            className="flex-1 text-sm report-pos-input"
                                        />
                                    </div>

                                    {/* Text Align */}
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs" style={{ color: colors.textMuted, width: 40 }}>Align</span>
                                        <Dropdown
                                            value={selectedElement.text_align || 'left'}
                                            options={TEXT_ALIGN_OPTIONS}
                                            onChange={(e) => updateElementProp('text_align', e.value)}
                                            className="flex-1 text-sm report-pos-input"
                                        />
                                    </div>

                                    {/* Text Color */}
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs" style={{ color: colors.textMuted, width: 40 }}>Color</span>
                                        <div className="flex items-center gap-2 flex-1">
                                            <input type="color" value={safeColor(selectedElement.text_color, '#000000')} onChange={(e) => updateElementProp('text_color', e.target.value)} style={{ width: 28, height: 22, padding: 0, border: "1px solid var(--theme-border-primary)", borderRadius: 3, cursor: "pointer" }} />
                                            <InputText
                                                value={selectedElement.text_color || '#000000'}
                                                onChange={(e) => updateElementProp('text_color', e.target.value)}
                                                className="flex-1 text-sm report-pos-input"
                                                style={{ fontSize: 10 }}
                                            />
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* Border / background styling — shown for line/box shape elements
                                AND for containers. Containers persist border + background in the
                                pattern element so they paint as a visible frame in the preview and
                                so auto-placed fields can inherit the background_color. */}
                            {(() => {
                                const isContainer = ['container', 'header_section', 'detail_section', 'footer_section', 'table_header'].includes(selectedElement.element_type);
                                const isShape = ['line_horizontal', 'line_vertical', 'box'].includes(selectedElement.element_type);
                                if (!isContainer && !isShape) return null;

                                // Background makes sense for everything except single lines.
                                const showBg = selectedElement.element_type !== 'line_horizontal'
                                            && selectedElement.element_type !== 'line_vertical';

                                const sectionLabel = isContainer ? 'Border & Background'
                                    : selectedElement.element_type === 'box' ? 'Box / Frame'
                                    : 'Line';

                                return (
                                    <>
                                        <div style={{ borderTop: `1px solid ${colors.borderPrimary}`, margin: '4px 0' }} />
                                        <label className="block text-xs font-medium mb-1" style={{ color: colors.textMuted }}>
                                            {sectionLabel}
                                        </label>

                                        <div className="flex items-center gap-2">
                                            <span className="text-xs" style={{ color: colors.textMuted, width: 50 }}>Width</span>
                                            <InputNumber
                                                value={selectedElement.border_width || (isContainer ? 0 : 1)}
                                                onValueChange={(e) => updateElementProp('border_width', e.value ?? 0)}
                                                min={0} max={20} minFractionDigits={1} maxFractionDigits={1} suffix=" px"
                                                className="flex-1 text-sm report-pos-input"
                                            />
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <span className="text-xs" style={{ color: colors.textMuted, width: 50 }}>Color</span>
                                            <div className="flex items-center gap-2 flex-1">
                                                <input type="color" value={safeColor(selectedElement.border_color, '#000000')} onChange={(e) => updateElementProp('border_color', e.target.value)} style={{ width: 28, height: 22, padding: 0, border: "1px solid var(--theme-border-primary)", borderRadius: 3, cursor: "pointer" }} />
                                                <InputText
                                                    value={selectedElement.border_color || '#000000'}
                                                    onChange={(e) => updateElementProp('border_color', e.target.value)}
                                                    className="flex-1 text-sm report-pos-input"
                                                    style={{ fontSize: 10 }}
                                                />
                                            </div>
                                        </div>

                                        {showBg && (
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs" style={{ color: colors.textMuted, width: 50 }}>Bg</span>
                                                <div className="flex items-center gap-2 flex-1">
                                                    <input type="color" value={safeColor(selectedElement.background_color, '#ffffff')} onChange={(e) => updateElementProp('background_color', e.target.value)} style={{ width: 28, height: 22, padding: 0, border: "1px solid var(--theme-border-primary)", borderRadius: 3, cursor: "pointer" }} />
                                                    <InputText
                                                        value={selectedElement.background_color || ''}
                                                        onChange={(e) => updateElementProp('background_color', e.target.value || undefined)}
                                                        placeholder="transparent"
                                                        className="flex-1 text-sm report-pos-input"
                                                        style={{ fontSize: 10 }}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </>
                                );
                            })()}

                            {/* Image upload (for image_placeholder) */}
                            {selectedElement.element_type === 'image_placeholder' && selectedPattern && (() => {
                                let imgIds: Record<string, number> = {};
                                try { if (selectedElement.content) imgIds = JSON.parse(selectedElement.content); } catch { /* not JSON */ }
                                return (
                                    <ImageUploadSection
                                        patternId={selectedPattern.id}
                                        elementId={selectedElement.id}
                                        selectedLanguage={selectedLanguage}
                                        enabledLanguages={enabledLanguages}
                                        imageIds={imgIds}
                                        onImageIdsChange={(ids) => updateElementProp('content', Object.keys(ids).length > 0 ? JSON.stringify(ids) : undefined)}
                                        colors={colors}
                                    />
                                );
                            })()}

                            {/* Container settings (only for sections) */}
                            {['container', 'header_section', 'detail_section', 'footer_section', 'table_header'].includes(selectedElement.element_type) && (
                                <>
                                    <div>
                                        <label className="block text-xs mb-1" style={{ color: colors.textMuted }}>
                                            {t.reportpatterndesigner_columns || 'Columns'}
                                        </label>
                                        <InputNumber
                                            value={selectedElement.container_columns || 1}
                                            onValueChange={(e) => updateElementProp('container_columns', e.value || 1)}
                                            min={1} max={10}
                                            className="w-full text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs mb-1" style={{ color: colors.textMuted }}>
                                            {t.reportpatterndesigner_gap || 'Gap'} ({unitLabel})
                                        </label>
                                        <InputNumber
                                            value={Number(selectedElement.container_gap) || 2}
                                            onValueChange={(e) => updateElementProp('container_gap', e.value || 2)}
                                            min={0} max={50} mode="decimal" minFractionDigits={1} maxFractionDigits={2}
                                            className="w-full text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs mb-1" style={{ color: colors.textMuted }}>
                                            {t.reportpatterndesigner_max_fields || 'Max Fields'}
                                        </label>
                                        <InputNumber
                                            value={selectedElement.max_fields ?? null}
                                            onValueChange={(e) => updateElementProp('max_fields', e.value || null)}
                                            min={1} max={100}
                                            className="w-full text-sm"
                                            placeholder={t.reportpatterndesigner_unlimited || 'Unlimited'}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs mb-1" style={{ color: colors.textMuted }}>
                                            {t.reportpatterndesigner_field_height || 'Field Height'} ({unitLabel})
                                        </label>
                                        <InputNumber
                                            value={selectedElement.field_height ?? null}
                                            onValueChange={(e) => updateElementProp('field_height', e.value || null)}
                                            min={1} max={100} mode="decimal" minFractionDigits={1} maxFractionDigits={2}
                                            className="w-full text-sm"
                                            placeholder={t.reportpatterndesigner_default || 'Default (5)'}
                                        />
                                    </div>
                                </>
                            )}
                        </>
                    ) : selectedForm ? (
                        <>
                            {/* Form Properties */}
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-semibold" style={{ color: colors.textPrimary }}>
                                    {t.reportpatterndesigner_form_props || 'Paper Properties'}
                                </span>
                                <Button
                                    icon="pi pi-save" label={t.reportpatterndesigner_save || 'Save'}
                                    className="p-button-sm p-button-success"
                                    onClick={saveFormProperties} loading={saving}
                                />
                            </div>

                            <div>
                                <label className="block text-xs mb-1" style={{ color: colors.textMuted }}>
                                    {t.reportpatterndesigner_paper_size || 'Paper Size'}
                                </label>
                                <Dropdown
                                    value={selectedForm.paper_size}
                                    options={PAPER_SIZE_OPTIONS}
                                    onChange={(e) => updateFormProp('paper_size', e.value)}
                                    className="w-full text-sm"
                                />
                            </div>

                            <div>
                                <label className="block text-xs mb-1" style={{ color: colors.textMuted }}>
                                    {t.reportpatterndesigner_orientation || 'Orientation'}
                                </label>
                                <Dropdown
                                    value={selectedForm.paper_orientation}
                                    options={[
                                        { label: t.reportpatterndesigner_portrait || 'Portrait', value: 'portrait' },
                                        { label: t.reportpatterndesigner_landscape || 'Landscape', value: 'landscape' },
                                    ]}
                                    onChange={(e) => updateFormProp('paper_orientation', e.value)}
                                    className="w-full text-sm"
                                />
                            </div>

                            <div>
                                <label className="block text-xs mb-1" style={{ color: colors.textMuted }}>
                                    {t.reportpatterndesigner_unit || 'Unit'}
                                </label>
                                <Dropdown
                                    value={selectedForm.paper_unit}
                                    options={[
                                        { label: 'Millimeter (mm)', value: 'mm' },
                                        { label: 'Inch (in)', value: 'inch' },
                                    ]}
                                    onChange={(e) => updateFormProp('paper_unit', e.value)}
                                    className="w-full text-sm"
                                />
                            </div>

                            {/* Custom dimensions */}
                            {selectedForm.paper_size === 'Custom' && (
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="block text-xs mb-1" style={{ color: colors.textMuted }}>{t.reportpatterndesigner_width || 'Width'}</label>
                                        <InputNumber value={selectedForm.paper_width ?? 210} onValueChange={(e) => updateFormProp('paper_width', e.value)} min={50} max={1000} mode="decimal" minFractionDigits={1} className="w-full text-sm" />
                                    </div>
                                    <div>
                                        <label className="block text-xs mb-1" style={{ color: colors.textMuted }}>{t.reportpatterndesigner_height || 'Height'}</label>
                                        <InputNumber value={selectedForm.paper_height ?? 297} onValueChange={(e) => updateFormProp('paper_height', e.value)} min={50} max={2000} mode="decimal" minFractionDigits={1} className="w-full text-sm" />
                                    </div>
                                </div>
                            )}

                            {/* Margins */}
                            <div>
                                <label className="block text-xs font-medium mb-2" style={{ color: colors.textMuted }}>
                                    {t.reportpatterndesigner_margins || 'Margins'} ({unitLabel})
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    {(['margin_top', 'margin_right', 'margin_bottom', 'margin_left'] as const).map(m => (
                                        <div key={m}>
                                            <label className="block text-xs mb-1" style={{ color: colors.textMuted }}>
                                                {m.replace('margin_', '').charAt(0).toUpperCase() + m.replace('margin_', '').slice(1)}
                                            </label>
                                            <InputNumber
                                                value={Number(selectedForm[m]) || 0}
                                                onValueChange={(e) => updateFormProp(m, e.value || 0)}
                                                min={0} max={100} mode="decimal" minFractionDigits={1} maxFractionDigits={2}
                                                className="w-full text-sm"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Report List specific */}
                            {selectedForm.form_type === 'report_list' && (
                                <>
                                    <div>
                                        <label className="block text-xs mb-1" style={{ color: colors.textMuted }}>
                                            {t.reportpatterndesigner_row_height || 'Row Height'} ({unitLabel})
                                        </label>
                                        <InputNumber
                                            value={selectedForm.row_height ? Number(selectedForm.row_height) : null}
                                            onValueChange={(e) => updateFormProp('row_height', e.value)}
                                            min={1} max={100} mode="decimal" minFractionDigits={1}
                                            className="w-full text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs mb-1" style={{ color: colors.textMuted }}>
                                            {t.reportpatterndesigner_max_columns || 'Max Columns'}
                                        </label>
                                        <InputNumber
                                            value={selectedForm.max_columns ?? null}
                                            onValueChange={(e) => updateFormProp('max_columns', e.value)}
                                            min={1} max={50}
                                            className="w-full text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs mb-1" style={{ color: colors.textMuted }}>
                                            {t.reportpatterndesigner_header_height || 'Header Height'} ({unitLabel})
                                        </label>
                                        <InputNumber
                                            value={selectedForm.header_height ? Number(selectedForm.header_height) : null}
                                            onValueChange={(e) => updateFormProp('header_height', e.value)}
                                            min={0} max={200} mode="decimal" minFractionDigits={1}
                                            className="w-full text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs mb-1" style={{ color: colors.textMuted }}>
                                            {t.reportpatterndesigner_footer_height || 'Footer Height'} ({unitLabel})
                                        </label>
                                        <InputNumber
                                            value={selectedForm.footer_height ? Number(selectedForm.footer_height) : null}
                                            onValueChange={(e) => updateFormProp('footer_height', e.value)}
                                            min={0} max={200} mode="decimal" minFractionDigits={1}
                                            className="w-full text-sm"
                                        />
                                    </div>
                                </>
                            )}
                        </>
                    ) : (
                        <div className="text-center py-8" style={{ color: colors.textMuted }}>
                            <i className="pi pi-info-circle text-3xl mb-3 block" />
                            <p className="text-sm">
                                {t.reportpatterndesigner_select_info || 'Select a Report Pattern to get started.'}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Styles */}
            <style>{`
                .p-dropdown { background-color: var(--theme-bg-tertiary); border-color: var(--theme-border-primary); color: var(--theme-text-primary); }
                .p-dropdown .p-dropdown-label { color: var(--theme-text-primary); }
                .p-dropdown .p-dropdown-trigger { color: var(--theme-text-muted); }
                .p-inputtext { background-color: var(--theme-bg-tertiary); border-color: var(--theme-border-primary); color: var(--theme-text-primary); }
                .p-inputtext::placeholder { color: var(--theme-text-muted); }
                .p-inputnumber-input { background-color: var(--theme-bg-tertiary); border-color: var(--theme-border-primary); color: var(--theme-text-primary); }

                /* Position/Size grid — mirror of ReportLayoutDesignerPanel so the
                   right sidebar doesn't show a horizontal scrollbar when a narrow
                   width is chosen. The min-width:0 on the inner input is what
                   actually fixes it; without it PrimeReact's default input
                   min-width forces the grid cells to overflow.

                   The class is also applied to the flex-1 inputs in the Font and
                   Border/Background sections — each PrimeReact component type
                   needs its own selector because the inner DOM differs:
                     InputNumber → .p-inputnumber-input is the real <input>
                     InputText   → IS the element itself (.p-inputtext)
                     Dropdown    → the wrapper is .p-dropdown, label child .p-dropdown-label
                */
                .report-pos-input .p-inputnumber { width: 100% !important; }
                .report-pos-input .p-inputnumber-input { width: 100% !important; min-width: 0 !important; }
                .report-pos-input.p-inputtext,
                .report-pos-input .p-inputtext { width: 100% !important; min-width: 0 !important; }
                .report-pos-input.p-dropdown,
                .report-pos-input .p-dropdown { width: 100% !important; min-width: 0 !important; }
                .report-pos-grid { max-width: 100%; overflow: hidden; }
            `}</style>
        </div>
    );
};

// Wrapper with ReactFlowProvider
const ReportPatternDesignerPanel: React.FC<ReportPatternDesignerPanelProps> = (props) => (
    <ReactFlowProvider>
        <ReportPatternDesignerPanelInner {...props} />
    </ReactFlowProvider>
);

export default ReportPatternDesignerPanel;
