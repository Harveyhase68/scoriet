//resources/js/pages/Index.tsx
import React, { useRef, useState, useCallback } from 'react';
import { Head } from '@inertiajs/react';
import { DockLayout } from 'rc-dock';
import "rc-dock/dist/rc-dock.css";
import { ExpandOutlined, CompressOutlined, CloseOutlined, CaretDownOutlined } from '@ant-design/icons';
import { useHotkeys } from 'react-hotkeys-hook';
import { TabContentProps } from '@/types';

// Import of Panel components
import PanelT2 from '@/Components/Panels/PanelT2';
import PanelT3 from '@/Components/Panels/PanelT3';
import PanelT5 from '@/Components/Panels/PanelT5';
import NewNavigationPanel from '@/Components/Panels/NewNavigationPanel';
import TopBar from '@/Components/TopBar';
import '@/Components/Panels/styles.css';
import PanelT1 from '@/Components/Panels/PanelT1';
import LoginPanel from '@/Components/Panels/LoginPanel';
import TeamsPanel from '@/Components/Panels/TeamsPanel';
import ProjectPanel from '@/Components/Panels/ProjectPanel';
import MyApplicationsPanel from '@/Components/Panels/MyApplicationsPanel';
import PublicProjectsPanel from '@/Components/Panels/PublicProjectsPanel';
import TemplateManagementPanel from '@/Components/Panels/TemplateManagementPanel';
import TeamManagementPanel from '@/Components/Panels/TeamManagementPanel';

// Auth Modal System
import AuthModalManager, { AuthModalType } from '@/Components/AuthModals/AuthModalManager';

// Project Context
import { ProjectProvider } from '@/contexts/ProjectContext';

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
  maximize: <ExpandOutlined style={{ fontSize: '12px' }} />,
  restore: <CompressOutlined style={{ fontSize: '12px' }} />,
  close: <CloseOutlined style={{ fontSize: '12px' }} />,
  more: <CaretDownOutlined style={{ fontSize: '9px' }} />,
};

// Group definition - only for movable panels
const groups = {
  'card custom': {
    floatable: true,
    closable: true,
    panelExtra: (panelData: any, context: any) => {
      return (
        <>
          <span
            className='my-panel-extra-btn'
            onClick={() => context.dockMove(panelData, null, 'maximize')}
            style={{ cursor: 'pointer', padding: '4px' }}
          >
            {panelData.parent.mode === 'maximize' ? icons.restore : icons.maximize}
          </span>
        </>
      );
    }
  }
};

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

// ✅ CORRECTED loadTab function - That was the problem!
const loadTab = (data: any) => {
  const { id } = data;

  switch (id) {
    case 't2':
      return {
        id,
        title: data.title || 'Main Tab', // ← Use data.title if available
        content: <PanelT2 />,
        closable: true,
        group: 'card custom'
      };

    case 't3':
      return {
        id,
        title: data.title || 'Templates',
        content: <PanelT3 />,
        closable: true,
        group: 'card custom'
      };

    case 't5':
      return {
        id,
        title: data.title || 'Database Explorer',
        content: <PanelT5 />,
        closable: true,
        group: 'card custom'
      };

    case 'teams':
      return {
        id,
        title: data.title || 'Teams',
        content: <TeamsPanel isActive={true} />,
        closable: true,
        group: 'card custom'
      };

    case 'project':
      return {
        id,
        title: data.title || 'Project',
        content: <ProjectPanel isActive={true} />,
        closable: true,
        group: 'card custom'
      };

    case 'my-applications':
      return {
        id,
        title: data.title || 'My Applications',
        content: <MyApplicationsPanel isActive={true} />,
        closable: true,
        group: 'card custom'
      };

    case 'public-projects':
      return {
        id,
        title: data.title || 'Public Projects',
        content: <PublicProjectsPanel isActive={true} />,
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
        content: <LoginPanel />,
        closable: true,
        group: 'card custom'
      };

    case 'template-management':
      return {
        id,
        title: data.title || 'Template Verwaltung',
        content: <TemplateManagementPanel />,
        closable: true,
        group: 'card custom'
      };

    case 'team-management':
      return {
        id,
        title: data.title || 'Team Verwaltung',
        content: <TeamManagementPanel />,
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
}

export default function Index(props: IndexProps = {}) {
  const { resetToken, resetEmail } = props;
  const ref = useRef<any>(null);
  const [layout, setLayout] = useState(initialLayout);
  const [leftPanelWidth, setLeftPanelWidth] = useState(300);
  const [isResizing, setIsResizing] = useState(false);
  
  // Auth Modal State - Add debug output
  const [activeModal, setActiveModal] = useState<AuthModalType>(null);
  
  // Auth State Management
  const [isAuthenticated, setIsAuthenticated] = useState(false);

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
    const checkAuthStatus = () => {
      // Check both localStorage (Remember Me) and sessionStorage (Session only)
      const localToken = localStorage.getItem('access_token');
      const sessionToken = sessionStorage.getItem('access_token');
      setIsAuthenticated(!!(localToken || sessionToken));
    };

    // Initial check
    checkAuthStatus();

    // Listen for storage changes (login/logout events)
    const handleStorageChange = () => {
      checkAuthStatus();
      
      // If logged out, close all panels
      const localToken = localStorage.getItem('access_token');
      const sessionToken = sessionStorage.getItem('access_token');
      if (!localToken && !sessionToken) {
        closeAllPanels();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
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
      localStorage.setItem = originalSetItem;
      localStorage.removeItem = originalRemoveItem;
    };
  }, []);

  // Function to close all panels
  const closeAllPanels = () => {
    if (ref.current) {
      setLayout({
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
      });
    }
  };

  const openPanel = (panelId: string) => {
    // Check authentication first
    if (!isAuthenticated) {
      // Authentication required to open panels
      setActiveModal('login'); // Show login modal
      return;
    }

    if (!ref.current) {
      setTimeout(() => openPanel(panelId), 100);
      return;
    }

    setTimeout(() => {
      if (!ref.current) return;

      const existingTab = ref.current.find(panelId);

      if (existingTab) {
        ref.current.dockMove(existingTab, existingTab.parent, 'active');
      } else {
        const newTab = loadTab({ id: panelId });
        if (newTab) {
          const updatedLayout = {
            ...layout,
            dockbox: {
              ...layout.dockbox,
              children: [
                ...layout.dockbox.children,
                {
                  id: `+${Date.now()}`,
                  size: 300,
                  tabs: [{ id: panelId, title: newTab.title }],
                  group: 'card custom',
                  activeId: panelId
                }
              ]
            }
          };
          setLayout(updatedLayout);
        }
      }
    }, 50);
  };

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

  const onLayoutChange = useCallback((newLayout: any, currentTabId?: string, direction?: string) => {
    if (currentTabId === 'protect1' && direction === 'remove') {
      alert('Removal of this tab is rejected!');
    } else {
      setLayout(newLayout);
    }
  }, []);

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

  const handleCloseModal = () => {
    const currentModal = activeModal;
    setActiveModal(null);
    
    // When the reset modal is closed and we come from a reset URL,
    // redirect to main page
    if (currentModal === 'reset' && resetToken) {
      setTimeout(() => {
        window.location.href = '/';
      }, 100);
    }
  };

  return (
    <>
      <Head title={resetToken ? "Reset Password - Scoriet" : "Scoriet - Enterprise Code Generator"} />
      
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
            <NewNavigationPanel onOpenPanel={openPanel} onOpenModal={handleOpenModal} />

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
                <PanelT1 />
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
                  loadTab={loadTab}
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
      </ProjectProvider>

      {/* AUTH MODAL SYSTEM */}
      <AuthModalManager
        activeModal={activeModal}
        onCloseModal={() => {
          handleCloseModal();
        }}
        resetPasswordToken={resetToken}
        resetPasswordEmail={resetEmail}
        onLoginSuccess={() => {
          // Update NavigationPanel auth status via localStorage event
          window.dispatchEvent(new Event('storage'));
          // Also dispatch custom auth event for ProjectContext
          window.dispatchEvent(new Event('auth-change'));
          handleCloseModal();
        }}
        onRegistrationSuccess={() => {
          handleCloseModal();
        }}
      />
    </>
  );
}