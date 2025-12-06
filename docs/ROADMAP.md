# Outline Eclipsed Roadmap

### Next Product Increments
- ✅ **PI-0-5**: Markdown outline with drag & drop and visual feedback
- ✅ **PI-6**: Multi-select drag & drop
  - fix code fence drag and drop issues
- ✅ **PI-7**: Enhanced "magnetic snap" highlights - more prominent visual feedback with overview ruler
- ✅ **PI-8**: Multi-language outline viewing (JavaScript, TypeScript, Python)
  - Outline uses native Document Symbols where available
  - Event-driven refresh when symbols become available
  - Drag & drop disabled for non-markdown to avoid losing banner comments and non-symbol code
- ✅ **PI-9**: Enrich tree items with description and tooltip
  - Line range descriptions (e.g., "L6-L11")
  - Rich tooltips with symbol name, type, and line information
  - Works across all supported languages
- ✅ **PI-10**: Fix read-only file drag & drop bug
  - Prevent confusing highlights when attempting drag & drop on read-only files
  - Add visual warning in tree view with lock icon when file is read-only
  - Show clear error message when drop is attempted on read-only file
- ✅ **PI-11**: Enable drag & drop for built-in data/markup/declarative formats (JSON, XML, HTML, CSS, INI)
- 🔲 **PI-12**: enable shortcuts to move items up/down
- 🔲 **PI-13** enable expand all nodes
- 🔲 **PI-14** delete section from outline tree view
- 🔲 **PI-15**: Configuration options
  - config option to drag comments immediately before/after together with chosen symbol item (apply to chosen file extensions). before and after are independent options.
  - config option to drag blank lines immediately before/after together with chosen symbol item (apply to chosen file extensions). before and after are independent options.
  - config option to keep comments/blank lines together with destination items. when dropping (e.g., if dropping between two items that each have comments/blank lines before them, keep those together with the dropped item) 
- 🔲 **PI-16**: show outline for markdown preview when focused
- 🔲 **PI-17**: add addition symbols for markdown e.g. code blocks, quotes
- 🔲 **PI-18**: copy selected markdown headings from outline (currently only copies first item)
 
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

### PI-8: Multi-Language Outline Viewing ✅
- Outline uses native Document Symbols where available
- Works with TypeScript, JavaScript, Python, Java, C++, and more
- Event-driven refresh when symbols become available
- Drag & drop disabled for non-markdown to avoid losing banner comments and non-symbol code
- Graceful handling of language server activation delays
- Multi-language provider architecture for extensibility

### PI-9: Rich Tree Item Descriptions and Tooltips ✅
- Descriptions show values for constants, variables, or data keys (not line numbers)
- Line information (e.g., "L6" or "L6-L11") is shown only in tooltips
- Tooltips provide at-a-glance location info and symbol details
- Rich tooltips with symbol name, type, and line information
- Symbol kind displayed in tooltips (Class, Method, Function, etc.)
- Consistent formatting across all supported languages
- Markdown tooltips for better readability
- Tested with Markdown, TypeScript, JavaScript, and Python

### PI-10: Read-Only File Protection ✅
- Disable drag and drop on read-only files
- User-friendly error message when drop is attempted
