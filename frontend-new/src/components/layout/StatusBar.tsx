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
    <footer class="status-bar">
      <div class="status-left">
        <span class="status-text">{statusText()}</span>
        
        <Show when={globalState.process.isNesting}>
          <div class="progress-container">
            <div class="progress-bar">
              <div
                class="progress-fill"
                style={{ width: `${progressPercentage()}%` }}
              />
            </div>
            <span class="progress-text">{progressPercentage().toFixed(1)}%</span>
          </div>
        </Show>
      </div>
      
      <div class="status-right">
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
          <div class="error-status">
            <span class="error-icon">⚠️</span>
            <span class="error-text">{globalState.process.lastError}</span>
          </div>
        </Show>
      </div>
    </footer>
  );
};

export default StatusBar;