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
import { Dialog } from 'primereact/dialog';
import { Toast } from 'primereact/toast';
import TeamModal from '@/Components/Modals/TeamModal';
import MemberModal from '@/Components/Modals/MemberModal';
import { useTranslation, SupportedLanguage, getStoredLanguage } from '@/i18n';

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

interface TeamSubscription {
  id: number;
  expires_at: string | null;
  is_expired: boolean;
  is_soft_locked: boolean;
  days_remaining: number | null;
  can_unlock: boolean;
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
  // Subscription / Lock status
  is_soft_locked?: boolean;
  subscription_data?: TeamSubscription | null;
}

interface TeamManagementPanelProps {
  filterByProject?: boolean;
  updateTabTitle?: (newTitle: string) => void;
  forceProjectId?: number; // Force the panel to use this project ID instead of the selected project
}

export default function TeamManagementPanel({ filterByProject = false, updateTabTitle, forceProjectId }: TeamManagementPanelProps) {
  // i18n setup
  const [currentLanguage] = React.useState<SupportedLanguage>(getStoredLanguage());
  const { t } = useTranslation(currentLanguage);

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

  // Project link modal states
  const [linkModalVisible, setLinkModalVisible] = useState(false);
  const [teamToLink, setTeamToLink] = useState<Team | null>(null);
  const [allProjects, setAllProjects] = useState<any[]>([]);
  const [linkedProjectIds, setLinkedProjectIds] = useState<number[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);

  // Team unlock states
  const [unlockingTeam, setUnlockingTeam] = useState(false);
  const [teamToUnlock, setTeamToUnlock] = useState<Team | null>(null);

  // Team transfer states
  const [transferModalVisible, setTransferModalVisible] = useState(false);
  const [teamToTransfer, setTeamToTransfer] = useState<Team | null>(null);
  const [transferRecipientId, setTransferRecipientId] = useState<number | null>(null);
  const [transferEligibility, setTransferEligibility] = useState<any>(null);
  const [checkingTransfer, setCheckingTransfer] = useState(false);
  const [executingTransfer, setExecutingTransfer] = useState(false);
  const [transferWithSlot, setTransferWithSlot] = useState(false);
  const [teamMembersForTransfer, setTeamMembersForTransfer] = useState<TeamMember[]>([]);

  const toast = useRef<Toast>(null);

  // Load forced project data if forceProjectId is provided
  useEffect(() => {
    if (forceProjectId !== undefined) {
      const loadForcedProject = async () => {
        try {
          const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token') || sessionStorage.getItem('access_token');
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
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (!token) {
        throw new Error(t.applicationsmodal66);
      }

      const url = projectId ? `/api/teams?project=${projectId}` : '/api/teams?all=true';
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(t.projectpanel416);
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
        summary: t.membermodal335,
        detail: t.projectpanel416,
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
      header: t.teammanagementpanel200,
      icon: 'pi pi-exclamation-triangle',
      defaultFocus: 'reject',
      acceptClassName: 'p-button-danger',
      accept: async () => {
        try {
          const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token') || sessionStorage.getItem('access_token');
          if (!token) {
            throw new Error(t.applicationsmodal66);
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
            throw new Error(errorData.message || t.teammanagementpanel221);
          }

          toast.current?.show({
            severity: 'success',
            summary: t.membermodal323,
            detail: t.teamcontroller210,
            life: 3000
          });

          loadTeams();

          // Notify NavigationPanel to refresh teams
          window.dispatchEvent(new CustomEvent(t.panelt1506));
        } catch (error) {
          // Error deleting team
          toast.current?.show({
            severity: 'error',
            summary: t.membermodal335,
            detail: error instanceof Error ? error.message : t.teammanagementpanel221,
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
      summary: t.membermodal323,
      detail: editingTeam ? t.teamcontroller191 : t.teamcontroller117,
      life: 3000
    });

    // Notify NavigationPanel to refresh teams
    window.dispatchEvent(new CustomEvent(t.panelt1506));
  };

  const onMembersSaved = () => {
    setMemberModalVisible(false);
    loadTeams();
  };

  // Unlock a team (either renew existing subscription or create new slot)
  const handleUnlockExpiredTeam = async (team: Team) => {
    if (!team.subscription_data?.can_unlock) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Keine Berechtigung',
        detail: 'Nur Team-Owner oder Admins können das Team entsperren',
        life: 3000
      });
      return;
    }

    setUnlockingTeam(true);
    setTeamToUnlock(team);

    try {
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (!token) {
        throw new Error('Nicht authentifiziert');
      }

      // Use the new unified unlock endpoint
      const response = await fetch(`/api/teams/${team.id}/unlock`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.required_credits) {
          toast.current?.show({
            severity: 'error',
            summary: 'Nicht genug Credits',
            detail: `Benötigt: ${data.required_credits}, Vorhanden: ${data.current_credits}`,
            life: 5000
          });
        } else {
          throw new Error(data.error || data.message || 'Fehler beim Entsperren des Teams');
        }
        return;
      }

      // Notify about credit change
      window.dispatchEvent(new CustomEvent('creditsChanged'));

      // Reload teams
      await loadTeams();

      toast.current?.show({
        severity: 'success',
        summary: 'Erfolg',
        detail: `Team "${team.name}" wurde erfolgreich entsperrt!`,
        life: 5000
      });
    } catch (error) {
      toast.current?.show({
        severity: 'error',
        summary: 'Fehler',
        detail: error instanceof Error ? error.message : 'Fehler beim Entsperren',
        life: 3000
      });
    } finally {
      setUnlockingTeam(false);
      setTeamToUnlock(null);
    }
  };

  // Handle opening link modal
  const handleOpenLinkModal = async (team: Team) => {
    setTeamToLink(team);
    setLoadingProjects(true);
    setLinkModalVisible(true);

    try {
      // Load all user's projects
      const projects = await fetch('/api/user/projects', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Accept': 'application/json'
        }
      }).then(res => res.json()).then(data => data.projects || []);

      setAllProjects(projects);

      // Load linked projects for this team
      const linkedProjects = team.projects?.map(p => p.id) || [];
      setLinkedProjectIds(linkedProjects);
    } catch (error) {
      console.error('Error loading projects:', error);
      toast.current?.show({ severity: 'error', summary: 'Fehler', detail: 'Fehler beim Laden der Projekte' });
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

  // Open transfer modal and load team members
  const handleOpenTransferModal = async (team: Team) => {
    setTeamToTransfer(team);
    setTransferRecipientId(null);
    setTransferEligibility(null);
    setTransferWithSlot(false);
    setTransferModalVisible(true);

    // Load team members (excluding owner) as potential recipients
    try {
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      const response = await fetch(`/api/teams/${team.id}/members`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        const members = await response.json();
        // Filter out the current owner
        const currentUserId = parseInt(localStorage.getItem('user_id') || '0');
        const eligibleMembers = members.filter((m: TeamMember) => m.user_id !== currentUserId);
        setTeamMembersForTransfer(eligibleMembers);
      }
    } catch (error) {
      console.error('Error loading team members:', error);
      setTeamMembersForTransfer([]);
    }
  };

  // Check transfer eligibility when recipient is selected
  const handleCheckTransferEligibility = async (recipientId: number) => {
    if (!teamToTransfer) return;

    setTransferRecipientId(recipientId);
    setCheckingTransfer(true);
    setTransferEligibility(null);

    try {
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      const response = await fetch(`/api/teams/${teamToTransfer.id}/check-transfer`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ new_owner_id: recipientId }),
      });

      const data = await response.json();

      if (response.ok) {
        setTransferEligibility(data);
        // Pre-select slot transfer if recommended
        if (data.recommendation === 'with_slot') {
          setTransferWithSlot(true);
        }
      } else {
        toast.current?.show({
          severity: 'error',
          summary: 'Fehler',
          detail: data.message || 'Fehler beim Prüfen der Übertragung',
          life: 3000,
        });
      }
    } catch (_error) {
      toast.current?.show({
        severity: 'error',
        summary: 'Fehler',
        detail: 'Netzwerkfehler beim Prüfen der Übertragung',
        life: 3000,
      });
    } finally {
      setCheckingTransfer(false);
    }
  };

  // Execute the transfer
  const handleExecuteTransfer = async () => {
    if (!teamToTransfer || !transferRecipientId) return;

    setExecutingTransfer(true);

    try {
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      const response = await fetch(`/api/teams/${teamToTransfer.id}/transfer`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          new_owner_id: transferRecipientId,
          transfer_slot: transferWithSlot,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.current?.show({
          severity: 'success',
          summary: 'Erfolg',
          detail: data.message || 'Team erfolgreich übertragen',
          life: 5000,
        });

        setTransferModalVisible(false);
        loadTeams();

        // Notify NavigationPanel to refresh teams
        window.dispatchEvent(new CustomEvent('teams-updated'));
      } else {
        toast.current?.show({
          severity: 'error',
          summary: 'Fehler',
          detail: data.message || 'Fehler beim Übertragen des Teams',
          life: 5000,
        });
      }
    } catch (_error) {
      toast.current?.show({
        severity: 'error',
        summary: 'Fehler',
        detail: 'Netzwerkfehler beim Übertragen',
        life: 3000,
      });
    } finally {
      setExecutingTransfer(false);
    }
  };

  const handleApplyProjectLinks = async () => {
    if (!teamToLink) return;

    try {
      console.log('Updating team links:', teamToLink.id, 'with projects:', linkedProjectIds);
      const response = await fetch(`/api/teams/${teamToLink.id}/projects`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ project_ids: linkedProjectIds })
      });

      console.log('Response status:', response.status);
      const responseData = await response.json();
      console.log('Response data:', responseData);

      if (!response.ok) {
        throw new Error(responseData.error || responseData.message || 'Failed to update team links');
      }

      toast.current?.show({ severity: 'success', summary: 'Erfolg', detail: 'Team-Verknüpfungen erfolgreich aktualisiert' });
      setLinkModalVisible(false);
      loadTeams();
    } catch (error: any) {
      console.error('Error updating team links:', error);
      const errorMsg = error.message || 'Fehler beim Aktualisieren der Verknüpfungen';
      toast.current?.show({ severity: 'error', summary: 'Fehler', detail: errorMsg });
    }
  };

  // Toolbar content
  const leftToolbarTemplate = () => {
    return (
      <div className="flex flex-wrap gap-2">
        <Button
          label={t.teammanagementpanel277}
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
          placeholder={t.teammanagementpanel291}
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
        <div className="flex items-center gap-2">
          {team.is_soft_locked && <i className="pi pi-lock text-red-500" />}
          <span className={`font-medium ${team.is_soft_locked ? 'text-red-400' : ''}`}>{team.name}</span>
        </div>
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
        <span>{team.owner?.username || team.owner?.name || t.testprojectschemas50}</span>
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
    // Show locked status if team is soft-locked
    if (team.is_soft_locked) {
      return (
        <div className="flex items-center gap-1">
          <i className="pi pi-lock text-red-500" />
          <Badge value="Gesperrt" severity="danger" />
        </div>
      );
    }

    // Show expiry warning if within 14 days
    if (team.subscription_data?.days_remaining !== null &&
        team.subscription_data?.days_remaining !== undefined &&
        team.subscription_data.days_remaining <= 14) {
      return (
        <div className="flex items-center gap-1">
          <i className="pi pi-exclamation-triangle text-yellow-500" />
          <Badge value={`${team.subscription_data.days_remaining} Tage`} severity="warning" />
        </div>
      );
    }

    return (
      <Badge
        value={team.is_active ? t.templatesStatusActive : t.manageteammodal328}
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

    // Check if user is admin in this team
    const currentUserMember = team.members?.find(m => m.user_id === currentUserId);
    const isAdmin = currentUserMember?.role === 'admin';
    const canManageTeam = isOwner || isAdmin;

    // If team is soft-locked, show view, transfer (for owner), and unlock button
    if (team.is_soft_locked) {
      const canUnlock = team.subscription_data?.can_unlock;
      return (
        <div className="flex gap-1 items-center">
          <Button
            icon="pi pi-users"
            className="p-button-rounded p-button-text p-button-sm"
            tooltip="Mitglieder anzeigen"
            onClick={() => handleManageMembers(team)}
          />
          {/* Transfer button - Owner can pass the locked team to someone else */}
          {isOwner && (
            <Button
              icon="pi pi-arrow-right-arrow-left"
              className="p-button-rounded p-button-text p-button-warning p-button-sm"
              tooltip="Gesperrtes Team übertragen"
              onClick={() => handleOpenTransferModal(team)}
            />
          )}
          {canUnlock && (
            <Button
              icon={unlockingTeam && teamToUnlock?.id === team.id ? "pi pi-spinner pi-spin" : "pi pi-unlock"}
              label="50 Credits"
              className="p-button-rounded p-button-sm"
              style={{ backgroundColor: '#2563eb', borderColor: '#2563eb', color: 'white' }}
              tooltip="Team entsperren (50 Credits)"
              onClick={() => handleUnlockExpiredTeam(team)}
              disabled={unlockingTeam}
            />
          )}
          {!canUnlock && !isOwner && (
            <span className="text-xs text-gray-400 ml-2">
              Nur Owner kann entsperren/übertragen
            </span>
          )}
        </div>
      );
    }

    // Normal actions for active teams
    return (
      <div className="flex gap-1">
        {/* Link button - only for Owner and Admin */}
        {canManageTeam && (
          <Button
            icon="pi pi-link"
            className="p-button-rounded p-button-text p-button-success p-button-sm"
            tooltip="Mit Projekten verknüpfen"
            onClick={() => handleOpenLinkModal(team)}
          />
        )}
        <Button
          icon="pi pi-users"
          className="p-button-rounded p-button-text p-button-sm"
          tooltip={t.teammanagementpanel386}
          onClick={() => handleManageMembers(team)}
        />
        {/* Transfer button - only Owner */}
        {isOwner && (
          <Button
            icon="pi pi-arrow-right-arrow-left"
            className="p-button-rounded p-button-text p-button-warning p-button-sm"
            tooltip="Team übertragen"
            onClick={() => handleOpenTransferModal(team)}
          />
        )}
        {/* Edit button - Owner and Admin */}
        {canManageTeam && (
          <Button
            icon="pi pi-pencil"
            className="p-button-rounded p-button-text p-button-sm"
            tooltip={t.teammanagementpanel394}
            onClick={() => handleEditTeam(team)}
          />
        )}
        {/* Delete button - only Owner */}
        {isOwner && (
          <Button
            icon="pi pi-trash"
            className="p-button-rounded p-button-text p-button-sm p-button-danger"
            tooltip={t.teammanagementpanel200}
            onClick={() => handleDeleteTeam(team)}
          />
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
        <Card title={t.panelsewnavigationpanel477} className="m-4 mb-2">
          <div className="text-sm text-gray-400">
            {t.teammanagementpanel417}
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
                emptyMessage={t.teammanagementpanel439}
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
                  header={t.manageteammodal312}
                  body={nameBodyTemplate}
                  sortable
                  className="w-1/4"
                />
                <Column
                  field="owner.name"
                  header={t.manageteammodal320}
                  body={ownerBodyTemplate}
                  sortable
                  className="w-1/6"
                />
                <Column
                  field="members"
                  header={t.projectpanel748}
                  body={membersBodyTemplate}
                  className="w-24"
                />
                <Column
                  field="is_active"
                  header={t.applicationsmodal335}
                  body={statusBodyTemplate}
                  sortable
                  className="w-24"
                />
                <Column
                  field="projects"
                  header={t.createteammodal117}
                  body={projectBodyTemplate}
                  sortable={false} // Can't sort by array of projects
                  className="w-1/6"
                />
                <Column
                  field="created_at"
                  header={t.databasemanagementpanel861}
                  body={createdBodyTemplate}
                  sortable
                  className="w-1/6"
                />
                <Column
                  header={t.applicationsmodal354}
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

      {/* Link Team to Projects Modal */}
      <Dialog
        header={`Team verknüpfen: ${teamToLink?.name}`}
        visible={linkModalVisible}
        onHide={() => setLinkModalVisible(false)}
        footer={
          <>
            <Button
              label="Abbrechen"
              onClick={() => setLinkModalVisible(false)}
              className="p-button-secondary"
            />
            <Button
              label="Anwenden"
              onClick={handleApplyProjectLinks}
              className="p-button-primary"
              disabled={loadingProjects}
            />
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

      {/* Team Transfer Modal */}
      <Dialog
        header={`Team übertragen: ${teamToTransfer?.name}`}
        visible={transferModalVisible}
        onHide={() => setTransferModalVisible(false)}
        footer={
          <>
            <Button
              label="Abbrechen"
              onClick={() => setTransferModalVisible(false)}
              className="p-button-secondary"
              disabled={executingTransfer}
            />
            <Button
              label={executingTransfer ? "Wird übertragen..." :
                     (transferEligibility?.transfer_outcomes?.without_slot?.team_locked && !transferWithSlot)
                       ? "Gesperrt übertragen"
                       : "Team übertragen"}
              icon={executingTransfer ? "pi pi-spinner pi-spin" :
                    (transferEligibility?.transfer_outcomes?.without_slot?.team_locked && !transferWithSlot)
                      ? "pi pi-lock"
                      : "pi pi-arrow-right-arrow-left"}
              onClick={handleExecuteTransfer}
              className={transferEligibility?.transfer_outcomes?.without_slot?.team_locked && !transferWithSlot
                ? "p-button-secondary"
                : "p-button-warning"}
              disabled={!transferRecipientId || !transferEligibility || executingTransfer}
            />
          </>
        }
        style={{ width: '650px' }}
        modal
        closable={!executingTransfer}
        draggable={true}
        resizable={true}
      >
        <div className="space-y-4">
          {/* Info Box */}
          <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-3">
            <p className="text-yellow-300 text-sm flex items-center gap-2">
              <i className="pi pi-exclamation-triangle"></i>
              <strong>Achtung:</strong> Nach der Übertragung werden Sie zum Admin und können das Team nicht mehr löschen.
            </p>
          </div>

          {/* Step 1: Select Recipient */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              1. Wählen Sie den neuen Owner:
            </label>
            {teamMembersForTransfer.length === 0 ? (
              <div className="text-gray-400 text-sm p-3 border border-gray-600 rounded">
                <i className="pi pi-info-circle mr-2"></i>
                Keine Team-Mitglieder vorhanden. Fügen Sie zuerst Mitglieder zum Team hinzu.
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {teamMembersForTransfer.map((member) => (
                  <div
                    key={member.user_id}
                    className={`flex items-center justify-between p-3 border rounded cursor-pointer transition-colors ${
                      transferRecipientId === member.user_id
                        ? 'border-blue-500 bg-blue-900/20'
                        : 'border-gray-600 hover:bg-gray-700'
                    }`}
                    onClick={() => handleCheckTransferEligibility(member.user_id)}
                  >
                    <div className="flex items-center gap-3">
                      <i className="pi pi-user text-gray-400"></i>
                      <div>
                        <div className="font-medium text-white">
                          {member.user.username || member.user.name}
                        </div>
                        <div className="text-sm text-gray-400">{member.user.email}</div>
                      </div>
                    </div>
                    <Badge value={member.role} severity={member.role === 'admin' ? 'info' : 'secondary'} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Step 2: Show transfer options */}
          {checkingTransfer && (
            <div className="flex justify-center items-center py-4">
              <i className="pi pi-spin pi-spinner text-2xl text-blue-500"></i>
              <span className="ml-2 text-gray-400">Prüfe Übertragungsmöglichkeiten...</span>
            </div>
          )}

          {transferEligibility && !checkingTransfer && (
            <div className="border border-gray-600 rounded-lg p-4 space-y-3">
              <label className="block text-sm font-medium text-gray-300">
                2. Übertragung an {transferEligibility.recipient.username || transferEligibility.recipient.name}:
              </label>

              {/* Recipient is Patron - always OK */}
              {transferEligibility.recipient.is_patron && (
                <div className="bg-green-900/20 border border-green-700 rounded p-3">
                  <p className="text-green-300 text-sm flex items-center gap-2">
                    <i className="pi pi-check-circle"></i>
                    <strong>Patron-User:</strong> Kann unbegrenzt Teams besitzen. Team bleibt aktiv!
                  </p>
                </div>
              )}

              {/* Recipient has available slot - also OK */}
              {!transferEligibility.recipient.is_patron && transferEligibility.transfer_outcomes?.without_slot?.team_active && (
                <div className="bg-green-900/20 border border-green-700 rounded p-3">
                  <p className="text-green-300 text-sm flex items-center gap-2">
                    <i className="pi pi-check-circle"></i>
                    <strong>Slot verfügbar:</strong> Der Empfänger hat freie Team-Slots. Team bleibt aktiv!
                  </p>
                </div>
              )}

              {/* Recipient needs slot - Show options */}
              {!transferEligibility.recipient.is_patron &&
               transferEligibility.transfer_outcomes?.without_slot?.team_locked && (
                <div className="space-y-3">
                  <div className="bg-orange-900/20 border border-orange-700 rounded p-3">
                    <p className="text-orange-300 text-sm">
                      <i className="pi pi-exclamation-circle mr-2"></i>
                      Der Empfänger hat keine freien Team-Slots ({transferEligibility.recipient.owned_teams}/{transferEligibility.recipient.max_teams} Teams).
                    </p>
                  </div>

                  {/* Option A: Transfer with slot (if owner has one) */}
                  {transferEligibility.owner.has_slot && (
                    <div
                      className={`p-3 border rounded cursor-pointer transition-colors ${
                        transferWithSlot
                          ? 'border-green-500 bg-green-900/20'
                          : 'border-gray-600 hover:bg-gray-700'
                      }`}
                      onClick={() => setTransferWithSlot(true)}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          checked={transferWithSlot}
                          onChange={() => setTransferWithSlot(true)}
                          className="w-4 h-4"
                        />
                        <div className="flex-1">
                          <div className="font-medium text-white flex items-center gap-2">
                            <i className="pi pi-check-circle text-green-400"></i>
                            Slot mitübertragen
                          </div>
                          <div className="text-sm text-gray-400">
                            Sie geben Ihren Team-Slot an den Empfänger ab (läuft ab am{' '}
                            {new Date(transferEligibility.owner.slot_expiry).toLocaleDateString('de-DE')}).
                            <span className="text-green-400 ml-1">→ Team bleibt aktiv!</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Option B: Transfer without slot (team will be locked) */}
                  <div
                    className={`p-3 border rounded cursor-pointer transition-colors ${
                      !transferWithSlot
                        ? 'border-orange-500 bg-orange-900/20'
                        : 'border-gray-600 hover:bg-gray-700'
                    }`}
                    onClick={() => setTransferWithSlot(false)}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        checked={!transferWithSlot}
                        onChange={() => setTransferWithSlot(false)}
                        className="w-4 h-4"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-white flex items-center gap-2">
                          <i className="pi pi-lock text-orange-400"></i>
                          Ohne Slot übertragen
                        </div>
                        <div className="text-sm text-gray-400">
                          Das Team wird <span className="text-orange-400">gesperrt</span> übertragen.
                          Der Empfänger kann es später freischalten (50 Credits) oder weitergeben.
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Info box about locked teams */}
                  {!transferWithSlot && (
                    <div className="bg-blue-900/20 border border-blue-700 rounded p-3">
                      <p className="text-blue-300 text-sm">
                        <i className="pi pi-info-circle mr-2"></i>
                        <strong>Info:</strong> Ein gesperrtes Team kann eingesehen aber nicht bearbeitet werden.
                        Der neue Owner kann jederzeit freischalten oder das Team weitergeben.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Warning about project links that will be removed */}
              {transferEligibility.project_links?.unlink_count > 0 && (
                <div className="bg-red-900/20 border border-red-700 rounded-lg p-3 mt-3">
                  <p className="text-red-300 text-sm font-medium flex items-center gap-2 mb-2">
                    <i className="pi pi-exclamation-triangle"></i>
                    {transferEligibility.project_links.unlink_count} Projekt-Verknüpfung(en) werden entfernt:
                  </p>
                  <ul className="text-red-200 text-sm space-y-1 ml-6">
                    {transferEligibility.project_links.to_unlink.map((project: any) => (
                      <li key={project.id} className="flex items-center gap-2">
                        <i className="pi pi-times-circle text-red-400"></i>
                        <span className="font-medium">{project.name}</span>
                        <span className="text-red-400 text-xs">(privat, gehört Ihnen)</span>
                      </li>
                    ))}
                  </ul>
                  <p className="text-red-300 text-xs mt-2 border-t border-red-700 pt-2">
                    <i className="pi pi-lightbulb mr-1"></i>
                    <strong>Tipp:</strong> Sie können diese Projekte zuerst an den neuen Owner übertragen, um die Verknüpfung zu behalten.
                  </p>
                </div>
              )}

              {/* Info about projects that will remain linked */}
              {transferEligibility.project_links?.to_keep?.length > 0 && (
                <div className="bg-green-900/20 border border-green-700 rounded p-3 mt-3">
                  <p className="text-green-300 text-sm flex items-center gap-2">
                    <i className="pi pi-check-circle"></i>
                    {transferEligibility.project_links.to_keep.length} Projekt-Verknüpfung(en) bleiben erhalten:
                  </p>
                  <ul className="text-green-200 text-xs mt-1 ml-6">
                    {transferEligibility.project_links.to_keep.map((project: any) => (
                      <li key={project.id}>
                        {project.name} ({project.reason === 'public' ? 'öffentlich' : 'gehört dem Empfänger'})
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </Dialog>
    </TabContent>
  );
}