# Current State Management Analysis for Deepnest Application

## Executive Summary

The Deepnest application currently uses a **global state pattern** with manual DOM manipulation and event-driven updates. State is scattered across multiple global objects, localStorage, and IPC channels. This analysis provides a foundation for designing a SolidJS store architecture to replace the current ad-hoc state management.

## Current Architecture Overview

### 1. State Storage Locations

#### Global Variables (window.*)
- **`window.DeepNest`** - Main nesting engine instance
- **`window.config`** - Application configuration with persistence
- **`window.nest`** - Ractive instance for nest results display
- **`window.SvgParser`** - SVG parsing utilities
- **`ractive`** - Ractive instance for parts list

#### localStorage Persistence
- **`darkMode`** - Boolean flag for UI theme
- Configuration is persisted via `config.setSync()` to disk

#### IPC/Process State
- **Main Process**: Window management, file operations, preset storage
- **Background Process**: NFP calculations, genetic algorithm execution
- **Renderer Process**: UI state, user interactions

### 2. Core State Structure

#### UI State
```javascript
// Theme and Layout
darkMode: boolean // localStorage: 'darkMode'
activeTab: string // DOM class management
modalOpen: boolean // DOM class: 'modal-open'
panelSizes: Object // Interact.js resize state

// Loading States
importButton.className: 'button import [disabled|spinner]'
exportButton.className: 'button export [disabled|spinner]'
stopButton.className: 'button stop [disabled]' | 'button start'

// Progress Tracking
progressBar.style.width: `${percentage}%`
```

#### Application Data
```javascript
// Parts Management
window.DeepNest.parts: Array<{
  polygontree: Polygon,
  svgelements: SVGElement[],
  bounds: BoundingBox,
  area: number,
  quantity: number,
  filename: string,
  sheet: boolean,
  selected: boolean
}>

// Import Files
window.DeepNest.imports: Array<{
  filename: string,
  svg: SVGElement,
  selected: boolean,
  zoom: PanZoomInstance
}>

// Nesting Results
window.DeepNest.nests: Array<{
  placements: Placement[],
  fitness: number,
  selected: boolean,
  utilisation: number,
  mergedLength: number
}>
```

#### Configuration State
```javascript
window.config = {
  // Nesting Parameters
  units: 'inch' | 'mm',
  scale: number,
  spacing: number,
  curveTolerance: number,
  rotations: number,
  threads: number,
  populationSize: number,
  mutationRate: number,
  placementType: 'box' | 'gravity' | 'convexhull',
  
  // Processing Options
  mergeLines: boolean,
  timeRatio: number,
  simplify: boolean,
  
  // Import/Export
  dxfImportScale: string,
  dxfExportScale: string,
  endpointTolerance: number,
  conversionServer: string,
  useSvgPreProcessor: boolean,
  useQuantityFromFileName: boolean,
  exportWithSheetBoundboarders: boolean,
  exportWithSheetsSpace: boolean,
  exportWithSheetsSpaceValue: number,
  
  // Authentication (preserved during preset operations)
  access_token: string,
  id_token: string
}
```

#### Process State
```javascript
// Nesting Engine State
window.DeepNest.working: boolean
window.DeepNest.GA: GeneticAlgorithm | null
window.DeepNest.workerTimer: number | null
window.DeepNest.progressCallback: Function | null
window.DeepNest.displayCallback: Function | null

// Background Worker State (per worker)
worker.isBusy: boolean
worker.processing: boolean
```

### 3. Data Flow Patterns

#### User Interactions → State Changes → UI Updates

1. **File Import Flow**
```
User clicks import → 
dialog.showOpenDialog() → 
processFile() → 
window.DeepNest.importsvg() → 
window.DeepNest.parts.push() → 
ractive.update('parts') → 
DOM re-render
```

2. **Configuration Change Flow**
```
User changes input → 
'change' event → 
config.setSync(key, value) → 
window.DeepNest.config(values) → 
updateForm(values) → 
DOM synchronization
```

3. **Nesting Process Flow**
```
User clicks start → 
window.DeepNest.start() → 
IPC: 'background-start' → 
Background calculation → 
IPC: 'background-response' → 
window.DeepNest.nests.unshift() → 
displayCallback() → 
window.nest.update() → 
displayNest() → 
DOM manipulation
```

#### State Synchronization Mechanisms

1. **Manual DOM Updates**
   - Direct element.className manipulation
   - element.style property updates
   - innerHTML assignments
   - setAttribute() calls

2. **Ractive.js Data Binding**
   - `ractive.update('parts')` for parts list
   - `window.nest.update('nests')` for results
   - Computed properties for derived values

3. **Event-Driven Updates**
   - addEventListener() for user interactions
   - IPC event handlers for process communication
   - Throttled updates for performance

### 4. IPC Communication Patterns

#### Main Process ↔ Renderer Process
```javascript
// Configuration Persistence
ipcRenderer.invoke('read-config') → Returns config object
ipcRenderer.invoke('write-config', stringifiedConfig) → Persists to disk

// Preset Management
ipcRenderer.invoke('load-presets') → Returns preset object
ipcRenderer.invoke('save-preset', name, config) → Saves preset
ipcRenderer.invoke('delete-preset', name) → Removes preset

// Process Control
ipcRenderer.send('background-stop') → Terminates workers
```

#### Background Worker Communication
```javascript
// Nesting Calculation Request
ipcRenderer.send('background-start', {
  index: number,
  individual: GAIndividual,
  sheets: Polygon[],
  config: Configuration,
  // ... part data
}) → Background process

// Progress Updates
ipcRenderer.on('background-progress', (event, progress) => {
  // Update progress bar
})

// Results Return
ipcRenderer.on('background-response', (event, result) => {
  // Add to nests array, trigger display update
})
```

### 5. State Persistence Strategy

#### Immediate Persistence
- **Configuration**: Every change via `config.setSync()`
- **Dark Mode**: `localStorage.setItem('darkMode', boolean)`

#### Session Persistence
- **Parts Data**: Lost on application restart
- **Import Files**: Must be re-imported
- **Nesting Results**: Temporary, can export to JSON

#### Manual Export
- **Nesting Results**: JSON export via `saveJSON()`
- **SVG Export**: File dialog with custom format
- **DXF Export**: Via conversion server

### 6. Current Pain Points for SolidJS Migration

#### State Fragmentation
- Configuration in `window.config`
- Parts in `window.DeepNest.parts`
- UI state in DOM classes/styles
- Process state in multiple locations

#### Manual Synchronization
- Ractive updates must be manually triggered
- DOM manipulation scattered throughout code
- No reactive data binding for most UI elements

#### Side Effects Management
- IPC calls mixed with state updates
- File operations not centralized
- Configuration changes trigger multiple effects

#### Type Safety
- No TypeScript interfaces for state objects
- Dynamic property access throughout
- Runtime validation only

## Recommended SolidJS Store Architecture

Based on this analysis, the new SolidJS stores should be organized as:

1. **UI Store** - Theme, modals, loading states, navigation
2. **Parts Store** - Imported parts, selection, metadata
3. **Configuration Store** - All nesting parameters with persistence
4. **Process Store** - Nesting state, progress, worker management  
5. **Results Store** - Nesting results, selected nest, export data
6. **Presets Store** - Saved configurations with CRUD operations

Each store should encapsulate:
- State definition with TypeScript interfaces
- Actions for state mutations
- Effects for side effects (persistence, IPC)
- Computed values for derived state
- Proper error handling and validation

This will provide reactive updates, type safety, and centralized state management while maintaining the existing functionality.

<function_calls>
<invoke name="TodoWrite">
<parameter name="todos">[{"id": "1", "content": "Examine main/page.js for global variables, state passing, localStorage usage, and event handling patterns", "status": "completed", "priority": "high"}, {"id": "2", "content": "Analyze main/deepnest.js for nesting algorithm state management, IPC communication, and progress tracking", "status": "completed", "priority": "high"}, {"id": "3", "content": "Examine IPC communication patterns between main process and renderer", "status": "completed", "priority": "medium"}, {"id": "4", "content": "Identify data flow patterns from user interactions to UI updates", "status": "completed", "priority": "medium"}, {"id": "5", "content": "Document current state structure including UI state, application data, process state, and persistence strategy", "status": "completed", "priority": "high"}]