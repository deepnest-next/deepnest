import i18next from 'i18next';
import { createSignal } from 'solid-js';
import en from './locales/en.json';
import es from './locales/es.json';
import de from './locales/de.json';

// Configure i18next
i18next.init({
  resources: {
    en: { translation: en },
    es: { translation: es },
    de: { translation: de },
  },
  lng: 'en', // Default language
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false, // SolidJS already escapes values
  }
});

// Create a reactive signal for the current language
const [currentLanguage, setCurrentLanguage] = createSignal(i18next.language || 'en');

// Change language and update the signal
export const changeLanguage = async (lng) => {
  await i18next.changeLanguage(lng);
  setCurrentLanguage(lng);
};

// Translation function
export const t = (key, options = {}) => {
  return i18next.t(key, options);
};

// Format numbers according to locale
export const formatNumber = (value, options = {}) => {
  const locale = currentLanguage() || 'en';
  return new Intl.NumberFormat(locale, options).format(value);
};

// Format currency
export const formatCurrency = (value, currencyCode = 'USD') => {
  const locale = currentLanguage() || 'en';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currencyCode
  }).format(value);
};

export { currentLanguage };
export default i18next;
