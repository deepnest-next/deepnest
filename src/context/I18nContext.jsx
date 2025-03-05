import { createContext, useContext } from 'solid-js';
import { t, changeLanguage, formatNumber, formatCurrency, currentLanguage } from '../i18n';

// Create the context
export const I18nContext = createContext();

export function I18nProvider(props) {
  const i18nValue = {
    t,
    changeLanguage,
    formatNumber,
    formatCurrency,
    currentLanguage
  };

  return (
    <I18nContext.Provider value={i18nValue}>
      {props.children}
    </I18nContext.Provider>
  );
}

// Hook to use i18n in components
export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return context;
}
