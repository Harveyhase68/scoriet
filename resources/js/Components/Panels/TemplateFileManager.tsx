import React, { useState } from 'react';
import { Button, Table, Modal, Form, Input, Select, Space, message, Popconfirm, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, FileOutlined, UpOutlined, DownOutlined } from '@ant-design/icons';
import { apiClient as api } from '@/lib/api';

const { TextArea } = Input;
const { Option } = Select;

interface TemplateFile {
    id: number;
    file_name: string;
    file_path: string;
    file_content: string;
    file_type: string;
    file_order: number;
}

interface TemplateFileManagerProps {
    templateId: number;
    files: TemplateFile[];
    onFilesUpdate: () => void;
    onClose: () => void;
}

const TemplateFileManager: React.FC<TemplateFileManagerProps> = ({
    templateId,
    files,
    onFilesUpdate,
    onClose
}) => {
    const [modalVisible, setModalVisible] = useState(false);
    const [editingFile, setEditingFile] = useState<TemplateFile | null>(null);
    const [form] = Form.useForm();

    const fileTypes = [
        'template',
        'config',
        'script',
        'style',
        'component',
        'model',
        'controller',
        'service',
        'test',
        'documentation'
    ];

    const handleCreate = () => {
        setEditingFile(null);
        form.resetFields();
        form.setFieldsValue({
            file_type: 'template',
            file_order: files.length
        });
        setModalVisible(true);
    };

    const handleEdit = (file: TemplateFile) => {
        setEditingFile(file);
        form.setFieldsValue({
            file_name: file.file_name,
            file_content: file.file_content,
            file_type: file.file_type,
            file_order: file.file_order,
        });
        setModalVisible(true);
    };

    const handleSubmit = async (values: any) => {
        try {
            const fileData = {
                file_name: values.file_name,
                file_content: values.file_content,
                file_type: values.file_type,
                file_order: values.file_order || 0,
            };

            let response;
            if (editingFile) {
                response = await api.put(`/template-files/${editingFile.id}`, fileData);
            } else {
                response = await api.post(`/templates/${templateId}/files`, fileData);
            }

            if (response.data.success) {
                message.success(`Datei erfolgreich ${editingFile ? 'aktualisiert' : 'erstellt'}`);
                setModalVisible(false);
                onFilesUpdate();
            }
        } catch (saveError) {
            console.error('Save file error:', saveError);
            message.error(`Fehler beim ${editingFile ? 'Aktualisieren' : 'Erstellen'} der Datei`);
        }
    };

    const handleDelete = async (id: number) => {
        try {
            const response = await api.delete(`/template-files/${id}`);
            if (response.data.success) {
                message.success('Datei erfolgreich gelöscht');
                onFilesUpdate();
            }
        } catch (deleteError) {
            console.error('Delete file error:', deleteError);
            message.error('Fehler beim Löschen der Datei');
        }
    };

    const handleMoveFile = async (fileId: number, direction: 'up' | 'down') => {
        try {
            const response = await api.post(`/template-files/${fileId}/move`, { direction });
            if (response.data.success) {
                onFilesUpdate();
            }
        } catch (moveError) {
            console.error('Move file error:', moveError);
            message.error('Fehler beim Verschieben der Datei');
        }
    };

    const columns = [
        {
            title: 'Name',
            dataIndex: 'file_name',
            key: 'file_name',
            render: (name: string) => (
                <span>
                    <FileOutlined className="mr-2" />
                    {name}
                </span>
            ),
        },
        {
            title: 'Typ',
            dataIndex: 'file_type',
            key: 'file_type',
            render: (type: string) => (
                <Tag color="blue">{type}</Tag>
            ),
        },
        {
            title: 'Reihenfolge',
            dataIndex: 'file_order',
            key: 'file_order',
            width: 100,
        },
        {
            title: 'Größe',
            dataIndex: 'file_content',
            key: 'size',
            width: 100,
            render: (content: string) => `${content.length} Zeichen`,
        },
        {
            title: 'Aktionen',
            key: 'actions',
            width: 200,
            render: (_, record: TemplateFile, index: number) => (
                <Space>
                    <Button
                        type="text"
                        size="small"
                        icon={<UpOutlined />}
                        disabled={index === 0}
                        onClick={() => handleMoveFile(record.id, 'up')}
                        title="Nach oben"
                    />
                    <Button
                        type="text"
                        size="small"
                        icon={<DownOutlined />}
                        disabled={index === files.length - 1}
                        onClick={() => handleMoveFile(record.id, 'down')}
                        title="Nach unten"
                    />
                    <Button
                        type="text"
                        size="small"
                        icon={<EditOutlined />}
                        onClick={() => handleEdit(record)}
                    />
                    <Popconfirm
                        title="Datei löschen?"
                        description="Sind Sie sicher, dass Sie diese Datei löschen möchten?"
                        onConfirm={() => handleDelete(record.id)}
                        okText="Ja"
                        cancelText="Nein"
                    >
                        <Button
                            type="text"
                            size="small"
                            danger
                            icon={<DeleteOutlined />}
                        />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Template Dateien verwalten</h3>
                <Space>
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={handleCreate}
                    >
                        Neue Datei
                    </Button>
                    <Button onClick={onClose}>
                        Schließen
                    </Button>
                </Space>
            </div>

            <Table
                columns={columns}
                dataSource={files}
                rowKey="id"
                pagination={false}
                size="small"
            />

            {/* Create/Edit Modal */}
            <Modal
                title={editingFile ? 'Datei bearbeiten' : 'Neue Datei erstellen'}
                open={modalVisible}
                onCancel={() => setModalVisible(false)}
                footer={null}
                width={800}
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                >
                    <div className="flex gap-4">
                        <Form.Item
                            name="file_name"
                            label="Dateiname"
                            rules={[{ required: true, message: 'Bitte Dateinamen eingeben!' }]}
                            className="flex-1"
                        >
                            <Input placeholder="z.B. Model.php, component.tsx" />
                        </Form.Item>

                        <Form.Item
                            name="file_type"
                            label="Typ"
                            rules={[{ required: true, message: 'Bitte Typ auswählen!' }]}
                            className="w-40"
                        >
                            <Select placeholder="Typ auswählen">
                                {fileTypes.map(type => (
                                    <Option key={type} value={type}>{type}</Option>
                                ))}
                            </Select>
                        </Form.Item>

                        <Form.Item
                            name="file_order"
                            label="Reihenfolge"
                            className="w-32"
                        >
                            <Input type="number" min={0} />
                        </Form.Item>
                    </div>

                    <Form.Item
                        name="file_content"
                        label="Dateiinhalt"
                        rules={[{ required: true, message: 'Bitte Dateiinhalt eingeben!' }]}
                    >
                        <TextArea 
                            rows={15}
                            placeholder="Template-Code hier eingeben..."
                            style={{ fontFamily: 'monospace' }}
                        />
                    </Form.Item>

                    <div className="flex gap-2 justify-end">
                        <Button onClick={() => setModalVisible(false)}>
                            Abbrechen
                        </Button>
                        <Button type="primary" htmlType="submit">
                            {editingFile ? 'Aktualisieren' : 'Erstellen'}
                        </Button>
                    </div>
                </Form>
            </Modal>
        </div>
    );
};

export default TemplateFileManager;