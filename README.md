# Outline Eclipsed

**Outline view that outshines the vscode default** - drag and drop to rearrange your code sections with ease! 🌙✨ Hats off to Eclipse for getting this right 20 years ago.

## Overview

Outline Eclipsed is a VS Code extension that provides a custom tree view for navigating and reorganizing code structure. Unlike the built-in Outline View (which is read-only), Outline Eclipsed allows you to **drag and drop** outline items to reorder sections in your files.

### Current Status: PI-1 (Basic TreeView for Markdown)

**What Works Now:**
- ✅ Extension activates and shows tree view
- ✅ Parses markdown headings (H1-H6)
- ✅ Displays headings in flat list
- ✅ Click heading to navigate in editor
- ✅ Shows heading levels
- ✅ Auto-updates when document changes
- ✅ Supports untitled markdown documents
- ✅ Responds to language mode changes (plaintext → markdown)

**Coming Next (PI-2):**
- 🔲 Build hierarchical tree structure
- 🔲 Nested headings with expand/collapse
- 🔲 Better visual hierarchy indicators

## Product Increments Roadmap

- ✅ **PI-0**: Extension Skeleton Setup
- ✅ **PI-1**: Basic TreeView for Markdown (Flat List)
- 🔲 **PI-2**: Heading Hierarchy Display
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
4. Verify headings appear in the tree
5. Click a heading to navigate to that line in the editor
6. Edit the document and verify tree updates

### Architecture

**Generic Design:**
- `OutlineItem` - Generic tree item model (not markdown-specific)
- `OutlineProvider` - Abstract base class for language providers
- `MarkdownOutlineProvider` - Markdown-specific implementation
  - PI-1: Parses headings into flat list
  - PI-2: Will build hierarchical structure

**Future Extensions:**
- JavaScriptOutlineProvider
- TypeScriptOutlineProvider
- PythonOutlineProvider
- etc.

## License

MIT
