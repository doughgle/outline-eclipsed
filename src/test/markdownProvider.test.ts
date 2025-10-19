import * as assert from 'assert';
import * as vscode from 'vscode';
import { MarkdownOutlineProvider } from '../markdownOutlineProvider';

suite('MarkdownOutlineProvider - Parsing Tests', () => {

	/**
	 * Helper function to create a test markdown document
	 */
	async function createMarkdownDocument(content: string, language: string = 'markdown'): Promise<vscode.TextDocument> {
		return await vscode.workspace.openTextDocument({
			content: content,
			language: language
		});
	}

	test('Should parse single H1 heading', async () => {
		const content = '# Heading 1\n\nSome content here.';
		const document = await createMarkdownDocument(content);
		
		const provider = new MarkdownOutlineProvider();
		provider.refresh(document);
		
		const items = await provider.getChildren();
		
		assert.strictEqual(items.length, 1, 'Should have exactly one heading');
		assert.strictEqual(items[0].label, 'Heading 1', 'Heading text should be correct');
		assert.strictEqual(items[0].level, 1, 'Heading level should be 1');
		assert.strictEqual(items[0].line, 0, 'Heading should be on line 0');
	});

	test('Should parse multiple headings at different levels', async () => {
		const content = `# H1 Heading
## H2 Heading
### H3 Heading`;
		
		const document = await createMarkdownDocument(content);
		const provider = new MarkdownOutlineProvider();
		provider.refresh(document);
		
		const items = await provider.getChildren();
		
		assert.strictEqual(items.length, 3, 'Should have three headings');
		
		assert.strictEqual(items[0].label, 'H1 Heading');
		assert.strictEqual(items[0].level, 1);
		assert.strictEqual(items[0].line, 0);
		
		assert.strictEqual(items[1].label, 'H2 Heading');
		assert.strictEqual(items[1].level, 2);
		assert.strictEqual(items[1].line, 1);
		
		assert.strictEqual(items[2].label, 'H3 Heading');
		assert.strictEqual(items[2].level, 3);
		assert.strictEqual(items[2].line, 2);
	});

	test('Should parse all heading levels (H1-H6)', async () => {
		const content = `# Level 1
## Level 2
### Level 3
#### Level 4
##### Level 5
###### Level 6`;
		
		const document = await createMarkdownDocument(content);
		const provider = new MarkdownOutlineProvider();
		provider.refresh(document);
		
		const items = await provider.getChildren();
		
		assert.strictEqual(items.length, 6, 'Should have six headings');
		
		for (let i = 0; i < 6; i++) {
			assert.strictEqual(items[i].level, i + 1, `Item ${i} should be level ${i + 1}`);
			assert.strictEqual(items[i].line, i, `Item ${i} should be on line ${i}`);
		}
	});

	test('Should ignore lines that are not headings', async () => {
		const content = `# Heading 1

Some regular text here.
Not a heading.

## Heading 2

More content.`;
		
		const document = await createMarkdownDocument(content);
		const provider = new MarkdownOutlineProvider();
		provider.refresh(document);
		
		const items = await provider.getChildren();
		
		assert.strictEqual(items.length, 2, 'Should only find heading lines');
		assert.strictEqual(items[0].label, 'Heading 1');
		assert.strictEqual(items[1].label, 'Heading 2');
	});

	test('Should handle headings with special characters', async () => {
		const content = `# Heading with **bold** text
## Heading with \`code\`
### Heading with [link](url)`;
		
		const document = await createMarkdownDocument(content);
		const provider = new MarkdownOutlineProvider();
		provider.refresh(document);
		
		const items = await provider.getChildren();
		
		assert.strictEqual(items.length, 3, 'Should parse all headings');
		assert.strictEqual(items[0].label, 'Heading with **bold** text');
		assert.strictEqual(items[1].label, 'Heading with `code`');
		assert.strictEqual(items[2].label, 'Heading with [link](url)');
	});

	test('Should handle empty document', async () => {
		const content = '';
		const document = await createMarkdownDocument(content);
		
		const provider = new MarkdownOutlineProvider();
		provider.refresh(document);
		
		const items = await provider.getChildren();
		
		assert.strictEqual(items.length, 0, 'Should return empty array for empty document');
	});

	test('Should handle document with no headings', async () => {
		const content = `Just some regular text.
No headings here.
More text.`;
		
		const document = await createMarkdownDocument(content);
		const provider = new MarkdownOutlineProvider();
		provider.refresh(document);
		
		const items = await provider.getChildren();
		
		assert.strictEqual(items.length, 0, 'Should return empty array when no headings');
	});

	test('Should ignore lines starting with # but not valid headings', async () => {
		const content = `# Valid Heading
#Not a heading (no space)
# Another Valid
 # Not a heading (leading space)`;
		
		const document = await createMarkdownDocument(content);
		const provider = new MarkdownOutlineProvider();
		provider.refresh(document);
		
		const items = await provider.getChildren();
		
		assert.strictEqual(items.length, 2, 'Should only find valid headings');
		assert.strictEqual(items[0].label, 'Valid Heading');
		assert.strictEqual(items[1].label, 'Another Valid');
	});

	test('Should trim whitespace from heading text', async () => {
		const content = `#    Heading with spaces   
##  Another  `;
		
		const document = await createMarkdownDocument(content);
		const provider = new MarkdownOutlineProvider();
		provider.refresh(document);
		
		const items = await provider.getChildren();
		
		assert.strictEqual(items.length, 2);
		assert.strictEqual(items[0].label, 'Heading with spaces', 'Should trim whitespace');
		assert.strictEqual(items[1].label, 'Another', 'Should trim whitespace');
	});

	test('Should calculate correct end line for sections', async () => {
		const content = `# Section 1
Line 1
Line 2
# Section 2
Line 3`;
		
		const document = await createMarkdownDocument(content);
		const provider = new MarkdownOutlineProvider();
		provider.refresh(document);
		
		const items = await provider.getChildren();
		
		assert.strictEqual(items.length, 2);
		assert.strictEqual(items[0].endLine, 2, 'Section 1 should end at line 2 (before Section 2)');
		assert.strictEqual(items[1].endLine, 4, 'Section 2 should end at last line');
	});
});

suite('MarkdownOutlineProvider - State Management', () => {

	test('Provider should clear items when refresh called with undefined', async () => {
		const provider = new MarkdownOutlineProvider();
		
		// First, parse a markdown document with headings
		const markdownDoc = await vscode.workspace.openTextDocument({
			content: '# Heading 1\n\n## Heading 2\n\nContent',
			language: 'markdown'
		});
		
		provider.refresh(markdownDoc);
		let items = await provider.getChildren();
		
		assert.strictEqual(items.length, 2, 'Should have 2 headings after parsing markdown');
		assert.strictEqual(items[0].label, 'Heading 1');
		assert.strictEqual(items[1].label, 'Heading 2');
		
		// Now refresh with undefined (simulating switch to non-markdown file)
		provider.refresh(undefined);
		items = await provider.getChildren();
		
		assert.strictEqual(items.length, 0, 'Should have 0 items after clearing with undefined');
	});

	test('Provider should handle multiple refresh cycles correctly', async () => {
		const provider = new MarkdownOutlineProvider();
		
		// Cycle 1: Parse markdown
		const doc1 = await vscode.workspace.openTextDocument({
			content: '# First\n\n## Second',
			language: 'markdown'
		});
		provider.refresh(doc1);
		let items = await provider.getChildren();
		assert.strictEqual(items.length, 2, 'Should have 2 items');
		
		// Cycle 2: Clear
		provider.refresh(undefined);
		items = await provider.getChildren();
		assert.strictEqual(items.length, 0, 'Should be cleared');
		
		// Cycle 3: Parse different markdown
		const doc2 = await vscode.workspace.openTextDocument({
			content: '### Only One Heading',
			language: 'markdown'
		});
		provider.refresh(doc2);
		items = await provider.getChildren();
		assert.strictEqual(items.length, 1, 'Should have 1 new item');
		assert.strictEqual(items[0].label, 'Only One Heading');
		
		// Cycle 4: Clear again
		provider.refresh(undefined);
		items = await provider.getChildren();
		assert.strictEqual(items.length, 0, 'Should be cleared again');
	});

	test('Provider should switch between different markdown documents', async () => {
		const provider = new MarkdownOutlineProvider();
		
		// Document 1
		const doc1 = await vscode.workspace.openTextDocument({
			content: '# Document 1 Heading',
			language: 'markdown'
		});
		
		provider.refresh(doc1);
		let items = await provider.getChildren();
		assert.strictEqual(items.length, 1);
		assert.strictEqual(items[0].label, 'Document 1 Heading');
		
		// Document 2
		const doc2 = await vscode.workspace.openTextDocument({
			content: '# Document 2 Heading\n\n## Subheading',
			language: 'markdown'
		});
		
		provider.refresh(doc2);
		items = await provider.getChildren();
		assert.strictEqual(items.length, 2);
		assert.strictEqual(items[0].label, 'Document 2 Heading');
		assert.strictEqual(items[1].label, 'Subheading');
		
		// Back to Document 1
		provider.refresh(doc1);
		items = await provider.getChildren();
		assert.strictEqual(items.length, 1);
		assert.strictEqual(items[0].label, 'Document 1 Heading');
	});
});

suite('MarkdownOutlineProvider - Document Schemes', () => {

	test('Provider should parse untitled markdown documents', async () => {
		const provider = new MarkdownOutlineProvider();
		
		// Create an untitled document with markdown content
		const untitledDoc = await vscode.workspace.openTextDocument({
			content: '# Untitled Heading 1\n\n## Untitled Heading 2\n\nSome content',
			language: 'markdown'
		});
		
		// Verify it's untitled (scheme should be 'untitled')
		assert.strictEqual(untitledDoc.uri.scheme, 'untitled', 'Document should have untitled scheme');
		assert.strictEqual(untitledDoc.languageId, 'markdown', 'Document should be markdown');
		
		provider.refresh(untitledDoc);
		const items = await provider.getChildren();
		
		assert.strictEqual(items.length, 2, 'Should parse headings from untitled markdown document');
		assert.strictEqual(items[0].label, 'Untitled Heading 1');
		assert.strictEqual(items[1].label, 'Untitled Heading 2');
	});

	test('Provider should not parse untitled non-markdown documents', async () => {
		const provider = new MarkdownOutlineProvider();
		
		// Create an untitled JavaScript document
		const untitledDoc = await vscode.workspace.openTextDocument({
			content: 'function test() { return 42; }',
			language: 'javascript'
		});
		
		assert.strictEqual(untitledDoc.uri.scheme, 'untitled');
		assert.strictEqual(untitledDoc.languageId, 'javascript');
		
		provider.refresh(untitledDoc);
		const items = await provider.getChildren();
		
		assert.strictEqual(items.length, 0, 'Should not parse untitled non-markdown document');
	});

	test('Provider should switch between untitled and regular markdown documents', async () => {
		const provider = new MarkdownOutlineProvider();
		
		// Start with untitled markdown
		const untitledDoc = await vscode.workspace.openTextDocument({
			content: '# Untitled',
			language: 'markdown'
		});
		
		provider.refresh(untitledDoc);
		let items = await provider.getChildren();
		assert.strictEqual(items.length, 1);
		assert.strictEqual(items[0].label, 'Untitled');
		
		// Switch to regular markdown file (simulated with another in-memory doc)
		const regularDoc = await vscode.workspace.openTextDocument({
			content: '# Regular File',
			language: 'markdown'
		});
		
		provider.refresh(regularDoc);
		items = await provider.getChildren();
		assert.strictEqual(items.length, 1);
		assert.strictEqual(items[0].label, 'Regular File');
		
		// Back to untitled
		provider.refresh(untitledDoc);
		items = await provider.getChildren();
		assert.strictEqual(items.length, 1);
		assert.strictEqual(items[0].label, 'Untitled');
	});
});
