import React, { useState, useEffect } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Message } from 'primereact/message';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Tag } from 'primereact/tag';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { Dropdown } from 'primereact/dropdown';

interface ProjectMembersModalProps {
  visible: boolean;
  onHide: () => void;
  project: {
    id: number;
    name: string;
  } | null;
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
    username: string;
  };
}

export default function ProjectMembersModal({ visible, onHide, project }: ProjectMembersModalProps) {
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadMembers = React.useCallback(async () => {
    if (!project) return;

    try {
      setLoading(true);
      setError('');

      const accessToken = localStorage.getItem('access_token');
      const response = await fetch(`/api/projects/${project.id}/members`, {
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to load project members');
      }

      const data = await response.json();
      
      setMembers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading project members');
    } finally {
      setLoading(false);
    }
  }, [project]);

  useEffect(() => {
    if (visible && project) {
      loadMembers();
    }
  }, [visible, project, loadMembers]);

  const handleRemoveMember = async (member: ProjectMember) => {
    if (!project) return;

    try {
      setError('');
      setSuccess('');

      const accessToken = localStorage.getItem('access_token');
      const response = await fetch(`/api/projects/${project.id}/members`, {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ user_id: member.user_id })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to remove member');
      }

      setSuccess('Member removed successfully');
      loadMembers(); // Refresh the list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error removing member');
    }
  };

  const handleRoleChange = async (member: ProjectMember, newRole: string) => {
    if (!project || member.role === newRole) return;

    try {
      setError('');
      setSuccess('');

      const accessToken = localStorage.getItem('access_token');
      const response = await fetch(`/api/projects/${project.id}/members/role`, {
        method: 'PUT',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_id: member.user_id,
          role: newRole
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update member role');
      }

      setSuccess('Member role updated successfully');
      loadMembers(); // Refresh the list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error updating member role');
    }
  };

  const confirmRemoveMember = (member: ProjectMember) => {
    confirmDialog({
      message: `Are you sure you want to remove ${member.user.name} from this project?`,
      header: 'Confirm Removal',
      icon: 'pi pi-exclamation-triangle',
      accept: () => handleRemoveMember(member),
      acceptClassName: 'p-button-danger'
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const userTemplate = (member: ProjectMember) => {
    
    return (
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
          {member.user.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <div className="font-medium text-white">{member.user.name}</div>
          <div className="text-sm text-gray-400">{member.user.email}</div>
          <div className="text-xs text-gray-500">@{member.user.username}</div>
        </div>
      </div>
    );
  };

  const roleTemplate = (member: ProjectMember) => {
    const roleOptions = [
      { label: 'Member', value: 'member' },
      { label: 'Admin', value: 'admin' }
    ];

    const getRoleColor = (role: string) => {
      switch (role) {
        case 'owner': return 'warning';
        case 'admin': return 'info';
        case 'member': return 'success';
        default: return 'info';
      }
    };

    // Owner role cannot be changed
    if (member.role === 'owner') {
      return (
        <Tag
          value="Owner"
          severity={getRoleColor(member.role)}
          className="font-semibold"
        />
      );
    }

    return (
      <Dropdown
        value={member.role}
        options={roleOptions}
        onChange={(e) => handleRoleChange(member, e.value)}
        className="w-full"
        placeholder="Select role"
      />
    );
  };

  const actionTemplate = (member: ProjectMember) => {
    // Owner cannot be removed
    if (member.role === 'owner') {
      return null;
    }

    return (
      <Button
        icon="pi pi-trash"
        className="p-button-rounded p-button-text p-button-danger p-button-sm"
        tooltip="Remove member"
        onClick={() => confirmRemoveMember(member)}
      />
    );
  };

  const joinedTemplate = (member: ProjectMember) => {
    return (
      <span className="text-gray-300">
        {formatDate(member.joined_at)}
      </span>
    );
  };

  const modalHeader = (
    <div className="flex items-center space-x-3">
      <i className="pi pi-users text-blue-500"></i>
      <span>Project Members - {project?.name}</span>
    </div>
  );

  return (
    <>
      <Dialog
        visible={visible}
        onHide={onHide}
        header={modalHeader}
        style={{ width: '800px' }}
        className="p-fluid"
        modal
      >
        <div className="space-y-4">
          {error && <Message severity="error" text={error} />}
          {success && <Message severity="success" text={success} />}

          {loading ? (
            <div className="flex items-center justify-center p-8">
              <ProgressSpinner />
            </div>
          ) : (
            <DataTable
              value={members}
              className="p-datatable-sm p-datatable-dark"
              emptyMessage="No members found"
              showGridlines
              stripedRows
            >
              <Column
                field="user"
                header="User"
                body={userTemplate}
                style={{ minWidth: '250px' }}
              />
              <Column
                field="role"
                header="Role"
                body={roleTemplate}
                style={{ width: '150px' }}
              />
              <Column
                field="joined_at"
                header="Joined"
                body={joinedTemplate}
                style={{ width: '150px' }}
              />
              <Column
                header="Actions"
                body={actionTemplate}
                style={{ width: '100px' }}
              />
            </DataTable>
          )}

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              label="Close"
              icon="pi pi-times"
              onClick={onHide}
              className="p-button-text"
            />
          </div>
        </div>
      </Dialog>

      <ConfirmDialog />
    </>
  );
}