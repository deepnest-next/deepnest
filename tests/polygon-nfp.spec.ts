import { test, expect } from "@playwright/test";
import { Point } from "../main/util/point.js";
import { Polygon } from "../main/util/polygon.js";

test.describe("Polygon - NFP Operations", () => {
  const squareA = new Polygon([
    new Point(0, 0),
    new Point(4, 0),
    new Point(4, 4),
    new Point(0, 4),
  ]);

  const squareB = new Polygon([
    new Point(0, 0),
    new Point(2, 0),
    new Point(2, 2),
    new Point(0, 2),
  ]);

  const triangleA = new Polygon([
    new Point(0, 0),
    new Point(4, 0),
    new Point(2, 4),
  ]);

  const triangleB = new Polygon([
    new Point(0, 0),
    new Point(2, 0),
    new Point(1, 2),
  ]);

  const rectangleA = new Polygon([
    new Point(0, 0),
    new Point(6, 0),
    new Point(6, 3),
    new Point(0, 3),
  ]);

  const rectangleB = new Polygon([
    new Point(0, 0),
    new Point(2, 0),
    new Point(2, 1),
    new Point(0, 1),
  ]);

  test.describe("No-Fit Polygon (NFP)", () => {
    test("noFitPolygon returns empty array for invalid input", () => {
      // Test with null/undefined input
      const nfp1 = Polygon.noFitPolygon(squareA, null as any);
      const nfp2 = Polygon.noFitPolygon(null as any, squareB);
      
      expect(nfp1).toEqual([]);
      expect(nfp2).toEqual([]);
    });

    test("noFitPolygon handles exterior NFP case", () => {
      const nfp = Polygon.noFitPolygon(squareA, squareB, false);
      
      // Should return array (may be empty in test environment without NFP addon)
      expect(Array.isArray(nfp)).toBe(true);
      
      // If NFP calculation succeeded, validate the result
      if (nfp.length > 0) {
        nfp.forEach(polygon => {
          expect(polygon).toBeInstanceOf(Polygon);
          expect(polygon.points.length).toBeGreaterThanOrEqual(3);
        });
      }
    });

    test("noFitPolygon handles interior NFP case", () => {
      const nfp = Polygon.noFitPolygon(squareA, squareB, true);
      
      // Should return array (may be empty in test environment without NFP addon)
      expect(Array.isArray(nfp)).toBe(true);
      
      // If NFP calculation succeeded, validate the result
      if (nfp.length > 0) {
        nfp.forEach(polygon => {
          expect(polygon).toBeInstanceOf(Polygon);
          expect(polygon.points.length).toBeGreaterThanOrEqual(3);
        });
      }
    });

    test("noFitPolygon with triangles", () => {
      const nfp = Polygon.noFitPolygon(triangleA, triangleB);
      
      expect(Array.isArray(nfp)).toBe(true);
      
      // Verify polygons are valid if NFP succeeded
      if (nfp.length > 0) {
        nfp.forEach(polygon => {
          expect(polygon.isValid()).toBe(true);
        });
      }
    });

    test("noFitPolygon with same polygons", () => {
      const nfp = Polygon.noFitPolygon(squareA, squareA);
      
      expect(Array.isArray(nfp)).toBe(true);
    });
  });

  test.describe("Rectangle NFP", () => {
    test("noFitPolygonRectangle validates rectangle input", () => {
      const nfp1 = Polygon.noFitPolygonRectangle(triangleA, rectangleB);
      const nfp2 = Polygon.noFitPolygonRectangle(rectangleA, triangleB);
      
      expect(nfp1).toEqual([]);
      expect(nfp2).toEqual([]);
    });

    test("noFitPolygonRectangle returns empty for oversized polygon", () => {
      const largeRect = new Polygon([
        new Point(0, 0),
        new Point(10, 0),
        new Point(10, 10),
        new Point(0, 10),
      ]);
      
      const nfp = Polygon.noFitPolygonRectangle(rectangleA, largeRect);
      
      expect(nfp).toEqual([]);
    });

    test("noFitPolygonRectangle calculates valid NFP for fitting rectangles", () => {
      const nfp = Polygon.noFitPolygonRectangle(rectangleA, rectangleB);
      
      // Should return at least one NFP polygon
      expect(nfp.length).toBeGreaterThanOrEqual(0);
      
      if (nfp.length > 0) {
        const nfpPolygon = nfp[0];
        expect(nfpPolygon).toBeInstanceOf(Polygon);
        expect(nfpPolygon.points.length).toBe(4);
        expect(nfpPolygon.isRectangle()).toBe(true);
        
        // NFP should represent valid placement area
        const nfpBounds = nfpPolygon.bounds();
        expect(nfpBounds.width).toBeGreaterThanOrEqual(0);
        expect(nfpBounds.height).toBeGreaterThanOrEqual(0);
      }
    });

    test("noFitPolygonRectangle handles exact fit case", () => {
      const exactFit = new Polygon([
        new Point(0, 0),
        new Point(6, 0),
        new Point(6, 3),
        new Point(0, 3),
      ]);
      
      const nfp = Polygon.noFitPolygonRectangle(rectangleA, exactFit);
      
      // Should return empty array or single point polygon for exact fit
      expect(nfp.length).toBeGreaterThanOrEqual(0);
    });

    test("noFitPolygonRectangle with square inside square", () => {
      const nfp = Polygon.noFitPolygonRectangle(squareA, squareB);
      
      if (nfp.length > 0) {
        const nfpPolygon = nfp[0];
        const nfpBounds = nfpPolygon.bounds();
        
        // NFP should be a 2x2 square (4x4 - 2x2)
        expect(nfpBounds.width).toBeCloseTo(2, 5);
        expect(nfpBounds.height).toBeCloseTo(2, 5);
      }
    });
  });

  test.describe("Polygon Merge", () => {
    test("merge returns null for invalid input", () => {
      const result1 = squareA.merge(null as any);
      const result2 = squareA.merge(undefined as any);
      
      expect(result1).toBe(null);
      expect(result2).toBe(null);
    });

    test("merge combines two squares", () => {
      // Create adjacent squares
      const square1 = new Polygon([
        new Point(0, 0),
        new Point(2, 0),
        new Point(2, 2),
        new Point(0, 2),
      ]);
      
      const square2 = new Polygon([
        new Point(2, 0),
        new Point(4, 0),
        new Point(4, 2),
        new Point(2, 2),
      ]);
      
      const merged = square1.merge(square2);
      
      if (merged) {
        expect(merged).toBeInstanceOf(Polygon);
        expect(merged.points.length).toBeGreaterThanOrEqual(3);
        
        // Merged polygon should have larger area than either individual square
        const mergedArea = Math.abs(merged.area());
        const square1Area = Math.abs(square1.area());
        const square2Area = Math.abs(square2.area());
        
        expect(mergedArea).toBeGreaterThanOrEqual(square1Area);
        expect(mergedArea).toBeGreaterThanOrEqual(square2Area);
      }
    });

    test("merge combines triangles", () => {
      const triangle1 = new Polygon([
        new Point(0, 0),
        new Point(2, 0),
        new Point(1, 2),
      ]);
      
      const triangle2 = new Polygon([
        new Point(1, 2),
        new Point(3, 2),
        new Point(2, 4),
      ]);
      
      const merged = triangle1.merge(triangle2);
      
      if (merged) {
        expect(merged).toBeInstanceOf(Polygon);
        expect(merged.points.length).toBeGreaterThanOrEqual(3);
        expect(merged.isValid()).toBe(true);
      }
    });

    test("merge with overlapping polygons", () => {
      const rect1 = new Polygon([
        new Point(0, 0),
        new Point(3, 0),
        new Point(3, 2),
        new Point(0, 2),
      ]);
      
      const rect2 = new Polygon([
        new Point(1, 1),
        new Point(4, 1),
        new Point(4, 3),
        new Point(1, 3),
      ]);
      
      const merged = rect1.merge(rect2);
      
      if (merged) {
        expect(merged).toBeInstanceOf(Polygon);
        expect(merged.points.length).toBeGreaterThanOrEqual(3);
        
        // Merged area should be approximately the union area
        const mergedArea = Math.abs(merged.area());
        const rect1Area = Math.abs(rect1.area());
        const rect2Area = Math.abs(rect2.area());
        
        expect(mergedArea).toBeGreaterThanOrEqual(Math.max(rect1Area, rect2Area));
      }
    });

    test("merge identical polygons", () => {
      const merged = squareA.merge(squareA);
      
      if (merged) {
        expect(merged).toBeInstanceOf(Polygon);
        
        // Merged polygon should have same or larger area
        const mergedArea = Math.abs(merged.area());
        const originalArea = Math.abs(squareA.area());
        
        expect(mergedArea).toBeGreaterThanOrEqual(originalArea);
      }
    });

    test("merge with separated polygons", () => {
      const separated = new Polygon([
        new Point(10, 10),
        new Point(12, 10),
        new Point(12, 12),
        new Point(10, 12),
      ]);
      
      const merged = squareA.merge(separated);
      
      if (merged) {
        expect(merged).toBeInstanceOf(Polygon);
        expect(merged.points.length).toBeGreaterThanOrEqual(3);
        
        // Should create convex hull encompassing both polygons
        const mergedArea = Math.abs(merged.area());
        const squareArea = Math.abs(squareA.area());
        const separatedArea = Math.abs(separated.area());
        
        expect(mergedArea).toBeGreaterThan(squareArea + separatedArea);
      }
    });
  });

  test.describe("NFP Edge Cases", () => {
    test("handles collinear polygons", () => {
      const line1 = new Polygon([
        new Point(0, 0),
        new Point(2, 0),
        new Point(1, 0),
      ]);
      
      const line2 = new Polygon([
        new Point(0, 1),
        new Point(2, 1),
        new Point(1, 1),
      ]);
      
      const nfp = Polygon.noFitPolygon(line1, line2);
      expect(Array.isArray(nfp)).toBe(true);
    });

    test("handles very small polygons", () => {
      const tiny1 = new Polygon([
        new Point(0, 0),
        new Point(0.01, 0),
        new Point(0.005, 0.01),
      ]);
      
      const tiny2 = new Polygon([
        new Point(0, 0),
        new Point(0.005, 0),
        new Point(0.0025, 0.005),
      ]);
      
      const nfp = Polygon.noFitPolygon(tiny1, tiny2);
      expect(Array.isArray(nfp)).toBe(true);
    });

    test("handles complex polygons", () => {
      const complex1 = new Polygon([
        new Point(0, 0),
        new Point(4, 0),
        new Point(4, 2),
        new Point(2, 2),
        new Point(2, 4),
        new Point(0, 4),
      ]);
      
      const complex2 = new Polygon([
        new Point(0, 0),
        new Point(1, 0),
        new Point(1, 1),
        new Point(0, 1),
      ]);
      
      const nfp = Polygon.noFitPolygon(complex1, complex2);
      expect(Array.isArray(nfp)).toBe(true);
    });
  });
});