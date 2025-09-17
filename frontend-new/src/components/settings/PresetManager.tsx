import { Component, createSignal, Show, For } from 'solid-js';
import { useTranslation } from '@/utils/i18n';
import { globalState, globalActions } from '@/stores/global.store';
import { ipcService } from '@/services/ipc.service';
import type { ConfigPreset } from '@/types/app.types';

const PresetManager: Component = () => {
  const [t] = useTranslation('settings');
  const [showCreateForm, setShowCreateForm] = createSignal(false);
  const [presetName, setPresetName] = createSignal('');
  const [presetDescription, setPresetDescription] = createSignal('');
  const [selectedPreset, setSelectedPreset] = createSignal<string>('');

  const handleCreatePreset = async () => {
    const name = presetName().trim();
    if (!name) {
      globalActions.setError(t('preset_name_required'));
      return;
    }

    try {
      const preset: ConfigPreset = {
        id: `preset_${Date.now()}`,
        name,
        description: presetDescription().trim(),
        config: { ...globalState.config },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      globalActions.addPreset(preset);
      
      if (ipcService.isAvailable) {
        await ipcService.savePreset(preset);
      }

      // Reset form
      setPresetName('');
      setPresetDescription('');
      setShowCreateForm(false);
    } catch (error) {
      console.error('Failed to create preset:', error);
      globalActions.setError(t('preset_create_failed'));
    }
  };

  const handleLoadPreset = async (presetId: string) => {
    const preset = Object.values(globalState.app.presets || {}).find(p => p.id === presetId);
    if (!preset) return;

    try {
      globalActions.updateConfig(preset.config);
      if (ipcService.isAvailable) {
        await ipcService.saveConfig(preset.config);
      }
      setSelectedPreset(presetId);
    } catch (error) {
      console.error('Failed to load preset:', error);
      globalActions.setError(t('preset_load_failed'));
    }
  };

  const handleDeletePreset = async (presetId: string) => {
    const preset = Object.values(globalState.app.presets || {}).find(p => p.id === presetId);
    if (!preset) return;

    const confirmed = confirm(t('confirm_delete_preset', { name: preset.name }));
    if (!confirmed) return;

    try {
      globalActions.removePreset(presetId);
      
      if (ipcService.isAvailable) {
        await ipcService.deletePreset(presetId);
      }

      if (selectedPreset() === presetId) {
        setSelectedPreset('');
      }
    } catch (error) {
      console.error('Failed to delete preset:', error);
      globalActions.setError(t('preset_delete_failed'));
    }
  };

  const handleExportPreset = async (presetId: string) => {
    const preset = Object.values(globalState.app.presets || {}).find(p => p.id === presetId);
    if (!preset || !ipcService.isAvailable) return;

    try {
      const result = await ipcService.saveFileDialog({
        title: t('export_preset'),
        defaultPath: `${preset.name}.json`,
        filters: [
          { name: 'JSON Files', extensions: ['json'] },
          { name: 'All Files', extensions: ['*'] }
        ]
      });

      if (result.canceled || !result.filePath) {
        return;
      }

      await ipcService.exportPreset(preset, result.filePath);
    } catch (error) {
      console.error('Failed to export preset:', error);
      globalActions.setError(t('preset_export_failed'));
    }
  };

  const handleImportPreset = async () => {
    if (!ipcService.isAvailable) return;

    try {
      const result = await ipcService.openFileDialog({
        title: t('import_preset'),
        filters: [
          { name: 'JSON Files', extensions: ['json'] },
          { name: 'All Files', extensions: ['*'] }
        ],
        properties: ['openFile', 'multiSelections']
      });

      if (result.canceled || !result.filePaths?.length) {
        return;
      }

      for (const filePath of result.filePaths) {
        const preset = await ipcService.importPreset(filePath);
        globalActions.addPreset({
          ...preset,
          id: `preset_${Date.now()}_${Math.random()}`,
          updatedAt: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Failed to import preset:', error);
      globalActions.setError(t('preset_import_failed'));
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div class="space-y-6">
      {/* Preset Management Section */}
      <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 space-y-6">
        <div class="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-700">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 bg-violet-100 dark:bg-violet-900/30 rounded-lg flex items-center justify-center">
              <svg class="w-4 h-4 text-violet-600 dark:text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">{t('preset_management')}</h3>
          </div>
          <div class="flex gap-3">
            <button 
              onClick={handleImportPreset}
              title={t('import_preset')}
              class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
              </svg>
              {t('import')}
            </button>
            <button 
              onClick={() => setShowCreateForm(true)}
              title={t('create_new_preset')}
              class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 border border-transparent rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              {t('create_preset')}
            </button>
          </div>
        </div>

        <p class="text-sm text-gray-500 dark:text-gray-400">
          {t('preset_description')}
        </p>

        <Show when={showCreateForm()}>
          <div class="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-6 space-y-4">
            <h4 class="text-lg font-medium text-gray-900 dark:text-gray-100">{t('create_new_preset')}</h4>
            
            <div class="space-y-3">
              <label for="preset-name" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('preset_name')}
              </label>
              <input
                id="preset-name"
                type="text"
                value={presetName()}
                onInput={(e) => setPresetName(e.currentTarget.value)}
                placeholder={t('enter_preset_name')}
                class="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors duration-200"
              />
            </div>

            <div class="space-y-3">
              <label for="preset-description" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('preset_description_optional')}
              </label>
              <textarea
                id="preset-description"
                value={presetDescription()}
                onInput={(e) => setPresetDescription(e.currentTarget.value)}
                placeholder={t('enter_preset_description')}
                rows="3"
                class="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors duration-200"
              />
            </div>

            <div class="flex gap-3 pt-2">
              <button 
                onClick={() => {
                  setShowCreateForm(false);
                  setPresetName('');
                  setPresetDescription('');
                }}
                class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
              >
                {t('cancel')}
              </button>
              <button 
                onClick={handleCreatePreset}
                disabled={!presetName().trim()}
                class="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed border border-transparent rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
              >
                {t('create_preset')}
              </button>
            </div>
          </div>
        </Show>

        <div class="space-y-4">
          <Show 
            when={globalState.app.presets && Object.keys(globalState.app.presets).length > 0}
            fallback={
              <div class="text-center py-12">
                <div class="mx-auto w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                  <svg class="w-8 h-8 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                  </svg>
                </div>
                <h4 class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">{t('no_presets_available')}</h4>
                <p class="text-sm text-gray-500 dark:text-gray-400">{t('create_preset_to_get_started')}</p>
              </div>
            }
          >
            <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <For each={Object.values(globalState.app.presets || {})}>
                {(preset) => (
                  <div class={`bg-white dark:bg-gray-700 rounded-lg border-2 transition-all duration-200 ${
                    selectedPreset() === preset.id 
                      ? 'border-blue-500 ring-2 ring-blue-500/20' 
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}>
                    <div class="p-4">
                      <div class="flex items-center justify-between mb-3">
                        <h4 class="text-base font-medium text-gray-900 dark:text-gray-100 truncate">{preset.name}</h4>
                        <div class="flex gap-1">
                          <button 
                            onClick={() => handleExportPreset(preset.id)}
                            title={t('export_preset')}
                            class="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200"
                          >
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                          </button>
                          <button 
                            onClick={() => handleDeletePreset(preset.id)}
                            title={t('delete_preset')}
                            class="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-200"
                          >
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>

                      <Show when={preset.description}>
                        <p class="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">{preset.description}</p>
                      </Show>

                      <div class="space-y-1 mb-4">
                        <div class="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                          <span>{t('created')}:</span>
                          <span>{formatDate(preset.createdAt)}</span>
                        </div>
                        <Show when={preset.updatedAt !== preset.createdAt}>
                          <div class="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                            <span>{t('updated')}:</span>
                            <span>{formatDate(preset.updatedAt)}</span>
                          </div>
                        </Show>
                      </div>

                      <button 
                        onClick={() => handleLoadPreset(preset.id)}
                        disabled={selectedPreset() === preset.id}
                        class={`w-full px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-700 ${
                          selectedPreset() === preset.id
                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 cursor-default'
                            : 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500'
                        }`}
                      >
                        {selectedPreset() === preset.id ? t('active') : t('load_preset')}
                      </button>
                    </div>
                  </div>
                )}
              </For>
            </div>
          </Show>
        </div>
      </div>
    </div>
  );
};

export default PresetManager;