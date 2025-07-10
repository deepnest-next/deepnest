import { Component } from 'solid-js';
import { useTranslation } from '@/utils/i18n';

const NestingPanel: Component = () => {
  const [t] = useTranslation('navigation');
  const [tActions] = useTranslation('actions');

  return (
    <div class="nesting-panel">
      <div class="panel-header">
        <h2>{t('nests')}</h2>
        <div class="panel-actions">
          <button class="button primary">
            {tActions('start_nest')}
          </button>
          <button class="button secondary">
            {tActions('stop_nest')}
          </button>
        </div>
      </div>
      
      <div class="panel-content">
        <div class="nesting-results">
          <p>Nesting results will be displayed here.</p>
          <p>This will include:</p>
          <ul>
            <li>Real-time progress display</li>
            <li>Results grid with thumbnails</li>
            <li>Detailed result viewer</li>
            <li>Statistics and efficiency metrics</li>
            <li>Export options</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default NestingPanel;