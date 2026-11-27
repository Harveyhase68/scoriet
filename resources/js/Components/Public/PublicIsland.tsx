import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Dialog } from 'primereact/dialog';
import { Toast } from 'primereact/toast';
import AuthModalManager, { AuthModalType } from '@/Components/AuthModals/AuthModalManager';
import DemoAccessModal from '@/Components/AuthModals/DemoAccessModal';
import PlanModal from '@/Components/AuthModals/PlanModal';
import CMSPopupModal from '@/Components/Modals/CMSPopupModal';
import FeaturesModal from '@/Components/Modals/FeaturesModal';
import { getStoredLanguage, setStoredLanguage, SupportedLanguage, useTranslation } from '@/i18n';
import { DEFAULT_BILLING_INTERVAL } from '@/lib/plans';
import type { BillingInterval } from '@/lib/plans';

/**
 * Behaviour layer of the server-rendered public pages (resources/views/public).
 *
 * The Blade HTML owns all visible content — that is what search engines index.
 * This island renders nothing inline; it only contributes:
 *   - modals (login/register/profile, demo access, plans, features, video, CMS popups)
 *   - reactions to clicks on elements marked with data-public-action="..."
 *   - the signed-in state: html[data-auth], [data-user-name], [data-system-only]
 *   - the PWA install button
 *
 * Handlers mirror pages/LandingPage.tsx (the in-app welcome tab) so both
 * entry points behave identically.
 */

/** Server-provided context, see "islandContext" in the public controllers. */
export interface PublicPageContext {
  page: 'home' | 'cms' | 'project' | 'topic';
  locale: SupportedLanguage;
  /** Language for the modals; null = follow the visitor's stored app language. */
  uiLanguage: SupportedLanguage | null;
  isDemo: boolean;
  openRegister: boolean;
  inviteToken: string | null;
  cmsPageId: number | null;
}

interface UserData {
  id?: number;
  name: string;
  email: string;
  user_type?: string;
}

interface CMSPopup {
  id: number;
  title: string;
  content: string;
  popup_priority: number;
  popup_version: number;
  slug: string;
}

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/** Interval currently shown by the pricing section around `element` (default outside of it). */
function billingIntervalOf(element: HTMLElement): BillingInterval {
  const value = element.closest<HTMLElement>('[data-billing-interval]')?.dataset.billingInterval;
  return value === 'month' || value === 'year' ? value : DEFAULT_BILLING_INTERVAL;
}

type PublicAction =
  | 'login'
  | 'register'
  | 'demo'
  | 'video'
  | 'install'
  | 'profile'
  | 'plans'
  | 'logout'
  | 'goto-app'
  | 'features'
  | 'pricing'
  | 'billing-interval';

const ACTIONS: ReadonlySet<string> = new Set<PublicAction>([
  'login', 'register', 'demo', 'video', 'install', 'profile', 'plans', 'logout', 'goto-app', 'features', 'pricing',
  'billing-interval',
]);

function readStoredToken(): string | null {
  return localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
}

/** Reflect the auth state on <html>; public.css shows/hides [data-auth-show] blocks from it. */
function applyAuthState(user: UserData | null): void {
  document.documentElement.setAttribute('data-auth', user ? 'user' : 'guest');

  document.querySelectorAll<HTMLElement>('[data-user-name]').forEach((el) => {
    el.textContent = user?.name ? `, ${user.name}` : '';
  });

  const isSystemUser = user?.user_type === 'system';
  document.querySelectorAll<HTMLElement>('[data-system-only]').forEach((el) => {
    el.hidden = !isSystemUser;
  });
}

export default function PublicIsland({ context }: { context: PublicPageContext }) {
  const [language] = useState<SupportedLanguage>(() => context.uiLanguage ?? getStoredLanguage());
  const { t } = useTranslation(language);
  const toast = useRef<Toast>(null);

  const [activeModal, setActiveModal] = useState<AuthModalType>(null);
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [demoNotice, setDemoNotice] = useState<'required' | 'expired' | null>(null);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  // Interval chosen on the pricing section, preselected in the plan dialog.
  const [planInterval, setPlanInterval] = useState<BillingInterval>(DEFAULT_BILLING_INTERVAL);
  const [showFeaturesModal, setShowFeaturesModal] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [cmsPopups, setCmsPopups] = useState<CMSPopup[]>([]);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  // ---- Authentication -----------------------------------------------------
  const loadUserData = useCallback(async () => {
    const token = readStoredToken();
    if (!token) {
      setUserData(null);
      applyAuthState(null);
      return;
    }

    try {
      const response = await fetch('/api/user', {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      });
      if (response.ok) {
        const user: UserData = await response.json();
        setUserData(user);
        applyAuthState(user);
      } else {
        // Token invalid: clear it (same as the React landing page)
        localStorage.removeItem('access_token');
        sessionStorage.removeItem('access_token');
        setUserData(null);
        applyAuthState(null);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      setUserData(null);
      applyAuthState(null);
    }
  }, []);

  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  const isAuthenticated = (): boolean => document.documentElement.getAttribute('data-auth') === 'user';

  const handleLoginSuccess = useCallback(() => {
    if (!readStoredToken()) return;

    loadUserData();
    setActiveModal(null);

    const redirectUrl = localStorage.getItem('redirect_after_login');
    if (redirectUrl) {
      localStorage.removeItem('redirect_after_login');
      setTimeout(() => {
        window.location.href = redirectUrl;
      }, 100); // Small delay to ensure state is updated
    }
  }, [loadUserData]);

  const handleLogout = useCallback(() => {
    sessionStorage.clear();
    localStorage.clear();
    // Set after clearing: prevents the login modal from popping up in the app
    localStorage.setItem('logout_in_progress', 'true');
    document.cookie = 'remember_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    window.location.reload();
  }, []);

  // ---- Server-requested modals -------------------------------------------
  useEffect(() => {
    if (context.openRegister) {
      setActiveModal('register');
    }
  }, [context.openRegister]);

  // Bounced here from the demo deployment (?demo_access=required|expired|error)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const flag = params.get('demo_access');
    if (flag === 'required' || flag === 'expired' || flag === 'error') {
      setDemoNotice(flag === 'expired' ? 'expired' : 'required');
      setShowDemoModal(true);
      // Strip the query param so a refresh / bookmark doesn't re-trigger it.
      params.delete('demo_access');
      const qs = params.toString();
      window.history.replaceState({}, '', window.location.pathname + (qs ? `?${qs}` : '') + window.location.hash);
    }
  }, []);

  // ---- CMS popups (landing page popups in the page language) ---------------
  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/popups/landingpage?locale=${encodeURIComponent(language)}`, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    })
      .then((response) => (response.ok ? response.json() : []))
      .then((popups: CMSPopup[]) => setCmsPopups(popups))
      .catch(() => {
        // Popups are not critical
      });
    return () => controller.abort();
  }, [language]);

  // ---- PWA install ----------------------------------------------------------
  useEffect(() => {
    const installButtons = () => document.querySelectorAll<HTMLElement>('[data-public-action="install"]');
    const standalone = window.matchMedia('(display-mode: standalone)').matches;

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault(); // Suppress the mini-infobar on mobile
      if (standalone) return;
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      installButtons().forEach((el) => { el.hidden = false; });
    };
    const onAppInstalled = () => {
      setDeferredPrompt(null);
      installButtons().forEach((el) => { el.hidden = true; });
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    window.addEventListener('appinstalled', onAppInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
      window.removeEventListener('appinstalled', onAppInstalled);
    };
  }, []);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      toast.current?.show({
        severity: 'success',
        summary: t.installSuccess || 'Installation gestartet',
        detail: t.installSuccessDetail || 'Scoriet wird installiert...',
        life: 5000,
      });
    }
    // The prompt can only be used once
    setDeferredPrompt(null);
    document.querySelectorAll<HTMLElement>('[data-public-action="install"]').forEach((el) => { el.hidden = true; });
  }, [deferredPrompt, t]);

  // ---- Click delegation for the server-rendered markup --------------------
  const runAction = useCallback((action: PublicAction, element: HTMLElement): void => {
    switch (action) {
      case 'login':
        setActiveModal('login');
        break;
      case 'register':
        setActiveModal(context.isDemo ? 'login' : 'register');
        break;
      case 'demo':
        setDemoNotice(null);
        setShowDemoModal(true);
        break;
      case 'video':
        setShowVideoModal(true);
        break;
      case 'install':
        handleInstall();
        break;
      case 'profile':
        setActiveModal('profile');
        break;
      case 'plans':
        setShowPlanModal(true);
        break;
      case 'logout':
        handleLogout();
        break;
      case 'features':
        setShowFeaturesModal(true);
        break;
      case 'pricing':
        if (isAuthenticated()) {
          setPlanInterval(billingIntervalOf(element));
          setShowPlanModal(true);
        } else {
          setActiveModal(context.isDemo ? 'login' : 'register');
        }
        break;
      case 'billing-interval': {
        const section = element.closest<HTMLElement>('[data-billing-interval]');
        if (!section) break;
        const requested = element.dataset.interval;
        const next: BillingInterval = requested === 'month' || requested === 'year'
          ? requested
          : (section.dataset.billingInterval === 'year' ? 'month' : 'year'); // 'toggle'
        section.dataset.billingInterval = next;
        section.querySelectorAll<HTMLElement>('[role="switch"][data-public-action="billing-interval"]').forEach((toggle) => {
          toggle.setAttribute('aria-checked', next === 'year' ? 'true' : 'false');
        });
        break;
      }
      case 'goto-app':
        if (isAuthenticated()) {
          window.location.href = '/app';
        } else {
          // Redirect to the app after a successful login
          localStorage.setItem('redirect_after_login', '/app');
          setActiveModal('login');
        }
        break;
    }
  }, [context.isDemo, handleInstall, handleLogout]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      // Let the browser handle new-tab / modified clicks on real links.
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }
      const target = event.target instanceof Element ? event.target : null;
      if (!target) return;

      // Language switcher: remember the explicit choice for the app and for "/".
      const localeLink = target.closest<HTMLElement>('[data-locale-link]');
      if (localeLink) {
        const code = localeLink.dataset.localeLink as SupportedLanguage | undefined;
        if (code) setStoredLanguage(code);
        return; // normal navigation continues
      }

      const actionElement = target.closest<HTMLElement>('[data-public-action]');
      const action = actionElement?.dataset.publicAction;
      if (!actionElement || !action || !ACTIONS.has(action)) return;

      event.preventDefault();
      runAction(action as PublicAction, actionElement);
    };

    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, [runAction]);

  return (
    <>
      <Toast ref={toast} position="top-right" style={{ zIndex: 9999 }} />

      <Dialog
        visible={showVideoModal}
        onHide={() => setShowVideoModal(false)}
        modal
        header={t.landingpage1031}
        style={{ width: '90vw', maxWidth: '1200px' }}
        contentStyle={{ padding: 0 }}
        headerStyle={{ backgroundColor: '#1f2937', color: 'white', border: 'none' }}
        className="video-modal"
      >
        <div className="relative bg-black" style={{ paddingBottom: '56.25%', height: 0 }}>
          <video
            controls
            autoPlay
            className="absolute top-0 left-0 w-full h-full"
            style={{ objectFit: 'contain' }}
            poster="/video/Scoriet.png"
          >
            <source src="/video/Scoriet.avi" type="video/x-msvideo" />
            <source src="/video/Scoriet.mp4" type="video/mp4" />
            <source src="/video/Scoriet.webm" type="video/webm" />
            {t.landingpage738}
          </video>
        </div>
      </Dialog>

      <PlanModal visible={showPlanModal} onHide={() => setShowPlanModal(false)} initialTab={0} initialInterval={planInterval} />

      <FeaturesModal
        visible={showFeaturesModal}
        onHide={() => setShowFeaturesModal(false)}
        onStartFree={!userData && !context.isDemo ? () => setActiveModal('register') : undefined}
        t={t}
      />

      <AuthModalManager
        activeModal={activeModal}
        onCloseModal={() => setActiveModal(null)}
        isLoginClosable={true}
        onLoginSuccess={handleLoginSuccess}
        onRegistrationSuccess={(message: string) => {
          setActiveModal(null);
          setTimeout(() => {
            toast.current?.show({
              severity: 'success',
              summary: t.landingpage1074,
              detail: message,
              life: 8000,
              closable: true,
            });
          }, 300); // let the modal close animation finish
        }}
        currentLanguage={language}
        inviteToken={context.inviteToken}
      />

      <DemoAccessModal
        visible={showDemoModal}
        onHide={() => setShowDemoModal(false)}
        currentLanguage={language}
        notice={demoNotice}
      />

      {cmsPopups.length > 0 && (
        <CMSPopupModal popups={cmsPopups} storageKeyPrefix="cms_popup_lobby_" userId={userData?.id} />
      )}
    </>
  );
}
