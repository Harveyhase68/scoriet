// resources/js/Components/TopBar.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { Badge } from 'primereact/badge';
import { useProject } from '@/contexts/ProjectContext';
import { useTranslation, SupportedLanguage, getStoredLanguage } from '@/i18n';

export default function TopBar() {
  // i18n setup
  const [currentLanguage] = React.useState<SupportedLanguage>(getStoredLanguage());
  const { t } = useTranslation(currentLanguage);
  const { projects, selectedProject, setSelectedProject, loading } = useProject();
  const [pendingApplicationsCount, setPendingApplicationsCount] = useState(0);

  // Load pending applications count for selected project
  const loadPendingApplications = useCallback(async () => {
    if (!selectedProject || !selectedProject.is_owner) {
      setPendingApplicationsCount(0);
      return;
    }

    try {
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
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
      }
    } catch {
      // Error loading pending applications
      setPendingApplicationsCount(0);
    }
  }, [selectedProject]);

  // Load applications when project changes
  useEffect(() => {
    loadPendingApplications();
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
    <div className="h-12 bg-gray-900 border-b border-gray-700 flex items-center justify-between px-4">
      {/* Left: Logo and Brand */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-3">
          <img
            src="/images/logos/scoriet-logo.png"
            alt={t.topbar71}
            className="h-8 w-auto"
            style={{ maxHeight: '32px', width: 'auto' }}
          />
          <div className="text-xs text-gray-500">Enterprise Code Generator</div>
        </div>
      </div>

      {/* Right: Project Selector and other controls */}
      <div className="flex items-center space-x-4">
        {/* Project Selector */}
        <div className="flex items-center space-x-2">
          <i className="pi pi-briefcase text-gray-400 text-sm"></i>
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
          />
          {selectedProject && (
            <span className="text-xs text-gray-400">
              by {selectedProject.owner.name}
            </span>
          )}
        </div>

        {/* Notification Bell */}
        {selectedProject && selectedProject.is_owner && pendingApplicationsCount > 0 && (
          <div className="relative">
            <Button
              icon="pi pi-bell"
              className="p-button-text p-button-sm text-gray-400 hover:text-yellow-400"
              style={{ padding: '4px' }}
              tooltip={`${pendingApplicationsCount} pending application${pendingApplicationsCount > 1 ? 's' : ''}`}
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

        {/* Clock */}
        <div className="flex items-center space-x-2 text-xs text-gray-400">
          <i className="pi pi-clock"></i>
          <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>
    </div>
  );
}