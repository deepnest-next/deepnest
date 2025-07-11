import { Component, createSignal, Show, For } from 'solid-js';
import { useTranslation } from '@/utils/i18n';
import { globalActions } from '@/stores/global.store';

interface FileWithProgress {
  file: File;
  progress: number;
  status: 'pending' | 'processing' | 'completed' | 'error';
  error?: string;
}

interface DragDropZoneProps {
  onFilesSelected?: (files: File[]) => void;
  accept?: string;
  maxFileSize?: number;
  maxFiles?: number;
}

const DragDropZone: Component<DragDropZoneProps> = (props) => {
  const [t] = useTranslation('files');
  const [isDragOver, setIsDragOver] = createSignal(false);
  const [isProcessing, setIsProcessing] = createSignal(false);
  const [filesInProgress, setFilesInProgress] = createSignal<FileWithProgress[]>([]);
  
  const acceptedFormats = props.accept || '.svg,.dxf,.json';
  const maxFileSize = props.maxFileSize || 10 * 1024 * 1024; // 10MB
  const maxFiles = props.maxFiles || 50;

  const validateFile = (file: File): { valid: boolean; error?: string } => {
    // Check file size
    if (file.size > maxFileSize) {
      return {
        valid: false,
        error: t('file_too_large', { 
          size: formatFileSize(file.size), 
          max: formatFileSize(maxFileSize) 
        })
      };
    }

    // Check file extension
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    const acceptedExtensions = acceptedFormats.split(',').map(ext => ext.trim().toLowerCase());
    
    if (!acceptedExtensions.includes(extension)) {
      return {
        valid: false,
        error: t('invalid_file_format', { format: extension })
      };
    }

    return { valid: true };
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const processFiles = async (files: File[]) => {
    if (files.length === 0) return;

    if (files.length > maxFiles) {
      globalActions.setError(t('too_many_files', { count: files.length, max: maxFiles }));
      return;
    }

    setIsProcessing(true);
    
    const filesWithProgress: FileWithProgress[] = files.map(file => ({
      file,
      progress: 0,
      status: 'pending' as const
    }));

    setFilesInProgress(filesWithProgress);

    const validFiles: File[] = [];
    const errors: string[] = [];

    // Validate all files first
    for (const fileWithProgress of filesWithProgress) {
      const validation = validateFile(fileWithProgress.file);
      
      if (!validation.valid) {
        fileWithProgress.status = 'error';
        fileWithProgress.error = validation.error;
        errors.push(`${fileWithProgress.file.name}: ${validation.error}`);
      } else {
        validFiles.push(fileWithProgress.file);
      }
    }

    if (errors.length > 0) {
      globalActions.setError(t('file_validation_error') + '\\n' + errors.join('\\n'));
    }

    // Process valid files
    if (validFiles.length > 0) {
      try {
        for (let i = 0; i < validFiles.length; i++) {
          const file = validFiles[i];
          const fileWithProgress = filesWithProgress.find(f => f.file === file);
          
          if (fileWithProgress) {
            fileWithProgress.status = 'processing';
            setFilesInProgress([...filesWithProgress]);

            // Simulate file processing with progress
            for (let progress = 0; progress <= 100; progress += 10) {
              fileWithProgress.progress = progress;
              setFilesInProgress([...filesWithProgress]);
              await new Promise(resolve => setTimeout(resolve, 50));
            }

            fileWithProgress.status = 'completed';
            setFilesInProgress([...filesWithProgress]);
          }
        }

        // Call the callback with valid files
        props.onFilesSelected?.(validFiles);
        
        // Show success message
        if (validFiles.length === 1) {
          globalActions.setMessage(t('file_imported_success', { filename: validFiles[0].name }));
        } else {
          globalActions.setMessage(t('files_imported', { count: validFiles.length }));
        }

        // Clear progress after a delay
        setTimeout(() => {
          setFilesInProgress([]);
        }, 2000);

      } catch (error) {
        console.error('Failed to process files:', error);
        globalActions.setError(t('import_failed'));
      }
    }

    setIsProcessing(false);
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer?.files || []);
    processFiles(files);
  };

  const handleFileInput = (e: Event) => {
    const input = e.target as HTMLInputElement;
    const files = Array.from(input.files || []);
    processFiles(files);
    input.value = ''; // Reset input
  };

  const handleBrowseClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = acceptedFormats;
    input.multiple = true;
    input.onchange = handleFileInput;
    input.click();
  };

  return (
    <div class="drag-drop-zone">
      <div 
        class={`drop-area ${isDragOver() ? 'drag-over' : ''} ${isProcessing() ? 'processing' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleBrowseClick}
      >
        <div class="drop-content">
          <div class="drop-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
              <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
            </svg>
          </div>
          
          <Show when={!isProcessing()}>
            <div class="drop-text">
              <h3>{t('drop_files_here')}</h3>
              <p>{t('or_click_to_browse')}</p>
              <div class="supported-formats">
                {t('supported_formats')}
              </div>
            </div>
          </Show>

          <Show when={isProcessing()}>
            <div class="processing-status">
              <h3>{t('importing_files')}</h3>
              <div class="files-progress">
                <For each={filesInProgress()}>
                  {(fileWithProgress) => (
                    <div class="file-progress">
                      <div class="file-info">
                        <span class="filename">{fileWithProgress.file.name}</span>
                        <span class="file-size">({formatFileSize(fileWithProgress.file.size)})</span>
                      </div>
                      
                      <div class="progress-container">
                        <div class="progress-bar">
                          <div 
                            class={`progress-fill ${fileWithProgress.status}`}
                            style={`width: ${fileWithProgress.progress}%`}
                          />
                        </div>
                        <span class="status-text">
                          {fileWithProgress.status === 'error' 
                            ? fileWithProgress.error 
                            : fileWithProgress.status === 'completed' 
                            ? '✓' 
                            : `${fileWithProgress.progress}%`
                          }
                        </span>
                      </div>
                    </div>
                  )}
                </For>
              </div>
            </div>
          </Show>
        </div>
      </div>
    </div>
  );
};

export default DragDropZone;