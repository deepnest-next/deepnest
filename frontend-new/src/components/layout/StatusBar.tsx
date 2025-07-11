import { Component, Show, createMemo } from 'solid-js';
import { useTranslation } from '@/utils/i18n';
import { globalState } from '@/stores/global.store';

const StatusBar: Component = () => {
  const [t] = useTranslation('common');

  const statusText = createMemo(() => {
    const { process } = globalState;
    
    if (process.isNesting) {
      return t('status.nesting_in_progress');
    }
    
    if (process.lastError) {
      return t('status.error_occurred');
    }
    
    if (process.workerStatus.isRunning) {
      return process.workerStatus.currentOperation || t('status.processing');
    }
    
    return t('status.ready');
  });

  const progressPercentage = createMemo(() => {
    return Math.max(0, Math.min(100, globalState.process.progress));
  });

  return (
    <footer class="h-8 bg-deepnest-bg-secondary dark:bg-deepnest-dark-bg-secondary border-t border-deepnest-border dark:border-deepnest-dark-border flex items-center justify-between px-4 text-xs">
      <div class="flex items-center gap-4">
        <span class="text-deepnest-text-primary dark:text-deepnest-dark-text-primary">{statusText()}</span>
        
        <Show when={globalState.process.isNesting}>
          <div class="flex items-center gap-2">
            <div class="progress-bar w-24">
              <div
                class="progress-fill progress-fill-primary"
                style={{ width: `${progressPercentage()}%` }}
              />
            </div>
            <span class="text-deepnest-text-secondary dark:text-deepnest-dark-text-secondary min-w-12 text-right">{progressPercentage().toFixed(1)}%</span>
          </div>
        </Show>
      </div>
      
      <div class="flex items-center gap-4 text-deepnest-text-secondary dark:text-deepnest-dark-text-secondary">
        <Show when={globalState.process.workerStatus.threadsActive > 0}>
          <span class="thread-count">
            {t('status.threads_active', { count: globalState.process.workerStatus.threadsActive })}
          </span>
        </Show>
        
        <Show when={globalState.app.parts.length > 0}>
          <span class="parts-count">
            {t('status.parts_loaded', { count: globalState.app.parts.length })}
          </span>
        </Show>
        
        <Show when={globalState.app.nests.length > 0}>
          <span class="nests-count">
            {t('status.nests_available', { count: globalState.app.nests.length })}
          </span>
        </Show>
        
        <Show when={globalState.process.lastError}>
          <div class="flex items-center gap-1 text-red-500">
            <span class="error-icon">⚠️</span>
            <span class="error-text max-w-64 text-truncate">{globalState.process.lastError}</span>
          </div>
        </Show>
      </div>
    </footer>
  );
};

export default StatusBar;