import { createSignal, createMemo, onMount, onCleanup, createEffect } from 'solid-js';
import { createDebouncedFunction } from '@/utils/memoryManagement';

export interface VirtualScrollOptions<T> {
  items: () => T[];
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
  getItemKey?: (item: T, index: number) => string | number;
}

interface VirtualScrollResult<T> {
  visibleItems: () => Array<{ item: T; index: number; offset: number }>;
  totalHeight: () => number;
  scrollTop: () => number;
  setScrollTop: (value: number) => void;
  startIndex: () => number;
  endIndex: () => number;
  handleScroll: (event: Event) => void;
  scrollToIndex: (index: number, align?: 'start' | 'center' | 'end') => void;
}

export function useVirtualScroll<T>(
  options: VirtualScrollOptions<T>
): VirtualScrollResult<T> {
  const { items, itemHeight, containerHeight, overscan = 3, getItemKey } = options;
  
  const [scrollTop, setScrollTop] = createSignal(0);
  const [isScrolling, setIsScrolling] = createSignal(false);

  // Calculate total height
  const totalHeight = createMemo(() => items().length * itemHeight);

  // Calculate visible range
  const startIndex = createMemo(() => {
    const index = Math.floor(scrollTop() / itemHeight) - overscan;
    return Math.max(0, index);
  });

  const endIndex = createMemo(() => {
    const index = Math.ceil((scrollTop() + containerHeight) / itemHeight) + overscan;
    return Math.min(items().length - 1, index);
  });

  // Get visible items with their positions
  const visibleItems = createMemo(() => {
    const start = startIndex();
    const end = endIndex();
    const allItems = items();
    const visible: Array<{ item: T; index: number; offset: number }> = [];

    for (let i = start; i <= end && i < allItems.length; i++) {
      visible.push({
        item: allItems[i],
        index: i,
        offset: i * itemHeight,
      });
    }

    return visible;
  });

  // Debounced scroll end handler
  const handleScrollEnd = createDebouncedFunction(() => {
    setIsScrolling(false);
  }, 150);

  // Handle scroll events
  const handleScroll = (event: Event) => {
    const target = event.target as HTMLElement;
    setScrollTop(target.scrollTop);
    setIsScrolling(true);
    handleScrollEnd();
  };

  // Scroll to specific index
  const scrollToIndex = (index: number, align: 'start' | 'center' | 'end' = 'start') => {
    const maxIndex = items().length - 1;
    const clampedIndex = Math.max(0, Math.min(index, maxIndex));
    
    let targetScrollTop: number;
    
    switch (align) {
      case 'center':
        targetScrollTop = (clampedIndex * itemHeight) - (containerHeight / 2) + (itemHeight / 2);
        break;
      case 'end':
        targetScrollTop = (clampedIndex * itemHeight) - containerHeight + itemHeight;
        break;
      case 'start':
      default:
        targetScrollTop = clampedIndex * itemHeight;
        break;
    }

    // Clamp scroll position
    const maxScrollTop = totalHeight() - containerHeight;
    targetScrollTop = Math.max(0, Math.min(targetScrollTop, maxScrollTop));
    
    setScrollTop(targetScrollTop);
    
    // Also update the actual scroll position if we have a container
    const container = document.querySelector('[data-virtual-scroll-container]');
    if (container) {
      container.scrollTop = targetScrollTop;
    }
  };


  return {
    visibleItems,
    totalHeight,
    scrollTop,
    setScrollTop,
    startIndex,
    endIndex,
    handleScroll,
    scrollToIndex,
  };
}

