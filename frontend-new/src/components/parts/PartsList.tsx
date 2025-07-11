import { Component, For, createMemo, createSignal } from 'solid-js';
import { useTranslation } from '@/utils/i18n';
import { globalState, globalActions } from '@/stores/global.store';
import type { Part } from '@/types/app.types';

const PartsList: Component = () => {
  const [t] = useTranslation('parts');
  const [searchTerm, setSearchTerm] = createSignal('');
  const [sortBy, setSortBy] = createSignal<'name' | 'quantity' | 'size'>('name');
  const [sortOrder, setSortOrder] = createSignal<'asc' | 'desc'>('asc');

  const filteredAndSortedParts = createMemo(() => {
    let parts = globalState.app.parts;

    // Filter by search term
    if (searchTerm()) {
      const term = searchTerm().toLowerCase();
      parts = parts.filter(part => 
        part.name.toLowerCase().includes(term) ||
        part.source.toLowerCase().includes(term)
      );
    }

    // Sort parts (create a new array to avoid mutating the store)
    parts = [...parts].sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (sortBy()) {
        case 'name':
          aValue = a.name;
          bValue = b.name;
          break;
        case 'quantity':
          aValue = a.quantity;
          bValue = b.quantity;
          break;
        case 'size':
          aValue = a.bounds.width * a.bounds.height;
          bValue = b.bounds.width * b.bounds.height;
          break;
        default:
          aValue = a.name;
          bValue = b.name;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortOrder() === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      return sortOrder() === 'asc' 
        ? (aValue as number) - (bValue as number)
        : (bValue as number) - (aValue as number);
    });

    return parts;
  });

  const handlePartClick = (part: Part) => {
    globalActions.updatePart(part.id, { selected: !part.selected });
  };

  const handleQuantityChange = (partId: string, quantity: number) => {
    if (quantity < 1) quantity = 1;
    globalActions.updatePart(partId, { quantity });
  };

  const handleRotationChange = (partId: string, rotation: number) => {
    globalActions.updatePart(partId, { rotation });
  };

  const handleSort = (field: typeof sortBy extends () => infer T ? T : never) => {
    if (sortBy() === field) {
      setSortOrder(sortOrder() === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const formatSize = (bounds: Part['bounds']) => {
    return `${bounds.width.toFixed(1)} × ${bounds.height.toFixed(1)}`;
  };

  return (
    <div class="h-full flex flex-col bg-white dark:bg-gray-900">
      {/* Search and Filter Controls */}
      <div class="p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div class="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          {/* Search Box */}
          <div class="relative flex-1 max-w-md">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg class="w-4 h-4 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder={t('search_parts')}
              value={searchTerm()}
              onInput={(e) => setSearchTerm(e.currentTarget.value)}
              class="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 transition-colors duration-200"
            />
          </div>
          
          {/* Sort Controls */}
          <div class="flex items-center gap-3">
            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">{t('sort_by')}:</span>
            <select 
              value={sortBy()}
              onChange={(e) => setSortBy(e.currentTarget.value as any)}
              class="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors duration-200"
            >
              <option value="name">{t('name')}</option>
              <option value="quantity">{t('quantity')}</option>
              <option value="size">{t('size')}</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder() === 'asc' ? 'desc' : 'asc')}
              class="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
              title={sortOrder() === 'asc' ? 'Sort descending' : 'Sort ascending'}
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {sortOrder() === 'asc' ? (
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
                ) : (
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div class="flex-1 overflow-auto">
        <div class="min-w-full">
          {/* Table Header */}
          <div class="sticky top-0 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 z-10">
            <div class="grid grid-cols-12 gap-4 px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <div class="col-span-1 flex items-center">
                <input
                  type="checkbox"
                  checked={globalState.app.parts.every(part => part.selected)}
                  indeterminate={globalState.app.parts.some(part => part.selected) && !globalState.app.parts.every(part => part.selected)}
                  onChange={(e) => {
                    const shouldSelect = e.currentTarget.checked;
                    globalState.app.parts.forEach(part => {
                      globalActions.updatePart(part.id, { selected: shouldSelect });
                    });
                  }}
                  class="w-4 h-4 text-blue-600 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-2"
                />
              </div>
              <button 
                class={`col-span-4 flex items-center gap-2 text-left hover:text-gray-700 dark:hover:text-gray-200 transition-colors duration-200 ${sortBy() === 'name' ? 'text-blue-600 dark:text-blue-400' : ''}`}
                onClick={() => handleSort('name')}
              >
                <span>{t('name')}</span>
                {sortBy() === 'name' && (
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {sortOrder() === 'asc' ? (
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
                    ) : (
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                    )}
                  </svg>
                )}
              </button>
              <button 
                class={`col-span-2 flex items-center gap-2 text-left hover:text-gray-700 dark:hover:text-gray-200 transition-colors duration-200 ${sortBy() === 'quantity' ? 'text-blue-600 dark:text-blue-400' : ''}`}
                onClick={() => handleSort('quantity')}
              >
                <span>{t('quantity')}</span>
                {sortBy() === 'quantity' && (
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {sortOrder() === 'asc' ? (
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
                    ) : (
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                    )}
                  </svg>
                )}
              </button>
              <button 
                class={`col-span-3 flex items-center gap-2 text-left hover:text-gray-700 dark:hover:text-gray-200 transition-colors duration-200 ${sortBy() === 'size' ? 'text-blue-600 dark:text-blue-400' : ''}`}
                onClick={() => handleSort('size')}
              >
                <span>{t('size')}</span>
                {sortBy() === 'size' && (
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {sortOrder() === 'asc' ? (
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
                    ) : (
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                    )}
                  </svg>
                )}
              </button>
              <div class="col-span-2 text-center">{t('rotation')}</div>
            </div>
          </div>

          {/* Table Body */}
          <div class="bg-white dark:bg-gray-900">
            <For each={filteredAndSortedParts()}>
              {(part) => (
                <div class={`grid grid-cols-12 gap-4 px-4 py-4 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200 ${
                  part.selected ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' : ''
                }`}>
                  {/* Checkbox */}
                  <div class="col-span-1 flex items-center">
                    <input
                      type="checkbox"
                      checked={part.selected}
                      onChange={() => handlePartClick(part)}
                      class="w-4 h-4 text-blue-600 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-2"
                    />
                  </div>
                  
                  {/* Name */}
                  <div class="col-span-4 flex items-center">
                    <div class="flex items-center gap-3">
                      <div class="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg class="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                      </div>
                      <div class="min-w-0 flex-1">
                        <p class="text-sm font-medium text-gray-900 dark:text-gray-100 truncate" title={part.source}>
                          {part.name}
                        </p>
                        <p class="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {part.source}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Quantity */}
                  <div class="col-span-2 flex items-center">
                    <div class="relative">
                      <input
                        type="number"
                        value={part.quantity}
                        min="1"
                        onChange={(e) => handleQuantityChange(part.id, parseInt(e.currentTarget.value))}
                        class="w-20 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors duration-200"
                      />
                    </div>
                  </div>
                  
                  {/* Size */}
                  <div class="col-span-3 flex items-center">
                    <div class="flex items-center gap-2">
                      <div class="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono text-gray-600 dark:text-gray-300">
                        {formatSize(part.bounds)}
                      </div>
                      <span class="text-xs text-gray-500 dark:text-gray-400">mm</span>
                    </div>
                  </div>
                  
                  {/* Rotation */}
                  <div class="col-span-2 flex items-center justify-center">
                    <div class="flex items-center gap-1">
                      <input
                        type="number"
                        value={part.rotation}
                        min="0"
                        max="360"
                        step="90"
                        onChange={(e) => handleRotationChange(part.id, parseInt(e.currentTarget.value))}
                        class="w-16 px-2 py-1.5 text-sm text-center border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors duration-200"
                      />
                      <span class="text-xs text-gray-500 dark:text-gray-400">°</span>
                    </div>
                  </div>
                </div>
              )}
            </For>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PartsList;