import { createContext, useContext, createSignal, JSX, createEffect } from 'solid-js';
import { createStore } from 'solid-js/store';

// Types
export type PageType = 'main' | 'settings' | 'account' | 'privacy' | 'impressum';

// Define different state slices
type PageState = {
  active: PageType;
};

type UserState = {
  loggedIn: boolean;
  username: string | null;
};

type NotifyData = {
  message: string;
  type: 'info' | 'warning' | 'error';
};

type SettingsState = {
  notify_data: NotifyData;
  darkMode: boolean;
  notifications: boolean;
};

// Complete AppState combining all slices
type AppState = {
  page: PageState;
  user: UserState;
  settings: SettingsState;
};

// Actions for our reducer
type AppAction =
  | { type: 'SET_PAGE'; payload: PageType }
  | { type: 'LOGIN'; payload: { username: string } }
  | { type: 'LOGOUT' }
  | { type: 'TOGGLE_DARK_MODE' }
  | { type: 'TOGGLE_NOTIFICATIONS' }
  | { type: 'SET_NOTIFICATIONS'; payload: NotifyData };

// Context type definition
type AppContextType = {
  state: AppState;
  dispatch: (action: AppAction) => void;
};

// Initial state
const initialState: AppState = {
  page: {
    active: 'main',
  },
  user: {
    loggedIn: false,
    username: null,
  },
  settings: {
    notify_data: {
      message: '',
      type: 'info',
    },
    darkMode: false,
    notifications: false,
  },
};

// Create the context
const AppContext = createContext<AppContextType>();

// Reducer function to handle all state updates
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_PAGE':
      return { ...state, page: { ...state.page, active: action.payload } };
    case 'LOGIN':
      return { ...state, user: { loggedIn: true, username: action.payload.username } };
    case 'LOGOUT':
      return { ...state, user: { loggedIn: false, username: null } };
    case 'TOGGLE_DARK_MODE':
      return { ...state, settings: { ...state.settings, darkMode: !state.settings.darkMode } };
    case 'TOGGLE_NOTIFICATIONS':
      return { ...state, settings: { ...state.settings, notifications: !state.settings.notifications } };
    case 'SET_NOTIFICATIONS':
      return { ...state, settings: { ...state.settings, notify_data: action.payload } };
    default:
      return state;
  }
}

// I18n types
type Locale = 'en' | 'de' | 'es' | 'fr'; // Add more locales as needed
type Translations = Record<string, Record<string, string>>;

// i18n context
const I18nContext = createContext<{
  locale: () => Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string>) => string;
}>();

// Provider component
export const AppProvider = (props: { children: JSX.Element }) => {
  const [state, setState] = createStore<AppState>(initialState);

  // Dispatch function to update state
  const dispatch = (action: AppAction) => {
    const newState = appReducer(state, action);
    setState(newState);
  };

  // i18n implementation
  const [locale, setLocale] = createSignal<Locale>('en');
  const translations: Translations = {
    en: {
      welcome: 'Welcome to Deepnest!',
      // Add more translations
    },
    de: {
      welcome: 'Willkommen bei Deepnest!',
      // Add more translations
    },
    // Add more locales
  };

  // Translation function
  const t = (key: string, params?: Record<string, string>): string => {
    const translation = translations[locale()]?.[key] || key;

    if (!params) return translation;

    return Object.entries(params).reduce(
      (acc, [key, value]) => acc.replace(`{{${key}}}`, value),
      translation
    );
  };

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      <AppContext.Provider value={{ state, dispatch }}>
        {props.children}
      </AppContext.Provider>
    </I18nContext.Provider>
  );
};

// Hook to use the app context
export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

// Convenience hooks for specific state slices
export const usePage = () => {
  const { state, dispatch } = useAppContext();

  return {
    active: () => state.page.active,
    setActive: (page: PageType) => dispatch({ type: 'SET_PAGE', payload: page }),
  };
};

export const useUser = () => {
  const { state, dispatch } = useAppContext();

  return {
    user: () => state.user,
    login: (username: string) => dispatch({ type: 'LOGIN', payload: { username } }),
    logout: () => dispatch({ type: 'LOGOUT' }),
  };
};

export const useSettings = () => {
  const { state, dispatch } = useAppContext();

  return {
    settings: () => state.settings,
    toggleDarkMode: () => dispatch({ type: 'TOGGLE_DARK_MODE' }),
    toggleNotifications: () => dispatch({ type: 'TOGGLE_NOTIFICATIONS' }),
    setNotifications: (payload: NotifyData) => dispatch({ type: 'SET_NOTIFICATIONS', payload: payload }),
  };
};

// i18n hook
export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nContext.Provider');
  }
  return context;
}
