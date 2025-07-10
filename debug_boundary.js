// Simple debug script to test boundary condition logic
const vm = require('vm');
const fs = require('fs');

// Load the geometryutil module
const geometryCode = fs.readFileSync('./main/util/geometryutil.js', 'utf8');
const context = { console: console };
vm.createContext(context);
vm.runInContext(geometryCode, context);
const GeometryUtil = context.GeometryUtil;

// Test case 1: 1000x1000 part in 1000x1000 sheet
const sheet1000 = [
  { x: 0, y: 0 },
  { x: 1000, y: 0 },
  { x: 1000, y: 1000 },
  { x: 0, y: 1000 }
];

const part1000 = [
  { x: 0, y: 0 },
  { x: 1000, y: 0 },
  { x: 1000, y: 1000 },
  { x: 0, y: 1000 }
];

// Test case 2: 100x100 part in 1000x1000 sheet
const sheet1000_2 = [
  { x: 0, y: 0 },
  { x: 1000, y: 0 },
  { x: 1000, y: 1000 },
  { x: 0, y: 1000 }
];

const part100 = [
  { x: 0, y: 0 },
  { x: 100, y: 0 },
  { x: 100, y: 100 },
  { x: 0, y: 100 }
];

console.log('=== Testing Boundary Conditions ===');

// Test exact fit case
console.log('\n1. Testing 1000x1000 part in 1000x1000 sheet:');
console.log('Sheet is rectangle:', GeometryUtil.isRectangle(sheet1000));
console.log('Part is rectangle:', GeometryUtil.isRectangle(part1000));

const nfp1 = GeometryUtil.noFitPolygonRectangle(sheet1000, part1000);
console.log('NFP from noFitPolygonRectangle:', nfp1);

const nfp2 = GeometryUtil.noFitPolygon(sheet1000, part1000, false, false);
console.log('NFP from noFitPolygon:', nfp2);

// Test 100 parts case
console.log('\n2. Testing 100x100 part in 1000x1000 sheet:');
const nfp3 = GeometryUtil.noFitPolygonRectangle(sheet1000_2, part100);
console.log('NFP from noFitPolygonRectangle:', nfp3);

const nfp4 = GeometryUtil.noFitPolygon(sheet1000_2, part100, false, false);
console.log('NFP from noFitPolygon:', nfp4);

// Let's also test the calculations manually
console.log('\n3. Manual calculation for exact fit case:');
const minAx = Math.min(...sheet1000.map(p => p.x));
const maxAx = Math.max(...sheet1000.map(p => p.x));
const minAy = Math.min(...sheet1000.map(p => p.y));
const maxAy = Math.max(...sheet1000.map(p => p.y));

const minBx = Math.min(...part1000.map(p => p.x));
const maxBx = Math.max(...part1000.map(p => p.x));
const minBy = Math.min(...part1000.map(p => p.y));
const maxBy = Math.max(...part1000.map(p => p.y));

console.log('Sheet bounds:', { minAx, maxAx, minAy, maxAy });
console.log('Part bounds:', { minBx, maxBx, minBy, maxBy });
console.log('Sheet dimensions:', { width: maxAx - minAx, height: maxAy - minAy });
console.log('Part dimensions:', { width: maxBx - minBx, height: maxBy - minBy });

const nfpMinX = minAx - minBx + part1000[0].x;
const nfpMaxX = maxAx - maxBx + part1000[0].x;
const nfpMinY = minAy - minBy + part1000[0].y;
const nfpMaxY = maxAy - maxBy + part1000[0].y;

console.log('NFP bounds:', { nfpMinX, nfpMaxX, nfpMinY, nfpMaxY });
console.log('NFP dimensions:', { width: nfpMaxX - nfpMinX, height: nfpMaxY - nfpMinY });

// Test area calculation for the tiny NFP
const tinyNfp = [
  { x: 0, y: 0 },
  { x: 1e-9, y: 0 },
  { x: 1e-9, y: 1e-9 },
  { x: 0, y: 1e-9 }
];

console.log('Tiny NFP area:', GeometryUtil.polygonArea(tinyNfp));
console.log('Tiny NFP area (abs):', Math.abs(GeometryUtil.polygonArea(tinyNfp)));
console.log('Tiny NFP area (negative):', -GeometryUtil.polygonArea(tinyNfp));