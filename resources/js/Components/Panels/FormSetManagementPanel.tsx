import React, { useState, useEffect } from 'react';
import { Dialog } from 'primereact/dialog';
import { DataTable } from 'primereact/datatable';
import { useToast } from '@/contexts/ToastContext';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Card } from 'primereact/card';
import { MultiSelect } from 'primereact/multiselect';
import { useProject } from '@/contexts/ProjectContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation, SupportedLanguage, getStoredLanguage, tpl } from '@/i18n';

interface FormSet {
    id: number;
    name: string;
    description?: string;
    creator_user_id: number;
    visibility: 'public' | 'private' | 'team';
    is_active: boolean;
    windows_count?: number;
    default_background_color?: string;
    default_window_color?: string;
    default_text_color?: string;
    default_button_color?: string;
    created_at: string;
    updated_at?: string;
    creator?: { id: number; name: string };
    linked_project_ids?: number[];
}

interface FormSetManagementPanelProps {
    onOpenPanel?: (panelType: string, data: any) => void;
}

// Helper function to get auth headers
const getAuthHeaders = () => {
    const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
    return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    };
};

const FormSetManagementPanel: React.FC<FormSetManagementPanelProps> = ({ onOpenPanel }) => {
    const { selectedProject } = useProject();
    const toast = useToast();
    const { colors } = useTheme();
    const [currentLanguage] = React.useState<SupportedLanguage>(getStoredLanguage());
    const { t } = useTranslation(currentLanguage);

    // Get current user ID for permission checks
    const currentUserId = parseInt(localStorage.getItem('user_id') || '0');

    // State - FormSets
    const [myFormSets, setMyFormSets] = useState<FormSet[]>([]);
    const [publicFormSets, setPublicFormSets] = useState<FormSet[]>([]);
    const [myFormSetsLoading, setMyFormSetsLoading] = useState(false);
    const [publicFormSetsLoading, setPublicFormSetsLoading] = useState(false);

    // Filters - My FormSets
    const [mySearchTerm, setMySearchTerm] = useState('');
    const [myVisibilityFilter, setMyVisibilityFilter] = useState('all');

    // Filters - Public FormSets
    const [publicSearchTerm, setPublicSearchTerm] = useState('');

    // Link Modal State
    const [linkModalVisible, setLinkModalVisible] = useState(false);
    const [formSetToLink, setFormSetToLink] = useState<FormSet | null>(null);
    const [allProjects, setAllProjects] = useState<any[]>([]);
    const [linkedProjectIds, setLinkedProjectIds] = useState<number[]>([]);
    const [loadingProjects, setLoadingProjects] = useState(false);
    const [savingLink, setSavingLink] = useState(false);

    // Edit Modal State
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [editFormSet, setEditFormSet] = useState<FormSet | null>(null);
    const [editFsName, setEditFsName] = useState('');
    const [editFsDescription, setEditFsDescription] = useState('');
    const [editFsVisibility, setEditFsVisibility] = useState<string>('private');
    const [editingSave, setEditingSave] = useState(false);

    // Delete Modal State
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [formSetToDelete, setFormSetToDelete] = useState<FormSet | null>(null);
    const [deleteConfirmText, setDeleteConfirmText] = useState('');
    const [deleting, setDeleting] = useState(false);

    // Load data on mount
    useEffect(() => {
        loadMyFormSets();
        loadPublicFormSets();
    }, []);

    // Reload when filters change
    useEffect(() => {
        loadMyFormSets();
    }, [mySearchTerm, myVisibilityFilter]);

    useEffect(() => {
        loadPublicFormSets();
    }, [publicSearchTerm]);

    // Load user's own FormSets (created, linked, team access)
    const loadMyFormSets = async () => {
        setMyFormSetsLoading(true);
        try {
            const response = await fetch('/api/form-sets?own_only=true', {
                headers: getAuthHeaders(),
            });
            if (response.ok) {
                const data = await response.json();
                let filtered = data.data || [];

                // Apply visibility filter
                if (myVisibilityFilter !== 'all') {
                    filtered = filtered.filter((fs: FormSet) => fs.visibility === myVisibilityFilter);
                }

                // Apply search
                if (mySearchTerm) {
                    const search = mySearchTerm.toLowerCase();
                    filtered = filtered.filter((fs: FormSet) =>
                        fs.name?.toLowerCase().includes(search) ||
                        fs.description?.toLowerCase().includes(search)
                    );
                }

                setMyFormSets(filtered);
            }
        } catch (error) {
            console.error(t.formsetmanagementpanel128, error);
            setMyFormSets([]);
        } finally {
            setMyFormSetsLoading(false);
        }
    };

    // Load public/system FormSets
    const loadPublicFormSets = async () => {
        setPublicFormSetsLoading(true);
        try {
            const response = await fetch('/api/form-sets', {
                headers: getAuthHeaders(),
            });
            if (response.ok) {
                const data = await response.json();
                let filtered = (data.data || []).filter((fs: FormSet) =>
                    fs.visibility === 'public' && Number(fs.creator_user_id) !== Number(currentUserId)
                );

                // Apply search
                if (publicSearchTerm) {
                    const search = publicSearchTerm.toLowerCase();
                    filtered = filtered.filter((fs: FormSet) =>
                        fs.name?.toLowerCase().includes(search) ||
                        fs.description?.toLowerCase().includes(search)
                    );
                }

                setPublicFormSets(filtered);
            }
        } catch (error) {
            console.error(t.formsetmanagementpanel160, error);
            setPublicFormSets([]);
        } finally {
            setPublicFormSetsLoading(false);
        }
    };

    // Load projects for linking
    const loadProjects = async () => {
        setLoadingProjects(true);
        try {
            const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
            const response = await fetch('/api/projects', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                },
            });
            if (response.ok) {
                const data = await response.json();
                // Handle different API response formats:
                // - { projects: [...] } - standard format from ProjectController
                // - { data: [...] } - alternative format
                // - [...] - direct array
                const projects = Array.isArray(data)
                    ? data
                    : (Array.isArray(data.projects)
                        ? data.projects
                        : (Array.isArray(data.data)
                            ? data.data
                            : []));
                setAllProjects(projects);
            } else {
                setAllProjects([]);
            }
        } catch (error) {
            console.error(t.formsetmanagementpanel196, error);
            setAllProjects([]);
        } finally {
            setLoadingProjects(false);
        }
    };

    // Load linked projects for a FormSet
    const loadLinkedProjects = async (formSetId: number): Promise<number[]> => {
        try {
            const response = await fetch(`/api/form-sets/${formSetId}/linked-projects`, {
                headers: getAuthHeaders(),
            });
            if (response.ok) {
                const data = await response.json();
                return data.data || [];
            }
        } catch (error) {
            console.error(t.formsetmanagementpanel214, error);
        }
        return [];
    };

    // Open link modal
    const handleOpenLinkModal = async (formSet: FormSet) => {
        setFormSetToLink(formSet);
        setLinkedProjectIds([]); // Reset first
        setLinkModalVisible(true);

        // Load projects and linked projects in parallel
        const [, linkedIds] = await Promise.all([
            loadProjects(),
            loadLinkedProjects(formSet.id)
        ]);

        setLinkedProjectIds(linkedIds);
    };

    // Save project links
    const handleSaveLinks = async () => {
        if (!formSetToLink) return;

        setSavingLink(true);
        try {
            // For each selected project, activate the formset
            for (const projectId of linkedProjectIds) {
                await fetch(`/api/projects/${projectId}/form-set`, {
                    method: 'POST',
                    headers: getAuthHeaders(),
                    body: JSON.stringify({ form_set_id: formSetToLink.id }),
                });
            }

            toast.showSuccess(t.formsetmanagementpanel249);
            setLinkModalVisible(false);
            loadMyFormSets();
            loadPublicFormSets();
        } catch (error) {
            console.error(t.formsetmanagementpanel254, error);
            toast.showError(t.formsetmanagementpanel255);
        } finally {
            setSavingLink(false);
        }
    };

    // Open edit properties modal
    const handleEditProperties = (formSet: FormSet) => {
        setEditFormSet(formSet);
        setEditFsName(formSet.name);
        setEditFsDescription(formSet.description || '');
        setEditFsVisibility(formSet.visibility);
        setEditModalVisible(true);
    };

    const executeEditProperties = async () => {
        if (!editFormSet || !editFsName.trim()) return;
        setEditingSave(true);
        try {
            const response = await fetch(`/api/form-sets/${editFormSet.id}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify({ name: editFsName, description: editFsDescription || null, visibility: editFsVisibility }),
            });
            if (response.ok) {
                toast.showSuccess(t.formsetmanagementpanel_updated || 'Form Blueprint updated');
                setEditModalVisible(false);
                setEditFormSet(null);
                loadMyFormSets();
                loadPublicFormSets();
            } else {
                const err = await response.json();
                toast.showError(err.error || err.message || 'Error updating');
            }
        } catch (error) {
            console.error('Edit error:', error);
            toast.showError('Error updating');
        } finally {
            setEditingSave(false);
        }
    };

    // Open Form Designer for editing
    const handleOpenDesigner = (formSet: FormSet) => {
        onOpenPanel?.('form-designer', { formSetId: formSet.id, title: `${t.formsetmanagementpanel263}${formSet.name}` });
    };

    // Open Form Layout Designer with pre-selection via localStorage
    const handleOpenLayoutDesigner = (formSet: FormSet) => {
        localStorage.setItem('form_layout_preselect', JSON.stringify({
            formSetId: formSet.id,
            formSetName: formSet.name,
            timestamp: Date.now(),
        }));
        onOpenPanel?.('form-layout-designer', {
            title: `${t.formsetmanagementpanel_layout || 'Form Layout'}: ${formSet.name}`,
            forceNew: true,
        });
    };

    // Pre-flight: when in-use, refuse delete BEFORE showing the DELETE-confirm modal
    // and instead open an informative "cannot delete" dialog listing the references.
    const [inUseModalVisible, setInUseModalVisible] = useState(false);
    const [inUseInfo, setInUseInfo] = useState<{
        formSetName: string;
        tables: Array<{ id: number; table_name: string; schema_id: number | null }>;
        projects: Array<{ id: number; name: string | null }>;
    } | null>(null);

    const handleDelete = async (formSet: FormSet) => {
        try {
            const res = await fetch(`/api/form-sets/${formSet.id}/usage`, {
                headers: getAuthHeaders(),
            });
            if (res.ok) {
                const data = await res.json();
                if (data?.data?.in_use) {
                    setInUseInfo({
                        formSetName: formSet.name,
                        tables: data.data.tables || [],
                        projects: data.data.projects || [],
                    });
                    setInUseModalVisible(true);
                    return;
                }
            }
        } catch {
            // If the usage check fails for any reason, fall through to the normal
            // confirm dialog — the backend's destroy() will still block in-use sets.
        }
        setFormSetToDelete(formSet);
        setDeleteConfirmText('');
        setDeleteModalVisible(true);
    };

    // Execute FormSet deletion
    const executeDelete = async () => {
        if (!formSetToDelete) return;

        if (deleteConfirmText !== 'DELETE') {
            toast.showError(`${t.formsetmanagementpanel278}"DELETE"${t.formsetmanagementpanel278_2}`);
            return;
        }

        setDeleting(true);
        try {
            const response = await fetch(`/api/form-sets/${formSetToDelete.id}`, {
                method: 'DELETE',
                headers: getAuthHeaders(),
            });
            if (response.ok) {
                toast.showSuccess(t.formsetmanagementpanel289);
                setDeleteModalVisible(false);
                setFormSetToDelete(null);
                setDeleteConfirmText('');
                loadMyFormSets();
            } else {
                toast.showError(t.formsetmanagementpanel295);
            }
        } catch (error) {
            console.error(t.formsetmanagementpanel298, error);
            toast.showError(t.formsetmanagementpanel299);
        } finally {
            setDeleting(false);
        }
    };

    // Close delete modal
    const handleDeleteModalHide = () => {
        if (!deleting) {
            setDeleteModalVisible(false);
            setFormSetToDelete(null);
            setDeleteConfirmText('');
        }
    };

    // Quick link to current project
    const handleQuickLink = async (formSet: FormSet) => {
        if (!selectedProject?.id) {
            toast.showWarn(t.formsetmanagementpanel317);
            return;
        }

        try {
            const response = await fetch(`/api/projects/${selectedProject.id}/form-set`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ form_set_id: formSet.id }),
            });
            if (response.ok) {
                toast.showSuccess(`${t.formsetmanagementpanel328}"${formSet.name}"${t.formsetmanagementpanel328_2}`);
                loadMyFormSets();
                loadPublicFormSets();
            } else {
                toast.showError(t.formsetmanagementpanel332);
            }
        } catch (error) {
            console.error(t.formsetmanagementpanel335, error);
            toast.showError(t.formsetmanagementpanel336);
        }
    };

    // Visibility tag renderer
    const visibilityBodyTemplate = (formSet: FormSet) => {
        const visibilityColors: Record<string, string> = {
            'private': 'bg-gray-500',
            'team': 'bg-blue-500',
            'public': 'bg-green-500',
        };
        const labels: Record<string, string> = {
            'private': t.formsetmanagementpanel348,
            'team': t.formsetmanagementpanel349,
            'public': t.formsetmanagementpanel350,
        };
        return (
            <span className={`px-2 py-1 ${visibilityColors[formSet.visibility] || 'bg-gray-500'} text-white rounded text-xs`}>
                {labels[formSet.visibility] || formSet.visibility}
            </span>
        );
    };

    // Windows count renderer
    const windowsBodyTemplate = (formSet: FormSet) => {
        return (
            <span className="px-2 py-1 bg-purple-500 text-white rounded text-xs">
                {formSet.windows_count || 0} {t.formsetmanagementpanel363}
            </span>
        );
    };

    // Date renderer
    const dateBodyTemplate = (formSet: FormSet) => {
        return new Date(formSet.created_at).toLocaleDateString(currentLanguage);
    };

    // Creator renderer
    const creatorBodyTemplate = (formSet: FormSet) => {
        return formSet.creator?.name || `User #${formSet.creator_user_id}`;
    };

    return (
        <div className="formset-management-panel p-4 h-full overflow-auto" style={{ backgroundColor: colors.bgPrimary, color: colors.textPrimary }}>

            {/* MY FORMSETS TABLE */}
            <Card title={t.formsetmanagementpanel382} className="mb-4" style={{ backgroundColor: colors.bgSecondary, border: `1px solid ${colors.borderPrimary}` }}>
                <div className="flex justify-between items-center mb-4">
                    <div className="flex gap-2">
                        <Dropdown
                            value={myVisibilityFilter}
                            options={[
                                { label: t.formsetmanagementpanel388, value: 'all' },
                                { label: t.formsetmanagementpanel389, value: 'private' },
                                { label: t.formsetmanagementpanel390, value: 'team' },
                                { label: t.formsetmanagementpanel391, value: 'public' },
                            ]}
                            onChange={(e) => setMyVisibilityFilter(e.value)}
                            placeholder={t.formsetmanagementpanel394}
                            className="w-40"
                            panelClassName="formset-dropdown-panel"
                        />
                        <InputText
                            value={mySearchTerm}
                            onChange={(e) => setMySearchTerm(e.target.value)}
                            placeholder={t.formsetmanagementpanel401}
                            className="w-64"
                        />
                    </div>
                    <Button
                        label={t.formsetmanagementpanel406}
                        icon="pi pi-plus"
                        className="p-button-success"
                        onClick={() => onOpenPanel?.('form-designer', { title: t.formsetmanagementpanel409 })}
                    />
                </div>

                <DataTable
                    value={myFormSets}
                    loading={myFormSetsLoading}
                    paginator
                    rows={10}
                    rowsPerPageOptions={[10, 25, 50]}
                    sortMode="multiple"
                    className="p-datatable-sm"
                    emptyMessage={t.formsetmanagementpanel421} //Keine FormSets gefunden
                    paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                    currentPageReportTemplate={`{first}${t.formsetmanagementpanel423_2}{last}${t.formsetmanagementpanel423_3}{totalRecords}${t.formsetmanagementpanel423_4}`}
                >
                    <Column field="name" header={t.formsetmanagementpanel425} sortable />
                    <Column field="description" header={t.formsetmanagementpanel426} style={{ maxWidth: '300px' }} />
                    <Column header={t.formsetmanagementpanel427} body={visibilityBodyTemplate} />
                    <Column header={t.formsetmanagementpanel428} body={windowsBodyTemplate} />
                    <Column header={t.formsetmanagementpanel429} body={dateBodyTemplate} sortable field="created_at" />
                    <Column
                        header={t.formsetmanagementpanel431}
                        body={(formSet: FormSet) => {
                            const isOwner = Number(formSet.creator_user_id) === Number(currentUserId);
                            return (
                                <div className="flex gap-1">
                                    {isOwner && (
                                        <Button
                                            icon="pi pi-pencil"
                                            className="p-button-text p-button-info p-button-sm"
                                            onClick={() => handleEditProperties(formSet)}
                                            tooltip={t.formsetmanagementpanel_edit_props || 'Edit Properties'}
                                        />
                                    )}
                                    <Button
                                        icon="pi pi-link"
                                        className="p-button-text p-button-success p-button-sm"
                                        onClick={() => handleOpenLinkModal(formSet)}
                                        tooltip={t.formsetmanagementpanel440}
                                    />
                                    <Button
                                        icon="pi pi-sliders-h"
                                        className="p-button-text p-button-secondary p-button-sm"
                                        onClick={() => handleOpenDesigner(formSet)}
                                        tooltip={t.formsetmanagementpanel448}
                                    />
                                    <Button
                                        icon="pi pi-th-large"
                                        className="p-button-text p-button-help p-button-sm"
                                        onClick={() => handleOpenLayoutDesigner(formSet)}
                                        tooltip={t.formsetmanagementpanel_open_layout || 'Open in Layout Designer'}
                                    />
                                    {isOwner && (
                                        <Button
                                            icon="pi pi-trash"
                                            className="p-button-text p-button-danger p-button-sm"
                                            onClick={() => handleDelete(formSet)}
                                            tooltip={t.formsetmanagementpanel454}
                                        />
                                    )}
                                </div>
                            );
                        }}
                    />
                </DataTable>
            </Card>

            {/* PUBLIC FORMSETS TABLE */}
            <Card title={t.formsetmanagementpanel466} className="mb-4" style={{ backgroundColor: colors.bgSecondary, border: `1px solid ${colors.borderPrimary}` }}>
                <div className="flex justify-between items-center mb-4">
                    <div className="flex gap-2">
                        <InputText
                            value={publicSearchTerm}
                            onChange={(e) => setPublicSearchTerm(e.target.value)}
                            placeholder={t.formsetmanagementpanel472}
                            className="w-64"
                        />
                    </div>
                    {selectedProject && (
                        <Tag
                            value={`${t.formsetmanagementpanel478}${selectedProject.name}`}
                            severity="info"
                            className="text-sm"
                        />
                    )}
                </div>

                <DataTable
                    value={publicFormSets}
                    loading={publicFormSetsLoading}
                    paginator
                    rows={10}
                    rowsPerPageOptions={[10, 25, 50]}
                    sortMode="multiple"
                    className="p-datatable-sm"
                    emptyMessage={t.formsetmanagementpanel493}
                    paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                    currentPageReportTemplate={`{first}${t.formsetmanagementpanel423}{last}${t.formsetmanagementpanel495}{totalRecords}${t.formsetmanagementpanel495_2}`}
                >
                    <Column field="name" header={t.formsetmanagementpanel497} sortable />
                    <Column field="description" header={t.formsetmanagementpanel498} style={{ maxWidth: '300px' }} />
                    <Column header={t.formsetmanagementpanel499} body={creatorBodyTemplate} />
                    <Column header={t.formsetmanagementpanel500} body={windowsBodyTemplate} />
                    <Column header={t.formsetmanagementpanel501} body={dateBodyTemplate} sortable field="created_at" />
                    <Column
                        header={t.formsetmanagementpanel503}
                        body={(formSet: FormSet) => (
                            <div className="flex gap-1">
                                <Button
                                    icon="pi pi-link"
                                    className="p-button-text p-button-success p-button-sm"
                                    onClick={() => handleQuickLink(formSet)}
                                    tooltip={selectedProject ? tpl(t.formsetmanagementpanel510, { name: selectedProject.name }) : t.formsetmanagementpanel510_2}
                                    disabled={!selectedProject}
                                />
                            </div>
                        )}
                    />
                </DataTable>
            </Card>

            {/* EDIT PROPERTIES MODAL */}
            <Dialog
                visible={editModalVisible}
                onHide={() => { if (!editingSave) setEditModalVisible(false); }}
                header={t.formsetmanagementpanel_edit_title || 'Edit Form Blueprint'}
                style={{ width: '450px' }}
                modal closable={!editingSave}
                contentStyle={{ backgroundColor: colors.bgPrimary, color: colors.textPrimary }}
                headerStyle={{ backgroundColor: colors.dialogHeader, color: colors.textPrimary }}
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">{t.formsetmanagementpanel_name || 'Name'}</label>
                        <InputText value={editFsName} onChange={(e) => setEditFsName(e.target.value)} className="w-full" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">{t.formsetmanagementpanel_visibility || 'Visibility'}</label>
                        <Dropdown
                            value={editFsVisibility}
                            options={[
                                { label: t.formsetmanagementpanel_private || 'Private', value: 'private' },
                                { label: t.formsetmanagementpanel_team || 'Team', value: 'team' },
                                { label: t.formsetmanagementpanel_public || 'Public', value: 'public' },
                            ]}
                            onChange={(e) => setEditFsVisibility(e.value)}
                            className="w-full"
                        />
                    </div>
                    <div className="flex justify-end gap-2 pt-4" style={{ borderTop: `1px solid ${colors.borderPrimary}` }}>
                        <Button label={t.formsetmanagementpanel_cancel || 'Cancel'} className="p-button-secondary" onClick={() => setEditModalVisible(false)} disabled={editingSave} />
                        <Button label={editingSave ? (t.formsetmanagementpanel_saving || 'Saving...') : (t.formsetmanagementpanel_save || 'Save')} icon={editingSave ? 'pi pi-spinner pi-spin' : 'pi pi-check'} className="p-button-success" onClick={executeEditProperties} loading={editingSave} disabled={!editFsName.trim()} />
                    </div>
                </div>
            </Dialog>

            {/* LINK MODAL */}
            <Dialog
                visible={linkModalVisible}
                onHide={() => setLinkModalVisible(false)}
                header={`"${formSetToLink?.name}"${t.formsetmanagementpanel523}`}
                style={{ width: '500px' }}
                modal
                contentStyle={{ backgroundColor: colors.bgPrimary, color: colors.textPrimary }}
                headerStyle={{ backgroundColor: colors.dialogHeader, color: colors.textPrimary }}
                className="formset-link-modal"
            >
                <div className="space-y-4">
                    <p className="text-sm" style={{ color: colors.textMuted }}>
                        {t.formsetmanagementpanel532}
                    </p>

                    <MultiSelect
                        value={linkedProjectIds}
                        options={(Array.isArray(allProjects) ? allProjects : []).map(p => ({ label: p.name, value: p.id }))}
                        onChange={(e) => setLinkedProjectIds(e.value || [])}
                        placeholder={t.formsetmanagementpanel539}
                        className="w-full"
                        display="chip"
                        loading={loadingProjects}
                        filter
                        filterPlaceholder={t.formsetmanagementpanel544}
                        emptyMessage={t.formsetmanagementpanel545}
                        panelClassName="formset-multiselect-panel"
                    />

                    <div className="flex justify-end gap-2 pt-4" style={{ borderTop: `1px solid ${colors.borderPrimary}` }}>
                        <Button
                            label={t.formsetmanagementpanel551}
                            className="p-button-secondary"
                            onClick={() => setLinkModalVisible(false)}
                        />
                        <Button
                            label={t.formsetmanagementpanel556}
                            icon="pi pi-link"
                            className="p-button-success"
                            onClick={handleSaveLinks}
                            loading={savingLink}
                            disabled={linkedProjectIds.length === 0}
                        />
                    </div>
                </div>
            </Dialog>

            {/* In-Use Info Dialog (pre-flight, shown when delete is impossible) */}
            <Dialog
                visible={inUseModalVisible}
                onHide={() => { setInUseModalVisible(false); setInUseInfo(null); }}
                header={(t as unknown as Record<string, string>).formsetmanagementpanel_in_use_title || 'Cannot delete Form Set'}
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
                                    {(t as unknown as Record<string, string>).formsetmanagementpanel_in_use_heading || 'Form Set is still in use'}
                                </h4>
                                <p className="text-sm mt-1" style={{ color: colors.textSecondary }}>
                                    <strong style={{ color: colors.textPrimary }}>"{inUseInfo?.formSetName}"</strong>
                                    {' '}
                                    {(t as unknown as Record<string, string>).formsetmanagementpanel_in_use_explain
                                      || 'is referenced and cannot be deleted yet. Remove the references below first, then try again.'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {inUseInfo && inUseInfo.tables.length > 0 && (
                        <div className="rounded p-3 text-sm" style={{ backgroundColor: colors.bgSecondary, border: `1px solid ${colors.borderPrimary}` }}>
                            <p className="mb-2 font-medium" style={{ color: colors.textSecondary }}>
                                <i className="pi pi-table mr-2"></i>
                                {(t as unknown as Record<string, string>).formsetmanagementpanel_in_use_tables || 'Used by schema tables:'}
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
                                {(t as unknown as Record<string, string>).formsetmanagementpanel_in_use_projects || 'Set as default in projects:'}
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
                        {(t as unknown as Record<string, string>).formsetmanagementpanel_in_use_hint
                          || 'Open the schema designer to remove the form set from those tables, or change the project default in the project settings.'}
                    </div>

                    <div className="flex justify-end pt-4" style={{ borderTop: `1px solid ${colors.borderPrimary}` }}>
                        <Button
                            label={(t as unknown as Record<string, string>).formsetmanagementpanel_close || 'Close'}
                            icon="pi pi-times"
                            className="p-button-secondary"
                            onClick={() => { setInUseModalVisible(false); setInUseInfo(null); }}
                        />
                    </div>
                </div>
            </Dialog>

            {/* Delete FormSet Dialog */}
            <Dialog
                visible={deleteModalVisible}
                onHide={handleDeleteModalHide}
                header={t.formsetmanagementpanel571}
                style={{ width: '450px' }}
                modal
                closable={!deleting}
                contentStyle={{ backgroundColor: colors.bgPrimary, color: colors.textPrimary }}
                headerStyle={{ backgroundColor: colors.dialogHeader, color: colors.textPrimary }}
                className="formset-delete-modal"
            >
                <div className="space-y-4">
                    {/* Warning */}
                    <div className="rounded p-4" style={{ backgroundColor: colors.errorBg, border: `1px solid ${colors.errorBorder}` }}>
                        <div className="flex items-start gap-3">
                            <i className="pi pi-exclamation-triangle text-2xl" style={{ color: colors.errorText }}></i>
                            <div>
                                <h4 className="font-semibold" style={{ color: colors.errorText }}>{t.formsetmanagementpanel585}</h4>
                                <p className="text-sm mt-1" style={{ color: colors.textSecondary }}>
                                    {t.formsetmanagementpanel587}<strong style={{ color: colors.textPrimary }}>"{formSetToDelete?.name}"</strong>{t.formsetmanagementpanel587_2}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* What will be deleted */}
                    <div className="rounded p-3 text-sm" style={{ backgroundColor: colors.bgSecondary, border: `1px solid ${colors.borderPrimary}` }}>
                        <p className="mb-2" style={{ color: colors.textSecondary }}>{t.formsetmanagementpanel595_2}</p>
                        <ul className="list-disc list-inside space-y-1" style={{ color: colors.textMuted }}>
                            <li>{t.formsetmanagementpanel597}</li>
                            <li>{t.formsetmanagementpanel598}({formSetToDelete?.windows_count || 0} {t.formsetmanagementpanel598_2})</li>
                            <li>{t.formsetmanagementpanel599}</li>
                            <li>{t.formsetmanagementpanel600}</li>
                        </ul>
                    </div>

                    {/* Confirmation Input */}
                    <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
                            {t.formsetmanagementpanel607}<strong style={{ color: colors.errorText }}>DELETE</strong>{t.formsetmanagementpanel607_2}
                        </label>
                        <InputText
                            value={deleteConfirmText}
                            onChange={(e) => setDeleteConfirmText(e.target.value)}
                            placeholder="DELETE"
                            className="w-full"
                            disabled={deleting}
                        />
                        <small className="mt-1 block" style={{ color: colors.textMuted }}>
                            {t.formsetmanagementpanel617}
                        </small>
                    </div>

                    {/* Buttons */}
                    <div className="flex justify-end gap-2 pt-4" style={{ borderTop: `1px solid ${colors.borderPrimary}` }}>
                        <Button
                            label={t.formsetmanagementpanel624}
                            icon="pi pi-times"
                            className="p-button-secondary"
                            onClick={handleDeleteModalHide}
                            disabled={deleting}
                        />
                        <Button
                            label={deleting ? t.formsetmanagementpanel631 : t.formsetmanagementpanel631_2}
                            icon={deleting ? 'pi pi-spinner pi-spin' : 'pi pi-trash'}
                            className="p-button-danger"
                            onClick={executeDelete}
                            disabled={deleting || deleteConfirmText !== 'DELETE'}
                        />
                    </div>
                </div>
            </Dialog>

            {/* Theme-aware styles for PrimeReact components */}
            <style>{`
                .formset-management-panel .p-card .p-card-title {
                    color: var(--theme-text-primary);
                }
                .formset-management-panel .p-card .p-card-content {
                    color: var(--theme-text-primary);
                }
                .formset-management-panel .p-inputtext {
                    background-color: var(--theme-bg-tertiary);
                    border-color: var(--theme-border-primary);
                    color: var(--theme-text-primary);
                }
                .formset-management-panel .p-inputtext:hover {
                    border-color: var(--theme-accent);
                }
                .formset-management-panel .p-inputtext:focus {
                    border-color: var(--theme-accent);
                    box-shadow: 0 0 0 1px var(--theme-accent);
                }
                .formset-management-panel .p-inputtext::placeholder {
                    color: var(--theme-text-muted);
                }
                .formset-management-panel .p-dropdown {
                    background-color: var(--theme-bg-tertiary);
                    border-color: var(--theme-border-primary);
                    color: var(--theme-text-primary);
                }
                .formset-management-panel .p-dropdown:hover {
                    border-color: var(--theme-accent);
                }
                .formset-management-panel .p-dropdown .p-dropdown-label {
                    color: var(--theme-text-primary);
                }
                .formset-management-panel .p-dropdown .p-dropdown-trigger {
                    color: var(--theme-text-muted);
                }
                /* Dropdown Panel - rendered as portal */
                .formset-dropdown-panel {
                    background-color: var(--theme-bg-secondary) !important;
                    border-color: var(--theme-border-primary) !important;
                }
                .formset-dropdown-panel .p-dropdown-items {
                    background-color: var(--theme-bg-secondary) !important;
                }
                .formset-dropdown-panel .p-dropdown-item {
                    color: var(--theme-text-primary) !important;
                    background-color: var(--theme-bg-secondary) !important;
                }
                .formset-dropdown-panel .p-dropdown-item:hover {
                    background-color: var(--theme-bg-tertiary) !important;
                }
                .formset-dropdown-panel .p-dropdown-item.p-highlight {
                    background-color: var(--theme-accent) !important;
                    color: white !important;
                }
                /* MultiSelect Panel - rendered as portal */
                .formset-multiselect-panel {
                    background-color: var(--theme-bg-secondary) !important;
                    border-color: var(--theme-border-primary) !important;
                }
                .formset-multiselect-panel .p-multiselect-header {
                    background-color: var(--theme-bg-secondary) !important;
                    border-color: var(--theme-border-primary) !important;
                    color: var(--theme-text-primary) !important;
                }
                .formset-multiselect-panel .p-multiselect-header .p-checkbox .p-checkbox-box {
                    background-color: var(--theme-bg-tertiary) !important;
                    border-color: var(--theme-border-primary) !important;
                }
                .formset-multiselect-panel .p-multiselect-header .p-checkbox .p-checkbox-box.p-highlight {
                    background-color: var(--theme-accent) !important;
                    border-color: var(--theme-accent) !important;
                }
                .formset-multiselect-panel .p-multiselect-header .p-multiselect-filter-container .p-inputtext {
                    background-color: var(--theme-bg-tertiary) !important;
                    border-color: var(--theme-border-primary) !important;
                    color: var(--theme-text-primary) !important;
                }
                .formset-multiselect-panel .p-multiselect-header .p-multiselect-close {
                    color: var(--theme-text-muted) !important;
                }
                .formset-multiselect-panel .p-multiselect-header .p-multiselect-close:hover {
                    background-color: var(--theme-bg-tertiary) !important;
                    color: var(--theme-text-primary) !important;
                }
                .formset-multiselect-panel .p-multiselect-items-wrapper {
                    background-color: var(--theme-bg-secondary) !important;
                }
                .formset-multiselect-panel .p-multiselect-items {
                    background-color: var(--theme-bg-secondary) !important;
                }
                .formset-multiselect-panel .p-multiselect-item {
                    color: var(--theme-text-primary) !important;
                    background-color: var(--theme-bg-secondary) !important;
                }
                .formset-multiselect-panel .p-multiselect-item:hover {
                    background-color: var(--theme-bg-tertiary) !important;
                }
                .formset-multiselect-panel .p-multiselect-item.p-highlight {
                    background-color: var(--theme-accent) !important;
                    color: white !important;
                }
                .formset-multiselect-panel .p-multiselect-item .p-checkbox .p-checkbox-box {
                    background-color: var(--theme-bg-tertiary) !important;
                    border-color: var(--theme-border-primary) !important;
                }
                .formset-multiselect-panel .p-multiselect-item .p-checkbox .p-checkbox-box.p-highlight {
                    background-color: var(--theme-accent) !important;
                    border-color: var(--theme-accent) !important;
                }
                .formset-multiselect-panel .p-multiselect-empty-message {
                    color: var(--theme-text-muted) !important;
                    background-color: var(--theme-bg-secondary) !important;
                }
                /* Link Modal MultiSelect */
                .formset-link-modal .p-multiselect {
                    background-color: var(--theme-bg-secondary) !important;
                    border-color: var(--theme-border-primary) !important;
                    color: var(--theme-text-primary) !important;
                }
                .formset-link-modal .p-multiselect:hover {
                    border-color: var(--theme-accent) !important;
                }
                .formset-link-modal .p-multiselect .p-multiselect-label {
                    color: var(--theme-text-primary) !important;
                }
                .formset-link-modal .p-multiselect .p-multiselect-label.p-placeholder {
                    color: var(--theme-text-muted) !important;
                }
                .formset-link-modal .p-multiselect .p-multiselect-trigger {
                    color: var(--theme-text-muted) !important;
                }
                .formset-link-modal .p-multiselect-token {
                    background-color: var(--theme-accent) !important;
                    color: white !important;
                }
                /* Delete Modal InputText */
                .formset-delete-modal .p-inputtext {
                    background-color: var(--theme-bg-secondary) !important;
                    border-color: var(--theme-border-primary) !important;
                    color: var(--theme-text-primary) !important;
                }
                .formset-delete-modal .p-inputtext:focus {
                    border-color: var(--theme-accent) !important;
                    box-shadow: 0 0 0 1px var(--theme-accent) !important;
                }
                .formset-delete-modal .p-inputtext::placeholder {
                    color: var(--theme-text-muted) !important;
                }
                /* DataTable styling */
                .formset-management-panel .p-datatable {
                    background-color: var(--theme-bg-tertiary);
                }
                .formset-management-panel .p-datatable .p-datatable-header {
                    background-color: var(--theme-bg-secondary);
                    border-color: var(--theme-border-primary);
                    color: var(--theme-text-primary);
                }
                .formset-management-panel .p-datatable .p-datatable-thead > tr > th {
                    background-color: var(--theme-bg-secondary);
                    border-color: var(--theme-border-primary);
                    color: var(--theme-text-primary);
                }
                .formset-management-panel .p-datatable .p-datatable-tbody > tr {
                    background-color: var(--theme-bg-tertiary);
                    color: var(--theme-text-primary);
                }
                .formset-management-panel .p-datatable .p-datatable-tbody > tr > td {
                    border-color: var(--theme-border-primary);
                }
                .formset-management-panel .p-datatable .p-datatable-tbody > tr:nth-child(even) {
                    background-color: var(--theme-bg-secondary);
                }
                .formset-management-panel .p-datatable .p-datatable-tbody > tr:hover {
                    background-color: var(--theme-bg-primary) !important;
                }
                /* Paginator styling */
                .formset-management-panel .p-paginator {
                    background-color: var(--theme-bg-secondary);
                    border-color: var(--theme-border-primary);
                    color: var(--theme-text-primary);
                }
                .formset-management-panel .p-paginator .p-paginator-current {
                    color: var(--theme-text-muted);
                }
                .formset-management-panel .p-paginator .p-paginator-element {
                    color: var(--theme-text-primary);
                }
                .formset-management-panel .p-paginator .p-paginator-element:hover {
                    background-color: var(--theme-bg-tertiary);
                }
                .formset-management-panel .p-paginator .p-paginator-element.p-highlight {
                    background-color: var(--theme-accent);
                    color: white;
                }
                .formset-management-panel .p-paginator .p-dropdown {
                    background-color: var(--theme-bg-tertiary);
                    border-color: var(--theme-border-primary);
                }
                .formset-management-panel .p-paginator .p-dropdown .p-dropdown-label {
                    color: var(--theme-text-primary);
                }
            `}</style>
        </div>
    );
};

export default FormSetManagementPanel;
