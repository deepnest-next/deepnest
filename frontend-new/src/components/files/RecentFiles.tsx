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
    <div class="recent-files">
      <div class="recent-files-header">
        <h3>{t('recent_files')}</h3>
        <Show when={recentFiles().length > 0}>
          <button class="button secondary small" onClick={clearAllRecent}>
            {t('clear_recent')}
          </button>
        </Show>
      </div>

      <Show 
        when={recentFiles().length > 0}
        fallback={
          <div class="no-recent-files">
            <div class="no-recent-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor" opacity="0.3">
                <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
              </svg>
            </div>
            <h4>{t('no_recent_files')}</h4>
            <p>{t('recent_files_description')}</p>
          </div>
        }
      >
        <div class="recent-files-list">
          <For each={recentFiles()}>
            {(file) => (
              <div class="recent-file-item">
                <div class="file-main" onClick={() => handleFileSelect(file)}>
                  <div class="file-icon">
                    {getFileIcon(file.fileType)}
                  </div>
                  
                  <div class="file-info">
                    <div class="file-name">
                      {file.filename}
                      <Show when={file.isPinned}>
                        <span class="pinned-indicator" title={t('pinned')}>📌</span>
                      </Show>
                    </div>
                    <div class="file-details">
                      <span class="file-size">{formatFileSize(file.size)}</span>
                      <span class="file-date">{formatDate(file.lastOpened)}</span>
                    </div>
                    <div class="file-path" title={file.filepath}>
                      {file.filepath}
                    </div>
                  </div>
                </div>

                <div class="file-actions">
                  <button
                    class="action-button"
                    onClick={() => togglePin(file.id)}
                    title={file.isPinned ? t('unpin_file') : t('pin_file')}
                  >
                    {file.isPinned ? '📌' : '📍'}
                  </button>
                  
                  <button
                    class="action-button"
                    onClick={() => setShowFileInfo(showFileInfo() === file.id ? null : file.id)}
                    title={t('file_info')}
                  >
                    ℹ️
                  </button>
                  
                  <button
                    class="action-button"
                    onClick={() => copyFilePath(file.filepath)}
                    title={t('copy_path')}
                  >
                    📋
                  </button>
                  
                  <button
                    class="action-button remove"
                    onClick={() => removeFile(file.id)}
                    title={t('remove_from_recent')}
                  >
                    ✕
                  </button>
                </div>

                <Show when={showFileInfo() === file.id}>
                  <div class="file-info-panel">
                    <div class="info-row">
                      <span class="info-label">{t('file_path')}:</span>
                      <span class="info-value">{file.filepath}</span>
                    </div>
                    <div class="info-row">
                      <span class="info-label">{t('file_size')}:</span>
                      <span class="info-value">{formatFileSize(file.size)}</span>
                    </div>
                    <div class="info-row">
                      <span class="info-label">{t('last_modified')}:</span>
                      <span class="info-value">{new Date(file.lastModified).toLocaleString()}</span>
                    </div>
                    <div class="info-row">
                      <span class="info-label">Last Opened:</span>
                      <span class="info-value">{new Date(file.lastOpened).toLocaleString()}</span>
                    </div>
                  </div>
                </Show>
              </div>
            )}
          </For>
        </div>
      </Show>
      
      <div class="recent-files-footer">
        <small>{t('max_recent_files', { count: maxFiles })}</small>
      </div>
    </div>
  );
};

export default RecentFiles;