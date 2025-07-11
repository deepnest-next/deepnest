import { test, expect } from '@playwright/test';
import { SvgParser } from '../build/svgparser.js';

// Mock DOMParser for testing
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (typeof DOMParser === 'undefined') {
      (globalThis as any).DOMParser = class MockDOMParser {
        parseFromString(str: string, type: string): Document {
          // Create a mock SVG element with dynamic attributes
          const attributes = new Map<string, string>();
          
          // Parse width attribute
          const widthMatch = str.match(/width="([^"]+)"/);
          if (widthMatch) attributes.set('width', widthMatch[1]);
          
          // Parse viewBox attribute
          const viewBoxMatch = str.match(/viewBox="([^"]+)"/);
          if (viewBoxMatch) attributes.set('viewBox', viewBoxMatch[1]);
          
          // Parse transform attribute
          const transformMatch = str.match(/transform="([^"]+)"/);
          if (transformMatch) attributes.set('transform', transformMatch[1]);
          
          const mockElement = {
            getAttribute: (name: string) => attributes.get(name) || null,
            setAttribute: (name: string, value: string) => {
              attributes.set(name, value);
            }
          };
          
          const doc = {
            documentElement: {
              nodeName: 'svg',
              firstElementChild: mockElement
            }
          };
          
          return doc as any;
        }
      };
    }
  });
});

test.describe('SvgParser', () => {
  test.describe('Constructor', () => {
    test('creates instance with default configuration', () => {
      const parser = new SvgParser();
      expect(parser).toBeDefined();
      
      // Test default configuration values through config method
      const originalTolerance = (parser as any).conf.tolerance;
      const originalEndpointTolerance = (parser as any).conf.endpointTolerance;
      
      expect(originalTolerance).toBe(2);
      expect(originalEndpointTolerance).toBe(2);
    });

    test('initializes with correct default values', () => {
      const parser = new SvgParser();
      const config = (parser as any).conf;
      
      expect(config.tolerance).toBe(2);
      expect(config.toleranceSvg).toBe(0.01);
      expect(config.scale).toBe(72);
      expect(config.endpointTolerance).toBe(2);
    });

    test('initializes svg and svgRoot as undefined', () => {
      const parser = new SvgParser();
      expect(parser.document).toBeUndefined();
      expect(parser.root).toBeUndefined();
    });

    test('initializes dirPath as null', () => {
      const parser = new SvgParser();
      expect(parser.directoryPath).toBe(null);
    });
  });

  test.describe('Configuration', () => {
    test('updates tolerance correctly', () => {
      const parser = new SvgParser();
      parser.config({ tolerance: 5 });
      
      const config = (parser as any).conf;
      expect(config.tolerance).toBe(5);
    });

    test('updates endpointTolerance correctly', () => {
      const parser = new SvgParser();
      parser.config({ endpointTolerance: 10 });
      
      const config = (parser as any).conf;
      expect(config.endpointTolerance).toBe(10);
    });

    test('updates both tolerance and endpointTolerance', () => {
      const parser = new SvgParser();
      parser.config({ tolerance: 3, endpointTolerance: 7 });
      
      const config = (parser as any).conf;
      expect(config.tolerance).toBe(3);
      expect(config.endpointTolerance).toBe(7);
    });

    test('converts string values to numbers', () => {
      const parser = new SvgParser();
      parser.config({ 
        tolerance: '4.5' as any, 
        endpointTolerance: '8.2' as any 
      });
      
      const config = (parser as any).conf;
      expect(config.tolerance).toBe(4.5);
      expect(config.endpointTolerance).toBe(8.2);
    });

    test('handles partial configuration updates', () => {
      const parser = new SvgParser();
      const originalTolerance = (parser as any).conf.tolerance;
      
      parser.config({ endpointTolerance: 15 });
      
      const config = (parser as any).conf;
      expect(config.tolerance).toBe(originalTolerance); // unchanged
      expect(config.endpointTolerance).toBe(15); // updated
    });

    test('handles empty configuration object', () => {
      const parser = new SvgParser();
      const originalConfig = { ...(parser as any).conf };
      
      parser.config({});
      
      const config = (parser as any).conf;
      expect(config).toEqual(originalConfig);
    });

    test('handles undefined values gracefully', () => {
      const parser = new SvgParser();
      const originalConfig = { ...(parser as any).conf };
      
      parser.config({ tolerance: undefined, endpointTolerance: undefined });
      
      const config = (parser as any).conf;
      expect(config).toEqual(originalConfig);
    });
  });

  test.describe('Load Method', () => {
    test('throws error for invalid SVG string', () => {
      const parser = new SvgParser();
      
      expect(() => parser.load(null, '', 72)).toThrow('invalid SVG string');
      expect(() => parser.load(null, null as any, 72)).toThrow('invalid SVG string');
      expect(() => parser.load(null, 123 as any, 72)).toThrow('invalid SVG string');
    });

    test('loads simple SVG with width and viewBox', () => {
      const parser = new SvgParser();
      const svgString = '<svg width="100mm" viewBox="0 0 100 100"><rect width="50" height="50"/></svg>';
      
      const result = parser.load('/test/path', svgString, 72);
      
      expect(result).toBeDefined();
      expect(parser.document).toBeDefined();
      expect(parser.root).toBeDefined();
      expect(parser.directoryPath).toBe('/test/path');
    });

    test('handles SVG without width or viewBox', () => {
      const parser = new SvgParser();
      const svgString = '<svg><rect width="50" height="50"/></svg>';
      
      const result = parser.load(null, svgString, 72);
      
      expect(result).toBeDefined();
      expect(parser.document).toBeDefined();
      expect(parser.root).toBeDefined();
    });

    test('applies scaling factor when no width/viewBox', () => {
      const parser = new SvgParser();
      const svgString = '<svg><rect width="50" height="50"/></svg>';
      const originalScale = (parser as any).conf.scale;
      
      parser.load(null, svgString, 72, 2);
      
      const newScale = (parser as any).conf.scale;
      expect(newScale).toBe(originalScale * 2);
    });

    test('handles Inkscape SVGs without xmlns', () => {
      const parser = new SvgParser();
      const svgString = '<svg xmlns="http://www.w3.org/2000/svg" inkscape:version="1.0"><rect width="50" height="50"/></svg>';
      
      const result = parser.load(null, svgString, 72);
      
      expect(result).toBeDefined();
    });

    test('converts millimeter units correctly', () => {
      const parser = new SvgParser();
      const svgString = '<svg width="100mm" viewBox="0 0 100 100"><rect width="50" height="50"/></svg>';
      
      parser.load(null, svgString, 72);
      
      const root = parser.root;
      expect(root).toBeDefined();
      expect(root!.getAttribute('transform')).toContain('scale(');
    });

    test('converts inch units correctly', () => {
      const parser = new SvgParser();
      const svgString = '<svg width="4in" viewBox="0 0 100 100"><rect width="50" height="50"/></svg>';
      
      parser.load(null, svgString, 72);
      
      const root = parser.root;
      expect(root).toBeDefined();
      expect(root!.getAttribute('transform')).toContain('scale(');
    });

    test('converts centimeter units correctly', () => {
      const parser = new SvgParser();
      const svgString = '<svg width="10cm" viewBox="0 0 100 100"><rect width="50" height="50"/></svg>';
      
      parser.load(null, svgString, 72);
      
      const root = parser.root;
      expect(root).toBeDefined();
      expect(root!.getAttribute('transform')).toContain('scale(');
    });

    test('converts point units correctly', () => {
      const parser = new SvgParser();
      const svgString = '<svg width="288pt" viewBox="0 0 100 100"><rect width="50" height="50"/></svg>';
      
      parser.load(null, svgString, 72);
      
      const root = parser.root;
      expect(root).toBeDefined();
      expect(root!.getAttribute('transform')).toContain('scale(');
    });

    test('converts pica units correctly', () => {
      const parser = new SvgParser();
      const svgString = '<svg width="24pc" viewBox="0 0 100 100"><rect width="50" height="50"/></svg>';
      
      parser.load(null, svgString, 72);
      
      const root = parser.root;
      expect(root).toBeDefined();
      expect(root!.getAttribute('transform')).toContain('scale(');
    });

    test('converts pixel units correctly', () => {
      const parser = new SvgParser();
      const svgString = '<svg width="384px" viewBox="0 0 100 100"><rect width="50" height="50"/></svg>';
      
      parser.load(null, svgString, 72);
      
      const root = parser.root;
      expect(root).toBeDefined();
      expect(root!.getAttribute('transform')).toContain('scale(');
    });

    test('handles invalid viewBox gracefully', () => {
      const parser = new SvgParser();
      const svgString = '<svg width="100mm" viewBox="0 0"><rect width="50" height="50"/></svg>';
      
      const result = parser.load(null, svgString, 72);
      
      expect(result).toBeDefined();
    });

    test('handles empty width gracefully', () => {
      const parser = new SvgParser();
      const svgString = '<svg width="" viewBox="0 0 100 100"><rect width="50" height="50"/></svg>';
      
      const result = parser.load(null, svgString, 72);
      
      expect(result).toBeDefined();
    });

    test('applies additional scaling factor correctly', () => {
      const parser = new SvgParser();
      const svgString = '<svg width="100mm" viewBox="0 0 100 100"><rect width="50" height="50"/></svg>';
      
      parser.load(null, svgString, 72, 1.5);
      
      const root = parser.root;
      expect(root).toBeDefined();
      expect(root!.getAttribute('transform')).toContain('scale(');
    });

    test('handles unrecognized units by using scaling factor', () => {
      const parser = new SvgParser();
      const svgString = '<svg width="100xyz" viewBox="0 0 100 100"><rect width="50" height="50"/></svg>';
      
      parser.load(null, svgString, 72, 2);
      
      const root = parser.root;
      expect(root).toBeDefined();
    });

    test('handles unrecognized units without scaling factor', () => {
      const parser = new SvgParser();
      const svgString = '<svg width="100xyz" viewBox="0 0 100 100"><rect width="50" height="50"/></svg>';
      
      const result = parser.load(null, svgString, 72);
      
      expect(result).toBeDefined();
      // Should return early when no scaling can be determined
    });

    test('preserves existing transform attribute', () => {
      const parser = new SvgParser();
      const svgString = '<svg width="100mm" viewBox="0 0 100 100" transform="rotate(45)"><rect width="50" height="50"/></svg>';
      
      parser.load(null, svgString, 72);
      
      const root = parser.root;
      expect(root).toBeDefined();
      const transform = root!.getAttribute('transform');
      expect(transform).toContain('rotate(45)');
      expect(transform).toContain('scale(');
    });
  });

  test.describe('calculateLocalScale Method', () => {
    test('calculates scale for millimeters correctly', () => {
      const parser = new SvgParser();
      const result = (parser as any).calculateLocalScale('100mm', 100);
      
      // Expected: (25.4 * 100) / 100 = 25.4
      expect(result).toBe(25.4);
    });

    test('calculates scale for inches correctly', () => {
      const parser = new SvgParser();
      const result = (parser as any).calculateLocalScale('4in', 100);
      
      // Expected: (1 * 100) / 4 = 25
      expect(result).toBe(25);
    });

    test('calculates scale for centimeters correctly', () => {
      const parser = new SvgParser();
      const result = (parser as any).calculateLocalScale('10cm', 100);
      
      // Expected: (2.54 * 100) / 10 = 25.4
      expect(result).toBe(25.4);
    });

    test('calculates scale for points correctly', () => {
      const parser = new SvgParser();
      const result = (parser as any).calculateLocalScale('288pt', 100);
      
      // Expected: (72 * 100) / 288 = 25
      expect(result).toBe(25);
    });

    test('calculates scale for picas correctly', () => {
      const parser = new SvgParser();
      const result = (parser as any).calculateLocalScale('24pc', 100);
      
      // Expected: (6 * 100) / 24 = 25
      expect(result).toBe(25);
    });

    test('calculates scale for pixels correctly', () => {
      const parser = new SvgParser();
      const result = (parser as any).calculateLocalScale('384px', 100);
      
      // Expected: (96 * 100) / 384 = 25
      expect(result).toBe(25);
    });

    test('returns null for unrecognized units', () => {
      const parser = new SvgParser();
      const result = (parser as any).calculateLocalScale('100xyz', 100);
      
      expect(result).toBe(null);
    });

    test('handles decimal values correctly', () => {
      const parser = new SvgParser();
      const result = (parser as any).calculateLocalScale('50.5mm', 100);
      
      // Expected: (25.4 * 100) / 50.5 ≈ 50.297
      expect(result).toBeCloseTo(50.297, 3);
    });
  });

  test.describe('Transform Processing Methods', () => {
    test.describe('transformParse Method', () => {
      test('parses transform string correctly', () => {
        const parser = new SvgParser();
        const result = (parser as any).transformParse('translate(10, 20) scale(2)');
        
        expect(result).toBeDefined();
        expect(typeof result.toArray).toBe('function');
      });

      test('handles empty transform string', () => {
        const parser = new SvgParser();
        const result = (parser as any).transformParse('');
        
        expect(result).toBeDefined();
        expect(result.isIdentity()).toBe(true);
      });
    });

    test.describe('applyTransform Method', () => {
      test('handles container elements recursively', () => {
        const parser = new SvgParser();
        const svgString = '<svg><g transform="translate(10, 20)"><rect width="50" height="50"/></g></svg>';
        
        parser.load(null, svgString, 72);
        const root = parser.root;
        
        if (root && root.firstElementChild) {
          parser.applyTransform(root.firstElementChild as SVGElement);
          
          // Group should have transform removed
          expect(root.firstElementChild.getAttribute('transform')).toBeNull();
        }
      });

      test('applies transform to line elements', () => {
        const parser = new SvgParser();
        const svgString = '<svg><line x1="0" y1="0" x2="10" y2="10" transform="translate(5, 5)"/></svg>';
        
        parser.load(null, svgString, 72);
        const root = parser.root;
        
        if (root && root.firstElementChild) {
          parser.applyTransform(root.firstElementChild as SVGElement);
          
          // Line coordinates should be transformed
          expect(root.firstElementChild.getAttribute('x1')).toBe('5');
          expect(root.firstElementChild.getAttribute('y1')).toBe('5');
          expect(root.firstElementChild.getAttribute('x2')).toBe('15');
          expect(root.firstElementChild.getAttribute('y2')).toBe('15');
          expect(root.firstElementChild.getAttribute('transform')).toBeNull();
        }
      });

      test('skips closed shapes when skipClosed is true', () => {
        const parser = new SvgParser();
        const svgString = '<svg><circle cx="50" cy="50" r="25" transform="translate(10, 10)"/></svg>';
        
        parser.load(null, svgString, 72);
        const root = parser.root;
        
        if (root && root.firstElementChild) {
          parser.applyTransform(root.firstElementChild as SVGElement, '', true);
          
          // Transform should be preserved when skipClosed is true
          expect(root.firstElementChild.getAttribute('transform')).toContain('translate(10, 10)');
        }
      });

      test('handles image elements by preserving transform', () => {
        const parser = new SvgParser();
        const svgString = '<svg><image href="test.png" transform="rotate(45)"/></svg>';
        
        parser.load(null, svgString, 72);
        const root = parser.root;
        
        if (root && root.firstElementChild) {
          parser.applyTransform(root.firstElementChild as SVGElement);
          
          // Image should keep transform attribute
          expect(root.firstElementChild.getAttribute('transform')).toContain('rotate(45)');
        }
      });

      test('handles DXF flag for arc processing', () => {
        const parser = new SvgParser();
        const svgString = '<svg><path d="M 0 0 A 10 10 0 0 1 20 0" transform="rotate(180)"/></svg>';
        
        parser.load(null, svgString, 72);
        const root = parser.root;
        
        if (root && root.firstElementChild) {
          // Test with DXF flag - should handle arc rotation differently
          parser.applyTransform(root.firstElementChild as SVGElement, '', false, true);
          
          // Transform should be removed after processing
          expect(root.firstElementChild.getAttribute('transform')).toBeNull();
        }
      });
    });

    test.describe('Element-Specific Transform Methods', () => {
      test('transformLine handles line transformation', () => {
        const parser = new SvgParser();
        const svgString = '<svg><line x1="0" y1="0" x2="10" y2="10"/></svg>';
        
        parser.load(null, svgString, 72);
        const root = parser.root;
        
        if (root && root.firstElementChild) {
          const matrix = (parser as any).transformParse('translate(5, 5)');
          (parser as any).transformLine(root.firstElementChild, matrix);
          
          expect(root.firstElementChild.getAttribute('x1')).toBe('5');
          expect(root.firstElementChild.getAttribute('y1')).toBe('5');
          expect(root.firstElementChild.getAttribute('x2')).toBe('15');
          expect(root.firstElementChild.getAttribute('y2')).toBe('15');
        }
      });

      test('transformEllipse converts to path', () => {
        const parser = new SvgParser();
        const svgString = '<svg><ellipse cx="50" cy="50" rx="25" ry="15"/></svg>';
        
        parser.load(null, svgString, 72);
        const root = parser.root;
        
        if (root && root.firstElementChild) {
          const matrix = (parser as any).transformParse('translate(10, 10)');
          (parser as any).transformEllipse(root.firstElementChild, matrix, 'translate(10, 10)', false);
          
          // Should be converted to path
          expect(root.firstElementChild.tagName).toBe('path');
          expect(root.firstElementChild.getAttribute('d')).toContain('M');
          expect(root.firstElementChild.getAttribute('d')).toContain('A');
        }
      });

      test('transformCircle converts to path', () => {
        const parser = new SvgParser();
        const svgString = '<svg><circle cx="50" cy="50" r="25"/></svg>';
        
        parser.load(null, svgString, 72);
        const root = parser.root;
        
        if (root && root.firstElementChild) {
          const matrix = (parser as any).transformParse('translate(10, 10)');
          (parser as any).transformCircle(root.firstElementChild, matrix, 'translate(10, 10)', false, 0, 1);
          
          // Should be converted to path
          expect(root.firstElementChild.tagName).toBe('path');
          expect(root.firstElementChild.getAttribute('d')).toContain('M');
          expect(root.firstElementChild.getAttribute('d')).toContain('A');
        }
      });

      test('transformRect converts to polygon', () => {
        const parser = new SvgParser();
        const svgString = '<svg><rect x="10" y="10" width="50" height="30"/></svg>';
        
        parser.load(null, svgString, 72);
        const root = parser.root;
        
        if (root && root.firstElementChild) {
          const matrix = (parser as any).transformParse('translate(5, 5)');
          (parser as any).transformRect(root.firstElementChild, matrix, 'translate(5, 5)', false);
          
          // Should be converted to polygon
          expect(root.firstElementChild.tagName).toBe('polygon');
        }
      });

      test('transformRect handles OnShape special case', () => {
        const parser = new SvgParser();
        const svgString = '<svg><rect x="0" y="0" width="50" height="30"/></svg>';
        
        parser.load(null, svgString, 72);
        const root = parser.root;
        
        if (root && root.firstElementChild) {
          const matrix = (parser as any).transformParse('translate(5, 5)');
          (parser as any).transformRect(root.firstElementChild, matrix, 'translate(5, 5)', false);
          
          // Should be converted to polygon but points should be empty for OnShape case
          expect(root.firstElementChild.tagName).toBe('polygon');
        }
      });

      test('transformPolygon transforms point coordinates', () => {
        const parser = new SvgParser();
        const svgString = '<svg><polygon points="0,0 10,0 10,10 0,10"/></svg>';
        
        parser.load(null, svgString, 72);
        const root = parser.root;
        
        if (root && root.firstElementChild) {
          const matrix = (parser as any).transformParse('translate(5, 5)');
          (parser as any).transformPolygon(root.firstElementChild, matrix, 'translate(5, 5)', false);
          
          // Points should be transformed
          expect(root.firstElementChild.getAttribute('transform')).toBeNull();
        }
      });

      test('handles skipClosed for polygon elements', () => {
        const parser = new SvgParser();
        const svgString = '<svg><polygon points="0,0 10,0 10,10 0,10" transform="translate(5, 5)"/></svg>';
        
        parser.load(null, svgString, 72);
        const root = parser.root;
        
        if (root && root.firstElementChild) {
          const matrix = (parser as any).transformParse('translate(5, 5)');
          (parser as any).transformPolygon(root.firstElementChild, matrix, 'translate(5, 5)', true);
          
          // Should preserve transform when skipClosed is true
          expect(root.firstElementChild.getAttribute('transform')).toContain('translate(5, 5)');
        }
      });
    });

    test.describe('Transform Matrix Operations', () => {
      test('decomposes transformation matrix correctly', () => {
        const parser = new SvgParser();
        const svgString = '<svg><rect x="0" y="0" width="10" height="10" transform="rotate(45) scale(2)"/></svg>';
        
        parser.load(null, svgString, 72);
        const root = parser.root;
        
        if (root && root.firstElementChild) {
          // Test that matrix decomposition works without errors
          parser.applyTransform(root.firstElementChild as SVGElement);
          
          // Should complete without throwing errors
          expect(root.firstElementChild.getAttribute('transform')).toBeNull();
        }
      });

      test('handles identity transform correctly', () => {
        const parser = new SvgParser();
        const svgString = '<svg><rect x="0" y="0" width="10" height="10"/></svg>';
        
        parser.load(null, svgString, 72);
        const root = parser.root;
        
        if (root && root.firstElementChild) {
          parser.applyTransform(root.firstElementChild as SVGElement);
          
          // Should not modify element without transform
          expect(root.firstElementChild.tagName).toBe('rect');
        }
      });

      test('combines global and local transforms', () => {
        const parser = new SvgParser();
        const svgString = '<svg><rect x="0" y="0" width="10" height="10" transform="translate(5, 5)"/></svg>';
        
        parser.load(null, svgString, 72);
        const root = parser.root;
        
        if (root && root.firstElementChild) {
          parser.applyTransform(root.firstElementChild as SVGElement, 'scale(2)');
          
          // Should combine both transforms
          expect(root.firstElementChild.getAttribute('transform')).toBeNull();
        }
      });
    });

    test.describe('Error Handling', () => {
      test('handles elements without required attributes', () => {
        const parser = new SvgParser();
        const svgString = '<svg><line/></svg>';
        
        parser.load(null, svgString, 72);
        const root = parser.root;
        
        if (root && root.firstElementChild) {
          const matrix = (parser as any).transformParse('translate(5, 5)');
          
          // Should not throw error for line without coordinates
          expect(() => {
            (parser as any).transformLine(root.firstElementChild, matrix);
          }).not.toThrow();
        }
      });

      test('handles malformed transform strings', () => {
        const parser = new SvgParser();
        
        // Should not throw error for malformed transform
        expect(() => {
          (parser as any).transformParse('invalid transform string');
        }).not.toThrow();
      });
    });
  });
});