import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useToast } from '@/contexts/ToastContext';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { confirmDialog } from 'primereact/confirmdialog';
import { ConfirmDialog } from 'primereact/confirmdialog';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { InputNumber } from 'primereact/inputnumber';
import { InputSwitch } from 'primereact/inputswitch';
import { Dropdown } from 'primereact/dropdown';
import { api } from '@/lib/api';

interface Language {
  id: number;
  code: string;
  name: string;
  native_name: string;
  flag?: string;
  is_active: boolean;
  is_default: boolean;
  sort_order: number;
  description?: string;
  created_by?: number;
  creator?: {
    id: number;
    name: string;
  };
  created_at: string;
  updated_at: string;
}

interface LanguageFormData {
  code: string;
  name: string;
  native_name: string;
  flag?: string;
  is_active: boolean;
  is_default: boolean;
  sort_order: number;
  description?: string;
}

export default function LanguageManagementPanel() {
  const toast = useToast();
  const [languages, setLanguages] = useState<Language[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingLanguage, setEditingLanguage] = useState<Language | null>(null);

  const { control, handleSubmit, reset, formState: { errors } } = useForm<LanguageFormData>({
    defaultValues: {
      code: '',
      name: '',
      native_name: '',
      flag: '',
      is_active: true,
      is_default: false,
      sort_order: 0,
      description: ''
    }
  });

  useEffect(() => {
    const fetchLanguages = async () => {
        setLoading(true);
        try {
          const response = await api.request('/languages');
          setLanguages(response);
        } catch (error: any) {
          if (error.response?.status === 403) {
            toast.showError('Unauthorized. System admin access required.');
          } else {
            toast.showError('Failed to load languages: ' + (error.response?.data?.message || error.message));
          }
        } finally {
          setLoading(false);
        }
    };

    fetchLanguages();
  }, [toast]);

  const handleCreate = () => {
    setEditingLanguage(null);
    reset({
      code: '',
      name: '',
      native_name: '',
      flag: '',
      is_active: true,
      is_default: false,
      sort_order: languages.length + 1,
      description: ''
    });
    setModalVisible(true);
  };

  const handleEdit = (language: Language) => {
    setEditingLanguage(language);
    reset({
      code: language.code,
      name: language.name,
      native_name: language.native_name,
      flag: language.flag || '',
      is_active: language.is_active,
      is_default: language.is_default,
      sort_order: language.sort_order,
      description: language.description || ''
    });
    setModalVisible(true);
  };

  const confirmDelete = (language: Language) => {
    confirmDialog({
      message: 'Are you sure you want to delete this language?',
      header: 'Delete Language',
      icon: 'pi pi-exclamation-triangle',
      accept: () => handleDelete(language),
      acceptLabel: 'Yes',
      rejectLabel: 'No',
      acceptClassName: 'p-button-danger'
    });
  };

  const handleDelete = async (language: Language) => {
    try {
      await api.request(`/languages/${language.id}`, { method: 'DELETE' });
      toast.showSuccess('Language deleted successfully');
      fetchLanguages();
    } catch (error: any) {
      toast.showError('Failed to delete language: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleToggleActive = async (language: Language) => {
    try {
      await api.request(`/languages/${language.id}/toggle-active`, { method: 'PATCH' });
      toast.showSuccess(`Language ${language.is_active ? 'deactivated' : 'activated'} successfully`);
      fetchLanguages();
    } catch (error: any) {
      toast.showError('Failed to toggle language status: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleSetDefault = async (language: Language) => {
    try {
      await api.request(`/languages/${language.id}/set-default`, { method: 'PATCH' });
      toast.showSuccess('Default language updated successfully');
      fetchLanguages();
    } catch (error: any) {
      toast.showError('Failed to set default language: ' + (error.response?.data?.message || error.message));
    }
  };

  const onSubmit = async (values: LanguageFormData) => {
    try {
      if (editingLanguage) {
        await api.request(`/languages/${editingLanguage.id}`, {
          method: 'PUT',
          body: JSON.stringify(values)
        });
        toast.showSuccess('Language updated successfully');
      } else {
        await api.request('/languages', {
          method: 'POST',
          body: JSON.stringify(values)
        });
        toast.showSuccess('Language created successfully');
      }
      setModalVisible(false);
      fetchLanguages();
    } catch (error: any) {
      toast.showError('Failed to save language: ' + (error.response?.data?.message || error.message));
    }
  };

  const commonFlags = [
    { value: '🇺🇸', label: '🇺🇸 United States' },
    { value: '🇬🇧', label: '🇬🇧 United Kingdom' },
    { value: '🇩🇪', label: '🇩🇪 Germany' },
    { value: '🇫🇷', label: '🇫🇷 France' },
    { value: '🇪🇸', label: '🇪🇸 Spain' },
    { value: '🇮🇹', label: '🇮🇹 Italy' },
    { value: '🇳🇱', label: '🇳🇱 Netherlands' },
    { value: '🇵🇹', label: '🇵🇹 Portugal' },
    { value: '🇷🇺', label: '🇷🇺 Russia' },
    { value: '🇯🇵', label: '🇯🇵 Japan' },
    { value: '🇰🇷', label: '🇰🇷 South Korea' },
    { value: '🇨🇳', label: '🇨🇳 China' },
    { value: '🇧🇷', label: '🇧🇷 Brazil' },
    { value: '🇲🇽', label: '🇲🇽 Mexico' },
    { value: '🇨🇦', label: '🇨🇦 Canada' },
    { value: '🇦🇺', label: '🇦🇺 Australia' },
    { value: '🇮🇳', label: '🇮🇳 India' },
  ];

  const flagBodyTemplate = (rowData: Language) => {
    return rowData.flag || '🏴';
  };

  const codeBodyTemplate = (rowData: Language) => {
    return <Tag value={rowData.code.toUpperCase()} severity="info" />;
  };

  const statusBodyTemplate = (rowData: Language) => {
    return (
      <div className="flex gap-1">
        <Tag
          value={rowData.is_active ? 'Active' : 'Inactive'}
          severity={rowData.is_active ? 'success' : 'danger'}
        />
        {rowData.is_default && <Tag value="Default" severity="warning" />}
      </div>
    );
  };

  const creatorBodyTemplate = (rowData: Language) => {
    return rowData.creator?.name || 'System';
  };

  const descriptionBodyTemplate = (rowData: Language) => {
    return rowData.description || '-';
  };

  const actionsBodyTemplate = (rowData: Language) => {
    return (
      <div className="flex gap-1">
        <Button
          icon="pi pi-pencil"
          rounded
          text
          size="small"
          severity="info"
          onClick={() => handleEdit(rowData)}
          tooltip="Edit Language"
          tooltipOptions={{ position: 'top' }}
        />

        <Button
          icon={rowData.is_active ? "pi pi-eye-slash" : "pi pi-eye"}
          rounded
          text
          size="small"
          severity={rowData.is_active ? "warning" : "success"}
          onClick={() => handleToggleActive(rowData)}
          tooltip={rowData.is_active ? 'Deactivate' : 'Activate'}
          tooltipOptions={{ position: 'top' }}
          disabled={rowData.is_default && rowData.is_active}
        />

        {!rowData.is_default && (
          <Button
            icon="pi pi-star"
            rounded
            text
            size="small"
            severity="help"
            onClick={() => handleSetDefault(rowData)}
            tooltip="Set as Default"
            tooltipOptions={{ position: 'top' }}
            disabled={!rowData.is_active}
          />
        )}

        <Button
          icon="pi pi-trash"
          rounded
          text
          size="small"
          severity="danger"
          onClick={() => confirmDelete(rowData)}
          tooltip={rowData.is_default ? 'Cannot delete default language' : 'Delete Language'}
          tooltipOptions={{ position: 'top' }}
          disabled={rowData.is_default}
        />
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-gray-800 text-gray-100">
      <ConfirmDialog />
      <div className="flex-shrink-0 p-4 border-b border-gray-700 bg-gray-800">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold text-white">
              Language Management
            </h3>
            <p className="text-sm text-gray-300">
              Manage languages for content translation (System Admin Only)
            </p>
          </div>
          <Button
            icon="pi pi-plus"
            label="Add Language"
            size="small"
            severity="info"
            onClick={handleCreate}
          />
        </div>
      </div>

      <div className="flex-1 p-4 overflow-auto bg-gray-800">
        <div className="rounded-lg shadow-sm overflow-hidden bg-gray-700">
          <DataTable
            value={languages}
            rowKey="id"
            loading={loading}
            paginator
            rows={20}
            rowsPerPageOptions={[10, 20, 50]}
            paginatorTemplate="RowsPerPageDropdown FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink"
            currentPageReportTemplate="{first}-{last} of {total} languages"
            size="small"
            stripedRows
            showGridlines
            scrollable
            scrollHeight="calc(100vh - 300px)"
            emptyMessage="No languages found"
          >
            <Column field="flag" header="Flag" body={flagBodyTemplate} style={{ width: '80px' }} />
            <Column field="code" header="Code" body={codeBodyTemplate} sortable style={{ width: '100px' }} />
            <Column field="name" header="Name" sortable style={{ width: '150px' }} />
            <Column field="native_name" header="Native Name" sortable style={{ width: '150px' }} />
            <Column header="Status" body={statusBodyTemplate} style={{ width: '150px' }} />
            <Column field="sort_order" header="Sort Order" sortable style={{ width: '120px' }} />
            <Column header="Creator" body={creatorBodyTemplate} style={{ width: '120px' }} />
            <Column field="description" header="Description" body={descriptionBodyTemplate} />
            <Column header="Actions" body={actionsBodyTemplate} style={{ width: '200px' }} />
          </DataTable>
        </div>
      </div>

        <Dialog
          header={editingLanguage ? 'Edit Language' : 'Add New Language'}
          visible={modalVisible}
          onHide={() => setModalVisible(false)}
          style={{ width: '600px' }}
          modal
          closable
          draggable
          resizable
          footer={
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                label="Cancel"
                icon="pi pi-times"
                severity="secondary"
                onClick={() => setModalVisible(false)}
              />
              <Button
                type="button"
                label={editingLanguage ? 'Update' : 'Create'}
                icon="pi pi-check"
                severity="success"
                onClick={handleSubmit(onSubmit)}
              />
            </div>
          }
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {/* Language Code */}
              <div>
                <label htmlFor="code" className="block text-sm font-medium mb-2">
                  Language Code *
                </label>
                <Controller
                  name="code"
                  control={control}
                  rules={{
                    required: 'Please enter language code',
                    maxLength: { value: 5, message: 'Code must be 5 characters or less' },
                    pattern: { value: /^[a-z]{2,3}(-[A-Z]{2})?$/, message: 'Please enter valid language code (e.g., en, de, en-US)' }
                  }}
                  render={({ field }) => (
                    <InputText
                      id="code"
                      {...field}
                      placeholder="e.g., en, de, fr"
                      className="w-full"
                    />
                  )}
                />
                {errors.code && (
                  <small className="text-red-400 mt-1 block">{errors.code.message}</small>
                )}
              </div>

              {/* Flag */}
              <div>
                <label htmlFor="flag" className="block text-sm font-medium mb-2">
                  Flag
                </label>
                <Controller
                  name="flag"
                  control={control}
                  render={({ field }) => (
                    <Dropdown
                      id="flag"
                      value={field.value}
                      onChange={(e) => field.onChange(e.value)}
                      options={commonFlags}
                      placeholder="Select flag"
                      showClear
                      filter
                      className="w-full"
                    />
                  )}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* English Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium mb-2">
                  English Name *
                </label>
                <Controller
                  name="name"
                  control={control}
                  rules={{
                    required: 'Please enter language name',
                    maxLength: { value: 100, message: 'Name must be 100 characters or less' }
                  }}
                  render={({ field }) => (
                    <InputText
                      id="name"
                      {...field}
                      placeholder="e.g., English, German, French"
                      className="w-full"
                    />
                  )}
                />
                {errors.name && (
                  <small className="text-red-400 mt-1 block">{errors.name.message}</small>
                )}
              </div>

              {/* Native Name */}
              <div>
                <label htmlFor="native_name" className="block text-sm font-medium mb-2">
                  Native Name *
                </label>
                <Controller
                  name="native_name"
                  control={control}
                  rules={{
                    required: 'Please enter native language name',
                    maxLength: { value: 100, message: 'Native name must be 100 characters or less' }
                  }}
                  render={({ field }) => (
                    <InputText
                      id="native_name"
                      {...field}
                      placeholder="e.g., English, Deutsch, Français"
                      className="w-full"
                    />
                  )}
                />
                {errors.native_name && (
                  <small className="text-red-400 mt-1 block">{errors.native_name.message}</small>
                )}
              </div>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium mb-2">
                Description
              </label>
              <Controller
                name="description"
                control={control}
                rules={{
                  maxLength: { value: 1000, message: 'Description must be 1000 characters or less' }
                }}
                render={({ field }) => (
                  <InputTextarea
                    id="description"
                    {...field}
                    rows={3}
                    placeholder="Optional description of the language"
                    className="w-full"
                  />
                )}
              />
              {errors.description && (
                <small className="text-red-400 mt-1 block">{errors.description.message}</small>
              )}
            </div>

            <div className="grid grid-cols-3 gap-4">
              {/* Sort Order */}
              <div>
                <label htmlFor="sort_order" className="block text-sm font-medium mb-2">
                  Sort Order *
                </label>
                <Controller
                  name="sort_order"
                  control={control}
                  rules={{
                    required: 'Please enter sort order',
                    min: { value: 0, message: 'Sort order must be 0 or greater' }
                  }}
                  render={({ field }) => (
                    <InputNumber
                      id="sort_order"
                      value={field.value}
                      onValueChange={(e) => field.onChange(e.value)}
                      min={0}
                      className="w-full"
                    />
                  )}
                />
                {errors.sort_order && (
                  <small className="text-red-400 mt-1 block">{errors.sort_order.message}</small>
                )}
              </div>

              {/* Active */}
              <div>
                <label htmlFor="is_active" className="block text-sm font-medium mb-2">
                  Active
                </label>
                <Controller
                  name="is_active"
                  control={control}
                  render={({ field }) => (
                    <InputSwitch
                      id="is_active"
                      checked={field.value}
                      onChange={(e) => field.onChange(e.value)}
                    />
                  )}
                />
              </div>

              {/* Default Language */}
              <div>
                <label htmlFor="is_default" className="block text-sm font-medium mb-2">
                  Default Language
                </label>
                <Controller
                  name="is_default"
                  control={control}
                  render={({ field }) => (
                    <InputSwitch
                      id="is_default"
                      checked={field.value}
                      onChange={(e) => field.onChange(e.value)}
                    />
                  )}
                />
              </div>
            </div>
          </form>
        </Dialog>
      </div>
    );
}