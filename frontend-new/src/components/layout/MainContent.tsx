import { Component, Switch, Match, lazy, Suspense } from 'solid-js';
import { globalState } from '@/stores/global.store';
import LoadingSpinner from '../common/LoadingSpinner';

// Lazy load panels for better initial load performance
const PartsPanel = lazy(() => import('../parts/PartsPanel'));
const NestingPanel = lazy(() => import('../nesting/NestingPanel'));
const SheetsPanel = lazy(() => import('../sheets/SheetsPanel'));
const SettingsPanel = lazy(() => import('../settings/SettingsPanel'));
const ImprintPanel = lazy(() => import('../imprint/ImprintPanel'));

const MainContent: Component = () => {
  return (
    <main class="flex-1 overflow-hidden bg-gray-50 dark:bg-gray-900 w-full h-full">
      <Suspense fallback={
        <div class="flex items-center justify-center h-full">
          <LoadingSpinner size="large" />
        </div>
      }>
        <Switch>
          <Match when={globalState.ui.activeTab === 'parts'}>
            <PartsPanel />
          </Match>
          <Match when={globalState.ui.activeTab === 'nests'}>
            <NestingPanel />
          </Match>
          <Match when={globalState.ui.activeTab === 'sheets'}>
            <SheetsPanel />
          </Match>
          <Match when={globalState.ui.activeTab === 'settings'}>
            <SettingsPanel />
          </Match>
          <Match when={globalState.ui.activeTab === 'imprint'}>
            <ImprintPanel />
          </Match>
        </Switch>
      </Suspense>
    </main>
  );
};

export default MainContent;
