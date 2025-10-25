# PI-6: Multi-Select Drag & Drop Interactive Test

This document contains test scenarios for validating multi-select drag and drop functionality.

**Status**: Iteration 2 Complete - Full multi-select drag & drop with visual feedback

**Instructions**: 
1. Open the Outline Eclipsed tree view in the Explorer panel
2. For each test, use Ctrl+Click (Cmd+Click on Mac) to select multiple items
3. Drag selected items to test the behavior
4. Verify the results as specified in each test section

---

# TEST 1: Basic Multi-Select

## Instructions
1. Click "Section A" to select it
2. Hold Ctrl (Cmd on Mac) and click "Section C" to add to selection
3. Verify: Both items show blue highlight in tree view

**Expected**: Multi-select works with Ctrl/Cmd+Click

---

# Section A
Content for section A goes here.

# Section B
Content for section B goes here.

# Section C
Content for section C goes here.

# Section D
Content for section D goes here.

---

# TEST 2: Filter Redundant Items

## Instructions
1. Expand "Parent Section" in tree view
2. Ctrl+Click to select: "Parent Section", "Child Section 1", and "Another Root Section"
3. Drag selection to end of document
4. **Verify**: Only "Parent Section" (with ALL children) and "Another Root Section" move
5. **Verify**: "Child Section 1" is NOT duplicated

**Expected**: Child items filtered when parent is selected

---

# Parent Section
This is the parent content.

## Child Section 1
This is child 1 content.

## Child Section 2
This is child 2 content.

# Another Root Section
Independent section content.

---

# TEST 3: Sort by Document Position

## Instructions
1. Select in this order: "M Section", "Z Section", "A Section" (using Ctrl+Click)
2. Drag to end of document
3. **Verify**: Sections move in document order (Z, A, M), NOT selection order

**Expected**: Items maintain document order, not selection order

---

# Z Section
Last alphabetically but first in document.

# A Section  
First alphabetically but second in document.

# M Section
Middle alphabetically and third in document.

---

# TEST 4: Nested Hierarchy

## Instructions
1. Expand tree completely
2. Select "Outer", "Inner 1", and "Deep 1" (all three with Ctrl+Click)
3. Drag selection after "Sibling"
4. **Verify**: Only "Outer" moves (with all descendants)
5. **Verify**: No content duplication
6. **Verify**: "Inner 1" and "Deep 1" remain nested under "Outer"

**Expected**: Deeply nested redundant items are filtered

---

# Sibling
Content sibling

---

# Outer
Content outer

## Inner 1
Content inner 1

### Deep 1
Content deep 1

## Inner 2
Content inner 2

# TEST 5: Non-Contiguous Selection

## Instructions
1. Select "First Section", "Third Section", and "Fifth Section" (Ctrl+Click)
2. Drag to position before "Second Section"
3. **Verify**: All three sections move together
4. **Verify**: Final order is: First, Third, Fifth, Second, Fourth
5. **Verify**: All three selections are highlighted for 3 seconds

**Expected**: Multiple non-contiguous sections move with multi-highlighting

---

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

---

# TEST 6: Single Item Selection

## Instructions
1. Select only "Only Section" (single selection, no multi-select)
2. Drag to end of document
3. **Verify**: Works exactly like previous single-select behavior

**Expected**: Single-select backward compatibility maintained

---

# Only Section
Content here

# Another Section
More content

---

# TEST 7: All Items Selected

## Instructions
1. Select all three sections (Ctrl+Click each one)
2. Drag to any position
3. **Verify**: No errors, sections maintain same relative order

**Expected**: Graceful handling of edge case

---

# First
Content

# Second
Content

# Third
Content

---

# Features Completed

✅ **Multi-select enabled**: Ctrl/Cmd+Click to select multiple items  
✅ **Automatic filtering**: Redundant child items removed when parent selected  
✅ **Document order preservation**: Items sorted and moved in document order  
✅ **Multi-section movement**: All selected sections move together  
✅ **Multi-section highlighting**: All moved sections highlighted for 3 seconds  
✅ **Parent-child integrity**: Nested sections move as a unit with parent  

---

# Test Results

**Date Tested**: _____________  
**Tester**: _____________  

| Test | Status | Notes |
|------|--------|-------|
| Test 1: Multi-select | ⬜ PASS / FAIL |  |
| Test 2: Filter redundant | ⬜ PASS / FAIL |  |
| Test 3: Document order | ⬜ PASS / FAIL |  |
| Test 4: Nested hierarchy | ⬜ PASS / FAIL |  |
| Test 5: Non-contiguous | ⬜ PASS / FAIL |  |
| Test 6: Single selection | ⬜ PASS / FAIL |  |
| Test 7: All items | ⬜ PASS / FAIL |  |

**Overall Result**: ⬜ PASS / FAIL
