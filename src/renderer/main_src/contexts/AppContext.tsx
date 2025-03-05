import { createContext, useContext, JSX, createEffect, ErrorBoundary } from 'solid-js';
import { createStore } from 'solid-js/store';
// Import from the consolidated I18nContext
import { I18nProvider, useI18n as useI18nHook } from './I18nContext';

// Types
export type PageType = 'main' | 'settings' | 'account' | 'privacy' | 'impressum' | 'nesting' | 'sponsors';

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
  theme: 'light' | 'dark'; // Add theme property
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
  | { type: 'SET_NOTIFICATIONS'; payload: NotifyData }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<SettingsState> }; // New action type

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
    theme: 'dark', // Default theme setting
  },
};

// Create an error fallback component
export const ErrorFallback = (props: { error: Error; reset: () => void }) => {
  return (
    <div class="error-boundary p-4 m-4 bg-red-100 dark:bg-red-900 rounded-lg shadow-lg">
      <h2 class="text-xl font-bold text-red-700 dark:text-red-300 mb-2">Something went wrong</h2>
      <p class="text-gray-700 dark:text-gray-300 mb-4">
        {props.error.message || "An unexpected error occurred"}
      </p>
      <pre class="text-sm bg-red-50 dark:bg-red-800 p-2 rounded overflow-auto max-h-48 mb-4">
        {props.error.stack}
      </pre>
      <button
        class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        onClick={props.reset}
      >
        Try again
      </button>
    </div>
  );
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
    case 'UPDATE_SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.payload } };
    default:
      return state;
  }
}

// Provider component
export const AppProvider = (props: { children: JSX.Element }) => {
  const [state, setState] = createStore<AppState>(initialState);

  // Dispatch function to update state
  const dispatch = (action: AppAction) => {
    const newState = appReducer(state, action);
    setState(newState);
  };

  return (
    <I18nProvider>
      <AppContext.Provider value={{ state, dispatch }}>
        <ErrorBoundary fallback={(props) => <ErrorFallback {...props} />}>
          {props.children}
        </ErrorBoundary>
      </AppContext.Provider>
    </I18nProvider>
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
    updateSettings: (settings: Partial<SettingsState>) => dispatch({ type: 'UPDATE_SETTINGS', payload: settings }),
  };
};

// Add and export the useThemeToggle hook
export const useThemeToggle = () => {
  const { settings, updateSettings } = useSettings();

  const toggleTheme = () => {
    const newTheme = settings().theme === 'dark' ? 'light' : 'dark';
    console.log(`Toggling theme to: ${newTheme}`); // Add debug logging
    updateSettings({ theme: newTheme });

    // Apply dark class to html element directly
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Initialize dark mode on hook usage immediately
  createEffect(() => {
    const theme = settings().theme;
    console.log(`Applying initial theme: ${theme}`); // Debug logging

    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  });

  return {
    isDark: () => settings().theme === 'dark',
    toggleTheme
  };
};

// Enhanced i18n hook
export const useI18n = useI18nHook;
