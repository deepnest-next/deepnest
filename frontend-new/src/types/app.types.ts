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
  svg: SVGElement;
  polygon: Point[];
  bounds: Bounds;
  quantity: number;
  rotation: number;
  sheet: boolean;
  selected: boolean;
  svgelements: SVGElement[];
}

export interface Sheet {
  id: string;
  name: string;
  width: number;
  height: number;
  bounds: Bounds;
}

export interface Placement {
  id: string;
  partId: string;
  x: number;
  y: number;
  rotation: number;
  sheetId: string;
}

export interface NestResult {
  id: string;
  fitness: number;
  selected: boolean;
  utilisation: number;
  mergedLength: number;
  placements: {
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
  name: string;
  config: AppConfig;
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