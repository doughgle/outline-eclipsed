# Identical Ranges - Manual Testing Guide

This document provides step-by-step instructions for testing the identical ranges invariant in the outline item processor.

## Issue Background

**Original Bug**: The `filterRedundantItems` method used `>=` and `<=` operators which would cause both items to be filtered out when they had identical ranges.

**Resolution**: Based on interactive testing feedback, items in the same tree cannot have identical ranges in practice. This is now enforced as an invariant with an assertion in production code.

**Current Behavior**:
1. The code now uses strict containment (`>` or `<` instead of just `>=` and `<=`)
2. An assertion validates that no two distinct items have identical ranges
3. If identical ranges are detected, an error is thrown indicating an invariant violation

## Implementation Details

**Location**: `src/outlineItemProcessor.ts`

**Strict containment condition**:
```typescript
return candidateStart >= otherStart && candidateEnd <= otherEnd
    && (candidateStart > otherStart || candidateEnd < otherEnd);
```

**Invariant assertion**: The `assertNoIdenticalRanges()` method checks for duplicate ranges and throws an error if found.

## Manual Testing Scenarios

### Test 1: Multi-Select Sibling Keys
**Goal**: Verify multi-select drag works correctly for sibling items with different ranges.

**Steps**:
1. Open `test-fixtures/identical-ranges-test.yaml` in Extension Development Host (F5)
2. Open "Outline Eclipsed" view in the Explorer sidebar
3. Multi-select `key_a` and `key_b` (using Ctrl+Click or Cmd+Click)
4. Drag the selection to a new position

**Expected Result**:
- ✅ Both items are included in the drag operation
- ✅ Both items move together to the new position
- ✅ No errors in the console

### Test 2: Single-Line Keys
**Goal**: Verify single-line key-value pairs can be multi-selected.

**Steps**:
1. Multi-select `single_line_a` and `single_line_b`
2. Drag them together

**Expected Result**:
- ✅ Both items can be selected and dragged
- ✅ Operation completes without errors

### Test 3: Nested Items with Parent
**Goal**: Verify nested items are correctly filtered when parent is selected.

**Steps**:
1. Expand `parent_with_identical_children`
2. Multi-select the parent and `identical_child_1`
3. Drag the selection

**Expected Result**:
- ✅ Only parent is moved (child is filtered as redundant)
- ✅ No errors in the console

## Unit Test Verification

The following unit tests verify the behavior at the code level:

1. `filterRedundantItems - throws error for items with identical ranges (invariant violation)` - Verifies the assertion catches identical ranges
2. `filterRedundantItems - throws error for identical ranges even with nested item` - Verifies assertion works with multiple items
3. `filterRedundantItems - handles strictly contained items correctly` - Verifies proper containment filtering

To run the tests:
```bash
npm test
```

## Debugging Tips

1. Open Developer Tools (Help > Toggle Developer Tools)
2. Check Console for any invariant violation errors
3. Add breakpoints in `outlineItemProcessor.ts` to observe the filtering logic
4. If you see "Invariant violation" errors, it indicates a bug in the outline provider that created duplicate range items

## Related Files

- `src/outlineItemProcessor.ts` - Contains `filterRedundantItems` with invariant assertion
- `src/test/outlineItemProcessor.test.ts` - Unit tests for the processor
- `test-fixtures/identical-ranges-test.yaml` - YAML test file for manual testing
