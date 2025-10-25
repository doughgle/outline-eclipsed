# PI-6: Multi-Select Drag & Drop Interactive Test

This document contains test scenarios for validating multi-select drag and drop functionality.

**Status**: Iteration 2 Complete - Full multi-select drag & drop with visual feedback

---

## Test 1: Basic Multi-Select with Ctrl/Cmd+Click

### Setup
# Section A
Content for section A goes here.

# Section B
Content for section B goes here.

# Section C
Content for section C goes here.

# Section D
Content for section D goes here.

### Instructions
1. Open the Outline Eclipsed tree view in the Explorer panel
2. Click on "Section A" to select it
3. Hold Ctrl (or Cmd on Mac) and click "Section C" to add it to selection
4. Both A and C should now be selected in the tree view
5. Verify: Tree view shows both items selected with blue highlight

**Expected Result**: Multi-select works correctly with Ctrl/Cmd+Click

---

## Test 2: Filter Redundant Items (Parent + Child Selection)

### Setup
# Parent Section
This is the parent content.

## Child Section 1
This is child 1 content.

## Child Section 2
This is child 2 content.

# Another Root Section
Independent section content.

### Instructions
1. In the Outline Eclipsed tree view, expand "Parent Section"
2. Ctrl+Click to select: "Parent Section", "Child Section 1", and "Another Root Section"
3. Drag the selection to a new position (e.g., end of document)
4. Verify: Only "Parent Section" (with all children) and "Another Root Section" move
5. Verify: "Child Section 1" is NOT duplicated (it moves only as part of parent)

**Expected Result**: Redundant child items are filtered automatically

---

## Test 3: Sort by Document Position

### Setup
# Z Section
Last alphabetically but first in document.

# A Section  
First alphabetically but second in document.

# M Section
Middle alphabetically and third in document.

### Instructions
1. Select sections in this order using Ctrl+Click: "M Section", "Z Section", "A Section"
2. Drag to end of document
3. Verify: Sections are moved in document order (Z, A, M), NOT selection order

**Expected Result**: Items are reordered by their document position, maintaining relative order

---

## Test 4: Nested Hierarchy Selection

### Setup
# Outer
Content outer

## Inner 1
Content inner 1

### Deep 1
Content deep 1

## Inner 2
Content inner 2

# Sibling
Content sibling

### Instructions
1. Expand the tree completely
2. Select "Outer", "Inner 1", and "Deep 1" (all three using Ctrl+Click)
3. Drag selection after "Sibling"
4. Verify: Only "Outer" moves (with all descendants automatically included)
5. Verify: No duplication of content
6. Verify: "Inner 1" and "Deep 1" are still nested under "Outer" in new position

**Expected Result**: Deeply nested redundant items are filtered

---

## Test 5: Non-Contiguous Selection

### Setup
# First Section
Content 1

# Second Section
Content 2

# Third Section
Content 3

# Fourth Section
Content 4

# Fifth Section
Content 5

### Instructions
1. Select "First Section" and "Third Section" and "Fifth Section" (using Ctrl+Click)
2. Drag to position before "Second Section"
3. Verify: All three sections move together to new position
4. Verify: Final order is: First, Third, Fifth, Second, Fourth
5. Verify: All three selected sections are highlighted after move (for 3 seconds)

**Expected Result**: Multiple non-contiguous sections move together with multi-section highlighting

---

## Test 6: Edge Case - Single Item Selection

### Setup
# Only Section
Content here

# Another Section
More content

### Instructions
1. Select only "Only Section" (single selection, no multi-select)
2. Drag to end of document
3. Verify: Works exactly like previous single-select behavior

**Expected Result**: Single-select still works as before

---

## Test 7: Edge Case - All Items Selected

### Setup
# First
Content

# Second
Content

# Third
Content

### Instructions
1. Select all three sections (Ctrl+Click each one)
2. Drag to... anywhere
3. Verify: Nothing breaks, sections remain in same relative order

**Expected Result**: Graceful handling of "move all" scenario

---

## Features Completed

✅ **Multi-select enabled**: Ctrl/Cmd+Click to select multiple items  
✅ **Automatic filtering**: Redundant child items removed when parent selected  
✅ **Document order preservation**: Items sorted and moved in document order  
✅ **Multi-section movement**: All selected sections move together  
✅ **Multi-section highlighting**: All moved sections highlighted for 3 seconds  
✅ **Parent-child integrity**: Nested sections move as a unit with parent  

---

## Checklist

- [ ] Test 1: Multi-select with Ctrl/Cmd+Click works
- [ ] Test 2: Redundant parent+child filtered correctly
- [ ] Test 3: Items sorted by document position
- [ ] Test 4: Nested hierarchy filtered correctly
- [ ] Test 5: Non-contiguous selections handled
- [ ] Test 6: Single selection still works
- [ ] Test 7: All items selection handled gracefully

**Date Tested**: _____________  
**Tester**: _____________  
**Result**: PASS / FAIL  
**Notes**: ____________________________________
