import type { Component } from 'solid-js';

const SponsorsPage: Component = () => {
  return (
    <div class="p-6 dark:bg-gray-900 dark:text-white">
      <h1 class="text-3xl font-bold mb-4">Sponsoren</h1>
      <p class="text-gray-700 dark:text-gray-300 mb-6">Wir bedanken uns bei unseren Sponsoren für ihre Unterstützung.</p>

      <div class="my-5 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <h2 class="text-2xl font-semibold mb-4">Premium Sponsoren</h2>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Sponsor Cards */}
          <div class="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-600 flex flex-col items-center">
            <div class="w-24 h-24 bg-gray-200 dark:bg-gray-600 rounded-full mb-3 flex items-center justify-center text-4xl">🏢</div>
            <h3 class="text-lg font-semibold">Firma GmbH</h3>
            <p class="text-sm text-gray-500 dark:text-gray-400 text-center mt-2">Premium Sponsor seit 2022</p>
          </div>

          <div class="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-600 flex flex-col items-center">
            <div class="w-24 h-24 bg-gray-200 dark:bg-gray-600 rounded-full mb-3 flex items-center justify-center text-4xl">🏭</div>
            <h3 class="text-lg font-semibold">Technology AG</h3>
            <p class="text-sm text-gray-500 dark:text-gray-400 text-center mt-2">Premium Sponsor seit 2021</p>
          </div>
        </div>
      </div>

      <div class="my-5 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <h2 class="text-2xl font-semibold mb-4">Unterstützer</h2>
        <ul class="list-disc list-inside text-gray-700 dark:text-gray-300">
          <li>Max Mustermann</li>
          <li>Open Source Collective e.V.</li>
          <li>Entwickler Community Berlin</li>
        </ul>
      </div>
    </div>
  );
};

export default SponsorsPage;
