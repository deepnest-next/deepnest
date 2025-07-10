import i18next from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import enCommon from './locales/en/common.json';
import enMessages from './locales/en/messages.json';

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

export const initI18n = async () => {
  await i18next
    .use(LanguageDetector)
    .init(i18nConfig);
  
  return i18next;
};