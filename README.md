# Outline Eclipsed

**Outline view that outshines the vscode default** - drag and drop to rearrange your code sections with ease! 🌙✨ Hats off to Eclipse for getting this right 20 years ago.

## Overview

Outline Eclipsed is a VS Code extension that provides a custom tree view for navigating and reorganizing code structure. Unlike the built-in Outline View (which is read-only), Outline Eclipsed allows you to **drag and drop** outline items to reorder sections in your files.

### Current Status: PI-4 (Nested Heading Drag & Drop)

**What Works Now:**
- ✅ Extension activates and shows tree view
- ✅ Parses markdown headings (H1-H6)
- ✅ Displays headings in hierarchical tree structure
- ✅ Nested headings with expand/collapse
- ✅ Click heading to navigate in editor
- ✅ Tree view highlights heading when cursor moves (selection sync)
- ✅ Works with nested headings (highlights most specific heading)
- ✅ Real-time sync as cursor moves through document
- ✅ Clean display with proper icons (abc icon like default outline)
- ✅ Auto-updates when document changes
- ✅ Supports untitled markdown documents
- ✅ Responds to language mode changes (plaintext → markdown)
- ✅ Handles edge cases (skipped levels, multiple roots, deep nesting)
- ✅ Select full section text via `selectItem` command
- ✅ Drag and drop headings to reorder sections
- ✅ Text movement preserves section content
- ✅ Parent headings move with all their children
- ✅ Nested sections (H1 → H2 → H3) move as a unit

**Coming Next:**
- 🔲 Multi-select drag & drop for moving multiple sections at once

## Product Increments Roadmap

- ✅ **PI-0**: Extension Skeleton Setup
- ✅ **PI-1**: Basic TreeView for Markdown (Flat List)
- ✅ **PI-2**: Hierarchical Tree Structure with Expand/Collapse
- ✅ **PI-3**: Basic Drag & Drop - select range and moves text
- ✅ **PI-4**: Nested Heading Drag & Drop - children move with parents
- 🔲 **PI-5**: Multi-Select Drag & Drop
- 🔲 **PI-6**: Configuration Options

## Development

### Build & Test

```bash
# Compile TypeScript
npm run compile

# Watch mode (auto-compile on save)
npm run watch

# Run tests
npm test

# Lint code
npm run lint
```

### Manual Testing

1. Press **F5** to launch Extension Development Host
2. Open `test-fixtures/sample.md`
3. Look for "Outline Eclipsed" view in Explorer panel
4. Verify headings appear in hierarchical tree structure
5. **Test expand/collapse**: Click arrows to expand/collapse nested headings
6. **Test navigation**: Click a heading to jump to that line in editor
7. **Test selection sync**: Move cursor in editor, watch tree view highlight the current heading
8. **Test real-time updates**: Edit the document and verify tree refreshes
9. **Test nested selection**: Move cursor into nested heading content, verify child heading is highlighted (not parent)
10. **Test text selection**: Execute `outlineEclipsed.selectItem` command to select a full section
11. **Test drag & drop**: Drag a heading in the tree view and drop it at a different position to reorder sections

### Architecture

**Generic Design:**
- `OutlineItem` - Generic tree item model (not markdown-specific)
  - PI-2: Added parent reference for hierarchical navigation
  - PI-2 Refactor: Uses DocumentSymbol-compatible Range semantics (`range` = full section extent, `selectionRange` = heading text only) for precise position tracking
- `OutlineProvider` - Abstract base class for language providers
  - PI-2: Implements `getParent()` (required for TreeView.reveal())
  - PI-2: Implements `findItemAtLine()` for selection sync
  - PI-2 Refactor: Uses `Range.contains()` for precise position checking
- `MarkdownOutlineProvider` - Markdown-specific implementation
  - PI-1: Parses headings into flat list
  - PI-2: Builds hierarchical structure with parent-child relationships
  - PI-2 Refactor: Creates vscode.Range objects during parsing for DocumentSymbol compatibility
- `extension.ts` - Main activation logic
  - PI-2: Syncs tree view selection with editor cursor position
  - PI-2 Refactor: Accesses line numbers via `item.selectionRange.start.line`
  - PI-3: Registers `selectItem` and `moveSection` commands
  - PI-3: Integrates TreeDragAndDropController
- `TreeDragAndDropController` - Handles drag and drop operations
  - PI-3: Serializes/deserializes OutlineItem data for drag & drop
  - PI-3: Implements text movement logic (cut from source, paste at target)
  - PI-3: Supports dropping before target or at end of document

**PI-2 Refactoring (DocumentSymbol API):**
Refactored to use VS Code's DocumentSymbol-compatible Range semantics instead of simple line numbers. This provides:
- More precise position tracking with character-level granularity
- Better preparation for PI-3 drag & drop (accurate text range extraction)
- Alignment with VS Code's standard outline APIs
- Simplified test suite (reduced from 35+ to 6 focused tests)

**Future Extensions:**
- JavaScriptOutlineProvider
- TypeScriptOutlineProvider
- PythonOutlineProvider
- etc.

## License

MIT
