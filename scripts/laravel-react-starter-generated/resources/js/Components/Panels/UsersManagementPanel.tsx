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

interface User {
  id: number;
  name: string;
  email: string;
  avatar_path: string;
  language: string;
  email_verified_at: string;
  password: string;
  remember_token: string;
  created_at: string;
  updated_at: string;
  two_factor_secret: string;
  two_factor_enabled: number;
  two_factor_confirmed_at: string;
  two_factor_recovery_codes: string;
  two_factor_trusted_devices: string;
  two_factor_last_verified_at: string;
}

interface UserFormData {
  name: string;
  email: string;
  avatar_path: string;
  language: string;
  email_verified_at: string;
  password: string;
  remember_token: string;
  two_factor_secret: string;
  two_factor_enabled: number;
  two_factor_confirmed_at: string;
  two_factor_recovery_codes: string;
  two_factor_trusted_devices: string;
  two_factor_last_verified_at: string;
}

export default function UserManagementPanel() {
  const [currentLanguage] = React.useState<SupportedLanguage>(getStoredLanguage());
  const { t } = useTranslation(currentLanguage);
  const toast = useToast();
  const { colors } = useTheme();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [viewing, setViewing] = useState<User | null>(null);

  const defaultValues: UserFormData = {
    name: '',
    email: '',
    avatar_path: '',
    language: '',
    email_verified_at: new Date().toISOString().slice(0, 16),
    password: '',
    remember_token: '',
    two_factor_secret: '',
    two_factor_enabled: 0,
    two_factor_confirmed_at: new Date().toISOString().slice(0, 16),
    two_factor_recovery_codes: '',
    two_factor_trusted_devices: '',
    two_factor_last_verified_at: new Date().toISOString().slice(0, 16),
  };

  const { control, handleSubmit, reset, formState: { errors } } = useForm<UserFormData>({ defaultValues });

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await api.get('/users');
      setUsers(data);
    } catch (error: any) { toast.showError('Failed: ' + (error.message || error)); } finally { setLoading(false); }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = () => { setEditing(null); reset(defaultValues); setModalVisible(true); };

  const handleEdit = (record: User) => {
    setEditing(record);
    reset({
      name: record.name,
      email: record.email,
      avatar_path: record.avatar_path,
      language: record.language,
      email_verified_at: record.email_verified_at ? record.email_verified_at.slice(0, 16) : '',
      password: record.password,
      remember_token: record.remember_token,
      two_factor_secret: record.two_factor_secret,
      two_factor_enabled: record.two_factor_enabled,
      two_factor_confirmed_at: record.two_factor_confirmed_at ? record.two_factor_confirmed_at.slice(0, 16) : '',
      two_factor_recovery_codes: record.two_factor_recovery_codes,
      two_factor_trusted_devices: record.two_factor_trusted_devices,
      two_factor_last_verified_at: record.two_factor_last_verified_at ? record.two_factor_last_verified_at.slice(0, 16) : '',
    });
    setModalVisible(true);
  };

  const handleView = (record: User) => { setViewing(record); setViewModalVisible(true); };

  const confirmDelete = (record: User) => {
    confirmDialog({ group: 'users-mgmt', message: 'Are you sure?', header: 'Confirm',
      icon: 'pi pi-exclamation-triangle', accept: () => handleDelete(record),
      acceptLabel: 'Delete', rejectLabel: 'Cancel', acceptClassName: 'p-button-danger' });
  };

  const handleDelete = async (record: User) => {
    try { await api.delete('/users/' + record.id); toast.showSuccess('Deleted.'); fetchData(); }
    catch (error: any) { toast.showError('Error: ' + (error.message || error)); }
  };

  const onSubmit = async (values: UserFormData) => {
    try {
      if (editing) { await api.put('/users/' + editing.id, values); toast.showSuccess('Updated.'); }
      else { await api.post('/users', values); toast.showSuccess('Created.'); }
      setModalVisible(false); await fetchData();
    } catch (error: any) { toast.showError('Error: ' + (error.message || error)); }
  };

  const actionsBodyTemplate = (rowData: User) => (
    <div className="flex gap-1">
      <Button icon="pi pi-eye" rounded text size="small" severity="info" onClick={() => handleView(rowData)} tooltip="View" tooltipOptions={{ position: 'top' }} />
      <Button icon="pi pi-pencil" rounded text size="small" severity="warning" onClick={() => handleEdit(rowData)} tooltip="Edit" tooltipOptions={{ position: 'top' }} />
      <Button icon="pi pi-trash" rounded text size="small" severity="danger" onClick={() => confirmDelete(rowData)} tooltip="Delete" tooltipOptions={{ position: 'top' }} />
    </div>
  );

  return (
    <div className="h-full flex flex-col" style={{ backgroundColor: colors.bgPrimary, color: colors.textPrimary }}>
      <ConfirmDialog group="users-mgmt" />

      {/* Header */}
      <div className="flex-shrink-0 p-4" style={{ borderBottom: '1px solid ' + colors.borderPrimary }}>
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold" style={{ color: colors.textPrimary }}>User Management</h3>
          <Button icon="pi pi-plus" label="+ Add" size="small" severity="info" onClick={handleCreate} />
        </div>
      </div>

      {/* DataTable */}
      <div className="flex-1 p-4 overflow-auto" style={{ backgroundColor: colors.bgPrimary }}>
        <div className="rounded-lg shadow-sm overflow-hidden" style={{ backgroundColor: colors.bgSecondary }}>
          <DataTable
            value={users}
            dataKey="id"
            loading={loading}
            paginator rows={20} rowsPerPageOptions={[10, 20, 50]}
            size="small" stripedRows showGridlines scrollable
            scrollHeight="calc(100vh - 300px)" emptyMessage="No records found.">
            <Column field="id" header="User ID" sortable />
            <Column field="name" header="name" sortable />
            <Column field="email" header="email" sortable />
            <Column field="avatar_path" header="avatar_path" sortable />
            <Column field="language" header="language" sortable />
            <Column field="email_verified_at" header="email_verified_at" sortable />
            <Column field="password" header="password" sortable />
            <Column field="remember_token" header="remember_token" sortable />
            <Column field="two_factor_secret" header="two_factor_secret" sortable />
            <Column field="two_factor_enabled" header="two_factor_enabled" sortable />
            <Column field="two_factor_confirmed_at" header="two_factor_confirmed_at" sortable />
            <Column field="two_factor_recovery_codes" header="two_factor_recovery_codes" sortable />
            <Column field="two_factor_trusted_devices" header="two_factor_trusted_devices" sortable />
            <Column field="two_factor_last_verified_at" header="two_factor_last_verified_at" sortable />
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
            <label htmlFor="name" className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>name</label>
            <Controller name="name" control={control}
              render={({ field }) => <InputText id="name" {...field} className="w-full" />} />
            {errors.name && <small className="mt-1 block" style={{ color: colors.errorText }}>{errors.name.message}</small>}
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>email</label>
            <Controller name="email" control={control}
              render={({ field }) => <InputText id="email" {...field} className="w-full" />} />
            {errors.email && <small className="mt-1 block" style={{ color: colors.errorText }}>{errors.email.message}</small>}
          </div>
          <div>
            <label htmlFor="avatar_path" className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>avatar_path</label>
            <Controller name="avatar_path" control={control}
              render={({ field }) => <InputText id="avatar_path" {...field} className="w-full" />} />
            {errors.avatar_path && <small className="mt-1 block" style={{ color: colors.errorText }}>{errors.avatar_path.message}</small>}
          </div>
          <div>
            <label htmlFor="language" className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>language</label>
            <Controller name="language" control={control}
              render={({ field }) => <InputText id="language" {...field} className="w-full" />} />
            {errors.language && <small className="mt-1 block" style={{ color: colors.errorText }}>{errors.language.message}</small>}
          </div>
          <div>
            <label htmlFor="email_verified_at" className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>email_verified_at</label>
            <Controller name="email_verified_at" control={control}
              render={({ field }) => <InputText id="email_verified_at" {...field} className="w-full" />} />
            {errors.email_verified_at && <small className="mt-1 block" style={{ color: colors.errorText }}>{errors.email_verified_at.message}</small>}
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>password</label>
            <Controller name="password" control={control}
              render={({ field }) => <InputText id="password" {...field} className="w-full" />} />
            {errors.password && <small className="mt-1 block" style={{ color: colors.errorText }}>{errors.password.message}</small>}
          </div>
          <div>
            <label htmlFor="remember_token" className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>remember_token</label>
            <Controller name="remember_token" control={control}
              render={({ field }) => <InputText id="remember_token" {...field} className="w-full" />} />
            {errors.remember_token && <small className="mt-1 block" style={{ color: colors.errorText }}>{errors.remember_token.message}</small>}
          </div>
          <div>
            <label htmlFor="two_factor_secret" className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>two_factor_secret</label>
            <Controller name="two_factor_secret" control={control}
              render={({ field }) => <InputText id="two_factor_secret" {...field} className="w-full" />} />
            {errors.two_factor_secret && <small className="mt-1 block" style={{ color: colors.errorText }}>{errors.two_factor_secret.message}</small>}
          </div>
          <div>
            <label htmlFor="two_factor_enabled" className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>two_factor_enabled</label>
            <Controller name="two_factor_enabled" control={control} rules={{ required: 'Required' }}
              render={({ field }) => (
                <InputNumber id="two_factor_enabled" value={field.value} onValueChange={(e) => field.onChange(e.value)}
                  useGrouping={false} className="w-full" />
              )} />
            {errors.two_factor_enabled && <small className="mt-1 block" style={{ color: colors.errorText }}>{errors.two_factor_enabled.message}</small>}
          </div>
          <div>
            <label htmlFor="two_factor_confirmed_at" className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>two_factor_confirmed_at</label>
            <Controller name="two_factor_confirmed_at" control={control}
              render={({ field }) => <InputText id="two_factor_confirmed_at" {...field} className="w-full" />} />
            {errors.two_factor_confirmed_at && <small className="mt-1 block" style={{ color: colors.errorText }}>{errors.two_factor_confirmed_at.message}</small>}
          </div>
          <div>
            <label htmlFor="two_factor_recovery_codes" className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>two_factor_recovery_codes</label>
            <Controller name="two_factor_recovery_codes" control={control}
              render={({ field }) => <InputTextarea id="two_factor_recovery_codes" {...field} rows={3} className="w-full" />} />
          </div>
          <div>
            <label htmlFor="two_factor_trusted_devices" className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>two_factor_trusted_devices</label>
            <Controller name="two_factor_trusted_devices" control={control}
              render={({ field }) => <InputTextarea id="two_factor_trusted_devices" {...field} rows={3} className="w-full" />} />
          </div>
          <div>
            <label htmlFor="two_factor_last_verified_at" className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>two_factor_last_verified_at</label>
            <Controller name="two_factor_last_verified_at" control={control}
              render={({ field }) => <InputText id="two_factor_last_verified_at" {...field} className="w-full" />} />
            {errors.two_factor_last_verified_at && <small className="mt-1 block" style={{ color: colors.errorText }}>{errors.two_factor_last_verified_at.message}</small>}
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
              <span className="text-sm font-medium block" style={{ color: colors.textMuted }}>User ID</span>
              <span style={{ color: colors.textPrimary }}>{viewing.id != null ? String(viewing.id) : '-'}</span>
            </div>
            <div>
              <span className="text-sm font-medium block" style={{ color: colors.textMuted }}>name</span>
              <span style={{ color: colors.textPrimary }}>{viewing.name != null ? String(viewing.name) : '-'}</span>
            </div>
            <div>
              <span className="text-sm font-medium block" style={{ color: colors.textMuted }}>email</span>
              <span style={{ color: colors.textPrimary }}>{viewing.email != null ? String(viewing.email) : '-'}</span>
            </div>
            <div>
              <span className="text-sm font-medium block" style={{ color: colors.textMuted }}>avatar_path</span>
              <span style={{ color: colors.textPrimary }}>{viewing.avatar_path != null ? String(viewing.avatar_path) : '-'}</span>
            </div>
            <div>
              <span className="text-sm font-medium block" style={{ color: colors.textMuted }}>language</span>
              <span style={{ color: colors.textPrimary }}>{viewing.language != null ? String(viewing.language) : '-'}</span>
            </div>
            <div>
              <span className="text-sm font-medium block" style={{ color: colors.textMuted }}>email_verified_at</span>
              <span style={{ color: colors.textPrimary }}>{viewing.email_verified_at != null ? String(viewing.email_verified_at) : '-'}</span>
            </div>
            <div>
              <span className="text-sm font-medium block" style={{ color: colors.textMuted }}>password</span>
              <span style={{ color: colors.textPrimary }}>{viewing.password != null ? String(viewing.password) : '-'}</span>
            </div>
            <div>
              <span className="text-sm font-medium block" style={{ color: colors.textMuted }}>remember_token</span>
              <span style={{ color: colors.textPrimary }}>{viewing.remember_token != null ? String(viewing.remember_token) : '-'}</span>
            </div>
            <div>
              <span className="text-sm font-medium block" style={{ color: colors.textMuted }}>two_factor_secret</span>
              <span style={{ color: colors.textPrimary }}>{viewing.two_factor_secret != null ? String(viewing.two_factor_secret) : '-'}</span>
            </div>
            <div>
              <span className="text-sm font-medium block" style={{ color: colors.textMuted }}>two_factor_enabled</span>
              <span style={{ color: colors.textPrimary }}>{viewing.two_factor_enabled != null ? String(viewing.two_factor_enabled) : '-'}</span>
            </div>
            <div>
              <span className="text-sm font-medium block" style={{ color: colors.textMuted }}>two_factor_confirmed_at</span>
              <span style={{ color: colors.textPrimary }}>{viewing.two_factor_confirmed_at != null ? String(viewing.two_factor_confirmed_at) : '-'}</span>
            </div>
            <div>
              <span className="text-sm font-medium block" style={{ color: colors.textMuted }}>two_factor_recovery_codes</span>
              <span style={{ color: colors.textPrimary }}>{viewing.two_factor_recovery_codes != null ? String(viewing.two_factor_recovery_codes) : '-'}</span>
            </div>
            <div>
              <span className="text-sm font-medium block" style={{ color: colors.textMuted }}>two_factor_trusted_devices</span>
              <span style={{ color: colors.textPrimary }}>{viewing.two_factor_trusted_devices != null ? String(viewing.two_factor_trusted_devices) : '-'}</span>
            </div>
            <div>
              <span className="text-sm font-medium block" style={{ color: colors.textMuted }}>two_factor_last_verified_at</span>
              <span style={{ color: colors.textPrimary }}>{viewing.two_factor_last_verified_at != null ? String(viewing.two_factor_last_verified_at) : '-'}</span>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}
