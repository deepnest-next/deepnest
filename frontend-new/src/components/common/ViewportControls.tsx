import { Component, createMemo } from 'solid-js';
import { useTranslation } from '@/utils/i18n';
import type { ViewportState } from '@/hooks/useViewport';

interface ViewportControlsProps {
  viewportState: ViewportState;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomToFit: () => void;
  onResetView: () => void;
  onCenterView: () => void;
  showFitToContent?: boolean;
  showPanControls?: boolean;
}

const ViewportControls: Component<ViewportControlsProps> = (props) => {
  const [t] = useTranslation('common');

  const zoomPercentage = createMemo(() => {
    return Math.round(props.viewportState.zoom * 100);
  });

  const panPosition = createMemo(() => {
    const pan = props.viewportState.pan;
    return `${Math.round(pan.x)}, ${Math.round(pan.y)}`;
  });

  return (
    <div class="flex items-center justify-center gap-2 p-2 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      
      {/* Zoom Controls */}
      <div class="flex items-center gap-1 px-2 py-1 bg-gray-50 dark:bg-gray-700 rounded-md">
        <button
          onClick={props.onZoomOut}
          class="p-1 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors"
          title={t('zoom_out')}
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
          </svg>
        </button>
        
        <span class="text-sm font-mono text-gray-700 dark:text-gray-300 min-w-12 text-center">
          {zoomPercentage()}%
        </span>
        
        <button
          onClick={props.onZoomIn}
          class="p-1 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors"
          title={t('zoom_in')}
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
          </svg>
        </button>
      </div>

      {/* Fit to Content */}
      {props.showFitToContent && (
        <button
          onClick={props.onZoomToFit}
          class="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors"
          title={t('fit_to_content')}
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
        </button>
      )}

      {/* Center View */}
      <button
        onClick={props.onCenterView}
        class="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors"
        title={t('center_view')}
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
        </svg>
      </button>

      {/* Reset View */}
      <button
        onClick={props.onResetView}
        class="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors"
        title={t('reset_view')}
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      </button>

      {/* Pan Position Indicator */}
      <div class="flex items-center gap-2 px-2 py-1 bg-gray-50 dark:bg-gray-700 rounded-md ml-2">
        <span class="text-xs text-gray-500 dark:text-gray-400">Pan:</span>
        <span class="text-xs font-mono text-gray-700 dark:text-gray-300">
          {panPosition()}
        </span>
      </div>

      {/* Keyboard Shortcuts Hint */}
      <div class="flex items-center gap-1 px-2 py-1 bg-gray-50 dark:bg-gray-700 rounded-md ml-2">
        <span class="text-xs text-gray-500 dark:text-gray-400">
          {t('shortcuts')}: +/- {t('zoom')}, ↑↓←→ {t('pan')}, 0 {t('reset')}
        </span>
      </div>
    </div>
  );
};

export default ViewportControls;