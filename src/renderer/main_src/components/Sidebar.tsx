import type { Component } from 'solid-js'
import { usePage, PageType } from '../contexts/AppContext'

// Menu item component
const MenuItem: Component<{
  icon: string;
  name: string;
  active: boolean;
  page: PageType;
  onClick: (page: PageType) => void;
}> = (props) => {
  const handleClick = () => {
    console.log("MenuItem clicked:", props.page);
    props.onClick(props.page);
  };

  return (
    <div
      onClick={handleClick}
      style={{
        padding: '12px 15px',
        margin: '5px 0',
        cursor: 'pointer',
        'border-radius': '5px',
        background: props.active ? '#3B82F6' : 'transparent',
        color: props.active ? 'white' : '#374151',
        display: 'flex',
        'align-items': 'center',
        gap: '10px'
      }}
    >
      <span>{props.icon}</span>
      <span>{props.name}</span>
    </div>
  )
}

const Sidebar: Component = () => {
  const { active, setActive } = usePage();

  // Create a local handler to ensure proper function call
  const handleSetActive = (page: PageType) => {
    console.log("Sidebar handling page change to:", page);
    setActive(page);
  };

  return (
    <div style={{
      width: '220px',
      background: 'rgb(10 11 12)',
      padding: '20px',
      'box-shadow': '0 4px 6px rgba(0, 0, 0, 0.1)',
      display: 'flex',
      'flex-direction': 'column',
      height: '100%'
    }}>
      <div style={{ 'margin-bottom': '30px' }}>
        <h1 style={{ 'font-size': '20px', 'font-weight': 'bold', margin: 0, color: 'white' }}>Deepnest</h1>
      </div>

      {/* Main navigation items */}
      <div>
        <MenuItem
          icon="🏠"
          name="Main"
          active={active() === 'main'}
          page='main'
          onClick={handleSetActive}
        />

        <MenuItem
          icon="⚙️"
          name="Settings"
          active={active() === 'settings'}
          page='settings'
          onClick={handleSetActive}
        />

        <MenuItem
          icon="👤"
          name="Account"
          active={active() === 'account'}
          page='account'
          onClick={handleSetActive}
        />
      </div>

      {/* Spacer to push footer items to bottom */}
      <div style={{ 'flex-grow': 1 }}></div>

      {/* Footer navigation items */}
      <div>
        <MenuItem
          icon="📄"
          name="Datenschutz"
          active={active() === 'privacy'}
          page='privacy'
          onClick={handleSetActive}
        />

        <MenuItem
          icon="📄"
          name="Impressum"
          active={active() === 'impressum'}
          page='impressum'
          onClick={handleSetActive}
        />
      </div>
    </div>
  )
}

export default Sidebar
