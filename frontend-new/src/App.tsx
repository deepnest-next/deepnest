import { Component, createEffect, onMount } from 'solid-js';
import { I18nProvider } from './utils/i18n';
import { globalState, globalActions } from './stores/global.store';
import { ipcService } from './services/ipc.service';
import Layout from './components/layout/Layout';

const App: Component = () => {
  // Reactive effect to apply dark mode changes
  createEffect(() => {
    const isDark = globalState.ui.darkMode;
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', isDark);
      // Also set a data attribute for additional styling if needed
      document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    }
  });

  onMount(async () => {
    // Apply initial dark mode immediately
    globalActions.setDarkMode(globalState.ui.darkMode);

    // Initialize IPC listeners
    setupIPCListeners();

    // Load initial configuration if IPC is available
    if (ipcService.isAvailable) {
      try {
        const config = await ipcService.readConfig();
        globalActions.updateConfig(config);
      } catch (error) {
        console.warn('Failed to load initial config:', error);
      }
    }
  });

  const setupIPCListeners = () => {
    if (!ipcService.isAvailable) return;

    // Nesting progress
    ipcService.onNestProgress((progress) => {
      globalActions.setNestingProgress(progress);
    });

    // Nesting completion
    ipcService.onNestComplete((results) => {
      globalActions.setNests(results);
      globalActions.setNestingStatus(false);
    });

    // Background progress
    ipcService.onBackgroundProgress((data) => {
      globalActions.setNestingProgress(data.progress);
    });

    // Worker status
    ipcService.onWorkerStatus((status) => {
      globalActions.setWorkerStatus(status);
    });

    // Error handling
    ipcService.onNestError((error) => {
      globalActions.setError(error);
      globalActions.setNestingStatus(false);
    });
  };

  return (
    <I18nProvider>
      <div class={`app min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-200`}>
        <Layout />
      </div>
    </I18nProvider>
  );
};

export default App;