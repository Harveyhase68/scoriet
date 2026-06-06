import React, { useState, useEffect, useRef } from 'react';
import { Dialog } from 'primereact/dialog';
import { DataTable } from 'primereact/datatable';
import { useToast } from '@/contexts/ToastContext';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dropdown } from 'primereact/dropdown';
import { MultiSelect } from 'primereact/multiselect';
import { Card } from 'primereact/card';
import { confirmDialog, ConfirmDialog } from 'primereact/confirmdialog';
import { useProject } from '@/contexts/ProjectContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation, SupportedLanguage, getStoredLanguage } from '@/i18n';
import { apiClient } from '@/lib/api';

interface ReportPattern {
    id: number;
    name: string;
    description?: string;
    creator_user_id: number;
    visibility: 'public' | 'private' | 'team' | 'system';
    is_active: boolean;
    forms_count?: number;
    created_at: string;
    updated_at?: string;
    creator?: { id: number; name: string };
}

interface ReportManagementPanelProps {
    onOpenPanel?: (panelType: string, data?: Record<string, unknown>) => void;
}

// A Report Pattern name becomes part of generated file paths / template keys,
// so it must be a machine-safe identifier: lowercase letters, digits and
// underscore only. We sanitise AS THE USER TYPES (auto-lowercasing instead of
// rejecting, so uppercase input isn't silently lost) — no regex, an explicit
// char-class scan. Mirrors sanitizeBlueprintName in FormSetManagementPanel.
const sanitizeReportName = (raw: string): string => {
    let out = '';
    for (const ch of raw.toLowerCase()) {
        const isLower = ch >= 'a' && ch <= 'z';
        const isDigit = ch >= '0' && ch <= '9';
        if (isLower || isDigit || ch === '_') {
            out += ch;
        }
    }
    return out;
};

const ReportManagementPanel: React.FC<ReportManagementPanelProps> = ({ onOpenPanel }) => {
    const { selectedProject } = useProject();
    const toast = useToast();
    const { colors } = useTheme();
    const [currentLanguage] = React.useState<SupportedLanguage>(getStoredLanguage());
    const { t } = useTranslation(currentLanguage);
    const currentUserId = parseInt(localStorage.getItem('user_id') || '0');

    // State
    const [myPatterns, setMyPatterns] = useState<ReportPattern[]>([]);
    const [publicPatterns, setPublicPatterns] = useState<ReportPattern[]>([]);
    const [myLoading, setMyLoading] = useState(false);
    const [publicLoading, setPublicLoading] = useState(false);
    const [mySearchTerm, setMySearchTerm] = useState('');
    const [myVisibilityFilter, setMyVisibilityFilter] = useState('all');
    const [publicSearchTerm, setPublicSearchTerm] = useState('');

    // Create modal
    const [createModalVisible, setCreateModalVisible] = useState(false);
    const [newName, setNewName] = useState('');
    const [newDescription, setNewDescription] = useState('');
    const [newVisibility, setNewVisibility] = useState<string>('private');
    const [creating, setCreating] = useState(false);

    // Edit modal
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [editPattern, setEditPattern] = useState<ReportPattern | null>(null);
    const [editName, setEditName] = useState('');
    const [editDescription, setEditDescription] = useState('');
    const [editVisibility, setEditVisibility] = useState<string>('private');
    const [editing, setEditing] = useState(false);

    // Delete modal
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [patternToDelete, setPatternToDelete] = useState<ReportPattern | null>(null);
    const [deleteConfirmText, setDeleteConfirmText] = useState('');
    const [deleting, setDeleting] = useState(false);

    // Link-to-projects modal (mirrors FormSetManagementPanel). Lets the user
    // attach/detach this Report Pattern as a project's default DIRECTLY here, so
    // they can unlink and then delete without a detour through Project Settings.
    const [linkModalVisible, setLinkModalVisible] = useState(false);
    const [patternToLink, setPatternToLink] = useState<ReportPattern | null>(null);
    const [allProjects, setAllProjects] = useState<any[]>([]);
    const [linkedProjectIds, setLinkedProjectIds] = useState<number[]>([]);
    // Snapshot taken when the modal opens — diffed on save (added → activate,
    // removed → deactivate) and used to enable the button only on a real change
    // (incl. removing the last link).
    const [originalLinkedIds, setOriginalLinkedIds] = useState<number[]>([]);
    const [loadingProjects, setLoadingProjects] = useState(false);
    const [savingLink, setSavingLink] = useState(false);

    useEffect(() => {
        loadMyPatterns();
        loadPublicPatterns();
    }, []);

    useEffect(() => { loadMyPatterns(); }, [mySearchTerm, myVisibilityFilter]);
    useEffect(() => { loadPublicPatterns(); }, [publicSearchTerm]);

    const loadMyPatterns = async () => {
        setMyLoading(true);
        try {
            const data = await apiClient.get('/report-patterns?own_only=true');
            let filtered = data.data || [];
            if (myVisibilityFilter !== 'all') {
                filtered = filtered.filter((p: ReportPattern) => p.visibility === myVisibilityFilter);
            }
            if (mySearchTerm) {
                const search = mySearchTerm.toLowerCase();
                filtered = filtered.filter((p: ReportPattern) =>
                    p.name?.toLowerCase().includes(search) || p.description?.toLowerCase().includes(search)
                );
            }
            setMyPatterns(filtered);
        } catch (error) {
            console.error('Error loading patterns:', error);
            setMyPatterns([]);
        } finally {
            setMyLoading(false);
        }
    };

    const loadPublicPatterns = async () => {
        setPublicLoading(true);
        try {
            const data = await apiClient.get('/report-patterns');
            let filtered = (data.data || []).filter((p: ReportPattern) =>
                (p.visibility === 'public' || p.visibility === 'system') && Number(p.creator_user_id) !== Number(currentUserId)
            );
            if (publicSearchTerm) {
                const search = publicSearchTerm.toLowerCase();
                filtered = filtered.filter((p: ReportPattern) =>
                    p.name?.toLowerCase().includes(search) || p.description?.toLowerCase().includes(search)
                );
            }
            setPublicPatterns(filtered);
        } catch (error) {
            console.error('Error loading public patterns:', error);
            setPublicPatterns([]);
        } finally {
            setPublicLoading(false);
        }
    };

    // ── Link-to-projects ────────────────────────────────────────────────────
    const loadProjects = async () => {
        setLoadingProjects(true);
        try {
            const data = await apiClient.get('/projects');
            const projects = Array.isArray(data)
                ? data
                : (Array.isArray(data.projects) ? data.projects : (Array.isArray(data.data) ? data.data : []));
            setAllProjects(projects);
        } catch (error) {
            console.error('Error loading projects:', error);
            setAllProjects([]);
        } finally {
            setLoadingProjects(false);
        }
    };

    const loadLinkedProjects = async (patternId: number): Promise<number[]> => {
        try {
            const data = await apiClient.get(`/report-patterns/${patternId}/linked-projects`);
            return data.data || [];
        } catch (error) {
            console.error('Error loading linked projects:', error);
        }
        return [];
    };

    const handleOpenLinkModal = async (pattern: ReportPattern) => {
        setPatternToLink(pattern);
        setLinkedProjectIds([]);
        setOriginalLinkedIds([]);
        setLinkModalVisible(true);

        const [, linkedIds] = await Promise.all([
            loadProjects(),
            loadLinkedProjects(pattern.id),
        ]);
        setLinkedProjectIds(linkedIds);
        setOriginalLinkedIds(linkedIds);
    };

    const handleSaveLinks = async () => {
        if (!patternToLink) return;
        setSavingLink(true);
        try {
            // Diff against the snapshot: added → activate this pattern as the
            // project default; removed → deactivate (unlink). The removal pass is
            // what lets de-selecting a project here actually free the pattern for
            // deletion — same fix as the Form panel.
            const toAdd = linkedProjectIds.filter(id => !originalLinkedIds.includes(id));
            const toRemove = originalLinkedIds.filter(id => !linkedProjectIds.includes(id));

            for (const projectId of toAdd) {
                await apiClient.post(`/projects/${projectId}/report-pattern`, { report_pattern_id: patternToLink.id });
            }
            for (const projectId of toRemove) {
                await apiClient.delete(`/projects/${projectId}/report-pattern`);
            }

            toast.showSuccess(t.reportmanagementpanel_linked || 'Project links updated');
            setLinkModalVisible(false);
            loadMyPatterns();
            loadPublicPatterns();
        } catch (error) {
            console.error('Error saving links:', error);
            toast.showError(t.reportmanagementpanel_link_failed || 'Error updating project links');
        } finally {
            setSavingLink(false);
        }
    };

    const handleCreate = async () => {
        if (!newName.trim()) return;
        setCreating(true);
        try {
            let created: any;
            try {
                created = await apiClient.post('/report-patterns', {
                    name: newName,
                    description: newDescription || null,
                    visibility: newVisibility,
                });
            } catch (err: any) {
                const data = err?.response?.data || {};
                // Field-level validation error first (esp. duplicate name);
                // falls back to generic error message.
                const fieldError = data?.errors?.name?.[0];
                toast.showError(fieldError || data.error || data.message || 'Error creating pattern');
                return;
            }

            toast.showSuccess(t.reportmanagementpanel_created || 'Report Pattern created');
            setCreateModalVisible(false);
            setNewName('');
            setNewDescription('');
            setNewVisibility('private');
            loadMyPatterns();

            // Offer to set the new pattern as project default — only if no
            // default exists yet, so we don't pester on every create.
            const newId = created?.data?.id as number | undefined;
            if (newId && selectedProject?.id) {
                const projectId = selectedProject.id;
                try {
                    const checkData = await apiClient.get(`/projects/${projectId}/report-pattern`);
                    if (!checkData?.data?.id) {
                        confirmDialog({
                            group: 'report-management',
                            header: t.reportpatterndefault_prompt_title,
                            message: t.reportpatterndefault_prompt_message,
                            icon: 'pi pi-question-circle',
                            acceptLabel: t.reportmanagementpanel_yes,
                            rejectLabel: t.reportmanagementpanel_no,
                            accept: async () => {
                                try {
                                    await apiClient.post(`/projects/${projectId}/report-pattern`, { report_pattern_id: newId });
                                } catch {
                                    // ignore — user can set default manually in project settings
                                }
                            },
                        });
                    }
                } catch {
                    // ignore — fallback path
                }
            }
        } catch (error) {
            console.error('Create error:', error);
            toast.showError('Error creating pattern');
        } finally {
            setCreating(false);
        }
    };

    // ── Export / Import (portable JSON blueprint) ──────────────────────────
    const importInputRef = useRef<HTMLInputElement>(null);

    const handleExport = async (pattern: ReportPattern) => {
        try {
            const envelope = await apiClient.get(`/report-patterns/${pattern.id}/export`);
            const blob = new Blob([JSON.stringify(envelope, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const safeName = (pattern.name || 'report_pattern').replace(/[^a-z0-9_-]+/gi, '_');
            const a = document.createElement('a');
            a.href = url;
            a.download = `reportpattern_${safeName}.json`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
        } catch (err: any) {
            toast.showError(err?.response?.data?.error || t.reportmanagementpanel_export_failed || 'Export failed');
        }
    };

    // Run the actual import (blueprint + optionally the per-table layouts).
    const doReportImport = async (envelope: any, applyLayouts: boolean) => {
        try {
            const res: any = await apiClient.post('/report-patterns/import', { ...envelope, apply_layouts: applyLayouts });
            const applied = res?.layout_stats?.applied || 0;
            let msg = t.reportmanagementpanel_import_success || 'Report Pattern imported';
            if (applied > 0) {
                msg += ` — ${applied} ${t.reportmanagementpanel_layouts_applied || 'layout placements applied'}`;
            }
            toast.showSuccess(msg);
            loadMyPatterns();
        } catch (err: any) {
            toast.showError(err?.response?.data?.error || err?.response?.data?.message || t.reportmanagementpanel_import_failed || 'Import failed');
        }
    };

    // Read a chosen .json file → (if it carries report layouts for tables we
    // have) propose importing those too → import as a new (private) pattern.
    const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (e.target) e.target.value = '';
        if (!file) return;

        let envelope: any;
        try {
            envelope = JSON.parse(await file.text());
        } catch {
            toast.showError(t.reportmanagementpanel_import_invalid || 'Invalid JSON file');
            return;
        }

        let matched: Array<{ table_name: string }> = [];
        try {
            const preview: any = await apiClient.post('/report-patterns/import/preview-layouts', envelope);
            matched = preview?.matched || [];
        } catch {
            // Preview is best-effort — fall through to a plain blueprint import.
        }

        if (matched.length > 0) {
            const names = matched.map(m => m.table_name).join(', ');
            confirmDialog({
                group: 'report-management',
                header: t.reportmanagementpanel_layouts_prompt_title || 'Import layouts too?',
                message: `${t.reportmanagementpanel_layouts_prompt || 'This file contains report layouts for tables you have:'} ${names}`,
                icon: 'pi pi-question-circle',
                acceptLabel: t.reportmanagementpanel_yes || 'Yes',
                rejectLabel: t.reportmanagementpanel_no || 'No',
                accept: () => doReportImport(envelope, true),
                reject: () => doReportImport(envelope, false),
            });
        } else {
            doReportImport(envelope, false);
        }
    };

    const handleClone = (pattern: ReportPattern) => {
        // Confirm before cloning (mirrors the Form panel) so a mis-click can't
        // spawn stray copies.
        confirmDialog({
            group: 'report-management',
            header: t.reportmanagementpanel_clone_title || 'Clone Report Pattern',
            message: `${t.reportmanagementpanel_clone_confirm || 'Create a copy of:'} "${pattern.name}"`,
            icon: 'pi pi-copy',
            acceptLabel: t.reportmanagementpanel_yes || 'Yes',
            rejectLabel: t.reportmanagementpanel_no || 'No',
            accept: async () => {
                try {
                    await apiClient.post(`/report-patterns/${pattern.id}/clone`, {});
                    toast.showSuccess(t.reportmanagementpanel_cloned || 'Report Pattern cloned');
                    loadMyPatterns();
                } catch (error) {
                    console.error('Clone error:', error);
                    toast.showError(t.reportmanagementpanel_clone_failed || 'Error cloning report pattern');
                }
            },
        });
    };

    const handleEdit = (pattern: ReportPattern) => {
        setEditPattern(pattern);
        setEditName(pattern.name);
        setEditDescription(pattern.description || '');
        setEditVisibility(pattern.visibility);
        setEditModalVisible(true);
    };

    const executeEdit = async () => {
        if (!editPattern || !editName.trim()) return;
        setEditing(true);
        try {
            try {
                await apiClient.put(`/report-patterns/${editPattern.id}`, {
                    name: editName,
                    description: editDescription || null,
                    visibility: editVisibility,
                });
                toast.showSuccess(t.reportmanagementpanel_updated || 'Report Pattern updated');
                setEditModalVisible(false);
                setEditPattern(null);
                loadMyPatterns();
                loadPublicPatterns();
            } catch (err: any) {
                const data = err?.response?.data || {};
                const fieldError = data?.errors?.name?.[0];
                toast.showError(fieldError || data.error || data.message || 'Error updating pattern');
            }
        } catch (error) {
            console.error('Edit error:', error);
            toast.showError('Error updating pattern');
        } finally {
            setEditing(false);
        }
    };

    // Pre-flight in-use modal state — when the report pattern is referenced
    // somewhere we refuse the delete BEFORE asking the user to type DELETE.
    const [inUseModalVisible, setInUseModalVisible] = useState(false);
    const [inUseInfo, setInUseInfo] = useState<{
        patternName: string;
        tables: Array<{ id: number; table_name: string; schema_id: number | null }>;
        projects: Array<{ id: number; name: string | null }>;
    } | null>(null);

    const handleDelete = async (pattern: ReportPattern) => {
        try {
            const data = await apiClient.get(`/report-patterns/${pattern.id}/usage`);
            if (data?.data?.in_use) {
                setInUseInfo({
                    patternName: pattern.name,
                    tables: data.data.tables || [],
                    projects: data.data.projects || [],
                });
                setInUseModalVisible(true);
                return;
            }
        } catch {
            // If usage check fails, fall through — the backend's destroy()
            // will still block in-use patterns with a 409.
        }
        setPatternToDelete(pattern);
        setDeleteConfirmText('');
        setDeleteModalVisible(true);
    };

    const executeDelete = async () => {
        if (!patternToDelete || deleteConfirmText !== 'DELETE') return;
        setDeleting(true);
        try {
            try {
                await apiClient.delete(`/report-patterns/${patternToDelete.id}`);
                toast.showSuccess(t.reportmanagementpanel_deleted || 'Report Pattern deleted');
                setDeleteModalVisible(false);
                setPatternToDelete(null);
                loadMyPatterns();
            } catch (err: any) {
                // 409 = still in use (e.g. a link was added between the pre-check
                // and the confirmed delete). Show EXACTLY what blocks it via the
                // rich "in use by" dialog instead of a generic message.
                if (err?.response?.status === 409) {
                    const d = err.response?.data || {};
                    setInUseInfo({
                        patternName: patternToDelete.name,
                        tables: d.tables || [],
                        projects: d.projects || [],
                    });
                    setDeleteModalVisible(false);
                    setInUseModalVisible(true);
                } else {
                    toast.showError('Error deleting pattern');
                }
            }
        } catch (error) {
            console.error('Delete error:', error);
            toast.showError('Error deleting pattern');
        } finally {
            setDeleting(false);
        }
    };

    const handleOpenPatternDesigner = (pattern: ReportPattern) => {
        // Store pre-selection so the Pattern Designer picks up the correct pattern
        // even if the tab already exists or the patterns list isn't loaded yet.
        localStorage.setItem('report_pattern_preselect', JSON.stringify({
            patternId: pattern.id,
            timestamp: Date.now(),
        }));
        onOpenPanel?.('report-pattern-designer', {
            reportPatternId: pattern.id,
            title: `${t.reportmanagementpanel_pattern_designer || 'Report Pattern'}: ${pattern.name}`,
            forceNew: true,
        });
    };

    const handleOpenLayoutDesigner = (pattern: ReportPattern) => {
        // Store pre-selection. formType is intentionally omitted — the Layout
        // Designer will default to the first available form_type of the pattern.
        localStorage.setItem('report_layout_preselect', JSON.stringify({
            patternId: pattern.id,
            timestamp: Date.now(),
        }));
        onOpenPanel?.('report-layout-designer', {
            reportPatternId: pattern.id,
            title: `${t.reportmanagementpanel_layout_designer || 'Report Layout'}: ${pattern.name}`,
            forceNew: true,
        });
    };

    const visibilityBodyTemplate = (pattern: ReportPattern) => {
        const cls: Record<string, string> = { private: 'bg-gray-500', team: 'bg-blue-500', public: 'bg-green-500', system: 'bg-purple-500' };
        const labels: Record<string, string> = { private: t.reportmanagementpanel_private || 'Private', team: t.reportmanagementpanel_team || 'Team', public: t.reportmanagementpanel_public || 'Public', system: t.reportmanagementpanel_system || 'System' };
        return <span className={`px-2 py-1 ${cls[pattern.visibility] || 'bg-gray-500'} text-white rounded text-xs`}>{labels[pattern.visibility] || pattern.visibility}</span>;
    };

    const formsBodyTemplate = (pattern: ReportPattern) => (
        <span className="px-2 py-1 bg-purple-500 text-white rounded text-xs">{pattern.forms_count || 0} {t.reportmanagementpanel_forms || 'Forms'}</span>
    );

    const dateBodyTemplate = (pattern: ReportPattern) => new Date(pattern.created_at).toLocaleDateString(currentLanguage);

    const creatorBodyTemplate = (pattern: ReportPattern) => pattern.creator?.name || `User #${pattern.creator_user_id}`;

    return (
        <div className="report-management-panel p-4 h-full overflow-auto" style={{ backgroundColor: colors.bgPrimary, color: colors.textPrimary }}>

            {/* MY PATTERNS */}
            <Card title={t.reportmanagementpanel_my_patterns || 'My Report Patterns'} className="mb-4" style={{ backgroundColor: colors.bgSecondary, border: `1px solid ${colors.borderPrimary}` }}>
                <div className="flex justify-between items-center mb-4">
                    <div className="flex gap-2">
                        <Dropdown
                            value={myVisibilityFilter}
                            options={[
                                { label: t.reportmanagementpanel_all || 'All', value: 'all' },
                                { label: t.reportmanagementpanel_private || 'Private', value: 'private' },
                                { label: t.reportmanagementpanel_team || 'Team', value: 'team' },
                                { label: t.reportmanagementpanel_public || 'Public', value: 'public' },
                            ]}
                            onChange={(e) => setMyVisibilityFilter(e.value)}
                            className="w-40"
                            panelClassName="report-dropdown-panel"
                        />
                        <InputText
                            value={mySearchTerm}
                            onChange={(e) => setMySearchTerm(e.target.value)}
                            placeholder={t.reportmanagementpanel_search || 'Search...'}
                            className="w-64"
                        />
                    </div>
                    <input
                        ref={importInputRef}
                        type="file"
                        accept="application/json,.json"
                        style={{ display: 'none' }}
                        onChange={handleImportFile}
                    />
                    <Button
                        label={t.reportmanagementpanel_import || 'Import'}
                        icon="pi pi-upload"
                        className="p-button-secondary mr-2"
                        onClick={() => importInputRef.current?.click()}
                        tooltip={t.reportmanagementpanel_import_tooltip || 'Import a Report Pattern blueprint (.json)'}
                    />
                    <Button
                        label={t.reportmanagementpanel_create || 'New Report Pattern'}
                        icon="pi pi-plus"
                        className="p-button-success"
                        onClick={() => setCreateModalVisible(true)}
                    />
                </div>

                <DataTable
                    value={myPatterns}
                    loading={myLoading}
                    paginator rows={10} rowsPerPageOptions={[10, 25, 50]}
                    sortMode="multiple"
                    className="p-datatable-sm"
                    emptyMessage={t.reportmanagementpanel_no_patterns || 'No Report Patterns found'}
                >
                    <Column field="name" header={t.reportmanagementpanel_name || 'Name'} sortable />
                    <Column field="description" header={t.reportmanagementpanel_description || 'Description'} style={{ maxWidth: '300px' }} />
                    <Column header={t.reportmanagementpanel_visibility || 'Visibility'} body={visibilityBodyTemplate} />
                    <Column header={t.reportmanagementpanel_forms || 'Forms'} body={formsBodyTemplate} />
                    <Column header={t.reportmanagementpanel_created_at || 'Created'} body={dateBodyTemplate} sortable field="created_at" />
                    <Column
                        header={t.reportmanagementpanel_actions || 'Actions'}
                        body={(pattern: ReportPattern) => {
                            const isOwner = Number(pattern.creator_user_id) === Number(currentUserId);
                            return (
                                <div className="flex gap-1">
                                    {isOwner && (
                                        <Button icon="pi pi-pencil" className="p-button-text p-button-info p-button-sm" onClick={() => handleEdit(pattern)} tooltip={t.reportmanagementpanel_edit || 'Edit Properties'} />
                                    )}
                                    <Button icon="pi pi-link" className="p-button-text p-button-success p-button-sm" onClick={() => handleOpenLinkModal(pattern)} tooltip={t.reportmanagementpanel_link || 'Link to projects'} />
                                    <Button icon="pi pi-sliders-h" className="p-button-text p-button-secondary p-button-sm" onClick={() => handleOpenPatternDesigner(pattern)} tooltip={t.reportmanagementpanel_open_pattern || 'Open in Pattern Designer'} />
                                    <Button icon="pi pi-th-large" className="p-button-text p-button-success p-button-sm" onClick={() => handleOpenLayoutDesigner(pattern)} tooltip={t.reportmanagementpanel_open_layout || 'Open in Layout Designer'} />
                                    <Button icon="pi pi-download" className="p-button-text p-button-secondary p-button-sm" onClick={() => handleExport(pattern)} tooltip={t.reportmanagementpanel_export || 'Export blueprint (.json)'} />
                                    <Button icon="pi pi-copy" className="p-button-text p-button-warning p-button-sm" onClick={() => handleClone(pattern)} tooltip={t.reportmanagementpanel_clone || 'Clone'} />
                                    {isOwner && (
                                        <Button icon="pi pi-trash" className="p-button-text p-button-danger p-button-sm" onClick={() => handleDelete(pattern)} tooltip={t.reportmanagementpanel_delete || 'Delete'} />
                                    )}
                                </div>
                            );
                        }}
                    />
                </DataTable>
            </Card>

            {/* PUBLIC PATTERNS */}
            <Card title={t.reportmanagementpanel_public_patterns || 'Public & System Report Patterns'} className="mb-4" style={{ backgroundColor: colors.bgSecondary, border: `1px solid ${colors.borderPrimary}` }}>
                <div className="flex justify-between items-center mb-4">
                    <InputText
                        value={publicSearchTerm}
                        onChange={(e) => setPublicSearchTerm(e.target.value)}
                        placeholder={t.reportmanagementpanel_search || 'Search...'}
                        className="w-64"
                    />
                </div>

                <DataTable
                    value={publicPatterns}
                    loading={publicLoading}
                    paginator rows={10} rowsPerPageOptions={[10, 25, 50]}
                    sortMode="multiple"
                    className="p-datatable-sm"
                    emptyMessage={t.reportmanagementpanel_no_public || 'No public Report Patterns found'}
                >
                    <Column field="name" header={t.reportmanagementpanel_name || 'Name'} sortable />
                    <Column field="description" header={t.reportmanagementpanel_description || 'Description'} style={{ maxWidth: '300px' }} />
                    <Column header={t.reportmanagementpanel_creator || 'Creator'} body={creatorBodyTemplate} />
                    <Column header={t.reportmanagementpanel_forms || 'Forms'} body={formsBodyTemplate} />
                    <Column header={t.reportmanagementpanel_created_at || 'Created'} body={dateBodyTemplate} sortable field="created_at" />
                    <Column
                        header={t.reportmanagementpanel_actions || 'Actions'}
                        body={(pattern: ReportPattern) => (
                            <div className="flex gap-1">
                                <Button icon="pi pi-copy" className="p-button-text p-button-warning p-button-sm" onClick={() => handleClone(pattern)} tooltip={t.reportmanagementpanel_clone || 'Clone to My Patterns'} />
                            </div>
                        )}
                    />
                </DataTable>
            </Card>

            {/* CREATE MODAL */}
            <Dialog
                visible={createModalVisible}
                onHide={() => setCreateModalVisible(false)}
                header={t.reportmanagementpanel_create_title || 'New Report Pattern'}
                style={{ width: '450px' }}
                modal
                contentStyle={{ backgroundColor: colors.bgPrimary, color: colors.textPrimary }}
                headerStyle={{ backgroundColor: colors.dialogHeader, color: colors.textPrimary }}
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">{t.reportmanagementpanel_name || 'Name'}</label>
                        <InputText value={newName} onChange={(e) => setNewName(sanitizeReportName(e.target.value))} className="w-full" placeholder={t.reportmanagementpanel_name_placeholder || 'e.g. invoice_report'} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">{t.reportmanagementpanel_description || 'Description'}</label>
                        <InputTextarea value={newDescription} onChange={(e) => setNewDescription(e.target.value)} className="w-full" rows={3} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">{t.reportmanagementpanel_visibility || 'Visibility'}</label>
                        <Dropdown
                            value={newVisibility}
                            options={[
                                { label: t.reportmanagementpanel_private || 'Private', value: 'private' },
                                { label: t.reportmanagementpanel_team || 'Team', value: 'team' },
                                { label: t.reportmanagementpanel_public || 'Public', value: 'public' },
                            ]}
                            onChange={(e) => setNewVisibility(e.value)}
                            className="w-full"
                        />
                    </div>
                    <div className="flex justify-end gap-2 pt-4" style={{ borderTop: `1px solid ${colors.borderPrimary}` }}>
                        <Button label={t.reportmanagementpanel_cancel || 'Cancel'} className="p-button-secondary" onClick={() => setCreateModalVisible(false)} />
                        <Button label={t.reportmanagementpanel_create_btn || 'Create'} icon="pi pi-plus" className="p-button-success" onClick={handleCreate} loading={creating} disabled={!newName.trim()} />
                    </div>
                </div>
            </Dialog>

            {/* EDIT MODAL */}
            <Dialog
                visible={editModalVisible}
                onHide={() => { if (!editing) setEditModalVisible(false); }}
                header={t.reportmanagementpanel_edit_title || 'Edit Report Pattern'}
                style={{ width: '450px' }}
                modal closable={!editing}
                contentStyle={{ backgroundColor: colors.bgPrimary, color: colors.textPrimary }}
                headerStyle={{ backgroundColor: colors.dialogHeader, color: colors.textPrimary }}
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">{t.reportmanagementpanel_name || 'Name'}</label>
                        <InputText value={editName} onChange={(e) => setEditName(sanitizeReportName(e.target.value))} className="w-full" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">{t.reportmanagementpanel_description || 'Description'}</label>
                        <InputTextarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} className="w-full" rows={3} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">{t.reportmanagementpanel_visibility || 'Visibility'}</label>
                        <Dropdown
                            value={editVisibility}
                            options={[
                                { label: t.reportmanagementpanel_private || 'Private', value: 'private' },
                                { label: t.reportmanagementpanel_team || 'Team', value: 'team' },
                                { label: t.reportmanagementpanel_public || 'Public', value: 'public' },
                            ]}
                            onChange={(e) => setEditVisibility(e.value)}
                            className="w-full"
                            panelClassName="report-dropdown-panel"
                        />
                    </div>
                    <div className="flex justify-end gap-2 pt-4" style={{ borderTop: `1px solid ${colors.borderPrimary}` }}>
                        <Button label={t.reportmanagementpanel_cancel || 'Cancel'} className="p-button-secondary" onClick={() => setEditModalVisible(false)} disabled={editing} />
                        <Button label={editing ? (t.reportmanagementpanel_saving || 'Saving...') : (t.reportmanagementpanel_save || 'Save')} icon={editing ? 'pi pi-spinner pi-spin' : 'pi pi-check'} className="p-button-success" onClick={executeEdit} loading={editing} disabled={!editName.trim()} />
                    </div>
                </div>
            </Dialog>

            {/* IN-USE INFO MODAL (pre-flight, blocks delete when references exist) */}
            <Dialog
                visible={inUseModalVisible}
                onHide={() => { setInUseModalVisible(false); setInUseInfo(null); }}
                header={t.reportmanagementpanel_in_use_title}
                style={{ width: '520px' }}
                modal
                closable
                contentStyle={{ backgroundColor: colors.bgPrimary, color: colors.textPrimary }}
                headerStyle={{ backgroundColor: colors.dialogHeader, color: colors.textPrimary }}
            >
                <div className="space-y-4">
                    <div className="rounded p-4" style={{ backgroundColor: colors.warningBg, border: `1px solid ${colors.warningBorder}` }}>
                        <div className="flex items-start gap-3">
                            <i className="pi pi-exclamation-triangle text-2xl" style={{ color: colors.warningText }}></i>
                            <div>
                                <h4 className="font-semibold" style={{ color: colors.warningText }}>
                                    {t.reportmanagementpanel_in_use_heading}
                                </h4>
                                <p className="text-sm mt-1" style={{ color: colors.textSecondary }}>
                                    <strong style={{ color: colors.textPrimary }}>"{inUseInfo?.patternName}"</strong>
                                    {' '}
                                    {t.reportmanagementpanel_in_use_explain}
                                </p>
                            </div>
                        </div>
                    </div>

                    {inUseInfo && inUseInfo.tables.length > 0 && (
                        <div className="rounded p-3 text-sm" style={{ backgroundColor: colors.bgSecondary, border: `1px solid ${colors.borderPrimary}` }}>
                            <p className="mb-2 font-medium" style={{ color: colors.textSecondary }}>
                                <i className="pi pi-table mr-2"></i>
                                {t.reportmanagementpanel_in_use_tables}
                            </p>
                            <ul className="list-disc list-inside space-y-1" style={{ color: colors.textMuted }}>
                                {inUseInfo.tables.map(tbl => (
                                    <li key={tbl.id}>{tbl.table_name}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {inUseInfo && inUseInfo.projects.length > 0 && (
                        <div className="rounded p-3 text-sm" style={{ backgroundColor: colors.bgSecondary, border: `1px solid ${colors.borderPrimary}` }}>
                            <p className="mb-2 font-medium" style={{ color: colors.textSecondary }}>
                                <i className="pi pi-folder mr-2"></i>
                                {t.reportmanagementpanel_in_use_projects}
                            </p>
                            <ul className="list-disc list-inside space-y-1" style={{ color: colors.textMuted }}>
                                {inUseInfo.projects.map(p => (
                                    <li key={p.id}>{p.name || `#${p.id}`}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <div className="rounded p-3 text-xs" style={{ backgroundColor: colors.infoBg, border: `1px solid ${colors.infoBorder}`, color: colors.infoText }}>
                        <i className="pi pi-info-circle mr-2"></i>
                        {t.reportmanagementpanel_in_use_hint}
                    </div>

                    <div className="flex justify-end pt-4" style={{ borderTop: `1px solid ${colors.borderPrimary}` }}>
                        <Button
                            label={t.reportmanagementpanel_close}
                            icon="pi pi-times"
                            className="p-button-secondary"
                            onClick={() => { setInUseModalVisible(false); setInUseInfo(null); }}
                        />
                    </div>
                </div>
            </Dialog>

            {/* DELETE MODAL */}
            <Dialog
                visible={deleteModalVisible}
                onHide={() => { if (!deleting) { setDeleteModalVisible(false); setPatternToDelete(null); } }}
                header={t.reportmanagementpanel_delete_title || 'Delete Report Pattern'}
                style={{ width: '450px' }}
                modal closable={!deleting}
                contentStyle={{ backgroundColor: colors.bgPrimary, color: colors.textPrimary }}
                headerStyle={{ backgroundColor: colors.dialogHeader, color: colors.textPrimary }}
            >
                <div className="space-y-4">
                    <div className="rounded p-4" style={{ backgroundColor: colors.errorBg, border: `1px solid ${colors.errorBorder}` }}>
                        <div className="flex items-start gap-3">
                            <i className="pi pi-exclamation-triangle text-2xl" style={{ color: colors.errorText }}></i>
                            <div>
                                <h4 className="font-semibold" style={{ color: colors.errorText }}>{t.reportmanagementpanel_delete_warning || 'Warning'}</h4>
                                <p className="text-sm mt-1" style={{ color: colors.textSecondary }}>
                                    {t.reportmanagementpanel_delete_confirm || 'This will permanently delete'} <strong style={{ color: colors.textPrimary }}>"{patternToDelete?.name}"</strong> {t.reportmanagementpanel_delete_confirm2 || 'and all its forms, elements and layout elements.'}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
                            {t.reportmanagementpanel_type_delete || 'Type'} <strong style={{ color: colors.errorText }}>DELETE</strong> {t.reportmanagementpanel_type_delete2 || 'to confirm:'}
                        </label>
                        <InputText value={deleteConfirmText} onChange={(e) => setDeleteConfirmText(e.target.value)} placeholder="DELETE" className="w-full" disabled={deleting} />
                    </div>
                    <div className="flex justify-end gap-2 pt-4" style={{ borderTop: `1px solid ${colors.borderPrimary}` }}>
                        <Button label={t.reportmanagementpanel_cancel || 'Cancel'} icon="pi pi-times" className="p-button-secondary" onClick={() => { setDeleteModalVisible(false); setPatternToDelete(null); }} disabled={deleting} />
                        <Button label={deleting ? (t.reportmanagementpanel_deleting || 'Deleting...') : (t.reportmanagementpanel_delete_btn || 'Delete')} icon={deleting ? 'pi pi-spinner pi-spin' : 'pi pi-trash'} className="p-button-danger" onClick={executeDelete} disabled={deleting || deleteConfirmText !== 'DELETE'} />
                    </div>
                </div>
            </Dialog>

            {/* Theme styles */}
            <style>{`
                .report-management-panel .p-card .p-card-title { color: var(--theme-text-primary); }
                .report-management-panel .p-card .p-card-content { color: var(--theme-text-primary); }
                .report-management-panel .p-inputtext { background-color: var(--theme-bg-tertiary); border-color: var(--theme-border-primary); color: var(--theme-text-primary); }
                .report-management-panel .p-inputtext:hover { border-color: var(--theme-accent); }
                .report-management-panel .p-inputtext:focus { border-color: var(--theme-accent); box-shadow: 0 0 0 1px var(--theme-accent); }
                .report-management-panel .p-inputtext::placeholder { color: var(--theme-text-muted); }
                .report-management-panel .p-dropdown { background-color: var(--theme-bg-tertiary); border-color: var(--theme-border-primary); color: var(--theme-text-primary); }
                .report-management-panel .p-dropdown:hover { border-color: var(--theme-accent); }
                .report-management-panel .p-dropdown .p-dropdown-label { color: var(--theme-text-primary); }
                .report-management-panel .p-dropdown .p-dropdown-trigger { color: var(--theme-text-muted); }
                .report-dropdown-panel { background-color: var(--theme-bg-secondary) !important; border-color: var(--theme-border-primary) !important; }
                .report-dropdown-panel .p-dropdown-items { background-color: var(--theme-bg-secondary) !important; }
                .report-dropdown-panel .p-dropdown-item { color: var(--theme-text-primary) !important; background-color: var(--theme-bg-secondary) !important; }
                .report-dropdown-panel .p-dropdown-item:hover { background-color: var(--theme-bg-tertiary) !important; }
                .report-dropdown-panel .p-dropdown-item.p-highlight { background-color: var(--theme-accent) !important; color: white !important; }
                .report-management-panel .p-datatable { background-color: var(--theme-bg-tertiary); }
                .report-management-panel .p-datatable .p-datatable-thead > tr > th { background-color: var(--theme-bg-secondary); border-color: var(--theme-border-primary); color: var(--theme-text-primary); }
                .report-management-panel .p-datatable .p-datatable-tbody > tr { background-color: var(--theme-bg-tertiary); color: var(--theme-text-primary); }
                .report-management-panel .p-datatable .p-datatable-tbody > tr > td { border-color: var(--theme-border-primary); }
                .report-management-panel .p-datatable .p-datatable-tbody > tr:nth-child(even) { background-color: var(--theme-bg-secondary); }
                .report-management-panel .p-datatable .p-datatable-tbody > tr:hover { background-color: var(--theme-bg-primary) !important; }
                .report-management-panel .p-paginator { background-color: var(--theme-bg-secondary); border-color: var(--theme-border-primary); color: var(--theme-text-primary); }
                .report-management-panel .p-paginator .p-paginator-current { color: var(--theme-text-muted); }
                .report-management-panel .p-paginator .p-paginator-element { color: var(--theme-text-primary); }
                .report-management-panel .p-paginator .p-paginator-element:hover { background-color: var(--theme-bg-tertiary); }
                .report-management-panel .p-paginator .p-paginator-element.p-highlight { background-color: var(--theme-accent); color: white; }
                .report-management-panel .p-paginator .p-dropdown { background-color: var(--theme-bg-tertiary); border-color: var(--theme-border-primary); }
                .report-management-panel .p-paginator .p-dropdown .p-dropdown-label { color: var(--theme-text-primary); }
                .report-management-panel .p-inputtextarea { background-color: var(--theme-bg-tertiary); border-color: var(--theme-border-primary); color: var(--theme-text-primary); }
            `}</style>

            {/* LINK-TO-PROJECTS MODAL */}
            <Dialog
                visible={linkModalVisible}
                onHide={() => setLinkModalVisible(false)}
                header={`${t.reportmanagementpanel_link || 'Link to projects'}: ${patternToLink?.name || ''}`}
                style={{ width: '500px' }}
                modal
                contentStyle={{ backgroundColor: colors.bgPrimary, color: colors.textPrimary }}
                headerStyle={{ backgroundColor: colors.dialogHeader, color: colors.textPrimary }}
            >
                <div className="space-y-4">
                    <p className="text-sm" style={{ color: colors.textSecondary }}>
                        {t.reportmanagementpanel_link_desc || 'Select the projects that should use this report pattern as their default.'}
                    </p>

                    <MultiSelect
                        value={linkedProjectIds}
                        options={(Array.isArray(allProjects) ? allProjects : []).map(p => ({ label: p.name, value: p.id }))}
                        onChange={(e) => setLinkedProjectIds(e.value || [])}
                        placeholder={t.reportmanagementpanel_link_placeholder || 'Select projects'}
                        className="w-full"
                        display="chip"
                        loading={loadingProjects}
                        filter
                        filterPlaceholder={t.reportmanagementpanel_link_filter || 'Search projects'}
                        emptyMessage={t.reportmanagementpanel_link_empty || 'No projects available'}
                        panelClassName="report-dropdown-panel"
                    />

                    <div className="flex justify-end gap-2 pt-4" style={{ borderTop: `1px solid ${colors.borderPrimary}` }}>
                        <Button
                            label={t.reportmanagementpanel_cancel || 'Cancel'}
                            className="p-button-secondary"
                            onClick={() => setLinkModalVisible(false)}
                        />
                        <Button
                            label={t.reportmanagementpanel_link_save || 'Link'}
                            icon="pi pi-link"
                            className="p-button-success"
                            onClick={handleSaveLinks}
                            loading={savingLink}
                            disabled={
                                // Enabled only on a real change vs. the snapshot —
                                // additions OR removals (incl. removing the last link).
                                linkedProjectIds.length === originalLinkedIds.length &&
                                linkedProjectIds.every(id => originalLinkedIds.includes(id))
                            }
                        />
                    </div>
                </div>
            </Dialog>

            <ConfirmDialog group="report-management" />
        </div>
    );
};

export default ReportManagementPanel;
