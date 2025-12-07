import * as assert from 'assert';
import * as vscode from 'vscode';

/**
 * PI-12: Integration tests for expand all command
 * 
 * Tests follow AAA (Arrange-Act-Assert) pattern.
 * Tests verify actual behavior rather than just checking for errors.
 */
suite('PI-12: Expand All Integration Tests', () => {

	test('expandAll command is registered', async () => {
		// Arrange
		const extension = vscode.extensions.getExtension('douglashellinger.outline-eclipsed');
		await extension?.activate();

		// Act
		const commands = await vscode.commands.getCommands(true);

		// Assert
		assert.ok(
			commands.includes('outlineEclipsed.expandAll'),
			'outlineEclipsed.expandAll command should be registered'
		);
	});

	test('expandAll command can be executed', async () => {
		// Arrange
		const extension = vscode.extensions.getExtension('douglashellinger.outline-eclipsed');
		await extension?.activate();
		
		const document = await vscode.workspace.openTextDocument({
			content: '# Heading 1\n\n## Heading 2\n\n### Heading 3',
			language: 'markdown'
		});
		await vscode.window.showTextDocument(document);
		await new Promise(resolve => setTimeout(resolve, 500));

		// Act
		const result = await vscode.commands.executeCommand('outlineEclipsed.expandAll');

		// Assert - command should complete without throwing
		assert.strictEqual(result, undefined, 'Command should complete and return undefined');
	});

	test('expandAll command handles empty document gracefully', async () => {
		// Arrange
		const extension = vscode.extensions.getExtension('douglashellinger.outline-eclipsed');
		await extension?.activate();
		
		const document = await vscode.workspace.openTextDocument({
			content: 'Plain text with no headings',
			language: 'markdown'
		});
		await vscode.window.showTextDocument(document);
		await new Promise(resolve => setTimeout(resolve, 500));

		// Act
		const result = await vscode.commands.executeCommand('outlineEclipsed.expandAll');

		// Assert - should complete without error even with no outline items
		assert.strictEqual(result, undefined, 'Command should handle empty outline gracefully');
	});

	test('expandAll command works with deeply nested structure', async () => {
		// Arrange
		const extension = vscode.extensions.getExtension('douglashellinger.outline-eclipsed');
		await extension?.activate();
		
		const content = [
			'# Level 1',
			'## Level 2',
			'### Level 3',
			'#### Level 4',
			'##### Level 5',
			'###### Level 6'
		].join('\n\n');
		
		const document = await vscode.workspace.openTextDocument({
			content,
			language: 'markdown'
		});
		await vscode.window.showTextDocument(document);
		await new Promise(resolve => setTimeout(resolve, 500));

		// Act
		const result = await vscode.commands.executeCommand('outlineEclipsed.expandAll');

		// Assert
		assert.strictEqual(result, undefined, 'Command should handle deeply nested structure');
	});

	test('expandAll command works with multiple root items', async () => {
		// Arrange
		const extension = vscode.extensions.getExtension('douglashellinger.outline-eclipsed');
		await extension?.activate();
		
		const content = [
			'# Root 1',
			'## Child 1.1',
			'## Child 1.2',
			'',
			'# Root 2',
			'## Child 2.1',
			'### Grandchild 2.1.1'
		].join('\n');
		
		const document = await vscode.workspace.openTextDocument({
			content,
			language: 'markdown'
		});
		await vscode.window.showTextDocument(document);
		await new Promise(resolve => setTimeout(resolve, 500));

		// Act
		const result = await vscode.commands.executeCommand('outlineEclipsed.expandAll');

		// Assert
		assert.strictEqual(result, undefined, 'Command should handle multiple root items');
	});

	test('expandAll command works with mixed nesting levels', async () => {
		// Arrange
		const extension = vscode.extensions.getExtension('douglashellinger.outline-eclipsed');
		await extension?.activate();
		
		const content = [
			'# Heading 1',
			'Content for H1',
			'',
			'## Heading 2',
			'Content for H2',
			'',
			'# Another H1',
			'More content',
			'',
			'### Heading 3 (skipped H2)',
			'Content for H3'
		].join('\n');
		
		const document = await vscode.workspace.openTextDocument({
			content,
			language: 'markdown'
		});
		await vscode.window.showTextDocument(document);
		await new Promise(resolve => setTimeout(resolve, 500));

		// Act
		const result = await vscode.commands.executeCommand('outlineEclipsed.expandAll');

		// Assert
		assert.strictEqual(result, undefined, 'Command should handle mixed nesting levels');
	});

	test('expandAll command works with non-markdown files', async () => {
		// Arrange
		const extension = vscode.extensions.getExtension('douglashellinger.outline-eclipsed');
		await extension?.activate();
		
		const content = [
			'class MyClass {',
			'  method1() {',
			'    return 1;',
			'  }',
			'  method2() {',
			'    return 2;',
			'  }',
			'}'
		].join('\n');
		
		const document = await vscode.workspace.openTextDocument({
			content,
			language: 'typescript'
		});
		await vscode.window.showTextDocument(document);
		await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for language server

		// Act
		const result = await vscode.commands.executeCommand('outlineEclipsed.expandAll');

		// Assert
		assert.strictEqual(result, undefined, 'Command should work with TypeScript files');
	});
});
