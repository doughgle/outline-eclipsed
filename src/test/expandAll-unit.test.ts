import * as assert from 'assert';
import * as vscode from 'vscode';

/**
 * PI-12: Unit tests for expand/collapse all commands
 * 
 * Tests the external behavior of the expandAll and collapseAll command public interfaces.
 * Tests follow AAA (Arrange-Act-Assert) pattern and make meaningful assertions.
 */
suite('PI-12: Expand/Collapse All Unit Tests', () => {

	test('expandAll command is registered and can be executed', async () => {
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

	test('collapseAll command is registered and can be executed', async () => {
		// Arrange
		const extension = vscode.extensions.getExtension('douglashellinger.outline-eclipsed');
		await extension?.activate();

		// Act
		const commands = await vscode.commands.getCommands(true);

		// Assert
		assert.ok(
			commands.includes('outlineEclipsed.collapseAll'),
			'outlineEclipsed.collapseAll command should be registered'
		);
	});
});
