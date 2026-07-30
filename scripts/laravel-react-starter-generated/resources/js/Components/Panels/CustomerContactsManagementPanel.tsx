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

interface CustomerContact {
  cc_id: number;
  cc_no: number;
  cust_no: number;
  cont_no: number;
  cc_cont_is_primary: number;
  contacts?: any;
  customers?: any;
}

interface CustomerContactFormData {
  cc_no: number;
  cust_no: number;
  cont_no: number;
  cc_cont_is_primary: number;
}

export default function CustomerContactManagementPanel() {
  const [currentLanguage] = React.useState<SupportedLanguage>(getStoredLanguage());
  const { t } = useTranslation(currentLanguage);
  const toast = useToast();
  const { colors } = useTheme();
  const [customerContacts, setCustomerContacts] = useState<CustomerContact[]>([]);
  const [contactsOptions, setContactsOptions] = useState<any[]>([]);
  const [customersOptions, setCustomersOptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [editing, setEditing] = useState<CustomerContact | null>(null);
  const [viewing, setViewing] = useState<CustomerContact | null>(null);

  const defaultValues: CustomerContactFormData = {
    cc_no: 0,
    cust_no: 0,
    cont_no: 0,
    cc_cont_is_primary: 0,
  };

  const { control, handleSubmit, reset, formState: { errors } } = useForm<CustomerContactFormData>({ defaultValues });

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await api.get('/customer_contacts');
      setCustomerContacts(data);
    } catch (error: any) { toast.showError('Failed: ' + (error.message || error)); } finally { setLoading(false); }
  };

  const fetchContacts = async () => {
    try { const data = await api.get('/contacts'); setContactsOptions(data); }
    catch (error: any) { toast.showError('Failed: ' + (error.message || error)); }
  };

  const fetchCustomers = async () => {
    try { const data = await api.get('/customers'); setCustomersOptions(data); }
    catch (error: any) { toast.showError('Failed: ' + (error.message || error)); }
  };

  useEffect(() => {
    fetchData();
    fetchContacts();
    fetchCustomers();
  }, []);

  const handleCreate = () => { setEditing(null); reset(defaultValues); setModalVisible(true); };

  const handleEdit = (record: CustomerContact) => {
    setEditing(record);
    reset({
      cc_no: record.cc_no,
      cust_no: record.cust_no,
      cont_no: record.cont_no,
      cc_cont_is_primary: record.cc_cont_is_primary,
    });
    setModalVisible(true);
  };

  const handleView = (record: CustomerContact) => { setViewing(record); setViewModalVisible(true); };

  const confirmDelete = (record: CustomerContact) => {
    confirmDialog({ group: 'customer_contacts-mgmt', message: 'Are you sure?', header: 'Confirm',
      icon: 'pi pi-exclamation-triangle', accept: () => handleDelete(record),
      acceptLabel: 'Delete', rejectLabel: 'Cancel', acceptClassName: 'p-button-danger' });
  };

  const handleDelete = async (record: CustomerContact) => {
    try { await api.delete('/customer_contacts/' + record.cc_id); toast.showSuccess('Deleted.'); fetchData(); }
    catch (error: any) { toast.showError('Error: ' + (error.message || error)); }
  };

  const onSubmit = async (values: CustomerContactFormData) => {
    try {
      if (editing) { await api.put('/customer_contacts/' + editing.cc_id, values); toast.showSuccess('Updated.'); }
      else { await api.post('/customer_contacts', values); toast.showSuccess('Created.'); }
      setModalVisible(false); await fetchData();
    } catch (error: any) { toast.showError('Error: ' + (error.message || error)); }
  };

  const actionsBodyTemplate = (rowData: CustomerContact) => (
    <div className="flex gap-1">
      <Button icon="pi pi-eye" rounded text size="small" severity="info" onClick={() => handleView(rowData)} tooltip="View" tooltipOptions={{ position: 'top' }} />
      <Button icon="pi pi-pencil" rounded text size="small" severity="warning" onClick={() => handleEdit(rowData)} tooltip="Edit" tooltipOptions={{ position: 'top' }} />
      <Button icon="pi pi-trash" rounded text size="small" severity="danger" onClick={() => confirmDelete(rowData)} tooltip="Delete" tooltipOptions={{ position: 'top' }} />
    </div>
  );

  return (
    <div className="h-full flex flex-col" style={{ backgroundColor: colors.bgPrimary, color: colors.textPrimary }}>
      <ConfirmDialog group="customer_contacts-mgmt" />

      {/* Header */}
      <div className="flex-shrink-0 p-4" style={{ borderBottom: '1px solid ' + colors.borderPrimary }}>
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold" style={{ color: colors.textPrimary }}>CustomerContact Management</h3>
          <Button icon="pi pi-plus" label="+ Add" size="small" severity="info" onClick={handleCreate} />
        </div>
      </div>

      {/* DataTable */}
      <div className="flex-1 p-4 overflow-auto" style={{ backgroundColor: colors.bgPrimary }}>
        <div className="rounded-lg shadow-sm overflow-hidden" style={{ backgroundColor: colors.bgSecondary }}>
          <DataTable
            value={customerContacts}
            dataKey="cc_id"
            loading={loading}
            paginator rows={20} rowsPerPageOptions={[10, 20, 50]}
            size="small" stripedRows showGridlines scrollable
            scrollHeight="calc(100vh - 300px)" emptyMessage="No records found.">
            <Column field="cc_id" header="cc_id" sortable />
            <Column field="cc_no" header="cc_no" sortable />
            <Column field="cust_no" header="cust_no" sortable />
            <Column field="cont_no" header="cont_no" sortable />
            <Column field="cc_cont_is_primary" header="cc_cont_is_primary" sortable />
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
            <label htmlFor="cc_no" className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>cc_no</label>
            <Controller name="cc_no" control={control} rules={{ required: 'Required' }}
              render={({ field }) => (
                <InputNumber id="cc_no" value={field.value} onValueChange={(e) => field.onChange(e.value)}
                  useGrouping={false} className="w-full" />
              )} />
            {errors.cc_no && <small className="mt-1 block" style={{ color: colors.errorText }}>{errors.cc_no.message}</small>}
          </div>
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
            <label htmlFor="cont_no" className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>cont_no</label>
            <Controller name="cont_no" control={control} rules={{ required: 'Required' }}
              render={({ field }) => (
                <InputNumber id="cont_no" value={field.value} onValueChange={(e) => field.onChange(e.value)}
                  useGrouping={false} className="w-full" />
              )} />
            {errors.cont_no && <small className="mt-1 block" style={{ color: colors.errorText }}>{errors.cont_no.message}</small>}
          </div>
          <div>
            <label htmlFor="cc_cont_is_primary" className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>cc_cont_is_primary</label>
            <Controller name="cc_cont_is_primary" control={control} rules={{ required: 'Required' }}
              render={({ field }) => (
                <InputNumber id="cc_cont_is_primary" value={field.value} onValueChange={(e) => field.onChange(e.value)}
                  useGrouping={false} className="w-full" />
              )} />
            {errors.cc_cont_is_primary && <small className="mt-1 block" style={{ color: colors.errorText }}>{errors.cc_cont_is_primary.message}</small>}
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
              <span className="text-sm font-medium block" style={{ color: colors.textMuted }}>cc_id</span>
              <span style={{ color: colors.textPrimary }}>{viewing.cc_id != null ? String(viewing.cc_id) : '-'}</span>
            </div>
            <div>
              <span className="text-sm font-medium block" style={{ color: colors.textMuted }}>cc_no</span>
              <span style={{ color: colors.textPrimary }}>{viewing.cc_no != null ? String(viewing.cc_no) : '-'}</span>
            </div>
            <div>
              <span className="text-sm font-medium block" style={{ color: colors.textMuted }}>cust_no</span>
              <span style={{ color: colors.textPrimary }}>{viewing.cust_no != null ? String(viewing.cust_no) : '-'}</span>
            </div>
            <div>
              <span className="text-sm font-medium block" style={{ color: colors.textMuted }}>cont_no</span>
              <span style={{ color: colors.textPrimary }}>{viewing.cont_no != null ? String(viewing.cont_no) : '-'}</span>
            </div>
            <div>
              <span className="text-sm font-medium block" style={{ color: colors.textMuted }}>cc_cont_is_primary</span>
              <span style={{ color: colors.textPrimary }}>{viewing.cc_cont_is_primary != null ? String(viewing.cc_cont_is_primary) : '-'}</span>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}
