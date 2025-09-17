#!/usr/bin/env node

/**
 * Deployment Monitoring Script
 * 
 * This script monitors the deployment progress, collects metrics,
 * and provides insights into the rollout performance.
 */

const fs = require('fs');
const path = require('path');
const { loadRolloutConfig } = require('./ui-rollout');
const { loadAllFeedback, generateFeedbackSummary } = require('./feedback-collection');
const { generatePerformanceReport } = require('./performance-validation');

// Function to get deployment metrics
function getDeploymentMetrics() {
  const config = loadRolloutConfig();
  const feedback = loadAllFeedback();
  const feedbackSummary = generateFeedbackSummary();
  const performanceReport = generatePerformanceReport();
  
  const metrics = {
    timestamp: new Date().toISOString(),
    rollout: {
      enabled: config.rolloutStrategy.enabled,
      currentPhase: config.deployment.currentPhase,
      percentage: config.rolloutStrategy.rolloutPercentage,
      defaultUI: config.rolloutStrategy.defaultUI
    },
    feedback: {
      total: feedbackSummary.totalFeedback,
      categories: feedbackSummary.categories,
      severities: feedbackSummary.severities,
      averageRatings: feedbackSummary.averageRatings,
      recentCount: feedbackSummary.recentFeedback.length
    },
    performance: {
      bundleSize: performanceReport.summary.bundleSize,
      overallScore: performanceReport.summary.analysis.overallScore,
      bundleImprovement: performanceReport.summary.analysis.bundleImprovement
    },
    health: {
      criticalIssues: 0,
      performanceIssues: 0,
      userComplaints: 0,
      overallHealth: 'good'
    }
  };
  
  // Calculate health metrics
  if (feedback.length > 0) {
    const criticalFeedback = feedback.filter(f => f.severity === 'critical');
    const performanceFeedback = feedback.filter(f => f.category === 'performance');
    const bugReports = feedback.filter(f => f.category === 'bug');
    
    metrics.health.criticalIssues = criticalFeedback.length;
    metrics.health.performanceIssues = performanceFeedback.length;
    metrics.health.userComplaints = bugReports.length;
    
    // Determine overall health
    const totalIssues = criticalFeedback.length + performanceFeedback.length;
    const healthPercentage = Math.max(0, 100 - (totalIssues / feedback.length * 100));
    
    if (healthPercentage >= 90) {
      metrics.health.overallHealth = 'excellent';
    } else if (healthPercentage >= 75) {
      metrics.health.overallHealth = 'good';
    } else if (healthPercentage >= 50) {
      metrics.health.overallHealth = 'fair';
    } else {
      metrics.health.overallHealth = 'poor';
    }
  }
  
  return metrics;
}

// Function to save deployment metrics
function saveDeploymentMetrics(metrics) {
  const metricsDir = path.join(__dirname, '../reports');
  if (!fs.existsSync(metricsDir)) {
    fs.mkdirSync(metricsDir, { recursive: true });
  }
  
  // Save current metrics
  const metricsPath = path.join(metricsDir, 'deployment-metrics.json');
  fs.writeFileSync(metricsPath, JSON.stringify(metrics, null, 2));
  
  // Append to history
  const historyPath = path.join(metricsDir, 'deployment-history.jsonl');
  const historyEntry = {
    timestamp: metrics.timestamp,
    phase: metrics.rollout.currentPhase,
    percentage: metrics.rollout.percentage,
    health: metrics.health.overallHealth,
    feedbackCount: metrics.feedback.total,
    criticalIssues: metrics.health.criticalIssues
  };
  
  fs.appendFileSync(historyPath, JSON.stringify(historyEntry) + '\n');
  
  console.log(`Deployment metrics saved to: ${metricsPath}`);
}

// Function to check rollout health
function checkRolloutHealth(metrics) {
  const issues = [];
  const warnings = [];
  const recommendations = [];
  
  // Check critical issues
  if (metrics.health.criticalIssues > 0) {
    issues.push(`${metrics.health.criticalIssues} critical issues reported`);
    recommendations.push('Consider rolling back if critical issues are blocking users');
  }
  
  // Check feedback volume
  if (metrics.feedback.total === 0 && metrics.rollout.percentage > 0) {
    warnings.push('No feedback collected yet - consider encouraging user feedback');
  }
  
  // Check performance
  if (metrics.health.performanceIssues > metrics.feedback.total * 0.1) {
    warnings.push('High percentage of performance-related feedback');
    recommendations.push('Monitor performance metrics and consider optimizations');
  }
  
  // Check overall health
  if (metrics.health.overallHealth === 'poor') {
    issues.push('Overall deployment health is poor');
    recommendations.push('Consider rolling back to previous phase');
  } else if (metrics.health.overallHealth === 'fair') {
    warnings.push('Deployment health needs attention');
    recommendations.push('Monitor closely and address reported issues');
  }
  
  // Check readiness for next phase
  const canAdvance = checkPhaseAdvancementReadiness(metrics);
  if (!canAdvance.ready) {
    warnings.push(`Not ready for next phase: ${canAdvance.reason}`);
  } else {
    recommendations.push('Deployment appears ready for next phase advancement');
  }
  
  return { issues, warnings, recommendations };
}

// Function to check if ready to advance to next phase
function checkPhaseAdvancementReadiness(metrics) {
  const currentPhase = metrics.rollout.currentPhase;
  
  // Phase-specific criteria
  switch (currentPhase) {
    case 'development':
      return {
        ready: metrics.health.criticalIssues === 0 && metrics.health.overallHealth !== 'poor',
        reason: metrics.health.criticalIssues > 0 ? 'Critical issues present' : 
                metrics.health.overallHealth === 'poor' ? 'Poor health rating' : 'Ready'
      };
      
    case 'alpha':
      return {
        ready: metrics.feedback.total >= 5 && metrics.health.criticalIssues === 0,
        reason: metrics.feedback.total < 5 ? 'Need more feedback (min 5)' :
                metrics.health.criticalIssues > 0 ? 'Critical issues present' : 'Ready'
      };
      
    case 'beta':
      return {
        ready: metrics.feedback.total >= 20 && 
               metrics.health.overallHealth !== 'poor' && 
               metrics.health.criticalIssues === 0,
        reason: metrics.feedback.total < 20 ? 'Need more feedback (min 20)' :
                metrics.health.overallHealth === 'poor' ? 'Poor health rating' :
                metrics.health.criticalIssues > 0 ? 'Critical issues present' : 'Ready'
      };
      
    case 'gradual_rollout':
      return {
        ready: metrics.feedback.total >= 50 && 
               metrics.health.overallHealth === 'good' || metrics.health.overallHealth === 'excellent',
        reason: metrics.feedback.total < 50 ? 'Need more feedback (min 50)' :
                metrics.health.overallHealth !== 'good' && metrics.health.overallHealth !== 'excellent' ? 
                'Need good or excellent health rating' : 'Ready'
      };
      
    case 'full_rollout':
      return { ready: false, reason: 'Already at final phase' };
      
    default:
      return { ready: false, reason: 'Unknown phase' };
  }
}

// Function to generate deployment report
function generateDeploymentReport() {
  const metrics = getDeploymentMetrics();
  const health = checkRolloutHealth(metrics);
  const advancement = checkPhaseAdvancementReadiness(metrics);
  
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      phase: metrics.rollout.currentPhase,
      percentage: metrics.rollout.percentage,
      health: metrics.health.overallHealth,
      totalFeedback: metrics.feedback.total,
      criticalIssues: metrics.health.criticalIssues,
      readyToAdvance: advancement.ready
    },
    metrics,
    health,
    advancement,
    recommendations: []
  };
  
  // Add overall recommendations
  if (advancement.ready) {
    report.recommendations.push('Consider advancing to next deployment phase');
  }
  
  if (metrics.feedback.total === 0) {
    report.recommendations.push('Encourage users to provide feedback through the feedback system');
  }
  
  if (metrics.health.overallHealth === 'excellent') {
    report.recommendations.push('Deployment is performing excellently - monitor and maintain current state');
  }
  
  return report;
}

// Function to print deployment status
function printDeploymentStatus(report) {
  console.log('\n=== Deployment Monitoring Report ===');
  console.log(`Generated: ${new Date(report.timestamp).toLocaleString()}`);
  console.log(`Current Phase: ${report.summary.phase} (${report.summary.percentage}%)`);
  console.log(`Overall Health: ${report.summary.health.toUpperCase()}`);
  console.log(`Total Feedback: ${report.summary.totalFeedback}`);
  console.log(`Critical Issues: ${report.summary.criticalIssues}`);
  console.log(`Ready to Advance: ${report.summary.readyToAdvance ? 'Yes' : 'No'}`);
  
  if (report.health.issues.length > 0) {
    console.log('\n🔴 ISSUES:');
    report.health.issues.forEach(issue => console.log(`  - ${issue}`));
  }
  
  if (report.health.warnings.length > 0) {
    console.log('\n🟡 WARNINGS:');
    report.health.warnings.forEach(warning => console.log(`  - ${warning}`));
  }
  
  if (report.health.recommendations.length > 0) {
    console.log('\n💡 RECOMMENDATIONS:');
    report.health.recommendations.forEach(rec => console.log(`  - ${rec}`));
  }
  
  if (report.recommendations.length > 0) {
    console.log('\n📋 OVERALL RECOMMENDATIONS:');
    report.recommendations.forEach(rec => console.log(`  - ${rec}`));
  }
  
  if (!report.advancement.ready) {
    console.log(`\n⏸️  NOT READY TO ADVANCE: ${report.advancement.reason}`);
  } else {
    console.log('\n✅ READY TO ADVANCE TO NEXT PHASE');
  }
}

// Function to get deployment history
function getDeploymentHistory() {
  const historyPath = path.join(__dirname, '../reports/deployment-history.jsonl');
  
  if (!fs.existsSync(historyPath)) {
    return [];
  }
  
  const history = [];
  const lines = fs.readFileSync(historyPath, 'utf8').split('\n').filter(line => line.trim());
  
  lines.forEach(line => {
    try {
      history.push(JSON.parse(line));
    } catch (error) {
      console.warn('Invalid history entry:', line);
    }
  });
  
  return history.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
}

// Function to print deployment history
function printDeploymentHistory(limit = 10) {
  const history = getDeploymentHistory();
  
  if (history.length === 0) {
    console.log('No deployment history available');
    return;
  }
  
  console.log('\n=== Deployment History ===');
  console.log(`Showing last ${Math.min(limit, history.length)} entries:`);
  
  history.slice(-limit).forEach((entry, index) => {
    const date = new Date(entry.timestamp).toLocaleString();
    console.log(`${history.length - limit + index + 1}. ${date}`);
    console.log(`   Phase: ${entry.phase} (${entry.percentage}%)`);
    console.log(`   Health: ${entry.health}, Feedback: ${entry.feedbackCount}, Issues: ${entry.criticalIssues}`);
  });
}

// Function to export deployment data
function exportDeploymentData(format = 'json') {
  const metrics = getDeploymentMetrics();
  const history = getDeploymentHistory();
  const report = generateDeploymentReport();
  
  const exportData = {
    currentMetrics: metrics,
    deploymentHistory: history,
    healthReport: report,
    exportTimestamp: new Date().toISOString()
  };
  
  const reportsDir = path.join(__dirname, '../reports');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  
  if (format === 'json') {
    const filename = `deployment-export-${timestamp}.json`;
    const filepath = path.join(reportsDir, filename);
    fs.writeFileSync(filepath, JSON.stringify(exportData, null, 2));
    console.log(`Deployment data exported to: ${filepath}`);
  } else if (format === 'csv') {
    const filename = `deployment-export-${timestamp}.csv`;
    const filepath = path.join(reportsDir, filename);
    
    // Create CSV header
    const csvHeaders = ['Timestamp', 'Phase', 'Percentage', 'Health', 'Feedback Count', 'Critical Issues'];
    const csvRows = [csvHeaders.join(',')];
    
    // Add history rows
    history.forEach(entry => {
      const row = [
        entry.timestamp,
        entry.phase,
        entry.percentage,
        entry.health,
        entry.feedbackCount,
        entry.criticalIssues
      ];
      csvRows.push(row.join(','));
    });
    
    fs.writeFileSync(filepath, csvRows.join('\n'));
    console.log(`Deployment data exported to: ${filepath}`);
  }
}

// Main function
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  try {
    switch (command) {
      case 'status':
      case 'report':
        const report = generateDeploymentReport();
        printDeploymentStatus(report);
        saveDeploymentMetrics(report.metrics);
        break;
        
      case 'metrics':
        const metrics = getDeploymentMetrics();
        console.log(JSON.stringify(metrics, null, 2));
        break;
        
      case 'history':
        const limit = parseInt(args[1]) || 10;
        printDeploymentHistory(limit);
        break;
        
      case 'export':
        const format = args[1] || 'json';
        exportDeploymentData(format);
        break;
        
      case 'health':
        const healthReport = generateDeploymentReport();
        console.log('\n=== Health Check ===');
        console.log(`Overall Health: ${healthReport.metrics.health.overallHealth.toUpperCase()}`);
        console.log(`Critical Issues: ${healthReport.metrics.health.criticalIssues}`);
        console.log(`Performance Issues: ${healthReport.metrics.health.performanceIssues}`);
        console.log(`User Complaints: ${healthReport.metrics.health.userComplaints}`);
        break;
        
      case 'watch':
        console.log('Starting deployment monitoring...');
        console.log('Press Ctrl+C to stop');
        
        const watchInterval = parseInt(args[1]) || 60000; // Default 1 minute
        
        setInterval(() => {
          const watchReport = generateDeploymentReport();
          console.log(`\n[${new Date().toLocaleString()}] Phase: ${watchReport.summary.phase}, Health: ${watchReport.summary.health}, Feedback: ${watchReport.summary.totalFeedback}`);
          
          if (watchReport.health.issues.length > 0) {
            console.log('🔴 ISSUES DETECTED:');
            watchReport.health.issues.forEach(issue => console.log(`  - ${issue}`));
          }
        }, watchInterval);
        break;
        
      case 'help':
      default:
        console.log('Deployment Monitoring Tool');
        console.log('');
        console.log('Commands:');
        console.log('  status, report         Generate deployment status report');
        console.log('  metrics               Show raw deployment metrics');
        console.log('  history [limit]       Show deployment history');
        console.log('  export [format]       Export deployment data (json/csv)');
        console.log('  health                Show health check summary');
        console.log('  watch [interval]      Monitor deployment in real-time');
        console.log('  help                  Show this help message');
        console.log('');
        console.log('Examples:');
        console.log('  node deployment-monitoring.js status');
        console.log('  node deployment-monitoring.js history 20');
        console.log('  node deployment-monitoring.js watch 30000');
        break;
    }
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  getDeploymentMetrics,
  generateDeploymentReport,
  checkRolloutHealth,
  checkPhaseAdvancementReadiness,
  printDeploymentStatus,
  getDeploymentHistory,
  exportDeploymentData
};