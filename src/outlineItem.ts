import * as vscode from 'vscode';

/**
 * Maps VS Code SymbolKind to the corresponding ThemeIcon id.
 * Uses VS Code's built-in symbol icon names.
 * 
 * @param kind - The symbol kind to map
 * @returns ThemeIcon id string
 */
function getIconIdForSymbolKind(kind: vscode.SymbolKind): string {
    switch (kind) {
        case vscode.SymbolKind.File: return 'symbol-file';
        case vscode.SymbolKind.Module: return 'symbol-module';
        case vscode.SymbolKind.Namespace: return 'symbol-namespace';
        case vscode.SymbolKind.Package: return 'symbol-package';
        case vscode.SymbolKind.Class: return 'symbol-class';
        case vscode.SymbolKind.Method: return 'symbol-method';
        case vscode.SymbolKind.Property: return 'symbol-property';
        case vscode.SymbolKind.Field: return 'symbol-field';
        case vscode.SymbolKind.Constructor: return 'symbol-constructor';
        case vscode.SymbolKind.Enum: return 'symbol-enum';
        case vscode.SymbolKind.Interface: return 'symbol-interface';
        case vscode.SymbolKind.Function: return 'symbol-function';
        case vscode.SymbolKind.Variable: return 'symbol-variable';
        case vscode.SymbolKind.Constant: return 'symbol-constant';
        case vscode.SymbolKind.String: return 'symbol-string';
        case vscode.SymbolKind.Number: return 'symbol-number';
        case vscode.SymbolKind.Boolean: return 'symbol-boolean';
        case vscode.SymbolKind.Array: return 'symbol-array';
        case vscode.SymbolKind.Object: return 'symbol-object';
        case vscode.SymbolKind.Key: return 'symbol-key';
        case vscode.SymbolKind.Null: return 'symbol-null';
        case vscode.SymbolKind.EnumMember: return 'symbol-enum-member';
        case vscode.SymbolKind.Struct: return 'symbol-struct';
        case vscode.SymbolKind.Event: return 'symbol-event';
        case vscode.SymbolKind.Operator: return 'symbol-operator';
        case vscode.SymbolKind.TypeParameter: return 'symbol-type-parameter';
        default: return 'symbol-misc';
    }
}

/**
 * Gets the human-readable name for a SymbolKind.
 * PI-9: Used in tooltip generation.
 * 
 * @param kind - The symbol kind
 * @returns Human-readable kind name
 */
function getSymbolKindName(kind: vscode.SymbolKind): string {
    return vscode.SymbolKind[kind];
}

/**
 * Formats a line range for display.
 * PI-9: Shows line numbers in 1-based indexing (L6 instead of L5 for line index 5).
 * 
 * @param range - The range to format
 * @returns Formatted line range (e.g., "L6" or "L6-L11")
 */
function formatLineRange(range: vscode.Range): string {
    const startLine = range.start.line + 1;  // Convert to 1-based
    const endLine = range.end.line + 1;      // Convert to 1-based
    
    if (startLine === endLine) {
        return `L${startLine}`;
    } else {
        return `L${startLine}-L${endLine}`;
    }
}

/**
 * Creates a tooltip with detailed information about the symbol.
 * PI-9: Provides rich hover information for tree items.
 * 
 * @param label - The symbol label
 * @param range - The symbol's full range
 * @param symbolKind - Optional symbol kind
 * @returns MarkdownString for tooltip
 */
function createTooltip(label: string, range: vscode.Range, symbolKind?: vscode.SymbolKind): vscode.MarkdownString {
    const lineRange = formatLineRange(range);
    const startLine = range.start.line + 1;
    const endLine = range.end.line + 1;
    
    let tooltip = new vscode.MarkdownString();
    tooltip.appendMarkdown(`**${label}**\n\n`);
    
    if (symbolKind !== undefined) {
        tooltip.appendMarkdown(`*${getSymbolKindName(symbolKind)}*\n\n`);
    }
    
    if (startLine === endLine) {
        tooltip.appendMarkdown(`Line ${startLine}`);
    } else {
        tooltip.appendMarkdown(`Lines ${startLine}-${endLine}`);
    }
    
    return tooltip;
}

/**
 * Represents an item in the outline tree.
 * Generic model that can represent different symbol types across languages.
 * 
 * PI-2 Refactor: Uses DocumentSymbol-compatible Range semantics:
 * - range: Full extent of the symbol (entire section including content)
 * - selectionRange: Just the identifier (heading line only)
 * 
 * PI-9: Enriched with description (line range) and tooltip (detailed info)
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

        // Use VS Code's native icon mapping for symbol kinds
        // This provides language-appropriate icons (function, class, method, etc.)
        if (symbolKind !== undefined) {
            this.iconPath = new vscode.ThemeIcon(getIconIdForSymbolKind(symbolKind));
        } else {
            // Fallback for markdown or other non-symbol-based content
            this.iconPath = new vscode.ThemeIcon('symbol-string');
        }
        
        // PI-9: Show line range in description
        this.description = formatLineRange(range);
        
        // PI-9: Provide detailed tooltip with symbol info
        this.tooltip = createTooltip(label, range, symbolKind);
        
        // Set context value for future command filtering
        this.contextValue = 'outlineItem';
        
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
