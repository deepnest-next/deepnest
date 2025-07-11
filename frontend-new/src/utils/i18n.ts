import { createSignal, createContext, useContext, onMount, createEffect, createMemo } from 'solid-js';
import type { Component, JSX } from 'solid-js';
import i18next from 'i18next';
import { globalState, globalActions } from '../stores/global.store';

// Import translation files
import enCommon from '../locales/en/common.json';
import enMessages from '../locales/en/messages.json';
import enParts from '../locales/en/parts.json';
import enNesting from '../locales/en/nesting.json';
import enSheets from '../locales/en/sheets.json';
import enSettings from '../locales/en/settings.json';
import enFiles from '../locales/en/files.json';
import enImprint from '../locales/en/imprint.json';

import deCommon from '../locales/de/common.json';
import deMessages from '../locales/de/messages.json';
import deParts from '../locales/de/parts.json';
import deNesting from '../locales/de/nesting.json';
import deSheets from '../locales/de/sheets.json';
import deSettings from '../locales/de/settings.json';
import deFiles from '../locales/de/files.json';
// TODO: Add German translations for imprint
// import deImprint from '../locales/de/imprint.json';

// i18next configuration
export const i18nConfig = {
  fallbackLng: 'en',
  debug: true,
  ns: ['translation', 'common', 'parts', 'settings', 'nesting', 'sheets', 'files', 'messages', 'imprint'],
  defaultNS: 'translation',
  languages: ['en', 'de'],
  interpolation: {
    escapeValue: false
  },
  resources: {
    en: {
      translation: enCommon,
      common: enCommon,
      messages: enMessages,
      parts: enParts,
      nesting: enNesting,
      sheets: enSheets,
      settings: enSettings,
      files: enFiles,
      imprint: enImprint
    },
    de: {
      translation: deCommon,
      common: deCommon,
      messages: deMessages,
      parts: deParts,
      nesting: deNesting,
      sheets: deSheets,
      settings: deSettings,
      files: deFiles,
      imprint: enImprint // TODO: Replace with deImprint when German translations are available
    }
  }
};

// Types
interface TranslationOptions {
  ns?: string;
  [key: string]: unknown;
}

interface I18nContextType {
  t: (key: string, options?: TranslationOptions) => string;
  language: () => string;
  changeLanguage: (lng: string) => Promise<void>;
  isReady: () => boolean;
}

// Create i18next instance
const i18nInstance = i18next.createInstance();
let initialized = false;

// LocalStorage key for language preference
const LANGUAGE_STORAGE_KEY = 'deepnest-language';

// Helper functions for localStorage
const getStoredLanguage = (): string | null => {
  try {
    return localStorage.getItem(LANGUAGE_STORAGE_KEY);
  } catch (error) {
    console.warn('Failed to read language from localStorage:', error);
    return null;
  }
};

const setStoredLanguage = (language: string): void => {
  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    console.log('✅ Stored language preference:', language);
  } catch (error) {
    console.warn('Failed to store language in localStorage:', error);
  }
};

// Create signals for reactive translation
const [currentLanguage, setCurrentLanguage] = createSignal('en');
const [isReady, setIsReady] = createSignal(false);

// Initialize i18next
const initializeI18n = async (language: string) => {
  if (!initialized) {
    await i18nInstance.init({
      ...i18nConfig,
      lng: language
    }).then(() => {
      setCurrentLanguage(language);
      setIsReady(true);
      setStoredLanguage(language);
    });
    initialized = true;
    console.log('✅ i18next initialized with language:', language);
  } else {
    await i18nInstance.changeLanguage(language);
    setCurrentLanguage(language);
    setStoredLanguage(language);
    console.log('✅ i18next language changed to:', language);
  }
};

// Context with default values
const I18nContext = createContext<I18nContextType>({
  t: i18nInstance.t.bind(i18nInstance),
  language: currentLanguage.bind(currentLanguage),
  changeLanguage: setCurrentLanguage.bind(setCurrentLanguage),
  isReady: isReady.bind(isReady)
});

// Provider component
export const I18nProvider: Component<{ children: JSX.Element }> = (props) => {
  console.log('🏗️ I18nProvider: Initializing');

  // Initialize on mount
  onMount(async () => {
    // Check localStorage first, then fallback to globalState, then to 'en'
    const storedLang = getStoredLanguage();
    const globalLang = globalState.ui.language;
    const initialLang = storedLang || globalLang || 'en';

    console.log('🚀 I18nProvider: Language preference check:', {
      stored: storedLang,
      global: globalLang,
      selected: initialLang
    });

    // If we found a stored language different from globalState, update globalState
    if (storedLang && storedLang !== globalLang) {
      console.log(`🔄 Restoring language from localStorage: ${storedLang}`);
      globalActions.setLanguage(storedLang);
    }

    await initializeI18n(initialLang);
  });

  // Watch for globalState.ui.language changes and react to them
  createEffect(async () => {
    const newLang = globalState.ui.language;
    const currentLang = currentLanguage();

    console.log(`👀 I18nProvider: globalState.ui.language changed to: ${newLang}, current: ${currentLang}`);

    if (newLang && newLang !== currentLang && initialized) {
      console.log(`🔄 I18nProvider: Changing language from ${currentLang} to ${newLang}`);
      await initializeI18n(newLang);
    }
  });

  // Create reactive translation function
  const t = (key: string, options?: TranslationOptions) => {
    // Access the signals directly to ensure reactivity
    const ready = isReady();
    const lang = currentLanguage();

    console.log(`🔍 Translation called: key="${key}", ready=${ready}, lang=${lang}, typeof key=${typeof key}`);

    if (!ready) {
      console.log(`⏳ Translation not ready, returning key: ${key}`);
      return key;
    }

    if (!key || typeof key !== 'string') {
      console.warn(`🚨 Invalid translation key:`, key);
      return key || '';
    }

    const namespace = options?.ns || 'translation';
    const optionsWithNS = { ...options, ns: namespace };

    console.log(`🔍 About to call i18nInstance.t with:`, {
      key,
      namespace,
      lang: i18nInstance.language,
      hasResources: !!i18nInstance.getDataByLanguage(lang)?.[namespace],
      resources: i18nInstance.getDataByLanguage(lang)
    });

    const result = i18nInstance.t(key, optionsWithNS);
    console.log(`🔍 i18nInstance.t result: "${result}" for key "${key}"`);

    return result || key;
  };

  // Create context value
  const contextValue = {
    t,
    language: currentLanguage,
    changeLanguage: async (lng: string) => {
      console.log(`🎯 Changing language to: ${lng}`);
      globalActions.setLanguage(lng);
      setStoredLanguage(lng);
      await initializeI18n(lng);
    },
    isReady: isReady
  };

  return I18nContext.Provider({
    value: contextValue,
    children: props.children
  });
};

// Hook for using translations
export const useTranslation = (namespace = 'translation') => {
  const context = useContext(I18nContext);

  if (!context) {
    console.warn('useTranslation must be used within I18nProvider');
    return [(key: string) => key, { changeLanguage: async () => {}, language: () => 'en' }] as const;
  }

  // Create a translation function that creates reactive computations
  const t = (key: string, options?: TranslationOptions) => {
    // Use createMemo to create a reactive computation that tracks context signals
    const translatedValue = createMemo(() => {
      // Access reactive signals to track changes
      context.language();

      //console.log(`🎯 useTranslation(${namespace}) memo evaluation for key="${key}", lang=${lang}, ready=${ready}`);

      const optionsWithNS = { ...options, ns: namespace };
      return context.t(key, optionsWithNS);
    });

    // Return the current value of the memo
    return translatedValue();
  };

  return [t, {
    changeLanguage: context.changeLanguage,
    language: context.language,
    isReady: context.isReady,
  }] as const;
};
