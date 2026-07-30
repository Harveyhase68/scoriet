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

interface Address {
  addr_id: number;
  addr_no: number;
  addr_street: string;
  addr_house_number: string;
  pc_postal_code: string;
  pc_city: string;
  pc_state: string;
  count_iso2: string;
  addr_latitude: number;
  addr_longitude: number;
  addr_type: string;
  addr_is_primary: number;
  addr_valid_from: string;
  addr_valid_to: string;
  addr_full_text: string;
  postalCodes?: any;
  countries?: any;
}

interface AddressFormData {
  addr_no: number;
  addr_street: string;
  addr_house_number: string;
  pc_postal_code: string;
  pc_city: string;
  pc_state: string;
  count_iso2: string;
  addr_latitude: number;
  addr_longitude: number;
  addr_type: string;
  addr_is_primary: number;
  addr_valid_from: string;
  addr_valid_to: string;
  addr_full_text: string;
}

export default function AddressManagementPanel() {
  const [currentLanguage] = React.useState<SupportedLanguage>(getStoredLanguage());
  const { t } = useTranslation(currentLanguage);
  const toast = useToast();
  const { colors } = useTheme();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [postalCodesOptions, setPostalCodesOptions] = useState<any[]>([]);
  const [countriesOptions, setCountriesOptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [editing, setEditing] = useState<Address | null>(null);
  const [viewing, setViewing] = useState<Address | null>(null);

  const defaultValues: AddressFormData = {
    addr_no: 0,
    addr_street: '',
    addr_house_number: '',
    pc_postal_code: '',
    pc_city: '',
    pc_state: '',
    count_iso2: '',
    addr_latitude: 0,
    addr_longitude: 0,
    addr_type: '',
    addr_is_primary: 0,
    addr_valid_from: new Date().toISOString().slice(0, 10),
    addr_valid_to: new Date().toISOString().slice(0, 10),
    addr_full_text: '',
  };

  const { control, handleSubmit, reset, formState: { errors } } = useForm<AddressFormData>({ defaultValues });

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await api.get('/addresses');
      setAddresses(data);
    } catch (error: any) { toast.showError('Failed: ' + (error.message || error)); } finally { setLoading(false); }
  };

  const fetchPostalCodes = async () => {
    try { const data = await api.get('/postal_codes'); setPostalCodesOptions(data); }
    catch (error: any) { toast.showError('Failed: ' + (error.message || error)); }
  };

  const fetchCountries = async () => {
    try { const data = await api.get('/countries'); setCountriesOptions(data); }
    catch (error: any) { toast.showError('Failed: ' + (error.message || error)); }
  };

  useEffect(() => {
    fetchData();
    fetchPostalCodes();
    fetchCountries();
  }, []);

  const handleCreate = () => { setEditing(null); reset(defaultValues); setModalVisible(true); };

  const handleEdit = (record: Address) => {
    setEditing(record);
    reset({
      addr_no: record.addr_no,
      addr_street: record.addr_street,
      addr_house_number: record.addr_house_number,
      pc_postal_code: record.pc_postal_code,
      pc_city: record.pc_city,
      pc_state: record.pc_state,
      count_iso2: record.count_iso2,
      addr_latitude: record.addr_latitude,
      addr_longitude: record.addr_longitude,
      addr_type: record.addr_type,
      addr_is_primary: record.addr_is_primary,
      addr_valid_from: record.addr_valid_from ? record.addr_valid_from.slice(0, 10) : '',
      addr_valid_to: record.addr_valid_to ? record.addr_valid_to.slice(0, 10) : '',
      addr_full_text: record.addr_full_text,
    });
    setModalVisible(true);
  };

  const handleView = (record: Address) => { setViewing(record); setViewModalVisible(true); };

  const confirmDelete = (record: Address) => {
    confirmDialog({ group: 'addresses-mgmt', message: 'Are you sure?', header: 'Confirm',
      icon: 'pi pi-exclamation-triangle', accept: () => handleDelete(record),
      acceptLabel: 'Delete', rejectLabel: 'Cancel', acceptClassName: 'p-button-danger' });
  };

  const handleDelete = async (record: Address) => {
    try { await api.delete('/addresses/' + record.addr_id); toast.showSuccess('Deleted.'); fetchData(); }
    catch (error: any) { toast.showError('Error: ' + (error.message || error)); }
  };

  const onSubmit = async (values: AddressFormData) => {
    try {
      if (editing) { await api.put('/addresses/' + editing.addr_id, values); toast.showSuccess('Updated.'); }
      else { await api.post('/addresses', values); toast.showSuccess('Created.'); }
      setModalVisible(false); await fetchData();
    } catch (error: any) { toast.showError('Error: ' + (error.message || error)); }
  };

  const actionsBodyTemplate = (rowData: Address) => (
    <div className="flex gap-1">
      <Button icon="pi pi-eye" rounded text size="small" severity="info" onClick={() => handleView(rowData)} tooltip="View" tooltipOptions={{ position: 'top' }} />
      <Button icon="pi pi-pencil" rounded text size="small" severity="warning" onClick={() => handleEdit(rowData)} tooltip="Edit" tooltipOptions={{ position: 'top' }} />
      <Button icon="pi pi-trash" rounded text size="small" severity="danger" onClick={() => confirmDelete(rowData)} tooltip="Delete" tooltipOptions={{ position: 'top' }} />
    </div>
  );

  return (
    <div className="h-full flex flex-col" style={{ backgroundColor: colors.bgPrimary, color: colors.textPrimary }}>
      <ConfirmDialog group="addresses-mgmt" />

      {/* Header */}
      <div className="flex-shrink-0 p-4" style={{ borderBottom: '1px solid ' + colors.borderPrimary }}>
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold" style={{ color: colors.textPrimary }}>Address Management</h3>
          <Button icon="pi pi-plus" label="+ Add" size="small" severity="info" onClick={handleCreate} />
        </div>
      </div>

      {/* DataTable */}
      <div className="flex-1 p-4 overflow-auto" style={{ backgroundColor: colors.bgPrimary }}>
        <div className="rounded-lg shadow-sm overflow-hidden" style={{ backgroundColor: colors.bgSecondary }}>
          <DataTable
            value={addresses}
            dataKey="addr_id"
            loading={loading}
            paginator rows={20} rowsPerPageOptions={[10, 20, 50]}
            size="small" stripedRows showGridlines scrollable
            scrollHeight="calc(100vh - 300px)" emptyMessage="No records found.">
            <Column field="addr_id" header="addr_id" sortable />
            <Column field="addr_no" header="addr_no" sortable />
            <Column field="addr_street" header="addr_street" sortable />
            <Column field="addr_house_number" header="addr_house_number" sortable />
            <Column field="pc_postal_code" header="pc_postal_code" sortable />
            <Column field="pc_city" header="pc_city" sortable />
            <Column field="pc_state" header="pc_state" sortable />
            <Column field="count_iso2" header="count_iso2" sortable />
            <Column field="addr_latitude" header="addr_latitude" sortable />
            <Column field="addr_longitude" header="addr_longitude" sortable />
            <Column field="addr_type" header="addr_type" sortable />
            <Column field="addr_is_primary" header="addr_is_primary" sortable />
            <Column field="addr_valid_from" header="addr_valid_from" sortable />
            <Column field="addr_valid_to" header="addr_valid_to" sortable />
            <Column field="addr_full_text" header="addr_full_text" sortable />
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
            <label htmlFor="addr_no" className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>addr_no</label>
            <Controller name="addr_no" control={control} rules={{ required: 'Required' }}
              render={({ field }) => (
                <InputNumber id="addr_no" value={field.value} onValueChange={(e) => field.onChange(e.value)}
                  useGrouping={false} className="w-full" />
              )} />
            {errors.addr_no && <small className="mt-1 block" style={{ color: colors.errorText }}>{errors.addr_no.message}</small>}
          </div>
          <div>
            <label htmlFor="addr_street" className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>addr_street</label>
            <Controller name="addr_street" control={control}
              render={({ field }) => <InputText id="addr_street" {...field} className="w-full" />} />
            {errors.addr_street && <small className="mt-1 block" style={{ color: colors.errorText }}>{errors.addr_street.message}</small>}
          </div>
          <div>
            <label htmlFor="addr_house_number" className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>addr_house_number</label>
            <Controller name="addr_house_number" control={control}
              render={({ field }) => <InputText id="addr_house_number" {...field} className="w-full" />} />
            {errors.addr_house_number && <small className="mt-1 block" style={{ color: colors.errorText }}>{errors.addr_house_number.message}</small>}
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
            <label htmlFor="count_iso2" className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>count_iso2</label>
            <Controller name="count_iso2" control={control}
              render={({ field }) => <InputText id="count_iso2" {...field} className="w-full" />} />
            {errors.count_iso2 && <small className="mt-1 block" style={{ color: colors.errorText }}>{errors.count_iso2.message}</small>}
          </div>
          <div>
            <label htmlFor="addr_latitude" className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>addr_latitude</label>
            <Controller name="addr_latitude" control={control} rules={{ required: 'Required' }}
              render={({ field }) => (
                <InputNumber id="addr_latitude" value={field.value} onValueChange={(e) => field.onChange(e.value)}
                  mode="decimal" minFractionDigits={2} useGrouping={false} className="w-full" />
              )} />
            {errors.addr_latitude && <small className="mt-1 block" style={{ color: colors.errorText }}>{errors.addr_latitude.message}</small>}
          </div>
          <div>
            <label htmlFor="addr_longitude" className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>addr_longitude</label>
            <Controller name="addr_longitude" control={control} rules={{ required: 'Required' }}
              render={({ field }) => (
                <InputNumber id="addr_longitude" value={field.value} onValueChange={(e) => field.onChange(e.value)}
                  mode="decimal" minFractionDigits={2} useGrouping={false} className="w-full" />
              )} />
            {errors.addr_longitude && <small className="mt-1 block" style={{ color: colors.errorText }}>{errors.addr_longitude.message}</small>}
          </div>
          <div>
            <label htmlFor="addr_type" className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>addr_type</label>
            <Controller name="addr_type" control={control}
              render={({ field }) => <InputText id="addr_type" {...field} className="w-full" />} />
            {errors.addr_type && <small className="mt-1 block" style={{ color: colors.errorText }}>{errors.addr_type.message}</small>}
          </div>
          <div>
            <label htmlFor="addr_is_primary" className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>addr_is_primary</label>
            <Controller name="addr_is_primary" control={control} rules={{ required: 'Required' }}
              render={({ field }) => (
                <InputNumber id="addr_is_primary" value={field.value} onValueChange={(e) => field.onChange(e.value)}
                  useGrouping={false} className="w-full" />
              )} />
            {errors.addr_is_primary && <small className="mt-1 block" style={{ color: colors.errorText }}>{errors.addr_is_primary.message}</small>}
          </div>
          <div>
            <label htmlFor="addr_valid_from" className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>addr_valid_from</label>
            <Controller name="addr_valid_from" control={control}
              render={({ field }) => <InputText id="addr_valid_from" {...field} className="w-full" />} />
            {errors.addr_valid_from && <small className="mt-1 block" style={{ color: colors.errorText }}>{errors.addr_valid_from.message}</small>}
          </div>
          <div>
            <label htmlFor="addr_valid_to" className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>addr_valid_to</label>
            <Controller name="addr_valid_to" control={control}
              render={({ field }) => <InputText id="addr_valid_to" {...field} className="w-full" />} />
            {errors.addr_valid_to && <small className="mt-1 block" style={{ color: colors.errorText }}>{errors.addr_valid_to.message}</small>}
          </div>
          <div>
            <label htmlFor="addr_full_text" className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>addr_full_text</label>
            <Controller name="addr_full_text" control={control}
              render={({ field }) => <InputTextarea id="addr_full_text" {...field} rows={3} className="w-full" />} />
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
              <span className="text-sm font-medium block" style={{ color: colors.textMuted }}>addr_id</span>
              <span style={{ color: colors.textPrimary }}>{viewing.addr_id != null ? String(viewing.addr_id) : '-'}</span>
            </div>
            <div>
              <span className="text-sm font-medium block" style={{ color: colors.textMuted }}>addr_no</span>
              <span style={{ color: colors.textPrimary }}>{viewing.addr_no != null ? String(viewing.addr_no) : '-'}</span>
            </div>
            <div>
              <span className="text-sm font-medium block" style={{ color: colors.textMuted }}>addr_street</span>
              <span style={{ color: colors.textPrimary }}>{viewing.addr_street != null ? String(viewing.addr_street) : '-'}</span>
            </div>
            <div>
              <span className="text-sm font-medium block" style={{ color: colors.textMuted }}>addr_house_number</span>
              <span style={{ color: colors.textPrimary }}>{viewing.addr_house_number != null ? String(viewing.addr_house_number) : '-'}</span>
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
              <span className="text-sm font-medium block" style={{ color: colors.textMuted }}>count_iso2</span>
              <span style={{ color: colors.textPrimary }}>{viewing.count_iso2 != null ? String(viewing.count_iso2) : '-'}</span>
            </div>
            <div>
              <span className="text-sm font-medium block" style={{ color: colors.textMuted }}>addr_latitude</span>
              <span style={{ color: colors.textPrimary }}>{viewing.addr_latitude != null ? String(viewing.addr_latitude) : '-'}</span>
            </div>
            <div>
              <span className="text-sm font-medium block" style={{ color: colors.textMuted }}>addr_longitude</span>
              <span style={{ color: colors.textPrimary }}>{viewing.addr_longitude != null ? String(viewing.addr_longitude) : '-'}</span>
            </div>
            <div>
              <span className="text-sm font-medium block" style={{ color: colors.textMuted }}>addr_type</span>
              <span style={{ color: colors.textPrimary }}>{viewing.addr_type != null ? String(viewing.addr_type) : '-'}</span>
            </div>
            <div>
              <span className="text-sm font-medium block" style={{ color: colors.textMuted }}>addr_is_primary</span>
              <span style={{ color: colors.textPrimary }}>{viewing.addr_is_primary != null ? String(viewing.addr_is_primary) : '-'}</span>
            </div>
            <div>
              <span className="text-sm font-medium block" style={{ color: colors.textMuted }}>addr_valid_from</span>
              <span style={{ color: colors.textPrimary }}>{viewing.addr_valid_from != null ? String(viewing.addr_valid_from) : '-'}</span>
            </div>
            <div>
              <span className="text-sm font-medium block" style={{ color: colors.textMuted }}>addr_valid_to</span>
              <span style={{ color: colors.textPrimary }}>{viewing.addr_valid_to != null ? String(viewing.addr_valid_to) : '-'}</span>
            </div>
            <div>
              <span className="text-sm font-medium block" style={{ color: colors.textMuted }}>addr_full_text</span>
              <span style={{ color: colors.textPrimary }}>{viewing.addr_full_text != null ? String(viewing.addr_full_text) : '-'}</span>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}
