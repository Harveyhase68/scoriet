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
import { useTranslation, SupportedLanguage, getStoredLanguage } from '@/i18n';

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
  is_system_schema: boolean;
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
  // i18n setup
  const [currentLanguage] = React.useState<SupportedLanguage>(getStoredLanguage());
  const { t } = useTranslation(currentLanguage);

  // Use Project Context to get current project
  const { selectedProject: contextSelectedProject } = useProject();
  // Use forceProjectId if provided (from TreeView), otherwise use context
  const projectId = forceProjectId || (filterByProject ? contextSelectedProject?.id : undefined);

  // Get current user type for system schema checkbox
  const currentUserId = parseInt(localStorage.getItem('user_id') || '0');
  const userType = localStorage.getItem('user_type') || 'free';
  const isSystemUser = userType === 'system' || userType === 'admin';

  const [mySchemas, setMySchemas] = useState<FloatingSchema[]>([]);
  const [communitySchemas, setCommunitySchemas] = useState<FloatingSchema[]>([]);
  const [mySchemasLoading, setMySchemasLoading] = useState(true);
  const [communityLoading, setCommunityLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  // Filters for My Schemas
  const [myTypeFilter, setMyTypeFilter] = useState('all'); // 'all', 'private', 'public', 'system'
  const [mySearchTerm, setMySearchTerm] = useState('');

  // Filters for Community Schemas
  const [communityTypeFilter, setCommunityTypeFilter] = useState('all'); // 'all', 'system', 'public'
  const [communitySearchTerm, setCommunitySearchTerm] = useState('');

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
    visibility: 'private' as 'public' | 'private',
    is_system_schema: false
  });
  const [creating, setCreating] = useState(false);

  // Edit schema modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSchema, setEditingSchema] = useState<FloatingSchema | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    visibility: 'private' as 'public' | 'private',
    is_system_schema: false
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

  // Link schema to projects modal
  const [linkModalVisible, setLinkModalVisible] = useState(false);
  const [schemaToLink, setSchemaToLink] = useState<FloatingSchema | null>(null);
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [linkedProjectIds, setLinkedProjectIds] = useState<number[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);

  // Load user's own schemas (own, team, linked system/public schemas)
  const loadMySchemas = useCallback(async () => {
    try {
      setMySchemasLoading(true);
      setError('');

      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (!token) {
        setError(t.applicationsmodal66);
        return;
      }

      const response = await fetch('/api/schemas', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(t.databaseexportmodal71);
      }

      const data = await response.json();
      const allSchemas = data.schemas || [];

      // Filter: User's own schemas (owner) OR schemas linked to user's projects
      let filtered = allSchemas.filter((s: FloatingSchema) => {
        const isMySchema = String(s.owner_id) === String(currentUserId); // Explicit string conversion like PHP
        const isLinkedToMyProjects = (s.projects_count || 0) > 0;

        // Show if user owns it OR if it's linked to user's projects
        if (isMySchema || isLinkedToMyProjects) {
          // System users can see all, including system schemas
          if (isSystemUser) {
            return true;
          }
          // Normal users: Don't show system schemas they didn't create (unless linked)
          if (s.is_system_schema && !isMySchema && isLinkedToMyProjects) {
            return true; // Show linked system schemas
          }
          if (s.is_system_schema && !isMySchema) {
            return false; // Don't show non-linked system schemas
          }
          return true;
        }

        return false;
      });

      // Apply type filter (private/public/system)
      if (myTypeFilter !== 'all') {
        if (myTypeFilter === 'system') {
          filtered = filtered.filter((s: FloatingSchema) => s.is_system_schema);
        } else if (myTypeFilter === 'private') {
          filtered = filtered.filter((s: FloatingSchema) => !s.is_system_schema && s.visibility === 'private');
        } else if (myTypeFilter === 'public') {
          filtered = filtered.filter((s: FloatingSchema) => !s.is_system_schema && s.visibility === 'public');
        }
      }

      // Apply search
      if (mySearchTerm) {
        const search = mySearchTerm.toLowerCase();
        filtered = filtered.filter((s: FloatingSchema) =>
          s.name?.toLowerCase().includes(search) ||
          s.description?.toLowerCase().includes(search)
        );
      }

      setMySchemas(filtered);

    } catch (error) {
      setError(error instanceof Error ? error.message : t.databasemanagementpanel152);
    } finally {
      setMySchemasLoading(false);
    }
  }, [myTypeFilter, mySearchTerm, currentUserId, isSystemUser, t]);

  // Load community schemas (system + public from others)
  const loadCommunitySchemas = useCallback(async () => {
    try {
      setCommunityLoading(true);
      setError('');

      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (!token) {
        setError(t.applicationsmodal66);
        return;
      }

      const response = await fetch('/api/schemas', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(t.databaseexportmodal71);
      }

      const data = await response.json();
      const allSchemas = data.schemas || [];

      // Filter: System schemas OR public schemas (from anyone)
      let filtered = allSchemas.filter((s: FloatingSchema) => {
        // System schemas are ALWAYS shown
        if (s.is_system_schema) {
          return true;
        }

        // Public schemas from anyone
        if (s.visibility === 'public') {
          return true;
        }

        return false;
      });

      // Apply type filter
      if (communityTypeFilter === 'system') {
        filtered = filtered.filter((s: FloatingSchema) => s.is_system_schema);
      } else if (communityTypeFilter === 'public') {
        filtered = filtered.filter((s: FloatingSchema) => !s.is_system_schema && s.visibility === 'public');
      }

      // Apply search
      if (communitySearchTerm) {
        const search = communitySearchTerm.toLowerCase();
        filtered = filtered.filter((s: FloatingSchema) =>
          s.name?.toLowerCase().includes(search) ||
          s.description?.toLowerCase().includes(search)
        );
      }

      setCommunitySchemas(filtered);

    } catch (error) {
      setError(error instanceof Error ? error.message : t.databasemanagementpanel152);
    } finally {
      setCommunityLoading(false);
    }
  }, [communityTypeFilter, communitySearchTerm, t]);

  // Load schemas when panel becomes active
  useEffect(() => {
    if (isActive) {
      loadMySchemas();
      loadCommunitySchemas();
      loadLanguages();
    }
  }, [isActive, loadMySchemas, loadCommunitySchemas]);

  // Reload my schemas when filters change
  useEffect(() => {
    if (isActive) {
      loadMySchemas();
    }
  }, [myTypeFilter, mySearchTerm]);

  // Reload community schemas when filters change
  useEffect(() => {
    if (isActive) {
      loadCommunitySchemas();
    }
  }, [communityTypeFilter, communitySearchTerm]);

  // Update tab title with forceProjectName (when set from Quick Actions or tree view - fixed title with project name)
  useEffect(() => {
    if (filterByProject && updateTabTitle && forceProjectName) {
      updateTabTitle(`Database Management: ${forceProjectName}`);
    }
  }, [filterByProject, updateTabTitle, forceProjectName]);


  const loadProjects = async () => {
    try {
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
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
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
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
      setError(t.databasemanagementpanel221);
      return;
    }

    setExporting(true);
    setError('');

    try {
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (!token) {
        throw new Error(t.applicationsmodal66);
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
        throw new Error(t.databasemanagementpanel245);
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
      setSuccess(t.databasemanagementpanel259);
    } catch (error) {
      setError(error instanceof Error ? error.message : t.databasemanagementpanel261);
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
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (!token) {
        throw new Error(t.applicationsmodal66);
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
        throw new Error(errorData.message || t.databasemanagementpanel294);
      }

      const result = await response.json();
      setShowImportDialog(false);
      setSuccess(`Successfully imported ${result.imported_count} translations (${result.updated_count} updated, ${result.created_count} created)`);
    } catch (error) {
      setError(error instanceof Error ? error.message : t.databasemanagementpanel301);
    } finally {
      setImporting(false);
    }
  };

  const handleCreateSchema = async () => {
    setCreating(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (!token) {
        throw new Error(t.applicationsmodal66);
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
        throw new Error(errorData.message || t.databasemanagementpanel330);
      }

      await loadMySchemas();
      await loadCommunitySchemas();
      setShowCreateModal(false);
      setCreateForm({ name: '', description: '', visibility: 'private', is_system_schema: false });
      setSuccess(t.databasemanagementpanel336);

    } catch (error) {
      setError(error instanceof Error ? error.message : t.databasemanagementpanel339);
    } finally {
      setCreating(false);
    }
  };

  const handleEditSchema = (schema: FloatingSchema) => {
    setEditingSchema(schema);
    setEditForm({
      name: schema.name,
      description: schema.description || '',
      visibility: schema.visibility,
      is_system_schema: schema.is_system_schema
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
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (!token) {
        throw new Error(t.applicationsmodal66);
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
        throw new Error(errorData.message || t.databasemanagementpanel382);
      }

      await loadMySchemas();
      await loadCommunitySchemas();
      setShowEditModal(false);
      setEditingSchema(null);
      setSuccess(t.schemacontroller193);

    } catch (error) {
      setError(error instanceof Error ? error.message : t.databasemanagementpanel391);
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
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (!token) {
        throw new Error(t.applicationsmodal66);
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
        throw new Error(errorData.message || t.databasemanagementpanel438);
      }

      setShowAssociateModal(false);
      setAssociatingSchema(null);
      await loadMySchemas(); // Reload schemas to update the UI
      await loadCommunitySchemas();
      setSuccess(`Schema successfully ${associationType} to project`);

    } catch (error) {
      setError(error instanceof Error ? error.message : t.databasemanagementpanel447);
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
    // Show "System" badge for system schemas
    if (schema.is_system_schema) {
      return (
        <Tag
          value="System"
          severity="info"
        />
      );
    }

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

    // Build tooltip content with all project names
    const tooltipContent = projects.map(p => p.name).join('\n');

    return (
      <div title={tooltipContent}>
        <Tag
          icon="pi pi-link"
          value={`${projects.length} ${projects.length === 1 ? 'Project' : 'Projects'}`}
          severity="info"
          className="cursor-help"
        />
      </div>
    );
  };

  const handleRemoveFromProject = async (schema: FloatingSchema, projectId: number) => {
    try {
      setError('');

      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (!token) {
        throw new Error(t.applicationsmodal66);
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
        throw new Error(errorData.message || t.databasemanagementpanel529);
      }

      await loadMySchemas();
      await loadCommunitySchemas();
      setSuccess(`Schema removed from project successfully`);

    } catch (error) {
      setError(error instanceof Error ? error.message : t.databasemanagementpanel536);
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
    setCopyName(schema.name + t.dbschemacontroller288);
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
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (!token) {
        throw new Error(t.applicationsmodal66);
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
        throw new Error(result.error || result.message || t.databasemanagementpanel585);
      }

      setShowCopyModal(false);
      setCopyingSchema(null);
      await loadMySchemas();
      await loadCommunitySchemas();
      setSuccess(`Schema "${copyingSchema.name}" copied successfully as "${copyName}"`);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : t.databasemanagementpanel594;
      setError(errorMessage);
    } finally {
      setCopying(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingSchema) return;

    // Require DELETE confirmation
    if (deleteConfirmText !== 'DELETE') {
      setError('You must type DELETE to confirm deletion');
      return;
    }

    setDeleting(true);
    setError('');

    try {
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (!token) {
        throw new Error(t.applicationsmodal66);
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
      await loadMySchemas();
      await loadCommunitySchemas();
      setSuccess(`Schema "${deletingSchema.name}" and all related data deleted successfully`);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : t.databasemanagementpanel683;
      setError(errorMessage);
    } finally {
      setDeleting(false);
    }
  };

  // Link Modal Functions
  const handleOpenLinkModal = async (schema: FloatingSchema) => {
    setSchemaToLink(schema);
    setLoadingProjects(true);
    setLinkModalVisible(true);

    try {
      // Load all user's projects
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (!token) return;

      const response = await fetch('/api/projects', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load projects');
      }

      const data = await response.json();
      setAllProjects(data.projects || []);

      // Get currently linked project IDs from schema
      const linkedIds = schema.projects?.map(p => p.id) || [];
      setLinkedProjectIds(linkedIds);

    } catch (error) {
      console.error('Error loading projects:', error);
      setError('Fehler beim Laden der Projekte');
      setAllProjects([]);
      setLinkedProjectIds([]);
    } finally {
      setLoadingProjects(false);
    }
  };

  const handleToggleProjectLink = (projectId: number) => {
    if (linkedProjectIds.includes(projectId)) {
      setLinkedProjectIds(linkedProjectIds.filter(id => id !== projectId));
    } else {
      setLinkedProjectIds([...linkedProjectIds, projectId]);
    }
  };

  const handleApplyProjectLinks = async () => {
    if (!schemaToLink) return;

    try {
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (!token) return;

      const response = await fetch(`/api/schemas/${schemaToLink.id}/linked-projects`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ project_ids: linkedProjectIds }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Fehler beim Aktualisieren der Verknüpfungen');
      }

      setSuccess('Schema-Verknüpfungen erfolgreich aktualisiert');
      setLinkModalVisible(false);
      await loadMySchemas();
      await loadCommunitySchemas();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Fehler beim Aktualisieren der Verknüpfungen';
      setError(errorMessage);
    }
  };

  const actionTemplate = (schema: FloatingSchema) => {
    const projects = schema.projects || [];

    // Check if current project (from forceProjectId or context) is linked to this schema
    const currentProjectId = projectId; // This is forceProjectId || contextSelectedProject?.id
    const isLinkedToCurrentProject = currentProjectId ? projects.some(p => p.id === currentProjectId) : false;
    const currentProjectLink = currentProjectId ? projects.find(p => p.id === currentProjectId) : null;

    // Check ownership and permissions
    const isOwner = String(schema.owner_id) === String(currentUserId); // Explicit string conversion like PHP
    const isSystemSchema = schema.is_system_schema;
    const canEdit = isOwner || (isSystemUser && isSystemSchema); // Owner can edit, or System-User can edit System-Schemas
    const canDelete = isOwner; // Only owner can delete

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
              tooltip={t.databasemanagementpanel714}
              onClick={() => handleAssociateToProject(schema)}
            />
          )
        ) : (
          // When NOT filtering by project: Show multi-link button
          <>
            <Button
              icon="pi pi-link"
              className="p-button-rounded p-button-text p-button-sm p-button-success"
              tooltip="Mit Projekten verknüpfen"
              onClick={() => handleOpenLinkModal(schema)}
            />
          </>
        )}
        {canEdit && (
          <Button
            icon="pi pi-pencil"
            className="p-button-rounded p-button-text p-button-sm"
            tooltip={t.databasemanagementpanel743}
            onClick={() => handleEditSchema(schema)}
          />
        )}
        <Button
          icon="pi pi-copy"
          className="p-button-rounded p-button-text p-button-sm p-button-info"
          tooltip={t.databasemanagementpanel749}
          onClick={() => handleCopySchema(schema)}
        />
        {onOpenDesigner && (
          <Button
            icon="pi pi-sitemap"
            className="p-button-rounded p-button-text p-button-sm p-button-success"
            tooltip={t.databasemanagementpanel756}
            onClick={() => onOpenDesigner(schema.id, schema.name)}
          />
        )}
        {canDelete && (
          <Button
            icon="pi pi-trash"
            className="p-button-rounded p-button-text p-button-sm p-button-danger"
            tooltip={t.databasemanagementpanel763}
            onClick={() => handleDeleteSchema(schema)}
          />
        )}
      </div>
    );
  };

  const visibilityOptions = [
    { label: t.databasemanagementpanel771, value: 'private' },
    { label: t.databasemanagementpanel772, value: 'public' }
  ];

  const associationTypeOptions = [
    { label: t.databasemanagementpanel776, value: 'linked' },
    { label: t.databasemanagementpanel777, value: 'cloned' },
    { label: t.databasemanagementpanel778, value: 'imported' }
  ];

  // No global loading screen - show loading per table

  return (
    <div className="flex flex-col h-full bg-gray-900 text-white overflow-hidden">
      <div className="flex-shrink-0 p-6 pb-0">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <i className="pi pi-database text-2xl text-blue-600"></i>
          <h1 className="text-2xl font-bold text-white">{t.databasemanagementpanel798}</h1>
        </div>
        <div className="flex space-x-2 gap-2">
          <Button
            icon="pi pi-plus"
            label={t.databasemanagementpanel803}
            className="p-button-text"
            style={{ borderRadius: '8px', paddingTop: '6px', paddingBottom: '6px' }}
            onClick={() => setShowCreateModal(true)}
            disabled={mySchemasLoading || communityLoading}
          />
          <Button
            icon="pi pi-refresh"
            label={t.applicationsmodal313}
            className="p-button-text"
            style={{ borderRadius: '8px', paddingTop: '6px', paddingBottom: '6px' }}
            onClick={() => {
              loadMySchemas();
              loadCommunitySchemas();
            }}
            disabled={mySchemasLoading || communityLoading}
          />
        </div>
      </div>

        {error && (
          <Message severity="error" text={error} className="mb-4" />
        )}

        {success && (
          <Message severity="success" text={success} className="mb-4" />
        )}
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        {/* MY SCHEMAS TABLE */}
        <Card title="Meine Datenbanken" className="mb-4">
        <div className="flex justify-between items-center mb-4">
          <div className="flex gap-2">
            {/* Type Filter - show 'system' option only for system/admin users */}
            <Dropdown
              value={myTypeFilter}
              options={[
                { label: 'Alle', value: 'all' },
                { label: 'Private', value: 'private' },
                { label: 'Public', value: 'public' },
                ...(isSystemUser ? [{ label: 'System', value: 'system' }] : [])
              ]}
              onChange={(e) => setMyTypeFilter(e.value)}
              placeholder="Type"
              className="w-32"
            />
            <InputText
              value={mySearchTerm}
              onChange={(e) => setMySearchTerm(e.target.value)}
              placeholder="Suche..."
              className="w-64"
            />
          </div>
        </div>
        <DataTable
          value={mySchemas}
          loading={mySchemasLoading}
          className="p-datatable-sm"
          emptyMessage="Keine Schemas gefunden"
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 20, 50]}
        >
          <Column field="name" header={t.databasemanagementpanel840} sortable />
          <Column field="description" header={t.createteammodal103} />
          <Column
            header={t.databasemanagementpanel843}
            body={projectsTemplate}
            className="w-60"
          />
          <Column
            field={t.templatemanagementpanel961}
            header={t.databasemanagementpanel849}
            body={visibilityTemplate}
            className="w-24"
          />
          <Column
            field="owner"
            header={t.manageteammodal320}
            body={ownerTemplate}
            className="w-40"
          />
          <Column
            field="created_at"
            header={t.databasemanagementpanel861}
            body={(schema) => formatDate(schema.created_at)}
            className="w-32"
            sortable
          />
          <Column
            header={t.applicationsmodal354}
            body={actionTemplate}
            className="w-40"
          />
        </DataTable>
      </Card>

      {/* COMMUNITY SCHEMAS TABLE */}
      <Card title="System & Öffentliche Datenbanken" className="mb-4">
        <div className="flex justify-between items-center mb-4">
          <div className="flex gap-2">
            <Dropdown
              value={communityTypeFilter}
              options={[
                { label: 'Alle', value: 'all' },
                { label: 'System', value: 'system' },
                { label: 'Public', value: 'public' }
              ]}
              onChange={(e) => setCommunityTypeFilter(e.value)}
              placeholder="Type"
              className="w-32"
            />
            <InputText
              value={communitySearchTerm}
              onChange={(e) => setCommunitySearchTerm(e.target.value)}
              placeholder="Suche..."
              className="w-64"
            />
          </div>
        </div>
        <DataTable
          value={communitySchemas}
          loading={communityLoading}
          className="p-datatable-sm"
          emptyMessage="Keine Schemas gefunden"
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 20, 50]}
        >
          <Column field="name" header={t.databasemanagementpanel840} sortable />
          <Column field="description" header={t.createteammodal103} />
          <Column
            header={t.databasemanagementpanel843}
            body={projectsTemplate}
            className="w-60"
          />
          <Column
            field={t.templatemanagementpanel961}
            header={t.databasemanagementpanel849}
            body={visibilityTemplate}
            className="w-24"
          />
          <Column
            field="owner"
            header={t.manageteammodal320}
            body={ownerTemplate}
            className="w-40"
          />
          <Column
            field="created_at"
            header={t.databasemanagementpanel861}
            body={(schema) => formatDate(schema.created_at)}
            className="w-32"
            sortable
          />
          <Column
            header={t.applicationsmodal354}
            body={actionTemplate}
            className="w-40"
          />
        </DataTable>
      </Card>

      {/* Translation Export/Import */}
      {contextSelectedProject && (
        <Card title={t.databasemanagementpanel876} className="mt-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <p className="text-sm text-gray-400 mb-2">
                Export schema translations for {contextSelectedProject.name} to Excel or import translations from translation agencies.
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                icon="pi pi-download"
                label={t.databasemanagementpanel886}
                className="p-button-success"
                onClick={() => setShowExportDialog(true)}
                disabled={exporting || !contextSelectedProject}
              />
              <Button
                icon="pi pi-upload"
                label={t.databasemanagementpanel893}
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
        header={t.databasemanagementpanel905}
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
              placeholder={t.databasemanagementpanel923}
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
              placeholder={t.databasemanagementpanel937}
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
              placeholder={t.databasemanagementpanel952}
              className="w-full"
              disabled={creating}
            />
            <small className="text-gray-500">
              Public schemas can be linked by other users. Private schemas are only visible to you.
            </small>
          </div>

          {/* System Schema Checkbox - only for system/admin users */}
          {isSystemUser && (
            <div className="field flex items-center gap-2">
              <input
                type="checkbox"
                id="is_system_schema"
                checked={createForm.is_system_schema}
                onChange={(e) => setCreateForm(prev => ({ ...prev, is_system_schema: e.target.checked }))}
                className="w-4 h-4 cursor-pointer"
                disabled={creating}
              />
              <label htmlFor="is_system_schema" className="text-sm font-medium text-gray-200 cursor-pointer">
                Is System Database
              </label>
              <small className="text-gray-500 ml-2">
                (System databases are available to all users)
              </small>
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-4 gap-2">
            <Button
              label={t.applicationsmodal432}
              icon="pi pi-times"
              onClick={() => setShowCreateModal(false)}
              className="p-button-text"
              disabled={creating}
            />
            <Button
              label={creating ? t.createtablemodal614 : t.databasemanagementpanel970}
              icon={creating ? "pi pi-spinner pi-spin" : "pi pi-plus"}
              onClick={handleCreateSchema}
              disabled={creating || !createForm.name.trim()}
            />
          </div>
        </div>
      </Dialog>

      {/* Edit Schema Modal */}
      <Dialog
        header={t.databasemanagementpanel981}
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
              placeholder={t.databasemanagementpanel923}
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
              placeholder={t.databasemanagementpanel937}
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
              placeholder={t.databasemanagementpanel952}
              className="w-full"
              disabled={saving}
            />
          </div>

          {/* System Schema Checkbox - only for system/admin users */}
          {isSystemUser && (
            <div className="field flex items-center gap-2">
              <input
                type="checkbox"
                id="edit_is_system_schema"
                checked={editForm.is_system_schema}
                onChange={(e) => setEditForm(prev => ({ ...prev, is_system_schema: e.target.checked }))}
                className="w-4 h-4 cursor-pointer"
                disabled={saving}
              />
              <label htmlFor="edit_is_system_schema" className="text-sm font-medium text-gray-200 cursor-pointer">
                Is System Database
              </label>
              <small className="text-gray-500 ml-2">
                (System databases are available to all users)
              </small>
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-4 gap-2">
            <Button
              label={t.applicationsmodal432}
              icon="pi pi-times"
              onClick={() => setShowEditModal(false)}
              className="p-button-text"
              disabled={saving}
            />
            <Button
              label={saving ? t.updating : t.databasemanagementpanel1043}
              icon={saving ? "pi pi-spinner pi-spin" : "pi pi-check"}
              onClick={handleUpdateSchema}
              disabled={saving || !editForm.name.trim()}
            />
          </div>
        </div>
      </Dialog>

      {/* Associate to Project Modal */}
      <Dialog
        header={t.databasemanagementpanel1054}
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
              {associatingSchema?.description || t.schemaexportcontroller226}
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
                placeholder={t.databasemanagementpanel1084}
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
              placeholder={t.databasemanagementpanel1123}
              className="w-full"
              disabled={associating}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4 gap-2">
            <Button
              label={t.applicationsmodal432}
              icon="pi pi-times"
              onClick={() => setShowAssociateModal(false)}
              className="p-button-text"
              disabled={associating}
            />
            <Button
              label={associating ? "Linking..." : t.databasemanagementpanel1138}
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
              <h4 className="font-bold text-red-800">{t.databasemanagementpanel1163}</h4>
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
              Gib <strong>DELETE</strong> ein, um zu bestätigen:
            </label>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="DELETE"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
              disabled={deleting}
              autoComplete="off"
            />
            <small className="text-gray-600">
              Du musst exakt DELETE (Großbuchstaben) eingeben
            </small>
          </div>

          {error && (
            <div className="p-3 bg-red-100 border border-red-400 rounded text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-4 gap-2">
            <Button
              label={t.applicationsmodal432}
              icon="pi pi-times"
              onClick={() => setShowDeleteModal(false)}
              className="p-button-text"
              disabled={deleting}
            />
            <Button
              label={deleting ? t.deleting : t.databasemanagementpanel1217}
              icon={deleting ? "pi pi-spinner pi-spin" : "pi pi-trash"}
              onClick={handleConfirmDelete}
              className="p-button-danger"
              disabled={deleting || deleteConfirmText !== 'DELETE'}
            />
          </div>
        </div>
      </Dialog>

      {/* Export Translations Dialog */}
      <Dialog
        header={t.databasemanagementpanel1229}
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
              placeholder={t.databasemanagementpanel1257}
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
              label={t.applicationsmodal432}
              icon="pi pi-times"
              onClick={() => setShowExportDialog(false)}
              className="p-button-text"
              disabled={exporting}
            />
            <Button
              label={exporting ? "Exporting..." : t.databasemanagementpanel1280}
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
        header={t.databasemanagementpanel1292}
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
              chooseLabel={t.databasemanagementpanel1324}
              disabled={importing}
            />
            <small className="text-gray-600">
              Excel files only (.xlsx, .xls), max 10MB
            </small>
          </div>

          {error && (
            <Message severity="error" text={error} />
          )}

          <div className="flex justify-end space-x-2 pt-4 gap-2">
            <Button
              label={t.applicationsmodal432}
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
        header={t.databasemanagementpanel1350}
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
              placeholder={t.databasemanagementpanel1377}
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
              label={t.applicationsmodal432}
              icon="pi pi-times"
              onClick={() => setShowCopyModal(false)}
              className="p-button-text"
              disabled={copying}
            />
            <Button
              label={copying ? "Copying..." : t.databasemanagementpanel1402}
              icon={copying ? "pi pi-spinner pi-spin" : "pi pi-copy"}
              onClick={handleConfirmCopy}
              disabled={copying || !copyName.trim()}
              className="p-button-info"
            />
          </div>
        </div>
      </Dialog>

      {/* Link Schema to Projects Modal */}
      <Dialog
        header={`Schema verknüpfen: ${schemaToLink?.name}`}
        visible={linkModalVisible}
        onHide={() => setLinkModalVisible(false)}
        footer={
          <>
            <Button
              onClick={() => setLinkModalVisible(false)}
              className="p-button-secondary"
            >
              Abbrechen
            </Button>
            <Button
              onClick={handleApplyProjectLinks}
              className="p-button-primary"
              disabled={loadingProjects}
            >
              Anwenden
            </Button>
          </>
        }
        style={{ width: '600px' }}
        modal
        closable
        draggable={true}
        resizable={true}
      >
        {loadingProjects ? (
          <div className="flex justify-center items-center py-8">
            <i className="pi pi-spin pi-spinner text-4xl text-blue-500"></i>
          </div>
        ) : (
          <div className="space-y-2">
            {allProjects.length === 0 ? (
              <div className="text-center text-gray-500 py-4">
                Keine Projekte gefunden
              </div>
            ) : (
              allProjects.map((project) => (
                <div
                  key={project.id}
                  className="flex items-center justify-between p-3 border border-gray-600 rounded hover:bg-gray-700 cursor-pointer"
                  onClick={() => handleToggleProjectLink(project.id)}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <input
                      type="checkbox"
                      checked={linkedProjectIds.includes(project.id)}
                      onChange={() => handleToggleProjectLink(project.id)}
                      className="w-4 h-4 cursor-pointer"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div>
                      <div className="font-semibold text-white">{project.name}</div>
                      {project.description && (
                        <div className="text-sm text-gray-400">{project.description}</div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </Dialog>
      </div>
    </div>
  );
}