import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useTranslation, SupportedLanguage, getStoredLanguage } from '@/i18n';
import JSZip from 'jszip';
import { Dropdown } from 'primereact/dropdown';
import PlanModal from '@/Components/AuthModals/PlanModal';
import ProfileModal from '@/Components/AuthModals/ProfileModal';
import { useTheme } from '@/contexts/ThemeContext';

interface Project {
  id: number;
  name: string;
  description?: string;
  archive_format?: 'zip' | 'tar.gz' | 'tar.xz';
  // Subscription / Lock status
  is_soft_locked?: boolean;
  // Git integration fields
  git_provider_id?: number;
  git_repository?: string;
  git_default_branch?: string;
  git_main_branch?: string;
  git_provider?: {
    id: number;
    provider: 'github' | 'gitlab';
    username: string;
  };
  // FTP/SSH deployment fields
  deployment_type?: 'ftp' | 'sftp' | null;
  ftp_host?: string;
  ftp_port?: number;
  ftp_username?: string;
  ftp_directory?: string;
  has_ftp_deployment?: boolean;
}

interface Template {
  id: number;
  name: string;
  description?: string;
  files?: TemplateFile[];
  is_soft_locked?: boolean;
}

interface TemplateFile {
  id: number;
  file_name: string;
  file_type: string;
  file_path: string;
}

interface SchemaSubscription {
  id: number;
  expires_at: string | null;
  is_expired: boolean;
  is_soft_locked: boolean;
  days_remaining: number | null;
}

interface Schema {
  id: number;
  name: string;
  last_version?: number;
  is_soft_locked?: boolean;
  subscription?: SchemaSubscription | null;
}

interface Language {
  code: string;
  name: string;
}

interface Warning {
  type: 'database' | 'language';
  message: string;
  templates: string[];
}

interface FileConflict {
  filePath: string;
  templates: Array<{
    id: number;
    name: string;
  }>;
  type: 'inter-template' | 'intra-template'; // 🆕 Distinguish conflict types
}

interface GenerationError {
  file: string;
  template: string;
  table?: string;
  language?: string;
  error: string;
}

// Code Adjustment interfaces for applying during generation
interface CodeAdjustmentInsertion {
  id: number;
  insertion_type: 'beginning' | 'middle' | 'end';
  anchor_text: string;
  insertion_content: string;
  line_offset: number;
  insertion_order: number;
}

interface CodeAdjustment {
  id: number;
  name: string;
  file_pattern: string;
  is_active: boolean;
  insertions: CodeAdjustmentInsertion[];
}

// Git Provider interfaces
interface GitProvider {
  id: number;
  provider: 'github' | 'gitlab';
  username: string;
  connected_at: string;
}

interface GitRepository {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  url: string;
  default_branch: string;
}

interface GitBranch {
  name: string;
  protected: boolean;
}

export default function CodeGenerationPanel() {
  // i18n setup
  const [currentLanguage] = React.useState<SupportedLanguage>(getStoredLanguage());
  const { t: t } = useTranslation(currentLanguage); // Prefixed with _ to indicate intentionally unused

  // Theme
  const { colors } = useTheme();

  // State
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplateIds, setSelectedTemplateIds] = useState<Set<number>>(new Set());
  const [schemas, setSchemas] = useState<Schema[]>([]);
  const [selectedSchemaIds, setSelectedSchemaIds] = useState<Set<number>>(new Set());
  const [languages, setLanguages] = useState<Language[]>([]);
  const [selectedLanguageCodes, setSelectedLanguageCodes] = useState<Set<string>>(new Set());
  const [migrationFromVersion, setMigrationFromVersion] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<Warning[]>([]);
  const [generating, setGenerating] = useState(false);
  const [generationErrors, setGenerationErrors] = useState<GenerationError[]>([]);
  const [generationStats, setGenerationStats] = useState<{ errors: number; files: number } | null>(null);
  const [archiveWarning, setArchiveWarning] = useState<string | null>(null);
  const [fileConflicts, setFileConflicts] = useState<FileConflict[]>([]);
  const [showConflictDialog, setShowConflictDialog] = useState(false);

  // 🔗 Git Push States
  const [pushToGit, setPushToGit] = useState(false);
  const [gitProviders, setGitProviders] = useState<GitProvider[]>([]);
  const [selectedGitProvider, setSelectedGitProvider] = useState<GitProvider | null>(null);
  const [gitRepositories, setGitRepositories] = useState<GitRepository[]>([]);
  const [selectedRepository, setSelectedRepository] = useState<GitRepository | null>(null);
  const [gitBranches, setGitBranches] = useState<GitBranch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  const [newBranchName, setNewBranchName] = useState<string>('');
  const [useNewBranch, setUseNewBranch] = useState(false);
  const [commitMessage, setCommitMessage] = useState<string>('');
  const [loadingGitData, setLoadingGitData] = useState(false);
  const [gitProvidersLoaded, setGitProvidersLoaded] = useState(false);
  const [gitPushStatus, setGitPushStatus] = useState<'idle' | 'pushing' | 'success' | 'error'>('idle');
  const [rememberGitSettings, setRememberGitSettings] = useState(false);
  const [rememberPushToGit, setRememberPushToGit] = useState(false);
  // PR and Merge options
  const [createPullRequest, setCreatePullRequest] = useState(false);
  const [prTitle, setPrTitle] = useState<string>('');
  const [autoMerge, setAutoMerge] = useState(false);
  const [deleteBranchAfterMerge, setDeleteBranchAfterMerge] = useState(false);
  // Git Integration Access
  const [gitIntegrationAccess, setGitIntegrationAccess] = useState<{
    has_access: boolean;
    access_type?: string;
    unlock_cost?: number;
    days_remaining?: number;
    expires_at?: string;
    is_patron?: boolean;
  } | null>(null);
  const [unlockingGitIntegration, setUnlockingGitIntegration] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileModalDefaultTab, setProfileModalDefaultTab] = useState(0);

  // 📡 FTP/SSH Upload State
  const [ftpUploading, setFtpUploading] = useState(false);

  // 🔧 Code Adjustments Access
  const [codeAdjustmentsAccess, setCodeAdjustmentsAccess] = useState<{
    has_access: boolean;
    access_type?: string;
    days_remaining?: number;
    is_patron?: boolean;
  } | null>(null);

  // 📋 Deployment Log States
  const [deploymentLogs, setDeploymentLogs] = useState<string[]>([]);
  const [deploymentTaskId, setDeploymentTaskId] = useState<number | null>(null);
  const [deploymentPolling, setDeploymentPolling] = useState(false);
  const deploymentLogEndRef = useRef<HTMLDivElement>(null);
  const deploymentPollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // 📦 Generation metadata ref (populated during generation, used for upload)
  const generationMetadataRef = useRef<{
    tables: string[];
    languages: string[];
    templateIds: number[];
    templateNames: string[];
    filesCount: number;
  }>({
    tables: [],
    languages: [],
    templateIds: [],
    templateNames: [],
    filesCount: 0,
  });

  // 🎯 Progress tracking
  const [generationProgress, setGenerationProgress] = useState<{
    current: number;
    total: number;
    percentage: number;
    eta: string;
    currentTask: string;
  } | null>(null);

  // 💳 Credit info for generation
  const [currentUser, setCurrentUser] = useState<{
    credits: number;
    user_type?: string;
    patron_type?: string;
  } | null>(null);

  // 🛒 PlanModal for buying credits
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [planModalInitialTab, setPlanModalInitialTab] = useState(1); // Tab 1 = Buy Credits

  // 📊 Migration version options based on selected schemas
  const migrationVersionOptions = useMemo(() => {
    if (selectedSchemaIds.size === 0) return [];

    // Find the minimum last_version among selected schemas
    // Migration can only go from version X to current, so we need the lowest common denominator
    const selectedSchemas = schemas.filter(s => selectedSchemaIds.has(s.id));
    const minVersion = Math.min(...selectedSchemas.map(s => s.last_version || 1));

    // If minVersion is 1, we can't migrate (no previous version)
    if (minVersion <= 1) return [];

    // Generate options from (minVersion - 1) down to 1
    const options = [];
    for (let v = minVersion - 1; v >= 1; v--) {
      options.push({ label: `Version ${v}`, value: v });
    }
    return options;
  }, [schemas, selectedSchemaIds]);

  // Reset migration version when schemas change
  useEffect(() => {
    if (migrationVersionOptions.length === 0) {
      setMigrationFromVersion(null);
    } else if (migrationFromVersion !== null && !migrationVersionOptions.find(o => o.value === migrationFromVersion)) {
      setMigrationFromVersion(null);
    }
  }, [migrationVersionOptions, migrationFromVersion]);

  // Auto-scroll deployment log to bottom
  useEffect(() => {
    if (deploymentLogEndRef.current) {
      deploymentLogEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [deploymentLogs]);

  // Cleanup deployment polling interval on unmount
  useEffect(() => {
    return () => {
      if (deploymentPollIntervalRef.current) {
        clearInterval(deploymentPollIntervalRef.current);
        deploymentPollIntervalRef.current = null;
      }
    };
  }, []);

  // Load user projects and user data on mount
  useEffect(() => {
    loadProjects();
    loadCurrentUser();
    loadCodeAdjustmentsAccess();
  }, []);

  // Load Code Adjustments access status
  const loadCodeAdjustmentsAccess = async () => {
    try {
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (!token) return;

      const response = await fetch('/api/subscriptions/code-adjustments/status', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCodeAdjustmentsAccess(data);
      }
    } catch (error) {
      console.error('Failed to load code adjustments access:', error);
    }
  };

  // Load current user data for credit info
  const loadCurrentUser = async () => {
    try {
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (!token) return;

      const response = await fetch('/api/user', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        const userData = await response.json();
        setCurrentUser(userData);
      }
    } catch {
      // Error loading current user - silently fail
    }
  };

  // 🔗 Reset "Merken" checkbox when project changes
  // The actual "Push to Git" state is set in loadProjectData after we know if project has git
  useEffect(() => {
    if (selectedProjectId) {
      // Always reset "Merken" checkbox to OFF on project load/restart
      setRememberPushToGit(false);
    }
  }, [selectedProjectId]);

  // 🔗 Handle "Merken" checkbox change
  const handleRememberChange = (checked: boolean) => {
    setRememberPushToGit(checked);
    if (checked && selectedProjectId) {
      // When "Merken" is checked, immediately save current Push to Git state
      localStorage.setItem(`pushToGit_${selectedProjectId}`, pushToGit.toString());
    }
    // When unchecked, we keep the saved value - it remains for next session
  };

  // 🔗 Handle "Push to Git" checkbox change
  const handlePushToGitChange = (checked: boolean) => {
    setPushToGit(checked);
    if (!checked) {
      setSelectedGitProvider(null);
      setSelectedRepository(null);
      setGitPushStatus('idle');
      setGitProvidersLoaded(false);
    }
    // If "Merken" is currently ON, save immediately
    if (rememberPushToGit && selectedProjectId) {
      localStorage.setItem(`pushToGit_${selectedProjectId}`, checked.toString());
    }
  };

  // 🔗 Load connected Git providers when pushToGit is enabled
  useEffect(() => {
    if (pushToGit) {
      loadGitProviders();
    }
  }, [pushToGit]);

  // 🔗 Load repositories when provider is selected (wait for providers to be fully loaded)
  useEffect(() => {
    if (selectedGitProvider && gitProvidersLoaded) {
      loadGitRepositories(selectedGitProvider.provider);
    } else if (!selectedGitProvider) {
      setGitRepositories([]);
      setSelectedRepository(null);
    }
  }, [selectedGitProvider, gitProvidersLoaded]);

  // 🔗 Load branches when repository is selected
  useEffect(() => {
    if (selectedGitProvider && selectedRepository) {
      loadGitBranches(selectedGitProvider.provider, selectedRepository.full_name);
      // Don't set default branch here - let the project settings take priority
      // The branch will be set in the pre-select effect below
    } else {
      setGitBranches([]);
      setSelectedBranch('');
    }
  }, [selectedRepository]);

  // 🔗 Generate default commit message when project/templates change
  useEffect(() => {
    if (selectedProject && selectedTemplateIds.size > 0) {
      const templateNames = templates
        .filter(t => selectedTemplateIds.has(t.id))
        .map(t => t.name)
        .slice(0, 3)
        .join(', ');
      const suffix = selectedTemplateIds.size > 3 ? ` (+${selectedTemplateIds.size - 3} more)` : '';
      setCommitMessage(`Generated code for ${selectedProject.name}: ${templateNames}${suffix}`);
    }
  }, [selectedProject, selectedTemplateIds, templates]);

  // 🔗 Pre-select Git provider from project settings or auto-select single provider
  useEffect(() => {
    // Only run when providers are fully loaded
    if (gitProvidersLoaded && gitProviders.length > 0 && !selectedGitProvider) {
      // First priority: Use project's configured provider
      if (selectedProject?.git_provider_id) {
        const matchingProvider = gitProviders.find(p => p.id === selectedProject.git_provider_id);
        if (matchingProvider) {
          setSelectedGitProvider(matchingProvider);
          return;
        }
      }
      // Second priority: Auto-select if only one provider exists
      if (gitProviders.length === 1) {
        setSelectedGitProvider(gitProviders[0]);
      }
    }
  }, [gitProviders, selectedProject, selectedGitProvider, gitProvidersLoaded]);

  // 🔗 Pre-select repository from project settings when repositories are loaded
  useEffect(() => {
    if (gitRepositories.length > 0 && selectedProject?.git_repository && !selectedRepository) {
      const matchingRepo = gitRepositories.find(r => r.full_name === selectedProject.git_repository);
      if (matchingRepo) {
        setSelectedRepository(matchingRepo);
      }
    }
  }, [gitRepositories, selectedProject, selectedRepository]);

  // 🔗 Pre-select branch from project settings when branches are loaded
  useEffect(() => {
    if (gitBranches.length > 0 && selectedRepository) {
      // Priority: 1. Project's git_default_branch, 2. Repository's default_branch
      const projectBranch = selectedProject?.git_default_branch;
      const repoBranch = selectedRepository.default_branch;

      // Use project branch if available and exists
      if (projectBranch) {
        const matchingBranch = gitBranches.find(b => b.name === projectBranch);
        if (matchingBranch) {
          // Branch exists - select it and use existing branch mode
          setSelectedBranch(projectBranch);
          setUseNewBranch(false);
          return;
        } else {
          // Branch doesn't exist - switch to "new branch" mode and pre-fill the name
          setUseNewBranch(true);
          setNewBranchName(projectBranch);
          // Also select main/default branch as base
          if (repoBranch) {
            setSelectedBranch(repoBranch);
          }
          return;
        }
      }

      // Fallback to repository default branch
      if (repoBranch) {
        setSelectedBranch(repoBranch);
        setUseNewBranch(false);
      }
    }
  }, [gitBranches, selectedProject, selectedRepository]);

  // Load connected Git providers
  const loadGitProviders = async () => {
    try {
      setLoadingGitData(true);
      setGitProvidersLoaded(false);
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (!token) {
        console.warn('[GIT DEBUG] No token found when loading providers');
        return;
      }

      const response = await fetch('/api/git/providers', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        const providers = data.providers || [];
        setGitProviders(providers);
        // Store Git Integration access status
        if (data.git_integration_access) {
          setGitIntegrationAccess(data.git_integration_access);
        }
        // Note: Auto-selection is handled separately in useEffect to avoid timing issues
      }
    } catch (err) {
      console.error('Failed to load Git providers:', err);
    } finally {
      setLoadingGitData(false);
      setGitProvidersLoaded(true);
    }
  };

  // Unlock Git Integration with credits
  const unlockGitIntegration = async () => {
    setUnlockingGitIntegration(true);
    try {
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (!token) return;

      const response = await fetch('/api/subscriptions/unlock-git-integration', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setGitIntegrationAccess(data.access_status);
        // Reload git providers to refresh state
        await loadGitProviders();
        // Open ProfileModal on Git tab (index 5) so user can connect provider
        setProfileModalDefaultTab(5);
        setShowProfileModal(true);
      } else {
        const error = await response.json();
        alert(error.message || 'Freischaltung fehlgeschlagen');
      }
    } catch (err) {
      console.error('Error unlocking git integration:', err);
      alert('Freischaltung fehlgeschlagen');
    } finally {
      setUnlockingGitIntegration(false);
    }
  };

  // Load repositories for selected provider
  const loadGitRepositories = async (provider: string) => {
    try {
      setLoadingGitData(true);
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (!token) return;

      const response = await fetch(`/api/git/${provider}/repositories`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setGitRepositories(data.repositories || []);
      }
    } catch (err) {
      console.error('Failed to load repositories:', err);
    } finally {
      setLoadingGitData(false);
    }
  };

  // Load branches for selected repository
  const loadGitBranches = async (provider: string, repoFullName: string) => {
    try {
      setLoadingGitData(true);
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (!token) return;

      // Use query parameter instead of path parameter to avoid URL encoding issues with slashes
      const response = await fetch(`/api/git/${provider}/branches?repo=${encodeURIComponent(repoFullName)}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setGitBranches(data.branches || []);
      }
    } catch (err) {
      console.error('Failed to load branches:', err);
    } finally {
      setLoadingGitData(false);
    }
  };

  // Push generated files to Git
  const pushToGitRepository = async (files: Record<string, string>): Promise<boolean> => {
    if (!selectedGitProvider || !selectedRepository) {
      console.error('No Git provider or repository selected');
      return false;
    }

    const branch = useNewBranch ? newBranchName : selectedBranch;
    if (!branch) {
      console.error('No branch selected');
      return false;
    }

    try {
      setGitPushStatus('pushing');
      setDeploymentLogs(prev => [...prev, `🔗 Pushing to ${selectedGitProvider.provider}/${selectedRepository.full_name}...`]);

      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (!token) throw new Error('Not authenticated');

      const baseBranch = selectedRepository.default_branch || 'main';

      const response = await fetch(`/api/git/${selectedGitProvider.provider}/push-direct`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          repository: selectedRepository.full_name,
          branch: branch,
          commit_message: commitMessage || 'Generated code from Scoriet',
          files: files,
          base_branch: baseBranch,
          // PR options
          create_pr: createPullRequest,
          pr_title: prTitle || `Generated code: ${commitMessage || 'Code generation'}`,
          pr_description: `Automatically generated code from Scoriet.\n\n**Branch:** ${branch}\n**Files:** ${Object.keys(files).length}`,
          auto_merge: autoMerge,
          delete_branch_after_merge: deleteBranchAfterMerge,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to push to Git');
      }

      const result = await response.json();
      setDeploymentLogs(prev => [
        ...prev,
        `✅ Successfully pushed ${result.files_count} files to ${branch}`,
        `📝 Commit: ${result.commit_sha?.substring(0, 7) || 'created'}`,
      ]);

      // Log PR creation if applicable
      if (result.pr_number) {
        const prType = selectedGitProvider.provider === 'gitlab' ? 'Merge Request' : 'Pull Request';
        setDeploymentLogs(prev => [
          ...prev,
          `🔀 ${prType} #${result.pr_number} created`,
          `🔗 ${result.pr_url}`,
        ]);

        // Log merge status if auto-merge was requested
        if (result.merged) {
          setDeploymentLogs(prev => [...prev, `✅ ${prType} automatically merged`]);
        } else if (result.merge_error) {
          setDeploymentLogs(prev => [...prev, `⚠️ Auto-merge failed: ${result.merge_error}`]);
        }
      }

      setGitPushStatus('success');

      // Save Git settings to project if "Remember" is checked
      if (rememberGitSettings && selectedProjectId) {
        await saveGitSettingsToProject();
      }

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setDeploymentLogs(prev => [...prev, `❌ Git push failed: ${message}`]);
      setGitPushStatus('error');
      return false;
    }
  };

  // Save Git settings to project
  const saveGitSettingsToProject = async () => {
    if (!selectedProjectId || !selectedGitProvider || !selectedRepository) return;

    try {
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (!token) return;

      const branch = useNewBranch ? newBranchName : selectedBranch;

      const response = await fetch(`/api/projects/${selectedProjectId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          git_provider_id: selectedGitProvider.id,
          git_repository: selectedRepository.full_name,
          git_default_branch: branch,
          git_main_branch: selectedRepository.default_branch,
        }),
      });

      if (response.ok) {
        setDeploymentLogs(prev => [...prev, '💾 Git-Einstellungen im Projekt gespeichert']);
        // Update local project state
        setSelectedProject(prev => prev ? {
          ...prev,
          git_provider_id: selectedGitProvider.id,
          git_repository: selectedRepository.full_name,
          git_default_branch: branch,
          git_main_branch: selectedRepository.default_branch,
        } : null);
      }
    } catch (err) {
      console.error('Failed to save Git settings:', err);
    }
  };

  // Load project data when project is selected
  useEffect(() => {
    if (selectedProjectId) {
      loadProjectData();
    } else {
      // Reset when no project selected
      setTemplates([]);
      setSelectedTemplateIds(new Set());
      setSchemas([]);
      setSelectedSchemaIds(new Set());
      setLanguages([]);
      setSelectedLanguageCodes(new Set());
      setWarnings([]);
    }
  }, [selectedProjectId]);

  // Check warnings when selections change
  useEffect(() => {
    if (selectedProjectId && templates.length > 0) {
      checkWarnings();
    }
  }, [selectedTemplateIds, selectedSchemaIds, selectedLanguageCodes, templates]);

  const loadProjects = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (!token) {
        setError('Authentication required');
        return;
      }

      const response = await fetch('/api/user/projects', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load projects');
      }

      const data = await response.json();

      let projectsArray = data.data || data.projects || data;

      // Ensure it's an array
      if (!Array.isArray(projectsArray)) {
        projectsArray = [];
      }

      // Remove duplicates based on ID and filter out invalid projects
      const seenIds = new Set();
      const uniqueProjects = projectsArray.filter((project: Project) => {
        // Skip projects without valid ID
        if (!project.id || typeof project.id !== 'number') {
          return false;
        }

        // Skip duplicates
        if (seenIds.has(project.id)) {
          return false;
        }

        seenIds.add(project.id);
        return true;
      });

      setProjects(uniqueProjects);
    } catch (err: any) {
      setError(err.message || 'Failed to load projects');
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const loadProjectData = async () => {
    if (!selectedProjectId) return;

    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (!token) {
        setError('Authentication required');
        return;
      }

      // First, load the project details to get enabled_languages
      const projectRes = await fetch(`/api/projects/${selectedProjectId}`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
      });

      if (!projectRes.ok) {
        throw new Error('Failed to load project details');
      }

      const projectData = await projectRes.json();
      const project = projectData.data || projectData;

      // Load templates via template-usages, schemas, and languages in parallel
      const [templatesRes, schemasRes, allLanguagesRes] = await Promise.all([
        fetch(`/api/projects/${selectedProjectId}/template-usages`, {
          headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
        }),
        fetch(`/api/projects/${selectedProjectId}/schemas`, {
          headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
        }),
        fetch('/api/active-languages', {
          headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
        }),
      ]);

      if (!templatesRes.ok || !schemasRes.ok || !allLanguagesRes.ok) {
        throw new Error('Failed to load project data');
      }

      const [templatesData, schemasData, allLanguagesData] = await Promise.all([
        templatesRes.json(),
        schemasRes.json(),
        allLanguagesRes.json(),
      ]);

      // Extract templates from usages array
      let templatesArray: Template[] = [];
      if (templatesData.usages && Array.isArray(templatesData.usages)) {
        // Each usage has a template property
        templatesArray = templatesData.usages.map((usage: any) => usage.template).filter(Boolean);
      }
      const templatesWithFiles = await Promise.all(
        (Array.isArray(templatesArray) ? templatesArray : []).map(async (template: Template) => {
          try {
            const filesRes = await fetch(`/api/templates/${template.id}/files`, {
              headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
            });
            if (filesRes.ok) {
              const filesData = await filesRes.json();
              const filesArray = filesData.data || filesData;
              return { ...template, files: Array.isArray(filesArray) ? filesArray : [] };
            }
          } catch {
            // If files can't be loaded, continue without them
          }
          return template;
        })
      );

      const schemasArray = schemasData.data || schemasData;

      // Filter languages to only show project-enabled languages
      const allLanguagesArray = allLanguagesData.data || allLanguagesData;
      const enabledLanguageCodes = Array.isArray(project.enabled_languages)
        ? project.enabled_languages
        : (typeof project.enabled_languages === 'string'
          ? JSON.parse(project.enabled_languages)
          : []);

      const projectLanguages = (Array.isArray(allLanguagesArray) ? allLanguagesArray : [])
        .filter((lang: Language) => enabledLanguageCodes.includes(lang.code));

      setSelectedProject(project); // 🎯 Store selected project (includes archive_format)
      setTemplates(Array.isArray(templatesWithFiles) ? templatesWithFiles : []);
      setSchemas(Array.isArray(schemasArray) ? schemasArray : []);
      setLanguages(projectLanguages);

      // Select all by default (exclude locked templates and schemas)
      const unlockedTemplates = templatesWithFiles.filter((t: Template) => !t.is_soft_locked);
      setSelectedTemplateIds(new Set(unlockedTemplates.map((t: Template) => t.id)));
      const unlockedSchemas = (Array.isArray(schemasArray) ? schemasArray : []).filter((s: Schema) => !s.is_soft_locked);
      setSelectedSchemaIds(new Set(unlockedSchemas.map((s: Schema) => s.id)));
      setSelectedLanguageCodes(new Set(projectLanguages.map((l: Language) => l.code)));

      // 🔗 Set "Push to Git" based on localStorage or project settings
      const savedPushToGit = localStorage.getItem(`pushToGit_${project.id}`);
      if (savedPushToGit !== null) {
        // User has a saved preference - use it
        setPushToGit(savedPushToGit === 'true');
      } else if (project.git_provider_id && project.git_repository) {
        // No saved preference but project has git configured - default to enabled
        setPushToGit(true);
      } else {
        // No saved preference and no git configured - default to disabled
        setPushToGit(false);
      }

      // 🔗 Load PR/Merge settings from project
      const workflow = project.git_workflow || 'push_only';
      if (workflow === 'push_and_pr' || workflow === 'push_pr_merge') {
        setCreatePullRequest(true);
        if (project.git_pr_title_template) {
          setPrTitle(project.git_pr_title_template);
        }
        if (workflow === 'push_pr_merge') {
          setAutoMerge(true);
          setDeleteBranchAfterMerge(project.git_auto_delete_branch ?? true);
        } else {
          setAutoMerge(false);
          setDeleteBranchAfterMerge(false);
        }
      } else {
        setCreatePullRequest(false);
        setAutoMerge(false);
        setDeleteBranchAfterMerge(false);
      }

    } catch (err: any) {
      setError(err.message || 'Failed to load project data');
      setTemplates([]);
      setSchemas([]);
      setLanguages([]);
      setSelectedTemplateIds(new Set());
      setSelectedSchemaIds(new Set());
      setSelectedLanguageCodes(new Set());
    } finally {
      setLoading(false);
    }
  };

  const checkWarnings = useCallback(() => {
    const newWarnings: Warning[] = [];
    const selectedTemplates = templates.filter(t => selectedTemplateIds.has(t.id));

    // Check for database warnings
    if (selectedSchemaIds.size === 0) {
      const templatesNeedingDB = selectedTemplates.filter(template =>
        template.files?.some(file =>
          file.file_type === 'db_table_file' || file.file_type === 'db_table_file_languages'
        )
      );

      if (templatesNeedingDB.length > 0) {
        newWarnings.push({
          type: 'database',
          message: 'Some templates contain DB Table files but no database is selected. These files will not be generated.',
          templates: templatesNeedingDB.map(t => t.name),
        });
      }
    }

    // Check for language warnings
    if (selectedLanguageCodes.size === 0) {
      const templatesNeedingLang = selectedTemplates.filter(template =>
        template.files?.some(file =>
          file.file_type === 'project_file_languages' || file.file_type === 'db_table_file_languages'
        )
      );

      if (templatesNeedingLang.length > 0) {
        newWarnings.push({
          type: 'language',
          message: 'Some templates contain Language files but no language is selected. These files will not be generated.',
          templates: templatesNeedingLang.map(t => t.name),
        });
      }
    }

    setWarnings(newWarnings);
  }, [templates, selectedTemplateIds, selectedSchemaIds, selectedLanguageCodes]);

  const toggleTemplate = (id: number) => {
    setSelectedTemplateIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const toggleAllTemplates = () => {
    // Only consider non-locked templates for selection
    const unlockedTemplates = templates.filter(t => !t.is_soft_locked);
    if (selectedTemplateIds.size === unlockedTemplates.length) {
      setSelectedTemplateIds(new Set());
    } else {
      setSelectedTemplateIds(new Set(unlockedTemplates.map(t => t.id)));
    }
  };

  const toggleSchema = (id: number) => {
    setSelectedSchemaIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const toggleAllSchemas = () => {
    // Only consider non-locked schemas for selection
    const unlockedSchemas = schemas.filter(s => !s.is_soft_locked);
    if (selectedSchemaIds.size === unlockedSchemas.length) {
      setSelectedSchemaIds(new Set());
    } else {
      setSelectedSchemaIds(new Set(unlockedSchemas.map(s => s.id)));
    }
  };

  const toggleLanguage = (code: string) => {
    setSelectedLanguageCodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(code)) {
        newSet.delete(code);
      } else {
        newSet.add(code);
      }
      return newSet;
    });
  };

  const toggleAllLanguages = () => {
    if (selectedLanguageCodes.size === languages.length) {
      setSelectedLanguageCodes(new Set());
    } else {
      setSelectedLanguageCodes(new Set(languages.map(l => l.code)));
    }
  };

  const canGenerate = (): boolean => {
    // Check if project is soft-locked (subscription expired)
    if (selectedProject?.is_soft_locked) {
      return false;
    }
    return selectedProjectId !== null && selectedTemplateIds.size > 0;
  };

  // Check if selected project is locked
  const isProjectLocked = (): boolean => {
    return selectedProject?.is_soft_locked === true;
  };

  // 💰 Charge credits before generation (skips for Patron Monthly users)
  const chargeCreditsForGeneration = async (): Promise<{ success: boolean; message?: string; isFree?: boolean }> => {
    const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
    if (!token) {
      return { success: false, message: 'Authentifizierung erforderlich' };
    }

    try {
      const response = await fetch('/api/generation/charge', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ project_id: selectedProjectId }),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          message: data.message || `Nicht genug Credits. Benötigt: ${data.credits_required}, Verfügbar: ${data.credits_available}`,
        };
      }

      // Reload user data to update credit display
      if (!data.is_free) {
        loadCurrentUser();
        // Dispatch event to notify other components (like navigation) about credit change
        window.dispatchEvent(new CustomEvent('creditsChanged'));
      }

      return {
        success: true,
        message: data.message,
        isFree: data.is_free,
      };
    } catch (err) {
      console.error('Credit charge error:', err);
      return { success: false, message: 'Fehler beim Prüfen der Credits' };
    }
  };

  // 🆕 Check for file conflicts between AND within templates
  const checkFileConflicts = async (): Promise<FileConflict[]> => {
    const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
    if (!token) return [];

    const conflicts: FileConflict[] = [];

    // Map for inter-template conflicts: filePath → template IDs
    const interTemplateFileMap = new Map<string, Set<number>>();

    // Fetch all template files for selected templates
    for (const templateId of Array.from(selectedTemplateIds)) {
      try {
        const response = await fetch(`/api/templates/${templateId}/files`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) continue;

        const filesData = await response.json();
        const templateFiles = filesData.data || filesData || [];

        // Only check project_file and static_file (not db_table_file or language variants)
        const projectFiles = templateFiles.filter((f: any) =>
          f.file_type === 'project_file' ||
          f.file_type === 'static_file' ||
          f.file_type === 'static_directory'
        );

        // 🆕 CHECK 1: Intra-template conflicts (duplicate files WITHIN same template)
        const intraTemplateFileMap = new Map<string, number>();
        for (const file of projectFiles) {
          const outputPath = file.output_path || '/';
          const fileName = file.file_name;
          const fullPath = outputPath.endsWith('/')
            ? `${outputPath}${fileName}`
            : `${outputPath}/${fileName}`;

          if (intraTemplateFileMap.has(fullPath)) {
            // Duplicate found in same template!
            const template = templates.find(t => t.id === templateId);
            conflicts.push({
              filePath: fullPath,
              templates: [{
                id: templateId,
                name: template?.name || `Template ${templateId}`
              }],
              type: 'intra-template'
            });
          } else {
            intraTemplateFileMap.set(fullPath, 1);
          }

          // Also track for inter-template check
          if (!interTemplateFileMap.has(fullPath)) {
            interTemplateFileMap.set(fullPath, new Set());
          }
          interTemplateFileMap.get(fullPath)!.add(templateId);
        }
      } catch (err) {
        console.error(`Failed to fetch files for template ${templateId}:`, err);
      }
    }

    // 🆕 CHECK 2: Inter-template conflicts (files generated by MULTIPLE templates)
    interTemplateFileMap.forEach((templateIds, filePath) => {
      if (templateIds.size > 1) {
        const conflictingTemplates = Array.from(templateIds).map(id => {
          const template = templates.find(t => t.id === id);
          return {
            id,
            name: template?.name || `Template ${id}`
          };
        });

        conflicts.push({
          filePath,
          templates: conflictingTemplates,
          type: 'inter-template'
        });
      }
    });

    return conflicts;
  };

  const handleGenerateProject = async () => {
    if (!canGenerate()) {
      setError('Please select at least one template');
      return;
    }

    // 🆕 STEP 0: Check for file conflicts BEFORE starting generation
    const conflicts = await checkFileConflicts();
    if (conflicts.length > 0) {
      setFileConflicts(conflicts);
      setShowConflictDialog(true);
      return; // Stop here, wait for user decision
    }

    // No conflicts, proceed with generation
    await executeGeneration();
  };

  // ========== CODE ADJUSTMENTS ==========

  /**
   * Fetch code adjustments for the current project
   */
  const fetchCodeAdjustments = async (projectId: number, token: string): Promise<CodeAdjustment[]> => {
    try {
      const response = await fetch(`/api/projects/${projectId}/code-adjustments`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        console.warn('[CODE-ADJUSTMENTS] Failed to fetch adjustments:', response.status);
        return [];
      }

      const data = await response.json();
      if (data.success && Array.isArray(data.data)) {
        // Only return active adjustments
        return data.data.filter((adj: CodeAdjustment) => adj.is_active);
      }
      return [];
    } catch (error) {
      console.warn('[CODE-ADJUSTMENTS] Error fetching adjustments:', error);
      return [];
    }
  };

  /**
   * Check if a file path matches an adjustment's file pattern
   * Supports patterns with %1 (table name) placeholders
   */
  const fileMatchesPattern = (filePath: string, pattern: string): boolean => {
    // Normalize paths (remove leading slashes)
    const normalizedPath = filePath.replace(/^\/+/, '');
    const normalizedPattern = pattern.replace(/^\/+/, '');

    // If pattern has no wildcards, do exact match
    if (!normalizedPattern.includes('%')) {
      return normalizedPath === normalizedPattern || normalizedPath.endsWith('/' + normalizedPattern) || normalizedPath.endsWith(normalizedPattern);
    }

    // Convert pattern to regex: %1, %2 become wildcards
    const regexPattern = normalizedPattern
      .replace(/[.*+?^${}()|[\]\\]/g, '\\$&') // Escape special regex chars
      .replace(/%1/g, '[^/]+')  // %1 = any folder/file name segment
      .replace(/%2/g, '[^/]+'); // %2 = any folder/file name segment

    const regex = new RegExp(`(^|/)${regexPattern}$`);
    return regex.test(normalizedPath);
  };

  /**
   * Apply code adjustments to generated code
   */
  const applyCodeAdjustments = (
    code: string,
    filePath: string,
    adjustments: CodeAdjustment[]
  ): { code: string; appliedCount: number; appliedAdjustments: string[] } => {
    let modifiedCode = code;
    let appliedCount = 0;
    const appliedAdjustments: string[] = [];

    // Find matching adjustments for this file
    const matchingAdjustments = adjustments.filter(adj => fileMatchesPattern(filePath, adj.file_pattern));

    if (matchingAdjustments.length === 0) {
      return { code, appliedCount: 0, appliedAdjustments: [] };
    }

    for (const adjustment of matchingAdjustments) {
      // Sort insertions by order
      const sortedInsertions = [...adjustment.insertions].sort((a, b) => a.insertion_order - b.insertion_order);

      for (const insertion of sortedInsertions) {

        if (insertion.insertion_type === 'beginning') {
          // Insert at the very beginning
          modifiedCode = insertion.insertion_content + '\n' + modifiedCode;
          appliedCount++;
        } else if (insertion.insertion_type === 'end') {
          // Insert at the very end
          modifiedCode = modifiedCode + '\n' + insertion.insertion_content;
          appliedCount++;
        } else if (insertion.insertion_type === 'middle') {
          // Find anchor text and insert after it
          const anchorIndex = modifiedCode.indexOf(insertion.anchor_text);
          if (anchorIndex !== -1) {
            const insertPosition = anchorIndex + insertion.anchor_text.length;
            modifiedCode =
              modifiedCode.slice(0, insertPosition) +
              '\n' + insertion.insertion_content +
              modifiedCode.slice(insertPosition);
            appliedCount++;
          }
          // Note: If anchor text not found, insertion is silently skipped
        }
      }

      if (sortedInsertions.length > 0) {
        appliedAdjustments.push(adjustment.name);
      }
    }

    return { code: modifiedCode, appliedCount, appliedAdjustments };
  };

  /**
   * Core generation logic that creates the ZIP blob
   * This is shared between "Generate & Download" and "Generate & Deploy"
   *
   * @param onZipReady - Callback that receives the generated ZIP blob
   * @param forceZip - Always generate ZIP regardless of project archive_format (needed for deployment)
   */
  const performGeneration = async (
    onZipReady: (zipBlob: Blob, zip: JSZip) => Promise<void>,
    forceZip: boolean = false
  ) => {
    const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
    if (!token) {
      throw new Error('Authentication required');
    }

      // Starting hybrid browser-based project generation

      // ==========================================================================
      // STEP 0: Fetch Code Adjustments for this project
      // ==========================================================================
      let codeAdjustments: CodeAdjustment[] = [];
      // Only load code adjustments if user has access (subscription or patron)
      if (selectedProjectId && codeAdjustmentsAccess?.has_access) {
        setGenerationProgress({
          current: 0,
          total: 100,
          percentage: 2,
          eta: 'Berechne...',
          currentTask: 'Lade Code Anpassungen...'
        });
        codeAdjustments = await fetchCodeAdjustments(selectedProjectId, token);
      }

      // ==========================================================================
      // STEP 1: Fetch schema data (gtree) ONCE to get tables list
      // ==========================================================================
      setGenerationProgress({
        current: 0,
        total: 100,
        percentage: 5,
        eta: 'Berechne...',
        currentTask: 'Lade Datenbank-Schema...'
      });

      const gtreeDataPromises = Array.from(selectedSchemaIds).map(async (schemaId) => {
        const response = await fetch(`/api/schemas/${schemaId}/gtree`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to load schema ${schemaId}: ${errorText}`);
        }
        return response.json();
      });

      const gtreeDataArray = await Promise.all(gtreeDataPromises);

      // Extract all tables from all schemas
      const allTables: any[] = [];
      gtreeDataArray.forEach(gtreeResponse => {
        const tables = gtreeResponse.gtree?.[0]?.project?.[0]?.tables || [];
        allTables.push(...tables);
      });

      // 🚀 PERFORMANCE OPTIMIZATION: Store the base gtree that we'll clone and modify
      const baseGtree = gtreeDataArray.length > 0 ? gtreeDataArray[0].gtree : [];

      // 🎯 Calculate total operations for accurate progress
      const selectedLangs = Array.from(selectedLanguageCodes);
      let totalOperations = 0;
      let completedOperations = 0;

      // Count operations per template (TABLES, for intuitive progress: 137/137!)
      for (const templateId of Array.from(selectedTemplateIds)) {
        const template = templates.find(t => t.id === templateId);
        if (!template) continue;

        const templateFiles = template.files || [];
        const projectFiles = templateFiles.filter(f =>
          f.file_type === 'project_file' || f.file_type === 'static_file' || f.file_type === 'static_directory'
        );
        const projectLangFiles = templateFiles.filter(f => f.file_type === 'project_file_languages');
        const tableFiles = templateFiles.filter(f => f.file_type === 'db_table_file');
        const tableLangFiles = templateFiles.filter(f => f.file_type === 'db_table_file_languages');

        // 🎯 Count TABLES (much more intuitive: 137/137 instead of 47/47!)
        if (projectFiles.length > 0) totalOperations += 1; // 1 update for project files
        if (projectLangFiles.length > 0 && selectedLangs.length > 0) totalOperations += 1; // 1 update for lang files

        // Count individual tables (user sees "Table 5/137" - much better UX!)
        if (tableFiles.length > 0 && allTables.length > 0) {
          totalOperations += allTables.length; // 1 update per table
        }
        if (tableLangFiles.length > 0 && allTables.length > 0 && selectedLangs.length > 0) {
          totalOperations += allTables.length; // 1 update per table
        }
      }

      // 🎯 Track operation timestamps for accurate ETA (using MEDIAN to eliminate outliers)
      const operationTimestamps: number[] = [];
      //const generationStartTime = Date.now(); // Track start time for debug logging
      const MAX_SAMPLES = 15; // Use last 15 operations for stable ETA calculation
      // 🎯 Fixed warmup: Skip first operation only (ETA appears at operation 2)
      const WARMUP_OPERATIONS = 1;
      // 🎯 Pessimism factor: Based on logs: Median 22s is accurate, only 1.3x needed for batches slowing down
      const ETA_PESSIMISM_FACTOR = 1.3;

      // Helper function to update progress (increments counter)
      const updateProgress = async (taskDescription: string) => {
        completedOperations++;
        const now = Date.now();
        operationTimestamps.push(now);

        const percentage = Math.min(95, Math.floor((completedOperations / totalOperations) * 100));

        // Calculate ETA based on recent operations (not all operations)
        let etaText = 'Berechne...';
        let medianTimePerOp = 0;
        let cappedTimePerOp = 0;

        // ✅ WARMUP: Skip first N operations (they're slower due to setup)
        if (operationTimestamps.length > WARMUP_OPERATIONS) {
          // Use ONLY recent operations (after warmup) for ETA calculation
          const relevantTimestamps = operationTimestamps.slice(WARMUP_OPERATIONS); // Skip warmup
          const recentTimestamps = relevantTimestamps.slice(-MAX_SAMPLES); // Take last N

          if (recentTimestamps.length >= 2) {
            // Calculate time differences between operations
            const timeDiffs: number[] = [];
            for (let i = 1; i < recentTimestamps.length; i++) {
              timeDiffs.push(recentTimestamps[i] - recentTimestamps[i - 1]);
            }

            // 🎯 Use MEDIAN instead of average (eliminates outliers!)
            timeDiffs.sort((a, b) => a - b);
            const medianIndex = Math.floor(timeDiffs.length / 2);
            medianTimePerOp = timeDiffs.length % 2 === 0
              ? (timeDiffs[medianIndex - 1] + timeDiffs[medianIndex]) / 2
              : timeDiffs[medianIndex];

            // Cap the time per operation (sanity check - allow up to 30s for large batches)
            cappedTimePerOp = Math.min(medianTimePerOp, 30000); // Max 30 seconds per operation

            const remainingOps = totalOperations - completedOperations;
            // 🎯 Apply pessimism factor (batches get slower over time)
            const etaMs = remainingOps * cappedTimePerOp * ETA_PESSIMISM_FACTOR;

            const etaMinutes = Math.floor(etaMs / 60000);
            const etaSeconds = Math.floor((etaMs % 60000) / 1000);

            if (etaMinutes > 0) {
              etaText = `~${etaMinutes}min ${etaSeconds}s verbleibend`;
            } else if (etaSeconds > 5) {
              etaText = `~${etaSeconds}s verbleibend`;
            } else {
              etaText = 'Fast fertig...';
            }
          }
        }

        setGenerationProgress({
          current: completedOperations,
          total: totalOperations,
          percentage,
          eta: etaText,
          currentTask: taskDescription
        });

        // 🎯 Allow React to re-render the progress bar
        await new Promise(resolve => setTimeout(resolve, 0));
      };

      // 🆕 Helper function to update ONLY the message (without incrementing counter)
      // Used for intermediate progress updates (e.g., "Processing table 5/137")
      const _updateProgressMessage = (taskDescription: string) => {
        // Keep existing counter and percentage, only update the message
        const percentage = Math.min(95, Math.floor((completedOperations / totalOperations) * 100));

        // Recalculate ETA with current data
        let etaText = 'Berechne...';
        const _now = Date.now();

        if (operationTimestamps.length > WARMUP_OPERATIONS) {
          const relevantTimestamps = operationTimestamps.slice(WARMUP_OPERATIONS);
          const recentTimestamps = relevantTimestamps.slice(-MAX_SAMPLES);

          if (recentTimestamps.length >= 2) {
            const timeDiffs: number[] = [];
            for (let i = 1; i < recentTimestamps.length; i++) {
              timeDiffs.push(recentTimestamps[i] - recentTimestamps[i - 1]);
            }

            timeDiffs.sort((a, b) => a - b);
            const medianIndex = Math.floor(timeDiffs.length / 2);
            const medianTimePerOp = timeDiffs.length % 2 === 0
              ? (timeDiffs[medianIndex - 1] + timeDiffs[medianIndex]) / 2
              : timeDiffs[medianIndex];

            const cappedTimePerOp = Math.min(medianTimePerOp, 30000);
            const remainingOps = totalOperations - completedOperations;
            const etaMs = remainingOps * cappedTimePerOp * ETA_PESSIMISM_FACTOR;

            const etaMinutes = Math.floor(etaMs / 60000);
            const etaSeconds = Math.floor((etaMs % 60000) / 1000);

            if (etaMinutes > 0) {
              etaText = `~${etaMinutes}min ${etaSeconds}s verbleibend`;
            } else if (etaSeconds > 5) {
              etaText = `~${etaSeconds}s verbleibend`;
            } else {
              etaText = 'Fast fertig...';
            }
          }
        }

        setGenerationProgress({
          current: completedOperations,
          total: totalOperations,
          percentage,
          eta: etaText,
          currentTask: taskDescription
        });
      };

      // ==========================================================================
      // STEP 2: Generate code using OPTIMIZED HYBRID approach
      // - Fetch compiled templates ONCE per template (no table/language params)
      // - Clone gtree in browser and modify selectedlanguage/selectedtable
      // - Execute compiled JavaScript with modified gtree
      // ==========================================================================
      const zip = new JSZip();
      const errors: GenerationError[] = [];
      let fileCount = 0;

      // Track which files have been added to prevent duplicates
      const addedFiles = new Set<string>();

      // For each template
      for (const templateId of Array.from(selectedTemplateIds)) {
        const template = templates.find(t => t.id === templateId);
        if (!template) continue;

        // Fetch template files to determine what API calls we need
        let templateFiles: any[] = [];
        try {
          const filesResponse = await fetch(`/api/templates/${templateId}/files`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (filesResponse.ok) {
            const filesData = await filesResponse.json();
            templateFiles = filesData.data || filesData || [];
          }
        } catch {
          continue;
        }

        // Group files by type to determine API calls needed
        const projectFiles = templateFiles.filter(f =>
          f.file_type === 'project_file' ||
          f.file_type === 'static_file' ||
          f.file_type === 'static_directory' // 🎯 Include ZIP static directories
        );
        const projectLangFiles = templateFiles.filter(f => f.file_type === 'project_file_languages');
        const tableFiles = templateFiles.filter(f => f.file_type === 'db_table_file');
        const tableLangFiles = templateFiles.filter(f => f.file_type === 'db_table_file_languages');

        // 🚀 OPTIMIZED: Cache compiled templates AND gtree per table
        // API calls: once per table (not per table×language)
        // Cache key: templateId + tableName (or "project" for project files)
        const compiledCache = new Map<string, { compiled: any[], gtree: any }>();

        // Helper to fetch and cache compiled templates with their gtree
        const fetchCompiledTemplates = async (tableName: string | null, langCode: string | null): Promise<{ compiled: any[], gtree: any }> => {
          const cacheKey = `${templateId}_${tableName || 'project'}`;

          if (compiledCache.has(cacheKey)) {
            return compiledCache.get(cacheKey)!;
          }

          try {
            const url = new URL(`/api/ultimate-template/${templateId}`, window.location.origin);
            url.searchParams.set('project_id', selectedProjectId!.toString());

            if (tableName) {
              url.searchParams.set('table_name', tableName);
            }

            // ✅ OPTIMIZATION: Only pass language on first call (for compilation)
            // We'll modify selectedlanguage in browser for other languages
            if (langCode) {
              url.searchParams.set('language_code', langCode);
            }

            // 📊 Add migration_from_version parameter if set
            if (migrationFromVersion !== null) {
              url.searchParams.set('migration_from_version', migrationFromVersion.toString());
            }

            const response = await fetch(url.toString(), {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
              }
            });

            if (!response.ok) {
              const errorText = await response.text();
              throw new Error(`API returned ${response.status}: ${errorText}`);
            }

            const data = await response.json();

            // Check for syntax errors from backend
            if (data.validation?.has_syntax_errors) {
              const syntaxErrors = data.validation.syntax_errors || [];
              syntaxErrors.forEach((e: any) => {
                errors.push({
                  file: e.file,
                  template: template.name,
                  table: tableName || undefined,
                  error: e.error
                });
              });
              return { compiled: [], gtree: null };
            }

            const compiled = data.processed_files || [];
            const gtree = data.gtree || baseGtree; // Use gtree from API response!

            const result = { compiled, gtree };
            compiledCache.set(cacheKey, result);
            return result;

          } catch (error: any) {
            errors.push({
              file: 'Template compilation',
              template: template.name,
              table: tableName || undefined,
              error: error.message || 'Unknown error'
            });
            return { compiled: [], gtree: null };
          }
        };

        // 🚀 NEW: Batch fetch for multiple tables in a single request
        const fetchCompiledTemplatesBatch = async (
          tables: string[],
          langCode: string | null,
          includeGtree: boolean = false,
          sharedGtreeRef: { current: any } = { current: null }
        ): Promise<void> => {
          try {
            // Don't call updateProgress here - progress is tracked per table in processing loops!

            const response = await fetch(`/api/ultimate-template/${templateId}/batch`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                tables: tables,
                project_id: selectedProjectId!,
                language_code: langCode,
                compile: true,
                include_source: false,
                include_gtree: includeGtree, // 🚀 OPTIMIZATION: Only fetch gtree once!
                migration_from_version: migrationFromVersion, // 📊 Migration version if set
              })
            });

            if (!response.ok) {
              const errorText = await response.text();
              throw new Error(`Batch API returned ${response.status}: ${errorText}`);
            }

            const data = await response.json();

            if (!data.success) {
              throw new Error(data.error || 'Batch request failed');
            }

            // Store all results in cache
            const results = data.results || {};

            // 🚀 OPTIMIZATION: Use cached gtree if not sent (saves 6 GB network traffic!)
            const sharedGtree = data.gtree || sharedGtreeRef.current || baseGtree;

            // Save gtree to cache if this is the first batch
            if (data.gtree && !sharedGtreeRef.current) {
              sharedGtreeRef.current = data.gtree;
            }

            for (const [_tableKey, tableResult] of Object.entries(results)) {
              const typedResult = tableResult as any;

              if (typedResult.error) {
                errors.push({
                  file: 'Batch compilation',
                  template: template.name,
                  table: typedResult.table_name,
                  error: typedResult.error
                });
                continue;
              }

              const cacheKey = `${templateId}_${typedResult.table_name || 'project'}`;
              compiledCache.set(cacheKey, {
                compiled: typedResult.compiled_templates || [],
                gtree: sharedGtree, // Use shared gtree for all tables
              });
            }

          } catch (error: any) {
            errors.push({
              file: 'Batch Template compilation',
              template: template.name,
              error: error.message || 'Unknown batch error'
            });
          }
        };

        // Helper function to execute compiled template with modified gtree
        const executeCompiledTemplate = (
          compiledFile: any,
          tableName: string | null,
          langCode: string | null,
          sourceGtree: any  // 🎯 NEW: Pass the gtree from the API response
        ) => {
          try {
            const fileName = compiledFile.filename || compiledFile.original_template || 'unknown.php';
            const compiledJS = compiledFile.compiled_content;

            if (!compiledJS || !sourceGtree) {
              return;
            }

            // 🚀 CLONE GTREE and modify ONLY language settings (tableIdx already compiled by backend)
            // Use structuredClone (2-3x faster than JSON.parse/stringify), fallback to JSON for old browsers
            const clonedGtree = typeof structuredClone !== 'undefined'
              ? structuredClone(sourceGtree)
              : JSON.parse(JSON.stringify(sourceGtree));

            // Set selectedlanguage and selectedlanguageindex
            if (langCode && clonedGtree[0]?.project?.[0]) {
              const languages = clonedGtree[0].project[0].lang || [];
              const langIndex = languages.findIndex((l: any) => l.code === langCode);

              if (langIndex >= 0) {
                clonedGtree[0].project[0].selectedlanguage = langCode;
                clonedGtree[0].project[0].selectedlanguageindex = langIndex;
              }
            }

            // Execute compiled JavaScript IN BROWSER with cloned gtree
            let generatedCode = '';
            try {
              // ✅ SET CLONED GTREE AS GLOBAL VARIABLE (tableIdx already in compiled function)
              (window as any).gtree = clonedGtree;

              // Execute the compiled function
              const globalEval = eval;
              globalEval(compiledJS);

              // The function name is provided by the API
              const functionName = compiledFile.function_name || 'generate_' + fileName.replace(/[^a-zA-Z0-9]/g, '_');
              const generatedFunction = (window as any)[functionName];

              if (!generatedFunction) {
                throw new Error(`Function ${functionName} not found after eval`);
              }

              // Execute function (gtree is available as global variable)
              generatedCode = generatedFunction() || '';

              // ✅ FIX DOUBLE-ESCAPED UNICODE SEQUENCES
              // Tabs: Convert to REAL tabs (for code indentation)
              // \r\n: Convert to TEXT escape sequences (for string content like echo "\r\n")
              generatedCode = generatedCode
                .replace(/\\\\u0009/g, '\t')    // \\u0009 → real Tab (for indentation)
                .replace(/\\\\u000A/g, '\\n')   // \\u000A → \n (LF as text in strings)
                .replace(/\\\\u000D/g, '\\r');  // \\u000D → \r (CR as text in strings)

              // Clean up global scope
              delete (window as any)[functionName];
              delete (window as any).gtree;

            } catch (execError: any) {
              // Clean up on error
              delete (window as any).gtree;
              throw new Error(`JavaScript execution failed: ${execError.message}`);
            }

            // Build file path for ZIP - USE OUTPUT_PATH FROM TEMPLATE!
            const generationType = compiledFile.generation_type || 'project_file';
            let outputPath = compiledFile.output_path || '/';

            // ✅ REPLACE PLACEHOLDERS in output_path
            // %1 = table name, %2 = language code
            outputPath = outputPath
              .replace(/%1/g, tableName || '')
              .replace(/%2/g, langCode || '');

            // Start with output_path from template (remove leading /)
            let folderPath = outputPath.replace(/^\/+/, '');

            // Add language folder if needed (ONLY if not already in output_path)
            if ((generationType === 'project_file_languages' || generationType === 'db_table_file_languages')
                && langCode
                && !outputPath.includes(langCode)) {
              folderPath = folderPath ? `${langCode}/${folderPath}` : langCode;
            }

            // Note: Table folders are NOT auto-added. Use %1 in output_path
            // to create table-named subfolders (e.g. output_path = "%1/" → "addresses/")

            // Remove trailing slashes and clean up double slashes
            folderPath = folderPath.replace(/\/+$/, '').replace(/\/+/g, '/');

            // Build full path
            const fullPath = folderPath ? `${folderPath}/${fileName}` : fileName;

            // ✅ CHECK FOR DUPLICATES - Skip if already added
            if (addedFiles.has(fullPath)) {
              return;
            }

            // 🔧 APPLY CODE ADJUSTMENTS before adding to ZIP
            let finalCode = generatedCode;
            if (codeAdjustments.length > 0) {
              const adjustmentResult = applyCodeAdjustments(generatedCode, fullPath, codeAdjustments);
              if (adjustmentResult.appliedCount > 0) {
                finalCode = adjustmentResult.code;
              }
            }

            // Add to ZIP
            zip.file(fullPath, finalCode);
            addedFiles.add(fullPath);
            fileCount++;

          } catch (fileError: any) {
            // Log error for this specific file
            errors.push({
              file: compiledFile.filename || compiledFile.original_template || 'unknown',
              template: template.name,
              table: tableName || undefined,
              language: langCode || undefined,
              error: fileError.message || 'Unknown error'
            });
          }
        };

        // 🎯 0. Process ZIP static directories FIRST
        const zipFiles = projectFiles.filter(f => f.content_type === 'zip');

        for (const zipFile of zipFiles) {
          try {
            // Decode Base64 ZIP content — clean whitespace that may be introduced by server transport
            let base64Content = zipFile.file_content;
            if (!base64Content || base64Content.length === 0) {
              throw new Error('Empty file_content for ZIP file');
            }

            // Integrity check: verify content wasn't truncated during API response delivery
            if (zipFile.file_content_length && base64Content.length !== zipFile.file_content_length) {
              console.warn(`[ZIP] Content length mismatch for "${zipFile.file_name}": expected ${zipFile.file_content_length}, received ${base64Content.length}`);
              throw new Error(`ZIP data truncated during transfer (expected ${zipFile.file_content_length} chars, got ${base64Content.length})`);
            }

            // Strip any whitespace/newlines (can be introduced by Nginx buffering, PHP output encoding, etc.)
            base64Content = base64Content.replace(/[\s\r\n]+/g, '');

            // Validate Base64 padding
            const paddingNeeded = (4 - (base64Content.length % 4)) % 4;
            if (paddingNeeded > 0) {
              base64Content += '='.repeat(paddingNeeded);
            }

            // Decode Base64 to binary using fetch API (more robust than atob for large content)
            const response = await fetch(`data:application/octet-stream;base64,${base64Content}`);
            if (!response.ok) {
              throw new Error('Base64 decode failed — data may be corrupted or truncated');
            }
            const bytes = new Uint8Array(await response.arrayBuffer());

            if (bytes.length < 22) {
              // Minimum ZIP file size is 22 bytes (empty ZIP)
              throw new Error(`Decoded ZIP is too small (${bytes.length} bytes) — data may be truncated`);
            }

            // Load ZIP with JSZip
            const staticZip = await JSZip.loadAsync(bytes);

            // Extract all files from the ZIP
            const outputPath = (zipFile.output_path || '/').replace(/^\/+/, '').replace(/\/+$/, '');

            await Promise.all(Object.keys(staticZip.files).map(async (filename) => {
              const zipEntry = staticZip.files[filename];

              // Skip directories
              if (zipEntry.dir) return;

              // Get file content
              const content = await zipEntry.async('blob');

              // Build full path: output_path + filename from ZIP
              const fullPath = outputPath ? `${outputPath}/${filename}` : filename;

              // Check for duplicates
              if (addedFiles.has(fullPath)) {
                return;
              }

              // Add to final ZIP
              zip.file(fullPath, content);
              addedFiles.add(fullPath);
              fileCount++;
            }));

          } catch (error: any) {
            errors.push({
              file: zipFile.file_name || zipFile.zip_filename || 'Unknown ZIP',
              error: `ZIP extraction failed: ${error.message}`,
              template: template.name
            });
          }
        }

        // 🚀 Step B: Execute compiled templates with caching
        // - Project files: Fetch once, execute once
        // - Project language files: Fetch once, execute per language
        // - Table files: Fetch per table, execute per table
        // - Table language files: Fetch per table (first lang), execute per table×language

        // 1. Process project_file and static_file (fetch once, execute once)
        const nonZipProjectFiles = projectFiles.filter(f => f.content_type !== 'zip');
        if (nonZipProjectFiles.length > 0) {
          await updateProgress(`[${template.name}] Generiere Projekt-Dateien...`);
          const { compiled, gtree } = await fetchCompiledTemplates(null, null);
          const projectFileTemplates = compiled.filter(t =>
            t.generation_type === 'project_file' || t.generation_type === 'static_file'
          );
          for (const compiledFile of projectFileTemplates) {
            executeCompiledTemplate(compiledFile, null, null, gtree);
          }
        }

        // 2. Process project_file_languages (fetch once with first lang, execute per language)
        if (projectLangFiles.length > 0 && selectedLangs.length > 0) {
          await updateProgress(`[${template.name}] Generiere Sprach-Dateien...`);
          const firstLang = selectedLangs[0];
          const { compiled, gtree } = await fetchCompiledTemplates(null, firstLang);
          const projectLangTemplates = compiled.filter(t =>
            t.generation_type === 'project_file_languages'
          );

          for (const lang of selectedLangs) {
            for (const compiledFile of projectLangTemplates) {
              executeCompiledTemplate(compiledFile, null, lang, gtree);
            }
          }
        }

        // 3. Process db_table_file (🚀 BATCH API: fetch tables in optimized batches)
        if (tableFiles.length > 0 && allTables.length > 0) {
          const BATCH_SIZE = 2; // Memory-safe: PHP worker persistence causes memory accumulation
          const tableNames = allTables.map(t => t.filename || t.tablename);

          // 🚀 OPTIMIZATION: Fetch gtree ONLY ONCE (instead of 60+ times, saves ~6 GB network traffic!)
          const gtreeCache = { current: null };

          // Fetch in batches to avoid timeout (progress updated per table, not per batch!)
          for (let i = 0; i < tableNames.length; i += BATCH_SIZE) {
            const batchTableNames = tableNames.slice(i, i + BATCH_SIZE);
            const _batchNum = Math.floor(i / BATCH_SIZE) + 1;
            const _totalBatches = Math.ceil(tableNames.length / BATCH_SIZE);
            const isFirstBatch = (i === 0);

            // Don't call updateProgress here - we update per table in processing loop below!
            await fetchCompiledTemplatesBatch(batchTableNames, null, isFirstBatch, gtreeCache);
          }

          // Now process all tables from cache (already loaded!)
          let processedCount = 0;
          for (const table of allTables) {
            const tableName = table.filename || table.tablename;
            const cacheKey = `${templateId}_${tableName}`;
            const cached = compiledCache.get(cacheKey);

            if (cached) {
              const { compiled, gtree } = cached;
              const tableFileTemplates = compiled.filter(t =>
                t.generation_type === 'db_table_file'
              );

              for (const compiledFile of tableFileTemplates) {
                executeCompiledTemplate(compiledFile, tableName, null, gtree);
              }
            }

            processedCount++;
            // 🎯 Update progress for EVERY table (not just every 5)
            await updateProgress(`[${template.name}] Tabelle ${processedCount}/${allTables.length}: ${tableName}`);
          }
        }

        // 4. Process db_table_file_languages (🚀 BATCH API: fetch tables in optimized batches)
        if (tableLangFiles.length > 0 && allTables.length > 0 && selectedLangs.length > 0) {
          const firstLang = selectedLangs[0];
          const BATCH_SIZE = 2; // Memory-safe: PHP worker persistence causes memory accumulation
          const tableNames = allTables.map(t => t.filename || t.tablename);

          // 🚀 OPTIMIZATION: Fetch gtree ONLY ONCE (instead of 60+ times, saves ~6 GB network traffic!)
          const gtreeCache = { current: null };

          // Fetch in batches to avoid timeout (progress updated per table, not per batch!)
          for (let i = 0; i < tableNames.length; i += BATCH_SIZE) {
            const batchTableNames = tableNames.slice(i, i + BATCH_SIZE);
            const _batchNum = Math.floor(i / BATCH_SIZE) + 1;
            const _totalBatches = Math.ceil(tableNames.length / BATCH_SIZE);
            const isFirstBatch = (i === 0);

            // Don't call updateProgress here - we update per table in processing loop below!
            await fetchCompiledTemplatesBatch(batchTableNames, firstLang, isFirstBatch, gtreeCache);
          }

          // Now process all tables from cache (already loaded!)
          let processedCount = 0;
          for (const table of allTables) {
            const tableName = table.filename || table.tablename;
            const cacheKey = `${templateId}_${tableName}`;
            const cached = compiledCache.get(cacheKey);

            if (cached) {
              const { compiled, gtree } = cached;
              const tableLangTemplates = compiled.filter(t =>
                t.generation_type === 'db_table_file_languages'
              );

              // Execute for all languages (gtree language modified in browser)
              for (const lang of selectedLangs) {
                for (const compiledFile of tableLangTemplates) {
                  executeCompiledTemplate(compiledFile, tableName, lang, gtree);
                }
              }
            }

            processedCount++;
            // 🎯 Update progress for EVERY table (not just every 5)
            await updateProgress(`[${template.name}] Multi-Lang ${processedCount}/${allTables.length}: ${tableName}`);
          }
        }
      }

      // ==========================================================================
      // STEP 4: Add ERRORS.txt if there are errors
      // ==========================================================================
      if (errors.length > 0) {
        let errorsContent = '='.repeat(80) + '\n';
        errorsContent += 'GENERATION ERRORS REPORT\n';
        errorsContent += '='.repeat(80) + '\n\n';
        errorsContent += `Total Errors: ${errors.length}\n`;
        errorsContent += `Total Files Generated: ${fileCount}\n`;
        errorsContent += `Generated: ${new Date().toISOString()}\n\n`;
        errorsContent += '='.repeat(80) + '\n\n';

        errors.forEach((err, index) => {
          errorsContent += `ERROR #${index + 1}\n`;
          errorsContent += `Template: ${err.template}\n`;
          errorsContent += `File: ${err.file}\n`;
          if (err.table) errorsContent += `Table: ${err.table}\n`;
          if (err.language) errorsContent += `Language: ${err.language}\n`;
          errorsContent += `Error: ${err.error}\n`;
          errorsContent += '-'.repeat(80) + '\n\n';
        });

        zip.file('ERRORS.txt', errorsContent);
      }

      // ==========================================================================
      // STEP 5: Generate and download archive (browser-based for large projects)
      // ==========================================================================
      // Use ZIP format if forced (for deployment) or if project format is ZIP
      const archiveFormat = forceZip ? 'zip' : (selectedProject?.archive_format || 'zip');

      // 🚀 OPTIMIZATION: For ZIP format, generate directly in browser
      // This avoids sending large payloads to backend (which can fail with "Content Too Large")
      if (archiveFormat === 'zip') {
        // Final progress: Creating ZIP
        setGenerationProgress({
          current: totalOperations,
          total: totalOperations,
          percentage: 98,
          eta: 'Fast fertig...',
          currentTask: 'Erstelle ZIP-Archiv...'
        });

        // Generate ZIP blob directly in browser
        const zipBlob = await zip.generateAsync({
          type: 'blob',
          compression: 'DEFLATE',
          compressionOptions: { level: 6 }
        });

        // 100% - Ready!
        setGenerationProgress({
          current: totalOperations,
          total: totalOperations,
          percentage: 100,
          eta: 'Fertig!',
          currentTask: 'Verarbeite ZIP...'
        });

        setArchiveWarning(null);

        // 📦 Populate generation metadata for upload
        const selectedTemplatesList = templates.filter(t => selectedTemplateIds.has(t.id));
        generationMetadataRef.current = {
          tables: allTables.map(t => t.databasename || t.name || 'unknown'),
          languages: Array.from(selectedLanguageCodes),
          templateIds: Array.from(selectedTemplateIds),
          templateNames: selectedTemplatesList.map(t => t.name),
          filesCount: fileCount,
        };

        // Call the callback with the generated ZIP (callback handles download/upload)
        await onZipReady(zipBlob, zip);

        return; // Stop here, callback handles everything
      } else {
        // For tar.gz/tar.xz, we need backend support
        // Extract all files from JSZip as {path, content (base64)}
        const filesForBackend: Array<{ path: string; content: string }> = [];

        for (const [path, zipEntry] of Object.entries(zip.files)) {
          if (!zipEntry.dir) {
            // Get file content as base64
            const content = await zipEntry.async('base64');
            filesForBackend.push({ path, content });
          }
        }

        // Send to backend for archive creation
        const archiveResponse = await fetch('/api/archives/create', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            format: archiveFormat,
            files: filesForBackend,
          }),
        });

        if (!archiveResponse.ok) {
          throw new Error(`Archive creation failed: ${archiveResponse.statusText}`);
        }

        // Check for fallback warning in headers
        const warningHeader = archiveResponse.headers.get('X-Archive-Warning');
        //const actualFormat = archiveResponse.headers.get('X-Archive-Actual-Format') || archiveFormat;

        if (warningHeader) {
          try {
            const warningMessage = atob(warningHeader);
            setArchiveWarning(warningMessage);
          } catch {
            setArchiveWarning('Archive format fallback occurred. Archive created as ZIP.');
          }
        } else {
          setArchiveWarning(null);
        }

        // Get the archive blob
        const archiveBlob = await archiveResponse.blob();

        // 📦 Populate generation metadata for upload (same as ZIP case)
        const selectedTemplatesListTar = templates.filter(t => selectedTemplateIds.has(t.id));
        generationMetadataRef.current = {
          tables: allTables.map(t => t.databasename || t.name || 'unknown'),
          languages: Array.from(selectedLanguageCodes),
          templateIds: Array.from(selectedTemplateIds),
          templateNames: selectedTemplatesListTar.map(t => t.name),
          filesCount: fileCount,
        };

        // Call the callback with the archive blob (callback handles download/upload)
        await onZipReady(archiveBlob, zip);

        return; // Stop here, callback handles everything
      }

      // Update state
      setGenerationStats({ errors: errors.length, files: fileCount });
      setGenerationErrors(errors);
  };

  // 🆕 Separated generation logic so it can be called after conflict confirmation
  const executeGeneration = async () => {
    try {
      setGenerating(true);
      setError(null);
      setShowConflictDialog(false);
      setGenerationProgress(null);

      // 💰 Charge credits before generation
      const chargeResult = await chargeCreditsForGeneration();
      if (!chargeResult.success) {
        setError(chargeResult.message || 'Nicht genug Credits für die Generierung');
        setGenerating(false);
        return;
      }

      // Perform generation with download callback
      await performGeneration(async (zipBlob, zip) => {
        // Download the ZIP to user
        const url = window.URL.createObjectURL(zipBlob);
        const link = document.createElement('a');
        link.href = url;
        const projectName = selectedProject?.name || 'project';
        link.download = `${projectName}_${Date.now()}.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        // 🔗 Git Push if enabled
        if (pushToGit && selectedGitProvider && selectedRepository) {
          setDeploymentLogs(['🔗 Git Push gestartet...']);

          // Extract files from ZIP for Git push
          const filesForGit: Record<string, string> = {};
          for (const [path, zipEntry] of Object.entries(zip.files)) {
            if (!zipEntry.dir) {
              try {
                const content = await zipEntry.async('string');
                filesForGit[path] = content;
              } catch {
                // If file is binary, skip it for now (or handle differently)
                console.warn(`[GIT] Skipping binary file: ${path}`);
              }
            }
          }

          await pushToGitRepository(filesForGit);
        }

        // 📦 Also upload a copy to server for tracking (background, non-blocking)
        const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
        if (token && selectedProjectId) {
          const uploadFormData = new FormData();
          uploadFormData.append('project_id', selectedProjectId.toString());
          uploadFormData.append('archive', zipBlob, `${projectName}.zip`);
          uploadFormData.append('is_download_only', 'true');

          // Add generation metadata
          const metadata = generationMetadataRef.current;
          if (metadata.tables.length > 0) {
            metadata.tables.forEach(t => uploadFormData.append('tables[]', t));
          }
          if (metadata.languages.length > 0) {
            metadata.languages.forEach(l => uploadFormData.append('languages[]', l));
          }
          if (metadata.templateIds.length > 0) {
            metadata.templateIds.forEach(id => uploadFormData.append('template_ids[]', id.toString()));
          }
          if (metadata.templateNames.length > 0) {
            metadata.templateNames.forEach(n => uploadFormData.append('template_names[]', n));
          }
          if (metadata.filesCount > 0) {
            uploadFormData.append('files_count', metadata.filesCount.toString());
          }

          // Fire and forget - don't wait for response
          fetch('/api/generated-projects/upload', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/json'
            },
            body: uploadFormData
          }).catch(() => {
            // Silent fail - generation record is not critical
          });
        }
      });

    } catch (err: any) {
      setError(err.message || 'Failed to generate project');
    } finally {
      setGenerating(false);
      setTimeout(() => {
        setGenerationProgress(null);
      }, 2000);
    }
  };

  /**
   * Generate project in browser, upload to server, and send download task to scoriet-svc
   * This reuses the browser-based generation logic to ensure correct output
   */
  const handleGenerateAndDeploy = async () => {
    if (!canGenerate()) {
      setError('Please select at least one template');
      return;
    }

    // Check for conflicts first
    const conflicts = await checkFileConflicts();
    if (conflicts.length > 0) {
      setFileConflicts(conflicts);
      setShowConflictDialog(true);
      return;
    }

    // Execute the same generation as executeGeneration(), but upload instead of download
    await executeGenerationForDeploy();
  };

  /**
   * Generate project and upload via FTP/SSH
   */
  const handleFtpUpload = async () => {
    if (!canGenerate()) {
      setError('Please select at least one template');
      return;
    }

    if (!selectedProject?.has_ftp_deployment) {
      setError('Keine FTP/SSH-Verbindung konfiguriert. Bitte konfigurieren Sie die FTP/SSH-Einstellungen in den Projekteinstellungen.');
      return;
    }

    // Check for conflicts first
    const conflicts = await checkFileConflicts();
    if (conflicts.length > 0) {
      setFileConflicts(conflicts);
      setShowConflictDialog(true);
      return;
    }

    await executeGenerationForFtp();
  };

  /**
   * Execute generation and upload via FTP/SSH
   */
  const executeGenerationForFtp = async () => {
    try {
      setGenerating(true);
      setFtpUploading(true);
      setError(null);
      setShowConflictDialog(false);
      setGenerationProgress(null);
      setDeploymentLogs([]);

      // 💰 Charge credits before generation
      const chargeResult = await chargeCreditsForGeneration();
      if (!chargeResult.success) {
        setError(chargeResult.message || 'Nicht genug Credits für die Generierung');
        setGenerating(false);
        setFtpUploading(false);
        return;
      }

      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (!token) {
        throw new Error('Authentication required');
      }

      const projectName = selectedProject?.name || 'project';
      const ftpType = selectedProject?.deployment_type?.toUpperCase() || 'FTP';
      const ftpHost = selectedProject?.ftp_host || '';
      const ftpDir = selectedProject?.ftp_directory || '/';

      // Add initial log entry
      setDeploymentLogs([
        `📡 Starting ${ftpType} Upload...`,
        `📦 Project: ${projectName}`,
        `🌐 Server: ${ftpHost}`,
        `📂 Directory: ${ftpDir}`,
        ''
      ]);

      // Perform generation with FTP upload callback (force ZIP format)
      await performGeneration(async (zipBlob) => {
        // Add log: Generation complete
        setDeploymentLogs(prev => [
          ...prev,
          '✅ Code generation completed',
          `📊 Archive size: ${(zipBlob.size / 1024).toFixed(2)} KB`,
          ''
        ]);

        // Upload ZIP to server first (for FTP upload)
        setGenerationProgress({
          current: 0,
          total: 100,
          percentage: 85,
          eta: 'Fast fertig...',
          currentTask: 'Lade Archiv zum Server hoch...'
        });

        setDeploymentLogs(prev => [...prev, '📤 Uploading archive to server...']);

        const formData = new FormData();
        formData.append('project_id', selectedProjectId!.toString());
        formData.append('archive', zipBlob, `${projectName}.zip`);

        const uploadResponse = await fetch('/api/generated-projects/upload', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          },
          body: formData
        });

        if (!uploadResponse.ok) {
          const errorText = await uploadResponse.text();
          throw new Error(`Failed to upload archive: ${errorText}`);
        }

        const uploadResult = await uploadResponse.json();
        const filename = uploadResult.filename;

        setDeploymentLogs(prev => [
          ...prev,
          '✅ Archive uploaded to server',
          ''
        ]);

        // Now trigger FTP upload
        setGenerationProgress({
          current: 0,
          total: 100,
          percentage: 90,
          eta: 'Fast fertig...',
          currentTask: `Uploading via ${ftpType}...`
        });

        setDeploymentLogs(prev => [
          ...prev,
          `📡 Connecting to ${ftpType} server...`
        ]);

        const ftpResponse = await fetch(`/api/projects/${selectedProjectId}/ftp-upload`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({ filename })
        });

        const ftpResult = await ftpResponse.json();

        // Add FTP logs
        if (ftpResult.logs && Array.isArray(ftpResult.logs)) {
          setDeploymentLogs(prev => [...prev, '', ...ftpResult.logs]);
        }

        if (!ftpResult.success) {
          throw new Error(ftpResult.message || `${ftpType} upload failed`);
        }

        setDeploymentLogs(prev => [
          ...prev,
          '',
          `✅ ${ftpType} Upload erfolgreich!`,
          `📁 ${ftpResult.files_uploaded || 0} Dateien übertragen`
        ]);

        setGenerationProgress({
          current: 100,
          total: 100,
          percentage: 100,
          eta: 'Fertig!',
          currentTask: `${ftpType} Upload abgeschlossen`
        });

      }, true); // Force ZIP format for FTP upload

    } catch (err: any) {
      console.error('FTP Upload error:', err);
      setError(err.message || 'FTP/SSH Upload failed');
      setDeploymentLogs(prev => [...prev, '', `❌ Error: ${err.message}`]);
    } finally {
      setGenerating(false);
      setFtpUploading(false);
    }
  };

  /**
   * Poll deployment task status and update live log
   */
  const startDeploymentPolling = (taskId: number, token: string) => {
    // Clear any existing polling interval
    if (deploymentPollIntervalRef.current) {
      clearInterval(deploymentPollIntervalRef.current);
      deploymentPollIntervalRef.current = null;
    }

    let pollCount = 0;
    const maxPolls = 300; // 10 minutes max (300 * 2 seconds)

    const pollInterval = setInterval(async () => {
      pollCount++;

      try {
        const response = await fetch(`/cli/svc/tasks/${taskId}`, {
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || 'Failed to fetch task status');
        }

        const taskData = result.task;

        // Update logs from backend (live streaming from service)
        if (taskData.logs) {
          const backendLogs = taskData.logs.split('\n').filter((line: string) => line.trim() !== '');

          // Append backend logs to existing frontend logs
          setDeploymentLogs(prev => {
            // Find where frontend logs end (last frontend log is "⏳ Waiting for scoriet-svc...")
            const frontendLogsEndIndex = prev.findIndex(log => log.includes('⏳ Waiting for scoriet-svc'));

            if (frontendLogsEndIndex >= 0) {
              // Keep frontend logs up to and including the "waiting" message
              const frontendLogs = prev.slice(0, frontendLogsEndIndex + 1);

              // Add separator and backend logs
              return [...frontendLogs, '', '📡 Service logs:', '', ...backendLogs];
            } else {
              // Fallback: just append backend logs
              return [...prev, '', '📡 Service logs:', '', ...backendLogs];
            }
          });
        }

        // Stop polling when task is finished
        if (taskData.status === 'completed') {
          setDeploymentPolling(false);
          if (deploymentPollIntervalRef.current) {
            clearInterval(deploymentPollIntervalRef.current);
            deploymentPollIntervalRef.current = null;
          }
        } else if (taskData.status === 'failed') {
          const errorMsg = taskData.error_message || 'Unknown error occurred';
          setDeploymentLogs(prev => [...prev, '', `❌ Deployment failed: ${errorMsg}`]);
          setDeploymentPolling(false);
          if (deploymentPollIntervalRef.current) {
            clearInterval(deploymentPollIntervalRef.current);
            deploymentPollIntervalRef.current = null;
          }
        }

        // Stop polling after max attempts
        if (pollCount >= maxPolls) {
          setDeploymentLogs(prev => [...prev, '', '⏰ Polling timeout - please check service status manually']);
          setDeploymentPolling(false);
          if (deploymentPollIntervalRef.current) {
            clearInterval(deploymentPollIntervalRef.current);
            deploymentPollIntervalRef.current = null;
          }
        }
      } catch (err: any) {
        console.error('Polling error:', err);
      }
    }, 2000); // Poll every 2 seconds

    deploymentPollIntervalRef.current = pollInterval;
  };

  /**
   * Execute generation for deployment (generates in browser, uploads to server)
   * Reuses performGeneration() with upload callback instead of download
   */
  const executeGenerationForDeploy = async () => {
    try {
      setGenerating(true);
      setError(null);
      setShowConflictDialog(false);
      setGenerationProgress(null);
      setDeploymentLogs([]); // Clear previous logs
      setDeploymentTaskId(null);
      setDeploymentPolling(false);

      // 💰 Charge credits before generation
      const chargeResult = await chargeCreditsForGeneration();
      if (!chargeResult.success) {
        setError(chargeResult.message || 'Nicht genug Credits für die Generierung');
        setGenerating(false);
        return;
      }

      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (!token) {
        throw new Error('Authentication required');
      }

      const projectName = selectedProject?.name || 'project';

      // Add initial log entry
      setDeploymentLogs(['🚀 Starting deployment...', `📦 Project: ${projectName}`, '']);

      // Perform generation with upload callback (force ZIP format for deployment)
      await performGeneration(async (zipBlob, zip) => {
        // Add log: Generation complete
        setDeploymentLogs(prev => [...prev, '✅ Code generation completed', `📊 Archive size: ${(zipBlob.size / 1024).toFixed(2)} KB`, '']);

        // 🔗 Git Push if enabled
        if (pushToGit && selectedGitProvider && selectedRepository) {
          setDeploymentLogs(prev => [...prev, '🔗 Git Push gestartet...']);

          // Extract files from ZIP for Git push
          const filesForGit: Record<string, string> = {};
          for (const [path, zipEntry] of Object.entries(zip.files)) {
            if (!zipEntry.dir) {
              try {
                const content = await zipEntry.async('string');
                filesForGit[path] = content;
              } catch {
                console.warn(`[GIT] Skipping binary file: ${path}`);
              }
            }
          }

          await pushToGitRepository(filesForGit);
        }

        // Upload ZIP to server
        setGenerationProgress({
          current: 0,
          total: 100,
          percentage: 95,
          eta: 'Fast fertig...',
          currentTask: 'Lade Archiv zum Server hoch...'
        });

        setDeploymentLogs(prev => [...prev, '📤 Uploading archive to server...']);

        const formData = new FormData();
        formData.append('project_id', selectedProjectId!.toString());
        formData.append('archive', zipBlob, `${projectName}.zip`);

        // Add generation metadata
        const metadata = generationMetadataRef.current;
        if (metadata.tables.length > 0) {
          metadata.tables.forEach(t => formData.append('tables[]', t));
        }
        if (metadata.languages.length > 0) {
          metadata.languages.forEach(l => formData.append('languages[]', l));
        }
        if (metadata.templateIds.length > 0) {
          metadata.templateIds.forEach(id => formData.append('template_ids[]', id.toString()));
        }
        if (metadata.templateNames.length > 0) {
          metadata.templateNames.forEach(n => formData.append('template_names[]', n));
        }
        if (metadata.filesCount > 0) {
          formData.append('files_count', metadata.filesCount.toString());
        }

        const uploadResponse = await fetch('/api/generated-projects/upload', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          },
          body: formData
        });

        if (!uploadResponse.ok) {
          const errorText = await uploadResponse.text();
          throw new Error(`Failed to upload archive: ${errorText}`);
        }

        const uploadResult = await uploadResponse.json();
        const downloadUrl = uploadResult.download_url;

        setDeploymentLogs(prev => [...prev, '✅ Upload successful', `🔗 Download URL: ${downloadUrl}`, '']);

        // Create download task for scoriet-svc
        setGenerationProgress({
          current: 0,
          total: 100,
          percentage: 98,
          eta: 'Fast fertig...',
          currentTask: 'Erstelle Download-Task für scoriet-svc...'
        });

        setDeploymentLogs(prev => [...prev, '📋 Creating deployment task for scoriet-svc...']);

        const taskPayload = {
          project_id: selectedProjectId,
          archive_url: downloadUrl,
          target_path: `C:\\deployed_projects\\${projectName}`,
          install_type: 'initial',
        };

        const taskResponse = await fetch('/cli/svc/tasks/project-download', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(taskPayload)
        });

        if (!taskResponse.ok) {
          const errorText = await taskResponse.text();
          throw new Error(`Failed to create download task: ${errorText}`);
        }

        const taskResult = await taskResponse.json();
        const taskId = taskResult.task?.id || taskResult.task_id;

        setDeploymentTaskId(taskId);
        setDeploymentLogs(prev => [...prev, `✅ Task created: #${taskId}`, `📂 Target: C:\\deployed_projects\\${projectName}`, '', '⏳ Waiting for scoriet-svc to pick up task...']);

        // Start polling for task status
        setDeploymentPolling(true);
        startDeploymentPolling(taskId, token);

        setGenerationProgress({
          current: 100,
          total: 100,
          percentage: 100,
          eta: 'Fertig!',
          currentTask: `✅ Task ${taskId} an scoriet-svc gesendet!`
        });
      }, true); // forceZip = true for deployment

      // Show success for 5 seconds
      setTimeout(() => {
        setGenerationProgress(null);
      }, 5000);

    } catch (err: any) {
      const errorMessage = err.message || 'Failed to create deployment task';
      setError(errorMessage);

      // Add error to deployment log
      setDeploymentLogs(prev => [...prev, '', `❌ Deployment failed: ${errorMessage}`, '', '💡 You can try deploying again.']);
      setDeploymentPolling(false);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="h-full p-4 overflow-auto" style={{ backgroundColor: colors.bgPrimary, color: colors.textPrimary }}>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="rounded-lg p-6" style={{ backgroundColor: colors.bgSecondary, borderColor: colors.borderPrimary, borderWidth: '1px', borderStyle: 'solid' }}>
          <h2 className="text-2xl font-bold mb-6" style={{ color: colors.textPrimary }}>Code Generation</h2>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-900 border border-red-600 rounded text-red-200">
              <div className="flex items-start justify-between">
                <div>
                  <strong>Error:</strong> {error}
                </div>
                {error.toLowerCase().includes('credit') && (
                  <button
                    type="button"
                    onClick={() => { setPlanModalInitialTab(1); setShowPlanModal(true); }}
                    className="ml-3 px-3 py-1 bg-yellow-600 hover:bg-yellow-500 text-white rounded text-sm font-semibold transition-colors"
                  >
                    Credits kaufen
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Archive Format Fallback Warning */}
          {archiveWarning && (
            <div className="mb-4 p-3 bg-yellow-900 bg-opacity-50 border border-yellow-600 rounded">
              <div className="flex items-start space-x-2">
                <span className="text-xl">⚠️</span>
                <div className="flex-1">
                  <div className="font-medium text-yellow-200 mb-1">Archive Format Warning</div>
                  <div className="text-sm text-yellow-300">{archiveWarning}</div>
                </div>
              </div>
            </div>
          )}

          {/* Project Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>
              Select Project *
            </label>
            <Dropdown
              value={selectedProjectId}
              options={projects}
              onChange={(e) => {
                const selectedProject = projects.find(p => p.id === e.value);
                // If user tries to select a locked project, find first active project instead
                if (selectedProject?.is_soft_locked) {
                  const firstActiveProject = projects.find(p => !p.is_soft_locked);
                  if (firstActiveProject) {
                    setSelectedProjectId(firstActiveProject.id);
                  }
                  // If no active projects, don't change selection
                  return;
                }
                setSelectedProjectId(e.value);
              }}
              optionLabel="name"
              optionValue="id"
              placeholder="Select a project..."
              disabled={loading}
              className="w-full"
              filter
              itemTemplate={(option) => (
                <div className="flex items-center justify-between w-full">
                  <span className={option.is_soft_locked ? 'text-red-400' : ''}>{option.name}</span>
                  {option.is_soft_locked && (
                    <i className="pi pi-lock text-red-500 ml-2" title="Abo abgelaufen" />
                  )}
                </div>
              )}
              valueTemplate={(option) => option ? (
                <div className="flex items-center">
                  <span className={option.is_soft_locked ? 'text-red-400' : ''}>{option.name}</span>
                  {option.is_soft_locked && (
                    <i className="pi pi-lock text-red-500 ml-2" />
                  )}
                </div>
              ) : 'Select a project...'}
            />
          </div>

          {loading && (
            <div className="text-center py-8" style={{ color: colors.textMuted }}>
              Loading project data...
            </div>
          )}

          {selectedProjectId && !loading && (
            <>
              {/* Templates Section */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium" style={{ color: colors.textPrimary }}>
                    Templates * (at least 1 required)
                  </label>
                  <button
                    onClick={toggleAllTemplates}
                    className="text-xs text-blue-400 hover:text-blue-300"
                  >
                    {selectedTemplateIds.size === templates.filter(t => !t.is_soft_locked).length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>
                <div className="rounded-lg p-4 max-h-60 overflow-y-auto" style={{ backgroundColor: colors.bgTertiary, borderColor: colors.borderPrimary, borderWidth: '1px', borderStyle: 'solid' }}>
                  {templates.length === 0 ? (
                    <div className="text-sm" style={{ color: colors.textMuted }}>No templates available</div>
                  ) : (
                    <div className="space-y-2">
                      {templates.map(template => {
                        const isLocked = template.is_soft_locked === true;
                        return (
                          <label
                            key={template.id}
                            className={`flex items-start space-x-2 p-2 rounded ${
                              isLocked
                                ? 'cursor-not-allowed opacity-60'
                                : 'cursor-pointer'
                            }`}
                            style={{ color: colors.textPrimary }}
                            onMouseEnter={(e) => !isLocked && (e.currentTarget.style.backgroundColor = colors.bgHover)}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            title={isLocked ? 'Template-Abo abgelaufen - bitte im Template Manager entsperren' : undefined}
                          >
                            <input
                              type="checkbox"
                              checked={selectedTemplateIds.has(template.id)}
                              onChange={() => !isLocked && toggleTemplate(template.id)}
                              disabled={isLocked}
                              className={`mt-1 ${isLocked ? 'cursor-not-allowed' : ''}`}
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                {isLocked && <i className="pi pi-lock text-red-500" />}
                                <span style={{ color: isLocked ? '#f87171' : colors.textPrimary }}>{template.name}</span>
                                {isLocked && <span className="text-xs text-red-400">Gesperrt</span>}
                              </div>
                              {template.description && (
                                <div className="text-xs" style={{ color: colors.textMuted }}>{template.description}</div>
                              )}
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
                <div className="mt-1 text-xs" style={{ color: colors.textMuted }}>
                  {selectedTemplateIds.size} of {templates.length} selected
                </div>
              </div>

              {/* Schemas/Databases Section */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium" style={{ color: colors.textPrimary }}>
                    Databases (optional)
                  </label>
                  <button
                    onClick={toggleAllSchemas}
                    className="text-xs text-blue-400 hover:text-blue-300"
                  >
                    {selectedSchemaIds.size === schemas.filter(s => !s.is_soft_locked).length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>
                <div className="rounded-lg p-4 max-h-60 overflow-y-auto" style={{ backgroundColor: colors.bgTertiary, borderColor: colors.borderPrimary, borderWidth: '1px', borderStyle: 'solid' }}>
                  {schemas.length === 0 ? (
                    <div className="text-sm" style={{ color: colors.textMuted }}>No databases available</div>
                  ) : (
                    <div className="space-y-2">
                      {schemas.map(schema => {
                        const isLocked = schema.is_soft_locked === true;
                        return (
                          <label
                            key={schema.id}
                            className={`flex items-center space-x-2 p-2 rounded ${
                              isLocked
                                ? 'cursor-not-allowed opacity-60'
                                : 'cursor-pointer'
                            }`}
                            style={{ color: colors.textPrimary }}
                            onMouseEnter={(e) => !isLocked && (e.currentTarget.style.backgroundColor = colors.bgHover)}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            title={isLocked ? 'Datenbank-Abo abgelaufen - bitte im Database Manager entsperren' : undefined}
                          >
                            <input
                              type="checkbox"
                              checked={selectedSchemaIds.has(schema.id)}
                              onChange={() => !isLocked && toggleSchema(schema.id)}
                              disabled={isLocked}
                              className={isLocked ? 'cursor-not-allowed' : ''}
                            />
                            {isLocked && (
                              <i className="pi pi-lock text-red-500" />
                            )}
                            <span style={{ color: isLocked ? '#f87171' : colors.textPrimary }}>
                              {schema.name}
                            </span>
                            {isLocked && (
                              <span className="text-xs text-red-400 ml-auto">Gesperrt</span>
                            )}
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
                <div className="mt-1 text-xs" style={{ color: colors.textMuted }}>
                  {selectedSchemaIds.size} of {schemas.length} selected
                </div>
              </div>

              {/* Migration Version Section - Only visible when schemas are selected */}
              {selectedSchemaIds.size > 0 && (
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>
                    {t.codegenerationpanel3023}
                  </label>
                  {migrationVersionOptions.length > 0 ? (
                    <>
                      <select
                        value={migrationFromVersion ?? ''}
                        onChange={(e) => setMigrationFromVersion(e.target.value ? Number(e.target.value) : null)}
                        className="w-full rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        style={{ backgroundColor: colors.bgTertiary, borderColor: colors.borderPrimary, borderWidth: '1px', borderStyle: 'solid', color: colors.textPrimary }}
                      >
                        <option value="">Keine Migration (nur aktuelle Version)</option>
                        {migrationVersionOptions.map(opt => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label} → Aktuell
                          </option>
                        ))}
                      </select>
                      <div className="mt-1 text-xs" style={{ color: colors.textMuted }}>
                        {migrationFromVersion
                          ? `Migration von v${migrationFromVersion} zur aktuellen Version`
                          : 'Wähle eine vorherige Version für Schema-Migrations-SQL'}
                      </div>
                    </>
                  ) : (
                    <div className="text-sm rounded-lg p-3" style={{ backgroundColor: colors.bgTertiary, borderColor: colors.borderPrimary, borderWidth: '1px', borderStyle: 'solid', color: colors.textMuted }}>
                      Keine Migration verfügbar - Schema hat nur Version 1
                    </div>
                  )}
                </div>
              )}

              {/* Languages Section */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium" style={{ color: colors.textPrimary }}>
                    Languages (optional)
                  </label>
                  <button
                    onClick={toggleAllLanguages}
                    className="text-xs text-blue-400 hover:text-blue-300"
                  >
                    {selectedLanguageCodes.size === languages.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>
                <div className="rounded-lg p-4 max-h-60 overflow-y-auto" style={{ backgroundColor: colors.bgTertiary, borderColor: colors.borderPrimary, borderWidth: '1px', borderStyle: 'solid' }}>
                  {languages.length === 0 ? (
                    <div className="text-sm" style={{ color: colors.textMuted }}>No languages available</div>
                  ) : (
                    <div className="space-y-2">
                      {languages.map(language => (
                        <label
                          key={language.code}
                          className="flex items-center space-x-2 cursor-pointer p-2 rounded"
                          style={{ color: colors.textPrimary }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.bgHover}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          <input
                            type="checkbox"
                            checked={selectedLanguageCodes.has(language.code)}
                            onChange={() => toggleLanguage(language.code)}
                          />
                          <span>{language.name}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
                <div className="mt-1 text-xs" style={{ color: colors.textMuted }}>
                  {selectedLanguageCodes.size} of {languages.length} selected
                </div>
              </div>

              {/* Warnings */}
              {warnings.length > 0 && (
                <div className="mb-6 space-y-3">
                  {warnings.map((warning, index) => (
                    <div key={index} className="p-3 bg-yellow-900 bg-opacity-50 border border-yellow-600 rounded text-yellow-200">
                      <div className="flex items-start space-x-2">
                        <span className="text-xl">⚠️</span>
                        <div className="flex-1">
                          <div className="font-medium mb-1">{warning.message}</div>
                          <div className="text-xs">
                            Affected templates: {warning.templates.join(', ')}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Generation Errors - Scrollable List */}
              {generationStats && generationStats.errors > 0 && (
                <div className="mb-6 p-4 bg-red-900 bg-opacity-30 border border-red-600 rounded-lg">
                  <div className="flex items-center space-x-2 mb-3">
                    <span className="text-2xl">🚨</span>
                    <div>
                      <div className="font-bold text-red-300">
                        Syntax Errors Found During Generation
                      </div>
                      <div className="text-sm text-red-400">
                        {generationStats.errors} error{generationStats.errors !== 1 ? 's' : ''} | {generationStats.files} file{generationStats.files !== 1 ? 's' : ''} generated successfully
                      </div>
                    </div>
                  </div>

                  {/* Scrollable Error List */}
                  <div className="max-h-96 overflow-y-auto rounded p-3 space-y-2" style={{ backgroundColor: colors.bgSecondary }}>
                    {generationErrors.map((err, index) => (
                      <div key={index} className="p-3 rounded text-sm" style={{ backgroundColor: colors.bgTertiary, borderWidth: '1px', borderStyle: 'solid', borderColor: colors.errorBorder }}>
                        <div className="flex items-start space-x-2">
                          <span className="font-bold" style={{ color: colors.errorText }}>#{index + 1}</span>
                          <div className="flex-1 space-y-1">
                            <div className="font-medium" style={{ color: colors.errorText }}>{err.file}</div>
                            <div className="text-xs" style={{ color: colors.textMuted }}>
                              Template: <span style={{ color: colors.textSecondary }}>{err.template}</span>
                              {err.table && <> | Table: <span style={{ color: colors.textSecondary }}>{err.table}</span></>}
                              {err.language && <> | Language: <span style={{ color: colors.textSecondary }}>{err.language}</span></>}
                            </div>
                            <div className="mt-1" style={{ color: colors.errorText }}>{err.error}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                    {generationStats.errors > generationErrors.length && (
                      <div className="p-3 rounded text-sm" style={{ backgroundColor: colors.bgTertiary, borderWidth: '1px', borderStyle: 'solid', borderColor: colors.warningBorder, color: colors.warningText }}>
                        ⚠️ {generationStats.errors - generationErrors.length} more error(s) - see ERRORS.txt in the ZIP file
                      </div>
                    )}
                  </div>

                  <div className="mt-3 text-xs text-red-400">
                    💡 Tip: All errors are also saved in <strong>ERRORS.txt</strong> inside the ZIP file
                  </div>
                </div>
              )}

              {/* 💳 Credit Info Box */}
              {currentUser && (
                <div className={`mb-4 p-3 rounded-lg border ${
                  currentUser.patron_type === 'monthly'
                    ? 'bg-green-900/20 border-green-700'
                    : 'bg-yellow-900/20 border-yellow-700'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`text-lg ${
                        currentUser.patron_type === 'monthly' ? 'text-green-400' : 'text-yellow-400'
                      }`}>
                        {currentUser.patron_type === 'monthly' ? '⭐' : '💳'}
                      </span>
                      <div className="text-sm">
                        {currentUser.patron_type === 'monthly' ? (
                          <span style={{ color: colors.successText }}>
                            <strong>Patron Monthly</strong> - Generierung kostenlos
                          </span>
                        ) : (
                          <span style={{ color: colors.warningText }}>
                            Generierung kostet <strong>5 Credits</strong>
                          </span>
                        )}
                      </div>
                    </div>
                    {currentUser.patron_type !== 'monthly' && (
                      <div className="text-sm flex items-center gap-3" style={{ color: colors.textSecondary }}>
                        <span>{t.codegenerationpanel3164}<strong style={{ color: colors.textPrimary }}>{currentUser.credits || 0}</strong></span>
                        {(currentUser.credits || 0) < 5 && (
                          <button
                            type="button"
                            onClick={() => { setPlanModalInitialTab(1); setShowPlanModal(true); }}
                            className="text-yellow-400 hover:text-yellow-300 underline text-xs font-semibold"
                          >
                            Credits kaufen
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  {/* Patron Monthly upgrade hint when low on credits */}
                  {currentUser.patron_type !== 'monthly' && (currentUser.credits || 0) < 5 && (
                    <p className="text-xs text-center mt-2" style={{ color: colors.textMuted }}>
                      Oder upgrade zu{' '}
                      <button
                        type="button"
                        onClick={() => { setPlanModalInitialTab(0); setShowPlanModal(true); }}
                        className="underline font-semibold"
                        style={{ color: colors.warningText }}
                      >
                        Patron Monthly
                      </button>
                      {' '}für unbegrenzte Generierung!
                    </p>
                  )}
                </div>
              )}

              {/* 🔗 Git Push Option */}
              <div className="mb-4 p-4 rounded-lg" style={{ backgroundColor: colors.bgTertiary, borderColor: colors.borderPrimary, borderWidth: '1px', borderStyle: 'solid' }}>
                <div className="flex items-center justify-between">
                  <label className={`flex items-center gap-3 ${gitIntegrationAccess?.has_access !== false ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}`}>
                    <input
                      type="checkbox"
                      checked={pushToGit}
                      onChange={(e) => handlePushToGitChange(e.target.checked)}
                      disabled={gitIntegrationAccess?.has_access === false}
                      className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                      style={{ backgroundColor: colors.bgSecondary, borderColor: colors.borderPrimary }}
                    />
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🔗</span>
                      <span className="font-medium" style={{ color: colors.textPrimary }}>Push to Git</span>
                      <span className="text-xs" style={{ color: colors.textMuted }}>(automatisch nach Generierung)</span>
                      {gitIntegrationAccess?.has_access && gitIntegrationAccess.is_patron && (
                        <span className="text-xs bg-purple-600 text-white px-2 py-0.5 rounded">Patron</span>
                      )}
                      {gitIntegrationAccess?.has_access && !gitIntegrationAccess.is_patron && gitIntegrationAccess.days_remaining !== undefined && (
                        <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded">
                          {gitIntegrationAccess.days_remaining} Tage
                        </span>
                      )}
                    </div>
                  </label>

                  {/* Merken Checkbox */}
                  {gitIntegrationAccess?.has_access !== false && (
                    <label className="flex items-center gap-2 cursor-pointer text-sm" style={{ color: colors.textMuted }}>
                      <input
                        type="checkbox"
                        checked={rememberPushToGit}
                        onChange={(e) => handleRememberChange(e.target.checked)}
                        className="w-4 h-4 rounded text-green-600 focus:ring-green-500"
                        style={{ backgroundColor: colors.bgTertiary, borderColor: colors.borderPrimary }}
                      />
                      <span>Merken</span>
                      {rememberPushToGit && <span style={{ color: colors.successText }}>✓</span>}
                    </label>
                  )}
                </div>

                {/* Subscription Required Message */}
                {gitIntegrationAccess?.has_access === false && (
                  <div className="mt-3 p-3 rounded" style={{ backgroundColor: colors.infoBg, borderWidth: '1px', borderStyle: 'solid', borderColor: colors.accent }}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2" style={{ color: colors.infoText }}>
                        <span>🔒</span>
                        <span className="text-sm">Git Integration ist ein Premium-Feature</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium" style={{ color: colors.textSecondary }}>
                          {gitIntegrationAccess.unlock_cost} Credits / Jahr
                        </span>
                        <button
                          type="button"
                          onClick={unlockGitIntegration}
                          disabled={unlockingGitIntegration}
                          className="px-3 py-1 bg-purple-600 hover:bg-purple-500 disabled:bg-purple-800 disabled:cursor-wait text-white text-sm font-medium rounded transition-colors"
                        >
                          {unlockingGitIntegration ? '...' : 'Freischalten'}
                        </button>
                      </div>
                    </div>
                    <p className="mt-2 text-xs" style={{ color: colors.textMuted }}>
                      Schalten Sie Git Integration frei, um Code direkt zu GitHub/GitLab zu pushen, PRs zu erstellen und automatisch zu mergen.
                    </p>
                  </div>
                )}

                {/* Git Configuration - appears when checkbox is checked */}
                {pushToGit && gitIntegrationAccess?.has_access !== false && (
                  <div className="mt-4 space-y-4 pl-8" style={{ borderLeftWidth: '2px', borderLeftStyle: 'solid', borderLeftColor: colors.borderPrimary }}>
                    {/* No providers connected message */}
                    {gitProviders.length === 0 && !loadingGitData && (
                      <div className="p-3 rounded text-sm" style={{ backgroundColor: colors.warningBg, borderWidth: '1px', borderStyle: 'solid', borderColor: colors.warningBorder, color: colors.warningText }}>
                        <div className="flex items-center gap-2">
                          <span>⚠️</span>
                          <span>Kein Git-Provider verbunden. Bitte verbinden Sie GitHub oder GitLab in den Profileinstellungen.</span>
                        </div>
                      </div>
                    )}

                    {/* Provider Selection */}
                    {gitProviders.length > 0 && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Provider Dropdown */}
                        <div>
                          <label className="block text-sm font-medium mb-1" style={{ color: colors.textSecondary }}>
                            Provider
                          </label>
                          <select
                            value={selectedGitProvider?.id || ''}
                            onChange={(e) => {
                              const provider = gitProviders.find(p => p.id === Number(e.target.value));
                              setSelectedGitProvider(provider || null);
                              setSelectedRepository(null);
                            }}
                            className="w-full px-3 py-2 rounded focus:ring-2 focus:ring-blue-500"
                            style={{ backgroundColor: colors.bgTertiary, borderColor: colors.borderPrimary, borderWidth: '1px', borderStyle: 'solid', color: colors.textPrimary }}
                          >
                            <option value="">Provider wählen...</option>
                            {gitProviders.map(provider => (
                              <option key={provider.id} value={provider.id}>
                                {provider.provider === 'github' ? '🐙 GitHub' : '🦊 GitLab'} - @{provider.username}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Repository Dropdown */}
                        <div>
                          <label className="block text-sm font-medium mb-1" style={{ color: colors.textSecondary }}>
                            Repository
                          </label>
                          <select
                            value={selectedRepository?.id || ''}
                            onChange={(e) => {
                              const repo = gitRepositories.find(r => r.id === Number(e.target.value));
                              setSelectedRepository(repo || null);
                            }}
                            disabled={!selectedGitProvider || loadingGitData}
                            className="w-full px-3 py-2 rounded focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                            style={{ backgroundColor: colors.bgTertiary, borderColor: colors.borderPrimary, borderWidth: '1px', borderStyle: 'solid', color: colors.textPrimary }}
                          >
                            <option value="">
                              {loadingGitData ? 'Lade Repositories...' : 'Repository wählen...'}
                            </option>
                            {gitRepositories.map(repo => (
                              <option key={repo.id} value={repo.id}>
                                {repo.private ? '🔒' : '🌐'} {repo.full_name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )}

                    {/* Branch Selection */}
                    {selectedRepository && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-1" style={{ color: colors.textSecondary }}>
                            Branch
                          </label>
                          <div className="flex items-center gap-2">
                            <label className="flex items-center gap-2 text-sm" style={{ color: colors.textMuted }}>
                              <input
                                type="radio"
                                checked={!useNewBranch}
                                onChange={() => setUseNewBranch(false)}
                                className="text-blue-600"
                              />
                              Existierend
                            </label>
                            <label className="flex items-center gap-2 text-sm" style={{ color: colors.textMuted }}>
                              <input
                                type="radio"
                                checked={useNewBranch}
                                onChange={() => setUseNewBranch(true)}
                                className="text-blue-600"
                              />
                              Neu erstellen
                            </label>
                          </div>
                          {!useNewBranch ? (
                            <select
                              value={selectedBranch}
                              onChange={(e) => setSelectedBranch(e.target.value)}
                              disabled={loadingGitData}
                              className="mt-2 w-full px-3 py-2 rounded focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                              style={{ backgroundColor: colors.bgTertiary, borderColor: colors.borderPrimary, borderWidth: '1px', borderStyle: 'solid', color: colors.textPrimary }}
                            >
                              <option value="">
                                {loadingGitData ? 'Lade Branches...' : 'Branch wählen...'}
                              </option>
                              {gitBranches.map(branch => (
                                <option key={branch.name} value={branch.name}>
                                  {branch.name} {branch.protected && '🔒'}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type="text"
                              value={newBranchName}
                              onChange={(e) => setNewBranchName(e.target.value)}
                              placeholder="z.B. feature/generated-code"
                              className="mt-2 w-full px-3 py-2 rounded focus:ring-2 focus:ring-blue-500 themed-input"
                              style={{ backgroundColor: colors.bgTertiary, borderColor: colors.borderPrimary, borderWidth: '1px', borderStyle: 'solid', color: colors.textPrimary }}
                            />
                          )}
                        </div>

                        {/* Commit Message */}
                        <div>
                          <label className="block text-sm font-medium mb-1" style={{ color: colors.textSecondary }}>
                            Commit Message
                          </label>
                          <input
                            type="text"
                            value={commitMessage}
                            onChange={(e) => setCommitMessage(e.target.value)}
                            placeholder="Commit message..."
                            className="mt-6 w-full px-3 py-2 rounded focus:ring-2 focus:ring-blue-500 themed-input"
                            style={{ backgroundColor: colors.bgTertiary, borderColor: colors.borderPrimary, borderWidth: '1px', borderStyle: 'solid', color: colors.textPrimary }}
                          />
                        </div>

                        {/* PR and Merge Options */}
                        <div className="pt-3 space-y-3" style={{ borderTopWidth: '1px', borderTopStyle: 'solid', borderTopColor: colors.borderPrimary }}>
                          {/* Create PR Checkbox */}
                          <label className="flex items-center gap-2 cursor-pointer text-sm" style={{ color: colors.textSecondary }}>
                            <input
                              type="checkbox"
                              checked={createPullRequest}
                              onChange={(e) => {
                                setCreatePullRequest(e.target.checked);
                                if (!e.target.checked) {
                                  setAutoMerge(false);
                                  setDeleteBranchAfterMerge(false);
                                }
                              }}
                              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                              style={{ backgroundColor: colors.bgTertiary, borderColor: colors.borderPrimary }}
                            />
                            <span>🔀 {selectedGitProvider?.provider === 'gitlab' ? 'Merge Request' : 'Pull Request'} erstellen</span>
                          </label>

                          {/* PR Title (shown when PR is enabled) */}
                          {createPullRequest && (
                            <>
                              <div>
                                <label className="block text-sm font-medium mb-1" style={{ color: colors.textSecondary }}>
                                  {selectedGitProvider?.provider === 'gitlab' ? 'MR' : 'PR'} Titel
                                </label>
                                <input
                                  type="text"
                                  value={prTitle}
                                  onChange={(e) => setPrTitle(e.target.value)}
                                  placeholder={`${selectedGitProvider?.provider === 'gitlab' ? 'Merge Request' : 'Pull Request'} Titel...`}
                                  className="w-full px-3 py-2 rounded focus:ring-2 focus:ring-blue-500 themed-input"
                                  style={{ backgroundColor: colors.bgTertiary, borderColor: colors.borderPrimary, borderWidth: '1px', borderStyle: 'solid', color: colors.textPrimary }}
                                />
                              </div>

                              {/* Auto-Merge Checkbox */}
                              <label className="flex items-center gap-2 cursor-pointer text-sm ml-6" style={{ color: colors.textSecondary }}>
                                <input
                                  type="checkbox"
                                  checked={autoMerge}
                                  onChange={(e) => setAutoMerge(e.target.checked)}
                                  className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
                                  style={{ backgroundColor: colors.bgTertiary, borderColor: colors.borderPrimary }}
                                />
                                <span>⚡ Auto-Merge nach Erstellung</span>
                              </label>

                              {/* Delete Branch After Merge (shown when auto-merge is enabled) */}
                              {autoMerge && (
                                <label className="flex items-center gap-2 cursor-pointer text-sm ml-12" style={{ color: colors.textSecondary }}>
                                  <input
                                    type="checkbox"
                                    checked={deleteBranchAfterMerge}
                                    onChange={(e) => setDeleteBranchAfterMerge(e.target.checked)}
                                    className="w-4 h-4 rounded text-red-600 focus:ring-red-500"
                                    style={{ backgroundColor: colors.bgTertiary, borderColor: colors.borderPrimary }}
                                  />
                                  <span>🗑️ Branch nach Merge löschen</span>
                                </label>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Remember Settings Checkbox */}
                    {selectedRepository && (
                      <div className="flex items-center justify-between pt-2" style={{ borderTopWidth: '1px', borderTopStyle: 'solid', borderTopColor: colors.borderPrimary }}>
                        <label className="flex items-center gap-2 cursor-pointer text-sm" style={{ color: colors.textSecondary }}>
                          <input
                            type="checkbox"
                            checked={rememberGitSettings}
                            onChange={(e) => setRememberGitSettings(e.target.checked)}
                            className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                            style={{ backgroundColor: colors.bgTertiary, borderColor: colors.borderPrimary }}
                          />
                          <span>💾 Einstellungen im Projekt speichern</span>
                        </label>
                        {rememberGitSettings && (
                          <span className="text-xs" style={{ color: colors.successText }}>
                            Wird beim Generieren gespeichert
                          </span>
                        )}
                      </div>
                    )}

                    {/* Git Push Status */}
                    {gitPushStatus !== 'idle' && (
                      <div
                        className="p-2 rounded text-sm"
                        style={{
                          backgroundColor: gitPushStatus === 'pushing' ? colors.infoBg :
                                          gitPushStatus === 'success' ? colors.successBg : colors.errorBg,
                          color: gitPushStatus === 'pushing' ? colors.infoText :
                                 gitPushStatus === 'success' ? colors.successText : colors.errorText
                        }}
                      >
                        {gitPushStatus === 'pushing' && (
                          <span className="flex items-center gap-2">
                            <span className="animate-spin">⚙️</span> Pushing to Git...
                          </span>
                        )}
                        {gitPushStatus === 'success' && '✅ Erfolgreich gepusht!'}
                        {gitPushStatus === 'error' && '❌ Push fehlgeschlagen - siehe Log'}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Project Locked Warning */}
              {isProjectLocked() && (
                <div className="bg-red-900/30 border border-red-600 rounded-lg p-4 mb-4">
                  <div className="flex items-center gap-2 text-red-400">
                    <i className="pi pi-lock text-xl"></i>
                    <div>
                      <div className="font-semibold">Projekt gesperrt</div>
                      <div className="text-sm text-red-300">
                        Das Abo für dieses Projekt ist abgelaufen. Bitte erneuern Sie das Abo in der Projektverwaltung, um Code zu generieren.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Generate Buttons */}
              <div className="flex justify-end gap-3">
                <button
                  onClick={handleGenerateProject}
                  disabled={!canGenerate() || generating}
                  className="px-6 py-3 rounded-lg font-medium transition-colors"
                  style={{
                    backgroundColor: canGenerate() && !generating ? colors.buttonSuccess : colors.bgTertiary,
                    color: canGenerate() && !generating ? colors.textInverse : colors.textMuted,
                    cursor: canGenerate() && !generating ? 'pointer' : 'not-allowed',
                  }}
                  onMouseEnter={(e) => {
                    if (canGenerate() && !generating) {
                      e.currentTarget.style.backgroundColor = colors.buttonSuccessHover;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (canGenerate() && !generating) {
                      e.currentTarget.style.backgroundColor = colors.buttonSuccess;
                    }
                  }}
                >
                  {generating ? (
                    <>
                      <span className="inline-block animate-spin mr-2">⚙️</span>
                      Generating...
                    </>
                  ) : (
                    currentUser?.patron_type === 'monthly'
                      ? '🚀 Generate & Download'
                      : '🚀 Generate & Download (5 Credits)'
                  )}
                </button>

                <button
                  onClick={handleGenerateAndDeploy}
                  disabled={!canGenerate() || generating}
                  className="px-6 py-3 rounded-lg font-medium transition-colors"
                  style={{
                    backgroundColor: canGenerate() && !generating ? colors.buttonPrimary : colors.bgTertiary,
                    color: canGenerate() && !generating ? colors.textInverse : colors.textMuted,
                    cursor: canGenerate() && !generating ? 'pointer' : 'not-allowed',
                  }}
                  onMouseEnter={(e) => {
                    if (canGenerate() && !generating) {
                      e.currentTarget.style.backgroundColor = colors.buttonPrimaryHover;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (canGenerate() && !generating) {
                      e.currentTarget.style.backgroundColor = colors.buttonPrimary;
                    }
                  }}
                >
                  {generating ? (
                    <>
                      <span className="inline-block animate-spin mr-2">⚙️</span>
                      Deploying...
                    </>
                  ) : (
                    currentUser?.patron_type === 'monthly'
                      ? '📦 Generate & Deploy'
                      : '📦 Generate & Deploy (5 Credits)'
                  )}
                </button>

                {/* FTP/SSH Upload Button - only show if configured */}
                {selectedProject?.has_ftp_deployment && (
                  <button
                    onClick={handleFtpUpload}
                    disabled={!canGenerate() || generating || ftpUploading}
                    className="px-6 py-3 rounded-lg font-medium transition-colors"
                    style={{
                      backgroundColor: canGenerate() && !generating && !ftpUploading ? '#9333ea' : colors.bgTertiary,
                      color: canGenerate() && !generating && !ftpUploading ? colors.textInverse : colors.textMuted,
                      cursor: canGenerate() && !generating && !ftpUploading ? 'pointer' : 'not-allowed',
                    }}
                    title={`Upload via ${selectedProject.deployment_type?.toUpperCase()} to ${selectedProject.ftp_host}`}
                    onMouseEnter={(e) => {
                      if (canGenerate() && !generating && !ftpUploading) {
                        e.currentTarget.style.backgroundColor = '#7c3aed';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (canGenerate() && !generating && !ftpUploading) {
                        e.currentTarget.style.backgroundColor = '#9333ea';
                      }
                    }}
                  >
                    {ftpUploading ? (
                      <>
                        <span className="inline-block animate-spin mr-2">⚙️</span>
                        Uploading...
                      </>
                    ) : (
                      currentUser?.patron_type === 'monthly'
                        ? `📡 Generate & ${selectedProject.deployment_type?.toUpperCase()} Upload`
                        : `📡 Generate & ${selectedProject.deployment_type?.toUpperCase()} Upload (5 Credits)`
                    )}
                  </button>
                )}
              </div>

              {/* 🎯 Progress Bar */}
              {generationProgress && (
                <div className="mt-6 rounded-lg p-4" style={{ backgroundColor: colors.bgTertiary, borderColor: colors.borderPrimary, borderWidth: '1px', borderStyle: 'solid' }}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-medium" style={{ color: colors.textPrimary }}>
                      {generationProgress.currentTask}
                    </div>
                    <div className="text-sm" style={{ color: colors.textMuted }}>
                      {generationProgress.percentage}%
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full rounded-full h-4 mb-2 overflow-hidden" style={{ backgroundColor: colors.bgSecondary }}>
                    <div
                      className="bg-gradient-to-r from-green-500 to-blue-500 h-4 rounded-full transition-all duration-300 ease-out flex items-center justify-end px-2"
                      style={{ width: `${generationProgress.percentage}%` }}
                    >
                      {generationProgress.percentage > 10 && (
                        <span className="text-xs font-bold text-white drop-shadow">
                          {generationProgress.percentage}%
                        </span>
                      )}
                    </div>
                  </div>

                  {/* ETA and progress info */}
                  <div className="flex items-center justify-between text-xs" style={{ color: colors.textMuted }}>
                    <div>
                      {generationProgress.current} / {generationProgress.total} Operationen
                    </div>
                    <div className="font-medium" style={{ color: colors.accent }}>
                      {generationProgress.eta}
                    </div>
                  </div>
                </div>
              )}

              {/* 📋 Deployment Log */}
              {deploymentLogs.length > 0 && (
                <div className="mt-6 rounded-lg overflow-hidden" style={{ backgroundColor: colors.bgPrimary, borderColor: colors.borderPrimary, borderWidth: '1px', borderStyle: 'solid' }}>
                  <div className="px-4 py-3 flex items-center justify-between" style={{ backgroundColor: colors.bgTertiary, borderBottomColor: colors.borderPrimary, borderBottomWidth: '1px', borderBottomStyle: 'solid' }}>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold" style={{ color: colors.textPrimary }}>📋 Deployment Log</h3>
                      {deploymentPolling && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-900 text-blue-200 rounded text-xs">
                          <span className="inline-block animate-spin">🔄</span>
                          Monitoring...
                        </span>
                      )}
                      {deploymentTaskId && (
                        <span className="text-xs" style={{ color: colors.textMuted }}>Task #{deploymentTaskId}</span>
                      )}
                    </div>
                    <button
                      onClick={() => setDeploymentLogs([])}
                      className="text-xs transition-colors"
                      style={{ color: colors.textMuted }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = colors.textPrimary; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = colors.textMuted; }}
                    >
                      Clear
                    </button>
                  </div>
                  <div className="p-4 font-mono text-xs max-h-96 overflow-y-auto bg-black">
                    {deploymentLogs.map((log, index) => (
                      <div
                        key={index}
                        className={`${
                          log.startsWith('✅') ? 'text-green-400' :
                          log.startsWith('❌') ? 'text-red-400' :
                          log.startsWith('⚠️') || log.startsWith('💡') ? 'text-yellow-400' :
                          log.startsWith('📦') || log.startsWith('🚀') || log.startsWith('📋') ? 'text-blue-400' :
                          'text-gray-300'
                        }`}
                      >
                        {log || '\u00A0'}
                      </div>
                    ))}
                    <div ref={deploymentLogEndRef} />
                  </div>
                </div>
              )}

              {/* Validation Message */}
              {selectedTemplateIds.size === 0 && (
                <div className="mt-2 text-xs text-red-400 text-right">
                  Please select at least one template
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* 🆕 File Conflict Warning Dialog */}
      {showConflictDialog && fileConflicts.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="rounded-lg shadow-2xl p-6 max-w-3xl w-full mx-4 max-h-[80vh] overflow-y-auto" style={{ backgroundColor: colors.bgSecondary }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="text-4xl">⚠️</div>
              <div>
                <h2 className="text-2xl font-bold text-yellow-400">ACHTUNG: Datei-Konflikte erkannt!</h2>
                <p className="text-sm mt-1" style={{ color: colors.textSecondary }}>
                  Die folgenden Dateien werden von mehreren Templates generiert und überschreiben sich gegenseitig:
                </p>
              </div>
            </div>

            <div className="rounded-lg p-4 mb-6 max-h-96 overflow-y-auto" style={{ backgroundColor: colors.bgPrimary }}>
              {fileConflicts.map((conflict, index) => (
                <div key={index} className="mb-4 pb-4 last:border-0" style={{ borderBottomWidth: '1px', borderBottomStyle: 'solid', borderBottomColor: colors.borderPrimary }}>
                  <div className="flex items-start gap-2">
                    <span className="font-bold text-lg" style={{ color: colors.errorText }}>❌</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="font-mono font-semibold" style={{ color: colors.warningText }}>
                          {conflict.filePath}
                        </div>
                        {conflict.type === 'intra-template' && (
                          <span className="text-xs px-2 py-1 rounded" style={{ backgroundColor: colors.errorBg, color: colors.errorText }}>
                            DUPLIKAT IM TEMPLATE
                          </span>
                        )}
                      </div>
                      <div className="text-sm ml-4" style={{ color: colors.textMuted }}>
                        {conflict.type === 'intra-template' ? (
                          <>
                            <strong style={{ color: colors.errorText }}>⚠️ Achtung:</strong> Diese Datei existiert <strong>mehrfach im gleichen Template</strong>:
                            <ul className="mt-1 space-y-1">
                              <li className="flex items-center gap-2">
                                <span style={{ color: colors.errorText }}>•</span>
                                <span style={{ color: colors.textSecondary }}>{conflict.templates[0].name}</span>
                                <span className="text-xs" style={{ color: colors.errorText }}>(enthält {conflict.filePath} mehrfach)</span>
                              </li>
                            </ul>
                          </>
                        ) : (
                          <>
                            Wird generiert von <strong>mehreren Templates</strong>:
                            <ul className="mt-1 space-y-1">
                              {conflict.templates.map((template, tIdx) => (
                                <li key={tIdx} className="flex items-center gap-2">
                                  <span style={{ color: colors.accent }}>•</span>
                                  <span style={{ color: colors.textSecondary }}>{template.name}</span>
                                </li>
                              ))}
                            </ul>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-blue-900 border border-blue-700 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-2">
                <span className="text-blue-400 text-xl">💡</span>
                <div className="text-sm text-blue-200">
                  <strong>Hinweis:</strong> Wenn Sie fortfahren, wird die <strong>zuletzt generierte</strong> Datei die vorherigen überschreiben.
                  Dies kann zu unerwartetem Verhalten führen.
                </div>
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowConflictDialog(false);
                  setFileConflicts([]);
                }}
                className="px-6 py-3 rounded-lg font-medium transition-colors"
                style={{ backgroundColor: colors.buttonSecondary, color: colors.textPrimary }}
              >
                Abbrechen
              </button>
              <button
                onClick={() => {
                  executeGeneration();
                }}
                className="px-6 py-3 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <span>⚠️</span>
                Trotzdem generieren
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🛒 PlanModal for buying credits */}
      <PlanModal
        visible={showPlanModal}
        onHide={() => {
          setShowPlanModal(false);
          loadCurrentUser(); // Refresh credits after modal closes
        }}
        initialTab={planModalInitialTab}
      />

      {/* 👤 ProfileModal for Git provider connection */}
      <ProfileModal
        visible={showProfileModal}
        onHide={() => {
          setShowProfileModal(false);
          loadGitProviders(); // Refresh providers after modal closes
        }}
        defaultTab={profileModalDefaultTab}
      />
    </div>
  );
}
