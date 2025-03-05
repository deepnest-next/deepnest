import type { Component } from 'solid-js'
import { usePage, PageType, useThemeToggle } from '../contexts/AppContext'
import { createSignal } from 'solid-js';

// Menu item component with updated Tailwind classes
const MenuItem: Component<{
  icon: string;
  name: string;
  active: boolean;
  page: PageType;
  onClick: (page: PageType) => void;
  isExpanded: boolean;
}> = (props) => {
  const [isHovered, setIsHovered] = createSignal(false);

  const handleClick = () => {
    console.log("MenuItem clicked:", props.page);
    props.onClick(props.page);
  };

  return (
    <div
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      class={`
        py-3 px-4 my-1 cursor-pointer rounded-md relative overflow-hidden min-h-[24px]
        flex items-center transition-colors duration-200
        ${props.active
          ? 'bg-blue-600 dark:bg-blue-500 text-white'
          : isHovered()
            ? 'bg-gray-200/50 dark:bg-white/10 text-gray-700 dark:text-white'
            : 'text-gray-500 dark:text-gray-400'}
      `}
    >
      <div
        class={`
          absolute left-4 w-6 text-center transition-transform
          ${isHovered() && !props.active ? 'scale-110' : 'scale-100'}
        `}
      >
        {props.icon}
      </div>

      <div
        class={`
          ml-11 whitespace-nowrap overflow-hidden transition-all duration-300
          ${props.isExpanded ? 'max-w-[150px] opacity-100' : 'max-w-0 opacity-0'}
        `}
      >
        {props.name}
      </div>
    </div>
  )
}

// Theme Toggle Button Component with updated Tailwind classes
const ThemeToggle: Component<{isExpanded: boolean}> = (props) => {
  const { isDark, toggleTheme } = useThemeToggle();
  const [isHovered, setIsHovered] = createSignal(false);

  return (
    <div
      onClick={toggleTheme}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      class={`
        py-3 px-4 my-1 cursor-pointer rounded-md relative overflow-hidden min-h-[24px]
        flex items-center transition-colors duration-200
        ${isHovered()
          ? 'bg-gray-200/50 dark:bg-white/10 text-gray-700 dark:text-white'
          : 'text-gray-500 dark:text-gray-400'}
      `}
    >
      <div
        class={`
          absolute left-4 w-6 text-center transition-transform
          ${isHovered() ? 'scale-110' : 'scale-100'}
        `}
      >
        {isDark() ? '🌙' : '☀️'}
      </div>

      <div
        class={`
          ml-11 whitespace-nowrap overflow-hidden transition-all duration-300
          ${props.isExpanded ? 'max-w-[150px] opacity-100' : 'max-w-0 opacity-0'}
        `}
      >
        {isDark() ? 'Light Mode' : 'Dark Mode'}
      </div>
    </div>
  );
};

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
      class={`
        absolute top-0 left-0 h-full z-10 flex flex-col p-1
        transition-all duration-300 overflow-hidden
        ${isExpanded() ? 'w-[220px]' : 'w-[64px]'}
        bg-sidebar dark:bg-sidebar-dark shadow-lg
      `}
    >
      {/* Simplified header section */}
      <div class="relative h-6 mb-7 py-3">
        {/* Collapsed title */}
        <h1 class={`
          absolute left-3 text-lg font-bold m-0 transition-opacity duration-300
          ${isExpanded() ? 'opacity-0' : 'opacity-100'}
          text-gray-800 dark:text-white
        `}>
          DN
        </h1>

        {/* Expanded title */}
        <h1 class={`
          absolute left-3 text-lg font-bold m-0 transition-opacity duration-300
          ${isExpanded() ? 'opacity-100' : 'opacity-0'}
          text-gray-800 dark:text-white
        `}>
          Deepnest
        </h1>
      </div>

      {/* Theme toggle button placed below the header */}
      <ThemeToggle isExpanded={isExpanded()} />

      <div>
        {/* Divider line */}
        <div class="h-px bg-gray-200 dark:bg-gray-700 mx-2.5 transition-colors duration-300"></div>
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
          icon="📊"
          name="Nesting"
          active={active() === 'nesting'}
          page='nesting'
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
      <div class="flex-grow"></div>

      {/* Footer navigation items */}
      <div>
        {/* Neuer Menüpunkt für Sponsoren an erster Stelle im Footer */}
        <MenuItem
          icon="❤️"
          name="Sponsoren"
          active={active() === 'sponsors'}
          page='sponsors'
          onClick={handleSetActive}
          isExpanded={isExpanded()}
        />

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
