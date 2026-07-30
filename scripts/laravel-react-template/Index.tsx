import React, { useRef, useCallback, useState, useEffect, Suspense } from 'react';
import DockLayout, { LayoutData, TabData, PanelData, BoxData } from 'rc-dock';
import 'rc-dock/dist/rc-dock.css';
import TopBar from '@/Components/TopBar';
import MenuPanel from '@/Components/Panels/MenuPanel';
import { useTheme } from '@/contexts/ThemeContext';
import { ErrorBoundary } from 'react-error-boundary';

import { useTranslation, SupportedLanguage, getStoredLanguage } from '@/i18n';

// Lazy load panels
{:for nmaxtables:}
const {:table.filepascalcase:}ManagementPanel = React.lazy(() => import('@/Components/Panels/{:table.filepascalcase:}ManagementPanel'));
{:endfor:}

// Panel loader fallback
function PanelLoader() {
  return (
    <div className="flex items-center justify-center h-full">
      <i className="pi pi-spin pi-spinner text-2xl" style={{ color: '#9ca3af' }}></i>
    </div>
  );
}

// Error fallback
function ErrorFallback({ error, resetErrorBoundary }: { error: unknown; resetErrorBoundary: () => void }) {
  const message = error instanceof Error ? error.message : String(error);
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 p-4">
      <i className="pi pi-exclamation-triangle text-3xl" style={{ color: '#dc2626' }}></i>
      <p className="text-sm" style={{ color: '#9ca3af' }}>Something went wrong: {message}</p>
      <button
        onClick={resetErrorBoundary}
        className="px-4 py-2 text-sm rounded"
        style={{ backgroundColor: '#3b82f6', color: '#fff' }}
      >
        Try Again
      </button>
    </div>
  );
}

// Welcome Panel component — reacts to theme changes via useTheme hook
function WelcomePanel() {
  const { colors } = useTheme();
  const [lang] = useState<SupportedLanguage>(getStoredLanguage());
  const { t } = useTranslation(lang);
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4" style={{ backgroundColor: colors.bgPrimary }}>
      <i className="pi pi-box text-5xl" style={{ color: colors.accent }}></i>
      <h2 className="text-xl font-semibold" style={{ color: colors.textPrimary }}>
        {t.welcomeTitle || 'Laravel React Template'}
      </h2>
      <p className="text-sm" style={{ color: colors.textMuted }}>
        {t.welcomeSubtitle || 'Select an item from the navigation panel to get started.'}
      </p>
    </div>
  );
}

// Tab data storage
const tabDataMap: Record<string, { component: React.ReactNode; title: string }> = {};

function registerPanel(id: string, title: string, component: React.ReactNode) {
  tabDataMap[id] = { component, title };
}

const OPEN_TABS_KEY = 'template_open_tabs';
const ACTIVE_TAB_KEY = 'template_active_tab';

function saveOpenTabs(tabs: { id: string; title: string }[], activeTabId?: string) {
  try {
    localStorage.setItem(OPEN_TABS_KEY, JSON.stringify(tabs));
    if (activeTabId) localStorage.setItem(ACTIVE_TAB_KEY, activeTabId);
  } catch (_e) { /* localStorage unavailable */ }
}

function loadOpenTabs(): { id: string; title: string }[] {
  try {
    const raw = localStorage.getItem(OPEN_TABS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function loadActiveTab(): string {
  try { return localStorage.getItem(ACTIVE_TAB_KEY) || ''; } catch { return ''; }
}

export default function Index() {
  const dockRef = useRef<DockLayout>(null);
  const { colors } = useTheme();
  const [navVisible, setNavVisible] = useState(true);
  const [navCollapsed, setNavCollapsed] = useState(false);
  const [layoutKey, setLayoutKey] = useState(0);

  // Ref to store a pending panel when main-panel is gone
  const pendingPanelRef = useRef<{ id: string; title: string } | null>(null);

  // Register available panels
  registerPanel('welcome-tab', 'Welcome', <WelcomePanel />);
  {:for nmaxtables:}
  registerPanel('{:table.filesingular:}-management', '{:table.filepascalcase:} Management', (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <Suspense fallback={<PanelLoader />}>
        <{:table.filepascalcase:}ManagementPanel />
      </Suspense>
    </ErrorBoundary>
  ));
  {:endfor:}

  // Track open tabs in localStorage
  const updateSavedTabs = useCallback(() => {
    const dock = dockRef.current;
    if (!dock) return;
    const mainPanel = dock.find('main-panel') as PanelData | null;
    if (mainPanel && mainPanel.tabs) {
      const tabs = mainPanel.tabs.map(tab => ({ id: tab.id || '', title: (tab.title as string) || '' }));
      const activeId = mainPanel.activeId || (mainPanel.tabs.length > 0 ? mainPanel.tabs[mainPanel.tabs.length - 1].id : '');
      saveOpenTabs(tabs, activeId as string);
    }
  }, []);

  // Open a panel as a tab in the main area
  const openPanel = useCallback((panelId: string, title?: string) => {
    const dock = dockRef.current;
    if (!dock) return;

    const panelData = tabDataMap[panelId];
    if (!panelData) return;

    // Check if tab already exists
    const existingTab = dock.find(panelId);
    if (existingTab) {
      dock.updateTab(panelId, existingTab as TabData, true);
      return;
    }

    const newTab: TabData = {
      id: panelId,
      title: title || panelData.title,
      content: <div className="h-full overflow-auto">{panelData.component}</div>,
      closable: true,
    };

    // Find the main panel to add the tab
    const mainPanel = dock.find('main-panel');
    if (mainPanel) {
      dock.dockMove(newTab, mainPanel as PanelData, 'middle');
      // Save updated tabs after a tick (so rc-dock has time to update)
      setTimeout(updateSavedTabs, 50);
    } else {
      // Main panel was removed — rebuild layout with the requested panel
      pendingPanelRef.current = { id: panelId, title: title || panelData.title };
      setLayoutKey(prev => prev + 1);
    }
  }, [updateSavedTabs]);

  // Handle layout changes (tab close, reorder)
  const handleLayoutChange = useCallback((_newLayout: LayoutData) => {
    setTimeout(updateSavedTabs, 50);
  }, [updateSavedTabs]);

  // Listen for nav toggle events from TopBar
  useEffect(() => {
    const handleToggleNav = () => setNavVisible(prev => !prev);
    window.addEventListener('toggleNavPanel', handleToggleNav);
    return () => window.removeEventListener('toggleNavPanel', handleToggleNav);
  }, []);

  // Listen for nav collapsed events from NewNavigationPanel
  useEffect(() => {
    const handleNavCollapsed = (e: Event) => {
      const collapsed = (e as CustomEvent).detail.collapsed;
      setNavCollapsed(collapsed);
      setLayoutKey(prev => prev + 1);
    };
    window.addEventListener('navCollapsed', handleNavCollapsed);
    return () => window.removeEventListener('navCollapsed', handleNavCollapsed);
  }, []);

  // Force re-render when nav visibility changes
  useEffect(() => {
    setLayoutKey(prev => prev + 1);
  }, [navVisible]);

  // Determine the main tabs: use pending panel, or restore from localStorage, or welcome
  const pending = pendingPanelRef.current;
  pendingPanelRef.current = null;

  let mainTabs: TabData[];
  if (pending && tabDataMap[pending.id]) {
    const pd = tabDataMap[pending.id];
    mainTabs = [{
      id: pending.id,
      title: pending.title,
      content: <div className="h-full overflow-auto">{pd.component}</div>,
      closable: true,
    }];
  } else {
    const saved = loadOpenTabs();
    const restoredTabs = saved
      .filter(s => tabDataMap[s.id])
      .map(s => ({
        id: s.id,
        title: s.title || tabDataMap[s.id].title,
        content: <div className="h-full overflow-auto">{tabDataMap[s.id].component}</div>,
        closable: true,
      } as TabData));

    mainTabs = restoredTabs.length > 0 ? restoredTabs : [{
      id: 'welcome-tab',
      title: 'Welcome',
      content: <div className="h-full overflow-auto"><WelcomePanel /></div>,
      closable: true,
    }];
  }

  // Determine which tab should be active
  const savedActiveId = pending ? pending.id : loadActiveTab();
  const activeTabId = mainTabs.some(t => t.id === savedActiveId) ? savedActiveId : mainTabs[0]?.id;

  const defaultLayout: LayoutData = {
    dockbox: {
      mode: 'horizontal',
      children: [
        // Left: Navigation Panel
        ...(navVisible ? [{
          id: 'nav-box',
          size: navCollapsed ? 48 : 200,
          tabs: [{
            id: 'nav-panel',
            title: 'Navigation',
            content: (
              <NewNavigationPanel onOpenPanel={openPanel} initialCollapsed={navCollapsed} />
            ),
            closable: false,
          }],
          panelLock: { panelStyle: 'navigation-panel-no-tabs', widthFlex: 0 },
        } as PanelData] : []),
        // Right: Main Content Area
        {
          id: 'main-panel',
          size: 800,
          tabs: mainTabs,
          activeId: activeTabId,
        } as PanelData,
      ],
    } as BoxData,
  };

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden" style={{ backgroundColor: colors.bgPrimary }}>
      {/* TopBar */}
      <TopBar />

      {/* Main Content with RC Dock */}
      <div className="flex-1 relative">
        <DockLayout
          key={layoutKey}
          ref={dockRef}
          defaultLayout={defaultLayout}
          onLayoutChange={handleLayoutChange}
          style={{
            position: 'absolute',
            inset: 0,
          }}
        />
      </div>
    </div>
  );
}