import React, { useState, useEffect } from 'react';
import { Table, Modal, Form, Input, Switch, message, Tag, Select, InputNumber } from 'antd';
import { Button } from 'primereact/button';
import type { ColumnsType } from 'antd/es/table';
import { api } from '@/lib/api';

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
  const [languages, setLanguages] = useState<Language[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingLanguage, setEditingLanguage] = useState<Language | null>(null);
  const [form] = Form.useForm();

  // Custom dark mode CSS for Ant Design Modal and components
  const darkModeStyles = `
    /* Modal styling */
    .language-management-modal .ant-modal-content {
      background: #374151 !important;
      color: #f9fafb !important;
    }
    .language-management-modal .ant-modal-header {
      background: #374151 !important;
      border-bottom: 1px solid #4b5563 !important;
    }
    .language-management-modal .ant-modal-title {
      color: #f9fafb !important;
    }
    .language-management-modal .ant-modal-footer {
      background: #374151 !important;
      border-top: 1px solid #4b5563 !important;
    }

    /* Form styling inside modal */
    .language-management-modal .ant-form-item-label > label {
      color: #f9fafb !important;
    }
    .language-management-modal .ant-input {
      background: #1f2937 !important;
      border-color: #4b5563 !important;
      color: #f9fafb !important;
    }
    .language-management-modal .ant-input:focus {
      border-color: #2563eb !important;
      box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.2) !important;
    }
    .language-management-modal .ant-select-selector {
      background: #1f2937 !important;
      border-color: #4b5563 !important;
      color: #f9fafb !important;
    }
    .language-management-modal .ant-select-selection-search-input {
      color: #f9fafb !important;
    }
    .language-management-modal .ant-input-number {
      background: #1f2937 !important;
      border-color: #4b5563 !important;
    }
    .language-management-modal .ant-input-number-input {
      color: #f9fafb !important;
    }
    .language-management-modal .ant-switch {
      background: #4b5563 !important;
    }
    .language-management-modal .ant-switch-checked {
      background: #2563eb !important;
    }

    /* Table styling */
    .ant-table {
      background: #374151 !important;
      color: #f9fafb !important;
    }
    .ant-table-thead > tr > th {
      background: #1f2937 !important;
      color: #f9fafb !important;
      border-bottom: 1px solid #4b5563 !important;
    }
    .ant-table-tbody > tr > td {
      background: #374151 !important;
      color: #f9fafb !important;
      border-bottom: 1px solid #4b5563 !important;
    }
    .ant-table-tbody > tr:hover > td {
      background: #1f2937 !important;
    }

    /* Pagination styling */
    .ant-pagination {
      color: #f9fafb !important;
    }
    .ant-pagination .ant-pagination-item {
      background: #1f2937 !important;
      border-color: #4b5563 !important;
    }
    .ant-pagination .ant-pagination-item a {
      color: #f9fafb !important;
    }
    .ant-pagination .ant-pagination-item-active {
      background: #2563eb !important;
      border-color: #2563eb !important;
    }
    .ant-pagination .ant-pagination-prev,
    .ant-pagination .ant-pagination-next {
      color: #f9fafb !important;
    }

    /* Select dropdown */
    .ant-select-dropdown.language-management-dropdown {
      background: #374151 !important;
    }
    .ant-select-dropdown.language-management-dropdown .ant-select-item {
      color: #f9fafb !important;
    }
    .ant-select-dropdown.language-management-dropdown .ant-select-item-option-selected {
      background: #2563eb !important;
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
  }, [darkModeStyles]);

  const fetchLanguages = async () => {
    setLoading(true);
    try {
      const response = await api.request('/languages');
      setLanguages(response);
    } catch (error: any) {
      if (error.response?.status === 403) {
        message.error('Unauthorized. System admin access required.');
      } else {
        message.error('Failed to load languages: ' + (error.response?.data?.message || error.message));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLanguages();
  }, []);

  const handleCreate = () => {
    setEditingLanguage(null);
    form.resetFields();
    form.setFieldsValue({
      is_active: true,
      is_default: false,
      sort_order: languages.length + 1
    });
    setModalVisible(true);
  };

  const handleEdit = (language: Language) => {
    setEditingLanguage(language);
    form.setFieldsValue(language);
    setModalVisible(true);
  };

  const handleDelete = async (language: Language) => {
    try {
      await api.request(`/languages/${language.id}`, { method: 'DELETE' });
      message.success('Language deleted successfully');
      fetchLanguages();
    } catch (error: any) {
      message.error('Failed to delete language: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleToggleActive = async (language: Language) => {
    try {
      await api.request(`/languages/${language.id}/toggle-active`, { method: 'PATCH' });
      message.success(`Language ${language.is_active ? 'deactivated' : 'activated'} successfully`);
      fetchLanguages();
    } catch (error: any) {
      message.error('Failed to toggle language status: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleSetDefault = async (language: Language) => {
    try {
      await api.request(`/languages/${language.id}/set-default`, { method: 'PATCH' });
      message.success('Default language updated successfully');
      fetchLanguages();
    } catch (error: any) {
      message.error('Failed to set default language: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleSubmit = async (values: LanguageFormData) => {
    try {
      if (editingLanguage) {
        await api.request(`/languages/${editingLanguage.id}`, {
          method: 'PUT',
          body: JSON.stringify(values)
        });
        message.success('Language updated successfully');
      } else {
        await api.request('/languages', {
          method: 'POST',
          body: JSON.stringify(values)
        });
        message.success('Language created successfully');
      }
      setModalVisible(false);
      fetchLanguages();
    } catch (error: any) {
      message.error('Failed to save language: ' + (error.response?.data?.message || error.message));
    }
  };

  const commonFlags = [
    { value: '🇺🇸', label: '🇺🇸 United States' },
    { value: '🇬🇧', label: '🇬🇧 United Kingdom' },
    { value: '🇩🇪', label: '🇩🇪 Germany' },
    { value: '🇫🇷', label: '🇫🇷 France' },
    { value: '🇪🇸', label: '🇪🇸 Spain' },
    { value: '🇮🇹', label: '🇮🇹 Italy' },
    { value: '🇳🇱', label: '🇳🇱 Netherlands' },
    { value: '🇵🇹', label: '🇵🇹 Portugal' },
    { value: '🇷🇺', label: '🇷🇺 Russia' },
    { value: '🇯🇵', label: '🇯🇵 Japan' },
    { value: '🇰🇷', label: '🇰🇷 South Korea' },
    { value: '🇨🇳', label: '🇨🇳 China' },
    { value: '🇧🇷', label: '🇧🇷 Brazil' },
    { value: '🇲🇽', label: '🇲🇽 Mexico' },
    { value: '🇨🇦', label: '🇨🇦 Canada' },
    { value: '🇦🇺', label: '🇦🇺 Australia' },
    { value: '🇮🇳', label: '🇮🇳 India' },
  ];

  const columns: ColumnsType<Language> = [
    {
      title: 'Flag',
      dataIndex: 'flag',
      key: 'flag',
      width: 60,
      render: (flag: string) => flag || '🏴',
    },
    {
      title: 'Code',
      dataIndex: 'code',
      key: 'code',
      width: 80,
      render: (code: string) => <Tag color="blue">{code.toUpperCase()}</Tag>,
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      width: 150,
    },
    {
      title: 'Native Name',
      dataIndex: 'native_name',
      key: 'native_name',
      width: 150,
    },
    {
      title: 'Status',
      dataIndex: 'is_active',
      key: 'is_active',
      width: 100,
      render: (is_active: boolean, record: Language) => (
        <div className="flex gap-1">
          <Tag color={is_active ? 'green' : 'red'}>
            {is_active ? 'Active' : 'Inactive'}
          </Tag>
          {record.is_default && <Tag color="gold">Default</Tag>}
        </div>
      ),
    },
    {
      title: 'Sort Order',
      dataIndex: 'sort_order',
      key: 'sort_order',
      width: 100,
      sorter: (a, b) => a.sort_order - b.sort_order,
    },
    {
      title: 'Creator',
      dataIndex: 'creator',
      key: 'creator',
      width: 120,
      render: (creator: any) => creator?.name || 'System',
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (description: string) => description || '-',
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 200,
      render: (_, record: Language) => (
        <div className="flex gap-1">
          <Button
            icon="pi pi-pencil"
            rounded
            text
            size="small"
            severity="info"
            onClick={() => handleEdit(record)}
            tooltip="Edit Language"
            tooltipOptions={{ position: 'top' }}
          />

          <Button
            icon={record.is_active ? "pi pi-eye-slash" : "pi pi-eye"}
            rounded
            text
            size="small"
            severity={record.is_active ? "warning" : "success"}
            onClick={() => handleToggleActive(record)}
            tooltip={record.is_active ? 'Deactivate' : 'Activate'}
            tooltipOptions={{ position: 'top' }}
            disabled={record.is_default && record.is_active}
          />

          {!record.is_default && (
            <Button
              icon="pi pi-star"
              rounded
              text
              size="small"
              severity="help"
              onClick={() => handleSetDefault(record)}
              tooltip="Set as Default"
              tooltipOptions={{ position: 'top' }}
              disabled={!record.is_active}
            />
          )}

          <Button
            icon="pi pi-trash"
            rounded
            text
            size="small"
            severity="danger"
            onClick={() => {
              if (window.confirm('Are you sure you want to delete this language?')) {
                handleDelete(record);
              }
            }}
            tooltip={record.is_default ? 'Cannot delete default language' : 'Delete Language'}
            tooltipOptions={{ position: 'top' }}
            disabled={record.is_default}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="h-full flex flex-col bg-gray-800 text-gray-100">
      <div className="flex-shrink-0 p-4 border-b border-gray-700 bg-gray-800">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold text-white">
              Language Management
            </h3>
            <p className="text-sm text-gray-300">
              Manage languages for content translation (System Admin Only)
            </p>
          </div>
          <Button
            icon="pi pi-plus"
            label="Add Language"
            size="small"
            severity="info"
            onClick={handleCreate}
          />
        </div>
      </div>

      <div className="flex-1 p-4 overflow-auto bg-gray-800">
        <div className="rounded-lg shadow-sm overflow-hidden bg-gray-700">
          <Table
            columns={columns}
            dataSource={languages}
            rowKey="id"
            loading={loading}
            pagination={{
              pageSize: 20,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} languages`,
            }}
            scroll={{ y: 'calc(100vh - 300px)' }}
            size="small"
          />
        </div>
      </div>

        <Modal
          title={editingLanguage ? 'Edit Language' : 'Add New Language'}
          open={modalVisible}
          onCancel={() => setModalVisible(false)}
          onOk={() => form.submit()}
          width={600}
          destroyOnHidden
          className="language-management-modal"
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            initialValues={{
              is_active: true,
              is_default: false,
              sort_order: 1
            }}
          >
          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              name="code"
              label="Language Code"
              rules={[
                { required: true, message: 'Please enter language code' },
                { max: 5, message: 'Code must be 5 characters or less' },
                { pattern: /^[a-z]{2,3}(-[A-Z]{2})?$/, message: 'Please enter valid language code (e.g., en, de, en-US)' }
              ]}
            >
              <Input placeholder="e.g., en, de, fr" />
            </Form.Item>

            <Form.Item
              name="flag"
              label="Flag"
            >
              <Select
                placeholder="Select flag"
                allowClear
                showSearch
                options={commonFlags}
                dropdownClassName="language-management-dropdown"
              />
            </Form.Item>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              name="name"
              label="English Name"
              rules={[
                { required: true, message: 'Please enter language name' },
                { max: 100, message: 'Name must be 100 characters or less' }
              ]}
            >
              <Input placeholder="e.g., English, German, French" />
            </Form.Item>

            <Form.Item
              name="native_name"
              label="Native Name"
              rules={[
                { required: true, message: 'Please enter native language name' },
                { max: 100, message: 'Native name must be 100 characters or less' }
              ]}
            >
              <Input placeholder="e.g., English, Deutsch, Français" />
            </Form.Item>
          </div>

          <Form.Item
            name="description"
            label="Description"
            rules={[
              { max: 1000, message: 'Description must be 1000 characters or less' }
            ]}
          >
            <Input.TextArea
              rows={3}
              placeholder="Optional description of the language"
            />
          </Form.Item>

          <div className="grid grid-cols-3 gap-4">
            <Form.Item
              name="sort_order"
              label="Sort Order"
              rules={[
                { required: true, message: 'Please enter sort order' },
                { type: 'number', min: 0, message: 'Sort order must be 0 or greater' }
              ]}
            >
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item
              name="is_active"
              label="Active"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>

            <Form.Item
              name="is_default"
              label="Default Language"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
          </div>
          </Form>
        </Modal>
      </div>
    );
}