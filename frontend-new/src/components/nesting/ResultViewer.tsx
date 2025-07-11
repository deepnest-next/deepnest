import { Component, createSignal, createMemo, Show, For } from 'solid-js';
import { useTranslation } from '@/utils/i18n';
import type { NestResult } from '@/types/app.types';

interface ResultViewerProps {
  result: NestResult;
}

const ResultViewer: Component<ResultViewerProps> = (props) => {
  const [t] = useTranslation('nesting');
  const [zoomLevel, setZoomLevel] = createSignal(1);
  const [panOffset, setPanOffset] = createSignal({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = createSignal(false);
  const [dragStart, setDragStart] = createSignal({ x: 0, y: 0 });

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

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev * 1.2, 5));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev / 1.2, 0.1));
  };

  const handleResetView = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - panOffset().x, y: e.clientY - panOffset().y });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging()) return;
    
    const newOffset = {
      x: e.clientX - dragStart().x,
      y: e.clientY - dragStart().y
    };
    setPanOffset(newOffset);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const svgTransform = createMemo(() => {
    const zoom = zoomLevel();
    const offset = panOffset();
    return `translate(${offset.x}, ${offset.y}) scale(${zoom})`;
  });

  return (
    <div class="result-viewer">
      <div class="viewer-controls">
        <div class="zoom-controls">
          <button class="control-button" onClick={handleZoomOut} title={t('zoom_out')}>
            🔍−
          </button>
          <span class="zoom-level">{Math.round(zoomLevel() * 100)}%</span>
          <button class="control-button" onClick={handleZoomIn} title={t('zoom_in')}>
            🔍+
          </button>
          <button class="control-button" onClick={handleResetView} title={t('reset_view')}>
            🎯
          </button>
        </div>
      </div>

      <div class="viewer-content">
        <div class="svg-viewer-container">
          <svg
            class="result-svg"
            width="100%"
            height="400"
            viewBox="0 0 800 400"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            style={{ cursor: isDragging() ? 'grabbing' : 'grab' }}
          >
            <g transform={svgTransform()}>
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
                      stroke="var(--border-color)"
                      stroke-width="2"
                    />
                    <text
                      x={(sheet.x || 0) + 10}
                      y={(sheet.y || 0) + 25}
                      font-size="12"
                      fill="var(--text-secondary)"
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
                      fill="rgba(36, 199, 237, 0.7)"
                      stroke="var(--button-primary)"
                      stroke-width="1"
                      transform={`rotate(${placement.rotation || 0} ${placement.x + (placement.width || 50) / 2} ${placement.y + (placement.height || 50) / 2})`}
                    />
                  </g>
                )}
              </For>
            </g>
          </svg>
        </div>

        <div class="result-statistics">
          <h4>{t('statistics')}</h4>
          
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-value efficiency">
                {props.result.efficiency ? `${(props.result.efficiency * 100).toFixed(1)}%` : 'N/A'}
              </div>
              <div class="stat-label">{t('material_efficiency')}</div>
            </div>

            <div class="stat-card">
              <div class="stat-value">
                {props.result.fitness?.toFixed(2) || 'N/A'}
              </div>
              <div class="stat-label">{t('fitness_score')}</div>
            </div>

            <div class="stat-card">
              <div class="stat-value">
                {props.result.sheets?.length || 0}
              </div>
              <div class="stat-label">{t('sheets_used')}</div>
            </div>

            <div class="stat-card">
              <div class="stat-value">
                {wastePercentage().toFixed(1)}%
              </div>
              <div class="stat-label">{t('material_waste')}</div>
            </div>
          </div>

          <div class="detailed-stats">
            <div class="stat-row">
              <span class="stat-title">{t('total_parts_placed')}:</span>
              <span class="stat-data">{props.result.placedParts || 0}</span>
            </div>
            <div class="stat-row">
              <span class="stat-title">{t('total_material_used')}:</span>
              <span class="stat-data">{totalMaterialUsed().toFixed(2)}</span>
            </div>
            <Show when={props.result.generationTime}>
              <div class="stat-row">
                <span class="stat-title">{t('generation_time')}:</span>
                <span class="stat-data">{props.result.generationTime}ms</span>
              </div>
            </Show>
            <Show when={props.result.generation}>
              <div class="stat-row">
                <span class="stat-title">{t('generation_number')}:</span>
                <span class="stat-data">{props.result.generation}</span>
              </div>
            </Show>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultViewer;