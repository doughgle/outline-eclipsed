import * as vscode from 'vscode';
import { GenericOutlineProvider } from './genericOutlineProvider';

/**
 * Markdown-specific outline provider.
 * Extends GenericOutlineProvider with markdown-specific symbol name sanitization
 * and level mapping for heading hierarchies.
 * 
 * PI-2: Builds hierarchical tree based on heading levels (H1-H6)
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
}
