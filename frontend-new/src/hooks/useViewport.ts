import { createSignal, createMemo, onCleanup } from 'solid-js';

export interface ViewportState {
  zoom: number;
  pan: { x: number; y: number };
  isDragging: boolean;
}

export interface ViewportBounds {
  minZoom: number;
  maxZoom: number;
  panBounds?: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
  };
}

export interface ViewportOptions {
  initialZoom?: number;
  initialPan?: { x: number; y: number };
  bounds?: ViewportBounds;
  zoomStep?: number;
  enableKeyboardShortcuts?: boolean;
  enableWheelZoom?: boolean;
  enablePan?: boolean;
}

const DEFAULT_OPTIONS: Required<ViewportOptions> = {
  initialZoom: 1,
  initialPan: { x: 0, y: 0 },
  bounds: {
    minZoom: 0.1,
    maxZoom: 10,
  },
  zoomStep: 1.2,
  enableKeyboardShortcuts: true,
  enableWheelZoom: true,
  enablePan: true,
};

export const useViewport = (options: ViewportOptions = {}) => {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  // Core state
  const [zoom, setZoom] = createSignal(opts.initialZoom);
  const [pan, setPan] = createSignal(opts.initialPan);
  const [isDragging, setIsDragging] = createSignal(false);
  const [dragStart, setDragStart] = createSignal({ x: 0, y: 0 });
  const [dragOrigin, setDragOrigin] = createSignal({ x: 0, y: 0 });

  // Computed values
  const transform = createMemo(() => {
    const z = zoom();
    const p = pan();
    return `translate(${p.x}, ${p.y}) scale(${z})`;
  });

  const viewportState = createMemo((): ViewportState => ({
    zoom: zoom(),
    pan: pan(),
    isDragging: isDragging(),
  }));

  // Utility functions
  const constrainZoom = (newZoom: number): number => {
    return Math.max(opts.bounds.minZoom, Math.min(opts.bounds.maxZoom, newZoom));
  };

  const constrainPan = (newPan: { x: number; y: number }): { x: number; y: number } => {
    if (!opts.bounds.panBounds) return newPan;
    
    const bounds = opts.bounds.panBounds;
    return {
      x: Math.max(bounds.minX, Math.min(bounds.maxX, newPan.x)),
      y: Math.max(bounds.minY, Math.min(bounds.maxY, newPan.y)),
    };
  };

  // Zoom controls
  const zoomIn = (factor: number = opts.zoomStep) => {
    setZoom(prev => constrainZoom(prev * factor));
  };

  const zoomOut = (factor: number = opts.zoomStep) => {
    setZoom(prev => constrainZoom(prev / factor));
  };

  const zoomTo = (newZoom: number) => {
    setZoom(constrainZoom(newZoom));
  };

  const zoomToFit = (contentBounds: { width: number; height: number; x?: number; y?: number }) => {
    const containerWidth = 800; // Default container width
    const containerHeight = 600; // Default container height
    
    const scaleX = containerWidth / contentBounds.width;
    const scaleY = containerHeight / contentBounds.height;
    const scale = Math.min(scaleX, scaleY) * 0.9; // 10% margin
    
    setZoom(constrainZoom(scale));
    
    if (contentBounds.x !== undefined && contentBounds.y !== undefined) {
      const centerX = containerWidth / 2 - (contentBounds.x + contentBounds.width / 2) * scale;
      const centerY = containerHeight / 2 - (contentBounds.y + contentBounds.height / 2) * scale;
      setPan(constrainPan({ x: centerX, y: centerY }));
    }
  };

  // Pan controls
  const panTo = (newPan: { x: number; y: number }) => {
    setPan(constrainPan(newPan));
  };

  const panBy = (delta: { x: number; y: number }) => {
    const currentPan = pan();
    panTo({
      x: currentPan.x + delta.x,
      y: currentPan.y + delta.y,
    });
  };

  const centerView = () => {
    setPan({ x: 0, y: 0 });
  };

  // Reset controls
  const resetView = () => {
    setZoom(opts.initialZoom);
    setPan(opts.initialPan);
    setIsDragging(false);
  };

  // Mouse event handlers
  const handleMouseDown = (e: MouseEvent) => {
    if (!opts.enablePan) return;
    
    e.preventDefault();
    setIsDragging(true);
    const currentPan = pan();
    setDragStart({ x: e.clientX, y: e.clientY });
    setDragOrigin(currentPan);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging() || !opts.enablePan) return;
    
    e.preventDefault();
    const dragStartPos = dragStart();
    const origin = dragOrigin();
    
    const newPan = {
      x: origin.x + (e.clientX - dragStartPos.x),
      y: origin.y + (e.clientY - dragStartPos.y),
    };
    
    setPan(constrainPan(newPan));
  };

  const handleMouseUp = (e: MouseEvent) => {
    if (!isDragging()) return;
    
    e.preventDefault();
    setIsDragging(false);
  };

  const handleWheel = (e: WheelEvent) => {
    if (!opts.enableWheelZoom) return;
    
    e.preventDefault();
    const delta = e.deltaY;
    const factor = delta > 0 ? 1 / opts.zoomStep : opts.zoomStep;
    
    // Zoom towards mouse position
    const rect = (e.target as Element).getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const currentZoom = zoom();
    const currentPan = pan();
    const newZoom = constrainZoom(currentZoom * factor);
    
    if (newZoom !== currentZoom) {
      // Adjust pan to zoom towards mouse position
      const zoomRatio = newZoom / currentZoom;
      const newPan = {
        x: mouseX - (mouseX - currentPan.x) * zoomRatio,
        y: mouseY - (mouseY - currentPan.y) * zoomRatio,
      };
      
      setZoom(newZoom);
      setPan(constrainPan(newPan));
    }
  };

  // Keyboard event handlers
  const handleKeyDown = (e: KeyboardEvent) => {
    if (!opts.enableKeyboardShortcuts) return;
    
    // Check for modifier keys to avoid conflicts
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    
    switch (e.key) {
      case '+':
      case '=':
        e.preventDefault();
        zoomIn();
        break;
      case '-':
        e.preventDefault();
        zoomOut();
        break;
      case '0':
        e.preventDefault();
        resetView();
        break;
      case 'ArrowUp':
        e.preventDefault();
        panBy({ x: 0, y: 50 });
        break;
      case 'ArrowDown':
        e.preventDefault();
        panBy({ x: 0, y: -50 });
        break;
      case 'ArrowLeft':
        e.preventDefault();
        panBy({ x: 50, y: 0 });
        break;
      case 'ArrowRight':
        e.preventDefault();
        panBy({ x: -50, y: 0 });
        break;
    }
  };

  // Event listeners setup
  if (opts.enableKeyboardShortcuts) {
    document.addEventListener('keydown', handleKeyDown);
    onCleanup(() => {
      document.removeEventListener('keydown', handleKeyDown);
    });
  }

  return {
    // State
    zoom,
    pan,
    isDragging,
    transform,
    viewportState,
    
    // Zoom controls
    zoomIn,
    zoomOut,
    zoomTo,
    zoomToFit,
    
    // Pan controls
    panTo,
    panBy,
    centerView,
    
    // Reset controls
    resetView,
    
    // Event handlers
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleWheel,
    
    // Cursor style
    cursor: createMemo(() => isDragging() ? 'grabbing' : 'grab'),
  };
};