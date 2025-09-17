import { lazy, Component, JSX } from 'solid-js';

export interface LazyLoadOptions {
  delay?: number;
  fallback?: JSX.Element;
  onError?: (error: Error) => void;
}

/**
 * Enhanced lazy loading with error handling and optional delay
 */
export function lazyWithOptions<T extends Component<any>>(
  importFn: () => Promise<{ default: T }>,
  options: LazyLoadOptions = {}
): T {
  const { delay = 0, onError } = options;

  const wrappedImport = async () => {
    try {
      if (delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      return await importFn();
    } catch (error) {
      console.error('Failed to load component:', error);
      onError?.(error as Error);
      throw error;
    }
  };

  return lazy(wrappedImport);
}

/**
 * Preload a lazy component
 */
export function preloadComponent(
  importFn: () => Promise<{ default: Component<any> }>
): Promise<void> {
  return importFn().then(() => undefined).catch(console.error);
}

/**
 * Create a lazy loaded route component
 */
export function createLazyRoute<T extends Component<any>>(
  importFn: () => Promise<{ default: T }>,
  options?: LazyLoadOptions
): T {
  return lazyWithOptions(importFn, {
    delay: 0,
    ...options,
  });
}

/**
 * Lazy load multiple components at once
 */
export async function lazyLoadAll(
  imports: Array<() => Promise<{ default: Component<any> }>>
): Promise<void> {
  await Promise.all(imports.map(importFn => preloadComponent(importFn)));
}

/**
 * Create an intersection observer for lazy loading images
 */
export function createImageLazyLoader(options: IntersectionObserverInit = {}) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target as HTMLImageElement;
        const src = img.dataset.src;
        
        if (src && !img.src) {
          // Create a new image to preload
          const tempImg = new Image();
          tempImg.onload = () => {
            img.src = src;
            img.classList.add('lazy-loaded');
            observer.unobserve(img);
          };
          tempImg.onerror = () => {
            img.classList.add('lazy-error');
            observer.unobserve(img);
          };
          tempImg.src = src;
        }
      }
    });
  }, {
    rootMargin: '50px',
    ...options,
  });

  return {
    observe: (element: HTMLImageElement) => {
      if (element.dataset.src) {
        observer.observe(element);
      }
    },
    unobserve: (element: HTMLImageElement) => {
      observer.unobserve(element);
    },
    disconnect: () => {
      observer.disconnect();
    },
  };
}