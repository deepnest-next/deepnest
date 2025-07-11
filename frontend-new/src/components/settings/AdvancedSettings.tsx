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
    <div class="advanced-settings">
      <div class="section-header">
        <h3>{t('advanced_settings')}</h3>
      </div>

      <div class="settings-sections">
        <div class="settings-section">
          <h4>{t('performance')}</h4>
          
          <div class="setting-group">
            <label class="setting-label">
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
              class="number-input"
            />
            <div class="setting-description">
              {t('worker_threads_description', { max: navigator.hardwareConcurrency || 8 })}
            </div>
          </div>

          <div class="setting-group">
            <label class="checkbox-setting">
              <input
                type="checkbox"
                checked={globalState.config.enableGPU || false}
                onChange={(e) => globalActions.updateConfig({
                  ...globalState.config,
                  enableGPU: e.currentTarget.checked
                })}
              />
              <span class="checkmark"></span>
              <span class="setting-label">{t('enable_gpu_acceleration')}</span>
            </label>
            <div class="setting-description">
              {t('gpu_acceleration_description')}
            </div>
          </div>

          <div class="setting-group">
            <label class="checkbox-setting">
              <input
                type="checkbox"
                checked={globalState.config.enableCaching !== false}
                onChange={(e) => globalActions.updateConfig({
                  ...globalState.config,
                  enableCaching: e.currentTarget.checked
                })}
              />
              <span class="checkmark"></span>
              <span class="setting-label">{t('enable_caching')}</span>
            </label>
            <div class="setting-description">
              {t('caching_description')}
            </div>
          </div>
        </div>

        <div class="settings-section">
          <h4>{t('debugging')}</h4>
          
          <div class="setting-group">
            <label class="checkbox-setting">
              <input
                type="checkbox"
                checked={globalState.config.debugMode || false}
                onChange={(e) => globalActions.updateConfig({
                  ...globalState.config,
                  debugMode: e.currentTarget.checked
                })}
              />
              <span class="checkmark"></span>
              <span class="setting-label">{t('debug_mode')}</span>
            </label>
            <div class="setting-description">
              {t('debug_mode_description')}
            </div>
          </div>

          <div class="setting-group">
            <label class="checkbox-setting">
              <input
                type="checkbox"
                checked={globalState.config.verboseLogging || false}
                onChange={(e) => globalActions.updateConfig({
                  ...globalState.config,
                  verboseLogging: e.currentTarget.checked
                })}
              />
              <span class="checkmark"></span>
              <span class="setting-label">{t('verbose_logging')}</span>
            </label>
            <div class="setting-description">
              {t('verbose_logging_description')}
            </div>
          </div>

          <div class="setting-group">
            <button 
              class="button secondary"
              onClick={() => setShowDebugInfo(!showDebugInfo())}
            >
              {showDebugInfo() ? t('hide_debug_info') : t('show_debug_info')}
            </button>
            
            <Show when={showDebugInfo()}>
              <div class="debug-info">
                <h5>{t('system_information')}</h5>
                <div class="debug-details">
                  <div class="debug-item">
                    <span class="debug-label">{t('platform')}:</span>
                    <span class="debug-value">{navigator.platform}</span>
                  </div>
                  <div class="debug-item">
                    <span class="debug-label">{t('language')}:</span>
                    <span class="debug-value">{navigator.language}</span>
                  </div>
                  <div class="debug-item">
                    <span class="debug-label">{t('cpu_cores')}:</span>
                    <span class="debug-value">{navigator.hardwareConcurrency || 'Unknown'}</span>
                  </div>
                  <div class="debug-item">
                    <span class="debug-label">{t('viewport')}:</span>
                    <span class="debug-value">{window.innerWidth} × {window.innerHeight}</span>
                  </div>
                  <Show when={(performance as any).memory}>
                    <div class="debug-item">
                      <span class="debug-label">{t('memory_used')}:</span>
                      <span class="debug-value">
                        {formatBytes((performance as any).memory.usedJSHeapSize)}
                      </span>
                    </div>
                    <div class="debug-item">
                      <span class="debug-label">{t('memory_total')}:</span>
                      <span class="debug-value">
                        {formatBytes((performance as any).memory.totalJSHeapSize)}
                      </span>
                    </div>
                  </Show>
                </div>
                
                <button 
                  class="button secondary"
                  onClick={handleExportDebugInfo}
                >
                  {t('export_debug_info')}
                </button>
              </div>
            </Show>
          </div>
        </div>

        <div class="settings-section">
          <h4>{t('maintenance')}</h4>
          
          <div class="setting-group">
            <button 
              class="button secondary"
              onClick={handleClearCache}
            >
              {t('clear_cache')}
            </button>
            <div class="setting-description">
              {t('clear_cache_description')}
            </div>
          </div>

          <div class="setting-group">
            <button 
              class="button secondary"
              onClick={handleResetPanels}
            >
              {t('reset_layout')}
            </button>
            <div class="setting-description">
              {t('reset_layout_description')}
            </div>
          </div>

          <div class="setting-group">
            <label class="setting-label">
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
              class="number-input"
            />
            <div class="setting-description">
              {t('auto_save_description')}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedSettings;