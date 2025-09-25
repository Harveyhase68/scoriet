import React, { useState, useEffect, useRef } from 'react';
import { Modal, Tag, Space, message } from 'antd';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Card } from 'primereact/card';
import { apiClient as api } from '@/lib/api';
import { TabContentProps } from '@/types';
import FileModal from './FileModal';
import TemplateModal from './TemplateModal';

// Global Ant Design React 19 warning suppression
(() => {
    const originalWarn = console.warn;
    console.warn = (...args) => {
        if (args[0] && typeof args[0] === 'string' && 
            (args[0].includes('[antd: compatible]') || 
             args[0].includes('antd v5 support React is 16 ~ 18'))) {
            return; // Suppress these specific warnings globally
        }
        originalWarn.apply(console, args);
    };
})();

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
    files?: TemplateFile[];
}

interface TemplateFile {
    id: number;
    file_name: string;
    file_path: string;
    file_content: string;
    file_type: string;
    file_order: number;
}

const TemplateManagementPanel: React.FC = () => {
    // Using centralized CSS styles from auth-modals.css

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
    const [categoryFilter, setCategoryFilter] = useState('All');
    
    // Forms are now handled by separate modal components

    // No need to inject styles - using centralized CSS
    // Ant Design React 19 warnings are handled by @ant-design/v5-patch-for-react-19

    const categories = ['All', 'Web', 'Mobile', 'API', 'Desktop', 'Database'];
    const fileTypes = [
        { label: 'Static File', value: 'static_file', description: 'Single static file (e.g. config.json)' },
        { label: 'Static Directory (.zip)', value: 'static_directory', description: 'Static directory as ZIP archive' },
        { label: 'Project File', value: 'project_file', description: 'Project-specific file with placeholders' },
        { label: 'DB Table File', value: 'db_table_file', description: 'File per database table (model, controller, etc.)' }
    ];

    useEffect(() => {
        loadTemplates();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchTerm, categoryFilter]);


    const loadTemplates = async () => {
        setLoading(true);
        try {
            const templates = await api.getAllTemplates({
                category: categoryFilter,
                search: searchTerm,
                active_only: false
            });
            setTemplates(templates);
        } catch (loadError: any) {
            // Error loading templates
            message.error('Fehler beim Laden der Templates. Bitte zuerst einloggen.');
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
                    
                    setTemplateFiles(response.template.files || []);
                } else {
                    
                    setTemplateFiles([]);
                }
            } catch (error) {
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
        } catch (viewError) {
            // Error loading template details
            message.error('Fehler beim Laden der Template-Details');
        }
    };

    const handleDelete = async (id: number) => {
        try {
            const response = await api.deleteTemplate(id);
            if (response.success) {
                message.success('Template erfolgreich gelöscht');
                loadTemplates();
            }
        } catch (deleteError) {
            // Error deleting template
            message.error('Fehler beim Löschen des Templates');
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
                files: templateFiles.map((file, index) => ({
                    file_name: file.file_name,
                    file_content: file.file_content,
                    file_type: file.file_type,
                    file_order: index
                }))
            };

            // Submitting template with files

            let response;
            if (editingTemplate) {
                response = await api.updateTemplate(editingTemplate.id, templateData);
            } else {
                response = await api.createTemplate(templateData);
            }

            if (response.success) {
                message.success(`Template erfolgreich ${editingTemplate ? 'aktualisiert' : 'erstellt'}`);
                setModalVisible(false);
                setTemplateFiles([]);
                loadTemplates();
            }
        } catch (error: any) {
            // Template submission error
            const errorMessage = error.response?.data?.error || error.response?.data?.message || `Fehler beim ${editingTemplate ? 'Aktualisieren' : 'Erstellen'} des Templates`;
            message.error(errorMessage);
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
                    message.success('Template erfolgreich importiert');
                    loadTemplates();
                } else {
                    message.error(response.error || 'Fehler beim Importieren des Templates');
                }
            } catch (error: any) {
                if (error.response?.status === 409) {
                    // Template already exists
                    Modal.confirm({
                        title: 'Template existiert bereits',
                        content: `Ein Template mit diesem Namen existiert bereits. Möchten Sie es überschreiben?`,
                        onOk: async () => {
                            try {
                                const templateData = JSON.parse(e.target?.result as string);
                                const response = await api.importTemplate(templateData, true);
                                
                                if (response.success) {
                                    message.success('Template erfolgreich importiert und überschrieben');
                                    loadTemplates();
                                }
                            } catch (retryError) {
                                // Error overwriting template
                                message.error('Fehler beim Überschreiben des Templates');
                            }
                        }
                    });
                } else {
                    message.error('Fehler beim Importieren des Templates');
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
                message.success('Template erfolgreich exportiert');
            }
        } catch (error) {
            message.error('Fehler beim Exportieren des Templates');
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
            message.error('Kein Template ausgewählt');
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
                    file_order: f.file_order
                }))
            };

            // Saving template with deleted file

            const response = await api.updateTemplate(editingTemplate.id, templateData);

            if (response.success) {
                // Update local state
                setTemplateFiles(newFiles);
                message.success(`Datei "${fileToDelete.file_name}" erfolgreich gelöscht`);
            } else {
                message.error('Fehler beim Löschen der Datei');
            }
        } catch (error: any) {
            // File delete error
            message.error('Fehler beim Löschen der Datei: ' + (error.response?.data?.message || error.message));
        }
    };

    const handleFileSubmit = async (values: any) => {
        if (!editingTemplate) {
            message.error('Kein Template ausgewählt');
            return;
        }

        const fileData = {
            file_name: values.file_name,
            file_content: values.file_content,
            file_type: values.file_type,
            file_order: values.file_order || templateFiles.length,
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
                                file_order: f.file_order
                            }
                      )
                    : [...templateFiles.map(f => ({
                        file_name: f.file_name,
                        file_content: f.file_content,
                        file_type: f.file_type,
                        file_order: f.file_order
                      })), fileData]
            };

            // Saving template with updated files

            const response = await api.updateTemplate(editingTemplate.id, templateData);

            if (response.success) {
                // Update local state with new file data
                if (editingFile) {
                    // Update existing file
                    const newFiles = templateFiles.map(f =>
                        f.id === editingFile.id
                            ? { ...fileData, id: editingFile.id, file_path: '' }
                            : f
                    );
                    setTemplateFiles(newFiles);
                } else {
                    // Add new file - reload from server to get proper ID
                    const templateResponse = await api.getTemplate(editingTemplate.id);
                    if (templateResponse.success) {
                        setTemplateFiles(templateResponse.template.files || []);
                    }
                }

                message.success(`Datei erfolgreich ${editingFile ? 'aktualisiert' : 'hinzugefügt'}`);
            } else {
                message.error('Fehler beim Speichern der Datei');
            }
        } catch (error: any) {
            // File save error
            message.error('Fehler beim Speichern der Datei: ' + (error.response?.data?.message || error.message));
        }

        // Close modal and reset state
        setEditingFile(null);
        setFileModalVisible(false);
    };


    return (
        <TabContent>
            <div className="p-4">
                <Card title="Template Verwaltung" className="h-full">
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex gap-2">
                            <Button 
                                icon="pi pi-plus" 
                                label="Neues Template"
                                onClick={handleCreate}
                                className="p-button-primary"
                            />
                            <Button 
                                icon="pi pi-upload" 
                                label="Import"
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
                                placeholder="Templates suchen..."
                                className="w-64"
                            />
                            <Dropdown 
                                value={categoryFilter} 
                                options={categories.map(cat => ({ label: cat, value: cat }))}
                                onChange={(e) => setCategoryFilter(e.value)}
                                placeholder="Kategorie"
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
                        emptyMessage="Keine Templates gefunden"
                        paginatorTemplate="RowsPerPageDropdown FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink"
                        currentPageReportTemplate="{first} bis {last} von {totalRecords} Templates"
                        scrollable
                    >
                        <Column field="name" header="Name" sortable />
                        <Column 
                            field="category" 
                            header="Kategorie" 
                            body={(template) => (
                                <span className="px-2 py-1 bg-blue-500 text-white rounded text-xs">
                                    {template.category}
                                </span>
                            )}
                        />
                        <Column 
                            field="language" 
                            header="Sprache"
                            body={(template) => (
                                <span className="px-2 py-1 bg-green-500 text-white rounded text-xs">
                                    {template.language}
                                </span>
                            )}
                        />
                        <Column 
                            field="tags" 
                            header="Tags" 
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
                            header="Dateien"
                            body={(template) => `${template.file_count} Dateien`}
                        />
                        <Column 
                            field="is_active" 
                            header="Status"
                            body={(template) => (
                                <span className={`px-2 py-1 rounded text-xs ${
                                    template.is_active ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'
                                }`}>
                                    {template.is_active ? 'Aktiv' : 'Inaktiv'}
                                </span>
                            )}
                        />
                        <Column 
                            field="created_at" 
                            header="Erstellt"
                            body={(template) => new Date(template.created_at).toLocaleDateString('de-DE')}
                        />
                        <Column 
                            header="Aktionen"
                            body={(template) => (
                                <div className="flex gap-1">
                                    <Button 
                                        icon="pi pi-eye" 
                                        className="p-button-text p-button-sm"
                                        onClick={() => handleView(template)}
                                        tooltip="Anzeigen"
                                    />
                                    <Button 
                                        icon="pi pi-pencil" 
                                        className="p-button-text p-button-sm"
                                        onClick={() => handleEdit(template)}
                                        tooltip="Bearbeiten"
                                    />
                                    <Button 
                                        icon="pi pi-download" 
                                        className="p-button-text p-button-sm"
                                        onClick={() => handleExport(template)}
                                        tooltip="Exportieren"
                                    />
                                    <Button 
                                        icon="pi pi-trash" 
                                        className="p-button-text p-button-danger p-button-sm"
                                        onClick={() => {
                                            if (window.confirm('Template löschen?')) {
                                                handleDelete(template.id);
                                            }
                                        }}
                                        tooltip="Löschen"
                                    />
                                </div>
                            )}
                        />
                    </DataTable>
                </Card>
            </div>

            {/* Create/Edit Modal */}
            <TemplateModal
                visible={modalVisible}
                onCancel={() => setModalVisible(false)}
                onSubmit={handleSubmit}
                editingTemplate={editingTemplate}
                categories={categories}
                templateFiles={templateFiles}
                onCreateFile={handleCreateFile}
                onEditFile={handleEditFile}
                onDeleteFile={handleDeleteFile}
                fileTypes={fileTypes}
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
            <Modal
                title={`Template: ${viewingTemplate?.name}`}
                open={viewModalVisible}
                onCancel={() => setViewModalVisible(false)}
                footer={[
                    <Button key="close" onClick={() => setViewModalVisible(false)}>
                        Schließen
                    </Button>
                ]}
                width={800}
                style={{ top: 20 }}
                bodyStyle={{
                    maxHeight: 'calc(100vh - 200px)',
                    overflowY: 'auto',
                    padding: '24px'
                }}
                className="dark-modal"
                modalRender={(modal) => (
                    <div className="dark-modal">
                        {modal}
                    </div>
                )}
            >
                {viewingTemplate && (
                    <div className="space-y-4">
                        <div>
                            <strong>Beschreibung:</strong> {viewingTemplate.description || 'Keine Beschreibung'}
                        </div>
                        <div>
                            <strong>Kategorie:</strong> <Tag color="blue">{viewingTemplate.category}</Tag>
                        </div>
                        <div>
                            <strong>Sprache:</strong> <Tag color="green">{viewingTemplate.language}</Tag>
                        </div>
                        <div>
                            <strong>Tags:</strong>
                            <Space wrap className="ml-2">
                                {viewingTemplate.tags?.map((tag, index) => (
                                    <Tag key={index} color="orange">{tag}</Tag>
                                ))}
                            </Space>
                        </div>
                        <div>
                            <strong>Dateien ({viewingTemplate.files?.length || 0}):</strong>
                            {viewingTemplate.files && viewingTemplate.files.length > 0 ? (
                                <div className="mt-2 space-y-2">
                                    {viewingTemplate.files.map((file) => (
                                        <div key={file.id} className="border border-gray-600 bg-gray-800 p-3 rounded">
                                            <div className="flex justify-between items-center mb-2">
                                                <strong>{file.file_name}</strong>
                                                <Tag>{file.file_type}</Tag>
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
            </Modal>
        </TabContent>
    );
};

export default TemplateManagementPanel;