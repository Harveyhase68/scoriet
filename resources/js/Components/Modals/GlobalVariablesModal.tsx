// resources/js/Components/Modals/GlobalVariablesModal.tsx - "Project
// Declarations": everything a WinDev project declares independently of any
// one window - Global Variables, Structures, Constants and the project's
// own startup code (`on project init`). Grouped in one modal (tabs) rather
// than four separate toolbar buttons, since they're all edited together in
// WinDev's own project properties too.
import React, { useState, useEffect, useCallback } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { TabView, TabPanel } from 'primereact/tabview';
import { confirmDialog } from 'primereact/confirmdialog';
import { useToast } from '@/contexts/ToastContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation, SupportedLanguage, getStoredLanguage } from '@/i18n';
import { apiClient } from '@/lib/api';
import { MultiLanguageCodeEditor } from '../Panels/FileModal';

interface GlobalVariableRow {
    id: number;
    name: string;
    type: string;
    default_value: string | null;
}

interface ConstantRow {
    id: number;
    name: string;
    value: string | null;
}

interface StructField {
    name: string;
    type: string;
    default: string | null;
}

interface StructRow {
    id: number;
    name: string;
    fields: StructField[];
}

interface GlobalVariablesModalProps {
    visible: boolean;
    onHide: () => void;
    projectId: number;
}

// ===== Global Variables tab (flat list, autosave per field) =====
const GlobalVariablesTab: React.FC<{ projectId: number }> = ({ projectId }) => {
    const [currentLanguage] = useState<SupportedLanguage>(getStoredLanguage());
    const { t } = useTranslation(currentLanguage);
    const toast = useToast();
    const [loading, setLoading] = useState(false);
    const [rows, setRows] = useState<GlobalVariableRow[]>([]);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await apiClient.get(`/project-globals?project_id=${projectId}`);
            setRows(res.data || []);
        } catch (err) {
            console.error(err);
            toast.showError(t.globalvariables_load_error || 'Failed to load global variables');
        } finally {
            setLoading(false);
        }
    }, [projectId, toast, t]);

    useEffect(() => { load(); }, [load]);

    const handleAdd = useCallback(async () => {
        const existingNames = new Set(rows.map((r) => r.name));
        let n = rows.length + 1;
        while (existingNames.has(`gNewVar${n}`)) n++;
        try {
            const res = await apiClient.post('/project-globals', { project_id: projectId, name: `gNewVar${n}`, type: 'string' });
            setRows((prev) => [...prev, res.data]);
        } catch (err) {
            console.error(err);
            toast.showError(t.globalvariables_save_error || 'Failed to save global variable');
        }
    }, [rows, projectId, toast, t]);

    const updateRow = useCallback(async (row: GlobalVariableRow, patch: Partial<GlobalVariableRow>) => {
        setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, ...patch } : r)));
        try {
            const res = await apiClient.put(`/project-globals/${row.id}`, patch);
            setRows((prev) => prev.map((r) => (r.id === row.id ? res.data : r)));
        } catch (err) {
            console.error(err);
            toast.showError(t.globalvariables_save_error || 'Failed to save global variable');
            load();
        }
    }, [toast, t, load]);

    const handleDelete = useCallback((row: GlobalVariableRow) => {
        confirmDialog({
            message: (t.globalvariables_delete_confirm || 'Delete global variable "{name}"?').replace('{name}', row.name),
            header: t.globalvariables_delete_title || 'Delete Global Variable',
            icon: 'pi pi-exclamation-triangle',
            acceptClassName: 'p-button-danger',
            accept: async () => {
                try {
                    await apiClient.delete(`/project-globals/${row.id}`);
                    setRows((prev) => prev.filter((r) => r.id !== row.id));
                } catch (err) {
                    console.error(err);
                    toast.showError(t.globalvariables_save_error || 'Failed to save global variable');
                }
            },
        });
    }, [t, toast]);

    if (loading) return <TabLoading label={t.globalvariables_loading || 'Loading...'} />;

    return (
        <>
            <DataTable value={rows} className="p-datatable-sm" showGridlines size="small" style={{ maxHeight: 420, overflowY: 'auto' }}>
                <Column header={t.procedureeditor_name || 'Name'} body={(row: GlobalVariableRow) => (
                    <InputText className="w-full p-inputtext-sm" value={row.name} onChange={(e) => updateRow(row, { name: e.target.value })} />
                )} />
                <Column header={t.globalvariables_type || 'Type'} style={{ width: '25%' }} body={(row: GlobalVariableRow) => (
                    <InputText className="w-full p-inputtext-sm" value={row.type} onChange={(e) => updateRow(row, { type: e.target.value })} placeholder="string" />
                )} />
                <Column header={t.globalvariables_default || 'Default Value'} body={(row: GlobalVariableRow) => (
                    <InputText className="w-full p-inputtext-sm" value={row.default_value || ''} onChange={(e) => updateRow(row, { default_value: e.target.value || null })} />
                )} />
                <Column style={{ width: 48 }} body={(row: GlobalVariableRow) => (
                    <Button icon="pi pi-trash" className="p-button-text p-button-danger p-button-sm" onClick={() => handleDelete(row)} />
                )} />
            </DataTable>
            <div className="mt-3">
                <Button label={t.globalvariables_add || 'Add Variable'} icon="pi pi-plus" className="p-button-text p-button-sm" onClick={handleAdd} />
            </div>
        </>
    );
};

// ===== Constants tab (flat list, autosave per field) =====
const ConstantsTab: React.FC<{ projectId: number }> = ({ projectId }) => {
    const [currentLanguage] = useState<SupportedLanguage>(getStoredLanguage());
    const { t } = useTranslation(currentLanguage);
    const toast = useToast();
    const [loading, setLoading] = useState(false);
    const [rows, setRows] = useState<ConstantRow[]>([]);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await apiClient.get(`/project-constants?project_id=${projectId}`);
            setRows(res.data || []);
        } catch (err) {
            console.error(err);
            toast.showError(t.constants_load_error || 'Failed to load constants');
        } finally {
            setLoading(false);
        }
    }, [projectId, toast, t]);

    useEffect(() => { load(); }, [load]);

    const handleAdd = useCallback(async () => {
        const existingNames = new Set(rows.map((r) => r.name));
        let n = rows.length + 1;
        while (existingNames.has(`NEW_CONST${n}`)) n++;
        try {
            const res = await apiClient.post('/project-constants', { project_id: projectId, name: `NEW_CONST${n}` });
            setRows((prev) => [...prev, res.data]);
        } catch (err) {
            console.error(err);
            toast.showError(t.constants_save_error || 'Failed to save constant');
        }
    }, [rows, projectId, toast, t]);

    const updateRow = useCallback(async (row: ConstantRow, patch: Partial<ConstantRow>) => {
        setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, ...patch } : r)));
        try {
            const res = await apiClient.put(`/project-constants/${row.id}`, patch);
            setRows((prev) => prev.map((r) => (r.id === row.id ? res.data : r)));
        } catch (err) {
            console.error(err);
            toast.showError(t.constants_save_error || 'Failed to save constant');
            load();
        }
    }, [toast, t, load]);

    const handleDelete = useCallback((row: ConstantRow) => {
        confirmDialog({
            message: (t.constants_delete_confirm || 'Delete constant "{name}"?').replace('{name}', row.name),
            header: t.constants_delete_title || 'Delete Constant',
            icon: 'pi pi-exclamation-triangle',
            acceptClassName: 'p-button-danger',
            accept: async () => {
                try {
                    await apiClient.delete(`/project-constants/${row.id}`);
                    setRows((prev) => prev.filter((r) => r.id !== row.id));
                } catch (err) {
                    console.error(err);
                    toast.showError(t.constants_save_error || 'Failed to save constant');
                }
            },
        });
    }, [t, toast]);

    if (loading) return <TabLoading label={t.constants_loading || 'Loading...'} />;

    return (
        <>
            <DataTable value={rows} className="p-datatable-sm" showGridlines size="small" style={{ maxHeight: 420, overflowY: 'auto' }}>
                <Column header={t.procedureeditor_name || 'Name'} body={(row: ConstantRow) => (
                    <InputText className="w-full p-inputtext-sm" value={row.name} onChange={(e) => updateRow(row, { name: e.target.value })} />
                )} />
                <Column header={t.constants_value || 'Value'} body={(row: ConstantRow) => (
                    <InputText className="w-full p-inputtext-sm" value={row.value || ''} onChange={(e) => updateRow(row, { value: e.target.value || null })} />
                )} />
                <Column style={{ width: 48 }} body={(row: ConstantRow) => (
                    <Button icon="pi pi-trash" className="p-button-text p-button-danger p-button-sm" onClick={() => handleDelete(row)} />
                )} />
            </DataTable>
            <div className="mt-3">
                <Button label={t.constants_add || 'Add Constant'} icon="pi pi-plus" className="p-button-text p-button-sm" onClick={handleAdd} />
            </div>
        </>
    );
};

// ===== Structures tab (list + detail, explicit Save per struct like ProcedureEditorModal) =====
const StructsTab: React.FC<{ projectId: number }> = ({ projectId }) => {
    const [currentLanguage] = useState<SupportedLanguage>(getStoredLanguage());
    const { t } = useTranslation(currentLanguage);
    const { colors } = useTheme();
    const toast = useToast();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [structs, setStructs] = useState<StructRow[]>([]);
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [draft, setDraft] = useState<StructRow | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await apiClient.get(`/project-structs?project_id=${projectId}`);
            const rows: StructRow[] = res.data || [];
            setStructs(rows);
            setSelectedId(rows.length > 0 ? rows[0].id : null);
        } catch (err) {
            console.error(err);
            toast.showError(t.structs_load_error || 'Failed to load structures');
        } finally {
            setLoading(false);
        }
    }, [projectId, toast, t]);

    useEffect(() => { load(); }, [load]);

    useEffect(() => {
        const found = structs.find((s) => s.id === selectedId) || null;
        setDraft(found ? { ...found, fields: found.fields.map((f) => ({ ...f })) } : null);
    }, [selectedId, structs]);

    const handleAdd = useCallback(async () => {
        const existingNames = new Set(structs.map((s) => s.name));
        let n = structs.length + 1;
        while (existingNames.has(`stNewStruct${n}`)) n++;
        try {
            const res = await apiClient.post('/project-structs', { project_id: projectId, name: `stNewStruct${n}`, fields: [] });
            setStructs((prev) => [...prev, res.data]);
            setSelectedId(res.data.id);
        } catch (err) {
            console.error(err);
            toast.showError(t.structs_save_error || 'Failed to save structure');
        }
    }, [structs, projectId, toast, t]);

    const handleDelete = useCallback((row: StructRow) => {
        confirmDialog({
            message: (t.structs_delete_confirm || 'Delete structure "{name}"?').replace('{name}', row.name),
            header: t.structs_delete_title || 'Delete Structure',
            icon: 'pi pi-exclamation-triangle',
            acceptClassName: 'p-button-danger',
            accept: async () => {
                try {
                    await apiClient.delete(`/project-structs/${row.id}`);
                    setStructs((prev) => prev.filter((s) => s.id !== row.id));
                    setSelectedId(null);
                } catch (err) {
                    console.error(err);
                    toast.showError(t.structs_save_error || 'Failed to save structure');
                }
            },
        });
    }, [t, toast]);

    const handleSave = useCallback(async () => {
        if (!draft) return;
        setSaving(true);
        try {
            const res = await apiClient.put(`/project-structs/${draft.id}`, { name: draft.name, fields: draft.fields });
            setStructs((prev) => prev.map((s) => (s.id === draft.id ? res.data : s)));
            toast.showSuccess(t.structs_saved || 'Structure saved');
        } catch (err) {
            console.error(err);
            toast.showError(t.structs_save_error || 'Failed to save structure');
        } finally {
            setSaving(false);
        }
    }, [draft, toast, t]);

    const updateField = (idx: number, patch: Partial<StructField>) => {
        if (!draft) return;
        setDraft({ ...draft, fields: draft.fields.map((f, i) => (i === idx ? { ...f, ...patch } : f)) });
    };
    const addField = () => {
        if (!draft) return;
        setDraft({ ...draft, fields: [...draft.fields, { name: `field${draft.fields.length + 1}`, type: 'string', default: null }] });
    };
    const removeField = (idx: number) => {
        if (!draft) return;
        setDraft({ ...draft, fields: draft.fields.filter((_, i) => i !== idx) });
    };

    if (loading) return <TabLoading label={t.structs_loading || 'Loading...'} />;

    return (
        <div className="flex gap-3" style={{ minHeight: 400 }}>
            <div style={{ width: 200, flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
                <div className="border rounded overflow-y-auto flex-1" style={{ borderColor: colors.borderPrimary, maxHeight: 400 }}>
                    {structs.length === 0 && (
                        <div className="p-3 text-xs" style={{ color: colors.textMuted }}>{t.structs_empty || 'No structures yet'}</div>
                    )}
                    {structs.map((s) => (
                        <div
                            key={s.id}
                            onClick={() => setSelectedId(s.id)}
                            className="px-3 py-2 cursor-pointer text-sm border-b truncate"
                            style={{ backgroundColor: s.id === selectedId ? 'rgba(59,130,246,0.25)' : 'transparent', borderColor: colors.borderPrimary }}
                        >
                            {s.name}
                        </div>
                    ))}
                </div>
                <Button label={t.structs_add || 'Add Structure'} icon="pi pi-plus" className="p-button-text p-button-sm mt-2" onClick={handleAdd} />
            </div>

            <div className="flex-1 overflow-y-auto" style={{ maxHeight: 440 }}>
                {!draft ? (
                    <div className="text-sm" style={{ color: colors.textMuted }}>{t.structs_select_hint || 'Add or select a structure to edit it.'}</div>
                ) : (
                    <>
                        <div className="flex justify-between items-center mb-2">
                            <InputText className="p-inputtext-sm" style={{ width: 240 }} value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
                            <Button icon="pi pi-trash" className="p-button-text p-button-danger p-button-sm" onClick={() => handleDelete(draft)} />
                        </div>

                        {draft.fields.map((f, idx) => (
                            <div key={idx} className="flex gap-2 mb-2 items-center">
                                <InputText className="flex-1 p-inputtext-sm" value={f.name} onChange={(e) => updateField(idx, { name: e.target.value })} placeholder={t.procedureeditor_name || 'Name'} />
                                <InputText className="flex-1 p-inputtext-sm" value={f.type} onChange={(e) => updateField(idx, { type: e.target.value })} placeholder="string" />
                                <InputText className="flex-1 p-inputtext-sm" value={f.default || ''} onChange={(e) => updateField(idx, { default: e.target.value || null })} placeholder={t.globalvariables_default || 'Default Value'} />
                                <Button icon="pi pi-times" className="p-button-text p-button-danger p-button-sm" style={{ width: 28, height: 28 }} onClick={() => removeField(idx)} />
                            </div>
                        ))}
                        <Button label={t.structs_add_field || 'Add Field'} icon="pi pi-plus" className="p-button-text p-button-sm" onClick={addField} />

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
    );
};

// ===== Project Init Code tab (single fixed event, reuses the SML editor) =====
const InitCodeTab: React.FC<{ projectId: number }> = ({ projectId }) => {
    const [currentLanguage] = useState<SupportedLanguage>(getStoredLanguage());
    const { t } = useTranslation(currentLanguage);
    const toast = useToast();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [code, setCode] = useState('');

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await apiClient.get(`/project-events?project_id=${projectId}`);
            const rows: Array<{ event_name: string; code: string | null }> = res.data || [];
            setCode(rows.find((r) => r.event_name === 'init')?.code || '');
        } catch (err) {
            console.error(err);
            toast.showError(t.projectinit_load_error || 'Failed to load the project init code');
        } finally {
            setLoading(false);
        }
    }, [projectId, toast, t]);

    useEffect(() => { load(); }, [load]);

    const handleSave = useCallback(async () => {
        setSaving(true);
        try {
            await apiClient.put('/project-events', { project_id: projectId, event_name: 'init', code });
            toast.showSuccess(t.projectinit_saved || 'Project init code saved');
        } catch (err) {
            console.error(err);
            toast.showError(t.projectinit_save_error || 'Failed to save the project init code');
        } finally {
            setSaving(false);
        }
    }, [projectId, code, toast, t]);

    // Ctrl+S/Cmd+S saves, same as the Save button - PrimeReact's TabView
    // only mounts the ACTIVE tab's content by default (renderActiveOnly),
    // so this listener naturally only exists while the Init Code tab
    // itself is the one showing, with no separate "am I active" prop
    // needed - see WindowCodeEditorModal's identical shortcut.
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
                event.preventDefault();
                handleSave();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [handleSave]);

    if (loading) return <TabLoading label={t.projectinit_loading || 'Loading...'} />;

    return (
        <>
            <MultiLanguageCodeEditor value={code} onChange={setCode} fileName="project_init.sml" />
            <div className="flex justify-end mt-3">
                <Button
                    label={t.procedureeditor_save || 'Save'}
                    severity="success"
                    icon={saving ? 'pi pi-spin pi-spinner' : 'pi pi-check'}
                    disabled={saving}
                    onClick={handleSave}
                />
            </div>
        </>
    );
};

const TabLoading: React.FC<{ label: string }> = ({ label }) => {
    const { colors } = useTheme();
    return (
        <div className="flex items-center justify-center p-8" style={{ color: colors.textMuted }}>
            <i className="pi pi-spin pi-spinner mr-2" />
            {label}
        </div>
    );
};

const GlobalVariablesModal: React.FC<GlobalVariablesModalProps> = ({ visible, onHide, projectId }) => {
    const [currentLanguage] = useState<SupportedLanguage>(getStoredLanguage());
    const { t } = useTranslation(currentLanguage);
    const { colors } = useTheme();

    return (
        <Dialog
            header={t.projectdeclarations_title || 'Project Declarations'}
            visible={visible}
            onHide={onHide}
            style={{ width: '820px' }}
            contentStyle={{ backgroundColor: colors.bgPrimary, color: colors.textPrimary }}
            headerStyle={{ backgroundColor: colors.dialogHeader, color: colors.textPrimary }}
            modal
            closable
            draggable
            resizable
            maximizable
        >
            {visible && (
                <TabView>
                    <TabPanel header={t.globalvariables_title || 'Global Variables'} leftIcon="pi pi-database mr-2">
                        <GlobalVariablesTab projectId={projectId} />
                    </TabPanel>
                    <TabPanel header={t.structs_title || 'Structures'} leftIcon="pi pi-sitemap mr-2">
                        <StructsTab projectId={projectId} />
                    </TabPanel>
                    <TabPanel header={t.constants_title || 'Constants'} leftIcon="pi pi-lock mr-2">
                        <ConstantsTab projectId={projectId} />
                    </TabPanel>
                    <TabPanel header={t.projectinit_title || 'Init Code'} leftIcon="pi pi-code mr-2">
                        <InitCodeTab projectId={projectId} />
                    </TabPanel>
                </TabView>
            )}

            <div className="flex justify-end mt-4">
                <Button label={t.applicationsmodal432 || 'Close'} onClick={onHide} />
            </div>
        </Dialog>
    );
};

export default GlobalVariablesModal;
