import React, { useState, useEffect } from 'react';
import { Dialog } from 'primereact/dialog';
import { DataTable } from 'primereact/datatable';
import { confirmDialog } from 'primereact/confirmdialog';
import { ConfirmDialog } from 'primereact/confirmdialog';
import { useToast } from '@/contexts/ToastContext';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Card } from 'primereact/card';
import { MultiSelect } from 'primereact/multiselect';
import { useProject } from '@/contexts/ProjectContext';

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

    // Delete FormSet
    const handleDelete = (formSet: FormSet) => {
        confirmDialog({
            message: `Möchten Sie das FormSet "${formSet.name}" wirklich löschen? Alle Fenster und Elemente werden ebenfalls gelöscht.`,
            header: 'FormSet löschen',
            icon: 'pi pi-exclamation-triangle',
            acceptClassName: 'p-button-danger',
            acceptLabel: 'Ja, löschen',
            rejectLabel: 'Abbrechen',
            accept: async () => {
                try {
                    const response = await fetch(`/api/form-sets/${formSet.id}`, {
                        method: 'DELETE',
                        headers: getAuthHeaders(),
                    });
                    if (response.ok) {
                        toast.showSuccess('FormSet erfolgreich gelöscht');
                        loadMyFormSets();
                    } else {
                        toast.showError('Fehler beim Löschen');
                    }
                } catch (error) {
                    console.error('Error deleting FormSet:', error);
                    toast.showError('Netzwerkfehler beim Löschen');
                }
            },
        });
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
        const colors: Record<string, string> = {
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
            <span className={`px-2 py-1 ${colors[formSet.visibility] || 'bg-gray-500'} text-white rounded text-xs`}>
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
        <div className="p-4 h-full overflow-auto bg-gray-800">
            <ConfirmDialog />

            {/* MY FORMSETS TABLE */}
            <Card title="Meine FormSets" className="mb-4">
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
            <Card title="System & Öffentliche FormSets" className="mb-4">
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
                contentStyle={{ backgroundColor: '#1f2937', color: 'white' }}
                headerStyle={{ backgroundColor: '#111827', color: 'white', border: 'none' }}
            >
                <div className="space-y-4">
                    <p className="text-gray-300 text-sm">
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
                    />

                    <div className="flex justify-end gap-2 pt-4 border-t border-gray-700">
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
        </div>
    );
};

export default FormSetManagementPanel;
