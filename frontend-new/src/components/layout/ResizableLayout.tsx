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
      class={`flex h-full w-full ${isResizing() ? 'select-none' : ''}`}
    >
      {/* Left Panel */}
      <div
        class="flex-shrink-0 h-full w-full"
        style={{ width: `${leftWidth()}px` }}
      >
        {props.left}
      </div>

      {/* Resize Handle */}
      <div
        ref={resizerRef}
        class={`w-1 bg-gray-200 dark:bg-gray-700 hover:bg-blue-500 dark:hover:bg-blue-400 cursor-col-resize transition-colors duration-200 relative group ${
          isResizing() ? 'bg-blue-500 dark:bg-blue-400' : ''
        }`}
        onMouseDown={handleMouseDown}
        title="Drag to resize panels"
      >
        {/* Resize handle visual indicator */}
        <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1 h-8 bg-gray-400 dark:bg-gray-500 group-hover:bg-blue-300 dark:group-hover:bg-blue-300 rounded-full transition-colors duration-200" />

        {/* Hover indicator */}
        <div class="absolute -left-1 -right-1 top-0 bottom-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div class="w-full h-full bg-blue-500/20 dark:bg-blue-400/20" />
        </div>
      </div>

      {/* Right Panel */}
      <div class="flex-1 h-full min-w-0 w-full">
        {props.right}
      </div>
    </div>
  );
};

export default ResizableLayout;
