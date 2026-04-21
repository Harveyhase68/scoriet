// resources/js/Components/Panels/AnchorSection.tsx
// Reusable Anchor configuration: 2 quick Dropdowns + 4 advanced % fields
import React, { useState, useMemo, useCallback } from 'react';
import { Dropdown } from 'primereact/dropdown';
import { InputNumber } from 'primereact/inputnumber';

interface AnchorValues {
  anchor_right: number | null;
  anchor_bottom: number | null;
  anchor_width: number | null;
  anchor_height: number | null;
}

interface AnchorSectionProps {
  values: AnchorValues;
  onChange: (updates: Partial<AnchorValues>) => void;
  colors: any;
}

// Horizontal presets: control anchor_right + anchor_width
const H_OPTIONS = [
  { label: '—', value: 'none' },        // null, null
  { label: 'Left', value: 'left' },      // right=0, width=null
  { label: 'Width', value: 'width' },    // right=null, width=100
  { label: 'Center', value: 'center' },  // right=50, width=null
  { label: 'Right', value: 'right' },    // right=100, width=null
  { label: 'Custom', value: 'custom' },  // non-standard values
];

const V_OPTIONS = [
  { label: '—', value: 'none' },
  { label: 'Top', value: 'top' },
  { label: 'Height', value: 'height' },
  { label: 'Center', value: 'center' },
  { label: 'Bottom', value: 'bottom' },
  { label: 'Custom', value: 'custom' },
];

// Detect preset from values (use Number() for DB decimal strings like "100.00")
function getHPreset(v: AnchorValues): string {
  const r = v.anchor_right != null ? Number(v.anchor_right) : null;
  const w = v.anchor_width != null ? Number(v.anchor_width) : null;
  // Width/Height always takes priority — regardless of right/bottom value
  if (w != null && w === 100) return 'width';
  if (w != null && w > 0) return 'custom'; // Non-100 width stretch
  // Position presets (only when width is null/0)
  if (r == null) return 'none';
  if (r === 0) return 'left';
  if (r === 50) return 'center';
  if (r === 100) return 'right';
  return 'custom';
}

function getVPreset(v: AnchorValues): string {
  const b = v.anchor_bottom != null ? Number(v.anchor_bottom) : null;
  const h = v.anchor_height != null ? Number(v.anchor_height) : null;
  if (h != null && h === 100) return 'height';
  if (h != null && h > 0) return 'custom';
  if (b == null) return 'none';
  if (b === 0) return 'top';
  if (b === 50) return 'center';
  if (b === 100) return 'bottom';
  return 'custom';
}

const AnchorSection: React.FC<AnchorSectionProps> = ({ values, onChange, colors }) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const hPreset = useMemo(() => getHPreset(values), [values]);
  const vPreset = useMemo(() => getVPreset(values), [values]);

  // Auto-open advanced when custom values are detected
  const hasCustom = hPreset === 'custom' || vPreset === 'custom';

  const setH = useCallback((preset: string) => {
    if (preset === 'custom') return; // Can't select custom from dropdown
    const map: Record<string, Partial<AnchorValues>> = {
      none: { anchor_right: null, anchor_width: null },
      left: { anchor_right: 0, anchor_width: null },
      width: { anchor_right: null, anchor_width: 100 },
      center: { anchor_right: 50, anchor_width: null },
      right: { anchor_right: 100, anchor_width: null },
    };
    onChange(map[preset] || map.none);
  }, [onChange]);

  const setV = useCallback((preset: string) => {
    if (preset === 'custom') return;
    const map: Record<string, Partial<AnchorValues>> = {
      none: { anchor_bottom: null, anchor_height: null },
      top: { anchor_bottom: 0, anchor_height: null },
      height: { anchor_bottom: null, anchor_height: 100 },
      center: { anchor_bottom: 50, anchor_height: null },
      bottom: { anchor_bottom: 100, anchor_height: null },
    };
    onChange(map[preset] || map.none);
  }, [onChange]);

  // Visual anchor indicator
  const renderVisual = () => {
    const s = 44;
    const p = 8;
    const r = values.anchor_right;
    const b = values.anchor_bottom;
    const w = values.anchor_width;
    const h = values.anchor_height;
    const hasR = r != null;
    const hasB = b != null;
    const hasW = w != null && w > 0;
    const hasH = h != null && h > 0;

    return (
      <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} style={{ display: 'block', margin: '0 auto 4px' }}>
        <rect x={1} y={1} width={s - 2} height={s - 2} rx={3} fill="none" stroke={colors.borderPrimary} strokeWidth={1} />
        <rect x={p} y={p} width={s - p * 2} height={s - p * 2} rx={2} fill="rgba(59,130,246,0.12)" stroke="#3b82f6" strokeWidth={1} />
        {hasW && <line x1={3} y1={s / 2} x2={s - 3} y2={s / 2} stroke="#f59e0b" strokeWidth={2} strokeDasharray="3,2" />}
        {hasH && <line x1={s / 2} y1={3} x2={s / 2} y2={s - 3} stroke="#f59e0b" strokeWidth={2} strokeDasharray="3,2" />}
        {hasR && !hasW && r === 0 && <circle cx={p - 1} cy={s / 2} r={3} fill="#10b981" />}
        {hasR && !hasW && r === 100 && <circle cx={s - p + 1} cy={s / 2} r={3} fill="#10b981" />}
        {hasR && !hasW && r === 50 && <circle cx={s / 2} cy={s / 2} r={3} fill="#a855f7" />}
        {hasB && !hasH && b === 0 && <circle cx={s / 2} cy={p - 1} r={3} fill="#10b981" />}
        {hasB && !hasH && b === 100 && <circle cx={s / 2} cy={s - p + 1} r={3} fill="#10b981" />}
        {hasB && !hasH && b === 50 && <circle cx={s / 2} cy={s / 2} r={3} fill="#a855f7" />}
      </svg>
    );
  };

  // Filter out 'custom' from selectable options (only shown when detected)
  const hSelectableOptions = H_OPTIONS.filter(o => o.value !== 'custom' || hPreset === 'custom');
  const vSelectableOptions = V_OPTIONS.filter(o => o.value !== 'custom' || vPreset === 'custom');

  return (
    <div>
      <div style={{ borderTop: `1px solid ${colors.borderPrimary}`, margin: '6px 0 4px' }} />
      <label style={{ fontSize: 10, color: colors.textMuted, fontWeight: 600, textTransform: 'uppercase' }}>
        Anchor
      </label>

      {renderVisual()}

      {/* Quick presets */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
        <div style={{ flex: 1 }}>
          <span style={{ fontSize: 9, color: colors.textMuted }}>Horizontal</span>
          <Dropdown value={hPreset} options={hSelectableOptions} onChange={e => setH(e.value)}
            style={{ width: '100%', fontSize: 10 }} className="p-inputtext-sm" />
        </div>
        <div style={{ flex: 1 }}>
          <span style={{ fontSize: 9, color: colors.textMuted }}>Vertical</span>
          <Dropdown value={vPreset} options={vSelectableOptions} onChange={e => setV(e.value)}
            style={{ width: '100%', fontSize: 10 }} className="p-inputtext-sm" />
        </div>
      </div>

      {/* Advanced toggle */}
      <button
        onClick={() => setShowAdvanced(!showAdvanced)}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: 9, color: hasCustom ? '#f59e0b' : colors.textMuted,
          padding: '2px 0', display: 'flex', alignItems: 'center', gap: 4,
          fontWeight: hasCustom ? 600 : 400,
        }}
      >
        <i className={`pi ${showAdvanced ? 'pi-chevron-down' : 'pi-chevron-right'}`} style={{ fontSize: 8 }} />
        Advanced {hasCustom && '(custom values)'}
      </button>

      {/* Advanced % fields */}
      {(showAdvanced || hasCustom) && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3, marginTop: 2 }}>
          <div>
            <span style={{ fontSize: 8, color: colors.textMuted }}>Right %</span>
            <InputNumber value={values.anchor_right} onValueChange={e => onChange({ anchor_right: e.value ?? null })}
              min={0} max={100} suffix=" %" style={{ width: '100%' }} inputStyle={{ fontSize: 10, padding: '3px 6px' }} className="p-inputtext-sm" />
          </div>
          <div>
            <span style={{ fontSize: 8, color: colors.textMuted }}>Bottom %</span>
            <InputNumber value={values.anchor_bottom} onValueChange={e => onChange({ anchor_bottom: e.value ?? null })}
              min={0} max={100} suffix=" %" style={{ width: '100%' }} inputStyle={{ fontSize: 10, padding: '3px 6px' }} className="p-inputtext-sm" />
          </div>
          <div>
            <span style={{ fontSize: 8, color: colors.textMuted }}>Width %</span>
            <InputNumber value={values.anchor_width} onValueChange={e => onChange({ anchor_width: e.value ?? null })}
              min={0} max={100} suffix=" %" style={{ width: '100%' }} inputStyle={{ fontSize: 10, padding: '3px 6px' }} className="p-inputtext-sm" />
          </div>
          <div>
            <span style={{ fontSize: 8, color: colors.textMuted }}>Height %</span>
            <InputNumber value={values.anchor_height} onValueChange={e => onChange({ anchor_height: e.value ?? null })}
              min={0} max={100} suffix=" %" style={{ width: '100%' }} inputStyle={{ fontSize: 10, padding: '3px 6px' }} className="p-inputtext-sm" />
          </div>
        </div>
      )}
    </div>
  );
};

export default AnchorSection;
