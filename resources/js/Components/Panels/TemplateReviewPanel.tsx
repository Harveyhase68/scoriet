import React, { useState, useEffect, useRef } from 'react';
import { Dialog } from 'primereact/dialog';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Badge } from 'primereact/badge';
import { useToast } from '@/contexts/ToastContext';
import { useTheme } from '@/contexts/ThemeContext';
import { apiClient as api } from '@/lib/api';
import { TabContentProps } from '@/types';
import { useTranslation, SupportedLanguage, getStoredLanguage } from '@/i18n';

const TabContent: React.FC<TabContentProps & { colors: any }> = ({ children, style = {}, colors, ...rest }) => {
  const ref = useRef<HTMLDivElement>(null);
  const setFocus = () => ref.current?.focus();

  return (
    <div
      {...rest}
      ref={ref}
      tabIndex={-1}
      style={{ flex: 1, padding: '5px 10px', backgroundColor: colors.bgPrimary, color: colors.textPrimary, ...style }}
      onMouseDownCapture={setFocus}
      onTouchStartCapture={setFocus}
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
  visibility: 'public' | 'private' | 'store';
  review_status: 'draft' | 'pending_review' | 'approved' | 'rejected';
  review_score: number;
  is_store_approved?: boolean;
  price_type?: 'credits' | 'euros';
  price_credits?: number;
  price_euros?: number;
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
  const { colors } = useTheme();

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
  const isInnerCore = localStorage.getItem('is_inner_core') === '1';

  useEffect(() => {
    if (isInnerCore) {
      loadPendingTemplates();
    }
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
      // API returns array directly, not wrapped in { files: [...] }
      setTemplateFiles(Array.isArray(response) ? response : (response.files || []));
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
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');

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
        <div className="font-semibold" style={{ color: colors.textPrimary }}>{rowData.name}</div>
        {rowData.description && (
          <div className="text-sm truncate max-w-xs" style={{ color: colors.textMuted }}>
            {rowData.description}
          </div>
        )}
      </div>
    );
  };

  const creatorBodyTemplate = (rowData: Template) => {
    return (
      <div>
        <div style={{ color: colors.textPrimary }}>{rowData.creator.name}</div>
        <div className="text-xs" style={{ color: colors.textMuted }}>{rowData.creator.email}</div>
      </div>
    );
  };

  const categoryBodyTemplate = (rowData: Template) => {
    return <Tag value={rowData.category} severity="info" />;
  };

  const visibilityBodyTemplate = (rowData: Template) => {
    if (rowData.visibility === 'store') {
      let priceText = 'Preis nicht gesetzt';
      if (rowData.price_type === 'euros' && rowData.price_euros != null) {
        priceText = `${Number(rowData.price_euros).toFixed(2)} EUR`;
      } else if (rowData.price_type === 'credits' && rowData.price_credits != null) {
        priceText = `${rowData.price_credits} Credits`;
      }
      return (
        <div className="flex flex-col gap-1">
          <Tag value="Store" severity="warning" icon="pi pi-shopping-cart" />
          <span className="text-xs" style={{ color: colors.textMuted }}>{priceText}</span>
        </div>
      );
    }
    return <Tag value="Public" severity="success" icon="pi pi-globe" />;
  };

  const scoreBodyTemplate = (rowData: Template) => {
    const score = rowData.review_score || 0;
    const isApproved = rowData.review_status === 'approved';
    const reviewCount = rowData.reviews?.length || 0;

    return (
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <Tag
            value={`${score} Punkte`}
            severity={isApproved ? 'success' : score >= 3 ? 'success' : score >= 1 ? 'warning' : 'danger'}
            icon="pi pi-star-fill"
          />
        </div>
        {isApproved ? (
          <Badge value={`✓ Freigegeben (${reviewCount} Reviews)`} severity="success" />
        ) : (
          rowData.reviews_needed !== undefined && rowData.reviews_needed > 0 && (
            <Badge value={`${rowData.reviews_needed} noch benötigt`} severity="warning" />
          )
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

  if (!isInnerCore) {
    return (
      <TabContent colors={colors}>
        <div className="h-full flex flex-col items-center justify-center">
          <i className="pi pi-lock text-4xl mb-4" style={{ color: colors.textMuted }}></i>
          <h2 className="text-xl font-semibold mb-2" style={{ color: colors.textPrimary }}>
            Access Restricted
          </h2>
          <p className="text-sm" style={{ color: colors.textMuted }}>
            Template Review is only available for Inner Core members.
          </p>
        </div>
      </TabContent>
    );
  }

  return (
    <TabContent colors={colors}>
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="flex-shrink-0 mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2" style={{ color: colors.textPrimary }}>
              <i className="pi pi-star-fill text-yellow-400"></i>
              Template Review Queue
            </h2>
            <p className="text-sm mt-1" style={{ color: colors.textMuted }}>
              Review public and store templates awaiting approval
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
                field="visibility"
                header="Type"
                body={visibilityBodyTemplate}
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
          className="themed-dialog"
          headerStyle={{ backgroundColor: colors.dialogHeader, color: colors.textPrimary }}
          contentStyle={{ backgroundColor: colors.dialogContent, color: colors.textPrimary }}
        >
          {selectedTemplate && (
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-bold" style={{ color: colors.textPrimary }}>{selectedTemplate.name}</h3>
                <p className="mt-2" style={{ color: colors.textMuted }}>{selectedTemplate.description || 'No description'}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm" style={{ color: colors.textMuted }}>Category:</span>
                  <div className="mt-1">
                    <Tag value={selectedTemplate.category} severity="info" />
                  </div>
                </div>
                <div>
                  <span className="text-sm" style={{ color: colors.textMuted }}>Language:</span>
                  <div className="mt-1" style={{ color: colors.textPrimary }}>{selectedTemplate.language}</div>
                </div>
              </div>

              <div>
                <span className="text-sm" style={{ color: colors.textMuted }}>Tags:</span>
                <div className="mt-1 flex gap-2 flex-wrap">
                  {selectedTemplate.tags && selectedTemplate.tags.length > 0 ? (
                    selectedTemplate.tags.map((tag, idx) => (
                      <Tag key={idx} value={tag} severity="secondary" />
                    ))
                  ) : (
                    <span style={{ color: colors.textMuted }}>No tags</span>
                  )}
                </div>
              </div>

              <div>
                <span className="text-sm" style={{ color: colors.textMuted }}>Creator:</span>
                <div className="mt-1">
                  <div style={{ color: colors.textPrimary }}>{selectedTemplate.creator.name}</div>
                  <div className="text-xs" style={{ color: colors.textMuted }}>{selectedTemplate.creator.email}</div>
                </div>
              </div>

              <div>
                <span className="text-sm" style={{ color: colors.textMuted }}>Type:</span>
                <div className="mt-1">
                  {selectedTemplate.visibility === 'store' ? (
                    <div className="flex items-center gap-2">
                      <Tag value="Store Template" severity="warning" icon="pi pi-shopping-cart" />
                      <span style={{ color: colors.textPrimary }}>
                        {selectedTemplate.price_type === 'euros' && selectedTemplate.price_euros != null
                          ? `${Number(selectedTemplate.price_euros).toFixed(2)} EUR`
                          : selectedTemplate.price_type === 'credits' && selectedTemplate.price_credits != null
                            ? `${selectedTemplate.price_credits} Credits`
                            : 'Preis nicht gesetzt'}
                      </span>
                    </div>
                  ) : (
                    <Tag value="Public Template" severity="success" icon="pi pi-globe" />
                  )}
                </div>
              </div>

              <div>
                <span className="text-sm" style={{ color: colors.textMuted }}>Review Status:</span>
                <div className="mt-1 flex flex-wrap gap-2">
                  <Tag
                    value={`${selectedTemplate.review_score || 0} Punkte`}
                    severity={selectedTemplate.review_status === 'approved' ? 'success' : (selectedTemplate.review_score || 0) >= 3 ? 'success' : 'warning'}
                    icon="pi pi-star-fill"
                  />
                  {selectedTemplate.review_status === 'approved' ? (
                    <Badge
                      value={`✓ Freigegeben (${selectedTemplate.reviews?.length || 0} Reviews)`}
                      severity="success"
                    />
                  ) : (
                    selectedTemplate.reviews_needed !== undefined && selectedTemplate.reviews_needed > 0 && (
                      <Badge
                        value={`${selectedTemplate.reviews_needed} noch benötigt`}
                        severity="warning"
                      />
                    )
                  )}
                </div>
              </div>

              <div>
                <span className="text-sm" style={{ color: colors.textMuted }}>Files:</span>
                <div className="mt-1" style={{ color: colors.textPrimary }}>{selectedTemplate.file_count} files</div>
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
          className="themed-dialog"
          headerStyle={{ backgroundColor: colors.dialogHeader, color: colors.textPrimary }}
          contentStyle={{ backgroundColor: colors.dialogContent, color: colors.textPrimary }}
        >
          {selectedTemplate && (
            <div className="space-y-4">
              {/* Template Info */}
              <div className="p-4 rounded" style={{ backgroundColor: colors.bgSecondary }}>
                <h3 className="text-xl font-bold mb-2" style={{ color: colors.textPrimary }}>{selectedTemplate.name}</h3>
                <p style={{ color: colors.textMuted }}>{selectedTemplate.description || 'No description'}</p>

                <div className="mt-4 flex gap-4 items-center flex-wrap">
                  <Tag value={selectedTemplate.category} severity="info" />
                  <Tag value={selectedTemplate.language} severity="secondary" />
                  <Tag
                    value={`${selectedTemplate.review_score || 0} Punkte`}
                    severity={selectedTemplate.review_status === 'approved' ? 'success' : (selectedTemplate.review_score || 0) >= 3 ? 'success' : 'warning'}
                    icon="pi pi-star-fill"
                  />
                  {selectedTemplate.review_status === 'approved' && (
                    <Badge value={`✓ Freigegeben`} severity="success" />
                  )}
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
                  <h4 className="text-lg font-semibold" style={{ color: colors.textPrimary }}>Template Files ({templateFiles.length})</h4>
                  {templateFiles.map((file) => (
                    <div key={file.id} className="p-4 rounded" style={{ backgroundColor: colors.bgSecondary }}>
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <span className="font-semibold" style={{ color: colors.textPrimary }}>{file.file_name}</span>
                          <span className="text-sm ml-2" style={{ color: colors.textMuted }}>({file.file_type})</span>
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
                      <div className="p-3 rounded overflow-auto max-h-64" style={{ backgroundColor: colors.bgTertiary }}>
                        <pre className="text-sm" style={{ color: colors.textSecondary }}>
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
