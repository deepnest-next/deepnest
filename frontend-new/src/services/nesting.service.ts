import { ipcService } from './ipc.service';
import { globalActions, globalState } from '@/stores/global.store';
import type { AppConfig, NestResult } from '@/types/app.types';
import type { BackgroundWorkerProgress, BackgroundWorkerResult } from '@/types/ipc.types';

/**
 * Service for managing nesting operations and background worker communication
 * Integrates IPC service with global state management
 */
class NestingService {
  private progressCleanup: (() => void) | null = null;
  private statusCleanup: (() => void) | null = null;
  private completeCleanup: (() => void) | null = null;
  private errorCleanup: (() => void) | null = null;

  constructor() {
    // Initialize IPC listeners when service is created
    this.initializeEventListeners();
  }

  /**
   * Initialize event listeners for background worker communication
   */
  private initializeEventListeners(): void {
    // Listen for progress updates
    this.progressCleanup = ipcService.onNestProgress((progress: number) => {
      globalActions.setNestingProgress(progress);
    });

    // Listen for status updates
    this.statusCleanup = ipcService.onNestStatus((status: { isRunning: boolean; operation: string }) => {
      globalActions.setNestingStatus(status.isRunning);
      globalActions.setWorkerStatus({
        isRunning: status.isRunning,
        currentOperation: status.operation
      });
    });

    // Listen for completed results
    this.completeCleanup = ipcService.onNestComplete((results: NestResult[]) => {
      globalActions.setNests(results);
      
      // Set the best result as current
      if (results.length > 0) {
        const bestResult = results.reduce((best, current) => 
          current.fitness < best.fitness ? current : best
        );
        globalActions.setCurrentNest(bestResult);
      }
    });

    // Listen for errors
    this.errorCleanup = ipcService.onNestError((error: string) => {
      globalActions.setError(error);
    });
  }

  /**
   * Start nesting operation with current configuration
   */
  async startNesting(): Promise<void> {
    try {
      // Clear any previous errors
      globalActions.setError(null);
      
      // Get current configuration from store
      const config = globalState.config;
      
      // Validate configuration
      if (!this.validateConfig(config)) {
        throw new Error('Invalid configuration');
      }

      // Validate parts
      if (globalState.app.parts.length === 0) {
        throw new Error('No parts loaded. Please import parts before starting nesting.');
      }

      // Validate sheets
      if (globalState.app.sheets.length === 0) {
        throw new Error('No sheets configured. Please configure sheets before starting nesting.');
      }

      // Start the nesting process
      await ipcService.startNesting(config);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      globalActions.setError(errorMessage);
      globalActions.setNestingStatus(false);
      throw error;
    }
  }

  /**
   * Stop nesting operation
   */
  async stopNesting(): Promise<void> {
    try {
      await ipcService.stopNesting();
      globalActions.setNestingStatus(false);
      globalActions.setNestingProgress(0);
      globalActions.setError(null);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to stop nesting';
      globalActions.setError(errorMessage);
      throw error;
    }
  }

  /**
   * Stop background worker immediately
   */
  stopBackgroundWorker(): void {
    ipcService.stopBackgroundWorker();
    globalActions.setNestingStatus(false);
    globalActions.setNestingProgress(0);
    globalActions.setWorkerStatus({
      isRunning: false,
      currentOperation: 'Stopped'
    });
  }

  /**
   * Validate nesting configuration
   */
  private validateConfig(config: AppConfig): boolean {
    if (!config) return false;
    
    // Check required numeric values
    if (config.spacing < 0) return false;
    if (config.rotations < 1) return false;
    if (config.populationSize < 1) return false;
    if (config.mutationRate < 0 || config.mutationRate > 100) return false;
    if (config.threads < 1) return false;
    
    // Check required string values
    if (!config.units || !config.placementType) return false;
    
    return true;
  }

  /**
   * Get current nesting status
   */
  get isNesting(): boolean {
    return globalState.process.isNesting;
  }

  /**
   * Get current nesting progress (0-1)
   */
  get progress(): number {
    return globalState.process.progress;
  }

  /**
   * Get current worker status
   */
  get workerStatus() {
    return globalState.process.workerStatus;
  }

  /**
   * Get current nesting results
   */
  get results(): NestResult[] {
    return globalState.app.nests;
  }

  /**
   * Get last error
   */
  get lastError(): string | null {
    return globalState.process.lastError;
  }

  /**
   * Register low-level background worker event listeners
   * Use this for advanced debugging or custom behavior
   */
  onBackgroundProgress(callback: (data: BackgroundWorkerProgress) => void): () => void {
    return ipcService.onBackgroundProgress(callback);
  }

  onBackgroundResponse(callback: (data: BackgroundWorkerResult) => void): () => void {
    return ipcService.onBackgroundResponse(callback);
  }

  /**
   * Clean up all event listeners
   */
  cleanup(): void {
    this.progressCleanup?.();
    this.statusCleanup?.();
    this.completeCleanup?.();
    this.errorCleanup?.();
    
    this.progressCleanup = null;
    this.statusCleanup = null;
    this.completeCleanup = null;
    this.errorCleanup = null;
  }
}

export const nestingService = new NestingService();