import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dialog } from 'primereact/dialog';
import { FileUpload } from 'primereact/fileupload';
import { Tag } from 'primereact/tag';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { ProgressBar } from 'primereact/progressbar';
import { useToast } from '@/contexts/ToastContext';
import { useProject } from '@/contexts/ProjectContext';
import { useTranslation, SupportedLanguage, getStoredLanguage } from '@/i18n';
import { useTheme } from '@/contexts/ThemeContext';

// Helper function to get auth token
const getAuthToken = (): string | null => {
    return localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
};

interface TabPanelProps {
    isActive: boolean;
    onOpenPanel?: (panelId: string, data?: any) => void;
    projectId?: number;
}

interface Attachment {
    id: number;
    project_id: number;
    uploaded_by: number;
    filename: string;
    original_filename: string;
    mime_type: string;
    size: number;
    path: string;
    description: string | null;
    category: string;
    category_label: string;
    is_pinned: boolean;
    download_count: number;
    url: string;
    formatted_size: string;
    created_at: string;
    updated_at: string;
    uploader: {
        id: number;
        name: string;
        username: string | null;
    };
}

interface Categories {
    [key: string]: string;
}

// Category color mapping
const getCategoryColor = (category: string): "success" | "info" | "warning" | "danger" | "secondary" | undefined => {
    const colors: { [key: string]: "success" | "info" | "warning" | "danger" | "secondary" } = {
        'system_analysis': 'info',
        'specification': 'success',
        'design': 'warning',
        'offer': 'danger',
        'correspondence': 'secondary',
        'other': 'secondary',
    };
    return colors[category] || 'secondary';
};

// File icon mapping based on mime type
const getFileIcon = (mimeType: string): string => {
    if (mimeType.startsWith('image/')) return 'pi pi-image';
    if (mimeType === 'application/pdf') return 'pi pi-file-pdf';
    if (mimeType.includes('word') || mimeType.includes('document')) return 'pi pi-file-word';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'pi pi-file-excel';
    if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return 'pi pi-file';
    if (mimeType.startsWith('text/')) return 'pi pi-file-edit';
    if (mimeType.includes('zip') || mimeType.includes('archive') || mimeType.includes('compressed')) return 'pi pi-file-import';
    return 'pi pi-file';
};

export default function ProjectAttachmentsPanel({ isActive, projectId }: TabPanelProps) {
    // Theme
    const { colors } = useTheme();

    // i18n setup
    const [currentLanguage] = React.useState<SupportedLanguage>(getStoredLanguage());
    const { t: t } = useTranslation(currentLanguage);
    const toast = useToast();

    // Project context
    const { selectedProject } = useProject();
    const effectiveProjectId = projectId || selectedProject?.id;

    // State
    const [attachments, setAttachments] = useState<Attachment[]>([]);
    const [categories, setCategories] = useState<Categories>({});
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [editDialogVisible, setEditDialogVisible] = useState(false);
    const [editingAttachment, setEditingAttachment] = useState<Attachment | null>(null);
    const [editForm, setEditForm] = useState({ description: '', category: 'other' });

    // File upload ref
    const fileUploadRef = useRef<FileUpload>(null);

    // Current user ID for permission checks
    const [currentUserId, setCurrentUserId] = useState<number | null>(null);
    const isOwner = Number(selectedProject?.owner_id) === Number(currentUserId);

    // Load current user
    useEffect(() => {
        const fetchUser = async () => {
            try {
                const response = await fetch('/api/user', {
                    headers: { 'Authorization': `Bearer ${getAuthToken()}` }
                });
                if (response.ok) {
                    const user = await response.json();
                    setCurrentUserId(user.id);
                }
            } catch {
                // Ignore errors
            }
        };
        fetchUser();
    }, []);

    // Load attachments
    const loadAttachments = useCallback(async () => {
        if (!effectiveProjectId) return;

        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (selectedCategory !== 'all') params.append('category', selectedCategory);
            if (searchTerm) params.append('search', searchTerm);

            const response = await fetch(
                `/api/projects/${effectiveProjectId}/attachments?${params.toString()}`,
                { headers: { 'Authorization': `Bearer ${getAuthToken()}` } }
            );

            if (!response.ok) throw new Error(t.projectattachmentspanel147_2);

            const data = await response.json();
            setAttachments(data.attachments);
            setCategories(data.categories);
        } catch (error: any) {
            toast.showError(error.message || t.projectattachmentspanel153);
        } finally {
            setLoading(false);
        }
    }, [effectiveProjectId, selectedCategory, searchTerm, toast]);

    // Load on mount and when filters change
    useEffect(() => {
        if (isActive && effectiveProjectId) {
            loadAttachments();
        }
    }, [isActive, effectiveProjectId, loadAttachments]);

    // Handle file upload
    const handleUpload = async (event: { files: File[] }) => {
        if (!effectiveProjectId || event.files.length === 0) return;

        setUploading(true);
        const file = event.files[0];

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('category', 'other');

            const response = await fetch(`/api/projects/${effectiveProjectId}/attachments`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${getAuthToken()}` },
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || t.projectattachmentspanel186);
            }

            const data = await response.json();
            toast.showSuccess(`"${data.attachment.original_filename}"{$t.projectattachmentspanel190}`);
            loadAttachments();
        } catch (error: any) {
            toast.showError(error.message || t.projectattachmentspanel193);
        } finally {
            setUploading(false);
            fileUploadRef.current?.clear();
        }
    };

    // Handle download
    const handleDownload = async (attachment: Attachment) => {
        try {
            const token = getAuthToken();
            const response = await fetch(`/api/projects/${effectiveProjectId}/attachments/${attachment.id}/download`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error(`Download failed: ${response.status}`);
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = attachment.original_filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error: any) {
            toast.showError(error.message || t.projectattachmentspanel193);
        }
    };

    // Handle pin/unpin
    const handleTogglePin = async (attachment: Attachment) => {
        try {
            const response = await fetch(
                `/api/projects/${effectiveProjectId}/attachments/${attachment.id}`,
                {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${getAuthToken()}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ is_pinned: !attachment.is_pinned }),
                }
            );

            if (!response.ok) throw new Error(t.projectattachmentspanel220);

            toast.showSuccess(attachment.is_pinned ? t.projectattachmentspanel222 : t.projectattachmentspanel222_2);
            loadAttachments();
        } catch (error: any) {
            toast.showError(error.message);
        }
    };

    // Handle edit
    const openEditDialog = (attachment: Attachment) => {
        setEditingAttachment(attachment);
        setEditForm({
            description: attachment.description || '',
            category: attachment.category,
        });
        setEditDialogVisible(true);
    };

    const saveEdit = async () => {
        if (!editingAttachment) return;

        try {
            const response = await fetch(
                `/api/projects/${effectiveProjectId}/attachments/${editingAttachment.id}`,
                {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${getAuthToken()}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(editForm),
                }
            );

            if (!response.ok) throw new Error(t.projectattachmentspanel255);

            toast.showSuccess(t.projectattachmentspanel257);
            setEditDialogVisible(false);
            loadAttachments();
        } catch (error: any) {
            toast.showError(error.message);
        }
    };

    // Handle delete
    const handleDelete = (attachment: Attachment) => {
        confirmDialog({
            message: `${t.projectattachmentspanel268}"${attachment.original_filename}"${t.projectattachmentspanel268_2}`,
            header: 'Anhang löschen',
            icon: 'pi pi-exclamation-triangle',
            acceptClassName: 'p-button-danger',
            accept: async () => {
                try {
                    const response = await fetch(
                        `/api/projects/${effectiveProjectId}/attachments/${attachment.id}`,
                        {
                            method: 'DELETE',
                            headers: { 'Authorization': `Bearer ${getAuthToken()}` },
                        }
                    );

                    if (!response.ok) throw new Error(t.projectattachmentspanel282);

                    toast.showSuccess(t.projectattachmentspanel284);
                    loadAttachments();
                } catch (error: any) {
                    toast.showError(error.message);
                }
            },
        });
    };

    // Check if user can edit/delete this attachment
    const canModify = (attachment: Attachment): boolean => {
        return isOwner || attachment.uploaded_by === currentUserId;
    };

    // Category filter options
    const categoryOptions = [
        { label: t.projectattachmentspanel300, value: 'all' },
        ...Object.entries(categories).map(([value, label]) => ({ label, value })),
    ];

    // DataTable column templates
    const filenameTemplate = (rowData: Attachment) => (
        <div className="flex items-center gap-2">
            <i className={`${getFileIcon(rowData.mime_type)} text-xl`} style={{ color: colors.accent }}></i>
            <div className="flex flex-col">
                <span className="font-medium" style={{ color: colors.textPrimary }}>{rowData.original_filename}</span>
                <span className="text-xs" style={{ color: colors.textMuted }}>{rowData.formatted_size}</span>
            </div>
            {rowData.is_pinned && (
                <i className="pi pi-bookmark-fill text-yellow-400 ml-2" title="Angeheftet"></i>
            )}
        </div>
    );

    const categoryTemplate = (rowData: Attachment) => (
        <Tag value={rowData.category_label} severity={getCategoryColor(rowData.category)} />
    );

    const uploaderTemplate = (rowData: Attachment) => (
        <span style={{ color: colors.textSecondary }}>{rowData.uploader?.name || t.projectattachmentspanel323}</span>
    );

    const dateTemplate = (rowData: Attachment) => (
        <span className="text-sm" style={{ color: colors.textMuted }}>
            {new Date(rowData.created_at).toLocaleDateString('de-DE', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
            })}
        </span>
    );

    const actionsTemplate = (rowData: Attachment) => (
        <div className="flex gap-1">
            <Button
                icon="pi pi-download"
                rounded
                text
                severity="info"
                onClick={() => handleDownload(rowData)}
                tooltip={t.projectattachmentspanel344}
                tooltipOptions={{ position: 'top' }}
            />
            {canModify(rowData) && (
                <>
                    <Button
                        icon={rowData.is_pinned ? 'pi pi-bookmark-fill' : 'pi pi-bookmark'}
                        rounded
                        text
                        severity={rowData.is_pinned ? 'warning' : 'secondary'}
                        onClick={() => handleTogglePin(rowData)}
                        tooltip={rowData.is_pinned ? t.projectattachmentspanel355 : t.projectattachmentspanel355_2}
                        tooltipOptions={{ position: 'top' }}
                    />
                    <Button
                        icon="pi pi-pencil"
                        rounded
                        text
                        severity="secondary"
                        onClick={() => openEditDialog(rowData)}
                        tooltip={t.projectattachmentspanel364}
                        tooltipOptions={{ position: 'top' }}
                    />
                    <Button
                        icon="pi pi-trash"
                        rounded
                        text
                        severity="danger"
                        onClick={() => handleDelete(rowData)}
                        tooltip={t.projectattachmentspanel373}
                        tooltipOptions={{ position: 'top' }}
                    />
                </>
            )}
        </div>
    );

    // No project selected
    if (!effectiveProjectId) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-8" style={{ color: colors.textMuted, backgroundColor: colors.bgPrimary }}>
                <i className="pi pi-folder-open text-6xl mb-4"></i>
                <p className="text-lg">{t.projectattachmentspanel386}</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full p-4" style={{ backgroundColor: colors.bgPrimary }}>
            <ConfirmDialog />

            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <i className="pi pi-paperclip text-2xl" style={{ color: colors.accent }}></i>
                    <h2 className="text-xl font-semibold" style={{ color: colors.textPrimary }}>
                        {t.projectattachmentspanel400}
                        {selectedProject && (
                            <span className="font-normal ml-2" style={{ color: colors.textMuted }}>
                                - {selectedProject.name}
                            </span>
                        )}
                    </h2>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-sm" style={{ color: colors.textMuted }}>
                        {attachments.length} {attachments.length === 1 ? 'Anhang' : 'Anhänge'}
                    </span>
                </div>
            </div>

            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-3 mb-4 p-3 rounded-lg" style={{ backgroundColor: colors.bgSecondary, border: `1px solid ${colors.borderPrimary}` }}>
                {/* Upload */}
                <FileUpload
                    ref={fileUploadRef}
                    mode="basic"
                    name="file"
                    accept="*"
                    maxFileSize={25 * 1024 * 1024}
                    chooseLabel={t.projectattachmentspanel424}
                    customUpload
                    auto
                    uploadHandler={handleUpload}
                    disabled={uploading}
                    className="p-button-success"
                />

                {uploading && (
                    <div className="flex items-center gap-2" style={{ color: colors.accent }}>
                        <i className="pi pi-spin pi-spinner"></i>
                        <span>{t.projectattachmentspanel435}</span>
                    </div>
                )}

                <div className="flex-1"></div>

                {/* Search */}
                <span className="p-input-icon-left">
                    <i className="pi pi-search" />
                    <InputText
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder={t.projectattachmentspanel447}
                        className="w-48"
                    />
                </span>

                {/* Category Filter */}
                <Dropdown
                    value={selectedCategory}
                    options={categoryOptions}
                    onChange={(e) => setSelectedCategory(e.value)}
                    placeholder={t.projectattachmentspanel457}
                    className="w-48"
                />

                {/* Refresh */}
                <Button
                    icon="pi pi-refresh"
                    rounded
                    text
                    severity="secondary"
                    onClick={loadAttachments}
                    tooltip={t.projectattachmentspanel468}
                    tooltipOptions={{ position: 'top' }}
                />
            </div>

            {/* Loading indicator */}
            {loading && <ProgressBar mode="indeterminate" style={{ height: '3px' }} />}

            {/* Attachments Table */}
            <div className="flex-1 overflow-hidden">
                <DataTable
                    value={attachments}
                    loading={loading}
                    scrollable
                    scrollHeight="flex"
                    emptyMessage={t.projectattachmentspanel483}
                    className="p-datatable-sm"
                    rowClassName={(data) => data.is_pinned ? 'bg-yellow-900/20' : ''}
                >
                    <Column
                        field="original_filename"
                        header={t.projectattachmentspanel489}
                        body={filenameTemplate}
                        sortable
                        style={{ minWidth: '250px' }}
                    />
                    <Column
                        field="category"
                        header={t.projectattachmentspanel496}
                        body={categoryTemplate}
                        sortable
                        style={{ width: '150px' }}
                    />
                    <Column
                        field="description"
                        header={t.projectattachmentspanel503}
                        style={{ minWidth: '200px' }}
                        body={(rowData) => (
                            <span className="text-sm" style={{ color: colors.textSecondary }}>
                                {rowData.description || '-'}
                            </span>
                        )}
                    />
                    <Column
                        field="uploader.name"
                        header={t.projectattachmentspanel513}
                        body={uploaderTemplate}
                        style={{ width: '150px' }}
                    />
                    <Column
                        field="created_at"
                        header={t.projectattachmentspanel519}
                        body={dateTemplate}
                        sortable
                        style={{ width: '100px' }}
                    />
                    <Column
                        field="download_count"
                        header={t.projectattachmentspanel526}
                        sortable
                        style={{ width: '100px' }}
                        body={(rowData) => (
                            <span style={{ color: colors.textMuted }}>{rowData.download_count}</span>
                        )}
                    />
                    <Column
                        header={t.projectattachmentspanel534}
                        body={actionsTemplate}
                        style={{ width: '180px' }}
                        frozen
                        alignFrozen="right"
                    />
                </DataTable>
            </div>

            {/* Edit Dialog */}
            <Dialog
                header="Anhang bearbeiten"
                visible={editDialogVisible}
                onHide={() => setEditDialogVisible(false)}
                style={{ width: '500px' }}
                modal
                headerStyle={{ backgroundColor: colors.bgSecondary, color: colors.textPrimary, borderBottom: `1px solid ${colors.borderPrimary}` }}
                contentStyle={{ backgroundColor: colors.bgSecondary, color: colors.textPrimary }}
            >
                {editingAttachment && (
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-3 p-3 rounded-lg" style={{ backgroundColor: colors.bgTertiary, border: `1px solid ${colors.borderPrimary}` }}>
                            <i className={`${getFileIcon(editingAttachment.mime_type)} text-2xl`} style={{ color: colors.accent }}></i>
                            <div>
                                <div className="font-medium" style={{ color: colors.textPrimary }}>{editingAttachment.original_filename}</div>
                                <div className="text-sm" style={{ color: colors.textMuted }}>{editingAttachment.formatted_size}</div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>Kategorie</label>
                            <Dropdown
                                value={editForm.category}
                                options={Object.entries(categories).map(([value, label]) => ({ label, value }))}
                                onChange={(e) => setEditForm({ ...editForm, category: e.value })}
                                className="w-full"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>Beschreibung</label>
                            <InputTextarea
                                value={editForm.description}
                                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                rows={4}
                                className="w-full"
                                placeholder={t.projectattachmentspanel580}
                            />
                        </div>

                        <div className="flex justify-end gap-2 mt-4">
                            <Button
                                label={t.projectattachmentspanel586}
                                severity="secondary"
                                onClick={() => setEditDialogVisible(false)}
                            />
                            <Button
                                label={t.projectattachmentspanel591}
                                severity="success"
                                onClick={saveEdit}
                            />
                        </div>
                    </div>
                )}
            </Dialog>
        </div>
    );
}
