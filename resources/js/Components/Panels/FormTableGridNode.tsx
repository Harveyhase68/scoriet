// resources/js/Components/Panels/FormTableGridNode.tsx
// ReactFlow Custom Node for data_table window type in Form Layout Designer
// Simple table with column resize, reorder, and multi-language headers
import React, { useState, useRef, useEffect } from 'react';

// ========== INTERFACES ==========

export interface FormTableColumn {
  key: string; // placement id or field id
  fieldName: string;
  headerText: string;
  width: number; // in pixels
  sortOrder: number;
  isSelected: boolean;
}

export interface FormTableGridNodeData {
  columns: FormTableColumn[];
  rowHeight: number;
  windowWidth: number;
  bgColor: string;
  textColor: string;
  headerBgColor: string;
  selectedColumnKey: string | null;
  onSelectColumn: (key: string | null) => void;
  onColumnResized: (key: string, newWidth: number) => void;
  onColumnsReordered: (orderedKeys: string[]) => void;
  [key: string]: unknown;
}

// ========== SAMPLE DATA ==========

const SAMPLE_DATA = [
  ['Product A', '29.90', '150', 'Active', '01.01.2026', 'Lorem ipsum'],
  ['Product B', '49.50', '85', 'Pending', '15.03.2026', 'Dolor sit amet'],
  ['Product C', '12.00', '320', 'Active', '22.06.2026', 'Consectetur'],
  ['Product D', '99.99', '42', 'Inactive', '30.09.2026', 'Adipiscing elit'],
  ['Product E', '5.75', '999', 'Active', '12.12.2026', 'Sed do eiusmod'],
];

const SAMPLE_ROWS = 5;

// ========== COMPONENT ==========

const FormTableGridNode = ({ data }: { data: FormTableGridNodeData }) => {
  const {
    columns: propColumns, rowHeight, windowWidth,
    textColor, headerBgColor,
    onSelectColumn, onColumnResized, onColumnsReordered,
  } = data;

  // Local resize state
  const [resizeDelta, setResizeDelta] = useState<{ colKey: string; deltaPx: number } | null>(null);
  const resizeRef = useRef<{ colKey: string; startX: number } | null>(null);

  // Local drag reorder state
  const [dragState, setDragState] = useState<{ colKey: string; startX: number; currentX: number; colIdx: number } | null>(null);
  const dragRef = useRef<{ colKey: string; startX: number; colIdx: number } | null>(null);

  // Apply live resize
  const columns = propColumns.map(col => {
    if (resizeDelta && col.key === resizeDelta.colKey) {
      return { ...col, width: Math.max(50, col.width + resizeDelta.deltaPx) };
    }
    return col;
  });

  // Resize handlers
  useEffect(() => {
    if (!resizeRef.current) return;
    const onMove = (e: MouseEvent) => {
      if (!resizeRef.current) return;
      setResizeDelta({ colKey: resizeRef.current.colKey, deltaPx: e.clientX - resizeRef.current.startX });
    };
    const onUp = () => {
      if (resizeRef.current && resizeDelta) {
        const col = propColumns.find(c => c.key === resizeRef.current!.colKey);
        if (col) onColumnResized(resizeRef.current.colKey, Math.max(50, col.width + resizeDelta.deltaPx));
      }
      resizeRef.current = null;
      setResizeDelta(null);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    return () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); };
  }, [resizeDelta, propColumns, onColumnResized]);

  // Drag reorder handlers
  useEffect(() => {
    if (!dragRef.current) return;
    const onMove = (e: MouseEvent) => { if (dragRef.current) setDragState(prev => prev ? { ...prev, currentX: e.clientX } : null); };
    const onUp = (e: MouseEvent) => {
      if (!dragRef.current) return;
      const totalDelta = e.clientX - dragRef.current.startX;
      if (Math.abs(totalDelta) > 20) {
        let cumX = 0, targetIdx = dragRef.current.colIdx;
        const fromIdx = dragRef.current.colIdx;
        for (let i = 0; i < columns.length; i++) {
          const colCenter = cumX + columns[i].width / 2;
          const mousePos = columns.slice(0, fromIdx).reduce((s, c) => s + c.width, 0) + columns[fromIdx].width / 2 + totalDelta;
          if (mousePos < colCenter) { targetIdx = i; break; }
          cumX += columns[i].width;
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
  const totalWidth = columns.reduce((s, c) => s + c.width, 0);
  const rh = rowHeight || 32;

  if (propColumns.length === 0) {
    return (
      <div className="nopan nodrag" style={{
        width: windowWidth, minHeight: rh * 3, pointerEvents: 'all',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: '1px dashed rgba(107,114,128,0.4)', borderRadius: 4,
        color: textColor, fontSize: 12, opacity: 0.5,
      }}>
        Click fields or use Auto-place to add columns.
      </div>
    );
  }

  return (
    <div className="nopan nodrag" style={{
      width: windowWidth, overflowX: 'auto', overflowY: 'hidden',
      pointerEvents: 'all', position: 'relative',
      scrollbarWidth: 'thin', scrollbarColor: 'rgba(107,114,128,0.4) transparent',
    }}>
      {/* Table — may be wider than windowWidth, scrolls horizontally */}
      <div style={{ border: '1px solid rgba(107,114,128,0.3)', borderRadius: 4, width: totalWidth, minWidth: totalWidth }}>
        {/* Header row */}
        <div style={{ display: 'flex', backgroundColor: headerBgColor || 'rgba(107,114,128,0.2)', borderBottom: '1px solid rgba(107,114,128,0.3)', height: rh }}>
          {columns.map((col, idx) => {
            const isBeingDragged = isDragging && dragState?.colKey === col.key;
            return (
              <div key={`h-${col.key}`} style={{
                width: col.width, height: '100%', position: 'relative',
                display: 'flex', alignItems: 'center', padding: '0 8px',
                fontSize: 12, fontWeight: 600, color: textColor,
                borderRight: idx < columns.length - 1 ? '1px solid rgba(107,114,128,0.2)' : 'none',
                cursor: isDragging ? 'grabbing' : 'grab', flexShrink: 0, userSelect: 'none',
                boxShadow: col.isSelected ? 'inset 0 0 0 2px #f59e0b' : 'none',
                opacity: isBeingDragged ? 0.6 : 1,
                transform: isBeingDragged ? `translateX(${dragDelta}px)` : 'none',
                zIndex: isBeingDragged ? 50 : 1,
                backgroundColor: isBeingDragged ? 'rgba(59,130,246,0.1)' : 'transparent',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}
                onMouseDown={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  if (e.clientX - rect.left > rect.width - 6) {
                    e.stopPropagation(); e.preventDefault();
                    resizeRef.current = { colKey: col.key, startX: e.clientX };
                    setResizeDelta({ colKey: col.key, deltaPx: 0 });
                  } else {
                    e.stopPropagation();
                    onSelectColumn(col.key);
                    dragRef.current = { colKey: col.key, startX: e.clientX, colIdx: idx };
                    setDragState({ colKey: col.key, startX: e.clientX, currentX: e.clientX, colIdx: idx });
                  }
                }}
              >
                {col.headerText}
                <div style={{ position: 'absolute', right: 0, top: 0, width: 6, height: '100%', cursor: 'col-resize' }} />
              </div>
            );
          })}
        </div>

        {/* Data rows */}
        {Array.from({ length: SAMPLE_ROWS }).map((_, rowIdx) => (
          <div key={`r-${rowIdx}`} style={{
            display: 'flex', height: rh,
            backgroundColor: rowIdx % 2 === 0 ? 'transparent' : 'rgba(107,114,128,0.05)',
            borderBottom: rowIdx < SAMPLE_ROWS - 1 ? '1px solid rgba(107,114,128,0.1)' : 'none',
          }}>
            {columns.map((col, idx) => (
              <div key={`c-${rowIdx}-${idx}`} style={{
                width: col.width, height: '100%', display: 'flex', alignItems: 'center', padding: '0 8px',
                fontSize: 11, color: textColor, opacity: 0.7,
                borderRight: idx < columns.length - 1 ? '1px solid rgba(107,114,128,0.1)' : 'none',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                cursor: 'pointer', flexShrink: 0,
                boxShadow: col.isSelected ? 'inset 0 0 0 1px rgba(245,158,11,0.3)' : 'none',
              }} onClick={(e) => { e.stopPropagation(); onSelectColumn(col.key); }}>
                {SAMPLE_DATA[rowIdx]?.[idx] || `Data ${rowIdx + 1}`}
              </div>
            ))}
          </div>
        ))}
      </div>

    </div>
  );
};

export default FormTableGridNode;
