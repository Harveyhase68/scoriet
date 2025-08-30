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
  owner: {
    id: number;
    name: string;
    email: string;
    username?: string;
  };
  members_count?: number;
}

export default function TeamsPanel() {
  const { selectedProject } = useProject();
  const [teams, setTeams] = useState<Team[]>([]);
  const [assignedTeams, setAssignedTeams] = useState<Team[]>([]);
  const [availableTeams, setAvailableTeams] = useState<Team[]>([]);
  const [selectedTeamIds, setSelectedTeamIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigningTeams, setAssigningTeams] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Load teams on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        await loadAllTeams();
      } catch (err) {
        console.error('Error loading data:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Load teams assigned to a specific project
  const loadProjectTeams = useCallback(async (projectId: number) => {
    try {
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (!token) {
        return;
      }

      const response = await fetch(`/api/projects/${projectId}/teams/assigned`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });
      
      if (response.ok) {
        const assignedTeamsData = await response.json();
        
        // Extract assigned team IDs
        const assignedTeamIds = assignedTeamsData.map((team: Team) => team.id);
        
        // Split teams into assigned and available
        const assigned = teams.filter(t => assignedTeamIds.includes(t.id));
        const available = teams.filter(t => !assignedTeamIds.includes(t.id));
        
        // Update state
        setAssignedTeams(assigned);
        setAvailableTeams(available);
        
        // Clear any selected team IDs when switching projects
        setSelectedTeamIds([]);
      }
    } catch (err) {
      console.error('Error loading project teams:', err);
    }
  }, [teams]);

  // When teams are loaded and selectedProject changes, reload project teams
  useEffect(() => {
    if (teams.length > 0 && selectedProject) {
      loadProjectTeams(selectedProject.id);
    } else if (teams.length > 0 && !selectedProject) {
      // No project selected, show all teams as available
      setAvailableTeams(teams);
      setAssignedTeams([]);
      setSelectedTeamIds([]);
    }
  }, [teams, selectedProject, loadProjectTeams]);

  const loadAllTeams = async () => {
    try {
      setError('');
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch('/api/teams', {
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

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading teams');
    }
  };

  // Handle team assignment
  const handleAssignTeams = async () => {
    if (!selectedProject || selectedTeamIds.length === 0) return;

    setAssigningTeams(true);
    setError('');

    try {
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
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

      // Move assigned teams from available to assigned
      const newlyAssigned = availableTeams.filter(t => selectedTeamIds.includes(t.id));
      setAssignedTeams(prev => [...prev, ...newlyAssigned]);
      setAvailableTeams(prev => prev.filter(t => !selectedTeamIds.includes(t.id)));
      
      setSelectedTeamIds([]);
      setSuccess(`${selectedTeamIds.length} teams assigned to project successfully`);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error assigning teams');
    } finally {
      setAssigningTeams(false);
    }
  };

  // Handle team removal
  const handleRemoveTeam = async (teamId: number) => {
    if (!selectedProject) return;

    try {
      setError('');
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
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
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      await response.json();

      // Move team from assigned to available
      const removedTeam = assignedTeams.find(t => t.id === teamId);
      if (removedTeam) {
        setAssignedTeams(prev => prev.filter(t => t.id !== teamId));
        setAvailableTeams(prev => [...prev, removedTeam]);
        setSuccess(`Team "${removedTeam.name}" removed from project successfully`);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error removing team');
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
            <Card title={selectedProject ? `Teams Assignment - ${selectedProject.name}` : "Teams Assignment"} className="m-4 mb-2">
          <div className="flex flex-col gap-4">
            {/* Project Info */}
            {selectedProject && (
              <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 p-2 rounded">
                <i className="pi pi-briefcase"></i>
                <span>Working on: <strong>{selectedProject.name}</strong> by {selectedProject.owner.name}</span>
              </div>
            )}
            
            {!selectedProject && (
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
                  placeholder="Search teams..."
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
              ) : (
                <>
                  <DataTable
                    key={`teams-table-${selectedProject?.id || 'no-project'}-${selectedTeamIds.join('-')}-${assignedTeams.length}-${filteredAvailableTeams.length}`}
                    value={[...(assignedTeams || []), ...filteredAvailableTeams]}
                    className="p-datatable-sm"
                    emptyMessage="No teams found"
                    paginator
                    rows={10}
                    rowsPerPageOptions={[5, 10, 20]}
                    scrollable
                    scrollHeight="400px"
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
                        const someSelected = availableTeamIds.some(id => selectedTeamIds.includes(id));
                        
                        return (
                          <Checkbox
                            checked={allSelected}
                            indeterminate={someSelected && !allSelected ? true : undefined}
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
                              onClick={() => handleRemoveTeam(team.id)}
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
                          disabled={!selectedProject || assigningTeams}
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