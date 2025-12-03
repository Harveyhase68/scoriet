import React, { useState, useEffect, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Dialog } from 'primereact/dialog';
import { MultiSelect } from 'primereact/multiselect';
import { FileUpload } from 'primereact/fileupload';
import { useToast } from '@/contexts/ToastContext';
import { apiClient as api } from '@/lib/api';
import { TabContentProps } from '@/types';
import { useProject } from '@/contexts/ProjectContext';
import { useTranslation, SupportedLanguage, getStoredLanguage } from '@/i18n';
import TemplateModal from './TemplateModal';
//import FileModal from './FileModal';
//import VariableModal from './VariableModal';

const TabContent: React.FC<TabContentProps> = ({ children, style = {}, ...rest }) => {
  const ref = useRef<HTMLDivElement>(null);
  const setFocus = () => ref.current?.focus();

  return (
    <div
      {...rest}
      ref={ref}
      tabIndex={-1}
      style={{ flex: 1, padding: '5px 10px', ...style }}
      onMouseDownCapture={setFocus}
      onTouchStartCapture={setFocus}
      className="bg-gray-800 text-gray-100"
    >
      {children}
    </div>
  );
};

interface Template {
    id: number;
    name: string;
    full_name?: string;
    description?: string;
    category: string;
    language: string;
    is_active: boolean;
    tags: string[];
    file_count: number;
    created_at: string;
    creator_user_id: number;
    visibility: 'public' | 'private';
    is_system_template: boolean;
    template_type: 'original' | 'cloned' | 'linked';
    original_template_id?: number;
    history?: {
        original_creator_id: number;
        original_created_at: string;
        forks: Array<{
            user_id: number;
            forked_at: string;
            published_at: string;
            changes_description?: string;
        }>;
    };
    community_rating?: {
        total_reviews: number;
        positive: number;
        negative: number;
        warnings: string[];
        last_reviewed_at: string | null;
    };
    linked_projects?: number[]; // Project IDs this template is linked to
    files?: TemplateFile[];
}

interface TemplateFile {
    id: number;
    file_name: string;
    file_path: string;
    output_path: string;
    file_content: string;
    file_type: string;
    file_order: number;
}

/*interface TemplateVariable {
    id?: number;
    variable_name: string;
    description: string | null;
    default_value: string | null;
    is_required: boolean;
}
*/

interface Project {
    id: number;
    name: string;
}

const TemplateManagementPanel: React.FC = () => {
    const [currentLanguage] = React.useState<SupportedLanguage>(getStoredLanguage());
    const { t } = useTranslation(currentLanguage);
    const { selectedProject } = useProject();
    const toast = useToast();

    // State for My Templates (upper table)
    const [myTemplates, setMyTemplates] = useState<Template[]>([]);
    const [myTemplatesLoading, setMyTemplatesLoading] = useState(false);

    // State for Community Templates (lower table)
    const [communityTemplates, setCommunityTemplates] = useState<Template[]>([]);
    const [communityTemplatesLoading, setCommunityTemplatesLoading] = useState(false);

    // Filters for Community Templates
    const [communitySearch, setCommunitySearch] = useState('');
    const [communityTypeFilter, setCommunityTypeFilter] = useState<string>('all'); // 'all', 'system', 'community'
    const [communityLanguageFilter, setCommunityLanguageFilter] = useState<string>('all');
    const [communityCategoryFilter, setCommunityCategoryFilter] = useState<string>('all');

    // Available projects for linking/unlinking
    const [availableProjects, setAvailableProjects] = useState<Project[]>([]);

    // Modals
    const [linkModalVisible, setLinkModalVisible] = useState(false);
    const [unlinkModalVisible, setUnlinkModalVisible] = useState(false);
    const [cloneModalVisible, setCloneModalVisible] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [importModalVisible, setImportModalVisible] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
    const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
    const [selectedProjects, setSelectedProjects] = useState<number[]>([]);
    const [cloneName, setCloneName] = useState('');
    const [templateFiles, setTemplateFiles] = useState<TemplateFile[]>([]);

    // Load data on mount
    useEffect(() => {
        loadMyTemplates();
        loadCommunityTemplates();
        loadAvailableProjects();
    }, []);

    // Load user's own templates
    const loadMyTemplates = async () => {
        setMyTemplatesLoading(true);
        try {
            // Temporarily use the old endpoint until new ones are ready
            const response = await api.get('/api/templates');
            const allTemplates = response.data.data || response.data || [];

            // Filter to only show user's own templates
            const userId = parseInt(localStorage.getItem('user_id') || '0');
            const myOwnTemplates = allTemplates.filter((t: Template) =>
                t.creator_user_id === userId && !t.is_system_template
            );

            setMyTemplates(myOwnTemplates);
        } catch (error: any) {
            console.error('Failed to load my templates:', error);
            setMyTemplates([]);
        } finally {
            setMyTemplatesLoading(false);
        }
    };

    // Load system and community templates
    const loadCommunityTemplates = async () => {
        setCommunityTemplatesLoading(true);
        try {
            // Temporarily use the old endpoint until new ones are ready
            const response = await api.get('/api/templates');
            const allTemplates = response.data.data || response.data || [];

            // Filter to show system templates and public templates from other users
            const userId = parseInt(localStorage.getItem('user_id') || '0');
            let filteredTemplates = allTemplates.filter((t: Template) =>
                t.is_system_template || (t.visibility === 'public' && t.creator_user_id !== userId)
            );

            // Apply filters
            if (communityTypeFilter === 'system') {
                filteredTemplates = filteredTemplates.filter((t: Template) => t.is_system_template);
            } else if (communityTypeFilter === 'community') {
                filteredTemplates = filteredTemplates.filter((t: Template) => !t.is_system_template);
            }

            if (communityLanguageFilter !== 'all') {
                filteredTemplates = filteredTemplates.filter((t: Template) => t.language === communityLanguageFilter);
            }

            if (communityCategoryFilter !== 'all') {
                filteredTemplates = filteredTemplates.filter((t: Template) => t.category === communityCategoryFilter);
            }

            if (communitySearch) {
                const search = communitySearch.toLowerCase();
                filteredTemplates = filteredTemplates.filter((t: Template) =>
                    t.name?.toLowerCase().includes(search) ||
                    t.description?.toLowerCase().includes(search)
                );
            }

            setCommunityTemplates(filteredTemplates);
        } catch (error: any) {
            console.error('Failed to load community templates:', error);
            setCommunityTemplates([]);
        } finally {
            setCommunityTemplatesLoading(false);
        }
    };

    // Load available projects
    const loadAvailableProjects = async () => {
        try {
            const response = await api.get('/api/projects');
            setAvailableProjects(response.data.data || []);
        } catch (error: any) {
            console.error('Failed to load projects:', error);
        }
    };

    // Reload community templates when filters change
    useEffect(() => {
        loadCommunityTemplates();
    }, [communityTypeFilter, communityLanguageFilter, communityCategoryFilter, communitySearch]);

    // Create new template
    const handleCreate = () => {
        setEditingTemplate(null);
        setTemplateFiles([]);
        setModalVisible(true);
    };

    // Edit template
    const handleEdit = async (template: Template) => {
        setEditingTemplate(template);

        // Load template files if editing
        if (template.id) {
            try {
                const response = await api.get(`/api/templates/${template.id}`);
                if (response.data) {
                    const files = response.data.files || [];
                    const filesWithOutputPath = files.map((file: TemplateFile) => ({
                        ...file,
                        output_path: file.output_path || '/'
                    }));
                    setTemplateFiles(filesWithOutputPath);
                } else {
                    setTemplateFiles([]);
                }
            } catch {
                setTemplateFiles([]);
            }
        } else {
            setTemplateFiles([]);
        }
        setModalVisible(true);
    };

    // Handle import
    const handleImport = async (event: any) => {
        const file = event.files[0];
        const filename = file.name.toLowerCase();

        // Check if it's a JSON file
        if (filename.endsWith('.json')) {
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const templateData = JSON.parse(e.target?.result as string);
                    const response = await api.post('/api/templates/import', templateData);

                    if (response.data.success) {
                        toast.success('Template erfolgreich importiert');
                        loadMyTemplates();
                        setImportModalVisible(false);
                    } else {
                        toast.error(response.data.error || 'Import fehlgeschlagen');
                    }
                } catch (error: any) {
                    toast.error('Fehler beim Importieren: ' + error.message);
                }
            };
            reader.readAsText(file);
        } else {
            toast.error('Nur JSON-Dateien werden unterstützt');
        }
    };

    // Clone template
    const handleClone = async (template: Template) => {
        if (!selectedProject) {
            toast.error('Please select a project first');
            return;
        }

        setSelectedTemplate(template);
        setCloneName(template.name + '_copy');
        setCloneModalVisible(true);
    };

    const confirmClone = async () => {
        if (!selectedTemplate || !selectedProject) return;

        try {
            await api.post(`/api/templates/${selectedTemplate.id}/clone`, {
                project_id: selectedProject.id,
                new_name: cloneName,
                visibility: 'public'
            });
            toast.success('Template cloned successfully');
            setCloneModalVisible(false);
            loadMyTemplates();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to clone template');
        }
    };

    // Link template to projects
    const handleLink = (template: Template) => {
        setSelectedTemplate(template);
        setSelectedProjects([]);
        setLinkModalVisible(true);
    };

    const confirmLink = async () => {
        if (!selectedTemplate || selectedProjects.length === 0) {
            toast.error('Please select at least one project');
            return;
        }

        try {
            await api.post(`/api/templates/${selectedTemplate.id}/link`, {
                project_ids: selectedProjects
            });
            toast.success('Template linked successfully');
            setLinkModalVisible(false);
            loadMyTemplates();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to link template');
        }
    };

    // Unlink template from projects
    const handleUnlink = (template: Template) => {
        setSelectedTemplate(template);
        // Pre-select projects that this template is already linked to
        setSelectedProjects(template.linked_projects || []);
        setUnlinkModalVisible(true);
    };

    const confirmUnlink = async () => {
        if (!selectedTemplate || selectedProjects.length === 0) {
            toast.error('Please select at least one project');
            return;
        }

        try {
            await api.post(`/api/templates/${selectedTemplate.id}/unlink`, {
                project_ids: selectedProjects
            });
            toast.success('Template unlinked successfully');
            setUnlinkModalVisible(false);
            loadMyTemplates();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to unlink template');
        }
    };

    // Template action buttons for My Templates
    const myTemplatesActionsTemplate = (rowData: Template) => {
        const isLinked = rowData.linked_projects && rowData.linked_projects.length > 0;

        return (
            <div className="flex gap-2">
                <Button
                    icon="pi pi-pencil"
                    className="p-button-sm p-button-info"
                    tooltip="Edit"
                    onClick={() => handleEdit(rowData)}
                />
                <Button
                    icon="pi pi-link"
                    className="p-button-sm p-button-success"
                    tooltip="Link to Project"
                    onClick={() => handleLink(rowData)}
                />
                <Button
                    icon="pi pi-link"
                    className={`p-button-sm ${!isLinked ? 'p-button-secondary opacity-50' : 'p-button-warning'}`}
                    tooltip="Unlink from Project"
                    onClick={() => handleUnlink(rowData)}
                    disabled={!isLinked}
                />
                <Button
                    icon="pi pi-trash"
                    className="p-button-sm p-button-danger"
                    tooltip="Delete"
                    onClick={() => {/* TODO: Implement delete */}}
                />
            </div>
        );
    };

    // Template action buttons for Community Templates
    const communityTemplatesActionsTemplate = (rowData: Template) => {
        // Check if already cloned
        const isAlreadyCloned = myTemplates.some(t => t.original_template_id === rowData.id);
        // Check if already linked
        const isAlreadyLinked = myTemplates.some(t => t.id === rowData.id && t.linked_projects && t.linked_projects.length > 0);

        return (
            <div className="flex gap-2">
                <Button
                    icon="pi pi-copy"
                    className={`p-button-sm ${isAlreadyCloned ? 'p-button-secondary opacity-50' : 'p-button-info'}`}
                    tooltip={isAlreadyCloned ? "Already Cloned" : "Clone"}
                    onClick={() => handleClone(rowData)}
                    disabled={isAlreadyCloned}
                />
                <Button
                    icon="pi pi-link"
                    className={`p-button-sm ${isAlreadyLinked ? 'p-button-secondary opacity-50' : 'p-button-success'}`}
                    tooltip={isAlreadyLinked ? "Already Linked" : "Link to Project"}
                    onClick={() => handleLink(rowData)}
                    disabled={isAlreadyLinked}
                />
            </div>
        );
    };

    // Template type badge
    const typeBodyTemplate = (rowData: Template) => {
        const typeMap: { [key: string]: { label: string; severity: "success" | "info" | "warning" | "danger" | undefined } } = {
            original: { label: 'Original', severity: 'success' },
            cloned: { label: 'Cloned', severity: 'info' },
            linked: { label: 'Linked', severity: 'warning' }
        };
        const type = typeMap[rowData.template_type] || { label: rowData.template_type, severity: undefined };
        return <Tag value={type.label} severity={type.severity} />;
    };

    // Community rating badges
    const ratingBodyTemplate = (rowData: Template) => {
        const rating = rowData.community_rating;
        if (!rating) return null;

        const isCommunityVerified = (rating.positive || 0) >= 5;
        const hasWarning = (rating.negative || 0) >= 5;

        return (
            <div className="flex gap-1">
                {isCommunityVerified && <Tag value="Verified" severity="success" icon="pi pi-check" />}
                {hasWarning && <Tag value="Warning" severity="danger" icon="pi pi-exclamation-triangle" />}
            </div>
        );
    };

    // Get unique values for filters
    const uniqueLanguages = Array.from(new Set((communityTemplates || []).map(t => t.language).filter(Boolean)));
    const uniqueCategories = Array.from(new Set((communityTemplates || []).map(t => t.category).filter(Boolean)));

    return (
        <TabContent>
            <div className="flex flex-col h-full gap-4">
                {/* Header with Title and Action Buttons */}
                <div className="flex justify-between items-center mb-2">
                    <h2 className="text-xl font-bold text-white">{t.panelsewnavigationpanel188 || 'Template Verwaltung'}</h2>
                    <div className="flex gap-2">
                        <Button
                            label={t.templatemanagementpanel283 || '+ Neues Template'}
                            icon="pi pi-plus"
                            className="p-button-success p-button-sm"
                            onClick={handleCreate}
                        />
                        <Button
                            label={t.templatemanagementpanel288 || 'Import'}
                            icon="pi pi-upload"
                            className="p-button-info p-button-sm"
                            onClick={() => setImportModalVisible(true)}
                        />
                    </div>
                </div>

                {/* My Templates Table */}
                <div className="flex-1 flex flex-col" style={{ minHeight: '300px', maxHeight: '40%' }}>
                    <h3 className="text-lg font-bold mb-2">My Templates</h3>
                    <DataTable
                        value={myTemplates}
                        loading={myTemplatesLoading}
                        paginator
                        rows={5}
                        rowsPerPageOptions={[5, 10, 25]}
                        className="flex-1"
                        emptyMessage="No templates found"
                        size="small"
                    >
                        <Column field="name" header="Name" sortable />
                        <Column field="description" header="Description" />
                        <Column field="language" header="Language" sortable />
                        <Column field="category" header="Category" sortable />
                        <Column field="template_type" header="Type" body={typeBodyTemplate} sortable />
                        <Column field="file_count" header="Files" sortable />
                        <Column header="Actions" body={myTemplatesActionsTemplate} style={{ width: '200px' }} />
                    </DataTable>
                </div>

                {/* System & Community Templates Table */}
                <div className="flex-1 flex flex-col">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="text-lg font-bold">System & Community Templates</h3>
                        <div className="flex gap-2">
                            <Dropdown
                                value={communityTypeFilter}
                                options={[
                                    { label: 'All', value: 'all' },
                                    { label: 'System', value: 'system' },
                                    { label: 'Community', value: 'community' }
                                ]}
                                onChange={(e) => setCommunityTypeFilter(e.value)}
                                placeholder="Type"
                                className="w-32"
                            />
                            <Dropdown
                                value={communityLanguageFilter}
                                options={[{ label: 'All Languages', value: 'all' }, ...uniqueLanguages.map(l => ({ label: l, value: l }))]}
                                onChange={(e) => setCommunityLanguageFilter(e.value)}
                                placeholder="Language"
                                className="w-40"
                            />
                            <Dropdown
                                value={communityCategoryFilter}
                                options={[{ label: 'All Categories', value: 'all' }, ...uniqueCategories.map(c => ({ label: c, value: c }))]}
                                onChange={(e) => setCommunityCategoryFilter(e.value)}
                                placeholder="Category"
                                className="w-40"
                            />
                            <InputText
                                value={communitySearch}
                                onChange={(e) => setCommunitySearch(e.target.value)}
                                placeholder="Search..."
                                className="w-48"
                            />
                        </div>
                    </div>
                    <DataTable
                        value={communityTemplates}
                        loading={communityTemplatesLoading}
                        paginator
                        rows={10}
                        rowsPerPageOptions={[10, 25, 50]}
                        className="flex-1"
                        emptyMessage="No templates found"
                        size="small"
                    >
                        <Column field="name" header="Name" sortable />
                        <Column field="description" header="Description" />
                        <Column field="language" header="Language" sortable />
                        <Column field="category" header="Category" sortable />
                        <Column header="Rating" body={ratingBodyTemplate} />
                        <Column field="file_count" header="Files" sortable />
                        <Column header="Actions" body={communityTemplatesActionsTemplate} style={{ width: '150px' }} />
                    </DataTable>
                </div>
            </div>

            {/* Clone Modal */}
            <Dialog
                header="Clone Template"
                visible={cloneModalVisible}
                style={{ width: '450px' }}
                onHide={() => setCloneModalVisible(false)}
            >
                <div className="flex flex-col gap-4">
                    <div>
                        <label htmlFor="cloneName" className="block mb-2">New Template Name</label>
                        <InputText
                            id="cloneName"
                            value={cloneName}
                            onChange={(e) => setCloneName(e.target.value)}
                            className="w-full"
                        />
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button label="Cancel" className="p-button-secondary" onClick={() => setCloneModalVisible(false)} />
                        <Button label="Clone" onClick={confirmClone} />
                    </div>
                </div>
            </Dialog>

            {/* Link Modal */}
            <Dialog
                header="Link Template to Projects"
                visible={linkModalVisible}
                style={{ width: '450px' }}
                onHide={() => setLinkModalVisible(false)}
            >
                <div className="flex flex-col gap-4">
                    <div>
                        <label htmlFor="projects" className="block mb-2">Select Projects</label>
                        <MultiSelect
                            id="projects"
                            value={selectedProjects}
                            options={availableProjects.map(p => ({ label: p.name, value: p.id }))}
                            onChange={(e) => setSelectedProjects(e.value)}
                            placeholder="Select projects"
                            className="w-full"
                        />
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button label="Cancel" className="p-button-secondary" onClick={() => setLinkModalVisible(false)} />
                        <Button label="Link" onClick={confirmLink} />
                    </div>
                </div>
            </Dialog>

            {/* Unlink Modal */}
            <Dialog
                header="Unlink Template from Projects"
                visible={unlinkModalVisible}
                style={{ width: '450px' }}
                onHide={() => setUnlinkModalVisible(false)}
            >
                <div className="flex flex-col gap-4">
                    <div>
                        <label htmlFor="unlinkProjects" className="block mb-2">Select Projects to Unlink</label>
                        <MultiSelect
                            id="unlinkProjects"
                            value={selectedProjects}
                            options={availableProjects
                                .filter(p => selectedTemplate?.linked_projects?.includes(p.id))
                                .map(p => ({ label: p.name, value: p.id }))}
                            onChange={(e) => setSelectedProjects(e.value)}
                            placeholder="Select projects"
                            className="w-full"
                        />
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button label="Cancel" className="p-button-secondary" onClick={() => setUnlinkModalVisible(false)} />
                        <Button label="Unlink" onClick={confirmUnlink} className="p-button-warning" />
                    </div>
                </div>
            </Dialog>

            {/* Template Create/Edit Modal */}
            {modalVisible && (
                <TemplateModal
                    visible={modalVisible}
                    onCancel={() => setModalVisible(false)}
                    onSubmit={async () => {
                        // Handle submit logic
                        setModalVisible(false);
                        loadMyTemplates();
                    }}
                    editingTemplate={editingTemplate}
                    categories={[]}
                    templateFiles={templateFiles || []}
                    onCreateFile={() => {}}
                    onEditFile={(_file: any) => {}}
                    onDeleteFile={(_index: number) => {}}
                    fileTypes={[]}
                    templateVariables={[]}
                />
            )}

            {/* Import Template Modal */}
            <Dialog
                header="Template importieren"
                visible={importModalVisible}
                style={{ width: '500px' }}
                onHide={() => setImportModalVisible(false)}
            >
                <div className="flex flex-col gap-4">
                    <p className="text-sm text-gray-300">Wählen Sie eine JSON-Datei zum Importieren:</p>
                    <FileUpload
                        mode="basic"
                        name="template"
                        accept=".json"
                        maxFileSize={10000000}
                        customUpload
                        uploadHandler={handleImport}
                        auto
                        chooseLabel="Datei auswählen"
                    />
                    <div className="flex justify-end gap-2">
                        <Button label="Abbrechen" className="p-button-secondary" onClick={() => setImportModalVisible(false)} />
                    </div>
                </div>
            </Dialog>
        </TabContent>
    );
};

export default TemplateManagementPanel;
