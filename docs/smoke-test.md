# Smoke Test

Press **F5** to launch the Extension Development Host, then open `test-fixtures/sample.md`. Test the following:

- **Navigation**: Click headings to jump to sections
- **Selection Sync**: Move cursor in editor, verify tree highlights current heading
- **Drag & Drop**: Drag a heading to reorder sections
- **Visual Feedback**: Verify editor auto-scrolls and highlights moved section
- **Real-Time Updates**: Edit document, verify tree refreshes
- **Copy Labels**: Select multiple headings (`Ctrl+Click`), then press `Ctrl+C` — verify each label appears on its own line in the clipboard
