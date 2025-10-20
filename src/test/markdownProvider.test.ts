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
		assert.strictEqual(items[0].range.start.line, 0, 'Heading should be on line 0');
	});

	test('Should parse multiple headings at different levels', async () => {
		const content = `# H1 Heading
## H2 Heading
### H3 Heading`;
		
		const document = await createMarkdownDocument(content);
		const provider = new MarkdownOutlineProvider();
		provider.refresh(document);
		
		// PI-2: Returns hierarchical structure, so root has only H1
		const rootItems = await provider.getChildren();
		assert.strictEqual(rootItems.length, 1, 'Should have one root H1');
		assert.strictEqual(rootItems[0].label, 'H1 Heading');
		assert.strictEqual(rootItems[0].level, 1);
		assert.strictEqual(rootItems[0].range.start.line, 0);
		
		// H2 is child of H1
		const h2Items = await provider.getChildren(rootItems[0]);
		assert.strictEqual(h2Items.length, 1);
		assert.strictEqual(h2Items[0].label, 'H2 Heading');
		assert.strictEqual(h2Items[0].level, 2);
		assert.strictEqual(h2Items[0].range.start.line, 1);
		
		// H3 is child of H2
		const h3Items = await provider.getChildren(h2Items[0]);
		assert.strictEqual(h3Items.length, 1);
		assert.strictEqual(h3Items[0].label, 'H3 Heading');
		assert.strictEqual(h3Items[0].level, 3);
		assert.strictEqual(h3Items[0].range.start.line, 2);
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
		
		// PI-2: Hierarchical - navigate down the tree
		const h1 = await provider.getChildren();
		assert.strictEqual(h1.length, 1);
		assert.strictEqual(h1[0].level, 1);
		
		const h2 = await provider.getChildren(h1[0]);
		assert.strictEqual(h2.length, 1);
		assert.strictEqual(h2[0].level, 2);
		
		const h3 = await provider.getChildren(h2[0]);
		assert.strictEqual(h3.length, 1);
		assert.strictEqual(h3[0].level, 3);
		
		const h4 = await provider.getChildren(h3[0]);
		assert.strictEqual(h4.length, 1);
		assert.strictEqual(h4[0].level, 4);
		
		const h5 = await provider.getChildren(h4[0]);
		assert.strictEqual(h5.length, 1);
		assert.strictEqual(h5[0].level, 5);
		
		const h6 = await provider.getChildren(h5[0]);
		assert.strictEqual(h6.length, 1);
		assert.strictEqual(h6[0].level, 6);
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
		
		const rootItems = await provider.getChildren();
		
		// PI-2: Only H1 at root
		assert.strictEqual(rootItems.length, 1, 'Should have one root heading');
		assert.strictEqual(rootItems[0].label, 'Heading 1');
		
		// H2 is child of H1
		const children = await provider.getChildren(rootItems[0]);
		assert.strictEqual(children.length, 1);
		assert.strictEqual(children[0].label, 'Heading 2');
	});

	test('Should handle headings with special characters', async () => {
		const content = `# Heading with **bold** text
## Heading with \`code\`
### Heading with [link](url)`;
		
		const document = await createMarkdownDocument(content);
		const provider = new MarkdownOutlineProvider();
		provider.refresh(document);
		
		const rootItems = await provider.getChildren();
		
		// PI-2: Hierarchical structure
		assert.strictEqual(rootItems.length, 1, 'Should have one root');
		assert.strictEqual(rootItems[0].label, 'Heading with **bold** text');
		
		const h2Items = await provider.getChildren(rootItems[0]);
		assert.strictEqual(h2Items.length, 1);
		assert.strictEqual(h2Items[0].label, 'Heading with `code`');
		
		const h3Items = await provider.getChildren(h2Items[0]);
		assert.strictEqual(h3Items.length, 1);
		assert.strictEqual(h3Items[0].label, 'Heading with [link](url)');
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
		
		const rootItems = await provider.getChildren();
		assert.strictEqual(rootItems.length, 1);
		assert.strictEqual(rootItems[0].label, 'Heading with spaces', 'Should trim whitespace');
		
		const children = await provider.getChildren(rootItems[0]);
		assert.strictEqual(children.length, 1);
		assert.strictEqual(children[0].label, 'Another', 'Should trim whitespace');
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
		assert.strictEqual(items[0].range.end.line, 2, 'Section 1 should end at line 2 (before Section 2)');
		assert.strictEqual(items[1].range.end.line, 4, 'Section 2 should end at last line');
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
		let rootItems = await provider.getChildren();
		
		// PI-2: Hierarchical - only H1 at root
		assert.strictEqual(rootItems.length, 1, 'Should have 1 root heading');
		assert.strictEqual(rootItems[0].label, 'Heading 1');
		
		// H2 is child
		let children = await provider.getChildren(rootItems[0]);
		assert.strictEqual(children.length, 1);
		assert.strictEqual(children[0].label, 'Heading 2');
		
		// Now refresh with undefined (simulating switch to non-markdown file)
		provider.refresh(undefined);
		rootItems = await provider.getChildren();
		
		assert.strictEqual(rootItems.length, 0, 'Should have 0 items after clearing with undefined');
	});

	test('Provider should handle multiple refresh cycles correctly', async () => {
		const provider = new MarkdownOutlineProvider();
		
		// Cycle 1: Parse markdown
		const doc1 = await vscode.workspace.openTextDocument({
			content: '# First\n\n## Second',
			language: 'markdown'
		});
		provider.refresh(doc1);
		let rootItems = await provider.getChildren();
		assert.strictEqual(rootItems.length, 1, 'Should have 1 root item');
		
		let children = await provider.getChildren(rootItems[0]);
		assert.strictEqual(children.length, 1, 'Should have 1 child');
		
		// Cycle 2: Clear
		provider.refresh(undefined);
		rootItems = await provider.getChildren();
		assert.strictEqual(rootItems.length, 0, 'Should be cleared');
		
		// Cycle 3: Parse different markdown
		const doc2 = await vscode.workspace.openTextDocument({
			content: '### Only One Heading',
			language: 'markdown'
		});
		provider.refresh(doc2);
		rootItems = await provider.getChildren();
		assert.strictEqual(rootItems.length, 1, 'Should have 1 new item');
		assert.strictEqual(rootItems[0].label, 'Only One Heading');
		
		// Cycle 4: Clear again
		provider.refresh(undefined);
		rootItems = await provider.getChildren();
		assert.strictEqual(rootItems.length, 0, 'Should be cleared again');
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
		
		// Document 2 with hierarchy
		const doc2 = await vscode.workspace.openTextDocument({
			content: '# Document 2 Heading\n\n## Subheading',
			language: 'markdown'
		});
		
		provider.refresh(doc2);
		items = await provider.getChildren();
		assert.strictEqual(items.length, 1, 'Should have 1 root');
		assert.strictEqual(items[0].label, 'Document 2 Heading');
		
		let children = await provider.getChildren(items[0]);
		assert.strictEqual(children.length, 1, 'Should have 1 child');
		assert.strictEqual(children[0].label, 'Subheading');
		
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
		const rootItems = await provider.getChildren();
		
		// PI-2: Hierarchical structure
		assert.strictEqual(rootItems.length, 1, 'Should have 1 root heading');
		assert.strictEqual(rootItems[0].label, 'Untitled Heading 1');
		
		const children = await provider.getChildren(rootItems[0]);
		assert.strictEqual(children.length, 1, 'Should have 1 child');
		assert.strictEqual(children[0].label, 'Untitled Heading 2');
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

suite('MarkdownOutlineProvider - Hierarchical Structure (PI-2)', () => {

	test('Should nest H2 under H1 as children', async () => {
		const content = `# Main Heading
## Sub Heading 1
## Sub Heading 2`;
		
		const document = await vscode.workspace.openTextDocument({
			content: content,
			language: 'markdown'
		});
		
		const provider = new MarkdownOutlineProvider();
		provider.refresh(document);
		
		const items = await provider.getChildren();
		
		// Should have 1 root item (H1)
		assert.strictEqual(items.length, 1, 'Should have 1 root item');
		assert.strictEqual(items[0].label, 'Main Heading');
		assert.strictEqual(items[0].level, 1);
		
		// H1 should have 2 children (H2s)
		const children = await provider.getChildren(items[0]);
		assert.strictEqual(children.length, 2, 'H1 should have 2 children');
		assert.strictEqual(children[0].label, 'Sub Heading 1');
		assert.strictEqual(children[0].level, 2);
		assert.strictEqual(children[1].label, 'Sub Heading 2');
		assert.strictEqual(children[1].level, 2);
	});

	test('Should nest H3 under H2 under H1', async () => {
		const content = `# Level 1
## Level 2
### Level 3a
### Level 3b
## Level 2b`;
		
		const document = await vscode.workspace.openTextDocument({
			content: content,
			language: 'markdown'
		});
		
		const provider = new MarkdownOutlineProvider();
		provider.refresh(document);
		
		const rootItems = await provider.getChildren();
		
		// Root: 1 H1
		assert.strictEqual(rootItems.length, 1);
		assert.strictEqual(rootItems[0].label, 'Level 1');
		
		// H1 children: 2 H2s
		const level2Items = await provider.getChildren(rootItems[0]);
		assert.strictEqual(level2Items.length, 2);
		assert.strictEqual(level2Items[0].label, 'Level 2');
		assert.strictEqual(level2Items[1].label, 'Level 2b');
		
		// First H2 children: 2 H3s
		const level3Items = await provider.getChildren(level2Items[0]);
		assert.strictEqual(level3Items.length, 2);
		assert.strictEqual(level3Items[0].label, 'Level 3a');
		assert.strictEqual(level3Items[1].label, 'Level 3b');
		
		// Second H2 should have no children
		const level2bChildren = await provider.getChildren(level2Items[1]);
		assert.strictEqual(level2bChildren.length, 0);
	});

	test('Should handle multiple root H1 headings with their own hierarchies', async () => {
		const content = `# First Root
## Child of First
# Second Root
## Child of Second`;
		
		const document = await vscode.workspace.openTextDocument({
			content: content,
			language: 'markdown'
		});
		
		const provider = new MarkdownOutlineProvider();
		provider.refresh(document);
		
		const rootItems = await provider.getChildren();
		
		// Should have 2 root H1s
		assert.strictEqual(rootItems.length, 2);
		assert.strictEqual(rootItems[0].label, 'First Root');
		assert.strictEqual(rootItems[1].label, 'Second Root');
		
		// Each H1 should have its own child
		const firstChildren = await provider.getChildren(rootItems[0]);
		assert.strictEqual(firstChildren.length, 1);
		assert.strictEqual(firstChildren[0].label, 'Child of First');
		
		const secondChildren = await provider.getChildren(rootItems[1]);
		assert.strictEqual(secondChildren.length, 1);
		assert.strictEqual(secondChildren[0].label, 'Child of Second');
	});

	test('Should handle skipped heading levels (H1 directly to H3)', async () => {
		const content = `# Level 1
### Level 3 (skipped H2)
## Level 2`;
		
		const document = await vscode.workspace.openTextDocument({
			content: content,
			language: 'markdown'
		});
		
		const provider = new MarkdownOutlineProvider();
		provider.refresh(document);
		
		const rootItems = await provider.getChildren();
		assert.strictEqual(rootItems.length, 1);
		
		// H1 should have both H3 and H2 as children (nearest parent is H1)
		const children = await provider.getChildren(rootItems[0]);
		assert.strictEqual(children.length, 2);
		assert.strictEqual(children[0].label, 'Level 3 (skipped H2)');
		assert.strictEqual(children[0].level, 3);
		assert.strictEqual(children[1].label, 'Level 2');
		assert.strictEqual(children[1].level, 2);
	});

	test('Should handle document starting with H2 (no root H1)', async () => {
		const content = `## First H2
### H3 under H2
## Second H2`;
		
		const document = await vscode.workspace.openTextDocument({
			content: content,
			language: 'markdown'
		});
		
		const provider = new MarkdownOutlineProvider();
		provider.refresh(document);
		
		const rootItems = await provider.getChildren();
		
		// H2s should be root items when there's no H1
		assert.strictEqual(rootItems.length, 2);
		assert.strictEqual(rootItems[0].label, 'First H2');
		assert.strictEqual(rootItems[1].label, 'Second H2');
		
		// First H2 should have H3 as child
		const children = await provider.getChildren(rootItems[0]);
		assert.strictEqual(children.length, 1);
		assert.strictEqual(children[0].label, 'H3 under H2');
	});

	test('Should handle deeply nested structure (H1 through H6)', async () => {
		const content = `# H1
## H2
### H3
#### H4
##### H5
###### H6`;
		
		const document = await vscode.workspace.openTextDocument({
			content: content,
			language: 'markdown'
		});
		
		const provider = new MarkdownOutlineProvider();
		provider.refresh(document);
		
		// Navigate down the tree
		const h1Items = await provider.getChildren();
		assert.strictEqual(h1Items.length, 1);
		assert.strictEqual(h1Items[0].label, 'H1');
		
		const h2Items = await provider.getChildren(h1Items[0]);
		assert.strictEqual(h2Items.length, 1);
		assert.strictEqual(h2Items[0].label, 'H2');
		
		const h3Items = await provider.getChildren(h2Items[0]);
		assert.strictEqual(h3Items.length, 1);
		assert.strictEqual(h3Items[0].label, 'H3');
		
		const h4Items = await provider.getChildren(h3Items[0]);
		assert.strictEqual(h4Items.length, 1);
		assert.strictEqual(h4Items[0].label, 'H4');
		
		const h5Items = await provider.getChildren(h4Items[0]);
		assert.strictEqual(h5Items.length, 1);
		assert.strictEqual(h5Items[0].label, 'H5');
		
		const h6Items = await provider.getChildren(h5Items[0]);
		assert.strictEqual(h6Items.length, 1);
		assert.strictEqual(h6Items[0].label, 'H6');
		
		// H6 should have no children
		const leafChildren = await provider.getChildren(h6Items[0]);
		assert.strictEqual(leafChildren.length, 0);
	});

	test('Should return root items when getChildren called with no element', async () => {
		const content = `# Root 1
## Child 1
# Root 2`;
		
		const document = await vscode.workspace.openTextDocument({
			content: content,
			language: 'markdown'
		});
		
		const provider = new MarkdownOutlineProvider();
		provider.refresh(document);
		
		// getChildren() with no argument should return root items
		const rootItems = await provider.getChildren();
		assert.strictEqual(rootItems.length, 2);
		assert.strictEqual(rootItems[0].label, 'Root 1');
		assert.strictEqual(rootItems[1].label, 'Root 2');
		
		// getChildren(undefined) should also return root items
		const rootItems2 = await provider.getChildren(undefined);
		assert.strictEqual(rootItems2.length, 2);
	});

	test('Bug Reproduction: Document with only H2 headings (like sample.md)', async () => {
		// This reproduces the structure of test-fixtures/sample.md
		const content = `## Section 1: Introduction

This section introduces the document.

### Subsection 1.1: Background

Some background information here.

### Subsection 1.2: Goals

The goals of this test document.

## Section 2: Features

This section describes features.

### Subsection 2.1: Current

Content here.

### Subsection 2.2: Future

More content.

## Section 3: Conclusion

Final section.`;
		
		const document = await vscode.workspace.openTextDocument({
			content: content,
			language: 'markdown'
		});
		
		const provider = new MarkdownOutlineProvider();
		provider.refresh(document);
		
		const rootItems = await provider.getChildren();
		
		// Should show ALL three H2 sections as root items
		assert.strictEqual(rootItems.length, 3, 'Should have 3 root H2 sections');
		assert.strictEqual(rootItems[0].label, 'Section 1: Introduction');
		assert.strictEqual(rootItems[1].label, 'Section 2: Features');
		assert.strictEqual(rootItems[2].label, 'Section 3: Conclusion');
		
		// Each H2 should have its H3 children
		const section1Children = await provider.getChildren(rootItems[0]);
		assert.strictEqual(section1Children.length, 2, 'Section 1 should have 2 subsections');
		assert.strictEqual(section1Children[0].label, 'Subsection 1.1: Background');
		assert.strictEqual(section1Children[1].label, 'Subsection 1.2: Goals');
		
		const section2Children = await provider.getChildren(rootItems[1]);
		assert.strictEqual(section2Children.length, 2, 'Section 2 should have 2 subsections');
		assert.strictEqual(section2Children[0].label, 'Subsection 2.1: Current');
		assert.strictEqual(section2Children[1].label, 'Subsection 2.2: Future');
		
		const section3Children = await provider.getChildren(rootItems[2]);
		assert.strictEqual(section3Children.length, 0, 'Section 3 should have no subsections');
	});
});

suite('MarkdownOutlineProvider - Selection Sync (PI-2)', () => {

	async function createMarkdownDocument(content: string): Promise<vscode.TextDocument> {
		return await vscode.workspace.openTextDocument({
			content: content,
			language: 'markdown'
		});
	}

	test('Should find item at heading line', async () => {
		const content = '# Heading 1\n\nContent\n\n# Heading 2\n\nContent';
		const document = await createMarkdownDocument(content);
		
		const provider = new MarkdownOutlineProvider();
		provider.refresh(document);
		
		// Line 0 should return Heading 1
		const item = provider.findItemAtLine(0);
		assert.ok(item, 'Should find item at heading line');
		assert.strictEqual(item.label, 'Heading 1');
	});

	test('Should find item at content line within section', async () => {
		const content = '# Heading 1\n\nContent line 1\nContent line 2\n\n# Heading 2\n\nContent';
		const document = await createMarkdownDocument(content);
		
		const provider = new MarkdownOutlineProvider();
		provider.refresh(document);
		
		// Line 2 (content under Heading 1) should return Heading 1
		const item = provider.findItemAtLine(2);
		assert.ok(item, 'Should find item for content line');
		assert.strictEqual(item.label, 'Heading 1');
		
		// Line 3 (still content under Heading 1) should also return Heading 1
		const item2 = provider.findItemAtLine(3);
		assert.ok(item2, 'Should find item for content line');
		assert.strictEqual(item2.label, 'Heading 1');
	});

	test('Should return undefined for line before any heading', async () => {
		const content = 'No heading here\n\nJust text\n\n# Heading 1\n\nContent';
		const document = await createMarkdownDocument(content);
		
		const provider = new MarkdownOutlineProvider();
		provider.refresh(document);
		
		// Line 0 (before any heading) should return undefined
		const item = provider.findItemAtLine(0);
		assert.strictEqual(item, undefined, 'Should return undefined for line outside any section');
	});

	test('Should find most specific (deepest) item in hierarchy', async () => {
		const content = '# H1\n\n## H2\n\n### H3\n\nContent';
		const document = await createMarkdownDocument(content);
		
		const provider = new MarkdownOutlineProvider();
		provider.refresh(document);
		
		// Line 4 (H3) should return H3, not H2 or H1
		const item = provider.findItemAtLine(4);
		assert.ok(item, 'Should find item');
		assert.strictEqual(item.label, 'H3', 'Should return most specific heading');
		assert.strictEqual(item.level, 3, 'Should be level 3');
		
		// Content line 5 under H3 should also return H3
		const item2 = provider.findItemAtLine(5);
		assert.ok(item2, 'Should find item for content');
		assert.strictEqual(item2.label, 'H3');
	});

	test('Should handle section boundaries correctly', async () => {
		const content = '# Heading 1\n\nContent 1\n\n# Heading 2\n\nContent 2';
		const document = await createMarkdownDocument(content);
		
		const provider = new MarkdownOutlineProvider();
		provider.refresh(document);
		
		// Line 2 should be in Heading 1
		const item1 = provider.findItemAtLine(2);
		assert.strictEqual(item1?.label, 'Heading 1');
		
		// Line 4 should be Heading 2
		const item2 = provider.findItemAtLine(4);
		assert.strictEqual(item2?.label, 'Heading 2');
		
		// Line 6 should be in Heading 2
		const item3 = provider.findItemAtLine(6);
		assert.strictEqual(item3?.label, 'Heading 2');
	});

	test('Should work with nested headings (child vs parent)', async () => {
		const content = '# Parent\n\nParent content\n\n## Child\n\nChild content';
		const document = await createMarkdownDocument(content);
		
		const provider = new MarkdownOutlineProvider();
		provider.refresh(document);
		
		// Line 2 (parent content) should return Parent
		const parentItem = provider.findItemAtLine(2);
		assert.strictEqual(parentItem?.label, 'Parent');
		assert.strictEqual(parentItem?.level, 1);
		
		// Line 4 (child heading) should return Child
		const childItem = provider.findItemAtLine(4);
		assert.strictEqual(childItem?.label, 'Child');
		assert.strictEqual(childItem?.level, 2);
		
		// Line 6 (child content) should return Child (most specific)
		const childContentItem = provider.findItemAtLine(6);
		assert.strictEqual(childContentItem?.label, 'Child');
		assert.strictEqual(childContentItem?.level, 2);
	});
});
