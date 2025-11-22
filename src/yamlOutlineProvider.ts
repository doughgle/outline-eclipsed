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
     * Since GenericOutlineProvider already handles hierarchical DocumentSymbols correctly,
     * we primarily need to ensure proper level mapping for YAML-specific symbol kinds.
     * 
     * @param symbol - Symbol to extract level from
     * @returns Numeric level (lower number = higher in hierarchy)
     */
    protected getLevelFromSymbol(symbol: vscode.SymbolInformation | vscode.DocumentSymbol): number {
        // For YAML, we rely on the native DocumentSymbol hierarchy
        // rather than mapping SymbolKind to levels, since YAML keys at different
        // depths can have the same SymbolKind (Property/Field)
        
        // However, we still provide a basic mapping for consistency
        switch (symbol.kind) {
            case vscode.SymbolKind.Property:
            case vscode.SymbolKind.Field:
            case vscode.SymbolKind.String:
            case vscode.SymbolKind.Object:
            case vscode.SymbolKind.Key:
                // YAML keys - let hierarchy be determined by parent-child relationships
                return 1;
            
            case vscode.SymbolKind.Array:
                return 2;
            
            // Fallback to generic mapping
            default:
                return super.getLevelFromSymbol(symbol);
        }
    }
}
