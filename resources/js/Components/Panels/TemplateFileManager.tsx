import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useToast } from '@/contexts/ToastContext';
import { Dialog } from 'primereact/dialog';
import { Tag } from 'primereact/tag';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { confirmDialog } from 'primereact/confirmdialog';
import { ConfirmDialog } from 'primereact/confirmdialog';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dropdown } from 'primereact/dropdown';
import { apiClient as api } from '@/lib/api';

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
    const toast = useToast();
    const [modalVisible, setModalVisible] = useState(false);
    const [editingFile, setEditingFile] = useState<TemplateFile | null>(null);

    const { control, handleSubmit, reset, formState: { errors } } = useForm({
        defaultValues: {
            file_name: '',
            file_content: '',
            file_type: 'template',
            file_order: 0
        }
    });

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
        reset({
            file_name: '',
            file_content: '',
            file_type: 'template',
            file_order: files.length
        });
        setModalVisible(true);
    };

    const handleEdit = (file: TemplateFile) => {
        setEditingFile(file);
        reset({
            file_name: file.file_name,
            file_content: file.file_content,
            file_type: file.file_type,
            file_order: file.file_order,
        });
        setModalVisible(true);
    };

    const onSubmit = async (values: any) => {
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
                toast.showSuccess(`Datei erfolgreich ${editingFile ? 'aktualisiert' : 'erstellt'}`);
                setModalVisible(false);
                onFilesUpdate();
            }
        } catch {
            toast.showError(`Fehler beim ${editingFile ? 'Aktualisieren' : 'Erstellen'} der Datei`);
        }
    };

    const handleDelete = async (id: number) => {
        try {
            const response = await api.delete(`/template-files/${id}`);
            if (response.data.success) {
                toast.showSuccess('Datei erfolgreich gelöscht');
                onFilesUpdate();
            }
        } catch {
            toast.showError('Fehler beim Löschen der Datei');
        }
    };

    const handleMoveFile = async (fileId: number, direction: 'up' | 'down') => {
        try {
            const response = await api.post(`/template-files/${fileId}/move`, { direction });
            if (response.data.success) {
                onFilesUpdate();
            }
        } catch {
            toast.showError('Fehler beim Verschieben der Datei');
        }
    };

    const confirmDelete = (id: number) => {
        confirmDialog({
            message: 'Sind Sie sicher, dass Sie diese Datei löschen möchten?',
            header: 'Datei löschen?',
            icon: 'pi pi-exclamation-triangle',
            accept: () => handleDelete(id),
            acceptLabel: 'Ja',
            rejectLabel: 'Nein',
            acceptClassName: 'p-button-danger'
        });
    };

    const nameBodyTemplate = (rowData: TemplateFile) => {
        return (
            <span>
                <i className="pi pi-file mr-2"></i>
                {rowData.file_name}
            </span>
        );
    };

    const typeBodyTemplate = (rowData: TemplateFile) => {
        return <Tag value={rowData.file_type} severity="info" />;
    };

    const sizeBodyTemplate = (rowData: TemplateFile) => {
        return `${rowData.file_content.length} Zeichen`;
    };

    const actionsBodyTemplate = (rowData: TemplateFile) => {
        const index = files.indexOf(rowData);
        return (
            <div className="flex gap-1">
                <Button
                    icon="pi pi-arrow-up"
                    rounded
                    text
                    size="small"
                    disabled={index === 0}
                    onClick={() => handleMoveFile(rowData.id, 'up')}
                    tooltip="Nach oben"
                    tooltipOptions={{ position: 'top' }}
                />
                <Button
                    icon="pi pi-arrow-down"
                    rounded
                    text
                    size="small"
                    disabled={index === files.length - 1}
                    onClick={() => handleMoveFile(rowData.id, 'down')}
                    tooltip="Nach unten"
                    tooltipOptions={{ position: 'top' }}
                />
                <Button
                    icon="pi pi-pencil"
                    rounded
                    text
                    severity="info"
                    size="small"
                    onClick={() => handleEdit(rowData)}
                    tooltip="Bearbeiten"
                    tooltipOptions={{ position: 'top' }}
                />
                <Button
                    icon="pi pi-trash"
                    rounded
                    text
                    severity="danger"
                    size="small"
                    onClick={() => confirmDelete(rowData.id)}
                    tooltip="Löschen"
                    tooltipOptions={{ position: 'top' }}
                />
            </div>
        );
    };

    return (
        <div className="space-y-4">
            <ConfirmDialog />
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Template Dateien verwalten</h3>
                <div className="flex gap-2">
                    <Button
                        icon="pi pi-plus"
                        label="Neue Datei"
                        size="small"
                        severity="success"
                        onClick={handleCreate}
                    />
                    <Button
                        icon="pi pi-times"
                        label="Schließen"
                        size="small"
                        severity="secondary"
                        onClick={onClose}
                    />
                </div>
            </div>

            <DataTable
                value={files}
                rowKey="id"
                size="small"
                stripedRows
                showGridlines
                emptyMessage="Keine Dateien vorhanden"
            >
                <Column field="file_name" header="Name" body={nameBodyTemplate} sortable />
                <Column field="file_type" header="Typ" body={typeBodyTemplate} sortable style={{ width: '150px' }} />
                <Column field="file_order" header="Reihenfolge" sortable style={{ width: '120px' }} />
                <Column header="Größe" body={sizeBodyTemplate} style={{ width: '120px' }} />
                <Column header="Aktionen" body={actionsBodyTemplate} style={{ width: '200px' }} />
            </DataTable>

            {/* Create/Edit Modal */}
            <Dialog
                header={editingFile ? 'Datei bearbeiten' : 'Neue Datei erstellen'}
                visible={modalVisible}
                onHide={() => setModalVisible(false)}
                style={{ width: '800px' }}
                modal
                closable
                draggable={true}
                resizable={true}
            >
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
                                        placeholder="e.g., Model.php, component.tsx"
                                        className="w-full"
                                    />
                                )}
                            />
                            {errors.file_name && (
                                <small className="text-red-400 mt-1 block">{errors.file_name.message}</small>
                            )}
                        </div>

                        {/* File Type */}
                        <div className="w-40">
                            <label htmlFor="file_type" className="block text-sm font-medium mb-2">
                                Typ *
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
                                        options={fileTypes.map(type => ({ label: type, value: type }))}
                                        placeholder="Typ auswählen"
                                        className="w-full"
                                    />
                                )}
                            />
                            {errors.file_type && (
                                <small className="text-red-400 mt-1 block">{errors.file_type.message}</small>
                            )}
                        </div>

                        {/* File Order */}
                        <div className="w-32">
                            <label htmlFor="file_order" className="block text-sm font-medium mb-2">
                                Reihenfolge
                            </label>
                            <Controller
                                name="file_order"
                                control={control}
                                render={({ field }) => (
                                    <InputText
                                        id="file_order"
                                        type="number"
                                        value={field.value?.toString()}
                                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                        min={0}
                                        className="w-full"
                                    />
                                )}
                            />
                        </div>
                    </div>

                    {/* File Content */}
                    <div>
                        <label htmlFor="file_content" className="block text-sm font-medium mb-2">
                            Dateiinhalt *
                        </label>
                        <Controller
                            name="file_content"
                            control={control}
                            rules={{ required: 'Bitte Dateiinhalt eingeben!' }}
                            render={({ field }) => (
                                <InputTextarea
                                    id="file_content"
                                    {...field}
                                    rows={15}
                                    placeholder="Template-Code hier eingeben..."
                                    className="w-full font-mono"
                                />
                            )}
                        />
                        {errors.file_content && (
                            <small className="text-red-400 mt-1 block">{errors.file_content.message}</small>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 justify-end">
                        <Button
                            type="button"
                            label="Abbrechen"
                            icon="pi pi-times"
                            severity="secondary"
                            onClick={() => setModalVisible(false)}
                        />
                        <Button
                            type="submit"
                            label={editingFile ? 'Aktualisieren' : 'Erstellen'}
                            icon="pi pi-check"
                            severity="success"
                        />
                    </div>
                </form>
            </Dialog>
        </div>
    );
};

export default TemplateFileManager;