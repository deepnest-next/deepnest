import { Component, createMemo, Show } from 'solid-js';
import { useTranslation } from '@/utils/i18n';
import { globalState } from '@/stores/global.store';

const NestingProgress: Component = () => {
  const [t] = useTranslation('nesting');

  const progressPercentage = createMemo(() => {
    return Math.max(0, Math.min(100, globalState.process.progress));
  });

  const estimatedTimeRemaining = createMemo(() => {
    const progress = progressPercentage();
    if (progress === 0) return null;
    
    // Simple estimation based on current progress
    // This would be more sophisticated in a real implementation
    const totalEstimatedTime = 60000; // 1 minute default
    const remaining = (totalEstimatedTime * (100 - progress)) / progress;
    
    if (remaining < 60000) {
      return `${Math.round(remaining / 1000)}s`;
    } else {
      return `${Math.round(remaining / 60000)}m`;
    }
  });

  return (
    <div class="nesting-progress">
      <div class="progress-header">
        <h3>{t('nesting_in_progress')}</h3>
        <div class="progress-percentage">
          {progressPercentage().toFixed(1)}%
        </div>
      </div>

      <div class="progress-bar-container">
        <div class="progress-bar large">
          <div
            class="progress-fill"
            style={{ width: `${progressPercentage()}%` }}
          />
        </div>
        <Show when={estimatedTimeRemaining()}>
          <div class="time-remaining">
            {t('estimated_time_remaining')}: {estimatedTimeRemaining()}
          </div>
        </Show>
      </div>

      <div class="progress-details">
        <Show when={globalState.process.workerStatus.currentOperation}>
          <div class="current-operation">
            <span class="operation-label">{t('current_operation')}:</span>
            <span class="operation-text">{globalState.process.workerStatus.currentOperation}</span>
          </div>
        </Show>

        <div class="worker-info">
          <div class="info-item">
            <span class="info-label">{t('threads_active')}:</span>
            <span class="info-value">{globalState.process.workerStatus.threadsActive}</span>
          </div>
          <div class="info-item">
            <span class="info-label">{t('worker_status')}:</span>
            <span class={`info-value ${globalState.process.workerStatus.isRunning ? 'running' : 'stopped'}`}>
              {globalState.process.workerStatus.isRunning ? t('running') : t('stopped')}
            </span>
          </div>
        </div>

        <Show when={globalState.process.currentNest}>
          <div class="current-nest-info">
            <div class="info-item">
              <span class="info-label">{t('current_generation')}:</span>
              <span class="info-value">{globalState.process.currentNest?.generation || 0}</span>
            </div>
            <div class="info-item">
              <span class="info-label">{t('best_fitness')}:</span>
              <span class="info-value">{globalState.process.currentNest?.fitness?.toFixed(2) || 'N/A'}</span>
            </div>
          </div>
        </Show>
      </div>

      <div class="progress-actions">
        <button class="button-link" onClick={() => window.location.reload()}>
          {t('refresh_status')}
        </button>
      </div>
    </div>
  );
};

export default NestingProgress;