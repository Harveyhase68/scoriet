import React, { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import { Button } from 'primereact/button';
import { Badge } from 'primereact/badge';
import { Divider } from 'primereact/divider';
import { Dialog } from 'primereact/dialog';
import AuthModalManager, { AuthModalType } from '@/Components/AuthModals/AuthModalManager';
import LanguageSelector from '@/Components/LanguageSelector';
import { useTranslation, SupportedLanguage, getStoredLanguage, setStoredLanguage } from '@/i18n';

import {
  CheckIcon,
  HeartIcon
} from '@heroicons/react/24/outline';

interface UserData {
  id?: number;
  name: string;
  email: string;
  email_verified_at?: string;
}

interface CMSPageProps {
  title: string;
  content: string;
}

export default function CMSPage({ title, content }: CMSPageProps) {
  const [activeModal, setActiveModal] = useState<AuthModalType>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [showPlanModal, setShowPlanModal] = useState<boolean>(false);
  const [systemSettings, setSystemSettings] = useState<any>(null);

  // Language state
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>(() => getStoredLanguage());
  const { t } = useTranslation(currentLanguage);

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
    try {
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      const response = await fetch('/settings', {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        const settings = await response.json();
        setSystemSettings(settings);
      }
    } catch {
      // Error loading system settings - use defaults
      setSystemSettings({
        price_premium: 29.99,
        price_business: 49.99,
        price_patron: 69.00,
      });
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

      <div className="min-h-screen bg-gray-900 text-white overflow-y-auto max-h-screen">
        {/* Header - EXACTLY like LandingPage.tsx */}
        <header className="bg-gray-800 border-b border-gray-700">
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
                  className="p-button-text"
                  style={{ borderRadius: '8px', paddingTop: '6px', paddingBottom: '6px' }}
                  onClick={() => window.location.href = '/'}
                />

                {!isAuthenticated ? (
                  <>
                    <Button
                      label={t.login}
                      className="p-button-text"
                      style={{ borderRadius: '8px', paddingTop: '6px', paddingBottom: '6px' }}
                      onClick={() => handleOpenModal('login')}
                    />
                    {!isDemoMode && (
                      <Button
                        label={t.register}
                        className="p-button-outlined"
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
                      className="p-button-text"
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
                      className="p-button-outlined"
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
        <section className="py-20 bg-gray-900">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-4xl font-bold text-center mb-8 text-blue-400">
              {title}
            </h1>

            <div className="bg-gray-800 rounded-lg shadow-lg p-8">
              <div
                className="cms-content"
                dangerouslySetInnerHTML={{ __html: content }}
              />
            </div>

            {/* Custom CSS for CMS content - Inline styles from DB take precedence */}
            <style>{`
              .cms-content {
                max-width: none;
                color: #d1d5db;
              }
              .cms-content h1 {
                font-size: 2.25rem;
                font-weight: 700;
                margin-top: 1.5rem;
                margin-bottom: 1rem;
                line-height: 1.2;
              }
              .cms-content h2 {
                font-size: 1.5rem;
                font-weight: 600;
                margin-top: 1.5rem;
                margin-bottom: 1rem;
                line-height: 1.3;
              }
              .cms-content h3 {
                font-size: 1.25rem;
                font-weight: 600;
                margin-top: 1.25rem;
                margin-bottom: 0.75rem;
                line-height: 1.3;
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
                color: #60a5fa;
                text-decoration: underline;
              }
              .cms-content a:hover {
                color: #93c5fd;
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
        <footer className="bg-gray-800 border-t border-gray-700 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-4 gap-8">
              <div>
                <h3 className="text-lg font-semibold mb-4 text-white">Scoriet</h3>
                <p className="text-gray-400 mb-4">
                  The future of code generation. Built by developers, for developers.
                </p>
                <div className="flex space-x-4 gap-3">
                  <Button icon="pi pi-github" className="p-button-text p-button-rounded" />
                  <Button icon="pi pi-twitter" className="p-button-text p-button-rounded" />
                  <Button icon="pi pi-discord" className="p-button-text p-button-rounded" />
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-4 text-white">{t.productLabel}</h4>
                <ul className="space-y-2 text-gray-400">
                  <li><a href="#" className="hover:text-white">{t.featuresLink}</a></li>
                  <li><a href="#" className="hover:text-white">{t.pricingLink}</a></li>
                  <li><a href="#" className="hover:text-white">{t.templatesLink}</a></li>
                  <li><a href="#" className="hover:text-white">{t.examplesLink}</a></li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-4 text-white">{t.resourcesLabel}</h4>
                <ul className="space-y-2 text-gray-400">
                  <li><a href="#" className="hover:text-white">{t.documentationLink}</a></li>
                  <li><a href="#" className="hover:text-white">{t.apiReferenceLink}</a></li>
                  <li><a href="#" className="hover:text-white">{t.tutorialsLink}</a></li>
                  <li><a href="#" className="hover:text-white">{t.blogLink}</a></li>
                </ul>
              </div>

              <div>
                  <h4 className="font-semibold mb-4 text-white">{t.supportLabel}</h4>
                  <ul className="space-y-2 text-gray-400">
                      <li><a href={`/${currentLanguage}/help`} className="hover:text-white">{t.helpCenterLink}</a></li>
                      <li><a href={`/${currentLanguage}/impressum`} className="hover:text-white">Impressum</a></li>
                      <li><a href="#" className="hover:text-white">{t.contactUsLink}</a></li>
                      <li><a href="#" className="hover:text-white">{t.communityLink}</a></li>
                  </ul>
              </div>
            </div>

            <Divider />

            <div className="flex justify-between items-center text-gray-400">
              <p></p>
              <div className="flex space-x-6">
                <a href="#" className="hover:text-white">{t.privacyPolicy}</a>
                <a href="#" className="hover:text-white">{t.termsOfService}</a>
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
        contentStyle={{ padding: '20px', backgroundColor: '#111827', color: 'white' }}
        headerStyle={{ backgroundColor: '#1f2937', color: 'white', border: 'none' }}
        className="plan-modal"
      >
        <div className="space-y-6">
          {/* Current Plan Status */}
          <div className="bg-gray-800 p-4 rounded-lg border-l-4 border-l-blue-400">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-white">{t.cmspage422}</h3>
              <Badge value="Free" severity="info" />
            </div>
            <p className="text-gray-300">
              {t.cmspage387}<strong className="text-blue-400">Free plan</strong>. {t.cmspage45}
            </p>
          </div>

          {/* Plans Grid */}
          <div className="grid md:grid-cols-4 gap-6">
            {/* Premium Plan */}
            <div className="text-center bg-gray-700 border border-gray-600 hover:shadow-xl transition-shadow rounded-lg">
              <div className="p-6">
                <h3 className="text-2xl font-bold text-white mb-2">Premium</h3>
                <div className="text-3xl font-bold text-blue-400 mb-2">
                  {systemSettings ? `€${systemSettings.price_premium}` : "€2.99"}
                  <span className="text-lg text-gray-400">/month</span>
                </div>
                <p className="text-gray-300 mb-6">Best for professional developers</p>
                
                <ul className="text-left text-gray-300 mb-8 space-y-2">
                  <li className="flex items-center">
                    <CheckIcon className="w-5 h-5 text-green-400 mr-2 flex-shrink-0" />
                    Unlimited projects
                  </li>
                  <li className="flex items-center">
                    <CheckIcon className="w-5 h-5 text-green-400 mr-2 flex-shrink-0" />
                    Advanced templates
                  </li>
                  <li className="flex items-center">
                    <CheckIcon className="w-5 h-5 text-green-400 mr-2 flex-shrink-0" />
                    Custom template creation
                  </li>
                  <li className="flex items-center">
                    <CheckIcon className="w-5 h-5 text-green-400 mr-2 flex-shrink-0" />
                    Priority support
                  </li>
                </ul>
                
                <Button
                  label="Choose Premium"
                  className="p-button-primary w-full"
                  style={{ borderRadius: '8px', paddingTop: '10px', paddingBottom: '10px' }}
                  onClick={() => alert(`Upgrading to Premium - Payment integration coming soon!`)}
                />
              </div>
            </div>

            {/* Business Plan */}
            <div className="text-center bg-gray-700 border border-gray-600 hover:shadow-xl transition-shadow rounded-lg ring-2 ring-blue-400">
              <div className="p-6">
                <Badge value={t.cmspage473} severity="info" className="mb-4" />
                <h3 className="text-2xl font-bold text-white mb-2">Business</h3>
                <div className="text-3xl font-bold text-blue-400 mb-2">
                  {systemSettings ? `€${systemSettings.price_business}` : "€9.99"}
                  <span className="text-lg text-gray-400">/month</span>
                </div>
                <p className="text-gray-300 mb-6">Best for teams and agencies</p>
                
                <ul className="text-left text-gray-300 mb-8 space-y-2">
                  <li className="flex items-center">
                    <CheckIcon className="w-5 h-5 text-green-400 mr-2 flex-shrink-0" />
                    All Premium features
                  </li>
                  <li className="flex items-center">
                    <CheckIcon className="w-5 h-5 text-green-400 mr-2 flex-shrink-0" />
                    Team collaboration tools
                  </li>
                  <li className="flex items-center">
                    <CheckIcon className="w-5 h-5 text-green-400 mr-2 flex-shrink-0" />
                    Google Translate API
                  </li>
                  <li className="flex items-center">
                    <CheckIcon className="w-5 h-5 text-green-400 mr-2 flex-shrink-0" />
                    Advanced analytics
                  </li>
                </ul>
                
                <Button
                  label="Choose Business"
                  className="p-button-info w-full"
                  style={{ borderRadius: '8px', paddingTop: '10px', paddingBottom: '10px' }}
                  onClick={() => alert(`Upgrading to Business - Payment integration coming soon!`)}
                />
              </div>
            </div>

            {/* Patron Plan */}
            <div className="text-center bg-gray-700 border border-gray-600 hover:shadow-xl transition-shadow rounded-lg">
              <div className="p-6">
                <h3 className="text-2xl font-bold text-white mb-2 flex items-center justify-center">
                  Patron
                  <HeartIcon className="w-6 h-6 text-red-500 ml-2" />
                </h3>
                <div className="text-3xl font-bold text-blue-400 mb-2">
                  {systemSettings ? `€${systemSettings.price_patron}+` : "€5+"}
                  <span className="text-lg text-gray-400">/month</span>
                </div>
                <p className="text-gray-300 mb-6">Support the community</p>
                
                <ul className="text-left text-gray-300 mb-8 space-y-2">
                  <li className="flex items-center">
                    <CheckIcon className="w-5 h-5 text-green-400 mr-2 flex-shrink-0" />
                    All Business features
                  </li>
                  <li className="flex items-center">
                    <CheckIcon className="w-5 h-5 text-green-400 mr-2 flex-shrink-0" />
                    Early access to features
                  </li>
                  <li className="flex items-center">
                    <CheckIcon className="w-5 h-5 text-green-400 mr-2 flex-shrink-0" />
                    Influence development
                  </li>
                  <li className="flex items-center">
                    <CheckIcon className="w-5 h-5 text-green-400 mr-2 flex-shrink-0" />
                    Community Discord access
                  </li>
                </ul>
                
                <Button
                  label="Become Patron"
                  className="p-button-help w-full"
                  style={{ borderRadius: '8px', paddingTop: '10px', paddingBottom: '10px' }}
                  onClick={() => alert(`Becoming a Patron - Payment integration coming soon!`)}
                />
              </div>
            </div>
          </div>

          {/* Footer Note */}
          <div className="text-center text-gray-400 text-sm">
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
