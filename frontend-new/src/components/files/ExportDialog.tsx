import { Component, createSignal, Show, For } from 'solid-js';
import { useTranslation } from '@/utils/i18n';
import { globalState, globalActions } from '@/stores/global.store';

interface ExportOption {
  format: 'svg' | 'dxf' | 'pdf' | 'json';
  label: string;
  description: string;
  extension: string;
}

interface ExportSettings {
  format: string;
  includeSheet: boolean;
  includeLabels: boolean;
  optimizePaths: boolean;
  mergeLines: boolean;
  scale: number;
  units: 'mm' | 'in' | 'cm';
  exportType: 'all' | 'selected' | 'current';
}

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onExport?: (settings: ExportSettings) => void;
}

const ExportDialog: Component<ExportDialogProps> = (props) => {
  const [t] = useTranslation('files');
  
  const [settings, setSettings] = createSignal<ExportSettings>({
    format: 'svg',
    includeSheet: true,
    includeLabels: false,
    optimizePaths: true,
    mergeLines: false,
    scale: 1.0,
    units: 'mm',
    exportType: 'all'
  });

  const exportOptions: ExportOption[] = [
    {
      format: 'svg',
      label: t('svg_format'),
      description: 'Scalable Vector Graphics - ideal for laser cutters',
      extension: '.svg'
    },
    {
      format: 'dxf',
      label: t('dxf_format'),
      description: 'AutoCAD Drawing Exchange Format - for CAD software',
      extension: '.dxf'
    },
    {
      format: 'pdf',
      label: t('pdf_format'),
      description: 'Portable Document Format - for printing and sharing',
      extension: '.pdf'
    },
    {
      format: 'json',
      label: t('json_format'),
      description: 'JSON data format - for importing back into DeepNest',
      extension: '.json'
    }
  ];

  const unitOptions = [
    { value: 'mm', label: t('millimeters') },
    { value: 'in', label: t('inches') },
    { value: 'cm', label: t('centimeters') }
  ];

  const exportTypeOptions = [
    { value: 'all', label: t('export_all'), description: 'Export all nesting results' },
    { value: 'selected', label: t('export_selected'), description: 'Export selected results only' },
    { value: 'current', label: t('export_current'), description: 'Export currently viewed result' }
  ];

  const updateSetting = <K extends keyof ExportSettings>(key: K, value: ExportSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleExport = async () => {
    try {
      const exportSettings = settings();
      
      // Validate settings
      if (!exportSettings.format) {
        globalActions.setError('Please select an export format');
        return;
      }

      if (exportSettings.scale <= 0) {
        globalActions.setError('Export scale must be greater than 0');
        return;
      }

      // Call the export callback
      props.onExport?.(exportSettings);
      
      globalActions.setMessage(t('export_success'));
      props.onClose();
      
    } catch (error) {
      console.error('Export failed:', error);
      globalActions.setError(t('export_failed'));
    }
  };

  const getSelectedOption = () => {
    return exportOptions.find(opt => opt.format === settings().format);
  };

  if (!props.isOpen) return null;

  return (
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={props.onClose}>
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div class="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100">{t('export_options')}</h2>
          <button class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-2xl leading-none" onClick={props.onClose}>×</button>
        </div>

        <div class="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div class="space-y-6">
            
            {/* Export Type Selection */}
            <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Export Scope</h3>
              <div class="space-y-3">
                <For each={exportTypeOptions}>
                  {(option) => (
                    <label class="flex items-start gap-3 p-3 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer">
                      <input
                        type="radio"
                        name="exportType"
                        value={option.value}
                        checked={settings().exportType === option.value}
                        onChange={(e) => updateSetting('exportType', e.currentTarget.value as any)}
                        class="w-4 h-4 text-blue-600 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-2 mt-1"
                      />
                      <div class="flex-1">
                        <div class="font-medium text-gray-900 dark:text-gray-100">{option.label}</div>
                        <div class="text-sm text-gray-500 dark:text-gray-400 mt-1">{option.description}</div>
                      </div>
                    </label>
                  )}
                </For>
              </div>
            </div>

            {/* Format Selection */}
            <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">{t('export_format')}</h3>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                <For each={exportOptions}>
                  {(option) => (
                    <div 
                      class={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                        settings().format === option.format 
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                          : 'border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-400'
                      }`}
                      onClick={() => updateSetting('format', option.format)}
                    >
                      <div class="flex items-center gap-3 mb-2">
                        <input
                          type="radio"
                          name="format"
                          value={option.format}
                          checked={settings().format === option.format}
                          onChange={(e) => updateSetting('format', e.currentTarget.value as any)}
                          class="w-4 h-4 text-blue-600 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-2"
                        />
                        <span class="font-medium text-gray-900 dark:text-gray-100">{option.label}</span>
                        <span class="text-sm font-mono text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">{option.extension}</span>
                      </div>
                      <div class="text-sm text-gray-600 dark:text-gray-400 ml-7">{option.description}</div>
                    </div>
                  )}
                </For>
              </div>
            </div>

            {/* Export Settings */}
            <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">{t('export_settings')}</h3>
              
              <div class="space-y-4">
                <div class="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={settings().includeSheet}
                    onChange={(e) => updateSetting('includeSheet', e.currentTarget.checked)}
                    class="w-4 h-4 text-blue-600 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-2"
                  />
                  <label class="text-sm font-medium text-gray-900 dark:text-gray-100">{t('include_sheet')}</label>
                </div>

                <div class="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={settings().includeLabels}
                    onChange={(e) => updateSetting('includeLabels', e.currentTarget.checked)}
                    class="w-4 h-4 text-blue-600 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-2"
                  />
                  <label class="text-sm font-medium text-gray-900 dark:text-gray-100">{t('include_labels')}</label>
                </div>

                <Show when={settings().format === 'svg' || settings().format === 'dxf'}>
                  <div class="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={settings().optimizePaths}
                      onChange={(e) => updateSetting('optimizePaths', e.currentTarget.checked)}
                      class="w-4 h-4 text-blue-600 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-2"
                    />
                    <label class="text-sm font-medium text-gray-900 dark:text-gray-100">{t('optimize_paths')}</label>
                  </div>

                  <div class="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={settings().mergeLines}
                      onChange={(e) => updateSetting('mergeLines', e.currentTarget.checked)}
                      class="w-4 h-4 text-blue-600 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-2"
                    />
                    <label class="text-sm font-medium text-gray-900 dark:text-gray-100">{t('merge_lines')}</label>
                  </div>
                </Show>
              </div>
            </div>

            {/* Scale and Units */}
            <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Scale & Units</h3>
              
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="space-y-2">
                  <label class="text-sm font-medium text-gray-700 dark:text-gray-300">{t('export_scale')}</label>
                  <input
                    type="number"
                    min="0.1"
                    max="10"
                    step="0.1"
                    value={settings().scale}
                    onInput={(e) => updateSetting('scale', parseFloat(e.currentTarget.value) || 1.0)}
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>

                <div class="space-y-2">
                  <label class="text-sm font-medium text-gray-700 dark:text-gray-300">{t('export_units')}</label>
                  <select
                    value={settings().units}
                    onChange={(e) => updateSetting('units', e.currentTarget.value as any)}
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  >
                    <For each={unitOptions}>
                      {(unit) => (
                        <option value={unit.value}>{unit.label}</option>
                      )}
                    </For>
                  </select>
                </div>
              </div>
            </div>

            {/* Preview Info */}
            <Show when={getSelectedOption()}>
              <div class="bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600 p-4">
                <h4 class="text-md font-medium text-gray-900 dark:text-gray-100 mb-3">Export Preview</h4>
                <div class="space-y-2">
                  <div class="flex justify-between text-sm">
                    <span class="text-gray-600 dark:text-gray-400">Format:</span>
                    <span class="text-gray-900 dark:text-gray-100 font-medium">{getSelectedOption()?.label} ({getSelectedOption()?.extension})</span>
                  </div>
                  <div class="flex justify-between text-sm">
                    <span class="text-gray-600 dark:text-gray-400">Scale:</span>
                    <span class="text-gray-900 dark:text-gray-100 font-medium">{settings().scale}x</span>
                  </div>
                  <div class="flex justify-between text-sm">
                    <span class="text-gray-600 dark:text-gray-400">Units:</span>
                    <span class="text-gray-900 dark:text-gray-100 font-medium">{settings().units}</span>
                  </div>
                  <div class="flex justify-between text-sm">
                    <span class="text-gray-600 dark:text-gray-400">Include Sheet:</span>
                    <span class="text-gray-900 dark:text-gray-100 font-medium">{settings().includeSheet ? 'Yes' : 'No'}</span>
                  </div>
                </div>
              </div>
            </Show>
          </div>
        </div>

        <div class="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button 
            class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-colors duration-200"
            onClick={props.onClose}
          >
            Cancel
          </button>
          <button 
            class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-colors duration-200"
            onClick={handleExport}
          >
            Export Files
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportDialog;