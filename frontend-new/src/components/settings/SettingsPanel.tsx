import { Component } from 'solid-js';
import { useTranslation } from '@/utils/i18n';

const SettingsPanel: Component = () => {
  const [t] = useTranslation('navigation');
  const [tActions] = useTranslation('actions');

  return (
    <div class="settings-panel">
      <div class="panel-header">
        <h2>{t('settings')}</h2>
        <div class="panel-actions">
          <button class="button secondary">
            {tActions('reset_defaults')}
          </button>
        </div>
      </div>
      
      <div class="panel-content">
        <div class="settings-sections">
          <p>Settings and configuration will be implemented here.</p>
          <p>This will include:</p>
          <ul>
            <li>Nesting algorithm parameters</li>
            <li>Import/Export settings</li>
            <li>UI preferences</li>
            <li>Preset management</li>
            <li>Advanced settings</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;