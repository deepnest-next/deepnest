import { Component, createSignal, Show } from 'solid-js';
import { useTranslation } from '@/utils/i18n';
import { globalState, globalActions } from '@/stores/global.store';
import DragDropZone from './DragDropZone';
import ExportDialog from './ExportDialog';
import RecentFiles from './RecentFiles';

interface FilesPanelProps {
  class?: string;
}

const FilesPanel: Component<FilesPanelProps> = (props) => {
  const [t] = useTranslation('files');
  const [showExportDialog, setShowExportDialog] = createSignal(false);
  const [activeTab, setActiveTab] = createSignal<'import' | 'export' | 'recent'>('import');

  const handleFilesImported = async (files: File[]) => {
    try {
      // Process each file
      for (const file of files) {
        // Create a mock file path for demonstration
        const filepath = URL.createObjectURL(file);
        
        // Add to recent files
        if ((globalActions as any).addRecentFile) {
          (globalActions as any).addRecentFile(file, filepath);
        }

        // Here you would typically parse the file and add parts to the store
        // For now, we'll just show a success message
        console.log('Processing file:', file.name);
        
        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      globalActions.setMessage(
        files.length === 1 
          ? t('file_imported_success', { filename: files[0].name })
          : t('files_imported', { count: files.length })
      );

    } catch (error) {
      console.error('Failed to process imported files:', error);
      globalActions.setError(t('import_failed'));
    }
  };

  const handleExport = async (settings: any) => {
    try {
      // Here you would implement the actual export logic
      console.log('Exporting with settings:', settings);
      
      // Simulate export process
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      globalActions.setMessage(t('export_success'));
      
    } catch (error) {
      console.error('Export failed:', error);
      globalActions.setError(t('export_failed'));
    }
  };

  const handleRecentFileSelect = (file: any) => {
    try {
      // Here you would load the selected recent file
      console.log('Loading recent file:', file.filename);
      globalActions.setMessage(`Loading ${file.filename}...`);
      
    } catch (error) {
      console.error('Failed to load recent file:', error);
      globalActions.setError(t('file_not_found', { filename: file.filename }));
    }
  };

  const openExportDialog = () => {
    setShowExportDialog(true);
  };

  const hasNestingResults = () => {
    return globalState.app.nests.length > 0;
  };

  const hasParts = () => {
    return globalState.app.parts.length > 0;
  };

  return (
    <div class={`h-full flex flex-col bg-white dark:bg-gray-900 ${props.class || ''}`}>
      <div class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6">
        <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">{t('file_operations')}</h2>
        
        <div class="flex space-x-1 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
          <button 
            class={`px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
              activeTab() === 'import' 
                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm' 
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
            }`}
            onClick={() => setActiveTab('import')}
          >
            {t('import_files')}
          </button>
          <button 
            class={`px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
              activeTab() === 'export' 
                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm' 
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
            }`}
            onClick={() => setActiveTab('export')}
          >
            {t('export_options')}
          </button>
          <button 
            class={`px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
              activeTab() === 'recent' 
                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm' 
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
            }`}
            onClick={() => setActiveTab('recent')}
          >
            {t('recent_files')}
          </button>
        </div>
      </div>

      <div class="flex-1 overflow-y-auto p-6">
        <Show when={activeTab() === 'import'}>
          <div class="space-y-6">
            <DragDropZone 
              onFilesSelected={handleFilesImported}
              accept=".svg,.dxf,.json"
              maxFileSize={10 * 1024 * 1024} // 10MB
              maxFiles={50}
            />
            
            <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h4 class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Supported File Formats</h4>
              <ul class="space-y-3 mb-6">
                <li class="flex items-start gap-3">
                  <div class="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <span class="font-medium text-gray-900 dark:text-gray-100">SVG</span>
                    <span class="text-gray-600 dark:text-gray-400"> - Scalable Vector Graphics files from design software</span>
                  </div>
                </li>
                <li class="flex items-start gap-3">
                  <div class="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <span class="font-medium text-gray-900 dark:text-gray-100">DXF</span>
                    <span class="text-gray-600 dark:text-gray-400"> - AutoCAD Drawing Exchange Format files</span>
                  </div>
                </li>
                <li class="flex items-start gap-3">
                  <div class="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <span class="font-medium text-gray-900 dark:text-gray-100">JSON</span>
                    <span class="text-gray-600 dark:text-gray-400"> - DeepNest project files with parts and settings</span>
                  </div>
                </li>
              </ul>
              
              <div class="border-t border-gray-200 dark:border-gray-700 pt-4">
                <h5 class="font-medium text-gray-900 dark:text-gray-100 mb-3">Import Tips</h5>
                <ul class="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <li class="flex items-start gap-2">
                    <span class="text-green-500 mt-0.5">✓</span>
                    <span>Ensure your files contain closed paths for proper nesting</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="text-green-500 mt-0.5">✓</span>
                    <span>Remove any text or annotations that aren't part of the cut paths</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="text-green-500 mt-0.5">✓</span>
                    <span>Files are validated during import - errors will be reported</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="text-green-500 mt-0.5">✓</span>
                    <span>Large files may take longer to process</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </Show>

        <Show when={activeTab() === 'export'}>
          <div class="space-y-6">
            <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h4 class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">{t('export_options')}</h4>
              <p class="text-gray-600 dark:text-gray-400 mb-6">Export your nesting results in various formats for manufacturing or sharing.</p>

              <div class="grid grid-cols-3 gap-4 mb-6">
                <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-center">
                  <div class="text-2xl font-bold text-gray-900 dark:text-gray-100">{globalState.app.parts.length}</div>
                  <div class="text-sm text-gray-600 dark:text-gray-400">Parts</div>
                </div>
                <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-center">
                  <div class="text-2xl font-bold text-gray-900 dark:text-gray-100">{globalState.app.sheets.length}</div>
                  <div class="text-sm text-gray-600 dark:text-gray-400">Sheets</div>
                </div>
                <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-center">
                  <div class="text-2xl font-bold text-gray-900 dark:text-gray-100">{globalState.app.nests.length}</div>
                  <div class="text-sm text-gray-600 dark:text-gray-400">Nesting Results</div>
                </div>
              </div>

              <div class="text-center">
                <button 
                  class="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                  onClick={openExportDialog}
                  disabled={!hasNestingResults() && !hasParts()}
                >
                  {t('export_options')}
                </button>
                
                <Show when={!hasNestingResults() && !hasParts()}>
                  <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    Import parts and run nesting to enable export options.
                  </p>
                </Show>
              </div>
            </div>

            <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h5 class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Available Export Formats</h5>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                  <div class="font-medium text-gray-900 dark:text-gray-100 mb-2">SVG</div>
                  <div class="text-sm text-gray-600 dark:text-gray-400">Vector graphics for laser cutters and CNC machines</div>
                </div>
                <div class="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                  <div class="font-medium text-gray-900 dark:text-gray-100 mb-2">DXF</div>
                  <div class="text-sm text-gray-600 dark:text-gray-400">CAD format for AutoCAD and other design software</div>
                </div>
                <div class="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                  <div class="font-medium text-gray-900 dark:text-gray-100 mb-2">PDF</div>
                  <div class="text-sm text-gray-600 dark:text-gray-400">Print-ready documents for documentation</div>
                </div>
                <div class="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                  <div class="font-medium text-gray-900 dark:text-gray-100 mb-2">JSON</div>
                  <div class="text-sm text-gray-600 dark:text-gray-400">Project data for importing back into DeepNest</div>
                </div>
              </div>
            </div>
          </div>
        </Show>

        <Show when={activeTab() === 'recent'}>
          <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <RecentFiles 
              onFileSelect={handleRecentFileSelect}
              maxFiles={20}
            />
          </div>
        </Show>
      </div>

      <ExportDialog 
        isOpen={showExportDialog()}
        onClose={() => setShowExportDialog(false)}
        onExport={handleExport}
      />
    </div>
  );
};

export default FilesPanel;