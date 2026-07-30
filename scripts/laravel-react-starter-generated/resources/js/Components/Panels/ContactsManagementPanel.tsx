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

interface Contact {
  cont_id: number;
  cont_no: number;
  cont_first_name: string;
  cont_last_name: string;
  cont_title: string;
  cont_role: string;
  cont_email: string;
  cont_phone: string;
  cont_mobile: string;
  cont_preferred_channel: string;
  cont_notes: string;
  cont_created_at: string;
  addr_no: number;
  addresses?: any;
}

interface ContactFormData {
  cont_no: number;
  cont_first_name: string;
  cont_last_name: string;
  cont_title: string;
  cont_role: string;
  cont_email: string;
  cont_phone: string;
  cont_mobile: string;
  cont_preferred_channel: string;
  cont_notes: string;
  addr_no: number;
}

export default function ContactManagementPanel() {
  const [currentLanguage] = React.useState<SupportedLanguage>(getStoredLanguage());
  const { t } = useTranslation(currentLanguage);
  const toast = useToast();
  const { colors } = useTheme();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [addressesOptions, setAddressesOptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [editing, setEditing] = useState<Contact | null>(null);
  const [viewing, setViewing] = useState<Contact | null>(null);

  const defaultValues: ContactFormData = {
    cont_no: 0,
    cont_first_name: '',
    cont_last_name: '',
    cont_title: '',
    cont_role: '',
    cont_email: '',
    cont_phone: '',
    cont_mobile: '',
    cont_preferred_channel: '',
    cont_notes: '',
    addr_no: 0,
  };

  const { control, handleSubmit, reset, formState: { errors } } = useForm<ContactFormData>({ defaultValues });

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await api.get('/contacts');
      setContacts(data);
    } catch (error: any) { toast.showError('Failed: ' + (error.message || error)); } finally { setLoading(false); }
  };

  const fetchAddresses = async () => {
    try { const data = await api.get('/addresses'); setAddressesOptions(data); }
    catch (error: any) { toast.showError('Failed: ' + (error.message || error)); }
  };

  useEffect(() => {
    fetchData();
    fetchAddresses();
  }, []);

  const handleCreate = () => { setEditing(null); reset(defaultValues); setModalVisible(true); };

  const handleEdit = (record: Contact) => {
    setEditing(record);
    reset({
      cont_no: record.cont_no,
      cont_first_name: record.cont_first_name,
      cont_last_name: record.cont_last_name,
      cont_title: record.cont_title,
      cont_role: record.cont_role,
      cont_email: record.cont_email,
      cont_phone: record.cont_phone,
      cont_mobile: record.cont_mobile,
      cont_preferred_channel: record.cont_preferred_channel,
      cont_notes: record.cont_notes,
      addr_no: record.addr_no,
    });
    setModalVisible(true);
  };

  const handleView = (record: Contact) => { setViewing(record); setViewModalVisible(true); };

  const confirmDelete = (record: Contact) => {
    confirmDialog({ group: 'contacts-mgmt', message: 'Are you sure?', header: 'Confirm',
      icon: 'pi pi-exclamation-triangle', accept: () => handleDelete(record),
      acceptLabel: 'Delete', rejectLabel: 'Cancel', acceptClassName: 'p-button-danger' });
  };

  const handleDelete = async (record: Contact) => {
    try { await api.delete('/contacts/' + record.cont_id); toast.showSuccess('Deleted.'); fetchData(); }
    catch (error: any) { toast.showError('Error: ' + (error.message || error)); }
  };

  const onSubmit = async (values: ContactFormData) => {
    try {
      if (editing) { await api.put('/contacts/' + editing.cont_id, values); toast.showSuccess('Updated.'); }
      else { await api.post('/contacts', values); toast.showSuccess('Created.'); }
      setModalVisible(false); await fetchData();
    } catch (error: any) { toast.showError('Error: ' + (error.message || error)); }
  };

  const actionsBodyTemplate = (rowData: Contact) => (
    <div className="flex gap-1">
      <Button icon="pi pi-eye" rounded text size="small" severity="info" onClick={() => handleView(rowData)} tooltip="View" tooltipOptions={{ position: 'top' }} />
      <Button icon="pi pi-pencil" rounded text size="small" severity="warning" onClick={() => handleEdit(rowData)} tooltip="Edit" tooltipOptions={{ position: 'top' }} />
      <Button icon="pi pi-trash" rounded text size="small" severity="danger" onClick={() => confirmDelete(rowData)} tooltip="Delete" tooltipOptions={{ position: 'top' }} />
    </div>
  );

  return (
    <div className="h-full flex flex-col" style={{ backgroundColor: colors.bgPrimary, color: colors.textPrimary }}>
      <ConfirmDialog group="contacts-mgmt" />

      {/* Header */}
      <div className="flex-shrink-0 p-4" style={{ borderBottom: '1px solid ' + colors.borderPrimary }}>
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold" style={{ color: colors.textPrimary }}>Contact Management</h3>
          <Button icon="pi pi-plus" label="+ Add" size="small" severity="info" onClick={handleCreate} />
        </div>
      </div>

      {/* DataTable */}
      <div className="flex-1 p-4 overflow-auto" style={{ backgroundColor: colors.bgPrimary }}>
        <div className="rounded-lg shadow-sm overflow-hidden" style={{ backgroundColor: colors.bgSecondary }}>
          <DataTable
            value={contacts}
            dataKey="cont_id"
            loading={loading}
            paginator rows={20} rowsPerPageOptions={[10, 20, 50]}
            size="small" stripedRows showGridlines scrollable
            scrollHeight="calc(100vh - 300px)" emptyMessage="No records found.">
            <Column field="cont_id" header="cont_id" sortable />
            <Column field="cont_no" header="cont_no" sortable />
            <Column field="cont_first_name" header="cont_first_name" sortable />
            <Column field="cont_last_name" header="cont_last_name" sortable />
            <Column field="cont_title" header="cont_title" sortable />
            <Column field="cont_role" header="cont_role" sortable />
            <Column field="cont_email" header="cont_email" sortable />
            <Column field="cont_phone" header="cont_phone" sortable />
            <Column field="cont_mobile" header="cont_mobile" sortable />
            <Column field="cont_preferred_channel" header="cont_preferred_channel" sortable />
            <Column field="cont_notes" header="cont_notes" sortable />
            <Column field="addr_no" header="addr_no" sortable />
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
            <label htmlFor="cont_no" className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>cont_no</label>
            <Controller name="cont_no" control={control} rules={{ required: 'Required' }}
              render={({ field }) => (
                <InputNumber id="cont_no" value={field.value} onValueChange={(e) => field.onChange(e.value)}
                  useGrouping={false} className="w-full" />
              )} />
            {errors.cont_no && <small className="mt-1 block" style={{ color: colors.errorText }}>{errors.cont_no.message}</small>}
          </div>
          <div>
            <label htmlFor="cont_first_name" className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>cont_first_name</label>
            <Controller name="cont_first_name" control={control}
              render={({ field }) => <InputText id="cont_first_name" {...field} className="w-full" />} />
            {errors.cont_first_name && <small className="mt-1 block" style={{ color: colors.errorText }}>{errors.cont_first_name.message}</small>}
          </div>
          <div>
            <label htmlFor="cont_last_name" className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>cont_last_name</label>
            <Controller name="cont_last_name" control={control}
              render={({ field }) => <InputText id="cont_last_name" {...field} className="w-full" />} />
            {errors.cont_last_name && <small className="mt-1 block" style={{ color: colors.errorText }}>{errors.cont_last_name.message}</small>}
          </div>
          <div>
            <label htmlFor="cont_title" className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>cont_title</label>
            <Controller name="cont_title" control={control}
              render={({ field }) => <InputText id="cont_title" {...field} className="w-full" />} />
            {errors.cont_title && <small className="mt-1 block" style={{ color: colors.errorText }}>{errors.cont_title.message}</small>}
          </div>
          <div>
            <label htmlFor="cont_role" className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>cont_role</label>
            <Controller name="cont_role" control={control}
              render={({ field }) => <InputText id="cont_role" {...field} className="w-full" />} />
            {errors.cont_role && <small className="mt-1 block" style={{ color: colors.errorText }}>{errors.cont_role.message}</small>}
          </div>
          <div>
            <label htmlFor="cont_email" className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>cont_email</label>
            <Controller name="cont_email" control={control}
              render={({ field }) => <InputText id="cont_email" {...field} className="w-full" />} />
            {errors.cont_email && <small className="mt-1 block" style={{ color: colors.errorText }}>{errors.cont_email.message}</small>}
          </div>
          <div>
            <label htmlFor="cont_phone" className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>cont_phone</label>
            <Controller name="cont_phone" control={control}
              render={({ field }) => <InputText id="cont_phone" {...field} className="w-full" />} />
            {errors.cont_phone && <small className="mt-1 block" style={{ color: colors.errorText }}>{errors.cont_phone.message}</small>}
          </div>
          <div>
            <label htmlFor="cont_mobile" className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>cont_mobile</label>
            <Controller name="cont_mobile" control={control}
              render={({ field }) => <InputText id="cont_mobile" {...field} className="w-full" />} />
            {errors.cont_mobile && <small className="mt-1 block" style={{ color: colors.errorText }}>{errors.cont_mobile.message}</small>}
          </div>
          <div>
            <label htmlFor="cont_preferred_channel" className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>cont_preferred_channel</label>
            <Controller name="cont_preferred_channel" control={control}
              render={({ field }) => <InputText id="cont_preferred_channel" {...field} className="w-full" />} />
            {errors.cont_preferred_channel && <small className="mt-1 block" style={{ color: colors.errorText }}>{errors.cont_preferred_channel.message}</small>}
          </div>
          <div>
            <label htmlFor="cont_notes" className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>cont_notes</label>
            <Controller name="cont_notes" control={control}
              render={({ field }) => <InputTextarea id="cont_notes" {...field} rows={3} className="w-full" />} />
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
              <span className="text-sm font-medium block" style={{ color: colors.textMuted }}>cont_id</span>
              <span style={{ color: colors.textPrimary }}>{viewing.cont_id != null ? String(viewing.cont_id) : '-'}</span>
            </div>
            <div>
              <span className="text-sm font-medium block" style={{ color: colors.textMuted }}>cont_no</span>
              <span style={{ color: colors.textPrimary }}>{viewing.cont_no != null ? String(viewing.cont_no) : '-'}</span>
            </div>
            <div>
              <span className="text-sm font-medium block" style={{ color: colors.textMuted }}>cont_first_name</span>
              <span style={{ color: colors.textPrimary }}>{viewing.cont_first_name != null ? String(viewing.cont_first_name) : '-'}</span>
            </div>
            <div>
              <span className="text-sm font-medium block" style={{ color: colors.textMuted }}>cont_last_name</span>
              <span style={{ color: colors.textPrimary }}>{viewing.cont_last_name != null ? String(viewing.cont_last_name) : '-'}</span>
            </div>
            <div>
              <span className="text-sm font-medium block" style={{ color: colors.textMuted }}>cont_title</span>
              <span style={{ color: colors.textPrimary }}>{viewing.cont_title != null ? String(viewing.cont_title) : '-'}</span>
            </div>
            <div>
              <span className="text-sm font-medium block" style={{ color: colors.textMuted }}>cont_role</span>
              <span style={{ color: colors.textPrimary }}>{viewing.cont_role != null ? String(viewing.cont_role) : '-'}</span>
            </div>
            <div>
              <span className="text-sm font-medium block" style={{ color: colors.textMuted }}>cont_email</span>
              <span style={{ color: colors.textPrimary }}>{viewing.cont_email != null ? String(viewing.cont_email) : '-'}</span>
            </div>
            <div>
              <span className="text-sm font-medium block" style={{ color: colors.textMuted }}>cont_phone</span>
              <span style={{ color: colors.textPrimary }}>{viewing.cont_phone != null ? String(viewing.cont_phone) : '-'}</span>
            </div>
            <div>
              <span className="text-sm font-medium block" style={{ color: colors.textMuted }}>cont_mobile</span>
              <span style={{ color: colors.textPrimary }}>{viewing.cont_mobile != null ? String(viewing.cont_mobile) : '-'}</span>
            </div>
            <div>
              <span className="text-sm font-medium block" style={{ color: colors.textMuted }}>cont_preferred_channel</span>
              <span style={{ color: colors.textPrimary }}>{viewing.cont_preferred_channel != null ? String(viewing.cont_preferred_channel) : '-'}</span>
            </div>
            <div>
              <span className="text-sm font-medium block" style={{ color: colors.textMuted }}>cont_notes</span>
              <span style={{ color: colors.textPrimary }}>{viewing.cont_notes != null ? String(viewing.cont_notes) : '-'}</span>
            </div>
            <div>
              <span className="text-sm font-medium block" style={{ color: colors.textMuted }}>addr_no</span>
              <span style={{ color: colors.textPrimary }}>{viewing.addr_no != null ? String(viewing.addr_no) : '-'}</span>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}
