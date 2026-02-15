import React, { useState, useEffect } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { TabView, TabPanel } from 'primereact/tabview';
import { Dropdown } from 'primereact/dropdown';
import { Message } from 'primereact/message';
import { useTranslation, SupportedLanguage, getStoredLanguage } from '@/i18n';

interface Project {
  id: number;
  name: string;
  description: string;
  is_public?: boolean;
  join_code?: string;
  allow_join_requests?: boolean;
  is_owner?: boolean;
  can_join?: boolean;
  owner: {
    id: number;
    name: string;
    email: string;
    username?: string;
  };
  created_at: string;
  updated_at: string;
  teams_count?: number;
  members_count?: number;
  templates_count?: number;
  databases_count?: number;
  applications_count?: number;
  // Database connection fields
  database_name?: string;
  database_type?: string;
  database_server?: string;
  database_port?: string;
  database_username?: string;
  database_password?: string;
  // Project paths
  project_directory?: string;
  project_url?: string;
  // Project properties
  start_page?: string;
  default_language?: string;
  filename_short_length?: number;
  // Localization settings
  decimal_separator?: string;
  thousands_separator?: string;
  date_format?: string;
  time_format?: string;
  currency_symbol?: string;
  timezone?: string;
  // API Keys
  google_translate_api_key?: string;
}

interface EditProjectModalProps {
  visible: boolean;
  onHide: () => void;
  project: Project | null;
  onSuccess?: () => void;
  projectMembers?: any[];
}

export default function EditProjectModal({
  visible,
  onHide,
  project,
  onSuccess,
  projectMembers = []
}: EditProjectModalProps) {
  // i18n setup
  const [currentLanguage] = React.useState<SupportedLanguage>(getStoredLanguage());
  const { t } = useTranslation(currentLanguage);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    join_code: '',
    is_public: false,
    new_owner_id: null as number | null,
    // Database connection fields
    database_name: '',
    database_type: 'MySQL',
    database_server: '127.0.0.1',
    database_port: '3306',
    database_username: '',
    database_password: '',
    // Project paths
    project_directory: '',
    project_url: '',
    // Project properties
    start_page: 'index.php',
    default_language: 'en',
    filename_short_length: 2,
    // Localization settings
    decimal_separator: ',',
    thousands_separator: '.',
    date_format: 'd.m.Y',
    time_format: 'H:i:s',
    currency_symbol: t.editprojectmodal602,
    timezone: 'Europe/Vienna',
    // API Keys
    google_translate_api_key: ''
  });

  // Reset form when project changes
  useEffect(() => {
    if (project) {
      setEditForm({
        name: project.name,
        description: project.description || '',
        join_code: project.join_code || '',
        is_public: project.is_public || false,
        new_owner_id: null,
        // Database connection fields
        database_name: project.database_name || '',
        database_type: project.database_type || 'MySQL',
        database_server: project.database_server || '127.0.0.1',
        database_port: project.database_port || '3306',
        database_username: project.database_username || '',
        database_password: project.database_password || '',
        // Project paths
        project_directory: project.project_directory || '',
        project_url: project.project_url || '',
        // Project properties
        start_page: project.start_page || 'index.php',
        default_language: project.default_language || 'en',
        filename_short_length: project.filename_short_length || 2,
        // Localization settings
        decimal_separator: project.decimal_separator || ',',
        thousands_separator: project.thousands_separator || '.',
        date_format: project.date_format || 'd.m.Y',
        time_format: project.time_format || 'H:i:s',
        currency_symbol: project.currency_symbol || t.editprojectmodal602,
        timezone: project.timezone || 'Europe/Vienna',
        // API Keys
        google_translate_api_key: project.google_translate_api_key || ''
      });
    }
  }, [project]);

  // Reset state when modal closes
  useEffect(() => {
    if (!visible) {
      setError('');
      setSuccess('');
      setSaving(false);
    }
  }, [visible]);

  const handleSave = async () => {
    if (!project) return;

    // Confirm ownership transfer if requested
    if (editForm.new_owner_id) {
      const newOwner = projectMembers.find(member => parseInt(member.user_id) === editForm.new_owner_id);
      if (!confirm(`Are you sure you want to transfer ownership to ${newOwner?.user.name} (${newOwner?.user.email})?\n\nThis action cannot be undone and you will lose owner privileges!`)) {
        return;
      }
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (!token) {
        throw new Error(t.applicationsmodal66);
      }

      const response = await fetch(`/api/projects/${project.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
        body: JSON.stringify(editForm),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || t.editprojectmodal183);
      }

      await response.json();

      // Close modal immediately
      onHide();

      // Call success callback to refresh data (after modal is closed)
      if (onSuccess) {
        onSuccess();
      }

    } catch (error) {
      setError(error instanceof Error ? error.message : t.editprojectmodal197);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setError('');
    setSuccess('');
    onHide();
  };

  if (!project) {
    return null;
  }

  return (
    <Dialog
      header={t.editprojectmodal215}
      visible={visible}
      onHide={handleCancel}
      style={{ width: '800px' }}
      modal
      closable
      draggable={true}
      resizable={true}
      className="p-dialog-custom"
    >
      <TabView>
        {/* Tab 1: Project Settings */}
        <TabPanel header={t.editprojectmodal227} leftIcon="pi pi-cog">
          <div className="space-y-4">
            <div className="field">
              <label className="block text-sm font-medium text-white mb-2">
                Project Name *
              </label>
              <InputText
                value={editForm.name}
                onChange={(e) => {
                  setEditForm(prev => ({ ...prev, name: e.target.value }));
                  setError('');
                }}
                className="w-full font-mono"
                placeholder={t.editprojectmodal240}
                disabled={saving}
              />
              <div className="text-xs text-gray-400 mt-1">
                {t.editprojectmodal569}
              </div>
              <div className="text-xs text-orange-400 mt-1">
                {t.editprojectmodal252}
              </div>
            </div>

            <div className="field">
              <label className="block text-sm font-medium text-white mb-2">
                {t.editprojectmodal258}
              </label>
              <InputTextarea
                value={editForm.description}
                onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                className="w-full"
                rows={3}
                placeholder={t.editprojectmodal260}
                disabled={saving}
              />
            </div>

            <div className="field">
              <label className="block text-sm font-medium text-white mb-2">
                Join Code
              </label>
              <div className="flex gap-2">
                <InputText
                  value={editForm.join_code}
                  onChange={(e) => setEditForm(prev => ({ ...prev, join_code: e.target.value }))}
                  className="flex-1"
                  placeholder={t.editprojectmodal274}
                  disabled={saving}
                />
                <Button
                  icon="pi pi-refresh"
                  className="p-button-outlined"
                  onClick={() => setEditForm(prev => ({ ...prev, join_code: 'PROJ-' + Math.random().toString(36).substring(2, 10).toUpperCase() }))}
                  tooltip={t.editprojectmodal281}
                  disabled={saving}
                />
              </div>
              <small className="text-gray-500">Users can join this project using this code</small>
            </div>

            <div className="field">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="edit-is-public"
                  checked={editForm.is_public}
                  onChange={(e) => setEditForm(prev => ({ ...prev, is_public: e.target.checked }))}
                  disabled={saving}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                />
                <label htmlFor="edit-is-public" className="text-sm font-medium text-white">
                  Public Project
                </label>
              </div>
              <small className="text-gray-500">Make this project visible to all users</small>
            </div>

            {project.is_owner && projectMembers.length > 0 && (
              <div className="field">
                <label className="block text-sm font-medium text-white mb-2">
                  Transfer Ownership
                </label>
                <select
                  value={editForm.new_owner_id || ''}
                  onChange={(e) => setEditForm(prev => ({ ...prev, new_owner_id: e.target.value ? parseInt(e.target.value) : null }))}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                  disabled={saving}
                >
                  <option value="">Keep current owner ({project.owner.name})</option>
                  {projectMembers.filter(member => member.user_id !== project.owner.id).map(member => (
                    <option key={member.user_id} value={member.user_id}>
                      Transfer to {member.user.name} ({member.user.email}) - {member.role}
                    </option>
                  ))}
                </select>
                <small className="text-yellow-500">
                  ⚠️ Warning: You will lose owner privileges after transfer!
                </small>
              </div>
            )}
          </div>
        </TabPanel>

        {/* Tab 2: Database Connection */}
        <TabPanel header={t.editprojectmodal332} leftIcon="pi pi-database">
          <div className="space-y-4">
            <div className="field">
              <label className="block text-sm font-medium text-white mb-2">
                Database Name
              </label>
              <InputText
                value={editForm.database_name}
                onChange={(e) => setEditForm(prev => ({ ...prev, database_name: e.target.value }))}
                placeholder="project_database"
                className="w-full"
                disabled={saving}
              />
              <div className="text-xs text-gray-400 mt-1">
                Name der Datenbank für dieses Projekt
              </div>
            </div>

            <div className="field">
              <label className="block text-sm font-medium text-white mb-2">
                Database Type
              </label>
              <Dropdown
                value={editForm.database_type}
                onChange={(e) => setEditForm(prev => ({ ...prev, database_type: e.target.value }))}
                options={[
                  { label: 'MySQL', value: 'MySQL' },
                  { label: 'PostgreSQL', value: 'PostgreSQL' },
                  { label: 'SQLite', value: 'SQLite' },
                  { label: 'SQL Server', value: 'MSSQL' }
                ]}
                className="w-full"
                disabled={saving}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="field">
                <label className="block text-sm font-medium text-white mb-2">
                  Server
                </label>
                <InputText
                  value={editForm.database_server}
                  onChange={(e) => setEditForm(prev => ({ ...prev, database_server: e.target.value }))}
                  placeholder="127.0.0.1"
                  className="w-full"
                  disabled={saving}
                />
              </div>

              <div className="field">
                <label className="block text-sm font-medium text-white mb-2">
                  Port
                </label>
                <InputText
                  value={editForm.database_port}
                  onChange={(e) => setEditForm(prev => ({ ...prev, database_port: e.target.value }))}
                  placeholder="3306"
                  className="w-full"
                  disabled={saving}
                />
              </div>
            </div>

            <div className="field">
              <label className="block text-sm font-medium text-white mb-2">
                Username
              </label>
              <InputText
                value={editForm.database_username}
                onChange={(e) => setEditForm(prev => ({ ...prev, database_username: e.target.value }))}
                placeholder="database_user"
                className="w-full"
                disabled={saving}
              />
            </div>

            <div className="field">
              <label className="block text-sm font-medium text-white mb-2">
                Password
              </label>
              <InputText
                type="password"
                value={editForm.database_password}
                onChange={(e) => setEditForm(prev => ({ ...prev, database_password: e.target.value }))}
                placeholder="database_password"
                className="w-full"
                disabled={saving}
              />
            </div>
          </div>
        </TabPanel>

        {/* Tab 3: Project Properties */}
        <TabPanel header={t.editprojectmodal426} leftIcon="pi pi-file">
          <div className="space-y-4">
            <div className="field">
              <label className="block text-sm font-medium text-white mb-2">
                Project Directory
              </label>
              <InputText
                value={editForm.project_directory}
                onChange={(e) => setEditForm(prev => ({ ...prev, project_directory: e.target.value }))}
                placeholder="C:\Users\Public\Documents\my_project"
                className="w-full"
                disabled={saving}
              />
              <div className="text-xs text-gray-400 mt-1">
                Pfad wo generierte Dateien gespeichert werden sollen
              </div>
            </div>

            <div className="field">
              <label className="block text-sm font-medium text-white mb-2">
                Project URL
              </label>
              <InputText
                value={editForm.project_url}
                onChange={(e) => setEditForm(prev => ({ ...prev, project_url: e.target.value }))}
                placeholder="http://localhost/my_project"
                className="w-full"
                disabled={saving}
              />
              <div className="text-xs text-gray-400 mt-1">
                URL für den Zugriff auf das Projekt
              </div>
            </div>

            <div className="field">
              <label className="block text-sm font-medium text-white mb-2">
                Start Page
              </label>
              <InputText
                value={editForm.start_page}
                onChange={(e) => setEditForm(prev => ({ ...prev, start_page: e.target.value }))}
                placeholder="index.php"
                className="w-full"
                disabled={saving}
              />
              <div className="text-xs text-gray-400 mt-1">
                Haupt-Einstiegsdatei (z.B. index.php, main.py, app.js)
              </div>
            </div>

            <div className="field">
              <label className="block text-sm font-medium text-white mb-2">
                Default Language
              </label>
              <Dropdown
                value={editForm.default_language}
                onChange={(e) => setEditForm(prev => ({ ...prev, default_language: e.target.value }))}
                options={[
                  { label: t.editprojectmodal484, value: 'en' },
                  { label: t.editprojectmodal485, value: 'de' },
                  { label: t.editprojectmodal486, value: 'fr' },
                  { label: t.editprojectmodal487, value: 'es' },
                  { label: t.editprojectmodal488, value: 'it' }
                ]}
                className="w-full"
                disabled={saving}
              />
              <div className="text-xs text-gray-400 mt-1">
                Standard-Sprache für Projekt-Generierung
              </div>
            </div>

            <div className="field">
              <label className="block text-sm font-medium text-white mb-2">
                Filename Short Length
              </label>
              <Dropdown
                value={editForm.filename_short_length}
                onChange={(e) => setEditForm(prev => ({ ...prev, filename_short_length: e.target.value }))}
                options={[
                  { label: t.editprojectmodal506, value: 2 },
                  { label: t.editprojectmodal507, value: 3 },
                  { label: t.editprojectmodal508, value: 4 },
                  { label: t.editprojectmodal509, value: 5 }
                ]}
                className="w-full"
                disabled={saving}
              />
              <div className="text-xs text-gray-400 mt-1">
                Länge der kurzen Dateinamen im Database Designer (z.B. "us" für users)
              </div>
            </div>
          </div>
        </TabPanel>

        {/* Tab 4: Localization Settings */}
        <TabPanel header={t.editprojectmodal522} leftIcon="pi pi-globe">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="field">
                <label className="block text-sm font-medium text-white mb-2">
                  Decimal Separator
                </label>
                <InputText
                  value={editForm.decimal_separator}
                  onChange={(e) => setEditForm({ ...editForm, decimal_separator: e.target.value })}
                  placeholder=","
                  maxLength={1}
                  className="w-full"
                  disabled={saving}
                />
                <div className="text-xs text-gray-400 mt-1">
                  Trennzeichen für Dezimalstellen (z.B. "," für 1,23 oder "." für 1.23)
                </div>
              </div>

              <div className="field">
                <label className="block text-sm font-medium text-white mb-2">
                  Thousands Separator
                </label>
                <InputText
                  value={editForm.thousands_separator}
                  onChange={(e) => setEditForm({ ...editForm, thousands_separator: e.target.value })}
                  placeholder="."
                  maxLength={1}
                  className="w-full"
                  disabled={saving}
                />
                <div className="text-xs text-gray-400 mt-1">
                  Tausendertrennzeichen (z.B. "." für 1.234 oder "," für 1,234)
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="field">
                <label className="block text-sm font-medium text-white mb-2">
                  Date Format
                </label>
                <InputText
                  value={editForm.date_format}
                  onChange={(e) => setEditForm({ ...editForm, date_format: e.target.value })}
                  placeholder="d.m.Y"
                  className="w-full"
                  disabled={saving}
                />
                <div className="text-xs text-gray-400 mt-1">
                  {t.editprojectmodal578}
                </div>
              </div>

              <div className="field">
                <label className="block text-sm font-medium text-white mb-2">
                  Time Format
                </label>
                <InputText
                  value={editForm.time_format}
                  onChange={(e) => setEditForm({ ...editForm, time_format: e.target.value })}
                  placeholder="H:i:s"
                  className="w-full"
                  disabled={saving}
                />
                <div className="text-xs text-gray-400 mt-1">
                  {t.editprojectmodal594}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="field">
                <label className="block text-sm font-medium text-white mb-2">
                  {t.editprojectmodal602}
                </label>
                <InputText
                  value={editForm.currency_symbol}
                  onChange={(e) => setEditForm({ ...editForm, currency_symbol: e.target.value })}
                  placeholder={t.editprojectmodal602}
                  maxLength={5}
                  className="w-full"
                  disabled={saving}
                />
                <div className="text-xs text-gray-400 mt-1">
                  {t.editprojectmodal613}
                </div>
              </div>

              <div className="field">
                <label className="block text-sm font-medium text-white mb-2">
                  {t.editprojectmodal619}
                </label>
                <Dropdown
                  value={editForm.timezone}
                  onChange={(e) => setEditForm({ ...editForm, timezone: e.value })}
                  options={[
                    { label: 'Europe/Vienna', value: 'Europe/Vienna' },
                    { label: 'Europe/Berlin', value: 'Europe/Berlin' },
                    { label: 'Europe/Zurich', value: 'Europe/Zurich' },
                    { label: 'Europe/London', value: 'Europe/London' },
                    { label: 'America/New_York', value: 'America/New_York' },
                    { label: 'America/Chicago', value: 'America/Chicago' },
                    { label: 'America/Los_Angeles', value: 'America/Los_Angeles' },
                    { label: 'Asia/Tokyo', value: 'Asia/Tokyo' },
                    { label: 'Asia/Dubai', value: 'Asia/Dubai' },
                    { label: 'UTC', value: 'UTC' }
                  ]}
                  className="w-full"
                  disabled={saving}
                />
                <div className="text-xs text-gray-400 mt-1">
                  {t.editprojectmodal640}
                </div>
              </div>
            </div>

            <div className="field mt-6">
              <label className="block text-sm font-medium text-white mb-2">
                {t.editprojectmodal647}
              </label>
              <InputText
                type="password"
                value={editForm.google_translate_api_key}
                onChange={(e) => setEditForm({ ...editForm, google_translate_api_key: e.target.value })}
                placeholder="AIzaSy..."
                className="w-full font-mono"
                disabled={saving}
              />
              <div className="text-xs text-gray-400 mt-1">
                {t.editprojectmodal658}
              </div>
              <div className="text-xs text-blue-400 mt-1">
                🔗 <a href="https://cloud.google.com/translate/docs/setup" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-300">
                  {t.editprojectmodal662}
                </a>
              </div>
            </div>
          </div>
        </TabPanel>
      </TabView>

      {/* Messages */}
      {error && (
        <div className="mt-4">
          <Message
            severity="error"
            text={error}
            className="w-full"
          />
        </div>
      )}

      {success && (
        <div className="mt-4">
          <Message
            severity="success"
            text={success}
            className="w-full"
          />
        </div>
      )}

      {/* Buttons */}
      <div className="flex justify-end space-x-2 pt-4 gap-2">
        <Button
          label={t.applicationsmodal432}
          icon="pi pi-times"
          onClick={handleCancel}
          className="p-button-text"
          disabled={saving}
        />
        <Button
          label={saving ? t.editprojectmodal701 : t.editprojectmodal696}
          icon={saving ? "pi pi-spinner pi-spin" : "pi pi-check"}
          onClick={handleSave}
          disabled={saving}
        />
      </div>
    </Dialog>
  );
}