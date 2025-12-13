import * as assert from 'assert';
import * as vscode from 'vscode';
import { OutlineItem } from '../outlineItem';

suite('PI-12: Keyboard Shortcuts Integration Tests', () => {
	
	// Wait for extension to activate before running tests
	suiteSetup(async () => {
		const ext = vscode.extensions.getExtension('doughgle.outline-eclipsed');
		if (ext && !ext.isActive) {
			await ext.activate();
		}
		// Give commands time to register
		await new Promise(resolve => setTimeout(resolve, 100));
	});
	
	test('moveUp command can be executed', async () => {
		// WHEN: Trying to execute the command
		try {
			await vscode.commands.executeCommand('outlineEclipsed.moveUp');
			// THEN: Should not throw error
			assert.ok(true, 'Command executed without error');
		} catch (error) {
			assert.fail(`Command should be registered and executable: ${error}`);
		}
	});

	test('moveDown command can be executed', async () => {
		// WHEN: Trying to execute the command
		try {
			await vscode.commands.executeCommand('outlineEclipsed.moveDown');
			// THEN: Should not throw error
			assert.ok(true, 'Command executed without error');
		} catch (error) {
			assert.fail(`Command should be registered and executable: ${error}`);
		}
	});

	test('moveUp command handles no active editor gracefully', async () => {
		// GIVEN: Close all editors
		await vscode.commands.executeCommand('workbench.action.closeAllEditors');

		// WHEN: Executing moveUp with no editor
		const result = await vscode.commands.executeCommand('outlineEclipsed.moveUp');

		// THEN: Should not throw error, should return undefined
		assert.strictEqual(result, undefined, 'Should handle no editor gracefully');
	});

	test('moveDown command handles no active editor gracefully', async () => {
		// GIVEN: Close all editors
		await vscode.commands.executeCommand('workbench.action.closeAllEditors');

		// WHEN: Executing moveDown with no editor
		const result = await vscode.commands.executeCommand('outlineEclipsed.moveDown');

		// THEN: Should not throw error, should return undefined
		assert.strictEqual(result, undefined, 'Should handle no editor gracefully');
	});

	test('moveUp command handles unsupported language', async () => {
		// GIVEN: A plaintext document (unsupported)
		const doc = await vscode.workspace.openTextDocument({
			content: 'Line 1\nLine 2\nLine 3',
			language: 'plaintext'
		});
		await vscode.window.showTextDocument(doc);

		// WHEN: Executing moveUp
		// Note: This will show a warning to user, but shouldn't throw
		const result = await vscode.commands.executeCommand('outlineEclipsed.moveUp');

		// THEN: Should return undefined (no-op)
		assert.strictEqual(result, undefined, 'Should handle unsupported language');
	});

	test('moveDown command handles unsupported language', async () => {
		// GIVEN: A plaintext document (unsupported)
		const doc = await vscode.workspace.openTextDocument({
			content: 'Line 1\nLine 2\nLine 3',
			language: 'plaintext'
		});
		await vscode.window.showTextDocument(doc);

		// WHEN: Executing moveDown
		const result = await vscode.commands.executeCommand('outlineEclipsed.moveDown');

		// THEN: Should return undefined (no-op)
		assert.strictEqual(result, undefined, 'Should handle unsupported language');
	});

	test('moveUp with markdown document and tree selection', async () => {
		// GIVEN: A markdown document with multiple sections
		const content = `# Section 1
Content for section 1.

# Section 2
Content for section 2.

# Section 3
Content for section 3.`;

		const doc = await vscode.workspace.openTextDocument({
			content: content,
			language: 'markdown'
		});
		const editor = await vscode.window.showTextDocument(doc);

		// Wait for outline to be ready
		await new Promise(resolve => setTimeout(resolve, 500));

		// Note: Actual tree selection manipulation requires the tree view to be visible
		// and is difficult to test programmatically. This test verifies command execution
		// completes without error when no tree selection exists (boundary condition).
		
		// WHEN: Executing moveUp (with no tree selection)
		const result = await vscode.commands.executeCommand('outlineEclipsed.moveUp');

		// THEN: Should return undefined (no-op when no selection)
		assert.strictEqual(result, undefined, 'Should handle no tree selection');
	});

	test('moveDown with markdown document and tree selection', async () => {
		// GIVEN: A markdown document with multiple sections
		const content = `# Section A
Content for section A.

# Section B
Content for section B.`;

		const doc = await vscode.workspace.openTextDocument({
			content: content,
			language: 'markdown'
		});
		const editor = await vscode.window.showTextDocument(doc);

		// Wait for outline to be ready
		await new Promise(resolve => setTimeout(resolve, 500));

		// WHEN: Executing moveDown (with no tree selection)
		const result = await vscode.commands.executeCommand('outlineEclipsed.moveDown');

		// THEN: Should return undefined (no-op when no selection)
		assert.strictEqual(result, undefined, 'Should handle no tree selection');
	});

	// Note: Full end-to-end tests with actual tree selection and content verification
	// are better suited for manual testing using keyboard-move-test.md fixture.
	// These integration tests verify command registration and error handling paths.
});
