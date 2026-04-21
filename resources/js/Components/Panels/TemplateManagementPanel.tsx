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
import { Checkbox } from 'primereact/checkbox';
import { TabView, TabPanel } from 'primereact/tabview';
import { apiClient as api } from '@/lib/api';
import { useProject } from '@/contexts/ProjectContext';
import FileModal from './FileModal';
import TemplateModal from './TemplateModal';
import VariableModal from './VariableModal';
import TemplateImportWizardPanel from './TemplateImportWizardPanel';
import TemplatePrintModal from './TemplatePrintModal';
import { useTranslation, SupportedLanguage, getStoredLanguage, tpl} from '@/i18n';
import { useTheme } from '@/contexts/ThemeContext';

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
    full_name?: string;
    compatibility_tag?: string | null;
    generation_order?: number;
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
    is_include_only?: boolean;
    inject_target?: string | null;
    inject_tag?: string | null;
    language_override?: string | null;
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
    const { colors } = useTheme();

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
    const [showPrintModal, setShowPrintModal] = useState(false);
    const [printTemplateId, setPrintTemplateId] = useState<number | null>(null);
    const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
    const [viewingTemplate, setViewingTemplate] = useState<Template | null>(null);
    const [templateFiles, setTemplateFiles] = useState<TemplateFile[]>([]);
    const [fileModalVisible, setFileModalVisible] = useState(false);
    const [editingFile, setEditingFile] = useState<TemplateFile | null>(null);
    const [cloneModalVisible, setCloneModalVisible] = useState(false);
    const [templateToClone, setTemplateToClone] = useState<Template | null>(null);
    const [cloneName, setCloneName] = useState('');
    const [projectLanguagesForFiles, setProjectLanguagesForFiles] = useState<Array<{ code: string; name: string }>>([]);
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
        { label: t.templatemanagementpanel115, value: 'static_file', description: t.templatemanagementpanel198 },
        { label: t.templatemanagementpanel199, value: 'static_directory', description: t.templatemanagementpanel116 },
        { label: t.templatemanagementpanel200, value: 'project_file', description: t.templatemanagementpanel117 },
        { label: t.templatemanagementpanel118, value: 'db_table_file', description: t.templatemanagementpanel201 },
        { label: t.templatemanagementpanel204, value: 'project_file_languages', description: t.templatemanagementpanel119 },
        { label: t.templatemanagementpanel203, value: 'db_table_file_languages', description: t.templatemanagementpanel120 }
    ];

    useEffect(() => {
        loadMyTemplates();
        loadCommunityTemplates();
        loadPurchasedTemplates();
    }, [projectId]);

    // Load project languages for FileModal language_override dropdown
    useEffect(() => {
        const loadProjectLanguages = async () => {
            try {
                const currentProjectId = forceProjectId || selectedProject?.id;
                if (!currentProjectId) {
                    setProjectLanguagesForFiles([]);
                    return;
                }
                const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
                if (!token) return;

                const [projectRes, langRes] = await Promise.all([
                    fetch(`/api/projects/${currentProjectId}`, {
                        headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
                    }),
                    fetch('/api/active-languages', {
                        headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
                    }),
                ]);

                if (projectRes.ok && langRes.ok) {
                    const project = await projectRes.json();
                    const allLangs = await langRes.json();
                    const allLangsArray = allLangs.data || allLangs;
                    const enabledCodes = Array.isArray(project.enabled_languages)
                        ? project.enabled_languages
                        : (typeof project.enabled_languages === 'string'
                            ? JSON.parse(project.enabled_languages)
                            : []);
                    const filtered = (Array.isArray(allLangsArray) ? allLangsArray : [])
                        .filter((lang: any) => enabledCodes.includes(lang.code))
                        .map((lang: any) => ({ code: lang.code, name: lang.name }));
                    setProjectLanguagesForFiles(filtered);
                }
            } catch {
                // Silently fail - language override is optional
            }
        };
        loadProjectLanguages();
    }, [forceProjectId, selectedProject?.id]);

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
            updateTabTitle(tpl(t.templatemanagementpanel225, { name: forceProjectName }));
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
            const isSystemUser = userType === 'system';

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
            console.error(t.templatemanagementpanel303, error);
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
            const isReviewer = userType === 'system' || userType === 'review' || isInnerCore;

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
            console.error(t.templatemanagementpanel372, error);
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
            console.error(t.templatemanagementpanel397, error);
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
            toast.showError(t.templatemanagementpanel471+"\"DELETE\""+t.templatemanagementpanel471_2);
            return;
        }

        setDeleting(true);

        try {
            const response = await api.hardDeleteTemplate(templateToDelete.id);
            if (response.success) {
                toast.showSuccess(t.templatemanagementpanel480);
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

            toast.showSuccess(t.templatemanagementpanel534);
            setToggleActiveModalVisible(false);
            loadMyTemplates();
            loadCommunityTemplates();
        } catch (error: any) {
            console.error(t.templatemanagementpanel539, error);
            toast.showError(t.templatemanagementpanel540);
        }
    };

    // Unlock an expired template subscription (renew for 50 credits or make public)
    const handleUnlockExpiredTemplate = async (template: Template, makePublic: boolean = false) => {
        if (!template.subscription_data?.id && !makePublic) {
            toast.showError(t.templatemanagementpanel547);
            return;
        }

        setUnlockingTemplate(true);
        setTemplateToUnlock(template);

        try {
            const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
            if (!token) {
                throw new Error(t.templatemanagementpanel557);
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
                    throw new Error(data.error || data.message || t.templatemanagementpanel574);
                }

                toast.showSuccess(tpl(t.templatemanagementpanel577,{ name: template.name}));
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
                        toast.showError(`${t.templatemanagementpanel593}${data.required_credits}${t.templatemanagementpanel593_2}${data.current_credits}`);
                    } else {
                        throw new Error(data.error || data.message || t.templatemanagementpanel595);
                    }
                    return;
                }

                toast.showSuccess(tpl(t.templatemanagementpanel600,{name: template.name})+" "+tpl(t.templatemanagementpanel600_2,{tage: data.bonus_days || 0}));
            }

            // Dispatch credits changed event
            window.dispatchEvent(new CustomEvent('creditsChanged'));

            // Reload templates
            loadMyTemplates();
        } catch (error) {
            toast.showError(error instanceof Error ? error.message : t.templatemanagementpanel609);
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
        // Sanitize: only allow lowercase letters, numbers, and underscores
        const sanitized = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
        setCloneName(sanitized);

        // Debounce name check
        setTimeout(() => {
            checkNameExists(sanitized);
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
            toast.showError(errorMessage);
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
            console.error(t.templatemanagementpanel696, error);
            toast.showError(t.templatemanagementpanel697);
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
            toast.showSuccess(t.templatemanagementpanel719);
            setLinkModalVisible(false);
            loadMyTemplates();
            loadCommunityTemplates();
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || t.templatemanagementpanel724;
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
            toast.showError(t.templatemanagementpanel749);
            return;
        }
        if (storePriceType === 'euros' && storePriceEuros < 1.00) {
            toast.showError(t.templatemanagementpanel753);
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
            toast.showSuccess(t.templatemanagementpanel767);
            setStoreSettingsModalVisible(false);
            loadMyTemplates();
        } catch (error: any) {
            toast.showError(error.message || t.templatemanagementpanel771);
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
            console.error(t.templatemanagementpanel788, error);
            setTemplateMedia({ logo: null, images: [], videos: [] });
        }
    };

    const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!templateForStoreSettings || !event.target.files || event.target.files.length === 0) return;

        const file = event.target.files[0];
        if (!file.type.startsWith('image/')) {
            toast.showError(t.templatemanagementpanel798);
            return;
        }

        if (file.size > 2 * 1024 * 1024) {
            toast.showError(t.templatemanagementpanel803);
            return;
        }

        setUploadingLogo(true);
        try {
            const formData = new FormData();
            formData.append('logo', file);

            const response = await api.uploadFile(`/templates/${templateForStoreSettings.id}/media/logo`, formData);
            if (response.success) {
                toast.showSuccess(t.templatemanagementpanel814);
                await loadTemplateMedia(templateForStoreSettings.id);
            }
        } catch (error: any) {
            toast.showError(error.message || t.templatemanagementpanel818);
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
            toast.showError(t.templatemanagementpanel831);
            return;
        }

        const oversizedFiles = files.filter(f => f.size > 5 * 1024 * 1024);
        if (oversizedFiles.length > 0) {
            toast.showError(t.templatemanagementpanel837);
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
                toast.showSuccess(tpl(t.templatemanagementpanel850,{count: files.length}));
                await loadTemplateMedia(templateForStoreSettings.id);
            }
        } catch (error: any) {
            toast.showError(error.message || t.templatemanagementpanel854);
        } finally {
            setUploadingImages(false);
            if (imagesInputRef.current) imagesInputRef.current.value = '';
        }
    };

    const handleAddVideo = async () => {
        if (!templateForStoreSettings || !newVideoUrl.trim()) {
            toast.showError(t.templatemanagementpanel863);
            return;
        }

        // Validate YouTube/Vimeo URL
        const youtubePattern = /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/)|youtu\.be\/)/;
        const vimeoPattern = /^(https?:\/\/)?(www\.)?vimeo\.com\//;

        if (!youtubePattern.test(newVideoUrl) && !vimeoPattern.test(newVideoUrl)) {
            toast.showError(t.templatemanagementpanel872);
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
                toast.showSuccess(t.templatemanagementpanel886);
                setNewVideoUrl('');
                setNewVideoTitle('');
                await loadTemplateMedia(templateForStoreSettings.id);
            }
        } catch (error: any) {
            toast.showError(error.message || t.templatemanagementpanel892);
        } finally {
            setAddingVideo(false);
        }
    };

    const handleDeleteMedia = async (mediaId: number, mediaType: string) => {
        if (!templateForStoreSettings) return;

        confirmDialog({
            group: 'template-management',
            message: `${mediaType === 'logo' ? 'Logo' : mediaType === 'image' ? t.templatemanagementpanel902 : t.templatemanagementpanel902_2}$({t.templatemanagementpanel902})`,
            header: t.templatemanagementpanel903,
            icon: 'pi pi-exclamation-triangle',
            acceptClassName: 'p-button-danger',
            accept: async () => {
                try {
                    await api.request(`/templates/${templateForStoreSettings.id}/media/${mediaId}`, {
                        method: 'DELETE',
                    });
                    toast.showSuccess(t.templatemanagementpanel911);
                    await loadTemplateMedia(templateForStoreSettings.id);
                } catch (error: any) {
                    toast.showError(error.message || t.templatemanagementpanel914);
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
                compatibility_tag: values.compatibility_tag || null,
                generation_order: values.generation_order ?? 0,
                protected_files: values.protected_files || [],
                install_script: values.install_script || [],
                update_script: values.update_script || [],
                files: templateFiles.map((file, index) => ({
                    file_name: file.file_name,
                    file_content: file.file_content,
                    file_type: file.file_type,
                    file_order: index,
                    output_path: file.output_path || '/',
                    content_type: file.content_type || 'text',
                    zip_filename: file.zip_filename || null,
                    form_window_type: file.form_window_type || 0,
                    is_include_only: file.is_include_only || false,
                    inject_target: file.inject_target || null,
                    inject_tag: file.inject_tag || null,
                }))
            };

            let response;
            if (editingTemplate) {
                response = await api.updateTemplate(editingTemplate.id, templateData);
            } else {
                response = await api.createTemplate(templateData);
            }

            if (response.success) {
                toast.showSuccess(`${t.templatemanagementpanel966}${editingTemplate ? t.templatemanagementpanel966_2 : t.templatemanagementpanel966_3}`);

                // 🛡️ Check for security scanner warning
                if (response.template?.auto_set_to_private) {
                    setTimeout(() => {
                        let warningMessage = response.template.warning || t.templatemanagementpanel971;
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
            const errorMessage = error.response?.data?.error || error.response?.data?.message || `${t.templatemanagementpanel988}${editingTemplate ? t.applicationsmodal313 : t.teammodal240}${t.templatemanagementpanel988_2}`;
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
                compatibility_tag: values.compatibility_tag || null,
                generation_order: values.generation_order ?? 0,
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
                        let warningMessage = response.template.warning || t.templatemanagementpanel1020;
                        if (response.template.detected_issues) {
                            warningMessage += '\n\n' + t.templatemanagementpanel1022 + response.template.detected_issues;
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
                        group: 'template-management',
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
                        acceptLabel: t.templatemanagementpanel1125,
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

    const handleArchiveImport = async (file: File, overwrite = false) => {
        try {
            const formData = new FormData();
            formData.append('template_file', file);
            formData.append('overwrite_existing', overwrite ? 'true' : 'false');

            const data = await api.uploadFile('/templates/import', formData);

            if (data.success) {
                toast.showSuccess(data.message || t.templatemanagementpanel1158);
                loadMyTemplates();
                loadCommunityTemplates();
            } else {
                toast.showError(data.error || t.templatemanagementpanel1199);
            }
        } catch (error: any) {
            if (error.response?.status === 409) {
                confirmDialog({
                    group: 'template-management',
                    message: t.templatemanagementpanel1164,
                    header: t.templatemanagementpanel1165,
                    icon: 'pi pi-exclamation-triangle',
                    accept: () => handleArchiveImport(file, true),
                    acceptLabel: t.templatemanagementpanel1194,
                    rejectLabel: t.templatemanagementpanel1195,
                    acceptClassName: 'p-button-danger'
                });
            } else {
                const errorMsg = error.response?.data?.error || error.message || t.templatemanagementpanel1199;
                toast.showError(t.templatemanagementpanel1202 + errorMsg);
            }
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
                    throw new Error(`${t.templatemanagementpanel1220}${format.toUpperCase()}`);
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
                toast.showSuccess(`${t.templatemanagementpanel1232}${format.toUpperCase()}${t.templatemanagementpanel1232_2}`);
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
                compatibility_tag: editingTemplate.compatibility_tag || null,
                generation_order: editingTemplate.generation_order ?? 0,
                files: newFiles.map(f => ({
                    file_name: f.file_name,
                    file_content: f.file_content,
                    file_type: f.file_type,
                    file_order: f.file_order,
                    output_path: f.output_path || '/',
                    content_type: f.content_type || 'text',
                    zip_filename: f.zip_filename || null,
                    form_window_type: f.form_window_type || 0,
                    is_include_only: f.is_include_only || false,
                    inject_target: f.inject_target || null,
                    inject_tag: f.inject_tag || null,
                }))
            };

            const response = await api.updateTemplate(editingTemplate.id, templateData);

            if (response.success) {
                // Update local state
                setTemplateFiles(newFiles);
                toast.showSuccess(`${t.templatemanagementpanel1299}"${fileToDelete.file_name}"${t.templatemanagementpanel1299_2}`);

                // 🛡️ Check for security scanner warning
                if (response.template?.auto_set_to_private) {
                    setTimeout(() => {
                        let warningMessage = response.template.warning || t.templatemanagementpanel1304;
                        if (response.template.detected_issues) {
                            warningMessage += '\n\n'+t.templatemanagementpanel1306 + response.template.detected_issues;
                        }
                        toast.showWarn(warningMessage);
                    }, 800); // 800ms delay
                }
            } else {
                toast.showError(t.templatefilemanager120);
            }
        } catch (error: any) {
            // File delete error
            toast.showError(t.templatemanagementpanel1316 + (error.response?.data?.message || error.message));
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
            } catch (error: any) {
                toast.showError(t.templatemanagementpanel1350 + error.message);
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
            file_order: values.file_order ?? 0,
            output_path: values.output_path || '/',
            content_type: contentType,
            zip_filename: zipFilename,
            managed_files: managedFilesList, // 🆕 List of individual files
            form_window_type: values.form_window_type || 0,
            is_include_only: values.is_include_only || false,
            inject_target: values.inject_target || null,
            inject_tag: values.inject_tag || null,
            language_override: values.language_override || null,
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
                compatibility_tag: editingTemplate.compatibility_tag || null,
                generation_order: editingTemplate.generation_order ?? 0,
                files: editingFile
                    ? templateFiles.map(f =>
                        f.id === editingFile.id
                            ? { ...fileData }
                            : {
                                file_name: f.file_name,
                                file_content: f.file_content,
                                file_type: f.file_type,
                                file_order: f.file_order,
                                output_path: f.output_path || '/',
                                content_type: f.content_type || 'text',
                                zip_filename: f.zip_filename || null,
                                form_window_type: f.form_window_type || 0,
                                is_include_only: f.is_include_only || false,
                                inject_target: f.inject_target || null,
                                inject_tag: f.inject_tag || null,
                                language_override: f.language_override || null,
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
                        form_window_type: f.form_window_type || 0,
                        is_include_only: f.is_include_only || false,
                        inject_target: f.inject_target || null,
                        inject_tag: f.inject_tag || null,
                        language_override: f.language_override || null,
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

                toast.showSuccess(`${t.templatemanagementpanel1423}${editingFile ? t.templatemanagementpanel1423_2 : t.templatemanagementpanel595}`);

                // 🛡️ Check for security scanner warning
                if (response.template?.auto_set_to_private) {
                    setTimeout(() => {
                        let warningMessage = response.template.warning || t.templatemanagementpanel1428;
                        if (response.template.detected_issues) {
                            warningMessage += '\n\n'+t.templatemanagementpanel1430 + response.template.detected_issues;
                        }
                        toast.showWarn(warningMessage);
                    }, 800); // 800ms delay
                }
            } else {
                toast.showError(t.templatemanagementpanel597);
            }
        } catch (error: any) {
            // File save error
            toast.showError(t.templatemanagementpanel1440 + (error.response?.data?.message || error.message));
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
                console.error(t.templatemanagementpanel1461, response.error);
                setTemplateVariables([]);
            }
        } catch (error: any) {
            console.error(t.templatemanagementpanel1465, error);
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
            toast.showError(t.templatemanagementpanel1482);
            return;
        }

        try {
            const response = await api.deleteTemplateVariable(editingTemplate.id, variableId);
            if (response.success) {
                toast.showSuccess(t.templatemanagementpanel1489);
                loadTemplateVariables();
            } else {
                toast.showError(response.error || t.templatemanagementpanel1492);
            }
        } catch (_error: any) {
            toast.showError(t.templatemanagementpanel1495);
        }
    };

    const handleVariableSubmit = async (values: any) => {
        if (!editingTemplate?.id) {
            toast.showError(t.templatemanagementpanel1501);
            return;
        }

        try {
            let response;
            if (editingVariable?.id) {
                // Update existing variable
                response = await api.updateTemplateVariable(editingTemplate.id, editingVariable.id, values);
                if (response.success) {
                    toast.showSuccess(t.templatemanagementpanel1511);
                } else {
                    toast.showError(response.error || t.templatemanagementpanel1513);
                    return;
                }
            } else {
                // Create new variable
                response = await api.createTemplateVariable(editingTemplate.id, values);
                if (response.success) {
                    toast.showSuccess(t.templatemanagementpanel1520);
                } else {
                    toast.showError(response.error || t.templatemanagementpanel1522);
                    return;
                }
            }

            setVariableModalVisible(false);
            setEditingVariable(null);
            loadTemplateVariables();
        } catch (_error: any) {
            toast.showError(t.templatemanagementpanel1531);
        }
    };


    // Get unique languages from both tables
    const uniqueMyLanguages = Array.from(new Set(myTemplates.map(t => t.language).filter(Boolean)));
    const uniqueCommunityLanguages = Array.from(new Set(communityTemplates.map(t => t.language).filter(Boolean)));

    return (
        <div className="template-management-panel flex flex-col h-full" style={{ backgroundColor: colors.bgPrimary, color: colors.textPrimary }}>
            {/* Header - Fixed at top */}
            <div className="flex-shrink-0 p-4 pb-2">
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold" style={{ color: colors.textPrimary }}>{t.panelsewnavigationpanel188}</h2>
                    <div className="flex gap-2">
                        <Button
                            icon="pi pi-plus"
                            label={t.templatemanagementpanel618}
                            onClick={handleCreate}
                            className="p-button-primary"
                        />
                        <Button
                            icon="pi pi-box"
                            label={t.templatemanagementpanel1555}
                            onClick={() => setImportWizardVisible(true)}
                            className="p-button-success"
                            tooltip={t.templatemanagementpanel1558}
                            tooltipOptions={{ position: 'bottom' }}
                        />
                        <Button
                            icon="pi pi-upload"
                            label={t.schematranslationpanel762}
                            onClick={() => {
                                document.getElementById('template-upload')?.click();
                            }}
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
                <Card title={t.templatemanagementpanel1589} className="mb-4">
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex gap-2">
                            {/* Type Filter - show 'system' option only for system/admin/inner_core users */}
                            <Dropdown
                                value={myTypeFilter}
                                options={
                                    userType === 'system' || isInnerCore
                                        ? [
                                            { label: t.templatemanagementpanel1598, value: 'all' },
                                            { label: t.templatemanagementpanel1599, value: 'private' },
                                            { label: t.templatemanagementpanel1600, value: 'public' },
                                            { label: t.templatemanagementpanel1601, value: 'system' }
                                        ]
                                        : [
                                            { label: t.templatemanagementpanel1604, value: 'all' },
                                            { label: t.templatemanagementpanel1605, value: 'private' },
                                            { label: t.templatemanagementpanel1606, value: 'public' },
                                            { label: t.templatemanagementpanel1607, value: 'store' }
                                        ]
                                }
                                onChange={(e) => setMyTypeFilter(e.value)}
                                placeholder={t.templatemanagementpanel1611}
                                className="w-32"
                            />
                            <Dropdown
                                value={myLanguageFilter}
                                options={[{ label: t.templatemanagementpanel1616, value: 'all' }, ...uniqueMyLanguages.map(l => ({ label: l, value: l }))]}
                                onChange={(e) => setMyLanguageFilter(e.value)}
                                placeholder={t.templatemanagementpanel1618}
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
                        currentPageReportTemplate={t.templatemanagementpanel1647}
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
                                            {t.templatemanagementpanel1697}
                                        </span>
                                    );
                                }
                                const visibilityConfig: Record<string, { bg: string; label: string }> = {
                                    'public': { bg: 'bg-blue-500', label: t.databasemanagementpanel772 },
                                    'private': { bg: 'bg-red-500', label: t.databasemanagementpanel771 },
                                    'store': { bg: 'bg-purple-500', label: t.templatemanagementpanel1704 }
                                };
                                const config = visibilityConfig[template.visibility] || visibilityConfig['public'];
                                return (
                                    <span className={`px-2 py-1 rounded text-xs ${config.bg} text-white`}>
                                        {config.label}
                                        {template.visibility === 'store' && !template.is_store_approved && (
                                            <i className="pi pi-clock ml-1 text-xs" title={t.templatemanagementpanel1711}></i>
                                        )}
                                    </span>
                                );
                            }}
                        />
                        <Column
                            field="file_count"
                            header={t.templatemanagementpanel706}
                            body={(template) => `${template.file_count}${t.templatemanagementpanel1720}`}
                        />
                        <Column
                            header={t.templatemanagementpanel1723}
                            body={(template: Template) => {
                                const count = template.linked_project_ids?.length || 0;
                                const activeProjects = template.linked_projects?.filter(p => p.is_active) || [];
                                const inactiveProjects = template.linked_projects?.filter(p => !p.is_active) || [];

                                let tooltipText = '';
                                if (activeProjects.length > 0) {
                                    tooltipText += t.templatemanagementpanel1731 + activeProjects.map(p => p.name).join(', ');
                                }
                                if (inactiveProjects.length > 0) {
                                    if (tooltipText) tooltipText += '\n';
                                    tooltipText += t.templatemanagementpanel1735 + inactiveProjects.map(p => p.name).join(', ');
                                }
                                if (!tooltipText) tooltipText = t.templatemanagementpanel1737;

                                return (
                                    <span
                                        className="px-2 py-1 bg-cyan-500 text-white rounded text-xs cursor-help"
                                        title={tooltipText}
                                    >
                                        {count} {count === 1 ? t.templatemanagementpanel1744 : t.templatemanagementpanel1744_2}
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
                                            <Tag value={t.templatemanagementpanel1758} severity="danger" />
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
                                            <Tag value={`${template.subscription_data.days_remaining}${t.templatemanagementpanel1769}`} severity="warning" />
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
                            body={(template) => new Date(template.created_at).toLocaleDateString(currentLanguage)}
                        />
                        <Column
                            header={t.applicationsmodal354}
                            body={(template) => {
                                const isOwner = parseInt(template.creator_user_id) === currentUserId;

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
                                                label={t.templatemanagementpanel1804}
                                                className="p-button-rounded p-button-sm"
                                                style={{ backgroundColor: '#2563eb', borderColor: '#2563eb', color: 'white' }}
                                                tooltip={t.templatemanagementpanel1807}
                                                onClick={() => handleUnlockExpiredTemplate(template, false)}
                                                disabled={unlockingTemplate}
                                            />
                                            <Button
                                                icon="pi pi-globe"
                                                className="p-button-rounded p-button-sm"
                                                style={{ backgroundColor: '#059669', borderColor: '#059669', color: 'white' }}
                                                tooltip={t.templatemanagementpanel1815}
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
                                            tooltip={t.templatemanagementpanel1829}
                                        />
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
                                                        <button class="export-json w-full px-4 py-2 text-left hover:bg-gray-600 text-white">${t.templatemanagementpanel1856}</button>
                                                        <button class="export-zip w-full px-4 py-2 text-left hover:bg-gray-600 text-white">${t.templatemanagementpanel1857}</button>
                                                        <button class="export-tar-gz w-full px-4 py-2 text-left hover:bg-gray-600 text-white">${t.templatemanagementpanel1858}</button>
                                                        <button class="export-tar-xz w-full px-4 py-2 text-left hover:bg-gray-600 text-white">${t.templatemanagementpanel1859}</button>
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
                                            tooltip={t.templatemanagementpanel1894}
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
                                                tooltip={t.templatemanagementpanel1908}
                                            />
                                        )}
                                        <Button
                                            icon="pi pi-print"
                                            className="p-button-text p-button-sm"
                                            style={{ color: '#3b82f6' }}
                                            onClick={() => { setPrintTemplateId(template.id); setShowPrintModal(true); }}
                                            tooltip="Print"
                                        />
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
                <Card title={t.templatemanagementpanel1929} className="mb-4">
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex gap-2">
                            <Dropdown
                                value={communityTypeFilter}
                                options={[
                                    { label: t.templatemanagementpanel1935, value: 'all' },
                                    { label: t.templatemanagementpanel1936, value: 'system' },
                                    { label: t.templatemanagementpanel1937_2, value: 'public' },
                                    { label: t.templatemanagementpanel1938, value: 'store' }
                                ]}
                                onChange={(e) => setCommunityTypeFilter(e.value)}
                                placeholder={t.templatemanagementpanel1941}
                                className="w-32"
                            />
                            <Dropdown
                                value={communityLanguageFilter}
                                options={[{ label: t.templatemanagementpanel1946, value: 'all' }, ...uniqueCommunityLanguages.map(l => ({ label: l, value: l }))]}
                                onChange={(e) => setCommunityLanguageFilter(e.value)}
                                placeholder={t.templatemanagementpanel1948}
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
                        currentPageReportTemplate={t.templatemanagementpanel1977}
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
                                            ? `${template.price_credits}${t.templatemanagementpanel2012}`
                                            : t.templatemanagementpanel2013;
                                    return (
                                        <div className="flex flex-col gap-0.5">
                                            <span className="px-2 py-1 bg-orange-500 text-white rounded text-xs">
                                                {t.templatemanagementpanel2017}
                                            </span>
                                            <span className="text-xs" style={{ color: colors.textMuted }}>{priceText}</span>
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
                            body={(template) => `${template.file_count}${t.templatemanagementpanel2033}`}
                        />
                        <Column
                            header={t.templatemanagementpanel2036}
                            body={(template: Template) => {
                                const count = template.linked_project_ids?.length || 0;
                                const activeProjects = template.linked_projects?.filter(p => p.is_active) || [];
                                const inactiveProjects = template.linked_projects?.filter(p => !p.is_active) || [];

                                let tooltipText = '';
                                if (activeProjects.length > 0) {
                                    tooltipText += t.templatemanagementpanel2044 + activeProjects.map(p => p.name).join(', ');
                                }
                                if (inactiveProjects.length > 0) {
                                    if (tooltipText) tooltipText += '\n';
                                    tooltipText += t.templatemanagementpanel2048 + inactiveProjects.map(p => p.name).join(', ');
                                }
                                if (!tooltipText) tooltipText = t.templatemanagementpanel2050;

                                return (
                                    <span
                                        className="px-2 py-1 bg-cyan-500 text-white rounded text-xs cursor-help"
                                        title={tooltipText}
                                    >
                                        {count} {count === 1 ? t.templatemanagementpanel2057 : t.templatemanagementpanel2057_2}
                                    </span>
                                );
                            }}
                        />
                        <Column
                            header={t.templatemanagementpanel2063}
                            body={(template) => {
                                // System templates don't need review scores
                                if (template.is_system_template) {
                                    return (
                                        <span className="px-2 py-1 bg-green-500 text-white rounded text-xs">
                                            {t.templatemanagementpanel2069}
                                        </span>
                                    );
                                }

                                const isReviewer = userType === 'system' || isInnerCore;
                                const score = template.review_score || 0;
                                const maxScore = 5;
                                const isApproved = template.visibility === 'store'
                                    ? template.is_store_approved
                                    : template.review_status === 'approved';

                                // For approved templates - show green approved badge
                                if (isApproved) {
                                    return (
                                        <span className="px-2 py-1 bg-green-500 text-white rounded text-xs">
                                            {t.templatemanagementpanel2085}
                                        </span>
                                    );
                                }

                                // For reviewers, show score on non-approved templates
                                if (isReviewer) {
                                    return (
                                        <div className="flex flex-col gap-0.5">
                                            <span className="px-2 py-1 bg-yellow-500 text-white rounded text-xs">
                                                {t.templatemanagementpanel2095}
                                            </span>
                                            <span className="text-xs" style={{ color: colors.textMuted }}>{score}/{maxScore} Punkte</span>
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
                            body={(template) => new Date(template.created_at).toLocaleDateString(currentLanguage)}
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
                                                tooltip={t.templatemanagementpanel2133}
                                            />
                                        )}
                                        {/* Toggle active button - only show if template is linked */}
                                        {hasLinkedProjects && (
                                            <Button
                                                icon="pi pi-eye-slash"
                                                className="p-button-text p-button-warning p-button-sm"
                                                onClick={() => handleToggleActive(template)}
                                                tooltip={t.templatemanagementpanel2142}
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
                                            tooltip={isAlreadyCloned ? t.templatemanagementpanel2155 : t.templatemanagementpanel2155_2}
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
                                <span>{t.templatemanagementpanel2171}</span>
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
                            emptyMessage={t.templatemanagementpanel2185}
                            paginatorTemplate={t.languagemanagementpanel317}
                            currentPageReportTemplate={t.templatemanagementpanel2187}
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
                                header={t.templatemanagementpanel2209}
                                body={(template) => (
                                    <span className="text-sm" style={{ color: colors.textSecondary }}>
                                        {template.seller_username || template.creator?.username || t.templatemanagementpanel2212}
                                    </span>
                                )}
                            />
                            <Column
                                header={t.templatemanagementpanel2217}
                                body={() => (
                                    <Tag value={t.templatemanagementpanel2219} severity="success" icon="pi pi-check" />
                                )}
                            />
                            <Column
                                header={t.templatemanagementpanel747}
                                body={(template) => (
                                    <div className="flex gap-1">
                                        <Button
                                            icon="pi pi-eye"
                                            className="p-button-text p-button-sm"
                                            onClick={() => handleView(template)}
                                            tooltip={t.templatemanagementpanel2230}
                                        />
                                        <Button
                                            icon="pi pi-link"
                                            className="p-button-text p-button-sm p-button-success"
                                            onClick={() => handleOpenLinkModal(template)}
                                            tooltip={t.templatemanagementpanel2236}
                                        />
                                        <Button
                                            icon="pi pi-copy"
                                            className="p-button-text p-button-sm p-button-info"
                                            onClick={() => handleClone(template)}
                                            tooltip={t.templatemanagementpanel2242}
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
                onFilesChange={setTemplateFiles}
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
                projectLanguages={projectLanguagesForFiles}
            />

            {/* View Modal */}
            <Dialog
                header={`Template: ${viewingTemplate?.name}`}
                visible={viewModalVisible}
                onHide={() => setViewModalVisible(false)}
                footer={
                    <Button onClick={() => setViewModalVisible(false)}>
                        {t.templatemanagementpanel2296}
                    </Button>
                }
                style={{ width: '800px' }}
                contentStyle={{
                    maxHeight: 'calc(100vh - 200px)',
                    overflowY: 'auto',
                    backgroundColor: colors.bgPrimary,
                    color: colors.textPrimary
                }}
                headerStyle={{ backgroundColor: colors.dialogHeader, color: colors.textPrimary }}
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
                            <strong>{t.templatemanagementpanel2318}</strong> <Tag value={viewingTemplate.category} severity="info" />
                        </div>
                        <div>
                            <strong>{t.templatemanagementpanel2321}</strong> <Tag value={viewingTemplate.language} severity="success" />
                        </div>
                        <div>
                            <strong>{t.templatemanagementpanel2324}</strong>
                            <div className="flex flex-wrap gap-2 ml-2">
                                {viewingTemplate.tags?.map((tag, index) => (
                                    <Tag key={index} value={tag} severity="warning" />
                                ))}
                            </div>
                        </div>
                        <div>
                            <strong>{t.templatemanagementpanel2332}({viewingTemplate.files?.length || 0}):</strong>
                            {viewingTemplate.files && viewingTemplate.files.length > 0 ? (
                                <div className="mt-2 space-y-2">
                                    {viewingTemplate.files.map((file) => (
                                        <div key={file.id} className="p-3 rounded" style={{ border: `1px solid ${colors.borderPrimary}`, backgroundColor: colors.bgSecondary }}>
                                            <div className="flex justify-between items-center mb-2">
                                                <strong style={{ color: colors.textPrimary }}>{file.file_name}</strong>
                                                <Tag value={file.file_type} />
                                            </div>
                                            <pre className="text-xs p-2 rounded overflow-x-auto" style={{ backgroundColor: colors.bgTertiary, color: colors.textSecondary }}>
                                                {file.file_content.substring(0, 500)}
                                                {file.file_content.length > 500 && '...'}
                                            </pre>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="mt-2" style={{ color: colors.textMuted }}>{t.templatemanagementpanel2349}</div>
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
                            {t.templatemanagementpanel2364}
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
                            {t.templatemanagementpanel2377}
                        </Button>
                    </>
                }
                style={{ width: '500px' }}
                contentStyle={{ backgroundColor: colors.bgPrimary, color: colors.textPrimary }}
                headerStyle={{ backgroundColor: colors.dialogHeader, color: colors.textPrimary }}
                modal
                closable
                draggable={true}
                resizable={true}
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
                            {t.templatemanagementpanel2392}
                        </label>
                        <InputText
                            value={cloneName}
                            onChange={handleCloneNameChange}
                            placeholder={t.templatemanagementpanel939}
                            className="w-full"
                            style={{ backgroundColor: colors.bgSecondary, color: colors.textPrimary, border: `1px solid ${colors.borderPrimary}` }}
                        />
                        {nameCheckLoading && (
                            <div className="text-sm mt-1" style={{ color: colors.accent }}>
                                {t.templatemanagementpanel2403}
                            </div>
                        )}
                        {nameExists && (
                            <div className="text-sm mt-1" style={{ color: colors.errorText }}>
                                {t.templatemanagementpanel2408}
                            </div>
                        )}
                        {!nameExists && cloneName.trim() && !nameCheckLoading && (
                            <div className="text-sm mt-1" style={{ color: colors.successText }}>
                                {t.templatemanagementpanel2413}
                            </div>
                        )}
                    </div>

                    {/* Hide visibility selector for purchased templates - they must be private */}
                    {!((templateToClone as any)?.is_purchased || templateToClone?.visibility === 'store') && (
                        <div>
                            <label className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
                                {t.templatemanagementpanel2422}
                            </label>
                            <select
                                value={cloneVisibility}
                                onChange={(e) => setCloneVisibility(e.target.value as 'public' | 'private')}
                                className="w-full p-2 border rounded"
                                style={{ backgroundColor: colors.bgSecondary, color: colors.textPrimary, border: `1px solid ${colors.borderPrimary}` }}
                            >
                                <option value="public">{t.templatemanagementpanel2430}</option>
                                <option value="private">{t.templatemanagementpanel2431}</option>
                            </select>
                        </div>
                    )}

                    {/* Show info for purchased templates */}
                    {((templateToClone as any)?.is_purchased || templateToClone?.visibility === 'store') && (
                        <div className="p-3 rounded-lg" style={{ backgroundColor: 'rgba(37, 99, 235, 0.2)', border: `1px solid ${colors.accent}` }}>
                            <div className="flex items-center gap-2" style={{ color: colors.accent }}>
                                <i className="pi pi-info-circle"></i>
                                <span className="text-sm">
                                    {t.templatemanagementpanel2442}<strong>Private</strong>{t.templatemanagementpanel2442_2}
                                </span>
                            </div>
                        </div>
                    )}

                    <div className="p-3 rounded text-sm" style={{ backgroundColor: colors.bgSecondary }}>
                        <strong style={{ color: colors.textSecondary }}>{t.templatemanagementpanel2449}</strong> <span style={{ color: colors.textPrimary }}>{templateToClone?.name}</span><br/>
                        <strong style={{ color: colors.textSecondary }}>{t.templatemanagementpanel2450}</strong> <span style={{ color: colors.textPrimary }}>{templateToClone?.is_system_template ? t.ultimatetemplatecontroller301 : templateToClone?.visibility}</span>
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
                header={t.templatemanagementpanel2468}
                visible={showDeleteModal}
                onHide={handleDeleteModalHide}
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
                    <div className="flex items-start space-x-3">
                        <i className="pi pi-exclamation-triangle text-2xl mt-1" style={{ color: colors.warningText }}></i>
                        <div>
                            <h3 className="text-xl font-bold mb-2" style={{ color: colors.textPrimary }}>
                                {t.templatemanagementpanel2485}
                            </h3>
                            <p className="text-sm mb-2" style={{ color: colors.textSecondary }}>
                                {templateToDelete && (
                                    <>
                                        {t.templatemanagementpanel2490}<strong style={{ color: colors.textPrimary }}>{templateToDelete.name}</strong>{t.templatemanagementpanel2490_2}
                                    </>
                                )}
                            </p>
                            <p className="text-sm mb-4" style={{ color: colors.textSecondary }}>
                                {t.templatemanagementpanel2495}
                            </p>

                            <div>
                                <label className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
                                    {t.templatemanagementpanel2500}<strong style={{ color: colors.textPrimary }}>DELETE</strong>{t.templatemanagementpanel2500_2}
                                </label>
                                <InputText
                                    value={deleteConfirmText}
                                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                                    placeholder="DELETE"
                                    className="w-full"
                                    disabled={deleting}
                                    style={{ backgroundColor: colors.bgSecondary, color: colors.textPrimary, borderColor: colors.borderPrimary }}
                                />
                                <small className="mt-1 block" style={{ color: colors.textMuted }}>
                                    {t.templatemanagementpanel2511}"DELETE"{t.templatemanagementpanel2511_2}
                                </small>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end space-x-2 pt-4 gap-2">
                        <Button
                            label={t.templatemanagementpanel2519}
                            icon="pi pi-times"
                            onClick={handleDeleteModalHide}
                            className="p-button-text"
                            disabled={deleting}
                        />
                        <Button
                            label={deleting ? t.templatemanagementpanel2526 : t.templatemanagementpanel2526_2}
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
                header={`${t.templatemanagementpanel2538}${templateToLink?.name}`}
                visible={linkModalVisible}
                onHide={() => setLinkModalVisible(false)}
                footer={
                    <>
                        <Button
                            onClick={() => setLinkModalVisible(false)}
                            className="p-button-secondary"
                        >
                            {t.templatemanagementpanel2547}
                        </Button>
                        <Button
                            onClick={handleApplyProjectLinks}
                            className="p-button-primary"
                            disabled={loadingProjects}
                        >
                            {t.templatemanagementpanel2554}
                        </Button>
                    </>
                }
                style={{ width: '600px' }}
                contentStyle={{ backgroundColor: colors.bgPrimary, color: colors.textPrimary }}
                headerStyle={{ backgroundColor: colors.dialogHeader, color: colors.textPrimary }}
                modal
                closable
                draggable={true}
                resizable={true}
            >
                {loadingProjects ? (
                    <div className="flex justify-center items-center py-8">
                        <i className="pi pi-spin pi-spinner text-4xl" style={{ color: colors.accent }}></i>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {allProjects.length === 0 ? (
                            <div className="text-center py-4" style={{ color: colors.textMuted }}>
                                {t.templatemanagementpanel2574}
                            </div>
                        ) : (
                            allProjects.map((project) => (
                                <div
                                    key={project.id}
                                    className="flex items-center justify-between p-3 rounded cursor-pointer"
                                    style={{ border: `1px solid ${colors.borderPrimary}`, backgroundColor: colors.bgSecondary }}
                                    onClick={() => handleToggleProjectLink(project.id)}
                                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = colors.bgHover)}
                                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = colors.bgSecondary)}
                                >
                                    <div className="flex items-center gap-3 flex-1">
                                        <Checkbox
                                            checked={linkedProjectIds.includes(project.id)}
                                            onChange={() => handleToggleProjectLink(project.id)}
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                        <div>
                                            <div className="font-semibold" style={{ color: colors.textPrimary }}>{project.name}</div>
                                            {project.description && (
                                                <div className="text-sm" style={{ color: colors.textMuted }}>{project.description}</div>
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
                           {t.templatemanagementpanel2617}
                        </Button>
                        <Button
                            onClick={handleApplyActivationChanges}
                            className="p-button-primary"
                        >
                            {t.templatemanagementpanel2623}
                        </Button>
                    </>
                }
                style={{ width: '600px' }}
                contentStyle={{ backgroundColor: colors.bgPrimary, color: colors.textPrimary }}
                headerStyle={{ backgroundColor: colors.dialogHeader, color: colors.textPrimary }}
                modal
                closable
                draggable={true}
                resizable={true}
            >
                <div className="space-y-2">
                    {(templateToToggle?.linked_projects?.length || 0) === 0 ? (
                        <div className="text-center py-4" style={{ color: colors.textMuted }}>
                            {t.templatemanagementpanel2638}
                        </div>
                    ) : (
                        templateToToggle?.linked_projects?.map((project) => (
                            <div
                                key={project.id}
                                className="flex items-center justify-between p-3 rounded cursor-pointer"
                                style={{ border: `1px solid ${colors.borderPrimary}`, backgroundColor: colors.bgSecondary }}
                                onClick={() => handleToggleProjectActivation(project.id)}
                                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = colors.bgHover)}
                                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = colors.bgSecondary)}
                            >
                                <div className="flex items-center gap-3 flex-1">
                                    <Checkbox
                                        checked={projectActivationStates[project.id] || false}
                                        onChange={() => handleToggleProjectActivation(project.id)}
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                    <div>
                                        <div className="font-semibold" style={{ color: colors.textPrimary }}>{project.name}</div>
                                        <div className="text-sm" style={{ color: colors.textMuted }}>
                                            {projectActivationStates[project.id] ? t.templatemanagementpanel2659 : t.templatemanagementpanel2659_2}
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
                header={`${t.templatemanagementpanel2671}${templateForStoreSettings?.name}`}
                visible={storeSettingsModalVisible}
                onHide={() => setStoreSettingsModalVisible(false)}
                style={{ width: '700px' }}
                contentStyle={{ backgroundColor: colors.bgPrimary, color: colors.textPrimary }}
                headerStyle={{ backgroundColor: colors.dialogHeader, color: colors.textPrimary }}
                modal
                closable
                draggable={true}
                resizable={true}
            >
                {/* Status Info */}
                <div className="p-3 rounded mb-4" style={{ backgroundColor: templateForStoreSettings?.is_store_approved ? '#065f46' : '#78350f', color: templateForStoreSettings?.is_store_approved ? '#ffffff' : '#ffffff' }}>
                    <div className="flex items-center gap-2">
                        <i className={`pi ${templateForStoreSettings?.is_store_approved ? 'pi-check-circle' : 'pi-clock'}`}></i>
                        <span>
                            {templateForStoreSettings?.is_store_approved
                                ? t.templatemanagementpanel2688
                                : t.templatemanagementpanel2689}
                        </span>
                    </div>
                </div>

                {/* Sales Stats */}
                {templateForStoreSettings?.sales_count !== undefined && templateForStoreSettings.sales_count > 0 && (
                    <div className="grid grid-cols-2 gap-4 p-3 rounded mb-4" style={{ backgroundColor: colors.bgSecondary }}>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-green-400">{templateForStoreSettings.sales_count}</div>
                            <div className="text-sm" style={{ color: colors.textMuted }}>{t.templatemanagementpanel2699}</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-yellow-400">
                                {Number(templateForStoreSettings.total_revenue || 0).toFixed(2)}
                            </div>
                            <div className="text-sm" style={{ color: colors.textMuted }}>{t.templatemanagementpanel2705}</div>
                        </div>
                    </div>
                )}

                <TabView activeIndex={storeSettingsTab} onTabChange={(e) => setStoreSettingsTab(e.index)}>
                    {/* Tab 1: Price Settings */}
                    <TabPanel header={t.templatemanagementpanel2712} leftIcon="pi pi-money-bill mr-2">
                        <div className="space-y-4">
                            {/* Price Type Selection */}
                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    {t.templatemanagementpanel2717}
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
                                        <span>{t.templatemanagementpanel2728}</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="priceType"
                                            checked={storePriceType === 'euros'}
                                            onChange={() => setStorePriceType('euros')}
                                            className="w-4 h-4"
                                        />
                                        <span>{t.templatemanagementpanel2738}</span>
                                    </label>
                                </div>
                            </div>

                            {/* Price Input */}
                            {storePriceType === 'credits' ? (
                                <div>
                                    <label className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
                                        {t.templatemanagementpanel2747}
                                    </label>
                                    <InputText
                                        type="number"
                                        value={storePriceCredits.toString()}
                                        onChange={(e) => setStorePriceCredits(parseInt(e.target.value) || 50)}
                                        min={50}
                                        className="w-full"
                                        style={{ backgroundColor: colors.bgSecondary, color: colors.textPrimary, borderColor: colors.borderPrimary }}
                                    />
                                    <small className="mt-1 block" style={{ color: colors.textMuted }}>
                                        {t.templatemanagementpanel2758}{Math.floor(storePriceCredits * 0.8)}{t.templatemanagementpanel2758_2}
                                    </small>
                                </div>
                            ) : (
                                <div>
                                    <label className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
                                        {t.templatemanagementpanel2764}
                                    </label>
                                    <InputText
                                        type="number"
                                        value={storePriceEuros.toString()}
                                        onChange={(e) => setStorePriceEuros(parseFloat(e.target.value) || 1.00)}
                                        min={1}
                                        step={0.01}
                                        className="w-full"
                                        style={{ backgroundColor: colors.bgSecondary, color: colors.textPrimary, borderColor: colors.borderPrimary }}
                                    />
                                    <small className="mt-1 block" style={{ color: colors.textMuted }}>
                                        {t.templatemanagementpanel2776}{(storePriceEuros * 0.8).toFixed(2)}{t.templatemanagementpanel2776_2}
                                    </small>
                                </div>
                            )}

                            {/* Revenue Split Info */}
                            <div className="p-3 rounded text-sm" style={{ backgroundColor: colors.bgTertiary }}>
                                <i className="pi pi-info-circle mr-2"></i>
                                <strong>{t.templatemanagementpanel2784}</strong>{t.templatemanagementpanel2784_2}
                            </div>

                            {/* Action Buttons */}
                            <div className="flex justify-end gap-2 pt-4">
                                <Button
                                    label={t.templatemanagementpanel2790}
                                    icon="pi pi-times"
                                    onClick={() => setStoreSettingsModalVisible(false)}
                                    className="p-button-text"
                                />
                                <Button
                                    label={savingStoreSettings ? t.templatemanagementpanel2796 : t.templatemanagementpanel2796_2}
                                    icon={savingStoreSettings ? 'pi pi-spinner pi-spin' : 'pi pi-check'}
                                    onClick={handleSaveStoreSettings}
                                    className="p-button-success"
                                    disabled={savingStoreSettings}
                                />
                            </div>
                        </div>
                    </TabPanel>

                    {/* Tab 2: Media */}
                    <TabPanel header={t.templatemanagementpanel2807} leftIcon="pi pi-images mr-2">
                        <div className="space-y-6">
                            {/* Logo Section */}
                            <div>
                                <h4 className="text-lg font-semibold mb-3 flex items-center gap-2">
                                    <i className="pi pi-image text-blue-400"></i>
                                    {t.templatemanagementpanel2813}
                                </h4>
                                <div className="flex items-start gap-4">
                                    {/* Logo Preview */}
                                    <div
                                        className="w-32 h-32 rounded-lg border-2 border-dashed flex items-center justify-center overflow-hidden"
                                        style={{ borderColor: colors.borderPrimary, backgroundColor: colors.bgSecondary }}
                                    >
                                        {templateMedia.logo ? (
                                            <img
                                                src={`/api/media/${templateMedia.logo.id}/serve`}
                                                alt="Logo"
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="text-center" style={{ color: colors.textMuted }}>
                                                <i className="pi pi-image text-3xl mb-1"></i>
                                                <div className="text-xs">{t.templatemanagementpanel2830}</div>
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
                                            label={uploadingLogo ? t.templatemanagementpanel2844 : t.templatemanagementpanel2844_2}
                                            icon={uploadingLogo ? 'pi pi-spinner pi-spin' : 'pi pi-upload'}
                                            onClick={() => logoInputRef.current?.click()}
                                            className="p-button-sm"
                                            disabled={uploadingLogo}
                                        />
                                        {templateMedia.logo && (
                                            <Button
                                                label={t.templatemanagementpanel2852}
                                                icon="pi pi-trash"
                                                onClick={() => handleDeleteMedia(templateMedia.logo.id, 'logo')}
                                                className="p-button-sm p-button-danger p-button-outlined"
                                            />
                                        )}
                                        <small style={{ color: colors.textMuted }}>{t.templatemanagementpanel2858}</small>
                                    </div>
                                </div>
                            </div>

                            {/* Images Section */}
                            <div>
                                <h4 className="text-lg font-semibold mb-3 flex items-center gap-2">
                                    <i className="pi pi-images text-green-400"></i>
                                    {t.templatemanagementpanel2867}
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
                                    label={uploadingImages ? t.templatemanagementpanel2878 : t.templatemanagementpanel2878_2}
                                    icon={uploadingImages ? 'pi pi-spinner pi-spin' : 'pi pi-plus'}
                                    onClick={() => imagesInputRef.current?.click()}
                                    className="p-button-sm mb-3"
                                    disabled={uploadingImages}
                                />
                                <small className="ml-2" style={{ color: colors.textMuted }}>{t.templatemanagementpanel2884}</small>

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
                                    <div className="p-4 text-center border-2 border-dashed rounded-lg" style={{ borderColor: colors.borderPrimary, color: colors.textMuted }}>
                                        <i className="pi pi-images text-2xl mb-2"></i>
                                        <div className="text-sm">{t.templatemanagementpanel2909}</div>
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
                                        placeholder="t.templatemanagementpanel2926"
                                        className="flex-1"
                                        style={{ backgroundColor: colors.bgSecondary, color: colors.textPrimary, borderColor: colors.borderPrimary }}
                                    />
                                    <Button
                                        label={addingVideo ? '...' : t.templatemanagementpanel2931}
                                        icon={addingVideo ? 'pi pi-spinner pi-spin' : 'pi pi-plus'}
                                        onClick={handleAddVideo}
                                        className="p-button-sm"
                                        disabled={addingVideo || !newVideoUrl.trim()}
                                    />
                                </div>
                                <InputText
                                    value={newVideoTitle}
                                    onChange={(e) => setNewVideoTitle(e.target.value)}
                                    placeholder={t.templatemanagementpanel2941}
                                    className="w-full mb-3"
                                    style={{ backgroundColor: colors.bgSecondary, color: colors.textPrimary, borderColor: colors.borderPrimary }}
                                />

                                {/* Videos List */}
                                {templateMedia.videos.length > 0 ? (
                                    <div className="space-y-3">
                                        {templateMedia.videos.map((video: any) => (
                                            <div key={video.id} className="p-3 rounded-lg" style={{ backgroundColor: colors.bgSecondary }}>
                                                <div className="flex justify-between items-start mb-2">
                                                    <div>
                                                        <div className="font-medium" style={{ color: colors.textPrimary }}>{video.title || 'Video'}</div>
                                                        <div className="text-xs truncate max-w-md" style={{ color: colors.textMuted }}>{video.video_url}</div>
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
                                                        className="w-full h-full border-none"
                                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                        allowFullScreen
                                                    ></iframe>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-4 text-center border-2 border-dashed rounded-lg" style={{ borderColor: colors.borderPrimary, color: colors.textMuted }}>
                                        <i className="pi pi-video text-2xl mb-2"></i>
                                        <div className="text-sm">{t.templatemanagementpanel2977}</div>
                                        <div className="text-xs mt-1">{t.templatemanagementpanel2978}</div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </TabPanel>
                </TabView>
            </Dialog>

            {/* ConfirmDialog for import overwrite confirmation */}
            <ConfirmDialog group="template-management" />

            {/* Template Import Wizard */}
            <TemplateImportWizardPanel
                visible={importWizardVisible}
                onClose={() => setImportWizardVisible(false)}
                onSuccess={(template) => {
                    toast.showSuccess(t.templatemanagementpanel2995+template.name+t.templatemanagementpanel2995_2);
                    loadMyTemplates();
                }}
            />

            {/* Theme-aware styles for PrimeReact components */}
            <style>{`
                .template-management-panel .p-datatable {
                    background-color: var(--theme-bg-secondary) !important;
                    color: var(--theme-text-primary) !important;
                }
                .template-management-panel .p-datatable .p-datatable-header {
                    background-color: var(--theme-bg-tertiary) !important;
                    color: var(--theme-text-primary) !important;
                    border-color: var(--theme-border-primary) !important;
                }
                .template-management-panel .p-datatable .p-datatable-thead > tr > th {
                    background-color: var(--theme-bg-tertiary) !important;
                    color: var(--theme-text-primary) !important;
                    border-color: var(--theme-border-primary) !important;
                }
                .template-management-panel .p-datatable .p-datatable-tbody > tr {
                    background-color: var(--theme-bg-secondary) !important;
                    color: var(--theme-text-primary) !important;
                }
                .template-management-panel .p-datatable .p-datatable-tbody > tr > td {
                    border-color: var(--theme-border-primary) !important;
                }
                .template-management-panel .p-datatable .p-datatable-tbody > tr:hover {
                    background-color: var(--theme-bg-hover) !important;
                }
                .template-management-panel .p-paginator {
                    background-color: var(--theme-bg-tertiary) !important;
                    color: var(--theme-text-primary) !important;
                    border-color: var(--theme-border-primary) !important;
                }
                .template-management-panel .p-paginator .p-paginator-pages .p-paginator-page {
                    color: var(--theme-text-primary) !important;
                }
                .template-management-panel .p-paginator .p-paginator-pages .p-paginator-page.p-highlight {
                    background-color: var(--theme-accent) !important;
                    color: white !important;
                }
                .template-management-panel .p-paginator .p-paginator-first,
                .template-management-panel .p-paginator .p-paginator-prev,
                .template-management-panel .p-paginator .p-paginator-next,
                .template-management-panel .p-paginator .p-paginator-last {
                    color: var(--theme-text-primary) !important;
                }
                .template-management-panel .p-paginator .p-dropdown {
                    background-color: var(--theme-bg-secondary) !important;
                    color: var(--theme-text-primary) !important;
                    border-color: var(--theme-border-primary) !important;
                }
                .template-management-panel .p-paginator .p-dropdown .p-dropdown-label {
                    color: var(--theme-text-primary) !important;
                }
                .template-management-panel .p-paginator .p-inputtext {
                    background-color: var(--theme-bg-secondary) !important;
                    color: var(--theme-text-primary) !important;
                    border-color: var(--theme-border-primary) !important;
                }
                .template-management-panel .p-card {
                    background-color: var(--theme-bg-secondary) !important;
                    color: var(--theme-text-primary) !important;
                }
                .template-management-panel .p-card .p-card-title {
                    color: var(--theme-text-primary) !important;
                }
                .template-management-panel .p-card .p-card-content {
                    color: var(--theme-text-primary) !important;
                }
                .template-management-panel .p-tabview .p-tabview-nav {
                    background-color: var(--theme-bg-tertiary) !important;
                    border-color: var(--theme-border-primary) !important;
                }
                .template-management-panel .p-tabview .p-tabview-nav li .p-tabview-nav-link {
                    background-color: transparent !important;
                    color: var(--theme-text-secondary) !important;
                    border-color: var(--theme-border-primary) !important;
                }
                .template-management-panel .p-tabview .p-tabview-nav li.p-highlight .p-tabview-nav-link {
                    background-color: var(--theme-bg-secondary) !important;
                    color: var(--theme-accent) !important;
                    border-color: var(--theme-accent) !important;
                }
                .template-management-panel .p-tabview .p-tabview-panels {
                    background-color: var(--theme-bg-secondary) !important;
                    color: var(--theme-text-primary) !important;
                }
                .template-management-panel .p-dropdown {
                    background-color: var(--theme-bg-secondary) !important;
                    color: var(--theme-text-primary) !important;
                    border-color: var(--theme-border-primary) !important;
                }
                .template-management-panel .p-dropdown .p-dropdown-label {
                    color: var(--theme-text-primary) !important;
                }
                .template-management-panel .p-dropdown-panel {
                    background-color: var(--theme-bg-secondary) !important;
                }
                .template-management-panel .p-dropdown-panel .p-dropdown-items .p-dropdown-item {
                    color: var(--theme-text-primary) !important;
                }
                .template-management-panel .p-dropdown-panel .p-dropdown-items .p-dropdown-item:hover {
                    background-color: var(--theme-bg-hover) !important;
                }
                .template-management-panel .p-dropdown-panel .p-dropdown-items .p-dropdown-item.p-highlight {
                    background-color: var(--theme-accent) !important;
                    color: white !important;
                }
                .template-management-panel .p-inputtext {
                    background-color: var(--theme-bg-secondary) !important;
                    color: var(--theme-text-primary) !important;
                    border-color: var(--theme-border-primary) !important;
                }
                .template-management-panel .p-inputtext::placeholder {
                    color: var(--theme-text-muted) !important;
                }
            `}</style>
            <TemplatePrintModal visible={showPrintModal} onHide={() => setShowPrintModal(false)} templateId={printTemplateId} />
        </div>
    );
};

export default TemplateManagementPanel;