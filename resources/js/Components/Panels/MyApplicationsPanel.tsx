import React, { useState, useEffect } from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { Message } from 'primereact/message';
import { Dialog } from 'primereact/dialog';

interface TabPanelProps {
  isActive: boolean;
}

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
  project: {
    id: number;
    name: string;
    description: string;
    owner: {
      id: number;
      name: string;
      username?: string;
    };
  };
  reviewer?: {
    id: number;
    name: string;
    username?: string;
  };
}

export default function MyApplicationsPanel({ isActive }: TabPanelProps) {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    if (isActive) {
      loadApplications();
    }
  }, [isActive]);

  const loadApplications = async () => {
    try {
      setLoading(true);
      setError('');
      
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (!token) {
        setError('Not authenticated');
        return;
      }

      const response = await fetch('/api/my-applications', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load applications');
      }

      const data = await response.json();
      setApplications(data.applications || []);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading applications');
    } finally {
      setLoading(false);
    }
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

    const getIcon = (status: string) => {
      switch (status) {
        case 'approved': return 'pi-check-circle';
        case 'rejected': return 'pi-times-circle';
        default: return 'pi-clock';
      }
    };

    return (
      <div className="flex items-center space-x-2">
        <Tag 
          value={application.status.charAt(0).toUpperCase() + application.status.slice(1)} 
          severity={getSeverity(application.status)}
          icon={getIcon(application.status)}
        />
      </div>
    );
  };

  const projectTemplate = (application: Application) => {
    return (
      <div>
        <div className="font-medium">{application.project.name}</div>
        <div className="text-sm text-gray-500">
          by {application.project.owner.name}
          {application.project.owner.username && ` (@${application.project.owner.username})`}
        </div>
      </div>
    );
  };

  const messageTemplate = (application: Application) => {
    if (!application.message) {
      return <span className="text-gray-400 italic">No message</span>;
    }

    const shortMessage = application.message.length > 40 
      ? application.message.substring(0, 37) + '...'
      : application.message;

    return (
      <div className="flex items-center space-x-2">
        <span>{shortMessage}</span>
        {application.message.length > 40 && (
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
    return (
      <Button
        icon="pi pi-eye"
        className="p-button-rounded p-button-text p-button-sm"
        tooltip="View details"
        onClick={() => {
          setSelectedApplication(application);
          setShowDetailsModal(true);
        }}
      />
    );
  };

  const reviewNotesTemplate = (application: Application) => {
    if (!application.review_notes) {
      return <span className="text-gray-400">-</span>;
    }

    const shortNotes = application.review_notes.length > 30 
      ? application.review_notes.substring(0, 27) + '...'
      : application.review_notes;

    return (
      <div className="flex items-center space-x-2">
        <span className="text-sm">{shortNotes}</span>
        {application.review_notes.length > 30 && (
          <Button
            icon="pi pi-info-circle"
            className="p-button-rounded p-button-text p-button-sm"
            tooltip={application.review_notes}
          />
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <i className="pi pi-spinner pi-spin text-4xl text-blue-500 mb-4"></i>
          <p className="text-gray-600">Loading applications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full p-6 bg-gray-900 text-white">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <i className="pi pi-send text-2xl text-blue-600"></i>
          <h1 className="text-2xl font-bold text-white">My Applications</h1>
        </div>
        <Button
          icon="pi pi-refresh"
          label="Refresh"
          className="p-button-outlined"
          onClick={loadApplications}
          disabled={loading}
        />
      </div>

      {error && (
        <Message severity="error" text={error} className="mb-4" />
      )}

      <Card title="Application History" className="flex-1">
        {applications.length === 0 ? (
          <div className="text-center py-8">
            <i className="pi pi-inbox text-6xl text-gray-500 mb-4"></i>
            <h3 className="text-lg font-medium text-gray-600 mb-2">No Applications</h3>
            <p className="text-gray-400 mb-4">You haven't applied to any projects yet.</p>
          </div>
        ) : (
          <DataTable
            value={applications}
            className="p-datatable-sm"
            paginator
            rows={10}
            rowsPerPageOptions={[5, 10, 20]}
            emptyMessage="No applications found"
          >
            <Column 
              field="project" 
              header="Project" 
              body={projectTemplate}
              sortable
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
              style={{ width: '120px' }}
            />
            
            <Column 
              field="created_at" 
              header="Applied" 
              body={(app) => formatDate(app.created_at)}
              style={{ width: '140px' }}
              sortable
            />
            
            <Column 
              field="review_notes" 
              header="Response" 
              body={reviewNotesTemplate}
              style={{ width: '150px' }}
            />
            
            <Column 
              header="Actions" 
              body={actionTemplate}
              style={{ width: '80px' }}
            />
          </DataTable>
        )}
      </Card>

      {/* Application Details Modal */}
      <Dialog
        header="Application Details"
        visible={showDetailsModal}
        onHide={() => setShowDetailsModal(false)}
        style={{ width: '600px' }}
        modal
        closable
        draggable={false}
        resizable={false}
        className="p-dialog-custom"
      >
        {selectedApplication && (
          <div className="space-y-4">
            {/* Project Info */}
            <Card title="Project Information">
              <div className="space-y-2">
                <div>
                  <h3 className="text-lg font-semibold">{selectedApplication.project.name}</h3>
                  <p className="text-gray-600">{selectedApplication.project.description || 'No description provided'}</p>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <i className="pi pi-user text-blue-500"></i>
                  <span>{selectedApplication.project.owner.name}</span>
                  {selectedApplication.project.owner.username && (
                    <span className="text-gray-500">@{selectedApplication.project.owner.username}</span>
                  )}
                </div>
              </div>
            </Card>

            {/* Application Info */}
            <Card title="Application Information">
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="font-medium text-gray-700">Status:</span>
                    <div className="mt-1">
                      {statusTemplate(selectedApplication)}
                    </div>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Applied:</span>
                    <div className="mt-1 text-sm">{formatDate(selectedApplication.created_at)}</div>
                  </div>
                </div>

                <div>
                  <span className="font-medium text-gray-700">Join Code:</span>
                  <div className="mt-1">
                    <code className="px-2 py-1 bg-gray-100 rounded text-sm font-mono">
                      {selectedApplication.join_code}
                    </code>
                  </div>
                </div>

                {selectedApplication.message && (
                  <div>
                    <span className="font-medium text-gray-700">Your Message:</span>
                    <div className="mt-1 p-3 bg-gray-50 rounded text-sm">
                      {selectedApplication.message}
                    </div>
                  </div>
                )}

                {selectedApplication.status !== 'pending' && (
                  <div>
                    <span className="font-medium text-gray-700">
                      {selectedApplication.status === 'approved' ? 'Approval' : 'Rejection'} Details:
                    </span>
                    <div className="mt-1 space-y-2">
                      <div className="text-sm">
                        <span className="font-medium">Reviewed by:</span> {selectedApplication.reviewer?.name || 'Unknown'}
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">Date:</span> {selectedApplication.reviewed_at ? formatDate(selectedApplication.reviewed_at) : 'Unknown'}
                      </div>
                      {selectedApplication.review_notes && (
                        <div className="p-3 bg-gray-50 rounded text-sm">
                          <span className="font-medium">Response:</span>
                          <p className="mt-1">{selectedApplication.review_notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </Card>

            <div className="flex justify-end pt-4">
              <Button
                label="Close"
                icon="pi pi-times"
                onClick={() => setShowDetailsModal(false)}
                className="p-button-text"
              />
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}