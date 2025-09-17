import { onCleanup, createEffect } from 'solid-js';

/**
 * Memory management utilities for the application
 */

// WeakMap to store cleanup functions for components
const cleanupRegistry = new WeakMap<object, (() => void)[]>();

/**
 * Register a cleanup function for a component
 */
export function registerCleanup(target: object, cleanup: () => void) {
  const cleanups = cleanupRegistry.get(target) || [];
  cleanups.push(cleanup);
  cleanupRegistry.set(target, cleanups);
}

/**
 * Execute all cleanup functions for a component
 */
export function executeCleanup(target: object) {
  const cleanups = cleanupRegistry.get(target);
  if (cleanups) {
    cleanups.forEach(cleanup => cleanup());
    cleanupRegistry.delete(target);
  }
}

/**
 * Create a memory-managed resource
 */
export function createManagedResource<T>(
  factory: () => T,
  cleanup: (resource: T) => void
): T {
  const resource = factory();
  
  onCleanup(() => {
    cleanup(resource);
  });
  
  return resource;
}

/**
 * Create a debounced function that automatically cleans up
 */
export function createDebouncedFunction<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): T & { cancel: () => void } {
  let timeoutId: number | undefined;
  
  const debounced = ((...args: Parameters<T>) => {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }
    
    timeoutId = window.setTimeout(() => {
      fn(...args);
      timeoutId = undefined;
    }, delay);
  }) as T;
  
  const cancel = () => {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
      timeoutId = undefined;
    }
  };
  
  onCleanup(cancel);
  
  return Object.assign(debounced, { cancel });
}

/**
 * Create a throttled function that automatically cleans up
 */
export function createThrottledFunction<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): T & { cancel: () => void } {
  let timeoutId: number | undefined;
  let lastRun = 0;
  
  const throttled = ((...args: Parameters<T>) => {
    const now = Date.now();
    
    if (now - lastRun >= delay) {
      fn(...args);
      lastRun = now;
    } else {
      if (timeoutId !== undefined) {
        clearTimeout(timeoutId);
      }
      
      timeoutId = window.setTimeout(() => {
        fn(...args);
        lastRun = Date.now();
        timeoutId = undefined;
      }, delay - (now - lastRun));
    }
  }) as T;
  
  const cancel = () => {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
      timeoutId = undefined;
    }
  };
  
  onCleanup(cancel);
  
  return Object.assign(throttled, { cancel });
}

/**
 * Create an auto-disposing event listener
 */
export function createEventListener<K extends keyof WindowEventMap>(
  target: Window,
  type: K,
  listener: (this: Window, ev: WindowEventMap[K]) => any,
  options?: boolean | AddEventListenerOptions
): void;
export function createEventListener<K extends keyof DocumentEventMap>(
  target: Document,
  type: K,
  listener: (this: Document, ev: DocumentEventMap[K]) => any,
  options?: boolean | AddEventListenerOptions
): void;
export function createEventListener<K extends keyof HTMLElementEventMap>(
  target: HTMLElement,
  type: K,
  listener: (this: HTMLElement, ev: HTMLElementEventMap[K]) => any,
  options?: boolean | AddEventListenerOptions
): void;
export function createEventListener(
  target: EventTarget,
  type: string,
  listener: EventListener,
  options?: boolean | AddEventListenerOptions
): void {
  target.addEventListener(type, listener, options);
  
  onCleanup(() => {
    target.removeEventListener(type, listener, options);
  });
}

/**
 * Create a ResizeObserver that automatically disconnects
 */
export function createResizeObserver(
  callback: ResizeObserverCallback,
  options?: ResizeObserverOptions
): ResizeObserver {
  const observer = new ResizeObserver(callback);
  
  onCleanup(() => {
    observer.disconnect();
  });
  
  return observer;
}

/**
 * Create an IntersectionObserver that automatically disconnects
 */
export function createIntersectionObserver(
  callback: IntersectionObserverCallback,
  options?: IntersectionObserverInit
): IntersectionObserver {
  const observer = new IntersectionObserver(callback, options);
  
  onCleanup(() => {
    observer.disconnect();
  });
  
  return observer;
}

/**
 * Create a MutationObserver that automatically disconnects
 */
export function createMutationObserver(
  callback: MutationCallback
): MutationObserver {
  const observer = new MutationObserver(callback);
  
  onCleanup(() => {
    observer.disconnect();
  });
  
  return observer;
}

/**
 * Memory usage monitor
 */
export interface MemoryUsage {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
  percentUsed: number;
}

export function getMemoryUsage(): MemoryUsage | null {
  // @ts-ignore - performance.memory is not in TypeScript types
  if (performance.memory) {
    // @ts-ignore
    const memory = performance.memory;
    return {
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit,
      percentUsed: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100,
    };
  }
  return null;
}

/**
 * Monitor memory usage and trigger callback when threshold is exceeded
 */
export function createMemoryMonitor(
  threshold: number = 80, // percentage
  interval: number = 5000, // milliseconds
  callback: (usage: MemoryUsage) => void
): () => void {
  const intervalId = setInterval(() => {
    const usage = getMemoryUsage();
    if (usage && usage.percentUsed > threshold) {
      callback(usage);
    }
  }, interval);
  
  const cleanup = () => {
    clearInterval(intervalId);
  };
  
  onCleanup(cleanup);
  
  return cleanup;
}

/**
 * Garbage collection hint (for development)
 */
export function requestIdleGarbageCollection() {
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      // @ts-ignore - gc is not in TypeScript types
      if (window.gc) {
        // @ts-ignore
        window.gc();
      }
    });
  }
}

/**
 * Create a cleanup effect that runs when component unmounts
 */
export function createCleanupEffect(cleanup: () => void) {
  createEffect(() => {
    onCleanup(cleanup);
  });
}