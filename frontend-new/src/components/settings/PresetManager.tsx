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
    <div class="preset-manager">
      <div class="section-header">
        <h3>{t('preset_management')}</h3>
        <div class="header-actions">
          <button 
            class="button secondary"
            onClick={handleImportPreset}
            title={t('import_preset')}
          >
            📁 {t('import')}
          </button>
          <button 
            class="button primary"
            onClick={() => setShowCreateForm(true)}
            title={t('create_new_preset')}
          >
            ➕ {t('create_preset')}
          </button>
        </div>
      </div>

      <div class="preset-description">
        <p>{t('preset_description')}</p>
      </div>

      <Show when={showCreateForm()}>
        <div class="create-preset-form">
          <h4>{t('create_new_preset')}</h4>
          
          <div class="form-group">
            <label for="preset-name">{t('preset_name')}:</label>
            <input
              id="preset-name"
              type="text"
              value={presetName()}
              onInput={(e) => setPresetName(e.currentTarget.value)}
              placeholder={t('enter_preset_name')}
              class="form-input"
            />
          </div>

          <div class="form-group">
            <label for="preset-description">{t('preset_description_optional')}:</label>
            <textarea
              id="preset-description"
              value={presetDescription()}
              onInput={(e) => setPresetDescription(e.currentTarget.value)}
              placeholder={t('enter_preset_description')}
              class="form-textarea"
              rows="3"
            />
          </div>

          <div class="form-actions">
            <button 
              class="button secondary"
              onClick={() => {
                setShowCreateForm(false);
                setPresetName('');
                setPresetDescription('');
              }}
            >
              {t('cancel')}
            </button>
            <button 
              class="button primary"
              onClick={handleCreatePreset}
              disabled={!presetName().trim()}
            >
              {t('create_preset')}
            </button>
          </div>
        </div>
      </Show>

      <div class="presets-list">
        <Show 
          when={globalState.app.presets && Object.keys(globalState.app.presets).length > 0}
          fallback={
            <div class="empty-state">
              <div class="empty-icon">💾</div>
              <h4>{t('no_presets_available')}</h4>
              <p>{t('create_preset_to_get_started')}</p>
            </div>
          }
        >
          <div class="presets-grid">
            <For each={Object.values(globalState.app.presets || {})}>
              {(preset) => (
                <div class={`preset-card ${selectedPreset() === preset.id ? 'active' : ''}`}>
                  <div class="preset-header">
                    <h4 class="preset-name">{preset.name}</h4>
                    <div class="preset-actions">
                      <button 
                        class="action-button"
                        onClick={() => handleExportPreset(preset.id)}
                        title={t('export_preset')}
                      >
                        📤
                      </button>
                      <button 
                        class="action-button danger"
                        onClick={() => handleDeletePreset(preset.id)}
                        title={t('delete_preset')}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>

                  <Show when={preset.description}>
                    <p class="preset-description">{preset.description}</p>
                  </Show>

                  <div class="preset-meta">
                    <div class="meta-item">
                      <span class="meta-label">{t('created')}:</span>
                      <span class="meta-value">{formatDate(preset.createdAt)}</span>
                    </div>
                    <Show when={preset.updatedAt !== preset.createdAt}>
                      <div class="meta-item">
                        <span class="meta-label">{t('updated')}:</span>
                        <span class="meta-value">{formatDate(preset.updatedAt)}</span>
                      </div>
                    </Show>
                  </div>

                  <div class="preset-footer">
                    <button 
                      class="button primary"
                      onClick={() => handleLoadPreset(preset.id)}
                      disabled={selectedPreset() === preset.id}
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
  );
};

export default PresetManager;