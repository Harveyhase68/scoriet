import React, { useState } from 'react';
import { Modal, Form, Input, Select, Button, Upload, message } from 'antd';
import { UploadOutlined, DeleteOutlined } from '@ant-design/icons';

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
    const [contentMode, setContentMode] = useState<'text' | 'zip'>('text');
    const [uploadedFile, setUploadedFile] = useState<any>(null);

    // All hooks must be called before any early returns
    React.useEffect(() => {
        if (visible) {
            setTimeout(() => {
                if (editingFile) {
                    // Editing existing file
                    form.setFieldsValue({
                        file_name: editingFile.file_name,
                        output_path: editingFile.output_path || '/',
                        file_content: editingFile.file_content,
                        file_type: editingFile.file_type,
                        file_order: editingFile.file_order,
                    });
                    setContentMode('text');
                    setUploadedFile(null);
                } else {
                    // Creating new file
                    form.resetFields();
                    form.setFieldsValue({
                        file_type: 'project_file',
                        file_order: templateFiles.length,
                        output_path: '/'
                    });
                    setContentMode('text');
                    setUploadedFile(null);
                }
            }, 50);
        }
    }, [visible, editingFile, templateFiles.length, form]);

    // Don't render anything if not visible - AFTER all hooks
    if (!visible) return null;

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();

            // If ZIP mode is selected, include the uploaded file
            if (contentMode === 'zip' && uploadedFile) {
                values.zip_file = uploadedFile;
                values.file_content = null; // Clear text content when using ZIP
            }

            await onSubmit(values);
            form.resetFields();
            setUploadedFile(null);
            setContentMode('text');
        } catch {
            // Form validation failed
        }
    };

    const handleUpload = (file: any) => {
        const isZip = file.type === 'application/zip' || file.name.endsWith('.zip');
        if (!isZip) {
            message.error('Bitte wählen Sie eine ZIP-Datei aus!');
            return false;
        }

        setUploadedFile(file);
        message.success(`${file.name} wurde geladen`);
        return false; // Prevent auto upload
    };

    const removeUploadedFile = () => {
        setUploadedFile(null);
        message.info('ZIP-Datei entfernt');
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
            modalRender={(modal) => (
                <div className="dark-modal">
                    {modal}
                </div>
            )}
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
                    name="output_path"
                    label="Zielverzeichnis"
                    rules={[{ required: true, message: 'Bitte Zielverzeichnis eingeben!' }]}
                    tooltip="Das Verzeichnis, in dem die generierte Datei gespeichert werden soll (z.B. /components/, /services/, /data/)"
                >
                    <Input
                        placeholder="z.B. /components/, /services/, /app/Http/Controllers/"
                        addonBefore="Pfad:"
                    />
                </Form.Item>

                {/* Content Mode Toggle */}
                <div className="mb-4">
                    <label className="block text-sm font-medium mb-2 text-gray-200">
                        Inhaltstyp auswählen:
                    </label>
                    <div className="flex gap-4">
                        <Button
                            type={contentMode === 'text' ? 'primary' : 'default'}
                            onClick={() => setContentMode('text')}
                            size="small"
                        >
                            Text-Eingabe
                        </Button>
                        <Button
                            type={contentMode === 'zip' ? 'primary' : 'default'}
                            onClick={() => setContentMode('zip')}
                            size="small"
                        >
                            ZIP-Upload
                        </Button>
                    </div>
                </div>

                {/* Text Content Input */}
                {contentMode === 'text' && (
                    <Form.Item
                        name="file_content"
                        label="Dateiinhalt"
                        rules={[{ required: contentMode === 'text', message: 'Bitte Dateiinhalt eingeben!' }]}
                    >
                        <TextArea
                            rows={15}
                            placeholder={`Template-Code hier eingeben...

Platzhalter-Beispiele:
- {projectname} - Name des Projekts
- {tablename} - Name der Datenbank-Tabelle
- {item.name} - Name eines Datenbankfelds
- {item.type} - Typ des Datenbankfelds
- {item.typecast} - Typecast für das Feld

Schleifen und Logik:
{for {nmaxitemsnokey}}
  {if {item.typecast}=="(int)"}
    $p_{item.name} = {item.typecast}0;
  {else}
    $p_{item.name} = {item.typecast}"";
  {endif}
{endfor}`}
                            style={{ fontFamily: 'monospace' }}
                        />
                    </Form.Item>
                )}

                {/* ZIP Upload */}
                {contentMode === 'zip' && (
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-2 text-gray-200">
                            ZIP-Datei hochladen
                        </label>
                        {!uploadedFile ? (
                            <Upload.Dragger
                                name="zip_file"
                                beforeUpload={handleUpload}
                                accept=".zip"
                                showUploadList={false}
                                style={{
                                    background: '#1f2937',
                                    border: '2px dashed #4b5563',
                                    borderRadius: '8px',
                                    height: '200px'
                                }}
                            >
                                <div className="flex flex-col items-center justify-center h-full text-gray-300">
                                    <UploadOutlined style={{ fontSize: '48px', color: '#6b7280', marginBottom: '16px' }} />
                                    <p className="text-lg mb-2">ZIP-Datei hier ablegen oder klicken zum Auswählen</p>
                                    <p className="text-sm text-gray-400">
                                        Unterstützt werden .zip Dateien mit Template-Strukturen
                                    </p>
                                </div>
                            </Upload.Dragger>
                        ) : (
                            <div className="border-2 border-green-500 bg-green-900 rounded-lg p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <UploadOutlined className="text-green-400 mr-2" />
                                        <span className="text-green-100">{uploadedFile.name}</span>
                                        <span className="text-green-300 ml-2">
                                            ({(uploadedFile.size / 1024).toFixed(1)} KB)
                                        </span>
                                    </div>
                                    <Button
                                        type="link"
                                        danger
                                        icon={<DeleteOutlined />}
                                        onClick={removeUploadedFile}
                                        size="small"
                                    >
                                        Entfernen
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

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