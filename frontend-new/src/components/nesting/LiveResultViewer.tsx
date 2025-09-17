import { Component, createSignal, createEffect, Show, For, onCleanup } from 'solid-js';
import { useTranslation } from '@/utils/i18n';
import { globalState } from '@/stores/global.store';
import { nestingService } from '@/services/nesting.service';
import { connectionService } from '@/services/connection.service';
import type { NestResult } from '@/types/app.types';
import type { BackgroundWorkerResult } from '@/types/ipc.types';

/**
 * Live result viewer component that displays real-time nesting results
 * Shows progress, intermediate results, and connection status
 */
const LiveResultViewer: Component = () => {
  const [t] = useTranslation('nesting');
  const [intermediateResults, setIntermediateResults] = createSignal<BackgroundWorkerResult[]>([]);
  const [lastUpdateTime, setLastUpdateTime] = createSignal<number>(Date.now());
  const [isExpanded, setIsExpanded] = createSignal(false);

  // Subscribe to low-level background worker events for real-time updates
  const backgroundProgressCleanup = nestingService.onBackgroundProgress((data) => {
    setLastUpdateTime(Date.now());
    console.log('Background progress:', data);
  });

  const backgroundResponseCleanup = nestingService.onBackgroundResponse((data) => {
    setIntermediateResults(prev => {
      // Keep only the last 10 results to prevent memory issues
      const updated = [data, ...prev].slice(0, 10);
      return updated;
    });
    setLastUpdateTime(Date.now());
  });

  onCleanup(() => {
    backgroundProgressCleanup?.();
    backgroundResponseCleanup?.();
  });

  // Format time since last update
  const timeSinceLastUpdate = () => {
    const now = Date.now();
    const lastUpdate = lastUpdateTime();
    const diff = now - lastUpdate;
    
    if (diff < 1000) return t('just_now');
    if (diff < 60000) return t('seconds_ago', { count: Math.floor(diff / 1000) });
    if (diff < 3600000) return t('minutes_ago', { count: Math.floor(diff / 60000) });
    return t('hours_ago', { count: Math.floor(diff / 3600000) });
  };

  // Get connection status indicator
  const connectionStatusColor = () => {
    const status = connectionService.status;
    if (!status.connected) return 'text-red-500';
    if (!status.healthy) return 'text-yellow-500';
    return 'text-green-500';
  };

  // Format fitness score
  const formatFitness = (fitness: number) => {
    return fitness.toFixed(4);
  };

  // Format utilization percentage
  const formatUtilization = (utilization: number) => {
    return (utilization * 100).toFixed(1);
  };

  return (
    <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 m-4">
      {/* Header */}
      <div class="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div class="flex items-center space-x-3">
          <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100">
            {t('live_results')}
          </h3>
          <div class={`w-2 h-2 rounded-full ${connectionStatusColor()}`} title={connectionService.status.connected ? t('connected') : t('disconnected')} />
        </div>
        <div class="flex items-center space-x-2">
          <span class="text-sm text-gray-500 dark:text-gray-400">
            {t('last_update')}: {timeSinceLastUpdate()}
          </span>
          <button
            class="text-blue-600 dark:text-blue-400 hover:underline text-sm"
            onClick={() => setIsExpanded(!isExpanded())}
          >
            {isExpanded() ? t('collapse') : t('expand')}
          </button>
        </div>
      </div>

      {/* Current Progress */}
      <div class="p-4 border-b border-gray-200 dark:border-gray-700">
        <div class="flex items-center justify-between mb-2">
          <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
            {t('current_progress')}
          </span>
          <span class="text-sm font-bold text-blue-600 dark:text-blue-400">
            {(globalState.process.progress * 100).toFixed(1)}%
          </span>
        </div>
        <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2">
          <div
            class="h-full bg-blue-500 dark:bg-blue-400 rounded-full transition-all duration-300"
            style={{ width: `${globalState.process.progress * 100}%` }}
          />
        </div>
        <Show when={globalState.process.workerStatus.currentOperation}>
          <div class="text-sm text-gray-600 dark:text-gray-400">
            {globalState.process.workerStatus.currentOperation}
          </div>
        </Show>
      </div>

      {/* Best Result Summary */}
      <Show when={globalState.process.currentNest}>
        <div class="p-4 border-b border-gray-200 dark:border-gray-700">
          <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('best_result')}
          </h4>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <span class="text-xs text-gray-500 dark:text-gray-400">{t('fitness')}</span>
              <div class="font-mono text-sm text-gray-900 dark:text-gray-100">
                {formatFitness(globalState.process.currentNest!.fitness)}
              </div>
            </div>
            <div>
              <span class="text-xs text-gray-500 dark:text-gray-400">{t('utilization')}</span>
              <div class="font-mono text-sm text-gray-900 dark:text-gray-100">
                {formatUtilization(globalState.process.currentNest!.utilisation)}%
              </div>
            </div>
          </div>
        </div>
      </Show>

      {/* Intermediate Results (when expanded) */}
      <Show when={isExpanded()}>
        <div class="p-4">
          <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            {t('intermediate_results')} ({intermediateResults().length})
          </h4>
          <Show 
            when={intermediateResults().length > 0}
            fallback={
              <div class="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                {t('no_intermediate_results')}
              </div>
            }
          >
            <div class="space-y-2 max-h-64 overflow-y-auto">
              <For each={intermediateResults()}>
                {(result, index) => (
                  <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded">
                    <div class="flex items-center space-x-3">
                      <div class="w-2 h-2 rounded-full bg-blue-500" />
                      <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
                        #{result.index}
                      </span>
                    </div>
                    <div class="flex items-center space-x-4">
                      <div class="text-right">
                        <div class="text-xs text-gray-500 dark:text-gray-400">{t('fitness')}</div>
                        <div class="font-mono text-sm text-gray-900 dark:text-gray-100">
                          {formatFitness(result.fitness)}
                        </div>
                      </div>
                      <div class="text-right">
                        <div class="text-xs text-gray-500 dark:text-gray-400">{t('utilization')}</div>
                        <div class="font-mono text-sm text-gray-900 dark:text-gray-100">
                          {formatUtilization(result.utilisation)}%
                        </div>
                      </div>
                      <div class="text-right">
                        <div class="text-xs text-gray-500 dark:text-gray-400">{t('sheets')}</div>
                        <div class="font-mono text-sm text-gray-900 dark:text-gray-100">
                          {result.placements.length}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </For>
            </div>
          </Show>
        </div>
      </Show>

      {/* Connection Status */}
      <Show when={!connectionService.status.connected}>
        <div class="p-4 bg-red-50 dark:bg-red-900/20 border-t border-red-200 dark:border-red-700">
          <div class="flex items-center space-x-2">
            <div class="w-2 h-2 rounded-full bg-red-500" />
            <span class="text-sm text-red-700 dark:text-red-300">
              {t('connection_lost')}
            </span>
            <Show when={connectionService.status.reconnectAttempts > 0}>
              <span class="text-xs text-red-600 dark:text-red-400">
                ({t('reconnect_attempts', { count: connectionService.status.reconnectAttempts })})
              </span>
            </Show>
          </div>
        </div>
      </Show>

      {/* Error Display */}
      <Show when={globalState.process.lastError}>
        <div class="p-4 bg-red-50 dark:bg-red-900/20 border-t border-red-200 dark:border-red-700">
          <div class="flex items-start space-x-2">
            <div class="w-2 h-2 rounded-full bg-red-500 mt-1" />
            <div>
              <div class="text-sm font-medium text-red-700 dark:text-red-300">
                {t('error_occurred')}
              </div>
              <div class="text-xs text-red-600 dark:text-red-400 mt-1">
                {globalState.process.lastError}
              </div>
            </div>
          </div>
        </div>
      </Show>
    </div>
  );
};

export default LiveResultViewer;