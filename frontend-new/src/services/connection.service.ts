import { ipcService } from './ipc.service';
import { globalActions, globalState } from '@/stores/global.store';
import { createSignal, createEffect, onCleanup } from 'solid-js';

/**
 * Service for managing IPC connection status and error recovery
 * Provides connection monitoring, reconnection, and error handling
 */
class ConnectionService {
  private isConnectedSignal = createSignal(false);
  private lastHeartbeatSignal = createSignal(Date.now());
  private reconnectAttemptsSignal = createSignal(0);
  private connectionErrorSignal = createSignal<string | null>(null);
  
  private get isConnected() { return this.isConnectedSignal[0]; }
  private get setIsConnected() { return this.isConnectedSignal[1]; }
  private get lastHeartbeat() { return this.lastHeartbeatSignal[0]; }
  private get setLastHeartbeat() { return this.lastHeartbeatSignal[1]; }
  private get reconnectAttempts() { return this.reconnectAttemptsSignal[0]; }
  private get setReconnectAttempts() { return this.reconnectAttemptsSignal[1]; }
  private get connectionError() { return this.connectionErrorSignal[0]; }
  private get setConnectionError() { return this.connectionErrorSignal[1]; }
  
  private heartbeatInterval: number | null = null;
  private reconnectTimeout: number | null = null;
  private readonly maxReconnectAttempts = 5;
  private readonly heartbeatInterval_ms = 5000; // 5 seconds
  private readonly reconnectDelay_ms = 2000; // 2 seconds

  constructor() {
    this.initializeConnection();
  }

  /**
   * Initialize connection monitoring
   */
  private initializeConnection(): void {
    // Check initial connection status
    this.checkConnection();
    
    // Start heartbeat monitoring
    this.startHeartbeat();
    
    // Listen for connection-related events
    this.setupEventListeners();
  }

  /**
   * Check if IPC connection is available
   */
  private async checkConnection(): Promise<void> {
    try {
      const connected = ipcService.isAvailable;
      
      if (connected) {
        // Test connection with a simple config read
        await ipcService.readConfig();
        this.setConnectionStatus(true);
        this.setReconnectAttempts(0);
        this.setConnectionError(null);
      } else {
        throw new Error('IPC not available');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Connection failed';
      this.setConnectionStatus(false);
      this.setConnectionError(errorMessage);
      
      // Attempt reconnection if we haven't exceeded max attempts
      if (this.reconnectAttempts() < this.maxReconnectAttempts) {
        this.scheduleReconnect();
      }
    }
  }

  /**
   * Set connection status and update global state
   */
  private setConnectionStatus(connected: boolean): void {
    this.setIsConnected(connected);
    this.setLastHeartbeat(Date.now());
    
    // Update global state
    globalActions.setWorkerStatus({
      isRunning: connected && globalState.process.isNesting,
      currentOperation: connected ? 'Connected' : 'Disconnected'
    });
  }

  /**
   * Start heartbeat monitoring
   */
  private startHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    
    this.heartbeatInterval = setInterval(() => {
      this.checkConnection();
    }, this.heartbeatInterval_ms);
  }

  /**
   * Stop heartbeat monitoring
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Schedule reconnection attempt
   */
  private scheduleReconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    
    const attempts = this.reconnectAttempts();
    this.setReconnectAttempts(attempts + 1);
    
    // Exponential backoff for reconnection delays
    const delay = Math.min(this.reconnectDelay_ms * Math.pow(2, attempts), 30000);
    
    this.reconnectTimeout = setTimeout(() => {
      this.checkConnection();
    }, delay);
  }

  /**
   * Setup event listeners for connection-related events
   */
  private setupEventListeners(): void {
    // Listen for nesting errors that might indicate connection issues
    ipcService.onNestError((error: string) => {
      if (error.includes('IPC') || error.includes('connection') || error.includes('timeout')) {
        this.setConnectionError(error);
        this.setConnectionStatus(false);
      }
    });

    // Create an effect to handle connection status changes
    createEffect(() => {
      const connected = this.isConnected();
      const error = this.connectionError();
      
      if (!connected && error) {
        globalActions.setError(`Connection lost: ${error}`);
      } else if (connected && globalState.process.lastError?.includes('Connection lost')) {
        globalActions.setError(null);
      }
    });
  }

  /**
   * Force reconnection attempt
   */
  async forceReconnect(): Promise<void> {
    this.setReconnectAttempts(0);
    this.setConnectionError(null);
    await this.checkConnection();
  }

  /**
   * Check if currently connected
   */
  get connected(): boolean {
    return this.isConnected();
  }

  /**
   * Get connection error if any
   */
  get error(): string | null {
    return this.connectionError();
  }

  /**
   * Get reconnection attempts count
   */
  get reconnectionAttempts(): number {
    return this.reconnectAttempts();
  }

  /**
   * Get last heartbeat timestamp
   */
  get lastHeartbeatTime(): number {
    return this.lastHeartbeat();
  }

  /**
   * Check if connection is healthy (recent heartbeat)
   */
  get isHealthy(): boolean {
    const now = Date.now();
    const lastBeat = this.lastHeartbeat();
    const timeSinceLastBeat = now - lastBeat;
    
    return this.isConnected() && timeSinceLastBeat < this.heartbeatInterval_ms * 2;
  }

  /**
   * Get connection status info
   */
  get status() {
    return {
      connected: this.connected,
      healthy: this.isHealthy,
      error: this.error,
      reconnectAttempts: this.reconnectionAttempts,
      lastHeartbeat: this.lastHeartbeatTime
    };
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    this.stopHeartbeat();
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
  }
}

export const connectionService = new ConnectionService();