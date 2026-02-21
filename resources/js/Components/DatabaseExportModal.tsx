// resources/js/Components/DatabaseExportModal.tsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { useProject } from '@/contexts/ProjectContext';
import { useTheme } from '@/contexts/ThemeContext';
import Editor from 'react-simple-code-editor';
import Prism from 'prismjs';
import 'prismjs/components/prism-sql';
// Note: We don't import a Prism theme - we use our own theme-aware styles instead
import { useTranslation, SupportedLanguage, getStoredLanguage } from '@/i18n';

interface DatabaseExportModalProps {
  isOpen: boolean;
  onClose: () => void;
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

export default function DatabaseExportModal({ isOpen, onClose }: DatabaseExportModalProps) {
  // i18n setup
  const [currentLanguage] = React.useState<SupportedLanguage>(getStoredLanguage());
  const { t } = useTranslation(currentLanguage);
  const { colors } = useTheme();
  const { selectedProject } = useProject();
  const [schemas, setSchemas] = useState<DatabaseSchema[]>([]);
  const [selectedSchemaId, setSelectedSchemaId] = useState<number | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<number | null>(null);
  const [schemaVersions, setSchemaVersions] = useState<SchemaVersion[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingSchemas, setLoadingSchemas] = useState(false);
  const [loadingVersions, setLoadingVersions] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [exportedSQL, setExportedSQL] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'view' | 'download' | 'database'>('view');
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

  // Export options
  const [dropTablesFirst, setDropTablesFirst] = useState(true);

  const loadSchemas = useCallback(async () => {
    if (!selectedProject) return;

    setLoadingSchemas(true);
    setError(null);

    try {
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      const response = await fetch(`/api/projects/${selectedProject.id}/schemas`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(t.databaseexportmodal71);
      }

      const data = await response.json();

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

      // Auto-select first schema if available
      if (schemasArray && schemasArray.length > 0) {
        setSelectedSchemaId(schemasArray[0].id);
      }
    } catch (error) {
      // Error loading schemas
      setError(error instanceof Error ? error.message : t.databaseexportmodal71);
      setSchemas([]);
    } finally {
      setLoadingSchemas(false);
    }
  }, [selectedProject]);

  const loadSchemaVersions = async (schemaId: number) => {
    setLoadingVersions(true);
    setError(null);

    try {
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      const response = await fetch(`/api/floating-schemas/${schemaId}/versions`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(t.databaseexportmodal114);
      }

      const data = await response.json();

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
    setActiveTab('view');
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
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');

      const response = await fetch(`/api/schemas/${selectedSchemaId}/export/${exportFormat}?version=${selectedVersion}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(t.databaseexportmodal214);
        } else if (response.status === 403) {
          throw new Error(t.databaseexportmodal216);
        } else {
          throw new Error(`Export failed: HTTP ${response.status}`);
        }
      }

      const data = await response.json();

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
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (!token) {
        throw new Error(t.databaseexportmodal382);
      }

      // Create connection test task
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

      const response = await fetch('/cli/svc/tasks/connection-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
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
          const statusResponse = await fetch(`/cli/svc/tasks/${taskId}`, {
            headers: {
              'Accept': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
          });

          const statusResult = await statusResponse.json();
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

      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (!token) {
        throw new Error(t.databaseexportmodal531);
      }

      // First, get the SQL export
      const exportFormat = getExportFormat();
      setServiceLog(prev => [...prev, `${t.databaseexportmodal536}${exportFormat.toUpperCase()}${t.databaseexportmodal536_2}`]);

      const exportResponse = await fetch(`/api/schemas/${selectedSchemaId}/export/${exportFormat}?version=${selectedVersion}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (!exportResponse.ok) {
        throw new Error(t.databaseexportmodal547);
      }

      const exportData = await exportResponse.json();
      if (!exportData.success || !exportData.sql) {
        throw new Error(exportData.error || t.databaseexportmodal552);
      }

      setServiceLog(prev => [...prev, `${t.databaseexportmodal555}(${exportData.table_count}${t.databaseexportmodal555_2})`]);

      // Create export task
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

      const response = await fetch('/cli/svc/tasks/database-export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || t.databaseexportmodal588);
      }

      setServiceTaskId(result.task_id);
      setServiceLog(prev => [...prev, `${t.databaseexportmodal592}${result.task_id})`, t.databaseexportmodal592_2]);

      // Start polling
      startPolling(result.task_id, token);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start export');
      setServicePolling(false);
      setServiceLog(prev => [...prev, `${t.databaseexportmodal600}${err instanceof Error ? err.message : t.databaseexportmodal600_2}`]);
    }
  };

  const startPolling = (taskId: number, token: string) => {
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
        const response = await fetch(`/cli/svc/tasks/${taskId}`, {
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || t.databaseexportmodal628);
        }

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
      style={{ width: '60vw', maxWidth: '900px', minHeight: '70vh', backgroundColor: colors.bgSecondary, border: `1px solid ${colors.borderPrimary}` }}
      modal
      closable={!loading && !servicePolling}
      draggable={true}
      resizable={true}
      className="database-export-modal"
      contentStyle={{
        padding: '0',
        backgroundColor: colors.bgSecondary,
        color: colors.textPrimary,
        height: '70vh',
        overflow: 'hidden'
      }}
      headerStyle={{
        backgroundColor: colors.dialogHeader,
        color: colors.textPrimary,
        borderBottom: `1px solid ${colors.borderPrimary}`
      }}
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

        {/* Tabs */}
        <div className="flex" style={{ borderBottom: `1px solid ${colors.borderPrimary}` }}>
          <button
            type="button"
            onClick={() => setActiveTab('view')}
            className="px-6 py-3 text-sm font-medium transition-colors"
            style={{
              color: activeTab === 'view' ? colors.accent : colors.textMuted,
              borderBottom: activeTab === 'view' ? `2px solid ${colors.accent}` : '2px solid transparent',
              backgroundColor: activeTab === 'view' ? colors.bgSecondary : 'transparent'
            }}
          >
            {t.databaseexportmodal790}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('download')}
            className="px-6 py-3 text-sm font-medium transition-colors"
            style={{
              color: activeTab === 'download' ? colors.accent : colors.textMuted,
              borderBottom: activeTab === 'download' ? `2px solid ${colors.accent}` : '2px solid transparent',
              backgroundColor: activeTab === 'download' ? colors.bgSecondary : 'transparent'
            }}
          >
            {t.databaseexportmodal802}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('database')}
            className="px-6 py-3 text-sm font-medium transition-colors"
            style={{
              color: activeTab === 'database' ? colors.accent : colors.textMuted,
              borderBottom: activeTab === 'database' ? `2px solid ${colors.accent}` : '2px solid transparent',
              backgroundColor: activeTab === 'database' ? colors.bgSecondary : 'transparent'
            }}
          >
            {t.databaseexportmodal814}
          </button>
        </div>

        <div className="flex-1 overflow-auto">
          {/* Success Display */}
          {successMessage && (
            <div className="mx-6 mt-4 p-3 rounded" style={{ backgroundColor: colors.successBg, border: `1px solid ${colors.successText}`, color: colors.successText }}>
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

          {/* Error Display */}
          {error && (
            <div className="mx-6 mt-4 p-3 rounded" style={{ backgroundColor: colors.errorBg, border: `1px solid ${colors.errorText}`, color: colors.errorText }}>
              <div className="flex items-center">
                <span className="mr-2">⚠️</span>
                <span>{error}</span>
              </div>
            </div>
          )}

          {/* Tab Content */}
          <div className="p-6">
            {/* View SQL Tab */}
            {activeTab === 'view' && (
              <div>
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

                {/* SQL Output Viewer */}
                {exportedSQL && (
                  <div className="rounded" style={{ border: `1px solid ${colors.borderPrimary}` }}>
                    <div className="flex justify-between items-center p-3 rounded-t" style={{ backgroundColor: colors.bgSecondary }}>
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
                    <div className="h-64 overflow-auto" style={{ backgroundColor: colors.bgTertiary }}>
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
            )}

            {/* Download SQL Tab */}
            {activeTab === 'download' && (
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
            )}

            {/* Direct Database Export Tab */}
            {activeTab === 'database' && (
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
                      DROP TABLE IF EXISTS vor CREATEt.databaseexportmodal1160
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
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-4" style={{ borderTop: `1px solid ${colors.borderPrimary}`, backgroundColor: colors.bgSecondary }}>
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
