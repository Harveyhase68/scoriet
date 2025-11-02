import React, { useState, useEffect, useRef } from 'react';
import { Dialog } from 'primereact/dialog';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Badge } from 'primereact/badge';
import { useToast } from '@/contexts/ToastContext';
import { apiClient as api } from '@/lib/api';
import { TabContentProps } from '@/types';
import { useTranslation, SupportedLanguage, getStoredLanguage } from '@/i18n';

const TabContent: React.FC<TabContentProps> = ({ children, style = {}, ...rest }) => {
  const ref = useRef<HTMLDivElement>(null);
  const setFocus = () => ref.current?.focus();

  return (
    <div
      {...rest}
      ref={ref}
      tabIndex={-1}
      style={{ flex: 1, padding: '5px 10px', ...style }}
      onMouseDownCapture={setFocus}
      onTouchStartCapture={setFocus}
      className="bg-gray-800 text-gray-100"
    >
      {children}
    </div>
  );
};

interface TemplateReview {
  id: number;
  template_id: number;
  reviewer_user_id: number;
  vote: number;
  comment: string | null;
  created_at: string;
  reviewer: {
    id: number;
    name: string;
    email: string;
  };
}

interface Template {
  id: number;
  name: string;
  description?: string;
  category: string;
  language: string;
  tags: string[];
  file_count: number;
  created_at: string;
  visibility: 'public' | 'private';
  review_status: 'draft' | 'pending_review' | 'approved' | 'rejected';
  review_score: number;
  creator: {
    id: number;
    name: string;
    email: string;
  };
  reviews?: TemplateReview[];
  user_has_reviewed?: boolean;
  user_review?: TemplateReview | null;
  reviews_needed?: number;
}

interface TemplateFile {
  id: number;
  file_name: string;
  file_path: string;
  output_path: string;
  file_content: string;
  file_type: string;
  file_order: number;
}

const TemplateReviewPanel: React.FC = () => {
  // i18n setup
  const [currentLanguage] = React.useState<SupportedLanguage>(getStoredLanguage());
  const { t: _t } = useTranslation(currentLanguage); // Future use for i18n
  const toast = useToast();

  // State
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(false);
  const [quickViewVisible, setQuickViewVisible] = useState(false);
  const [fullReviewVisible, setFullReviewVisible] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [templateFiles, setTemplateFiles] = useState<TemplateFile[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);

  // Check if current user is admin/system
  const userType = localStorage.getItem('user_type') || 'free';
  const isAdmin = userType === 'admin' || userType === 'system';

  useEffect(() => {
    loadPendingTemplates();
  }, []);

  const loadPendingTemplates = async () => {
    setLoading(true);
    try {
      const response = await api.request('/template-reviews/pending');
      setTemplates(response.templates || []);
    } catch (error: any) {
      toast.showError('Failed to load pending templates: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (templateId: number, vote: number) => {
    try {
      const response = await api.request(`/template-reviews/templates/${templateId}/review`, {
        method: 'POST',
        body: JSON.stringify({ vote, comment: null }),
      });

      toast.showSuccess(response.message || 'Review submitted successfully!');

      // Reload templates
      await loadPendingTemplates();
    } catch (error: any) {
      toast.showError('Failed to submit review: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleAdminApprove = async (templateId: number) => {
    try {
      const response = await api.request(`/template-reviews/templates/${templateId}/admin-approve`, {
        method: 'POST',
      });

      toast.showSuccess(response.message || 'Template approved by admin!');

      // Reload templates
      await loadPendingTemplates();
    } catch (error: any) {
      toast.showError('Failed to approve template: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleQuickView = (template: Template) => {
    setSelectedTemplate(template);
    setQuickViewVisible(true);
  };

  const handleFullReview = async (template: Template) => {
    setSelectedTemplate(template);
    setLoadingFiles(true);
    setFullReviewVisible(true);

    try {
      const response = await api.request(`/templates/${template.id}/files`);
      setTemplateFiles(response.files || []);
    } catch (error: any) {
      toast.showError('Failed to load template files: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoadingFiles(false);
    }
  };

  const handleDownloadFile = (file: TemplateFile) => {
    const blob = new Blob([file.file_content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = file.file_name;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportAll = async () => {
    if (!selectedTemplate) return;

    try {
      const response = await api.request(`/templates/${selectedTemplate.id}/export`);

      // Create blob from response
      const blob = new Blob([JSON.stringify(response, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${selectedTemplate.name}_export.json`;
      link.click();
      URL.revokeObjectURL(url);

      toast.showSuccess('Template exported successfully!');
    } catch (error: any) {
      toast.showError('Failed to export template: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleDownloadZip = async () => {
    if (!selectedTemplate) return;

    try {
      // Get auth token
      const token = localStorage.getItem('access_token');

      // Create download link with auth header
      const link = document.createElement('a');
      link.href = `/api/templates/${selectedTemplate.id}/download-zip`;
      link.download = `${selectedTemplate.name}.zip`;

      // Use fetch to download with auth
      const response = await fetch(`/api/templates/${selectedTemplate.id}/download-zip`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/zip',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to download ZIP');
      }

      // Get blob from response
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      // Trigger download
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);

      toast.showSuccess('Template ZIP downloaded successfully!');
    } catch (error: any) {
      toast.showError('Failed to download ZIP: ' + (error.message || 'Unknown error'));
    }
  };

  // Column renderers
  const nameBodyTemplate = (rowData: Template) => {
    return (
      <div>
        <div className="font-semibold text-white">{rowData.name}</div>
        {rowData.description && (
          <div className="text-sm text-gray-400 truncate max-w-xs">
            {rowData.description}
          </div>
        )}
      </div>
    );
  };

  const creatorBodyTemplate = (rowData: Template) => {
    return (
      <div>
        <div className="text-white">{rowData.creator.name}</div>
        <div className="text-xs text-gray-400">{rowData.creator.email}</div>
      </div>
    );
  };

  const categoryBodyTemplate = (rowData: Template) => {
    return <Tag value={rowData.category} severity="info" />;
  };

  const scoreBodyTemplate = (rowData: Template) => {
    const score = rowData.review_score || 0;
    const severity = score >= 3 ? 'success' : score >= 1 ? 'warning' : 'danger';

    return (
      <div className="flex items-center gap-2">
        <Tag
          value={`${score}/5`}
          severity={severity}
          icon="pi pi-star-fill"
        />
        {rowData.reviews_needed !== undefined && rowData.reviews_needed > 0 && (
          <Badge value={`${rowData.reviews_needed} needed`} severity="warning" />
        )}
      </div>
    );
  };

  const actionsBodyTemplate = (rowData: Template) => {
    const alreadyReviewed = rowData.user_has_reviewed;

    return (
      <div className="flex gap-2 flex-wrap">
        {/* Quick View */}
        <Button
          icon="pi pi-eye"
          tooltip="Quick View"
          tooltipOptions={{ position: 'top' }}
          size="small"
          severity="secondary"
          outlined
          onClick={() => handleQuickView(rowData)}
        />

        {/* Full Review */}
        <Button
          icon="pi pi-search"
          tooltip="Full Review"
          tooltipOptions={{ position: 'top' }}
          size="small"
          severity="info"
          outlined
          onClick={() => handleFullReview(rowData)}
        />

        {/* Vote Buttons */}
        {!alreadyReviewed ? (
          <>
            <Button
              icon="pi pi-check"
              label="+1"
              tooltip="Approve"
              tooltipOptions={{ position: 'top' }}
              size="small"
              severity="success"
              outlined
              onClick={() => handleVote(rowData.id, 1)}
            />
            <Button
              icon="pi pi-times"
              label="-1"
              tooltip="Reject"
              tooltipOptions={{ position: 'top' }}
              size="small"
              severity="danger"
              outlined
              onClick={() => handleVote(rowData.id, -1)}
            />
          </>
        ) : (
          <Tag
            value={`Reviewed: ${rowData.user_review?.vote === 1 ? '+1' : '-1'}`}
            severity={rowData.user_review?.vote === 1 ? 'success' : 'danger'}
            icon="pi pi-check-circle"
          />
        )}

        {/* Admin Override Button */}
        {isAdmin && (
          <Button
            icon="pi pi-bolt"
            label="Admin Approve"
            tooltip="Force approve to 5/5 (Admin Override)"
            tooltipOptions={{ position: 'top' }}
            size="small"
            severity="warning"
            onClick={() => handleAdminApprove(rowData.id)}
          />
        )}
      </div>
    );
  };

  return (
    <TabContent>
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="flex-shrink-0 mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <i className="pi pi-star-fill text-yellow-400"></i>
              Template Review Queue
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              Review public templates awaiting approval
            </p>
          </div>
          <Button
            icon="pi pi-refresh"
            label="Refresh"
            onClick={() => loadPendingTemplates()}
            disabled={loading}
            severity="secondary"
            outlined
          />
        </div>

        {/* DataTable */}
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <ProgressSpinner />
            </div>
          ) : (
            <DataTable
              value={templates}
              paginator
              rows={10}
              rowsPerPageOptions={[5, 10, 25, 50]}
              emptyMessage="No templates pending review"
              className="p-datatable-sm"
            >
              <Column
                field="name"
                header="Template"
                body={nameBodyTemplate}
                sortable
                style={{ minWidth: '250px' }}
              />
              <Column
                field="creator.name"
                header="Creator"
                body={creatorBodyTemplate}
                sortable
                style={{ minWidth: '150px' }}
              />
              <Column
                field="category"
                header="Category"
                body={categoryBodyTemplate}
                sortable
              />
              <Column
                field="language"
                header="Language"
                sortable
              />
              <Column
                field="file_count"
                header="Files"
                sortable
              />
              <Column
                field="review_score"
                header="Score"
                body={scoreBodyTemplate}
                sortable
              />
              <Column
                header="Actions"
                body={actionsBodyTemplate}
                style={{ minWidth: '300px' }}
              />
            </DataTable>
          )}
        </div>

        {/* Quick View Modal */}
        <Dialog
          header="Quick View"
          visible={quickViewVisible}
          onHide={() => setQuickViewVisible(false)}
          style={{ width: '600px' }}
          modal
        >
          {selectedTemplate && (
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-bold text-white">{selectedTemplate.name}</h3>
                <p className="text-gray-400 mt-2">{selectedTemplate.description || 'No description'}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-gray-400 text-sm">Category:</span>
                  <div className="mt-1">
                    <Tag value={selectedTemplate.category} severity="info" />
                  </div>
                </div>
                <div>
                  <span className="text-gray-400 text-sm">Language:</span>
                  <div className="mt-1 text-white">{selectedTemplate.language}</div>
                </div>
              </div>

              <div>
                <span className="text-gray-400 text-sm">Tags:</span>
                <div className="mt-1 flex gap-2 flex-wrap">
                  {selectedTemplate.tags && selectedTemplate.tags.length > 0 ? (
                    selectedTemplate.tags.map((tag, idx) => (
                      <Tag key={idx} value={tag} severity="secondary" />
                    ))
                  ) : (
                    <span className="text-gray-500">No tags</span>
                  )}
                </div>
              </div>

              <div>
                <span className="text-gray-400 text-sm">Creator:</span>
                <div className="mt-1">
                  <div className="text-white">{selectedTemplate.creator.name}</div>
                  <div className="text-xs text-gray-400">{selectedTemplate.creator.email}</div>
                </div>
              </div>

              <div>
                <span className="text-gray-400 text-sm">Review Score:</span>
                <div className="mt-1">
                  <Tag
                    value={`${selectedTemplate.review_score || 0}/5`}
                    severity={selectedTemplate.review_score >= 3 ? 'success' : 'warning'}
                    icon="pi pi-star-fill"
                  />
                  {selectedTemplate.reviews_needed !== undefined && (
                    <Badge
                      value={`${selectedTemplate.reviews_needed} more needed`}
                      severity="warning"
                      className="ml-2"
                    />
                  )}
                </div>
              </div>

              <div>
                <span className="text-gray-400 text-sm">Files:</span>
                <div className="mt-1 text-white">{selectedTemplate.file_count} files</div>
              </div>
            </div>
          )}
        </Dialog>

        {/* Full Review Modal */}
        <Dialog
          header="Full Review"
          visible={fullReviewVisible}
          onHide={() => setFullReviewVisible(false)}
          style={{ width: '90vw', maxWidth: '1200px' }}
          maximizable
          modal
        >
          {selectedTemplate && (
            <div className="space-y-4">
              {/* Template Info */}
              <div className="bg-gray-700 p-4 rounded">
                <h3 className="text-xl font-bold text-white mb-2">{selectedTemplate.name}</h3>
                <p className="text-gray-400">{selectedTemplate.description || 'No description'}</p>

                <div className="mt-4 flex gap-4 items-center">
                  <Tag value={selectedTemplate.category} severity="info" />
                  <Tag value={selectedTemplate.language} severity="secondary" />
                  <Tag
                    value={`${selectedTemplate.review_score || 0}/5 ⭐`}
                    severity={selectedTemplate.review_score >= 3 ? 'success' : 'warning'}
                  />
                  <Button
                    icon="pi pi-file-export"
                    label="Download ZIP"
                    size="small"
                    severity="success"
                    outlined
                    onClick={handleDownloadZip}
                  />
                  <Button
                    icon="pi pi-download"
                    label="Export JSON"
                    size="small"
                    severity="info"
                    outlined
                    onClick={handleExportAll}
                  />
                </div>
              </div>

              {/* Files List */}
              {loadingFiles ? (
                <div className="flex items-center justify-center py-8">
                  <ProgressSpinner />
                </div>
              ) : (
                <div className="space-y-3">
                  <h4 className="text-lg font-semibold text-white">Template Files ({templateFiles.length})</h4>
                  {templateFiles.map((file) => (
                    <div key={file.id} className="bg-gray-700 p-4 rounded">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <span className="text-white font-semibold">{file.file_name}</span>
                          <span className="text-gray-400 text-sm ml-2">({file.file_type})</span>
                        </div>
                        <Button
                          icon="pi pi-download"
                          label="Download"
                          size="small"
                          severity="info"
                          outlined
                          onClick={() => handleDownloadFile(file)}
                        />
                      </div>
                      <div className="bg-gray-800 p-3 rounded overflow-auto max-h-64">
                        <pre className="text-sm text-gray-300">
                          <code>{file.file_content}</code>
                        </pre>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </Dialog>
      </div>
    </TabContent>
  );
};

export default TemplateReviewPanel;
