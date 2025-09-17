import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  createDebouncedFunction,
  createThrottledFunction,
  getMemoryUsage,
  createMemoryMonitor,
  registerCleanup,
  executeCleanup,
} from './memoryManagement';

describe('memoryManagement', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('createDebouncedFunction', () => {
    it('should debounce function calls', () => {
      const mockFn = vi.fn();
      const debouncedFn = createDebouncedFunction(mockFn, 100);

      // Call multiple times quickly
      debouncedFn('arg1');
      debouncedFn('arg2');
      debouncedFn('arg3');

      // Function should not be called yet
      expect(mockFn).not.toHaveBeenCalled();

      // Fast forward time
      vi.advanceTimersByTime(100);

      // Function should be called once with last arguments
      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith('arg3');
    });

    it('should allow canceling debounced function', () => {
      const mockFn = vi.fn();
      const debouncedFn = createDebouncedFunction(mockFn, 100);

      debouncedFn('test');
      debouncedFn.cancel();

      vi.advanceTimersByTime(100);

      expect(mockFn).not.toHaveBeenCalled();
    });
  });

  describe('createThrottledFunction', () => {
    it('should throttle function calls', () => {
      const mockFn = vi.fn();
      const throttledFn = createThrottledFunction(mockFn, 100);

      // First call should execute immediately
      throttledFn('arg1');
      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith('arg1');

      // Subsequent calls within throttle period should be delayed
      throttledFn('arg2');
      expect(mockFn).toHaveBeenCalledTimes(1);

      // Fast forward time
      vi.advanceTimersByTime(100);

      // Last call should execute
      expect(mockFn).toHaveBeenCalledTimes(2);
      expect(mockFn).toHaveBeenCalledWith('arg2');
    });

    it('should allow canceling throttled function', () => {
      const mockFn = vi.fn();
      const throttledFn = createThrottledFunction(mockFn, 100);

      throttledFn('test1');
      throttledFn('test2');
      throttledFn.cancel();

      vi.advanceTimersByTime(100);

      // Only first call should have executed
      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith('test1');
    });
  });

  describe('getMemoryUsage', () => {
    it('should return memory usage when available', () => {
      // Mock performance.memory for this specific test
      Object.defineProperty(performance, 'memory', {
        value: {
          usedJSHeapSize: 10000000,
          totalJSHeapSize: 20000000,
          jsHeapSizeLimit: 100000000,
        },
        configurable: true,
      });
      
      const usage = getMemoryUsage();
      
      expect(usage).toEqual({
        usedJSHeapSize: 10000000,
        totalJSHeapSize: 20000000,
        jsHeapSizeLimit: 100000000,
        percentUsed: 10,
      });
    });

    it('should return null when memory API not available', () => {
      const originalMemory = performance.memory;
      // @ts-ignore
      delete performance.memory;

      const usage = getMemoryUsage();
      expect(usage).toBeNull();

      // Restore
      Object.defineProperty(performance, 'memory', {
        value: originalMemory,
      });
    });
  });

  describe('createMemoryMonitor', () => {
    it('should monitor memory usage and trigger callback when threshold exceeded', () => {
      const callback = vi.fn();
      
      // Mock high memory usage
      Object.defineProperty(performance, 'memory', {
        value: {
          usedJSHeapSize: 85000000,
          totalJSHeapSize: 90000000,
          jsHeapSizeLimit: 100000000,
        },
      });

      createMemoryMonitor(80, 100, callback);

      vi.advanceTimersByTime(100);

      expect(callback).toHaveBeenCalledWith({
        usedJSHeapSize: 85000000,
        totalJSHeapSize: 90000000,
        jsHeapSizeLimit: 100000000,
        percentUsed: 85,
      });
    });

    it('should not trigger callback when threshold not exceeded', () => {
      const callback = vi.fn();
      
      // Mock low memory usage
      Object.defineProperty(performance, 'memory', {
        value: {
          usedJSHeapSize: 50000000,
          totalJSHeapSize: 60000000,
          jsHeapSizeLimit: 100000000,
        },
      });

      createMemoryMonitor(80, 100, callback);

      vi.advanceTimersByTime(100);

      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('cleanup registry', () => {
    it('should register and execute cleanup functions', () => {
      const cleanup1 = vi.fn();
      const cleanup2 = vi.fn();
      const target = {};

      registerCleanup(target, cleanup1);
      registerCleanup(target, cleanup2);

      executeCleanup(target);

      expect(cleanup1).toHaveBeenCalled();
      expect(cleanup2).toHaveBeenCalled();
    });

    it('should not fail when executing cleanup for non-registered target', () => {
      const target = {};
      
      expect(() => {
        executeCleanup(target);
      }).not.toThrow();
    });
  });
});