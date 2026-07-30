import { useState, useEffect } from 'react';
export type { SupportedLanguage, LanguageOption, Translations } from './types';
export { supportedLanguages } from './types';

import type { SupportedLanguage, Translations } from './types';
import { supportedLanguages } from './types';

const translationsCache: Partial<Record<SupportedLanguage, Translations>> = {};

async function loadTranslations(language: SupportedLanguage): Promise<Translations> {
  if (translationsCache[language]) {
    return translationsCache[language]!;
  }

  let translations: Translations;

  switch (language) {
    case 'en':
      translations = (await import('./locales/en')).en;
      break;
    case 'de':
      translations = (await import('./locales/de')).de;
      break;
    default:
      translations = (await import('./locales/en')).en;
  }

  translationsCache[language] = translations;
  return translations;
}

export function detectBrowserLanguage(): SupportedLanguage {
  const browserLang = navigator.language.toLowerCase();
  for (const lang of supportedLanguages) {
    if (browserLang === lang.code || browserLang.startsWith(lang.code + '-')) {
      return lang.code;
    }
  }
  return 'en';
}

export function getStoredLanguage(): SupportedLanguage {
  const stored = localStorage.getItem('template_language') as SupportedLanguage;
  if (stored && supportedLanguages.some(lang => lang.code === stored)) {
    return stored;
  }
  const detected = detectBrowserLanguage();
  localStorage.setItem('template_language', detected);
  return detected;
}

export function setStoredLanguage(language: SupportedLanguage): void {
  localStorage.setItem('template_language', language);
}

export async function getTranslations(language: SupportedLanguage): Promise<Translations> {
  try {
    return await loadTranslations(language);
  } catch (error) {
    console.error(`Failed to load translations for ${language}, falling back to English:`, error);
    return await loadTranslations('en');
  }
}

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

    if (!translationsCache[language]) {
      load();
    } else {
      setTranslations(translationsCache[language]!);
      setIsLoading(false);
    }

    return () => { isMounted = false; };
  }, [language]);

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

export function tpl(template: string, params: Record<string, string | number>): string {
  if (!template) return '';
  let result = template;
  const keys = Object.keys(params);
  for (let i = 0; i < keys.length; i++) {
    const placeholder = '{' + keys[i] + '}';
    const value = String(params[keys[i]]);
    while (result.indexOf(placeholder) !== -1) {
      result = result.replace(placeholder, value);
    }
  }
  return result;
}