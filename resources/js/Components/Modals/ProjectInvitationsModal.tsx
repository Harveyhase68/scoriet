import React, { useState, useEffect } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dropdown } from 'primereact/dropdown';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { Message } from 'primereact/message';
import { confirmDialog, ConfirmDialog } from 'primereact/confirmdialog';
import { useTranslation, SupportedLanguage, getStoredLanguage } from '@/i18n';

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

export default function ProjectInvitationsModal({ visible, onHide, project }: ProjectInvitationsModalProps) {
  // i18n setup
  const [currentLanguage] = React.useState<SupportedLanguage>(getStoredLanguage());
  const { t } = useTranslation(currentLanguage);

  const roleOptions = [
    { label: t.manageteammodal394, value: 'member' },
    { label: t.manageteammodal395, value: 'admin' }
  ];

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
      // NEVER clear success message during reload - let it auto-expire
      // setSuccess(''); // <-- REMOVED

      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (!token) {
        setError(t.applicationsmodal66);
        return;
      }

      const response = await fetch(`/api/projects/${project.id}/invitations`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (response.status === 403) {
        // User doesn't have permission to manage invitations — not an error, just no access
        setInvitations([]);
        return;
      }

      if (!response.ok) {
        throw new Error(t.projectinvitationsmodal86);
      }

      const data = await response.json();
      // API returns invitations directly, not wrapped in { invitations: [...] }
      setInvitations(Array.isArray(data) ? data : []);
    } catch (error) {
      setError(error instanceof Error ? error.message : t.projectinvitationsmodal93);
    } finally {
      setLoading(false);
    }
  }, [project]);

  useEffect(() => {
    if (visible && project) {
      loadInvitations();
    }

  }, [visible, project]); // Removed loadInvitations from dependencies to prevent re-render loop

  const sendInvitation = async () => {
    if (!project || !inviteForm.email.trim()) {
      return;
    }

    try {
      setSending(true);
      setError('');
      setSuccess('');

      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (!token) {
        setError(t.applicationsmodal66);
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

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || t.manageteammodal129);
      }

      setSuccess(t.projectinvitationsmodal148);
      setInviteForm({ email: '', role: 'member', message: '' });

      // Add the new invitation to the list
      if (data.invitation) {

        // Enrich the invitation with ALL fields that the table expects
        const enrichedInvitation: ProjectInvitation = {
          id: data.invitation.id,
          invited_email: data.invitation.invited_email,
          role: data.invitation.role,
          status: data.invitation.status || 'pending',
          message: data.invitation.message || undefined,
          created_at: data.invitation.created_at || new Date().toISOString(),
          expires_at: data.invitation.expires_at || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          responded_at: data.invitation.responded_at,
          inviter: data.invitation.inviter || {
            id: data.invitation.invited_by,
            name: t.projectinvitationmail33,
            email: ''
          },
          invited_user: data.invitation.invited_user
        };

        setInvitations(prev => [enrichedInvitation, ...prev]);
      }

      // Auto-clear success message after 5 seconds
      setTimeout(() => {
        setSuccess('');
      }, 5000);
    } catch (error) {
      setError(error instanceof Error ? error.message : t.projectinvitationsmodal193);
    } finally {
      setSending(false);
    }
  };

  const cancelInvitation = async (invitation: ProjectInvitation) => {
    if (!project) return;

    confirmDialog({
      group: 'project-invitations',
      message: `${t.projectinvitationsmodal195}${invitation.invited_email}?`,
      header: t.manageteammodal534,
      icon: 'pi pi-exclamation-triangle',
      accept: async () => {
        try {
          const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token') || sessionStorage.getItem('access_token');
          if (!token) return;

          const response = await fetch(`/api/projects/${project.id}/invitations/${invitation.id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/json',
            },
          });

          if (response.ok) {
            setSuccess(t.projectinvitationsmodal220);
            loadInvitations();

            // Auto-clear success message after 4 seconds
            setTimeout(() => {
              setSuccess('');
            }, 4000);
          } else {
            const errorData = await response.json();
            setError(errorData.message || t.manageteammodal206);
          }
        } catch (error) {
          setError(error instanceof Error ? error.message : t.manageteammodal206);
        }
      }
    });
  };

  const resendInvitation = async (invitation: ProjectInvitation) => {
    if (!project) return;

    confirmDialog({
      group: 'project-invitations',
      message: `${t.projectinvitationsmodal234}${invitation.invited_email}?`,
      header: t.projectinvitationsmodal243,
      icon: 'pi pi-send',
      accept: async () => {
        try {
          const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token') || sessionStorage.getItem('access_token');
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
              message: invitation.message || t.projectinvitationsmodal261,
            }),
          });

          if (response.ok) {
            setSuccess(t.projectinvitationsmodal266);
            loadInvitations();

            // Auto-clear success message after 4 seconds
            setTimeout(() => {
              setSuccess('');
            }, 4000);
          } else {
            const errorData = await response.json();
            setError(errorData.message || t.projectinvitationsmodal275);
          }
        } catch (error) {
          setError(error instanceof Error ? error.message : t.projectinvitationsmodal275);
        }
      }
    });
  };

  const statusTemplate = (invitation: ProjectInvitation) => {
    const statusMap = {
      pending: { severity: 'warning', label: t.projectinvitationsmodal286 },
      accepted: { severity: 'success', label: t.projectinvitationsmodal287 },
      declined: { severity: 'danger', label: t.projectinvitationsmodal288 },
      expired: { severity: 'info', label: t.projectinvitationsmodal289 }
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
            tooltip={t.projectinvitationsmodal305}
          />
        );
      case 'expired':
        return (
          <Button
            icon="pi pi-refresh"
            className="p-button-text p-button-warning"
            onClick={() => resendInvitation(invitation)}
            tooltip={t.projectinvitationsmodal314}
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
        label={t.authmodalsesetpasswordmodal162} 
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
      <ConfirmDialog group="project-invitations" />
      <div className="space-y-6">
        {error && <Message severity="error" text={error} />}
        {success && <Message severity="success" text={success} />}

        {/* Send New Invitation Form */}
        <div className="bg-gray-800 p-4 border-radius-md border border-gray-600">
          <h3 className="text-lg font-semibold mb-4 text-gray-100">{t.projectinvitationsmodal352}</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="field">
              <label htmlFor="email" className="font-medium text-gray-300">{t.projectinvitationsmodal356}</label>
              <InputText
                id="email"
                type="email"
                value={inviteForm.email}
                onChange={(e) => setInviteForm(prev => ({ ...prev, email: e.target.value }))}
                placeholder={t.projectinvitationsmodal370}
                required
              />
            </div>

            <div className="field">
              <label htmlFor="role" className="font-medium text-gray-300">{t.projectinvitationsmodal368}</label>
              <Dropdown
                id="role"
                value={inviteForm.role}
                options={roleOptions}
                onChange={(e) => setInviteForm(prev => ({ ...prev, role: e.value }))}
              />
            </div>
          </div>

          <div className="field">
            <label htmlFor="message" className="font-medium text-gray-300">{t.projectinvitationsmodal379}</label>
            <InputTextarea
              id="message"
              value={inviteForm.message}
              onChange={(e) => setInviteForm(prev => ({ ...prev, message: e.target.value }))}
              placeholder={t.projectinvitationsmodal392}
              rows={3}
            />
          </div>

          <Button
            label={t.manageteammodal437}
            icon="pi pi-send"
            onClick={sendInvitation}
            loading={sending}
            disabled={!inviteForm.email.trim()}
            className="mt-3"
          />
        </div>

        {/* Existing Invitations */}
        <div>
          <h3 className="text-lg font-semibold mb-4 text-gray-100">{t.projectinvitationsmodal401}</h3>
          
          <DataTable
            value={invitations}
            loading={loading}
            emptyMessage={t.projectinvitationsmodal414}
            stripedRows
            size="small"
          >
            <Column 
              field="invited_email" 
              header={t.projectinvitationsmodal420} 
              style={{ width: '25%' }}
            />
            <Column 
              field="role" 
              header={t.manageteammodal388} 
              style={{ width: '15%' }}
              body={(invitation) => (
                <Tag value={invitation.role} severity="info" />
              )}
            />
            <Column 
              field="status" 
              header={t.applicationsmodal335} 
              style={{ width: '15%' }}
              body={statusTemplate}
            />
            <Column 
              field="created_at" 
              header={t.projectinvitationsmodal439} 
              style={{ width: '20%' }}
              body={(invitation) => new Date(invitation.created_at).toLocaleDateString()}
            />
            <Column 
              field="expires_at" 
              header={t.projectinvitationsmodal445} 
              style={{ width: '20%' }}
              body={(invitation) => new Date(invitation.expires_at).toLocaleDateString()}
            />
            <Column 
              header={t.applicationsmodal354} 
              style={{ width: '15%' }}
              body={actionsTemplate}
            />
          </DataTable>
        </div>
      </div>
    </Dialog>
  );
}