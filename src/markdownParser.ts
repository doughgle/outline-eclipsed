/**
 * Standalone markdown parser that extracts document symbols.
 * 
 * PI-11: This module is designed to be testable independently of the VS Code API.
 * It takes plain markdown text lines as input and outputs parsed symbols with
 * positions relative to line numbers.
 * 
 * Supported symbol types:
 * - Headings (# H1, ## H2, etc.)
 * - Fenced code blocks (```language ... ```)
 * - Quote blocks (> lines)
 * - Images (![alt](url))
 */

/**
 * Enumeration of markdown symbol types supported by the parser.
 */
export enum MarkdownSymbolType {
    Heading = 'heading',
    CodeBlock = 'codeblock',
    QuoteBlock = 'quoteblock',
    Image = 'image',
}

/**
 * Represents a parsed markdown symbol.
 * Contains all information needed to create outline items.
 */
export interface MarkdownSymbol {
    /** The symbol type */
    type: MarkdownSymbolType;
    /** Display label for the symbol */
    label: string;
    /** Level in hierarchy (1-6 for headings, 7 for other symbols) */
    level: number;
    /** Start line number (0-indexed) */
    startLine: number;
    /** End line number (0-indexed, inclusive) */
    endLine: number;
    /** Start character position on startLine (0-indexed) */
    startChar: number;
    /** End character position on endLine */
    endChar: number;
    /** Optional detail text (e.g., language for code blocks) */
    detail?: string;
}

/**
 * Pure function to parse markdown text and extract symbols.
 * 
 * This function is designed to be independent of VS Code API,
 * making it easy to unit test without any VS Code dependencies.
 * 
 * @param lines - Array of lines from markdown text
 * @returns Array of parsed markdown symbols in document order
 */
export function parseMarkdownSymbols(lines: string[]): MarkdownSymbol[] {
    const symbols: MarkdownSymbol[] = [];
    let i = 0;

    while (i < lines.length) {
        const line = lines[i];
        const trimmedLine = line.trim();

        // Check for fenced code blocks (```language or ~~~language)
        const fenceMatch = line.match(/^(\s*)(```|~~~)(\w*)/);
        if (fenceMatch) {
            const fence = fenceMatch[2];
            const language = fenceMatch[3] || 'code';
            const startLine = i;
            const startChar = fenceMatch[1].length;
            
            // Find the closing fence
            let endLine = -1; // -1 means no closing fence found
            for (let j = i + 1; j < lines.length; j++) {
                if (lines[j].trim().startsWith(fence)) {
                    endLine = j;
                    break;
                }
            }
            
            // If no closing fence found, extend to end of document
            if (endLine === -1) {
                endLine = lines.length - 1;
            }
            
            // Only add if we have content (endLine > startLine)
            if (endLine > startLine) {
                symbols.push({
                    type: MarkdownSymbolType.CodeBlock,
                    label: `Code: ${language}`,
                    level: 7, // Below H6 in hierarchy
                    startLine,
                    endLine,
                    startChar,
                    endChar: lines[endLine].length,
                    detail: language,
                });
                i = endLine + 1;
                continue;
            }
        }

        // Check for headings (# H1, ## H2, etc.)
        const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
        if (headingMatch) {
            const level = headingMatch[1].length;
            const text = headingMatch[2].trim();
            
            symbols.push({
                type: MarkdownSymbolType.Heading,
                label: text,
                level,
                startLine: i,
                endLine: i,
                startChar: 0,
                endChar: line.length,
            });
            i++;
            continue;
        }

        // Check for images (![alt](url))
        // Can appear anywhere on a line, we look for standalone image syntax
        const imageMatch = line.match(/!\[([^\]]*)\]\(([^)]+)\)/);
        if (imageMatch) {
            const alt = imageMatch[1] || 'Image';
            const url = imageMatch[2];
            const shortUrl = url.split('/').pop() || url;
            
            symbols.push({
                type: MarkdownSymbolType.Image,
                label: `Image: ${alt || shortUrl}`,
                level: 7, // Below H6 in hierarchy
                startLine: i,
                endLine: i,
                startChar: line.indexOf(imageMatch[0]),
                endChar: line.indexOf(imageMatch[0]) + imageMatch[0].length,
                detail: shortUrl,
            });
            i++;
            continue;
        }

        // Check for quote blocks (> lines)
        if (trimmedLine.startsWith('>')) {
            const startLine = i;
            let endLine = i;
            
            // Find all consecutive quote lines
            while (endLine < lines.length && lines[endLine].trim().startsWith('>')) {
                endLine++;
            }
            endLine--; // Adjust to last quote line
            
            // Extract first line of quote for label
            const firstQuoteLine = lines[startLine].replace(/^>\s*/, '').trim();
            const label = firstQuoteLine.length > 40 
                ? firstQuoteLine.substring(0, 37) + '...'
                : firstQuoteLine;
            
            symbols.push({
                type: MarkdownSymbolType.QuoteBlock,
                label: `Quote: ${label || '...'}`,
                level: 7, // Below H6 in hierarchy
                startLine,
                endLine,
                startChar: 0,
                endChar: lines[endLine].length,
            });
            
            i = endLine + 1;
            continue;
        }

        i++;
    }

    return symbols;
}

/**
 * Splits markdown text into lines.
 * Utility function for converting document text to line array.
 * 
 * @param text - Full markdown text
 * @returns Array of lines
 */
export function splitIntoLines(text: string): string[] {
    return text.split(/\r?\n/);
}
