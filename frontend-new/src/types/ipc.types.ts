import type { AppConfig, NestResult, Preset } from './app.types';

export interface IPCChannels {
  // Configuration
  'read-config': () => AppConfig;
  'write-config': (config: string) => void;
  
  // Presets
  'save-preset': (name: string, config: string) => void;
  'load-presets': () => Record<string, string>;
  'delete-preset': (name: string) => void;
  
  // Nesting
  'start-nesting': (config: AppConfig) => void;
  'stop-nesting': () => void;
  
  // File operations
  'open-file-dialog': () => { canceled: boolean; filePaths: string[] };
  'save-file-dialog': () => { canceled: boolean; filePath: string };
  'import-parts': (filePaths: string[]) => NestResult[];
}

export interface BackgroundWorkerPayload {
  index: number;
  individual: {
    placement: number[];
    rotation: number[];
  };
  ids: number[];
  sources: number[];
  children: any[];
  filenames: string[];
  sheets: any[];
  sheetids: number[];
  sheetsources: number[];
  sheetchildren: any[];
  config: AppConfig;
}

export interface BackgroundWorkerResult {
  index: number;
  fitness: number;
  area: number;
  totalarea: number;
  mergedLength: number;
  utilisation: number;
  placements: Array<{
    sheet: number;
    sheetid: number;
    sheetplacements: Array<{
      id: number;
      source: number;
      x: number;
      y: number;
      rotation: number;
    }>;
  }>;
}

export interface BackgroundWorkerProgress {
  index: number;
  progress: number; // 0-1, or -1 for complete
}

export interface IPCEvents {
  // Background worker events (actual IPC events from main process)
  'background-progress': (data: BackgroundWorkerProgress) => void;
  'background-response': (data: BackgroundWorkerResult) => void;
  'setPlacements': (data: BackgroundWorkerResult) => void;
  
  // High-level nesting events (abstracted for UI)
  'nest-progress': (progress: number) => void;
  'nest-complete': (results: NestResult[]) => void;
  'nest-status': (status: { isRunning: boolean; operation: string }) => void;
  'nest-error': (error: string) => void;
}

export interface IPCMessage<T = any> {
  channel: keyof IPCChannels | keyof IPCEvents;
  data?: T;
  error?: string;
}