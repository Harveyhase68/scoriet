import React, { useEffect } from 'react';
import { Modal, Form, Input, Select } from 'antd';
import { Button } from 'primereact/button';
import { PlusOutlined, EditOutlined, DeleteOutlined, FileOutlined } from '@ant-design/icons';

const { TextArea } = Input;
const { Option } = Select;

interface TemplateModalProps {
    visible: boolean;
    onCancel: () => void;
    onSubmit: (values: any) => Promise<void>;
    editingTemplate: any;
    categories: string[];
    templateFiles: any[];
    onCreateFile: () => void;
    onEditFile: (file: any) => void;
    onDeleteFile: (index: number) => void;
    fileTypes: any[];
}

const TemplateModal: React.FC<TemplateModalProps> = ({
    visible,
    onCancel,
    onSubmit,
    editingTemplate,
    categories,
    templateFiles,
    onCreateFile,
    onEditFile,
    onDeleteFile,
    fileTypes
}) => {
    const [form] = Form.useForm();

    // All hooks must be called before any early returns
    useEffect(() => {
        if (visible && editingTemplate) {
            // Set form values when editing
            form.setFieldsValue({
                name: editingTemplate.name,
                description: editingTemplate.description,
                category: editingTemplate.category,
                language: editingTemplate.language,
                tags: editingTemplate.tags,
                is_active: editingTemplate.is_active,
            });
        } else if (visible && !editingTemplate) {
            // Reset form for new template
            form.resetFields();
            form.setFieldsValue({
                is_active: true
            });
        }
    }, [visible, editingTemplate, form]);

    // Don't render anything if not visible - AFTER all hooks
    if (!visible) return null;

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            await onSubmit(values);
            form.resetFields();
        } catch (error) {
            console.log('Form validation failed:', error);
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
        >
            <Form
                form={form}
                layout="vertical"
            >
                <Form.Item
                    name="name"
                    label="Name"
                    rules={[{ required: true, message: 'Bitte Template-Name eingeben!' }]}
                >
                    <Input placeholder="Template Name" />
                </Form.Item>

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
                        <Select placeholder="Kategorie auswählen">
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
                        <Input placeholder="z.B. PHP, JavaScript, TypeScript" />
                    </Form.Item>
                </div>

                <Form.Item
                    name="tags"
                    label="Tags"
                >
                    <Select
                        mode="tags"
                        placeholder="Tags hinzufügen"
                        tokenSeparators={[',']}
                    />
                </Form.Item>

                {/* Template Files Section */}
                <div className="border-t pt-4 mt-4">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold">Template Dateien</h3>
                        <Button 
                            type="primary" 
                            size="small"
                            icon={<PlusOutlined />}
                            onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                onCreateFile();
                            }}
                        >
                            Datei hinzufügen
                        </Button>
                    </div>
                    
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
                    <label className="flex items-center">
                        <input type="checkbox" className="mr-2" />
                        Template ist aktiv
                    </label>
                </Form.Item>

                <div className="flex gap-2 justify-end">
                    <Button onClick={onCancel}>
                        Abbrechen
                    </Button>
                    <Button onClick={handleSubmit}>
                        {editingTemplate ? 'Aktualisieren' : 'Erstellen'}
                    </Button>
                </div>
            </Form>
        </Modal>
    );
};

export default TemplateModal;