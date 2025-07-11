import { Component, Show, createMemo } from 'solid-js';
import { useTranslation } from '@/utils/i18n';
import { globalState, globalActions } from '@/stores/global.store';
import { ipcService } from '@/services/ipc.service';
import NestingProgress from './NestingProgress';
import ResultsGrid from './ResultsGrid';

const NestingPanel: Component = () => {
  const [t] = useTranslation('nesting');

  const canStartNesting = createMemo(() => {
    return globalState.app.parts.length > 0 &&
           globalState.app.sheets.length > 0 &&
           !globalState.process.isNesting;
  });

  const hasResults = createMemo(() => globalState.app.nests.length > 0);

  const handleStartNesting = async () => {
    if (!canStartNesting()) return;

    try {
      globalActions.setNestingStatus(true);
      globalActions.setNestingProgress(0);
      globalActions.setError(null);

      const nestingConfig = {
        parts: globalState.app.parts.filter(p => p.quantity > 0),
        sheets: globalState.app.sheets,
        config: globalState.config
      };

      await ipcService.startNesting(nestingConfig);
    } catch (error) {
      console.error('Failed to start nesting:', error);
      globalActions.setError(t('start_nesting_failed'));
      globalActions.setNestingStatus(false);
    }
  };

  const handleStopNesting = async () => {
    if (!globalState.process.isNesting) return;

    try {
      await ipcService.stopNesting();
      globalActions.setNestingStatus(false);
    } catch (error) {
      console.error('Failed to stop nesting:', error);
      globalActions.setError(t('stop_nesting_failed'));
    }
  };

  const handleClearResults = () => {
    globalActions.setNests([]);
  };

  const selectedPartsCount = createMemo(() =>
    globalState.app.parts.filter(p => p.quantity > 0).length
  );

  return (
    <div class="h-full flex flex-col">
      <div class="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <h2 class="text-lg font-medium text-gray-900 dark:text-gray-100">{t('nesting_title')}</h2>
        <div class="flex gap-2">
          <button
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            onClick={handleStartNesting}
            disabled={!canStartNesting()}
            title={!canStartNesting() ? t('cannot_start_nesting') : t('start_nesting')}
          >
            ▶️ {t('start_nesting')}
          </button>
          <button
            class="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            onClick={handleStopNesting}
            disabled={!globalState.process.isNesting}
            title={t('stop_nesting')}
          >
            ⏹️ {t('stop_nesting')}
          </button>
          <Show when={hasResults() && !globalState.process.isNesting}>
            <button
              class="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-200"
              onClick={handleClearResults}
              title={t('clear_results')}
            >
              🗑️ {t('clear_results')}
            </button>
          </Show>
        </div>
      </div>

      <div class="flex items-center justify-between p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div class="flex gap-6">
          <div class="flex items-center gap-2">
            <span class="text-sm text-gray-600 dark:text-gray-400">{t('parts_to_nest')}:</span>
            <span class="text-sm font-medium text-gray-900 dark:text-gray-100">{selectedPartsCount()}</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-sm text-gray-600 dark:text-gray-400">{t('available_sheets')}:</span>
            <span class="text-sm font-medium text-gray-900 dark:text-gray-100">{globalState.app.sheets.length}</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-sm text-gray-600 dark:text-gray-400">{t('results_count')}:</span>
            <span class="text-sm font-medium text-gray-900 dark:text-gray-100">{globalState.app.nests.length}</span>
          </div>
        </div>
      </div>

      <div class="flex-1 overflow-hidden">
        <Show when={globalState.process.isNesting}>
          <NestingProgress />
        </Show>

        <Show
          when={hasResults()}
          fallback={
            <div class="h-full flex flex-col items-center justify-center text-center gap-4 p-8">
              <div class="text-6xl opacity-30">🎯</div>
              <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100">{t('no_nesting_results')}</h3>
              <p class="text-gray-600 dark:text-gray-400">{t('start_nesting_to_see_results')}</p>
              <Show when={!canStartNesting()}>
                <p class="text-amber-600 dark:text-amber-400">{t('add_parts_and_sheets_first')}</p>
              </Show>
            </div>
          }
        >
          <ResultsGrid />
        </Show>
      </div>
    </div>
  );
};

export default NestingPanel;
