import React, { useState, useEffect } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
// import { Dropdown } from 'primereact/dropdown';
import { Checkbox } from 'primereact/checkbox';
import { MultiSelect } from 'primereact/multiselect';
import { Message } from 'primereact/message';
import { useProject } from '@/contexts/ProjectContext';
import { useTranslation, SupportedLanguage, getStoredLanguage } from '@/i18n';

interface TeamMember {
  id: number;
  user_id: number;
  role: string;
  joined_at: string;
  user: {
    id: number;
    name: string;
    email: string;
    username?: string;
  };
}

interface Team {
  id: number;
  name: string;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  project_owner_id: number;
  project_id?: number;
  project?: {
    id: number;
    name: string;
  };
  projects?: Array<{
    id: number;
    name: string;
  }>;
  owner: {
    id: number;
    name: string;
    email: string;
    username?: string;
  };
  members: TeamMember[];
  members_count?: number;
}

interface TeamModalProps {
  visible: boolean;
  onHide: () => void;
  team?: Team | null;
  onSave: () => void;
}

export default function TeamModal({ visible, onHide, team, onSave }: TeamModalProps) {
  // i18n setup
  const [currentLanguage] = React.useState<SupportedLanguage>(getStoredLanguage());
  const { t } = useTranslation(currentLanguage);

  const { projects } = useProject();
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    project_ids: number[];
    is_active: boolean;
  }>({
    name: '',
    description: '',
    project_ids: [],
    is_active: true
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);

  const handleNameChange = (value: string) => {
    // Convert to lowercase and remove invalid characters
    const sanitized = value.toLowerCase().replace(/[^a-z0-9_]/g, '');

    // Check if any characters were removed (invalid input)
    if (value !== sanitized) {
      setNameError('Only lowercase letters, numbers, and underscores are allowed');
    } else {
      setNameError(null);
    }

    setFormData(prev => ({ ...prev, name: sanitized }));
  };

  useEffect(() => {
    if (visible && team) {
      setFormData({
        name: team.name,
        description: team.description || '',
        project_ids: team.projects?.map((p: any) => p.id) || [],
        is_active: team.is_active
      });
    } else if (visible && !team) {
      setFormData({
        name: '',
        description: '',
        project_ids: [],
        is_active: true
      });
    }
    setError('');
  }, [visible, team]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError(t.teammodal98);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (!token) {
        throw new Error(t.applicationsmodal66);
      }

      const url = team ? `/api/teams/${team.id}` : '/api/teams';
      const method = team ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        // Handle Laravel validation errors
        if (errorData.errors && errorData.errors.name) {
          throw new Error(errorData.errors.name[0]);
        }
        
        throw new Error(errorData.message || t.teammodal132);
      }

      onSave();
    } catch (error) {
      setError(error instanceof Error ? error.message : t.teammodal132);
    } finally {
      setLoading(false);
    }
  };

  if (!visible) return null;

  // const projectOptions = [
  //   { label: t.teammodal146, value: 0 },
  //   ...projects.map(project => ({
  //     label: project.name,
  //     value: project.id
  //   }))
  // ];

  return (
    <Dialog
      header={team ? t.teammanagementpanel394 : t.teammodal155}
      visible={visible}
      onHide={onHide}
      style={{ width: '500px' }}
      modal
      className="p-fluid"
    >
      <form onSubmit={handleSubmit}>
        <div className="flex flex-col gap-4">
          {error && (
            <Message severity="error" text={error} />
          )}

          <div className="field">
            <label htmlFor="name" className="block text-sm font-medium mb-2 text-gray-100">
              Team Name *
            </label>
            <InputText
              id="name"
              value={formData.name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="gen_team_96"
              required
              className={nameError ? 'p-invalid' : ''}
            />
            <small className="text-gray-400 text-xs mt-1 block">
              Only lowercase letters (a-z), numbers (0-9), and underscores (_) allowed
            </small>
            {nameError && (
              <small className="text-red-400 text-xs mt-1 block">{nameError}</small>
            )}
          </div>

          <div className="field">
            <label htmlFor="description" className="block text-sm font-medium mb-2 text-gray-100">
              Description
            </label>
            <InputTextarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder={t.teammodal189}
              rows={3}
            />
          </div>

          <div className="field">
            <label htmlFor="project_ids" className="block text-sm font-medium mb-2 text-gray-100">
              Projects
            </label>
            <MultiSelect
              id="project_ids"
              value={formData.project_ids}
              options={projects.map(project => ({
                label: project.name,
                value: project.id
              }))}
              onChange={(e) => setFormData(prev => ({ ...prev, project_ids: e.value }))}
              placeholder={t.teammodal206}
              display="chip"
              className="w-full"
            />
            <small className="text-gray-600">
              Select one or more projects for this team
            </small>
          </div>

          <div className="field">
            <div className="flex items-center gap-2">
              <Checkbox
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.checked || false }))}
              />
              <label htmlFor="is_active" className="text-sm text-gray-100">
                Team is active
              </label>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-gray-600 mt-6">
          <Button
            type="button"
            label={t.applicationsmodal432}
            icon="pi pi-times"
            className="p-button-text"
            onClick={onHide}
            disabled={loading}
          />
          <Button
            type="submit"
            label={team ? 'Update' : t.teammodal240}
            icon={team ? 'pi pi-check' : 'pi pi-plus'}
            loading={loading}
          />
        </div>
      </form>

    </Dialog>
  );
}