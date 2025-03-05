import { usePage, useI18n } from '@renderer/contexts/AppContext'
import type { Component } from 'solid-js'

const NestingPage: Component = () => {
  const { setActive } = usePage();
  const { t } = useI18n();

  return (
    <div class="p-6 dark:bg-gray-900 dark:text-white">
      <h1 class="text-3xl font-bold mb-4">{t('nesting')}</h1>
      <p class="text-gray-700 dark:text-gray-300">{t('nesting.description')}</p>
      <button
        class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors mt-4"
        onClick={() => setActive('main')}
      >
        {t('back.to.home')}
      </button>
    </div>
  )
}

export default NestingPage
