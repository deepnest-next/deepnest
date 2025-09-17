import { Component, createMemo, Show, For } from 'solid-js';
import { useTranslation } from '@/utils/i18n';
import { useViewport } from '@/hooks/useViewport';
import ViewportControls from '@/components/common/ViewportControls';
import type { NestResult } from '@/types/app.types';

interface ResultViewerProps {
  result: NestResult;
}

const ResultViewer: Component<ResultViewerProps> = (props) => {
  const [t] = useTranslation('nesting');
  
  // Enhanced viewport controls
  const viewport = useViewport({
    initialZoom: 1,
    bounds: {
      minZoom: 0.1,
      maxZoom: 10,
    },
    enableKeyboardShortcuts: true,
    enableWheelZoom: true,
    enablePan: true,
  });

  const totalMaterialUsed = createMemo(() => {
    return props.result.sheets?.reduce((total, sheet) => {
      return total + (sheet.width * sheet.height);
    }, 0) || 0;
  });

  const totalPartsArea = createMemo(() => {
    return props.result.placedParts || 0;
  });

  const wastePercentage = createMemo(() => {
    const total = totalMaterialUsed();
    const used = totalPartsArea();
    if (total === 0) return 0;
    return ((total - used) / total) * 100;
  });

  // Content bounds for fit-to-content functionality
  const contentBounds = createMemo(() => {
    const sheets = props.result.sheets || [];
    if (sheets.length === 0) return { width: 800, height: 400, x: 0, y: 0 };
    
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    
    sheets.forEach(sheet => {
      const x = sheet.x || 0;
      const y = sheet.y || 0;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x + sheet.width);
      maxY = Math.max(maxY, y + sheet.height);
    });
    
    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    };
  });

  const handleZoomToFit = () => {
    viewport.zoomToFit(contentBounds());
  };

  return (
    <div class="h-full flex flex-col">
      <ViewportControls
        viewportState={viewport.viewportState()}
        onZoomIn={viewport.zoomIn}
        onZoomOut={viewport.zoomOut}
        onZoomToFit={handleZoomToFit}
        onResetView={viewport.resetView}
        onCenterView={viewport.centerView}
        showFitToContent={true}
        showPanControls={true}
      />

      <div class="flex-1 flex">
        <div class="flex-1 bg-white dark:bg-gray-900">
          <svg
            class="w-full h-96 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800"
            width="100%"
            height="400"
            viewBox="0 0 800 400"
            onMouseDown={viewport.handleMouseDown}
            onMouseMove={viewport.handleMouseMove}
            onMouseUp={viewport.handleMouseUp}
            onMouseLeave={viewport.handleMouseUp}
            onWheel={viewport.handleWheel}
            style={{ cursor: viewport.cursor() }}
          >
            <g transform={viewport.transform()}>
              {/* Background grid */}
              <defs>
                <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e0e0e0" stroke-width="1"/>
                </pattern>
              </defs>
              <rect width="800" height="400" fill="url(#grid)" />
              
              {/* Sheets */}
              <For each={props.result.sheets || []}>
                {(sheet, index) => (
                  <g class="sheet-group">
                    <rect
                      x={sheet.x || 0}
                      y={sheet.y || 0}
                      width={sheet.width}
                      height={sheet.height}
                      fill="rgba(200, 200, 200, 0.3)"
                      stroke="#e5e7eb"
                      stroke-width="2"
                    />
                    <text
                      x={(sheet.x || 0) + 10}
                      y={(sheet.y || 0) + 25}
                      font-size="12"
                      fill="#6b7280"
                    >
                      {t('sheet')} {index() + 1}
                    </text>
                  </g>
                )}
              </For>

              {/* Parts (placeholder visualization) */}
              <For each={props.result.placements || []}>
                {(placement) => (
                  <g class="part-group">
                    <rect
                      x={placement.x}
                      y={placement.y}
                      width={placement.width || 50}
                      height={placement.height || 50}
                      fill="rgba(59, 130, 246, 0.7)"
                      stroke="#3b82f6"
                      stroke-width="1"
                      transform={`rotate(${placement.rotation || 0} ${placement.x + (placement.width || 50) / 2} ${placement.y + (placement.height || 50) / 2})`}
                    />
                  </g>
                )}
              </For>
            </g>
          </svg>
        </div>

        <div class="w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 overflow-y-auto">
          <div class="p-4">
            <h4 class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">{t('statistics')}</h4>
          
            <div class="grid grid-cols-2 gap-3 mb-6">
              <div class="bg-gray-50 dark:bg-gray-700 p-3 rounded text-center">
                <div class="text-2xl font-bold text-green-600 dark:text-green-400">
                  {props.result.efficiency ? `${(props.result.efficiency * 100).toFixed(1)}%` : 'N/A'}
                </div>
                <div class="text-xs text-gray-600 dark:text-gray-400 mt-1">{t('material_efficiency')}</div>
              </div>

              <div class="bg-gray-50 dark:bg-gray-700 p-3 rounded text-center">
                <div class="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {props.result.fitness?.toFixed(2) || 'N/A'}
                </div>
                <div class="text-xs text-gray-600 dark:text-gray-400 mt-1">{t('fitness_score')}</div>
              </div>

              <div class="bg-gray-50 dark:bg-gray-700 p-3 rounded text-center">
                <div class="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {props.result.sheets?.length || 0}
                </div>
                <div class="text-xs text-gray-600 dark:text-gray-400 mt-1">{t('sheets_used')}</div>
              </div>

              <div class="bg-gray-50 dark:bg-gray-700 p-3 rounded text-center">
                <div class="text-2xl font-bold text-red-600 dark:text-red-400">
                  {wastePercentage().toFixed(1)}%
                </div>
                <div class="text-xs text-gray-600 dark:text-gray-400 mt-1">{t('material_waste')}</div>
              </div>
            </div>

            <div class="space-y-3">
              <div class="flex justify-between text-sm">
                <span class="text-gray-600 dark:text-gray-400">{t('total_parts_placed')}:</span>
                <span class="font-medium text-gray-900 dark:text-gray-100">{props.result.placedParts || 0}</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-gray-600 dark:text-gray-400">{t('total_material_used')}:</span>
                <span class="font-medium text-gray-900 dark:text-gray-100">{totalMaterialUsed().toFixed(2)}</span>
              </div>
              <Show when={props.result.generationTime}>
                <div class="flex justify-between text-sm">
                  <span class="text-gray-600 dark:text-gray-400">{t('generation_time')}:</span>
                  <span class="font-medium text-gray-900 dark:text-gray-100">{props.result.generationTime}ms</span>
                </div>
              </Show>
              <Show when={props.result.generation}>
                <div class="flex justify-between text-sm">
                  <span class="text-gray-600 dark:text-gray-400">{t('generation_number')}:</span>
                  <span class="font-medium text-gray-900 dark:text-gray-100">{props.result.generation}</span>
                </div>
              </Show>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultViewer;