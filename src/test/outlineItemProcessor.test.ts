import * as assert from 'assert';
import * as vscode from 'vscode';
import { OutlineItem } from '../outlineItem';
import { OutlineItemProcessor } from '../outlineItemProcessor';

suite('OutlineItemProcessor Unit Tests', () => {
	let processor: OutlineItemProcessor;

	setup(() => {
		processor = new OutlineItemProcessor();
	});

	test('filterRedundantItems - single item returns as-is', () => {
		// GIVEN: Single item
		const item = new OutlineItem(
			'Section 1',
			1,
			new vscode.Range(0, 0, 5, 0),
			new vscode.Range(0, 0, 0, 10)
		);

		// WHEN: Filtering
		const result = processor.filterRedundantItems([item]);

		// THEN: Item should be returned
		assert.strictEqual(result.length, 1);
		assert.strictEqual(result[0], item);
	});

	test('filterRedundantItems - empty array returns empty', () => {
		// WHEN: Filtering empty array
		const result = processor.filterRedundantItems([]);

		// THEN: Should return empty
		assert.strictEqual(result.length, 0);
	});

	test('filterRedundantItems - removes child when parent selected', () => {
		// GIVEN: Parent and child items
		const parent = new OutlineItem(
			'Parent',
			1,
			new vscode.Range(0, 0, 10, 0),
			new vscode.Range(0, 0, 0, 6)
		);
		const child = new OutlineItem(
			'Child',
			2,
			new vscode.Range(2, 0, 5, 0),
			new vscode.Range(2, 0, 2, 5)
		);

		// WHEN: Filtering with both selected
		const result = processor.filterRedundantItems([parent, child]);

		// THEN: Only parent should remain
		assert.strictEqual(result.length, 1);
		assert.strictEqual(result[0], parent);
	});

	test('filterRedundantItems - keeps siblings', () => {
		// GIVEN: Two sibling items
		const sibling1 = new OutlineItem(
			'Sibling 1',
			1,
			new vscode.Range(0, 0, 5, 0),
			new vscode.Range(0, 0, 0, 9)
		);
		const sibling2 = new OutlineItem(
			'Sibling 2',
			1,
			new vscode.Range(6, 0, 10, 0),
			new vscode.Range(6, 0, 6, 9)
		);

		// WHEN: Filtering siblings
		const result = processor.filterRedundantItems([sibling1, sibling2]);

		// THEN: Both should remain
		assert.strictEqual(result.length, 2);
		assert.ok(result.includes(sibling1));
		assert.ok(result.includes(sibling2));
	});

	test('filterRedundantItems - handles multiple nested levels', () => {
		// GIVEN: Grandparent, parent, and child
		const grandparent = new OutlineItem(
			'Grandparent',
			1,
			new vscode.Range(0, 0, 20, 0),
			new vscode.Range(0, 0, 0, 11)
		);
		const parent = new OutlineItem(
			'Parent',
			2,
			new vscode.Range(2, 0, 10, 0),
			new vscode.Range(2, 0, 2, 6)
		);
		const child = new OutlineItem(
			'Child',
			3,
			new vscode.Range(4, 0, 7, 0),
			new vscode.Range(4, 0, 4, 5)
		);

		// WHEN: All three selected
		const result = processor.filterRedundantItems([grandparent, parent, child]);

		// THEN: Only grandparent remains
		assert.strictEqual(result.length, 1);
		assert.strictEqual(result[0], grandparent);
	});

	test('sortItemsByPosition - single item returns as-is', () => {
		// GIVEN: Single item
		const item = new OutlineItem(
			'Section',
			1,
			new vscode.Range(5, 0, 10, 0),
			new vscode.Range(5, 0, 5, 7)
		);

		// WHEN: Sorting
		const result = processor.sortItemsByPosition([item]);

		// THEN: Same item returned
		assert.strictEqual(result.length, 1);
		assert.strictEqual(result[0], item);
	});

	test('sortItemsByPosition - sorts by start line ascending', () => {
		// GIVEN: Items in random order
		const item1 = new OutlineItem(
			'Third',
			1,
			new vscode.Range(10, 0, 15, 0),
			new vscode.Range(10, 0, 10, 5)
		);
		const item2 = new OutlineItem(
			'First',
			1,
			new vscode.Range(0, 0, 5, 0),
			new vscode.Range(0, 0, 0, 5)
		);
		const item3 = new OutlineItem(
			'Second',
			1,
			new vscode.Range(6, 0, 9, 0),
			new vscode.Range(6, 0, 6, 6)
		);

		// WHEN: Sorting
		const result = processor.sortItemsByPosition([item1, item2, item3]);

		// THEN: Should be in document order
		assert.strictEqual(result.length, 3);
		assert.strictEqual(result[0].label, 'First');
		assert.strictEqual(result[1].label, 'Second');
		assert.strictEqual(result[2].label, 'Third');
	});

	test('sortItemsByPosition - empty array returns empty', () => {
		// WHEN: Sorting empty array
		const result = processor.sortItemsByPosition([]);

		// THEN: Should return empty
		assert.strictEqual(result.length, 0);
	});

	test('sortItemsByPosition - does not mutate input array', () => {
		// GIVEN: Items array
		const item1 = new OutlineItem(
			'Second',
			1,
			new vscode.Range(5, 0, 10, 0),
			new vscode.Range(5, 0, 5, 6)
		);
		const item2 = new OutlineItem(
			'First',
			1,
			new vscode.Range(0, 0, 4, 0),
			new vscode.Range(0, 0, 0, 5)
		);
		const original = [item1, item2];

		// WHEN: Sorting
		const result = processor.sortItemsByPosition(original);

		// THEN: Original array unchanged
		assert.strictEqual(original[0], item1);
		assert.strictEqual(original[1], item2);
		// But result is sorted
		assert.strictEqual(result[0], item2);
		assert.strictEqual(result[1], item1);
	});

	test('filterRedundantItems - does not mutate input array', () => {
		// GIVEN: Parent and child
		const parent = new OutlineItem(
			'Parent',
			1,
			new vscode.Range(0, 0, 10, 0),
			new vscode.Range(0, 0, 0, 6)
		);
		const child = new OutlineItem(
			'Child',
			2,
			new vscode.Range(2, 0, 5, 0),
			new vscode.Range(2, 0, 2, 5)
		);
		const original = [parent, child];

		// WHEN: Filtering
		const result = processor.filterRedundantItems(original);

		// THEN: Original array unchanged
		assert.strictEqual(original.length, 2);
		assert.strictEqual(result.length, 1);
	});

	test('filterRedundantItems - keeps items with identical ranges (no false positives)', () => {
		// GIVEN: Two distinct items with exactly the same range
		// This tests the fix for the original bug where >= and <= would
		// incorrectly filter both items if ranges were identical
		const itemA = new OutlineItem(
			'Item A',
			1,
			new vscode.Range(0, 0, 5, 0),
			new vscode.Range(0, 0, 0, 6)
		);
		const itemB = new OutlineItem(
			'Item B',
			1,
			new vscode.Range(0, 0, 5, 0), // Same range as itemA
			new vscode.Range(0, 0, 0, 6)
		);

		// WHEN: Filtering items with identical ranges
		const result = processor.filterRedundantItems([itemA, itemB]);

		// THEN: Both items should be kept since neither strictly contains the other
		// (identical ranges means neither is a proper subset of the other)
		assert.strictEqual(result.length, 2, 'Both items should be kept');
		assert.ok(result.includes(itemA), 'Item A should be in result');
		assert.ok(result.includes(itemB), 'Item B should be in result');
	});

	test('filterRedundantItems - handles strictly contained items correctly', () => {
		// GIVEN: Parent contains child (proper containment, not identical ranges)
		const parent = new OutlineItem(
			'Parent',
			1,
			new vscode.Range(0, 0, 10, 0),  // Lines 0-10
			new vscode.Range(0, 0, 0, 6)
		);
		const child = new OutlineItem(
			'Child',
			2,
			new vscode.Range(2, 0, 8, 0),  // Lines 2-8 (strictly within 0-10)
			new vscode.Range(2, 0, 2, 5)
		);

		// WHEN: Filtering
		const result = processor.filterRedundantItems([parent, child]);

		// THEN: Child should be filtered out (it's strictly contained in parent)
		assert.strictEqual(result.length, 1, 'Child should be filtered out');
		assert.strictEqual(result[0], parent, 'Parent should remain');
	});
});
