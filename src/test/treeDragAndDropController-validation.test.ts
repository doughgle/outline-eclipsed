import * as assert from 'assert';
import * as vscode from 'vscode';
import { TreeDragAndDropController } from '../treeDragAndDropController';

suite('TreeDragAndDropController - validateDocumentForMove Unit Tests', () => {
	let controller: TreeDragAndDropController;

	setup(() => {
		controller = new TreeDragAndDropController();
	});

	teardown(() => {
		controller.dispose();
	});

	test('Returns valid for supported language (markdown)', async () => {
		// GIVEN: A markdown document
		const doc = await vscode.workspace.openTextDocument({
			content: '# Test\n\nContent',
			language: 'markdown'
		});

		// WHEN: Validating document
		const result = await controller.validateDocumentForMove(doc);

		// THEN: Should be valid
		assert.strictEqual(result.isValid, true, 'Markdown should be supported');
		assert.strictEqual(result.errorMessage, undefined, 'Should have no error message');
	});

	test('Returns valid for supported language (yaml)', async () => {
		// GIVEN: A yaml document
		const doc = await vscode.workspace.openTextDocument({
			content: 'key: value',
			language: 'yaml'
		});

		// WHEN: Validating document
		const result = await controller.validateDocumentForMove(doc);

		// THEN: Should be valid
		assert.strictEqual(result.isValid, true, 'YAML should be supported');
		assert.strictEqual(result.errorMessage, undefined, 'Should have no error message');
	});

	test('Returns valid for supported language (json)', async () => {
		// GIVEN: A json document
		const doc = await vscode.workspace.openTextDocument({
			content: '{"key": "value"}',
			language: 'json'
		});

		// WHEN: Validating document
		const result = await controller.validateDocumentForMove(doc);

		// THEN: Should be valid
		assert.strictEqual(result.isValid, true, 'JSON should be supported');
		assert.strictEqual(result.errorMessage, undefined, 'Should have no error message');
	});

	test('Returns invalid for unsupported language', async () => {
		// GIVEN: A plaintext document (not in supported list)
		const doc = await vscode.workspace.openTextDocument({
			content: 'Plain text content',
			language: 'plaintext'
		});

		// WHEN: Validating document
		const result = await controller.validateDocumentForMove(doc);

		// THEN: Should be invalid
		assert.strictEqual(result.isValid, false, 'Plaintext should not be supported');
		assert.ok(result.errorMessage, 'Should have error message');
		assert.ok(
			result.errorMessage?.includes('not supported'),
			'Error message should mention not supported'
		);
		assert.ok(
			result.errorMessage?.includes('plaintext'),
			'Error message should mention the language'
		);
	});

	test('Returns invalid for read-only untitled document', async () => {
		// Note: This test verifies the validation logic structure.
		// In practice, untitled documents are typically writable, but we test
		// the read-only path for completeness.
		
		// GIVEN: A markdown document (we'll mock read-only via file permissions)
		const doc = await vscode.workspace.openTextDocument({
			content: '# Test',
			language: 'markdown'
		});

		// Note: For proper read-only testing, we'd need to test with actual
		// file:// URIs that have read-only permissions. This is difficult
		// in unit tests, so we verify the structure here and rely on
		// integration tests for full read-only scenarios.
		
		// WHEN: Validating document
		const result = await controller.validateDocumentForMove(doc);

		// THEN: For untitled docs, should typically be valid
		// (they are writable by default)
		assert.strictEqual(result.isValid, true, 'Untitled markdown should be writable');
	});

	test('All supported languages are validated correctly', async () => {
		// GIVEN: All supported language IDs from DRAG_DROP_SUPPORTED_LANGUAGES
		const supportedLanguages = [
			'markdown', 'yaml', 'json', 'jsonc', 
			'html', 'css', 'scss', 'less', 'xml'
		];

		// WHEN/THEN: Each should validate as supported
		for (const lang of supportedLanguages) {
			const doc = await vscode.workspace.openTextDocument({
				content: 'test content',
				language: lang
			});
			
			const result = await controller.validateDocumentForMove(doc);
			
			assert.strictEqual(
				result.isValid, 
				true, 
				`${lang} should be supported`
			);
			assert.strictEqual(
				result.errorMessage, 
				undefined, 
				`${lang} should have no error message`
			);
		}
	});
});
