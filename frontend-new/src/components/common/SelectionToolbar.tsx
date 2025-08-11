import { Component, Show } from 'solid-js';
import { useTranslation } from '@/utils/i18n';

interface SelectionToolbarProps {
  selectedCount: number;
  totalCount: number;
  isAllSelected: boolean;
  isNoneSelected: boolean;
  isPartiallySelected: boolean;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onInvertSelection: () => void;
  onDeleteSelected?: () => void;
  onDuplicateSelected?: () => void;
  onExportSelected?: () => void;
  actions?: Array<{
    label: string;
    icon: string;
    onClick: () => void;
    disabled?: boolean;
    color?: 'primary' | 'secondary' | 'danger';
  }>;
}

const SelectionToolbar: Component<SelectionToolbarProps> = (props) => {
  const [t] = useTranslation('common');

  const getSelectAllLabel = () => {
    if (props.isAllSelected) return t('deselect_all');
    if (props.isPartiallySelected) return t('select_all');
    return t('select_all');
  };

  const getSelectAllIcon = () => {
    if (props.isAllSelected) return '☑️';
    if (props.isPartiallySelected) return '◐';
    return '☐';
  };

  const handleSelectAllClick = () => {
    if (props.isAllSelected) {
      props.onDeselectAll();
    } else {
      props.onSelectAll();
    }
  };

  return (
    <div class="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      
      {/* Selection Status */}
      <div class="flex items-center gap-4">
        <div class="flex items-center gap-2">
          <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
            {props.selectedCount > 0 
              ? t('selected_count', { count: props.selectedCount, total: props.totalCount })
              : t('no_selection')
            }
          </span>
          <Show when={props.selectedCount > 0}>
            <span class="text-xs text-gray-500 dark:text-gray-400">
              ({Math.round((props.selectedCount / props.totalCount) * 100)}%)
            </span>
          </Show>
        </div>

        {/* Quick Selection Controls */}
        <div class="flex items-center gap-1">
          <button
            onClick={handleSelectAllClick}
            class="p-1 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
            title={getSelectAllLabel()}
          >
            <span class="text-sm">{getSelectAllIcon()}</span>
          </button>
          
          <button
            onClick={props.onInvertSelection}
            class="p-1 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
            title={t('invert_selection')}
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
          </button>

          <Show when={props.selectedCount > 0}>
            <button
              onClick={props.onDeselectAll}
              class="p-1 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
              title={t('deselect_all')}
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </Show>
        </div>
      </div>

      {/* Action Buttons */}
      <Show when={props.selectedCount > 0}>
        <div class="flex items-center gap-2">
          
          {/* Built-in Actions */}
          <Show when={props.onDuplicateSelected}>
            <button
              onClick={props.onDuplicateSelected}
              class="inline-flex items-center px-3 py-1 text-sm font-medium text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900 hover:bg-blue-200 dark:hover:bg-blue-800 rounded-md transition-colors"
              title={t('duplicate_selected')}
            >
              <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              {t('duplicate')}
            </button>
          </Show>

          <Show when={props.onExportSelected}>
            <button
              onClick={props.onExportSelected}
              class="inline-flex items-center px-3 py-1 text-sm font-medium text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-900 hover:bg-green-200 dark:hover:bg-green-800 rounded-md transition-colors"
              title={t('export_selected')}
            >
              <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {t('export')}
            </button>
          </Show>

          {/* Custom Actions */}
          <Show when={props.actions && props.actions.length > 0}>
            <div class="flex items-center gap-1">
              {props.actions!.map((action) => (
                <button
                  onClick={action.onClick}
                  disabled={action.disabled}
                  class={`inline-flex items-center px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                    action.color === 'danger' 
                      ? 'text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900 hover:bg-red-200 dark:hover:bg-red-800 disabled:opacity-50' 
                      : action.color === 'primary'
                      ? 'text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900 hover:bg-blue-200 dark:hover:bg-blue-800 disabled:opacity-50'
                      : 'text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50'
                  }`}
                  title={action.label}
                >
                  <span class="mr-1">{action.icon}</span>
                  {action.label}
                </button>
              ))}
            </div>
          </Show>

          <Show when={props.onDeleteSelected}>
            <button
              onClick={props.onDeleteSelected}
              class="inline-flex items-center px-3 py-1 text-sm font-medium text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900 hover:bg-red-200 dark:hover:bg-red-800 rounded-md transition-colors"
              title={t('delete_selected')}
            >
              <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              {t('delete')}
            </button>
          </Show>
        </div>
      </Show>

      {/* Keyboard Shortcuts Hint */}
      <div class="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
        <span>{t('shortcuts')}:</span>
        <kbd class="px-1 py-0.5 bg-gray-200 dark:bg-gray-600 rounded text-xs">Ctrl+A</kbd>
        <span>{t('select_all')},</span>
        <kbd class="px-1 py-0.5 bg-gray-200 dark:bg-gray-600 rounded text-xs">Esc</kbd>
        <span>{t('deselect')},</span>
        <kbd class="px-1 py-0.5 bg-gray-200 dark:bg-gray-600 rounded text-xs">↑↓</kbd>
        <span>{t('navigate')}</span>
      </div>
    </div>
  );
};

export default SelectionToolbar;