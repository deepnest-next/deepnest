import { Component, For } from 'solid-js';
import { useTranslation } from '@/utils/i18n';
import { globalState, globalActions } from '@/stores/global.store';
import { getVersionInfo } from '@/utils/version';
import type { UIState } from '@/types/store.types';

interface NavigationTab {
  id: UIState['activeTab'];
  labelKey: string;
  icon: string;
}

const Navigation: Component = () => {
  const [t] = useTranslation('common');
  const versionInfo = getVersionInfo();

  const tabs: NavigationTab[] = [
    { id: 'parts', labelKey: 'navigation.parts', icon: '📦' },
    { id: 'nests', labelKey: 'navigation.nests', icon: '🔧' },
    { id: 'sheets', labelKey: 'navigation.sheets', icon: '📄' },
    { id: 'settings', labelKey: 'navigation.settings', icon: '⚙️' }
  ];

  const handleTabClick = (tabId: UIState['activeTab']) => {
    globalActions.setActiveTab(tabId);
  };

  return (
    <nav class="h-full bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col w-full">
      <div class="flex flex-col py-4">
        <div class="px-4 mb-4">
          <h2 class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Navigation</h2>
        </div>
        <For each={tabs}>
          {(tab) => (
            <button
              class={`mx-2 mb-1 flex items-center px-4 py-3 text-left transition-all duration-200 rounded-lg group ${
                globalState.ui.activeTab === tab.id
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100 shadow-sm border border-blue-200 dark:border-blue-700'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
              onClick={() => handleTabClick(tab.id)}
              title={t(tab.labelKey)}
            >
              <span class={`text-xl mr-4 transition-transform duration-200 ${
                globalState.ui.activeTab === tab.id ? 'scale-110' : 'group-hover:scale-105'
              }`}>
                {tab.icon}
              </span>
              <span class="font-medium">{t(tab.labelKey)}</span>
              {globalState.ui.activeTab === tab.id && (
                <div class="ml-auto w-1 h-6 bg-blue-600 dark:bg-blue-400 rounded-full"></div>
              )}
            </button>
          )}
        </For>
      </div>

      <div class="mt-auto">
        <div class="p-2">
          <button
            class={`w-full flex items-center px-4 py-3 text-left transition-all duration-200 rounded-lg group ${
              globalState.ui.activeTab === 'imprint'
                ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100 shadow-sm border border-blue-200 dark:border-blue-700'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100'
            }`}
            onClick={() => handleTabClick('imprint')}
            title={t('navigation.imprint')}
          >
            <span class={`text-xl mr-4 transition-transform duration-200 ${
              globalState.ui.activeTab === 'imprint' ? 'scale-110' : 'group-hover:scale-105'
            }`}>
              ℹ️
            </span>
            <span class="font-medium">{t('navigation.imprint')}</span>
            {globalState.ui.activeTab === 'imprint' && (
              <div class="ml-auto w-1 h-6 bg-blue-600 dark:bg-blue-400 rounded-full"></div>
            )}
          </button>
        </div>
        
        <div class="p-4 border-t border-gray-200 dark:border-gray-700">
          <div class="text-xs text-gray-500 dark:text-gray-400 text-center">
            <div>{versionInfo.name}</div>
            <div class="mt-1 opacity-75">v{versionInfo.version}</div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
