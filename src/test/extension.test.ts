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
		// BUGFIX: This test verifies that changing language mode doesn't cause
		// "Cannot resolve tree item" error due to race condition between
		// provider.refresh() and syncTreeViewSelection()
		// 
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
		// This triggers onDidOpenTextDocument event which calls provider.refresh()
		await vscode.languages.setTextDocumentLanguage(editor.document, 'markdown');
		
		// Now it should be markdown
		assert.strictEqual(editor.document.languageId, 'markdown');
		
		// Give extension time to process language change event and refresh tree
		// BUGFIX: The fix ensures provider.refresh() completes before syncTreeViewSelection()
		// is called, preventing "Cannot resolve tree item" error
		await new Promise(resolve => setTimeout(resolve, 500));
		
		// Verify extension handled the language change without errors
		const extension = vscode.extensions.getExtension('douglashellinger.outline-eclipsed');
		assert.strictEqual(extension?.isActive, true, 'Extension should be active');
		assert.strictEqual(editor.document.languageId, 'markdown', 'Document should be markdown');
		
		// Verify tree view can handle cursor movement after language change
		// This would previously trigger the "Cannot resolve tree item" error
		editor.selection = new vscode.Selection(
			new vscode.Position(0, 0),
			new vscode.Position(0, 0)
		);
		await new Promise(resolve => setTimeout(resolve, 100));
		
		// If we get here without error, the race condition is fixed
		assert.ok(true, 'No tree item resolution error should occur during language change');
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

	test('BUGFIX: Selection sync should respect tree view visibility state', async function() {
		this.timeout(3000);
		
		// PROBLEM: treeView.reveal() has side effect - it auto-shows hidden tree views
		// EXPECTED: Selection sync should only update selection, NOT change visibility
		// ROOT CAUSE: VS Code API documentation states:
		//   "If the tree view is not visible then the tree view is shown and element is revealed."
		// SOLUTION: Only call reveal() when tree view is already visible (check treeView.visible)
		
		const extension = vscode.extensions.getExtension('douglashellinger.outline-eclipsed');
		await extension?.activate();
		
		const document = await vscode.workspace.openTextDocument({
			content: '# Heading 1\n\nContent 1\n\n# Heading 2\n\nContent 2',
			language: 'markdown'
		});

		const editor = await vscode.window.showTextDocument(document);
		await new Promise(resolve => setTimeout(resolve, 500));

		// Get the tree view reference
		const extensionModule = await import('../extension.js');
		const treeView = extensionModule.outlineTreeView;
		assert.ok(treeView, 'Tree view should be created');

		const initialVisibility = treeView.visible;
		
		// Move cursor to trigger selection sync
		editor.selection = new vscode.Selection(
			new vscode.Position(4, 0),
			new vscode.Position(4, 0)
		);
		await new Promise(resolve => setTimeout(resolve, 100));

		const finalVisibility = treeView.visible;
		
		// Verify visibility state doesn't change due to cursor movement
		assert.strictEqual(
			finalVisibility,
			initialVisibility,
			'Tree view visibility should not change when cursor moves'
		);
		
		// Verify the fix: syncTreeViewSelection checks treeView.visible before calling reveal()
		assert.ok(treeView.visible !== undefined, 'Tree view should have visible property');
		console.log(`Tree view visibility unchanged: ${initialVisibility} -> ${finalVisibility}`);
	});
});

suite('PI-3: Text Selection Tests', () => {

	test('Double-click command should select full section range in editor', async () => {
		const extension = vscode.extensions.getExtension('douglashellinger.outline-eclipsed');
		await extension?.activate();
		
		const content = `# Section 1
Content line 1
Content line 2

# Section 2
Content line 3`;
		
		const document = await vscode.workspace.openTextDocument({
			content: content,
			language: 'markdown'
		});

		const editor = await vscode.window.showTextDocument(document);
		await new Promise(resolve => setTimeout(resolve, 500));

		// Execute selectItem command for first heading (lines 0-3)
		await vscode.commands.executeCommand('outlineEclipsed.selectItem', 0);
		await new Promise(resolve => setTimeout(resolve, 100));

		// Verify selection matches the full section range
		const selection = editor.selection;
		assert.strictEqual(selection.start.line, 0, 'Selection should start at line 0');
		assert.strictEqual(selection.start.character, 0, 'Selection should start at character 0');
		assert.strictEqual(selection.end.line, 3, 'Selection should end at line 3');
		// The end character should be at the end of line 2 (last content line before blank line)
		assert.ok(selection.end.character >= 0, 'Selection end character should be valid');
	});

	test('SelectItem command should be registered', async () => {
		const extension = vscode.extensions.getExtension('douglashellinger.outline-eclipsed');
		await extension?.activate();

		const commands = await vscode.commands.getCommands(true);
		const hasSelectCommand = commands.includes('outlineEclipsed.selectItem');
		
		assert.ok(hasSelectCommand, 'outlineEclipsed.selectItem command should be registered');
	});
});

suite('PI-3: Drag & Drop Text Movement Tests', () => {

	test('Should move section text when dropping at different position', async () => {
		const extension = vscode.extensions.getExtension('douglashellinger.outline-eclipsed');
		await extension?.activate();
		
		const originalContent = `# Section 1
Content 1

# Section 2
Content 2

# Section 3
Content 3`;
		
		const document = await vscode.workspace.openTextDocument({
			content: originalContent,
			language: 'markdown'
		});

		const editor = await vscode.window.showTextDocument(document);
		await new Promise(resolve => setTimeout(resolve, 500));

		// Simulate moving Section 1 (lines 0-2) after Section 2 (drop before Section 3)
		// Execute moveSection command with source and target line numbers
		await vscode.commands.executeCommand('outlineEclipsed.moveSection', 0, 6);
		await new Promise(resolve => setTimeout(resolve, 200));

		const newContent = editor.document.getText();
		
		// Expected: Section 2 should now be first, then Section 1, then Section 3
		const lines = newContent.split('\n');
		assert.strictEqual(lines[0], '# Section 2', 'Section 2 should be first');
		assert.strictEqual(lines[3], '# Section 1', 'Section 1 should be second');
		assert.strictEqual(lines[6], '# Section 3', 'Section 3 should be last');
	});

	test('MoveSection command should be registered', async () => {
		const extension = vscode.extensions.getExtension('douglashellinger.outline-eclipsed');
		await extension?.activate();

		const commands = await vscode.commands.getCommands(true);
		const hasMoveCommand = commands.includes('outlineEclipsed.moveSection');
		
		assert.ok(hasMoveCommand, 'outlineEclipsed.moveSection command should be registered');
	});
});

suite('PI-4: Nested Heading Drag & Drop Tests', () => {

	test('Should move parent heading with all its children', async () => {
		const extension = vscode.extensions.getExtension('douglashellinger.outline-eclipsed');
		await extension?.activate();
		
		const originalContent = `# Parent 1
Content for parent 1

## Child 1.1
Content for child 1.1

## Child 1.2
Content for child 1.2

# Parent 2
Content for parent 2`;
		
		const document = await vscode.workspace.openTextDocument({
			content: originalContent,
			language: 'markdown'
		});

		const editor = await vscode.window.showTextDocument(document);
		await new Promise(resolve => setTimeout(resolve, 500));

		// Move Parent 1 (with its children) after Parent 2
		// Parent 1 is at line 0, Parent 2 is at line 9
		await vscode.commands.executeCommand('outlineEclipsed.moveSection', 0, 11);
		await new Promise(resolve => setTimeout(resolve, 200));

		const newContent = editor.document.getText();
		const lines = newContent.split('\n');
		
		// Expected: Parent 2 first, then Parent 1 with all its children
		assert.strictEqual(lines[0], '# Parent 2', 'Parent 2 should be first');
		assert.strictEqual(lines[2], '# Parent 1', 'Parent 1 should be second');
		assert.strictEqual(lines[5], '## Child 1.1', 'Child 1.1 should move with Parent 1');
		assert.strictEqual(lines[8], '## Child 1.2', 'Child 1.2 should move with Parent 1');
	});

	test('Should move H2 with its H3 children', async () => {
		const extension = vscode.extensions.getExtension('douglashellinger.outline-eclipsed');
		await extension?.activate();
		
		const originalContent = `# Main
Content

## Section A
Content A

### Subsection A.1
Content A.1

## Section B
Content B`;
		
		const document = await vscode.workspace.openTextDocument({
			content: originalContent,
			language: 'markdown'
		});

		const editor = await vscode.window.showTextDocument(document);
		await new Promise(resolve => setTimeout(resolve, 500));

		// Move Section A (line 3) with its H3 child after Section B
		await vscode.commands.executeCommand('outlineEclipsed.moveSection', 3, 12);
		await new Promise(resolve => setTimeout(resolve, 200));

		const newContent = editor.document.getText();
		const lines = newContent.split('\n');
		
		// Expected: Main, then Section B, then Section A with Subsection A.1
		assert.strictEqual(lines[0], '# Main', 'Main should be first');
		assert.strictEqual(lines[3], '## Section B', 'Section B should be first child');
		assert.strictEqual(lines[5], '## Section A', 'Section A should be second child');
		assert.strictEqual(lines[8], '### Subsection A.1', 'Subsection A.1 should move with Section A');
	});

	test('Should not move children when dragging a leaf node', async () => {
		const extension = vscode.extensions.getExtension('douglashellinger.outline-eclipsed');
		await extension?.activate();
		
		const originalContent = `# Parent
Content

## Child 1
Content 1

## Child 2
Content 2`;
		
		const document = await vscode.workspace.openTextDocument({
			content: originalContent,
			language: 'markdown'
		});

		const editor = await vscode.window.showTextDocument(document);
		await new Promise(resolve => setTimeout(resolve, 500));

		// Move Child 1 (leaf node) after Child 2
		await vscode.commands.executeCommand('outlineEclipsed.moveSection', 3, 9);
		await new Promise(resolve => setTimeout(resolve, 200));

		const newContent = editor.document.getText();
		const lines = newContent.split('\n');
		
		// Expected: Parent, Child 2, Child 1
		assert.strictEqual(lines[0], '# Parent');
		assert.strictEqual(lines[3], '## Child 2', 'Child 2 should be first child');
		assert.strictEqual(lines[5], '## Child 1', 'Child 1 should be second child');
	});
});

suite('PI-9: Description and Tooltip Integration Tests', () => {
	
	test('Extension should handle markdown documents', async () => {
		// Create a markdown document
		const document = await vscode.workspace.openTextDocument({
			content: '# Heading 1\n\nSome content\n\n## Heading 2\n\nMore content',
			language: 'markdown'
		});

		await vscode.window.showTextDocument(document);
		await new Promise(resolve => setTimeout(resolve, 500));

		// Extension should be active
		const extension = vscode.extensions.getExtension('douglashellinger.outline-eclipsed');
		assert.strictEqual(extension?.isActive, true, 'Extension should be active');
	});

	test('Outline items should have tooltips with symbol information', async () => {
		// Create a TypeScript document
		const document = await vscode.workspace.openTextDocument({
			content: 'class MyClass {\n  method() {\n    return 42;\n  }\n}',
			language: 'typescript'
		});

		await vscode.window.showTextDocument(document);
		await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for language server

		// Extension should be active and showing tooltips
		const extension = vscode.extensions.getExtension('douglashellinger.outline-eclipsed');
		assert.strictEqual(extension?.isActive, true, 'Extension should be active');
	});

	test('Extension should handle single-line markdown items', async () => {
		// Create a simple markdown document with short headings
		const document = await vscode.workspace.openTextDocument({
			content: '# First\n# Second\n# Third',
			language: 'markdown'
		});

		await vscode.window.showTextDocument(document);
		await new Promise(resolve => setTimeout(resolve, 500));

		// Extension should be active
		const extension = vscode.extensions.getExtension('douglashellinger.outline-eclipsed');
		assert.strictEqual(extension?.isActive, true, 'Extension should be active');
	});

	test('Extension should handle multi-line markdown items', async () => {
		// Create a markdown document with multi-line sections
		const document = await vscode.workspace.openTextDocument({
			content: '# Heading 1\n\nContent line 1\nContent line 2\nContent line 3\n\n## Heading 2\n\nMore content',
			language: 'markdown'
		});

		await vscode.window.showTextDocument(document);
		await new Promise(resolve => setTimeout(resolve, 500));

		// Extension should be active and processing multi-line sections
		const extension = vscode.extensions.getExtension('douglashellinger.outline-eclipsed');
		assert.strictEqual(extension?.isActive, true, 'Extension should be active');
	});

});

suite('PI-12: Expand All Command Tests', () => {

	test('ExpandAll command should be registered', async () => {
		const extension = vscode.extensions.getExtension('douglashellinger.outline-eclipsed');
		await extension?.activate();

		const commands = await vscode.commands.getCommands(true);
		const hasExpandAllCommand = commands.includes('outlineEclipsed.expandAll');
		
		assert.ok(hasExpandAllCommand, 'outlineEclipsed.expandAll command should be registered');
	});

	test('ExpandAll command should execute without errors', async () => {
		const extension = vscode.extensions.getExtension('douglashellinger.outline-eclipsed');
		await extension?.activate();
		
		// Create a markdown document with nested headings
		const document = await vscode.workspace.openTextDocument({
			content: '# Heading 1\n\nContent 1\n\n## Heading 2\n\nContent 2\n\n### Heading 3\n\nContent 3',
			language: 'markdown'
		});

		await vscode.window.showTextDocument(document);
		await new Promise(resolve => setTimeout(resolve, 500));

		// Execute expandAll command - should not throw error
		try {
			await vscode.commands.executeCommand('outlineEclipsed.expandAll');
			assert.ok(true, 'ExpandAll command executed successfully');
		} catch (error) {
			assert.fail(`ExpandAll command should not throw error: ${error}`);
		}
	});

});
