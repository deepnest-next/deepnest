import { createSignal, createContext, useContext, onMount, onCleanup, createMemo } from 'solid-js';
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

// Types for i18n options
interface TranslationOptions {
  ns?: string;
  [key: string]: unknown;
}

// Fallback translation function
const fallbackT = (key: string) => key;

// Context type
interface I18nContextType {
  t: typeof i18next.t;
  changeLanguage: (lng: string) => Promise<void>;
  getLanguage: () => string;
  getInstance: () => typeof i18next;
}

// Create the translation signal - this is the core of solid-i18next pattern
const [translate, setTranslate] = createSignal<typeof i18next.t>(fallbackT);
const [currentLanguage, setCurrentLanguage] = createSignal('en');

// Default context value
const defaultContext: I18nContextType = {
  t: fallbackT,
  changeLanguage: async (_lng: string) => {},
  getLanguage: () => 'en',
  getInstance: () => i18next
};

// Create i18n context
const I18nContext = createContext<I18nContextType>(defaultContext);

// Simple useTranslation hook following solid-i18next pattern
export const useTranslation = (namespace = 'translation') => {
  const context = useContext(I18nContext);
  
  // If no context, return fallback
  if (!context) {
    return [fallbackT, { changeLanguage: async (_lng: string) => {}, language: () => 'en' }] as const;
  }
  
  // Create a namespaced translation function that's reactive to the signal
  const t = (key: string, options?: TranslationOptions) => {
    const tFn = translate(); // Use the signal directly for reactivity
    const optionsWithNS = { ns: namespace, ...options };
    return tFn(key, optionsWithNS) || key;
  };
  
  return [t, { 
    changeLanguage: context.changeLanguage, 
    language: context.getLanguage,
    i18n: context.getInstance
  }] as const;
};

export const I18nProvider: Component<{ children: JSX.Element }> = (props) => {
  console.log('I18nProvider: initializing');
  
  // Define event handlers outside async context
  const onLoaded = () => {
    console.log('I18nProvider: resources loaded, updating translation function');
    setTranslate(() => i18next.t);
  };
  
  const onLanguageChanged = (lng: string) => {
    console.log(`I18nProvider: language changed to ${lng}, updating translation function`);
    setTranslate(() => i18next.t);
    setCurrentLanguage(lng);
  };
  
  // Register cleanup in proper reactive context
  onCleanup(() => {
    i18next.off('loaded', onLoaded);
    i18next.off('languageChanged', onLanguageChanged);
  });
  
  // Initialize i18next on mount
  onMount(async () => {
    try {
      const initialLang = globalState.ui.language || 'en';
      
      // Initialize i18next with resources
      await i18next.init({
        ...i18nConfig,
        lng: initialLang
      });
      
      console.log('I18nProvider: i18next initialized');
      
      // Set initial translation function - this is the key pattern from solid-i18next
      setTranslate(() => i18next.t);
      setCurrentLanguage(initialLang);
      
      // Event listeners - this is the solid-i18next pattern we were missing
      i18next.on('loaded', onLoaded);
      i18next.on('languageChanged', onLanguageChanged);
      
    } catch (error) {
      console.error('Failed to initialize i18n:', error);
      // Keep fallback function on error
    }
  });
  
  // Create context value with reactive functions
  const contextValue: I18nContextType = {
    t: translate(), // This will be reactive through the signal in useTranslation
    changeLanguage: async (lng: string) => {
      try {
        await i18next.changeLanguage(lng);
        // Also update the global store to keep it in sync
        globalActions.setLanguage(lng);
        // Language change will be handled by the event listener
      } catch (error) {
        console.error('Failed to change language:', error);
      }
    },
    getLanguage: currentLanguage,
    getInstance: () => i18next
  };
  
  return I18nContext.Provider({ value: contextValue, children: props.children });
};