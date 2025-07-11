import { createSignal, createEffect, onCleanup } from 'solid-js';

export interface ContextMenuItem {
  id: string;
  label: string;
  icon?: string;
  action: () => void;
  disabled?: boolean;
  separator?: boolean;
  submenu?: ContextMenuItem[];
  color?: 'default' | 'primary' | 'secondary' | 'danger';
}

export interface ContextMenuPosition {
  x: number;
  y: number;
}

export interface ContextMenuOptions {
  preventDefault?: boolean;
  closeOnClick?: boolean;
  closeOnScroll?: boolean;
  closeOnResize?: boolean;
}

const DEFAULT_OPTIONS: Required<ContextMenuOptions> = {
  preventDefault: true,
  closeOnClick: true,
  closeOnScroll: true,
  closeOnResize: true,
};

export const useContextMenu = (options: ContextMenuOptions = {}) => {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  const [isOpen, setIsOpen] = createSignal(false);
  const [position, setPosition] = createSignal<ContextMenuPosition>({ x: 0, y: 0 });
  const [menuItems, setMenuItems] = createSignal<ContextMenuItem[]>([]);
  const [targetElement, setTargetElement] = createSignal<HTMLElement | null>(null);

  // Close menu when clicking outside
  const handleDocumentClick = (event: MouseEvent) => {
    if (isOpen() && opts.closeOnClick) {
      const target = event.target as HTMLElement;
      const contextMenu = document.querySelector('[data-context-menu]');
      
      if (contextMenu && !contextMenu.contains(target)) {
        closeMenu();
      }
    }
  };

  // Close menu on scroll
  const handleScroll = () => {
    if (isOpen() && opts.closeOnScroll) {
      closeMenu();
    }
  };

  // Close menu on resize
  const handleResize = () => {
    if (isOpen() && opts.closeOnResize) {
      closeMenu();
    }
  };

  // Close menu on escape key
  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && isOpen()) {
      event.preventDefault();
      closeMenu();
    }
  };

  // Setup event listeners
  createEffect(() => {
    if (isOpen()) {
      document.addEventListener('click', handleDocumentClick);
      document.addEventListener('scroll', handleScroll);
      document.addEventListener('keydown', handleKeyDown);
      window.addEventListener('resize', handleResize);
      
      onCleanup(() => {
        document.removeEventListener('click', handleDocumentClick);
        document.removeEventListener('scroll', handleScroll);
        document.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('resize', handleResize);
      });
    }
  });

  const openMenu = (event: MouseEvent, items: ContextMenuItem[]) => {
    if (opts.preventDefault) {
      event.preventDefault();
    }
    
    event.stopPropagation();
    
    const rect = document.documentElement.getBoundingClientRect();
    const menuWidth = 200; // Estimated menu width
    const menuHeight = items.length * 32; // Estimated menu height
    
    let x = event.clientX;
    let y = event.clientY;
    
    // Adjust position to prevent menu from going outside viewport
    if (x + menuWidth > window.innerWidth) {
      x = window.innerWidth - menuWidth - 10;
    }
    
    if (y + menuHeight > window.innerHeight) {
      y = window.innerHeight - menuHeight - 10;
    }
    
    setPosition({ x, y });
    setMenuItems(items);
    setTargetElement(event.currentTarget as HTMLElement);
    setIsOpen(true);
  };

  const closeMenu = () => {
    setIsOpen(false);
    setMenuItems([]);
    setTargetElement(null);
  };

  const handleItemClick = (item: ContextMenuItem) => {
    if (item.disabled) return;
    
    if (item.submenu) {
      // Handle submenu (for future enhancement)
      return;
    }
    
    item.action();
    closeMenu();
  };

  // Helper to create context menu handler
  const createContextMenuHandler = (getItems: (event: MouseEvent) => ContextMenuItem[]) => {
    return (event: MouseEvent) => {
      const items = getItems(event);
      if (items.length > 0) {
        openMenu(event, items);
      }
    };
  };

  // Helper to create conditional menu items
  const createMenuItem = (
    id: string,
    label: string,
    action: () => void,
    options: Partial<ContextMenuItem> = {}
  ): ContextMenuItem => ({
    id,
    label,
    action,
    ...options,
  });

  const createSeparator = (): ContextMenuItem => ({
    id: 'separator',
    label: '',
    action: () => {},
    separator: true,
  });

  return {
    // State
    isOpen,
    position,
    menuItems,
    targetElement,
    
    // Actions
    openMenu,
    closeMenu,
    handleItemClick,
    
    // Helpers
    createContextMenuHandler,
    createMenuItem,
    createSeparator,
  };
};