#!/usr/bin/env node

/**
 * UI Rollout Management Script
 * 
 * This script manages the gradual rollout of the new SolidJS UI
 * and provides rollback capabilities if needed.
 */

const fs = require('fs');
const path = require('path');

// Load rollout configuration
function loadRolloutConfig() {
  const configPath = path.join(__dirname, '../config/ui-rollout.json');
  
  if (!fs.existsSync(configPath)) {
    throw new Error('UI rollout configuration not found');
  }
  
  try {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    return config;
  } catch (error) {
    throw new Error(`Failed to load rollout configuration: ${error.message}`);
  }
}

// Save rollout configuration
function saveRolloutConfig(config) {
  const configPath = path.join(__dirname, '../config/ui-rollout.json');
  
  config.metadata.lastUpdated = new Date().toISOString();
  config.metadata.updatedBy = 'ui-rollout-script';
  
  try {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    console.log('Rollout configuration updated successfully');
  } catch (error) {
    throw new Error(`Failed to save rollout configuration: ${error.message}`);
  }
}

// Check if new UI should be used
function shouldUseNewUI(config, environment = 'production', userId = null) {
  const strategy = config.rolloutStrategy;
  const selection = config.uiSelection;
  
  // Check if rollout is enabled
  if (!strategy.enabled) {
    return strategy.defaultUI === 'new';
  }
  
  // Check environment
  if (strategy.enabledEnvironments.includes(environment)) {
    return true;
  }
  
  // Check if user is in enabled users list
  if (userId && strategy.enabledUsers.includes(userId)) {
    return true;
  }
  
  // Check rollout percentage (simple random distribution)
  if (strategy.rolloutPercentage > 0) {
    const userHash = userId ? hashString(userId) : Math.random();
    return userHash < (strategy.rolloutPercentage / 100);
  }
  
  // Default to fallback
  return selection.fallback === 'new';
}

// Simple hash function for user ID
function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash) / 2147483647; // Normalize to 0-1
}

// Get current deployment phase
function getCurrentPhase(config) {
  const currentPhase = config.deployment.currentPhase;
  return config.deployment.phases.find(phase => phase.name === currentPhase);
}

// Advance to next deployment phase
function advancePhase(config) {
  const phases = config.deployment.phases;
  const currentIndex = phases.findIndex(phase => phase.name === config.deployment.currentPhase);
  
  if (currentIndex < phases.length - 1) {
    const nextPhase = phases[currentIndex + 1];
    config.deployment.currentPhase = nextPhase.name;
    config.rolloutStrategy.rolloutPercentage = nextPhase.percentage;
    
    console.log(`Advanced to phase: ${nextPhase.name} (${nextPhase.percentage}%)`);
    console.log(`Description: ${nextPhase.description}`);
    
    return nextPhase;
  } else {
    console.log('Already at final phase');
    return null;
  }
}

// Rollback to previous phase
function rollbackPhase(config, reason = 'manual') {
  const phases = config.deployment.phases;
  const currentIndex = phases.findIndex(phase => phase.name === config.deployment.currentPhase);
  
  if (currentIndex > 0) {
    const previousPhase = phases[currentIndex - 1];
    config.deployment.currentPhase = previousPhase.name;
    config.rolloutStrategy.rolloutPercentage = previousPhase.percentage;
    
    console.log(`Rolled back to phase: ${previousPhase.name} (${previousPhase.percentage}%)`);
    console.log(`Reason: ${reason}`);
    
    // Log rollback event
    const rollbackEvent = {
      timestamp: new Date().toISOString(),
      fromPhase: phases[currentIndex].name,
      toPhase: previousPhase.name,
      reason: reason
    };
    
    if (!config.rollback.history) {
      config.rollback.history = [];
    }
    config.rollback.history.push(rollbackEvent);
    
    return previousPhase;
  } else {
    console.log('Already at first phase');
    return null;
  }
}

// Enable/disable rollout
function setRolloutEnabled(config, enabled) {
  config.rolloutStrategy.enabled = enabled;
  console.log(`Rollout ${enabled ? 'enabled' : 'disabled'}`);
}

// Set rollout percentage
function setRolloutPercentage(config, percentage) {
  if (percentage < 0 || percentage > 100) {
    throw new Error('Percentage must be between 0 and 100');
  }
  
  config.rolloutStrategy.rolloutPercentage = percentage;
  console.log(`Rollout percentage set to ${percentage}%`);
}

// Print rollout status
function printRolloutStatus(config) {
  const strategy = config.rolloutStrategy;
  const currentPhase = getCurrentPhase(config);
  
  console.log('\n=== UI Rollout Status ===');
  console.log(`Rollout enabled: ${strategy.enabled ? 'Yes' : 'No'}`);
  console.log(`Default UI: ${strategy.defaultUI}`);
  console.log(`Rollout percentage: ${strategy.rolloutPercentage}%`);
  console.log(`Current phase: ${config.deployment.currentPhase}`);
  
  if (currentPhase) {
    console.log(`Phase description: ${currentPhase.description}`);
    console.log(`Phase criteria: ${currentPhase.criteria.join(', ')}`);
  }
  
  console.log(`User selection allowed: ${strategy.features.allowUserSelection ? 'Yes' : 'No'}`);
  console.log(`Feedback collection: ${strategy.features.collectFeedback ? 'Yes' : 'No'}`);
  
  if (strategy.enabledUsers.length > 0) {
    console.log(`Enabled users: ${strategy.enabledUsers.length}`);
  }
  
  console.log(`Enabled environments: ${strategy.enabledEnvironments.join(', ')}`);
  
  // Rollback information
  console.log('\n=== Rollback Configuration ===');
  console.log(`Rollback enabled: ${config.rollback.enabled ? 'Yes' : 'No'}`);
  console.log(`Automatic rollback: ${config.rollback.automaticRollback.enabled ? 'Yes' : 'No'}`);
  
  if (config.rollback.history && config.rollback.history.length > 0) {
    console.log('\n=== Rollback History ===');
    config.rollback.history.slice(-3).forEach((event, index) => {
      console.log(`${config.rollback.history.length - 2 + index}. ${event.timestamp}: ${event.fromPhase} → ${event.toPhase} (${event.reason})`);
    });
  }
}

// Print deployment phases
function printDeploymentPhases(config) {
  console.log('\n=== Deployment Phases ===');
  
  config.deployment.phases.forEach((phase, index) => {
    const isCurrent = phase.name === config.deployment.currentPhase;
    const status = isCurrent ? ' (CURRENT)' : '';
    
    console.log(`${index + 1}. ${phase.name}${status}`);
    console.log(`   Percentage: ${phase.percentage}%`);
    console.log(`   Description: ${phase.description}`);
    console.log(`   Criteria: ${phase.criteria.join(', ')}`);
    console.log('');
  });
}

// Generate UI selection code for main.js
function generateUISelectionCode() {
  return `
// UI Selection Logic (Generated by ui-rollout.js)
function shouldUseNewUI() {
  const config = JSON.parse(fs.readFileSync(path.join(__dirname, 'config/ui-rollout.json'), 'utf8'));
  
  // Check environment variables first
  if (process.env["deepnest_new_ui"] === "1") {
    return true;
  }
  
  // Check command line arguments
  if (process.argv.includes("--new-ui") || process.argv.includes("--ui=new")) {
    return true;
  }
  
  // Check rollout configuration
  const environment = process.env.NODE_ENV || 'production';
  
  if (!config.rolloutStrategy.enabled) {
    return config.rolloutStrategy.defaultUI === 'new';
  }
  
  if (config.rolloutStrategy.enabledEnvironments.includes(environment)) {
    return true;
  }
  
  // Simple rollout percentage (using machine ID or random)
  if (config.rolloutStrategy.rolloutPercentage > 0) {
    const machineId = os.hostname() || 'default';
    const hash = crypto.createHash('md5').update(machineId).digest('hex');
    const hashValue = parseInt(hash.substr(0, 8), 16) / 0xffffffff;
    return hashValue < (config.rolloutStrategy.rolloutPercentage / 100);
  }
  
  return config.uiSelection.fallback === 'new';
}

const useNewUI = shouldUseNewUI();
`;
}

// Main function
function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  try {
    const config = loadRolloutConfig();
    
    switch (command) {
      case 'status':
        printRolloutStatus(config);
        break;
        
      case 'phases':
        printDeploymentPhases(config);
        break;
        
      case 'enable':
        setRolloutEnabled(config, true);
        saveRolloutConfig(config);
        break;
        
      case 'disable':
        setRolloutEnabled(config, false);
        saveRolloutConfig(config);
        break;
        
      case 'percentage':
        const percentage = parseInt(args[1]);
        if (isNaN(percentage)) {
          console.error('Please provide a valid percentage (0-100)');
          process.exit(1);
        }
        setRolloutPercentage(config, percentage);
        saveRolloutConfig(config);
        break;
        
      case 'advance':
        const nextPhase = advancePhase(config);
        if (nextPhase) {
          saveRolloutConfig(config);
        }
        break;
        
      case 'rollback':
        const reason = args[1] || 'manual';
        const previousPhase = rollbackPhase(config, reason);
        if (previousPhase) {
          saveRolloutConfig(config);
        }
        break;
        
      case 'check':
        const environment = args[1] || 'production';
        const userId = args[2] || null;
        const useNewUI = shouldUseNewUI(config, environment, userId);
        console.log(`Environment: ${environment}`);
        console.log(`User ID: ${userId || 'none'}`);
        console.log(`Should use new UI: ${useNewUI ? 'Yes' : 'No'}`);
        break;
        
      case 'generate-code':
        console.log(generateUISelectionCode());
        break;
        
      case 'help':
      default:
        console.log('UI Rollout Management Tool');
        console.log('');
        console.log('Commands:');
        console.log('  status                    Show current rollout status');
        console.log('  phases                    Show deployment phases');
        console.log('  enable                    Enable rollout');
        console.log('  disable                   Disable rollout');
        console.log('  percentage <0-100>        Set rollout percentage');
        console.log('  advance                   Advance to next phase');
        console.log('  rollback [reason]         Rollback to previous phase');
        console.log('  check <env> [userId]      Check if user should get new UI');
        console.log('  generate-code             Generate UI selection code');
        console.log('  help                      Show this help message');
        console.log('');
        console.log('Examples:');
        console.log('  node ui-rollout.js status');
        console.log('  node ui-rollout.js percentage 25');
        console.log('  node ui-rollout.js check development user123');
        console.log('  node ui-rollout.js rollback "performance issues"');
        break;
    }
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  loadRolloutConfig,
  saveRolloutConfig,
  shouldUseNewUI,
  getCurrentPhase,
  advancePhase,
  rollbackPhase,
  setRolloutEnabled,
  setRolloutPercentage,
  printRolloutStatus
};