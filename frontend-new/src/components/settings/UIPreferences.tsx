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
    { value: 'auto', label: t('auto_theme') },
    { value: 'light', label: t('light_theme') },
    { value: 'dark', label: t('dark_theme') }
  ];

  const handleLanguageChange = async (language: string) => {
    globalActions.setLanguage(language);
    await changeLanguage(language);
  };

  const handleThemeChange = (theme: string) => {
    if (theme === 'auto') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      globalActions.setDarkMode(prefersDark);
    } else {
      globalActions.setDarkMode(theme === 'dark');
    }
    globalActions.setTheme(theme as any);
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
    <div class="ui-preferences">
      <div class="section-header">
        <h3>{t('ui_preferences')}</h3>
      </div>

      <div class="settings-sections">
        <div class="settings-section">
          <h4>{t('appearance')}</h4>
          
          <div class="setting-group">
            <label class="setting-label">
              {t('language')}
            </label>
            <select
              value={globalState.ui.language}
              onChange={(e) => handleLanguageChange(e.currentTarget.value)}
              class="setting-select"
            >
              <For each={languageOptions}>
                {(lang) => (
                  <option value={lang.code}>{lang.name}</option>
                )}
              </For>
            </select>
            <div class="setting-description">
              {t('language_description')}
            </div>
          </div>

          <div class="setting-group">
            <label class="setting-label">
              {t('theme')}
            </label>
            <select
              value={globalState.ui.theme || 'auto'}
              onChange={(e) => handleThemeChange(e.currentTarget.value)}
              class="setting-select"
            >
              <For each={themeOptions}>
                {(theme) => (
                  <option value={theme.value}>{theme.label}</option>
                )}
              </For>
            </select>
            <div class="setting-description">
              {t('theme_description')}
            </div>
          </div>

          <div class="setting-group">
            <label class="checkbox-setting">
              <input
                type="checkbox"
                checked={globalState.ui.darkMode}
                onChange={(e) => globalActions.setDarkMode(e.currentTarget.checked)}
              />
              <span class="checkmark"></span>
              <span class="setting-label">{t('dark_mode')}</span>
            </label>
            <div class="setting-description">
              {t('dark_mode_description')}
            </div>
          </div>
        </div>

        <div class="settings-section">
          <h4>{t('units_and_formatting')}</h4>
          
          <div class="setting-group">
            <label class="setting-label">
              {t('display_units')}
            </label>
            <select
              value={globalState.config.units || 'mm'}
              onChange={(e) => handleUnitsChange(e.currentTarget.value)}
              class="setting-select"
            >
              <For each={unitOptions}>
                {(unit) => (
                  <option value={unit.value}>{unit.label}</option>
                )}
              </For>
            </select>
            <div class="setting-description">
              {t('units_description')}
            </div>
          </div>

          <div class="setting-group">
            <label class="checkbox-setting">
              <input
                type="checkbox"
                checked={globalState.config.showGrid !== false}
                onChange={(e) => globalActions.updateConfig({
                  ...globalState.config,
                  showGrid: e.currentTarget.checked
                })}
              />
              <span class="checkmark"></span>
              <span class="setting-label">{t('show_grid')}</span>
            </label>
            <div class="setting-description">
              {t('show_grid_description')}
            </div>
          </div>

          <div class="setting-group">
            <label class="checkbox-setting">
              <input
                type="checkbox"
                checked={globalState.config.showRulers !== false}
                onChange={(e) => globalActions.updateConfig({
                  ...globalState.config,
                  showRulers: e.currentTarget.checked
                })}
              />
              <span class="checkmark"></span>
              <span class="setting-label">{t('show_rulers')}</span>
            </label>
            <div class="setting-description">
              {t('show_rulers_description')}
            </div>
          </div>
        </div>

        <div class="settings-section">
          <h4>{t('layout_preferences')}</h4>
          
          <div class="setting-group">
            <label class="setting-label">
              {t('parts_panel_width')}
            </label>
            <div class="input-with-button">
              <input
                type="number"
                min="200"
                max="600"
                value={globalState.ui.panels.partsWidth || 300}
                onInput={(e) => globalActions.setPanelWidth('partsWidth', parseInt(e.currentTarget.value) || 300)}
                class="number-input"
              />
              <button 
                class="button secondary"
                onClick={handlePanelWidthReset}
              >
                {t('reset')}
              </button>
            </div>
            <div class="setting-description">
              {t('panel_width_description')}
            </div>
          </div>

          <div class="setting-group">
            <label class="checkbox-setting">
              <input
                type="checkbox"
                checked={globalState.ui.showTooltips !== false}
                onChange={(e) => globalActions.setShowTooltips(e.currentTarget.checked)}
              />
              <span class="checkmark"></span>
              <span class="setting-label">{t('show_tooltips')}</span>
            </label>
            <div class="setting-description">
              {t('tooltips_description')}
            </div>
          </div>

          <div class="setting-group">
            <label class="checkbox-setting">
              <input
                type="checkbox"
                checked={globalState.ui.showStatusBar !== false}
                onChange={(e) => globalActions.setShowStatusBar(e.currentTarget.checked)}
              />
              <span class="checkmark"></span>
              <span class="setting-label">{t('show_status_bar')}</span>
            </label>
            <div class="setting-description">
              {t('status_bar_description')}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UIPreferences;