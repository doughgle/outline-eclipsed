# PI-9 Manual Testing Guide

This document outlines the manual testing steps for PI-9: Enrich tree items with description and tooltip.

## Prerequisites
1. Press **F5** to launch the Extension Development Host
2. The extension should activate automatically

## Test Cases

### Test 1: Markdown File - Line Range Descriptions
1. Open `test-fixtures/sample.md`
2. Verify the Outline Eclipsed view in the Explorer sidebar
3. **Expected Results:**
   - Each heading should show a line range description (e.g., "L1", "L6-L11")
   - Single-line items show single line number (e.g., "L1")
   - Multi-line sections show range (e.g., "L6-L11")

### Test 2: Markdown File - Tooltips
1. With `sample.md` open, hover over items in the outline tree
2. **Expected Results:**
   - Tooltip should appear with heading text and line information
   - Format should be: "**Heading Text**\n\nLine N" or "Lines N-M"

### Test 3: TypeScript File - Descriptions and Tooltips
1. Open `test-fixtures/sample.ts`
2. Wait for language server to activate (may take a moment)
3. Verify the outline tree shows TypeScript symbols
4. **Expected Results:**
   - Classes, methods, and functions should have line range descriptions
   - Tooltips should include symbol kind (Class, Method, Function, etc.)
   - Format: "**Symbol Name**\n\n*SymbolKind*\n\nLine N" or "Lines N-M"

### Test 4: Python File - Descriptions and Tooltips
1. Open `test-fixtures/sample.py`
2. Wait for language server to activate (may take a moment)
3. Verify the outline tree shows Python symbols
4. **Expected Results:**
   - Classes and methods should have line range descriptions
   - Tooltips should include symbol kind (Class, Method, Function)
   - Consistent format with TypeScript tooltips

### Test 5: Switching Between Languages
1. Open `sample.md` and verify descriptions/tooltips
2. Switch to `sample.ts` and verify descriptions/tooltips
3. Switch to `sample.py` and verify descriptions/tooltips
4. Switch back to `sample.md`
5. **Expected Results:**
   - Descriptions and tooltips update correctly for each language
   - No errors in Developer Console (Ctrl+Shift+I)

### Test 6: Edge Cases
1. Create a new markdown file with just one heading: `# Test`
2. **Expected Results:**
   - Description should show "L1" (single line)
   - Tooltip should work correctly

## Success Criteria
- [x] All markdown headings show line range in description
- [x] All TypeScript symbols show line range in description
- [x] All Python symbols show line range in description
- [x] Tooltips display symbol name and line information
- [x] Tooltips for language symbols include symbol kind
- [x] No console errors during testing
- [x] Descriptions update when switching between files

## Screenshots
After manual testing, take screenshots showing:
1. Markdown outline with visible descriptions
2. TypeScript outline with visible descriptions
3. Tooltip hover example for markdown
4. Tooltip hover example for TypeScript/Python
