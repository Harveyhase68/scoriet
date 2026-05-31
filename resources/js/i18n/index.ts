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

/**
 * Sync the UI language from a user profile (typically called right after a
 * successful login or after the profile API echoes back the user's settings).
 *
 * Writes the user's language to localStorage and returns `true` if it
 * actually differs from what was stored. The caller is responsible for
 * deciding what to do with that signal — usually a page reload, but if
 * a redirect is already queued (e.g. "Goto App" → /app), the navigation
 * will pick up the new language naturally and the caller can skip the
 * extra reload. See `triggerLanguageReloadIfPending` for the standard
 * caller pattern.
 *
 * Why this matters: 86+ components hold their language in
 * `useState(getStoredLanguage())` — a snapshot taken at mount time.
 * Updating localStorage alone doesn't reach any of them; only a full page
 * reload (or a hard navigation) does.
 *
 * @returns true when the stored language was changed, false otherwise.
 */
export function syncLanguageFromUser(userLanguage: string | null | undefined): boolean {
  if (!userLanguage) return false;
  const target = userLanguage.toLowerCase() as SupportedLanguage;
  if (!supportedLanguages.some(l => l.code === target)) return false;

  const current = localStorage.getItem('scoriet_language');
  if (current === target) return false;

  setStoredLanguage(target);
  return true;
}

/**
 * Companion to syncLanguageFromUser — call this AFTER your post-login
 * callback (e.g. onLoginSuccess) has run.
 *
 * IMPORTANT: take a snapshot of redirect_after_login BEFORE calling the
 * success callback, because the LandingPage's handleLoginSuccess() removes
 * the key as part of processing it. By the time we get here, the key is
 * already gone and we'd wrongly think no redirect was queued — triggering
 * a needless reload that races the redirect.
 *
 * The small delay (200ms) gives the success callback's
 * `window.location.href = ...` assignment a chance to start the navigation.
 * Even if our reload fires, the navigation wins; it's harmless either way.
 *
 * @param languageChanged    return value of syncLanguageFromUser()
 * @param redirectWasPending snapshot of redirect_after_login from BEFORE
 *                           the success callback ran
 */
export function triggerLanguageReloadIfPending(languageChanged: boolean, redirectWasPending: boolean = false): void {
  if (!languageChanged) return;
  if (redirectWasPending) {
    // The redirect handler will do a full navigation; that reloads the
    // app with the new language as a side-effect. No second reload needed.
    return;
  }
  setTimeout(() => window.location.reload(), 200);
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
