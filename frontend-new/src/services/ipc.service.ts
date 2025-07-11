import type { IPCChannels, IPCEvents, IPCMessage, BackgroundWorkerResult, BackgroundWorkerProgress } from '@/types/ipc.types';
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
  private nestingProgress = 0;
  private isNesting = false;
  private activeWorkers = new Set<number>();
  private nestResults: NestResult[] = [];

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

  // Mock development mode background worker simulation
  private simulateBackgroundWorker(): void {
    if (!isDevelopmentMode()) return;
    
    console.info('🔧 Simulating background worker progress...');
    
    let progress = 0;
    const interval = setInterval(() => {
      progress += 0.1;
      
      // Emit progress update
      this.emitToUIListeners('background-progress', {
        index: 0,
        progress: Math.min(progress, 1)
      });
      
      if (progress >= 1) {
        clearInterval(interval);
        
        // Emit completion
        this.emitToUIListeners('background-progress', {
          index: 0,
          progress: -1
        });
        
        // Emit mock result
        setTimeout(() => {
          this.emitToUIListeners('background-response', {
            index: 0,
            fitness: 0.85,
            area: 85000,
            totalarea: 100000,
            mergedLength: 0,
            utilisation: 0.85,
            placements: [
              {
                sheet: 0,
                sheetid: 1,
                sheetplacements: [
                  {
                    id: 1,
                    source: 0,
                    x: 10,
                    y: 10,
                    rotation: 0
                  }
                ]
              }
            ]
          });
        }, 500);
      }
    }, 200);
  }

  // Enhanced start nesting for development mode
  async startNesting(config: AppConfig): Promise<void> {
    this.isNesting = true;
    this.nestingProgress = 0;
    this.nestResults = [];
    this.activeWorkers.clear();
    
    // Initialize background worker listeners if not already done
    if (!this.eventListeners.has('background-progress')) {
      this.initializeBackgroundWorkerListeners();
    }
    
    // Emit initial status
    this.emitToUIListeners('nest-status', {
      isRunning: true,
      operation: 'Starting nesting...'
    });
    
    // In development mode, simulate the background worker
    if (isDevelopmentMode()) {
      setTimeout(() => this.simulateBackgroundWorker(), 1000);
      return Promise.resolve();
    }
    
    return this.invoke('start-nesting', config);
  }

  // Enhanced stop nesting for development mode
  async stopNesting(): Promise<void> {
    this.isNesting = false;
    this.activeWorkers.clear();
    
    // Emit final status
    this.emitToUIListeners('nest-status', {
      isRunning: false,
      operation: 'Stopped'
    });
    
    if (isDevelopmentMode()) {
      return Promise.resolve();
    }
    
    return this.invoke('stop-nesting');
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

  // File operation methods
  async openFileDialog(): Promise<{ canceled: boolean; filePaths: string[] }> {
    return this.invoke('open-file-dialog');
  }

  async saveFileDialog(): Promise<{ canceled: boolean; filePath: string }> {
    return this.invoke('save-file-dialog');
  }

  async importParts(filePaths: string[]): Promise<NestResult[]> {
    return this.invoke('import-parts', filePaths);
  }

  stopBackgroundWorker(): void {
    this.send('background-stop');
    this.isNesting = false;
    this.activeWorkers.clear();
  }

  // Initialize background worker event listeners
  initializeBackgroundWorkerListeners(): void {
    // Listen for background worker progress updates
    this.on('background-progress', (data: BackgroundWorkerProgress) => {
      this.activeWorkers.add(data.index);
      
      // Progress of -1 means this worker is complete
      if (data.progress === -1) {
        this.activeWorkers.delete(data.index);
      }
      
      // Update overall progress based on worker progress
      this.nestingProgress = data.progress === -1 ? 1 : Math.max(this.nestingProgress, data.progress);
      
      // Emit high-level progress event
      this.emitToUIListeners('nest-progress', this.nestingProgress);
      
      // Update nesting status
      this.emitToUIListeners('nest-status', {
        isRunning: this.isNesting && this.activeWorkers.size > 0,
        operation: data.progress === -1 ? 'Complete' : 'Calculating placement...'
      });
    });

    // Listen for background worker results
    this.on('background-response', (data: BackgroundWorkerResult) => {
      this.handleBackgroundWorkerResult(data);
    });

    // Listen for setPlacements events (legacy event name)
    this.on('setPlacements', (data: BackgroundWorkerResult) => {
      this.handleBackgroundWorkerResult(data);
    });
  }

  private handleBackgroundWorkerResult(data: BackgroundWorkerResult): void {
    // Convert background worker result to UI format
    const nestResult: NestResult = {
      id: `result-${data.index}`,
      fitness: data.fitness,
      area: data.area,
      totalArea: data.totalarea,
      utilisation: data.utilisation,
      sheets: data.placements.map(placement => ({
        id: placement.sheetid,
        parts: placement.sheetplacements.map(part => ({
          id: part.id,
          x: part.x,
          y: part.y,
          rotation: part.rotation
        }))
      }))
    };

    // Update results array
    this.nestResults.push(nestResult);
    
    // If this is the best result so far, emit complete event
    if (this.nestResults.length === 1 || data.fitness < Math.min(...this.nestResults.map(r => r.fitness))) {
      this.emitToUIListeners('nest-complete', [...this.nestResults]);
    }
  }

  private emitToUIListeners(channel: keyof IPCEvents, data: any): void {
    const listeners = this.eventListeners.get(channel);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          (listener as Function)(data);
        } catch (error) {
          console.error(`Error in ${channel} listener:`, error);
        }
      });
    }
  }


  // High-level event listeners for UI components
  onNestProgress(callback: (progress: number) => void): () => void {
    return this.on('nest-progress', callback);
  }

  onNestComplete(callback: (results: NestResult[]) => void): () => void {
    return this.on('nest-complete', callback);
  }

  onNestStatus(callback: (status: { isRunning: boolean; operation: string }) => void): () => void {
    return this.on('nest-status', callback);
  }

  onNestError(callback: (error: string) => void): () => void {
    return this.on('nest-error', callback);
  }

  // Low-level background worker event listeners (for advanced use)
  onBackgroundProgress(callback: (data: BackgroundWorkerProgress) => void): () => void {
    return this.on('background-progress', callback);
  }

  onBackgroundResponse(callback: (data: BackgroundWorkerResult) => void): () => void {
    return this.on('background-response', callback);
  }

  onSetPlacements(callback: (data: BackgroundWorkerResult) => void): () => void {
    return this.on('setPlacements', callback);
  }

  // Cleanup all listeners
  cleanup(): void {
    if (!this.isAvailable) return;

    for (const channel of this.eventListeners.keys()) {
      window.electronAPI!.ipcRenderer.removeAllListeners(channel as keyof IPCEvents);
    }
    this.eventListeners.clear();
    
    // Reset nesting state
    this.isNesting = false;
    this.nestingProgress = 0;
    this.activeWorkers.clear();
    this.nestResults = [];
  }
}

export const ipcService = new IPCService();