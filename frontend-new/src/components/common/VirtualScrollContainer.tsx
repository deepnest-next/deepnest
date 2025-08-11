import { Component, JSX } from 'solid-js';

export interface VirtualScrollContainerProps {
  height: number;
  onScroll: (event: Event) => void;
  totalHeight: number;
  class?: string;
  children?: JSX.Element;
}

export const VirtualScrollContainer: Component<VirtualScrollContainerProps> = (props) => {
  return (
    <div
      data-virtual-scroll-container
      class={`overflow-auto ${props.class || ''}`}
      style={{ height: `${props.height}px` }}
      onScroll={props.onScroll}
    >
      <div style={{ height: `${props.totalHeight}px`, position: 'relative' }}>
        {props.children}
      </div>
    </div>
  );
};