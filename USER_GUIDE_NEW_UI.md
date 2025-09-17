# User Guide - New Deepnest UI

Welcome to the new Deepnest interface! This guide will help you understand the improvements and learn how to use the enhanced features.

## What's New

### Major Improvements

- **🌍 Multi-language Support**: Interface available in English, German, French, Spanish, and more
- **🎨 Modern Design**: Clean, professional interface with improved accessibility
- **⚡ Better Performance**: Faster loading, smoother scrolling, and optimized memory usage
- **⌨️ Keyboard Shortcuts**: Comprehensive keyboard navigation and shortcuts
- **🖱️ Context Menus**: Right-click for quick actions throughout the interface
- **📱 Responsive Design**: Better adaptation to different screen sizes
- **🌙 Improved Dark Mode**: Enhanced dark theme with better contrast
- **♿ Accessibility**: Screen reader support, keyboard navigation, and ARIA labels

### Technical Improvements

- **67% Smaller Bundle Size**: Faster loading and better performance
- **Virtual Scrolling**: Handle thousands of parts without performance issues
- **Memory Management**: Automatic cleanup prevents memory leaks
- **Real-time Updates**: Improved progress tracking and status updates
- **Error Handling**: Better error messages and recovery options

## Getting Started

### Switching Between UIs

You can easily switch between the new and legacy UI:

```bash
# Use new UI
npm run start:new

# Use legacy UI (for comparison)
npm run start:legacy

# Use new UI with debug console
npm run start:new-debug
```

Or set environment variable:
```bash
deepnest_new_ui=1 npm start
```

### First Time Setup

1. **Language Selection**: Choose your preferred language from the language dropdown in the header
2. **Theme Preference**: Toggle between light and dark mode using the theme button
3. **Import Your Projects**: Your existing files and presets are fully compatible

## Interface Overview

### Header
- **App Title**: Shows current version and build information
- **Language Selector**: Switch between supported languages
- **Theme Toggle**: Switch between light and dark modes
- **Help Button**: Access keyboard shortcuts and documentation

### Navigation Tabs
- **Parts**: Manage imported parts and their properties
- **Nests**: View nesting results and progress
- **Sheets**: Configure material sheets and dimensions
- **Settings**: Adjust algorithm parameters and preferences
- **Files**: Import/export operations and recent files
- **Imprint**: About information and legal notices

### Main Content Area
- **Resizable Panels**: Drag panel borders to resize
- **Context-Sensitive Content**: Changes based on active tab
- **Real-time Updates**: Live progress and status information

### Status Bar
- **Connection Status**: IPC communication status
- **Progress Indicator**: Current operation progress
- **Memory Usage**: Real-time memory monitoring (debug mode)

## Key Features Guide

### Parts Management

#### Importing Parts
1. **Drag and Drop**: Simply drag SVG/DXF files into the Parts panel
2. **File Browser**: Click "Import" to use the file browser
3. **Batch Import**: Select multiple files at once for bulk import

#### Working with Parts
- **Select Parts**: Click to select, Ctrl+click for multi-select
- **Edit Properties**: Right-click for context menu or use the properties panel
- **Search and Filter**: Use the search box to find specific parts
- **Sort**: Click column headers to sort by different criteria

#### Keyboard Shortcuts
- `Ctrl+A`: Select all parts
- `Ctrl+I`: Import parts
- `Delete`: Remove selected parts
- `Ctrl+D`: Duplicate selected parts
- `Arrow Keys`: Navigate through parts list

### Nesting Operations

#### Starting a Nest
1. Select parts in the Parts panel
2. Configure sheet dimensions in the Sheets panel
3. Adjust algorithm settings in Settings panel
4. Click "Start Nesting" in the Nesting panel

#### Monitoring Progress
- **Real-time Progress Bar**: Shows completion percentage
- **Live Preview**: See intermediate results as they develop
- **Background Status**: Monitor worker thread status
- **Detailed Statistics**: View efficiency metrics and part placement

#### Viewing Results
- **Results Grid**: Thumbnail view of all nesting results
- **Detailed Viewer**: Zoom and pan for detailed inspection
- **Export Options**: Save results in various formats

### Advanced Features

#### Context Menus
Right-click on items throughout the interface for quick actions:
- **Parts**: Duplicate, delete, edit properties, export
- **Results**: Export, view details, set as preferred
- **Sheets**: Edit dimensions, duplicate configuration

#### Keyboard Navigation
- **Tab Navigation**: Use Tab to move between interface elements
- **Arrow Keys**: Navigate lists and grids
- **Enter**: Activate buttons and confirm actions
- **Escape**: Close dialogs and cancel operations

#### Virtual Scrolling
For large projects with many parts:
- Smooth scrolling regardless of list size
- Automatic optimization for performance
- Consistent responsiveness with thousands of items

## Language and Localization

### Supported Languages
- **English** (en)
- **German** (de)
- **French** (fr)
- **Spanish** (es)
- **Italian** (it)
- **Portuguese** (pt)
- **Russian** (ru)
- **Japanese** (ja)
- **Chinese** (zh)
- **Korean** (ko)

### Changing Language
1. Click the language dropdown in the header
2. Select your preferred language
3. The interface will update immediately
4. Your preference is saved automatically

### Regional Settings
- **Number Formats**: Automatically adapt to your locale
- **Date Formats**: Display dates according to your region
- **Measurement Units**: Support for metric and imperial units

## Performance Features

### Virtual Scrolling
When working with large numbers of parts:
- Lists automatically switch to virtual scrolling
- Only visible items are rendered
- Smooth scrolling maintained regardless of list size
- Memory usage stays constant

### Memory Management
The new UI includes advanced memory management:
- Automatic cleanup of unused resources
- Memory usage monitoring
- Garbage collection optimization
- Prevention of memory leaks

### Bundle Optimization
- **Code Splitting**: Components load only when needed
- **Lazy Loading**: Images and heavy components load on demand
- **Optimized Bundles**: Smaller file sizes for faster loading
- **Caching**: Efficient caching for repeated operations

## Accessibility Features

### Keyboard Navigation
- **Full Keyboard Support**: Navigate entire interface without mouse
- **Tab Order**: Logical tab sequence through all elements
- **Focus Indicators**: Clear visual focus indicators
- **Keyboard Shortcuts**: Comprehensive shortcut system

### Screen Reader Support
- **ARIA Labels**: Descriptive labels for all interface elements
- **Live Regions**: Announce dynamic content changes
- **Semantic HTML**: Proper heading structure and landmarks
- **Alt Text**: Descriptive text for all images and icons

### Visual Accessibility
- **High Contrast**: Dark mode with improved contrast ratios
- **Scalable Text**: Support for browser zoom and text scaling
- **Color Independence**: Interface works without color perception
- **Focus Indicators**: Clear visual focus for keyboard navigation

## Troubleshooting

### Common Issues

#### Interface Not Loading
1. Check if new UI is enabled: `deepnest_new_ui=1`
2. Verify the build is complete: `npm run build:frontend`
3. Try clearing browser cache if in development mode
4. Check console for error messages: `npm run start:new-debug`

#### Performance Issues
1. Close other resource-intensive applications
2. Check available memory
3. Use virtual scrolling for large lists (automatic)
4. Consider reducing the number of loaded parts

#### Missing Features
1. Check if feature exists in Settings panel
2. Verify you're using the latest version
3. Some advanced features may be in different locations
4. Consult the comparison guide for feature mapping

### Getting Help

#### Built-in Help
- **Keyboard Shortcuts**: Press `?` or `F1` to view shortcuts
- **Tooltips**: Hover over interface elements for descriptions
- **Context Help**: Right-click for context-specific options

#### Documentation
- **User Guide**: This document (accessible via Help menu)
- **Developer Documentation**: Technical information for customization
- **Migration Guide**: For users transitioning from legacy UI

#### Support Channels
- **GitHub Issues**: Report bugs and feature requests
- **Community Forum**: Ask questions and share tips
- **Direct Support**: Email for urgent issues

## Providing Feedback

Your feedback is valuable for improving the new UI!

### Feedback Methods

#### Built-in Feedback System
```bash
# Submit feedback interactively
npm run feedback:submit

# View feedback summary
npm run feedback:show
```

#### Manual Feedback
- **GitHub Issues**: Create detailed bug reports
- **Email**: Send feedback directly to the development team
- **Community Discussions**: Share experiences with other users

### What to Include
- **Specific Actions**: What were you trying to do?
- **Expected Behavior**: What did you expect to happen?
- **Actual Behavior**: What actually happened?
- **Screenshots**: Visual examples help explain issues
- **System Information**: OS, version, and configuration details

## Tips and Best Practices

### Workflow Optimization
1. **Learn Keyboard Shortcuts**: Significantly speeds up common operations
2. **Use Context Menus**: Right-click for quick access to relevant actions
3. **Customize Panel Sizes**: Adjust panels to fit your workflow
4. **Use Search and Filters**: Quickly find specific parts in large projects

### Performance Tips
1. **Close Unused Tabs**: Reduces memory usage
2. **Use Virtual Scrolling**: Automatic for large lists
3. **Regular Cleanup**: Remove unused parts and results
4. **Monitor Memory**: Use debug mode to track resource usage

### Accessibility Tips
1. **Learn Keyboard Navigation**: Essential for efficient use
2. **Use High Contrast Mode**: Easier on the eyes
3. **Adjust Text Size**: Use browser zoom for comfortable reading
4. **Enable Screen Reader**: If you use assistive technology

## Keyboard Shortcuts Reference

### Global Shortcuts
- `Ctrl+1-5`: Switch between tabs (Parts, Nests, Sheets, Settings, Files)
- `Ctrl+N`: New project
- `Ctrl+S`: Save project
- `Ctrl+I`: Import files
- `Ctrl+E`: Export current selection
- `Ctrl+R`: Refresh/reload interface
- `Ctrl+F`: Focus search box
- `Ctrl+Shift+D`: Toggle dark mode
- `?` or `F1`: Show keyboard shortcuts help

### Navigation
- `Tab`/`Shift+Tab`: Move between interface elements
- `Arrow Keys`: Navigate lists and grids
- `Enter`: Activate buttons and confirm
- `Escape`: Close dialogs and cancel
- `Home`/`End`: Jump to beginning/end of lists
- `Page Up`/`Page Down`: Scroll large lists

### Parts Management
- `Ctrl+A`: Select all parts
- `Ctrl+D`: Duplicate selected parts
- `Delete`: Remove selected parts
- `F2`: Rename selected part
- `Ctrl+Click`: Multi-select parts
- `Shift+Click`: Range select parts

### Nesting Operations
- `Ctrl+Enter`: Start nesting
- `Ctrl+Shift+S`: Stop nesting
- `Ctrl+Shift+R`: Reset nesting results

## Migration from Legacy UI

### What Stays the Same
- **File Formats**: All existing files remain compatible
- **Presets**: Your settings and presets transfer automatically
- **Workflows**: Core nesting workflow remains familiar
- **Results**: Nesting algorithms produce identical results

### What's Different
- **Modern Interface**: Cleaner, more professional appearance
- **Better Organization**: Improved information architecture
- **Enhanced Features**: New capabilities not available before
- **Improved Performance**: Faster and more responsive

### Migration Tips
1. **Start Gradually**: Begin with new projects before migrating existing ones
2. **Learn New Features**: Explore improvements like keyboard shortcuts
3. **Compare Workflows**: Use both UIs initially to understand differences
4. **Provide Feedback**: Help improve the migration experience

## Conclusion

The new Deepnest UI represents a significant step forward in usability, performance, and accessibility. While maintaining the powerful nesting capabilities you rely on, it provides a modern, efficient interface that adapts to your needs.

Take time to explore the new features, learn the keyboard shortcuts, and discover how the improved workflow can enhance your productivity. Your feedback during this transition is invaluable for making the interface even better.

---

**Version**: 1.0  
**Last Updated**: July 2025  
**For Technical Support**: Create GitHub issue or contact development team