# PI-9 Manual Testing Guide (Updated)

This document outlines the manual testing steps for PI-9: Enrich tree items with description and tooltip.

**Key Change**: Descriptions no longer show line numbers. Instead:
- For constants and variables: Show the assigned value
- For data formats (JSON, YAML, TOML): Show the key's value
- For other symbols: No description (cleaner tree hierarchy)

## Prerequisites
1. Press **F5** to launch the Extension Development Host
2. The extension should activate automatically

## Test Cases

### Test 1: Markdown File - No Descriptions (Cleaner Hierarchy)
1. Open `test-fixtures/sample.md`
2. Verify the Outline Eclipsed view in the Explorer sidebar
3. **Expected Results:**
   - Headings should NOT have descriptions (no line numbers)
   - Tree hierarchy should be clean and easy to read
   - No clutter from line number descriptions

### Test 2: Markdown File - Tooltips Still Work
1. With `sample.md` open, hover over items in the outline tree
2. **Expected Results:**
   - Tooltip should appear with heading text and line information
   - Format should be: "**Heading Text**\n\nLine N" or "Lines N-M"
   - Tooltips still provide line information when needed

### Test 3: TypeScript File - Constants Show Values
1. Open `test-fixtures/sample.ts`
2. Wait for language server to activate (may take a moment)
3. Verify the outline tree shows TypeScript symbols
4. **Expected Results:**
   - Classes, methods, functions: NO description (clean hierarchy)
   - Constants (`DEFAULT_TIMEOUT`, `MAX_RETRIES`): Show values ("5000", "3")
   - Tooltips include symbol kind and line numbers for all symbols

### Test 4: Python File - Constants Show Values
1. Open `test-fixtures/sample.py`
2. Wait for language server to activate (may take a moment)
3. Verify the outline tree shows Python symbols
4. **Expected Results:**
   - Classes, methods, functions: NO description
   - Module constants (`DEFAULT_TIMEOUT`, `MAX_RETRIES`, `API_VERSION`): Show values
   - Example: `DEFAULT_TIMEOUT` shows "5000", `API_VERSION` shows '"v1"'

### Test 5: JSON File - Keys Show Values
1. Open `test-fixtures/sample.json`
2. Verify the outline tree shows JSON structure
3. **Expected Results:**
   - Keys show their values in description
   - Example: `name` shows '"outline-eclipsed"'
   - Example: `version` shows '"0.5.0"'
   - Example: `maxRetries` shows "3"
   - Long values are truncated with "..." to keep display clean

### Test 6: Switching Between File Types
1. Open `sample.md` - verify no descriptions (clean)
2. Switch to `sample.ts` - verify constants show values
3. Switch to `sample.py` - verify constants show values
4. Switch to `sample.json` - verify keys show values
5. Switch back to `sample.md` - verify still no descriptions
6. **Expected Results:**
   - Descriptions update correctly for each file type
   - No errors in Developer Console (Ctrl+Shift+I)

### Test 7: Tooltips Across All Languages
1. Hover over symbols in each file type
2. **Expected Results:**
   - All tooltips include line information (Lines N-M or Line N)
   - Language symbols include kind (Class, Method, Function, etc.)
   - Tooltips provide detailed info when hovering

## Success Criteria
- [x] Markdown headings have NO descriptions (cleaner hierarchy)
- [x] TypeScript/Python constants show their values
- [x] JSON keys show their values (truncated if needed)
- [x] Classes, methods, functions have NO descriptions
- [x] Tooltips display symbol name, kind, and line information
- [x] No console errors during testing
- [x] Tree hierarchy is clean and easy to read
- [x] Values are truncated to one line (no multi-line descriptions)

## Screenshots Needed
After manual testing, take screenshots showing:
1. Markdown outline - clean hierarchy with no descriptions
2. TypeScript outline - constants showing values, other symbols clean
3. Python outline - constants showing values
4. JSON outline - keys showing values
5. Tooltip hover example showing line numbers

