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

  const selectedPartsCount = createMemo(() => 
    globalState.app.parts.filter(part => part.selected).length
  );

  const totalArea = createMemo(() => 
    globalState.app.parts.reduce((sum, part) => sum + (part.area || 0), 0)
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
    <div class="h-full flex flex-col bg-white dark:bg-gray-900">
      {/* Header with Actions */}
      <div class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div class="px-6 py-4 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-sm">
              <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div>
              <h1 class="text-xl font-semibold text-gray-900 dark:text-gray-100">{t('parts_title')}</h1>
              <p class="text-sm text-gray-500 dark:text-gray-400">Manage your parts and import new ones</p>
            </div>
          </div>
          
          <div class="flex items-center gap-3">
            <button 
              class="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
              onClick={handleImportParts}
              title={t('import_parts')}
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              {t('import')}
            </button>
            
            <div class="flex items-center gap-2">
              <button 
                class="inline-flex items-center gap-2 px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 font-medium rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                onClick={handleExportSelected}
                title={t('export_selected')}
                disabled={globalState.app.parts.filter(p => p.selected).length === 0}
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {t('export')}
              </button>
              
              <button 
                class="inline-flex items-center gap-2 px-3 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 font-medium rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                onClick={handleDeleteSelected}
                title={t('delete_selected')}
                disabled={globalState.app.parts.filter(p => p.selected).length === 0}
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                {t('delete')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div class="bg-gray-50 dark:bg-gray-800/50 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Total Parts Card */}
          <div class="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <svg class="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <div>
                <p class="text-sm font-medium text-gray-600 dark:text-gray-400">{t('total_parts')}</p>
                <p class="text-2xl font-bold text-gray-900 dark:text-gray-100">{partsCount()}</p>
              </div>
            </div>
          </div>

          {/* Total Quantity Card */}
          <div class="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <svg class="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                </svg>
              </div>
              <div>
                <p class="text-sm font-medium text-gray-600 dark:text-gray-400">{t('total_quantity')}</p>
                <p class="text-2xl font-bold text-gray-900 dark:text-gray-100">{totalQuantity()}</p>
              </div>
            </div>
          </div>

          {/* Selected Parts Card */}
          <div class="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                <svg class="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Selected</p>
                <p class="text-2xl font-bold text-gray-900 dark:text-gray-100">{selectedPartsCount()}</p>
              </div>
            </div>
          </div>

          {/* Total Area Card */}
          <div class="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                <svg class="w-5 h-5 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                </svg>
              </div>
              <div>
                <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Total Area</p>
                <p class="text-2xl font-bold text-gray-900 dark:text-gray-100">{Math.round(totalArea())}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div class="bg-white dark:bg-gray-800 px-6 py-3 border-b border-gray-200 dark:border-gray-700">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-4">
            <span class="text-sm text-gray-600 dark:text-gray-400">Bulk Actions:</span>
            <div class="flex items-center gap-2">
              <button 
                class="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleSelectAll}
                disabled={partsCount() === 0}
              >
                {t('select_all')}
              </button>
              <span class="text-gray-300 dark:text-gray-600">•</span>
              <button 
                class="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleDeselectAll}
                disabled={partsCount() === 0}
              >
                {t('deselect_all')}
              </button>
            </div>
          </div>
          
          <Show when={selectedPartsCount() > 0}>
            <div class="flex items-center gap-2 px-3 py-1 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <svg class="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span class="text-sm text-blue-700 dark:text-blue-300 font-medium">
                {selectedPartsCount()} part{selectedPartsCount() === 1 ? '' : 's'} selected
              </span>
            </div>
          </Show>
        </div>
      </div>

      {/* Content Area */}
      <div class="flex-1 overflow-hidden bg-gray-50 dark:bg-gray-900">
        <Show 
          when={partsCount() > 0}
          fallback={
            <div class="h-full flex flex-col items-center justify-center text-center gap-6 p-8">
              <div class="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                <svg class="w-12 h-12 text-gray-400 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              
              <div class="max-w-sm space-y-3">
                <h3 class="text-xl font-semibold text-gray-900 dark:text-gray-100">{t('no_parts_loaded')}</h3>
                <p class="text-gray-600 dark:text-gray-400 leading-relaxed">
                  {t('import_parts_to_get_started')}
                </p>
              </div>
              
              <div class="flex flex-col sm:flex-row gap-3">
                <button 
                  class="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
                  onClick={handleImportParts}
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  {t('import_parts')}
                </button>
                
                <button class="inline-flex items-center gap-2 px-6 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 font-medium rounded-lg border border-gray-300 dark:border-gray-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Learn More
                </button>
              </div>
              
              <div class="text-xs text-gray-500 dark:text-gray-600 max-w-md">
                <p>Supported formats: SVG, DXF • Drag and drop files here</p>
              </div>
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