![logo](icon.png) [![CI](https://github.com/doughgle/outline-eclipsed/actions/workflows/ci.yml/badge.svg)](https://github.com/doughgle/outline-eclipsed/actions/workflows/ci.yml)
# Outline Eclipsed

_Outline Eclipsed_: An outline view for VS Code that lets you drag and drop to reorganize your document structure.

🪐 A VS Code extension that provides an interactive outline tree view for multiple programming languages. Inspired by the Eclipse IDE, Outline Eclipsed lets you reorder sections by dragging and dropping symbols.

💡 Reorganizing long documents is tedious. Instead of cutting and pasting text blocks, just drag symbols in the tree view. Nested sections move together automatically. The editor highlights and scrolls to show exactly what moved. You stay focused on structure, not on selecting text ranges.

⏩ Install from the VS Code Marketplace and open any supported file. The "Outline Eclipsed" view appears in the Explorer sidebar. Click symbols to navigate. Drag them to reorganize.

### Demo

![demo](https://videoapi-muybridge.vimeocdn.com/animated-thumbnails/image/afa8a690-2e99-4f3f-8091-0471213bb984.gif?ClientID=sulu&Date=1761467805&Signature=b3c03e96e6468db8e83b3227cc3748f051df2334)


### Features

- **Drag & Drop Reordering**: Drag symbols to reorder sections in Markdown, YAML, JSON, HTML, CSS, and XML files. Nested items move with their parent automatically.
- **Bidirectional Sync**: Click a symbol to jump to that location. Move your cursor, and the tree highlights the current symbol.
- **Copy Labels**: Select one or more outline items and press `Ctrl+C` (`Cmd+C` on Mac) or right-click and choose **Copy** to copy their labels to the clipboard — one label per line, in tree order.
- **Visual Feedback**: After dragging, the editor auto-scrolls and highlights the moved section for 3 seconds.
- **Real-Time Updates**: The tree refreshes automatically as you edit the document.
- **Hierarchical View**: See your document structure at a glance with expandable/collapsible nested symbols.
- **Expand/Collapse All**: Quickly expand or collapse all nested nodes in the tree view with custom toolbar buttons that toggle based on the tree state.
- **Rich Information Display**: Tree items show values for constants and data keys, with detailed tooltips including symbol type and line information.
- **Multi-Language Support**: Outline viewing works with any language that provides document symbols (TypeScript, JavaScript, Python, C++, Java, and more). Drag & drop enabled for data/markup formats.
- **Graceful Language Server Activation**: Outline auto-refreshes when symbols become available; shows a short status message if symbols aren't ready yet.
- **Read-Only File Protection**: Drag & drop disabled on read-only files (e.g., viewing git commit history). Shows clear warning with lock icon when file cannot be edited.

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
6. Select one or more symbols and press `Ctrl+C` (`Cmd+C`) to copy their labels to the clipboard

### Language Support

#### Drag & Drop Enabled

| Format | Language IDs | Extension Required |
|--------|-------------|-------------------|
| Markdown | `markdown` | None |
| YAML | `yaml` | [Red Hat YAML](https://marketplace.visualstudio.com/items?itemName=redhat.vscode-yaml) |
| JSON | `json`, `jsonc` | None |
| HTML | `html` | None |
| CSS | `css`, `scss`, `less` | None |
| XML | `xml` | [Red Hat XML](https://marketplace.visualstudio.com/items?itemName=redhat.vscode-xml) |

#### View-Only Outline

These languages show an outline for navigation, but drag & drop is disabled to preserve comments, decorators, and non-symbol code:

- ✅ **TypeScript/JavaScript** — Classes, functions, methods, properties
- ✅ **Python** — Classes, functions, methods
- ✅ **Java** — Classes, methods, fields
- ✅ **C/C++** — Classes, functions, structs
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
- **Copy Labels**: Select multiple headings (`Ctrl+Click`), then press `Ctrl+C` — verify each label appears on its own line in the clipboard

### [Roadmap](./docs/ROADMAP.md)

### Settings

| Setting | Default | Description |
|---------|---------|-------------|
| `outlineEclipsed.highlightDuration` | `1500` | Duration in milliseconds (ms) to highlight moved sections. Minimum: 100 ms. Maximum: 5000 ms. |
| `outlineEclipsed.logLevel` | `"info"` | Controls the verbosity of Outline Eclipsed log output. One of: `off`, `error`, `warn`, `info`, `debug`, `trace`. |

### License

MIT