import { Component, Show, For, createSignal, createMemo } from 'solid-js';
import { useTranslation } from '@/utils/i18n';
import { globalState, globalActions } from '@/stores/global.store';
import type { Sheet } from '@/types/app.types';
import SheetConfig from './SheetConfig';

const SheetsPanel: Component = () => {
  const [t] = useTranslation('sheets');
  const [showAddSheet, setShowAddSheet] = createSignal(false);
  const [editingSheet, setEditingSheet] = createSignal<Sheet | null>(null);

  const sheetsCount = createMemo(() => globalState.app.sheets.length);
  const totalArea = createMemo(() => 
    globalState.app.sheets.reduce((sum, sheet) => sum + (sheet.width * sheet.height), 0)
  );

  const sheetTemplates = [
    { name: 'A4', width: 210, height: 297, units: 'mm' },
    { name: 'A3', width: 297, height: 420, units: 'mm' },
    { name: 'A2', width: 420, height: 594, units: 'mm' },
    { name: 'A1', width: 594, height: 841, units: 'mm' },
    { name: 'Letter', width: 216, height: 279, units: 'mm' },
    { name: 'Legal', width: 216, height: 356, units: 'mm' },
    { name: '12x12"', width: 305, height: 305, units: 'mm' },
    { name: '24x24"', width: 610, height: 610, units: 'mm' },
    { name: '48x24"', width: 1219, height: 610, units: 'mm' }
  ];

  const handleAddSheet = () => {
    setEditingSheet(null);
    setShowAddSheet(true);
  };

  const handleEditSheet = (sheet: Sheet) => {
    setEditingSheet(sheet);
    setShowAddSheet(true);
  };

  const handleDeleteSheet = (sheetId: string) => {
    const remainingSheets = globalState.app.sheets.filter(s => s.id !== sheetId);
    globalActions.setSheets(remainingSheets);
  };

  const handleSheetSave = (sheet: Sheet) => {
    if (editingSheet()) {
      globalActions.updateSheet(sheet.id, sheet);
    } else {
      globalActions.addSheet(sheet);
    }
    setShowAddSheet(false);
    setEditingSheet(null);
  };

  const handleCancel = () => {
    setShowAddSheet(false);
    setEditingSheet(null);
  };

  const handleAddTemplate = (template: typeof sheetTemplates[0]) => {
    const newSheet: Omit<Sheet, 'id'> = {
      name: template.name,
      width: template.width,
      height: template.height,
      thickness: 3,
      quantity: 1,
      margin: 5,
      material: 'Generic'
    };
    globalActions.addSheet(newSheet);
  };

  const formatDimensions = (sheet: Sheet) => {
    return `${sheet.width} × ${sheet.height} mm`;
  };

  return (
    <div class="h-full flex flex-col">
      <div class="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <h2 class="text-lg font-medium text-gray-900 dark:text-gray-100">{t('sheets_title')}</h2>
        <div class="flex gap-2">
          <button 
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
            onClick={handleAddSheet}
            title={t('add_sheet')}
          >
            ➕ {t('add_sheet')}
          </button>
        </div>
      </div>

      <div class="flex items-center justify-between p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div class="flex gap-6">
          <div class="flex items-center gap-2">
            <span class="text-sm text-gray-600 dark:text-gray-400">{t('total_sheets')}:</span>
            <span class="text-sm font-medium text-gray-900 dark:text-gray-100">{sheetsCount()}</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-sm text-gray-600 dark:text-gray-400">{t('total_area')}:</span>
            <span class="text-sm font-medium text-gray-900 dark:text-gray-100">{totalArea().toFixed(0)} mm²</span>
          </div>
        </div>
      </div>

      <Show when={showAddSheet()}>
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div class="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 class="text-xl font-semibold text-gray-900 dark:text-gray-100">{editingSheet() ? t('edit_sheet') : t('add_new_sheet')}</h3>
              <button class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-2xl leading-none" onClick={handleCancel}>×</button>
            </div>
            <SheetConfig
              sheet={editingSheet()}
              onSave={handleSheetSave}
              onCancel={handleCancel}
            />
          </div>
        </div>
      </Show>

      <div class="flex-1 overflow-hidden">
        <Show 
          when={sheetsCount() > 0}
          fallback={
            <div class="h-full flex flex-col items-center justify-center text-center gap-6 p-8">
              <div class="text-6xl opacity-30">📄</div>
              <div>
                <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">{t('no_sheets_loaded')}</h3>
                <p class="text-gray-600 dark:text-gray-400">{t('add_sheets_to_get_started')}</p>
              </div>
              
              <div class="w-full max-w-2xl">
                <h4 class="text-md font-medium text-gray-900 dark:text-gray-100 mb-4">{t('quick_templates')}</h4>
                <div class="grid grid-cols-3 gap-3">
                  <For each={sheetTemplates}>
                    {(template) => (
                      <button 
                        class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-center"
                        onClick={() => handleAddTemplate(template)}
                        title={`${template.width} × ${template.height} ${template.units}`}
                      >
                        <div class="font-medium text-gray-900 dark:text-gray-100 mb-1">{template.name}</div>
                        <div class="text-sm text-gray-600 dark:text-gray-400">
                          {template.width} × {template.height}
                        </div>
                      </button>
                    )}
                  </For>
                </div>
              </div>
            </div>
          }
        >
          <div class="h-full flex flex-col">
            <div class="p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100">{t('configured_sheets')}</h3>
            </div>
            
            <div class="flex-1 overflow-y-auto p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <For each={globalState.app.sheets}>
                {(sheet, index) => (
                  <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-shadow duration-200">
                    <div class="h-32 bg-gray-50 dark:bg-gray-700 flex items-center justify-center p-4">
                      <div class="relative">
                        <div 
                          class="bg-white dark:bg-gray-600 border-2 border-gray-300 dark:border-gray-500 rounded shadow-sm"
                          style={{
                            'aspect-ratio': `${sheet.width} / ${sheet.height}`,
                            'max-width': '80px',
                            'max-height': '80px',
                            'min-width': '40px',
                            'min-height': '40px'
                          }}
                        >
                          <div class="absolute inset-1 border border-dashed border-gray-400 dark:border-gray-400 rounded-sm" />
                        </div>
                      </div>
                    </div>

                    <div class="p-4">
                      <div class="font-medium text-gray-900 dark:text-gray-100 mb-3">
                        {sheet.name || `${t('sheet')} ${index() + 1}`}
                      </div>
                      
                      <div class="space-y-2 mb-4">
                        <div class="flex justify-between text-sm">
                          <span class="text-gray-600 dark:text-gray-400">{t('dimensions')}:</span>
                          <span class="font-medium text-gray-900 dark:text-gray-100">{formatDimensions(sheet)}</span>
                        </div>
                        <div class="flex justify-between text-sm">
                          <span class="text-gray-600 dark:text-gray-400">{t('quantity')}:</span>
                          <span class="font-medium text-gray-900 dark:text-gray-100">{sheet.quantity}</span>
                        </div>
                        <div class="flex justify-between text-sm">
                          <span class="text-gray-600 dark:text-gray-400">{t('material')}:</span>
                          <span class="font-medium text-gray-900 dark:text-gray-100">{sheet.material || 'Generic'}</span>
                        </div>
                        <Show when={sheet.margin}>
                          <div class="flex justify-between text-sm">
                            <span class="text-gray-600 dark:text-gray-400">{t('margin')}:</span>
                            <span class="font-medium text-gray-900 dark:text-gray-100">{sheet.margin} mm</span>
                          </div>
                        </Show>
                      </div>

                      <div class="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-gray-700">
                        <button 
                          class="text-blue-600 dark:text-blue-400 hover:underline text-sm"
                          onClick={() => handleEditSheet(sheet)}
                        >
                          {t('edit')}
                        </button>
                        <button 
                          class="text-red-600 dark:text-red-400 hover:underline text-sm"
                          onClick={() => handleDeleteSheet(sheet.id)}
                        >
                          {t('delete')}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </For>
            </div>
          </div>
        </Show>
      </div>
    </div>
  );
};

export default SheetsPanel;