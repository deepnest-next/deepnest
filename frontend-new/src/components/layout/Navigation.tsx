import { Component, For } from 'solid-js';
import { useTranslation } from '@/utils/i18n';
import { globalState, globalActions } from '@/stores/global.store';

const Navigation: Component = () => {
  const [t] = useTranslation('navigation');

  const navigationItems = [
    { key: 'parts', label: t('parts'), icon: '📦' },
    { key: 'nests', label: t('nests'), icon: '🎯' },
    { key: 'sheets', label: t('sheets'), icon: '📄' },
    { key: 'config', label: t('settings'), icon: '⚙️' }
  ];

  const setActiveTab = (tab: typeof globalState.ui.activeTab) => {
    globalActions.setActiveTab(tab);
  };

  return (
    <nav class="navigation">
      <ul class="nav-list">
        <For each={navigationItems}>
          {(item) => (
            <li class="nav-item">
              <button
                class={`nav-button ${globalState.ui.activeTab === item.key ? 'active' : ''}`}
                onClick={() => setActiveTab(item.key as any)}
              >
                <span class="nav-icon">{item.icon}</span>
                <span class="nav-label">{item.label}</span>
              </button>
            </li>
          )}
        </For>
      </ul>
    </nav>
  );
};

export default Navigation;