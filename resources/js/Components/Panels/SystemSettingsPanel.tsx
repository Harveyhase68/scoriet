import React, { useState, useEffect, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useToast } from '@/contexts/ToastContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from 'primereact/button';
import { TabView, TabPanel } from 'primereact/tabview';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { InputNumber } from 'primereact/inputnumber';
import { ProgressSpinner } from 'primereact/progressspinner';
import { api, pricingUtils } from '@/lib/api';
import { useTranslation, SupportedLanguage, getStoredLanguage } from '@/i18n';

interface Settings {
  id: number;
  global_google_translate_key: string | null;
  price_patron_annual: number;
  price_patron_monthly: number;
  price_credits_500: number;
  price_credits_1000: number;
  price_credits_2500: number;
  created_at: string;
  updated_at: string;
}

interface User {
  id: number;
  name: string;
  email: string;
  username: string | null;
  user_type: string;
  is_inner_core: boolean;
  is_verified: boolean;
  member_since: string;
  last_login: string;
  created_at: string;
}

export default function SystemSettingsPanel() {
  // i18n setup
  const [currentLanguage] = React.useState<SupportedLanguage>(getStoredLanguage());
  const { t } = useTranslation(currentLanguage);
  const toast = useToast();
  const { colors } = useTheme();
  const [, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [refreshingPrices, setRefreshingPrices] = useState(false);

  // User Management states
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [activeTabIndex, setActiveTabIndex] = useState(0);

  const { control, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: {
      global_google_translate_key: '',
      price_patron_annual: 0,
      price_patron_monthly: 0,
      price_credits_500: 0,
      price_credits_1000: 0,
      price_credits_2500: 0,
    }
  });

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.request('/settings');
      setSettings(response);
      reset({
        global_google_translate_key: response.global_google_translate_key || '',
        price_patron_annual: parseFloat(response.price_patron_annual),
        price_patron_monthly: parseFloat(response.price_patron_monthly),
        price_credits_500: parseFloat(response.price_credits_500),
        price_credits_1000: parseFloat(response.price_credits_1000),
        price_credits_2500: parseFloat(response.price_credits_2500),
      });
    } catch (error: any) {
      toast.showError(t.systemsettingspanel82 + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  }, [reset, toast]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const onSubmit = async (data: any) => {
    setSaving(true);
    try {
      const response = await api.request('/settings', {
        method: 'PUT',
        body: JSON.stringify(data)
      });

      setSettings(response.settings);
      toast.showSuccess(t.systemsettingspanel67);
    } catch (error: any) {
      toast.showError(t.systemsettingspanel103 + (error.response?.data?.message || error.message));
    } finally {
      setSaving(false);
    }
  };

  // Refresh pricing cache
  const refreshPrices = async () => {
    setRefreshingPrices(true);
    try {
      // Clear the cache first
      pricingUtils.clearCache();

      // Force refresh from backend
      const success = await pricingUtils.refreshPricingData();

      if (success) {
        toast.showSuccess(t.systemsettingspanel120);
      } else {
        toast.showError(t.systemsettingspanel122);
      }
    } catch (error: any) {
      toast.showError(t.systemsettingspanel125 + (error.message || t.systemsettingspanel125_2));
    } finally {
      setRefreshingPrices(false);
    }
  };

  // Fetch all users
  const fetchUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const response = await api.request('/admin/users');
      setUsers(response.users || []);
    } catch (error: any) {
      toast.showError(t.systemsettingspanel138 + (error.response?.data?.message || error.message));
    } finally {
      setLoadingUsers(false);
    }
  }, [toast]);

  // Toggle Inner Core status
  const handleToggleInnerCore = async (userId: number) => {
    try {
      const response = await api.request(`/admin/users/${userId}/toggle-inner-core`, {
        method: 'POST',
      });

      // Update local state
      setUsers(prevUsers =>
        prevUsers.map(user =>
          user.id === userId ? { ...user, is_inner_core: response.user.is_inner_core } : user
        )
      );

      toast.showSuccess(response.message);
    } catch (error: any) {
      toast.showError(t.systemsettingspanel160 + (error.response?.data?.message || error.message));
    }
  };

  // Load users when switching to User Management tab
  useEffect(() => {
    if (activeTabIndex === 1 && users.length === 0) {
      fetchUsers();
    }
  }, [activeTabIndex, users.length, fetchUsers]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full" style={{ backgroundColor: colors.bgPrimary }}>
        <ProgressSpinner />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col" style={{ backgroundColor: colors.bgPrimary, color: colors.textPrimary }}>
      <div className="flex-shrink-0 p-6" style={{ borderBottom: `1px solid ${colors.borderPrimary}` }}>
        <h3 className="text-2xl font-semibold mb-2" style={{ color: colors.textPrimary }}>
          {t.systemsettingspanel183}
        </h3>
        <p className="text-sm" style={{ color: colors.textSecondary }}>
          {t.systemsettingspanel186}
        </p>
      </div>

      <div className="flex-1 overflow-auto">
        <TabView
          activeIndex={activeTabIndex}
          onTabChange={(e) => setActiveTabIndex(e.index)}
          className="h-full themed-tabview"
        >
          {/* Settings Tab */}
          <TabPanel header={t.systemsettingspanel197} leftIcon="pi pi-cog">
            <div className="p-6">
              <div className="max-w-4xl">
                <form onSubmit={handleSubmit(onSubmit)}>
            {/* Google Translate API Section */}
            <div className="rounded-lg p-6 mb-6" style={{ backgroundColor: colors.bgSecondary, border: `1px solid ${colors.borderPrimary}` }}>
              <h4 className="text-lg font-semibold mb-4" style={{ color: colors.textPrimary }}>
                {t.systemsettingspanel204}
              </h4>
              <p className="text-sm mb-4" style={{ color: colors.textMuted }}>
                {t.systemsettingspanel207}
              </p>

              <div className="field">
                <label htmlFor="global_google_translate_key" className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
                  {t.systemsettingspanel212}
                </label>
                <Controller
                  name="global_google_translate_key"
                  control={control}
                  render={({ field }) => (
                    <input
                      id="global_google_translate_key"
                      type="text"
                      {...field}
                      placeholder={t.systemsettingspanel117}
                      className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      style={{ backgroundColor: colors.bgTertiary, border: `1px solid ${colors.borderPrimary}`, color: colors.textPrimary }}
                    />
                  )}
                />
                <small className="mt-1 block" style={{ color: colors.textMuted }}>
                  {t.systemsettingspanel229}
                </small>
              </div>
            </div>

            {/* Pricing Section */}
            <div className="rounded-lg p-6 mb-6" style={{ backgroundColor: colors.bgSecondary, border: `1px solid ${colors.borderPrimary}` }}>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold" style={{ color: colors.textPrimary }}>
                  {t.systemsettingspanel238}
                </h4>
                <Button
                  type="button"
                  label={t.systemsettingspanel242}
                  icon={refreshingPrices ? "pi pi-spinner pi-spin" : "pi pi-sync"}
                  severity="info"
                  size="small"
                  outlined
                  onClick={refreshPrices}
                  disabled={refreshingPrices}
                  tooltip={t.systemsettingspanel249}
                  tooltipOptions={{ position: 'left' }}
                />
              </div>
              <p className="text-sm mb-4" style={{ color: colors.textMuted }}>
                {t.systemsettingspanel254}
              </p>

              <div className="rounded p-3 mb-4" style={{ backgroundColor: colors.infoBg, border: `1px solid ${colors.infoBorder}` }}>
                <p className="text-xs" style={{ color: colors.textSecondary }}>
                  💡 <strong>Note:</strong>{t.systemsettingspanel259}<strong>"{t.systemsettingspanel259_2}"</strong>{t.systemsettingspanel259_3}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="field">
                  <label htmlFor="price_patron_annual" className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
                    {t.systemsettingspanel266}
                  </label>
                  <Controller
                    name="price_patron_annual"
                    control={control}
                    rules={{
                      required: t.systemsettingspanel272,
                      min: { value: 0, message: t.systemsettingspanel149 }
                    }}
                    render={({ field }) => (
                      <InputNumber
                        id="price_patron_annual"
                        value={field.value}
                        onValueChange={(e) => field.onChange(e.value)}
                        mode="currency"
                        currency="EUR"
                        locale="de-DE"
                        minFractionDigits={2}
                        min={0}
                        max={9999999.99}
                        className="w-full"
                        placeholder="34.90"
                      />
                    )}
                  />
                  {errors.price_patron_annual && (
                    <small className="mt-1 block" style={{ color: colors.errorText }}>{errors.price_patron_annual.message}</small>
                  )}
                </div>

                <div className="field">
                  <label htmlFor="price_patron_monthly" className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
                    {t.systemsettingspanel298}
                  </label>
                  <Controller
                    name="price_patron_monthly"
                    control={control}
                    rules={{
                      required: t.systemsettingspanel304,
                      min: { value: 0, message: t.systemsettingspanel149 }
                    }}
                    render={({ field }) => (
                      <InputNumber
                        id="price_patron_monthly"
                        value={field.value}
                        onValueChange={(e) => field.onChange(e.value)}
                        mode="currency"
                        currency="EUR"
                        locale="de-DE"
                        minFractionDigits={2}
                        min={0}
                        max={9999999.99}
                        className="w-full"
                        placeholder="49.90"
                      />
                    )}
                  />
                  {errors.price_patron_monthly && (
                    <small className="mt-1 block" style={{ color: colors.errorText }}>{errors.price_patron_monthly.message}</small>
                  )}
                </div>
              </div>

              <h5 className="text-md font-semibold mb-3 mt-6" style={{ color: colors.textPrimary }}>
                {t.systemsettingspanel330}
              </h5>
              <p className="text-sm mb-4" style={{ color: colors.textMuted }}>
                {t.systemsettingspanel333}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="field">
                  <label htmlFor="price_credits_500" className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
                    {t.systemsettingspanel339}
                  </label>
                  <Controller
                    name="price_credits_500"
                    control={control}
                    rules={{
                      required: t.systemsettingspanel345,
                      min: { value: 0, message: t.systemsettingspanel149 }
                    }}
                    render={({ field }) => (
                      <InputNumber
                        id="price_credits_500"
                        value={field.value}
                        onValueChange={(e) => field.onChange(e.value)}
                        mode="currency"
                        currency="EUR"
                        locale="de-DE"
                        minFractionDigits={2}
                        min={0}
                        max={9999999.99}
                        className="w-full"
                        placeholder="9.90"
                      />
                    )}
                  />
                  {errors.price_credits_500 && (
                    <small className="mt-1 block" style={{ color: colors.errorText }}>{errors.price_credits_500.message}</small>
                  )}
                </div>

                <div className="field">
                  <label htmlFor="price_credits_1000" className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
                    {t.systemsettingspanel371}
                  </label>
                  <Controller
                    name="price_credits_1000"
                    control={control}
                    rules={{
                      required: t.systemsettingspanel377,
                      min: { value: 0, message: t.systemsettingspanel149 }
                    }}
                    render={({ field }) => (
                      <InputNumber
                        id="price_credits_1000"
                        value={field.value}
                        onValueChange={(e) => field.onChange(e.value)}
                        mode="currency"
                        currency="EUR"
                        locale="de-DE"
                        minFractionDigits={2}
                        min={0}
                        max={9999999.99}
                        className="w-full"
                        placeholder="17.90"
                      />
                    )}
                  />
                  {errors.price_credits_1000 && (
                    <small className="mt-1 block" style={{ color: colors.errorText }}>{errors.price_credits_1000.message}</small>
                  )}
                </div>

                <div className="field">
                  <label htmlFor="price_credits_2500" className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
                    {t.systemsettingspanel403}
                  </label>
                  <Controller
                    name="price_credits_2500"
                    control={control}
                    rules={{
                      required: t.systemsettingspanel409,
                      min: { value: 0, message: t.systemsettingspanel149 }
                    }}
                    render={({ field }) => (
                      <InputNumber
                        id="price_credits_2500"
                        value={field.value}
                        onValueChange={(e) => field.onChange(e.value)}
                        mode="currency"
                        currency="EUR"
                        locale="de-DE"
                        minFractionDigits={2}
                        min={0}
                        max={9999999.99}
                        className="w-full"
                        placeholder="29.90"
                      />
                    )}
                  />
                  {errors.price_credits_2500 && (
                    <small className="mt-1 block" style={{ color: colors.errorText }}>{errors.price_credits_2500.message}</small>
                  )}
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                label={t.systemsettingspanel242}
                icon="pi pi-refresh"
                severity="secondary"
                outlined
                onClick={() => fetchSettings()}
                disabled={saving}
              />
              <Button
                type="submit"
                label={saving ? t.systemsettingspanel448 : t.systemsettingspanel251}
                icon={saving ? "pi pi-spinner pi-spin" : "pi pi-save"}
                severity="success"
                loading={saving}
              />
            </div>
          </form>
        </div>
      </div>
          </TabPanel>

          {/* User Management Tab */}
          <TabPanel header={t.systemsettingspanel460} leftIcon="pi pi-users">
            <div className="p-6">
              <div className="rounded-lg p-6 mb-6" style={{ backgroundColor: colors.bgSecondary, border: `1px solid ${colors.borderPrimary}` }}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="text-lg font-semibold" style={{ color: colors.textPrimary }}>
                      {t.systemsettingspanel466}
                    </h4>
                    <p className="text-sm mt-1" style={{ color: colors.textMuted }}>
                      {t.systemsettingspanel469}
                    </p>
                  </div>
                  <Button
                    icon="pi pi-refresh"
                    label={t.systemsettingspanel474}
                    onClick={() => fetchUsers()}
                    disabled={loadingUsers}
                    severity="secondary"
                    outlined
                  />
                </div>

                {loadingUsers ? (
                  <div className="flex items-center justify-center py-12">
                    <ProgressSpinner />
                  </div>
                ) : (
                  <DataTable
                    value={users}
                    paginator
                    rows={10}
                    rowsPerPageOptions={[5, 10, 25, 50]}
                    tableStyle={{ minWidth: '50rem' }}
                    emptyMessage={t.systemsettingspanel493}
                    className="p-datatable-sm"
                  >
                    <Column
                      field="name"
                      header={t.systemsettingspanel498}
                      sortable
                      style={{ minWidth: '150px' }}
                    />
                    <Column
                      field="email"
                      header={t.systemsettingspanel504}
                      sortable
                      style={{ minWidth: '200px' }}
                    />
                    <Column
                      field="user_type"
                      header={t.systemsettingspanel510}
                      sortable
                      body={(rowData) => (
                        <Tag
                          value={rowData.user_type}
                          severity={rowData.user_type === 'system' ? 'danger' : rowData.user_type === 'patron' ? 'warning' : 'info'}
                        />
                      )}
                    />
                    <Column
                      field="is_verified"
                      header={t.systemsettingspanel521}
                      body={(rowData) => (
                        <Tag
                          value={rowData.is_verified ? 'Yes' : 'No'}
                          severity={rowData.is_verified ? 'success' : 'warning'}
                          icon={rowData.is_verified ? 'pi pi-check' : 'pi pi-times'}
                        />
                      )}
                    />
                    <Column
                      field="is_inner_core"
                      header={t.systemsettingspanel532}
                      body={(rowData) => (
                        <div className="flex items-center gap-2">
                          {rowData.is_inner_core ? (
                            <>
                              <Tag value={t.systemsettingspanel537} severity="success" icon="pi pi-star-fill" />
                              <Button
                                icon="pi pi-times"
                                severity="danger"
                                size="small"
                                outlined
                                tooltip={t.systemsettingspanel543}
                                tooltipOptions={{ position: 'top' }}
                                onClick={() => handleToggleInnerCore(rowData.id)}
                              />
                            </>
                          ) : (
                            <Button
                              icon="pi pi-check"
                              label={t.systemsettingspanel551}
                              severity="success"
                              size="small"
                              outlined
                              tooltip={t.systemsettingspanel555}
                              tooltipOptions={{ position: 'top' }}
                              onClick={() => handleToggleInnerCore(rowData.id)}
                            />
                          )}
                        </div>
                      )}
                    />
                    <Column
                      field="member_since"
                      header={t.systemsettingspanel565}
                      sortable
                    />
                    <Column
                      field="last_login"
                      header={t.systemsettingspanel570}
                      sortable
                    />
                  </DataTable>
                )}
              </div>
            </div>
          </TabPanel>
        </TabView>
      </div>
    </div>
  );
}
