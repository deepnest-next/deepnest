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
    <div class="p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 m-4">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100">{t('nesting_in_progress')}</h3>
        <div class="text-2xl font-bold text-blue-600 dark:text-blue-400">
          {progressPercentage().toFixed(1)}%
        </div>
      </div>

      <div class="mb-6">
        <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-2 overflow-hidden">
          <div
            class="h-full bg-blue-500 dark:bg-blue-400 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progressPercentage()}%` }}
          />
        </div>
        <Show when={estimatedTimeRemaining()}>
          <div class="text-sm text-gray-600 dark:text-gray-400 text-center">
            {t('estimated_time_remaining')}: {estimatedTimeRemaining()}
          </div>
        </Show>
      </div>

      <div class="space-y-4">
        <Show when={globalState.process.workerStatus.currentOperation}>
          <div class="bg-gray-50 dark:bg-gray-700 p-3 rounded">
            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">{t('current_operation')}:</span>
            <span class="ml-2 text-sm text-gray-900 dark:text-gray-100">{globalState.process.workerStatus.currentOperation}</span>
          </div>
        </Show>

        <div class="grid grid-cols-2 gap-4">
          <div class="flex justify-between">
            <span class="text-sm text-gray-600 dark:text-gray-400">{t('threads_active')}:</span>
            <span class="text-sm font-medium text-gray-900 dark:text-gray-100">{globalState.process.workerStatus.threadsActive}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-sm text-gray-600 dark:text-gray-400">{t('worker_status')}:</span>
            <span class={`text-sm font-medium ${globalState.process.workerStatus.isRunning ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {globalState.process.workerStatus.isRunning ? t('running') : t('stopped')}
            </span>
          </div>
        </div>

        <Show when={globalState.process.currentNest}>
          <div class="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-600">
            <div class="flex justify-between">
              <span class="text-sm text-gray-600 dark:text-gray-400">{t('current_generation')}:</span>
              <span class="text-sm font-medium text-gray-900 dark:text-gray-100">{globalState.process.currentNest?.generation || 0}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-sm text-gray-600 dark:text-gray-400">{t('best_fitness')}:</span>
              <span class="text-sm font-medium text-gray-900 dark:text-gray-100">{globalState.process.currentNest?.fitness?.toFixed(2) || 'N/A'}</span>
            </div>
          </div>
        </Show>
      </div>

      <div class="flex justify-center pt-4 border-t border-gray-200 dark:border-gray-600">
        <button class="text-blue-600 dark:text-blue-400 hover:underline text-sm" onClick={() => window.location.reload()}>
          {t('refresh_status')}
        </button>
      </div>
    </div>
  );
};

export default NestingProgress;