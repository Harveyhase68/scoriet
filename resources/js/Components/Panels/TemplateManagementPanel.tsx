import React, { useState, useEffect, useRef } from 'react';
import { Dialog } from 'primereact/dialog';
import { DataTable } from 'primereact/datatable';
import { confirmDialog } from 'primereact/confirmdialog';
import { ConfirmDialog } from 'primereact/confirmdialog';
import { useToast } from '@/contexts/ToastContext';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Card } from 'primereact/card';
import { TabView, TabPanel } from 'primereact/tabview';
import { apiClient as api } from '@/lib/api';
import { useProject } from '@/contexts/ProjectContext';
import FileModal from './FileModal';
import TemplateModal from './TemplateModal';
import VariableModal from './VariableModal';
import TemplateImportWizardPanel from './TemplateImportWizardPanel';
import { useTranslation, SupportedLanguage, getStoredLanguage } from '@/i18n';

interface TemplateSubscription {
    id: number;
    expires_at: string | null;
    is_expired: boolean;
    is_soft_locked: boolean;
    days_remaining: number | null;
}

interface Template {
    id: number;
    name: string;
    description?: string;
    category: string;
    language: string;
    is_active: boolean;
    tags: string[];
    file_count: number;
    created_at: string;
    creator_user_id: number;
    visibility: 'public' | 'private' | 'store';
    is_system_template: boolean;
    files?: TemplateFile[];
    review_status: 'draft' | 'pending_review' | 'approved' | 'rejected';
    review_score: number;
    linked_project_ids?: number[];
    linked_projects?: Array<{ id: number; name: string; is_active: boolean }>;
    // Subscription / Lock status for private templates
    is_soft_locked?: boolean;
    subscription_data?: TemplateSubscription | null;
    // Store fields
    price_type?: 'credits' | 'euros' | null;
    price_credits?: number | null;
    price_euros?: number | null;
    is_store_approved?: boolean;
    sales_count?: number;
    total_revenue?: number;
}

interface TemplateFile {
    id: number;
    file_name: string;
    file_path: string;
    output_path: string;
    file_content: string;
    file_type: string;
    file_order: number;
    form_window_type?: number;
    content_type?: string;
    zip_filename?: string;
}

interface TemplateVariable {
    id?: number;
    variable_name: string;
    description: string | null;
    default_value: string | null;
    is_required: boolean;
}

interface TemplateManagementPanelProps {
    filterByProject?: boolean; // Explicit flag to control project filtering
    forceProjectId?: number; // Force a specific project ID (overrides selectedProject)
    forceProjectName?: string; // Force a specific project name for the title
    updateTabTitle?: (newTitle: string) => void; // Callback to update tab title
}

const TemplateManagementPanel: React.FC<TemplateManagementPanelProps> = ({ filterByProject = false, forceProjectId, forceProjectName, updateTabTitle }) => {
    // i18n setup
    const [currentLanguage] = React.useState<SupportedLanguage>(getStoredLanguage());
    const { t } = useTranslation(currentLanguage);

    // Use Project Context to get current project
    const { selectedProject } = useProject();
    const toast = useToast();
    // Only use project filtering if explicitly requested (Quick Actions)
    // If forceProjectId is provided, use that instead of selectedProject
    const projectId = filterByProject ? (forceProjectId || selectedProject?.id) : undefined;
    // Using centralized CSS styles from auth-modals.css

    // Get current user ID and type for permission checks
    const currentUserId = parseInt(localStorage.getItem('user_id') || '0');
    const userType = localStorage.getItem('user_type') || 'free';
    const isInnerCore = localStorage.getItem('is_inner_core') === '1';

    // State variables
    const [myTemplates, setMyTemplates] = useState<Template[]>([]);
    const [communityTemplates, setCommunityTemplates] = useState<Template[]>([]);
    const [purchasedTemplates, setPurchasedTemplates] = useState<Template[]>([]);
    const [myTemplatesLoading, setMyTemplatesLoading] = useState(false);
    const [communityLoading, setCommunityLoading] = useState(false);
    const [purchasedLoading, setPurchasedLoading] = useState(false);

    // Filters for My Templates
    const [myTypeFilter, setMyTypeFilter] = useState('all'); // 'all', 'private', 'public', 'system'
    const [myLanguageFilter, setMyLanguageFilter] = useState('all');
    const [myCategoryFilter, setMyCategoryFilter] = useState(t.templatecontroller22);
    const [mySearchTerm, setMySearchTerm] = useState('');

    // Filters for Community Templates
    const [communitySearchTerm, setCommunitySearchTerm] = useState('');
    const [communityTypeFilter, setCommunityTypeFilter] = useState('all'); // 'all', 'system', 'public', 'store'
    const [communityLanguageFilter, setCommunityLanguageFilter] = useState('all');
    const [communityCategoryFilter, setCommunityCategoryFilter] = useState(t.templatecontroller22);
    const [modalVisible, setModalVisible] = useState(false);
    const [viewModalVisible, setViewModalVisible] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
    const [viewingTemplate, setViewingTemplate] = useState<Template | null>(null);
    const [templateFiles, setTemplateFiles] = useState<TemplateFile[]>([]);
    const [fileModalVisible, setFileModalVisible] = useState(false);
    const [editingFile, setEditingFile] = useState<TemplateFile | null>(null);
    const [cloneModalVisible, setCloneModalVisible] = useState(false);
    const [templateToClone, setTemplateToClone] = useState<Template | null>(null);
    const [cloneName, setCloneName] = useState('');
    const [cloneVisibility, setCloneVisibility] = useState<'public' | 'private'>('public');
    const [nameCheckLoading, setNameCheckLoading] = useState(false);
    const [nameExists, setNameExists] = useState(false);
    const [templateVariables, setTemplateVariables] = useState<TemplateVariable[]>([]);
    const [variableModalVisible, setVariableModalVisible] = useState(false);
    const [editingVariable, setEditingVariable] = useState<TemplateVariable | null>(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [templateToDelete, setTemplateToDelete] = useState<Template | null>(null);
    const [deleteConfirmText, setDeleteConfirmText] = useState('');
    const [deleting, setDeleting] = useState(false);
    const [linkModalVisible, setLinkModalVisible] = useState(false);
    const [templateToLink, setTemplateToLink] = useState<Template | null>(null);
    const [allProjects, setAllProjects] = useState<any[]>([]);
    const [linkedProjectIds, setLinkedProjectIds] = useState<number[]>([]);
    const [loadingProjects, setLoadingProjects] = useState(false);
    const [toggleActiveModalVisible, setToggleActiveModalVisible] = useState(false);
    const [templateToToggle, setTemplateToToggle] = useState<Template | null>(null);
    const [projectActivationStates, setProjectActivationStates] = useState<{[key: number]: boolean}>({});

    // Store Settings Modal
    const [storeSettingsModalVisible, setStoreSettingsModalVisible] = useState(false);
    const [templateForStoreSettings, setTemplateForStoreSettings] = useState<Template | null>(null);
    const [storePriceType, setStorePriceType] = useState<'credits' | 'euros'>('credits');
    const [storePriceCredits, setStorePriceCredits] = useState<number>(50);
    const [storePriceEuros, setStorePriceEuros] = useState<number>(1.00);
    const [savingStoreSettings, setSavingStoreSettings] = useState(false);
    const [storeSettingsTab, setStoreSettingsTab] = useState(0);

    // Template Unlock State
    const [unlockingTemplate, setUnlockingTemplate] = useState(false);
    const [templateToUnlock, setTemplateToUnlock] = useState<Template | null>(null);

    // Media State
    const [templateMedia, setTemplateMedia] = useState<{
        logo: any | null;
        images: any[];
        videos: any[];
    }>({ logo: null, images: [], videos: [] });
    const [uploadingLogo, setUploadingLogo] = useState(false);
    const [uploadingImages, setUploadingImages] = useState(false);
    const [addingVideo, setAddingVideo] = useState(false);
    const [newVideoUrl, setNewVideoUrl] = useState('');
    const [newVideoTitle, setNewVideoTitle] = useState('');
    const logoInputRef = useRef<HTMLInputElement>(null);
    const imagesInputRef = useRef<HTMLInputElement>(null);

    // Import Wizard State
    const [importWizardVisible, setImportWizardVisible] = useState(false);

    // Track if we should use forceProjectName (don't change title on selectedProject changes)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const useForceProjectName = useRef(!!forceProjectName);

    // Forms are now handled by separate modal components

    // No need to inject styles - using centralized CSS
    // Ant Design React 19 warnings are handled by @ant-design/v5-patch-for-react-19

    const categories = [t.templatecontroller22, t.panelt3296, t.panelt3297, t.panelt3298, t.panelt3299, t.panelsewnavigationpanel223];
    const fileTypes = [
        { label: t.templatemanagementpanel115, value: 'static_file', description: 'Single static file (e.g. config.json)' },
        { label: 'Static Directory (Archive)', value: 'static_directory', description: t.templatemanagementpanel116 },
        { label: 'Project File', value: 'project_file', description: t.templatemanagementpanel117 },
        { label: t.templatemanagementpanel118, value: 'db_table_file', description: 'File per database table (model, controller, etc.)' },
        { label: 'Project File (Languages)', value: 'project_file_languages', description: t.templatemanagementpanel119 },
        { label: 'DB Table File (Languages)', value: 'db_table_file_languages', description: t.templatemanagementpanel120 }
    ];

    useEffect(() => {
        loadMyTemplates();
        loadCommunityTemplates();
        loadPurchasedTemplates();
    }, [projectId]);

    // Reload my templates when filters change
    useEffect(() => {
        loadMyTemplates();
    }, [myTypeFilter, myLanguageFilter, myCategoryFilter, mySearchTerm]);

    // Reload community templates when filters change
    useEffect(() => {
        loadCommunityTemplates();
    }, [communitySearchTerm, communityTypeFilter, communityLanguageFilter, communityCategoryFilter]);

    // Update tab title with forceProjectName (when set from Quick Actions or tree view - fixed title with project name)
    useEffect(() => {
        if (filterByProject && updateTabTitle && forceProjectName) {
            updateTabTitle(`Template Management: ${forceProjectName}`);
        }
    }, [filterByProject, updateTabTitle, forceProjectName]);

    // No dynamic title updates for menu call - title stays as t.panelsewnavigationpanel188 (all templates)

    // Load user's own templates (original, cloned, linked, public)
    const loadMyTemplates = async () => {
        setMyTemplatesLoading(true);
        try {
            const allTemplates = await api.getAllTemplates({
                active_only: false,
                project_id: projectId
            });

            // Special handling for system users:
            // - System/Admin users: Show ALL their templates including system templates
            // - Normal users (free/patron): Show templates they created OR templates linked to their projects
            const isSystemUser = userType === 'system' || userType === 'admin';

            // Filter: User's own templates (creator) OR templates linked to user's projects
            let filtered = allTemplates.filter((t: Template) => {
                const isMyTemplate = parseInt(String(t.creator_user_id)) === currentUserId;
                const isLinkedToMyProjects = (t.linked_project_ids?.length || 0) > 0;

                // Show if user created it OR if it's linked to user's projects
                if (isMyTemplate || isLinkedToMyProjects) {
                    // System users can see all, including system templates
                    if (isSystemUser) {
                        return true;
                    }
                    // Normal users: Don't show system templates they didn't create (unless linked)
                    if (t.is_system_template && !isMyTemplate && isLinkedToMyProjects) {
                        return true; // Show linked system templates
                    }
                    if (t.is_system_template && !isMyTemplate) {
                        return false; // Don't show non-linked system templates
                    }
                    return true;
                }

                return false;
            });

            // Apply type filter (private/public/store/system)
            if (myTypeFilter !== 'all') {
                if (myTypeFilter === 'system') {
                    filtered = filtered.filter((t: Template) => t.is_system_template);
                } else if (myTypeFilter === 'private') {
                    filtered = filtered.filter((t: Template) => !t.is_system_template && t.visibility === 'private');
                } else if (myTypeFilter === 'public') {
                    filtered = filtered.filter((t: Template) => !t.is_system_template && t.visibility === 'public');
                } else if (myTypeFilter === 'store') {
                    filtered = filtered.filter((t: Template) => !t.is_system_template && t.visibility === 'store');
                }
            }

            // Apply language filter
            if (myLanguageFilter !== 'all') {
                filtered = filtered.filter((t: Template) => t.language === myLanguageFilter);
            }

            // Apply category filter
            if (myCategoryFilter !== t.templatecontroller22) {
                filtered = filtered.filter((t: Template) => t.category === myCategoryFilter);
            }

            // Apply search
            if (mySearchTerm) {
                const search = mySearchTerm.toLowerCase();
                filtered = filtered.filter((t: Template) =>
                    t.name?.toLowerCase().includes(search) ||
                    t.description?.toLowerCase().includes(search)
                );
            }

            setMyTemplates(filtered);
        } catch (error) {
            console.error('Error loading my templates:', error);
            setMyTemplates([]);
        } finally {
            setMyTemplatesLoading(false);
        }
    };

    // Load community templates (system + public from others)
    const loadCommunityTemplates = async () => {
        setCommunityLoading(true);
        try {
            const allTemplates = await api.getAllTemplates({
                active_only: false,
                project_id: projectId
            });

            // Check if current user is a reviewer (system/admin/inner_core)
            const isReviewer = userType === 'system' || userType === 'admin' || userType === 'review' || isInnerCore;

            // Filter: System templates OR public templates OR store templates (from anyone, including user)
            let filtered = allTemplates.filter((t: Template) => {
                // System templates are ALWAYS shown (no review required)
                if (t.is_system_template) {
                    return true;
                }

                // Public templates: Only show if approved OR user is reviewer
                if (t.visibility === 'public') {
                    return t.review_status === 'approved' || isReviewer;
                }

                // Store templates: Only show if approved OR user is reviewer
                if (t.visibility === 'store') {
                    return t.is_store_approved || isReviewer;
                }

                return false;
            });

            // Apply type filter
            if (communityTypeFilter === 'system') {
                filtered = filtered.filter((t: Template) => t.is_system_template);
            } else if (communityTypeFilter === 'public') {
                filtered = filtered.filter((t: Template) => !t.is_system_template && t.visibility === 'public');
            } else if (communityTypeFilter === 'store') {
                filtered = filtered.filter((t: Template) => t.visibility === 'store');
            }

            // Apply language filter
            if (communityLanguageFilter !== 'all') {
                filtered = filtered.filter((t: Template) => t.language === communityLanguageFilter);
            }

            // Apply category filter
            if (communityCategoryFilter !== t.templatecontroller22) {
                filtered = filtered.filter((t: Template) => t.category === communityCategoryFilter);
            }

            // Apply search
            if (communitySearchTerm) {
                const search = communitySearchTerm.toLowerCase();
                filtered = filtered.filter((t: Template) =>
                    t.name?.toLowerCase().includes(search) ||
                    t.description?.toLowerCase().includes(search)
                );
            }

            setCommunityTemplates(filtered);
        } catch (error) {
            console.error('Error loading community templates:', error);
            setCommunityTemplates([]);
        } finally {
            setCommunityLoading(false);
        }
    };

    // Load purchased templates from store
    const loadPurchasedTemplates = async () => {
        setPurchasedLoading(true);
        try {
            const response = await api.request('/store/my-purchases?per_page=100');

            // Extract templates from purchases and format them
            const templates: Template[] = (response.data || [])
                .filter((purchase: any) => purchase.template)
                .map((purchase: any) => ({
                    ...purchase.template,
                    is_purchased: true,
                    purchase_date: purchase.created_at,
                    seller_username: purchase.seller?.username || purchase.template?.creator?.username,
                }));

            setPurchasedTemplates(templates);
        } catch (error) {
            console.error('Error loading purchased templates:', error);
            setPurchasedTemplates([]);
        } finally {
            setPurchasedLoading(false);
        }
    };

    const handleCreate = () => {
        setEditingTemplate(null);
        setTemplateFiles([]);
        setModalVisible(true);
    };

    const handleEdit = async (template: Template) => {
        setEditingTemplate(template);
        
        // Load template files if editing
        if (template.id) {
            try {
                const response = await api.getTemplate(template.id);
                if (response.success) {
                    // Ensure output_path is properly set for each file
                    const files = response.template.files || [];
                    const filesWithOutputPath = files.map((file: TemplateFile) => ({
                        ...file,
                        output_path: file.output_path || '/'
                    }));
                    setTemplateFiles(filesWithOutputPath);
                } else {
                    setTemplateFiles([]);
                }
            } catch {
                // Error loading template files
                setTemplateFiles([]);
            }
        } else {
            // New template - start with empty files
            setTemplateFiles([]);
        }
        
        setModalVisible(true);
    };

    const handleView = async (template: Template) => {
        try {
            const response = await api.getTemplate(template.id);
            if (response.success) {
                setViewingTemplate(response.template);
                setViewModalVisible(true);
            }
        } catch {
            // Error loading template details
            toast.showError(t.templatemanagementpanel202);
        }
    };


    const confirmDelete = (template: Template) => {
        setTemplateToDelete(template);
        setDeleteConfirmText('');
        setShowDeleteModal(true);
    };

    const handleDeleteModalHide = () => {
        setShowDeleteModal(false);
        setTemplateToDelete(null);
        setDeleteConfirmText('');
    };

    const handleDeleteTemplate = async () => {
        if (!templateToDelete) return;

        // Validate confirmation text
        if (deleteConfirmText !== 'DELETE') {
            toast.showError('You must type DELETE to confirm deletion');
            return;
        }

        setDeleting(true);

        try {
            const response = await api.hardDeleteTemplate(templateToDelete.id);
            if (response.success) {
                toast.showSuccess('Template endgültig gelöscht');
                await loadMyTemplates();
                await loadCommunityTemplates();
                setShowDeleteModal(false);
                setTemplateToDelete(null);
                setDeleteConfirmText('');
            }
        } catch {
            // Error hard deleting template
            toast.showError(t.templatemanagementpanel216);
        } finally {
            setDeleting(false);
        }
    };

    const handleToggleActive = async (template: Template) => {
        // Open modal to manage project-specific activation
        setTemplateToToggle(template);

        // Initialize activation states from linked_projects
        const initialStates: {[key: number]: boolean} = {};
        template.linked_projects?.forEach(project => {
            initialStates[project.id] = project.is_active;
        });
        setProjectActivationStates(initialStates);

        setToggleActiveModalVisible(true);
    };

    const handleToggleProjectActivation = (projectId: number) => {
        setProjectActivationStates(prev => ({
            ...prev,
            [projectId]: !prev[projectId]
        }));
    };

    const handleApplyActivationChanges = async () => {
        if (!templateToToggle) return;

        try {
            // Update is_active for each linked project
            for (const [projectIdStr, isActive] of Object.entries(projectActivationStates)) {
                const projectId = parseInt(projectIdStr);
                await fetch(`/api/templates/${templateToToggle.id}/projects/${projectId}/toggle-active`, {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify({ is_active: isActive })
                });
            }

            toast.showSuccess('Verknüpfungen erfolgreich aktualisiert');
            setToggleActiveModalVisible(false);
            loadMyTemplates();
            loadCommunityTemplates();
        } catch (error: any) {
            console.error('Error updating activations:', error);
            toast.showError('Fehler beim Aktualisieren der Verknüpfungen');
        }
    };

    // Unlock an expired template subscription (renew for 50 credits or make public)
    const handleUnlockExpiredTemplate = async (template: Template, makePublic: boolean = false) => {
        if (!template.subscription_data?.id && !makePublic) {
            toast.showError('Keine Subscription gefunden für dieses Template');
            return;
        }

        setUnlockingTemplate(true);
        setTemplateToUnlock(template);

        try {
            const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
            if (!token) {
                throw new Error('Nicht authentifiziert');
            }

            if (makePublic) {
                // Change visibility to public (free unlock) - use dedicated endpoint
                const response = await fetch(`/api/templates/${template.id}/visibility`, {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ visibility: 'public' }),
                });

                if (!response.ok) {
                    const data = await response.json();
                    throw new Error(data.error || data.message || 'Fehler beim Ändern der Sichtbarkeit');
                }

                toast.showSuccess(`Template "${template.name}" ist jetzt öffentlich!`);
            } else {
                // Renew subscription for 50 credits
                const response = await fetch(`/api/subscriptions/${template.subscription_data!.id}/renew`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                    },
                });

                const data = await response.json();

                if (!response.ok) {
                    if (data.required_credits) {
                        toast.showError(`Nicht genug Credits! Benötigt: ${data.required_credits}, Vorhanden: ${data.current_credits}`);
                    } else {
                        throw new Error(data.error || data.message || 'Fehler beim Entsperren des Templates');
                    }
                    return;
                }

                toast.showSuccess(`Template "${template.name}" wurde entsperrt! (${data.bonus_days || 0} Bonus-Tage erhalten)`);
            }

            // Dispatch credits changed event
            window.dispatchEvent(new CustomEvent('creditsChanged'));

            // Reload templates
            loadMyTemplates();
        } catch (error) {
            toast.showError(error instanceof Error ? error.message : 'Fehler beim Entsperren');
        } finally {
            setUnlockingTemplate(false);
            setTemplateToUnlock(null);
        }
    };

    const handleClone = (template: Template) => {
        setTemplateToClone(template);
        setCloneName(template.name);
        // Purchased templates must be cloned as private
        const isPurchased = (template as any).is_purchased || template.visibility === 'store';
        setCloneVisibility(isPurchased ? 'private' : 'public');
        setNameExists(false);
        setCloneModalVisible(true);

        // Sofort beim Öffnen prüfen ob der Name schon existiert
        setTimeout(() => {
            checkNameExists(template.name);
        }, 100);
    };

    const checkNameExists = async (name: string) => {
        if (!name.trim()) {
            setNameExists(false);
            return;
        }

        setNameCheckLoading(true);
        try {
            const response = await api.checkTemplateName(name);
            setNameExists(response.exists);
        } catch {
            setNameExists(false);
        } finally {
            setNameCheckLoading(false);
        }
    };

    const handleCloneNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newName = e.target.value;
        setCloneName(newName);

        // Debounce name check
        setTimeout(() => {
            checkNameExists(newName);
        }, 500);
    };

    const handleCloneSubmit = async () => {
        if (!templateToClone || nameExists || !cloneName.trim()) {
            return;
        }

        try {
            const response = await api.cloneTemplate(templateToClone.id, {
                name: cloneName,
                visibility: cloneVisibility
            });

            if (response.success) {
                toast.showSuccess(t.templatecontroller649);
                setCloneModalVisible(false);
                loadMyTemplates();
                loadCommunityTemplates();
            }
        } catch (error: any) {
            console.error('Clone error:', error.response?.data);
            const errorMessage = error.response?.data?.message || t.templatemanagementpanel291;
            const debugInfo = error.response?.data?.debug;
            if (debugInfo) {
                console.log('Debug info:', debugInfo);
                toast.showError(`${errorMessage} (User ID: ${debugInfo.your_user_id})`);
            } else {
                toast.showError(errorMessage);
            }
        }
    };

    const handleOpenLinkModal = async (template: Template) => {
        setTemplateToLink(template);
        setLoadingProjects(true);
        setLinkModalVisible(true);

        try {
            // Load all user's projects
            const projects = await api.getUserProjects();
            setAllProjects(projects || []);

            // Use linked_project_ids from template object (already loaded)
            setLinkedProjectIds(template.linked_project_ids || []);
        } catch (error) {
            console.error('Error loading projects:', error);
            toast.showError('Fehler beim Laden der Projekte');
            setAllProjects([]);
            setLinkedProjectIds([]);
        } finally {
            setLoadingProjects(false);
        }
    };

    const handleToggleProjectLink = (projectId: number) => {
        if (linkedProjectIds.includes(projectId)) {
            setLinkedProjectIds(linkedProjectIds.filter(id => id !== projectId));
        } else {
            setLinkedProjectIds([...linkedProjectIds, projectId]);
        }
    };

    const handleApplyProjectLinks = async () => {
        if (!templateToLink) return;

        try {
            // Apply the links
            await api.updateTemplateProjectLinks(templateToLink.id, linkedProjectIds);
            toast.showSuccess('Template-Verknüpfungen erfolgreich aktualisiert');
            setLinkModalVisible(false);
            loadMyTemplates();
            loadCommunityTemplates();
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || 'Fehler beim Aktualisieren der Verknüpfungen';
            toast.showError(errorMessage);
        }
    };

    // Store Settings Handlers
    const openStoreSettings = async (template: Template) => {
        setTemplateForStoreSettings(template);
        setStorePriceType(template.price_type || 'credits');
        setStorePriceCredits(template.price_credits || 50);
        setStorePriceEuros(template.price_euros || 1.00);
        setStoreSettingsTab(0);
        setNewVideoUrl('');
        setNewVideoTitle('');
        setTemplateMedia({ logo: null, images: [], videos: [] });
        setStoreSettingsModalVisible(true);
        // Load media asynchronously
        await loadTemplateMedia(template.id);
    };

    const handleSaveStoreSettings = async () => {
        if (!templateForStoreSettings) return;

        // Validate
        if (storePriceType === 'credits' && storePriceCredits < 50) {
            toast.showError('Minimum 50 Credits erforderlich');
            return;
        }
        if (storePriceType === 'euros' && storePriceEuros < 1.00) {
            toast.showError('Minimum 1.00 EUR erforderlich');
            return;
        }

        setSavingStoreSettings(true);
        try {
            await api.request(`/store/templates/${templateForStoreSettings.id}/price`, {
                method: 'PUT',
                body: JSON.stringify({
                    price_type: storePriceType,
                    price_credits: storePriceType === 'credits' ? storePriceCredits : null,
                    price_euros: storePriceType === 'euros' ? storePriceEuros : null,
                }),
            });
            toast.showSuccess('Store-Einstellungen gespeichert');
            setStoreSettingsModalVisible(false);
            loadMyTemplates();
        } catch (error: any) {
            toast.showError(error.message || 'Fehler beim Speichern');
        } finally {
            setSavingStoreSettings(false);
        }
    };

    // Media Handler Functions
    const loadTemplateMedia = async (templateId: number) => {
        try {
            const response = await api.request(`/templates/${templateId}/media`);
            // Response format: { logo: ..., images: [...], videos: [...] }
            setTemplateMedia({
                logo: response.logo || null,
                images: response.images || [],
                videos: response.videos || [],
            });
        } catch (error) {
            console.error('Error loading media:', error);
            setTemplateMedia({ logo: null, images: [], videos: [] });
        }
    };

    const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!templateForStoreSettings || !event.target.files || event.target.files.length === 0) return;

        const file = event.target.files[0];
        if (!file.type.startsWith('image/')) {
            toast.showError('Bitte nur Bilddateien hochladen');
            return;
        }

        if (file.size > 2 * 1024 * 1024) {
            toast.showError('Logo darf maximal 2MB groß sein');
            return;
        }

        setUploadingLogo(true);
        try {
            const formData = new FormData();
            formData.append('logo', file);

            const response = await api.uploadFile(`/templates/${templateForStoreSettings.id}/media/logo`, formData);
            if (response.success) {
                toast.showSuccess('Logo hochgeladen');
                await loadTemplateMedia(templateForStoreSettings.id);
            }
        } catch (error: any) {
            toast.showError(error.message || 'Fehler beim Hochladen');
        } finally {
            setUploadingLogo(false);
            if (logoInputRef.current) logoInputRef.current.value = '';
        }
    };

    const handleImagesUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!templateForStoreSettings || !event.target.files || event.target.files.length === 0) return;

        const files = Array.from(event.target.files);
        const invalidFiles = files.filter(f => !f.type.startsWith('image/'));
        if (invalidFiles.length > 0) {
            toast.showError('Bitte nur Bilddateien hochladen');
            return;
        }

        const oversizedFiles = files.filter(f => f.size > 5 * 1024 * 1024);
        if (oversizedFiles.length > 0) {
            toast.showError('Bilder dürfen maximal 5MB groß sein');
            return;
        }

        setUploadingImages(true);
        try {
            const formData = new FormData();
            files.forEach((file) => {
                formData.append('images[]', file);
            });

            const response = await api.uploadFile(`/templates/${templateForStoreSettings.id}/media/images`, formData);
            if (response.success) {
                toast.showSuccess(`${files.length} Bild(er) hochgeladen`);
                await loadTemplateMedia(templateForStoreSettings.id);
            }
        } catch (error: any) {
            toast.showError(error.message || 'Fehler beim Hochladen');
        } finally {
            setUploadingImages(false);
            if (imagesInputRef.current) imagesInputRef.current.value = '';
        }
    };

    const handleAddVideo = async () => {
        if (!templateForStoreSettings || !newVideoUrl.trim()) {
            toast.showError('Bitte eine Video-URL eingeben');
            return;
        }

        // Validate YouTube/Vimeo URL
        const youtubePattern = /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/)|youtu\.be\/)/;
        const vimeoPattern = /^(https?:\/\/)?(www\.)?vimeo\.com\//;

        if (!youtubePattern.test(newVideoUrl) && !vimeoPattern.test(newVideoUrl)) {
            toast.showError('Bitte eine gültige YouTube oder Vimeo URL eingeben');
            return;
        }

        setAddingVideo(true);
        try {
            const response = await api.request(`/templates/${templateForStoreSettings.id}/media/videos`, {
                method: 'POST',
                body: JSON.stringify({
                    video_url: newVideoUrl,
                    title: newVideoTitle || null,
                }),
            });
            if (response.success) {
                toast.showSuccess('Video hinzugefügt');
                setNewVideoUrl('');
                setNewVideoTitle('');
                await loadTemplateMedia(templateForStoreSettings.id);
            }
        } catch (error: any) {
            toast.showError(error.message || 'Fehler beim Hinzufügen');
        } finally {
            setAddingVideo(false);
        }
    };

    const handleDeleteMedia = async (mediaId: number, mediaType: string) => {
        if (!templateForStoreSettings) return;

        confirmDialog({
            message: `${mediaType === 'logo' ? 'Logo' : mediaType === 'image' ? 'Bild' : 'Video'} wirklich löschen?`,
            header: 'Löschen bestätigen',
            icon: 'pi pi-exclamation-triangle',
            acceptClassName: 'p-button-danger',
            accept: async () => {
                try {
                    await api.request(`/templates/${templateForStoreSettings.id}/media/${mediaId}`, {
                        method: 'DELETE',
                    });
                    toast.showSuccess('Gelöscht');
                    await loadTemplateMedia(templateForStoreSettings.id);
                } catch (error: any) {
                    toast.showError(error.message || 'Fehler beim Löschen');
                }
            },
        });
    };

    const getVideoEmbedUrl = (url: string): string => {
        // YouTube
        const youtubeMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]+)/);
        if (youtubeMatch) {
            return `https://www.youtube.com/embed/${youtubeMatch[1]}`;
        }
        // Vimeo
        const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
        if (vimeoMatch) {
            return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
        }
        return url;
    };

    const handleSubmit = async (values: any) => {
        try {
            const templateData = {
                name: values.name,
                description: values.description,
                category: values.category,
                language: values.language,
                tags: values.tags || [],
                is_active: values.is_active !== false,
                visibility: values.visibility || 'public',
                is_system_template: values.is_system_template || false,
                protected_files: values.protected_files || [],
                install_script: values.install_script || [],
                update_script: values.update_script || [],
                files: templateFiles.map((file, index) => ({
                    file_name: file.file_name,
                    file_content: file.file_content,
                    file_type: file.file_type,
                    file_order: index,
                    output_path: file.output_path || '/',
                    form_window_type: file.form_window_type || 0
                }))
            };

            let response;
            if (editingTemplate) {
                response = await api.updateTemplate(editingTemplate.id, templateData);
            } else {
                response = await api.createTemplate(templateData);
            }

            if (response.success) {
                toast.showSuccess(`Template erfolgreich ${editingTemplate ? 'aktualisiert' : 'erstellt'}`);

                // 🛡️ Check for security scanner warning
                if (response.template?.auto_set_to_private) {
                    setTimeout(() => {
                        let warningMessage = response.template.warning || 'Template unusual content detected, switching back to private.';
                        if (response.template.detected_issues) {
                            warningMessage += '\n\nDetected: ' + response.template.detected_issues;
                        }
                        toast.showWarn(warningMessage);
                    }, 800); // 800ms delay so it shows AFTER success toast
                }

                setModalVisible(false);
                setTemplateFiles([]);

                // 🔄 Refresh table immediately after template creation/update
                await loadMyTemplates();
                await loadCommunityTemplates();
            }
        } catch (error: any) {
            // Template submission error
            const errorMessage = error.response?.data?.error || error.response?.data?.message || `Fehler beim ${editingTemplate ? t.applicationsmodal313 : t.teammodal240} des Templates`;
            toast.showError(errorMessage);
        }
    };

    // Separate save function for t.cmsadminpanel279 button - saves template and transitions to edit mode
    const handleSave = async (values: any) => {
        try {
            const templateData = {
                name: values.name,
                description: values.description || '',
                category: values.category,
                language: values.language,
                tags: values.tags || [],
                is_active: values.is_active,
                visibility: values.visibility || 'public',
                is_system_template: values.is_system_template || false,
                protected_files: values.protected_files || [],
                install_script: values.install_script || [],
                update_script: values.update_script || [],
                files: [] // No files when just saving for the first time
            };

            // Create the template
            const response = await api.createTemplate(templateData);

            if (response.success) {
                toast.showSuccess(t.templatemanagementpanel359);

                // 🛡️ Check for security scanner warning
                if (response.template?.auto_set_to_private) {
                    setTimeout(() => {
                        let warningMessage = response.template.warning || 'Template unusual content detected, switching back to private.';
                        if (response.template.detected_issues) {
                            warningMessage += '\n\nDetected: ' + response.template.detected_issues;
                        }
                        toast.showWarn(warningMessage);
                    }, 800); // 800ms delay
                }

                // Close the create modal
                setModalVisible(false);
                setTemplateFiles([]);

                // 🔄 Refresh tables immediately
                await loadMyTemplates();
                await loadCommunityTemplates();

                // Load the newly created template and open edit modal
                setTimeout(async () => {

                    // Find the newly created template by ID
                    const newTemplate = response.template;
                    if (newTemplate) {
                        // Open edit modal with the new template
                        setEditingTemplate(newTemplate);
                        setModalVisible(true);

                        // Load template files for the new template
                        try {
                            const templateResponse = await api.getTemplate(newTemplate.id);
                            if (templateResponse.success) {
                                // Ensure output_path is properly set for each file
                                const files = templateResponse.template.files || [];
                                const filesWithOutputPath = files.map((file: TemplateFile) => ({
                                    ...file,
                                    output_path: file.output_path || '/'
                                }));
                                setTemplateFiles(filesWithOutputPath);
                            }
                        } catch {
                            // Files loading error - not critical
                        }
                    }
                }, 300);
            }
        } catch (error: any) {
            const errorMessage = error.response?.data?.error || error.response?.data?.message || t.templatemanagementpanel395;
            toast.showError(errorMessage);
        }
    };

    const handleImport = (file: File) => {
        const filename = file.name.toLowerCase();

        // Check if it's an archive file (ZIP, TAR.GZ, TAR.XZ)
        const isArchive = filename.endsWith('.zip') ||
                         filename.endsWith('.tar.gz') ||
                         filename.endsWith('.tar.xz') ||
                         filename.endsWith('.gz') ||
                         filename.endsWith('.tar') ||
                         filename.endsWith('.xz');

        if (isArchive) {
            // Handle archive import
            handleArchiveImport(file);
            return false;
        }

        // Handle JSON import (original logic)
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const templateData = JSON.parse(e.target?.result as string);

                // Use the new import API endpoint
                const response = await api.importTemplate(templateData, false);

                if (response.success) {
                    toast.showSuccess(t.templatemanagementpanel410);
                    loadMyTemplates();
                    loadCommunityTemplates();
                } else {
                    toast.showError(response.error || t.templatemanagementpanel413);
                }
            } catch (error: any) {
                if (error.response?.status === 409) {
                    // Template already exists
                    confirmDialog({
                        message: t.templatemanagementpanel419,
                        header: t.templatemanagementpanel420,
                        icon: 'pi pi-exclamation-triangle',
                        accept: async () => {
                            try {
                                const templateData = JSON.parse(e.target?.result as string);
                                const response = await api.importTemplate(templateData, true);

                                if (response.success) {
                                    toast.showSuccess(t.templatemanagementpanel428);
                                    loadMyTemplates();
                                    loadCommunityTemplates();
                                }
                            } catch {
                                // Error overwriting template
                                toast.showError(t.templatemanagementpanel433);
                            }
                        },
                        acceptLabel: 'Ja, überschreiben',
                        rejectLabel: t.templatefilemanager361,
                        acceptClassName: 'p-button-danger'
                    });
                } else {
                    toast.showError(t.templatemanagementpanel413);
                    // Import error
                }
            }
        };
        reader.readAsText(file);
        return false;
    };

    const handleArchiveImport = async (file: File) => {
        console.log('handleArchiveImport called with file:', file.name, file.type, file.size);

        try {
            const formData = new FormData();
            formData.append('template_file', file);
            formData.append('overwrite_existing', 'false');

            const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');

            console.log('Sending archive import request to /api/templates/import');

            const response = await fetch('/api/templates/import', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                body: formData,
            });

            const data = await response.json();

            if (response.ok && data.success) {
                toast.showSuccess(data.message || 'Template erfolgreich aus Archiv importiert');
                loadMyTemplates();
                loadCommunityTemplates();
            } else if (response.status === 409) {
                // Template already exists - ask for overwrite
                confirmDialog({
                    message: 'Ein Template mit diesem Namen existiert bereits. Möchten Sie es überschreiben?',
                    header: 'Template existiert bereits',
                    icon: 'pi pi-exclamation-triangle',
                    accept: async () => {
                        try {
                            const formDataOverwrite = new FormData();
                            formDataOverwrite.append('template_file', file);
                            formDataOverwrite.append('overwrite_existing', 'true');

                            const responseOverwrite = await fetch('/api/templates/import', {
                                method: 'POST',
                                headers: {
                                    'Authorization': `Bearer ${token}`,
                                },
                                body: formDataOverwrite,
                            });

                            const dataOverwrite = await responseOverwrite.json();

                            if (responseOverwrite.ok && dataOverwrite.success) {
                                toast.showSuccess(dataOverwrite.message || 'Template erfolgreich überschrieben');
                                loadMyTemplates();
                                loadCommunityTemplates();
                            } else {
                                toast.showError(dataOverwrite.error || 'Fehler beim Überschreiben des Templates');
                            }
                        } catch (error: any) {
                            toast.showError('Fehler beim Überschreiben des Templates: ' + error.message);
                        }
                    },
                    acceptLabel: 'Ja, überschreiben',
                    rejectLabel: 'Abbrechen',
                    acceptClassName: 'p-button-danger'
                });
            } else {
                toast.showError(data.error || 'Fehler beim Importieren des Archivs');
            }
        } catch (error: any) {
            toast.showError('Fehler beim Importieren des Archivs: ' + error.message);
        }
    };

    const handleExport = async (template: Template, format: 'json' | 'zip' | 'tar.gz' | 'tar.xz' = 'json') => {
        try {
            if (format !== 'json') {
                // Download as archive (ZIP/TAR.GZ/TAR.XZ)
                const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');

                const response = await fetch(`/api/templates/${template.id}/download-archive?format=${format}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });

                if (!response.ok) {
                    throw new Error(`Failed to download ${format.toUpperCase()}`);
                }

                const blob = await response.blob();
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `${template.name}.${format}`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
                toast.showSuccess(`Template als ${format.toUpperCase()} heruntergeladen`);
            } else {
                // Export as JSON (original logic)
                const response = await api.exportTemplate(template.id);
                if (response.success) {
                    const dataStr = JSON.stringify(response.export_data, null, 2);
                    const dataBlob = new Blob([dataStr], { type: 'application/json' });
                    const url = URL.createObjectURL(dataBlob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = response.filename || `${template.name.replace(/\s+/g, '_')}_template.json`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(url);
                    toast.showSuccess(t.templatemanagementpanel464);
                }
            }
        } catch (error: any) {
            toast.showError(t.templatemanagementpanel467 + ': ' + error.message);
        }
    };

    // File management functions
    const handleCreateFile = () => {
        setEditingFile(null);
        setFileModalVisible(true);
    };

    const handleEditFile = (file: TemplateFile) => {
        setEditingFile(file);
        setFileModalVisible(true);
    };

    const handleDeleteFile = async (index: number) => {
        if (!editingTemplate) {
            toast.showError(t.templatemanagementpanel485);
            return;
        }

        const fileToDelete = templateFiles[index];
        const newFiles = templateFiles.filter((_, i) => i !== index);

        try {
            // Save template immediately with deleted file removed
            const templateData = {
                name: editingTemplate.name,
                description: editingTemplate.description,
                category: editingTemplate.category,
                language: editingTemplate.language,
                tags: editingTemplate.tags || [],
                is_active: editingTemplate.is_active !== false,
                files: newFiles.map(f => ({
                    file_name: f.file_name,
                    file_content: f.file_content,
                    file_type: f.file_type,
                    file_order: f.file_order,
                    output_path: f.output_path || '/',
                    form_window_type: f.form_window_type || 0
                }))
            };

            const response = await api.updateTemplate(editingTemplate.id, templateData);

            if (response.success) {
                // Update local state
                setTemplateFiles(newFiles);
                toast.showSuccess(`Datei "${fileToDelete.file_name}" erfolgreich gelöscht`);

                // 🛡️ Check for security scanner warning
                if (response.template?.auto_set_to_private) {
                    setTimeout(() => {
                        let warningMessage = response.template.warning || 'Template unusual content detected, switching back to private.';
                        if (response.template.detected_issues) {
                            warningMessage += '\n\nDetected: ' + response.template.detected_issues;
                        }
                        toast.showWarn(warningMessage);
                    }, 800); // 800ms delay
                }
            } else {
                toast.showError(t.templatefilemanager120);
            }
        } catch (error: any) {
            // File delete error
            toast.showError('Fehler beim Löschen der Datei: ' + (error.response?.data?.message || error.message));
        }
    };

    const handleFileSubmit = async (values: any) => {
        if (!editingTemplate) {
            toast.showError(t.templatemanagementpanel485);
            return;
        }

        // 🎯 Handle ZIP upload: Convert to Base64
        let fileContent = values.file_content;
        let contentType = 'text';
        let zipFilename = null;
        let managedFilesList = null;

        if (values.zip_file) {
            // User uploaded a ZIP file
            try {
                const reader = new FileReader();
                const base64Promise = new Promise<string>((resolve, reject) => {
                    reader.onload = () => {
                        const base64 = reader.result as string;
                        // Remove data:application/zip;base64, prefix
                        resolve(base64.split(',')[1]);
                    };
                    reader.onerror = reject;
                });

                reader.readAsDataURL(values.zip_file);
                fileContent = await base64Promise;
                contentType = 'zip';
                zipFilename = values.zip_file.name;
            } catch (error) {
                toast.showError('Fehler beim Verarbeiten der ZIP-Datei: ' + error.message);
                return;
            }
        } else if (values.managed_files && values.managed_files.length > 0) {
            // User uploaded individual files via File Manager
            managedFilesList = values.managed_files;
            contentType = 'zip'; // Will be converted to ZIP by backend
            zipFilename = values.file_name; // Use the template file name
        }

        const fileData = {
            file_name: values.file_name,
            file_content: fileContent,
            file_type: values.file_type,
            file_order: values.file_order || templateFiles.length,
            output_path: values.output_path || '/',
            content_type: contentType,
            zip_filename: zipFilename,
            managed_files: managedFilesList, // 🆕 List of individual files
            form_window_type: values.form_window_type || 0,
        };

        try{
            // Save file immediately to the template via API
            const templateData = {
                name: editingTemplate.name,
                description: editingTemplate.description,
                category: editingTemplate.category,
                language: editingTemplate.language,
                tags: editingTemplate.tags || [],
                is_active: editingTemplate.is_active !== false,
                files: editingFile
                    ? templateFiles.map(f =>
                        f.id === editingFile.id
                            ? { ...fileData, file_order: f.file_order }
                            : {
                                file_name: f.file_name,
                                file_content: f.file_content,
                                file_type: f.file_type,
                                file_order: f.file_order,
                                output_path: f.output_path || '/',
                                content_type: f.content_type || 'text',
                                zip_filename: f.zip_filename || null,
                                form_window_type: f.form_window_type || 0
                            }
                      )
                    : [...templateFiles.map(f => ({
                        file_name: f.file_name,
                        file_content: f.file_content,
                        file_type: f.file_type,
                        file_order: f.file_order,
                        output_path: f.output_path || '/',
                        content_type: f.content_type || 'text',
                        zip_filename: f.zip_filename || null,
                        form_window_type: f.form_window_type || 0
                      })), fileData]
            };

            const response = await api.updateTemplate(editingTemplate.id, templateData);

            if (response.success) {
                // 🎯 Always reload from server to ensure all fields are correct (including content_type, zip_filename)
                const templateResponse = await api.getTemplate(editingTemplate.id);
                if (templateResponse.success) {
                    // Ensure output_path is properly set for each file
                    const files = templateResponse.template.files || [];
                    const filesWithOutputPath = files.map((file: TemplateFile) => ({
                        ...file,
                        output_path: file.output_path || '/'
                    }));
                    setTemplateFiles(filesWithOutputPath);
                }

                toast.showSuccess(`Datei erfolgreich ${editingFile ? 'aktualisiert' : t.templatemanagementpanel595}`);

                // 🛡️ Check for security scanner warning
                if (response.template?.auto_set_to_private) {
                    setTimeout(() => {
                        let warningMessage = response.template.warning || 'Template unusual content detected, switching back to private.';
                        if (response.template.detected_issues) {
                            warningMessage += '\n\nDetected: ' + response.template.detected_issues;
                        }
                        toast.showWarn(warningMessage);
                    }, 800); // 800ms delay
                }
            } else {
                toast.showError(t.templatemanagementpanel597);
            }
        } catch (error: any) {
            // File save error
            toast.showError('Fehler beim Speichern der Datei: ' + (error.response?.data?.message || error.message));
        }

        // Close modal and reset state
        setEditingFile(null);
        setFileModalVisible(false);
    };

    // Variable management functions
    const loadTemplateVariables = async () => {
        if (!editingTemplate?.id) {
            setTemplateVariables([]);
            return;
        }

        try {
            const response = await api.getTemplateVariables(editingTemplate.id);
            if (response.success) {
                setTemplateVariables(response.variables || []);
            } else {
                // Don't show error toast for permission denied
                console.error('Error loading variables:', response.error);
                setTemplateVariables([]);
            }
        } catch (error: any) {
            console.error('Error loading variables:', error);
            setTemplateVariables([]);
        }
    };

    const handleCreateVariable = () => {
        setEditingVariable(null);
        setVariableModalVisible(true);
    };

    const handleEditVariable = (variable: TemplateVariable) => {
        setEditingVariable(variable);
        setVariableModalVisible(true);
    };

    const handleDeleteVariable = async (variableId: number) => {
        if (!editingTemplate?.id) {
            toast.showError('Kein Template ausgewählt');
            return;
        }

        try {
            const response = await api.deleteTemplateVariable(editingTemplate.id, variableId);
            if (response.success) {
                toast.showSuccess('Variable erfolgreich gelöscht');
                loadTemplateVariables();
            } else {
                toast.showError(response.error || 'Fehler beim Löschen der Variable');
            }
        } catch (_error: any) {
            toast.showError('Fehler beim Löschen der Variable');
        }
    };

    const handleVariableSubmit = async (values: any) => {
        if (!editingTemplate?.id) {
            toast.showError('Kein Template ausgewählt');
            return;
        }

        try {
            let response;
            if (editingVariable?.id) {
                // Update existing variable
                response = await api.updateTemplateVariable(editingTemplate.id, editingVariable.id, values);
                if (response.success) {
                    toast.showSuccess('Variable erfolgreich aktualisiert');
                } else {
                    toast.showError(response.error || 'Fehler beim Aktualisieren der Variable');
                    return;
                }
            } else {
                // Create new variable
                response = await api.createTemplateVariable(editingTemplate.id, values);
                if (response.success) {
                    toast.showSuccess('Variable erfolgreich erstellt');
                } else {
                    toast.showError(response.error || 'Fehler beim Erstellen der Variable');
                    return;
                }
            }

            setVariableModalVisible(false);
            setEditingVariable(null);
            loadTemplateVariables();
        } catch (_error: any) {
            toast.showError('Fehler beim Speichern der Variable');
        }
    };


    // Get unique languages from both tables
    const uniqueMyLanguages = Array.from(new Set(myTemplates.map(t => t.language).filter(Boolean)));
    const uniqueCommunityLanguages = Array.from(new Set(communityTemplates.map(t => t.language).filter(Boolean)));

    return (
        <div className="flex flex-col h-full bg-gray-800 text-gray-100">
            {/* Header - Fixed at top */}
            <div className="flex-shrink-0 p-4 pb-2">
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-white">{t.panelsewnavigationpanel188}</h2>
                    <div className="flex gap-2">
                        <Button
                            icon="pi pi-plus"
                            label={t.templatemanagementpanel618}
                            onClick={handleCreate}
                            className="p-button-primary"
                        />
                        <Button
                            icon="pi pi-box"
                            label="Archiv importieren"
                            onClick={() => setImportWizardVisible(true)}
                            className="p-button-success"
                            tooltip="Import aus .zip, .tar.gz, .tar.xz Archiv"
                            tooltipOptions={{ position: 'bottom' }}
                        />
                        <Button
                            icon="pi pi-upload"
                            label={t.schematranslationpanel762}
                            onClick={() => document.getElementById('template-upload')?.click()}
                            className="p-button-secondary"
                        />
                        <input
                            id="template-upload"
                            type="file"
                            accept=".json,.zip,.tar.gz,.gz,.tar,.xz,application/json,application/zip,application/gzip,application/x-gzip,application/x-tar,application/x-xz"
                            style={{ display: 'none' }}
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                    handleImport(file);
                                    e.target.value = '';
                                }
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* Scrollable content area */}
            <div className="flex-1 overflow-y-auto">
                <div className="px-4 pb-4">

                {/* MY TEMPLATES TABLE */}
                <Card title="Meine Templates" className="mb-4">
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex gap-2">
                            {/* Type Filter - show 'system' option only for system/admin/inner_core users */}
                            <Dropdown
                                value={myTypeFilter}
                                options={
                                    userType === 'system' || userType === 'admin' || isInnerCore
                                        ? [
                                            { label: 'Alle', value: 'all' },
                                            { label: 'Privat', value: 'private' },
                                            { label: 'Öffentlich', value: 'public' },
                                            { label: 'System', value: 'system' }
                                        ]
                                        : [
                                            { label: 'Alle', value: 'all' },
                                            { label: 'Privat', value: 'private' },
                                            { label: 'Öffentlich', value: 'public' },
                                            { label: 'Store', value: 'store' }
                                        ]
                                }
                                onChange={(e) => setMyTypeFilter(e.value)}
                                placeholder="Typ"
                                className="w-32"
                            />
                            <Dropdown
                                value={myLanguageFilter}
                                options={[{ label: 'Alle Sprachen', value: 'all' }, ...uniqueMyLanguages.map(l => ({ label: l, value: l }))]}
                                onChange={(e) => setMyLanguageFilter(e.value)}
                                placeholder="Sprache"
                                className="w-40"
                            />
                            <Dropdown
                                value={myCategoryFilter}
                                options={categories.map(cat => ({ label: cat, value: cat }))}
                                onChange={(e) => setMyCategoryFilter(e.value)}
                                placeholder={t.templatesColumnCategory}
                                className="w-32"
                            />
                            <InputText
                                value={mySearchTerm}
                                onChange={(e) => setMySearchTerm(e.target.value)}
                                placeholder={t.templatesSearchPlaceholder}
                                className="w-64"
                            />
                        </div>
                    </div>

                    <DataTable
                        value={myTemplates}
                        loading={myTemplatesLoading}
                        paginator
                        rows={10}
                        rowsPerPageOptions={[10, 25, 50]}
                        sortMode="multiple"
                        className="p-datatable-sm"
                        emptyMessage={t.templatesNoTemplatesFound}
                        paginatorTemplate={t.languagemanagementpanel317}
                        currentPageReportTemplate="{first} bis {last} von {totalRecords} Templates"
                    >
                        <Column
                            field="name"
                            header={t.registermodal236}
                            sortable
                            body={(template) => (
                                <div className="flex items-center gap-2">
                                    {template.is_soft_locked && <i className="pi pi-lock text-red-500" />}
                                    <span className={template.is_soft_locked ? 'text-red-400' : ''}>{template.name}</span>
                                </div>
                            )}
                        />
                        <Column
                            field="category"
                            header={t.templatesColumnCategory}
                            body={(template) => (
                                <span className="px-2 py-1 bg-blue-500 text-white rounded text-xs">
                                    {template.category}
                                </span>
                            )}
                        />
                        <Column 
                            field="language" 
                            header={t.cmsadminpanel245}
                            body={(template) => (
                                <span className="px-2 py-1 bg-green-500 text-white rounded text-xs">
                                    {template.language}
                                </span>
                            )}
                        />
                        <Column
                            field="tags"
                            header={t.templatemanagementpanel693}
                            body={(template) => (
                                <div className="flex gap-1 flex-wrap">
                                    {template.tags?.map((tag: string, index: number) => (
                                        <span key={index} className="px-1 py-0.5 bg-orange-400 text-white rounded text-xs">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            )}
                        />
                        <Column
                            header={t.edittablemodal512}
                            body={(template) => {
                                if (template.is_system_template) {
                                    return (
                                        <span className="px-2 py-1 bg-purple-500 text-white rounded text-xs">
                                            System
                                        </span>
                                    );
                                }
                                const visibilityConfig: Record<string, { bg: string; label: string }> = {
                                    'public': { bg: 'bg-blue-500', label: t.databasemanagementpanel772 },
                                    'private': { bg: 'bg-red-500', label: t.databasemanagementpanel771 },
                                    'store': { bg: 'bg-purple-500', label: 'Store' }
                                };
                                const config = visibilityConfig[template.visibility] || visibilityConfig['public'];
                                return (
                                    <span className={`px-2 py-1 rounded text-xs ${config.bg} text-white`}>
                                        {config.label}
                                        {template.visibility === 'store' && !template.is_store_approved && (
                                            <i className="pi pi-clock ml-1 text-xs" title="Warten auf Freigabe"></i>
                                        )}
                                    </span>
                                );
                            }}
                        />
                        <Column
                            field="file_count"
                            header={t.templatemanagementpanel706}
                            body={(template) => `${template.file_count} Dateien`}
                        />
                        <Column
                            header="Projekte"
                            body={(template) => {
                                const count = template.linked_project_ids?.length || 0;
                                const activeProjects = template.linked_projects?.filter(p => p.is_active) || [];
                                const inactiveProjects = template.linked_projects?.filter(p => !p.is_active) || [];

                                let tooltipText = '';
                                if (activeProjects.length > 0) {
                                    tooltipText += 'Aktiv: ' + activeProjects.map(p => p.name).join(', ');
                                }
                                if (inactiveProjects.length > 0) {
                                    if (tooltipText) tooltipText += '\n';
                                    tooltipText += 'Inaktiv: ' + inactiveProjects.map(p => p.name).join(', ');
                                }
                                if (!tooltipText) tooltipText = 'Keine Projekte verknüpft';

                                return (
                                    <span
                                        className="px-2 py-1 bg-cyan-500 text-white rounded text-xs cursor-help"
                                        title={tooltipText}
                                    >
                                        {count} {count === 1 ? 'Projekt' : 'Projekte'}
                                    </span>
                                );
                            }}
                        />
                        <Column
                            field="is_active"
                            header={t.applicationsmodal335}
                            body={(template) => {
                                // Show locked status for soft-locked private templates
                                if (template.is_soft_locked) {
                                    return (
                                        <div className="flex items-center gap-1">
                                            <i className="pi pi-lock text-red-500" />
                                            <Tag value="Gesperrt" severity="danger" />
                                        </div>
                                    );
                                }
                                // Show warning if expiring soon
                                if (template.subscription_data?.days_remaining !== null &&
                                    template.subscription_data?.days_remaining !== undefined &&
                                    template.subscription_data.days_remaining <= 14) {
                                    return (
                                        <div className="flex items-center gap-1">
                                            <i className="pi pi-exclamation-triangle text-yellow-500" />
                                            <Tag value={`${template.subscription_data.days_remaining} Tage`} severity="warning" />
                                        </div>
                                    );
                                }
                                return (
                                    <span className={`px-2 py-1 rounded text-xs ${
                                        template.is_active ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'
                                    }`}>
                                        {template.is_active ? t.templatesStatusActive : t.manageteammodal328}
                                    </span>
                                );
                            }}
                        />
                        <Column
                            field="created_at"
                            header={t.databasemanagementpanel861}
                            body={(template) => new Date(template.created_at).toLocaleDateString('de-DE')}
                        />
                        <Column
                            header={t.applicationsmodal354}
                            body={(template) => {
                                const isOwner = parseInt(template.creator_user_id) === currentUserId;
                                const hasLinkedProjects = (template.linked_project_ids?.length || 0) > 0;

                                // If template is soft-locked, show only View and Unlock buttons
                                if (template.is_soft_locked) {
                                    return (
                                        <div className="flex gap-1 items-center">
                                            <Button
                                                icon="pi pi-eye"
                                                className="p-button-text p-button-sm"
                                                onClick={() => handleView(template)}
                                                tooltip={t.publicprojectspanel378}
                                            />
                                            <Button
                                                icon={unlockingTemplate && templateToUnlock?.id === template.id ? "pi pi-spinner pi-spin" : "pi pi-unlock"}
                                                label="50 Credits"
                                                className="p-button-rounded p-button-sm"
                                                style={{ backgroundColor: '#2563eb', borderColor: '#2563eb', color: 'white' }}
                                                tooltip="Template entsperren (50 Credits)"
                                                onClick={() => handleUnlockExpiredTemplate(template, false)}
                                                disabled={unlockingTemplate}
                                            />
                                            <Button
                                                icon="pi pi-globe"
                                                className="p-button-rounded p-button-sm"
                                                style={{ backgroundColor: '#059669', borderColor: '#059669', color: 'white' }}
                                                tooltip="Öffentlich machen (kostenlos)"
                                                onClick={() => handleUnlockExpiredTemplate(template, true)}
                                                disabled={unlockingTemplate}
                                            />
                                        </div>
                                    );
                                }

                                return (
                                    <div className="flex gap-1">
                                        <Button
                                            icon="pi pi-link"
                                            className="p-button-text p-button-success p-button-sm"
                                            onClick={() => handleOpenLinkModal(template)}
                                            tooltip="Mit Projekten verknüpfen"
                                        />
                                        {/* Toggle active button - show if template has linked projects */}
                                        {hasLinkedProjects && (
                                            <Button
                                                icon="pi pi-eye-slash"
                                                className="p-button-text p-button-warning p-button-sm"
                                                onClick={() => handleToggleActive(template)}
                                                tooltip="Verknüpfungen verwalten"
                                            />
                                        )}
                                        <Button
                                            icon="pi pi-eye"
                                            className="p-button-text p-button-sm"
                                            onClick={() => handleView(template)}
                                            tooltip={t.publicprojectspanel378}
                                        />
                                        {isOwner && (
                                            <Button
                                                icon="pi pi-pencil"
                                                className="p-button-text p-button-sm"
                                                onClick={() => handleEdit(template)}
                                                tooltip={t.cmsadminpanel170}
                                            />
                                        )}
                                        <Button
                                            icon="pi pi-download"
                                            className="p-button-text p-button-sm"
                                            onClick={(e) => {
                                                // Show context menu for export format
                                                const menu = document.createElement('div');
                                                menu.className = 'absolute bg-gray-700 border border-gray-600 rounded shadow-lg z-50';
                                                menu.style.top = `${e.clientY}px`;
                                                menu.style.left = `${e.clientX}px`;
                                                menu.innerHTML = `
                                                    <div class="py-1">
                                                        <button class="export-json w-full px-4 py-2 text-left hover:bg-gray-600 text-white">JSON exportieren</button>
                                                        <button class="export-zip w-full px-4 py-2 text-left hover:bg-gray-600 text-white">ZIP exportieren</button>
                                                        <button class="export-tar-gz w-full px-4 py-2 text-left hover:bg-gray-600 text-white">TAR.GZ exportieren</button>
                                                        <button class="export-tar-xz w-full px-4 py-2 text-left hover:bg-gray-600 text-white">TAR.XZ exportieren</button>
                                                    </div>
                                                `;
                                                document.body.appendChild(menu);

                                                menu.querySelector('.export-json')?.addEventListener('click', () => {
                                                    handleExport(template, 'json');
                                                    document.body.removeChild(menu);
                                                });

                                                menu.querySelector('.export-zip')?.addEventListener('click', () => {
                                                    handleExport(template, 'zip');
                                                    document.body.removeChild(menu);
                                                });

                                                menu.querySelector('.export-tar-gz')?.addEventListener('click', () => {
                                                    handleExport(template, 'tar.gz');
                                                    document.body.removeChild(menu);
                                                });

                                                menu.querySelector('.export-tar-xz')?.addEventListener('click', () => {
                                                    handleExport(template, 'tar.xz');
                                                    document.body.removeChild(menu);
                                                });

                                                // Close menu when clicking outside
                                                setTimeout(() => {
                                                    document.addEventListener('click', function closeMenu() {
                                                        if (document.body.contains(menu)) {
                                                            document.body.removeChild(menu);
                                                        }
                                                        document.removeEventListener('click', closeMenu);
                                                    });
                                                }, 100);
                                            }}
                                            tooltip="Template exportieren (JSON/ZIP)"
                                        />
                                        <Button
                                            icon="pi pi-copy"
                                            className="p-button-text p-button-info p-button-sm"
                                            onClick={() => handleClone(template)}
                                            tooltip={t.templatemanagementpanel777}
                                        />
                                        {/* Store Settings Button - only for store templates owned by user */}
                                        {isOwner && template.visibility === 'store' && (
                                            <Button
                                                icon="pi pi-shopping-cart"
                                                className="p-button-text p-button-warning p-button-sm"
                                                onClick={() => openStoreSettings(template)}
                                                tooltip="Store-Einstellungen (Preis & Media)"
                                            />
                                        )}
                                        {isOwner && (
                                            <>
                                                <Button
                                                    icon="pi pi-trash"
                                                    className="p-button-text p-button-danger p-button-sm"
                                                    onClick={() => confirmDelete(template)}
                                                    tooltip={t.templatemanagementpanel795}
                                                />
                                            </>
                                        )}
                                    </div>
                                );
                            }}
                        />
                    </DataTable>
                </Card>

                {/* COMMUNITY TEMPLATES TABLE */}
                <Card title="System, Öffentliche & Store Templates" className="mb-4">
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex gap-2">
                            <Dropdown
                                value={communityTypeFilter}
                                options={[
                                    { label: 'Alle', value: 'all' },
                                    { label: 'System', value: 'system' },
                                    { label: 'Öffentlich', value: 'public' },
                                    { label: 'Store', value: 'store' }
                                ]}
                                onChange={(e) => setCommunityTypeFilter(e.value)}
                                placeholder="Typ"
                                className="w-32"
                            />
                            <Dropdown
                                value={communityLanguageFilter}
                                options={[{ label: 'Alle Sprachen', value: 'all' }, ...uniqueCommunityLanguages.map(l => ({ label: l, value: l }))]}
                                onChange={(e) => setCommunityLanguageFilter(e.value)}
                                placeholder="Sprache"
                                className="w-40"
                            />
                            <Dropdown
                                value={communityCategoryFilter}
                                options={categories.map(cat => ({ label: cat, value: cat }))}
                                onChange={(e) => setCommunityCategoryFilter(e.value)}
                                placeholder={t.templatesColumnCategory}
                                className="w-32"
                            />
                            <InputText
                                value={communitySearchTerm}
                                onChange={(e) => setCommunitySearchTerm(e.target.value)}
                                placeholder={t.templatesSearchPlaceholder}
                                className="w-64"
                            />
                        </div>
                    </div>

                    <DataTable
                        value={communityTemplates}
                        loading={communityLoading}
                        paginator
                        rows={10}
                        rowsPerPageOptions={[10, 25, 50]}
                        sortMode="multiple"
                        className="p-datatable-sm"
                        emptyMessage={t.templatesNoTemplatesFound}
                        paginatorTemplate={t.languagemanagementpanel317}
                        currentPageReportTemplate="{first} bis {last} von {totalRecords} Templates"
                    >
                        <Column field="name" header={t.registermodal236} sortable />
                        <Column
                            field="category"
                            header={t.templatesColumnCategory}
                            body={(template) => (
                                <span className="px-2 py-1 bg-blue-500 text-white rounded text-xs">
                                    {template.category}
                                </span>
                            )}
                        />
                        <Column
                            field="language"
                            header={t.cmsadminpanel245}
                            body={(template) => (
                                <span className="px-2 py-1 bg-green-500 text-white rounded text-xs">
                                    {template.language}
                                </span>
                            )}
                        />
                        <Column
                            header={t.edittablemodal512}
                            body={(template) => {
                                if (template.is_system_template) {
                                    return (
                                        <span className="px-2 py-1 bg-purple-500 text-white rounded text-xs">
                                            System
                                        </span>
                                    );
                                }
                                if (template.visibility === 'store') {
                                    const priceText = template.price_type === 'euros' && template.price_euros != null
                                        ? `${Number(template.price_euros).toFixed(2)} €`
                                        : template.price_type === 'credits' && template.price_credits != null
                                            ? `${template.price_credits} Credits`
                                            : 'Preis n/a';
                                    return (
                                        <div className="flex flex-col gap-0.5">
                                            <span className="px-2 py-1 bg-orange-500 text-white rounded text-xs">
                                                Store
                                            </span>
                                            <span className="text-xs text-gray-400">{priceText}</span>
                                        </div>
                                    );
                                }
                                return (
                                    <span className="px-2 py-1 bg-blue-500 text-white rounded text-xs">
                                        {t.databasemanagementpanel772}
                                    </span>
                                );
                            }}
                        />
                        <Column
                            field="file_count"
                            header={t.templatemanagementpanel706}
                            body={(template) => `${template.file_count} Dateien`}
                        />
                        <Column
                            header="Projekte"
                            body={(template) => {
                                const count = template.linked_project_ids?.length || 0;
                                const activeProjects = template.linked_projects?.filter(p => p.is_active) || [];
                                const inactiveProjects = template.linked_projects?.filter(p => !p.is_active) || [];

                                let tooltipText = '';
                                if (activeProjects.length > 0) {
                                    tooltipText += 'Aktiv: ' + activeProjects.map(p => p.name).join(', ');
                                }
                                if (inactiveProjects.length > 0) {
                                    if (tooltipText) tooltipText += '\n';
                                    tooltipText += 'Inaktiv: ' + inactiveProjects.map(p => p.name).join(', ');
                                }
                                if (!tooltipText) tooltipText = 'Keine Projekte verknüpft';

                                return (
                                    <span
                                        className="px-2 py-1 bg-cyan-500 text-white rounded text-xs cursor-help"
                                        title={tooltipText}
                                    >
                                        {count} {count === 1 ? 'Projekt' : 'Projekte'}
                                    </span>
                                );
                            }}
                        />
                        <Column
                            header="Status"
                            body={(template) => {
                                // System templates don't need review scores
                                if (template.is_system_template) {
                                    return (
                                        <span className="px-2 py-1 bg-green-500 text-white rounded text-xs">
                                            Aktiv
                                        </span>
                                    );
                                }

                                const isReviewer = userType === 'system' || userType === 'admin' || isInnerCore;
                                const score = template.review_score || 0;
                                const maxScore = 5;
                                const isApproved = template.visibility === 'store'
                                    ? template.is_store_approved
                                    : template.review_status === 'approved';

                                // For approved templates - show green approved badge
                                if (isApproved) {
                                    return (
                                        <span className="px-2 py-1 bg-green-500 text-white rounded text-xs">
                                            Freigegeben
                                        </span>
                                    );
                                }

                                // For reviewers, show score on non-approved templates
                                if (isReviewer) {
                                    return (
                                        <div className="flex flex-col gap-0.5">
                                            <span className="px-2 py-1 bg-yellow-500 text-white rounded text-xs">
                                                Prüfung
                                            </span>
                                            <span className="text-xs text-gray-400">{score}/{maxScore} Punkte</span>
                                        </div>
                                    );
                                }

                                // For non-reviewers, don't show pending templates (but this shouldn't happen due to filter)
                                return null;
                            }}
                        />
                        <Column
                            field="created_at"
                            header={t.databasemanagementpanel861}
                            body={(template) => new Date(template.created_at).toLocaleDateString('de-DE')}
                        />
                        <Column
                            header={t.applicationsmodal354}
                            body={(template) => {
                                // Check if already cloned
                                const isAlreadyCloned = myTemplates.some(t =>
                                    t.name === template.name && parseInt(String(t.creator_user_id)) === currentUserId
                                );

                                // Check if this is user's own template
                                const isOwnTemplate = parseInt(String(template.creator_user_id)) === currentUserId;

                                // Check if template is linked to any of user's projects
                                const hasLinkedProjects = (template.linked_project_ids?.length || 0) > 0;

                                return (
                                    <div className="flex gap-1">
                                        {/* Link button only for templates NOT created by current user */}
                                        {!isOwnTemplate && (
                                            <Button
                                                icon="pi pi-link"
                                                className="p-button-text p-button-success p-button-sm"
                                                onClick={() => handleOpenLinkModal(template)}
                                                tooltip="Mit Projekten verknüpfen"
                                            />
                                        )}
                                        {/* Toggle active button - only show if template is linked */}
                                        {hasLinkedProjects && (
                                            <Button
                                                icon="pi pi-eye-slash"
                                                className="p-button-text p-button-warning p-button-sm"
                                                onClick={() => handleToggleActive(template)}
                                                tooltip="Verknüpfungen verwalten"
                                            />
                                        )}
                                        <Button
                                            icon="pi pi-eye"
                                            className="p-button-text p-button-sm"
                                            onClick={() => handleView(template)}
                                            tooltip={t.publicprojectspanel378}
                                        />
                                        <Button
                                            icon="pi pi-copy"
                                            className={`p-button-text p-button-sm ${isAlreadyCloned ? 'p-button-secondary opacity-50' : 'p-button-info'}`}
                                            onClick={() => handleClone(template)}
                                            tooltip={isAlreadyCloned ? "Bereits gecloned" : "Clone"}
                                            disabled={isAlreadyCloned}
                                        />
                                    </div>
                                );
                            }}
                        />
                    </DataTable>
                </Card>

                {/* PURCHASED TEMPLATES TABLE */}
                {purchasedTemplates.length > 0 && (
                    <Card
                        title={
                            <div className="flex items-center gap-2">
                                <i className="pi pi-shopping-cart text-purple-500"></i>
                                <span>Gekaufte Templates</span>
                                <Tag value={purchasedTemplates.length.toString()} severity="info" className="ml-2" />
                            </div>
                        }
                        className="mb-4"
                    >
                        <DataTable
                            value={purchasedTemplates}
                            loading={purchasedLoading}
                            paginator
                            rows={10}
                            rowsPerPageOptions={[10, 25, 50]}
                            sortMode="multiple"
                            className="p-datatable-sm"
                            emptyMessage="Keine gekauften Templates gefunden"
                            paginatorTemplate={t.languagemanagementpanel317}
                            currentPageReportTemplate="{first} bis {last} von {totalRecords} Templates"
                        >
                            <Column field="name" header={t.registermodal236} sortable />
                            <Column
                                field="category"
                                header={t.templatesColumnCategory}
                                body={(template) => (
                                    <span className="px-2 py-1 bg-blue-500 text-white rounded text-xs">
                                        {template.category}
                                    </span>
                                )}
                            />
                            <Column
                                field="language"
                                header={t.cmsadminpanel245}
                                body={(template) => (
                                    <span className="px-2 py-1 bg-green-500 text-white rounded text-xs">
                                        {template.language}
                                    </span>
                                )}
                            />
                            <Column
                                header="Verkäufer"
                                body={(template) => (
                                    <span className="text-gray-300 text-sm">
                                        {template.seller_username || template.creator?.username || 'Unknown'}
                                    </span>
                                )}
                            />
                            <Column
                                header="Status"
                                body={() => (
                                    <Tag value="Gekauft" severity="success" icon="pi pi-check" />
                                )}
                            />
                            <Column
                                header={t.usercontroller56}
                                body={(template) => (
                                    <div className="flex gap-1">
                                        <Button
                                            icon="pi pi-eye"
                                            className="p-button-text p-button-sm"
                                            onClick={() => handleView(template)}
                                            tooltip="Ansehen"
                                        />
                                        <Button
                                            icon="pi pi-link"
                                            className="p-button-text p-button-sm p-button-success"
                                            onClick={() => handleOpenLinkModal(template)}
                                            tooltip="Projekt verknüpfen"
                                        />
                                        <Button
                                            icon="pi pi-copy"
                                            className="p-button-text p-button-sm p-button-info"
                                            onClick={() => handleClone(template)}
                                            tooltip="Clone & Anpassen"
                                        />
                                    </div>
                                )}
                            />
                        </DataTable>
                    </Card>
                )}
                </div>
            </div>

            {/* Create/Edit Modal */}
            <TemplateModal
                visible={modalVisible}
                onCancel={() => {
                    setModalVisible(false);
                    loadMyTemplates();
                    loadCommunityTemplates(); // Reload templates when modal is closed
                }}
                onSubmit={handleSubmit}
                onSave={handleSave}
                editingTemplate={editingTemplate}
                categories={categories}
                templateFiles={templateFiles}
                onCreateFile={handleCreateFile}
                onEditFile={handleEditFile}
                onDeleteFile={handleDeleteFile}
                fileTypes={fileTypes}
                userType={userType}
                templateVariables={templateVariables}
                onLoadVariables={loadTemplateVariables}
                onCreateVariable={handleCreateVariable}
                onEditVariable={handleEditVariable}
                onDeleteVariable={handleDeleteVariable}
            />

            {/* File Create/Edit Modal */}
            <FileModal
                visible={fileModalVisible}
                onCancel={() => setFileModalVisible(false)}
                onSubmit={handleFileSubmit}
                editingFile={editingFile}
                templateFiles={templateFiles}
                fileTypes={fileTypes}
                templateId={editingTemplate?.id}
            />

            {/* View Modal */}
            <Dialog
                header={`Template: ${viewingTemplate?.name}`}
                visible={viewModalVisible}
                onHide={() => setViewModalVisible(false)}
                footer={
                    <Button onClick={() => setViewModalVisible(false)}>
                        Schließen
                    </Button>
                }
                style={{ width: '800px' }}
                contentStyle={{
                    maxHeight: 'calc(100vh - 200px)',
                    overflowY: 'auto'
                }}
                modal
                closable
                draggable={true}
                resizable={true}
            >
                {viewingTemplate && (
                    <div className="space-y-4">
                        <div>
                            <strong>{t.templatemanagementpanel859}</strong> {viewingTemplate.description || t.schemaexportcontroller226}
                        </div>
                        <div>
                            <strong>Kategorie:</strong> <Tag value={viewingTemplate.category} severity="info" />
                        </div>
                        <div>
                            <strong>Sprache:</strong> <Tag value={viewingTemplate.language} severity="success" />
                        </div>
                        <div>
                            <strong>Tags:</strong>
                            <div className="flex flex-wrap gap-2 ml-2">
                                {viewingTemplate.tags?.map((tag, index) => (
                                    <Tag key={index} value={tag} severity="warning" />
                                ))}
                            </div>
                        </div>
                        <div>
                            <strong>Dateien ({viewingTemplate.files?.length || 0}):</strong>
                            {viewingTemplate.files && viewingTemplate.files.length > 0 ? (
                                <div className="mt-2 space-y-2">
                                    {viewingTemplate.files.map((file) => (
                                        <div key={file.id} className="border border-gray-600 bg-gray-800 p-3 rounded">
                                            <div className="flex justify-between items-center mb-2">
                                                <strong>{file.file_name}</strong>
                                                <Tag value={file.file_type} />
                                            </div>
                                            <pre className="text-xs bg-gray-800 text-gray-200 p-2 rounded overflow-x-auto">
                                                {file.file_content.substring(0, 500)}
                                                {file.file_content.length > 500 && '...'}
                                            </pre>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="mt-2 text-gray-500">Keine Dateien vorhanden</div>
                            )}
                        </div>
                    </div>
                )}
            </Dialog>

            {/* Clone Modal */}
            <Dialog
                header={`Template klonen: ${templateToClone?.name}`}
                visible={cloneModalVisible}
                onHide={() => setCloneModalVisible(false)}
                footer={
                    <>
                        <Button onClick={() => setCloneModalVisible(false)}>
                            Abbrechen
                        </Button>
                        <Button
                            onClick={handleCloneSubmit}
                            disabled={nameExists || !cloneName.trim() || nameCheckLoading}
                            loading={nameCheckLoading}
                            className="p-button-primary"
                            style={{
                                backgroundColor: (nameExists || !cloneName.trim() || nameCheckLoading) ? '#6b7280' : undefined,
                                borderColor: (nameExists || !cloneName.trim() || nameCheckLoading) ? '#6b7280' : undefined,
                                opacity: (nameExists || !cloneName.trim() || nameCheckLoading) ? 0.7 : 1
                            }}
                        >
                            Jetzt klonen
                        </Button>
                    </>
                }
                style={{ width: '500px' }}
                modal
                closable
                draggable={true}
                resizable={true}
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Neuer Template-Name
                        </label>
                        <InputText
                            value={cloneName}
                            onChange={handleCloneNameChange}
                            placeholder={t.templatemanagementpanel939}
                            className="w-full"
                            style={{ backgroundColor: '#374151', color: '#fff', border: '1px solid #4B5563' }}
                        />
                        {nameCheckLoading && (
                            <div className="text-sm text-blue-400 mt-1">
                                🔍 Prüfe Verfügbarkeit...
                            </div>
                        )}
                        {nameExists && (
                            <div className="text-sm text-red-400 mt-1">
                                ❌ Name darf nicht doppelt vergeben werden
                            </div>
                        )}
                        {!nameExists && cloneName.trim() && !nameCheckLoading && (
                            <div className="text-sm text-green-400 mt-1">
                                ✅ Name ist verfügbar
                            </div>
                        )}
                    </div>

                    {/* Hide visibility selector for purchased templates - they must be private */}
                    {!((templateToClone as any)?.is_purchased || templateToClone?.visibility === 'store') && (
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Sichtbarkeit
                            </label>
                            <select
                                value={cloneVisibility}
                                onChange={(e) => setCloneVisibility(e.target.value as 'public' | 'private')}
                                className="w-full p-2 border rounded"
                                style={{ backgroundColor: '#374151', color: '#fff', border: '1px solid #4B5563' }}
                            >
                                <option value="public">Public (für alle sichtbar)</option>
                                <option value="private">Private (nur für Sie)</option>
                            </select>
                        </div>
                    )}

                    {/* Show info for purchased templates */}
                    {((templateToClone as any)?.is_purchased || templateToClone?.visibility === 'store') && (
                        <div className="p-3 bg-blue-900/30 rounded-lg border border-blue-700">
                            <div className="flex items-center gap-2 text-blue-300">
                                <i className="pi pi-info-circle"></i>
                                <span className="text-sm">
                                    Gekaufte Templates werden als <strong>Private</strong> geklont.
                                </span>
                            </div>
                        </div>
                    )}

                    <div className="bg-gray-700 p-3 rounded text-sm">
                        <strong>Quelle:</strong> {templateToClone?.name}<br/>
                        <strong>Typ:</strong> {templateToClone?.is_system_template ? t.ultimatetemplatecontroller301 : templateToClone?.visibility}
                    </div>
                </div>
            </Dialog>

            {/* Variable Create/Edit Modal */}
            <VariableModal
                visible={variableModalVisible}
                onCancel={() => {
                    setVariableModalVisible(false);
                    setEditingVariable(null);
                }}
                onSubmit={handleVariableSubmit}
                editingVariable={editingVariable}
            />

            {/* Delete Template Confirmation Modal */}
            <Dialog
                header="Template löschen"
                visible={showDeleteModal}
                onHide={handleDeleteModalHide}
                style={{ width: '450px' }}
                modal
                closable
                draggable={true}
                resizable={true}
                className="p-dialog-custom"
            >
                <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                        <i className="pi pi-exclamation-triangle text-orange-500 text-2xl mt-1"></i>
                        <div>
                            <h3 className="text-xl font-bold text-gray-300 mb-2">
                                Permanentes Löschen
                            </h3>
                            <p className="text-sm text-gray-600 mb-2">
                                {templateToDelete && (
                                    <>
                                        Das Template <strong>{templateToDelete.name}</strong> wird permanent gelöscht.
                                    </>
                                )}
                            </p>
                            <p className="text-sm text-gray-600 mb-4">
                                Alle Dateien, Variablen und Konfigurationen werden unwiderruflich entfernt.
                            </p>

                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">
                                    Gib <strong>DELETE</strong> ein, um zu bestätigen:
                                </label>
                                <InputText
                                    value={deleteConfirmText}
                                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                                    placeholder="DELETE"
                                    className="w-full"
                                    disabled={deleting}
                                />
                                <small className="text-gray-500 mt-1 block">
                                    Du musst exakt DELETE (Großbuchstaben) eingeben
                                </small>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end space-x-2 pt-4 gap-2">
                        <Button
                            label="Abbrechen"
                            icon="pi pi-times"
                            onClick={handleDeleteModalHide}
                            className="p-button-text"
                            disabled={deleting}
                        />
                        <Button
                            label={deleting ? 'Lösche...' : 'Template löschen'}
                            icon={deleting ? "pi pi-spinner pi-spin" : "pi pi-trash"}
                            onClick={handleDeleteTemplate}
                            className="p-button-danger"
                            disabled={deleting || deleteConfirmText !== 'DELETE'}
                        />
                    </div>
                </div>
            </Dialog>

            {/* Link Template to Projects Modal */}
            <Dialog
                header={`Template verknüpfen: ${templateToLink?.name}`}
                visible={linkModalVisible}
                onHide={() => setLinkModalVisible(false)}
                footer={
                    <>
                        <Button
                            onClick={() => setLinkModalVisible(false)}
                            className="p-button-secondary"
                        >
                            Abbrechen
                        </Button>
                        <Button
                            onClick={handleApplyProjectLinks}
                            className="p-button-primary"
                            disabled={loadingProjects}
                        >
                            Anwenden
                        </Button>
                    </>
                }
                style={{ width: '600px' }}
                modal
                closable
                draggable={true}
                resizable={true}
            >
                {loadingProjects ? (
                    <div className="flex justify-center items-center py-8">
                        <i className="pi pi-spin pi-spinner text-4xl text-blue-500"></i>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {allProjects.length === 0 ? (
                            <div className="text-center text-gray-500 py-4">
                                Keine Projekte gefunden
                            </div>
                        ) : (
                            allProjects.map((project) => (
                                <div
                                    key={project.id}
                                    className="flex items-center justify-between p-3 border border-gray-600 rounded hover:bg-gray-700 cursor-pointer"
                                    onClick={() => handleToggleProjectLink(project.id)}
                                >
                                    <div className="flex items-center gap-3 flex-1">
                                        <input
                                            type="checkbox"
                                            checked={linkedProjectIds.includes(project.id)}
                                            onChange={() => handleToggleProjectLink(project.id)}
                                            className="w-4 h-4 cursor-pointer"
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                        <div>
                                            <div className="font-semibold text-white">{project.name}</div>
                                            {project.description && (
                                                <div className="text-sm text-gray-400">{project.description}</div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </Dialog>

            {/* Toggle Project Activation Modal */}
            <Dialog
                header={`Verknüpfungen verwalten: ${templateToToggle?.name}`}
                visible={toggleActiveModalVisible}
                onHide={() => setToggleActiveModalVisible(false)}
                footer={
                    <>
                        <Button
                            onClick={() => setToggleActiveModalVisible(false)}
                            className="p-button-secondary"
                        >
                            Abbrechen
                        </Button>
                        <Button
                            onClick={handleApplyActivationChanges}
                            className="p-button-primary"
                        >
                            Speichern
                        </Button>
                    </>
                }
                style={{ width: '600px' }}
                modal
                closable
                draggable={true}
                resizable={true}
            >
                <div className="space-y-2">
                    {(templateToToggle?.linked_projects?.length || 0) === 0 ? (
                        <div className="text-center text-gray-500 py-4">
                            Keine Projekte verknüpft
                        </div>
                    ) : (
                        templateToToggle?.linked_projects?.map((project) => (
                            <div
                                key={project.id}
                                className="flex items-center justify-between p-3 border border-gray-600 rounded hover:bg-gray-700 cursor-pointer"
                                onClick={() => handleToggleProjectActivation(project.id)}
                            >
                                <div className="flex items-center gap-3 flex-1">
                                    <input
                                        type="checkbox"
                                        checked={projectActivationStates[project.id] || false}
                                        onChange={() => handleToggleProjectActivation(project.id)}
                                        className="w-4 h-4 cursor-pointer"
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                    <div>
                                        <div className="font-semibold text-white">{project.name}</div>
                                        <div className="text-sm text-gray-400">
                                            {projectActivationStates[project.id] ? 'Aktiv' : 'Inaktiv'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </Dialog>

            {/* Store Settings Modal */}
            <Dialog
                header={`Store-Einstellungen: ${templateForStoreSettings?.name}`}
                visible={storeSettingsModalVisible}
                onHide={() => setStoreSettingsModalVisible(false)}
                style={{ width: '700px' }}
                modal
                closable
                draggable={true}
                resizable={true}
            >
                {/* Status Info */}
                <div className="p-3 rounded mb-4" style={{ backgroundColor: templateForStoreSettings?.is_store_approved ? '#065f46' : '#78350f' }}>
                    <div className="flex items-center gap-2">
                        <i className={`pi ${templateForStoreSettings?.is_store_approved ? 'pi-check-circle' : 'pi-clock'}`}></i>
                        <span>
                            {templateForStoreSettings?.is_store_approved
                                ? 'Freigegeben - Dein Template ist im Store sichtbar'
                                : 'Warten auf Freigabe - Sichtbar nach Admin-Approval oder 5+ Reviews'}
                        </span>
                    </div>
                </div>

                {/* Sales Stats */}
                {templateForStoreSettings?.sales_count !== undefined && templateForStoreSettings.sales_count > 0 && (
                    <div className="grid grid-cols-2 gap-4 p-3 rounded mb-4" style={{ backgroundColor: '#1f2937' }}>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-green-400">{templateForStoreSettings.sales_count}</div>
                            <div className="text-sm text-gray-400">Verkäufe</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-yellow-400">
                                {templateForStoreSettings.total_revenue?.toFixed(2) || '0.00'}
                            </div>
                            <div className="text-sm text-gray-400">Einnahmen (Gesamt)</div>
                        </div>
                    </div>
                )}

                <TabView activeIndex={storeSettingsTab} onTabChange={(e) => setStoreSettingsTab(e.index)}>
                    {/* Tab 1: Price Settings */}
                    <TabPanel header="Preis" leftIcon="pi pi-money-bill mr-2">
                        <div className="space-y-4">
                            {/* Price Type Selection */}
                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Zahlungsart
                                </label>
                                <div className="flex gap-4">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="priceType"
                                            checked={storePriceType === 'credits'}
                                            onChange={() => setStorePriceType('credits')}
                                            className="w-4 h-4"
                                        />
                                        <span>Credits</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="priceType"
                                            checked={storePriceType === 'euros'}
                                            onChange={() => setStorePriceType('euros')}
                                            className="w-4 h-4"
                                        />
                                        <span>EUR (via Stripe/PayPal)</span>
                                    </label>
                                </div>
                            </div>

                            {/* Price Input */}
                            {storePriceType === 'credits' ? (
                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        Preis in Credits (Minimum: 50)
                                    </label>
                                    <InputText
                                        type="number"
                                        value={storePriceCredits.toString()}
                                        onChange={(e) => setStorePriceCredits(parseInt(e.target.value) || 50)}
                                        min={50}
                                        className="w-full"
                                        style={{ backgroundColor: '#374151', color: '#fff', border: '1px solid #4B5563' }}
                                    />
                                    <small className="text-gray-400 mt-1 block">
                                        Du erhältst 80%: {Math.floor(storePriceCredits * 0.8)} Credits pro Verkauf
                                    </small>
                                </div>
                            ) : (
                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        Preis in EUR (Minimum: 1.00)
                                    </label>
                                    <InputText
                                        type="number"
                                        value={storePriceEuros.toString()}
                                        onChange={(e) => setStorePriceEuros(parseFloat(e.target.value) || 1.00)}
                                        min={1}
                                        step={0.01}
                                        className="w-full"
                                        style={{ backgroundColor: '#374151', color: '#fff', border: '1px solid #4B5563' }}
                                    />
                                    <small className="text-gray-400 mt-1 block">
                                        Du erhältst 80%: {(storePriceEuros * 0.8).toFixed(2)} EUR pro Verkauf
                                    </small>
                                </div>
                            )}

                            {/* Revenue Split Info */}
                            <div className="p-3 rounded text-sm" style={{ backgroundColor: '#1e3a5f' }}>
                                <i className="pi pi-info-circle mr-2"></i>
                                <strong>Erlösverteilung:</strong> 80% an dich, 20% Plattformgebühr
                            </div>

                            {/* Action Buttons */}
                            <div className="flex justify-end gap-2 pt-4">
                                <Button
                                    label="Abbrechen"
                                    icon="pi pi-times"
                                    onClick={() => setStoreSettingsModalVisible(false)}
                                    className="p-button-text"
                                />
                                <Button
                                    label={savingStoreSettings ? 'Speichere...' : 'Speichern'}
                                    icon={savingStoreSettings ? 'pi pi-spinner pi-spin' : 'pi pi-check'}
                                    onClick={handleSaveStoreSettings}
                                    className="p-button-success"
                                    disabled={savingStoreSettings}
                                />
                            </div>
                        </div>
                    </TabPanel>

                    {/* Tab 2: Media */}
                    <TabPanel header="Media" leftIcon="pi pi-images mr-2">
                        <div className="space-y-6">
                            {/* Logo Section */}
                            <div>
                                <h4 className="text-lg font-semibold mb-3 flex items-center gap-2">
                                    <i className="pi pi-image text-blue-400"></i>
                                    Logo
                                </h4>
                                <div className="flex items-start gap-4">
                                    {/* Logo Preview */}
                                    <div
                                        className="w-32 h-32 rounded-lg border-2 border-dashed flex items-center justify-center overflow-hidden"
                                        style={{ borderColor: '#4B5563', backgroundColor: '#1f2937' }}
                                    >
                                        {templateMedia.logo ? (
                                            <img
                                                src={`/api/media/${templateMedia.logo.id}/serve`}
                                                alt="Logo"
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="text-center text-gray-500">
                                                <i className="pi pi-image text-3xl mb-1"></i>
                                                <div className="text-xs">Kein Logo</div>
                                            </div>
                                        )}
                                    </div>
                                    {/* Logo Actions */}
                                    <div className="flex flex-col gap-2">
                                        <input
                                            ref={logoInputRef}
                                            type="file"
                                            accept="image/*"
                                            onChange={handleLogoUpload}
                                            className="hidden"
                                        />
                                        <Button
                                            label={uploadingLogo ? 'Hochladen...' : 'Logo hochladen'}
                                            icon={uploadingLogo ? 'pi pi-spinner pi-spin' : 'pi pi-upload'}
                                            onClick={() => logoInputRef.current?.click()}
                                            className="p-button-sm"
                                            disabled={uploadingLogo}
                                        />
                                        {templateMedia.logo && (
                                            <Button
                                                label="Löschen"
                                                icon="pi pi-trash"
                                                onClick={() => handleDeleteMedia(templateMedia.logo.id, 'logo')}
                                                className="p-button-sm p-button-danger p-button-outlined"
                                            />
                                        )}
                                        <small className="text-gray-400">Max. 2MB, wird auf 256x256 skaliert</small>
                                    </div>
                                </div>
                            </div>

                            {/* Images Section */}
                            <div>
                                <h4 className="text-lg font-semibold mb-3 flex items-center gap-2">
                                    <i className="pi pi-images text-green-400"></i>
                                    Screenshots / Bilder
                                </h4>
                                <input
                                    ref={imagesInputRef}
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={handleImagesUpload}
                                    className="hidden"
                                />
                                <Button
                                    label={uploadingImages ? 'Hochladen...' : 'Bilder hochladen'}
                                    icon={uploadingImages ? 'pi pi-spinner pi-spin' : 'pi pi-plus'}
                                    onClick={() => imagesInputRef.current?.click()}
                                    className="p-button-sm mb-3"
                                    disabled={uploadingImages}
                                />
                                <small className="text-gray-400 ml-2">Max. 5MB pro Bild, mehrere möglich</small>

                                {/* Images Gallery */}
                                {templateMedia.images.length > 0 ? (
                                    <div className="grid grid-cols-3 gap-3 mt-3">
                                        {templateMedia.images.map((image: any) => (
                                            <div key={image.id} className="relative group">
                                                <img
                                                    src={`/api/media/${image.id}/serve`}
                                                    alt={image.title || 'Screenshot'}
                                                    className="w-full h-24 object-cover rounded-lg border border-gray-600"
                                                />
                                                <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                                                    <Button
                                                        icon="pi pi-trash"
                                                        onClick={() => handleDeleteMedia(image.id, 'image')}
                                                        className="p-button-sm p-button-danger p-button-rounded"
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-4 text-center text-gray-500 border-2 border-dashed rounded-lg" style={{ borderColor: '#4B5563' }}>
                                        <i className="pi pi-images text-2xl mb-2"></i>
                                        <div className="text-sm">Noch keine Bilder hochgeladen</div>
                                    </div>
                                )}
                            </div>

                            {/* Videos Section */}
                            <div>
                                <h4 className="text-lg font-semibold mb-3 flex items-center gap-2">
                                    <i className="pi pi-youtube text-red-400"></i>
                                    Videos (YouTube / Vimeo)
                                </h4>

                                {/* Add Video Form */}
                                <div className="flex gap-2 mb-3">
                                    <InputText
                                        value={newVideoUrl}
                                        onChange={(e) => setNewVideoUrl(e.target.value)}
                                        placeholder="https://youtube.com/watch?v=... oder https://vimeo.com/..."
                                        className="flex-1"
                                        style={{ backgroundColor: '#374151', color: '#fff', border: '1px solid #4B5563' }}
                                    />
                                    <Button
                                        label={addingVideo ? '...' : 'Hinzufügen'}
                                        icon={addingVideo ? 'pi pi-spinner pi-spin' : 'pi pi-plus'}
                                        onClick={handleAddVideo}
                                        className="p-button-sm"
                                        disabled={addingVideo || !newVideoUrl.trim()}
                                    />
                                </div>
                                <InputText
                                    value={newVideoTitle}
                                    onChange={(e) => setNewVideoTitle(e.target.value)}
                                    placeholder="Video-Titel (optional)"
                                    className="w-full mb-3"
                                    style={{ backgroundColor: '#374151', color: '#fff', border: '1px solid #4B5563' }}
                                />

                                {/* Videos List */}
                                {templateMedia.videos.length > 0 ? (
                                    <div className="space-y-3">
                                        {templateMedia.videos.map((video: any) => (
                                            <div key={video.id} className="p-3 rounded-lg" style={{ backgroundColor: '#1f2937' }}>
                                                <div className="flex justify-between items-start mb-2">
                                                    <div>
                                                        <div className="font-medium">{video.title || 'Video'}</div>
                                                        <div className="text-xs text-gray-400 truncate max-w-md">{video.video_url}</div>
                                                    </div>
                                                    <Button
                                                        icon="pi pi-trash"
                                                        onClick={() => handleDeleteMedia(video.id, 'video')}
                                                        className="p-button-sm p-button-danger p-button-text"
                                                    />
                                                </div>
                                                {/* Video Embed Preview */}
                                                <div className="aspect-video w-full rounded overflow-hidden">
                                                    <iframe
                                                        src={getVideoEmbedUrl(video.video_url)}
                                                        className="w-full h-full"
                                                        frameBorder="0"
                                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                        allowFullScreen
                                                    ></iframe>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-4 text-center text-gray-500 border-2 border-dashed rounded-lg" style={{ borderColor: '#4B5563' }}>
                                        <i className="pi pi-video text-2xl mb-2"></i>
                                        <div className="text-sm">Noch keine Videos hinzugefügt</div>
                                        <div className="text-xs mt-1">YouTube und Vimeo Links werden als eingebettete Videos angezeigt</div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </TabPanel>
                </TabView>
            </Dialog>

            {/* ConfirmDialog for import overwrite confirmation */}
            <ConfirmDialog />

            {/* Template Import Wizard */}
            <TemplateImportWizardPanel
                visible={importWizardVisible}
                onClose={() => setImportWizardVisible(false)}
                onSuccess={(template) => {
                    toast.showSuccess('Template erfolgreich erstellt', `Template "${template.name}" wurde importiert.`);
                    loadMyTemplates();
                }}
            />
        </div>
    );
};

export default TemplateManagementPanel;