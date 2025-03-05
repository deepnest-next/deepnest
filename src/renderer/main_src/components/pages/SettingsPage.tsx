import type { Component } from 'solid-js';

const SettingsPage: Component = () => {
  return (
    <div class="p-6 dark:bg-gray-900 dark:text-white">
      <h1 class="text-3xl font-bold mb-4">Einstellungen</h1>
      <p class="text-gray-700 dark:text-gray-300 mb-6">Hier können Sie Ihre Anwendungseinstellungen anpassen.</p>

      <div class="my-5 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <h2 class="text-2xl font-semibold mb-4">Allgemeine Einstellungen</h2>
        {/* Settings controls would go here */}
      </div>
    </div>
  );
};

export default SettingsPage;
