import React, { useState } from 'react';
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

interface LandingPageProps {
  isAuthenticated?: boolean;
}

export default function LandingPage({ isAuthenticated = false }: LandingPageProps) {
  const [activeModal, setActiveModal] = useState<AuthModalType>(null);
  const [showVideoModal, setShowVideoModal] = useState<boolean>(false);
  const [openHomeOnStart, setOpenHomeOnStart] = useState<boolean>(() => {
    const setting = localStorage.getItem('open_home_on_start');
    return setting === null || setting === 'true';
  });

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
      name: "Patreon",
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
      setActiveModal('login');
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
                <h1 className="text-2xl font-bold text-blue-400">Scoriet</h1>
                <Badge value="BETA" severity="info" className="ml-2" />
              </div>
              
              <div className="flex items-center space-x-4">
                {!isAuthenticated ? (
                  <>
                    <Button 
                      label="Login" 
                      className="p-button-text"
                      onClick={() => handleOpenModal('login')}
                    />
                    <Button 
                      label="Register" 
                      className="p-button-outlined"
                      onClick={() => handleOpenModal('register')}
                    />
                  </>
                ) : (
                  <span className="text-green-400 mr-4">Welcome back!</span>
                )}
                
                <Button 
                  label="Goto App" 
                  icon="pi pi-arrow-right"
                  className="p-button-primary"
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
            
            <div className="flex justify-center space-x-4">
              <Button 
                label="Start Free" 
                size="large"
                className="p-button-primary p-button-lg"
                onClick={() => handleOpenModal('register')}
              />
              <Button 
                label="Watch Demo" 
                size="large" 
                icon="pi pi-play"
                className="p-button-outlined p-button-lg"
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
                          handleOpenModal('register');
                        } else {
                          // Handle premium/patreon signup
                          console.log(`Subscribe to ${tier.name}`);
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
            <div className="flex justify-center space-x-4">
              <Button 
                label="Start Free Trial"
                size="large"
                className="p-button-secondary p-button-lg"
                onClick={() => handleOpenModal('register')}
              />
              <Button 
                label="Contact Sales"
                size="large"
                className="p-button-outlined p-button-lg"
                style={{ borderColor: 'white', color: 'white' }}
              />
            </div>
          </div>
        </section>

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

      {/* Auth Modals */}
      <AuthModalManager
        activeModal={activeModal}
        onCloseModal={handleCloseModal}
        isLoginClosable={true} // On landing page, login is always closable
        onLoginSuccess={() => {
          window.dispatchEvent(new Event('storage'));
          handleCloseModal();
          // Redirect to app after successful login
          setTimeout(() => {
            window.location.href = '/app';
          }, 1000);
        }}
        onRegistrationSuccess={() => {
          handleCloseModal();
          // Could redirect to welcome flow or stay on landing
        }}
      />
    </>
  );
}