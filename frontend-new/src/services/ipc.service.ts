import type { IPCChannels, IPCEvents, IPCMessage } from '@/types/ipc.types';
import type { AppConfig, NestResult } from '@/types/app.types';
import { isDevelopmentMode } from '@/utils/mockData';

declare global {
  interface Window {
    electronAPI?: {
      ipcRenderer: {
        invoke: <K extends keyof IPCChannels>(
          channel: K,
          ...args: Parameters<IPCChannels[K]>
        ) => Promise<ReturnType<IPCChannels[K]>>;
        
        on: <K extends keyof IPCEvents>(
          channel: K,
          listener: IPCEvents[K]
        ) => void;
        
        removeAllListeners: (channel: keyof IPCEvents) => void;
        
        send: (channel: string, ...args: any[]) => void;
      };
    };
  }
}

class IPCService {
  private eventListeners = new Map<string, Set<Function>>();

  get isAvailable(): boolean {
    return isDevelopmentMode() || (typeof window !== 'undefined' && !!window.electronAPI);
  }

  async invoke<K extends keyof IPCChannels>(
    channel: K,
    ...args: Parameters<IPCChannels[K]>
  ): Promise<ReturnType<IPCChannels[K]>> {
    if (!this.isAvailable) {
      throw new Error('IPC not available');
    }

    // Mock responses in development mode
    if (isDevelopmentMode()) {
      return this.handleMockInvoke(channel, ...args);
    }

    try {
      return await window.electronAPI!.ipcRenderer.invoke(channel, ...args);
    } catch (error) {
      console.error(`IPC invoke error on channel ${String(channel)}:`, error);
      throw error;
    }
  }

  private async handleMockInvoke(channel: string, ...args: any[]): Promise<any> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    console.info(`🔧 Mock IPC call: ${channel}`, args);

    switch (channel) {
      case 'read-config':
        return {
          units: 'mm',
          scale: 1,
          spacing: 2,
          rotations: 4,
          populationSize: 20,
          mutationRate: 10,
          threads: 4,
          placementType: 'gravity',
          mergeLines: true,
          timeRatio: 0.5,
          simplify: false,
          tolerance: 0.1,
          endpointTolerance: 0.05,
          svgScale: 1,
          dxfImportUnits: 'mm',
          dxfExportUnits: 'mm',
          exportSheetBounds: false,
          exportSheetSpacing: false,
          sheetSpacing: 10,
          useQuantityFromFilename: false,
          useSvgPreProcessor: false,
          conversionServer: 'https://converter.deepnest.app/convert'
        };
        
      case 'write-config':
      case 'save-preset':
      case 'delete-preset':
      case 'start-nesting':
      case 'stop-nesting':
        return undefined;
        
      case 'load-presets':
        return {
          'default': JSON.stringify({
            units: 'mm',
            spacing: 2,
            rotations: 4
          }),
          'precision': JSON.stringify({
            units: 'inches',
            spacing: 0.1,
            rotations: 8
          })
        };
        
      case 'open-file-dialog':
        return {
          canceled: false,
          filePaths: ['/mock/path/example.svg']
        };
        
      case 'save-file-dialog':
        return {
          canceled: false,
          filePath: '/mock/path/output.svg'
        };
        
      case 'import-parts':
        return [{
          id: 'mock-part-1',
          name: 'Mock Part',
          bounds: { x: 0, y: 0, width: 100, height: 50 },
          quantity: 1,
          rotation: 0
        }];
        
      default:
        console.warn(`🔧 Unhandled mock IPC channel: ${channel}`);
        return undefined;
    }
  }

  on<K extends keyof IPCEvents>(
    channel: K,
    listener: IPCEvents[K]
  ): () => void {
    if (!this.isAvailable) {
      console.warn('IPC not available, listener not registered');
      return () => {};
    }

    const channelStr = String(channel);
    
    if (!this.eventListeners.has(channelStr)) {
      this.eventListeners.set(channelStr, new Set());
    }
    
    this.eventListeners.get(channelStr)!.add(listener);
    
    // In development mode, just store the listener without attaching to real IPC
    if (isDevelopmentMode()) {
      console.info(`🔧 Mock IPC listener registered for: ${channelStr}`);
      return () => {
        const listeners = this.eventListeners.get(channelStr);
        if (listeners) {
          listeners.delete(listener);
          if (listeners.size === 0) {
            this.eventListeners.delete(channelStr);
          }
        }
      };
    }
    
    window.electronAPI!.ipcRenderer.on(channel, listener);

    // Return cleanup function
    return () => {
      const listeners = this.eventListeners.get(channelStr);
      if (listeners) {
        listeners.delete(listener);
        if (listeners.size === 0) {
          this.eventListeners.delete(channelStr);
          if (window.electronAPI?.ipcRenderer) {
            window.electronAPI.ipcRenderer.removeAllListeners(channel);
          }
        }
      }
    };
  }

  send(channel: string, ...args: any[]): void {
    if (!this.isAvailable) {
      console.warn('IPC not available, message not sent');
      return;
    }

    if (isDevelopmentMode()) {
      console.info(`🔧 Mock IPC send: ${channel}`, args);
      return;
    }

    window.electronAPI!.ipcRenderer.send(channel, ...args);
  }

  // Configuration methods
  async readConfig(): Promise<AppConfig> {
    return this.invoke('read-config');
  }

  async writeConfig(config: AppConfig): Promise<void> {
    return this.invoke('write-config', JSON.stringify(config));
  }

  // Preset methods
  async savePreset(name: string, config: AppConfig): Promise<void> {
    return this.invoke('save-preset', name, JSON.stringify(config));
  }

  async loadPresets(): Promise<Record<string, string>> {
    return this.invoke('load-presets');
  }

  async deletePreset(name: string): Promise<void> {
    return this.invoke('delete-preset', name);
  }

  // Nesting methods
  async startNesting(config: AppConfig): Promise<void> {
    return this.invoke('start-nesting', config);
  }

  async stopNesting(): Promise<void> {
    return this.invoke('stop-nesting');
  }

  stopBackgroundWorker(): void {
    this.send('background-stop');
  }

  // Event listeners with automatic cleanup
  onNestProgress(callback: (progress: number) => void): () => void {
    return this.on('nest-progress', callback);
  }

  onNestComplete(callback: (results: NestResult[]) => void): () => void {
    return this.on('nest-complete', callback);
  }

  onBackgroundProgress(callback: (data: { progress: number; index: number }) => void): () => void {
    return this.on('background-progress', callback);
  }

  onWorkerStatus(callback: (status: { isRunning: boolean; operation: string }) => void): () => void {
    return this.on('worker-status', callback);
  }

  onNestError(callback: (error: string) => void): () => void {
    return this.on('nest-error', callback);
  }

  // Cleanup all listeners
  cleanup(): void {
    if (!this.isAvailable) return;

    for (const channel of this.eventListeners.keys()) {
      window.electronAPI!.ipcRenderer.removeAllListeners(channel as keyof IPCEvents);
    }
    this.eventListeners.clear();
  }
}

export const ipcService = new IPCService();