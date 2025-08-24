# Deepnest Documentation

## Overview

This directory contains generated API documentation and development guides for the Deepnest project.

## Documentation Generation

### Prerequisites

Install JSDoc and related tools:

```bash
npm install -g jsdoc jsdoc-to-markdown eslint-plugin-jsdoc
```

### Generate HTML Documentation

```bash
# Generate complete HTML API documentation
npm run docs:generate

# Serve documentation locally at http://localhost:8080
npm run docs:serve
```

### Generate Markdown Documentation

```bash
# Generate markdown API reference
npm run docs:markdown
```

### Validate Documentation

```bash
# Check JSDoc completeness and syntax
npm run docs:validate
```

## Documentation Structure

```
docs/
├── api/                    # Generated HTML documentation
├── guides/                 # Developer guides and tutorials
├── examples/              # Code examples and usage patterns
├── API.md                 # Generated markdown API reference
└── README.md              # This file
```

## Documentation Standards

### Required Documentation

All public functions must have:
- Brief description (one line)
- Detailed description (2-3 sentences)
- Parameter documentation with types
- Return value documentation
- At least one usage example

### Optional Documentation

For complex functions, include:
- Multiple examples showing different use cases
- Algorithm descriptions
- Performance characteristics
- Mathematical background
- Cross-references to related functions

### JSDoc Tags

#### Standard Tags
- `@param {type} name - Description`
- `@returns {type} Description`
- `@throws {ErrorType} Description`
- `@example`
- `@since version`
- `@see {@link RelatedFunction}`

#### Custom Tags
- `@algorithm` - Algorithm description
- `@performance` - Performance characteristics
- `@mathematical_background` - Mathematical concepts
- `@hot_path` - Performance-critical functions

### Examples

#### Simple Function
```javascript
/**
 * Calculates the distance between two points.
 * 
 * @param {Point} p1 - First point
 * @param {Point} p2 - Second point
 * @returns {number} Euclidean distance
 * 
 * @example
 * const distance = calculateDistance({x: 0, y: 0}, {x: 3, y: 4}); // 5
 */
```

#### Complex Algorithm
```javascript
/**
 * Computes No-Fit Polygon using orbital method.
 * 
 * The NFP represents all valid positions where polygon B can be placed
 * relative to polygon A without overlapping.
 * 
 * @param {Polygon} A - Static polygon
 * @param {Polygon} B - Moving polygon
 * @returns {Polygon[]|null} Array of NFP polygons
 * 
 * @example
 * const nfp = noFitPolygon(container, part, false, false);
 * 
 * @algorithm
 * 1. Initialize contact at A's lowest point
 * 2. Orbit B around A maintaining contact
 * 3. Record translation vectors
 * 
 * @performance O(n×m×k) time complexity
 * @mathematical_background Based on Minkowski difference
 */
```

## Development Workflow

### Adding Documentation

1. Write JSDoc comments for new functions
2. Follow the established templates and patterns
3. Include realistic examples
4. Run validation: `npm run docs:validate`
5. Generate docs: `npm run docs:generate`

### Documentation Review

Before committing code with new functions:

1. Ensure all public functions are documented
2. Check examples are executable and accurate
3. Verify cross-references are valid
4. Run documentation generation to check for errors

### Continuous Integration

The following checks run automatically:

- JSDoc syntax validation
- Documentation completeness check
- Example validation
- Cross-reference verification

## Troubleshooting

### Common Issues

#### Missing JSDoc Dependencies
```bash
npm install -g jsdoc jsdoc-to-markdown
```

#### Documentation Generation Fails
- Check JSDoc syntax with `npm run lint:jsdoc`
- Verify file paths in `jsdoc.conf.json`
- Check for circular dependencies in `@see` tags

#### Examples Don't Work
- Test examples in isolation
- Verify variable names and types
- Check import/require statements

### Getting Help

- Check the [JSDoc documentation](https://jsdoc.app/)
- Review existing well-documented files like `main/util/HullPolygon.ts`
- Consult the templates in `JSDOC_TEMPLATES.md`

## Contributing

### Documentation Priorities

1. **High Priority**: Core algorithms (NFP, genetic algorithm, placement)
2. **Medium Priority**: Utility functions and helper classes
3. **Low Priority**: Internal/private functions

### Quality Standards

- 90%+ documentation coverage for public functions
- All examples must be executable
- Performance notes for algorithms with O(n²) or higher complexity
- Mathematical background for geometric functions

### Review Process

1. Document functions using appropriate templates
2. Test examples for accuracy
3. Generate documentation locally
4. Submit for review with documentation diff
5. Address feedback and regenerate docs