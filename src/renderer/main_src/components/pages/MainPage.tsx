import type { Component } from 'solid-js';
import { useThemeToggle, useI18n } from '@renderer/contexts/AppContext';

const MainPage: Component = () => {
  const { isDark, toggleTheme } = useThemeToggle();
  const { t } = useI18n();

  return (
    <div class="bg-white dark:bg-gray-800 p-5 rounded-lg shadow-md transition-colors duration-300">
      <h1 class="text-2xl font-bold mb-4 text-gray-800 dark:text-white">{t('main')}</h1>
      <p class="mb-4 text-gray-700 dark:text-gray-300">
        {t('main.description')}
      </p>

      <div class="flex flex-col gap-4">
        <div class="bg-white dark:bg-gray-900 p-4 rounded-md shadow border border-gray-200 dark:border-gray-700">
          <h2 class="font-semibold text-lg mb-2 text-gray-800 dark:text-white">{t('main.card.title')}</h2>
          <p class="text-gray-500 dark:text-gray-400">
            {t('main.card.description')}
          </p>
          <p class="text-xl">{t('main.text.size', { size: '20px' })}</p>
          <p class="text-lg">{t('main.text.size', { size: '18px' })}</p>
          <p class="text-base">{t('main.text.size', { size: '16px' })}</p>
          <p class="text-sm">{t('main.text.size', { size: '14px' })}</p>
          <p class="text-xs">{t('main.text.size', { size: '12px' })}</p>
          <p class="text-2xs">{t('main.text.size', { size: '10px' })}</p>
          <p class="text-3xs">{t('main.text.size', { size: '8px' })}</p>
          <p class="text-4xs">{t('main.text.size', { size: '6px' })}</p>
        </div>

        <div class="flex gap-2">
          <button
            class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
            onClick={toggleTheme}
          >
            {isDark() ? t('theme.light') : t('theme.dark')}
          </button>
        </div>
      </div>
    </div>
  )
};

export default MainPage;
