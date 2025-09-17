import { Component, createMemo, createSignal, Show } from 'solid-js';
import { useTranslation } from '@/utils/i18n';
import type { Part } from '@/types/app.types';

interface PartPreviewProps {
  part: Part;
  width?: number;
  height?: number;
}

const PartPreview: Component<PartPreviewProps> = (props) => {
  const [t] = useTranslation('parts');
  const [isLoaded, setIsLoaded] = createSignal(false);
  const [hasError, setHasError] = createSignal(false);

  const { width = 200, height = 200 } = props;

  const svgContent = createMemo(() => {
    if (!props.part.svgContent) return '';
    
    try {
      // Create a properly scaled SVG for preview
      const bounds = props.part.bounds;
      const scale = Math.min(width / bounds.width, height / bounds.height) * 0.9;
      
      const scaledWidth = bounds.width * scale;
      const scaledHeight = bounds.height * scale;
      
      const offsetX = (width - scaledWidth) / 2;
      const offsetY = (height - scaledHeight) / 2;

      return `
        <svg 
          width="${width}" 
          height="${height}" 
          viewBox="0 0 ${width} ${height}"
          xmlns="http://www.w3.org/2000/svg"
        >
          <g transform="translate(${offsetX}, ${offsetY}) scale(${scale})">
            ${props.part.svgContent}
          </g>
        </svg>
      `;
    } catch (error) {
      console.error('Error processing SVG content:', error);
      setHasError(true);
      return '';
    }
  });

  const handleSvgLoad = () => {
    setIsLoaded(true);
    setHasError(false);
  };

  const handleSvgError = () => {
    setIsLoaded(false);
    setHasError(true);
  };

  return (
    <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div class="aspect-square bg-gray-50 dark:bg-gray-700 flex items-center justify-center border-b border-gray-200 dark:border-gray-600" style={{ width: `${width}px`, height: `${height}px` }}>
        <Show 
          when={!hasError() && svgContent()}
          fallback={
            <div class="text-center">
              <div class="text-red-500 dark:text-red-400 text-3xl mb-2">❌</div>
              <div class="text-sm text-gray-600 dark:text-gray-400">{t('preview_error')}</div>
            </div>
          }
        >
          <div 
            class="w-full h-full flex items-center justify-center"
            innerHTML={svgContent()}
            onLoad={handleSvgLoad}
            onError={handleSvgError}
          />
        </Show>
      </div>
      
      <div class="p-4 space-y-2">
        <div class="flex justify-between text-sm">
          <span class="text-gray-600 dark:text-gray-400">{t('name')}:</span>
          <span class="text-gray-900 dark:text-gray-100 font-medium">{props.part.name}</span>
        </div>
        <div class="flex justify-between text-sm">
          <span class="text-gray-600 dark:text-gray-400">{t('dimensions')}:</span>
          <span class="text-gray-900 dark:text-gray-100 font-medium">
            {props.part.bounds.width.toFixed(1)} × {props.part.bounds.height.toFixed(1)}
          </span>
        </div>
        <div class="flex justify-between text-sm">
          <span class="text-gray-600 dark:text-gray-400">{t('quantity')}:</span>
          <span class="text-gray-900 dark:text-gray-100 font-medium">{props.part.quantity}</span>
        </div>
        <div class="flex justify-between text-sm">
          <span class="text-gray-600 dark:text-gray-400">{t('rotation')}:</span>
          <span class="text-gray-900 dark:text-gray-100 font-medium">{props.part.rotation}°</span>
        </div>
        <Show when={props.part.area}>
          <div class="flex justify-between text-sm">
            <span class="text-gray-600 dark:text-gray-400">{t('area')}:</span>
            <span class="text-gray-900 dark:text-gray-100 font-medium">{props.part.area!.toFixed(2)}</span>
          </div>
        </Show>
      </div>
    </div>
  );
};

export default PartPreview;