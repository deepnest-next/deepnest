import { test, expect } from "@playwright/test";
import { Point } from "../main/util/point.js";
import { Polygon } from "../main/util/polygon.js";
import { Matrix } from "../main/util/matrix.js";

test.describe("Polygon - Transformation Methods", () => {
  const squarePoints = [
    new Point(0, 0),
    new Point(2, 0),
    new Point(2, 2),
    new Point(0, 2),
  ];

  const trianglePoints = [new Point(0, 0), new Point(3, 0), new Point(1.5, 3)];

  test.describe("Rotation", () => {
    test("rotate returns clone for 0 degrees", () => {
      const square = new Polygon(squarePoints);
      const rotated = square.rotate(0);
      
      expect(rotated).not.toBe(square); // Different instance
      expect(rotated.points).toHaveLength(4);
      expect(rotated.points[0].x).toBeCloseTo(0, 5);
      expect(rotated.points[0].y).toBeCloseTo(0, 5);
    });

    test("rotate 90 degrees around origin", () => {
      const square = new Polygon(squarePoints);
      const rotated = square.rotate(90);
      
      expect(rotated.points).toHaveLength(4);
      // (0,0) -> (0,0), (2,0) -> (0,2), (2,2) -> (-2,2), (0,2) -> (-2,0)
      expect(rotated.points[0].x).toBeCloseTo(0, 5);
      expect(rotated.points[0].y).toBeCloseTo(0, 5);
      expect(rotated.points[1].x).toBeCloseTo(0, 5);
      expect(rotated.points[1].y).toBeCloseTo(2, 5);
      expect(rotated.points[2].x).toBeCloseTo(-2, 5);
      expect(rotated.points[2].y).toBeCloseTo(2, 5);
      expect(rotated.points[3].x).toBeCloseTo(-2, 5);
      expect(rotated.points[3].y).toBeCloseTo(0, 5);
    });

    test("rotate 180 degrees", () => {
      const square = new Polygon(squarePoints);
      const rotated = square.rotate(180);
      
      expect(rotated.points[0].x).toBeCloseTo(0, 5);
      expect(rotated.points[0].y).toBeCloseTo(0, 5);
      expect(rotated.points[1].x).toBeCloseTo(-2, 5);
      expect(rotated.points[1].y).toBeCloseTo(0, 5);
      expect(rotated.points[2].x).toBeCloseTo(-2, 5);
      expect(rotated.points[2].y).toBeCloseTo(-2, 5);
    });

    test("rotateAround center point", () => {
      const square = new Polygon(squarePoints);
      const center = new Point(1, 1); // Center of the square
      const rotated = square.rotateAround(90, center);
      
      // Rotating around center should keep the center at (1,1)
      // (0,0) -> (2,0), (2,0) -> (2,2), (2,2) -> (0,2), (0,2) -> (0,0)
      expect(rotated.points[0].x).toBeCloseTo(2, 5);
      expect(rotated.points[0].y).toBeCloseTo(0, 5);
      expect(rotated.points[1].x).toBeCloseTo(2, 5);
      expect(rotated.points[1].y).toBeCloseTo(2, 5);
      expect(rotated.points[2].x).toBeCloseTo(0, 5);
      expect(rotated.points[2].y).toBeCloseTo(2, 5);
      expect(rotated.points[3].x).toBeCloseTo(0, 5);
      expect(rotated.points[3].y).toBeCloseTo(0, 5);
    });

    test("rotate handles children polygons", () => {
      const parent = new Polygon(squarePoints);
      const child = new Polygon(trianglePoints);
      parent.children = [child];
      
      const rotated = parent.rotate(90);
      
      expect(rotated.children).toHaveLength(1);
      expect(rotated.children![0].points[1].x).toBeCloseTo(0, 5);
      expect(rotated.children![0].points[1].y).toBeCloseTo(3, 5);
    });
  });

  test.describe("Translation", () => {
    test("translate returns clone for zero offset", () => {
      const square = new Polygon(squarePoints);
      const translated = square.translate(0, 0);
      
      expect(translated).not.toBe(square); // Different instance
      expect(translated.points[0].x).toBe(0);
      expect(translated.points[0].y).toBe(0);
    });

    test("translate by positive offset", () => {
      const square = new Polygon(squarePoints);
      const translated = square.translate(5, 3);
      
      expect(translated.points[0].x).toBe(5);
      expect(translated.points[0].y).toBe(3);
      expect(translated.points[1].x).toBe(7);
      expect(translated.points[1].y).toBe(3);
      expect(translated.points[2].x).toBe(7);
      expect(translated.points[2].y).toBe(5);
      expect(translated.points[3].x).toBe(5);
      expect(translated.points[3].y).toBe(5);
    });

    test("translate by negative offset", () => {
      const square = new Polygon(squarePoints);
      const translated = square.translate(-2, -1);
      
      expect(translated.points[0].x).toBe(-2);
      expect(translated.points[0].y).toBe(-1);
      expect(translated.points[1].x).toBe(0);
      expect(translated.points[1].y).toBe(-1);
    });

    test("translate handles children polygons", () => {
      const parent = new Polygon(squarePoints);
      const child = new Polygon(trianglePoints);
      parent.children = [child];
      
      const translated = parent.translate(10, 20);
      
      expect(translated.children).toHaveLength(1);
      expect(translated.children![0].points[0].x).toBe(10);
      expect(translated.children![0].points[0].y).toBe(20);
      expect(translated.children![0].points[1].x).toBe(13);
      expect(translated.children![0].points[1].y).toBe(20);
    });
  });

  test.describe("Scaling", () => {
    test("scale returns clone for identity scale", () => {
      const square = new Polygon(squarePoints);
      const scaled = square.scale(1, 1);
      
      expect(scaled).not.toBe(square); // Different instance
      expect(scaled.points[1].x).toBe(2);
      expect(scaled.points[1].y).toBe(0);
    });

    test("uniform scaling", () => {
      const square = new Polygon(squarePoints);
      const scaled = square.scale(2);
      
      expect(scaled.points[0].x).toBe(0);
      expect(scaled.points[0].y).toBe(0);
      expect(scaled.points[1].x).toBe(4);
      expect(scaled.points[1].y).toBe(0);
      expect(scaled.points[2].x).toBe(4);
      expect(scaled.points[2].y).toBe(4);
      expect(scaled.points[3].x).toBe(0);
      expect(scaled.points[3].y).toBe(4);
    });

    test("non-uniform scaling", () => {
      const square = new Polygon(squarePoints);
      const scaled = square.scale(3, 0.5);
      
      expect(scaled.points[0].x).toBe(0);
      expect(scaled.points[0].y).toBe(0);
      expect(scaled.points[1].x).toBe(6);
      expect(scaled.points[1].y).toBe(0);
      expect(scaled.points[2].x).toBe(6);
      expect(scaled.points[2].y).toBe(1);
      expect(scaled.points[3].x).toBe(0);
      expect(scaled.points[3].y).toBe(1);
    });

    test("scaleAround center point", () => {
      const square = new Polygon(squarePoints);
      const center = new Point(1, 1); // Center of the square
      const scaled = square.scaleAround(2, 2, center);
      
      // Scaling 2x around center should expand square outward
      expect(scaled.points[0].x).toBe(-1);
      expect(scaled.points[0].y).toBe(-1);
      expect(scaled.points[1].x).toBe(3);
      expect(scaled.points[1].y).toBe(-1);
      expect(scaled.points[2].x).toBe(3);
      expect(scaled.points[2].y).toBe(3);
      expect(scaled.points[3].x).toBe(-1);
      expect(scaled.points[3].y).toBe(3);
    });

    test("scale handles children polygons", () => {
      const parent = new Polygon(squarePoints);
      const child = new Polygon(trianglePoints);
      parent.children = [child];
      
      const scaled = parent.scale(2);
      
      expect(scaled.children).toHaveLength(1);
      expect(scaled.children![0].points[1].x).toBe(6); // 3 * 2
      expect(scaled.children![0].points[2].y).toBe(6); // 3 * 2
    });
  });

  test.describe("Matrix Transformation", () => {
    test("transform with identity matrix returns clone", () => {
      const square = new Polygon(squarePoints);
      const matrix = new Matrix();
      const transformed = square.transform(matrix);
      
      expect(transformed).not.toBe(square); // Different instance
      expect(transformed.points[1].x).toBe(2);
      expect(transformed.points[1].y).toBe(0);
    });

    test("transform with translation matrix", () => {
      const square = new Polygon(squarePoints);
      const matrix = new Matrix().translate(5, 3);
      const transformed = square.transform(matrix);
      
      expect(transformed.points[0].x).toBe(5);
      expect(transformed.points[0].y).toBe(3);
      expect(transformed.points[1].x).toBe(7);
      expect(transformed.points[1].y).toBe(3);
    });

    test("transform with rotation matrix", () => {
      const square = new Polygon(squarePoints);
      const matrix = new Matrix().rotate(90, 0, 0);
      const transformed = square.transform(matrix);
      
      expect(transformed.points[0].x).toBeCloseTo(0, 5);
      expect(transformed.points[0].y).toBeCloseTo(0, 5);
      expect(transformed.points[1].x).toBeCloseTo(0, 5);
      expect(transformed.points[1].y).toBeCloseTo(2, 5);
    });

    test("transform with scale matrix", () => {
      const square = new Polygon(squarePoints);
      const matrix = new Matrix().scale(2, 3);
      const transformed = square.transform(matrix);
      
      expect(transformed.points[0].x).toBe(0);
      expect(transformed.points[0].y).toBe(0);
      expect(transformed.points[1].x).toBe(4);
      expect(transformed.points[1].y).toBe(0);
      expect(transformed.points[2].x).toBe(4);
      expect(transformed.points[2].y).toBe(6);
    });

    test("transform with combined transformations", () => {
      const square = new Polygon(squarePoints);
      const matrix = new Matrix()
        .translate(1, 1)
        .rotate(90, 0, 0)
        .scale(2, 2);
      const transformed = square.transform(matrix);
      
      // This should apply scale, then rotation, then translation
      expect(transformed.points[0].x).toBeCloseTo(1, 5);
      expect(transformed.points[0].y).toBeCloseTo(1, 5);
    });

    test("transform handles children polygons", () => {
      const parent = new Polygon(squarePoints);
      const child = new Polygon(trianglePoints);
      parent.children = [child];
      
      const matrix = new Matrix().translate(10, 20);
      const transformed = parent.transform(matrix);
      
      expect(transformed.children).toHaveLength(1);
      expect(transformed.children![0].points[0].x).toBe(10);
      expect(transformed.children![0].points[0].y).toBe(20);
    });
  });

  test.describe("Chaining Transformations", () => {
    test("can chain multiple transformations", () => {
      const square = new Polygon(squarePoints);
      const result = square
        .translate(1, 1)
        .rotate(90)
        .scale(2);
      
      // Each transformation should return a new polygon
      expect(result).not.toBe(square);
      expect(result.points).toHaveLength(4);
    });

    test("chained transformations produce expected result", () => {
      const triangle = new Polygon(trianglePoints);
      const result = triangle
        .scale(2)        // Double size
        .translate(5, 0) // Move right 5
        .rotate(90);     // Rotate 90 degrees
      
      // Original triangle: (0,0), (3,0), (1.5,3)
      // After scale(2): (0,0), (6,0), (3,6)
      // After translate(5,0): (5,0), (11,0), (8,6)
      // After rotate(90): (0,5), (0,11), (-6,8)
      
      expect(result.points[0].x).toBeCloseTo(0, 5);
      expect(result.points[0].y).toBeCloseTo(5, 5);
      expect(result.points[1].x).toBeCloseTo(0, 5);
      expect(result.points[1].y).toBeCloseTo(11, 5);
      expect(result.points[2].x).toBeCloseTo(-6, 5);
      expect(result.points[2].y).toBeCloseTo(8, 5);
    });
  });
});