import * as assert from 'assert';
import * as vscode from 'vscode';
import { OutlineItem } from '../outlineItem';
import { OutlineTransfer } from '../outlineTransfer';

suite('OutlineTransfer Unit Tests', () => {
	let transfer: OutlineTransfer;

	setup(() => {
		transfer = new OutlineTransfer();
	});

	test('MIME type is correct', () => {
		assert.strictEqual(transfer.mimeType, 'application/vnd.code.tree.outlineeclipsed');
	});

	test('serialize - single item round trip', () => {
		// GIVEN: Single outline item
		const item = new OutlineItem(
			'Section 1',
			1,
			new vscode.Range(0, 0, 5, 10),
			new vscode.Range(0, 0, 0, 9)
		);

		// WHEN: Serializing and deserializing
		const json = transfer.serialize([item]);
		const result = transfer.deserialize(json);

		// THEN: Data should be preserved
		assert.strictEqual(result.length, 1);
		assert.strictEqual(result[0].label, 'Section 1');
		assert.strictEqual(result[0].level, 1);
		assert.strictEqual(result[0].range.start.line, 0);
		assert.strictEqual(result[0].range.start.character, 0);
		assert.strictEqual(result[0].range.end.line, 5);
		assert.strictEqual(result[0].range.end.character, 10);
	});

	test('serialize - multiple items round trip', () => {
		// GIVEN: Multiple outline items
		const items = [
			new OutlineItem(
				'Section 1',
				1,
				new vscode.Range(0, 0, 5, 10),
				new vscode.Range(0, 0, 0, 9)
			),
			new OutlineItem(
				'Section 2',
				2,
				new vscode.Range(6, 0, 10, 20),
				new vscode.Range(6, 0, 6, 9)
			)
		];

		// WHEN: Serializing and deserializing
		const json = transfer.serialize(items);
		const result = transfer.deserialize(json);

		// THEN: All data should be preserved
		assert.strictEqual(result.length, 2);
		assert.strictEqual(result[0].label, 'Section 1');
		assert.strictEqual(result[1].label, 'Section 2');
		assert.strictEqual(result[0].level, 1);
		assert.strictEqual(result[1].level, 2);
	});

	test('serialize - produces valid JSON', () => {
		// GIVEN: Outline item
		const item = new OutlineItem(
			'Test',
			1,
			new vscode.Range(0, 0, 1, 5),
			new vscode.Range(0, 0, 0, 4)
		);

		// WHEN: Serializing
		const json = transfer.serialize([item]);

		// THEN: Should be parseable JSON
		assert.doesNotThrow(() => JSON.parse(json));
	});

	test('serialize - empty array produces empty JSON array', () => {
		// WHEN: Serializing empty array
		const json = transfer.serialize([]);

		// THEN: Should be empty JSON array
		const parsed = JSON.parse(json);
		assert.ok(Array.isArray(parsed));
		assert.strictEqual(parsed.length, 0);
	});

	test('deserialize - preserves range precision', () => {
		// GIVEN: Item with specific character positions
		const item = new OutlineItem(
			'Precise',
			1,
			new vscode.Range(5, 12, 10, 25),
			new vscode.Range(5, 12, 5, 19)
		);

		// WHEN: Round trip
		const json = transfer.serialize([item]);
		const result = transfer.deserialize(json);

		// THEN: Character positions preserved
		assert.strictEqual(result[0].range.start.line, 5);
		assert.strictEqual(result[0].range.start.character, 12);
		assert.strictEqual(result[0].range.end.line, 10);
		assert.strictEqual(result[0].range.end.character, 25);
	});

	test('deserialize - creates proper Range objects', () => {
		// GIVEN: Serialized item
		const item = new OutlineItem(
			'Test',
			1,
			new vscode.Range(0, 0, 1, 5),
			new vscode.Range(0, 0, 0, 4)
		);
		const json = transfer.serialize([item]);

		// WHEN: Deserializing
		const result = transfer.deserialize(json);

		// THEN: Range should be vscode.Range instance
		assert.ok(result[0].range instanceof vscode.Range);
		assert.ok(result[0].range.start instanceof vscode.Position);
		assert.ok(result[0].range.end instanceof vscode.Position);
	});

	test('deserialize - handles special characters in labels', () => {
		// GIVEN: Item with special characters
		const item = new OutlineItem(
			'Test "quotes" & <special>',
			1,
			new vscode.Range(0, 0, 1, 5),
			new vscode.Range(0, 0, 0, 25)
		);

		// WHEN: Round trip
		const json = transfer.serialize([item]);
		const result = transfer.deserialize(json);

		// THEN: Special characters preserved
		assert.strictEqual(result[0].label, 'Test "quotes" & <special>');
	});

	test('deserialize - throws on invalid JSON', () => {
		// GIVEN: Invalid JSON
		const invalidJson = '{invalid json';

		// WHEN/THEN: Should throw
		assert.throws(() => transfer.deserialize(invalidJson));
	});

	test('serialize - includes level information', () => {
		// GIVEN: Items with different levels
		const items = [
			new OutlineItem('H1', 1, new vscode.Range(0, 0, 1, 0), new vscode.Range(0, 0, 0, 2)),
			new OutlineItem('H2', 2, new vscode.Range(2, 0, 3, 0), new vscode.Range(2, 0, 2, 2)),
			new OutlineItem('H3', 3, new vscode.Range(4, 0, 5, 0), new vscode.Range(4, 0, 4, 2))
		];

		// WHEN: Serializing
		const json = transfer.serialize(items);
		const parsed = JSON.parse(json);

		// THEN: Levels should be in JSON
		assert.strictEqual(parsed[0].level, 1);
		assert.strictEqual(parsed[1].level, 2);
		assert.strictEqual(parsed[2].level, 3);
	});
});
