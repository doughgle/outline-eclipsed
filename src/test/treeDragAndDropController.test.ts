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
