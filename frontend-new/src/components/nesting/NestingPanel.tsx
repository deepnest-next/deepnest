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
    <div class="nesting-panel">
      <div class="panel-header">
        <h2>{t('nesting_title')}</h2>
        <div class="panel-actions">
          <button 
            class="button primary"
            onClick={handleStartNesting}
            disabled={!canStartNesting()}
            title={!canStartNesting() ? t('cannot_start_nesting') : t('start_nesting')}
          >
            ▶️ {t('start_nesting')}
          </button>
          <button 
            class="button secondary"
            onClick={handleStopNesting}
            disabled={!globalState.process.isNesting}
            title={t('stop_nesting')}
          >
            ⏹️ {t('stop_nesting')}
          </button>
          <Show when={hasResults() && !globalState.process.isNesting}>
            <button 
              class="button secondary"
              onClick={handleClearResults}
              title={t('clear_results')}
            >
              🗑️ {t('clear_results')}
            </button>
          </Show>
        </div>
      </div>

      <div class="nesting-summary">
        <div class="summary-item">
          <span class="summary-label">{t('parts_to_nest')}:</span>
          <span class="summary-value">{selectedPartsCount()}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">{t('available_sheets')}:</span>
          <span class="summary-value">{globalState.app.sheets.length}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">{t('results_count')}:</span>
          <span class="summary-value">{globalState.app.nests.length}</span>
        </div>
      </div>

      <div class="panel-content">
        <Show when={globalState.process.isNesting}>
          <NestingProgress />
        </Show>

        <Show 
          when={hasResults()}
          fallback={
            <div class="empty-state">
              <div class="empty-icon">🎯</div>
              <h3>{t('no_nesting_results')}</h3>
              <p>{t('start_nesting_to_see_results')}</p>
              <Show when={!canStartNesting()}>
                <p class="warning-text">{t('add_parts_and_sheets_first')}</p>
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