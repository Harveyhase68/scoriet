import React, { useState, useEffect } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dropdown } from 'primereact/dropdown';
import { Checkbox } from 'primereact/checkbox';
import { Message } from 'primereact/message';
import { useProject } from '@/contexts/ProjectContext';

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
  project_name: string;
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
  const { projects } = useProject();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    project_name: 'default',
    is_active: true
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Dark theme modal styles
  useEffect(() => {
    if (visible) {
      const style = document.createElement('style');
      style.id = 'team-modal-dark-theme';
      style.textContent = `
        .p-dialog .p-dialog-header {
          background: #1f2937 !important;
          border-bottom: 1px solid #374151 !important;
        }
        .p-dialog .p-dialog-content {
          background: #1f2937 !important;
          color: #f3f4f6 !important;
        }
        .p-dialog .p-dialog-footer {
          background: #1f2937 !important;
          border-top: 1px solid #374151 !important;
        }
        .p-dialog .p-dialog-header .p-dialog-title {
          color: #f3f4f6 !important;
        }
        .p-dialog .p-dialog-header .p-dialog-header-icon {
          color: #9ca3af !important;
        }
        .p-dialog .p-dialog-header .p-dialog-header-icon:hover {
          color: #f3f4f6 !important;
          background: #374151 !important;
        }
        .p-inputtext, .p-inputtextarea, .p-dropdown {
          background: #374151 !important;
          border: 1px solid #4b5563 !important;
          color: #f3f4f6 !important;
        }
        .p-inputtext:focus, .p-inputtextarea:focus, .p-dropdown:focus {
          border-color: #3b82f6 !important;
          box-shadow: 0 0 0 0.2rem rgba(59, 130, 246, 0.2) !important;
        }
        .p-dropdown-label {
          color: #f3f4f6 !important;
        }
        .p-dropdown-panel {
          background: #374151 !important;
          border: 1px solid #4b5563 !important;
        }
        .p-dropdown-item {
          color: #f3f4f6 !important;
        }
        .p-dropdown-item:hover {
          background: #4b5563 !important;
        }
      `;
      document.head.appendChild(style);

      return () => {
        const existingStyle = document.getElementById('team-modal-dark-theme');
        if (existingStyle) {
          existingStyle.remove();
        }
      };
    }
  }, [visible]);

  useEffect(() => {
    if (visible && team) {
      setFormData({
        name: team.name,
        description: team.description || '',
        project_name: team.project_name || 'default',
        is_active: team.is_active
      });
    } else if (visible && !team) {
      setFormData({
        name: '',
        description: '',
        project_name: 'default',
        is_active: true
      });
    }
    setError('');
  }, [visible, team]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Team name is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (!token) {
        throw new Error('Not authenticated');
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
        
        throw new Error(errorData.message || 'Failed to save team');
      }

      onSave();
    } catch (error) {
      console.error('Error saving team:', error);
      setError(error instanceof Error ? error.message : 'Failed to save team');
    } finally {
      setLoading(false);
    }
  };

  if (!visible) return null;

  const projectOptions = [
    { label: 'Default', value: 'default' },
    ...projects.map(project => ({
      label: project.name,
      value: project.name
    }))
  ];

  return (
    <Dialog
      header={team ? 'Edit Team' : 'Create New Team'}
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
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter team name"
              required
            />
          </div>

          <div className="field">
            <label htmlFor="description" className="block text-sm font-medium mb-2 text-gray-100">
              Description
            </label>
            <InputTextarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Enter team description (optional)"
              rows={3}
            />
          </div>

          <div className="field">
            <label htmlFor="project_name" className="block text-sm font-medium mb-2 text-gray-100">
              Project
            </label>
            <Dropdown
              id="project_name"
              value={formData.project_name}
              options={projectOptions}
              onChange={(e) => setFormData(prev => ({ ...prev, project_name: e.value }))}
              placeholder="Select project"
            />
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
            label="Cancel"
            icon="pi pi-times"
            className="p-button-text"
            onClick={onHide}
            disabled={loading}
          />
          <Button
            type="submit"
            label={team ? 'Update' : 'Create'}
            icon={team ? 'pi pi-check' : 'pi pi-plus'}
            loading={loading}
          />
        </div>
      </form>
    </Dialog>
  );
}