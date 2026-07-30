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

interface CustomerAddress {
  ca_i: number;
  ca_no: number;
  cust_no: number;
  addr_no: number;
  ca_addr_type: string;
  addresses?: any;
  customers?: any;
}

interface CustomerAddressFormData {
  ca_no: number;
  cust_no: number;
  addr_no: number;
  ca_addr_type: string;
}

export default function CustomerAddressManagementPanel() {
  const [currentLanguage] = React.useState<SupportedLanguage>(getStoredLanguage());
  const { t } = useTranslation(currentLanguage);
  const toast = useToast();
  const { colors } = useTheme();
  const [customerAddresses, setCustomerAddresses] = useState<CustomerAddress[]>([]);
  const [addressesOptions, setAddressesOptions] = useState<any[]>([]);
  const [customersOptions, setCustomersOptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [editing, setEditing] = useState<CustomerAddress | null>(null);
  const [viewing, setViewing] = useState<CustomerAddress | null>(null);

  const defaultValues: CustomerAddressFormData = {
    ca_no: 0,
    cust_no: 0,
    addr_no: 0,
    ca_addr_type: '',
  };

  const { control, handleSubmit, reset, formState: { errors } } = useForm<CustomerAddressFormData>({ defaultValues });

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await api.get('/customer_addresses');
      setCustomerAddresses(data);
    } catch (error: any) { toast.showError('Failed: ' + (error.message || error)); } finally { setLoading(false); }
  };

  const fetchAddresses = async () => {
    try { const data = await api.get('/addresses'); setAddressesOptions(data); }
    catch (error: any) { toast.showError('Failed: ' + (error.message || error)); }
  };

  const fetchCustomers = async () => {
    try { const data = await api.get('/customers'); setCustomersOptions(data); }
    catch (error: any) { toast.showError('Failed: ' + (error.message || error)); }
  };

  useEffect(() => {
    fetchData();
    fetchAddresses();
    fetchCustomers();
  }, []);

  const handleCreate = () => { setEditing(null); reset(defaultValues); setModalVisible(true); };

  const handleEdit = (record: CustomerAddress) => {
    setEditing(record);
    reset({
      ca_no: record.ca_no,
      cust_no: record.cust_no,
      addr_no: record.addr_no,
      ca_addr_type: record.ca_addr_type,
    });
    setModalVisible(true);
  };

  const handleView = (record: CustomerAddress) => { setViewing(record); setViewModalVisible(true); };

  const confirmDelete = (record: CustomerAddress) => {
    confirmDialog({ group: 'customer_addresses-mgmt', message: 'Are you sure?', header: 'Confirm',
      icon: 'pi pi-exclamation-triangle', accept: () => handleDelete(record),
      acceptLabel: 'Delete', rejectLabel: 'Cancel', acceptClassName: 'p-button-danger' });
  };

  const handleDelete = async (record: CustomerAddress) => {
    try { await api.delete('/customer_addresses/' + record.ca_i); toast.showSuccess('Deleted.'); fetchData(); }
    catch (error: any) { toast.showError('Error: ' + (error.message || error)); }
  };

  const onSubmit = async (values: CustomerAddressFormData) => {
    try {
      if (editing) { await api.put('/customer_addresses/' + editing.ca_i, values); toast.showSuccess('Updated.'); }
      else { await api.post('/customer_addresses', values); toast.showSuccess('Created.'); }
      setModalVisible(false); await fetchData();
    } catch (error: any) { toast.showError('Error: ' + (error.message || error)); }
  };

  const actionsBodyTemplate = (rowData: CustomerAddress) => (
    <div className="flex gap-1">
      <Button icon="pi pi-eye" rounded text size="small" severity="info" onClick={() => handleView(rowData)} tooltip="View" tooltipOptions={{ position: 'top' }} />
      <Button icon="pi pi-pencil" rounded text size="small" severity="warning" onClick={() => handleEdit(rowData)} tooltip="Edit" tooltipOptions={{ position: 'top' }} />
      <Button icon="pi pi-trash" rounded text size="small" severity="danger" onClick={() => confirmDelete(rowData)} tooltip="Delete" tooltipOptions={{ position: 'top' }} />
    </div>
  );

  return (
    <div className="h-full flex flex-col" style={{ backgroundColor: colors.bgPrimary, color: colors.textPrimary }}>
      <ConfirmDialog group="customer_addresses-mgmt" />

      {/* Header */}
      <div className="flex-shrink-0 p-4" style={{ borderBottom: '1px solid ' + colors.borderPrimary }}>
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold" style={{ color: colors.textPrimary }}>CustomerAddress Management</h3>
          <Button icon="pi pi-plus" label="+ Add" size="small" severity="info" onClick={handleCreate} />
        </div>
      </div>

      {/* DataTable */}
      <div className="flex-1 p-4 overflow-auto" style={{ backgroundColor: colors.bgPrimary }}>
        <div className="rounded-lg shadow-sm overflow-hidden" style={{ backgroundColor: colors.bgSecondary }}>
          <DataTable
            value={customerAddresses}
            dataKey="ca_i"
            loading={loading}
            paginator rows={20} rowsPerPageOptions={[10, 20, 50]}
            size="small" stripedRows showGridlines scrollable
            scrollHeight="calc(100vh - 300px)" emptyMessage="No records found.">
            <Column field="ca_i" header="ca_i" sortable />
            <Column field="ca_no" header="ca_no" sortable />
            <Column field="cust_no" header="cust_no" sortable />
            <Column field="addr_no" header="addr_no" sortable />
            <Column field="ca_addr_type" header="ca_addr_type" sortable />
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
            <label htmlFor="ca_no" className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>ca_no</label>
            <Controller name="ca_no" control={control} rules={{ required: 'Required' }}
              render={({ field }) => (
                <InputNumber id="ca_no" value={field.value} onValueChange={(e) => field.onChange(e.value)}
                  useGrouping={false} className="w-full" />
              )} />
            {errors.ca_no && <small className="mt-1 block" style={{ color: colors.errorText }}>{errors.ca_no.message}</small>}
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
            <label htmlFor="addr_no" className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>addr_no</label>
            <Controller name="addr_no" control={control} rules={{ required: 'Required' }}
              render={({ field }) => (
                <InputNumber id="addr_no" value={field.value} onValueChange={(e) => field.onChange(e.value)}
                  useGrouping={false} className="w-full" />
              )} />
            {errors.addr_no && <small className="mt-1 block" style={{ color: colors.errorText }}>{errors.addr_no.message}</small>}
          </div>
          <div>
            <label htmlFor="ca_addr_type" className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>ca_addr_type</label>
            <Controller name="ca_addr_type" control={control}
              render={({ field }) => <InputText id="ca_addr_type" {...field} className="w-full" />} />
            {errors.ca_addr_type && <small className="mt-1 block" style={{ color: colors.errorText }}>{errors.ca_addr_type.message}</small>}
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
              <span className="text-sm font-medium block" style={{ color: colors.textMuted }}>ca_i</span>
              <span style={{ color: colors.textPrimary }}>{viewing.ca_i != null ? String(viewing.ca_i) : '-'}</span>
            </div>
            <div>
              <span className="text-sm font-medium block" style={{ color: colors.textMuted }}>ca_no</span>
              <span style={{ color: colors.textPrimary }}>{viewing.ca_no != null ? String(viewing.ca_no) : '-'}</span>
            </div>
            <div>
              <span className="text-sm font-medium block" style={{ color: colors.textMuted }}>cust_no</span>
              <span style={{ color: colors.textPrimary }}>{viewing.cust_no != null ? String(viewing.cust_no) : '-'}</span>
            </div>
            <div>
              <span className="text-sm font-medium block" style={{ color: colors.textMuted }}>addr_no</span>
              <span style={{ color: colors.textPrimary }}>{viewing.addr_no != null ? String(viewing.addr_no) : '-'}</span>
            </div>
            <div>
              <span className="text-sm font-medium block" style={{ color: colors.textMuted }}>ca_addr_type</span>
              <span style={{ color: colors.textPrimary }}>{viewing.ca_addr_type != null ? String(viewing.ca_addr_type) : '-'}</span>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}
