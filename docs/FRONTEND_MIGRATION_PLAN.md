# Frontend Migration Plan: Deepnest to SolidJS with i18n

## Overview

This document outlines the complete migration strategy for transitioning the Deepnest frontend from the current Ractive.js + vanilla JavaScript implementation to a modern SolidJS application with full internationalization support.

## Current Architecture Analysis

### Technology Stack
- **Framework**: Ractive.js for templating and data binding
- **Build Tool**: None (vanilla JavaScript with ES6 modules)
- **State Management**: Manual DOM manipulation with global variables
- **Styling**: CSS with custom properties for theming
- **Interactions**: interact.js for resizable panels
- **IPC**: Direct electron ipcRenderer calls

### Key Components
- **Tab Navigation**: Manual tab switching with visibility toggling
- **Parts Panel**: Resizable with interact.js (right-edge only)
- **Nesting Results**: Real-time progress updates via IPC
- **Preset Management**: localStorage-based CRUD operations
- **File Operations**: Drag-and-drop import/export
- **Dark Mode**: CSS custom properties with localStorage persistence

### Current UI Strings (Translation Candidates)
- Navigation: "Parts", "Nests", "Sheets", "Settings"
- Actions: "Import", "Export", "Start", "Stop", "Save", "Delete"
- Labels: "Name", "Size", "Quantity", "Rotation", "Progress"
- Messages: "No parts loaded", "Nesting in progress", "Complete"
- Tooltips: "Add parts", "Remove selected", "Toggle dark mode"

## Target Architecture

### Technology Stack
- **Framework**: SolidJS 1.8+
- **Build Tool**: Vite with TypeScript
- **State Management**: SolidJS stores with Immer
- **Styling**: CSS modules with custom properties
- **Interactions**: solid-resizable-panels or custom resizable hook
- **IPC**: Type-safe wrapper service
- **i18n**: i18next with solid-i18next

### Dependencies
```json
{
  "solid-js": "^1.8.0",
  "solid-router": "^0.10.0",
  "solid-i18next": "^1.1.0",
  "i18next": "^23.7.0",
  "i18next-browser-languagedetector": "^7.2.0",
  "solid-resizable-panels": "^1.0.0",
  "immer": "^10.0.0",
  "vite": "^5.0.0",
  "typescript": "^5.0.0",
  "vite-plugin-solid": "^2.8.0"
}
```

## Implementation Phases

### Phase 1: Project Setup & Core Architecture (Week 1-2)

#### 1.1 Development Environment Setup
- [x] Create new `frontend-new/` directory in project root
- [x] Initialize SolidJS project with Vite and TypeScript
- [x] Configure build system to output to `main/ui-new/`
- [x] Setup hot reload for development

#### 1.2 i18n Configuration
- [x] Install and configure i18next with solid-i18next
- [x] Create translation namespace structure
- [x] Setup language detection (localStorage + navigator)
- [x] Create base translation files (English)
- [x] Add language switcher component

**Translation Structure:**
```
locales/
├── en/
│   ├── common.json      # Navigation, actions, common labels
│   ├── parts.json       # Parts panel specific
│   ├── nesting.json     # Nesting process specific
│   ├── sheets.json      # Sheets configuration
│   └── settings.json    # Settings and presets
├── de/
├── fr/
└── es/
```

#### 1.3 Global State Management
- [x] Design and implement global state structure
- [x] Create IPC communication service
- [x] Setup state persistence (localStorage + memory)
- [x] Implement state synchronization across tabs

**State Structure:**
```typescript
interface GlobalState {
  ipc: {
    isConnected: boolean;
    nestingProgress: number;
    currentResults: NestResult[];
    backgroundWorkerStatus: WorkerStatus;
  };
  ui: {
    activeTab: 'parts' | 'nests' | 'sheets' | 'settings';
    darkMode: boolean;
    language: string;
    panelSizes: Record<string, number>;
  };
  app: {
    parts: Part[];
    sheets: Sheet[];
    currentPreset: Preset;
    importedFiles: ImportedFile[];
  };
}
```

#### 1.4 Basic Routing & Layout
- [x] Setup solid-router for tab navigation
- [x] Create main layout component
- [x] Implement tab switching with URL synchronization
- [x] Add loading states and error boundaries

### Phase 2: Core Components with i18n (Week 3-5)

#### 2.1 Layout Components
- [x] **Header**: App title, language selector, dark mode toggle
- [x] **Navigation**: Tab navigation with active state
- [x] **Resizable Panels**: Left sidebar (parts) and main content area
- [x] **StatusBar**: Progress indicator and connection status

#### 2.2 Parts Management
- [x] **Parts Panel**: List view with selection, search, and filters
- [x] **Import Dialog**: File browser with drag-and-drop support
- [x] **Part Preview**: SVG rendering with zoom/pan capabilities
- [x] **Part Details**: Properties, quantity, rotation settings

#### 2.3 Nesting Results
- [ ] **Progress Display**: Real-time progress with translated status
- [ ] **Results Grid**: Thumbnail view of nesting layouts
- [ ] **Result Viewer**: Detailed view with zoom/pan/export
- [ ] **Statistics**: Efficiency metrics and part placement info

#### 2.4 Sheets Management
- [ ] **Sheet Configuration**: Size, margins, material settings
- [ ] **Sheet Preview**: Visual representation with measurements
- [ ] **Sheet Templates**: Predefined sizes and custom dimensions

#### 2.5 Settings & Presets
- [ ] **Preset Management**: Create, edit, delete, import/export
- [ ] **Algorithm Settings**: Genetic algorithm parameters
- [ ] **UI Preferences**: Theme, language, panel layouts
- [ ] **Advanced Settings**: Performance and debugging options

### Phase 3: Advanced Features (Week 6-7)

#### 3.1 File Operations
- [ ] **Drag-and-drop**: Multi-file import with progress indication
- [ ] **Export Options**: Multiple formats (SVG, DXF, PDF)
- [ ] **File Validation**: Error handling and user feedback
- [ ] **Recent Files**: Quick access to previously used files

#### 3.2 Real-time Updates
- [ ] **IPC Event Handling**: Progress updates, status changes
- [ ] **Background Worker Communication**: Status and results
- [ ] **Live Result Updates**: Real-time nesting visualization
- [ ] **Connection Management**: Reconnection and error recovery

#### 3.3 Advanced Interactions
- [ ] **Zoom/Pan**: Viewport controls for large visualizations
- [ ] **Selection Tools**: Multi-select with keyboard shortcuts
- [ ] **Context Menus**: Right-click actions for parts and results
- [ ] **Keyboard Shortcuts**: Power user navigation and actions

#### 3.4 Performance Optimization
- [ ] **Virtual Scrolling**: Large lists (parts, results)
- [ ] **Lazy Loading**: Component and image loading
- [ ] **Memory Management**: Cleanup and garbage collection
- [ ] **Bundle Optimization**: Code splitting and tree shaking

### Phase 4: Testing & Migration (Week 8-9)

#### 4.1 Testing Strategy
- [ ] **Unit Tests**: Component and utility function testing
- [ ] **Integration Tests**: State management and IPC communication
- [ ] **i18n Tests**: Translation coverage and language switching
- [ ] **E2E Tests**: Full workflow testing with multiple languages
- [ ] **Performance Tests**: Memory usage and rendering benchmarks

#### 4.2 Migration Execution
- [ ] **Parallel Development**: Run both UIs side-by-side
- [ ] **Feature Parity**: Ensure all current functionality is preserved
- [ ] **User Testing**: Beta testing with existing users
- [ ] **Performance Validation**: Ensure new UI meets performance requirements

#### 4.3 Deployment
- [ ] **Build Integration**: Update Electron build process
- [ ] **Version Management**: Gradual rollout strategy
- [ ] **Rollback Plan**: Ability to revert to old UI if needed
- [ ] **Documentation**: User guide and developer documentation

## Technical Specifications

### Resizable Panel Implementation

**Current interact.js behavior:**
```javascript
interact('.parts-drag').resizable({
  preserveAspectRatio: false,
  edges: { left: false, right: true, bottom: false, top: false }
}).on('resizemove', resize);
```

**SolidJS equivalent options:**

**Option 1: solid-resizable-panels (Recommended)**
```tsx
import { Panel, PanelGroup, PanelResizeHandle } from 'solid-resizable-panels';

<PanelGroup direction="horizontal">
  <Panel defaultSize={25} minSize={15} maxSize={40}>
    <PartsPanel />
  </Panel>
  <PanelResizeHandle />
  <Panel>
    <MainContent />
  </Panel>
</PanelGroup>
```

**Option 2: Custom resizable hook**
```tsx
const useResizable = (initialSize: number = 300) => {
  const [size, setSize] = createSignal(initialSize);
  const [isResizing, setIsResizing] = createSignal(false);
  
  const handleMouseDown = (e: MouseEvent) => {
    setIsResizing(true);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };
  
  return { size, isResizing, handleMouseDown };
};
```

### IPC Communication Service

```typescript
// ipc.service.ts
export class IPCService {
  private eventEmitter = new EventTarget();
  
  async startNesting(config: NestingConfig): Promise<void> {
    return ipcRenderer.invoke('start-nesting', config);
  }
  
  onProgress(callback: (progress: number) => void): () => void {
    const handler = (event: any) => callback(event.detail);
    this.eventEmitter.addEventListener('nesting-progress', handler);
    return () => this.eventEmitter.removeEventListener('nesting-progress', handler);
  }
  
  onResults(callback: (results: NestResult[]) => void): () => void {
    const handler = (event: any) => callback(event.detail);
    this.eventEmitter.addEventListener('nesting-results', handler);
    return () => this.eventEmitter.removeEventListener('nesting-results', handler);
  }
}
```

### Translation Management

```typescript
// i18n.config.ts
export const i18nConfig = {
  fallbackLng: 'en',
  debug: false,
  detection: {
    order: ['localStorage', 'navigator'],
    caches: ['localStorage'],
    lookupLocalStorage: 'deepnest-language'
  },
  interpolation: {
    escapeValue: false
  },
  resources: {
    en: {
      common: () => import('../locales/en/common.json'),
      parts: () => import('../locales/en/parts.json'),
      nesting: () => import('../locales/en/nesting.json'),
      sheets: () => import('../locales/en/sheets.json'),
      settings: () => import('../locales/en/settings.json')
    }
  }
};
```

## File Structure

```
frontend-new/
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   ├── Navigation.tsx
│   │   │   ├── ResizableLayout.tsx
│   │   │   └── StatusBar.tsx
│   │   ├── parts/
│   │   │   ├── PartsPanel.tsx
│   │   │   ├── PartsList.tsx
│   │   │   ├── PartPreview.tsx
│   │   │   └── ImportDialog.tsx
│   │   ├── nesting/
│   │   │   ├── NestingProgress.tsx
│   │   │   ├── ResultsGrid.tsx
│   │   │   ├── ResultViewer.tsx
│   │   │   └── NestingStats.tsx
│   │   ├── sheets/
│   │   │   ├── SheetsPanel.tsx
│   │   │   ├── SheetConfig.tsx
│   │   │   └── SheetPreview.tsx
│   │   ├── settings/
│   │   │   ├── SettingsPanel.tsx
│   │   │   ├── PresetManager.tsx
│   │   │   ├── AlgorithmSettings.tsx
│   │   │   └── UIPreferences.tsx
│   │   └── common/
│   │       ├── Button.tsx
│   │       ├── Input.tsx
│   │       ├── Modal.tsx
│   │       └── LoadingSpinner.tsx
│   ├── stores/
│   │   ├── global.store.ts
│   │   ├── parts.store.ts
│   │   ├── nesting.store.ts
│   │   └── ui.store.ts
│   ├── services/
│   │   ├── ipc.service.ts
│   │   ├── file.service.ts
│   │   └── preset.service.ts
│   ├── utils/
│   │   ├── geometry.ts
│   │   ├── validation.ts
│   │   └── formatters.ts
│   ├── types/
│   │   ├── app.types.ts
│   │   ├── ipc.types.ts
│   │   └── ui.types.ts
│   ├── hooks/
│   │   ├── useResizable.ts
│   │   ├── useIPC.ts
│   │   └── useLocalStorage.ts
│   ├── locales/
│   │   ├── en/
│   │   ├── de/
│   │   ├── fr/
│   │   └── es/
│   ├── styles/
│   │   ├── globals.css
│   │   ├── themes.css
│   │   └── components.css
│   ├── App.tsx
│   ├── index.tsx
│   └── i18n.config.ts
├── public/
├── dist/
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## Migration Benefits

### Performance Improvements
- **Smaller bundle size**: SolidJS has minimal runtime overhead
- **Better reactivity**: Fine-grained reactivity without virtual DOM
- **Faster updates**: Direct DOM updates for real-time progress
- **Memory efficiency**: Better garbage collection and cleanup

### Developer Experience
- **Type safety**: Full TypeScript integration
- **Better debugging**: SolidJS devtools and error boundaries
- **Modern tooling**: Vite for fast development and building
- **Component reusability**: Modular architecture

### User Experience
- **Internationalization**: Multi-language support
- **Better accessibility**: Modern component patterns
- **Responsive design**: Better mobile and tablet support
- **Consistent theming**: CSS custom properties with proper fallbacks

### Maintainability
- **Clear separation**: Components, stores, services, and utilities
- **Testable code**: Unit and integration testing
- **Documentation**: JSDoc and TypeScript interfaces
- **Version control**: Clear migration history and rollback capability

## Risk Mitigation

### Technical Risks
- **Feature parity**: Comprehensive testing ensures all features work
- **Performance regression**: Benchmarking and optimization
- **Electron compatibility**: Thorough testing with Electron APIs
- **IPC communication**: Type-safe interfaces prevent runtime errors

### User Risks
- **Learning curve**: Gradual rollout and user documentation
- **Workflow disruption**: Parallel development and testing
- **Data migration**: Careful handling of user presets and settings
- **Rollback capability**: Ability to revert to previous UI

### Timeline Risks
- **Scope creep**: Clear phase boundaries and deliverables
- **Resource allocation**: Dedicated development time
- **Testing bottlenecks**: Parallel development and testing
- **Integration complexity**: Phased integration approach

## Success Metrics

### Technical Metrics
- **Bundle size**: < 2MB for initial load
- **Load time**: < 3 seconds on average hardware
- **Memory usage**: < 200MB baseline, < 500MB with large projects
- **Test coverage**: > 85% for components and utilities

### User Metrics
- **Feature completion**: 100% parity with current functionality
- **Language coverage**: 4 languages (EN, DE, FR, ES)
- **User satisfaction**: Beta testing feedback
- **Performance improvement**: Measurable speed increase

### Development Metrics
- **Development time**: 9 weeks total
- **Bug count**: < 10 critical issues post-launch
- **Code quality**: ESLint and TypeScript compliance
- **Documentation**: Complete API and user documentation

## Conclusion

This migration plan provides a comprehensive roadmap for transitioning the Deepnest frontend to a modern, internationalized SolidJS application. The phased approach ensures minimal disruption while delivering significant improvements in performance, maintainability, and user experience.

The key success factors are:
1. **Careful planning**: Detailed analysis and specification
2. **Gradual implementation**: Phased development and testing
3. **User focus**: Maintaining functionality while improving experience
4. **Technical excellence**: Modern tooling and best practices

By following this plan, the Deepnest application will have a robust, scalable frontend that can serve users globally while providing a foundation for future enhancements.