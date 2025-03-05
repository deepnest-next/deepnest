import type { Component } from 'solid-js';
import { useI18n } from '@renderer/contexts/AppContext';

const PrivacyPage: Component = () => {
  const { t } = useI18n();

  return (
    <div class="p-6 dark:bg-gray-900 dark:text-white">
      <h1 class="text-3xl font-bold mb-4">{t('privacy')}</h1>
      <p class="text-gray-700 dark:text-gray-300 mb-6">{t('privacy.description')}</p>

      <div class="my-5 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <h2 class="text-2xl font-semibold mb-4">{t('privacy.policy')}</h2>
        <p class="mb-4">{t('privacy.policy.text')}</p>

        <h3 class="text-xl font-medium mb-2">{t('privacy.data.collection')}</h3>
        <p class="mb-4">{t('privacy.data.collection.text')}</p>

        <h3 class="text-xl font-medium mb-2">{t('privacy.contact')}</h3>
        <p class="mb-1">{t('impressum.company')}</p>
        <p class="mb-1">{t('impressum.street')}</p>
        <p class="mb-1">{t('impressum.city')}</p>
        <p class="mb-1">{t('impressum.country')}</p>
      </div>
    </div>
  );
};

export default PrivacyPage;
