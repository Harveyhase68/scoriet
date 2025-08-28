// resources/js/Components/Panels/NavigationPanel.tsx
import React, { useState } from 'react';
import { TabMenu } from 'primereact/tabmenu';
import { MenuItem } from 'primereact/menuitem';
import { Dropdown } from 'primereact/dropdown';
import { NavigationPanelProps } from '@/types';
import { AuthModalType } from '@/Components/AuthModals/AuthModalManager';
import { useProject } from '@/contexts/ProjectContext';

interface ExtendedNavigationPanelProps extends NavigationPanelProps {
  onOpenModal?: (modalType: AuthModalType) => void;
}

interface BreadcrumbItem {
  label: string;
  icon?: string;
  action?: string;
  children?: BreadcrumbItem[];
}

export default function NavigationPanel({ onOpenPanel, onOpenModal }: ExtendedNavigationPanelProps) {
  const { projects, selectedProject, setSelectedProject, loading } = useProject();
  const [profileActiveIndex, setProfileActiveIndex] = useState<number>(-1); // -1 = nothing selected
  const [mainActiveIndex, setMainActiveIndex] = useState<number>(-1); // -1 = nothing selected
  const [breadcrumbPath, setBreadcrumbPath] = useState<BreadcrumbItem[]>([
    { label: 'Project', icon: 'pi pi-home' }
  ]); // For hierarchical breadcrumbs
  // Local modal state removed - managed centrally
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [userName, setUserName] = useState<string>('');

  // Helper function to update auth status
  const updateAuthStatus = async () => {
    // Check both localStorage and sessionStorage
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
          // Clear all authentication data
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

  // Check login status on component mount and when storage changes
  React.useEffect(() => {
    updateAuthStatus();

    // Listen for storage changes (e.g., login in another tab)
    const handleStorageChange = () => {
      updateAuthStatus();
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Available navigation options (for future hierarchical navigation)
  // const navigationTree: BreadcrumbItem[] = [
  //   {
  //     label: 'Project',
  //     icon: 'pi pi-home',
  //     children: [
  //       {
  //         label: 'Teams',
  //         icon: 'pi pi-users',
  //         action: 'teams'
  //       },
  //       {
  //         label: 'Templates',
  //         icon: 'pi pi-cog',
  //         action: 'templates'
  //       },
  //       {
  //         label: 'Database',
  //         icon: 'pi pi-database',
  //         children: [
  //           {
  //             label: 'Designer',
  //             icon: 'pi pi-window-maximize',
  //             action: 'databasedesigner'
  //           },
  //           {
  //             label: 'Import',
  //             icon: 'pi pi-upload',
  //             children: [
  //               {
  //                 label: 'Import .sql',
  //                 icon: 'pi pi-file',
  //                 action: 'import-sql'
  //               },
  //               {
  //                 label: 'Import Schema',
  //                 icon: 'pi pi-sitemap',
  //                 action: 'import-schema'
  //               }
  //             ]
  //           },
  //           {
  //             label: 'Export',
  //             icon: 'pi pi-download',
  //             children: [
  //               {
  //                 label: 'Export Schema',
  //                 icon: 'pi pi-file-export',
  //                 action: 'export-schema'
  //               }
  //             ]
  //           }
  //         ]
  //       }
  //     ]
  //   }
  // ];

  // Menu items with PrimeIcons and panel logic
  const menuItems: MenuItem[] = [
    {
      label: 'Project',
      icon: 'pi pi-briefcase',
      command: () => handleMainAction('project')
    },
    {
      label: 'Teams',
      icon: 'pi pi-users',
      command: () => handleMainAction('teams')
    },
    {
      label: 'Database Designer',
      icon: 'pi pi-window-maximize',
      command: () => handleMainAction('databasedesigner')
    },
    {
      label: 'Templates',
      icon: 'pi pi-cog',
      command: () => handleMainAction('templates')
    }
  ];

  // For profile menu (resets itself) - now only via central modal management
  const handleProfileAction = React.useCallback((action: string) => {
    switch (action) {
      case 'login':
        setBreadcrumbPath([
          { label: 'Project', icon: 'pi pi-home' },
          { label: 'Login', icon: 'pi pi-sign-in' }
        ]);
        onOpenModal?.('login');
        break;
      case 'register':
        setBreadcrumbPath([
          { label: 'Project', icon: 'pi pi-home' },
          { label: 'Register', icon: 'pi pi-user-plus' }
        ]);
        onOpenModal?.('register');
        break;
      case 'profile':
        setBreadcrumbPath([
          { label: 'Project', icon: 'pi pi-home' },
          { label: 'Profile', icon: 'pi pi-user' }
        ]);
        onOpenModal?.('profile');
        break;
      case 'logout':
        // Complete logout - clear all authentication data
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('remember_me');
        localStorage.removeItem('user');
        sessionStorage.removeItem('access_token');
        sessionStorage.removeItem('refresh_token');
        sessionStorage.removeItem('user');
        
        // Clear remember me cookie
        document.cookie = 'remember_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        
        setIsLoggedIn(false);
        setUserName('');
        setBreadcrumbPath([
          { label: 'Project', icon: 'pi pi-home' },
          { label: 'Logged out', icon: 'pi pi-sign-out' }
        ]);
        
        // Trigger storage event to update other components
        window.dispatchEvent(new Event('storage'));
        break;
    }

    // Reset immediately so nothing remains selected
    setTimeout(() => setProfileActiveIndex(-1), 100);
  }, [onOpenModal]);

  // Dynamic menu based on login status
  const menu2Items: MenuItem[] = React.useMemo(() => {
    if (isLoggedIn) {
      // User is logged in - show profile and logout
      return [
        {
          label: `${userName}`,
          icon: 'pi pi-user',
          command: () => handleProfileAction('profile')
        },
        {
          label: 'Logout',
          icon: 'pi pi-sign-out',
          command: () => handleProfileAction('logout')
        }
      ];
    } else {
      // User is not logged in - show login and register
      return [
        {
          label: 'Login',
          icon: 'pi pi-sign-in',
          command: () => handleProfileAction('login')
        },
        {
          label: 'Register',
          icon: 'pi pi-user-plus',
          command: () => handleProfileAction('register')
        }
      ];
    }
  }, [isLoggedIn, userName, handleProfileAction]);

  // Navigate to breadcrumb path and execute action
  const navigateTo = (path: BreadcrumbItem[], action?: string) => {
    setBreadcrumbPath(path);
    
    if (action) {
      switch (action) {
        case "databasedesigner":
          onOpenPanel('t2');
          break;
        case "templates":
          onOpenPanel('t3');
          break;
        case "teams":
          onOpenPanel('teams');
          break;
        case "import-sql":
          // TODO: Open SQL import dialog
          console.log('Opening SQL import');
          break;
        case "import-schema":
          // TODO: Open schema import dialog
          console.log('Opening schema import');
          break;
        case "export-schema":
          // TODO: Open schema export dialog
          console.log('Opening schema export');
          break;
      }
    }
  };

  // For main menu (resets itself)
  const handleMainAction = (action: string) => {
    switch (action) {
      case "project":
        navigateTo([
          { label: 'Project', icon: 'pi pi-home' },
          { label: 'Overview', icon: 'pi pi-pen-to-square', action: 'project' }
        ], action);
        onOpenPanel('project');
        break;
      case "teams":
        navigateTo([
          { label: 'Project', icon: 'pi pi-home' },
          { label: 'Teams', icon: 'pi pi-users', action: 'teams' }
        ], action);
        onOpenPanel('teams');
        break;
      case "databasedesigner":
        navigateTo([
          { label: 'Project', icon: 'pi pi-home' },
          { label: 'Database', icon: 'pi pi-database' },
          { label: 'Designer', icon: 'pi pi-window-maximize', action: 'databasedesigner' }
        ], action);
        break;
      case "templates":
        navigateTo([
          { label: 'Project', icon: 'pi pi-home' },
          { label: 'Templates', icon: 'pi pi-cog', action: 'templates' }
        ], action);
        break;
    }

    // Reset immediately so nothing remains selected
    setTimeout(() => setMainActiveIndex(-1), 100);
  };

  // Handle breadcrumb clicks - navigate back to that level
  const handleBreadcrumbClick = (index: number) => {
    const newPath = breadcrumbPath.slice(0, index + 1);
    const clickedItem = breadcrumbPath[index];
    
    // If the clicked item has an action, execute it
    if (clickedItem.action) {
      navigateTo(newPath, clickedItem.action);
    } else {
      setBreadcrumbPath(newPath);
    }
  };

  return (
    <div style={{ flex: 1, height: '100%' }} className="bg-gray-900 text-white">
      {/* Top Navigation Bar with Logo and Actions */}
      <nav style={{ flex: 1, height: '60px' }} className="flex justify-between items-center px-6 py-4 bg-gray-800 border-b border-gray-700">
        {/* Logo/Brand and Project Selector */}
        <div className="flex items-center space-x-6">
          <div className="text-xl font-bold text-blue-400">Scoriet</div>
          
          {/* Global Project Selector */}
          {isLoggedIn && (
            <div className="flex items-center space-x-2">
              <i className="pi pi-briefcase text-gray-400"></i>
              <Dropdown
                value={selectedProject}
                options={projects || []}
                onChange={(e) => {
                  setSelectedProject(e.value);
                }}
                optionLabel="name"
                optionValue={null}
                placeholder="Select Project"
                className="w-48"
                disabled={loading || !projects || projects.length === 0}
                filter
                emptyMessage="No projects found"
                style={{ 
                  backgroundColor: '#374151',
                  border: '1px solid #4B5563'
                }}
              />
              {selectedProject && (
                <span className="text-xs text-gray-400">
                  by {selectedProject.owner.name}
                </span>
              )}
            </div>
          )}
        </div>

        {/* PrimeReact TabMenu */}
        <div className="px-6 py-4 bg-gray-850 border-gray-700">
          <div className="max-w-2xl mx-auto">
            <TabMenu
              model={menuItems}
              activeIndex={mainActiveIndex}
              onTabChange={(e) => {
                setMainActiveIndex(e.index);
                const selectedItem = menuItems[e.index];
                if (selectedItem.command) {
                  selectedItem.command({} as any);
                }
              }}
              className="custom-tabmenu"
            />
          </div>
        </div>

        {/* Second TabMenu with its own activeIndex */}
        <div className="px-6 py-4 bg-gray-850 border-gray-700">
          <div className="max-w-2xl mx-auto">
            <TabMenu
              model={menu2Items}
              activeIndex={profileActiveIndex}
              onTabChange={(e) => {
                setProfileActiveIndex(e.index);
                const selectedItem = menu2Items[e.index];
                if (selectedItem.command) {
                  selectedItem.command({} as any);
                }
              }}
              className="custom-tabmenu"
            />
          </div>
        </div>
      </nav>

      {/* Interactive Breadcrumbs */}
      <div className="px-6 py-3 bg-gray-825 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-sm">
            {breadcrumbPath.map((item, index) => (
              <React.Fragment key={index}>
                <button
                  onClick={() => handleBreadcrumbClick(index)}
                  className="flex items-center space-x-1 px-2 py-1 rounded hover:bg-gray-700 transition-colors duration-200 text-gray-300 hover:text-white"
                >
                  {item.icon && <i className={item.icon}></i>}
                  <span className={index === breadcrumbPath.length - 1 ? 'text-white font-medium' : 'text-gray-300'}>{item.label}</span>
                </button>
                {index < breadcrumbPath.length - 1 && (
                  <i className="pi pi-angle-right text-gray-500 text-xs"></i>
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Quick Navigation Dropdown */}
          <div className="flex items-center space-x-2">
            <div className="relative group">
              <button className="flex items-center space-x-2 px-3 py-1 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded transition-colors duration-200">
                <i className="pi pi-compass"></i>
                <span>Quick Nav</span>
                <i className="pi pi-angle-down text-xs"></i>
              </button>
              
              {/* Dropdown Menu */}
              <div className="absolute right-0 top-full mt-1 w-64 bg-gray-800 border border-gray-600 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="p-2">
                  <div className="text-xs text-gray-400 uppercase tracking-wide mb-2 px-2">Project Areas</div>
                  
                  <button 
                    onClick={() => navigateTo([
                      { label: 'Project', icon: 'pi pi-home' },
                      { label: 'Templates', icon: 'pi pi-cog', action: 'templates' }
                    ], 'templates')}
                    className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded"
                  >
                    <i className="pi pi-cog"></i>
                    <span>Templates</span>
                  </button>
                  
                  <div className="border-t border-gray-600 my-2"></div>
                  <div className="text-xs text-gray-400 uppercase tracking-wide mb-2 px-2">Team Management</div>
                  
                  <button 
                    onClick={() => navigateTo([
                      { label: 'Project', icon: 'pi pi-home' },
                      { label: 'Teams', icon: 'pi pi-users', action: 'teams' }
                    ], 'teams')}
                    className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded"
                  >
                    <i className="pi pi-users"></i>
                    <span>Manage Teams</span>
                  </button>
                  
                  <div className="border-t border-gray-600 my-2"></div>
                  <div className="text-xs text-gray-400 uppercase tracking-wide mb-2 px-2">Database</div>
                  
                  <button 
                    onClick={() => navigateTo([
                      { label: 'Project', icon: 'pi pi-home' },
                      { label: 'Database', icon: 'pi pi-database' },
                      { label: 'Designer', icon: 'pi pi-window-maximize', action: 'databasedesigner' }
                    ], 'databasedesigner')}
                    className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded"
                  >
                    <i className="pi pi-window-maximize"></i>
                    <span>Database Designer</span>
                  </button>
                  
                  <button 
                    onClick={() => navigateTo([
                      { label: 'Project', icon: 'pi pi-home' },
                      { label: 'Database', icon: 'pi pi-database' },
                      { label: 'Import', icon: 'pi pi-upload' },
                      { label: 'Import .sql', icon: 'pi pi-file', action: 'import-sql' }
                    ], 'import-sql')}
                    className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded"
                  >
                    <i className="pi pi-file"></i>
                    <span>Import SQL</span>
                  </button>
                  
                  <button 
                    onClick={() => navigateTo([
                      { label: 'Project', icon: 'pi pi-home' },
                      { label: 'Database', icon: 'pi pi-database' },
                      { label: 'Export', icon: 'pi pi-download' },
                      { label: 'Export Schema', icon: 'pi pi-file-export', action: 'export-schema' }
                    ], 'export-schema')}
                    className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded"
                  >
                    <i className="pi pi-file-export"></i>
                    <span>Export Schema</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}