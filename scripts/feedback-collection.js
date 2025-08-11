#!/usr/bin/env node

/**
 * Feedback Collection Script
 * 
 * This script helps collect and manage user feedback during the UI migration testing phase.
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Feedback categories
const feedbackCategories = {
  'bug': 'Bug Report',
  'feature': 'Feature Request',
  'usability': 'Usability Feedback',
  'performance': 'Performance Issue',
  'comparison': 'UI Comparison',
  'general': 'General Feedback'
};

// Severity levels
const severityLevels = {
  'critical': 'Critical - Blocks testing',
  'high': 'High - Significant impact',
  'medium': 'Medium - Moderate impact',
  'low': 'Low - Minor issue',
  'enhancement': 'Enhancement - Nice to have'
};

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Function to ask questions
function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

// Function to get feedback directory
function getFeedbackDirectory() {
  const feedbackDir = path.join(__dirname, '../feedback');
  if (!fs.existsSync(feedbackDir)) {
    fs.mkdirSync(feedbackDir, { recursive: true });
  }
  return feedbackDir;
}

// Function to generate feedback ID
function generateFeedbackId() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const random = Math.random().toString(36).substr(2, 5);
  return `feedback-${timestamp}-${random}`;
}

// Function to collect feedback
async function collectFeedback() {
  console.log('=== Deepnest UI Feedback Collection ===\n');
  
  const feedback = {
    id: generateFeedbackId(),
    timestamp: new Date().toISOString(),
    category: '',
    severity: '',
    title: '',
    description: '',
    stepsToReproduce: '',
    expectedBehavior: '',
    actualBehavior: '',
    uiVersion: '',
    environment: {
      os: process.platform,
      nodeVersion: process.version,
      userAgent: process.env.npm_config_user_agent || 'unknown'
    },
    rating: {
      easeOfUse: 0,
      performance: 0,
      visualAppeal: 0,
      functionality: 0,
      stability: 0
    },
    additionalComments: ''
  };
  
  // Category selection
  console.log('Available categories:');
  Object.entries(feedbackCategories).forEach(([key, value]) => {
    console.log(`  ${key}: ${value}`);
  });
  
  const category = await askQuestion('\nSelect category: ');
  if (feedbackCategories[category]) {
    feedback.category = category;
  } else {
    console.log('Invalid category, using "general"');
    feedback.category = 'general';
  }
  
  // Severity selection
  console.log('\nAvailable severity levels:');
  Object.entries(severityLevels).forEach(([key, value]) => {
    console.log(`  ${key}: ${value}`);
  });
  
  const severity = await askQuestion('\nSelect severity: ');
  if (severityLevels[severity]) {
    feedback.severity = severity;
  } else {
    console.log('Invalid severity, using "medium"');
    feedback.severity = 'medium';
  }
  
  // UI version
  const uiVersion = await askQuestion('\nWhich UI were you testing? (new/legacy/both): ');
  feedback.uiVersion = uiVersion || 'unknown';
  
  // Basic information
  feedback.title = await askQuestion('\nFeedback title: ');
  feedback.description = await askQuestion('Detailed description: ');
  
  // Bug-specific information
  if (feedback.category === 'bug') {
    feedback.stepsToReproduce = await askQuestion('Steps to reproduce: ');
    feedback.expectedBehavior = await askQuestion('Expected behavior: ');
    feedback.actualBehavior = await askQuestion('Actual behavior: ');
  }
  
  // Rating collection
  if (feedback.category === 'usability' || feedback.category === 'comparison') {
    console.log('\nPlease rate the following aspects (1-5, 1=Much Worse, 5=Much Better):');
    
    try {
      feedback.rating.easeOfUse = parseInt(await askQuestion('Ease of Use (1-5): ')) || 0;
      feedback.rating.performance = parseInt(await askQuestion('Performance (1-5): ')) || 0;
      feedback.rating.visualAppeal = parseInt(await askQuestion('Visual Appeal (1-5): ')) || 0;
      feedback.rating.functionality = parseInt(await askQuestion('Functionality (1-5): ')) || 0;
      feedback.rating.stability = parseInt(await askQuestion('Stability (1-5): ')) || 0;
    } catch (error) {
      console.log('Invalid rating input, using defaults');
    }
  }
  
  // Additional comments
  feedback.additionalComments = await askQuestion('Additional comments (optional): ');
  
  return feedback;
}

// Function to save feedback
function saveFeedback(feedback) {
  const feedbackDir = getFeedbackDirectory();
  const filename = `${feedback.id}.json`;
  const filepath = path.join(feedbackDir, filename);
  
  fs.writeFileSync(filepath, JSON.stringify(feedback, null, 2));
  console.log(`\nFeedback saved to: ${filepath}`);
  
  // Also append to summary file
  const summaryPath = path.join(feedbackDir, 'feedback-summary.jsonl');
  const summaryEntry = {
    id: feedback.id,
    timestamp: feedback.timestamp,
    category: feedback.category,
    severity: feedback.severity,
    title: feedback.title,
    uiVersion: feedback.uiVersion
  };
  
  fs.appendFileSync(summaryPath, JSON.stringify(summaryEntry) + '\n');
}

// Function to load all feedback
function loadAllFeedback() {
  const feedbackDir = getFeedbackDirectory();
  const files = fs.readdirSync(feedbackDir);
  const feedback = [];
  
  files.forEach(file => {
    if (file.endsWith('.json') && file !== 'feedback-summary.jsonl') {
      try {
        const content = fs.readFileSync(path.join(feedbackDir, file), 'utf8');
        const data = JSON.parse(content);
        feedback.push(data);
      } catch (error) {
        console.warn(`Could not load feedback file: ${file}`);
      }
    }
  });
  
  return feedback.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

// Function to generate feedback summary
function generateFeedbackSummary() {
  const allFeedback = loadAllFeedback();
  
  const summary = {
    totalFeedback: allFeedback.length,
    categories: {},
    severities: {},
    uiVersions: {},
    averageRatings: {
      easeOfUse: 0,
      performance: 0,
      visualAppeal: 0,
      functionality: 0,
      stability: 0
    },
    recentFeedback: allFeedback.slice(0, 5),
    timestamp: new Date().toISOString()
  };
  
  // Count categories
  allFeedback.forEach(feedback => {
    summary.categories[feedback.category] = (summary.categories[feedback.category] || 0) + 1;
    summary.severities[feedback.severity] = (summary.severities[feedback.severity] || 0) + 1;
    summary.uiVersions[feedback.uiVersion] = (summary.uiVersions[feedback.uiVersion] || 0) + 1;
  });
  
  // Calculate average ratings
  const ratedFeedback = allFeedback.filter(f => f.rating && Object.values(f.rating).some(r => r > 0));
  if (ratedFeedback.length > 0) {
    const totals = { easeOfUse: 0, performance: 0, visualAppeal: 0, functionality: 0, stability: 0 };
    
    ratedFeedback.forEach(feedback => {
      Object.keys(totals).forEach(key => {
        totals[key] += feedback.rating[key] || 0;
      });
    });
    
    Object.keys(totals).forEach(key => {
      summary.averageRatings[key] = (totals[key] / ratedFeedback.length).toFixed(1);
    });
  }
  
  return summary;
}

// Function to print feedback summary
function printFeedbackSummary(summary) {
  console.log('\n=== Feedback Summary ===');
  console.log(`Total feedback entries: ${summary.totalFeedback}`);
  console.log(`Generated: ${new Date(summary.timestamp).toLocaleString()}`);
  
  if (summary.totalFeedback === 0) {
    console.log('No feedback collected yet.');
    return;
  }
  
  console.log('\n=== Category Breakdown ===');
  Object.entries(summary.categories).forEach(([category, count]) => {
    const percentage = ((count / summary.totalFeedback) * 100).toFixed(1);
    console.log(`${feedbackCategories[category] || category}: ${count} (${percentage}%)`);
  });
  
  console.log('\n=== Severity Breakdown ===');
  Object.entries(summary.severities).forEach(([severity, count]) => {
    const percentage = ((count / summary.totalFeedback) * 100).toFixed(1);
    console.log(`${severityLevels[severity] || severity}: ${count} (${percentage}%)`);
  });
  
  console.log('\n=== UI Version Breakdown ===');
  Object.entries(summary.uiVersions).forEach(([version, count]) => {
    const percentage = ((count / summary.totalFeedback) * 100).toFixed(1);
    console.log(`${version}: ${count} (${percentage}%)`);
  });
  
  // Show ratings if available
  const hasRatings = Object.values(summary.averageRatings).some(r => r > 0);
  if (hasRatings) {
    console.log('\n=== Average Ratings ===');
    Object.entries(summary.averageRatings).forEach(([aspect, rating]) => {
      if (rating > 0) {
        console.log(`${aspect.replace(/([A-Z])/g, ' $1').trim()}: ${rating}/5`);
      }
    });
  }
  
  console.log('\n=== Recent Feedback ===');
  summary.recentFeedback.forEach((feedback, index) => {
    console.log(`${index + 1}. [${feedback.severity}] ${feedback.title} (${feedback.category})`);
  });
}

// Function to export feedback
function exportFeedback(format = 'json') {
  const allFeedback = loadAllFeedback();
  const summary = generateFeedbackSummary();
  
  const exportData = {
    summary,
    feedback: allFeedback
  };
  
  const feedbackDir = getFeedbackDirectory();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  
  if (format === 'json') {
    const filename = `feedback-export-${timestamp}.json`;
    const filepath = path.join(feedbackDir, filename);
    fs.writeFileSync(filepath, JSON.stringify(exportData, null, 2));
    console.log(`Feedback exported to: ${filepath}`);
  } else if (format === 'csv') {
    const filename = `feedback-export-${timestamp}.csv`;
    const filepath = path.join(feedbackDir, filename);
    
    // Create CSV header
    const csvHeaders = ['ID', 'Timestamp', 'Category', 'Severity', 'Title', 'UI Version', 'Description'];
    const csvRows = [csvHeaders.join(',')];
    
    // Add feedback rows
    allFeedback.forEach(feedback => {
      const row = [
        feedback.id,
        feedback.timestamp,
        feedback.category,
        feedback.severity,
        `"${feedback.title.replace(/"/g, '""')}"`,
        feedback.uiVersion,
        `"${feedback.description.replace(/"/g, '""')}"`
      ];
      csvRows.push(row.join(','));
    });
    
    fs.writeFileSync(filepath, csvRows.join('\n'));
    console.log(`Feedback exported to: ${filepath}`);
  }
}

// Main function
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  try {
    switch (command) {
      case 'collect':
      case 'submit':
        const feedback = await collectFeedback();
        saveFeedback(feedback);
        console.log('\nThank you for your feedback!');
        break;
        
      case 'summary':
      case 'show':
        const summary = generateFeedbackSummary();
        printFeedbackSummary(summary);
        break;
        
      case 'export':
        const format = args[1] || 'json';
        exportFeedback(format);
        break;
        
      case 'list':
        const allFeedback = loadAllFeedback();
        console.log('\n=== All Feedback ===');
        allFeedback.forEach((feedback, index) => {
          console.log(`${index + 1}. ${feedback.title} [${feedback.category}/${feedback.severity}]`);
          console.log(`   ${feedback.timestamp} - ${feedback.uiVersion}`);
        });
        break;
        
      case 'help':
      default:
        console.log('Feedback Collection Tool');
        console.log('');
        console.log('Commands:');
        console.log('  collect, submit    Collect new feedback');
        console.log('  summary, show      Show feedback summary');
        console.log('  export [format]    Export feedback (json/csv)');
        console.log('  list               List all feedback entries');
        console.log('  help               Show this help message');
        break;
    }
  } finally {
    rl.close();
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  collectFeedback,
  saveFeedback,
  loadAllFeedback,
  generateFeedbackSummary,
  printFeedbackSummary,
  exportFeedback
};