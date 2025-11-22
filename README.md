![logo](icon.png) [![CI](https://github.com/doughgle/outline-eclipsed/actions/workflows/ci.yml/badge.svg)](https://github.com/doughgle/outline-eclipsed/actions/workflows/ci.yml)
# Outline Eclipsed

_Outline Eclipsed_: An outline view for VS Code that lets you drag and drop to reorganize your document structure.

🪐 A VS Code extension that provides an interactive outline tree view for multiple programming languages. Inspired by the Eclipse IDE, Outline Eclipsed lets you reorder sections by dragging and dropping symbols.

💡 Reorganizing long documents is tedious. Instead of cutting and pasting text blocks, just drag symbols in the tree view. Nested sections move together automatically. The editor highlights and scrolls to show exactly what moved. You stay focused on structure, not on selecting text ranges.

⏩ Install from the VS Code Marketplace and open any supported file. The "Outline Eclipsed" view appears in the Explorer sidebar. Click symbols to navigate. Drag them to reorganize.

### Demo

![demo](https://videoapi-muybridge.vimeocdn.com/animated-thumbnails/image/afa8a690-2e99-4f3f-8091-0471213bb984.gif?ClientID=sulu&Date=1761467805&Signature=b3c03e96e6468db8e83b3227cc3748f051df2334)


### Features

- **Drag & Drop Reordering**: Drag symbols to reorder sections in Markdown and JSON files. Nested symbols move with their parent automatically.
  - **Markdown**: Reorder headings and their nested content
  - **JSON/JSONC**: Reorder properties within objects (auto-formatted after move)
- **Bidirectional Sync**: Click a symbol to jump to that location. Move your cursor, and the tree highlights the current symbol.
- **Visual Feedback**: After dragging, the editor auto-scrolls and highlights the moved section for 1.5 seconds.
- **Real-Time Updates**: The tree refreshes automatically as you edit the document.
- **Hierarchical View**: See your document structure at a glance with expandable/collapsible nested symbols.
- **Rich Information Display**: Tree items show values for constants and data keys, with detailed tooltips including symbol type and line information.
- **Multi-Language Support**: Outline viewing works with any language that provides document symbols (TypeScript, JavaScript, Python, C++, Java, and more). Drag & drop supported for Markdown and JSON.
- **Graceful Language Server Activation**: Outline auto-refreshes when symbols become available; shows a short status message if symbols aren't ready yet.

### Installation

```bash
# Via VS Code Marketplace
ext install douglashellinger.outline-eclipsed
```

Or search for "Outline Eclipsed" in the Extensions view (`Ctrl+Shift+X`).

### Usage

1. Open any supported file (markdown, TypeScript, Python, etc.)
2. Find "Outline Eclipsed" in the Explorer sidebar
3. Click any symbol to navigate to that location
4. Drag and drop symbols to reorganize sections
5. Watch the editor highlight and scroll to show the moved content

### Language Support

- ✅ **Markdown** — H1–H6 headings with custom provider (full drag & drop support)
- ✅ **JSON/JSONC** — Properties and nested objects (full drag & drop support with auto-formatting)
- ✅ **TypeScript/JavaScript** — Classes, functions, methods, properties (view-only outline)
- ✅ **Python** — Classes, functions, methods (view-only outline)
- ✅ **Java** — Classes, methods, fields (view-only outline)
- ✅ **C/C++** — Classes, functions, structs (view-only outline)
- ✅ **Any language with VS Code symbol provider** — Generic viewing support

### Development

```bash
# Clone and install dependencies
git clone https://github.com/doughgle/outline-eclipsed.git
cd outline-eclipsed
npm install

# Compile TypeScript
npm run compile

# Watch mode (auto-compile on save)
npm run watch

# Run tests
npm test
```

### Manual Testing

Press **F5** to launch the Extension Development Host, then open `test-fixtures/sample.md`. Test the following:

- **Navigation**: Click headings to jump to sections
- **Selection Sync**: Move cursor in editor, verify tree highlights current heading
- **Drag & Drop**: Drag a heading to reorder sections
- **Visual Feedback**: Verify editor auto-scrolls and highlights moved section
- **Real-Time Updates**: Edit document, verify tree refreshes

### [Roadmap](https://github.com/doughgle/outline-eclipsed/issues)

- ✅ **PI-0–7**: Markdown outline, nested drag & drop, multi-select, enhanced highlights
- ✅ **PI-8**: Multi-language outline viewing (JavaScript, TypeScript, Python)
- ✅ **PI-9**: Rich tree item descriptions and tooltips — line ranges and symbol information
- ✅ **PI-10**: JSON/JSONC drag & drop support with auto-formatting
- 🔲 **PI-11**: Show outline for markdown preview when focused
- 🔲 **PI-12**: Additional markdown symbols (code blocks, quotes)
- 🔲 **PI-13**: Configuration options
- 🔲 **Future**: Enable drag & drop for additional languages; advanced customization

### License

MIT