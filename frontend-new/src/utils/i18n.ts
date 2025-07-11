import { createSignal, createContext, useContext, onMount, createEffect, createMemo } from 'solid-js';
import type { Component, JSX } from 'solid-js';
import i18next from 'i18next';
import { globalState } from '../stores/global.store';

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
  debug: true, // Enable to debug missing translations
  ns: ['translation', 'common', 'parts', 'settings', 'nesting', 'sheets', 'files', 'messages'],
  defaultNS: 'translation', // i18next standard default
  interpolation: {
    escapeValue: false
  },
  resources: {
    en: {
      translation: enCommon, // Use common as default translation namespace
      common: enCommon,
      messages: enMessages,
      parts: enParts,
      nesting: enNesting,
      sheets: enSheets,
      settings: enSettings,
      files: enFiles
    },
    de: {
      translation: deCommon, // Use common as default translation namespace
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

export const useTranslation = (namespace = 'translation') => {
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
      console.warn(`i18n not ready, returning key: ${key}`);
      return key; // Return key if i18n not ready yet
    }
    // Use i18next namespace option for proper key resolution
    const optionsWithNS = { ns: namespace, ...options };
    console.log(`Translating key: ${key} with namespace: ${namespace}`);
    return context.t(key, optionsWithNS);
  };
  
  return [t, { changeLanguage: context.changeLanguage, language: context.language }] as const;
};

export const I18nProvider: Component<{ children: JSX.Element }> = (props) => {
  const [language, setLanguage] = createSignal(globalState.ui.language || 'en');
  const [ready, setReady] = createSignal(false);
  
  // Create a signal for the translation function - this is the key!
  const [translateFn, setTranslateFn] = createSignal<typeof i18next.t | null>(null);
  
  // Initialize i18next on mount with global state language
  onMount(async () => {
    try {
      const initialLang = globalState.ui.language || 'en';
      await i18next.init({
        ...i18nConfig,
        lng: initialLang
      });
      setLanguage(initialLang);
      setTranslateFn(() => i18next.t); // Set the reactive translation function
      setReady(true);
      console.log('I18nProvider: i18next initialized and ready set to true');
    } catch (error) {
      console.error('Failed to initialize i18n:', error);
      setReady(true); // Set ready even on error to prevent blocking
    }
  });

  // Sync global state language changes with i18next
  createEffect(async () => {
    const globalLang = globalState.ui.language;
    if (ready() && globalLang && globalLang !== language()) {
      try {
        const newT = await i18next.changeLanguage(globalLang);
        setLanguage(globalLang);
        setTranslateFn(() => newT); // Update the reactive translation function!
      } catch (error) {
        console.error('Failed to sync language with global state:', error);
      }
    }
  });
  
  const t = (key: string, options?: any) => {
    const tFn = translateFn();
    if (!ready() || !tFn) {
      return key; // Return key if i18n not ready yet
    }
    return tFn(key, options) || key;
  };
  
  const changeLanguage = async (lng: string) => {
    try {
      const newT = await i18next.changeLanguage(lng);
      setLanguage(lng);
      setTranslateFn(() => newT); // Update the reactive translation function!
    } catch (error) {
      console.error('Failed to change language:', error);
    }
  };
  
  // Create reactive context value
  const value = createMemo(() => {
    console.log('I18nProvider: creating context value, ready =', ready());
    return {
      t,
      changeLanguage,
      language,
      ready
    };
  });
  
  return I18nContext.Provider({ value: value(), children: props.children });
};