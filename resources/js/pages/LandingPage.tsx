import React, { useState, useRef, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { Badge } from 'primereact/badge';
import { Divider } from 'primereact/divider';
import { Checkbox } from 'primereact/checkbox';
import { Dialog } from 'primereact/dialog';
import { Toast } from 'primereact/toast';
import {
  CodeBracketIcon as CodeIcon,
  CircleStackIcon as DatabaseIcon,
  DocumentTextIcon as TemplateIcon,
  SparklesIcon,
  CheckIcon,
  HeartIcon
} from '@heroicons/react/24/outline';
import AuthModalManager, { AuthModalType } from '@/Components/AuthModals/AuthModalManager';
import PlanModal from '@/Components/AuthModals/PlanModal';
import LanguageSelector from '@/Components/LanguageSelector';
import { useTranslation, SupportedLanguage, getStoredLanguage, setStoredLanguage } from '@/i18n';
import { pricingUtils } from '@/lib/api';

interface UserData {
  id?: number;
  name: string;
  email: string;
  email_verified_at?: string;
}

export default function LandingPage() {
  // Translation hooks
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>(() => {
    return getStoredLanguage() as SupportedLanguage || 'de';
  });
  const { t } = useTranslation(currentLanguage);
  
  // Toast ref
  const toast = useRef<Toast>(null);
  
  // State management
  const [isDemoMode, setIsDemoMode] = useState<boolean>(
    import.meta.env.VITE_SCORIET_DEMO === 'true' ||
    sessionStorage.getItem('demo_mode') === 'true'
  );
  const [activeModal, setActiveModal] = useState<AuthModalType>(null);
  const [showVideoModal, setShowVideoModal] = useState<boolean>(false);
  const [showPlanModal, setShowPlanModal] = useState<boolean>(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    // Initialize based on token existence to prevent flash of unauthenticated content
    const localToken = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
    const sessionToken = sessionStorage.getItem('access_token');
    return !!(localToken || sessionToken);
  });

  // Listen for demo mode and auth changes
  useEffect(() => {
    const checkDemoMode = () => {
      setIsDemoMode(
        import.meta.env.VITE_SCORIET_DEMO === 'true' ||
        sessionStorage.getItem('demo_mode') === 'true'
      );
    };

    window.addEventListener('storage', checkDemoMode);
    window.addEventListener('auth-change', checkDemoMode);

    return () => {
      window.removeEventListener('storage', checkDemoMode);
      window.removeEventListener('auth-change', checkDemoMode);
    };
  }, []);
  const [openHomeOnStart, setOpenHomeOnStart] = useState<boolean>(() => {
    const setting = localStorage.getItem('open_home_on_start');
    return setting === null || setting === 'true';
  });

  // Language change handler
  const handleLanguageChange = (language: SupportedLanguage) => {
    setCurrentLanguage(language);
    setStoredLanguage(language);
  };

  // Get pricing data from localStorage
  const getPricingData = () => {
    const prices = pricingUtils.getPricingData();
    const currency = pricingUtils.getCurrency();

    // Fallback to defaults if no pricing data available
    if (!prices) {
      return {
        patron_annual: 34.90,
        patron_monthly: 49.90,
        credits_500: 9.90,
        credits_1000: 17.90,
        credits_2500: 29.90,
        currency: 'EUR'
      };
    }

    return {
      patron_annual: prices.patron_annual,
      patron_monthly: prices.patron_monthly,
      credits_500: prices.credits_500,
      credits_1000: prices.credits_1000,
      credits_2500: prices.credits_2500,
      currency: currency
    };
  };

  const loadUserData = async () => {
    try {
      // Check both localStorage and sessionStorage for token
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (!token) {
        setIsAuthenticated(false);
        setUserData(null);
        return;
      }

      const response = await fetch('/api/user', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        const user = await response.json();
        setUserData(user);
        setIsAuthenticated(true);
      } else {
        // Token invalid, clear it
        setIsAuthenticated(false);
        setUserData(null);
        localStorage.removeItem('access_token');
        sessionStorage.removeItem('access_token');
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      setIsAuthenticated(false);
      setUserData(null);
    }
  };

  // Check authentication on mount
  useEffect(() => {
    loadUserData();
  }, []);

  const features = [
    {
      icon: <DatabaseIcon className="w-8 h-8 text-blue-500" />,
      title: t.sqlParserTitle,
      description: t.sqlParserDesc
    },
    {
      icon: <TemplateIcon className="w-8 h-8 text-green-500" />,
      title: t.templateSystemTitle,
      description: t.templateSystemDesc
    },
    {
      icon: <CodeIcon className="w-8 h-8 text-purple-500" />,
      title: t.multiLanguageTitle,
      description: t.multiLanguageDesc
    },
    {
      icon: <SparklesIcon className="w-8 h-8 text-yellow-500" />,
      title: t.modernInterfaceTitle,
      description: t.modernInterfaceDesc
    }
  ];

  // Get pricing data
  const pricingData = getPricingData();

  const pricingTiers = [
    {
      name: t.freeLabel,
      plan: "free",
      price: `${pricingData.currency} 0.00`,
      period: t.landingpage151,
      description: t.landingpage152,
      features: [
        "1 Projekt",
        "1 Datenbank",
        "50 kostenlose Credits",
        "Öffentliche Templates",
        "Community Support"
      ],
      buttonText: t.goStartFree,
      buttonClass: "p-button-outlined",
      popular: false
    },
    {
      name: "Patron Annual",
      plan: "patron_annual",
      price: `${pricingData.currency} ${pricingData.patron_annual.toFixed(2)}`,
      period: "/Jahr",
      description: "Teams + Credit-basierte Generierung",
      features: [
        "Teams freigeschaltet",
        "Private Templates",
        "5 Credits pro Generierung",
        "Credits nach Bedarf kaufen",
        "5 kostenlose Support-Tickets/Monat"
      ],
      buttonText: "Patron Annual wählen",
      buttonClass: "p-button-primary",
      popular: true
    },
    {
      name: "Patron Monthly",
      plan: "patron_monthly",
      price: `${pricingData.currency} ${pricingData.patron_monthly.toFixed(2)}`,
      //price: `€ ${pricingData.patron_monthly.toFixed(2)}`,
      period: "/Monat",
      description: "Alles unbegrenzt",
      features: [
        "Unbegrenzt alles",
        "Keine Credits benötigt",
        "Unbegrenzte Projekte",
        "Unbegrenzte Datenbanken",
        "5 kostenlose Support-Tickets/Monat"
      ],
      buttonText: "Patron Monthly wählen",
      buttonClass: "p-button-help",
      popular: false
    }
  ];

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
      // Set flag to redirect to app after login
      localStorage.setItem('redirect_after_login', '/app');
      setActiveModal('login');
    }
  };

  const handleLogout = () => {
    // Clear all sessionStorage
    sessionStorage.clear();

    // Clear all localStorage (including layout, navigation state, etc.)
    localStorage.clear();

    // Set logout flag after clearing (to prevent login modal popup in app)
    localStorage.setItem('logout_in_progress', 'true');

    // Clear cookies
    document.cookie = 'remember_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';

    setUserData(null);
    setIsAuthenticated(false);
    window.location.reload();
  };

  const handleLoginSuccess = () => {
    // After successful login, check auth state from both storages
    const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token') || sessionStorage.getItem('access_token');
    if (token) {
      setIsAuthenticated(true);
      loadUserData();
      setActiveModal(null);

      // Check if we should redirect after login
      const redirectUrl = localStorage.getItem('redirect_after_login');
      if (redirectUrl) {
        localStorage.removeItem('redirect_after_login');
        setTimeout(() => {
          window.location.href = redirectUrl;
        }, 100); // Small delay to ensure state is updated
      }
    }
  };


  const handleOpenHomeOnStartChange = (checked: boolean) => {
    setOpenHomeOnStart(checked);
    localStorage.setItem('open_home_on_start', checked.toString());
  };

  const handleOpenVideoModal = () => {
    setShowVideoModal(true);
  };

  const handleCloseVideoModal = () => {
    setShowVideoModal(false);
  };

  return (
    <>
      <Head title="Scoriet - Enterprise Code Generator" />

      {/* Toast Notification Component */}
      <Toast
        ref={toast}
        position="top-right"
        style={{ zIndex: 9999 }}
      />

      <div className="min-h-screen bg-gray-900 text-white overflow-y-auto max-h-screen">
        {/* Settings Panel (only shown in tab view) */}
        {isAuthenticated && (window.location.pathname === '/app' || window.location.pathname === '/demo-login') && (
          <div className="bg-gray-800 border-b border-gray-700 p-3">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Badge value={t.landingpage304} severity="info" />
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      inputId="openHomeOnStart"
                      checked={openHomeOnStart}
                      onChange={(e) => handleOpenHomeOnStartChange(e.checked!)}
                    />
                    <label htmlFor="openHomeOnStart" className="text-gray-300 text-sm cursor-pointer">
                      {t.landingpage311}
                    </label>
                  </div>
                </div>
                <div className="text-xs text-gray-400">
                  {t.landingpage316}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
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

        {/* Hero Section */}
        <section className="py-20 bg-gradient-to-br from-gray-900 via-gray-800 to-blue-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-5xl font-bold mb-6">
              <span className="text-blue-400">{t.title}</span>
            </h1>
            <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
              {t.subtitle}
            </p>

            <div className="flex justify-center gap-2">
              {!isDemoMode ? (
                <Button
                  label={t.startFree}
                  icon="pi pi-flag"
                  className="p-button-primary"
                  style={{ borderRadius: '8px', paddingTop: '8px', paddingBottom: '8px' }}
                  onClick={() => handleOpenModal('register')}
                />
              ) : (
                <Button
                  label={t.tryDemo}
                  className="p-button-primary"
                  style={{ borderRadius: '8px', paddingTop: '8px', paddingBottom: '8px' }}
                  onClick={() => handleOpenModal('login')}
                />
              )}
              <Button
                label={t.watchDemo}
                icon="pi pi-play"
                className="p-button-outlined p-button-primary"
                style={{ borderRadius: '8px', paddingTop: '8px', paddingBottom: '8px' }}
                onClick={handleOpenVideoModal}
              />
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center mb-12">
              {t.featuresTitle}
            </h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature, index) => (
                <Card key={index} className="bg-gray-700 border-gray-600 text-center">
                  <div className="flex flex-col items-center p-6">
                    <div className="mb-4">{feature.icon}</div>
                    <h3 className="text-xl font-semibold mb-3 text-white">{feature.title}</h3>
                    <p className="text-gray-300">{feature.description}</p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Section - Only for non-authenticated users */}
        {!isAuthenticated && (
          <section className="py-20 bg-gray-900">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="text-3xl font-bold text-center mb-4">
                {t.pricingTitle}
              </h2>
              <p className="text-gray-400 text-center mb-12">
                {t.pricingSubtitle}
              </p>

              <div className="grid md:grid-cols-3 gap-6 max-w-7xl mx-auto">
                {pricingTiers.map((tier, index) => (
                  <Card
                    key={index}
                    className={`relative ${tier.popular ? 'border-2 border-blue-500 bg-gray-750' : 'bg-gray-800 border-gray-600'}`}
                  >
                    {tier.popular && (
                      <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                        <Badge value={t.landingpage479} severity="info" className="px-3 py-1" />
                      </div>
                    )}

                    <div className="p-6 text-center">
                      <h3 className="text-2xl font-bold mb-2 text-white flex items-center justify-center">
                        {tier.name}
                        {(tier.name === "Patron Annual" || tier.name === "Patron Monthly") && <HeartIcon className="w-6 h-6 text-red-500 ml-2" />}
                      </h3>

                      <div className="mb-4">
                        <span className="text-4xl font-bold text-white">{tier.price}</span>
                        <span className="text-gray-400">{tier.period}</span>
                        {tier.yearlyPrice && (
                          <div className="text-sm text-green-400 mt-1">
                            Save 17%: {tier.yearlyPrice}
                          </div>
                        )}
                      </div>

                      <p className="text-gray-400 mb-6">{tier.description}</p>

                      <ul className="space-y-3 mb-8">
                        {tier.features.map((feature, i) => (
                          <li key={i} className="flex items-center text-gray-300">
                            <CheckIcon className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" />
                            {feature}
                          </li>
                        ))}
                      </ul>

                      <Button
                        label={tier.name === 'Free' ? tier.buttonText : t.registerFirst || 'Registrieren & Plan wählen'}
                        className={`${tier.buttonClass} w-full`}
                        onClick={() => {
                          // All buttons open registration for non-authenticated users
                          if (!isDemoMode) {
                            handleOpenModal('register');
                          } else {
                            handleOpenModal('login');
                          }
                        }}
                      />
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Call to Action */}
        <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
          <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold mb-4">
              {t.ctaTitle}
            </h2>
            <p className="text-xl mb-8 text-blue-100">
              {t.ctaSubtitle}
            </p>
            <div className="flex justify-center gap-2">
              {isAuthenticated ? (
                <Button
                  label={t.goToApp || 'Zur App'}
                  className="p-button-secondary"
                  style={{ borderRadius: '8px', paddingTop: '8px', paddingBottom: '8px' }}
                  onClick={() => window.location.href = '/app'}
                />
              ) : !isDemoMode ? (
                <Button
                  label={t.startFreeTrial}
                  className="p-button-secondary"
                  style={{ borderRadius: '8px', paddingTop: '8px', paddingBottom: '8px' }}
                  onClick={() => handleOpenModal('register')}
                />
              ) : (
                <Button
                  label={t.tryDemoNow}
                  className="p-button-secondary"
                  style={{ borderRadius: '8px', paddingTop: '8px', paddingBottom: '8px' }}
                  onClick={() => handleOpenModal('login')}
                />
              )}
              <Button
                label={t.contactSales}
                className="p-button-outlined"
                style={{ borderColor: 'white', color: 'white', borderRadius: '8px', paddingTop: '8px', paddingBottom: '8px' }}
              />
            </div>
          </div>
        </section>

        {/* Current Plan Section - Only for Authenticated Users */}
        {isAuthenticated && (
          <section className="py-16 bg-gray-800 border-y border-gray-700">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-white mb-4">
                  {t.landingpage573} {userData?.name || 'User'}! 👋
                </h2>
                <p className="text-xl text-gray-300 mb-4">
                  {t.currentPlan} <span className="text-blue-400 font-semibold">{t.freeLabel} Plan</span>
                </p>
                <Badge value={t.freeTier} severity="info" className="text-lg px-4 py-2" />
              </div>
              
              <div className="grid md:grid-cols-3 gap-6 max-w-7xl mx-auto">
                {pricingTiers.map((plan, index) => (
                  <Card 
                    key={index}
                    className={`p-6 text-center ${plan.popular ? 'ring-2 ring-blue-500 bg-gray-700' : 'bg-gray-700'} border border-gray-600`}
                  >
                    <div className="mb-4">
                      {plan.popular && (
                        <Badge value={t.landingpage589} severity="info" className="mb-4" />
                      )}
                  <h3 className="text-2xl font-bold text-white mb-2 flex items-center justify-center">
                    {plan.name}
                    {(plan.name === "Patron Annual" || plan.name === "Patron Monthly") && <HeartIcon className="w-6 h-6 text-red-500 ml-2" />}
                  </h3>
                      <div className="text-3xl font-bold text-blue-400 mb-2">
                        {plan.price}
                        {(plan.name === "Patron Annual" || plan.name === "Patron Monthly") && (
                          <span className="text-lg text-gray-400">{plan.period}</span>
                        )}
                      </div>
                      <p className="text-gray-300 mb-6">{plan.description}</p>
                    </div>
                    
                    <ul className="text-left text-gray-300 mb-8 space-y-2">
                      {plan.features.map((feature, fIndex) => (
                        <li key={fIndex} className="flex items-center">
                          <CheckIcon className="w-5 h-5 text-green-400 mr-2 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    
                    <Button
                      label={plan.name === t.freeLabel ? t.currentPlanButton : `${t.upgradeTo} ${plan.name}`}
                      className={plan.name === t.freeLabel ? 'p-button-secondary' : plan.buttonClass}
                      style={{ borderRadius: '8px', paddingTop: '8px', paddingBottom: '8px' }}
                      disabled={plan.name === t.freeLabel}
                      onClick={() => plan.name !== t.freeLabel && setShowPlanModal(true)}
                    />
                  </Card>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Footer */}
        <footer className="bg-gray-800 border-t border-gray-700 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-4 gap-8">
              <div>
                <h3 className="text-lg font-semibold mb-4 text-white">Scoriet</h3>
                <p className="text-gray-400 mb-4">
                  {t.landingpage630}
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
                  <li><a href={`/${currentLanguage}/downloads`} className="hover:text-white">{t.downloadsLink}</a></li>
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
              <p>{t.allRightsReserved}.</p>
              <div className="flex space-x-6">
                <a href="#" className="hover:text-white">{t.privacyPolicy}</a>
                <a href="#" className="hover:text-white">{t.termsOfService}</a>
              </div>
            </div>
          </div>
        </footer>
      </div>

      {/* Video Modal */}
      <Dialog
        visible={showVideoModal}
        onHide={handleCloseVideoModal}
        modal
        header="Scoriet Demo"
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

      {/* Plan Selection Modal - uses the unified PlanModal component */}
      <PlanModal
        visible={showPlanModal}
        onHide={() => setShowPlanModal(false)}
        initialTab={0}
      />

      {/* Auth Modals */}
      <AuthModalManager
        activeModal={activeModal}
        onCloseModal={handleCloseModal}
        isLoginClosable={true} // On landing page, login is always closable
        onLoginSuccess={handleLoginSuccess}
        onRegistrationSuccess={(message: string) => {
          handleCloseModal();

          // Show success notification
          setTimeout(() => {
            if (toast.current) {
              toast.current.show({
                severity: 'success',
                summary: 'Registration Successful',
                detail: message,
                life: 8000, // 8 seconds
                closable: true
              });
            }
          }, 300); // 300ms delay for modal closing animation
        }}
        currentLanguage={currentLanguage}
      />
    </>
  );
}