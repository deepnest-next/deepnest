import { createStore } from 'solid-js/store';
import { createEffect } from 'solid-js';
import type { GlobalState, UIState, AppState, ProcessState } from '@/types/store.types';
import type { AppConfig } from '@/types/app.types';

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
    const stored = localStorage.getItem('deepnest-ui-state');
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...defaultUIState, ...parsed };
    }
  } catch (error) {
    console.warn('Failed to load UI state from localStorage:', error);
  }
  return defaultUIState;
};

// Initial global state
const initialState: GlobalState = {
  ui: loadUIStateFromStorage(),
  config: defaultConfig,
  app: defaultAppState,
  process: defaultProcessState
};

// Create the global store
export const [globalState, setGlobalState] = createStore<GlobalState>(initialState);

// Persist UI state to localStorage
createEffect(() => {
  try {
    localStorage.setItem('deepnest-ui-state', JSON.stringify(globalState.ui));
  } catch (error) {
    console.warn('Failed to save UI state to localStorage:', error);
  }
});

// Store actions
export const globalActions = {
  // UI actions
  setActiveTab: (tab: UIState['activeTab']) => {
    setGlobalState('ui', 'activeTab', tab);
  },

  setDarkMode: (enabled: boolean) => {
    setGlobalState('ui', 'darkMode', enabled);
    // Apply dark mode class to body
    if (typeof document !== 'undefined') {
      document.body.classList.toggle('dark-mode', enabled);
    }
  },

  setLanguage: (language: string) => {
    setGlobalState('ui', 'language', language);
  },

  setPanelWidth: (panel: keyof UIState['panels'], width: number) => {
    setGlobalState('ui', 'panels', panel, width);
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

  // Reset all data
  reset: () => {
    setGlobalState('app', defaultAppState);
    setGlobalState('process', defaultProcessState);
  }
};