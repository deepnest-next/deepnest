const { polygonArea, polygonCentroid, polygonHull, polygonContains, polygonLength } = require('./d3-polygon.js');

// Test data
const samplePolygon = [
  [0, 0],
  [0, 10],
  [10, 10],
  [10, 0]
];

// Function to log resource usage
function logResourceUsage(func, args, funcName) {
  console.log(`\nTesting: ${funcName}`);

  // Log memory usage before execution
  const memoryBefore = process.memoryUsage();
  console.log('Memory Before Execution:', memoryBefore);

  // Time the function
  console.time('Execution Time');
  const result = func(...args);
  console.timeEnd('Execution Time');

  // Log memory usage after execution
  const memoryAfter = process.memoryUsage();
  console.log('Memory After Execution:', memoryAfter);

  console.log('Result:', result);
}

// Test specific functions
logResourceUsage(polygonArea, [samplePolygon], 'polygonArea');
logResourceUsage(polygonCentroid, [samplePolygon], 'polygonCentroid');
logResourceUsage(polygonHull, [samplePolygon], 'polygonHull');
logResourceUsage(polygonLength, [samplePolygon], 'polygonLength');
