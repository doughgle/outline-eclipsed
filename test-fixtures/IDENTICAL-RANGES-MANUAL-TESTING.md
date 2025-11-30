# Identical Ranges Bug - Manual Testing Guide

This document provides step-by-step instructions to reproduce the issue where items with identical ranges are incorrectly filtered out.

## Issue Description

**Bug**: When two outline items have exactly the same range (start and end lines), the `filterRedundantItems` method incorrectly removes BOTH items because each is considered "contained" in the other due to the `>=` and `<=` operators.

**Location**: `src/outlineItemProcessor.ts`, line 39

**Current (buggy) condition**:
```typescript
return candidateStart >= otherStart && candidateEnd <= otherEnd;
```

**Expected (fixed) condition**:
```typescript
return candidateStart >= otherStart && candidateEnd <= otherEnd
    && (candidateStart > otherStart || candidateEnd < otherEnd);
```

## Scenario

When two items share the same range:
- Item A: Range(0, 0, 5, 0)
- Item B: Range(0, 0, 5, 0)

Current behavior:
- Checking A: `A.start >= B.start && A.end <= B.end` is **true** → A filtered out
- Checking B: `B.start >= A.start && B.end <= A.end` is **true** → B filtered out
- Result: **Both items are incorrectly removed!**

## Prerequisites

1. Install a YAML extension (e.g., "Red Hat YAML") to enable YAML symbol support
2. Press **F5** to launch the Extension Development Host
3. Open the test fixture: `test-fixtures/identical-ranges-test.yaml`

## Reproducing the Issue

### Test 1: Identical Range Scenario (Multi-Select)

**Setup**: The test file `identical-ranges-test.yaml` contains multiple keys that may share identical ranges depending on the YAML language server implementation.

**Steps**:
1. Open `test-fixtures/identical-ranges-test.yaml`
2. Open "Outline Eclipsed" view in the Explorer sidebar
3. Expand all tree items to see the full structure
4. Multi-select two sibling keys (using Ctrl+Click or Cmd+Click):
   - Select `key_a` and `key_b` (they are siblings at the same level)
5. Attempt to drag the selection to a new position

**Before Fix - Expected Bug Behavior**:
- If both items have identical computed ranges, BOTH may disappear from the drag operation
- The drag operation may fail silently or only move one item
- Console may show unexpected filtering behavior

**After Fix - Expected Correct Behavior**:
- Both items should be included in the drag operation
- Both items should move together to the new position
- No items should be incorrectly filtered out

### Test 2: Single-Line Keys (Identical Range Edge Case)

**Steps**:
1. In the test file, look at `single_line_a` and `single_line_b`
2. These are simple key-value pairs on single lines
3. Multi-select both items
4. Attempt to drag them together

**Pass Criteria**:
- ✅ Both items can be selected
- ✅ Both items are included in the drag operation
- ✅ Both items move to the new position

### Test 3: Nested Items with Parent

**Steps**:
1. Expand the `parent_with_identical_children` key
2. Multi-select `identical_child_1` and `identical_child_2`
3. Verify both children can be dragged together

**Pass Criteria**:
- ✅ Both children are kept in the selection
- ✅ Neither child is filtered out as "redundant"

## Unit Test Verification

The unit test `filterRedundantItems - keeps items with identical ranges` in `src/test/outlineItemProcessor.test.ts` verifies this fix.

To run the test:
```bash
npm test
```

Look for:
```
✓ filterRedundantItems - keeps items with identical ranges
```

## Debugging Tips

1. Open Developer Tools (Help > Toggle Developer Tools)
2. Check Console for any filtering messages
3. Add breakpoints in `outlineItemProcessor.ts` to observe the filtering logic
4. Verify the ranges of selected items using the debugger

## Related Files

- `src/outlineItemProcessor.ts` - Contains the buggy `filterRedundantItems` method
- `src/test/outlineItemProcessor.test.ts` - Unit tests for the processor
- `test-fixtures/identical-ranges-test.yaml` - YAML test file for manual testing
