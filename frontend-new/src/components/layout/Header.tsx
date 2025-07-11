import { Component } from 'solid-js';
import { useTranslation } from '@/utils/i18n';
import { globalState, globalActions } from '@/stores/global.store';

const Header: Component = () => {
  const [t, { changeLanguage }] = useTranslation('translation');

  const toggleDarkMode = () => {
    // Toggle between light and dark mode (explicit themes)
    const newTheme = globalState.ui.darkMode ? 'light' : 'dark';
    globalActions.setThemePreference(newTheme);
  };

  const handleLanguageChange = async (language: string) => {
    console.log(`Header: handleLanguageChange called with ${language}`);
    console.log('Header: current globalState.ui.language:', globalState.ui.language);
    
    globalActions.setLanguage(language);
    console.log('Header: after globalActions.setLanguage, globalState.ui.language:', globalState.ui.language);
    
    await changeLanguage(language);
    console.log('Header: after changeLanguage call completed');
  };

  return (
    <header class="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-6 shadow-sm">
      <div class="flex items-center">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 bg-blue-600 dark:bg-blue-500 rounded-lg flex items-center justify-center">
            <span class="text-white font-bold text-sm">DN</span>
          </div>
          <h1 class="text-xl font-semibold text-gray-900 dark:text-gray-100">{(() => {
            const translation = t('navigation.page_title');
            console.log('Header rendering with translation:', translation);
            return translation;
          })()}</h1>
        </div>
      </div>
      
      <div class="flex items-center gap-4">
        <div class="relative">
          <select 
            value={globalState.ui.language}
            onChange={(e) => handleLanguageChange(e.currentTarget.value)}
            class="bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 px-3 py-2 pr-8 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none cursor-pointer"
          >
            <option value="en">🇺🇸 EN</option>
            <option value="de">🇩🇪 DE</option>
          </select>
          <div class="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
            <svg class="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
            </svg>
          </div>
        </div>
        
        <button 
          class="flex items-center justify-center w-10 h-10 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
          onClick={toggleDarkMode}
          title={globalState.ui.darkMode ? "Switch to light mode" : "Switch to dark mode"}
        >
          {globalState.ui.darkMode ? (
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clip-rule="evenodd"></path>
            </svg>
          ) : (
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"></path>
            </svg>
          )}
        </button>
      </div>
    </header>
  );
};

export default Header;