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

interface PostalCode {
  pc_id: number;
  count_iso2: string;
  pc_postal_code: string;
  pc_city: string;
  pc_state: string;
  pc_subdivision: string;
  pc_latitude: number;
  pc_longitude: number;
  pc_timezone: string;
  pc_population: number;
  pc_delivery_zone: string;
  pc_postal_format: string;
  pc_is_active: number;
  pc_valid_from: string;
  pc_valid_to: string;
  pc_notes: string;
  pc_created_at: string;
  pc_updated_at: string;
  countries?: any;
}

interface PostalCodeFormData {
  count_iso2: string;
  pc_postal_code: string;
  pc_city: string;
  pc_state: string;
  pc_subdivision: string;
  pc_latitude: number;
  pc_longitude: number;
  pc_timezone: string;
  pc_population: number;
  pc_delivery_zone: string;
  pc_postal_format: string;
  pc_is_active: number;
  pc_valid_from: string;
  pc_valid_to: string;
  pc_notes: string;
}

export default function PostalCodeManagementPanel() {
  const [currentLanguage] = React.useState<SupportedLanguage>(getStoredLanguage());
  const { t } = useTranslation(currentLanguage);
  const toast = useToast();
  const { colors } = useTheme();
  const [postalCodes, setPostalCodes] = useState<PostalCode[]>([]);
  const [countriesOptions, setCountriesOptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [editing, setEditing] = useState<PostalCode | null>(null);
  const [viewing, setViewing] = useState<PostalCode | null>(null);

  const defaultValues: PostalCodeFormData = {
    count_iso2: '',
    pc_postal_code: '',
    pc_city: '',
    pc_state: '',
    pc_subdivision: '',
    pc_latitude: 0,
    pc_longitude: 0,
    pc_timezone: '',
    pc_population: 0,
    pc_delivery_zone: '',
    pc_postal_format: '',
    pc_is_active: 0,
    pc_valid_from: new Date().toISOString().slice(0, 10),
    pc_valid_to: new Date().toISOString().slice(0, 10),
    pc_notes: '',
  };

  const { control, handleSubmit, reset, formState: { errors } } = useForm<PostalCodeFormData>({ defaultValues });

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await api.get('/postal_codes');
      setPostalCodes(data);
    } catch (error: any) { toast.showError('Failed: ' + (error.message || error)); } finally { setLoading(false); }
  };

  const fetchCountries = async () => {
    try { const data = await api.get('/countries'); setCountriesOptions(data); }
    catch (error: any) { toast.showError('Failed: ' + (error.message || error)); }
  };

  useEffect(() => {
    fetchData();
    fetchCountries();
  }, []);

  const handleCreate = () => { setEditing(null); reset(defaultValues); setModalVisible(true); };

  const handleEdit = (record: PostalCode) => {
    setEditing(record);
    reset({
      count_iso2: record.count_iso2,
      pc_postal_code: record.pc_postal_code,
      pc_city: record.pc_city,
      pc_state: record.pc_state,
      pc_subdivision: record.pc_subdivision,
      pc_latitude: record.pc_latitude,
      pc_longitude: record.pc_longitude,
      pc_timezone: record.pc_timezone,
      pc_population: record.pc_population,
      pc_delivery_zone: record.pc_delivery_zone,
      pc_postal_format: record.pc_postal_format,
      pc_is_active: record.pc_is_active,
      pc_valid_from: record.pc_valid_from ? record.pc_valid_from.slice(0, 10) : '',
      pc_valid_to: record.pc_valid_to ? record.pc_valid_to.slice(0, 10) : '',
      pc_notes: record.pc_notes,
    });
    setModalVisible(true);
  };

  const handleView = (record: PostalCode) => { setViewing(record); setViewModalVisible(true); };

  const confirmDelete = (record: PostalCode) => {
    confirmDialog({ group: 'postal_codes-mgmt', message: 'Are you sure?', header: 'Confirm',
      icon: 'pi pi-exclamation-triangle', accept: () => handleDelete(record),
      acceptLabel: 'Delete', rejectLabel: 'Cancel', acceptClassName: 'p-button-danger' });
  };

  const handleDelete = async (record: PostalCode) => {
    try { await api.delete('/postal_codes/' + record.pc_id); toast.showSuccess('Deleted.'); fetchData(); }
    catch (error: any) { toast.showError('Error: ' + (error.message || error)); }
  };

  const onSubmit = async (values: PostalCodeFormData) => {
    try {
      if (editing) { await api.put('/postal_codes/' + editing.pc_id, values); toast.showSuccess('Updated.'); }
      else { await api.post('/postal_codes', values); toast.showSuccess('Created.'); }
      setModalVisible(false); await fetchData();
    } catch (error: any) { toast.showError('Error: ' + (error.message || error)); }
  };

  const actionsBodyTemplate = (rowData: PostalCode) => (
    <div className="flex gap-1">
      <Button icon="pi pi-eye" rounded text size="small" severity="info" onClick={() => handleView(rowData)} tooltip="View" tooltipOptions={{ position: 'top' }} />
      <Button icon="pi pi-pencil" rounded text size="small" severity="warning" onClick={() => handleEdit(rowData)} tooltip="Edit" tooltipOptions={{ position: 'top' }} />
      <Button icon="pi pi-trash" rounded text size="small" severity="danger" onClick={() => confirmDelete(rowData)} tooltip="Delete" tooltipOptions={{ position: 'top' }} />
    </div>
  );

  return (
    <div className="h-full flex flex-col" style={{ backgroundColor: colors.bgPrimary, color: colors.textPrimary }}>
      <ConfirmDialog group="postal_codes-mgmt" />

      {/* Header */}
      <div className="flex-shrink-0 p-4" style={{ borderBottom: '1px solid ' + colors.borderPrimary }}>
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold" style={{ color: colors.textPrimary }}>PostalCode Management</h3>
          <Button icon="pi pi-plus" label="+ Add" size="small" severity="info" onClick={handleCreate} />
        </div>
      </div>

      {/* DataTable */}
      <div className="flex-1 p-4 overflow-auto" style={{ backgroundColor: colors.bgPrimary }}>
        <div className="rounded-lg shadow-sm overflow-hidden" style={{ backgroundColor: colors.bgSecondary }}>
          <DataTable
            value={postalCodes}
            dataKey="pc_id"
            loading={loading}
            paginator rows={20} rowsPerPageOptions={[10, 20, 50]}
            size="small" stripedRows showGridlines scrollable
            scrollHeight="calc(100vh - 300px)" emptyMessage="No records found.">
            <Column field="pc_id" header="pc_id" sortable />
            <Column field="count_iso2" header="count_iso2" sortable />
            <Column field="pc_postal_code" header="pc_postal_code" sortable />
            <Column field="pc_city" header="pc_city" sortable />
            <Column field="pc_state" header="pc_state" sortable />
            <Column field="pc_subdivision" header="pc_subdivision" sortable />
            <Column field="pc_latitude" header="pc_latitude" sortable />
            <Column field="pc_longitude" header="pc_longitude" sortable />
            <Column field="pc_timezone" header="pc_timezone" sortable />
            <Column field="pc_population" header="pc_population" sortable />
            <Column field="pc_delivery_zone" header="pc_delivery_zone" sortable />
            <Column field="pc_postal_format" header="pc_postal_format" sortable />
            <Column field="pc_is_active" header="pc_is_active" sortable />
            <Column field="pc_valid_from" header="pc_valid_from" sortable />
            <Column field="pc_valid_to" header="pc_valid_to" sortable />
            <Column field="pc_notes" header="pc_notes" sortable />
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
            <label htmlFor="count_iso2" className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>count_iso2</label>
            <Controller name="count_iso2" control={control}
              render={({ field }) => <InputText id="count_iso2" {...field} className="w-full" />} />
            {errors.count_iso2 && <small className="mt-1 block" style={{ color: colors.errorText }}>{errors.count_iso2.message}</small>}
          </div>
          <div>
            <label htmlFor="pc_postal_code" className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>pc_postal_code</label>
            <Controller name="pc_postal_code" control={control}
              render={({ field }) => <InputText id="pc_postal_code" {...field} className="w-full" />} />
            {errors.pc_postal_code && <small className="mt-1 block" style={{ color: colors.errorText }}>{errors.pc_postal_code.message}</small>}
          </div>
          <div>
            <label htmlFor="pc_city" className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>pc_city</label>
            <Controller name="pc_city" control={control}
              render={({ field }) => <InputText id="pc_city" {...field} className="w-full" />} />
            {errors.pc_city && <small className="mt-1 block" style={{ color: colors.errorText }}>{errors.pc_city.message}</small>}
          </div>
          <div>
            <label htmlFor="pc_state" className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>pc_state</label>
            <Controller name="pc_state" control={control}
              render={({ field }) => <InputText id="pc_state" {...field} className="w-full" />} />
            {errors.pc_state && <small className="mt-1 block" style={{ color: colors.errorText }}>{errors.pc_state.message}</small>}
          </div>
          <div>
            <label htmlFor="pc_subdivision" className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>pc_subdivision</label>
            <Controller name="pc_subdivision" control={control}
              render={({ field }) => <InputText id="pc_subdivision" {...field} className="w-full" />} />
            {errors.pc_subdivision && <small className="mt-1 block" style={{ color: colors.errorText }}>{errors.pc_subdivision.message}</small>}
          </div>
          <div>
            <label htmlFor="pc_latitude" className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>pc_latitude</label>
            <Controller name="pc_latitude" control={control} rules={{ required: 'Required' }}
              render={({ field }) => (
                <InputNumber id="pc_latitude" value={field.value} onValueChange={(e) => field.onChange(e.value)}
                  mode="decimal" minFractionDigits={2} useGrouping={false} className="w-full" />
              )} />
            {errors.pc_latitude && <small className="mt-1 block" style={{ color: colors.errorText }}>{errors.pc_latitude.message}</small>}
          </div>
          <div>
            <label htmlFor="pc_longitude" className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>pc_longitude</label>
            <Controller name="pc_longitude" control={control} rules={{ required: 'Required' }}
              render={({ field }) => (
                <InputNumber id="pc_longitude" value={field.value} onValueChange={(e) => field.onChange(e.value)}
                  mode="decimal" minFractionDigits={2} useGrouping={false} className="w-full" />
              )} />
            {errors.pc_longitude && <small className="mt-1 block" style={{ color: colors.errorText }}>{errors.pc_longitude.message}</small>}
          </div>
          <div>
            <label htmlFor="pc_timezone" className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>pc_timezone</label>
            <Controller name="pc_timezone" control={control}
              render={({ field }) => <InputText id="pc_timezone" {...field} className="w-full" />} />
            {errors.pc_timezone && <small className="mt-1 block" style={{ color: colors.errorText }}>{errors.pc_timezone.message}</small>}
          </div>
          <div>
            <label htmlFor="pc_population" className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>pc_population</label>
            <Controller name="pc_population" control={control} rules={{ required: 'Required' }}
              render={({ field }) => (
                <InputNumber id="pc_population" value={field.value} onValueChange={(e) => field.onChange(e.value)}
                  useGrouping={false} className="w-full" />
              )} />
            {errors.pc_population && <small className="mt-1 block" style={{ color: colors.errorText }}>{errors.pc_population.message}</small>}
          </div>
          <div>
            <label htmlFor="pc_delivery_zone" className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>pc_delivery_zone</label>
            <Controller name="pc_delivery_zone" control={control}
              render={({ field }) => <InputText id="pc_delivery_zone" {...field} className="w-full" />} />
            {errors.pc_delivery_zone && <small className="mt-1 block" style={{ color: colors.errorText }}>{errors.pc_delivery_zone.message}</small>}
          </div>
          <div>
            <label htmlFor="pc_postal_format" className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>pc_postal_format</label>
            <Controller name="pc_postal_format" control={control}
              render={({ field }) => <InputText id="pc_postal_format" {...field} className="w-full" />} />
            {errors.pc_postal_format && <small className="mt-1 block" style={{ color: colors.errorText }}>{errors.pc_postal_format.message}</small>}
          </div>
          <div>
            <label htmlFor="pc_is_active" className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>pc_is_active</label>
            <Controller name="pc_is_active" control={control} rules={{ required: 'Required' }}
              render={({ field }) => (
                <InputNumber id="pc_is_active" value={field.value} onValueChange={(e) => field.onChange(e.value)}
                  useGrouping={false} className="w-full" />
              )} />
            {errors.pc_is_active && <small className="mt-1 block" style={{ color: colors.errorText }}>{errors.pc_is_active.message}</small>}
          </div>
          <div>
            <label htmlFor="pc_valid_from" className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>pc_valid_from</label>
            <Controller name="pc_valid_from" control={control}
              render={({ field }) => <InputText id="pc_valid_from" {...field} className="w-full" />} />
            {errors.pc_valid_from && <small className="mt-1 block" style={{ color: colors.errorText }}>{errors.pc_valid_from.message}</small>}
          </div>
          <div>
            <label htmlFor="pc_valid_to" className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>pc_valid_to</label>
            <Controller name="pc_valid_to" control={control}
              render={({ field }) => <InputText id="pc_valid_to" {...field} className="w-full" />} />
            {errors.pc_valid_to && <small className="mt-1 block" style={{ color: colors.errorText }}>{errors.pc_valid_to.message}</small>}
          </div>
          <div>
            <label htmlFor="pc_notes" className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>pc_notes</label>
            <Controller name="pc_notes" control={control}
              render={({ field }) => <InputTextarea id="pc_notes" {...field} rows={3} className="w-full" />} />
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
              <span className="text-sm font-medium block" style={{ color: colors.textMuted }}>pc_id</span>
              <span style={{ color: colors.textPrimary }}>{viewing.pc_id != null ? String(viewing.pc_id) : '-'}</span>
            </div>
            <div>
              <span className="text-sm font-medium block" style={{ color: colors.textMuted }}>count_iso2</span>
              <span style={{ color: colors.textPrimary }}>{viewing.count_iso2 != null ? String(viewing.count_iso2) : '-'}</span>
            </div>
            <div>
              <span className="text-sm font-medium block" style={{ color: colors.textMuted }}>pc_postal_code</span>
              <span style={{ color: colors.textPrimary }}>{viewing.pc_postal_code != null ? String(viewing.pc_postal_code) : '-'}</span>
            </div>
            <div>
              <span className="text-sm font-medium block" style={{ color: colors.textMuted }}>pc_city</span>
              <span style={{ color: colors.textPrimary }}>{viewing.pc_city != null ? String(viewing.pc_city) : '-'}</span>
            </div>
            <div>
              <span className="text-sm font-medium block" style={{ color: colors.textMuted }}>pc_state</span>
              <span style={{ color: colors.textPrimary }}>{viewing.pc_state != null ? String(viewing.pc_state) : '-'}</span>
            </div>
            <div>
              <span className="text-sm font-medium block" style={{ color: colors.textMuted }}>pc_subdivision</span>
              <span style={{ color: colors.textPrimary }}>{viewing.pc_subdivision != null ? String(viewing.pc_subdivision) : '-'}</span>
            </div>
            <div>
              <span className="text-sm font-medium block" style={{ color: colors.textMuted }}>pc_latitude</span>
              <span style={{ color: colors.textPrimary }}>{viewing.pc_latitude != null ? String(viewing.pc_latitude) : '-'}</span>
            </div>
            <div>
              <span className="text-sm font-medium block" style={{ color: colors.textMuted }}>pc_longitude</span>
              <span style={{ color: colors.textPrimary }}>{viewing.pc_longitude != null ? String(viewing.pc_longitude) : '-'}</span>
            </div>
            <div>
              <span className="text-sm font-medium block" style={{ color: colors.textMuted }}>pc_timezone</span>
              <span style={{ color: colors.textPrimary }}>{viewing.pc_timezone != null ? String(viewing.pc_timezone) : '-'}</span>
            </div>
            <div>
              <span className="text-sm font-medium block" style={{ color: colors.textMuted }}>pc_population</span>
              <span style={{ color: colors.textPrimary }}>{viewing.pc_population != null ? String(viewing.pc_population) : '-'}</span>
            </div>
            <div>
              <span className="text-sm font-medium block" style={{ color: colors.textMuted }}>pc_delivery_zone</span>
              <span style={{ color: colors.textPrimary }}>{viewing.pc_delivery_zone != null ? String(viewing.pc_delivery_zone) : '-'}</span>
            </div>
            <div>
              <span className="text-sm font-medium block" style={{ color: colors.textMuted }}>pc_postal_format</span>
              <span style={{ color: colors.textPrimary }}>{viewing.pc_postal_format != null ? String(viewing.pc_postal_format) : '-'}</span>
            </div>
            <div>
              <span className="text-sm font-medium block" style={{ color: colors.textMuted }}>pc_is_active</span>
              <span style={{ color: colors.textPrimary }}>{viewing.pc_is_active != null ? String(viewing.pc_is_active) : '-'}</span>
            </div>
            <div>
              <span className="text-sm font-medium block" style={{ color: colors.textMuted }}>pc_valid_from</span>
              <span style={{ color: colors.textPrimary }}>{viewing.pc_valid_from != null ? String(viewing.pc_valid_from) : '-'}</span>
            </div>
            <div>
              <span className="text-sm font-medium block" style={{ color: colors.textMuted }}>pc_valid_to</span>
              <span style={{ color: colors.textPrimary }}>{viewing.pc_valid_to != null ? String(viewing.pc_valid_to) : '-'}</span>
            </div>
            <div>
              <span className="text-sm font-medium block" style={{ color: colors.textMuted }}>pc_notes</span>
              <span style={{ color: colors.textPrimary }}>{viewing.pc_notes != null ? String(viewing.pc_notes) : '-'}</span>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}
