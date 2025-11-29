/**
 * Unit tests for the standalone markdown parser.
 * 
 * PI-11: These tests are independent of VS Code API.
 * They test the pure parsing functions directly.
 */
import * as assert from 'assert';
import { 
    parseMarkdownSymbols, 
    splitIntoLines, 
    MarkdownSymbolType, 
    MarkdownSymbol 
} from '../markdownParser';

suite('MarkdownParser - Unit Tests (VS Code Independent)', () => {

    suite('splitIntoLines', () => {
        test('should split text by newlines', () => {
            const text = 'line1\nline2\nline3';
            const lines = splitIntoLines(text);
            assert.deepStrictEqual(lines, ['line1', 'line2', 'line3']);
        });

        test('should handle Windows-style line endings', () => {
            const text = 'line1\r\nline2\r\nline3';
            const lines = splitIntoLines(text);
            assert.deepStrictEqual(lines, ['line1', 'line2', 'line3']);
        });

        test('should handle empty text', () => {
            const lines = splitIntoLines('');
            assert.deepStrictEqual(lines, ['']);
        });

        test('should handle single line without newline', () => {
            const lines = splitIntoLines('single line');
            assert.deepStrictEqual(lines, ['single line']);
        });
    });

    suite('parseMarkdownSymbols - Headings', () => {
        test('should parse H1 heading', () => {
            const lines = ['# Main Title'];
            const symbols = parseMarkdownSymbols(lines);
            
            assert.strictEqual(symbols.length, 1);
            assert.strictEqual(symbols[0].type, MarkdownSymbolType.Heading);
            assert.strictEqual(symbols[0].label, 'Main Title');
            assert.strictEqual(symbols[0].level, 1);
            assert.strictEqual(symbols[0].startLine, 0);
            assert.strictEqual(symbols[0].endLine, 0);
        });

        test('should parse H2-H6 headings with correct levels', () => {
            const lines = [
                '## Level 2',
                '### Level 3',
                '#### Level 4',
                '##### Level 5',
                '###### Level 6'
            ];
            const symbols = parseMarkdownSymbols(lines);
            
            assert.strictEqual(symbols.length, 5);
            assert.strictEqual(symbols[0].level, 2);
            assert.strictEqual(symbols[1].level, 3);
            assert.strictEqual(symbols[2].level, 4);
            assert.strictEqual(symbols[3].level, 5);
            assert.strictEqual(symbols[4].level, 6);
        });

        test('should parse multiple headings', () => {
            const lines = [
                '# First',
                '',
                '## Second',
                '',
                '# Third'
            ];
            const symbols = parseMarkdownSymbols(lines);
            
            assert.strictEqual(symbols.length, 3);
            assert.strictEqual(symbols[0].label, 'First');
            assert.strictEqual(symbols[1].label, 'Second');
            assert.strictEqual(symbols[2].label, 'Third');
        });

        test('should not parse # without space as heading', () => {
            const lines = ['#NoSpace'];
            const symbols = parseMarkdownSymbols(lines);
            
            assert.strictEqual(symbols.length, 0);
        });

        test('should trim whitespace from heading text', () => {
            const lines = ['#   Heading with spaces   '];
            const symbols = parseMarkdownSymbols(lines);
            
            assert.strictEqual(symbols.length, 1);
            assert.strictEqual(symbols[0].label, 'Heading with spaces');
        });
    });

    suite('parseMarkdownSymbols - Fenced Code Blocks', () => {
        test('should parse simple fenced code block', () => {
            const lines = [
                '```',
                'const x = 1;',
                '```'
            ];
            const symbols = parseMarkdownSymbols(lines);
            
            assert.strictEqual(symbols.length, 1);
            assert.strictEqual(symbols[0].type, MarkdownSymbolType.CodeBlock);
            assert.strictEqual(symbols[0].label, 'Code: code');
            assert.strictEqual(symbols[0].level, 7);
            assert.strictEqual(symbols[0].startLine, 0);
            assert.strictEqual(symbols[0].endLine, 2);
        });

        test('should parse code block with language', () => {
            const lines = [
                '```javascript',
                'const x = 1;',
                '```'
            ];
            const symbols = parseMarkdownSymbols(lines);
            
            assert.strictEqual(symbols.length, 1);
            assert.strictEqual(symbols[0].label, 'Code: javascript');
            assert.strictEqual(symbols[0].detail, 'javascript');
        });

        test('should parse code block with different languages', () => {
            const lines = [
                '```python',
                'x = 1',
                '```',
                '',
                '```typescript',
                'const x: number = 1;',
                '```'
            ];
            const symbols = parseMarkdownSymbols(lines);
            
            assert.strictEqual(symbols.length, 2);
            assert.strictEqual(symbols[0].label, 'Code: python');
            assert.strictEqual(symbols[1].label, 'Code: typescript');
        });

        test('should parse code block with tilde fence', () => {
            const lines = [
                '~~~bash',
                'echo "hello"',
                '~~~'
            ];
            const symbols = parseMarkdownSymbols(lines);
            
            assert.strictEqual(symbols.length, 1);
            assert.strictEqual(symbols[0].label, 'Code: bash');
        });

        test('should parse multiline code block', () => {
            const lines = [
                '```js',
                'function foo() {',
                '  return 1;',
                '}',
                '```'
            ];
            const symbols = parseMarkdownSymbols(lines);
            
            assert.strictEqual(symbols.length, 1);
            assert.strictEqual(symbols[0].startLine, 0);
            assert.strictEqual(symbols[0].endLine, 4);
        });

        test('should not confuse # in code block with heading', () => {
            const lines = [
                '```bash',
                '# This is a comment in bash',
                'echo "hello"',
                '```'
            ];
            const symbols = parseMarkdownSymbols(lines);
            
            // Should only have the code block, not a heading
            assert.strictEqual(symbols.length, 1);
            assert.strictEqual(symbols[0].type, MarkdownSymbolType.CodeBlock);
        });
    });

    suite('parseMarkdownSymbols - Quote Blocks', () => {
        test('should parse single-line quote', () => {
            const lines = ['> This is a quote'];
            const symbols = parseMarkdownSymbols(lines);
            
            assert.strictEqual(symbols.length, 1);
            assert.strictEqual(symbols[0].type, MarkdownSymbolType.QuoteBlock);
            assert.strictEqual(symbols[0].label, 'Quote: This is a quote');
            assert.strictEqual(symbols[0].level, 7);
            assert.strictEqual(symbols[0].startLine, 0);
            assert.strictEqual(symbols[0].endLine, 0);
        });

        test('should parse multi-line quote as single block', () => {
            const lines = [
                '> First line of quote',
                '> Second line of quote',
                '> Third line of quote'
            ];
            const symbols = parseMarkdownSymbols(lines);
            
            assert.strictEqual(symbols.length, 1);
            assert.strictEqual(symbols[0].startLine, 0);
            assert.strictEqual(symbols[0].endLine, 2);
        });

        test('should truncate long quote labels', () => {
            const lines = ['> This is a very long quote that should be truncated because it exceeds forty characters'];
            const symbols = parseMarkdownSymbols(lines);
            
            assert.strictEqual(symbols.length, 1);
            assert.ok(symbols[0].label.endsWith('...'));
            assert.ok(symbols[0].label.length <= 50);
        });

        test('should parse multiple separate quote blocks', () => {
            const lines = [
                '> First quote',
                '',
                '> Second quote'
            ];
            const symbols = parseMarkdownSymbols(lines);
            
            assert.strictEqual(symbols.length, 2);
            assert.strictEqual(symbols[0].label, 'Quote: First quote');
            assert.strictEqual(symbols[1].label, 'Quote: Second quote');
        });

        test('should handle quote with nested > symbols', () => {
            const lines = [
                '> Quote level 1',
                '>> Quote level 2'
            ];
            const symbols = parseMarkdownSymbols(lines);
            
            // Both lines should be treated as part of the same quote block
            assert.strictEqual(symbols.length, 1);
            assert.strictEqual(symbols[0].startLine, 0);
            assert.strictEqual(symbols[0].endLine, 1);
        });
    });

    suite('parseMarkdownSymbols - Images', () => {
        test('should parse inline image', () => {
            const lines = ['![Alt text](image.png)'];
            const symbols = parseMarkdownSymbols(lines);
            
            assert.strictEqual(symbols.length, 1);
            assert.strictEqual(symbols[0].type, MarkdownSymbolType.Image);
            assert.strictEqual(symbols[0].label, 'Image: Alt text');
            assert.strictEqual(symbols[0].level, 7);
            assert.strictEqual(symbols[0].detail, 'image.png');
        });

        test('should parse image with URL path', () => {
            const lines = ['![Logo](/assets/images/logo.png)'];
            const symbols = parseMarkdownSymbols(lines);
            
            assert.strictEqual(symbols.length, 1);
            assert.strictEqual(symbols[0].label, 'Image: Logo');
            assert.strictEqual(symbols[0].detail, 'logo.png');
        });

        test('should parse image with empty alt text', () => {
            const lines = ['![](screenshot.jpg)'];
            const symbols = parseMarkdownSymbols(lines);
            
            assert.strictEqual(symbols.length, 1);
            assert.strictEqual(symbols[0].label, 'Image: screenshot.jpg');
        });

        test('should parse multiple images', () => {
            const lines = [
                '![First](first.png)',
                '![Second](second.png)'
            ];
            const symbols = parseMarkdownSymbols(lines);
            
            assert.strictEqual(symbols.length, 2);
        });

        test('should parse image within text line', () => {
            const lines = ['Here is an image: ![icon](icon.svg) inline'];
            const symbols = parseMarkdownSymbols(lines);
            
            assert.strictEqual(symbols.length, 1);
            assert.strictEqual(symbols[0].label, 'Image: icon');
        });
    });

    suite('parseMarkdownSymbols - Mixed Content', () => {
        test('should parse headings, code blocks, quotes, and images together', () => {
            const lines = [
                '# Introduction',
                '',
                'Some text here.',
                '',
                '![diagram](diagram.png)',
                '',
                '## Code Example',
                '',
                '```javascript',
                'console.log("hello");',
                '```',
                '',
                '> Important note',
                '',
                '## Conclusion'
            ];
            const symbols = parseMarkdownSymbols(lines);
            
            // Should have: 2 headings, 1 image, 1 code block, 1 quote = 5 total
            assert.strictEqual(symbols.length, 5);
            
            // Verify order and types
            assert.strictEqual(symbols[0].type, MarkdownSymbolType.Heading);
            assert.strictEqual(symbols[0].label, 'Introduction');
            
            assert.strictEqual(symbols[1].type, MarkdownSymbolType.Image);
            
            assert.strictEqual(symbols[2].type, MarkdownSymbolType.Heading);
            assert.strictEqual(symbols[2].label, 'Code Example');
            
            assert.strictEqual(symbols[3].type, MarkdownSymbolType.CodeBlock);
            
            assert.strictEqual(symbols[4].type, MarkdownSymbolType.QuoteBlock);
        });

        test('should preserve document order', () => {
            const lines = [
                '> Quote first',
                '# Heading',
                '```',
                'code',
                '```'
            ];
            const symbols = parseMarkdownSymbols(lines);
            
            assert.strictEqual(symbols.length, 3);
            assert.strictEqual(symbols[0].type, MarkdownSymbolType.QuoteBlock);
            assert.strictEqual(symbols[1].type, MarkdownSymbolType.Heading);
            assert.strictEqual(symbols[2].type, MarkdownSymbolType.CodeBlock);
        });

        test('should handle empty document', () => {
            const lines = [''];
            const symbols = parseMarkdownSymbols(lines);
            
            assert.strictEqual(symbols.length, 0);
        });

        test('should handle document with only plain text', () => {
            const lines = [
                'This is just plain text.',
                'No special markdown here.',
                'Nothing to parse.'
            ];
            const symbols = parseMarkdownSymbols(lines);
            
            assert.strictEqual(symbols.length, 0);
        });
    });

    suite('parseMarkdownSymbols - Edge Cases', () => {
        test('should handle code block at end of document without closing fence', () => {
            const lines = [
                '```python',
                'print("unclosed")'
            ];
            const symbols = parseMarkdownSymbols(lines);
            
            // Should still create a symbol, extending to end of document
            assert.strictEqual(symbols.length, 1);
            assert.strictEqual(symbols[0].type, MarkdownSymbolType.CodeBlock);
            assert.strictEqual(symbols[0].endLine, 1);
        });

        test('should handle heading immediately after code block', () => {
            const lines = [
                '```',
                'code',
                '```',
                '# Heading After Code'
            ];
            const symbols = parseMarkdownSymbols(lines);
            
            assert.strictEqual(symbols.length, 2);
            assert.strictEqual(symbols[0].type, MarkdownSymbolType.CodeBlock);
            assert.strictEqual(symbols[1].type, MarkdownSymbolType.Heading);
            assert.strictEqual(symbols[1].label, 'Heading After Code');
        });

        test('should handle image on same line as text', () => {
            const lines = ['Check out ![logo](logo.png) our product'];
            const symbols = parseMarkdownSymbols(lines);
            
            assert.strictEqual(symbols.length, 1);
            assert.strictEqual(symbols[0].type, MarkdownSymbolType.Image);
        });

        test('should correctly identify line positions', () => {
            const lines = [
                '',           // line 0
                '# Heading',  // line 1
                '',           // line 2
                '> Quote',    // line 3
                '',           // line 4
            ];
            const symbols = parseMarkdownSymbols(lines);
            
            assert.strictEqual(symbols.length, 2);
            assert.strictEqual(symbols[0].startLine, 1);
            assert.strictEqual(symbols[1].startLine, 3);
        });
    });
});
