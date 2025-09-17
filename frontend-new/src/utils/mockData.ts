import type { Part, Sheet, NestResult, Preset, AppConfig } from '@/types/app.types';
import type { GlobalState } from '@/types/store.types';

// Mock parts data
export const mockParts: Part[] = [
  {
    id: 'part-1',
    name: 'Rectangle Part',
    filename: 'rectangle.svg',
    path: [[0, 0], [100, 0], [100, 50], [0, 50]],
    area: 5000,
    bounds: { x: 0, y: 0, width: 100, height: 50 },
    quantity: 5,
    placed: 3,
    rotation: 0,
    material: 'wood',
    thickness: 3,
    isSelected: false
  },
  {
    id: 'part-2',
    name: 'Circle Part',
    filename: 'circle.svg',
    path: generateCirclePath(25, 50, 50),
    area: 1963.5,
    bounds: { x: 25, y: 25, width: 50, height: 50 },
    quantity: 3,
    placed: 2,
    rotation: 0,
    material: 'acrylic',
    thickness: 5,
    isSelected: false
  },
  {
    id: 'part-3',
    name: 'Triangle Part',
    filename: 'triangle.svg',
    path: [[0, 60], [30, 0], [60, 60]],
    area: 1800,
    bounds: { x: 0, y: 0, width: 60, height: 60 },
    quantity: 8,
    placed: 5,
    rotation: 0,
    material: 'plywood',
    thickness: 6,
    isSelected: true
  }
];

// Mock sheets data
export const mockSheets: Sheet[] = [
  {
    id: 'sheet-1',
    name: 'Standard Sheet',
    width: 600,
    height: 400,
    thickness: 3,
    material: 'wood',
    margin: 5,
    isSelected: true,
    bounds: { x: 0, y: 0, width: 600, height: 400 },
    utilization: 0
  },
  {
    id: 'sheet-2',
    name: 'Large Acrylic Sheet',
    width: 800,
    height: 600,
    thickness: 5,
    material: 'acrylic',
    margin: 3,
    isSelected: false,
    bounds: { x: 0, y: 0, width: 800, height: 600 },
    utilization: 0
  }
];

// Mock nesting results
export const mockNests: NestResult[] = [
  {
    id: 'nest-1',
    sheetId: 'sheet-1',
    placements: [
      {
        id: 'placement-1',
        partId: 'part-1',
        x: 10,
        y: 10,
        rotation: 0,
        bounds: { x: 10, y: 10, width: 100, height: 50 }
      },
      {
        id: 'placement-2',
        partId: 'part-2',
        x: 120,
        y: 10,
        rotation: 0,
        bounds: { x: 120, y: 10, width: 50, height: 50 }
      },
      {
        id: 'placement-3',
        partId: 'part-3',
        x: 10,
        y: 70,
        rotation: 0,
        bounds: { x: 10, y: 70, width: 60, height: 60 }
      }
    ],
    fitness: 0.75,
    utilization: 0.68,
    area: 12000,
    createdAt: new Date().toISOString(),
    isOptimal: false
  },
  {
    id: 'nest-2',
    sheetId: 'sheet-1',
    placements: [
      {
        id: 'placement-4',
        partId: 'part-1',
        x: 5,
        y: 5,
        rotation: 90,
        bounds: { x: 5, y: 5, width: 50, height: 100 }
      },
      {
        id: 'placement-5',
        partId: 'part-2',
        x: 65,
        y: 5,
        rotation: 0,
        bounds: { x: 65, y: 5, width: 50, height: 50 }
      }
    ],
    fitness: 0.82,
    utilization: 0.72,
    area: 8500,
    createdAt: new Date(Date.now() - 60000).toISOString(),
    isOptimal: true
  }
];

// Mock presets
export const mockPresets: Record<string, Preset> = {
  'preset-1': {
    id: 'preset-1',
    name: 'Default Laser Settings',
    description: 'Standard settings for laser cutting wood',
    config: {
      units: 'mm',
      scale: 1,
      spacing: 2,
      rotations: 4,
      populationSize: 20,
      mutationRate: 15,
      threads: 4,
      placementType: 'gravity',
      mergeLines: true,
      timeRatio: 0.5,
      simplify: false,
      tolerance: 0.1,
      endpointTolerance: 0.05,
      svgScale: 1,
      dxfImportUnits: 'mm',
      dxfExportUnits: 'mm',
      exportSheetBounds: true,
      exportSheetSpacing: false,
      sheetSpacing: 10,
      useQuantityFromFilename: true,
      useSvgPreProcessor: false,
      conversionServer: 'https://converter.deepnest.app/convert'
    },
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 3600000).toISOString()
  },
  'preset-2': {
    id: 'preset-2',
    name: 'High Precision CNC',
    description: 'Tight tolerances for CNC machining',
    config: {
      units: 'inches',
      scale: 72,
      spacing: 0.1,
      rotations: 8,
      populationSize: 50,
      mutationRate: 5,
      threads: 8,
      placementType: 'bottom-left',
      mergeLines: false,
      timeRatio: 0.8,
      simplify: true,
      tolerance: 0.001,
      endpointTolerance: 0.0005,
      svgScale: 72,
      dxfImportUnits: 'inches',
      dxfExportUnits: 'inches',
      exportSheetBounds: true,
      exportSheetSpacing: true,
      sheetSpacing: 0.25,
      useQuantityFromFilename: false,
      useSvgPreProcessor: true,
      conversionServer: 'https://converter.deepnest.app/convert'
    },
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    updatedAt: new Date(Date.now() - 7200000).toISOString()
  }
};

// Helper function to generate circle path
function generateCirclePath(radius: number, centerX: number, centerY: number): number[][] {
  const points: number[][] = [];
  const segments = 32;
  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * 2 * Math.PI;
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);
    points.push([x, y]);
  }
  return points;
}

// Mock global state for development
export const createMockGlobalState = (): GlobalState => ({
  ui: {
    activeTab: 'parts',
    darkMode: false,
    language: 'en',
    theme: 'auto',
    showTooltips: true,
    showStatusBar: true,
    modals: {
      presetModal: false,
      helpModal: false
    },
    panels: {
      partsWidth: 300,
      resultsHeight: 200
    }
  },
  config: {
    units: 'mm',
    scale: 1,
    spacing: 2,
    rotations: 4,
    populationSize: 20,
    mutationRate: 10,
    threads: 4,
    placementType: 'gravity',
    mergeLines: true,
    timeRatio: 0.5,
    simplify: false,
    tolerance: 0.1,
    endpointTolerance: 0.05,
    svgScale: 1,
    dxfImportUnits: 'mm',
    dxfExportUnits: 'mm',
    exportSheetBounds: false,
    exportSheetSpacing: false,
    sheetSpacing: 10,
    useQuantityFromFilename: false,
    useSvgPreProcessor: false,
    conversionServer: 'https://converter.deepnest.app/convert'
  },
  app: {
    parts: mockParts,
    sheets: mockSheets,
    nests: mockNests,
    presets: mockPresets,
    importedFiles: []
  },
  process: {
    isNesting: false,
    progress: 0,
    currentNest: null,
    workerStatus: {
      isRunning: false,
      currentOperation: '',
      threadsActive: 0
    },
    lastError: null
  }
});

// Function to detect if running in development mode
export const isDevelopmentMode = (): boolean => {
  // Check if we're in a development environment
  return import.meta.env.DEV || 
         (typeof window !== 'undefined' && !(window as any).electronAPI);
};

// Initialize mock data in development
export const initializeMockData = (setGlobalState: any) => {
  if (isDevelopmentMode()) {
    const mockState = createMockGlobalState();
    setGlobalState(mockState);
    console.info('🔧 Development mode: Mock data initialized');
  }
};