import { Component, Show, createSignal, For } from 'solid-js';
import { useTranslation } from '@/utils/i18n';
import { globalState, globalActions } from '@/stores/global.store';
import { ipcService } from '@/services/ipc.service';
import PresetManager from './PresetManager';
import AlgorithmSettings from './AlgorithmSettings';
import UIPreferences from './UIPreferences';
import AdvancedSettings from './AdvancedSettings';

const SettingsPanel: Component = () => {
  const [t] = useTranslation('settings');
  const [activeSection, setActiveSection] = createSignal<'presets' | 'algorithm' | 'ui' | 'advanced'>('presets');

  const handleResetDefaults = async () => {
    const confirmed = confirm(t('confirm_reset_defaults'));
    if (!confirmed) return;

    try {
      globalActions.resetToDefaults();
      if (ipcService.isAvailable) {
        await ipcService.saveConfig(globalState.config);
      }
    } catch (error) {
      console.error('Failed to reset to defaults:', error);
      globalActions.setError(t('reset_failed'));
    }
  };

  const handleExportConfig = async () => {
    if (!ipcService.isAvailable) return;

    try {
      const result = await ipcService.saveFileDialog({
        title: t('export_configuration'),
        defaultPath: 'deepnest-config.json',
        filters: [
          { name: 'JSON Files', extensions: ['json'] },
          { name: 'All Files', extensions: ['*'] }
        ]
      });

      if (result.canceled || !result.filePath) {
        return;
      }

      await ipcService.exportConfig(globalState.config, result.filePath);
    } catch (error) {
      console.error('Failed to export config:', error);
      globalActions.setError(t('export_failed'));
    }
  };

  const handleImportConfig = async () => {
    if (!ipcService.isAvailable) return;

    try {
      const result = await ipcService.openFileDialog({
        title: t('import_configuration'),
        filters: [
          { name: 'JSON Files', extensions: ['json'] },
          { name: 'All Files', extensions: ['*'] }
        ],
        properties: ['openFile']
      });

      if (result.canceled || !result.filePaths?.length) {
        return;
      }

      const config = await ipcService.importConfig(result.filePaths[0]);
      globalActions.updateConfig(config);
    } catch (error) {
      console.error('Failed to import config:', error);
      globalActions.setError(t('import_failed'));
    }
  };

  const settingsSections = [
    { 
      id: 'presets' as const, 
      label: t('preset_management'), 
      description: 'Save and manage configuration presets',
      icon: (
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12" />
        </svg>
      )
    },
    { 
      id: 'algorithm' as const, 
      label: t('algorithm_settings'), 
      description: 'Configure nesting algorithm parameters',
      icon: (
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
    },
    { 
      id: 'ui' as const, 
      label: t('ui_preferences'), 
      description: 'Customize interface and appearance',
      icon: (
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
        </svg>
      )
    },
    { 
      id: 'advanced' as const, 
      label: t('advanced_settings'), 
      description: 'Advanced configuration options',
      icon: (
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
        </svg>
      )
    }
  ];

  return (
    <div class="h-full flex flex-col bg-white dark:bg-gray-900">
      {/* Header */}
      <div class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div class="px-6 py-4 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center shadow-sm">
              <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
              </svg>
            </div>
            <div>
              <h1 class="text-xl font-semibold text-gray-900 dark:text-gray-100">{t('settings_title')}</h1>
              <p class="text-sm text-gray-500 dark:text-gray-400">Configure your preferences and application settings</p>
            </div>
          </div>
          
          <div class="flex items-center gap-3">
            <button 
              class="inline-flex items-center gap-2 px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
              onClick={handleImportConfig}
              title={t('import_configuration')}
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
              </svg>
              {t('import')}
            </button>
            
            <button 
              class="inline-flex items-center gap-2 px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
              onClick={handleExportConfig}
              title={t('export_configuration')}
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              {t('export')}
            </button>
            
            <button 
              class="inline-flex items-center gap-2 px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 font-medium rounded-lg border border-red-200 dark:border-red-800 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
              onClick={handleResetDefaults}
              title={t('reset_to_defaults')}
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {t('reset_defaults')}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div class="flex-1 flex overflow-hidden bg-gray-50 dark:bg-gray-900">
        {/* Sidebar Navigation */}
        <div class="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
          <div class="p-6">
            <h3 class="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
              Settings Categories
            </h3>
            <nav class="space-y-2">
              <For each={settingsSections}>
                {(section) => (
                  <button
                    class={`w-full flex items-start gap-4 px-4 py-3 rounded-xl text-left transition-all duration-200 group ${
                      activeSection() === section.id 
                        ? 'bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-200 dark:border-blue-700 shadow-sm' 
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700/50 border-2 border-transparent'
                    }`}
                    onClick={() => setActiveSection(section.id)}
                  >
                    <div class={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors duration-200 ${
                      activeSection() === section.id
                        ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 group-hover:bg-gray-200 dark:group-hover:bg-gray-600'
                    }`}>
                      {section.icon}
                    </div>
                    <div class="flex-1 min-w-0">
                      <div class={`font-medium transition-colors duration-200 ${
                        activeSection() === section.id
                          ? 'text-blue-900 dark:text-blue-100'
                          : 'text-gray-900 dark:text-gray-100 group-hover:text-gray-900 dark:group-hover:text-gray-100'
                      }`}>
                        {section.label}
                      </div>
                      <div class={`text-sm mt-1 transition-colors duration-200 ${
                        activeSection() === section.id
                          ? 'text-blue-700 dark:text-blue-300'
                          : 'text-gray-500 dark:text-gray-400'
                      }`}>
                        {section.description}
                      </div>
                    </div>
                    {activeSection() === section.id && (
                      <div class="w-1 h-8 bg-blue-500 dark:bg-blue-400 rounded-full flex-shrink-0" />
                    )}
                  </button>
                )}
              </For>
            </nav>
          </div>
        </div>

        {/* Settings Content */}
        <div class="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900">
          <div class="p-6">
            <Show when={activeSection() === 'presets'}>
              <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <div class="p-6 border-b border-gray-200 dark:border-gray-700">
                  <div class="flex items-center gap-3">
                    <div class="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                      <svg class="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    </div>
                    <div>
                      <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100">{t('preset_management')}</h2>
                      <p class="text-sm text-gray-500 dark:text-gray-400">Save and manage configuration presets</p>
                    </div>
                  </div>
                </div>
                <div class="p-6">
                  <PresetManager />
                </div>
              </div>
            </Show>
            
            <Show when={activeSection() === 'algorithm'}>
              <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <div class="p-6 border-b border-gray-200 dark:border-gray-700">
                  <div class="flex items-center gap-3">
                    <div class="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                      <svg class="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div>
                      <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100">{t('algorithm_settings')}</h2>
                      <p class="text-sm text-gray-500 dark:text-gray-400">Configure nesting algorithm parameters</p>
                    </div>
                  </div>
                </div>
                <div class="p-6">
                  <AlgorithmSettings />
                </div>
              </div>
            </Show>
            
            <Show when={activeSection() === 'ui'}>
              <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <div class="p-6 border-b border-gray-200 dark:border-gray-700">
                  <div class="flex items-center gap-3">
                    <div class="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                      <svg class="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
                      </svg>
                    </div>
                    <div>
                      <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100">{t('ui_preferences')}</h2>
                      <p class="text-sm text-gray-500 dark:text-gray-400">Customize interface and appearance</p>
                    </div>
                  </div>
                </div>
                <div class="p-6">
                  <UIPreferences />
                </div>
              </div>
            </Show>
            
            <Show when={activeSection() === 'advanced'}>
              <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <div class="p-6 border-b border-gray-200 dark:border-gray-700">
                  <div class="flex items-center gap-3">
                    <div class="w-8 h-8 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                      <svg class="w-4 h-4 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                      </svg>
                    </div>
                    <div>
                      <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100">{t('advanced_settings')}</h2>
                      <p class="text-sm text-gray-500 dark:text-gray-400">Advanced configuration options</p>
                    </div>
                  </div>
                </div>
                <div class="p-6">
                  <AdvancedSettings />
                </div>
              </div>
            </Show>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;