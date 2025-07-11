import { createSignal, createContext, useContext, onMount } from 'solid-js';
import type { Component, JSX } from 'solid-js';
import i18next from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import enCommon from '../locales/en/common.json';
import enMessages from '../locales/en/messages.json';
import enParts from '../locales/en/parts.json';
import enNesting from '../locales/en/nesting.json';
import enSheets from '../locales/en/sheets.json';
import enSettings from '../locales/en/settings.json';
import enFiles from '../locales/en/files.json';

import deCommon from '../locales/de/common.json';
import deMessages from '../locales/de/messages.json';
import deParts from '../locales/de/parts.json';
import deNesting from '../locales/de/nesting.json';
import deSheets from '../locales/de/sheets.json';
import deSettings from '../locales/de/settings.json';
import deFiles from '../locales/de/files.json';

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
      messages: enMessages,
      parts: enParts,
      nesting: enNesting,
      sheets: enSheets,
      settings: enSettings,
      files: enFiles
    },
    de: {
      common: deCommon,
      messages: deMessages,
      parts: deParts,
      nesting: deNesting,
      sheets: deSheets,
      settings: deSettings,
      files: deFiles
    }
  }
};

// Default context value
const defaultContext = {
  t: (key: string) => key,
  changeLanguage: async (lng: string) => {},
  language: () => 'en',
  ready: () => false
};

// Create i18n context with default value
const I18nContext = createContext<{
  t: (key: string, options?: any) => string;
  changeLanguage: (lng: string) => Promise<void>;
  language: () => string;
  ready: () => boolean;
}>(defaultContext);

export const useTranslation = (namespace = 'common') => {
  const context = useContext(I18nContext);
  
  // If context is null or undefined, return default functions
  if (!context) {
    return [
      (key: string) => key,
      { 
        changeLanguage: async (lng: string) => {},
        language: () => 'en'
      }
    ] as const;
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
      setLanguage(i18next.language || 'en');
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
    return i18next.t(key, options) || key;
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