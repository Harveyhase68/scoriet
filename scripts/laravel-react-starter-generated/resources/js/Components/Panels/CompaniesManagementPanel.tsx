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

interface Company {
  comp_id: number;
  comp_no: number;
  comp_name: string;
  comp_registration_number: string;
  comp_vat_number: string;
  comp_website: string;
  comp_phone: string;
  comp_fax: string;
  comp_industry: string;
  comp_size: string;
  comp_notes: string;
  comp_created_at: string;
  comp_updated_at: string;
}

interface CompanyFormData {
  comp_no: number;
  comp_name: string;
  comp_registration_number: string;
  comp_vat_number: string;
  comp_website: string;
  comp_phone: string;
  comp_fax: string;
  comp_industry: string;
  comp_size: string;
  comp_notes: string;
}

export default function CompanyManagementPanel() {
  const [currentLanguage] = React.useState<SupportedLanguage>(getStoredLanguage());
  const { t } = useTranslation(currentLanguage);
  const toast = useToast();
  const { colors } = useTheme();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [editing, setEditing] = useState<Company | null>(null);
  const [viewing, setViewing] = useState<Company | null>(null);

  const defaultValues: CompanyFormData = {
    comp_no: 0,
    comp_name: '',
    comp_registration_number: '',
    comp_vat_number: '',
    comp_website: '',
    comp_phone: '',
    comp_fax: '',
    comp_industry: '',
    comp_size: '',
    comp_notes: '',
  };

  const { control, handleSubmit, reset, formState: { errors } } = useForm<CompanyFormData>({ defaultValues });

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await api.get('/companies');
      setCompanies(data);
    } catch (error: any) { toast.showError('Failed: ' + (error.message || error)); } finally { setLoading(false); }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = () => { setEditing(null); reset(defaultValues); setModalVisible(true); };

  const handleEdit = (record: Company) => {
    setEditing(record);
    reset({
      comp_no: record.comp_no,
      comp_name: record.comp_name,
      comp_registration_number: record.comp_registration_number,
      comp_vat_number: record.comp_vat_number,
      comp_website: record.comp_website,
      comp_phone: record.comp_phone,
      comp_fax: record.comp_fax,
      comp_industry: record.comp_industry,
      comp_size: record.comp_size,
      comp_notes: record.comp_notes,
    });
    setModalVisible(true);
  };

  const handleView = (record: Company) => { setViewing(record); setViewModalVisible(true); };

  const confirmDelete = (record: Company) => {
    confirmDialog({ group: 'companies-mgmt', message: 'Are you sure?', header: 'Confirm',
      icon: 'pi pi-exclamation-triangle', accept: () => handleDelete(record),
      acceptLabel: 'Delete', rejectLabel: 'Cancel', acceptClassName: 'p-button-danger' });
  };

  const handleDelete = async (record: Company) => {
    try { await api.delete('/companies/' + record.comp_id); toast.showSuccess('Deleted.'); fetchData(); }
    catch (error: any) { toast.showError('Error: ' + (error.message || error)); }
  };

  const onSubmit = async (values: CompanyFormData) => {
    try {
      if (editing) { await api.put('/companies/' + editing.comp_id, values); toast.showSuccess('Updated.'); }
      else { await api.post('/companies', values); toast.showSuccess('Created.'); }
      setModalVisible(false); await fetchData();
    } catch (error: any) { toast.showError('Error: ' + (error.message || error)); }
  };

  const actionsBodyTemplate = (rowData: Company) => (
    <div className="flex gap-1">
      <Button icon="pi pi-eye" rounded text size="small" severity="info" onClick={() => handleView(rowData)} tooltip="View" tooltipOptions={{ position: 'top' }} />
      <Button icon="pi pi-pencil" rounded text size="small" severity="warning" onClick={() => handleEdit(rowData)} tooltip="Edit" tooltipOptions={{ position: 'top' }} />
      <Button icon="pi pi-trash" rounded text size="small" severity="danger" onClick={() => confirmDelete(rowData)} tooltip="Delete" tooltipOptions={{ position: 'top' }} />
    </div>
  );

  return (
    <div className="h-full flex flex-col" style={{ backgroundColor: colors.bgPrimary, color: colors.textPrimary }}>
      <ConfirmDialog group="companies-mgmt" />

      {/* Header */}
      <div className="flex-shrink-0 p-4" style={{ borderBottom: '1px solid ' + colors.borderPrimary }}>
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold" style={{ color: colors.textPrimary }}>Company Management</h3>
          <Button icon="pi pi-plus" label="+ Add" size="small" severity="info" onClick={handleCreate} />
        </div>
      </div>

      {/* DataTable */}
      <div className="flex-1 p-4 overflow-auto" style={{ backgroundColor: colors.bgPrimary }}>
        <div className="rounded-lg shadow-sm overflow-hidden" style={{ backgroundColor: colors.bgSecondary }}>
          <DataTable
            value={companies}
            dataKey="comp_id"
            loading={loading}
            paginator rows={20} rowsPerPageOptions={[10, 20, 50]}
            size="small" stripedRows showGridlines scrollable
            scrollHeight="calc(100vh - 300px)" emptyMessage="No records found.">
            <Column field="comp_id" header="comp_id" sortable />
            <Column field="comp_no" header="comp_no" sortable />
            <Column field="comp_name" header="comp_name" sortable />
            <Column field="comp_registration_number" header="comp_registration_number" sortable />
            <Column field="comp_vat_number" header="comp_vat_number" sortable />
            <Column field="comp_website" header="comp_website" sortable />
            <Column field="comp_phone" header="comp_phone" sortable />
            <Column field="comp_fax" header="comp_fax" sortable />
            <Column field="comp_industry" header="comp_industry" sortable />
            <Column field="comp_size" header="comp_size" sortable />
            <Column field="comp_notes" header="comp_notes" sortable />
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
            <label htmlFor="comp_no" className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>comp_no</label>
            <Controller name="comp_no" control={control} rules={{ required: 'Required' }}
              render={({ field }) => (
                <InputNumber id="comp_no" value={field.value} onValueChange={(e) => field.onChange(e.value)}
                  useGrouping={false} className="w-full" />
              )} />
            {errors.comp_no && <small className="mt-1 block" style={{ color: colors.errorText }}>{errors.comp_no.message}</small>}
          </div>
          <div>
            <label htmlFor="comp_name" className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>comp_name</label>
            <Controller name="comp_name" control={control}
              render={({ field }) => <InputText id="comp_name" {...field} className="w-full" />} />
            {errors.comp_name && <small className="mt-1 block" style={{ color: colors.errorText }}>{errors.comp_name.message}</small>}
          </div>
          <div>
            <label htmlFor="comp_registration_number" className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>comp_registration_number</label>
            <Controller name="comp_registration_number" control={control}
              render={({ field }) => <InputText id="comp_registration_number" {...field} className="w-full" />} />
            {errors.comp_registration_number && <small className="mt-1 block" style={{ color: colors.errorText }}>{errors.comp_registration_number.message}</small>}
          </div>
          <div>
            <label htmlFor="comp_vat_number" className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>comp_vat_number</label>
            <Controller name="comp_vat_number" control={control}
              render={({ field }) => <InputText id="comp_vat_number" {...field} className="w-full" />} />
            {errors.comp_vat_number && <small className="mt-1 block" style={{ color: colors.errorText }}>{errors.comp_vat_number.message}</small>}
          </div>
          <div>
            <label htmlFor="comp_website" className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>comp_website</label>
            <Controller name="comp_website" control={control}
              render={({ field }) => <InputText id="comp_website" {...field} className="w-full" />} />
            {errors.comp_website && <small className="mt-1 block" style={{ color: colors.errorText }}>{errors.comp_website.message}</small>}
          </div>
          <div>
            <label htmlFor="comp_phone" className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>comp_phone</label>
            <Controller name="comp_phone" control={control}
              render={({ field }) => <InputText id="comp_phone" {...field} className="w-full" />} />
            {errors.comp_phone && <small className="mt-1 block" style={{ color: colors.errorText }}>{errors.comp_phone.message}</small>}
          </div>
          <div>
            <label htmlFor="comp_fax" className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>comp_fax</label>
            <Controller name="comp_fax" control={control}
              render={({ field }) => <InputText id="comp_fax" {...field} className="w-full" />} />
            {errors.comp_fax && <small className="mt-1 block" style={{ color: colors.errorText }}>{errors.comp_fax.message}</small>}
          </div>
          <div>
            <label htmlFor="comp_industry" className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>comp_industry</label>
            <Controller name="comp_industry" control={control}
              render={({ field }) => <InputText id="comp_industry" {...field} className="w-full" />} />
            {errors.comp_industry && <small className="mt-1 block" style={{ color: colors.errorText }}>{errors.comp_industry.message}</small>}
          </div>
          <div>
            <label htmlFor="comp_size" className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>comp_size</label>
            <Controller name="comp_size" control={control}
              render={({ field }) => <InputText id="comp_size" {...field} className="w-full" />} />
            {errors.comp_size && <small className="mt-1 block" style={{ color: colors.errorText }}>{errors.comp_size.message}</small>}
          </div>
          <div>
            <label htmlFor="comp_notes" className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>comp_notes</label>
            <Controller name="comp_notes" control={control}
              render={({ field }) => <InputTextarea id="comp_notes" {...field} rows={3} className="w-full" />} />
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
              <span className="text-sm font-medium block" style={{ color: colors.textMuted }}>comp_id</span>
              <span style={{ color: colors.textPrimary }}>{viewing.comp_id != null ? String(viewing.comp_id) : '-'}</span>
            </div>
            <div>
              <span className="text-sm font-medium block" style={{ color: colors.textMuted }}>comp_no</span>
              <span style={{ color: colors.textPrimary }}>{viewing.comp_no != null ? String(viewing.comp_no) : '-'}</span>
            </div>
            <div>
              <span className="text-sm font-medium block" style={{ color: colors.textMuted }}>comp_name</span>
              <span style={{ color: colors.textPrimary }}>{viewing.comp_name != null ? String(viewing.comp_name) : '-'}</span>
            </div>
            <div>
              <span className="text-sm font-medium block" style={{ color: colors.textMuted }}>comp_registration_number</span>
              <span style={{ color: colors.textPrimary }}>{viewing.comp_registration_number != null ? String(viewing.comp_registration_number) : '-'}</span>
            </div>
            <div>
              <span className="text-sm font-medium block" style={{ color: colors.textMuted }}>comp_vat_number</span>
              <span style={{ color: colors.textPrimary }}>{viewing.comp_vat_number != null ? String(viewing.comp_vat_number) : '-'}</span>
            </div>
            <div>
              <span className="text-sm font-medium block" style={{ color: colors.textMuted }}>comp_website</span>
              <span style={{ color: colors.textPrimary }}>{viewing.comp_website != null ? String(viewing.comp_website) : '-'}</span>
            </div>
            <div>
              <span className="text-sm font-medium block" style={{ color: colors.textMuted }}>comp_phone</span>
              <span style={{ color: colors.textPrimary }}>{viewing.comp_phone != null ? String(viewing.comp_phone) : '-'}</span>
            </div>
            <div>
              <span className="text-sm font-medium block" style={{ color: colors.textMuted }}>comp_fax</span>
              <span style={{ color: colors.textPrimary }}>{viewing.comp_fax != null ? String(viewing.comp_fax) : '-'}</span>
            </div>
            <div>
              <span className="text-sm font-medium block" style={{ color: colors.textMuted }}>comp_industry</span>
              <span style={{ color: colors.textPrimary }}>{viewing.comp_industry != null ? String(viewing.comp_industry) : '-'}</span>
            </div>
            <div>
              <span className="text-sm font-medium block" style={{ color: colors.textMuted }}>comp_size</span>
              <span style={{ color: colors.textPrimary }}>{viewing.comp_size != null ? String(viewing.comp_size) : '-'}</span>
            </div>
            <div>
              <span className="text-sm font-medium block" style={{ color: colors.textMuted }}>comp_notes</span>
              <span style={{ color: colors.textPrimary }}>{viewing.comp_notes != null ? String(viewing.comp_notes) : '-'}</span>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}
