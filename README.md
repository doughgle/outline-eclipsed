# Outline Eclipsed

**Outline view that outshines the vscode default** - drag and drop to rearrange your code sections with ease! 🌙✨ Hats off to Eclipse for getting this right 20 years ago.

## Overview

Outline Eclipsed is a VS Code extension that provides a custom tree view for navigating and reorganizing code structure. Unlike the built-in Outline View (which is read-only), Outline Eclipsed allows you to **drag and drop** outline items to reorder sections in your files.

### Current Status: PI-2 (Hierarchical Tree View)

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

**Coming Next:**
- 🔲 Double-click tree view heading selects whole block of text in editor

## Product Increments Roadmap

- ✅ **PI-0**: Extension Skeleton Setup
- ✅ **PI-1**: Basic TreeView for Markdown (Flat List)
- ✅ **PI-2**: Hierarchical Tree Structure with Expand/Collapse
- 🔲 **PI-3**: Basic Drag & Drop (Flat Structure)
- 🔲 **PI-4**: Nested Heading Drag & Drop
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

### Architecture

**Generic Design:**
- `OutlineItem` - Generic tree item model (not markdown-specific)
  - PI-2: Added parent reference for hierarchical navigation
- `OutlineProvider` - Abstract base class for language providers
  - PI-2: Implements `getParent()` (required for TreeView.reveal())
  - PI-2: Implements `findItemAtLine()` for selection sync
- `MarkdownOutlineProvider` - Markdown-specific implementation
  - PI-1: Parses headings into flat list
  - PI-2: Builds hierarchical structure with parent-child relationships
- `extension.ts` - Main activation logic
  - PI-2: Syncs tree view selection with editor cursor position

**Future Extensions:**
- JavaScriptOutlineProvider
- TypeScriptOutlineProvider
- PythonOutlineProvider
- etc.

## License

MIT
