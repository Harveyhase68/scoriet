// resources/js/Components/Modals/TableColumnDesignerModal.tsx - Design the columns of a Window Designer "Table" control
import React, { useState, useEffect } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Dropdown } from 'primereact/dropdown';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation, SupportedLanguage, getStoredLanguage } from '@/i18n';
import { LanguageField } from '../Panels/LanguageField';

// Canonical shape for a Table control's column — mirrors the backend's
// WindowDesignerController::buildImportedTableColumns() output exactly, so
// an imported column and a hand-built one look identical to the rest of the
// app. Not its own DB row (a column isn't independently selectable/movable
// on the canvas the way every other control here is) — just a JSON entry
// inside UiWindowControl.table_columns, edited entirely through this modal.
export interface TableColumnDef {
    name: string;
    caption: string;
    // Per-language translations of `caption` (2026-09-07, item a) - same
    // {lang_code: text} shape as UiWindowControl's own caption_labels;
    // `caption` itself stays the untranslated fallback. table_columns is a
    // free-form JSON blob (no DB schema of its own), so this needed no
    // migration - only the frontend shape gained a field.
    caption_labels?: Record<string, string> | null;
    control_type: string;
    width: number;
    align_h?: 'left' | 'center' | 'right' | null;
    align_v?: 'top' | 'middle' | 'bottom' | null;
    font_family?: string | null;
    font_size?: number | null;
    font_bold?: boolean;
    font_italic?: boolean;
    font_underline?: boolean;
    font_strikeout?: boolean;
    font_color?: string | null;
    control_state?: 'active' | 'display_only' | 'grayed' | null;
    data_binding?: string | null;
    browsed_file?: string | null;
}

// A deliberately small subset of the full control palette — a grid column
// is always a single-line cell renderer, so container/layout types and
// multi-line-only types (radio group, slider, ...) don't apply here.
const COLUMN_CONTROL_TYPES = [
    'text', 'textarea', 'password', 'number', 'decimal', 'currency', 'email', 'phone',
    'dropdown', 'multiselect', 'checkbox', 'date', 'time', 'datetime', 'image',
];

interface TableColumnDesignerModalProps {
    visible: boolean;
    columns: TableColumnDef[];
    onCancel: () => void;
    onApply: (columns: TableColumnDef[]) => void;
    // Per-language editing for each column's own Caption (2026-09-07, item
    // a) - the SAME shared language state/helpers WindowDesignerPanel
    // already uses everywhere else, passed down rather than duplicated
    // here, so switching the language dropdown inside this modal stays in
    // lockstep with the canvas/toolbar behind it.
    selectedLanguage: string;
    enabledLanguages: { value: string; label: string }[];
    onSelectLanguage: (lang: string) => void;
    seedLanguageLabels: (existing: Record<string, string> | null | undefined, newValue: string) => Record<string, string>;
    copyToAllLanguages: (current: string) => Record<string, string>;
}

const TOGGLE_FIELDS: { key: 'font_bold' | 'font_italic' | 'font_underline' | 'font_strikeout'; label: string }[] = [
    { key: 'font_bold', label: 'B' },
    { key: 'font_italic', label: 'I' },
    { key: 'font_underline', label: 'U' },
    { key: 'font_strikeout', label: 'S' },
];

const TableColumnDesignerModal: React.FC<TableColumnDesignerModalProps> = ({ visible, columns, onCancel, onApply, selectedLanguage, enabledLanguages, onSelectLanguage, seedLanguageLabels, copyToAllLanguages }) => {
    const { colors } = useTheme();
    const [currentLanguage] = useState<SupportedLanguage>(getStoredLanguage());
    const { t } = useTranslation(currentLanguage);

    // Working copy so Cancel truly discards - mirrors TabOrderModal's
    // pattern of only committing on Apply.
    const [workingColumns, setWorkingColumns] = useState<TableColumnDef[]>([]);
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

    useEffect(() => {
        if (!visible) return;
        setWorkingColumns(columns.map((c) => ({ ...c })));
        setSelectedIndex(columns.length > 0 ? 0 : null);
    }, [visible, columns]);

    const selected = selectedIndex != null ? workingColumns[selectedIndex] : null;

    const updateSelected = (patch: Partial<TableColumnDef>) => {
        if (selectedIndex == null) return;
        setWorkingColumns((prev) => prev.map((c, i) => (i === selectedIndex ? { ...c, ...patch } : c)));
    };

    const addColumn = () => {
        const existingNames = new Set(workingColumns.map((c) => c.name));
        let n = workingColumns.length + 1;
        while (existingNames.has(`COL${n}`)) n++;
        const newColumn: TableColumnDef = { name: `COL${n}`, caption: `Column ${n}`, control_type: 'text', width: 100 };
        setWorkingColumns((prev) => [...prev, newColumn]);
        setSelectedIndex(workingColumns.length);
    };

    const deleteColumn = (index: number) => {
        setWorkingColumns((prev) => prev.filter((_, i) => i !== index));
        setSelectedIndex(null);
    };

    const footer = (
        <div className="flex justify-end gap-2">
            <Button label={t.tablecolumndesigner_cancel || 'Cancel'} icon="pi pi-times" className="p-button-text" onClick={onCancel} />
            <Button label={t.tablecolumndesigner_apply || 'Apply'} icon="pi pi-check" className="p-button-success" onClick={() => onApply(workingColumns)} />
        </div>
    );

    return (
        <Dialog
            header={t.tablecolumndesigner_header || 'Table Columns'}
            visible={visible}
            onHide={onCancel}
            style={{ width: '760px' }}
            modal
            closable
            draggable
            resizable
            footer={footer}
        >
            <div className="flex gap-3" style={{ minHeight: '420px' }}>
                {/* Column list — pick which column's properties show on the right,
                    instead of the "double-click the tiny canvas cell" approach that
                    keeps opening the wrong thing. */}
                <div style={{ width: 200, flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
                    <div className="border rounded overflow-y-auto flex-1" style={{ borderColor: colors.borderPrimary, maxHeight: 440 }}>
                        {workingColumns.length === 0 && (
                            <div className="p-3 text-xs" style={{ color: colors.textMuted }}>
                                {t.tablecolumndesigner_empty || 'No columns yet'}
                            </div>
                        )}
                        {workingColumns.map((col, idx) => (
                            <div
                                key={idx}
                                onClick={() => setSelectedIndex(idx)}
                                className="px-3 py-2 cursor-pointer text-sm border-b truncate"
                                style={{
                                    backgroundColor: idx === selectedIndex ? 'rgba(59,130,246,0.25)' : 'transparent',
                                    borderColor: colors.borderPrimary,
                                }}
                            >
                                {(selectedLanguage && col.caption_labels?.[selectedLanguage]) || col.caption || col.name}
                            </div>
                        ))}
                    </div>
                    <Button
                        label={t.tablecolumndesigner_add || 'Add Column'}
                        icon="pi pi-plus"
                        className="p-button-text p-button-sm mt-2"
                        onClick={addColumn}
                    />
                </div>

                {/* Selected column's properties — same shape/spirit as a normal
                    control's Properties panel (caption, font, state, ...). */}
                <div className="flex-1 overflow-y-auto space-y-3" style={{ maxHeight: 460 }}>
                    {!selected ? (
                        <div className="text-sm" style={{ color: colors.textMuted }}>
                            {t.tablecolumndesigner_select_hint || 'Add or select a column to edit its properties.'}
                        </div>
                    ) : (
                        <>
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-semibold">
                                    {(selectedLanguage && selected.caption_labels?.[selectedLanguage]) || selected.caption || selected.name}
                                </span>
                                <div className="flex items-center gap-2">
                                    {/* Drives the SAME selectedLanguage the toolbar/canvas use -
                                        switching it here also updates the live window preview
                                        behind this modal, exactly like the standalone Translate
                                        popup does for every other Caption field. */}
                                    <Dropdown
                                        className="p-inputtext-sm"
                                        style={{ width: 90 }}
                                        value={selectedLanguage}
                                        options={enabledLanguages}
                                        onChange={(e) => onSelectLanguage(e.value)}
                                    />
                                    <Button
                                        icon="pi pi-trash"
                                        className="p-button-text p-button-danger p-button-sm"
                                        onClick={() => deleteColumn(selectedIndex as number)}
                                        tooltip={t.tablecolumndesigner_delete_column || 'Delete Column'}
                                        tooltipOptions={{ position: 'bottom' }}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-xs font-medium mb-1">{t.windowdesignerpanel_field_name || 'Field Name'}</label>
                                    <InputText className="w-full p-inputtext-sm" value={selected.name} onChange={(e) => updateSelected({ name: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium mb-1">{t.windowdesignerpanel_pos_width || 'Width'}</label>
                                    <InputNumber className="w-full" inputClassName="p-inputtext-sm" value={selected.width} min={10} onValueChange={(e) => updateSelected({ width: e.value ?? 100 })} />
                                </div>
                            </div>

                            <LanguageField
                                label={t.windowdesignerpanel_caption || 'Caption'}
                                value={(selectedLanguage && selected.caption_labels?.[selectedLanguage]) || selected.caption || ''}
                                onChange={(v) => updateSelected({ caption: v, caption_labels: seedLanguageLabels(selected.caption_labels, v) })}
                                onCopyToAll={() => {
                                    const current = (selectedLanguage && selected.caption_labels?.[selectedLanguage]) || selected.caption || '';
                                    updateSelected({ caption_labels: copyToAllLanguages(current) });
                                }}
                                copyTooltip={t.windowdesignerpanel_copy_to_all_languages || 'Copy to all languages'}
                            />

                            <div>
                                <label className="block text-xs font-medium mb-1">{t.tablecolumndesigner_control_type || 'Control Type'}</label>
                                <Dropdown
                                    className="w-full p-inputtext-sm"
                                    value={selected.control_type}
                                    options={COLUMN_CONTROL_TYPES.map((ct) => ({ label: ct, value: ct }))}
                                    onChange={(e) => updateSelected({ control_type: e.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-xs font-medium mb-1">{t.windowdesignerpanel_caption_align_h || 'Caption Horizontal'}</label>
                                    <Dropdown
                                        className="w-full p-inputtext-sm"
                                        value={selected.align_h || 'left'}
                                        options={[
                                            { label: t.windowdesignerpanel_align_left || 'Left', value: 'left' },
                                            { label: t.windowdesignerpanel_align_center || 'Center', value: 'center' },
                                            { label: t.windowdesignerpanel_align_right || 'Right', value: 'right' },
                                        ]}
                                        onChange={(e) => updateSelected({ align_h: e.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium mb-1">{t.windowdesignerpanel_caption_align_v || 'Caption Vertical'}</label>
                                    <Dropdown
                                        className="w-full p-inputtext-sm"
                                        value={selected.align_v || 'top'}
                                        options={[
                                            { label: t.windowdesignerpanel_align_top || 'Top', value: 'top' },
                                            { label: t.windowdesignerpanel_align_middle || 'Middle', value: 'middle' },
                                            { label: t.windowdesignerpanel_align_bottom || 'Bottom', value: 'bottom' },
                                        ]}
                                        onChange={(e) => updateSelected({ align_v: e.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium mb-1">{t.windowdesignerpanel_state || 'State'}</label>
                                <Dropdown
                                    className="w-full p-inputtext-sm"
                                    value={selected.control_state || 'active'}
                                    options={[
                                        { label: t.windowdesignerpanel_state_active || 'Active', value: 'active' },
                                        { label: t.windowdesignerpanel_state_display_only || 'Display Only', value: 'display_only' },
                                        { label: t.windowdesignerpanel_state_grayed || 'Grayed', value: 'grayed' },
                                    ]}
                                    onChange={(e) => updateSelected({ control_state: e.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium mb-1">{t.windowdesignerpanel_data_binding || 'Data Binding'}</label>
                                <InputText className="w-full p-inputtext-sm" value={selected.data_binding || ''} onChange={(e) => updateSelected({ data_binding: e.target.value || null })} />
                            </div>
                            <div>
                                <label className="block text-xs font-medium mb-1">{t.windowdesignerpanel_browsed_file || 'Browsed File'}</label>
                                <InputText className="w-full p-inputtext-sm" value={selected.browsed_file || ''} onChange={(e) => updateSelected({ browsed_file: e.target.value || null })} />
                            </div>

                            <div>
                                <label className="block text-xs font-medium mb-1">{t.windowdesignerpanel_font || 'Font'}</label>
                                <div className="flex gap-2 mb-2">
                                    <InputText
                                        className="flex-1 p-inputtext-sm"
                                        placeholder={t.windowdesignerpanel_font_family || 'Font Family'}
                                        value={selected.font_family || ''}
                                        onChange={(e) => updateSelected({ font_family: e.target.value || null })}
                                    />
                                    <InputNumber
                                        className="w-24"
                                        inputClassName="p-inputtext-sm"
                                        value={selected.font_size ?? null}
                                        min={1} max={200} step={0.25}
                                        placeholder={t.windowdesignerpanel_font_size || 'Size'}
                                        onValueChange={(e) => updateSelected({ font_size: e.value ?? null })}
                                    />
                                    <input
                                        type="color"
                                        value={selected.font_color || '#e5e7eb'}
                                        onChange={(e) => updateSelected({ font_color: e.target.value })}
                                        className="rounded border border-gray-600 cursor-pointer bg-transparent"
                                        style={{ width: 32, height: 32, padding: 0 }}
                                    />
                                </div>
                                <div className="flex gap-1">
                                    {TOGGLE_FIELDS.map(({ key, label }) => {
                                        const isOn = !!selected[key];
                                        return (
                                            // Plain Button, not ToggleButton - PrimeReact's own
                                            // checked-state CSS overrode the inline on/off styling.
                                            <Button
                                                key={key}
                                                label={label}
                                                type="button"
                                                onClick={() => updateSelected({ [key]: !isOn } as Partial<TableColumnDef>)}
                                                className="p-button-sm"
                                                style={{
                                                    width: 32,
                                                    backgroundColor: isOn ? '#3b82f6' : 'rgba(107,114,128,0.2)',
                                                    borderColor: isOn ? '#3b82f6' : 'rgba(107,114,128,0.5)',
                                                    color: isOn ? '#ffffff' : '#9ca3af',
                                                }}
                                            />
                                        );
                                    })}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </Dialog>
    );
};

export default TableColumnDesignerModal;
