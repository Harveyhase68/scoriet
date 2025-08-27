// resources/js/Components/Panels/NavigationPanel.tsx
import React, { useState } from 'react';
import { TabMenu } from 'primereact/tabmenu';
import { MenuItem } from 'primereact/menuitem';
import { NavigationPanelProps } from '@/types';
import { AuthModalType } from '@/Components/AuthModals/AuthModalManager';

interface ExtendedNavigationPanelProps extends NavigationPanelProps {
  onOpenModal?: (modalType: AuthModalType) => void;
}

export default function NavigationPanel({ onOpenPanel, onOpenModal }: ExtendedNavigationPanelProps) {
  const [profileActiveIndex, setProfileActiveIndex] = useState<number>(-1); // -1 = nothing selected
  const [mainActiveIndex, setMainActiveIndex] = useState<number>(-1); // -1 = nothing selected
  const [currentBreadcrumb, setCurrentBreadcrumb] = useState<string>('Home'); // For breadcrumbs
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

  // Menu items with PrimeIcons and panel logic
  const menuItems: MenuItem[] = [
    {
      label: 'Home',
      icon: 'pi pi-home',
      command: () => handleMainAction('home')
    },
    {
      label: 'Main',
      icon: 'pi pi-window-maximize',
      command: () => handleMainAction('main')
    },
    {
      label: 'Interactive',
      icon: 'pi pi-cog',
      command: () => handleMainAction('interactive')
    },
    {
      label: 'Database',
      icon: 'pi pi-database',
      command: () => handleMainAction('database')
    },
    {
      label: 'Tools',
      icon: 'pi pi-wrench',
      command: () => handleMainAction('tools')
    }
  ];

  // For profile menu (resets itself) - now only via central modal management
  const handleProfileAction = React.useCallback((action: string) => {
    switch (action) {
      case 'login':
        setCurrentBreadcrumb('Login');
        onOpenModal?.('login');
        break;
      case 'register':
        setCurrentBreadcrumb('Register');
        onOpenModal?.('register');
        break;
      case 'profile':
        setCurrentBreadcrumb('Profile');
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
        setCurrentBreadcrumb('Logged out');
        
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

  // For main menu (resets itself)
  const handleMainAction = (action: string) => {
    switch (action) {
      case "home":
        setCurrentBreadcrumb('Home');
        // Here you could open a dashboard panel
        // onOpenPanel('dashboard');
        break;
      case "main":
        setCurrentBreadcrumb('Main');
        onOpenPanel('t2');
        break;
      case "interactive":
        setCurrentBreadcrumb('Interactive');
        onOpenPanel('t3');
        break;
      case "database":
        setCurrentBreadcrumb('Database');
        onOpenPanel('t5');
        break;
      case "tools":
        setCurrentBreadcrumb('Tools');
        break;
    }

    // Reset immediately so nothing remains selected
    setTimeout(() => setMainActiveIndex(-1), 100);
  };

  return (
    <div style={{ flex: 1, height: '100%' }} className="bg-gray-900 text-white">
      {/* Top Navigation Bar with Logo and Actions */}
      <nav style={{ flex: 1, height: '60px' }} className="flex justify-between items-center px-6 py-4 bg-gray-800 border-b border-gray-700">
        {/* Logo/Brand */}
        <div className="flex items-center space-x-4">
          <div className="text-xl font-bold text-blue-400">MyApp</div>
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

      {/* Breadcrumbs */}
      <div className="px-6 py-3 bg-gray-825 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-sm text-gray-300">
            <span>{currentBreadcrumb}</span>
            <span>→</span>
            <span className="text-white font-medium">Current View</span>
          </div>

        </div>
      </div>

      {/* Authentication Modals - REMOVED: Now managed centrally in Index */}
    </div>
  );
}