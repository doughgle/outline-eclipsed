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

	// PI-5: Decoration type for highlighting moved text
	private highlightDecorationType: vscode.TextEditorDecorationType;
	private highlightTimeout: NodeJS.Timeout | undefined;

	constructor() {
		// Create a subtle highlight decoration
		this.highlightDecorationType = vscode.window.createTextEditorDecorationType({
			backgroundColor: new vscode.ThemeColor('editor.findMatchHighlightBackground'),
			border: '1px solid',
			borderColor: new vscode.ThemeColor('editor.findMatchBorder'),
			isWholeLine: true
		});
	}

	/**
	 * PI-5: Clean up resources
	 */
	dispose(): void {
		if (this.highlightTimeout) {
			clearTimeout(this.highlightTimeout);
		}
		this.highlightDecorationType.dispose();
	}

	/**
	 * PI-5: Highlight the moved text temporarily and scroll to reveal it
	 */
	private highlightMovedText(editor: vscode.TextEditor, range: vscode.Range): void {
		// Clear any existing highlight timeout
		if (this.highlightTimeout) {
			clearTimeout(this.highlightTimeout);
		}

		// PI-5: Scroll to reveal the moved section (without changing focus)
		editor.revealRange(range, vscode.TextEditorRevealType.InCenter);

		// Apply the highlight decoration
		editor.setDecorations(this.highlightDecorationType, [range]);

		// Clear the highlight after 3 seconds
		this.highlightTimeout = setTimeout(() => {
			editor.setDecorations(this.highlightDecorationType, []);
			this.highlightTimeout = undefined;
		}, 3000);
	}

	/**
	 * PI-3/PI-4: Move a section from source line to target line
	 * This is exposed as a command for testing and programmatic access
	 */
	async moveSection(
		editor: vscode.TextEditor,
		sourceStartLine: number,
		targetLine: number
	): Promise<boolean> {
		try {
			const document = editor.document;
			
			// Find the source item to get its full range (PI-4: includes children)
			const sourceItem = this.findItemAtLine(document, sourceStartLine);
			if (!sourceItem) {
				console.error(`PI-4: Could not find source item at line ${sourceStartLine}`);
				return false;
			}

			console.log(`PI-4: Moving section from lines ${sourceItem.range.start.line}-${sourceItem.range.end.line} to line ${targetLine}`);

			// PI-4: Simple approach - work with document as array of lines
			const allLines = document.getText().split('\n');
			
			// Extract the section lines (including any trailing blank line)
			const sourceStart = sourceItem.range.start.line;
			const sourceEnd = sourceItem.range.end.line;
			let actualEnd = sourceEnd;
			
			// Include trailing blank line if it exists
			if (actualEnd + 1 < allLines.length && allLines[actualEnd + 1].trim() === '') {
				actualEnd++;
			}
			
			const sectionLines = allLines.slice(sourceStart, actualEnd + 1);
			
			// Remove the section from its current position
			allLines.splice(sourceStart, actualEnd - sourceStart + 1);
			
			// Calculate new insertion position (adjusted if we removed lines before it)
			let insertPos = targetLine;
			if (targetLine > sourceStart) {
				insertPos = targetLine - (actualEnd - sourceStart + 1);
			}
			
			// Clamp to valid range
			insertPos = Math.max(0, Math.min(insertPos, allLines.length));
			
			// Insert the section at new position
			allLines.splice(insertPos, 0, ...sectionLines);
			
			// Replace entire document content
			const newContent = allLines.join('\n');
			const fullRange = new vscode.Range(
				document.lineAt(0).range.start,
				document.lineAt(document.lineCount - 1).range.end
			);
			
			const success = await editor.edit(editBuilder => {
				editBuilder.replace(fullRange, newContent);
			});

			if (success) {
				// PI-5: Highlight the moved section at its new position
				const newRange = new vscode.Range(
					insertPos,
					0,
					insertPos + sectionLines.length - 1,
					sectionLines[sectionLines.length - 1].length
				);
				this.highlightMovedText(editor, newRange);
			}

			console.log(`PI-4: Move operation ${success ? 'succeeded' : 'failed'}`);
			return success;
		} catch (error) {
			console.error('PI-4: Error moving section:', error);
			return false;
		}
	}

	/**
	 * PI-4: Helper to find outline item at a given line with full range including children
	 * This calculates the range that includes all descendant headings
	 */
	private findItemAtLine(document: vscode.TextDocument, lineNumber: number): OutlineItem | undefined {
		// Parse all headings with their levels
		interface HeadingInfo {
			line: number;
			level: number;
			text: string;
		}
		
		const headings: HeadingInfo[] = [];
		for (let i = 0; i < document.lineCount; i++) {
			const line = document.lineAt(i);
			const match = line.text.match(/^(#{1,6})\s+(.+)$/);
			if (match) {
				headings.push({
					line: i,
					level: match[1].length,
					text: match[2].trim()
				});
			}
		}
		
		// Find the heading at or before the requested line
		let targetHeading: HeadingInfo | undefined;
		for (const heading of headings) {
			if (heading.line === lineNumber) {
				targetHeading = heading;
				break;
			}
		}
		
		if (!targetHeading) {
			console.error(`PI-4: No heading found at line ${lineNumber}`);
			return undefined;
		}
		
		// PI-4: Calculate end line including all children (descendants)
		// A child is a heading with level > parent.level that appears before any heading with level <= parent.level
		const targetIndex = headings.findIndex(h => h.line === targetHeading!.line);
		let endLine = targetHeading.line;
		
		// Look for the next heading at the same level or higher (lower number = higher level)
		for (let i = targetIndex + 1; i < headings.length; i++) {
			if (headings[i].level <= targetHeading.level) {
				// Found a sibling or higher level heading - stop before it
				endLine = headings[i].line - 1;
				break;
			}
			// This is a child (higher level number) - include it
			endLine = document.lineCount - 1; // Extend to end for now
		}
		
		// If we didn't find a sibling, extend to end of document or last line with content
		if (endLine === targetHeading.line) {
			endLine = document.lineCount - 1;
		}
		
		// Trim trailing blank lines
		while (endLine > targetHeading.line && document.lineAt(endLine).text.trim() === '') {
			endLine--;
		}
		
		const headingLine = document.lineAt(targetHeading.line);
		const selectionRange = headingLine.range;
		const range = new vscode.Range(
			targetHeading.line, 
			0, 
			endLine, 
			document.lineAt(endLine).text.length
		);
		
		console.log(`PI-4: Found item "${targetHeading.text}" at line ${targetHeading.line}, range extends to line ${endLine} (includes children)`);
		
		return new OutlineItem(targetHeading.text, targetHeading.level, range, selectionRange);
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
