import { Component } from 'solid-js';
import { useTranslation } from '@/utils/i18n';

const SheetsPanel: Component = () => {
  const [t] = useTranslation('navigation');
  const [tActions] = useTranslation('actions');

  return (
    <div class="sheets-panel">
      <div class="panel-header">
        <h2>{t('sheets')}</h2>
        <div class="panel-actions">
          <button class="button primary">
            {tActions('add')}
          </button>
        </div>
      </div>
      
      <div class="panel-content">
        <div class="sheets-list">
          <p>Sheet management will be implemented here.</p>
          <p>This will include:</p>
          <ul>
            <li>Sheet configuration (size, margins)</li>
            <li>Material settings</li>
            <li>Sheet templates</li>
            <li>Custom dimensions</li>
            <li>Sheet preview</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SheetsPanel;