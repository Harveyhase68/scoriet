import React, { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import { Button } from 'primereact/button';
import { Badge } from 'primereact/badge';
import { Divider } from 'primereact/divider';
import { Dialog } from 'primereact/dialog';
import AuthModalManager, { AuthModalType } from '@/Components/AuthModals/AuthModalManager';
import LanguageSelector from '@/Components/LanguageSelector';
import { useTranslation, SupportedLanguage, getStoredLanguage, setStoredLanguage } from '@/i18n';
import { useTheme } from '@/contexts/ThemeContext';

import {
  CheckIcon,
  HeartIcon
} from '@heroicons/react/24/outline';

interface UserData {
  id?: number;
  name: string;
  email: string;
  email_verified_at?: string;
  user_type?: string;
}

interface CMSPageProps {
  title: string;
  content: string;
  pageId?: number;
  slug?: string;
  locale?: string;
}

export default function CMSPage({ title, content, pageId, slug: _slug, locale: _locale }: CMSPageProps) {
  const [activeModal, setActiveModal] = useState<AuthModalType>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [showPlanModal, setShowPlanModal] = useState<boolean>(false);
  const [systemSettings, setSystemSettings] = useState<any>(null);

  // Language state
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>(() => getStoredLanguage());
  const { t } = useTranslation(currentLanguage);
  const { colors } = useTheme();

  // Handle language change
  const handleLanguageChange = (language: SupportedLanguage) => {
    setCurrentLanguage(language);
    setStoredLanguage(language);

    // Notify all components about language change
    window.dispatchEvent(new CustomEvent('languageChanged', { detail: { language } }));

    // ONLY redirect if we are actually on a CMS page (not on /app or /)
    // Redirect to the same page but with the new language in the URL
    // Example: /de/help -> /en/help
    const currentPath = window.location.pathname;

    // Skip redirect if we're on /app or homepage
    if (currentPath === '/app' || currentPath === '/' || currentPath === '') {
      return;
    }

    const pathSegments = currentPath.split('/').filter(segment => segment !== '');

    // Check if the first segment is a language code (de, en, es, fr, it)
    const supportedLangCodes = ['de', 'en', 'es', 'fr', 'it'];
    if (pathSegments.length > 0 && supportedLangCodes.includes(pathSegments[0])) {
      // Replace the language segment with the new language
      pathSegments[0] = language;
      const newPath = '/' + pathSegments.join('/');

      // Navigate to the new URL
      window.location.href = newPath;
    }
  };

  // Check if this is a demo installation
  const isDemoMode = import.meta.env.VITE_SCORIET_DEMO === 'true';

  const loadSystemSettings = async () => {
    const defaultSettings = {
      price_patron_annual: 34.90,
      price_patron_monthly: 49.90,
      price_credits_500: 9.90,
      price_credits_1000: 17.90,
      price_credits_2500: 29.90,
    };

    const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');

    // Only fetch settings if user is authenticated
    if (!token) {
      setSystemSettings(defaultSettings);
      return;
    }

    try {
      const response = await fetch('/api/settings', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        const settings = await response.json();
        setSystemSettings(settings);
      } else {
        // Not authorized or error - use defaults silently
        setSystemSettings(defaultSettings);
      }
    } catch {
      // Network error - use defaults
      setSystemSettings(defaultSettings);
    }
  };

  // Check authentication on component mount
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      const isAuth = !!token;
      setIsAuthenticated(isAuth);
      if (isAuth && !userData) {
        loadUserData();
      }
    };
    checkAuth();
    loadSystemSettings();
  }, [userData]);

  const loadUserData = async () => {
    try {
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (!token) return;

      const response = await fetch('/api/user', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        const user = await response.json();
        setUserData(user);
      }
    } catch {
      // Error loading user data
    }
  };

  const handleOpenModal = (modalType: AuthModalType) => {
    setActiveModal(modalType);
  };

  const handleCloseModal = () => {
    setActiveModal(null);
  };

  const handleGotoApp = () => {
    if (isAuthenticated) {
      window.location.href = '/app';
    } else {
      localStorage.setItem('redirect_after_login', '/app');
      setActiveModal('login');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    sessionStorage.removeItem('access_token');
    sessionStorage.removeItem('refresh_token');
    setUserData(null);
    setIsAuthenticated(false);
    window.location.reload();
  };

  const handleLoginSuccess = () => {
    const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token') || sessionStorage.getItem('access_token');
    if (token) {
      setIsAuthenticated(true);
      loadUserData();
      setActiveModal(null);

      const redirectUrl = localStorage.getItem('redirect_after_login');
      if (redirectUrl) {
        localStorage.removeItem('redirect_after_login');
        setTimeout(() => {
          window.location.href = redirectUrl;
        }, 100);
      }
    }
  };

  return (
    <>
      <Head title={`${title} - Scoriet`} />

      <div className="min-h-screen overflow-y-auto max-h-screen cms-page-container" style={{ backgroundColor: colors.bgPrimary, color: colors.textPrimary }}>
        {/* Header - EXACTLY like LandingPage.tsx */}
        <header style={{ backgroundColor: colors.bgSecondary, borderBottom: `1px solid ${colors.borderPrimary}` }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <a href="/" className="flex items-center">
                  <img
                    src="/images/logos/scoriet-logo.png"
                    alt="Scoriet Logo"
                    className="h-8 w-auto hover:opacity-80 transition-opacity"
                  />
                </a>
                <Badge value="BETA" severity="info" className="ml-2" />
              </div>

              <div className="flex items-center gap-2">
                {/* Language Selector */}
                <LanguageSelector
                  currentLanguage={currentLanguage}
                  onLanguageChange={handleLanguageChange}
                  variant="compact"
                  size="small"
                />

                {/* Home Button */}
                <Button
                  label="Home"
                  className="p-button-outlined p-button-info"
                  style={{ borderRadius: '8px', paddingTop: '6px', paddingBottom: '6px' }}
                  onClick={() => window.location.href = '/'}
                />

                {!isAuthenticated ? (
                  <>
                    <Button
                      label={t.login}
                      className="p-button-outlined p-button-info"
                      style={{ borderRadius: '8px', paddingTop: '6px', paddingBottom: '6px' }}
                      onClick={() => handleOpenModal('login')}
                    />
                    {!isDemoMode && (
                      <Button
                        label={t.register}
                        className="p-button-outlined p-button-info"
                        style={{ borderRadius: '8px', paddingTop: '6px', paddingBottom: '6px' }}
                        onClick={() => handleOpenModal('register')}
                      />
                    )}
                  </>
                ) : (
                  <>
                    <Button
                      label={t.profile}
                      icon="pi pi-user"
                      className="p-button-outlined p-button-info"
                      style={{ borderRadius: '8px', paddingTop: '6px', paddingBottom: '6px' }}
                      onClick={() => setActiveModal('profile')}
                    />
                    <Button
                      label={t.changePlan}
                      icon="pi pi-credit-card"
                      className="p-button-outlined p-button-info"
                      style={{ borderRadius: '8px', paddingTop: '6px', paddingBottom: '6px' }}
                      onClick={() => setShowPlanModal(true)}
                    />
                    <Button
                      label={t.logout}
                      icon="pi pi-sign-out"
                      className="p-button-outlined p-button-info"
                      style={{ borderRadius: '8px', paddingTop: '6px', paddingBottom: '6px' }}
                      onClick={handleLogout}
                    />
                  </>
                )}

                <Button
                  label={t.gotoApp}
                  icon="pi pi-arrow-right"
                  className="p-button-primary"
                  style={{ borderRadius: '8px', paddingTop: '6px', paddingBottom: '6px' }}
                  onClick={handleGotoApp}
                />
              </div>
            </div>
          </div>
        </header>

        {/* Content Section */}
        <section className="py-20" style={{ backgroundColor: colors.bgPrimary }}>
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Edit Button for System User */}
            {userData?.user_type === 'system' && pageId && (
              <div className="flex justify-end mb-4">
                <Button
                  label="Bearbeiten"
                  icon="pi pi-pencil"
                  className="p-button-warning p-button-sm"
                  style={{ borderRadius: '8px' }}
                  onClick={() => {
                    // Navigate to app with CMS panel open and page selected
                    window.location.href = `/app?panel=cms&pageId=${pageId}`;
                  }}
                />
              </div>
            )}

            <h1 className="text-4xl font-bold text-center mb-8" style={{ color: colors.accent }}>
              {title}
            </h1>

            <div className="rounded-lg shadow-lg p-8" style={{ backgroundColor: colors.bgSecondary }}>
              <div
                className="cms-content"
                dangerouslySetInnerHTML={{ __html: content }}
              />
            </div>

            {/* Custom CSS for CMS content and themed buttons */}
            <style>{`
              /* Theme-aware text buttons - high specificity to override PrimeReact */
              .cms-page-container .p-button.p-button-text,
              .cms-page-container .p-button.p-button-text .p-button-label,
              .cms-page-container .p-button.p-button-text .p-button-icon {
                color: var(--theme-text-primary) !important;
              }
              .cms-page-container .p-button.p-button-text:hover,
              .cms-page-container .p-button.p-button-text:hover .p-button-label,
              .cms-page-container .p-button.p-button-text:hover .p-button-icon {
                background: var(--theme-bg-hover) !important;
                color: var(--theme-text-primary) !important;
              }
              .cms-page-container .p-button.p-button-rounded.p-button-text,
              .cms-page-container .p-button.p-button-rounded.p-button-text .p-button-icon {
                color: var(--theme-text-primary) !important;
              }
              .cms-page-container .p-button.p-button-rounded.p-button-text:hover {
                background: var(--theme-bg-hover) !important;
              }
              .cms-content {
                max-width: none;
                color: var(--theme-text-secondary);
              }
              .cms-content h1 {
                font-size: 2.25rem;
                font-weight: 700;
                margin-top: 1.5rem;
                margin-bottom: 1rem;
                line-height: 1.2;
                color: var(--theme-text-primary);
              }
              .cms-content h2 {
                font-size: 1.5rem;
                font-weight: 600;
                margin-top: 1.5rem;
                margin-bottom: 1rem;
                line-height: 1.3;
                color: var(--theme-text-primary);
              }
              .cms-content h3 {
                font-size: 1.25rem;
                font-weight: 600;
                margin-top: 1.25rem;
                margin-bottom: 0.75rem;
                line-height: 1.3;
                color: var(--theme-text-primary);
              }
              .cms-content p {
                margin-bottom: 1rem;
                line-height: 1.6;
              }
              .cms-content ul, .cms-content ol {
                margin-left: 1.5rem;
                margin-bottom: 1.5rem;
              }
              .cms-content ul {
                list-style-type: disc;
              }
              .cms-content ol {
                list-style-type: decimal;
              }
              .cms-content li {
                margin-bottom: 0.5rem;
                line-height: 1.6;
              }
              .cms-content strong, .cms-content b {
                font-weight: 700;
              }
              .cms-content a {
                color: var(--theme-accent);
                text-decoration: underline;
              }
              .cms-content a:hover {
                color: var(--theme-accent-hover);
              }
              .cms-content br {
                display: block;
                content: "";
                margin-top: 0.5rem;
              }
            `}</style>
          </div>
        </section>

        {/* Footer - EXACTLY like LandingPage.tsx */}
        <footer className="py-12" style={{ backgroundColor: colors.bgSecondary, borderTop: `1px solid ${colors.borderPrimary}` }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-4 gap-8">
              <div>
                <h3 className="text-lg font-semibold mb-4" style={{ color: colors.textPrimary }}>Scoriet</h3>
                <p className="mb-4" style={{ color: colors.textSecondary }}>
                  The future of code generation. Built by developers, for developers.
                </p>
                <div className="flex space-x-4 gap-3">
                  <Button icon="pi pi-github" className="p-button-outlined p-button-info p-button-rounded" />
                  <Button icon="pi pi-twitter" className="p-button-outlined p-button-info p-button-rounded" />
                  <Button icon="pi pi-discord" className="p-button-outlined p-button-info p-button-rounded" />
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-4" style={{ color: colors.textPrimary }}>{t.productLabel}</h4>
                <ul className="space-y-2" style={{ color: colors.textSecondary }}>
                  <li><a href="#" style={{ color: colors.textSecondary }}>{t.featuresLink}</a></li>
                  <li><a href="#" style={{ color: colors.textSecondary }}>{t.pricingLink}</a></li>
                  <li><a href="#" style={{ color: colors.textSecondary }}>{t.templatesLink}</a></li>
                  <li><a href="#" style={{ color: colors.textSecondary }}>{t.examplesLink}</a></li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-4" style={{ color: colors.textPrimary }}>{t.resourcesLabel}</h4>
                <ul className="space-y-2" style={{ color: colors.textSecondary }}>
                  <li><a href="#" style={{ color: colors.textSecondary }}>{t.documentationLink}</a></li>
                  <li><a href="#" style={{ color: colors.textSecondary }}>{t.apiReferenceLink}</a></li>
                  <li><a href="#" style={{ color: colors.textSecondary }}>{t.tutorialsLink}</a></li>
                  <li><a href={`/${currentLanguage}/downloads`} style={{ color: colors.textSecondary }}>{t.downloadsLink}</a></li>
                </ul>
              </div>

              <div>
                  <h4 className="font-semibold mb-4" style={{ color: colors.textPrimary }}>{t.supportLabel}</h4>
                  <ul className="space-y-2" style={{ color: colors.textSecondary }}>
                      <li><a href={`/${currentLanguage}/help`} style={{ color: colors.textSecondary }}>{t.helpCenterLink}</a></li>
                      <li><a href={`/${currentLanguage}/impressum`} style={{ color: colors.textSecondary }}>Impressum</a></li>
                      <li><a href="#" style={{ color: colors.textSecondary }}>{t.contactUsLink}</a></li>
                      <li><a href="#" style={{ color: colors.textSecondary }}>{t.communityLink}</a></li>
                  </ul>
              </div>
            </div>

            <Divider />

            <div className="flex justify-between items-center" style={{ color: colors.textSecondary }}>
              <p></p>
              <div className="flex space-x-6">
                <a href="#" style={{ color: colors.textSecondary }}>{t.privacyPolicy}</a>
                <a href="#" style={{ color: colors.textSecondary }}>{t.termsOfService}</a>
              </div>
            </div>
          </div>
        </footer>
      </div>

      {/* Plan Selection Modal */}
      <Dialog
        visible={showPlanModal}
        onHide={() => setShowPlanModal(false)}
        modal
        header={t.cmspage412}
        style={{ width: '95vw', maxWidth: '1400px' }}
        contentStyle={{ padding: '20px', backgroundColor: colors.bgPrimary, color: colors.textPrimary }}
        headerStyle={{ backgroundColor: colors.dialogHeader, color: colors.textPrimary, border: 'none' }}
        className="plan-modal"
      >
        <div className="space-y-6">
          {/* Current Plan Status */}
          <div className="p-4 rounded-lg border-l-4" style={{ backgroundColor: colors.bgSecondary, borderLeftColor: colors.accent }}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold" style={{ color: colors.textPrimary }}>{t.cmspage422}</h3>
              <Badge value="Free" severity="info" />
            </div>
            <p style={{ color: colors.textSecondary }}>
              {t.cmspage387}<strong style={{ color: colors.accent }}>Free plan</strong>. {t.cmspage45}
            </p>
          </div>

          {/* Plans Grid */}
          <div className="grid md:grid-cols-3 gap-6">
            {/* Free Plan */}
            <div className="text-center hover:shadow-xl transition-shadow rounded-lg" style={{ backgroundColor: colors.bgTertiary, border: `1px solid ${colors.borderPrimary}` }}>
              <div className="p-6">
                <h3 className="text-2xl font-bold mb-2" style={{ color: colors.textPrimary }}>Free</h3>
                <div className="text-3xl font-bold mb-2" style={{ color: colors.accent }}>
                  €0
                  <span className="text-lg" style={{ color: colors.textMuted }}>/forever</span>
                </div>
                <p className="mb-6" style={{ color: colors.textSecondary }}>Get started with basics</p>

                <ul className="text-left mb-8 space-y-2" style={{ color: colors.textSecondary }}>
                  <li className="flex items-center">
                    <CheckIcon className="w-5 h-5 text-green-400 mr-2 flex-shrink-0" />
                    1 project
                  </li>
                  <li className="flex items-center">
                    <CheckIcon className="w-5 h-5 text-green-400 mr-2 flex-shrink-0" />
                    1 database
                  </li>
                  <li className="flex items-center">
                    <CheckIcon className="w-5 h-5 text-green-400 mr-2 flex-shrink-0" />
                    50 free credits
                  </li>
                  <li className="flex items-center">
                    <CheckIcon className="w-5 h-5 text-green-400 mr-2 flex-shrink-0" />
                    Public templates
                  </li>
                </ul>

                <Button
                  label="Current Plan"
                  className="p-button-secondary w-full"
                  style={{ borderRadius: '8px', paddingTop: '10px', paddingBottom: '10px' }}
                  disabled
                />
              </div>
            </div>

            {/* Patron Annual Plan */}
            <div className="text-center hover:shadow-xl transition-shadow rounded-lg ring-2" style={{ backgroundColor: colors.bgTertiary, border: `1px solid ${colors.borderPrimary}`, outlineColor: colors.accent }}>
              <div className="p-6">
                <Badge value="Best Value" severity="info" className="mb-4" />
                <h3 className="text-2xl font-bold mb-2" style={{ color: colors.textPrimary }}>Patron Annual</h3>
                <div className="text-3xl font-bold mb-2" style={{ color: colors.accent }}>
                  {systemSettings ? `€${systemSettings.price_patron_annual}` : "€34.90"}
                  <span className="text-lg" style={{ color: colors.textMuted }}>/year</span>
                </div>
                <p className="mb-6" style={{ color: colors.textSecondary }}>Teams + credit-based generation</p>

                <ul className="text-left mb-8 space-y-2" style={{ color: colors.textSecondary }}>
                  <li className="flex items-center">
                    <CheckIcon className="w-5 h-5 text-green-400 mr-2 flex-shrink-0" />
                    Teams unlocked
                  </li>
                  <li className="flex items-center">
                    <CheckIcon className="w-5 h-5 text-green-400 mr-2 flex-shrink-0" />
                    Private templates
                  </li>
                  <li className="flex items-center">
                    <CheckIcon className="w-5 h-5 text-green-400 mr-2 flex-shrink-0" />
                    5 credits per generation
                  </li>
                  <li className="flex items-center">
                    <CheckIcon className="w-5 h-5 text-green-400 mr-2 flex-shrink-0" />
                    Buy credits as needed
                  </li>
                  <li className="flex items-center">
                    <CheckIcon className="w-5 h-5 text-green-400 mr-2 flex-shrink-0" />
                    5 free support tickets/month
                  </li>
                </ul>

                <Button
                  label="Choose Patron Annual"
                  className="p-button-info w-full"
                  style={{ borderRadius: '8px', paddingTop: '10px', paddingBottom: '10px' }}
                  onClick={() => alert(`Upgrading to Patron Annual - Payment integration coming soon!`)}
                />
              </div>
            </div>

            {/* Patron Monthly Plan */}
            <div className="text-center hover:shadow-xl transition-shadow rounded-lg" style={{ backgroundColor: colors.bgTertiary, border: `1px solid ${colors.borderPrimary}` }}>
              <div className="p-6">
                <h3 className="text-2xl font-bold mb-2 flex items-center justify-center" style={{ color: colors.textPrimary }}>
                  Patron Monthly
                  <HeartIcon className="w-6 h-6 text-red-500 ml-2" />
                </h3>
                <div className="text-3xl font-bold mb-2" style={{ color: colors.accent }}>
                  {systemSettings ? `€${systemSettings.price_patron_monthly}` : "€49.90"}
                  <span className="text-lg" style={{ color: colors.textMuted }}>/month</span>
                </div>
                <p className="mb-6" style={{ color: colors.textSecondary }}>Everything unlimited</p>

                <ul className="text-left mb-8 space-y-2" style={{ color: colors.textSecondary }}>
                  <li className="flex items-center">
                    <CheckIcon className="w-5 h-5 text-green-400 mr-2 flex-shrink-0" />
                    Unlimited everything
                  </li>
                  <li className="flex items-center">
                    <CheckIcon className="w-5 h-5 text-green-400 mr-2 flex-shrink-0" />
                    No credits needed
                  </li>
                  <li className="flex items-center">
                    <CheckIcon className="w-5 h-5 text-green-400 mr-2 flex-shrink-0" />
                    Unlimited projects
                  </li>
                  <li className="flex items-center">
                    <CheckIcon className="w-5 h-5 text-green-400 mr-2 flex-shrink-0" />
                    Unlimited databases
                  </li>
                  <li className="flex items-center">
                    <CheckIcon className="w-5 h-5 text-green-400 mr-2 flex-shrink-0" />
                    5 free support tickets/month
                  </li>
                </ul>

                <Button
                  label="Choose Patron Monthly"
                  className="p-button-help w-full"
                  style={{ borderRadius: '8px', paddingTop: '10px', paddingBottom: '10px' }}
                  onClick={() => alert(`Upgrading to Patron Monthly - Payment integration coming soon!`)}
                />
              </div>
            </div>
          </div>

          {/* Footer Note */}
          <div className="text-center text-sm" style={{ color: colors.textMuted }}>
            <p>You can change or cancel your plan at any time. All plans include a 30-day money-back guarantee.</p>
          </div>
        </div>
      </Dialog>

      {/* Auth Modals */}
      <AuthModalManager
        activeModal={activeModal}
        onCloseModal={handleCloseModal}
        isLoginClosable={true}
        onLoginSuccess={handleLoginSuccess}
        onRegistrationSuccess={() => {
          handleCloseModal();
        }}
        currentLanguage={currentLanguage}
      />
    </>
  );
}
