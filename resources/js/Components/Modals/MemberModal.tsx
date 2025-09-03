import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Badge } from 'primereact/badge';
import { Message } from 'primereact/message';
import { Toast } from 'primereact/toast';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { Toolbar } from 'primereact/toolbar';

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
  project_name: string;
  owner: {
    id: number;
    name: string;
    email: string;
    username?: string;
  };
  members: TeamMember[];
  members_count?: number;
}


interface MemberModalProps {
  visible: boolean;
  onHide: () => void;
  team?: Team | null;
  onSave?: () => void;
}

export default function MemberModal({ visible, onHide, team, onSave }: MemberModalProps) {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Invitation form
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [inviting, setInviting] = useState(false);
  
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

  const loadTeamMembers = useCallback(async () => {
    if (!team) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`/api/teams/${team.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load team details');
      }

      const data = await response.json();
      setMembers(data.team.members || []);
    } catch (error) {
      console.error('Error loading team members:', error);
      setError(error instanceof Error ? error.message : 'Failed to load team members');
    } finally {
      setLoading(false);
    }
  }, [team]);

  useEffect(() => {
    if (visible && team) {
      loadTeamMembers();
    }
  }, [visible, team, loadTeamMembers]);

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!team || !inviteEmail.trim()) return;

    setInviting(true);
    try {
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`/api/teams/${team.id}/invitations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          email: inviteEmail,
          role: inviteRole
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to send invitation');
      }

      toast.current?.show({
        severity: 'success',
        summary: 'Success',
        detail: 'Invitation sent successfully',
        life: 3000
      });

      setInviteEmail('');
      setInviteRole('member');
      loadTeamMembers();
      onSave?.();
    } catch (error) {
      console.error('Error inviting member:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: error instanceof Error ? error.message : 'Failed to send invitation',
        life: 3000
      });
    } finally {
      setInviting(false);
    }
  };

  const handleRemoveMember = (member: TeamMember) => {
    if (member.role === 'owner') {
      toast.current?.show({
        severity: 'warn',
        summary: 'Warning',
        detail: 'Cannot remove team owner',
        life: 3000
      });
      return;
    }

    confirmDialog({
      message: `Remove ${member.user.name} from the team?`,
      header: 'Remove Member',
      icon: 'pi pi-exclamation-triangle',
      defaultFocus: 'reject',
      acceptClassName: 'p-button-danger',
      accept: async () => {
        try {
          const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
          if (!token) {
            throw new Error('Not authenticated');
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
            throw new Error(errorData.message || 'Failed to remove member');
          }

          toast.current?.show({
            severity: 'success',
            summary: 'Success',
            detail: 'Member removed successfully',
            life: 3000
          });

          loadTeamMembers();
          onSave?.();
        } catch (error) {
          console.error('Error removing member:', error);
          toast.current?.show({
            severity: 'error',
            summary: 'Error',
            detail: error instanceof Error ? error.message : 'Failed to remove member',
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
        summary: 'Warning',
        detail: 'Cannot change owner role',
        life: 3000
      });
      return;
    }

    try {
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (!token) {
        throw new Error('Not authenticated');
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
        throw new Error(errorData.message || 'Failed to update role');
      }

      toast.current?.show({
        severity: 'success',
        summary: 'Success',
        detail: 'Member role updated successfully',
        life: 3000
      });

      loadTeamMembers();
      onSave?.();
    } catch (error) {
      console.error('Error updating role:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: error instanceof Error ? error.message : 'Failed to update role',
        life: 3000
      });
    }
  };

  if (!visible) return null;

  const roleOptions = [
    { label: 'Member', value: 'member' },
    { label: 'Admin', value: 'admin' }
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

  const roleBodyTemplate = (member: TeamMember) => {
    const currentUserId = parseInt(localStorage.getItem('user_id') || '0');
    const isTeamOwner = team?.project_owner_id === currentUserId;
    
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

  const actionsBodyTemplate = (member: TeamMember) => {
    const currentUserId = parseInt(localStorage.getItem('user_id') || '0');
    const isTeamOwner = team?.project_owner_id === currentUserId;
    
    if (member.role === 'owner' || !isTeamOwner) {
      return null;
    }

    return (
      <Button
        icon="pi pi-trash"
        className="p-button-rounded p-button-text p-button-sm p-button-danger"
        tooltip="Remove Member"
        onClick={() => handleRemoveMember(member)}
      />
    );
  };

  // Toolbar template
  const leftToolbarTemplate = () => {
    const currentUserId = parseInt(localStorage.getItem('user_id') || '0');
    const isTeamOwner = team?.project_owner_id === currentUserId;
    
    if (!isTeamOwner) return null;

    return (
      <form onSubmit={handleInviteMember} className="flex gap-2 items-end">
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-100">Email</label>
          <InputText
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="Enter email address"
            className="w-64"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-100">Role</label>
          <Dropdown
            value={inviteRole}
            options={roleOptions}
            onChange={(e) => setInviteRole(e.value)}
            className="w-32"
          />
        </div>
        <Button
          type="submit"
          label="Invite"
          icon="pi pi-send"
          loading={inviting}
          className="p-button-success"
        />
      </form>
    );
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
            <Message severity="error" text={error} className="mb-4" />
          )}

          {/* Toolbar for inviting members */}
          <Toolbar left={leftToolbarTemplate} className="mb-4" />

          {/* Members Table */}
          <div className="flex-1">
            <DataTable
              value={members}
              loading={loading}
              emptyMessage="No members found"
              className="p-datatable-sm"
              scrollable
              scrollHeight="400px"
            >
              <Column
                field="user"
                header="Member"
                body={memberBodyTemplate}
                className="w-1/3"
              />
              <Column
                field="role"
                header="Role"
                body={roleBodyTemplate}
                className="w-1/4"
              />
              <Column
                field="joined_at"
                header="Joined"
                body={joinedBodyTemplate}
                className="w-1/4"
              />
              <Column
                header="Actions"
                body={actionsBodyTemplate}
                className="w-24"
                headerClassName="text-center"
                bodyClassName="text-center"
              />
            </DataTable>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-gray-600 mt-4">
            <Button
              label="Close"
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