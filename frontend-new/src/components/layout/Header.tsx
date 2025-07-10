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
    <header class="header">
      <div class="header-left">
        <h1 class="app-title">{t('page_title')}</h1>
      </div>
      
      <div class="header-right">
        <div class="language-selector">
          <select 
            value={globalState.ui.language}
            onChange={(e) => handleLanguageChange(e.currentTarget.value)}
          >
            <option value="en">English</option>
            <option value="de">Deutsch</option>
            <option value="fr">Français</option>
            <option value="es">Español</option>
          </select>
        </div>
        
        <button 
          class="dark-mode-toggle"
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