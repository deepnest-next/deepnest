import { Component } from 'solid-js';
import Header from './Header';
import Navigation from './Navigation';
import MainContent from './MainContent';
import StatusBar from './StatusBar';
import ResizableLayout from './ResizableLayout';

const Layout: Component = () => {
  return (
    <div class="h-screen flex flex-col bg-gray-50 text-gray-900 dark:bg-gray-900 dark:text-gray-100">
      <Header />
      <div class="flex-1 flex overflow-hidden">
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