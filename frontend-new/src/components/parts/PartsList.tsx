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

    // Sort parts
    parts = parts.sort((a, b) => {
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
    <div class="parts-list">
      <div class="parts-controls">
        <div class="search-box">
          <input
            type="text"
            placeholder={t('search_parts')}
            value={searchTerm()}
            onInput={(e) => setSearchTerm(e.currentTarget.value)}
            class="search-input"
          />
        </div>
        <div class="sort-controls">
          <label>{t('sort_by')}:</label>
          <select 
            value={sortBy()}
            onChange={(e) => setSortBy(e.currentTarget.value as any)}
            class="sort-select"
          >
            <option value="name">{t('name')}</option>
            <option value="quantity">{t('quantity')}</option>
            <option value="size">{t('size')}</option>
          </select>
        </div>
      </div>

      <div class="parts-table">
        <div class="table-header">
          <div class="table-cell checkbox-cell">
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
            />
          </div>
          <div 
            class="table-cell name-cell sortable" 
            onClick={() => handleSort('name')}
          >
            {t('name')} {sortBy() === 'name' && (sortOrder() === 'asc' ? '▲' : '▼')}
          </div>
          <div 
            class="table-cell quantity-cell sortable" 
            onClick={() => handleSort('quantity')}
          >
            {t('quantity')} {sortBy() === 'quantity' && (sortOrder() === 'asc' ? '▲' : '▼')}
          </div>
          <div 
            class="table-cell size-cell sortable" 
            onClick={() => handleSort('size')}
          >
            {t('size')} {sortBy() === 'size' && (sortOrder() === 'asc' ? '▲' : '▼')}
          </div>
          <div class="table-cell rotation-cell">{t('rotation')}</div>
        </div>

        <div class="table-body">
          <For each={filteredAndSortedParts()}>
            {(part) => (
              <div class={`table-row ${part.selected ? 'selected' : ''}`}>
                <div class="table-cell checkbox-cell">
                  <input
                    type="checkbox"
                    checked={part.selected}
                    onChange={() => handlePartClick(part)}
                  />
                </div>
                <div class="table-cell name-cell">
                  <div class="part-name" title={part.source}>
                    {part.name}
                  </div>
                </div>
                <div class="table-cell quantity-cell">
                  <input
                    type="number"
                    value={part.quantity}
                    min="1"
                    class="quantity-input"
                    onChange={(e) => handleQuantityChange(part.id, parseInt(e.currentTarget.value))}
                  />
                </div>
                <div class="table-cell size-cell">
                  <span class="size-text">{formatSize(part.bounds)}</span>
                </div>
                <div class="table-cell rotation-cell">
                  <input
                    type="number"
                    value={part.rotation}
                    min="0"
                    max="360"
                    step="90"
                    class="rotation-input"
                    onChange={(e) => handleRotationChange(part.id, parseInt(e.currentTarget.value))}
                  />
                  <span class="rotation-unit">°</span>
                </div>
              </div>
            )}
          </For>
        </div>
      </div>
    </div>
  );
};

export default PartsList;