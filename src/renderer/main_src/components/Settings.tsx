import { Component } from 'solid-js';
import { useI18n } from '../contexts/I18nContext';
import { useThemeToggle } from '../contexts/AppContext';
import LanguageSelector from './LanguageSelector';

const Settings: Component = () => {
  const { t } = useI18n();
  const { isDark, toggleTheme } = useThemeToggle();

  return (
    <div class="settings-container p-4">
      <h1 class="text-2xl font-bold mb-4">{t('settings')}</h1>
      <p class="mb-6">{t('settings.description')}</p>

      <div class="setting-section mb-8">
        <h2 class="text-xl font-semibold mb-2">{t('general.settings')}</h2>

        <div class="setting-item mb-4">
          <h3 class="text-lg mb-2">{t('theme.settings')}</h3>
          <button
            onClick={toggleTheme}
            class="px-4 py-2 rounded bg-primary text-white"
          >
            {isDark() ? t('theme.light') : t('theme.dark')}
          </button>
        </div>

        <div class="setting-item">
          <h3 class="text-lg mb-2">{t('language.settings')}</h3>
          <LanguageSelector />
        </div>
      </div>
    </div>
  );
};

export default Settings;
