import { createSignal } from 'solid-js'
import type { Component } from 'solid-js'
import Sidebar from './components/Sidebar'
import MainPage from './components/pages/MainPage'
import SettingsPage from './components/pages/SettingsPage'
import AccountPage from './components/pages/AccountPage'
import ImpressumPage from './components/pages/ImpressumPage'

const App: Component = () => {
  const [active, setActive] = createSignal('main')

  return (
    <div style={{ display: 'flex', width: '100vw', height: '100vh' }}>
      {/* Sidebar */}
      <Sidebar active={active()} setActive={setActive} />

      {/* Main Content */}
      <div style={{ 'flex-grow': '1', padding: '20px', 'overflow-y': 'auto' }}>
        {active() === 'main' && <MainPage />}
        {active() === 'settings' && <SettingsPage />}
        {active() === 'account' && <AccountPage />}
        {active() === 'impressum' && <ImpressumPage />}
      </div>
    </div>
  )
}

export default App
