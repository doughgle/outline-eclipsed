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

	test('Should have correct MIME type for drag and drop', () => {
		const controller = new TreeDragAndDropController();
		
		assert.ok(controller.dropMimeTypes.includes('application/vnd.code.tree.outlineeclipsed'));
		assert.ok(controller.dragMimeTypes.includes('application/vnd.code.tree.outlineeclipsed'));
	});
});
