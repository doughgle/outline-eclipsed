import * as vscode from 'vscode';
import { GenericOutlineProvider } from './genericOutlineProvider';

/**
 * YAML-specific outline provider.
 * Extends GenericOutlineProvider with YAML-specific symbol handling.
 * 
 * YAML files use VS Code's built-in document symbol provider (from YAML extension).
 * This provider focuses on enabling drag & drop for YAML key reorganization.
 */
export class YamlOutlineProvider extends GenericOutlineProvider {
    
    /**
     * Sanitizes YAML symbol names by removing quotes and trimming whitespace.
     * YAML keys may be returned with quotes from the symbol provider.
     * 
     * @param text - Symbol name from YAML symbol provider
     * @returns Clean symbol name
     */
    protected sanitizeSymbolName(text: string): string {
        // Remove surrounding quotes if present
        let cleaned = text.trim();
        if ((cleaned.startsWith('"') && cleaned.endsWith('"')) ||
            (cleaned.startsWith("'") && cleaned.endsWith("'"))) {
            cleaned = cleaned.slice(1, -1);
        }
        return cleaned;
    }

    /**
     * Maps YAML symbols to hierarchical levels.
     * YAML uses Property/Field symbols for keys, with nesting determined by document structure.
     * 
     * The built-in YAML symbol provider typically uses:
     * - SymbolKind.Property or SymbolKind.Field for YAML keys
     * - Hierarchy is determined by DocumentSymbol.children
     * 
     * Since GenericOutlineProvider uses DocumentSymbol.children for hierarchy building,
     * this method only provides fallback level values. The actual hierarchy comes from
     * the DocumentSymbol tree structure, not these numeric levels.
     * 
     * These level mappings are used only when building hierarchy from flat SymbolInformation
     * (which doesn't have children), but most YAML extensions provide hierarchical DocumentSymbols.
     * 
     * @param symbol - Symbol to extract level from
     * @returns Numeric level (lower number = higher in hierarchy)
     */
    protected getLevelFromSymbol(symbol: vscode.SymbolInformation | vscode.DocumentSymbol): number {
        // Provide consistent level mapping for YAML symbol kinds
        // Note: When DocumentSymbol.children is available (typical for YAML),
        // the GenericOutlineProvider uses that hierarchy instead of these levels
        switch (symbol.kind) {
            case vscode.SymbolKind.Property:
            case vscode.SymbolKind.Field:
            case vscode.SymbolKind.String:
            case vscode.SymbolKind.Object:
            case vscode.SymbolKind.Key:
                // YAML keys - top level by default
                return 1;
            
            case vscode.SymbolKind.Array:
                // Array items slightly lower priority
                return 2;
            
            // Fallback to generic mapping for other symbol kinds
            default:
                return super.getLevelFromSymbol(symbol);
        }
    }
}
