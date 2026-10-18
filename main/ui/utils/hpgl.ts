/**
 * HPGL (PLT) generation utilities for DeepNest
 * Turns polylines into an HPGL command string. Pure functions with no DOM or
 * Electron dependencies so they can be tested on their own.
 *
 * HPGL basics used here:
 * - IN initializes, SP selects a pen/tool, PU lifts the pen, PD lowers it
 * - PU/PD followed by coordinates move to (PU) or draw to (PD) those points
 * - Coordinates are integers in plotter units; the default is 1016 units/inch (0.025 mm)
 */

export const HPGL_UNITS_PER_INCH = 1016;

const MAX_POINTS_PER_PD = 50;

export interface HpglPoint {
  x: number;
  y: number;
}

export interface HpglPath {
  /** Points in inches, y pointing up */
  points: HpglPoint[];
  /** When true, the path is returned to its first point */
  closed: boolean;
}

export interface HpglOptions {
  /** Plotter units per inch (default: 1016) */
  unitsPerInch?: number;
  /** Pen/tool number passed to SP (default: 1) */
  pen?: number;
}

function toPlotterUnits(inches: number, unitsPerInch: number): number {
  return Math.round(inches * unitsPerInch);
}

export function generateHpgl(paths: HpglPath[], options: HpglOptions = {}): string {
  const unitsPerInch = options.unitsPerInch ?? HPGL_UNITS_PER_INCH;
  const pen = options.pen ?? 1;

  const lines: string[] = ["IN;", `SP${pen};`];

  for (const path of paths) {
    if (path.points.length < 2) {
      continue;
    }

    const coords = path.points.map((p) => [
      toPlotterUnits(p.x, unitsPerInch),
      toPlotterUnits(p.y, unitsPerInch),
    ]);

    if (path.closed) {
      coords.push(coords[0]);
    }

    lines.push(`PU${coords[0][0]},${coords[0][1]};`);

    const rest = coords.slice(1);
    for (let i = 0; i < rest.length; i += MAX_POINTS_PER_PD) {
      const chunk = rest.slice(i, i + MAX_POINTS_PER_PD);
      lines.push(`PD${chunk.map((c) => `${c[0]},${c[1]}`).join(",")};`);
    }

    lines.push("PU;");
  }

  lines.push("SP0;");

  return lines.join("\n") + "\n";
}
