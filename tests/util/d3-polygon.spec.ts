import { test, expect } from '@playwright/test';
import { polygonArea } from '../../../deepnest/main/util/d3-polygon';

test.describe('d3-polygon utility', () => {
  test('calculates the area of a polygon correctly', async () => {
    const polygon = [
        [0, 0],
        [4, 0],
        [4, 3],
        [0, 3],
      ];
      

    console.log('Polygon Input:', polygon);
    const area = polygonArea(polygon);
    console.log('Calculated Area:', area);
    expect(area).toBeCloseTo(12); // Expect the area of a rectangle 4x3
  });
});
