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
    { id: 'presets' as const, label: t('preset_management'), icon: '💾' },
    { id: 'algorithm' as const, label: t('algorithm_settings'), icon: '⚙️' },
    { id: 'ui' as const, label: t('ui_preferences'), icon: '🎨' },
    { id: 'advanced' as const, label: t('advanced_settings'), icon: '🔧' }
  ];

  return (
    <div class="h-full flex flex-col">
      <div class="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <h2 class="text-lg font-medium text-gray-900 dark:text-gray-100">{t('settings_title')}</h2>
        <div class="flex gap-2">
          <button 
            class="btn-secondary"
            onClick={handleImportConfig}
            title={t('import_configuration')}
          >
            📁 {t('import')}
          </button>
          <button 
            class="btn-secondary"
            onClick={handleExportConfig}
            title={t('export_configuration')}
          >
            📤 {t('export')}
          </button>
          <button 
            class="btn-secondary"
            onClick={handleResetDefaults}
            title={t('reset_to_defaults')}
          >
            🔄 {t('reset_defaults')}
          </button>
        </div>
      </div>

      <div class="flex-1 flex overflow-hidden">
        <div class="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
          <div class="p-4">
            <For each={settingsSections}>
              {(section) => (
                <button
                  class={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                    activeSection() === section.id 
                      ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100' 
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                  onClick={() => setActiveSection(section.id)}
                >
                  <span class="text-lg">{section.icon}</span>
                  <span class="font-medium">{section.label}</span>
                </button>
              )}
            </For>
          </div>
        </div>

        <div class="flex-1 overflow-y-auto">
          <Show when={activeSection() === 'presets'}>
            <PresetManager />
          </Show>
          
          <Show when={activeSection() === 'algorithm'}>
            <AlgorithmSettings />
          </Show>
          
          <Show when={activeSection() === 'ui'}>
            <UIPreferences />
          </Show>
          
          <Show when={activeSection() === 'advanced'}>
            <AdvancedSettings />
          </Show>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;