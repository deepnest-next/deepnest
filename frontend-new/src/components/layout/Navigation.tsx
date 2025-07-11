import { Component, For } from 'solid-js';
import { useTranslation } from '@/utils/i18n';
import { globalState, globalActions } from '@/stores/global.store';
import type { UIState } from '@/types/store.types';

interface NavigationTab {
  id: UIState['activeTab'];
  labelKey: string;
  icon: string;
}

const Navigation: Component = () => {
  const [t] = useTranslation('navigation');

  const tabs: NavigationTab[] = [
    { id: 'parts', labelKey: 'parts', icon: '📦' },
    { id: 'nests', labelKey: 'nests', icon: '🔧' },
    { id: 'sheets', labelKey: 'sheets', icon: '📄' },
    { id: 'settings', labelKey: 'settings', icon: '⚙️' }
  ];

  const handleTabClick = (tabId: UIState['activeTab']) => {
    globalActions.setActiveTab(tabId);
  };

  return (
    <nav class="nav-base w-nav flex flex-col">
      <div class="flex flex-col">
        <For each={tabs}>
          {(tab) => (
            <button
              class={`nav-item flex items-center p-4 text-left transition-colors duration-200 ${
                globalState.ui.activeTab === tab.id ? 'nav-item-active' : ''
              }`}
              onClick={() => handleTabClick(tab.id)}
              title={t(tab.labelKey)}
            >
              <span class="text-lg mr-3">{tab.icon}</span>
              <span class="text-sm font-medium">{t(tab.labelKey)}</span>
            </button>
          )}
        </For>
      </div>
    </nav>
  );
};

export default Navigation;