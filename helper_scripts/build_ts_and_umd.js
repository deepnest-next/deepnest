const { execSync } = require('child_process');
const path = require('path');

// Build the main TypeScript files
console.log('Building main TypeScript files...');
execSync('npx tsc', { stdio: 'inherit' });

// Build the UMD modules using Rollup
console.log('Building UMD modules with Rollup...');
execSync('npx rollup -c rollup.config.mjs', { stdio: 'inherit' });

console.log('Build complete!');
