import React, { useRef, useState, useEffect, useCallback } from 'react';
import { TabContentProps } from '@/types';
import { useProject } from '@/contexts/ProjectContext';
import { useTheme } from '@/contexts/ThemeContext';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { InputText } from 'primereact/inputtext';
import { Badge } from 'primereact/badge';
import { Toolbar } from 'primereact/toolbar';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { Dialog } from 'primereact/dialog';
import { Checkbox } from 'primereact/checkbox';
import { Toast } from 'primereact/toast';
import TeamModal from '@/Components/Modals/TeamModal';
import MemberModal from '@/Components/Modals/MemberModal';
import { useTranslation, SupportedLanguage, getStoredLanguage } from '@/i18n';
import { apiClient } from '@/lib/api';
import '@/Components/Panels/styles.css';

const TabContent: React.FC<TabContentProps & { colors: any }> = ({ children, style = {}, colors, ...rest }) => {
  const ref = useRef<HTMLDivElement>(null);
  const setFocus = () => ref.current?.focus();

  return (
    <div
      {...rest}
      ref={ref}
      tabIndex={-1}
      style={{
        flex: 1,
        padding: '5px 10px',
        backgroundColor: colors.bgSecondary,
        color: colors.textPrimary,
        ...style
      }}
      onMouseDownCapture={setFocus}
      onTouchStartCapture={setFocus}
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
  const { colors } = useTheme();

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
          const projectData = await apiClient.get(`/projects/${forceProjectId}`);
          setForcedProject(projectData);
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
        updateTabTitle(`${t.teammanagementpanel179}${forcedProject.name}`);
      } else if (selectedProject) {
        updateTabTitle(`${t.teammanagementpanel181}${selectedProject.name}`);
      }
    }
  }, [filterByProject, updateTabTitle, selectedProject, forcedProject]);

  const loadTeams = useCallback(async () => {
    try {
      setLoading(true);
      const endpoint = projectId ? `/teams?project=${projectId}` : '/teams?all=true';
      let data: any;
      try {
        data = await apiClient.get(endpoint);
      } catch {
        throw new Error(t.projectpanel416);
      }

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
      group: 'team-management',
      message: `${t.teammanagementpanel247}"${team.name}"?${t.teammanagementpanel247_2}`,
      header: t.teammanagementpanel200,
      icon: 'pi pi-exclamation-triangle',
      defaultFocus: 'reject',
      acceptClassName: 'p-button-danger',
      accept: async () => {
        try {
          try {
            await apiClient.delete(`/teams/${team.id}`);
          } catch (err: any) {
            throw new Error(err?.response?.data?.message || t.teammanagementpanel221);
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

  const handleManageRoles = (team: Team) => {
    const currentUserId = parseInt(localStorage.getItem('user_id') || '0');
    const isTeamOwner = Number(team.project_owner_id) === currentUserId;
    window.dispatchEvent(new CustomEvent('openTeamRolesPanel', {
      detail: {
        teamId: team.id,
        teamName: team.name,
        isOwner: isTeamOwner,
      }
    }));
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
        summary: t.teammanagementpanel337,
        detail: t.teammanagementpanel338,
        life: 3000
      });
      return;
    }

    setUnlockingTeam(true);
    setTeamToUnlock(team);

    try {
      // Use the new unified unlock endpoint
      try {
        await apiClient.post(`/teams/${team.id}/unlock`);
      } catch (err: any) {
        const data = err?.response?.data || {};
        if (data.required_credits) {
          toast.current?.show({
            severity: 'error',
            summary: t.teammanagementpanel369,
            detail: `${t.teammanagementpanel370_2}${data.required_credits}, ${t.teammanagementpanel370}${data.current_credits}`,
            life: 5000
          });
          return;
        }
        throw new Error(data.error || data.message || t.teammanagementpanel374);
      }

      // Notify about credit change
      window.dispatchEvent(new CustomEvent('creditsChanged'));

      // Reload teams
      await loadTeams();

      toast.current?.show({
        severity: 'success',
        summary: t.teammanagementpanel387,
        detail: `${t.teammanagementpanel388}"${team.name}"${t.teammanagementpanel388_2}`,
        life: 5000
      });
    } catch (error) {
      toast.current?.show({
        severity: 'error',
        summary: t.messageError,
        detail: error instanceof Error ? error.message : t.teammanagementpanel395,
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
      const data = await apiClient.get('/user/projects');
      setAllProjects(data.projects || []);

      // Load linked projects for this team
      const linkedProjects = team.projects?.map(p => Number(p.id)) || [];
      setLinkedProjectIds(linkedProjects);
    } catch (error) {
      console.error(t.teammanagementpanel425, error);
      toast.current?.show({ severity: 'error', summary: t.messageError, detail: t.teammanagementpanel426 });
      setAllProjects([]);
      setLinkedProjectIds([]);
    } finally {
      setLoadingProjects(false);
    }
  };

  const handleToggleProjectLink = (projectId: number) => {
    const numId = Number(projectId);
    if (linkedProjectIds.includes(numId)) {
      setLinkedProjectIds(linkedProjectIds.filter(id => id !== numId));
    } else {
      setLinkedProjectIds([...linkedProjectIds, numId]);
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
      const members = await apiClient.get(`/teams/${team.id}/members`);
      // Filter out the current owner
      const currentUserId = parseInt(localStorage.getItem('user_id') || '0');
      const eligibleMembers = members.filter((m: TeamMember) => Number(m.user_id) !== currentUserId);
      setTeamMembersForTransfer(eligibleMembers);
    } catch (error) {
      console.error(t.teammanagementpanel469, error);
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
      try {
        const data = await apiClient.post(`/teams/${teamToTransfer.id}/check-transfer`, {
          new_owner_id: recipientId,
        });
        setTransferEligibility(data);
        // Pre-select slot transfer if recommended
        if (data.recommendation === 'with_slot') {
          setTransferWithSlot(true);
        }
      } catch (err: any) {
        toast.current?.show({
          severity: 'error',
          summary: t.messageError,
          detail: err?.response?.data?.message || t.teammanagementpanel506,
          life: 3000,
        });
      }
    } catch (_error) {
      toast.current?.show({
        severity: 'error',
        summary: t.messageError,
        detail: t.teammanagementpanel514,
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
      try {
        const data = await apiClient.post(`/teams/${teamToTransfer.id}/transfer`, {
          new_owner_id: transferRecipientId,
          transfer_slot: transferWithSlot,
        });
        toast.current?.show({
          severity: 'success',
          summary: t.teammanagementpanel548,
          detail: data.message || t.teammanagementpanel548,
          life: 5000,
        });

        setTransferModalVisible(false);
        loadTeams();

        // Notify NavigationPanel to refresh teams
        window.dispatchEvent(new CustomEvent('teams-updated'));
      } catch (err: any) {
        toast.current?.show({
          severity: 'error',
          summary: t.messageError,
          detail: err?.response?.data?.message || t.teammanagementpanel561,
          life: 5000,
        });
      }
    } catch (_error) {
      toast.current?.show({
        severity: 'error',
        summary: t.teammanagementpanel568,
        detail: t.teammanagementpanel569,
        life: 3000,
      });
    } finally {
      setExecutingTransfer(false);
    }
  };

  const handleApplyProjectLinks = async () => {
    if (!teamToLink) return;

    try {
      try {
        await apiClient.put(`/teams/${teamToLink.id}/projects`, {
          project_ids: linkedProjectIds,
        });
      } catch (err: any) {
        const responseData = err?.response?.data || {};
        throw new Error(responseData.error || responseData.message || t.teammanagementpanel595);
      }

      toast.current?.show({ severity: 'success', summary: t.teammanagementpanel597, detail: t.teammanagementpanel597_2 });
      setLinkModalVisible(false);
      loadTeams();
    } catch (error: any) {
      console.error(t.teammanagementpanel601, error);
      const errorMsg = error.message || t.teammanagementpanel602;
      toast.current?.show({ severity: 'error', summary: t.teammanagementpanel603, detail: errorMsg });
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
          <Badge value={t.teammanagementpanel676} severity="danger" />
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
          <Badge value={`${team.subscription_data.days_remaining}${t.teammanagementpanel688}`} severity="warning" />
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
          <span>{t.teammanagementpanel722}</span>
        </div>
      );
    }
  };

  const createdBodyTemplate = (team: Team) => {
    return new Date(team.created_at).toLocaleDateString(currentLanguage, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const actionsBodyTemplate = (team: Team) => {
    const currentUserId = parseInt(localStorage.getItem('user_id') || '0');
    const isOwner = Number(team.project_owner_id) === currentUserId;

    // Check if user is admin in this team
    const currentUserMember = team.members?.find(m => Number(m.user_id) === currentUserId);
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
            tooltip={t.teammanagementpanel754}
            onClick={() => handleManageMembers(team)}
          />
          {/* Roles button - view only for locked teams */}
          {isOwner && (
            <Button
              icon="pi pi-shield"
              className="p-button-rounded p-button-text p-button-info p-button-sm"
              tooltip={t.teammanagementpanel762}
              onClick={() => handleManageRoles(team)}
            />
          )}
          {/* Transfer button - Owner can pass the locked team to someone else */}
          {isOwner && (
            <Button
              icon="pi pi-arrow-right-arrow-left"
              className="p-button-rounded p-button-text p-button-warning p-button-sm"
              tooltip={t.teammanagementpanel771}
              onClick={() => handleOpenTransferModal(team)}
            />
          )}
          {canUnlock && (
            <Button
              icon={unlockingTeam && teamToUnlock?.id === team.id ? "pi pi-spinner pi-spin" : "pi pi-unlock"}
              label={t.teammanagementpanel779}
              className="p-button-rounded p-button-sm"
              style={{ backgroundColor: '#2563eb', borderColor: '#2563eb', color: 'white' }}
              tooltip={t.teammanagementpanel781}
              onClick={() => handleUnlockExpiredTeam(team)}
              disabled={unlockingTeam}
            />
          )}
          {!canUnlock && !isOwner && (
            <span className="text-xs text-gray-400 ml-2">
              {t.teammanagementpanel788}
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
            tooltip={t.teammanagementpanel803}
            onClick={() => handleOpenLinkModal(team)}
          />
        )}
        <Button
          icon="pi pi-users"
          className="p-button-rounded p-button-text p-button-sm"
          tooltip={t.teammanagementpanel386}
          onClick={() => handleManageMembers(team)}
        />
        {/* Roles button - Owner and Admin */}
        {canManageTeam && (
          <Button
            icon="pi pi-shield"
            className="p-button-rounded p-button-text p-button-info p-button-sm"
            tooltip={t.teammanagementpanel818}
            onClick={() => handleManageRoles(team)}
          />
        )}
        {/* Transfer button - only Owner */}
        {isOwner && (
          <Button
            icon="pi pi-arrow-right-arrow-left"
            className="p-button-rounded p-button-text p-button-warning p-button-sm"
            tooltip={t.teammanagementpanel827}
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
    <TabContent colors={colors}>
      <Toast ref={toast} />
      <ConfirmDialog group="team-management" />

      <div className="h-full flex flex-col">
        {/* Header Card */}
        <Card
          title={t.panelsewnavigationpanel477}
          className="m-4 mb-2 team-panel-card"
          style={{ backgroundColor: colors.bgTertiary, border: `1px solid ${colors.borderSecondary}` }}
        >
          <div className="text-sm" style={{ color: colors.textMuted }}>
            {t.teammanagementpanel417}
          </div>
        </Card>

        {/* Toolbar */}
        <div className="mx-4 mb-4">
          <Toolbar
            left={leftToolbarTemplate}
            right={rightToolbarTemplate}
            className="rounded"
            style={{ backgroundColor: colors.bgTertiary, border: `1px solid ${colors.borderSecondary}` }}
          />
        </div>

        {/* Teams Table */}
        <div className="flex-1 mx-4 mb-4">
          <Card className="h-full team-panel-card" style={{ backgroundColor: colors.bgTertiary, border: `1px solid ${colors.borderSecondary}` }}>
            <div className="h-full">
              <DataTable
                value={teams}
                loading={loading}
                globalFilter={globalFilter}
                emptyMessage={t.teammanagementpanel439}
                paginator
                rows={10}
                rowsPerPageOptions={[5, 10, 20, 50]}
                className="p-datatable-sm team-panel-datatable themed-datatable"
                scrollable
                scrollHeight="500px"
                sortMode="multiple"
                removableSort
                style={{
                  ['--dt-bg' as string]: colors.bgSecondary,
                  ['--dt-header-bg' as string]: colors.bgTertiary,
                  ['--dt-border' as string]: colors.borderPrimary,
                  ['--dt-text' as string]: colors.textPrimary,
                  ['--dt-text-secondary' as string]: colors.textSecondary,
                }}
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
        header={`${t.teammanagementpanel977}${teamToLink?.name}`}
        visible={linkModalVisible}
        onHide={() => setLinkModalVisible(false)}
        footer={
          <>
            <Button
              label={t.teammanagementpanel983}
              onClick={() => setLinkModalVisible(false)}
              className="p-button-secondary"
            />
            <Button
              label={t.teammanagementpanel988}
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
            <i className="pi pi-spin pi-spinner text-4xl" style={{ color: colors.accent }}></i>
          </div>
        ) : (
          <div className="space-y-2">
            {allProjects.length === 0 ? (
              <div className="text-center py-4" style={{ color: colors.textMuted }}>
                {t.teammanagementpanel1009}
              </div>
            ) : (
              allProjects.map((project) => (
                <div
                  key={project.id}
                  className="flex items-center justify-between p-3 rounded cursor-pointer"
                  style={{ border: `1px solid ${colors.borderPrimary}`, backgroundColor: colors.bgSecondary }}
                  onClick={() => handleToggleProjectLink(project.id)}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = colors.bgHover)}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = colors.bgSecondary)}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <Checkbox
                      checked={linkedProjectIds.includes(project.id)}
                      onChange={() => handleToggleProjectLink(project.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div>
                      <div className="font-semibold" style={{ color: colors.textPrimary }}>{project.name}</div>
                      {project.description && (
                        <div className="text-sm" style={{ color: colors.textMuted }}>{project.description}</div>
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
        header={`${t.teammanagementpanel1043}${teamToTransfer?.name}`}
        visible={transferModalVisible}
        onHide={() => setTransferModalVisible(false)}
        footer={
          <>
            <Button
              label={t.teammanagementpanel1049}
              onClick={() => setTransferModalVisible(false)}
              className="p-button-secondary"
              disabled={executingTransfer}
            />
            <Button
              label={executingTransfer ? t.teammanagementpanel1055 :
                     (transferEligibility?.transfer_outcomes?.without_slot?.team_locked && !transferWithSlot)
                       ? t.teammanagementpanel1057
                       : t.teammanagementpanel1058}
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
          <div className="rounded-lg p-3" style={{ backgroundColor: colors.warningBg, border: `1px solid ${colors.warningBorder}` }}>
            <p className="text-sm flex items-center gap-2" style={{ color: colors.warningText }}>
              <i className="pi pi-exclamation-triangle"></i>
              <strong>{t.teammanagementpanel1082}</strong>{t.teammanagementpanel1082_2}
            </p>
          </div>

          {/* Step 1: Select Recipient */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
              {t.teammanagementpanel1089}
            </label>
            {teamMembersForTransfer.length === 0 ? (
              <div className="text-sm p-3 rounded" style={{ color: colors.textMuted, border: `1px solid ${colors.borderPrimary}` }}>
                <i className="pi pi-info-circle mr-2"></i>
                {t.teammanagementpanel1094}
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {teamMembersForTransfer.map((member) => (
                  <div
                    key={member.user_id}
                    className="flex items-center justify-between p-3 rounded cursor-pointer transition-colors"
                    style={{
                      border: `1px solid ${transferRecipientId === Number(member.user_id) ? colors.accent : colors.borderPrimary}`,
                      backgroundColor: transferRecipientId === Number(member.user_id) ? colors.infoBg : colors.bgSecondary
                    }}
                    onClick={() => handleCheckTransferEligibility(Number(member.user_id))}
                    onMouseEnter={(e) => { if (transferRecipientId !== Number(member.user_id)) e.currentTarget.style.backgroundColor = colors.bgHover; }}
                    onMouseLeave={(e) => { if (transferRecipientId !== Number(member.user_id)) e.currentTarget.style.backgroundColor = colors.bgSecondary; }}
                  >
                    <div className="flex items-center gap-3">
                      <i className="pi pi-user" style={{ color: colors.textMuted }}></i>
                      <div>
                        <div className="font-medium" style={{ color: colors.textPrimary }}>
                          {member.user.username || member.user.name}
                        </div>
                        <div className="text-sm" style={{ color: colors.textMuted }}>{member.user.email}</div>
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
              <i className="pi pi-spin pi-spinner text-2xl" style={{ color: colors.accent }}></i>
              <span className="ml-2" style={{ color: colors.textMuted }}>{t.teammanagementpanel1130}</span>
            </div>
          )}

          {transferEligibility && !checkingTransfer && (
            <div className="rounded-lg p-4 space-y-3" style={{ border: `1px solid ${colors.borderPrimary}` }}>
              <label className="block text-sm font-medium" style={{ color: colors.textSecondary }}>
                2. Übertragung an {transferEligibility.recipient.username || transferEligibility.recipient.name}:
              </label>

              {/* Recipient is Patron - always OK */}
              {transferEligibility.recipient.is_patron && (
                <div className="rounded p-3" style={{ backgroundColor: colors.successBg, border: `1px solid ${colors.successBorder}` }}>
                  <p className="text-sm flex items-center gap-2" style={{ color: colors.successText }}>
                    <i className="pi pi-check-circle"></i>
                    <strong>{t.teammanagementpanel1145}</strong>{t.teammanagementpanel1145_2}
                  </p>
                </div>
              )}

              {/* Recipient has available slot - also OK */}
              {!transferEligibility.recipient.is_patron && transferEligibility.transfer_outcomes?.without_slot?.team_active && (
                <div className="rounded p-3" style={{ backgroundColor: colors.successBg, border: `1px solid ${colors.successBorder}` }}>
                  <p className="text-sm flex items-center gap-2" style={{ color: colors.successText }}>
                    <i className="pi pi-check-circle"></i>
                    <strong>{t.teammanagementpanel1155}</strong>{t.teammanagementpanel1155_2}
                  </p>
                </div>
              )}

              {/* Recipient needs slot - Show options */}
              {!transferEligibility.recipient.is_patron &&
               transferEligibility.transfer_outcomes?.without_slot?.team_locked && (
                <div className="space-y-3">
                  <div className="rounded p-3" style={{ backgroundColor: colors.warningBg, border: `1px solid ${colors.warningBorder}` }}>
                    <p className="text-sm" style={{ color: colors.warningText }}>
                      <i className="pi pi-exclamation-circle mr-2"></i>
                      {t.teammanagementpanel1167}({transferEligibility.recipient.owned_teams}/{transferEligibility.recipient.max_teams} Teams).
                    </p>
                  </div>

                  {/* Option A: Transfer with slot (if owner has one) */}
                  {transferEligibility.owner.has_slot && (
                    <div
                      className="p-3 rounded cursor-pointer transition-colors"
                      style={{
                        border: `1px solid ${transferWithSlot ? colors.successBorder : colors.borderPrimary}`,
                        backgroundColor: transferWithSlot ? colors.successBg : colors.bgSecondary
                      }}
                      onClick={() => setTransferWithSlot(true)}
                      onMouseEnter={(e) => { if (!transferWithSlot) e.currentTarget.style.backgroundColor = colors.bgHover; }}
                      onMouseLeave={(e) => { if (!transferWithSlot) e.currentTarget.style.backgroundColor = colors.bgSecondary; }}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          checked={transferWithSlot}
                          onChange={() => setTransferWithSlot(true)}
                          className="w-4 h-4"
                        />
                        <div className="flex-1">
                          <div className="font-medium flex items-center gap-2" style={{ color: colors.textPrimary }}>
                            <i className="pi pi-check-circle" style={{ color: colors.successText }}></i>
                            {t.teammanagementpanel1193}
                          </div>
                          <div className="text-sm" style={{ color: colors.textMuted }}>
                            {t.teammanagementpanel1196}{' '}
                            {new Date(transferEligibility.owner.slot_expiry).toLocaleDateString(currentLanguage)}).
                            <span className="ml-1" style={{ color: colors.successText }}>{t.teammanagementpanel1198}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Option B: Transfer without slot (team will be locked) */}
                  <div
                    className="p-3 rounded cursor-pointer transition-colors"
                    style={{
                      border: `1px solid ${!transferWithSlot ? colors.warningBorder : colors.borderPrimary}`,
                      backgroundColor: !transferWithSlot ? colors.warningBg : colors.bgSecondary
                    }}
                    onClick={() => setTransferWithSlot(false)}
                    onMouseEnter={(e) => { if (transferWithSlot) e.currentTarget.style.backgroundColor = colors.bgHover; }}
                    onMouseLeave={(e) => { if (transferWithSlot) e.currentTarget.style.backgroundColor = colors.bgSecondary; }}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        checked={!transferWithSlot}
                        onChange={() => setTransferWithSlot(false)}
                        className="w-4 h-4"
                      />
                      <div className="flex-1">
                        <div className="font-medium flex items-center gap-2" style={{ color: colors.textPrimary }}>
                          <i className="pi pi-lock" style={{ color: colors.warningText }}></i>
                          {t.teammanagementpanel1226}
                        </div>
                        <div className="text-sm" style={{ color: colors.textMuted }}>
                          {t.teammanagementpanel1229}<span style={{ color: colors.warningText }}>{t.teammanagementpanel1229_2}</span>{t.teammanagementpanel1229_3}
                          {t.teammanagementpanel1230}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Info box about locked teams */}
                  {!transferWithSlot && (
                    <div className="rounded p-3" style={{ backgroundColor: colors.infoBg, border: `1px solid ${colors.infoBorder}` }}>
                      <p className="text-sm" style={{ color: colors.infoText }}>
                        <i className="pi pi-info-circle mr-2"></i>
                        <strong>{t.teammanagementpanel1241}</strong>{t.teammanagementpanel1241_2}
                        {t.teammanagementpanel1242}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Warning about project links that will be removed */}
              {transferEligibility.project_links?.unlink_count > 0 && (
                <div className="rounded-lg p-3 mt-3" style={{ backgroundColor: colors.errorBg, border: `1px solid ${colors.errorBorder}` }}>
                  <p className="text-sm font-medium flex items-center gap-2 mb-2" style={{ color: colors.errorText }}>
                    <i className="pi pi-exclamation-triangle"></i>
                    {transferEligibility.project_links.unlink_count}{t.teammanagementpanel1254}
                  </p>
                  <ul className="text-sm space-y-1 ml-6" style={{ color: colors.errorText }}>
                    {transferEligibility.project_links.to_unlink.map((project: any) => (
                      <li key={project.id} className="flex items-center gap-2">
                        <i className="pi pi-times-circle" style={{ color: colors.errorText }}></i>
                        <span className="font-medium">{project.name}</span>
                        <span className="text-xs" style={{ color: colors.errorText }}>{t.teammanagementpanel1261}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="text-xs mt-2 pt-2" style={{ color: colors.errorText, borderTop: `1px solid ${colors.errorBorder}` }}>
                    <i className="pi pi-lightbulb mr-1"></i>
                    <strong>{t.teammanagementpanel1267}</strong>{t.teammanagementpanel1267_2}
                  </p>
                </div>
              )}

              {/* Info about projects that will remain linked */}
              {transferEligibility.project_links?.to_keep?.length > 0 && (
                <div className="rounded p-3 mt-3" style={{ backgroundColor: colors.successBg, border: `1px solid ${colors.successBorder}` }}>
                  <p className="text-sm flex items-center gap-2" style={{ color: colors.successText }}>
                    <i className="pi pi-check-circle"></i>
                    {transferEligibility.project_links.to_keep.length}{t.teammanagementpanel1277}
                  </p>
                  <ul className="text-xs mt-1 ml-6" style={{ color: colors.successText }}>
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