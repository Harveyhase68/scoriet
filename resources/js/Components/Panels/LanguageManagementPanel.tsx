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

interface Language {
  id: number;
  code: string;
  name: string;
  native_name: string;
  flag?: string;
  is_active: boolean;
  is_default: boolean;
  sort_order: number;
  description?: string;
  created_by?: number;
  creator?: {
    id: number;
    name: string;
  };
  created_at: string;
  updated_at: string;
}

interface LanguageFormData {
  code: string;
  name: string;
  native_name: string;
  flag?: string;
  is_active: boolean;
  is_default: boolean;
  sort_order: number;
  description?: string;
}

export default function LanguageManagementPanel() {
  // i18n setup
  const [currentLanguage] = React.useState<SupportedLanguage>(getStoredLanguage());
  const { t } = useTranslation(currentLanguage);
  const toast = useToast();
  const { colors } = useTheme();
  const [languages, setLanguages] = useState<Language[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingLanguage, setEditingLanguage] = useState<Language | null>(null);

  const { control, handleSubmit, reset, formState: { errors } } = useForm<LanguageFormData>({
    defaultValues: {
      code: '',
      name: '',
      native_name: '',
      flag: '',
      is_active: true,
      is_default: false,
      sort_order: 0,
      description: ''
    }
  });

  const fetchLanguages = async () => {
    setLoading(true);
    try {
      const response = await api.request('/languages');
      setLanguages(response);
    } catch (error: any) {
      if (error.response?.status === 403) {
        toast.showError(t.languagecontroller17);
      } else {
        toast.showError(t.languagemanagementpanel83 + (error.response?.data?.message || error.message));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLanguages();
  }, [toast]);

  const handleCreate = () => {
    setEditingLanguage(null);
    reset({
      code: '',
      name: '',
      native_name: '',
      flag: '',
      is_active: true,
      is_default: false,
      sort_order: languages.length + 1,
      description: ''
    });
    setModalVisible(true);
  };

  const handleEdit = (language: Language) => {
    setEditingLanguage(language);
    reset({
      code: language.code,
      name: language.name,
      native_name: language.native_name,
      flag: language.flag || '',
      is_active: language.is_active,
      is_default: language.is_default,
      sort_order: language.sort_order,
      description: language.description || ''
    });
    setModalVisible(true);
  };

  const confirmDelete = (language: Language) => {
    confirmDialog({
      group: 'language-management',
      message: t.languagemanagementpanel120,
      header: t.languagemanagementpanel121,
      icon: 'pi pi-exclamation-triangle',
      accept: () => handleDelete(language),
      acceptLabel: t.languagemanagementpanel124,
      rejectLabel: t.languagemanagementpanel131,
      acceptClassName: 'p-button-danger'
    });
  };

  const handleDelete = async (language: Language) => {
    try {
      await api.request(`/languages/${language.id}`, { method: 'DELETE' });
      toast.showSuccess(t.languagemanagementpanel133);
      fetchLanguages();
    } catch (error: any) {
      toast.showError(t.languagemanagementpanel142 + (error.response?.data?.message || error.message));
    }
  };

  const handleToggleActive = async (language: Language) => {
    try {
      await api.request(`/languages/${language.id}/toggle-active`, { method: 'PATCH' });
      toast.showSuccess(`${t.languagemanagementpanel149}${language.is_active ? t.languagemanagementpanel149_2 : t.languagemanagementpanel149_3}${t.languagemanagementpanel149_4}`);
      fetchLanguages();
    } catch (error: any) {
      toast.showError(t.languagemanagementpanel152 + (error.response?.data?.message || error.message));
    }
  };

  const handleSetDefault = async (language: Language) => {
    try {
      await api.request(`/languages/${language.id}/set-default`, { method: 'PATCH' });
      toast.showSuccess(t.languagemanagementpanel153);
      fetchLanguages();
    } catch (error: any) {
      toast.showError(t.languagemanagementpanel162 + (error.response?.data?.message || error.message));
    }
  };

  const onSubmit = async (values: LanguageFormData) => {
    try {
      if (editingLanguage) {
        await api.request(`/languages/${editingLanguage.id}`, {
          method: 'PUT',
          body: JSON.stringify(values)
        });
        toast.showSuccess(t.languagemanagementpanel167);
      } else {
        await api.request('/languages', {
          method: 'POST',
          body: JSON.stringify(values)
        });
        toast.showSuccess(t.languagemanagementpanel173);
      }
      setModalVisible(false);
      fetchLanguages();
    } catch (error: any) {
      // Translate Laravel's generic "The code has already been taken." into
      // a user-friendly message before falling back to the raw server
      // message. The previous prefix used languagemanagementpanel184 which
      // is the 🇬🇧 United Kingdom flag label — pure copy-paste accident.
      const raw = error.response?.data?.message || error.message || '';
      const errors = error.response?.data?.errors || {};
      let message: string;
      if (errors.code && Array.isArray(errors.code) && errors.code[0]?.includes('already been taken')) {
        message = t.languagemanagementpanel_code_taken;
      } else {
        message = t.languagemanagementpanel_save_failed + raw;
      }
      toast.showError(message);
    }
  };

  const commonFlags = [
    { value: '🇺🇸', label: t.languagemanagementpanel183 },
    { value: '🇬🇧', label: t.languagemanagementpanel184 },
    { value: '🇩🇪', label: t.languagemanagementpanel185 },
    { value: '🇫🇷', label: t.languagemanagementpanel186 },
    { value: '🇪🇸', label: t.languagemanagementpanel187 },
    { value: '🇮🇹', label: t.languagemanagementpanel188 },
    { value: '🇳🇱', label: t.languagemanagementpanel189 },
    { value: '🇵🇹', label: t.languagemanagementpanel190 },
    { value: '🇷🇺', label: t.languagemanagementpanel191 },
    { value: '🇯🇵', label: t.languagemanagementpanel192 },
    { value: '🇰🇷', label: t.languagemanagementpanel193 },
    { value: '🇨🇳', label: t.languagemanagementpanel194 },
    { value: '🇧🇷', label: t.languagemanagementpanel195 },
    { value: '🇲🇽', label: t.languagemanagementpanel196 },
    { value: '🇨🇦', label: t.languagemanagementpanel197 },
    { value: '🇦🇺', label: t.languagemanagementpanel198 },
    { value: '🇮🇳', label: t.languagemanagementpanel199 },
  ];

  const flagBodyTemplate = (rowData: Language) => {
    return rowData.flag || '🏴';
  };

  const codeBodyTemplate = (rowData: Language) => {
    return <Tag value={rowData.code.toUpperCase()} severity="info" />;
  };

  const statusBodyTemplate = (rowData: Language) => {
    return (
      <div className="flex gap-1">
        <Tag
          value={rowData.is_active ? t.templatesStatusActive : t.manageteammodal328}
          severity={rowData.is_active ? 'success' : 'danger'}
        />
        {rowData.is_default && <Tag value={t.languagemanagementpanel223} severity="warning" />}
      </div>
    );
  };

  const creatorBodyTemplate = (rowData: Language) => {
    return rowData.creator?.name || t.ultimatetemplatecontroller301;
  };

  const descriptionBodyTemplate = (rowData: Language) => {
    return rowData.description || '-';
  };

  const actionsBodyTemplate = (rowData: Language) => {
    return (
      <div className="flex gap-1">
        <Button
          icon="pi pi-pencil"
          rounded
          text
          size="small"
          severity="info"
          onClick={() => handleEdit(rowData)}
          tooltip={t.languagemanagementpanel246}
          tooltipOptions={{ position: 'top' }}
        />

        <Button
          icon={rowData.is_active ? "pi pi-eye-slash" : "pi pi-eye"}
          rounded
          text
          size="small"
          severity={rowData.is_active ? "warning" : "success"}
          onClick={() => handleToggleActive(rowData)}
          tooltip={rowData.is_active ? t.languagemanagementpanel257: t.languagemanagementpanel251}
          tooltipOptions={{ position: 'top' }}
          disabled={rowData.is_default && rowData.is_active}
        />

        {!rowData.is_default && (
          <Button
            icon="pi pi-star"
            rounded
            text
            size="small"
            severity="help"
            onClick={() => handleSetDefault(rowData)}
            tooltip={t.languagemanagementpanel264}
            tooltipOptions={{ position: 'top' }}
            disabled={!rowData.is_active}
          />
        )}

        <Button
          icon="pi pi-trash"
          rounded
          text
          size="small"
          severity="danger"
          onClick={() => confirmDelete(rowData)}
          tooltip={rowData.is_default ? t.languagemanagementpanel277 : t.languagemanagementpanel121}
          tooltipOptions={{ position: 'top' }}
          disabled={rowData.is_default}
        />
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col" style={{ backgroundColor: colors.bgPrimary, color: colors.textPrimary }}>
      <ConfirmDialog group="language-management" />
      <div className="flex-shrink-0 p-4" style={{ borderBottom: `1px solid ${colors.borderPrimary}`, backgroundColor: colors.bgPrimary }}>
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold" style={{ color: colors.textPrimary }}>
              {t.languagemanagementpanel298}
            </h3>
            <p className="text-sm" style={{ color: colors.textSecondary }}>
              {t.languagemanagementpanel301}
            </p>
          </div>
          <Button
            icon="pi pi-plus"
            label={t.languagemanagementpanel300}
            size="small"
            severity="info"
            onClick={handleCreate}
          />
        </div>
      </div>

      <div className="flex-1 p-4 overflow-auto" style={{ backgroundColor: colors.bgPrimary }}>
        <div className="rounded-lg shadow-sm overflow-hidden" style={{ backgroundColor: colors.bgSecondary }}>
          <DataTable
            value={languages}
            dataKey="id"
            loading={loading}
            paginator
            rows={20}
            rowsPerPageOptions={[10, 20, 50]}
            paginatorTemplate={t.languagemanagementpanel317}
            currentPageReportTemplate="{first}-{last} of {total} languages"
            size="small"
            stripedRows
            showGridlines
            scrollable
            scrollHeight="calc(100vh - 300px)"
            emptyMessage={t.languagemanagementpanel324}
          >
            <Column field="flag" header={t.languagemanagementpanel326} body={flagBodyTemplate} style={{ width: '80px' }} />
            <Column field="code" header={t.languagemanagementpanel327} body={codeBodyTemplate} sortable style={{ width: '100px' }} />
            <Column field="name" header={t.registermodal236} sortable style={{ width: '150px' }} />
            <Column field="native_name" header={t.languagemanagementpanel329} sortable style={{ width: '150px' }} />
            <Column header={t.applicationsmodal335} body={statusBodyTemplate} style={{ width: '150px' }} />
            <Column field="sort_order" header={t.languagemanagementpanel331} sortable style={{ width: '120px' }} />
            <Column header={t.languagemanagementpanel332} body={creatorBodyTemplate} style={{ width: '120px' }} />
            <Column field="description" header={t.createteammodal103} body={descriptionBodyTemplate} />
            <Column header={t.applicationsmodal354} body={actionsBodyTemplate} style={{ width: '200px' }} />
          </DataTable>
        </div>
      </div>

        <Dialog
          header={editingLanguage ? t.languagemanagementpanel346 : t.languagemanagementpanel340}
          visible={modalVisible}
          onHide={() => setModalVisible(false)}
          style={{ width: '600px' }}
          modal
          closable
          draggable
          resizable
          className="themed-dialog"
          contentStyle={{ backgroundColor: colors.bgSecondary, color: colors.textPrimary }}
          headerStyle={{ backgroundColor: colors.bgTertiary, color: colors.textPrimary }}
          footer={
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                label={t.applicationsmodal432}
                icon="pi pi-times"
                severity="info"
                outlined
                onClick={() => setModalVisible(false)}
              />
              <Button
                type="button"
                label={editingLanguage ? t.languagemanagementpanel369 : t.teammodal240}
                icon="pi pi-check"
                severity="success"
                onClick={handleSubmit(onSubmit)}
              />
            </div>
          }
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {/* Language Code */}
              <div>
                <label htmlFor="code" className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>
                  {t.languagemanagementpanel382}
                </label>
                <Controller
                  name="code"
                  control={control}
                  rules={{
                    required: t.languagemanagementpanel378,
                    maxLength: { value: 5, message: t.languagemanagementpanel379 },
                    pattern: { value: /^[a-z]{2,3}(-[A-Z]{2})?$/, message: t.languagemanagementpanel390 }
                  }}
                  render={({ field }) => (
                    <InputText
                      id="code"
                      {...field}
                      placeholder={t.languagemanagementpanel396}
                      className="w-full"
                    />
                  )}
                />
                {errors.code && (
                  <small className="mt-1 block" style={{ color: colors.errorText }}>{errors.code.message}</small>
                )}
              </div>

              {/* Flag */}
              <div>
                <label htmlFor="flag" className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>
                  {t.languagemanagementpanel409}
                </label>
                <Controller
                  name="flag"
                  control={control}
                  render={({ field }) => (
                    <Dropdown
                      id="flag"
                      value={field.value}
                      onChange={(e) => field.onChange(e.value)}
                      options={commonFlags}
                      placeholder={t.languagemanagementpanel410}
                      showClear
                      filter
                      className="w-full"
                    />
                  )}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* English Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>
                  {t.languagemanagementpanel434}
                </label>
                <Controller
                  name="name"
                  control={control}
                  rules={{
                    required: t.languagemanagementpanel430,
                    maxLength: { value: 100, message: t.languagemanagementpanel431 }
                  }}
                  render={({ field }) => (
                    <InputText
                      id="name"
                      {...field}
                      placeholder={t.languagemanagementpanel437}
                      className="w-full"
                    />
                  )}
                />
                {errors.name && (
                  <small className="mt-1 block" style={{ color: colors.errorText }}>{errors.name.message}</small>
                )}
              </div>

              {/* Native Name */}
              <div>
                <label htmlFor="native_name" className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>
                  {t.languagemanagementpanel460}
                </label>
                <Controller
                  name="native_name"
                  control={control}
                  rules={{
                    required: t.languagemanagementpanel456,
                    maxLength: { value: 100, message: t.languagemanagementpanel457 }
                  }}
                  render={({ field }) => (
                    <InputText
                      id="native_name"
                      {...field}
                      placeholder={t.languagemanagementpanel463}
                      className="w-full"
                    />
                  )}
                />
                {errors.native_name && (
                  <small className="mt-1 block" style={{ color: colors.errorText }}>{errors.native_name.message}</small>
                )}
              </div>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>
                {t.languagemanagementpanel487}
              </label>
              <Controller
                name="description"
                control={control}
                rules={{
                  maxLength: { value: 1000, message: t.languagemanagementpanel483 }
                }}
                render={({ field }) => (
                  <InputTextarea
                    id="description"
                    {...field}
                    rows={3}
                    placeholder={t.languagemanagementpanel490}
                    className="w-full"
                  />
                )}
              />
              {errors.description && (
                <small className="mt-1 block" style={{ color: colors.errorText }}>{errors.description.message}</small>
              )}
            </div>

            {/* Sort Order, Active, Default - on one row */}
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '40px' }}>
              <div style={{ minWidth: '100px' }}>
                <label htmlFor="sort_order" className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>
                  {t.languagemanagementpanel514}
                </label>
                <Controller
                  name="sort_order"
                  control={control}
                  rules={{
                    required: t.languagemanagementpanel510,
                    min: { value: 0, message: t.languagemanagementpanel511 }
                  }}
                  render={({ field }) => (
                    <InputNumber
                      id="sort_order"
                      value={field.value}
                      onValueChange={(e) => field.onChange(e.value)}
                      min={0}
                      inputStyle={{ width: '80px' }}
                      pt={{ root: { style: { width: '80px' } } }}
                    />
                  )}
                />
                {errors.sort_order && (
                  <small className="mt-1 block" style={{ color: colors.errorText }}>{errors.sort_order.message}</small>
                )}
              </div>
              <div className="flex items-center gap-2 pb-2">
                <Controller
                  name="is_active"
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      inputId="is_active"
                      checked={field.value}
                      onChange={(e) => field.onChange(e.checked)}
                    />
                  )}
                />
                <label htmlFor="is_active" className="text-sm font-medium cursor-pointer" style={{ color: colors.textPrimary }}>
                  {t.languagemanagementpanel551}
                </label>
              </div>
              <div className="flex items-center gap-2 pb-2">
                <Controller
                  name="is_default"
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      inputId="is_default"
                      checked={field.value}
                      onChange={(e) => field.onChange(e.checked)}
                    />
                  )}
                />
                <label htmlFor="is_default" className="text-sm font-medium cursor-pointer" style={{ color: colors.textPrimary }}>
                  {t.languagemanagementpanel567}
                </label>
              </div>
            </div>
          </form>
        </Dialog>
      </div>
    );
}