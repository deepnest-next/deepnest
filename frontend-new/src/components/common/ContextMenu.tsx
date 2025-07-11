import { Component, For, Show, createEffect, onCleanup } from 'solid-js';
import { Portal } from 'solid-js/web';
import type { ContextMenuItem, ContextMenuPosition } from '@/hooks/useContextMenu';

interface ContextMenuProps {
  isOpen: boolean;
  position: ContextMenuPosition;
  items: ContextMenuItem[];
  onItemClick: (item: ContextMenuItem) => void;
  onClose: () => void;
}

const ContextMenu: Component<ContextMenuProps> = (props) => {
  let menuRef: HTMLDivElement | undefined;

  createEffect(() => {
    if (props.isOpen && menuRef) {
      // Focus the menu for keyboard navigation
      menuRef.focus();
    }
  });

  const handleKeyDown = (event: KeyboardEvent) => {
    if (!props.isOpen) return;

    switch (event.key) {
      case 'Escape':
        event.preventDefault();
        props.onClose();
        break;
      case 'ArrowDown':
        event.preventDefault();
        focusNextItem();
        break;
      case 'ArrowUp':
        event.preventDefault();
        focusPreviousItem();
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        const focusedItem = menuRef?.querySelector('[data-context-item]:focus') as HTMLElement;
        if (focusedItem) {
          focusedItem.click();
        }
        break;
    }
  };

  const focusNextItem = () => {
    const items = menuRef?.querySelectorAll('[data-context-item]:not([disabled])');
    if (!items?.length) return;
    
    const currentIndex = Array.from(items).findIndex(item => item === document.activeElement);
    let nextIndex: number;
    
    if (currentIndex === -1) {
      // No item is focused, focus the first item
      nextIndex = 0;
    } else if (currentIndex >= items.length - 1) {
      // At the last item, wrap to the first item
      nextIndex = 0;
    } else {
      // Move to next item
      nextIndex = currentIndex + 1;
    }
    
    (items[nextIndex] as HTMLElement).focus();
  };

  const focusPreviousItem = () => {
    const items = menuRef?.querySelectorAll('[data-context-item]:not([disabled])');
    if (!items?.length) return;
    
    const currentIndex = Array.from(items).findIndex(item => item === document.activeElement);
    let prevIndex: number;
    
    if (currentIndex === -1) {
      // No item is focused, focus the last item
      prevIndex = items.length - 1;
    } else if (currentIndex <= 0) {
      // At the first item, wrap to the last item
      prevIndex = items.length - 1;
    } else {
      // Move to previous item
      prevIndex = currentIndex - 1;
    }
    
    (items[prevIndex] as HTMLElement).focus();
  };

  const getColorClasses = (color: ContextMenuItem['color'] = 'default') => {
    switch (color) {
      case 'primary':
        return 'text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20';
      case 'secondary':
        return 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800';
      case 'danger':
        return 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20';
      default:
        return 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800';
    }
  };

  return (
    <Show when={props.isOpen}>
      <Portal>
        <div 
          ref={menuRef}
          data-context-menu
          class="fixed z-50 min-w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 focus:outline-none"
          style={{
            left: `${props.position.x}px`,
            top: `${props.position.y}px`,
          }}
          tabIndex={-1}
          onKeyDown={handleKeyDown}
        >
          <For each={props.items}>
            {(item) => (
              <Show
                when={!item.separator}
                fallback={
                  <div class="h-px bg-gray-200 dark:bg-gray-700 mx-1 my-1" />
                }
              >
                <button
                  data-context-item
                  class={`w-full flex items-center gap-3 px-3 py-2 text-sm text-left transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset ${getColorClasses(item.color)} ${
                    item.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                  }`}
                  onClick={() => !item.disabled && props.onItemClick(item)}
                  disabled={item.disabled}
                  tabIndex={0}
                >
                  <Show when={item.icon}>
                    <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={item.icon} />
                    </svg>
                  </Show>
                  <span class="flex-1">{item.label}</span>
                  <Show when={item.submenu}>
                    <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </Show>
                </button>
              </Show>
            )}
          </For>
        </div>
      </Portal>
    </Show>
  );
};

export default ContextMenu;