# User Testing Guide - New SolidJS UI

This guide provides instructions for testing the new SolidJS UI and providing feedback during the migration phase.

## Quick Start

### Prerequisites
- Deepnest application installed
- Basic familiarity with the current Deepnest interface

### Testing the New UI

1. **Start with New UI**:
   ```bash
   npm run start:new
   ```

2. **Start with Legacy UI** (for comparison):
   ```bash
   npm run start:legacy
   ```

3. **Start with Debug Mode** (for detailed feedback):
   ```bash
   npm run start:new-debug
   ```

## Testing Scenarios

### Core Functionality Tests

#### 1. Parts Management
- [ ] **Import Parts**: Test importing SVG/DXF files
  - Try single file import
  - Try multiple file import via drag-and-drop
  - Test different file formats
  - Verify parts appear in parts list

- [ ] **Parts List Operations**:
  - Select individual parts
  - Multi-select parts (Ctrl+click)
  - Use keyboard shortcuts (Ctrl+A, Escape)
  - Edit part properties (quantity, rotation)
  - Delete parts

- [ ] **Parts Preview**:
  - Zoom in/out on parts
  - Pan around large parts
  - Verify part dimensions are correct

#### 2. Nesting Operations
- [ ] **Start Nesting**:
  - Configure nesting parameters
  - Start nesting process
  - Monitor progress updates
  - Verify real-time progress display

- [ ] **Nesting Results**:
  - View nesting results
  - Navigate between different results
  - Zoom and pan in result viewer
  - Export nesting results

#### 3. Sheets Configuration
- [ ] **Sheet Setup**:
  - Configure sheet dimensions
  - Set margins and spacing
  - Test different sheet materials
  - Verify sheet preview

#### 4. Settings & Presets
- [ ] **Settings Management**:
  - Modify algorithm settings
  - Change UI preferences
  - Test dark/light mode switching
  - Change language settings

- [ ] **Preset Operations**:
  - Create new presets
  - Edit existing presets
  - Delete presets
  - Import/export presets

### Advanced Features Tests

#### 5. User Interface
- [ ] **Navigation**:
  - Switch between tabs
  - Use keyboard shortcuts
  - Test responsive behavior
  - Verify internationalization

- [ ] **Interactions**:
  - Right-click for context menus
  - Use keyboard shortcuts
  - Test drag-and-drop operations
  - Verify tooltip functionality

#### 6. Performance
- [ ] **Large Datasets**:
  - Import 50+ parts
  - Test virtual scrolling
  - Monitor memory usage
  - Verify smooth scrolling

- [ ] **Real-time Updates**:
  - Monitor nesting progress
  - Verify background worker status
  - Test IPC communication reliability

## Comparison Testing

### Side-by-Side Comparison

For each test scenario, compare the new UI with the legacy UI:

1. **Run Legacy UI**: `npm run start:legacy`
2. **Perform test scenario**
3. **Run New UI**: `npm run start:new`
4. **Perform same test scenario**
5. **Document differences**

### Comparison Criteria

Rate each aspect from 1-5 (1 = Much Worse, 5 = Much Better):

- **Ease of Use**: How intuitive is the interface?
- **Performance**: How fast and responsive is the UI?
- **Visual Appeal**: How professional and polished does it look?
- **Functionality**: Are all features working as expected?
- **Stability**: How stable is the application?

## Feedback Collection

### Bug Reports

When you encounter issues, please document:

1. **Steps to Reproduce**:
   - Exact sequence of actions
   - Files used (if applicable)
   - Settings configuration

2. **Expected Behavior**:
   - What should have happened?

3. **Actual Behavior**:
   - What actually happened?
   - Include screenshots if helpful

4. **Environment**:
   - Operating system
   - UI version (new/legacy)
   - Console errors (if any)

### Feature Feedback

For feature requests or improvements:

1. **Feature Description**:
   - What feature would you like to see?
   - How would it improve your workflow?

2. **Use Case**:
   - Specific scenario where this would be helpful
   - How often would you use this feature?

3. **Priority**:
   - How important is this feature to you?

### Usability Feedback

For user experience feedback:

1. **Workflow Efficiency**:
   - Which tasks are faster/slower?
   - Which UI elements are confusing?

2. **Visual Design**:
   - What do you like/dislike about the appearance?
   - Are there accessibility issues?

3. **Learning Curve**:
   - How easy was it to adapt to the new UI?
   - What would help new users?

## Feedback Submission

### Using the Feedback Script

We've included a feedback collection script:

```bash
# Initialize feedback collection
npm run feedback:init

# Submit feedback
npm run feedback:submit

# View feedback summary
npm run feedback:show
```

### Manual Feedback

If you prefer to provide feedback manually:

1. **Create a GitHub Issue**:
   - Go to the project's GitHub repository
   - Create a new issue with the "UI Testing" label
   - Use the bug report or feature request template

2. **Send Email**:
   - Email feedback to the development team
   - Include screenshots and detailed descriptions

3. **Direct Communication**:
   - Contact the development team directly
   - Provide feedback via established communication channels

## Testing Checklist

Use this checklist to ensure comprehensive testing:

### Basic Functionality
- [ ] Application starts without errors
- [ ] All tabs are accessible
- [ ] Parts can be imported successfully
- [ ] Nesting operations work correctly
- [ ] Results can be exported
- [ ] Settings can be modified and saved

### User Experience
- [ ] Interface is intuitive and easy to navigate
- [ ] Visual design is professional and consistent
- [ ] Performance is acceptable for typical workflows
- [ ] Error messages are helpful and clear
- [ ] Help and documentation are accessible

### Compatibility
- [ ] Works with existing project files
- [ ] Presets from legacy UI can be imported
- [ ] Export formats are compatible
- [ ] Keyboard shortcuts work as expected

### Edge Cases
- [ ] Handles large files gracefully
- [ ] Manages memory efficiently with many parts
- [ ] Recovers from errors appropriately
- [ ] Maintains stability during long operations

## Known Issues

Current known issues (will be updated as testing progresses):

1. **Minor Issues**:
   - Some animations may not be perfectly smooth
   - Occasional minor UI glitches

2. **Limitations**:
   - Some advanced features may not be fully implemented yet
   - Performance optimization is ongoing

3. **Workarounds**:
   - If you encounter issues, try restarting the application
   - Clear browser cache if using development mode

## Support

### Getting Help

If you need help with testing:

1. **Check Documentation**:
   - Read the PARALLEL_UI_DEVELOPMENT.md guide
   - Review the user manual

2. **Ask for Support**:
   - Create a GitHub issue
   - Contact the development team
   - Join the testing discussion forum

### Reporting Urgent Issues

For critical issues that block testing:

1. **Immediate Contact**:
   - Email the development team immediately
   - Include "URGENT" in the subject line

2. **Detailed Information**:
   - Provide complete steps to reproduce
   - Include system information
   - Attach relevant files if safe to do so

## Thank You

Your feedback is invaluable for ensuring the new UI meets user needs and expectations. Thank you for participating in the testing process!

---

**Version**: 1.0  
**Last Updated**: July 2025  
**Next Review**: After initial testing phase completion