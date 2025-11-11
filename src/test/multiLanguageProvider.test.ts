import * as assert from 'assert';
import * as vscode from 'vscode';
import { MultiLanguageOutlineProvider } from '../multiLanguageOutlineProvider';
import { ensureMarkdownExtensionActivated } from './testUtils';

/**
 * Tests for MultiLanguageOutlineProvider
 * 
 * Verifies that the provider correctly delegates to language-specific providers
 * and switches providers when the language changes.
 */
suite('MultiLanguageOutlineProvider - Provider Switching', () => {
	
	suiteSetup(async () => {
		await ensureMarkdownExtensionActivated();
	});

	test('Provider should use MarkdownOutlineProvider for markdown files', async () => {
		const provider = new MultiLanguageOutlineProvider();
		
		const markdownDoc = await vscode.workspace.openTextDocument({
			content: '# Heading 1\n\n## Heading 2',
			language: 'markdown'
		});
		
		await provider.refresh(markdownDoc);
		const rootItems = provider.rootItems;
		
		// Should have parsed markdown headings
		assert.ok(rootItems.length > 0, 'Should have items from markdown');
		
		// Markdown provider strips # prefix, so label should not include it
		const firstLabel = rootItems[0].label;
		assert.ok(!firstLabel.startsWith('#'), 'Markdown provider should strip # prefix');
	});

	test('Provider should switch between different languages', async () => {
		const provider = new MultiLanguageOutlineProvider();
		
		// Start with markdown
		const markdownDoc = await vscode.workspace.openTextDocument({
			content: '# Markdown Heading',
			language: 'markdown'
		});
		
		await provider.refresh(markdownDoc);
		let rootItems = provider.rootItems;
		assert.ok(rootItems.length > 0, 'Should have markdown items');
		
		// Switch to plain text (no symbols)
		const textDoc = await vscode.workspace.openTextDocument({
			content: 'Just plain text',
			language: 'plaintext'
		});
		
		await provider.refresh(textDoc);
		rootItems = provider.rootItems;
		assert.strictEqual(rootItems.length, 0, 'Plain text should have no items');
		
		// Switch back to markdown
		const markdownDoc2 = await vscode.workspace.openTextDocument({
			content: '### Another Heading',
			language: 'markdown'
		});
		
		await provider.refresh(markdownDoc2);
		rootItems = provider.rootItems;
		assert.ok(rootItems.length > 0, 'Should have markdown items again');
	});

	test('Provider should clear when refreshed with undefined', async () => {
		const provider = new MultiLanguageOutlineProvider();
		
		const markdownDoc = await vscode.workspace.openTextDocument({
			content: '# Heading',
			language: 'markdown'
		});
		
		await provider.refresh(markdownDoc);
		let rootItems = provider.rootItems;
		assert.ok(rootItems.length > 0, 'Should have items');
		
		await provider.refresh(undefined);
		rootItems = provider.rootItems;
		assert.strictEqual(rootItems.length, 0, 'Should be cleared');
	});

	test('Provider should delegate findItemAtLine to current provider', async () => {
		const provider = new MultiLanguageOutlineProvider();
		
		const content = '# Heading 1\n\nContent\n\n# Heading 2';
		const markdownDoc = await vscode.workspace.openTextDocument({
			content: content,
			language: 'markdown'
		});
		
		await provider.refresh(markdownDoc);
		
		// Should find item at line 0
		const item = provider.findItemAtLine(0);
		assert.ok(item, 'Should find item at heading line');
		assert.ok(item.label.includes('Heading 1'), 'Should find correct heading');
	});
});
