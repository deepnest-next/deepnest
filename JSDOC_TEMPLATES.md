# JSDoc Templates for Deepnest Project

## Overview

This document provides standardized JSDoc templates for different types of functions and classes in the Deepnest project. Use these templates to ensure consistent documentation style and completeness.

## Template Categories

### 1. Simple Utility Functions

**Use for**: Basic mathematical operations, simple transformations, getters/setters

```javascript
/**
 * Converts degrees to radians.
 * 
 * @param {number} degrees - Angle in degrees
 * @returns {number} Angle in radians
 * 
 * @example
 * const radians = degreesToRadians(90); // π/2
 * const radians = degreesToRadians(180); // π
 */
function degreesToRadians(degrees) {
  return degrees * (Math.PI / 180);
}
```

### 2. Geometric Functions

**Use for**: Point calculations, vector operations, coordinate transformations

```javascript
/**
 * Calculates the intersection point of two line segments.
 * 
 * Uses parametric line equations to find intersection point.
 * Returns null if lines are parallel or don't intersect.
 * 
 * @param {Point} p1 - First point of line 1
 * @param {Point} p2 - Second point of line 1
 * @param {Point} p3 - First point of line 2
 * @param {Point} p4 - Second point of line 2
 * @returns {Point|null} Intersection point or null if no intersection
 * 
 * @example
 * const intersection = lineIntersect(
 *   {x: 0, y: 0}, {x: 10, y: 0},
 *   {x: 5, y: -5}, {x: 5, y: 5}
 * ); // {x: 5, y: 0}
 * 
 * @example
 * // Parallel lines return null
 * const noIntersection = lineIntersect(
 *   {x: 0, y: 0}, {x: 10, y: 0},
 *   {x: 0, y: 5}, {x: 10, y: 5}
 * ); // null
 */
function lineIntersect(p1, p2, p3, p4) {
  // Implementation here
}
```

### 3. Complex Algorithm Functions

**Use for**: NFP calculations, genetic algorithms, optimization functions

```javascript
/**
 * Computes No-Fit Polygon using orbital method for collision-free placement.
 * 
 * The NFP represents all valid positions where polygon B can be placed
 * relative to polygon A without overlapping. The algorithm works by
 * "orbiting" polygon B around polygon A while maintaining contact,
 * recording the translation vectors at each step.
 * 
 * @param {Polygon} A - Static polygon (container or previously placed part)
 * @param {Polygon} B - Moving polygon (part to be placed)
 * @param {boolean} inside - If true, B orbits inside A; if false, outside
 * @param {boolean} searchEdges - If true, explores all A edges for multiple NFPs
 * @returns {Polygon[]|null} Array of NFP polygons, or null if invalid input
 * 
 * @example
 * // Basic outer NFP calculation
 * const nfp = noFitPolygon(container, part, false, false);
 * if (nfp && nfp.length > 0) {
 *   console.log(`Found ${nfp[0].length} valid positions`);
 * }
 * 
 * @example
 * // Find all possible NFPs for complex shapes
 * const allNfps = noFitPolygon(container, part, false, true);
 * allNfps.forEach((nfp, index) => {
 *   console.log(`NFP ${index} has ${nfp.length} positions`);
 * });
 * 
 * @algorithm
 * 1. Initialize contact by placing B at A's lowest point
 * 2. While not returned to starting position:
 *    a. Find all touching vertices/edges (3 contact types)
 *    b. Generate translation vectors from contact geometry
 *    c. Select vector with maximum safe slide distance
 *    d. Move B along selected vector
 *    e. Add new position to NFP
 * 3. Close polygon and return result
 * 
 * @performance
 * - Time Complexity: O(n×m×k) where n,m are vertex counts, k is orbit iterations
 * - Space Complexity: O(n+m) for contact point storage
 * - Typical Runtime: 5-50ms for parts with 10-100 vertices
 * - Memory Usage: ~1KB per 100 vertices
 * 
 * @mathematical_background
 * Based on Minkowski difference concept from computational geometry.
 * Uses vector algebra for slide distance calculation and geometric
 * predicates for contact detection. The orbital method ensures
 * complete coverage of the feasible placement region.
 * 
 * @see {@link noFitPolygonRectangle} for optimized rectangular case
 * @see {@link slideDistance} for distance calculation details
 * @since 1.5.6
 */
function noFitPolygon(A, B, inside, searchEdges) {
  // Implementation here
}
```

### 4. Class Documentation

**Use for**: Main classes, data structures, interfaces

```javascript
/**
 * Represents a 2D point with utility methods for geometric calculations.
 * 
 * Core data structure used throughout the nesting engine for representing
 * polygon vertices, transformation origins, and geometric calculations.
 * Provides methods for distance calculation, transformations, and
 * vector operations.
 * 
 * @class
 * @example
 * // Basic point creation and operations
 * const point = new Point(10, 20);
 * const distance = point.distanceTo(new Point(0, 0)); // 22.36
 * const midpoint = point.midpoint(new Point(20, 30)); // Point(15, 25)
 * 
 * @example
 * // Using points in geometric calculations
 * const vertices = [
 *   new Point(0, 0),
 *   new Point(10, 0),
 *   new Point(10, 10),
 *   new Point(0, 10)
 * ];
 * const polygon = new Polygon(vertices);
 */
class Point {
  /**
   * Creates a new Point instance.
   * 
   * @param {number} x - The x coordinate
   * @param {number} y - The y coordinate
   * @throws {Error} If either coordinate is NaN
   * 
   * @example
   * const origin = new Point(0, 0);
   * const point = new Point(10.5, -20.3);
   */
  constructor(x, y) {
    // Implementation here
  }
}
```

### 5. Event Handlers and Callbacks

**Use for**: IPC handlers, event listeners, async callbacks

```javascript
/**
 * Handles IPC message for starting nesting operation.
 * 
 * Receives nesting parameters from renderer process, validates input,
 * and initiates background nesting calculation. Progress updates are
 * sent back to renderer via IPC events.
 * 
 * @param {IpcMainEvent} event - IPC event object
 * @param {NestingParams} params - Nesting configuration parameters
 * @param {Part[]} params.parts - Array of parts to nest
 * @param {Sheet[]} params.sheets - Available sheets/containers
 * @param {Object} params.config - Nesting algorithm configuration
 * @returns {Promise<void>} Resolves when nesting operation completes
 * 
 * @example
 * // Renderer process sends nesting request
 * ipcRenderer.invoke('start-nesting', {
 *   parts: partArray,
 *   sheets: sheetArray,
 *   config: { rotations: 4, populationSize: 20 }
 * });
 * 
 * @fires progress - Emitted periodically with nesting progress
 * @fires complete - Emitted when nesting operation finishes
 * @fires error - Emitted if nesting operation fails
 * 
 * @async
 * @since 1.5.6
 */
async function handleStartNesting(event, params) {
  // Implementation here
}
```

### 6. Configuration Objects and Types

**Use for**: Configuration interfaces, parameter objects, type definitions

```javascript
/**
 * Configuration options for the genetic algorithm optimizer.
 * 
 * @typedef {Object} GeneticConfig
 * @property {number} populationSize - Number of individuals in population (20-100)
 * @property {number} mutationRate - Mutation probability 0-100 (10-20 recommended)
 * @property {number} generations - Maximum generations (50-500)
 * @property {number} rotations - Number of discrete rotation angles (1-8)
 * @property {boolean} elitism - Whether to preserve best individual
 * @property {number} [crossoverRate=0.8] - Crossover probability 0-1
 * @property {string} [selectionMethod='tournament'] - Selection method
 * 
 * @example
 * const config = {
 *   populationSize: 50,
 *   mutationRate: 15,
 *   generations: 200,
 *   rotations: 4,
 *   elitism: true
 * };
 * 
 * @example
 * // Quick optimization for small problems
 * const quickConfig = {
 *   populationSize: 20,
 *   mutationRate: 10,
 *   generations: 50,
 *   rotations: 2,
 *   elitism: true
 * };
 */

/**
 * Represents a part to be nested with geometric and metadata properties.
 * 
 * @typedef {Object} Part
 * @property {string} id - Unique identifier for the part
 * @property {Polygon} polygon - Geometric shape as array of points
 * @property {number} [rotation=0] - Current rotation angle in degrees
 * @property {number} [quantity=1] - Number of copies to nest
 * @property {Object} [metadata] - Additional part information
 * @property {string} [metadata.material] - Material type
 * @property {number} [metadata.thickness] - Material thickness
 * @property {boolean} [metadata.allowRotation=true] - Whether part can be rotated
 */
```

### 7. Error Handling Functions

**Use for**: Validation functions, error processing, exception handling

```javascript
/**
 * Validates polygon geometry for nesting operations.
 * 
 * Checks polygon for common issues that can cause nesting failures:
 * - Insufficient vertices (< 3)
 * - Self-intersections
 * - Duplicate consecutive vertices
 * - Clockwise orientation (should be counter-clockwise)
 * 
 * @param {Polygon} polygon - Polygon to validate
 * @returns {ValidationResult} Object containing validation status and errors
 * 
 * @example
 * const result = validatePolygon(partPolygon);
 * if (!result.valid) {
 *   console.error('Polygon validation failed:', result.errors);
 *   return;
 * }
 * 
 * @example
 * // Batch validation
 * const parts = [poly1, poly2, poly3];
 * const invalidParts = parts.filter(p => !validatePolygon(p).valid);
 * 
 * @typedef {Object} ValidationResult
 * @property {boolean} valid - Whether polygon passes validation
 * @property {string[]} errors - Array of error messages
 * @property {string[]} warnings - Array of warning messages
 * 
 * @throws {TypeError} If polygon is not an array
 * @since 1.5.6
 */
function validatePolygon(polygon) {
  // Implementation here
}
```

### 8. Performance-Critical Functions

**Use for**: Hot path functions, optimized algorithms, bottleneck operations

```javascript
/**
 * Calculates slide distance for NFP orbital method (performance-critical).
 * 
 * This function is called thousands of times during NFP generation and
 * is heavily optimized for performance. Uses squared distances to avoid
 * expensive square root calculations where possible.
 * 
 * @param {Point} A1 - First point of line A
 * @param {Point} A2 - Second point of line A  
 * @param {Point} B1 - First point of line B
 * @param {Point} B2 - Second point of line B
 * @param {Vector} direction - Direction vector for sliding
 * @returns {number} Maximum safe slide distance
 * 
 * @example
 * const maxSlide = slideDistance(
 *   {x: 0, y: 0}, {x: 10, y: 0},
 *   {x: 5, y: 5}, {x: 5, y: -5},
 *   {x: 1, y: 0}
 * );
 * 
 * @performance
 * - Time: O(1) - constant time operation
 * - Called: ~1000x per NFP generation
 * - Optimized: Uses squared distances, avoids Math.sqrt
 * - Memory: Stack allocation only, no heap allocations
 * 
 * @algorithm
 * Uses parametric line equations to find intersection point,
 * then calculates distance along direction vector.
 * 
 * @hot_path This function is performance-critical
 * @since 1.5.6
 */
function slideDistance(A1, A2, B1, B2, direction) {
  // Highly optimized implementation
}
```

## Usage Guidelines

### When to Use Each Template

1. **Simple Utility**: Mathematical functions, converters, basic getters/setters
2. **Geometric**: Point/vector operations, coordinate transformations
3. **Complex Algorithm**: NFP, genetic algorithms, optimization functions
4. **Class**: Main classes, data structures, constructors
5. **Event Handler**: IPC handlers, event listeners, async operations
6. **Configuration**: Type definitions, parameter objects, interfaces
7. **Error Handling**: Validation, error processing, exception handling
8. **Performance-Critical**: Hot path functions, optimized algorithms

### Documentation Standards

#### Required Elements
- [ ] Brief description (one line)
- [ ] Detailed description (2-3 sentences)
- [ ] All parameters documented with types
- [ ] Return value documented
- [ ] At least one example

#### Optional Elements (Use When Applicable)
- [ ] Multiple examples for complex functions
- [ ] Algorithm description for complex logic
- [ ] Performance characteristics
- [ ] Mathematical background
- [ ] Error conditions and throws
- [ ] See also references
- [ ] Since version

#### Special Annotations
- `@hot_path` - Performance-critical functions
- `@algorithm` - Algorithm description
- `@performance` - Performance characteristics
- `@mathematical_background` - Mathematical concepts
- `@fires` - Events emitted
- `@async` - Asynchronous functions

### Code Examples in Documentation

#### Good Examples
```javascript
// Shows realistic usage
const result = calculateDistance(point1, point2);

// Shows error handling
try {
  const nfp = noFitPolygon(container, part, false, false);
} catch (error) {
  console.error('NFP calculation failed:', error);
}

// Shows configuration
const config = { rotations: 4, populationSize: 20 };
```

#### Avoid
```javascript
// Too simplistic
const x = func(a, b);

// Unrealistic parameters
const result = func(undefined, null, "test");
```

## Integration with Development Workflow

### Pre-commit Hooks
```bash
# Add to .git/hooks/pre-commit
npx eslint --rule "require-jsdoc: error" src/
```

### ESLint Configuration
```json
{
  "rules": {
    "require-jsdoc": ["error", {
      "require": {
        "FunctionDeclaration": true,
        "MethodDefinition": true,
        "ClassDeclaration": true
      }
    }],
    "valid-jsdoc": ["error", {
      "requireReturn": false,
      "requireReturnDescription": true,
      "requireParamDescription": true
    }]
  }
}
```

This template system ensures consistent, comprehensive documentation across the entire Deepnest codebase while providing appropriate detail for different types of functions and complexity levels.