import { Component } from 'solid-js';
import { globalState } from '@/stores/global.store';
import Header from './Header';
import Navigation from './Navigation';
import MainContent from './MainContent';
import StatusBar from './StatusBar';

const Layout: Component = () => {
  return (
    <div class="layout">
      <Header />
      <div class="layout-body">
        <Navigation />
        <MainContent />
      </div>
      <StatusBar />
    </div>
  );
};

export default Layout;