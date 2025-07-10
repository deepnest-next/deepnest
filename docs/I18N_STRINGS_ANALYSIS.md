# Internationalization Strings Analysis

## Overview
This document contains a comprehensive analysis of all translatable strings found in the current Deepnest frontend implementation. The strings are organized by namespace and include location information, context, and suggested translation keys.

## String Categories and Namespaces

### 1. Navigation/Tabs
**Namespace**: `navigation`
**File**: `/root/github/deepnest/main/index.html`

| String | Location | Context | Translation Key |
|--------|----------|---------|-----------------|
| "deepnest - Industrial nesting" | index.html:4 | Page title | `nav.page_title` |

### 2. Actions/Buttons
**Namespace**: `actions`
**Files**: `/root/github/deepnest/main/index.html`, `/root/github/deepnest/main/page.js`

| String | Location | Context | Translation Key |
|--------|----------|---------|-----------------|
| "Stop nest" | index.html:36 | Stop nesting button | `actions.stop_nest` |
| "Export" | index.html:38 | Export dropdown button | `actions.export` |
| "SVG file" | index.html:40 | Export option | `actions.export_svg` |
| "DXF file" | index.html:41 | Export option | `actions.export_dxf` |
| "JSON file" | index.html:42 | Export option | `actions.export_json` |
| "Back" | index.html:46 | Back button | `actions.back` |
| "Import" | index.html:135 | Import button | `actions.import` |
| "Start nest" | index.html:136 | Start nesting button | `actions.start_nest` |
| "Deselect" | index.html:168 | Deselect parts | `actions.deselect` |
| "Select" | index.html:168 | Select parts | `actions.select` |
| "all" | index.html:168 | "Select/Deselect all" | `actions.all` |
| "Add" | index.html:175 | Add sheet button | `actions.add` |
| "Cancel" | index.html:176 | Cancel button | `actions.cancel` |
| "Save Preset" | index.html:471 | Save preset button | `actions.save_preset` |
| "Load" | index.html:480 | Load preset button | `actions.load` |
| "Delete" | index.html:481 | Delete preset button | `actions.delete` |
| "Save" | index.html:498 | Save button in modal | `actions.save` |
| "set all to default" | index.html:503 | Reset to defaults link | `actions.reset_defaults` |

### 3. Labels/Forms
**Namespace**: `labels`
**File**: `/root/github/deepnest/main/index.html`

| String | Location | Context | Translation Key |
|--------|----------|---------|-----------------|
| "Size" | index.html:146 | Table header | `labels.size` |
| "Sheet" | index.html:147 | Table header | `labels.sheet` |
| "Quantity" | index.html:148 | Table header | `labels.quantity` |
| "Add Sheet" | index.html:171 | Sheet dialog title | `labels.add_sheet` |
| "width" | index.html:172 | Sheet width input | `labels.width` |
| "height" | index.html:173 | Sheet height input | `labels.height` |
| "Nesting configuration" | index.html:211 | Section title | `labels.nesting_config` |
| "Display units" | index.html:214 | Units setting | `labels.display_units` |
| "inches" | index.html:223 | Unit option | `labels.inches` |
| "mm" | index.html:225 | Unit option | `labels.mm` |
| "Space between parts" | index.html:228 | Spacing setting | `labels.space_between_parts` |
| "Curve tolerance" | index.html:242 | Tolerance setting | `labels.curve_tolerance` |
| "Part rotations" | index.html:256 | Rotation setting | `labels.part_rotations` |
| "Optimization type" | index.html:269 | Optimization setting | `labels.optimization_type` |
| "Gravity" | index.html:272 | Optimization option | `labels.gravity` |
| "Bounding Box" | index.html:273 | Optimization option | `labels.bounding_box` |
| "Squeeze" | index.html:274 | Optimization option | `labels.squeeze` |
| "Use rough approximation" | index.html:278 | Simplify setting | `labels.use_rough_approximation` |
| "CPU cores" | index.html:283 | Threads setting | `labels.cpu_cores` |
| "Import/Export" | index.html:297 | Section title | `labels.import_export` |
| "Use SVG Normalizer?" | index.html:300 | SVG preprocessor setting | `labels.use_svg_normalizer` |
| "SVG scale" | index.html:310 | Scale setting | `labels.svg_scale` |
| "units/" | index.html:321 | Scale unit prefix | `labels.units_per` |
| "Endpoint tolerance" | index.html:324 | Endpoint tolerance setting | `labels.endpoint_tolerance` |
| "DXF import units" | index.html:338 | DXF import setting | `labels.dxf_import_units` |
| "Points" | index.html:341 | DXF unit option | `labels.points` |
| "Picas" | index.html:342 | DXF unit option | `labels.picas` |
| "Inches" | index.html:343 | DXF unit option | `labels.inches_cap` |
| "cm" | index.html:345,356 | DXF unit option | `labels.cm` |
| "DXF export units" | index.html:349 | DXF export setting | `labels.dxf_export_units` |
| "Export with Sheet Boundborders?" | index.html:361 | Export setting | `labels.export_with_sheet_boundaries` |
| "Export with Space between Sheets?" | index.html:372 | Export setting | `labels.export_with_sheets_space` |
| "Distance between Sheets?" | index.html:385 | Distance setting | `labels.distance_between_sheets` |
| "Laser options" | index.html:403 | Section title | `labels.laser_options` |
| "Merge common lines" | index.html:405 | Merge lines setting | `labels.merge_common_lines` |
| "Optimization ratio" | index.html:414 | Optimization ratio setting | `labels.optimization_ratio` |
| "Meta-heuristic fine tuning" | index.html:428 | Section title | `labels.meta_heuristic_tuning` |
| "GA population" | index.html:430 | Population setting | `labels.ga_population` |
| "GA mutation rate" | index.html:442 | Mutation rate setting | `labels.ga_mutation_rate` |
| "Other Settings" | index.html:456 | Section title | `labels.other_settings` |
| "Use Quantity from filename" | index.html:459 | Filename quantity setting | `labels.use_quantity_from_filename` |
| "Presets" | index.html:467 | Section title | `labels.presets` |
| "Save Configuration Presets" | index.html:469 | Save preset label | `labels.save_config_presets` |
| "Load/Delete Configuration Presets" | index.html:473 | Load/delete preset label | `labels.load_delete_presets` |
| "-- Select a preset --" | index.html:477 | Preset dropdown default | `labels.select_preset_default` |
| "Save Preset" | index.html:490 | Modal title | `labels.save_preset_title` |
| "Enter preset name" | index.html:495 | Input placeholder | `labels.enter_preset_name` |

### 4. Messages/Alerts
**Namespace**: `messages`
**File**: `/root/github/deepnest/main/page.js`

| String | Location | Context | Translation Key |
|--------|----------|---------|-----------------|
| "Please enter a preset name" | page.js:277 | Validation message | `messages.enter_preset_name` |
| "Preset saved successfully!" | page.js:301 | Success message | `messages.preset_saved` |
| "Error saving preset" | page.js:305 | Error message | `messages.error_saving_preset` |
| "Please select a preset to load" | page.js:325 | Validation message | `messages.select_preset_to_load` |
| "Preset loaded successfully!" | page.js:369 | Success message | `messages.preset_loaded` |
| "Selected preset not found" | page.js:372 | Error message | `messages.preset_not_found` |
| "Error loading preset" | page.js:376 | Error message | `messages.error_loading_preset` |
| "Please select a preset to delete" | page.js:396 | Validation message | `messages.select_preset_to_delete` |
| "Are you sure you want to delete the preset" | page.js:405 | Confirmation message | `messages.confirm_delete_preset` |
| "Preset deleted successfully!" | page.js:421 | Success message | `messages.preset_deleted` |
| "Error deleting preset" | page.js:424 | Error message | `messages.error_deleting_preset` |
| "Please import some parts first" | page.js:1636 | Validation message | `messages.import_parts_first` |
| "Please mark at least one part as the sheet" | page.js:1639 | Validation message | `messages.mark_part_as_sheet` |
| "No file selected" | page.js:1251,1719,1751 | Info message | `messages.no_file_selected` |
| "An error ocurred reading the file" | page.js:1349 | Error message | `messages.file_read_error` |
| "Error processing SVG" | page.js:1327,1363 | Error message | `messages.svg_processing_error` |
| "could not contact file conversion server" | page.js:1340,1810 | Error message | `messages.conversion_server_error` |
| "There was an Error while converting" | page.js:1295,1338,1798,1808 | Error message | `messages.conversion_error` |

### 5. Tooltips/Help
**Namespace**: `tooltips`
**File**: `/root/github/deepnest/main/index.html`

| String | Location | Context | Translation Key |
|--------|----------|---------|-----------------|
| "Units" | index.html:622 | Tooltip title | `tooltips.units_title` |
| "Whether to work in metric or imperial. This affects display only, and not import or export." | index.html:623-624 | Tooltip text | `tooltips.units_description` |
| "Space between parts" | index.html:750 | Tooltip title | `tooltips.spacing_title` |
| "The minimum amount of space between each part. If you're planning on using the merge common lines feature, set this to zero." | index.html:751-752 | Tooltip text | `tooltips.spacing_description` |
| "SVG import scale" | index.html:920 | Tooltip title | `tooltips.scale_title` |
| "This is the conversion factor between inches/mm to SVG units..." | index.html:921-924 | Tooltip text | `tooltips.scale_description` |
| "Curve tolerance" | index.html:983 | Tooltip title | `tooltips.curve_tolerance_title` |
| "When computing a nest, curved sections must be turned into line segments..." | index.html:984-987 | Tooltip text | `tooltips.curve_tolerance_description` |
| "Endpoint tolerance" | index.html:1056 | Tooltip title | `tooltips.endpoint_tolerance_title` |
| "Real-world vectors are often messy and imprecise..." | index.html:1057-1059 | Tooltip text | `tooltips.endpoint_tolerance_description` |
| "Use rough approximation" | index.html:1297 | Tooltip title | `tooltips.simplify_title` |
| "Certain geometries can be very time consuming to compute..." | index.html:1298-1304 | Tooltip text | `tooltips.simplify_description` |
| "Genetic mutation rate" | index.html:3331 | Tooltip title | `tooltips.mutation_rate_title` |
| "How much to mutate the population in each successive trial..." | index.html:3332-3336 | Tooltip text | `tooltips.mutation_rate_description` |

### 6. Status/Progress
**Namespace**: `status`
**File**: `/root/github/deepnest/main/index.html`

| String | Location | Context | Translation Key |
|--------|----------|---------|-----------------|
| "sheets used" | index.html:94 | Nest results plural | `status.sheets_used_plural` |
| "sheet used" | index.html:94 | Nest results singular | `status.sheet_used_singular` |
| "parts placed" | index.html:95 | Nest results label | `status.parts_placed` |
| "sheet utilisation" | index.html:96 | Nest results label | `status.sheet_utilisation` |
| "laser time saved" | index.html:97 | Nest results label | `status.laser_time_saved` |
| "best nests so far" | index.html:98 | Nest results header | `status.best_nests_so_far` |

### 7. Info Page Content
**Namespace**: `info`
**File**: `/root/github/deepnest/main/index.html`

| String | Location | Context | Translation Key |
|--------|----------|---------|-----------------|
| "deepnest" | index.html:3544 | Application name | `info.app_name` |
| "Visit our website:" | index.html:3549 | Website prompt | `info.visit_website` |
| "If you use this software regularly, you should consider supporting us!" | index.html:3555 | Support message | `info.support_message` |
| "Deepnest is a free and open-source nesting software, but we need your support to keep it that way." | index.html:3566-3567 | Support description | `info.support_description` |
| "We are committed to keeping deepnest-next free for everyone, but we need your help to do that." | index.html:3568-3569 | Commitment message | `info.commitment_message` |
| "If you use deepnest-next regularly, please consider supporting us on Patreon or Github." | index.html:3570-3571 | Support request | `info.support_request` |
| "help us to continue to develop and improve deepnest-next, and to keep it free for everyone." | index.html:3572-3573 | Support impact | `info.support_impact` |

### 8. Time-related Strings
**Namespace**: `time`
**File**: `/root/github/deepnest/main/page.js`

| String | Location | Context | Translation Key |
|--------|----------|---------|-----------------|
| "year" | page.js:2291 | Time unit | `time.year` |
| "day" | page.js:2295 | Time unit | `time.day` |
| "hour" | page.js:2299 | Time unit | `time.hour` |
| "minute" | page.js:2303 | Time unit | `time.minute` |
| "second" | page.js:2307 | Time unit | `time.second` |
| "seconds" | page.js:2310 | Time unit plural | `time.seconds` |

### 9. File Types
**Namespace**: `file_types`
**File**: `/root/github/deepnest/main/page.js`

| String | Location | Context | Translation Key |
|--------|----------|---------|-----------------|
| "CAD formats" | page.js:1241 | File filter name | `file_types.cad_formats` |
| "SVG/EPS/PS" | page.js:1242 | File filter name | `file_types.svg_eps_ps` |
| "DXF/DWG" | page.js:1243 | File filter name | `file_types.dxf_dwg` |

### 10. Symbols
**Namespace**: `symbols`
**File**: `/root/github/deepnest/main/index.html`

| String | Location | Context | Translation Key |
|--------|----------|---------|-----------------|
| "&times;" | index.html:489 | Close symbol (×) | `symbols.close` |

## Implementation Recommendations

### 1. Translation File Structure
Create separate JSON files for each namespace:
- `common.json` - Navigation, actions, labels
- `messages.json` - Error messages, confirmations, success messages
- `tooltips.json` - Help text and tooltips
- `status.json` - Status and progress indicators
- `info.json` - About page content
- `time.json` - Time-related strings
- `file_types.json` - File type descriptions

### 2. Special Considerations

#### Pluralization
Implement proper pluralization handling for:
- "sheets used" vs "sheet used"
- "parts placed" (needs singular form)
- Time units (second vs seconds)

#### Parameterized Strings
Use parameterized translations for:
- Confirmation dialogs: "Are you sure you want to delete the preset {{presetName}}?"
- Scale descriptions: "This is the conversion factor between inches/mm to SVG units ({{units}}/pixel)"

#### Context-Sensitive Translations
Some strings may need different translations based on context:
- "Load" - could be "Load Preset" or "Load File"
- "Save" - could be "Save Preset" or "Save File"
- "Delete" - could be "Delete Preset" or "Delete Part"

#### Number Formatting
Consider locale-specific formatting for:
- Measurements (decimal separators)
- Percentages (sheet utilization)
- Large numbers (genetic algorithm parameters)

#### Date/Time Formatting
Implement locale-aware formatting for:
- Time calculations in the nesting process
- File timestamps
- Progress duration displays

### 3. Translation Priority

#### High Priority (Core Functionality)
1. Actions/Buttons - Essential for user interaction
2. Labels/Forms - Required for configuration
3. Messages/Alerts - Critical for user feedback

#### Medium Priority (User Experience)
1. Tooltips/Help - Improves usability
2. Status/Progress - Provides feedback
3. Navigation - Basic UI navigation

#### Low Priority (Informational)
1. Info Page Content - Marketing/support content
2. File Types - Technical descriptions
3. Symbols - Usually universal

### 4. Languages to Support

#### Initial Implementation
- English (en) - Base language
- German (de) - Large European market
- Spanish (es) - Large international market
- French (fr) - European market

#### Future Considerations
- Chinese (zh) - Asian market
- Japanese (ja) - Asian market
- Portuguese (pt) - Brazilian market
- Russian (ru) - Eastern European market

### 5. Quality Assurance

#### Translation Validation
- Ensure all strings are extracted and translated
- Check for consistent terminology across namespaces
- Validate pluralization rules for each language
- Test parameter substitution in all languages

#### UI Testing
- Test layout with longer translations (German, Spanish)
- Verify text truncation doesn't break functionality
- Check right-to-left language support (future consideration)
- Test font rendering for different character sets

#### User Testing
- Native speaker review for accuracy
- Context validation for technical terms
- Consistency check across the application
- Usability testing with translated interface

This comprehensive analysis provides the foundation for implementing internationalization in the new SolidJS frontend, ensuring all user-visible text is properly identified and can be efficiently translated for global users.