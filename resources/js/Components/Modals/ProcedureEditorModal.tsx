// resources/js/Components/Modals/ProcedureEditorModal.tsx - Editor for SML
// procedures, in one of two scopes: global (project-wide, callable from any
// window) or local (callable only from within one window). Same component
// for both - only the `scope` prop and the API query param differ.
// List+detail layout mirrors TableColumnDesignerModal.tsx; the code editor
// reuses FileModal's MultiLanguageCodeEditor, same as WindowCodeEditorModal.
import React, { useState, useEffect, useCallback } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Checkbox } from 'primereact/checkbox';
import { confirmDialog } from 'primereact/confirmdialog';
import { useToast } from '@/contexts/ToastContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation, SupportedLanguage, getStoredLanguage } from '@/i18n';
import { apiClient } from '@/lib/api';
import { MultiLanguageCodeEditor } from '../Panels/FileModal';

export type ProcedureScope = { type: 'project'; projectId: number } | { type: 'window'; windowId: number };

interface ProcedureRow {
    id: number;
    name: string;
    params: string | null;
    return_type: string | null;
    is_private: boolean;
    code: string;
}

interface ProcedureEditorModalProps {
    visible: boolean;
    onHide: () => void;
    scope: ProcedureScope;
    title?: string;
}

const ProcedureEditorModal: React.FC<ProcedureEditorModalProps> = ({ visible, onHide, scope, title }) => {
    const [currentLanguage] = useState<SupportedLanguage>(getStoredLanguage());
    const { t } = useTranslation(currentLanguage);
    const { colors } = useTheme();
    const toast = useToast();

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [procedures, setProcedures] = useState<ProcedureRow[]>([]);
    const [selectedId, setSelectedId] = useState<number | null>(null);
    // Local edit buffer for the selected procedure - only committed to the
    // server on explicit Save, same pattern as WindowCodeEditorModal.
    const [draft, setDraft] = useState<ProcedureRow | null>(null);

    const queryParam = scope.type === 'project' ? `project_id=${scope.projectId}` : `window_id=${scope.windowId}`;

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await apiClient.get(`/procedures?${queryParam}`);
            const rows: ProcedureRow[] = res.data || [];
            setProcedures(rows);
            setSelectedId(rows.length > 0 ? rows[0].id : null);
        } catch (err) {
            console.error(err);
            toast.showError(t.procedureeditor_load_error || 'Failed to load procedures');
        } finally {
            setLoading(false);
        }
    }, [queryParam, toast, t]);

    useEffect(() => {
        if (visible) load();
    }, [visible, load]);

    useEffect(() => {
        const found = procedures.find((p) => p.id === selectedId) || null;
        setDraft(found ? { ...found } : null);
    }, [selectedId, procedures]);

    const handleAdd = useCallback(async () => {
        const existingNames = new Set(procedures.map((p) => p.name));
        let n = procedures.length + 1;
        while (existingNames.has(`NewProcedure${n}`)) n++;
        const name = `NewProcedure${n}`;

        try {
            const body: any = { name, return_type: 'void', is_private: false, code: '' };
            if (scope.type === 'project') body.project_id = scope.projectId;
            else body.window_id = scope.windowId;
            const res = await apiClient.post('/procedures', body);
            setProcedures((prev) => [...prev, res.data]);
            setSelectedId(res.data.id);
        } catch (err) {
            console.error(err);
            toast.showError(t.procedureeditor_save_error || 'Failed to save procedure');
        }
    }, [procedures, scope, toast, t]);

    const handleDelete = useCallback((proc: ProcedureRow) => {
        confirmDialog({
            message: tplMessage(t.procedureeditor_delete_confirm, proc.name),
            header: t.procedureeditor_delete_title || 'Delete Procedure',
            icon: 'pi pi-exclamation-triangle',
            acceptClassName: 'p-button-danger',
            accept: async () => {
                try {
                    await apiClient.delete(`/procedures/${proc.id}`);
                    setProcedures((prev) => prev.filter((p) => p.id !== proc.id));
                    setSelectedId(null);
                } catch (err) {
                    console.error(err);
                    toast.showError(t.procedureeditor_save_error || 'Failed to save procedure');
                }
            },
        });
    }, [t, toast]);

    const handleSave = useCallback(async () => {
        if (!draft) return;
        setSaving(true);
        try {
            const res = await apiClient.put(`/procedures/${draft.id}`, {
                name: draft.name,
                params: draft.params,
                return_type: draft.return_type,
                is_private: draft.is_private,
                code: draft.code,
            });
            setProcedures((prev) => prev.map((p) => (p.id === draft.id ? res.data : p)));
            toast.showSuccess(t.procedureeditor_saved || 'Procedure saved');
        } catch (err) {
            console.error(err);
            toast.showError(t.procedureeditor_save_error || 'Failed to save procedure');
        } finally {
            setSaving(false);
        }
    }, [draft, toast, t]);

    return (
        <Dialog
            header={title || t.procedureeditor_title || 'Procedures'}
            visible={visible}
            onHide={onHide}
            style={{ width: '900px' }}
            contentStyle={{ backgroundColor: colors.bgPrimary, color: colors.textPrimary }}
            headerStyle={{ backgroundColor: colors.dialogHeader, color: colors.textPrimary }}
            modal
            closable
            draggable
            resizable
            maximizable
        >
            {loading ? (
                <div className="flex items-center justify-center p-8" style={{ color: colors.textMuted }}>
                    <i className="pi pi-spin pi-spinner mr-2" />
                    {t.procedureeditor_loading || 'Loading...'}
                </div>
            ) : (
                <div className="flex gap-3" style={{ minHeight: 480 }}>
                    <div style={{ width: 220, flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
                        <div className="border rounded overflow-y-auto flex-1" style={{ borderColor: colors.borderPrimary, maxHeight: 500 }}>
                            {procedures.length === 0 && (
                                <div className="p-3 text-xs" style={{ color: colors.textMuted }}>
                                    {t.procedureeditor_empty || 'No procedures yet'}
                                </div>
                            )}
                            {procedures.map((p) => (
                                <div
                                    key={p.id}
                                    onClick={() => setSelectedId(p.id)}
                                    className="px-3 py-2 cursor-pointer text-sm border-b truncate flex items-center gap-1"
                                    style={{
                                        backgroundColor: p.id === selectedId ? 'rgba(59,130,246,0.25)' : 'transparent',
                                        borderColor: colors.borderPrimary,
                                    }}
                                >
                                    {p.is_private && <i className="pi pi-lock" style={{ fontSize: '0.65rem', color: colors.textMuted }} />}
                                    <span className="truncate">{p.name}</span>
                                </div>
                            ))}
                        </div>
                        <Button
                            label={t.procedureeditor_add || 'Add Procedure'}
                            icon="pi pi-plus"
                            className="p-button-text p-button-sm mt-2"
                            onClick={handleAdd}
                        />
                    </div>

                    <div className="flex-1 flex flex-col" style={{ maxHeight: 520 }}>
                        {!draft ? (
                            <div className="text-sm" style={{ color: colors.textMuted }}>
                                {t.procedureeditor_select_hint || 'Add or select a procedure to edit it.'}
                            </div>
                        ) : (
                            <>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs font-semibold">{draft.name}</span>
                                    <Button
                                        icon="pi pi-trash"
                                        className="p-button-text p-button-danger p-button-sm"
                                        onClick={() => handleDelete(draft)}
                                        tooltip={t.procedureeditor_delete_title || 'Delete Procedure'}
                                        tooltipOptions={{ position: 'bottom' }}
                                    />
                                </div>

                                <div className="grid grid-cols-3 gap-2 mb-2">
                                    <div>
                                        <label className="block text-xs font-medium mb-1">{t.procedureeditor_name || 'Name'}</label>
                                        <InputText className="w-full p-inputtext-sm" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium mb-1">{t.procedureeditor_return_type || 'Return Type'}</label>
                                        <InputText className="w-full p-inputtext-sm" value={draft.return_type || ''} onChange={(e) => setDraft({ ...draft, return_type: e.target.value || null })} placeholder="void" />
                                    </div>
                                    <div className="flex items-end pb-1">
                                        <div className="flex items-center gap-2">
                                            <Checkbox inputId="proc_private" checked={draft.is_private} onChange={(e) => setDraft({ ...draft, is_private: !!e.checked })} />
                                            <label htmlFor="proc_private" className="text-xs cursor-pointer">{t.procedureeditor_private || 'Private'}</label>
                                        </div>
                                    </div>
                                </div>
                                <div className="mb-2">
                                    <label className="block text-xs font-medium mb-1">{t.procedureeditor_params || 'Parameters'}</label>
                                    <InputText
                                        className="w-full p-inputtext-sm"
                                        value={draft.params || ''}
                                        onChange={(e) => setDraft({ ...draft, params: e.target.value || null })}
                                        placeholder="sName: string, nCount: int = 0"
                                    />
                                </div>

                                <div className="flex-1 overflow-hidden">
                                    <MultiLanguageCodeEditor
                                        value={draft.code}
                                        onChange={(v) => setDraft({ ...draft, code: v })}
                                        fileName={`${draft.name}.sml`}
                                    />
                                </div>

                                <div className="flex justify-end mt-3">
                                    <Button
                                        label={t.procedureeditor_save || 'Save'}
                                        severity="success"
                                        icon={saving ? 'pi pi-spin pi-spinner' : 'pi pi-check'}
                                        disabled={saving || !draft.name.trim()}
                                        onClick={handleSave}
                                    />
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </Dialog>
    );
};

function tplMessage(template: string | undefined, name: string): string {
    return (template || 'Delete procedure "{name}" and its code?').replace('{name}', name);
}

export default ProcedureEditorModal;
