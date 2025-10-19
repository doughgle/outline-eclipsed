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
