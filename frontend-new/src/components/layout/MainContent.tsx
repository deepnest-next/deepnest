import { Component, Switch, Match } from 'solid-js';
import { globalState } from '@/stores/global.store';
import PartsPanel from '../parts/PartsPanel';
import NestingPanel from '../nesting/NestingPanel';
import SheetsPanel from '../sheets/SheetsPanel';
import SettingsPanel from '../settings/SettingsPanel';

const MainContent: Component = () => {
  return (
    <main class="main-content">
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
      </Switch>
    </main>
  );
};

export default MainContent;