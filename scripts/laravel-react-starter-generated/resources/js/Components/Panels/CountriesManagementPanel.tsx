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

interface Country {
  count_id: number;
  count_iso2: string;
  count_iso3: string;
  count_name: string;
  count_official_name: string;
  count_currency_code: string;
  count_currency_name: string;
  count_phone_code: string;
  count_region: string;
  count_subregion: string;
  count_eu_member: number;
  count_default_vat: number;
  count_timezones: string;
  count_address_format: string;
  count_display: string;
}

interface CountryFormData {
  count_iso2: string;
  count_iso3: string;
  count_name: string;
  count_official_name: string;
  count_currency_code: string;
  count_currency_name: string;
  count_phone_code: string;
  count_region: string;
  count_subregion: string;
  count_eu_member: number;
  count_default_vat: number;
  count_timezones: string;
  count_address_format: string;
  count_display: string;
}

export default function CountryManagementPanel() {
  const [currentLanguage] = React.useState<SupportedLanguage>(getStoredLanguage());
  const { t } = useTranslation(currentLanguage);
  const toast = useToast();
  const { colors } = useTheme();
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [editing, setEditing] = useState<Country | null>(null);
  const [viewing, setViewing] = useState<Country | null>(null);

  const defaultValues: CountryFormData = {
    count_iso2: '',
    count_iso3: '',
    count_name: '',
    count_official_name: '',
    count_currency_code: '',
    count_currency_name: '',
    count_phone_code: '',
    count_region: '',
    count_subregion: '',
    count_eu_member: 0,
    count_default_vat: 0,
    count_timezones: '',
    count_address_format: '',
    count_display: '',
  };

  const { control, handleSubmit, reset, formState: { errors } } = useForm<CountryFormData>({ defaultValues });

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await api.get('/countries');
      setCountries(data);
    } catch (error: any) { toast.showError('Failed: ' + (error.message || error)); } finally { setLoading(false); }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = () => { setEditing(null); reset(defaultValues); setModalVisible(true); };

  const handleEdit = (record: Country) => {
    setEditing(record);
    reset({
      count_iso2: record.count_iso2,
      count_iso3: record.count_iso3,
      count_name: record.count_name,
      count_official_name: record.count_official_name,
      count_currency_code: record.count_currency_code,
      count_currency_name: record.count_currency_name,
      count_phone_code: record.count_phone_code,
      count_region: record.count_region,
      count_subregion: record.count_subregion,
      count_eu_member: record.count_eu_member,
      count_default_vat: record.count_default_vat,
      count_timezones: record.count_timezones,
      count_address_format: record.count_address_format,
      count_display: record.count_display,
    });
    setModalVisible(true);
  };

  const handleView = (record: Country) => { setViewing(record); setViewModalVisible(true); };

  const confirmDelete = (record: Country) => {
    confirmDialog({ group: 'countries-mgmt', message: 'Are you sure?', header: 'Confirm',
      icon: 'pi pi-exclamation-triangle', accept: () => handleDelete(record),
      acceptLabel: 'Delete', rejectLabel: 'Cancel', acceptClassName: 'p-button-danger' });
  };

  const handleDelete = async (record: Country) => {
    try { await api.delete('/countries/' + record.count_id); toast.showSuccess('Deleted.'); fetchData(); }
    catch (error: any) { toast.showError('Error: ' + (error.message || error)); }
  };

  const onSubmit = async (values: CountryFormData) => {
    try {
      if (editing) { await api.put('/countries/' + editing.count_id, values); toast.showSuccess('Updated.'); }
      else { await api.post('/countries', values); toast.showSuccess('Created.'); }
      setModalVisible(false); await fetchData();
    } catch (error: any) { toast.showError('Error: ' + (error.message || error)); }
  };

  const actionsBodyTemplate = (rowData: Country) => (
    <div className="flex gap-1">
      <Button icon="pi pi-eye" rounded text size="small" severity="info" onClick={() => handleView(rowData)} tooltip="View" tooltipOptions={{ position: 'top' }} />
      <Button icon="pi pi-pencil" rounded text size="small" severity="warning" onClick={() => handleEdit(rowData)} tooltip="Edit" tooltipOptions={{ position: 'top' }} />
      <Button icon="pi pi-trash" rounded text size="small" severity="danger" onClick={() => confirmDelete(rowData)} tooltip="Delete" tooltipOptions={{ position: 'top' }} />
    </div>
  );

  return (
    <div className="h-full flex flex-col" style={{ backgroundColor: colors.bgPrimary, color: colors.textPrimary }}>
      <ConfirmDialog group="countries-mgmt" />

      {/* Header */}
      <div className="flex-shrink-0 p-4" style={{ borderBottom: '1px solid ' + colors.borderPrimary }}>
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold" style={{ color: colors.textPrimary }}>Country Management</h3>
          <Button icon="pi pi-plus" label="+ Add" size="small" severity="info" onClick={handleCreate} />
        </div>
      </div>

      {/* DataTable */}
      <div className="flex-1 p-4 overflow-auto" style={{ backgroundColor: colors.bgPrimary }}>
        <div className="rounded-lg shadow-sm overflow-hidden" style={{ backgroundColor: colors.bgSecondary }}>
          <DataTable
            value={countries}
            dataKey="count_id"
            loading={loading}
            paginator rows={20} rowsPerPageOptions={[10, 20, 50]}
            size="small" stripedRows showGridlines scrollable
            scrollHeight="calc(100vh - 300px)" emptyMessage="No records found.">
            <Column field="count_id" header="count_id" sortable />
            <Column field="count_iso2" header="count_iso2" sortable />
            <Column field="count_iso3" header="count_iso3" sortable />
            <Column field="count_name" header="count_name" sortable />
            <Column field="count_official_name" header="count_official_name" sortable />
            <Column field="count_currency_code" header="count_currency_code" sortable />
            <Column field="count_currency_name" header="count_currency_name" sortable />
            <Column field="count_phone_code" header="count_phone_code" sortable />
            <Column field="count_region" header="count_region" sortable />
            <Column field="count_subregion" header="count_subregion" sortable />
            <Column field="count_eu_member" header="count_eu_member" sortable />
            <Column field="count_default_vat" header="count_default_vat" sortable />
            <Column field="count_timezones" header="count_timezones" sortable />
            <Column field="count_address_format" header="count_address_format" sortable />
            <Column field="count_display" header="count_display" sortable />
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
            <label htmlFor="count_iso3" className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>count_iso3</label>
            <Controller name="count_iso3" control={control}
              render={({ field }) => <InputText id="count_iso3" {...field} className="w-full" />} />
            {errors.count_iso3 && <small className="mt-1 block" style={{ color: colors.errorText }}>{errors.count_iso3.message}</small>}
          </div>
          <div>
            <label htmlFor="count_name" className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>count_name</label>
            <Controller name="count_name" control={control}
              render={({ field }) => <InputText id="count_name" {...field} className="w-full" />} />
            {errors.count_name && <small className="mt-1 block" style={{ color: colors.errorText }}>{errors.count_name.message}</small>}
          </div>
          <div>
            <label htmlFor="count_official_name" className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>count_official_name</label>
            <Controller name="count_official_name" control={control}
              render={({ field }) => <InputText id="count_official_name" {...field} className="w-full" />} />
            {errors.count_official_name && <small className="mt-1 block" style={{ color: colors.errorText }}>{errors.count_official_name.message}</small>}
          </div>
          <div>
            <label htmlFor="count_currency_code" className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>count_currency_code</label>
            <Controller name="count_currency_code" control={control}
              render={({ field }) => <InputText id="count_currency_code" {...field} className="w-full" />} />
            {errors.count_currency_code && <small className="mt-1 block" style={{ color: colors.errorText }}>{errors.count_currency_code.message}</small>}
          </div>
          <div>
            <label htmlFor="count_currency_name" className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>count_currency_name</label>
            <Controller name="count_currency_name" control={control}
              render={({ field }) => <InputText id="count_currency_name" {...field} className="w-full" />} />
            {errors.count_currency_name && <small className="mt-1 block" style={{ color: colors.errorText }}>{errors.count_currency_name.message}</small>}
          </div>
          <div>
            <label htmlFor="count_phone_code" className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>count_phone_code</label>
            <Controller name="count_phone_code" control={control}
              render={({ field }) => <InputText id="count_phone_code" {...field} className="w-full" />} />
            {errors.count_phone_code && <small className="mt-1 block" style={{ color: colors.errorText }}>{errors.count_phone_code.message}</small>}
          </div>
          <div>
            <label htmlFor="count_region" className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>count_region</label>
            <Controller name="count_region" control={control}
              render={({ field }) => <InputText id="count_region" {...field} className="w-full" />} />
            {errors.count_region && <small className="mt-1 block" style={{ color: colors.errorText }}>{errors.count_region.message}</small>}
          </div>
          <div>
            <label htmlFor="count_subregion" className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>count_subregion</label>
            <Controller name="count_subregion" control={control}
              render={({ field }) => <InputText id="count_subregion" {...field} className="w-full" />} />
            {errors.count_subregion && <small className="mt-1 block" style={{ color: colors.errorText }}>{errors.count_subregion.message}</small>}
          </div>
          <div>
            <label htmlFor="count_eu_member" className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>count_eu_member</label>
            <Controller name="count_eu_member" control={control} rules={{ required: 'Required' }}
              render={({ field }) => (
                <InputNumber id="count_eu_member" value={field.value} onValueChange={(e) => field.onChange(e.value)}
                  useGrouping={false} className="w-full" />
              )} />
            {errors.count_eu_member && <small className="mt-1 block" style={{ color: colors.errorText }}>{errors.count_eu_member.message}</small>}
          </div>
          <div>
            <label htmlFor="count_default_vat" className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>count_default_vat</label>
            <Controller name="count_default_vat" control={control} rules={{ required: 'Required' }}
              render={({ field }) => (
                <InputNumber id="count_default_vat" value={field.value} onValueChange={(e) => field.onChange(e.value)}
                  mode="decimal" minFractionDigits={2} useGrouping={false} className="w-full" />
              )} />
            {errors.count_default_vat && <small className="mt-1 block" style={{ color: colors.errorText }}>{errors.count_default_vat.message}</small>}
          </div>
          <div>
            <label htmlFor="count_timezones" className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>count_timezones</label>
            <Controller name="count_timezones" control={control}
              render={({ field }) => <InputText id="count_timezones" {...field} className="w-full" />} />
            {errors.count_timezones && <small className="mt-1 block" style={{ color: colors.errorText }}>{errors.count_timezones.message}</small>}
          </div>
          <div>
            <label htmlFor="count_address_format" className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>count_address_format</label>
            <Controller name="count_address_format" control={control}
              render={({ field }) => <InputTextarea id="count_address_format" {...field} rows={3} className="w-full" />} />
          </div>
          <div>
            <label htmlFor="count_display" className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>count_display</label>
            <Controller name="count_display" control={control}
              render={({ field }) => <InputTextarea id="count_display" {...field} rows={3} className="w-full" />} />
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
              <span className="text-sm font-medium block" style={{ color: colors.textMuted }}>count_id</span>
              <span style={{ color: colors.textPrimary }}>{viewing.count_id != null ? String(viewing.count_id) : '-'}</span>
            </div>
            <div>
              <span className="text-sm font-medium block" style={{ color: colors.textMuted }}>count_iso2</span>
              <span style={{ color: colors.textPrimary }}>{viewing.count_iso2 != null ? String(viewing.count_iso2) : '-'}</span>
            </div>
            <div>
              <span className="text-sm font-medium block" style={{ color: colors.textMuted }}>count_iso3</span>
              <span style={{ color: colors.textPrimary }}>{viewing.count_iso3 != null ? String(viewing.count_iso3) : '-'}</span>
            </div>
            <div>
              <span className="text-sm font-medium block" style={{ color: colors.textMuted }}>count_name</span>
              <span style={{ color: colors.textPrimary }}>{viewing.count_name != null ? String(viewing.count_name) : '-'}</span>
            </div>
            <div>
              <span className="text-sm font-medium block" style={{ color: colors.textMuted }}>count_official_name</span>
              <span style={{ color: colors.textPrimary }}>{viewing.count_official_name != null ? String(viewing.count_official_name) : '-'}</span>
            </div>
            <div>
              <span className="text-sm font-medium block" style={{ color: colors.textMuted }}>count_currency_code</span>
              <span style={{ color: colors.textPrimary }}>{viewing.count_currency_code != null ? String(viewing.count_currency_code) : '-'}</span>
            </div>
            <div>
              <span className="text-sm font-medium block" style={{ color: colors.textMuted }}>count_currency_name</span>
              <span style={{ color: colors.textPrimary }}>{viewing.count_currency_name != null ? String(viewing.count_currency_name) : '-'}</span>
            </div>
            <div>
              <span className="text-sm font-medium block" style={{ color: colors.textMuted }}>count_phone_code</span>
              <span style={{ color: colors.textPrimary }}>{viewing.count_phone_code != null ? String(viewing.count_phone_code) : '-'}</span>
            </div>
            <div>
              <span className="text-sm font-medium block" style={{ color: colors.textMuted }}>count_region</span>
              <span style={{ color: colors.textPrimary }}>{viewing.count_region != null ? String(viewing.count_region) : '-'}</span>
            </div>
            <div>
              <span className="text-sm font-medium block" style={{ color: colors.textMuted }}>count_subregion</span>
              <span style={{ color: colors.textPrimary }}>{viewing.count_subregion != null ? String(viewing.count_subregion) : '-'}</span>
            </div>
            <div>
              <span className="text-sm font-medium block" style={{ color: colors.textMuted }}>count_eu_member</span>
              <span style={{ color: colors.textPrimary }}>{viewing.count_eu_member != null ? String(viewing.count_eu_member) : '-'}</span>
            </div>
            <div>
              <span className="text-sm font-medium block" style={{ color: colors.textMuted }}>count_default_vat</span>
              <span style={{ color: colors.textPrimary }}>{viewing.count_default_vat != null ? String(viewing.count_default_vat) : '-'}</span>
            </div>
            <div>
              <span className="text-sm font-medium block" style={{ color: colors.textMuted }}>count_timezones</span>
              <span style={{ color: colors.textPrimary }}>{viewing.count_timezones != null ? String(viewing.count_timezones) : '-'}</span>
            </div>
            <div>
              <span className="text-sm font-medium block" style={{ color: colors.textMuted }}>count_address_format</span>
              <span style={{ color: colors.textPrimary }}>{viewing.count_address_format != null ? String(viewing.count_address_format) : '-'}</span>
            </div>
            <div>
              <span className="text-sm font-medium block" style={{ color: colors.textMuted }}>count_display</span>
              <span style={{ color: colors.textPrimary }}>{viewing.count_display != null ? String(viewing.count_display) : '-'}</span>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}
