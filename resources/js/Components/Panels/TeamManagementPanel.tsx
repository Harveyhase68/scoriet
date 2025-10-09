import React, { useRef, useState, useEffect, useCallback } from 'react';
import { TabContentProps } from '@/types';
import { useProject } from '@/contexts/ProjectContext';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { InputText } from 'primereact/inputtext';
import { Badge } from 'primereact/badge';
import { Toolbar } from 'primereact/toolbar';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { Toast } from 'primereact/toast';
import TeamModal from '@/Components/Modals/TeamModal';
import MemberModal from '@/Components/Modals/MemberModal';

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

interface TeamMember {
  id: number;
  user_id: number;
  role: string;
  joined_at: string;
  user: {
    id: number;
    name: string;
    email: string;
    username?: string;
  };
}

interface Team {
  id: number;
  name: string;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
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
  members: TeamMember[];
  members_count?: number;
}

interface TeamManagementPanelProps {
  filterByProject?: boolean;
  updateTabTitle?: (newTitle: string) => void;
  forceProjectId?: number; // Force the panel to use this project ID instead of the selected project
}

export default function TeamManagementPanel({ filterByProject = false, updateTabTitle, forceProjectId }: TeamManagementPanelProps) {
  // Use Project Context to get current project
  const { selectedProject } = useProject();
  const projectId = forceProjectId !== undefined ? forceProjectId : (filterByProject ? selectedProject?.id : undefined);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [globalFilter, setGlobalFilter] = useState('');
  const [forcedProject, setForcedProject] = useState<any>(null);
  
  // Modal states
  const [teamModalVisible, setTeamModalVisible] = useState(false);
  const [memberModalVisible, setMemberModalVisible] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [selectedTeamForMembers, setSelectedTeamForMembers] = useState<Team | null>(null);
  
  const toast = useRef<Toast>(null);

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

  // Update tab title when project changes (only for filtered panels)
  useEffect(() => {
    if (filterByProject && updateTabTitle) {
      if (forcedProject) {
        updateTabTitle(`Team Management: ${forcedProject.name}`);
      } else if (selectedProject) {
        updateTabTitle(`Team Management: ${selectedProject.name}`);
      }
    }
  }, [filterByProject, updateTabTitle, selectedProject, forcedProject]);

  const loadTeams = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (!token) {
        throw new Error('Not authenticated');
      }

      const url = projectId ? `/api/teams?project=${projectId}` : '/api/teams?all=true';
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load teams');
      }

      const data = await response.json();

      // Teams API returns { owned_teams: [], member_teams: [] }
      let teamsArray = [];
      if (data.owned_teams || data.member_teams) {
        teamsArray = [...(data.owned_teams || []), ...(data.member_teams || [])];
      } else if (data.teams) {
        teamsArray = data.teams;
      } else if (Array.isArray(data)) {
        teamsArray = data;
      }

      setTeams(teamsArray);
    } catch {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to load teams',
        life: 3000
      });
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadTeams();
  }, [loadTeams]);

  const handleCreateTeam = () => {
    setEditingTeam(null);
    setTeamModalVisible(true);
  };

  const handleEditTeam = (team: Team) => {
    setEditingTeam(team);
    setTeamModalVisible(true);
  };

  const handleDeleteTeam = (team: Team) => {
    confirmDialog({
      message: `Are you sure you want to delete the team "${team.name}"? This action cannot be undone.`,
      header: 'Delete Team',
      icon: 'pi pi-exclamation-triangle',
      defaultFocus: 'reject',
      acceptClassName: 'p-button-danger',
      accept: async () => {
        try {
          const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
          if (!token) {
            throw new Error('Not authenticated');
          }

          const response = await fetch(`/api/teams/${team.id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/json',
            },
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to delete team');
          }

          toast.current?.show({
            severity: 'success',
            summary: 'Success',
            detail: 'Team deleted successfully',
            life: 3000
          });

          loadTeams();
        } catch (error) {
          // Error deleting team
          toast.current?.show({
            severity: 'error',
            summary: 'Error',
            detail: error instanceof Error ? error.message : 'Failed to delete team',
            life: 3000
          });
        }
      }
    });
  };

  const handleManageMembers = (team: Team) => {
    setSelectedTeamForMembers(team);
    setMemberModalVisible(true);
  };

  const onTeamSaved = () => {
    setTeamModalVisible(false);
    loadTeams();
    toast.current?.show({
      severity: 'success',
      summary: 'Success',
      detail: editingTeam ? 'Team updated successfully' : 'Team created successfully',
      life: 3000
    });
  };

  const onMembersSaved = () => {
    setMemberModalVisible(false);
    loadTeams();
  };

  // Toolbar content
  const leftToolbarTemplate = () => {
    return (
      <div className="flex flex-wrap gap-2">
        <Button
          label="New Team"
          icon="pi pi-plus"
          className="p-button-success"
          onClick={handleCreateTeam}
        />
      </div>
    );
  };

  const rightToolbarTemplate = () => {
    return (
      <div className="flex flex-wrap gap-2">
        <InputText
          type="search"
          placeholder="Search teams here..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="w-64"
        />
      </div>
    );
  };

  // Column templates
  const nameBodyTemplate = (team: Team) => {
    return (
      <div className="flex flex-col">
        <span className="font-medium">{team.name}</span>
        {team.description && (
          <span className="text-sm text-gray-500">{team.description}</span>
        )}
      </div>
    );
  };

  const ownerBodyTemplate = (team: Team) => {
    return (
      <div className="flex items-center gap-2">
        <i className="pi pi-user text-gray-500"></i>
        <span>{team.owner?.username || team.owner?.name || 'Unknown'}</span>
      </div>
    );
  };

  const membersBodyTemplate = (team: Team) => {
    const memberCount = team.members?.length || team.members_count || 0;
    return (
      <div className="flex items-center gap-2">
        <i className="pi pi-users text-gray-500"></i>
        <Badge value={memberCount} />
      </div>
    );
  };

  const statusBodyTemplate = (team: Team) => {
    return (
      <Badge
        value={team.is_active ? 'Active' : 'Inactive'}
        severity={team.is_active ? 'success' : 'secondary'}
      />
    );
  };

  const projectBodyTemplate = (team: Team) => {
    // Use projects array if available, otherwise fall back to project for backward compatibility
    if (team.projects && team.projects.length > 0) {
      return (
        <div className="flex items-center gap-2">
          <i className="pi pi-briefcase text-gray-500"></i>
          <span>{team.projects.map(p => p.name).join(', ')}</span>
        </div>
      );
    } else if (team.project) {
      // Fallback for old data structure
      return (
        <div className="flex items-center gap-2">
          <i className="pi pi-briefcase text-gray-500"></i>
          <span>{team.project.name}</span>
        </div>
      );
    } else {
      return (
        <div className="flex items-center gap-2">
          <i className="pi pi-briefcase text-gray-500"></i>
          <span>No Projects</span>
        </div>
      );
    }
  };

  const createdBodyTemplate = (team: Team) => {
    return new Date(team.created_at).toLocaleDateString('de-DE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const actionsBodyTemplate = (team: Team) => {
    const currentUserId = parseInt(localStorage.getItem('user_id') || '0');
    const isOwner = team.project_owner_id === currentUserId;
    
    return (
      <div className="flex gap-1">
        <Button
          icon="pi pi-users"
          className="p-button-rounded p-button-text p-button-sm"
          tooltip="Manage Members"
          onClick={() => handleManageMembers(team)}
        />
        {isOwner && (
          <>
            <Button
              icon="pi pi-pencil"
              className="p-button-rounded p-button-text p-button-sm"
              tooltip="Edit Team"
              onClick={() => handleEditTeam(team)}
            />
            <Button
              icon="pi pi-trash"
              className="p-button-rounded p-button-text p-button-sm p-button-danger"
              tooltip="Delete Team"
              onClick={() => handleDeleteTeam(team)}
            />
          </>
        )}
      </div>
    );
  };

  return (
    <TabContent>
      <Toast ref={toast} />
      <ConfirmDialog />
      
      <div className="h-full flex flex-col">
        {/* Header Card */}
        <Card title="Team Management" className="m-4 mb-2">
          <div className="text-sm text-gray-400">
            Create, manage, and organize your teams. Assign team members and control access permissions.
          </div>
        </Card>

        {/* Toolbar */}
        <div className="mx-4 mb-4">
          <Toolbar 
            left={leftToolbarTemplate} 
            right={rightToolbarTemplate}
            className="border border-gray-200 rounded"
          />
        </div>

        {/* Teams Table */}
        <div className="flex-1 mx-4 mb-4">
          <Card className="h-full">
            <div className="h-full">
              <DataTable
                value={teams}
                loading={loading}
                globalFilter={globalFilter}
                emptyMessage="No teams found"
                paginator
                rows={10}
                rowsPerPageOptions={[5, 10, 20, 50]}
                className="p-datatable-sm"
                scrollable
                scrollHeight="500px"
                sortMode="multiple"
                removableSort
              >
                <Column
                  field="name"
                  header="Team Name"
                  body={nameBodyTemplate}
                  sortable
                  className="w-1/4"
                />
                <Column
                  field="owner.name"
                  header="Owner"
                  body={ownerBodyTemplate}
                  sortable
                  className="w-1/6"
                />
                <Column
                  field="members"
                  header="Members"
                  body={membersBodyTemplate}
                  className="w-24"
                />
                <Column
                  field="is_active"
                  header="Status"
                  body={statusBodyTemplate}
                  sortable
                  className="w-24"
                />
                <Column
                  field="projects"
                  header="Projects"
                  body={projectBodyTemplate}
                  sortable={false} // Can't sort by array of projects
                  className="w-1/6"
                />
                <Column
                  field="created_at"
                  header="Created"
                  body={createdBodyTemplate}
                  sortable
                  className="w-1/6"
                />
                <Column
                  header="Actions"
                  body={actionsBodyTemplate}
                  className="w-32"
                  headerClassName="text-center"
                  bodyClassName="text-center"
                />
              </DataTable>
            </div>
          </Card>
        </div>
      </div>

      {/* Team Modal */}
      <TeamModal
        visible={teamModalVisible}
        onHide={() => setTeamModalVisible(false)}
        team={editingTeam}
        onSave={onTeamSaved}
      />

      {/* Member Management Modal */}
      <MemberModal
        visible={memberModalVisible}
        onHide={() => setMemberModalVisible(false)}
        team={selectedTeamForMembers}
        onSave={onMembersSaved}
      />
    </TabContent>
  );
}