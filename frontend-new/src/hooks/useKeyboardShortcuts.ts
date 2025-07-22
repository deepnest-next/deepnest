import { createEffect, onCleanup } from 'solid-js';

export interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
  metaKey?: boolean;
  action: () => void;
  description: string;
  preventDefault?: boolean;
}

export interface KeyboardShortcutsOptions {
  enabled?: boolean;
  context?: string;
}

const DEFAULT_OPTIONS: Required<KeyboardShortcutsOptions> = {
  enabled: true,
  context: 'global',
};

export const useKeyboardShortcuts = (
  shortcuts: KeyboardShortcut[],
  options: KeyboardShortcutsOptions = {}
) => {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  const handleKeyDown = (event: KeyboardEvent) => {
    if (!opts.enabled) return;

    // Don't trigger shortcuts when typing in inputs
    const target = event.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      return;
    }

    const matchingShortcut = shortcuts.find(shortcut => {
      const keyMatches = shortcut.key.toLowerCase() === event.key.toLowerCase();
      const ctrlMatches = !!shortcut.ctrlKey === event.ctrlKey;
      const altMatches = !!shortcut.altKey === event.altKey;
      const shiftMatches = !!shortcut.shiftKey === event.shiftKey;
      const metaMatches = !!shortcut.metaKey === event.metaKey;

      return keyMatches && ctrlMatches && altMatches && shiftMatches && metaMatches;
    });

    if (matchingShortcut) {
      if (matchingShortcut.preventDefault !== false) {
        event.preventDefault();
      }
      matchingShortcut.action();
    }
  };

  createEffect(() => {
    if (opts.enabled) {
      document.addEventListener('keydown', handleKeyDown);
      
      onCleanup(() => {
        document.removeEventListener('keydown', handleKeyDown);
      });
    }
  });

  return {
    shortcuts,
    enabled: () => opts.enabled,
  };
};

// Common shortcut combinations
export const createShortcut = (
  key: string,
  action: () => void,
  description: string,
  modifiers: {
    ctrl?: boolean;
    alt?: boolean;
    shift?: boolean;
    meta?: boolean;
  } = {}
): KeyboardShortcut => ({
  key,
  action,
  description,
  ctrlKey: modifiers.ctrl,
  altKey: modifiers.alt,
  shiftKey: modifiers.shift,
  metaKey: modifiers.meta,
});

// Helper function to format shortcut for display
export const formatShortcut = (shortcut: KeyboardShortcut): string => {
  const parts: string[] = [];
  
  if (shortcut.ctrlKey) parts.push('Ctrl');
  if (shortcut.altKey) parts.push('Alt');
  if (shortcut.shiftKey) parts.push('Shift');
  if (shortcut.metaKey) parts.push('Cmd');
  
  parts.push(shortcut.key.toUpperCase());
  
  return parts.join(' + ');
};