import { Component, Show, createMemo } from 'solid-js';
import { useTranslation } from '@/utils/i18n';
import { globalState } from '@/stores/global.store';

const StatusBar: Component = () => {
  const [t] = useTranslation('translation');

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
    <footer class="h-10 bg-gray-100 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 text-xs">
      <div class="flex items-center gap-4">
        <div class="flex items-center gap-2">
          <div class={`w-2 h-2 rounded-full ${
            globalState.process.isNesting 
              ? 'bg-blue-500 animate-pulse' 
              : globalState.process.lastError 
                ? 'bg-red-500' 
                : 'bg-green-500'
          }`} />
          <span class="text-gray-900 dark:text-gray-100 font-medium">{statusText()}</span>
        </div>
        
        <Show when={globalState.process.isNesting}>
          <div class="flex items-center gap-3">
            <div class="w-32 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                class="h-full bg-blue-500 dark:bg-blue-400 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progressPercentage()}%` }}
              />
            </div>
            <span class="text-gray-600 dark:text-gray-400 min-w-10 text-right font-mono">
              {progressPercentage().toFixed(1)}%
            </span>
          </div>
        </Show>
      </div>
      
      <div class="flex items-center gap-6 text-gray-600 dark:text-gray-400">
        <Show when={globalState.process.workerStatus.threadsActive > 0}>
          <div class="flex items-center gap-1">
            <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd"></path>
            </svg>
            <span>{globalState.process.workerStatus.threadsActive} threads</span>
          </div>
        </Show>
        
        <Show when={globalState.app.parts.length > 0}>
          <div class="flex items-center gap-1">
            <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clip-rule="evenodd"></path>
            </svg>
            <span>{globalState.app.parts.length} parts</span>
          </div>
        </Show>
        
        <Show when={globalState.app.nests.length > 0}>
          <div class="flex items-center gap-1">
            <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
            </svg>
            <span>{globalState.app.nests.length} results</span>
          </div>
        </Show>
        
        <Show when={globalState.process.lastError}>
          <div class="flex items-center gap-1 text-red-500 dark:text-red-400">
            <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
            </svg>
            <span class="max-w-64 truncate">{globalState.process.lastError}</span>
          </div>
        </Show>
      </div>
    </footer>
  );
};

export default StatusBar;