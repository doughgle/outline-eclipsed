# Manual Test: Symbol Order Verification

## Purpose
Verify that outline symbols appear in document order, not alphabetical order.

## Test Files
1. `test-fixtures/symbol-order-test.ts` - TypeScript with deliberately non-alphabetical symbols
2. `test-fixtures/sample.ts` - Existing TypeScript test file

## Expected Behavior

### For `symbol-order-test.ts`:
The outline should show symbols in this exact order:
1. Zebra (class)
   - zebraMethod (method) - should be before appleMethod
   - appleMethod (method) - should be after zebraMethod
2. Monkey (class)
3. Apple (class)
4. Dog (function)
5. Cat (function)
6. Bear (constant)

**NOT** in alphabetical order:
- ❌ Apple, Bear, Cat, Dog, Monkey, Zebra

### For `sample.ts`:
The outline should show symbols in this exact order:
1. Application (class, line 8)
2. Config (interface, line 42)
3. formatMessage (function, line 51)
4. DEFAULT_TIMEOUT (constant, line 61)
5. MAX_RETRIES (constant, line 62)
6. ApiService (class, line 67)

**NOT** in alphabetical order:
- ❌ ApiService, Application, Config, DEFAULT_TIMEOUT, formatMessage, MAX_RETRIES

## Test Steps

1. **Open the Extension Development Host**
   - Press `F5` in VS Code to launch the Extension Development Host
   - Or run: Debug > Start Debugging

2. **Open Test File**
   - In the Extension Development Host, open `test-fixtures/symbol-order-test.ts`
   - Or open `test-fixtures/sample.ts`

3. **Open Outline Eclipsed View**
   - Find "Outline Eclipsed" in the Explorer sidebar
   - Expand all items in the outline

4. **Verify Order**
   - Check that symbols appear in document order (top to bottom)
   - Verify that nested symbols (methods within classes) also appear in document order
   - Confirm symbols are NOT in alphabetical order

## Success Criteria
- ✅ Symbols appear in the same order as they are defined in the document
- ✅ Nested symbols maintain document order
- ✅ No alphabetical sorting is applied
- ✅ Tree hierarchy is preserved (e.g., methods appear under their classes)

## Additional Languages to Test
The fix should work for any language that uses DocumentSymbol:
- JavaScript (`.js`, `.jsx`)
- TypeScript (`.ts`, `.tsx`)
- Python (`.py`)
- Java (`.java`)
- C++ (`.cpp`, `.h`)

## Known Issues
- Tests cannot run automatically in CI due to X server requirement
- Manual testing is required to verify the fix
