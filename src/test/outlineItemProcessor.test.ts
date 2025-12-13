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

	suite('PI-12: findPrecedingItem', () => {
		test('Returns undefined when selectedItems is empty', () => {
			// GIVEN: List of items but no selection
			const items = [
				new OutlineItem('Item 1', 1, new vscode.Range(0, 0, 5, 0), new vscode.Range(0, 0, 0, 6)),
				new OutlineItem('Item 2', 1, new vscode.Range(6, 0, 10, 0), new vscode.Range(6, 0, 6, 6))
			];

			// WHEN: Finding preceding item with empty selection
			const result = processor.findPrecedingItem(items, []);

			// THEN: Should return undefined
			assert.strictEqual(result, undefined, 'Should return undefined for empty selection');
		});

		test('Returns undefined when allItems is empty', () => {
			// GIVEN: Selection but no items in document
			const selected = [
				new OutlineItem('Item 1', 1, new vscode.Range(0, 0, 5, 0), new vscode.Range(0, 0, 0, 6))
			];

			// WHEN: Finding preceding item with empty allItems
			const result = processor.findPrecedingItem([], selected);

			// THEN: Should return undefined
			assert.strictEqual(result, undefined, 'Should return undefined for empty allItems');
		});

		test('Returns undefined when first item is selected', () => {
			// GIVEN: First item is selected
			const item1 = new OutlineItem('Item 1', 1, new vscode.Range(0, 0, 5, 0), new vscode.Range(0, 0, 0, 6));
			const item2 = new OutlineItem('Item 2', 1, new vscode.Range(6, 0, 10, 0), new vscode.Range(6, 0, 6, 6));
			const allItems = [item1, item2];

			// WHEN: Finding preceding for first item
			const result = processor.findPrecedingItem(allItems, [item1]);

			// THEN: Should return undefined (already at document start)
			assert.strictEqual(result, undefined, 'Should return undefined when first item selected');
		});

		test('Returns preceding item for single selection', () => {
			// GIVEN: Three items, second is selected
			const item1 = new OutlineItem('Item 1', 1, new vscode.Range(0, 0, 5, 0), new vscode.Range(0, 0, 0, 6));
			const item2 = new OutlineItem('Item 2', 1, new vscode.Range(6, 0, 10, 0), new vscode.Range(6, 0, 6, 6));
			const item3 = new OutlineItem('Item 3', 1, new vscode.Range(11, 0, 15, 0), new vscode.Range(11, 0, 11, 6));
			const allItems = [item1, item2, item3];

			// WHEN: Finding preceding for item2
			const result = processor.findPrecedingItem(allItems, [item2]);

			// THEN: Should return item1
			assert.strictEqual(result, item1, 'Should return item1 as preceding item');
		});

		test('Returns preceding item for multi-select (uses first selected)', () => {
			// GIVEN: Five items, items 2 and 4 are selected
			const item1 = new OutlineItem('Item 1', 1, new vscode.Range(0, 0, 5, 0), new vscode.Range(0, 0, 0, 6));
			const item2 = new OutlineItem('Item 2', 1, new vscode.Range(6, 0, 10, 0), new vscode.Range(6, 0, 6, 6));
			const item3 = new OutlineItem('Item 3', 1, new vscode.Range(11, 0, 15, 0), new vscode.Range(11, 0, 11, 6));
			const item4 = new OutlineItem('Item 4', 1, new vscode.Range(16, 0, 20, 0), new vscode.Range(16, 0, 16, 6));
			const item5 = new OutlineItem('Item 5', 1, new vscode.Range(21, 0, 25, 0), new vscode.Range(21, 0, 21, 6));
			const allItems = [item1, item2, item3, item4, item5];

			// WHEN: Finding preceding for items 2 and 4 (non-contiguous)
			const result = processor.findPrecedingItem(allItems, [item2, item4]);

			// THEN: Should return item1 (preceding the FIRST selected item)
			assert.strictEqual(result, item1, 'Should return item preceding first selected item');
		});

		test('Handles unsorted selection correctly', () => {
			// GIVEN: Three items, selection in reverse order
			const item1 = new OutlineItem('Item 1', 1, new vscode.Range(0, 0, 5, 0), new vscode.Range(0, 0, 0, 6));
			const item2 = new OutlineItem('Item 2', 1, new vscode.Range(6, 0, 10, 0), new vscode.Range(6, 0, 6, 6));
			const item3 = new OutlineItem('Item 3', 1, new vscode.Range(11, 0, 15, 0), new vscode.Range(11, 0, 11, 6));
			const allItems = [item1, item2, item3];

			// WHEN: Finding preceding with selection in reverse order [item3, item2]
			const result = processor.findPrecedingItem(allItems, [item3, item2]);

			// THEN: Should still return item1 (preceding the first in document order)
			assert.strictEqual(result, item1, 'Should sort selection and return preceding for first item');
		});
	});

	suite('PI-12: findFollowingItem', () => {
		test('Returns undefined when selectedItems is empty', () => {
			// GIVEN: List of items but no selection
			const items = [
				new OutlineItem('Item 1', 1, new vscode.Range(0, 0, 5, 0), new vscode.Range(0, 0, 0, 6)),
				new OutlineItem('Item 2', 1, new vscode.Range(6, 0, 10, 0), new vscode.Range(6, 0, 6, 6))
			];

			// WHEN: Finding following item with empty selection
			const result = processor.findFollowingItem(items, []);

			// THEN: Should return undefined
			assert.strictEqual(result, undefined, 'Should return undefined for empty selection');
		});

		test('Returns undefined when allItems is empty', () => {
			// GIVEN: Selection but no items in document
			const selected = [
				new OutlineItem('Item 1', 1, new vscode.Range(0, 0, 5, 0), new vscode.Range(0, 0, 0, 6))
			];

			// WHEN: Finding following item with empty allItems
			const result = processor.findFollowingItem([], selected);

			// THEN: Should return undefined
			assert.strictEqual(result, undefined, 'Should return undefined for empty allItems');
		});

		test('Returns undefined when last item is selected', () => {
			// GIVEN: Last item is selected
			const item1 = new OutlineItem('Item 1', 1, new vscode.Range(0, 0, 5, 0), new vscode.Range(0, 0, 0, 6));
			const item2 = new OutlineItem('Item 2', 1, new vscode.Range(6, 0, 10, 0), new vscode.Range(6, 0, 6, 6));
			const allItems = [item1, item2];

			// WHEN: Finding following for last item
			const result = processor.findFollowingItem(allItems, [item2]);

			// THEN: Should return undefined (already at document end)
			assert.strictEqual(result, undefined, 'Should return undefined when last item selected');
		});

		test('Returns following item for single selection', () => {
			// GIVEN: Three items, second is selected
			const item1 = new OutlineItem('Item 1', 1, new vscode.Range(0, 0, 5, 0), new vscode.Range(0, 0, 0, 6));
			const item2 = new OutlineItem('Item 2', 1, new vscode.Range(6, 0, 10, 0), new vscode.Range(6, 0, 6, 6));
			const item3 = new OutlineItem('Item 3', 1, new vscode.Range(11, 0, 15, 0), new vscode.Range(11, 0, 11, 6));
			const allItems = [item1, item2, item3];

			// WHEN: Finding following for item2
			const result = processor.findFollowingItem(allItems, [item2]);

			// THEN: Should return item3
			assert.strictEqual(result, item3, 'Should return item3 as following item');
		});

		test('Returns following item for multi-select (uses last selected)', () => {
			// GIVEN: Five items, items 2 and 4 are selected
			const item1 = new OutlineItem('Item 1', 1, new vscode.Range(0, 0, 5, 0), new vscode.Range(0, 0, 0, 6));
			const item2 = new OutlineItem('Item 2', 1, new vscode.Range(6, 0, 10, 0), new vscode.Range(6, 0, 6, 6));
			const item3 = new OutlineItem('Item 3', 1, new vscode.Range(11, 0, 15, 0), new vscode.Range(11, 0, 11, 6));
			const item4 = new OutlineItem('Item 4', 1, new vscode.Range(16, 0, 20, 0), new vscode.Range(16, 0, 16, 6));
			const item5 = new OutlineItem('Item 5', 1, new vscode.Range(21, 0, 25, 0), new vscode.Range(21, 0, 21, 6));
			const allItems = [item1, item2, item3, item4, item5];

			// WHEN: Finding following for items 2 and 4 (non-contiguous)
			const result = processor.findFollowingItem(allItems, [item2, item4]);

			// THEN: Should return item5 (following the LAST selected item)
			assert.strictEqual(result, item5, 'Should return item following last selected item');
		});

		test('Handles unsorted selection correctly', () => {
			// GIVEN: Three items, selection in reverse order
			const item1 = new OutlineItem('Item 1', 1, new vscode.Range(0, 0, 5, 0), new vscode.Range(0, 0, 0, 6));
			const item2 = new OutlineItem('Item 2', 1, new vscode.Range(6, 0, 10, 0), new vscode.Range(6, 0, 6, 6));
			const item3 = new OutlineItem('Item 3', 1, new vscode.Range(11, 0, 15, 0), new vscode.Range(11, 0, 11, 6));
			const allItems = [item1, item2, item3];

			// WHEN: Finding following with selection in reverse order [item2, item1]
			const result = processor.findFollowingItem(allItems, [item2, item1]);

			// THEN: Should still return item3 (following the last in document order)
			assert.strictEqual(result, item3, 'Should sort selection and return following for last item');
		});

		test('Skips children when finding following item', () => {
			// GIVEN: Parent with child, and a sibling after
			const parent = new OutlineItem('Parent', 1, new vscode.Range(0, 0, 10, 0), new vscode.Range(0, 0, 0, 6));
			const child = new OutlineItem('Child', 2, new vscode.Range(2, 0, 5, 0), new vscode.Range(2, 0, 2, 5));
			const sibling = new OutlineItem('Sibling', 1, new vscode.Range(11, 0, 15, 0), new vscode.Range(11, 0, 11, 7));
			const allItems = [parent, child, sibling];

			// WHEN: Finding following for parent
			const result = processor.findFollowingItem(allItems, [parent]);

			// THEN: Should return sibling (skip child which is contained in parent's range)
			assert.strictEqual(result, sibling, 'Should skip child and return sibling');
		});

		test('Returns undefined when only children remain after selected item', () => {
			// GIVEN: Parent with child, but no siblings after
			const parent = new OutlineItem('Parent', 1, new vscode.Range(0, 0, 10, 0), new vscode.Range(0, 0, 0, 6));
			const child = new OutlineItem('Child', 2, new vscode.Range(2, 0, 5, 0), new vscode.Range(2, 0, 2, 5));
			const allItems = [parent, child];

			// WHEN: Finding following for parent
			const result = processor.findFollowingItem(allItems, [parent]);

			// THEN: Should return undefined (only child remains, no true following item)
			assert.strictEqual(result, undefined, 'Should return undefined when only children remain');
		});
	});
});
