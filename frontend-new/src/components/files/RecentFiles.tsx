import { Component, createSignal, createEffect, Show, For } from 'solid-js';
import { useTranslation } from '@/utils/i18n';
import { globalState, globalActions } from '@/stores/global.store';

interface RecentFile {
  id: string;
  filename: string;
  filepath: string;
  size: number;
  lastModified: string;
  lastOpened: string;
  isPinned: boolean;
  fileType: 'svg' | 'dxf' | 'json' | 'unknown';
}

interface RecentFilesProps {
  onFileSelect?: (file: RecentFile) => void;
  maxFiles?: number;
}

const RecentFiles: Component<RecentFilesProps> = (props) => {
  const [t] = useTranslation('files');
  const [recentFiles, setRecentFiles] = createSignal<RecentFile[]>([]);
  const [showFileInfo, setShowFileInfo] = createSignal<string | null>(null);
  
  const maxFiles = props.maxFiles || 10;

  // Load recent files from localStorage on mount
  createEffect(() => {
    const stored = localStorage.getItem('deepnest-recent-files');
    if (stored) {
      try {
        const files = JSON.parse(stored) as RecentFile[];
        setRecentFiles(files.slice(0, maxFiles));
      } catch (error) {
        console.error('Failed to load recent files:', error);
        setRecentFiles([]);
      }
    }
  });

  // Save recent files to localStorage when changed
  const saveRecentFiles = (files: RecentFile[]) => {
    try {
      localStorage.setItem('deepnest-recent-files', JSON.stringify(files));
      setRecentFiles(files);
    } catch (error) {
      console.error('Failed to save recent files:', error);
    }
  };

  const getFileType = (filename: string): RecentFile['fileType'] => {
    const extension = filename.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'svg': return 'svg';
      case 'dxf': return 'dxf';
      case 'json': return 'json';
      default: return 'unknown';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} hours ago`;
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  const addRecentFile = (file: File, filepath: string) => {
    const newFile: RecentFile = {
      id: `${filepath}-${Date.now()}`,
      filename: file.name,
      filepath,
      size: file.size,
      lastModified: new Date(file.lastModified).toISOString(),
      lastOpened: new Date().toISOString(),
      isPinned: false,
      fileType: getFileType(file.name)
    };

    const currentFiles = recentFiles();
    
    // Remove existing entry for same file
    const filteredFiles = currentFiles.filter(f => f.filepath !== filepath);
    
    // Add new file at the beginning, keep pinned files at top
    const pinnedFiles = filteredFiles.filter(f => f.isPinned);
    const unpinnedFiles = filteredFiles.filter(f => !f.isPinned);
    
    const updatedFiles = [
      ...pinnedFiles,
      newFile,
      ...unpinnedFiles
    ].slice(0, maxFiles);

    saveRecentFiles(updatedFiles);
  };

  const togglePin = (fileId: string) => {
    const updatedFiles = recentFiles().map(file => 
      file.id === fileId ? { ...file, isPinned: !file.isPinned } : file
    );
    
    // Sort: pinned files first, then by last opened
    updatedFiles.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.lastOpened).getTime() - new Date(a.lastOpened).getTime();
    });

    saveRecentFiles(updatedFiles);
  };

  const removeFile = (fileId: string) => {
    const updatedFiles = recentFiles().filter(file => file.id !== fileId);
    saveRecentFiles(updatedFiles);
  };

  const clearAllRecent = () => {
    const confirmed = confirm(t('confirm_clear_recent'));
    if (confirmed) {
      saveRecentFiles([]);
    }
  };

  const handleFileSelect = (file: RecentFile) => {
    // Update last opened time
    const updatedFiles = recentFiles().map(f => 
      f.id === file.id ? { ...f, lastOpened: new Date().toISOString() } : f
    );
    saveRecentFiles(updatedFiles);
    
    props.onFileSelect?.(file);
  };

  const copyFilePath = (filepath: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(filepath);
      globalActions.setMessage('File path copied to clipboard');
    }
  };

  const getFileIcon = (fileType: RecentFile['fileType']) => {
    switch (fileType) {
      case 'svg':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
          </svg>
        );
      case 'dxf':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
          </svg>
        );
      case 'json':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M5,3H7V5H5V10A2,2 0 0,1 3,8H1V6H3V3A2,2 0 0,1 5,1H7V3M19,3V1H17A2,2 0 0,1 19,3V6H21V8H19A2,2 0 0,1 17,10V5H19M12,15A1,1 0 0,1 13,16A1,1 0 0,1 12,17A1,1 0 0,1 11,16A1,1 0 0,1 12,15M19,21A2,2 0 0,1 17,23H15V21H17V19H19V21M5,21V19H7V21H5A2,2 0 0,1 3,19V16H1V14H3A2,2 0 0,1 5,16V21Z"/>
          </svg>
        );
      default:
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
          </svg>
        );
    }
  };

  // Expose addRecentFile for external use
  (globalActions as any).addRecentFile = addRecentFile;

  return (
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100">{t('recent_files')}</h3>
        <Show when={recentFiles().length > 0}>
          <button 
            class="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-colors duration-200"
            onClick={clearAllRecent}
          >
            {t('clear_recent')}
          </button>
        </Show>
      </div>

      <Show 
        when={recentFiles().length > 0}
        fallback={
          <div class="text-center py-12">
            <div class="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor">
                <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
              </svg>
            </div>
            <h4 class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">{t('no_recent_files')}</h4>
            <p class="text-gray-600 dark:text-gray-400">{t('recent_files_description')}</p>
          </div>
        }
      >
        <div class="space-y-2">
          <For each={recentFiles()}>
            {(file) => (
              <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-sm transition-shadow duration-200">
                <div class="flex items-center gap-4 p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50" onClick={() => handleFileSelect(file)}>
                  <div class="flex-shrink-0 w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center text-gray-500 dark:text-gray-400">
                    {getFileIcon(file.fileType)}
                  </div>
                  
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 mb-1">
                      <span class="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{file.filename}</span>
                      <Show when={file.isPinned}>
                        <span class="text-xs text-blue-600 dark:text-blue-400" title={t('pinned')}>📌</span>
                      </Show>
                    </div>
                    <div class="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                      <span>{formatFileSize(file.size)}</span>
                      <span>•</span>
                      <span>{formatDate(file.lastOpened)}</span>
                    </div>
                    <div class="text-xs text-gray-400 dark:text-gray-500 truncate mt-1" title={file.filepath}>
                      {file.filepath}
                    </div>
                  </div>
                </div>

                <div class="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-600">
                  <div class="flex items-center gap-2">
                    <button
                      class="p-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors duration-200"
                      onClick={() => togglePin(file.id)}
                      title={file.isPinned ? t('unpin_file') : t('pin_file')}
                    >
                      {file.isPinned ? '📌' : '📍'}
                    </button>
                    
                    <button
                      class="p-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors duration-200"
                      onClick={() => setShowFileInfo(showFileInfo() === file.id ? null : file.id)}
                      title={t('file_info')}
                    >
                      ℹ️
                    </button>
                    
                    <button
                      class="p-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors duration-200"
                      onClick={() => copyFilePath(file.filepath)}
                      title={t('copy_path')}
                    >
                      📋
                    </button>
                  </div>
                  
                  <button
                    class="p-1.5 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors duration-200"
                    onClick={() => removeFile(file.id)}
                    title={t('remove_from_recent')}
                  >
                    ✕
                  </button>
                </div>

                <Show when={showFileInfo() === file.id}>
                  <div class="px-4 py-3 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-600">
                    <div class="space-y-2 text-sm">
                      <div class="flex justify-between">
                        <span class="text-gray-600 dark:text-gray-400">{t('file_path')}:</span>
                        <span class="text-gray-900 dark:text-gray-100 font-mono text-xs break-all">{file.filepath}</span>
                      </div>
                      <div class="flex justify-between">
                        <span class="text-gray-600 dark:text-gray-400">{t('file_size')}:</span>
                        <span class="text-gray-900 dark:text-gray-100">{formatFileSize(file.size)}</span>
                      </div>
                      <div class="flex justify-between">
                        <span class="text-gray-600 dark:text-gray-400">{t('last_modified')}:</span>
                        <span class="text-gray-900 dark:text-gray-100">{new Date(file.lastModified).toLocaleString()}</span>
                      </div>
                      <div class="flex justify-between">
                        <span class="text-gray-600 dark:text-gray-400">Last Opened:</span>
                        <span class="text-gray-900 dark:text-gray-100">{new Date(file.lastOpened).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </Show>
              </div>
            )}
          </For>
        </div>
      </Show>
      
      <div class="text-center pt-4 border-t border-gray-200 dark:border-gray-700">
        <small class="text-xs text-gray-500 dark:text-gray-400">{t('max_recent_files', { count: maxFiles })}</small>
      </div>
    </div>
  );
};

export default RecentFiles;