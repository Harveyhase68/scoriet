// resources/js/Components/Panels/NewNavigationPanel.tsx - Performance Metrics included
import React, { useState, useCallback } from 'react';
import { TieredMenu } from 'primereact/tieredmenu';
import { MenuItem } from 'primereact/menuitem';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { NavigationPanelProps } from '@/types';
import { AuthModalType } from '@/Components/AuthModals/AuthModalManager';
import { useProject } from '@/contexts/ProjectContext';
import { useToast } from '@/contexts/ToastContext';
import { useTranslation, SupportedLanguage, getStoredLanguage } from '@/i18n';
import ProjectWizardModal from '@/Components/ProjectWizardModal';
import PlanModal from '@/Components/AuthModals/PlanModal';
import { useTheme } from '@/contexts/ThemeContext';
import { apiClient } from '@/lib/api';

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
  const { colors } = useTheme();
  const toast = useToast();
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [userName, setUserName] = useState<string>('');
  const [userType, setUserType] = useState<string>('');
  const [userCredits, setUserCredits] = useState<number>(0);
  const [patronType, setPatronType] = useState<string | null>(null);
  const [isInnerCore, setIsInnerCore] = useState<boolean>(false);
  // System admins implicitly have all Inner-Core permissions (matches the
  // backend check in TemplateReviewController). Without this derived flag the
  // "Code Review" menu entry would only appear for users with is_inner_core=1
  // even though the backend allows admins to access the review routes.
  const canReviewTemplates = isInnerCore || userType === 'system';
  const [showWizard, setShowWizard] = useState<boolean>(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuCloseTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // Collapsed menu handlers - state-based to prevent overlapping menus
  // Works on both desktop (hover) and mobile (touch/click)
  const handleMenuEnter = (menuId: string) => {
    if (menuCloseTimer.current) { clearTimeout(menuCloseTimer.current); menuCloseTimer.current = null; }
    setOpenMenuId(menuId);
  };
  const handleMenuLeave = () => {
    menuCloseTimer.current = setTimeout(() => setOpenMenuId(null), 150);
  };

  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    // Load from localStorage, default to true (collapsed)
    const saved = localStorage.getItem('navigation_collapsed');
    return saved === null ? true : JSON.parse(saved);
  });

  // Helper: blur active element and close collapsed menu after clicking a menu item
  const blurAndRun = useCallback((fn: () => void) => {
    return () => {
      fn();
      setOpenMenuId(null);
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
    };
  }, []);

  // Form Designer Paywall States
  const [showFormPaywall, setShowFormPaywall] = useState(false);
  const [formPaywallTarget, setFormPaywallTarget] = useState<'formset-management' | 'form-designer' | 'form-layout-designer' | 'report-management' | 'report-pattern-designer' | 'report-layout-designer' | null>(null);
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

  // Registration status (for showing/hiding invite management)
  const [registrationOpen, setRegistrationOpen] = useState<boolean>(true);

  // Helper function to update auth status
  const updateAuthStatus = async () => {
    const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');

    if (token) {
      try {
        // apiClient.get() handles 401 transparently (refresh + retry, or
        // clean logout via handleAuthError). We only land in catch on a
        // final auth failure or transient error.
        const user = await apiClient.get('/user');
        setIsLoggedIn(true);
        setUserName(user.name || user.email);
        setUserType(user.user_type || '');
        setUserCredits(user.credits || 0);
        setPatronType(user.patron_type || null);
        setIsInnerCore(user.is_inner_core || false);
        return true;
      } catch (err: any) {
        const isAuthFailure = err?.message?.includes('Authentication') ||
                              err?.response?.status === 401;
        // Sync local React state regardless: either auth has failed (state
        // must reflect logout) or a transient server error happened (we
        // can't show stale credit data with confidence).
        setIsLoggedIn(false);
        setUserName('');
        setUserType('');
        setUserCredits(0);
        setPatronType(null);
        setIsInnerCore(false);
        if (isAuthFailure) {
          window.dispatchEvent(new Event('storage'));
        }
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
  const checkFormDesignerAccess = useCallback(async (target: 'formset-management' | 'form-designer' | 'form-layout-designer' | 'report-management' | 'report-pattern-designer' | 'report-layout-designer') => {
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

      try {
        const data = await apiClient.get('/form-designer/access');
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
      } catch {
        // Error - try to open panel anyway (let the panel handle errors)
        onOpenPanel(target);
        setFormPaywallLoading(false);
      }
    } catch (error) {
      console.error(t.newnavigationpanel168, error);
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

      try {
        await apiClient.post('/form-designer/unlock');
        // Unlock successful - update credits and open panel
        setShowFormPaywall(false);
        if (formPaywallTarget) {
          onOpenPanel(formPaywallTarget);
        }
        // Trigger credits update
        window.dispatchEvent(new Event('creditsChanged'));
        updateAuthStatus();
      } catch (err: any) {
        const data = err?.response?.data;
        alert(data?.message || t.newnavigationpanel213);
      }
    } catch (error) {
      console.error(t.newnavigationpanel216, error);
      alert(t.newnavigationpanel217);
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

  // Fetch registration status (for showing/hiding invite management menu)
  React.useEffect(() => {
    const fetchRegistrationStatus = async () => {
      try {
        const response = await fetch('/api/registration/status', {
          headers: {
            'Accept': 'application/json',
          },
        });
        if (response.ok) {
          const data = await response.json();
          setRegistrationOpen(data.registration_open ?? true);
        }
      } catch {
        // If fetch fails, assume registration is open (hide invite management)
        setRegistrationOpen(true);
      }
    };

    fetchRegistrationStatus();
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
      label: t.newnavigationpanel335,
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
          label: t.navAgileMethod || t.newnavigationpanel390,
          icon: 'pi pi-chart-line',
          items: [
            {
              label: t.newnavigationpanel357 || t.newnavigationpanel394,
              icon: 'pi pi-th-large',
              command: () => onOpenPanel('kanban-board')
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
    // ── New top-level: "Vorlagen" — unifies Code / Forms / Reports under
    // a consistent Vorlage → Profil → Anpassung structure.
    {
      label: t.menu_vorlagen,
      icon: 'pi pi-folder',
      items: [
        // ── Code ──
        {
          label: t.menu_vorlagen_code,
          icon: 'pi pi-code',
          items: [
            {
              label: t.menu_vorlagen_code_vorlagen,
              icon: 'pi pi-list',
              items: [
                {
                  label: t.menu_code_vorlagen_verwaltung,
                  icon: 'pi pi-list',
                  command: () => onOpenPanel('template-management'),
                },
                {
                  label: t.menu_code_vorlagen_shop,
                  icon: 'pi pi-shopping-cart',
                  command: () => onOpenPanel('template-store'),
                },
                ...(canReviewTemplates ? [{
                  label: t.menu_code_vorlagen_review,
                  icon: 'pi pi-star-fill',
                  command: () => onOpenPanel('template-review'),
                }] : []),
                { separator: true },
                {
                  label: t.menu_code_vorlagen_schema_deps,
                  icon: 'pi pi-link',
                  command: () => onOpenPanel('template-db-schema-dependencies'),
                },
              ],
            },
            {
              label: t.menu_vorlagen_code_profile,
              icon: 'pi pi-clock',
              // Coming-soon placeholder — clickable, shows an info toast.
              command: () => {
                toast.showInfo(t.menu_coming_soon_code_profile);
              },
              className: 'opacity-60',
            },
            {
              label: t.menu_vorlagen_code_anpassungen,
              icon: 'pi pi-sliders-h',
              command: () => onOpenPanel('code-adjustments'),
            },
          ],
        },
        // ── Formulare ──
        {
          label: t.menu_vorlagen_formulare,
          icon: 'pi pi-window-maximize',
          items: [
            {
              label: t.menu_vorlagen_formulare_vorlagen,
              icon: 'pi pi-list',
              items: [
                {
                  label: t.menu_form_vorlagen_verwaltung,
                  icon: 'pi pi-list',
                  command: () => checkFormDesignerAccess('formset-management'),
                },
                {
                  label: t.menu_form_vorlagen_designer,
                  icon: 'pi pi-pencil',
                  command: () => checkFormDesignerAccess('form-designer'),
                },
              ],
            },
            {
              label: t.menu_vorlagen_formulare_profil,
              icon: 'pi pi-th-large',
              items: [
                {
                  label: t.menu_form_profil_designer,
                  icon: 'pi pi-th-large',
                  command: () => checkFormDesignerAccess('form-layout-designer'),
                },
              ],
            },
            {
              label: t.fieldassignmentpanel_title,
              icon: 'pi pi-sliders-h',
              command: () => onOpenPanel('field-assignments'),
            },
          ],
        },
        // ── Reports ──
        {
          label: t.menu_vorlagen_reports,
          icon: 'pi pi-print',
          items: [
            {
              label: t.menu_vorlagen_reports_vorlagen,
              icon: 'pi pi-list',
              items: [
                {
                  label: t.menu_report_vorlagen_verwaltung,
                  icon: 'pi pi-list',
                  command: () => checkFormDesignerAccess('report-management'),
                },
                {
                  label: t.menu_report_vorlagen_designer,
                  icon: 'pi pi-pencil',
                  command: () => checkFormDesignerAccess('report-pattern-designer'),
                },
              ],
            },
            {
              label: t.menu_vorlagen_reports_profil,
              icon: 'pi pi-th-large',
              items: [
                {
                  label: t.menu_report_profil_designer,
                  icon: 'pi pi-th-large',
                  command: () => checkFormDesignerAccess('report-layout-designer'),
                },
              ],
            },
          ],
        },
      ],
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
          label: t.fieldassignmentpanel_title,
          icon: 'pi pi-sliders-h',
          command: () => onOpenPanel('field-assignments')
        },
        {
          label: t.reportfieldassignmentpanel_title,
          icon: 'pi pi-sliders-h',
          command: () => onOpenPanel('report-field-assignments')
        },
        {
          label: t.newnavigationpanel472,
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
          label: t.index863,
          icon: 'pi pi-list',
          command: () => onOpenPanel('deployment-log')
        },
        // "Code adjustments" was moved to Vorlagen → Code → Anpassungen
        ...(userType === 'system' ? [
          {
            separator: true
          },
          {
            label: t.newnavigationpanel529,
            icon: 'pi pi-server',
            command: () => onOpenPanel('cache-debug')
          }
        ] : [])
      ]
    },
    ...(userType === 'system' ? [
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
            label: t.newnavigationpanel552,
            icon: 'pi pi-wallet',
            command: () => onOpenPanel('payout-admin')
          },
          {
            label: t.newnavigationpanel557,
            icon: 'pi pi-chart-line',
            command: () => onOpenPanel('performance-metrics')
          },
          // Show Invite Management only for system user when registration is closed
          ...(userType === 'system' && !registrationOpen ? [{
            label: t.newnavigationpanel563,
            icon: 'pi pi-user-plus',
            command: () => onOpenPanel('invite-management')
          }] : []),
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
        // Messaging button (always shown, also in demo mode)
        {
          label: t.newnavigationpanel584,
          icon: 'pi pi-envelope',
          command: () => window.dispatchEvent(new CustomEvent('openMessaging'))
        },
        // 🎯 "Change Plan" - greyed out in DEMO mode but still visible
        {
          label: t.panelsewnavigationpanel320,
          icon: 'pi pi-credit-card',
          disabled: isDemoMode,
          className: isDemoMode ? 'opacity-50 cursor-not-allowed' : '',
          command: () => !isDemoMode && onOpenModal?.('plan')
        },
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
    <div
      className={`${isCollapsed ? 'w-16' : 'w-auto whitespace-nowrap'} flex flex-col h-full transition-all duration-300`}
      style={{
        backgroundColor: colors.bgSecondary,
        borderRight: `1px solid ${colors.borderPrimary}`
      }}
    >
      {/* Toggle + Close Buttons */}
      <div
        className="p-3 flex items-center justify-between gap-1"
        style={{ borderBottom: `1px solid ${colors.borderPrimary}` }}
      >
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`p-2 rounded transition-colors ${isCollapsed ? 'w-full' : 'flex-1'} flex justify-center nav-hover-btn`}
          title={isCollapsed ? t.newnavigationpanel676 : t.panelsewnavigationpanel384}
        >
          <i className={`pi ${isCollapsed ? 'pi-angle-right' : 'pi-angle-left'}`} style={{ color: colors.textMuted }}></i>
        </button>
        {!isCollapsed && (
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('closeNavPanel'))}
            className="p-2 rounded transition-colors flex-shrink-0 nav-hover-btn"
            title={t.topbarToggleNav || 'Close Navigation'}
          >
            <i className="pi pi-times" style={{ color: colors.textMuted }}></i>
          </button>
        )}
      </div>

      {/* Navigation Menu */}
      <div className="flex-1 p-4">
        {!isCollapsed ? (
          <div className="mb-4">
            <div className="text-xs uppercase tracking-wide mb-2" style={{ color: colors.textMuted }}>{t.newnavigationpanel686}</div>
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
                className="w-8 h-8 flex items-center justify-center rounded nav-hover-btn transition-colors"
                title={t.panelsewnavigationpanel112}
              >
                <i className="pi pi-arrow-left" style={{ color: colors.textSecondary }}></i>
              </button>
            </div>
            <div className="relative group">
              <button
                onClick={() => onOpenPanel('home')}
                className="w-8 h-8 flex items-center justify-center rounded nav-hover-btn transition-colors"
                title={t.panelsewnavigationpanel120}
              >
                <i className="pi pi-home" style={{ color: colors.textSecondary }}></i>
              </button>
            </div>
            <div className="relative group">
              <button
                onClick={() => setShowWizard(true)}
                className="w-8 h-8 flex items-center justify-center rounded nav-hover-btn transition-colors"
                title={t.newnavigationpanel723}
              >
                <i className="pi pi-sparkles" style={{ color: colors.textSecondary }}></i>
              </button>
            </div>
            {/* Icon-only navigation with TieredMenu - only 3 main categories */}
            <div className="relative" onMouseEnter={() => handleMenuEnter('project')} onMouseLeave={handleMenuLeave}>
              <button className="w-8 h-8 flex items-center justify-center rounded nav-hover-btn transition-colors" onClick={() => setOpenMenuId(openMenuId === 'project' ? null : 'project')}>
                <i className="pi pi-briefcase nav-icon-color" title={t.manageteammodal316}></i>
              </button>
              {/* Popup submenu for Project */}
              <div className={`absolute left-full top-0 ml-2 w-auto whitespace-nowrap nav-popup-menu rounded-lg shadow-xl transition-all duration-200 z-50 ${openMenuId === 'project' ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
                <div className="p-2">
                  <button onClick={blurAndRun(() => onOpenPanel('project'))} className="w-full flex items-center space-x-2 px-3 py-2 text-sm nav-icon-color hover:text-white nav-hover-btn rounded">
                    <i className="pi pi-home"></i>
                    <span>{t.newnavigationpanel133}</span>
                  </button>

                  <div className="relative group/settings">
                    <button className="w-full flex items-center space-x-2 px-3 py-2 text-sm nav-icon-color hover:text-white nav-hover-btn rounded">
                      <i className="pi pi-cog"></i>
                      <span>{t.newnavigationpanel138}</span>
                      <i className="pi pi-angle-right ml-auto text-xs"></i>
                    </button>
                    {/* Sub-submenu for Settings */}
                    <div className="absolute left-full top-0 ml-1 w-auto whitespace-nowrap nav-popup-menu rounded-lg shadow-xl opacity-0 invisible group-hover/settings:opacity-100 group-hover/settings:visible transition-all duration-200 z-50">
                      <div className="p-2">
                        <button onClick={blurAndRun(() => {
                          if (selectedProject) {
                            onOpenPanel('project-settings', {
                              title: `${t.newnavigationpanel142} (${selectedProject.name})`
                            });
                          } else {
                            onOpenPanel('project');
                          }
                        })} className="w-full flex items-center space-x-2 px-3 py-2 text-sm nav-icon-color hover:text-white nav-hover-btn rounded">
                          <i className="pi pi-sliders-h"></i>
                          <span>{t.newnavigationpanel142}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="border-t nav-separator my-2"></div>

                  <div className="relative group/teams">
                    <button className="w-full flex items-center space-x-2 px-3 py-2 text-sm nav-icon-color hover:text-white nav-hover-btn rounded">
                      <i className="pi pi-users"></i>
                      <span>{t.newnavigationpanel770}</span>
                      <i className="pi pi-angle-right ml-auto text-xs"></i>
                    </button>
                    {/* Sub-submenu for Teams */}
                    <div className="absolute left-full top-0 ml-1 w-auto whitespace-nowrap nav-popup-menu rounded-lg shadow-xl opacity-0 invisible group-hover/teams:opacity-100 group-hover/teams:visible transition-all duration-200 z-50">
                      <div className="p-2">
                        <button onClick={blurAndRun(() => onOpenPanel('team-management'))} className="w-full flex items-center space-x-2 px-3 py-2 text-sm nav-icon-color hover:text-white nav-hover-btn rounded">
                          <i className="pi pi-cog"></i>
                          <span>{t.newnavigationpanel778}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="border-t nav-separator my-2"></div>

                  {/* Agile Methods submenu */}
                  <div className="relative group/agile">
                    <button className="w-full flex items-center space-x-2 px-3 py-2 text-sm nav-icon-color hover:text-white nav-hover-btn rounded">
                      <i className="pi pi-chart-line"></i>
                      <span>{t.navAgileMethod}</span>
                      <i className="pi pi-angle-right ml-auto text-xs"></i>
                    </button>
                    {/* Sub-submenu for Agile Methods */}
                    <div className="absolute left-full top-0 ml-1 w-auto whitespace-nowrap nav-popup-menu rounded-lg shadow-xl opacity-0 invisible group-hover/agile:opacity-100 group-hover/agile:visible transition-all duration-200 z-50">
                      <div className="p-2">
                        <button onClick={blurAndRun(() => onOpenPanel('kanban-board'))} className="w-full flex items-center space-x-2 px-3 py-2 text-sm nav-icon-color hover:text-white nav-hover-btn rounded">
                          <i className="pi pi-th-large"></i>
                          <span>{t.newnavigationpanel357}</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="border-t nav-separator my-2"></div>
                  <button onClick={blurAndRun(() => onOpenPanel('my-applications'))} className="w-full flex items-center space-x-2 px-3 py-2 text-sm nav-icon-color hover:text-white nav-hover-btn rounded">
                    <i className="pi pi-send"></i>
                    <span>{t.panelsewnavigationpanel211}</span>
                  </button>
                  <button onClick={blurAndRun(() => onOpenPanel('public-projects'))} className="w-full flex items-center space-x-2 px-3 py-2 text-sm nav-icon-color hover:text-white nav-hover-btn rounded">
                    <i className="pi pi-globe"></i>
                    <span>{t.panelsewnavigationpanel216}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Vorlagen - Top Level (Code / Formulare / Reports) */}
            <div className="relative" onMouseEnter={() => handleMenuEnter('vorlagen')} onMouseLeave={handleMenuLeave}>
              <button className="w-8 h-8 flex items-center justify-center rounded nav-hover-btn transition-colors" onClick={() => setOpenMenuId(openMenuId === 'vorlagen' ? null : 'vorlagen')}>
                <i className="pi pi-folder nav-icon-color" title={t.menu_vorlagen}></i>
              </button>
              {/* Popup submenu for Vorlagen */}
              <div className={`absolute left-full top-0 ml-2 w-auto whitespace-nowrap nav-popup-menu rounded-lg shadow-xl transition-all duration-200 z-50 ${openMenuId === 'vorlagen' ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
                <div className="p-2">
                  {/* ── Code ── */}
                  <div className="relative group/vcode">
                    <button className="w-full flex items-center space-x-2 px-3 py-2 text-sm nav-icon-color hover:text-white nav-hover-btn rounded">
                      <i className="pi pi-code"></i>
                      <span>{t.menu_vorlagen_code}</span>
                      <i className="pi pi-angle-right ml-auto text-xs"></i>
                    </button>
                    <div className="absolute left-full top-0 ml-1 w-auto whitespace-nowrap nav-popup-menu rounded-lg shadow-xl opacity-0 invisible group-hover/vcode:opacity-100 group-hover/vcode:visible transition-all duration-200 z-50">
                      <div className="p-2">
                        {/* Code → Vorlagen */}
                        <div className="relative group/vcodev">
                          <button className="w-full flex items-center space-x-2 px-3 py-2 text-sm nav-icon-color hover:text-white nav-hover-btn rounded">
                            <i className="pi pi-list"></i>
                            <span>{t.menu_vorlagen_code_vorlagen}</span>
                            <i className="pi pi-angle-right ml-auto text-xs"></i>
                          </button>
                          <div className="absolute left-full top-0 ml-1 w-auto whitespace-nowrap nav-popup-menu rounded-lg shadow-xl opacity-0 invisible group-hover/vcodev:opacity-100 group-hover/vcodev:visible transition-all duration-200 z-50">
                            <div className="p-2">
                              <button onClick={blurAndRun(() => onOpenPanel('template-management'))} className="w-full flex items-center space-x-2 px-3 py-2 text-sm nav-icon-color hover:text-white nav-hover-btn rounded">
                                <i className="pi pi-list"></i>
                                <span>{t.menu_code_vorlagen_verwaltung}</span>
                              </button>
                              <button onClick={blurAndRun(() => onOpenPanel('template-store'))} className="w-full flex items-center space-x-2 px-3 py-2 text-sm nav-icon-color hover:text-white nav-hover-btn rounded">
                                <i className="pi pi-shopping-cart"></i>
                                <span>{t.menu_code_vorlagen_shop}</span>
                              </button>
                              {canReviewTemplates && (
                                <button onClick={blurAndRun(() => onOpenPanel('template-review'))} className="w-full flex items-center space-x-2 px-3 py-2 text-sm nav-icon-color hover:text-white nav-hover-btn rounded">
                                  <i className="pi pi-star-fill text-yellow-400"></i>
                                  <span>{t.menu_code_vorlagen_review}</span>
                                </button>
                              )}
                              <div className="border-t nav-separator my-2"></div>
                              <button onClick={blurAndRun(() => onOpenPanel('template-db-schema-dependencies'))} className="w-full flex items-center space-x-2 px-3 py-2 text-sm nav-icon-color hover:text-white nav-hover-btn rounded">
                                <i className="pi pi-link"></i>
                                <span>{t.menu_code_vorlagen_schema_deps}</span>
                              </button>
                            </div>
                          </div>
                        </div>
                        {/* Code → Profile (Coming Soon) */}
                        <button
                          onClick={blurAndRun(() => window.alert(`${t.menu_coming_soon_title}\n\n${t.menu_coming_soon_code_profile}`))}
                          className="w-full flex items-center space-x-2 px-3 py-2 text-sm nav-icon-color hover:text-white nav-hover-btn rounded opacity-60"
                        >
                          <i className="pi pi-clock"></i>
                          <span>{t.menu_vorlagen_code_profile}</span>
                        </button>
                        {/* Code → Anpassungen */}
                        <button onClick={blurAndRun(() => onOpenPanel('code-adjustments'))} className="w-full flex items-center space-x-2 px-3 py-2 text-sm nav-icon-color hover:text-white nav-hover-btn rounded">
                          <i className="pi pi-sliders-h"></i>
                          <span>{t.menu_vorlagen_code_anpassungen}</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* ── Formulare ── */}
                  <div className="relative group/vform">
                    <button className="w-full flex items-center space-x-2 px-3 py-2 text-sm nav-icon-color hover:text-white nav-hover-btn rounded">
                      <i className="pi pi-window-maximize"></i>
                      <span>{t.menu_vorlagen_formulare}</span>
                      <i className="pi pi-angle-right ml-auto text-xs"></i>
                    </button>
                    <div className="absolute left-full top-0 ml-1 w-auto whitespace-nowrap nav-popup-menu rounded-lg shadow-xl opacity-0 invisible group-hover/vform:opacity-100 group-hover/vform:visible transition-all duration-200 z-50">
                      <div className="p-2">
                        {/* Formulare → Vorlagen */}
                        <div className="relative group/vformv">
                          <button className="w-full flex items-center space-x-2 px-3 py-2 text-sm nav-icon-color hover:text-white nav-hover-btn rounded">
                            <i className="pi pi-list"></i>
                            <span>{t.menu_vorlagen_formulare_vorlagen}</span>
                            <i className="pi pi-angle-right ml-auto text-xs"></i>
                          </button>
                          <div className="absolute left-full top-0 ml-1 w-auto whitespace-nowrap nav-popup-menu rounded-lg shadow-xl opacity-0 invisible group-hover/vformv:opacity-100 group-hover/vformv:visible transition-all duration-200 z-50">
                            <div className="p-2">
                              <button onClick={blurAndRun(() => checkFormDesignerAccess('formset-management'))} className="w-full flex items-center space-x-2 px-3 py-2 text-sm nav-icon-color hover:text-white nav-hover-btn rounded">
                                <i className="pi pi-list"></i>
                                <span>{t.menu_form_vorlagen_verwaltung}</span>
                              </button>
                              <button onClick={blurAndRun(() => checkFormDesignerAccess('form-designer'))} className="w-full flex items-center space-x-2 px-3 py-2 text-sm nav-icon-color hover:text-white nav-hover-btn rounded">
                                <i className="pi pi-pencil"></i>
                                <span>{t.menu_form_vorlagen_designer}</span>
                              </button>
                            </div>
                          </div>
                        </div>
                        {/* Formulare → Profil */}
                        <div className="relative group/vformp">
                          <button className="w-full flex items-center space-x-2 px-3 py-2 text-sm nav-icon-color hover:text-white nav-hover-btn rounded">
                            <i className="pi pi-th-large"></i>
                            <span>{t.menu_vorlagen_formulare_profil}</span>
                            <i className="pi pi-angle-right ml-auto text-xs"></i>
                          </button>
                          <div className="absolute left-full top-0 ml-1 w-auto whitespace-nowrap nav-popup-menu rounded-lg shadow-xl opacity-0 invisible group-hover/vformp:opacity-100 group-hover/vformp:visible transition-all duration-200 z-50">
                            <div className="p-2">
                              <button onClick={blurAndRun(() => checkFormDesignerAccess('form-layout-designer'))} className="w-full flex items-center space-x-2 px-3 py-2 text-sm nav-icon-color hover:text-white nav-hover-btn rounded">
                                <i className="pi pi-th-large"></i>
                                <span>{t.menu_form_profil_designer}</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ── Reports ── */}
                  <div className="relative group/vrep">
                    <button className="w-full flex items-center space-x-2 px-3 py-2 text-sm nav-icon-color hover:text-white nav-hover-btn rounded">
                      <i className="pi pi-print"></i>
                      <span>{t.menu_vorlagen_reports}</span>
                      <i className="pi pi-angle-right ml-auto text-xs"></i>
                    </button>
                    <div className="absolute left-full top-0 ml-1 w-auto whitespace-nowrap nav-popup-menu rounded-lg shadow-xl opacity-0 invisible group-hover/vrep:opacity-100 group-hover/vrep:visible transition-all duration-200 z-50">
                      <div className="p-2">
                        {/* Reports → Vorlagen */}
                        <div className="relative group/vrepv">
                          <button className="w-full flex items-center space-x-2 px-3 py-2 text-sm nav-icon-color hover:text-white nav-hover-btn rounded">
                            <i className="pi pi-list"></i>
                            <span>{t.menu_vorlagen_reports_vorlagen}</span>
                            <i className="pi pi-angle-right ml-auto text-xs"></i>
                          </button>
                          <div className="absolute left-full top-0 ml-1 w-auto whitespace-nowrap nav-popup-menu rounded-lg shadow-xl opacity-0 invisible group-hover/vrepv:opacity-100 group-hover/vrepv:visible transition-all duration-200 z-50">
                            <div className="p-2">
                              <button onClick={blurAndRun(() => checkFormDesignerAccess('report-management'))} className="w-full flex items-center space-x-2 px-3 py-2 text-sm nav-icon-color hover:text-white nav-hover-btn rounded">
                                <i className="pi pi-list"></i>
                                <span>{t.menu_report_vorlagen_verwaltung}</span>
                              </button>
                              <button onClick={blurAndRun(() => checkFormDesignerAccess('report-pattern-designer'))} className="w-full flex items-center space-x-2 px-3 py-2 text-sm nav-icon-color hover:text-white nav-hover-btn rounded">
                                <i className="pi pi-pencil"></i>
                                <span>{t.menu_report_vorlagen_designer}</span>
                              </button>
                            </div>
                          </div>
                        </div>
                        {/* Reports → Profil */}
                        <div className="relative group/vrepp">
                          <button className="w-full flex items-center space-x-2 px-3 py-2 text-sm nav-icon-color hover:text-white nav-hover-btn rounded">
                            <i className="pi pi-th-large"></i>
                            <span>{t.menu_vorlagen_reports_profil}</span>
                            <i className="pi pi-angle-right ml-auto text-xs"></i>
                          </button>
                          <div className="absolute left-full top-0 ml-1 w-auto whitespace-nowrap nav-popup-menu rounded-lg shadow-xl opacity-0 invisible group-hover/vrepp:opacity-100 group-hover/vrepp:visible transition-all duration-200 z-50">
                            <div className="p-2">
                              <button onClick={blurAndRun(() => checkFormDesignerAccess('report-layout-designer'))} className="w-full flex items-center space-x-2 px-3 py-2 text-sm nav-icon-color hover:text-white nav-hover-btn rounded">
                                <i className="pi pi-th-large"></i>
                                <span>{t.menu_report_profil_designer}</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative" onMouseEnter={() => handleMenuEnter('database')} onMouseLeave={handleMenuLeave}>
              <button className="w-8 h-8 flex items-center justify-center rounded nav-hover-btn transition-colors" onClick={() => setOpenMenuId(openMenuId === 'database' ? null : 'database')}>
                <i className="pi pi-database nav-icon-color" title={t.panelsewnavigationpanel223}></i>
              </button>
              {/* Popup submenu for Database */}
              <div className={`absolute left-full top-0 ml-2 w-auto whitespace-nowrap nav-popup-menu rounded-lg shadow-xl transition-all duration-200 z-50 ${openMenuId === 'database' ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
                <div className="p-2">
                  <button onClick={blurAndRun(() => onOpenPanel('database-management'))} className="w-full flex items-center space-x-2 px-3 py-2 text-sm nav-icon-color hover:text-white nav-hover-btn rounded">
                    <i className="pi pi-cog"></i>
                    <span>{t.panelsewnavigationpanel540}</span>
                  </button>
                  <button onClick={blurAndRun(() => onOpenPanel('t2'))} className="w-full flex items-center space-x-2 px-3 py-2 text-sm nav-icon-color hover:text-white nav-hover-btn rounded">
                    <i className="pi pi-window-maximize"></i>
                    <span>{t.panelsewnavigationpanel544}</span>
                  </button>
                  <button onClick={blurAndRun(() => onOpenPanel('schema-translation'))} className="w-full flex items-center space-x-2 px-3 py-2 text-sm nav-icon-color hover:text-white nav-hover-btn rounded">
                    <i className="pi pi-language"></i>
                    <span>{t.panelsewnavigationpanel548}</span>
                  </button>
                  <button onClick={blurAndRun(() => onOpenPanel('field-assignments'))} className="w-full flex items-center space-x-2 px-3 py-2 text-sm nav-icon-color hover:text-white nav-hover-btn rounded">
                    <i className="pi pi-sliders-h"></i>
                    <span>{t.fieldassignmentpanel_title}</span>
                  </button>
                  <button onClick={blurAndRun(() => onOpenPanel('report-field-assignments'))} className="w-full flex items-center space-x-2 px-3 py-2 text-sm nav-icon-color hover:text-white nav-hover-btn rounded">
                    <i className="pi pi-sliders-h"></i>
                    <span>{t.reportfieldassignmentpanel_title}</span>
                  </button>
                  <button onClick={blurAndRun(() => onOpenPanel('query-builder'))} className="w-full flex items-center space-x-2 px-3 py-2 text-sm nav-icon-color hover:text-white nav-hover-btn rounded">
                    <i className="pi pi-sync"></i>
                    <span>{t.newnavigationpanel879}</span>
                  </button>
                  <div className="border-t nav-separator my-2"></div>
                  <button onClick={blurAndRun(() => { if (onOpenSqlImport) onOpenSqlImport(); })} className="w-full flex items-center space-x-2 px-3 py-2 text-sm nav-icon-color hover:text-white nav-hover-btn rounded">
                    <i className="pi pi-upload"></i>
                    <span>{t.panelsewnavigationpanel246}</span>
                  </button>
                  <button onClick={blurAndRun(() => { if (onOpenDatabaseExport) onOpenDatabaseExport(); })} className="w-full flex items-center space-x-2 px-3 py-2 text-sm nav-icon-color hover:text-white nav-hover-btn rounded">
                    <i className="pi pi-download"></i>
                    <span>{t.panelsewnavigationpanel251}</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="relative" onMouseEnter={() => handleMenuEnter('generator')} onMouseLeave={handleMenuLeave}>
              <button className="w-8 h-8 flex items-center justify-center rounded nav-hover-btn transition-colors" onClick={() => setOpenMenuId(openMenuId === 'generator' ? null : 'generator')}>
                <i className="pi pi-wrench nav-icon-color" title={t.panelsewnavigationpanel258}></i>
              </button>
              {/* Popup submenu for Generator */}
              <div className={`absolute left-full top-0 ml-2 w-auto whitespace-nowrap nav-popup-menu rounded-lg shadow-xl transition-all duration-200 z-50 ${openMenuId === 'generator' ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
                <div className="p-2">
                  <button onClick={blurAndRun(() => onOpenPanel('debug-manual-generator'))} className="w-full flex items-center space-x-2 px-3 py-2 text-sm nav-icon-color hover:text-white nav-hover-btn rounded">
                    <i className="pi pi-wrench"></i>
                    <span>{t.newnavigationpanel913}</span>
                  </button>
                  <button onClick={blurAndRun(() => onOpenPanel('code-generation'))} className="w-full flex items-center space-x-2 px-3 py-2 text-sm nav-icon-color hover:text-white nav-hover-btn rounded">
                    <i className="pi pi-play"></i>
                    <span>{t.panelsewnavigationpanel576}</span>
                  </button>
                  <button onClick={blurAndRun(() => onOpenPanel('deployment-log'))} className="w-full flex items-center space-x-2 px-3 py-2 text-sm nav-icon-color hover:text-white nav-hover-btn rounded">
                    <i className="pi pi-list"></i>
                    <span>{t.index863}</span>
                  </button>
                  {userType === 'system' && (
                    <>
                      <div className="border-t nav-separator my-2"></div>
                      <button onClick={blurAndRun(() => onOpenPanel('cache-debug'))} className="w-full flex items-center space-x-2 px-3 py-2 text-sm nav-icon-color hover:text-white nav-hover-btn rounded">
                        <i className="pi pi-server"></i>
                        <span>{t.newnavigationpanel919}</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            {userType === 'system' && (
              <div className="relative" onMouseEnter={() => handleMenuEnter('admin')} onMouseLeave={handleMenuLeave}>
                <button className="w-8 h-8 flex items-center justify-center rounded nav-hover-btn transition-colors" onClick={() => setOpenMenuId(openMenuId === 'admin' ? null : 'admin')}>
                  <i className="pi pi-cog nav-icon-color" title={t.panelsewnavigationpanel281}></i>
                </button>
                {/* Popup submenu for Administration */}
                <div className={`absolute left-full top-0 ml-2 w-auto whitespace-nowrap nav-popup-menu rounded-lg shadow-xl transition-all duration-200 z-50 ${openMenuId === 'admin' ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
                  <div className="p-2">
                    <button onClick={blurAndRun(() => onOpenPanel('system-settings'))} className="w-full flex items-center space-x-2 px-3 py-2 text-sm nav-icon-color hover:text-white nav-hover-btn rounded">
                      <i className="pi pi-cog"></i>
                      <span>{t.newnavigationpanel937}</span>
                    </button>
                    <button onClick={blurAndRun(() => onOpenPanel('language-management'))} className="w-full flex items-center space-x-2 px-3 py-2 text-sm nav-icon-color hover:text-white nav-hover-btn rounded">
                      <i className="pi pi-globe"></i>
                      <span>{t.newnavigationpanel941}</span>
                    </button>
                    <button onClick={blurAndRun(() => onOpenPanel('payout-admin'))} className="w-full flex items-center space-x-2 px-3 py-2 text-sm nav-icon-color hover:text-white nav-hover-btn rounded">
                      <i className="pi pi-wallet"></i>
                      <span>{t.newnavigationpanel945}</span>
                    </button>
                    <button onClick={blurAndRun(() => onOpenPanel('performance-metrics'))} className="w-full flex items-center space-x-2 px-3 py-2 text-sm nav-icon-color hover:text-white nav-hover-btn rounded">
                      <i className="pi pi-chart-line"></i>
                      <span>{t.newnavigationpanel949}</span>
                    </button>
                    {/* Show Invite Management only for system user when registration is closed */}
                    {userType === 'system' && !registrationOpen && (
                      <button onClick={blurAndRun(() => onOpenPanel('invite-management'))} className="w-full flex items-center space-x-2 px-3 py-2 text-sm nav-icon-color hover:text-white nav-hover-btn rounded">
                        <i className="pi pi-user-plus"></i>
                        <span>{t.newnavigationpanel955}</span>
                      </button>
                    )}
                    <div className="border-t nav-separator my-2"></div>
                    <button onClick={blurAndRun(() => onOpenPanel('cms-admin'))} className="w-full flex items-center space-x-2 px-3 py-2 text-sm nav-icon-color hover:text-white nav-hover-btn rounded">
                      <i className="pi pi-file-edit"></i>
                      <span>{t.newnavigationpanel961}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Profile Section at Bottom */}
      <div className="p-4 border-t nav-separator">
        {!isCollapsed ? (
          <>
            <div className="text-xs uppercase tracking-wide mb-2" style={{ color: colors.textMuted }}>{t.newnavigationpanel985}</div>

            {/* Credits Display */}
            {isLoggedIn && (
              <div className="mb-3 p-3 rounded-lg nav-credits-box">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <i className="pi pi-wallet" style={{ color: colors.warningText }}></i>
                    <span className="text-sm" style={{ color: colors.textSecondary }}>{t.newnavigationpanel993}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-lg font-bold" style={{ color: colors.warningText }}>{userCredits}</span>
                    {!isDemoMode && (
                      <button
                        onClick={() => onOpenModal?.('plan')}
                        className="text-xs px-2 py-1 rounded transition-colors"
                        style={{ backgroundColor: colors.buttonPrimary, color: colors.textInverse }}
                        title={t.newnavigationpanel1002}
                      >
                        <i className="pi pi-plus"></i>
                      </button>
                    )}
                  </div>
                </div>
                {patronType && (
                  <div className="mt-2 pt-2 border-t nav-separator">
                    <div className="flex items-center space-x-1">
                      <i className="pi pi-star-fill text-xs" style={{ color: colors.accent }}></i>
                      <span className="text-xs font-semibold" style={{ color: colors.accent }}>
                        Patron {patronType === 'monthly' ? t.newnavigationpanel1014 : t.newnavigationpanel1014_2}
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
              <div className="relative" onMouseEnter={() => handleMenuEnter('credits')} onMouseLeave={handleMenuLeave}>
                <div className="w-8 h-8 flex items-center justify-center rounded nav-credits-box cursor-pointer" onClick={() => setOpenMenuId(openMenuId === 'credits' ? null : 'credits')}>
                  <i className="pi pi-wallet text-xs" style={{ color: colors.warningText }}></i>
                </div>
                {/* Popup for credits */}
                <div className={`absolute left-full bottom-0 ml-2 w-48 nav-popup-menu rounded-lg shadow-xl transition-all duration-200 z-50 ${openMenuId === 'credits' ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
                  <div className="p-3">
                    <div className="text-xs mb-1" style={{ color: colors.textMuted }}>{t.newnavigationpanel1043}</div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-2xl font-bold" style={{ color: colors.warningText }}>{userCredits}</span>
                      {!isDemoMode && (
                        <button
                          onClick={blurAndRun(() => onOpenModal?.('plan'))}
                          className="text-xs px-2 py-1 rounded"
                          style={{ backgroundColor: colors.buttonPrimary, color: colors.textInverse }}
                        >
                          {t.newnavigationpanel1052}
                        </button>
                      )}
                    </div>
                    {patronType && (
                      <div className="flex items-center space-x-1 mt-2 pt-2 border-t nav-separator">
                        <i className="pi pi-star-fill text-xs" style={{ color: colors.accent }}></i>
                        <span className="text-xs" style={{ color: colors.accent }}>
                          Patron {patronType === 'monthly' ? t.newnavigationpanel1060 : t.newnavigationpanel1060_2}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Profile icon with popup menu */}
            <div className="relative" onMouseEnter={() => handleMenuEnter('profile')} onMouseLeave={handleMenuLeave}>
              <button className="w-8 h-8 flex items-center justify-center rounded nav-hover-btn transition-colors" onClick={() => setOpenMenuId(openMenuId === 'profile' ? null : 'profile')}>
                <i className={`pi ${isLoggedIn ? 'pi-user' : 'pi-sign-in'} nav-icon-color`} title={isLoggedIn ? userName : t.panelsewnavigationpanel359}></i>
              </button>
              {/* Popup submenu for Profile */}
              <div className={`absolute left-full bottom-0 ml-2 w-48 nav-popup-menu rounded-lg shadow-xl transition-all duration-200 z-50 ${openMenuId === 'profile' ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
                <div className="p-2">
                  {isLoggedIn ? (
                    <>
                      <button onClick={blurAndRun(() => onOpenModal?.('profile'))} className="w-full flex items-center space-x-2 px-3 py-2 text-sm nav-icon-color hover:text-white nav-hover-btn rounded">
                        <i className="pi pi-user-edit"></i>
                        <span>{t.newnavigationpanel315}</span>
                      </button>
                      {/* Messaging Button (always shown, also in demo mode) */}
                      <button onClick={blurAndRun(() => window.dispatchEvent(new CustomEvent('openMessaging')))} className="w-full flex items-center space-x-2 px-3 py-2 text-sm nav-icon-color hover:text-white nav-hover-btn rounded">
                        <i className="pi pi-envelope"></i>
                        <span>{t.newnavigationpanel1076}</span>
                      </button>
                      {/* 🎯 "Change Plan" - greyed out in DEMO mode but still visible */}
                      <button
                        onClick={blurAndRun(() => { if (!isDemoMode) onOpenModal?.('plan'); })}
                        className={`w-full flex items-center space-x-2 px-3 py-2 text-sm rounded ${isDemoMode ? 'cursor-not-allowed' : 'nav-menu-item nav-hover-btn'}`}
                        style={isDemoMode ? { color: colors.textMuted } : undefined}
                        disabled={isDemoMode}
                      >
                        <i className="pi pi-credit-card"></i>
                        <span>{t.newnavigationpanel320}</span>
                      </button>
                      <button onClick={blurAndRun(() => { window.location.href = '/'; })} className="w-full flex items-center space-x-2 px-3 py-2 text-sm nav-icon-color hover:text-white nav-hover-btn rounded">
                        <i className="pi pi-external-link"></i>
                        <span>{t.newnavigationpanel325}</span>
                      </button>
                      <div className="border-t nav-separator my-2"></div>
                      <button onClick={blurAndRun(() => {
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
                      })} className="w-full flex items-center space-x-2 px-3 py-2 text-sm nav-icon-color hover:text-white nav-hover-btn rounded">
                        <i className="pi pi-sign-out"></i>
                        <span>{t.panelsewnavigationpanel333}</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <button onClick={blurAndRun(() => onOpenModal?.('login'))} className="w-full flex items-center space-x-2 px-3 py-2 text-sm nav-icon-color hover:text-white nav-hover-btn rounded">
                        <i className="pi pi-sign-in"></i>
                        <span>{t.newnavigationpanel1136}</span>
                      </button>
                      {/* 🎯 Hide "Register" button in DEMO mode */}
                      {!isDemoMode && (
                        <button onClick={blurAndRun(() => onOpenModal?.('register'))} className="w-full flex items-center space-x-2 px-3 py-2 text-sm nav-icon-color hover:text-white nav-hover-btn rounded">
                          <i className="pi pi-user-plus"></i>
                          <span>{t.newnavigationpanel1142}</span>
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
          const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
          if (token) {
            try {
              const newProject = await apiClient.get(`/projects/${createdProjectId}`);
              setSelectedProject(newProject);
              localStorage.setItem('scoriet_selected_project_id', createdProjectId.toString());
            } catch (err) {
              console.error(t.newnavigationpanel1181, err);
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
            <span>{t.newnavigationpanel1197}</span>
          </div>
        }
        style={{ width: '450px' }}
        modal
        closable
      >
        <div className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-400 rounded-lg p-4">
            <p className="text-yellow-800 text-sm mb-2">
              <strong>{t.newnavigationpanel1207}</strong>
            </p>
            <p className="text-gray-600 text-sm">
              {t.newnavigationpanel1210}<strong>{t.newnavigationpanel1210_2}</strong>{t.newnavigationpanel1210_3}
            </p>
          </div>

          {formAccessInfo && (
            <div className="bg-gray-100 rounded-lg p-4 border border-gray-300">
              <div className="flex justify-between items-center text-sm mb-2">
                <span className="text-gray-600">{t.newnavigationpanel1207}</span>
                <span className="text-gray-900 font-bold">{formAccessInfo.credits}</span>
              </div>
              <div className="flex justify-between items-center text-sm mb-2">
                <span className="text-gray-600">{t.newnavigationpanel1211}</span>
                <span className="text-yellow-600 font-bold">{formAccessInfo.requiredCredits}</span>
              </div>
              <hr className="border-gray-300 my-2" />
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">{t.newnavigationpanel1216}</span>
                <span className={`font-bold ${formAccessInfo.credits >= formAccessInfo.requiredCredits ? 'text-green-600' : 'text-red-600'}`}>
                  {formAccessInfo.credits >= formAccessInfo.requiredCredits
                    ? formAccessInfo.credits - formAccessInfo.requiredCredits
                    : `${formAccessInfo.requiredCredits - formAccessInfo.credits}${t.newnavigationpanel1230}`}
                </span>
              </div>
            </div>
          )}

          {formAccessInfo && formAccessInfo.credits < formAccessInfo.requiredCredits && (
            <div className="bg-red-50 border border-red-400 rounded-lg p-3">
              <p className="text-red-600 text-sm">
                {t.newnavigationpanel1229}<strong>{formAccessInfo.requiredCredits - formAccessInfo.credits}{t.newnavigationpanel1229_2}</strong>.
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
                label={t.newnavigationpanel1242}
              />
            ) : (
              <Button
                onClick={handleBuyCredits}
                className="flex-1"
                severity="warning"
                icon="pi pi-shopping-cart"
                label={t.newnavigationpanel1250}
              />
            )}
            <Button
              onClick={() => {
                setShowFormPaywall(false);
                setFormPaywallTarget(null);
              }}
              severity="secondary"
              icon="pi pi-times"
              label={t.newnavigationpanel1260}
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