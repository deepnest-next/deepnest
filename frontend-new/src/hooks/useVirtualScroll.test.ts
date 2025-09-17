import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createRoot, createSignal } from 'solid-js';
import { useVirtualScroll } from './useVirtualScroll';

describe('useVirtualScroll', () => {
  const mockItems = Array.from({ length: 100 }, (_, i) => ({
    id: `item-${i}`,
    name: `Item ${i}`,
  }));

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should calculate total height correctly', () => {
    createRoot(() => {
      const [items] = createSignal(mockItems);
      const virtualScroll = useVirtualScroll({
        items,
        itemHeight: 50,
        containerHeight: 500,
      });

      expect(virtualScroll.totalHeight()).toBe(5000); // 100 items * 50px
    });
  });

  it('should calculate visible range correctly', () => {
    createRoot(() => {
      const [items] = createSignal(mockItems);
      const virtualScroll = useVirtualScroll({
        items,
        itemHeight: 50,
        containerHeight: 500,
        overscan: 2,
      });

      // Initially scrollTop is 0, so visible range should start from beginning
      const visibleItems = virtualScroll.visibleItems();
      
      expect(virtualScroll.startIndex()).toBe(0); // 0 - 2 (overscan) = -2, clamped to 0
      expect(virtualScroll.endIndex()).toBe(12); // ceil((0 + 500) / 50) + 2 = 12
      expect(visibleItems.length).toBe(13); // items 0-12
    });
  });

  it('should update visible range when scrolling', () => {
    createRoot(() => {
      const [items] = createSignal(mockItems);
      const virtualScroll = useVirtualScroll({
        items,
        itemHeight: 50,
        containerHeight: 500,
        overscan: 2,
      });

      // Simulate scrolling down
      const mockEvent = new Event('scroll');
      Object.defineProperty(mockEvent, 'target', {
        value: { scrollTop: 250 },
      });
      
      virtualScroll.handleScroll(mockEvent);

      expect(virtualScroll.scrollTop()).toBe(250);
      expect(virtualScroll.startIndex()).toBe(3); // floor(250 / 50) - 2 = 3
      expect(virtualScroll.endIndex()).toBe(17); // ceil((250 + 500) / 50) + 2 = 17
    });
  });

  it('should include correct offsets for visible items', () => {
    createRoot(() => {
      const [items] = createSignal(mockItems.slice(0, 10));
      const virtualScroll = useVirtualScroll({
        items,
        itemHeight: 50,
        containerHeight: 500,
      });

      const visibleItems = virtualScroll.visibleItems();
      
      // Check first few items have correct offsets
      expect(visibleItems[0].offset).toBe(0);   // item 0 at position 0
      expect(visibleItems[1].offset).toBe(50);  // item 1 at position 50
      expect(visibleItems[2].offset).toBe(100); // item 2 at position 100
    });
  });

  it('should scroll to specific index', () => {
    createRoot(() => {
      const [items] = createSignal(mockItems);
      const virtualScroll = useVirtualScroll({
        items,
        itemHeight: 50,
        containerHeight: 500,
      });

      // Scroll to item 20
      virtualScroll.scrollToIndex(20, 'start');
      
      expect(virtualScroll.scrollTop()).toBe(1000); // 20 * 50
    });
  });

  it('should scroll to center alignment correctly', () => {
    createRoot(() => {
      const [items] = createSignal(mockItems);
      const virtualScroll = useVirtualScroll({
        items,
        itemHeight: 50,
        containerHeight: 500,
      });

      // Scroll to item 20 with center alignment
      virtualScroll.scrollToIndex(20, 'center');
      
      // Expected: (20 * 50) - (500 / 2) + (50 / 2) = 1000 - 250 + 25 = 775
      expect(virtualScroll.scrollTop()).toBe(775);
    });
  });

  it('should scroll to end alignment correctly', () => {
    createRoot(() => {
      const [items] = createSignal(mockItems);
      const virtualScroll = useVirtualScroll({
        items,
        itemHeight: 50,
        containerHeight: 500,
      });

      // Scroll to item 20 with end alignment
      virtualScroll.scrollToIndex(20, 'end');
      
      // Expected: (20 * 50) - 500 + 50 = 1000 - 500 + 50 = 550
      expect(virtualScroll.scrollTop()).toBe(550);
    });
  });

  it('should clamp scroll position within bounds', () => {
    createRoot(() => {
      const [items] = createSignal(mockItems.slice(0, 5)); // Only 5 items
      const virtualScroll = useVirtualScroll({
        items,
        itemHeight: 50,
        containerHeight: 500,
      });

      // Try to scroll beyond the end
      virtualScroll.scrollToIndex(10, 'start');
      
      // Should clamp to last valid index (4)
      // Max scroll is totalHeight - containerHeight, but since container is larger than content, it should be 0
      expect(virtualScroll.scrollTop()).toBe(0); // Clamped to 0 since content is smaller than container
    });
  });

  it('should handle empty items array', () => {
    createRoot(() => {
      const [items] = createSignal([]);
      const virtualScroll = useVirtualScroll({
        items,
        itemHeight: 50,
        containerHeight: 500,
      });

      expect(virtualScroll.totalHeight()).toBe(0);
      expect(virtualScroll.visibleItems()).toEqual([]);
      expect(virtualScroll.startIndex()).toBe(0);
      expect(virtualScroll.endIndex()).toBe(-1);
    });
  });
});