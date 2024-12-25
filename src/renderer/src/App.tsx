import { createSignal } from 'solid-js'
import type { Component } from 'solid-js'

const App: Component = () => {
  const [active, setActive] = createSignal('main')

  return (
    <div style={{ display: 'flex', width: '100vw', height: '100vh' }}>
      {/* Sidebar */}
      <div
        style={{
          width: '60px',
          'background-color': '#2c3e50',
          display: 'flex',
          'flex-direction': 'column',
          'align-items': 'center',
          padding: '10px'
        }}
      >
        <div
          style={{
            padding: '10px',
            cursor: 'pointer',
            color: active() === 'main' ? '#ecf0f1' : '#7f8c8d'
          }}
          onClick={() => setActive('main')}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            width="24px"
            height="24px"
          >
            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
          </svg>
        </div>
        <div
          style={{
            padding: '10px',
            cursor: 'pointer',
            color: active() === 'settings' ? '#ecf0f1' : '#7f8c8d'
          }}
          onClick={() => setActive('settings')}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            width="24px"
            height="24px"
          >
            <path d="M19.14,12.94a7.27,7.27,0,0,0,0-1.88l2-1.56a.5.5,0,0,0,.12-.64l-2-3.46a.5.5,0,0,0-.61-.21l-2.34.93a7.29,7.29,0,0,0-1.63-.95L14.11,2.4a.5.5,0,0,0-.5-.4H10.39a.5.5,0,0,0-.5.4L9.31,5.1a7.29,7.29,0,0,0-1.63.95L5.34,5.12a.5.5,0,0,0-.61.21L2.71,8.79a.5.5,0,0,0,.12.64l2,1.56a7.27,7.27,0,0,0,0,1.88l-2,1.56a.5.5,0,0,0-.12.64l2,3.46a.5.5,0,0,0,.61.21l2.34-.93a7.29,7.29,0,0,0,1.63.95l.58,2.7a.5.5,0,0,0,.5.4h3.22a.5.5,0,0,0,.5-.4l.58-2.7a7.29,7.29,0,0,0,1.63-.95l2.34.93a.5.5,0,0,0,.61-.21l2-3.46a.5.5,0,0,0-.12-.64Zm-7.14,2.26A3.2,3.2,0,1,1,15.2,12,3.2,3.2,0,0,1,12,15.2Z" />
          </svg>
        </div>
        <div
          style={{
            padding: '10px',
            cursor: 'pointer',
            color: active() === 'account' ? '#ecf0f1' : '#7f8c8d'
          }}
          onClick={() => setActive('account')}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            width="24px"
            height="24px"
          >
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
          </svg>
        </div>
        <div
          style={{
            padding: '10px',
            cursor: 'pointer',
            color: active() === 'impressum' ? '#ecf0f1' : '#7f8c8d'
          }}
          onClick={() => setActive('impressum')}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            width="24px"
            height="24px"
          >
            <path d="M11 7h2v2h-2V7zm0 4h2v6h-2v-6zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
          </svg>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ 'flex-grow': '1', padding: '20px' }}>
        {active() === 'main' && <h1>Hauptseite</h1>}
        {active() === 'settings' && <h1>Einstellungen</h1>}
        {active() === 'account' && <h1>Account</h1>}
        {active() === 'impressum' && <h1>Impressum</h1>}
      </div>
    </div>
  )
}

export default App
