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
import JoinCodeModal from '@/Components/Modals/JoinCodeModal';
import ApplicationsModal from '@/Components/Modals/ApplicationsModal';

interface TabPanelProps {
  isActive: boolean;
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
  templates_count?: number;
  databases_count?: number;
  applications_count?: number;
}

export default function ProjectPanel({ isActive }: TabPanelProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    description: ''
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
  const [showTeamsModal, setShowTeamsModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [availableTeams, setAvailableTeams] = useState<any[]>([]);
  const [assignedTeams, setAssignedTeams] = useState<any[]>([]);
  const [selectedTeamIds, setSelectedTeamIds] = useState<number[]>([]);
  const [loadingTeams, setLoadingTeams] = useState(false);
  const [assigningTeams, setAssigningTeams] = useState(false);
  const [showJoinCodeModal, setShowJoinCodeModal] = useState(false);
  const [showApplicationsModal, setShowApplicationsModal] = useState(false);

  // Load projects when panel becomes active
  useEffect(() => {
    if (isActive) {
      loadProjects();
    }
  }, [isActive]);

  const loadProjects = async () => {
    try {
      setLoading(true);
      setError('');
      
      const token = localStorage.getItem('access_token');
      if (!token) {
        setError('Not authenticated');
        return;
      }

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
      setProjects(data.projects || []);
      setCurrentProject(data.current_project || null);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading projects');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    if (currentProject) {
      setEditForm({
        name: currentProject.name,
        description: currentProject.description
      });
      setIsEditing(true);
      setError('');
      setSuccess('');
    }
  };

  const handleSave = async () => {
    if (!currentProject) return;
    
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
      setCurrentProject(updatedProject);
      
      // Update the editForm with the new values
      setEditForm({
        name: updatedProject.name,
        description: updatedProject.description || ''
      });
      
      // Update the projects array in state to reflect the changes in the table
      setProjects(prevProjects => 
        prevProjects.map(p => 
          p.id === updatedProject.id ? updatedProject : p
        )
      );
      
      setIsEditing(false);
      setSuccess('Project updated successfully');

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
  };

  const handleCreateProject = async () => {
    setCreating(true);
    setError('');
    setSuccess('');

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
          throw new Error(errorData.errors.name[0]);
        }
        
        throw new Error(errorData.message || 'Failed to create project');
      }

      await response.json();
      
      // Refresh the projects list
      await loadProjects();
      
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
    setError('');
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
      await loadProjects();

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

  const openTeamsModal = async (project: Project) => {
    setSelectedProject(project);
    setShowTeamsModal(true);
    setLoadingTeams(true);
    setError('');

    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('Not authenticated');
      }

      // Load available and assigned teams in parallel
      const [availableRes, assignedRes] = await Promise.all([
        fetch(`/api/projects/${project.id}/teams/available`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          },
        }),
        fetch(`/api/projects/${project.id}/teams/assigned`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          },
        })
      ]);

      if (!availableRes.ok || !assignedRes.ok) {
        console.error('API Response Error:', {
          availableStatus: availableRes.status,
          assignedStatus: assignedRes.status,
          availableStatusText: availableRes.statusText,
          assignedStatusText: assignedRes.statusText
        });
        throw new Error(`Failed to load teams (Available: ${availableRes.status}, Assigned: ${assignedRes.status})`);
      }

      const available = await availableRes.json();
      const assigned = await assignedRes.json();

      console.log('Teams data loaded:', { available: available.length, assigned: assigned.length });

      setAvailableTeams(available);
      setAssignedTeams(assigned);

    } catch (err) {
      console.error('Error in openTeamsModal:', err);
      setError(err instanceof Error ? err.message : 'Error loading teams');
    } finally {
      setLoadingTeams(false);
    }
  };

  const handleAssignTeams = async () => {
    if (!selectedProject || selectedTeamIds.length === 0) return;

    setAssigningTeams(true);
    setError('');

    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`/api/projects/${selectedProject.id}/teams/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          team_ids: selectedTeamIds
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to assign teams');
      }

      // Refresh teams data
      await openTeamsModal(selectedProject);
      setSelectedTeamIds([]);
      setSuccess('Teams assigned successfully');

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error assigning teams');
    } finally {
      setAssigningTeams(false);
    }
  };

  const handleRemoveTeam = async (teamId: number) => {
    if (!selectedProject) return;

    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`/api/projects/${selectedProject.id}/teams/${teamId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to remove team');
      }

      // Refresh teams data
      await openTeamsModal(selectedProject);
      setSuccess('Team removed successfully');

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error removing team');
    }
  };

  const handleTeamsModalHide = () => {
    setShowTeamsModal(false);
    setSelectedProject(null);
    setAvailableTeams([]);
    setAssignedTeams([]);
    setSelectedTeamIds([]);
    setError('');
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
          icon="pi pi-users"
          className="p-button-rounded p-button-text p-button-sm"
          tooltip="Manage teams"
          onClick={() => openTeamsModal(project)}
        />
        <Button
          icon="pi pi-pencil"
          className="p-button-rounded p-button-text p-button-sm"
          tooltip="Edit project"
          onClick={() => {
            setCurrentProject(project);
            handleEdit();
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

  if (loading) {
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
    <div className="flex flex-col h-full p-6 bg-gray-900 text-white">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <i className="pi pi-briefcase text-2xl text-blue-600"></i>
          <h1 className="text-2xl font-bold text-white">Project Management</h1>
        </div>
        <div className="flex space-x-2">
          <Button
            icon="pi pi-plus"
            label="New Project"
            onClick={() => setShowCreateModal(true)}
            disabled={loading}
          />
          <Button
            icon="pi pi-sign-in"
            label="Join Project"
            className="p-button-outlined"
            onClick={() => setShowJoinCodeModal(true)}
            disabled={loading}
          />
          <Button
            icon="pi pi-refresh"
            label="Refresh"
            className="p-button-outlined"
            onClick={loadProjects}
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

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 flex-1">
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
                    onClick={handleEdit}
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
                        className="w-full"
                        placeholder="Enter project name"
                      />
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

                    <div className="grid grid-cols-4 gap-4 pt-3 border-t border-gray-600">
                      <div className="text-center">
                        <div className="text-xl font-bold text-blue-400">
                          {currentProject.teams_count || 0}
                        </div>
                        <div className="text-xs text-gray-400">Teams</div>
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
                label="Teams"
                icon="pi pi-users"
                className="p-button-outlined flex-col h-20"
                onClick={() => currentProject && openTeamsModal(currentProject)}
                disabled={!currentProject}
              />
              <Button
                label="Applications"
                icon="pi pi-user-plus"
                className="p-button-outlined flex-col h-20"
                onClick={() => setShowApplicationsModal(true)}
                disabled={!currentProject || !currentProject.allow_join_requests}
              />
              <Button
                label="Templates"
                icon="pi pi-cog"
                className="p-button-outlined flex-col h-20"
                onClick={() => console.log('Open Templates')}
              />
              <Button
                label="Database"
                icon="pi pi-database"
                className="p-button-outlined flex-col h-20"
                onClick={() => console.log('Open Database')}
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
            <label htmlFor="create-name" className="block text-sm font-medium text-gray-700 mb-2">
              Project Name *
            </label>
            <InputText
              id="create-name"
              value={createForm.name}
              onChange={(e) => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter project name"
              className="w-full"
              disabled={creating}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="create-description" className="block text-sm font-medium text-gray-700 mb-2">
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
              <Checkbox
                id="create-is-public"
                checked={createForm.is_public}
                onChange={(e) => setCreateForm(prev => ({ ...prev, is_public: e.checked || false }))}
                disabled={creating}
              />
              <label htmlFor="create-is-public" className="text-sm font-medium text-gray-700">
                Public Project
              </label>
            </div>
            <p className="text-xs text-gray-500 mb-3">
              Public projects are visible to all users and can be discovered in the project gallery.
            </p>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="create-allow-join"
                checked={createForm.allow_join_requests}
                onChange={(e) => setCreateForm(prev => ({ ...prev, allow_join_requests: e.checked || false }))}
                disabled={creating}
              />
              <label htmlFor="create-allow-join" className="text-sm font-medium text-gray-700">
                Allow Join Requests
              </label>
            </div>
            <p className="text-xs text-gray-500">
              Users can request to join this project using a join code.
            </p>
          </div>

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

      {/* Teams Assignment Modal */}
      <Dialog
        header={`Manage Teams - ${selectedProject?.name || ''}`}
        visible={showTeamsModal}
        onHide={handleTeamsModalHide}
        style={{ width: '800px' }}
        modal
        closable
        draggable={false}
        resizable={false}
        className="p-dialog-custom"
      >
        <div className="space-y-4">
          {loadingTeams ? (
            <div className="flex items-center justify-center py-8">
              <i className="pi pi-spinner pi-spin text-2xl text-blue-500"></i>
            </div>
          ) : (
            <>
              {/* Teams Table */}
              <DataTable
                key={`teams-table-${selectedTeamIds.join('-')}`}
                value={[...assignedTeams, ...availableTeams]}
                className="p-datatable-sm"
                emptyMessage="No teams found"
                paginator
                rows={10}
                rowsPerPageOptions={[5, 10, 20]}
                header={
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold">Teams ({assignedTeams.length + availableTeams.length})</span>
                    <div className="text-sm text-gray-500">
                      {selectedTeamIds.length > 0 && `${selectedTeamIds.length} selected`}
                    </div>
                  </div>
                }
              >
                <Column 
                  headerStyle={{ width: '3rem' }}
                  header={() => {
                    const availableTeamIds = availableTeams.map(team => team.id);
                    const allSelected = availableTeamIds.length > 0 && availableTeamIds.every(id => selectedTeamIds.includes(id));
                    const someSelected = availableTeamIds.some(id => selectedTeamIds.includes(id));
                    
                    return (
                      <Checkbox
                        checked={allSelected}
                        indeterminate={someSelected && !allSelected}
                        onChange={(e) => {
                          console.log('Header checkbox clicked:', e.checked);
                          if (e.checked) {
                            // Select all available teams
                            setSelectedTeamIds(availableTeamIds);
                          } else {
                            // Deselect all
                            setSelectedTeamIds([]);
                          }
                        }}
                      />
                    );
                  }}
                  body={(team) => {
                    const isAssigned = assignedTeams.some(t => t.id === team.id);
                    
                    if (isAssigned) {
                      // Show remove button for assigned teams
                      return (
                        <Button
                          icon="pi pi-times"
                          className="p-button-rounded p-button-text p-button-sm p-button-danger"
                          tooltip="Remove from project"
                          onClick={() => handleRemoveTeam(team.id)}
                        />
                      );
                    } else {
                      // Show checkbox for available teams
                      const isChecked = selectedTeamIds.includes(team.id);
                      console.log(`Team ${team.id} (${team.name}): isChecked = ${isChecked}, selectedTeamIds:`, selectedTeamIds);
                      
                      return (
                        <Checkbox
                          checked={isChecked}
                          onChange={(e) => {
                            console.log('Checkbox clicked:', team.id, 'new state:', e.checked, 'current selectedTeamIds:', selectedTeamIds);
                            if (e.checked) {
                              setSelectedTeamIds(prev => {
                                const newIds = [...prev, team.id];
                                console.log('Adding team, new selectedTeamIds:', newIds);
                                return newIds;
                              });
                            } else {
                              setSelectedTeamIds(prev => {
                                const newIds = prev.filter(id => id !== team.id);
                                console.log('Removing team, new selectedTeamIds:', newIds);
                                return newIds;
                              });
                            }
                          }}
                        />
                      );
                    }
                  }}
                />
                
                <Column 
                  field="name" 
                  header="Team Name" 
                  sortable
                  body={(team) => {
                    const isAssigned = assignedTeams.some(t => t.id === team.id);
                    return (
                      <div className="flex items-center space-x-2">
                        <i className={`pi pi-users ${isAssigned ? 'text-green-600' : 'text-blue-600'}`}></i>
                        <span className={isAssigned ? 'font-medium' : ''}>{team.name}</span>
                        {isAssigned && <i className="pi pi-check-circle text-green-500 text-sm"></i>}
                      </div>
                    );
                  }}
                />
                
                <Column 
                  field="description" 
                  header="Description"
                  body={(team) => {
                    const description = team.description || 'No description';
                    if (description.length <= 50) {
                      return <span className="text-gray-600">{description}</span>;
                    }
                    
                    return (
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-600">{description.substring(0, 47)}...</span>
                        <Button
                          icon="pi pi-info-circle"
                          className="p-button-rounded p-button-text p-button-sm"
                          tooltip={description}
                        />
                      </div>
                    );
                  }}
                />
                
                <Column 
                  field="status" 
                  header="Status"
                  body={(team) => {
                    const isAssigned = assignedTeams.some(t => t.id === team.id);
                    return (
                      <Tag 
                        value={isAssigned ? 'Assigned' : 'Available'} 
                        severity={isAssigned ? 'success' : 'info'}
                      />
                    );
                  }}
                />
              </DataTable>

              {/* Action Buttons */}
              <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                <div className="text-sm text-gray-500">
                  {assignedTeams.length} assigned • {availableTeams.length} available
                  {selectedTeamIds.length > 0 && ` • ${selectedTeamIds.length} selected for assignment`}
                </div>
                <div className="flex space-x-2">
                  <Button
                    label="Cancel"
                    icon="pi pi-times"
                    onClick={handleTeamsModalHide}
                    className="p-button-text"
                    disabled={assigningTeams}
                  />
                  <Button
                    label={assigningTeams ? "Assigning..." : `Assign Selected (${selectedTeamIds.length})`}
                    icon={assigningTeams ? "pi pi-spinner pi-spin" : "pi pi-check"}
                    onClick={handleAssignTeams}
                    disabled={assigningTeams || selectedTeamIds.length === 0}
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </Dialog>

      {/* Join Code Modal */}
      <JoinCodeModal
        visible={showJoinCodeModal}
        onHide={() => setShowJoinCodeModal(false)}
        onSuccess={loadProjects}
      />

      {/* Applications Modal */}
      <ApplicationsModal
        visible={showApplicationsModal}
        onHide={() => setShowApplicationsModal(false)}
        project={currentProject}
      />
    </div>
  );
}