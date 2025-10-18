import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Dialog } from 'primereact/dialog';
import { useToast } from '@/contexts/ToastContext';
import { Tag } from 'primereact/tag';

import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { InputSwitch } from 'primereact/inputswitch';
import { SelectButton } from 'primereact/selectbutton';

import { Card } from 'primereact/card';
import { apiClient as api } from '@/lib/api';
import { TabContentProps } from '@/types';

// Global Ant Design React 19 warning suppression removed

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
    is_system_template?: boolean;
    visibility?: 'public' | 'private';
    creator_user_id?: number;
    project_id?: number;
}

interface DbSchema {
    id: number;
    name: string;
    description?: string;
    owner_id: number;
    visibility: 'public' | 'private';
    last_version: number;
    owner?: {
        name: string;
        user_type: string;
    };
}

interface DbSchemaDependency {
    id: number;
    template_id: number;
    schema_id: number;
    is_required: boolean;
    alias?: string;
    db_schema?: DbSchema;
}

interface AddDependencyModalProps {
    visible: boolean;
    onClose: () => void;
    onSuccess: () => void;
    templateId: number | null;
}

const AddDependencyModal: React.FC<AddDependencyModalProps> = ({ visible, onClose, onSuccess, templateId }) => {
    const toast = useToast();
    const { control, handleSubmit: handleFormSubmit, reset, formState: { errors } } = useForm({
        defaultValues: {
            schema_id: null,
            is_required: true,
            alias: ''
        }
    });
    const [loading, setLoading] = useState(false);
    const [schemas, setSchemas] = useState<DbSchema[]>([]);

    const loadDbSchemas = useCallback(async () => {
        try {
            const response = await api.request('/template-db-schema/schemas');
            if (response.success) {
                setSchemas(response.schemas);
            }
        } catch {
            // Failed to load DB schemas
            toast.showError('Failed to load DB schemas');
        }
    }, [toast]);

    useEffect(() => {
        if (visible) {
            loadDbSchemas();
            reset({ schema_id: null, is_required: true, alias: '' });
        }
    }, [visible, reset, loadDbSchemas]);

    const onSubmit = handleFormSubmit(async (values) => {
        if (!templateId) return;

        setLoading(true);
        try {
            const response = await api.request(`/template-db-schema/templates/${templateId}/add-db-schema`, {
                method: 'POST',
                body: JSON.stringify(values),
            });
            if (response.success) {
                toast.showSuccess('DB schema dependency added successfully');
                reset();
                onSuccess();
                onClose();
            } else {
                toast.showError(response.error || 'Failed to add dependency');
            }
        } catch (error: any) {
            // Failed to add dependency
            const errorMessage = error.response?.data?.error || 'Failed to add dependency';
            toast.showError(errorMessage);
        } finally {
            setLoading(false);
        }
    });

    return (
        <Dialog
            header={
                <div className="flex items-center space-x-2">
                    <i className="pi pi-plus"></i>
                    <span>Add DB Schema Dependency</span>
                </div>
            }
            visible={visible}
            onHide={onClose}
            style={{ width: '600px' }}
            modal
            closable
            draggable={true}
            resizable={true}
        >
            <form onSubmit={onSubmit} className="space-y-4">
                {/* Database Schema */}
                <div>
                    <label htmlFor="schema_id" className="block text-sm font-medium mb-2">
                        Database Schema *
                    </label>
                    <Controller
                        name="schema_id"
                        control={control}
                        rules={{ required: 'Please select a database schema' }}
                        render={({ field }) => (
                            <Dropdown
                                id="schema_id"
                                value={field.value}
                                onChange={(e) => field.onChange(e.value)}
                                options={schemas.map(schema => ({
                                    value: schema.id,
                                    label: `${schema.name} (${schema.visibility})`,
                                    schema
                                }))}
                                optionLabel="label"
                                placeholder="Select a database schema"
                                filter
                                className="w-full"
                                itemTemplate={(option) => (
                                    <div className="flex justify-between items-center w-full">
                                        <div>
                                            <span>{option.schema.name}</span>
                                            <span className="text-gray-400 ml-2">
                                                v{option.schema.last_version}
                                            </span>
                                        </div>
                                        <Tag
                                            value={option.schema.visibility}
                                            severity={option.schema.visibility === 'public' ? 'success' : 'warning'}
                                        />
                                    </div>
                                )}
                            />
                        )}
                    />
                    {errors.schema_id && (
                        <small className="text-red-400 mt-1 block">{errors.schema_id.message}</small>
                    )}
                </div>

                {/* Is Required */}
                <div>
                    <label htmlFor="is_required" className="block text-sm font-medium mb-2">
                        Required Dependency
                    </label>
                    <Controller
                        name="is_required"
                        control={control}
                        render={({ field }) => (
                            <InputSwitch
                                inputId="is_required"
                                checked={field.value}
                                onChange={(e) => field.onChange(e.value)}
                            />
                        )}
                    />
                </div>

                {/* Alias */}
                <div>
                    <label htmlFor="alias" className="block text-sm font-medium mb-2">
                        Alias (Optional)
                    </label>
                    <Controller
                        name="alias"
                        control={control}
                        render={({ field }) => (
                            <InputText
                                id="alias"
                                {...field}
                                placeholder="Enter an alias for this DB schema in the template"
                                className="w-full"
                            />
                        )}
                    />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 justify-end">
                    <Button
                        type="button"
                        label="Cancel"
                        severity="secondary"
                        onClick={onClose}
                    />
                    <Button
                        type="submit"
                        label="Add Dependency"
                        severity="success"
                        loading={loading}
                    />
                </div>
            </form>
        </Dialog>
    );
};

const TemplateDbSchemaDependenciesPanel: React.FC = () => {
    // Using centralized CSS styles from auth-modals.css
    const toast = useToast();

    // State variables
    const [templates, setTemplates] = useState<Template[]>([]);
    const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
    const [dependencies, setDependencies] = useState<DbSchemaDependency[]>([]);
    const [loading, setLoading] = useState(true); // Start with loading state true to ensure proper initial loading
    const [dependenciesLoading, setDependenciesLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [addModalVisible, setAddModalVisible] = useState(false);
    const [templateFilter, setTemplateFilter] = useState<'all' | 'system' | 'public' | 'project'>('all');
    const [currentUserId, setCurrentUserId] = useState<number | null>(null);

    // No need to inject styles - using centralized CSS

    // Load current user on component mount
    useEffect(() => {
        const loadCurrentUser = async () => {
            try {
                const user = await api.getCurrentUser();
                setCurrentUserId(parseInt(user.id));
            } catch {
                // Failed to load current user
            }
        };
        loadCurrentUser();
    }, []);

    // Check if user can edit template (replicate backend logic)
    const canUserEditTemplate = (template: Template): boolean => {
        if (!currentUserId) {
            return false;
        }

        // System templates cannot be edited by anyone
        if (template.is_system_template) {
            return false;
        }
        
        const templateCreatorId = parseInt(String(template.creator_user_id), 10); // Sicherstellen, dass es eine Zahl ist
        
        // Fallback to creator check
        return templateCreatorId === currentUserId;
    };

    const loadTemplates = useCallback(async () => {
        setLoading(true); // Ensure loading is set to true at the start of loading
        try {
            // Use the API client's getAllTemplates method
            const templates = await api.getAllTemplates();

            // Apply frontend filtering since the API doesn't support our specific filters yet
            let filteredTemplates = templates;
            if (templateFilter === 'system') {
                filteredTemplates = templates.filter(t => t.is_system_template === true);
            } else if (templateFilter === 'public') {
                filteredTemplates = templates.filter(t => t.visibility === 'public' && t.is_system_template !== true);
            } else if (templateFilter === 'project') {
                filteredTemplates = templates.filter(t => t.visibility === 'private');
            }

            setTemplates(filteredTemplates);
        } catch {
            // Failed to load templates
            toast.showError('Failed to load templates');
        } finally {
            setLoading(false);
        }
    }, [templateFilter, toast]);

        // Load templates on component mount and filter change
        useEffect(() => {
            if (currentUserId !== null) {
            // Starte das Laden der Templates NUR, wenn die User-ID bekannt ist.
            // Das loadTemplates wird das setLoading(true) und (false) selbst verwalten.
            loadTemplates();
        }
    }, [loadTemplates, currentUserId]); // Add currentUserId to dependencies

    const loadTemplateDependencies = async (templateId: number) => {
        setDependenciesLoading(true);
        try {
            const response = await api.request(`/template-db-schema/templates/${templateId}/dependencies`);
            if (response.success) {
                setDependencies(response.dependencies || []);
            } else {
                toast.showError('Failed to load template dependencies');
            }
        } catch {
            // Failed to load template dependencies
            toast.showError('Failed to load template dependencies');
        } finally {
            setDependenciesLoading(false);
        }
    };

    const handleTemplateSelect = (template: Template) => {
        setSelectedTemplate(template);
        loadTemplateDependencies(template.id);
    };

    const handleRemoveDependency = async (dependency: DbSchemaDependency) => {
        try {
            const response = await api.request(`/template-db-schema/templates/${dependency.template_id}/db-schemas/${dependency.schema_id}`, {
                method: 'DELETE',
            });
            if (response.success) {
                toast.showSuccess('Dependency removed successfully');
                if (selectedTemplate) {
                    loadTemplateDependencies(selectedTemplate.id);
                }
            } else {
                toast.showError('Failed to remove dependency');
            }
        } catch {
            // Failed to remove dependency
            toast.showError('Failed to remove dependency');
        }
    };

    const filteredTemplates = templates.filter(template =>
        template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (template.description && template.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const templateNameBodyTemplate = (rowData: Template) => {
        return (
            <div className="flex items-center space-x-2">
                <span className="font-medium">{rowData.name}</span>
                <Tag value={rowData.category} severity="info" />
                {!rowData.is_active && <Tag value="Inactive" severity="danger" />}
            </div>
        );
    };

    const templateActionBodyTemplate = (rowData: Template) => {
        const canEdit = canUserEditTemplate(rowData);

        if (!canEdit) {
            return (
                <Button
                    icon="pi pi-eye"
                    className="p-button-sm p-button-secondary"
                    disabled
                    label="View Only"
                    title="You can only edit your own templates"
                />
            );
        }

        return (
            <Button
                icon="pi pi-arrow-right"
                className="p-button-sm p-button-info"
                onClick={() => handleTemplateSelect(rowData)}
                label="Manage"
            />
        );
    };

    const dependencySchemaBodyTemplate = (rowData: DbSchemaDependency) => {
        return (
            <div className="flex items-center space-x-2">
                <i className="pi pi-cloud"></i>
                <span className="font-medium">{rowData.db_schema?.name}</span>
                <Tag
                    value={rowData.db_schema?.visibility}
                    severity={rowData.db_schema?.visibility === 'public' ? 'success' : 'warning'}
                />
                {rowData.db_schema?.last_version && (
                    <Tag value={`v${rowData.db_schema.last_version}`} severity="info" />
                )}
            </div>
        );
    };

    const dependencyStatusBodyTemplate = (rowData: DbSchemaDependency) => {
        return (
            <div className="flex items-center space-x-2">
                {rowData.is_required ? (
                    <Tag value="Required" severity="danger" />
                ) : (
                    <Tag value="Optional" severity="info" />
                )}
                {rowData.alias && <Tag value={`Alias: ${rowData.alias}`} style={{ backgroundColor: '#9333ea', color: 'white' }} />}
            </div>
        );
    };

    const dependencyActionBodyTemplate = (rowData: DbSchemaDependency) => {
        if (!selectedTemplate || !canUserEditTemplate(selectedTemplate)) {
            return (
                <div className="flex space-x-2">
                    <Button
                        icon="pi pi-eye"
                        className="p-button-sm p-button-secondary"
                        disabled
                        title="Read-only template"
                    />
                </div>
            );
        }

        return (
            <div className="flex space-x-2">
                <Button
                    icon="pi pi-trash"
                    className="p-button-sm p-button-danger"
                    onClick={() => handleRemoveDependency(rowData)}
                    tooltip="Remove Dependency"
                    tooltipOptions={{ position: 'top' }}
                />
            </div>
        );
    };

    return (
        <TabContent>
            <div className="space-y-4">
                <Card className="bg-gray-700 border-gray-600">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-gray-100 flex items-center space-x-2">
                            <i className="pi pi-link"></i>
                            <span>Template - DB Schema Dependencies</span>
                        </h2>
                        <Button
                            icon="pi pi-refresh"
                            className="p-button-sm"
                            onClick={loadTemplates}
                            loading={loading}
                        />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {/* Templates List */}
                        <div>
                            <h3 className="text-lg font-semibold mb-3">Templates</h3>

                            {/* Template Filter */}
                            <div className="mb-3">
                                <SelectButton
                                    value={templateFilter}
                                    onChange={(e) => setTemplateFilter(e.value)}
                                    options={[
                                        { label: 'All', value: 'all' },
                                        { label: 'System', value: 'system' },
                                        { label: 'Public', value: 'public' },
                                        { label: 'Project', value: 'project' }
                                    ]}
                                    className="w-full mb-3"
                                />
                            </div>

                            <div className="mb-3">
                                <InputText
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Search templates..."
                                    className="w-full"
                                    style={{ backgroundColor: '#4b5563', borderColor: '#6b7280', color: '#f3f4f6' }}
                                />
                            </div>

                            <div className="bg-gray-800 rounded border border-gray-600">
                                <DataTable
                                    value={filteredTemplates}
                                    loading={loading}
                                    emptyMessage="No templates available"
                                    className="dark-table"
                                    size="small"
                                    stripedRows
                                    scrollable
                                    scrollHeight="400px"
                                >
                                    <Column
                                        field="name"
                                        header="Template"
                                        body={templateNameBodyTemplate}
                                        style={{ minWidth: '200px' }}
                                    />
                                    <Column
                                        header="Actions"
                                        body={templateActionBodyTemplate}
                                        style={{ minWidth: '100px' }}
                                    />
                                </DataTable>
                            </div>
                        </div>

                        {/* Dependencies List */}
                        <div>
                            <div className="flex justify-between items-center mb-3">
                                <h3 className="text-lg font-semibold">
                                    DB Schema Dependencies {selectedTemplate && `for ${selectedTemplate.name}`}
                                </h3>
                                {selectedTemplate && canUserEditTemplate(selectedTemplate) && (
                                    <Button
                                        icon="pi pi-plus"
                                        className="p-button-sm p-button-success"
                                        label="Add"
                                        onClick={() => setAddModalVisible(true)}
                                    />
                                )}
                            </div>

                            {selectedTemplate ? (
                                <div className="bg-gray-800 rounded border border-gray-600">
                                    <DataTable
                                        value={dependencies}
                                        loading={dependenciesLoading}
                                        emptyMessage="No DB schema dependencies"
                                        className="dark-table"
                                        size="small"
                                        stripedRows
                                        scrollable
                                        scrollHeight="400px"
                                    >
                                        <Column
                                            header="Database Schema"
                                            body={dependencySchemaBodyTemplate}
                                            style={{ minWidth: '200px' }}
                                        />
                                        <Column
                                            header="Status"
                                            body={dependencyStatusBodyTemplate}
                                            style={{ minWidth: '150px' }}
                                        />
                                        <Column
                                            header="Actions"
                                            body={dependencyActionBodyTemplate}
                                            style={{ minWidth: '80px' }}
                                        />
                                    </DataTable>
                                </div>
                            ) : (
                                <div className="bg-gray-800 rounded border border-gray-600 p-8 text-center text-gray-400">
                                    Select a template to view its DB schema dependencies
                                </div>
                            )}
                        </div>
                    </div>
                </Card>
            </div>

            <AddDependencyModal
                visible={addModalVisible}
                onClose={() => setAddModalVisible(false)}
                onSuccess={() => {
                    if (selectedTemplate) {
                        loadTemplateDependencies(selectedTemplate.id);
                    }
                }}
                templateId={selectedTemplate?.id || null}
            />
        </TabContent>
    );
};

export default TemplateDbSchemaDependenciesPanel;