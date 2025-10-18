import React, { useState, useEffect, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useToast } from '@/contexts/ToastContext';
import { Button } from 'primereact/button';

import { InputNumber } from 'primereact/inputnumber';
import { Password } from 'primereact/password';
import { ProgressSpinner } from 'primereact/progressspinner';
import { api } from '@/lib/api';

interface Settings {
  id: number;
  global_google_translate_key: string | null;
  price_premium: number;
  price_business: number;
  price_patron: number;
  created_at: string;
  updated_at: string;
}

export default function SystemSettingsPanel() {
  const toast = useToast();
  const [, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

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
      toast.showSuccess('Settings updated successfully!');
    } catch (error: any) {
      toast.showError('Failed to update settings: ' + (error.response?.data?.message || error.message));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-800">
        <ProgressSpinner />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-800 text-gray-100 overflow-auto">
      <div className="flex-shrink-0 p-6 border-b border-gray-700">
        <h3 className="text-2xl font-semibold text-white mb-2">
          ⚙️ System Settings
        </h3>
        <p className="text-sm text-gray-300">
          Configure global system settings for Scoriet
        </p>
      </div>

      <div className="flex-1 p-6">
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
                      placeholder="Enter Google Translate API key..."
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
                      required: 'Please enter Premium price',
                      min: { value: 0, message: 'Price must be positive' }
                    }}
                    render={({ field }) => (
                      <InputNumber
                        id="price_premium"
                        value={field.value}
                        onValueChange={(e) => field.onChange(e.value)}
                        mode="currency"
                        currency="USD"
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
                      required: 'Please enter Business price',
                      min: { value: 0, message: 'Price must be positive' }
                    }}
                    render={({ field }) => (
                      <InputNumber
                        id="price_business"
                        value={field.value}
                        onValueChange={(e) => field.onChange(e.value)}
                        mode="currency"
                        currency="USD"
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
                      required: 'Please enter Patron minimum price',
                      min: { value: 0, message: 'Price must be positive' }
                    }}
                    render={({ field }) => (
                      <InputNumber
                        id="price_patron"
                        value={field.value}
                        onValueChange={(e) => field.onChange(e.value)}
                        mode="currency"
                        currency="USD"
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
                label="Reset"
                icon="pi pi-refresh"
                severity="secondary"
                outlined
                onClick={() => fetchSettings()}
                disabled={saving}
              />
              <Button
                type="submit"
                label={saving ? "Saving..." : "Save Settings"}
                icon={saving ? "pi pi-spinner pi-spin" : "pi pi-save"}
                severity="success"
                loading={saving}
              />
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
