// resources/js/pages/Index.tsx - Performance Monitoring v2
import React, { useRef, useState, useCallback, useEffect, lazy, Suspense } from 'react';
import { Head } from '@inertiajs/react';
import { DockLayout } from 'rc-dock';
import "rc-dock/dist/rc-dock.css";

import { useHotkeys } from 'react-hotkeys-hook';
import { ErrorBoundary } from 'react-error-boundary';
import { Toast } from 'primereact/toast';
import { TabContentProps } from '@/types';
import ErrorFallback from '@/Components/ErrorFallback';
import { useTranslation, SupportedLanguage, getStoredLanguage } from '@/i18n';
import { de } from '@/i18n/locales/de';
import { en } from '@/i18n/locales/en';
import { useTheme } from '@/contexts/ThemeContext';

// Global window interface for tab data
declare global {
  interface Window {
    _tabData?: Record<string, {
      filterByProject?: boolean;
      forceProjectId?: number;
      forceProjectName?: string;
      title?: string;
      updateTitleCallback?: (newTitle: string) => void;
      // Debug manual generator properties
      tableId?: number;
      tableName?: string;
      schemaId?: number;
      projectId?: number;
      projectName?: string;
      templateId?: number;
      fileId?: number;
      fileName?: string;
      languageId?: number;
      languageCode?: string;
      // Database schema properties
      preSelectedSchemaId?: number;
      // Team roles properties
      teamId?: number;
      teamName?: string;
      isOwner?: boolean;
    }>;
  }
}
import { useProject } from '@/contexts/ProjectContext';

// Always-loaded components (small and critical)
import NewNavigationPanel from '@/Components/Panels/NewNavigationPanel';
import TopBar from '@/Components/TopBar';
import '@/Components/Panels/styles.css';

// Lazy-loaded Panel components (code splitting!)
const PanelT1 = lazy(() => import('@/Components/Panels/PanelT1'));
const PanelT2 = lazy(() => import('@/Components/Panels/PanelT2'));
const ProjectPanel = lazy(() => import('@/Components/Panels/ProjectPanel'));
const MyApplicationsPanel = lazy(() => import('@/Components/Panels/MyApplicationsPanel'));
const PublicProjectsPanel = lazy(() => import('@/Components/Panels/PublicProjectsPanel'));
const TemplateManagementPanel = lazy(() => import('@/Components/Panels/TemplateManagementPanel'));
const TemplateStorePanel = lazy(() => import('@/Components/Panels/TemplateStorePanel'));
const TemplateReviewPanel = lazy(() => import('@/Components/Panels/TemplateReviewPanel'));
const TeamManagementPanel = lazy(() => import('@/Components/Panels/TeamManagementPanel'));
const TeamRolesPanel = lazy(() => import('@/Components/Panels/TeamRolesPanel'));
const MessagingPanel = lazy(() => import('@/Components/Panels/MessagingPanel'));
const DatabaseManagementPanel = lazy(() => import('@/Components/Panels/DatabaseManagementPanel'));
const TemplateDbSchemaDependenciesPanel = lazy(() => import('@/Components/Panels/TemplateDbSchemaDependenciesPanel'));
const DebugManualGeneratorPanel = lazy(() => import('@/Components/Panels/DebugManualGeneratorPanel'));
const CodeGenerationPanel = lazy(() => import('@/Components/Panels/CodeGenerationPanel'));
const DeploymentLogPanel = lazy(() => import('@/Components/Panels/DeploymentLogPanel'));
const LanguageManagementPanel = lazy(() => import('@/Components/Panels/LanguageManagementPanel'));
const SchemaTranslationPanel = lazy(() => import('@/Components/Panels/SchemaTranslationPanel'));
const SystemSettingsPanel = lazy(() => import('@/Components/Panels/SystemSettingsPanel'));
const PayoutAdminPanel = lazy(() => import('@/Components/Panels/PayoutAdminPanel'));
const PerformanceMetricsPanel = lazy(() => import('@/Components/Panels/PerformanceMetricsPanel'));
const InviteManagementPanel = lazy(() => import('@/Components/Panels/InviteManagementPanel'));
const ProjectSettingsPanel = lazy(() => import('@/Components/Panels/ProjectSettingsPanel'));
const ProjectAttachmentsPanel = lazy(() => import('@/Components/Panels/ProjectAttachmentsPanel'));
const ProjectImportPanel = lazy(() => import('@/Components/Panels/ProjectImportPanel'));
const KanbanBoardPanel = lazy(() => import('@/Components/Panels/KanbanBoardPanel'));
const CMSAdminPanel = lazy(() => import('@/Components/Panels/CMSAdminPanel'));
const QueryBuilderPanel = lazy(() => import('@/Components/Panels/QueryBuilderPanel'));
const CacheDebugPanel = lazy(() => import('@/Components/Panels/CacheDebugPanel'));
const FormDesignerPanel = lazy(() => import('@/Components/Panels/FormDesignerPanel'));
const FormSetManagementPanel = lazy(() => import('@/Components/Panels/FormSetManagementPanel'));
const CodeAdjustmentsPanel = lazy(() => import('@/Components/Panels/CodeAdjustmentsPanel'));
const LandingPage = lazy(() => import('@/pages/LandingPage'));

// Auth Modal System
import AuthModalManager, { AuthModalType } from '@/Components/AuthModals/AuthModalManager';

// Pending Invitation Modal
const PendingInvitationModal = lazy(() => import('@/Components/Modals/PendingInvitationModal'));

// CMS Popup Modal
import CMSPopupModal from '@/Components/Modals/CMSPopupModal';

// SQL Import Modal
const SqlImportModal = lazy(() => import('@/Components/SqlImportModal'));

// Database Export Modal
const DatabaseExportModal = lazy(() => import('@/Components/DatabaseExportModal'));

// Project Context
import { ProjectProvider } from '@/contexts/ProjectContext';

// Layout Persistence
import { LayoutPersistenceService } from '@/utils/layoutPersistence';

const TabContent: React.FC<TabContentProps> = ({ children, style = {}, ...rest }) => {
  const ref = useRef<HTMLDivElement>(null);
  const setFocus = () => ref.current?.focus();

  return (
    <div
      {...rest}
      ref={ref}
      tabIndex={-1}
      style={{ flex: 1, padding: '5px 10px', ...style }}
      onMouseDownCapture={setFocus}
      onTouchStartCapture={setFocus}
    >
      {children}
    </div>
  );
};

const icons = {
  maximize: <i className="pi pi-arrows-alt" style={{ fontSize: '12px' }}></i>,
  restore: <i className="pi pi-minus" style={{ fontSize: '12px' }}></i>,
  close: <i className="pi pi-times" style={{ fontSize: '12px' }}></i>,
  more: <i className="pi pi-caret-down" style={{ fontSize: '9px' }}></i>,
  closeAll: <i className="pi pi-trash" style={{ fontSize: '12px', color: '#ff4d4f' }}></i>,
};

// Group definition will be moved inside the component

// EMPTY LAYOUT - starts without panels
const initialLayout: any = {
  "dockbox": {
    "id": "+1",
    "mode": "horizontal",
    "children": []
  },
  "floatbox": {
    "id": "+4",
    "size": 200,
    "mode": "float",
    "children": []
  },
  "windowbox": {
    "id": "+5",
    "size": 0,
    "mode": "window",
    "children": []
  },
  "maxbox": {
    "id": "+6",
    "size": 1,
    "mode": "maximize",
    "children": []
  }
};

// Loading spinner component
const PanelLoader = () => (
  <div className="flex items-center justify-center h-64 theme-bg-secondary theme-text-primary">
    <div className="text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
      <p className="text-sm theme-text-muted">Loading panel...</p>
    </div>
  </div>
);

// Helper function to find the first existing tabset
function findFirstTabset(layout: any): any {
  if (!layout) return null;

  // Function to search recursively through all boxes
  function searchBox(node: any): any {
    if (!node) return null;

    // Check if this node has tabs (is a tabset)
    if (node.tabs && Array.isArray(node.tabs) && node.tabs.length > 0) {
      return node;
    }

    // Search through children
    if (node.children && Array.isArray(node.children)) {
      for (const child of node.children) {
        const found = searchBox(child);
        if (found) return found;
      }
    }

    return null;
  }

  // Search in all layout boxes in priority order
  const boxes = ['dockbox', 'floatbox', 'windowbox', 'maxbox'];
  
  for (const boxName of boxes) {
    const box = layout[boxName];
    if (box) {
      const found = searchBox(box);
      if (found) return found;
    }
  }

  return null;
}

// Function to update tab title dynamically
const updateTabTitle = (dockRef: any, setLayout: any, tabId: string, newTitle: string) => {
  if (!dockRef.current) {
    return;
  }

  // Get current layout from dock reference
  const currentLayout = dockRef.current.saveLayout();

  const updateTitleInBox = (box: any): boolean => {
    if (!box) return false;

    // Check if this box has tabs
    if (box.tabs && Array.isArray(box.tabs)) {
      for (let i = 0; i < box.tabs.length; i++) {
        if (box.tabs[i].id === tabId) {
          box.tabs[i].title = newTitle;
          return true;
        }
      }
    }

    // Search in children
    if (box.children && Array.isArray(box.children)) {
      for (const child of box.children) {
        if (updateTitleInBox(child)) return true;
      }
    }

    return false;
  };

  // Create a deep copy of the current layout
  const newLayout = JSON.parse(JSON.stringify(currentLayout));

  // Search through all boxes
  const boxes = ['dockbox', 'floatbox', 'windowbox', 'maxbox'];
  let updated = false;

  for (const boxName of boxes) {
    if (newLayout[boxName] && updateTitleInBox(newLayout[boxName])) {
      updated = true;
      break;
    }
  }

  if (updated) {
    setLayout(newLayout);
  }
};

// ✅ CORRECTED loadTab function with Lazy Loading!
const loadTab = (
  data: any,
  t: any,
  handleOpenDesigner?: (schemaId: number) => void,
  openPanelFn?: (panelId: string, data?: any) => void,
  updateTitleCallback?: (newTitle: string) => void,
  tFallback?: any
) => {
  const { id } = data;

  // Handle "My Teams" navigation panel IDs (e.g., team-management-team-3)
  if (id.startsWith('team-management-team-')) {
    return {
      id,
      title: data.title || 'Team Management',
      content: (
        <Suspense fallback={<PanelLoader />}>
          <TeamManagementPanel filterByProject={false} />
        </Suspense>
      ),
      closable: true,
      group: 'card custom'
    };
  }

  // Handle dynamic team-management panel IDs (e.g., team-management-project-5, team-management-project-5-filtered)
  if (id.startsWith('team-management-project-')) {
    const teamTabKey = id;

    if (!window._tabData) window._tabData = {};

    if (data.filterByProject !== undefined || data.forceProjectId !== undefined || updateTitleCallback) {
      window._tabData[teamTabKey] = {
        filterByProject: data.filterByProject,
        forceProjectId: data.forceProjectId,
        title: data.title,
        updateTitleCallback: updateTitleCallback
      } as any;
    }

    const teamStoredData = window._tabData[teamTabKey] || {};
    const teamShouldShowProjectFilter = teamStoredData.filterByProject === true;
    const teamForceProjectId = teamStoredData.forceProjectId as number | undefined;
    const teamActualUpdateTitleCallback = teamStoredData.updateTitleCallback || updateTitleCallback;

    return {
      id,
      title: data.title || 'Team Verwaltung',
      content: (
        <Suspense fallback={<PanelLoader />}>
          <TeamManagementPanel filterByProject={teamShouldShowProjectFilter} forceProjectId={teamForceProjectId} updateTabTitle={teamActualUpdateTitleCallback} />
        </Suspense>
      ),
      closable: true,
      group: 'card custom'
    };
  }

  // Handle "My Templates" navigation panel IDs (e.g., template-management-template-6)
  if (id.startsWith('template-management-template-')) {
    return {
      id,
      title: data.title || 'Template Management',
      content: (
        <Suspense fallback={<PanelLoader />}>
          <TemplateManagementPanel filterByProject={false} />
        </Suspense>
      ),
      closable: true,
      group: 'card custom'
    };
  }

  // Handle dynamic template-management panel IDs (e.g., template-management-project-5, template-management-project-5-filtered)
  if (id.startsWith('template-management-project-')) {
    const templateTabKey = id;

    if (!window._tabData) window._tabData = {};

    if (data.filterByProject !== undefined || data.forceProjectId !== undefined || data.forceProjectName !== undefined || updateTitleCallback) {
      window._tabData[templateTabKey] = {
        filterByProject: data.filterByProject,
        forceProjectId: data.forceProjectId,
        forceProjectName: data.forceProjectName,
        title: data.title,
        updateTitleCallback: updateTitleCallback
      } as any;
    }

    const templateStoredData = window._tabData[templateTabKey] || {};
    const templateShouldShowProjectFilter = templateStoredData.filterByProject === true;
    const templateForceProjectId = templateStoredData.forceProjectId as number | undefined;
    const templateForceProjectName = templateStoredData.forceProjectName as string | undefined;
    const templateActualUpdateTitleCallback = templateStoredData.updateTitleCallback || updateTitleCallback;

    return {
      id,
      title: data.title || templateStoredData.title || 'A Template Verwaltung',
      content: (
        <Suspense fallback={<PanelLoader />}>
          <TemplateManagementPanel
            filterByProject={templateShouldShowProjectFilter}
            forceProjectId={templateForceProjectId}
            forceProjectName={templateForceProjectName}
            updateTabTitle={templateActualUpdateTitleCallback}
          />
        </Suspense>
      ),
      closable: true,
      group: 'card custom'
    };
  }

  // Handle dynamic database-management panel IDs (e.g., database-management-project-5)
  if (id.startsWith('database-management-project-')) {
    const databaseTabKey = id;

    if (!window._tabData) window._tabData = {};

    if (data.filterByProject !== undefined || data.forceProjectId !== undefined || data.forceProjectName !== undefined || updateTitleCallback) {
      window._tabData[databaseTabKey] = {
        filterByProject: data.filterByProject,
        forceProjectId: data.forceProjectId,
        forceProjectName: data.forceProjectName,
        title: data.title,
        updateTitleCallback: updateTitleCallback
      } as any;
    }

    const databaseStoredData = window._tabData[databaseTabKey] || {};
    const databaseShouldShowProjectFilter = databaseStoredData.filterByProject === true;
    const databaseForceProjectId = databaseStoredData.forceProjectId as number | undefined;
    const databaseForceProjectName = databaseStoredData.forceProjectName as string | undefined;
    const databaseActualUpdateTitleCallback = databaseStoredData.updateTitleCallback || updateTitleCallback;

    // Determine title: use forceProjectName if available, otherwise fallback
    const dbTitle = t?.index625 || tFallback?.index625 || 'Database Management';
    const databaseTitle = data.title ||
                         databaseStoredData.title ||
                         (databaseShouldShowProjectFilter && databaseForceProjectName
                           ? `${dbTitle}: ${databaseForceProjectName}`
                           : dbTitle);

    return {
      id,
      title: databaseTitle,
      content: (
        <Suspense fallback={<PanelLoader />}>
          <DatabaseManagementPanel
            isActive={true}
            onOpenDesigner={handleOpenDesigner}
            filterByProject={databaseShouldShowProjectFilter}
            forceProjectId={databaseForceProjectId}
            forceProjectName={databaseForceProjectName}
            updateTabTitle={databaseActualUpdateTitleCallback}
          />
        </Suspense>
      ),
      closable: true,
      group: 'card custom'
    };
  }

  // Handle dynamic database-management-schema panel IDs (e.g., database-management-schema-5)
  if (id.startsWith('database-management-schema-')) {
    const schemaTabKey = id;

    if (!window._tabData) window._tabData = {};

    if (data.preSelectedSchemaId !== undefined || data.filterByProject !== undefined || updateTitleCallback) {
      window._tabData[schemaTabKey] = {
        filterByProject: data.filterByProject,
        preSelectedSchemaId: data.preSelectedSchemaId,
        title: data.title,
        updateTitleCallback: updateTitleCallback
      } as any;
    }

    const schemaStoredData = window._tabData[schemaTabKey] || {};
    const schemaShouldShowProjectFilter = schemaStoredData.filterByProject === true;
    const schemaPreSelectedSchemaId = schemaStoredData.preSelectedSchemaId as number | undefined;
    const schemaActualUpdateTitleCallback = schemaStoredData.updateTitleCallback || updateTitleCallback;

    const dbTitle = t?.index625 || tFallback?.index625 || 'Database Management';
    const schemaTitle = data.title || schemaStoredData.title || dbTitle;

    return {
      id,
      title: schemaTitle,
      content: (
        <Suspense fallback={<PanelLoader />}>
          <DatabaseManagementPanel
            isActive={true}
            onOpenDesigner={handleOpenDesigner}
            filterByProject={schemaShouldShowProjectFilter}
            preSelectedSchemaId={schemaPreSelectedSchemaId}
            updateTabTitle={schemaActualUpdateTitleCallback}
          />
        </Suspense>
      ),
      closable: true,
      group: 'card custom'
    };
  }

  // Handle dynamic debug-manual-generator panel IDs (e.g., debug-manual-generator-table-5)
  if (id.startsWith('debug-manual-generator-table-')) {
    const debugTabKey = id;

    if (!window._tabData) window._tabData = {};

    if (data.tableId !== undefined || data.tableName !== undefined || data.schemaId !== undefined || updateTitleCallback) {
      window._tabData[debugTabKey] = {
        tableId: data.tableId,
        tableName: data.tableName,
        schemaId: data.schemaId,
        projectId: data.projectId,
        projectName: data.projectName,
        title: data.title,
        updateTitleCallback: updateTitleCallback
      } as any;
    }

    const debugStoredData = window._tabData[debugTabKey] || {};
    const debugTableId = debugStoredData.tableId as number | undefined;
    const debugTableName = debugStoredData.tableName as string | undefined;
    const debugSchemaId = debugStoredData.schemaId as number | undefined;
    const debugProjectId = debugStoredData.projectId as number | undefined;
    const debugProjectName = debugStoredData.projectName as string | undefined;

    return {
      id,
      title: data.title || debugStoredData.title || 'Debug Manual Generator',
      content: (
        <Suspense fallback={<PanelLoader />}>
          <DebugManualGeneratorPanel
            tableId={debugTableId}
            tableName={debugTableName}
            schemaId={debugSchemaId}
            projectId={debugProjectId}
            projectName={debugProjectName}
          />
        </Suspense>
      ),
      closable: true,
      group: 'card custom'
    };
  }

  switch (id) {
    case 'home':
    case 'landing':
      return {
        id: 'home',
        title: data.title || t?.index400 || tFallback?.index400 || 'Welcome',
        content: (
          <Suspense fallback={<PanelLoader />}>
            <LandingPage />
          </Suspense>
        ),
        closable: true,
        group: 'card custom'
      };

    case 't2':
      return {
        id,
        title: data.title || t?.index413 || tFallback?.index413 || 'Database Designer',
        content: (
          <Suspense fallback={<PanelLoader />}>
            <PanelT2 preSelectedSchemaId={data.preSelectedSchemaId} />
          </Suspense>
        ),
        closable: true,
        group: 'card custom'
      };

    case 'cache-debug':
      return {
        id,
        title: data.title || 'Cache Debug',
        content: (
          <Suspense fallback={<PanelLoader />}>
            <CacheDebugPanel />
          </Suspense>
        ),
        closable: true,
        group: 'card custom'
      };

    case 'project':
      return {
        id,
        title: data.title || 'Project Management',
        content: (
          <Suspense fallback={<PanelLoader />}>
            <ProjectPanel isActive={true} onOpenPanel={openPanelFn} />
          </Suspense>
        ),
        closable: true,
        group: 'card custom'
      };

    case 'my-applications':
      return {
        id,
        title: data.title || 'My Applications',
        content: (
          <Suspense fallback={<PanelLoader />}>
            <MyApplicationsPanel isActive={true} />
          </Suspense>
        ),
        closable: true,
        group: 'card custom'
      };

    case 'public-projects':
      return {
        id,
        title: data.title || 'Public Projects',
        content: (
          <Suspense fallback={<PanelLoader />}>
            <PublicProjectsPanel isActive={true} />
          </Suspense>
        ),
        closable: true,
        group: 'card custom'
      };

    case 'protect1':
      return {
        id,
        title: data.title || 'Protect',
        closable: true,
        content: (
          <TabContent>
            <div className="p-4">
              <p className="text-red-600 font-bold">Removal of this tab will be rejected</p>
              <p>This is done in the onLayoutChange callback</p>
              <div className="mt-4 p-3 bg-yellow-100 rounded">
                <p className="text-yellow-800">Try Alt+P to update this tab</p>
                <p className="text-yellow-800">Try Alt+M to maximize this tab</p>
                <p className="text-yellow-800">Try Alt+L to log current layout</p>
                <p className="text-yellow-800">Try Alt+C to copy layout to clipboard</p>
              </div>
            </div>
          </TabContent>
        ),
        group: 'card custom'
      };

    case 'template-management':
    case 'template-management-filtered': {
      // Handle rc-dock's multiple calls - use unique tab ID to store persistent data
      const tabKey = id; // Use the unique tab ID directly

      // Store persistent data in a global object (rc-dock workaround)
      if (!window._tabData) window._tabData = {};

      if (data.filterByProject !== undefined || updateTitleCallback) {
        // First call - store the data and callback
        window._tabData[tabKey] = {
          filterByProject: data.filterByProject,
          title: data.title,
          updateTitleCallback: updateTitleCallback
        };
      }

      // Get the stored data (works on subsequent calls)
      const storedData = window._tabData[tabKey] || {};
      const shouldShowProjectFilter = storedData.filterByProject === true;
      const actualUpdateTitleCallback = storedData.updateTitleCallback || updateTitleCallback;

      return {
        id,
        title: data.title || t.index590,
        content: (
          <Suspense fallback={<PanelLoader />}>
            <TemplateManagementPanel filterByProject={shouldShowProjectFilter} updateTabTitle={actualUpdateTitleCallback} />
          </Suspense>
        ),
        closable: true,
        group: 'card custom'
      };
    }

    case 'template-review':
      return {
        id,
        title: 'Template Review Queue',
        content: (
          <Suspense fallback={<PanelLoader />}>
            <TemplateReviewPanel />
          </Suspense>
        ),
        closable: true,
        group: 'card custom'
      };

    case 'template-store':
      return {
        id,
        title: 'Template Store',
        content: (
          <Suspense fallback={<PanelLoader />}>
            <TemplateStorePanel />
          </Suspense>
        ),
        closable: true,
        group: 'card custom'
      };

    case 'database-management':
    case 'database-management-filtered': {
      // Handle rc-dock's multiple calls - use unique tab ID to store persistent data
      const dbTabKey = id; // Use the unique tab ID directly

      // Store persistent data in a global object (rc-dock workaround)
      if (!window._tabData) window._tabData = {};

      if (data.filterByProject !== undefined || updateTitleCallback) {
        // First call - store the data and callback
        window._tabData[dbTabKey] = {
          filterByProject: data.filterByProject,
          title: data.title,
          updateTitleCallback: updateTitleCallback
        };
      }

      // Get the stored data (works on subsequent calls)
      const dbStoredData = window._tabData[dbTabKey] || {};
      const dbShouldShowProjectFilter = dbStoredData.filterByProject === true;
      const dbActualUpdateTitleCallback = dbStoredData.updateTitleCallback || updateTitleCallback;

      return {
        id,
        title: data.title || t?.index625 || tFallback?.index625 || 'Database Management',
        content: (
          <Suspense fallback={<PanelLoader />}>
            <DatabaseManagementPanel isActive={true} onOpenDesigner={handleOpenDesigner} filterByProject={dbShouldShowProjectFilter} updateTabTitle={dbActualUpdateTitleCallback} />
          </Suspense>
        ),
        closable: true,
        group: 'card custom'
      };
    }

    case 'team-management':
    case 'team-management-filtered': {
      // Handle rc-dock's multiple calls - use unique tab ID to store persistent data
      const teamTabKey = id; // Use the unique tab ID directly

      // Store persistent data in a global object (rc-dock workaround)
      if (!window._tabData) window._tabData = {};

      if (data.filterByProject !== undefined || data.forceProjectId !== undefined || updateTitleCallback) {
        // First call - store the data and callback
        window._tabData[teamTabKey] = {
          filterByProject: data.filterByProject,
          forceProjectId: data.forceProjectId,
          title: data.title,
          updateTitleCallback: updateTitleCallback
        } as any;
      }

      // Get the stored data (works on subsequent calls)
      const teamStoredData = window._tabData[teamTabKey] || {};
      const teamShouldShowProjectFilter = teamStoredData.filterByProject === true;
      const teamForceProjectId = teamStoredData.forceProjectId as number | undefined;
      const teamActualUpdateTitleCallback = teamStoredData.updateTitleCallback || updateTitleCallback;

      return {
        id,
        title: data.title || 'Team Verwaltung',
        content: (
          <Suspense fallback={<PanelLoader />}>
            <TeamManagementPanel filterByProject={teamShouldShowProjectFilter} forceProjectId={teamForceProjectId} updateTabTitle={teamActualUpdateTitleCallback} />
          </Suspense>
        ),
        closable: true,
        group: 'card custom'
      };
    }

    case 'team-roles': {
      const teamRolesTabKey = id;
      if (!window._tabData) window._tabData = {};
      if (data.teamId !== undefined) {
        window._tabData[teamRolesTabKey] = {
          teamId: data.teamId,
          teamName: data.teamName,
          isOwner: data.isOwner,
          updateTitleCallback: updateTitleCallback
        };
        // Persist to localStorage so data survives Vite hot-reload and F5
        localStorage.setItem('scoriet_teamRolesData', JSON.stringify({
          teamId: data.teamId,
          teamName: data.teamName,
          isOwner: data.isOwner,
        }));
      }
      let teamRolesStoredData = window._tabData[teamRolesTabKey] || {};
      // Fallback: restore from localStorage if window._tabData was lost (Vite reload / F5)
      if (!teamRolesStoredData.teamId) {
        try {
          const persisted = JSON.parse(localStorage.getItem('scoriet_teamRolesData') || '{}');
          if (persisted.teamId) {
            teamRolesStoredData = persisted;
            window._tabData[teamRolesTabKey] = { ...persisted, updateTitleCallback };
          }
        } catch { /* ignore parse errors */ }
      }
      const teamRolesTeamId = teamRolesStoredData.teamId as number;
      const teamRolesTeamName = teamRolesStoredData.teamName as string;
      const teamRolesIsOwner = teamRolesStoredData.isOwner as boolean;
      const teamRolesUpdateTitleCallback = teamRolesStoredData.updateTitleCallback || updateTitleCallback;

      return {
        id,
        title: data.title || `Rollen: ${teamRolesTeamName || 'Team'}`,
        content: (
          <Suspense fallback={<PanelLoader />}>
            <TeamRolesPanel
              teamId={teamRolesTeamId}
              teamName={teamRolesTeamName || 'Team'}
              isOwner={teamRolesIsOwner}
              updateTabTitle={teamRolesUpdateTitleCallback}
            />
          </Suspense>
        ),
        closable: true,
        group: 'card custom'
      };
    }

    case 'messaging':
      return {
        id,
        title: data.title || t.index796,
        content: (
          <Suspense fallback={<PanelLoader />}>
            <MessagingPanel initialThreadId={data.threadId} />
          </Suspense>
        ),
        closable: true,
        group: 'card custom'
      };

    case 'template-db-schema-dependencies':
      return {
        id,
        title: data.title || t.index815,
        content: (
          <Suspense fallback={<PanelLoader />}>
            <TemplateDbSchemaDependenciesPanel />
          </Suspense>
        ),
        closable: true,
        group: 'card custom'
      };

    case 'debug-manual-generator':
      return {
        id,
        title: data.title || t.index828,
        content: (
          <Suspense fallback={<PanelLoader />}>
            <DebugManualGeneratorPanel
              tableId={data.tableId}
              tableName={data.tableName}
              schemaId={data.schemaId}
              projectId={data.projectId}
              projectName={data.projectName}
              templateId={data.templateId}
              fileId={data.fileId}
              languageCode={data.languageCode}
            />
          </Suspense>
        ),
        closable: true,
        group: 'card custom'
      };

    case 'code-generation':
      return {
        id,
        title: data.title || t.index850,
        content: (
          <Suspense fallback={<PanelLoader />}>
            <CodeGenerationPanel />
          </Suspense>
        ),
        closable: true,
        group: 'card custom'
      };

    case 'deployment-log':
      return {
        id,
        title: data.title || t.index863,
        content: (
          <Suspense fallback={<PanelLoader />}>
            <DeploymentLogPanel />
          </Suspense>
        ),
        closable: true,
        group: 'card custom'
      };

    case 'language-management':
      return {
        id,
        title: data.title || t.index876,
        content: (
          <Suspense fallback={<PanelLoader />}>
            <LanguageManagementPanel />
          </Suspense>
        ),
        closable: true,
        group: 'card custom'
      };

    case 'schema-translation':
      return {
        id,
        title: data.title || t.index889,
        content: (
          <Suspense fallback={<PanelLoader />}>
            <SchemaTranslationPanel />
          </Suspense>
        ),
        closable: true,
        group: 'card custom'
      };

    case 'system-settings':
      return {
        id,
        title: data.title || t.index902,
        content: (
          <Suspense fallback={<PanelLoader />}>
            <SystemSettingsPanel />
          </Suspense>
        ),
        closable: true,
        group: 'card custom'
      };

    case 'payout-admin':
      return {
        id,
        title: data.title || t.index915,
        content: (
          <Suspense fallback={<PanelLoader />}>
            <PayoutAdminPanel />
          </Suspense>
        ),
        closable: true,
        group: 'card custom'
      };

    case 'performance-metrics':
      return {
        id,
        title: data.title || t.index928,
        content: (
          <Suspense fallback={<PanelLoader />}>
            <PerformanceMetricsPanel />
          </Suspense>
        ),
        closable: true,
        group: 'card custom'
      };

    case 'invite-management':
      return {
        id,
        title: data.title || t.index941,
        content: (
          <Suspense fallback={<PanelLoader />}>
            <InviteManagementPanel />
          </Suspense>
        ),
        closable: true,
        group: 'card custom'
      };

    case 'project-settings':
      return {
        id,
        title: data.title || t.index954,
        content: (
          <Suspense fallback={<PanelLoader />}>
            <ProjectSettingsPanel />
          </Suspense>
        ),
        closable: true,
        group: 'card custom'
      };

    case 'project-attachments':
      return {
        id,
        title: data.title || t.index967,
        content: (
          <Suspense fallback={<PanelLoader />}>
            <ProjectAttachmentsPanel isActive={true} projectId={data.projectId} />
          </Suspense>
        ),
        closable: true,
        group: 'card custom'
      };

    case 'project-import':
      return {
        id,
        title: data.title || t.index980,
        content: (
          <Suspense fallback={<PanelLoader />}>
            <ProjectImportPanel isActive={true} onOpenPanel={openPanelFn} />
          </Suspense>
        ),
        closable: true,
        group: 'card custom'
      };

    case 'kanban-board':
      return {
        id,
        title: data.title || t.index993,
        content: (
          <Suspense fallback={<PanelLoader />}>
            <KanbanBoardPanel isActive={true} projectId={data.projectId} />
          </Suspense>
        ),
        closable: true,
        group: 'card custom'
      };

    case 'cms-admin':
      return {
        id,
        title: data.title || t.index1006,
        content: (
          <Suspense fallback={<PanelLoader />}>
            <CMSAdminPanel editPageId={data.editPageId} />
          </Suspense>
        ),
        closable: true,
        group: 'card custom'
      };

    case 'query-builder':
      return {
        id,
        title: data.title || t.index1019,
        content: (
          <Suspense fallback={<PanelLoader />}>
            <QueryBuilderPanel isActive={true} />
          </Suspense>
        ),
        closable: true,
        group: 'card custom'
      };

    case 'form-designer':
      return {
        id,
        title: data.title || t.index1032,
        content: (
          <Suspense fallback={<PanelLoader />}>
            <FormDesignerPanel
              formSetId={data.formSetId as number | undefined}
              onOpenPanel={openPanelFn}
            />
          </Suspense>
        ),
        closable: true,
        group: 'card custom'
      };

    case 'code-adjustments':
      return {
        id,
        title: data.title || t.index1048,
        content: (
          <Suspense fallback={<PanelLoader />}>
            <CodeAdjustmentsPanel />
          </Suspense>
        ),
        closable: true,
        group: 'card custom'
      };

    case 'formset-management':
      return {
        id,
        title: data.title || t.index1061,
        content: (
          <Suspense fallback={<PanelLoader />}>
            <FormSetManagementPanel
              onOpenPanel={openPanelFn}
            />
          </Suspense>
        ),
        closable: true,
        group: 'card custom'
      };

    case 'register':
    case 'profile':
    case 'forgot':
      // These can also be integrated later
      return {
        id,
        title: data.title || 'Auth Modal',
        content: (
          <TabContent>
            <div className="p-4 text-center">
              <p className="text-yellow-600 font-bold">{t.index1083}</p>
              <p>{t.index1084}</p>
              <p>{t.index1085}</p>
            </div>
          </TabContent>
        ),
        group: 'card custom'
      };

    default:
      // Handle debug-manual-generator panels with dynamic IDs (e.g., debug-manual-generator-gen-file-49-6-1)
      if (id.startsWith('debug-manual-generator')) {
        // Store data in window._tabData to handle rc-dock's multiple calls
        const tabKey = id;
        if (!window._tabData) window._tabData = {};

        if (data.templateId !== undefined || data.fileId !== undefined || data.tableId !== undefined || updateTitleCallback) {
          // First call - store the data
          window._tabData[tabKey] = {
            templateId: data.templateId,
            fileId: data.fileId,
            fileName: data.fileName, // ADD: Store filename for matching
            tableId: data.tableId,
            tableName: data.tableName,
            schemaId: data.schemaId,
            projectId: data.projectId,
            projectName: data.projectName,
            languageId: data.languageId,
            languageCode: data.languageCode,
            title: data.title,
            updateTitleCallback: updateTitleCallback
          } as any;
        }

        // Get stored data (works on subsequent calls)
        const storedData = window._tabData[tabKey] || {};

        return {
          id,
          title: data.title || storedData.title || t.index1122,
          content: (
            <Suspense fallback={<PanelLoader />}>
              <DebugManualGeneratorPanel
                tableId={storedData.tableId}
                tableName={storedData.tableName}
                schemaId={storedData.schemaId}
                projectId={storedData.projectId}
                projectName={storedData.projectName}
                templateId={storedData.templateId}
                fileId={storedData.fileId}
                fileName={storedData.fileName}
                languageCode={storedData.languageCode}
              />
            </Suspense>
          ),
          closable: true,
          group: 'card custom'
        };
      }

      // Handle project-specific panels (e.g., project-1, project-2)
      if (id.startsWith('project-')) {
        const projectId = parseInt(id.split('-')[1]);
        return {
          id,
          title: data.title || `${t.index1148}(${data.projectName || '${t.index1148_2}' + projectId})`,
          content: (
            <Suspense fallback={<PanelLoader />}>
              <ProjectPanel isActive={true} onOpenPanel={openPanelFn} projectId={projectId} />
            </Suspense>
          ),
          closable: true,
          group: 'card custom'
        };
      }
      
      // Handle schema-specific designer tabs (e.g., designer_schema_1, designer_schema_2)
      if (id.startsWith('designer_schema_')) {
        const schemaId = parseInt(id.split('_')[2]);
        const displayTitle = data.schemaName ? 
          `${t.index1163}(${data.schemaName})` : 
          `${t.index1164}(Schema ${schemaId})`;
        return {
          id,
          title: data.title || displayTitle,
          content: (
            <Suspense fallback={<PanelLoader />}>
              <PanelT2 preSelectedSchemaId={schemaId} />
            </Suspense>
          ),
          closable: true,
          group: 'card custom'
        };
      }
      
      // Handle legacy t2_schema_ tabs (for backward compatibility)
      if (id.startsWith('t2_schema_')) {
        const schemaId = parseInt(id.split('_')[2]);
        return {
          id,
          title: data.title || `${t.index1183}${schemaId})`,
          content: (
            <Suspense fallback={<PanelLoader />}>
              <PanelT2 preSelectedSchemaId={schemaId} />
            </Suspense>
          ),
          closable: true,
          group: 'card custom'
        };
      }

      // Note: project-settings panels are now handled by the non-project-specific case above

      // Better fallback - still try to load reasonable content
      if (id.startsWith('t')) {
        return {
          id,
          title: data.title || `Unknown Tab ${id}`,
          content: (
            <TabContent>
              <div className="p-4">
                <h4 className="font-bold text-red-600">{t.index1204}{id}</h4>
                <p>{t.index1205}</p>
                <p className="mt-2">{t.index1206}</p>
                <div className="mt-4 p-3 bg-red-100 rounded">
                  <p className="text-red-800">{t.index1208}</p>
                </div>
              </div>
            </TabContent>
          ),
          group: 'card custom'
        };
      }
      
      // Completely unknown
      return {
        id,
        title: data.title || id,
        content: (
          <TabContent>
            <div className="p-4">
              <h4 className="font-bold">{data.title || id}</h4>
              <p>Default content for {id}</p>
            </div>
          </TabContent>
        ),
        group: 'card custom'
      };
  }
};

interface IndexProps {
  // Reset password props when passed via URL parameters
  resetToken?: string;
  resetEmail?: string;
  // Demo mode props
  demoLogin?: boolean;
  demoUser?: 'demo-admin' | 'demo-user';
  demoMessage?: string;
  // Hidden system login - shows login fields in demo lobby
  demoSystemLogin?: boolean;
}

export default function Index(props: IndexProps = {}) {
  const { resetToken, resetEmail, demoLogin, demoUser, demoMessage, demoSystemLogin } = props;
  const ref = useRef<any>(null);
  const toast = useRef<Toast>(null);
  // i18n setup
  const [currentLanguage] = React.useState<SupportedLanguage>(getStoredLanguage());
  const { t } = useTranslation(currentLanguage);
  // Theme
  const { colors } = useTheme();

  // Fallback translations if lazy loading hasn't completed yet
  const tFallback = currentLanguage === 'de' ? de : en;
  
  // Project context
  const { projects, selectedProject, setSelectedProject } = useProject();

  // Initialize layout from localStorage or use default
  const [layout, setLayout] = useState(() => {
    const { layout: savedLayout } = LayoutPersistenceService.loadLayout();
    return savedLayout || initialLayout;
  });

  // Initialize left panel width from localStorage or use default
  const [leftPanelWidth, setLeftPanelWidth] = useState(() => {
    const { leftPanelWidth: savedWidth } = LayoutPersistenceService.loadLayout();
    return savedWidth;
  });
  const [isResizing, setIsResizing] = useState(false);

  // Forced logout message state (for single-session enforcement)
  const [forcedLogoutMessage, setForcedLogoutMessage] = useState<string | null>(null);

  // CMS Popups state for App
  const [cmsAppPopups, setCmsAppPopups] = useState<Array<{
    id: number;
    title: string;
    content: string;
    popup_priority: number;
    popup_version: number;
    slug: string;
  }>>([]);

  // Helper function to update layout and save to localStorage
  const updateLayout = useCallback((newLayout: any) => {
    setLayout(newLayout);
    LayoutPersistenceService.saveLayout(newLayout, leftPanelWidth);
  }, [leftPanelWidth]);

  // Save left panel width changes to localStorage
  useEffect(() => {
    LayoutPersistenceService.saveLayout(layout, leftPanelWidth);
  }, [leftPanelWidth, layout]);

  // Clear layout and reset to default
  const clearLayout = useCallback(() => {
    LayoutPersistenceService.clearLayout();
    setLayout(initialLayout);
    setLeftPanelWidth(300);

    // Clear tab data cache
    if (window._tabData) {
      window._tabData = {};
    }

    // Save the empty layout immediately to prevent race conditions
    LayoutPersistenceService.saveLayoutImmediate(initialLayout, 300);
  }, []);

  // Expose clearLayout globally for debugging/manual use
  useEffect(() => {
    (window as any).clearLayout = clearLayout;
    return () => {
      delete (window as any).clearLayout;
    };
  }, [clearLayout]);

  // Show layout restoration info on mount
  useEffect(() => {
    // Layout restoration handled silently
  }, []);

  // 🎯 DEMO AUTO-LOGIN
  useEffect(() => {
    if (demoLogin && demoUser) {
      const performDemoLogin = async () => {
        try {
          // Demo credentials
          const credentials = {
            email: demoUser,
            password: 'demo1234' // Demo password
          };

          // Get OAuth client credentials from env
          const clientId = import.meta.env.VITE_PASSPORT_CLIENT_ID;
          const clientSecret = import.meta.env.VITE_PASSPORT_CLIENT_SECRET;

          // Request OAuth token
          const response = await fetch('/api/oauth/token', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
            body: JSON.stringify({
              grant_type: 'password',
              client_id: clientId,
              client_secret: clientSecret,
              username: credentials.email,
              password: credentials.password,
              scope: '',
            }),
          });

          if (response.ok) {
            const data = await response.json();

            // Store tokens in sessionStorage (not persistent for demo)
            sessionStorage.setItem('access_token', data.access_token);
            sessionStorage.setItem('refresh_token', data.refresh_token);

            // Mark as demo mode
            sessionStorage.setItem('demo_mode', 'true');
            sessionStorage.setItem('demo_user', demoUser);

            // Fetch user data and store user_id/user_type (required for app to work)
            try {
              const userResponse = await fetch('/api/user', {
                headers: {
                  'Authorization': `Bearer ${data.access_token}`,
                  'Accept': 'application/json',
                },
              });

              if (userResponse.ok) {
                const userData = await userResponse.json();
                // Store in localStorage (same as normal login)
                localStorage.setItem('user_id', userData.id.toString());
                localStorage.setItem('user_type', userData.user_type || 'free');
                localStorage.setItem('is_inner_core', userData.is_inner_core ? '1' : '0');
              }
            } catch (userError) {
              console.error(t.index1387, userError);
            }

            // Show success message only once per session (not on every F5)
            if (toast.current && demoMessage && !sessionStorage.getItem('demo_toast_shown')) {
              toast.current.show({
                severity: 'success',
                summary: 'Demo Mode',
                detail: demoMessage,
                life: 5000
              });
              sessionStorage.setItem('demo_toast_shown', 'true');
            }

            // Directly set authenticated state - don't wait for checkAuthStatus
            setIsAuthenticated(true);

            // Trigger auth change event for other components
            window.dispatchEvent(new Event('storage'));
            window.dispatchEvent(new Event('auth-change'));
          } else {
            console.error(t.index1405, await response.text());
          }
        } catch (error) {
          console.error(t.index1408, error);
        }
      };

      performDemoLogin();
    }
  }, [demoLogin, demoUser, demoMessage]);

  // Auth Modal State - Initialize based on authentication status
  const [activeModal, setActiveModal] = useState<AuthModalType>(() => {
    // Check if user is authenticated on initial load
    const localToken = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
    const sessionToken = sessionStorage.getItem('access_token');
    const isLoggingOut = localStorage.getItem('logout_in_progress');
    const authenticated = !!(localToken || sessionToken);

    // Don't show login modal during logout process or if authenticated
    if (isLoggingOut || authenticated) {
      return null;
    }

    // 🎯 DEMO SYSTEM ACCESS: Show login modal with pre-filled credentials
    if (demoSystemLogin) {
      return 'login';
    }

    // 🎯 DEMO MODE: Don't show login modal, wait for auto-login
    if (demoLogin || sessionStorage.getItem('demo_mode') === 'true') {
      return null;
    }

    // Show login modal immediately if not authenticated
    return 'login';
  });
  
  // Auth State Management - Initialize based on token existence
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const localToken = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
    const sessionToken = sessionStorage.getItem('access_token');
    const hasToken = !!(localToken || sessionToken);

    // Clear session_revoke_notified flag if there's no token (fresh session after logout)
    // This allows the notification to show again if the user logs in and gets kicked out again
    if (!hasToken) {
      sessionStorage.removeItem('session_revoke_notified');
    }

    return hasToken;
  });
  const [hasAutoOpenedHome, setHasAutoOpenedHome] = useState<boolean>(false);

  // SQL Import Modal state
  const [showSqlImportModal, setShowSqlImportModal] = useState<boolean>(false);

  // Database Export Modal state
  const [showDatabaseExportModal, setShowDatabaseExportModal] = useState<boolean>(false);
  const [showPendingInvitation, setShowPendingInvitation] = useState(false);

  // Profile Modal default tab (for URL actions like renew-subscription)
  const [profileDefaultTab, setProfileDefaultTab] = useState<number>(0);

  // Load CMS popups for App when authenticated
  useEffect(() => {
    const loadAppPopups = async () => {
      if (!isAuthenticated) return;

      try {
        const response = await fetch(`/api/popups/app?locale=${currentLanguage}`, {
          headers: {
            'Accept': 'application/json',
          },
        });
        if (response.ok) {
          const popups = await response.json();
          setCmsAppPopups(popups);
        }
      } catch {
        // Silently fail - popups are not critical
      }
    };
    loadAppPopups();
  }, [isAuthenticated, currentLanguage]);

  // Modal management functions - defined early to ensure they're available

  const handleCloseModal = useCallback(() => {
    const currentModal = activeModal;

    // Prevent closing login modal if not authenticated (mandatory login)
    // In demo mode with a valid token, allow closing (state may not have caught up yet)
    if (currentModal === 'login' && !isAuthenticated) {
      const isDemoMode = sessionStorage.getItem('demo_mode') === 'true';
      const hasToken = !!(localStorage.getItem('access_token') || sessionStorage.getItem('access_token'));
      if (!(isDemoMode && hasToken)) {
        return; // Don't allow closing
      }
    }

    setActiveModal(null);

    // When the reset modal is closed and we come from a reset URL,
    // redirect to main page
    if (currentModal === 'reset' && resetToken) {
      setTimeout(() => {
        window.location.href = '/';
      }, 100);
    }
  }, [activeModal, isAuthenticated, resetToken]);


  // Direct event listener setup - outside useEffect
  React.useEffect(() => {
    const directModalSwitchHandler = (event: CustomEvent) => {
      const { modalType } = event.detail;
      localStorage.setItem('auth_modal_interaction', 'true');
      setActiveModal(modalType);
    };

    window.addEventListener('auth-modal-switch', directModalSwitchHandler as EventListener);

    return () => {
      window.removeEventListener('auth-modal-switch', directModalSwitchHandler as EventListener);
    };
   
  }, []); // Empty dependency array - only run once

  // Handle URL actions (e.g., renew-subscription from email links)
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const action = urlParams.get('action');

    if (action === 'renew-subscription' && isAuthenticated) {
      // Open Profile modal with Subscriptions tab (index 2)
      setProfileDefaultTab(2);
      setActiveModal('profile');

      // Clean up URL parameters after handling
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
    }
  }, [isAuthenticated]);

  // Check for pending invitations
  const checkPendingInvitation = useCallback(async () => {
    try {
      // Multiple auth checks to prevent race conditions
      const accessToken = localStorage.getItem('access_token') || sessionStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (!accessToken) {
        return;
      }

      // Additional guard: only check if we're actually authenticated
      if (!isAuthenticated) {
        return;
      }

      const response = await fetch('/api/my-pending-invitation', {
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        }
      });

      // Only process if response is OK and we're still authenticated
      if (response.ok && isAuthenticated) {
        const invitation = await response.json();
        if (invitation && invitation.status === 'pending') {
          setShowPendingInvitation(true);
        }
      }
    } catch {
      // Silently handle errors (e.g., 404 when not authenticated)
    }
  }, [isAuthenticated]);

  // Initial setup for Reset Password
  React.useEffect(() => {
    if (resetToken && resetEmail) {
      setActiveModal('reset');
      
      // Additional safeguard with delay
      setTimeout(() => {
        setActiveModal('reset');
      }, 200);
    }
  }, [resetToken, resetEmail]);

  // Auth Status Monitoring
  React.useEffect(() => {
    const checkAuthStatus = async () => {
      // Check both localStorage (Remember Me) and sessionStorage (Session only)
      const localToken = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      const sessionToken = sessionStorage.getItem('access_token');
      const token = localToken || sessionToken;

      // If no token at all, immediately set as not authenticated and show login
      if (!token) {
        setIsAuthenticated(false);
        // DON'T redirect if we're showing a forced logout message - user needs to see it
        // Check both the flag AND give time for the message to be set
        const hasForcedLogoutPending = localStorage.getItem('forced_logout_reason') ||
                                       sessionStorage.getItem('session_revoke_notified');
        if (window.location.pathname === '/app' && !hasForcedLogoutPending) {
          // Small delay to allow forced logout handling to complete first
          setTimeout(() => {
            // Re-check - maybe forced logout was set in the meantime
            const stillNoPendingLogout = !localStorage.getItem('forced_logout_reason') &&
                                         !sessionStorage.getItem('session_revoke_notified');
            if (stillNoPendingLogout && !localStorage.getItem('access_token') && !sessionStorage.getItem('access_token')) {
              // User is on /app but has no token and no forced logout - redirect to home
              window.location.href = '/';
            }
          }, 500);
        }
        return;
      }

      if (token) {
        try {
          // Validate token with API call
          const response = await fetch('/api/user', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/json',
            },
          });

          if (response.ok) {
            // Token is valid - no need to change isAuthenticated if it's already true
            if (!isAuthenticated) {
              setIsAuthenticated(true);

              // Check for pending invitations if just became authenticated
              // Add delay to ensure all auth state is stable
              setTimeout(() => {
                if (isAuthenticated && (localStorage.getItem('access_token') || sessionStorage.getItem('access_token') || sessionStorage.getItem('access_token'))) {
                  checkPendingInvitation();
                }
              }, 1000);
            }

            // Close login modal if authenticated (but keep other modals open)
            if (activeModal === 'login') {
              setActiveModal(null);
            }
          } else if (response.status === 401) {
            // Token is truly invalid (unauthorized) - clean up and set as not authenticated
            const isLoggingOut = localStorage.getItem('logout_in_progress');
            const alreadyNotified = sessionStorage.getItem('session_revoke_notified');

            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            localStorage.removeItem('remember_me');
            localStorage.removeItem('user');
            sessionStorage.removeItem('access_token');
            sessionStorage.removeItem('refresh_token');
            document.cookie = 'remember_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
            setIsAuthenticated(false);

            // If user had a token and got 401 (not during explicit logout),
            // show a notification that they were logged out from another device
            // Only notify once per session to avoid multiple notifications
            if (!isLoggingOut && !alreadyNotified) {
              sessionStorage.setItem('session_revoke_notified', 'true');
              // Dispatch event for session forcibly ended - will be handled by event listener
              window.dispatchEvent(new CustomEvent('sessionForciblyEnded', {
                detail: {
                  reason: 'other_device_login'
                }
              }));
            }

            // Show login modal for invalid tokens (but not during explicit logout)
            if (!isLoggingOut && !activeModal) {
              setActiveModal('login');
            }

            // Trigger storage event for other components
            window.dispatchEvent(new Event('storage'));
            window.dispatchEvent(new Event('auth-change'));
          } else {
            // Other error (500, 429, etc.) - don't destroy tokens
            // Temporary server issues shouldn't log out the user
          }
        } catch {
          // Network error - don't destroy tokens, just mark as temporarily unauthenticated
          // The next periodic check will re-validate when the network recovers
        }
      } else {
        setIsAuthenticated(false);
      }

      // Auto-open login modal if not authenticated and no modal is open (but not during logout)
      // Only do this on initial load, not when switching between auth modals
      const isLoggingOut = localStorage.getItem('logout_in_progress');
      const isDemoMode = sessionStorage.getItem('demo_mode') === 'true';
      if (!isAuthenticated && !activeModal && !resetToken && !isLoggingOut &&
          !localStorage.getItem('auth_modal_interaction') && !isDemoMode) {
        setActiveModal('login');
      }
    };

    // Initial check - only if we don't already know the user is authenticated
    // This prevents the login modal from flashing when user is already logged in
    const localToken = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
    const sessionToken = sessionStorage.getItem('access_token');
    const hasToken = !!(localToken || sessionToken);

    if (!hasToken || !isAuthenticated) {
      checkAuthStatus();
    }

    // Listen for storage changes (login/logout events)
    const handleStorageChange = () => {
      checkAuthStatus();
      
      // If logged out, close all panels
      const localToken = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      const sessionToken = sessionStorage.getItem('access_token');
      if (!localToken && !sessionToken) {
        closeAllPanels();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('auth-change', handleStorageChange);

    // Listen for auth modal switch events
    const handleAuthModalSwitch = (event: CustomEvent) => {
      const { modalType } = event.detail;
      localStorage.setItem('auth_modal_interaction', 'true');
      setActiveModal(modalType);
    };

    window.addEventListener('auth-modal-switch', handleAuthModalSwitch as EventListener);

    // Listen for session revoked events (single-session enforcement - on login)
    const handleSessionRevoked = (event: CustomEvent) => {
      if (toast.current) {
        toast.current.show({
          severity: 'info',
          summary: 'Session',
          detail: event.detail.message,
          life: 5000
        });
      }
    };
    window.addEventListener('sessionRevoked', handleSessionRevoked as EventListener);

    // Listen for session forcibly ended events (when token is revoked by another login or demo reset)
    const handleSessionForciblyEnded = (event: Event) => {
      const reason = (event as CustomEvent).detail?.reason || 'other_device';

      let message: string;
      if (reason === 'demo_reset') {
        message = t.index1769;
      } else {
        message = t.index1773;
      }
      setForcedLogoutMessage(message);

      // Also store in localStorage in case of page reload
      localStorage.setItem('forced_logout_reason', reason);
      localStorage.setItem('forced_logout_time', Date.now().toString());

      // Close all panels and go back to lobby
      closeAllPanels();
    };
    window.addEventListener('sessionForciblyEnded', handleSessionForciblyEnded as EventListener);

    // Check for forced logout message on mount (after page reload)
    const forcedLogoutReason = localStorage.getItem('forced_logout_reason');
    const forcedLogoutTime = localStorage.getItem('forced_logout_time');
    if (forcedLogoutReason && forcedLogoutTime) {
      // Only show if logout happened within the last 60 seconds (to avoid stale messages)
      const timeSinceLogout = Date.now() - parseInt(forcedLogoutTime, 10);
      if (timeSinceLogout < 60000) {
        let logoutMessage: string;
        if (forcedLogoutReason === 'demo_reset') {
          logoutMessage = t.index1791;
        } else {
          logoutMessage = t.index1793;
        }
        setForcedLogoutMessage(logoutMessage);
      }
      // Clear the stored reason
      localStorage.removeItem('forced_logout_reason');
      localStorage.removeItem('forced_logout_time');
    }

    // Periodic token validation (every 30 seconds for single-session enforcement)
    // This ensures users are quickly notified when logged out from another device
    const tokenCheckInterval = setInterval(() => {
      checkAuthStatus();
    }, 30 * 1000);

    // Demo reset countdown polling (only in demo mode, every 30 seconds)
    let demoCountdownShown5min = false;
    let demoCountdownShown1min = false;
    let demoCountdownInterval: ReturnType<typeof setInterval> | null = null;

    if (sessionStorage.getItem('demo_mode') === 'true') {
      demoCountdownInterval = setInterval(async () => {
        try {
          const resp = await fetch('/api/demo/countdown');
          if (!resp.ok) return;
          const data = await resp.json();
          if (!data.active) return;

          const mins = data.minutes_remaining;

          // T-5 min warning (show once)
          if (mins <= 5 && mins > 1 && !demoCountdownShown5min) {
            demoCountdownShown5min = true;
            if (toast.current) {
              toast.current.show({
                severity: 'warn',
                summary: t.index1830,
                detail: `${t.index1831}${mins}${t.index1831_2}`,
                life: 10000,
              });
            }
          }

          // T-1 min urgent warning (show once, sticky)
          if (mins <= 1 && mins > 0 && !demoCountdownShown1min) {
            demoCountdownShown1min = true;
            if (toast.current) {
              toast.current.show({
                severity: 'error',
                summary: t.index1843,
                detail: t.index1844,
                sticky: true,
              });
            }
          }

          // T-0: force clean logout
          if (mins <= 0) {
            // Clear tokens
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            localStorage.removeItem('user');
            sessionStorage.removeItem('access_token');
            sessionStorage.removeItem('refresh_token');
            sessionStorage.removeItem('user');
            sessionStorage.removeItem('demo_mode');

            // Trigger forced logout UI
            window.dispatchEvent(new CustomEvent('sessionForciblyEnded', {
              detail: { reason: 'demo_reset' }
            }));

            // Stop polling
            if (demoCountdownInterval) clearInterval(demoCountdownInterval);
          }
        } catch {
          // Silently ignore network errors during countdown poll
        }
      }, 30 * 1000);
    }

    // Also listen for manual localStorage changes
    const originalSetItem = localStorage.setItem;
    const originalRemoveItem = localStorage.removeItem;
    
    localStorage.setItem = function(key, value) {
      originalSetItem.call(this, key, value);
      if (key === 'access_token') {
        handleStorageChange();
      }
    };
    
    localStorage.removeItem = function(key) {
      originalRemoveItem.call(this, key);
      if (key === 'access_token') {
        handleStorageChange();
      }
    };

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('auth-change', handleStorageChange);
      window.removeEventListener('auth-modal-switch', handleAuthModalSwitch as EventListener);
      window.removeEventListener('sessionRevoked', handleSessionRevoked as EventListener);
      window.removeEventListener('sessionForciblyEnded', handleSessionForciblyEnded as EventListener);
      clearInterval(tokenCheckInterval);
      if (demoCountdownInterval) clearInterval(demoCountdownInterval);
      localStorage.setItem = originalSetItem;
      localStorage.removeItem = originalRemoveItem;
    };
   
  }, [isAuthenticated, checkPendingInvitation]); // Dependencies would cause infinite loop

  // Function to close all panels
  const closeAllPanels = () => {
    if (ref.current) {
      const emptyLayout = {
        "dockbox": {
          "id": "+1",
          "mode": "horizontal",
          "children": []
        },
        "floatbox": {
          "id": "+4",
          "size": 200,
          "mode": "float",
          "children": []
        },
        "windowbox": {
          "id": "+5",
          "size": 0,
          "mode": "window",
          "children": []
        },
        "maxbox": {
          "id": "+6",
          "size": 1,
          "mode": "maximize",
          "children": []
        }
      };

      // Clear tab data cache
      if (window._tabData) {
        window._tabData = {};
      }

      // Save immediately to prevent race conditions
      setLayout(emptyLayout);
      LayoutPersistenceService.saveLayoutImmediate(emptyLayout, leftPanelWidth);
    }
  };

  // Function to close all tabs except protected ones
  const closeAllTabs = () => {
    if (!ref.current) return;

    const currentLayout = ref.current.saveLayout();
    const protectedTabs = ['navigation', 't1', 'protect1'];

    const removeTabsFromNode = (node: any): any => {
      if (node.tabs && Array.isArray(node.tabs)) {
        // Filter out non-protected tabs
        const filteredTabs = node.tabs.filter((tab: any) =>
          protectedTabs.includes(tab.id)
        );

        return {
          ...node,
          tabs: filteredTabs,
          activeId: filteredTabs.length > 0 ? filteredTabs[0].id : undefined
        };
      }

      if (node.children) {
        const filteredChildren = node.children
          .map((child: any) => removeTabsFromNode(child))
          .filter((child: any) => {
            // Keep nodes that have tabs or children
            return (child.tabs && child.tabs.length > 0) ||
                   (child.children && child.children.length > 0);
          });

        return {
          ...node,
          children: filteredChildren
        };
      }

      return node;
    };

    const newLayout = {
      ...currentLayout,
      dockbox: removeTabsFromNode(currentLayout.dockbox),
      floatbox: removeTabsFromNode(currentLayout.floatbox),
      windowbox: removeTabsFromNode(currentLayout.windowbox),
      maxbox: removeTabsFromNode(currentLayout.maxbox)
    };

    // Clear tab data cache to prevent reopening closed tabs
    if (window._tabData) {
      window._tabData = {};
    }

    // CRITICAL: Save immediately without debouncing to prevent race conditions
    // If we use updateLayout (debounced), the user might open a new panel before
    // the save completes, causing the old layout to be restored
    setLayout(newLayout);
    LayoutPersistenceService.saveLayoutImmediate(newLayout, leftPanelWidth);
  };

  // Group definition - only for movable panels (moved inside component for closeAllTabs access)
  const groups = {
    'card custom': {
      floatable: true,
      closable: true,
      panelExtra: (panelData: any, context: any) => {
        const showCloseAllButton = true;

        return (
          <>
            <span
              className='my-panel-extra-btn'
              onClick={() => context.dockMove(panelData, null, 'maximize')}
              style={{ cursor: 'pointer', padding: '4px' }}
            >
              {panelData.parent.mode === 'maximize' ? icons.restore : icons.maximize}
            </span>
            {showCloseAllButton && (
              <span
                className='my-panel-extra-btn'
                onClick={(e) => {
                  e.stopPropagation();
                  closeAllTabs();
                }}
                style={{ cursor: 'pointer', padding: '4px' }}
                title="Close All Tabs"
              >
                {icons.closeAll}
              </span>
            )}
          </>
        );
      }
    }
  };

  const openPanel = useCallback((panelId: string, data?: any) => {
    // Check token existence directly as a fallback for when isAuthenticated state
    // hasn't caught up yet (e.g., during demo auto-login async phase)
    const hasToken = !!(localStorage.getItem('access_token') || sessionStorage.getItem('access_token'));

    if (!isAuthenticated && !hasToken) {
      setActiveModal('login');
      return;
    }

    if (!ref.current) {
      setTimeout(() => openPanel(panelId, data), 100);
      return;
    }

    // Note: project-settings panels are now handled by the non-project-specific case above

    setTimeout(() => {
      if (!ref.current) {
        return;
      }

      // Create unique tab ID for project-filtered panels
      // DON'T add -filtered if the panelId already contains a project-specific ID
      const isAlreadyProjectSpecific = panelId.includes('-project-') || panelId.startsWith('team-management-project-');
      let uniqueTabId = (data?.filterByProject && !isAlreadyProjectSpecific) ? `${panelId}-filtered` : panelId;

      // Check if a filtered tab already exists for this panel type (only for non-project-specific panels)
      if (data?.filterByProject && !isAlreadyProjectSpecific) {
        const existingFilteredTab = ref.current.find(`${panelId}-filtered`);
        if (existingFilteredTab) {
          uniqueTabId = `${panelId}-filtered`; // Use the existing tab ID instead of creating a new one
        }
      }

      const existingTab = ref.current.find(uniqueTabId);

      if (existingTab) {
        // Tab exists, just activate it within the tabset without moving
        if (existingTab.parent && existingTab.parent.activeId !== uniqueTabId) {
          // Update the parent tabset to make this tab active
          existingTab.parent.activeId = uniqueTabId;
          // Force re-render by updating layout
          const currentLayout = ref.current.saveLayout();
          updateLayout({...currentLayout});
        }
        // Tab is already active, do nothing
        return;
      } else {
        // Create new tab with updateTabTitle callback
        const updateTitleCallback = (newTitle: string) => {
          updateTabTitle(ref, setLayout, uniqueTabId, newTitle);
        };

        const newTab = loadTab({ id: uniqueTabId, ...data }, t, handleOpenDesigner, openPanel, updateTitleCallback, tFallback);

        if (newTab) {
          const currentLayout = ref.current.saveLayout();
          const firstTabset = findFirstTabset(currentLayout);

          if (!firstTabset) {
            // Create first tabset - MUST use currentLayout, not state layout!
            const updatedLayout = {
              ...currentLayout,
              dockbox: {
                ...currentLayout.dockbox,
                children: [
                  ...currentLayout.dockbox.children,
                  {
                    id: `+${Date.now()}`,
                    size: 300,
                    tabs: [{ id: uniqueTabId, title: newTab.title }],
                    group: 'card custom',
                    activeId: uniqueTabId
                  }
                ]
              }
            };
            updateLayout(updatedLayout);
          } else {
            try {
              // Add new tab to existing tabset
              const currentLayout = ref.current.saveLayout();
              
              function addTabToTabset(node: any): boolean {
                if (node.tabs && Array.isArray(node.tabs) && node.tabs.length > 0) {
                  node.tabs.push({ id: uniqueTabId, title: newTab.title });
                  node.activeId = uniqueTabId;
                  return true;
                }
                
                if (node.children && Array.isArray(node.children)) {
                  for (const child of node.children) {
                    if (addTabToTabset(child)) return true;
                  }
                }
                return false;
              }
              
              // Try to add to existing tabset
              const added = addTabToTabset(currentLayout.dockbox) ||
                           addTabToTabset(currentLayout.floatbox) ||
                           addTabToTabset(currentLayout.windowbox) ||
                           addTabToTabset(currentLayout.maxbox);
              
              if (added) {
                updateLayout({...currentLayout});
              } else {
                // Fallback: create new tabset
                const updatedLayout = {
                  ...currentLayout,
                  dockbox: {
                    ...currentLayout.dockbox,
                    children: [
                      ...currentLayout.dockbox.children,
                      {
                        id: `+${Date.now()}`,
                        size: 300,
                        tabs: [{ id: uniqueTabId, title: newTab.title }],
                        group: 'card custom',
                        activeId: uniqueTabId
                      }
                    ]
                  }
                };
                updateLayout(updatedLayout);
              }
            } catch {
              // Error in layout modification
              // Final fallback - MUST use current layout from ref, not state!
              const fallbackLayout = ref.current.saveLayout();
              const updatedLayout = {
                ...fallbackLayout,
                dockbox: {
                  ...fallbackLayout.dockbox,
                  children: [
                    ...fallbackLayout.dockbox.children,
                    {
                      id: `+${Date.now()}`,
                      size: 300,
                      tabs: [{ id: uniqueTabId, title: newTab.title }],
                      group: 'card custom',
                      activeId: uniqueTabId
                    }
                  ]
                }
              };
              updateLayout(updatedLayout);
            }
          }
        }
      }
    }, 50);
   
  }, [isAuthenticated, projects, selectedProject, setSelectedProject, updateLayout]); // Other dependencies would cause infinite loop

  // Handle opening designer with pre-selected schema
  const handleOpenDesigner = useCallback((schemaId: number, schemaName?: string) => {
    const hasToken = !!(localStorage.getItem('access_token') || sessionStorage.getItem('access_token'));
    if (!isAuthenticated && !hasToken) {
      setActiveModal('login');
      return;
    }

    // Simply use the existing openPanel function with a unique panel ID
    const uniquePanelId = `designer_schema_${schemaId}`;
    openPanel(uniquePanelId, { schemaName });
  }, [isAuthenticated, openPanel]);

  // Auto-open Home tab on app start (must be after openPanel definition)
  React.useEffect(() => {
    const shouldOpenHomeTab = localStorage.getItem('open_home_on_start');
    
    // Only auto-open once per session and only if not already opened
    if (!hasAutoOpenedHome && (shouldOpenHomeTab === null || shouldOpenHomeTab === 'true')) {
      // Only auto-open if authenticated and no active modal
      if (isAuthenticated && !activeModal) {
        // Small delay to ensure everything is loaded
        setTimeout(() => {
          openPanel('home');
          setHasAutoOpenedHome(true); // Mark as opened to prevent reopening
        }, 500);
      }
    }
  }, [isAuthenticated, activeModal, openPanel, hasAutoOpenedHome]);

  // Handle panel=cms URL parameter (from CMS page edit button)
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const panel = urlParams.get('panel');
    const pageId = urlParams.get('pageId');

    if (panel === 'cms' && pageId && isAuthenticated) {
      const parsedPageId = parseInt(pageId, 10);

      // Open CMS Admin panel
      setTimeout(() => {
        openPanel('cms-admin', { editPageId: parsedPageId });

        // Also dispatch event in case panel already exists
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('cms-edit-page', {
            detail: { pageId: parsedPageId }
          }));
        }, 300);
      }, 600);

      // Clean up URL parameters after handling
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
    }
  }, [isAuthenticated, openPanel]);

  // Listen for notification bell click to open Applications Modal via ProjectPanel
  useEffect(() => {
    const handleOpenApplicationsModal = () => {
      // First, ensure ProjectPanel is open
      openPanel('project');

      // Multiple attempts to trigger the modal - try different timings
      const tryTriggerModal = (attempt: number) => {
        const event = new CustomEvent('openApplicationsModalInPanel', {
          detail: { fromTopBar: true, attempt }
        });
        window.dispatchEvent(event);

        // If this is the first few attempts, try again in case the panel isn't ready yet
        if (attempt < 3) {
          setTimeout(() => tryTriggerModal(attempt + 1), 200);
        }
      };

      // Start the first attempt after initial delay
      setTimeout(() => tryTriggerModal(1), 300);
    };

    window.addEventListener('openApplicationsModal', handleOpenApplicationsModal as EventListener);

    return () => {
      window.removeEventListener('openApplicationsModal', handleOpenApplicationsModal as EventListener);
    };
  }, [openPanel]);

  // Listen for message notification click to open Messaging Panel
  useEffect(() => {
    const handleOpenMessaging = (event: CustomEvent) => {
      const threadId = event.detail?.threadId;
      openPanel('messaging', { threadId });
    };

    window.addEventListener('openMessaging', handleOpenMessaging as EventListener);

    return () => {
      window.removeEventListener('openMessaging', handleOpenMessaging as EventListener);
    };
  }, [openPanel]);

  // Listen for team roles panel open event
  useEffect(() => {
    const handleOpenTeamRoles = (event: CustomEvent) => {
      const { teamId, teamName, isOwner } = event.detail || {};
      if (teamId) {
        openPanel('team-roles', { teamId, teamName, isOwner });
      }
    };

    window.addEventListener('openTeamRolesPanel', handleOpenTeamRoles as EventListener);

    return () => {
      window.removeEventListener('openTeamRolesPanel', handleOpenTeamRoles as EventListener);
    };
  }, [openPanel]);

  // Helper function to clean layout for export
  const cleanLayoutForExport = (layout: any) => {
    const cleanLayout = JSON.parse(JSON.stringify(layout));

    const cleanTabs = (obj: any) => {
      if (obj.tabs) {
        obj.tabs = obj.tabs.map((tab: any) => ({
          id: tab.id,
          title: tab.title || tab.id,
          closable: tab.closable,
          group: tab.group
        }));
      }

      if (obj.children) {
        obj.children.forEach(cleanTabs);
      }
    };

    if (cleanLayout.dockbox) cleanTabs(cleanLayout.dockbox);
    if (cleanLayout.floatbox) cleanTabs(cleanLayout.floatbox);
    if (cleanLayout.windowbox) cleanTabs(cleanLayout.windowbox);
    if (cleanLayout.maxbox) cleanTabs(cleanLayout.maxbox);

    return cleanLayout;
  };

// ✅ CORRECTED Hotkeys - use the correct parameters
useHotkeys('alt+p', () => {
  
  if (ref.current) {
    const timestamp = new Date().toLocaleTimeString();
    const newTitle = `Main Tab - Updated ${timestamp}`;
            
    // Important: Pass title in data so loadTab can use it
    ref.current.updateTab('t2', {
      id: 't2',
      title: newTitle  // ← THAT is important!
    }, true);

  }
});

// 2. Maximize tab (that's the right way!)
useHotkeys('alt+m', () => {
  
  if (ref.current) {
    const tab = ref.current.find('t2');
    
    if (tab && tab.parent) {
      // Check current state
      if (tab.parent.mode === 'maximize') {
        // Already maximized - restore
        ref.current.dockMove(tab.parent, null, 'float'); // or 'dock'
      } else {
        // Maximize
        ref.current.dockMove(tab.parent, null, 'maximize');
      }
    }
  }
});
  // Hotkeys
  useHotkeys('alt+u', () => {
    if (ref.current) {
      ref.current.updateTab('t2', { id: 't2' }, true);
    }
  });

  useHotkeys('alt+m', () => {
    if (ref.current) {
      const tab = ref.current.find('panelt2');
      if (tab) {
        ref.current.dockMove(tab.parent, null, 'maximize');
      }
    }
  });

  useHotkeys('alt+l', () => {
  });

  // Clear saved layout with Alt+R (Reset)
  useHotkeys('alt+r', () => {
    if (confirm('Clear saved layout and reset to default?')) {
      clearLayout();
    }
  });

  useHotkeys('alt+c', async () => {
    const cleanedLayout = cleanLayoutForExport(layout);
    const layoutJson = JSON.stringify(cleanedLayout, null, 2);

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(layoutJson);
        alert('Layout was copied to clipboard!');
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = layoutJson;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();

        const successful = document.execCommand('copy');
        document.body.removeChild(textarea);

        if (successful) {
          alert('Layout was copied to clipboard!');
        }
      }
    } catch {
      alert('See console for manual copying.');
    }
  });

  // Function to find the active tab in the current layout
  const findActiveTab = useCallback(() => {
    if (!ref.current) return null;

    const currentLayout = ref.current.saveLayout();

    const findActiveInNode = (node: any): string | null => {
      if (node.tabs && Array.isArray(node.tabs)) {
        // Find the active tab in this tabset
        for (const tab of node.tabs) {
          if (tab.id && node.activeId === tab.id) {
            return tab.id;
          }
        }
      }

      // Search children
      if (node.children) {
        for (const child of node.children) {
          const activeTab = findActiveInNode(child);
          if (activeTab) return activeTab;
        }
      }

      return null;
    };

    return findActiveInNode(currentLayout?.dockbox);
  }, []);

  // ESC to close active tab
  useHotkeys('escape', () => {
    // Check if there are any open modals first
    const hasOpenModal = document.querySelector('.p-dialog:not([style*="display: none"])') ||
                        document.querySelector('.ant-modal:not(.ant-modal-hidden)');

    if (hasOpenModal) {
      // If there's an open modal, let it handle the ESC key
      return;
    }

    // Find and close the active tab if no modals are open
    if (ref.current) {
      const activeTabId = findActiveTab();

      if (activeTabId) {
        const activeTab = ref.current.find(activeTabId);

        if (activeTab && activeTab.parent) {
          // Don't close protected tabs (like navigation)
          const protectedTabs = ['navigation', 't1', 'protect1'];

          if (!protectedTabs.includes(activeTabId)) {
            ref.current.dockMove(activeTab, null, 'remove');
          }
        }
      }
    }
  }, {
    enableOnFormTags: ['INPUT', 'TEXTAREA', 'SELECT']  // Allow ESC even when focused on form elements
  });

  const onLayoutChange = useCallback((newLayout: any, currentTabId?: string, direction?: string) => {
    if (currentTabId === 'protect1' && direction === 'remove') {
      alert('Removal of this tab is rejected!');
    } else {
      updateLayout(newLayout);
    }
  }, [updateLayout]);

  // Resize handler for the left panel
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsResizing(true);
    e.preventDefault();
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing) return;

    const newWidth = e.clientX;
    if (newWidth >= 200 && newWidth <= 600) { // Min/Max limits
      setLeftPanelWidth(newWidth);
    }
  }, [isResizing]);

  const handleMouseUp = () => {
    setIsResizing(false);
  };

  // Event listeners for resize
  React.useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'ew-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing, handleMouseMove]);

  const handleOpenModal = (modalType: AuthModalType) => {
    setActiveModal(modalType);
  };

  // SQL Import Modal handlers
  const handleOpenSqlImport = () => {
    setShowSqlImportModal(true);
  };

  const handleCloseSqlImport = () => {
    setShowSqlImportModal(false);
  };

  const handleSqlImportSuccess = () => {
    // Don't close modal - let user see the success message and close manually
    // The modal will show its own success message
  };

  // Database Export Modal handlers
  const handleOpenDatabaseExport = () => {
    setShowDatabaseExportModal(true);
  };

  const handleCloseDatabaseExport = () => {
    setShowDatabaseExportModal(false);
  };


  return (
    <>
      <Head title={resetToken ? "Reset Password - Scoriet" : "Scoriet - Enterprise Code Generator"} />

      {/* Toast Notification Component */}
      <Toast
        ref={toast}
        position="top-right"
        style={{ zIndex: 9999 }}
      />

      <ErrorBoundary
        FallbackComponent={(props) => <ErrorFallback {...props} resetError={props.resetErrorBoundary} />}
      >
        <ProjectProvider>
        <div
          style={{
            height: '100vh',
            width: '100vw',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: colors.bgPrimary
          }}
        >
          {/* TOP BAR */}
          <TopBar />

          {/* HAUPTBEREICH */}
          <div style={{ flex: 1, display: 'flex', overflow: 'hidden', backgroundColor: colors.bgPrimary }}>
            {/* NEUE NAVIGATION LINKS */}
            <NewNavigationPanel onOpenPanel={openPanel} onOpenModal={handleOpenModal} onOpenSqlImport={handleOpenSqlImport} onOpenDatabaseExport={handleOpenDatabaseExport} />

            {/* ARBEITSBEREICH MIT LINKEM PANEL UND MDI */}
            <div style={{ flex: 1, display: 'flex', overflow: 'hidden', backgroundColor: colors.bgPrimary }}>
              {/* LINKES PANEL (Tree View) - Größe änderbar */}
              <div
                style={{
                  width: `${leftPanelWidth}px`,
                  flexShrink: 0,
                  backgroundColor: colors.bgSecondary,
                  borderRight: `1px solid ${colors.borderPrimary}`
                }}
              >
                <PanelT1 onOpenPanel={openPanel} />
              </div>

              {/* RESIZE HANDLE */}
              <div
                style={{
                  width: '4px',
                  backgroundColor: isResizing ? colors.accent : 'transparent',
                  cursor: 'ew-resize',
                  flexShrink: 0,
                  borderLeft: `1px solid ${colors.borderPrimary}`,
                  borderRight: `1px solid ${colors.borderPrimary}`
                }}
                onMouseDown={handleMouseDown}
              />

              {/* RC-DOCK MDI AREA */}
              <div style={{ flex: 1, position: 'relative', backgroundColor: colors.bgPrimary }}>
                <DockLayout
                  ref={ref}
                  layout={layout as any}
                  onLayoutChange={onLayoutChange}
                  loadTab={(data: any) => loadTab(data, t, handleOpenDesigner, openPanel, undefined, tFallback)}
                  groups={groups}
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: colors.bgPrimary
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* SQL IMPORT MODAL - Must be inside ProjectProvider */}
        {showSqlImportModal && (
          <Suspense fallback={<div>Loading...</div>}>
            <SqlImportModal
              isOpen={showSqlImportModal}
              onClose={handleCloseSqlImport}
              onSuccess={handleSqlImportSuccess}
            />
          </Suspense>
        )}

        {/* DATABASE EXPORT MODAL - Must be inside ProjectProvider */}
        {showDatabaseExportModal && (
          <Suspense fallback={<div>Loading...</div>}>
            <DatabaseExportModal
              isOpen={showDatabaseExportModal}
              onClose={handleCloseDatabaseExport}
            />
          </Suspense>
        )}
        </ProjectProvider>
      </ErrorBoundary>

      {/* FORCED LOGOUT MODAL - blocks all interaction until user acknowledges */}
      {forcedLogoutMessage && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              backgroundColor: '#fff3cd',
              border: '2px solid #ffc107',
              borderRadius: '12px',
              padding: '24px 32px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
              maxWidth: '450px',
              width: '90%',
              textAlign: 'center',
            }}
          >
            <i
              className="pi pi-exclamation-triangle"
              style={{ color: '#856404', fontSize: '3rem', marginBottom: '16px', display: 'block' }}
            />
            <div style={{ fontWeight: 700, color: '#856404', fontSize: '1.25rem', marginBottom: '12px' }}>
              {localStorage.getItem('language') === 'de' ? 'Session beendet' : 'Session ended'}
            </div>
            <div style={{ color: '#856404', fontSize: '1rem', marginBottom: '24px', lineHeight: '1.5' }}>
              {forcedLogoutMessage}
            </div>
            <button
              onClick={() => {
                // Clear the message and all related flags
                setForcedLogoutMessage(null);
                localStorage.removeItem('forced_logout_reason');
                localStorage.removeItem('forced_logout_time');
                sessionStorage.removeItem('session_revoke_notified');
                // Redirect to lobby
                window.location.href = '/';
              }}
              style={{
                backgroundColor: '#856404',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                padding: '12px 32px',
                fontSize: '1rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'background-color 0.2s',
              }}
              onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#6d5303')}
              onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#856404')}
            >
              {localStorage.getItem('language') === 'de' ? 'Zur Startseite' : 'Go to Homepage'}
            </button>
          </div>
        </div>
      )}

      {/* AUTH MODAL SYSTEM */}
      <AuthModalManager
        activeModal={activeModal}
        onCloseModal={handleCloseModal}
        resetPasswordToken={resetToken}
        resetPasswordEmail={resetEmail}
        isLoginClosable={isAuthenticated} // Login modal only closable when authenticated
        profileDefaultTab={profileDefaultTab} // For URL actions like renew-subscription
        showLoginFields={demoSystemLogin}
        onLoginSuccess={() => {
          // Login succeeded - directly update auth state and close modal
          // Don't rely on handleCloseModal() which checks isAuthenticated state
          // that hasn't been updated yet via checkAuthStatus
          setIsAuthenticated(true);
          setActiveModal(null);
          // Update NavigationPanel auth status via localStorage event
          window.dispatchEvent(new Event('storage'));
          // Also dispatch custom auth event for ProjectContext
          window.dispatchEvent(new Event('auth-change'));
          // Clear modal interaction flag after successful login
          localStorage.removeItem('auth_modal_interaction');
          // Clear forced logout message and notification flag
          setForcedLogoutMessage(null);
          sessionStorage.removeItem('session_revoke_notified');
          // Check for pending invitations after login
          setTimeout(() => {
            checkPendingInvitation();
          }, 500);
        }}
        onRegistrationSuccess={(message: string) => {
          handleCloseModal();

          // Small delay to ensure modal is fully closed before showing toast
          setTimeout(() => {
            if (toast.current) {
              toast.current.show({
                severity: 'success',
                summary: 'Registration Successful',
                detail: message,
                life: 8000, // 8 seconds
                closable: true
              });
            }
          }, 300); // 300ms delay for modal closing animation
        }}
      />

      {/* PENDING INVITATION MODAL */}
      {showPendingInvitation && (
        <Suspense fallback={<div>Loading...</div>}>
          <PendingInvitationModal
            visible={showPendingInvitation}
            onHide={() => setShowPendingInvitation(false)}
            onAccepted={() => {
              setShowPendingInvitation(false);
              // Refresh the project context
              window.dispatchEvent(new Event('auth-change'));
            }}
            onDeclined={() => {
              setShowPendingInvitation(false);
            }}
          />
        </Suspense>
      )}

      {/* CMS POPUPS FOR APP */}
      {isAuthenticated && cmsAppPopups.length > 0 && (
        <CMSPopupModal
          popups={cmsAppPopups}
          storageKeyPrefix="cms_popup_app_"
          userId={localStorage.getItem('user_id')}
        />
      )}
    </>
  );
}