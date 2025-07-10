import { Component } from 'solid-js';
import { useTranslation } from '@/utils/i18n';

const PartsPanel: Component = () => {
  const [t] = useTranslation('navigation');
  const [tActions] = useTranslation('actions');

  return (
    <div class="parts-panel">
      <div class="panel-header">
        <h2>{t('parts')}</h2>
        <div class="panel-actions">
          <button class="button primary">
            {tActions('import')}
          </button>
        </div>
      </div>
      
      <div class="panel-content">
        <div class="parts-list">
          <p>Parts management will be implemented here.</p>
          <p>This will include:</p>
          <ul>
            <li>File import (SVG, DXF)</li>
            <li>Parts list with selection</li>
            <li>Part preview and properties</li>
            <li>Quantity and rotation settings</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default PartsPanel;