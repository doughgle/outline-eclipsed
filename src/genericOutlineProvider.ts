import * as vscode from 'vscode';
import { OutlineProvider } from './outlineProvider';
import { OutlineItem } from './outlineItem';

/**
 * Generic outline provider that works with any language's symbol provider.
 * Uses VS Code's built-in document symbol provider via executeDocumentSymbolProvider.
 * 
 * This provider works with any language that has a symbol provider registered,
 * including TypeScript, JavaScript, Python, C++, Java, etc.
 */
export class GenericOutlineProvider extends OutlineProvider {
    
    /**
     * Parses document using VS Code's built-in symbol provider.
     * Works with any language that provides document symbols.
     * 
     * @param document - Document to parse
     * @returns Array of root-level outline items with nested children
     */
    protected async parseDocument(document: vscode.TextDocument): Promise<OutlineItem[]> {
        try {
            // Use built-in symbol parser via executeDocumentSymbolProvider
            const symbols = await vscode.commands.executeCommand<(vscode.SymbolInformation | vscode.DocumentSymbol)[]>(
                'vscode.executeDocumentSymbolProvider',
                document.uri
            );

            if (!symbols || symbols.length === 0) {
                return [];
            }

            // Check if we got DocumentSymbols (hierarchical) or SymbolInformation (flat)
            if (symbols.length > 0 && this.isDocumentSymbol(symbols[0])) {
                // DocumentSymbol already has hierarchy - preserve it
                const rootItems = this.convertDocumentSymbolsToOutlineItems(symbols as vscode.DocumentSymbol[], document);
                console.log(`Parsed ${this.countTotalItems(rootItems)} symbols (${rootItems.length} root) from ${document.fileName}`);
                return rootItems;
            } else {
                // SymbolInformation is flat - need to build hierarchy
                const flatItems = this.convertSymbolsToOutlineItems(symbols, document);
                const rootItems = this.buildHierarchy(flatItems);
                console.log(`Parsed ${flatItems.length} symbols (${rootItems.length} root) from ${document.fileName}`);
                return rootItems;
            }
        } catch (error) {
            console.error('Failed to execute document symbol provider:', error);
            return [];
        }
    }

    /**
     * Converts DocumentSymbols to OutlineItems, preserving native hierarchy.
     * This is the preferred path for languages that provide DocumentSymbol.
     * 
     * @param symbols - Array of DocumentSymbols with native hierarchy
     * @param document - The document containing these symbols
     * @returns Array of root OutlineItems with nested children in document order
     */
    protected convertDocumentSymbolsToOutlineItems(symbols: vscode.DocumentSymbol[], document: vscode.TextDocument): OutlineItem[] {
        const convertSymbol = (symbol: vscode.DocumentSymbol): OutlineItem => {
            const name = this.sanitizeSymbolName(symbol.name);
            const level = this.getLevelFromSymbol(symbol);
            
            // Recursively convert children, sorting them by document position
            const children = symbol.children 
                ? symbol.children
                    .slice() // Create a copy to avoid mutating the original
                    .sort((a, b) => a.range.start.line - b.range.start.line)
                    .map(child => convertSymbol(child))
                : [];
            
            const item = new OutlineItem(
                name,
                level,
                symbol.range,
                symbol.selectionRange,
                children,
                symbol.kind,
                document,
                symbol.detail  // Pass the detail from language server
            );
            
            // Set parent references for children
            for (const child of children) {
                child.parent = item;
            }
            
            return item;
        };
        
        // Sort root symbols by document position before converting
        const sortedSymbols = symbols.slice().sort((a, b) => a.range.start.line - b.range.start.line);
        return sortedSymbols.map(symbol => convertSymbol(symbol));
    }

    /**
     * Counts total items in tree (for logging).
     */
    protected countTotalItems(items: OutlineItem[]): number {
        let count = items.length;
        for (const item of items) {
            count += this.countTotalItems(item.children);
        }
        return count;
    }

    /**
     * Converts VS Code symbols (SymbolInformation or DocumentSymbol) to OutlineItems.
     * Flattens hierarchical DocumentSymbol structure into flat list.
     * 
     * @param symbols - Array of symbols from built-in parser
     * @param document - Source document
     * @returns Flat array of outline items in document order
     */
    protected convertSymbolsToOutlineItems(
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
            
            // Allow subclasses to sanitize symbol names (e.g., remove markdown # prefix)
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

            // Extract level from symbol (language-specific)
            const level = this.getLevelFromSymbol(symbol);
            const item = new OutlineItem(
                name,
                level,
                range,
                selectionRange,
                [], // Children will be populated in buildHierarchy
                kind,
                document
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
    protected isDocumentSymbol(symbol: vscode.SymbolInformation | vscode.DocumentSymbol): symbol is vscode.DocumentSymbol {
        return 'range' in symbol;
    }

    /**
     * Sanitizes symbol name. Override in subclasses for language-specific processing.
     * Default implementation just trims whitespace.
     * 
     * @param text - Symbol name
     * @returns Sanitized symbol name
     */
    protected sanitizeSymbolName(text: string): string {
        return text.trim();
    }

    /**
     * Extracts hierarchical level from a symbol.
     * Maps SymbolKind to a numeric level for hierarchy building.
     * 
     * Default implementation maps common symbol kinds to levels:
     * - Module/Namespace: Level 1
     * - Class/Interface/Enum: Level 2
     * - Method/Function: Level 3
     * - Property/Field/Variable: Level 4
     * - Other: Level 1
     * 
     * Override in subclasses for language-specific level mapping.
     * 
     * @param symbol - Symbol to extract level from
     * @returns Numeric level (lower number = higher in hierarchy)
     */
    protected getLevelFromSymbol(symbol: vscode.SymbolInformation | vscode.DocumentSymbol): number {
        switch (symbol.kind) {
            // Top level: Modules, Namespaces
            case vscode.SymbolKind.Module:
            case vscode.SymbolKind.Namespace:
            case vscode.SymbolKind.Package:
                return 1;
            
            // Second level: Classes, Interfaces, Enums, Structs
            case vscode.SymbolKind.Class:
            case vscode.SymbolKind.Interface:
            case vscode.SymbolKind.Enum:
            case vscode.SymbolKind.Struct:
                return 2;
            
            // Third level: Methods, Functions, Constructors
            case vscode.SymbolKind.Method:
            case vscode.SymbolKind.Function:
            case vscode.SymbolKind.Constructor:
                return 3;
            
            // Fourth level: Properties, Fields, Variables
            case vscode.SymbolKind.Property:
            case vscode.SymbolKind.Field:
            case vscode.SymbolKind.Variable:
            case vscode.SymbolKind.Constant:
                return 4;
            
            // Fifth level: Enum members, type parameters
            case vscode.SymbolKind.EnumMember:
            case vscode.SymbolKind.TypeParameter:
                return 5;
            
            // Default: Top level
            default:
                return 1;
        }
    }

    /**
     * Builds hierarchical tree structure from flat list of items.
     * 
     * Algorithm:
     * - Maintain a stack of potential parent items
     * - For each item, find its parent by looking back for nearest higher-level item
     * - Add item to parent's children or to root list
     * 
     * @param flatItems - Flat array of all items in document order
     * @returns Array of root-level items with nested children
     */
    protected buildHierarchy(flatItems: OutlineItem[]): OutlineItem[] {
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
            
            stack.push(item);
        }
        
        return rootItems;
    }
}
