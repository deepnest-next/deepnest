# SVG Parser TypeScript Migration Plan

## Overview
This document outlines the systematic migration of `main/svgparser.js` to TypeScript, converting each function individually with comprehensive testing and documentation.

## Current Analysis
- **Total Functions**: 38 functions in the SvgParser class
- **Dependencies**: Matrix, Point, GeometryUtil, DOMParser
- **Core Purpose**: SVG parsing and geometric processing for CAD/CAM applications

## Migration Strategy

### Phase 1: Infrastructure Setup
- [ ] Create TypeScript interfaces for SVG elements and geometry
- [ ] Set up type definitions for external dependencies
- [ ] Configure TypeScript compilation for the parser

### Phase 2: Core Function Migration (Individual Steps)

#### Step 1: Constructor and Configuration
- [ ] Convert `constructor()` to TypeScript
- [ ] Add type annotations for configuration object
- [ ] Convert `config()` method
- [ ] **Test**: Configuration object validation
- [ ] **Document**: Class initialization and configuration options

#### Step 2: SVG Loading and Parsing
- [ ] Convert `load()` method to TypeScript
- [ ] Add types for SVG loading parameters
- [ ] Handle DOMParser typing
- [ ] **Test**: SVG string parsing with various formats
- [ ] **Document**: SVG loading process and scaling logic

#### Step 3: Transform Processing
- [ ] Convert `transformParse()` method
- [ ] Convert `applyTransform()` method (complex - handles multiple SVG elements)
- [ ] Add transform matrix typing
- [ ] **Test**: Transform application on different SVG elements
- [ ] **Document**: Transform processing and coordinate normalization

#### Step 4: Preprocessing Methods
- [ ] Convert `cleanInput()` method
- [ ] Convert `flatten()` method
- [ ] Convert `filter()` method
- [ ] Convert `imagePaths()` method
- [ ] **Test**: SVG preprocessing pipeline
- [ ] **Document**: SVG cleanup and preparation process

#### Step 5: Path Utility Methods
- [x] Convert `pathToAbsolute()` method
- [x] Convert `getEndpoints()` method
- [x] Convert `isClosed()` method
- [x] **Test**: Path coordinate conversion and endpoint detection
- [x] **Document**: Path coordinate systems and closure detection

#### Step 6: Path Manipulation Methods
- [x] Convert `splitPath()` method (already implemented in Step 4)
- [x] Convert `recurse()` method (already implemented in Step 4)
- [x] Convert `reverseOpenPath()` method
- [x] Convert `mergeOpenPaths()` method
- [x] **Test**: Path splitting and reversal operations
- [x] **Document**: Path manipulation algorithms

#### Step 7: Path Merging Logic
- [ ] Convert `getCoincident()` method
- [ ] Convert `mergeLines()` method (complex - handles path merging)
- [ ] Convert `mergeOpenPaths()` method
- [ ] **Test**: Path merging and coincidence detection
- [ ] **Document**: Path merging algorithms and tolerance handling

#### Step 8: Path Segmentation
- [ ] Convert `splitLines()` method
- [ ] Convert `splitPathSegments()` method
- [ ] Convert `mergeOverlap()` method (complex - overlap detection)
- [ ] **Test**: Path segmentation and overlap handling
- [ ] **Document**: Line segmentation and overlap resolution

#### Step 9: Shape Conversion Methods
- [ ] Convert `polygonify()` method (handles multiple SVG element types)
- [ ] Convert `polygonifyPath()` method (complex - handles all path commands)
- [ ] **Test**: Shape to polygon conversion for all SVG element types
- [ ] **Document**: Polygon conversion algorithms and tolerance handling

### Phase 3: Type Definitions

#### Core Types
```typescript
interface SvgParserConfig {
  tolerance: number;
  toleranceSvg: number;
  scale: number;
  endpointTolerance: number;
}

interface Point {
  x: number;
  y: number;
}

interface PathEndpoints {
  start: Point;
  end: Point;
}

interface CoincidentPath {
  path: SVGElement;
  reverse1: boolean;
  reverse2: boolean;
}

type SVGElementType = 'svg' | 'circle' | 'ellipse' | 'path' | 'polygon' | 'polyline' | 'rect' | 'image' | 'line';
```

#### Method Signatures
- Each method will have explicit parameter and return types
- Optional parameters will be properly typed
- Error handling will use proper TypeScript patterns

### Phase 4: Testing Strategy

#### Unit Tests per Function
1. **Configuration Tests**: Valid/invalid config objects
2. **Loading Tests**: Various SVG formats, scaling, units
3. **Transform Tests**: Matrix transformations, coordinate conversions
4. **Path Tests**: Path parsing, splitting, merging
5. **Shape Tests**: Polygon conversion for all element types
6. **Edge Cases**: Empty paths, degenerate shapes, precision limits

#### Integration Tests
1. **Full Pipeline**: SVG string → processed shapes
2. **Error Handling**: Malformed SVG, invalid transforms
3. **Performance**: Large SVG files, complex paths

### Phase 5: Documentation Requirements

#### Function Documentation
Each function must include:
- Purpose and algorithm description
- Parameter explanations with types
- Return value documentation
- Error conditions and handling
- Usage examples
- Complexity analysis for geometric algorithms

#### Complex Logic Documentation
Special attention to:
- Bezier curve linearization
- Arc processing
- Transform matrix operations
- Path merging algorithms
- Tolerance-based geometric comparisons

## Implementation Timeline

### Commit Strategy
- **One commit per step** (38 total commits)
- Each commit includes: conversion + tests + documentation
- Commit message format: `feat: convert [method-name] to TypeScript`
- Update this plan after each step completion

### Step Status Tracking
- [x] Step 1: Constructor and Configuration (✅ Complete - Commit: b31e2f6)
- [x] Step 2: SVG Loading and Parsing (✅ Complete - Commit: f6be3b1)
- [x] Step 3: Transform Processing (✅ Complete - Commit: 4515701)
- [x] Step 4: Preprocessing Methods (✅ Complete - Commit: 4f2bf84)
- [x] Step 5: Path Utility Methods (✅ Complete - Commit: fb17ea4)
- [x] Step 6: Path Manipulation Methods (✅ Complete - Commit: 78cfc40)
- [ ] Step 7: Path Merging Logic
- [ ] Step 8: Path Segmentation
- [ ] Step 9: Shape Conversion Methods

## Success Criteria
1. All 38 functions converted to TypeScript with proper typing
2. 100% test coverage for each function
3. Comprehensive documentation for all methods
4. No regression in functionality
5. Type safety improvements catch potential runtime errors
6. Performance maintained or improved

## Risk Mitigation
- Incremental conversion reduces risk of breaking changes
- Comprehensive testing ensures functionality preservation
- Documentation improves maintainability
- Type safety reduces future bugs

## Dependencies to Address
- Matrix class typing
- Point class typing
- GeometryUtil class typing
- Browser DOM API typing
- SVG-specific DOM extensions