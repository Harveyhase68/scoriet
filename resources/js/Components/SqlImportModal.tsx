// resources/js/Components/SqlImportModal.tsx
import React, { useState, useRef, useEffect } from 'react';
import { Dialog } from 'primereact/dialog';
import { useProject } from '@/contexts/ProjectContext';
import { useTranslation, SupportedLanguage, getStoredLanguage } from '@/i18n';
import { useTheme } from '@/contexts/ThemeContext';

interface SqlImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (result: any) => void;
  preselectedSchemaId?: number;
}

interface FloatingSchema {
  id: number;
  name: string;
  description?: string;
  current_version: number;
  last_version: number;
  projects?: Array<{ id: number; name: string; }>;
}

export default function SqlImportModal({ isOpen, onClose, onSuccess, preselectedSchemaId }: SqlImportModalProps) {
  // i18n setup
  const [currentLanguage] = React.useState<SupportedLanguage>(getStoredLanguage());
  const { t } = useTranslation(currentLanguage);
  // Theme
  const { colors } = useTheme();

  const { selectedProject } = useProject();
  const [sqlScript, setSqlScript] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'paste' | 'upload' | 'service'>('paste');
  const [schemas, setSchemas] = useState<FloatingSchema[]>([]);
  const [selectedSchemaId, setSelectedSchemaId] = useState<number | null>(preselectedSchemaId || null);
  const [loadingSchemas, setLoadingSchemas] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Import options
  const [appendToCurrentVersion, setAppendToCurrentVersion] = useState(false);
  const [skipBreakingChangeCheck, setSkipBreakingChangeCheck] = useState(false);

  // FK validation state
  const [showFkWarning, setShowFkWarning] = useState(false);
  const [missingFkTables, setMissingFkTables] = useState<string[]>([]);
  const [fkDetails, setFkDetails] = useState<Array<{from_table: string; to_table: string; columns: string[]; references_columns: string[];}>>([]);
  const [validating, setValidating] = useState(false);
  const fkWarningRef = useRef<HTMLDivElement>(null);
  const modalContentRef = useRef<HTMLDivElement>(null);

  // Service import states
  const [serviceConnectionType, setServiceConnectionType] = useState<'mysql' | 'postgresql' | 'sqlite' | 'mssql'>('mysql');
  const [serviceHost, setServiceHost] = useState('localhost');
  const [servicePort, setServicePort] = useState('3306');
  const [serviceDatabase, setServiceDatabase] = useState('');
  const [serviceUsername, setServiceUsername] = useState('root');
  const [servicePassword, setServicePassword] = useState('');
  const [serviceSchemaName, setServiceSchemaName] = useState('');
  const [serviceTaskId, setServiceTaskId] = useState<number | null>(null);
  const [serviceLog, setServiceLog] = useState<string[]>([]);
  const [servicePolling, setServicePolling] = useState(false);
  const logEndRef = useRef<HTMLDivElement>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Connection test states
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

  const resetModal = () => {
    setSqlScript('');
    setDescription('');
    setError(null);
    setSuccessMessage(null);
    setActiveTab('paste');
    setSelectedSchemaId(preselectedSchemaId || null);
    setAppendToCurrentVersion(false);
    setSkipBreakingChangeCheck(false);
    setShowFkWarning(false);
    setMissingFkTables([]);
    setFkDetails([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    // Don't reset service import state - keep it for async tracking
  };

  const resetServiceState = () => {
    // Completely reset service import state
    setServiceTaskId(null);
    setServiceLog([]);
    setServicePolling(false);
    setError(null);
    setConnectionTestResult(null);
    setAvailableDatabases([]);
    setAvailableSchemas([]);
  };

  const handleClose = () => {
    if (!loading && !servicePolling && !serviceTaskId) {
      // Only reset if not importing AND no task exists
      resetModal();
      onClose();
    } else {
      // Just close modal, keep state for later
      onClose();
    }
  };

  const handleCancelTask = async () => {
    if (!serviceTaskId) return;

    const confirmed = window.confirm(t.sqlimportmodal124);
    if (!confirmed) return;

    try {
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (!token) return;

      // Delete the task
      await fetch(`/cli/svc/tasks/${serviceTaskId}/cancel`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      setServiceLog(prev => [...prev, '', t.sqlimportmodal140]);
      setServicePolling(false);
      resetServiceState();
    } catch (err) {
      setServiceLog(prev => [...prev, `${t.sqlimportmodal144}${err instanceof Error ? err.message : t.sqlimportmodal144_2}`]);
    }
  };

  // Load editable schemas when modal opens and project is available
  const loadEditableSchemas = React.useCallback(async () => {
    if (!selectedProject) {
      setSchemas([]);
      return;
    }

    setLoadingSchemas(true);
    setError(null);

    try {
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (!token) {
        throw new Error(t.applicationsmodal66);
      }

      const response = await fetch(`/api/projects/${selectedProject.id}/editable-schemas`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(t.databaseexportmodal71);
      }

      const data = await response.json();
      setSchemas(data);
      
      // Auto-select first schema if available and no preselected schema
      if (data.length > 0 && !selectedSchemaId && !preselectedSchemaId) {
        setSelectedSchemaId(data[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t.databasemanagementpanel152);
      setSchemas([]);
    } finally {
      setLoadingSchemas(false);
    }
  }, [selectedProject, preselectedSchemaId, selectedSchemaId]);

  // Set preselected schema when modal opens or preselectedSchemaId changes
  useEffect(() => {
    if (isOpen && preselectedSchemaId) {
      setSelectedSchemaId(preselectedSchemaId);
    }
  }, [isOpen, preselectedSchemaId]);

  // Load schemas when modal opens or project changes
  useEffect(() => {
    if (isOpen && selectedProject) {
      loadEditableSchemas();

      // Load database connection settings from project
      if (selectedProject.database_type) {
        const dbTypeMap: Record<string, 'mysql' | 'postgresql' | 'sqlite' | 'mssql'> = {
          'MySQL': 'mysql',
          'PostgreSQL': 'postgresql',
          'SQLite': 'sqlite',
          'MSSQL': 'mssql',
          'SQL Server': 'mssql'
        };
        setServiceConnectionType(dbTypeMap[selectedProject.database_type] || 'mysql');
      }
      if (selectedProject.database_server) {
        setServiceHost(selectedProject.database_server);
      }
      if (selectedProject.database_port) {
        setServicePort(selectedProject.database_port);
      }
      if (selectedProject.database_name) {
        setServiceDatabase(selectedProject.database_name);
      }
      if (selectedProject.database_username) {
        setServiceUsername(selectedProject.database_username);
      }
      if (selectedProject.database_password) {
        setServicePassword(selectedProject.database_password);
      }
    } else if (isOpen && !selectedProject) {
      setError(t.databaseexportmodal169);
      setSchemas([]);
    }
  }, [isOpen, selectedProject, loadEditableSchemas]);

  // Auto-scroll to bottom when log updates
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

  // Check for active tasks and resume polling if needed when modal opens
  useEffect(() => {
    if (!isOpen || !selectedProject) return;

    const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
    if (!token) return;

    // If we already have a task ID, check its status
    if (serviceTaskId) {
      fetch(`/cli/svc/tasks/${serviceTaskId}`, {
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      })
      .then(res => res.json())
      .then(result => {
        if (result.success && result.task) {
          const status = result.task.status;
          if (status === 'pending' || status === 'processing') {
            // Task is still running, resume polling
            if (!servicePolling) {
              setServiceLog(prev => [...prev, '', t.sqlimportmodal273]);
              setServicePolling(true);
              startPolling(serviceTaskId, token);
            }
          } else if (status === 'completed') {
            if (!serviceLog.some(log => log.includes(t.sqlimportmodal278))) {
              setServiceLog(prev => [...prev, '', t.sqlimportmodal279]);
            }
            setServiceTaskId(null); // Clear so user can start new import
          } else if (status === 'failed') {
            if (!serviceLog.some(log => log.includes(t.sqlimportmodal283))) {
              setServiceLog(prev => [...prev, '', `${t.sqlimportmodal284}${result.task.error_message || t.sqlimportmodal284_2}`, '', t.sqlimportmodal284_3]);
            }
            setServiceTaskId(null); // Clear so button becomes active again
          }
        }
      })
      .catch(err => {
        console.error(t.sqlimportmodal291, err);
      });
    } else {
      // No task ID yet - check if there's any pending/processing task for this user
      fetch(`/cli/svc/tasks/active`, {
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      })
      .then(res => res.json())
      .then(result => {
        if (result.success && result.task) {
          // Found an active task - load it
          const task = result.task;
          setServiceTaskId(task.id);
          setServiceLog([
            t.sqlimportmodal308,
            `${t.sqlimportmodal309}${task.id}`,
            `${t.sqlimportmodal310}${task.status}`,
            '',
          ]);

          if (task.status === 'pending' || task.status === 'processing') {
            setServicePolling(true);
            startPolling(task.id, token);
          } else if (task.status === 'completed') {
            setServiceLog(prev => [...prev, t.sqlimportmodal318]);
          } else if (task.status === 'failed') {
            setServiceLog(prev => [...prev, `${t.sqlimportmodal320}${task.error_message || t.sqlimportmodal320_2}`]);
          }
        }
      })
      .catch(err => {
        console.error(t.sqlimportmodal325, err);
      });
    }
  }, [isOpen, selectedProject]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setSqlScript(content);
        
        // Version names are auto-generated by server
      };
      reader.readAsText(file);
    }
  };

  // Get database type mapping
  const getDatabaseTypeForParser = () => {
    const databaseType = selectedProject?.database_type || 'MySQL';
    const databaseTypeMap: Record<string, string> = {
      'MySQL': 'mysql',
      'MySQL/MariaDB': 'mysql',
      'MariaDB': 'mysql',
      'PostgreSQL': 'postgresql',
      'SQLite': 'sqlite',
      'MSSQL': 'mssql',
      'SQL Server': 'mssql'
    };
    return databaseTypeMap[databaseType] || 'mysql';
  };

  // Validate SQL for missing FK references
  const validateSqlImport = async (): Promise<boolean> => {
    const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
    if (!token) {
      return true; // Skip validation if no token
    }

    try {
      setValidating(true);
      setError(null);

      const payload = {
        sql_script: sqlScript,
        schema_id: selectedSchemaId,
        database_type: getDatabaseTypeForParser(),
        append_to_current_version: appendToCurrentVersion,
      };

      const response = await fetch('/api/sql-validate-import', {
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
        setError(result.error || t.sqlimportmodal390);
        return false;
      }

      // Check for missing FK references
      if (result.has_missing_references && result.missing_fk_tables.length > 0) {
        setMissingFkTables(result.missing_fk_tables);
        setFkDetails(result.fk_details || []);
        setShowFkWarning(true);

        // Scroll to top of modal content to show the warning
        setTimeout(() => {
          if (modalContentRef.current) {
            modalContentRef.current.scrollTop = 0;
          }
          if (fkWarningRef.current) {
            fkWarningRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 100);

        return false; // Don't proceed, show warning instead
      }

      return true; // All good, proceed with import
    } catch (err) {
      console.error(t.sqlimportmodal415, err);
      setError(err instanceof Error ? err.message : t.sqlimportmodal416);
      return false;
    } finally {
      setValidating(false);
    }
  };

  // Execute the actual import
  const executeImport = async () => {
    try {
      setLoading(true);
      setError(null);
      setShowFkWarning(false);

      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (!token) {
        throw new Error(t.panelt2405);
      }

      const payload = {
        sql_script: sqlScript,
        schema_id: selectedSchemaId,
        description: description || null,
        database_type: getDatabaseTypeForParser(),
        append_to_current_version: appendToCurrentVersion,
        skip_breaking_change_check: skipBreakingChangeCheck,
      };

      const response = await fetch('/api/sql-parse-and-store', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      // Try to parse JSON response
      let result: any;
      try {
        result = await response.json();
      } catch {
        // If JSON parsing fails, get text response for debugging
        const textResponse = await response.text();
        console.error(t.sqlimportmodal461, textResponse);
        throw new Error(`${t.sqlimportmodal462}(${response.status}): ${response.statusText}\n\n${t.sqlimportmodal462}${textResponse.substring(0, 500)}${textResponse.length > 500 ? '...' : ''}`);
      }

      if (!response.ok || !result.success) {
        // Create detailed error message
        let errorMessage = result.error || t.sqlimportmodal177;

        if (result.error_type) {
          errorMessage = `${result.error_type}: ${errorMessage}`;
        }

        if (result.suggestion) {
          errorMessage += `\n\n${t.sqlimportmodal474}${result.suggestion}`;
        }

        if (result.sql_location) {
          errorMessage += `\n\n${t.sqlimportmodal478}${result.sql_location}`;
        }

        if (result.debug_file && result.debug_line) {
          errorMessage += `\n\n${t.sqlimportmodal482}${result.debug_file}:${result.debug_line}`;
        }

        // Add full result for debugging
        console.error(t.sqlimportmodal486, result);

        throw new Error(errorMessage);
      }

      // Success! Show success message but keep modal open
      onSuccess(result);

      // Show success message
      const tableCount = result.tables_count || result.tables_created || result.tables_imported || 0;
      setError(null);
      setSqlScript(''); // Clear the SQL script
      setDescription(''); // Clear description
      setShowFkWarning(false);
      setMissingFkTables([]);
      setFkDetails([]);
      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Use a simple alert-style success state (reuse error display with different styling)
      setSuccessMessage(`${t.sqlimportmodal508}${tableCount}${t.sqlimportmodal508_2}`);

      // Reload schemas to show updated version numbers
      await loadEditableSchemas();

    } catch (err) {
      setError(err instanceof Error ? err.message : t.sqlimportmodal203);
      setSuccessMessage(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(null); // Clear any previous success message

    if (!sqlScript.trim()) {
      setError(t.sqlparsercontroller29);
      return;
    }

    if (!selectedSchemaId) {
      setError(t.sqlimportmodal134);
      return;
    }

    if (!selectedProject) {
      setError(t.databaseexportmodal344);
      return;
    }

    // If FK warning is already shown and user clicked import again, proceed
    if (showFkWarning) {
      await executeImport();
      return;
    }

    // First validate for missing FK references
    const isValid = await validateSqlImport();
    if (isValid) {
      await executeImport();
    }
    // If not valid and has missing FKs, showFkWarning will be set to true
  };

  const handleTestConnection = async () => {
    setTestingConnection(true);
    setError(null);
    setConnectionTestResult(null);
    setServiceLog([t.sqlimportmodal558]);

    try {
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (!token) {
        throw new Error(t.sqlimportmodal563);
      }

      // Create connection test task
      const payload = {
        payload: {
          connection_type: serviceConnectionType,
          host: serviceHost,
          port: parseInt(servicePort),
          database: serviceDatabase || undefined,
          username: serviceUsername,
          password: servicePassword,
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
        throw new Error(result.message || t.sqlimportmodal591);
      }

      setServiceLog(prev => [...prev, `${t.sqlimportmodal594}${result.task_id})`, t.sqlimportmodal594_2]);

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
                `${t.sqlimportmodal636}`,
                `${t.sqlimportmodal637}${taskResult.server_version || t.sqlimportmodal637_2}`,
                `${t.sqlimportmodal638}${dbCount}${t.sqlimportmodal638_2}`,
                ...(schemaCount > 0 ? [`${t.sqlimportmodal639}${schemaCount}${t.sqlimportmodal639_2}`] : []),
              ]);

              // Auto-select database if only one available
              if (taskResult.databases?.length === 1 && !serviceDatabase) {
                setServiceDatabase(taskResult.databases[0]);
              }

              // Auto-set schema name for PostgreSQL
              if (serviceConnectionType === 'postgresql' && !serviceSchemaName) {
                if (taskResult.schemas?.includes('public')) {
                  setServiceSchemaName('public');
                } else if (taskResult.schemas?.length === 1) {
                  setServiceSchemaName(taskResult.schemas[0]);
                }
              }
            } else {
              setConnectionTestResult({
                success: false,
                error: taskResult.error || t.sqlimportmodal658,
              });
              setServiceLog(prev => [...prev, `❌ ${taskResult.error || t.sqlimportmodal660}`]);
              setError(taskResult.error || t.sqlimportmodal661);
            }
          } else if (taskData.status === 'failed') {
            clearInterval(pollInterval);
            setTestingConnection(false);
            setConnectionTestResult({
              success: false,
              error: taskData.error_message || t.sqlimportmodal668,
            });
            setServiceLog(prev => [...prev, `❌ ${taskData.error_message || t.sqlimportmodal670}`]);
            setError(taskData.error_message || t.sqlimportmodal671);
          } else if (pollCount >= maxPolls) {
            clearInterval(pollInterval);
            setTestingConnection(false);
            setServiceLog(prev => [...prev, t.sqlimportmodal675]);
            setError(t.sqlimportmodal676);
          }
        } catch (err) {
          clearInterval(pollInterval);
          setTestingConnection(false);
          setServiceLog(prev => [...prev, `${t.sqlimportmodal681}${err instanceof Error ? err.message : t.sqlimportmodal681_2}`]);
          setError(err instanceof Error ? err.message : t.sqlimportmodal682);
        }
      }, 1000); // Poll every second for quick feedback

    } catch (err) {
      setTestingConnection(false);
      setServiceLog(prev => [...prev, `${t.sqlimportmodal688}${err instanceof Error ? err.message : t.sqlimportmodal688_2}`]);
      setError(err instanceof Error ? err.message : t.sqlimportmodal689);
    }
  };

  const handleServiceImport = async () => {
    if (!selectedSchemaId || !serviceDatabase) {
      setError(t.sqlimportmodal695);
      return;
    }

    // Check if there's already a running task
    if (serviceTaskId) {
      setError(t.sqlimportmodal701);
      return;
    }

    try {
      setError(null);
      setServicePolling(true);
      setServiceLog([t.sqlimportmodal708]);

      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (!token) {
        throw new Error(t.sqlimportmodal712);
      }

      // Create task
      const payload = {
        task_type: 'database_import',
        payload: {
          connection_type: serviceConnectionType,
          host: serviceHost,
          port: parseInt(servicePort),
          database: serviceDatabase,
          username: serviceUsername,
          password: servicePassword,
          schema_name: serviceSchemaName,
          target_schema_id: selectedSchemaId,
          description: description || null,
        }
      };

      const response = await fetch('/cli/svc/tasks/database-import', {
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
        throw new Error(result.message || t.sqlimportmodal744);
      }

      setServiceTaskId(result.task_id);
      setServiceLog(prev => [...prev, `${t.sqlimportmodal748}${result.task_id})`, t.sqlimportmodal748_2]);

      // Start polling
      startPolling(result.task_id, token);

    } catch (err) {
      setError(err instanceof Error ? err.message : t.sqlimportmodal754);
      setServicePolling(false);
      setServiceLog(prev => [...prev, `${t.sqlimportmodal756}${err instanceof Error ? err.message : t.sqlimportmodal756_2}`]);
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
          throw new Error(result.message || t.sqlimportmodal784);
        }

        const taskData = result.task;

        // Update log based on status
        if (taskData.status === 'processing') {
          setServiceLog(prev => {
            if (!prev.some(log => log.includes(t.sqlimportmodal792))) {
              return [...prev, t.sqlimportmodal793, t.sqlimportmodal793_2, t.sqlimportmodal793_3, t.sqlimportmodal793_4];
            }
            return prev;
          });
        } else if (taskData.status === 'completed') {
          setServiceLog(prev => [...prev, t.sqlimportmodal798, t.sqlimportmodal798_2, t.sqlimportmodal798_3, '', t.sqlimportmodal798_4]);
          setServicePolling(false);
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
          }

          // Call onSuccess but keep modal open
          onSuccess(result);
        } else if (taskData.status === 'failed') {
          const errorMsg = taskData.error_message || t.sqlimportmodal808;
          setServiceLog(prev => [...prev, `${t.sqlimportmodal809}${errorMsg}`, '', t.sqlimportmodal809_2]);
          setError(`Import failed: ${errorMsg}`);
          setServicePolling(false);
          setServiceTaskId(null); // Clear task ID so button becomes active again
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
          }
        }

        // Timeout check
        if (pollCount >= maxPolls) {
          setServiceLog(prev => [...prev,
            t.sqlimportmodal822,
            t.sqlimportmodal823,
          ]);

          // Mark task as failed on backend (no retry for timeout!)
          fetch(`/cli/svc/tasks/${taskId}/fail`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
              error_message: t.sqlimportmodal835,
              allow_retry: false, // Don't auto-retry timeouts
            }),
          })
          .then(() => {
            setServiceLog(prev => [...prev, t.sqlimportmodal840, '', t.sqlimportmodal840_2]);
          })
          .catch(() => {
            setServiceLog(prev => [...prev, t.sqlimportmodal843]);
          });

          setError(t.sqlimportmodal846);
          setServicePolling(false);
          setServiceTaskId(null); // Clear task ID so button becomes active again
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
          }
        }

      } catch (err) {
        setServiceLog(prev => [...prev, `${t.sqlimportmodal856}${err instanceof Error ? err.message : t.sqlimportmodal856_2}`]);
        setError(err instanceof Error ? err.message : t.sqlimportmodal857);
        setServicePolling(false);
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
      }
    }, 2000); // Poll every 2 seconds

    // Store the interval reference
    pollIntervalRef.current = pollInterval;
  };

  return (
    <Dialog
      header={t.sqlimportmodal211}
      visible={isOpen}
      onHide={handleClose}
      style={{ width: '50vw', maxWidth: '800px' }}
      modal
      closable={!loading}
      draggable={true}
      resizable={true}
      className="sql-import-modal"
      contentStyle={{
        padding: '0',
        backgroundColor: colors.dialogContent,
        color: colors.textPrimary,
        maxHeight: '80vh',
        overflow: 'auto'
      }}
      headerStyle={{
        backgroundColor: colors.dialogHeader,
        color: colors.textPrimary,
        borderBottom: `1px solid ${colors.borderPrimary}`
      }}
    >
      <div className="h-full" style={{ backgroundColor: colors.bgSecondary }}>
        <p className="text-sm px-6 pt-4 pb-2" style={{ color: colors.textMuted }}>{t.sqlimportmodal895}</p>

        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          {/* Tabs */}
          <div className="flex" style={{ borderBottom: `1px solid ${colors.borderPrimary}` }}>
            <button
              type="button"
              onClick={() => setActiveTab('paste')}
              className="px-6 py-3 text-sm font-medium transition-colors"
              style={{
                color: activeTab === 'paste' ? colors.accent : colors.textMuted,
                borderBottom: activeTab === 'paste' ? `2px solid ${colors.accent}` : 'none',
                backgroundColor: activeTab === 'paste' ? colors.bgTertiary : 'transparent'
              }}
            >
              {t.sqlimportmodal910}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('upload')}
              className="px-6 py-3 text-sm font-medium transition-colors"
              style={{
                color: activeTab === 'upload' ? colors.accent : colors.textMuted,
                borderBottom: activeTab === 'upload' ? `2px solid ${colors.accent}` : 'none',
                backgroundColor: activeTab === 'upload' ? colors.bgTertiary : 'transparent'
              }}
            >
              {t.sqlimportmodal922}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('service')}
              className="px-6 py-3 text-sm font-medium transition-colors"
              style={{
                color: activeTab === 'service' ? colors.accent : colors.textMuted,
                borderBottom: activeTab === 'service' ? `2px solid ${colors.accent}` : 'none',
                backgroundColor: activeTab === 'service' ? colors.bgTertiary : 'transparent'
              }}
            >
              {t.sqlimportmodal934}
            </button>
          </div>

          <div ref={modalContentRef} className="p-6 overflow-y-auto flex-1">
            {/* Success Display */}
            {successMessage && (
              <div className="mb-4 p-3 rounded" style={{ backgroundColor: colors.successBg, border: `1px solid ${colors.successBorder}`, color: colors.successText }}>
                <div className="flex items-center justify-between">
                  <span>{successMessage}</span>
                  <button
                    type="button"
                    onClick={() => setSuccessMessage(null)}
                    className="ml-4"
                    style={{ color: colors.successText }}
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="mb-4 p-3 rounded" style={{ backgroundColor: colors.errorBg, border: `1px solid ${colors.errorBorder}`, color: colors.errorText }}>
                <div className="flex items-center">
                  <span className="mr-2">⚠️</span>
                  <span>{error}</span>
                </div>
              </div>
            )}

            {/* FK Warning Display */}
            {showFkWarning && missingFkTables.length > 0 && (
              <div ref={fkWarningRef} className="mb-4 p-4 rounded" style={{ backgroundColor: colors.warningBg, border: `1px solid ${colors.warningBorder}` }}>
                <div className="flex items-start gap-3">
                  <span className="text-2xl">⚠️</span>
                  <div className="flex-1">
                    <h4 className="font-semibold mb-2" style={{ color: colors.warningText }}>
                      {t.sqlimportmodal973}
                    </h4>
                    <p className="text-sm mb-3" style={{ color: colors.warningText }}>
                      {t.sqlimportmodal976}
                    </p>
                    <div className="rounded p-3 mb-3" style={{ backgroundColor: colors.bgPrimary }}>
                      <ul className="list-disc list-inside space-y-1" style={{ color: colors.warningText }}>
                        {missingFkTables.map((table, index) => (
                          <li key={index} className="font-mono text-sm">{table}</li>
                        ))}
                      </ul>
                    </div>
                    {fkDetails.length > 0 && (
                      <div className="text-xs mb-3" style={{ color: colors.textMuted }}>
                        <p className="mb-1">{t.sqlimportmodal987}</p>
                        {fkDetails.map((fk, index) => (
                          <p key={index} className="font-mono ml-2">
                            {fk.from_table}.{fk.columns.join(', ')} → {fk.to_table}.{fk.references_columns.join(', ')}
                          </p>
                        ))}
                      </div>
                    )}
                    <p className="text-sm" style={{ color: colors.warningText }}>
                      {t.sqlimportmodal996}
                      {t.sqlimportmodal997}
                    </p>
                    <div className="mt-4 flex gap-3">
                      <button
                        type="submit"
                        className="px-4 py-2 text-white rounded font-medium transition-colors hover:opacity-90"
                        style={{ backgroundColor: colors.warningBorder }}
                      >
                        {t.sqlimportmodal1005}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowFkWarning(false);
                          setMissingFkTables([]);
                          setFkDetails([]);
                        }}
                        className="px-4 py-2 text-white rounded transition-colors hover:opacity-90"
                        style={{ backgroundColor: colors.bgTertiary }}
                      >
                        {t.sqlimportmodal1017}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Schema Selection and Description */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
                  {t.sqlimportmodal1029}
                </label>
                {preselectedSchemaId ? (
                  <div
                    className="w-full px-3 py-2 rounded"
                    style={{ backgroundColor: colors.bgTertiary, border: `1px solid ${colors.borderPrimary}`, color: colors.textSecondary }}
                  >
                    {schemas.find(schema => schema.id === preselectedSchemaId)?.name || `${t.sqlimportmodal1036}${preselectedSchemaId}`} (v{schemas.find(schema => schema.id === preselectedSchemaId)?.last_version ? schemas.find(schema => schema.id === preselectedSchemaId)!.last_version + 1 : '?'})
                    <span className="text-xs ml-2" style={{ color: colors.textMuted }}>(pre-selected)</span>
                  </div>
                ) : loadingSchemas ? (
                  <div className="text-sm" style={{ color: colors.textMuted }}>{t.sqlimportmodal1040}</div>
                ) : schemas.length > 0 ? (
                  <select
                    value={selectedSchemaId || ''}
                    onChange={(e) => setSelectedSchemaId(parseInt(e.target.value))}
                    className="w-full px-3 py-2 rounded focus:outline-none"
                    style={{ backgroundColor: colors.bgTertiary, border: `1px solid ${colors.borderPrimary}`, color: colors.textPrimary }}
                  >
                    {schemas.map(schema => (
                      <option key={schema.id} value={schema.id}>
                        {schema.name} (v{schema.last_version + 1})
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="text-sm" style={{ color: colors.textMuted }}>
                    {selectedProject ? t.sqlimportmodal301 : t.databaseexportmodal344}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
                  {t.sqlimportmodal1062}
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t.sqlimportmodal313}
                  className="w-full px-3 py-2 rounded focus:outline-none sql-import-input"
                  style={{ backgroundColor: colors.bgTertiary, border: `1px solid ${colors.borderPrimary}`, color: colors.textPrimary }}
                />
              </div>
            </div>

            {/* Import Options */}
            <div className="mb-4 p-3 rounded" style={{ backgroundColor: colors.bgTertiary, border: `1px solid ${colors.borderPrimary}` }}>
              <div className="text-sm font-medium mb-3" style={{ color: colors.textSecondary }}>{t.sqlimportmodal1077}</div>
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={appendToCurrentVersion}
                    onChange={(e) => setAppendToCurrentVersion(e.target.checked)}
                    className="w-4 h-4 rounded"
                  />
                  <span className="text-sm" style={{ color: colors.textSecondary }}>
                    {t.sqlimportmodal1087}
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={skipBreakingChangeCheck}
                    onChange={(e) => setSkipBreakingChangeCheck(e.target.checked)}
                    className="w-4 h-4 rounded"
                  />
                  <span className="text-sm" style={{ color: colors.textSecondary }}>
                    {t.sqlimportmodal1098}
                  </span>
                </label>
              </div>
              <div className="mt-2 text-xs" style={{ color: colors.textMuted }}>
                {t.sqlimportmodal1103}
              </div>
            </div>

            {/* Content Area */}
            {activeTab === 'paste' ? (
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
                  {t.sqlimportmodal1111}
                </label>
                <textarea
                  value={sqlScript}
                  onChange={(e) => setSqlScript(e.target.value)}
                  placeholder={t.sqlimportmodal328}
                  rows={12}
                  className="w-full px-3 py-2 rounded font-mono text-sm resize-none focus:outline-none sql-import-input"
                  style={{ backgroundColor: colors.bgTertiary, border: `1px solid ${colors.borderPrimary}`, color: colors.textPrimary }}
                />
                <div className="mt-2 text-xs" style={{ color: colors.textMuted }}>
                  {t.sqlimportmodal1122}
                  {t.sqlimportmodal1123}
                </div>
              </div>
            ) : activeTab === 'service' ? (
              <div className="space-y-4">
                {/* Database Connection Form */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
                      {t.sqlimportmodal1132}
                    </label>
                    <select
                      value={serviceConnectionType}
                      onChange={(e) => {
                        const type = e.target.value as 'mysql' | 'postgresql' | 'sqlite' | 'mssql';
                        setServiceConnectionType(type);
                        // Auto-update port based on connection type
                        if (type === 'mysql') setServicePort('3306');
                        else if (type === 'postgresql') setServicePort('5432');
                        else if (type === 'mssql') setServicePort('1433');
                        // Reset connection test results when type changes
                        setConnectionTestResult(null);
                        setAvailableDatabases([]);
                        setAvailableSchemas([]);
                        // Auto-set schema for PostgreSQL
                        if (type === 'postgresql' && !serviceSchemaName) {
                          setServiceSchemaName('public');
                        } else if (type !== 'postgresql') {
                          setServiceSchemaName('');
                        }
                      }}
                      className="w-full px-3 py-2 rounded focus:outline-none"
                      style={{ backgroundColor: colors.bgTertiary, border: `1px solid ${colors.borderPrimary}`, color: colors.textPrimary }}
                      disabled={servicePolling || testingConnection}
                    >
                      <option value="mysql">MySQL</option>
                      <option value="postgresql">PostgreSQL</option>
                      <option value="mssql">MS SQL Server</option>
                      <option value="sqlite">SQLite</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
                      {t.sqlimportmodal1166}
                    </label>
                    <input
                      type="text"
                      value={serviceHost}
                      onChange={(e) => setServiceHost(e.target.value)}
                      placeholder="localhost"
                      className="w-full px-3 py-2 rounded focus:outline-none sql-import-input"
                      style={{ backgroundColor: colors.bgTertiary, border: `1px solid ${colors.borderPrimary}`, color: colors.textPrimary }}
                      disabled={servicePolling || testingConnection}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
                      {t.sqlimportmodal1180}
                    </label>
                    <input
                      type="text"
                      value={servicePort}
                      onChange={(e) => setServicePort(e.target.value)}
                      placeholder="3306"
                      className="w-full px-3 py-2 rounded focus:outline-none sql-import-input"
                      style={{ backgroundColor: colors.bgTertiary, border: `1px solid ${colors.borderPrimary}`, color: colors.textPrimary }}
                      disabled={servicePolling || testingConnection}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
                      {t.sqlimportmodal1194}
                    </label>
                    <input
                      type="text"
                      value={serviceUsername}
                      onChange={(e) => setServiceUsername(e.target.value)}
                      placeholder="root"
                      className="w-full px-3 py-2 rounded focus:outline-none sql-import-input"
                      style={{ backgroundColor: colors.bgTertiary, border: `1px solid ${colors.borderPrimary}`, color: colors.textPrimary }}
                      disabled={servicePolling || testingConnection}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
                      {t.sqlimportmodal1208}
                    </label>
                    <input
                      type="password"
                      value={servicePassword}
                      onChange={(e) => setServicePassword(e.target.value)}
                      placeholder="password"
                      className="w-full px-3 py-2 rounded focus:outline-none sql-import-input"
                      style={{ backgroundColor: colors.bgTertiary, border: `1px solid ${colors.borderPrimary}`, color: colors.textPrimary }}
                      disabled={servicePolling || testingConnection}
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={handleTestConnection}
                      disabled={testingConnection || servicePolling || !serviceHost || !serviceUsername}
                      className="w-full px-4 py-2 rounded font-medium transition-colors disabled:cursor-not-allowed"
                      style={{
                        backgroundColor: (testingConnection || servicePolling || !serviceHost || !serviceUsername) ? colors.bgTertiary : colors.accent,
                        color: (testingConnection || servicePolling || !serviceHost || !serviceUsername) ? colors.textMuted : 'white'
                      }}
                    >
                      {testingConnection ? t.sqlimportmodal1231 : t.sqlimportmodal1231_2}
                    </button>
                  </div>
                </div>

                {/* Connection Test Result */}
                {connectionTestResult && (
                  <div
                    className="p-3 rounded"
                    style={{
                      backgroundColor: connectionTestResult.success ? colors.successBg : colors.errorBg,
                      border: `1px solid ${connectionTestResult.success ? colors.successBorder : colors.errorBorder}`
                    }}
                  >
                    {connectionTestResult.success ? (
                      <div>
                        <div className="flex items-center gap-2 font-medium mb-2" style={{ color: colors.successText }}>
                          <span>✅</span>{t.sqlimportmodal1248}
                          {connectionTestResult.server_version && (
                            <span className="text-xs" style={{ color: colors.successText }}>({connectionTestResult.server_version})</span>
                          )}
                        </div>
                        {availableDatabases.length > 0 && (
                          <div className="text-sm" style={{ color: colors.successText }}>
                            {t.sqlimportmodal1255}{availableDatabases.length}{t.sqlimportmodal1255_2}
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

                {/* Database Selection - Show dropdown if databases available, otherwise text input */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
                      {t.sqlimportmodal1271}{availableDatabases.length > 0 && <span className="text-xs" style={{ color: colors.successText }}>({availableDatabases.length}{t.sqlimportmodal1271_2})</span>}
                    </label>
                    {availableDatabases.length > 0 ? (
                      <select
                        value={serviceDatabase}
                        onChange={async (e) => {
                          const selectedDb = e.target.value;
                          setServiceDatabase(selectedDb);

                          // For PostgreSQL: Re-test connection with selected database to get schemas
                          if (serviceConnectionType === 'postgresql' && selectedDb) {
                            setAvailableSchemas([]);
                            setServiceLog(prev => [...prev, `${t.sqlimportmodal1283}'${selectedDb}'...`]);

                            try {
                              const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
                              if (!token) return;

                              // Create a new connection test task with the selected database
                              const payload = {
                                payload: {
                                  connection_type: serviceConnectionType,
                                  host: serviceHost,
                                  port: parseInt(servicePort),
                                  database: selectedDb,
                                  username: serviceUsername,
                                  password: servicePassword,
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
                              if (!result.success) return;

                              // Poll for schemas
                              const taskId = result.task_id;
                              let pollCount = 0;
                              const pollInterval = setInterval(async () => {
                                pollCount++;
                                if (pollCount > 15) {
                                  clearInterval(pollInterval);
                                  return;
                                }

                                const statusResponse = await fetch(`/cli/svc/tasks/${taskId}`, {
                                  headers: { 'Accept': 'application/json', 'Authorization': `Bearer ${token}` },
                                });
                                const statusResult = await statusResponse.json();

                                if (statusResult.task?.status === 'completed') {
                                  clearInterval(pollInterval);
                                  const taskResult = statusResult.task.result || {};
                                  if (taskResult.schemas && taskResult.schemas.length > 0) {
                                    setAvailableSchemas(taskResult.schemas);
                                    setServiceLog(prev => [...prev, `${t.sqlimportmodal1334}${taskResult.schemas.length}${t.sqlimportmodal1334_2}${taskResult.schemas.join(', ')}`]);

                                    // Auto-select 'public' if available, otherwise first schema
                                    if (taskResult.schemas.includes('public')) {
                                      setServiceSchemaName('public');
                                    } else {
                                      setServiceSchemaName(taskResult.schemas[0]);
                                    }
                                  } else {
                                    setServiceLog(prev => [...prev, `${t.sqlimportmodal1343}`]);
                                    setServiceSchemaName('public');
                                  }
                                }
                              }, 1000);
                            } catch (err) {
                              console.error(t.sqlimportmodal1349, err);
                            }
                          }
                        }}
                        className="w-full px-3 py-2 rounded focus:outline-none"
                        style={{ backgroundColor: colors.bgTertiary, border: `1px solid ${colors.borderPrimary}`, color: colors.textPrimary }}
                        disabled={servicePolling || testingConnection}
                      >
                        <option value="">{t.sqlimportmodal1357}</option>
                        {availableDatabases.map(db => (
                          <option key={db} value={db}>{db}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={serviceDatabase}
                        onChange={(e) => setServiceDatabase(e.target.value)}
                        placeholder="database_name"
                        className="w-full px-3 py-2 rounded focus:outline-none sql-import-input"
                        style={{ backgroundColor: colors.bgTertiary, border: `1px solid ${colors.borderPrimary}`, color: colors.textPrimary }}
                        disabled={servicePolling || testingConnection}
                      />
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
                      {t.sqlimportmodal1376}
                      {serviceConnectionType === 'postgresql' && (
                        <span className="text-xs ml-1" style={{ color: colors.accent }}>{t.sqlimportmodal1378}</span>
                      )}
                      {serviceConnectionType !== 'postgresql' && (
                        <span className="text-xs ml-1" style={{ color: colors.textMuted }}>{t.sqlimportmodal1381}</span>
                      )}
                    </label>
                    {availableSchemas.length > 0 ? (
                      <select
                        value={serviceSchemaName}
                        onChange={(e) => setServiceSchemaName(e.target.value)}
                        className="w-full px-3 py-2 rounded focus:outline-none"
                        style={{ backgroundColor: colors.bgTertiary, border: `1px solid ${colors.borderPrimary}`, color: colors.textPrimary }}
                        disabled={servicePolling || testingConnection}
                      >
                        <option value="">{t.sqlimportmodal1392}</option>
                        {availableSchemas.map(schema => (
                          <option key={schema} value={schema}>{schema}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={serviceSchemaName}
                        onChange={(e) => setServiceSchemaName(e.target.value)}
                        placeholder={serviceConnectionType === 'postgresql' ? 'public' : t.sqlimportmodal1402}
                        className="w-full px-3 py-2 rounded focus:outline-none sql-import-input"
                        style={{ backgroundColor: colors.bgTertiary, border: `1px solid ${colors.borderPrimary}`, color: colors.textPrimary }}
                        disabled={servicePolling || testingConnection}
                      />
                    )}
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex justify-center gap-4 pt-4">
                  <button
                    type="button"
                    onClick={handleServiceImport}
                    disabled={serviceTaskId !== null || testingConnection || !serviceDatabase || !selectedSchemaId || (serviceConnectionType === 'postgresql' && !serviceSchemaName)}
                    className="px-6 py-3 rounded font-medium transition-colors disabled:cursor-not-allowed"
                    style={{
                      backgroundColor: (serviceTaskId !== null || testingConnection || !serviceDatabase || !selectedSchemaId || (serviceConnectionType === 'postgresql' && !serviceSchemaName)) ? colors.bgTertiary : colors.accent,
                      color: (serviceTaskId !== null || testingConnection || !serviceDatabase || !selectedSchemaId || (serviceConnectionType === 'postgresql' && !serviceSchemaName)) ? colors.textMuted : 'white'
                    }}
                    title={serviceTaskId ? 'An import task is already running' : (serviceConnectionType === 'postgresql' && !serviceSchemaName) ? t.sqlimportmodal1422 : ''}
                  >
                    {servicePolling ? t.sqlimportmodal1424 : serviceTaskId ? t.sqlimportmodal1424_2 : t.sqlimportmodal1424_3}
                  </button>
                </div>

                {/* Live Log */}
                {serviceLog.length > 0 && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
                      {t.sqlimportmodal1432}
                    </label>
                    <div
                      className="rounded p-4 max-h-48 overflow-y-scroll font-mono text-xs"
                      style={{ backgroundColor: colors.bgPrimary, border: `1px solid ${colors.borderPrimary}` }}
                    >
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
            ) : (
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
                  {t.sqlimportmodal1451}
                </label>
                <div
                  className="border-2 border-dashed rounded-lg p-8 text-center"
                  style={{ borderColor: colors.borderPrimary }}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".sql,.txt"
                    onChange={handleFileSelect}
                    className="hidden"
                  />

                  {sqlScript ? (
                    <div style={{ color: colors.successText }}>
                      <div className="text-2xl mb-2">✅</div>
                      <p className="font-medium">{t.sqlimportmodal1468}</p>
                      <p className="text-sm mt-1" style={{ color: colors.textMuted }}>
                        {sqlScript.length}{t.sqlimportmodal1470}
                      </p>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="mt-3 px-4 py-2 text-white rounded text-sm transition-colors hover:opacity-90"
                        style={{ backgroundColor: colors.accent }}
                      >
                        {t.sqlimportmodal1478}
                      </button>
                    </div>
                  ) : (
                    <div style={{ color: colors.textMuted }}>
                      <div className="text-4xl mb-3">📁</div>
                      <p className="font-medium mb-2">{t.sqlimportmodal1484}</p>
                      <p className="text-sm mb-4" style={{ color: colors.textMuted }}>
                        {t.sqlimportmodal1486}
                      </p>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-6 py-2 text-white rounded transition-colors hover:opacity-90"
                        style={{ backgroundColor: colors.accent }}
                      >
                        {t.sqlimportmodal1494}
                      </button>
                    </div>
                  )}
                </div>

                {sqlScript && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
                      {t.sqlimportmodal1503}
                    </label>
                    <div
                      className="rounded p-3 text-xs font-mono max-h-32 overflow-y-auto"
                      style={{ backgroundColor: colors.bgPrimary, border: `1px solid ${colors.borderPrimary}`, color: colors.textSecondary }}
                    >
                      {sqlScript.substring(0, 500)}
                      {sqlScript.length > 500 && '...'}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          {activeTab !== 'service' ? (
            <div
              className="flex justify-end gap-3 p-6"
              style={{ borderTop: `1px solid ${colors.borderPrimary}`, backgroundColor: colors.bgPrimary }}
            >
              <button
                type="button"
                onClick={handleClose}
                disabled={loading || validating}
                className="px-4 py-2 rounded transition-colors hover:opacity-80"
                style={{ backgroundColor: colors.buttonPrimary, border: `1px solid ${colors.borderPrimary}`, color: colors.textInverse }}
              >
                {t.sqlimportmodal1531}
              </button>
              {!showFkWarning && (
                <button
                  type="submit"
                  disabled={loading || validating || !sqlScript.trim()}
                  className="px-6 py-2 rounded font-medium transition-colors disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: loading || validating || !sqlScript.trim() ? colors.bgTertiary : colors.accent,
                    color: loading || validating || !sqlScript.trim() ? colors.textMuted : 'white'
                  }}
                >
                  {validating ? (
                    <div className="flex items-center">
                      <div className="animate-spin mr-2">⚪</div>
                      {t.sqlimportmodal1546}
                    </div>
                  ) : loading ? (
                    <div className="flex items-center">
                      <div className="animate-spin mr-2">⚪</div>
                      {t.sqlimportmodal1551}
                    </div>
                  ) : (
                    t.sqlimportmodal423
                  )}
                </button>
              )}
            </div>
          ) : (
            <div
              className="flex justify-between items-center p-6"
              style={{ borderTop: `1px solid ${colors.borderPrimary}`, backgroundColor: colors.bgPrimary }}
            >
              <div className="flex gap-3">
                {serviceTaskId && servicePolling && (
                  <button
                    type="button"
                    onClick={handleCancelTask}
                    className="px-4 py-2 text-white rounded font-medium transition-colors hover:opacity-90"
                    style={{ backgroundColor: colors.errorBg }}
                  >
                    {t.sqlimportmodal1572}
                  </button>
                )}
                {serviceTaskId && !servicePolling && (
                  <button
                    type="button"
                    onClick={resetServiceState}
                    className="px-4 py-2 text-white rounded font-medium transition-colors hover:opacity-90"
                    style={{ backgroundColor: colors.accent }}
                  >
                    {t.sqlimportmodal1582}
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 rounded transition-colors hover:opacity-80"
                style={{ backgroundColor: colors.buttonPrimary, border: `1px solid ${colors.borderPrimary}`, color: colors.textInverse }}
              >
                {servicePolling ? 'Close (Import continues in background)' : 'Close'}
              </button>
            </div>
          )}
        </form>
      </div>

      {/* Theme-aware styles for placeholder text */}
      <style>{`
        .sql-import-modal .sql-import-input::placeholder,
        .sql-import-modal textarea::placeholder {
          color: var(--theme-text-muted);
          opacity: 0.7;
        }
        .sql-import-modal select option {
          background-color: var(--theme-bg-secondary);
          color: var(--theme-text-primary);
        }
      `}</style>
    </Dialog>
  );
}