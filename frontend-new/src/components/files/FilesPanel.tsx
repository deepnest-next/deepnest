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
    <div class={`files-panel ${props.class || ''}`}>
      <div class="panel-header">
        <h2>{t('file_operations')}</h2>
        
        <div class="tab-navigation">
          <button 
            class={`tab-button ${activeTab() === 'import' ? 'active' : ''}`}
            onClick={() => setActiveTab('import')}
          >
            {t('import_files')}
          </button>
          <button 
            class={`tab-button ${activeTab() === 'export' ? 'active' : ''}`}
            onClick={() => setActiveTab('export')}
          >
            {t('export_options')}
          </button>
          <button 
            class={`tab-button ${activeTab() === 'recent' ? 'active' : ''}`}
            onClick={() => setActiveTab('recent')}
          >
            {t('recent_files')}
          </button>
        </div>
      </div>

      <div class="panel-content">
        <Show when={activeTab() === 'import'}>
          <div class="import-section">
            <DragDropZone 
              onFilesSelected={handleFilesImported}
              accept=".svg,.dxf,.json"
              maxFileSize={10 * 1024 * 1024} // 10MB
              maxFiles={50}
            />
            
            <div class="import-info">
              <h4>Supported File Formats</h4>
              <ul class="format-list">
                <li>
                  <strong>SVG</strong> - Scalable Vector Graphics files from design software
                </li>
                <li>
                  <strong>DXF</strong> - AutoCAD Drawing Exchange Format files
                </li>
                <li>
                  <strong>JSON</strong> - DeepNest project files with parts and settings
                </li>
              </ul>
              
              <div class="import-tips">
                <h5>Import Tips</h5>
                <ul>
                  <li>Ensure your files contain closed paths for proper nesting</li>
                  <li>Remove any text or annotations that aren't part of the cut paths</li>
                  <li>Files are validated during import - errors will be reported</li>
                  <li>Large files may take longer to process</li>
                </ul>
              </div>
            </div>
          </div>
        </Show>

        <Show when={activeTab() === 'export'}>
          <div class="export-section">
            <div class="export-overview">
              <h4>{t('export_options')}</h4>
              <p>Export your nesting results in various formats for manufacturing or sharing.</p>
            </div>

            <div class="export-stats">
              <div class="stat-item">
                <span class="stat-label">Parts:</span>
                <span class="stat-value">{globalState.app.parts.length}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Sheets:</span>
                <span class="stat-value">{globalState.app.sheets.length}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Nesting Results:</span>
                <span class="stat-value">{globalState.app.nests.length}</span>
              </div>
            </div>

            <div class="export-actions">
              <button 
                class="button primary large"
                onClick={openExportDialog}
                disabled={!hasNestingResults() && !hasParts()}
              >
                {t('export_options')}
              </button>
              
              <Show when={!hasNestingResults() && !hasParts()}>
                <p class="export-disabled-message">
                  Import parts and run nesting to enable export options.
                </p>
              </Show>
            </div>

            <div class="export-formats">
              <h5>Available Export Formats</h5>
              <div class="format-grid">
                <div class="format-item">
                  <strong>SVG</strong>
                  <span>Vector graphics for laser cutters and CNC machines</span>
                </div>
                <div class="format-item">
                  <strong>DXF</strong>
                  <span>CAD format for AutoCAD and other design software</span>
                </div>
                <div class="format-item">
                  <strong>PDF</strong>
                  <span>Print-ready documents for documentation</span>
                </div>
                <div class="format-item">
                  <strong>JSON</strong>
                  <span>Project data for importing back into DeepNest</span>
                </div>
              </div>
            </div>
          </div>
        </Show>

        <Show when={activeTab() === 'recent'}>
          <div class="recent-section">
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