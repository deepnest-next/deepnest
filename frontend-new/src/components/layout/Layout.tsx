import { Component } from 'solid-js';
import Header from './Header';
import Navigation from './Navigation';
import MainContent from './MainContent';
import StatusBar from './StatusBar';
import ResizableLayout from './ResizableLayout';

const Layout: Component = () => {
  return (
    <div class="layout">
      <Header />
      <div class="layout-body">
        <ResizableLayout
          left={<Navigation />}
          right={<MainContent />}
          minLeftWidth={200}
          maxLeftWidth={600}
          defaultLeftWidth={300}
        />
      </div>
      <StatusBar />
    </div>
  );
};

export default Layout;