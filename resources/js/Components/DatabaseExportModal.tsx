// resources/js/Components/DatabaseExportModal.tsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { TabPanel } from 'primereact/tabview';
import TabViewSideMenu from '@/Components/TabViewSideMenu';
import { useProject } from '@/contexts/ProjectContext';
import { useTheme } from '@/contexts/ThemeContext';
import Editor from 'react-simple-code-editor';
import Prism from 'prismjs';
import 'prismjs/components/prism-sql';
// Note: We don't import a Prism theme - we use our own theme-aware styles instead
import { useTranslation, SupportedLanguage, getStoredLanguage } from '@/i18n';
import { apiClient } from '@/lib/api';

// Default tab when the modal opens. The other tabs (Download, Database) are
// indexed implicitly by JSX child order; they were named constants here for
// documentation but nothing actually referenced them, so the dead-name pair
// went away to satisfy the unused-vars rule.
const TAB_VIEW = 0;

interface DatabaseExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedSchemaId?: number;
}

interface DatabaseSchema {
  id: number;
  name: string;
  description?: string;
  current_version?: number;
  last_version?: number;
}

interface SchemaVersion {
  version_number: number;
  is_current: boolean;
  created_at: string;
}

// SQL syntax highlighter using Prism.js
const highlightSQL = (code: string) => {
  try {
    return Prism.highlight(code, Prism.languages.sql, 'sql');
  } catch {
    // SQL syntax highlighting failed
    return code;
  }
};

export default function DatabaseExportModal({ isOpen, onClose, preselectedSchemaId }: DatabaseExportModalProps) {
  // i18n setup
  const [currentLanguage] = React.useState<SupportedLanguage>(getStoredLanguage());
  const { t } = useTranslation(currentLanguage);
  const { colors } = useTheme();
  const { selectedProject } = useProject();
  const [schemas, setSchemas] = useState<DatabaseSchema[]>([]);
  const [selectedSchemaId, setSelectedSchemaId] = useState<number | null>(preselectedSchemaId ?? null);
  const [selectedVersion, setSelectedVersion] = useState<number | null>(null);
  const [schemaVersions, setSchemaVersions] = useState<SchemaVersion[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingSchemas, setLoadingSchemas] = useState(false);
  const [loadingVersions, setLoadingVersions] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [exportedSQL, setExportedSQL] = useState<string>('');
  // Tab index used by <TabViewSideMenu> — see TAB_* constants at top of file.
  const [activeTabIndex, setActiveTabIndex] = useState<number>(TAB_VIEW);
  const downloadLinkRef = useRef<HTMLAnchorElement>(null);

  // Database export states
  const [dbConnectionType, setDbConnectionType] = useState<'mysql' | 'postgresql' | 'mssql'>('mysql');
  const [dbHost, setDbHost] = useState('localhost');
  const [dbPort, setDbPort] = useState('3306');
  const [dbDatabase, setDbDatabase] = useState('');
  const [dbUsername, setDbUsername] = useState('root');
  const [dbPassword, setDbPassword] = useState('');
  const [dbSchemaName, setDbSchemaName] = useState('');
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionTestResult, setConnectionTestResult] = useState<{
    success: boolean;
    databases?: string[];
    schemas?: string[];
    server_version?: string;
    error?: string;
  } | null>(null);
  const [availableDatabases, setAvailableDatabases] = useState<string[]>([]);
  const [availableSchemas, setAvailableSchemas] = useState<string[]>([]);
  const [serviceLog, setServiceLog] = useState<string[]>([]);
  const [serviceTaskId, setServiceTaskId] = useState<number | null>(null);
  const [servicePolling, setServicePolling] = useState(false);
  const logEndRef = useRef<HTMLDivElement>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Export options — default OFF: dropping tables is destructive, the user
  // should opt in explicitly so it doesn't happen by accident.
  const [dropTablesFirst, setDropTablesFirst] = useState(false);

  const loadSchemas = useCallback(async () => {
    if (!selectedProject) return;

    setLoadingSchemas(true);
    setError(null);

    try {
      let data: any;
      try {
        data = await apiClient.get(`/projects/${selectedProject.id}/schemas`);
      } catch {
        throw new Error(t.databaseexportmodal71);
      }

      // Handle different possible response formats
      let schemasArray = [];
      if (data.schemas) {
        schemasArray = data.schemas;
      } else if (Array.isArray(data)) {
        schemasArray = data;
      } else if (data.data) {
        schemasArray = data.data;
      }
      setSchemas(schemasArray);

      // Preselect the requested schema if provided and present in the list,
      // otherwise auto-select the first schema.
      if (schemasArray && schemasArray.length > 0) {
        if (preselectedSchemaId && schemasArray.some((s: DatabaseSchema) => s.id === preselectedSchemaId)) {
          setSelectedSchemaId(preselectedSchemaId);
        } else {
          setSelectedSchemaId(schemasArray[0].id);
        }
      }
    } catch (error) {
      // Error loading schemas
      setError(error instanceof Error ? error.message : t.databaseexportmodal71);
      setSchemas([]);
    } finally {
      setLoadingSchemas(false);
    }
  }, [selectedProject, preselectedSchemaId]);

  // Sync preselectedSchemaId when modal reopens with a different target schema
  useEffect(() => {
    if (isOpen && preselectedSchemaId) {
      setSelectedSchemaId(preselectedSchemaId);
    }
  }, [isOpen, preselectedSchemaId]);

  const loadSchemaVersions = async (schemaId: number) => {
    setLoadingVersions(true);
    setError(null);

    try {
      let data: any;
      try {
        data = await apiClient.get(`/floating-schemas/${schemaId}/versions`);
      } catch {
        throw new Error(t.databaseexportmodal114);
      }

      // Handle different possible response formats
      let versionsArray = [];
      if (data.versions) {
        versionsArray = data.versions;
      } else if (Array.isArray(data)) {
        versionsArray = data;
      } else if (data.data) {
        versionsArray = data.data;
      }
      setSchemaVersions(versionsArray);

      // Auto-select the highest version number (newest version)
      if (versionsArray && versionsArray.length > 0) {
        // Find the version with the highest version_number
        const highestVersion = versionsArray.reduce((max: SchemaVersion, current: SchemaVersion) => {
          return current.version_number > max.version_number ? current : max;
        });

        setSelectedVersion(highestVersion.version_number);
      }
    } catch (error) {
      // Error loading schema versions
      setError(error instanceof Error ? error.message : t.databaseexportmodal114);
      setSchemaVersions([]);
    } finally {
      setLoadingVersions(false);
    }
  };

  const resetModal = () => {
    setSelectedSchemaId(null);
    setSelectedVersion(null);
    setSchemaVersions([]);
    setExportedSQL('');
    setError(null);
    setSuccessMessage(null);
    setActiveTabIndex(TAB_VIEW);
    setServiceLog([]);
    setServiceTaskId(null);
    setConnectionTestResult(null);
  };

  const handleClose = () => {
    if (!loading && !servicePolling) {
      resetModal();
      onClose();
    } else {
      // Just close modal, keep state for later
      onClose();
    }
  };

  // Load schemas when modal opens
  useEffect(() => {
    if (isOpen && selectedProject) {
      loadSchemas();

      // Load database connection settings from project
      if (selectedProject.database_type) {
        const dbTypeMap: Record<string, 'mysql' | 'postgresql' | 'mssql'> = {
          'MySQL': 'mysql',
          'PostgreSQL': 'postgresql',
          'MSSQL': 'mssql',
          'SQL Server': 'mssql'
        };
        setDbConnectionType(dbTypeMap[selectedProject.database_type] || 'mysql');
      }
      if (selectedProject.database_server) {
        setDbHost(selectedProject.database_server);
      }
      if (selectedProject.database_port) {
        setDbPort(selectedProject.database_port);
      }
      if (selectedProject.database_name) {
        setDbDatabase(selectedProject.database_name);
      }
      if (selectedProject.database_username) {
        setDbUsername(selectedProject.database_username);
      }
      if (selectedProject.database_password) {
        setDbPassword(selectedProject.database_password);
      }
    } else if (isOpen && !selectedProject) {
      setError(t.databaseexportmodal169);
    }
  }, [isOpen, selectedProject, loadSchemas]);

  // Load available versions when schema is selected
  useEffect(() => {
    if (selectedSchemaId) {
      loadSchemaVersions(selectedSchemaId);
    } else {
      setSelectedVersion(null);
      setSchemaVersions([]);
    }
  }, [selectedSchemaId]);

  // Auto-scroll log to bottom
  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [serviceLog]);

  // Cleanup polling interval when component unmounts
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, []);

  // Get export format based on project database type
  const getExportFormat = (): 'mysql' | 'postgresql' => {
    if (!selectedProject) return 'mysql';
    const dbType = selectedProject.database_type?.toLowerCase() || 'mysql';
    if (dbType === 'postgresql' || dbType === 'postgres' || dbType === 'pgsql') {
      return 'postgresql';
    }
    return 'mysql';
  };

  const exportSchema = async (downloadMode: boolean = false) => {
    if (!selectedProject || !selectedSchemaId || selectedVersion === null) {
      setError(t.databaseexportmodal195);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Determine export format based on project's database_type
      const exportFormat = getExportFormat();

      let data: any;
      try {
        data = await apiClient.get(`/schemas/${selectedSchemaId}/export/${exportFormat}?version=${selectedVersion}`);
      } catch (err: any) {
        const status = err?.response?.status;
        if (status === 404) {
          throw new Error(t.databaseexportmodal214);
        } else if (status === 403) {
          throw new Error(t.databaseexportmodal216);
        } else {
          throw new Error(`Export failed: HTTP ${status || ''}`);
        }
      }

      if (!data.success) {
        throw new Error(data.error || t.databaseexportmodal225);
      }

      const sqlContent = data.sql || t.databaseexportmodal228;
      setExportedSQL(sqlContent);

      if (downloadMode) {
        // Download mode - trigger download immediately
        downloadSQL(sqlContent);
        setSuccessMessage(t.databaseexportmodal321);
      }
      // View mode - just set the SQL content, user can see it below
    } catch (error) {
      // Export error
      setError(error instanceof Error ? error.message : t.databaseexportmodal225);
    } finally {
      setLoading(false);
    }
  };


  const downloadSQL = (sqlContent: string) => {
    const selectedSchema = schemas.find(s => s.id === selectedSchemaId);
    const exportFormat = getExportFormat();
    const filename = `${selectedSchema?.name || 'schema'}_v${selectedVersion}_${exportFormat}_export.sql`;

    const blob = new Blob([sqlContent], { type: 'text/sql' });
    const url = URL.createObjectURL(blob);

    if (downloadLinkRef.current) {
      downloadLinkRef.current.href = url;
      downloadLinkRef.current.download = filename;
      downloadLinkRef.current.click();
    }

    // Clean up URL
    setTimeout(() => URL.revokeObjectURL(url), 100);
  };

  const getVersionOptions = () => {
    if (!schemaVersions || schemaVersions.length === 0) return [];

    // Sort versions by version_number in descending order (newest first)
    const sortedVersions = [...schemaVersions].sort((a, b) => b.version_number - a.version_number);

    return sortedVersions.map((version: SchemaVersion) => ({
      label: `Version ${version.version_number}${version.is_current ? t.databaseexportmodal269 : ''}`,
      value: version.version_number
    }));
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(exportedSQL);
      setSuccessMessage(t.databaseexportmodal366);
      setTimeout(() => setSuccessMessage(null), 2000);
    } catch {
      setError(t.databaseexportmodal369);
    }
  };

  const handleTestConnection = async () => {
    setTestingConnection(true);
    setError(null);
    setConnectionTestResult(null);
    setServiceLog([t.databaseexportmodal377]);

    try {
      // Create connection test task (auth handled by apiClient.cliRequest)
      const payload = {
        payload: {
          connection_type: dbConnectionType,
          host: dbHost,
          port: parseInt(dbPort),
          database: dbDatabase || undefined,
          username: dbUsername,
          password: dbPassword,
        }
      };

      // cliRequest throws on !response.ok; the success:false case (200 with
      // an application-level error) still needs an explicit check below.
      const result = await apiClient.cliRequest('/svc/tasks/connection-test', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (!result.success) {
        throw new Error(result.message || t.databaseexportmodal410);
      }

      setServiceLog(prev => [...prev, `${t.databaseexportmodal413}${result.task_id})`, t.databaseexportmodal413_2]);

      // Poll for result
      const taskId = result.task_id;
      let pollCount = 0;
      const maxPolls = 30; // 30 seconds max

      const pollInterval = setInterval(async () => {
        pollCount++;

        try {
          const statusResult = await apiClient.cliRequest(`/svc/tasks/${taskId}`);
          const taskData = statusResult.task;

          if (taskData.status === 'completed') {
            clearInterval(pollInterval);
            setTestingConnection(false);

            const taskResult = taskData.result || {};

            if (taskResult.status === 'success') {
              setConnectionTestResult({
                success: true,
                databases: taskResult.databases || [],
                schemas: taskResult.schemas || [],
                server_version: taskResult.server_version,
              });
              setAvailableDatabases(taskResult.databases || []);
              setAvailableSchemas(taskResult.schemas || []);

              const dbCount = taskResult.databases?.length || 0;
              const schemaCount = taskResult.schemas?.length || 0;

              setServiceLog(prev => [
                ...prev,
                `${t.databaseexportmodal455}`,
                `${t.databaseexportmodal456}${taskResult.server_version || t.databaseexportmodal456_2}`,
                `${t.databaseexportmodal457}${dbCount}${t.databaseexportmodal457_2}`,
                ...(schemaCount > 0 ? [`${t.databaseexportmodal458}${schemaCount}${t.databaseexportmodal458_2}`] : []),
              ]);

              // Auto-select database if only one available
              if (taskResult.databases?.length === 1 && !dbDatabase) {
                setDbDatabase(taskResult.databases[0]);
              }

              // Auto-set schema name for PostgreSQL
              if (dbConnectionType === 'postgresql' && !dbSchemaName) {
                if (taskResult.schemas?.includes('public')) {
                  setDbSchemaName('public');
                } else if (taskResult.schemas?.length === 1) {
                  setDbSchemaName(taskResult.schemas[0]);
                }
              }
            } else {
              setConnectionTestResult({
                success: false,
                error: taskResult.error || t.databaseexportmodal477,
              });
              setServiceLog(prev => [...prev, `❌ ${taskResult.error || t.databaseexportmodal479}`]);
              setError(taskResult.error || t.databaseexportmodal480);
            }
          } else if (taskData.status === 'failed') {
            clearInterval(pollInterval);
            setTestingConnection(false);
            setConnectionTestResult({
              success: false,
              error: taskData.error_message || t.databaseexportmodal487,
            });
            setServiceLog(prev => [...prev, `❌ ${taskData.error_message || t.databaseexportmodal489}`]);
            setError(taskData.error_message || t.databaseexportmodal490);
          } else if (pollCount >= maxPolls) {
            clearInterval(pollInterval);
            setTestingConnection(false);
            setServiceLog(prev => [...prev, t.databaseexportmodal494]);
            setError(t.databaseexportmodal495);
          }
        } catch (err) {
          clearInterval(pollInterval);
          setTestingConnection(false);
          setServiceLog(prev => [...prev, `${t.databaseexportmodal500}${err instanceof Error ? err.message : t.databaseexportmodal500_2}`]);
          setError(err instanceof Error ? err.message : t.databaseexportmodal501);
        }
      }, 1000);

    } catch (err) {
      setTestingConnection(false);
      setServiceLog(prev => [...prev, `${t.databaseexportmodal507}${err instanceof Error ? err.message : t.databaseexportmodal507_2}`]);
      setError(err instanceof Error ? err.message : t.databaseexportmodal508);
    }
  };

  const handleDatabaseExport = async () => {
    if (!selectedSchemaId || selectedVersion === null || !dbDatabase) {
      setError(t.databaseexportmodal514);
      return;
    }

    // Check if there's already a running task
    if (serviceTaskId) {
      setError(t.databaseexportmodal520);
      return;
    }

    try {
      setError(null);
      setServicePolling(true);
      setServiceLog([t.databaseexportmodal527]);

      // First, get the SQL export
      const exportFormat = getExportFormat();
      setServiceLog(prev => [...prev, `${t.databaseexportmodal536}${exportFormat.toUpperCase()}${t.databaseexportmodal536_2}`]);

      let exportData: any;
      try {
        exportData = await apiClient.get(`/schemas/${selectedSchemaId}/export/${exportFormat}?version=${selectedVersion}`);
      } catch {
        throw new Error(t.databaseexportmodal547);
      }
      if (!exportData.success || !exportData.sql) {
        throw new Error(exportData.error || t.databaseexportmodal552);
      }

      setServiceLog(prev => [...prev, `${t.databaseexportmodal555}(${exportData.table_count}${t.databaseexportmodal555_2})`]);

      // Create export task (auth handled by apiClient.cliRequest)
      const payload = {
        task_type: 'database_export',
        payload: {
          connection_type: dbConnectionType,
          host: dbHost,
          port: parseInt(dbPort),
          database: dbDatabase,
          username: dbUsername,
          password: dbPassword,
          schema_name: dbSchemaName,
          sql_script: exportData.sql,
          drop_tables_first: dropTablesFirst,
        }
      };

      setServiceLog(prev => [...prev, t.databaseexportmodal573]);

      const result = await apiClient.cliRequest('/svc/tasks/database-export', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (!result.success) {
        throw new Error(result.message || t.databaseexportmodal588);
      }

      setServiceTaskId(result.task_id);
      setServiceLog(prev => [...prev, `${t.databaseexportmodal592}${result.task_id})`, t.databaseexportmodal592_2]);

      // Start polling
      startPolling(result.task_id);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start export');
      setServicePolling(false);
      setServiceLog(prev => [...prev, `${t.databaseexportmodal600}${err instanceof Error ? err.message : t.databaseexportmodal600_2}`]);
    }
  };

  // Token plumbing removed: apiClient.cliRequest reads the token internally
  // and handles 401-refresh, so the caller doesn't need to thread one through.
  const startPolling = (taskId: number) => {
    // Clear any existing polling interval
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }

    let pollCount = 0;
    const maxPolls = 150; // 5 minutes max (150 * 2 seconds)

    const pollInterval = setInterval(async () => {
      pollCount++;

      try {
        // cliRequest throws on !response.ok; catch below handles the failure.
        const result = await apiClient.cliRequest(`/svc/tasks/${taskId}`);
        const taskData = result.task;

        // Update log based on status
        if (taskData.status === 'processing') {
          setServiceLog(prev => {
            if (!prev.some(log => log.includes('Service picked up task'))) {
              return [...prev, t.databaseexportmodal637, t.databaseexportmodal637_2];
            }
            return prev;
          });
        } else if (taskData.status === 'completed') {
          setServiceLog(prev => [...prev, t.databaseexportmodal642, t.databaseexportmodal642_2, t.databaseexportmodal642_3, '', t.databaseexportmodal642_4]);
          setServicePolling(false);
          setSuccessMessage(t.databaseexportmodal644);
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
          }
        } else if (taskData.status === 'failed') {
          const errorMsg = taskData.error_message || t.databaseexportmodal650;
          setServiceLog(prev => [...prev, `{t.databaseexportmodal651}${errorMsg}`, '', t.databaseexportmodal651_2]);
          setError(`Export failed: ${errorMsg}`);
          setServicePolling(false);
          setServiceTaskId(null);
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
          }
        }

        // Timeout check
        if (pollCount >= maxPolls) {
          setServiceLog(prev => [...prev,
            t.databaseexportmodal664,
          ]);
          setError(t.databaseexportmodal666);
          setServicePolling(false);
          setServiceTaskId(null);
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
          }
        }

      } catch (err) {
        setServiceLog(prev => [...prev, `${t.databaseexportmodal676}${err instanceof Error ? err.message : t.databaseexportmodal676_2}`]);
        setError(err instanceof Error ? err.message : t.databaseexportmodal677);
        setServicePolling(false);
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
      }
    }, 2000);

    // Store the interval reference
    pollIntervalRef.current = pollInterval;
  };

  // Render schema/version selection (shared between tabs)
  const renderSchemaSelection = () => (
    <div className="grid grid-cols-2 gap-4 mb-4">
      {/* Database Selection */}
      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
          {t.databaseexportmodal696}
        </label>
        {loadingSchemas ? (
          <div className="text-sm" style={{ color: colors.textMuted }}>{t.databaseexportmodal699}</div>
        ) : schemas.length > 0 ? (
          <Dropdown
            value={selectedSchemaId}
            options={schemas.map(schema => ({
              label: schema.name,
              value: schema.id
            }))}
            onChange={(e) => setSelectedSchemaId(e.value)}
            placeholder={t.databaseexportmodal338}
            className="w-full"
            panelClassName="custom-dropdown-panel"
          />
        ) : (
          <div className="text-sm" style={{ color: colors.textMuted }}>
            {selectedProject ? t.databaseexportmodal714 : t.databaseexportmodal344}
          </div>
        )}
      </div>

      {/* Version Selection */}
      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
          {t.databaseexportmodal722}
        </label>
        {!selectedSchemaId ? (
          <div className="text-sm" style={{ color: colors.textMuted }}>{t.databaseexportmodal725}</div>
        ) : loadingVersions ? (
          <div className="text-sm" style={{ color: colors.textMuted }}>{t.databaseexportmodal727}</div>
        ) : schemaVersions.length > 0 ? (
          <Dropdown
            value={selectedVersion}
            options={getVersionOptions()}
            onChange={(e) => setSelectedVersion(e.value)}
            placeholder={t.databaseexportmodal363}
            className="w-full"
            panelClassName="custom-dropdown-panel"
          />
        ) : (
          <div className="text-sm" style={{ color: colors.textMuted }}>{t.databaseexportmodal738}</div>
        )}
      </div>
    </div>
  );

  return (
    <Dialog
      header={t.databaseexportmodal285}
      visible={isOpen}
      onHide={handleClose}
      /* Fixed height (85vh) replaces the old 70vh minHeight/contentStyle.height
       * combo. With TabViewSideMenu the inner flex layout needs a concrete
       * dialog height to distribute. headerStyle removed — the unified purple
       * gradient header from styles.css now handles it via p-dialog-custom. */
      style={{ width: '60vw', maxWidth: '900px', height: '85vh' }}
      modal
      closable={!loading && !servicePolling}
      draggable={true}
      resizable={true}
      className="p-dialog-custom database-export-modal"
      contentStyle={{ padding: '0' }}
    >
      <div className="h-full flex flex-col" style={{ backgroundColor: colors.bgPrimary }}>
        <p className="text-sm px-6 pt-4 pb-2" style={{ color: colors.textMuted }}>
          {t.databaseexportmodal770}{getExportFormat() === 'postgresql' ? 'PostgreSQL' : 'MySQL'} SQL script
          {selectedProject?.database_type && (
            <span className="ml-2 text-xs px-2 py-0.5 rounded" style={{ backgroundColor: colors.infoBg, color: colors.infoText }}>
              {selectedProject.database_type}
            </span>
          )}
        </p>

        {/* Status banners (success / error) — flex-shrink-0 so they keep
         * their natural height above the TabViewSideMenu region. */}
        {successMessage && (
          <div className="mx-6 mt-2 p-3 rounded flex-shrink-0" style={{ backgroundColor: colors.successBg, border: `1px solid ${colors.successText}`, color: colors.successText }}>
            <div className="flex items-center justify-between">
              <span>✅ {successMessage}</span>
              <button
                type="button"
                onClick={() => setSuccessMessage(null)}
                className="ml-4 hover:opacity-80"
                style={{ color: colors.successText }}
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="mx-6 mt-2 p-3 rounded flex-shrink-0" style={{ backgroundColor: colors.errorBg, border: `1px solid ${colors.errorText}`, color: colors.errorText }}>
            <div className="flex items-center">
              <span className="mr-2">⚠️</span>
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* TabViewSideMenu region — fills the remaining vertical space.
         * Replaces the previous 3 custom <button> tab bar plus three
         * "{activeTab === 'X' && ...}" content conditionals. */}
        <div className="flex-1 min-h-0">
          <TabViewSideMenu
            storageKey="databaseExportModal"
            defaultWidth={260}
            activeIndex={activeTabIndex}
            onTabChange={(e) => setActiveTabIndex(e.index)}
          >
            {/* contentClassName="panel-fill" because this tab uses h-full
             * + flex-1 on the SQL editor below so the editor fills the rest
             * of the visible panel height. Without panel-fill the panel
             * defaults to natural height and h-full would resolve to "auto",
             * collapsing the editor. */}
            <TabPanel
              header={<span><i className="pi pi-eye mr-2" />{t.databaseexportmodal790}</span>}
              contentClassName="panel-fill"
            >
              {/* flex-col h-full so the SQL output viewer below can grow into
               * the remaining vertical space. Previously the Editor sat in a
               * hardcoded h-64 (256px) container — the inner `minHeight: 100%`
               * only filled those 256px, which is why the editor capped at
               * ~60% of the available tab height regardless of modal size. */}
              <div className="flex flex-col h-full">
                {renderSchemaSelection()}

                {/* Export Info */}
                <div className="mb-4 text-xs" style={{ color: colors.textMuted }}>
                  {t.databaseexportmodal855}{getExportFormat() === 'postgresql' ? 'PostgreSQL' : 'MySQL'}{t.databaseexportmodal855_2}
                </div>

                {/* Generate Button */}
                <div className="flex justify-center mb-4">
                  <Button
                    label={t.databaseexportmodal861}
                    onClick={() => exportSchema(false)}
                    disabled={loading || !selectedSchemaId || selectedVersion === null}
                    className="p-button-primary"
                    loading={loading}
                  />
                </div>

                {/* SQL Output Viewer — flex-1 + flex-col so the editor below
                 * absorbs the leftover height after the header bar. */}
                {exportedSQL && (
                  <div className="rounded flex-1 min-h-0 flex flex-col" style={{ border: `1px solid ${colors.borderPrimary}` }}>
                    <div className="flex justify-between items-center p-3 rounded-t flex-shrink-0" style={{ backgroundColor: colors.bgSecondary }}>
                      <h3 className="text-sm font-medium" style={{ color: colors.textPrimary }}>{t.databaseexportmodal873}</h3>
                      <div className="flex space-x-2">
                        <button
                          onClick={copyToClipboard}
                          className="px-3 py-1 text-sm rounded transition-colors hover:opacity-80"
                          style={{ color: colors.textSecondary }}
                        >
                          {t.databaseexportmodal406}
                        </button>
                        <button
                          onClick={() => downloadSQL(exportedSQL)}
                          className="px-3 py-1 text-sm rounded transition-colors hover:opacity-80"
                          style={{ color: colors.textSecondary }}
                        >
                          {t.databaseexportmodal412}
                        </button>
                      </div>
                    </div>
                    <div className="flex-1 min-h-0 overflow-auto" style={{ backgroundColor: colors.bgTertiary }}>
                      <Editor
                        value={exportedSQL}
                        onValueChange={() => {}} // Read-only
                        highlight={highlightSQL}
                        padding={16}
                        className="font-mono text-sm"
                        style={{
                          backgroundColor: colors.bgTertiary,
                          color: colors.textPrimary,
                          minHeight: '100%'
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </TabPanel>

            {/* Download SQL Tab */}
            <TabPanel header={<span><i className="pi pi-download mr-2" />{t.databaseexportmodal802}</span>}>
              <div>
                {renderSchemaSelection()}

                {/* Export Info */}
                <div className="mb-4 text-xs" style={{ color: colors.textMuted }}>
                  {t.databaseexportmodal917}{getExportFormat() === 'postgresql' ? 'PostgreSQL' : 'MySQL'}{t.databaseexportmodal917_2}
                </div>

                {/* Download Preview */}
                <div className="mb-6 p-4 rounded" style={{ backgroundColor: colors.bgSecondary, border: `1px solid ${colors.borderPrimary}` }}>
                  <div className="text-center">
                    <div className="text-4xl mb-3">📄</div>
                    <p className="font-medium mb-2" style={{ color: colors.textPrimary }}>
                      {schemas.find(s => s.id === selectedSchemaId)?.name || 'schema'}_v{selectedVersion}_{getExportFormat()}_export.sql
                    </p>
                    <p className="text-sm" style={{ color: colors.textMuted }}>
                      {getExportFormat() === 'postgresql' ? 'PostgreSQL' : 'MySQL'} CREATE TABLE{t.databaseexportmodal928}
                    </p>
                  </div>
                </div>

                {/* Download Button */}
                <div className="flex justify-center">
                  <button
                    onClick={() => exportSchema(true)}
                    disabled={loading || !selectedSchemaId || selectedVersion === null}
                    className="px-6 py-3 rounded font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
                    style={{ backgroundColor: colors.accent, color: 'white' }}
                  >
                    {loading && <i className="pi pi-spinner pi-spin mr-2"></i>}
                    <i className="pi pi-download mr-2"></i>
                    {t.databaseexportmodal943}
                  </button>
                </div>
              </div>
            </TabPanel>

            {/* Direct Database Export Tab */}
            <TabPanel header={<span><i className="pi pi-server mr-2" />{t.databaseexportmodal814}</span>}>
              <div className="space-y-4">
                {renderSchemaSelection()}

                {/* Database Connection Form */}
                <div className="p-4 rounded" style={{ backgroundColor: colors.bgSecondary, border: `1px solid ${colors.borderPrimary}` }}>
                  <h4 className="text-sm font-medium mb-4" style={{ color: colors.textPrimary }}>{t.databaseexportmodal956}</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
                        {t.databaseexportmodal960}
                      </label>
                      <select
                        value={dbConnectionType}
                        onChange={(e) => {
                          const type = e.target.value as 'mysql' | 'postgresql' | 'mssql';
                          setDbConnectionType(type);
                          // Auto-update port based on connection type
                          if (type === 'mysql') setDbPort('3306');
                          else if (type === 'postgresql') setDbPort('5432');
                          else if (type === 'mssql') setDbPort('1433');
                          // Reset connection test results when type changes
                          setConnectionTestResult(null);
                          setAvailableDatabases([]);
                          setAvailableSchemas([]);
                          // Auto-set schema for PostgreSQL
                          if (type === 'postgresql' && !dbSchemaName) {
                            setDbSchemaName('public');
                          } else if (type !== 'postgresql') {
                            setDbSchemaName('');
                          }
                        }}
                        className="w-full px-3 py-2 rounded focus:outline-none"
                        style={{ backgroundColor: colors.bgTertiary, border: `1px solid ${colors.borderPrimary}`, color: colors.textPrimary }}
                        disabled={servicePolling || testingConnection}
                      >
                        <option value="mysql">MySQL</option>
                        <option value="postgresql">PostgreSQL</option>
                        <option value="mssql">MS SQL Server</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
                        {t.databaseexportmodal993}
                      </label>
                      <input
                        type="text"
                        value={dbHost}
                        onChange={(e) => setDbHost(e.target.value)}
                        placeholder="localhost"
                        className="w-full px-3 py-2 rounded focus:outline-none"
                        style={{ backgroundColor: colors.bgTertiary, border: `1px solid ${colors.borderPrimary}`, color: colors.textPrimary }}
                        disabled={servicePolling || testingConnection}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
                        {t.databaseexportmodal1007}
                      </label>
                      <input
                        type="text"
                        value={dbPort}
                        onChange={(e) => setDbPort(e.target.value)}
                        placeholder="3306"
                        className="w-full px-3 py-2 rounded focus:outline-none"
                        style={{ backgroundColor: colors.bgTertiary, border: `1px solid ${colors.borderPrimary}`, color: colors.textPrimary }}
                        disabled={servicePolling || testingConnection}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
                        {t.databaseexportmodal1021}
                      </label>
                      <input
                        type="text"
                        value={dbUsername}
                        onChange={(e) => setDbUsername(e.target.value)}
                        placeholder="root"
                        className="w-full px-3 py-2 rounded focus:outline-none"
                        style={{ backgroundColor: colors.bgTertiary, border: `1px solid ${colors.borderPrimary}`, color: colors.textPrimary }}
                        disabled={servicePolling || testingConnection}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
                        {t.databaseexportmodal1035}
                      </label>
                      <input
                        type="password"
                        value={dbPassword}
                        onChange={(e) => setDbPassword(e.target.value)}
                        placeholder="password"
                        className="w-full px-3 py-2 rounded focus:outline-none"
                        style={{ backgroundColor: colors.bgTertiary, border: `1px solid ${colors.borderPrimary}`, color: colors.textPrimary }}
                        disabled={servicePolling || testingConnection}
                        autoComplete="new-password"
                      />
                    </div>
                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={handleTestConnection}
                        disabled={testingConnection || servicePolling || !dbHost || !dbUsername}
                        className="w-full px-4 py-2 rounded font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
                        style={{ backgroundColor: colors.successText, color: colors.textInverse }}
                      >
                        {testingConnection ? t.databaseexportmodal1055 : t.databaseexportmodal1055_2}
                      </button>
                    </div>
                  </div>

                  {/* Connection Test Result */}
                  {connectionTestResult && (
                    <div className="mt-4 p-3 rounded" style={{
                      backgroundColor: connectionTestResult.success ? colors.successBg : colors.errorBg,
                      border: `1px solid ${connectionTestResult.success ? colors.successText : colors.errorText}`
                    }}>
                      {connectionTestResult.success ? (
                        <div>
                          <div className="flex items-center gap-2 font-medium mb-2" style={{ color: colors.successText }}>
                            <span>✅</span>{t.databaseexportmodal1069}
                            {connectionTestResult.server_version && (
                              <span className="text-xs" style={{ color: colors.successText }}>({connectionTestResult.server_version})</span>
                            )}
                          </div>
                          {availableDatabases.length > 0 && (
                            <div className="text-sm" style={{ color: colors.successText }}>
                              {t.databaseexportmodal1076}{availableDatabases.length}{t.databaseexportmodal1076_2}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2" style={{ color: colors.errorText }}>
                          <span>❌</span> {connectionTestResult.error}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Database Selection */}
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
                        {t.databaseexportmodal1092}{availableDatabases.length > 0 && <span className="text-xs" style={{ color: colors.successText }}>({availableDatabases.length} available)</span>}
                      </label>
                      {/* Always show text input for free database name entry */}
                      <input
                        type="text"
                        value={dbDatabase}
                        onChange={(e) => setDbDatabase(e.target.value)}
                        placeholder="database_name"
                        list="available-databases-list"
                        className="w-full px-3 py-2 rounded focus:outline-none"
                        style={{ backgroundColor: colors.bgTertiary, border: `1px solid ${colors.borderPrimary}`, color: colors.textPrimary }}
                        disabled={servicePolling || testingConnection}
                      />
                      {/* Datalist for autocomplete suggestions from available databases */}
                      {availableDatabases.length > 0 && (
                        <datalist id="available-databases-list">
                          {availableDatabases.map(db => (
                            <option key={db} value={db} />
                          ))}
                        </datalist>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
                        {t.databaseexportmodal1116}
                        {dbConnectionType === 'postgresql' && (
                          <span className="text-xs ml-1" style={{ color: colors.infoText }}>{t.databaseexportmodal1118}</span>
                        )}
                        {dbConnectionType !== 'postgresql' && (
                          <span className="text-xs ml-1" style={{ color: colors.textMuted }}>{t.databaseexportmodal1121}</span>
                        )}
                      </label>
                      {/* Always show text input for free schema name entry */}
                      <input
                        type="text"
                        value={dbSchemaName}
                        onChange={(e) => setDbSchemaName(e.target.value)}
                        placeholder={dbConnectionType === 'postgresql' ? 'public' : t.databaseexportmodal1129}
                        list="available-schemas-list"
                        className="w-full px-3 py-2 rounded focus:outline-none"
                        style={{ backgroundColor: colors.bgTertiary, border: `1px solid ${colors.borderPrimary}`, color: colors.textPrimary }}
                        disabled={servicePolling || testingConnection}
                      />
                      {/* Datalist for autocomplete suggestions from available schemas */}
                      {availableSchemas.length > 0 && (
                        <datalist id="available-schemas-list">
                          {availableSchemas.map(schema => (
                            <option key={schema} value={schema} />
                          ))}
                        </datalist>
                      )}
                    </div>
                  </div>
                </div>

                {/* Export Options */}
                <div className="p-4 rounded" style={{ backgroundColor: colors.bgSecondary, border: `1px solid ${colors.borderPrimary}` }}>
                  <h4 className="text-sm font-medium mb-3" style={{ color: colors.textPrimary }}>{t.databaseexportmodal1149}</h4>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={dropTablesFirst}
                      onChange={(e) => setDropTablesFirst(e.target.checked)}
                      className="w-4 h-4 rounded"
                      style={{ accentColor: colors.accent }}
                      disabled={servicePolling}
                    />
                    <span className="text-sm" style={{ color: colors.textSecondary }}>
                      {t.databaseexportmodal1160}
                    </span>
                  </label>
                  <div className="mt-2 text-xs" style={{ color: colors.warningText }}>
                    {t.databaseexportmodal1164}
                  </div>
                </div>

                {/* Export Button */}
                <div className="flex justify-center pt-4">
                  <button
                    type="button"
                    onClick={handleDatabaseExport}
                    disabled={serviceTaskId !== null || testingConnection || !dbDatabase || !selectedSchemaId || selectedVersion === null || (dbConnectionType === 'postgresql' && !dbSchemaName)}
                    className="px-6 py-3 rounded font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
                    style={{ backgroundColor: colors.buttonPrimary, color: colors.textInverse }}
                  >
                    {servicePolling ? t.databaseexportmodal1177 : serviceTaskId ? t.databaseexportmodal1177_2 : t.databaseexportmodal1177_4}
                  </button>
                </div>

                {/* Live Log */}
                {serviceLog.length > 0 && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
                      {t.databaseexportmodal1185}
                    </label>
                    <div className="rounded p-4 max-h-48 overflow-y-scroll font-mono text-xs" style={{ backgroundColor: colors.bgTertiary, border: `1px solid ${colors.borderPrimary}` }}>
                      {serviceLog.map((log, index) => (
                        <div key={index} className="mb-1" style={{ color: colors.textSecondary }}>
                          {log}
                        </div>
                      ))}
                      <div ref={logEndRef} />
                    </div>
                  </div>
                )}
              </div>
            </TabPanel>
          </TabViewSideMenu>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-4 flex-shrink-0" style={{ borderTop: `1px solid ${colors.borderPrimary}`, backgroundColor: colors.bgSecondary }}>
          <button
            type="button"
            onClick={handleClose}
            disabled={loading || servicePolling}
            className="px-6 py-2 rounded font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
            style={{ backgroundColor: colors.bgTertiary, color: colors.textPrimary, border: `1px solid ${colors.borderPrimary}` }}
          >
            {servicePolling ? t.databaseexportmodal1211 : t.databaseexportmodal1211_2}
          </button>
        </div>

        {/* Hidden download link */}
        <a ref={downloadLinkRef} style={{ display: 'none' }} />
      </div>

      {/* Theme-aware CSS for PrimeReact components */}
      <style>{`
        /* Placeholder styling for input fields */
        .database-export-modal input::placeholder,
        .database-export-modal select::placeholder {
          color: ${colors.textMuted} !important;
          opacity: 0.7;
        }
        /* Native select styling */
        .database-export-modal select {
          background-color: ${colors.bgTertiary} !important;
          border: 1px solid ${colors.borderPrimary} !important;
          color: ${colors.textPrimary} !important;
          border-radius: 0.5rem !important;
          appearance: auto !important;
        }
        .database-export-modal select option {
          background-color: ${colors.bgSecondary} !important;
          color: ${colors.textPrimary} !important;
        }
        /* PrimeReact Dropdown styles - theme colors only, no layout changes */
        .database-export-modal .p-dropdown {
          background: ${colors.bgTertiary} !important;
          border: 1px solid ${colors.borderPrimary} !important;
        }
        .database-export-modal .p-dropdown .p-dropdown-label {
          color: ${colors.textPrimary} !important;
        }
        .database-export-modal .p-dropdown .p-dropdown-label.p-placeholder {
          color: ${colors.textMuted} !important;
        }
        .database-export-modal .p-dropdown .p-dropdown-trigger {
          color: ${colors.textMuted} !important;
        }
        .custom-dropdown-panel {
          background: ${colors.bgSecondary} !important;
          border: 1px solid ${colors.borderPrimary} !important;
        }
        .custom-dropdown-panel .p-dropdown-items-wrapper {
          background: ${colors.bgSecondary} !important;
        }
        .custom-dropdown-panel .p-dropdown-items {
          background: ${colors.bgSecondary} !important;
        }
        .custom-dropdown-panel .p-dropdown-item {
          color: ${colors.textPrimary} !important;
        }
        .custom-dropdown-panel .p-dropdown-item:hover {
          background: ${colors.bgTertiary} !important;
        }
        .custom-dropdown-panel .p-dropdown-item.p-highlight {
          background: ${colors.accent} !important;
          color: white !important;
        }
        /* Prism.js base styles - theme-aware (no external theme imported) */
        .database-export-modal code[class*="language-"],
        .database-export-modal pre[class*="language-"] {
          color: ${colors.textPrimary} !important;
          background: none !important;
          text-shadow: none !important;
          font-family: Consolas, Monaco, 'Andale Mono', 'Ubuntu Mono', monospace !important;
          font-size: 0.875rem !important;
          text-align: left !important;
          white-space: pre-wrap !important;
          word-spacing: normal !important;
          word-break: normal !important;
          word-wrap: normal !important;
          line-height: 1.5 !important;
          tab-size: 4 !important;
          hyphens: none !important;
        }
        /* Token styles - theme-aware */
        .database-export-modal .token {
          color: ${colors.textPrimary} !important;
        }
        .database-export-modal .token.keyword {
          color: ${colors.accent} !important;
          font-weight: 600 !important;
        }
        .database-export-modal .token.string,
        .database-export-modal .token.char {
          color: ${colors.successText} !important;
        }
        .database-export-modal .token.number,
        .database-export-modal .token.boolean {
          color: ${colors.warningText} !important;
        }
        .database-export-modal .token.comment {
          color: ${colors.textMuted} !important;
          font-style: italic !important;
        }
        .database-export-modal .token.operator,
        .database-export-modal .token.punctuation {
          color: ${colors.textSecondary} !important;
        }
        .database-export-modal .token.function {
          color: ${colors.accent} !important;
        }
        .database-export-modal .token.class-name,
        .database-export-modal .token.constant {
          color: ${colors.warningText} !important;
        }
        /* react-simple-code-editor specific styles - override inline -webkit-text-fill-color */
        .database-export-modal .npm__react-simple-code-editor__textarea {
          -webkit-text-fill-color: ${colors.textPrimary} !important;
          color: ${colors.textPrimary} !important;
          caret-color: ${colors.textPrimary} !important;
        }
        .database-export-modal pre {
          color: ${colors.textPrimary} !important;
          -webkit-text-fill-color: ${colors.textPrimary} !important;
        }
        .database-export-modal pre * {
          -webkit-text-fill-color: inherit !important;
        }
      `}</style>
    </Dialog>
  );
}
