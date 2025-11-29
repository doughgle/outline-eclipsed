import * as vscode from 'vscode';
import { GenericOutlineProvider } from './genericOutlineProvider';
import { OutlineItem } from './outlineItem';
import { 
    parseMarkdownSymbols, 
    splitIntoLines, 
    MarkdownSymbol, 
    MarkdownSymbolType 
} from './markdownParser';

/**
 * Markdown-specific outline provider.
 * Extends GenericOutlineProvider with markdown-specific symbol name sanitization
 * and level mapping for heading hierarchies.
 * 
 * PI-2: Builds hierarchical tree based on heading levels (H1-H6)
 * PI-11: Adds support for code blocks, quote blocks, and images
 */
export class MarkdownOutlineProvider extends GenericOutlineProvider {
    
    /**
     * Removes # prefix from heading text returned by built-in markdown parser.
     * Trims whitespace from the result.
     * 
     * @param text - Heading text (may include # prefix)
     * @returns Clean heading text without # prefix
     */
    protected sanitizeSymbolName(text: string): string {
        const match = /^#{1,6}\s+(.+)$/.exec(text);
        return match ? match[1].trim() : text.trim();
    }

    /**
     * Extracts heading level from a markdown symbol.
     * Maps markdown heading symbols to levels 1-6.
     * 
     * The built-in markdown parser uses:
     * - SymbolKind.File for H1
     * - SymbolKind.String for H2-H6 (with # prefix in name)
     * 
     * @param symbol - Symbol to extract level from
     * @returns Heading level (1-6)
     */
    protected getLevelFromSymbol(symbol: vscode.SymbolInformation | vscode.DocumentSymbol): number {
        // Built-in markdown parser uses File for H1 and String for H2-H6
        switch (symbol.kind) {
            case vscode.SymbolKind.File:
                return 1;
            
            case vscode.SymbolKind.String: {
                // Try to determine level from name (# prefix count)
                const match = /^(#{1,6})\s/.exec(symbol.name);
                if (match) {
                    return match[1].length;
                }
                // Default to level 2 if can't determine
                return 2;
            }
            
            // Fallback to generic mapping for other symbol kinds
            default:
                return super.getLevelFromSymbol(symbol);
        }
    }

    /**
     * PI-11: Override parseDocument to combine VS Code headings with custom parser symbols.
     * 
     * Strategy:
     * 1. Get heading symbols from VS Code's built-in markdown parser (via super.parseDocument)
     * 2. Parse additional symbols (code blocks, quotes, images) with custom parser
     * 3. Merge and sort all symbols by line position
     * 4. Build hierarchy with headings as parents and other symbols as leaves
     * 
     * @param document - Document to parse
     * @returns Array of root-level outline items with nested children
     */
    protected async parseDocument(document: vscode.TextDocument): Promise<OutlineItem[]> {
        // Step 1: Get headings from VS Code's built-in parser
        const headingItems = await super.parseDocument(document);
        
        // Step 2: Parse additional symbols with custom parser
        const text = document.getText();
        const lines = splitIntoLines(text);
        const customSymbols = parseMarkdownSymbols(lines);
        
        // Filter out headings from custom parser (we already have them from VS Code)
        // and convert to OutlineItems
        const additionalSymbols = customSymbols
            .filter(s => s.type !== MarkdownSymbolType.Heading)
            .map(s => this.convertToOutlineItem(s, document));
        
        // Step 3: Merge all items and sort by start line
        const allItems = [...this.flattenItems(headingItems), ...additionalSymbols];
        allItems.sort((a, b) => a.range.start.line - b.range.start.line);
        
        // Step 4: Build hierarchy with headings containing other symbols
        return this.buildEnhancedHierarchy(allItems);
    }

    /**
     * Converts a MarkdownSymbol to an OutlineItem.
     * 
     * @param symbol - The parsed markdown symbol
     * @param document - The source document
     * @returns OutlineItem for the symbol
     */
    private convertToOutlineItem(symbol: MarkdownSymbol, document: vscode.TextDocument): OutlineItem {
        const range = new vscode.Range(
            symbol.startLine, symbol.startChar,
            symbol.endLine, symbol.endChar
        );
        
        const selectionRange = new vscode.Range(
            symbol.startLine, symbol.startChar,
            symbol.startLine, document.lineAt(symbol.startLine).text.length
        );
        
        // Map symbol type to VS Code SymbolKind
        const symbolKind = this.getSymbolKindForType(symbol.type);
        
        return new OutlineItem(
            symbol.label,
            symbol.level,
            range,
            selectionRange,
            [], // Children will be populated by buildEnhancedHierarchy
            symbolKind,
            document,
            symbol.detail
        );
    }

    /**
     * Maps MarkdownSymbolType to VS Code SymbolKind for proper icons.
     */
    private getSymbolKindForType(type: MarkdownSymbolType): vscode.SymbolKind {
        switch (type) {
            case MarkdownSymbolType.CodeBlock:
                return vscode.SymbolKind.Struct; // Code block icon
            case MarkdownSymbolType.QuoteBlock:
                return vscode.SymbolKind.String; // Quote uses string icon
            case MarkdownSymbolType.Image:
                return vscode.SymbolKind.File; // Image uses file icon
            default:
                return vscode.SymbolKind.String;
        }
    }

    /**
     * Flattens a hierarchical tree of items into a flat list.
     * Preserves all items including nested children.
     */
    private flattenItems(items: OutlineItem[]): OutlineItem[] {
        const result: OutlineItem[] = [];
        
        const flatten = (item: OutlineItem) => {
            // Clone the item without children for flattening
            const flatItem = new OutlineItem(
                item.label,
                item.level,
                item.range,
                item.selectionRange,
                [], // Clear children - will be rebuilt
                item.symbolKind,
                undefined, // No document needed for cloning
                undefined
            );
            result.push(flatItem);
            
            // Recursively flatten children
            for (const child of item.children) {
                flatten(child);
            }
        };
        
        for (const item of items) {
            flatten(item);
        }
        
        return result;
    }

    /**
     * PI-11: Builds enhanced hierarchy where headings are parents.
     * Non-heading symbols (code blocks, quotes, images) become children of
     * the heading section they appear in.
     * 
     * @param flatItems - Flat array of all items sorted by line position
     * @returns Array of root-level items with nested children
     */
    private buildEnhancedHierarchy(flatItems: OutlineItem[]): OutlineItem[] {
        if (flatItems.length === 0) {
            return [];
        }
        
        const rootItems: OutlineItem[] = [];
        const stack: OutlineItem[] = [];
        
        for (const item of flatItems) {
            // Pop items from stack until we find a valid parent (lower level number = higher in hierarchy)
            while (stack.length > 0 && stack[stack.length - 1].level >= item.level) {
                stack.pop();
            }
            
            if (stack.length === 0) {
                // No parent - this is a root item
                item.parent = undefined;
                rootItems.push(item);
            } else {
                // Add as child of the item at top of stack
                const parent = stack[stack.length - 1];
                item.parent = parent;
                parent.children.push(item);
            }
            
            // Only push headings onto stack (they can have children)
            // Non-heading symbols (level 7) should not become parents
            if (item.level < 7) {
                stack.push(item);
            }
        }
        
        return rootItems;
    }
}
