import type { Component } from 'solid-js'
import { createEffect } from 'solid-js'
import Sidebar from './components/Sidebar'
import MainPage from './components/pages/MainPage'
import SettingsPage from './components/pages/SettingsPage'
import AccountPage from './components/pages/AccountPage'
import ImpressumPage from './components/pages/ImpressumPage'
import { NotificationProvider, useNotification } from './contexts/NotificationContext'
import { PageProvider, usePage } from './contexts/PageContext'

// Notification Component
const Notification: Component = () => {
  const { message, show, hideNotification } = useNotification();

  return (
    <div
      style={{
        position: 'absolute',
        top: '10px',
        left: '50%',
        transform: 'translateX(-50%)',
        background: '#333',
        color: 'white',
        padding: '10px 20px',
        'border-radius': '4px',
        'box-shadow': '0 2px 5px rgba(0,0,0,0.2)',
        transition: 'opacity 0.3s ease',
        opacity: show ? '1' : '0',
        'pointer-events': show ? 'all' : 'none',
        'z-index': 1000
      }}
    >
      <div style={{ display: 'flex', 'align-items': 'center', gap: '10px' }}>
        <span>{message}</span>
        <button
          onClick={hideNotification}
          style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}
        >
          ×
        </button>
      </div>
    </div>
  )
}

// Main Content Component
const MainContent: Component = () => {
  const { active } = usePage();

  // Track active page changes
  createEffect(() => {
    console.log("MainContent effect - active page is now:", active());
  });

  return (
    <div style={{ 'flex-grow': '1', padding: '20px', 'overflow-y': 'auto', position: 'relative' }}>
      <Notification />

      <div style={{ 'margin-bottom':'20px', padding: '10px', background: '#f0f0f0', 'border-radius': '4px' }}>
        Current page: {active()}
      </div>

      {active() === 'main' && <MainPage />}
      {active() === 'settings' && <SettingsPage />}
      {active() === 'account' && <AccountPage />}
      {active() === 'impressum' && <ImpressumPage />}
    </div>
  );
};

// App Layout Component
const AppLayout: Component = () => {
  return (
    <div style={{ display: 'flex', width: '100vw', height: '100vh' }}>
      <Sidebar />
      <MainContent />
    </div>
  );
};

// Root App Component with Context Providers
const App: Component = () => {
  return (
    <NotificationProvider>
      <PageProvider>
        <AppLayout />
      </PageProvider>
    </NotificationProvider>
  );
};

export default App
