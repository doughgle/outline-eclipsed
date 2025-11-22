# JSON Drag & Drop Manual Testing Guide

This document outlines the manual testing steps for JSON drag and drop functionality.

## Prerequisites
1. Press **F5** to launch the Extension Development Host
2. The extension should activate automatically

## Test Cases

### Test 1: JSON File - Basic Property Reordering
1. Open `test-fixtures/json-drag-test.json`
2. Verify the Outline Eclipsed view shows all JSON properties
3. **Drag & Drop Test:**
   - Drag "name" property to a different position (e.g., below "version")
   - Verify the property moves correctly
   - Verify formatting is preserved (indentation, spacing)
   - Verify commas are handled correctly
4. **Expected Results:**
   - Property moves to new location
   - JSON remains valid (no syntax errors)
   - Formatting is clean and consistent
   - Visual highlight shows the moved property
   - Editor scrolls to reveal the moved property

### Test 2: JSON File - Move First Property to Last
1. With `json-drag-test.json` open
2. Drag "name" (first property) to the end (after "config")
3. **Expected Results:**
   - "name" appears as last property in the file
   - All other properties maintain their order
   - Formatting is preserved
   - No trailing comma issues

### Test 3: JSON File - Move Last Property to First
1. With `json-drag-test.json` open
2. Drag "config" (last property) to the beginning (before "name")
3. **Expected Results:**
   - "config" appears as first property
   - All other properties maintain their order
   - Comma placement is correct

### Test 4: JSON File - Move Nested Property
1. Open `test-fixtures/sample.json`
2. Expand nested objects (e.g., "repository", "engines", "config")
3. Try dragging a nested property (e.g., "type" under "repository")
4. **Expected Results:**
   - Nested property moves within its parent object
   - Parent object structure remains intact
   - Formatting is preserved

### Test 5: JSONC File - Drag with Comments
1. Open `test-fixtures/jsonc-drag-test.jsonc`
2. Verify comments are visible in the file
3. Drag "name" property to a different position
4. **Expected Results:**
   - Property moves correctly
   - Comments are preserved in their original positions
   - No comment corruption or loss
   - Formatting is maintained

### Test 6: JSON File - Multi-Select Drag
1. With `json-drag-test.json` open
2. Use Ctrl+Click (Cmd+Click on Mac) to select multiple properties:
   - Select "name"
   - Ctrl+Click "description"
   - Ctrl+Click "license"
3. Drag the selected items to a new position
4. **Expected Results:**
   - All selected properties move together
   - Relative order is maintained
   - No duplicate properties
   - Formatting is clean

### Test 7: JSON File - Visual Feedback
1. With `json-drag-test.json` open
2. Drag any property to a new position
3. **Expected Results:**
   - Moved property is highlighted with background color
   - Editor auto-scrolls to reveal the moved property in center
   - Highlight appears for ~1.5 seconds then fades
   - Overview ruler shows indicator on scrollbar

### Test 8: Switching Between File Types
1. Open `sample.md` - verify drag & drop works for Markdown
2. Switch to `json-drag-test.json` - verify drag & drop works for JSON
3. Switch to `sample.ts` - verify drag & drop is disabled (view-only)
4. Switch back to `json-drag-test.json` - verify drag & drop still works
5. **Expected Results:**
   - Drag & drop enabled for Markdown and JSON only
   - Other languages show view-only outline
   - No errors in Developer Console (Ctrl+Shift+I)

### Test 9: JSON File - Complex Nested Structure
1. With `json-drag-test.json` open
2. Try dragging properties at different nesting levels:
   - Top-level properties (e.g., "scripts")
   - Nested properties within objects (e.g., "test" within "scripts")
   - Array items (if supported - currently deferred)
3. **Expected Results:**
   - Properties move within their parent scope
   - Nested structure is preserved
   - No cross-object moves (deferred feature)

### Test 10: JSON File - Undo/Redo
1. With `json-drag-test.json` open
2. Drag a property to a new position
3. Press Ctrl+Z (Cmd+Z on Mac) to undo
4. Press Ctrl+Shift+Z (Cmd+Shift+Z on Mac) to redo
5. **Expected Results:**
   - Undo restores original order
   - Redo re-applies the move
   - File remains valid JSON throughout

## Success Criteria
- [ ] JSON files support drag & drop for properties
- [ ] JSONC files support drag & drop with comment preservation
- [ ] Formatting is automatically applied after moves
- [ ] Visual feedback (highlight + scroll) works correctly
- [ ] Multi-select drag works for multiple properties
- [ ] Commas are handled correctly (no trailing comma issues)
- [ ] Nested properties can be reordered within parent objects
- [ ] No syntax errors after drag & drop operations
- [ ] Undo/redo works correctly
- [ ] No console errors during testing

## Known Limitations (By Design)
- Array element reordering is not supported (deferred)
- Cannot move properties between different parent objects (deferred)
- Drag & drop only works within the same JSON file

## Screenshots Needed
After manual testing, take screenshots showing:
1. JSON outline view with properties
2. Drag & drop in progress (if possible)
3. Visual highlight after property move
4. JSONC file with comments preserved
5. Multi-select drag of multiple properties
6. Before/after of property reordering
