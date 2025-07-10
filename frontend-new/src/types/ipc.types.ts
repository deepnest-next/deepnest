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
  
  // Background worker
  'background-stop': () => void;
}

export interface IPCEvents {
  // Progress updates
  'nest-progress': (progress: number) => void;
  'nest-complete': (results: NestResult[]) => void;
  'background-progress': (data: { progress: number; index: number }) => void;
  
  // Worker status
  'worker-status': (status: { isRunning: boolean; operation: string }) => void;
  
  // Errors
  'nest-error': (error: string) => void;
}

export interface IPCMessage<T = any> {
  channel: keyof IPCChannels | keyof IPCEvents;
  data?: T;
  error?: string;
}