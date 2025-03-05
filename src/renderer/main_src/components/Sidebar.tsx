import type { Component } from 'solid-js'
import { usePage, PageType } from '../contexts/AppContext'
import { createSignal } from 'solid-js';

// Menu item component
const MenuItem: Component<{
  icon: string;
  name: string;
  active: boolean;
  page: PageType;
  onClick: (page: PageType) => void;
  isExpanded: boolean;
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
        gap: '10px',
        'justify-content': 'flex-start',
        position: 'relative',
        overflow: 'hidden',
        'min-height': '24px'
      }}
    >
      <span style={{
        'flex-shrink': 0,
        width: '24px',
        'text-align': 'center'
      }}>{props.icon}</span>
      <span style={{
        'white-space': 'nowrap',
        'max-width': props.isExpanded ? '150px' : '0px',
        'opacity': props.isExpanded ? 1 : 0,
        'overflow': 'hidden',
        'transition': 'max-width 0.3s ease, opacity 0.2s ease',
        'transition-delay': props.isExpanded ? '0.1s' : '0s'
      }}>{props.name}</span>
    </div>
  )
}

const Sidebar: Component = () => {
  const { active, setActive } = usePage();
  const [isExpanded, setIsExpanded] = createSignal(false);

  // Create a local handler to ensure proper function call
  const handleSetActive = (page: PageType) => {
    console.log("Sidebar handling page change to:", page);
    setActive(page);
  };

  return (
    <div
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
      style={{
        width: isExpanded() ? '220px' : '64px',
        background: 'rgb(10 11 12)',
        padding: '6px',
        'box-shadow': '0 4px 6px rgba(0, 0, 0, 0.1)',
        display: 'flex',
        'flex-direction': 'column',
        height: '100%',
        transition: 'all 0.3s ease',
        overflow: 'hidden'
      }}>
      <div style={{
        'margin-bottom': '30px',
        height: '24px',
        display: 'flex',
        'align-items': 'center',
        position: 'relative'
      }}>
        <h1 style={{
          'font-size': '20px',
          'font-weight': 'bold',
          margin: 0,
          color: 'white',
          position: 'absolute',
          left: 0,
          width: '100%',
          'text-align': isExpanded() ? 'left' : 'center',
          transition: 'all 0.3s ease'
        }}>
          {isExpanded() ? 'Deepnest' : 'DN'}
        </h1>
      </div>

      {/* Main navigation items */}
      <div>
        <MenuItem
          icon="🏠"
          name="Main"
          active={active() === 'main'}
          page='main'
          onClick={handleSetActive}
          isExpanded={isExpanded()}
        />

        <MenuItem
          icon="⚙️"
          name="Settings"
          active={active() === 'settings'}
          page='settings'
          onClick={handleSetActive}
          isExpanded={isExpanded()}
        />

        <MenuItem
          icon="👤"
          name="Account"
          active={active() === 'account'}
          page='account'
          onClick={handleSetActive}
          isExpanded={isExpanded()}
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
          isExpanded={isExpanded()}
        />

        <MenuItem
          icon="📄"
          name="Impressum"
          active={active() === 'impressum'}
          page='impressum'
          onClick={handleSetActive}
          isExpanded={isExpanded()}
        />
      </div>
    </div>
  )
}

export default Sidebar
