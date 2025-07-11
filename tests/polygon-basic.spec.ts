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
});
