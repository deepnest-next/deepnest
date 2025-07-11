import { createSignal, createMemo, onCleanup } from 'solid-js';

export interface SelectionOptions {
  enableMultiSelect?: boolean;
  enableKeyboardShortcuts?: boolean;
  enableRangeSelect?: boolean;
  selectAllKey?: string;
  deselectAllKey?: string;
}

const DEFAULT_OPTIONS: Required<SelectionOptions> = {
  enableMultiSelect: true,
  enableKeyboardShortcuts: true,
  enableRangeSelect: true,
  selectAllKey: 'KeyA',
  deselectAllKey: 'Escape',
};

export const useSelection = <T extends { id: string }>(
  items: () => T[],
  options: SelectionOptions = {}
) => {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  const [selectedIds, setSelectedIds] = createSignal<Set<string>>(new Set());
  const [lastSelectedId, setLastSelectedId] = createSignal<string | null>(null);
  const [selectionMode, setSelectionMode] = createSignal<'single' | 'multi' | 'range'>('single');

  // Computed values
  const selectedItems = createMemo(() => {
    const selected = selectedIds();
    return items().filter(item => selected.has(item.id));
  });

  const selectedCount = createMemo(() => selectedIds().size);

  const isAllSelected = createMemo(() => {
    const allItems = items();
    const selected = selectedIds();
    return allItems.length > 0 && allItems.every(item => selected.has(item.id));
  });

  const isNoneSelected = createMemo(() => selectedIds().size === 0);

  const isPartiallySelected = createMemo(() => {
    const count = selectedCount();
    return count > 0 && count < items().length;
  });

  // Selection operations
  const selectItem = (itemId: string) => {
    setSelectedIds(prev => new Set([...prev, itemId]));
    setLastSelectedId(itemId);
  };

  const deselectItem = (itemId: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(itemId);
      return newSet;
    });
    if (lastSelectedId() === itemId) {
      setLastSelectedId(null);
    }
  };

  const toggleItem = (itemId: string) => {
    if (selectedIds().has(itemId)) {
      deselectItem(itemId);
    } else {
      selectItem(itemId);
    }
  };

  const selectAll = () => {
    const allIds = items().map(item => item.id);
    setSelectedIds(new Set(allIds));
    setLastSelectedId(allIds[allIds.length - 1] || null);
  };

  const deselectAll = () => {
    setSelectedIds(new Set());
    setLastSelectedId(null);
  };

  const selectRange = (fromId: string, toId: string) => {
    const allItems = items();
    const fromIndex = allItems.findIndex(item => item.id === fromId);
    const toIndex = allItems.findIndex(item => item.id === toId);
    
    if (fromIndex === -1 || toIndex === -1) return;
    
    const start = Math.min(fromIndex, toIndex);
    const end = Math.max(fromIndex, toIndex);
    
    const rangeIds = allItems.slice(start, end + 1).map(item => item.id);
    setSelectedIds(prev => new Set([...prev, ...rangeIds]));
    setLastSelectedId(toId);
  };

  const invertSelection = () => {
    const allItems = items();
    const currentSelected = selectedIds();
    const newSelected = new Set(
      allItems.filter(item => !currentSelected.has(item.id)).map(item => item.id)
    );
    setSelectedIds(newSelected);
    setLastSelectedId(null);
  };

  // Event handlers
  const handleItemClick = (itemId: string, event: MouseEvent) => {
    if (!opts.enableMultiSelect) {
      // Single selection mode
      if (selectedIds().has(itemId)) {
        deselectAll();
      } else {
        setSelectedIds(new Set([itemId]));
        setLastSelectedId(itemId);
      }
      return;
    }

    // Multi-select mode
    if (event.ctrlKey || event.metaKey) {
      // Ctrl/Cmd + Click: Toggle selection
      setSelectionMode('multi');
      toggleItem(itemId);
    } else if (event.shiftKey && opts.enableRangeSelect) {
      // Shift + Click: Range selection
      setSelectionMode('range');
      const lastId = lastSelectedId();
      if (lastId) {
        selectRange(lastId, itemId);
      } else {
        selectItem(itemId);
      }
    } else {
      // Regular click: Select only this item
      setSelectionMode('single');
      setSelectedIds(new Set([itemId]));
      setLastSelectedId(itemId);
    }
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    if (!opts.enableKeyboardShortcuts) return;

    // Check for modifier keys
    const isCtrlOrCmd = event.ctrlKey || event.metaKey;
    const isShift = event.shiftKey;

    if (isCtrlOrCmd && event.code === opts.selectAllKey) {
      event.preventDefault();
      selectAll();
    } else if (event.code === opts.deselectAllKey) {
      event.preventDefault();
      deselectAll();
    } else if (isCtrlOrCmd && event.code === 'KeyI') {
      event.preventDefault();
      invertSelection();
    } else if (event.code === 'ArrowUp' || event.code === 'ArrowDown') {
      event.preventDefault();
      navigateSelection(event.code === 'ArrowUp' ? -1 : 1, isShift);
    }
  };

  const navigateSelection = (direction: number, extendSelection: boolean = false) => {
    const allItems = items();
    if (allItems.length === 0) return;

    const currentId = lastSelectedId();
    let currentIndex = currentId ? allItems.findIndex(item => item.id === currentId) : -1;
    
    if (currentIndex === -1) {
      // No current selection, select first item
      const firstItem = allItems[0];
      if (firstItem) {
        selectItem(firstItem.id);
      }
      return;
    }

    const newIndex = Math.max(0, Math.min(allItems.length - 1, currentIndex + direction));
    if (newIndex === currentIndex) return;

    const newItem = allItems[newIndex];
    if (!newItem) return;

    if (extendSelection && opts.enableRangeSelect) {
      // Extend selection to new item
      selectRange(currentId!, newItem.id);
    } else {
      // Move selection to new item
      setSelectedIds(new Set([newItem.id]));
      setLastSelectedId(newItem.id);
    }
  };

  // Utility functions
  const isSelected = (itemId: string) => selectedIds().has(itemId);

  const getSelectionInfo = () => ({
    selectedIds: Array.from(selectedIds()),
    selectedItems: selectedItems(),
    selectedCount: selectedCount(),
    isAllSelected: isAllSelected(),
    isNoneSelected: isNoneSelected(),
    isPartiallySelected: isPartiallySelected(),
    lastSelectedId: lastSelectedId(),
    selectionMode: selectionMode(),
  });

  // Setup keyboard event listener
  if (opts.enableKeyboardShortcuts) {
    document.addEventListener('keydown', handleKeyDown);
    onCleanup(() => {
      document.removeEventListener('keydown', handleKeyDown);
    });
  }

  return {
    // State
    selectedIds,
    selectedItems,
    selectedCount,
    isAllSelected,
    isNoneSelected,
    isPartiallySelected,
    lastSelectedId,
    selectionMode,

    // Actions
    selectItem,
    deselectItem,
    toggleItem,
    selectAll,
    deselectAll,
    selectRange,
    invertSelection,
    navigateSelection,

    // Event handlers
    handleItemClick,

    // Utilities
    isSelected,
    getSelectionInfo,
  };
};