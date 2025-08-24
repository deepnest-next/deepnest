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
    <div class="h-full flex flex-col">
      <Show when={viewMode() === 'detail' && selectedResult()}>
        <div class="h-full flex flex-col">
          <div class="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <button class="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-200" onClick={handleBackToGrid}>
              ← {t('back_to_results')}
            </button>
            <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100">{t('result_details')}</h3>
            <div class="flex gap-2">
              <button 
                class="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-200"
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
        <div class="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100">{t('nesting_results')} ({sortedResults().length})</h3>
          <div class="text-sm text-gray-600 dark:text-gray-400">
            <label>{t('sorted_by_efficiency')}</label>
          </div>
        </div>

        <div class="flex-1 overflow-y-auto p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <For each={sortedResults()}>
            {(result, index) => (
              <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-shadow duration-200">
                <div class="h-32 bg-gray-50 dark:bg-gray-700 flex items-center justify-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors" onClick={() => handleResultClick(result)}>
                  <div class="text-center">
                    <div class="text-2xl mb-1">🎯</div>
                    <div class="text-sm text-gray-600 dark:text-gray-400">{t('click_to_view')}</div>
                  </div>
                </div>

                <div class="p-4">
                  <div class="flex items-center justify-between mb-3">
                    <h4 class="font-medium text-gray-900 dark:text-gray-100">{t('result')} #{index() + 1}</h4>
                    <Show when={index() === 0}>
                      <span class="text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded-full">{t('best')}</span>
                    </Show>
                  </div>

                  <div class="space-y-2 mb-4">
                    <div class="flex justify-between text-sm">
                      <span class="text-gray-600 dark:text-gray-400">{t('efficiency')}:</span>
                      <span class="font-medium text-green-600 dark:text-green-400">
                        {formatEfficiency(result.efficiency)}
                      </span>
                    </div>
                    <div class="flex justify-between text-sm">
                      <span class="text-gray-600 dark:text-gray-400">{t('fitness')}:</span>
                      <span class="font-medium text-gray-900 dark:text-gray-100">{formatFitness(result.fitness)}</span>
                    </div>
                    <div class="flex justify-between text-sm">
                      <span class="text-gray-600 dark:text-gray-400">{t('sheets_used')}:</span>
                      <span class="font-medium text-gray-900 dark:text-gray-100">{result.sheets?.length || 0}</span>
                    </div>
                    <Show when={result.placedParts}>
                      <div class="flex justify-between text-sm">
                        <span class="text-gray-600 dark:text-gray-400">{t('parts_placed')}:</span>
                        <span class="font-medium text-gray-900 dark:text-gray-100">{result.placedParts}</span>
                      </div>
                    </Show>
                  </div>

                  <div class="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-gray-700">
                    <button 
                      class="text-blue-600 dark:text-blue-400 hover:underline text-sm"
                      onClick={() => handleResultClick(result)}
                    >
                      {t('view_details')}
                    </button>
                    <div class="flex gap-2">
                      <button 
                        class="text-blue-600 dark:text-blue-400 hover:underline text-sm"
                        onClick={() => handleExportResult(result)}
                      >
                        {t('export')}
                      </button>
                      <button 
                        class="text-red-600 dark:text-red-400 hover:underline text-sm"
                        onClick={() => handleDeleteResult(result)}
                      >
                        {t('delete')}
                      </button>
                    </div>
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