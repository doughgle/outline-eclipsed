import * as vscode from 'vscode';

/**
 * Represents an item in the outline tree.
 * Generic model that can represent different symbol types across languages.
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
     * @param line - Start line number in document
     * @param endLine - End line number (inclusive) of this item's section
     * @param children - Child outline items
     * @param symbolKind - Optional VS Code symbol kind for icon mapping
     */
    constructor(
        public readonly label: string,
        public readonly level: number,
        public readonly line: number,
        public readonly endLine: number,
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
        
        // Command to jump to item when clicked
        this.command = {
            command: 'outlineEclipsed.gotoItem',
            title: 'Go to Item',
            arguments: [this.line]
        };
    }

    /**
     * Gets the full range of this section including all content and subsections
     */
    getFullRange(): vscode.Range {
        return new vscode.Range(this.line, 0, this.endLine, Number.MAX_VALUE);
    }
}
