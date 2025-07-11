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

    test('initializes allowedElements correctly', () => {
      const parser = new SvgParser();
      const allowedElements = parser.allowedElementTypes;
      
      expect(allowedElements).toEqual(['svg', 'circle', 'ellipse', 'path', 'polygon', 'polyline', 'rect', 'image', 'line']);
    });

    test('initializes polygonElements correctly', () => {
      const parser = new SvgParser();
      const polygonElements = parser.polygonElementTypes;
      
      expect(polygonElements).toEqual(['svg', 'circle', 'ellipse', 'path', 'polygon', 'polyline', 'rect']);
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

  test.describe('Preprocessing Methods', () => {
    test.describe('cleanInput Method', () => {
      test('processes SVG through complete preprocessing pipeline', () => {
        const parser = new SvgParser();
        const svgString = '<svg><g transform="translate(10, 10)"><rect width="50" height="50"/><text>Remove me</text></g></svg>';
        
        parser.load(null, svgString, 72);
        const result = parser.cleanInput();
        
        expect(result).toBeDefined();
        expect(result).toBe(parser.root);
      });

      test('returns undefined when no SVG root is loaded', () => {
        const parser = new SvgParser();
        const result = parser.cleanInput();
        
        expect(result).toBeUndefined();
      });

      test('handles DXF flag correctly', () => {
        const parser = new SvgParser();
        const svgString = '<svg><path d="M 0 0 A 10 10 0 0 1 20 0"/></svg>';
        
        parser.load(null, svgString, 72);
        const result = parser.cleanInput(true);
        
        expect(result).toBeDefined();
      });
    });

    test.describe('imagePaths Method', () => {
      test('converts relative image paths to absolute', () => {
        const parser = new SvgParser();
        const svgString = '<svg><image href="image.png"/></svg>';
        
        parser.load('/test/path', svgString, 72);
        const root = parser.root;
        
        if (root) {
          parser.imagePaths(root);
          const image = root.querySelector('image');
          
          expect(image?.getAttribute('href')).toBe('/test/path/image.png');
          expect(image?.getAttribute('data-href')).toBe('image.png');
        }
      });

      test('handles xlink:href attribute', () => {
        const parser = new SvgParser();
        const svgString = '<svg><image xlink:href="image.png"/></svg>';
        
        parser.load('/test/path', svgString, 72);
        const root = parser.root;
        
        if (root) {
          parser.imagePaths(root);
          const image = root.querySelector('image');
          
          expect(image?.getAttribute('href')).toBe('/test/path/image.png');
          expect(image?.getAttribute('data-href')).toBe('image.png');
        }
      });

      test('returns false when no directory path is set', () => {
        const parser = new SvgParser();
        const svgString = '<svg><image href="image.png"/></svg>';
        
        parser.load(null, svgString, 72);
        const root = parser.root;
        
        if (root) {
          const result = parser.imagePaths(root);
          expect(result).toBe(false);
        }
      });

      test('ignores images without href attributes', () => {
        const parser = new SvgParser();
        const svgString = '<svg><image/></svg>';
        
        parser.load('/test/path', svgString, 72);
        const root = parser.root;
        
        if (root) {
          expect(() => parser.imagePaths(root)).not.toThrow();
        }
      });
    });

    test.describe('flatten Method', () => {
      test('brings nested elements to top level', () => {
        const parser = new SvgParser();
        const svgString = '<svg><g><rect width="50" height="50"/><circle cx="25" cy="25" r="10"/></g></svg>';
        
        parser.load(null, svgString, 72);
        const root = parser.root;
        
        if (root) {
          const initialChildCount = root.children.length;
          parser.flatten(root);
          
          // After flattening, elements should be moved to top level
          expect(root.children.length).toBeGreaterThan(initialChildCount);
        }
      });

      test('preserves SVG root element', () => {
        const parser = new SvgParser();
        const svgString = '<svg><g><rect width="50" height="50"/></g></svg>';
        
        parser.load(null, svgString, 72);
        const root = parser.root;
        
        if (root) {
          parser.flatten(root);
          
          // SVG root should remain as root
          expect(root.tagName).toBe('svg');
          expect(root.parentElement).toBeDefined();
        }
      });

      test('handles deeply nested structures', () => {
        const parser = new SvgParser();
        const svgString = '<svg><g><g><g><rect width="50" height="50"/></g></g></g></svg>';
        
        parser.load(null, svgString, 72);
        const root = parser.root;
        
        if (root) {
          expect(() => parser.flatten(root)).not.toThrow();
        }
      });
    });

    test.describe('filter Method', () => {
      test('removes elements not in whitelist', () => {
        const parser = new SvgParser();
        const svgString = '<svg><rect width="50" height="50"/><text>Remove me</text><circle cx="25" cy="25" r="10"/></svg>';
        
        parser.load(null, svgString, 72);
        const root = parser.root;
        
        if (root) {
          const initialChildren = Array.from(root.children);
          parser.filter(['svg', 'rect', 'circle']);
          
          // Text element should be removed
          const hasText = Array.from(root.querySelectorAll('*')).some(el => el.tagName === 'text');
          expect(hasText).toBe(false);
        }
      });

      test('preserves elements in whitelist', () => {
        const parser = new SvgParser();
        const svgString = '<svg><rect width="50" height="50"/><circle cx="25" cy="25" r="10"/></svg>';
        
        parser.load(null, svgString, 72);
        const root = parser.root;
        
        if (root) {
          parser.filter(['svg', 'rect', 'circle']);
          
          // Whitelisted elements should remain
          expect(root.querySelector('rect')).toBeDefined();
          expect(root.querySelector('circle')).toBeDefined();
        }
      });

      test('throws error for invalid whitelist', () => {
        const parser = new SvgParser();
        
        expect(() => parser.filter([])).toThrow('invalid whitelist');
        expect(() => parser.filter(null as any)).toThrow('invalid whitelist');
      });

      test('uses SVG root as default element', () => {
        const parser = new SvgParser();
        const svgString = '<svg><text>Remove me</text></svg>';
        
        parser.load(null, svgString, 72);
        
        expect(() => parser.filter(['svg', 'rect'])).not.toThrow();
      });

      test('handles elements with children correctly', () => {
        const parser = new SvgParser();
        const svgString = '<svg><g><rect width="50" height="50"/></g></svg>';
        
        parser.load(null, svgString, 72);
        const root = parser.root;
        
        if (root) {
          parser.filter(['svg', 'rect']);
          
          // Group should be removed but rect should remain
          expect(root.querySelector('g')).toBeNull();
          expect(root.querySelector('rect')).toBeDefined();
        }
      });
    });

    test.describe('recurse Method', () => {
      test('applies function to all elements recursively', () => {
        const parser = new SvgParser();
        const svgString = '<svg><g><rect width="50" height="50"/><circle cx="25" cy="25" r="10"/></g></svg>';
        
        parser.load(null, svgString, 72);
        const root = parser.root;
        
        if (root) {
          const processedElements: string[] = [];
          parser.recurse(root, (element) => {
            processedElements.push(element.tagName);
          });
          
          // Should process all elements
          expect(processedElements).toContain('svg');
          expect(processedElements).toContain('g');
          expect(processedElements).toContain('rect');
          expect(processedElements).toContain('circle');
        }
      });

      test('processes children before parents', () => {
        const parser = new SvgParser();
        const svgString = '<svg><g><rect width="50" height="50"/></g></svg>';
        
        parser.load(null, svgString, 72);
        const root = parser.root;
        
        if (root) {
          const processOrder: string[] = [];
          parser.recurse(root, (element) => {
            processOrder.push(element.tagName);
          });
          
          // Rect should be processed before g, g before svg
          const rectIndex = processOrder.indexOf('rect');
          const gIndex = processOrder.indexOf('g');
          const svgIndex = processOrder.indexOf('svg');
          
          expect(rectIndex).toBeLessThan(gIndex);
          expect(gIndex).toBeLessThan(svgIndex);
        }
      });

      test('avoids infinite loops with dynamically added children', () => {
        const parser = new SvgParser();
        const svgString = '<svg><rect width="50" height="50"/></svg>';
        
        parser.load(null, svgString, 72);
        const root = parser.root;
        
        if (root) {
          let callCount = 0;
          parser.recurse(root, (element) => {
            callCount++;
            // Try to add a child (should not cause infinite loop)
            if (callCount < 5 && element.tagName === 'rect') {
              const newRect = root.ownerDocument!.createElementNS('http://www.w3.org/2000/svg', 'rect');
              element.appendChild(newRect);
            }
          });
          
          // Should complete without infinite loop
          expect(callCount).toBeLessThan(10);
        }
      });
    });

    test.describe('splitPath Method', () => {
      test('splits compound paths with multiple M commands', () => {
        const parser = new SvgParser();
        const svgString = '<svg><path d="M 0 0 L 10 10 M 20 20 L 30 30"/></svg>';
        
        parser.load(null, svgString, 72);
        const root = parser.root;
        
        if (root && root.firstElementChild) {
          const result = parser.splitPath(root.firstElementChild as SVGElement);
          
          // Should return array of new paths
          expect(Array.isArray(result)).toBe(true);
          if (Array.isArray(result)) {
            expect(result.length).toBeGreaterThan(0);
          }
        }
      });

      test('returns false for paths with single M command', () => {
        const parser = new SvgParser();
        const svgString = '<svg><path d="M 0 0 L 10 10 L 20 20"/></svg>';
        
        parser.load(null, svgString, 72);
        const root = parser.root;
        
        if (root && root.firstElementChild) {
          const result = parser.splitPath(root.firstElementChild as SVGElement);
          
          // Should return false (no splitting needed)
          expect(result).toBe(false);
        }
      });

      test('returns false for non-path elements', () => {
        const parser = new SvgParser();
        const svgString = '<svg><rect width="50" height="50"/></svg>';
        
        parser.load(null, svgString, 72);
        const root = parser.root;
        
        if (root && root.firstElementChild) {
          const result = parser.splitPath(root.firstElementChild as SVGElement);
          
          // Should return false for non-path elements
          expect(result).toBe(false);
        }
      });

      test('handles relative move commands', () => {
        const parser = new SvgParser();
        const svgString = '<svg><path d="M 0 0 L 10 10 m 10 10 L 30 30"/></svg>';
        
        parser.load(null, svgString, 72);
        const root = parser.root;
        
        if (root && root.firstElementChild) {
          const result = parser.splitPath(root.firstElementChild as SVGElement);
          
          // Should handle relative commands
          expect(Array.isArray(result)).toBe(true);
        }
      });

      test('removes original path after splitting', () => {
        const parser = new SvgParser();
        const svgString = '<svg><path id="original" d="M 0 0 L 10 10 M 20 20 L 30 30"/></svg>';
        
        parser.load(null, svgString, 72);
        const root = parser.root;
        
        if (root && root.firstElementChild) {
          parser.splitPath(root.firstElementChild as SVGElement);
          
          // Original path should be removed
          expect(root.querySelector('#original')).toBeNull();
        }
      });

      test('handles paths without parent element', () => {
        const parser = new SvgParser();
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', 'M 0 0 L 10 10');
        
        const result = parser.splitPath(path);
        
        // Should return false for paths without parent
        expect(result).toBe(false);
      });
    });

    test.describe('Integration Tests', () => {
      test('complete preprocessing pipeline preserves geometric elements', () => {
        const parser = new SvgParser();
        const svgString = `
          <svg>
            <g transform="translate(10, 10)">
              <rect width="50" height="50"/>
              <circle cx="25" cy="25" r="10"/>
              <text>Remove this text</text>
              <path d="M 0 0 L 10 10 M 20 20 L 30 30"/>
            </g>
            <image href="test.png"/>
          </svg>
        `;
        
        parser.load('/images', svgString, 72);
        const result = parser.cleanInput();
        
        expect(result).toBeDefined();
        if (result) {
          // Should preserve geometric elements
          expect(result.querySelector('rect')).toBeDefined();
          expect(result.querySelector('circle')).toBeDefined();
          
          // Should remove text elements
          expect(result.querySelector('text')).toBeNull();
          
          // Should flatten structure (no groups)
          expect(result.querySelector('g')).toBeNull();
          
          // Should process images
          const image = result.querySelector('image');
          expect(image?.getAttribute('href')).toBe('/images/test.png');
        }
      });
    });

    test.describe('Path Utility Methods', () => {
      test.describe('isClosed Method', () => {
        test('returns true for closed elements by definition', () => {
          const parser = new SvgParser();
          const svgString = '<svg><rect width="50" height="50"/><circle cx="25" cy="25" r="10"/><ellipse cx="50" cy="50" rx="20" ry="15"/></svg>';
          
          parser.load(null, svgString, 72);
          const root = parser.root;
          
          if (root) {
            const rect = root.querySelector('rect');
            const circle = root.querySelector('circle');
            const ellipse = root.querySelector('ellipse');
            
            expect((parser as any).isClosed(rect)).toBe(true);
            expect((parser as any).isClosed(circle)).toBe(true);
            expect((parser as any).isClosed(ellipse)).toBe(true);
          }
        });

        test('returns false for line elements', () => {
          const parser = new SvgParser();
          const svgString = '<svg><line x1="0" y1="0" x2="10" y2="10"/></svg>';
          
          parser.load(null, svgString, 72);
          const root = parser.root;
          
          if (root) {
            const line = root.querySelector('line');
            expect((parser as any).isClosed(line)).toBe(false);
          }
        });

        test('returns false for short polylines', () => {
          const parser = new SvgParser();
          const svgString = '<svg><polyline points="0,0 10,10"/></svg>';
          
          parser.load(null, svgString, 72);
          const root = parser.root;
          
          if (root) {
            const polyline = root.querySelector('polyline');
            expect((parser as any).isClosed(polyline)).toBe(false);
          }
        });

        test('detects closed polylines by endpoint proximity', () => {
          const parser = new SvgParser();
          // Create a polyline that forms a triangle (closed)
          const svgString = '<svg><polyline points="0,0 10,0 5,10 0,0"/></svg>';
          
          parser.load(null, svgString, 72);
          const root = parser.root;
          
          if (root) {
            const polyline = root.querySelector('polyline');
            expect((parser as any).isClosed(polyline)).toBe(true);
          }
        });

        test('returns false for open polylines', () => {
          const parser = new SvgParser();
          const svgString = '<svg><polyline points="0,0 10,10 20,0"/></svg>';
          
          parser.load(null, svgString, 72);
          const root = parser.root;
          
          if (root) {
            const polyline = root.querySelector('polyline');
            expect((parser as any).isClosed(polyline)).toBe(false);
          }
        });

        test('detects paths with explicit Z command', () => {
          const parser = new SvgParser();
          const svgString = '<svg><path d="M 0 0 L 10 0 L 5 10 Z"/></svg>';
          
          parser.load(null, svgString, 72);
          const root = parser.root;
          
          if (root) {
            const path = root.querySelector('path');
            expect((parser as any).isClosed(path)).toBe(true);
          }
        });

        test('detects paths with lowercase z command', () => {
          const parser = new SvgParser();
          const svgString = '<svg><path d="M 0 0 L 10 0 L 5 10 z"/></svg>';
          
          parser.load(null, svgString, 72);
          const root = parser.root;
          
          if (root) {
            const path = root.querySelector('path');
            expect((parser as any).isClosed(path)).toBe(true);
          }
        });

        test('uses custom tolerance for endpoint comparison', () => {
          const parser = new SvgParser();
          const svgString = '<svg><polyline points="0,0 10,0 5,10 0.001,0.001"/></svg>';
          
          parser.load(null, svgString, 72);
          const root = parser.root;
          
          if (root) {
            const polyline = root.querySelector('polyline');
            
            // Should be closed with loose tolerance
            expect((parser as any).isClosed(polyline, 0.01)).toBe(true);
            
            // Should be open with strict tolerance
            expect((parser as any).isClosed(polyline, 0.0001)).toBe(false);
          }
        });
      });

      test.describe('pathToAbsolute Method', () => {
        test('throws error for non-path elements', () => {
          const parser = new SvgParser();
          const svgString = '<svg><rect width="50" height="50"/></svg>';
          
          parser.load(null, svgString, 72);
          const root = parser.root;
          
          if (root) {
            const rect = root.querySelector('rect');
            expect(() => (parser as any).pathToAbsolute(rect)).toThrow('invalid path');
          }
        });

        test('throws error for null element', () => {
          const parser = new SvgParser();
          expect(() => (parser as any).pathToAbsolute(null)).toThrow('invalid path');
        });

        test('converts relative move commands to absolute', () => {
          const parser = new SvgParser();
          const svgString = '<svg><path d="m 10 10 l 20 20"/></svg>';
          
          parser.load(null, svgString, 72);
          const root = parser.root;
          
          if (root) {
            const path = root.querySelector('path');
            expect(() => (parser as any).pathToAbsolute(path)).not.toThrow();
          }
        });

        test('handles horizontal line commands', () => {
          const parser = new SvgParser();
          const svgString = '<svg><path d="M 0 0 h 10"/></svg>';
          
          parser.load(null, svgString, 72);
          const root = parser.root;
          
          if (root) {
            const path = root.querySelector('path');
            expect(() => (parser as any).pathToAbsolute(path)).not.toThrow();
          }
        });

        test('handles vertical line commands', () => {
          const parser = new SvgParser();
          const svgString = '<svg><path d="M 0 0 v 10"/></svg>';
          
          parser.load(null, svgString, 72);
          const root = parser.root;
          
          if (root) {
            const path = root.querySelector('path');
            expect(() => (parser as any).pathToAbsolute(path)).not.toThrow();
          }
        });

        test('handles curve commands', () => {
          const parser = new SvgParser();
          const svgString = '<svg><path d="M 0 0 c 10 10 20 20 30 30"/></svg>';
          
          parser.load(null, svgString, 72);
          const root = parser.root;
          
          if (root) {
            const path = root.querySelector('path');
            expect(() => (parser as any).pathToAbsolute(path)).not.toThrow();
          }
        });

        test('handles arc commands', () => {
          const parser = new SvgParser();
          const svgString = '<svg><path d="M 0 0 a 10 10 0 0 1 20 20"/></svg>';
          
          parser.load(null, svgString, 72);
          const root = parser.root;
          
          if (root) {
            const path = root.querySelector('path');
            expect(() => (parser as any).pathToAbsolute(path)).not.toThrow();
          }
        });

        test('handles close path commands', () => {
          const parser = new SvgParser();
          const svgString = '<svg><path d="M 0 0 L 10 10 z"/></svg>';
          
          parser.load(null, svgString, 72);
          const root = parser.root;
          
          if (root) {
            const path = root.querySelector('path');
            expect(() => (parser as any).pathToAbsolute(path)).not.toThrow();
          }
        });

        test('preserves absolute commands', () => {
          const parser = new SvgParser();
          const svgString = '<svg><path d="M 0 0 L 10 10 L 20 20"/></svg>';
          
          parser.load(null, svgString, 72);
          const root = parser.root;
          
          if (root) {
            const path = root.querySelector('path');
            expect(() => (parser as any).pathToAbsolute(path)).not.toThrow();
          }
        });
      });

      test.describe('getEndpoints Method', () => {
        test('extracts endpoints from line elements', () => {
          const parser = new SvgParser();
          const svgString = '<svg><line x1="5" y1="10" x2="15" y2="20"/></svg>';
          
          parser.load(null, svgString, 72);
          const root = parser.root;
          
          if (root) {
            const line = root.querySelector('line');
            const endpoints = (parser as any).getEndpoints(line);
            
            expect(endpoints).toBeDefined();
            expect(endpoints.start).toEqual({ x: 5, y: 10 });
            expect(endpoints.end).toEqual({ x: 15, y: 20 });
          }
        });

        test('handles missing line coordinates', () => {
          const parser = new SvgParser();
          const svgString = '<svg><line/></svg>';
          
          parser.load(null, svgString, 72);
          const root = parser.root;
          
          if (root) {
            const line = root.querySelector('line');
            const endpoints = (parser as any).getEndpoints(line);
            
            expect(endpoints).toBeDefined();
            expect(endpoints.start).toEqual({ x: 0, y: 0 });
            expect(endpoints.end).toEqual({ x: 0, y: 0 });
          }
        });

        test('extracts endpoints from polyline elements', () => {
          const parser = new SvgParser();
          const svgString = '<svg><polyline points="0,0 10,10 20,0 30,15"/></svg>';
          
          parser.load(null, svgString, 72);
          const root = parser.root;
          
          if (root) {
            const polyline = root.querySelector('polyline');
            const endpoints = (parser as any).getEndpoints(polyline);
            
            expect(endpoints).toBeDefined();
            expect(endpoints.start).toEqual({ x: 0, y: 0 });
            expect(endpoints.end).toEqual({ x: 30, y: 15 });
          }
        });

        test('returns null for empty polyline', () => {
          const parser = new SvgParser();
          const svgString = '<svg><polyline points=""/></svg>';
          
          parser.load(null, svgString, 72);
          const root = parser.root;
          
          if (root) {
            const polyline = root.querySelector('polyline');
            const endpoints = (parser as any).getEndpoints(polyline);
            
            expect(endpoints).toBeNull();
          }
        });

        test('returns null for path elements (uses polygonifyPath)', () => {
          const parser = new SvgParser();
          const svgString = '<svg><path d="M 0 0 L 10 10 L 20 20"/></svg>';
          
          parser.load(null, svgString, 72);
          const root = parser.root;
          
          if (root) {
            const path = root.querySelector('path');
            const endpoints = (parser as any).getEndpoints(path);
            
            // Should be null since polygonifyPath returns null (placeholder)
            expect(endpoints).toBeNull();
          }
        });

        test('returns null for unsupported elements', () => {
          const parser = new SvgParser();
          const svgString = '<svg><rect width="50" height="50"/></svg>';
          
          parser.load(null, svgString, 72);
          const root = parser.root;
          
          if (root) {
            const rect = root.querySelector('rect');
            const endpoints = (parser as any).getEndpoints(rect);
            
            expect(endpoints).toBeNull();
          }
        });
      });

      test.describe('Utility Methods', () => {
        test('almostEqual compares numbers with tolerance', () => {
          const parser = new SvgParser();
          
          expect((parser as any).almostEqual(1.0, 1.001, 0.01)).toBe(true);
          expect((parser as any).almostEqual(1.0, 1.1, 0.01)).toBe(false);
          expect((parser as any).almostEqual(0, 0.0001, 0.001)).toBe(true);
          expect((parser as any).almostEqual(0, 0.1, 0.01)).toBe(false);
        });

        test('almostEqualPoints compares points with tolerance', () => {
          const parser = new SvgParser();
          
          const p1 = { x: 1.0, y: 2.0 };
          const p2 = { x: 1.001, y: 2.001 };
          const p3 = { x: 1.1, y: 2.1 };
          
          expect((parser as any).almostEqualPoints(p1, p2, 0.01)).toBe(true);
          expect((parser as any).almostEqualPoints(p1, p3, 0.01)).toBe(false);
        });

        test('almostEqualPoints handles exact matches', () => {
          const parser = new SvgParser();
          
          const p1 = { x: 5, y: 10 };
          const p2 = { x: 5, y: 10 };
          
          expect((parser as any).almostEqualPoints(p1, p2, 0.001)).toBe(true);
        });

        test('almostEqualPoints handles different coordinates', () => {
          const parser = new SvgParser();
          
          const p1 = { x: 0, y: 0 };
          const p2 = { x: 1, y: 0 };
          const p3 = { x: 0, y: 1 };
          
          expect((parser as any).almostEqualPoints(p1, p2, 0.1)).toBe(false);
          expect((parser as any).almostEqualPoints(p1, p3, 0.1)).toBe(false);
        });
      });
    });

    test.describe('Path Manipulation Methods', () => {
      test.describe('reverseOpenPath Method', () => {
        test('reverses line element coordinates', () => {
          const parser = new SvgParser();
          const svgString = '<svg><line x1="10" y1="20" x2="30" y2="40"/></svg>';
          
          parser.load(null, svgString, 72);
          const root = parser.root;
          
          if (root) {
            const line = root.querySelector('line');
            if (line) {
              parser.reverseElementPath(line);
              
              expect(line.getAttribute('x1')).toBe('30');
              expect(line.getAttribute('y1')).toBe('40');
              expect(line.getAttribute('x2')).toBe('10');
              expect(line.getAttribute('y2')).toBe('20');
            }
          }
        });

        test('handles line with missing coordinates', () => {
          const parser = new SvgParser();
          const svgString = '<svg><line x1="10" y1="20"/></svg>';
          
          parser.load(null, svgString, 72);
          const root = parser.root;
          
          if (root) {
            const line = root.querySelector('line');
            if (line) {
              parser.reverseElementPath(line);
              
              expect(line.getAttribute('x1')).toBe('0');
              expect(line.getAttribute('y1')).toBe('0');
              expect(line.getAttribute('x2')).toBe('10');
              expect(line.getAttribute('y2')).toBe('20');
            }
          }
        });

        test('reverses polyline point order', () => {
          const parser = new SvgParser();
          const svgString = '<svg><polyline points="0,0 10,10 20,0"/></svg>';
          
          parser.load(null, svgString, 72);
          const root = parser.root;
          
          if (root) {
            const polyline = root.querySelector('polyline');
            if (polyline) {
              const originalPoints = (polyline as any).points;
              const originalCount = originalPoints.length;
              
              parser.reverseElementPath(polyline);
              
              expect(originalPoints.length).toBe(originalCount);
              // Points should now be in reverse order
              expect(originalPoints[0].x).toBe(20);
              expect(originalPoints[0].y).toBe(0);
              expect(originalPoints[2].x).toBe(0);
              expect(originalPoints[2].y).toBe(0);
            }
          }
        });

        test('reverses path direction correctly', () => {
          const parser = new SvgParser();
          const svgString = '<svg><path d="M 0 0 L 10 10 L 20 0"/></svg>';
          
          parser.load(null, svgString, 72);
          const root = parser.root;
          
          if (root) {
            const path = root.querySelector('path');
            if (path) {
              parser.reverseElementPath(path);
              
              const dAttribute = path.getAttribute('d');
              expect(dAttribute).toBeDefined();
              expect(dAttribute).toContain('M');
            }
          }
        });

        test('handles path with curves', () => {
          const parser = new SvgParser();
          const svgString = '<svg><path d="M 0 0 C 10 10 20 20 30 30"/></svg>';
          
          parser.load(null, svgString, 72);
          const root = parser.root;
          
          if (root) {
            const path = root.querySelector('path');
            if (path) {
              expect(() => parser.reverseElementPath(path)).not.toThrow();
              
              const dAttribute = path.getAttribute('d');
              expect(dAttribute).toBeDefined();
            }
          }
        });

        test('handles path with arcs', () => {
          const parser = new SvgParser();
          const svgString = '<svg><path d="M 0 0 A 10 10 0 0 1 20 20"/></svg>';
          
          parser.load(null, svgString, 72);
          const root = parser.root;
          
          if (root) {
            const path = root.querySelector('path');
            if (path) {
              expect(() => parser.reverseElementPath(path)).not.toThrow();
              
              const dAttribute = path.getAttribute('d');
              expect(dAttribute).toBeDefined();
            }
          }
        });

        test('handles unsupported element types gracefully', () => {
          const parser = new SvgParser();
          const svgString = '<svg><rect width="50" height="50"/></svg>';
          
          parser.load(null, svgString, 72);
          const root = parser.root;
          
          if (root) {
            const rect = root.querySelector('rect');
            if (rect) {
              expect(() => parser.reverseElementPath(rect)).not.toThrow();
            }
          }
        });
      });

      test.describe('mergeOpenPaths Method', () => {
        test('merges two line elements into a path', () => {
          const parser = new SvgParser();
          const svgString = '<svg><line id="line1" x1="0" y1="0" x2="10" y2="10"/><line id="line2" x1="10" y1="10" x2="20" y2="20"/></svg>';
          
          parser.load(null, svgString, 72);
          const root = parser.root;
          
          if (root) {
            const line1 = root.querySelector('#line1');
            const line2 = root.querySelector('#line2');
            
            if (line1 && line2) {
              const merged = parser.mergeElementPaths(line1, line2);
              
              expect(merged).toBeDefined();
              expect(merged?.tagName).toBe('path');
            }
          }
        });

        test('merges line and polyline elements', () => {
          const parser = new SvgParser();
          const svgString = '<svg><line id="line1" x1="0" y1="0" x2="10" y2="10"/><polyline id="poly1" points="10,10 20,20 30,30"/></svg>';
          
          parser.load(null, svgString, 72);
          const root = parser.root;
          
          if (root) {
            const line1 = root.querySelector('#line1');
            const poly1 = root.querySelector('#poly1');
            
            if (line1 && poly1) {
              const merged = parser.mergeElementPaths(line1, poly1);
              
              expect(merged).toBeDefined();
              expect(merged?.tagName).toBe('path');
            }
          }
        });

        test('merges two path elements', () => {
          const parser = new SvgParser();
          const svgString = '<svg><path id="path1" d="M 0 0 L 10 10"/><path id="path2" d="M 10 10 L 20 20"/></svg>';
          
          parser.load(null, svgString, 72);
          const root = parser.root;
          
          if (root) {
            const path1 = root.querySelector('#path1');
            const path2 = root.querySelector('#path2');
            
            if (path1 && path2) {
              const merged = parser.mergeElementPaths(path1, path2);
              
              expect(merged).toBeDefined();
              expect(merged?.tagName).toBe('path');
              expect(merged).toBe(path1); // Should return the first path
            }
          }
        });

        test('returns null for polyline with insufficient points', () => {
          const parser = new SvgParser();
          const svgString = '<svg><line id="line1" x1="0" y1="0" x2="10" y2="10"/><polyline id="poly1" points="10,10"/></svg>';
          
          parser.load(null, svgString, 72);
          const root = parser.root;
          
          if (root) {
            const line1 = root.querySelector('#line1');
            const poly1 = root.querySelector('#poly1');
            
            if (line1 && poly1) {
              const merged = parser.mergeElementPaths(line1, poly1);
              
              expect(merged).toBeNull();
            }
          }
        });

        test('handles unsupported element types', () => {
          const parser = new SvgParser();
          const svgString = '<svg><rect id="rect1" width="50" height="50"/><circle id="circle1" cx="25" cy="25" r="10"/></svg>';
          
          parser.load(null, svgString, 72);
          const root = parser.root;
          
          if (root) {
            const rect1 = root.querySelector('#rect1');
            const circle1 = root.querySelector('#circle1');
            
            if (rect1 && circle1) {
              const merged = parser.mergeElementPaths(rect1, circle1);
              
              expect(merged).toBeNull();
            }
          }
        });

        test('merges polyline to polyline via path conversion', () => {
          const parser = new SvgParser();
          const svgString = '<svg><polyline id="poly1" points="0,0 10,10"/><polyline id="poly2" points="10,10 20,20 30,30"/></svg>';
          
          parser.load(null, svgString, 72);
          const root = parser.root;
          
          if (root) {
            const poly1 = root.querySelector('#poly1');
            const poly2 = root.querySelector('#poly2');
            
            if (poly1 && poly2) {
              const merged = parser.mergeElementPaths(poly1, poly2);
              
              expect(merged).toBeDefined();
              expect(merged?.tagName).toBe('path');
            }
          }
        });

        test('handles path merging with complex segments', () => {
          const parser = new SvgParser();
          const svgString = '<svg><path id="path1" d="M 0 0 C 5 5 10 5 15 0"/><path id="path2" d="M 15 0 L 25 10"/></svg>';
          
          parser.load(null, svgString, 72);
          const root = parser.root;
          
          if (root) {
            const path1 = root.querySelector('#path1');
            const path2 = root.querySelector('#path2');
            
            if (path1 && path2) {
              const merged = parser.mergeElementPaths(path1, path2);
              
              expect(merged).toBeDefined();
              expect(merged?.tagName).toBe('path');
            }
          }
        });
      });

      test.describe('Integration Tests', () => {
        test('reverse and merge operations work together', () => {
          const parser = new SvgParser();
          const svgString = '<svg><line id="line1" x1="0" y1="0" x2="10" y2="10"/><line id="line2" x1="20" y1="20" x2="10" y2="10"/></svg>';
          
          parser.load(null, svgString, 72);
          const root = parser.root;
          
          if (root) {
            const line1 = root.querySelector('#line1');
            const line2 = root.querySelector('#line2');
            
            if (line1 && line2) {
              // Reverse line2 so its start point matches line1's end point
              parser.reverseElementPath(line2);
              
              expect(line2.getAttribute('x1')).toBe('10');
              expect(line2.getAttribute('y1')).toBe('10');
              
              // Now merge them
              const merged = parser.mergeElementPaths(line1, line2);
              
              expect(merged).toBeDefined();
              expect(merged?.tagName).toBe('path');
            }
          }
        });

        test('path manipulation preserves geometric continuity', () => {
          const parser = new SvgParser();
          const svgString = '<svg><polyline id="poly1" points="0,0 5,5 10,0"/></svg>';
          
          parser.load(null, svgString, 72);
          const root = parser.root;
          
          if (root) {
            const poly1 = root.querySelector('#poly1');
            
            if (poly1) {
              const originalPoints = (poly1 as any).points;
              const originalStartX = originalPoints[0].x;
              const originalEndX = originalPoints[originalPoints.length - 1].x;
              
              // Reverse the polyline
              parser.reverseElementPath(poly1);
              
              // Start should now be where end was
              expect(originalPoints[0].x).toBe(originalEndX);
              expect(originalPoints[originalPoints.length - 1].x).toBe(originalStartX);
            }
          }
        });

        test('complex path operations maintain validity', () => {
          const parser = new SvgParser();
          const svgString = '<svg><path id="path1" d="M 0 0 Q 10 10 20 0 T 40 0"/></svg>';
          
          parser.load(null, svgString, 72);
          const root = parser.root;
          
          if (root) {
            const path1 = root.querySelector('#path1');
            
            if (path1) {
              expect(() => parser.reverseElementPath(path1)).not.toThrow();
              
              const dAttribute = path1.getAttribute('d');
              expect(dAttribute).toBeDefined();
              expect(dAttribute).toMatch(/^M\s/); // Should still start with M
            }
          }
        });
      });
    });

    test.describe('Path Merging Logic', () => {
      test.describe('getCoincident Method', () => {
        test('finds coincident paths with matching endpoints', () => {
          const parser = new SvgParser();
          const svgString = '<svg><line id="line1" x1="0" y1="0" x2="10" y2="10"/><line id="line2" x1="10" y1="10" x2="20" y2="20"/></svg>';
          
          parser.load(null, svgString, 72);
          const root = parser.root;
          
          if (root) {
            const line1 = root.querySelector('#line1') as SVGElement & { endpoints?: any };
            const line2 = root.querySelector('#line2') as SVGElement & { endpoints?: any };
            
            if (line1 && line2) {
              // Set endpoints manually for testing
              line1.endpoints = parser.getElementEndpoints(line1);
              line2.endpoints = parser.getElementEndpoints(line2);
              
              const list = [line1, line2];
              const coincident = parser.findCoincidentPath(line1, list, 0.1);
              
              expect(coincident).toBeDefined();
              expect(coincident?.path).toBe(line2);
              expect(coincident?.reverse1).toBe(false);
              expect(coincident?.reverse2).toBe(false);
            }
          }
        });

        test('detects when paths need reversal', () => {
          const parser = new SvgParser();
          const svgString = '<svg><line id="line1" x1="0" y1="0" x2="10" y2="10"/><line id="line2" x1="20" y1="20" x2="10" y2="10"/></svg>';
          
          parser.load(null, svgString, 72);
          const root = parser.root;
          
          if (root) {
            const line1 = root.querySelector('#line1') as SVGElement & { endpoints?: any };
            const line2 = root.querySelector('#line2') as SVGElement & { endpoints?: any };
            
            if (line1 && line2) {
              line1.endpoints = parser.getElementEndpoints(line1);
              line2.endpoints = parser.getElementEndpoints(line2);
              
              const list = [line1, line2];
              const coincident = parser.findCoincidentPath(line1, list, 0.1);
              
              expect(coincident).toBeDefined();
              expect(coincident?.path).toBe(line2);
              expect(coincident?.reverse1).toBe(false);
              expect(coincident?.reverse2).toBe(true);
            }
          }
        });

        test('returns null when no coincident paths found', () => {
          const parser = new SvgParser();
          const svgString = '<svg><line id="line1" x1="0" y1="0" x2="10" y2="10"/><line id="line2" x1="20" y1="20" x2="30" y2="30"/></svg>';
          
          parser.load(null, svgString, 72);
          const root = parser.root;
          
          if (root) {
            const line1 = root.querySelector('#line1') as SVGElement & { endpoints?: any };
            const line2 = root.querySelector('#line2') as SVGElement & { endpoints?: any };
            
            if (line1 && line2) {
              line1.endpoints = parser.getElementEndpoints(line1);
              line2.endpoints = parser.getElementEndpoints(line2);
              
              const list = [line1, line2];
              const coincident = parser.findCoincidentPath(line1, list, 0.1);
              
              expect(coincident).toBeNull();
            }
          }
        });

        test('handles tolerance for near-coincident endpoints', () => {
          const parser = new SvgParser();
          const svgString = '<svg><line id="line1" x1="0" y1="0" x2="10" y2="10"/><line id="line2" x1="10.05" y1="10.05" x2="20" y2="20"/></svg>';
          
          parser.load(null, svgString, 72);
          const root = parser.root;
          
          if (root) {
            const line1 = root.querySelector('#line1') as SVGElement & { endpoints?: any };
            const line2 = root.querySelector('#line2') as SVGElement & { endpoints?: any };
            
            if (line1 && line2) {
              line1.endpoints = parser.getElementEndpoints(line1);
              line2.endpoints = parser.getElementEndpoints(line2);
              
              const list = [line1, line2];
              
              // Should find with loose tolerance
              const coincidentLoose = parser.findCoincidentPath(line1, list, 0.1);
              expect(coincidentLoose).toBeDefined();
              
              // Should not find with strict tolerance
              const coincidentStrict = parser.findCoincidentPath(line1, list, 0.01);
              expect(coincidentStrict).toBeNull();
            }
          }
        });

        test('handles paths without endpoints property', () => {
          const parser = new SvgParser();
          const svgString = '<svg><line id="line1" x1="0" y1="0" x2="10" y2="10"/><line id="line2" x1="10" y1="10" x2="20" y2="20"/></svg>';
          
          parser.load(null, svgString, 72);
          const root = parser.root;
          
          if (root) {
            const line1 = root.querySelector('#line1') as SVGElement & { endpoints?: any };
            const line2 = root.querySelector('#line2') as SVGElement & { endpoints?: any };
            
            if (line1 && line2) {
              // Only set endpoints for line1
              line1.endpoints = parser.getElementEndpoints(line1);
              
              const list = [line1, line2];
              const coincident = parser.findCoincidentPath(line1, list, 0.1);
              
              expect(coincident).toBeNull();
            }
          }
        });

        test('checks all endpoint combinations', () => {
          const parser = new SvgParser();
          
          // Test start-start connection
          const svgString1 = '<svg><line id="line1" x1="10" y1="10" x2="0" y2="0"/><line id="line2" x1="10" y1="10" x2="20" y2="20"/></svg>';
          parser.load(null, svgString1, 72);
          let root = parser.root;
          
          if (root) {
            const line1 = root.querySelector('#line1') as SVGElement & { endpoints?: any };
            const line2 = root.querySelector('#line2') as SVGElement & { endpoints?: any };
            
            if (line1 && line2) {
              line1.endpoints = parser.getElementEndpoints(line1);
              line2.endpoints = parser.getElementEndpoints(line2);
              
              const coincident = parser.findCoincidentPath(line1, [line1, line2], 0.1);
              expect(coincident?.reverse1).toBe(true);
              expect(coincident?.reverse2).toBe(false);
            }
          }
        });
      });

      test.describe('mergeLines Method', () => {
        test('merges simple connected lines', () => {
          const parser = new SvgParser();
          const svgString = '<svg><line x1="0" y1="0" x2="10" y2="10"/><line x1="10" y1="10" x2="20" y2="20"/></svg>';
          
          parser.load(null, svgString, 72);
          const root = parser.root;
          
          if (root) {
            const initialChildCount = root.children.length;
            parser.mergeAllLines(root, 0.1);
            
            // Should have one merged path instead of two lines
            expect(root.children.length).toBeLessThan(initialChildCount);
            
            // Should have created a path element
            const paths = root.querySelectorAll('path');
            expect(paths.length).toBeGreaterThan(0);
          }
        });

        test('reverses paths when needed to connect endpoints', () => {
          const parser = new SvgParser();
          const svgString = '<svg><line x1="0" y1="0" x2="10" y2="10"/><line x1="20" y1="20" x2="10" y2="10"/></svg>';
          
          parser.load(null, svgString, 72);
          const root = parser.root;
          
          if (root) {
            parser.mergeAllLines(root, 0.1);
            
            // Should have merged into one path
            const paths = root.querySelectorAll('path');
            expect(paths.length).toBe(1);
          }
        });

        test('creates closed paths when endpoints meet', () => {
          const parser = new SvgParser();
          const svgString = '<svg><line x1="0" y1="0" x2="10" y2="0"/><line x1="10" y1="0" x2="10" y2="10"/><line x1="10" y1="10" x2="0" y2="10"/><line x1="0" y1="10" x2="0" y2="0"/></svg>';
          
          parser.load(null, svgString, 72);
          const root = parser.root;
          
          if (root) {
            parser.mergeAllLines(root, 0.1);
            
            // Should have merged into one closed path
            const paths = root.querySelectorAll('path');
            expect(paths.length).toBe(1);
            
            if (paths.length > 0) {
              const pathData = paths[0].getAttribute('d');
              expect(pathData).toBeDefined();
              // Should have a Z command at the end
              expect(pathData).toMatch(/[Zz]$/);
            }
          }
        });

        test('handles multiple disconnected path groups', () => {
          const parser = new SvgParser();
          const svgString = '<svg><line x1="0" y1="0" x2="10" y2="10"/><line x1="10" y1="10" x2="20" y2="20"/><line x1="30" y1="30" x2="40" y2="40"/><line x1="40" y1="40" x2="50" y2="50"/></svg>';
          
          parser.load(null, svgString, 72);
          const root = parser.root;
          
          if (root) {
            parser.mergeAllLines(root, 0.1);
            
            // Should have two merged paths (two separate groups)
            const paths = root.querySelectorAll('path');
            expect(paths.length).toBe(2);
          }
        });

        test('preserves already closed paths', () => {
          const parser = new SvgParser();
          const svgString = '<svg><path d="M 0 0 L 10 0 L 10 10 L 0 10 Z"/><line x1="20" y1="20" x2="30" y2="30"/></svg>';
          
          parser.load(null, svgString, 72);
          const root = parser.root;
          
          if (root) {
            const initialClosedPath = root.querySelector('path');
            const initialPathData = initialClosedPath?.getAttribute('d');
            
            parser.mergeAllLines(root, 0.1);
            
            // Closed path should remain unchanged
            const closedPath = root.querySelector('path[d*="Z"]');
            expect(closedPath).toBeDefined();
            expect(closedPath?.getAttribute('d')).toBe(initialPathData);
          }
        });

        test('handles tolerance for near-connections', () => {
          const parser = new SvgParser();
          const svgString = '<svg><line x1="0" y1="0" x2="10" y2="10"/><line x1="10.05" y1="10.05" x2="20" y2="20"/></svg>';
          
          parser.load(null, svgString, 72);
          const root = parser.root;
          
          if (root) {
            const rootClone = root.cloneNode(true) as SVGElement;
            
            // Merge with loose tolerance
            parser.mergeAllLines(root, 0.1);
            const pathsLoose = root.querySelectorAll('path');
            expect(pathsLoose.length).toBe(1);
            
            // Merge with strict tolerance (using clone)
            parser.mergeAllLines(rootClone, 0.01);
            const pathsStrict = rootClone.querySelectorAll('path');
            expect(pathsStrict.length).toBe(0); // No merge should happen
          }
        });

        test('adds close path command to paths missing it', () => {
          const parser = new SvgParser();
          const svgString = '<svg><path d="M 0 0 L 10 0 L 10 10 L 0 10 L 0 0"/></svg>';
          
          parser.load(null, svgString, 72);
          const root = parser.root;
          
          if (root) {
            parser.mergeAllLines(root, 0.1);
            
            const path = root.querySelector('path');
            const pathData = path?.getAttribute('d');
            
            // Should have added Z command
            expect(pathData).toMatch(/[Zz]$/);
          }
        });

        test('handles complex merge scenarios', () => {
          const parser = new SvgParser();
          const svgString = '<svg><polyline points="0,0 10,10"/><path d="M 10 10 L 20 20"/><line x1="20" y1="20" x2="30" y2="30"/></svg>';
          
          parser.load(null, svgString, 72);
          const root = parser.root;
          
          if (root) {
            parser.mergeAllLines(root, 0.1);
            
            // All should merge into one path
            const paths = root.querySelectorAll('path');
            expect(paths.length).toBe(1);
          }
        });
      });

      test.describe('Integration Tests', () => {
        test('complete path merging workflow', () => {
          const parser = new SvgParser();
          const svgString = `
            <svg>
              <line x1="0" y1="0" x2="10" y2="0"/>
              <line x1="20" y1="10" x2="10" y2="10"/>
              <line x1="10" y1="0" x2="10" y2="10"/>
              <line x1="20" y1="10" x2="20" y2="0"/>
              <line x1="20" y1="0" x2="10" y2="0"/>
            </svg>
          `;
          
          parser.load(null, svgString, 72);
          const root = parser.root;
          
          if (root) {
            parser.mergeAllLines(root, 0.1);
            
            // Should result in one or two closed paths
            const paths = root.querySelectorAll('path');
            expect(paths.length).toBeGreaterThan(0);
            expect(paths.length).toBeLessThanOrEqual(2);
            
            // At least one should be closed
            let hasClosedPath = false;
            paths.forEach(path => {
              const d = path.getAttribute('d');
              if (d && /[Zz]/.test(d)) {
                hasClosedPath = true;
              }
            });
            expect(hasClosedPath).toBe(true);
          }
        });

        test('handles real-world SVG preprocessing', () => {
          const parser = new SvgParser();
          const svgString = `
            <svg>
              <g transform="translate(10, 10)">
                <line x1="0" y1="0" x2="10" y2="10"/>
                <line x1="10" y1="10" x2="20" y2="20"/>
              </g>
            </svg>
          `;
          
          parser.load(null, svgString, 72);
          
          // Run full preprocessing pipeline
          const result = parser.cleanInput();
          
          if (result) {
            // Group should be flattened and lines merged
            expect(result.querySelector('g')).toBeNull();
            
            const paths = result.querySelectorAll('path');
            expect(paths.length).toBeGreaterThan(0);
          }
        });
      });
    });
  });

  test.describe('Path Segmentation Methods (Step 8)', () => {
    test.describe('performSplitLines Method', () => {
      test('splits polylines into individual line segments', () => {
        const parser = new SvgParser();
        const svgString = '<svg><polyline points="0,0 10,10 20,20 30,0"/></svg>';
        
        parser.load(null, svgString, 72);
        const root = parser.root;
        
        if (root) {
          const initialPolylineCount = root.querySelectorAll('polyline').length;
          expect(initialPolylineCount).toBe(1);
          
          parser.performSplitLines(root);
          
          // Polyline should be removed
          expect(root.querySelectorAll('polyline').length).toBe(0);
          
          // Should have 3 line segments (4 points = 3 segments)
          const lines = root.querySelectorAll('line');
          expect(lines.length).toBe(3);
          
          // Verify first line
          if (lines.length > 0) {
            expect(lines[0].getAttribute('x1')).toBe('0');
            expect(lines[0].getAttribute('y1')).toBe('0');
            expect(lines[0].getAttribute('x2')).toBe('10');
            expect(lines[0].getAttribute('y2')).toBe('10');
          }
        }
      });

      test('splits polygons into closed line segments', () => {
        const parser = new SvgParser();
        const svgString = '<svg><polygon points="0,0 10,0 10,10 0,10"/></svg>';
        
        parser.load(null, svgString, 72);
        const root = parser.root;
        
        if (root) {
          parser.performSplitLines(root);
          
          // Polygon should be removed
          expect(root.querySelectorAll('polygon').length).toBe(0);
          
          // Should have 4 line segments (including closing line)
          const lines = root.querySelectorAll('line');
          expect(lines.length).toBe(4);
          
          // Verify closing line (last to first point)
          if (lines.length >= 4) {
            const lastLine = lines[lines.length - 1];
            expect(lastLine.getAttribute('x1')).toBe('0');
            expect(lastLine.getAttribute('y1')).toBe('10');
            expect(lastLine.getAttribute('x2')).toBe('0');
            expect(lastLine.getAttribute('y2')).toBe('0');
          }
        }
      });

      test('splits rectangles into four line segments', () => {
        const parser = new SvgParser();
        const svgString = '<svg><rect x="10" y="20" width="30" height="40"/></svg>';
        
        parser.load(null, svgString, 72);
        const root = parser.root;
        
        if (root) {
          parser.performSplitLines(root);
          
          // Rectangle should be removed
          expect(root.querySelectorAll('rect').length).toBe(0);
          
          // Should have 4 line segments
          const lines = root.querySelectorAll('line');
          expect(lines.length).toBe(4);
          
          // Verify all four edges
          const lineData = Array.from(lines).map(line => ({
            x1: parseFloat(line.getAttribute('x1') || '0'),
            y1: parseFloat(line.getAttribute('y1') || '0'),
            x2: parseFloat(line.getAttribute('x2') || '0'),
            y2: parseFloat(line.getAttribute('y2') || '0')
          }));
          
          // Should contain top, right, bottom, left edges
          expect(lineData).toContainEqual({ x1: 10, y1: 20, x2: 40, y2: 20 }); // Top
          expect(lineData).toContainEqual({ x1: 40, y1: 20, x2: 40, y2: 60 }); // Right
          expect(lineData).toContainEqual({ x1: 40, y1: 60, x2: 10, y2: 60 }); // Bottom
          expect(lineData).toContainEqual({ x1: 10, y1: 60, x2: 10, y2: 20 }); // Left
        }
      });

      test('processes paths by calling splitPathSegments', () => {
        const parser = new SvgParser();
        const svgString = '<svg><path d="M 0 0 L 10 10 L 20 20"/></svg>';
        
        parser.load(null, svgString, 72);
        const root = parser.root;
        
        if (root) {
          const pathElement = root.querySelector('path');
          expect(pathElement).toBeDefined();
          
          parser.performSplitLines(root);
          
          // Should have created line segments
          const lines = root.querySelectorAll('line');
          expect(lines.length).toBeGreaterThan(0);
        }
      });

      test('skips zero-length lines', () => {
        const parser = new SvgParser();
        const svgString = '<svg><polyline points="0,0 0,0 10,10"/></svg>';
        
        parser.load(null, svgString, 72);
        const root = parser.root;
        
        if (root) {
          parser.performSplitLines(root);
          
          // Should only have one line (0,0 to 10,10), skipping zero-length
          const lines = root.querySelectorAll('line');
          expect(lines.length).toBe(1);
          
          if (lines.length > 0) {
            expect(lines[0].getAttribute('x1')).toBe('0');
            expect(lines[0].getAttribute('y1')).toBe('0');
            expect(lines[0].getAttribute('x2')).toBe('10');
            expect(lines[0].getAttribute('y2')).toBe('10');
          }
        }
      });

      test('handles empty or invalid point lists', () => {
        const parser = new SvgParser();
        const svgString = '<svg><polyline points="0,0"/></svg>';
        
        parser.load(null, svgString, 72);
        const root = parser.root;
        
        if (root) {
          parser.performSplitLines(root);
          
          // Should remove polyline with insufficient points
          expect(root.querySelectorAll('polyline').length).toBe(0);
          expect(root.querySelectorAll('line').length).toBe(0);
        }
      });
    });

    test.describe('performSplitPathSegments Method', () => {
      test('converts L commands to line elements', () => {
        const parser = new SvgParser();
        const svgString = '<svg><path d="M 0 0 L 10 10 L 20 20"/></svg>';
        
        parser.load(null, svgString, 72);
        const root = parser.root;
        
        if (root) {
          const pathElement = root.querySelector('path') as SVGElement;
          expect(pathElement).toBeDefined();
          
          if (pathElement) {
            const lines = parser.performSplitPathSegments(pathElement);
            
            // Should create 2 line segments
            expect(lines.length).toBe(2);
            
            // Verify line coordinates
            expect(lines[0].getAttribute('x1')).toBe('0');
            expect(lines[0].getAttribute('y1')).toBe('0');
            expect(lines[0].getAttribute('x2')).toBe('10');
            expect(lines[0].getAttribute('y2')).toBe('10');
            
            expect(lines[1].getAttribute('x1')).toBe('10');
            expect(lines[1].getAttribute('y1')).toBe('10');
            expect(lines[1].getAttribute('x2')).toBe('20');
            expect(lines[1].getAttribute('y2')).toBe('20');
          }
        }
      });

      test('converts H and V commands to line elements', () => {
        const parser = new SvgParser();
        const svgString = '<svg><path d="M 0 0 H 10 V 10"/></svg>';
        
        parser.load(null, svgString, 72);
        const root = parser.root;
        
        if (root) {
          const pathElement = root.querySelector('path') as SVGElement;
          
          if (pathElement) {
            const lines = parser.performSplitPathSegments(pathElement);
            
            // Should create 2 line segments
            expect(lines.length).toBe(2);
            
            // Horizontal line
            expect(lines[0].getAttribute('x1')).toBe('0');
            expect(lines[0].getAttribute('y1')).toBe('0');
            expect(lines[0].getAttribute('x2')).toBe('10');
            expect(lines[0].getAttribute('y2')).toBe('0');
            
            // Vertical line
            expect(lines[1].getAttribute('x1')).toBe('10');
            expect(lines[1].getAttribute('y1')).toBe('0');
            expect(lines[1].getAttribute('x2')).toBe('10');
            expect(lines[1].getAttribute('y2')).toBe('10');
          }
        }
      });

      test('handles Z command (closepath)', () => {
        const parser = new SvgParser();
        const svgString = '<svg><path d="M 0 0 L 10 0 L 10 10 Z"/></svg>';
        
        parser.load(null, svgString, 72);
        const root = parser.root;
        
        if (root) {
          const pathElement = root.querySelector('path') as SVGElement;
          
          if (pathElement) {
            const lines = parser.performSplitPathSegments(pathElement);
            
            // Should create 3 line segments (including closing line)
            expect(lines.length).toBe(3);
            
            // Closing line (back to start)
            const closingLine = lines[2];
            expect(closingLine.getAttribute('x1')).toBe('10');
            expect(closingLine.getAttribute('y1')).toBe('10');
            expect(closingLine.getAttribute('x2')).toBe('0');
            expect(closingLine.getAttribute('y2')).toBe('0');
          }
        }
      });

      test('skips zero-length segments', () => {
        const parser = new SvgParser();
        const svgString = '<svg><path d="M 0 0 L 0 0 L 10 10"/></svg>';
        
        parser.load(null, svgString, 72);
        const root = parser.root;
        
        if (root) {
          const pathElement = root.querySelector('path') as SVGElement;
          
          if (pathElement) {
            const lines = parser.performSplitPathSegments(pathElement);
            
            // Should only create 1 line segment (skipping zero-length)
            expect(lines.length).toBe(1);
            
            expect(lines[0].getAttribute('x1')).toBe('0');
            expect(lines[0].getAttribute('y1')).toBe('0');
            expect(lines[0].getAttribute('x2')).toBe('10');
            expect(lines[0].getAttribute('y2')).toBe('10');
          }
        }
      });

      test('replaces linear moves with M commands', () => {
        const parser = new SvgParser();
        const svgString = '<svg><path d="M 0 0 L 10 10 L 20 20"/></svg>';
        
        parser.load(null, svgString, 72);
        const root = parser.root;
        
        if (root) {
          const pathElement = root.querySelector('path') as SVGElement;
          
          if (pathElement) {
            parser.performSplitPathSegments(pathElement);
            
            // Path should still exist but modified
            const pathData = pathElement.getAttribute('d');
            expect(pathData).toBeDefined();
            
            // Should contain only M commands after processing
            if (pathData) {
              const commands = pathData.match(/[MLHVCSQTAZ]/gi) || [];
              const nonMCommands = commands.filter(cmd => cmd.toUpperCase() !== 'M');
              expect(nonMCommands.length).toBe(0);
            }
          }
        }
      });
    });

    test.describe('performMergeOverlap Method', () => {
      test('merges overlapping collinear lines', () => {
        const parser = new SvgParser();
        const svgString = '<svg><line x1="0" y1="0" x2="10" y2="0"/><line x1="5" y1="0" x2="15" y2="0"/></svg>';
        
        parser.load(null, svgString, 72);
        const root = parser.root;
        
        if (root) {
          const initialLineCount = root.querySelectorAll('line').length;
          expect(initialLineCount).toBe(2);
          
          parser.performMergeOverlap(root, 0.1);
          
          // Should merge into one longer line
          const lines = root.querySelectorAll('line');
          expect(lines.length).toBe(1);
          
          // Verify merged line spans from 0 to 15
          if (lines.length > 0) {
            const x1 = parseFloat(lines[0].getAttribute('x1') || '0');
            const x2 = parseFloat(lines[0].getAttribute('x2') || '0');
            const y1 = parseFloat(lines[0].getAttribute('y1') || '0');
            const y2 = parseFloat(lines[0].getAttribute('y2') || '0');
            
            expect(Math.min(x1, x2)).toBe(0);
            expect(Math.max(x1, x2)).toBe(15);
            expect(y1).toBe(0);
            expect(y2).toBe(0);
          }
        }
      });

      test('removes duplicate lines', () => {
        const parser = new SvgParser();
        const svgString = '<svg><line x1="0" y1="0" x2="10" y2="0"/><line x1="0" y1="0" x2="10" y2="0"/></svg>';
        
        parser.load(null, svgString, 72);
        const root = parser.root;
        
        if (root) {
          expect(root.querySelectorAll('line').length).toBe(2);
          
          parser.performMergeOverlap(root, 0.1);
          
          // Should remove duplicate
          expect(root.querySelectorAll('line').length).toBe(1);
        }
      });

      test('removes lines completely inside other lines', () => {
        const parser = new SvgParser();
        const svgString = '<svg><line x1="0" y1="0" x2="20" y2="0"/><line x1="5" y1="0" x2="15" y2="0"/></svg>';
        
        parser.load(null, svgString, 72);
        const root = parser.root;
        
        if (root) {
          expect(root.querySelectorAll('line').length).toBe(2);
          
          parser.performMergeOverlap(root, 0.1);
          
          // Should keep only the longer line
          const lines = root.querySelectorAll('line');
          expect(lines.length).toBe(1);
          
          if (lines.length > 0) {
            const x1 = parseFloat(lines[0].getAttribute('x1') || '0');
            const x2 = parseFloat(lines[0].getAttribute('x2') || '0');
            expect(Math.min(x1, x2)).toBe(0);
            expect(Math.max(x1, x2)).toBe(20);
          }
        }
      });

      test('ignores non-collinear lines', () => {
        const parser = new SvgParser();
        const svgString = '<svg><line x1="0" y1="0" x2="10" y2="0"/><line x1="0" y1="5" x2="10" y2="5"/></svg>';
        
        parser.load(null, svgString, 72);
        const root = parser.root;
        
        if (root) {
          expect(root.querySelectorAll('line').length).toBe(2);
          
          parser.performMergeOverlap(root, 0.1);
          
          // Should keep both lines (not collinear)
          expect(root.querySelectorAll('line').length).toBe(2);
        }
      });

      test('ignores very short lines', () => {
        const parser = new SvgParser();
        const svgString = '<svg><line x1="0" y1="0" x2="0.001" y2="0"/><line x1="5" y1="0" x2="15" y2="0"/></svg>';
        
        parser.load(null, svgString, 72);
        const root = parser.root;
        
        if (root) {
          parser.performMergeOverlap(root, 0.1);
          
          // Should keep both lines (first too short to process)
          expect(root.querySelectorAll('line').length).toBe(2);
        }
      });

      test('uses custom tolerance parameter', () => {
        const parser = new SvgParser();
        const svgString = '<svg><line x1="0" y1="0" x2="10" y2="0"/><line x1="5" y1="0.05" x2="15" y2="0.05"/></svg>';
        
        parser.load(null, svgString, 72);
        const root = parser.root;
        
        if (root) {
          const rootClone = root.cloneNode(true) as SVGElement;
          
          // With loose tolerance, should merge
          parser.performMergeOverlap(root, 0.1);
          expect(root.querySelectorAll('line').length).toBe(1);
          
          // With strict tolerance, should not merge
          parser.performMergeOverlap(rootClone, 0.01);
          expect(rootClone.querySelectorAll('line').length).toBe(2);
        }
      });

      test('uses default tolerance from config when not specified', () => {
        const parser = new SvgParser();
        parser.config({ tolerance: 0.5 });
        
        const svgString = '<svg><line x1="0" y1="0" x2="10" y2="0"/><line x1="5" y1="0.3" x2="15" y2="0.3"/></svg>';
        
        parser.load(null, svgString, 72);
        const root = parser.root;
        
        if (root) {
          // Should use config tolerance (0.5)
          parser.performMergeOverlap(root);
          expect(root.querySelectorAll('line').length).toBe(1);
        }
      });

      test('handles multiple merge iterations', () => {
        const parser = new SvgParser();
        const svgString = '<svg><line x1="0" y1="0" x2="5" y2="0"/><line x1="3" y1="0" x2="8" y2="0"/><line x1="6" y1="0" x2="12" y2="0"/></svg>';
        
        parser.load(null, svgString, 72);
        const root = parser.root;
        
        if (root) {
          expect(root.querySelectorAll('line').length).toBe(3);
          
          parser.performMergeOverlap(root, 0.1);
          
          // Should merge all overlapping lines into one
          const lines = root.querySelectorAll('line');
          expect(lines.length).toBe(1);
          
          if (lines.length > 0) {
            const x1 = parseFloat(lines[0].getAttribute('x1') || '0');
            const x2 = parseFloat(lines[0].getAttribute('x2') || '0');
            expect(Math.min(x1, x2)).toBe(0);
            expect(Math.max(x1, x2)).toBe(12);
          }
        }
      });
    });
  });
});