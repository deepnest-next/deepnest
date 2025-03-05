import type { Component } from 'solid-js'
import { createEffect, onMount, Show } from 'solid-js'
import Sidebar from './components/Sidebar'
import MainPage from './components/pages/MainPage'
import SettingsPage from './components/pages/SettingsPage'
import AccountPage from './components/pages/AccountPage'
import PrivacyPage from './components/pages/PrivacyPage'
import ImpressumPage from './components/pages/ImpressumPage'
import SponsorsPage from './components/pages/SponsorsPage'
import { useSettings, usePage, useI18n, AppProvider, PageType } from './contexts/AppContext';
import NestingPage from './components/pages/NestingPage'

// Notification Component - converted to use Tailwind classes
const Notification: Component = () => {
  const { settings, toggleNotifications } = useSettings();

  return (
    <div
      class={`
        absolute top-3 left-1/2 transform -translate-x-1/2
        bg-gray-800 text-white px-5 py-2.5 rounded shadow-md
        transition-opacity duration-300 z-10
        ${settings().notifications ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
      `}
    >
      <div class="flex items-center gap-2.5">
        <span>{settings().notify_data.message}</span>
        <button
          onClick={toggleNotifications}
          class="bg-transparent border-0 text-white cursor-pointer text-lg leading-none hover:text-gray-300"
          aria-label="Close notification"
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
    <div class="flex-grow overflow-y-auto relative">
      <Notification />
      <div class="p-5 ml-16">
        {active() === 'main' && <MainPage />}
        {active() === 'settings' && <SettingsPage />}
        {active() === 'account' && <AccountPage />}
        {active() === 'impressum' && <ImpressumPage />}
        {active() === 'privacy' && <PrivacyPage />}
        {active() === 'sponsors' && <SponsorsPage />}
      </div>
    </div>
  );
};

// App Layout Component with theme management
const AppLayout: Component = () => {
  const { active } = usePage();
  const { settings } = useSettings();

  // Save theme preference to localStorage when it changes
  createEffect(() => {
    const theme = settings().theme;
    localStorage.setItem('theme', theme);
  });

  return (
    <Show when={active() !== "nesting" as PageType} fallback={<NestingPage />}>
      {/* Updated to use standard Tailwind classes for background */}
      <div class="flex w-screen h-screen bg-white dark:bg-gray-900 text-gray-800 dark:text-white">
        <Sidebar />
        <MainContent />
      </div>
    </Show>
  );
};

// Root App Component with Context Providers
const App: Component = () => {
  // No hooks used here anymore, just providing the context
  return (
    <AppProvider>
      <AppLayout />
    </AppProvider>
  );
};

export default App
