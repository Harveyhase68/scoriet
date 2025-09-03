// resources/js/Components/Panels/NewNavigationPanel.tsx
import React, { useState } from 'react';
import { TieredMenu } from 'primereact/tieredmenu';
import { MenuItem } from 'primereact/menuitem';
import { NavigationPanelProps } from '@/types';
import { AuthModalType } from '@/Components/AuthModals/AuthModalManager';

interface ExtendedNavigationPanelProps extends NavigationPanelProps {
  onOpenModal?: (modalType: AuthModalType) => void;
}

export default function NewNavigationPanel({ onOpenPanel, onOpenModal }: ExtendedNavigationPanelProps) {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [userName, setUserName] = useState<string>('');
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
          return true;
        } else {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('remember_me');
          sessionStorage.removeItem('access_token');
          sessionStorage.removeItem('refresh_token');
          document.cookie = 'remember_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
          setIsLoggedIn(false);
          setUserName('');
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

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Main navigation menu items for TieredMenu
  const navigationItems: MenuItem[] = [
    {
      label: 'Project',
      icon: 'pi pi-briefcase',
      // No command here - parent items should not execute
      items: [
        {
          label: 'Overview',
          icon: 'pi pi-home',
          command: () => onOpenPanel('project')
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
              label: 'Team Assignment',
              icon: 'pi pi-link',
              command: () => onOpenPanel('teams')
            }
          ]
        },
        {
          label: 'Templates',
          icon: 'pi pi-cog',
          items: [
            {
              label: 'Template Editor',
              icon: 'pi pi-code',
              command: () => onOpenPanel('t3')
            },
            {
              label: 'Template Verwaltung',
              icon: 'pi pi-list',
              command: () => onOpenPanel('template-management')
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
          label: 'Designer',
          icon: 'pi pi-window-maximize',
          command: () => onOpenPanel('t2')
        },
        {
          separator: true
        },
        {
          label: 'Import',
          icon: 'pi pi-upload',
          // No command here - parent items should not execute
          items: [
            {
              label: 'Import .sql File',
              icon: 'pi pi-file',
              command: () => console.log('Import SQL file')
            },
            {
              label: 'Import Schema',
              icon: 'pi pi-sitemap',
              command: () => console.log('Import schema')
            }
          ]
        },
        {
          label: 'Export',
          icon: 'pi pi-download',
          // No command here - parent items should not execute
          items: [
            {
              label: 'Export Schema',
              icon: 'pi pi-file-export',
              command: () => console.log('Export schema')
            },
            {
              label: 'Export Data',
              icon: 'pi pi-table',
              command: () => console.log('Export data')
            }
          ]
        }
      ]
    },
    {
      label: 'Tools',
      icon: 'pi pi-wrench',
      // No command here - parent items should not execute
      items: [
        {
          label: 'Code Generator',
          icon: 'pi pi-code',
          command: () => onOpenPanel('t3')
        },
        {
          label: 'Query Builder',
          icon: 'pi pi-search',
          command: () => console.log('Query builder')
        },
        {
          separator: true
        },
        {
          label: 'Settings',
          icon: 'pi pi-cog',
          command: () => console.log('Settings')
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
          separator: true
        },
        {
          label: 'Logout',
          icon: 'pi pi-sign-out',
          command: () => {
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
            window.dispatchEvent(new Event('storage'));
            window.dispatchEvent(new Event('auth-change'));
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
            {/* Icon-only navigation with TieredMenu - only 3 main categories */}
            <div className="relative group">
              <button className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-700 transition-colors">
                <i className="pi pi-briefcase text-gray-300" title="Project"></i>
              </button>
              {/* Popup submenu for Project */}
              <div className="absolute left-full top-0 ml-2 w-48 bg-gray-800 border border-gray-600 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="p-2">
                  <button onClick={() => onOpenPanel('project')} className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded">
                    <i className="pi pi-home"></i>
                    <span>Overview</span>
                  </button>
                  <div className="relative group/teams">
                    <button className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded">
                      <i className="pi pi-users"></i>
                      <span>Teams</span>
                      <i className="pi pi-angle-right ml-auto text-xs"></i>
                    </button>
                    {/* Sub-submenu for Teams */}
                    <div className="absolute left-full top-0 ml-1 w-48 bg-gray-800 border border-gray-600 rounded-lg shadow-xl opacity-0 invisible group-hover/teams:opacity-100 group-hover/teams:visible transition-all duration-200 z-50">
                      <div className="p-2">
                        <button onClick={() => onOpenPanel('team-management')} className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded">
                          <i className="pi pi-cog"></i>
                          <span>Team Management</span>
                        </button>
                        <button onClick={() => onOpenPanel('teams')} className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded">
                          <i className="pi pi-link"></i>
                          <span>Team Assignment</span>
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
                    <div className="absolute left-full top-0 ml-1 w-48 bg-gray-800 border border-gray-600 rounded-lg shadow-xl opacity-0 invisible group-hover/sub:opacity-100 group-hover/sub:visible transition-all duration-200 z-50">
                      <div className="p-2">
                        <button onClick={() => onOpenPanel('t3')} className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded">
                          <i className="pi pi-code"></i>
                          <span>Template Editor</span>
                        </button>
                        <button onClick={() => onOpenPanel('template-management')} className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded">
                          <i className="pi pi-list"></i>
                          <span>Template Verwaltung</span>
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
              <div className="absolute left-full top-0 ml-2 w-48 bg-gray-800 border border-gray-600 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="p-2">
                  <button onClick={() => onOpenPanel('t2')} className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded">
                    <i className="pi pi-window-maximize"></i>
                    <span>Designer</span>
                  </button>
                  <div className="border-t border-gray-600 my-2"></div>
                  <button className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded">
                    <i className="pi pi-file"></i>
                    <span>Import .sql File</span>
                  </button>
                  <button className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded">
                    <i className="pi pi-sitemap"></i>
                    <span>Import Schema</span>
                  </button>
                  <div className="border-t border-gray-600 my-2"></div>
                  <button className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded">
                    <i className="pi pi-file-export"></i>
                    <span>Export Schema</span>
                  </button>
                  <button className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded">
                    <i className="pi pi-table"></i>
                    <span>Export Data</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="relative group">
              <button className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-700 transition-colors">
                <i className="pi pi-wrench text-gray-300" title="Tools"></i>
              </button>
              {/* Popup submenu for Tools */}
              <div className="absolute left-full top-0 ml-2 w-48 bg-gray-800 border border-gray-600 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="p-2">
                  <button onClick={() => onOpenPanel('t3')} className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded">
                    <i className="pi pi-code"></i>
                    <span>Code Generator</span>
                  </button>
                  <button className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded">
                    <i className="pi pi-search"></i>
                    <span>Query Builder</span>
                  </button>
                  <div className="border-t border-gray-600 my-2"></div>
                  <button className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded">
                    <i className="pi pi-cog"></i>
                    <span>Settings</span>
                  </button>
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
              <div className="absolute left-full bottom-0 ml-2 w-36 bg-gray-800 border border-gray-600 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="p-2">
                  {isLoggedIn ? (
                    <>
                      <button onClick={() => onOpenModal?.('profile')} className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded">
                        <i className="pi pi-user-edit"></i>
                        <span>Profile</span>
                      </button>
                      <div className="border-t border-gray-600 my-2"></div>
                      <button onClick={() => {
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
                        window.dispatchEvent(new Event('storage'));
                        window.dispatchEvent(new Event('auth-change'));
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