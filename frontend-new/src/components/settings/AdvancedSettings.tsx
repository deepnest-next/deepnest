import { Component, createSignal, Show } from 'solid-js';
import { useTranslation } from '@/utils/i18n';
import { globalState, globalActions } from '@/stores/global.store';

const AdvancedSettings: Component = () => {
  const [t] = useTranslation('settings');
  const [showDebugInfo, setShowDebugInfo] = createSignal(false);

  const handleClearCache = () => {
    const confirmed = confirm(t('confirm_clear_cache'));
    if (!confirmed) return;

    try {
      localStorage.clear();
      globalActions.setError(null);
      alert(t('cache_cleared_success'));
    } catch (error) {
      console.error('Failed to clear cache:', error);
      globalActions.setError(t('cache_clear_failed'));
    }
  };

  const handleResetPanels = () => {
    globalActions.setPanelWidth('partsWidth', 300);
    globalActions.setActiveTab('parts');
  };

  const handleExportDebugInfo = () => {
    const debugInfo = {
      timestamp: new Date().toISOString(),
      platform: navigator.platform,
      userAgent: navigator.userAgent,
      language: navigator.language,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      globalState: {
        ui: globalState.ui,
        config: globalState.config,
        partsCount: globalState.app.parts.length,
        sheetsCount: globalState.app.sheets.length,
        nestsCount: globalState.app.nests.length,
        presetsCount: globalState.presets.length
      },
      performance: {
        memory: (performance as any).memory ? {
          usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
          totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
          jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit
        } : null
      }
    };

    const blob = new Blob([JSON.stringify(debugInfo, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `deepnest-debug-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div class="space-y-6">
      {/* Performance Section */}
      <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 space-y-6">
        <div class="flex items-center gap-3 pb-4 border-b border-gray-200 dark:border-gray-700">
          <div class="w-8 h-8 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
            <svg class="w-4 h-4 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h4 class="text-lg font-semibold text-gray-900 dark:text-gray-100">{t('performance')}</h4>
        </div>
        
        {/* Worker Threads */}
        <div class="space-y-3">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t('worker_threads')}
          </label>
          <input
            type="number"
            min="1"
            max={navigator.hardwareConcurrency || 8}
            value={globalState.config.workerThreads || navigator.hardwareConcurrency || 4}
            onInput={(e) => globalActions.updateConfig({
              ...globalState.config,
              workerThreads: parseInt(e.currentTarget.value) || 4
            })}
            class="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors duration-200"
          />
          <p class="text-sm text-gray-500 dark:text-gray-400">
            {t('worker_threads_description', { max: navigator.hardwareConcurrency || 8 })}
          </p>
        </div>

        {/* GPU Acceleration */}
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <div>
              <label class="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('enable_gpu_acceleration')}
              </label>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                {t('gpu_acceleration_description')}
              </p>
            </div>
            <input
              type="checkbox"
              checked={globalState.config.enableGPU || false}
              onChange={(e) => globalActions.updateConfig({
                ...globalState.config,
                enableGPU: e.currentTarget.checked
              })}
              class="w-4 h-4 text-blue-600 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-2"
            />
          </div>
        </div>

        {/* Caching */}
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <div>
              <label class="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('enable_caching')}
              </label>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                {t('caching_description')}
              </p>
            </div>
            <input
              type="checkbox"
              checked={globalState.config.enableCaching !== false}
              onChange={(e) => globalActions.updateConfig({
                ...globalState.config,
                enableCaching: e.currentTarget.checked
              })}
              class="w-4 h-4 text-blue-600 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-2"
            />
          </div>
        </div>
      </div>

      {/* Debugging Section */}
      <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 space-y-6">
        <div class="flex items-center gap-3 pb-4 border-b border-gray-200 dark:border-gray-700">
          <div class="w-8 h-8 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
            <svg class="w-4 h-4 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h4 class="text-lg font-semibold text-gray-900 dark:text-gray-100">{t('debugging')}</h4>
        </div>
        
        {/* Debug Mode */}
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <div>
              <label class="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('debug_mode')}
              </label>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                {t('debug_mode_description')}
              </p>
            </div>
            <input
              type="checkbox"
              checked={globalState.config.debugMode || false}
              onChange={(e) => globalActions.updateConfig({
                ...globalState.config,
                debugMode: e.currentTarget.checked
              })}
              class="w-4 h-4 text-blue-600 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-2"
            />
          </div>
        </div>

        {/* Verbose Logging */}
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <div>
              <label class="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('verbose_logging')}
              </label>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                {t('verbose_logging_description')}
              </p>
            </div>
            <input
              type="checkbox"
              checked={globalState.config.verboseLogging || false}
              onChange={(e) => globalActions.updateConfig({
                ...globalState.config,
                verboseLogging: e.currentTarget.checked
              })}
              class="w-4 h-4 text-blue-600 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-2"
            />
          </div>
        </div>

        {/* Debug Information */}
        <div class="space-y-3">
          <button 
            onClick={() => setShowDebugInfo(!showDebugInfo())}
            class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
          >
            {showDebugInfo() ? t('hide_debug_info') : t('show_debug_info')}
          </button>
          
          <Show when={showDebugInfo()}>
            <div class="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 space-y-4">
              <h5 class="text-sm font-medium text-gray-900 dark:text-gray-100">{t('system_information')}</h5>
              <div class="space-y-2">
                <div class="flex justify-between text-sm">
                  <span class="text-gray-600 dark:text-gray-400">{t('platform')}:</span>
                  <span class="text-gray-900 dark:text-gray-100">{navigator.platform}</span>
                </div>
                <div class="flex justify-between text-sm">
                  <span class="text-gray-600 dark:text-gray-400">{t('language')}:</span>
                  <span class="text-gray-900 dark:text-gray-100">{navigator.language}</span>
                </div>
                <div class="flex justify-between text-sm">
                  <span class="text-gray-600 dark:text-gray-400">{t('cpu_cores')}:</span>
                  <span class="text-gray-900 dark:text-gray-100">{navigator.hardwareConcurrency || 'Unknown'}</span>
                </div>
                <div class="flex justify-between text-sm">
                  <span class="text-gray-600 dark:text-gray-400">{t('viewport')}:</span>
                  <span class="text-gray-900 dark:text-gray-100">{window.innerWidth} × {window.innerHeight}</span>
                </div>
                <Show when={(performance as any).memory}>
                  <div class="flex justify-between text-sm">
                    <span class="text-gray-600 dark:text-gray-400">{t('memory_used')}:</span>
                    <span class="text-gray-900 dark:text-gray-100">
                      {formatBytes((performance as any).memory.usedJSHeapSize)}
                    </span>
                  </div>
                  <div class="flex justify-between text-sm">
                    <span class="text-gray-600 dark:text-gray-400">{t('memory_total')}:</span>
                    <span class="text-gray-900 dark:text-gray-100">
                      {formatBytes((performance as any).memory.totalJSHeapSize)}
                    </span>
                  </div>
                </Show>
              </div>
              
              <button 
                onClick={handleExportDebugInfo}
                class="w-full px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
              >
                {t('export_debug_info')}
              </button>
            </div>
          </Show>
        </div>
      </div>

      {/* Maintenance Section */}
      <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 space-y-6">
        <div class="flex items-center gap-3 pb-4 border-b border-gray-200 dark:border-gray-700">
          <div class="w-8 h-8 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg flex items-center justify-center">
            <svg class="w-4 h-4 text-cyan-600 dark:text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h4 class="text-lg font-semibold text-gray-900 dark:text-gray-100">{t('maintenance')}</h4>
        </div>
        
        {/* Clear Cache */}
        <div class="space-y-3">
          <button 
            onClick={handleClearCache}
            class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
          >
            {t('clear_cache')}
          </button>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            {t('clear_cache_description')}
          </p>
        </div>

        {/* Reset Layout */}
        <div class="space-y-3">
          <button 
            onClick={handleResetPanels}
            class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
          >
            {t('reset_layout')}
          </button>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            {t('reset_layout_description')}
          </p>
        </div>

        {/* Auto Save Interval */}
        <div class="space-y-3">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t('auto_save_interval')} ({t('minutes')})
          </label>
          <input
            type="number"
            min="0"
            max="60"
            value={globalState.config.autoSaveInterval || 5}
            onInput={(e) => globalActions.updateConfig({
              ...globalState.config,
              autoSaveInterval: parseInt(e.currentTarget.value) || 5
            })}
            class="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors duration-200"
          />
          <p class="text-sm text-gray-500 dark:text-gray-400">
            {t('auto_save_description')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdvancedSettings;