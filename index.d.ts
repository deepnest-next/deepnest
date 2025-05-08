export type DeepNestConfig = {
  units: "mm" | "inch";
  scale: number;
  spacing: number;
  curveTolerance: number;
  clipperScale: number;
  rotations: number;
  threads: number;
  populationSize: number;
  mutationRate: number;
  placementType: "gravity" | "box" | "convexhull";
  mergeLines: boolean;
  /**
   * ratio of material reduction to laser time. 0 = optimize material only, 1 = optimize laser time only
   */
  timeRatio: number;
  simplify: boolean;
  dxfImportScale: number;
  dxfExportScale: number;
  endpointTolerance: number;
  conversionServer: string;
};

export type SheetPlacement = {
  filename: string;
  id: number;
  rotation: number;
  source: number;
  x: number;
  y: number;
};

export type NestingResult = {
  area: number;
  fitness: number;
  index: number;
  mergedLength: number;
  selected: boolean;
  placements: {
    sheet: number;
    sheetid: number;
    sheetplacements: SheetPlacement[];
  }[];
};

declare global {
  interface Window {
    config: {
      getSync: () => DeepNestConfig;
    };
    DeepNest: {
      config: () => DeepNestConfig;
      nests: NestingResult;
    };
  }
}
