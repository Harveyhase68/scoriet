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
import { Checkbox } from 'primereact/checkbox';
import { Tree } from 'primereact/tree';
import ClassicTreeView from '@/Components/ClassicTreeView';
import JoinCodeModal from '@/Components/Modals/JoinCodeModal';
import ApplicationsModal from '@/Components/Modals/ApplicationsModal';
import ProjectInvitationsModal from '@/Components/Modals/ProjectInvitationsModal';
import ProjectMembersModal from '@/Components/Modals/ProjectMembersModal';
import { useProject } from '@/contexts/ProjectContext';

interface TabPanelProps {
  isActive: boolean;
  onOpenPanel?: (panelId: string, data?: any) => void;
}

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
}

export default function ProjectPanel({ isActive, onOpenPanel }: TabPanelProps) {
  // Use global project context
  const {
    projects: globalProjects,
    selectedProject: globalSelectedProject,
    setSelectedProject: setGlobalSelectedProject,
    loadProjects: loadProjectsFromContext,
    setPreferredProject,
    loading: contextLoading
  } = useProject();

  // Map to local project state for compatibility
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);

  // Keep track of original selected project for returning after edit
  const [originalSelectedProject, setOriginalSelectedProject] = useState<Project | null>(null);

  // All other state definitions first
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);

  // Sync with global project context
  useEffect(() => {
    setProjects(globalProjects);
    // Only update currentProject if we're not editing
    if (!isEditing) {
      setCurrentProject(globalSelectedProject);
    }
  }, [globalProjects, globalSelectedProject, isEditing]);
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    join_code: '',
    is_public: false,
    new_owner_id: null as number | null
  });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    description: '',
    is_public: true,
    allow_join_requests: false
  });
  const [creating, setCreating] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showJoinCodeModal, setShowJoinCodeModal] = useState(false);
  const [showApplicationsModal, setShowApplicationsModal] = useState(false);
  const [showInvitationsModal, setShowInvitationsModal] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [localSelectedProject, setLocalSelectedProject] = useState<Project | null>(null);
  const [showProjectOverviewModal, setShowProjectOverviewModal] = useState(false);
  const [selectedProjectForOverview, setSelectedProjectForOverview] = useState<Project | null>(null);
  const [projectTeamsTree, setProjectTeamsTree] = useState<any[]>([]);
  const [loadingTeamsData, setLoadingTeamsData] = useState(false);
  const [projectSchemasTree, setProjectSchemasTree] = useState<any[]>([]);
  const [loadingSchemasData, setLoadingSchemasData] = useState(false);
  const [projectTemplatesTree, setProjectTemplatesTree] = useState<any[]>([]);
  const [loadingTemplatesData, setLoadingTemplatesData] = useState(false);
  const [projectMembers, setProjectMembers] = useState<any[]>([]);
  const [loadingMembersData, setLoadingMembersData] = useState(false);

  // Load projects when panel becomes active (but not during editing to avoid conflicts)
  useEffect(() => {
    if (isActive && !isEditing) {
      loadProjectsFromContext();
    }
  }, [isActive, loadProjectsFromContext]);

  // Ensure currentProject is synced with globalSelectedProject when panel becomes active
  useEffect(() => {
    if (isActive && globalSelectedProject && !isEditing) {
      setCurrentProject(globalSelectedProject);
    }
  }, [isActive, globalSelectedProject, isEditing]);

  // Listen for notification bell click to open Applications Modal
  useEffect(() => {
    const handleOpenApplicationsModal = () => {
      console.log('📧 ProjectPanel: Received openApplicationsModalInPanel event, opening modal');
      setShowApplicationsModal(true);
    };

    window.addEventListener('openApplicationsModalInPanel', handleOpenApplicationsModal as EventListener);

    return () => {
      window.removeEventListener('openApplicationsModalInPanel', handleOpenApplicationsModal as EventListener);
    };
  }, []);


  const handleEdit = async (projectToEdit?: Project) => {
    const project = projectToEdit || currentProject;
    if (project) {
      setEditForm({
        name: project.name,
        description: project.description,
        join_code: project.join_code || '',
        is_public: project.is_public,
        new_owner_id: null
      });
      setIsEditing(true);
      setError('');
      setSuccess('');

      // Load project members for owner transfer
      await loadProjectMembers(project.id);
    }
  };

  const loadProjectMembers = async (projectId: number) => {
    setLoadingMembersData(true);
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`/api/projects/${projectId}/members`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setProjectMembers(data);
      }
    } catch (error) {
      console.error('Error loading project members:', error);
      setProjectMembers([]);
    } finally {
      setLoadingMembersData(false);
    }
  };

  const handleSave = async () => {
    if (!currentProject) return;

    // Confirm ownership transfer if requested
    if (editForm.new_owner_id) {
      const newOwner = projectMembers.find(member => member.user_id === editForm.new_owner_id);
      if (!confirm(`Are you sure you want to transfer ownership to ${newOwner?.user.name} (${newOwner?.user.email})?\n\nThis action cannot be undone and you will lose owner privileges!`)) {
        return;
      }
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`/api/projects/${currentProject.id}`, {
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
        throw new Error(errorData.message || 'Failed to update project');
      }

      const updatedProject = await response.json();
      console.log('🔧 Save: Updated project from API:', updatedProject);
      setCurrentProject(updatedProject);

      // Only update global context if we're editing the current global project
      // If we have originalSelectedProject, we'll return to that one instead
      if (!originalSelectedProject) {
        console.log('🔧 Save: Setting global project to updated project:', updatedProject);
        console.log('🔧 Save: Current globalSelectedProject before update:', globalSelectedProject);
        setGlobalSelectedProject(updatedProject);

        // Verify the structure is compatible
        console.log('🔧 Save: Updated project structure check:', {
          id: updatedProject.id,
          name: updatedProject.name,
          hasRequiredFields: !!(updatedProject.id && updatedProject.name)
        });
      } else {
        console.log('🔧 Save: Will return to original project, not updating global yet');
      }

      // Mark this as a recent update to prevent loadProjects from overriding it
      window.lastProjectUpdate = Date.now();

      // Debug: Check if global project was actually set
      setTimeout(() => {
        console.log('🔧 Save: Global project after timeout:', globalSelectedProject);
      }, 100);

      // If ownership was transferred, exit edit mode since user is no longer owner
      if (editForm.new_owner_id) {
        setIsEditing(false);
        setSuccess('Project ownership transferred successfully');
      } else {
        // Update the editForm with the new values
        setEditForm({
          name: updatedProject.name,
          description: updatedProject.description || '',
          join_code: updatedProject.join_code || '',
          is_public: updatedProject.is_public,
          new_owner_id: null
        });
        setSuccess('Project updated successfully');
      }
      
      // Update the projects array in state to reflect the changes in the table
      setProjects(prevProjects =>
        prevProjects.map(p =>
          p.id === updatedProject.id ? updatedProject : p
        )
      );

      setIsEditing(false);
      setSuccess('Project updated successfully');

      // Make sure global project stays updated even if external forces try to change it
      // But only if we're not returning to an original project
      if (!originalSelectedProject) {
        setTimeout(() => {
          if (globalSelectedProject?.id === updatedProject.id) {
            setGlobalSelectedProject(updatedProject);
          }
        }, 200);
      }

      // Return to the originally selected project after editing
      if (originalSelectedProject) {
        console.log('🔄 Save: Returning to original project:', originalSelectedProject);
        // Find the current version of the original project from the projects list
        const currentVersionOfOriginalProject = projects.find(p => p.id === originalSelectedProject.id);
        const projectToSelect = currentVersionOfOriginalProject || originalSelectedProject;
        console.log('🔄 Save: Project to select:', projectToSelect);

        setGlobalSelectedProject(projectToSelect);
        setCurrentProject(projectToSelect);
        setOriginalSelectedProject(null);
        console.log('🔄 Save: Set global and current project to original');
      } else {
        console.log('🔄 Save: No original project to return to');
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error updating project');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setError('');
    setSuccess('');

    // Return to the originally selected project after canceling edit
    if (originalSelectedProject) {
      // Find the current version of the original project from the projects list
      const currentVersionOfOriginalProject = projects.find(p => p.id === originalSelectedProject.id);
      const projectToSelect = currentVersionOfOriginalProject || originalSelectedProject;

      setGlobalSelectedProject(projectToSelect);
      setCurrentProject(projectToSelect);
      setOriginalSelectedProject(null);
    }
  };

  const handleCreateProject = async () => {
    setCreating(true);
    setError('');
    setSuccess('');

    // Frontend validation first
    const namePattern = /^[a-z0-9]+(_[a-z0-9]+)*$/;
    if (!namePattern.test(createForm.name)) {
      setError('Projektnamen dürfen nur Kleinbuchstaben (a-z), Zahlen (0-9) und Unterstriche (_) als Trennzeichen enthalten. Beispiel: mein_projekt_2024');
      setCreating(false);
      return;
    }

    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch('/api/projects', {
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
        
        // Handle Laravel validation errors
        if (errorData.errors && errorData.errors.name) {
          // Check if it's a regex validation error and provide better message
          const backendError = errorData.errors.name[0];
          if (backendError.includes('regex') || backendError.includes('format')) {
            throw new Error('Projektnamen dürfen nur Kleinbuchstaben (a-z), Zahlen (0-9) und Unterstriche (_) als Trennzeichen enthalten. Beispiel: mein_projekt_2024');
          }
          throw new Error(backendError);
        }

        throw new Error(errorData.message || 'Failed to create project');
      }

      const newProject = await response.json();

      // Remember if there was no project selected before (for auto-selection)
      const wasNoProjectSelected = !globalSelectedProject;

      // Set the new project as preferred if no project was selected before
      if (wasNoProjectSelected && newProject) {
        console.log('🎯 Setting newly created project as preferred for auto-selection:', newProject.name);
        setPreferredProject(newProject);
      }

      // Refresh the projects list (this will auto-select the preferred project)
      await loadProjectsFromContext();

      setShowCreateModal(false);
      setCreateForm({ name: '', description: '', is_public: true, allow_join_requests: false });
      setSuccess('Project created successfully');

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error creating project');
    } finally {
      setCreating(false);
    }
  };

  const handleCreateModalHide = () => {
    setShowCreateModal(false);
    setCreateForm({ name: '', description: '', is_public: true, allow_join_requests: false });
    setError(''); // Clear errors when modal closes
    setSuccess('');
  };

  const handleDeleteProject = async () => {
    if (!projectToDelete) return;

    setDeleting(true);
    setError('');

    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`/api/projects/${projectToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete project');
      }

      // Refresh the projects list
      await loadProjectsFromContext();

      setShowDeleteModal(false);
      setProjectToDelete(null);
      setSuccess('Project deleted successfully');

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error deleting project');
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteModalHide = () => {
    setShowDeleteModal(false);
    setProjectToDelete(null);
  };

  const confirmDelete = (project: Project) => {
    setProjectToDelete(project);
    setShowDeleteModal(true);
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

  // Load teams data for project overview
  const loadTeamsForProject = async (projectId: number) => {
    setLoadingTeamsData(true);
    try {
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`/api/teams?all=true`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load teams');
      }

      const data = await response.json();

      // Filter teams for this project and build tree structure
      const allTeams = [...(data.owned_teams || []), ...(data.member_teams || [])];
      const projectTeams = allTeams.filter(team => team.project_id === projectId);

      // Build tree structure for classic TreeView
      const treeData = projectTeams.map(team => ({
        id: `team-${team.id}`,
        name: `${team.name} (${team.members?.length || 0} members)`,
        type: 'team',
        children: team.members?.map((member: any) => ({
          id: `member-${team.id}-${member.id}`,
          name: `${member.user.name} (${member.role})`,
          type: 'member',
          memberRole: member.role
        })) || []
      }));

      setProjectTeamsTree(treeData);
    } catch (error) {
      console.error('Error loading teams:', error);
      setProjectTeamsTree([]);
    } finally {
      setLoadingTeamsData(false);
    }
  };

  const loadSchemasForProject = async (projectId: number) => {
    setLoadingSchemasData(true);
    try {
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`/api/projects/${projectId}/schemas`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load schemas');
      }

      const projectSchemas = await response.json();

      // Build tree structure for schemas (ClassicTreeView format)
      const treeData = projectSchemas.map((schema: any) => ({
        id: `schema-${schema.id}`,
        name: `${schema.name}${schema.version_number ? ` (v${schema.version_number})` : schema.version ? ` (v${schema.version})` : ''}`,
        type: 'schema',
        children: schema.tables?.map((table: any) => ({
          id: `table-${schema.id}-${table.id}`,
          name: `${table.name} (${table.field_count || table.fields?.length || 0} fields)`,
          type: 'table'
        })) || []
      }));

      setProjectSchemasTree(treeData);
    } catch (error) {
      console.error('Error loading schemas:', error);
      setProjectSchemasTree([]);
    } finally {
      setLoadingSchemasData(false);
    }
  };

  const loadTemplatesForProject = async (projectId: number) => {
    setLoadingTemplatesData(true);
    try {
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`/api/projects/${projectId}/template-usages`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to load templates: ${response.status}`);
      }

      const projectTemplates = await response.json();

      // Extract templates from usages array (API returns {usages: [], linked_count: 0, cloned_count: 0})
      const templatesArray = projectTemplates.usages || [];

      // Build tree structure for templates (ClassicTreeView format)
      // Note: API returns usage objects with nested template data
      const treeData = templatesArray.map((usage: any) => {
        const template = usage.template; // Extract nested template object
        return {
          id: `template-${template.id}`,
          name: `${template.name} (${template.category || 'template'})`,
          type: 'template',
          children: template.files?.map((file: any) => ({
            id: `file-${template.id}-${file.id}`,
            name: `${file.file_name} (${file.file_type})`,
            type: 'template_file'
          })) || []
        };
      });

      setProjectTemplatesTree(treeData);
    } catch (error) {
      console.error('Error loading templates:', error);
      setProjectTemplatesTree([]);
    } finally {
      setLoadingTemplatesData(false);
    }
  };

  const statusTemplate = () => {
    return <Tag value="Active" severity="success" />;
  };

  const dateTemplate = (project: Project) => {
    return formatDate(project.created_at);
  };

  const ownerTemplate = (project: Project) => {
    return (
      <div className="flex items-center space-x-2">
        <i className="pi pi-user text-blue-500"></i>
        <span>{project.owner.name}</span>
      </div>
    );
  };

  const actionTemplate = (project: Project) => {
    return (
      <div className="flex space-x-1">
        <Button
          icon="pi pi-eye"
          className="p-button-rounded p-button-sm"
          style={{ backgroundColor: '#1976d2', borderColor: '#1976d2', color: 'white' }}
          tooltip="Project Overview"
          onClick={() => {
            setSelectedProjectForOverview(project);
            setShowProjectOverviewModal(true);
            loadProjectMembers(project.id);
            loadTeamsForProject(project.id);
            loadSchemasForProject(project.id);
            loadTemplatesForProject(project.id);
          }}
        />
        <Button
          icon="pi pi-user"
          className="p-button-rounded p-button-text p-button-sm"
          tooltip="Manage members"
          onClick={() => {
            
            setLocalSelectedProject(project);
            setShowMembersModal(true);
          }}
        />
        <Button
          icon="pi pi-pencil"
          className="p-button-rounded p-button-text p-button-sm"
          tooltip="Edit project"
          onClick={() => {
            // Remember the currently selected project to return to after editing
            setOriginalSelectedProject(globalSelectedProject);
            // Set the project to edit
            setCurrentProject(project);
            setGlobalSelectedProject(project); // Temporarily update global context for header
            // Pass the project directly to avoid race condition
            handleEdit(project);
          }}
        />
        <Button
          icon="pi pi-trash"
          className="p-button-rounded p-button-text p-button-sm p-button-danger"
          tooltip="Delete project"
          onClick={() => confirmDelete(project)}
        />
      </div>
    );
  };

  if (contextLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <i className="pi pi-spinner pi-spin text-4xl text-blue-500 mb-4"></i>
          <p className="text-gray-600">Loading projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-900 text-white">
      {/* Header - Fixed at top */}
      <div className="flex-shrink-0 p-6 pb-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <i className="pi pi-briefcase text-2xl text-blue-600"></i>
            <div>
              <h1 className="text-2xl font-bold text-white">Project Management</h1>
              {currentProject && (
                <p className="text-sm text-gray-300">
                  Current: <span className="text-blue-400 font-medium">{currentProject.name}</span>
                </p>
              )}
            </div>
          </div>
          <div className="flex space-x-2 gap-2">
            <Button
              icon="pi pi-plus"
              label="New Project"
              className="p-button-text"
              style={{ borderRadius: '8px', paddingTop: '6px', paddingBottom: '6px' }}
              onClick={() => setShowCreateModal(true)}
              disabled={contextLoading}
            />
            <Button
              icon="pi pi-sign-in"
              label="Join Project"
              className="p-button-text"
              style={{ borderRadius: '8px', paddingTop: '6px', paddingBottom: '6px' }}
              onClick={() => setShowJoinCodeModal(true)}
              disabled={contextLoading}
            />
            <Button
              icon="pi pi-refresh"
              label="Refresh"
              className="p-button-text"
              style={{ borderRadius: '8px', paddingTop: '6px', paddingBottom: '6px' }}
              onClick={loadProjectsFromContext}
              disabled={contextLoading}
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

      {/* Scrollable content area */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-6 pb-6">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Current Project */}
        <div className="space-y-4">
          <Card
            title={
              <div className="flex items-center justify-between">
                <span className="flex items-center space-x-2">
                  <i className="pi pi-star-fill text-yellow-500"></i>
                  <span>Current Project</span>
                </span>
                {currentProject && !isEditing && (
                  <Button
                    icon="pi pi-pencil"
                    className="p-button-sm p-button-outlined"
                    onClick={() => handleEdit()}
                    tooltip="Edit project"
                  />
                )}
              </div>
            }
            className="h-fit"
          >
            {currentProject ? (
              <div className="space-y-4">
                {isEditing ? (
                  <div className="space-y-4">
                    <div className="field">
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Project Name
                      </label>
                      <InputText
                        value={editForm.name}
                        onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full font-mono"
                        placeholder="my_project_name"
                      />
                      <div className="text-xs text-gray-500 mt-1">
                        Projekt-Namen werden später für URLs verwendet (username/project_name)
                      </div>
                      <div className="text-xs text-orange-400 mt-1">
                        ✓ Erlaubt: Kleinbuchstaben, Zahlen, Unterstriche (z.B. my_project_123)
                      </div>
                    </div>
                    
                    <div className="field">
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Description
                      </label>
                      <InputTextarea
                        value={editForm.description}
                        onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                        className="w-full"
                        rows={3}
                        placeholder="Enter project description"
                      />
                    </div>

                    <div className="field">
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Join Code
                      </label>
                      <div className="flex gap-2">
                        <InputText
                          value={editForm.join_code}
                          onChange={(e) => setEditForm(prev => ({ ...prev, join_code: e.target.value }))}
                          className="flex-1"
                          placeholder="Enter join code (optional)"
                        />
                        <Button
                          icon="pi pi-refresh"
                          className="p-button-outlined"
                          onClick={() => setEditForm(prev => ({ ...prev, join_code: 'PROJ-' + Math.random().toString(36).substring(2, 10).toUpperCase() }))}
                          tooltip="Generate random join code"
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
                        <label htmlFor="edit-is-public" className="text-sm font-medium text-gray-300">
                          Public Project
                        </label>
                      </div>
                      <small className="text-gray-500">Make this project visible to all users</small>
                    </div>

                    {currentProject?.is_owner && (
                      <div className="field">
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                          Transfer Ownership
                        </label>
                        <select
                          value={editForm.new_owner_id || ''}
                          onChange={(e) => setEditForm(prev => ({ ...prev, new_owner_id: e.target.value ? parseInt(e.target.value) : null }))}
                          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                        >
                          <option value="">Keep current owner ({currentProject.owner.name})</option>
                          {projectMembers.filter(member => member.user_id !== currentProject.owner.id).map(member => (
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

                    <div className="flex space-x-2 pt-2">
                      <Button
                        label="Save"
                        icon={saving ? "pi pi-spinner pi-spin" : "pi pi-check"}
                        onClick={handleSave}
                        disabled={saving}
                        className="flex-1"
                      />
                      <Button
                        label="Cancel"
                        icon="pi pi-times"
                        onClick={handleCancel}
                        className="flex-1 p-button-secondary"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-1">
                        {currentProject.name}
                      </h3>
                      <p className="text-gray-300 text-sm">
                        {currentProject.description || 'No description provided'}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-300">Owner:</span>
                        <div className="flex items-center space-x-1 mt-1">
                          <i className="pi pi-user text-blue-400"></i>
                          <span className="text-gray-200">{currentProject.owner.name}</span>
                        </div>
                      </div>
                      
                      <div>
                        <span className="font-medium text-gray-300">Created:</span>
                        <div className="mt-1 text-gray-200">{formatDate(currentProject.created_at)}</div>
                      </div>
                    </div>

                    {/* Join Code Section */}
                    {currentProject.join_code && (
                      <div className="p-3 bg-gray-800 rounded-lg border border-gray-600">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-sm font-medium text-gray-300 mb-1">Join Code</div>
                            <div className="flex items-center space-x-2">
                              <code className="px-2 py-1 bg-gray-700 rounded text-blue-300 font-mono text-sm">
                                {currentProject.join_code}
                              </code>
                              <Button
                                icon="pi pi-copy"
                                className="p-button-rounded p-button-text p-button-sm"
                                tooltip="Copy join code"
                                onClick={() => navigator.clipboard.writeText(currentProject.join_code!)}
                              />
                            </div>
                          </div>
                          <Tag 
                            value={currentProject.is_public ? "Public" : "Private"} 
                            severity={currentProject.is_public ? "success" : "warning"}
                          />
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-5 gap-4 pt-3 border-t border-gray-600">
                      <div className="text-center">
                        <div className="text-xl font-bold text-blue-400">
                          {currentProject.teams_count || 0}
                        </div>
                        <div className="text-xs text-gray-400">Teams</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-bold text-cyan-400">
                          {currentProject.members_count || 0}
                        </div>
                        <div className="text-xs text-gray-400">Members</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-bold text-green-400">
                          {currentProject.templates_count || 0}
                        </div>
                        <div className="text-xs text-gray-400">Templates</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-bold text-purple-400">
                          {currentProject.databases_count || 0}
                        </div>
                        <div className="text-xs text-gray-400">Databases</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-bold text-orange-400">
                          {currentProject.applications_count || 0}
                        </div>
                        <div className="text-xs text-gray-400">Applications</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <i className="pi pi-briefcase text-6xl text-gray-500 mb-4"></i>
                <h3 className="text-lg font-medium text-white mb-2">No Active Project</h3>
                <p className="text-gray-400 mb-4">You don't have an active project yet.</p>
                <Button
                  label="Create Project"
                  icon="pi pi-plus"
                  className="p-button-outlined"
                  onClick={() => setShowCreateModal(true)}
                />
              </div>
            )}
          </Card>

          {/* Quick Actions */}
          <Card title="Quick Actions" className="h-fit">
            <div className="grid grid-cols-2 gap-3">
              <Button
                label="Applications"
                icon="pi pi-user-plus"
                className="p-button-outlined flex-col h-14"
                onClick={() => setShowApplicationsModal(true)}
                disabled={!currentProject || !currentProject.allow_join_requests}
              />
              <Button
                label="Project Members"
                icon="pi pi-users"
                className="p-button-outlined flex-col h-14"
                onClick={() => setShowMembersModal(true)}
                disabled={!currentProject}
              />
              <Button
                label="Teams Management"
                icon="pi pi-users"
                className="p-button-outlined flex-col h-14"
                onClick={() => onOpenPanel?.('team-management', { title: `Teams - ${currentProject?.name}` })}
                disabled={!currentProject || !onOpenPanel}
              />
              <Button
                label="Invitations"
                icon="pi pi-send"
                className="p-button-outlined flex-col h-14"
                onClick={() => setShowInvitationsModal(true)}
                disabled={!currentProject}
              />
              <Button
                label="Templates"
                icon="pi pi-cog"
                className="p-button-outlined flex-col h-14"
                onClick={() => onOpenPanel?.('template-management', { title: `Templates - ${currentProject?.name}` })}
                disabled={!currentProject || !onOpenPanel}
              />
              <Button
                label="Database"
                icon="pi pi-database"
                className="p-button-outlined flex-col h-14"
                onClick={() => onOpenPanel?.('database-management', { title: `Database - ${currentProject?.name}` })}
                disabled={!currentProject || !onOpenPanel}
              />
            </div>
          </Card>
        </div>

        {/* Projects List */}
        <div className="space-y-4">
          <Card title="All Projects" className="flex-1">
            <DataTable
              value={projects}
              className="p-datatable-sm"
              emptyMessage="No projects found"
              paginator
              rows={10}
              rowsPerPageOptions={[5, 10, 20]}
            >
              <Column field="name" header="Project" sortable />
              <Column 
                field="owner" 
                header="Owner" 
                body={ownerTemplate}
                className="w-40"
              />
              <Column 
                field="created_at" 
                header="Created" 
                body={dateTemplate}
                className="w-32"
                sortable
              />
              <Column 
                header="Status" 
                body={statusTemplate}
                className="w-24"
              />
              <Column 
                header="Actions" 
                body={actionTemplate}
                className="w-32"
              />
            </DataTable>
          </Card>
        </div>
          </div>
        </div>
      </div>

      {/* Create Project Modal */}
      <Dialog
        header="Create New Project"
        visible={showCreateModal}
        onHide={handleCreateModalHide}
        style={{ width: '450px' }}
        modal
        closable
        draggable={false}
        resizable={false}
        className="p-dialog-custom"
      >
        <div className="space-y-4">
          <div className="field">
            <label htmlFor="create-name" className="block text-sm font-medium text-white mb-2">
              Project Name *
            </label>
            <InputText
              id="create-name"
              value={createForm.name}
              onChange={(e) => {
                setCreateForm(prev => ({ ...prev, name: e.target.value }));
                setError(''); // Clear error when user types
              }}
              placeholder="my_project_name"
              className="w-full font-mono"
              disabled={creating}
              required
            />
            <div className="text-xs text-gray-400 mt-1">
              Projekt-Namen werden später für URLs verwendet (username/project_name)
            </div>
            <div className="text-xs text-orange-400 mt-1">
              ✓ Erlaubt: Kleinbuchstaben, Zahlen, Unterstriche (z.B. my_project_123)
            </div>
          </div>

          <div className="field">
            <label htmlFor="create-description" className="block text-sm font-medium text-white mb-2">
              Description
            </label>
            <InputTextarea
              id="create-description"
              value={createForm.description}
              onChange={(e) => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Enter project description (optional)"
              className="w-full"
              rows={3}
              disabled={creating}
            />
          </div>

          <div className="field">
            <div className="flex items-center space-x-2 mb-3">
              <input
                type="checkbox"
                id="create-is-public"
                checked={createForm.is_public}
                onChange={(e) => setCreateForm(prev => ({ ...prev, is_public: e.target.checked }))}
                disabled={creating}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              />
              <label htmlFor="create-is-public" className="text-sm font-medium text-white cursor-pointer">
                Public Project
              </label>
            </div>
            <p className="text-xs text-gray-400 mb-3">
              Public projects are visible to all users and can be discovered in the project gallery.
            </p>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="create-allow-join"
                checked={createForm.allow_join_requests}
                onChange={(e) => setCreateForm(prev => ({ ...prev, allow_join_requests: e.target.checked }))}
                disabled={creating}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              />
              <label htmlFor="create-allow-join" className="text-sm font-medium text-white cursor-pointer">
                Allow Join Requests
              </label>
            </div>
            <p className="text-xs text-gray-400">
              Users can request to join this project using a join code.
            </p>
          </div>

          {/* Error message in modal */}
          {error && (
            <div className="mt-4">
              <Message
                severity="error"
                text={error}
                className="w-full"
              />
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              label="Cancel"
              icon="pi pi-times"
              onClick={handleCreateModalHide}
              className="p-button-text"
              disabled={creating}
            />
            <Button
              label={creating ? "Creating..." : "Create Project"}
              icon={creating ? "pi pi-spinner pi-spin" : "pi pi-plus"}
              onClick={handleCreateProject}
              disabled={creating || !createForm.name.trim()}
            />
          </div>
        </div>
      </Dialog>

      {/* Delete Project Confirmation Modal */}
      <Dialog
        header="Delete Project"
        visible={showDeleteModal}
        onHide={handleDeleteModalHide}
        style={{ width: '450px' }}
        modal
        closable
        draggable={false}
        resizable={false}
        className="p-dialog-custom"
      >
        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <i className="pi pi-exclamation-triangle text-orange-500 text-2xl mt-1"></i>
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Are you sure you want to delete this project?
              </h3>
              <p className="text-sm text-gray-600 mb-2">
                <strong>{projectToDelete?.name}</strong>
              </p>
              <p className="text-sm text-gray-500">
                This action will deactivate the project. You can restore it later if needed.
                Teams, templates, and databases associated with this project will remain intact.
              </p>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              label="Cancel"
              icon="pi pi-times"
              onClick={handleDeleteModalHide}
              className="p-button-text"
              disabled={deleting}
            />
            <Button
              label={deleting ? "Deleting..." : "Delete Project"}
              icon={deleting ? "pi pi-spinner pi-spin" : "pi pi-trash"}
              onClick={handleDeleteProject}
              className="p-button-danger"
              disabled={deleting}
            />
          </div>
        </div>
      </Dialog>


      {/* Join Code Modal */}
      <JoinCodeModal
        visible={showJoinCodeModal}
        onHide={() => setShowJoinCodeModal(false)}
        onSuccess={loadProjectsFromContext}
      />

      {/* Applications Modal */}
      <ApplicationsModal
        visible={showApplicationsModal}
        onHide={() => setShowApplicationsModal(false)}
        project={currentProject}
      />

      {/* Project Invitations Modal */}
      <ProjectInvitationsModal
        visible={showInvitationsModal}
        onHide={() => setShowInvitationsModal(false)}
        project={currentProject}
        onSuccess={loadProjectsFromContext}
      />

      {/* Project Members Modal */}
      <ProjectMembersModal
        visible={showMembersModal}
        onHide={() => setShowMembersModal(false)}
        project={currentProject}
      />

      {/* Project Overview Modal */}
      <Dialog
        header={`Project Overview: ${selectedProjectForOverview?.name || ''}`}
        visible={showProjectOverviewModal}
        onHide={() => setShowProjectOverviewModal(false)}
        style={{ width: '800px' }}
        modal
        className="p-fluid"
      >
        {selectedProjectForOverview && (
          <div className="space-y-6">
            {/* Project Properties */}
            <div className="bg-gray-50 p-4 rounded">
              <h3 className="text-lg font-semibold mb-3 text-gray-800">📋 Project Properties</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="font-medium text-gray-700">Name:</span>
                  <span className="ml-2 text-gray-900">{selectedProjectForOverview.name}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Owner:</span>
                  <span className="ml-2 text-gray-900">{selectedProjectForOverview.owner.name}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Created:</span>
                  <span className="ml-2 text-gray-900">{formatDate(selectedProjectForOverview.created_at)}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Join Code:</span>
                  <span className="ml-2 text-blue-600 font-mono">{selectedProjectForOverview.join_code || 'None'}</span>
                </div>
                <div className="col-span-2">
                  <span className="font-medium text-gray-700">Description:</span>
                  <span className="ml-2 text-gray-900">{selectedProjectForOverview.description || 'No description'}</span>
                </div>
              </div>
            </div>

            {/* Project Members Section */}
            <div className="bg-indigo-50 p-4 rounded">
              <h3 className="text-lg font-semibold mb-3 text-indigo-800">👤 Project Members</h3>
              {loadingMembersData ? (
                <div className="flex items-center justify-center py-4">
                  <i className="pi pi-spinner pi-spin text-indigo-600 mr-2"></i>
                  <span className="text-indigo-700">Loading members...</span>
                </div>
              ) : projectMembers.length > 0 ? (
                <div className="bg-white p-3 rounded border" style={{ maxHeight: '200px', overflow: 'auto' }}>
                  <div className="space-y-2">
                    {projectMembers.map((member, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded hover:bg-gray-100">
                        <div className="flex items-center space-x-3">
                          <i className="pi pi-user text-indigo-600"></i>
                          <div>
                            <div className="font-medium text-gray-900">{member.user?.name || 'Unknown User'}</div>
                            <div className="text-sm text-gray-600">{member.user?.email || 'No email'}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            member.role === 'owner' ? 'bg-purple-100 text-purple-800' :
                            member.role === 'admin' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {member.role || 'Member'}
                          </span>
                          {member.joined_at && (
                            <div className="text-xs text-gray-500 mt-1">
                              Joined: {new Date(member.joined_at).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-gray-600 italic text-center p-4">
                  <i className="pi pi-users mr-2"></i>
                  No project members loaded yet.
                </div>
              )}
            </div>

            {/* Teams Section with TreeView */}
            <div className="bg-blue-50 p-4 rounded">
              <h3 className="text-lg font-semibold mb-3 text-blue-800">👥 Teams & Members</h3>
              {loadingTeamsData ? (
                <div className="flex items-center justify-center py-4">
                  <i className="pi pi-spinner pi-spin text-blue-600 mr-2"></i>
                  <span className="text-blue-700">Loading teams...</span>
                </div>
              ) : projectTeamsTree.length > 0 ? (
                <div className="bg-white p-3 rounded border" style={{ maxHeight: '300px', overflow: 'auto' }}>
                  <ClassicTreeView
                    data={projectTeamsTree}
                    onNodeClick={(node) => console.log('Node clicked:', node)}
                  />
                </div>
              ) : (
                <div className="text-gray-600 italic">
                  <i className="pi pi-info-circle mr-2"></i>
                  No teams assigned to this project yet.
                </div>
              )}
            </div>

            {/* Database Schemas Section */}
            <div className="bg-green-50 p-4 rounded">
              <h3 className="text-lg font-semibold mb-3 text-green-800">🗄️ Database Schemas</h3>
              {loadingSchemasData ? (
                <div className="flex items-center justify-center p-4">
                  <i className="pi pi-spin pi-spinner mr-2"></i>
                  <span>Loading schemas...</span>
                </div>
              ) : projectSchemasTree.length > 0 ? (
                <div className="bg-white p-3 rounded border" style={{ maxHeight: '300px', overflow: 'auto' }}>
                  <ClassicTreeView
                    data={projectSchemasTree}
                    onNodeClick={(node) => console.log('Schema node clicked:', node)}
                  />
                </div>
              ) : (
                <div className="text-gray-600 italic text-center p-4">
                  No database schemas linked to this project yet.
                </div>
              )}
            </div>

            {/* Templates Section */}
            <div className="bg-purple-50 p-4 rounded">
              <h3 className="text-lg font-semibold mb-3 text-purple-800">📄 Linked Templates</h3>
              {loadingTemplatesData ? (
                <div className="flex items-center justify-center p-4">
                  <i className="pi pi-spin pi-spinner mr-2"></i>
                  <span>Loading templates...</span>
                </div>
              ) : projectTemplatesTree.length > 0 ? (
                <div className="bg-white p-3 rounded border" style={{ maxHeight: '300px', overflow: 'auto' }}>
                  <ClassicTreeView
                    data={projectTemplatesTree}
                    onNodeClick={(node) => console.log('Template node clicked:', node)}
                  />
                </div>
              ) : (
                <div className="text-gray-600 italic text-center p-4">
                  No templates linked to this project yet.
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end items-center pt-4 border-t border-gray-200">
              <div className="flex gap-2">
                <Button
                  label="Close"
                  icon="pi pi-times"
                  className="p-button-text"
                  onClick={() => setShowProjectOverviewModal(false)}
                />
              <Button
                label="Manage Project"
                icon="pi pi-cog"
                className="min-w-fit whitespace-nowrap"
                onClick={() => {
                  setShowProjectOverviewModal(false);
                  // Switch to current project and start editing
                  setOriginalSelectedProject(globalSelectedProject);
                  setCurrentProject(selectedProjectForOverview);
                  setGlobalSelectedProject(selectedProjectForOverview);
                  handleEdit(selectedProjectForOverview);
                }}
              />
              </div>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}