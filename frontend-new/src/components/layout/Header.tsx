import { Component } from 'solid-js';
import { useTranslation } from '@/utils/i18n';
import { globalState, globalActions } from '@/stores/global.store';

const Header: Component = () => {
  const [t, { changeLanguage }] = useTranslation('navigation');

  const toggleDarkMode = () => {
    globalActions.setDarkMode(!globalState.ui.darkMode);
  };

  const handleLanguageChange = async (language: string) => {
    globalActions.setLanguage(language);
    await changeLanguage(language);
  };

  return (
    <header class="h-15 bg-deepnest-bg-secondary dark:bg-deepnest-dark-bg-secondary border-b border-deepnest-border dark:border-deepnest-dark-border flex items-center justify-between px-5">
      <div class="flex items-center">
        <h1 class="text-xl font-normal text-deepnest-text-secondary dark:text-deepnest-dark-text-secondary">{t('page_title')}</h1>
      </div>
      
      <div class="flex items-center gap-4">
        <div class="language-selector">
          <select 
            value={globalState.ui.language}
            onChange={(e) => handleLanguageChange(e.currentTarget.value)}
            class="input-select"
          >
            <option value="en">English</option>
            <option value="de">Deutsch</option>
            <option value="fr">Français</option>
            <option value="es">Español</option>
          </select>
        </div>
        
        <button 
          class="btn-secondary btn-small"
          onClick={toggleDarkMode}
          title="Toggle dark mode"
        >
          {globalState.ui.darkMode ? '☀️' : '🌙'}
        </button>
      </div>
    </header>
  );
};

export default Header;