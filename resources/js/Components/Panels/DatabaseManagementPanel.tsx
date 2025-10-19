import React, { useState, useEffect, useCallback } from 'react';
import { useProject } from '@/contexts/ProjectContext';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Tag } from 'primereact/tag';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { MultiSelect } from 'primereact/multiselect';
import { FileUpload } from 'primereact/fileupload';
import { Message } from 'primereact/message';

interface TabPanelProps {
  isActive: boolean;
  onOpenDesigner?: (schemaId: number, schemaName?: string) => void;
  filterByProject?: boolean;
  forceProjectId?: number;
  forceProjectName?: string;
  updateTabTitle?: (newTitle: string) => void;
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

export default function DatabaseManagementPanel({ isActive, onOpenDesigner, filterByProject = false, forceProjectId, forceProjectName, updateTabTitle }: TabPanelProps) {
  // Use Project Context to get current project
  const { selectedProject: contextSelectedProject } = useProject();
  // Use forceProjectId if provided (from TreeView), otherwise use context
  const projectId = forceProjectId || (filterByProject ? contextSelectedProject?.id : undefined);
  const [schemas, setSchemas] = useState<FloatingSchema[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  // Translation Export/Import
  const [languages, setLanguages] = useState<Array<{ code: string; name: string }>>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);

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
  const [selectedProjectForAssociation, setSelectedProjectForAssociation] = useState<number | null>(null);
  const [associationType, setAssociationType] = useState<'linked' | 'cloned' | 'imported'>('linked');
  const [alias, setAlias] = useState('');
  const [associating, setAssociating] = useState(false);

  // Delete schema modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingSchema, setDeletingSchema] = useState<FloatingSchema | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteInfo, setDeleteInfo] = useState<{
    projects_count: number;
    versions_count: number;
    tables_count: number;
    requires_force?: boolean;
  } | null>(null);

  // Copy schema modal
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [copyingSchema, setCopyingSchema] = useState<FloatingSchema | null>(null);
  const [copyName, setCopyName] = useState('');
  const [copying, setCopying] = useState(false);

  const loadSchemas = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const token = localStorage.getItem('access_token');
      if (!token) {
        setError('Not authenticated');
        return;
      }

      // Always load ALL schemas (no project filter)
      const url = '/api/schemas';
      const response = await fetch(url, {
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

    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error loading schemas');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load schemas when panel becomes active
  useEffect(() => {
    if (isActive) {
      loadSchemas();
      loadLanguages();
    }
  }, [isActive, loadSchemas]);

  // Update tab title with forceProjectName (when set from Quick Actions or tree view - fixed title with project name)
  useEffect(() => {
    if (filterByProject && updateTabTitle && forceProjectName) {
      updateTabTitle(`Database Management: ${forceProjectName}`);
    }
  }, [filterByProject, updateTabTitle, forceProjectName]);


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
    } catch {
      // Error loading projects
    }
  };

  const loadLanguages = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;

      const response = await fetch('/api/active-languages', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) return;

      const data = await response.json();
      setLanguages(data.languages || []);

      // Pre-select all languages by default
      setSelectedLanguages((data.languages || []).map((lang: any) => lang.code));
    } catch {
      // Error loading languages
    }
  };

  const handleExportTranslations = async () => {
    if (!contextSelectedProject || selectedLanguages.length === 0) {
      setError('Please select at least one language');
      return;
    }

    setExporting(true);
    setError('');

    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('Not authenticated');
      }

      const languagesParam = selectedLanguages.map(lang => `languages[]=${lang}`).join('&');
      const url = `/api/translations/export?project_id=${contextSelectedProject.id}&${languagesParam}`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to export translations');
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `translations_${contextSelectedProject.name}_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(a);

      setShowExportDialog(false);
      setSuccess('Translations exported successfully');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error exporting translations');
    } finally {
      setExporting(false);
    }
  };

  const handleImportTranslations = async (event: any) => {
    const file = event.files[0];
    if (!file || !contextSelectedProject) return;

    setImporting(true);
    setError('');

    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('Not authenticated');
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('project_id', contextSelectedProject.id.toString());

      const response = await fetch('/api/translations/import', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to import translations');
      }

      const result = await response.json();
      setShowImportDialog(false);
      setSuccess(`Successfully imported ${result.imported_count} translations (${result.updated_count} updated, ${result.created_count} created)`);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error importing translations');
    } finally {
      setImporting(false);
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

    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error creating schema');
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

    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error updating schema');
    } finally {
      setSaving(false);
    }
  };

  const handleAssociateToProject = (schema: FloatingSchema) => {
    setAssociatingSchema(schema);
    // If forceProjectId is set (from TreeView), use that; otherwise user selects
    setSelectedProjectForAssociation(forceProjectId || null);
    setAssociationType('linked');
    setAlias('');
    setShowAssociateModal(true);
    // Only load projects if we need the dropdown (no forceProjectId)
    if (!forceProjectId) {
      loadProjects();
    }
  };

  const handleConfirmAssociation = async () => {
    if (!associatingSchema || !selectedProjectForAssociation) return;

    setAssociating(true);
    setError('');

    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`/api/projects/${selectedProjectForAssociation}/schemas`, {
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

    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error associating schema');
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

    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error removing schema');
    }
  };

  const handleDeleteSchema = (schema: FloatingSchema) => {
    setDeletingSchema(schema);
    setDeleteConfirmText('');
    setDeleteInfo(null);
    setShowDeleteModal(true);
    setError('');
    setSuccess('');
  };

  const handleCopySchema = (schema: FloatingSchema) => {
    setCopyingSchema(schema);
    setCopyName(schema.name + ' (Copy)');
    setShowCopyModal(true);
    setError('');
    setSuccess('');
  };

  const handleConfirmCopy = async () => {
    if (!copyingSchema) return;

    setCopying(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`/api/template-db-schema/schemas/${copyingSchema.id}/copy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          name: copyName,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || result.message || 'Failed to copy schema');
      }

      setShowCopyModal(false);
      setCopyingSchema(null);
      await loadSchemas();
      setSuccess(`Schema "${copyingSchema.name}" copied successfully as "${copyName}"`);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error copying schema';
      setError(errorMessage);
    } finally {
      setCopying(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingSchema) return;

    // Require exact schema name confirmation
    if (deleteConfirmText !== deletingSchema.name) {
      setError('Schema name does not match. Please type the exact schema name to confirm deletion.');
      return;
    }

    setDeleting(true);
    setError('');

    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('Not authenticated');
      }

      // First attempt without force - to get deletion info
      let response = await fetch(`/api/schemas/${deletingSchema.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          force_delete: false
        }),
      });

      let result;
      try {
        result = await response.json();
      } catch {
        const textResult = await response.text();
        throw new Error(`Server returned invalid JSON. Status: ${response.status}, Text: ${textResult.substring(0, 200)}`);
      }

      // If requires force confirmation, show the details and ask for force delete
      if (!response.ok && result.requires_force) {
        setDeleteInfo({
          projects_count: result.projects_count,
          versions_count: result.versions_count,
          tables_count: result.tables_count,
          requires_force: true
        });

        // Now do the force delete
        response = await fetch(`/api/schemas/${deletingSchema.id}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          },
          body: JSON.stringify({
            force_delete: true
          }),
        });

        try {
          result = await response.json();
        } catch {
          const textResult = await response.text();
          throw new Error(`Server returned invalid JSON on force delete. Status: ${response.status}, Text: ${textResult.substring(0, 200)}`);
        }
      }

      if (!response.ok) {
        const errorMessage = result.message || `HTTP ${response.status}: ${response.statusText}`;
        throw new Error(errorMessage);
      }

      // Success!
      setShowDeleteModal(false);
      setDeletingSchema(null);
      setDeleteInfo(null);
      await loadSchemas();
      setSuccess(`Schema "${deletingSchema.name}" and all related data deleted successfully`);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error deleting schema';
      setError(errorMessage);
    } finally {
      setDeleting(false);
    }
  };

  const actionTemplate = (schema: FloatingSchema) => {
    const projects = schema.projects || [];

    // Check if current project (from forceProjectId or context) is linked to this schema
    const currentProjectId = projectId; // This is forceProjectId || contextSelectedProject?.id
    const isLinkedToCurrentProject = currentProjectId ? projects.some(p => p.id === currentProjectId) : false;
    const currentProjectLink = currentProjectId ? projects.find(p => p.id === currentProjectId) : null;

    return (
      <div className="flex space-x-1">
        {filterByProject && currentProjectId ? (
          // When filtering by project: Show X if linked, Link button if not linked
          isLinkedToCurrentProject && currentProjectLink ? (
            <button
              className="inline-flex items-center justify-center w-10 h-10 text-white bg-red-600 hover:bg-red-700 rounded-full text-base font-medium transition-colors duration-200 border border-red-600 hover:border-red-700 shadow-sm hover:shadow-md"
              title={`Remove from project`}
              onClick={() => handleRemoveFromProject(schema, currentProjectLink.id)}
            >
              <i className="pi pi-times text-base"></i>
            </button>
          ) : (
            <Button
              icon="pi pi-link"
              className="p-button-rounded p-button-text p-button-sm"
              tooltip="Link to project"
              onClick={() => handleAssociateToProject(schema)}
            />
          )
        ) : (
          // When NOT filtering by project: Show all project associations
          projects.length > 0 ? (
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
            <Button
              icon="pi pi-link"
              className="p-button-rounded p-button-text p-button-sm"
              tooltip="Associate to project"
              onClick={() => handleAssociateToProject(schema)}
            />
          )
        )}
        <Button
          icon="pi pi-pencil"
          className="p-button-rounded p-button-text p-button-sm"
          tooltip="Edit schema"
          onClick={() => handleEditSchema(schema)}
        />
        <Button
          icon="pi pi-copy"
          className="p-button-rounded p-button-text p-button-sm p-button-info"
          tooltip="Copy database"
          onClick={() => handleCopySchema(schema)}
        />
        {onOpenDesigner && (
          <Button
            icon="pi pi-sitemap"
            className="p-button-rounded p-button-text p-button-sm p-button-success"
            tooltip="Open in Designer"
            onClick={() => onOpenDesigner(schema.id, schema.name)}
          />
        )}
        <Button
          icon="pi pi-trash"
          className="p-button-rounded p-button-text p-button-sm p-button-danger"
          tooltip="Delete schema"
          onClick={() => handleDeleteSchema(schema)}
        />
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
      <Card title="My Database Schemas" className="flex-1 mb-4">
        <DataTable
          value={schemas}
          className="p-datatable-sm"
          emptyMessage="No database schemas found. Create your first schema to get started."
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 20]}
          scrollable
          scrollHeight="500px"
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

      {/* Translation Export/Import */}
      {contextSelectedProject && (
        <Card title="Translation Export/Import" className="mt-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <p className="text-sm text-gray-400 mb-2">
                Export schema translations for {contextSelectedProject.name} to Excel or import translations from translation agencies.
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                icon="pi pi-download"
                label="Export Translations"
                className="p-button-success"
                onClick={() => setShowExportDialog(true)}
                disabled={exporting || !contextSelectedProject}
              />
              <Button
                icon="pi pi-upload"
                label="Import Translations"
                className="p-button-info"
                onClick={() => setShowImportDialog(true)}
                disabled={importing || !contextSelectedProject}
              />
            </div>
          </div>
        </Card>
      )}

      {/* Create Schema Modal */}
      <Dialog
        header="Create New Database Schema"
        visible={showCreateModal}
        onHide={() => setShowCreateModal(false)}
        style={{ width: '450px' }}
        modal
        closable
        draggable={true}
        resizable={true}
        className="p-dialog-custom"
      >
        <div className="space-y-4">
          <div className="field">
            <label className="block text-sm font-medium text-gray-200 mb-2">
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
            <label className="block text-sm font-medium text-gray-200 mb-2">
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
            <label className="block text-sm font-medium text-gray-200 mb-2">
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
        draggable={true}
        resizable={true}
        className="p-dialog-custom"
      >
        <div className="space-y-4">
          <div className="field">
            <label className="block text-sm font-medium text-gray-200 mb-2">
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
            <label className="block text-sm font-medium text-gray-200 mb-2">
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
            <label className="block text-sm font-medium text-gray-200 mb-2">
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
        header="Link Schema to Project"
        visible={showAssociateModal}
        onHide={() => setShowAssociateModal(false)}
        style={{ width: '500px' }}
        modal
        closable
        draggable={true}
        resizable={true}
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

          {/* Only show project dropdown if no forceProjectId (not from TreeView) */}
          {!forceProjectId && (
            <div className="field">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Project *
              </label>
              <Dropdown
                value={selectedProjectForAssociation}
                onChange={(e) => setSelectedProjectForAssociation(e.value)}
                options={projects.map(p => ({ label: p.name, value: p.id }))}
                placeholder="Select a project"
                className="w-full"
                disabled={associating}
              />
            </div>
          )}

          {/* Show project name if forceProjectId is set */}
          {forceProjectId && forceProjectName && (
            <div className="p-3 bg-green-50 rounded border border-green-200">
              <label className="block text-sm font-medium text-green-800 mb-1">
                Link to Project:
              </label>
              <p className="text-base font-semibold text-green-900">
                {forceProjectName}
              </p>
            </div>
          )}

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
              label={associating ? "Linking..." : "Link Schema"}
              icon={associating ? "pi pi-spinner pi-spin" : "pi pi-link"}
              onClick={handleConfirmAssociation}
              disabled={associating || !selectedProjectForAssociation}
            />
          </div>
        </div>
      </Dialog>

      {/* Delete Schema Modal */}
      <Dialog
        header={`🗑️ Delete Schema: ${deletingSchema?.name}`}
        visible={showDeleteModal}
        onHide={() => setShowDeleteModal(false)}
        style={{ width: '500px' }}
        modal
        closable={!deleting}
        draggable={true}
        resizable={true}
        className="p-dialog-custom"
      >
        <div className="space-y-4">
          <div className="p-4 bg-red-50 border border-red-200 rounded">
            <div className="flex items-center mb-2">
              <i className="pi pi-exclamation-triangle text-red-600 mr-2"></i>
              <h4 className="font-bold text-red-800">⚠️ Permanent Deletion Warning</h4>
            </div>
            <p className="text-red-700 text-sm mb-3">
              This action will permanently delete the schema and <strong>ALL</strong> related data:
            </p>

            {deleteInfo && (
              <ul className="text-red-700 text-sm space-y-1 mb-3">
                <li>🗂️ <strong>{deleteInfo.versions_count}</strong> schema versions</li>
                <li>🏗️ <strong>{deleteInfo.tables_count}</strong> database tables</li>
                <li>🔗 <strong>{deleteInfo.projects_count}</strong> project associations</li>
                <li>🎨 All schema designer layouts</li>
                <li>⚙️ All constraints and relationships</li>
              </ul>
            )}

            <p className="text-red-800 font-medium text-sm">
              💀 This action <u>cannot be undone</u>!
            </p>
          </div>

          <div className="field">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type the schema name <strong>"{deletingSchema?.name}"</strong> to confirm deletion:
            </label>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder={`Type "${deletingSchema?.name}" here`}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
              disabled={deleting}
              autoComplete="off"
            />
            <small className="text-gray-600">
              Schema name must match exactly (case-sensitive)
            </small>
          </div>

          {error && (
            <div className="p-3 bg-red-100 border border-red-400 rounded text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              label="Cancel"
              icon="pi pi-times"
              onClick={() => setShowDeleteModal(false)}
              className="p-button-text"
              disabled={deleting}
            />
            <Button
              label={deleting ? "Deleting..." : "🗑️ Delete Forever"}
              icon={deleting ? "pi pi-spinner pi-spin" : "pi pi-trash"}
              onClick={handleConfirmDelete}
              className="p-button-danger"
              disabled={deleting || deleteConfirmText !== deletingSchema?.name}
            />
          </div>
        </div>
      </Dialog>

      {/* Export Translations Dialog */}
      <Dialog
        header="Export Translations to Excel"
        visible={showExportDialog}
        onHide={() => setShowExportDialog(false)}
        style={{ width: '500px' }}
        modal
        closable
        draggable={true}
        resizable={true}
        className="p-dialog-custom"
      >
        <div className="space-y-4">
          <div className="p-3 bg-blue-50 rounded border border-blue-200">
            <h4 className="font-medium text-blue-800 mb-1">
              Export for {contextSelectedProject?.name}
            </h4>
            <p className="text-sm text-blue-600">
              Select languages to include in the Excel export. The export will contain all tables and fields from linked databases.
            </p>
          </div>

          <div className="field">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Languages *
            </label>
            <MultiSelect
              value={selectedLanguages}
              onChange={(e) => setSelectedLanguages(e.value)}
              options={languages.map(lang => ({ label: `${lang.name} (${lang.code.toUpperCase()})`, value: lang.code }))}
              placeholder="Select languages to export"
              className="w-full"
              disabled={exporting}
              display="chip"
            />
            <small className="text-gray-600">
              Select one or more languages for the translation export
            </small>
          </div>

          {error && (
            <Message severity="error" text={error} />
          )}

          <div className="flex justify-end space-x-2 pt-4 gap-2">
            <Button
              label="Cancel"
              icon="pi pi-times"
              onClick={() => setShowExportDialog(false)}
              className="p-button-text"
              disabled={exporting}
            />
            <Button
              label={exporting ? "Exporting..." : "Export to Excel"}
              icon={exporting ? "pi pi-spinner pi-spin" : "pi pi-download"}
              onClick={handleExportTranslations}
              disabled={exporting || selectedLanguages.length === 0}
              className="p-button-success"
            />
          </div>
        </div>
      </Dialog>

      {/* Import Translations Dialog */}
      <Dialog
        header="Import Translations from Excel"
        visible={showImportDialog}
        onHide={() => setShowImportDialog(false)}
        style={{ width: '500px' }}
        modal
        closable
        draggable={true}
        resizable={true}
        className="p-dialog-custom"
      >
        <div className="space-y-4">
          <div className="p-3 bg-green-50 rounded border border-green-200">
            <h4 className="font-medium text-green-800 mb-1">
              Import for {contextSelectedProject?.name}
            </h4>
            <p className="text-sm text-green-600">
              Upload an Excel file with translations. The file must follow the export format.
            </p>
          </div>

          <div className="field">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Excel File *
            </label>
            <FileUpload
              mode="basic"
              name="file"
              accept=".xlsx,.xls"
              maxFileSize={10000000}
              customUpload
              uploadHandler={handleImportTranslations}
              auto={false}
              chooseLabel="Choose Excel File"
              disabled={importing}
            />
            <small className="text-gray-600">
              Excel files only (.xlsx, .xls), max 10MB
            </small>
          </div>

          {error && (
            <Message severity="error" text={error} />
          )}

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              label="Cancel"
              icon="pi pi-times"
              onClick={() => setShowImportDialog(false)}
              className="p-button-text"
              disabled={importing}
            />
          </div>
        </div>
      </Dialog>

      {/* Copy Schema Modal */}
      <Dialog
        header="Copy Database Schema"
        visible={showCopyModal}
        onHide={() => setShowCopyModal(false)}
        style={{ width: '500px' }}
        modal
        closable
        draggable={true}
        resizable={true}
        className="p-dialog-custom"
      >
        <div className="space-y-4">
          <div className="p-3 bg-blue-700 rounded border border-blue-500">
            <h4 className="font-medium text-white mb-1">
              Copy: {copyingSchema?.name}
            </h4>
            <p className="text-sm text-blue-100">
              This will create a complete copy of the database schema including all tables, fields, constraints, and designer layouts. The copy will be set to version 1.
            </p>
          </div>

          <div className="field">
            <label className="block text-sm font-medium text-gray-200 mb-2">
              New Schema Name *
            </label>
            <InputText
              value={copyName}
              onChange={(e) => setCopyName(e.target.value)}
              placeholder="Enter name for the copied schema"
              className="w-full"
              disabled={copying}
              required
            />
            <small className="text-gray-500">
              Choose a unique name for the copied schema
            </small>
          </div>

          {error && (
            <div className="p-3 bg-red-700 border border-red-500 rounded text-red-100 text-sm">
              {error}
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-4 gap-2">
            <Button
              label="Cancel"
              icon="pi pi-times"
              onClick={() => setShowCopyModal(false)}
              className="p-button-text"
              disabled={copying}
            />
            <Button
              label={copying ? "Copying..." : "Copy Database"}
              icon={copying ? "pi pi-spinner pi-spin" : "pi pi-copy"}
              onClick={handleConfirmCopy}
              disabled={copying || !copyName.trim()}
              className="p-button-info"
            />
          </div>
        </div>
      </Dialog>
    </div>
  );
}