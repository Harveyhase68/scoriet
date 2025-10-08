// resources/js/Components/Panels/TeamsPanel_New.tsx - Project Teams Assignment Panel
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { TabContentProps } from '@/types';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Checkbox } from 'primereact/checkbox';
import { InputText } from 'primereact/inputtext';
import { Card } from 'primereact/card';
import { useProject } from '@/contexts/ProjectContext';

const TabContent: React.FC<TabContentProps> = ({ children, style = {}, ...rest }) => {
  const ref = useRef<HTMLDivElement>(null);
  const setFocus = () => ref.current?.focus();

  return (
    <div 
      {...rest} 
      ref={ref}
      tabIndex={-1} 
      style={{ flex: 1, padding: '5px 10px', ...style }} 
      onMouseDownCapture={setFocus} 
      onTouchStartCapture={setFocus}
      className="bg-gray-800 text-gray-100"
    >
      {children}
    </div>
  );
};

// Team Interface
interface Team {
  id: number;
  name: string;
  description: string;
  is_active: boolean;
  created_at: string;
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
  members_count?: number;
}

interface TeamsPanelProps {
  isActive?: boolean;
  filterByProject?: boolean;
  updateTabTitle?: (newTitle: string) => void;
  source?: 'menu' | 'project-management'; // New prop to track where the panel was opened from
  forceProjectId?: number; // Force the panel to use this project ID instead of the selected project
}

export default function TeamsPanel({ filterByProject = false, source = 'menu', forceProjectId }: TeamsPanelProps) {
  const { selectedProject } = useProject();
  // Use forceProjectId if provided, otherwise use selectedProject
  const projectId = forceProjectId !== undefined ? forceProjectId : (filterByProject ? selectedProject?.id : undefined);
  const [teams, setTeams] = useState<Team[]>([]);
  const [assignedTeams, setAssignedTeams] = useState<Team[]>([]);
  const [availableTeams, setAvailableTeams] = useState<Team[]>([]);
  const [selectedTeamIdsByProject, setSelectedTeamIdsByProject] = useState<Record<number, number[]>>({});
  const [selectedTeamIds, setSelectedTeamIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigningTeams, setAssigningTeams] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [projects, setProjects] = useState<any[]>([]);
  // const [loadingProjects, setLoadingProjects] = useState(false);
  const [forcedProject, setForcedProject] = useState<any>(null);

  // Load forced project data if forceProjectId is provided
  useEffect(() => {
    if (forceProjectId !== undefined) {
      const loadForcedProject = async () => {
        try {
          const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
          if (!token) {
            throw new Error('Not authenticated');
          }

          const response = await fetch(`/api/projects/${forceProjectId}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/json',
            },
          });

          if (response.ok) {
            const projectData = await response.json();
            setForcedProject(projectData);
          }
        } catch (error) {
          console.error('Error loading forced project:', error);
        }
      };
      loadForcedProject();
    }
  }, [forceProjectId]);

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        if (source === 'menu') {
          // Load all teams and projects for menu view
          await Promise.all([
            loadAllTeams(),
            loadProjects()
          ]);
        } else {
          // Load only teams for project-management view
          await loadAllTeams();
        }
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Error loading data');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [source]);

  // Load teams assigned to a specific project
  const loadProjectTeams = useCallback(async (projectId: number) => {
    try {
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (!token || !projectId) {
        return;
      }

      // Load assigned teams
      const assignedResponse = await fetch(`/api/projects/${projectId}/teams/assigned`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });
      
      // Load available teams
      const availableResponse = await fetch(`/api/projects/${projectId}/teams/available`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });
      
      if (assignedResponse.ok && availableResponse.ok) {
        const assignedTeamsData = await assignedResponse.json();
        const availableTeamsData = await availableResponse.json();
        
        // Update state
        setAssignedTeams(assignedTeamsData);
        setAvailableTeams(availableTeamsData);
        
        // Clear any selected team IDs when switching projects
        setSelectedTeamIdsByProject({});
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error loading project teams');
    }
  }, []);

  // Load all projects for menu view
  const loadProjects = async () => {
    try {
      // setLoadingProjects(true);
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (!token) {
        throw new Error('Not authenticated');
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
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error loading projects');
    } finally {
      // setLoadingProjects(false);
    }
  };

  // When projectId changes, reload project teams
  useEffect(() => {
    if (projectId) {
      console.log('🔍 TeamsPanel: Loading teams for projectId:', projectId, 'forceProjectId:', forceProjectId);
      loadProjectTeams(projectId);
    } else {
      // No project selected, show all teams as available
      loadAllTeams().then(allTeams => {
        setAvailableTeams(allTeams);
        setAssignedTeams([]);
        setSelectedTeamIdsByProject({});
      });
    }
  }, [projectId, loadProjectTeams, forceProjectId]);

  const loadAllTeams = async () => {
    try {
      setError('');
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch('/api/teams?all=true', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load teams');
      }

      const data = await response.json();
      // Teams API might return { owned_teams: [], member_teams: [] }
      let teamsArray = [];
      if (data.owned_teams || data.member_teams) {
        teamsArray = [...(data.owned_teams || []), ...(data.member_teams || [])];
      } else if (data.teams) {
        teamsArray = data.teams;
      } else if (Array.isArray(data)) {
        teamsArray = data;
      }
      setTeams(teamsArray);
      return teamsArray;

    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error loading teams');
      return [];
    }
  };

  // Handle team assignment
  const handleAssignTeams = async () => {
    if (Object.keys(selectedTeamIdsByProject).length === 0) return;

    setAssigningTeams(true);
    setError('');

    try {
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (!token) {
        throw new Error('Not authenticated');
      }

      let totalAssigned = 0;
      
      // For each project, assign the selected teams
      for (const [projectIdStr, teamIds] of Object.entries(selectedTeamIdsByProject)) {
        if (teamIds.length === 0) continue;
        
        const projectId = parseInt(projectIdStr);
        
        const response = await fetch(`/api/projects/${projectId}/teams/assign`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          },
          body: JSON.stringify({
            team_ids: teamIds
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to assign teams');
        }
        
        totalAssigned += teamIds.length;
      }

      // Refresh teams data
      await loadAllTeams();
      
      setSelectedTeamIdsByProject({});
      setSuccess(`${totalAssigned} teams assigned to projects successfully`);

    } catch (error: any) {
      setError(error instanceof Error ? error.message : 'Error assigning teams');
    } finally {
      setAssigningTeams(false);
    }
  };

  // Handle team removal
  const handleRemoveTeam = async (projectId: number, teamId: number) => {
    if (!projectId) return;

    try {
      setError('');
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`/api/projects/${projectId}/teams/${teamId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        // Try to get error message from response
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch {
          // If response is not JSON, use default error message
        }
        throw new Error(errorMessage);
      }

      await response.json();

      // Move team from assigned to available
      const removedTeam = assignedTeams.find(t => t.id === teamId);
      if (removedTeam) {
        setAssignedTeams(prev => prev.filter(t => t.id !== teamId));
        setAvailableTeams(prev => [...prev, removedTeam]);
        setSuccess(`Team "${removedTeam.name}" removed from project successfully`);
      }

    } catch (error: any) {
      setError(error instanceof Error ? error.message : 'Error removing team');
    }
  };

  // Filter teams based on search
  const filteredAvailableTeams = React.useMemo(() => {
    if (!Array.isArray(availableTeams)) {
      return [];
    }
    
    return availableTeams.filter(team => {
      const matchesSearch = !searchQuery || 
        team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        team.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      return matchesSearch;
    });
  }, [availableTeams, searchQuery]);

  return (
    <TabContent style={{}}>
      <div className="h-full flex flex-col bg-gray-800 text-gray-100">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <i className="pi pi-spinner pi-spin text-4xl text-blue-500 mb-4"></i>
              <p className="text-gray-300">Loading teams...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <Card title={projectId ? `Teams Project Assignment - ${(forcedProject || selectedProject)?.name || 'Project'}` : (source === 'menu' ? "Teams Assignment" : "Project Teams")} className="m-4 mb-2">
          <div className="flex flex-col gap-4">
            {/* Project Info */}
            {projectId && (forcedProject || selectedProject) && (
              <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 p-2 rounded">
                <i className="pi pi-briefcase"></i>
                <span>Working on: <strong>{(forcedProject || selectedProject).name}</strong> by {(forcedProject || selectedProject).owner.name}</span>
              </div>
            )}
            
            {!projectId && source === 'menu' && (
              <div className="flex items-center gap-2 text-sm text-orange-600 bg-orange-50 p-2 rounded">
                <i className="pi pi-exclamation-triangle"></i>
                <span>Please select a project from the navigation to manage teams</span>
              </div>
            )}

            {/* Search */}
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <InputText
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search teams there..."
                  className="w-full"
                />
              </div>
            </div>

            {/* Status Messages */}
            {error && <div className="text-red-500 text-sm">{error}</div>}
            {success && <div className="text-green-500 text-sm">{success}</div>}
          </div>
        </Card>

        {/* Teams Table */}
        <div className="flex-1 mx-4 mb-4">
          <Card className="h-full">
            <div className="h-full flex flex-col">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <i className="pi pi-spinner pi-spin text-2xl text-blue-500"></i>
                </div>
              ) : source === 'menu' ? (
                // Menu view - Show projects with all teams (assigned and unassigned)
                <>
                  <div className="mb-4">
                    <InputText
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search projects or teams..."
                      className="w-full"
                    />
                  </div>
                  
                  <div className="overflow-auto" style={{ maxHeight: '500px' }}>
                    {projects.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        No projects found
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {projects.map(project => {
                          // Get only teams that are actually assigned to this project
                          const allTeamsForProject = teams.filter(team => {
                            // Check if team is assigned to this project
                            const isAssignedToProject = team.projects?.some(p => p.id === project.id);
                            
                            // Only include teams that are assigned to this project
                            return isAssignedToProject;
                          });
                          
                          // Filter by search query
                          const filteredTeams = allTeamsForProject.filter(team => {
                            if (!searchQuery) return true;
                            return team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                   team.description.toLowerCase().includes(searchQuery.toLowerCase());
                          });
                          
                          return (
                            <div key={project.id} className="border border-gray-600 rounded-lg p-4 bg-gray-700">
                              <div className="flex items-center justify-between mb-3">
                                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                  <i className="pi pi-briefcase text-blue-500"></i>
                                  {project.name}
                                </h3>
                                <span className="text-sm text-gray-400">
                                  {filteredTeams.length} team{filteredTeams.length !== 1 ? 's' : ''}
                                </span>
                              </div>
                              
                              {filteredTeams.length === 0 ? (
                                <div className="text-center py-4 text-gray-500">
                                  No teams available for this project
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  {filteredTeams.map(team => {
                                    // Check if team is assigned to this specific project
                                    const isAssignedToThisProject = team.projects?.some(p => p.id === project.id);
                                    
                                    return (
                                      <div key={team.id} className="flex items-center justify-between p-3 bg-gray-600 rounded hover:bg-gray-500 transition-colors">
                                        <div className="flex items-center gap-3">
                                          <div className="ml-4">
                                            <h4 className="font-medium text-white">{team.name}</h4>
                                            <p className="text-sm text-gray-300">{team.description}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                              <span className="text-xs text-gray-400">
                                                <i className="pi pi-user"></i> {team.owner?.name || 'Unknown'}
                                              </span>
                                              <span className="text-xs text-gray-400">
                                                <i className="pi pi-users"></i> {team.members_count || 0} members
                                              </span>
                                              <span className={`text-xs px-2 py-1 rounded ${
                                                isAssignedToThisProject ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'
                                              }`}>
                                                {isAssignedToThisProject ? 'Assigned' : 'Unassigned'}
                                              </span>
                                            </div>
                                          </div>
                                        </div>
                                        
                                        <div className="flex items-center gap-2">
                                          {isAssignedToThisProject ? (
                                            <Button
                                              icon="pi pi-times"
                                              className="p-button-rounded p-button-text p-button-sm p-button-danger"
                                              tooltip="Remove from project"
                                              onClick={() => handleRemoveTeam(project.id, team.id)}
                                            />
                                          ) : (
                                            <Checkbox
                                              checked={selectedTeamIdsByProject[project.id]?.includes(team.id) || false}
                                              onChange={(e) => {
                                                const currentSelection = selectedTeamIdsByProject[project.id] || [];
                                                if (e.checked) {
                                                  setSelectedTeamIdsByProject(prev => ({
                                                    ...prev,
                                                    [project.id]: [...currentSelection, team.id]
                                                  }));
                                                } else {
                                                  setSelectedTeamIdsByProject(prev => ({
                                                    ...prev,
                                                    [project.id]: currentSelection.filter(id => id !== team.id)
                                                  }));
                                                }
                                              }}
                                            />
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex justify-between items-center pt-4 border-t border-gray-200 mt-4">
                    <div className="text-sm text-gray-500">
                      {(() => {
                        const totalSelected = Object.values(selectedTeamIdsByProject).reduce((sum, ids) => sum + ids.length, 0);
                        return totalSelected > 0 ? `${totalSelected} team${totalSelected !== 1 ? 's' : ''} selected` : '';
                      })()}
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        label="Clear Selection"
                        icon="pi pi-times"
                        onClick={() => setSelectedTeamIdsByProject({})}
                        className="p-button-text"
                      />
                      <Button
                        label={`Assign Team(s) to Projects`}
                        icon="pi pi-check"
                        onClick={handleAssignTeams}
                        disabled={Object.keys(selectedTeamIdsByProject).length === 0 || assigningTeams}
                        loading={assigningTeams}
                      />
                    </div>
                  </div>
                </>
              ) : (
                // Project Management view - Show simple table
                <>
                  <DataTable
                    key={`teams-table-${(forcedProject || selectedProject)?.id || 'no-project'}-${selectedTeamIds.join('-')}-${assignedTeams.length}-${filteredAvailableTeams.length}`}
                    value={[...(assignedTeams || []), ...filteredAvailableTeams]}
                    className="p-datatable-sm"
                    emptyMessage="No teams found"
                    paginator
                    rows={10}
                    rowsPerPageOptions={[5, 10, 20]}
                    scrollable
                    scrollHeight="500px"
                    header={
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-semibold">
                          Teams ({(assignedTeams || []).length + filteredAvailableTeams.length})
                        </span>
                        <div className="text-sm text-gray-500">
                          {selectedTeamIds.length > 0 && `${selectedTeamIds.length} selected`}
                        </div>
                      </div>
                    }
                  >
                    <Column
                      headerStyle={{ width: '3rem' }}
                      header={() => {
                        const availableTeamIds = filteredAvailableTeams.map(team => team.id);
                        const allSelected = availableTeamIds.length > 0 &&
                          availableTeamIds.every(id => selectedTeamIds.includes(id));
                        
                        return (
                          <Checkbox
                            checked={allSelected}
                            onChange={(e) => {
                              if (e.checked) {
                                setSelectedTeamIds(availableTeamIds);
                              } else {
                                setSelectedTeamIds([]);
                              }
                            }}
                          />
                        );
                      }}
                      body={(team) => {
                        const isAssigned = (assignedTeams || []).some(t => t.id === team.id);
                        
                        if (isAssigned) {
                          return (
                            <Button
                              icon="pi pi-times"
                              className="p-button-rounded p-button-text p-button-sm p-button-danger"
                              tooltip="Remove from project"
                              onClick={() => handleRemoveTeam(projectId || 0, team.id)}
                            />
                          );
                        } else {
                          const isChecked = selectedTeamIds.includes(team.id);
                          return (
                            <Checkbox
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.checked) {
                                  setSelectedTeamIds(prev => [...prev, team.id]);
                                } else {
                                  setSelectedTeamIds(prev => prev.filter(id => id !== team.id));
                                }
                              }}
                            />
                          );
                        }
                      }}
                    />
                    
                    <Column field="name" header="Team Name" sortable />
                    <Column field="description" header="Description" />
                    <Column
                      field="owner"
                      header="Owner"
                      body={(team) => (
                        <div className="flex items-center gap-2">
                          <i className="pi pi-user text-gray-500"></i>
                          <span>{team.owner?.username || team.owner?.name || 'Unknown'}</span>
                        </div>
                      )}
                    />
                    <Column
                      field="members_count"
                      header="Members"
                      body={(team) => (
                        <div className="flex items-center gap-1">
                          <i className="pi pi-users text-gray-500"></i>
                          <span>{team.members_count || 0}</span>
                        </div>
                      )}
                    />
                    <Column
                      field="is_active"
                      header="Status"
                      body={(team) => (
                        <span className={`px-2 py-1 rounded text-xs ${
                          team.is_active ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'
                        }`}>
                          {team.is_active ? 'Active' : 'Inactive'}
                        </span>
                      )}
                    />
                    <Column
                      field="created_at"
                      header="Created"
                      body={(team) => new Date(team.created_at).toLocaleDateString('de-DE')}
                    />
                  </DataTable>

                  {/* Action Buttons */}
                  {selectedTeamIds.length > 0 && (
                    <div className="flex justify-between items-center pt-4 border-t border-gray-200 mt-4">
                      <div className="text-sm text-gray-500">
                        {selectedTeamIds.length} team{selectedTeamIds.length !== 1 ? 's' : ''} selected
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          label="Clear Selection"
                          icon="pi pi-times"
                          onClick={() => setSelectedTeamIds([])}
                          className="p-button-text"
                        />
                        <Button
                          label={`Assign Teams (${selectedTeamIds.length})`}
                          icon="pi pi-check"
                          onClick={handleAssignTeams}
                          disabled={!projectId || assigningTeams}
                          loading={assigningTeams}
                        />
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </Card>
        </div>
          </>
        )}
      </div>
    </TabContent>
  );
}