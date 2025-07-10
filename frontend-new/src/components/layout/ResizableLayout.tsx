import { Component, createSignal, onMount, onCleanup, JSX } from 'solid-js';
import { globalState, globalActions } from '@/stores/global.store';

interface ResizableLayoutProps {
  left: JSX.Element;
  right: JSX.Element;
  minLeftWidth?: number;
  maxLeftWidth?: number;
  defaultLeftWidth?: number;
}

const ResizableLayout: Component<ResizableLayoutProps> = (props) => {
  const {
    minLeftWidth = 250,
    maxLeftWidth = 500,
    defaultLeftWidth = 300
  } = props;

  const [isResizing, setIsResizing] = createSignal(false);
  const [leftWidth, setLeftWidth] = createSignal(
    globalState.ui.panels.partsWidth || defaultLeftWidth
  );

  let containerRef: HTMLDivElement | undefined;
  let resizerRef: HTMLDivElement | undefined;

  const handleMouseDown = (e: MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizing() || !containerRef) return;

    const containerRect = containerRef.getBoundingClientRect();
    const newWidth = e.clientX - containerRect.left;
    
    const clampedWidth = Math.max(
      minLeftWidth,
      Math.min(maxLeftWidth, newWidth)
    );
    
    setLeftWidth(clampedWidth);
    globalActions.setPanelWidth('partsWidth', clampedWidth);
  };

  const handleMouseUp = () => {
    setIsResizing(false);
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  };

  onMount(() => {
    // Sync with global state on mount
    setLeftWidth(globalState.ui.panels.partsWidth || defaultLeftWidth);
  });

  onCleanup(() => {
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  });

  return (
    <div
      ref={containerRef}
      class={`resizable-layout ${isResizing() ? 'resizing' : ''}`}
    >
      <div
        class="resizable-left"
        style={{ width: `${leftWidth()}px` }}
      >
        {props.left}
      </div>
      
      <div
        ref={resizerRef}
        class="resizable-handle"
        onMouseDown={handleMouseDown}
        title="Drag to resize"
      >
        <div class="resizable-handle-line" />
      </div>
      
      <div class="resizable-right">
        {props.right}
      </div>
    </div>
  );
};

export default ResizableLayout;