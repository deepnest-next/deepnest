import type { IPCChannels, IPCEvents, IPCMessage } from '@/types/ipc.types';
import type { AppConfig, NestResult } from '@/types/app.types';

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
    return typeof window !== 'undefined' && !!window.electronAPI;
  }

  async invoke<K extends keyof IPCChannels>(
    channel: K,
    ...args: Parameters<IPCChannels[K]>
  ): Promise<ReturnType<IPCChannels[K]>> {
    if (!this.isAvailable) {
      throw new Error('IPC not available');
    }

    try {
      return await window.electronAPI!.ipcRenderer.invoke(channel, ...args);
    } catch (error) {
      console.error(`IPC invoke error on channel ${String(channel)}:`, error);
      throw error;
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
    
    window.electronAPI!.ipcRenderer.on(channel, listener);

    // Return cleanup function
    return () => {
      const listeners = this.eventListeners.get(channelStr);
      if (listeners) {
        listeners.delete(listener);
        if (listeners.size === 0) {
          this.eventListeners.delete(channelStr);
          window.electronAPI!.ipcRenderer.removeAllListeners(channel);
        }
      }
    };
  }

  send(channel: string, ...args: any[]): void {
    if (!this.isAvailable) {
      console.warn('IPC not available, message not sent');
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