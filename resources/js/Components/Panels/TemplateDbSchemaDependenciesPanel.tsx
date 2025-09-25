import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Modal, Tag, Space, message, Button as AntButton, Form, Input, Select, Switch, Tooltip, Radio } from 'antd';
import { PlusOutlined, LinkOutlined, ApiOutlined } from '@ant-design/icons';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Card } from 'primereact/card';
import { apiClient as api } from '@/lib/api';
import { TabContentProps } from '@/types';

// Global Ant Design React 19 warning suppression
(() => {
    const originalWarn = console.warn;
    console.warn = (...args) => {
        if (args[0] && typeof args[0] === 'string' &&
            (args[0].includes('[antd: compatible]') ||
             args[0].includes('antd v5 support React is 16 ~ 18'))) {
            return;
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
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [schemas, setSchemas] = useState<DbSchema[]>([]);

    useEffect(() => {
        if (visible) {
            loadDbSchemas();
        }
    }, [visible]);

    const loadDbSchemas = async () => {
        try {
            const response = await api.request('/template-db-schema/schemas');
            if (response.success) {
                setSchemas(response.schemas);
            }
        } catch (error) {
            // Failed to load DB schemas
            message.error('Failed to load DB schemas');
        }
    };

    const handleSubmit = async (values: any) => {
        if (!templateId) return;

        setLoading(true);
        try {
            const response = await api.request(`/template-db-schema/templates/${templateId}/add-db-schema`, {
                method: 'POST',
                body: JSON.stringify(values),
            });
            if (response.success) {
                message.success('DB schema dependency added successfully');
                form.resetFields();
                onSuccess();
                onClose();
            } else {
                message.error(response.error || 'Failed to add dependency');
            }
        } catch (error: any) {
            // Failed to add dependency
            const errorMessage = error.response?.data?.error || 'Failed to add dependency';
            message.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            title={
                <div className="flex items-center space-x-2">
                    <PlusOutlined />
                    <span>Add DB Schema Dependency</span>
                </div>
            }
            open={visible}
            onCancel={onClose}
            footer={null}
            className="dark-modal"
        >
            <Form
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
                initialValues={{ is_required: true }}
            >
                <Form.Item
                    name="schema_id"
                    label="Database Schema"
                    rules={[{ required: true, message: 'Please select a database schema' }]}
                >
                    <Select
                        placeholder="Select a database schema"
                        showSearch
                        filterOption={(input, option) =>
                            option?.label?.toLowerCase().includes(input.toLowerCase()) ?? false
                        }
                        options={schemas.map(schema => ({
                            value: schema.id,
                            label: `${schema.name} (${schema.visibility})`,
                            schema
                        }))}
                        optionRender={(option) => (
                            <div className="flex justify-between items-center">
                                <div>
                                    <span>{option.data.schema.name}</span>
                                    <span className="text-gray-400 ml-2">
                                        v{option.data.schema.last_version}
                                    </span>
                                </div>
                                <Tag color={option.data.schema.visibility === 'public' ? 'green' : 'orange'} size="small">
                                    {option.data.schema.visibility}
                                </Tag>
                            </div>
                        )}
                    />
                </Form.Item>

                <Form.Item
                    name="is_required"
                    label="Required Dependency"
                    valuePropName="checked"
                >
                    <Switch />
                </Form.Item>

                <Form.Item
                    name="alias"
                    label="Alias (Optional)"
                >
                    <Input placeholder="Enter an alias for this DB schema in the template" />
                </Form.Item>

                <Form.Item className="mb-0">
                    <Space>
                        <AntButton onClick={onClose}>
                            Cancel
                        </AntButton>
                        <AntButton type="primary" htmlType="submit" loading={loading}>
                            Add Dependency
                        </AntButton>
                    </Space>
                </Form.Item>
            </Form>
        </Modal>
    );
};

const TemplateDbSchemaDependenciesPanel: React.FC = () => {
    // Using centralized CSS styles from auth-modals.css

    // State variables
    const [templates, setTemplates] = useState<Template[]>([]);
    const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
    const [dependencies, setDependencies] = useState<DbSchemaDependency[]>([]);
    const [loading, setLoading] = useState(false);
    const [dependenciesLoading, setDependenciesLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [addModalVisible, setAddModalVisible] = useState(false);
    const [templateFilter, setTemplateFilter] = useState<'all' | 'system' | 'public' | 'project'>('all');

    // No need to inject styles - using centralized CSS

    const loadTemplates = useCallback(async () => {
        setLoading(true);
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
        } catch (error) {
            // Failed to load templates
            message.error('Failed to load templates');
        } finally {
            setLoading(false);
        }
    }, [templateFilter]);

    // Load templates on component mount and filter change
    useEffect(() => {
        loadTemplates();
    }, [loadTemplates]);

    const loadTemplateDependencies = async (templateId: number) => {
        setDependenciesLoading(true);
        try {
            const response = await api.request(`/template-db-schema/templates/${templateId}/dependencies`);
            if (response.success) {
                setDependencies(response.dependencies || []);
            } else {
                message.error('Failed to load template dependencies');
            }
        } catch (error) {
            // Failed to load template dependencies
            message.error('Failed to load template dependencies');
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
                message.success('Dependency removed successfully');
                if (selectedTemplate) {
                    loadTemplateDependencies(selectedTemplate.id);
                }
            } else {
                message.error('Failed to remove dependency');
            }
        } catch (error) {
            // Failed to remove dependency
            message.error('Failed to remove dependency');
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
                <Tag color="blue">{rowData.category}</Tag>
                {!rowData.is_active && <Tag color="red">Inactive</Tag>}
            </div>
        );
    };

    const templateActionBodyTemplate = (rowData: Template) => {
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
                <ApiOutlined />
                <span className="font-medium">{rowData.db_schema?.name}</span>
                <Tag color={rowData.db_schema?.visibility === 'public' ? 'green' : 'orange'}>
                    {rowData.db_schema?.visibility}
                </Tag>
                {rowData.db_schema?.last_version && (
                    <Tag color="blue">v{rowData.db_schema.last_version}</Tag>
                )}
            </div>
        );
    };

    const dependencyStatusBodyTemplate = (rowData: DbSchemaDependency) => {
        return (
            <div className="flex items-center space-x-2">
                {rowData.is_required ? (
                    <Tag color="red">Required</Tag>
                ) : (
                    <Tag color="blue">Optional</Tag>
                )}
                {rowData.alias && <Tag color="purple">Alias: {rowData.alias}</Tag>}
            </div>
        );
    };

    const dependencyActionBodyTemplate = (rowData: DbSchemaDependency) => {
        return (
            <div className="flex space-x-2">
                <Tooltip title="Remove Dependency">
                    <Button
                        icon="pi pi-trash"
                        className="p-button-sm p-button-danger"
                        onClick={() => handleRemoveDependency(rowData)}
                    />
                </Tooltip>
            </div>
        );
    };

    return (
        <TabContent>
            <div className="space-y-4">
                <Card className="bg-gray-700 border-gray-600">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-gray-100 flex items-center space-x-2">
                            <LinkOutlined />
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
                                <Radio.Group
                                    value={templateFilter}
                                    onChange={(e) => setTemplateFilter(e.target.value)}
                                    className="mb-3"
                                >
                                    <Radio.Button value="all">All</Radio.Button>
                                    <Radio.Button value="system">System</Radio.Button>
                                    <Radio.Button value="public">Public</Radio.Button>
                                    <Radio.Button value="project">Project</Radio.Button>
                                </Radio.Group>
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
                                {selectedTemplate && (
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