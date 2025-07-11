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
    <div class="sheets-panel">
      <div class="panel-header">
        <h2>{t('sheets_title')}</h2>
        <div class="panel-actions">
          <button 
            class="button primary"
            onClick={handleAddSheet}
            title={t('add_sheet')}
          >
            ➕ {t('add_sheet')}
          </button>
        </div>
      </div>

      <div class="sheets-summary">
        <div class="summary-item">
          <span class="summary-label">{t('total_sheets')}:</span>
          <span class="summary-value">{sheetsCount()}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">{t('total_area')}:</span>
          <span class="summary-value">{totalArea().toFixed(0)} mm²</span>
        </div>
      </div>

      <Show when={showAddSheet()}>
        <div class="sheet-config-overlay">
          <div class="sheet-config-modal">
            <div class="modal-header">
              <h3>{editingSheet() ? t('edit_sheet') : t('add_new_sheet')}</h3>
              <button class="close-button" onClick={handleCancel}>×</button>
            </div>
            <SheetConfig
              sheet={editingSheet()}
              onSave={handleSheetSave}
              onCancel={handleCancel}
            />
          </div>
        </div>
      </Show>

      <div class="panel-content">
        <Show 
          when={sheetsCount() > 0}
          fallback={
            <div class="empty-state">
              <div class="empty-icon">📄</div>
              <h3>{t('no_sheets_loaded')}</h3>
              <p>{t('add_sheets_to_get_started')}</p>
              
              <div class="template-section">
                <h4>{t('quick_templates')}</h4>
                <div class="template-grid">
                  <For each={sheetTemplates}>
                    {(template) => (
                      <button 
                        class="template-button"
                        onClick={() => handleAddTemplate(template)}
                        title={`${template.width} × ${template.height} ${template.units}`}
                      >
                        <div class="template-name">{template.name}</div>
                        <div class="template-size">
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
          <div class="sheets-list">
            <div class="list-header">
              <h3>{t('configured_sheets')}</h3>
            </div>
            
            <div class="sheets-grid">
              <For each={globalState.app.sheets}>
                {(sheet, index) => (
                  <div class="sheet-card">
                    <div class="sheet-preview">
                      <div class="sheet-visual">
                        <div 
                          class="sheet-rectangle"
                          style={{
                            'aspect-ratio': `${sheet.width} / ${sheet.height}`,
                            'max-width': '120px',
                            'max-height': '120px'
                          }}
                        >
                          <div class="sheet-margin" style={{ margin: '8px' }} />
                        </div>
                      </div>
                    </div>

                    <div class="sheet-info">
                      <div class="sheet-title">
                        {sheet.name || `${t('sheet')} ${index() + 1}`}
                      </div>
                      
                      <div class="sheet-details">
                        <div class="detail-item">
                          <span class="detail-label">{t('dimensions')}:</span>
                          <span class="detail-value">{formatDimensions(sheet)}</span>
                        </div>
                        <div class="detail-item">
                          <span class="detail-label">{t('quantity')}:</span>
                          <span class="detail-value">{sheet.quantity}</span>
                        </div>
                        <div class="detail-item">
                          <span class="detail-label">{t('material')}:</span>
                          <span class="detail-value">{sheet.material || 'Generic'}</span>
                        </div>
                        <Show when={sheet.margin}>
                          <div class="detail-item">
                            <span class="detail-label">{t('margin')}:</span>
                            <span class="detail-value">{sheet.margin} mm</span>
                          </div>
                        </Show>
                      </div>

                      <div class="sheet-actions">
                        <button 
                          class="button-link"
                          onClick={() => handleEditSheet(sheet)}
                        >
                          {t('edit')}
                        </button>
                        <button 
                          class="button-link danger"
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