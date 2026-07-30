import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useToast } from '@/contexts/ToastContext';
import { useTheme } from '@/contexts/ThemeContext';
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
import { Checkbox } from 'primereact/checkbox';
import { Dropdown } from 'primereact/dropdown';
import { api } from '@/lib/api';
import { useTranslation, SupportedLanguage, getStoredLanguage } from '@/i18n';

interface Language {
  id: number;
  code: string;
  name: string;
  native_name: string;
  flag: string;
  is_active: number;
  is_default: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

interface LanguageFormData {
  code: string;
  name: string;
  native_name: string;
  flag: string;
  is_active: number;
  is_default: number;
  sort_order: number;
}

export default function LanguageManagementPanel() {
  const [currentLanguage] = React.useState<SupportedLanguage>(getStoredLanguage());
  const { t } = useTranslation(currentLanguage);
  const toast = useToast();
  const { colors } = useTheme();
  const [languages, setLanguages] = useState<Language[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [editing, setEditing] = useState<Language | null>(null);
  const [viewing, setViewing] = useState<Language | null>(null);

  const defaultValues: LanguageFormData = {
    code: '',
    name: '',
    native_name: '',
    flag: '',
    is_active: 0,
    is_default: 0,
    sort_order: 0,
  };

  const { control, handleSubmit, reset, formState: { errors } } = useForm<LanguageFormData>({ defaultValues });

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await api.get('/languages');
      setLanguages(data);
    } catch (error: any) { toast.showError('Failed: ' + (error.message || error)); } finally { setLoading(false); }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = () => { setEditing(null); reset(defaultValues); setModalVisible(true); };

  const handleEdit = (record: Language) => {
    setEditing(record);
    reset({
      code: record.code,
      name: record.name,
      native_name: record.native_name,
      flag: record.flag,
      is_active: record.is_active,
      is_default: record.is_default,
      sort_order: record.sort_order,
    });
    setModalVisible(true);
  };

  const handleView = (record: Language) => { setViewing(record); setViewModalVisible(true); };

  const confirmDelete = (record: Language) => {
    confirmDialog({ group: 'languages-mgmt', message: 'Are you sure?', header: 'Confirm',
      icon: 'pi pi-exclamation-triangle', accept: () => handleDelete(record),
      acceptLabel: 'Delete', rejectLabel: 'Cancel', acceptClassName: 'p-button-danger' });
  };

  const handleDelete = async (record: Language) => {
    try { await api.delete('/languages/' + record.id); toast.showSuccess('Deleted.'); fetchData(); }
    catch (error: any) { toast.showError('Error: ' + (error.message || error)); }
  };

  const onSubmit = async (values: LanguageFormData) => {
    try {
      if (editing) { await api.put('/languages/' + editing.id, values); toast.showSuccess('Updated.'); }
      else { await api.post('/languages', values); toast.showSuccess('Created.'); }
      setModalVisible(false); await fetchData();
    } catch (error: any) { toast.showError('Error: ' + (error.message || error)); }
  };

  const actionsBodyTemplate = (rowData: Language) => (
    <div className="flex gap-1">
      <Button icon="pi pi-eye" rounded text size="small" severity="info" onClick={() => handleView(rowData)} tooltip="View" tooltipOptions={{ position: 'top' }} />
      <Button icon="pi pi-pencil" rounded text size="small" severity="warning" onClick={() => handleEdit(rowData)} tooltip="Edit" tooltipOptions={{ position: 'top' }} />
      <Button icon="pi pi-trash" rounded text size="small" severity="danger" onClick={() => confirmDelete(rowData)} tooltip="Delete" tooltipOptions={{ position: 'top' }} />
    </div>
  );

  return (
    <div className="h-full flex flex-col" style={{ backgroundColor: colors.bgPrimary, color: colors.textPrimary }}>
      <ConfirmDialog group="languages-mgmt" />

      {/* Header */}
      <div className="flex-shrink-0 p-4" style={{ borderBottom: '1px solid ' + colors.borderPrimary }}>
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold" style={{ color: colors.textPrimary }}>Language Management</h3>
          <Button icon="pi pi-plus" label="+ Add" size="small" severity="info" onClick={handleCreate} />
        </div>
      </div>

      {/* DataTable */}
      <div className="flex-1 p-4 overflow-auto" style={{ backgroundColor: colors.bgPrimary }}>
        <div className="rounded-lg shadow-sm overflow-hidden" style={{ backgroundColor: colors.bgSecondary }}>
          <DataTable
            value={languages}
            dataKey="id"
            loading={loading}
            paginator rows={20} rowsPerPageOptions={[10, 20, 50]}
            size="small" stripedRows showGridlines scrollable
            scrollHeight="calc(100vh - 300px)" emptyMessage="No records found.">
            <Column field="id" header="id" sortable />
            <Column field="code" header="code" sortable />
            <Column field="name" header="name" sortable />
            <Column field="native_name" header="native_name" sortable />
            <Column field="flag" header="flag" sortable />
            <Column field="is_active" header="is_active" sortable />
            <Column field="is_default" header="is_default" sortable />
            <Column field="sort_order" header="sort_order" sortable />
            <Column header="Actions" body={actionsBodyTemplate} style={{ width: '160px' }} />
          </DataTable>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog header={editing ? 'Edit' : 'New'} visible={modalVisible} onHide={() => setModalVisible(false)}
        style={{ width: '600px' }} modal closable draggable className="themed-dialog"
        contentStyle={{ backgroundColor: colors.bgSecondary, color: colors.textPrimary }}
        headerStyle={{ backgroundColor: colors.bgTertiary, color: colors.textPrimary }}
        footer={<div className="flex justify-end gap-2">
          <Button label="Cancel" icon="pi pi-times" severity="info" outlined onClick={() => setModalVisible(false)} />
          <Button label={editing ? 'Save' : 'Create'} icon="pi pi-check" severity="success" onClick={handleSubmit(onSubmit)} />
        </div>}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label htmlFor="code" className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>code</label>
            <Controller name="code" control={control}
              render={({ field }) => <InputText id="code" {...field} className="w-full" />} />
            {errors.code && <small className="mt-1 block" style={{ color: colors.errorText }}>{errors.code.message}</small>}
          </div>
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>name</label>
            <Controller name="name" control={control}
              render={({ field }) => <InputText id="name" {...field} className="w-full" />} />
            {errors.name && <small className="mt-1 block" style={{ color: colors.errorText }}>{errors.name.message}</small>}
          </div>
          <div>
            <label htmlFor="native_name" className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>native_name</label>
            <Controller name="native_name" control={control}
              render={({ field }) => <InputText id="native_name" {...field} className="w-full" />} />
            {errors.native_name && <small className="mt-1 block" style={{ color: colors.errorText }}>{errors.native_name.message}</small>}
          </div>
          <div>
            <label htmlFor="flag" className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>flag</label>
            <Controller name="flag" control={control}
              render={({ field }) => <InputText id="flag" {...field} className="w-full" />} />
            {errors.flag && <small className="mt-1 block" style={{ color: colors.errorText }}>{errors.flag.message}</small>}
          </div>
          <div>
            <label htmlFor="is_active" className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>is_active</label>
            <Controller name="is_active" control={control} rules={{ required: 'Required' }}
              render={({ field }) => (
                <InputNumber id="is_active" value={field.value} onValueChange={(e) => field.onChange(e.value)}
                  useGrouping={false} className="w-full" />
              )} />
            {errors.is_active && <small className="mt-1 block" style={{ color: colors.errorText }}>{errors.is_active.message}</small>}
          </div>
          <div>
            <label htmlFor="is_default" className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>is_default</label>
            <Controller name="is_default" control={control} rules={{ required: 'Required' }}
              render={({ field }) => (
                <InputNumber id="is_default" value={field.value} onValueChange={(e) => field.onChange(e.value)}
                  useGrouping={false} className="w-full" />
              )} />
            {errors.is_default && <small className="mt-1 block" style={{ color: colors.errorText }}>{errors.is_default.message}</small>}
          </div>
          <div>
            <label htmlFor="sort_order" className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>sort_order</label>
            <Controller name="sort_order" control={control} rules={{ required: 'Required' }}
              render={({ field }) => (
                <InputNumber id="sort_order" value={field.value} onValueChange={(e) => field.onChange(e.value)}
                  useGrouping={false} className="w-full" />
              )} />
            {errors.sort_order && <small className="mt-1 block" style={{ color: colors.errorText }}>{errors.sort_order.message}</small>}
          </div>
        </form>
      </Dialog>

      {/* View Dialog */}
      <Dialog header="View" visible={viewModalVisible} onHide={() => setViewModalVisible(false)}
        style={{ width: '600px' }} modal closable draggable className="themed-dialog"
        contentStyle={{ backgroundColor: colors.bgSecondary, color: colors.textPrimary }}
        headerStyle={{ backgroundColor: colors.bgTertiary, color: colors.textPrimary }}>
        {viewing && (
          <div className="space-y-3">
            <div>
              <span className="text-sm font-medium block" style={{ color: colors.textMuted }}>id</span>
              <span style={{ color: colors.textPrimary }}>{viewing.id != null ? String(viewing.id) : '-'}</span>
            </div>
            <div>
              <span className="text-sm font-medium block" style={{ color: colors.textMuted }}>code</span>
              <span style={{ color: colors.textPrimary }}>{viewing.code != null ? String(viewing.code) : '-'}</span>
            </div>
            <div>
              <span className="text-sm font-medium block" style={{ color: colors.textMuted }}>name</span>
              <span style={{ color: colors.textPrimary }}>{viewing.name != null ? String(viewing.name) : '-'}</span>
            </div>
            <div>
              <span className="text-sm font-medium block" style={{ color: colors.textMuted }}>native_name</span>
              <span style={{ color: colors.textPrimary }}>{viewing.native_name != null ? String(viewing.native_name) : '-'}</span>
            </div>
            <div>
              <span className="text-sm font-medium block" style={{ color: colors.textMuted }}>flag</span>
              <span style={{ color: colors.textPrimary }}>{viewing.flag != null ? String(viewing.flag) : '-'}</span>
            </div>
            <div>
              <span className="text-sm font-medium block" style={{ color: colors.textMuted }}>is_active</span>
              <span style={{ color: colors.textPrimary }}>{viewing.is_active != null ? String(viewing.is_active) : '-'}</span>
            </div>
            <div>
              <span className="text-sm font-medium block" style={{ color: colors.textMuted }}>is_default</span>
              <span style={{ color: colors.textPrimary }}>{viewing.is_default != null ? String(viewing.is_default) : '-'}</span>
            </div>
            <div>
              <span className="text-sm font-medium block" style={{ color: colors.textMuted }}>sort_order</span>
              <span style={{ color: colors.textPrimary }}>{viewing.sort_order != null ? String(viewing.sort_order) : '-'}</span>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}
