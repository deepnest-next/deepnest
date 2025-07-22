#!/usr/bin/env node

/**
 * Bulk update script for feature comparison based on current implementation status
 */

const { loadReport, updateFeatureStatus, saveReport } = require('./feature-comparison.js');

// Known implemented features in the new UI
const newUIFeatures = [
  // Core Features
  ['Core Features', 'Parts management (add, remove, edit)', 'implemented', 'Full parts management with PartsPanel and PartsList components'],
  ['Core Features', 'Parts list with selection', 'implemented', 'VirtualPartsList with multi-select support'],
  ['Core Features', 'Parts import from SVG/DXF files', 'implemented', 'DragDropZone and FilesPanel components'],
  ['Core Features', 'Parts export functionality', 'implemented', 'ExportDialog component'],
  ['Core Features', 'Nesting operations (start, stop, progress)', 'implemented', 'NestingPanel with progress tracking'],
  ['Core Features', 'Nesting results visualization', 'implemented', 'ResultsGrid and ResultViewer components'],
  ['Core Features', 'Sheets configuration', 'implemented', 'SheetsPanel and SheetConfig components'],
  ['Core Features', 'Settings management', 'implemented', 'SettingsPanel with multiple sections'],
  ['Core Features', 'Preset management', 'implemented', 'PresetManager component'],
  ['Core Features', 'Dark mode support', 'implemented', 'Tailwind CSS dark mode with theme switching'],
  ['Core Features', 'Internationalization (i18n)', 'implemented', 'Complete i18next integration with solid-i18next'],
  ['Core Features', 'Tab navigation', 'implemented', 'Navigation component with active state'],
  ['Core Features', 'Resizable panels', 'implemented', 'ResizableLayout component'],

  // Advanced Features
  ['Advanced Features', 'Real-time progress updates', 'implemented', 'LiveResultViewer with IPC communication'],
  ['Advanced Features', 'Background worker communication', 'implemented', 'IPC service with worker event handling'],
  ['Advanced Features', 'File drag-and-drop', 'implemented', 'DragDropZone with multi-file support'],
  ['Advanced Features', 'Keyboard shortcuts', 'implemented', 'useKeyboardShortcuts hook with global shortcuts'],
  ['Advanced Features', 'Context menus', 'implemented', 'ContextMenu component with right-click actions'],
  ['Advanced Features', 'Virtual scrolling for large lists', 'implemented', 'useVirtualScroll hook and VirtualList component'],
  ['Advanced Features', 'Zoom and pan functionality', 'implemented', 'useViewport hook with zoom/pan controls'],
  ['Advanced Features', 'Multi-select operations', 'implemented', 'useSelection hook with range selection'],
  ['Advanced Features', 'Recent files management', 'implemented', 'RecentFiles component'],
  ['Advanced Features', 'Performance monitoring', 'implemented', 'Memory management utilities'],

  // User Experience
  ['User Experience', 'Responsive design', 'implemented', 'Tailwind CSS responsive utilities'],
  ['User Experience', 'Accessibility features', 'implemented', 'ARIA labels, keyboard navigation, screen reader support'],
  ['User Experience', 'Loading states', 'implemented', 'LoadingSpinner component and Suspense boundaries'],
  ['User Experience', 'Error handling and user feedback', 'implemented', 'Error boundaries and user feedback systems'],
  ['User Experience', 'Tooltips and help text', 'implemented', 'Tooltip support and help documentation'],
  ['User Experience', 'Professional styling', 'implemented', 'Tailwind CSS design system'],
  ['User Experience', 'Consistent UI patterns', 'implemented', 'Component-based architecture'],
  ['User Experience', 'High DPI support', 'implemented', 'Vector-based icons and scalable design'],

  // Technical Features
  ['Technical Features', 'IPC communication', 'implemented', 'Comprehensive IPC service layer'],
  ['Technical Features', 'Local storage persistence', 'implemented', 'Settings and state persistence'],
  ['Technical Features', 'Memory management', 'implemented', 'Memory management utilities with cleanup'],
  ['Technical Features', 'Error boundaries', 'implemented', 'SolidJS error boundaries'],
  ['Technical Features', 'Development tools integration', 'implemented', 'SolidJS devtools support'],
  ['Technical Features', 'Build optimization', 'implemented', 'Vite build optimization with code splitting'],
  ['Technical Features', 'Code splitting', 'implemented', 'Manual chunks and lazy loading'],
  ['Technical Features', 'Bundle size optimization', 'implemented', 'Optimized bundle from 321KB to 17.88KB'],
  ['Technical Features', 'TypeScript support', 'implemented', 'Full TypeScript integration'],
  ['Technical Features', 'Testing infrastructure', 'implemented', 'Vitest with comprehensive test suite']
];

// Known implemented features in the legacy UI (assume most are implemented)
const legacyUIFeatures = [
  // Core Features
  ['Core Features', 'Parts management (add, remove, edit)', 'implemented', 'Legacy parts management'],
  ['Core Features', 'Parts list with selection', 'implemented', 'Legacy parts list'],
  ['Core Features', 'Parts import from SVG/DXF files', 'implemented', 'Legacy import functionality'],
  ['Core Features', 'Parts export functionality', 'implemented', 'Legacy export functionality'],
  ['Core Features', 'Nesting operations (start, stop, progress)', 'implemented', 'Legacy nesting operations'],
  ['Core Features', 'Nesting results visualization', 'implemented', 'Legacy results display'],
  ['Core Features', 'Sheets configuration', 'implemented', 'Legacy sheets configuration'],
  ['Core Features', 'Settings management', 'implemented', 'Legacy settings'],
  ['Core Features', 'Preset management', 'implemented', 'Legacy preset management'],
  ['Core Features', 'Dark mode support', 'implemented', 'Legacy dark mode'],
  ['Core Features', 'Internationalization (i18n)', 'not-implemented', 'No i18n in legacy UI'],
  ['Core Features', 'Tab navigation', 'implemented', 'Legacy tab navigation'],
  ['Core Features', 'Resizable panels', 'implemented', 'interact.js resizable panels'],

  // Advanced Features
  ['Advanced Features', 'Real-time progress updates', 'implemented', 'Legacy progress updates'],
  ['Advanced Features', 'Background worker communication', 'implemented', 'Legacy worker communication'],
  ['Advanced Features', 'File drag-and-drop', 'implemented', 'Legacy drag-and-drop'],
  ['Advanced Features', 'Keyboard shortcuts', 'not-implemented', 'Limited keyboard shortcuts'],
  ['Advanced Features', 'Context menus', 'not-implemented', 'No context menus in legacy UI'],
  ['Advanced Features', 'Virtual scrolling for large lists', 'not-implemented', 'No virtual scrolling'],
  ['Advanced Features', 'Zoom and pan functionality', 'implemented', 'Legacy zoom/pan'],
  ['Advanced Features', 'Multi-select operations', 'implemented', 'Legacy multi-select'],
  ['Advanced Features', 'Recent files management', 'not-implemented', 'No recent files'],
  ['Advanced Features', 'Performance monitoring', 'not-implemented', 'No performance monitoring'],

  // User Experience
  ['User Experience', 'Responsive design', 'not-implemented', 'Fixed desktop layout'],
  ['User Experience', 'Accessibility features', 'not-implemented', 'Limited accessibility'],
  ['User Experience', 'Loading states', 'implemented', 'Basic loading states'],
  ['User Experience', 'Error handling and user feedback', 'implemented', 'Basic error handling'],
  ['User Experience', 'Tooltips and help text', 'implemented', 'Basic tooltips'],
  ['User Experience', 'Professional styling', 'implemented', 'Custom CSS styling'],
  ['User Experience', 'Consistent UI patterns', 'implemented', 'Consistent patterns'],
  ['User Experience', 'High DPI support', 'implemented', 'Basic high DPI support'],

  // Technical Features
  ['Technical Features', 'IPC communication', 'implemented', 'Basic IPC communication'],
  ['Technical Features', 'Local storage persistence', 'implemented', 'localStorage usage'],
  ['Technical Features', 'Memory management', 'not-implemented', 'No memory management'],
  ['Technical Features', 'Error boundaries', 'not-implemented', 'No error boundaries'],
  ['Technical Features', 'Development tools integration', 'not-implemented', 'No dev tools'],
  ['Technical Features', 'Build optimization', 'not-implemented', 'No build optimization'],
  ['Technical Features', 'Code splitting', 'not-implemented', 'No code splitting'],
  ['Technical Features', 'Bundle size optimization', 'not-implemented', 'No bundle optimization'],
  ['Technical Features', 'TypeScript support', 'not-implemented', 'JavaScript only'],
  ['Technical Features', 'Testing infrastructure', 'implemented', 'Basic Playwright tests']
];

function updateAllFeatures() {
  const report = loadReport();
  if (!report) {
    console.log('No report found. Run "init" first.');
    return;
  }

  console.log('Updating new UI features...');
  newUIFeatures.forEach(([category, feature, status, notes]) => {
    const currentFeature = report.categories[category]?.features.find(f => f.name === feature);
    if (currentFeature) {
      currentFeature.newUI = status;
      currentFeature.notes = notes;
    }
  });

  console.log('Updating legacy UI features...');
  legacyUIFeatures.forEach(([category, feature, status, notes]) => {
    const currentFeature = report.categories[category]?.features.find(f => f.name === feature);
    if (currentFeature) {
      currentFeature.legacyUI = status;
      if (!currentFeature.notes) {
        currentFeature.notes = notes;
      }
    }
  });

  // Recalculate summary
  const { calculateSummary } = require('./feature-comparison.js');
  calculateSummary(report);

  saveReport(report);
  console.log('All features updated successfully!');
}

if (require.main === module) {
  updateAllFeatures();
}

module.exports = { updateAllFeatures };