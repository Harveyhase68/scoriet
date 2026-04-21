import React, { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/contexts/ToastContext';
import { useProject } from '@/contexts/ProjectContext';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { InputNumber } from 'primereact/inputnumber';
import { Password as PrimePassword } from 'primereact/password';
import { Dropdown } from 'primereact/dropdown';
import { Checkbox } from 'primereact/checkbox';
import { Button } from 'primereact/button';
import { ProgressSpinner } from 'primereact/progressspinner';
import { TabView, TabPanel } from 'primereact/tabview';
import { PickList } from 'primereact/picklist';
import { useTranslation, SupportedLanguage, getStoredLanguage } from '@/i18n';
import { ProjectProtectedFilesView } from '@/Components/ProjectProtectedFilesView';
import { DeploymentScriptsEditor, ScriptStep } from '@/Components/DeploymentScriptsEditor';
import { useTheme } from '@/contexts/ThemeContext';

interface Language {
    code: string;
    name: string;
    native_name: string;
    is_active: boolean;
    // Optional — only present when the API endpoint returns the full Language
    // row (see app/Models/Language.php). Kept optional so interfaces built
    // against trimmed responses don't need to change.
    flag?: string;
}

interface ProjectMember {
    id: number;
    user_id: number;
    user: {
        id: number;
        name: string;
        email: string;
    };
    role: string;
}

interface TemplateVariable {
    id: number;
    template_id: number;
    variable_name: string;
    description: string | null;
    default_value: string | null;
    is_required: boolean;
}

interface Template {
    id: number;
    name: string;
    description: string | null;
    protected_files?: string[];
}

interface TemplateWithVariables extends Template {
    variables: TemplateVariable[];
}

interface GitProvider {
    id: number;
    provider: string;
    provider_name: string;
    username: string;
    avatar_url: string | null;
    is_expired: boolean;
}

interface GitRepository {
    id: number;
    name: string;
    full_name: string;
    private: boolean;
    url: string;
    default_branch: string;
    description: string | null;
}

interface GitBranch {
    name: string;
    protected: boolean;
}

interface GitSettings {
    provider_id: number | null;
    provider: string | null;
    provider_username: string | null;
    repository: string | null;
    default_branch: string | null;
    main_branch: string | null;
    target_directory: string | null;
    workflow: 'push_only' | 'push_and_pr' | 'push_pr_merge';
    pr_title_template: string | null;
    pr_description_template: string | null;
    auto_delete_branch: boolean;
    is_configured: boolean;
}

// Future use: Template variable values
interface _VariableValue {
    variable_name: string;
    language: string;
    value: string;
}

export default function ProjectSettingsPanel() {
  // i18n setup
  const [currentLanguage] = React.useState<SupportedLanguage>(getStoredLanguage());
  const { t } = useTranslation(currentLanguage);
  // Theme
  const { colors } = useTheme();
    const toast = useToast();
    const { selectedProject, loadProjects, releaseLock } = useProject();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // --- Validation UX state ---
    // Controls the currently shown TabView tab so we can jump to the first
    // tab that contains an invalid field. `invalidFields` is a set of field
    // names (as used in the Laravel validator / formData) that failed either
    // client-side pre-validation or the backend 422 response. Inputs pick up
    // the red PrimeReact `p-invalid` class when their key is in this set.
    const [activeTabIndex, setActiveTabIndex] = useState<number>(0);
    const [invalidFields, setInvalidFields] = useState<Set<string>>(new Set());
    const invalidClass = (field: string) => (invalidFields.has(field) ? 'p-invalid' : '');
    const clearFieldError = (field: string) => {
        setInvalidFields(prev => {
            if (!prev.has(field)) return prev;
            const next = new Set(prev);
            next.delete(field);
            return next;
        });
    };
    const [availableLanguages, setAvailableLanguages] = useState<Language[]>([]);
    const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
    const [projectMembers, setProjectMembers] = useState<ProjectMember[]>([]);

    // Template Variables State
    const [templatesWithVariables, setTemplatesWithVariables] = useState<TemplateWithVariables[]>([]);
    const [variableValues, setVariableValues] = useState<Record<string, Record<string, string>>>({});
    const [selectedVariableLanguage, setSelectedVariableLanguage] = useState<string>('en');
    const [loadingVariables, setLoadingVariables] = useState(false);
    const [_savingVariables, setSavingVariables] = useState(false); // Future use

    // Project Translations State
    const [translations, setTranslations] = useState<Record<string, any>>({});
    const [selectedTransLang, setSelectedTransLang] = useState<string>('');
    const [savingTranslation, setSavingTranslation] = useState(false);

    // Protected Files and Deployment Scripts State
    const [projectProtectedFiles, setProjectProtectedFiles] = useState<string[]>([]);
    const [projectInstallScript, setProjectInstallScript] = useState<ScriptStep[]>([]);
    const [projectUpdateScript, setProjectUpdateScript] = useState<ScriptStep[]>([]);
    const [linkedTemplates, setLinkedTemplates] = useState<Template[]>([]); // For showing template protected files

    // Project Defaults: FormSet & ReportPattern
    const [availableFormSets, setAvailableFormSets] = useState<Array<{ id: number; name: string }>>([]);
    const [availableReportPatterns, setAvailableReportPatterns] = useState<Array<{ id: number; name: string }>>([]);
    const [defaultFormSetId, setDefaultFormSetId] = useState<number | null>(null);
    const [defaultReportPatternId, setDefaultReportPatternId] = useState<number | null>(null);

    // Git Integration State
    const [gitSettings, setGitSettings] = useState<GitSettings>({
        provider_id: null,
        provider: null,
        provider_username: null,
        repository: null,
        default_branch: null,
        main_branch: null,
        target_directory: null,
        workflow: 'push_only',
        pr_title_template: null,
        pr_description_template: null,
        auto_delete_branch: true,
        is_configured: false,
    });

    // FTP/SSH Deployment State
    const [ftpSettings, setFtpSettings] = useState({
        deployment_type: '' as '' | 'ftp' | 'sftp',
        ftp_host: '',
        ftp_port: 21,
        ftp_username: '',
        ftp_password: '',
        ftp_directory: '',
        ftp_passive: true,
        ftp_ssl: false,
        has_credentials: false,
    });
    const [testingFtp, setTestingFtp] = useState(false);
    const [ftpTestResult, setFtpTestResult] = useState<{ success: boolean; message: string } | null>(null);
    const [availableGitProviders, setAvailableGitProviders] = useState<GitProvider[]>([]);
    const [gitRepositories, setGitRepositories] = useState<GitRepository[]>([]);
    const [gitBranches, setGitBranches] = useState<GitBranch[]>([]);
    const [loadingGitRepos, setLoadingGitRepos] = useState(false);
    const [loadingGitBranches, setLoadingGitBranches] = useState(false);

    const [formData, setFormData] = useState({
        // Project Settings
        name: '',
        description: '',
        join_code: '',
        is_public: false,
        new_owner_id: null as number | null,
        // Database Connection
        database_name: '',
        database_type: 'MySQL',
        database_server: '127.0.0.1',
        database_port: '3306',
        database_username: '',
        database_password: '',
        // Diagram Settings
        diagram_max_tables_per_row: 20,
        diagram_table_width: 280,
        diagram_table_height: 450,
        diagram_horizontal_spacing: 600,
        diagram_vertical_spacing: 700,
        // Form Designer Settings
        form_designer_snap_to_grid: true,
        form_designer_grid_size: 20,
        // Report Designer Settings
        report_designer_snap_to_grid: true,
        report_designer_grid_unit: 'mm' as string,
        report_designer_grid_size: 5,
        // Project Properties
        project_directory: '',
        project_url: '',
        start_page: 'index.php',
        default_language: 'en',
        target_language: 'html',
        archive_format: 'zip',
        filename_short_length: 2,
        // API Keys
        google_translate_api_key: ''
    });

    // Release edit lock automatically when this panel is closed (unmounted)
    useEffect(() => {
        const projectId = selectedProject?.id;
        return () => {
            if (projectId) {
                releaseLock(projectId);
            }
        };
    }, [selectedProject?.id, releaseLock]);

    // Load FormSet/ReportPattern lists + current project defaults whenever the
    // selected project changes. The Defaults tab uses these to render dropdowns
    // and an immediate "save on change" pattern (no global Save button).
    useEffect(() => {
        if (!selectedProject?.id) return;
        const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token') || '';
        const headers = { 'Accept': 'application/json', 'Authorization': `Bearer ${token}` };

        fetch('/api/form-sets', { headers })
            .then(r => r.ok ? r.json() : null)
            .then(data => {
                if (data?.data) setAvailableFormSets(data.data.map((fs: { id: number; name: string }) => ({ id: fs.id, name: fs.name })));
            }).catch(() => {});
        fetch('/api/report-patterns', { headers })
            .then(r => r.ok ? r.json() : null)
            .then(data => {
                if (data?.data) setAvailableReportPatterns(data.data.map((rp: { id: number; name: string }) => ({ id: rp.id, name: rp.name })));
            }).catch(() => {});

        fetch(`/api/projects/${selectedProject.id}/form-set`, { headers })
            .then(r => r.ok ? r.json() : null)
            .then(data => {
                setDefaultFormSetId(data?.data?.id ?? null);
            }).catch(() => {});
        fetch(`/api/projects/${selectedProject.id}/report-pattern`, { headers })
            .then(r => r.ok ? r.json() : null)
            .then(data => {
                setDefaultReportPatternId(data?.data?.id ?? null);
            }).catch(() => {});
    }, [selectedProject?.id]);

    // Save handlers — save immediately on dropdown change so the user has no
    // separate "Save defaults" button to remember.
    //
    // We check `response.ok` explicitly: `fetch()` only rejects on network
    // errors, not on HTTP 4xx/5xx. Without this check a silently failing
    // DELETE would still flip the UI state to "null" while the DB keeps the
    // old row active — which is exactly what caused the earlier "snap back"
    // bug when the user re-opened the panel.
    const saveDefaultFormSet = async (newId: number | null) => {
        if (!selectedProject?.id) return;
        const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token') || '';
        const headers = { 'Accept': 'application/json', 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
        try {
            const resp = newId === null
                ? await fetch(`/api/projects/${selectedProject.id}/form-set`, { method: 'DELETE', headers })
                : await fetch(`/api/projects/${selectedProject.id}/form-set`, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({ form_set_id: newId }),
                });

            if (!resp.ok) {
                toast.showError?.((t as unknown as Record<string, string>).projectsettings_default_save_failed || 'Failed to save default');
                return; // keep the old state visible so the UI matches reality
            }
            setDefaultFormSetId(newId);
            toast.showSuccess?.((t as unknown as Record<string, string>).projectsettings_default_saved || 'Default saved');
        } catch {
            toast.showError?.((t as unknown as Record<string, string>).projectsettings_default_save_failed || 'Failed to save default');
        }
    };

    const saveDefaultReportPattern = async (newId: number | null) => {
        if (!selectedProject?.id) return;
        const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token') || '';
        const headers = { 'Accept': 'application/json', 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
        try {
            const resp = newId === null
                ? await fetch(`/api/projects/${selectedProject.id}/report-pattern`, { method: 'DELETE', headers })
                : await fetch(`/api/projects/${selectedProject.id}/report-pattern`, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({ report_pattern_id: newId }),
                });

            if (!resp.ok) {
                toast.showError?.((t as unknown as Record<string, string>).projectsettings_default_save_failed || 'Failed to save default');
                return;
            }
            setDefaultReportPatternId(newId);
            toast.showSuccess?.((t as unknown as Record<string, string>).projectsettings_default_saved || 'Default saved');
        } catch {
            toast.showError?.((t as unknown as Record<string, string>).projectsettings_default_save_failed || 'Failed to save default');
        }
    };

    const loadLanguages = useCallback(async () => {
        try {
            const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token') || sessionStorage.getItem('access_token');
            if (!token) return;

            const response = await fetch('/api/active-languages', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                },
            });

            if (response.ok) {
                const data = await response.json();
                setAvailableLanguages(Array.isArray(data) ? data : []);
            }
        } catch {
            // Error loading languages
        }
    }, []);

    const loadProjectData = useCallback(async () => {
        if (!selectedProject) return;

        setLoading(true);
        try {
            const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token') || sessionStorage.getItem('access_token');
            if (!token) return;

            // Load project settings including enabled_languages
            const settingsResponse = await fetch(`/api/projects/${selectedProject.id}/settings`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                },
            });

            if (settingsResponse.ok) {
                const settings = await settingsResponse.json();
                setSelectedLanguages(settings.enabled_languages || []);

                // Load protected files and deployment scripts
                setProjectProtectedFiles(settings.protected_files || []);
                setProjectInstallScript(settings.install_script || []);
                setProjectUpdateScript(settings.update_script || []);
            }

            // Load full project data
            const projectResponse = await fetch(`/api/projects/${selectedProject.id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                },
            });

            if (projectResponse.ok) {
                const project = await projectResponse.json();
                setFormData({
                    name: project.name || '',
                    description: project.description || '',
                    join_code: project.join_code || '',
                    is_public: project.is_public || false,
                    new_owner_id: null,
                    database_name: project.database_name || '',
                    database_type: project.database_type || 'MySQL',
                    database_server: project.database_server || '127.0.0.1',
                    database_port: project.database_port || '3306',
                    database_username: project.database_username || '',
                    database_password: project.database_password || '',
                    diagram_max_tables_per_row: project.diagram_max_tables_per_row || 20,
                    diagram_table_width: project.diagram_table_width || 280,
                    diagram_table_height: project.diagram_table_height || 450,
                    diagram_horizontal_spacing: project.diagram_horizontal_spacing || 600,
                    diagram_vertical_spacing: project.diagram_vertical_spacing || 700,
                    form_designer_snap_to_grid: project.form_designer_snap_to_grid ?? true,
                    form_designer_grid_size: project.form_designer_grid_size || 20,
                    report_designer_snap_to_grid: project.report_designer_snap_to_grid ?? true,
                    report_designer_grid_unit: project.report_designer_grid_unit || 'mm',
                    report_designer_grid_size: Number(project.report_designer_grid_size) || 5,
                    project_directory: project.project_directory || '',
                    project_url: project.project_url || '',
                    start_page: project.start_page || 'index.php',
                    default_language: project.default_language || 'en',
                    target_language: project.target_language || 'html',
                    archive_format: project.archive_format || 'zip',
                    filename_short_length: Number(project.filename_short_length) || 2,
                    google_translate_api_key: project.google_translate_api_key || ''
                });
                // Sync target_language to localStorage for TableModal access
                localStorage.setItem('scoriet_target_language', project.target_language || 'html');
            }
        } catch {
            toast.showError(t.projectsettingspanel151);
        } finally {
            setLoading(false);
        }
    }, [selectedProject, toast]);

    const loadLinkedTemplates = useCallback(async () => {
        if (!selectedProject) return;

        try {
            const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
            if (!token) return;

            // Load project with templates relationship
            const response = await fetch(`/api/projects/${selectedProject.id}/templates-with-protected-files`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                },
            });

            if (response.ok) {
                const data = await response.json();
                setLinkedTemplates(data.templates || []);
            } else {
                // Fallback: Try loading templates directly
                const fallbackResponse = await fetch(`/api/templates?project_id=${selectedProject.id}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/json',
                    },
                });

                if (fallbackResponse.ok) {
                    const templates = await fallbackResponse.json();
                    setLinkedTemplates(templates || []);
                }
            }
        } catch (error) {
            console.error('Error loading linked templates:', error);
            setLinkedTemplates([]);
        }
    }, [selectedProject]);

    // Load FTP/SSH Settings
    const loadFtpSettings = useCallback(async () => {
        if (!selectedProject) return;

        try {
            const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
            if (!token) return;

            const response = await fetch(`/api/projects/${selectedProject.id}/ftp-settings`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                },
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success && data.data) {
                    setFtpSettings({
                        deployment_type: data.data.deployment_type || '',
                        ftp_host: data.data.ftp_host || '',
                        ftp_port: data.data.ftp_port || 21,
                        ftp_username: data.data.ftp_username || '',
                        ftp_password: data.data.ftp_password || '',
                        ftp_directory: data.data.ftp_directory || '',
                        ftp_passive: data.data.ftp_passive ?? true,
                        ftp_ssl: data.data.ftp_ssl ?? false,
                        has_credentials: data.data.has_credentials || false,
                    });
                }
            }
        } catch (error) {
            console.error('Error loading FTP settings:', error);
        }
    }, [selectedProject]);

    // Test FTP/SSH Connection
    const testFtpConnection = async () => {
        if (!selectedProject) return;

        setTestingFtp(true);
        setFtpTestResult(null);

        try {
            const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
            if (!token) return;

            const response = await fetch(`/api/projects/${selectedProject.id}/ftp-test`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(ftpSettings),
            });

            const data = await response.json();
            setFtpTestResult({
                success: data.success,
                message: data.message,
            });
        } catch {
            setFtpTestResult({
                success: false,
                message: t.projectsettingspanel407,
            });
        } finally {
            setTestingFtp(false);
        }
    };

    // Save FTP/SSH Settings
    const saveFtpSettings = async () => {
        if (!selectedProject) return;

        try {
            const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
            if (!token) return;

            const response = await fetch(`/api/projects/${selectedProject.id}/ftp-settings`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(ftpSettings),
            });

            if (response.ok) {
                toast.showSuccess(t.projectsettingspanel433);
                loadFtpSettings();
            } else {
                toast.showError(t.projectsettingspanel436);
            }
        } catch {
            toast.showError(t.projectsettingspanel439);
        }
    };

    // Remove FTP/SSH Settings
    const removeFtpSettings = async () => {
        if (!selectedProject) return;

        try {
            const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
            if (!token) return;

            const response = await fetch(`/api/projects/${selectedProject.id}/ftp-settings`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                },
            });

            if (response.ok) {
                toast.showSuccess(t.projectsettingspanel460);
                setFtpSettings({
                    deployment_type: '',
                    ftp_host: '',
                    ftp_port: 21,
                    ftp_username: '',
                    ftp_password: '',
                    ftp_directory: '',
                    ftp_passive: true,
                    ftp_ssl: false,
                    has_credentials: false,
                });
                setFtpTestResult(null);
            } else {
                toast.showError(t.projectsettingspanel474);
            }
        } catch {
            toast.showError(t.projectsettingspanel477);
        }
    };

    const loadGitSettings = useCallback(async () => {
        if (!selectedProject) return;

        try {
            const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
            if (!token) return;

            const response = await fetch(`/api/projects/${selectedProject.id}/git-settings`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                },
            });

            if (response.ok) {
                const data = await response.json();
                setGitSettings(data.git_settings || {
                    provider_id: null,
                    provider: null,
                    provider_username: null,
                    repository: null,
                    default_branch: null,
                    main_branch: null,
                    target_directory: null,
                    workflow: 'push_only',
                    pr_title_template: null,
                    pr_description_template: null,
                    auto_delete_branch: true,
                    is_configured: false,
                });
                setAvailableGitProviders(data.available_providers || []);

                // If we have a provider selected, load repositories
                if (data.git_settings?.provider_id && data.git_settings?.provider) {
                    loadGitRepositories(data.git_settings.provider);
                    // If we have a repository selected, load branches
                    if (data.git_settings?.repository) {
                        loadGitBranches(data.git_settings.provider, data.git_settings.repository);
                    }
                }
            }
        } catch (error) {
            console.error('Error loading git settings:', error);
        }
    }, [selectedProject]);

    const loadGitRepositories = async (provider: string) => {
        setLoadingGitRepos(true);
        setGitRepositories([]);
        try {
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
        } catch (error) {
            console.error('Error loading git repositories:', error);
        } finally {
            setLoadingGitRepos(false);
        }
    };

    const loadGitBranches = async (provider: string, repoFullName: string) => {
        setLoadingGitBranches(true);
        setGitBranches([]);
        try {
            const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
            if (!token) return;

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
        } catch (error) {
            console.error('Error loading git branches:', error);
        } finally {
            setLoadingGitBranches(false);
        }
    };

    const handleGitProviderChange = (providerId: number | null) => {
        const provider = availableGitProviders.find(p => p.id === providerId);
        setGitSettings(prev => ({
            ...prev,
            provider_id: providerId,
            provider: provider?.provider || null,
            provider_username: provider?.username || null,
            repository: null,
            default_branch: null,
            main_branch: null,
        }));
        setGitRepositories([]);
        setGitBranches([]);

        if (provider) {
            loadGitRepositories(provider.provider);
        }
    };

    const handleGitRepositoryChange = (repoFullName: string | null) => {
        const repo = gitRepositories.find(r => r.full_name === repoFullName);
        setGitSettings(prev => ({
            ...prev,
            repository: repoFullName,
            default_branch: repo?.default_branch || null,
            main_branch: repo?.default_branch || null,
        }));
        setGitBranches([]);

        if (repoFullName && gitSettings.provider) {
            loadGitBranches(gitSettings.provider, repoFullName);
        }
    };

    const saveGitSettings = async () => {
        if (!selectedProject) return;

        try {
            const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
            if (!token) return;

            const response = await fetch(`/api/projects/${selectedProject.id}/git-settings`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                },
                body: JSON.stringify({
                    git_provider_id: gitSettings.provider_id,
                    git_repository: gitSettings.repository,
                    git_default_branch: gitSettings.default_branch,
                    git_main_branch: gitSettings.main_branch,
                    git_target_directory: gitSettings.target_directory,
                    git_workflow: gitSettings.workflow,
                    git_pr_title_template: gitSettings.pr_title_template,
                    git_pr_description_template: gitSettings.pr_description_template,
                    git_auto_delete_branch: gitSettings.auto_delete_branch,
                }),
            });

            if (response.ok) {
                toast.showSuccess(t.projectsettingspanel639);
            } else {
                const data = await response.json();
                toast.showError(data.error || t.projectsettingspanel642);
            }
        } catch (error) {
            console.error(t.projectsettingspanel645, error);
            toast.showError(t.projectsettingspanel646);
        }
    };

    const removeGitIntegration = async () => {
        if (!selectedProject) return;

        if (!window.confirm(t.projectsettingspanel653)) {
            return;
        }

        try {
            const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
            if (!token) return;

            const response = await fetch(`/api/projects/${selectedProject.id}/git-settings`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                },
            });

            if (response.ok) {
                setGitSettings({
                    provider_id: null,
                    provider: null,
                    provider_username: null,
                    repository: null,
                    default_branch: null,
                    main_branch: null,
                    target_directory: null,
                    workflow: 'push_only',
                    pr_title_template: null,
                    pr_description_template: null,
                    auto_delete_branch: true,
                    is_configured: false,
                });
                setGitRepositories([]);
                setGitBranches([]);
                toast.showSuccess(t.projectsettingspanel686);
            } else {
                toast.showError(t.projectsettingspanel688);
            }
        } catch (error) {
            console.error(t.projectsettingspanel691, error);
            toast.showError(t.projectsettingspanel692);
        }
    };

    const loadProjectMembers = useCallback(async () => {
        if (!selectedProject) return;

        try {
            const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token') || sessionStorage.getItem('access_token');
            if (!token) return;

            const response = await fetch(`/api/projects/${selectedProject.id}/members`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                },
            });

            if (response.ok) {
                const data = await response.json();
                setProjectMembers(data || []);
            }
        } catch {
            // Error loading project members
        }
    }, [selectedProject]);

    const loadTemplateVariables = useCallback(async () => {
        if (!selectedProject) return;

        setLoadingVariables(true);
        try {
            const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token') || sessionStorage.getItem('access_token');
            if (!token) return;

            // Load all templates (or could be filtered by templates used in project)
            const templatesResponse = await fetch('/api/templates', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                },
            });

            if (!templatesResponse.ok) return;

            const templatesData = await templatesResponse.json();
            const templates = templatesData.templates || [];

            // Load variables for each template
            const templatesWithVars: TemplateWithVariables[] = [];

            for (const template of templates) {
                const varsResponse = await fetch(`/api/templates/${template.id}/variables`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/json',
                    },
                });

                if (varsResponse.ok) {
                    const varsData = await varsResponse.json();
                    const variables = varsData.variables || [];

                    // Only include templates that have variables
                    if (variables.length > 0) {
                        templatesWithVars.push({
                            id: template.id,
                            name: template.name,
                            description: template.description,
                            variables: variables,
                        });
                    }
                }
            }

            setTemplatesWithVariables(templatesWithVars);

            // Load current project values for all variables
            const valuesMap: Record<string, Record<string, string>> = {};

            for (const template of templatesWithVars) {
                const valuesResponse = await fetch(
                    `/api/projects/${selectedProject.id}/templates/${template.id}/variable-values`,
                    {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Accept': 'application/json',
                        },
                    }
                );

                if (valuesResponse.ok) {
                    const valuesData = await valuesResponse.json();
                    const variables = valuesData.variables || [];

                    // Build map: variable_name -> { language -> value }
                    for (const variable of variables) {
                        const key = `${template.id}_${variable.variable_name}`;
                        valuesMap[key] = {};

                        // variable.values is an object keyed by language
                        if (variable.values) {
                            for (const [language, valueObj] of Object.entries(variable.values)) {
                                valuesMap[key][language] = (valueObj as any).value || '';
                            }
                        }
                    }
                }
            }

            setVariableValues(valuesMap);
        } catch (error) {
            console.error(t.projectsettingspanel804, error);
            toast.showError(t.projectsettingspanel805);
        } finally {
            setLoadingVariables(false);
        }
    }, [selectedProject, toast]);

    const loadTranslations = useCallback(async () => {
        if (!selectedProject) return;
        try {
            const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
            if (!token) return;
            const response = await fetch(`/api/projects/${selectedProject.id}/translations`, {
                headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
            });
            if (response.ok) {
                const data = await response.json();
                setTranslations(data);
                // Set default selected language only on first load
                setSelectedTransLang(prev => prev || selectedProject.default_language || 'en');
            }
        } catch { /* ignore */ }
    }, [selectedProject]);

    const saveTranslation = useCallback(async (langCode: string, data: any) => {
        if (!selectedProject) return;
        setSavingTranslation(true);
        try {
            const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
            if (!token) return;
            const response = await fetch(`/api/projects/${selectedProject.id}/translations`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json', 'Content-Type': 'application/json' },
                body: JSON.stringify({ language_code: langCode, ...data }),
            });
            if (response.ok) {
                const result = await response.json();
                setTranslations(prev => ({ ...prev, [langCode]: result.translation }));
                toast.showSuccess(t.msgSaved || 'Saved successfully');
            } else {
                toast.showError(t.msgSaveError || 'Failed to save');
            }
        } catch {
            toast.showError(t.msgSaveError || 'Failed to save');
        } finally {
            setSavingTranslation(false);
        }
    }, [selectedProject, toast, t]);

    useEffect(() => {
        loadLanguages();
        if (selectedProject) {
            loadProjectData();
            loadProjectMembers();
            loadTemplateVariables();
            loadLinkedTemplates();
            loadGitSettings();
            loadFtpSettings();
            loadTranslations();
        }
    }, [selectedProject, loadProjectData, loadProjectMembers, loadLanguages, loadTemplateVariables, loadLinkedTemplates, loadGitSettings, loadFtpSettings, loadTranslations]);

    // Map of backend field name → tab index where that input lives. When a
    // validation error comes back (or a client-side check fires), we use this
    // to jump the user straight to the offending tab. Keep in sync with the
    // TabView order below (Common, Characteristics, Database, ...).
    const fieldToTab: Record<string, number> = {
        // Tab 0 — Common
        name: 0,
        join_code: 0,
        is_public: 0,
        new_owner_id: 0,
        description: 0,
        // Tab 2 — Database
        database_name: 2,
        database_type: 2,
        database_server: 2,
        database_port: 2,
        database_username: 2,
        database_password: 2,
        // Tab 3 — Diagram Settings
        diagram_max_tables_per_row: 3,
        diagram_table_width: 3,
        diagram_table_height: 3,
        diagram_horizontal_spacing: 3,
        diagram_vertical_spacing: 3,
        // Tab 4 — Forms & Reports
        form_designer_snap_to_grid: 4,
        form_designer_grid_size: 4,
        report_designer_snap_to_grid: 4,
        report_designer_grid_unit: 4,
        report_designer_grid_size: 4,
        // Tab 5 — Languages (default_language lives here)
        default_language: 5,
        target_language: 5,
        // Tab 7 — Code
        project_directory: 7,
        project_url: 7,
        start_page: 7,
        archive_format: 7,
        filename_short_length: 7,
        google_translate_api_key: 7,
        // Tab 10 — Git/GitHub
        git_provider_id: 10,
        git_repository: 10,
        git_default_branch: 10,
        git_main_branch: 10,
        git_target_directory: 10,
        git_workflow: 10,
        git_pr_title_template: 10,
        git_pr_description_template: 10,
        git_auto_delete_branch: 10,
    };

    // Apply a validation failure: select the correct tab, mark the field red
    // (picked up via the `invalidClass()` helper on each input), and show a
    // meaningful toast message instead of the previous generic text.
    const applyValidationError = (field: string, message: string) => {
        setInvalidFields(new Set([field]));
        const tab = fieldToTab[field];
        if (typeof tab === 'number') {
            setActiveTabIndex(tab);
        }
        toast.showError(message);
    };

    const handleSave = async () => {
        if (!selectedProject) {
            toast.showError(t.databaseexportmodal344);
            return;
        }

        // ---- Client-side pre-validation ----
        // Only the most common "obvious" case: an empty project name. The
        // backend catches everything else via its validation rules, and we
        // surface those errors field-by-field below. Doing a full duplicate
        // of Laravel's rules client-side would drift from the server over
        // time and cause inconsistent behaviour.
        if (!formData.name || !formData.name.trim()) {
            applyValidationError(
                'name',
                (t as unknown as Record<string, string>).projectsettings_err_name_required
                    || 'Project name is required.',
            );
            return;
        }

        // Confirm ownership transfer if requested
        if (formData.new_owner_id) {
            const newOwner = projectMembers.find(m => Number(m.user_id) === Number(formData.new_owner_id));
            if (newOwner) {
                const confirmed = window.confirm(
                    `${t.projectsettingspanel834}${newOwner.user.name} (${newOwner.user.email}){t.projectsettingspanel834_2}\n\n${t.projectsettingspanel834_3}`
                );
                if (!confirmed) return;
            }
        }

        setSaving(true);
        // Clear any stale validation marks from previous attempts.
        setInvalidFields(new Set());
        try {
            const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token') || sessionStorage.getItem('access_token');
            if (!token) {
                toast.showError(t.applicationsmodal66);
                return;
            }

            // Save project data
            const projectResponse = await fetch(`/api/projects/${selectedProject.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (!projectResponse.ok) {
                // Try to pick out Laravel's 422 validation payload so we can
                // show the exact field + message and jump to the right tab.
                // Shape: { message: string, errors: { field: [msg, ...] } }
                if (projectResponse.status === 422) {
                    try {
                        const errBody = await projectResponse.json();
                        const errors = (errBody?.errors || {}) as Record<string, string[]>;
                        const firstField = Object.keys(errors)[0];
                        if (firstField) {
                            const firstMsg = errors[firstField]?.[0] || errBody?.message || t.editprojectmodal183;
                            applyValidationError(firstField, firstMsg);
                            return; // handled — don't fall through to generic error
                        }
                        if (errBody?.message) {
                            toast.showError(errBody.message);
                            return;
                        }
                    } catch { /* fall through to generic */ }
                }
                throw new Error(t.editprojectmodal183);
            }

            // Save language settings
            const settingsResponse = await fetch(`/api/projects/${selectedProject.id}/settings`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                },
                body: JSON.stringify({
                    enabled_languages: selectedLanguages,
                    default_language: formData.default_language,
                    protected_files: projectProtectedFiles,
                    install_script: projectInstallScript,
                    update_script: projectUpdateScript,
                }),
            });

            if (!settingsResponse.ok) {
                // Same treatment as the main project save: if Laravel gave us
                // a 422 validation payload, show the specific field message
                // and jump to the tab where that input lives.
                if (settingsResponse.status === 422) {
                    try {
                        const errBody = await settingsResponse.json();
                        const errors = (errBody?.errors || {}) as Record<string, string[]>;
                        const firstField = Object.keys(errors)[0];
                        if (firstField) {
                            const firstMsg = errors[firstField]?.[0] || errBody?.message || t.projectsettingspanel243;
                            applyValidationError(firstField, firstMsg);
                            return;
                        }
                        if (errBody?.message) {
                            toast.showError(errBody.message);
                            return;
                        }
                    } catch { /* fall through to generic */ }
                }
                throw new Error(t.projectsettingspanel243);
            }

            // ✅ Also save template variables — but do not let a failure here
            // (e.g. unfilled required variables) abort the whole save. Project
            // and language settings are already persisted at this point; a
            // variable-save issue should be surfaced as a warning instead.
            let variableSaveWarning: string | null = null;
            try {
                await saveTemplateVariablesInternal(token);
            } catch (varError) {
                variableSaveWarning = varError instanceof Error ? varError.message : String(varError);
            }

            // ✅ Also save all project translations
            for (const langCode of Object.keys(translations)) {
                const data = translations[langCode];
                if (data && langCode) {
                    const { _visited, id: _id, project_id: _project_id, created_at: _created_at, updated_at: _updated_at, ...cleanData } = data;
                    await fetch(`/api/projects/${selectedProject.id}/translations`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
                        body: JSON.stringify({ language_code: langCode, ...cleanData }),
                    });
                }
            }

            // Success message includes template variables if they exist
            const hasTemplateVars = templatesWithVariables.length > 0;
            const successMsg = hasTemplateVars
                ? t.projectsettingspanel890
                : t.projectsettingspanel246;
            toast.showSuccess(successMsg);

            // Surface any variable-save warning after the success toast so the
            // user knows their project was saved but variable values weren't.
            if (variableSaveWarning) {
                toast.showWarn(variableSaveWarning);
            }

            // Refresh projects to update the UI
            loadProjects();
        } catch (error) {
            toast.showError(error instanceof Error ? error.message : t.projectsettingspanel251);
        } finally {
            setSaving(false);
        }
    };

    const generateJoinCode = () => {
        const code = 'PROJ-' + Math.random().toString(36).substring(2, 10).toUpperCase();
        setFormData({ ...formData, join_code: code });
    };

    // Internal function to save template variables (called by both save buttons)
    const saveTemplateVariablesInternal = async (token: string) => {
        if (!selectedProject || templatesWithVariables.length === 0) {
            return; // Nothing to save
        }

        // Build bulk update payload for each template
        for (const template of templatesWithVariables) {
            const valuesToSave: Array<{
                variable_name: string;
                language: string;
                value: string;
            }> = [];

            // Get all active languages
            const activeLangs = availableLanguages.filter(lang => lang.is_active);

            for (const variable of template.variables) {
                const key = `${template.id}_${variable.variable_name}`;

                for (const lang of activeLangs) {
                    const value = variableValues[key]?.[lang.code] || '';

                    // Only save non-empty values (trimmed)
                    if (value.trim() !== '') {
                        valuesToSave.push({
                            variable_name: variable.variable_name,
                            language: lang.code,
                            value: value.trim(),
                        });
                    }
                }
            }

            // Safety: if nothing to save, skip the API call. The backend
            // accepts empty arrays (meaning "clear all") — but sending one
            // when state hasn't fully loaded would silently wipe the user's
            // existing values in DB. No filled fields means no intent to
            // change variables on this save.
            if (valuesToSave.length === 0) {
                continue;
            }

            // Bulk update via API (backend deletes all then inserts non-empty)
            // This ensures cleared/empty variables are properly deleted from DB
            const response = await fetch(
                `/api/projects/${selectedProject.id}/templates/${template.id}/variable-values/bulk`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/json',
                    },
                    body: JSON.stringify({ values: valuesToSave }),
                }
            );

            if (!response.ok) {
                throw new Error(`${t.projectsettingspanel958}"${template.name}"`);
            }
        }
    };

    // Future use: Save template variables
    const _handleSaveTemplateVariables = async () => {
        if (!selectedProject) {
            toast.showError(t.projectsettingspanel967);
            return;
        }

        setSavingVariables(true);
        try {
            const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token') || sessionStorage.getItem('access_token');
            if (!token) {
                toast.showError(t.projectsettingspanel975);
                setSavingVariables(false);
                return;
            }

            await saveTemplateVariablesInternal(token);

            toast.showSuccess(t.projectsettingspanel982);
        } catch (error) {
            console.error(t.projectsettingspanel984, error);
            toast.showError(error instanceof Error ? error.message : t.projectsettingspanel985);
        } finally {
            setSavingVariables(false);
        }
    };

    const handleVariableValueChange = (templateId: number, variableName: string, language: string, value: string) => {
        const key = `${templateId}_${variableName}`;
        setVariableValues(prev => ({
            ...prev,
            [key]: {
                ...(prev[key] || {}),
                [language]: value,
            },
        }));
    };

    const transferData = availableLanguages
        .filter(lang => lang.is_active)
        .map(lang => ({
            key: lang.code,
            title: `${lang.native_name} (${lang.name})`,
            description: lang.code.toUpperCase(),
        }));

    if (!selectedProject) {
        return (
            <div className="h-full flex items-center justify-center theme-bg-secondary theme-text-secondary">
                <div className="text-center">
                    <i className="pi pi-info-circle text-4xl mb-4"></i>
                    <p>{t.projectsettingspanel1015}</p>
                    <p className="text-sm mt-2">selectedProject is null</p>
                    <p className="text-xs mt-2 text-yellow-400">{t.projectsettingspanel1017}</p>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center theme-bg-secondary">
                <ProgressSpinner />
            </div>
        );
    }

    return (
        <div
            className="h-full flex flex-col p-6 overflow-auto project-settings-panel"
            style={{ backgroundColor: colors.bgSecondary, color: colors.textPrimary }}
        >
            <div className="mb-6 flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold" style={{ color: colors.textPrimary }}>
                        {t.newnavigationpanel142}
                    </h2>
                    <p className="mt-2" style={{ color: colors.textMuted }}>
                        {t.projectsettingspanel1042}<span className="font-semibold" style={{ color: colors.textSecondary }}>{selectedProject.name}</span>
                    </p>
                </div>
                <Button
                    icon="pi pi-save"
                    label={t.projectsettingspanel304}
                    onClick={handleSave}
                    loading={saving}
                    severity="success"
                    size="large"
                />
            </div>

            <TabView
                className="flex-1 tabview-wrap-tabs"
                activeIndex={activeTabIndex}
                onTabChange={(e) => setActiveTabIndex(e.index)}
            >
                <TabPanel header={<span><i className="pi pi-cog mr-2"></i>{t.projectsettingspanel313}</span>}>
                            <div className="space-y-4 max-w-3xl">
                                <div>
                                    <label className="block text-sm font-medium mb-2 theme-text-secondary">
                                        {t.projectsettingspanel316}
                                    </label>
                                    <InputText
                                        value={formData.name}
                                        onChange={(e) => {
                                            setFormData({ ...formData, name: e.target.value });
                                            clearFieldError('name');
                                        }}
                                        placeholder={t.editprojectmodal240}
                                        className={`w-full font-mono ${invalidClass('name')}`}
                                        style={{ backgroundColor: colors.bgTertiary, color: colors.textPrimary, borderColor: colors.borderPrimary }}
                                    />
                                    <div className="text-xs mt-1" style={{ color: colors.textMuted }}>
                                        {t.editprojectmodal569}
                                    </div>
                                </div>

                                {/* Caption + Description from project_translations */}
                                {(() => {
                                    const lang = formData.default_language || 'en';
                                    const trans = translations[lang] || {};
                                    const getF = (f: string) => trans[f] ?? '';
                                    const setF = (f: string, v: string) => {
                                        setTranslations(prev => ({
                                            ...prev,
                                            [lang]: { ...(prev[lang] || {}), language_code: lang, [f]: v }
                                        }));
                                    };
                                    return (<>
                                        <div>
                                            <label className="block text-sm font-medium mb-2 theme-text-secondary">
                                                {t.projectsettingspanel_caption || 'Project Caption'}
                                            </label>
                                            <InputText value={getF('caption')} onChange={(e) => setF('caption', e.target.value)} className="w-full" />
                                            <div className="text-xs mt-1" style={{ color: colors.textMuted }}>
                                                {t.projectsettingspanel_caption_allgemein || 'Display name for the project (from translations, current default language)'}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-2 theme-text-secondary">
                                                {t.projectsettingspanel331}
                                            </label>
                                            <InputTextarea value={getF('description')} onChange={(e) => setF('description', e.target.value)} rows={3} placeholder={t.editprojectmodal260} className="w-full" />
                                            <div className="text-xs mt-1" style={{ color: colors.textMuted }}>
                                                {t.projectsettingspanel_desc_allgemein || 'Project description (from translations, current default language)'}
                                            </div>
                                        </div>
                                    </>);
                                })()}

                                <div>
                                    <label className="block text-sm font-medium mb-2 theme-text-secondary">
                                        {t.projectsettingspanel344}
                                    </label>
                                    <div className="p-inputgroup">
                                        <InputText
                                            value={formData.join_code}
                                            onChange={(e) => setFormData({ ...formData, join_code: e.target.value })}
                                            placeholder={t.projectsettingspanel351}
                                        />
                                        <Button
                                            icon="pi pi-refresh"
                                            onClick={generateJoinCode}
                                            severity="secondary"
                                        />
                                    </div>
                                    <div className="text-xs mt-1">
                                        {t.projectsettingspanel359}
                                    </div>
                                </div>

                                <div>
                                    <div className="flex align-items-center">
                                        <Checkbox
                                            inputId="is_public"
                                            checked={formData.is_public}
                                            onChange={(e) => setFormData({ ...formData, is_public: e.checked || false })}
                                        />
                                        <label htmlFor="is_public" className="ml-2 theme-text-secondary">
                                            {t.publicprojectspanel448}
                                        </label>
                                    </div>
                                    <div className="text-xs mt-1 ml-6">
                                        {t.projectsettingspanel375}
                                    </div>
                                </div>

                                {selectedProject.is_owner && projectMembers.length > 0 && (
                                    <div>
                                        <label className="block text-sm font-medium mb-2 theme-text-secondary">
                                            {t.projectsettingspanel382}
                                        </label>
                                        <Dropdown
                                            value={formData.new_owner_id || null}
                                            onChange={(e) => setFormData({ ...formData, new_owner_id: e.value })}
                                            options={projectMembers
                                                .filter(m => Number(m.user_id) !== Number(selectedProject.owner.id))
                                                .map(member => ({
                                                    label: `${t.projectsettingspanel1135}${member.user.name} (${member.user.email}) - ${member.role}`,
                                                    value: member.user_id
                                                }))}
                                            placeholder={`${t.projectsettingspanel639}: ${selectedProject.owner.name}`}
                                            className="w-full"
                                            showClear
                                        />
                                        <div className="mt-3 p-3 rounded text-sm" style={{ backgroundColor: colors.warningBg, border: `1px solid ${colors.warningBorder}`, color: colors.warningText }}>
                                            {t.projectsettingspanel644}
                                        </div>
                                    </div>
                                )}
                            </div>
                </TabPanel>

                <TabPanel header={<span><i className="pi pi-file mr-2"></i>{t.projectsettingspanel489}</span>}>
                            <div className="space-y-4 max-w-3xl">
                                <div>
                                    <label className="block text-sm font-medium mb-2 theme-text-secondary">
                                        {t.projectsettingspanel492}
                                    </label>
                                    <InputText
                                        value={formData.project_directory}
                                        onChange={(e) => setFormData({ ...formData, project_directory: e.target.value })}
                                        placeholder="C:\Users\Public\Documents\my_project"
                                        className="w-full"
                                    />
                                    <div className="text-xs mt-1">
                                        {t.projectsettingspanel501}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2 theme-text-secondary">
                                        {t.projectsettingspanel507}
                                    </label>
                                    <InputText
                                        value={formData.project_url}
                                        onChange={(e) => setFormData({ ...formData, project_url: e.target.value })}
                                        placeholder="http://localhost/my_project"
                                        className="w-full"
                                    />
                                    <div className="text-xs mt-1">
                                        {t.projectsettingspanel516}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2 theme-text-secondary">
                                        {t.projectsettingspanel522}
                                    </label>
                                    <InputText
                                        value={formData.start_page}
                                        onChange={(e) => setFormData({ ...formData, start_page: e.target.value })}
                                        placeholder="index.php"
                                        className="w-full"
                                    />
                                    <div className="text-xs mt-1">
                                        {t.projectsettingspanel866}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2 theme-text-secondary">
                                        {t.projectsettingspanel872}
                                    </label>
                                    <Dropdown
                                        value={formData.default_language}
                                        onChange={(e) => setFormData({ ...formData, default_language: e.value })}
                                        options={availableLanguages.map(lang => ({
                                            label: lang.native_name || lang.name,
                                            value: lang.code
                                        }))}
                                        className="w-full"
                                    />
                                    <div className="text-xs mt-1">
                                        {t.projectsettingspanel552}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2 theme-text-secondary">
                                        {t.projectsettingspanel893}
                                    </label>
                                    <Dropdown
                                        value={formData.archive_format}
                                        onChange={(e) => setFormData({ ...formData, archive_format: e.value })}
                                        options={[
                                            { label: t.projectsettingspanel1433, value: 'zip' },
                                            { label: t.projectsettingspanel1434, value: 'tar.gz' },
                                            { label: t.projectsettingspanel1435, value: 'tar.xz' }
                                        ]}
                                        className="w-full"
                                    />
                                    <div className="text-xs mt-1">
                                        {t.projectsettingspanel906}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2 theme-text-secondary">
                                        Target Programming Language
                                    </label>
                                    <Dropdown
                                        value={formData.target_language || 'html'}
                                        onChange={(e) => setFormData({ ...formData, target_language: e.value })}
                                        options={[
                                            { label: 'HTML (pattern attribute)', value: 'html' },
                                            { label: 'React / PrimeReact InputMask', value: 'react_primereact' },
                                            { label: 'React / react-imask', value: 'react_imask' },
                                            { label: 'Vue.js / Maska', value: 'vue_maska' },
                                            { label: 'Vue.js / PrimeVue InputMask', value: 'vue_primevue' },
                                            { label: 'Vue.js / Vuetify', value: 'vue_vuetify' },
                                            { label: 'Vue.js / Quasar', value: 'vue_quasar' },
                                            { label: 'Angular / ngx-mask', value: 'angular_ngxmask' },
                                            { label: 'Angular / imaskjs', value: 'angular_imask' },
                                            { label: 'jQuery Mask Plugin', value: 'jquery_mask' },
                                            { label: 'Vanilla JavaScript', value: 'vanilla_js' },
                                        ]}
                                        className="w-full"
                                    />
                                    <div className="text-xs mt-1" style={{ color: colors.textMuted }}>
                                        Defines the edit mask syntax for input fields in the database schema editor.
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2 theme-text-secondary">
                                        {t.projectsettingspanel558}
                                    </label>
                                    <Dropdown
                                        value={formData.filename_short_length}
                                        onChange={(e) => setFormData({ ...formData, filename_short_length: e.value })}
                                        options={[
                                            { label: t.editprojectmodal506, value: 2 },
                                            { label: t.editprojectmodal507, value: 3 },
                                            { label: t.editprojectmodal508, value: 4 },
                                            { label: t.editprojectmodal509, value: 5 }
                                        ]}
                                        className="w-full"
                                    />
                                    <div className="text-xs mt-1">
                                        {t.projectsettingspanel926}
                                    </div>
                                </div>

                                {/* Google Translate API Key */}
                                <div>
                                    <label className="block text-sm font-medium mb-2 theme-text-secondary">
                                        {t.projectsettingspanel689}
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.google_translate_api_key || ''}
                                        onChange={(e) => setFormData({ ...formData, google_translate_api_key: e.target.value })}
                                        placeholder="AIzaSy..."
                                        className="w-full font-mono rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        style={{ backgroundColor: colors.bgTertiary, border: `1px solid ${colors.borderPrimary}`, color: colors.textPrimary }}
                                    />
                                    <div className="text-xs mt-1">
                                        {t.projectsettingspanel700}
                                    </div>
                                    <div className="text-xs text-blue-400 mt-1">
                                        🔗 <a href="https://cloud.google.com/translate/docs/setup" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-300">
                                            {t.projectsettingspanel1058}
                                        </a>
                                    </div>
                                </div>
                            </div>
                </TabPanel>

                <TabPanel header={<span><i className="pi pi-database mr-2"></i>{t.projectsettingspanel405}</span>}>
                            <div className="space-y-4 max-w-3xl">
                                <div>
                                    <label className="block text-sm font-medium mb-2 theme-text-secondary">
                                        {t.projectsettingspanel408}
                                    </label>
                                    <InputText
                                        value={formData.database_name}
                                        onChange={(e) => setFormData({ ...formData, database_name: e.target.value })}
                                        placeholder="project_database"
                                        className="w-full"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2 theme-text-secondary">
                                        {t.projectsettingspanel420}
                                    </label>
                                    <Dropdown
                                        value={formData.database_type}
                                        onChange={(e) => setFormData({ ...formData, database_type: e.value })}
                                        options={[
                                            { label: 'MySQL', value: 'MySQL' },
                                            { label: 'PostgreSQL', value: 'PostgreSQL' },
                                            { label: 'SQLite', value: 'SQLite' },
                                            { label: 'SQL Server', value: 'MSSQL' },
                                            { label: 'Firebird', value: 'Firebird' }
                                        ]}
                                        className="w-full"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-2 theme-text-secondary">
                                            {t.projectsettingspanel1183}
                                        </label>
                                        <InputText
                                            value={formData.database_server}
                                            onChange={(e) => setFormData({ ...formData, database_server: e.target.value })}
                                            placeholder="127.0.0.1"
                                            className="w-full"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-2 theme-text-secondary">
                                            {t.projectsettingspanel1195}
                                        </label>
                                        <InputText
                                            value={formData.database_port}
                                            onChange={(e) => setFormData({ ...formData, database_port: e.target.value })}
                                            placeholder="3306"
                                            className="w-full"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2 theme-text-secondary">
                                        {t.projectsettingspanel463}
                                    </label>
                                    <InputText
                                        value={formData.database_username}
                                        onChange={(e) => setFormData({ ...formData, database_username: e.target.value })}
                                        placeholder="database_user"
                                        className="w-full"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2 theme-text-secondary">
                                        {t.projectsettingspanel475}
                                    </label>
                                    <PrimePassword
                                        value={formData.database_password}
                                        onChange={(e) => setFormData({ ...formData, database_password: e.target.value })}
                                        placeholder="database_password"
                                        className="w-full"
                                        feedback={false}
                                        toggleMask
                                    />
                                </div>
                            </div>
                </TabPanel>
                <TabPanel header={<span><i className="pi pi-sitemap mr-2"></i>{t.projectsettingspanel734}</span>}>
                            <div className="space-y-4 max-w-3xl">
                                <div className="mb-4 p-3 rounded text-sm"  style={{ backgroundColor: colors.infoBg, border: `1px solid ${colors.infoBorder}`, color: colors.infoText }}>
                                    <i className="pi pi-info-circle mr-2"></i>
                                    {t.projectsettingspanel738}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-2 theme-text-secondary">
                                            {t.projectsettingspanel744}
                                        </label>
                                        <InputText
                                            type="number"
                                            value={formData.diagram_max_tables_per_row.toString()}
                                            onChange={(e) => setFormData({ ...formData, diagram_max_tables_per_row: parseInt(e.target.value) || 20 })}
                                            placeholder="20"
                                            className="w-full"
                                        />
                                        <small className="theme-text-muted">{t.projectsettingspanel753}</small>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-2 theme-text-secondary">
                                            {t.projectsettingspanel758}
                                        </label>
                                        <InputText
                                            type="number"
                                            value={formData.diagram_table_width.toString()}
                                            onChange={(e) => setFormData({ ...formData, diagram_table_width: parseInt(e.target.value) || 280 })}
                                            placeholder="280"
                                            className="w-full"
                                        />
                                        <small className="theme-text-muted">{t.projectsettingspanel767}</small>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-2 theme-text-secondary">
                                            {t.projectsettingspanel772}
                                        </label>
                                        <InputText
                                            type="number"
                                            value={formData.diagram_table_height.toString()}
                                            onChange={(e) => setFormData({ ...formData, diagram_table_height: parseInt(e.target.value) || 450 })}
                                            placeholder="450"
                                            className="w-full"
                                        />
                                        <small className="theme-text-muted">{t.projectsettingspanel781}</small>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-2 theme-text-secondary">
                                            {t.projectsettingspanel786}
                                        </label>
                                        <InputText
                                            type="number"
                                            value={formData.diagram_horizontal_spacing.toString()}
                                            onChange={(e) => setFormData({ ...formData, diagram_horizontal_spacing: parseInt(e.target.value) || 600 })}
                                            placeholder="600"
                                            className="w-full"
                                        />
                                        <small className="theme-text-muted">{t.projectsettingspanel795}</small>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-2 theme-text-secondary">
                                            {t.projectsettingspanel800}
                                        </label>
                                        <InputText
                                            type="number"
                                            value={formData.diagram_vertical_spacing.toString()}
                                            onChange={(e) => setFormData({ ...formData, diagram_vertical_spacing: parseInt(e.target.value) || 700 })}
                                            placeholder="700"
                                            className="w-full"
                                        />
                                        <small className="theme-text-muted">{t.projectsettingspanel809}</small>
                                    </div>
                                </div>

                                <div className="mt-6 p-4 theme-bg-tertiary rounded">
                                    <h4 className="font-semibold mb-2 theme-text-primary">{t.projectsettingspanel814}</h4>
                                    <div className="text-sm theme-text-secondary space-y-1">
                                        <div>• {t.projectsettingspanel816} <span className="text-blue-400">{formData.diagram_max_tables_per_row}</span></div>
                                        <div>• {t.projectsettingspanel817} <span className="text-blue-400">{formData.diagram_table_width}px × {formData.diagram_table_height}px</span></div>
                                        <div>• {t.projectsettingspanel818} <span className="text-blue-400">{formData.diagram_horizontal_spacing}px {t.projectsettingspanel818a}, {formData.diagram_vertical_spacing}px {t.projectsettingspanel818b}</span></div>
                                    </div>
                                </div>
                            </div>
                </TabPanel>

                {/* Forms & Reports Tab — defaults + designer settings */}
                <TabPanel header={<span><i className="pi pi-bookmark mr-2"></i>{(t as unknown as Record<string, string>).projectsettings_forms_reports || 'Forms & Reports'}</span>}>
                    <div className="space-y-6 max-w-3xl p-4">
                        <div className="mb-2 p-3 rounded text-sm" style={{ backgroundColor: colors.infoBg, border: `1px solid ${colors.infoBorder}`, color: colors.infoText }}>
                            <i className="pi pi-info-circle mr-2"></i>
                            {(t as unknown as Record<string, string>).projectsettings_defaults_intro
                              || 'Pick the default Form Set and Report Pattern for tables that do not specify their own. Without a default, the code generator will not produce forms / reports for those tables.'}
                        </div>

                        {/* Default Form Set
                            Uses a sentinel value (-1) for "No default" instead of null:
                            PrimeReact's <Dropdown> does not reliably fire onChange when
                            the selected option carries value: null (the library treats
                            it the same as "no value" which is the initial state, so
                            selecting it after a real FormSet was chosen looks like a
                            no-op). A numeric sentinel sidesteps the issue cleanly; we
                            translate it back to null at save time. */}
                        <div>
                            <label className="block text-sm font-medium mb-2 theme-text-secondary">
                                {(t as unknown as Record<string, string>).projectsettings_default_form_set || 'Default Form Set'}
                            </label>
                            <Dropdown
                                value={defaultFormSetId ?? -1}
                                options={[
                                    { label: '— ' + ((t as unknown as Record<string, string>).projectsettings_no_default || 'No default') + ' —', value: -1 },
                                    ...availableFormSets.map(fs => ({ label: fs.name, value: fs.id })),
                                ]}
                                onChange={(e) => saveDefaultFormSet(e.value === -1 ? null : e.value)}
                                placeholder="—"
                                className="w-full"
                            />
                            <p className="text-xs theme-text-muted mt-1">
                                {(t as unknown as Record<string, string>).projectsettings_default_form_set_hint
                                  || 'Used by tables without their own form set selection.'}
                            </p>
                        </div>

                        {/* Form Designer Settings */}
                        <div className="pt-4 border-t theme-border-secondary">
                            <h4 className="text-md font-semibold theme-text-primary mb-4">
                                <i className="pi pi-window-maximize mr-2"></i>
                                {t.projectsettingspanel1316}
                            </h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex items-center gap-3">
                                    <Checkbox
                                        inputId="form_designer_snap"
                                        checked={formData.form_designer_snap_to_grid}
                                        onChange={(e) => setFormData({ ...formData, form_designer_snap_to_grid: e.checked ?? true })}
                                    />
                                    <label htmlFor="form_designer_snap" className="text-sm theme-text-secondary cursor-pointer">
                                        {t.projectsettingspanel1326}
                                    </label>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2 theme-text-secondary">
                                        {t.projectsettingspanel1331}
                                    </label>
                                    <InputText
                                        type="number"
                                        value={formData.form_designer_grid_size.toString()}
                                        onChange={(e) => setFormData({ ...formData, form_designer_grid_size: parseInt(e.target.value) || 20 })}
                                        placeholder="20"
                                        className="w-full"
                                        min={5}
                                        max={100}
                                    />
                                </div>
                            </div>
                            <small className="theme-text-muted block mt-2">{t.projectsettingspanel1342}</small>
                        </div>

                        {/* Default Report Pattern — same sentinel-value pattern as Default Form Set above */}
                        <div className="pt-4 border-t theme-border-secondary">
                            <label className="block text-sm font-medium mb-2 theme-text-secondary">
                                {(t as unknown as Record<string, string>).projectsettings_default_report_pattern || 'Default Report Pattern'}
                            </label>
                            <Dropdown
                                value={defaultReportPatternId ?? -1}
                                options={[
                                    { label: '— ' + ((t as unknown as Record<string, string>).projectsettings_no_default || 'No default') + ' —', value: -1 },
                                    ...availableReportPatterns.map(rp => ({ label: rp.name, value: rp.id })),
                                ]}
                                onChange={(e) => saveDefaultReportPattern(e.value === -1 ? null : e.value)}
                                placeholder="—"
                                className="w-full"
                            />
                            <p className="text-xs theme-text-muted mt-1">
                                {(t as unknown as Record<string, string>).projectsettings_default_report_pattern_hint
                                  || 'Used by tables without their own report pattern selection.'}
                            </p>
                        </div>

                        {/* Report Designer Settings */}
                        <div className="pt-4 border-t theme-border-secondary">
                            <h4 className="text-md font-semibold theme-text-primary mb-4">
                                <i className="pi pi-print mr-2"></i>
                                {t.projectsettingspanel_report_designer || 'Report Designer Settings'}
                            </h4>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="flex items-center gap-3">
                                    <Checkbox
                                        inputId="report_designer_snap"
                                        checked={formData.report_designer_snap_to_grid}
                                        onChange={(e) => setFormData({ ...formData, report_designer_snap_to_grid: e.checked ?? true })}
                                    />
                                    <label htmlFor="report_designer_snap" className="text-sm theme-text-secondary cursor-pointer">
                                        {t.projectsettingspanel_report_snap || 'Snap to Grid'}
                                    </label>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2 theme-text-secondary">
                                        {t.projectsettingspanel_report_unit || 'Unit'}
                                    </label>
                                    <Dropdown
                                        value={formData.report_designer_grid_unit}
                                        options={[
                                            { label: 'Millimeter (mm)', value: 'mm' },
                                            { label: 'Inch (in)', value: 'inch' },
                                        ]}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            report_designer_grid_unit: e.value,
                                            report_designer_grid_size: e.value === 'inch' ? 0.25 : 5,
                                        })}
                                        className="w-full"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2 theme-text-secondary">
                                        {t.projectsettingspanel_report_gridsize || 'Grid Size'}
                                    </label>
                                    <InputNumber
                                        value={formData.report_designer_grid_size}
                                        onValueChange={(e) => setFormData({ ...formData, report_designer_grid_size: e.value ?? 5 })}
                                        mode="decimal"
                                        minFractionDigits={formData.report_designer_grid_unit === 'inch' ? 2 : 1}
                                        maxFractionDigits={formData.report_designer_grid_unit === 'inch' ? 4 : 2}
                                        min={0.1}
                                        max={100}
                                        step={formData.report_designer_grid_unit === 'inch' ? 0.0625 : 0.5}
                                        suffix={formData.report_designer_grid_unit === 'inch' ? ' in' : ' mm'}
                                        className="w-full"
                                        showButtons
                                        buttonLayout="horizontal"
                                        incrementButtonIcon="pi pi-plus"
                                        decrementButtonIcon="pi pi-minus"
                                        incrementButtonClassName="p-button-secondary"
                                        decrementButtonClassName="p-button-secondary"
                                    />
                                </div>
                            </div>
                            <small className="theme-text-muted block mt-2">
                                {formData.report_designer_grid_unit === 'inch' ? 'z.B. 0.25 in' : 'z.B. 2.5 mm'}
                            </small>
                        </div>
                    </div>
                </TabPanel>
                <TabPanel header={<span><i className="pi pi-comments mr-2"></i>{t.projectsettingspanel711}</span>}>
                            <div className="max-w-4xl">
                                <div className="mb-4 p-3 rounded text-sm"  style={{ backgroundColor: colors.infoBg, border: `1px solid ${colors.infoBorder}`, color: colors.infoText }}>
                                    <i className="pi pi-info-circle mr-2"></i>
                                    {t.projectsettingspanel1068}
                                </div>

                                <PickList
                                    dataKey="key"
                                    source={transferData.filter(lang => !selectedLanguages.includes(lang.key))}
                                    target={selectedLanguages
                                        .map(key => transferData.find(lang => lang.key === key))
                                        .filter(lang => lang !== undefined)}
                                    onChange={(e) => {
                                        const targetKeys = e.target.map((item: any) => item.key);
                                        setSelectedLanguages(targetKeys as string[]);
                                    }}
                                    itemTemplate={(item) => `${item.title}`}
                                    sourceHeader={t.projectsettingspanel727}
                                    targetHeader={t.projectsettingspanel728}
                                    sourceStyle={{ height: '400px' }}
                                    targetStyle={{ height: '400px' }}
                                    filter
                                    filterBy="title"
                                    sourceFilterPlaceholder={t.projectsettingspanel733}
                                    targetFilterPlaceholder={t.projectsettingspanel733}
                                    showSourceControls={false}
                                    showTargetControls={true}
                                />

                                <div className="mt-3 p-3 rounded text-sm" style={{ backgroundColor: colors.successBg, border: `1px solid ${colors.successBorder}`, color: colors.successText }}>
                                    <p>
                                        <strong>{t.projectsettingspanel1743}</strong>{' '}
                                        {selectedLanguages.length > 0
                                            ? selectedLanguages.join(', ')
                                            : t.projectsettingspanel742}
                                    </p>
                                </div>
                            </div>
                </TabPanel>

                {/* Project Translations Tab */}
                <TabPanel header={<span><i className="pi pi-language mr-2"></i>{t.projectsettingspanel_translations || 'Translations'}</span>}>
                    <div className="max-w-4xl">
                        <div className="mb-4 p-3 rounded text-sm" style={{ backgroundColor: colors.infoBg, border: `1px solid ${colors.infoBorder}`, color: colors.infoText }}>
                            <i className="pi pi-info-circle mr-2"></i>
                            {t.projectsettingspanel_translations_info || 'Translate project name, description and locale settings per language. The default language is used as fallback.'}
                        </div>

                        {/* Language selector */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
                                {t.projectsettingspanel_select_language || 'Language'}
                            </label>
                            <Dropdown
                                value={selectedTransLang}
                                onChange={(e) => {
                                    // Auto-save current language before switching
                                    if (selectedTransLang && translations[selectedTransLang]) {
                                        const data = translations[selectedTransLang];
                                        const { _visited, id: _id, project_id: _project_id, created_at: _created_at, updated_at: _updated_at, ...cleanData } = data;
                                        saveTranslation(selectedTransLang, cleanData);
                                    }
                                    setSelectedTransLang(e.value);
                                }}
                                options={selectedLanguages.map(code => {
                                    const lang = availableLanguages.find(l => l.code === code);
                                    return { label: lang ? `${lang.flag ?? ''} ${lang.native_name || lang.name}` : code, value: code };
                                })}
                                className="w-full"
                                placeholder={t.projectsettingspanel_select_language || 'Select language...'}
                            />
                        </div>

                        {selectedTransLang && (() => {
                            const trans = translations[selectedTransLang] || {};
                            const isDefault = selectedTransLang === formData.default_language;
                            const defaultCaption = selectedProject?.name ? selectedProject.name.split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : '';

                            const getField = (field: string) => trans[field] ?? '';
                            const setField = (field: string, value: string) => {
                                setTranslations(prev => ({
                                    ...prev,
                                    [selectedTransLang]: { ...(prev[selectedTransLang] || {}), language_code: selectedTransLang, [field]: value }
                                }));
                            };

                            // Auto-fill caption if empty when switching language
                            if (!trans.caption && !trans._visited) {
                                const localeDefaults = {
                                    de: { decimal_separator: ',', thousands_separator: '.', date_format: 'd.m.Y', time_format: 'H:i:s', currency_symbol: '€', timezone: 'Europe/Vienna' },
                                    en: { decimal_separator: '.', thousands_separator: ',', date_format: 'm/d/Y', time_format: 'h:i A', currency_symbol: '$', timezone: 'America/New_York' },
                                    fr: { decimal_separator: ',', thousands_separator: ' ', date_format: 'd/m/Y', time_format: 'H:i', currency_symbol: '€', timezone: 'Europe/Paris' },
                                    es: { decimal_separator: ',', thousands_separator: '.', date_format: 'd/m/Y', time_format: 'H:i', currency_symbol: '€', timezone: 'Europe/Madrid' },
                                    it: { decimal_separator: ',', thousands_separator: '.', date_format: 'd/m/Y', time_format: 'H:i', currency_symbol: '€', timezone: 'Europe/Rome' },
                                } as Record<string, any>;
                                const defaults = localeDefaults[selectedTransLang] || localeDefaults['en'];
                                setTimeout(() => {
                                    setTranslations(prev => ({
                                        ...prev,
                                        [selectedTransLang]: {
                                            ...(prev[selectedTransLang] || {}),
                                            language_code: selectedTransLang,
                                            caption: defaultCaption,
                                            description: selectedProject?.description || '',
                                            ...(!trans.decimal_separator && { decimal_separator: defaults.decimal_separator }),
                                            ...(!trans.thousands_separator && { thousands_separator: defaults.thousands_separator }),
                                            ...(!trans.date_format && { date_format: defaults.date_format }),
                                            ...(!trans.time_format && { time_format: defaults.time_format }),
                                            ...(!trans.currency_symbol && { currency_symbol: defaults.currency_symbol }),
                                            ...(!trans.timezone && { timezone: defaults.timezone }),
                                            _visited: true,
                                        }
                                    }));
                                }, 0);
                            }

                            return (
                                <div className="space-y-4">
                                    {isDefault && (
                                        <div className="p-2 rounded text-xs" style={{ backgroundColor: colors.successBg, border: `1px solid ${colors.successBorder}`, color: colors.successText }}>
                                            <i className="pi pi-star-fill mr-1"></i>
                                            {t.projectsettingspanel_default_lang || 'This is the default language (fallback for all others).'}
                                        </div>
                                    )}

                                    {/* Caption */}
                                    <div>
                                        <label className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
                                            {t.projectsettingspanel_caption || 'Project Caption'}
                                        </label>
                                        <InputText value={getField('caption')} onChange={(e) => setField('caption', e.target.value)} className="w-full" />
                                        <div className="text-xs mt-1" style={{ color: colors.textMuted }}>
                                            {t.projectsettingspanel_caption_help || 'Translated project name (e.g., "System Project", "Système Projet")'}
                                        </div>
                                    </div>

                                    {/* Description */}
                                    <div>
                                        <label className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
                                            {t.projectsettingspanel_description || 'Description'}
                                        </label>
                                        <InputTextarea value={getField('description')} onChange={(e) => setField('description', e.target.value)} rows={3} className="w-full" />
                                    </div>

                                    <div className="border-t pt-4 mt-4" style={{ borderColor: colors.borderPrimary }}>
                                        <h4 className="text-sm font-semibold mb-3" style={{ color: colors.textPrimary }}>
                                            <i className="pi pi-globe mr-2"></i>
                                            {t.projectsettingspanel_locale || 'Locale Settings'}
                                        </h4>

                                        <div className="grid grid-cols-2 gap-4">
                                            {/* Decimal Separator */}
                                            <div>
                                                <label className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
                                                    {t.projectsettingspanel544 || 'Decimal Separator'}
                                                </label>
                                                <InputText value={getField('decimal_separator')} onChange={(e) => setField('decimal_separator', e.target.value)} maxLength={1} className="w-full" />
                                            </div>
                                            {/* Thousands Separator */}
                                            <div>
                                                <label className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
                                                    {t.projectsettingspanel549 || 'Thousands Separator'}
                                                </label>
                                                <InputText value={getField('thousands_separator')} onChange={(e) => setField('thousands_separator', e.target.value)} maxLength={1} className="w-full" />
                                            </div>
                                            {/* Date Format */}
                                            <div>
                                                <label className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
                                                    {t.projectsettingspanel554 || 'Date Format'}
                                                </label>
                                                <InputText value={getField('date_format')} onChange={(e) => setField('date_format', e.target.value)} className="w-full" />
                                                <div className="text-xs mt-1" style={{ color: colors.textMuted }}>d.m.Y, m/d/Y, Y-m-d</div>
                                            </div>
                                            {/* Time Format */}
                                            <div>
                                                <label className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
                                                    {t.projectsettingspanel559 || 'Time Format'}
                                                </label>
                                                <InputText value={getField('time_format')} onChange={(e) => setField('time_format', e.target.value)} className="w-full" />
                                                <div className="text-xs mt-1" style={{ color: colors.textMuted }}>H:i:s, h:i A</div>
                                            </div>
                                            {/* Currency Symbol */}
                                            <div>
                                                <label className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
                                                    {t.projectsettingspanel564 || 'Currency Symbol'}
                                                </label>
                                                <InputText value={getField('currency_symbol')} onChange={(e) => setField('currency_symbol', e.target.value)} maxLength={5} className="w-full" />
                                            </div>
                                            {/* Timezone */}
                                            <div>
                                                <label className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
                                                    {t.projectsettingspanel569 || 'Timezone'}
                                                </label>
                                                <InputText value={getField('timezone')} onChange={(e) => setField('timezone', e.target.value)} className="w-full" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Save button */}
                                    <div className="flex justify-end mt-4">
                                        <Button
                                            label={t.btnSave || 'Save'}
                                            icon="pi pi-check"
                                            severity="success"
                                            loading={savingTranslation}
                                            onClick={() => {
                                                const data = translations[selectedTransLang] || {};
                                                const { _visited, id: _id, project_id: _project_id, created_at: _created_at, updated_at: _updated_at, ...cleanData } = data;
                                                saveTranslation(selectedTransLang, cleanData);
                                            }}
                                        />
                                    </div>
                                </div>
                            );
                        })()}
                    </div>
                </TabPanel>

                {/* Template Variables Tab */}
                <TabPanel header={<span><i className="pi pi-code mr-2"></i>{t.projectsettingspanel1108}</span>}>
                    <div className="max-w-6xl">
                        <div className="mb-4 p-3 rounded text-sm"  style={{ backgroundColor: colors.infoBg, border: `1px solid ${colors.infoBorder}`, color: colors.infoText }}>
                            <i className="pi pi-info-circle mr-2"></i>
                            {t.projectsettingspanel1111}
                        </div>

                        {loadingVariables ? (
                            <div className="flex justify-center py-8">
                                <ProgressSpinner />
                            </div>
                        ) : templatesWithVariables.length === 0 ? (
                            <div className="p-4 theme-bg-secondary theme-border-primary border rounded theme-text-secondary text-center">
                                <i className="pi pi-info-circle mr-2"></i>
                                {t.projectsettingspanel1122}
                            </div>
                        ) : (
                            <>
                                {/* Language Selector */}
                                <div className="mb-4">
                                    <label className="block text-sm font-medium mb-2 theme-text-secondary">
                                        <i className="pi pi-globe mr-2"></i>{t.projectsettingspanel1129}
                                    </label>
                                    <Dropdown
                                        value={selectedVariableLanguage}
                                        onChange={(e) => setSelectedVariableLanguage(e.value)}
                                        options={availableLanguages
                                            .filter(lang => lang.is_active)
                                            .map(lang => ({
                                                label: `${lang.native_name} (${lang.name})`,
                                                value: lang.code,
                                            }))}
                                        placeholder={t.projectsettingspanel1785}
                                        className="w-full max-w-md"
                                    />
                                </div>

                                {/* Templates with Variables */}
                                {templatesWithVariables.map((template) => (
                                    <div key={template.id} className="mb-6 p-4 theme-bg-secondary theme-border-primary border rounded">
                                        <h3 className="text-lg font-semibold theme-accent mb-1">
                                            <i className="pi pi-file-code mr-2"></i>
                                            {template.name}
                                        </h3>
                                        {template.description && (
                                            <p className="text-sm theme-text-muted mb-4">{template.description}</p>
                                        )}

                                        <div className="space-y-3">
                                            {template.variables.map((variable) => {
                                                const key = `${template.id}_${variable.variable_name}`;
                                                const currentValue = variableValues[key]?.[selectedVariableLanguage] || '';

                                                return (
                                                    <div key={variable.id} className="p-3 theme-bg-tertiary theme-border-secondary border rounded">
                                                        <div className="flex items-start gap-3">
                                                            <div className="flex-1">
                                                                <div className="flex items-center gap-2 mb-2">
                                                                    <span className="font-mono theme-accent font-semibold">
                                                                        {`{${variable.variable_name}}`}
                                                                    </span>
                                                                    {variable.is_required && (
                                                                        <span className="text-xs bg-red-900 text-red-200 px-2 py-1 rounded">
                                                                            {t.projectsettingspanel1816}
                                                                        </span>
                                                                    )}
                                                                </div>

                                                                {variable.description && (
                                                                    <p className="text-sm theme-text-muted mb-2">
                                                                        {variable.description}
                                                                    </p>
                                                                )}

                                                                {variable.default_value && (
                                                                    <p className="text-xs theme-text-muted mb-2">
                                                                        {t.projectsettingspanel1829}<span className="text-blue-300">{variable.default_value}</span>
                                                                    </p>
                                                                )}

                                                                <div className="flex items-center gap-2">
                                                                    <InputText
                                                                        value={currentValue}
                                                                        onChange={(e) => handleVariableValueChange(
                                                                            template.id,
                                                                            variable.variable_name,
                                                                            selectedVariableLanguage,
                                                                            e.target.value
                                                                        )}
                                                                        placeholder={variable.default_value || `${t.projectsettingspanel1841}{${variable.variable_name}}${t.projectsettingspanel1841_2}`}
                                                                        className="w-full"
                                                                    />
                                                                    {currentValue && (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handleVariableValueChange(
                                                                                template.id,
                                                                                variable.variable_name,
                                                                                selectedVariableLanguage,
                                                                                ''
                                                                            )}
                                                                            className="flex-shrink-0 p-2 rounded hover:bg-red-900/30 transition-colors"
                                                                            title={t.projectsettingspanel_var_delete}
                                                                            style={{ color: colors.errorText }}
                                                                        >
                                                                            <i className="pi pi-times"></i>
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}

                                {/* Info: Variables are saved by main "Save All" button */}
                               <div className="mb-4 p-3 rounded text-sm"  style={{ backgroundColor: colors.successBg, border: `1px solid ${colors.successBorder}`, color: colors.successText }}>
                                    <i className="pi pi-info-circle mr-2"></i>
                                    {t.projectsettingspanel1856}
                                </div>
                            </>
                        )}
                    </div>
                </TabPanel>

                {/* Deployment Scripts Tab */}
                {/* Protected Files Tab */}
                <TabPanel header={t.projectsettingspanel1864}>
                    <div className="p-4">
                        <ProjectProtectedFilesView
                            templates={linkedTemplates}
                            projectProtectedFiles={projectProtectedFiles}
                            onProjectProtectedFilesChange={setProjectProtectedFiles}
                        />
                    </div>
                </TabPanel>

                <TabPanel header={t.projectsettingspanel1875}>
                    <div className="p-4">
                        <DeploymentScriptsEditor
                            installScript={projectInstallScript}
                            updateScript={projectUpdateScript}
                            onInstallScriptChange={setProjectInstallScript}
                            onUpdateScriptChange={setProjectUpdateScript}
                        />
                        <div className="mt-3 p-3 rounded text-sm"  style={{ backgroundColor: colors.successBg, border: `1px solid ${colors.successBorder}`, color: colors.successText }}>
                            <i className="pi pi-info-circle mr-2"></i>
                            {t.projectsettingspanel1885}
                        </div>
                    </div>
                </TabPanel>

                {/* Git Integration Tab */}
                <TabPanel header={<span><i className="pi pi-github mr-2"></i>{t.projectsettingspanel1891}</span>}>
                    <div className="space-y-6 max-w-3xl p-4">
                        <div className="mb-4 p-3 rounded text-sm"  style={{ backgroundColor: colors.infoBg, border: `1px solid ${colors.infoBorder}`, color: colors.infoText }}>
                            <i className="pi pi-info-circle mr-2"></i>
                            {t.projectsettingspanel1895}
                        </div>

                        {availableGitProviders.length === 0 ? (
                            <div className="p-4 bg-yellow-900 border border-yellow-700 rounded text-yellow-100">
                                <i className="pi pi-exclamation-triangle mr-2"></i>
                                <strong>{t.projectsettingspanel1901}</strong>
                                <p className="mt-2 text-sm">
                                    {t.projectsettingspanel1903}
                                    {t.projectsettingspanel1904}
                                </p>
                            </div>
                        ) : (
                            <>
                                {/* Git Provider Selection */}
                                <div>
                                    <label className="block text-sm font-medium mb-2 theme-text-secondary">
                                        <i className="pi pi-cloud mr-2"></i>{t.projectsettingspanel1912}
                                    </label>
                                    <Dropdown
                                        value={gitSettings.provider_id}
                                        onChange={(e) => handleGitProviderChange(e.value)}
                                        options={availableGitProviders.map(p => ({
                                            label: `${p.provider_name} - @${p.username}${p.is_expired ? ' (' + t.projectsettingspanel1918 + ')' : ''}`,
                                            value: p.id,
                                            disabled: p.is_expired,
                                        }))}
                                        placeholder={t.projectsettingspanel1922}
                                        className="w-full"
                                        showClear
                                    />
                                </div>

                                {/* Repository Selection */}
                                {gitSettings.provider_id && (
                                    <div>
                                        <label className="block text-sm font-medium mb-2 theme-text-secondary">
                                            <i className="pi pi-folder mr-2"></i>{t.projectsettingspanel1932}
                                        </label>
                                        <Dropdown
                                            value={gitSettings.repository}
                                            onChange={(e) => handleGitRepositoryChange(e.value)}
                                            options={gitRepositories.map(r => ({
                                                label: `${r.full_name}${r.private ? ' (privat)' : ''}`,
                                                value: r.full_name,
                                            }))}
                                            placeholder={loadingGitRepos ? t.projectsettingspanel1941 : t.projectsettingspanel1941_2}
                                            className="w-full"
                                            filter
                                            filterPlaceholder={t.projectsettingspanel1944}
                                            disabled={loadingGitRepos}
                                            showClear
                                        />
                                        {loadingGitRepos && (
                                            <div className="text-xs mt-1">
                                                <i className="pi pi-spin pi-spinner mr-1"></i>{t.projectsettingspanel1950}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Branch Selection */}
                                {gitSettings.repository && (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium mb-2 theme-text-secondary">
                                                <i className="pi pi-code-branch mr-2"></i>{t.projectsettingspanel1961}
                                            </label>
                                            <Dropdown
                                                value={gitSettings.default_branch}
                                                onChange={(e) => setGitSettings(prev => ({ ...prev, default_branch: e.value }))}
                                                options={gitBranches.map(b => ({
                                                    label: `${b.name}${b.protected ? ' (' + t.projectsettingspanel1967 + ')' : ''}`,
                                                    value: b.name,
                                                }))}
                                                placeholder={loadingGitBranches ? t.projectsettingspanel1970 : t.projectsettingspanel1970_2}
                                                className="w-full"
                                                disabled={loadingGitBranches}
                                                editable
                                            />
                                            <div className="text-xs mt-1">
                                                {t.projectsettingspanel1976}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-2 theme-text-secondary">
                                                <i className="pi pi-code-branch mr-2"></i>{t.projectsettingspanel1981}
                                            </label>
                                            <Dropdown
                                                value={gitSettings.main_branch}
                                                onChange={(e) => setGitSettings(prev => ({ ...prev, main_branch: e.value }))}
                                                options={gitBranches.map(b => ({
                                                    label: b.name,
                                                    value: b.name,
                                                }))}
                                                placeholder={loadingGitBranches ? t.projectsettingspanel1990 : t.projectsettingspanel1990_2}
                                                className="w-full"
                                                disabled={loadingGitBranches}
                                            />
                                            <div className="text-xs mt-1">
                                                {t.projectsettingspanel1995}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Target Directory */}
                                {gitSettings.repository && (
                                    <div>
                                        <label className="block text-sm font-medium mb-2 theme-text-secondary">
                                            <i className="pi pi-folder-open mr-2"></i>{t.projectsettingspanel2005}
                                        </label>
                                        <InputText
                                            value={gitSettings.target_directory || ''}
                                            onChange={(e) => setGitSettings(prev => ({ ...prev, target_directory: e.target.value || null }))}
                                            placeholder={t.projectsettingspanel2010}
                                            className="w-full"
                                        />
                                        <div className="text-xs mt-1">
                                            {t.projectsettingspanel2014}
                                        </div>
                                    </div>
                                )}

                                {/* Workflow Selection */}
                                {gitSettings.repository && (
                                    <div>
                                        <label className="block text-sm font-medium mb-2 theme-text-secondary">
                                            <i className="pi pi-sitemap mr-2"></i>{t.projectsettingspanel2023}
                                        </label>
                                        <Dropdown
                                            value={gitSettings.workflow}
                                            onChange={(e) => setGitSettings(prev => ({ ...prev, workflow: e.value }))}
                                            options={[
                                                { label: t.projectsettingspanel2029, value: 'push_only' },
                                                { label: t.projectsettingspanel2030, value: 'push_and_pr' },
                                                { label: t.projectsettingspanel2031, value: 'push_pr_merge' },
                                            ]}
                                            className="w-full"
                                        />
                                        {gitSettings.workflow === 'push_pr_merge' && (
                                            <div className="mt-2 p-2 bg-red-900 border border-red-700 rounded text-red-100 text-sm">
                                                <i className="pi pi-exclamation-triangle mr-2"></i>
                                                <strong>{t.projectsettingspanel2038}</strong>{t.projectsettingspanel2038_2}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* PR Templates (for push_and_pr or push_pr_merge) */}
                                {gitSettings.repository && gitSettings.workflow !== 'push_only' && (
                                    <>
                                        <div>
                                            <label className="block text-sm font-medium mb-2 theme-text-secondary">
                                                <i className="pi pi-file-edit mr-2"></i>{t.projectsettingspanel2049}
                                            </label>
                                            <InputText
                                                value={gitSettings.pr_title_template || ''}
                                                onChange={(e) => setGitSettings(prev => ({ ...prev, pr_title_template: e.target.value || null }))}
                                                placeholder="[Scoriet]${t.projectsettingspanel2054}{timestamp}"
                                                className="w-full"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-2 theme-text-secondary">
                                                <i className="pi pi-align-left mr-2"></i>{t.projectsettingspanel2060}
                                            </label>
                                            <InputTextarea
                                                value={gitSettings.pr_description_template || ''}
                                                onChange={(e) => setGitSettings(prev => ({ ...prev, pr_description_template: e.target.value || null }))}
                                                placeholder="{t.projectsettingspanel2065}Scoriet.&#10;&#10;{t.projectsettingspanel2065_2}{timestamp}&#10;{t.projectsettingspanel2065_4}{project_name}"
                                                rows={4}
                                                className="w-full"
                                            />
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Checkbox
                                                inputId="git_auto_delete_branch"
                                                checked={gitSettings.auto_delete_branch}
                                                onChange={(e) => setGitSettings(prev => ({ ...prev, auto_delete_branch: e.checked ?? true }))}
                                            />
                                            <label htmlFor="git_auto_delete_branch" className="text-sm theme-text-secondary cursor-pointer">
                                                {t.projectsettingspanel2077}
                                            </label>
                                        </div>
                                    </>
                                )}

                                {/* Save/Remove Buttons */}
                                <div className="flex gap-3 pt-4 border-t theme-border-secondary">
                                    <Button
                                        icon="pi pi-save"
                                        label={t.projectsettingspanel2087}
                                        onClick={saveGitSettings}
                                        severity="success"
                                        disabled={!gitSettings.provider_id}
                                    />
                                    {gitSettings.is_configured && (
                                        <Button
                                            icon="pi pi-trash"
                                            label={t.projectsettingspanel2095}
                                            onClick={removeGitIntegration}
                                            severity="danger"
                                            outlined
                                        />
                                    )}
                                </div>

                                {/* Current Configuration Summary */}
                                {gitSettings.is_configured && (
                                    <div className="mt-3 p-3 rounded text-sm"  style={{ backgroundColor: colors.successBg, border: `1px solid ${colors.successBorder}`, color: colors.successText }}>
                                        <h4 className="font-semibold theme-text-primary mb-2">
                                            <i className="pi pi-check-circle mr-2"></i><span style={{color: colors.successText }}>{t.projectsettingspanel2107}</span>
                                        </h4>
                                        <div className="text-sm text-green-100 space-y-1">
                                            <div style={{color: colors.successText }}>{t.projectsettingspanel2110}<span style={{color: colors.successText }}>{gitSettings.provider}</span></div>
                                            <div style={{color: colors.successText }}>{t.projectsettingspanel2111}<span  style={{color: colors.successText }}>{gitSettings.repository}</span></div>
                                            <div style={{color: colors.successText }}>{t.projectsettingspanel2112}<span  style={{color: colors.successText }}>{gitSettings.default_branch}</span></div>
                                            <div style={{color: colors.successText }}>{t.projectsettingspanel2113}<span style={{color: colors.successText }}>{gitSettings.main_branch}</span></div>
                                            <div style={{color: colors.successText }}>{t.projectsettingspanel2114}<span style={{color: colors.successText }}>{
                                                gitSettings.workflow === 'push_only' ? t.projectsettingspanel2115 :
                                                gitSettings.workflow === 'push_and_pr' ? t.projectsettingspanel2116 :
                                                t.projectsettingspanel2117
                                            }</span></div>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </TabPanel>

                {/* FTP/SSH Deployment Tab */}
                <TabPanel header={<span><i className="pi pi-upload mr-2"></i>FTP/SSH Deployment</span>}>
                    <div className="space-y-6 max-w-3xl p-4">
                        <div className="mb-4 p-3 rounded text-sm"  style={{ backgroundColor: colors.infoBg, border: `1px solid ${colors.infoBorder}`, color: colors.infoText }}>
                            <i className="pi pi-info-circle mr-2"></i>
                            {t.projectsettingspanel2132}
                        </div>

                        {/* Deployment Type Selection */}
                        <div>
                            <label className="block text-sm font-medium mb-2 theme-text-secondary">
                                <i className="pi pi-server mr-2"></i>Deployment Typ
                            </label>
                            <Dropdown
                                value={ftpSettings.deployment_type}
                                onChange={(e) => {
                                    const newType = e.value;
                                    setFtpSettings(prev => ({
                                        ...prev,
                                        deployment_type: newType,
                                        ftp_port: newType === 'sftp' ? 22 : 21,
                                    }));
                                    setFtpTestResult(null);
                                }}
                                options={[
                                    { label: t.projectsettingspanel2152, value: '' },
                                    { label: 'FTP', value: 'ftp' },
                                    { label: 'SFTP (SSH)', value: 'sftp' },
                                ]}
                                placeholder={t.projectsettingspanel2156}
                                className="w-full"
                            />
                        </div>

                        {/* FTP/SSH Settings (only shown when type is selected) */}
                        {ftpSettings.deployment_type && (
                            <>
                                {/* Host */}
                                <div>
                                    <label className="block text-sm font-medium mb-2 theme-text-secondary">
                                        <i className="pi pi-globe mr-2"></i>{t.projectsettingspanel2167}
                                    </label>
                                    <InputText
                                        value={ftpSettings.ftp_host}
                                        onChange={(e) => setFtpSettings(prev => ({ ...prev, ftp_host: e.target.value }))}
                                        placeholder={t.projectsettingspanel2172}
                                        className="w-full"
                                    />
                                </div>

                                {/* Port */}
                                <div>
                                    <label className="block text-sm font-medium mb-2 theme-text-secondary">
                                        <i className="pi pi-hashtag mr-2"></i>{t.projectsettingspanel2180}
                                    </label>
                                    <InputText
                                        value={ftpSettings.ftp_port.toString()}
                                        onChange={(e) => setFtpSettings(prev => ({ ...prev, ftp_port: parseInt(e.target.value) || 21 }))}
                                        placeholder={ftpSettings.deployment_type === 'sftp' ? '22' : '21'}
                                        className="w-32"
                                        keyfilter="int"
                                    />
                                    <span className="text-xs theme-text-muted ml-2">
                                        {t.projectsettingspanel2190}{ftpSettings.deployment_type === 'sftp' ? '22' : '21'}
                                    </span>
                                </div>

                                {/* Username */}
                                <div>
                                    <label className="block text-sm font-medium mb-2 theme-text-secondary">
                                        <i className="pi pi-user mr-2"></i>{t.projectsettingspanel2197}
                                    </label>
                                    <InputText
                                        value={ftpSettings.ftp_username}
                                        onChange={(e) => setFtpSettings(prev => ({ ...prev, ftp_username: e.target.value }))}
                                        placeholder={t.projectsettingspanel2202}
                                        className="w-full"
                                    />
                                </div>

                                {/* Password */}
                                <div>
                                    <label className="block text-sm font-medium mb-2 theme-text-secondary">
                                        <i className="pi pi-lock mr-2"></i>{t.projectsettingspanel2210}
                                    </label>
                                    <PrimePassword
                                        value={ftpSettings.ftp_password}
                                        onChange={(e) => setFtpSettings(prev => ({ ...prev, ftp_password: e.target.value }))}
                                        placeholder="********"
                                        className="w-full"
                                        feedback={false}
                                        toggleMask
                                    />
                                    {ftpSettings.has_credentials && ftpSettings.ftp_password === '********' && (
                                        <span className="text-xs mt-1 block">
                                            <i className="pi pi-info-circle mr-1"></i>
                                            {t.projectsettingspanel2223}
                                        </span>
                                    )}
                                </div>

                                {/* Remote Directory */}
                                <div>
                                    <label className="block text-sm font-medium mb-2 theme-text-secondary">
                                        <i className="pi pi-folder mr-2"></i>{t.projectsettingspanel2231}
                                    </label>
                                    <InputText
                                        value={ftpSettings.ftp_directory}
                                        onChange={(e) => setFtpSettings(prev => ({ ...prev, ftp_directory: e.target.value }))}
                                        placeholder="/public_html/ oder /var/www/html/"
                                        className="w-full"
                                    />
                                    <span className="text-xs mt-1 block">
                                        {t.projectsettingspanel2240}
                                    </span>
                                </div>

                                {/* FTP-specific options */}
                                {ftpSettings.deployment_type === 'ftp' && (
                                    <div className="space-y-3 p-3 theme-bg-secondary rounded border theme-border-primary">
                                        <div className="block text-sm font-medium mb-2 theme-text-secondary">FTP-Optionen</div>
                                        <div className="flex items-center">
                                            <Checkbox
                                                inputId="ftp_passive"
                                                checked={ftpSettings.ftp_passive}
                                                onChange={(e) => setFtpSettings(prev => ({ ...prev, ftp_passive: e.checked ?? true }))}
                                            />
                                            <label htmlFor="ftp_passive" className="ml-2 text-sm theme-text-secondary cursor-pointer">
                                                {t.projectsettingspanel2255}
                                            </label>
                                        </div>
                                        <div className="flex items-center">
                                            <Checkbox
                                                inputId="ftp_ssl"
                                                checked={ftpSettings.ftp_ssl}
                                                onChange={(e) => setFtpSettings(prev => ({ ...prev, ftp_ssl: e.checked ?? false }))}
                                            />
                                            <label htmlFor="ftp_ssl" className="ml-2 text-sm theme-text-secondary cursor-pointer">
                                                {t.projectsettingspanel2265}
                                            </label>
                                        </div>
                                    </div>
                                )}

                                {/* Test Connection */}
                                <div className="pt-4 border-t theme-border-primary">
                                    <Button
                                        label={testingFtp ? t.projectsettingspanel2274 : t.projectsettingspanel2274_2}
                                        icon={testingFtp ? 'pi pi-spin pi-spinner' : 'pi pi-wifi'}
                                        onClick={testFtpConnection}
                                        disabled={testingFtp || !ftpSettings.ftp_host || !ftpSettings.ftp_username}
                                        className="p-button-outlined"
                                    />

                                    {/* Test Result */}
                                    {ftpTestResult && (
                                        <div className={`mt-3 p-3 rounded text-sm ${
                                            ftpTestResult.success
                                                ? 'bg-green-900 border border-green-700 text-green-100'
                                                : 'bg-red-900 border border-red-700 text-red-100'
                                        }`}>
                                            <i className={`pi ${ftpTestResult.success ? 'pi-check-circle' : 'pi-times-circle'} mr-2`}></i>
                                            {ftpTestResult.message}
                                        </div>
                                    )}
                                </div>

                                {/* Save / Remove Buttons */}
                                <div className="flex gap-3 pt-4">
                                    <Button
                                        label={t.projectsettingspanel2297}
                                        icon="pi pi-save"
                                        onClick={saveFtpSettings}
                                        disabled={!ftpSettings.ftp_host || !ftpSettings.ftp_username}
                                        className="p-button-success"
                                    />
                                    {ftpSettings.has_credentials && (
                                        <Button
                                            label={t.projectsettingspanel2305}
                                            icon="pi pi-trash"
                                            onClick={removeFtpSettings}
                                            className="p-button-danger p-button-outlined"
                                        />
                                    )}
                                </div>
                            </>
                        )}

                        {/* Active Configuration Info */}
                        {ftpSettings.has_credentials && !ftpSettings.deployment_type && (
                            <div className="p-3 bg-green-900 border border-green-700 rounded">
                                <h4 className="font-medium text-green-300 mb-2">
                                    <i className="pi pi-check-circle mr-2"></i>{t.projectsettingspanel2319}
                                </h4>
                                <p className="text-sm text-green-100">
                                    {t.projectsettingspanel2322}
                                </p>
                            </div>
                        )}

                        {/* Saved Configuration Summary */}
                        {ftpSettings.has_credentials && ftpSettings.deployment_type && (
                            <div className="mt-4 p-3 bg-green-900 border border-green-700 rounded">
                                <h4 className="font-medium text-green-300 mb-2">
                                    <i className="pi pi-check-circle mr-2"></i>{t.projectsettingspanel2331}
                                </h4>
                                <div className="text-sm text-green-100 space-y-1">
                                    <div>{t.projectsettingspanel2334}<span className="text-white">{ftpSettings.deployment_type.toUpperCase()}</span></div>
                                    <div>{t.projectsettingspanel2335}<span className="text-white">{ftpSettings.ftp_host}:{ftpSettings.ftp_port}</span></div>
                                    <div>{t.projectsettingspanel2336}<span className="text-white">{ftpSettings.ftp_username}</span></div>
                                    {ftpSettings.ftp_directory && (
                                        <div>{t.projectsettingspanel2338}<span className="text-white">{ftpSettings.ftp_directory}</span></div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </TabPanel>
            </TabView>
        </div>
    );
}
