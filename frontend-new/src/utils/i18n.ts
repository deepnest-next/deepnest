import { createSignal, createContext, useContext, onMount } from 'solid-js';
import type { Component, JSX } from 'solid-js';
import i18next from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import enCommon from '../locales/en/common.json';
import enMessages from '../locales/en/messages.json';

export const i18nConfig = {
  fallbackLng: 'en',
  debug: false,
  detection: {
    order: ['localStorage', 'navigator'],
    caches: ['localStorage'],
    lookupLocalStorage: 'deepnest-language'
  },
  interpolation: {
    escapeValue: false
  },
  resources: {
    en: {
      common: enCommon,
      messages: enMessages
    }
  }
};

// Create i18n context
const I18nContext = createContext<{
  t: (key: string, options?: any) => string;
  changeLanguage: (lng: string) => Promise<void>;
  language: () => string;
  ready: () => boolean;
}>();

export const useTranslation = (namespace = 'common') => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useTranslation must be used within an I18nProvider');
  }
  
  const t = (key: string, options?: any) => {
    if (!context.ready()) {
      return key; // Return key if i18n not ready yet
    }
    const fullKey = `${namespace}.${key}`;
    return context.t(fullKey, options);
  };
  
  return [t, { changeLanguage: context.changeLanguage, language: context.language }] as const;
};

export const I18nProvider: Component<{ children: JSX.Element }> = (props) => {
  const [language, setLanguage] = createSignal('en');
  const [ready, setReady] = createSignal(false);
  
  // Initialize i18next on mount
  onMount(async () => {
    try {
      await i18next.use(LanguageDetector).init(i18nConfig);
      setLanguage(i18next.language);
      setReady(true);
    } catch (error) {
      console.error('Failed to initialize i18n:', error);
      setReady(true); // Set ready even on error to prevent blocking
    }
  });
  
  const t = (key: string, options?: any) => {
    if (!ready()) {
      return key; // Return key if i18n not ready yet
    }
    return i18next.t(key, options);
  };
  
  const changeLanguage = async (lng: string) => {
    try {
      await i18next.changeLanguage(lng);
      setLanguage(lng);
    } catch (error) {
      console.error('Failed to change language:', error);
    }
  };
  
  const value = {
    t,
    changeLanguage,
    language,
    ready
  };
  
  return I18nContext.Provider({ value, children: props.children });
};