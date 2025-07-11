import { Component, For, createSignal, Show, createMemo } from 'solid-js';
import { useTranslation } from '@/utils/i18n';
import { globalState, globalActions } from '@/stores/global.store';
import { ipcService } from '@/services/ipc.service';
import type { NestResult } from '@/types/app.types';
import ResultViewer from './ResultViewer';

const ResultsGrid: Component = () => {
  const [t] = useTranslation('nesting');
  const [selectedResult, setSelectedResult] = createSignal<NestResult | null>(null);
  const [viewMode, setViewMode] = createSignal<'grid' | 'detail'>('grid');

  const sortedResults = createMemo(() => {
    return [...globalState.app.nests].sort((a, b) => {
      // Sort by efficiency (higher first), then by fitness (higher first)
      if (a.efficiency !== b.efficiency) {
        return (b.efficiency || 0) - (a.efficiency || 0);
      }
      return (b.fitness || 0) - (a.fitness || 0);
    });
  });

  const handleResultClick = (result: NestResult) => {
    setSelectedResult(result);
    setViewMode('detail');
  };

  const handleBackToGrid = () => {
    setSelectedResult(null);
    setViewMode('grid');
  };

  const handleExportResult = async (result: NestResult) => {
    if (!ipcService.isAvailable) return;

    try {
      const exportResult = await ipcService.saveFileDialog({
        title: t('export_result'),
        defaultPath: `nest_result_${result.id}.svg`,
        filters: [
          { name: 'SVG Files', extensions: ['svg'] },
          { name: 'DXF Files', extensions: ['dxf'] },
          { name: 'All Files', extensions: ['*'] }
        ]
      });

      if (exportResult.canceled || !exportResult.filePath) {
        return;
      }

      await ipcService.exportNestResult(result, exportResult.filePath);
    } catch (error) {
      console.error('Failed to export result:', error);
      globalActions.setError(t('export_failed'));
    }
  };

  const handleDeleteResult = (result: NestResult) => {
    const remainingResults = globalState.app.nests.filter(r => r.id !== result.id);
    globalActions.setNests(remainingResults);
  };

  const formatEfficiency = (efficiency?: number) => {
    return efficiency ? `${(efficiency * 100).toFixed(1)}%` : 'N/A';
  };

  const formatFitness = (fitness?: number) => {
    return fitness ? fitness.toFixed(2) : 'N/A';
  };

  return (
    <div class="results-grid-container">
      <Show when={viewMode() === 'detail' && selectedResult()}>
        <div class="result-detail-view">
          <div class="detail-header">
            <button class="button secondary" onClick={handleBackToGrid}>
              ← {t('back_to_results')}
            </button>
            <h3>{t('result_details')}</h3>
            <div class="detail-actions">
              <button 
                class="button secondary"
                onClick={() => handleExportResult(selectedResult()!)}
              >
                📤 {t('export')}
              </button>
            </div>
          </div>
          <ResultViewer result={selectedResult()!} />
        </div>
      </Show>

      <Show when={viewMode() === 'grid'}>
        <div class="results-header">
          <h3>{t('nesting_results')} ({sortedResults().length})</h3>
          <div class="results-controls">
            <label class="sort-label">{t('sorted_by_efficiency')}</label>
          </div>
        </div>

        <div class="results-grid">
          <For each={sortedResults()}>
            {(result, index) => (
              <div class="result-card">
                <div class="result-preview" onClick={() => handleResultClick(result)}>
                  <div class="preview-placeholder">
                    <div class="preview-icon">🎯</div>
                    <div class="preview-text">{t('click_to_view')}</div>
                  </div>
                </div>

                <div class="result-info">
                  <div class="result-title">
                    {t('result')} #{index() + 1}
                    <Show when={index() === 0}>
                      <span class="best-badge">{t('best')}</span>
                    </Show>
                  </div>

                  <div class="result-stats">
                    <div class="stat-item">
                      <span class="stat-label">{t('efficiency')}:</span>
                      <span class="stat-value efficiency">
                        {formatEfficiency(result.efficiency)}
                      </span>
                    </div>
                    <div class="stat-item">
                      <span class="stat-label">{t('fitness')}:</span>
                      <span class="stat-value">{formatFitness(result.fitness)}</span>
                    </div>
                    <div class="stat-item">
                      <span class="stat-label">{t('sheets_used')}:</span>
                      <span class="stat-value">{result.sheets?.length || 0}</span>
                    </div>
                    <Show when={result.placedParts}>
                      <div class="stat-item">
                        <span class="stat-label">{t('parts_placed')}:</span>
                        <span class="stat-value">{result.placedParts}</span>
                      </div>
                    </Show>
                  </div>

                  <div class="result-actions">
                    <button 
                      class="button-link"
                      onClick={() => handleResultClick(result)}
                    >
                      {t('view_details')}
                    </button>
                    <button 
                      class="button-link"
                      onClick={() => handleExportResult(result)}
                    >
                      {t('export')}
                    </button>
                    <button 
                      class="button-link danger"
                      onClick={() => handleDeleteResult(result)}
                    >
                      {t('delete')}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </For>
        </div>
      </Show>
    </div>
  );
};

export default ResultsGrid;