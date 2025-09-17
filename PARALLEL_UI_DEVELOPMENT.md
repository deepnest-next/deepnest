# Parallel UI Development Guide

This document explains how to run and test both the legacy and new SolidJS UI side-by-side during the migration phase.

## Quick Start

### Running the Legacy UI (Default)
```bash
npm start
# or
npm run start:legacy
```

### Running the New SolidJS UI
```bash
npm run start:new
```

### Running with Debug Mode
```bash
# Legacy UI with debug
npm run start:debug

# New UI with debug
npm run start:new-debug
```

## Environment Variables

You can also control the UI selection using environment variables:

```bash
# Use new UI
deepnest_new_ui=1 npm start

# Use legacy UI (default)
npm start

# Enable debug mode
deepnest_debug=1 npm start

# Use new UI with debug
deepnest_new_ui=1 deepnest_debug=1 npm start
```

## Command Line Arguments

The following command line arguments are also supported:

```bash
# Use new UI
electron . --new-ui
electron . --ui=new

# Use legacy UI (default)
electron .
```

## Build Requirements

Before running the new UI, ensure the frontend is built:

```bash
cd frontend-new
npm run build
```

This will build the SolidJS frontend to `main/ui-new/` directory.

## Development Workflow

### 1. Frontend Development
```bash
# Terminal 1: Start frontend development server
cd frontend-new
npm run dev

# Terminal 2: Run electron with new UI
cd ..
npm run start:new-debug
```

### 2. Testing Both UIs
```bash
# Test legacy UI
npm run start:legacy

# Test new UI
npm run start:new

# Compare functionality between both
```

### 3. Building for Production
```bash
# Build new frontend
cd frontend-new
npm run build

# Test production build
cd ..
npm run start:new
```

## UI Selection Logic

The application determines which UI to load based on:

1. **Environment Variable**: `deepnest_new_ui=1`
2. **Command Line Arguments**: `--new-ui` or `--ui=new`
3. **Default**: Legacy UI if none of the above

## File Structure

```
deepnest/
├── main/
│   ├── index.html          # Legacy UI
│   └── ui-new/             # New SolidJS UI (built)
│       ├── index.html
│       └── assets/
├── frontend-new/           # SolidJS source code
│   ├── src/
│   ├── dist/              # Local development build
│   └── package.json
└── main.js                # Electron main process
```

## Feature Comparison

Use this section to track feature parity between UIs:

### Core Features
- [ ] Parts management
- [ ] Nesting operations
- [ ] Sheets configuration
- [ ] Settings management
- [ ] Import/Export functionality
- [ ] Dark mode support
- [ ] Internationalization

### Advanced Features
- [ ] Real-time progress updates
- [ ] Background worker communication
- [ ] File drag-and-drop
- [ ] Keyboard shortcuts
- [ ] Context menus
- [ ] Virtual scrolling

## Troubleshooting

### New UI Not Loading
1. Check if `main/ui-new/index.html` exists
2. Ensure frontend is built: `cd frontend-new && npm run build`
3. Check console for errors: `npm run start:new-debug`

### Legacy UI Issues
1. Verify `main/index.html` exists
2. Check for console errors: `npm run start:debug`

### Build Issues
1. Clear build cache: `cd frontend-new && npm run clean`
2. Reinstall dependencies: `npm install`
3. Rebuild: `npm run build`

## Performance Comparison

Track performance metrics between UIs:

### Bundle Size
- Legacy UI: ~X MB
- New UI: ~200KB (gzipped)

### Load Time
- Legacy UI: ~X seconds
- New UI: ~X seconds

### Memory Usage
- Legacy UI: ~X MB
- New UI: ~X MB

## Feedback and Testing

When testing the new UI:

1. Document any missing features
2. Report bugs or inconsistencies
3. Note performance differences
4. Test all workflows thoroughly
5. Verify internationalization works

## Migration Timeline

- **Phase 1**: Basic UI switching ✓
- **Phase 2**: Feature parity testing
- **Phase 3**: Performance validation
- **Phase 4**: User acceptance testing
- **Phase 5**: Full migration and cleanup