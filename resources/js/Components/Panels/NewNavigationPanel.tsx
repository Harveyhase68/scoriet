// resources/js/Components/Panels/NewNavigationPanel.tsx
import React, { useState } from 'react';
import { TieredMenu } from 'primereact/tieredmenu';
import { MenuItem } from 'primereact/menuitem';
import { NavigationPanelProps } from '@/types';
import { AuthModalType } from '@/Components/AuthModals/AuthModalManager';
import { useProject } from '@/contexts/ProjectContext';

interface ExtendedNavigationPanelProps extends NavigationPanelProps {
  onOpenModal?: (modalType: AuthModalType) => void;
  onOpenSqlImport?: () => void;
  onOpenDatabaseExport?: () => void;
}

export default function NewNavigationPanel({ onOpenPanel, onOpenModal, onOpenSqlImport, onOpenDatabaseExport }: ExtendedNavigationPanelProps) {
  const { selectedProject } = useProject();
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [userName, setUserName] = useState<string>('');
  const [userType, setUserType] = useState<string>('');
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    // Load from localStorage, default to true (collapsed)
    const saved = localStorage.getItem('navigation_collapsed');
    return saved === null ? true : JSON.parse(saved);
  });

  // Helper function to update auth status
  const updateAuthStatus = async () => {
    const localToken = localStorage.getItem('access_token');
    const sessionToken = sessionStorage.getItem('access_token');
    const token = localToken || sessionToken;
    
    if (token) {
      try {
        const response = await fetch('/api/user', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          },
        });

        if (response.ok) {
          const user = await response.json();
          setIsLoggedIn(true);
          setUserName(user.name || user.email);
          setUserType(user.user_type || '');
          return true;
        } else {
          // Token invalid - clean up and notify other components
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('remember_me');
          localStorage.removeItem('user');
          sessionStorage.removeItem('access_token');
          sessionStorage.removeItem('refresh_token');
          document.cookie = 'remember_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
          setIsLoggedIn(false);
          setUserName('');
          setUserType('');

          // Trigger storage event to notify other components (like Index.tsx)
          window.dispatchEvent(new Event('storage'));
          return false;
        }
      } catch {
        setIsLoggedIn(false);
        setUserName('');
        return false;
      }
    } else {
      setIsLoggedIn(false);
      setUserName('');
      setUserType('');
      return false;
    }
  };

  // Save navigation state to localStorage whenever it changes
  React.useEffect(() => {
    localStorage.setItem('navigation_collapsed', JSON.stringify(isCollapsed));
  }, [isCollapsed]);

  // Check login status on component mount and when storage changes
  React.useEffect(() => {
    updateAuthStatus();

    const handleStorageChange = () => {
      updateAuthStatus();
    };

    const handleAuthChange = () => {
      updateAuthStatus();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('auth-change', handleAuthChange);

    // Periodic token validation (every 5 minutes)
    const tokenCheckInterval = setInterval(() => {
      updateAuthStatus();
    }, 5 * 60 * 1000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('auth-change', handleAuthChange);
      clearInterval(tokenCheckInterval);
    };
  }, []);

  // Main navigation menu items for TieredMenu
  const navigationItems: MenuItem[] = [
    {
      label: 'Back to Lobby',
      icon: 'pi pi-arrow-left',
      command: () => window.location.href = '/'
    },
    {
      separator: true
    },
    {
      label: 'Welcome',
      icon: 'pi pi-home',
      command: () => onOpenPanel('home')
    },
    {
      separator: true
    },
    {
      label: 'Project',
      icon: 'pi pi-briefcase',
      // No command here - parent items should not execute
      items: [
        {
          label: 'Project Management',
          icon: 'pi pi-home',
          command: () => onOpenPanel('project')
        },
        {
          label: 'Database Management',
          icon: 'pi pi-database',
          command: () => onOpenPanel('database-management')
        },
        {
          label: 'Teams',
          icon: 'pi pi-users',
          items: [
            {
              label: 'Team Management',
              icon: 'pi pi-cog',
              command: () => onOpenPanel('team-management')
            },
            {
              label: 'Teams Assignment',
              icon: 'pi pi-users',
              command: () => {
                if (selectedProject) {
                  onOpenPanel('teams-filtered', { title: `Teams Management - ${selectedProject.name}`, filterByProject: true, source: 'menu' });
                } else {
                  // If no project selected, open project management first
                  onOpenPanel('project');
                }
              }
            },
          ]
        },
        {
          label: 'Templates',
          icon: 'pi pi-cog',
          items: [
            {
              label: 'Template Verwaltung',
              icon: 'pi pi-list',
              command: () => onOpenPanel('template-management')
            },
            {
              label: 'Template Assignment',
              icon: 'pi pi-link',
              command: () => onOpenPanel('t3')
            },
            {
              separator: true
            },
            {
              label: 'DB Schema Dependencies',
              icon: 'pi pi-link',
              command: () => onOpenPanel('template-db-schema-dependencies')
            }
          ]
        },
        {
          separator: true
        },
        {
          label: 'My Applications',
          icon: 'pi pi-send',
          command: () => onOpenPanel('my-applications')
        },
        {
          label: 'Public Projects',
          icon: 'pi pi-globe',
          command: () => onOpenPanel('public-projects')
        }
      ]
    },
    {
      label: 'Database',
      icon: 'pi pi-database',
      // No command here - parent items should not execute
      items: [
        {
          label: 'Manage Databases',
          icon: 'pi pi-cog',
          command: () => onOpenPanel('database-management')
        },
        {
          label: 'Designer',
          icon: 'pi pi-window-maximize',
          command: () => onOpenPanel('t2')
        },
        {
          label: 'Schema Translation',
          icon: 'pi pi-language',
          command: () => onOpenPanel('schema-translation')
        },
        {
          separator: true
        },
        {
          label: 'Import SQL',
          icon: 'pi pi-upload',
          command: () => onOpenSqlImport && onOpenSqlImport()
        },
        {
          label: 'Export SQL',
          icon: 'pi pi-download',
          command: () => onOpenDatabaseExport && onOpenDatabaseExport()
        }
      ]
    },
    {
      label: 'Generator',
      icon: 'pi pi-cog',
      // No command here - parent items should not execute
      items: [
        {
          label: 'Debug Manual Generator',
          icon: 'pi pi-wrench',
          command: () => onOpenPanel('debug-manual-generator')
        },
        {
          label: 'Code Generation Panel',
          icon: 'pi pi-play',
          command: () => onOpenPanel('code-generation')
        },
        {
          label: 'Query Builder',
          icon: 'pi pi-search',
          command: () => {/* Query builder - not implemented */}
        },
        {
          separator: true
        },
        {
          label: 'Settings',
          icon: 'pi pi-cog',
          items: [
            {
              label: 'Projekt-Einstellungen',
              icon: 'pi pi-sliders-h',
              command: () => {
                if (selectedProject) {
                  onOpenPanel(`project-settings-${selectedProject.id}`, {
                    type: 'project-settings',
                    title: `Project Settings (${selectedProject.name})`,
                    projectId: selectedProject.id,
                    projectName: selectedProject.name
                  });
                } else {
                  // If no project selected, open project management first
                  onOpenPanel('project');
                }
              }
            },
            ...(userType === 'system' ? [
              {
                label: 'System Settings',
                icon: 'pi pi-cog',
                command: () => onOpenPanel('system-settings')
              },
              {
                label: 'Language Management',
                icon: 'pi pi-globe',
                command: () => onOpenPanel('language-management')
              }
            ] : [])
          ]
        }
      ]
    }
  ];

  // Profile menu items
  const profileItems: MenuItem[] = isLoggedIn ? [
    {
      label: userName,
      icon: 'pi pi-user',
      // No command here - parent items should not execute
      items: [
        {
          label: 'Profile',
          icon: 'pi pi-user-edit',
          command: () => onOpenModal?.('profile')
        },
        {
          label: 'Change Plan',
          icon: 'pi pi-credit-card',
          command: () => onOpenModal?.('plan')
        },
        {
          label: 'Back to Lobby',
          icon: 'pi pi-external-link',
          command: () => window.location.href = '/'
        },
        {
          separator: true
        },
        {
          label: 'Logout',
          icon: 'pi pi-sign-out',
          command: () => {
            // Set logout flag to prevent login modal popup
            localStorage.setItem('logout_in_progress', 'true');
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            localStorage.removeItem('remember_me');
            localStorage.removeItem('user');
            sessionStorage.removeItem('access_token');
            sessionStorage.removeItem('refresh_token');
            sessionStorage.removeItem('user');
            document.cookie = 'remember_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
            setIsLoggedIn(false);
            setUserName('');
            // Redirect to lobby immediately
            window.location.href = '/';
          }
        }
      ]
    }
  ] : [
    {
      label: 'Account',
      icon: 'pi pi-user',
      // No command here - parent items should not execute
      items: [
        {
          label: 'Login',
          icon: 'pi pi-sign-in',
          command: () => onOpenModal?.('login')
        },
        {
          label: 'Register',
          icon: 'pi pi-user-plus',
          command: () => onOpenModal?.('register')
        }
      ]
    }
  ];

  return (
    <div className={`${isCollapsed ? 'w-16' : 'w-64'} bg-gray-800 border-r border-gray-700 flex flex-col h-full transition-all duration-300`}>
      {/* Toggle Button */}
      <div className="p-3 border-b border-gray-700 flex items-center justify-center">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 hover:bg-gray-700 rounded transition-colors w-full flex justify-center"
          title={isCollapsed ? 'Expand Menu' : 'Collapse Menu'}
        >
          <i className={`pi ${isCollapsed ? 'pi-angle-right' : 'pi-angle-left'} text-gray-400`}></i>
        </button>
      </div>

      {/* Navigation Menu */}
      <div className="flex-1 p-4">
        {!isCollapsed ? (
          <div className="mb-4">
            <div className="text-xs text-gray-400 uppercase tracking-wide mb-2">Navigation</div>
            <TieredMenu
              model={navigationItems}
              style={{ 
                backgroundColor: 'transparent',
                border: 'none',
                padding: 0
              }}
              className="w-full tiered-menu-sidebar"
              popup={false}
            />
          </div>
        ) : (
          <div className="flex flex-col space-y-2">
            {/* Back to Lobby and Home buttons */}
            <div className="relative group">
              <button 
                onClick={() => window.location.href = '/'}
                className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-700 transition-colors"
                title="Back to Lobby"
              >
                <i className="pi pi-arrow-left text-gray-300"></i>
              </button>
            </div>
            <div className="relative group">
              <button 
                onClick={() => onOpenPanel('home')}
                className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-700 transition-colors"
                title="Welcome"
              >
                <i className="pi pi-home text-gray-300"></i>
              </button>
            </div>
            {/* Icon-only navigation with TieredMenu - only 3 main categories */}
            <div className="relative group">
              <button className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-700 transition-colors">
                <i className="pi pi-briefcase text-gray-300" title="Project"></i>
              </button>
              {/* Popup submenu for Project */}
              <div className="absolute left-full top-0 ml-2 w-64 bg-gray-800 border border-gray-600 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="p-2">
                  <button onClick={() => onOpenPanel('project')} className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded">
                    <i className="pi pi-home"></i>
                    <span>Project Management</span>
                  </button>
                  <button onClick={() => onOpenPanel('database-management')} className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded">
                    <i className="pi pi-database"></i>
                    <span>Database Management</span>
                  </button>
                  <div className="relative group/teams">
                    <button className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded">
                      <i className="pi pi-users"></i>
                      <span>Teams</span>
                      <i className="pi pi-angle-right ml-auto text-xs"></i>
                    </button>
                    {/* Sub-submenu for Teams */}
                    <div className="absolute left-full top-0 ml-1 w-64 bg-gray-800 border border-gray-600 rounded-lg shadow-xl opacity-0 invisible group-hover/teams:opacity-100 group-hover/teams:visible transition-all duration-200 z-50">
                      <div className="p-2">
                        <button onClick={() => onOpenPanel('team-management')} className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded">
                          <i className="pi pi-cog"></i>
                          <span>Team Management</span>
                        </button>
                        <button onClick={() => {
                          if (selectedProject) {
                            onOpenPanel('teams-filtered', { title: `Teams Management - ${selectedProject.name}`, filterByProject: true, source: 'menu' });
                          } else {
                            // If no project selected, open project management first
                            onOpenPanel('project');
                          }
                        }} className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded">
                          <i className="pi pi-users"></i>
                          <span>Teams Assignment</span>
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="relative group/sub">
                    <button className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded">
                      <i className="pi pi-cog"></i>
                      <span>Templates</span>
                      <i className="pi pi-angle-right ml-auto text-xs"></i>
                    </button>
                    {/* Sub-submenu for Templates */}
                    <div className="absolute left-full top-0 ml-1 w-64 bg-gray-800 border border-gray-600 rounded-lg shadow-xl opacity-0 invisible group-hover/sub:opacity-100 group-hover/sub:visible transition-all duration-200 z-50">
                      <div className="p-2">
                        <button onClick={() => onOpenPanel('template-management')} className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded">
                          <i className="pi pi-list"></i>
                          <span>Template Verwaltung</span>
                        </button>
                        <button onClick={() => onOpenPanel('t3')} className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded">
                          <i className="pi pi-link"></i>
                          <span>Template Assignment</span>
                        </button>
                        <div className="border-t border-gray-600 my-1"></div>
                        <button onClick={() => onOpenPanel('template-db-schema-dependencies')} className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded">
                          <i className="pi pi-link"></i>
                          <span>DB Schema Dependencies</span>
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="border-t border-gray-600 my-2"></div>
                  <button onClick={() => onOpenPanel('my-applications')} className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded">
                    <i className="pi pi-send"></i>
                    <span>My Applications</span>
                  </button>
                  <button onClick={() => onOpenPanel('public-projects')} className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded">
                    <i className="pi pi-globe"></i>
                    <span>Public Projects</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="relative group">
              <button className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-700 transition-colors">
                <i className="pi pi-database text-gray-300" title="Database"></i>
              </button>
              {/* Popup submenu for Database */}
              <div className="absolute left-full top-0 ml-2 w-64 bg-gray-800 border border-gray-600 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="p-2">
                  <button onClick={() => onOpenPanel('database-management')} className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded">
                    <i className="pi pi-cog"></i>
                    <span>Manage Databases</span>
                  </button>
                  <button onClick={() => onOpenPanel('t2')} className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded">
                    <i className="pi pi-window-maximize"></i>
                    <span>Designer</span>
                  </button>
                  <button onClick={() => onOpenPanel('schema-translation')} className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded">
                    <i className="pi pi-language"></i>
                    <span>Schema Translation</span>
                  </button>
                  <div className="border-t border-gray-600 my-2"></div>
                  <button onClick={() => onOpenSqlImport && onOpenSqlImport()} className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded">
                    <i className="pi pi-upload"></i>
                    <span>Import SQL</span>
                  </button>
                  <button onClick={() => onOpenDatabaseExport && onOpenDatabaseExport()} className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded">
                    <i className="pi pi-download"></i>
                    <span>Export SQL</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="relative group">
              <button className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-700 transition-colors">
                <i className="pi pi-cog text-gray-300" title="Generator"></i>
              </button>
              {/* Popup submenu for Generator */}
              <div className="absolute left-full top-0 ml-2 w-64 bg-gray-800 border border-gray-600 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="p-2">
                  <button onClick={() => onOpenPanel('debug-manual-generator')} className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded">
                    <i className="pi pi-wrench"></i>
                    <span>Debug Manual Generator</span>
                  </button>
                  <button onClick={() => onOpenPanel('code-generation')} className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded">
                    <i className="pi pi-play"></i>
                    <span>Code Generation Panel</span>
                  </button>
                  <button className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded">
                    <i className="pi pi-search"></i>
                    <span>Query Builder</span>
                  </button>
                  <div className="border-t border-gray-600 my-2"></div>
                  <div className="relative group">
                    <button className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded">
                      <i className="pi pi-cog"></i>
                      <span>Settings</span>
                      <i className="pi pi-angle-right ml-auto"></i>
                    </button>
                    {/* Nested submenu for Settings */}
                    <div className="absolute left-full top-0 ml-2 w-56 bg-gray-800 border border-gray-600 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                      <div className="p-2">
                        <button onClick={() => {
                          if (selectedProject) {
                            onOpenPanel(`project-settings-${selectedProject.id}`, {
                              type: 'project-settings',
                              title: `Project Settings (${selectedProject.name})`,
                              projectId: selectedProject.id,
                              projectName: selectedProject.name
                            });
                          } else {
                            // If no project selected, open project management first
                            onOpenPanel('project');
                          }
                        }} className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded">
                          <i className="pi pi-sliders-h"></i>
                          <span>Projekt-Einstellungen</span>
                        </button>
                        {userType === 'system' && (
                          <>
                            <button onClick={() => onOpenPanel('system-settings')} className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded">
                              <i className="pi pi-cog"></i>
                              <span>System Settings</span>
                            </button>
                            <button onClick={() => onOpenPanel('language-management')} className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded">
                              <i className="pi pi-globe"></i>
                              <span>Language Management</span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Profile Section at Bottom */}
      <div className="p-4 border-t border-gray-700">
        {!isCollapsed ? (
          <>
            <div className="text-xs text-gray-400 uppercase tracking-wide mb-2">Account</div>
            <TieredMenu
              model={profileItems}
              style={{ 
                backgroundColor: 'transparent',
                border: 'none',
                padding: 0
              }}
              className="w-full tiered-menu-sidebar"
            />
          </>
        ) : (
          <div className="flex justify-center">
            {/* Profile icon with popup menu */}
            <div className="relative group">
              <button className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-700 transition-colors">
                <i className={`pi ${isLoggedIn ? 'pi-user' : 'pi-sign-in'} text-gray-300`} title={isLoggedIn ? userName : 'Account'}></i>
              </button>
              {/* Popup submenu for Profile */}
              <div className="absolute left-full bottom-0 ml-2 w-48 bg-gray-800 border border-gray-600 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="p-2">
                  {isLoggedIn ? (
                    <>
                      <button onClick={() => onOpenModal?.('profile')} className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded">
                        <i className="pi pi-user-edit"></i>
                        <span>Profile</span>
                      </button>
                      <button onClick={() => onOpenModal?.('plan')} className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded">
                        <i className="pi pi-credit-card"></i>
                        <span>Change Plan</span>
                      </button>
                      <button onClick={() => window.location.href = '/'} className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded">
                        <i className="pi pi-external-link"></i>
                        <span>Back to Lobby</span>
                      </button>
                      <div className="border-t border-gray-600 my-2"></div>
                      <button onClick={() => {
                        // Set logout flag to prevent login modal popup
                        localStorage.setItem('logout_in_progress', 'true');
                        localStorage.removeItem('access_token');
                        localStorage.removeItem('refresh_token');
                        localStorage.removeItem('remember_me');
                        localStorage.removeItem('user');
                        sessionStorage.removeItem('access_token');
                        sessionStorage.removeItem('refresh_token');
                        sessionStorage.removeItem('user');
                        document.cookie = 'remember_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
                        setIsLoggedIn(false);
                        setUserName('');
                        // Redirect to lobby immediately
                        window.location.href = '/';
                      }} className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded">
                        <i className="pi pi-sign-out"></i>
                        <span>Logout</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => onOpenModal?.('login')} className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded">
                        <i className="pi pi-sign-in"></i>
                        <span>Login</span>
                      </button>
                      <button onClick={() => onOpenModal?.('register')} className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded">
                        <i className="pi pi-user-plus"></i>
                        <span>Register</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}