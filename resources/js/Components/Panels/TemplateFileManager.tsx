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
import { useTranslation, SupportedLanguage, getStoredLanguage } from '@/i18n';

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
  // i18n setup
  const [currentLanguage] = React.useState<SupportedLanguage>(getStoredLanguage());
  const { t } = useTranslation(currentLanguage);
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
                toast.showSuccess(`${t.templatefilemanager107}${editingFile ? t.templatefilemanager107_2 : t.templatefilemanager107_3}`);
                setModalVisible(false);
                onFilesUpdate();
            }
        } catch {
            toast.showError(`${t.templatefilemanager112}${editingFile ? t.applicationsmodal313 : t.teammodal240}${t.templatefilemanager112_2}`);
        }
    };

    const handleDelete = async (id: number) => {
        try {
            const response = await api.delete(`/template-files/${id}`);
            if (response.data.success) {
                toast.showSuccess(t.templatecontroller936);
                onFilesUpdate();
            }
        } catch {
            toast.showError(t.templatefilemanager120);
        }
    };

    const handleMoveFile = async (fileId: number, direction: 'up' | 'down') => {
        try {
            const response = await api.post(`/template-files/${fileId}/move`, { direction });
            if (response.data.success) {
                onFilesUpdate();
            }
        } catch {
            toast.showError(t.templatefilemanager131);
        }
    };

    const confirmDelete = (id: number) => {
        confirmDialog({
            group: 'template-files',
            message: t.templatefilemanager137,
            header: t.templatefilemanager138,
            icon: 'pi pi-exclamation-triangle',
            accept: () => handleDelete(id),
            acceptLabel: 'Ja',
            rejectLabel: t.templatefilemanager142,
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
                    tooltip={t.templatefilemanager175}
                    tooltipOptions={{ position: 'top' }}
                />
                <Button
                    icon="pi pi-arrow-down"
                    rounded
                    text
                    size="small"
                    disabled={index === files.length - 1}
                    onClick={() => handleMoveFile(rowData.id, 'down')}
                    tooltip={t.templatefilemanager185}
                    tooltipOptions={{ position: 'top' }}
                />
                <Button
                    icon="pi pi-pencil"
                    rounded
                    text
                    severity="info"
                    size="small"
                    onClick={() => handleEdit(rowData)}
                    tooltip={t.cmsadminpanel170}
                    tooltipOptions={{ position: 'top' }}
                />
                <Button
                    icon="pi pi-trash"
                    rounded
                    text
                    severity="danger"
                    size="small"
                    onClick={() => confirmDelete(rowData.id)}
                    tooltip={t.cmsadminpanel178}
                    tooltipOptions={{ position: 'top' }}
                />
            </div>
        );
    };

    return (
        <div className="space-y-4">
            <ConfirmDialog group="template-files" />
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">{t.templatefilemanager220}</h3>
                <div className="flex gap-2">
                    <Button
                        icon="pi pi-plus"
                        label={t.templatefilemanager220}
                        size="small"
                        severity="success"
                        onClick={handleCreate}
                    />
                    <Button
                        icon="pi pi-times"
                        label={t.authmodalsesetpasswordmodal162}
                        size="small"
                        severity="secondary"
                        onClick={onClose}
                    />
                </div>
            </div>

            <DataTable
                value={files}
                dataKey="id"
                size="small"
                stripedRows
                showGridlines
                emptyMessage={t.templatefilemanager241}
            >
                <Column field="file_name" header={t.registermodal236} body={nameBodyTemplate} sortable />
                <Column field="file_type" header={t.edittablemodal512} body={typeBodyTemplate} sortable style={{ width: '150px' }} />
                <Column field="file_order" header={t.templatefilemanager245} sortable style={{ width: '120px' }} />
                <Column header={t.templatefilemanager246} body={sizeBodyTemplate} style={{ width: '120px' }} />
                <Column header={t.applicationsmodal354} body={actionsBodyTemplate} style={{ width: '200px' }} />
            </DataTable>

            {/* Create/Edit Modal */}
            <Dialog
                header={editingFile ? t.templatefilemanager256 : t.templatefilemanager252}
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
                                {t.templatefilemanager270}
                            </label>
                            <Controller
                                name="file_name"
                                control={control}
                                rules={{ required: t.filemodal130 }}
                                render={({ field }) => (
                                    <InputText
                                        id="file_name"
                                        {...field}
                                        placeholder={t.templatefilemanager276}
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
                                {t.templatefilemanager293}
                            </label>
                            <Controller
                                name="file_type"
                                control={control}
                                rules={{ required: t.filemodal153 }}
                                render={({ field }) => (
                                    <Dropdown
                                        id="file_type"
                                        value={field.value}
                                        onChange={(e) => field.onChange(e.value)}
                                        options={fileTypes.map(type => ({ label: type, value: type }))}
                                        placeholder={t.templatefilemanager305}
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
                                {t.templatefilemanager318}
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
                            {t.templatefilemanager340}
                        </label>
                        <Controller
                            name="file_content"
                            control={control}
                            rules={{ required: t.filemodal232 }}
                            render={({ field }) => (
                                <InputTextarea
                                    id="file_content"
                                    {...field}
                                    rows={15}
                                    placeholder={t.templatefilemanager347}
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
                            label={t.templatefilemanager361}
                            icon="pi pi-times"
                            severity="secondary"
                            onClick={() => setModalVisible(false)}
                        />
                        <Button
                            type="submit"
                            label={editingFile ? t.applicationsmodal313 : t.teammodal240}
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