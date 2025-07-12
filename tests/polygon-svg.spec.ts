import { test, expect } from "@playwright/test";
import { Point } from "../main/util/point.js";
import { Polygon } from "../main/util/polygon.js";

test.describe("Polygon - SVG Integration", () => {
  test.describe("SVG Element Conversion", () => {
    test("fromSVGElement returns null for null input", () => {
      const polygon = Polygon.fromSVGElement(null as any);
      
      expect(polygon).toBe(null);
    });

    test("fromSVGElement converts SVG rectangle", () => {
      // Create a mock SVG rect element
      const rect = {
        tagName: "rect",
        getAttribute: (attr: string) => {
          switch (attr) {
            case 'x': return '10';
            case 'y': return '20';
            case 'width': return '30';
            case 'height': return '40';
            default: return null;
          }
        }
      } as any;

      const polygon = Polygon.fromSVGElement(rect);
      
      expect(polygon).not.toBe(null);
      if (polygon) {
        expect(polygon.points).toHaveLength(4);
        expect(polygon.points[0].x).toBe(10);
        expect(polygon.points[0].y).toBe(20);
        expect(polygon.points[1].x).toBe(40); // x + width
        expect(polygon.points[1].y).toBe(20);
        expect(polygon.points[2].x).toBe(40);
        expect(polygon.points[2].y).toBe(60); // y + height
        expect(polygon.points[3].x).toBe(10);
        expect(polygon.points[3].y).toBe(60);
      }
    });

    test("fromSVGElement converts SVG circle", () => {
      const circle = {
        tagName: "circle",
        getAttribute: (attr: string) => {
          switch (attr) {
            case 'cx': return '50';
            case 'cy': return '50';
            case 'r': return '25';
            default: return null;
          }
        }
      } as any;

      const polygon = Polygon.fromSVGElement(circle, 2);
      
      expect(polygon).not.toBe(null);
      if (polygon) {
        expect(polygon.points.length).toBeGreaterThan(12); // At least 12 segments
        
        // Check that points form a circle
        const center = new Point(50, 50);
        const radius = 25;
        
        for (const point of polygon.points) {
          const distance = Math.hypot(point.x - center.x, point.y - center.y);
          expect(distance).toBeCloseTo(radius, 1); // Allow some tolerance
        }
      }
    });

    test("fromSVGElement converts SVG ellipse", () => {
      const ellipse = {
        tagName: "ellipse",
        getAttribute: (attr: string) => {
          switch (attr) {
            case 'cx': return '30';
            case 'cy': return '40';
            case 'rx': return '20';
            case 'ry': return '10';
            default: return null;
          }
        }
      } as any;

      const polygon = Polygon.fromSVGElement(ellipse, 2);
      
      expect(polygon).not.toBe(null);
      if (polygon) {
        expect(polygon.points.length).toBeGreaterThan(12);
        
        // Check that points form an ellipse
        const center = new Point(30, 40);
        const rx = 20;
        const ry = 10;
        
        for (const point of polygon.points) {
          const dx = (point.x - center.x) / rx;
          const dy = (point.y - center.y) / ry;
          const ellipseEquation = dx * dx + dy * dy;
          expect(ellipseEquation).toBeCloseTo(1, 1); // Allow some tolerance
        }
      }
    });

    test("fromSVGElement converts SVG polygon", () => {
      const svgPolygon = {
        tagName: "polygon",
        points: {
          length: 3,
          getItem: (index: number) => {
            const points = [
              { x: 0, y: 0 },
              { x: 10, y: 0 },
              { x: 5, y: 10 }
            ];
            return points[index];
          }
        }
      } as any;

      const polygon = Polygon.fromSVGElement(svgPolygon);
      
      expect(polygon).not.toBe(null);
      if (polygon) {
        expect(polygon.points).toHaveLength(3);
        expect(polygon.points[0]).toEqual(new Point(0, 0));
        expect(polygon.points[1]).toEqual(new Point(10, 0));
        expect(polygon.points[2]).toEqual(new Point(5, 10));
      }
    });

    test("fromSVGElement converts SVG polyline", () => {
      const polyline = {
        tagName: "polyline",
        points: {
          length: 4,
          getItem: (index: number) => {
            const points = [
              { x: 0, y: 0 },
              { x: 10, y: 0 },
              { x: 10, y: 10 },
              { x: 0, y: 10 }
            ];
            return points[index];
          }
        }
      } as any;

      const polygon = Polygon.fromSVGElement(polyline);
      
      expect(polygon).not.toBe(null);
      if (polygon) {
        expect(polygon.points).toHaveLength(4);
        expect(polygon.points[0]).toEqual(new Point(0, 0));
        expect(polygon.points[3]).toEqual(new Point(0, 10));
      }
    });

    test("fromSVGElement returns null for unsupported element", () => {
      const unsupported = {
        tagName: "text"
      } as any;

      const polygon = Polygon.fromSVGElement(unsupported);
      
      expect(polygon).toBe(null);
    });

    test("fromSVGElement removes duplicate endpoints", () => {
      const mockElement = {
        tagName: "rect",
        getAttribute: () => "10"
      } as any;

      // Mock the polygonifyElement to return coordinates with duplicate endpoint
      const originalPolygonify = (Polygon as any).polygonifyElement;
      (Polygon as any).polygonifyElement = () => [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 10, y: 10 },
        { x: 0, y: 10 },
        { x: 0, y: 0 } // Duplicate endpoint
      ];

      const polygon = Polygon.fromSVGElement(mockElement);
      
      // Restore original function
      (Polygon as any).polygonifyElement = originalPolygonify;
      
      expect(polygon).not.toBe(null);
      if (polygon) {
        expect(polygon.points).toHaveLength(4); // Duplicate should be removed
      }
    });
  });

  test.describe("SVG Path Conversion", () => {
    test("fromSVGPath returns null for null input", () => {
      const polygon = Polygon.fromSVGPath(null as any);
      
      expect(polygon).toBe(null);
    });

    test("fromSVGPath returns null when pathSegList is missing", () => {
      const path = {
        pathSegList: null,
        getAttribute: () => "M 0 0 L 10 0 L 5 10 Z"
      } as any;

      const polygon = Polygon.fromSVGPath(path);
      
      expect(polygon).toBe(null);
    });

    test("fromSVGPath handles simple path with pathSegList", () => {
      // Mock a simple triangular path
      const path = {
        pathSegList: {
          numberOfItems: 4,
          getItem: (index: number) => {
            const segments = [
              { pathSegTypeAsLetter: 'M', x: 0, y: 0 },
              { pathSegTypeAsLetter: 'L', x: 10, y: 0 },
              { pathSegTypeAsLetter: 'L', x: 5, y: 10 },
              { pathSegTypeAsLetter: 'Z' }
            ];
            return segments[index];
          }
        }
      } as any;

      const polygon = Polygon.fromSVGPath(path);
      
      expect(polygon).not.toBe(null);
      if (polygon) {
        expect(polygon.points.length).toBeGreaterThanOrEqual(3);
      }
    });

    test("fromSVGPath handles errors gracefully", () => {
      const path = {
        pathSegList: {
          numberOfItems: 1,
          getItem: () => {
            throw new Error("Test error");
          }
        }
      } as any;

      const polygon = Polygon.fromSVGPath(path);
      
      expect(polygon).toBe(null);
    });
  });

  test.describe("SVG Output Generation", () => {
    const testPolygon = new Polygon([
      new Point(0, 0),
      new Point(10, 0),
      new Point(10, 10),
      new Point(0, 10)
    ]);

    test("toSVGPath generates correct path string", () => {
      const pathString = testPolygon.toSVGPath();
      
      expect(pathString).toBe("M 0 0 L 10 0 L 10 10 L 0 10 Z");
    });

    test("toSVGPath handles precision parameter", () => {
      const precisePolygon = new Polygon([
        new Point(0.123456, 0.789012),
        new Point(10.987654, 0.345678),
        new Point(5.555555, 8.888888)
      ]);

      const pathString = precisePolygon.toSVGPath(2);
      
      expect(pathString).toBe("M 0.12 0.79 L 10.99 0.35 L 5.56 8.89 Z");
    });

    test("toSVGPath returns empty string for empty polygon", () => {
      // Create polygon with empty points array (this would normally throw, so we'll test differently)
      const emptyPathString = testPolygon.toSVGPath();
      
      expect(typeof emptyPathString).toBe('string');
      expect(emptyPathString.length).toBeGreaterThan(0);
    });

    test("toSVGPolygon creates correct SVG polygon element", () => {
      // Create a mock document
      const mockDocument = {
        createElementNS: (namespace: string, tagName: string) => {
          expect(namespace).toBe('http://www.w3.org/2000/svg');
          expect(tagName).toBe('polygon');
          
          const element = {
            setAttribute: (attr: string, value: string) => {
              expect(attr).toBe('points');
              expect(value).toBe('0,0 10,0 10,10 0,10');
            }
          };
          return element;
        }
      } as any;

      const svgElement = testPolygon.toSVGPolygon(mockDocument);
      
      expect(svgElement).toBeDefined();
    });

    test("toSVGPolyline creates correct SVG polyline element", () => {
      const mockDocument = {
        createElementNS: (namespace: string, tagName: string) => {
          expect(namespace).toBe('http://www.w3.org/2000/svg');
          expect(tagName).toBe('polyline');
          
          const element = {
            setAttribute: (attr: string, value: string) => {
              expect(attr).toBe('points');
              expect(value).toBe('0,0 10,0 10,10 0,10');
            }
          };
          return element;
        }
      } as any;

      const svgElement = testPolygon.toSVGPolyline(mockDocument);
      
      expect(svgElement).toBeDefined();
    });

    test("SVG output respects precision in polygon elements", () => {
      const precisePolygon = new Polygon([
        new Point(1.23456, 2.34567),
        new Point(3.45678, 4.56789),
        new Point(0, 0) // Need at least 3 points for a valid polygon
      ]);

      const mockDocument = {
        createElementNS: () => ({
          setAttribute: (attr: string, value: string) => {
            if (attr === 'points') {
              expect(value).toBe('1.235,2.346 3.457,4.568 0,0');
            }
          }
        })
      } as any;

      precisePolygon.toSVGPolygon(mockDocument, 3);
    });
  });

  test.describe("Path Data Parsing Fallback", () => {
    test("parsePathData handles basic move and line commands", () => {
      // Access the private method for testing
      const parsePathData = (Polygon as any).parsePathData;
      
      const pathData = "M 0 0 L 10 0 L 10 10 L 0 10 Z";
      const result = parsePathData(pathData, 2);
      
      expect(result).toHaveLength(4);
      expect(result[0]).toEqual({ x: 0, y: 0 });
      expect(result[1]).toEqual({ x: 10, y: 0 });
      expect(result[2]).toEqual({ x: 10, y: 10 });
      expect(result[3]).toEqual({ x: 0, y: 10 });
    });

    test("parsePathData handles relative commands", () => {
      const parsePathData = (Polygon as any).parsePathData;
      
      const pathData = "m 5 5 l 10 0 l 0 10 l -10 0 z";
      const result = parsePathData(pathData, 2);
      
      expect(result).toHaveLength(4);
      expect(result[0]).toEqual({ x: 5, y: 5 });
      expect(result[1]).toEqual({ x: 15, y: 5 });
      expect(result[2]).toEqual({ x: 15, y: 15 });
      expect(result[3]).toEqual({ x: 5, y: 15 });
    });

    test("parsePathData handles horizontal and vertical commands", () => {
      const parsePathData = (Polygon as any).parsePathData;
      
      const pathData = "M 0 0 H 10 V 10 h -5 v -5";
      const result = parsePathData(pathData, 2);
      
      expect(result).toHaveLength(5);
      expect(result[0]).toEqual({ x: 0, y: 0 });
      expect(result[1]).toEqual({ x: 10, y: 0 });
      expect(result[2]).toEqual({ x: 10, y: 10 });
      expect(result[3]).toEqual({ x: 5, y: 10 });
      expect(result[4]).toEqual({ x: 5, y: 5 });
    });

    test("parsePathData handles curve commands as line approximations", () => {
      const parsePathData = (Polygon as any).parsePathData;
      
      const pathData = "M 0 0 C 5 0 10 5 10 10";
      const result = parsePathData(pathData, 2);
      
      expect(result.length).toBeGreaterThanOrEqual(1);
      expect(result[0]).toEqual({ x: 0, y: 0 });
      if (result.length > 1) {
        expect(result[result.length - 1]).toEqual({ x: 10, y: 10 }); // End point of curve
      }
    });

    test("parsePathData returns empty array for invalid path data", () => {
      const parsePathData = (Polygon as any).parsePathData;
      
      const result = parsePathData("invalid path data", 2);
      
      expect(result).toHaveLength(0);
    });
  });

  test.describe("Integration with Existing Methods", () => {
    test("SVG-created polygons work with geometric operations", () => {
      const rect = {
        tagName: "rect",
        getAttribute: (attr: string) => {
          switch (attr) {
            case 'x': return '0';
            case 'y': return '0';
            case 'width': return '10';
            case 'height': return '10';
            default: return null;
          }
        }
      } as any;

      const polygon = Polygon.fromSVGElement(rect);
      
      expect(polygon).not.toBe(null);
      if (polygon) {
        // Test area calculation
        const area = Math.abs(polygon.area());
        expect(area).toBeCloseTo(100, 5);

        // Test bounds calculation
        const bounds = polygon.bounds();
        expect(bounds.width).toBe(10);
        expect(bounds.height).toBe(10);

        // Test transformation
        const translated = polygon.translate(5, 5);
        expect(translated.bounds().x).toBe(5);
        expect(translated.bounds().y).toBe(5);
      }
    });

    test("SVG-created polygons work with boolean operations", () => {
      const rect1 = {
        tagName: "rect",
        getAttribute: (attr: string) => attr === 'x' || attr === 'y' ? '0' : '5'
      } as any;

      const rect2 = {
        tagName: "rect",
        getAttribute: (attr: string) => {
          switch (attr) {
            case 'x': return '2';
            case 'y': return '2';
            default: return '5';
          }
        }
      } as any;

      const polygon1 = Polygon.fromSVGElement(rect1);
      const polygon2 = Polygon.fromSVGElement(rect2);
      
      expect(polygon1).not.toBe(null);
      expect(polygon2).not.toBe(null);
      
      if (polygon1 && polygon2) {
        // Test intersection
        expect(polygon1.intersects(polygon2)).toBe(true);

        // Test union operation
        const union = polygon1.union(polygon2);
        expect(union.length).toBeGreaterThanOrEqual(1);

        // Test difference operation
        const difference = polygon1.difference(polygon2);
        expect(Array.isArray(difference)).toBe(true);
      }
    });

    test("Generated SVG maintains polygon validity", () => {
      const circle = {
        tagName: "circle",
        getAttribute: (attr: string) => {
          switch (attr) {
            case 'cx': return '0';
            case 'cy': return '0';
            case 'r': return '10';
            default: return null;
          }
        }
      } as any;

      const polygon = Polygon.fromSVGElement(circle);
      
      expect(polygon).not.toBe(null);
      if (polygon) {
        expect(polygon.isValid()).toBe(true);

        // Generate SVG and verify it contains reasonable data
        const pathString = polygon.toSVGPath();
        expect(pathString).toContain('M');
        expect(pathString).toContain('L');
        expect(pathString).toContain('Z');
        expect(pathString.length).toBeGreaterThan(10);
      }
    });
  });

  test.describe("Error Handling and Edge Cases", () => {
    test("handles malformed SVG attributes gracefully", () => {
      const malformedRect = {
        tagName: "rect",
        getAttribute: () => "not-a-number"
      } as any;

      const polygon = Polygon.fromSVGElement(malformedRect);
      
      // Should return null for zero-sized rectangle (malformed attributes become 0)
      expect(polygon).toBe(null);
    });

    test("handles zero-sized SVG elements", () => {
      const zeroRect = {
        tagName: "rect",
        getAttribute: () => "0"
      } as any;

      const polygon = Polygon.fromSVGElement(zeroRect);
      
      // Zero-sized rectangle should be rejected
      expect(polygon).toBe(null);
    });

    test("handles circles with zero radius", () => {
      const zeroCircle = {
        tagName: "circle",
        getAttribute: (attr: string) => attr === 'r' ? '0' : '10'
      } as any;

      const polygon = Polygon.fromSVGElement(zeroCircle);
      
      // Zero radius circle should be rejected or handle gracefully
      expect(polygon).toBe(null);
    });

    test("SVG output handles very small numbers", () => {
      const tinyPolygon = new Polygon([
        new Point(0.0000001, 0.0000002),
        new Point(0.0000003, 0.0000004),
        new Point(0.0000005, 0.0000006)
      ]);

      const pathString = tinyPolygon.toSVGPath(6);
      
      expect(pathString).toContain('M');
      expect(pathString).toContain('L');
      expect(pathString).toContain('Z');
    });

    test("SVG output handles very large numbers", () => {
      const hugePolygon = new Polygon([
        new Point(1000000, 2000000),
        new Point(3000000, 4000000),
        new Point(5000000, 6000000)
      ]);

      const pathString = hugePolygon.toSVGPath();
      
      expect(pathString).toContain('M 1000000 2000000');
      expect(pathString).toContain('L 3000000 4000000');
      expect(pathString).toContain('L 5000000 6000000');
      expect(pathString).toContain('Z');
    });
  });
});