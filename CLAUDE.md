# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**deepnest** is an Electron-based desktop application for nesting parts for CNC tools, laser cutters, and plotters. It's a fork of the original SVGNest and deepnest projects with performance improvements and new features.

Key technologies:
- **Electron** with Node.js backend
- **TypeScript** for type safety (compiled to JavaScript)
- **JavaScript** mix out for typescript compiled JavaScript and non typescript written javascript
- **Custom nesting engine** with C/C++ components via native modules
- **Web-based UI** with SVG rendering
- **Genetic algorithm** for optimization
- **Clipper library** for polygon operations, written in JavaScript

## Common Development Commands

### Building and Running
```bash
# Install dependencies
npm install

# Build TypeScript to JavaScript
npm run build

# Start the application
npm run start

# Clean build artifacts
npm run clean

# Full clean including node_modules
npm run clean-all
```

### Testing
```bash
# Run Playwright tests (requires one-time setup)
npx playwright install chromium
npm run test

# Generate new tests interactively
npm run pw:codegen
```

### Code Quality
```bash
# Lint and format code (runs automatically via pre-commit hooks)
prettier --write **/*.{ts,html,css,scss,less,json}
eslint --fix **/*.{ts,html,css,scss,less,json}
```

### Distribution
```bash
# Create distribution package
npm run dist

# Build everything and create distribution
npm run dist-all
```

## Architecture

### Application Structure
- **main.js** - Electron main process entry point
- **main/** - Core application code
  - **deepnest.js** - Main nesting algorithm and genetic optimization
  - **background.js** - Background worker for intensive calculations
  - **index.html** - Main UI
  - **util/** - Utility modules (geometry, matrix operations, etc.)

### Key Components

1. **Main Process (main.js)**
   - Creates Electron windows
   - Handles IPC communication
   - Manages background workers
   - Handles file operations and settings

2. **Nesting Engine (deepnest.js)**
   - `DeepNest` class - Main nesting logic
   - `GeneticAlgorithm` class - Optimization algorithm
   - SVG parsing and polygon processing
   - Clipper library integration for geometry operations

3. **Background Workers**
   - Separate renderer processes for CPU-intensive tasks
   - Communicates via IPC with main process
   - Prevents UI blocking during calculations

4. **TypeScript Utilities (main/util/)**
   - Geometry operations
   - Point, Vector, Matrix classes
   - Polygon hull calculations
   - SVG parsing utilities

### Key Algorithms
- **Genetic Algorithm** for part placement optimization
- **No-Fit Polygon (NFP)** calculation for collision detection
- **Polygon offsetting** using Clipper library
- **Curve simplification** with Douglas-Peucker algorithm

## Development Notes

### TypeScript Configuration
- Strict mode enabled with comprehensive type checking
- Outputs to `./build` directory
- Targets ES2023 with DOM and Node.js types

### Electron Configuration
- Uses `@electron/remote` for renderer process access
- Context isolation disabled for legacy compatibility
- Node integration enabled in renderers

### Testing
- Uses Playwright for end-to-end testing
- Headless mode disabled by default for debugging
- Screenshots and videos captured on test failure

### Native Dependencies
- Requires C++ build tools (Visual Studio on Windows)
- Uses `@deepnest/calculate-nfp` for performance-critical calculations
- Electron rebuild required after native module changes

### Environment Variables
- `deepnest_debug=1` - Opens dev tools
- `SAVE_PLACEMENTS_PATH` - Custom export directory
- `DEEPNEST_LONGLIST` - Keep more nesting results

## Important File Locations

- **Entry point**: `main.js`
- **Main UI**: `main/index.html`
- **Core logic**: `main/deepnest.js`
- **Background worker**: `main/background.js`
- **TypeScript source**: `main/util/*.ts`
- **JavaScript source**: `main/*.js`
- **Tests**: `tests/`
- **Build output**: `build/`

## Performance Considerations

- Nesting calculations run in background processes to prevent UI freezing
- Polygon simplification reduces complexity for better performance
- Genetic algorithm parameters can be tuned via configuration
- Native modules handle computationally intensive operations

## Debugging

Set `deepnest_debug=1` environment variable to enable Chrome DevTools in all Electron windows.

## GIT commits

Never add a Co-Author or ling for claude to commits. Never add hints about using claude.

## Known Issues and Recent Fixes

### Boundary Condition Bug (Fixed)
- **Issue**: A 100mm x 100mm part could not be placed in a 100mm x 100mm bin
- **Root Cause**: The `noFitPolygonRectangle` function was never called from `noFitPolygon`, and exact-fit cases created degenerate polygons
- **Fix**:
  - Added rectangle detection check in `noFitPolygon` function (`main/util/geometryutil.js:1594-1599`)
  - Added special handling for exact-fit cases in `noFitPolygonRectangle` (`main/util/geometryutil.js:1581-1592`)
- **Files Modified**: `main/util/geometryutil.js`
