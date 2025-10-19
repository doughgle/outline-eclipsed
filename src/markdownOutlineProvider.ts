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
     * PI-2: Builds nested hierarchy where H2 is child of H1, H3 is child of H2, etc.
     * Handles edge cases like skipped levels and documents without root H1.
     * 
     * @param document - Markdown document to parse
     * @returns Array of root-level outline items with nested children
     */
    protected parseDocument(document: vscode.TextDocument): OutlineItem[] {
        // First, extract all headings as flat list
        const flatHeadings: OutlineItem[] = [];
        
        for (let i = 0; i < document.lineCount; i++) {
            const line = document.lineAt(i);
            const level = this.getHeadingLevel(line.text);
            
            if (level > 0) {
                const text = this.getHeadingText(line.text);
                const endLine = this.findSectionEnd(document, i, level);
                
                const item = new OutlineItem(
                    text,
                    level,
                    i,
                    endLine,
                    [], // Children will be populated in hierarchy building
                    this.getSymbolKindForLevel(level)
                );
                
                flatHeadings.push(item);
            }
        }
        
        // Build hierarchical structure from flat list
        const rootItems = this.buildHierarchy(flatHeadings);
        
        console.log(`PI-2: Parsed ${flatHeadings.length} headings (${rootItems.length} root) from ${document.fileName}`);
        return rootItems;
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
        const stack: OutlineItem[] = []; // Stack of potential parent headings
        
        for (const heading of flatHeadings) {
            // Pop stack until we find a heading with lower level (potential parent)
            while (stack.length > 0 && stack[stack.length - 1].level >= heading.level) {
                stack.pop();
            }
            
            if (stack.length === 0) {
                // No parent found - this is a root item
                heading.parent = undefined;
                rootItems.push(heading);
            } else {
                // Add to parent's children
                const parent = stack[stack.length - 1];
                heading.parent = parent;
                parent.children.push(heading);
            }
            
            // Add current heading to stack as potential parent for subsequent headings
            stack.push(heading);
        }
        
        return rootItems;
    }

    /**
     * Maps heading level to appropriate VS Code symbol kind.
     * 
     * @param level - Heading level (1-6)
     * @returns Appropriate symbol kind for tree display
     */
    private getSymbolKindForLevel(level: number): vscode.SymbolKind {
        switch (level) {
            case 1: return vscode.SymbolKind.Module;
            case 2: return vscode.SymbolKind.Class;
            case 3: return vscode.SymbolKind.Method;
            case 4: return vscode.SymbolKind.Function;
            case 5: return vscode.SymbolKind.Property;
            case 6: return vscode.SymbolKind.Variable;
            default: return vscode.SymbolKind.String;
        }
    }

    /**
     * Parses a single line to detect if it's a markdown heading.
     * Matches lines starting with 1-6 # symbols followed by space and text.
     * 
     * @param line - Text line to parse
     * @returns Heading level (1-6) or 0 if not a heading
     */
    private getHeadingLevel(line: string): number {
        const match = /^(#{1,6})\s+(.+)$/.exec(line);
        return match ? match[1].length : 0;
    }

    /**
     * Extracts heading text without the # prefix.
     * Trims whitespace from the result.
     * 
     * @param line - Heading line text
     * @returns Clean heading text
     */
    private getHeadingText(line: string): string {
        const match = /^#{1,6}\s+(.+)$/.exec(line);
        return match ? match[1].trim() : '';
    }

    /**
     * Finds the end line of a section.
     * A section ends when we encounter another heading of same or higher level,
     * or at the end of the document.
     * 
     * @param document - Document to search
     * @param startLine - Line where section starts
     * @param startLevel - Heading level of the section
     * @returns Line number where section ends (inclusive)
     */
    private findSectionEnd(document: vscode.TextDocument, startLine: number, startLevel: number): number {
        // Search forward for next heading at same or higher level
        for (let i = startLine + 1; i < document.lineCount; i++) {
            const level = this.getHeadingLevel(document.lineAt(i).text);
            
            if (level > 0 && level <= startLevel) {
                // Found next heading at same or higher level
                // Section ends at line before this heading
                return i - 1;
            }
        }
        
        // No next heading found - section goes to end of document
        return document.lineCount - 1;
    }
}
