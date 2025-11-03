import React, { useState, useEffect, useRef } from 'react';
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
import { apiClient as api } from '@/lib/api';
import { TabContentProps } from '@/types';
import { useProject } from '@/contexts/ProjectContext';
import FileModal from './FileModal';
import TemplateModal from './TemplateModal';
import VariableModal from './VariableModal';
import { useTranslation, SupportedLanguage, getStoredLanguage } from '@/i18n';

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

interface TemplateVariable {
    id?: number;
    variable_name: string;
    description: string | null;
    default_value: string | null;
    is_required: boolean;
}

interface TemplateManagementPanelProps {
    filterByProject?: boolean; // Explicit flag to control project filtering
    forceProjectId?: number; // Force a specific project ID (overrides selectedProject)
    forceProjectName?: string; // Force a specific project name for the title
    updateTabTitle?: (newTitle: string) => void; // Callback to update tab title
}

const TemplateManagementPanel: React.FC<TemplateManagementPanelProps> = ({ filterByProject = false, forceProjectId, forceProjectName, updateTabTitle }) => {
    // i18n setup
    const [currentLanguage] = React.useState<SupportedLanguage>(getStoredLanguage());
    const { t } = useTranslation(currentLanguage);

    // Use Project Context to get current project
    const { selectedProject } = useProject();
    const toast = useToast();
    // Only use project filtering if explicitly requested (Quick Actions)
    // If forceProjectId is provided, use that instead of selectedProject
    const projectId = filterByProject ? (forceProjectId || selectedProject?.id) : undefined;
    // Using centralized CSS styles from auth-modals.css

    // Get current user ID and type for permission checks
    const currentUserId = parseInt(localStorage.getItem('user_id') || '0');
    const userType = localStorage.getItem('user_type') || 'free';

    // State variables
    const [templates, setTemplates] = useState<Template[]>([]);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [viewModalVisible, setViewModalVisible] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
    const [viewingTemplate, setViewingTemplate] = useState<Template | null>(null);
    const [templateFiles, setTemplateFiles] = useState<TemplateFile[]>([]);
    const [fileModalVisible, setFileModalVisible] = useState(false);
    const [editingFile, setEditingFile] = useState<TemplateFile | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState(t.templatecontroller22);
    const [cloneModalVisible, setCloneModalVisible] = useState(false);
    const [templateToClone, setTemplateToClone] = useState<Template | null>(null);
    const [cloneName, setCloneName] = useState('');
    const [cloneVisibility, setCloneVisibility] = useState<'public' | 'private'>('public');
    const [nameCheckLoading, setNameCheckLoading] = useState(false);
    const [nameExists, setNameExists] = useState(false);
    const [templateVariables, setTemplateVariables] = useState<TemplateVariable[]>([]);
    const [variableModalVisible, setVariableModalVisible] = useState(false);
    const [editingVariable, setEditingVariable] = useState<TemplateVariable | null>(null);

    // Track if we should use forceProjectName (don't change title on selectedProject changes)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const useForceProjectName = useRef(!!forceProjectName);

    // Forms are now handled by separate modal components

    // No need to inject styles - using centralized CSS
    // Ant Design React 19 warnings are handled by @ant-design/v5-patch-for-react-19

    const categories = [t.templatecontroller22, t.panelt3296, t.panelt3297, t.panelt3298, t.panelt3299, t.panelsewnavigationpanel223];
    const fileTypes = [
        { label: t.templatemanagementpanel115, value: 'static_file', description: 'Single static file (e.g. config.json)' },
        { label: 'Static Directory (.zip)', value: 'static_directory', description: t.templatemanagementpanel116 },
        { label: 'Project File', value: 'project_file', description: t.templatemanagementpanel117 },
        { label: t.templatemanagementpanel118, value: 'db_table_file', description: 'File per database table (model, controller, etc.)' },
        { label: 'Project File (Languages)', value: 'project_file_languages', description: t.templatemanagementpanel119 },
        { label: 'DB Table File (Languages)', value: 'db_table_file_languages', description: t.templatemanagementpanel120 }
    ];

    useEffect(() => {
        loadTemplates();
         
    }, [searchTerm, categoryFilter, projectId]);

    // Update tab title with forceProjectName (when set from Quick Actions or tree view - fixed title with project name)
    useEffect(() => {
        if (filterByProject && updateTabTitle && forceProjectName) {
            updateTabTitle(`Template Management: ${forceProjectName}`);
        }
    }, [filterByProject, updateTabTitle, forceProjectName]);

    // No dynamic title updates for menu call - title stays as t.panelsewnavigationpanel188 (all templates)


    const loadTemplates = async () => {
        setLoading(true);
        try {
            const templates = await api.getAllTemplates({
                category: categoryFilter,
                search: searchTerm,
                active_only: false,
                project_id: projectId
            });
            setTemplates(templates);
        } catch {
            // Error loading templates
            toast.showError(t.templatemanagementpanel150);
            setTemplates([]);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = () => {
        setEditingTemplate(null);
        setTemplateFiles([]);
        setModalVisible(true);
    };

    const handleEdit = async (template: Template) => {
        setEditingTemplate(template);
        
        // Load template files if editing
        if (template.id) {
            try {
                const response = await api.getTemplate(template.id);
                if (response.success) {
                    // Ensure output_path is properly set for each file
                    const files = response.template.files || [];
                    const filesWithOutputPath = files.map((file: TemplateFile) => ({
                        ...file,
                        output_path: file.output_path || '/'
                    }));
                    setTemplateFiles(filesWithOutputPath);
                } else {
                    setTemplateFiles([]);
                }
            } catch {
                // Error loading template files
                setTemplateFiles([]);
            }
        } else {
            // New template - start with empty files
            setTemplateFiles([]);
        }
        
        setModalVisible(true);
    };

    const handleView = async (template: Template) => {
        try {
            const response = await api.getTemplate(template.id);
            if (response.success) {
                setViewingTemplate(response.template);
                setViewModalVisible(true);
            }
        } catch {
            // Error loading template details
            toast.showError(t.templatemanagementpanel202);
        }
    };


    const handleHardDelete = async (id: number) => {
        try {
            const response = await api.hardDeleteTemplate(id);
            if (response.success) {
                toast.showSuccess('Template endgültig gelöscht');
                loadTemplates();
            }
        } catch {
            // Error hard deleting template
            toast.showError(t.templatemanagementpanel216);
        }
    };

    const handleToggleActive = async (template: Template) => {
        try {
            const response = await api.toggleTemplateActive(template.id);
            if (response.success) {
                const newStatus = response.is_active ? 'aktiviert' : 'deaktiviert';
                toast.showSuccess(`Template ${newStatus}`);
                loadTemplates();
            }
        } catch {
            // Error toggling template status
            toast.showError(t.templatemanagementpanel230);
        }
    };

    const handleClone = (template: Template) => {
        setTemplateToClone(template);
        setCloneName(template.name);
        setCloneVisibility('public');
        setNameExists(false);
        setCloneModalVisible(true);

        // Sofort beim Öffnen prüfen ob der Name schon existiert
        setTimeout(() => {
            checkNameExists(template.name);
        }, 100);
    };

    const checkNameExists = async (name: string) => {
        if (!name.trim()) {
            setNameExists(false);
            return;
        }

        setNameCheckLoading(true);
        try {
            const response = await api.checkTemplateName(name);
            setNameExists(response.exists);
        } catch {
            setNameExists(false);
        } finally {
            setNameCheckLoading(false);
        }
    };

    const handleCloneNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newName = e.target.value;
        setCloneName(newName);

        // Debounce name check
        setTimeout(() => {
            checkNameExists(newName);
        }, 500);
    };

    const handleCloneSubmit = async () => {
        if (!templateToClone || nameExists || !cloneName.trim()) {
            return;
        }

        try {
            const response = await api.cloneTemplate(templateToClone.id, {
                name: cloneName,
                visibility: cloneVisibility
            });

            if (response.success) {
                toast.showSuccess(t.templatecontroller649);
                setCloneModalVisible(false);
                loadTemplates();
            }
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || t.templatemanagementpanel291;
            toast.showError(errorMessage);
        }
    };

    const handleSubmit = async (values: any) => {
        try {
            const templateData = {
                name: values.name,
                description: values.description,
                category: values.category,
                language: values.language,
                tags: values.tags || [],
                is_active: values.is_active !== false,
                visibility: values.visibility || 'public',
                is_system_template: values.is_system_template || false,
                files: templateFiles.map((file, index) => ({
                    file_name: file.file_name,
                    file_content: file.file_content,
                    file_type: file.file_type,
                    file_order: index,
                    output_path: file.output_path || '/'
                }))
            };

            let response;
            if (editingTemplate) {
                response = await api.updateTemplate(editingTemplate.id, templateData);
            } else {
                response = await api.createTemplate(templateData);
            }

            if (response.success) {
                toast.showSuccess(`Template erfolgreich ${editingTemplate ? 'aktualisiert' : 'erstellt'}`);

                // 🛡️ Check for security scanner warning
                if (response.template?.auto_set_to_private) {
                    setTimeout(() => {
                        let warningMessage = response.template.warning || 'Template unusual content detected, switching back to private.';
                        if (response.template.detected_issues) {
                            warningMessage += '\n\nDetected: ' + response.template.detected_issues;
                        }
                        toast.showWarn(warningMessage);
                    }, 800); // 800ms delay so it shows AFTER success toast
                }

                setModalVisible(false);
                setTemplateFiles([]);

                // Small delay to ensure DB transaction is complete
                setTimeout(() => {
                    loadTemplates();
                }, 500);
            }
        } catch (error: any) {
            // Template submission error
            const errorMessage = error.response?.data?.error || error.response?.data?.message || `Fehler beim ${editingTemplate ? t.applicationsmodal313 : t.teammodal240} des Templates`;
            toast.showError(errorMessage);
        }
    };

    // Separate save function for t.cmsadminpanel279 button - saves template and transitions to edit mode
    const handleSave = async (values: any) => {
        try {
            const templateData = {
                name: values.name,
                description: values.description || '',
                category: values.category,
                language: values.language,
                tags: values.tags || [],
                is_active: values.is_active,
                visibility: values.visibility || 'public',
                is_system_template: values.is_system_template || false,
                files: [] // No files when just saving for the first time
            };

            // Create the template
            const response = await api.createTemplate(templateData);

            if (response.success) {
                toast.showSuccess(t.templatemanagementpanel359);

                // 🛡️ Check for security scanner warning
                if (response.template?.auto_set_to_private) {
                    setTimeout(() => {
                        let warningMessage = response.template.warning || 'Template unusual content detected, switching back to private.';
                        if (response.template.detected_issues) {
                            warningMessage += '\n\nDetected: ' + response.template.detected_issues;
                        }
                        toast.showWarn(warningMessage);
                    }, 800); // 800ms delay
                }

                // Close the create modal
                setModalVisible(false);
                setTemplateFiles([]);

                // Load the newly created template and open edit modal
                setTimeout(async () => {
                    await loadTemplates();

                    // Find the newly created template by ID
                    const newTemplate = response.template;
                    if (newTemplate) {
                        // Open edit modal with the new template
                        setEditingTemplate(newTemplate);
                        setModalVisible(true);

                        // Load template files for the new template
                        try {
                            const templateResponse = await api.getTemplate(newTemplate.id);
                            if (templateResponse.success) {
                                // Ensure output_path is properly set for each file
                                const files = templateResponse.template.files || [];
                                const filesWithOutputPath = files.map((file: TemplateFile) => ({
                                    ...file,
                                    output_path: file.output_path || '/'
                                }));
                                setTemplateFiles(filesWithOutputPath);
                            }
                        } catch {
                            // Files loading error - not critical
                        }
                    }
                }, 300);
            }
        } catch (error: any) {
            const errorMessage = error.response?.data?.error || error.response?.data?.message || t.templatemanagementpanel395;
            toast.showError(errorMessage);
        }
    };

    const handleImport = (file: File) => {
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const templateData = JSON.parse(e.target?.result as string);
                
                // Use the new import API endpoint
                const response = await api.importTemplate(templateData, false);
                
                if (response.success) {
                    toast.showSuccess(t.templatemanagementpanel410);
                    loadTemplates();
                } else {
                    toast.showError(response.error || t.templatemanagementpanel413);
                }
            } catch (error: any) {
                if (error.response?.status === 409) {
                    // Template already exists
                    confirmDialog({
                        message: t.templatemanagementpanel419,
                        header: t.templatemanagementpanel420,
                        icon: 'pi pi-exclamation-triangle',
                        accept: async () => {
                            try {
                                const templateData = JSON.parse(e.target?.result as string);
                                const response = await api.importTemplate(templateData, true);

                                if (response.success) {
                                    toast.showSuccess(t.templatemanagementpanel428);
                                    loadTemplates();
                                }
                            } catch {
                                // Error overwriting template
                                toast.showError(t.templatemanagementpanel433);
                            }
                        },
                        acceptLabel: 'Ja, überschreiben',
                        rejectLabel: t.templatefilemanager361,
                        acceptClassName: 'p-button-danger'
                    });
                } else {
                    toast.showError(t.templatemanagementpanel413);
                    // Import error
                }
            }
        };
        reader.readAsText(file);
        return false;
    };

    const handleExport = async (template: Template) => {
        try {
            const response = await api.exportTemplate(template.id);
            if (response.success) {
                const dataStr = JSON.stringify(response.export_data, null, 2);
                const dataBlob = new Blob([dataStr], { type: 'application/json' });
                const url = URL.createObjectURL(dataBlob);
                const link = document.createElement('a');
                link.href = url;
                link.download = response.filename || `${template.name.replace(/\s+/g, '_')}_template.json`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
                toast.showSuccess(t.templatemanagementpanel464);
            }
        } catch {
            toast.showError(t.templatemanagementpanel467);
            // Export error
        }
    };

    // File management functions
    const handleCreateFile = () => {
        setEditingFile(null);
        setFileModalVisible(true);
    };

    const handleEditFile = (file: TemplateFile) => {
        setEditingFile(file);
        setFileModalVisible(true);
    };

    const handleDeleteFile = async (index: number) => {
        if (!editingTemplate) {
            toast.showError(t.templatemanagementpanel485);
            return;
        }

        const fileToDelete = templateFiles[index];
        const newFiles = templateFiles.filter((_, i) => i !== index);

        try {
            // Save template immediately with deleted file removed
            const templateData = {
                name: editingTemplate.name,
                description: editingTemplate.description,
                category: editingTemplate.category,
                language: editingTemplate.language,
                tags: editingTemplate.tags || [],
                is_active: editingTemplate.is_active !== false,
                files: newFiles.map(f => ({
                    file_name: f.file_name,
                    file_content: f.file_content,
                    file_type: f.file_type,
                    file_order: f.file_order,
                    output_path: f.output_path || '/'
                }))
            };

            const response = await api.updateTemplate(editingTemplate.id, templateData);

            if (response.success) {
                // Update local state
                setTemplateFiles(newFiles);
                toast.showSuccess(`Datei "${fileToDelete.file_name}" erfolgreich gelöscht`);

                // 🛡️ Check for security scanner warning
                if (response.template?.auto_set_to_private) {
                    setTimeout(() => {
                        let warningMessage = response.template.warning || 'Template unusual content detected, switching back to private.';
                        if (response.template.detected_issues) {
                            warningMessage += '\n\nDetected: ' + response.template.detected_issues;
                        }
                        toast.showWarn(warningMessage);
                    }, 800); // 800ms delay
                }
            } else {
                toast.showError(t.templatefilemanager120);
            }
        } catch (error: any) {
            // File delete error
            toast.showError('Fehler beim Löschen der Datei: ' + (error.response?.data?.message || error.message));
        }
    };

    const handleFileSubmit = async (values: any) => {
        if (!editingTemplate) {
            toast.showError(t.templatemanagementpanel485);
            return;
        }

        const fileData = {
            file_name: values.file_name,
            file_content: values.file_content,
            file_type: values.file_type,
            file_order: values.file_order || templateFiles.length,
            output_path: values.output_path || '/',
        };

        try {
            // Save file immediately to the template via API
            const templateData = {
                name: editingTemplate.name,
                description: editingTemplate.description,
                category: editingTemplate.category,
                language: editingTemplate.language,
                tags: editingTemplate.tags || [],
                is_active: editingTemplate.is_active !== false,
                files: editingFile 
                    ? templateFiles.map(f => 
                        f.id === editingFile.id 
                            ? { ...fileData, file_order: f.file_order }
                            : {
                                file_name: f.file_name,
                                file_content: f.file_content,
                                file_type: f.file_type,
                                file_order: f.file_order,
                                output_path: f.output_path || '/'
                            }
                      )
                    : [...templateFiles.map(f => ({
                        file_name: f.file_name,
                        file_content: f.file_content,
                        file_type: f.file_type,
                        file_order: f.file_order,
                        output_path: f.output_path || '/'
                      })), fileData]
            };

            const response = await api.updateTemplate(editingTemplate.id, templateData);

            if (response.success) {
                // Update local state with new file data
                if (editingFile) {
                    // Update existing file
                    const newFiles = templateFiles.map(f =>
                        f.id === editingFile.id
                            ? { ...fileData, id: editingFile.id, file_path: '', output_path: values.output_path || '/' }
                            : f
                    );
                    setTemplateFiles(newFiles);
                } else {
                    // Add new file - reload from server to get proper ID
                    const templateResponse = await api.getTemplate(editingTemplate.id);
                    if (templateResponse.success) {
                        // Ensure output_path is properly set for each file
                        const files = templateResponse.template.files || [];
                        const filesWithOutputPath = files.map((file: TemplateFile) => ({
                            ...file,
                            output_path: file.output_path || '/'
                        }));
                        setTemplateFiles(filesWithOutputPath);
                    }
                }

                toast.showSuccess(`Datei erfolgreich ${editingFile ? 'aktualisiert' : t.templatemanagementpanel595}`);

                // 🛡️ Check for security scanner warning
                if (response.template?.auto_set_to_private) {
                    setTimeout(() => {
                        let warningMessage = response.template.warning || 'Template unusual content detected, switching back to private.';
                        if (response.template.detected_issues) {
                            warningMessage += '\n\nDetected: ' + response.template.detected_issues;
                        }
                        toast.showWarn(warningMessage);
                    }, 800); // 800ms delay
                }
            } else {
                toast.showError(t.templatemanagementpanel597);
            }
        } catch (error: any) {
            // File save error
            toast.showError('Fehler beim Speichern der Datei: ' + (error.response?.data?.message || error.message));
        }

        // Close modal and reset state
        setEditingFile(null);
        setFileModalVisible(false);
    };

    // Variable management functions
    const loadTemplateVariables = async () => {
        if (!editingTemplate?.id) {
            setTemplateVariables([]);
            return;
        }

        try {
            const response = await api.getTemplateVariables(editingTemplate.id);
            if (response.success) {
                setTemplateVariables(response.variables || []);
            } else {
                // Don't show error toast for permission denied
                console.error('Error loading variables:', response.error);
                setTemplateVariables([]);
            }
        } catch (error: any) {
            console.error('Error loading variables:', error);
            setTemplateVariables([]);
        }
    };

    const handleCreateVariable = () => {
        setEditingVariable(null);
        setVariableModalVisible(true);
    };

    const handleEditVariable = (variable: TemplateVariable) => {
        setEditingVariable(variable);
        setVariableModalVisible(true);
    };

    const handleDeleteVariable = async (variableId: number) => {
        if (!editingTemplate?.id) {
            toast.showError('Kein Template ausgewählt');
            return;
        }

        try {
            const response = await api.deleteTemplateVariable(editingTemplate.id, variableId);
            if (response.success) {
                toast.showSuccess('Variable erfolgreich gelöscht');
                loadTemplateVariables();
            } else {
                toast.showError(response.error || 'Fehler beim Löschen der Variable');
            }
        } catch (_error: any) {
            toast.showError('Fehler beim Löschen der Variable');
        }
    };

    const handleVariableSubmit = async (values: any) => {
        if (!editingTemplate?.id) {
            toast.showError('Kein Template ausgewählt');
            return;
        }

        try {
            let response;
            if (editingVariable?.id) {
                // Update existing variable
                response = await api.updateTemplateVariable(editingTemplate.id, editingVariable.id, values);
                if (response.success) {
                    toast.showSuccess('Variable erfolgreich aktualisiert');
                } else {
                    toast.showError(response.error || 'Fehler beim Aktualisieren der Variable');
                    return;
                }
            } else {
                // Create new variable
                response = await api.createTemplateVariable(editingTemplate.id, values);
                if (response.success) {
                    toast.showSuccess('Variable erfolgreich erstellt');
                } else {
                    toast.showError(response.error || 'Fehler beim Erstellen der Variable');
                    return;
                }
            }

            setVariableModalVisible(false);
            setEditingVariable(null);
            loadTemplateVariables();
        } catch (_error: any) {
            toast.showError('Fehler beim Speichern der Variable');
        }
    };


    return (
        <TabContent>
            <div className="p-4">
                <Card title={t.panelsewnavigationpanel188} className="h-full">
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex gap-2">
                            <Button 
                                icon="pi pi-plus" 
                                label={t.templatemanagementpanel618}
                                onClick={handleCreate}
                                className="p-button-primary"
                            />
                            <Button 
                                icon="pi pi-upload" 
                                label={t.schematranslationpanel762}
                                onClick={() => document.getElementById('template-upload')?.click()}
                                className="p-button-secondary"
                            />
                            <input
                                id="template-upload"
                                type="file"
                                accept=".json"
                                style={{ display: 'none' }}
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                        handleImport(file);
                                        e.target.value = '';
                                    }
                                }}
                            />
                        </div>
                        <div className="flex gap-2">
                            <InputText 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder={t.templatesSearchPlaceholder}
                                className="w-64"
                            />
                            <Dropdown 
                                value={categoryFilter} 
                                options={categories.map(cat => ({ label: cat, value: cat }))}
                                onChange={(e) => setCategoryFilter(e.value)}
                                placeholder={t.templatesColumnCategory}
                                className="w-32"
                            />
                        </div>
                    </div>

                    <DataTable
                        value={templates}
                        loading={loading}
                        paginator
                        rows={10}
                        rowsPerPageOptions={[10, 25, 50]}
                        sortMode="multiple"
                        className="p-datatable-sm"
                        emptyMessage={t.templatesNoTemplatesFound}
                        paginatorTemplate={t.languagemanagementpanel317}
                        currentPageReportTemplate="{first} bis {last} von {totalRecords} Templates"
                        scrollable
                    >
                        <Column field="name" header={t.registermodal236} sortable />
                        <Column 
                            field="category" 
                            header={t.templatesColumnCategory} 
                            body={(template) => (
                                <span className="px-2 py-1 bg-blue-500 text-white rounded text-xs">
                                    {template.category}
                                </span>
                            )}
                        />
                        <Column 
                            field="language" 
                            header={t.cmsadminpanel245}
                            body={(template) => (
                                <span className="px-2 py-1 bg-green-500 text-white rounded text-xs">
                                    {template.language}
                                </span>
                            )}
                        />
                        <Column 
                            field="tags" 
                            header={t.templatemanagementpanel693} 
                            body={(template) => (
                                <div className="flex gap-1 flex-wrap">
                                    {template.tags?.map((tag: string, index: number) => (
                                        <span key={index} className="px-1 py-0.5 bg-orange-400 text-white rounded text-xs">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            )}
                        />
                        <Column 
                            field="file_count" 
                            header={t.templatemanagementpanel706}
                            body={(template) => `${template.file_count} Dateien`}
                        />
                        <Column
                            field="is_active"
                            header={t.applicationsmodal335}
                            body={(template) => (
                                <span className={`px-2 py-1 rounded text-xs ${
                                    template.is_active ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'
                                }`}>
                                    {template.is_active ? t.templatesStatusActive : t.manageteammodal328}
                                </span>
                            )}
                        />
                        <Column
                            header={t.edittablemodal512}
                            body={(template) => {
                                if (template.is_system_template) {
                                    return (
                                        <span className="px-2 py-1 bg-purple-500 text-white rounded text-xs">
                                            System
                                        </span>
                                    );
                                }
                                return (
                                    <span className={`px-2 py-1 rounded text-xs ${
                                        template.visibility === 'public'
                                            ? 'bg-blue-500 text-white'
                                            : 'bg-red-500 text-white'
                                    }`}>
                                        {template.visibility === 'public' ? t.databasemanagementpanel772 : t.databasemanagementpanel771}
                                    </span>
                                );
                            }}
                        />
                        <Column
                            field="created_at"
                            header={t.databasemanagementpanel861}
                            body={(template) => new Date(template.created_at).toLocaleDateString('de-DE')}
                        />
                        <Column
                            header={t.applicationsmodal354}
                            body={(template) => {
                                const isOwner = parseInt(template.creator_user_id) === currentUserId;

                                return (
                                    <div className="flex gap-1">
                                        <Button
                                            icon="pi pi-eye"
                                            className="p-button-text p-button-sm"
                                            onClick={() => handleView(template)}
                                            tooltip={t.publicprojectspanel378}
                                        />
                                        {isOwner && (
                                            <Button
                                                icon="pi pi-pencil"
                                                className="p-button-text p-button-sm"
                                                onClick={() => handleEdit(template)}
                                                tooltip={t.cmsadminpanel170}
                                            />
                                        )}
                                        <Button
                                            icon="pi pi-download"
                                            className="p-button-text p-button-sm"
                                            onClick={() => handleExport(template)}
                                            tooltip={t.templatemanagementpanel771}
                                        />
                                        <Button
                                            icon="pi pi-copy"
                                            className="p-button-text p-button-info p-button-sm"
                                            onClick={() => handleClone(template)}
                                            tooltip={t.templatemanagementpanel777}
                                        />
                                        {isOwner && (
                                            <>
                                                <Button
                                                    icon={template.is_active ? "pi pi-eye-slash" : "pi pi-eye"}
                                                    className={`p-button-text p-button-sm ${template.is_active ? 'p-button-warning' : 'p-button-success'}`}
                                                    onClick={() => handleToggleActive(template)}
                                                    tooltip={template.is_active ? "Deaktivieren" : t.languagemanagementpanel251}
                                                />
                                                <Button
                                                    icon="pi pi-trash"
                                                    className="p-button-text p-button-danger p-button-sm"
                                                    onClick={() => {
                                                        if (window.confirm(t.templatemanagementpanel791)) {
                                                            handleHardDelete(template.id);
                                                        }
                                                    }}
                                                    tooltip={t.templatemanagementpanel795}
                                                />
                                            </>
                                        )}
                                    </div>
                                );
                            }}
                        />
                    </DataTable>
                </Card>
            </div>

            {/* Create/Edit Modal */}
            <TemplateModal
                visible={modalVisible}
                onCancel={() => {
                    setModalVisible(false);
                    loadTemplates(); // Reload templates when modal is closed
                }}
                onSubmit={handleSubmit}
                onSave={handleSave}
                editingTemplate={editingTemplate}
                categories={categories}
                templateFiles={templateFiles}
                onCreateFile={handleCreateFile}
                onEditFile={handleEditFile}
                onDeleteFile={handleDeleteFile}
                fileTypes={fileTypes}
                userType={userType}
                templateVariables={templateVariables}
                onLoadVariables={loadTemplateVariables}
                onCreateVariable={handleCreateVariable}
                onEditVariable={handleEditVariable}
                onDeleteVariable={handleDeleteVariable}
            />

            {/* File Create/Edit Modal */}
            <FileModal
                visible={fileModalVisible}
                onCancel={() => setFileModalVisible(false)}
                onSubmit={handleFileSubmit}
                editingFile={editingFile}
                templateFiles={templateFiles}
                fileTypes={fileTypes}
            />

            {/* View Modal */}
            <Dialog
                header={`Template: ${viewingTemplate?.name}`}
                visible={viewModalVisible}
                onHide={() => setViewModalVisible(false)}
                footer={
                    <Button onClick={() => setViewModalVisible(false)}>
                        Schließen
                    </Button>
                }
                style={{ width: '800px' }}
                contentStyle={{
                    maxHeight: 'calc(100vh - 200px)',
                    overflowY: 'auto'
                }}
                modal
                closable
                draggable={true}
                resizable={true}
            >
                {viewingTemplate && (
                    <div className="space-y-4">
                        <div>
                            <strong>Beschreibung:</strong> {viewingTemplate.description || t.schemaexportcontroller226}
                        </div>
                        <div>
                            <strong>Kategorie:</strong> <Tag value={viewingTemplate.category} severity="info" />
                        </div>
                        <div>
                            <strong>Sprache:</strong> <Tag value={viewingTemplate.language} severity="success" />
                        </div>
                        <div>
                            <strong>Tags:</strong>
                            <div className="flex flex-wrap gap-2 ml-2">
                                {viewingTemplate.tags?.map((tag, index) => (
                                    <Tag key={index} value={tag} severity="warning" />
                                ))}
                            </div>
                        </div>
                        <div>
                            <strong>Dateien ({viewingTemplate.files?.length || 0}):</strong>
                            {viewingTemplate.files && viewingTemplate.files.length > 0 ? (
                                <div className="mt-2 space-y-2">
                                    {viewingTemplate.files.map((file) => (
                                        <div key={file.id} className="border border-gray-600 bg-gray-800 p-3 rounded">
                                            <div className="flex justify-between items-center mb-2">
                                                <strong>{file.file_name}</strong>
                                                <Tag value={file.file_type} />
                                            </div>
                                            <pre className="text-xs bg-gray-800 text-gray-200 p-2 rounded overflow-x-auto">
                                                {file.file_content.substring(0, 500)}
                                                {file.file_content.length > 500 && '...'}
                                            </pre>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="mt-2 text-gray-500">Keine Dateien vorhanden</div>
                            )}
                        </div>
                    </div>
                )}
            </Dialog>

            {/* Clone Modal */}
            <Dialog
                header={`Template klonen: ${templateToClone?.name}`}
                visible={cloneModalVisible}
                onHide={() => setCloneModalVisible(false)}
                footer={
                    <>
                        <Button onClick={() => setCloneModalVisible(false)}>
                            Abbrechen
                        </Button>
                        <Button
                            onClick={handleCloneSubmit}
                            disabled={nameExists || !cloneName.trim() || nameCheckLoading}
                            loading={nameCheckLoading}
                            className="p-button-primary"
                            style={{
                                backgroundColor: (nameExists || !cloneName.trim() || nameCheckLoading) ? '#6b7280' : undefined,
                                borderColor: (nameExists || !cloneName.trim() || nameCheckLoading) ? '#6b7280' : undefined,
                                opacity: (nameExists || !cloneName.trim() || nameCheckLoading) ? 0.7 : 1
                            }}
                        >
                            Jetzt klonen
                        </Button>
                    </>
                }
                style={{ width: '500px' }}
                modal
                closable
                draggable={true}
                resizable={true}
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Neuer Template-Name
                        </label>
                        <InputText
                            value={cloneName}
                            onChange={handleCloneNameChange}
                            placeholder={t.templatemanagementpanel939}
                            className="w-full"
                            style={{ backgroundColor: '#374151', color: '#fff', border: '1px solid #4B5563' }}
                        />
                        {nameCheckLoading && (
                            <div className="text-sm text-blue-400 mt-1">
                                🔍 Prüfe Verfügbarkeit...
                            </div>
                        )}
                        {nameExists && (
                            <div className="text-sm text-red-400 mt-1">
                                ❌ Name darf nicht doppelt vergeben werden
                            </div>
                        )}
                        {!nameExists && cloneName.trim() && !nameCheckLoading && (
                            <div className="text-sm text-green-400 mt-1">
                                ✅ Name ist verfügbar
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Sichtbarkeit
                        </label>
                        <select
                            value={cloneVisibility}
                            onChange={(e) => setCloneVisibility(e.target.value as 'public' | 'private')}
                            className="w-full p-2 border rounded"
                            style={{ backgroundColor: '#374151', color: '#fff', border: '1px solid #4B5563' }}
                        >
                            <option value="public">Public (für alle sichtbar)</option>
                            <option value="private">Private (nur für Sie)</option>
                        </select>
                    </div>

                    <div className="bg-gray-700 p-3 rounded text-sm">
                        <strong>Quelle:</strong> {templateToClone?.name}<br/>
                        <strong>Typ:</strong> {templateToClone?.is_system_template ? t.ultimatetemplatecontroller301 : templateToClone?.visibility}
                    </div>
                </div>
            </Dialog>

            {/* Variable Create/Edit Modal */}
            <VariableModal
                visible={variableModalVisible}
                onCancel={() => {
                    setVariableModalVisible(false);
                    setEditingVariable(null);
                }}
                onSubmit={handleVariableSubmit}
                editingVariable={editingVariable}
            />

            {/* ConfirmDialog for import overwrite confirmation */}
            <ConfirmDialog />
        </TabContent>
    );
};

export default TemplateManagementPanel;