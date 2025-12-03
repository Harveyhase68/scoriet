// resources/js/Components/SqlImportModal.tsx
import React, { useState, useRef, useEffect } from 'react';
import { Dialog } from 'primereact/dialog';
import { useProject } from '@/contexts/ProjectContext';
import { useTranslation, SupportedLanguage, getStoredLanguage } from '@/i18n';

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

  const { selectedProject } = useProject();
  const [sqlScript, setSqlScript] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'paste' | 'upload' | 'service'>('paste');
  const [schemas, setSchemas] = useState<FloatingSchema[]>([]);
  const [selectedSchemaId, setSelectedSchemaId] = useState<number | null>(preselectedSchemaId || null);
  const [loadingSchemas, setLoadingSchemas] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const resetModal = () => {
    setSqlScript('');
    setDescription('');
    setError(null);
    setActiveTab('paste');
    setSelectedSchemaId(preselectedSchemaId || null);
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

    const confirmed = window.confirm('Do you want to cancel this import task? This cannot be undone.');
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

      setServiceLog(prev => [...prev, '', '🚫 Import task cancelled by user']);
      setServicePolling(false);
      resetServiceState();
    } catch (err) {
      setServiceLog(prev => [...prev, `❌ Failed to cancel task: ${err instanceof Error ? err.message : 'Unknown error'}`]);
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
              setServiceLog(prev => [...prev, '', '🔄 Resuming import monitoring...']);
              setServicePolling(true);
              startPolling(serviceTaskId, token);
            }
          } else if (status === 'completed') {
            if (!serviceLog.some(log => log.includes('Import was completed while modal was closed'))) {
              setServiceLog(prev => [...prev, '', '✅ Import was completed while modal was closed!']);
            }
            setServiceTaskId(null); // Clear so user can start new import
          } else if (status === 'failed') {
            if (!serviceLog.some(log => log.includes('Import failed'))) {
              setServiceLog(prev => [...prev, '', `❌ Import failed: ${result.task.error_message || 'Unknown error'}`, '', '💡 You can start a new import now.']);
            }
            setServiceTaskId(null); // Clear so button becomes active again
          }
        }
      })
      .catch(err => {
        console.error('Failed to check task status:', err);
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
            '🔄 Found active import task from previous session',
            `📋 Task ID: ${task.id}`,
            `📊 Status: ${task.status}`,
            '',
          ]);

          if (task.status === 'pending' || task.status === 'processing') {
            setServicePolling(true);
            startPolling(task.id, token);
          } else if (task.status === 'completed') {
            setServiceLog(prev => [...prev, '✅ Task completed successfully!']);
          } else if (task.status === 'failed') {
            setServiceLog(prev => [...prev, `❌ Task failed: ${task.error_message || 'Unknown error'}`]);
          }
        }
      })
      .catch(err => {
        console.error('Failed to check for active tasks:', err);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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

    if (!selectedSchemaId) {
      setError(t.panelt21133);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (!token) {
        throw new Error(t.panelt2405);
      }

      const payload = {
        sql_script: sqlScript,
        schema_id: selectedSchemaId,
        description: description || null,
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
        console.error('SQL Import Error - Response:', textResponse);
        throw new Error(`Server Error (${response.status}): ${response.statusText}\n\nResponse: ${textResponse.substring(0, 500)}${textResponse.length > 500 ? '...' : ''}`);
      }

      if (!response.ok || !result.success) {
        // Create detailed error message
        let errorMessage = result.error || t.sqlimportmodal177;

        if (result.error_type) {
          errorMessage = `${result.error_type}: ${errorMessage}`;
        }

        if (result.suggestion) {
          errorMessage += `\n\nSuggestion: ${result.suggestion}`;
        }

        if (result.sql_location) {
          errorMessage += `\n\nSQL Location: ${result.sql_location}`;
        }

        if (result.debug_file && result.debug_line) {
          errorMessage += `\n\nDebug Info: ${result.debug_file}:${result.debug_line}`;
        }

        // Add full result for debugging
        console.error('SQL Import Error - Full Response:', result);

        throw new Error(errorMessage);
      }

      // Success!
      onSuccess(result);
      handleClose();

    } catch (err) {
      setError(err instanceof Error ? err.message : t.sqlimportmodal203);
    } finally {
      setLoading(false);
    }
  };

  const handleServiceImport = async () => {
    if (!selectedSchemaId || !serviceDatabase) {
      setError('Please fill in all required fields (Database and Target Schema)');
      return;
    }

    // Check if there's already a running task
    if (serviceTaskId) {
      setError('An import task is already running. Please cancel it first or wait for it to complete.');
      return;
    }

    try {
      setError(null);
      setServicePolling(true);
      setServiceLog(['🚀 Starting database import...']);

      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (!token) {
        throw new Error('Authentication required');
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
        throw new Error(result.message || 'Failed to create import task');
      }

      setServiceTaskId(result.task_id);
      setServiceLog(prev => [...prev, `✅ Task created (ID: ${result.task_id})`, '⏳ Waiting for service to pick up task...']);

      // Start polling
      startPolling(result.task_id, token);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start import');
      setServicePolling(false);
      setServiceLog(prev => [...prev, `❌ Error: ${err instanceof Error ? err.message : 'Unknown error'}`]);
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
          throw new Error(result.message || 'Failed to fetch task status');
        }

        const taskData = result.task;

        // Update log based on status
        if (taskData.status === 'processing') {
          setServiceLog(prev => {
            if (!prev.some(log => log.includes('Service picked up task'))) {
              return [...prev, '📡 Service picked up task', '🔌 Service connecting to database...', '✅ Database connected successfully', '📊 Reading database schema...'];
            }
            return prev;
          });
        } else if (taskData.status === 'completed') {
          setServiceLog(prev => [...prev, '✅ Schema read successfully', '📤 Sending schema to Scoriet.dev...', '✅ Schema imported and stored!', '', '🎉 Import completed successfully! You can close this window.']);
          setServicePolling(false);
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
          }

          // Call onSuccess but keep modal open
          onSuccess(result);
        } else if (taskData.status === 'failed') {
          const errorMsg = taskData.error_message || 'Unknown error occurred';
          setServiceLog(prev => [...prev, `❌ Import failed: ${errorMsg}`, '', '💡 You can start a new import now.']);
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
            '⏱️ Timeout: Service did not respond in time (5 minutes)',
            '❌ Marking task as failed...',
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
              error_message: 'Timeout: Service did not respond within 5 minutes',
              allow_retry: false, // Don't auto-retry timeouts
            }),
          })
          .then(() => {
            setServiceLog(prev => [...prev, '✅ Task marked as failed due to timeout', '', '💡 You can start a new import now.']);
          })
          .catch(() => {
            setServiceLog(prev => [...prev, '⚠️ Failed to mark task as failed (already failed?)']);
          });

          setError('Import timeout - task marked as failed. Service may be offline.');
          setServicePolling(false);
          setServiceTaskId(null); // Clear task ID so button becomes active again
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
          }
        }

      } catch (err) {
        setServiceLog(prev => [...prev, `❌ Polling error: ${err instanceof Error ? err.message : 'Unknown error'}`]);
        setError(err instanceof Error ? err.message : 'Failed to check task status');
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
        backgroundColor: '#1f2937',
        color: 'white',
        maxHeight: '80vh',
        overflow: 'auto'
      }}
      headerStyle={{
        backgroundColor: '#1f2937',
        color: 'white',
        borderBottom: '1px solid #374151'
      }}
    >
      <div className="bg-gray-800 h-full">
        <p className="text-sm text-gray-400 px-6 pt-4 pb-2">Import database schema from SQL script</p>

        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          {/* Tabs */}
          <div className="flex border-b border-gray-600">
            <button
              type="button"
              onClick={() => setActiveTab('paste')}
              className={`px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === 'paste'
                  ? 'text-blue-400 border-b-2 border-blue-400 bg-gray-700'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              📝 Paste SQL
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('upload')}
              className={`px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === 'upload'
                  ? 'text-blue-400 border-b-2 border-blue-400 bg-gray-700'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              📁 Upload File
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('service')}
              className={`px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === 'service'
                  ? 'text-blue-400 border-b-2 border-blue-400 bg-gray-700'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              🔌 Lokaler Import (Service)
            </button>
          </div>

          <div className="p-6 overflow-y-auto flex-1">
            {/* Error Display */}
            {error && (
              <div className="mb-4 p-3 bg-red-900 border border-red-600 rounded text-red-200">
                <div className="flex items-center">
                  <span className="mr-2">⚠️</span>
                  <span>{error}</span>
                </div>
              </div>
            )}

            {/* Schema Selection and Description */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Target Schema
                </label>
                {preselectedSchemaId ? (
                  <div className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-gray-200">
                    {schemas.find(schema => schema.id === preselectedSchemaId)?.name || `Schema ${preselectedSchemaId}`} (v{schemas.find(schema => schema.id === preselectedSchemaId)?.last_version ? schemas.find(schema => schema.id === preselectedSchemaId)!.last_version + 1 : '?'})
                    <span className="text-xs text-gray-400 ml-2">(pre-selected)</span>
                  </div>
                ) : loadingSchemas ? (
                  <div className="text-gray-400 text-sm">Loading schemas...</div>
                ) : schemas.length > 0 ? (
                  <select
                    value={selectedSchemaId || ''}
                    onChange={(e) => setSelectedSchemaId(parseInt(e.target.value))}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:border-blue-500 focus:outline-none"
                  >
                    {schemas.map(schema => (
                      <option key={schema.id} value={schema.id}>
                        {schema.name} (v{schema.last_version + 1})
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="text-gray-400 text-sm">
                    {selectedProject ? t.sqlimportmodal301 : t.databaseexportmodal344}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description (optional)
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t.sqlimportmodal313}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Content Area */}
            {activeTab === 'paste' ? (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  SQL Script
                </label>
                <textarea
                  value={sqlScript}
                  onChange={(e) => setSqlScript(e.target.value)}
                  placeholder={t.sqlimportmodal328}
                  rows={12}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none font-mono text-sm resize-none"
                />
                <div className="mt-2 text-xs text-gray-400">
                  Supports MySQL CREATE TABLE, ALTER TABLE statements and constraints
                </div>
              </div>
            ) : activeTab === 'service' ? (
              <div className="space-y-4">
                {/* Database Connection Form */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Connection Type
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
                      }}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:border-blue-500 focus:outline-none"
                      disabled={servicePolling}
                    >
                      <option value="mysql">MySQL</option>
                      <option value="postgresql">PostgreSQL</option>
                      <option value="mssql">MS SQL Server</option>
                      <option value="sqlite">SQLite</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Host
                    </label>
                    <input
                      type="text"
                      value={serviceHost}
                      onChange={(e) => setServiceHost(e.target.value)}
                      placeholder="localhost"
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                      disabled={servicePolling}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Port
                    </label>
                    <input
                      type="text"
                      value={servicePort}
                      onChange={(e) => setServicePort(e.target.value)}
                      placeholder="3306"
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                      disabled={servicePolling}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Database
                    </label>
                    <input
                      type="text"
                      value={serviceDatabase}
                      onChange={(e) => setServiceDatabase(e.target.value)}
                      placeholder="database_name"
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                      disabled={servicePolling}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Username
                    </label>
                    <input
                      type="text"
                      value={serviceUsername}
                      onChange={(e) => setServiceUsername(e.target.value)}
                      placeholder="root"
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                      disabled={servicePolling}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Password
                    </label>
                    <input
                      type="password"
                      value={servicePassword}
                      onChange={(e) => setServicePassword(e.target.value)}
                      placeholder="password"
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                      disabled={servicePolling}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Schema Name <span className="text-gray-500 text-xs">(optional - uses database name if empty)</span>
                    </label>
                    <input
                      type="text"
                      value={serviceSchemaName}
                      onChange={(e) => setServiceSchemaName(e.target.value)}
                      placeholder="Leave empty to use database name"
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                      disabled={servicePolling}
                    />
                  </div>
                </div>

                {/* Start Button */}
                <div className="flex justify-center pt-4">
                  <button
                    type="button"
                    onClick={handleServiceImport}
                    disabled={serviceTaskId !== null || !serviceDatabase || !selectedSchemaId}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded font-medium transition-colors"
                    title={serviceTaskId ? 'An import task is already running' : ''}
                  >
                    {servicePolling ? '⏳ Processing...' : serviceTaskId ? '⏸️ Task Running' : '🚀 Start Asynchron'}
                  </button>
                </div>

                {/* Live Log */}
                {serviceLog.length > 0 && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Import Log
                    </label>
                    <div className="bg-gray-900 border border-gray-600 rounded p-4 max-h-64 overflow-y-scroll font-mono text-xs">
                      {serviceLog.map((log, index) => (
                        <div key={index} className="text-gray-300 mb-1">
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
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Upload SQL File
                </label>
                <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".sql,.txt"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  
                  {sqlScript ? (
                    <div className="text-green-400">
                      <div className="text-2xl mb-2">✅</div>
                      <p className="font-medium">File loaded successfully!</p>
                      <p className="text-sm text-gray-400 mt-1">
                        {sqlScript.length} characters loaded
                      </p>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm transition-colors"
                      >
                        Choose Different File
                      </button>
                    </div>
                  ) : (
                    <div className="text-gray-400">
                      <div className="text-4xl mb-3">📁</div>
                      <p className="font-medium mb-2">Click to select SQL file</p>
                      <p className="text-sm text-gray-500 mb-4">
                        Supports .sql and .txt files
                      </p>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded transition-colors"
                      >
                        Choose File
                      </button>
                    </div>
                  )}
                </div>
                
                {sqlScript && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Preview (first 500 characters)
                    </label>
                    <div className="bg-gray-900 border border-gray-600 rounded p-3 text-xs font-mono text-gray-300 max-h-32 overflow-y-auto">
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
            <div className="flex justify-end gap-3 p-6 border-t border-gray-600 bg-gray-900">
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !sqlScript.trim()}
                className={`px-6 py-2 rounded font-medium transition-colors ${
                  loading || !sqlScript.trim()
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin mr-2">⚪</div>
                    Importing...
                  </div>
                ) : (
                  t.sqlimportmodal423
                )}
              </button>
            </div>
          ) : (
            <div className="flex justify-between items-center p-6 border-t border-gray-600 bg-gray-900">
              <div className="flex gap-3">
                {serviceTaskId && servicePolling && (
                  <button
                    type="button"
                    onClick={handleCancelTask}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded font-medium transition-colors"
                  >
                    🚫 Cancel Import
                  </button>
                )}
                {serviceTaskId && !servicePolling && (
                  <button
                    type="button"
                    onClick={resetServiceState}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded font-medium transition-colors"
                  >
                    ➕ New Import
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="px-6 py-2 bg-gray-600 hover:bg-gray-700 rounded font-medium transition-colors"
              >
                {servicePolling ? 'Close (Import continues in background)' : 'Close'}
              </button>
            </div>
          )}
        </form>
      </div>
    </Dialog>
  );
}