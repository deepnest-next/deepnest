import type { Component } from 'solid-js';

const PrivacyPage: Component = () => {
  return (
    <div class="p-6 dark:bg-gray-900 dark:text-white">
      <h1 class="text-3xl font-bold mb-4">Datenschutz</h1>
      <p class="text-gray-700 dark:text-gray-300 mb-6">Rechtliche Informationen über diese Anwendung.</p>

      <div class="my-5 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <h2 class="text-2xl font-semibold mb-4">Kontaktinformationen</h2>
        <p class="mb-1">Deepnest GmbH</p>
        <p class="mb-1">Musterstraße 123</p>
        <p class="mb-1">12345 Musterstadt</p>
        <p class="mb-1">Deutschland</p>
      </div>
    </div>
  );
};

export default PrivacyPage;
