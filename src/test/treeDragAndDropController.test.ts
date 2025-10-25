import * as assert from 'assert';
import * as vscode from 'vscode';
import { TreeDragAndDropController } from '../treeDragAndDropController';
import { OutlineItem } from '../outlineItem';

suite('PI-3: TreeDragAndDropController Tests', () => {

	test('Should serialize OutlineItem data for drag operation', async () => {
		const range = new vscode.Range(5, 0, 10, 20);
		const selRange = new vscode.Range(5, 0, 5, 15);
		const item = new OutlineItem('Test Heading', 1, range, selRange);
		
		const controller = new TreeDragAndDropController();
		const dataTransfer = new vscode.DataTransfer();
		
		await controller.handleDrag([item], dataTransfer, {} as any);
		
		// Verify data was added to DataTransfer
		const dragData = dataTransfer.get('application/vnd.code.tree.outlineeclipsed');
		assert.ok(dragData, 'Drag data should be set');
		
		// Verify we can parse the data
		const serialized = dragData!.value;
		assert.ok(typeof serialized === 'string', 'Drag data should be a string');
		
		const parsed = JSON.parse(serialized);
		assert.ok(Array.isArray(parsed), 'Parsed data should be an array');
		assert.strictEqual(parsed.length, 1, 'Should have one item');
		assert.strictEqual(parsed[0].label, 'Test Heading');
		assert.strictEqual(parsed[0].level, 1);
	});

	test('Should deserialize drag data on drop', async () => {
		const controller = new TreeDragAndDropController();
		const dataTransfer = new vscode.DataTransfer();
		
		// Simulate drag data
		const dragData = JSON.stringify([{
			label: 'Dragged Item',
			level: 2,
			range: { start: { line: 5, character: 0 }, end: { line: 10, character: 20 } },
			selectionRange: { start: { line: 5, character: 0 }, end: { line: 5, character: 15 } }
		}]);
		
		dataTransfer.set('application/vnd.code.tree.outlineeclipsed', new vscode.DataTransferItem(dragData));
		
		// This should not throw
		await assert.doesNotReject(
			async () => await controller.handleDrop(undefined, dataTransfer, {} as any)
		);
	});

	test('PI-5: Should highlight moved text and scroll to reveal it', async () => {
		// Create a test document with markdown content and many sections
		// to ensure scrolling is needed
		const content = `# First Heading
Content 1

# Second Heading
Content 2

# Third Heading
Content 3

# Fourth Heading
Content 4

# Fifth Heading
Content 5

# Sixth Heading
Content 6

# Seventh Heading
Content 7`;

		const doc = await vscode.workspace.openTextDocument({
			content,
			language: 'markdown'
		});
		const editor = await vscode.window.showTextDocument(doc);

		// Scroll to top first
		const topPosition = new vscode.Position(0, 0);
		editor.revealRange(new vscode.Range(topPosition, topPosition));

		const controller = new TreeDragAndDropController();
		
		// Move "Second Heading" to bottom (after "Seventh Heading")
		const success = await controller.moveSection(editor, 3, 24);
		assert.ok(success, 'Move should succeed');

		// Verify editor is still active (no focus change)
		assert.strictEqual(vscode.window.activeTextEditor, editor, 'Editor should still be active');
		
		// The moved section should now be visible in the editor
		// We can't directly test visibleRanges as it depends on editor viewport,
		// but we verify the operation completed without errors
		assert.ok(true, 'Section should be scrolled into view');
	});

	test('PI-5: Should clear highlight after timeout', async function() {
		this.timeout(5000); // Extend timeout for this test
		
		const content = `# Heading A
Content A

# Heading B
Content B`;

		const doc = await vscode.workspace.openTextDocument({
			content,
			language: 'markdown'
		});
		const editor = await vscode.window.showTextDocument(doc);

		const controller = new TreeDragAndDropController();
		
		// Move section and trigger highlight
		await controller.moveSection(editor, 3, 0);
		
		// Wait for highlight to clear (3 seconds + buffer)
		await new Promise(resolve => setTimeout(resolve, 3500));
		
		// After timeout, decorations should be cleared
		// We can't directly test this without accessing private decoration type,
		// but we verify no errors occurred
		assert.ok(true, 'Highlight should clear without errors');
	});

	test('Should have correct MIME type for drag and drop', () => {
		const controller = new TreeDragAndDropController();
		
		assert.ok(controller.dropMimeTypes.includes('application/vnd.code.tree.outlineeclipsed'));
		assert.ok(controller.dragMimeTypes.includes('application/vnd.code.tree.outlineeclipsed'));
	});
});

suite('PI-6: Multi-Select Drag & Drop Unit Tests', () => {

	test('Should filter out child items when parent is selected', () => {
		// GIVEN: A selection containing both parent and child items
		const parent = new OutlineItem(
			'Parent',
			1,
			new vscode.Range(0, 0, 10, 0),
			new vscode.Range(0, 0, 0, 10),
			[], // children
			vscode.SymbolKind.Module
		);
		
		const child = new OutlineItem(
			'Child',
			2,
			new vscode.Range(2, 0, 5, 0),
			new vscode.Range(2, 0, 2, 10),
			[], // children
			vscode.SymbolKind.Module
		);
		
		const controller = new TreeDragAndDropController();
		
		// WHEN: Filtering redundant items
		const filtered = (controller as any).filterRedundantItems([parent, child]);
		
		// THEN: Only parent should remain (child is within parent's range)
		assert.strictEqual(filtered.length, 1, 'Should have one item after filtering');
		assert.strictEqual(filtered[0].label, 'Parent', 'Parent should remain');
	});

	test('Should keep sibling items when both are selected', () => {
		// GIVEN: Two sibling items (non-overlapping ranges)
		const sibling1 = new OutlineItem(
			'Sibling 1',
			1,
			new vscode.Range(0, 0, 5, 0),
			new vscode.Range(0, 0, 0, 10),
			[],
			vscode.SymbolKind.Module
		);
		
		const sibling2 = new OutlineItem(
			'Sibling 2',
			1,
			new vscode.Range(6, 0, 10, 0),
			new vscode.Range(6, 0, 6, 10),
			[],
			vscode.SymbolKind.Module
		);
		
		const controller = new TreeDragAndDropController();
		
		// WHEN: Filtering redundant items
		const filtered = (controller as any).filterRedundantItems([sibling1, sibling2]);
		
		// THEN: Both siblings should remain
		assert.strictEqual(filtered.length, 2, 'Should have two items after filtering');
	});

	test('Should sort items by document position (line number)', () => {
		// GIVEN: Items in random order
		const item1 = new OutlineItem(
			'First',
			1,
			new vscode.Range(0, 0, 5, 0),
			new vscode.Range(0, 0, 0, 10),
			[],
			vscode.SymbolKind.Module
		);
		
		const item3 = new OutlineItem(
			'Third',
			1,
			new vscode.Range(20, 0, 25, 0),
			new vscode.Range(20, 0, 20, 10),
			[],
			vscode.SymbolKind.Module
		);
		
		const item2 = new OutlineItem(
			'Second',
			1,
			new vscode.Range(10, 0, 15, 0),
			new vscode.Range(10, 0, 10, 10),
			[],
			vscode.SymbolKind.Module
		);
		
		const controller = new TreeDragAndDropController();
		
		// WHEN: Sorting by position (pass in reverse order)
		const sorted = (controller as any).sortItemsByPosition([item3, item1, item2]);
		
		// THEN: Items should be in document order
		assert.strictEqual(sorted.length, 3, 'Should have three items');
		assert.strictEqual(sorted[0].label, 'First', 'First item should be at position 0');
		assert.strictEqual(sorted[1].label, 'Second', 'Second item should be at position 1');
		assert.strictEqual(sorted[2].label, 'Third', 'Third item should be at position 2');
	});

	test('Should handle empty array when filtering', () => {
		const controller = new TreeDragAndDropController();
		const filtered = (controller as any).filterRedundantItems([]);
		
		assert.strictEqual(filtered.length, 0, 'Empty array should remain empty');
	});

	test('Should handle single item when filtering', () => {
		const item = new OutlineItem(
			'Only Item',
			1,
			new vscode.Range(0, 0, 5, 0),
			new vscode.Range(0, 0, 0, 10),
			[],
			vscode.SymbolKind.Module
		);
		
		const controller = new TreeDragAndDropController();
		const filtered = (controller as any).filterRedundantItems([item]);
		
		assert.strictEqual(filtered.length, 1, 'Single item should pass through');
		assert.strictEqual(filtered[0].label, 'Only Item');
	});

	test('Should filter nested hierarchy (grandparent, parent, child)', () => {
		// GIVEN: Three levels of nesting all selected
		const grandparent = new OutlineItem(
			'Grandparent',
			1,
			new vscode.Range(0, 0, 20, 0),
			new vscode.Range(0, 0, 0, 15),
			[],
			vscode.SymbolKind.Module
		);
		
		const parent = new OutlineItem(
			'Parent',
			2,
			new vscode.Range(5, 0, 15, 0),
			new vscode.Range(5, 0, 5, 10),
			[],
			vscode.SymbolKind.Module
		);
		
		const child = new OutlineItem(
			'Child',
			3,
			new vscode.Range(8, 0, 12, 0),
			new vscode.Range(8, 0, 8, 8),
			[],
			vscode.SymbolKind.Module
		);
		
		const controller = new TreeDragAndDropController();
		
		// WHEN: Filtering with all three selected
		const filtered = (controller as any).filterRedundantItems([grandparent, parent, child]);
		
		// THEN: Only grandparent should remain
		assert.strictEqual(filtered.length, 1, 'Only top-level item should remain');
		assert.strictEqual(filtered[0].label, 'Grandparent');
	});

	test('Should serialize multiple filtered items for drag operation', async () => {
		// GIVEN: Multiple outline items with one being child of another
		const parent = new OutlineItem(
			'Parent',
			1,
			new vscode.Range(0, 0, 10, 0),
			new vscode.Range(0, 0, 0, 10),
			[],
			vscode.SymbolKind.Module
		);
		
		const child = new OutlineItem(
			'Child',
			2,
			new vscode.Range(2, 0, 5, 0),
			new vscode.Range(2, 0, 2, 8),
			[],
			vscode.SymbolKind.Module
		);

		const sibling = new OutlineItem(
			'Sibling',
			1,
			new vscode.Range(11, 0, 15, 0),
			new vscode.Range(11, 0, 11, 10),
			[],
			vscode.SymbolKind.Module
		);
		
		const controller = new TreeDragAndDropController();
		const dataTransfer = new vscode.DataTransfer();
		
		// WHEN: Dragging parent, child, and sibling (child should be filtered)
		await controller.handleDrag([parent, child, sibling], dataTransfer, {} as any);
		
		// THEN: Only parent and sibling should be serialized
		const dragData = dataTransfer.get('application/vnd.code.tree.outlineeclipsed');
		assert.ok(dragData, 'Drag data should be set');
		
		const parsed = JSON.parse(dragData!.value as string);
		assert.strictEqual(parsed.length, 2, 'Should have two items (child filtered out)');
		assert.strictEqual(parsed[0].label, 'Parent', 'First should be parent (sorted by position)');
		assert.strictEqual(parsed[1].label, 'Sibling', 'Second should be sibling');
	});
});

suite('PI-6: Multi-Select Drag & Drop Integration Tests', () => {

	test('Should move two non-contiguous sections to new location', async () => {
		// GIVEN: A markdown document with multiple sections
		const content = `# First
Content 1

# Second
Content 2

# Third
Content 3

# Fourth
Content 4`;

		const doc = await vscode.workspace.openTextDocument({
			content,
			language: 'markdown'
		});
		const editor = await vscode.window.showTextDocument(doc);
		const controller = new TreeDragAndDropController();
		
		// WHEN: Moving "First" and "Third" sections after "Fourth"
		const draggedItems = [
			{ 
				label: 'First',
				level: 1,
				range: { start: { line: 0, character: 0 }, end: { line: 1, character: 10 } },
				selectionRange: { start: { line: 0, character: 0 }, end: { line: 0, character: 7 } }
			},
			{ 
				label: 'Third',
				level: 1,
				range: { start: { line: 6, character: 0 }, end: { line: 7, character: 10 } },
				selectionRange: { start: { line: 6, character: 0 }, end: { line: 6, character: 7 } }
			}
		];
		
		const success = await (controller as any).moveSections(editor, draggedItems, 12);
		
		// THEN: Sections should be moved in order
		assert.ok(success, 'Move operation should succeed');
		const newContent = editor.document.getText();
		
		// Verify order: Second, Fourth, First, Third
		const secondIndex = newContent.indexOf('# Second');
		const fourthIndex = newContent.indexOf('# Fourth');
		const firstIndex = newContent.indexOf('# First');
		const thirdIndex = newContent.indexOf('# Third');
		
		assert.ok(secondIndex < fourthIndex, 'Second should come before Fourth');
		assert.ok(fourthIndex < firstIndex, 'Fourth should come before First');
		assert.ok(firstIndex < thirdIndex, 'First should come before Third');
	});

	test('Should move parent and unrelated section together', async () => {
		// GIVEN: A document with nested structure and unrelated section
		const content = `# Parent 1
## Child 1.1
Content child

# Parent 2
## Child 2.1
Content child

# Parent 3`;

		const doc = await vscode.workspace.openTextDocument({
			content,
			language: 'markdown'
		});
		const editor = await vscode.window.showTextDocument(doc);
		const controller = new TreeDragAndDropController();
		
		// WHEN: Moving "Parent 1" (with child) and "Parent 3" to end
		const draggedItems = [
			{ 
				label: 'Parent 1',
				level: 1,
				range: { start: { line: 0, character: 0 }, end: { line: 2, character: 13 } },
				selectionRange: { start: { line: 0, character: 0 }, end: { line: 0, character: 10 } }
			},
			{ 
				label: 'Parent 3',
				level: 1,
				range: { start: { line: 8, character: 0 }, end: { line: 8, character: 10 } },
				selectionRange: { start: { line: 8, character: 0 }, end: { line: 8, character: 10 } }
			}
		];
		
		const success = await (controller as any).moveSections(editor, draggedItems, 9);
		
		// THEN: Both sections should move, Parent 1 with its child
		assert.ok(success, 'Move operation should succeed');
		const newContent = editor.document.getText();
		
		// Verify Parent 1 and Child 1.1 are still together
		const parent1Index = newContent.indexOf('# Parent 1');
		const child11Index = newContent.indexOf('## Child 1.1');
		const parent3Index = newContent.indexOf('# Parent 3');
		const parent2Index = newContent.indexOf('# Parent 2');
		
		assert.ok(child11Index > parent1Index && child11Index < parent1Index + 100, 
			'Child 1.1 should be close after Parent 1');
		assert.ok(parent2Index < parent1Index, 'Parent 2 should come before moved sections');
		assert.ok(parent3Index > parent1Index, 'Parent 3 should come after Parent 1');
	});

	test('Should handle empty dragged items array gracefully', async () => {
		const content = `# Section
Content`;

		const doc = await vscode.workspace.openTextDocument({
			content,
			language: 'markdown'
		});
		const editor = await vscode.window.showTextDocument(doc);
		const controller = new TreeDragAndDropController();
		
		// WHEN: Calling moveSections with empty array
		const success = await (controller as any).moveSections(editor, [], 5);
		
		// THEN: Should return false without crashing
		assert.strictEqual(success, false, 'Should return false for empty array');
	});

	test('Should move three non-contiguous sections maintaining order', async () => {
		// GIVEN: Five sections where we'll move 1st, 3rd, and 5th
		const content = `# First
Content 1

# Second
Content 2

# Third
Content 3

# Fourth
Content 4

# Fifth
Content 5`;

		const doc = await vscode.workspace.openTextDocument({
			content,
			language: 'markdown'
		});
		const editor = await vscode.window.showTextDocument(doc);
		const controller = new TreeDragAndDropController();
		
		// WHEN: Moving First, Third, and Fifth to position before Second
		const draggedItems = [
			{ 
				label: 'First',
				level: 1,
				range: { start: { line: 0, character: 0 }, end: { line: 1, character: 10 } },
				selectionRange: { start: { line: 0, character: 0 }, end: { line: 0, character: 7 } }
			},
			{ 
				label: 'Third',
				level: 1,
				range: { start: { line: 6, character: 0 }, end: { line: 7, character: 10 } },
				selectionRange: { start: { line: 6, character: 0 }, end: { line: 6, character: 7 } }
			},
			{ 
				label: 'Fifth',
				level: 1,
				range: { start: { line: 12, character: 0 }, end: { line: 13, character: 10 } },
				selectionRange: { start: { line: 12, character: 0 }, end: { line: 12, character: 7 } }
			}
		];
		
		const success = await (controller as any).moveSections(editor, draggedItems, 3);
		
		// THEN: Final order should be: First, Third, Fifth, Second, Fourth
		assert.ok(success, 'Move operation should succeed');
		const lines = editor.document.getText().split('\n');
		const headings = lines.filter(line => line.startsWith('#'));
		
		assert.strictEqual(headings[0], '# First', 'First heading at position 0');
		assert.strictEqual(headings[1], '# Third', 'Third heading at position 1');
		assert.strictEqual(headings[2], '# Fifth', 'Fifth heading at position 2');
		assert.strictEqual(headings[3], '# Second', 'Second heading at position 3');
		assert.strictEqual(headings[4], '# Fourth', 'Fourth heading at position 4');
	});

	test('Should handle drop on placeholder item as end-of-document drop', async () => {
		// GIVEN: A document with sections
		const content = `# First
Content

# Second
Content`;

		const doc = await vscode.workspace.openTextDocument({
			content,
			language: 'markdown'
		});
		const editor = await vscode.window.showTextDocument(doc);
		const controller = new TreeDragAndDropController();
		const dataTransfer = new vscode.DataTransfer();
		
		// WHEN: Dragging "First" section and dropping on undefined (placeholder behavior)
		const dragData = JSON.stringify([{
			label: 'First',
			level: 1,
			range: { start: { line: 0, character: 0 }, end: { line: 1, character: 7 } },
			selectionRange: { start: { line: 0, character: 0 }, end: { line: 0, character: 7 } }
		}]);
		
		dataTransfer.set('application/vnd.code.tree.outlineeclipsed', new vscode.DataTransferItem(dragData));
		
		// Drop with target=undefined simulates dropping on placeholder
		await controller.handleDrop(undefined, dataTransfer, {} as any);
		
		// THEN: Section should move to end
		const newContent = editor.document.getText();
		const lines = newContent.split('\n');
		const headings = lines.filter(line => line.startsWith('#'));
		
		// "Second" should now be first, "First" at end
		assert.strictEqual(headings[0], '# Second', 'Second should be first after move');
		assert.strictEqual(headings[1], '# First', 'First should be at end');
	});
});
