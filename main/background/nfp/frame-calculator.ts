import type { Point, Polygon, PolygonWithChildren } from "../types/index.js";

// Ambient declaration for GeometryUtil
declare const GeometryUtil: {
  getPolygonBounds(polygon: Point[]): {
    x: number;
    y: number;
    width: number;
    height: number;
  };
};

/**
 * Creates an expanded frame around a polygon for inner NFP calculation.
 * The frame is expanded by 10% to create a safety margin that ensures the inner NFP
 * properly captures all valid placement positions inside the hole.
 *
 * @param A - The polygon to create a frame around
 * @returns A frame polygon with the original polygon as a child
 */
export function getFrame(A: Polygon): PolygonWithChildren {
  const bounds = GeometryUtil.getPolygonBounds(A);

  // @preserve: 1.1 multiplier for frame expansion (10% safety margin)
  bounds.width *= 1.1;
  bounds.height *= 1.1;
  // Center the expanded frame by offsetting by half the expansion amount (0.5x the difference)
  bounds.x -= 0.5 * (bounds.width - bounds.width / 1.1);
  bounds.y -= 0.5 * (bounds.height - bounds.height / 1.1);

  const frame: Point[] & {
    children?: Polygon[];
    source?: number | string;
    rotation?: number;
  } = [];
  frame.push({ x: bounds.x, y: bounds.y });
  frame.push({ x: bounds.x + bounds.width, y: bounds.y });
  frame.push({ x: bounds.x + bounds.width, y: bounds.y + bounds.height });
  frame.push({ x: bounds.x, y: bounds.y + bounds.height });

  frame.children = [A];
  frame.source = (A as any).source;
  frame.rotation = 0;

  return frame as PolygonWithChildren;
}
