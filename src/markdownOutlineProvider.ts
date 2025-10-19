import * as vscode from 'vscode';
import { OutlineProvider } from './outlineProvider';
import { OutlineItem } from './outlineItem';

/**
 * Markdown-specific outline provider.
 * Parses markdown headings to build outline tree.
 * 
 * PI-1: Parses headings into flat list (no hierarchy)
 * PI-2: Will build hierarchical tree based on heading levels
 */
export class MarkdownOutlineProvider extends OutlineProvider {
    
    /**
     * Parses markdown document to extract outline structure.
     * 
     * PI-1: Parses headings into flat list
     * PI-2: Will build nested hierarchy
     * 
     * @param document - Markdown document to parse
     * @returns Array of outline items (flat list in PI-1)
     */
    protected parseDocument(document: vscode.TextDocument): OutlineItem[] {
        const items: OutlineItem[] = [];
        
        // Iterate through all lines in the document
        for (let i = 0; i < document.lineCount; i++) {
            const line = document.lineAt(i);
            const level = this.getHeadingLevel(line.text);
            
            if (level > 0) {
                // Found a heading - extract text and create outline item
                const text = this.getHeadingText(line.text);
                const endLine = this.findSectionEnd(document, i, level);
                
                const item = new OutlineItem(
                    text,
                    level,
                    i,
                    endLine,
                    [], // No children in PI-1 (flat list)
                    vscode.SymbolKind.String // Will use better symbol kinds in PI-2
                );
                
                items.push(item);
            }
        }
        
        console.log(`PI-1: Parsed ${items.length} headings from ${document.fileName}`);
        return items;
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
