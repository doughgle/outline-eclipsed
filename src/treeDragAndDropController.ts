import * as vscode from 'vscode';
import { OutlineItem } from './outlineItem';

/**
 * PI-3: TreeDragAndDropController
 * 
 * Handles drag and drop operations for the outline tree view.
 * Allows users to reorder sections by dragging outline items.
 */
export class TreeDragAndDropController implements vscode.TreeDragAndDropController<OutlineItem> {
	
	// MIME type for our tree items
	dropMimeTypes = ['application/vnd.code.tree.outlineeclipsed'];
	dragMimeTypes = ['application/vnd.code.tree.outlineeclipsed'];

	/**
	 * PI-3: Move a section from source line to target line
	 * This is exposed as a command for testing and programmatic access
	 */
	async moveSection(
		editor: vscode.TextEditor,
		sourceStartLine: number,
		targetLine: number
	): Promise<boolean> {
		try {
			const document = editor.document;
			
			// Find the source item to get its full range
			const sourceItem = this.findItemAtLine(document, sourceStartLine);
			if (!sourceItem) {
				console.error(`PI-3: Could not find source item at line ${sourceStartLine}`);
				return false;
			}

			console.log(`PI-3: Moving section from lines ${sourceItem.range.start.line}-${sourceItem.range.end.line} to line ${targetLine}`);

			// Extract the text from the source range (including trailing newline)
			const sourceRange = new vscode.Range(
				sourceItem.range.start.line, 
				0,
				sourceItem.range.end.line + 1, // Include the newline after last line
				0
			);
			const sourceText = document.getText(sourceRange);
			
			// Calculate insertion position before we modify the document
			let insertLine = targetLine;
			
			// Perform the edit as a single transaction
			const success = await editor.edit(editBuilder => {
				// If moving down, insert first, then delete
				// If moving up, delete first, then insert
				if (targetLine > sourceItem.range.end.line) {
					// Moving down: insert at target first
					editBuilder.insert(new vscode.Position(insertLine, 0), sourceText);
					// Then delete from source
					editBuilder.delete(sourceRange);
				} else {
					// Moving up: delete from source first
					editBuilder.delete(sourceRange);
					// Then insert at target (position unchanged since we deleted below)
					editBuilder.insert(new vscode.Position(insertLine, 0), sourceText);
				}
			});

			console.log(`PI-3: Move operation ${success ? 'succeeded' : 'failed'}`);
			return success;
		} catch (error) {
			console.error('PI-3: Error moving section:', error);
			return false;
		}
	}

	/**
	 * Helper to find outline item at a given line
	 * TODO: This duplicates logic from OutlineProvider - consider refactoring
	 */
	private findItemAtLine(document: vscode.TextDocument, lineNumber: number): OutlineItem | undefined {
		// Simple markdown heading parser for movement logic
		const items: OutlineItem[] = [];
		
		for (let i = 0; i < document.lineCount; i++) {
			const line = document.lineAt(i);
			const match = line.text.match(/^(#{1,6})\s+(.+)$/);
			
			if (match) {
				const level = match[1].length;
				const text = match[2].trim();
				
				// Find end of this section
				let endLine = i;
				for (let j = i + 1; j < document.lineCount; j++) {
					const nextLine = document.lineAt(j);
					const nextMatch = nextLine.text.match(/^#{1,6}\s+/);
					if (nextMatch) {
						endLine = j - 1;
						break;
					}
					endLine = j;
				}
				
				const selectionRange = line.range;
				const range = new vscode.Range(i, 0, endLine, document.lineAt(endLine).text.length);
				const item = new OutlineItem(text, level, range, selectionRange);
				items.push(item);
			}
		}
		
		// Find item containing the line
		const position = new vscode.Position(lineNumber, 0);
		for (const item of items) {
			if (item.range.contains(position)) {
				return item;
			}
		}
		
		return undefined;
	}

	/**
	 * Handles the drag operation - serialize the dragged items
	 */
	async handleDrag(
		source: readonly OutlineItem[],
		dataTransfer: vscode.DataTransfer,
		token: vscode.CancellationToken
	): Promise<void> {
		// Serialize the outline items for transfer
		const serialized = source.map(item => ({
			label: item.label,
			level: item.level,
			range: {
				start: { line: item.range.start.line, character: item.range.start.character },
				end: { line: item.range.end.line, character: item.range.end.character }
			},
			selectionRange: {
				start: { line: item.selectionRange.start.line, character: item.selectionRange.start.character },
				end: { line: item.selectionRange.end.line, character: item.selectionRange.end.character }
			}
		}));

		dataTransfer.set(
			'application/vnd.code.tree.outlineeclipsed',
			new vscode.DataTransferItem(JSON.stringify(serialized))
		);
	}

	/**
	 * Handles the drop operation - deserialize and move the text
	 */
	async handleDrop(
		target: OutlineItem | undefined,
		dataTransfer: vscode.DataTransfer,
		token: vscode.CancellationToken
	): Promise<void> {
		// Get the drag data
		const transferItem = dataTransfer.get('application/vnd.code.tree.outlineeclipsed');
		if (!transferItem) {
			console.log('PI-3: No drag data found');
			return;
		}

		try {
			const draggedItems = JSON.parse(transferItem.value as string);
			console.log(`PI-3: Drop operation - ${draggedItems.length} item(s) dropped`);
			
			if (draggedItems.length === 0) {
				return;
			}

			const editor = vscode.window.activeTextEditor;
			if (!editor) {
				console.error('PI-3: No active editor');
				return;
			}

			// Get the source item info (first dragged item)
			const sourceData = draggedItems[0];
			const sourceStartLine = sourceData.range.start.line;
			
			// Determine target line
			let targetLine: number;
			if (target) {
				// Drop before the target item
				targetLine = target.range.start.line;
				console.log(`PI-3: Dropped before target: ${target.label} (line ${targetLine})`);
			} else {
				// Drop at end of document
				targetLine = editor.document.lineCount;
				console.log('PI-3: Dropped at end of document');
			}

			// Execute the move
			await this.moveSection(editor, sourceStartLine, targetLine);
			
		} catch (error) {
			console.error('Failed to parse drag data:', error);
		}
	}
}
