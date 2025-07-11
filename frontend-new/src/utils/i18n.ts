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
    const result = tFn(key, optionsWithNS) || key;
    // Only log first few calls to avoid spam
    if (Math.random() < 0.01) { // 1% chance to log
      console.log(`useTranslation: translating "${key}" in namespace "${namespace}" -> "${result}"`);
      console.log('useTranslation: current language signal:', currentLanguage());
    }
    return result;
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
    console.log('I18nProvider: current i18next language:', i18next.language);
    setTranslate(() => i18next.t);
  };
  
  const onLanguageChanged = (lng: string) => {
    console.log(`I18nProvider: language changed event fired for ${lng}`);
    console.log('I18nProvider: i18next.language is now:', i18next.language);
    console.log('I18nProvider: currentLanguage signal before update:', currentLanguage());
    setTranslate(() => i18next.t);
    setCurrentLanguage(lng);
    console.log('I18nProvider: currentLanguage signal after update:', currentLanguage());
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
      console.log('I18nProvider: initializing with language:', initialLang);
      
      // Initialize i18next with resources
      await i18next.init({
        ...i18nConfig,
        lng: initialLang
      });
      
      console.log('I18nProvider: i18next initialized with language:', i18next.language);
      console.log('I18nProvider: i18next available languages:', i18next.languages);
      console.log('I18nProvider: i18next resources:', Object.keys(i18next.store.data));
      
      // Set initial translation function - this is the key pattern from solid-i18next
      setTranslate(() => i18next.t);
      setCurrentLanguage(initialLang);
      
      // Event listeners - this is the solid-i18next pattern we were missing
      i18next.on('loaded', onLoaded);
      i18next.on('languageChanged', onLanguageChanged);
      
      console.log('I18nProvider: event listeners registered');
      
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
        console.log(`I18nProvider: changeLanguage called with ${lng}`);
        console.log('I18nProvider: current i18next language before change:', i18next.language);
        console.log('I18nProvider: current global state language:', globalState.ui.language);
        
        await i18next.changeLanguage(lng);
        console.log('I18nProvider: i18next.changeLanguage completed, new language:', i18next.language);
        
        // Also update the global store to keep it in sync
        globalActions.setLanguage(lng);
        console.log('I18nProvider: globalActions.setLanguage called with:', lng);
        console.log('I18nProvider: new global state language:', globalState.ui.language);
        
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