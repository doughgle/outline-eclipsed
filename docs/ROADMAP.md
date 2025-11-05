# Outline Eclipsed Roadmap

### Next Product Increments
- ✅ **PI-0-5**: Markdown outline with drag & drop and visual feedback
- ✅ **PI-6**: Multi-select drag & drop
  - fix code fence drag and drop issues
- ✅ **PI-7**: Enhanced "magnetic snap" highlights - more prominent visual feedback with overview ruler
- 🔲 **PI-8**: Support for additional languages (JavaScript, TypeScript, Python)
- 🔲 **PI-9**: Configuration options
- 🔲 **Future**: Support for JavaScript, TypeScript, Python, and other languages

### PI-0: Extension Skeleton ✅

### PI-1: Basic TreeView ✅
- Flat list of markdown headings (H1-H6)
- Click to navigate to heading
- Real-time updates on document changes

### PI-2: Hierarchical Tree Structure ✅
- Nested headings with expand/collapse
- Selection sync (tree follows cursor)
- Handles edge cases (skipped levels, deep nesting)

### PI-3: Basic Drag & Drop ✅
- Drag headings to reorder sections
- Text movement preserves content
- SelectItem command for full section selection

### PI-4: Nested Heading Drag & Drop ✅
- Parent headings move with all children
- Nested sections move as a unit
- Proper range calculation for descendants

### PI-5: Visual Feedback ✅
- Moved text highlights for 3 seconds
- Editor auto-scrolls to reveal moved section
- Theme-aware highlight colors
- Focus stays in tree view (no interruption)

### PI-6: Multi-Select & Code Block Fix ✅
- Multi-select drag & drop with Ctrl/Cmd+Click
- Filters out redundant child items automatically
- Fixed code block parsing bug (# in bash comments)
- Uses built-in markdown parser for accurate boundaries

### PI-7: Magnetic Snap Highlights ✅
- Enhanced visual feedback with 2px solid borders
- Overview ruler indicators (visible in scrollbar for easy location)
- Quick 1.5 second highlight duration (non-intrusive)
- Immediate reveal in center of viewport
- Theme-aware colors for all color schemes
