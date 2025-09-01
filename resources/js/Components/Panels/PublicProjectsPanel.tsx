import React, { useState, useEffect } from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Message } from 'primereact/message';
import { Tag } from 'primereact/tag';
import JoinCodeModal from '@/Components/Modals/JoinCodeModal';

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
  const [projects, setProjects] = useState<PublicProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showJoinCodeModal, setShowJoinCodeModal] = useState(false);

  useEffect(() => {
    if (isActive) {
      loadPublicProjects();
    }
  }, [isActive]);

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

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading public projects');
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
                className="h-fit hover:shadow-lg transition-shadow"
                header={
                  <div className="p-4 border-b">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 truncate">
                        {project.name}
                      </h3>
                      <Tag 
                        value="Public" 
                        severity="success" 
                        icon="pi pi-globe"
                        className="ml-2"
                      />
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <i className="pi pi-user"></i>
                      <span>{project.owner.name}</span>
                      {project.owner.username && (
                        <span className="text-gray-500">@{project.owner.username}</span>
                      )}
                    </div>
                  </div>
                }
              >
                <div className="p-4 space-y-4">
                  {/* Description */}
                  <div>
                    <p className="text-sm text-gray-600 line-clamp-3 min-h-[3.5rem]">
                      {project.description || 'No description provided.'}
                    </p>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-1">
                        <i className="pi pi-users text-blue-500"></i>
                        <span className="text-gray-600">{project.teams_count}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <i className="pi pi-calendar text-gray-400"></i>
                        <span className="text-gray-500">{formatDate(project.created_at)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t">
                    {project.can_join ? (
                      <Button
                        label="Request to Join"
                        icon="pi pi-user-plus"
                        className="w-full"
                        onClick={() => setShowJoinCodeModal(true)}
                      />
                    ) : (
                      <Button
                        label="View Details"
                        icon="pi pi-eye"
                        className="w-full p-button-outlined"
                        disabled
                        tooltip="This project is not accepting new members"
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
    </div>
  );
}