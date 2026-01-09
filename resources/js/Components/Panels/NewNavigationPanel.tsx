// resources/js/Components/Panels/NewNavigationPanel.tsx
import React, { useState, useCallback } from 'react';
import { TieredMenu } from 'primereact/tieredmenu';
import { MenuItem } from 'primereact/menuitem';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { NavigationPanelProps } from '@/types';
import { AuthModalType } from '@/Components/AuthModals/AuthModalManager';
import { useProject } from '@/contexts/ProjectContext';
import { useTranslation, SupportedLanguage, getStoredLanguage } from '@/i18n';
import ProjectWizardModal from '@/Components/ProjectWizardModal';
import PlanModal from '@/Components/AuthModals/PlanModal';

interface ExtendedNavigationPanelProps extends NavigationPanelProps {
  onOpenModal?: (modalType: AuthModalType) => void;
  onOpenSqlImport?: () => void;
  onOpenDatabaseExport?: () => void;
}

export default function NewNavigationPanel({ onOpenPanel, onOpenModal, onOpenSqlImport, onOpenDatabaseExport }: ExtendedNavigationPanelProps) {
  // i18n setup
  const [currentLanguage] = React.useState<SupportedLanguage>(getStoredLanguage());
  const { t } = useTranslation(currentLanguage);

  const { selectedProject, loadProjects, setSelectedProject } = useProject();
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [userName, setUserName] = useState<string>('');
  const [userType, setUserType] = useState<string>('');
  const [userCredits, setUserCredits] = useState<number>(0);
  const [patronType, setPatronType] = useState<string | null>(null);
  const [isInnerCore, setIsInnerCore] = useState<boolean>(false);
  const [showWizard, setShowWizard] = useState<boolean>(false);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    // Load from localStorage, default to true (collapsed)
    const saved = localStorage.getItem('navigation_collapsed');
    return saved === null ? true : JSON.parse(saved);
  });

  // Form Designer Paywall States
  const [showFormPaywall, setShowFormPaywall] = useState(false);
  const [formPaywallTarget, setFormPaywallTarget] = useState<'formset-management' | 'form-designer' | null>(null);
  const [formPaywallLoading, setFormPaywallLoading] = useState(false);
  const [formAccessInfo, setFormAccessInfo] = useState<{
    hasAccess: boolean;
    needsUnlock: boolean;
    credits: number;
    requiredCredits: number;
  } | null>(null);
  const [showPlanModal, setShowPlanModal] = useState(false);

  // 🎯 DEMO MODE DETECTION
  const isDemoMode = sessionStorage.getItem('demo_mode') === 'true';

  // Helper function to update auth status
  const updateAuthStatus = async () => {
    const localToken = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
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
          setUserCredits(user.credits || 0);
          setPatronType(user.patron_type || null);
          setIsInnerCore(user.is_inner_core || false);
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
          setUserCredits(0);
          setPatronType(null);
          setIsInnerCore(false);

          // Trigger storage event to notify other components (like Index.tsx)
          window.dispatchEvent(new Event('storage'));
          return false;
        }
      } catch {
        setIsLoggedIn(false);
        setUserName('');
        setIsInnerCore(false);
        return false;
      }
    } else {
      setIsLoggedIn(false);
      setUserName('');
      setUserType('');
      setIsInnerCore(false);
      return false;
    }
  };

  // Save navigation state to localStorage whenever it changes
  React.useEffect(() => {
    localStorage.setItem('navigation_collapsed', JSON.stringify(isCollapsed));
  }, [isCollapsed]);

  // Check form designer access and show paywall if needed
  const checkFormDesignerAccess = useCallback(async (target: 'formset-management' | 'form-designer') => {
    setFormPaywallLoading(true);
    setFormPaywallTarget(target);

    try {
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (!token) {
        // Not logged in - show login modal instead
        onOpenModal?.('login');
        setFormPaywallLoading(false);
        return;
      }

      const response = await fetch('/api/form-designer/access', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.has_access) {
          // User has access - open the panel directly
          onOpenPanel(target);
          setFormPaywallLoading(false);
        } else {
          // User needs to unlock - show paywall
          // Backend returns: user_credits, unlock_cost
          setFormAccessInfo({
            hasAccess: false,
            needsUnlock: true,
            credits: data.user_credits || 0,
            requiredCredits: data.unlock_cost || 50
          });
          setShowFormPaywall(true);
          setFormPaywallLoading(false);
        }
      } else {
        // Error - try to open panel anyway (let the panel handle errors)
        onOpenPanel(target);
        setFormPaywallLoading(false);
      }
    } catch (error) {
      console.error('Error checking form designer access:', error);
      // On error, try to open panel anyway
      onOpenPanel(target);
      setFormPaywallLoading(false);
    }
  }, [onOpenPanel, onOpenModal]);

  // Handle form designer unlock
  const handleFormUnlock = useCallback(async () => {
    setFormPaywallLoading(true);

    try {
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (!token) return;

      const response = await fetch('/api/form-designer/unlock', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        // Unlock successful - update credits and open panel
        setShowFormPaywall(false);
        if (formPaywallTarget) {
          onOpenPanel(formPaywallTarget);
        }
        // Trigger credits update
        window.dispatchEvent(new Event('creditsChanged'));
        updateAuthStatus();
      } else {
        const data = await response.json();
        alert(data.message || 'Freischaltung fehlgeschlagen');
      }
    } catch (error) {
      console.error('Error unlocking form designer:', error);
      alert('Fehler beim Freischalten');
    } finally {
      setFormPaywallLoading(false);
    }
  }, [formPaywallTarget, onOpenPanel]);

  // Handle buy credits
  const handleBuyCredits = useCallback(() => {
    setShowFormPaywall(false);
    setShowPlanModal(true);
  }, []);

  // Handle plan modal close
  const handlePlanModalClose = useCallback(() => {
    setShowPlanModal(false);
    updateAuthStatus();
    // Re-check access after buying credits
    if (formPaywallTarget) {
      checkFormDesignerAccess(formPaywallTarget);
    }
  }, [formPaywallTarget, checkFormDesignerAccess]);

  // Check login status on component mount and when storage changes
  React.useEffect(() => {
    updateAuthStatus();

    const handleStorageChange = () => {
      updateAuthStatus();
    };

    const handleAuthChange = () => {
      updateAuthStatus();
    };

    const handleCreditsChanged = () => {
      // Reload user data when credits change (e.g., after generation, project creation, etc.)
      updateAuthStatus();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('auth-change', handleAuthChange);
    window.addEventListener('creditsChanged', handleCreditsChanged);

    // Periodic token validation (every 5 minutes)
    const tokenCheckInterval = setInterval(() => {
      updateAuthStatus();
    }, 5 * 60 * 1000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('auth-change', handleAuthChange);
      window.removeEventListener('creditsChanged', handleCreditsChanged);
      clearInterval(tokenCheckInterval);
    };
  }, []);

  // Auto-open wizard for users - runs on mount AND when isLoggedIn changes
  React.useEffect(() => {
    // Check if we should show wizard
    const checkAndShowWizard = () => {
      if (!isLoggedIn) return; // Wait until user is logged in

      const shouldShowWizard = localStorage.getItem('scoriet_show_wizard_on_start');
      if (shouldShowWizard === 'false') return; // User explicitly disabled auto-show

      // Only show automatically once per session
      const shownThisSession = sessionStorage.getItem('scoriet_wizard_shown_this_session');
      if (shownThisSession) return; // Already shown this session

      // Show wizard and mark as shown
      setShowWizard(true);
      sessionStorage.setItem('scoriet_wizard_shown_this_session', 'true');
    };

    // Small delay to ensure UI is ready and auth state is settled
    const timer = setTimeout(checkAndShowWizard, 800);

    return () => clearTimeout(timer);
  }, [isLoggedIn]); // Run on mount and when isLoggedIn changes

  // Main navigation menu items for TieredMenu
  const navigationItems: MenuItem[] = [
    {
      label: t.panelsewnavigationpanel112,
      icon: 'pi pi-arrow-left',
      command: () => window.location.href = '/'
    },
    {
      separator: true
    },
    {
      label: t.panelsewnavigationpanel120,
      icon: 'pi pi-home',
      command: () => onOpenPanel('home')
    },
    {
      label: 'Project Setup Wizard',
      icon: 'pi pi-sparkles',
      command: () => setShowWizard(true)
    },
    {
      separator: true
    },
    {
      label: t.manageteammodal316,
      icon: 'pi pi-briefcase',
      // No command here - parent items should not execute
      items: [
        {
          label: t.panelsewnavigationpanel133,
          icon: 'pi pi-home',
          command: () => onOpenPanel('project')
        },
        {
          label: t.panelsewnavigationpanel138,
          icon: 'pi pi-cog',
          items: [
            {
              label: t.panelsewnavigationpanel142,
              icon: 'pi pi-sliders-h',
              command: () => {
                if (selectedProject) {
                  onOpenPanel('project-settings', {
                    title: `${t.newnavigationpanel142} (${selectedProject.name})`
                  });
                } else {
                  // If no project selected, open project management first
                  onOpenPanel('project');
                }
              }
            }
          ]
        },
        {
          separator: true
        },
        {
          label: t.joincodemodal247,
          icon: 'pi pi-users',
          items: [
            {
              label: t.panelsewnavigationpanel165,
              icon: 'pi pi-cog',
              command: () => onOpenPanel('team-management')
            },
          ]
        },
        {
          separator: true
        },
        {
          label: t.panelsewnavigationpanel211,
          icon: 'pi pi-send',
          command: () => onOpenPanel('my-applications')
        },
        {
          label: t.panelsewnavigationpanel216,
          icon: 'pi pi-globe',
          command: () => onOpenPanel('public-projects')
        }
      ]
    },
    {
      label: t.panelsewnavigationpanel184,
      icon: 'pi pi-cog',
      items: [
        {
          label: t.panelsewnavigationpanel188,
          icon: 'pi pi-list',
          command: () => onOpenPanel('template-management')
        },
        {
          label: 'Template Store',
          icon: 'pi pi-shopping-cart',
          command: () => onOpenPanel('template-store')
        },
        // Only show Template Review for Inner Core members
        ...(isInnerCore ? [{
          label: 'Template Review',
          icon: 'pi pi-star-fill',
          command: () => onOpenPanel('template-review')
        }] : []),
        {
          separator: true
        },
        {
          label: t.panelsewnavigationpanel201,
          icon: 'pi pi-link',
          command: () => onOpenPanel('template-db-schema-dependencies')
        }
      ]
    },
    {
      label: 'Formulare',
      icon: 'pi pi-window-maximize',
      items: [
        {
          label: 'Formular Management 💰',
          icon: 'pi pi-list',
          command: () => checkFormDesignerAccess('formset-management')
        },
        {
          label: 'Formular Editor 💰',
          icon: 'pi pi-pencil',
          command: () => checkFormDesignerAccess('form-designer')
        }
      ]
    },
    {
      label: t.panelsewnavigationpanel223,
      icon: 'pi pi-database',
      // No command here - parent items should not execute
      items: [
        {
          label: t.panelsewnavigationpanel228,
          icon: 'pi pi-cog',
          command: () => onOpenPanel('database-management')
        },
        {
          label: t.panelsewnavigationpanel233,
          icon: 'pi pi-window-maximize',
          command: () => onOpenPanel('t2')
        },
        {
          label: t.panelsewnavigationpanel238,
          icon: 'pi pi-language',
          command: () => onOpenPanel('schema-translation')
        },
        {
          label: 'Schema Migration 💰',
          icon: 'pi pi-sync',
          command: () => onOpenPanel('query-builder')
        },
        {
          separator: true
        },
        {
          label: t.panelsewnavigationpanel246,
          icon: 'pi pi-upload',
          command: () => onOpenSqlImport && onOpenSqlImport()
        },
        {
          label: t.panelsewnavigationpanel251,
          icon: 'pi pi-download',
          command: () => onOpenDatabaseExport && onOpenDatabaseExport()
        }
      ]
    },
    {
      label: t.panelsewnavigationpanel258,
      icon: 'pi pi-wrench',
      // No command here - parent items should not execute
      items: [
        {
          label: t.panelsewnavigationpanel263,
          icon: 'pi pi-wrench',
          command: () => onOpenPanel('debug-manual-generator')
        },
        {
          label: t.panelsewnavigationpanel268,
          icon: 'pi pi-play',
          command: () => onOpenPanel('code-generation')
        },
        {
          separator: true
        },
        {
          label: 'Code Anpassungen 💰',
          icon: 'pi pi-sliders-h',
          command: () => onOpenPanel('code-adjustments')
        },
        ...(userType === 'system' ? [
          {
            separator: true
          },
          {
            label: 'Cache Debug',
            icon: 'pi pi-server',
            command: () => onOpenPanel('cache-debug')
          }
        ] : [])
      ]
    },
    ...(userType === 'system' || userType === 'admin' ? [
      {
        label: t.panelsewnavigationpanel281,
        icon: 'pi pi-cog',
        items: [
          {
            label: t.panelsewnavigationpanel285,
            icon: 'pi pi-cog',
            command: () => onOpenPanel('system-settings')
          },
          {
            label: t.panelsewnavigationpanel290,
            icon: 'pi pi-globe',
            command: () => onOpenPanel('language-management')
          },
          {
            label: 'Auszahlungen',
            icon: 'pi pi-wallet',
            command: () => onOpenPanel('payout-admin')
          },
          {
            separator: true
          },
          {
            label: t.panelsewnavigationpanel298,
            icon: 'pi pi-file-edit',
            command: () => onOpenPanel('cms-admin')
          }
        ]
      }
    ] : [])
  ];

  // Profile menu items
  const profileItems: MenuItem[] = isLoggedIn ? [
    {
      label: userName,
      icon: 'pi pi-user',
      // No command here - parent items should not execute
      items: [
        {
          label: t.profileTab,
          icon: 'pi pi-user-edit',
          command: () => onOpenModal?.('profile')
        },
        // Messaging button
        ...(!isDemoMode ? [{
          label: 'Nachrichten',
          icon: 'pi pi-envelope',
          command: () => window.dispatchEvent(new CustomEvent('openMessaging'))
        }] : []),
        // 🎯 Hide "Change Plan" in DEMO mode
        ...(!isDemoMode ? [{
          label: t.panelsewnavigationpanel320,
          icon: 'pi pi-credit-card',
          command: () => onOpenModal?.('plan')
        }] : []),
        {
          label: t.panelsewnavigationpanel112,
          icon: 'pi pi-external-link',
          command: () => window.location.href = '/'
        },
        {
          separator: true
        },
        {
          label: t.panelsewnavigationpanel333,
          icon: 'pi pi-sign-out',
          command: () => {
            // 🎯 DEMO MODE: Redirect to main site, not demo subdomain
            if (isDemoMode) {
              sessionStorage.clear();
              localStorage.clear();
              document.cookie = 'remember_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
              window.location.href = 'https://scoriet.dev';
              return;
            }

            // Normal logout
            sessionStorage.clear();
            localStorage.clear();
            localStorage.setItem('logout_in_progress', 'true');
            document.cookie = 'remember_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
            setIsLoggedIn(false);
            setUserName('');
            window.location.href = '/';
          }
        }
      ]
    }
  ] : [
    {
      label: t.panelsewnavigationpanel359,
      icon: 'pi pi-user',
      // No command here - parent items should not execute
      items: [
        {
          label: t.loginmodal212,
          icon: 'pi pi-sign-in',
          command: () => onOpenModal?.('login')
        },
        // 🎯 Hide "Register" button in DEMO mode
        ...(!isDemoMode ? [{
          label: t.authmodalsegistermodal203,
          icon: 'pi pi-user-plus',
          command: () => onOpenModal?.('register')
        }] : [])
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
          title={isCollapsed ? 'Expand Menu' : t.panelsewnavigationpanel384}
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
                title={t.panelsewnavigationpanel112}
              >
                <i className="pi pi-arrow-left text-gray-300"></i>
              </button>
            </div>
            <div className="relative group">
              <button
                onClick={() => onOpenPanel('home')}
                className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-700 transition-colors"
                title={t.panelsewnavigationpanel120}
              >
                <i className="pi pi-home text-gray-300"></i>
              </button>
            </div>
            <div className="relative group">
              <button
                onClick={() => setShowWizard(true)}
                className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-700 transition-colors"
                title="Project Setup Wizard"
              >
                <i className="pi pi-sparkles text-gray-300"></i>
              </button>
            </div>
            {/* Icon-only navigation with TieredMenu - only 3 main categories */}
            <div className="relative group">
              <button className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-700 transition-colors">
                <i className="pi pi-briefcase text-gray-300" title={t.manageteammodal316}></i>
              </button>
              {/* Popup submenu for Project */}
              <div className="absolute left-full top-0 ml-2 w-64 bg-gray-800 border border-gray-600 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="p-2">
                  <button onClick={() => onOpenPanel('project')} className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded">
                    <i className="pi pi-home"></i>
                    <span>{t.newnavigationpanel133}</span>
                  </button>

                  <div className="relative group/settings">
                    <button className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded">
                      <i className="pi pi-cog"></i>
                      <span>{t.newnavigationpanel138}</span>
                      <i className="pi pi-angle-right ml-auto text-xs"></i>
                    </button>
                    {/* Sub-submenu for Settings */}
                    <div className="absolute left-full top-0 ml-1 w-64 bg-gray-800 border border-gray-600 rounded-lg shadow-xl opacity-0 invisible group-hover/settings:opacity-100 group-hover/settings:visible transition-all duration-200 z-50">
                      <div className="p-2">
                        <button onClick={() => {
                          if (selectedProject) {
                            onOpenPanel('project-settings', {
                              title: `${t.newnavigationpanel142} (${selectedProject.name})`
                            });
                          } else {
                            onOpenPanel('project');
                          }
                        }} className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded">
                          <i className="pi pi-sliders-h"></i>
                          <span>{t.newnavigationpanel142})</span>
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="border-t border-gray-600 my-2"></div>

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
                          <span>Team Management 💰</span>
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="border-t border-gray-600 my-2"></div>
                  <button onClick={() => onOpenPanel('my-applications')} className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded">
                    <i className="pi pi-send"></i>
                    <span>{t.panelsewnavigationpanel211}</span>
                  </button>
                  <button onClick={() => onOpenPanel('public-projects')} className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded">
                    <i className="pi pi-globe"></i>
                    <span>{t.panelsewnavigationpanel216}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Templates - Top Level */}
            <div className="relative group">
              <button className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-700 transition-colors">
                <i className="pi pi-cog text-gray-300" title={t.panelsewnavigationpanel184}></i>
              </button>
              {/* Popup submenu for Templates */}
              <div className="absolute left-full top-0 ml-2 w-64 bg-gray-800 border border-gray-600 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="p-2">
                  <button onClick={() => onOpenPanel('template-management')} className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded">
                    <i className="pi pi-list"></i>
                    <span>{t.panelsewnavigationpanel188}</span>
                  </button>
                  <button onClick={() => onOpenPanel('template-store')} className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded">
                    <i className="pi pi-shopping-cart"></i>
                    <span>Template Store</span>
                  </button>
                  {/* Only show Template Review for Inner Core members */}
                  {isInnerCore && (
                    <button onClick={() => onOpenPanel('template-review')} className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded">
                      <i className="pi pi-star-fill text-yellow-400"></i>
                      <span>Template Review</span>
                    </button>
                  )}
                  <div className="border-t border-gray-600 my-2"></div>
                  <button onClick={() => onOpenPanel('template-db-schema-dependencies')} className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded">
                    <i className="pi pi-link"></i>
                    <span>{t.panelsewnavigationpanel201}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Formulare - Top Level */}
            <div className="relative group">
              <button className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-700 transition-colors">
                <i className="pi pi-window-maximize text-gray-300" title="Formulare"></i>
              </button>
              {/* Popup submenu for Formulare */}
              <div className="absolute left-full top-0 ml-2 w-64 bg-gray-800 border border-gray-600 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="p-2">
                  <button onClick={() => checkFormDesignerAccess('formset-management')} className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded">
                    <i className="pi pi-list"></i>
                    <span>Formular Management 💰</span>
                  </button>
                  <button onClick={() => checkFormDesignerAccess('form-designer')} className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded">
                    <i className="pi pi-pencil"></i>
                    <span>Formular Editor 💰</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="relative group">
              <button className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-700 transition-colors">
                <i className="pi pi-database text-gray-300" title={t.panelsewnavigationpanel223}></i>
              </button>
              {/* Popup submenu for Database */}
              <div className="absolute left-full top-0 ml-2 w-64 bg-gray-800 border border-gray-600 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="p-2">
                  <button onClick={() => onOpenPanel('database-management')} className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded">
                    <i className="pi pi-cog"></i>
                    <span>{t.panelsewnavigationpanel540}</span>
                  </button>
                  <button onClick={() => onOpenPanel('t2')} className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded">
                    <i className="pi pi-window-maximize"></i>
                    <span>{t.panelsewnavigationpanel544}</span>
                  </button>
                  <button onClick={() => onOpenPanel('schema-translation')} className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded">
                    <i className="pi pi-language"></i>
                    <span>{t.panelsewnavigationpanel548}</span>
                  </button>
                  <button onClick={() => onOpenPanel('query-builder')} className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded">
                    <i className="pi pi-sync"></i>
                    <span>Schema Migration 💰</span>
                  </button>
                  <div className="border-t border-gray-600 my-2"></div>
                  <button onClick={() => onOpenSqlImport && onOpenSqlImport()} className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded">
                    <i className="pi pi-upload"></i>
                    <span>{t.panelsewnavigationpanel246}</span>
                  </button>
                  <button onClick={() => onOpenDatabaseExport && onOpenDatabaseExport()} className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded">
                    <i className="pi pi-download"></i>
                    <span>{t.panelsewnavigationpanel251}</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="relative group">
              <button className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-700 transition-colors">
                <i className="pi pi-wrench text-gray-300" title={t.panelsewnavigationpanel258}></i>
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
                    <span>{t.panelsewnavigationpanel576}</span>
                  </button>
                  <div className="border-t border-gray-600 my-2"></div>
                  <button onClick={() => onOpenPanel('code-adjustments')} className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded">
                    <i className="pi pi-sliders-h"></i>
                    <span>Code Anpassungen 💰</span>
                  </button>
                  {userType === 'system' && (
                    <>
                      <div className="border-t border-gray-600 my-2"></div>
                      <button onClick={() => onOpenPanel('cache-debug')} className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded">
                        <i className="pi pi-server"></i>
                        <span>Cache Debug</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            {(userType === 'system' || userType === 'admin') && (
              <div className="relative group">
                <button className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-700 transition-colors">
                  <i className="pi pi-cog text-gray-300" title={t.panelsewnavigationpanel281}></i>
                </button>
                {/* Popup submenu for Administration */}
                <div className="absolute left-full top-0 ml-2 w-64 bg-gray-800 border border-gray-600 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="p-2">
                    <button onClick={() => onOpenPanel('system-settings')} className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded">
                      <i className="pi pi-cog"></i>
                      <span>System Settings</span>
                    </button>
                    <button onClick={() => onOpenPanel('language-management')} className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded">
                      <i className="pi pi-globe"></i>
                      <span>Language Management</span>
                    </button>
                    <button onClick={() => onOpenPanel('payout-admin')} className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded">
                      <i className="pi pi-wallet"></i>
                      <span>Auszahlungen</span>
                    </button>
                    <div className="border-t border-gray-600 my-2"></div>
                    <button onClick={() => onOpenPanel('cms-admin')} className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded">
                      <i className="pi pi-file-edit"></i>
                      <span>CMS Admin</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Profile Section at Bottom */}
      <div className="p-4 border-t border-gray-700">
        {!isCollapsed ? (
          <>
            <div className="text-xs text-gray-400 uppercase tracking-wide mb-2">Account</div>

            {/* Credits Display */}
            {isLoggedIn && (
              <div className="mb-3 p-3 bg-gray-900 rounded-lg border border-gray-600">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <i className="pi pi-wallet text-yellow-400"></i>
                    <span className="text-sm text-gray-300">Credits</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-lg font-bold text-yellow-400">{userCredits}</span>
                    {!isDemoMode && (
                      <button
                        onClick={() => onOpenModal?.('plan')}
                        className="text-xs px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                        title="Buy Credits"
                      >
                        <i className="pi pi-plus"></i>
                      </button>
                    )}
                  </div>
                </div>
                {patronType && (
                  <div className="mt-2 pt-2 border-t border-gray-700">
                    <div className="flex items-center space-x-1">
                      <i className="pi pi-star-fill text-purple-400 text-xs"></i>
                      <span className="text-xs text-purple-400 font-semibold">
                        Patron {patronType === 'monthly' ? 'Monthly' : 'Annual'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

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
          <div className="flex flex-col items-center space-y-2">
            {/* Credits Badge in Collapsed Mode */}
            {isLoggedIn && (
              <div className="relative group/credits">
                <div className="w-8 h-8 flex items-center justify-center rounded bg-gray-900 border border-gray-600">
                  <i className="pi pi-wallet text-yellow-400 text-xs"></i>
                </div>
                {/* Popup for credits */}
                <div className="absolute left-full bottom-0 ml-2 w-48 bg-gray-800 border border-gray-600 rounded-lg shadow-xl opacity-0 invisible group-hover/credits:opacity-100 group-hover/credits:visible transition-all duration-200 z-50">
                  <div className="p-3">
                    <div className="text-xs text-gray-400 mb-1">Your Credits</div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-2xl font-bold text-yellow-400">{userCredits}</span>
                      {!isDemoMode && (
                        <button
                          onClick={() => onOpenModal?.('plan')}
                          className="text-xs px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded"
                        >
                          Buy
                        </button>
                      )}
                    </div>
                    {patronType && (
                      <div className="flex items-center space-x-1 mt-2 pt-2 border-t border-gray-700">
                        <i className="pi pi-star-fill text-purple-400 text-xs"></i>
                        <span className="text-xs text-purple-400">
                          Patron {patronType === 'monthly' ? 'Monthly' : 'Annual'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Profile icon with popup menu */}
            <div className="relative group">
              <button className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-700 transition-colors">
                <i className={`pi ${isLoggedIn ? 'pi-user' : 'pi-sign-in'} text-gray-300`} title={isLoggedIn ? userName : t.panelsewnavigationpanel359}></i>
              </button>
              {/* Popup submenu for Profile */}
              <div className="absolute left-full bottom-0 ml-2 w-48 bg-gray-800 border border-gray-600 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="p-2">
                  {isLoggedIn ? (
                    <>
                      <button onClick={() => onOpenModal?.('profile')} className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded">
                        <i className="pi pi-user-edit"></i>
                        <span>{t.newnavigationpanel315}</span>
                      </button>
                      {/* Messaging Button */}
                      {!isDemoMode && (
                        <button onClick={() => window.dispatchEvent(new CustomEvent('openMessaging'))} className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded">
                          <i className="pi pi-envelope"></i>
                          <span>Nachrichten</span>
                        </button>
                      )}
                      {/* 🎯 Hide "Change Plan" in DEMO mode */}
                      {!isDemoMode && (
                        <button onClick={() => onOpenModal?.('plan')} className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded">
                          <i className="pi pi-credit-card"></i>
                          <span>{t.newnavigationpanel320}</span>
                        </button>
                      )}
                      <button onClick={() => window.location.href = '/'} className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded">
                        <i className="pi pi-external-link"></i>
                        <span>{t.newnavigationpanel325}</span>
                      </button>
                      <div className="border-t border-gray-600 my-2"></div>
                      <button onClick={() => {
                        // 🎯 DEMO MODE: Redirect to main site, not demo subdomain
                        if (isDemoMode) {
                          sessionStorage.clear();
                          localStorage.clear();
                          document.cookie = 'remember_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
                          window.location.href = 'https://scoriet.dev';
                          return;
                        }

                        // Normal logout
                        localStorage.setItem('logout_in_progress', 'true');
                        localStorage.removeItem('access_token');
                        localStorage.removeItem('refresh_token');
                        localStorage.removeItem('remember_me');
                        localStorage.removeItem('user');
                        sessionStorage.removeItem('access_token');
                        sessionStorage.removeItem('refresh_token');
                        sessionStorage.removeItem('user');
                        sessionStorage.removeItem('scoriet_wizard_shown_this_session'); // Clear wizard flag on logout
                        document.cookie = 'remember_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
                        setIsLoggedIn(false);
                        setUserName('');
                        window.location.href = '/';
                      }} className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded">
                        <i className="pi pi-sign-out"></i>
                        <span>{t.panelsewnavigationpanel333}</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => onOpenModal?.('login')} className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded">
                        <i className="pi pi-sign-in"></i>
                        <span>Login</span>
                      </button>
                      {/* 🎯 Hide "Register" button in DEMO mode */}
                      {!isDemoMode && (
                        <button onClick={() => onOpenModal?.('register')} className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded">
                          <i className="pi pi-user-plus"></i>
                          <span>Register</span>
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Project Wizard Modal */}
      <ProjectWizardModal
        isOpen={showWizard}
        onClose={() => setShowWizard(false)}
        onSuccess={async (createdProjectId: number) => {
          setShowWizard(false);

          // Reload projects list
          await loadProjects();

          // Find and set the newly created project as selected
          const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token') || sessionStorage.getItem('access_token');
          if (token) {
            try {
              const response = await fetch(`/api/projects/${createdProjectId}`, {
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Accept': 'application/json',
                },
              });

              if (response.ok) {
                const newProject = await response.json();
                setSelectedProject(newProject);
                localStorage.setItem('scoriet_selected_project_id', createdProjectId.toString());
              }
            } catch (err) {
              console.error('Error loading new project:', err);
            }
          }
        }}
      />

      {/* Form Designer Paywall Dialog */}
      <Dialog
        visible={showFormPaywall}
        onHide={() => {
          setShowFormPaywall(false);
          setFormPaywallTarget(null);
        }}
        header={
          <div className="flex items-center gap-2">
            <i className="pi pi-lock text-yellow-500"></i>
            <span>Formular Designer - Premium Feature 💰</span>
          </div>
        }
        style={{ width: '450px' }}
        modal
        closable
      >
        <div className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-400 rounded-lg p-4">
            <p className="text-yellow-800 text-sm mb-2">
              <strong>Der Formular Designer ist ein Premium Feature.</strong>
            </p>
            <p className="text-gray-600 text-sm">
              Schalte den Formular Designer für <strong>50 Credits einmalig</strong> frei und nutze ihn unbegrenzt!
            </p>
          </div>

          {formAccessInfo && (
            <div className="bg-gray-100 rounded-lg p-4 border border-gray-300">
              <div className="flex justify-between items-center text-sm mb-2">
                <span className="text-gray-600">Ihre Credits:</span>
                <span className="text-gray-900 font-bold">{formAccessInfo.credits}</span>
              </div>
              <div className="flex justify-between items-center text-sm mb-2">
                <span className="text-gray-600">Benötigt:</span>
                <span className="text-yellow-600 font-bold">{formAccessInfo.requiredCredits}</span>
              </div>
              <hr className="border-gray-300 my-2" />
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Danach:</span>
                <span className={`font-bold ${formAccessInfo.credits >= formAccessInfo.requiredCredits ? 'text-green-600' : 'text-red-600'}`}>
                  {formAccessInfo.credits >= formAccessInfo.requiredCredits
                    ? formAccessInfo.credits - formAccessInfo.requiredCredits
                    : `${formAccessInfo.requiredCredits - formAccessInfo.credits} fehlen`}
                </span>
              </div>
            </div>
          )}

          {formAccessInfo && formAccessInfo.credits < formAccessInfo.requiredCredits && (
            <div className="bg-red-50 border border-red-400 rounded-lg p-3">
              <p className="text-red-600 text-sm">
                Sie benötigen noch <strong>{formAccessInfo.requiredCredits - formAccessInfo.credits} weitere Credits</strong>.
              </p>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            {formAccessInfo && formAccessInfo.credits >= formAccessInfo.requiredCredits ? (
              <Button
                onClick={handleFormUnlock}
                loading={formPaywallLoading}
                className="flex-1"
                severity="success"
                icon="pi pi-unlock"
                label="Freischalten (50 Credits)"
              />
            ) : (
              <Button
                onClick={handleBuyCredits}
                className="flex-1"
                severity="warning"
                icon="pi pi-shopping-cart"
                label="Credits kaufen"
              />
            )}
            <Button
              onClick={() => {
                setShowFormPaywall(false);
                setFormPaywallTarget(null);
              }}
              severity="secondary"
              icon="pi pi-times"
              label="Abbrechen"
            />
          </div>
        </div>
      </Dialog>

      {/* Plan Modal for buying credits */}
      <PlanModal
        visible={showPlanModal}
        onHide={handlePlanModalClose}
        initialTab={1}
      />
    </div>
  );
}