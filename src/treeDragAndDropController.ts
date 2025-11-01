import * as vscode from 'vscode';
import { OutlineItem } from './outlineItem';

/**
 * PI-3: TreeDragAndDropController
 * 
 * Handles drag and drop operations for the outline tree view.
 * Allows users to reorder sections by dragging outline items.
 */
export class TreeDragAndDropController implements vscode.TreeDragAndDropController<OutlineItem> {
	
	dropMimeTypes = ['application/vnd.code.tree.outlineeclipsed'];
	dragMimeTypes = ['application/vnd.code.tree.outlineeclipsed'];

	private highlightDecorationType: vscode.TextEditorDecorationType;
	private highlightTimeout: NodeJS.Timeout | undefined;

	constructor() {
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
	 * PI-5/PI-6: Highlight the moved text temporarily and scroll to reveal it
	 * Delegates to highlightMovedSections for consistent behavior
	 */
	private highlightMovedText(editor: vscode.TextEditor, range: vscode.Range): void {
		this.highlightMovedSections(editor, [range]);
	}

	/**
	 * PI-6: Highlight multiple moved sections simultaneously.
	 * Shows visual feedback for all moved sections and scrolls to reveal the first one.
	 * 
	 * @param editor - Active text editor
	 * @param ranges - Array of ranges to highlight
	 */
	private highlightMovedSections(editor: vscode.TextEditor, ranges: vscode.Range[]): void {
		if (this.highlightTimeout) {
			clearTimeout(this.highlightTimeout);
		}

		// PI-6: Scroll to reveal the first moved section (without changing focus)
		if (ranges.length > 0) {
			editor.revealRange(ranges[0], vscode.TextEditorRevealType.InCenter);
		}

		editor.setDecorations(this.highlightDecorationType, ranges);

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
			
			const sourceItem = this.findItemAtLine(document, sourceStartLine);
			if (!sourceItem) {
				console.error(`PI-4: Could not find source item at line ${sourceStartLine}`);
				return false;
			}

			console.log(`PI-4: Moving section from lines ${sourceItem.range.start.line}-${sourceItem.range.end.line} to line ${targetLine}`);

			// PI-4: Simple approach - work with document as array of lines
			const allLines = document.getText().split('\n');
			
			const sourceStart = sourceItem.range.start.line;
			const sourceEnd = sourceItem.range.end.line;
			let actualEnd = sourceEnd;
			
			if (actualEnd + 1 < allLines.length && allLines[actualEnd + 1].trim() === '') {
				actualEnd++;
			}
			
			const sectionLines = allLines.slice(sourceStart, actualEnd + 1);
			
			allLines.splice(sourceStart, actualEnd - sourceStart + 1);
			
			let insertPos = targetLine;
			if (targetLine > sourceStart) {
				insertPos = targetLine - (actualEnd - sourceStart + 1);
			}
			
			insertPos = Math.max(0, Math.min(insertPos, allLines.length));
			
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
	 * PI-6: Move multiple sections to a target location.
	 * Maintains relative order and handles range adjustments.
	 * Sections are extracted in reverse order (bottom to top) to prevent line number shifts.
	 * 
	 * @param editor - Active text editor
	 * @param draggedItems - Array of serialized items to move
	 * @param targetLine - Destination line number
	 * @returns Promise that resolves to true if successful
	 */
	async moveSections(
		editor: vscode.TextEditor,
		draggedItems: any[],
		targetLine: number
	): Promise<boolean> {
		try {
			if (draggedItems.length === 0) {
				console.log('PI-6: No items to move');
				return false;
			}

			const document = editor.document;
			console.log(`PI-6: Moving ${draggedItems.length} sections to line ${targetLine}`);
			
			// PI-6: Build full OutlineItem objects with children ranges
			const sourceItems: OutlineItem[] = [];
			for (const itemData of draggedItems) {
				const item = this.findItemAtLine(document, itemData.range.start.line);
				if (item) {
					sourceItems.push(item);
				}
			}
			
			if (sourceItems.length === 0) {
				console.error('PI-6: No valid source items found');
				return false;
			}
			
			// PI-6: Work with document as array of lines
			const allLines = document.getText().split('\n');
			
			// Store sections and their metadata
			interface SectionData {
				lines: string[];
				originalStart: number;
				originalEnd: number;
			}
			const extractedSections: SectionData[] = [];
			
			// PI-6: Extract sections in reverse order (bottom to top) to avoid line shifts
			const sortedItems = [...sourceItems].sort((a, b) => 
				b.range.start.line - a.range.start.line
			);
			
			for (const item of sortedItems) {
				let sectionStart = item.range.start.line;
				let sectionEnd = item.range.end.line;
				
				// Include trailing blank line if it exists
				if (sectionEnd + 1 < allLines.length && allLines[sectionEnd + 1].trim() === '') {
					sectionEnd++;
				}
				
				// Extract the section
				const sectionLines = allLines.slice(sectionStart, sectionEnd + 1);
				extractedSections.unshift({ // Add to front to maintain document order
					lines: sectionLines,
					originalStart: sectionStart,
					originalEnd: sectionEnd
				});
				
				// Remove from document
				allLines.splice(sectionStart, sectionEnd - sectionStart + 1);
			}
			
			// PI-6: Calculate adjusted target position
			// Account for lines removed before the target
			let adjustedTarget = targetLine;
			for (const section of extractedSections) {
				if (section.originalStart < targetLine) {
					const sectionLength = section.originalEnd - section.originalStart + 1;
					adjustedTarget -= sectionLength;
				}
			}
			
			// Clamp to valid range
			adjustedTarget = Math.max(0, Math.min(adjustedTarget, allLines.length));
			
			// PI-6: Insert all sections at target position in document order
			let currentInsertPos = adjustedTarget;
			const movedRanges: vscode.Range[] = [];
			
			for (const section of extractedSections) {
				allLines.splice(currentInsertPos, 0, ...section.lines);
				
				// Track the new range for highlighting
				const newRange = new vscode.Range(
					currentInsertPos,
					0,
					currentInsertPos + section.lines.length - 1,
					section.lines[section.lines.length - 1].length
				);
				movedRanges.push(newRange);
				
				currentInsertPos += section.lines.length;
			}
			
			// PI-6: Replace document content
			const newContent = allLines.join('\n');
			const fullRange = new vscode.Range(
				document.lineAt(0).range.start,
				document.lineAt(document.lineCount - 1).range.end
			);
			
			const success = await editor.edit(editBuilder => {
				editBuilder.replace(fullRange, newContent);
			});

			if (success) {
				// PI-6: Highlight all moved sections
				this.highlightMovedSections(editor, movedRanges);
				console.log(`PI-6: Successfully moved ${extractedSections.length} sections`);
			}

			return success;
			
		} catch (error) {
			console.error('PI-6: Error moving sections:', error);
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
	 * PI-6: Remove items that are descendants of other selected items.
	 * This prevents moving a section twice (once as parent, once as child).
	 * An item is redundant if its range is contained within another item's range.
	 * 
	 * @param items - Array of selected outline items
	 * @returns Filtered array with no redundant descendants
	 */
	private filterRedundantItems(items: readonly OutlineItem[]): OutlineItem[] {
		if (items.length <= 1) {
			return [...items];
		}

		const result: OutlineItem[] = [];
		
		for (const candidate of items) {
			// Check if this candidate is contained within any other item
			const isContainedInAnother = items.some(other => {
				if (other === candidate) {
					return false; // Don't compare item to itself
				}
				
				// Check if candidate's range is fully contained within other's range
				const candidateStart = candidate.range.start.line;
				const candidateEnd = candidate.range.end.line;
				const otherStart = other.range.start.line;
				const otherEnd = other.range.end.line;
				
				return candidateStart >= otherStart && candidateEnd <= otherEnd;
			});
			
			if (!isContainedInAnother) {
				result.push(candidate);
			}
		}
		
		return result;
	}

	/**
	 * PI-6: Sort items by their appearance in the document (top to bottom).
	 * This ensures consistent ordering when moving multiple items.
	 * 
	 * @param items - Array of outline items
	 * @returns Sorted array ordered by starting line number
	 */
	private sortItemsByPosition(items: OutlineItem[]): OutlineItem[] {
		return [...items].sort((a, b) => {
			return a.range.start.line - b.range.start.line;
		});
	}

	/**
	 * PI-3/PI-6: Handles the drag operation - serialize the dragged items
	 * PI-6: Filters out redundant items and sorts by position
	 */
	async handleDrag(
		source: readonly OutlineItem[],
		dataTransfer: vscode.DataTransfer,
		token: vscode.CancellationToken
	): Promise<void> {
		// PI-6: Filter out items that are descendants of other selected items
		const filteredSource = this.filterRedundantItems(source);
		
		// PI-6: Sort items by their document position (top to bottom)
		const sortedSource = this.sortItemsByPosition(filteredSource);
		
		// Serialize the outline items for transfer
		const serialized = sortedSource.map(item => ({
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
			console.log(`PI-3/PI-6: Drop operation - ${draggedItems.length} item(s) dropped`);
			
			if (draggedItems.length === 0) {
				return;
			}

			const editor = vscode.window.activeTextEditor;
			if (!editor) {
				console.error('PI-3: No active editor');
				return;
			}

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

			// PI-6: Execute the move (single or multiple items)
			if (draggedItems.length === 1) {
				// Single item - use existing optimized logic
				const sourceStartLine = draggedItems[0].range.start.line;
				await this.moveSection(editor, sourceStartLine, targetLine);
			} else {
				// Multiple items - use batch move logic
				await this.moveSections(editor, draggedItems, targetLine);
			}
			
		} catch (error) {
			console.error('Failed to parse drag data:', error);
		}
	}
}
