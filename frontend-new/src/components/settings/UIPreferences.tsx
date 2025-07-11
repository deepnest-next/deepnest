import { Component, createSignal, createEffect, For } from 'solid-js';
import { useTranslation } from '@/utils/i18n';
import { globalState, globalActions } from '@/stores/global.store';

const UIPreferences: Component = () => {
  const [t, { changeLanguage }] = useTranslation('settings');

  const languageOptions = [
    { code: 'en', name: 'English' },
    { code: 'de', name: 'Deutsch' },
    { code: 'fr', name: 'Français' },
    { code: 'es', name: 'Español' }
  ];

  const unitOptions = [
    { value: 'mm', label: t('millimeters') },
    { value: 'in', label: t('inches') },
    { value: 'cm', label: t('centimeters') }
  ];

  const themeOptions = [
    { value: 'system', label: t('auto_theme') },
    { value: 'light', label: t('light_theme') },
    { value: 'dark', label: t('dark_theme') }
  ];

  const handleLanguageChange = async (language: string) => {
    globalActions.setLanguage(language);
    await changeLanguage(language);
  };

  const handleThemeChange = (theme: string) => {
    globalActions.setThemePreference(theme as 'light' | 'dark' | 'system');
  };

  // Get current theme preference from localStorage
  const getCurrentTheme = () => {
    if (typeof localStorage !== 'undefined') {
      if ('theme' in localStorage) {
        return localStorage.theme;
      }
    }
    return 'system';
  };

  const handleUnitsChange = (units: string) => {
    globalActions.updateConfig({
      ...globalState.config,
      units: units as any
    });
  };

  const handlePanelWidthReset = () => {
    globalActions.setPanelWidth('partsWidth', 300);
  };

  return (
    <div class="space-y-6">
        {/* Appearance Section */}
        <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 space-y-6">
          <div class="flex items-center gap-3 pb-4 border-b border-gray-200 dark:border-gray-700">
            <div class="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
              <svg class="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
              </svg>
            </div>
            <h4 class="text-lg font-semibold text-gray-900 dark:text-gray-100">{t('appearance')}</h4>
          </div>
          
          {/* Language Setting */}
          <div class="space-y-3">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('language')}
            </label>
            <select
              value={globalState.ui.language}
              onChange={(e) => handleLanguageChange(e.currentTarget.value)}
              class="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors duration-200"
            >
              <For each={languageOptions}>
                {(lang) => (
                  <option value={lang.code}>{lang.name}</option>
                )}
              </For>
            </select>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              {t('language_description')}
            </p>
          </div>

          {/* Theme Setting */}
          <div class="space-y-3">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('theme')}
            </label>
            <select
              value={getCurrentTheme()}
              onChange={(e) => handleThemeChange(e.currentTarget.value)}
              class="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors duration-200"
            >
              <For each={themeOptions}>
                {(theme) => (
                  <option value={theme.value}>{theme.label}</option>
                )}
              </For>
            </select>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              {t('theme_description')}
            </p>
          </div>

          {/* Dark Mode Toggle */}
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <div>
                <label class="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('dark_mode')}
                </label>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  {t('dark_mode_description')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => globalActions.setThemePreference(globalState.ui.darkMode ? 'light' : 'dark')}
                class={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 ${
                  globalState.ui.darkMode ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                }`}
              >
                <span class="sr-only">Toggle dark mode</span>
                <span
                  class={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    globalState.ui.darkMode ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Units and Formatting Section */}
        <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 space-y-6">
          <div class="flex items-center gap-3 pb-4 border-b border-gray-200 dark:border-gray-700">
            <div class="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <svg class="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h7" />
              </svg>
            </div>
            <h4 class="text-lg font-semibold text-gray-900 dark:text-gray-100">{t('units_and_formatting')}</h4>
          </div>
          
          {/* Display Units */}
          <div class="space-y-3">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('display_units')}
            </label>
            <select
              value={globalState.config.units || 'mm'}
              onChange={(e) => handleUnitsChange(e.currentTarget.value)}
              class="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors duration-200"
            >
              <For each={unitOptions}>
                {(unit) => (
                  <option value={unit.value}>{unit.label}</option>
                )}
              </For>
            </select>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              {t('units_description')}
            </p>
          </div>

          {/* Show Grid */}
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <div>
                <label class="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('show_grid')}
                </label>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  {t('show_grid_description')}
                </p>
              </div>
              <input
                type="checkbox"
                checked={globalState.config.showGrid !== false}
                onChange={(e) => globalActions.updateConfig({
                  ...globalState.config,
                  showGrid: e.currentTarget.checked
                })}
                class="w-4 h-4 text-blue-600 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-2"
              />
            </div>
          </div>

          {/* Show Rulers */}
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <div>
                <label class="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('show_rulers')}
                </label>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  {t('show_rulers_description')}
                </p>
              </div>
              <input
                type="checkbox"
                checked={globalState.config.showRulers !== false}
                onChange={(e) => globalActions.updateConfig({
                  ...globalState.config,
                  showRulers: e.currentTarget.checked
                })}
                class="w-4 h-4 text-blue-600 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-2"
              />
            </div>
          </div>
        </div>

        {/* Layout Preferences Section */}
        <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 space-y-6">
          <div class="flex items-center gap-3 pb-4 border-b border-gray-200 dark:border-gray-700">
            <div class="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <svg class="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
              </svg>
            </div>
            <h4 class="text-lg font-semibold text-gray-900 dark:text-gray-100">{t('layout_preferences')}</h4>
          </div>
          
          {/* Parts Panel Width */}
          <div class="space-y-3">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('parts_panel_width')}
            </label>
            <div class="flex gap-3">
              <input
                type="number"
                min="200"
                max="600"
                value={globalState.ui.panels.partsWidth || 300}
                onInput={(e) => globalActions.setPanelWidth('partsWidth', parseInt(e.currentTarget.value) || 300)}
                class="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors duration-200"
              />
              <button 
                onClick={handlePanelWidthReset}
                class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
              >
                {t('reset')}
              </button>
            </div>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              {t('panel_width_description')}
            </p>
          </div>

          {/* Show Tooltips */}
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <div>
                <label class="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('show_tooltips')}
                </label>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  {t('tooltips_description')}
                </p>
              </div>
              <input
                type="checkbox"
                checked={globalState.ui.showTooltips !== false}
                onChange={(e) => globalActions.setShowTooltips(e.currentTarget.checked)}
                class="w-4 h-4 text-blue-600 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-2"
              />
            </div>
          </div>

          {/* Show Status Bar */}
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <div>
                <label class="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('show_status_bar')}
                </label>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  {t('status_bar_description')}
                </p>
              </div>
              <input
                type="checkbox"
                checked={globalState.ui.showStatusBar !== false}
                onChange={(e) => globalActions.setShowStatusBar(e.currentTarget.checked)}
                class="w-4 h-4 text-blue-600 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-2"
              />
            </div>
          </div>
        </div>
    </div>
  );
};

export default UIPreferences;