import * as vscode from 'vscode';

/**
 * Represents an item in the outline tree.
 * Generic model that can represent different symbol types across languages.
 * 
 * PI-2 Refactor: Uses DocumentSymbol-compatible Range semantics:
 * - range: Full extent of the symbol (entire section including content)
 * - selectionRange: Just the identifier (heading line only)
 */
export class OutlineItem extends vscode.TreeItem {
    /**
     * Parent item in the tree (PI-2: needed for getParent() implementation)
     */
    public parent: OutlineItem | undefined;

    /**
     * Creates an outline item
     * @param label - Display text for the item
     * @param level - Hierarchy level (e.g., H1=1, H2=2 for markdown)
     * @param range - Full extent of symbol (whole section including content)
     * @param selectionRange - Identifier range (heading line only)
     * @param children - Child outline items
     * @param symbolKind - Optional VS Code symbol kind for icon mapping
     */
    constructor(
        public readonly label: string,
        public readonly level: number,
        public readonly range: vscode.Range,
        public readonly selectionRange: vscode.Range,
        public readonly children: OutlineItem[] = [],
        public readonly symbolKind?: vscode.SymbolKind
    ) {
        super(
            label,
            children.length > 0 
                ? vscode.TreeItemCollapsibleState.Collapsed 
                : vscode.TreeItemCollapsibleState.None
        );

        // Use 'symbol-string' icon (abc icon) - same as VS Code default outline for markdown
        this.iconPath = new vscode.ThemeIcon('symbol-string');
        
        // No description needed - level is shown through tree hierarchy
        this.description = undefined;
        
        // Set context value for future command filtering
        this.contextValue = 'outlineItem';
        
        // Command to jump to item when clicked (use selectionRange for cursor position)
        this.command = {
            command: 'outlineEclipsed.gotoItem',
            title: 'Go to Item',
            arguments: [this.selectionRange.start.line]
        };
    }

    /**
     * Gets the full range of this section including all content and subsections.
     * Simply returns the range property (already represents full section).
     */
    getFullRange(): vscode.Range {
        return this.range;
    }
}
