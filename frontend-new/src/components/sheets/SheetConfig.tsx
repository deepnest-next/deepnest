import { Component, createSignal, createEffect, Show, For } from 'solid-js';
import { useTranslation } from '@/utils/i18n';
import type { Sheet } from '@/types/app.types';

interface SheetConfigProps {
  sheet?: Sheet | null;
  onSave: (sheet: Sheet) => void;
  onCancel: () => void;
}

const SheetConfig: Component<SheetConfigProps> = (props) => {
  const [t] = useTranslation('sheets');
  
  // Form state
  const [name, setName] = createSignal('');
  const [width, setWidth] = createSignal(200);
  const [height, setHeight] = createSignal(200);
  const [thickness, setThickness] = createSignal(3);
  const [quantity, setQuantity] = createSignal(1);
  const [margin, setMargin] = createSignal(5);
  const [material, setMaterial] = createSignal('Generic');
  
  // Validation state
  const [errors, setErrors] = createSignal<Record<string, string>>({});

  const materialOptions = [
    'Generic',
    'Wood - Plywood',
    'Wood - MDF',
    'Wood - Hardwood',
    'Metal - Aluminum',
    'Metal - Steel',
    'Metal - Brass',
    'Plastic - Acrylic',
    'Plastic - ABS',
    'Cardboard',
    'Fabric',
    'Leather',
    'Paper'
  ];

  const commonSizes = [
    { name: 'A4', width: 210, height: 297 },
    { name: 'A3', width: 297, height: 420 },
    { name: 'A2', width: 420, height: 594 },
    { name: 'A1', width: 594, height: 841 },
    { name: 'Letter', width: 216, height: 279 },
    { name: 'Legal', width: 216, height: 356 },
    { name: '12×12"', width: 305, height: 305 },
    { name: '24×24"', width: 610, height: 610 },
    { name: '48×24"', width: 1219, height: 610 }
  ];

  // Initialize form when sheet prop changes
  createEffect(() => {
    const sheet = props.sheet;
    if (sheet) {
      setName(sheet.name || '');
      setWidth(sheet.width);
      setHeight(sheet.height);
      setThickness(sheet.thickness || 3);
      setQuantity(sheet.quantity || 1);
      setMargin(sheet.margin || 5);
      setMaterial(sheet.material || 'Generic');
    } else {
      // Reset form for new sheet
      setName('');
      setWidth(200);
      setHeight(200);
      setThickness(3);
      setQuantity(1);
      setMargin(5);
      setMaterial('Generic');
    }
    setErrors({});
  });

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (width() <= 0) {
      newErrors.width = t('width_must_be_positive');
    }
    if (height() <= 0) {
      newErrors.height = t('height_must_be_positive');
    }
    if (thickness() <= 0) {
      newErrors.thickness = t('thickness_must_be_positive');
    }
    if (quantity() <= 0) {
      newErrors.quantity = t('quantity_must_be_positive');
    }
    if (margin() < 0) {
      newErrors.margin = t('margin_cannot_be_negative');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) return;

    const sheet: Sheet = {
      id: props.sheet?.id || `sheet_${Date.now()}`,
      name: name().trim() || `Sheet ${Date.now()}`,
      width: width(),
      height: height(),
      thickness: thickness(),
      quantity: quantity(),
      margin: margin(),
      material: material()
    };

    props.onSave(sheet);
  };

  const handlePresetSize = (preset: typeof commonSizes[0]) => {
    setWidth(preset.width);
    setHeight(preset.height);
    if (!name().trim()) {
      setName(preset.name);
    }
  };

  const swapDimensions = () => {
    const temp = width();
    setWidth(height());
    setHeight(temp);
  };

  const calculateArea = () => {
    return (width() * height()).toFixed(0);
  };

  return (
    <div class="sheet-config">
      <div class="config-form">
        <div class="form-section">
          <h4>{t('basic_information')}</h4>
          
          <div class="form-group">
            <label for="sheet-name">{t('sheet_name')}:</label>
            <input
              id="sheet-name"
              type="text"
              value={name()}
              onInput={(e) => setName(e.currentTarget.value)}
              placeholder={t('enter_sheet_name')}
              class="form-input"
            />
          </div>

          <div class="form-group">
            <label for="material">{t('material')}:</label>
            <select
              id="material"
              value={material()}
              onChange={(e) => setMaterial(e.currentTarget.value)}
              class="form-select"
            >
              <For each={materialOptions}>
                {(mat) => <option value={mat}>{mat}</option>}
              </For>
            </select>
          </div>
        </div>

        <div class="form-section">
          <h4>{t('dimensions')}</h4>
          
          <div class="preset-buttons">
            <For each={commonSizes}>
              {(preset) => (
                <button
                  type="button"
                  class="preset-button"
                  onClick={() => handlePresetSize(preset)}
                  title={`${preset.width} × ${preset.height} mm`}
                >
                  {preset.name}
                </button>
              )}
            </For>
          </div>

          <div class="dimensions-row">
            <div class="form-group">
              <label for="width">{t('width')} (mm):</label>
              <input
                id="width"
                type="number"
                value={width()}
                onInput={(e) => setWidth(parseFloat(e.currentTarget.value) || 0)}
                min="1"
                step="0.1"
                class={`form-input ${errors().width ? 'error' : ''}`}
              />
              <Show when={errors().width}>
                <span class="error-message">{errors().width}</span>
              </Show>
            </div>

            <button
              type="button"
              class="swap-button"
              onClick={swapDimensions}
              title={t('swap_dimensions')}
            >
              ⇄
            </button>

            <div class="form-group">
              <label for="height">{t('height')} (mm):</label>
              <input
                id="height"
                type="number"
                value={height()}
                onInput={(e) => setHeight(parseFloat(e.currentTarget.value) || 0)}
                min="1"
                step="0.1"
                class={`form-input ${errors().height ? 'error' : ''}`}
              />
              <Show when={errors().height}>
                <span class="error-message">{errors().height}</span>
              </Show>
            </div>
          </div>

          <div class="area-display">
            {t('area')}: {calculateArea()} mm²
          </div>
        </div>

        <div class="form-section">
          <h4>{t('properties')}</h4>
          
          <div class="properties-row">
            <div class="form-group">
              <label for="thickness">{t('thickness')} (mm):</label>
              <input
                id="thickness"
                type="number"
                value={thickness()}
                onInput={(e) => setThickness(parseFloat(e.currentTarget.value) || 0)}
                min="0.1"
                step="0.1"
                class={`form-input ${errors().thickness ? 'error' : ''}`}
              />
              <Show when={errors().thickness}>
                <span class="error-message">{errors().thickness}</span>
              </Show>
            </div>

            <div class="form-group">
              <label for="quantity">{t('quantity')}:</label>
              <input
                id="quantity"
                type="number"
                value={quantity()}
                onInput={(e) => setQuantity(parseInt(e.currentTarget.value) || 0)}
                min="1"
                class={`form-input ${errors().quantity ? 'error' : ''}`}
              />
              <Show when={errors().quantity}>
                <span class="error-message">{errors().quantity}</span>
              </Show>
            </div>

            <div class="form-group">
              <label for="margin">{t('margin')} (mm):</label>
              <input
                id="margin"
                type="number"
                value={margin()}
                onInput={(e) => setMargin(parseFloat(e.currentTarget.value) || 0)}
                min="0"
                step="0.1"
                class={`form-input ${errors().margin ? 'error' : ''}`}
              />
              <Show when={errors().margin}>
                <span class="error-message">{errors().margin}</span>
              </Show>
            </div>
          </div>
        </div>

        <div class="sheet-preview-section">
          <h4>{t('preview')}</h4>
          <div class="sheet-preview-container">
            <div 
              class="sheet-preview-visual"
              style={{
                'aspect-ratio': `${width()} / ${height()}`,
                'max-width': '200px',
                'max-height': '200px'
              }}
            >
              <div 
                class="sheet-preview-margin" 
                style={{ 
                  margin: `${Math.max(margin() / Math.max(width(), height()) * 100, 2)}%` 
                }} 
              />
            </div>
            <div class="preview-info">
              <div class="preview-detail">
                {width()} × {height()} mm
              </div>
              <div class="preview-detail">
                {t('area')}: {calculateArea()} mm²
              </div>
              <Show when={margin() > 0}>
                <div class="preview-detail">
                  {t('margin')}: {margin()} mm
                </div>
              </Show>
            </div>
          </div>
        </div>
      </div>

      <div class="form-actions">
        <button 
          type="button"
          class="button secondary"
          onClick={props.onCancel}
        >
          {t('cancel')}
        </button>
        <button 
          type="button"
          class="button primary"
          onClick={handleSave}
        >
          {props.sheet ? t('update_sheet') : t('add_sheet')}
        </button>
      </div>
    </div>
  );
};

export default SheetConfig;