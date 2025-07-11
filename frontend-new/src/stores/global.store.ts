import { createStore } from 'solid-js/store';
import type { GlobalState, UIState, AppState, ProcessState } from '@/types/store.types';
import type { AppConfig } from '@/types/app.types';
import { isDevelopmentMode, createMockGlobalState } from '@/utils/mockData';

// Default configuration
const defaultConfig: AppConfig = {
  units: 'inches',
  scale: 72,
  spacing: 0,
  rotations: 4,
  populationSize: 10,
  mutationRate: 10,
  threads: 4,
  placementType: 'gravity',
  mergeLines: true,
  timeRatio: 0.5,
  simplify: false,
  tolerance: 0.72,
  endpointTolerance: 0.36,
  svgScale: 72,
  dxfImportUnits: 'mm',
  dxfExportUnits: 'mm',
  exportSheetBounds: false,
  exportSheetSpacing: false,
  sheetSpacing: 10,
  useQuantityFromFilename: false,
  useSvgPreProcessor: false,
  conversionServer: 'https://converter.deepnest.app/convert'
};

// Default UI state
const defaultUIState: UIState = {
  activeTab: 'parts',
  darkMode: false,
  language: 'en',
  modals: {
    presetModal: false,
    helpModal: false
  },
  panels: {
    partsWidth: 300,
    resultsHeight: 200
  }
};

// Default app state
const defaultAppState: AppState = {
  parts: [],
  sheets: [],
  nests: [],
  presets: {},
  importedFiles: []
};

// Default process state
const defaultProcessState: ProcessState = {
  isNesting: false,
  progress: 0,
  currentNest: null,
  workerStatus: {
    isRunning: false,
    currentOperation: '',
    threadsActive: 0
  },
  lastError: null
};

// Load initial state from localStorage
const loadUIStateFromStorage = (): UIState => {
  try {
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem('deepnest-ui-state');
      let uiState = defaultUIState;
      
      if (stored) {
        const parsed = JSON.parse(stored);
        uiState = { ...defaultUIState, ...parsed };
      }
      
      // Override darkMode with localStorage.theme if it exists (Tailwind standard)
      if ('theme' in localStorage) {
        uiState.darkMode = localStorage.theme === 'dark';
      } else {
        // Use system preference if no theme is set
        uiState.darkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
      }
      
      return uiState;
    }
  } catch (error) {
    console.warn('Failed to load UI state from localStorage:', error);
  }
  return defaultUIState;
};

// Initial global state - use mock data in development
const initialState: GlobalState = isDevelopmentMode() 
  ? createMockGlobalState()
  : {
      ui: loadUIStateFromStorage(),
      config: defaultConfig,
      app: defaultAppState,
      process: defaultProcessState
    };

// Create the global store
export const [globalState, setGlobalState] = createStore<GlobalState>(initialState);

// Initialize dark mode on app startup
if (typeof document !== 'undefined' && initialState.ui.darkMode) {
  document.documentElement.classList.add('dark');
}

// Log initialization in development
if (isDevelopmentMode()) {
  console.info('🔧 Development mode: Global store initialized with mock data');
}

// Store actions
export const globalActions = {
  // UI actions
  setActiveTab: (tab: UIState['activeTab']) => {
    setGlobalState('ui', 'activeTab', tab);
  },

  setDarkMode: (enabled: boolean) => {
    setGlobalState('ui', 'darkMode', enabled);
    
    // Update localStorage theme using Tailwind standard pattern
    if (typeof localStorage !== 'undefined') {
      try {
        if (enabled) {
          localStorage.theme = 'dark';
        } else {
          localStorage.theme = 'light';
        }
        // Also persist the UI state for other settings
        localStorage.setItem('deepnest-ui-state', JSON.stringify(globalState.ui));
      } catch (error) {
        console.warn('Failed to save theme to localStorage:', error);
      }
    }
  },

  setThemePreference: (preference: 'light' | 'dark' | 'system') => {
    if (typeof localStorage !== 'undefined') {
      try {
        if (preference === 'system') {
          // Remove theme to respect OS preference
          localStorage.removeItem('theme');
          const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          setGlobalState('ui', 'darkMode', systemDark);
        } else {
          // Set explicit theme
          localStorage.theme = preference;
          setGlobalState('ui', 'darkMode', preference === 'dark');
        }
        // Also persist the UI state for other settings
        localStorage.setItem('deepnest-ui-state', JSON.stringify(globalState.ui));
      } catch (error) {
        console.warn('Failed to save theme preference to localStorage:', error);
      }
    }
  },

  setLanguage: (language: string) => {
    setGlobalState('ui', 'language', language);
    // Persist to localStorage
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem('deepnest-ui-state', JSON.stringify(globalState.ui));
      } catch (error) {
        console.warn('Failed to save UI state to localStorage:', error);
      }
    }
  },

  setPanelWidth: (panel: keyof UIState['panels'], width: number) => {
    setGlobalState('ui', 'panels', panel, width);
    // Persist to localStorage
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem('deepnest-ui-state', JSON.stringify(globalState.ui));
      } catch (error) {
        console.warn('Failed to save UI state to localStorage:', error);
      }
    }
  },

  openModal: (modal: keyof UIState['modals']) => {
    setGlobalState('ui', 'modals', modal, true);
  },

  closeModal: (modal: keyof UIState['modals']) => {
    setGlobalState('ui', 'modals', modal, false);
  },

  // Config actions
  updateConfig: (config: Partial<AppConfig>) => {
    setGlobalState('config', config);
  },

  resetConfig: () => {
    setGlobalState('config', defaultConfig);
  },

  // App data actions
  setParts: (parts: AppState['parts']) => {
    setGlobalState('app', 'parts', parts);
  },

  addPart: (part: AppState['parts'][0]) => {
    setGlobalState('app', 'parts', (prev) => [...prev, part]);
  },

  removePart: (partId: string) => {
    setGlobalState('app', 'parts', (prev) => prev.filter(p => p.id !== partId));
  },

  updatePart: (partId: string, updates: Partial<AppState['parts'][0]>) => {
    setGlobalState('app', 'parts', (part) => part.id === partId, updates);
  },

  setNests: (nests: AppState['nests']) => {
    setGlobalState('app', 'nests', nests);
  },

  addNest: (nest: AppState['nests'][0]) => {
    setGlobalState('app', 'nests', (prev) => [...prev, nest]);
  },

  setCurrentNest: (nest: AppState['nests'][0] | null) => {
    setGlobalState('process', 'currentNest', nest);
  },

  setPresets: (presets: AppState['presets']) => {
    setGlobalState('app', 'presets', presets);
  },

  addPreset: (preset: any) => {
    setGlobalState('app', 'presets', preset.id, preset);
  },

  removePreset: (presetId: string) => {
    setGlobalState('app', 'presets', (prev) => {
      const newPresets = { ...prev };
      delete newPresets[presetId];
      return newPresets;
    });
  },

  updatePreset: (presetId: string, updates: any) => {
    setGlobalState('app', 'presets', presetId, (prev) => ({ ...prev, ...updates }));
  },

  // Process actions
  setNestingStatus: (isNesting: boolean) => {
    setGlobalState('process', 'isNesting', isNesting);
  },

  setNestingProgress: (progress: number) => {
    setGlobalState('process', 'progress', progress);
  },

  setWorkerStatus: (status: Partial<ProcessState['workerStatus']>) => {
    setGlobalState('process', 'workerStatus', status);
  },

  setError: (error: string | null) => {
    setGlobalState('process', 'lastError', error);
  },

  setMessage: (message: string | null) => {
    // For now, just log the message. In a real app, you'd show a toast/notification
    if (message) {
      console.info('App Message:', message);
    }
  },

  setShowTooltips: (show: boolean) => {
    setGlobalState('ui', 'showTooltips', show);
  },

  setShowStatusBar: (show: boolean) => {
    setGlobalState('ui', 'showStatusBar', show);
  },

  setTheme: (theme: string) => {
    setGlobalState('ui', 'theme', theme);
  },

  resetToDefaults: () => {
    setGlobalState('config', defaultConfig);
    setGlobalState('ui', defaultUIState);
  },

  // Reset all data
  reset: () => {
    setGlobalState('app', defaultAppState);
    setGlobalState('process', defaultProcessState);
  }
};