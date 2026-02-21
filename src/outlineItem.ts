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
 * Extracts a value description for the symbol.
 * PI-9: Uses symbol.detail from language server when available.
 * Avoids re-parsing document text unless necessary.
 * 
 * @param symbolDetail - The detail property from DocumentSymbol (from language server)
 * @param document - The document containing the symbol (only for rare fallback cases)
 * @param range - Full range of the symbol
 * @param selectionRange - Range of just the symbol name/key
 * @param symbolKind - The kind of symbol
 * @param languageId - The language ID of the document
 * @returns Description string (truncated to one line) or undefined
 */
function extractValueDescription(
    symbolDetail: string | undefined,
    document: vscode.TextDocument | undefined,
    range: vscode.Range,
    selectionRange: vscode.Range,
    symbolKind: vscode.SymbolKind | undefined,
    languageId: string | undefined
): string | undefined {
    // Use the detail from the language server when available
    // This works for all languages including data formats (JSON, YAML, TOML)
    if (symbolDetail) {
        // Clean up the detail: truncate and ensure single line
        let detail = symbolDetail.trim();
        detail = detail.replace(/\n.*/g, '').trim();
        if (detail.length > 50) {
            detail = detail.substring(0, 47) + '...';
        }
        return detail;
    }
    
    // No detail available and no document to parse - can't extract value
    if (!document) {
        return undefined;
    }

    // Rare fallback: Only parse document text when detail is not available
    // This should rarely happen with modern language servers
    const lang = languageId || document.languageId;
    
    // For data interchange formats (JSON, YAML, TOML), extract the value from source
    if (lang === 'json' || lang === 'jsonc' || lang === 'yaml' || lang === 'toml') {
        return extractDataValue(document, range, selectionRange);
    }
    
    // For programming languages, parse the value from source as last resort
    if (symbolKind === vscode.SymbolKind.Constant || 
        symbolKind === vscode.SymbolKind.Variable ||
        symbolKind === vscode.SymbolKind.EnumMember) {
        return extractConstantValue(document, range, selectionRange);
    }
    
    return undefined;
}

/**
 * Extracts the value from data format files (JSON, YAML, TOML).
 * Truncates to single line and limits length.
 */
function extractDataValue(
    document: vscode.TextDocument,
    range: vscode.Range,
    selectionRange: vscode.Range
): string | undefined {
    try {
        // Get the full line containing the selection
        const line = document.lineAt(selectionRange.start.line);
        const lineText = line.text;
        
        // Try to extract value after colon or equals
        const colonMatch = lineText.match(/:\s*(.+?)$/);
        const equalsMatch = lineText.match(/=\s*(.+?)$/);
        
        let value = colonMatch?.[1] || equalsMatch?.[1];
        
        if (!value) {
            // For multiline values, try to get the first line of content
            if (range.end.line > selectionRange.end.line) {
                const nextLine = document.lineAt(selectionRange.start.line + 1);
                value = nextLine.text.trim();
            }
        }
        
        if (value) {
            // Remove trailing comma, semicolon, braces, brackets
            value = value.replace(/[,;{}\[\]]+$/, '').trim();
            // Truncate to reasonable length and ensure single line
            value = value.replace(/\n.*/g, '').trim();
            if (value.length > 50) {
                value = value.substring(0, 47) + '...';
            }
            return value;
        }
    } catch (error) {
        // Ignore extraction errors
    }
    
    return undefined;
}

/**
 * Extracts the value assigned to a constant or variable.
 * Looks for assignment on the same line or next line.
 */
function extractConstantValue(
    document: vscode.TextDocument,
    range: vscode.Range,
    selectionRange: vscode.Range
): string | undefined {
    try {
        // Get the line containing the symbol
        const line = document.lineAt(selectionRange.start.line);
        const lineText = line.text;
        
        // Look for assignment pattern: = value (prioritize = over : to avoid type annotations)
        const assignmentMatch = lineText.match(/=\s*(.+?)(?:[,;]|$)/);
        
        if (assignmentMatch && assignmentMatch[1]) {
            let value = assignmentMatch[1].trim();
            // Remove trailing semicolons, commas
            value = value.replace(/[,;]+$/, '').trim();
            // Ensure single line
            value = value.replace(/\n.*/g, '').trim();
            // Truncate if too long
            if (value.length > 50) {
                value = value.substring(0, 47) + '...';
            }
            return value;
        }
    } catch (error) {
        // Ignore extraction errors
    }
    
    return undefined;
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
 * PI-9: Enriched with description (value for constants/data) and tooltip (detailed info)
 */
export class OutlineItem extends vscode.TreeItem {
    /**
     * Parent item in the tree (PI-2: needed for getParent() implementation)
     */
    public parent: OutlineItem | undefined;

    /** Marks this item as a placeholder drop zone at the end of the tree. */
    public isPlaceholder?: boolean;

    /** Marks this item as a read-only warning indicator at the top of the tree. */
    public isReadOnlyWarning?: boolean;

    /**
     * Creates an outline item
     * @param label - Display text for the item
     * @param level - Hierarchy level (e.g., H1=1, H2=2 for markdown)
     * @param range - Full extent of symbol (whole section including content)
     * @param selectionRange - Identifier range (heading line only)
     * @param children - Child outline items
     * @param symbolKind - Optional VS Code symbol kind for icon mapping
     * @param document - Optional document for extracting values (fallback)
     * @param symbolDetail - Optional detail from DocumentSymbol (preferred)
     */
    constructor(
        public readonly label: string,
        public readonly level: number,
        public readonly range: vscode.Range,
        public readonly selectionRange: vscode.Range,
        public readonly children: OutlineItem[] = [],
        public readonly symbolKind?: vscode.SymbolKind,
        document?: vscode.TextDocument,
        symbolDetail?: string
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
        
        // PI-9: Extract value description for constants and data formats
        // Prefer symbolDetail from language server, fall back to parsing document text
        this.description = extractValueDescription(
            symbolDetail,
            document,
            range,
            selectionRange,
            symbolKind,
            document?.languageId
        );
        
        // PI-9: Provide detailed tooltip with symbol info and line numbers
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
