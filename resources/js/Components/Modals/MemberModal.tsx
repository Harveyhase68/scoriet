import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Badge } from 'primereact/badge';
import { Toast } from 'primereact/toast';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { useTranslation, SupportedLanguage, getStoredLanguage } from '@/i18n';
import { useTheme } from '@/contexts/ThemeContext';

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


interface ProjectMember {
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

interface MemberModalProps {
  visible: boolean;
  onHide: () => void;
  team?: Team | null;
  projectId?: number;
  onSave?: () => void;
}

export default function MemberModal({ visible, onHide, team, projectId, onSave }: MemberModalProps) {
  // i18n setup
  const [currentLanguage] = React.useState<SupportedLanguage>(getStoredLanguage());
  const { t } = useTranslation(currentLanguage);
  const { colors } = useTheme();

  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [projectMembers, setProjectMembers] = useState<ProjectMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [assigning, setAssigning] = useState(false);

  const toast = useRef<Toast>(null);

  const loadData = useCallback(async () => {
    if (!team) return;

    // Get projectId from team if not provided as prop
    const currentProjectId = projectId || team.project_owner_id;
    if (!currentProjectId) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (!token) {
        throw new Error(t.applicationsmodal66);
      }

      // Load team members
      const teamResponse = await fetch(`/api/teams/${team.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (!teamResponse.ok) {
        throw new Error(t.membermodal191);
      }

      const teamData = await teamResponse.json();
      setTeamMembers(teamData.team.members || []);

      // Load project members from all projects linked to this team
      // The team has a 'projects' array with all linked projects
      try {
        const allProjectMembers: ProjectMember[] = [];
        const seenUserIds = new Set<number>();

        // Get project IDs from the team's linked projects
        const linkedProjectIds = team.projects?.map(p => p.id) || [];

        // If no linked projects, try to get from projects API
        if (linkedProjectIds.length === 0) {
          const projectsResponse = await fetch('/api/projects', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/json',
            },
          });

          if (projectsResponse.ok) {
            const projectsData = await projectsResponse.json();
            const projects = projectsData.projects || [];
            // Find projects owned by the team owner
            const matchingProjects = projects.filter((p: any) => Number(p.owner_id) === Number(team.project_owner_id));
            linkedProjectIds.push(...matchingProjects.map((p: any) => p.id));
          }
        }

        // Load members from each linked project
        for (const projectId of linkedProjectIds) {
          try {
            const projectMembersResponse = await fetch(`/api/projects/${projectId}/members`, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
              },
            });

            if (projectMembersResponse.ok) {
              const projectMembersData = await projectMembersResponse.json();
              const members = projectMembersData || [];

              // Add unique members only
              for (const member of members) {
                if (!seenUserIds.has(member.user_id)) {
                  seenUserIds.add(member.user_id);
                  allProjectMembers.push(member);
                }
              }
            }
          } catch {
            // Continue with other projects if one fails
          }
        }

        setProjectMembers(allProjectMembers);
      } catch {
        setProjectMembers([]);
      }

    } catch (error) {
      setError(error instanceof Error ? error.message : t.membermodal244);
    } finally {
      setLoading(false);
    }
  }, [team, projectId]);

  useEffect(() => {
    if (visible && team) {
      loadData();
    }
  }, [visible, team, loadData]);

  // Helper function to combine and categorize all members
  const getAllMembers = () => {
    const allMembers: any[] = [];


    // Add team members (already in team)
    teamMembers.forEach(teamMember => {
      allMembers.push({
        ...teamMember,
        membershipType: 'team_member',
        isInTeam: true
      });
    });

    // Add project members not in team (available to assign)
    projectMembers.forEach(projectMember => {
      const isAlreadyInTeam = teamMembers.some(tm => Number(tm.user_id) === Number(projectMember.user_id));
      if (!isAlreadyInTeam) {
        allMembers.push({
          id: `project_${projectMember.id}`,
          user_id: projectMember.user_id,
          role: 'available',
          joined_at: projectMember.joined_at,
          user: projectMember.user,
          membershipType: 'project_member',
          isInTeam: false
        });
      }
    });

    return allMembers;
  };

  const handleAddMemberToTeam = async (member: any, role: string = 'member') => {
    if (!team) return;


    setAssigning(true);
    try {
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (!token) {
        throw new Error(t.applicationsmodal66);
      }

      const response = await fetch(`/api/teams/${team.id}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          user_id: member.user_id,
          role: role
        }),
      });


      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || t.membermodal316);
      }

      await response.json();

      toast.current?.show({
        severity: 'success',
        summary: t.membermodal323,
        detail: `${member.user.name} added to team successfully`,
        life: 3000
      });

      // Refresh data
      loadData();
      onSave?.();
    } catch (error) {
      // Error adding member to team
      toast.current?.show({
        severity: 'error',
        summary: t.membermodal335,
        detail: error instanceof Error ? error.message : t.membermodal316,
        life: 3000
      });
    } finally {
      setAssigning(false);
    }
  };

  const handleRemoveMember = (member: TeamMember) => {
    if (member.role === 'owner') {
      toast.current?.show({
        severity: 'warn',
        summary: t.membermodal348,
        detail: t.teamcontroller236,
        life: 3000
      });
      return;
    }

    confirmDialog({
      group: 'member-modal',
      message: `Remove ${member.user.name} from the team?`,
      header: t.manageteammodal485,
      icon: 'pi pi-exclamation-triangle',
      defaultFocus: 'reject',
      acceptClassName: 'p-button-danger',
      accept: async () => {
        try {
          const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token') || sessionStorage.getItem('access_token');
          if (!token) {
            throw new Error(t.applicationsmodal66);
          }

          const response = await fetch(`/api/teams/${team!.id}/members/${member.user_id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/json',
            },
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || t.manageteammodal155);
          }

          toast.current?.show({
            severity: 'success',
            summary: t.membermodal323,
            detail: t.teamcontroller241,
            life: 3000
          });

          loadData();
          onSave?.();
        } catch (error) {
          // Error removing member
          toast.current?.show({
            severity: 'error',
            summary: t.membermodal335,
            detail: error instanceof Error ? error.message : t.manageteammodal155,
            life: 3000
          });
        }
      }
    });
  };

  const handleChangeRole = async (member: TeamMember, newRole: string) => {
    if (member.role === 'owner') {
      toast.current?.show({
        severity: 'warn',
        summary: t.membermodal348,
        detail: t.projectcontroller844,
        life: 3000
      });
      return;
    }

    try {
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (!token) {
        throw new Error(t.applicationsmodal66);
      }

      const response = await fetch(`/api/teams/${team!.id}/members/${member.user_id}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
        body: JSON.stringify({ role: newRole }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || t.membermodal432);
      }

      toast.current?.show({
        severity: 'success',
        summary: t.membermodal323,
        detail: t.projectcontroller849,
        life: 3000
      });

      loadData();
      onSave?.();
    } catch (error) {
      // Error updating role
      toast.current?.show({
        severity: 'error',
        summary: t.membermodal335,
        detail: error instanceof Error ? error.message : t.membermodal432,
        life: 3000
      });
    }
  };

  if (!visible) return null;

  const roleOptions = [
    { label: t.manageteammodal394, value: 'member' },
    { label: t.manageteammodal395, value: 'admin' }
  ];

  // Column templates
  const memberBodyTemplate = (member: TeamMember) => {
    return (
      <div className="flex flex-col">
        <span className="font-medium" style={{ color: colors.textPrimary }}>{member.user.name}</span>
        <span className="text-sm" style={{ color: colors.textMuted }}>{member.user.email}</span>
        {member.user.username && (
          <span className="text-sm" style={{ color: colors.textMuted }}>@{member.user.username}</span>
        )}
      </div>
    );
  };

  const roleBodyTemplate = (member: any) => {
    const currentUserId = parseInt(localStorage.getItem('user_id') || '0');
    const isTeamOwner = Number(team?.project_owner_id) === currentUserId;

    // For project members not in team, show t.membermodal479
    if (!member.isInTeam) {
      return (
        <Badge
          value={t.membermodal479}
          severity="success"
        />
      );
    }

    if (member.role === 'owner' || !isTeamOwner) {
      return (
        <Badge
          value={member.role.charAt(0).toUpperCase() + member.role.slice(1)}
          severity={member.role === 'owner' ? 'info' : member.role === 'admin' ? 'warning' : 'secondary'}
        />
      );
    }

    return (
      <Dropdown
        value={member.role}
        options={roleOptions}
        onChange={(e) => handleChangeRole(member, e.value)}
        className="w-full"
      />
    );
  };

  const joinedBodyTemplate = (member: TeamMember) => {
    return new Date(member.joined_at).toLocaleDateString(currentLanguage, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const actionsBodyTemplate = (member: any) => {
    const currentUserId = parseInt(localStorage.getItem('user_id') || '0');
    const isTeamOwner = Number(team?.project_owner_id) === currentUserId;


    if (!isTeamOwner) {
      return null;
    }

    // Owner cannot be removed
    if (member.role === 'owner') {
      return <span className="text-xs" style={{ color: colors.textMuted }}>{t.membermodal461}</span>;
    }

    // If member is in team, show Remove button
    if (member.isInTeam) {
      return (
        <Button
          icon="pi pi-trash"
          className="p-button-rounded p-button-text p-button-sm p-button-danger"
          tooltip={t.membermodal536}
          onClick={() => handleRemoveMember(member)}
          disabled={assigning}
        />
      );
    }

    // If member is not in team (project member), show Assign button
    else {
      return (
        <Button
          icon="pi pi-plus"
          className="p-button-rounded p-button-text p-button-sm p-button-success"
          tooltip={t.membermodal549}
          onClick={() => handleAddMemberToTeam(member)}
          disabled={assigning}
        />
      );
    }
  };


  return (
    <>
      <Toast ref={toast} />
      <ConfirmDialog group="member-modal" />
      
      <Dialog
        header={`Manage Members - ${team?.name}`}
        visible={visible}
        onHide={onHide}
        style={{ width: '800px', height: '600px' }}
        contentStyle={{ backgroundColor: colors.bgPrimary, color: colors.textPrimary }}
        headerStyle={{ backgroundColor: colors.dialogHeader, color: colors.textPrimary }}
        modal
        maximizable
        className="member-modal p-fluid"
      >
        <div className="h-full flex flex-col" style={{ backgroundColor: colors.bgPrimary, color: colors.textPrimary }}>
          {error && (
            <div className="p-3 rounded text-sm mb-4" style={{ backgroundColor: colors.errorBg, border: `1px solid ${colors.errorBorder}`, color: colors.errorText }}>
              {error}
            </div>
          )}

          {/* Info message */}
          <div className="mb-4 p-3 rounded text-sm" style={{ backgroundColor: colors.infoBg, border: `1px solid ${colors.infoBorder}`, color: colors.infoText }}>
            <i className="pi pi-info-circle mr-2"></i>
            {t.membermodal518_2}{t.membermodal479}{t.membermodal518_3}
          </div>

          {/* Members Table */}
          <div className="flex-1">
            <DataTable
              value={getAllMembers()}
              loading={loading}
              emptyMessage={t.membermodal590}
              className="p-datatable-sm"
              scrollable
              scrollHeight="400px"
            >
              <Column
                field="user"
                header={t.manageteammodal394}
                body={memberBodyTemplate}
                className="w-1/3"
              />
              <Column
                field="role"
                header={t.manageteammodal388}
                body={roleBodyTemplate}
                className="w-1/4"
              />
              <Column
                field="joined_at"
                header={t.membermodal609}
                body={joinedBodyTemplate}
                className="w-1/4"
              />
              <Column
                header={t.applicationsmodal354}
                body={actionsBodyTemplate}
                className="w-24"
                headerClassName="text-center"
                bodyClassName="text-center"
              />
            </DataTable>
          </div>

          <div className="flex justify-end gap-2 pt-4 mt-4" style={{ borderTop: `1px solid ${colors.borderPrimary}` }}>
            <Button
              label={t.authmodalsesetpasswordmodal162}
              icon="pi pi-times"
              className="p-button-text"
              onClick={onHide}
            />
          </div>
        </div>

        {/* Theme-aware styles for PrimeReact components */}
        <style>{`
          .member-modal .p-datatable {
            background-color: var(--theme-bg-primary);
            color: var(--theme-text-primary);
          }
          .member-modal .p-datatable .p-datatable-header {
            background-color: var(--theme-bg-secondary);
            color: var(--theme-text-primary);
            border-color: var(--theme-border-primary);
          }
          .member-modal .p-datatable .p-datatable-thead > tr > th {
            background-color: var(--theme-bg-secondary);
            color: var(--theme-text-primary);
            border-color: var(--theme-border-primary);
          }
          .member-modal .p-datatable .p-datatable-tbody > tr {
            background-color: var(--theme-bg-primary);
            color: var(--theme-text-primary);
          }
          .member-modal .p-datatable .p-datatable-tbody > tr > td {
            border-color: var(--theme-border-primary);
          }
          .member-modal .p-datatable .p-datatable-tbody > tr:hover {
            background-color: var(--theme-bg-tertiary);
          }
          .member-modal .p-datatable .p-datatable-tbody > tr.p-highlight {
            background-color: var(--theme-accent);
            color: white;
          }
          .member-modal .p-datatable .p-datatable-emptymessage td {
            background-color: var(--theme-bg-primary);
            color: var(--theme-text-muted);
          }
          .member-modal .p-dropdown {
            background-color: var(--theme-bg-secondary);
            border-color: var(--theme-border-primary);
            color: var(--theme-text-primary);
          }
          .member-modal .p-dropdown:hover {
            border-color: var(--theme-accent);
          }
          .member-modal .p-dropdown .p-dropdown-label {
            color: var(--theme-text-primary);
          }
          .member-modal .p-dropdown .p-dropdown-trigger {
            color: var(--theme-text-muted);
          }
          .member-modal .p-dropdown-panel {
            background-color: var(--theme-bg-secondary);
            border-color: var(--theme-border-primary);
          }
          .member-modal .p-dropdown-panel .p-dropdown-items {
            background-color: var(--theme-bg-secondary);
          }
          .member-modal .p-dropdown-panel .p-dropdown-item {
            color: var(--theme-text-primary);
          }
          .member-modal .p-dropdown-panel .p-dropdown-item:hover {
            background-color: var(--theme-bg-tertiary);
          }
          .member-modal .p-dropdown-panel .p-dropdown-item.p-highlight {
            background-color: var(--theme-accent);
            color: white;
          }
          .member-modal .p-button-text {
            color: var(--theme-text-primary);
          }
          .member-modal .p-button-text:hover {
            background-color: var(--theme-bg-tertiary);
          }
          .member-modal .p-button-success.p-button-text {
            color: #22c55e;
          }
          .member-modal .p-button-danger.p-button-text {
            color: #ef4444;
          }
          .member-modal .p-confirmdialog {
            background-color: var(--theme-bg-primary);
          }
          .member-modal .p-confirmdialog .p-dialog-header {
            background-color: var(--theme-dialog-header);
            color: var(--theme-text-primary);
          }
          .member-modal .p-confirmdialog .p-dialog-content {
            background-color: var(--theme-bg-primary);
            color: var(--theme-text-primary);
          }
          .member-modal .p-confirmdialog .p-dialog-footer {
            background-color: var(--theme-bg-primary);
            border-color: var(--theme-border-primary);
          }
          .member-modal .p-badge {
            font-size: 0.75rem;
          }
        `}</style>
      </Dialog>

    </>
  );
}