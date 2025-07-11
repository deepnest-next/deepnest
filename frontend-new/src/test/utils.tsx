import { render, RenderResult } from '@solidjs/testing-library';
import { Component, createSignal, JSX } from 'solid-js';
import { createStore } from 'solid-js/store';
import type { GlobalState, UIState, AppState, ProcessState } from '@/types/store.types';

// Mock translation hook
export const mockTranslation = (namespace: string = 'common') => {
  const t = (key: string, options?: any) => {
    if (options && Object.keys(options).length > 0) {
      return `${namespace}:${key}:${JSON.stringify(options)}`;
    }
    return `${namespace}:${key}`;
  };
  return [t];
};

// Mock global state for testing
export const createMockGlobalState = (): GlobalState => ({
  ui: {
    activeTab: 'parts',
    darkMode: false,
    language: 'en',
    modals: {
      presetModal: false,
      helpModal: false,
    },
    panels: {
      partsWidth: 300,
      resultsHeight: 200,
    },
  } as UIState,
  config: {
    units: 'mm',
    scale: 1,
    spacing: 0,
    rotations: 4,
    populationSize: 10,
    mutationRate: 10,
    threads: 4,
    placementType: 'gravity',
    mergeLines: true,
    timeRatio: 0.5,
    simplify: false,
    tolerance: 0.72,
    endpointTolerance: 0.36,
    svgScale: 72,
    dxfImportUnits: 'mm',
    dxfExportUnits: 'mm',
    exportSheetBounds: false,
    exportSheetSpacing: false,
    sheetSpacing: 10,
    useQuantityFromFilename: false,
    useSvgPreProcessor: false,
    conversionServer: 'https://converter.deepnest.app/convert',
  },
  app: {
    parts: [],
    sheets: [],
    nests: [],
    presets: {},
    importedFiles: [],
  } as AppState,
  process: {
    isNesting: false,
    progress: 0,
    currentNest: null,
    workerStatus: {
      isRunning: false,
      currentOperation: '',
      threadsActive: 0,
    },
    lastError: null,
  } as ProcessState,
});

// Mock global actions
export const createMockGlobalActions = () => ({
  setActiveTab: vi.fn(),
  setDarkMode: vi.fn(),
  toggleDarkMode: vi.fn(),
  setCurrentPanel: vi.fn(),
  setLanguage: vi.fn(),
  openModal: vi.fn(),
  closeModal: vi.fn(),
  updateConfig: vi.fn(),
  setParts: vi.fn(),
  addPart: vi.fn(),
  removePart: vi.fn(),
  updatePart: vi.fn(),
  setNests: vi.fn(),
  addNest: vi.fn(),
  setNestingStatus: vi.fn(),
  startNesting: vi.fn(),
  setNestingProgress: vi.fn(),
  setWorkerStatus: vi.fn(),
  setError: vi.fn(),
});

// Mock IPC service
export const createMockIPCService = () => ({
  isAvailable: true,
  invoke: vi.fn(),
  send: vi.fn(),
  on: vi.fn(),
  off: vi.fn(),
  openFileDialog: vi.fn(),
  saveFileDialog: vi.fn(),
  importParts: vi.fn(),
  exportParts: vi.fn(),
  startNesting: vi.fn(),
  stopNesting: vi.fn(),
  readConfig: vi.fn(),
  writeConfig: vi.fn(),
  onNestProgress: vi.fn(),
  onNestComplete: vi.fn(),
  onNestError: vi.fn(),
  onBackgroundProgress: vi.fn(),
  onWorkerStatus: vi.fn(),
});

// Test wrapper component with providers
interface TestWrapperProps {
  children: JSX.Element;
  initialState?: Partial<GlobalState>;
}

export const TestWrapper: Component<TestWrapperProps> = (props) => {
  const [globalState] = createStore(createMockGlobalState());
  
  return (
    <div data-testid="test-wrapper">
      {props.children}
    </div>
  );
};

// Custom render function with test wrapper
export const renderWithProviders = (
  component: () => JSX.Element,
  options: {
    initialState?: Partial<GlobalState>;
    wrapperProps?: any;
  } = {}
): RenderResult => {
  const Wrapper = (props: any) => (
    <TestWrapper {...options.wrapperProps} initialState={options.initialState}>
      {props.children}
    </TestWrapper>
  );

  return render(component, { wrapper: Wrapper });
};

// Mock part data for testing
export const createMockPart = (overrides = {}) => ({
  id: 'test-part-1',
  name: 'Test Part',
  source: 'test-file.svg',
  quantity: 1,
  rotation: 0,
  bounds: {
    x: 0,
    y: 0,
    width: 100,
    height: 50,
  },
  area: 5000,
  svg: '<svg><rect width="100" height="50"/></svg>',
  ...overrides,
});

// Mock sheet data for testing
export const createMockSheet = (overrides = {}) => ({
  id: 'test-sheet-1',
  name: 'Test Sheet',
  width: 1000,
  height: 500,
  thickness: 3,
  margin: 10,
  ...overrides,
});

// Mock nest data for testing
export const createMockNest = (overrides = {}) => ({
  id: 'test-nest-1',
  parts: [],
  sheets: [],
  efficiency: 0.85,
  totalArea: 1000,
  usedArea: 850,
  createdAt: new Date().toISOString(),
  ...overrides,
});

// Wait for next tick helper
export const waitForNextTick = () => new Promise(resolve => setTimeout(resolve, 0));

// Simulate user interaction delays
export const wait = (ms: number = 0) => new Promise(resolve => setTimeout(resolve, ms));