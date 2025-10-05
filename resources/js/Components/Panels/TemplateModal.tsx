import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, Select, Checkbox } from 'antd';
import { Button } from 'primereact/button';
import { PlusOutlined, EditOutlined, DeleteOutlined, FileOutlined } from '@ant-design/icons';

const { TextArea } = Input;
const { Option } = Select;

interface TemplateModalProps {
    visible: boolean;
    onCancel: () => void;
    onSubmit: (values: any) => Promise<void>;
    onSave?: (values: any) => Promise<any>;
    editingTemplate: any;
    categories: string[];
    templateFiles: any[];
    onCreateFile: () => void;
    onEditFile: (file: any) => void;
    onDeleteFile: (index: number) => void;
    fileTypes: any[];
    userType?: string;
}

const TemplateModal: React.FC<TemplateModalProps> = ({
    visible,
    onCancel,
    onSubmit,
    onSave,
    editingTemplate,
    categories,
    templateFiles,
    onCreateFile,
    onEditFile,
    onDeleteFile,
    fileTypes,
    userType
}) => {
    const [form] = Form.useForm();
    const [isSaved, setIsSaved] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [hasFormChanges, setHasFormChanges] = useState(false);
    const [originalFormValues, setOriginalFormValues] = useState<any>(null);

    // All hooks must be called before any early returns
    useEffect(() => {
        if (visible && editingTemplate) {
            const initialValues = {
                name: editingTemplate.name,
                description: editingTemplate.description,
                category: editingTemplate.category,
                language: editingTemplate.language,
                tags: editingTemplate.tags,
                is_active: editingTemplate.is_active,
                visibility: editingTemplate.visibility || 'public',
                is_system_template: editingTemplate.is_system_template || false,
            };
            // Set form values when editing
            form.setFieldsValue(initialValues);
            setOriginalFormValues(initialValues);
            setIsSaved(true); // Existing templates are considered "saved"
            setHasFormChanges(false); // Reset form changes
        } else if (visible && !editingTemplate) {
            // Reset form for new template
            form.resetFields();
            const initialValues = {
                is_active: true,
                visibility: 'public',
                is_system_template: userType === 'system' ? false : false
            };
            form.setFieldsValue(initialValues);
            setOriginalFormValues(initialValues);
            setIsSaved(false); // New templates start as unsaved
            setHasFormChanges(false); // Reset form changes
        }
    }, [visible, editingTemplate, form, userType]);

    // Don't render anything if not visible - AFTER all hooks
    if (!visible) return null;

    // Check for form changes (excluding files)
    const checkFormChanges = () => {
        if (!originalFormValues) return;

        const currentValues = form.getFieldsValue();
        const fieldsToCheck = ['name', 'description', 'category', 'language', 'tags', 'is_active', 'visibility', 'is_system_template'];

        const hasChanges = fieldsToCheck.some(field => {
            const original = originalFormValues[field];
            const current = currentValues[field];

            // Handle arrays (tags) comparison
            if (Array.isArray(original) && Array.isArray(current)) {
                return JSON.stringify(original) !== JSON.stringify(current);
            }

            return original !== current;
        });

        setHasFormChanges(hasChanges);
    };

    const handleSave = async () => {
        try {
            setIsLoading(true);
            const values = await form.validateFields();
            if (onSave) {
                await onSave(values);
                setIsSaved(true);
            }
        } catch {
            // Form validation failed
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            await onSubmit(values);
            form.resetFields();
            setIsSaved(false);
        } catch {
            // Form validation failed
        }
    };

    return (
        <Modal
            title={editingTemplate ? 'Template bearbeiten' : 'Neues Template erstellen'}
            open={visible}
            onCancel={onCancel}
            footer={null}
            width={800}
            className="dark-modal"
            modalRender={(modal) => (
                <div className="dark-modal">
                    {modal}
                </div>
            )}
        >
            <Form
                form={form}
                layout="vertical"
                onValuesChange={checkFormChanges}
            >
                <Form.Item
                    name="name"
                    label="Name"
                    rules={[
                        { required: true, message: 'Bitte Template-Name eingeben!' },
                        {
                            pattern: /^[a-z0-9]+(_[a-z0-9]+)*$/,
                            message: 'Template-Name darf nur Kleinbuchstaben, Zahlen und Unterstriche enthalten (z.B. my_template_123)'
                        }
                    ]}
                >
                    <Input
                        placeholder="my_template_name"
                        className="font-mono"
                    />
                </Form.Item>
                <div className="text-xs text-gray-500 -mt-4 mb-4">
                    Template-Namen werden später für URLs verwendet (username/template_name)
                </div>

                <Form.Item
                    name="description"
                    label="Beschreibung"
                >
                    <TextArea 
                        rows={3}
                        placeholder="Template Beschreibung (optional)"
                    />
                </Form.Item>

                <div className="flex gap-4">
                    <Form.Item
                        name="category"
                        label="Kategorie"
                        rules={[{ required: true, message: 'Bitte Kategorie auswählen!' }]}
                        className="flex-1"
                    >
                        <Select placeholder="Kategorie auswählen" className="placeholder-gray-400">
                            {categories.filter(cat => cat !== 'All').map(cat => (
                                <Option key={cat} value={cat}>{cat}</Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Form.Item
                        name="language"
                        label="Sprache"
                        rules={[{ required: true, message: 'Bitte Sprache eingeben!' }]}
                        className="flex-1"
                    >
                        <Input placeholder="e.g., PHP, JavaScript, TypeScript" />
                    </Form.Item>
                </div>

                <Form.Item
                    name="tags"
                    label="Tags"
                >
                    <Select
                        mode="tags"
                        placeholder="Tags hinzufügen"
                        className="placeholder-gray-400"
                        tokenSeparators={[',']}
                    />
                </Form.Item>

                <div className="flex gap-4">
                    <Form.Item
                        name="visibility"
                        label="Sichtbarkeit"
                        rules={[{ required: true, message: 'Bitte Sichtbarkeit auswählen!' }]}
                        className="flex-1"
                    >
                        <Select placeholder="Sichtbarkeit wählen">
                            <Option value="public">Public</Option>
                            <Option value="private">Private</Option>
                        </Select>
                    </Form.Item>

                    {userType === 'system' && (
                        <Form.Item
                            name="is_system_template"
                            valuePropName="checked"
                            className="flex-1"
                        >
                            <Checkbox>
                                <span className="text-gray-300">System Template</span>
                            </Checkbox>
                        </Form.Item>
                    )}
                </div>

                {/* Template Files Section */}
                <div className="border-t pt-4 mt-4">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-300">Template Dateien</h3>
                        <Button
                            type="primary"
                            size="small"
                            icon={<PlusOutlined />}
                            disabled={!isSaved && !editingTemplate}
                            onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                onCreateFile();
                            }}
                        >
                            Datei hinzufügen
                        </Button>
                    </div>

                    {!isSaved && !editingTemplate && (
                        <div className="mb-4">
                            <Message
                                severity="info"
                                text="Bitte speichern Sie das Template, erst dann können Sie Dateien zum Template hinzufügen"
                                className="w-full"
                            />
                        </div>
                    )}

                    {editingTemplate && (
                        <div className="mb-4">
                            <Message
                                severity="info"
                                text="Hinweis: Dateien werden sofort dem Template zugewiesen. Änderungen an Template-Details (Name, Beschreibung, etc.) müssen separat gespeichert werden."
                                className="w-full"
                            />
                        </div>
                    )}
                    
                    {templateFiles.length > 0 ? (
                        <div className="max-h-60 overflow-y-auto border border-gray-600 rounded bg-gray-700">
                            <table className="w-full text-sm text-gray-100">
                                <thead className="bg-gray-600 border-b border-gray-500">
                                    <tr>
                                        <th className="px-3 py-2 text-left text-gray-100">Name</th>
                                        <th className="px-3 py-2 text-left text-gray-100">Typ</th>
                                        <th className="px-3 py-2 text-left text-gray-100">Größe</th>
                                        <th className="px-3 py-2 text-left text-gray-100">Aktionen</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {templateFiles.map((file, index) => (
                                        <tr key={file.id || index} className="border-t border-gray-600 hover:bg-gray-600 transition-colors">
                                            <td className="px-3 py-2">
                                                <div className="flex items-center text-gray-100">
                                                    <FileOutlined className="mr-2 text-gray-300" />
                                                    {file.file_name}
                                                </div>
                                            </td>
                                            <td className="px-3 py-2">
                                                <span className="px-2 py-1 bg-blue-500 text-white rounded text-xs">
                                                    {fileTypes.find(ft => ft.value === file.file_type)?.label || file.file_type}
                                                </span>
                                            </td>
                                            <td className="px-3 py-2 text-gray-100">
                                                {file.file_content?.length || 0} Zeichen
                                            </td>
                                            <td className="px-3 py-2">
                                                <div className="flex gap-1">
                                                    <Button 
                                                        type="link" 
                                                        size="small"
                                                        icon={<EditOutlined />}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            e.preventDefault();
                                                            onEditFile(file);
                                                        }}
                                                        className="text-blue-400 hover:text-blue-300"
                                                    />
                                                    <Button 
                                                        type="link" 
                                                        size="small"
                                                        icon={<DeleteOutlined />}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            e.preventDefault();
                                                            onDeleteFile(index);
                                                        }}
                                                        className="text-red-400 hover:text-red-300"
                                                    />
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-300 border border-gray-600 rounded bg-gray-700">
                            Keine Dateien hinzugefügt. Klicken Sie auf "Datei hinzufügen" um zu beginnen.
                        </div>
                    )}
                </div>

                <Form.Item
                    name="is_active"
                    valuePropName="checked"
                    initialValue={true}
                    className="mt-4"
                >
                    <Checkbox
                        className="text-gray-300"
                        onChange={checkFormChanges}
                    >
                        Template ist aktiv
                    </Checkbox>
                </Form.Item>

                <div className="flex gap-2 justify-end">
                    <Button onClick={onCancel}>
                        Abbrechen
                    </Button>

                    {/* Save button - only for new templates */}
                    {!editingTemplate && (
                        <Button
                            onClick={handleSave}
                            loading={isLoading}
                            disabled={isSaved}
                            className={isSaved ? 'opacity-50' : ''}
                        >
                            {isSaved ? 'Gespeichert ✓' : 'Speichern'}
                        </Button>
                    )}

                    <Button
                        onClick={handleSubmit}
                        disabled={editingTemplate && !hasFormChanges}
                        className={editingTemplate && !hasFormChanges ? 'opacity-50' : ''}
                    >
                        {editingTemplate ?
                            (hasFormChanges ? 'Aktualisieren' : 'Keine Änderungen') :
                            'Erstellen'
                        }
                    </Button>
                </div>
            </Form>
        </Modal>
    );
};

export default TemplateModal;