import { Component, For, Show, createMemo, createEffect, onMount } from 'solid-js';
import { useVirtualScroll } from '@/hooks/useVirtualScroll';
import { VirtualScrollContainer } from './VirtualScrollContainer';

interface VirtualListProps<T> {
  items: T[];
  itemHeight: number;
  height: number;
  overscan?: number;
  renderItem: (item: T, index: number) => JSX.Element;
  getItemKey?: (item: T, index: number) => string | number;
  class?: string;
  emptyMessage?: string;
  onScroll?: (scrollTop: number, isScrolling: boolean) => void;
  scrollToIndex?: number;
  scrollAlign?: 'start' | 'center' | 'end';
}

function VirtualListInner<T>(props: VirtualListProps<T>) {
  const virtualScroll = useVirtualScroll({
    items: () => props.items,
    itemHeight: props.itemHeight,
    containerHeight: props.height,
    overscan: props.overscan || 3,
    getItemKey: props.getItemKey,
  });

  // Handle external scroll requests
  createEffect(() => {
    if (props.scrollToIndex !== undefined && props.scrollToIndex >= 0) {
      virtualScroll.scrollToIndex(props.scrollToIndex, props.scrollAlign);
    }
  });

  // Notify parent of scroll changes
  createEffect(() => {
    props.onScroll?.(virtualScroll.scrollTop(), false);
  });

  const isEmpty = createMemo(() => props.items.length === 0);

  return (
    <Show
      when={!isEmpty()}
      fallback={
        <div class={`flex items-center justify-center h-full text-gray-500 dark:text-gray-400 ${props.class || ''}`}>
          {props.emptyMessage || 'No items to display'}
        </div>
      }
    >
      <VirtualScrollContainer
        height={props.height}
        onScroll={virtualScroll.handleScroll}
        totalHeight={virtualScroll.totalHeight()}
        class={props.class}
      >
        <For each={virtualScroll.visibleItems()}>
          {({ item, index, offset }) => (
            <div
              style={{
                position: 'absolute',
                top: `${offset}px`,
                left: 0,
                right: 0,
                height: `${props.itemHeight}px`,
              }}
            >
              {props.renderItem(item, index)}
            </div>
          )}
        </For>
      </VirtualScrollContainer>
    </Show>
  );
}

// Type-safe wrapper component
export function VirtualList<T>(props: VirtualListProps<T>) {
  return <VirtualListInner {...props} />;
}

// Measure helper for dynamic item heights (future enhancement)
export interface MeasuredItem {
  index: number;
  height: number;
  offset: number;
}

export interface DynamicVirtualListProps<T> extends Omit<VirtualListProps<T>, 'itemHeight'> {
  estimatedItemHeight: number;
  getItemHeight?: (item: T, index: number) => number;
}

// Placeholder for future dynamic height virtual list
export function DynamicVirtualList<T>(props: DynamicVirtualListProps<T>) {
  // For now, just use the estimated height
  // In the future, this would measure and cache actual heights
  return (
    <VirtualList
      {...props}
      itemHeight={props.estimatedItemHeight}
    />
  );
}