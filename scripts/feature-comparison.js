#!/usr/bin/env node

/**
 * Feature Comparison Script
 * 
 * This script helps track feature parity between the legacy and new UI
 * by providing a structured way to document and compare functionality.
 */

const fs = require('fs');
const path = require('path');

// Feature categories and their items
const featureCategories = {
  'Core Features': [
    'Parts management (add, remove, edit)',
    'Parts list with selection',
    'Parts import from SVG/DXF files',
    'Parts export functionality',
    'Nesting operations (start, stop, progress)',
    'Nesting results visualization',
    'Sheets configuration',
    'Settings management',
    'Preset management',
    'Dark mode support',
    'Internationalization (i18n)',
    'Tab navigation',
    'Resizable panels'
  ],
  'Advanced Features': [
    'Real-time progress updates',
    'Background worker communication',
    'File drag-and-drop',
    'Keyboard shortcuts',
    'Context menus',
    'Virtual scrolling for large lists',
    'Zoom and pan functionality',
    'Multi-select operations',
    'Undo/redo operations',
    'Auto-save functionality',
    'Recent files management',
    'Performance monitoring'
  ],
  'User Experience': [
    'Responsive design',
    'Accessibility features',
    'Loading states',
    'Error handling and user feedback',
    'Tooltips and help text',
    'Smooth animations',
    'Professional styling',
    'Consistent UI patterns',
    'Mobile-friendly interface',
    'High DPI support'
  ],
  'Technical Features': [
    'IPC communication',
    'Local storage persistence',
    'Memory management',
    'Error boundaries',
    'Development tools integration',
    'Build optimization',
    'Code splitting',
    'Bundle size optimization',
    'TypeScript support',
    'Testing infrastructure'
  ]
};

// Function to generate comparison report
function generateComparisonReport() {
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalFeatures: 0,
      legacyImplemented: 0,
      newImplemented: 0,
      parityPercentage: 0
    },
    categories: {}
  };

  // Initialize categories
  Object.keys(featureCategories).forEach(category => {
    report.categories[category] = {
      features: featureCategories[category].map(feature => ({
        name: feature,
        legacyUI: 'unknown', // 'implemented', 'not-implemented', 'unknown'
        newUI: 'unknown',
        notes: '',
        priority: 'medium' // 'high', 'medium', 'low'
      })),
      completion: {
        legacy: 0,
        new: 0,
        parity: 0
      }
    };
    report.summary.totalFeatures += featureCategories[category].length;
  });

  return report;
}

// Function to save report
function saveReport(report) {
  const reportPath = path.join(__dirname, '../reports/feature-comparison.json');
  const reportDir = path.dirname(reportPath);
  
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }
  
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`Feature comparison report saved to: ${reportPath}`);
}

// Function to load existing report
function loadReport() {
  const reportPath = path.join(__dirname, '../reports/feature-comparison.json');
  
  if (fs.existsSync(reportPath)) {
    try {
      const data = fs.readFileSync(reportPath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.warn('Could not load existing report, creating new one');
    }
  }
  
  return null;
}

// Function to print report summary
function printSummary(report) {
  console.log('\n=== Feature Comparison Summary ===');
  console.log(`Report generated: ${new Date(report.timestamp).toLocaleString()}`);
  console.log(`Total features: ${report.summary.totalFeatures}`);
  console.log(`Legacy UI implemented: ${report.summary.legacyImplemented}`);
  console.log(`New UI implemented: ${report.summary.newImplemented}`);
  console.log(`Parity percentage: ${report.summary.parityPercentage.toFixed(1)}%`);
  
  console.log('\n=== Category Breakdown ===');
  Object.keys(report.categories).forEach(category => {
    const cat = report.categories[category];
    console.log(`${category}:`);
    console.log(`  - Legacy: ${cat.completion.legacy}/${cat.features.length}`);
    console.log(`  - New: ${cat.completion.new}/${cat.features.length}`);
    console.log(`  - Parity: ${cat.completion.parity.toFixed(1)}%`);
  });
}

// Function to update feature status
function updateFeatureStatus(report, category, featureName, legacyStatus, newStatus, notes = '') {
  if (!report.categories[category]) {
    console.error(`Category "${category}" not found`);
    return false;
  }
  
  const feature = report.categories[category].features.find(f => f.name === featureName);
  if (!feature) {
    console.error(`Feature "${featureName}" not found in category "${category}"`);
    return false;
  }
  
  feature.legacyUI = legacyStatus;
  feature.newUI = newStatus;
  if (notes) feature.notes = notes;
  
  // Recalculate summary
  calculateSummary(report);
  
  return true;
}

// Function to calculate summary statistics
function calculateSummary(report) {
  let totalFeatures = 0;
  let legacyImplemented = 0;
  let newImplemented = 0;
  
  Object.keys(report.categories).forEach(category => {
    const cat = report.categories[category];
    let legacyCount = 0;
    let newCount = 0;
    
    cat.features.forEach(feature => {
      totalFeatures++;
      if (feature.legacyUI === 'implemented') {
        legacyImplemented++;
        legacyCount++;
      }
      if (feature.newUI === 'implemented') {
        newImplemented++;
        newCount++;
      }
    });
    
    cat.completion.legacy = legacyCount;
    cat.completion.new = newCount;
    cat.completion.parity = legacyCount > 0 ? (newCount / legacyCount) * 100 : 0;
  });
  
  report.summary.totalFeatures = totalFeatures;
  report.summary.legacyImplemented = legacyImplemented;
  report.summary.newImplemented = newImplemented;
  report.summary.parityPercentage = legacyImplemented > 0 ? (newImplemented / legacyImplemented) * 100 : 0;
}

// Main function
function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  switch (command) {
    case 'init':
      console.log('Initializing feature comparison report...');
      const report = generateComparisonReport();
      saveReport(report);
      console.log('Report initialized successfully');
      break;
      
    case 'show':
      const existingReport = loadReport();
      if (existingReport) {
        printSummary(existingReport);
      } else {
        console.log('No report found. Run "init" first.');
      }
      break;
      
    case 'update':
      // Example: node feature-comparison.js update "Core Features" "Parts management" implemented implemented "Fully working"
      const [category, featureName, legacyStatus, newStatus, notes] = args.slice(1);
      const reportToUpdate = loadReport();
      
      if (!reportToUpdate) {
        console.log('No report found. Run "init" first.');
        break;
      }
      
      if (updateFeatureStatus(reportToUpdate, category, featureName, legacyStatus, newStatus, notes)) {
        saveReport(reportToUpdate);
        console.log('Feature status updated successfully');
      }
      break;
      
    case 'help':
    default:
      console.log('Feature Comparison Tool');
      console.log('');
      console.log('Commands:');
      console.log('  init              Initialize new comparison report');
      console.log('  show              Show current report summary');
      console.log('  update <category> <feature> <legacy> <new> [notes]  Update feature status');
      console.log('  help              Show this help message');
      console.log('');
      console.log('Status values: implemented, not-implemented, unknown');
      console.log('');
      console.log('Examples:');
      console.log('  node feature-comparison.js init');
      console.log('  node feature-comparison.js show');
      console.log('  node feature-comparison.js update "Core Features" "Parts management" implemented implemented "Working well"');
      break;
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  generateComparisonReport,
  saveReport,
  loadReport,
  updateFeatureStatus,
  calculateSummary,
  printSummary
};