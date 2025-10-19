import * as vscode from 'vscode';
import { OutlineProvider } from './outlineProvider';
import { OutlineItem } from './outlineItem';

/**
 * Markdown-specific outline provider.
 * Parses markdown headings to build outline tree.
 * 
 * PI-0: Stub - returns empty tree
 * PI-1: Will parse markdown headings (flat structure)
 * PI-2: Will build hierarchical tree based on heading levels
 */
export class MarkdownOutlineProvider extends OutlineProvider {
    
    /**
     * Parses markdown document to extract outline structure.
     * 
     * PI-0: Returns empty array (stub implementation)
     * PI-1: Will parse headings into flat list
     * PI-2: Will build nested hierarchy
     */
    protected parseDocument(document: vscode.TextDocument): OutlineItem[] {
        // PI-0: Stub implementation - return empty tree
        // This will be implemented in PI-1
        console.log(`PI-0: Would parse markdown document ${document.fileName}`);
        return [];
    }

    /**
     * Parses a single line to detect if it's a markdown heading.
     * Future implementation for PI-1.
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
     * Future implementation for PI-1.
     * 
     * @param line - Heading line text
     * @returns Clean heading text
     */
    private getHeadingText(line: string): string {
        const match = /^#{1,6}\s+(.+)$/.exec(line);
        return match ? match[1].trim() : '';
    }
}
