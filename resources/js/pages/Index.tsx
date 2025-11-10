//resources/js/pages/Index.tsx
import React, { useRef, useState, useCallback, useEffect, lazy, Suspense } from 'react';
import { Head } from '@inertiajs/react';
import { DockLayout } from 'rc-dock';
import "rc-dock/dist/rc-dock.css";

import { useHotkeys } from 'react-hotkeys-hook';
import { ErrorBoundary } from 'react-error-boundary';
import { Toast } from 'primereact/toast';
import { TabContentProps } from '@/types';
import ErrorFallback from '@/Components/ErrorFallback';

// Global window interface for tab data
declare global {
  interface Window {
    _tabData?: Record<string, {
      filterByProject?: boolean;
      forceProjectId?: number;
      forceProjectName?: string;
      title?: string;
      updateTitleCallback?: (newTitle: string) => void;
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
const PanelT3 = lazy(() => import('@/Components/Panels/PanelT3'));
const PanelT5 = lazy(() => import('@/Components/Panels/PanelT5'));
const AuthPanel = lazy(() => import('@/Components/Panels/AuthPanel'));
const TeamsPanel = lazy(() => import('@/Components/Panels/TeamsPanel'));
const ProjectPanel = lazy(() => import('@/Components/Panels/ProjectPanel'));
const MyApplicationsPanel = lazy(() => import('@/Components/Panels/MyApplicationsPanel'));
const PublicProjectsPanel = lazy(() => import('@/Components/Panels/PublicProjectsPanel'));
const TemplateManagementPanel = lazy(() => import('@/Components/Panels/TemplateManagementPanel'));
const TemplateReviewPanel = lazy(() => import('@/Components/Panels/TemplateReviewPanel'));
const TeamManagementPanel = lazy(() => import('@/Components/Panels/TeamManagementPanel'));
const DatabaseManagementPanel = lazy(() => import('@/Components/Panels/DatabaseManagementPanel'));
const TemplateDbSchemaDependenciesPanel = lazy(() => import('@/Components/Panels/TemplateDbSchemaDependenciesPanel'));
const DebugManualGeneratorPanel = lazy(() => import('@/Components/Panels/DebugManualGeneratorPanel'));
const CodeGenerationPanel = lazy(() => import('@/Components/Panels/CodeGenerationPanel'));
const LanguageManagementPanel = lazy(() => import('@/Components/Panels/LanguageManagementPanel'));
const SchemaTranslationPanel = lazy(() => import('@/Components/Panels/SchemaTranslationPanel'));
const SystemSettingsPanel = lazy(() => import('@/Components/Panels/SystemSettingsPanel'));
const ProjectSettingsPanel = lazy(() => import('@/Components/Panels/ProjectSettingsPanel'));
const CMSAdminPanel = lazy(() => import('@/Components/Panels/CMSAdminPanel'));
const QueryBuilderPanel = lazy(() => import('@/Components/Panels/QueryBuilderPanel'));
const LandingPage = lazy(() => import('@/pages/LandingPage'));

// Auth Modal System
import AuthModalManager, { AuthModalType } from '@/Components/AuthModals/AuthModalManager';

// Pending Invitation Modal
const PendingInvitationModal = lazy(() => import('@/Components/Modals/PendingInvitationModal'));

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
  <div className="flex items-center justify-center h-64 bg-gray-800 text-gray-100">
    <div className="text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
      <p className="text-sm text-gray-300">Loading panel...</p>
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
  handleOpenDesigner?: (schemaId: number) => void,
  openPanelFn?: (panelId: string, data?: any) => void,
  updateTitleCallback?: (newTitle: string) => void
) => {
  const { id } = data;

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
      title: data.title || templateStoredData.title || 'Template Verwaltung',
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

    return {
      id,
      title: data.title || databaseStoredData.title || 'Database Management',
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
        title: data.title || 'Welcome',
        content: (
          <Suspense fallback={<PanelLoader />}>
            <LandingPage isAuthenticated={true} />
          </Suspense>
        ),
        closable: true,
        group: 'card custom'
      };

    case 't2':
      return {
        id,
        title: data.title || 'Database Designer',
        content: (
          <Suspense fallback={<PanelLoader />}>
            <PanelT2 preSelectedSchemaId={data.preSelectedSchemaId} />
          </Suspense>
        ),
        closable: true,
        group: 'card custom'
      };

    case 't3':
      return {
        id,
        title: data.title || 'Templates',
        content: (
          <Suspense fallback={<PanelLoader />}>
            <PanelT3 />
          </Suspense>
        ),
        closable: true,
        group: 'card custom'
      };

    case 't5':
      return {
        id,
        title: data.title || 'Database Explorer',
        content: (
          <Suspense fallback={<PanelLoader />}>
            <PanelT5 />
          </Suspense>
        ),
        closable: true,
        group: 'card custom'
      };

    case 'teams':
    case 'teams-filtered':
    case 'teams-filtered-filtered': {
      // Handle rc-dock's multiple calls - use unique tab ID to store persistent data
      const teamsTabKey = id; // Use the unique tab ID directly

      // Store persistent data in a global object (rc-dock workaround)
      if (!window._tabData) window._tabData = {};

      if (data.filterByProject !== undefined || data.forceProjectId !== undefined || updateTitleCallback) {
        // First call - store the data and callback
        window._tabData[teamsTabKey] = {
          filterByProject: data.filterByProject,
          forceProjectId: data.forceProjectId,
          title: data.title,
          updateTitleCallback: updateTitleCallback
        } as any;
      }

      // Get the stored data (works on subsequent calls)
      const teamsStoredData = window._tabData[teamsTabKey] || {};
      const teamsShouldShowProjectFilter = teamsStoredData.filterByProject === true;
      const teamsForceProjectId = teamsStoredData.forceProjectId as number | undefined;
      const teamsActualUpdateTitleCallback = teamsStoredData.updateTitleCallback || updateTitleCallback;

      return {
        id,
        title: data.title || 'Teams',
        content: (
          <Suspense fallback={<PanelLoader />}>
            <TeamsPanel
              isActive={true}
              filterByProject={teamsShouldShowProjectFilter}
              forceProjectId={teamsForceProjectId}
              updateTabTitle={teamsActualUpdateTitleCallback}
            />
          </Suspense>
        ),
        closable: true,
        group: 'card custom'
      };
    }

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

    case 'login':
      return {
        id,
        title: data.title || 'Login',
        content: (
          <Suspense fallback={<PanelLoader />}>
            <AuthPanel initialPanel="login" />
          </Suspense>
        ),
        closable: true,
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
        title: data.title || 'Template Verwaltung',
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
        title: data.title || 'Database Management',
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

    case 'template-db-schema-dependencies':
      return {
        id,
        title: data.title || 'Template - DB Schema Dependencies',
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
        title: data.title || '🔧 Debug Manual Generator',
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
        title: data.title || 'Code Generation',
        content: (
          <Suspense fallback={<PanelLoader />}>
            <CodeGenerationPanel isActive={true} />
          </Suspense>
        ),
        closable: true,
        group: 'card custom'
      };

    case 'language-management':
      return {
        id,
        title: data.title || 'Language Management',
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
        title: data.title || 'Schema Translation',
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
        title: data.title || 'System Settings',
        content: (
          <Suspense fallback={<PanelLoader />}>
            <SystemSettingsPanel />
          </Suspense>
        ),
        closable: true,
        group: 'card custom'
      };

    case 'project-settings':
      return {
        id,
        title: data.title || 'Project Settings',
        content: (
          <Suspense fallback={<PanelLoader />}>
            <ProjectSettingsPanel />
          </Suspense>
        ),
        closable: true,
        group: 'card custom'
      };

    case 'cms-admin':
      return {
        id,
        title: data.title || 'CMS Admin',
        content: (
          <Suspense fallback={<PanelLoader />}>
            <CMSAdminPanel />
          </Suspense>
        ),
        closable: true,
        group: 'card custom'
      };

    case 'query-builder':
      return {
        id,
        title: data.title || 'Query Builder',
        content: (
          <Suspense fallback={<PanelLoader />}>
            <QueryBuilderPanel isActive={true} />
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
              <p className="text-yellow-600 font-bold">📋 Information</p>
              <p>Authentication is now handled via modal windows.</p>
              <p>Use the navigation menu to access Login, Register, or Profile.</p>
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
          title: data.title || storedData.title || '🔧 Debug Manual Generator',
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
          title: data.title || `Project Management (${data.projectName || 'Project ' + projectId})`,
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
          `Database Designer (${data.schemaName})` : 
          `Database Designer (Schema ${schemaId})`;
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
          title: data.title || `Database Designer (Schema ${schemaId})`,
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
                <h4 className="font-bold text-red-600">⚠️ Unknown Tab: {id}</h4>
                <p>This tab ID is not defined in loadTab function.</p>
                <p className="mt-2">Available tabs: t2, t3, t5, protect1, login, register, profile, forgot</p>
                <div className="mt-4 p-3 bg-red-100 rounded">
                  <p className="text-red-800">Check your loadTab function!</p>
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
}

export default function Index(props: IndexProps = {}) {
  const { resetToken, resetEmail, demoLogin, demoUser, demoMessage } = props;
  const ref = useRef<any>(null);
  const toast = useRef<Toast>(null);

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
            password: 'demo123' // Demo password
          };

          // Get OAuth client credentials from env
          const clientId = import.meta.env.VITE_PASSPORT_CLIENT_ID;
          const clientSecret = import.meta.env.VITE_PASSPORT_CLIENT_SECRET;

          // Request OAuth token
          const response = await fetch('/oauth/token', {
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

            // Trigger auth change event
            window.dispatchEvent(new Event('storage'));
            window.dispatchEvent(new Event('auth-change'));

            console.log(`✅ Demo auto-login successful: ${demoUser}`);
          } else {
            console.error('❌ Demo auto-login failed:', await response.text());
          }
        } catch (error) {
          console.error('❌ Demo auto-login error:', error);
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
    return !!(localToken || sessionToken);
  });
  const [hasAutoOpenedHome, setHasAutoOpenedHome] = useState<boolean>(false);

  // SQL Import Modal state
  const [showSqlImportModal, setShowSqlImportModal] = useState<boolean>(false);

  // Database Export Modal state
  const [showDatabaseExportModal, setShowDatabaseExportModal] = useState<boolean>(false);
  const [showPendingInvitation, setShowPendingInvitation] = useState(false);


  // Modal management functions - defined early to ensure they're available

  const handleCloseModal = useCallback(() => {
    const currentModal = activeModal;

    // Prevent closing login modal if not authenticated (mandatory login)
    if (currentModal === 'login' && !isAuthenticated) {
      return; // Don't allow closing
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
        if (window.location.pathname === '/app') {
          // User is on /app but has no token - redirect to home
          window.location.href = '/';
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
          } else {
            // Token is invalid (401, 404, etc.) - clean up and set as not authenticated
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            localStorage.removeItem('remember_me');
            localStorage.removeItem('user');
            sessionStorage.removeItem('access_token');
            sessionStorage.removeItem('refresh_token');
            document.cookie = 'remember_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
            setIsAuthenticated(false);

            // Show login modal for invalid tokens (but not during explicit logout)
            const isLoggingOut = localStorage.getItem('logout_in_progress');
            if (!isLoggingOut && !activeModal) {
              setActiveModal('login');
            }

            // Trigger storage event for other components
            window.dispatchEvent(new Event('storage'));
            window.dispatchEvent(new Event('auth-change'));
          }
        } catch {
          // Network error or other issue - clean up tokens and set unauthenticated
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('remember_me');
          localStorage.removeItem('user');
          sessionStorage.removeItem('access_token');
          sessionStorage.removeItem('refresh_token');
          setIsAuthenticated(false);

          // Trigger storage event for other components
          window.dispatchEvent(new Event('storage'));
          window.dispatchEvent(new Event('auth-change'));
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

    // Periodic token validation (every 10 minutes)
    const tokenCheckInterval = setInterval(() => {
      checkAuthStatus();
    }, 10 * 60 * 1000);

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
      clearInterval(tokenCheckInterval);
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
    // Don't override existing auth modals
    if (!isAuthenticated && !activeModal) {
      setActiveModal('login');
      return;
    }

    // If user is not authenticated and there's already a modal, just return
    if (!isAuthenticated) {
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

        const newTab = loadTab({ id: uniqueTabId, ...data }, handleOpenDesigner, openPanel, updateTitleCallback);

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
    if (!isAuthenticated) {
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
// 3. Create new tab and maximize immediately
useHotkeys('alt+n', () => {
    
  if (ref.current) {
    const existingTab = ref.current.find('t5');
    
    if (existingTab) {
      // Tab already exists - activate and maximize
      ref.current.dockMove(existingTab, existingTab.parent, 'active');
      setTimeout(() => {
        if (ref.current) {
          const tab = ref.current.find('t5');
          if (tab && tab.parent) {
            ref.current.dockMove(tab.parent, null, 'maximize');
          }
        }
      }, 100);
    } else {
      // Create new tab
      openPanel('t5');
      
      // Maximize after creation
      setTimeout(() => {
        if (ref.current) {
          const tab = ref.current.find('t5');
          if (tab && tab.parent) {
            ref.current.dockMove(tab.parent, null, 'maximize');
          }
        }
      }, 200);
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
    setShowSqlImportModal(false);
    // Optional: Show success message or refresh relevant panels
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
        FallbackComponent={ErrorFallback}
      >
        <ProjectProvider>
        <div 
          style={{ 
            height: '100vh', 
            width: '100vw', 
            display: 'flex', 
            flexDirection: 'column',
            backgroundColor: '#1a1a1a'
          }}
        >
          {/* TOP BAR */}
          <TopBar />

          {/* HAUPTBEREICH */}
          <div style={{ flex: 1, display: 'flex', overflow: 'hidden', backgroundColor: '#1a1a1a' }}>
            {/* NEUE NAVIGATION LINKS */}
            <NewNavigationPanel onOpenPanel={openPanel} onOpenModal={handleOpenModal} onOpenSqlImport={handleOpenSqlImport} onOpenDatabaseExport={handleOpenDatabaseExport} />

            {/* ARBEITSBEREICH MIT LINKEM PANEL UND MDI */}
            <div style={{ flex: 1, display: 'flex', overflow: 'hidden', backgroundColor: '#1a1a1a' }}>
              {/* LINKES PANEL (Tree View) - Größe änderbar */}
              <div
                style={{
                  width: `${leftPanelWidth}px`,
                  flexShrink: 0,
                  backgroundColor: '#2a2a2a',
                  borderRight: '1px solid #444'
                }}
              >
                <PanelT1 onOpenPanel={openPanel} />
              </div>

              {/* RESIZE HANDLE */}
              <div
                style={{
                  width: '4px',
                  backgroundColor: isResizing ? '#3d3df5' : 'transparent',
                  cursor: 'ew-resize',
                  flexShrink: 0,
                  borderLeft: '1px solid #444',
                  borderRight: '1px solid #444'
                }}
                onMouseDown={handleMouseDown}
              />

              {/* RC-DOCK MDI AREA */}
              <div style={{ flex: 1, position: 'relative', backgroundColor: '#1e1e1e' }}>
                <DockLayout
                  ref={ref}
                  layout={layout as any}
                  onLayoutChange={onLayoutChange}
                  loadTab={(data: any) => loadTab(data, handleOpenDesigner, openPanel)}
                  groups={groups}
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: '#1e1e1e'
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

      {/* AUTH MODAL SYSTEM */}
      <AuthModalManager
        activeModal={activeModal}
        onCloseModal={handleCloseModal}
        resetPasswordToken={resetToken}
        resetPasswordEmail={resetEmail}
        isLoginClosable={isAuthenticated} // Login modal only closable when authenticated
        onLoginSuccess={() => {
          // Update NavigationPanel auth status via localStorage event
          window.dispatchEvent(new Event('storage'));
          // Also dispatch custom auth event for ProjectContext
          window.dispatchEvent(new Event('auth-change'));
          // Clear modal interaction flag after successful login
          localStorage.removeItem('auth_modal_interaction');
          handleCloseModal();
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
    </>
  );
}