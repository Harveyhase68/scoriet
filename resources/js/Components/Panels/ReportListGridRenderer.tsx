// resources/js/Components/Panels/ReportListGridRenderer.tsx
// Two ReactFlow Custom Nodes: TableHeaderGrid (resize+reorder) and TableDetailGrid (display only)
import React, { useState, useRef, useCallback, useEffect } from 'react';

// ========== INTERFACES ==========

interface ListStyleConfig {
  header_bg_color?: string;
  header_text_color?: string;
  header_font_weight?: string;
  header_font_size?: number;
  header_border_bottom?: number;
  // Per-side header borders
  header_border_top_width?: number;
  header_border_top_color?: string;
  header_border_top_style?: string;
  header_border_left_width?: number;
  header_border_left_color?: string;
  header_border_left_style?: string;
  header_border_right_width?: number;
  header_border_right_color?: string;
  header_border_right_style?: string;
  header_border_bottom_width?: number;
  header_border_bottom_color?: string;
  header_border_bottom_style?: string;
  // Row styles
  row_even_bg_color?: string;
  row_odd_bg_color?: string;
  row_border_bottom?: number;
  row_border_color?: string;
  row_border_bottom_width?: number;
  row_border_bottom_color?: string;
  row_border_bottom_style?: string;
  // Detail border per side
  detail_border_left_width?: number;
  detail_border_left_color?: string;
  detail_border_left_style?: string;
  detail_border_right_width?: number;
  detail_border_right_color?: string;
  detail_border_right_style?: string;
  detail_border_bottom_width?: number;
  detail_border_bottom_color?: string;
  detail_border_bottom_style?: string;
  // Column separator
  column_separator_width?: number;
  column_separator_color?: string;
  column_separator_style?: string;
  // Outer border (legacy fallback)
  outer_border_width?: number;
  outer_border_color?: string;
}

interface ColumnInfo {
  key: string;
  width: number;
  widthPx: number;
  headerText: string;
  sampleData: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: string;
  fontStyle: string;
  textDecoration: string;
  textAlign: string;
  textColor: string;
  backgroundColor?: string;
  isSelected: boolean;
  sortOrder: number;
  headerFontFamily: string;
  headerFontSize: number;
  headerFontWeight: string;
  headerTextColor: string;
}

// Shared data for both header and detail grid nodes
export interface TableGridNodeData {
  columns: ColumnInfo[];
  rowHeightPx: number;
  printableWidthPx: number;
  pxPerUnit: number;
  listStyle: ListStyleConfig;
  selectedElementId: string | null;
  // Which node this is
  selectionMode: 'header' | 'detail';
  // Which mode is currently active (set by user click)
  columnSelectionMode: 'header' | 'detail';
  onSelectColumn: (key: string | null, mode: 'header' | 'detail') => void;
  // Only used by header grid:
  onColumnResized?: (key: string, newWidth: number) => void;
  onColumnsReordered?: (orderedKeys: string[]) => void;
  [key: string]: unknown;
}

// ========== CONSTANTS ==========

const SAMPLE_ROWS = 5;

// ========== TABLE HEADER GRID NODE (with resize + reorder) ==========

const TableHeaderGridNode = ({ data }: { data: TableGridNodeData }) => {
  const {
    columns: propColumns, rowHeightPx, printableWidthPx, pxPerUnit,
    listStyle: style, onSelectColumn, onColumnResized, onColumnsReordered,
  } = data;

  const [resizeDelta, setResizeDelta] = useState<{ colKey: string; deltaPx: number } | null>(null);
  const resizeRef = useRef<{ colKey: string; startX: number } | null>(null);
  const [dragState, setDragState] = useState<{ colKey: string; startX: number; currentX: number; colIdx: number } | null>(null);
  const dragRef = useRef<{ colKey: string; startX: number; colIdx: number } | null>(null);

  const columns = propColumns.map(col => {
    if (resizeDelta && col.key === resizeDelta.colKey) {
      const minPx = 10 * (pxPerUnit / (96 / 25.4));
      return { ...col, widthPx: Math.max(minPx, col.widthPx + resizeDelta.deltaPx) };
    }
    return col;
  });

  // Resize handlers
  const handleResizeMouseDown = useCallback((e: React.MouseEvent, colKey: string) => {
    e.stopPropagation(); e.preventDefault();
    resizeRef.current = { colKey, startX: e.clientX };
    setResizeDelta({ colKey, deltaPx: 0 });
  }, []);

  useEffect(() => {
    if (!resizeRef.current) return;
    const onMove = (e: MouseEvent) => {
      if (!resizeRef.current) return;
      setResizeDelta({ colKey: resizeRef.current.colKey, deltaPx: e.clientX - resizeRef.current.startX });
    };
    const onUp = () => {
      if (resizeRef.current && resizeDelta && onColumnResized) {
        const col = propColumns.find(c => c.key === resizeRef.current!.colKey);
        if (col) {
          const minPx = 10 * (pxPerUnit / (96 / 25.4));
          const newPx = Math.max(minPx, col.widthPx + resizeDelta.deltaPx);
          onColumnResized(resizeRef.current.colKey, Math.round((newPx / pxPerUnit) * 100) / 100);
        }
      }
      resizeRef.current = null;
      setResizeDelta(null);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    return () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); };
  }, [resizeDelta, propColumns, pxPerUnit, onColumnResized]);

  // Drag reorder handlers
  const handleDragMouseDown = useCallback((e: React.MouseEvent, colKey: string, colIdx: number) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    dragRef.current = { colKey, startX: e.clientX, colIdx };
    setDragState({ colKey, startX: e.clientX, currentX: e.clientX, colIdx });
  }, []);

  useEffect(() => {
    if (!dragRef.current) return;
    const onMove = (e: MouseEvent) => { if (dragRef.current) setDragState(prev => prev ? { ...prev, currentX: e.clientX } : null); };
    const onUp = (e: MouseEvent) => {
      if (!dragRef.current) return;
      const totalDelta = e.clientX - dragRef.current.startX;
      if (Math.abs(totalDelta) > 20 && onColumnsReordered) {
        let cumX = 0;
        let targetIdx = dragRef.current.colIdx;
        const fromIdx = dragRef.current.colIdx;
        for (let i = 0; i < columns.length; i++) {
          const colCenter = cumX + columns[i].widthPx / 2;
          const mousePos = columns.slice(0, fromIdx).reduce((s, c) => s + c.widthPx, 0) + columns[fromIdx].widthPx / 2 + totalDelta;
          if (mousePos < colCenter) { targetIdx = i; break; }
          cumX += columns[i].widthPx;
          targetIdx = i + 1;
        }
        if (targetIdx > fromIdx) targetIdx--;
        if (targetIdx !== fromIdx) {
          const keys = columns.map(c => c.key);
          const [moved] = keys.splice(fromIdx, 1);
          keys.splice(targetIdx, 0, moved);
          onColumnsReordered(keys);
        }
      }
      dragRef.current = null;
      setDragState(null);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    return () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); };
  }, [dragState, columns, onColumnsReordered]);

  const isDragging = dragState != null;
  const dragDelta = dragState ? dragState.currentX - dragState.startX : 0;
  const totalWidth = columns.reduce((s, c) => s + c.widthPx, 0);

  if (propColumns.length === 0) {
    return (
      <div className="nopan nodrag nowheel" style={{
        width: printableWidthPx, minHeight: rowHeightPx,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#9ca3af', fontSize: 11, border: '1px dashed #d1d5db', borderRadius: '4px 4px 0 0',
        pointerEvents: 'all', backgroundColor: style.header_bg_color || '#e0e0e0',
      }}>
        Click fields or use Auto-place to add columns.
      </div>
    );
  }

  return (
    <div className="nopan nodrag nowheel" style={{ overflow: 'visible', pointerEvents: 'all', position: 'relative' }}>
      <div style={{
        borderTop: `${style.header_border_top_width ?? style.outer_border_width ?? 1}px ${(style.header_border_top_style as string) || 'solid'} ${(style.header_border_top_color as string) || style.outer_border_color || '#000000'}`,
        borderLeft: `${style.header_border_left_width ?? style.outer_border_width ?? 1}px ${(style.header_border_left_style as string) || 'solid'} ${(style.header_border_left_color as string) || style.outer_border_color || '#000000'}`,
        borderRight: `${style.header_border_right_width ?? style.outer_border_width ?? 1}px ${(style.header_border_right_style as string) || 'solid'} ${(style.header_border_right_color as string) || style.outer_border_color || '#000000'}`,
        borderBottom: `${style.header_border_bottom_width ?? style.header_border_bottom ?? 1}px ${(style.header_border_bottom_style as string) || 'solid'} ${(style.header_border_bottom_color as string) || style.outer_border_color || '#000000'}`,
        width: totalWidth,
        display: 'flex', height: rowHeightPx,
        backgroundColor: style.header_bg_color || '#e0e0e0',
      }}>
        {columns.map((col, idx) => {
          const isBeingDragged = isDragging && dragState?.colKey === col.key;
          return (
            <div
              key={`hdr-${col.key}`}
              style={{
                width: col.widthPx, height: '100%', position: 'relative',
                display: 'flex', alignItems: 'center', padding: '0 6px',
                fontFamily: col.headerFontFamily, fontSize: col.headerFontSize,
                fontWeight: col.headerFontWeight as any, color: col.headerTextColor,
                borderRight: idx < columns.length - 1
                  ? `${style.column_separator_width || 0.5}px ${(style.column_separator_style as string) || 'solid'} ${style.column_separator_color || '#cccccc'}` : 'none',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                cursor: isDragging ? 'grabbing' : 'grab', flexShrink: 0, userSelect: 'none',
                boxShadow: col.isSelected && data.columnSelectionMode === 'header' ? 'inset 0 0 0 2px #f59e0b' : (col.isSelected && data.columnSelectionMode === 'detail' ? 'inset 0 0 0 1px rgba(59,130,246,0.3)' : 'none'),
                opacity: isBeingDragged ? 0.6 : 1,
                transform: isBeingDragged ? `translateX(${dragDelta}px)` : 'none',
                zIndex: isBeingDragged ? 50 : 1,
                backgroundColor: isBeingDragged ? 'rgba(59,130,246,0.15)' : 'transparent',
              }}
              onMouseDown={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                if (e.clientX - rect.left > rect.width - 6) {
                  handleResizeMouseDown(e, col.key);
                } else {
                  onSelectColumn(col.key, 'header');
                  handleDragMouseDown(e, col.key, idx);
                }
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {col.headerText}
              <div style={{ position: 'absolute', right: 0, top: 0, width: 6, height: '100%', cursor: 'col-resize' }} />
            </div>
          );
        })}
      </div>
      {totalWidth > printableWidthPx && (
        <div style={{
          position: 'absolute', top: 0, left: printableWidthPx,
          width: 2, height: rowHeightPx,
          background: 'repeating-linear-gradient(180deg, #ef4444 0, #ef4444 4px, transparent 4px, transparent 8px)',
          opacity: 0.6, pointerEvents: 'none',
        }} />
      )}
    </div>
  );
};

// ========== TABLE DETAIL GRID NODE (display + select only) ==========

const TableDetailGridNode = ({ data }: { data: TableGridNodeData }) => {
  const { columns, rowHeightPx, printableWidthPx, listStyle: style, onSelectColumn } = data;

  if (columns.length === 0) {
    return (
      <div className="nopan nodrag nowheel" style={{
        width: printableWidthPx, minHeight: rowHeightPx * 2,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#9ca3af', fontSize: 11, border: '1px dashed #d1d5db', borderRadius: '0 0 4px 4px',
        pointerEvents: 'all',
      }}>
        <i className="pi pi-table" style={{ fontSize: 24, opacity: 0.3, marginRight: 8 }} />
        Data rows will appear here.
      </div>
    );
  }

  const totalWidth = columns.reduce((s, c) => s + c.widthPx, 0);

  return (
    <div className="nopan nodrag nowheel" style={{ overflow: 'visible', pointerEvents: 'all', position: 'relative' }}>
      <div style={{
        borderLeft: `${style.detail_border_left_width ?? style.outer_border_width ?? 1}px ${(style.detail_border_left_style as string) || 'solid'} ${(style.detail_border_left_color as string) || style.outer_border_color || '#000000'}`,
        borderRight: `${style.detail_border_right_width ?? style.outer_border_width ?? 1}px ${(style.detail_border_right_style as string) || 'solid'} ${(style.detail_border_right_color as string) || style.outer_border_color || '#000000'}`,
        borderBottom: `${style.detail_border_bottom_width ?? style.outer_border_width ?? 1}px ${(style.detail_border_bottom_style as string) || 'solid'} ${(style.detail_border_bottom_color as string) || style.outer_border_color || '#000000'}`,
        borderTop: 'none',
        width: totalWidth,
      }}>
        {Array.from({ length: SAMPLE_ROWS }).map((_, rowIdx) => (
          <div key={`row-${rowIdx}`} style={{
            display: 'flex',
            backgroundColor: rowIdx % 2 === 0 ? (style.row_even_bg_color || '#ffffff') : (style.row_odd_bg_color || '#f5f5f5'),
            borderBottom: rowIdx < SAMPLE_ROWS - 1
              ? `${style.row_border_bottom_width ?? style.row_border_bottom ?? 0.5}px ${(style.row_border_bottom_style as string) || 'solid'} ${(style.row_border_bottom_color as string) || style.row_border_color || '#cccccc'}` : 'none',
            height: rowHeightPx,
          }}>
            {columns.map((col, idx) => (
              <div
                key={`cell-${rowIdx}-${col.key}`}
                style={{
                  width: col.widthPx, height: '100%',
                  display: 'flex', alignItems: 'center', padding: '0 4px',
                  fontFamily: col.fontFamily, fontSize: col.fontSize,
                  fontWeight: col.fontWeight as any, fontStyle: col.fontStyle as any,
                  textDecoration: col.textDecoration, color: col.textColor,
                  backgroundColor: col.backgroundColor || 'transparent',
                  borderRight: idx < columns.length - 1
                    ? `${style.column_separator_width || 0.5}px ${(style.column_separator_style as string) || 'solid'} ${style.column_separator_color || '#cccccc'}` : 'none',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  cursor: 'pointer', flexShrink: 0,
                  boxShadow: col.isSelected && data.columnSelectionMode === 'detail' ? 'inset 0 0 0 2px #f59e0b' : (col.isSelected && data.columnSelectionMode === 'header' ? 'inset 0 0 0 1px rgba(59,130,246,0.15)' : 'none'),
                }}
                onClick={(e) => { e.stopPropagation(); onSelectColumn(col.key, 'detail'); }}
              >
                {col.sampleData}
              </div>
            ))}
          </div>
        ))}
      </div>
      {totalWidth > printableWidthPx && (
        <div style={{
          position: 'absolute', top: 0, left: printableWidthPx,
          width: 2, height: rowHeightPx * SAMPLE_ROWS,
          background: 'repeating-linear-gradient(180deg, #ef4444 0, #ef4444 4px, transparent 4px, transparent 8px)',
          opacity: 0.6, pointerEvents: 'none',
        }} />
      )}
    </div>
  );
};

// Export both nodes and the old name for backward compat
export default TableHeaderGridNode;
export { TableDetailGridNode };
export type { ListStyleConfig, ColumnInfo };
