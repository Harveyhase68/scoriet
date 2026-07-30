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

interface {:filesingularpascalcase:} {
{:for nmaxitems:}
  {:item.name:}: {:if item.phptype eq 'int':}number{:elseif item.phptype eq 'float':}number{:elseif item.phptype eq 'bool':}boolean{:else:}string{:endif:};
{:endfor:}
{:for nmaxforeignkeysunique:}
  {:foreignunique.referencedtablecamelcase:}?: any;
{:endfor:}
}

interface {:filesingularpascalcase:}FormData {
{:for nmaxitemsnokey:}
{:if item.istimestamp:}
{:else:}
  {:item.name:}: {:if item.phptype eq 'int':}number{:elseif item.phptype eq 'float':}number{:elseif item.phptype eq 'bool':}boolean{:else:}string{:endif:};
{:endif:}
{:endfor:}
}

export default function {:filesingularpascalcase:}ManagementPanel() {
  const [currentLanguage] = React.useState<SupportedLanguage>(getStoredLanguage());
  const { t } = useTranslation(currentLanguage);
  const toast = useToast();
  const { colors } = useTheme();
  const [{:filecamelcase:}, set{:filepascalcase:}] = useState<{:filesingularpascalcase:}[]>([]);
{:for nmaxforeignkeysunique:}
  const [{:foreignunique.referencedtablecamelcase:}Options, set{:foreignunique.referencedtablepascalcase:}Options] = useState<any[]>([]);
{:endfor:}
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [editing, setEditing] = useState<{:filesingularpascalcase:} | null>(null);
  const [viewing, setViewing] = useState<{:filesingularpascalcase:} | null>(null);

  const defaultValues: {:filesingularpascalcase:}FormData = {
{:for nmaxitemsnokey:}
{:if item.istimestamp:}
{:elseif item.type eq 'DATETIME':}
    {:item.name:}: new Date().toISOString().slice(0, 16),
{:elseif item.type eq 'TIMESTAMP':}
    {:item.name:}: new Date().toISOString().slice(0, 16),
{:elseif item.type eq 'DATE':}
    {:item.name:}: new Date().toISOString().slice(0, 10),
{:elseif item.phptype eq 'bool':}
    {:item.name:}: false,
{:elseif item.phptype eq 'int':}
    {:item.name:}: 0,
{:elseif item.phptype eq 'float':}
    {:item.name:}: 0,
{:else:}
    {:item.name:}: '',
{:endif:}
{:endfor:}
  };

  const { control, handleSubmit, reset, formState: { errors } } = useForm<{:filesingularpascalcase:}FormData>({ defaultValues });

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await api.get('/{:filename:}');
      set{:filepascalcase:}(data);
    } catch (error: any) { toast.showError('Failed: ' + (error.message || error)); } finally { setLoading(false); }
  };
{:for nmaxforeignkeysunique:}

  const fetch{:foreignunique.referencedtablepascalcase:} = async () => {
    try { const data = await api.get('/{:foreignunique.referencedtable:}'); set{:foreignunique.referencedtablepascalcase:}Options(data); }
    catch (error: any) { toast.showError('Failed: ' + (error.message || error)); }
  };
{:endfor:}

  useEffect(() => {
    fetchData();
{:for nmaxforeignkeysunique:}
    fetch{:foreignunique.referencedtablepascalcase:}();
{:endfor:}
  }, []);

  const handleCreate = () => { setEditing(null); reset(defaultValues); setModalVisible(true); };

  const handleEdit = (record: {:filesingularpascalcase:}) => {
    setEditing(record);
    reset({
{:for nmaxitemsnokey:}
{:if item.istimestamp:}
{:elseif item.type eq 'DATETIME':}
      {:item.name:}: record.{:item.name:} ? record.{:item.name:}.slice(0, 16) : '',
{:elseif item.type eq 'TIMESTAMP':}
      {:item.name:}: record.{:item.name:} ? record.{:item.name:}.slice(0, 16) : '',
{:elseif item.type eq 'DATE':}
      {:item.name:}: record.{:item.name:} ? record.{:item.name:}.slice(0, 10) : '',
{:else:}
      {:item.name:}: record.{:item.name:},
{:endif:}
{:endfor:}
    });
    setModalVisible(true);
  };

  const handleView = (record: {:filesingularpascalcase:}) => { setViewing(record); setViewModalVisible(true); };

  const confirmDelete = (record: {:filesingularpascalcase:}) => {
    confirmDialog({ group: '{:filename:}-mgmt', message: 'Are you sure?', header: 'Confirm',
      icon: 'pi pi-exclamation-triangle', accept: () => handleDelete(record),
      acceptLabel: 'Delete', rejectLabel: 'Cancel', acceptClassName: 'p-button-danger' });
  };

  const handleDelete = async (record: {:filesingularpascalcase:}) => {
    try { await api.delete('/{:filename:}/' + record.{:fileprimarykey:}); toast.showSuccess('Deleted.'); fetchData(); }
    catch (error: any) { toast.showError('Error: ' + (error.message || error)); }
  };

  const onSubmit = async (values: {:filesingularpascalcase:}FormData) => {
    try {
      if (editing) { await api.put('/{:filename:}/' + editing.{:fileprimarykey:}, values); toast.showSuccess('Updated.'); }
      else { await api.post('/{:filename:}', values); toast.showSuccess('Created.'); }
      setModalVisible(false); await fetchData();
    } catch (error: any) { toast.showError('Error: ' + (error.message || error)); }
  };

  const actionsBodyTemplate = (rowData: {:filesingularpascalcase:}) => (
    <div className="flex gap-1">
      <Button icon="pi pi-eye" rounded text size="small" severity="info" onClick={() => handleView(rowData)} tooltip="View" tooltipOptions={{ position: 'top' }} />
      <Button icon="pi pi-pencil" rounded text size="small" severity="warning" onClick={() => handleEdit(rowData)} tooltip="Edit" tooltipOptions={{ position: 'top' }} />
      <Button icon="pi pi-trash" rounded text size="small" severity="danger" onClick={() => confirmDelete(rowData)} tooltip="Delete" tooltipOptions={{ position: 'top' }} />
    </div>
  );

  return (
    <div className="h-full flex flex-col" style={{ backgroundColor: colors.bgPrimary, color: colors.textPrimary }}>
      <ConfirmDialog group="{:filename:}-mgmt" />

      {/* Header */}
      <div className="flex-shrink-0 p-4" style={{ borderBottom: '1px solid ' + colors.borderPrimary }}>
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold" style={{ color: colors.textPrimary }}>{:filesingularpascalcase:} Management</h3>
          <Button icon="pi pi-plus" label="+ Add" size="small" severity="info" onClick={handleCreate} />
        </div>
      </div>

      {/* DataTable */}
      <div className="flex-1 p-4 overflow-auto" style={{ backgroundColor: colors.bgPrimary }}>
        <div className="rounded-lg shadow-sm overflow-hidden" style={{ backgroundColor: colors.bgSecondary }}>
          <DataTable
            value={{:filecamelcase:}}
            dataKey="{:fileprimarykey:}"
            loading={loading}
            paginator rows={20} rowsPerPageOptions={[10, 20, 50]}
            size="small" stripedRows showGridlines scrollable
            scrollHeight="calc(100vh - 300px)" emptyMessage="No records found.">
{:for nmaxitems:}
{:if item.istimestamp:}
{:elseif item.phptype eq 'bool':}
            <Column field="{:item.name:}" header="{:item.caption:}" body={(r: any) => <Tag value={r.{:item.name:} ? 'Yes' : 'No'} severity={r.{:item.name:} ? 'success' : 'danger'} />} sortable style={{ width: '120px' }} />
{:elseif item.isforeign:}
            <Column field="{:item.name:}" header="{:item.caption:}" body={(r: any) => <span>{r.{:camelcase(item.linktable):}?.{:item.linkdisplayfield:} || '-'}</span>} sortable style={{ width: '150px' }} />
{:else:}
            <Column field="{:item.name:}" header="{:item.caption:}" sortable />
{:endif:}
{:endfor:}
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
{:for nmaxitemsnokey:}
{:if item.istimestamp:}
{:elseif item.phptype eq 'bool':}
          <div className="flex items-center gap-2">
            <Controller name="{:item.name:}" control={control}
              render={({ field }) => <Checkbox inputId="{:item.name:}" checked={field.value} onChange={(e) => field.onChange(e.checked)} />} />
            <label htmlFor="{:item.name:}" className="text-sm cursor-pointer" style={{ color: colors.textPrimary }}>{:item.caption:}</label>
          </div>
{:elseif item.isforeign:}
          <div>
            <label htmlFor="{:item.name:}" className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>{:item.caption:}</label>
            <Controller name="{:item.name:}" control={control} rules={{ required: 'Required' }}
              render={({ field }) => (
                <Dropdown id="{:item.name:}" value={field.value} onChange={(e) => field.onChange(e.value)}
                  options={{:camelcase(item.linktable):}Options} optionLabel="{:item.linkdisplayfield:}" optionValue="{:item.linkfield:}"
                  placeholder="Select..." filter className="w-full" />
              )} />
            {errors.{:item.name:} && <small className="mt-1 block" style={{ color: colors.errorText }}>{errors.{:item.name:}.message}</small>}
          </div>
{:elseif item.phptype eq 'int':}
          <div>
            <label htmlFor="{:item.name:}" className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>{:item.caption:}</label>
            <Controller name="{:item.name:}" control={control} rules={{ required: 'Required' }}
              render={({ field }) => (
                <InputNumber id="{:item.name:}" value={field.value} onValueChange={(e) => field.onChange(e.value)}
                  useGrouping={false} className="w-full" />
              )} />
            {errors.{:item.name:} && <small className="mt-1 block" style={{ color: colors.errorText }}>{errors.{:item.name:}.message}</small>}
          </div>
{:elseif item.phptype eq 'float':}
          <div>
            <label htmlFor="{:item.name:}" className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>{:item.caption:}</label>
            <Controller name="{:item.name:}" control={control} rules={{ required: 'Required' }}
              render={({ field }) => (
                <InputNumber id="{:item.name:}" value={field.value} onValueChange={(e) => field.onChange(e.value)}
                  mode="decimal" minFractionDigits={2} useGrouping={false} className="w-full" />
              )} />
            {errors.{:item.name:} && <small className="mt-1 block" style={{ color: colors.errorText }}>{errors.{:item.name:}.message}</small>}
          </div>
{:elseif item.isblob:}
          <div>
            <label htmlFor="{:item.name:}" className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>{:item.caption:}</label>
            <Controller name="{:item.name:}" control={control}
              render={({ field }) => <InputTextarea id="{:item.name:}" {...field} rows={3} className="w-full" />} />
          </div>
{:else:}
          <div>
            <label htmlFor="{:item.name:}" className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>{:item.caption:}</label>
            <Controller name="{:item.name:}" control={control}
              render={({ field }) => <InputText id="{:item.name:}" {...field} className="w-full" />} />
            {errors.{:item.name:} && <small className="mt-1 block" style={{ color: colors.errorText }}>{errors.{:item.name:}.message}</small>}
          </div>
{:endif:}
{:endfor:}
        </form>
      </Dialog>

      {/* View Dialog */}
      <Dialog header="View" visible={viewModalVisible} onHide={() => setViewModalVisible(false)}
        style={{ width: '600px' }} modal closable draggable className="themed-dialog"
        contentStyle={{ backgroundColor: colors.bgSecondary, color: colors.textPrimary }}
        headerStyle={{ backgroundColor: colors.bgTertiary, color: colors.textPrimary }}>
        {viewing && (
          <div className="space-y-3">
{:for nmaxitems:}
{:if item.istimestamp:}
{:elseif item.phptype eq 'bool':}
            <div>
              <span className="text-sm font-medium block" style={{ color: colors.textMuted }}>{:item.caption:}</span>
              <Tag value={viewing.{:item.name:} ? 'Yes' : 'No'} severity={viewing.{:item.name:} ? 'success' : 'danger'} />
            </div>
{:elseif item.isforeign:}
            <div>
              <span className="text-sm font-medium block" style={{ color: colors.textMuted }}>{:item.caption:}</span>
              <span style={{ color: colors.textPrimary }}>{viewing.{:camelcase(item.linktable):}?.{:item.linkdisplayfield:} || '-'}</span>
            </div>
{:else:}
            <div>
              <span className="text-sm font-medium block" style={{ color: colors.textMuted }}>{:item.caption:}</span>
              <span style={{ color: colors.textPrimary }}>{viewing.{:item.name:} != null ? String(viewing.{:item.name:}) : '-'}</span>
            </div>
{:endif:}
{:endfor:}
          </div>
        )}
      </Dialog>
    </div>
  );
}