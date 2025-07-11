import { Component, createEffect, onMount, createSignal, Suspense } from "solid-js";
import { globalState, globalActions } from "./stores/global.store";
import { ipcService } from "./services/ipc.service";
import { useTranslation } from "./utils/i18n";
import { useKeyboardShortcuts, createShortcut } from "./hooks/useKeyboardShortcuts";
import { preloadComponent } from "./utils/lazyLoad";
import Layout from "./components/layout/Layout";
import KeyboardShortcutsModal from "./components/common/KeyboardShortcutsModal";
import LoadingSpinner from "./components/common/LoadingSpinner";

const App: Component = () => {
  const [t] = useTranslation('common');
  const [showShortcutsModal, setShowShortcutsModal] = createSignal(false);

  // Global keyboard shortcuts
  const shortcuts = useKeyboardShortcuts([
    createShortcut('?', () => setShowShortcutsModal(true), 'Show keyboard shortcuts help'),
    createShortcut('Escape', () => setShowShortcutsModal(false), 'Close modal/dialog'),
    createShortcut('1', () => globalActions.setCurrentPanel('parts'), 'Switch to Parts panel', { ctrl: true }),
    createShortcut('2', () => globalActions.setCurrentPanel('nests'), 'Switch to Nests panel', { ctrl: true }),
    createShortcut('3', () => globalActions.setCurrentPanel('sheets'), 'Switch to Sheets panel', { ctrl: true }),
    createShortcut('4', () => globalActions.setCurrentPanel('settings'), 'Switch to Settings panel', { ctrl: true }),
    createShortcut('5', () => globalActions.setCurrentPanel('imprint'), 'Switch to Imprint panel', { ctrl: true }),
    createShortcut('n', () => globalActions.startNesting(), 'Start nesting', { ctrl: true }),
    createShortcut('s', () => {
      // Save current state - placeholder for now
      console.log('Save shortcut triggered');
    }, 'Save current state', { ctrl: true }),
    createShortcut('i', () => {
      // Import parts - placeholder for now
      console.log('Import shortcut triggered');
    }, 'Import parts', { ctrl: true }),
    createShortcut('e', () => {
      // Export results - placeholder for now
      console.log('Export shortcut triggered');
    }, 'Export results', { ctrl: true }),
    createShortcut('d', () => globalActions.toggleDarkMode(), 'Toggle dark mode', { ctrl: true, shift: true }),
    createShortcut('r', () => {
      // Reset view - placeholder for now
      console.log('Reset view shortcut triggered');
    }, 'Reset viewport', { ctrl: true }),
    createShortcut('f', () => {
      // Fit to content - placeholder for now
      console.log('Fit to content shortcut triggered');
    }, 'Fit viewport to content', { ctrl: true }),
  ]);

  // Reactive effect to apply dark mode changes
  createEffect(() => {
    const isDark = globalState.ui.darkMode;
    if (typeof document !== "undefined") {
      document.documentElement.classList.toggle("dark", isDark);
      // Also set a data attribute for additional styling if needed
      document.documentElement.setAttribute(
        "data-theme",
        isDark ? "dark" : "light",
      );
    }
  });

  onMount(async () => {
    // Initialize IPC listeners
    setupIPCListeners();

    // Load initial configuration if IPC is available
    if (ipcService.isAvailable) {
      try {
        const config = await ipcService.readConfig();
        globalActions.updateConfig(config);
      } catch (error) {
        console.warn("Failed to load initial config:", error);
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
    <div
      class={`app min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-200`}
    >
      <Layout />
      
      {/* Keyboard Shortcuts Modal */}
      <KeyboardShortcutsModal
        isOpen={showShortcutsModal()}
        onClose={() => setShowShortcutsModal(false)}
        shortcuts={shortcuts.shortcuts}
      />
    </div>
  );
};

export default App;
