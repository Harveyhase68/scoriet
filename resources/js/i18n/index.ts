// Translation system for Scoriet with lazy loading
import { useState, useEffect } from 'react';
export type { SupportedLanguage, LanguageOption, Translations } from './types';
export { supportedLanguages } from './types';

import type { SupportedLanguage, Translations } from './types';
import { supportedLanguages } from './types';

// Cache for loaded translations
const translationsCache: Partial<Record<SupportedLanguage, Translations>> = {};

// Lazy load translations for a specific language
async function loadTranslations(language: SupportedLanguage): Promise<Translations> {
  // Return from cache if already loaded
  if (translationsCache[language]) {
    return translationsCache[language]!;
  }

  // Dynamically import the language file
  let translations: Translations;

  switch (language) {
    case 'en':
      translations = (await import('./locales/en')).en;
      break;
    case 'de':
      translations = (await import('./locales/de')).de;
      break;
    case 'fr':
      translations = (await import('./locales/fr')).fr;
      break;
    case 'es':
      translations = (await import('./locales/es')).es;
      break;
    case 'it':
      translations = (await import('./locales/it')).it;
      break;
    default:
      // Fallback to English
      translations = (await import('./locales/en')).en;
  }

  // Cache the loaded translations
  translationsCache[language] = translations;

  return translations;
}

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

// Get translations for a specific language (async)
export async function getTranslations(language: SupportedLanguage): Promise<Translations> {
  try {
    return await loadTranslations(language);
  } catch (error) {
    console.error(`Failed to load translations for ${language}, falling back to English:`, error);
    return await loadTranslations('en');
  }
}

// React Hook for translations with lazy loading
export function useTranslation(language: SupportedLanguage) {
  const [translations, setTranslations] = useState<Translations | null>(
    () => translationsCache[language] || null
  );
  const [isLoading, setIsLoading] = useState(!translationsCache[language]);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      setIsLoading(true);
      const t = await getTranslations(language);
      if (isMounted) {
        setTranslations(t);
        setIsLoading(false);
      }
    }

    // If not in cache, load it
    if (!translationsCache[language]) {
      load();
    } else {
      setTranslations(translationsCache[language]!);
      setIsLoading(false);
    }

    return () => {
      isMounted = false;
    };
  }, [language]);

  // Return English as fallback while loading
  return {
    t: translations || ({} as Translations),
    language,
    isLoading,
    supportedLanguages,
    detectBrowserLanguage,
    getStoredLanguage,
    setStoredLanguage,
  };
}

// Preload a language (useful for prefetching)
export function preloadLanguage(language: SupportedLanguage): Promise<void> {
  return loadTranslations(language).then(() => undefined);
}

/**
 * Template function for translated strings with placeholders.
 * Replaces {key} placeholders with values from the params object.
 *
 * Usage:
 *   tpl(t.payoutadminpanel378, { gross: formatCurrency(100), net: formatCurrency(80) })
 *
 * Translation string:
 *   "Brutto {gross} - Netto {net}"
 *
 * Result:
 *   "Brutto €100.00 - Netto €80.00"
 */
export function tpl(template: string, params: Record<string, string | number>): string {
  if (!template) return '';
  let result = template;
  const keys = Object.keys(params);
  for (let i = 0; i < keys.length; i++) {
    const placeholder = '{' + keys[i] + '}';
    const value = String(params[keys[i]]);
    // Replace all occurrences of this placeholder
    while (result.indexOf(placeholder) !== -1) {
      result = result.replace(placeholder, value);
    }
  }
  return result;
}
