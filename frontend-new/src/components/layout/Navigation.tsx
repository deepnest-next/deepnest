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
    <nav class="navigation">
      <div class="nav-tabs">
        <For each={tabs}>
          {(tab) => (
            <button
              class={`nav-tab ${globalState.ui.activeTab === tab.id ? 'active' : ''}`}
              onClick={() => handleTabClick(tab.id)}
              title={t(tab.labelKey)}
            >
              <span class="nav-tab-icon">{tab.icon}</span>
              <span class="nav-tab-label">{t(tab.labelKey)}</span>
            </button>
          )}
        </For>
      </div>
    </nav>
  );
};

export default Navigation;