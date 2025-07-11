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
    <div class="settings-panel">
      <div class="panel-header">
        <h2>{t('settings_title')}</h2>
        <div class="panel-actions">
          <button 
            class="button secondary"
            onClick={handleImportConfig}
            title={t('import_configuration')}
          >
            📁 {t('import')}
          </button>
          <button 
            class="button secondary"
            onClick={handleExportConfig}
            title={t('export_configuration')}
          >
            📤 {t('export')}
          </button>
          <button 
            class="button secondary"
            onClick={handleResetDefaults}
            title={t('reset_to_defaults')}
          >
            🔄 {t('reset_defaults')}
          </button>
        </div>
      </div>

      <div class="settings-layout">
        <div class="settings-sidebar">
          <div class="settings-nav">
            <For each={settingsSections}>
              {(section) => (
                <button
                  class={`settings-nav-item ${activeSection() === section.id ? 'active' : ''}`}
                  onClick={() => setActiveSection(section.id)}
                >
                  <span class="nav-icon">{section.icon}</span>
                  <span class="nav-label">{section.label}</span>
                </button>
              )}
            </For>
          </div>
        </div>

        <div class="settings-content">
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