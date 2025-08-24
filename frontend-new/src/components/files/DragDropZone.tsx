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
    <div class="w-full h-full">
      <div 
        class={`relative w-full h-64 border-2 border-dashed rounded-lg transition-all duration-200 cursor-pointer hover:border-blue-400 dark:hover:border-blue-500 flex items-center justify-center ${
          isDragOver() ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-gray-600'
        } ${isProcessing() ? 'pointer-events-none' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleBrowseClick}
      >
        <div class="text-center p-8">
          <div class="w-12 h-12 mx-auto mb-4 text-gray-400 dark:text-gray-500">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
              <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
            </svg>
          </div>
          
          <Show when={!isProcessing()}>
            <div class="space-y-2">
              <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100">{t('drop_files_here')}</h3>
              <p class="text-sm text-gray-600 dark:text-gray-400">{t('or_click_to_browse')}</p>
              <div class="text-xs text-gray-500 dark:text-gray-400 mt-2">
                {t('supported_formats')}
              </div>
            </div>
          </Show>

          <Show when={isProcessing()}>
            <div class="w-full max-w-md">
              <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">{t('importing_files')}</h3>
              <div class="space-y-3">
                <For each={filesInProgress()}>
                  {(fileWithProgress) => (
                    <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3">
                      <div class="flex items-center justify-between mb-2">
                        <span class="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{fileWithProgress.file.name}</span>
                        <span class="text-xs text-gray-500 dark:text-gray-400 ml-2">({formatFileSize(fileWithProgress.file.size)})</span>
                      </div>
                      
                      <div class="flex items-center gap-3">
                        <div class="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                          <div 
                            class={`h-full transition-all duration-300 rounded-full ${
                              fileWithProgress.status === 'error' ? 'bg-red-500' :
                              fileWithProgress.status === 'completed' ? 'bg-green-500' :
                              'bg-blue-500'
                            }`}
                            style={`width: ${fileWithProgress.progress}%`}
                          />
                        </div>
                        <span class="text-xs font-medium text-gray-900 dark:text-gray-100 min-w-8">
                          {fileWithProgress.status === 'error' 
                            ? '✗' 
                            : fileWithProgress.status === 'completed' 
                            ? '✓' 
                            : `${fileWithProgress.progress}%`
                          }
                        </span>
                      </div>
                      <Show when={fileWithProgress.status === 'error' && fileWithProgress.error}>
                        <div class="mt-2 text-xs text-red-600 dark:text-red-400">
                          {fileWithProgress.error}
                        </div>
                      </Show>
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