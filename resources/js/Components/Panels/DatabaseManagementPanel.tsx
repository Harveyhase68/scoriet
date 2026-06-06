import React, { useState, useEffect, useCallback } from 'react';
import { useProject } from '@/contexts/ProjectContext';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Tag } from 'primereact/tag';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { MultiSelect } from 'primereact/multiselect';
import { FileUpload } from 'primereact/fileupload';
import { Message } from 'primereact/message';
import { useTranslation, SupportedLanguage, getStoredLanguage } from '@/i18n';
import { useTheme } from '@/contexts/ThemeContext';
import { useToast } from '@/contexts/ToastContext';
import ProjectUnlockModal from '@/Components/Modals/ProjectUnlockModal';
import PlanModal from '@/Components/AuthModals/PlanModal';
import SchemaPrintModal from '@/Components/Panels/SchemaPrintModal';
import SqlImportModal from '@/Components/SqlImportModal';
import DatabaseExportModal from '@/Components/DatabaseExportModal';
import { apiClient } from '@/lib/api';

interface TabPanelProps {
  isActive: boolean;
  onOpenDesigner?: (schemaId: number, schemaName?: string) => void;
  filterByProject?: boolean;
  forceProjectId?: number;
  forceProjectName?: string;
  preSelectedSchemaId?: number;
  updateTabTitle?: (newTitle: string) => void;
}

interface SchemaSubscription {
  id: number;
  expires_at: string | null;
  is_expired: boolean;
  is_soft_locked: boolean;
  days_remaining: number | null;
}

interface FloatingSchema {
  id: number;
  name: string;
  description?: string;
  default_charset?: string;
  default_collation?: string;
  owner_id: number;
  visibility: 'public' | 'private';
  is_system_schema: boolean;
  owner: {
    id: number;
    name: string;
    email: string;
    username?: string;
  };
  created_at: string;
  updated_at: string;
  tables_count?: number;
  projects_count?: number;
  projects?: Array<{
    id: number;
    name: string;
    association_type: 'linked' | 'cloned' | 'imported';
    alias?: string;
  }>;
  // Subscription / Lock status
  is_soft_locked?: boolean;
  subscription?: SchemaSubscription | null;
}

interface Project {
  id: number;
  name: string;
  description?: string;
  owner: {
    id: number;
    name: string;
  };
}

export default function DatabaseManagementPanel({ isActive, onOpenDesigner, filterByProject = false, forceProjectId, forceProjectName, preSelectedSchemaId: _preSelectedSchemaId, updateTabTitle }: TabPanelProps) {
  // i18n setup
  const [currentLanguage] = React.useState<SupportedLanguage>(getStoredLanguage());
  const { t } = useTranslation(currentLanguage);
  const { colors } = useTheme();
  const toast = useToast();

  // Use Project Context to get current project and projects list
  const { selectedProject: contextSelectedProject, projects: contextProjects } = useProject();
  // Use forceProjectId if provided (from TreeView), otherwise use context
  const projectId = forceProjectId || (filterByProject ? contextSelectedProject?.id : undefined);

  // Get current user type for system schema checkbox
  const currentUserId = parseInt(localStorage.getItem('user_id') || '0');
  const userType = localStorage.getItem('user_type') || 'free';
  const isSystemUser = userType === 'system';

  const [mySchemas, setMySchemas] = useState<FloatingSchema[]>([]);
  const [communitySchemas, setCommunitySchemas] = useState<FloatingSchema[]>([]);
  const [mySchemasLoading, setMySchemasLoading] = useState(true);
  const [communityLoading, setCommunityLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  // Filters for My Schemas
  const [myTypeFilter, setMyTypeFilter] = useState('all'); // 'all', 'private', 'public', 'system'
  const [mySearchTerm, setMySearchTerm] = useState('');

  // Filters for Community Schemas
  const [communityTypeFilter, setCommunityTypeFilter] = useState('all'); // 'all', 'system', 'public'
  const [communitySearchTerm, setCommunitySearchTerm] = useState('');

  // Translation Export/Import
  const [languages, setLanguages] = useState<Array<{ code: string; name: string }>>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);

  // Import dialog state - separate from export so we can keep the chosen
  // file in memory between "pick file" and "click Import" without re-uploading
  // it during the preview step.
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreviewLoading, setImportPreviewLoading] = useState(false);
  const [importDetectedLanguages, setImportDetectedLanguages] = useState<string[]>([]);
  const [importSelectedLanguages, setImportSelectedLanguages] = useState<string[]>([]);
  const [importDataRows, setImportDataRows] = useState<number>(0);
  const [importPreviewError, setImportPreviewError] = useState<string>('');
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const [printSchemaId, setPrintSchemaId] = useState<number | null>(null);
  // Per-row Schema Import / Export: opens the same modals as the Database menu,
  // but with the clicked schema preselected.
  const [sqlImportSchemaId, setSqlImportSchemaId] = useState<number | null>(null);
  const [dbExportSchemaId, setDbExportSchemaId] = useState<number | null>(null);

  // Create schema modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    description: '',
    default_charset: 'utf8mb4',
    default_collation: 'utf8mb4_unicode_ci',
    visibility: 'private' as 'public' | 'private',
    is_system_schema: false,
    project_ids: [] as number[]
  });
  const [creating, setCreating] = useState(false);

  // Schema unlock and plan modals
  const [showSchemaUnlockModal, setShowSchemaUnlockModal] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [planModalInitialTab, setPlanModalInitialTab] = useState(0);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Schema unlock state
  const [unlockingSchema, setUnlockingSchema] = useState(false);
  const [schemaToUnlock, setSchemaToUnlock] = useState<FloatingSchema | null>(null);

  // Edit schema modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSchema, setEditingSchema] = useState<FloatingSchema | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    default_charset: 'utf8mb4',
    default_collation: 'utf8mb4_unicode_ci',
    visibility: 'private' as 'public' | 'private',
    is_system_schema: false
  });

  // Associate to project modal
  const [showAssociateModal, setShowAssociateModal] = useState(false);
  const [associatingSchema, setAssociatingSchema] = useState<FloatingSchema | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectForAssociation, setSelectedProjectForAssociation] = useState<number | null>(null);
  const [associationType, setAssociationType] = useState<'linked' | 'cloned' | 'imported'>('linked');
  const [alias, setAlias] = useState('');
  const [associating, setAssociating] = useState(false);

  // Delete schema modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingSchema, setDeletingSchema] = useState<FloatingSchema | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteInfo, setDeleteInfo] = useState<{
    projects_count: number;
    versions_count: number;
    tables_count: number;
    requires_force?: boolean;
  } | null>(null);

  // Copy schema modal
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [copyingSchema, setCopyingSchema] = useState<FloatingSchema | null>(null);
  const [copyName, setCopyName] = useState('');
  const [copying, setCopying] = useState(false);

  // Link schema to projects modal
  const [linkModalVisible, setLinkModalVisible] = useState(false);
  const [schemaToLink, setSchemaToLink] = useState<FloatingSchema | null>(null);
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [linkedProjectIds, setLinkedProjectIds] = useState<number[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);

  // Load user's own schemas (own, team, linked system/public schemas)
  const loadMySchemas = useCallback(async () => {
    try {
      setMySchemasLoading(true);
      setError('');

      let data: any;
      try {
        data = await apiClient.get('/schemas');
      } catch {
        throw new Error(t.databaseexportmodal71);
      }
      const allSchemas = data.schemas || [];

      // Filter: User's own schemas (owner) OR schemas linked to user's projects
      let filtered = allSchemas.filter((s: FloatingSchema) => {
        const isMySchema = String(s.owner_id) === String(currentUserId); // Explicit string conversion like PHP
        const isLinkedToMyProjects = (s.projects_count || 0) > 0;

        // Show if user owns it OR if it's linked to user's projects
        if (isMySchema || isLinkedToMyProjects) {
          // System users can see all, including system schemas
          if (isSystemUser) {
            return true;
          }
          // Normal users: Don't show system schemas they didn't create (unless linked)
          if (s.is_system_schema && !isMySchema && isLinkedToMyProjects) {
            return true; // Show linked system schemas
          }
          if (s.is_system_schema && !isMySchema) {
            return false; // Don't show non-linked system schemas
          }
          return true;
        }

        return false;
      });

      // Apply type filter (private/public/system)
      if (myTypeFilter !== 'all') {
        if (myTypeFilter === 'system') {
          filtered = filtered.filter((s: FloatingSchema) => s.is_system_schema);
        } else if (myTypeFilter === 'private') {
          filtered = filtered.filter((s: FloatingSchema) => !s.is_system_schema && s.visibility === 'private');
        } else if (myTypeFilter === 'public') {
          filtered = filtered.filter((s: FloatingSchema) => !s.is_system_schema && s.visibility === 'public');
        }
      }

      // Apply search
      if (mySearchTerm) {
        const search = mySearchTerm.toLowerCase();
        filtered = filtered.filter((s: FloatingSchema) =>
          s.name?.toLowerCase().includes(search) ||
          s.description?.toLowerCase().includes(search)
        );
      }

      setMySchemas(filtered);

    } catch (error) {
      setError(error instanceof Error ? error.message : t.databasemanagementpanel152);
    } finally {
      setMySchemasLoading(false);
    }
  }, [myTypeFilter, mySearchTerm, currentUserId, isSystemUser, t]);

  // Load community schemas (system + public from others)
  const loadCommunitySchemas = useCallback(async () => {
    try {
      setCommunityLoading(true);
      setError('');

      let data: any;
      try {
        data = await apiClient.get('/schemas');
      } catch {
        throw new Error(t.databaseexportmodal71);
      }
      const allSchemas = data.schemas || [];

      // Filter: System schemas OR public schemas (from anyone)
      let filtered = allSchemas.filter((s: FloatingSchema) => {
        // System schemas are ALWAYS shown
        if (s.is_system_schema) {
          return true;
        }

        // Public schemas from anyone
        if (s.visibility === 'public') {
          return true;
        }

        return false;
      });

      // Apply type filter
      if (communityTypeFilter === 'system') {
        filtered = filtered.filter((s: FloatingSchema) => s.is_system_schema);
      } else if (communityTypeFilter === 'public') {
        filtered = filtered.filter((s: FloatingSchema) => !s.is_system_schema && s.visibility === 'public');
      }

      // Apply search
      if (communitySearchTerm) {
        const search = communitySearchTerm.toLowerCase();
        filtered = filtered.filter((s: FloatingSchema) =>
          s.name?.toLowerCase().includes(search) ||
          s.description?.toLowerCase().includes(search)
        );
      }

      setCommunitySchemas(filtered);

    } catch (error) {
      setError(error instanceof Error ? error.message : t.databasemanagementpanel152);
    } finally {
      setCommunityLoading(false);
    }
  }, [communityTypeFilter, communitySearchTerm, t]);

  // Load user data when panel becomes active
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const userData = await apiClient.get('/user');
        setCurrentUser(userData);
      } catch (error) {
        console.error('Failed to load user data:', error);
      }
    };

    if (isActive) {
      loadUserData();
    }
  }, [isActive]);

  // Load schemas when panel becomes active
  useEffect(() => {
    if (isActive) {
      loadMySchemas();
      loadCommunitySchemas();
      loadLanguages();
    }
  }, [isActive, loadMySchemas, loadCommunitySchemas]);

  // Reload my schemas when filters change
  useEffect(() => {
    if (isActive) {
      loadMySchemas();
    }
  }, [myTypeFilter, mySearchTerm]);

  // Reload community schemas when filters change
  useEffect(() => {
    if (isActive) {
      loadCommunitySchemas();
    }
  }, [communityTypeFilter, communitySearchTerm]);

  // Update tab title with forceProjectName (when set from Quick Actions or tree view - fixed title with project name)
  useEffect(() => {
    if (filterByProject && updateTabTitle && forceProjectName) {
      updateTabTitle(`${t.databasemanagementpanel380}${forceProjectName}`);
    }
  }, [filterByProject, updateTabTitle, forceProjectName]);


  const loadProjects = async () => {
    try {
      const data = await apiClient.get('/projects');
      setProjects(data.projects || []);
    } catch {
      // Error loading projects
    }
  };

  const loadLanguages = async () => {
    try {
      // /api/active-languages returns the array directly, not wrapped in
      // { languages: [...] }. Treat the response as an array - using
      // data.languages here previously yielded undefined → [] and the
      // export-translations dialog showed "No available options".
      const data = await apiClient.get('/active-languages');
      const langs = Array.isArray(data) ? data : [];
      setLanguages(langs);

      // Pre-select all languages by default
      setSelectedLanguages(langs.map((lang: any) => lang.code));
    } catch {
      // Error loading languages
    }
  };

  const handleExportTranslations = async () => {
    if (!contextSelectedProject || selectedLanguages.length === 0) {
      setError(t.databasemanagementpanel221);
      return;
    }

    setExporting(true);
    setError('');

    try {
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (!token) {
        throw new Error(t.applicationsmodal66);
      }

      const languagesParam = selectedLanguages.map(lang => `languages[]=${lang}`).join('&');
      const url = `/api/translations/export?project_id=${contextSelectedProject.id}&${languagesParam}`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        },
      });

      if (!response.ok) {
        throw new Error(t.databasemanagementpanel245);
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `translations_${contextSelectedProject.name}_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(a);

      setShowExportDialog(false);
      setSuccess(t.databasemanagementpanel259);
    } catch (error) {
      setError(error instanceof Error ? error.message : t.databasemanagementpanel261);
    } finally {
      setExporting(false);
    }
  };

  // Reset all import-dialog state - used when opening dialog fresh AND
  // when the user re-picks a different file partway through.
  const resetImportState = () => {
    setImportFile(null);
    setImportDetectedLanguages([]);
    setImportSelectedLanguages([]);
    setImportDataRows(0);
    setImportPreviewError('');
  };

  // User picked a file in the FileUpload widget. Run a server-side preview
  // (no DB writes) so we can populate the language checkboxes BEFORE the
  // import actually happens. This makes the dialog two-phase: pick file →
  // see what's inside → tick languages → click Import.
  const handleImportFileSelected = async (event: any) => {
    const file = event.files?.[0];
    if (!file) return;

    setImportFile(file);
    setImportDetectedLanguages([]);
    setImportSelectedLanguages([]);
    setImportDataRows(0);
    setImportPreviewError('');
    setImportPreviewLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      const result = await apiClient.uploadFile('/translations/import-preview', formData);

      const detected: string[] = Array.isArray(result.languages) ? result.languages : [];
      setImportDetectedLanguages(detected);

      // Default selection: the intersection of (a) what's in the Excel and
      // (b) what's enabled for this project. If that intersection is empty
      // (e.g. file has unrelated languages), pre-tick everything found in
      // the file so the user starts from "import all".
      const projectLangs = contextSelectedProject?.enabled_languages;
      if (Array.isArray(projectLangs) && projectLangs.length > 0) {
        const intersection = detected.filter(lang => projectLangs.includes(lang));
        setImportSelectedLanguages(intersection.length > 0 ? intersection : detected);
      } else {
        setImportSelectedLanguages(detected);
      }

      setImportDataRows(typeof result.data_rows === 'number' ? result.data_rows : 0);
    } catch (err: any) {
      setImportPreviewError(err?.response?.data?.error || err?.message || t.databasemanagementpanel294);
    } finally {
      setImportPreviewLoading(false);
    }
  };

  const handleImportConfirm = async () => {
    if (!importFile || !contextSelectedProject) return;
    if (importSelectedLanguages.length === 0) {
      setImportPreviewError(t.databasemanagementpanel221);
      return;
    }

    setImporting(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', importFile);
      formData.append('project_id', contextSelectedProject.id.toString());
      // Backend filters to only these language columns (column-letter mapping
      // happens server-side); other columns in the sheet are ignored.
      importSelectedLanguages.forEach(code => formData.append('languages[]', code));

      let result: any;
      try {
        result = await apiClient.uploadFile('/translations/import', formData);
      } catch (err: any) {
        throw new Error(err?.response?.data?.message || t.databasemanagementpanel294);
      }
      setShowImportDialog(false);
      resetImportState();
      setSuccess(`${t.databasemanagementpanel510}${result.imported_count}${t.databasemanagementpanel510_2}(${result.updated_count}${t.databasemanagementpanel510_3}${result.created_count}${t.databasemanagementpanel510_4})`);
    } catch (error) {
      setError(error instanceof Error ? error.message : t.databasemanagementpanel301);
    } finally {
      setImporting(false);
    }
  };

  // Pre-check before opening create schema modal
  // Convenience default: pre-select the currently active project (only if the
  // user owns it — the create dialog lists owned projects only) so a new
  // database is linked to the project the user is working in without an extra
  // click. Purely a default; the user can deselect it before saving.
  const currentProjectDefaultIds = (): number[] => {
    if (!contextSelectedProject) return [];
    const owned = contextProjects.some(
      p => Number(p.id) === Number(contextSelectedProject.id) && Number(p.owner_id) === Number(currentUserId)
    );
    return owned ? [Number(contextSelectedProject.id)] : [];
  };

  const handleCreateSchemaClick = async () => {
    if (!currentUser) {
      setError(t.databasemanagementpanel521);
      return;
    }

    const isFreeUser = currentUser.user_type === 'free' || !currentUser.user_type;

    // If user is Free, check subscription_info from backend (slot-based system)
    if (isFreeUser) {
      try {
        // Fetch current subscription info from backend
        const data = await apiClient.get('/schemas');
        const subscriptionInfo = data.subscription_info;

        // Use backend's needs_unlock flag (accounts for subscription slots)
        if (subscriptionInfo && subscriptionInfo.needs_unlock) {
          // Show SchemaUnlockModal - user needs to pay 50 credits for a new slot
          setShowSchemaUnlockModal(true);
          return;
        }
      } catch (err) {
        console.error('Error checking subscription info:', err);
        // Continue anyway - backend will validate
      }
    }

    // User is not Free, or has available slots -> show create modal directly
    setCreateForm(prev => ({ ...prev, project_ids: currentProjectDefaultIds() }));
    setShowCreateModal(true);
  };

  const handleSchemaUnlockConfirm = () => {
    // User confirmed they want to spend 50 credits
    // Close unlock modal and open create modal
    setShowSchemaUnlockModal(false);
    setCreateForm(prev => ({ ...prev, project_ids: currentProjectDefaultIds() }));
    setShowCreateModal(true);
  };

  const handleBuyCredits = () => {
    // Open Plan Modal on "Buy Credits" tab (tab index 1)
    setPlanModalInitialTab(1);
    setShowPlanModal(true);
  };

  // Unlock an expired schema subscription (renew for 50 credits)
  const handleUnlockExpiredSchema = async (schema: FloatingSchema) => {
    if (!schema.subscription?.id) {
      setError(t.databasemanagementpanel581);
      return;
    }

    setUnlockingSchema(true);
    setSchemaToUnlock(schema);
    setError('');
    setSuccess('');

    try {
      let data: any;
      try {
        data = await apiClient.post(`/subscriptions/${schema.subscription.id}/renew`);
      } catch (err: any) {
        const errData = err?.response?.data || {};
        // If not enough credits, show the plan modal
        if (errData.required_credits) {
          setError(`${t.databasemanagementpanel610}${errData.required_credits}${t.databasemanagementpanel610_2}${errData.current_credits}`);
          setPlanModalInitialTab(1);
          setShowPlanModal(true);
          return;
        }
        throw new Error(errData.error || errData.message || t.databasemanagementpanel614);
      }

      // Reload user data to get updated credits
      try {
        const userData = await apiClient.get('/user');
        setCurrentUser(userData);
        window.dispatchEvent(new CustomEvent('creditsChanged'));
      } catch {
        // Non-critical
      }

      // Reload schemas to get updated status
      await loadMySchemas();
      await loadCommunitySchemas();

      setSuccess(`${t.databasemanagementpanel636}"${schema.name}"${t.databasemanagementpanel636_2}(${data.bonus_days || 0}${t.databasemanagementpanel636_3})`);
    } catch (error) {
      setError(error instanceof Error ? error.message : t.databasemanagementpanel638);
    } finally {
      setUnlockingSchema(false);
      setSchemaToUnlock(null);
    }
  };

  const handleCreateSchema = async () => {
    setCreating(true);
    setError('');
    setSuccess('');

    try {
      try {
        await apiClient.post('/schemas', createForm);
      } catch (err: any) {
        const errorData = err?.response?.data || {};

        // Handle insufficient credits error
        if (errorData.error_code === 'INSUFFICIENT_CREDITS') {
          setError(`${t.databasemanagementpanel671}${errorData.required_credits}${t.databasemanagementpanel671_2}${errorData.current_credits}.`);
          setShowCreateModal(false);
          setCreating(false);

          // Open Plan Modal on "Buy Credits" tab
          setPlanModalInitialTab(1);
          setShowPlanModal(true);
          return;
        }

        // Validation failure (especially duplicate-name) — surface as a
        // visible toast that floats ABOVE the modal, instead of writing to
        // the panel's setError which lands behind the open create modal.
        // Keep the modal open so the user can correct the name without
        // re-typing the rest of the form.
        const fieldError = errorData?.errors?.name?.[0];
        if (fieldError) {
          toast.showError(fieldError);
          setCreating(false);
          return;
        }

        throw new Error(errorData.message || t.databasemanagementpanel330);
      }

      // Reload user data to get updated credits
      try {
        const userData = await apiClient.get('/user');
        setCurrentUser(userData);
        // Notify other components (like navigation) about credit change
        window.dispatchEvent(new CustomEvent('creditsChanged'));
      } catch {
        // Non-critical
      }

      await loadMySchemas();
      await loadCommunitySchemas();
      setShowCreateModal(false);
      setCreateForm({ name: '', description: '', default_charset: 'utf8mb4', default_collation: 'utf8mb4_unicode_ci', visibility: 'private', is_system_schema: false, project_ids: [] });
      setSuccess(t.databasemanagementpanel336);

    } catch (error) {
      setError(error instanceof Error ? error.message : t.databasemanagementpanel339);
    } finally {
      setCreating(false);
    }
  };

  const handleEditSchema = (schema: FloatingSchema) => {
    setEditingSchema(schema);
    setEditForm({
      name: schema.name,
      description: schema.description || '',
      default_charset: schema.default_charset || 'utf8mb4',
      default_collation: schema.default_collation || 'utf8mb4_unicode_ci',
      visibility: schema.visibility,
      is_system_schema: schema.is_system_schema
    });
    setShowEditModal(true);
    setError('');
    setSuccess('');
  };

  const handleUpdateSchema = async () => {
    if (!editingSchema) return;
    
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      try {
        await apiClient.put(`/schemas/${editingSchema.id}`, editForm);
      } catch (err: any) {
        throw new Error(err?.response?.data?.message || t.databasemanagementpanel382);
      }

      await loadMySchemas();
      await loadCommunitySchemas();
      setShowEditModal(false);
      setEditingSchema(null);
      setSuccess(t.schemacontroller193);

    } catch (error) {
      setError(error instanceof Error ? error.message : t.databasemanagementpanel391);
    } finally {
      setSaving(false);
    }
  };

  const handleAssociateToProject = (schema: FloatingSchema) => {
    setAssociatingSchema(schema);
    // If forceProjectId is set (from TreeView), use that; otherwise user selects
    setSelectedProjectForAssociation(forceProjectId || null);
    setAssociationType('linked');
    setAlias('');
    setShowAssociateModal(true);
    // Only load projects if we need the dropdown (no forceProjectId)
    if (!forceProjectId) {
      loadProjects();
    }
  };

  const handleConfirmAssociation = async () => {
    if (!associatingSchema || !selectedProjectForAssociation) return;

    setAssociating(true);
    setError('');

    try {
      try {
        await apiClient.post(`/projects/${selectedProjectForAssociation}/schemas`, {
          schema_id: associatingSchema.id,
          association_type: associationType,
          alias: alias || null,
        });
      } catch (err: any) {
        throw new Error(err?.response?.data?.message || t.databasemanagementpanel438);
      }

      setShowAssociateModal(false);
      setAssociatingSchema(null);
      await loadMySchemas(); // Reload schemas to update the UI
      await loadCommunitySchemas();
      setSuccess(`${t.databasemanagementpanel813}${associationType}${t.databasemanagementpanel813_2}`);

    } catch (error) {
      setError(error instanceof Error ? error.message : t.databasemanagementpanel447);
    } finally {
      setAssociating(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '—';
    return new Date(dateString).toLocaleDateString(currentLanguage, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Strip every character that is not a lowercase letter, digit or underscore.
  // Used both when accepting input in the copy dialog and when deriving the
  // suggested copy name from an existing schema, so we never end up with a
  // name that downstream code (export filenames, generated namespaces, FK
  // references, …) cannot safely use.
  const sanitizeSchemaName = (input: string): string => {
    let result = '';
    for (const ch of input.toLowerCase()) {
      if ((ch >= 'a' && ch <= 'z') || (ch >= '0' && ch <= '9') || ch === '_') {
        result += ch;
      }
    }
    return result;
  };

  // Build a sensible copy-name suggestion. If the source already ends in a
  // numeric suffix (e.g. "users_2"), increment it to "users_3". Otherwise
  // append "_1". Walking trailing digits manually instead of using a regex
  // keeps the logic readable and matches the project's no-regex preference
  // for non-trivial parsing.
  //
  // existingNames is the set of schema names the user already owns; when
  // provided we keep incrementing until we find one that's free, so the
  // user does not have to fix the suggestion themselves the moment two
  // copies of the same schema would otherwise collide.
  const suggestCopyName = (original: string, existingNames: Set<string> = new Set()): string => {
    const base = sanitizeSchemaName(original);
    if (base === '') return '_1';

    // Split base into "<prefix>_" + numeric tail (or whole base + no tail).
    let i = base.length;
    while (i > 0 && base[i - 1] >= '0' && base[i - 1] <= '9') {
      i--;
    }
    const hasTrailingDigits = i < base.length;
    const hasUnderscoreBefore = i > 0 && base[i - 1] === '_';

    let prefix: string;
    let nextNum: number;
    if (hasTrailingDigits && hasUnderscoreBefore) {
      // "<stem>_<digits>" → increment from <digits>+1.
      prefix = base.slice(0, i); // includes the trailing underscore
      nextNum = parseInt(base.slice(i), 10) + 1;
    } else {
      // No "_<digits>" pattern → start at "_1".
      prefix = base + '_';
      nextNum = 1;
    }

    // Walk forward until we hit a name that isn't taken. Capped just in
    // case existingNames somehow becomes pathological; 9999 is far beyond
    // any realistic copy chain and prevents an infinite loop.
    for (let n = nextNum; n < nextNum + 9999; n++) {
      const candidate = prefix + n;
      if (!existingNames.has(candidate)) {
        return candidate;
      }
    }
    return prefix + nextNum; // fallback - caller will see backend rejection
  };

  // Schema name template with lock icon for locked schemas
  const nameTemplate = (schema: FloatingSchema) => {
    const isLocked = schema.is_soft_locked === true;
    return (
      <div className="flex items-center gap-2">
        {isLocked && <i className="pi pi-lock text-red-500" />}
        <span className={isLocked ? 'text-red-400' : ''}>{schema.name}</span>
      </div>
    );
  };

  // Status template showing lock/expiry status
  const statusTemplate = (schema: FloatingSchema) => {
    if (schema.is_soft_locked) {
      return (
        <div className="flex items-center gap-1">
          <i className="pi pi-lock text-red-500" />
          <Tag value={t.databasemanagementpanel849} severity="danger" />
        </div>
      );
    }
    if (schema.subscription?.days_remaining !== null && schema.subscription?.days_remaining !== undefined && schema.subscription.days_remaining <= 14) {
      return (
        <div className="flex items-center gap-1">
          <i className="pi pi-exclamation-triangle text-yellow-500" />
          <Tag value={`${schema.subscription.days_remaining}${t.databasemanagementpanel857}`} severity="warning" />
        </div>
      );
    }
    // Only show "Aktiv" if schema has a subscription (not for first free schema)
    if (schema.subscription) {
      return <Tag value={t.databasemanagementpanel863} severity="success" />;
    }
    return null;
  };

  const visibilityTemplate = (schema: FloatingSchema) => {
    // Show "System" badge for system schemas
    if (schema.is_system_schema) {
      return (
        <Tag
          value={t.databasemanagementpanel873}
          severity="info"
        />
      );
    }

    return (
      <Tag
        value={schema.visibility}
        severity={schema.visibility === 'public' ? 'success' : 'warning'}
      />
    );
  };

  const ownerTemplate = (schema: FloatingSchema) => {
    return (
      <div className="flex items-center space-x-2">
        <i className="pi pi-user text-blue-500"></i>
        <span>{schema.owner.name}</span>
      </div>
    );
  };

  const projectsTemplate = (schema: FloatingSchema) => {
    const projects = schema.projects || [];

    if (projects.length === 0) {
      return <span className="text-gray-500 text-sm">{t.databasemanagementpanel900}</span>;
    }

    // Build tooltip content with all project names
    const tooltipContent = projects.map(p => p.name).join('\n');

    return (
      <div title={tooltipContent}>
        <Tag
          icon="pi pi-link"
          value={`${projects.length} ${projects.length === 1 ? t.databasemanagementpanel910 : t.databasemanagementpanel910_2}`}
          severity="info"
          className="cursor-help"
        />
      </div>
    );
  };

  const handleRemoveFromProject = async (schema: FloatingSchema, projectId: number) => {
    try {
      setError('');

      try {
        await apiClient.delete(`/projects/${projectId}/schemas/${schema.id}`);
      } catch (err: any) {
        throw new Error(err?.response?.data?.message || t.databasemanagementpanel529);
      }

      await loadMySchemas();
      await loadCommunitySchemas();
      setSuccess(t.databasemanagementpanel942);

    } catch (error) {
      setError(error instanceof Error ? error.message : t.databasemanagementpanel536);
    }
  };

  const handleDeleteSchema = (schema: FloatingSchema) => {
    setDeletingSchema(schema);
    setDeleteConfirmText('');
    setDeleteInfo(null);
    setShowDeleteModal(true);
    setError('');
    setSuccess('');
  };

  const handleCopySchema = async (schema: FloatingSchema) => {
    setCopyingSchema(schema);
    // Suggest "<name>_<n+1>" if the source already ends in _<digits>,
    // otherwise "<name>_1". Replaces the previous "<name> (Copy)" suffix
    // which produced names with spaces and parentheses that broke
    // exports / generated identifiers.
    //
    // We re-fetch /schemas here instead of reusing mySchemas so that the
    // existence check is correct even when the My-Schemas tab has been
    // narrowed by filters (private/public/system/search) and therefore
    // doesn't list every schema the user actually owns. Falls back to the
    // already-loaded list if the request fails.
    let existingNames: Set<string>;
    try {
      const data = await apiClient.get('/schemas');
      const allSchemas = Array.isArray(data) ? data : (data.schemas || []);
      existingNames = new Set(
        allSchemas
          .filter((s: FloatingSchema) => String(s.owner_id) === String(currentUserId))
          .map((s: FloatingSchema) => s.name)
      );
    } catch {
      existingNames = new Set(mySchemas.map(s => s.name));
    }

    setCopyName(suggestCopyName(schema.name, existingNames));
    setShowCopyModal(true);
    setError('');
    setSuccess('');
  };

  const handleConfirmCopy = async () => {
    if (!copyingSchema) return;

    setCopying(true);
    setError('');
    setSuccess('');

    try {
      try {
        await apiClient.post(`/template-db-schema/schemas/${copyingSchema.id}/copy`, {
          name: copyName,
        });
      } catch (err: any) {
        const data = err?.response?.data || {};
        throw new Error(data.error || data.message || t.databasemanagementpanel585);
      }

      setShowCopyModal(false);
      setCopyingSchema(null);
      await loadMySchemas();
      await loadCommunitySchemas();
      setSuccess(`${t.databasemanagementpanel1001}"${copyingSchema.name}"${t.databasemanagementpanel1001_2}"${copyName}"`);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : t.databasemanagementpanel594;
      setError(errorMessage);
    } finally {
      setCopying(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingSchema) return;

    // Require DELETE confirmation
    if (deleteConfirmText !== 'DELETE') {
      setError(t.databasemanagementpanel1016+'"DELETE"'+t.databasemanagementpanel1016_2);
      return;
    }

    setDeleting(true);
    setError('');

    try {
      // First attempt without force - to get deletion info.
      // We use apiClient.request directly because DELETE-with-body is unusual
      // (apiClient.delete doesn't accept a body); the backend route expects
      // the force_delete flag in the JSON body, so this matches the existing
      // contract.
      let result: any;
      try {
        result = await apiClient.request(`/schemas/${deletingSchema.id}`, {
          method: 'DELETE',
          body: JSON.stringify({ force_delete: false }),
        });
      } catch (err: any) {
        const data = err?.response?.data;
        if (data) {
          throw new Error(data.message || `HTTP ${err.response.status}`);
        }
        throw new Error(`${t.databasemanagementpanel1047}${err?.message || ''}`);
      }

      // If requires force confirmation, show the details and ask for force delete
      // Note: Backend returns 200 with requires_force flag to avoid browser console errors
      if (result.requires_force) {
        setDeleteInfo({
          projects_count: result.projects_count,
          versions_count: result.versions_count,
          tables_count: result.tables_count,
          requires_force: true
        });

        // Now do the force delete
        try {
          result = await apiClient.request(`/schemas/${deletingSchema.id}`, {
            method: 'DELETE',
            body: JSON.stringify({ force_delete: true }),
          });
        } catch (err: any) {
          const data = err?.response?.data;
          if (data) {
            throw new Error(data.message || `HTTP ${err.response.status}`);
          }
          throw new Error(`${t.databasemanagementpanel1077}${err?.message || ''}`);
        }
      }

      // Success!
      setShowDeleteModal(false);
      setDeletingSchema(null);
      setDeleteInfo(null);
      await loadMySchemas();
      await loadCommunitySchemas();
      setSuccess(`${t.databasemanagementpanel1092}"${deletingSchema.name}"${t.databasemanagementpanel1092_2}`);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : t.databasemanagementpanel683;
      setError(errorMessage);
    } finally {
      setDeleting(false);
    }
  };

  // Link Modal Functions
  const handleOpenLinkModal = async (schema: FloatingSchema) => {
    setSchemaToLink(schema);
    setLoadingProjects(true);
    setLinkModalVisible(true);

    try {
      // Load all user's projects
      let data: any;
      try {
        data = await apiClient.get('/projects');
      } catch {
        throw new Error(t.databasemanagementpanel1121);
      }
      setAllProjects(data.projects || []);

      // Get currently linked project IDs from schema
      const linkedIds = schema.projects?.map(p => p.id) || [];
      setLinkedProjectIds(linkedIds);

    } catch (error) {
      console.error(t.databasemanagementpanel1132, error);
      setError(t.databasemanagementpanel1133);
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
    if (!schemaToLink) return;

    try {
      try {
        await apiClient.put(`/schemas/${schemaToLink.id}/linked-projects`, {
          project_ids: linkedProjectIds,
        });
      } catch (err: any) {
        throw new Error(err?.response?.data?.message || t.databasemanagementpanel1168);
      }

      setSuccess(t.databasemanagementpanel1171);
      setLinkModalVisible(false);
      await loadMySchemas();
      await loadCommunitySchemas();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : t.databasemanagementpanel1176;
      setError(errorMessage);
    }
  };

  const actionTemplate = (schema: FloatingSchema) => {
    const projects = schema.projects || [];

    // Check if current project (from forceProjectId or context) is linked to this schema
    const currentProjectId = projectId; // This is forceProjectId || contextSelectedProject?.id
    const isLinkedToCurrentProject = currentProjectId ? projects.some(p => Number(p.id) === Number(currentProjectId)) : false;
    const currentProjectLink = currentProjectId ? projects.find(p => Number(p.id) === Number(currentProjectId)) : null;

    // Check ownership and permissions
    const isOwner = String(schema.owner_id) === String(currentUserId); // Explicit string conversion like PHP
    const isSystemSchema = schema.is_system_schema;
    const canEdit = isOwner || (isSystemUser && isSystemSchema); // Owner can edit, or System-User can edit System-Schemas
    const canDelete = isOwner; // Only owner can delete

    // If schema is locked, show only lock icon and unlock button
    if (schema.is_soft_locked) {
      return (
        <div className="flex items-center space-x-2">
          <i className="pi pi-lock text-red-500" title={t.databasemanagementpanel1199} />
          <Button
            icon={unlockingSchema && schemaToUnlock?.id === schema.id ? "pi pi-spinner pi-spin" : "pi pi-unlock"}
            label={t.databasemanagementpanel1202}
            className="p-button-rounded p-button-sm"
            style={{ backgroundColor: '#2563eb', borderColor: '#2563eb', color: 'white', fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
            tooltip={t.databasemanagementpanel1205}
            onClick={() => handleUnlockExpiredSchema(schema)}
            disabled={unlockingSchema}
          />
        </div>
      );
    }

    return (
      <div className="flex space-x-1">
        {filterByProject && currentProjectId ? (
          // When filtering by project: Show X if linked, Link button if not linked
          isLinkedToCurrentProject && currentProjectLink ? (
            <button
              className="inline-flex items-center justify-center w-10 h-10 text-white bg-red-600 hover:bg-red-700 rounded-full text-base font-medium transition-colors duration-200 border border-red-600 hover:border-red-700 shadow-sm hover:shadow-md"
              title={t.databasemanagementpanel1220}
              onClick={() => handleRemoveFromProject(schema, currentProjectLink.id)}
            >
              <i className="pi pi-times text-base"></i>
            </button>
          ) : (
            <Button
              icon="pi pi-link"
              className="p-button-rounded p-button-text p-button-sm"
              tooltip={t.databasemanagementpanel714}
              onClick={() => handleAssociateToProject(schema)}
            />
          )
        ) : (
          // When NOT filtering by project: Show multi-link button
          <>
            <Button
              icon="pi pi-link"
              className="p-button-rounded p-button-text p-button-sm p-button-success"
              tooltip={t.databasemanagementpanel1239}
              onClick={() => handleOpenLinkModal(schema)}
            />
          </>
        )}
        {canEdit && (
          <Button
            icon="pi pi-pencil"
            className="p-button-rounded p-button-text p-button-sm"
            tooltip={t.databasemanagementpanel743}
            onClick={() => handleEditSchema(schema)}
          />
        )}
        <Button
          icon="pi pi-copy"
          className="p-button-rounded p-button-text p-button-sm p-button-info"
          tooltip={t.databasemanagementpanel749}
          onClick={() => handleCopySchema(schema)}
        />
        {onOpenDesigner && (
          <Button
            icon="pi pi-sitemap"
            className="p-button-rounded p-button-text p-button-sm p-button-success"
            tooltip={t.databasemanagementpanel756}
            onClick={() => onOpenDesigner(schema.id, schema.name)}
          />
        )}
        <Button
          icon="pi pi-upload"
          className="p-button-rounded p-button-text p-button-sm"
          style={{ color: '#10b981' }}
          tooltip={t.panelsewnavigationpanel246}
          onClick={() => setSqlImportSchemaId(schema.id)}
        />
        <Button
          icon="pi pi-download"
          className="p-button-rounded p-button-text p-button-sm"
          style={{ color: '#f59e0b' }}
          tooltip={t.panelsewnavigationpanel251}
          onClick={() => setDbExportSchemaId(schema.id)}
        />
        <Button
          icon="pi pi-print"
          className="p-button-rounded p-button-text p-button-sm"
          style={{ color: '#3b82f6' }}
          tooltip="Print"
          onClick={() => { setShowPrintDialog(true); setPrintSchemaId(schema.id); }}
        />
        {canDelete && (
          <Button
            icon="pi pi-trash"
            className="p-button-rounded p-button-text p-button-sm p-button-danger"
            tooltip={t.databasemanagementpanel763}
            onClick={() => handleDeleteSchema(schema)}
          />
        )}
      </div>
    );
  };

  const visibilityOptions = [
    { label: t.databasemanagementpanel771, value: 'private' },
    { label: t.databasemanagementpanel772, value: 'public' }
  ];

  const associationTypeOptions = [
    { label: t.databasemanagementpanel776, value: 'linked' },
    { label: t.databasemanagementpanel777, value: 'cloned' },
    { label: t.databasemanagementpanel778, value: 'imported' }
  ];

  // No global loading screen - show loading per table

  return (
    <div className="database-management-panel flex flex-col h-full overflow-hidden" style={{
      backgroundColor: colors.bgPrimary,
      color: colors.textPrimary,
      '--theme-bg-primary': colors.bgPrimary,
      '--theme-bg-secondary': colors.bgSecondary,
      '--theme-bg-tertiary': colors.bgTertiary,
      '--theme-text-primary': colors.textPrimary,
      '--theme-text-muted': colors.textMuted,
      '--theme-border-primary': colors.borderPrimary,
      '--theme-accent': colors.accent,
      '--theme-dialog-header': colors.dialogHeader,
    } as React.CSSProperties}>
      <div className="flex-shrink-0 p-6 pb-0">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <i className="pi pi-database text-2xl" style={{ color: colors.accent }}></i>
          <h1 className="text-2xl font-bold" style={{ color: colors.textPrimary }}>{t.databasemanagementpanel798}</h1>
        </div>
        <div className="flex space-x-2 gap-2">
          <Button
            icon="pi pi-plus"
            label={t.databasemanagementpanel803}
            className="p-button-text"
            style={{ borderRadius: '8px', paddingTop: '6px', paddingBottom: '6px' }}
            onClick={handleCreateSchemaClick}
            disabled={mySchemasLoading || communityLoading}
          />
          <Button
            icon="pi pi-download"
            label={t.databasemanagementpanel886}
            className="p-button-text"
            style={{ borderRadius: '8px', paddingTop: '6px', paddingBottom: '6px' }}
            onClick={() => {
              // Pre-select only the languages enabled for THIS project
              // (from project settings) instead of all globally active ones.
              // If the project hasn't pinned a list, fall back to all langs.
              const projectLangs = contextSelectedProject?.enabled_languages;
              if (Array.isArray(projectLangs) && projectLangs.length > 0) {
                setSelectedLanguages(projectLangs);
              } else {
                setSelectedLanguages(languages.map(l => l.code));
              }
              setShowExportDialog(true);
            }}
            disabled={exporting || !contextSelectedProject}
            tooltip={contextSelectedProject ? `${t.databasemanagementpanel876} — ${contextSelectedProject.name}` : t.databasemanagementpanel876}
            tooltipOptions={{ position: 'bottom' }}
          />
          <Button
            icon="pi pi-upload"
            label={t.databasemanagementpanel893}
            className="p-button-text"
            style={{ borderRadius: '8px', paddingTop: '6px', paddingBottom: '6px' }}
            onClick={() => { resetImportState(); setShowImportDialog(true); }}
            disabled={importing || !contextSelectedProject}
            tooltip={contextSelectedProject ? `${t.databasemanagementpanel876} — ${contextSelectedProject.name}` : t.databasemanagementpanel876}
            tooltipOptions={{ position: 'bottom' }}
          />
          <Button
            icon="pi pi-refresh"
            label={t.applicationsmodal313}
            className="p-button-text"
            style={{ borderRadius: '8px', paddingTop: '6px', paddingBottom: '6px' }}
            onClick={() => {
              loadMySchemas();
              loadCommunitySchemas();
            }}
            disabled={mySchemasLoading || communityLoading}
          />
        </div>
      </div>

        {error && (
          <Message severity="error" text={error} className="mb-4" />
        )}

        {success && (
          <Message severity="success" text={success} className="mb-4" />
        )}
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        {/* MY SCHEMAS TABLE */}
        <Card title={t.databasemanagementpanel1346} className="mb-4" style={{ backgroundColor: colors.bgSecondary, border: `1px solid ${colors.borderPrimary}` }}>
        <div className="flex justify-between items-center mb-4">
          <div className="flex gap-2">
            {/* Type Filter - show 'system' option only for system/admin users */}
            <Dropdown
              value={myTypeFilter}
              options={[
                { label: t.databasemanagementpanel1353, value: 'all' },
                { label: t.databasemanagementpanel1354, value: 'private' },
                { label: t.databasemanagementpanel1355, value: 'public' },
                ...(isSystemUser ? [{ label: t.databasemanagementpanel1356, value: 'system' }] : [])
              ]}
              onChange={(e) => setMyTypeFilter(e.value)}
              placeholder={t.databasemanagementpanel1359}
              className="w-32"
              panelClassName="database-dropdown-panel"
            />
            <InputText
              value={mySearchTerm}
              onChange={(e) => setMySearchTerm(e.target.value)}
              placeholder={t.databasemanagementpanel1366}
              className="w-64"
            />
          </div>
        </div>
        <DataTable
          value={mySchemas}
          loading={mySchemasLoading}
          className="p-datatable-sm"
          emptyMessage={t.databasemanagementpanel1375}
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 20, 50]}
        >
          <Column field="name" header={t.databasemanagementpanel840} body={nameTemplate} sortable />
          <Column field="description" header={t.createteammodal103} />
          <Column
            header={t.databasemanagementpanel1383}
            body={statusTemplate}
            className="w-28"
          />
          <Column
            header={t.databasemanagementpanel843}
            body={projectsTemplate}
            className="w-60"
          />
          <Column
            field={t.templatemanagementpanel961}
            header={t.databasemanagementpanel849}
            body={visibilityTemplate}
            className="w-24"
          />
          <Column
            field="owner"
            header={t.manageteammodal320}
            body={ownerTemplate}
            className="w-40"
          />
          <Column
            field="created_at"
            header={t.databasemanagementpanel861}
            body={(schema) => formatDate(schema.created_at)}
            className="w-32"
            sortable
          />
          <Column
            header={t.applicationsmodal354}
            body={actionTemplate}
            className="w-60"
          />
        </DataTable>
      </Card>

      {/* COMMUNITY SCHEMAS TABLE */}
      <Card title={t.databasemanagementpanel1420} className="mb-4" style={{ backgroundColor: colors.bgSecondary, border: `1px solid ${colors.borderPrimary}` }}>
        <div className="flex justify-between items-center mb-4">
          <div className="flex gap-2">
            <Dropdown
              value={communityTypeFilter}
              options={[
                { label: t.databasemanagementpanel1426, value: 'all' },
                { label: t.databasemanagementpanel1427, value: 'system' },
                { label: t.databasemanagementpanel1428, value: 'public' }
              ]}
              onChange={(e) => setCommunityTypeFilter(e.value)}
              placeholder={t.databasemanagementpanel1431}
              className="w-32"
              panelClassName="database-dropdown-panel"
            />
            <InputText
              value={communitySearchTerm}
              onChange={(e) => setCommunitySearchTerm(e.target.value)}
              placeholder={t.databasemanagementpanel1438}
              className="w-64"
            />
          </div>
        </div>
        <DataTable
          value={communitySchemas}
          loading={communityLoading}
          className="p-datatable-sm"
          emptyMessage={t.databasemanagementpanel1447}
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 20, 50]}
        >
          <Column field="name" header={t.databasemanagementpanel840} body={nameTemplate} sortable />
          <Column field="description" header={t.createteammodal103} />
          <Column
            header={t.databasemanagementpanel1455}
            body={statusTemplate}
            className="w-28"
          />
          <Column
            header={t.databasemanagementpanel843}
            body={projectsTemplate}
            className="w-60"
          />
          <Column
            field={t.templatemanagementpanel961}
            header={t.databasemanagementpanel849}
            body={visibilityTemplate}
            className="w-24"
          />
          <Column
            field="owner"
            header={t.manageteammodal320}
            body={ownerTemplate}
            className="w-40"
          />
          <Column
            field="created_at"
            header={t.databasemanagementpanel861}
            body={(schema) => formatDate(schema.created_at)}
            className="w-32"
            sortable
          />
          <Column
            header={t.applicationsmodal354}
            body={actionTemplate}
            className="w-60"
          />
        </DataTable>
      </Card>

      {/* Create Schema Modal */}
      <Dialog
        header={t.databasemanagementpanel905}
        visible={showCreateModal}
        onHide={() => setShowCreateModal(false)}
        style={{ width: '750px' }}
        modal
        closable
        draggable={true}
        resizable={true}
        contentStyle={{ backgroundColor: colors.bgPrimary, color: colors.textPrimary }}
        headerStyle={{ backgroundColor: colors.dialogHeader, color: colors.textPrimary }}
        className="database-create-modal"
      >
        <div className="space-y-4">
          <div className="field">
            <label className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>
              {t.databasemanagementpanel1537}
            </label>
            <InputText
              value={createForm.name}
              onChange={(e) => {
                // Sanitize: only allow lowercase letters, numbers, and underscores
                const sanitized = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
                setCreateForm(prev => ({ ...prev, name: sanitized }));
              }}
              placeholder={t.databasemanagementpanel923}
              className="w-full"
              disabled={creating}
              required
            />
            <small className="mt-1 block" style={{ color: colors.textMuted }}>
              {t.databasemanagementpanel1552}
            </small>
          </div>

          <div className="field">
            <label className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>
              {t.databasemanagementpanel1558}
            </label>
            <InputTextarea
              value={createForm.description}
              onChange={(e) => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
              placeholder={t.databasemanagementpanel937}
              className="w-full"
              rows={3}
              disabled={creating}
            />
          </div>

          {/* MySQL charset & collation — same UX as the edit modal. Defaults
              shown are sensible cross-version picks; the SQL importer will
              overwrite them later if the dump carries CREATE DATABASE info. */}
          <div className="grid grid-cols-2 gap-3">
            <div className="field">
              <label className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>
                Default Charset
              </label>
              <input
                type="text"
                value={createForm.default_charset}
                onChange={(e) => setCreateForm(prev => ({ ...prev, default_charset: e.target.value.trim() }))}
                placeholder="utf8mb4"
                className="w-full px-3 py-2 border rounded"
                style={{ background: colors.bgPrimary, color: colors.textPrimary, borderColor: colors.borderPrimary }}
                disabled={creating}
                maxLength={32}
              />
              <small className="block mt-1" style={{ color: colors.textMuted }}>
                e.g. utf8mb4, latin1
              </small>
            </div>
            <div className="field">
              <label className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>
                Default Collation
              </label>
              <input
                type="text"
                value={createForm.default_collation}
                onChange={(e) => setCreateForm(prev => ({ ...prev, default_collation: e.target.value.trim() }))}
                placeholder="utf8mb4_unicode_ci"
                className="w-full px-3 py-2 border rounded"
                style={{ background: colors.bgPrimary, color: colors.textPrimary, borderColor: colors.borderPrimary }}
                disabled={creating}
                maxLength={64}
              />
              <small className="block mt-1" style={{ color: colors.textMuted }}>
                e.g. utf8mb4_unicode_ci, utf8mb4_0900_ai_ci, utf8mb4_bin
              </small>
            </div>
          </div>

          <div className="field">
            <label className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>
              {t.databasemanagementpanel1572}
            </label>
            <Dropdown
              value={createForm.visibility}
              onChange={(e) => setCreateForm(prev => ({ ...prev, visibility: e.value }))}
              options={visibilityOptions}
              placeholder={t.databasemanagementpanel952}
              className="w-full"
              disabled={creating}
              panelClassName="database-dropdown-panel"
            />
            <small style={{ color: colors.textMuted }}>
              {t.databasemanagementpanel1584}
            </small>
          </div>

          {/* System Schema Checkbox - only for system/admin users */}
          {isSystemUser && (
            <div className="field flex items-center gap-2">
              <input
                type="checkbox"
                id="is_system_schema"
                checked={createForm.is_system_schema}
                onChange={(e) => setCreateForm(prev => ({ ...prev, is_system_schema: e.target.checked }))}
                className="w-4 h-4 cursor-pointer"
                disabled={creating}
              />
              <label htmlFor="is_system_schema" className="text-sm font-medium cursor-pointer" style={{ color: colors.textPrimary }}>
                {t.databasemanagementpanel1600}
              </label>
              <small className="ml-2" style={{ color: colors.textMuted }}>
                {t.databasemanagementpanel1603}
              </small>
            </div>
          )}

          {/* Project Assignment - Only show user's OWN projects (not team projects) */}
          <div className="field">
            <label className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>
              {t.createteammodal117} <span className="text-xs" style={{ color: colors.textMuted }}>(optional)</span>
            </label>
            <MultiSelect
              value={createForm.project_ids}
              onChange={(e) => setCreateForm(prev => ({ ...prev, project_ids: e.value }))}
              options={contextProjects
                .filter(p => Number(p.owner_id) === Number(currentUserId)) // Only own projects
                .map(p => ({ label: p.name, value: p.id }))}
              placeholder={t.databasemanagementpanel1619}
              className="w-full"
              disabled={creating}
              display="chip"
              filter
              showClear
              maxSelectedLabels={3}
              selectedItemsLabel={`{0}${t.databasemanagementpanel1626}`}
              panelClassName="database-multiselect-panel"
            />
            <small style={{ color: colors.textMuted }}>
              {t.databasemanagementpanel1630}
            </small>
          </div>

          <div className="flex justify-end space-x-2 pt-4 gap-2">
            <Button
              label={t.applicationsmodal432}
              icon="pi pi-times"
              onClick={() => setShowCreateModal(false)}
              className="p-button-text"
              disabled={creating}
            />
            <Button
              label={creating ? t.createtablemodal614 : t.databasemanagementpanel970}
              icon={creating ? "pi pi-spinner pi-spin" : "pi pi-plus"}
              onClick={handleCreateSchema}
              disabled={creating || !createForm.name.trim()}
            />
          </div>
        </div>
      </Dialog>

      {/* Edit Schema Modal */}
      <Dialog
        header={t.databasemanagementpanel981}
        visible={showEditModal}
        onHide={() => setShowEditModal(false)}
        style={{ width: '750px' }}
        modal
        closable
        draggable={true}
        resizable={true}
        className="database-edit-modal"
        contentStyle={{ backgroundColor: colors.bgPrimary, color: colors.textPrimary }}
        headerStyle={{ backgroundColor: colors.dialogHeader, color: colors.textPrimary }}
      >
        <div className="space-y-4">
          <div className="field">
            <label className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>
              {t.databasemanagementpanel1669}
            </label>
            <InputText
              value={editForm.name}
              onChange={(e) => {
                // Sanitize: only allow lowercase letters, numbers, and underscores
                const sanitized = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
                setEditForm(prev => ({ ...prev, name: sanitized }));
              }}
              placeholder={t.databasemanagementpanel923}
              className="w-full"
              disabled={saving}
              required
            />
            <small className="mt-1 block" style={{ color: colors.textMuted }}>
              {t.databasemanagementpanel1684}
            </small>
          </div>

          <div className="field">
            <label className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>
              {t.databasemanagementpanel1690}
            </label>
            <InputTextarea
              value={editForm.description}
              onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
              placeholder={t.databasemanagementpanel937}
              className="w-full"
              rows={3}
              disabled={saving}
            />
          </div>

          {/* MySQL character set & collation. Free-text inputs because valid
              values differ between MySQL 5.x (no _0900_) and 9.x. The export
              echoes whatever the user enters back into every CREATE TABLE
              trailer; defaults shown are sensible cross-version picks. */}
          <div className="grid grid-cols-2 gap-3">
            <div className="field">
              <label className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>
                Default Charset
              </label>
              <input
                type="text"
                value={editForm.default_charset}
                onChange={(e) => setEditForm(prev => ({ ...prev, default_charset: e.target.value.trim() }))}
                placeholder="utf8mb4"
                className="w-full px-3 py-2 border rounded"
                style={{ background: colors.bgPrimary, color: colors.textPrimary, borderColor: colors.borderPrimary }}
                disabled={saving}
                maxLength={32}
              />
              <small className="block mt-1" style={{ color: colors.textMuted }}>
                e.g. utf8mb4, latin1
              </small>
            </div>
            <div className="field">
              <label className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>
                Default Collation
              </label>
              <input
                type="text"
                value={editForm.default_collation}
                onChange={(e) => setEditForm(prev => ({ ...prev, default_collation: e.target.value.trim() }))}
                placeholder="utf8mb4_unicode_ci"
                className="w-full px-3 py-2 border rounded"
                style={{ background: colors.bgPrimary, color: colors.textPrimary, borderColor: colors.borderPrimary }}
                disabled={saving}
                maxLength={64}
              />
              <small className="block mt-1" style={{ color: colors.textMuted }}>
                e.g. utf8mb4_unicode_ci, utf8mb4_0900_ai_ci, utf8mb4_bin
              </small>
            </div>
          </div>

          <div className="field">
            <label className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>
              {t.databasemanagementpanel1704}
            </label>
            <Dropdown
              value={editForm.visibility}
              onChange={(e) => setEditForm(prev => ({ ...prev, visibility: e.value }))}
              options={visibilityOptions}
              placeholder={t.databasemanagementpanel952}
              className="w-full"
              disabled={saving}
              panelClassName="database-dropdown-panel"
            />
          </div>

          {/* System Schema Checkbox - only for system/admin users */}
          {isSystemUser && (
            <div className="field flex items-center gap-2">
              <input
                type="checkbox"
                id="edit_is_system_schema"
                checked={editForm.is_system_schema}
                onChange={(e) => setEditForm(prev => ({ ...prev, is_system_schema: e.target.checked }))}
                className="w-4 h-4 cursor-pointer"
                disabled={saving}
              />
              <label htmlFor="edit_is_system_schema" className="text-sm font-medium cursor-pointer" style={{ color: colors.textPrimary }}>
                {t.databasemanagementpanel1729}
              </label>
              <small className="ml-2" style={{ color: colors.textMuted }}>
                {t.databasemanagementpanel1732}
              </small>
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-4 gap-2">
            <Button
              label={t.applicationsmodal432}
              icon="pi pi-times"
              onClick={() => setShowEditModal(false)}
              className="p-button-text"
              disabled={saving}
            />
            <Button
              label={saving ? t.updating : t.databasemanagementpanel1043}
              icon={saving ? "pi pi-spinner pi-spin" : "pi pi-check"}
              onClick={handleUpdateSchema}
              disabled={saving || !editForm.name.trim()}
            />
          </div>
        </div>
      </Dialog>

      {/* Associate to Project Modal */}
      <Dialog
        header={t.databasemanagementpanel1054}
        visible={showAssociateModal}
        onHide={() => setShowAssociateModal(false)}
        style={{ width: '500px' }}
        modal
        closable
        draggable={true}
        resizable={true}
        className="database-associate-modal"
        contentStyle={{ backgroundColor: colors.bgPrimary, color: colors.textPrimary }}
        headerStyle={{ backgroundColor: colors.dialogHeader, color: colors.textPrimary }}
      >
        <div className="space-y-4">
          <div className="p-3 rounded" style={{ backgroundColor: colors.infoBg, border: `1px solid ${colors.infoBorder}` }}>
            <h4 className="font-medium mb-1" style={{ color: colors.infoText }}>
              {associatingSchema?.name}
            </h4>
            <p className="text-sm" style={{ color: colors.infoText, opacity: 0.9 }}>
              {associatingSchema?.description || t.schemaexportcontroller226}
            </p>
          </div>

          {/* Only show project dropdown if no forceProjectId (not from TreeView) */}
          {!forceProjectId && (
            <div className="field">
              <label className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>
                {t.databasemanagementpanel1783}
              </label>
              <Dropdown
                value={selectedProjectForAssociation}
                onChange={(e) => setSelectedProjectForAssociation(e.value)}
                options={projects.map(p => ({ label: p.name, value: p.id }))}
                placeholder={t.databasemanagementpanel1084}
                className="w-full"
                disabled={associating}
                panelClassName="database-dropdown-panel"
              />
            </div>
          )}

          {/* Show project name if forceProjectId is set */}
          {forceProjectId && forceProjectName && (
            <div className="p-3 rounded" style={{ backgroundColor: colors.successBg, border: `1px solid ${colors.successBorder}` }}>
              <label className="block text-sm font-medium mb-1" style={{ color: colors.successText }}>
                {t.databasemanagementpanel1801}
              </label>
              <p className="text-base font-semibold" style={{ color: colors.successText }}>
                {forceProjectName}
              </p>
            </div>
          )}

          <div className="field">
            <label className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>
              {t.databasemanagementpanel1811}
            </label>
            <Dropdown
              value={associationType}
              onChange={(e) => setAssociationType(e.value)}
              options={associationTypeOptions}
              className="w-full"
              disabled={associating}
              panelClassName="database-dropdown-panel"
            />
          </div>

          <div className="field">
            <label className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>
              {t.databasemanagementpanel1825}
            </label>
            <InputText
              value={alias}
              onChange={(e) => setAlias(e.target.value)}
              placeholder={t.databasemanagementpanel1123}
              className="w-full"
              disabled={associating}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4 gap-2">
            <Button
              label={t.applicationsmodal432}
              icon="pi pi-times"
              onClick={() => setShowAssociateModal(false)}
              className="p-button-text"
              disabled={associating}
            />
            <Button
              label={associating ? t.databasemanagementpanel1845 : t.databasemanagementpanel1138}
              icon={associating ? "pi pi-spinner pi-spin" : "pi pi-link"}
              onClick={handleConfirmAssociation}
              disabled={associating || !selectedProjectForAssociation}
            />
          </div>
        </div>
      </Dialog>

      {/* Delete Schema Modal */}
      <Dialog
        header={`${t.databasemanagementpanel1856}${deletingSchema?.name}`}
        visible={showDeleteModal}
        onHide={() => setShowDeleteModal(false)}
        style={{ width: '500px' }}
        modal
        closable={!deleting}
        draggable={true}
        resizable={true}
        className="database-delete-modal"
        contentStyle={{ backgroundColor: colors.bgPrimary, color: colors.textPrimary }}
        headerStyle={{ backgroundColor: colors.dialogHeader, color: colors.textPrimary }}
      >
        <div className="space-y-4">
          <div className="p-4 rounded" style={{ backgroundColor: colors.errorBg, border: `1px solid ${colors.errorBorder}` }}>
            <div className="flex items-center mb-2">
              <i className="pi pi-exclamation-triangle mr-2" style={{ color: colors.errorText }}></i>
              <h4 className="font-bold" style={{ color: colors.errorText }}>{t.databasemanagementpanel1163}</h4>
            </div>
            <p className="text-sm mb-3" style={{ color: colors.errorText }}>
              {t.databasemanagementpanel1875}<strong>{t.databasemanagementpanel1875_2}</strong>{t.databasemanagementpanel1875_3}
            </p>

            {deleteInfo && (
              <ul className="text-sm space-y-1 mb-3" style={{ color: colors.errorText }}>
                <li>🗂️ <strong>{deleteInfo.versions_count}</strong>{t.databasemanagementpanel1880}</li>
                <li>🏗️ <strong>{deleteInfo.tables_count}</strong>{t.databasemanagementpanel1881}</li>
                <li>🔗 <strong>{deleteInfo.projects_count}</strong>{t.databasemanagementpanel1882}</li>
                <li>{t.databasemanagementpanel1883}</li>
                <li>{t.databasemanagementpanel1884}</li>
              </ul>
            )}

            <p className="font-medium text-sm" style={{ color: colors.errorText }}>
              <u>{t.databasemanagementpanel1889}</u>!
            </p>
          </div>

          <div className="field">
            <label className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>
              {t.databasemanagementpanel1895}<strong>"DELETE"</strong>{t.databasemanagementpanel1895_2}
            </label>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="DELETE"
              className="w-full px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-red-500"
              style={{
                backgroundColor: colors.bgTertiary,
                color: colors.textPrimary,
                border: `1px solid ${colors.borderPrimary}`
              }}
              disabled={deleting}
              autoComplete="off"
            />
            <small style={{ color: colors.textMuted }}>
              {t.databasemanagementpanel1912}"DELETE"{t.databasemanagementpanel1912_2}
            </small>
          </div>

          {error && (
            <div className="p-3 rounded text-sm" style={{ backgroundColor: colors.errorBg, border: `1px solid ${colors.errorBorder}`, color: colors.errorText }}>
              {error}
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-4 gap-2">
            <Button
              label={t.applicationsmodal432}
              icon="pi pi-times"
              onClick={() => setShowDeleteModal(false)}
              className="p-button-text"
              disabled={deleting}
            />
            <Button
              label={deleting ? t.deleting : t.databasemanagementpanel1217}
              icon={deleting ? "pi pi-spinner pi-spin" : "pi pi-trash"}
              onClick={handleConfirmDelete}
              className="p-button-danger"
              disabled={deleting || deleteConfirmText !== 'DELETE'}
            />
          </div>
        </div>
      </Dialog>

      {/* Export Translations Dialog */}
      <Dialog
        header={t.databasemanagementpanel1229}
        visible={showExportDialog}
        onHide={() => setShowExportDialog(false)}
        style={{ width: '500px' }}
        modal
        closable
        draggable={true}
        resizable={true}
        className="database-export-modal"
        contentStyle={{ backgroundColor: colors.bgPrimary, color: colors.textPrimary }}
        headerStyle={{ backgroundColor: colors.dialogHeader, color: colors.textPrimary }}
      >
        <div className="space-y-4">
          <div className="p-3 rounded" style={{ backgroundColor: colors.infoBg, border: `1px solid ${colors.infoBorder}` }}>
            <h4 className="font-medium mb-1" style={{ color: colors.infoText }}>
              {t.databasemanagementpanel1958}{contextSelectedProject?.name}
            </h4>
            <p className="text-sm" style={{ color: colors.infoText, opacity: 0.9 }}>
              {t.databasemanagementpanel1961}
            </p>
          </div>

          <div className="field">
            <label className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>
              {t.databasemanagementpanel1967}
            </label>
            <MultiSelect
              value={selectedLanguages}
              onChange={(e) => setSelectedLanguages(e.value)}
              options={languages.map(lang => ({ label: `${lang.name} (${lang.code.toUpperCase()})`, value: lang.code }))}
              placeholder={t.databasemanagementpanel1257}
              className="w-full"
              disabled={exporting}
              display="chip"
              panelClassName="database-multiselect-panel"
            />
            <small style={{ color: colors.textMuted }}>
              {t.databasemanagementpanel1980}
            </small>
          </div>

          {error && (
            <Message severity="error" text={error} />
          )}

          <div className="flex justify-end space-x-2 pt-4 gap-2">
            <Button
              label={t.applicationsmodal432}
              icon="pi pi-times"
              onClick={() => setShowExportDialog(false)}
              className="p-button-text"
              disabled={exporting}
            />
            <Button
              label={exporting ? t.databasemanagementpanel1997 : t.databasemanagementpanel1280}
              icon={exporting ? "pi pi-spinner pi-spin" : "pi pi-download"}
              onClick={handleExportTranslations}
              disabled={exporting || selectedLanguages.length === 0}
              className="p-button-success"
            />
          </div>
        </div>
      </Dialog>

      {/* Import Translations Dialog */}
      <Dialog
        header={t.databasemanagementpanel1292}
        visible={showImportDialog}
        onHide={() => { setShowImportDialog(false); resetImportState(); }}
        style={{ width: '560px' }}
        modal
        closable
        draggable={true}
        resizable={true}
        className="database-import-modal"
        contentStyle={{ backgroundColor: colors.bgPrimary, color: colors.textPrimary }}
        headerStyle={{ backgroundColor: colors.dialogHeader, color: colors.textPrimary }}
      >
        <div className="space-y-4">
          <div className="p-3 rounded" style={{ backgroundColor: colors.successBg, border: `1px solid ${colors.successBorder}` }}>
            <h4 className="font-medium mb-1" style={{ color: colors.successText }}>
              {t.databasemanagementpanel2024}{contextSelectedProject?.name}
            </h4>
            <p className="text-sm" style={{ color: colors.successText, opacity: 0.9 }}>
              {t.databasemanagementpanel2027}
            </p>
          </div>

          <div className="field">
            <label className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>
              {t.databasemanagementpanel2033}
            </label>
            <FileUpload
              mode="basic"
              name="file"
              accept=".xlsx,.xls"
              maxFileSize={10000000}
              customUpload
              uploadHandler={handleImportFileSelected}
              auto={true}
              chooseLabel={importFile ? importFile.name : t.databasemanagementpanel1324}
              disabled={importing || importPreviewLoading}
            />
            <small style={{ color: colors.textMuted }}>
              {t.databasemanagementpanel2047}
            </small>
          </div>

          {importPreviewLoading && (
            <div className="flex items-center gap-2 text-sm" style={{ color: colors.textMuted }}>
              <i className="pi pi-spin pi-spinner"></i>
              <span>Reading languages from file...</span>
            </div>
          )}

          {importPreviewError && (
            <Message severity="error" text={importPreviewError} />
          )}

          {importFile && !importPreviewLoading && !importPreviewError && importDetectedLanguages.length > 0 && (
            <div className="field">
              <label className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>
                Languages found in file ({importDataRows} rows):
              </label>
              <div className="space-y-2 p-3 rounded" style={{ backgroundColor: colors.bgTertiary, border: `1px solid ${colors.borderPrimary}` }}>
                {importDetectedLanguages.map(code => {
                  const lang = languages.find(l => l.code === code);
                  const checked = importSelectedLanguages.includes(code);
                  return (
                    <label key={code} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setImportSelectedLanguages([...importSelectedLanguages, code]);
                          } else {
                            setImportSelectedLanguages(importSelectedLanguages.filter(c => c !== code));
                          }
                        }}
                        className="w-4 h-4 cursor-pointer"
                        disabled={importing}
                      />
                      <span style={{ color: colors.textPrimary }}>
                        {lang ? `${lang.name} (${code.toUpperCase()})` : code.toUpperCase()}
                      </span>
                    </label>
                  );
                })}
              </div>
              <small style={{ color: colors.textMuted }}>
                Only ticked languages will be imported. Untick languages you don't want to overwrite.
              </small>
            </div>
          )}

          {importFile && !importPreviewLoading && !importPreviewError && importDetectedLanguages.length === 0 && (
            <Message severity="warn" text="No language columns detected in this file (expected language codes from column E onwards)." />
          )}

          {error && (
            <Message severity="error" text={error} />
          )}

          <div className="flex justify-end space-x-2 pt-4 gap-2">
            <Button
              label={t.applicationsmodal432}
              icon="pi pi-times"
              onClick={() => { setShowImportDialog(false); resetImportState(); }}
              className="p-button-text"
              disabled={importing}
            />
            <Button
              label={importing ? t.databasemanagementpanel_importing : t.databasemanagementpanel_import_from_excel}
              icon={importing ? 'pi pi-spinner pi-spin' : 'pi pi-upload'}
              onClick={handleImportConfirm}
              disabled={importing || importPreviewLoading || !importFile || importSelectedLanguages.length === 0}
              className="p-button-success"
            />
          </div>
        </div>
      </Dialog>

      {/* Copy Schema Modal */}
      <Dialog
        header={t.databasemanagementpanel1350}
        visible={showCopyModal}
        onHide={() => setShowCopyModal(false)}
        style={{ width: '500px' }}
        modal
        closable
        draggable={true}
        resizable={true}
        className="database-copy-modal"
        contentStyle={{ backgroundColor: colors.bgPrimary, color: colors.textPrimary }}
        headerStyle={{ backgroundColor: colors.dialogHeader, color: colors.textPrimary }}
      >
        <div className="space-y-4">
          <div className="p-3 rounded" style={{ backgroundColor: colors.infoBg, border: `1px solid ${colors.infoBorder}` }}>
            <h4 className="font-medium mb-1" style={{ color: colors.infoText }}>
              {t.databasemanagementpanel2084}{copyingSchema?.name}
            </h4>
            <p className="text-sm" style={{ color: colors.infoText, opacity: 0.9 }}>
              {t.databasemanagementpanel2087}
            </p>
          </div>

          <div className="field">
            <label className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>
              {t.databasemanagementpanel2093}
            </label>
            <InputText
              value={copyName}
              onChange={(e) => setCopyName(sanitizeSchemaName(e.target.value))}
              placeholder={t.databasemanagementpanel1377}
              className="w-full"
              disabled={copying}
              required
            />
            <small className="block" style={{ color: colors.textMuted }}>
              {t.databasemanagementpanel2104}
            </small>
            <small className="block" style={{ color: colors.textMuted }}>
              Allowed characters: a–z, 0–9, _ (no spaces, dashes or special characters)
            </small>
          </div>

          {error && (
            <div className="p-3 rounded text-sm" style={{ backgroundColor: colors.errorBg, border: `1px solid ${colors.errorBorder}`, color: colors.errorText }}>
              {error}
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-4 gap-2">
            <Button
              label={t.applicationsmodal432}
              icon="pi pi-times"
              onClick={() => setShowCopyModal(false)}
              className="p-button-text"
              disabled={copying}
            />
            <Button
              label={copying ? t.databasemanagementpanel2123 : t.databasemanagementpanel1402}
              icon={copying ? "pi pi-spinner pi-spin" : "pi pi-copy"}
              onClick={handleConfirmCopy}
              disabled={copying || !copyName.trim()}
              className="p-button-info"
            />
          </div>
        </div>
      </Dialog>

      {/* Link Schema to Projects Modal */}
      <Dialog
        header={`${t.databasemanagementpanel2135}${schemaToLink?.name}`}
        visible={linkModalVisible}
        onHide={() => setLinkModalVisible(false)}
        footer={
          <>
            <Button
              onClick={() => setLinkModalVisible(false)}
              className="p-button-secondary"
            >
              {t.databasemanagementpanel2144}
            </Button>
            <Button
              onClick={handleApplyProjectLinks}
              className="p-button-primary"
              disabled={loadingProjects}
            >
              {t.databasemanagementpanel2151}
            </Button>
          </>
        }
        style={{ width: '600px' }}
        modal
        closable
        draggable={true}
        resizable={true}
        contentStyle={{ backgroundColor: colors.bgPrimary, color: colors.textPrimary }}
        headerStyle={{ backgroundColor: colors.dialogHeader, color: colors.textPrimary }}
        className="database-link-modal"
      >
        {loadingProjects ? (
          <div className="flex justify-center items-center py-8">
            <i className="pi pi-spin pi-spinner text-4xl" style={{ color: colors.accent }}></i>
          </div>
        ) : (
          <div className="space-y-2">
            {allProjects.length === 0 ? (
              <div className="text-center py-4" style={{ color: colors.textMuted }}>
                {t.databasemanagementpanel2172}
              </div>
            ) : (
              allProjects.map((project) => (
                <div
                  key={project.id}
                  className="flex items-center justify-between p-3 rounded cursor-pointer database-link-item"
                  style={{ border: `1px solid ${colors.borderPrimary}` }}
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

      {/* Schema Unlock Modal - Shows before creating 2nd database as Free user */}
      <ProjectUnlockModal
        visible={showSchemaUnlockModal}
        onHide={() => setShowSchemaUnlockModal(false)}
        onConfirm={handleSchemaUnlockConfirm}
        onBuyCredits={handleBuyCredits}
        onUpgradePatron={() => { setPlanModalInitialTab(0); setShowPlanModal(true); }}
        currentCredits={currentUser?.credits || 0}
        creditCost={50}
        resourceType="database"
        currentCount={mySchemas.filter(s => Number(s.owner_id) === Number(currentUser?.id)).length}
        maxFreeCount={1}
      />

      {/* Plan Modal - For buying credits or upgrading subscription */}
      <PlanModal
        visible={showPlanModal}
        onHide={() => setShowPlanModal(false)}
        initialTab={planModalInitialTab}
      />

      {/* Theme-aware styles for PrimeReact components */}
      <style>{`
        .database-management-panel .p-card .p-card-title {
          color: var(--theme-text-primary);
        }
        .database-management-panel .p-card .p-card-content {
          color: var(--theme-text-primary);
        }
        .database-management-panel .p-inputtext {
          background-color: var(--theme-bg-tertiary);
          border-color: var(--theme-border-primary);
          color: var(--theme-text-primary);
        }
        .database-management-panel .p-inputtext:hover {
          border-color: var(--theme-accent);
        }
        .database-management-panel .p-inputtext:focus {
          border-color: var(--theme-accent);
          box-shadow: 0 0 0 1px var(--theme-accent);
        }
        .database-management-panel .p-inputtext::placeholder {
          color: var(--theme-text-muted);
        }
        .database-management-panel .p-dropdown {
          background-color: var(--theme-bg-tertiary);
          border-color: var(--theme-border-primary);
          color: var(--theme-text-primary);
        }
        .database-management-panel .p-dropdown:hover {
          border-color: var(--theme-accent);
        }
        .database-management-panel .p-dropdown .p-dropdown-label {
          color: var(--theme-text-primary);
        }
        .database-management-panel .p-dropdown .p-dropdown-trigger {
          color: var(--theme-text-muted);
        }
        /* Dropdown Panel - rendered as portal */
        .database-dropdown-panel {
          background-color: var(--theme-bg-secondary) !important;
          border-color: var(--theme-border-primary) !important;
        }
        .database-dropdown-panel .p-dropdown-items {
          background-color: var(--theme-bg-secondary) !important;
        }
        .database-dropdown-panel .p-dropdown-item {
          color: var(--theme-text-primary) !important;
          background-color: var(--theme-bg-secondary) !important;
        }
        .database-dropdown-panel .p-dropdown-item:hover {
          background-color: var(--theme-bg-tertiary) !important;
        }
        .database-dropdown-panel .p-dropdown-item.p-highlight {
          background-color: var(--theme-accent) !important;
          color: white !important;
        }
        /* MultiSelect Panel - rendered as portal */
        .database-multiselect-panel {
          background-color: var(--theme-bg-secondary) !important;
          border-color: var(--theme-border-primary) !important;
        }
        .database-multiselect-panel .p-multiselect-header {
          background-color: var(--theme-bg-secondary) !important;
          border-color: var(--theme-border-primary) !important;
          color: var(--theme-text-primary) !important;
        }
        .database-multiselect-panel .p-multiselect-header .p-checkbox .p-checkbox-box {
          background-color: var(--theme-bg-tertiary) !important;
          border-color: var(--theme-border-primary) !important;
        }
        .database-multiselect-panel .p-multiselect-header .p-checkbox .p-checkbox-box.p-highlight {
          background-color: var(--theme-accent) !important;
          border-color: var(--theme-accent) !important;
        }
        .database-multiselect-panel .p-multiselect-header .p-multiselect-filter-container .p-inputtext {
          background-color: var(--theme-bg-tertiary) !important;
          border-color: var(--theme-border-primary) !important;
          color: var(--theme-text-primary) !important;
        }
        .database-multiselect-panel .p-multiselect-header .p-multiselect-close {
          color: var(--theme-text-muted) !important;
        }
        .database-multiselect-panel .p-multiselect-header .p-multiselect-close:hover {
          background-color: var(--theme-bg-tertiary) !important;
          color: var(--theme-text-primary) !important;
        }
        .database-multiselect-panel .p-multiselect-items-wrapper {
          background-color: var(--theme-bg-secondary) !important;
        }
        .database-multiselect-panel .p-multiselect-items {
          background-color: var(--theme-bg-secondary) !important;
        }
        .database-multiselect-panel .p-multiselect-item {
          color: var(--theme-text-primary) !important;
          background-color: var(--theme-bg-secondary) !important;
        }
        .database-multiselect-panel .p-multiselect-item:hover {
          background-color: var(--theme-bg-tertiary) !important;
        }
        .database-multiselect-panel .p-multiselect-item.p-highlight {
          background-color: var(--theme-accent) !important;
          color: white !important;
        }
        .database-multiselect-panel .p-multiselect-item .p-checkbox .p-checkbox-box {
          background-color: var(--theme-bg-tertiary) !important;
          border-color: var(--theme-border-primary) !important;
        }
        .database-multiselect-panel .p-multiselect-item .p-checkbox .p-checkbox-box.p-highlight {
          background-color: var(--theme-accent) !important;
          border-color: var(--theme-accent) !important;
        }
        .database-multiselect-panel .p-multiselect-empty-message {
          color: var(--theme-text-muted) !important;
          background-color: var(--theme-bg-secondary) !important;
        }
        /* Create Modal MultiSelect */
        .database-create-modal .p-multiselect {
          background-color: var(--theme-bg-secondary) !important;
          border-color: var(--theme-border-primary) !important;
          color: var(--theme-text-primary) !important;
        }
        .database-create-modal .p-multiselect:hover {
          border-color: var(--theme-accent) !important;
        }
        .database-create-modal .p-multiselect .p-multiselect-label {
          color: var(--theme-text-primary) !important;
        }
        .database-create-modal .p-multiselect .p-multiselect-label.p-placeholder {
          color: var(--theme-text-muted) !important;
        }
        .database-create-modal .p-multiselect .p-multiselect-trigger {
          color: var(--theme-text-muted) !important;
        }
        .database-create-modal .p-multiselect-token {
          background-color: var(--theme-accent) !important;
          color: white !important;
        }
        .database-create-modal .p-inputtext {
          background-color: var(--theme-bg-secondary) !important;
          border-color: var(--theme-border-primary) !important;
          color: var(--theme-text-primary) !important;
        }
        .database-create-modal .p-inputtext:focus {
          border-color: var(--theme-accent) !important;
          box-shadow: 0 0 0 1px var(--theme-accent) !important;
        }
        .database-create-modal .p-inputtext::placeholder {
          color: var(--theme-text-muted) !important;
        }
        .database-create-modal .p-inputtextarea {
          background-color: var(--theme-bg-secondary) !important;
          border-color: var(--theme-border-primary) !important;
          color: var(--theme-text-primary) !important;
        }
        .database-create-modal .p-inputtextarea:focus {
          border-color: var(--theme-accent) !important;
          box-shadow: 0 0 0 1px var(--theme-accent) !important;
        }
        .database-create-modal .p-inputtextarea::placeholder {
          color: var(--theme-text-muted) !important;
        }
        .database-create-modal .p-dropdown {
          background-color: var(--theme-bg-secondary) !important;
          border-color: var(--theme-border-primary) !important;
          color: var(--theme-text-primary) !important;
        }
        .database-create-modal .p-dropdown:hover {
          border-color: var(--theme-accent) !important;
        }
        .database-create-modal .p-dropdown .p-dropdown-label {
          color: var(--theme-text-primary) !important;
        }
        /* Link Modal styles */
        .database-link-modal .database-link-item:hover {
          background-color: var(--theme-bg-tertiary) !important;
        }
        .database-link-modal input[type="checkbox"] {
          accent-color: var(--theme-accent);
        }
        /* Edit Modal styles */
        .database-edit-modal .p-inputtext,
        .database-associate-modal .p-inputtext,
        .database-delete-modal .p-inputtext,
        .database-export-modal .p-inputtext,
        .database-import-modal .p-inputtext,
        .database-copy-modal .p-inputtext {
          background-color: var(--theme-bg-secondary) !important;
          border-color: var(--theme-border-primary) !important;
          color: var(--theme-text-primary) !important;
        }
        .database-edit-modal .p-inputtext:focus,
        .database-associate-modal .p-inputtext:focus,
        .database-delete-modal .p-inputtext:focus,
        .database-export-modal .p-inputtext:focus,
        .database-import-modal .p-inputtext:focus,
        .database-copy-modal .p-inputtext:focus {
          border-color: var(--theme-accent) !important;
          box-shadow: 0 0 0 1px var(--theme-accent) !important;
        }
        .database-edit-modal .p-inputtext::placeholder,
        .database-associate-modal .p-inputtext::placeholder,
        .database-delete-modal .p-inputtext::placeholder,
        .database-export-modal .p-inputtext::placeholder,
        .database-import-modal .p-inputtext::placeholder,
        .database-copy-modal .p-inputtext::placeholder {
          color: var(--theme-text-muted) !important;
        }
        .database-edit-modal .p-inputtextarea,
        .database-associate-modal .p-inputtextarea,
        .database-delete-modal .p-inputtextarea,
        .database-export-modal .p-inputtextarea,
        .database-import-modal .p-inputtextarea,
        .database-copy-modal .p-inputtextarea {
          background-color: var(--theme-bg-secondary) !important;
          border-color: var(--theme-border-primary) !important;
          color: var(--theme-text-primary) !important;
        }
        .database-edit-modal .p-inputtextarea:focus,
        .database-associate-modal .p-inputtextarea:focus,
        .database-delete-modal .p-inputtextarea:focus,
        .database-export-modal .p-inputtextarea:focus,
        .database-import-modal .p-inputtextarea:focus,
        .database-copy-modal .p-inputtextarea:focus {
          border-color: var(--theme-accent) !important;
          box-shadow: 0 0 0 1px var(--theme-accent) !important;
        }
        .database-edit-modal .p-dropdown,
        .database-associate-modal .p-dropdown,
        .database-delete-modal .p-dropdown,
        .database-export-modal .p-dropdown,
        .database-import-modal .p-dropdown,
        .database-copy-modal .p-dropdown {
          background-color: var(--theme-bg-secondary) !important;
          border-color: var(--theme-border-primary) !important;
          color: var(--theme-text-primary) !important;
        }
        .database-edit-modal .p-dropdown:hover,
        .database-associate-modal .p-dropdown:hover,
        .database-delete-modal .p-dropdown:hover,
        .database-export-modal .p-dropdown:hover,
        .database-import-modal .p-dropdown:hover,
        .database-copy-modal .p-dropdown:hover {
          border-color: var(--theme-accent) !important;
        }
        .database-edit-modal .p-dropdown .p-dropdown-label,
        .database-associate-modal .p-dropdown .p-dropdown-label,
        .database-delete-modal .p-dropdown .p-dropdown-label,
        .database-export-modal .p-dropdown .p-dropdown-label,
        .database-import-modal .p-dropdown .p-dropdown-label,
        .database-copy-modal .p-dropdown .p-dropdown-label {
          color: var(--theme-text-primary) !important;
        }
        .database-edit-modal .p-multiselect,
        .database-associate-modal .p-multiselect,
        .database-delete-modal .p-multiselect,
        .database-export-modal .p-multiselect,
        .database-import-modal .p-multiselect,
        .database-copy-modal .p-multiselect {
          background-color: var(--theme-bg-secondary) !important;
          border-color: var(--theme-border-primary) !important;
          color: var(--theme-text-primary) !important;
        }
        .database-edit-modal .p-multiselect:hover,
        .database-associate-modal .p-multiselect:hover,
        .database-delete-modal .p-multiselect:hover,
        .database-export-modal .p-multiselect:hover,
        .database-import-modal .p-multiselect:hover,
        .database-copy-modal .p-multiselect:hover {
          border-color: var(--theme-accent) !important;
        }
        .database-edit-modal .p-multiselect .p-multiselect-label,
        .database-associate-modal .p-multiselect .p-multiselect-label,
        .database-delete-modal .p-multiselect .p-multiselect-label,
        .database-export-modal .p-multiselect .p-multiselect-label,
        .database-import-modal .p-multiselect .p-multiselect-label,
        .database-copy-modal .p-multiselect .p-multiselect-label {
          color: var(--theme-text-primary) !important;
        }
        .database-edit-modal .p-multiselect .p-multiselect-label.p-placeholder,
        .database-associate-modal .p-multiselect .p-multiselect-label.p-placeholder,
        .database-delete-modal .p-multiselect .p-multiselect-label.p-placeholder,
        .database-export-modal .p-multiselect .p-multiselect-label.p-placeholder,
        .database-import-modal .p-multiselect .p-multiselect-label.p-placeholder,
        .database-copy-modal .p-multiselect .p-multiselect-label.p-placeholder {
          color: var(--theme-text-muted) !important;
        }
        .database-edit-modal .p-multiselect-token,
        .database-associate-modal .p-multiselect-token,
        .database-delete-modal .p-multiselect-token,
        .database-export-modal .p-multiselect-token,
        .database-import-modal .p-multiselect-token,
        .database-copy-modal .p-multiselect-token {
          background-color: var(--theme-accent) !important;
          color: white !important;
        }
        /* Checkbox styling in modals */
        .database-edit-modal input[type="checkbox"],
        .database-associate-modal input[type="checkbox"],
        .database-delete-modal input[type="checkbox"],
        .database-export-modal input[type="checkbox"],
        .database-import-modal input[type="checkbox"],
        .database-copy-modal input[type="checkbox"] {
          accent-color: var(--theme-accent);
        }
        /* FileUpload styling */
        .database-import-modal .p-fileupload {
          background-color: var(--theme-bg-secondary) !important;
          border-color: var(--theme-border-primary) !important;
        }
        .database-import-modal .p-fileupload .p-button {
          background-color: var(--theme-accent) !important;
          border-color: var(--theme-accent) !important;
        }
        /* DataTable styling */
        .database-management-panel .p-datatable {
          background-color: var(--theme-bg-tertiary);
        }
        .database-management-panel .p-datatable .p-datatable-header {
          background-color: var(--theme-bg-secondary);
          border-color: var(--theme-border-primary);
          color: var(--theme-text-primary);
        }
        .database-management-panel .p-datatable .p-datatable-thead > tr > th {
          background-color: var(--theme-bg-secondary);
          border-color: var(--theme-border-primary);
          color: var(--theme-text-primary);
        }
        .database-management-panel .p-datatable .p-datatable-tbody > tr {
          background-color: var(--theme-bg-tertiary);
          color: var(--theme-text-primary);
        }
        .database-management-panel .p-datatable .p-datatable-tbody > tr > td {
          border-color: var(--theme-border-primary);
        }
        .database-management-panel .p-datatable .p-datatable-tbody > tr:nth-child(even) {
          background-color: var(--theme-bg-secondary);
        }
        .database-management-panel .p-datatable .p-datatable-tbody > tr:hover {
          background-color: var(--theme-bg-primary) !important;
        }
        /* Paginator styling */
        .database-management-panel .p-paginator {
          background-color: var(--theme-bg-secondary);
          border-color: var(--theme-border-primary);
          color: var(--theme-text-primary);
        }
        .database-management-panel .p-paginator .p-paginator-current {
          color: var(--theme-text-muted);
        }
        .database-management-panel .p-paginator .p-paginator-element {
          color: var(--theme-text-primary);
        }
        .database-management-panel .p-paginator .p-paginator-element:hover {
          background-color: var(--theme-bg-tertiary);
        }
        .database-management-panel .p-paginator .p-paginator-element.p-highlight {
          background-color: var(--theme-accent);
          color: white;
        }
        .database-management-panel .p-paginator .p-dropdown {
          background-color: var(--theme-bg-tertiary);
          border-color: var(--theme-border-primary);
        }
        .database-management-panel .p-paginator .p-dropdown .p-dropdown-label {
          color: var(--theme-text-primary);
        }
      `}</style>
      {/* Schema Print Modal */}
      <SchemaPrintModal visible={showPrintDialog} onHide={() => setShowPrintDialog(false)} initialSchemaId={printSchemaId} />
      {/* Per-row Schema Import / Export modals (same components as the Database menu uses) */}
      {sqlImportSchemaId !== null && (
        <SqlImportModal
          isOpen={sqlImportSchemaId !== null}
          onClose={() => setSqlImportSchemaId(null)}
          onSuccess={() => { setSqlImportSchemaId(null); loadMySchemas(); }}
          preselectedSchemaId={sqlImportSchemaId}
        />
      )}
      {dbExportSchemaId !== null && (
        <DatabaseExportModal
          isOpen={dbExportSchemaId !== null}
          onClose={() => setDbExportSchemaId(null)}
          preselectedSchemaId={dbExportSchemaId}
        />
      )}
      </div>
    </div>
  );
}