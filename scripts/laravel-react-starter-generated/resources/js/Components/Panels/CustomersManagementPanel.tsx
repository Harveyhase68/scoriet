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

interface Customer {
  cust_id: number;
  cust_no: number;
  cust_first_name: string;
  cust_last_name: string;
  cust_full_name: string;
  comp_no: number;
  cust_email: string;
  cust_phone: string;
  cust_mobile: string;
  cust_website: string;
  cust_vat_number: string;
  cust_tax_id: string;
  cust_legal_form: string;
  cust_status: string;
  cust_segment: string;
  cust_source: string;
  cust_language: string;
  cust_currency: string;
  cust_credit_limit: number;
  cust_balance: number;
  cust_payment_terms: string;
  cust_marketing_opt_in: number;
  cust_marketing_channel: string;
  cust_preferred_contact_time: string;
  cust_notes: string;
  cust_created_at: string;
  cust_updated_at: string;
  companies?: any;
}

interface CustomerFormData {
  cust_no: number;
  cust_first_name: string;
  cust_last_name: string;
  cust_full_name: string;
  comp_no: number;
  cust_email: string;
  cust_phone: string;
  cust_mobile: string;
  cust_website: string;
  cust_vat_number: string;
  cust_tax_id: string;
  cust_legal_form: string;
  cust_status: string;
  cust_segment: string;
  cust_source: string;
  cust_language: string;
  cust_currency: string;
  cust_credit_limit: number;
  cust_balance: number;
  cust_payment_terms: string;
  cust_marketing_opt_in: number;
  cust_marketing_channel: string;
  cust_preferred_contact_time: string;
  cust_notes: string;
}

export default function CustomerManagementPanel() {
  const [currentLanguage] = React.useState<SupportedLanguage>(getStoredLanguage());
  const { t } = useTranslation(currentLanguage);
  const toast = useToast();
  const { colors } = useTheme();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [companiesOptions, setCompaniesOptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [viewing, setViewing] = useState<Customer | null>(null);

  const defaultValues: CustomerFormData = {
    cust_no: 0,
    cust_first_name: '',
    cust_last_name: '',
    cust_full_name: '',
    comp_no: 0,
    cust_email: '',
    cust_phone: '',
    cust_mobile: '',
    cust_website: '',
    cust_vat_number: '',
    cust_tax_id: '',
    cust_legal_form: '',
    cust_status: '',
    cust_segment: '',
    cust_source: '',
    cust_language: '',
    cust_currency: '',
    cust_credit_limit: 0,
    cust_balance: 0,
    cust_payment_terms: '',
    cust_marketing_opt_in: 0,
    cust_marketing_channel: '',
    cust_preferred_contact_time: '',
    cust_notes: '',
  };

  const { control, handleSubmit, reset, formState: { errors } } = useForm<CustomerFormData>({ defaultValues });

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await api.get('/customers');
      setCustomers(data);
    } catch (error: any) { toast.showError('Failed: ' + (error.message || error)); } finally { setLoading(false); }
  };

  const fetchCompanies = async () => {
    try { const data = await api.get('/companies'); setCompaniesOptions(data); }
    catch (error: any) { toast.showError('Failed: ' + (error.message || error)); }
  };

  useEffect(() => {
    fetchData();
    fetchCompanies();
  }, []);

  const handleCreate = () => { setEditing(null); reset(defaultValues); setModalVisible(true); };

  const handleEdit = (record: Customer) => {
    setEditing(record);
    reset({
      cust_no: record.cust_no,
      cust_first_name: record.cust_first_name,
      cust_last_name: record.cust_last_name,
      cust_full_name: record.cust_full_name,
      comp_no: record.comp_no,
      cust_email: record.cust_email,
      cust_phone: record.cust_phone,
      cust_mobile: record.cust_mobile,
      cust_website: record.cust_website,
      cust_vat_number: record.cust_vat_number,
      cust_tax_id: record.cust_tax_id,
      cust_legal_form: record.cust_legal_form,
      cust_status: record.cust_status,
      cust_segment: record.cust_segment,
      cust_source: record.cust_source,
      cust_language: record.cust_language,
      cust_currency: record.cust_currency,
      cust_credit_limit: record.cust_credit_limit,
      cust_balance: record.cust_balance,
      cust_payment_terms: record.cust_payment_terms,
      cust_marketing_opt_in: record.cust_marketing_opt_in,
      cust_marketing_channel: record.cust_marketing_channel,
      cust_preferred_contact_time: record.cust_preferred_contact_time,
      cust_notes: record.cust_notes,
    });
    setModalVisible(true);
  };

  const handleView = (record: Customer) => { setViewing(record); setViewModalVisible(true); };

  const confirmDelete = (record: Customer) => {
    confirmDialog({ group: 'customers-mgmt', message: 'Are you sure?', header: 'Confirm',
      icon: 'pi pi-exclamation-triangle', accept: () => handleDelete(record),
      acceptLabel: 'Delete', rejectLabel: 'Cancel', acceptClassName: 'p-button-danger' });
  };

  const handleDelete = async (record: Customer) => {
    try { await api.delete('/customers/' + record.cust_id); toast.showSuccess('Deleted.'); fetchData(); }
    catch (error: any) { toast.showError('Error: ' + (error.message || error)); }
  };

  const onSubmit = async (values: CustomerFormData) => {
    try {
      if (editing) { await api.put('/customers/' + editing.cust_id, values); toast.showSuccess('Updated.'); }
      else { await api.post('/customers', values); toast.showSuccess('Created.'); }
      setModalVisible(false); await fetchData();
    } catch (error: any) { toast.showError('Error: ' + (error.message || error)); }
  };

  const actionsBodyTemplate = (rowData: Customer) => (
    <div className="flex gap-1">
      <Button icon="pi pi-eye" rounded text size="small" severity="info" onClick={() => handleView(rowData)} tooltip="View" tooltipOptions={{ position: 'top' }} />
      <Button icon="pi pi-pencil" rounded text size="small" severity="warning" onClick={() => handleEdit(rowData)} tooltip="Edit" tooltipOptions={{ position: 'top' }} />
      <Button icon="pi pi-trash" rounded text size="small" severity="danger" onClick={() => confirmDelete(rowData)} tooltip="Delete" tooltipOptions={{ position: 'top' }} />
    </div>
  );

  return (
    <div className="h-full flex flex-col" style={{ backgroundColor: colors.bgPrimary, color: colors.textPrimary }}>
      <ConfirmDialog group="customers-mgmt" />

      {/* Header */}
      <div className="flex-shrink-0 p-4" style={{ borderBottom: '1px solid ' + colors.borderPrimary }}>
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold" style={{ color: colors.textPrimary }}>Customer Management</h3>
          <Button icon="pi pi-plus" label="+ Add" size="small" severity="info" onClick={handleCreate} />
        </div>
      </div>

      {/* DataTable */}
      <div className="flex-1 p-4 overflow-auto" style={{ backgroundColor: colors.bgPrimary }}>
        <div className="rounded-lg shadow-sm overflow-hidden" style={{ backgroundColor: colors.bgSecondary }}>
          <DataTable
            value={customers}
            dataKey="cust_id"
            loading={loading}
            paginator rows={20} rowsPerPageOptions={[10, 20, 50]}
            size="small" stripedRows showGridlines scrollable
            scrollHeight="calc(100vh - 300px)" emptyMessage="No records found.">
            <Column field="cust_id" header="cust_id" sortable />
            <Column field="cust_no" header="cust_no" sortable />
            <Column field="cust_first_name" header="cust_first_name" sortable />
            <Column field="cust_last_name" header="cust_last_name" sortable />
            <Column field="cust_full_name" header="cust_full_name" sortable />
            <Column field="comp_no" header="comp_no" sortable />
            <Column field="cust_email" header="cust_email" sortable />
            <Column field="cust_phone" header="cust_phone" sortable />
            <Column field="cust_mobile" header="cust_mobile" sortable />
            <Column field="cust_website" header="cust_website" sortable />
            <Column field="cust_vat_number" header="cust_vat_number" sortable />
            <Column field="cust_tax_id" header="cust_tax_id" body={(r: any) => <span>{r.?. || '-'}</span>} sortable style={{ width: '150px' }} />
            <Column field="cust_legal_form" header="cust_legal_form" sortable />
            <Column field="cust_status" header="cust_status" sortable />
            <Column field="cust_segment" header="cust_segment" sortable />
            <Column field="cust_source" header="cust_source" sortable />
            <Column field="cust_language" header="cust_language" sortable />
            <Column field="cust_currency" header="cust_currency" sortable />
            <Column field="cust_credit_limit" header="cust_credit_limit" sortable />
            <Column field="cust_balance" header="cust_balance" sortable />
            <Column field="cust_payment_terms" header="cust_payment_terms" sortable />
            <Column field="cust_marketing_opt_in" header="cust_marketing_opt_in" sortable />
            <Column field="cust_marketing_channel" header="cust_marketing_channel" sortable />
            <Column field="cust_preferred_contact_time" header="cust_preferred_contact_time" sortable />
            <Column field="cust_notes" header="cust_notes" sortable />
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
            <label htmlFor="cust_no" className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>cust_no</label>
            <Controller name="cust_no" control={control} rules={{ required: 'Required' }}
              render={({ field }) => (
                <InputNumber id="cust_no" value={field.value} onValueChange={(e) => field.onChange(e.value)}
                  useGrouping={false} className="w-full" />
              )} />
            {errors.cust_no && <small className="mt-1 block" style={{ color: colors.errorText }}>{errors.cust_no.message}</small>}
          </div>
          <div>
            <label htmlFor="cust_first_name" className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>cust_first_name</label>
            <Controller name="cust_first_name" control={control}
              render={({ field }) => <InputText id="cust_first_name" {...field} className="w-full" />} />
            {errors.cust_first_name && <small className="mt-1 block" style={{ color: colors.errorText }}>{errors.cust_first_name.message}</small>}
          </div>
          <div>
            <label htmlFor="cust_last_name" className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>cust_last_name</label>
            <Controller name="cust_last_name" control={control}
              render={({ field }) => <InputText id="cust_last_name" {...field} className="w-full" />} />
            {errors.cust_last_name && <small className="mt-1 block" style={{ color: colors.errorText }}>{errors.cust_last_name.message}</small>}
          </div>
          <div>
            <label htmlFor="cust_full_name" className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>cust_full_name</label>
            <Controller name="cust_full_name" control={control}
              render={({ field }) => <InputText id="cust_full_name" {...field} className="w-full" />} />
            {errors.cust_full_name && <small className="mt-1 block" style={{ color: colors.errorText }}>{errors.cust_full_name.message}</small>}
          </div>
          <div>
            <label htmlFor="comp_no" className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>comp_no</label>
            <Controller name="comp_no" control={control} rules={{ required: 'Required' }}
              render={({ field }) => (
                <InputNumber id="comp_no" value={field.value} onValueChange={(e) => field.onChange(e.value)}
                  useGrouping={false} className="w-full" />
              )} />
            {errors.comp_no && <small className="mt-1 block" style={{ color: colors.errorText }}>{errors.comp_no.message}</small>}
          </div>
          <div>
            <label htmlFor="cust_email" className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>cust_email</label>
            <Controller name="cust_email" control={control}
              render={({ field }) => <InputText id="cust_email" {...field} className="w-full" />} />
            {errors.cust_email && <small className="mt-1 block" style={{ color: colors.errorText }}>{errors.cust_email.message}</small>}
          </div>
          <div>
            <label htmlFor="cust_phone" className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>cust_phone</label>
            <Controller name="cust_phone" control={control}
              render={({ field }) => <InputText id="cust_phone" {...field} className="w-full" />} />
            {errors.cust_phone && <small className="mt-1 block" style={{ color: colors.errorText }}>{errors.cust_phone.message}</small>}
          </div>
          <div>
            <label htmlFor="cust_mobile" className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>cust_mobile</label>
            <Controller name="cust_mobile" control={control}
              render={({ field }) => <InputText id="cust_mobile" {...field} className="w-full" />} />
            {errors.cust_mobile && <small className="mt-1 block" style={{ color: colors.errorText }}>{errors.cust_mobile.message}</small>}
          </div>
          <div>
            <label htmlFor="cust_website" className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>cust_website</label>
            <Controller name="cust_website" control={control}
              render={({ field }) => <InputText id="cust_website" {...field} className="w-full" />} />
            {errors.cust_website && <small className="mt-1 block" style={{ color: colors.errorText }}>{errors.cust_website.message}</small>}
          </div>
          <div>
            <label htmlFor="cust_vat_number" className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>cust_vat_number</label>
            <Controller name="cust_vat_number" control={control}
              render={({ field }) => <InputText id="cust_vat_number" {...field} className="w-full" />} />
            {errors.cust_vat_number && <small className="mt-1 block" style={{ color: colors.errorText }}>{errors.cust_vat_number.message}</small>}
          </div>
          <div>
            <label htmlFor="cust_tax_id" className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>cust_tax_id</label>
            <Controller name="cust_tax_id" control={control} rules={{ required: 'Required' }}
              render={({ field }) => (
                <Dropdown id="cust_tax_id" value={field.value} onChange={(e) => field.onChange(e.value)}
                  options={Options} optionLabel="" optionValue=""
                  placeholder="Select..." filter className="w-full" />
              )} />
            {errors.cust_tax_id && <small className="mt-1 block" style={{ color: colors.errorText }}>{errors.cust_tax_id.message}</small>}
          </div>
          <div>
            <label htmlFor="cust_legal_form" className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>cust_legal_form</label>
            <Controller name="cust_legal_form" control={control}
              render={({ field }) => <InputText id="cust_legal_form" {...field} className="w-full" />} />
            {errors.cust_legal_form && <small className="mt-1 block" style={{ color: colors.errorText }}>{errors.cust_legal_form.message}</small>}
          </div>
          <div>
            <label htmlFor="cust_status" className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>cust_status</label>
            <Controller name="cust_status" control={control}
              render={({ field }) => <InputText id="cust_status" {...field} className="w-full" />} />
            {errors.cust_status && <small className="mt-1 block" style={{ color: colors.errorText }}>{errors.cust_status.message}</small>}
          </div>
          <div>
            <label htmlFor="cust_segment" className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>cust_segment</label>
            <Controller name="cust_segment" control={control}
              render={({ field }) => <InputText id="cust_segment" {...field} className="w-full" />} />
            {errors.cust_segment && <small className="mt-1 block" style={{ color: colors.errorText }}>{errors.cust_segment.message}</small>}
          </div>
          <div>
            <label htmlFor="cust_source" className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>cust_source</label>
            <Controller name="cust_source" control={control}
              render={({ field }) => <InputText id="cust_source" {...field} className="w-full" />} />
            {errors.cust_source && <small className="mt-1 block" style={{ color: colors.errorText }}>{errors.cust_source.message}</small>}
          </div>
          <div>
            <label htmlFor="cust_language" className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>cust_language</label>
            <Controller name="cust_language" control={control}
              render={({ field }) => <InputText id="cust_language" {...field} className="w-full" />} />
            {errors.cust_language && <small className="mt-1 block" style={{ color: colors.errorText }}>{errors.cust_language.message}</small>}
          </div>
          <div>
            <label htmlFor="cust_currency" className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>cust_currency</label>
            <Controller name="cust_currency" control={control}
              render={({ field }) => <InputText id="cust_currency" {...field} className="w-full" />} />
            {errors.cust_currency && <small className="mt-1 block" style={{ color: colors.errorText }}>{errors.cust_currency.message}</small>}
          </div>
          <div>
            <label htmlFor="cust_credit_limit" className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>cust_credit_limit</label>
            <Controller name="cust_credit_limit" control={control} rules={{ required: 'Required' }}
              render={({ field }) => (
                <InputNumber id="cust_credit_limit" value={field.value} onValueChange={(e) => field.onChange(e.value)}
                  mode="decimal" minFractionDigits={2} useGrouping={false} className="w-full" />
              )} />
            {errors.cust_credit_limit && <small className="mt-1 block" style={{ color: colors.errorText }}>{errors.cust_credit_limit.message}</small>}
          </div>
          <div>
            <label htmlFor="cust_balance" className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>cust_balance</label>
            <Controller name="cust_balance" control={control} rules={{ required: 'Required' }}
              render={({ field }) => (
                <InputNumber id="cust_balance" value={field.value} onValueChange={(e) => field.onChange(e.value)}
                  mode="decimal" minFractionDigits={2} useGrouping={false} className="w-full" />
              )} />
            {errors.cust_balance && <small className="mt-1 block" style={{ color: colors.errorText }}>{errors.cust_balance.message}</small>}
          </div>
          <div>
            <label htmlFor="cust_payment_terms" className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>cust_payment_terms</label>
            <Controller name="cust_payment_terms" control={control}
              render={({ field }) => <InputText id="cust_payment_terms" {...field} className="w-full" />} />
            {errors.cust_payment_terms && <small className="mt-1 block" style={{ color: colors.errorText }}>{errors.cust_payment_terms.message}</small>}
          </div>
          <div>
            <label htmlFor="cust_marketing_opt_in" className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>cust_marketing_opt_in</label>
            <Controller name="cust_marketing_opt_in" control={control} rules={{ required: 'Required' }}
              render={({ field }) => (
                <InputNumber id="cust_marketing_opt_in" value={field.value} onValueChange={(e) => field.onChange(e.value)}
                  useGrouping={false} className="w-full" />
              )} />
            {errors.cust_marketing_opt_in && <small className="mt-1 block" style={{ color: colors.errorText }}>{errors.cust_marketing_opt_in.message}</small>}
          </div>
          <div>
            <label htmlFor="cust_marketing_channel" className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>cust_marketing_channel</label>
            <Controller name="cust_marketing_channel" control={control}
              render={({ field }) => <InputText id="cust_marketing_channel" {...field} className="w-full" />} />
            {errors.cust_marketing_channel && <small className="mt-1 block" style={{ color: colors.errorText }}>{errors.cust_marketing_channel.message}</small>}
          </div>
          <div>
            <label htmlFor="cust_preferred_contact_time" className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>cust_preferred_contact_time</label>
            <Controller name="cust_preferred_contact_time" control={control}
              render={({ field }) => <InputText id="cust_preferred_contact_time" {...field} className="w-full" />} />
            {errors.cust_preferred_contact_time && <small className="mt-1 block" style={{ color: colors.errorText }}>{errors.cust_preferred_contact_time.message}</small>}
          </div>
          <div>
            <label htmlFor="cust_notes" className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>cust_notes</label>
            <Controller name="cust_notes" control={control}
              render={({ field }) => <InputTextarea id="cust_notes" {...field} rows={3} className="w-full" />} />
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
              <span className="text-sm font-medium block" style={{ color: colors.textMuted }}>cust_id</span>
              <span style={{ color: colors.textPrimary }}>{viewing.cust_id != null ? String(viewing.cust_id) : '-'}</span>
            </div>
            <div>
              <span className="text-sm font-medium block" style={{ color: colors.textMuted }}>cust_no</span>
              <span style={{ color: colors.textPrimary }}>{viewing.cust_no != null ? String(viewing.cust_no) : '-'}</span>
            </div>
            <div>
              <span className="text-sm font-medium block" style={{ color: colors.textMuted }}>cust_first_name</span>
              <span style={{ color: colors.textPrimary }}>{viewing.cust_first_name != null ? String(viewing.cust_first_name) : '-'}</span>
            </div>
            <div>
              <span className="text-sm font-medium block" style={{ color: colors.textMuted }}>cust_last_name</span>
              <span style={{ color: colors.textPrimary }}>{viewing.cust_last_name != null ? String(viewing.cust_last_name) : '-'}</span>
            </div>
            <div>
              <span className="text-sm font-medium block" style={{ color: colors.textMuted }}>cust_full_name</span>
              <span style={{ color: colors.textPrimary }}>{viewing.cust_full_name != null ? String(viewing.cust_full_name) : '-'}</span>
            </div>
            <div>
              <span className="text-sm font-medium block" style={{ color: colors.textMuted }}>comp_no</span>
              <span style={{ color: colors.textPrimary }}>{viewing.comp_no != null ? String(viewing.comp_no) : '-'}</span>
            </div>
            <div>
              <span className="text-sm font-medium block" style={{ color: colors.textMuted }}>cust_email</span>
              <span style={{ color: colors.textPrimary }}>{viewing.cust_email != null ? String(viewing.cust_email) : '-'}</span>
            </div>
            <div>
              <span className="text-sm font-medium block" style={{ color: colors.textMuted }}>cust_phone</span>
              <span style={{ color: colors.textPrimary }}>{viewing.cust_phone != null ? String(viewing.cust_phone) : '-'}</span>
            </div>
            <div>
              <span className="text-sm font-medium block" style={{ color: colors.textMuted }}>cust_mobile</span>
              <span style={{ color: colors.textPrimary }}>{viewing.cust_mobile != null ? String(viewing.cust_mobile) : '-'}</span>
            </div>
            <div>
              <span className="text-sm font-medium block" style={{ color: colors.textMuted }}>cust_website</span>
              <span style={{ color: colors.textPrimary }}>{viewing.cust_website != null ? String(viewing.cust_website) : '-'}</span>
            </div>
            <div>
              <span className="text-sm font-medium block" style={{ color: colors.textMuted }}>cust_vat_number</span>
              <span style={{ color: colors.textPrimary }}>{viewing.cust_vat_number != null ? String(viewing.cust_vat_number) : '-'}</span>
            </div>
            <div>
              <span className="text-sm font-medium block" style={{ color: colors.textMuted }}>cust_tax_id</span>
              <span style={{ color: colors.textPrimary }}>{viewing.?. || '-'}</span>
            </div>
            <div>
              <span className="text-sm font-medium block" style={{ color: colors.textMuted }}>cust_legal_form</span>
              <span style={{ color: colors.textPrimary }}>{viewing.cust_legal_form != null ? String(viewing.cust_legal_form) : '-'}</span>
            </div>
            <div>
              <span className="text-sm font-medium block" style={{ color: colors.textMuted }}>cust_status</span>
              <span style={{ color: colors.textPrimary }}>{viewing.cust_status != null ? String(viewing.cust_status) : '-'}</span>
            </div>
            <div>
              <span className="text-sm font-medium block" style={{ color: colors.textMuted }}>cust_segment</span>
              <span style={{ color: colors.textPrimary }}>{viewing.cust_segment != null ? String(viewing.cust_segment) : '-'}</span>
            </div>
            <div>
              <span className="text-sm font-medium block" style={{ color: colors.textMuted }}>cust_source</span>
              <span style={{ color: colors.textPrimary }}>{viewing.cust_source != null ? String(viewing.cust_source) : '-'}</span>
            </div>
            <div>
              <span className="text-sm font-medium block" style={{ color: colors.textMuted }}>cust_language</span>
              <span style={{ color: colors.textPrimary }}>{viewing.cust_language != null ? String(viewing.cust_language) : '-'}</span>
            </div>
            <div>
              <span className="text-sm font-medium block" style={{ color: colors.textMuted }}>cust_currency</span>
              <span style={{ color: colors.textPrimary }}>{viewing.cust_currency != null ? String(viewing.cust_currency) : '-'}</span>
            </div>
            <div>
              <span className="text-sm font-medium block" style={{ color: colors.textMuted }}>cust_credit_limit</span>
              <span style={{ color: colors.textPrimary }}>{viewing.cust_credit_limit != null ? String(viewing.cust_credit_limit) : '-'}</span>
            </div>
            <div>
              <span className="text-sm font-medium block" style={{ color: colors.textMuted }}>cust_balance</span>
              <span style={{ color: colors.textPrimary }}>{viewing.cust_balance != null ? String(viewing.cust_balance) : '-'}</span>
            </div>
            <div>
              <span className="text-sm font-medium block" style={{ color: colors.textMuted }}>cust_payment_terms</span>
              <span style={{ color: colors.textPrimary }}>{viewing.cust_payment_terms != null ? String(viewing.cust_payment_terms) : '-'}</span>
            </div>
            <div>
              <span className="text-sm font-medium block" style={{ color: colors.textMuted }}>cust_marketing_opt_in</span>
              <span style={{ color: colors.textPrimary }}>{viewing.cust_marketing_opt_in != null ? String(viewing.cust_marketing_opt_in) : '-'}</span>
            </div>
            <div>
              <span className="text-sm font-medium block" style={{ color: colors.textMuted }}>cust_marketing_channel</span>
              <span style={{ color: colors.textPrimary }}>{viewing.cust_marketing_channel != null ? String(viewing.cust_marketing_channel) : '-'}</span>
            </div>
            <div>
              <span className="text-sm font-medium block" style={{ color: colors.textMuted }}>cust_preferred_contact_time</span>
              <span style={{ color: colors.textPrimary }}>{viewing.cust_preferred_contact_time != null ? String(viewing.cust_preferred_contact_time) : '-'}</span>
            </div>
            <div>
              <span className="text-sm font-medium block" style={{ color: colors.textMuted }}>cust_notes</span>
              <span style={{ color: colors.textPrimary }}>{viewing.cust_notes != null ? String(viewing.cust_notes) : '-'}</span>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}
