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
    <div class="part-preview">
      <div class="preview-container" style={{ width: `${width}px`, height: `${height}px` }}>
        <Show 
          when={!hasError() && svgContent()}
          fallback={
            <div class="preview-error">
              <div class="error-icon">❌</div>
              <div class="error-text">{t('preview_error')}</div>
            </div>
          }
        >
          <div 
            class="svg-container"
            innerHTML={svgContent()}
            onLoad={handleSvgLoad}
            onError={handleSvgError}
          />
        </Show>
      </div>
      
      <div class="preview-info">
        <div class="info-item">
          <span class="info-label">{t('name')}:</span>
          <span class="info-value">{props.part.name}</span>
        </div>
        <div class="info-item">
          <span class="info-label">{t('dimensions')}:</span>
          <span class="info-value">
            {props.part.bounds.width.toFixed(1)} × {props.part.bounds.height.toFixed(1)}
          </span>
        </div>
        <div class="info-item">
          <span class="info-label">{t('quantity')}:</span>
          <span class="info-value">{props.part.quantity}</span>
        </div>
        <div class="info-item">
          <span class="info-label">{t('rotation')}:</span>
          <span class="info-value">{props.part.rotation}°</span>
        </div>
        <Show when={props.part.area}>
          <div class="info-item">
            <span class="info-label">{t('area')}:</span>
            <span class="info-value">{props.part.area!.toFixed(2)}</span>
          </div>
        </Show>
      </div>
    </div>
  );
};

export default PartPreview;