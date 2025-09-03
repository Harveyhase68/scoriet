import React from 'react';
import { Modal, Form, Input, Select } from 'antd';
import { Button } from 'primereact/button';

const { TextArea } = Input;
const { Option } = Select;

interface FileModalProps {
    visible: boolean;
    onCancel: () => void;
    onSubmit: (values: any) => Promise<void>;
    editingFile: any;
    templateFiles: any[];
    fileTypes: any[];
}

const FileModal: React.FC<FileModalProps> = ({
    visible,
    onCancel,
    onSubmit,
    editingFile,
    templateFiles,
    fileTypes
}) => {
    const [form] = Form.useForm();

    // All hooks must be called before any early returns
    React.useEffect(() => {
        if (visible) {
            setTimeout(() => {
                if (editingFile) {
                    // Editing existing file
                    form.setFieldsValue({
                        file_name: editingFile.file_name,
                        file_content: editingFile.file_content,
                        file_type: editingFile.file_type,
                        file_order: editingFile.file_order,
                    });
                } else {
                    // Creating new file
                    form.resetFields();
                    form.setFieldsValue({
                        file_type: 'project_file',
                        file_order: templateFiles.length
                    });
                }
            }, 50);
        }
    }, [visible, editingFile, templateFiles.length, form]);

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
            title={editingFile ? 'Datei bearbeiten' : 'Neue Datei hinzufügen'}
            open={visible}
            onCancel={onCancel}
            footer={null}
            width={700}
            className="dark-modal"
            destroyOnHidden={false}
        >
            <Form
                form={form}
                layout="vertical"
            >
                <div className="flex gap-4">
                    <Form.Item
                        name="file_name"
                        label="Dateiname"
                        rules={[{ required: true, message: 'Bitte Dateinamen eingeben!' }]}
                        className="flex-1"
                    >
                        <Input placeholder="z.B. Model.php, component.tsx, config.json" />
                    </Form.Item>

                    <Form.Item
                        name="file_type"
                        label="Template-Typ"
                        rules={[{ required: true, message: 'Bitte Typ auswählen!' }]}
                        className="w-48"
                    >
                        <Select placeholder="Typ auswählen">
                            {fileTypes.map(type => (
                                <Option key={type.value} value={type.value}>
                                    {type.label}
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>
                </div>

                <Form.Item
                    name="file_content"
                    label="Dateiinhalt"
                    rules={[{ required: true, message: 'Bitte Dateiinhalt eingeben!' }]}
                >
                    <TextArea 
                        rows={15}
                        placeholder={`Template-Code hier eingeben...

Platzhalter-Beispiele:
- {projectname} - Name des Projekts
- {tablename} - Name der Datenbank-Tabelle  
- {fieldname} - Name eines Datenbankfelds
- {modelname} - Name des Models (Klasse)

Schleifen für DB-Tabellen:
{for tables}{tablename}{endfor}
{for fields}{fieldname} {fieldtype}{endfor}`}
                        style={{ fontFamily: 'monospace' }}
                    />
                </Form.Item>

                <div className="bg-gray-600 p-3 rounded mb-4 text-gray-100">
                    <strong className="text-gray-100">Template-Typen:</strong>
                    <ul className="mt-2 text-sm text-gray-200">
                        {fileTypes.map(type => (
                            <li key={type.value} className="mb-1">
                                <strong className="text-gray-100">{type.label}:</strong> {type.description}
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="flex gap-2 justify-between">
                    <Button onClick={onCancel} className="bg-green-600 hover:bg-green-700 text-white border-green-600">
                        Fertig - Zurück zum Template
                    </Button>
                    <div className="flex gap-2">
                        <Button onClick={handleSubmit}>
                            {editingFile ? 'Aktualisieren' : 'Hinzufügen'}
                        </Button>
                    </div>
                </div>
            </Form>
        </Modal>
    );
};

export default FileModal;