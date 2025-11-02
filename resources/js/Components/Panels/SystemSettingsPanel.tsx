import React, { useState, useEffect, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useToast } from '@/contexts/ToastContext';
import { Button } from 'primereact/button';
import { TabView, TabPanel } from 'primereact/tabview';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { InputNumber } from 'primereact/inputnumber';
import { Password } from 'primereact/password';
import { ProgressSpinner } from 'primereact/progressspinner';
import { api } from '@/lib/api';
import { useTranslation, SupportedLanguage, getStoredLanguage } from '@/i18n';

interface Settings {
  id: number;
  global_google_translate_key: string | null;
  price_premium: number;
  price_business: number;
  price_patron: number;
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
  const [, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // User Management states
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [activeTabIndex, setActiveTabIndex] = useState(0);

  const { control, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: {
      global_google_translate_key: '',
      price_premium: 0,
      price_business: 0,
      price_patron: 0,
    }
  });

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.request('/settings');
      setSettings(response);
      reset({
        global_google_translate_key: response.global_google_translate_key || '',
        price_premium: parseFloat(response.price_premium),
        price_business: parseFloat(response.price_business),
        price_patron: parseFloat(response.price_patron),
      });
    } catch (error: any) {
      toast.showError('Failed to load settings: ' + (error.response?.data?.message || error.message));
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
      toast.showError('Failed to update settings: ' + (error.response?.data?.message || error.message));
    } finally {
      setSaving(false);
    }
  };

  // Fetch all users
  const fetchUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const response = await api.request('/admin/users');
      setUsers(response.users || []);
    } catch (error: any) {
      toast.showError('Failed to load users: ' + (error.response?.data?.message || error.message));
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
      toast.showError('Failed to update user: ' + (error.response?.data?.message || error.message));
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
      <div className="flex items-center justify-center h-full bg-gray-800">
        <ProgressSpinner />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-800 text-gray-100">
      <div className="flex-shrink-0 p-6 border-b border-gray-700">
        <h3 className="text-2xl font-semibold text-white mb-2">
          ⚙️ System Settings
        </h3>
        <p className="text-sm text-gray-300">
          Configure global system settings for Scoriet
        </p>
      </div>

      <div className="flex-1 overflow-auto">
        <TabView
          activeIndex={activeTabIndex}
          onTabChange={(e) => setActiveTabIndex(e.index)}
          className="h-full"
        >
          {/* Settings Tab */}
          <TabPanel header="Settings" leftIcon="pi pi-cog">
            <div className="p-6">
              <div className="max-w-4xl">
                <form onSubmit={handleSubmit(onSubmit)}>
            {/* Google Translate API Section */}
            <div className="bg-gray-700 rounded-lg p-6 mb-6">
              <h4 className="text-lg font-semibold text-white mb-4">
                🌍 Google Translate API
              </h4>
              <p className="text-sm text-gray-400 mb-4">
                Configure the global Google Translate API key for Business plan users
              </p>

              <div className="field">
                <label htmlFor="global_google_translate_key" className="block text-sm font-medium text-gray-300 mb-2">
                  Global API Key
                </label>
                <Controller
                  name="global_google_translate_key"
                  control={control}
                  render={({ field }) => (
                    <Password
                      id="global_google_translate_key"
                      {...field}
                      placeholder={t.systemsettingspanel117}
                      className="w-full"
                      toggleMask
                      feedback={false}
                    />
                  )}
                />
                <small className="text-gray-400 mt-1 block">
                  This key will be used for Business plan users. Leave empty to require users to provide their own key.
                </small>
              </div>
            </div>

            {/* Pricing Section */}
            <div className="bg-gray-700 rounded-lg p-6 mb-6">
              <h4 className="text-lg font-semibold text-white mb-4">
                💰 Subscription Pricing
              </h4>
              <p className="text-sm text-gray-400 mb-4">
                Set monthly subscription prices for each plan tier
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="field">
                  <label htmlFor="price_premium" className="block text-sm font-medium text-gray-300 mb-2">
                    Premium Plan ($/month) *
                  </label>
                  <Controller
                    name="price_premium"
                    control={control}
                    rules={{
                      required: t.systemsettingspanel148,
                      min: { value: 0, message: t.systemsettingspanel149 }
                    }}
                    render={({ field }) => (
                      <InputNumber
                        id="price_premium"
                        value={field.value}
                        onValueChange={(e) => field.onChange(e.value)}
                        mode="currency"
                        currency={t.systemsettingspanel157}
                        locale="en-US"
                        minFractionDigits={2}
                        min={0}
                        max={9999999.99}
                        className="w-full"
                        placeholder="9.99"
                      />
                    )}
                  />
                  {errors.price_premium && (
                    <small className="text-red-400 mt-1 block">{errors.price_premium.message}</small>
                  )}
                </div>

                <div className="field">
                  <label htmlFor="price_business" className="block text-sm font-medium text-gray-300 mb-2">
                    Business Plan ($/month) *
                  </label>
                  <Controller
                    name="price_business"
                    control={control}
                    rules={{
                      required: t.systemsettingspanel180,
                      min: { value: 0, message: t.systemsettingspanel149 }
                    }}
                    render={({ field }) => (
                      <InputNumber
                        id="price_business"
                        value={field.value}
                        onValueChange={(e) => field.onChange(e.value)}
                        mode="currency"
                        currency={t.systemsettingspanel157}
                        locale="en-US"
                        minFractionDigits={2}
                        min={0}
                        max={9999999.99}
                        className="w-full"
                        placeholder="29.99"
                      />
                    )}
                  />
                  {errors.price_business && (
                    <small className="text-red-400 mt-1 block">{errors.price_business.message}</small>
                  )}
                </div>

                <div className="field">
                  <label htmlFor="price_patron" className="block text-sm font-medium text-gray-300 mb-2">
                    Patron Plan (minimum $/month) *
                  </label>
                  <Controller
                    name="price_patron"
                    control={control}
                    rules={{
                      required: t.systemsettingspanel212,
                      min: { value: 0, message: t.systemsettingspanel149 }
                    }}
                    render={({ field }) => (
                      <InputNumber
                        id="price_patron"
                        value={field.value}
                        onValueChange={(e) => field.onChange(e.value)}
                        mode="currency"
                        currency={t.systemsettingspanel157}
                        locale="en-US"
                        minFractionDigits={2}
                        min={0}
                        max={9999999.99}
                        className="w-full"
                        placeholder="99.99"
                      />
                    )}
                  />
                  {errors.price_patron && (
                    <small className="text-red-400 mt-1 block">{errors.price_patron.message}</small>
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
                label={saving ? "Saving..." : t.systemsettingspanel251}
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
          <TabPanel header="User Management" leftIcon="pi pi-users">
            <div className="p-6">
              <div className="bg-gray-700 rounded-lg p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="text-lg font-semibold text-white">
                      👥 User Management
                    </h4>
                    <p className="text-sm text-gray-400 mt-1">
                      Manage users and assign Inner Core Reviewer permissions
                    </p>
                  </div>
                  <Button
                    icon="pi pi-refresh"
                    label="Refresh"
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
                    emptyMessage="No users found"
                    className="p-datatable-sm"
                  >
                    <Column
                      field="name"
                      header="Name"
                      sortable
                      style={{ minWidth: '150px' }}
                    />
                    <Column
                      field="email"
                      header="Email"
                      sortable
                      style={{ minWidth: '200px' }}
                    />
                    <Column
                      field="user_type"
                      header="Type"
                      sortable
                      body={(rowData) => (
                        <Tag
                          value={rowData.user_type}
                          severity={rowData.user_type === 'admin' ? 'danger' : rowData.user_type === 'premium' ? 'warning' : 'info'}
                        />
                      )}
                    />
                    <Column
                      field="is_verified"
                      header="Verified"
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
                      header="Inner Core Reviewer"
                      body={(rowData) => (
                        <div className="flex items-center gap-2">
                          {rowData.is_inner_core ? (
                            <>
                              <Tag value="Reviewer" severity="success" icon="pi pi-star-fill" />
                              <Button
                                icon="pi pi-times"
                                severity="danger"
                                size="small"
                                outlined
                                tooltip="Remove Inner Core status"
                                tooltipOptions={{ position: 'top' }}
                                onClick={() => handleToggleInnerCore(rowData.id)}
                              />
                            </>
                          ) : (
                            <Button
                              icon="pi pi-check"
                              label="Assign"
                              severity="success"
                              size="small"
                              outlined
                              tooltip="Assign as Inner Core Reviewer"
                              tooltipOptions={{ position: 'top' }}
                              onClick={() => handleToggleInnerCore(rowData.id)}
                            />
                          )}
                        </div>
                      )}
                    />
                    <Column
                      field="member_since"
                      header="Member Since"
                      sortable
                    />
                    <Column
                      field="last_login"
                      header="Last Login"
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
