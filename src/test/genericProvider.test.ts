import * as assert from 'assert';
import * as vscode from 'vscode';
import { GenericOutlineProvider } from '../genericOutlineProvider';
import { ensureMarkdownExtensionActivated, waitForDocumentSymbols } from './testUtils';

/**
 * Tests for GenericOutlineProvider
 * 
 * These tests verify the language-agnostic functionality of the generic provider.
 * The provider should work with any language that has a document symbol provider.
 */
suite('GenericOutlineProvider - Basic Functionality', () => {
	
	suiteSetup(async () => {
		await ensureMarkdownExtensionActivated();
	});

	test('Provider should handle documents without symbols', async () => {
		const provider = new GenericOutlineProvider();
		
		// Create a plain text document (no symbols)
		const doc = await vscode.workspace.openTextDocument({
			content: 'Just some plain text\nNo symbols here',
			language: 'plaintext'
		});
		
		await provider.refresh(doc);
		const rootItems = provider.rootItems;
		
		assert.strictEqual(rootItems.length, 0, 'Should have 0 items for plain text');
	});

	test('Provider should clear items when refresh called with undefined', async () => {
		const provider = new GenericOutlineProvider();
		
		// First, parse a markdown document (markdown has symbol provider)
		const markdownDoc = await vscode.workspace.openTextDocument({
			content: '# Heading 1\n\n## Heading 2\n\nContent',
			language: 'markdown'
		});
		
		// Wait for symbols to be available
		await waitForDocumentSymbols(markdownDoc);
		
		await provider.refresh(markdownDoc);
		let rootItems = provider.rootItems;
		
		// Should have at least some items from markdown
		assert.ok(rootItems.length > 0, 'Should have items after parsing markdown');
		
		// Now refresh with undefined (simulating switch to unsupported file)
		await provider.refresh(undefined);
		rootItems = provider.rootItems;
		
		assert.strictEqual(rootItems.length, 0, 'Should have 0 items after clearing');
	});

	test('Provider should handle multiple refresh cycles correctly', async () => {
		const provider = new GenericOutlineProvider();
		
		// Cycle 1: Parse markdown
		const doc1 = await vscode.workspace.openTextDocument({
			content: '# First\n\n## Second',
			language: 'markdown'
		});
		await provider.refresh(doc1);
		let rootItems = provider.rootItems;
		assert.ok(rootItems.length > 0, 'Should have items');
		
		// Cycle 2: Clear
		await provider.refresh(undefined);
		rootItems = provider.rootItems;
		assert.strictEqual(rootItems.length, 0, 'Should be cleared');
		
		// Cycle 3: Parse different markdown
		const doc2 = await vscode.workspace.openTextDocument({
			content: '### Only One Heading',
			language: 'markdown'
		});
		await provider.refresh(doc2);
		rootItems = provider.rootItems;
		assert.ok(rootItems.length > 0, 'Should have new items');
	});
});

suite('GenericOutlineProvider - Symbol Conversion', () => {
	
	suiteSetup(async () => {
		await ensureMarkdownExtensionActivated();
	});

	test('Provider should work with markdown symbols', async () => {
		const provider = new GenericOutlineProvider();
		
		const content = `# Heading 1
Content here

## Heading 2
More content`;
		
		const document = await vscode.workspace.openTextDocument({
			content: content,
			language: 'markdown'
		});
		
		await provider.refresh(document);
		const rootItems = provider.rootItems;
		
		// Should have parsed the markdown headings
		assert.ok(rootItems.length > 0, 'Should have at least one root item');
		
		// First item should be a heading (though generic provider won't strip # prefix)
		const firstItem = rootItems[0];
		assert.ok(firstItem.label.length > 0, 'Item should have a label');
		assert.ok(firstItem.range, 'Item should have a range');
		assert.ok(firstItem.selectionRange, 'Item should have a selection range');
	});

	test('Provider should preserve symbol kinds', async () => {
		const provider = new GenericOutlineProvider();
		
		const content = '# Heading';
		const document = await vscode.workspace.openTextDocument({
			content: content,
			language: 'markdown'
		});
		
		await provider.refresh(document);
		const rootItems = provider.rootItems;
		
		assert.ok(rootItems.length > 0, 'Should have items');
		assert.ok(rootItems[0].symbolKind !== undefined, 'Should preserve symbol kind');
	});
});

suite('GenericOutlineProvider - Hierarchy Building', () => {
	
	suiteSetup(async () => {
		await ensureMarkdownExtensionActivated();
	});

	test('Provider should build hierarchy from flat symbols', async () => {
		const provider = new GenericOutlineProvider();
		
		const content = `# Main Heading
## Sub Heading 1
## Sub Heading 2`;
		
		const document = await vscode.workspace.openTextDocument({
			content: content,
			language: 'markdown'
		});
		
		await provider.refresh(document);
		const rootItems = provider.rootItems;
		
		// Hierarchy should be built based on levels
		assert.ok(rootItems.length > 0, 'Should have root items');
	});

	test('Provider should handle deeply nested structures', async () => {
		const provider = new GenericOutlineProvider();
		
		const content = `# H1
## H2
### H3
#### H4`;
		
		const document = await vscode.workspace.openTextDocument({
			content: content,
			language: 'markdown'
		});
		
		await provider.refresh(document);
		const rootItems = provider.rootItems;
		
		assert.ok(rootItems.length > 0, 'Should have root items');
	});
});

suite('GenericOutlineProvider - Selection and Navigation', () => {
	
	suiteSetup(async () => {
		await ensureMarkdownExtensionActivated();
	});

	test('Provider should find items at specific lines', async () => {
		const provider = new GenericOutlineProvider();
		
		const content = '# Heading 1\n\nContent\n\n# Heading 2\n\nContent';
		const document = await vscode.workspace.openTextDocument({
			content: content,
			language: 'markdown'
		});
		
		await provider.refresh(document);
		
		// Should be able to find item at heading line
		const item = provider.findItemAtLine(0);
		assert.ok(item, 'Should find item at line 0');
	});

	test('Provider should return undefined for line without symbols', async () => {
		const provider = new GenericOutlineProvider();
		
		const content = 'No symbols\n\nJust text\n\n# Heading 1';
		const document = await vscode.workspace.openTextDocument({
			content: content,
			language: 'markdown'
		});
		
		await provider.refresh(document);
		
		// Line before any heading should return undefined
		const item = provider.findItemAtLine(0);
		assert.strictEqual(item, undefined, 'Should return undefined for line without symbol');
	});
});

suite('GenericOutlineProvider - TreeDataProvider Interface', () => {
	
	suiteSetup(async () => {
		await ensureMarkdownExtensionActivated();
	});

	test('Provider should implement getTreeItem correctly', async () => {
		const provider = new GenericOutlineProvider();
		
		const content = '# Heading\n\n## Child';
		const document = await vscode.workspace.openTextDocument({
			content: content,
			language: 'markdown'
		});
		
		await provider.refresh(document);
		const rootItems = provider.rootItems;
		
		assert.ok(rootItems.length > 0, 'Should have items');
		
		const treeItem = provider.getTreeItem(rootItems[0]);
		assert.ok(treeItem, 'Should return tree item');
		assert.strictEqual(treeItem.label, rootItems[0].label, 'Labels should match');
	});

	test('Provider should implement getChildren correctly', async () => {
		const provider = new GenericOutlineProvider();
		
		const content = '# Root\n## Child';
		const document = await vscode.workspace.openTextDocument({
			content: content,
			language: 'markdown'
		});
		
		await provider.refresh(document);
		
		// getChildren with undefined should return root items + placeholders
		const allItems = await provider.getChildren(undefined);
		assert.ok(allItems.length > 0, 'Should have items');
	});

	test('Provider should implement getParent correctly', async () => {
		const provider = new GenericOutlineProvider();
		
		const content = '# Parent\n## Child';
		const document = await vscode.workspace.openTextDocument({
			content: content,
			language: 'markdown'
		});
		
		await provider.refresh(document);
		const rootItems = provider.rootItems;
		
		if (rootItems.length > 0 && rootItems[0].children.length > 0) {
			const child = rootItems[0].children[0];
			const parent = provider.getParent(child);
			assert.strictEqual(parent, rootItems[0], 'Parent should be root item');
		}
	});
});
