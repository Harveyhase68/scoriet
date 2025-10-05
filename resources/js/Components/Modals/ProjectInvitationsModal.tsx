import React, { useState, useEffect } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dropdown } from 'primereact/dropdown';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { confirmDialog } from 'primereact/confirmdialog';

interface ProjectInvitationsModalProps {
  visible: boolean;
  onHide: () => void;
  project: {
    id: number;
    name: string;
  } | null;
  onSuccess?: () => void;
}

interface ProjectInvitation {
  id: number;
  invited_email: string;
  role: string;
  status: string;
  message?: string;
  created_at: string;
  expires_at: string;
  responded_at?: string;
  inviter: {
    id: number;
    name: string;
    email: string;
  };
  invited_user?: {
    id: number;
    name: string;
    email: string;
  };
}

const roleOptions = [
  { label: 'Member', value: 'member' },
  { label: 'Admin', value: 'admin' }
];

export default function ProjectInvitationsModal({ visible, onHide, project, onSuccess }: ProjectInvitationsModalProps) {
  const [invitations, setInvitations] = useState<ProjectInvitation[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Form state for new invitation
  const [inviteForm, setInviteForm] = useState({
    email: '',
    role: 'member',
    message: ''
  });

  const loadInvitations = React.useCallback(async () => {
    if (!project) return;
    
    try {
      setLoading(true);
      setError('');
      
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (!token) {
        setError('Not authenticated');
        return;
      }

      const response = await fetch(`/api/projects/${project.id}/invitations`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load invitations');
      }

      const data = await response.json();
      // API returns invitations directly, not wrapped in { invitations: [...] }
      setInvitations(Array.isArray(data) ? data : []);
    } catch {
      setError(_ instanceof Error ? _.message : 'Error loading invitations');
    } finally {
      setLoading(false);
    }
  }, [project]);

  useEffect(() => {
    if (visible && project) {
      loadInvitations();
    }
  }, [visible, project, loadInvitations]);

  const sendInvitation = async () => {
    if (!project || !inviteForm.email.trim()) {
      return;
    }

    try {
      setSending(true);
      setError('');
      setSuccess('');

      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (!token) {
        setError('Not authenticated');
        return;
      }

      const response = await fetch(`/api/projects/${project.id}/invitations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: inviteForm.email.trim(),
          role: inviteForm.role,
          message: inviteForm.message.trim() || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to send invitation');
      }

      setSuccess('Invitation sent successfully!');
      setInviteForm({ email: '', role: 'member', message: '' });
      loadInvitations();
      onSuccess?.();
    } catch {
      setError(_ instanceof Error ? _.message : 'Error sending invitation');
    } finally {
      setSending(false);
    }
  };

  const cancelInvitation = async (invitation: ProjectInvitation) => {
    if (!project) return;

    confirmDialog({
      message: `Are you sure you want to cancel the invitation for ${invitation.invited_email}?`,
      header: 'Cancel Invitation',
      icon: 'pi pi-exclamation-triangle',
      accept: async () => {
        try {
          const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
          if (!token) return;

          const response = await fetch(`/api/projects/${project.id}/invitations/${invitation.id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/json',
            },
          });

          if (response.ok) {
            setSuccess('Invitation cancelled successfully');
            loadInvitations();
          }
        } catch {
          setError('Failed to cancel invitation');
        }
      }
    });
  };

  const resendInvitation = async (invitation: ProjectInvitation) => {
    if (!project) return;

    confirmDialog({
      message: `Resend invitation to ${invitation.invited_email}?`,
      header: 'Resend Invitation',
      icon: 'pi pi-send',
      accept: async () => {
        try {
          const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
          if (!token) return;

          // Send a new invitation with the same details
          const response = await fetch(`/api/projects/${project.id}/invitations`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/json',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: invitation.invited_email,
              role: invitation.role,
              message: invitation.message || 'Resent invitation',
            }),
          });

          if (response.ok) {
            setSuccess('Invitation resent successfully');
            loadInvitations();
          } else {
            const errorData = await response.json();
            setError(errorData.message || 'Failed to resend invitation');
          }
        } catch {
          setError('Failed to resend invitation');
        }
      }
    });
  };

  const statusTemplate = (invitation: ProjectInvitation) => {
    const statusMap = {
      pending: { severity: 'warning', label: 'Pending' },
      accepted: { severity: 'success', label: 'Accepted' },
      declined: { severity: 'danger', label: 'Declined' },
      expired: { severity: 'info', label: 'Expired' }
    };

    const status = statusMap[invitation.status as keyof typeof statusMap] || { severity: 'info', label: invitation.status };
    
    return <Tag value={status.label} severity={status.severity as any} />;
  };

  const actionsTemplate = (invitation: ProjectInvitation) => {
    switch (invitation.status) {
      case 'pending':
        return (
          <Button
            icon="pi pi-times"
            className="p-button-text p-button-danger"
            onClick={() => cancelInvitation(invitation)}
            tooltip="Cancel invitation"
          />
        );
      case 'expired':
        return (
          <Button
            icon="pi pi-refresh"
            className="p-button-text p-button-warning"
            onClick={() => resendInvitation(invitation)}
            tooltip="Resend invitation"
          />
        );
      case 'accepted':
        return (
          <span className="text-green-600 text-lg font-medium">
            ✓
          </span>
        );
      case 'declined':
        return (
          <span className="text-red-600 text-lg font-medium">
            ✗
          </span>
        );
      default:
        return null;
    }
  };

  const dialogFooter = (
    <div>
      <Button 
        label="Close" 
        icon="pi pi-times" 
        onClick={onHide} 
        className="p-button-text" 
      />
    </div>
  );

  return (
    <Dialog
      visible={visible}
      onHide={onHide}
      header={`Project Invitations - ${project?.name || ''}`}
      style={{ width: '800px' }}
      footer={dialogFooter}
      className="p-fluid p-dialog-custom"
    >
      <div className="space-y-6">
        {error && <Message severity="error" text={error} />}
        {success && <Message severity="success" text={success} />}

        {/* Send New Invitation Form */}
        <div className="bg-gray-800 p-4 border-radius-md border border-gray-600">
          <h3 className="text-lg font-semibold mb-4 text-gray-100">Send New Invitation</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="field">
              <label htmlFor="email" className="font-medium text-gray-300">Email Address *</label>
              <InputText
                id="email"
                type="email"
                value={inviteForm.email}
                onChange={(e) => setInviteForm(prev => ({ ...prev, email: e.target.value }))}
                placeholder="user@example.com"
                required
              />
            </div>

            <div className="field">
              <label htmlFor="role" className="font-medium text-gray-300">Role</label>
              <Dropdown
                id="role"
                value={inviteForm.role}
                options={roleOptions}
                onChange={(e) => setInviteForm(prev => ({ ...prev, role: e.value }))}
              />
            </div>
          </div>

          <div className="field">
            <label htmlFor="message" className="font-medium text-gray-300">Personal Message (Optional)</label>
            <InputTextarea
              id="message"
              value={inviteForm.message}
              onChange={(e) => setInviteForm(prev => ({ ...prev, message: e.target.value }))}
              placeholder="Add a personal message to the invitation..."
              rows={3}
            />
          </div>

          <Button
            label="Send Invitation"
            icon="pi pi-send"
            onClick={sendInvitation}
            loading={sending}
            disabled={!inviteForm.email.trim()}
            className="mt-3"
          />
        </div>

        {/* Existing Invitations */}
        <div>
          <h3 className="text-lg font-semibold mb-4 text-gray-100">Existing Invitations</h3>
          
          <DataTable
            value={invitations}
            loading={loading}
            emptyMessage="No invitations sent yet"
            stripedRows
            size="small"
          >
            <Column 
              field="invited_email" 
              header="Email" 
              style={{ width: '25%' }}
            />
            <Column 
              field="role" 
              header="Role" 
              style={{ width: '15%' }}
              body={(invitation) => (
                <Tag value={invitation.role} severity="info" />
              )}
            />
            <Column 
              field="status" 
              header="Status" 
              style={{ width: '15%' }}
              body={statusTemplate}
            />
            <Column 
              field="created_at" 
              header="Sent" 
              style={{ width: '20%' }}
              body={(invitation) => new Date(invitation.created_at).toLocaleDateString()}
            />
            <Column 
              field="expires_at" 
              header="Expires" 
              style={{ width: '20%' }}
              body={(invitation) => new Date(invitation.expires_at).toLocaleDateString()}
            />
            <Column 
              header="Actions" 
              style={{ width: '15%' }}
              body={actionsTemplate}
            />
          </DataTable>
        </div>
      </div>
    </Dialog>
  );
}