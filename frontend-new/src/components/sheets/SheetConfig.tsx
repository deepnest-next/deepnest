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
    <>
      <div class="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
      <div class="space-y-6">
        <div class="space-y-4">
          <h4 class="text-lg font-medium text-gray-900 dark:text-gray-100">{t('basic_information')}</h4>
          
          <div class="space-y-2">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300" for="sheet-name">{t('sheet_name')}:</label>
            <input
              id="sheet-name"
              type="text"
              value={name()}
              onInput={(e) => setName(e.currentTarget.value)}
              placeholder={t('enter_sheet_name')}
              class="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>

          <div class="space-y-2">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300" for="material">{t('material')}:</label>
            <select
              id="material"
              value={material()}
              onChange={(e) => setMaterial(e.currentTarget.value)}
              class="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <For each={materialOptions}>
                {(mat) => <option value={mat}>{mat}</option>}
              </For>
            </select>
          </div>
        </div>

        <div class="space-y-4">
          <h4 class="text-lg font-medium text-gray-900 dark:text-gray-100">{t('dimensions')}</h4>
          
          <div class="grid grid-cols-3 gap-2 mb-4">
            <For each={commonSizes}>
              {(preset) => (
                <button
                  type="button"
                  class="px-2 py-1 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-colors duration-200"
                  onClick={() => handlePresetSize(preset)}
                  title={`${preset.width} × ${preset.height} mm`}
                >
                  {preset.name}
                </button>
              )}
            </For>
          </div>

          <div class="flex items-end gap-2">
            <div class="flex-1">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" for="width">{t('width')} (mm):</label>
              <input
                id="width"
                type="number"
                value={width()}
                onInput={(e) => setWidth(parseFloat(e.currentTarget.value) || 0)}
                min="1"
                step="0.1"
                class={`block w-full px-3 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                  errors().width ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
              />
              <Show when={errors().width}>
                <span class="text-red-500 dark:text-red-400 text-xs mt-1 block">{errors().width}</span>
              </Show>
            </div>

            <button
              type="button"
              class="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-colors duration-200 mb-1"
              onClick={swapDimensions}
              title={t('swap_dimensions')}
            >
              ⇄
            </button>

            <div class="flex-1">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" for="height">{t('height')} (mm):</label>
              <input
                id="height"
                type="number"
                value={height()}
                onInput={(e) => setHeight(parseFloat(e.currentTarget.value) || 0)}
                min="1"
                step="0.1"
                class={`block w-full px-3 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                  errors().height ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
              />
              <Show when={errors().height}>
                <span class="text-red-500 dark:text-red-400 text-xs mt-1 block">{errors().height}</span>
              </Show>
            </div>
          </div>

          <div class="text-sm text-gray-600 dark:text-gray-400 mt-2">
            {t('area')}: {calculateArea()} mm²
          </div>
        </div>

        <div class="space-y-4">
          <h4 class="text-lg font-medium text-gray-900 dark:text-gray-100">{t('properties')}</h4>
          
          <div class="grid grid-cols-3 gap-4">
            <div class="space-y-2">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300" for="thickness">{t('thickness')} (mm):</label>
              <input
                id="thickness"
                type="number"
                value={thickness()}
                onInput={(e) => setThickness(parseFloat(e.currentTarget.value) || 0)}
                min="0.1"
                step="0.1"
                class={`block w-full px-3 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                  errors().thickness ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
              />
              <Show when={errors().thickness}>
                <span class="text-red-500 dark:text-red-400 text-xs mt-1 block">{errors().thickness}</span>
              </Show>
            </div>

            <div class="space-y-2">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300" for="quantity">{t('quantity')}:</label>
              <input
                id="quantity"
                type="number"
                value={quantity()}
                onInput={(e) => setQuantity(parseInt(e.currentTarget.value) || 0)}
                min="1"
                class={`block w-full px-3 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                  errors().quantity ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
              />
              <Show when={errors().quantity}>
                <span class="text-red-500 dark:text-red-400 text-xs mt-1 block">{errors().quantity}</span>
              </Show>
            </div>

            <div class="space-y-2">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300" for="margin">{t('margin')} (mm):</label>
              <input
                id="margin"
                type="number"
                value={margin()}
                onInput={(e) => setMargin(parseFloat(e.currentTarget.value) || 0)}
                min="0"
                step="0.1"
                class={`block w-full px-3 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                  errors().margin ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
              />
              <Show when={errors().margin}>
                <span class="text-red-500 dark:text-red-400 text-xs mt-1 block">{errors().margin}</span>
              </Show>
            </div>
          </div>
        </div>

        <div class="space-y-4">
          <h4 class="text-lg font-medium text-gray-900 dark:text-gray-100">{t('preview')}</h4>
          <div class="flex items-center gap-6">
            <div class="flex-shrink-0">
              <div 
                class="bg-white dark:bg-gray-600 border-2 border-gray-300 dark:border-gray-500 rounded shadow-sm relative"
                style={{
                  'aspect-ratio': `${width()} / ${height()}`,
                  'width': '120px',
                  'max-height': '120px'
                }}
              >
                <div 
                  class="absolute border border-dashed border-gray-400 dark:border-gray-400 rounded-sm" 
                  style={{ 
                    top: `${Math.max(margin() / Math.max(width(), height()) * 100, 2)}%`,
                    left: `${Math.max(margin() / Math.max(width(), height()) * 100, 2)}%`,
                    right: `${Math.max(margin() / Math.max(width(), height()) * 100, 2)}%`,
                    bottom: `${Math.max(margin() / Math.max(width(), height()) * 100, 2)}%`
                  }} 
                />
              </div>
            </div>
            <div class="space-y-2">
              <div class="text-sm text-gray-900 dark:text-gray-100">
                {width()} × {height()} mm
              </div>
              <div class="text-sm text-gray-600 dark:text-gray-400">
                {t('area')}: {calculateArea()} mm²
              </div>
              <Show when={margin() > 0}>
                <div class="text-sm text-gray-600 dark:text-gray-400">
                  {t('margin')}: {margin()} mm
                </div>
              </Show>
            </div>
          </div>
        </div>
      </div>

      </div>
      <div class="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
        <button 
          type="button"
          class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-colors duration-200"
          onClick={props.onCancel}
        >
          {t('cancel')}
        </button>
        <button 
          type="button"
          class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-colors duration-200"
          onClick={handleSave}
        >
          {props.sheet ? t('update_sheet') : t('add_sheet')}
        </button>
      </div>
    </>
  );
};

export default SheetConfig;