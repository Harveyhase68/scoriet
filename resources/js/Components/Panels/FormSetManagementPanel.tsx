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
            console.error('Error loading my FormSets:', error);
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
                    fs.visibility === 'public' && fs.creator_user_id !== currentUserId
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
            console.error('Error loading public FormSets:', error);
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
            console.error('Error loading projects:', error);
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
            console.error('Error loading linked projects:', error);
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

            toast.showSuccess('FormSet erfolgreich verknüpft');
            setLinkModalVisible(false);
            loadMyFormSets();
            loadPublicFormSets();
        } catch (error) {
            console.error('Error saving links:', error);
            toast.showError('Fehler beim Verknüpfen');
        } finally {
            setSavingLink(false);
        }
    };

    // Open Form Designer for editing
    const handleEdit = (formSet: FormSet) => {
        onOpenPanel?.('form-designer', { formSetId: formSet.id, title: `Form Designer: ${formSet.name}` });
    };

    // Delete FormSet - Show custom dialog with DELETE confirmation
    const handleDelete = (formSet: FormSet) => {
        setFormSetToDelete(formSet);
        setDeleteConfirmText('');
        setDeleteModalVisible(true);
    };

    // Execute FormSet deletion
    const executeDelete = async () => {
        if (!formSetToDelete) return;

        if (deleteConfirmText !== 'DELETE') {
            toast.showError('Geben Sie DELETE ein um zu bestätigen');
            return;
        }

        setDeleting(true);
        try {
            const response = await fetch(`/api/form-sets/${formSetToDelete.id}`, {
                method: 'DELETE',
                headers: getAuthHeaders(),
            });
            if (response.ok) {
                toast.showSuccess('FormSet erfolgreich gelöscht');
                setDeleteModalVisible(false);
                setFormSetToDelete(null);
                setDeleteConfirmText('');
                loadMyFormSets();
            } else {
                toast.showError('Fehler beim Löschen');
            }
        } catch (error) {
            console.error('Error deleting FormSet:', error);
            toast.showError('Netzwerkfehler beim Löschen');
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
            toast.showWarn('Bitte wählen Sie zuerst ein Projekt aus');
            return;
        }

        try {
            const response = await fetch(`/api/projects/${selectedProject.id}/form-set`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ form_set_id: formSet.id }),
            });
            if (response.ok) {
                toast.showSuccess(`FormSet "${formSet.name}" mit Projekt verknüpft`);
                loadMyFormSets();
                loadPublicFormSets();
            } else {
                toast.showError('Fehler beim Verknüpfen');
            }
        } catch (error) {
            console.error('Error linking FormSet:', error);
            toast.showError('Netzwerkfehler beim Verknüpfen');
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
            'private': 'Privat',
            'team': 'Team',
            'public': 'Öffentlich',
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
                {formSet.windows_count || 0} Fenster
            </span>
        );
    };

    // Date renderer
    const dateBodyTemplate = (formSet: FormSet) => {
        return new Date(formSet.created_at).toLocaleDateString('de-DE');
    };

    // Creator renderer
    const creatorBodyTemplate = (formSet: FormSet) => {
        return formSet.creator?.name || `User #${formSet.creator_user_id}`;
    };

    return (
        <div className="formset-management-panel p-4 h-full overflow-auto" style={{ backgroundColor: colors.bgPrimary, color: colors.textPrimary }}>

            {/* MY FORMSETS TABLE */}
            <Card title="Meine FormSets" className="mb-4" style={{ backgroundColor: colors.bgSecondary, border: `1px solid ${colors.borderPrimary}` }}>
                <div className="flex justify-between items-center mb-4">
                    <div className="flex gap-2">
                        <Dropdown
                            value={myVisibilityFilter}
                            options={[
                                { label: 'Alle', value: 'all' },
                                { label: 'Privat', value: 'private' },
                                { label: 'Team', value: 'team' },
                                { label: 'Öffentlich', value: 'public' },
                            ]}
                            onChange={(e) => setMyVisibilityFilter(e.value)}
                            placeholder="Sichtbarkeit"
                            className="w-40"
                            panelClassName="formset-dropdown-panel"
                        />
                        <InputText
                            value={mySearchTerm}
                            onChange={(e) => setMySearchTerm(e.target.value)}
                            placeholder="Suchen..."
                            className="w-64"
                        />
                    </div>
                    <Button
                        label="Neues FormSet"
                        icon="pi pi-plus"
                        className="p-button-success"
                        onClick={() => onOpenPanel?.('form-designer', { title: 'Form Designer' })}
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
                    emptyMessage="Keine FormSets gefunden"
                    paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                    currentPageReportTemplate="{first} bis {last} von {totalRecords} FormSets"
                >
                    <Column field="name" header="Name" sortable />
                    <Column field="description" header="Beschreibung" style={{ maxWidth: '300px' }} />
                    <Column header="Sichtbarkeit" body={visibilityBodyTemplate} />
                    <Column header="Fenster" body={windowsBodyTemplate} />
                    <Column header="Erstellt" body={dateBodyTemplate} sortable field="created_at" />
                    <Column
                        header="Aktionen"
                        body={(formSet: FormSet) => {
                            const isOwner = formSet.creator_user_id === currentUserId;
                            return (
                                <div className="flex gap-1">
                                    <Button
                                        icon="pi pi-link"
                                        className="p-button-text p-button-success p-button-sm"
                                        onClick={() => handleOpenLinkModal(formSet)}
                                        tooltip="Mit Projekten verknüpfen"
                                    />
                                    {isOwner && (
                                        <>
                                            <Button
                                                icon="pi pi-pencil"
                                                className="p-button-text p-button-info p-button-sm"
                                                onClick={() => handleEdit(formSet)}
                                                tooltip="Im Form Designer bearbeiten"
                                            />
                                            <Button
                                                icon="pi pi-trash"
                                                className="p-button-text p-button-danger p-button-sm"
                                                onClick={() => handleDelete(formSet)}
                                                tooltip="FormSet löschen"
                                            />
                                        </>
                                    )}
                                </div>
                            );
                        }}
                    />
                </DataTable>
            </Card>

            {/* PUBLIC FORMSETS TABLE */}
            <Card title="System & Öffentliche FormSets" className="mb-4" style={{ backgroundColor: colors.bgSecondary, border: `1px solid ${colors.borderPrimary}` }}>
                <div className="flex justify-between items-center mb-4">
                    <div className="flex gap-2">
                        <InputText
                            value={publicSearchTerm}
                            onChange={(e) => setPublicSearchTerm(e.target.value)}
                            placeholder="Suchen..."
                            className="w-64"
                        />
                    </div>
                    {selectedProject && (
                        <Tag
                            value={`Aktuelles Projekt: ${selectedProject.name}`}
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
                    emptyMessage="Keine öffentlichen FormSets gefunden"
                    paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                    currentPageReportTemplate="{first} bis {last} von {totalRecords} FormSets"
                >
                    <Column field="name" header="Name" sortable />
                    <Column field="description" header="Beschreibung" style={{ maxWidth: '300px' }} />
                    <Column header="Ersteller" body={creatorBodyTemplate} />
                    <Column header="Fenster" body={windowsBodyTemplate} />
                    <Column header="Erstellt" body={dateBodyTemplate} sortable field="created_at" />
                    <Column
                        header="Aktionen"
                        body={(formSet: FormSet) => (
                            <div className="flex gap-1">
                                <Button
                                    icon="pi pi-link"
                                    className="p-button-text p-button-success p-button-sm"
                                    onClick={() => handleQuickLink(formSet)}
                                    tooltip={selectedProject ? `Mit "${selectedProject.name}" verknüpfen` : 'Projekt auswählen'}
                                    disabled={!selectedProject}
                                />
                            </div>
                        )}
                    />
                </DataTable>
            </Card>

            {/* LINK MODAL */}
            <Dialog
                visible={linkModalVisible}
                onHide={() => setLinkModalVisible(false)}
                header={`"${formSetToLink?.name}" mit Projekten verknüpfen`}
                style={{ width: '500px' }}
                modal
                contentStyle={{ backgroundColor: colors.bgPrimary, color: colors.textPrimary }}
                headerStyle={{ backgroundColor: colors.dialogHeader, color: colors.textPrimary }}
                className="formset-link-modal"
            >
                <div className="space-y-4">
                    <p className="text-sm" style={{ color: colors.textMuted }}>
                        Wählen Sie die Projekte aus, mit denen dieses FormSet verknüpft werden soll.
                    </p>

                    <MultiSelect
                        value={linkedProjectIds}
                        options={(Array.isArray(allProjects) ? allProjects : []).map(p => ({ label: p.name, value: p.id }))}
                        onChange={(e) => setLinkedProjectIds(e.value || [])}
                        placeholder="Projekte auswählen..."
                        className="w-full"
                        display="chip"
                        loading={loadingProjects}
                        filter
                        filterPlaceholder="Suchen..."
                        emptyMessage="Keine Projekte gefunden"
                        panelClassName="formset-multiselect-panel"
                    />

                    <div className="flex justify-end gap-2 pt-4" style={{ borderTop: `1px solid ${colors.borderPrimary}` }}>
                        <Button
                            label="Abbrechen"
                            className="p-button-secondary"
                            onClick={() => setLinkModalVisible(false)}
                        />
                        <Button
                            label="Verknüpfen"
                            icon="pi pi-link"
                            className="p-button-success"
                            onClick={handleSaveLinks}
                            loading={savingLink}
                            disabled={linkedProjectIds.length === 0}
                        />
                    </div>
                </div>
            </Dialog>

            {/* Delete FormSet Dialog */}
            <Dialog
                visible={deleteModalVisible}
                onHide={handleDeleteModalHide}
                header="FormSet löschen"
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
                                <h4 className="font-semibold" style={{ color: colors.errorText }}>Warnung: Permanentes Löschen</h4>
                                <p className="text-sm mt-1" style={{ color: colors.textSecondary }}>
                                    Das FormSet <strong style={{ color: colors.textPrimary }}>"{formSetToDelete?.name}"</strong> wird unwiderruflich gelöscht.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* What will be deleted */}
                    <div className="rounded p-3 text-sm" style={{ backgroundColor: colors.bgSecondary, border: `1px solid ${colors.borderPrimary}` }}>
                        <p className="mb-2" style={{ color: colors.textSecondary }}>Folgendes wird gelöscht:</p>
                        <ul className="list-disc list-inside space-y-1" style={{ color: colors.textMuted }}>
                            <li>Das FormSet und alle Einstellungen</li>
                            <li>Alle Fenster ({formSetToDelete?.windows_count || 0} Fenster)</li>
                            <li>Alle Formular-Elemente</li>
                            <li>Alle Projekt-Verknüpfungen</li>
                        </ul>
                    </div>

                    {/* Confirmation Input */}
                    <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
                            Geben Sie <strong style={{ color: colors.errorText }}>DELETE</strong> ein um zu bestätigen
                        </label>
                        <InputText
                            value={deleteConfirmText}
                            onChange={(e) => setDeleteConfirmText(e.target.value)}
                            placeholder="DELETE"
                            className="w-full"
                            disabled={deleting}
                        />
                        <small className="mt-1 block" style={{ color: colors.textMuted }}>
                            Sie müssen exakt DELETE (Großbuchstaben) eingeben
                        </small>
                    </div>

                    {/* Buttons */}
                    <div className="flex justify-end gap-2 pt-4" style={{ borderTop: `1px solid ${colors.borderPrimary}` }}>
                        <Button
                            label="Abbrechen"
                            icon="pi pi-times"
                            className="p-button-secondary"
                            onClick={handleDeleteModalHide}
                            disabled={deleting}
                        />
                        <Button
                            label={deleting ? 'Lösche...' : 'FormSet löschen'}
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
