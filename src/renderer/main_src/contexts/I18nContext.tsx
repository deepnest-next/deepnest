import { createContext, useContext, JSX, createSignal, onMount } from 'solid-js';
import i18next from 'i18next';

// Import locale files
import translations from '../locales';

// I18n types
export type Locale = 'en' | 'de' | 'es' | 'fr';

// Initialize i18next with the saved language preference or default
const savedLanguage = localStorage.getItem('language') as Locale || 'en';

// Configure i18next
i18next.init({
  resources: translations,
  lng: savedLanguage,
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false, // SolidJS already escapes values
  }
});

// Create a reactive signal for the current language
const [currentLanguage, setCurrentLanguageInternal] = createSignal<Locale>(savedLanguage);

// Change language and update the signal
export const changeLanguage = async (lng: Locale) => {
  // Store language preference
  localStorage.setItem('language', lng);

  // Update i18next
  await i18next.changeLanguage(lng);

  // Update the signal to trigger reactivity
  setCurrentLanguageInternal(lng);

  console.log(`Language changed to: ${lng}`);
};

// Translation function that's reactive to language changes
export const t = (key: string, options = {}) => {
  // Using currentLanguage() in the dependency to make it reactive
  const _ = currentLanguage();
  return i18next.t(key, options);
};

// Format numbers according to locale
export const formatNumber = (value: number, options: Intl.NumberFormatOptions = {}) => {
  const locale = currentLanguage() || 'en';
  return new Intl.NumberFormat(locale, options).format(value);
};

// Format currency
export const formatCurrency = (value: number, currencyCode = 'USD') => {
  const locale = currentLanguage() || 'en';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currencyCode
  }).format(value);
};

// Enhanced i18n context with number and date formatting
const I18nContext = createContext<{
  locale: () => Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, any>) => string;
  formatNumber: (value: number, options?: Intl.NumberFormatOptions) => string;
  formatDate: (value: Date | number, options?: Intl.DateTimeFormatOptions) => string;
  formatCurrency: (value: number, currencyCode?: string) => string;
  formatRelativeTime: (value: number, unit: Intl.RelativeTimeFormatUnit, options?: Intl.RelativeTimeFormatOptions) => string;
}>();

// Provider component
export const I18nProvider = (props: { children: JSX.Element }) => {
  // Use local functions for locale management
  const locale = () => currentLanguage();
  const setLocale = (newLocale: Locale) => {
    changeLanguage(newLocale);
  };

  // Format dates according to locale
  const formatDate = (value: Date | number, options: Intl.DateTimeFormatOptions = {}) => {
    const _ = currentLanguage(); // Make reactive to language changes
    return new Intl.DateTimeFormat(locale(), options).format(value);
  };

  // Format relative time
  const formatRelativeTime = (value: number, unit: Intl.RelativeTimeFormatUnit, options: Intl.RelativeTimeFormatOptions = {}) => {
    const _ = currentLanguage(); // Make reactive to language changes
    return new Intl.RelativeTimeFormat(locale(), options).format(value, unit);
  };

  // Initialize with saved language on mount
  onMount(() => {
    if (savedLanguage) {
      changeLanguage(savedLanguage);
    }
  });

  return (
    <I18nContext.Provider value={{
      locale,
      setLocale,
      t,
      formatNumber,
      formatDate,
      formatCurrency,
      formatRelativeTime
    }}>
      {props.children}
    </I18nContext.Provider>
  );
};

// Enhanced i18n hook
export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}

// Export for direct usage without the context
export { currentLanguage, i18next };
