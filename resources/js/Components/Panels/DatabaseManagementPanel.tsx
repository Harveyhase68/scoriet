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
import ProjectUnlockModal from '@/Components/Modals/ProjectUnlockModal';
import PlanModal from '@/Components/AuthModals/PlanModal';

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

  // Use Project Context to get current project and projects list
  const { selectedProject: contextSelectedProject, projects: contextProjects } = useProject();
  // Use forceProjectId if provided (from TreeView), otherwise use context
  const projectId = forceProjectId || (filterByProject ? contextSelectedProject?.id : undefined);

  // Get current user type for system schema checkbox
  const currentUserId = parseInt(localStorage.getItem('user_id') || '0');
  const userType = localStorage.getItem('user_type') || 'free';
  const isSystemUser = userType === 'system' || userType === 'admin';

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

  // Create schema modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    description: '',
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

      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (!token) {
        setError(t.applicationsmodal66);
        return;
      }

      const response = await fetch('/api/schemas', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(t.databaseexportmodal71);
      }

      const data = await response.json();
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

      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (!token) {
        setError(t.applicationsmodal66);
        return;
      }

      const response = await fetch('/api/schemas', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(t.databaseexportmodal71);
      }

      const data = await response.json();
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
        const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
        if (!token) return;

        const response = await fetch('/api/user', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        });

        if (response.ok) {
          const userData = await response.json();
          setCurrentUser(userData);
        }
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
      updateTabTitle(`Database Management: ${forceProjectName}`);
    }
  }, [filterByProject, updateTabTitle, forceProjectName]);


  const loadProjects = async () => {
    try {
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (!token) return;

      const response = await fetch('/api/projects', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) return;

      const data = await response.json();
      setProjects(data.projects || []);
    } catch {
      // Error loading projects
    }
  };

  const loadLanguages = async () => {
    try {
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (!token) return;

      const response = await fetch('/api/active-languages', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) return;

      const data = await response.json();
      setLanguages(data.languages || []);

      // Pre-select all languages by default
      setSelectedLanguages((data.languages || []).map((lang: any) => lang.code));
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

  const handleImportTranslations = async (event: any) => {
    const file = event.files[0];
    if (!file || !contextSelectedProject) return;

    setImporting(true);
    setError('');

    try {
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (!token) {
        throw new Error(t.applicationsmodal66);
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('project_id', contextSelectedProject.id.toString());

      const response = await fetch('/api/translations/import', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || t.databasemanagementpanel294);
      }

      const result = await response.json();
      setShowImportDialog(false);
      setSuccess(`Successfully imported ${result.imported_count} translations (${result.updated_count} updated, ${result.created_count} created)`);
    } catch (error) {
      setError(error instanceof Error ? error.message : t.databasemanagementpanel301);
    } finally {
      setImporting(false);
    }
  };

  // Pre-check before opening create schema modal
  const handleCreateSchemaClick = async () => {
    if (!currentUser) {
      setError('Bitte melden Sie sich an, um Datenbanken zu erstellen');
      return;
    }

    const isFreeUser = currentUser.user_type === 'free' || !currentUser.user_type;

    // If user is Free, check subscription_info from backend (slot-based system)
    if (isFreeUser) {
      try {
        const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
        if (!token) {
          setError(t.databasemanagementpanel532);
          return;
        }

        // Fetch current subscription info from backend
        const response = await fetch('/api/schemas', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          const subscriptionInfo = data.subscription_info;

          // Use backend's needs_unlock flag (accounts for subscription slots)
          if (subscriptionInfo && subscriptionInfo.needs_unlock) {
            // Show SchemaUnlockModal - user needs to pay 50 credits for a new slot
            setShowSchemaUnlockModal(true);
            return;
          }
        }
      } catch (err) {
        console.error('Error checking subscription info:', err);
        // Continue anyway - backend will validate
      }
    }

    // User is not Free, or has available slots -> show create modal directly
    setShowCreateModal(true);
  };

  const handleSchemaUnlockConfirm = () => {
    // User confirmed they want to spend 50 credits
    // Close unlock modal and open create modal
    setShowSchemaUnlockModal(false);
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
      setError('Keine Subscription gefunden für diese Datenbank');
      return;
    }

    setUnlockingSchema(true);
    setSchemaToUnlock(schema);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (!token) {
        throw new Error(t.databasemanagementpanel593);
      }

      const response = await fetch(`/api/subscriptions/${schema.subscription.id}/renew`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        // If not enough credits, show the plan modal
        if (data.required_credits) {
          setError(`Nicht genug Credits! Benötigt: ${data.required_credits}, Vorhanden: ${data.current_credits}`);
          setPlanModalInitialTab(1);
          setShowPlanModal(true);
        } else {
          throw new Error(data.error || data.message || 'Fehler beim Entsperren der Datenbank');
        }
        return;
      }

      // Reload user data to get updated credits
      const userResponse = await fetch('/api/user', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      if (userResponse.ok) {
        const userData = await userResponse.json();
        setCurrentUser(userData);
        window.dispatchEvent(new CustomEvent('creditsChanged'));
      }

      // Reload schemas to get updated status
      await loadMySchemas();
      await loadCommunitySchemas();

      setSuccess(`Datenbank "${schema.name}" wurde erfolgreich entsperrt! (${data.bonus_days || 0} Bonus-Tage erhalten)`);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Fehler beim Entsperren');
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
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (!token) {
        throw new Error(t.applicationsmodal66);
      }

      const response = await fetch('/api/schemas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
        body: JSON.stringify(createForm),
      });

      if (!response.ok) {
        const errorData = await response.json();

        // Handle insufficient credits error
        if (errorData.error_code === 'INSUFFICIENT_CREDITS') {
          setError(`Nicht genug Credits! Sie benötigen ${errorData.required_credits} Credits, haben aber nur ${errorData.current_credits}.`);
          setShowCreateModal(false);
          setCreating(false);

          // Open Plan Modal on "Buy Credits" tab
          setPlanModalInitialTab(1);
          setShowPlanModal(true);
          return;
        }

        throw new Error(errorData.message || t.databasemanagementpanel330);
      }

      // Reload user data to get updated credits
      const userResponse = await fetch('/api/user', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      if (userResponse.ok) {
        const userData = await userResponse.json();
        setCurrentUser(userData);
        // Notify other components (like navigation) about credit change
        window.dispatchEvent(new CustomEvent('creditsChanged'));
      }

      await loadMySchemas();
      await loadCommunitySchemas();
      setShowCreateModal(false);
      setCreateForm({ name: '', description: '', visibility: 'private', is_system_schema: false, project_ids: [] });
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
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (!token) {
        throw new Error(t.applicationsmodal66);
      }

      const response = await fetch(`/api/schemas/${editingSchema.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
        body: JSON.stringify(editForm),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || t.databasemanagementpanel382);
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
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (!token) {
        throw new Error(t.applicationsmodal66);
      }

      const response = await fetch(`/api/projects/${selectedProjectForAssociation}/schemas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          schema_id: associatingSchema.id,
          association_type: associationType,
          alias: alias || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || t.databasemanagementpanel438);
      }

      setShowAssociateModal(false);
      setAssociatingSchema(null);
      await loadMySchemas(); // Reload schemas to update the UI
      await loadCommunitySchemas();
      setSuccess(`Schema successfully ${associationType} to project`);

    } catch (error) {
      setError(error instanceof Error ? error.message : t.databasemanagementpanel447);
    } finally {
      setAssociating(false);
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
          <Tag value="Gesperrt" severity="danger" />
        </div>
      );
    }
    if (schema.subscription?.days_remaining !== null && schema.subscription?.days_remaining !== undefined && schema.subscription.days_remaining <= 14) {
      return (
        <div className="flex items-center gap-1">
          <i className="pi pi-exclamation-triangle text-yellow-500" />
          <Tag value={`${schema.subscription.days_remaining} Tage`} severity="warning" />
        </div>
      );
    }
    // Only show "Aktiv" if schema has a subscription (not for first free schema)
    if (schema.subscription) {
      return <Tag value="Aktiv" severity="success" />;
    }
    return null;
  };

  const visibilityTemplate = (schema: FloatingSchema) => {
    // Show "System" badge for system schemas
    if (schema.is_system_schema) {
      return (
        <Tag
          value="System"
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
      return <span className="text-gray-500 text-sm">Not assigned</span>;
    }

    // Build tooltip content with all project names
    const tooltipContent = projects.map(p => p.name).join('\n');

    return (
      <div title={tooltipContent}>
        <Tag
          icon="pi pi-link"
          value={`${projects.length} ${projects.length === 1 ? 'Project' : 'Projects'}`}
          severity="info"
          className="cursor-help"
        />
      </div>
    );
  };

  const handleRemoveFromProject = async (schema: FloatingSchema, projectId: number) => {
    try {
      setError('');

      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (!token) {
        throw new Error(t.applicationsmodal66);
      }

      const response = await fetch(`/api/projects/${projectId}/schemas/${schema.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || t.databasemanagementpanel529);
      }

      await loadMySchemas();
      await loadCommunitySchemas();
      setSuccess(`Schema removed from project successfully`);

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

  const handleCopySchema = (schema: FloatingSchema) => {
    setCopyingSchema(schema);
    setCopyName(schema.name + t.dbschemacontroller288);
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
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (!token) {
        throw new Error(t.applicationsmodal66);
      }

      const response = await fetch(`/api/template-db-schema/schemas/${copyingSchema.id}/copy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          name: copyName,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || result.message || t.databasemanagementpanel585);
      }

      setShowCopyModal(false);
      setCopyingSchema(null);
      await loadMySchemas();
      await loadCommunitySchemas();
      setSuccess(`Schema "${copyingSchema.name}" copied successfully as "${copyName}"`);

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
      setError('You must type DELETE to confirm deletion');
      return;
    }

    setDeleting(true);
    setError('');

    try {
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (!token) {
        throw new Error(t.applicationsmodal66);
      }

      // First attempt without force - to get deletion info
      let response = await fetch(`/api/schemas/${deletingSchema.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          force_delete: false
        }),
      });

      let result;
      try {
        result = await response.json();
      } catch {
        const textResult = await response.text();
        throw new Error(`Server returned invalid JSON. Status: ${response.status}, Text: ${textResult.substring(0, 200)}`);
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
        response = await fetch(`/api/schemas/${deletingSchema.id}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          },
          body: JSON.stringify({
            force_delete: true
          }),
        });

        try {
          result = await response.json();
        } catch {
          const textResult = await response.text();
          throw new Error(`Server returned invalid JSON on force delete. Status: ${response.status}, Text: ${textResult.substring(0, 200)}`);
        }
      }

      if (!response.ok) {
        const errorMessage = result.message || `HTTP ${response.status}: ${response.statusText}`;
        throw new Error(errorMessage);
      }

      // Success!
      setShowDeleteModal(false);
      setDeletingSchema(null);
      setDeleteInfo(null);
      await loadMySchemas();
      await loadCommunitySchemas();
      setSuccess(`Schema "${deletingSchema.name}" and all related data deleted successfully`);

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
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (!token) return;

      const response = await fetch('/api/projects', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load projects');
      }

      const data = await response.json();
      setAllProjects(data.projects || []);

      // Get currently linked project IDs from schema
      const linkedIds = schema.projects?.map(p => p.id) || [];
      setLinkedProjectIds(linkedIds);

    } catch (error) {
      console.error('Error loading projects:', error);
      setError('Fehler beim Laden der Projekte');
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
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (!token) return;

      const response = await fetch(`/api/schemas/${schemaToLink.id}/linked-projects`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ project_ids: linkedProjectIds }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Fehler beim Aktualisieren der Verknüpfungen');
      }

      setSuccess('Schema-Verknüpfungen erfolgreich aktualisiert');
      setLinkModalVisible(false);
      await loadMySchemas();
      await loadCommunitySchemas();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Fehler beim Aktualisieren der Verknüpfungen';
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
          <i className="pi pi-lock text-red-500" title="Datenbank gesperrt" />
          <Button
            icon={unlockingSchema && schemaToUnlock?.id === schema.id ? "pi pi-spinner pi-spin" : "pi pi-unlock"}
            label="50 Credits"
            className="p-button-rounded p-button-sm"
            style={{ backgroundColor: '#2563eb', borderColor: '#2563eb', color: 'white', fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
            tooltip="Datenbank entsperren (50 Credits)"
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
              title={`Remove from project`}
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
                ...(isSystemUser ? [{ label: 'System', value: 'system' }] : [])
              ]}
              onChange={(e) => setMyTypeFilter(e.value)}
              placeholder="Type"
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

      {/* Translation Export/Import */}
      {contextSelectedProject && (
        <Card title={t.databasemanagementpanel876} className="mt-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <p className="text-sm text-gray-400 mb-2">
                {t.databasemanagementpanel1497}{contextSelectedProject.name}{t.databasemanagementpanel1497_2}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                icon="pi pi-download"
                label={t.databasemanagementpanel886}
                className="p-button-success"
                onClick={() => setShowExportDialog(true)}
                disabled={exporting || !contextSelectedProject}
              />
              <Button
                icon="pi pi-upload"
                label={t.databasemanagementpanel893}
                className="p-button-info"
                onClick={() => setShowImportDialog(true)}
                disabled={importing || !contextSelectedProject}
              />
            </div>
          </div>
        </Card>
      )}

      {/* Create Schema Modal */}
      <Dialog
        header={t.databasemanagementpanel905}
        visible={showCreateModal}
        onHide={() => setShowCreateModal(false)}
        style={{ width: '450px' }}
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
              {t.createteammodal117 || 'Projects'} <span className="text-xs" style={{ color: colors.textMuted }}>(optional)</span>
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
              selectedItemsLabel="{0} projects selected"
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
        style={{ width: '450px' }}
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
              label={associating ? "Linking..." : t.databasemanagementpanel1138}
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
              This action will permanently delete the schema and <strong>ALL</strong> related data:
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
              {t.databasemanagementpanel1912}"DELETE"t.databasemanagementpanel1912_2
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
              label={exporting ? "Exporting..." : t.databasemanagementpanel1280}
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
        onHide={() => setShowImportDialog(false)}
        style={{ width: '500px' }}
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
              uploadHandler={handleImportTranslations}
              auto={false}
              chooseLabel={t.databasemanagementpanel1324}
              disabled={importing}
            />
            <small style={{ color: colors.textMuted }}>
              {t.databasemanagementpanel2047}
            </small>
          </div>

          {error && (
            <Message severity="error" text={error} />
          )}

          <div className="flex justify-end space-x-2 pt-4 gap-2">
            <Button
              label={t.applicationsmodal432}
              icon="pi pi-times"
              onClick={() => setShowImportDialog(false)}
              className="p-button-text"
              disabled={importing}
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
              onChange={(e) => setCopyName(e.target.value)}
              placeholder={t.databasemanagementpanel1377}
              className="w-full"
              disabled={copying}
              required
            />
            <small style={{ color: colors.textMuted }}>
              {t.databasemanagementpanel2104}
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
              label={copying ? "Copying..." : t.databasemanagementpanel1402}
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
      </div>
    </div>
  );
}