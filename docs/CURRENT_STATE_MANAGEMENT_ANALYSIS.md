# Current State Management Analysis

## Overview
This document analyzes the current state management patterns in the Deepnest application to inform the design of the new SolidJS store architecture.

## Global State Architecture

### 1. Global Objects and Variables

#### Window-Level State
- **`window.DeepNest`** - Main nesting engine instance
- **`window.config`** - Application configuration object
- **`window.ractive`** - Ractive.js instance for UI templating
- **`window.interact`** - Interact.js library for resizable panels

#### Configuration State (via `config` object)
The application uses a centralized configuration system accessible through `window.config`:

```javascript
// From page.js analysis
config.getSync('units')           // Display units (mm/inches)
config.getSync('scale')           // SVG scale factor
config.getSync('spacing')         // Space between parts
config.getSync('rotations')       // Number of rotations allowed
config.getSync('populationSize')  // Genetic algorithm population
config.getSync('mutationRate')    // Genetic algorithm mutation rate
config.getSync('threads')         // Number of CPU threads
config.getSync('placementType')   // Optimization type
config.getSync('mergeLines')      // Merge common lines option
config.getSync('timeRatio')       // Time ratio for optimization
config.getSync('simplify')        // Use rough approximation
config.getSync('tolerance')       // Curve tolerance
config.getSync('endpointTolerance') // Endpoint tolerance
```

### 2. Local Storage Persistence

#### User Preferences
- **`darkMode`** - Theme preference (boolean string)
- **Presets** - Saved configuration presets (JSON strings)

#### Implementation Pattern
```javascript
// Dark mode restoration
const darkMode = localStorage.getItem('darkMode') === 'true';
if (darkMode) {
    document.body.classList.add('dark-mode');
}

// Preset management
await ipcRenderer.invoke('save-preset', name, JSON.stringify(config.getSync()));
const presets = await ipcRenderer.invoke('load-presets');
```

### 3. IPC Communication Patterns

#### Main Process ↔ Renderer Communication
Based on the code analysis, the following IPC channels are used:

| Channel | Direction | Purpose | Data Type |
|---------|-----------|---------|-----------|
| `save-preset` | Renderer → Main | Save configuration preset | name, config JSON |
| `load-presets` | Renderer → Main | Load all presets | Returns preset object |
| `delete-preset` | Renderer → Main | Delete specific preset | preset name |
| `nest-progress` | Main → Renderer | Nesting progress updates | progress percentage |
| `nest-complete` | Main → Renderer | Nesting completion | results data |
| `worker-status` | Main → Renderer | Background worker status | status object |

#### Real-time Updates
```javascript
// Progress monitoring pattern (inferred from usage)
ipcRenderer.on('nest-progress', (event, progress) => {
    // Update UI with progress
    updateProgressBar(progress);
});

ipcRenderer.on('nest-complete', (event, results) => {
    // Update UI with results
    displayNestingResults(results);
});
```

### 4. UI State Management

#### Tab Navigation
- **Active Tab**: Managed through CSS class toggling
- **Panel Visibility**: Direct DOM manipulation

#### Resizable Panels
```javascript
// interact.js for resizable panels
interact('.parts-drag')
    .resizable({
        preserveAspectRatio: false,
        edges: { left: false, right: true, bottom: false, top: false }
    })
    .on('resizemove', resize);
```

#### Modal State
- **Preset Modal**: Show/hide through CSS display property
- **Modal Backdrop**: Click-outside-to-close functionality

### 5. Application Data Flow

#### File Import Process
1. User selects file through dialog
2. File content read via fs.readFileSync
3. SVG parsing and processing
4. Parts added to `window.DeepNest.parts`
5. UI updated via `ractive.update('parts')`

#### Configuration Updates
1. User modifies form inputs
2. `updateForm()` function called
3. Configuration saved to `config` object
4. Real-time UI updates via Ractive.js

#### Nesting Process
1. User clicks "Start nest"
2. Configuration sent to main process
3. Background worker started
4. Progress updates via IPC
5. Results displayed in UI

## Data Structure Analysis

### Parts Management
```javascript
// Inferred structure from code analysis
window.DeepNest.parts = [
    {
        id: string,
        name: string,
        svg: SVGElement,
        polygon: Polygon,
        quantity: number,
        rotation: number,
        sheet: boolean,
        selected: boolean
    }
];
```

### Nesting Results
```javascript
// Inferred from export functions
window.DeepNest.nests = [
    {
        id: string,
        fitness: number,
        selected: boolean,
        placements: [
            {
                part: Part,
                x: number,
                y: number,
                rotation: number,
                sheet: number
            }
        ]
    }
];
```

### Configuration Structure
```javascript
// Based on observed config.getSync() calls
const configStructure = {
    units: 'mm' | 'inches',
    scale: number,
    spacing: number,
    rotations: number,
    populationSize: number,
    mutationRate: number,
    threads: number,
    placementType: 'gravity' | 'boundingbox' | 'squeeze',
    mergeLines: boolean,
    timeRatio: number,
    simplify: boolean,
    tolerance: number,
    endpointTolerance: number,
    svgScale: number,
    dxfImportUnits: string,
    dxfExportUnits: string,
    exportSheetBounds: boolean,
    exportSheetSpacing: boolean,
    sheetSpacing: number,
    useQuantityFromFilename: boolean
};
```

## Event Handling Patterns

### DOM Events
- **Button Clicks**: Direct event listener attachment
- **Form Changes**: Change event listeners with immediate updates
- **Window Resize**: Global resize handler for layout adjustments

### Custom Events
- **Preset Operations**: Modal show/hide, validation, IPC calls
- **File Operations**: Dialog handling, file processing, error handling
- **Nesting Control**: Start/stop operations, progress monitoring

## State Synchronization Issues

### Current Problems
1. **Global State Pollution**: Heavy reliance on window object
2. **No State Validation**: Direct property access without type checking
3. **Manual UI Updates**: Explicit DOM manipulation required
4. **Mixed Responsibilities**: UI logic mixed with business logic
5. **Limited Rollback**: No undo/redo mechanism for state changes

### Persistence Strategies
1. **localStorage**: User preferences (theme, language)
2. **IPC + Main Process**: Application presets and configuration
3. **Memory Only**: Temporary UI state (modal visibility, active tabs)
4. **File System**: Imported parts and nesting results

## Recommended SolidJS Store Architecture

### Store Structure
```typescript
interface GlobalState {
    // UI State
    ui: {
        activeTab: 'parts' | 'nests' | 'sheets' | 'config';
        darkMode: boolean;
        language: string;
        modals: {
            presetModal: boolean;
            helpModal: boolean;
        };
        panels: {
            partsWidth: number;
            resultsHeight: number;
        };
    };
    
    // Application Configuration
    config: {
        units: 'mm' | 'inches';
        scale: number;
        spacing: number;
        rotations: number;
        populationSize: number;
        mutationRate: number;
        threads: number;
        placementType: 'gravity' | 'boundingbox' | 'squeeze';
        mergeLines: boolean;
        timeRatio: number;
        simplify: boolean;
        tolerance: number;
        endpointTolerance: number;
        // ... other config properties
    };
    
    // Application Data
    app: {
        parts: Part[];
        sheets: Sheet[];
        nests: NestResult[];
        presets: Record<string, Config>;
        importedFiles: ImportedFile[];
    };
    
    // Process State
    process: {
        isNesting: boolean;
        progress: number;
        currentNest: NestResult | null;
        workerStatus: WorkerStatus;
        lastError: string | null;
    };
}
```

### Store Implementation Strategy
1. **Separation of Concerns**: Dedicated stores for UI, config, app data, and process state
2. **Type Safety**: Full TypeScript interfaces for all state
3. **Computed Values**: Derived state through SolidJS computations
4. **Persistent State**: Automatic sync with localStorage and IPC
5. **State Validation**: Schema validation for all state changes
6. **Undo/Redo**: History tracking for user actions

### Migration Benefits
1. **Reactive Updates**: Automatic UI updates when state changes
2. **Type Safety**: Compile-time error checking
3. **Centralized State**: Single source of truth for all data
4. **Performance**: Fine-grained reactivity without virtual DOM
5. **Debugging**: Clear state inspection and time travel
6. **Testing**: Isolated state logic for unit testing

## Implementation Recommendations

### Phase 1: Core Store Setup
- Create base store structure with TypeScript interfaces
- Implement localStorage persistence layer
- Setup IPC communication service
- Create basic reactive UI components

### Phase 2: State Migration
- Migrate config system to SolidJS stores
- Move parts and nesting data to stores
- Implement preset management through stores
- Add state validation and error handling

### Phase 3: Advanced Features
- Add undo/redo functionality
- Implement optimistic updates
- Add state debugging tools
- Create state backup/restore system

### Phase 4: Performance Optimization
- Implement state normalization
- Add selective state persistence
- Optimize IPC communication
- Create state hydration strategies

This analysis provides the foundation for designing a robust, type-safe, and performant state management system for the new SolidJS frontend.