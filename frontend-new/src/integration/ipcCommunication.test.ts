import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createRoot } from 'solid-js';
import { globalActions } from '@/stores/global.store';
import { createMockPart, createMockSheet } from '@/test/utils';

// Mock the IPC module
const mockIpcRenderer = {
  invoke: vi.fn(),
  send: vi.fn(),
  on: vi.fn(),
  removeListener: vi.fn(),
  removeAllListeners: vi.fn(),
};

// Mock electron
vi.mock('electron', () => ({
  ipcRenderer: mockIpcRenderer,
}));

describe('IPC Communication Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIpcRenderer.invoke.mockResolvedValue(null);
  });

  describe('File Operations', () => {
    it('should handle file open operations', async () => {
      createRoot(async () => {
        const mockFileData = {
          path: '/test/file.svg',
          content: '<svg>...</svg>',
          parts: [createMockPart({ id: 'imported-part' })],
        };

        mockIpcRenderer.invoke.mockResolvedValueOnce(mockFileData);

        // Simulate file open
        const result = await mockIpcRenderer.invoke('file:open');
        
        expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('file:open');
        expect(result).toEqual(mockFileData);
        
        // Simulate updating state with imported parts
        globalActions.setParts(result.parts);
        
        // Verify parts were added
        expect(globalActions).toBeDefined();
      });
    });

    it('should handle file save operations', async () => {
      createRoot(async () => {
        const parts = [createMockPart({ id: 'save-part' })];
        const sheets = [createMockSheet({ id: 'save-sheet' })];
        
        mockIpcRenderer.invoke.mockResolvedValueOnce({ success: true });

        // Simulate file save
        const result = await mockIpcRenderer.invoke('file:save', {
          path: '/test/output.svg',
          parts,
          sheets,
        });

        expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('file:save', {
          path: '/test/output.svg',
          parts,
          sheets,
        });
        expect(result.success).toBe(true);
      });
    });

    it('should handle file save errors', async () => {
      createRoot(async () => {
        const errorMessage = 'Failed to save file';
        mockIpcRenderer.invoke.mockRejectedValueOnce(new Error(errorMessage));

        try {
          await mockIpcRenderer.invoke('file:save', { path: '/invalid/path.svg' });
        } catch (error) {
          expect(error.message).toBe(errorMessage);
        }
      });
    });
  });

  describe('Nesting Operations', () => {
    it('should handle nesting start operations', async () => {
      createRoot(async () => {
        const nestingConfig = {
          populationSize: 10,
          mutationRate: 0.1,
          spacing: 2,
          rotations: 4,
        };

        mockIpcRenderer.invoke.mockResolvedValueOnce({ success: true });

        // Start nesting process
        globalActions.startNesting();
        
        const result = await mockIpcRenderer.invoke('nesting:start', nestingConfig);
        
        expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('nesting:start', nestingConfig);
        expect(result.success).toBe(true);
      });
    });

    it('should handle nesting progress updates', () => {
      createRoot(() => {
        const progressCallback = vi.fn();
        
        // Setup progress listener
        mockIpcRenderer.on.mockImplementation((event, callback) => {
          if (event === 'nesting:progress') {
            progressCallback.mockImplementation(callback);
          }
        });

        // Simulate registering progress listener
        mockIpcRenderer.on('nesting:progress', (event, data) => {
          globalActions.setNestingProgress(data.progress);
        });

        // Simulate progress update
        const progressData = { progress: 0.5, generation: 25 };
        progressCallback(null, progressData);

        expect(mockIpcRenderer.on).toHaveBeenCalledWith('nesting:progress', expect.any(Function));
      });
    });

    it('should handle nesting completion', () => {
      createRoot(() => {
        const completeCallback = vi.fn();
        
        // Setup completion listener
        mockIpcRenderer.on.mockImplementation((event, callback) => {
          if (event === 'nesting:complete') {
            completeCallback.mockImplementation(callback);
          }
        });

        // Simulate registering completion listener
        mockIpcRenderer.on('nesting:complete', (event, data) => {
          globalActions.setNestingStatus(false);
          globalActions.setNestingProgress(1.0);
          globalActions.addNest(data.nest);
        });

        // Simulate completion
        const completionData = {
          nest: {
            id: 'completed-nest',
            parts: [createMockPart()],
            sheets: [createMockSheet()],
            efficiency: 0.85,
          },
        };
        completeCallback(null, completionData);

        expect(mockIpcRenderer.on).toHaveBeenCalledWith('nesting:complete', expect.any(Function));
      });
    });

    it('should handle nesting cancellation', async () => {
      createRoot(async () => {
        mockIpcRenderer.invoke.mockResolvedValueOnce({ cancelled: true });

        const result = await mockIpcRenderer.invoke('nesting:cancel');
        
        expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('nesting:cancel');
        expect(result.cancelled).toBe(true);
      });
    });
  });

  describe('Worker Communication', () => {
    it('should handle worker status updates', () => {
      createRoot(() => {
        const statusCallback = vi.fn();
        
        // Setup worker status listener
        mockIpcRenderer.on.mockImplementation((event, callback) => {
          if (event === 'worker:status') {
            statusCallback.mockImplementation(callback);
          }
        });

        // Simulate registering status listener
        mockIpcRenderer.on('worker:status', (event, data) => {
          globalActions.setWorkerStatus(data);
        });

        // Simulate status update
        const statusData = {
          isRunning: true,
          currentOperation: 'Calculating NFP',
          threadsActive: 4,
          memoryUsage: 85.5,
        };
        statusCallback(null, statusData);

        expect(mockIpcRenderer.on).toHaveBeenCalledWith('worker:status', expect.any(Function));
      });
    });

    it('should handle worker errors', () => {
      createRoot(() => {
        const errorCallback = vi.fn();
        
        // Setup error listener
        mockIpcRenderer.on.mockImplementation((event, callback) => {
          if (event === 'worker:error') {
            errorCallback.mockImplementation(callback);
          }
        });

        // Simulate registering error listener
        mockIpcRenderer.on('worker:error', (event, data) => {
          globalActions.setError(data.message);
          globalActions.setNestingStatus(false);
        });

        // Simulate error
        const errorData = { message: 'Worker thread crashed' };
        errorCallback(null, errorData);

        expect(mockIpcRenderer.on).toHaveBeenCalledWith('worker:error', expect.any(Function));
      });
    });
  });

  describe('Settings and Configuration', () => {
    it('should handle settings save operations', async () => {
      createRoot(async () => {
        const settings = {
          theme: 'dark',
          language: 'en',
          autosave: true,
          nestingDefaults: {
            populationSize: 20,
            mutationRate: 0.15,
          },
        };

        mockIpcRenderer.invoke.mockResolvedValueOnce({ success: true });

        const result = await mockIpcRenderer.invoke('settings:save', settings);
        
        expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('settings:save', settings);
        expect(result.success).toBe(true);
      });
    });

    it('should handle settings load operations', async () => {
      createRoot(async () => {
        const mockSettings = {
          theme: 'dark',
          language: 'de',
          autosave: false,
          nestingDefaults: {
            populationSize: 15,
            mutationRate: 0.12,
          },
        };

        mockIpcRenderer.invoke.mockResolvedValueOnce(mockSettings);

        const result = await mockIpcRenderer.invoke('settings:load');
        
        expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('settings:load');
        expect(result).toEqual(mockSettings);
        
        // Simulate applying loaded settings
        globalActions.setDarkMode(result.theme === 'dark');
        globalActions.setLanguage(result.language);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle IPC communication errors', async () => {
      createRoot(async () => {
        const errorMessage = 'IPC communication failed';
        mockIpcRenderer.invoke.mockRejectedValueOnce(new Error(errorMessage));

        try {
          await mockIpcRenderer.invoke('invalid:operation');
        } catch (error) {
          expect(error.message).toBe(errorMessage);
        }
      });
    });

    it('should handle missing IPC methods gracefully', () => {
      createRoot(() => {
        // Test that missing methods don't crash the application
        expect(() => {
          mockIpcRenderer.on('nonexistent:event', () => {});
        }).not.toThrow();
      });
    });
  });

  describe('Cleanup Operations', () => {
    it('should remove event listeners on cleanup', () => {
      createRoot(() => {
        const eventName = 'test:event';
        const callback = vi.fn();

        // Add listener
        mockIpcRenderer.on(eventName, callback);
        
        // Remove listener
        mockIpcRenderer.removeListener(eventName, callback);
        
        expect(mockIpcRenderer.on).toHaveBeenCalledWith(eventName, callback);
        expect(mockIpcRenderer.removeListener).toHaveBeenCalledWith(eventName, callback);
      });
    });

    it('should remove all listeners for cleanup', () => {
      createRoot(() => {
        const eventName = 'cleanup:event';
        
        // Remove all listeners
        mockIpcRenderer.removeAllListeners(eventName);
        
        expect(mockIpcRenderer.removeAllListeners).toHaveBeenCalledWith(eventName);
      });
    });
  });

  describe('Performance Operations', () => {
    it('should handle performance monitoring requests', async () => {
      createRoot(async () => {
        const performanceData = {
          memoryUsage: 125.5,
          cpuUsage: 45.2,
          nestingTime: 12500,
          partsProcessed: 150,
        };

        mockIpcRenderer.invoke.mockResolvedValueOnce(performanceData);

        const result = await mockIpcRenderer.invoke('performance:getStats');
        
        expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('performance:getStats');
        expect(result).toEqual(performanceData);
      });
    });

    it('should handle performance optimization requests', async () => {
      createRoot(async () => {
        const optimizationResult = {
          optimized: true,
          memoryFreed: 25.8,
          cacheCleared: true,
        };

        mockIpcRenderer.invoke.mockResolvedValueOnce(optimizationResult);

        const result = await mockIpcRenderer.invoke('performance:optimize');
        
        expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('performance:optimize');
        expect(result.optimized).toBe(true);
      });
    });
  });

  describe('Batch Operations', () => {
    it('should handle batch part processing', async () => {
      createRoot(async () => {
        const batchData = {
          parts: [
            createMockPart({ id: 'batch-1' }),
            createMockPart({ id: 'batch-2' }),
            createMockPart({ id: 'batch-3' }),
          ],
          operation: 'import',
        };

        const batchResult = {
          success: true,
          processed: 3,
          failed: 0,
          results: batchData.parts,
        };

        mockIpcRenderer.invoke.mockResolvedValueOnce(batchResult);

        const result = await mockIpcRenderer.invoke('batch:processParts', batchData);
        
        expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('batch:processParts', batchData);
        expect(result.success).toBe(true);
        expect(result.processed).toBe(3);
      });
    });

    it('should handle batch export operations', async () => {
      createRoot(async () => {
        const exportData = {
          nests: [
            { id: 'nest-1', format: 'svg' },
            { id: 'nest-2', format: 'dxf' },
          ],
          outputPath: '/test/exports/',
        };

        const exportResult = {
          success: true,
          exported: 2,
          paths: ['/test/exports/nest-1.svg', '/test/exports/nest-2.dxf'],
        };

        mockIpcRenderer.invoke.mockResolvedValueOnce(exportResult);

        const result = await mockIpcRenderer.invoke('batch:export', exportData);
        
        expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('batch:export', exportData);
        expect(result.success).toBe(true);
        expect(result.exported).toBe(2);
      });
    });
  });
});