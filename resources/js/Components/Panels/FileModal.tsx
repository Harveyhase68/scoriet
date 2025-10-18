import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useToast } from '@/contexts/ToastContext';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dropdown } from 'primereact/dropdown';
import { FileUpload } from 'primereact/fileupload';

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
    const toast = useToast();
    const { control, handleSubmit: handleFormSubmit, reset, formState: { errors } } = useForm({
        defaultValues: {
            file_name: '',
            output_path: '/',
            file_content: '',
            file_type: 'project_file',
            file_order: 0
        }
    });
    const [contentMode, setContentMode] = useState<'text' | 'zip'>('text');
    const [uploadedFile, setUploadedFile] = useState<any>(null);

    // All hooks must be called before any early returns
    React.useEffect(() => {
        if (visible) {
            setTimeout(() => {
                if (editingFile) {
                    // Editing existing file
                    reset({
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
                    reset({
                        file_name: '',
                        output_path: '/',
                        file_content: '',
                        file_type: 'project_file',
                        file_order: templateFiles.length
                    });
                    setContentMode('text');
                    setUploadedFile(null);
                }
            }, 50);
        }
    }, [visible, editingFile, templateFiles.length, reset]);

    // Don't render anything if not visible - AFTER all hooks
    if (!visible) return null;

    const handleSubmit = handleFormSubmit(async (values) => {
        try {
            // If ZIP mode is selected, include the uploaded file
            if (contentMode === 'zip' && uploadedFile) {
                values.zip_file = uploadedFile;
                values.file_content = null; // Clear text content when using ZIP
            }

            await onSubmit(values);
            reset();
            setUploadedFile(null);
            setContentMode('text');
        } catch {
            // Submit failed
        }
    });

    const handleUpload = (file: any) => {
        const isZip = file.type === 'application/zip' || file.name.endsWith('.zip');
        if (!isZip) {
            toast.showError('Bitte wählen Sie eine ZIP-Datei aus!');
            return false;
        }

        setUploadedFile(file);
        toast.showSuccess(`${file.name} wurde geladen`);
        return false; // Prevent auto upload
    };

    const removeUploadedFile = () => {
        setUploadedFile(null);
        toast.showInfo('ZIP-Datei entfernt');
    };

    return (
        <Dialog
            header={editingFile ? 'Datei bearbeiten' : 'Neue Datei hinzufügen'}
            visible={visible}
            onHide={onCancel}
            style={{ width: '700px' }}
            modal
            closable
            draggable
            resizable
        >
            <form className="space-y-4">
                <div className="flex gap-4">
                    {/* File Name */}
                    <div className="flex-1">
                        <label htmlFor="file_name" className="block text-sm font-medium mb-2">
                            Dateiname *
                        </label>
                        <Controller
                            name="file_name"
                            control={control}
                            rules={{ required: 'Bitte Dateinamen eingeben!' }}
                            render={({ field }) => (
                                <InputText
                                    id="file_name"
                                    {...field}
                                    placeholder="e.g., Model.php, component.tsx, config.json"
                                    className="w-full"
                                />
                            )}
                        />
                        {errors.file_name && (
                            <small className="text-red-400 mt-1 block">{errors.file_name.message}</small>
                        )}
                    </div>

                    {/* File Type */}
                    <div className="w-48">
                        <label htmlFor="file_type" className="block text-sm font-medium mb-2">
                            Template-Typ *
                        </label>
                        <Controller
                            name="file_type"
                            control={control}
                            rules={{ required: 'Bitte Typ auswählen!' }}
                            render={({ field }) => (
                                <Dropdown
                                    id="file_type"
                                    value={field.value}
                                    onChange={(e) => field.onChange(e.value)}
                                    options={fileTypes.map(type => ({ label: type.label, value: type.value }))}
                                    placeholder="Typ auswählen"
                                    className="w-full"
                                />
                            )}
                        />
                        {errors.file_type && (
                            <small className="text-red-400 mt-1 block">{errors.file_type.message}</small>
                        )}
                    </div>
                </div>

                {/* Output Path */}
                <div>
                    <label htmlFor="output_path" className="block text-sm font-medium mb-2">
                        Zielverzeichnis *
                        <span className="text-xs text-gray-400 ml-2">
                            (e.g., /components/, /services/, /data/)
                        </span>
                    </label>
                    <Controller
                        name="output_path"
                        control={control}
                        rules={{ required: 'Bitte Zielverzeichnis eingeben!' }}
                        render={({ field }) => (
                            <div className="p-inputgroup">
                                <span className="p-inputgroup-addon">Pfad:</span>
                                <InputText
                                    id="output_path"
                                    {...field}
                                    placeholder="e.g., /components/, /services/, /app/Http/Controllers/"
                                    className="w-full"
                                />
                            </div>
                        )}
                    />
                    {errors.output_path && (
                        <small className="text-red-400 mt-1 block">{errors.output_path.message}</small>
                    )}
                </div>

                {/* Content Mode Toggle */}
                <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">
                        Inhaltstyp auswählen:
                    </label>
                    <div className="flex gap-2">
                        <Button
                            type="button"
                            label="Text-Eingabe"
                            severity={contentMode === 'text' ? 'primary' : 'secondary'}
                            onClick={() => setContentMode('text')}
                            size="small"
                        />
                        <Button
                            type="button"
                            label="ZIP-Upload"
                            severity={contentMode === 'zip' ? 'primary' : 'secondary'}
                            onClick={() => setContentMode('zip')}
                            size="small"
                        />
                    </div>
                </div>

                {/* Text Content Input */}
                {contentMode === 'text' && (
                    <div>
                        <label htmlFor="file_content" className="block text-sm font-medium mb-2">
                            Dateiinhalt {contentMode === 'text' && '*'}
                        </label>
                        <Controller
                            name="file_content"
                            control={control}
                            rules={{ required: contentMode === 'text' ? 'Bitte Dateiinhalt eingeben!' : false }}
                            render={({ field }) => (
                                <InputTextarea
                                    id="file_content"
                                    {...field}
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
                                    className="w-full font-mono"
                                />
                            )}
                        />
                        {errors.file_content && (
                            <small className="text-red-400 mt-1 block">{errors.file_content.message}</small>
                        )}
                    </div>
                )}

                {/* ZIP Upload */}
                {contentMode === 'zip' && (
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-2">
                            ZIP-Datei hochladen
                        </label>
                        {!uploadedFile ? (
                            <FileUpload
                                name="zip_file"
                                accept=".zip"
                                maxFileSize={10000000}
                                customUpload
                                auto
                                chooseLabel="ZIP-Datei auswählen"
                                uploadHandler={(e) => {
                                    if (e.files && e.files.length > 0) {
                                        handleUpload(e.files[0]);
                                    }
                                }}
                                emptyTemplate={
                                    <div className="flex flex-col items-center justify-center p-8 text-gray-300">
                                        <i className="pi pi-upload" style={{ fontSize: '48px', color: '#6b7280', marginBottom: '16px' }}></i>
                                        <p className="text-lg mb-2">ZIP-Datei hier ablegen oder klicken zum Auswählen</p>
                                        <p className="text-sm text-gray-400">
                                            Unterstützt werden .zip Dateien mit Template-Strukturen
                                        </p>
                                    </div>
                                }
                                className="w-full"
                            />
                        ) : (
                            <div className="border-2 border-green-500 bg-green-900 rounded-lg p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <i className="pi pi-check-circle text-green-400 mr-2"></i>
                                        <span className="text-green-100">{uploadedFile.name}</span>
                                        <span className="text-green-300 ml-2">
                                            ({(uploadedFile.size / 1024).toFixed(1)} KB)
                                        </span>
                                    </div>
                                    <Button
                                        type="button"
                                        label="Entfernen"
                                        icon="pi pi-times"
                                        severity="danger"
                                        text
                                        onClick={removeUploadedFile}
                                        size="small"
                                    />
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

                <div className="flex gap-2 justify-end mt-4">
                    <Button
                        type="button"
                        label="Cancel"
                        severity="secondary"
                        onClick={onCancel}
                    />
                    <Button
                        type="button"
                        label={editingFile ? 'Aktualisieren' : 'Hinzufügen'}
                        severity="success"
                        onClick={handleSubmit}
                    />
                </div>
            </form>
        </Dialog>
    );
};

export default FileModal;