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
    <div class="modal-overlay" onClick={props.onClose}>
      <div class="modal-content export-dialog" onClick={(e) => e.stopPropagation()}>
        <div class="modal-header">
          <h2>{t('export_options')}</h2>
          <button class="close-button" onClick={props.onClose}>×</button>
        </div>

        <div class="modal-body">
          <div class="export-sections">
            
            {/* Export Type Selection */}
            <div class="export-section">
              <h3>Export Scope</h3>
              <div class="radio-group">
                <For each={exportTypeOptions}>
                  {(option) => (
                    <label class="radio-option">
                      <input
                        type="radio"
                        name="exportType"
                        value={option.value}
                        checked={settings().exportType === option.value}
                        onChange={(e) => updateSetting('exportType', e.currentTarget.value as any)}
                      />
                      <span class="radio-label">
                        <strong>{option.label}</strong>
                        <span class="option-description">{option.description}</span>
                      </span>
                    </label>
                  )}
                </For>
              </div>
            </div>

            {/* Format Selection */}
            <div class="export-section">
              <h3>{t('export_format')}</h3>
              <div class="format-grid">
                <For each={exportOptions}>
                  {(option) => (
                    <div 
                      class={`format-option ${settings().format === option.format ? 'selected' : ''}`}
                      onClick={() => updateSetting('format', option.format)}
                    >
                      <div class="format-header">
                        <input
                          type="radio"
                          name="format"
                          value={option.format}
                          checked={settings().format === option.format}
                          onChange={(e) => updateSetting('format', e.currentTarget.value as any)}
                        />
                        <span class="format-label">{option.label}</span>
                        <span class="format-extension">{option.extension}</span>
                      </div>
                      <div class="format-description">{option.description}</div>
                    </div>
                  )}
                </For>
              </div>
            </div>

            {/* Export Settings */}
            <div class="export-section">
              <h3>{t('export_settings')}</h3>
              
              <div class="settings-grid">
                <div class="setting-group">
                  <label class="checkbox-setting">
                    <input
                      type="checkbox"
                      checked={settings().includeSheet}
                      onChange={(e) => updateSetting('includeSheet', e.currentTarget.checked)}
                    />
                    <span class="checkmark"></span>
                    <span class="setting-label">{t('include_sheet')}</span>
                  </label>
                </div>

                <div class="setting-group">
                  <label class="checkbox-setting">
                    <input
                      type="checkbox"
                      checked={settings().includeLabels}
                      onChange={(e) => updateSetting('includeLabels', e.currentTarget.checked)}
                    />
                    <span class="checkmark"></span>
                    <span class="setting-label">{t('include_labels')}</span>
                  </label>
                </div>

                <Show when={settings().format === 'svg' || settings().format === 'dxf'}>
                  <div class="setting-group">
                    <label class="checkbox-setting">
                      <input
                        type="checkbox"
                        checked={settings().optimizePaths}
                        onChange={(e) => updateSetting('optimizePaths', e.currentTarget.checked)}
                      />
                      <span class="checkmark"></span>
                      <span class="setting-label">{t('optimize_paths')}</span>
                    </label>
                  </div>

                  <div class="setting-group">
                    <label class="checkbox-setting">
                      <input
                        type="checkbox"
                        checked={settings().mergeLines}
                        onChange={(e) => updateSetting('mergeLines', e.currentTarget.checked)}
                      />
                      <span class="checkmark"></span>
                      <span class="setting-label">{t('merge_lines')}</span>
                    </label>
                  </div>
                </Show>
              </div>
            </div>

            {/* Scale and Units */}
            <div class="export-section">
              <h3>Scale & Units</h3>
              
              <div class="scale-units-grid">
                <div class="setting-group">
                  <label class="setting-label">{t('export_scale')}</label>
                  <input
                    type="number"
                    min="0.1"
                    max="10"
                    step="0.1"
                    value={settings().scale}
                    onInput={(e) => updateSetting('scale', parseFloat(e.currentTarget.value) || 1.0)}
                    class="number-input"
                  />
                </div>

                <div class="setting-group">
                  <label class="setting-label">{t('export_units')}</label>
                  <select
                    value={settings().units}
                    onChange={(e) => updateSetting('units', e.currentTarget.value as any)}
                    class="setting-select"
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
              <div class="export-preview">
                <h4>Export Preview</h4>
                <div class="preview-info">
                  <div class="preview-item">
                    <span class="preview-label">Format:</span>
                    <span class="preview-value">{getSelectedOption()?.label} ({getSelectedOption()?.extension})</span>
                  </div>
                  <div class="preview-item">
                    <span class="preview-label">Scale:</span>
                    <span class="preview-value">{settings().scale}x</span>
                  </div>
                  <div class="preview-item">
                    <span class="preview-label">Units:</span>
                    <span class="preview-value">{settings().units}</span>
                  </div>
                  <div class="preview-item">
                    <span class="preview-label">Include Sheet:</span>
                    <span class="preview-value">{settings().includeSheet ? 'Yes' : 'No'}</span>
                  </div>
                </div>
              </div>
            </Show>
          </div>
        </div>

        <div class="modal-footer">
          <button class="button secondary" onClick={props.onClose}>
            Cancel
          </button>
          <button class="button primary" onClick={handleExport}>
            Export Files
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportDialog;