import type { Component } from 'solid-js';
import { createEffect } from 'solid-js';
import { useI18n, useThemeToggle } from '../../contexts/AppContext';

const SettingsPage: Component = () => {
  const { locale, setLocale, t } = useI18n();
  const { isDark, toggleTheme } = useThemeToggle();

  createEffect(() => {
    console.log("Current language in SettingsPage:", locale());
  });

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'de', name: 'Deutsch' },
    { code: 'es', name: 'Español' },
    { code: 'fr', name: 'Français' }
  ];

  const handleLanguageChange = (langCode: string) => {
    console.log("Changing language to:", langCode);
    setLocale(langCode as any);
  };

  return (
    <div class="p-6 dark:bg-gray-900 dark:text-white">
      <h1 class="text-3xl font-bold mb-4">{t('settings')}</h1>
      <p class="text-gray-700 dark:text-gray-300 mb-6">{t('settings.description')}</p>

      <div class="my-5 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <h2 class="text-2xl font-semibold mb-4">{t('general.settings')}</h2>

        {/* Language Settings */}
        <div class="mb-6">
          <h3 class="text-xl font-medium mb-3">{t('language.settings')}</h3>
          <div class="flex flex-wrap gap-2">
            {languages.map((lang) => (
              <button
                class={`px-4 py-2 rounded-md transition-colors ${
                  locale() === lang.code
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
                onClick={() => handleLanguageChange(lang.code)}
              >
                {lang.name}
              </button>
            ))}
          </div>
          <p class="mt-2 text-sm text-gray-500">
            Current language: {locale()}
          </p>
        </div>

        {/* Theme Settings */}
        <div class="mb-6">
          <h3 class="text-xl font-medium mb-3">{t('theme.settings')}</h3>
          <button
            class="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
            onClick={toggleTheme}
          >
            {isDark() ? t('theme.light') : t('theme.dark')}
          </button>
        </div>

        {/* Additional settings controls would go here */}
      </div>
    </div>
  );
};

export default SettingsPage;
