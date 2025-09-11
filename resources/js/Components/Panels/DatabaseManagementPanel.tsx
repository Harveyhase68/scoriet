import React, { useState, useEffect } from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Message } from 'primereact/message';
import { Tag } from 'primereact/tag';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';

interface TabPanelProps {
  isActive: boolean;
  onOpenDesigner?: (schemaId: number, schemaName?: string) => void;
}

interface FloatingSchema {
  id: number;
  name: string;
  description?: string;
  owner_id: number;
  visibility: 'public' | 'private';
  is_template_schema: boolean;
  owner: {
    id: number;
    name: string;
    email: string;
    username?: string;
  };
  created_at: string;
  updated_at: string;
  tables_count?: number;
  projects_count?: number;
  projects?: Array<{
    id: number;
    name: string;
    association_type: 'linked' | 'cloned' | 'imported';
    alias?: string;
  }>;
}

interface Project {
  id: number;
  name: string;
  description?: string;
  owner: {
    id: number;
    name: string;
  };
}

export default function DatabaseManagementPanel({ isActive, onOpenDesigner }: TabPanelProps) {
  const [schemas, setSchemas] = useState<FloatingSchema[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  // Create schema modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    description: '',
    visibility: 'private' as 'public' | 'private'
  });
  const [creating, setCreating] = useState(false);

  // Edit schema modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSchema, setEditingSchema] = useState<FloatingSchema | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    visibility: 'private' as 'public' | 'private'
  });

  // Associate to project modal
  const [showAssociateModal, setShowAssociateModal] = useState(false);
  const [associatingSchema, setAssociatingSchema] = useState<FloatingSchema | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [associationType, setAssociationType] = useState<'linked' | 'cloned' | 'imported'>('linked');
  const [alias, setAlias] = useState('');
  const [associating, setAssociating] = useState(false);

  // Load schemas when panel becomes active
  useEffect(() => {
    if (isActive) {
      loadSchemas();
    }
  }, [isActive]);

  const loadSchemas = async () => {
    try {
      setLoading(true);
      setError('');
      
      const token = localStorage.getItem('access_token');
      if (!token) {
        setError('Not authenticated');
        return;
      }

      const response = await fetch('/api/schemas', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load schemas');
      }

      const data = await response.json();
      setSchemas(data.schemas || []);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading schemas');
    } finally {
      setLoading(false);
    }
  };

  const loadProjects = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;

      const response = await fetch('/api/projects', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) return;

      const data = await response.json();
      setProjects(data.projects || []);
    } catch (err) {
      console.error('Error loading projects:', err);
    }
  };

  const handleCreateSchema = async () => {
    setCreating(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch('/api/schemas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
        body: JSON.stringify(createForm),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create schema');
      }

      await loadSchemas();
      setShowCreateModal(false);
      setCreateForm({ name: '', description: '', visibility: 'private' });
      setSuccess('Database schema created successfully');

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error creating schema');
    } finally {
      setCreating(false);
    }
  };

  const handleEditSchema = (schema: FloatingSchema) => {
    setEditingSchema(schema);
    setEditForm({
      name: schema.name,
      description: schema.description || '',
      visibility: schema.visibility
    });
    setShowEditModal(true);
    setError('');
    setSuccess('');
  };

  const handleUpdateSchema = async () => {
    if (!editingSchema) return;
    
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`/api/schemas/${editingSchema.id}`, {
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
        throw new Error(errorData.message || 'Failed to update schema');
      }

      await loadSchemas();
      setShowEditModal(false);
      setEditingSchema(null);
      setSuccess('Schema updated successfully');

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error updating schema');
    } finally {
      setSaving(false);
    }
  };

  const handleAssociateToProject = (schema: FloatingSchema) => {
    setAssociatingSchema(schema);
    setSelectedProject(null);
    setAssociationType('linked');
    setAlias('');
    setShowAssociateModal(true);
    loadProjects();
  };

  const handleConfirmAssociation = async () => {
    if (!associatingSchema || !selectedProject) return;

    setAssociating(true);
    setError('');

    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`/api/projects/${selectedProject}/schemas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          schema_id: associatingSchema.id,
          association_type: associationType,
          alias: alias || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to associate schema');
      }

      setShowAssociateModal(false);
      setAssociatingSchema(null);
      await loadSchemas(); // Reload schemas to update the UI
      setSuccess(`Schema successfully ${associationType} to project`);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error associating schema');
    } finally {
      setAssociating(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const visibilityTemplate = (schema: FloatingSchema) => {
    return (
      <Tag 
        value={schema.visibility} 
        severity={schema.visibility === 'public' ? 'success' : 'warning'}
      />
    );
  };

  const ownerTemplate = (schema: FloatingSchema) => {
    return (
      <div className="flex items-center space-x-2">
        <i className="pi pi-user text-blue-500"></i>
        <span>{schema.owner.name}</span>
      </div>
    );
  };

  const projectsTemplate = (schema: FloatingSchema) => {
    const projects = schema.projects || [];
    
    if (projects.length === 0) {
      return <span className="text-gray-500 text-sm">Not assigned</span>;
    }

    return (
      <div className="space-y-1">
        {projects.map((project) => (
          <div key={project.id} className="flex items-center space-x-2">
            <Tag 
              value={project.association_type} 
              severity={
                project.association_type === 'linked' ? 'info' : 
                project.association_type === 'cloned' ? 'success' : 'warning'
              }
              className="text-xs"
            />
            <span className="text-sm font-medium">{project.name}</span>
            {project.alias && (
              <span className="text-xs text-gray-500">({project.alias})</span>
            )}
          </div>
        ))}
      </div>
    );
  };

  const handleRemoveFromProject = async (schema: FloatingSchema, projectId: number) => {
    try {
      setError('');
      
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`/api/projects/${projectId}/schemas/${schema.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to remove schema from project');
      }

      await loadSchemas();
      setSuccess(`Schema removed from project successfully`);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error removing schema');
    }
  };

  const actionTemplate = (schema: FloatingSchema) => {
    const projects = schema.projects || [];
    const hasProjects = projects.length > 0;

    return (
      <div className="flex space-x-1">
        {hasProjects ? (
          // Show remove buttons for each project association
          projects.map((project) => (
            <button
              key={project.id}
              className="inline-flex items-center justify-center w-10 h-10 text-white bg-red-600 hover:bg-red-700 rounded-full text-base font-medium transition-colors duration-200 border border-red-600 hover:border-red-700 shadow-sm hover:shadow-md"
              title={`Remove from ${project.name}`}
              onClick={() => handleRemoveFromProject(schema, project.id)}
            >
              <i className="pi pi-times text-base"></i>
            </button>
          ))
        ) : (
          // Show associate button only if no projects
          <Button
            icon="pi pi-link"
            className="p-button-rounded p-button-text p-button-sm"
            tooltip="Associate to project"
            onClick={() => handleAssociateToProject(schema)}
          />
        )}
        <Button
          icon="pi pi-pencil"
          className="p-button-rounded p-button-text p-button-sm"
          tooltip="Edit schema"
          onClick={() => handleEditSchema(schema)}
        />
        {onOpenDesigner && (
          <Button
            icon="pi pi-sitemap"
            className="p-button-rounded p-button-text p-button-sm p-button-success"
            tooltip="Open in Designer"
            onClick={() => onOpenDesigner(schema.id, schema.name)}
          />
        )}
      </div>
    );
  };

  const visibilityOptions = [
    { label: 'Private', value: 'private' },
    { label: 'Public', value: 'public' }
  ];

  const associationTypeOptions = [
    { label: 'Linked (Read-only reference)', value: 'linked' },
    { label: 'Cloned (Private copy)', value: 'cloned' },
    { label: 'Imported (Merge into existing)', value: 'imported' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <i className="pi pi-spinner pi-spin text-4xl text-blue-500 mb-4"></i>
          <p className="text-gray-600">Loading database schemas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full p-6 bg-gray-900 text-white">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <i className="pi pi-database text-2xl text-blue-600"></i>
          <h1 className="text-2xl font-bold text-white">Database Management</h1>
        </div>
        <div className="flex space-x-2 gap-2">
          <Button
            icon="pi pi-plus"
            label="New Database"
            className="p-button-text"
            style={{ borderRadius: '8px', paddingTop: '6px', paddingBottom: '6px' }}
            onClick={() => setShowCreateModal(true)}
            disabled={loading}
          />
          <Button
            icon="pi pi-refresh"
            label="Refresh"
            className="p-button-text"
            style={{ borderRadius: '8px', paddingTop: '6px', paddingBottom: '6px' }}
            onClick={loadSchemas}
            disabled={loading}
          />
        </div>
      </div>

      {error && (
        <Message severity="error" text={error} className="mb-4" />
      )}

      {success && (
        <Message severity="success" text={success} className="mb-4" />
      )}

      {/* Schemas Table */}
      <Card title="My Database Schemas" className="flex-1">
        <DataTable
          value={schemas}
          className="p-datatable-sm"
          emptyMessage="No database schemas found. Create your first schema to get started."
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 20]}
        >
          <Column field="name" header="Schema Name" sortable />
          <Column field="description" header="Description" />
          <Column 
            header="Assigned Projects" 
            body={projectsTemplate}
            className="w-60"
          />
          <Column 
            field="visibility" 
            header="Visibility" 
            body={visibilityTemplate}
            className="w-24"
          />
          <Column 
            field="owner" 
            header="Owner" 
            body={ownerTemplate}
            className="w-40"
          />
          <Column 
            field="created_at" 
            header="Created" 
            body={(schema) => formatDate(schema.created_at)}
            className="w-32"
            sortable
          />
          <Column 
            header="Actions" 
            body={actionTemplate}
            className="w-40"
          />
        </DataTable>
      </Card>

      {/* Create Schema Modal */}
      <Dialog
        header="Create New Database Schema"
        visible={showCreateModal}
        onHide={() => setShowCreateModal(false)}
        style={{ width: '450px' }}
        modal
        closable
        draggable={false}
        resizable={false}
        className="p-dialog-custom"
      >
        <div className="space-y-4">
          <div className="field">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Schema Name *
            </label>
            <InputText
              value={createForm.name}
              onChange={(e) => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter schema name"
              className="w-full"
              disabled={creating}
              required
            />
          </div>

          <div className="field">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <InputTextarea
              value={createForm.description}
              onChange={(e) => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Enter schema description (optional)"
              className="w-full"
              rows={3}
              disabled={creating}
            />
          </div>

          <div className="field">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Visibility
            </label>
            <Dropdown
              value={createForm.visibility}
              onChange={(e) => setCreateForm(prev => ({ ...prev, visibility: e.value }))}
              options={visibilityOptions}
              placeholder="Select visibility"
              className="w-full"
              disabled={creating}
            />
            <small className="text-gray-500">
              Public schemas can be linked by other users. Private schemas are only visible to you.
            </small>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              label="Cancel"
              icon="pi pi-times"
              onClick={() => setShowCreateModal(false)}
              className="p-button-text"
              disabled={creating}
            />
            <Button
              label={creating ? "Creating..." : "Create Schema"}
              icon={creating ? "pi pi-spinner pi-spin" : "pi pi-plus"}
              onClick={handleCreateSchema}
              disabled={creating || !createForm.name.trim()}
            />
          </div>
        </div>
      </Dialog>

      {/* Edit Schema Modal */}
      <Dialog
        header="Edit Database Schema"
        visible={showEditModal}
        onHide={() => setShowEditModal(false)}
        style={{ width: '450px' }}
        modal
        closable
        draggable={false}
        resizable={false}
        className="p-dialog-custom"
      >
        <div className="space-y-4">
          <div className="field">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Schema Name *
            </label>
            <InputText
              value={editForm.name}
              onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter schema name"
              className="w-full"
              disabled={saving}
              required
            />
          </div>

          <div className="field">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <InputTextarea
              value={editForm.description}
              onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Enter schema description (optional)"
              className="w-full"
              rows={3}
              disabled={saving}
            />
          </div>

          <div className="field">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Visibility
            </label>
            <Dropdown
              value={editForm.visibility}
              onChange={(e) => setEditForm(prev => ({ ...prev, visibility: e.value }))}
              options={visibilityOptions}
              placeholder="Select visibility"
              className="w-full"
              disabled={saving}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4 gap-2">
            <Button
              label="Cancel"
              icon="pi pi-times"
              onClick={() => setShowEditModal(false)}
              className="p-button-text"
              disabled={saving}
            />
            <Button
              label={saving ? "Updating..." : "Update Schema"}
              icon={saving ? "pi pi-spinner pi-spin" : "pi pi-check"}
              onClick={handleUpdateSchema}
              disabled={saving || !editForm.name.trim()}
            />
          </div>
        </div>
      </Dialog>

      {/* Associate to Project Modal */}
      <Dialog
        header="Associate Schema to Project"
        visible={showAssociateModal}
        onHide={() => setShowAssociateModal(false)}
        style={{ width: '500px' }}
        modal
        closable
        draggable={false}
        resizable={false}
        className="p-dialog-custom"
      >
        <div className="space-y-4">
          <div className="p-3 bg-blue-50 rounded border border-blue-200">
            <h4 className="font-medium text-blue-800 mb-1">
              {associatingSchema?.name}
            </h4>
            <p className="text-sm text-blue-600">
              {associatingSchema?.description || 'No description'}
            </p>
          </div>

          <div className="field">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Project *
            </label>
            <Dropdown
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.value)}
              options={projects.map(p => ({ label: p.name, value: p.id }))}
              placeholder="Select a project"
              className="w-full"
              disabled={associating}
            />
          </div>

          <div className="field">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Association Type
            </label>
            <Dropdown
              value={associationType}
              onChange={(e) => setAssociationType(e.value)}
              options={associationTypeOptions}
              className="w-full"
              disabled={associating}
            />
          </div>

          <div className="field">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Alias (optional)
            </label>
            <InputText
              value={alias}
              onChange={(e) => setAlias(e.target.value)}
              placeholder="Custom name for this schema in the project"
              className="w-full"
              disabled={associating}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              label="Cancel"
              icon="pi pi-times"
              onClick={() => setShowAssociateModal(false)}
              className="p-button-text"
              disabled={associating}
            />
            <Button
              label={associating ? "Associating..." : "Associate Schema"}
              icon={associating ? "pi pi-spinner pi-spin" : "pi pi-link"}
              onClick={handleConfirmAssociation}
              disabled={associating || !selectedProject}
            />
          </div>
        </div>
      </Dialog>
    </div>
  );
}