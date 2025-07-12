import { test, expect } from "@playwright/test";
import { Point } from "../main/util/point.js";
import { Polygon } from "../main/util/polygon.js";

test.describe("Polygon - Point Containment and Intersection", () => {
  const squarePoints = [
    new Point(0, 0),
    new Point(10, 0),
    new Point(10, 10),
    new Point(0, 10),
  ];

  const trianglePoints = [new Point(0, 0), new Point(5, 0), new Point(2.5, 5)];

  const smallSquarePoints = [
    new Point(2, 2),
    new Point(4, 2),
    new Point(4, 4),
    new Point(2, 4),
  ];

  const overlappingSquarePoints = [
    new Point(5, 5),
    new Point(15, 5),
    new Point(15, 15),
    new Point(5, 15),
  ];

  const separateSquarePoints = [
    new Point(20, 20),
    new Point(25, 20),
    new Point(25, 25),
    new Point(20, 25),
  ];

  test.describe("Point Containment", () => {
    test("contains returns true for point inside square", () => {
      const square = new Polygon(squarePoints);
      const insidePoint = new Point(5, 5);
      
      expect(square.contains(insidePoint)).toBe(true);
    });

    test("contains returns false for point outside square", () => {
      const square = new Polygon(squarePoints);
      const outsidePoint = new Point(15, 15);
      
      expect(square.contains(outsidePoint)).toBe(false);
    });

    test("contains returns null for point on vertex", () => {
      const square = new Polygon(squarePoints);
      const vertexPoint = new Point(0, 0);
      
      expect(square.contains(vertexPoint)).toBe(null);
    });

    test("contains returns true for point inside triangle", () => {
      const triangle = new Polygon(trianglePoints);
      const insidePoint = new Point(2.5, 2);
      
      expect(triangle.contains(insidePoint)).toBe(true);
    });

    test("contains returns false for point outside triangle", () => {
      const triangle = new Polygon(trianglePoints);
      const outsidePoint = new Point(10, 10);
      
      expect(triangle.contains(outsidePoint)).toBe(false);
    });

    test("contains handles edge cases near polygon boundary", () => {
      const square = new Polygon(squarePoints);
      
      // Point very close to edge but inside
      const nearInsidePoint = new Point(0.001, 5);
      expect(square.contains(nearInsidePoint)).toBe(true);
      
      // Point very close to edge but outside  
      const nearOutsidePoint = new Point(-0.001, 5);
      expect(square.contains(nearOutsidePoint)).toBe(false);
    });

    test("contains respects tolerance parameter", () => {
      const square = new Polygon(squarePoints);
      const nearVertexPoint = new Point(1e-11, 1e-11);
      
      // With default tolerance (1e-10), should be null (on vertex)
      expect(square.contains(nearVertexPoint)).toBe(null);
      
      // With smaller tolerance, should be true (inside)
      expect(square.contains(nearVertexPoint, 1e-12)).toBe(true);
    });
  });

  test.describe("Polygon Intersection", () => {
    test("intersects returns true for overlapping polygons", () => {
      const square1 = new Polygon(squarePoints);
      const square2 = new Polygon(overlappingSquarePoints);
      
      expect(square1.intersects(square2)).toBe(true);
      expect(square2.intersects(square1)).toBe(true);
    });

    test("intersects returns false for separate polygons", () => {
      const square1 = new Polygon(squarePoints);
      const square2 = new Polygon(separateSquarePoints);
      
      expect(square1.intersects(square2)).toBe(false);
      expect(square2.intersects(square1)).toBe(false);
    });

    test("intersects returns true when one polygon is inside another", () => {
      const bigSquare = new Polygon(squarePoints);
      const smallSquare = new Polygon(smallSquarePoints);
      
      expect(bigSquare.intersects(smallSquare)).toBe(true);
      expect(smallSquare.intersects(bigSquare)).toBe(true);
    });

    test("intersects returns false for touching but non-overlapping polygons", () => {
      // Create two squares that touch at one edge
      const square1 = new Polygon(squarePoints);
      const touchingSquarePoints = [
        new Point(10, 0),
        new Point(20, 0),
        new Point(20, 10),
        new Point(10, 10),
      ];
      const square2 = new Polygon(touchingSquarePoints);
      
      // For this implementation, touching edges should not count as intersection
      expect(square1.intersects(square2)).toBe(false);
    });

    test("intersects handles triangles correctly", () => {
      const triangle1 = new Polygon(trianglePoints);
      const overlappingTrianglePoints = [
        new Point(1, 1),
        new Point(6, 1),
        new Point(3.5, 6),
      ];
      const triangle2 = new Polygon(overlappingTrianglePoints);
      
      expect(triangle1.intersects(triangle2)).toBe(true);
    });

    test("intersects early exit with bounding box check", () => {
      const square1 = new Polygon(squarePoints); // 0,0 to 10,10
      const farSquarePoints = [
        new Point(100, 100),
        new Point(110, 100),
        new Point(110, 110),
        new Point(100, 110),
      ];
      const square2 = new Polygon(farSquarePoints);
      
      // Should return false quickly due to bounding box check
      expect(square1.intersects(square2)).toBe(false);
    });
  });

  test.describe("Rectangle Detection", () => {
    test("isRectangle returns true for axis-aligned rectangle", () => {
      const square = new Polygon(squarePoints);
      expect(square.isRectangle()).toBe(true);
    });

    test("isRectangle returns true for non-square rectangle", () => {
      const rectanglePoints = [
        new Point(0, 0),
        new Point(20, 0),
        new Point(20, 10),
        new Point(0, 10),
      ];
      const rectangle = new Polygon(rectanglePoints);
      expect(rectangle.isRectangle()).toBe(true);
    });

    test("isRectangle returns false for triangle", () => {
      const triangle = new Polygon(trianglePoints);
      expect(triangle.isRectangle()).toBe(false);
    });

    test("isRectangle returns false for pentagon", () => {
      const pentagonPoints = [
        new Point(0, 0),
        new Point(10, 0),
        new Point(15, 8),
        new Point(5, 12),
        new Point(-5, 8),
      ];
      const pentagon = new Polygon(pentagonPoints);
      expect(pentagon.isRectangle()).toBe(false);
    });

    test("isRectangle returns false for rotated rectangle", () => {
      // 45-degree rotated square
      const rotatedSquarePoints = [
        new Point(5, 0),
        new Point(10, 5),
        new Point(5, 10),
        new Point(0, 5),
      ];
      const rotatedSquare = new Polygon(rotatedSquarePoints);
      expect(rotatedSquare.isRectangle()).toBe(false);
    });

    test("isRectangle respects tolerance parameter", () => {
      // Slightly distorted rectangle that should be considered rectangular with tolerance
      const almostRectanglePoints = [
        new Point(0.0001, 0),
        new Point(10, 0.0001),
        new Point(10, 10),
        new Point(0, 10),
      ];
      const almostRectangle = new Polygon(almostRectanglePoints);
      
      expect(almostRectangle.isRectangle(1e-6)).toBe(false); // Strict tolerance
      expect(almostRectangle.isRectangle(1e-3)).toBe(true);  // Loose tolerance
    });
  });
});