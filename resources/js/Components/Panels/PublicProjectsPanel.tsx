import React, { useState, useEffect } from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Tag } from 'primereact/tag';
import { Dialog } from 'primereact/dialog';
import { Checkbox } from 'primereact/checkbox';
import JoinCodeModal from '@/Components/Modals/JoinCodeModal';
import { useProject } from '@/contexts/ProjectContext';

interface TabPanelProps {
  isActive: boolean;
}

interface PublicProject {
  id: number;
  name: string;
  description: string;
  owner: {
    id: number;
    name: string;
    username?: string;
  };
  is_public: boolean;
  teams_count: number;
  can_join: boolean;
  created_at: string;
}

export default function PublicProjectsPanel({ isActive }: TabPanelProps) {
  const { loadProjects: loadGlobalProjects } = useProject();
  const [projects, setProjects] = useState<PublicProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showJoinCodeModal, setShowJoinCodeModal] = useState(false);
  const [cloning, setCloning] = useState<number | null>(null);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [showCloneModal, setShowCloneModal] = useState(false);
  const [projectToClone, setProjectToClone] = useState<PublicProject | null>(null);
  const [cloneForm, setCloneForm] = useState({
    name: '',
    description: '',
    is_public: false
  });
  const [cloneError, setCloneError] = useState<string>('');

  useEffect(() => {
    if (isActive) {
      loadPublicProjects();
      loadCurrentUser();
    }
  }, [isActive]);

  const loadCurrentUser = async () => {
    try {
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (!token) return;

      const response = await fetch('/api/user', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        const userData = await response.json();
        setCurrentUserId(userData.id);
      }
    } catch {
      // Error loading current user
    }
  };

  const loadPublicProjects = async () => {
    try {
      setLoading(true);
      setError('');
      
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (!token) {
        setError('Not authenticated');
        return;
      }

      const response = await fetch('/api/projects?public=1', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load public projects');
      }

      const data = await response.json();
      setProjects(data.projects || []);

    } catch {
      setError(_ instanceof Error ? _.message : 'Error loading public projects');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const generateCloneName = (originalName: string) => {
    let baseName = `${originalName}_copy`;
    let counter = 1;

    // Check if base name exists in current projects
    while (projects.some(p => p.name.toLowerCase() === baseName.toLowerCase())) {
      counter++;
      baseName = `${originalName}_copy${counter}`;
    }

    return baseName;
  };

  const openCloneModal = (project: PublicProject) => {
    const suggestedName = generateCloneName(project.name);
    setProjectToClone(project);
    setCloneForm({
      name: suggestedName,
      description: `Cloned from "${project.name}" by ${project.owner.name}`,
      is_public: false
    });
    setShowCloneModal(true);
    setCloneError('');
  };

  const handleCloneProject = async () => {
    if (!projectToClone) return;

    setCloning(projectToClone.id);
    try {
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');

      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          name: cloneForm.name,
          description: cloneForm.description,
          original_project_id: projectToClone.id,
          creator_user_id: projectToClone.owner.id, // Credit to original creator
          is_clone: true,
          is_public: cloneForm.is_public,
        }),
      });

      if (response.ok) {
        await response.json(); // Consume response but don't use data
        setShowCloneModal(false);
        setProjectToClone(null);
        setCloneForm({ name: '', description: '', is_public: false });
        setCloneError('');

        // Refresh the projects list to show the new cloned project
        await loadPublicProjects();

        // Also refresh the global project dropdown
        await loadGlobalProjects();

        alert(`Project "${cloneForm.name}" cloned successfully! You can find it in your Projects tab.`);
      } else {
        const errorData = await response.json();
        setCloneError(errorData.message || 'Failed to clone project');
      }
    } catch {
      setCloneError('Failed to clone project');
    } finally {
      setCloning(null);
    }
  };

  const handleCloneModalHide = () => {
    setShowCloneModal(false);
    setProjectToClone(null);
    setCloneForm({ name: '', description: '', is_public: false });
    setCloneError('');
  };

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.owner.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <i className="pi pi-spinner pi-spin text-4xl text-blue-500 mb-4"></i>
          <p className="text-gray-600">Loading public projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full p-6 bg-gray-900 text-white">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <i className="pi pi-globe text-2xl text-green-600"></i>
          <h1 className="text-2xl font-bold text-white">Public Projects</h1>
        </div>
        <div className="flex space-x-2">
          <Button
            icon="pi pi-sign-in"
            label="Join with Code"
            className="p-button-outlined"
            onClick={() => setShowJoinCodeModal(true)}
            disabled={loading}
          />
          <Button
            icon="pi pi-refresh"
            label="Refresh"
            className="p-button-outlined"
            onClick={loadPublicProjects}
            disabled={loading}
          />
        </div>
      </div>

      {error && (
        <Message severity="error" text={error} className="mb-4" />
      )}

      {/* Search */}
      <div className="mb-6">
        <div className="flex items-center space-x-2">
          <i className="pi pi-search text-gray-400"></i>
          <InputText
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search projects by name, description, or owner..."
            className="flex-1"
            disabled={loading}
          />
        </div>
      </div>

      {/* Projects Grid */}
      <div className="flex-1 overflow-y-auto">
        {filteredProjects.length === 0 ? (
          <div className="text-center py-8">
            <i className="pi pi-search text-6xl text-gray-500 mb-4"></i>
            <h3 className="text-lg font-medium text-white mb-2">
              {searchTerm ? 'No matching projects' : 'No public projects'}
            </h3>
            <p className="text-gray-400 mb-4">
              {searchTerm 
                ? 'Try adjusting your search terms.'
                : 'There are no public projects available at the moment.'
              }
            </p>
            {searchTerm && (
              <Button
                label="Clear Search"
                icon="pi pi-times"
                className="p-button-outlined"
                onClick={() => setSearchTerm('')}
              />
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <Card
                key={project.id}
                className="h-fit hover:shadow-lg transition-shadow bg-gray-800 border-gray-700"
                header={
                  <div className="p-4 border-b border-gray-700 bg-gray-800">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-semibold text-white truncate">
                        {project.name}
                      </h3>
                      <Tag
                        value="Public"
                        severity="success"
                        icon="pi pi-globe"
                        className="ml-2"
                      />
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-300">
                      <i className="pi pi-user"></i>
                      <span>{project.owner.name}</span>
                      {project.owner.username && (
                        <span className="text-gray-400">@{project.owner.username}</span>
                      )}
                    </div>
                  </div>
                }
              >
                <div className="p-4 space-y-4 bg-gray-800">
                  {/* Description */}
                  <div>
                    <p className="text-sm text-gray-300 line-clamp-3 min-h-[3.5rem]">
                      {project.description || 'No description provided.'}
                    </p>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-1">
                        <i className="pi pi-users text-blue-400"></i>
                        <span className="text-gray-300">{project.teams_count} teams</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <i className="pi pi-calendar text-gray-400"></i>
                        <span className="text-gray-400">{formatDate(project.created_at)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t border-gray-700">
                    {currentUserId === project.owner.id ? (
                      <Button
                        label="Your Project"
                        icon="pi pi-user"
                        className="w-full p-button-outlined"
                        disabled
                        tooltip="This is your own project. Use the Projects tab to duplicate it."
                      />
                    ) : (
                      <Button
                        label={cloning === project.id ? "Cloning..." : "Clone Project"}
                        icon={cloning === project.id ? "pi pi-spinner pi-spin" : "pi pi-copy"}
                        className="w-full p-button-success"
                        onClick={() => openCloneModal(project)}
                        disabled={cloning === project.id}
                      />
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Statistics */}
      <div className="mt-6 p-4 bg-gray-800 rounded-lg border border-gray-700">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-blue-400">{projects.length}</div>
            <div className="text-sm text-gray-400">Total Projects</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-400">
              {projects.filter(p => p.can_join).length}
            </div>
            <div className="text-sm text-gray-400">Accepting Members</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-400">
              {filteredProjects.length}
            </div>
            <div className="text-sm text-gray-400">Showing</div>
          </div>
        </div>
      </div>

      {/* Join Code Modal */}
      <JoinCodeModal
        visible={showJoinCodeModal}
        onHide={() => setShowJoinCodeModal(false)}
        onSuccess={() => {
          loadPublicProjects();
          setShowJoinCodeModal(false);
        }}
      />

      {/* Clone Project Modal */}
      <Dialog
        header={`Clone Project - ${projectToClone?.name || ''}`}
        visible={showCloneModal}
        onHide={handleCloneModalHide}
        style={{ width: '500px' }}
        modal
        closable
        draggable={true}
        resizable={true}
        className="p-dialog-custom"
      >
        <div className="space-y-4">
          {cloneError && (
            <Message severity="error" text={cloneError} className="mb-4" />
          )}

          <div className="field">
            <label htmlFor="clone-name" className="block text-sm font-medium text-white mb-2">
              Project Name *
            </label>
            <InputText
              id="clone-name"
              value={cloneForm.name}
              onChange={(e) => setCloneForm(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter project name"
              className="w-full"
              disabled={cloning !== null}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="clone-description" className="block text-sm font-medium text-white mb-2">
              Description
            </label>
            <InputTextarea
              id="clone-description"
              value={cloneForm.description}
              onChange={(e) => setCloneForm(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Enter project description"
              className="w-full"
              rows={3}
              disabled={cloning !== null}
            />
          </div>

          <div className="field">
            <div className="flex items-center space-x-2 mb-3">
              <Checkbox
                id="clone-is-public"
                checked={cloneForm.is_public}
                onChange={(e) => setCloneForm(prev => ({ ...prev, is_public: e.checked || false }))}
                disabled={cloning !== null}
              />
              <label htmlFor="clone-is-public" className="text-sm font-medium text-white">
                Public Project
              </label>
            </div>
            <p className="text-xs text-gray-300 mb-3">
              Public projects are visible to all users and can be discovered in the project gallery.
            </p>
            <p className="text-xs text-yellow-400">
              💡 Note: Private projects may require premium features.
            </p>
          </div>

          {projectToClone && (
            <div className="p-3 bg-gray-800 rounded-lg border border-gray-600">
              <div className="text-sm">
                <div className="font-medium text-gray-300 mb-1">Original Project:</div>
                <div className="text-white">{projectToClone.name}</div>
                <div className="text-gray-400 text-xs mt-1">
                  by {projectToClone.owner.name} • Credits will be preserved
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              label="Cancel"
              icon="pi pi-times"
              onClick={handleCloneModalHide}
              className="p-button-text"
              disabled={cloning !== null}
            />
            <Button
              label={cloning !== null ? "Cloning..." : "Clone Project"}
              icon={cloning !== null ? "pi pi-spinner pi-spin" : "pi pi-copy"}
              onClick={handleCloneProject}
              disabled={cloning !== null || !cloneForm.name.trim()}
            />
          </div>
        </div>
      </Dialog>
    </div>
  );
}