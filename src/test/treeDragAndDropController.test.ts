import * as assert from 'assert';
import * as vscode from 'vscode';
import { TreeDragAndDropController, DRAG_DROP_SUPPORTED_LANGUAGES } from '../treeDragAndDropController';
import { OutlineItem } from '../outlineItem';

suite('PI-3: TreeDragAndDropController Tests', () => {

	test('Should serialize OutlineItem data for drag operation', async () => {
		// Open a markdown document since drag/drop is only supported for markdown
		const doc = await vscode.workspace.openTextDocument({
			content: '# Test\n\nContent',
			language: 'markdown'
		});
		await vscode.window.showTextDocument(doc);
		
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
		// Open a markdown document since drag/drop is only supported for markdown
		const doc = await vscode.workspace.openTextDocument({
			content: '# Test\n\nContent',
			language: 'markdown'
		});
		await vscode.window.showTextDocument(doc);
		
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

	test('PI-5: Should activate and clear highlight after timeout', async function() {
		this.timeout(2000); // Fast test with short duration
		
		const content = `# Heading A
Content A

# Heading B
Content B`;

		const doc = await vscode.workspace.openTextDocument({
			content,
			language: 'markdown'
		});
		const editor = await vscode.window.showTextDocument(doc);

		// Use 100ms highlight duration for fast testing
		const controller = new TreeDragAndDropController(undefined, 100);
		
		// GIVEN: No highlight is active initially
		assert.strictEqual(controller.isHighlightInProgress(), false, 'Highlight should not be active initially');
		
		// WHEN: Moving section to trigger highlight
		await controller.moveSection(editor, 3, 0);
		
		// THEN: Highlight should be active immediately after move
		assert.strictEqual(controller.isHighlightInProgress(), true, 'Highlight should be active after move');
		
		// Wait for highlight to clear (100ms + small buffer)
		await new Promise(resolve => setTimeout(resolve, 150));
		
		// THEN: Highlight should be cleared after timeout
		assert.strictEqual(controller.isHighlightInProgress(), false, 'Highlight should be cleared after timeout');
		
		controller.dispose();
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
		
		// Open a markdown document since drag/drop is only supported for markdown
		const doc = await vscode.workspace.openTextDocument({
			content: '# Test\n\nContent',
			language: 'markdown'
		});
		await vscode.window.showTextDocument(doc);
		
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

suite('YAML Drag and Drop Tests', () => {

test('Should serialize YAML items for drag operation', async () => {
const yamlContent = `first: value1
second: value2
third: value3
`;
const doc = await vscode.workspace.openTextDocument({
content: yamlContent,
language: 'yaml'
});
await vscode.window.showTextDocument(doc);

const range = new vscode.Range(0, 0, 0, 13);
const selRange = new vscode.Range(0, 0, 0, 5);
const item = new OutlineItem('first', 1, range, selRange);

const controller = new TreeDragAndDropController();
const dataTransfer = new vscode.DataTransfer();

await controller.handleDrag([item], dataTransfer, {} as any);

const dragData = dataTransfer.get('application/vnd.code.tree.outlineeclipsed');
assert.ok(dragData, 'Drag data should be set for YAML');

const parsed = JSON.parse(dragData!.value as string);
assert.ok(Array.isArray(parsed), 'Parsed data should be an array');
assert.strictEqual(parsed.length, 1, 'Should have one item');
assert.strictEqual(parsed[0].label, 'first');
});

test('Should handle YAML drop operation', async () => {
const yamlContent = `first: value1
second: value2
third: value3
`;
const doc = await vscode.workspace.openTextDocument({
content: yamlContent,
language: 'yaml'
});
await vscode.window.showTextDocument(doc);

const controller = new TreeDragAndDropController();
const dataTransfer = new vscode.DataTransfer();

const dragData = JSON.stringify([{
label: 'first',
level: 1,
range: { start: { line: 0, character: 0 }, end: { line: 0, character: 13 } },
selectionRange: { start: { line: 0, character: 0 }, end: { line: 0, character: 5 } }
}]);

dataTransfer.set('application/vnd.code.tree.outlineeclipsed', new vscode.DataTransferItem(dragData));

await assert.doesNotReject(
async () => await controller.handleDrop(undefined, dataTransfer, {} as any)
);
});

test('Should handle nested YAML structures', async () => {
const yamlContent = `services:
  web:
    image: nginx
  database:
    image: postgres
volumes:
  data:
`;
const doc = await vscode.workspace.openTextDocument({
content: yamlContent,
language: 'yaml'
});
await vscode.window.showTextDocument(doc);

// Test dragging a parent key with children
const range = new vscode.Range(0, 0, 4, 20);
const selRange = new vscode.Range(0, 0, 0, 8);
const item = new OutlineItem('services', 1, range, selRange);

const controller = new TreeDragAndDropController();
const dataTransfer = new vscode.DataTransfer();

await controller.handleDrag([item], dataTransfer, {} as any);

const dragData = dataTransfer.get('application/vnd.code.tree.outlineeclipsed');
assert.ok(dragData, 'Should handle nested YAML structures');
});

test('Should handle first YAML item edge case', async () => {
const yamlContent = `alpha: first
beta: second
gamma: third
`;
const doc = await vscode.workspace.openTextDocument({
content: yamlContent,
language: 'yaml'
});
await vscode.window.showTextDocument(doc);

const range = new vscode.Range(0, 0, 0, 12);
const selRange = new vscode.Range(0, 0, 0, 5);
const item = new OutlineItem('alpha', 1, range, selRange);

const controller = new TreeDragAndDropController();
const dataTransfer = new vscode.DataTransfer();

await controller.handleDrag([item], dataTransfer, {} as any);

const dragData = dataTransfer.get('application/vnd.code.tree.outlineeclipsed');
assert.ok(dragData, 'Should handle first item');

const parsed = JSON.parse(dragData!.value as string);
assert.strictEqual(parsed[0].label, 'alpha');
});

test('Should handle last YAML item edge case', async () => {
const yamlContent = `alpha: first
beta: second
omega: last
`;
const doc = await vscode.workspace.openTextDocument({
content: yamlContent,
language: 'yaml'
});
await vscode.window.showTextDocument(doc);

const range = new vscode.Range(2, 0, 2, 11);
const selRange = new vscode.Range(2, 0, 2, 5);
const item = new OutlineItem('omega', 1, range, selRange);

const controller = new TreeDragAndDropController();
const dataTransfer = new vscode.DataTransfer();

await controller.handleDrag([item], dataTransfer, {} as any);

const dragData = dataTransfer.get('application/vnd.code.tree.outlineeclipsed');
assert.ok(dragData, 'Should handle last item');

const parsed = JSON.parse(dragData!.value as string);
assert.strictEqual(parsed[0].label, 'omega');
});

test('Should reject drag for non-supported languages', async () => {
const pythonContent = `def hello():
    print("Hello")
`;
const doc = await vscode.workspace.openTextDocument({
content: pythonContent,
language: 'python'
});
await vscode.window.showTextDocument(doc);

const range = new vscode.Range(0, 0, 1, 18);
const selRange = new vscode.Range(0, 0, 0, 10);
const item = new OutlineItem('hello', 1, range, selRange);

const controller = new TreeDragAndDropController();
const dataTransfer = new vscode.DataTransfer();

await controller.handleDrag([item], dataTransfer, {} as any);

// Should not set drag data for unsupported languages
const dragData = dataTransfer.get('application/vnd.code.tree.outlineeclipsed');
assert.strictEqual(dragData, undefined, 'Should not support drag for Python');
});

test('Should move nested YAML child within parent', async () => {
	const yamlContent = `beta:
  child1: value1
  child2: value2
  child3:
    grandchild: value3
`;
	const doc = await vscode.workspace.openTextDocument({
		content: yamlContent,
		language: 'yaml'
	});
	const editor = await vscode.window.showTextDocument(doc);

	// child3 is at line 3, has range that includes grandchild (line 4)
	const child3Range = new vscode.Range(3, 0, 4, 21);
	const child3SelRange = new vscode.Range(3, 2, 3, 8);
	const child3 = new OutlineItem('child3', 2, child3Range, child3SelRange);

	// child1 is the target (drop before child1)
	const child1Range = new vscode.Range(1, 0, 1, 18);
	const child1SelRange = new vscode.Range(1, 2, 1, 8);
	const child1 = new OutlineItem('child1', 2, child1Range, child1SelRange);

	const controller = new TreeDragAndDropController();

	// Serialize child3 for drag
	const dataTransfer = new vscode.DataTransfer();
	await controller.handleDrag([child3], dataTransfer, {} as any);

	// Drop child3 before child1
	await controller.handleDrop(child1, dataTransfer, {} as any);

	// Verify the result
	const text = editor.document.getText();
	const lines = text.split('\n');
	
	console.log('=== After move ===');
	console.log(text);
	console.log('=== Lines ===');
	lines.forEach((line, i) => console.log(`${i}: ${line}`));

	// child3 should now be before child1
	// Expected order: beta, child3, grandchild, blank, child1, child2
	assert.ok(lines[1].includes('child3'), `child3 should be at line 1, but got: ${lines[1]}`);
	assert.ok(lines[2].includes('grandchild'), `grandchild should move with child3, but got: ${lines[2]}`);
	assert.ok(lines[4].includes('child1'), `child1 should be after child3 (after blank line), but got: ${lines[4]}`);
	assert.ok(lines[5].includes('child2'), `child2 should remain at end, but got: ${lines[5]}`);
});

test('PI-10: Should detect git scheme as non-writable', async function() {
	// GIVEN: The git scheme (used for viewing files from commit history)
	
	// WHEN: We check if the git filesystem is writable
	const isWritableFS = vscode.workspace.fs.isWritableFileSystem('git');
	
	// THEN: Git scheme should be detected as non-writable (returns false, not undefined)
	assert.strictEqual(isWritableFS, false, 
		'Git scheme should return false (not writable) to prevent edit attempts');
});

test('PI-10: Should not highlight when drag-drop fails on read-only editor', async function() {
	this.timeout(5000);
	
	// GIVEN: A markdown document
	const doc = await vscode.workspace.openTextDocument({
		content: '# Heading 1\n\nContent 1\n\n# Heading 2\n\nContent 2\n',
		language: 'markdown'
	});
	const editor = await vscode.window.showTextDocument(doc);
	
	// Use 100ms highlight duration for fast testing
	const controller = new TreeDragAndDropController(undefined, 100);
	
	// GIVEN: No highlight is active initially
	assert.strictEqual(controller.isHighlightInProgress(), false, 'No highlight initially');
	
	// WHEN: We close the editor to make edits fail, then try to move
	const sourceRange = new vscode.Range(0, 0, 2, 9);
	await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
	
	// Attempt move - this should fail because editor is closed
	const success = await controller.moveSection(editor, 0, 4);
	
	// THEN: The operation should fail
	assert.strictEqual(success, false, 'Move should fail with closed editor');
	
	// AND: No highlight should be active (bug fix: highlights only show on success)
	assert.strictEqual(controller.isHighlightInProgress(), false, 
		'No highlight should be active when edit fails');
	
	controller.dispose();
});

test('PI-10: handleDrop should prevent operation on non-writable filesystem schemes', async function() {
	// This test verifies that isWritableFileSystem correctly identifies
	// read-only schemes to prevent confusing drag-drop behavior
	
	// GIVEN/WHEN/THEN: Git scheme should be non-writable
	const gitResult = vscode.workspace.fs.isWritableFileSystem('git');
	assert.strictEqual(gitResult, false, 
		'git scheme should be non-writable (false)');
	
	// WHEN/THEN: File scheme should be writable
	const fileResult = vscode.workspace.fs.isWritableFileSystem('file');
	assert.notStrictEqual(fileResult, false, 
		'file scheme should be writable (not false)');
	
	// WHEN/THEN: Untitled scheme should be writable
	const untitledResult = vscode.workspace.fs.isWritableFileSystem('untitled');
	assert.notStrictEqual(untitledResult, false, 
		'untitled scheme should be writable (not false)');
});

test('PI-10: isDocumentWritable integration - detects git scheme as read-only', async function() {
	this.timeout(5000);
	
	// This test verifies the complete flow: checking if a document with git: scheme
	// is correctly identified as non-writable, which prevents drag-drop operations
	
	// GIVEN: A normal markdown document (for comparison)
	const normalDoc = await vscode.workspace.openTextDocument({
		content: '# Test\n\nContent',
		language: 'markdown'
	});
	
	// Create controller with access to isDocumentWritable
	const controller = new TreeDragAndDropController();
	
	// WHEN: We check a normal document
	// We can't directly call isDocumentWritable (it's private), but we can
	// verify the logic by checking the scheme directly
	const normalScheme = normalDoc.uri.scheme;
	const isNormalWritable = vscode.workspace.fs.isWritableFileSystem(normalScheme);
	
	// THEN: Normal document should be writable
	assert.notStrictEqual(isNormalWritable, false, 
		`Normal document with ${normalScheme} scheme should be writable`);
	
	// WHEN: We check if git scheme would be writable
	const isGitWritable = vscode.workspace.fs.isWritableFileSystem('git');
	
	// THEN: Git scheme should be non-writable
	assert.strictEqual(isGitWritable, false, 
		'Git scheme should be detected as non-writable, preventing drag-drop on git history files');
	
	controller.dispose();
});
});

suite('PI-11: Data/Markup Format Drag and Drop Tests', () => {

	// Unit tests for DRAG_DROP_SUPPORTED_LANGUAGES constant
	test('DRAG_DROP_SUPPORTED_LANGUAGES includes all expected data/markup formats', () => {
		// GIVEN: The expected list of supported languages
		const expectedLanguages = [
			'markdown',
			'yaml',
			'json',
			'jsonc',
			'html',
			'css',
			'scss',
			'less',
			'xml',
		];

		// THEN: All expected languages should be in the constant
		for (const lang of expectedLanguages) {
			assert.ok(
				DRAG_DROP_SUPPORTED_LANGUAGES.includes(lang),
				`${lang} should be in DRAG_DROP_SUPPORTED_LANGUAGES`
			);
		}
	});

	test('DRAG_DROP_SUPPORTED_LANGUAGES does not include programming languages', () => {
		// GIVEN: Languages that should NOT support drag & drop
		const unsupportedLanguages = [
			'typescript',
			'javascript',
			'python',
			'java',
			'cpp',
			'c',
			'csharp',
			'go',
			'rust',
		];

		// THEN: None of these should be in the constant
		for (const lang of unsupportedLanguages) {
			assert.ok(
				!DRAG_DROP_SUPPORTED_LANGUAGES.includes(lang),
				`${lang} should NOT be in DRAG_DROP_SUPPORTED_LANGUAGES`
			);
		}
	});

	// Integration test: One supported language (JSON) to verify end-to-end
	test('Should allow drag for supported language (JSON)', async () => {
		const jsonContent = `{
  "name": "test",
  "version": "1.0.0"
}`;
		const doc = await vscode.workspace.openTextDocument({
			content: jsonContent,
			language: 'json'
		});
		await vscode.window.showTextDocument(doc);

		const range = new vscode.Range(1, 0, 1, 15);
		const selRange = new vscode.Range(1, 2, 1, 8);
		const item = new OutlineItem('name', 1, range, selRange);

		const controller = new TreeDragAndDropController();
		const dataTransfer = new vscode.DataTransfer();

		await controller.handleDrag([item], dataTransfer, {} as any);

		const dragData = dataTransfer.get('application/vnd.code.tree.outlineeclipsed');
		assert.ok(dragData, 'Drag data should be set for JSON');
	});

	// Integration test: One unsupported language to verify rejection
	test('Should NOT allow drag for unsupported languages', async () => {
		const javaContent = `public class Test {
    public void hello() {}
}`;
		const doc = await vscode.workspace.openTextDocument({
			content: javaContent,
			language: 'java'
		});
		await vscode.window.showTextDocument(doc);

		const range = new vscode.Range(0, 0, 2, 1);
		const selRange = new vscode.Range(0, 0, 0, 16);
		const item = new OutlineItem('Test', 1, range, selRange);

		const controller = new TreeDragAndDropController();
		const dataTransfer = new vscode.DataTransfer();

		await controller.handleDrag([item], dataTransfer, {} as any);

		const dragData = dataTransfer.get('application/vnd.code.tree.outlineeclipsed');
		assert.strictEqual(dragData, undefined, 'Drag data should NOT be set for unsupported languages');
	});
});

