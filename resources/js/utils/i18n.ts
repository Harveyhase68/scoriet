// Translation system for Scoriet Lobby
export type SupportedLanguage = 'en' | 'de' | 'fr' | 'es' | 'it';

export interface LanguageOption {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  flag: string; // CSS flag class or fallback emoji
  flagClass: string; // CSS class for flag icons
}

export const supportedLanguages: LanguageOption[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸', flagClass: 'flag-us' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪', flagClass: 'flag-de' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷', flagClass: 'flag-fr' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸', flagClass: 'flag-es' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹', flagClass: 'flag-it' },
];

export interface Translations {
  // Header buttons
  login: string;
  register: string;
  profile: string;
  changePlan: string;
  logout: string;
  gotoApp: string;

  // Hero section
  title: string;
  subtitle: string;
  startFree: string;
  tryDemo: string;
  watchDemo: string;

  // Features
  featuresTitle: string;
  sqlParserTitle: string;
  sqlParserDesc: string;
  templateSystemTitle: string;
  templateSystemDesc: string;
  multiLanguageTitle: string;
  multiLanguageDesc: string;
  modernInterfaceTitle: string;
  modernInterfaceDesc: string;

  // Pricing
  pricingTitle: string;
  pricingSubtitle: string;
  freeLabel: string;
  premiumLabel: string;
  patronLabel: string;
  goStartFree: string;
  goPremium: string;
  becomePatron: string;

  // Call to action
  ctaTitle: string;
  ctaSubtitle: string;
  startFreeTrial: string;
  tryDemoNow: string;
  contactSales: string;

  // Welcome section
  welcomeBack: string;
  currentPlan: string;
  freeTier: string;
  currentPlanButton: string;
  upgradeTo: string;

  // Profile Modal
  profileTitle: string;
  profileTab: string;
  passwordTab: string;
  deleteTab: string;
  fullName: string;
  emailAddress: string;
  preferredLanguage: string;
  languageDescription: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  updateProfile: string;
  updating: string;
  changePassword: string;
  changing: string;
  deleteAccount: string;
  deleting: string;
  profileUpdateSuccess: string;
  passwordChangeSuccess: string;

  // Footer
  productLabel: string;
  featuresLink: string;
  pricingLink: string;
  templatesLink: string;
  examplesLink: string;
  resourcesLabel: string;
  documentationLink: string;
  apiReferenceLink: string;
  tutorialsLink: string;
  blogLink: string;
  supportLabel: string;
  helpCenterLink: string;
  communityLink: string;
  contactUsLink: string;
  statusLink: string;
  privacyPolicy: string;
  termsOfService: string;
  allRightsReserved: string;

  //LoginModal.tsx
  DemoTextHeader: string;

}

const translations: Record<SupportedLanguage, Translations> = {
  en: {
    login: 'Login',
    register: 'Register',
    profile: 'Profile',
    changePlan: 'Change Plan',
    logout: 'Logout',
    gotoApp: 'Goto App',

    title: 'Enterprise Code Generator',
    subtitle: 'Transform your database schemas into production-ready code with intelligent templates. Reduce development time by 80% with automated code generation.',
    startFree: 'Start Free', 
    tryDemo: 'Try Demo',
    watchDemo: 'Watch Demo',

    featuresTitle: 'Powerful Features for Modern Development',
    sqlParserTitle: 'SQL Parser',
    sqlParserDesc: 'Intelligent MySQL database schema parsing with support for complex relationships and constraints.',
    templateSystemTitle: 'Template System',
    templateSystemDesc: 'Powerful templating engine with JavaScript execution for dynamic code generation.',
    multiLanguageTitle: 'Multi-Language Support',
    multiLanguageDesc: 'Generate code for PHP, JavaScript, TypeScript, Python and more with customizable templates.',
    modernInterfaceTitle: 'Modern Interface',
    modernInterfaceDesc: 'Intuitive dock-based MDI interface with tab stacking and floating panels.',

    pricingTitle: 'Choose Your Plan',
    pricingSubtitle: 'Start free, upgrade when you\'re ready to scale',
    freeLabel: 'Free',
    premiumLabel: 'Premium',
    patronLabel: 'Patron',
    goStartFree: 'Start Free',
    goPremium: 'Go Premium',
    becomePatron: 'Become Patron',

    ctaTitle: 'Ready to 10x Your Development Speed?',
    ctaSubtitle: 'Join thousands of developers who are already using Scoriet to build better software faster.',
    startFreeTrial: 'Start Free Trial',
    tryDemoNow: 'Try Demo Now',
    contactSales: 'Contact Sales',

    welcomeBack: 'Welcome back',
    currentPlan: 'You\'re currently on the',
    freeTier: 'Free Tier',
    currentPlanButton: 'Current Plan',
    upgradeTo: 'Upgrade to',

    // Profile Modal
    profileTitle: 'Profile Settings',
    profileTab: 'Profile',
    passwordTab: 'Change Password',
    deleteTab: 'Delete Account',
    fullName: 'Full Name',
    emailAddress: 'Email Address',
    preferredLanguage: 'Preferred Language',
    languageDescription: 'Choose your preferred language for the application interface',
    currentPassword: 'Current Password',
    newPassword: 'New Password',
    confirmPassword: 'Confirm New Password',
    updateProfile: 'Update Profile',
    updating: 'Updating...',
    changePassword: 'Change Password',
    changing: 'Changing...',
    deleteAccount: 'Delete Account',
    deleting: 'Deleting...',
    profileUpdateSuccess: 'Profile updated successfully',
    passwordChangeSuccess: 'Password changed successfully',

    productLabel: 'Product',
    featuresLink: 'Features',
    pricingLink: 'Pricing',
    templatesLink: 'Templates',
    examplesLink: 'Examples',
    resourcesLabel: 'Resources',
    documentationLink: 'Documentation',
    apiReferenceLink: 'API Reference',
    tutorialsLink: 'Tutorials',
    blogLink: 'Blog',
    supportLabel: 'Support',
    helpCenterLink: 'Help Center',
    communityLink: 'Community',
    contactUsLink: 'Contact Us',
    statusLink: 'Status',
    privacyPolicy: 'Privacy Policy',
    termsOfService: 'Terms of Service',
    allRightsReserved: 'All rights reserved',
    DemoTextHeader: 'Demo mode available',
  },
  de: {
    login: 'Anmelden',
    register: 'Registrieren',
    profile: 'Profil',
    changePlan: 'Plan ändern',
    logout: 'Abmelden',
    gotoApp: 'Zur App',

    title: 'Enterprise Code Generator',
    subtitle: 'Verwandeln Sie Ihre Datenbankschemas in produktionsreifen Code mit intelligenten Templates. Reduzieren Sie die Entwicklungszeit um 80% durch automatisierte Code-Generierung.',
    startFree: 'Kostenlos starten',
    tryDemo: 'Demo testen',
    watchDemo: 'Demo ansehen',

    featuresTitle: 'Mächtige Features für moderne Entwicklung',
    sqlParserTitle: 'SQL Parser',
    sqlParserDesc: 'Intelligente MySQL-Datenbankschema-Parsing mit Unterstützung für komplexe Beziehungen und Constraints.',
    templateSystemTitle: 'Template System',
    templateSystemDesc: 'Mächtige Template-Engine mit JavaScript-Ausführung für dynamische Code-Generierung.',
    multiLanguageTitle: 'Multi-Sprachen Support',
    multiLanguageDesc: 'Generieren Sie Code für PHP, JavaScript, TypeScript, Python und mehr mit anpassbaren Templates.',
    modernInterfaceTitle: 'Moderne Oberfläche',
    modernInterfaceDesc: 'Intuitive dock-basierte MDI-Oberfläche mit Tab-Stapelung und schwebenden Panels.',

    pricingTitle: 'Wählen Sie Ihren Plan',
    pricingSubtitle: 'Starten Sie kostenlos, upgraden Sie wenn Sie bereit zum Skalieren sind',
    freeLabel: 'Kostenlos',
    premiumLabel: 'Premium',
    patronLabel: 'Patron',
    goStartFree: 'Kostenlos starten',
    goPremium: 'Premium werden',
    becomePatron: 'Patron werden',

    ctaTitle: 'Bereit Ihre Entwicklungsgeschwindigkeit zu verzehnfachen?',
    ctaSubtitle: 'Schließen Sie sich tausenden von Entwicklern an, die bereits Scoriet verwenden, um bessere Software schneller zu entwickeln.',
    startFreeTrial: 'Kostenlose Testversion starten',
    tryDemoNow: 'Demo jetzt testen',
    contactSales: 'Vertrieb kontaktieren',

    welcomeBack: 'Willkommen zurück',
    currentPlan: 'Sie sind derzeit im',
    freeTier: 'Kostenlos Plan',
    currentPlanButton: 'Aktueller Plan',
    upgradeTo: 'Upgrade auf',

    // Profile Modal
    profileTitle: 'Profil Einstellungen',
    profileTab: 'Profil',
    passwordTab: 'Passwort ändern',
    deleteTab: 'Konto löschen',
    fullName: 'Vollständiger Name',
    emailAddress: 'E-Mail-Adresse',
    preferredLanguage: 'Bevorzugte Sprache',
    languageDescription: 'Wählen Sie Ihre bevorzugte Sprache für die Anwendungsoberfläche',
    currentPassword: 'Aktuelles Passwort',
    newPassword: 'Neues Passwort',
    confirmPassword: 'Neues Passwort bestätigen',
    updateProfile: 'Profil aktualisieren',
    updating: 'Wird aktualisiert...',
    changePassword: 'Passwort ändern',
    changing: 'Wird geändert...',
    deleteAccount: 'Konto löschen',
    deleting: 'Wird gelöscht...',
    profileUpdateSuccess: 'Profil erfolgreich aktualisiert',
    passwordChangeSuccess: 'Passwort erfolgreich geändert',

    productLabel: 'Produkt',
    featuresLink: 'Features',
    pricingLink: 'Preise',
    templatesLink: 'Templates',
    examplesLink: 'Beispiele',
    resourcesLabel: 'Ressourcen',
    documentationLink: 'Dokumentation',
    apiReferenceLink: 'API-Referenz',
    tutorialsLink: 'Tutorials',
    blogLink: 'Blog',
    supportLabel: 'Support',
    helpCenterLink: 'Hilfe-Center',
    communityLink: 'Community',
    contactUsLink: 'Kontakt',
    statusLink: 'Status',
    privacyPolicy: 'Datenschutz',
    termsOfService: 'Nutzungsbedingungen',
    allRightsReserved: 'Alle Rechte vorbehalten',

    DemoTextHeader: 'Demo-Modus verfügbar',
  },
  fr: {
    login: 'Connexion',
    register: 'S\'inscrire',
    profile: 'Profil',
    changePlan: 'Changer de plan',
    logout: 'Déconnexion',
    gotoApp: 'Aller à l\'app',

    title: 'Générateur de Code Enterprise',
    subtitle: 'Transformez vos schémas de base de données en code prêt pour la production avec des templates intelligents. Réduisez le temps de développement de 80% grâce à la génération automatisée de code.',
    startFree: 'Commencer gratuitement',
    tryDemo: 'Essayer la démo',
    watchDemo: 'Regarder la démo',

    featuresTitle: 'Fonctionnalités puissantes pour le développement moderne',
    sqlParserTitle: 'Analyseur SQL',
    sqlParserDesc: 'Analyse intelligente des schémas de base de données MySQL avec support des relations complexes et contraintes.',
    templateSystemTitle: 'Système de Templates',
    templateSystemDesc: 'Moteur de templates puissant avec exécution JavaScript pour la génération dynamique de code.',
    multiLanguageTitle: 'Support Multi-Langages',
    multiLanguageDesc: 'Générez du code pour PHP, JavaScript, TypeScript, Python et plus avec des templates personnalisables.',
    modernInterfaceTitle: 'Interface Moderne',
    modernInterfaceDesc: 'Interface MDI intuitive basée sur des docks avec empilement d\'onglets et panneaux flottants.',

    pricingTitle: 'Choisissez votre plan',
    pricingSubtitle: 'Commencez gratuitement, améliorez quand vous êtes prêt à évoluer',
    freeLabel: 'Gratuit',
    premiumLabel: 'Premium',
    patronLabel: 'Mécène',
    goStartFree: 'Commencer gratuitement',
    goPremium: 'Passer Premium',
    becomePatron: 'Devenir Mécène',

    ctaTitle: 'Prêt à multiplier par 10 votre vitesse de développement?',
    ctaSubtitle: 'Rejoignez des milliers de développeurs qui utilisent déjà Scoriet pour créer de meilleurs logiciels plus rapidement.',
    startFreeTrial: 'Commencer l\'essai gratuit',
    tryDemoNow: 'Essayer la démo maintenant',
    contactSales: 'Contacter les ventes',

    welcomeBack: 'Bon retour',
    currentPlan: 'Vous êtes actuellement sur le plan',
    freeTier: 'Plan Gratuit',
    currentPlanButton: 'Plan Actuel',
    upgradeTo: 'Passer à',

    // Profile Modal
    profileTitle: 'Paramètres du profil',
    profileTab: 'Profil',
    passwordTab: 'Changer le mot de passe',
    deleteTab: 'Supprimer le compte',
    fullName: 'Nom complet',
    emailAddress: 'Adresse e-mail',
    preferredLanguage: 'Langue préférée',
    languageDescription: 'Choisissez votre langue préférée pour l\'interface de l\'application',
    currentPassword: 'Mot de passe actuel',
    newPassword: 'Nouveau mot de passe',
    confirmPassword: 'Confirmer le nouveau mot de passe',
    updateProfile: 'Mettre à jour le profil',
    updating: 'Mise à jour...',
    changePassword: 'Changer le mot de passe',
    changing: 'Changement...',
    deleteAccount: 'Supprimer le compte',
    deleting: 'Suppression...',
    profileUpdateSuccess: 'Profil mis à jour avec succès',
    passwordChangeSuccess: 'Mot de passe changé avec succès',

    productLabel: 'Produit',
    featuresLink: 'Fonctionnalités',
    pricingLink: 'Tarifs',
    templatesLink: 'Templates',
    examplesLink: 'Exemples',
    resourcesLabel: 'Ressources',
    documentationLink: 'Documentation',
    apiReferenceLink: 'Référence API',
    tutorialsLink: 'Tutoriels',
    blogLink: 'Blog',
    supportLabel: 'Support',
    helpCenterLink: 'Centre d\'aide',
    communityLink: 'Communauté',
    contactUsLink: 'Nous contacter',
    statusLink: 'Statut',
    privacyPolicy: 'Politique de confidentialité',
    termsOfService: 'Conditions d\'utilisation',
    allRightsReserved: 'Tous droits réservés',

    DemoTextHeader: 'Mode démo disponible',
  },
  es: {
    login: 'Iniciar sesión',
    register: 'Registrarse',
    profile: 'Perfil',
    changePlan: 'Cambiar plan',
    logout: 'Cerrar sesión',
    gotoApp: 'Ir a la app',

    title: 'Generador de Código Enterprise',
    subtitle: 'Transforme sus esquemas de base de datos en código listo para producción con plantillas inteligentes. Reduzca el tiempo de desarrollo en un 80% con generación automatizada de código.',
    startFree: 'Empezar gratis',
    tryDemo: 'Probar demo',
    watchDemo: 'Ver demo',

    featuresTitle: 'Características potentes para desarrollo moderno',
    sqlParserTitle: 'Analizador SQL',
    sqlParserDesc: 'Análisis inteligente de esquemas de base de datos MySQL con soporte para relaciones complejas y restricciones.',
    templateSystemTitle: 'Sistema de Plantillas',
    templateSystemDesc: 'Motor de plantillas potente con ejecución de JavaScript para generación dinámica de código.',
    multiLanguageTitle: 'Soporte Multi-Idioma',
    multiLanguageDesc: 'Genere código para PHP, JavaScript, TypeScript, Python y más con plantillas personalizables.',
    modernInterfaceTitle: 'Interfaz Moderna',
    modernInterfaceDesc: 'Interfaz MDI intuitiva basada en muelles con apilamiento de pestañas y paneles flotantes.',

    pricingTitle: 'Elija su plan',
    pricingSubtitle: 'Empiece gratis, actualice cuando esté listo para escalar',
    freeLabel: 'Gratis',
    premiumLabel: 'Premium',
    patronLabel: 'Patrón',
    goStartFree: 'Empezar gratis',
    goPremium: 'Ir Premium',
    becomePatron: 'Convertirse en Patrón',

    ctaTitle: '¿Listo para multiplicar por 10 su velocidad de desarrollo?',
    ctaSubtitle: 'Únase a miles de desarrolladores que ya están usando Scoriet para construir mejor software más rápido.',
    startFreeTrial: 'Iniciar prueba gratuita',
    tryDemoNow: 'Probar demo ahora',
    contactSales: 'Contactar ventas',

    welcomeBack: 'Bienvenido de nuevo',
    currentPlan: 'Actualmente está en el plan',
    freeTier: 'Plan Gratuito',
    currentPlanButton: 'Plan Actual',
    upgradeTo: 'Actualizar a',

    // Profile Modal
    profileTitle: 'Configuración del perfil',
    profileTab: 'Perfil',
    passwordTab: 'Cambiar contraseña',
    deleteTab: 'Eliminar cuenta',
    fullName: 'Nombre completo',
    emailAddress: 'Dirección de correo',
    preferredLanguage: 'Idioma preferido',
    languageDescription: 'Elija su idioma preferido para la interfaz de la aplicación',
    currentPassword: 'Contraseña actual',
    newPassword: 'Nueva contraseña',
    confirmPassword: 'Confirmar nueva contraseña',
    updateProfile: 'Actualizar perfil',
    updating: 'Actualizando...',
    changePassword: 'Cambiar contraseña',
    changing: 'Cambiando...',
    deleteAccount: 'Eliminar cuenta',
    deleting: 'Eliminando...',
    profileUpdateSuccess: 'Perfil actualizado exitosamente',
    passwordChangeSuccess: 'Contraseña cambiada exitosamente',

    productLabel: 'Producto',
    featuresLink: 'Características',
    pricingLink: 'Precios',
    templatesLink: 'Plantillas',
    examplesLink: 'Ejemplos',
    resourcesLabel: 'Recursos',
    documentationLink: 'Documentación',
    apiReferenceLink: 'Referencia API',
    tutorialsLink: 'Tutoriales',
    blogLink: 'Blog',
    supportLabel: 'Soporte',
    helpCenterLink: 'Centro de ayuda',
    communityLink: 'Comunidad',
    contactUsLink: 'Contáctenos',
    statusLink: 'Estado',
    privacyPolicy: 'Política de privacidad',
    termsOfService: 'Términos de servicio',
    allRightsReserved: 'Todos los derechos reservados',

    DemoTextHeader: 'Modo de demostración disponible',
  },
  it: {
    login: 'Accedi',
    register: 'Registrati',
    profile: 'Profilo',
    changePlan: 'Cambia piano',
    logout: 'Esci',
    gotoApp: 'Vai all\'app',

    title: 'Generatore di Codice Enterprise',
    subtitle: 'Trasforma i tuoi schemi di database in codice pronto per la produzione con template intelligenti. Riduci il tempo di sviluppo dell\'80% con la generazione automatizzata di codice.',
    startFree: 'Inizia gratis',
    tryDemo: 'Prova demo',
    watchDemo: 'Guarda demo',

    featuresTitle: 'Funzionalità potenti per lo sviluppo moderno',
    sqlParserTitle: 'Parser SQL',
    sqlParserDesc: 'Analisi intelligente degli schemi di database MySQL con supporto per relazioni complesse e vincoli.',
    templateSystemTitle: 'Sistema di Template',
    templateSystemDesc: 'Motore di template potente con esecuzione JavaScript per la generazione dinamica di codice.',
    multiLanguageTitle: 'Supporto Multi-Linguaggio',
    multiLanguageDesc: 'Genera codice per PHP, JavaScript, TypeScript, Python e altro con template personalizzabili.',
    modernInterfaceTitle: 'Interfaccia Moderna',
    modernInterfaceDesc: 'Interfaccia MDI intuitiva basata su dock con impilamento di schede e pannelli flottanti.',

    pricingTitle: 'Scegli il tuo piano',
    pricingSubtitle: 'Inizia gratis, aggiorna quando sei pronto a scalare',
    freeLabel: 'Gratuito',
    premiumLabel: 'Premium',
    patronLabel: 'Patrono',
    goStartFree: 'Inizia gratis',
    goPremium: 'Vai Premium',
    becomePatron: 'Diventa Patrono',

    ctaTitle: 'Pronto a moltiplicare per 10 la tua velocità di sviluppo?',
    ctaSubtitle: 'Unisciti a migliaia di sviluppatori che stanno già usando Scoriet per costruire software migliore più velocemente.',
    startFreeTrial: 'Inizia prova gratuita',
    tryDemoNow: 'Prova demo ora',
    contactSales: 'Contatta vendite',

    welcomeBack: 'Bentornato',
    currentPlan: 'Sei attualmente sul piano',
    freeTier: 'Piano Gratuito',
    currentPlanButton: 'Piano Attuale',
    upgradeTo: 'Aggiorna a',

    // Profile Modal
    profileTitle: 'Impostazioni profilo',
    profileTab: 'Profilo',
    passwordTab: 'Cambia password',
    deleteTab: 'Elimina account',
    fullName: 'Nome completo',
    emailAddress: 'Indirizzo email',
    preferredLanguage: 'Lingua preferita',
    languageDescription: 'Scegli la tua lingua preferita per l\'interfaccia dell\'applicazione',
    currentPassword: 'Password attuale',
    newPassword: 'Nuova password',
    confirmPassword: 'Conferma nuova password',
    updateProfile: 'Aggiorna profilo',
    updating: 'Aggiornamento...',
    changePassword: 'Cambia password',
    changing: 'Cambiando...',
    deleteAccount: 'Elimina account',
    deleting: 'Eliminando...',
    profileUpdateSuccess: 'Profilo aggiornato con successo',
    passwordChangeSuccess: 'Password cambiata con successo',

    productLabel: 'Prodotto',
    featuresLink: 'Funzionalità',
    pricingLink: 'Prezzi',
    templatesLink: 'Template',
    examplesLink: 'Esempi',
    resourcesLabel: 'Risorse',
    documentationLink: 'Documentazione',
    apiReferenceLink: 'Riferimento API',
    tutorialsLink: 'Tutorial',
    blogLink: 'Blog',
    supportLabel: 'Supporto',
    helpCenterLink: 'Centro assistenza',
    communityLink: 'Comunità',
    contactUsLink: 'Contattaci',
    statusLink: 'Stato',
    privacyPolicy: 'Privacy Policy',
    termsOfService: 'Termini di servizio',
    allRightsReserved: 'Tutti i diritti riservati',

    DemoTextHeader: 'Modalità demo disponibile',
  },
};

// Browser language detection
export function detectBrowserLanguage(): SupportedLanguage {
  const browserLang = navigator.language.toLowerCase();

  // Check for exact matches first
  for (const lang of supportedLanguages) {
    if (browserLang === lang.code || browserLang.startsWith(lang.code + '-')) {
      return lang.code;
    }
  }

  // Fallback to English
  return 'en';
}

// Get stored language or detect from browser
export function getStoredLanguage(): SupportedLanguage {
  const stored = localStorage.getItem('scoriet_language') as SupportedLanguage;
  if (stored && supportedLanguages.some(lang => lang.code === stored)) {
    return stored;
  }

  const detected = detectBrowserLanguage();
  localStorage.setItem('scoriet_language', detected);
  return detected;
}

// Store language preference
export function setStoredLanguage(language: SupportedLanguage): void {
  localStorage.setItem('scoriet_language', language);
}

// Get translations for a specific language
export function getTranslations(language: SupportedLanguage): Translations {
  return translations[language] || translations.en;
}

// Translation hook function
export function useTranslation(language: SupportedLanguage) {
  const t = getTranslations(language);

  return {
    t,
    language,
    supportedLanguages,
    detectBrowserLanguage,
    getStoredLanguage,
    setStoredLanguage,
  };
}