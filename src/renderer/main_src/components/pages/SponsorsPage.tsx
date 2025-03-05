import type { Component } from 'solid-js';
import { useI18n } from '@renderer/contexts/AppContext';

const SponsorsPage: Component = () => {
  const { t } = useI18n();

  return (
    <div class="p-6 dark:bg-gray-900 dark:text-white">
      <h1 class="text-3xl font-bold mb-4">{t('sponsors')}</h1>
      <p class="text-gray-700 dark:text-gray-300 mb-6">{t('sponsors.description')}</p>

      <div class="my-5 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <h2 class="text-2xl font-semibold mb-4">{t('sponsors.premium')}</h2>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Sponsor Cards */}
          <div class="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-600 flex flex-col items-center">
            <div class="w-24 h-24 bg-gray-200 dark:bg-gray-600 rounded-full mb-3 flex items-center justify-center text-4xl">🏢</div>
            <h3 class="text-lg font-semibold">{t('sponsors.company1')}</h3>
            <p class="text-sm text-gray-500 dark:text-gray-400 text-center mt-2">{t('sponsors.since', { year: '2022' })}</p>
          </div>

          <div class="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-600 flex flex-col items-center">
            <div class="w-24 h-24 bg-gray-200 dark:bg-gray-600 rounded-full mb-3 flex items-center justify-center text-4xl">🏭</div>
            <h3 class="text-lg font-semibold">{t('sponsors.company2')}</h3>
            <p class="text-sm text-gray-500 dark:text-gray-400 text-center mt-2">{t('sponsors.since', { year: '2021' })}</p>
          </div>
        </div>
      </div>

      <div class="my-5 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <h2 class="text-2xl font-semibold mb-4">{t('sponsors.supporters')}</h2>
        <ul class="list-disc list-inside text-gray-700 dark:text-gray-300">
          <li>{t('sponsors.person1')}</li>
          <li>{t('sponsors.org1')}</li>
          <li>{t('sponsors.org2')}</li>
        </ul>
      </div>
    </div>
  );
};

export default SponsorsPage;
