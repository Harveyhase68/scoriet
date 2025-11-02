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
import { useTranslation, SupportedLanguage, getStoredLanguage } from '@/i18n';
import { useToast } from '@/contexts/ToastContext';

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
  // i18n setup
  const [currentLanguage] = React.useState<SupportedLanguage>(getStoredLanguage());
  const { t } = useTranslation(currentLanguage);
  const toast = useToast();

  const { selectedProject } = useProject();
  // Use forceProjectId if provided, otherwise use selectedProject
  const projectId = forceProjectId !== undefined ? forceProjectId : (filterByProject ? selectedProject?.id : (source === 'project-management' ? selectedProject?.id : undefined));
  const [teams, setTeams] = useState<Team[]>([]);
  const [assignedTeams, setAssignedTeams] = useState<Team[]>([]);
  const [availableTeams, setAvailableTeams] = useState<Team[]>([]);
  const [selectedTeamIdsByProject, setSelectedTeamIdsByProject] = useState<Record<number, number[]>>({});
  const [selectedTeamIds, setSelectedTeamIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigningTeams, setAssigningTeams] = useState(false);
  const [, setError] = useState(''); // error state for future use
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
            throw new Error(t.applicationsmodal66);
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
        } catch {
          // Error loading forced project
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
        setError(error instanceof Error ? error.message : t.teamspanel128);
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
      setError(error instanceof Error ? error.message : t.teamspanel172);
    }
  }, []);

  // Load all projects for menu view
  const loadProjects = async () => {
    try {
      // setLoadingProjects(true);
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (!token) {
        throw new Error(t.applicationsmodal66);
      }

      const response = await fetch('/api/projects', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(t.teamspanel193);
      }

      const data = await response.json();
      setProjects(data.projects || []);
    } catch (error) {
      setError(error instanceof Error ? error.message : t.teamspanel199);
    } finally {
      // setLoadingProjects(false);
    }
  };

  // When projectId changes, reload project teams
  useEffect(() => {
    if (projectId) {
      loadProjectTeams(projectId);
    } else if (!loading && source === 'menu') {
      // No project selected, show all teams as available (only in menu mode)
      loadAllTeams().then(allTeams => {
        setAvailableTeams(allTeams);
        setAssignedTeams([]);
        setSelectedTeamIdsByProject({});
      });
    } else if (source === 'project-management' && selectedProject && !forceProjectId) {
      // In project-management mode, use selected project if no forceProjectId
      loadProjectTeams(selectedProject.id);
    }
  }, [projectId, loadProjectTeams, forceProjectId, loading, source, selectedProject]);

  const loadAllTeams = async () => {
    try {
      setError('');
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (!token) {
        throw new Error(t.applicationsmodal66);
      }

      const response = await fetch('/api/teams?all=true', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(t.projectpanel416);
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
      setError(error instanceof Error ? error.message : t.teamspanel255);
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
        throw new Error(t.applicationsmodal66);
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
          throw new Error(errorData.message || t.teamspanel295);
        }
        
        totalAssigned += teamIds.length;
      }

      // Refresh teams data
      await loadAllTeams();
      
      // In menu mode, also refresh project teams for each affected project
      if (source === 'menu') {
        for (const projectIdStr of Object.keys(selectedTeamIdsByProject)) {
          const projectId = parseInt(projectIdStr);
          await loadProjectTeams(projectId);
        }
        
        // Update the teams state to reflect the new project assignments
        setTeams(prev => {
          const updatedTeams = [...prev];
          
          // For each project and each assigned team, update the team's projects array
          for (const [projectIdStr, teamIds] of Object.entries(selectedTeamIdsByProject)) {
            const projectId = parseInt(projectIdStr);
            const project = projects.find(p => p.id === projectId);
            
            if (project) {
              teamIds.forEach(teamId => {
                const teamIndex = updatedTeams.findIndex(t => t.id === teamId);
                if (teamIndex >= 0) {
                  // Add the project to the team's projects array if not already there
                  const team = updatedTeams[teamIndex];
                  const hasProject = (team.projects || []).some(p => p.id === projectId);
                  
                  if (!hasProject) {
                    updatedTeams[teamIndex] = {
                      ...team,
                      projects: [...(team.projects || []), { id: project.id, name: project.name }]
                    };
                  }
                }
              });
            }
          }
          
          return updatedTeams;
        });
      }
      
      setSelectedTeamIdsByProject({});
      toast.showSuccess(`${totalAssigned}`+t.teamspanel349);

      // Trigger navigation tree refresh
      window.dispatchEvent(new Event(t.panelt1506));

    } catch (error: any) {
      toast.showError(error instanceof Error ? error.message : t.teamspanel350);
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
        throw new Error(t.applicationsmodal66);
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

      // Try to find the team in assignedTeams, or fallback to all teams
      let removedTeam = (assignedTeams || []).find(t => t.id === teamId);
      if (!removedTeam) {
        // Fallback: try to find in all teams
        removedTeam = teams.find(t => t.id === teamId);
      }

      // Update local state immediately
      setAssignedTeams(prev => (prev || []).filter(t => t.id !== teamId));
      if (removedTeam) {
        setAvailableTeams(prev => [...prev, removedTeam]);
      }

      // Update the teams state to reflect the removal from the project
      setTeams(prev => {
        return prev.map(team => {
          if (team.id === teamId) {
            // Remove the project from the team's projects array
            return {
              ...team,
              projects: (team.projects || []).filter(p => p.id !== projectId)
            };
          }
          return team;
        });
      });

      // Reload data from server to ensure consistency - ALWAYS with await!
      await loadAllTeams();
      // Also refresh the project teams if we have a project
      if (projectId) {
        await loadProjectTeams(projectId);
      }

      // Show success toast AFTER data is reloaded
      const teamName = removedTeam?.name || 'Team';
      toast.showSuccess(`${teamName} ` + t.teamspanel430);

      // Trigger navigation tree refresh
      window.dispatchEvent(new Event(t.panelt1506));

    } catch (error: any) {
      toast.showError(error instanceof Error ? error.message : t.teamspanel425);
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
            <Card title={source === 'project-management' && projectId ? `Teams Assignment - ${(forcedProject || selectedProject)?.name || t.manageteammodal316}` : (projectId ? `Teams Project Assignment - ${(forcedProject || selectedProject)?.name || t.manageteammodal316}` : (source === 'menu' ? t.panelsewnavigationpanel170 : t.teamspanel457))} className="m-4 mb-2">
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
                      placeholder={t.teamspanel487}
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
                          // Get all teams (not just assigned ones) to show assignment status
                          const allTeamsForProject = teams.filter(() => {
                            // Include all teams owned by the current user
                            // Teams will be marked as assigned/unassigned in the UI
                            return true; // Show all teams, will filter by assignment status in UI
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
                                                <i className="pi pi-user"></i> {team.owner?.name || t.testprojectschemas50}
                                              </span>
                                              <span className="text-xs text-gray-400">
                                                <i className="pi pi-users"></i> {team.members_count || 0} {t.teamspanel711}
                                              </span>
                                              <span className={`text-xs px-2 py-1 rounded ${
                                                isAssignedToThisProject ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'
                                              }`}>
                                                {isAssignedToThisProject ? t.teamspanel557 : t.teamspanel552}
                                              </span>
                                            </div>
                                          </div>
                                        </div>
                                        
                                        <div className="flex items-center gap-2">
                                          {isAssignedToThisProject ? (
                                            <Button
                                              icon="pi pi-times"
                                              className="p-button-rounded p-button-text p-button-sm p-button-danger"
                                              tooltip={t.templatesRemoveFromProject}
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
                        label={t.templatesClearSelection}
                        icon="pi pi-times"
                        onClick={() => setSelectedTeamIdsByProject({})}
                        className="p-button-text"
                      />
                      <Button
                        label={t.teamspanel619}
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
                    emptyMessage={t.teammanagementpanel439}
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
                              tooltip={t.templatesRemoveFromProject}
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
                    
                    <Column field="name" header={t.manageteammodal312} sortable />
                    <Column field="description" header={t.createteammodal103} />
                    <Column
                      field="owner"
                      header={t.manageteammodal320}
                      body={(team) => (
                        <div className="flex items-center gap-2">
                          <i className="pi pi-user text-gray-500"></i>
                          <span>{team.owner?.username || team.owner?.name || t.testprojectschemas50}</span>
                        </div>
                      )}
                    />
                    <Column
                      field="members_count"
                      header={t.projectpanel748}
                      body={(team) => (
                        <div className="flex items-center gap-1">
                          <i className="pi pi-users text-gray-500"></i>
                          <span>{team.members_count || 0}</span>
                        </div>
                      )}
                    />
                    <Column
                      field="is_active"
                      header={t.applicationsmodal335}
                      body={(team) => (
                        <span className={`px-2 py-1 rounded text-xs ${
                          team.is_active ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'
                        }`}>
                          {team.is_active ? t.templatesStatusActive : t.manageteammodal328}
                        </span>
                      )}
                    />
                    <Column
                      field="created_at"
                      header={t.databasemanagementpanel861}
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
                          label={t.templatesClearSelection}
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