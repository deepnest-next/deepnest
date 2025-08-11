import { Component, For, Show } from 'solid-js';
import { Portal } from 'solid-js/web';
import { useTranslation } from '@/utils/i18n';
import type { KeyboardShortcut } from '@/hooks/useKeyboardShortcuts';
import { formatShortcut } from '@/hooks/useKeyboardShortcuts';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
  shortcuts: KeyboardShortcut[];
}

interface ShortcutSection {
  title: string;
  shortcuts: KeyboardShortcut[];
}

const KeyboardShortcutsModal: Component<KeyboardShortcutsModalProps> = (props) => {
  const [t] = useTranslation('common');

  const shortcutSections: ShortcutSection[] = [
    {
      title: 'Navigation',
      shortcuts: props.shortcuts.filter(s => 
        s.description.toLowerCase().includes('nav') || 
        s.description.toLowerCase().includes('switch') ||
        s.description.toLowerCase().includes('tab')
      ),
    },
    {
      title: 'Selection',
      shortcuts: props.shortcuts.filter(s => 
        s.description.toLowerCase().includes('select') ||
        s.description.toLowerCase().includes('deselect')
      ),
    },
    {
      title: 'Actions',
      shortcuts: props.shortcuts.filter(s => 
        s.description.toLowerCase().includes('duplicate') ||
        s.description.toLowerCase().includes('delete') ||
        s.description.toLowerCase().includes('export') ||
        s.description.toLowerCase().includes('import') ||
        s.description.toLowerCase().includes('save')
      ),
    },
    {
      title: 'Viewport',
      shortcuts: props.shortcuts.filter(s => 
        s.description.toLowerCase().includes('zoom') ||
        s.description.toLowerCase().includes('pan') ||
        s.description.toLowerCase().includes('fit') ||
        s.description.toLowerCase().includes('reset')
      ),
    },
    {
      title: 'General',
      shortcuts: props.shortcuts.filter(s => 
        !s.description.toLowerCase().includes('nav') &&
        !s.description.toLowerCase().includes('switch') &&
        !s.description.toLowerCase().includes('tab') &&
        !s.description.toLowerCase().includes('select') &&
        !s.description.toLowerCase().includes('deselect') &&
        !s.description.toLowerCase().includes('duplicate') &&
        !s.description.toLowerCase().includes('delete') &&
        !s.description.toLowerCase().includes('export') &&
        !s.description.toLowerCase().includes('import') &&
        !s.description.toLowerCase().includes('save') &&
        !s.description.toLowerCase().includes('zoom') &&
        !s.description.toLowerCase().includes('pan') &&
        !s.description.toLowerCase().includes('fit') &&
        !s.description.toLowerCase().includes('reset')
      ),
    },
  ].filter(section => section.shortcuts.length > 0);

  const handleBackdropClick = (event: MouseEvent) => {
    if (event.target === event.currentTarget) {
      props.onClose();
    }
  };

  return (
    <Show when={props.isOpen}>
      <Portal>
        <div 
          class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={handleBackdropClick}
        >
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                  <svg class="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                  </svg>
                </div>
                <div>
                  <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100">Keyboard Shortcuts</h2>
                  <p class="text-sm text-gray-500 dark:text-gray-400">Navigate and control the application using keyboard shortcuts</p>
                </div>
              </div>
              <button
                onClick={props.onClose}
                class="p-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div class="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <For each={shortcutSections}>
                  {(section) => (
                    <div class="space-y-3">
                      <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2">
                        {section.title}
                      </h3>
                      <div class="space-y-2">
                        <For each={section.shortcuts}>
                          {(shortcut) => (
                            <div class="flex items-center justify-between py-2 px-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                              <span class="text-sm text-gray-700 dark:text-gray-300">
                                {shortcut.description}
                              </span>
                              <div class="flex items-center gap-1">
                                <For each={formatShortcut(shortcut).split(' + ')}>
                                  {(key, index) => (
                                    <>
                                      <Show when={index() > 0}>
                                        <span class="text-xs text-gray-400 dark:text-gray-500">+</span>
                                      </Show>
                                      <kbd class="px-2 py-1 bg-white dark:bg-gray-600 border border-gray-200 dark:border-gray-500 rounded text-xs font-mono text-gray-600 dark:text-gray-300 shadow-sm">
                                        {key}
                                      </kbd>
                                    </>
                                  )}
                                </For>
                              </div>
                            </div>
                          )}
                        </For>
                      </div>
                    </div>
                  )}
                </For>
              </div>
            </div>

            {/* Footer */}
            <div class="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
              <div class="flex items-center justify-between">
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  Press <kbd class="px-2 py-1 bg-white dark:bg-gray-600 border border-gray-200 dark:border-gray-500 rounded text-xs font-mono text-gray-600 dark:text-gray-300 shadow-sm">?</kbd> anytime to show this help
                </p>
                <button
                  onClick={props.onClose}
                  class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      </Portal>
    </Show>
  );
};

export default KeyboardShortcutsModal;