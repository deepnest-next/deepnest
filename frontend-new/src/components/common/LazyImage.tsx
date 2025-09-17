import { Component, createSignal, onMount, onCleanup, Show } from 'solid-js';
import { createImageLazyLoader } from '@/utils/lazyLoad';

interface LazyImageProps {
  src: string;
  alt: string;
  class?: string;
  width?: number | string;
  height?: number | string;
  placeholder?: string;
  onLoad?: () => void;
  onError?: (error: Event) => void;
}

const LazyImage: Component<LazyImageProps> = (props) => {
  const [isLoaded, setIsLoaded] = createSignal(false);
  const [hasError, setHasError] = createSignal(false);
  let imgRef: HTMLImageElement | undefined;
  let observer: ReturnType<typeof createImageLazyLoader> | undefined;

  onMount(() => {
    if (imgRef) {
      observer = createImageLazyLoader({
        threshold: 0.1,
      });

      // Set up the image element
      imgRef.dataset.src = props.src;
      
      // Start observing
      observer.observe(imgRef);

      // Listen for load and error events
      imgRef.addEventListener('load', handleLoad);
      imgRef.addEventListener('error', handleError);
    }
  });

  onCleanup(() => {
    if (observer && imgRef) {
      observer.unobserve(imgRef);
    }
    if (imgRef) {
      imgRef.removeEventListener('load', handleLoad);
      imgRef.removeEventListener('error', handleError);
    }
  });

  const handleLoad = () => {
    setIsLoaded(true);
    props.onLoad?.();
  };

  const handleError = (event: Event) => {
    setHasError(true);
    props.onError?.(event);
  };

  const placeholderSrc = props.placeholder || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Crect width="400" height="300" fill="%23f3f4f6"/%3E%3C/svg%3E';

  return (
    <div class={`relative ${props.class || ''}`}>
      <img
        ref={imgRef}
        src={placeholderSrc}
        alt={props.alt}
        width={props.width}
        height={props.height}
        class={`transition-opacity duration-300 ${isLoaded() ? 'opacity-100' : 'opacity-50'} ${hasError() ? 'opacity-25' : ''}`}
      />
      
      <Show when={!isLoaded() && !hasError()}>
        <div class="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
          <div class="w-8 h-8 border-2 border-gray-300 dark:border-gray-600 border-t-blue-500 dark:border-t-blue-400 rounded-full animate-spin" />
        </div>
      </Show>

      <Show when={hasError()}>
        <div class="absolute inset-0 flex items-center justify-center bg-red-50 dark:bg-red-900/20">
          <svg class="w-8 h-8 text-red-400 dark:text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      </Show>
    </div>
  );
};

export default LazyImage;