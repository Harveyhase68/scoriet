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

  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [projectMembers, setProjectMembers] = useState<ProjectMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [assigning, setAssigning] = useState(false);

  const toast = useRef<Toast>(null);

  // Dark theme modal styles
  useEffect(() => {
    if (visible) {
      const style = document.createElement('style');
      style.id = 'member-modal-dark-theme';
      style.textContent = `
        .p-dialog .p-dialog-header {
          background: #1f2937 !important;
          border-bottom: 1px solid #374151 !important;
        }
        .p-dialog .p-dialog-content {
          background: #1f2937 !important;
          color: #f3f4f6 !important;
        }
        .p-dialog .p-dialog-footer {
          background: #1f2937 !important;
          border-top: 1px solid #374151 !important;
        }
        .p-dialog .p-dialog-header .p-dialog-title {
          color: #f3f4f6 !important;
        }
        .p-dialog .p-dialog-header .p-dialog-header-icon {
          color: #9ca3af !important;
        }
        .p-dialog .p-dialog-header .p-dialog-header-icon:hover {
          color: #f3f4f6 !important;
          background: #374151 !important;
        }
        .p-inputtext, .p-dropdown {
          background: #374151 !important;
          border: 1px solid #4b5563 !important;
          color: #f3f4f6 !important;
        }
        .p-inputtext:focus, .p-dropdown:focus {
          border-color: #3b82f6 !important;
          box-shadow: 0 0 0 0.2rem rgba(59, 130, 246, 0.2) !important;
        }
        .p-dropdown-label {
          color: #f3f4f6 !important;
        }
        .p-dropdown-panel {
          background: #374151 !important;
          border: 1px solid #4b5563 !important;
        }
        .p-dropdown-item {
          color: #f3f4f6 !important;
        }
        .p-dropdown-item:hover {
          background: #4b5563 !important;
        }
        .p-datatable .p-datatable-header {
          background: #374151 !important;
          border: 1px solid #4b5563 !important;
          color: #f3f4f6 !important;
        }
        .p-datatable .p-datatable-tbody > tr {
          background: #374151 !important;
          color: #f3f4f6 !important;
        }
        .p-datatable .p-datatable-tbody > tr:nth-child(even) {
          background: #4b5563 !important;
        }
        .p-datatable .p-datatable-tbody > tr:hover {
          background: #6b7280 !important;
        }
        .p-datatable .p-datatable-thead > tr > th {
          background: #4b5563 !important;
          border: 1px solid #6b7280 !important;
          color: #f3f4f6 !important;
        }
        .p-toolbar {
          background: #374151 !important;
          border: 1px solid #4b5563 !important;
        }
      `;
      document.head.appendChild(style);

      return () => {
        const existingStyle = document.getElementById('member-modal-dark-theme');
        if (existingStyle) {
          existingStyle.remove();
        }
      };
    }
  }, [visible]);

  const loadData = useCallback(async () => {
    if (!team) return;

    // Get projectId from team if not provided as prop
    const currentProjectId = projectId || team.project_owner_id;
    if (!currentProjectId) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
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

      // Load project members using team's project info
      // We need to find the project that this team belongs to
      // Since team has project_owner_id, we can find the project by owner
      try {

        const projectsResponse = await fetch('/api/projects', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          },
        });

        if (projectsResponse.ok) {
          const projectsData = await projectsResponse.json();

          // Extract projects array from response
          const projects = projectsData.projects || [];

          // Find project where this team belongs (same project_owner_id)
          const matchingProject = projects.find((p: any) => p.owner_id === team.project_owner_id);

          if (matchingProject) {

            const projectMembersResponse = await fetch(`/api/projects/${matchingProject.id}/members`, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
              },
            });

            if (projectMembersResponse.ok) {
              const projectMembersData = await projectMembersResponse.json();
              setProjectMembers(projectMembersData || []);
            } else {
              // Failed to load project members
            }
          } else {
            // No matching project found for team owner
          }
        } else {
          // Failed to load projects
        }
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
      const isAlreadyInTeam = teamMembers.some(tm => tm.user_id === projectMember.user_id);
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
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
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
      message: `Remove ${member.user.name} from the team?`,
      header: t.manageteammodal485,
      icon: 'pi pi-exclamation-triangle',
      defaultFocus: 'reject',
      acceptClassName: 'p-button-danger',
      accept: async () => {
        try {
          const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
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
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
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
        <span className="font-medium">{member.user.name}</span>
        <span className="text-sm text-gray-400">{member.user.email}</span>
        {member.user.username && (
          <span className="text-sm text-gray-500">@{member.user.username}</span>
        )}
      </div>
    );
  };

  const roleBodyTemplate = (member: any) => {
    const currentUserId = parseInt(localStorage.getItem('user_id') || '0');
    const isTeamOwner = team?.project_owner_id === currentUserId;

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
    return new Date(member.joined_at).toLocaleDateString('de-DE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const actionsBodyTemplate = (member: any) => {
    const currentUserId = parseInt(localStorage.getItem('user_id') || '0');
    const isTeamOwner = team?.project_owner_id === currentUserId;


    if (!isTeamOwner) {
      return null;
    }

    // Owner cannot be removed
    if (member.role === 'owner') {
      return <span className="text-gray-400 text-xs">Owner</span>;
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
      <ConfirmDialog />
      
      <Dialog
        header={`Manage Members - ${team?.name}`}
        visible={visible}
        onHide={onHide}
        style={{ width: '800px', height: '600px' }}
        modal
        maximizable
        className="p-fluid"
      >
        <div className="h-full flex flex-col">
          {error && (
            <div className="p-3 bg-red-900 border border-red-700 rounded text-red-100 text-sm mb-4">
              {error}
            </div>
          )}

          {/* Info message */}
          <div className="mb-4 p-3 bg-blue-900 border border-blue-700 rounded text-blue-100 text-sm">
            <i className="pi pi-info-circle mr-2"></i>
            Team-Mitglieder können an diesem Projekt zusammenarbeiten. Projekt-Mitglieder mit Status {t.membermodal479} können zum Team hinzugefügt werden.
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

          <div className="flex justify-end gap-2 pt-4 border-t border-gray-600 mt-4">
            <Button
              label={t.authmodalsesetpasswordmodal162}
              icon="pi pi-times"
              className="p-button-text"
              onClick={onHide}
            />
          </div>
        </div>
      </Dialog>

    </>
  );
}