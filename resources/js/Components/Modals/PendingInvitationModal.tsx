import React, { useState, useEffect } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Message } from 'primereact/message';
import { useTranslation, SupportedLanguage, getStoredLanguage } from '@/i18n';

interface PendingInvitationModalProps {
  visible: boolean;
  onHide: () => void;
  onAccepted?: () => void;
  onDeclined?: () => void;
}

interface PendingInvitationData {
  id: number;
  invited_email: string;
  role: string;
  message?: string;
  expires_at: string;
  project: {
    id: number;
    name: string;
    description?: string;
    owner: {
      name: string;
      email: string;
    };
  };
  inviter: {
    name: string;
    email: string;
  };
}

export default function PendingInvitationModal({ 
  visible, 
  onHide, 
  onAccepted, 
  onDeclined 
}: PendingInvitationModalProps) {
  // i18n setup
  const [currentLanguage] = React.useState<SupportedLanguage>(getStoredLanguage());
  const { t } = useTranslation(currentLanguage);

  const [invitation, setInvitation] = useState<PendingInvitationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadPendingInvitation = React.useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (!token) {
        setError(t.applicationsmodal66);
        return;
      }

      const response = await fetch('/api/my-pending-invitation', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          // No pending invitation
          onHide();
          return;
        }
        throw new Error(t.pendinginvitationmodal70);
      }

      const data = await response.json();
      setInvitation(data);
    } catch (error) {
      setError(error instanceof Error ? error.message : t.pendinginvitationmodal76);
    } finally {
      setLoading(false);
    }
  }, [onHide]);

  useEffect(() => {
    if (visible) {
      loadPendingInvitation();
    }
  }, [visible, loadPendingInvitation]);

  const handleAccept = async () => {
    if (!invitation) return;

    try {
      setProcessing(true);
      setError('');

      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (!token) {
        setError(t.applicationsmodal66);
        return;
      }

      const response = await fetch('/api/my-pending-invitation/accept', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(t.pendinginvitationmodal112);
        setTimeout(() => {
          onAccepted?.();
          onHide();
        }, 2000);
      } else {
        throw new Error(data.message || t.projectinvitationcontroller150);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : t.pendinginvitationmodal121);
    } finally {
      setProcessing(false);
    }
  };

  const handleDecline = async () => {
    if (!invitation) return;

    try {
      setProcessing(true);
      setError('');

      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (!token) {
        setError(t.applicationsmodal66);
        return;
      }

      const response = await fetch('/api/my-pending-invitation/decline', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(t.projectinvitationcontroller358);
        setTimeout(() => {
          onDeclined?.();
          onHide();
        }, 1500);
      } else {
        throw new Error(data.message || t.projectinvitationcontroller179);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : t.pendinginvitationmodal160);
    } finally {
      setProcessing(false);
    }
  };

  const dialogFooter = success ? null : (
    <div className="flex justify-center space-x-4">
      <Button
        label={t.pendinginvitationmodal169}
        icon={processing ? "pi pi-spinner pi-spin" : "pi pi-check"}
        onClick={handleAccept}
        disabled={processing || loading}
        className="p-button-success"
      />
      <Button
        label={t.pendinginvitationmodal176}
        icon={processing ? "pi pi-spinner pi-spin" : "pi pi-times"}
        onClick={handleDecline}
        disabled={processing || loading}
        className="p-button-danger p-button-outlined"
      />
    </div>
  );

  return (
    <Dialog
      visible={visible}
      onHide={onHide}
      header={t.pendinginvitationmodal189}
      style={{ width: '600px' }}
      footer={dialogFooter}
      closable={!processing}
      dismissableMask={!processing}
      className="p-fluid p-dialog-custom"
    >
      <div className="space-y-4">
        {loading && (
          <div className="text-center py-8">
            <ProgressSpinner />
            <p className="text-gray-500 mt-2">Loading invitation...</p>
          </div>
        )}

        {error && <Message severity="error" text={error} />}
        {success && <Message severity="success" text={success} />}

        {!loading && !success && invitation && (
          <>
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold text-gray-100 mb-2">
                You've been invited to join a project!
              </h3>
              <p className="text-gray-400">
                Complete your registration by accepting this invitation
              </p>
            </div>

            {/* Project Information */}
            <div className="bg-gray-700 rounded-lg p-6">
              <div className="space-y-4">
                <div>
                  <h4 className="text-lg font-semibold text-white mb-2">
                    {invitation.project.name}
                  </h4>
                  {invitation.project.description && (
                    <p className="text-gray-300 text-sm mb-3">
                      {invitation.project.description}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Invited by:</span>
                    <div className="text-white font-medium">
                      {invitation.inviter.name}
                    </div>
                    <div className="text-gray-300">
                      {invitation.inviter.email}
                    </div>
                  </div>
                  
                  <div>
                    <span className="text-gray-400">Your Role:</span>
                    <div className="text-white font-medium capitalize">
                      {invitation.role}
                    </div>
                  </div>

                  <div>
                    <span className="text-gray-400">Project Owner:</span>
                    <div className="text-white font-medium">
                      {invitation.project.owner.name}
                    </div>
                    <div className="text-gray-300">
                      {invitation.project.owner.email}
                    </div>
                  </div>

                  <div>
                    <span className="text-gray-400">Expires:</span>
                    <div className="text-white font-medium">
                      {new Date(invitation.expires_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                {invitation.message && (
                  <div className="border-t border-gray-600 pt-4">
                    <span className="text-gray-400 text-sm">Personal message:</span>
                    <div className="bg-yellow-100 border-l-4 border-yellow-500 p-3 mt-2 rounded">
                      <p className="text-yellow-800 italic text-sm">"{invitation.message}"</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="text-center">
              <p className="text-gray-400 text-sm">
                By accepting, you'll become a <strong>{invitation.role}</strong> of this project 
                and gain access to collaborate with the team.
              </p>
            </div>
          </>
        )}
      </div>
    </Dialog>
  );
}