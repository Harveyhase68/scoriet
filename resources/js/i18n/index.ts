import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Translation files
import en from './locales/en.json';
import de from './locales/de.json';
import fr from './locales/fr.json';

const resources = {
  en: { translation: en },
  de: { translation: de },
  fr: { translation: fr }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    debug: import.meta.env.DEV,

    // Don't auto-detect from browser - we'll control it via user profile
    detection: {
      order: ['localStorage'], // Only check localStorage
      lookupLocalStorage: 'user_language',
      caches: ['localStorage']
    },

    interpolation: {
      escapeValue: false // React already does escaping
    },

    // Load user's preferred language on startup
    initImmediate: false
  });

// Function to change language and save to user profile
export const changeLanguage = async (lng: string) => {
  await i18n.changeLanguage(lng);
  localStorage.setItem('user_language', lng);

  // Also save to user profile via API
  const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
  if (token) {
    try {
      await fetch('/api/profile/language', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ language: lng })
      });
    } catch {
      // Failed to save language preference
    }
  }
};

// Load user's language from profile on login
export const loadUserLanguage = (userLanguage?: string) => {
  if (userLanguage) {
    i18n.changeLanguage(userLanguage);
    localStorage.setItem('user_language', userLanguage);
  } else {
    // Fallback to browser language or default
    const browserLang = navigator.language.split('-')[0];
    const supportedLang = ['de', 'en', 'fr'].includes(browserLang) ? browserLang : 'en';
    i18n.changeLanguage(supportedLang);
  }
};

export default i18n;