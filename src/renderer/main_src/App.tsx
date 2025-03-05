import type { Component } from 'solid-js'
import { createEffect, onMount } from 'solid-js'
import Sidebar from './components/Sidebar'
import MainPage from './components/pages/MainPage'
import SettingsPage from './components/pages/SettingsPage'
import AccountPage from './components/pages/AccountPage'
import PrivacyPage from './components/pages/PrivacyPage'
import ImpressumPage from './components/pages/ImpressumPage'
import { useSettings, usePage, useI18n, AppProvider } from './contexts/AppContext';

// Notification Component
const Notification: Component = () => {
  const { settings, toggleNotifications } = useSettings();

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
        opacity: settings().notifications ? '1' : '0',
        'pointer-events': settings().notifications ? 'all' : 'none',
        'z-index': 1000
      }}
    >
      <div style={{ display: 'flex', 'align-items': 'center', gap: '10px' }}>
        <span>{settings().notify_data.message}</span>
        <button
          onClick={toggleNotifications}
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
  const { toggleNotifications, setNotifications } = useSettings();
  const { t } = useI18n();

  // Track active page changes
  createEffect(() => {
    console.log("MainContent effect - active page is now:", active());
  });

  onMount(() => {
    // First, set the notification message using i18n
    setNotifications({
      message: t('welcome'),
      type: 'info'
    });

    // Hide the notification after 5 seconds
    setTimeout(() => {

        toggleNotifications();

    }, 5000);
  });

  return (
    <div style={{ 'flex-grow': '1', padding: '20px', 'overflow-y': 'auto', position: 'relative' }}>
      <Notification />
      {active() === 'main' && <MainPage />}
      {active() === 'settings' && <SettingsPage />}
      {active() === 'account' && <AccountPage />}
      {active() === 'impressum' && <ImpressumPage />}
      {active() === 'privacy' && <PrivacyPage />}
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
    <AppProvider>
      <AppLayout />
    </AppProvider>
  );
};

export default App
