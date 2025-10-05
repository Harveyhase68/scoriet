import React, { useState, useEffect } from 'react';
import { Form, Input, message, Spin } from 'antd';
import { Button } from 'primereact/button';
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
  const [, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  // Custom dark mode CSS for Ant Design components
  const darkModeStyles = `
    /* Form styling */
    .system-settings-form .ant-form-item-label > label {
      color: #f9fafb !important;
    }
    .system-settings-form .ant-input,
    .system-settings-form .ant-input-password {
      background: #1f2937 !important;
      border-color: #4b5563 !important;
      color: #f9fafb !important;
    }
    .system-settings-form .ant-input:hover,
    .system-settings-form .ant-input-password:hover {
      border-color: #6b7280 !important;
    }
    .system-settings-form .ant-input:focus,
    .system-settings-form .ant-input-focused,
    .system-settings-form .ant-input-password:focus,
    .system-settings-form .ant-input-password-focused {
      border-color: #2563eb !important;
      box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.2) !important;
    }
    /* Password eye icon */
    .system-settings-form .ant-input-password-icon {
      color: #9ca3af !important;
    }
    .system-settings-form .ant-input-password-icon:hover {
      color: #d1d5db !important;
    }
    /* InputNumber styling */
    .system-settings-form .ant-input-number {
      background: #1f2937 !important;
      border: 1px solid #4b5563 !important;
      width: 100%;
    }
    .system-settings-form .ant-input-number:hover {
      border-color: #6b7280 !important;
    }
    .system-settings-form .ant-input-number-focused {
      border-color: #2563eb !important;
      box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.2) !important;
    }
    .system-settings-form .ant-input-number-input {
      color: #9ca3af !important;
      background: transparent !important;
    }
    .system-settings-form .ant-input-number-prefix {
      color: #9ca3af !important;
      border: none !important;
      background: transparent !important;
    }
    .system-settings-form .ant-input-number-affix-wrapper {
      background: #1f2937 !important;
      border-color: #4b5563 !important;
    }
    .system-settings-form .ant-input-number-affix-wrapper:hover {
      border-color: #6b7280 !important;
    }
    .system-settings-form .ant-input-number-affix-wrapper-focused {
      border-color: #2563eb !important;
      box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.2) !important;
    }
    .system-settings-form .ant-input-number-handler-wrap {
      background: #374151 !important;
      border-left: 1px solid #4b5563 !important;
    }
    .system-settings-form .ant-input-number-handler {
      border-color: #4b5563 !important;
    }
    .system-settings-form .ant-input-number-handler:hover {
      height: 50% !important;
    }
    .system-settings-form .ant-input-number-handler-up-inner,
    .system-settings-form .ant-input-number-handler-down-inner {
      color: #9ca3af !important;
    }
    .system-settings-form .ant-input-number-handler:hover .ant-input-number-handler-up-inner,
    .system-settings-form .ant-input-number-handler:hover .ant-input-number-handler-down-inner {
      color: #2563eb !important;
    }
    .system-settings-form .ant-form-item-extra {
      color: #9ca3af !important;
    }
  `;

  useEffect(() => {
    // Inject dark mode styles
    const styleElement = document.createElement('style');
    styleElement.textContent = darkModeStyles;
    document.head.appendChild(styleElement);

    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const response = await api.request('/settings');
      setSettings(response);
      form.setFieldsValue({
        global_google_translate_key: response.global_google_translate_key || '',
        price_premium: parseFloat(response.price_premium),
        price_business: parseFloat(response.price_business),
        price_patron: parseFloat(response.price_patron),
      });
    } catch (error: any) {
      message.error('Failed to load settings: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values: any) => {
    setSaving(true);
    try {
      const response = await api.request('/settings', {
        method: 'PUT',
        body: JSON.stringify(values)
      });

      setSettings(response.settings);
      message.success('Settings updated successfully!');
    } catch (error: any) {
      message.error('Failed to update settings: ' + (error.response?.data?.message || error.message));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-800">
        <Spin size="large" />
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
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            className="system-settings-form"
          >
            {/* Google Translate API Section */}
            <div className="bg-gray-700 rounded-lg p-6 mb-6">
              <h4 className="text-lg font-semibold text-white mb-4">
                🌍 Google Translate API
              </h4>
              <p className="text-sm text-gray-400 mb-4">
                Configure the global Google Translate API key for Business plan users
              </p>

              <Form.Item
                name="global_google_translate_key"
                label="Global API Key"
                extra="This key will be used for Business plan users. Leave empty to require users to provide their own key."
              >
                <Input.Password
                  placeholder="Enter Google Translate API key..."
                  className="w-full"
                />
              </Form.Item>
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
                <Form.Item
                  name="price_premium"
                  label="Premium Plan ($/month)"
                  rules={[
                    { required: true, message: 'Please enter Premium price' },
                    { type: 'number', min: 0, message: 'Price must be positive' }
                  ]}
                >
                  <InputNumber
                    prefix="$"
                    precision={2}
                    min={0}
                    max={9999999.99}
                    className="w-full"
                    placeholder="9.99"
                  />
                </Form.Item>

                <Form.Item
                  name="price_business"
                  label="Business Plan ($/month)"
                  rules={[
                    { required: true, message: 'Please enter Business price' },
                    { type: 'number', min: 0, message: 'Price must be positive' }
                  ]}
                >
                  <InputNumber
                    prefix="$"
                    precision={2}
                    min={0}
                    max={9999999.99}
                    className="w-full"
                    placeholder="29.99"
                  />
                </Form.Item>

                <Form.Item
                  name="price_patron"
                  label="Patron Plan (minimum $/month)"
                  rules={[
                    { required: true, message: 'Please enter Patron minimum price' },
                    { type: 'number', min: 0, message: 'Price must be positive' }
                  ]}
                >
                  <InputNumber
                    prefix="$"
                    precision={2}
                    min={0}
                    max={9999999.99}
                    className="w-full"
                    placeholder="99.99"
                  />
                </Form.Item>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end gap-3">
              <Button
                label="Reset"
                icon="pi pi-refresh"
                severity="secondary"
                outlined
                onClick={() => form.resetFields()}
                disabled={saving}
              />
              <Button
                label={saving ? "Saving..." : "Save Settings"}
                icon={saving ? "pi pi-spinner pi-spin" : "pi pi-save"}
                severity="success"
                type="submit"
                loading={saving}
              />
            </div>
          </Form>
        </div>
      </div>
    </div>
  );
}
