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
      if (stored) {
        const parsed = JSON.parse(stored);
        return { ...defaultUIState, ...parsed };
      }
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
    // Persist to localStorage
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem('deepnest-ui-state', JSON.stringify(globalState.ui));
      } catch (error) {
        console.warn('Failed to save UI state to localStorage:', error);
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