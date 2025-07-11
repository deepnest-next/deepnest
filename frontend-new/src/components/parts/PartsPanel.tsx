import { Component, Show, createMemo } from 'solid-js';
import { useTranslation } from '@/utils/i18n';
import { globalState, globalActions } from '@/stores/global.store';
import { ipcService } from '@/services/ipc.service';
import PartsList from './PartsList';

const PartsPanel: Component = () => {
  const [t] = useTranslation('parts');

  const partsCount = createMemo(() => globalState.app.parts.length);
  const totalQuantity = createMemo(() => 
    globalState.app.parts.reduce((sum, part) => sum + part.quantity, 0)
  );

  const handleImportParts = async () => {
    if (!ipcService.isAvailable) {
      console.warn('IPC not available');
      return;
    }

    try {
      const result = await ipcService.openFileDialog({
        title: t('import_parts'),
        filters: [
          { name: 'Vector Files', extensions: ['svg', 'dxf'] },
          { name: 'SVG Files', extensions: ['svg'] },
          { name: 'DXF Files', extensions: ['dxf'] },
          { name: 'All Files', extensions: ['*'] }
        ],
        properties: ['openFile', 'multiSelections']
      });

      if (result.canceled || !result.filePaths?.length) {
        return;
      }

      const importedParts = await ipcService.importParts(result.filePaths);
      globalActions.setParts([...globalState.app.parts, ...importedParts]);
    } catch (error) {
      console.error('Failed to import parts:', error);
      globalActions.setError(t('import_failed'));
    }
  };

  const handleExportSelected = async () => {
    const selectedParts = globalState.app.parts.filter(part => part.selected);
    if (selectedParts.length === 0) {
      globalActions.setError(t('no_parts_selected'));
      return;
    }

    try {
      const result = await ipcService.saveFileDialog({
        title: t('export_parts'),
        defaultPath: 'parts.svg',
        filters: [
          { name: 'SVG Files', extensions: ['svg'] },
          { name: 'DXF Files', extensions: ['dxf'] },
          { name: 'All Files', extensions: ['*'] }
        ]
      });

      if (result.canceled || !result.filePath) {
        return;
      }

      await ipcService.exportParts(selectedParts, result.filePath);
    } catch (error) {
      console.error('Failed to export parts:', error);
      globalActions.setError(t('export_failed'));
    }
  };

  const handleDeleteSelected = () => {
    const selectedParts = globalState.app.parts.filter(part => part.selected);
    if (selectedParts.length === 0) {
      globalActions.setError(t('no_parts_selected'));
      return;
    }

    const remainingParts = globalState.app.parts.filter(part => !part.selected);
    globalActions.setParts(remainingParts);
  };

  const handleSelectAll = () => {
    globalState.app.parts.forEach(part => {
      globalActions.updatePart(part.id, { selected: true });
    });
  };

  const handleDeselectAll = () => {
    globalState.app.parts.forEach(part => {
      globalActions.updatePart(part.id, { selected: false });
    });
  };

  return (
    <div class="parts-panel">
      <div class="panel-header">
        <h2>{t('parts_title')}</h2>
        <div class="panel-actions">
          <button 
            class="button secondary"
            onClick={handleImportParts}
            title={t('import_parts')}
          >
            📁 {t('import')}
          </button>
          <button 
            class="button secondary"
            onClick={handleExportSelected}
            title={t('export_selected')}
            disabled={globalState.app.parts.filter(p => p.selected).length === 0}
          >
            📤 {t('export')}
          </button>
          <button 
            class="button secondary"
            onClick={handleDeleteSelected}
            title={t('delete_selected')}
            disabled={globalState.app.parts.filter(p => p.selected).length === 0}
          >
            🗑️ {t('delete')}
          </button>
        </div>
      </div>

      <div class="parts-summary">
        <div class="summary-item">
          <span class="summary-label">{t('total_parts')}:</span>
          <span class="summary-value">{partsCount()}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">{t('total_quantity')}:</span>
          <span class="summary-value">{totalQuantity()}</span>
        </div>
        <div class="summary-actions">
          <button 
            class="button-link"
            onClick={handleSelectAll}
            disabled={partsCount() === 0}
          >
            {t('select_all')}
          </button>
          <span class="separator">|</span>
          <button 
            class="button-link"
            onClick={handleDeselectAll}
            disabled={partsCount() === 0}
          >
            {t('deselect_all')}
          </button>
        </div>
      </div>

      <div class="panel-content">
        <Show 
          when={partsCount() > 0}
          fallback={
            <div class="empty-state">
              <div class="empty-icon">📦</div>
              <h3>{t('no_parts_loaded')}</h3>
              <p>{t('import_parts_to_get_started')}</p>
              <button 
                class="button primary"
                onClick={handleImportParts}
              >
                {t('import_parts')}
              </button>
            </div>
          }
        >
          <PartsList />
        </Show>
      </div>
    </div>
  );
};

export default PartsPanel;