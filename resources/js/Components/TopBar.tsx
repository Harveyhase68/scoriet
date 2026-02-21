// resources/js/Components/TopBar.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { Badge } from 'primereact/badge';
import { useProject } from '@/contexts/ProjectContext';
import { useTranslation, SupportedLanguage, getStoredLanguage } from '@/i18n';
import { useTheme } from '@/contexts/ThemeContext';

export default function TopBar() {
  // i18n setup
  const [currentLanguage] = React.useState<SupportedLanguage>(getStoredLanguage());
  const { t } = useTranslation(currentLanguage);
  const { projects, selectedProject, setSelectedProject, loading } = useProject();
  const { colors } = useTheme();
  const [pendingApplicationsCount, setPendingApplicationsCount] = useState(0);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [latestUnreadThreadId, setLatestUnreadThreadId] = useState<number | null>(null);

  // 🎯 DEMO MODE DETECTION
  const [isDemoMode, setIsDemoMode] = useState(sessionStorage.getItem('demo_mode') === 'true');

  // Listen for demo mode changes
  useEffect(() => {
    const checkDemoMode = () => {
      setIsDemoMode(sessionStorage.getItem('demo_mode') === 'true');
    };

    window.addEventListener('storage', checkDemoMode);
    window.addEventListener('auth-change', checkDemoMode);

    return () => {
      window.removeEventListener('storage', checkDemoMode);
      window.removeEventListener('auth-change', checkDemoMode);
    };
  }, []);

  // Load pending applications count for selected project
  const loadPendingApplications = useCallback(async () => {
    if (!selectedProject || !selectedProject.is_owner) {
      setPendingApplicationsCount(0);
      return;
    }

    try {
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (!token) return;

      const response = await fetch(`/api/projects/${selectedProject.id}/applications`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        const applications = data.applications || [];
        const pendingCount = applications.filter((app: any) => app.status === 'pending').length;
        setPendingApplicationsCount(pendingCount);
      } else if (response.status === 401) {
        // Token was revoked (likely logged in on another device)
        const alreadyNotified = sessionStorage.getItem('session_revoke_notified');
        const isLoggingOut = localStorage.getItem('logout_in_progress');

        if (!alreadyNotified && !isLoggingOut) {
          sessionStorage.setItem('session_revoke_notified', 'true');

          // Clear tokens
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          sessionStorage.removeItem('access_token');
          sessionStorage.removeItem('refresh_token');

          window.dispatchEvent(new CustomEvent('sessionForciblyEnded', {
            detail: { reason: 'token_revoked' }
          }));
        }
      }
    } catch {
      // Error loading pending applications
      setPendingApplicationsCount(0);
    }
  }, [selectedProject]);

  // Load unread messages count (also in demo mode)
  const loadUnreadMessages = useCallback(async () => {
    try {
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (!token) {
        setUnreadMessagesCount(0);
        setLatestUnreadThreadId(null);
        return;
      }

      const response = await fetch('/api/messages/unread-count', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUnreadMessagesCount(data.count || 0);
        setLatestUnreadThreadId(data.latest_unread_thread_id || null);
      } else if (response.status === 401) {
        // Token was revoked (likely logged in on another device)
        const alreadyNotified = sessionStorage.getItem('session_revoke_notified');
        const isLoggingOut = localStorage.getItem('logout_in_progress');

        if (!alreadyNotified && !isLoggingOut) {
          sessionStorage.setItem('session_revoke_notified', 'true');

          // Clear tokens
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          sessionStorage.removeItem('access_token');
          sessionStorage.removeItem('refresh_token');

          window.dispatchEvent(new CustomEvent('sessionForciblyEnded', {
            detail: { reason: 'token_revoked' }
          }));
        }
      }
    } catch {
      setUnreadMessagesCount(0);
      setLatestUnreadThreadId(null);
    }
  }, []);

  // Load unread messages on mount and periodically
  useEffect(() => {
    loadUnreadMessages();
    // Poll every 5 seconds for new messages
    const interval = setInterval(loadUnreadMessages, 5000);
    return () => clearInterval(interval);
  }, [loadUnreadMessages]);

  // Listen for message updates
  useEffect(() => {
    const handleMessagesUpdated = () => {
      loadUnreadMessages();
    };

    window.addEventListener('messagesUpdated', handleMessagesUpdated);

    return () => {
      window.removeEventListener('messagesUpdated', handleMessagesUpdated);
    };
  }, [loadUnreadMessages]);

  // Load applications when project changes and poll periodically
  useEffect(() => {
    loadPendingApplications();
    // Poll every 10 seconds for new applications
    const interval = setInterval(loadPendingApplications, 10000);
    return () => clearInterval(interval);
  }, [loadPendingApplications]);

  // Listen for application updates from ApplicationsModal
  useEffect(() => {
    const handleApplicationsUpdated = (event: CustomEvent) => {
      const { projectId } = event.detail;
      // Only reload if it's for the current selected project
      if (selectedProject && parseInt(projectId) === selectedProject.id) {
        loadPendingApplications();
      }
    };

    window.addEventListener('applicationsUpdated', handleApplicationsUpdated as EventListener);

    return () => {
      window.removeEventListener('applicationsUpdated', handleApplicationsUpdated as EventListener);
    };
  }, [selectedProject, loadPendingApplications]);

  return (
    <div
      className="h-12 flex items-center justify-between px-4 relative"
      style={{
        backgroundColor: colors.bgSecondary,
        borderBottom: `1px solid ${colors.borderPrimary}`
      }}
    >
      {/* Left: Logo and Brand */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-3">
          <img
            src="/images/logos/scoriet-logo.png"
            alt={t.topbar71}
            className="h-8 w-auto"
            style={{ maxHeight: '32px', width: 'auto' }}
          />
          <div className="text-xs" style={{ color: colors.textMuted }}>{t.topbar195}</div>
        </div>
      </div>

      {/* 🎯 CENTER: DEMO Logo (only in demo mode) */}
      {isDemoMode && (
        <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center">
          <img
            src="/images/logos/demo.png"
            alt="DEMO MODE"
            className="h-10 w-auto"
            style={{ maxHeight: '40px', width: 'auto', filter: 'drop-shadow(0 0 8px rgba(239, 68, 68, 0.6))' }}
          />
        </div>
      )}

      {/* Right: Project Selector and other controls */}
      <div className="flex items-center space-x-4">
        {/* Project Selector */}
        <div className="flex items-center space-x-2">
          <i className="pi pi-briefcase text-sm" style={{ color: colors.textMuted }}></i>
          <Dropdown
            key={selectedProject ? `project-${selectedProject.id}` : 'no-project'}
            value={selectedProject ? selectedProject.id : null}
            options={(projects || []).filter((project, index, self) => {
              // Filter out projects without an ID and duplicates
              if (!project.id) return false;
              return index === self.findIndex((p) => p.id === project.id);
            })}
            onChange={(e) => {
              const selectedProjectObject = projects?.find(p => p.id === e.value);

              // If user tries to select a locked project, find first active project instead
              if (selectedProjectObject?.is_soft_locked) {
                // Find first active (non-locked) project
                const firstActiveProject = projects?.find(p => !p.is_soft_locked);
                if (firstActiveProject) {
                  setSelectedProject(firstActiveProject);
                }
                // If no active projects, don't change selection (keep current)
                return;
              }

              setSelectedProject(selectedProjectObject || null);
            }}
            optionLabel="name"
            optionValue="id"
            placeholder={t.teammodal146}
            className="w-48 custom-dropdown"
            disabled={loading || !projects || projects.length === 0}
            filter
            emptyMessage={t.panelt1813}
            showClear={false}
            itemTemplate={(option) => (
              <div className="flex items-center justify-between w-full">
                <span style={{ color: option.is_soft_locked ? colors.errorText : undefined }}>{option.name}</span>
                {option.is_soft_locked && (
                  <i className="pi pi-lock ml-2" style={{ color: colors.errorText }} title={t.topbar252} />
                )}
                {option.subscription?.days_remaining !== null && option.subscription?.days_remaining <= 14 && !option.is_soft_locked && (
                  <i className="pi pi-exclamation-triangle ml-2" style={{ color: colors.warningText }} title={`${t.topbar255}${option.subscription.days_remaining}${t.topbar255_2}`} />
                )}
              </div>
            )}
            valueTemplate={(option) => option ? (
              <div className="flex items-center">
                <span style={{ color: option.is_soft_locked ? colors.errorText : undefined }}>{option.name}</span>
                {option.is_soft_locked && (
                  <i className="pi pi-lock ml-2" style={{ color: colors.errorText }} />
                )}
              </div>
            ) : t.teammodal146}
          />
          {selectedProject && !selectedProject.is_soft_locked && (
            <span className="text-xs" style={{ color: colors.textMuted }}>
              {t.topbar270}{selectedProject.owner.name}
            </span>
          )}
          {selectedProject?.is_soft_locked && (
            <span className="text-xs flex items-center gap-1" style={{ color: colors.errorText }}>
              <i className="pi pi-lock" />
              {t.topbar276}
            </span>
          )}
        </div>

        {/* Notification Bell */}
        {selectedProject && selectedProject.is_owner && pendingApplicationsCount > 0 && (
          <div className="relative">
            <Button
              icon="pi pi-bell"
              className="p-button-text p-button-sm topbar-icon-btn"
              style={{ padding: '4px', color: colors.textMuted }}
              tooltip={`${pendingApplicationsCount}${pendingApplicationsCount > 1 ? t.topbar288_2 : t.topbar288}`}
              onClick={() => {
                // Trigger opening Applications Modal via custom event
                const event = new CustomEvent(t.topbar122, {
                  detail: { projectId: selectedProject.id }
                });
                window.dispatchEvent(event);
              }}
            />
            <Badge
              value={pendingApplicationsCount}
              severity="danger"
              className="absolute -top-1 -right-1 text-xs flex items-center justify-center"
              style={{ minWidth: '16px', height: '16px', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            />
          </div>
        )}

        {/* Message Notification */}
        <div className="relative">
          <Button
            icon="pi pi-envelope"
            className={`p-button-text p-button-sm topbar-icon-btn ${unreadMessagesCount > 0 ? 'animate-pulse' : ''}`}
            style={{
              padding: '4px',
              color: unreadMessagesCount > 0 ? colors.warningText : colors.textMuted
            }}
            tooltip={unreadMessagesCount > 0 ? `${unreadMessagesCount}${t.topbar315_2}` : t.topbar315}
            onClick={() => {
              window.dispatchEvent(new CustomEvent('openMessaging', {
                detail: { threadId: latestUnreadThreadId }
              }));
            }}
          />
          {unreadMessagesCount > 0 && (
            <Badge
              value={unreadMessagesCount}
              severity="danger"
              className="absolute -top-1 -right-1 text-xs flex items-center justify-center"
              style={{ minWidth: '16px', height: '16px', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            />
          )}
        </div>

        {/* Clock */}
        <div className="flex items-center space-x-2 text-xs" style={{ color: colors.textMuted }}>
          <i className="pi pi-clock"></i>
          <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>
    </div>
  );
}