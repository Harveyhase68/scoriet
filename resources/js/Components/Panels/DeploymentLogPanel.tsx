import React, { useState, useEffect, useRef } from 'react';
import { useProject } from '@/contexts/ProjectContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from 'primereact/button';
import { useTranslation, SupportedLanguage, getStoredLanguage } from '@/i18n';
import { apiClient } from '@/lib/api';

interface DeploymentLog {
  id: number;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
  metadata?: any;
  task_id?: number;
  created_at: string;
}

export default function DeploymentLogPanel() {
  const { colors } = useTheme();
  // i18n setup
  const [currentLanguage] = React.useState<SupportedLanguage>(getStoredLanguage());
  const { t } = useTranslation(currentLanguage);
  const { selectedProject } = useProject();
  const selectedProjectId = selectedProject?.id ?? null;
  const [logs, setLogs] = useState<DeploymentLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, setActiveTaskId] = useState<number | null>(null);
  const [polling, setPolling] = useState(false);
  const logEndRef = useRef<HTMLDivElement>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  // Cleanup polling interval when component unmounts
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, []);

  // Load logs when project changes
  useEffect(() => {
    if (selectedProjectId) {
      loadLogs();
    }
  }, [selectedProjectId]);

  const loadLogs = async () => {
    if (!selectedProjectId) return;

    setLoading(true);
    setError(null);

    try {
      let result: any;
      try {
        result = await apiClient.get(`/projects/${selectedProjectId}/deployment-logs?limit=200`);
      } catch {
        throw new Error(t.deploymentlogpanel71);
      }

      // Backend returns newest first (DESC) so limit slices off old history;
      // we reverse for chronological reading (oldest → newest) in the panel.
      const incoming: DeploymentLog[] = Array.isArray(result.logs) ? result.logs : [];
      setLogs(incoming.slice().reverse());

      // Check if there's an active task — incoming is still DESC, so [0] is newest.
      const activeLogs = incoming.filter((log: DeploymentLog) =>
        log.task_id && log.type === 'info' && log.message.includes('Task')
      );

      if (activeLogs.length > 0) {
        const latestTaskId = activeLogs[0].task_id;
        if (latestTaskId) {
          setActiveTaskId(latestTaskId);
          checkTaskStatus(latestTaskId);
        }
      }
    } catch (err: any) {
      setError(err.message || t.deploymentlogpanel94);
    } finally {
      setLoading(false);
    }
  };

  // Token plumbing removed: apiClient.cliRequest reads the token internally
  // and handles 401-refresh, so callers don't have to thread one through.
  const checkTaskStatus = async (taskId: number) => {
    try {
      const result = await apiClient.cliRequest(`/svc/tasks/${taskId}`);

      if (result.success && result.task) {
        const status = result.task.status;

        if (status === 'pending' || status === 'processing') {
          // Task is still running, start polling
          if (!polling) {
            setPolling(true);
            startPolling(taskId);
          }
        }
      }
    } catch (err) {
      console.error(t.deploymentlogpanel123, err);
    }
  };

  const startPolling = (taskId: number) => {
    // Clear any existing polling interval
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }

    let pollCount = 0;
    const maxPolls = 300; // 10 minutes max (300 * 2 seconds)

    const pollInterval = setInterval(async () => {
      pollCount++;

      try {
        // cliRequest throws on !response.ok; catch below handles the failure.
        const result = await apiClient.cliRequest(`/svc/tasks/${taskId}`);
        const taskData = result.task;

        // Check if task is completed or failed
        if (taskData.status === 'completed' || taskData.status === 'failed') {
          setPolling(false);
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
          }

          // Reload logs to get final status
          loadLogs();
        }

        // Stop polling after max attempts
        if (pollCount >= maxPolls) {
          setPolling(false);
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
          }
        }
      } catch (err: any) {
        console.error(t.deploymentlogpanel177, err);
      }
    }, 2000); // Poll every 2 seconds

    pollIntervalRef.current = pollInterval;
  };

  const clearLogs = async () => {
    if (!selectedProjectId) return;

    const confirmed = window.confirm(t.deploymentlogpanel187);
    if (!confirmed) return;

    try {
      try {
        await apiClient.delete(`/projects/${selectedProjectId}/deployment-logs`);
      } catch {
        throw new Error(t.deploymentlogpanel205);
      }

      setLogs([]);
    } catch (err: any) {
      setError(err.message || t.deploymentlogpanel210);
    }
  };

  const getLogIcon = (type: string) => {
    switch (type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'info':
      default:
        return 'ℹ️';
    }
  };

  const getLogColor = (type: string) => {
    switch (type) {
      case 'success':
        return colors.successText;
      case 'error':
        return colors.errorText;
      case 'warning':
        return colors.warningText;
      case 'info':
      default:
        return colors.infoText;
    }
  };

  return (
    <div className="h-full flex flex-col" style={{ backgroundColor: colors.bgPrimary, color: colors.textPrimary }}>
      {/* Header */}
      <div className="flex items-center justify-between p-4" style={{ backgroundColor: colors.bgSecondary, borderBottom: `1px solid ${colors.borderPrimary}` }}>
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-semibold">{t.deploymentlogpanel247}</h2>
          {polling && (
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm" style={{ backgroundColor: colors.infoBg, color: colors.infoText }}>
              <span className="inline-block animate-spin">🔄</span>
              {t.deploymentlogpanel251}
            </span>
          )}
        </div>

        <div className="flex gap-2">
          <Button
            label={loading ? t.deploymentlogpanel258 : t.deploymentlogpanel258_2}
            icon="pi pi-refresh"
            onClick={loadLogs}
            disabled={loading}
            severity="info"
            size="small"
          />
          <Button
            label={t.deploymentlogpanel266}
            icon="pi pi-trash"
            onClick={clearLogs}
            disabled={loading || logs.length === 0}
            severity="danger"
            size="small"
          />
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4" style={{ backgroundColor: colors.errorBg, borderBottom: `1px solid ${colors.errorBorder}`, color: colors.errorText }}>
          <strong>{t.deploymentlogpanel279}</strong> {error}
        </div>
      )}

      {/* Logs Display */}
      <div className="flex-1 overflow-y-auto p-4 font-mono text-sm">
        {loading && logs.length === 0 ? (
          <div className="text-center py-8" style={{ color: colors.textMuted }}>
            <div className="inline-block animate-spin text-2xl mb-2">🔄</div>
            <p>{t.deploymentlogpanel288}</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-8" style={{ color: colors.textMuted }}>
            <p className="text-2xl mb-2">📋</p>
            <p>{t.deploymentlogpanel293}</p>
            <p className="text-sm mt-2">{t.deploymentlogpanel294}</p>
          </div>
        ) : (
          <div className="space-y-1">
            {logs.map((log) => (
              <div
                key={log.id}
                className="flex items-start gap-2 p-2 rounded transition-colors"
                style={{ color: getLogColor(log.type) }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.bgHover}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <span className="flex-shrink-0">{getLogIcon(log.type)}</span>
                <div className="flex-1">
                  <span>{log.message}</span>
                  {log.metadata && (
                    <div className="text-xs mt-1" style={{ color: colors.textMuted }}>
                      {JSON.stringify(log.metadata)}
                    </div>
                  )}
                </div>
                <span className="flex-shrink-0 text-xs" style={{ color: colors.textMuted }}>
                  {new Date(log.created_at).toLocaleTimeString()}
                </span>
              </div>
            ))}
            <div ref={logEndRef} />
          </div>
        )}
      </div>
    </div>
  );
}
