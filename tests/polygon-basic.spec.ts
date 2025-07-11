import { test, expect } from "@playwright/test";
import { Point } from "../main/util/point.js";
import { Polygon } from "../main/util/polygon.js";

test.describe("Polygon - Basic Functionality", () => {
  const squarePoints = [
    new Point(0, 0),
    new Point(10, 0),
    new Point(10, 10),
    new Point(0, 10),
  ];

  const trianglePoints = [new Point(0, 0), new Point(5, 0), new Point(2.5, 5)];

  test.describe("Constructor", () => {
    test("creates polygon with valid points", () => {
      const polygon = new Polygon(squarePoints);
      expect(polygon.points).toHaveLength(4);
      expect(polygon.points[0].x).toBe(0);
      expect(polygon.points[0].y).toBe(0);
    });

    test("throws error for less than 3 points", () => {
      const twoPoints = [new Point(0, 0), new Point(1, 1)];
      expect(() => new Polygon(twoPoints)).toThrow(
        "Polygon must have at least 3 points",
      );
    });

    test("creates deep copy of input points", () => {
      const originalPoints = [
        new Point(0, 0),
        new Point(1, 0),
        new Point(0, 1),
      ];
      const polygon = new Polygon(originalPoints);

      // Modify original point
      originalPoints[0].x = 999;

      // Polygon should not be affected
      expect(polygon.points[0].x).toBe(0);
    });
  });

  test.describe("Static Factory Methods", () => {
    test("fromArray creates polygon from coordinate objects", () => {
      const coords = [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 10, y: 10 },
        { x: 0, y: 10 },
      ];

      const polygon = Polygon.fromArray(coords);
      expect(polygon.points).toHaveLength(4);
      expect(polygon.points[0]).toBeInstanceOf(Point);
      expect(polygon.points[1].x).toBe(10);
    });
  });

  test.describe("Conversion Methods", () => {
    test("toArray converts to coordinate objects", () => {
      const polygon = new Polygon(trianglePoints);
      const coords = polygon.toArray();

      expect(coords).toHaveLength(3);
      expect(coords[0]).toEqual({ x: 0, y: 0 });
      expect(coords[1]).toEqual({ x: 5, y: 0 });
      expect(coords[2]).toEqual({ x: 2.5, y: 5 });
    });
  });

  test.describe("Clone Method", () => {
    test("creates deep copy of polygon", () => {
      const polygon = new Polygon(squarePoints);
      const cloned = polygon.clone();

      expect(cloned).not.toBe(polygon);
      expect(cloned.points).toHaveLength(polygon.points.length);
      expect(cloned.points[0]).not.toBe(polygon.points[0]); // Different object
      expect(cloned.points[0].x).toBe(polygon.points[0].x); // Same values
    });

    test("clones children polygons", () => {
      const parent = new Polygon(squarePoints);
      const child = new Polygon(trianglePoints);
      parent.children = [child];

      const cloned = parent.clone();

      expect(cloned.children).toHaveLength(1);
      expect(cloned.children![0]).not.toBe(child); // Different object
      expect(cloned.children![0].points).toHaveLength(3); // Same structure
    });
  });

  test.describe("Validation", () => {
    test("isValid returns true for proper polygon", () => {
      const polygon = new Polygon(squarePoints);
      expect(polygon.isValid()).toBe(true);
    });

    test("isValid returns true for triangle", () => {
      const polygon = new Polygon(trianglePoints);
      expect(polygon.isValid()).toBe(true);
    });

    test("isValid returns false for collinear points", () => {
      const collinearPoints = [
        new Point(0, 0),
        new Point(1, 0),
        new Point(2, 0),
        new Point(3, 0),
      ];

      const polygon = new Polygon(collinearPoints);
      expect(polygon.isValid()).toBe(false);
    });
  });

  test.describe("Properties", () => {
    test("length returns number of vertices", () => {
      const square = new Polygon(squarePoints);
      const triangle = new Polygon(trianglePoints);

      expect(square.length).toBe(4);
      expect(triangle.length).toBe(3);
    });
  });

  test.describe("String Representation", () => {
    test("toString returns readable format", () => {
      const triangle = new Polygon(trianglePoints);
      const str = triangle.toString();

      expect(str).toContain("Polygon");
      expect(str).toContain("0.0, 0.0");
      expect(str).toContain("5.0, 0.0");
      expect(str).toContain("2.5, 5.0");
    });
  });

  test.describe("Geometric Properties", () => {
    test("area calculates correct area for square", () => {
      const square = new Polygon(squarePoints);
      const area = square.area();
      
      expect(Math.abs(area)).toBe(100); // 10x10 square, absolute area
      expect(area).toBe(-100); // Clockwise winding gives negative area
    });

    test("area calculates correct area for triangle", () => {
      const triangle = new Polygon(trianglePoints);
      const area = triangle.area();
      
      expect(Math.abs(area)).toBe(12.5); // base=5, height=5, area=12.5
      expect(area).toBe(-12.5); // Clockwise winding gives negative area
    });

    test("area returns cached value on subsequent calls", () => {
      const square = new Polygon(squarePoints);
      const area1 = square.area();
      const area2 = square.area();
      
      expect(area1).toBe(area2);
      expect(area1).toBe(-100); // Clockwise winding
    });

    test("bounds calculates correct bounding box for square", () => {
      const square = new Polygon(squarePoints);
      const bounds = square.bounds();
      
      expect(bounds.x).toBe(0);
      expect(bounds.y).toBe(0);
      expect(bounds.width).toBe(10);
      expect(bounds.height).toBe(10);
    });

    test("bounds calculates correct bounding box for triangle", () => {
      const triangle = new Polygon(trianglePoints);
      const bounds = triangle.bounds();
      
      expect(bounds.x).toBe(0);
      expect(bounds.y).toBe(0);
      expect(bounds.width).toBe(5);
      expect(bounds.height).toBe(5);
    });

    test("bounds returns cached value on subsequent calls", () => {
      const square = new Polygon(squarePoints);
      const bounds1 = square.bounds();
      const bounds2 = square.bounds();
      
      expect(bounds1).toBe(bounds2); // Same object reference (cached)
      expect(bounds1.width).toBe(10);
    });

    test("centroid calculates correct center for square", () => {
      const square = new Polygon(squarePoints);
      const centroid = square.centroid();
      
      expect(centroid.x).toBeCloseTo(5, 5);
      expect(centroid.y).toBeCloseTo(5, 5);
    });

    test("centroid calculates correct center for triangle", () => {
      const triangle = new Polygon(trianglePoints);
      const centroid = triangle.centroid();
      
      // Triangle centroid should be at (2.5, 5/3)
      expect(centroid.x).toBeCloseTo(2.5, 5);
      expect(centroid.y).toBeCloseTo(5/3, 5);
    });

    test("perimeter calculates correct perimeter for square", () => {
      const square = new Polygon(squarePoints);
      const perimeter = square.perimeter();
      
      expect(perimeter).toBe(40); // 4 sides of 10 each
    });

    test("perimeter calculates correct perimeter for triangle", () => {
      const triangle = new Polygon(trianglePoints);
      const perimeter = triangle.perimeter();
      
      // Base=5, two sides of length sqrt((2.5^2 + 5^2)) = sqrt(31.25) ≈ 5.59
      const sideLength = Math.sqrt(2.5 * 2.5 + 5 * 5);
      const expectedPerimeter = 5 + 2 * sideLength;
      
      expect(perimeter).toBeCloseTo(expectedPerimeter, 5);
    });

    test("perimeter returns cached value on subsequent calls", () => {
      const square = new Polygon(squarePoints);
      const perimeter1 = square.perimeter();
      const perimeter2 = square.perimeter();
      
      expect(perimeter1).toBe(perimeter2);
      expect(perimeter1).toBe(40);
    });
  });
});
