/**
 * Integration tests for enhanced MarkdownOutlineProvider with PI-11 symbols.
 * 
 * These tests verify that the provider correctly combines VS Code's heading symbols
 * with custom parser symbols (code blocks, quotes, images).
 * 
 * These tests require VS Code API and the markdown extension to be active.
 */
import * as assert from 'assert';
import * as vscode from 'vscode';
import { MarkdownOutlineProvider } from '../markdownOutlineProvider';
import { ensureMarkdownExtensionActivated } from './testUtils';

suite('PI-11: Enhanced MarkdownOutlineProvider - Additional Symbols', () => {
	
	suiteSetup(async () => {
		await ensureMarkdownExtensionActivated();
	});

	async function createMarkdownDocument(content: string): Promise<vscode.TextDocument> {
		return await vscode.workspace.openTextDocument({
			content: content,
			language: 'markdown'
		});
	}

	suite('Code Blocks', () => {
		test('Should include fenced code block in outline', async () => {
			const content = `# Introduction

Some text here.

\`\`\`javascript
const x = 1;
console.log(x);
\`\`\`

More text.`;
			
			const document = await createMarkdownDocument(content);
			const provider = new MarkdownOutlineProvider();
			await provider.refresh(document);
			
			const rootItems = provider.rootItems;
			
			// Should have 1 H1 heading at root
			assert.strictEqual(rootItems.length, 1, 'Should have 1 root heading');
			assert.strictEqual(rootItems[0].label, 'Introduction');
			
			// H1 should have the code block as a child
			const children = await provider.getChildren(rootItems[0]);
			const codeBlockChild = children.find(c => c.label.startsWith('Code:'));
			
			assert.ok(codeBlockChild, 'Should have code block as child of heading');
			assert.strictEqual(codeBlockChild.label, 'Code: javascript');
		});

		test('Should include code block with bash language', async () => {
			const content = `## Installation

\`\`\`bash
npm install
npm run build
\`\`\``;
			
			const document = await createMarkdownDocument(content);
			const provider = new MarkdownOutlineProvider();
			await provider.refresh(document);
			
			const rootItems = provider.rootItems;
			assert.strictEqual(rootItems.length, 1);
			
			const children = await provider.getChildren(rootItems[0]);
			const codeBlockChild = children.find(c => c.label.startsWith('Code:'));
			
			assert.ok(codeBlockChild, 'Should have bash code block');
			assert.strictEqual(codeBlockChild.label, 'Code: bash');
		});

		test('Should not confuse # in code block with heading', async () => {
			const content = `# Real Heading

\`\`\`bash
# This is a bash comment, not a heading
echo "hello"
\`\`\``;
			
			const document = await createMarkdownDocument(content);
			const provider = new MarkdownOutlineProvider();
			await provider.refresh(document);
			
			const rootItems = provider.rootItems;
			
			// Should only have 1 root heading, not 2
			assert.strictEqual(rootItems.length, 1, 'Should have only 1 root heading');
			assert.strictEqual(rootItems[0].label, 'Real Heading');
			
			// Should have code block as child
			const children = await provider.getChildren(rootItems[0]);
			assert.ok(children.some(c => c.label.startsWith('Code:')), 'Should have code block');
		});

		test('Should include multiple code blocks', async () => {
			const content = `## Examples

\`\`\`javascript
// JS example
\`\`\`

\`\`\`python
# Python example
\`\`\``;
			
			const document = await createMarkdownDocument(content);
			const provider = new MarkdownOutlineProvider();
			await provider.refresh(document);
			
			const rootItems = provider.rootItems;
			const children = await provider.getChildren(rootItems[0]);
			
			const codeBlocks = children.filter(c => c.label.startsWith('Code:'));
			assert.strictEqual(codeBlocks.length, 2, 'Should have 2 code blocks');
			assert.strictEqual(codeBlocks[0].label, 'Code: javascript');
			assert.strictEqual(codeBlocks[1].label, 'Code: python');
		});
	});

	suite('Quote Blocks', () => {
		test('Should include quote block in outline', async () => {
			const content = `# Notes

> This is an important note.

Some regular text.`;
			
			const document = await createMarkdownDocument(content);
			const provider = new MarkdownOutlineProvider();
			await provider.refresh(document);
			
			const rootItems = provider.rootItems;
			assert.strictEqual(rootItems.length, 1);
			
			const children = await provider.getChildren(rootItems[0]);
			const quoteChild = children.find(c => c.label.startsWith('Quote:'));
			
			assert.ok(quoteChild, 'Should have quote block as child');
			assert.ok(quoteChild.label.includes('important note'), 'Quote label should include text');
		});

		test('Should include multi-line quote as single block', async () => {
			const content = `## Summary

> First line of quote
> Second line of quote
> Third line of quote

End of section.`;
			
			const document = await createMarkdownDocument(content);
			const provider = new MarkdownOutlineProvider();
			await provider.refresh(document);
			
			const rootItems = provider.rootItems;
			const children = await provider.getChildren(rootItems[0]);
			
			const quoteBlocks = children.filter(c => c.label.startsWith('Quote:'));
			assert.strictEqual(quoteBlocks.length, 1, 'Should have 1 quote block');
		});

		test('Should truncate long quote labels', async () => {
			const content = `# Section

> This is a very long quote that should be truncated because it exceeds the maximum label length for display purposes`;
			
			const document = await createMarkdownDocument(content);
			const provider = new MarkdownOutlineProvider();
			await provider.refresh(document);
			
			const rootItems = provider.rootItems;
			const children = await provider.getChildren(rootItems[0]);
			const quoteChild = children.find(c => c.label.startsWith('Quote:'));
			
			assert.ok(quoteChild, 'Should have quote block');
			assert.ok(quoteChild.label.length <= 50, 'Quote label should be truncated');
			assert.ok(quoteChild.label.endsWith('...'), 'Truncated label should end with ...');
		});
	});

	suite('Images', () => {
		test('Should include image in outline', async () => {
			const content = `# Gallery

![Screenshot](screenshot.png)

Some description.`;
			
			const document = await createMarkdownDocument(content);
			const provider = new MarkdownOutlineProvider();
			await provider.refresh(document);
			
			const rootItems = provider.rootItems;
			assert.strictEqual(rootItems.length, 1);
			
			const children = await provider.getChildren(rootItems[0]);
			const imageChild = children.find(c => c.label.startsWith('Image:'));
			
			assert.ok(imageChild, 'Should have image as child');
			assert.strictEqual(imageChild.label, 'Image: Screenshot');
		});

		test('Should include image with path', async () => {
			const content = `## Assets

![Logo](/images/logo.png)`;
			
			const document = await createMarkdownDocument(content);
			const provider = new MarkdownOutlineProvider();
			await provider.refresh(document);
			
			const rootItems = provider.rootItems;
			const children = await provider.getChildren(rootItems[0]);
			const imageChild = children.find(c => c.label.startsWith('Image:'));
			
			assert.ok(imageChild, 'Should have image');
			assert.strictEqual(imageChild.label, 'Image: Logo');
		});

		test('Should handle image without alt text', async () => {
			const content = `# Section

![](diagram.svg)`;
			
			const document = await createMarkdownDocument(content);
			const provider = new MarkdownOutlineProvider();
			await provider.refresh(document);
			
			const rootItems = provider.rootItems;
			const children = await provider.getChildren(rootItems[0]);
			const imageChild = children.find(c => c.label.startsWith('Image:'));
			
			assert.ok(imageChild, 'Should have image');
			// Should use filename when alt is empty
			assert.ok(imageChild.label.includes('diagram.svg'), 'Should use filename as label');
		});
	});

	suite('Mixed Content', () => {
		test('Should correctly nest all symbol types under headings', async () => {
			const content = `# Main Section

Some intro text.

![diagram](diagram.png)

## Code Examples

\`\`\`javascript
const x = 1;
\`\`\`

> Important: Remember this!

## Conclusion

Final thoughts.`;
			
			const document = await createMarkdownDocument(content);
			const provider = new MarkdownOutlineProvider();
			await provider.refresh(document);
			
			const rootItems = provider.rootItems;
			
			// Should have 1 H1 at root
			assert.strictEqual(rootItems.length, 1);
			assert.strictEqual(rootItems[0].label, 'Main Section');
			
			// H1 should have children: image, then H2 "Code Examples", H2 "Conclusion"
			const h1Children = await provider.getChildren(rootItems[0]);
			
			// Find the image (should be direct child of H1)
			const image = h1Children.find(c => c.label.startsWith('Image:'));
			assert.ok(image, 'Should have image as H1 child');
			
			// Find H2 sections
			const codeExamples = h1Children.find(c => c.label === 'Code Examples');
			const conclusion = h1Children.find(c => c.label === 'Conclusion');
			
			assert.ok(codeExamples, 'Should have Code Examples heading');
			assert.ok(conclusion, 'Should have Conclusion heading');
			
			// Code Examples should have code block and quote as children
			const codeExamplesChildren = await provider.getChildren(codeExamples);
			assert.ok(codeExamplesChildren.some(c => c.label.startsWith('Code:')), 'Code Examples should have code block');
			assert.ok(codeExamplesChildren.some(c => c.label.startsWith('Quote:')), 'Code Examples should have quote');
		});

		test('Should handle document with symbols but no headings', async () => {
			const content = `\`\`\`javascript
const x = 1;
\`\`\`

> A quote

![image](image.png)`;
			
			const document = await createMarkdownDocument(content);
			const provider = new MarkdownOutlineProvider();
			await provider.refresh(document);
			
			const rootItems = provider.rootItems;
			
			// All symbols should be at root level since there are no headings
			assert.strictEqual(rootItems.length, 3, 'Should have 3 root items');
			assert.ok(rootItems.some(i => i.label.startsWith('Code:')), 'Should have code block');
			assert.ok(rootItems.some(i => i.label.startsWith('Quote:')), 'Should have quote');
			assert.ok(rootItems.some(i => i.label.startsWith('Image:')), 'Should have image');
		});

		test('Should preserve existing heading hierarchy with additional symbols', async () => {
			const content = `# Level 1

\`\`\`js
// Code at L1
\`\`\`

## Level 2

> Quote at L2

### Level 3

![Image at L3](image.png)`;
			
			const document = await createMarkdownDocument(content);
			const provider = new MarkdownOutlineProvider();
			await provider.refresh(document);
			
			const rootItems = provider.rootItems;
			assert.strictEqual(rootItems.length, 1, 'Should have 1 root');
			
			const l1 = rootItems[0];
			assert.strictEqual(l1.label, 'Level 1');
			
			const l1Children = await provider.getChildren(l1);
			// L1 should have: code block, L2 heading
			assert.ok(l1Children.some(c => c.label.startsWith('Code:')), 'L1 should have code block child');
			
			const l2 = l1Children.find(c => c.label === 'Level 2');
			assert.ok(l2, 'L1 should have L2 heading child');
			
			const l2Children = await provider.getChildren(l2);
			// L2 should have: quote, L3 heading
			assert.ok(l2Children.some(c => c.label.startsWith('Quote:')), 'L2 should have quote child');
			
			const l3 = l2Children.find(c => c.label === 'Level 3');
			assert.ok(l3, 'L2 should have L3 heading child');
			
			const l3Children = await provider.getChildren(l3);
			// L3 should have: image
			assert.ok(l3Children.some(c => c.label.startsWith('Image:')), 'L3 should have image child');
		});
	});

	suite('Selection Sync with New Symbols', () => {
		test('Should find item at code block line', async () => {
			const content = `# Heading

\`\`\`javascript
const x = 1;
\`\`\``;
			
			const document = await createMarkdownDocument(content);
			const provider = new MarkdownOutlineProvider();
			await provider.refresh(document);
			
			// Line 2 is inside the code block
			const item = provider.findItemAtLine(3);
			assert.ok(item, 'Should find item at code block line');
			assert.ok(item.label.startsWith('Code:'), 'Found item should be code block');
		});

		test('Should find item at quote block line', async () => {
			const content = `# Heading

> First line of quote
> Second line of quote`;
			
			const document = await createMarkdownDocument(content);
			const provider = new MarkdownOutlineProvider();
			await provider.refresh(document);
			
			// Line 3 is inside the quote block
			const item = provider.findItemAtLine(3);
			assert.ok(item, 'Should find item at quote line');
			assert.ok(item.label.startsWith('Quote:'), 'Found item should be quote');
		});

		test('Should find item at image line', async () => {
			const content = `# Heading

![Screenshot](screenshot.png)`;
			
			const document = await createMarkdownDocument(content);
			const provider = new MarkdownOutlineProvider();
			await provider.refresh(document);
			
			// Line 2 is the image line
			const item = provider.findItemAtLine(2);
			assert.ok(item, 'Should find item at image line');
			assert.ok(item.label.startsWith('Image:'), 'Found item should be image');
		});
	});
});
