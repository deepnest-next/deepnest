import type { Component } from 'solid-js';
import { useThemeToggle } from '../../contexts/AppContext';

const MainPage: Component = () => {
  const { isDark, toggleTheme } = useThemeToggle();

  return (
    <div class="bg-white dark:bg-gray-800 p-5 rounded-lg shadow-md transition-colors duration-300">
      <h1 class="text-2xl font-bold mb-4 text-gray-800 dark:text-white">Main Page</h1>
      <p class="mb-4 text-gray-700 dark:text-gray-300">
        This component uses Tailwind classes with dark mode support
      </p>

      <div class="flex flex-col gap-4">
        <div class="bg-white dark:bg-gray-900 p-4 rounded-md shadow border border-gray-200 dark:border-gray-700">
          <h2 class="font-semibold text-lg mb-2 text-gray-800 dark:text-white">Card Title</h2>
          <p class="text-gray-500 dark:text-gray-400">
            This card demonstrates nested dark mode styling with Tailwind
          </p>
          <p class="text-xs">kleiner Text (10px)</p>
          <p class="text-2xs">Sehr kleiner Text (10px)</p>
          <p class="text-3xs">Noch kleinerer Text (8px)</p>
          <p class="text-4xs">Winziger Text (6px)</p>
        </div>

        <div class="flex gap-2">
          <button
            class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
            onClick={toggleTheme}
          >
            Switch to {isDark() ? 'Light' : 'Dark'} Mode
          </button>
        </div>
      </div>
    </div>
  )
};

export default MainPage;
