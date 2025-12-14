import React, { useState, useEffect } from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Tag } from 'primereact/tag';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Dialog } from 'primereact/dialog';
import { TabView, TabPanel } from 'primereact/tabview';
import { Dropdown } from 'primereact/dropdown';
import { Message } from 'primereact/message';
import ClassicTreeView from '@/Components/ClassicTreeView';
import JoinCodeModal from '@/Components/Modals/JoinCodeModal';
import ApplicationsModal from '@/Components/Modals/ApplicationsModal';
import ProjectInvitationsModal from '@/Components/Modals/ProjectInvitationsModal';
import ProjectMembersModal from '@/Components/Modals/ProjectMembersModal';
import ProjectUnlockModal from '@/Components/Modals/ProjectUnlockModal';
import PlanModal from '@/Components/AuthModals/PlanModal';
// import EditProjectModal from '@/Components/Modals/EditProjectModal'; // Replaced by ProjectSettingsPanel
import { useProject } from '@/contexts/ProjectContext';
import { useTranslation, SupportedLanguage, getStoredLanguage } from '@/i18n';

interface TabPanelProps {
  isActive: boolean;
  onOpenPanel?: (panelId: string, data?: any) => void;
  projectId?: number;
}

interface Project {
  id: number;
  name: string;
  description: string;
  owner_id: number;
  is_active: boolean;
  is_public?: boolean;
  join_code?: string;
  allow_join_requests?: boolean;
  is_owner?: boolean;
  can_join?: boolean;
  default_language?: string;
  enabled_languages?: string[];
  // Diagram Settings
  diagram_max_tables_per_row?: number;
  diagram_table_width?: number;
  diagram_table_height?: number;
  diagram_horizontal_spacing?: number;
  diagram_vertical_spacing?: number;
  owner: {
    id: number;
    name: string;
    email: string;
    username?: string;
  };
  created_at: string;
  updated_at: string;
  teams_count?: number;
  members_count?: number;
  templates_count?: number;
  databases_count?: number;
  applications_count?: number;
  // Database connection fields
  database_name?: string;
  database_type?: string;
  database_server?: string;
  database_port?: string;
  database_username?: string;
  database_password?: string;
  // Project paths
  project_directory?: string;
  project_url?: string;
  // Localization settings
  decimal_separator?: string;
  thousands_separator?: string;
  date_format?: string;
  time_format?: string;
  currency_symbol?: string;
  timezone?: string;
}

export default function ProjectPanel({ isActive, onOpenPanel, projectId }: TabPanelProps) {
  // i18n setup
  const [currentLanguage] = React.useState<SupportedLanguage>(getStoredLanguage());
  const { t } = useTranslation(currentLanguage);

  // Use global project context
  const {
    projects: globalProjects,
    selectedProject: globalSelectedProject,
    setSelectedProject: setGlobalSelectedProject,
    loadProjects: loadProjectsFromContext,
    setPreferredProject,
    loading: contextLoading
  } = useProject();

  // Map to local project state for compatibility
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);

  // Keep track of original selected project for returning after edit
  // All other state definitions first
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');


  // Sync with global project context
  useEffect(() => {
    setProjects(globalProjects);
    // Always update currentProject since we don't have inline editing anymore
    setCurrentProject(globalSelectedProject);
  }, [globalProjects, globalSelectedProject]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    description: '',
    is_public: true,
    allow_join_requests: false,
    // Database connection fields
    database_name: '',
    database_type: 'MySQL',
    database_server: '127.0.0.1',
    database_port: '3306',
    database_username: '',
    database_password: '',
    // Project paths
    project_directory: '',
    project_url: '',
    // Project properties
    start_page: 'index.php',
    default_language: 'en',
    filename_short_length: 2,
    // Localization settings
    decimal_separator: ',',
    thousands_separator: '.',
    date_format: 'd.m.Y',
    time_format: 'H:i:s',
    currency_symbol: t.editprojectmodal602,
    timezone: 'Europe/Vienna'
  });
  const [creating, setCreating] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSelectProjectDialog, setShowSelectProjectDialog] = useState(false);
  const [newlyCreatedProject, setNewlyCreatedProject] = useState<Project | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [showJoinCodeModal, setShowJoinCodeModal] = useState(false);
  const [showApplicationsModal, setShowApplicationsModal] = useState(false);
  const [showInvitationsModal, setShowInvitationsModal] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [showProjectOverviewModal, setShowProjectOverviewModal] = useState(false);
  const [selectedProjectForOverview, setSelectedProjectForOverview] = useState<Project | null>(null);
  const [projectTeamsTree, setProjectTeamsTree] = useState<any[]>([]);
  const [loadingTeamsData, setLoadingTeamsData] = useState(false);
  const [projectSchemasTree, setProjectSchemasTree] = useState<any[]>([]);
  const [loadingSchemasData, setLoadingSchemasData] = useState(false);
  const [projectTemplatesTree, setProjectTemplatesTree] = useState<any[]>([]);
  const [loadingTemplatesData, setLoadingTemplatesData] = useState(false);
  const [projectMembers, setProjectMembers] = useState<any[]>([]);
  const [loadingMembersData, setLoadingMembersData] = useState(false);

  // Project unlock and plan modals
  const [showProjectUnlockModal, setShowProjectUnlockModal] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [planModalInitialTab, setPlanModalInitialTab] = useState(0);
  const [currentUser, setCurrentUser] = useState<any>(null);

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

  // Load projects when panel becomes active
  useEffect(() => {
    if (isActive) {
      loadProjectsFromContext();
    }
  }, [isActive, loadProjectsFromContext]);

  // Ensure currentProject is synced with globalSelectedProject when panel becomes active
  useEffect(() => {
    if (isActive && globalSelectedProject) {
      setCurrentProject(globalSelectedProject);
    }
  }, [isActive, globalSelectedProject]);

  // Load specific project when projectId prop is provided (for tree view navigation)
  useEffect(() => {
    if (projectId && globalProjects.length > 0) {
      const project = globalProjects.find(p => p.id === projectId);
      if (project) {
        setGlobalSelectedProject(project);
      }
    }
  }, [projectId, globalProjects, setGlobalSelectedProject]);

  // Listen for notification bell click to open Applications Modal
  useEffect(() => {
    const handleOpenApplicationsModal = () => {
      setShowApplicationsModal(true);
    };

    window.addEventListener(t.index1621, handleOpenApplicationsModal as EventListener);

    return () => {
      window.removeEventListener(t.index1621, handleOpenApplicationsModal as EventListener);
    };
  }, []);


  const handleEdit = async (projectToEdit?: Project) => {
    const project = projectToEdit || currentProject;
    if (project && onOpenPanel) {
      // Set the project as the current project first
      setGlobalSelectedProject(project as any);

      // Open the project settings panel with the current project
      onOpenPanel('project-settings', {
        title: `${t.newnavigationpanel142} (${project.name})`
      });
    }
  };

  const loadProjectMembers = async (projectId: number) => {
    setLoadingMembersData(true);
    try {
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      const response = await fetch(`/api/projects/${projectId}/members`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setProjectMembers(data);
      }
    } catch {
      setProjectMembers([]);
    } finally {
      setLoadingMembersData(false);
    }
  };

  /**
   * Pre-check before showing "Create Project" modal
   * - Check if user is Free and already has 1 project
   * - If yes, show ProjectUnlockModal first (50 credits required)
   * - If not enough credits, offer to buy credits
   * - Only after confirmation, show the Create Project modal
   */
  const handleCreateProjectClick = async () => {
    // Check if user is Free type
    if (!currentUser) {
      setError('Bitte melden Sie sich an, um Projekte zu erstellen');
      return;
    }

    const isFreeUser = currentUser.user_type === 'free' || !currentUser.user_type;

    // If user is Free, check project count
    if (isFreeUser) {
      const userProjectCount = projects.filter(p => p.owner_id === currentUser.id && p.is_active).length;

      // If user already has 1 project (the limit for free users)
      if (userProjectCount >= 1) {
        // Show ProjectUnlockModal - user needs to pay 50 credits
        setShowProjectUnlockModal(true);
        return;
      }
    }

    // User is not Free, or has no projects yet -> show create modal directly
    setShowCreateModal(true);
  };

  const handleProjectUnlockConfirm = () => {
    // User confirmed they want to spend 50 credits
    // Credits will be deducted automatically by the backend when the project is created
    // Close unlock modal and open create modal
    setShowProjectUnlockModal(false);
    setShowCreateModal(true);
  };

  const handleBuyCredits = () => {
    // Open Plan Modal on "Buy Credits" tab (tab index 1)
    setPlanModalInitialTab(1);
    setShowPlanModal(true);
  };

  const handleCreateProject = async () => {
    setCreating(true);
    setError('');
    setSuccess('');

    // Frontend validation first
    const namePattern = /^[a-z0-9]+(_[a-z0-9]+)*$/;
    if (!namePattern.test(createForm.name)) {
      setError('Projektnamen dürfen nur Kleinbuchstaben (a-z), Zahlen (0-9) und Unterstriche (_) als Trennzeichen enthalten. Beispiel: mein_projekt_2024');
      setCreating(false);
      return;
    }

    try {
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (!token) {
        throw new Error(t.applicationsmodal66);
      }

      const response = await fetch('/api/projects', {
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

          // Open Plan Modal on "Buy Credits" tab
          setPlanModalInitialTab(1);
          setShowPlanModal(true);
          setCreating(false);
          return;
        }

        // Handle Laravel validation errors
        if (errorData.errors && errorData.errors.name) {
          // Check if it's a regex validation error and provide better message
          const backendError = errorData.errors.name[0];
          if (backendError.includes('regex') || backendError.includes('format')) {
            throw new Error('Projektnamen dürfen nur Kleinbuchstaben (a-z), Zahlen (0-9) und Unterstriche (_) als Trennzeichen enthalten. Beispiel: mein_projekt_2024');
          }
          throw new Error(backendError);
        }

        throw new Error(errorData.message || t.projectpanel258);
      }

      const newProject = await response.json();

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

      // Store the newly created project and show selection dialog
      setNewlyCreatedProject(newProject);
      setShowSelectProjectDialog(true);

      // Close the create modal
      setShowCreateModal(false);
      setCreateForm({
        name: '',
        description: '',
        is_public: true,
        allow_join_requests: false,
        database_name: '',
        database_type: 'MySQL',
        database_server: '127.0.0.1',
        database_port: '3306',
        database_username: '',
        database_password: '',
        project_directory: '',
        project_url: '',
        start_page: 'index.php',
        default_language: 'en',
        filename_short_length: 2,
        decimal_separator: ',',
        thousands_separator: '.',
        date_format: 'd.m.Y',
        time_format: 'H:i:s',
        currency_symbol: t.editprojectmodal602,
        timezone: 'Europe/Vienna'
      });
      setSuccess(t.projectpanel298);

      // Notify NavigationPanel to refresh projects
      window.dispatchEvent(new CustomEvent(t.projectpanel301));

    } catch (error) {
      setError(error instanceof Error ? error.message : t.projectpanel304);
    } finally {
      setCreating(false);
    }
  };

  const handleCreateModalHide = () => {
    setShowCreateModal(false);
    setCreateForm({
      name: '',
      description: '',
      is_public: true,
      allow_join_requests: false,
      database_name: '',
      database_type: 'MySQL',
      database_server: '127.0.0.1',
      database_port: '3306',
      database_username: '',
      database_password: '',
      project_directory: '',
      project_url: '',
      start_page: 'index.php',
      default_language: 'en',
      filename_short_length: 2,
      decimal_separator: ',',
      thousands_separator: '.',
      date_format: 'd.m.Y',
      time_format: 'H:i:s',
      currency_symbol: t.editprojectmodal602,
      timezone: 'Europe/Vienna'
    });
    setError(''); // Clear errors when modal closes
    setSuccess('');
  };

  const handleSelectNewProjectYes = async () => {
    if (newlyCreatedProject) {
      // Set the new project as preferred
      setPreferredProject(newlyCreatedProject);
    }

    // Refresh the projects list (this will auto-select the preferred project)
    await loadProjectsFromContext();

    // Close dialog and clear state
    setShowSelectProjectDialog(false);
    setNewlyCreatedProject(null);

    // Notify NavigationPanel to refresh projects
    window.dispatchEvent(new CustomEvent(t.projectpanel301));
  };

  const handleSelectNewProjectNo = async () => {
    // Just refresh the projects list without setting as preferred
    await loadProjectsFromContext();

    // Close dialog and clear state
    setShowSelectProjectDialog(false);
    setNewlyCreatedProject(null);

    // Notify NavigationPanel to refresh projects
    window.dispatchEvent(new CustomEvent(t.projectpanel301));
  };

  const handleDeleteProject = async () => {
    if (!projectToDelete) return;

    // Validate confirmation text
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

      const response = await fetch(`/api/projects/${projectToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || t.projectpanel361);
      }

      // Refresh the projects list
      await loadProjectsFromContext();

      // Notify Navigation Panel to refresh the tree (removes deleted project from polling)
      window.dispatchEvent(new CustomEvent('projectChanged', { detail: { deleted: true, projectId: projectToDelete.id } }));

      setShowDeleteModal(false);
      setProjectToDelete(null);
      setDeleteConfirmText('');
      setSuccess(t.projectpanel369);

    } catch (error) {
      setError(error instanceof Error ? error.message : t.projectpanel372);
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteModalHide = () => {
    setShowDeleteModal(false);
    setProjectToDelete(null);
    setDeleteConfirmText('');
  };

  const confirmDelete = (project: Project) => {
    setProjectToDelete(project);
    setDeleteConfirmText('');
    setShowDeleteModal(true);
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

  // Load teams data for project overview
  const loadTeamsForProject = async (projectId: number) => {
    setLoadingTeamsData(true);
    try {
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (!token) {
        throw new Error(t.applicationsmodal66);
      }

      const response = await fetch(`/api/teams?all=true`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(t.projectpanel416);
      }

      const data = await response.json();

      // Filter teams for this project and build tree structure
      const allTeams = [...(data.owned_teams || []), ...(data.member_teams || [])];
      const projectTeams = allTeams.filter(team =>
        team.projects && team.projects.some((project: any) => project.id === projectId)
      );

      // Build tree structure for classic TreeView
      const treeData = projectTeams.map(team => ({
        id: `team-${team.id}`,
        name: `${team.name} (${team.members?.length || 0} members)`,
        type: 'team',
        children: team.members?.map((member: any) => ({
          id: `member-${team.id}-${member.id}`,
          name: `${member.user.name} (${member.role})`,
          type: 'member',
          memberRole: member.role
        })) || []
      }));

      setProjectTeamsTree(treeData);
    } catch {
      setProjectTeamsTree([]);
    } finally {
      setLoadingTeamsData(false);
    }
  };

  const loadSchemasForProject = async (projectId: number) => {
    setLoadingSchemasData(true);
    try {
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (!token) {
        throw new Error(t.applicationsmodal66);
      }

      const response = await fetch(`/api/projects/${projectId}/schemas`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(t.databaseexportmodal71);
      }

      const projectSchemas = await response.json();

      // Build tree structure for schemas (ClassicTreeView format)
      const treeData = projectSchemas.map((schema: any) => ({
        id: `schema-${schema.id}`,
        name: `${schema.name}${schema.version_number ? ` (v${schema.version_number})` : schema.version ? ` (v${schema.version})` : ''}`,
        type: 'schema',
        children: schema.tables?.map((table: any) => ({
          id: `table-${schema.id}-${table.id}`,
          name: `${table.name} (${table.field_count || table.fields?.length || 0} fields)`,
          type: 'table'
        })) || []
      }));

      setProjectSchemasTree(treeData);
    } catch {
      setProjectSchemasTree([]);
    } finally {
      setLoadingSchemasData(false);
    }
  };

  const loadTemplatesForProject = async (projectId: number) => {
    setLoadingTemplatesData(true);
    try {
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (!token) {
        throw new Error(t.applicationsmodal66);
      }

      const response = await fetch(`/api/projects/${projectId}/template-usages`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to load templates: ${response.status}`);
      }

      const projectTemplates = await response.json();

      // Extract templates from usages array (API returns {usages: [], linked_count: 0, cloned_count: 0})
      const templatesArray = projectTemplates.usages || [];

      // Build tree structure for templates (ClassicTreeView format)
      // Note: API returns usage objects with nested template data
      // Filter out usages where template is null (deleted templates)
      const treeData = templatesArray
        .filter((usage: any) => usage.template !== null)
        .map((usage: any) => {
          const template = usage.template; // Extract nested template object
          return {
            id: `template-${template.id}`,
            name: `${template.name} (${template.category || 'template'})`,
            type: 'template',
            children: template.files?.map((file: any) => ({
              id: `file-${template.id}-${file.id}`,
              name: `${file.file_name} (${file.file_type})`,
              type: 'template_file'
            })) || []
          };
        });

      setProjectTemplatesTree(treeData);
    } catch {
      setProjectTemplatesTree([]);
    } finally {
      setLoadingTemplatesData(false);
    }
  };

  const statusTemplate = () => {
    return <Tag value={t.templatesStatusActive} severity="success" />;
  };

  const dateTemplate = (project: Project) => {
    return formatDate(project.created_at);
  };

  const ownerTemplate = (project: Project) => {
    return (
      <div className="flex items-center space-x-2">
        <i className="pi pi-user text-blue-500"></i>
        <span>{project.owner.name}</span>
      </div>
    );
  };

  const actionTemplate = (project: Project) => {
    return (
      <div className="flex space-x-1">
        <Button
          icon="pi pi-eye"
          className="p-button-rounded p-button-sm"
          style={{ backgroundColor: '#1976d2', borderColor: '#1976d2', color: 'white' }}
          tooltip={t.projectpanel562}
          onClick={() => {
            setSelectedProjectForOverview(project);
            setShowProjectOverviewModal(true);
            loadProjectMembers(project.id);
            loadTeamsForProject(project.id);
            loadSchemasForProject(project.id);
            loadTemplatesForProject(project.id);
          }}
        />
        <Button
          icon="pi pi-user"
          className="p-button-rounded p-button-text p-button-sm"
          tooltip={t.projectpanel575}
          onClick={() => {
            setShowMembersModal(true);
          }}
        />
        <Button
          icon="pi pi-pencil"
          className="p-button-rounded p-button-text p-button-sm"
          tooltip={t.projectpanel583}
          onClick={() => handleEdit(project)}
        />
        <Button
          icon="pi pi-trash"
          className="p-button-rounded p-button-text p-button-sm p-button-danger"
          tooltip={t.projectpanel589}
          onClick={() => confirmDelete(project)}
        />
      </div>
    );
  };

  if (contextLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <i className="pi pi-spinner pi-spin text-4xl text-blue-500 mb-4"></i>
          <p className="text-gray-600">Loading projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-900 text-white">
      {/* Header - Fixed at top */}
      <div className="flex-shrink-0 p-6 pb-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <i className="pi pi-briefcase text-2xl text-blue-600"></i>
            <div>
              <h1 className="text-2xl font-bold text-white">{t.projectpanel615}</h1>
              {currentProject && (
                <p className="text-sm text-gray-300">
                  {t.projectpanel119}<span className="text-blue-400 font-medium">{currentProject.name}</span>
                </p>
              )}
            </div>
          </div>
          <div className="flex space-x-2 gap-2">
            <Button
              icon="pi pi-plus"
              label={t.projectpanel626}
              className="p-button-text"
              style={{ borderRadius: '8px', paddingTop: '6px', paddingBottom: '6px' }}
              onClick={handleCreateProjectClick}
              disabled={contextLoading}
            />
            <Button
              icon="pi pi-sign-in"
              label={t.joincodemodal156}
              className="p-button-text"
              style={{ borderRadius: '8px', paddingTop: '6px', paddingBottom: '6px' }}
              onClick={() => setShowJoinCodeModal(true)}
              disabled={contextLoading}
            />
            <Button
              icon="pi pi-refresh"
              label={t.applicationsmodal313}
              className="p-button-text"
              style={{ borderRadius: '8px', paddingTop: '6px', paddingBottom: '6px' }}
              onClick={loadProjectsFromContext}
              disabled={contextLoading}
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

      {/* Scrollable content area */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-6 pb-6">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Current Project */}
        <div className="space-y-4">
          <Card
            title={
              <div className="flex items-center justify-between">
                <span className="flex items-center space-x-2">
                  <i className="pi pi-star-fill text-yellow-500"></i>
                  <span>{t.projectpanel671}</span>
                </span>
                {currentProject && (
                  <Button
                    icon="pi pi-pencil"
                    className="p-button-sm p-button-outlined"
                    onClick={() => handleEdit()}
                    tooltip={t.projectpanel583}
                  />
                )}
              </div>
            }
            className="h-fit"
          >
            {currentProject ? (
              <div className="space-y-3">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">
                    {currentProject.name}
                  </h3>
                  <p className="text-gray-300 text-sm">
                    {currentProject.description || t.joincodemodal220}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-300">{t.projectpanel698}</span>
                    <div className="flex items-center space-x-1 mt-1">
                      <i className="pi pi-user text-blue-400"></i>
                      <span className="text-gray-200">{currentProject.owner.name}</span>
                    </div>
                  </div>

                  <div>
                    <span className="font-medium text-gray-300">{t.projectpanel706}</span>
                    <div className="mt-1 text-gray-200">{formatDate(currentProject.created_at)}</div>
                  </div>
                </div>

                {/* Join Code Section */}
                {currentProject.join_code && (
                  <div className="p-3 bg-gray-800 rounded-lg border border-gray-600">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium text-gray-300 mb-1">Join Code</div>
                        <div className="flex items-center space-x-2">
                          <code className="px-2 py-1 bg-gray-700 rounded text-blue-300 font-mono text-sm">
                            {currentProject.join_code}
                          </code>
                          <Button
                            icon="pi pi-copy"
                            className="p-button-rounded p-button-text p-button-sm"
                            tooltip={t.projectpanel724}
                            onClick={() => navigator.clipboard.writeText(currentProject.join_code!)}
                          />
                        </div>
                      </div>
                      <Tag
                        value={currentProject.is_public ? t.databasemanagementpanel772 : t.databasemanagementpanel771}
                        severity={currentProject.is_public ? "success" : "warning"}
                      />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-5 gap-4 pt-3 border-t border-gray-600">
                  <div className="text-center">
                    <div className="text-xl font-bold text-blue-400">
                      {currentProject.teams_count || 0}
                    </div>
                    <div className="text-xs text-gray-400">Teams</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-cyan-400">
                      {currentProject.members_count || 0}
                    </div>
                    <div className="text-xs text-gray-400">Members</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-green-400">
                      {currentProject.templates_count || 0}
                    </div>
                    <div className="text-xs text-gray-400">Templates</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-purple-400">
                      {currentProject.databases_count || 0}
                    </div>
                    <div className="text-xs text-gray-400">Databases</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-orange-400">
                      {currentProject.applications_count || 0}
                    </div>
                    <div className="text-xs text-gray-400">Applications</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <i className="pi pi-briefcase text-6xl text-gray-500 mb-4"></i>
                <h3 className="text-lg font-medium text-white mb-2">No Active Project</h3>
                <p className="text-gray-400 mb-4">You don't have an active project yet.</p>
                <Button
                  label={t.projectpanel776}
                  icon="pi pi-plus"
                  className="p-button-outlined"
                  onClick={handleCreateProjectClick}
                />
              </div>
            )}
          </Card>

          {/* Quick Actions */}
          <Card title={t.projectpanel786} className="h-fit">
            <div className="grid grid-cols-2 gap-3">
              <Button
                label={t.projectpanel766}
                icon="pi pi-user-plus"
                className="p-button-outlined flex-col h-14"
                onClick={() => setShowApplicationsModal(true)}
                disabled={!currentProject || !currentProject.allow_join_requests}
              />
              <Button
                label={t.projectpanel796}
                icon="pi pi-users"
                className="p-button-outlined flex-col h-14"
                onClick={() => setShowMembersModal(true)}
                disabled={!currentProject}
              />
              <Button
                label={t.projectpanel803}
                icon="pi pi-users"
                className="p-button-outlined flex-col h-14"
                onClick={() => {
                  if (currentProject) {
                    setGlobalSelectedProject(currentProject as any);
                    onOpenPanel?.('teams-filtered', { title: `Teams Management - ${currentProject.name}`, filterByProject: true, source: 'project-management' });
                  }
                }}
                disabled={!currentProject || !onOpenPanel}
              />
              <Button
                label={t.projectpanel815}
                icon="pi pi-send"
                className="p-button-outlined flex-col h-14"
                onClick={() => setShowInvitationsModal(true)}
                disabled={!currentProject}
              />
              <Button
                label={t.panelsewnavigationpanel184}
                icon="pi pi-cog"
                className="p-button-outlined flex-col h-14"
                onClick={() => {
                  if (currentProject) {
                    onOpenPanel?.(`template-management-project-${currentProject.id}`, {
                      title: `Template Management: ${currentProject.name}`,
                      filterByProject: true,
                      forceProjectId: currentProject.id,
                      forceProjectName: currentProject.name
                    });
                  }
                }}
                disabled={!currentProject || !onOpenPanel}
              />
              <Button
                label={t.panelsewnavigationpanel223}
                icon="pi pi-database"
                className="p-button-outlined flex-col h-14"
                onClick={() => onOpenPanel?.('database-management', { title: `Database - ${currentProject?.name}`, filterByProject: true })}
                disabled={!currentProject || !onOpenPanel}
              />
            </div>
          </Card>
        </div>

        {/* Projects List */}
        <div className="space-y-4">
          <Card title={t.projectpanel850} className="flex-1">
            <DataTable
              value={projects.filter(p => p.id)}
              className="p-datatable-sm"
              emptyMessage={t.panelt1813}
              paginator
              rows={10}
              rowsPerPageOptions={[5, 10, 20]}
            >
              <Column field="name" header={t.manageteammodal316} sortable />
              <Column 
                field="owner" 
                header={t.manageteammodal320} 
                body={ownerTemplate}
                className="w-40"
              />
              <Column 
                field="created_at" 
                header={t.databasemanagementpanel861} 
                body={dateTemplate}
                className="w-32"
                sortable
              />
              <Column 
                header={t.applicationsmodal335} 
                body={statusTemplate}
                className="w-24"
              />
              <Column 
                header={t.applicationsmodal354} 
                body={actionTemplate}
                className="w-32"
              />
            </DataTable>
          </Card>
        </div>
          </div>
        </div>
      </div>

      {/* Create Project Modal with Tabs */}
      <Dialog
        header={t.projectpanel892}
        visible={showCreateModal}
        onHide={handleCreateModalHide}
        style={{ width: '800px' }}
        modal
        closable
        draggable={true}
        resizable={true}
        className="p-dialog-custom"
      >
        <TabView>
          {/* Tab 1: Project Settings */}
          <TabPanel header={t.editprojectmodal227} leftIcon="pi pi-cog">
            <div className="space-y-4">
              <div className="field">
                <label htmlFor="create-name" className="block text-sm font-medium text-white mb-2">
                  Project Name *
                </label>
                <InputText
                  id="create-name"
                  value={createForm.name}
                  onChange={(e) => {
                    setCreateForm(prev => ({ ...prev, name: e.target.value }));
                    setError(''); // Clear error when user types
                  }}
                  placeholder={t.editprojectmodal240}
                  className="w-full font-mono"
                  disabled={creating}
                  required
                />
                <div className="text-xs text-gray-400 mt-1">
                  {t.editprojectmodal569}
                </div>
                <div className="text-xs text-orange-400 mt-1">
                  {t.editprojectmodal252}
                </div>
              </div>

              <div className="field">
                <label htmlFor="create-description" className="block text-sm font-medium text-white mb-2">
                  Description
                </label>
                <InputTextarea
                  id="create-description"
                  value={createForm.description}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder={t.projectpanel938}
                  className="w-full"
                  rows={3}
                  disabled={creating}
                />
              </div>

              <div className="field">
                <div className="flex items-center space-x-2 mb-3">
                  <input
                    type="checkbox"
                    id="create-is-public"
                    checked={createForm.is_public}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, is_public: e.target.checked }))}
                    disabled={creating}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                  />
                  <label htmlFor="create-is-public" className="text-sm font-medium text-white cursor-pointer">
                    Public Project
                  </label>
                </div>
                <p className="text-xs text-gray-400 mb-3">
                  Public projects are visible to all users and can be discovered in the project gallery.
                </p>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="create-allow-join"
                    checked={createForm.allow_join_requests}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, allow_join_requests: e.target.checked }))}
                    disabled={creating}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                  />
                  <label htmlFor="create-allow-join" className="text-sm font-medium text-white cursor-pointer">
                    Allow Join Requests
                  </label>
                </div>
                <p className="text-xs text-gray-400">
                  Users can request to join this project using a join code.
                </p>
              </div>
            </div>
          </TabPanel>

          {/* Tab 2: Database Connection */}
          <TabPanel header={t.editprojectmodal332} leftIcon="pi pi-database">
            <div className="space-y-4">
              <div className="field">
                <label htmlFor="create-db-name" className="block text-sm font-medium text-white mb-2">
                  Database Name
                </label>
                <InputText
                  id="create-db-name"
                  value={createForm.database_name}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, database_name: e.target.value }))}
                  placeholder="project_database"
                  className="w-full"
                  disabled={creating}
                />
                <div className="text-xs text-gray-400 mt-1">
                  Name der Datenbank für dieses Projekt
                </div>
              </div>

              <div className="field">
                <label htmlFor="create-db-type" className="block text-sm font-medium text-white mb-2">
                  Database Type
                </label>
                <Dropdown
                  id="create-db-type"
                  value={createForm.database_type}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, database_type: e.target.value }))}
                  options={[
                    { label: 'MySQL', value: 'MySQL' },
                    { label: 'PostgreSQL', value: 'PostgreSQL' },
                    { label: 'SQLite', value: 'SQLite' },
                    { label: 'SQL Server', value: 'MSSQL' }
                  ]}
                  className="w-full"
                  disabled={creating}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="field">
                  <label htmlFor="create-db-server" className="block text-sm font-medium text-white mb-2">
                    Server
                  </label>
                  <InputText
                    id="create-db-server"
                    value={createForm.database_server}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, database_server: e.target.value }))}
                    placeholder="127.0.0.1"
                    className="w-full"
                    disabled={creating}
                  />
                </div>

                <div className="field">
                  <label htmlFor="create-db-port" className="block text-sm font-medium text-white mb-2">
                    Port
                  </label>
                  <InputText
                    id="create-db-port"
                    value={createForm.database_port}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, database_port: e.target.value }))}
                    placeholder="3306"
                    className="w-full"
                    disabled={creating}
                  />
                </div>
              </div>

              <div className="field">
                <label htmlFor="create-db-username" className="block text-sm font-medium text-white mb-2">
                  Username
                </label>
                <InputText
                  id="create-db-username"
                  value={createForm.database_username}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, database_username: e.target.value }))}
                  placeholder="database_user"
                  className="w-full"
                  disabled={creating}
                />
              </div>

              <div className="field">
                <label htmlFor="create-db-password" className="block text-sm font-medium text-white mb-2">
                  Password
                </label>
                <InputText
                  id="create-db-password"
                  type="password"
                  value={createForm.database_password}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, database_password: e.target.value }))}
                  placeholder="database_password"
                  className="w-full"
                  disabled={creating}
                />
              </div>
            </div>
          </TabPanel>

          {/* Tab 3: Project Properties */}
          <TabPanel header={t.editprojectmodal426} leftIcon="pi pi-file">
            <div className="space-y-4">
              <div className="field">
                <label htmlFor="create-project-directory" className="block text-sm font-medium text-white mb-2">
                  Project Directory
                </label>
                <InputText
                  id="create-project-directory"
                  value={createForm.project_directory}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, project_directory: e.target.value }))}
                  placeholder="C:\Users\Public\Documents\my_project"
                  className="w-full"
                  disabled={creating}
                />
                <div className="text-xs text-gray-400 mt-1">
                  Pfad wo generierte Dateien gespeichert werden sollen
                </div>
              </div>

              <div className="field">
                <label htmlFor="create-project-url" className="block text-sm font-medium text-white mb-2">
                  Project URL
                </label>
                <InputText
                  id="create-project-url"
                  value={createForm.project_url}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, project_url: e.target.value }))}
                  placeholder="http://localhost/my_project"
                  className="w-full"
                  disabled={creating}
                />
                <div className="text-xs text-gray-400 mt-1">
                  URL für den Zugriff auf das Projekt
                </div>
              </div>

              <div className="field">
                <label htmlFor="create-start-page" className="block text-sm font-medium text-white mb-2">
                  Start Page
                </label>
                <InputText
                  id="create-start-page"
                  value={createForm.start_page}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, start_page: e.target.value }))}
                  placeholder="index.php"
                  className="w-full"
                  disabled={creating}
                />
                <div className="text-xs text-gray-400 mt-1">
                  Haupt-Einstiegsdatei (z.B. index.php, main.py, app.js)
                </div>
              </div>

              <div className="field">
                <label htmlFor="create-default-language" className="block text-sm font-medium text-white mb-2">
                  Default Language
                </label>
                <Dropdown
                  id="create-default-language"
                  value={createForm.default_language}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, default_language: e.target.value }))}
                  options={[
                    { label: t.editprojectmodal484, value: 'en' },
                    { label: t.editprojectmodal485, value: 'de' },
                    { label: t.editprojectmodal486, value: 'fr' },
                    { label: t.editprojectmodal487, value: 'es' },
                    { label: t.editprojectmodal488, value: 'it' }
                  ]}
                  className="w-full"
                  disabled={creating}
                />
                <div className="text-xs text-gray-400 mt-1">
                  Standard-Sprache für Projekt-Generierung
                </div>
              </div>

              <div className="field">
                <label htmlFor="create-filename-short-length" className="block text-sm font-medium text-white mb-2">
                  Filename Short Length
                </label>
                <Dropdown
                  id="create-filename-short-length"
                  value={createForm.filename_short_length}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, filename_short_length: e.target.value }))}
                  options={[
                    { label: t.editprojectmodal506, value: 2 },
                    { label: t.editprojectmodal507, value: 3 },
                    { label: t.editprojectmodal508, value: 4 },
                    { label: t.editprojectmodal509, value: 5 }
                  ]}
                  className="w-full"
                  disabled={creating}
                />
                <div className="text-xs text-gray-400 mt-1">
                  Länge der kurzen Dateinamen im Database Designer (z.B. "us" für users)
                </div>
              </div>
            </div>
          </TabPanel>

          {/* Tab 4: Localization Settings */}
          <TabPanel header={t.editprojectmodal522} leftIcon="pi pi-globe">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="field">
                  <label htmlFor="create-decimal-separator" className="block text-sm font-medium text-white mb-2">
                    Decimal Separator
                  </label>
                  <InputText
                    id="create-decimal-separator"
                    value={createForm.decimal_separator}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, decimal_separator: e.target.value }))}
                    placeholder=","
                    className="w-full"
                    disabled={creating}
                    maxLength={1}
                  />
                  <div className="text-xs text-gray-400 mt-1">
                    Dezimaltrennzeichen (z.B. 1,50 oder 1.50)
                  </div>
                </div>

                <div className="field">
                  <label htmlFor="create-thousands-separator" className="block text-sm font-medium text-white mb-2">
                    Thousands Separator
                  </label>
                  <InputText
                    id="create-thousands-separator"
                    value={createForm.thousands_separator}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, thousands_separator: e.target.value }))}
                    placeholder="."
                    className="w-full"
                    disabled={creating}
                    maxLength={1}
                  />
                  <div className="text-xs text-gray-400 mt-1">
                    Tausendertrennzeichen (z.B. 1.000 oder 1,000)
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="field">
                  <label htmlFor="create-date-format" className="block text-sm font-medium text-white mb-2">
                    Date Format
                  </label>
                  <InputText
                    id="create-date-format"
                    value={createForm.date_format}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, date_format: e.target.value }))}
                    placeholder="d.m.Y"
                    className="w-full"
                    disabled={creating}
                  />
                  <div className="text-xs text-gray-400 mt-1">
                    PHP-Datumsformat (d.m.Y = 31.12.2024)
                  </div>
                </div>

                <div className="field">
                  <label htmlFor="create-time-format" className="block text-sm font-medium text-white mb-2">
                    Time Format
                  </label>
                  <InputText
                    id="create-time-format"
                    value={createForm.time_format}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, time_format: e.target.value }))}
                    placeholder="H:i:s"
                    className="w-full"
                    disabled={creating}
                  />
                  <div className="text-xs text-gray-400 mt-1">
                    PHP-Zeitformat (H:i:s = 23:59:59)
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="field">
                  <label htmlFor="create-currency-symbol" className="block text-sm font-medium text-white mb-2">
                    Currency Symbol
                  </label>
                  <InputText
                    id="create-currency-symbol"
                    value={createForm.currency_symbol}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, currency_symbol: e.target.value }))}
                    placeholder={t.editprojectmodal602}
                    className="w-full"
                    disabled={creating}
                    maxLength={5}
                  />
                  <div className="text-xs text-gray-400 mt-1">
                    Währungssymbol (€, $, CHF, etc.)
                  </div>
                </div>

                <div className="field">
                  <label htmlFor="create-timezone" className="block text-sm font-medium text-white mb-2">
                    Timezone
                  </label>
                  <Dropdown
                    id="create-timezone"
                    value={createForm.timezone}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, timezone: e.target.value }))}
                    options={[
                      { label: 'Europe/Vienna', value: 'Europe/Vienna' },
                      { label: 'Europe/Berlin', value: 'Europe/Berlin' },
                      { label: 'Europe/Zurich', value: 'Europe/Zurich' },
                      { label: 'Europe/London', value: 'Europe/London' },
                      { label: 'Europe/Paris', value: 'Europe/Paris' },
                      { label: 'America/New_York', value: 'America/New_York' },
                      { label: 'America/Los_Angeles', value: 'America/Los_Angeles' },
                      { label: 'Asia/Tokyo', value: 'Asia/Tokyo' },
                      { label: t.projectpanel1297, value: t.projectpanel1297 },
                      { label: 'UTC', value: 'UTC' }
                    ]}
                    className="w-full"
                    disabled={creating}
                  />
                  <div className="text-xs text-gray-400 mt-1">
                    Standard-Zeitzone für Projekt
                  </div>
                </div>
              </div>
            </div>
          </TabPanel>
        </TabView>

        {/* Error message in modal */}
        {error && (
          <div className="mt-4">
            <Message
              severity="error"
              text={error}
              className="w-full"
            />
          </div>
        )}

        <div className="flex justify-end space-x-2 pt-4 gap-2">
          <Button
            label={t.applicationsmodal432}
            icon="pi pi-times"
            onClick={handleCreateModalHide}
            className="p-button-text"
            disabled={creating}
          />
          <Button
            label={creating ? t.createtablemodal614 : t.projectpanel776}
            icon={creating ? "pi pi-spinner pi-spin" : "pi pi-plus"}
            onClick={handleCreateProject}
            disabled={creating || !createForm.name.trim()}
          />
        </div>
      </Dialog>

      {/* Delete Project Confirmation Modal */}
      <Dialog
        header={t.projectpanel1342}
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
                {t.projectpanel1356}
              </h3>
              <p className="text-sm text-gray-600 mb-2">
                <strong>{projectToDelete?.name}</strong>
              </p>
              <p className="text-sm text-red-400 mb-4">
                {t.projectpanel1362}
              </p>

              {/* Confirmation Input */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Type <strong className="text-red-400">DELETE</strong> to confirm
                </label>
                <InputText
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="DELETE"
                  className="w-full"
                  disabled={deleting}
                />
                <small className="text-gray-500 mt-1 block">
                  You must enter exactly DELETE (capital letters)
                </small>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4 gap-2">
            <Button
              label={t.applicationsmodal432}
              icon="pi pi-times"
              onClick={handleDeleteModalHide}
              className="p-button-text"
              disabled={deleting}
            />
            <Button
              label={deleting ? t.deleting : t.projectpanel1342}
              icon={deleting ? "pi pi-spinner pi-spin" : "pi pi-trash"}
              onClick={handleDeleteProject}
              className="p-button-danger"
              disabled={deleting || deleteConfirmText !== 'DELETE'}
            />
          </div>
        </div>
      </Dialog>


      {/* Join Code Modal */}
      <JoinCodeModal
        visible={showJoinCodeModal}
        onHide={() => setShowJoinCodeModal(false)}
        onSuccess={loadProjectsFromContext}
      />

      {/* Applications Modal */}
      <ApplicationsModal
        visible={showApplicationsModal}
        onHide={() => setShowApplicationsModal(false)}
        project={currentProject}
      />

      {/* Project Invitations Modal */}
      <ProjectInvitationsModal
        visible={showInvitationsModal}
        onHide={() => setShowInvitationsModal(false)}
        project={currentProject}
        onSuccess={loadProjectsFromContext}
      />

      {/* Project Members Modal */}
      <ProjectMembersModal
        visible={showMembersModal}
        onHide={() => setShowMembersModal(false)}
        project={currentProject}
      />

      {/* Edit Project Modal - Replaced by ProjectSettingsPanel */}
      {/* <EditProjectModal
        visible={showEditModal}
        onHide={() => setShowEditModal(false)}
        project={projectToEdit}
        onSuccess={handleEditModalSuccess}
        projectMembers={projectMembers}
      /> */}

      {/* Project Overview Modal */}
      <Dialog
        header={t.projectpanel562+`: ${selectedProjectForOverview?.name || ''}`}
        visible={showProjectOverviewModal}
        onHide={() => setShowProjectOverviewModal(false)}
        style={{ width: '800px' }}
        modal
        className="p-fluid"
      >
        {selectedProjectForOverview && (
          <div className="space-y-6">
            {/* Project Properties */}
            <div className="bg-gray-800 p-4 rounded">
              <h3 className="text-lg font-semibold mb-3 text-white">{t.editprojectmodal426}</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="font-medium text-gray-300">{t.projectpanel1443}</span>
                  <span className="ml-2 text-white">{selectedProjectForOverview.name}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-300">{t.projectpanel1447}</span>
                  <span className="ml-2 text-white">{selectedProjectForOverview.owner.name}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-300">{t.projectpanel1451}</span>
                  <span className="ml-2 text-white">{formatDate(selectedProjectForOverview.created_at)}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-300">{t.projectpanel1449}</span>
                  <span className="ml-2 text-blue-400 font-mono">{selectedProjectForOverview.join_code || t.createtablemodal482}</span>
                </div>
                <div className="col-span-2">
                  <span className="font-medium text-gray-300">{t.projectpanel1453}</span>
                  <span className="ml-2 text-white">{selectedProjectForOverview.description || t.schemaexportcontroller226}</span>
                </div>
              </div>
            </div>

            {/* Project Members Section */}
            <div className="bg-gray-800 p-4 rounded">
              <h3 className="text-lg font-semibold mb-3 text-white">{t.projectpanel1467}</h3>
              {loadingMembersData ? (
                <div className="flex items-center justify-center py-4">
                  <i className="pi pi-spinner pi-spin text-indigo-400 mr-2"></i>
                  <span className="text-indigo-300">{t.projectpanel1471}</span>
                </div>
              ) : projectMembers.length > 0 ? (
                <div className="bg-gray-700 p-3 rounded border border-gray-600" style={{ maxHeight: '200px', overflow: 'auto' }}>
                  <div className="space-y-2">
                    {projectMembers.map((member, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-600 rounded hover:bg-gray-500">
                        <div className="flex items-center space-x-3">
                          <i className="pi pi-user text-indigo-400"></i>
                          <div>
                            <div className="font-medium text-white">{member.user?.name || t.panelt1103}</div>
                            <div className="text-sm text-gray-300">{member.user?.email || t.projectpanel1482}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            member.role === 'owner' ? 'bg-purple-100 text-purple-800' :
                            member.role === 'admin' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {member.role || t.manageteammodal394}
                          </span>
                          {member.joined_at && (
                            <div className="text-xs text-gray-400 mt-1">
                              Joined: {new Date(member.joined_at).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-gray-300 italic text-center p-4">
                  <i className="pi pi-users mr-2"></i>
                  No project members loaded yet.
                </div>
              )}
            </div>

            {/* Teams Section with TreeView */}
            <div className="bg-gray-800 p-4 rounded">
              <h3 className="text-lg font-semibold mb-3 text-white">{t.projectpanel1513}</h3>
              {loadingTeamsData ? (
                <div className="flex items-center justify-center py-4">
                  <i className="pi pi-spinner pi-spin text-blue-400 mr-2"></i>
                  <span className="text-blue-300">Loading teams...</span>
                </div>
              ) : projectTeamsTree.length > 0 ? (
                <div className="bg-gray-700 p-3 rounded border border-gray-600" style={{ maxHeight: '300px', overflow: 'auto' }}>
                  <ClassicTreeView
                    data={projectTeamsTree}
                  />
                </div>
              ) : (
                <div className="text-gray-300 italic">
                  <i className="pi pi-info-circle mr-2"></i>
                  No teams assigned to this project yet.
                </div>
              )}
            </div>

            {/* Database Schemas Section */}
            <div className="bg-gray-800 p-4 rounded">
              <h3 className="text-lg font-semibold mb-3 text-white">{t.projectpanel1535}</h3>
              {loadingSchemasData ? (
                <div className="flex items-center justify-center p-4">
                  <i className="pi pi-spin pi-spinner text-green-400 mr-2"></i>
                  <span className="text-green-300">Loading schemas...</span>
                </div>
              ) : projectSchemasTree.length > 0 ? (
                <div className="bg-gray-700 p-3 rounded border border-gray-600" style={{ maxHeight: '300px', overflow: 'auto' }}>
                  <ClassicTreeView
                    data={projectSchemasTree}
                  />
                </div>
              ) : (
                <div className="text-gray-300 italic text-center p-4">
                  No database schemas linked to this project yet.
                </div>
              )}
            </div>

            {/* Templates Section */}
            <div className="bg-gray-800 p-4 rounded">
              <h3 className="text-lg font-semibold mb-3 text-white">{t.projectpanel1556}</h3>
              {loadingTemplatesData ? (
                <div className="flex items-center justify-center p-4">
                  <i className="pi pi-spin pi-spinner text-purple-400 mr-2"></i>
                  <span className="text-purple-300">Loading templates...</span>
                </div>
              ) : projectTemplatesTree.length > 0 ? (
                <div className="bg-gray-700 p-3 rounded border border-gray-600" style={{ maxHeight: '300px', overflow: 'auto' }}>
                  <ClassicTreeView
                    data={projectTemplatesTree}
                  />
                </div>
              ) : (
                <div className="text-gray-300 italic text-center p-4">
                  No templates linked to this project yet.
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between items-center pt-4 border-t border-gray-600">
              {/* Left side - Public Link */}
              <div>
                {selectedProjectForOverview.is_public && selectedProjectForOverview.owner?.username && (
                  <Button
                    label={t.copyPublicLink || 'Copy Public Link'}
                    icon="pi pi-link"
                    className="p-button-outlined p-button-success"
                    onClick={() => {
                      const publicUrl = `${window.location.origin}/project/${selectedProjectForOverview.owner.username}/${selectedProjectForOverview.name}`;
                      navigator.clipboard.writeText(publicUrl).then(() => {
                        setSuccess(t.publicLinkCopied || 'Public link copied to clipboard!');
                        setTimeout(() => setSuccess(''), 3000);
                      });
                    }}
                  />
                )}
                {!selectedProjectForOverview.is_public && (
                  <span className="text-gray-400 text-sm italic">
                    <i className="pi pi-lock mr-1"></i>
                    {t.projectNotPublic || 'Project is private - make it public to share'}
                  </span>
                )}
              </div>
              {/* Right side - Close & Settings */}
              <div className="flex gap-2">
                <Button
                  label={t.authmodalsesetpasswordmodal162}
                  icon="pi pi-times"
                  className="p-button-text"
                  onClick={() => setShowProjectOverviewModal(false)}
                />
              <Button
                label={t.projectpanel1579}
                icon="pi pi-cog"
                className="min-w-fit whitespace-nowrap"
                onClick={() => {
                  setShowProjectOverviewModal(false);
                  handleEdit(selectedProjectForOverview);
                }}
              />
              </div>
            </div>
          </div>
        )}
      </Dialog>

      {/* Select New Project Dialog */}
      <Dialog
        header="Project Created Successfully!"
        visible={showSelectProjectDialog}
        onHide={() => {
          setShowSelectProjectDialog(false);
          setNewlyCreatedProject(null);
        }}
        style={{ width: '500px' }}
        modal
        closable={false}
        draggable={false}
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 bg-green-900/30 border border-green-700 rounded-lg p-4">
            <i className="pi pi-check-circle text-green-400 text-3xl"></i>
            <div>
              <div className="text-lg font-semibold text-white">
                {newlyCreatedProject?.name}
              </div>
              <div className="text-sm text-gray-300">
                Project has been created successfully!
              </div>
            </div>
          </div>

          <div className="text-gray-200 text-center py-2">
            Do you want to select this project as your default project?
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-gray-600">
            <Button
              label="No, thanks"
              icon="pi pi-times"
              className="p-button-text"
              onClick={handleSelectNewProjectNo}
            />
            <Button
              label="Yes, select it"
              icon="pi pi-check"
              className="p-button-success"
              onClick={handleSelectNewProjectYes}
              autoFocus
            />
          </div>
        </div>
      </Dialog>

      {/* Project Unlock Modal - Shows before creating 2nd project as Free user */}
      <ProjectUnlockModal
        visible={showProjectUnlockModal}
        onHide={() => setShowProjectUnlockModal(false)}
        onConfirm={handleProjectUnlockConfirm}
        onBuyCredits={handleBuyCredits}
        onUpgradePatron={() => { setPlanModalInitialTab(0); setShowPlanModal(true); }}
        currentCredits={currentUser?.credits || 0}
        creditCost={50}
      />

      {/* Plan Modal - For buying credits or upgrading subscription */}
      <PlanModal
        visible={showPlanModal}
        onHide={() => setShowPlanModal(false)}
        initialTab={planModalInitialTab}
      />
    </div>
  );
}