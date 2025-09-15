import React, { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { Badge } from 'primereact/badge';
import { Divider } from 'primereact/divider';
import { Checkbox } from 'primereact/checkbox';
import { Dialog } from 'primereact/dialog';
import { 
  CodeBracketIcon as CodeIcon, 
  CircleStackIcon as DatabaseIcon, 
  DocumentTextIcon as TemplateIcon, 
  SparklesIcon,
  CheckIcon,
  HeartIcon
} from '@heroicons/react/24/outline';
import AuthModalManager, { AuthModalType } from '@/Components/AuthModals/AuthModalManager';

interface UserData {
  id?: number;
  name: string;
  email: string;
  email_verified_at?: string;
}

export default function LandingPage() {
  const [activeModal, setActiveModal] = useState<AuthModalType>(null);
  const [showVideoModal, setShowVideoModal] = useState<boolean>(false);
  const [showPlanModal, setShowPlanModal] = useState<boolean>(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [openHomeOnStart, setOpenHomeOnStart] = useState<boolean>(() => {
    const setting = localStorage.getItem('open_home_on_start');
    return setting === null || setting === 'true';
  });

  // Check if this is a demo installation
  const isDemoMode = import.meta.env.VITE_SCORIET_DEMO === 'true';

  // Check authentication on component mount
  useEffect(() => {
    const checkAuth = () => {
      // Clear logout flag when arriving at lobby
      localStorage.removeItem('logout_in_progress');
      
      const token = localStorage.getItem('access_token');
      const isAuth = !!token;
      setIsAuthenticated(isAuth);
      if (isAuth && !userData) {
        loadUserData();
      }
    };
    
    checkAuth();
  }, [userData]);


  const loadUserData = async () => {
    try {
      const token = localStorage.getItem('access_token');
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
    } catch (err) {
      console.error('Error loading user data:', err);
    }
  };

  const features = [
    {
      icon: <DatabaseIcon className="w-8 h-8 text-blue-500" />,
      title: "SQL Parser",
      description: "Intelligent MySQL database schema parsing with support for complex relationships and constraints."
    },
    {
      icon: <TemplateIcon className="w-8 h-8 text-green-500" />,
      title: "Template System",
      description: "Powerful templating engine with JavaScript execution for dynamic code generation."
    },
    {
      icon: <CodeIcon className="w-8 h-8 text-purple-500" />,
      title: "Multi-Language Support",
      description: "Generate code for PHP, JavaScript, TypeScript, Python and more with customizable templates."
    },
    {
      icon: <SparklesIcon className="w-8 h-8 text-yellow-500" />,
      title: "Modern Interface",
      description: "Intuitive dock-based MDI interface with tab stacking and floating panels."
    }
  ];

  const pricingTiers = [
    {
      name: "Free",
      price: "€0",
      period: "forever",
      description: "Perfect for personal projects",
      features: [
        "Up to 3 projects",
        "Basic templates", 
        "SQL schema parsing",
        "Community support"
      ],
      buttonText: "Start Free",
      buttonClass: "p-button-outlined",
      popular: false
    },
    {
      name: "Premium", 
      price: "€2.99",
      period: "/month",
      yearlyPrice: "€29.99/year",
      description: "Best for professional developers",
      features: [
        "Unlimited projects",
        "Advanced templates",
        "Custom template creation",
        "Priority support",
        "Advanced SQL features",
        "Team collaboration"
      ],
      buttonText: "Go Premium",
      buttonClass: "p-button-primary",
      popular: true
    },
    {
      name: "Patron",
      price: "€5+",
      period: "/month",
      description: "Support the community",
      features: [
        "All Premium features",
        "Early access to features",
        "Influence development",
        "Community Discord access",
        "Custom amount (€5-50+)"
      ],
      buttonText: "Become Patron",
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
    localStorage.removeItem('access_token');
    localStorage.removeItem('auth_token'); // if using different key
    setUserData(null);
    setIsAuthenticated(false);
    window.location.reload();
  };

  const handleLoginSuccess = () => {
    // After successful login, check auth state
    const token = localStorage.getItem('access_token');
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
      
      <div className="min-h-screen bg-gray-900 text-white overflow-y-auto max-h-screen">
        {/* Settings Panel (only shown in tab view) */}
        {isAuthenticated && window.location.pathname === '/app' && (
          <div className="bg-gray-800 border-b border-gray-700 p-3">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Badge value="Welcome Tab" severity="info" />
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      inputId="openHomeOnStart"
                      checked={openHomeOnStart}
                      onChange={(e) => handleOpenHomeOnStartChange(e.checked!)}
                    />
                    <label htmlFor="openHomeOnStart" className="text-gray-300 text-sm cursor-pointer">
                      Open this tab on app start
                    </label>
                  </div>
                </div>
                <div className="text-xs text-gray-400">
                  Close this tab to focus on your projects
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
                <img 
                  src="/images/logos/scoriet-logo.png" 
                  alt="Scoriet Logo" 
                  className="h-8 w-auto"
                />
                <Badge value="BETA" severity="info" className="ml-2" />
              </div>
              
              <div className="flex items-center gap-2">
                {!isAuthenticated ? (
                  <>
                    <Button 
                      label="Login" 
                      className="p-button-text"
                      style={{ borderRadius: '8px', paddingTop: '6px', paddingBottom: '6px' }}
                      onClick={() => handleOpenModal('login')}
                    />
                    {!isDemoMode && (
                      <Button 
                        label="Register" 
                        className="p-button-outlined"
                        style={{ borderRadius: '8px', paddingTop: '6px', paddingBottom: '6px' }}
                        onClick={() => handleOpenModal('register')}
                      />
                    )}
                  </>
                ) : (
                  <>
                    <Button 
                      label="Profile"
                      icon="pi pi-user"
                      className="p-button-text"
                      style={{ borderRadius: '8px', paddingTop: '6px', paddingBottom: '6px' }}
                      onClick={() => setActiveModal('profile')}
                    />
                    <Button 
                      label="Change Plan"
                      icon="pi pi-credit-card"
                      className="p-button-outlined p-button-info"
                      style={{ borderRadius: '8px', paddingTop: '6px', paddingBottom: '6px' }}
                      onClick={() => setShowPlanModal(true)}
                    />
                    <Button 
                      label="Logout"
                      icon="pi pi-sign-out"
                      className="p-button-outlined"
                      style={{ borderRadius: '8px', paddingTop: '6px', paddingBottom: '6px' }}
                      onClick={handleLogout}
                    />
                  </>
                )}
                
                <Button 
                  label="Goto App" 
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
              Enterprise <span className="text-blue-400">Code Generator</span>
            </h1>
            <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
              Transform your database schemas into production-ready code with intelligent templates. 
              Reduce development time by 80% with automated code generation.
            </p>
            
            <div className="flex justify-center gap-2">
              {!isDemoMode ? (
              <Button 
                label="Start Free" 
                className="p-button-primary"
                style={{ borderRadius: '8px', paddingTop: '8px', paddingBottom: '8px' }}
                onClick={() => handleOpenModal('register')}
              />
            ) : (
              <Button 
                label="Try Demo" 
                className="p-button-primary"
                style={{ borderRadius: '8px', paddingTop: '8px', paddingBottom: '8px' }}
                onClick={() => handleOpenModal('login')}
              />
            )}
              <Button 
                label="Watch Demo" 
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
              Powerful Features for Modern Development
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

        {/* Pricing Section */}
        <section className="py-20 bg-gray-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center mb-4">
              Choose Your Plan
            </h2>
            <p className="text-gray-400 text-center mb-12">
              Start free, upgrade when you're ready to scale
            </p>
            
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {pricingTiers.map((tier, index) => (
                <Card 
                  key={index} 
                  className={`relative ${tier.popular ? 'border-2 border-blue-500 bg-gray-750' : 'bg-gray-800 border-gray-600'}`}
                >
                  {tier.popular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <Badge value="MOST POPULAR" severity="info" className="px-3 py-1" />
                    </div>
                  )}
                  
                  <div className="p-6 text-center">
                    <h3 className="text-2xl font-bold mb-2 text-white flex items-center justify-center">
                      {tier.name}
                      {tier.name === 'Patreon' && <HeartIcon className="w-6 h-6 text-red-500 ml-2" />}
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
                      label={tier.buttonText}
                      className={`${tier.buttonClass} w-full`}
                      onClick={() => {
                        if (tier.name === 'Free') {
                          if (!isDemoMode) {
                            handleOpenModal('register');
                          } else {
                            handleOpenModal('login');
                          }
                        } else {
                          // Handle premium/patron signup
                          // Subscribe to ${tier.name}
                        }
                      }}
                    />
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
          <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold mb-4">
              Ready to 10x Your Development Speed?
            </h2>
            <p className="text-xl mb-8 text-blue-100">
              Join thousands of developers who are already using Scoriet to build better software faster.
            </p>
            <div className="flex justify-center gap-2">
              {!isDemoMode ? (
                <Button 
                  label="Start Free Trial"
                  className="p-button-secondary"
                  style={{ borderRadius: '8px', paddingTop: '8px', paddingBottom: '8px' }}
                  onClick={() => handleOpenModal('register')}
                />
              ) : (
                <Button 
                  label="Try Demo Now"
                  className="p-button-secondary"
                  style={{ borderRadius: '8px', paddingTop: '8px', paddingBottom: '8px' }}
                  onClick={() => handleOpenModal('login')}
                />
              )}
              <Button 
                label="Contact Sales"
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
                  Welcome back, {userData?.name || 'User'}! 👋
                </h2>
                <p className="text-xl text-gray-300 mb-4">
                  You're currently on the <span className="text-blue-400 font-semibold">Free Plan</span>
                </p>
                <Badge value="Free Tier" severity="info" className="text-lg px-4 py-2" />
              </div>
              
              <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                {pricingTiers.map((plan, index) => (
                  <Card 
                    key={index}
                    className={`p-6 text-center ${plan.popular ? 'ring-2 ring-blue-500 bg-gray-700' : 'bg-gray-700'} border border-gray-600`}
                  >
                    <div className="mb-4">
                      {plan.popular && (
                        <Badge value="MOST POPULAR" severity="info" className="mb-4" />
                      )}
                      <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                      <div className="text-3xl font-bold text-blue-400 mb-2">
                        {plan.price}
                        {plan.price !== 'Free' && plan.price !== 'Custom' && (
                          <span className="text-lg text-gray-400">/month</span>
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
                      label={plan.name === 'Free' ? 'Current Plan' : `Upgrade to ${plan.name}`}
                      className={plan.name === 'Free' ? 'p-button-secondary' : plan.buttonClass}
                      style={{ borderRadius: '8px', paddingTop: '8px', paddingBottom: '8px' }}
                      disabled={plan.name === 'Free'}
                      onClick={() => plan.name !== 'Free' && alert(`Upgrading to ${plan.name} - Coming Soon!`)}
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
                  The future of code generation. Built by developers, for developers.
                </p>
                <div className="flex space-x-4">
                  <Button icon="pi pi-github" className="p-button-text p-button-rounded" />
                  <Button icon="pi pi-twitter" className="p-button-text p-button-rounded" />
                  <Button icon="pi pi-discord" className="p-button-text p-button-rounded" />
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-4 text-white">Product</h4>
                <ul className="space-y-2 text-gray-400">
                  <li><a href="#" className="hover:text-white">Features</a></li>
                  <li><a href="#" className="hover:text-white">Pricing</a></li>
                  <li><a href="#" className="hover:text-white">Templates</a></li>
                  <li><a href="#" className="hover:text-white">Examples</a></li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-4 text-white">Resources</h4>
                <ul className="space-y-2 text-gray-400">
                  <li><a href="#" className="hover:text-white">Documentation</a></li>
                  <li><a href="#" className="hover:text-white">API Reference</a></li>
                  <li><a href="#" className="hover:text-white">Tutorials</a></li>
                  <li><a href="#" className="hover:text-white">Blog</a></li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-4 text-white">Support</h4>
                <ul className="space-y-2 text-gray-400">
                  <li><a href="#" className="hover:text-white">Help Center</a></li>
                  <li><a href="#" className="hover:text-white">Community</a></li>
                  <li><a href="#" className="hover:text-white">Contact Us</a></li>
                  <li><a href="#" className="hover:text-white">Status</a></li>
                </ul>
              </div>
            </div>
            
            <Divider />
            
            <div className="flex justify-between items-center text-gray-400">
              <p>&copy; 2025 Scoriet. All rights reserved.</p>
              <div className="flex space-x-6">
                <a href="#" className="hover:text-white">Privacy Policy</a>
                <a href="#" className="hover:text-white">Terms of Service</a>
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
            Ihr Browser unterstützt das Video-Element nicht.
          </video>
        </div>
      </Dialog>

      {/* Plan Selection Modal */}
      <Dialog
        visible={showPlanModal}
        onHide={() => setShowPlanModal(false)}
        modal
        header="Choose Your Plan"
        style={{ width: '90vw', maxWidth: '1000px' }}
        contentStyle={{ padding: '20px', backgroundColor: '#111827', color: 'white' }}
        headerStyle={{ backgroundColor: '#1f2937', color: 'white', border: 'none' }}
        className="plan-modal"
      >
        <div className="space-y-6">
          {/* Current Plan Status */}
          <div className="bg-gray-800 p-4 rounded-lg border-l-4 border-l-blue-400">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-white">Current Plan</h3>
              <Badge value="Free" severity="info" />
            </div>
            <p className="text-gray-300">
              You're currently on the <strong className="text-blue-400">Free plan</strong>. Upgrade to unlock more features and support the project!
            </p>
          </div>

          {/* Plans Grid */}
          <div className="grid md:grid-cols-3 gap-6">
            {pricingTiers.map((plan, index) => (
              <Card 
                key={index}
                className={`text-center ${plan.popular ? 'ring-2 ring-blue-400 bg-gray-700' : 'bg-gray-700'} border border-gray-600 hover:shadow-xl transition-shadow`}
              >
                <div className="p-6">
                  {plan.popular && (
                    <Badge value="MOST POPULAR" severity="info" className="mb-4" />
                  )}
                  <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                  <div className="text-3xl font-bold text-blue-400 mb-2">
                    {plan.price}
                    {plan.price !== 'Free' && plan.price !== 'Custom' && (
                      <span className="text-lg text-gray-400">/month</span>
                    )}
                  </div>
                  <p className="text-gray-300 mb-6">{plan.description}</p>
                  
                  <ul className="text-left text-gray-300 mb-8 space-y-2">
                    {plan.features.map((feature, fIndex) => (
                      <li key={fIndex} className="flex items-center">
                        <CheckIcon className="w-5 h-5 text-green-400 mr-2 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  
                  <Button 
                    label={plan.name === 'Free' ? 'Current Plan' : `Choose ${plan.name}`}
                    className={plan.name === 'Free' ? 'p-button-secondary w-full' : `${plan.buttonClass} w-full`}
                    style={{ borderRadius: '8px', paddingTop: '10px', paddingBottom: '10px' }}
                    disabled={plan.name === 'Free'}
                    onClick={() => {
                      if (plan.name !== 'Free') {
                        alert(`Upgrading to ${plan.name} - Payment integration coming soon!`);
                        setShowPlanModal(false);
                      }
                    }}
                  />
                </div>
              </Card>
            ))}
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
        isLoginClosable={true} // On landing page, login is always closable
        onLoginSuccess={handleLoginSuccess}
        onRegistrationSuccess={() => {
          handleCloseModal();
          // Could redirect to welcome flow or stay on landing
        }}
      />
    </>
  );
}