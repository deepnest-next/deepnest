import type { AppConfig, Part, Sheet, NestResult, ImportedFile, Preset } from './app.types';

export interface UIState {
  activeTab: 'parts' | 'nests' | 'sheets' | 'settings' | 'imprint';
  darkMode: boolean;
  language: string;
  theme?: string;
  showTooltips?: boolean;
  showStatusBar?: boolean;
  modals: {
    presetModal: boolean;
    helpModal: boolean;
  };
  panels: {
    partsWidth: number;
    resultsHeight: number;
  };
}

export interface ProcessState {
  isNesting: boolean;
  progress: number;
  currentNest: NestResult | null;
  workerStatus: WorkerStatus;
  lastError: string | null;
}

export interface WorkerStatus {
  isRunning: boolean;
  currentOperation: string;
  threadsActive: number;
}

export interface AppState {
  parts: Part[];
  sheets: Sheet[];
  nests: NestResult[];
  presets: Record<string, Preset>;
  importedFiles: ImportedFile[];
}

export interface GlobalState {
  ui: UIState;
  config: AppConfig;
  app: AppState;
  process: ProcessState;
}

export interface IPCState {
  isConnected: boolean;
  nestingProgress: number;
  currentResults: NestResult[];
  backgroundWorkerStatus: WorkerStatus;
}