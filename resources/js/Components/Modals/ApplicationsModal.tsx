import React, { useState, useEffect, useCallback } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { InputTextarea } from 'primereact/inputtextarea';
import { Card } from 'primereact/card';
import { Message } from 'primereact/message';
import { useTranslation, SupportedLanguage, getStoredLanguage } from '@/i18n';
import { useTheme } from '@/contexts/ThemeContext';

interface Application {
  id: number;
  project_id: number;
  user_id: number;
  join_code: string;
  message: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewed_by?: number;
  reviewed_at?: string;
  review_notes?: string;
  created_at: string;
  user: {
    id: number;
    name: string;
    email: string;
    username?: string;
  };
  reviewer?: {
    id: number;
    name: string;
    username?: string;
  };
}

interface Project {
  id: number;
  name: string;
}

interface ApplicationsModalProps {
  visible: boolean;
  onHide: () => void;
  project: Project | null;
}

export default function ApplicationsModal({ visible, onHide, project }: ApplicationsModalProps) {
  // i18n setup
  const [currentLanguage] = React.useState<SupportedLanguage>(getStoredLanguage());
  const { t } = useTranslation(currentLanguage);
  const { colors } = useTheme();

  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject'>('approve');
  const [reviewNotes, setReviewNotes] = useState('');
  const [reviewing, setReviewing] = useState(false);

  const loadApplications = useCallback(async () => {
    if (!project) return;

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (!token) {
        throw new Error(t.applicationsmodal66);
      }

      const response = await fetch(`/api/projects/${project.id}/applications`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || t.applicationsmodal78);
      }

      const data = await response.json();
      setApplications(data.applications || []);

    } catch (error) {
      setError(error instanceof Error ? error.message : t.applicationsmodal85);
    } finally {
      setLoading(false);
    }
  }, [project]);

  useEffect(() => {
    if (visible && project) {
      loadApplications();
    }
  }, [visible, project, loadApplications]);

  const handleReview = async () => {
    if (!selectedApplication) return;

    setReviewing(true);
    setError('');

    try {
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (!token) {
        throw new Error(t.applicationsmodal66);
      }

      const response = await fetch('/api/project-application-review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          application_id: selectedApplication.id,
          action: reviewAction,
          notes: reviewNotes
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || t.applicationsmodal125);
      }

      setSuccess(`Application ${reviewAction === 'approve' ? 'approved' : 'rejected'} successfully`);
      setShowReviewModal(false);
      setSelectedApplication(null);
      setReviewNotes('');

      // Refresh applications
      await loadApplications();

      // Notify TopBar about application changes so it can update the notification bell
      const event = new CustomEvent('applicationsUpdated', {
        detail: { projectId: project?.id }
      });
      window.dispatchEvent(event);

    } catch (error) {
      setError(error instanceof Error ? error.message : t.applicationsmodal143);
    } finally {
      setReviewing(false);
    }
  };

  const openReviewModal = (application: Application, action: 'approve' | 'reject') => {
    setSelectedApplication(application);
    setReviewAction(action);
    setReviewNotes('');
    setShowReviewModal(true);
    setError('');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(currentLanguage, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const statusTemplate = (application: Application) => {
    const getSeverity = (status: string) => {
      switch (status) {
        case 'approved': return 'success';
        case 'rejected': return 'danger';
        default: return 'warning';
      }
    };

    return (
      <Tag 
        value={application.status.charAt(0).toUpperCase() + application.status.slice(1)} 
        severity={getSeverity(application.status)}
      />
    );
  };

  const userTemplate = (application: Application) => {
    return (
      <div className="flex items-center space-x-2">
        <i className="pi pi-user" style={{ color: colors.accent }}></i>
        <div>
          <div className="font-medium" style={{ color: colors.textPrimary }}>{application.user.name}</div>
          {application.user.username && (
            <div className="text-sm" style={{ color: colors.textMuted }}>@{application.user.username}</div>
          )}
        </div>
      </div>
    );
  };

  const messageTemplate = (application: Application) => {
    if (!application.message) {
      return <span className="italic" style={{ color: colors.textMuted }}>{t.applicationsmodal207}</span>;
    }

    const shortMessage = application.message.length > 50 
      ? application.message.substring(0, 47) + '...'
      : application.message;

    return (
      <div className="flex items-center space-x-2">
        <span>{shortMessage}</span>
        {application.message.length > 50 && (
          <Button
            icon="pi pi-info-circle"
            className="p-button-rounded p-button-text p-button-sm"
            tooltip={application.message}
          />
        )}
      </div>
    );
  };

  const actionTemplate = (application: Application) => {
    if (application.status === 'pending') {
      return (
        <div className="flex gap-2">
          <Button
            icon="pi pi-check"
            className="p-button-rounded p-button-sm p-button-success"
            tooltip={t.applicationsmodal228}
            onClick={() => openReviewModal(application, 'approve')}
          />
          <Button
            icon="pi pi-times"
            className="p-button-rounded p-button-sm p-button-danger"
            tooltip={t.applicationsmodal234}
            onClick={() => openReviewModal(application, 'reject')}
          />
        </div>
      );
    }

    return null;
  };

  const reviewTemplate = (application: Application) => {
    if (application.status === 'pending') {
      return <span style={{ color: colors.textMuted }}>-</span>;
    }

    return (
      <div>
        <div className="text-sm" style={{ color: colors.textPrimary }}>
          {application.reviewer?.name || t.testprojectschemas50}
        </div>
        <div className="text-xs" style={{ color: colors.textMuted }}>
          {application.reviewed_at ? formatDate(application.reviewed_at) : ''}
        </div>
      </div>
    );
  };

  const handleClose = () => {
    setApplications([]);
    setError('');
    setSuccess('');
    setSelectedApplication(null);
    setShowReviewModal(false);
    setReviewNotes('');
    onHide();
  };

  return (
    <>
      <Dialog
        header={`Applications - ${project?.name || ''}`}
        visible={visible}
        onHide={handleClose}
        style={{ width: '900px' }}
        contentStyle={{ backgroundColor: colors.bgPrimary, color: colors.textPrimary }}
        headerStyle={{ backgroundColor: colors.dialogHeader, color: colors.textPrimary }}
        modal
        closable
        draggable={true}
        resizable={true}
        className="p-dialog-custom"
      >
        <div className="space-y-4">
          {error && (
            <Message severity="error" text={error} />
          )}

          {success && (
            <Message severity="success" text={success} />
          )}

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <i className="pi pi-spinner pi-spin text-2xl" style={{ color: colors.accent }}></i>
            </div>
          ) : (
            <DataTable
              value={applications}
              className="p-datatable-sm applications-modal-table"
              emptyMessage={t.applicationsmodal301}
              paginator
              rows={10}
              rowsPerPageOptions={[5, 10, 20]}
              header={
                <div className="flex justify-between items-center" style={{ backgroundColor: colors.bgTertiary, color: colors.textPrimary }}>
                  <span className="text-lg font-semibold" style={{ color: colors.textPrimary }}>
                    Applications ({applications.length})
                  </span>
                  <Button
                    icon="pi pi-refresh"
                    className="p-button-rounded p-button-text"
                    tooltip={t.applicationsmodal313}
                    onClick={loadApplications}
                    disabled={loading}
                  />
                </div>
              }
            >
              <Column 
                field="user" 
                header={t.applicationsmodal322} 
                body={userTemplate}
                style={{ width: '200px' }}
              />
              
              <Column 
                field="message" 
                header={t.applicationsmodal329} 
                body={messageTemplate}
              />
              
              <Column 
                field="status" 
                header={t.applicationsmodal335} 
                body={statusTemplate}
                style={{ width: '100px' }}
              />
              
              <Column 
                field="created_at" 
                header={t.applicationsmodal342} 
                body={(app) => formatDate(app.created_at)}
                style={{ width: '120px' }}
              />
              
              <Column 
                header={t.applicationsmodal348} 
                body={reviewTemplate}
                style={{ width: '150px' }}
              />
              
              <Column 
                header={t.applicationsmodal354} 
                body={actionTemplate}
                style={{ width: '100px' }}
              />
            </DataTable>
          )}

          <div className="flex justify-end pt-4">
            <Button
              label={t.authmodalsesetpasswordmodal162}
              icon="pi pi-times"
              onClick={handleClose}
              className="p-button-text"
            />
          </div>
        </div>
      </Dialog>

      {/* Review Application Modal */}
      <Dialog
        header={`${reviewAction === 'approve' ? 'Approve' : t.applicationsmodal374} Application`}
        visible={showReviewModal}
        onHide={() => setShowReviewModal(false)}
        style={{ width: '450px' }}
        contentStyle={{ backgroundColor: colors.bgPrimary, color: colors.textPrimary }}
        headerStyle={{ backgroundColor: colors.dialogHeader, color: colors.textPrimary }}
        modal
        closable
        draggable={true}
        resizable={true}
        className="p-dialog-custom"
      >
        <div className="space-y-4">
          {selectedApplication && (
            <Card style={{ backgroundColor: colors.bgSecondary, color: colors.textPrimary }}>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <i className="pi pi-user" style={{ color: colors.accent }}></i>
                  <strong style={{ color: colors.textPrimary }}>{selectedApplication.user.name}</strong>
                  {selectedApplication.user.username && (
                    <span style={{ color: colors.textMuted }}>@{selectedApplication.user.username}</span>
                  )}
                </div>

                <div className="text-sm" style={{ color: colors.textSecondary }}>
                  Applied on {formatDate(selectedApplication.created_at)}
                </div>

                {selectedApplication.message && (
                  <div className="p-3 rounded text-sm" style={{ backgroundColor: colors.bgTertiary, color: colors.textPrimary }}>
                    <strong style={{ color: colors.textSecondary }}>Message:</strong>
                    <p className="mt-1" style={{ color: colors.textPrimary }}>{selectedApplication.message}</p>
                  </div>
                )}
              </div>
            </Card>
          )}

          <div className="field">
            <label htmlFor="review-notes" className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
              {reviewAction === 'approve' ? 'Welcome Message' : t.applicationsmodal412} (Optional)
            </label>
            <InputTextarea
              id="review-notes"
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              placeholder={
                reviewAction === 'approve'
                  ? t.applicationsmodal420
                  : t.applicationsmodal421
              }
              className="w-full"
              rows={3}
              disabled={reviewing}
              maxLength={500}
              style={{ backgroundColor: colors.bgSecondary, color: colors.textPrimary, borderColor: colors.borderPrimary }}
            />
          </div>

          <div className="flex justify-end gap-4 pt-4">
            <Button
              label={t.applicationsmodal432}
              icon="pi pi-times"
              onClick={() => setShowReviewModal(false)}
              className="p-button-text"
              disabled={reviewing}
            />
            <Button
              label={reviewing ? t.applicationsmodal439 : (reviewAction === 'approve' ? 'Approve' : t.applicationsmodal374)}
              icon={reviewing ? "pi pi-spinner pi-spin" : (reviewAction === 'approve' ? "pi pi-check" : "pi pi-times")}
              onClick={handleReview}
              className={reviewAction === 'approve' ? 'p-button-success' : 'p-button-danger'}
              disabled={reviewing}
            />
          </div>
        </div>
      </Dialog>

      {/* Theme-aware DataTable styles */}
      <style>{`
        .applications-modal-table.p-datatable {
          background-color: var(--theme-bg-secondary) !important;
          color: var(--theme-text-primary) !important;
        }
        .applications-modal-table .p-datatable-header {
          background-color: var(--theme-bg-tertiary) !important;
          color: var(--theme-text-primary) !important;
          border-color: var(--theme-border-primary) !important;
        }
        .applications-modal-table .p-datatable-thead > tr > th {
          background-color: var(--theme-bg-tertiary) !important;
          color: var(--theme-text-primary) !important;
          border-color: var(--theme-border-primary) !important;
        }
        .applications-modal-table .p-datatable-tbody > tr {
          background-color: var(--theme-bg-secondary) !important;
          color: var(--theme-text-primary) !important;
        }
        .applications-modal-table .p-datatable-tbody > tr > td {
          border-color: var(--theme-border-primary) !important;
        }
        .applications-modal-table .p-datatable-tbody > tr:hover {
          background-color: var(--theme-bg-hover) !important;
        }
        .applications-modal-table .p-paginator {
          background-color: var(--theme-bg-tertiary) !important;
          color: var(--theme-text-primary) !important;
          border-color: var(--theme-border-primary) !important;
        }
        .applications-modal-table .p-paginator .p-paginator-pages .p-paginator-page {
          color: var(--theme-text-primary) !important;
        }
        .applications-modal-table .p-paginator .p-paginator-pages .p-paginator-page.p-highlight {
          background-color: var(--theme-accent) !important;
          color: white !important;
        }
        .applications-modal-table .p-paginator .p-paginator-first,
        .applications-modal-table .p-paginator .p-paginator-prev,
        .applications-modal-table .p-paginator .p-paginator-next,
        .applications-modal-table .p-paginator .p-paginator-last {
          color: var(--theme-text-primary) !important;
        }
        .applications-modal-table .p-paginator .p-dropdown {
          background-color: var(--theme-bg-secondary) !important;
          color: var(--theme-text-primary) !important;
          border-color: var(--theme-border-primary) !important;
        }
        .applications-modal-table .p-paginator .p-dropdown .p-dropdown-label {
          color: var(--theme-text-primary) !important;
        }
        .applications-modal-table .p-paginator .p-inputtext {
          background-color: var(--theme-bg-secondary) !important;
          color: var(--theme-text-primary) !important;
          border-color: var(--theme-border-primary) !important;
        }
      `}</style>
    </>
  );
}