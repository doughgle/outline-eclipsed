import * as vscode from 'vscode';
import { OutlineProvider } from './outlineProvider';
import { OutlineItem } from './outlineItem';

/**
 * Markdown-specific outline provider.
 * Parses markdown headings to build outline tree.
 * 
 * PI-2: Builds hierarchical tree based on heading levels
 */
export class MarkdownOutlineProvider extends OutlineProvider {
    
    /**
     * Parses markdown document to extract hierarchical outline structure.
     * 
     * Uses VS Code's built-in markdown parser via executeDocumentSymbolProvider command.
     * This leverages the vscode.markdown-language-features extension which handles
     * code blocks, inline code, and other edge cases correctly.
     * 
     * PI-2: Builds nested hierarchy where H2 is child of H1, H3 is child of H2, etc.
     * PI-2 Refactor: Creates DocumentSymbol-compatible Range objects.
     * Handles edge cases like skipped levels and documents without root H1.
     * 
     * @param document - Markdown document to parse
     * @returns Array of root-level outline items with nested children
     */
    protected async parseDocument(document: vscode.TextDocument): Promise<OutlineItem[]> {
        try {
            // Use built-in markdown parser via executeDocumentSymbolProvider
            const symbols = await vscode.commands.executeCommand<(vscode.SymbolInformation | vscode.DocumentSymbol)[]>(
                'vscode.executeDocumentSymbolProvider',
                document.uri
            );

            if (!symbols || symbols.length === 0) {
                return [];
            }

            // Convert symbols to OutlineItems
            const flatHeadings = this.convertSymbolsToOutlineItems(symbols, document);
            const rootItems = this.buildHierarchy(flatHeadings);
            
            console.log(`PI-2: Parsed ${flatHeadings.length} headings (${rootItems.length} root) from ${document.fileName}`);
            return rootItems;
        } catch (error) {
            console.error('Failed to execute document symbol provider:', error);
            return [];
        }
    }

    /**
     * Converts VS Code symbols (SymbolInformation or DocumentSymbol) to OutlineItems.
     * Flattens hierarchical DocumentSymbol structure into flat list.
     * 
     * @param symbols - Array of symbols from built-in parser
     * @param document - Source document
     * @returns Flat array of outline items in document order
     */
    private convertSymbolsToOutlineItems(
        symbols: (vscode.SymbolInformation | vscode.DocumentSymbol)[],
        document: vscode.TextDocument
    ): OutlineItem[] {
        const items: OutlineItem[] = [];

        const processSymbol = (symbol: vscode.SymbolInformation | vscode.DocumentSymbol) => {
            let range: vscode.Range;
            let selectionRange: vscode.Range;
            let name: string;
            let kind: vscode.SymbolKind;
            
            name = symbol.name;
            kind = symbol.kind;
            
            // Clean up heading text - remove # prefix that built-in parser includes
            name = this.sanitizeSymbolName(name);
            
            if (this.isDocumentSymbol(symbol)) {
                // DocumentSymbol has hierarchical children
                range = symbol.range;
                selectionRange = symbol.selectionRange;

                // Flatten children recursively
                if (symbol.children && symbol.children.length > 0) {
                    for (const child of symbol.children) {
                        processSymbol(child);
                    }
                }
            } else {
                // SymbolInformation is flat
                range = symbol.location.range;
                selectionRange = symbol.location.range;
            }

            // Extract heading level from symbol
            const level = this.getLevelFromSymbol(symbol);
            const item = new OutlineItem(
                name,
                level,
                range,
                selectionRange,
                [], // Children will be populated in buildHierarchy
                kind
            );

            items.push(item);
        };

        for (const symbol of symbols) {
            processSymbol(symbol);
        }

        // Sort by document order (line number)
        items.sort((a, b) => a.range.start.line - b.range.start.line);

        return items;
    }

    /**
     * Type guard to check if symbol is DocumentSymbol (has range property).
     * 
     * @param symbol - Symbol to check
     * @returns True if symbol is DocumentSymbol
     */
    private isDocumentSymbol(symbol: vscode.SymbolInformation | vscode.DocumentSymbol): symbol is vscode.DocumentSymbol {
        return 'range' in symbol;
    }

    /**
     * Removes # prefix from heading text returned by built-in parser.
     * Trims whitespace from the result.
     * 
     * @param text - Heading text (may include # prefix)
     * @returns Clean heading text without # prefix
     */
    private sanitizeSymbolName(text: string): string {
        const match = /^#{1,6}\s+(.+)$/.exec(text);
        return match ? match[1].trim() : text.trim();
    }

    /**
     * Extracts heading level from a symbol.
     * Uses the symbol's line text to determine heading level (1-6).
     * Falls back to inferring from SymbolKind if text parsing fails.
     * 
     * @param symbol - Symbol to extract level from
     * @returns Heading level (1-6)
     */
    private getLevelFromSymbol(symbol: vscode.SymbolInformation | vscode.DocumentSymbol): number {
        // Infer level from SymbolKind (built-in parser uses File/String for headings)
        // We'll map back to heading levels 1-6
        switch (symbol.kind) {
            case vscode.SymbolKind.Module: return 1;
            case vscode.SymbolKind.Class: return 2;
            case vscode.SymbolKind.Method: return 3;
            case vscode.SymbolKind.Function: return 4;
            case vscode.SymbolKind.Property: return 5;
            case vscode.SymbolKind.Variable: return 6;
            // Built-in markdown parser uses File for H1 and String for H2-H6
            case vscode.SymbolKind.File: return 1;
            case vscode.SymbolKind.String: {
                // Try to determine level from name (# prefix count)
                const match = /^(#{1,6})\s/.exec(symbol.name);
                if (match) {
                    return match[1].length;
                }
                // Default to level 2 if can't determine
                return 2;
            }
            default: return 1;
        }
    }

    /**
     * Builds hierarchical tree structure from flat list of headings.
     * 
     * Algorithm:
     * - Maintain a stack of potential parent headings
     * - For each heading, find its parent by looking back for nearest higher-level heading
     * - Add heading to parent's children or to root list
     * 
     * @param flatHeadings - Flat array of all headings in document order
     * @returns Array of root-level items with nested children
     */
    private buildHierarchy(flatHeadings: OutlineItem[]): OutlineItem[] {
        if (flatHeadings.length === 0) {
            return [];
        }
        
        const rootItems: OutlineItem[] = [];
        const stack: OutlineItem[] = [];
        
        for (const heading of flatHeadings) {
            while (stack.length > 0 && stack[stack.length - 1].level >= heading.level) {
                stack.pop();
            }
            
            if (stack.length === 0) {
                heading.parent = undefined;
                rootItems.push(heading);
            } else {
                const parent = stack[stack.length - 1];
                heading.parent = parent;
                parent.children.push(heading);
            }
            
            stack.push(heading);
        }
        
        return rootItems;
    }

}
