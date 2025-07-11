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
    <div class="h-full flex flex-col">
      <div class="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <h2 class="text-lg font-medium text-gray-900 dark:text-gray-100">{t('parts_title')}</h2>
        <div class="flex gap-2">
          <button 
            class="btn-secondary"
            onClick={handleImportParts}
            title={t('import_parts')}
          >
            📁 {t('import')}
          </button>
          <button 
            class="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleExportSelected}
            title={t('export_selected')}
            disabled={globalState.app.parts.filter(p => p.selected).length === 0}
          >
            📤 {t('export')}
          </button>
          <button 
            class="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleDeleteSelected}
            title={t('delete_selected')}
            disabled={globalState.app.parts.filter(p => p.selected).length === 0}
          >
            🗑️ {t('delete')}
          </button>
        </div>
      </div>

      <div class="flex items-center justify-between p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div class="flex gap-6">
          <div class="flex items-center gap-2">
            <span class="text-sm text-gray-600 dark:text-gray-400">{t('total_parts')}:</span>
            <span class="text-sm font-medium text-gray-900 dark:text-gray-100">{partsCount()}</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-sm text-gray-600 dark:text-gray-400">{t('total_quantity')}:</span>
            <span class="text-sm font-medium text-gray-900 dark:text-gray-100">{totalQuantity()}</span>
          </div>
        </div>
        <div class="flex items-center gap-2 text-sm">
          <button 
            class="text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleSelectAll}
            disabled={partsCount() === 0}
          >
            {t('select_all')}
          </button>
          <span class="text-gray-600 dark:text-gray-400">|</span>
          <button 
            class="text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleDeselectAll}
            disabled={partsCount() === 0}
          >
            {t('deselect_all')}
          </button>
        </div>
      </div>

      <div class="flex-1 overflow-hidden">
        <Show 
          when={partsCount() > 0}
          fallback={
            <div class="h-full flex flex-col items-center justify-center text-center gap-4 p-8">
              <div class="text-6xl opacity-30">📦</div>
              <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100">{t('no_parts_loaded')}</h3>
              <p class="text-gray-600 dark:text-gray-400">{t('import_parts_to_get_started')}</p>
              <button 
                class="btn-primary"
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