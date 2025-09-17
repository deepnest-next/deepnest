export interface Point {
  x: number;
  y: number;
}

export interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Part {
  id: string;
  name: string;
  filename?: string;
  svg?: SVGElement;
  polygon?: Point[];
  path?: number[][];
  bounds: Bounds;
  area?: number;
  quantity: number;
  placed?: number;
  rotation: number;
  material?: string;
  thickness?: number;
  sheet?: boolean;
  selected?: boolean;
  isSelected?: boolean;
  svgelements?: SVGElement[];
}

export interface Sheet {
  id: string;
  name: string;
  width: number;
  height: number;
  thickness?: number;
  material?: string;
  margin?: number;
  isSelected?: boolean;
  bounds: Bounds;
  utilization?: number;
}

export interface Placement {
  id: string;
  partId: string;
  x: number;
  y: number;
  rotation: number;
  sheetId?: string;
  bounds?: Bounds;
}

export interface NestResult {
  id: string;
  sheetId?: string;
  fitness: number;
  selected?: boolean;
  utilization?: number;
  utilisation?: number;
  mergedLength?: number;
  area?: number;
  createdAt?: string;
  isOptimal?: boolean;
  placements: Placement[] | {
    sheet: number;
    sheetid: string;
    sheetplacements: Placement[];
  }[];
}

export interface ImportedFile {
  id: string;
  filename: string;
  svg: SVGElement;
  selected: boolean;
  zoom?: any; // svgPanZoom instance
}

export interface Preset {
  id: string;
  name: string;
  description?: string;
  config: AppConfig;
  createdAt: string;
  updatedAt: string;
}

export interface AppConfig {
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
  svgScale: number;
  dxfImportUnits: string;
  dxfExportUnits: string;
  exportSheetBounds: boolean;
  exportSheetSpacing: boolean;
  sheetSpacing: number;
  useQuantityFromFilename: boolean;
  useSvgPreProcessor: boolean;
  conversionServer: string;
}