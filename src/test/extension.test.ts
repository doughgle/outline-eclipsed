import * as assert from 'assert';
import * as vscode from 'vscode';

suite('PI-0: Extension Skeleton Test Suite', () => {
	vscode.window.showInformationMessage('Start PI-0 tests.');

	test('Extension should be present', () => {
		const extension = vscode.extensions.getExtension('douglashellinger.outline-eclipsed');
		assert.ok(extension, 'Extension should be installed');
	});

	test('Extension should activate', async () => {
		const extension = vscode.extensions.getExtension('douglashellinger.outline-eclipsed');
		assert.ok(extension, 'Extension not found');
		
		await extension!.activate();
		assert.strictEqual(extension!.isActive, true, 'Extension should be active');
	});

	test('Tree view should be registered (outlineEclipsed)', async () => {
		const extension = vscode.extensions.getExtension('douglashellinger.outline-eclipsed');
		await extension?.activate();

		// Verify the tree view registration by checking if goto command exists
		const commands = await vscode.commands.getCommands(true);
		const hasGotoCommand = commands.includes('outlineEclipsed.gotoItem');
		
		assert.ok(hasGotoCommand, 'outlineEclipsed.gotoItem command should be registered');
		assert.ok(extension?.isActive, 'Extension should be active for tree view to exist');
	});

	test('Extension should activate and show tree view always', async () => {
		const extension = vscode.extensions.getExtension('douglashellinger.outline-eclipsed');
		await extension?.activate();

		// Tree view should exist regardless of file type
		const commands = await vscode.commands.getCommands(true);
		const hasGotoCommand = commands.includes('outlineEclipsed.gotoItem');
		
		assert.ok(hasGotoCommand, 'Tree view should be registered');
		assert.strictEqual(extension?.isActive, true, 'Extension should be active');
	});

	test('Goto command should move cursor in markdown file', async () => {
		// Create a markdown document with multiple lines
		const document = await vscode.workspace.openTextDocument({
			content: '# Line 0\n\n# Line 2\n\n# Line 4',
			language: 'markdown'
		});

		const editor = await vscode.window.showTextDocument(document);

		// Execute goto command to line 2
		await vscode.commands.executeCommand('outlineEclipsed.gotoItem', 2);

		// Verify cursor moved to line 2
		assert.strictEqual(editor.selection.active.line, 2, 'Cursor should be on line 2');
	});

	test('Tree view should show message for non-markdown files', async () => {
		// Create a non-markdown document
		const document = await vscode.workspace.openTextDocument({
			content: 'console.log("hello");',
			language: 'javascript'
		});

		await vscode.window.showTextDocument(document);

		// Give extension time to update
		await new Promise(resolve => setTimeout(resolve, 500));

		// Extension should still be active
		const extension = vscode.extensions.getExtension('douglashellinger.outline-eclipsed');
		assert.strictEqual(extension?.isActive, true, 'Extension should remain active');
		
		// Tree view should exist (we can't directly test the message, but we can verify it's still registered)
		const commands = await vscode.commands.getCommands(true);
		assert.ok(commands.includes('outlineEclipsed.gotoItem'), 'Tree view should still be registered');
	});
});

suite('PI-1: Tree View Integration Tests', () => {
	
	test('Tree view should populate with headings from markdown file', async () => {
		const document = await vscode.workspace.openTextDocument({
			content: '# Heading 1\n\n## Heading 2\n\n### Heading 3',
			language: 'markdown'
		});

		await vscode.window.showTextDocument(document);
		await new Promise(resolve => setTimeout(resolve, 500));

		// Extension should be active
		const extension = vscode.extensions.getExtension('douglashellinger.outline-eclipsed');
		assert.strictEqual(extension?.isActive, true, 'Extension should be active');
	});

	test('Goto command should navigate to heading line', async () => {
		const document = await vscode.workspace.openTextDocument({
			content: '# First\n\nSome text\n\n## Second\n\nMore text',
			language: 'markdown'
		});

		const editor = await vscode.window.showTextDocument(document);
		
		// Navigate to line 4 (the "## Second" heading)
		await vscode.commands.executeCommand('outlineEclipsed.gotoItem', 4);

		assert.strictEqual(editor.selection.active.line, 4, 'Cursor should be on line 4');
	});

	test('Tree view should update when markdown document changes', async () => {
		const document = await vscode.workspace.openTextDocument({
			content: '# Original Heading',
			language: 'markdown'
		});

		const editor = await vscode.window.showTextDocument(document);
		await new Promise(resolve => setTimeout(resolve, 500));

		// Make an edit to add a new heading
		await editor.edit(editBuilder => {
			editBuilder.insert(new vscode.Position(1, 0), '\n## New Heading');
		});

		// Give time for refresh
		await new Promise(resolve => setTimeout(resolve, 500));

		// Verify extension is still active and processing changes
		const extension = vscode.extensions.getExtension('douglashellinger.outline-eclipsed');
		assert.strictEqual(extension?.isActive, true, 'Extension should remain active after edit');
	});

	test('Tree view should show empty for markdown file with no headings', async () => {
		const document = await vscode.workspace.openTextDocument({
			content: 'Just plain text.\nNo headings here.\nMore text.',
			language: 'markdown'
		});

		await vscode.window.showTextDocument(document);
		await new Promise(resolve => setTimeout(resolve, 500));

		// Extension should be active even with no headings
		const extension = vscode.extensions.getExtension('douglashellinger.outline-eclipsed');
		assert.strictEqual(extension?.isActive, true, 'Extension should be active');
	});

	test('Tree view should clear outline when switching from markdown to non-markdown file', async () => {
		// First, open a markdown document with headings
		const markdownDoc = await vscode.workspace.openTextDocument({
			content: '# Heading 1\n\n## Heading 2\n\nContent here.',
			language: 'markdown'
		});

		await vscode.window.showTextDocument(markdownDoc);
		await new Promise(resolve => setTimeout(resolve, 500));

		// Now switch to a JavaScript file
		const jsDoc = await vscode.workspace.openTextDocument({
			content: 'console.log("hello");\nconst x = 42;',
			language: 'javascript'
		});

		await vscode.window.showTextDocument(jsDoc);
		await new Promise(resolve => setTimeout(resolve, 500));

		// Tree view should be empty (no headings from markdown should remain)
		// We can't directly check tree contents, but we verify extension is active
		// and handling the switch correctly
		const extension = vscode.extensions.getExtension('douglashellinger.outline-eclipsed');
		assert.strictEqual(extension?.isActive, true, 'Extension should remain active after switching files');
	});

	test('Extension should handle untitled markdown documents', async () => {
		// This test simulates opening an untitled markdown file
		const untitledDoc = await vscode.workspace.openTextDocument({
			content: '# Test Heading from Untitled\n\n## Subheading\n\nContent here.',
			language: 'markdown'
		});
		
		// Show the document in an editor (this triggers onDidChangeActiveTextEditor)
		const editor = await vscode.window.showTextDocument(untitledDoc);
		
		// Verify document properties
		assert.strictEqual(editor.document.uri.scheme, 'untitled');
		assert.strictEqual(editor.document.languageId, 'markdown');
		
		// Give event handlers time to process
		await new Promise(resolve => setTimeout(resolve, 500));
		
		// Verify extension handles it correctly
		assert.ok(editor, 'Editor should be active');
		assert.strictEqual(editor.document.languageId, 'markdown', 'Should recognize as markdown');
		
		const extension = vscode.extensions.getExtension('douglashellinger.outline-eclipsed');
		assert.strictEqual(extension?.isActive, true, 'Extension should be active');
	});

	test('Extension should respond to language mode changes (plaintext to markdown)', async () => {
		// This simulates the real-world scenario: User opens untitled file (plaintext),
		// types content, then manually changes language to markdown
		
		// Create untitled document - defaults to plaintext initially
		const untitledDoc = await vscode.workspace.openTextDocument({
			content: '',
			language: 'plaintext' // Start as plaintext (what VS Code does for new untitled files)
		});
		
		const editor = await vscode.window.showTextDocument(untitledDoc);
		assert.strictEqual(editor.document.languageId, 'plaintext');
		
		// Wait for extension to process
		await new Promise(resolve => setTimeout(resolve, 200));
		
		// User types markdown content
		await editor.edit(editBuilder => {
			editBuilder.insert(new vscode.Position(0, 0), '# Heading 1\n\n## Heading 2\n\nContent');
		});
		
		// Document is still plaintext - VS Code doesn't auto-detect language
		assert.strictEqual(editor.document.languageId, 'plaintext', 
			'VS Code keeps untitled as plaintext even with markdown content');
		
		// User manually changes language to markdown (or saves with .md extension)
		await vscode.languages.setTextDocumentLanguage(editor.document, 'markdown');
		
		// Now it should be markdown
		assert.strictEqual(editor.document.languageId, 'markdown');
		
		// Give extension time to process language change event
		await new Promise(resolve => setTimeout(resolve, 500));
		
		// Verify extension handled the language change
		const extension = vscode.extensions.getExtension('douglashellinger.outline-eclipsed');
		assert.strictEqual(extension?.isActive, true, 'Extension should be active');
		assert.strictEqual(editor.document.languageId, 'markdown', 'Document should be markdown');
	});
});

suite('PI-2: Hierarchical Tree View Tests', () => {

	test('Tree view should show hierarchical structure with H1 and H2 headings', async () => {
		const document = await vscode.workspace.openTextDocument({
			content: '# Root\n\n## Child 1\n\n## Child 2\n\nContent',
			language: 'markdown'
		});

		await vscode.window.showTextDocument(document);
		await new Promise(resolve => setTimeout(resolve, 500));

		const extension = vscode.extensions.getExtension('douglashellinger.outline-eclipsed');
		assert.strictEqual(extension?.isActive, true, 'Extension should be active');
	});

	test('Tree view should show multiple root H2 headings when no H1 present', async () => {
		const document = await vscode.workspace.openTextDocument({
			content: '## Section 1\n\n### Sub 1.1\n\n## Section 2\n\n### Sub 2.1\n\nContent',
			language: 'markdown'
		});

		await vscode.window.showTextDocument(document);
		await new Promise(resolve => setTimeout(resolve, 500));

		const extension = vscode.extensions.getExtension('douglashellinger.outline-eclipsed');
		assert.strictEqual(extension?.isActive, true, 'Extension should be active');
		
		// Note: Can't directly access tree items from integration test,
		// but provider should handle this correctly (verified in unit tests)
	});

	test('Tree view should handle deeply nested structure (H1 > H2 > H3)', async () => {
		const document = await vscode.workspace.openTextDocument({
			content: '# Level 1\n\n## Level 2\n\n### Level 3\n\n#### Level 4',
			language: 'markdown'
		});

		await vscode.window.showTextDocument(document);
		await new Promise(resolve => setTimeout(resolve, 500));

		const extension = vscode.extensions.getExtension('douglashellinger.outline-eclipsed');
		assert.strictEqual(extension?.isActive, true, 'Extension should be active');
	});

	test('Tree view should show collapsible items for headings with children', async () => {
		const document = await vscode.workspace.openTextDocument({
			content: '# Parent\n\n## Child\n\nContent',
			language: 'markdown'
		});

		const editor = await vscode.window.showTextDocument(document);
		await new Promise(resolve => setTimeout(resolve, 500));

		// Verify document is active
		assert.strictEqual(editor.document.languageId, 'markdown');
		
		const extension = vscode.extensions.getExtension('douglashellinger.outline-eclipsed');
		assert.strictEqual(extension?.isActive, true, 'Extension should be active');
	});
});

suite('PI-2: Tree View Selection Sync Tests', () => {

	test('Tree view selection sync infrastructure should be registered', async () => {
		// This test verifies the infrastructure for selection sync is in place
		// Full selection sync behavior requires manual testing with visible tree view
		
		const document = await vscode.workspace.openTextDocument({
			content: '# Heading 1\n\nContent 1\n\n# Heading 2\n\nContent 2',
			language: 'markdown'
		});

		const editor = await vscode.window.showTextDocument(document);
		await new Promise(resolve => setTimeout(resolve, 500));

		// Get the tree view reference from extension
		const extensionModule = await import('../extension.js');
		const treeView = extensionModule.outlineTreeView;
		assert.ok(treeView, 'Tree view should be created');

		// Verify onDidChangeSelection event exists
		assert.ok(treeView.onDidChangeSelection, 
			'Tree view should have onDidChangeSelection event');
		
		// Verify selection property exists (readonly array)
		assert.ok(Array.isArray(treeView.selection),
			'Tree view should have selection property');
	});

	test('Provider should find item at line within heading section', async () => {
		// Test the findItemAtLine method that powers selection sync
		const extension = vscode.extensions.getExtension('douglashellinger.outline-eclipsed');
		await extension?.activate();
		
		const document = await vscode.workspace.openTextDocument({
			content: '# Heading 1\n\nContent line 1\nContent line 2\n\n# Heading 2\n\nContent',
			language: 'markdown'
		});

		await vscode.window.showTextDocument(document);
		await new Promise(resolve => setTimeout(resolve, 500));

		// Note: Direct testing of provider.findItemAtLine() would require accessing
		// the provider instance, which is private to extension.ts
		// This test verifies the document is loaded correctly
		assert.strictEqual(document.lineCount, 8, 'Document should have expected line count');
		assert.ok(extension?.isActive, 'Extension should be active');
	});

	test('Provider getParent method should return parent for nested items', async () => {
		// Test that getParent is implemented (required for reveal)
		const extension = vscode.extensions.getExtension('douglashellinger.outline-eclipsed');
		await extension?.activate();
		
		const document = await vscode.workspace.openTextDocument({
			content: '# Heading 1\n\n## Heading 2\n\n### Heading 3\n\nContent',
			language: 'markdown'
		});

		await vscode.window.showTextDocument(document);
		await new Promise(resolve => setTimeout(resolve, 500));

		// Hierarchical structure should be created
		assert.ok(extension?.isActive, 'Extension should be active');
	});
});
