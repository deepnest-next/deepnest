import { test, expect } from '@playwright/test';
import { SvgParser } from '../build/svgparser.js';

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

    // Note: allowedElements, polygonElements, and dirPath will be tested 
    // when those properties are added in subsequent migration steps
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
});