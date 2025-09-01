import React, { useState, useEffect, useCallback } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { Message } from 'primereact/message';
import { InputTextarea } from 'primereact/inputtextarea';
import { Card } from 'primereact/card';

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
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject'>('approve');
  const [reviewNotes, setReviewNotes] = useState('');
  const [reviewing, setReviewing] = useState(false);

  useEffect(() => {
    if (visible && project) {
      loadApplications();
    }
  }, [visible, project, loadApplications]);

  const loadApplications = useCallback(async () => {
    if (!project) return;

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`/api/projects/${project.id}/applications`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to load applications');
      }

      const data = await response.json();
      setApplications(data.applications || []);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading applications');
    } finally {
      setLoading(false);
    }
  }, [project]);

  const handleReview = async () => {
    if (!selectedApplication) return;

    setReviewing(true);
    setError('');

    try {
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`/api/applications/${selectedApplication.id}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          action: reviewAction,
          notes: reviewNotes
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to review application');
      }

      setSuccess(`Application ${reviewAction === 'approve' ? 'approved' : 'rejected'} successfully`);
      setShowReviewModal(false);
      setSelectedApplication(null);
      setReviewNotes('');
      
      // Refresh applications
      await loadApplications();

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error reviewing application');
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
    return new Date(dateString).toLocaleDateString('de-DE', {
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
        <i className="pi pi-user text-blue-500"></i>
        <div>
          <div className="font-medium">{application.user.name}</div>
          {application.user.username && (
            <div className="text-sm text-gray-500">@{application.user.username}</div>
          )}
        </div>
      </div>
    );
  };

  const messageTemplate = (application: Application) => {
    if (!application.message) {
      return <span className="text-gray-400 italic">No message</span>;
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
        <div className="flex space-x-1">
          <Button
            icon="pi pi-check"
            className="p-button-rounded p-button-sm p-button-success"
            tooltip="Approve application"
            onClick={() => openReviewModal(application, 'approve')}
          />
          <Button
            icon="pi pi-times"
            className="p-button-rounded p-button-sm p-button-danger"
            tooltip="Reject application"
            onClick={() => openReviewModal(application, 'reject')}
          />
        </div>
      );
    }

    return null;
  };

  const reviewTemplate = (application: Application) => {
    if (application.status === 'pending') {
      return <span className="text-gray-400">-</span>;
    }

    return (
      <div>
        <div className="text-sm">
          {application.reviewer?.name || 'Unknown'}
        </div>
        <div className="text-xs text-gray-500">
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
        modal
        closable
        draggable={false}
        resizable={false}
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
              <i className="pi pi-spinner pi-spin text-2xl text-blue-500"></i>
            </div>
          ) : (
            <DataTable
              value={applications}
              className="p-datatable-sm"
              emptyMessage="No applications found"
              paginator
              rows={10}
              rowsPerPageOptions={[5, 10, 20]}
              header={
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">
                    Applications ({applications.length})
                  </span>
                  <Button
                    icon="pi pi-refresh"
                    className="p-button-rounded p-button-text"
                    tooltip="Refresh"
                    onClick={loadApplications}
                    disabled={loading}
                  />
                </div>
              }
            >
              <Column 
                field="user" 
                header="Applicant" 
                body={userTemplate}
                style={{ width: '200px' }}
              />
              
              <Column 
                field="message" 
                header="Message" 
                body={messageTemplate}
              />
              
              <Column 
                field="status" 
                header="Status" 
                body={statusTemplate}
                style={{ width: '100px' }}
              />
              
              <Column 
                field="created_at" 
                header="Applied" 
                body={(app) => formatDate(app.created_at)}
                style={{ width: '120px' }}
              />
              
              <Column 
                header="Reviewed By" 
                body={reviewTemplate}
                style={{ width: '150px' }}
              />
              
              <Column 
                header="Actions" 
                body={actionTemplate}
                style={{ width: '100px' }}
              />
            </DataTable>
          )}

          <div className="flex justify-end pt-4">
            <Button
              label="Close"
              icon="pi pi-times"
              onClick={handleClose}
              className="p-button-text"
            />
          </div>
        </div>
      </Dialog>

      {/* Review Application Modal */}
      <Dialog
        header={`${reviewAction === 'approve' ? 'Approve' : 'Reject'} Application`}
        visible={showReviewModal}
        onHide={() => setShowReviewModal(false)}
        style={{ width: '450px' }}
        modal
        closable
        draggable={false}
        resizable={false}
        className="p-dialog-custom"
      >
        <div className="space-y-4">
          {selectedApplication && (
            <Card>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <i className="pi pi-user text-blue-500"></i>
                  <strong>{selectedApplication.user.name}</strong>
                  {selectedApplication.user.username && (
                    <span className="text-gray-500">@{selectedApplication.user.username}</span>
                  )}
                </div>
                
                <div className="text-sm text-gray-600">
                  Applied on {formatDate(selectedApplication.created_at)}
                </div>
                
                {selectedApplication.message && (
                  <div className="p-3 bg-gray-50 rounded text-sm">
                    <strong>Message:</strong>
                    <p className="mt-1">{selectedApplication.message}</p>
                  </div>
                )}
              </div>
            </Card>
          )}

          <div className="field">
            <label htmlFor="review-notes" className="block text-sm font-medium text-gray-700 mb-2">
              {reviewAction === 'approve' ? 'Welcome Message' : 'Rejection Reason'} (Optional)
            </label>
            <InputTextarea
              id="review-notes"
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              placeholder={
                reviewAction === 'approve' 
                  ? "Welcome them to the project..."
                  : "Let them know why their application was rejected..."
              }
              className="w-full"
              rows={3}
              disabled={reviewing}
              maxLength={500}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              label="Cancel"
              icon="pi pi-times"
              onClick={() => setShowReviewModal(false)}
              className="p-button-text"
              disabled={reviewing}
            />
            <Button
              label={reviewing ? "Processing..." : (reviewAction === 'approve' ? 'Approve' : 'Reject')}
              icon={reviewing ? "pi pi-spinner pi-spin" : (reviewAction === 'approve' ? "pi pi-check" : "pi pi-times")}
              onClick={handleReview}
              className={reviewAction === 'approve' ? 'p-button-success' : 'p-button-danger'}
              disabled={reviewing}
            />
          </div>
        </div>
      </Dialog>
    </>
  );
}