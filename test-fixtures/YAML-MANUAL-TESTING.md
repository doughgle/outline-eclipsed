# YAML Drag & Drop Manual Testing Guide

This document provides step-by-step instructions for manually testing YAML drag & drop functionality in the Outline Eclipsed extension.

## Prerequisites
1. Install a YAML extension (e.g., "Red Hat YAML" or "YAML" by Red Hat) to enable YAML symbol support
2. Press **F5** to launch the Extension Development Host
3. Open the test fixture: `test-fixtures/sample.yaml` or `test-fixtures/yaml-drag-test.yaml`

## Test Scenarios

### Test 1: Basic Navigation
**Goal**: Verify tree view shows YAML structure and clicking navigates to keys

**Steps**:
1. Open `test-fixtures/sample.yaml`
2. Open "Outline Eclipsed" view in the Explorer sidebar
3. Verify the tree shows YAML keys (version, services, volumes, networks)
4. Click on "services" in the tree
5. **Expected**: Editor cursor jumps to the "services:" line
6. Click on nested keys (e.g., "web", "database")
7. **Expected**: Editor navigates to respective lines

**Pass Criteria**:
- ✅ Tree displays YAML keys
- ✅ Clicking navigates to correct lines
- ✅ Nested structure is visible in tree

---

### Test 2: Drag Top-Level Key (Basic)
**Goal**: Test dragging a simple top-level key to reorganize YAML

**Steps**:
1. Open `test-fixtures/yaml-drag-test.yaml`
2. In Outline Eclipsed tree, find "second_key"
3. Drag "second_key" and drop it above "first_key"
4. **Expected**: 
   - Visual highlight appears on moved section
   - Editor scrolls to show moved content
   - "second_key" is now before "first_key" in the file
   - Nested properties (nested_a, nested_b) moved with parent

**Pass Criteria**:
- ✅ Drag operation completes without errors
- ✅ Key and its nested properties move together
- ✅ Visual feedback (highlight) appears
- ✅ Editor auto-scrolls to show moved section

---

### Test 3: Drag Nested Key
**Goal**: Verify nested YAML keys can be dragged within their parent

**Steps**:
1. In `test-fixtures/yaml-drag-test.yaml`, expand "beta" key
2. Drag "child1" and drop it below "child3"
3. **Expected**: 
   - "child1" moves to new position
   - Only the dragged key moves (not siblings)
   - Indentation is preserved

**Pass Criteria**:
- ✅ Nested key moves correctly
- ✅ Parent structure remains intact
- ✅ YAML indentation is preserved

---

### Test 4: Edge Case - First Item
**Goal**: Test dragging the very first item in the YAML file

**Steps**:
1. In `test-fixtures/yaml-drag-test.yaml`
2. Drag "first_key" (the first key in file)
3. Drop it at a different position (e.g., below "third_key")
4. **Expected**: 
   - First key moves successfully
   - No errors or corruption
   - File structure remains valid YAML

**Pass Criteria**:
- ✅ First item can be dragged
- ✅ No errors occur
- ✅ YAML remains valid after move

---

### Test 5: Edge Case - Last Item
**Goal**: Test dragging the very last item in the YAML file

**Steps**:
1. In `test-fixtures/yaml-drag-test.yaml`
2. Scroll to bottom and find "omega" key
3. Drag "omega" (the last key in file)
4. Drop it at top (above "first_key")
5. **Expected**: 
   - Last key moves successfully
   - No errors or corruption

**Pass Criteria**:
- ✅ Last item can be dragged
- ✅ Moves to new position correctly
- ✅ No trailing issues in file

---

### Test 6: Multi-Select Drag
**Goal**: Test dragging multiple YAML keys at once

**Steps**:
1. In `test-fixtures/yaml-drag-test.yaml`
2. Click "beta" in tree
3. Hold **Ctrl** (or **Cmd** on Mac) and click "delta"
4. Drag the selection and drop below "gamma"
5. **Expected**: 
   - Both keys move together
   - They maintain their relative order
   - Visual feedback for all moved sections

**Pass Criteria**:
- ✅ Multi-select works (Ctrl/Cmd + Click)
- ✅ Multiple keys drag together
- ✅ Relative order preserved
- ✅ All moved sections highlighted

---

### Test 7: Complex Nested Structure
**Goal**: Test dragging a key with deeply nested children

**Steps**:
1. In `test-fixtures/sample.yaml`
2. Drag "services" key (which has web, database, cache children)
3. Drop it below "volumes"
4. **Expected**: 
   - Entire "services" section moves (including all nested children)
   - All service definitions (web, database, cache) move with parent
   - Nested structure preserved

**Pass Criteria**:
- ✅ Parent and all descendants move together
- ✅ Deep nesting preserved
- ✅ No corruption of nested structure

---

### Test 8: Drop at End
**Goal**: Test dropping a key at the very end of the file

**Steps**:
1. In `test-fixtures/yaml-drag-test.yaml`
2. Drag "first_key"
3. Drop on empty space at bottom of tree (drop with no target)
4. **Expected**: 
   - Key moves to end of file
   - No extra blank lines or formatting issues

**Pass Criteria**:
- ✅ Drop at end works
- ✅ No extra whitespace added
- ✅ File remains valid YAML

---

### Test 9: Rejection for Unsupported Languages
**Goal**: Verify drag & drop is disabled for non-YAML, non-Markdown files

**Steps**:
1. Open `test-fixtures/sample.py` or `sample.ts`
2. Try to drag an item in the tree
3. **Expected**: 
   - Drag cursor shows "not allowed" / "blocked"
   - Console message: "Drag and drop is not yet supported for [language]"
   - No drag operation occurs

**Pass Criteria**:
- ✅ Drag blocked for unsupported languages
- ✅ Appropriate message shown
- ✅ No data loss or corruption

---

### Test 10: Real-Time Tree Update
**Goal**: Verify tree updates after drag & drop

**Steps**:
1. In `test-fixtures/yaml-drag-test.yaml`
2. Drag "beta" below "gamma"
3. Observe the tree view
4. **Expected**: 
   - Tree automatically refreshes
   - Shows new order immediately
   - Selected item remains visible

**Pass Criteria**:
- ✅ Tree updates automatically
- ✅ New structure reflected immediately
- ✅ No manual refresh needed

---

## Expected Behaviors Summary

### ✅ Supported Features
- Viewing YAML outline with hierarchical structure
- Clicking to navigate to YAML keys
- Dragging and dropping top-level keys
- Dragging nested keys
- Multi-select drag & drop (Ctrl/Cmd + Click)
- Parent keys move with all children
- Visual highlight and auto-scroll after drop
- First and last item edge cases

### ❌ Not Supported (By Design)
- Dragging in non-YAML files (Python, TypeScript, etc.)
- Dragging comments (only keys are draggable)
- Dragging array items (depends on symbol provider)

## Reporting Issues

If any test fails or behaves unexpectedly:
1. Note which test scenario failed
2. Capture any error messages from VS Code Developer Tools (Help > Toggle Developer Tools)
3. Check console output for debugging information
4. Verify YAML file remains valid after operation

## Notes

- YAML symbol support depends on installed YAML extension
- Some YAML extensions may provide different symbol structures
- Complex YAML features (anchors, aliases, multi-line strings) depend on symbol provider accuracy
- Drag & drop preserves existing formatting and indentation
