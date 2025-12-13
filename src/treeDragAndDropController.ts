import * as vscode from 'vscode';
import { OutlineItem } from './outlineItem';
import { TextLineManipulator } from './textLineManipulator';
import { OutlineItemProcessor } from './outlineItemProcessor';
import { OutlineTransfer } from './outlineTransfer';

/**
 * PI-11: Languages that support drag & drop reordering.
 * 
 * These formats have document symbol providers (built-in or via extensions)
 * that enable outline-based navigation and section reordering.
 * 
 * Built-in VS Code support: json, jsonc, html, css, scss, less
 * Extension required: yaml (Red Hat YAML), xml (Red Hat XML)
 */
export const DRAG_DROP_SUPPORTED_LANGUAGES = [
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

/**
 * PI-3: TreeDragAndDropController
 * 
 * Handles drag and drop operations for the outline tree view.
 * Allows users to reorder sections by dragging outline items.
 */
export class TreeDragAndDropController implements vscode.TreeDragAndDropController<OutlineItem> {
	
	dropMimeTypes: string[];
	dragMimeTypes: string[];

	private highlightDecorationType: vscode.TextEditorDecorationType;
	private highlightTimeout: NodeJS.Timeout | undefined;
	private provider: any; // OutlineProvider - using any to avoid circular import
	private highlightDuration: number;
	
	// Collaborators for testability
	private textManipulator: TextLineManipulator;
	private itemProcessor: OutlineItemProcessor;
	private transfer: OutlineTransfer;

	constructor(
		provider?: any,
		highlightDuration: number = 1500,
		textManipulator?: TextLineManipulator,
		itemProcessor?: OutlineItemProcessor,
		transfer?: OutlineTransfer
	) {
		this.provider = provider;
		this.highlightDuration = highlightDuration;
		
		// Initialize collaborators (allow injection for testing)
		this.textManipulator = textManipulator || new TextLineManipulator();
		this.itemProcessor = itemProcessor || new OutlineItemProcessor();
		this.transfer = transfer || new OutlineTransfer();
		
		// Use MIME type from transfer object
		this.dropMimeTypes = [this.transfer.mimeType];
		this.dragMimeTypes = [this.transfer.mimeType];
		
		// PI-7: Enhanced "magnetic snap" highlight with prominent visual feedback
		// - 2px solid border for better visibility
		// - Configurable duration (default 1.5s) for quick, non-intrusive feedback
		// - Overview ruler indicator for easy location in scrollbar
		this.highlightDecorationType = vscode.window.createTextEditorDecorationType({
			backgroundColor: new vscode.ThemeColor('editor.findMatchHighlightBackground'),
			border: '2px solid',
			borderColor: new vscode.ThemeColor('editor.findMatchBorder'),
			isWholeLine: true,
			overviewRulerColor: new vscode.ThemeColor('editorOverviewRuler.findMatchForeground'),
			overviewRulerLane: vscode.OverviewRulerLane.Center
		});
	}

	/**
	 * Check if a document can be edited (not read-only).
	 * @param document - Document to check
	 * @returns true if writable, false if read-only
	 */
	private async isDocumentWritable(document: vscode.TextDocument): Promise<boolean> {
		// Check if the file system scheme supports writing
		const isWritableFS = vscode.workspace.fs.isWritableFileSystem(document.uri.scheme);
		if (isWritableFS === false) {
			return false;
		}
		
		// For file:// scheme, check file permissions
		if (document.uri.scheme === 'file') {
			try {
				const stat = await vscode.workspace.fs.stat(document.uri);
				if (stat.permissions !== undefined && (stat.permissions & vscode.FilePermission.Readonly)) {
					return false;
				}
			} catch (error) {
				// If we can't stat the file, assume it might be writable
				// (e.g., untitled documents don't have a file yet)
			}
		}
		
		return true;
	}

	/**
	 * PI-12: Validate that a document supports move operations.
	 * Checks both language support and write permissions.
	 * 
	 * @param document - Document to validate
	 * @returns Object with isValid flag and optional error message
	 */
	async validateDocumentForMove(document: vscode.TextDocument): Promise<{ isValid: boolean; errorMessage?: string }> {
		// Check language support
		if (!DRAG_DROP_SUPPORTED_LANGUAGES.includes(document.languageId)) {
			return {
				isValid: false,
				errorMessage: `Move operations are not supported for ${document.languageId} files`
			};
		}

		// Check if document is writable
		const isWritable = await this.isDocumentWritable(document);
		if (!isWritable) {
			return {
				isValid: false,
				errorMessage: 'Cannot move sections: This file is read-only'
			};
		}

		return { isValid: true };
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
	 * Returns whether a highlight is currently active.
	 * Useful for testing highlight behavior.
	 */
	isHighlightInProgress(): boolean {
		return this.highlightTimeout !== undefined;
	}

	/**
	 * PI-5/PI-6: Highlight the moved text temporarily and scroll to reveal it
	 * Delegates to highlightMovedSections for consistent behavior
	 */
	private highlightMovedText(editor: vscode.TextEditor, range: vscode.Range): void {
		this.highlightMovedSections(editor, [range]);
	}

	/**
	 * PI-6/PI-7: Highlight multiple moved sections simultaneously.
	 * Shows visual feedback for all moved sections and scrolls to reveal the first one.
	 * PI-7: Enhanced with 1.5s duration for quick, non-intrusive feedback.
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
		}, this.highlightDuration);
	}

	/**
	 * Pure text manipulation logic for moving sections.
	 * Delegates to TextLineManipulator for testability.
	 * 
	 * @param lines - Document content as array of lines
	 * @param sectionsToMove - Sections to move with their ranges and labels
	 * @param targetLine - Destination line number
	 * @returns New document lines and the new ranges for highlighting
	 */
	private calculateMovedText(
		lines: string[],
		sectionsToMove: Array<{ range: vscode.Range; label: string }>,
		targetLine: number
	): { newLines: string[]; movedRanges: vscode.Range[] } {
		return this.textManipulator.calculateMovedText(lines, sectionsToMove, targetLine);
	}

	/**
	 * Serialize outline items to JSON for data transfer.
	 * Delegates to OutlineTransfer for testability.
	 * 
	 * @param items - Array of outline items to serialize
	 * @returns JSON string representation
	 */
	private serializeItems(items: OutlineItem[]): string {
		return this.transfer.serialize(items);
	}

	/**
	 * Deserialize JSON drag data to typed objects with ranges.
	 * Delegates to OutlineTransfer for testability.
	 * 
	 * @param json - JSON string from data transfer
	 * @returns Array of items with Range objects and metadata
	 */
	private deserializeItems(json: string): Array<{ range: vscode.Range; label: string; level: number }> {
		return this.transfer.deserialize(json);
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

			// Convert to section format for calculateMovedText
			const sectionsToMove = [{
				range: sourceItem.range,
				label: sourceItem.label
			}];
			
			// Calculate new document content
			const allLines = document.getText().split('\n');
			const { newLines, movedRanges } = this.calculateMovedText(allLines, sectionsToMove, targetLine);
			
			// Replace entire document content
			const newContent = newLines.join('\n');
			const fullRange = new vscode.Range(
				document.lineAt(0).range.start,
				document.lineAt(document.lineCount - 1).range.end
			);
			
			const success = await editor.edit(editBuilder => {
				editBuilder.replace(fullRange, newContent);
			});

			if (success && movedRanges.length > 0) {
				this.highlightMovedText(editor, movedRanges[0]);
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
	 * @param draggedItems - Array of deserialized items with ranges
	 * @param targetLine - Destination line number
	 * @returns Promise that resolves to true if successful
	 */
	async moveSections(
		editor: vscode.TextEditor,
		draggedItems: Array<{ range: vscode.Range; label: string; level?: number }>,
		targetLine: number
	): Promise<boolean> {
		try {
			if (draggedItems.length === 0) {
				console.log('PI-6: No items to move');
				return false;
			}

			const document = editor.document;
			console.log(`PI-6: Moving ${draggedItems.length} sections to line ${targetLine}`);
			
			// Items are already in correct format for calculateMovedText
			const sectionsToMove = draggedItems.map(item => ({
				range: item.range,
				label: item.label
			}));
			
			console.log(`PI-6: Source items: ${sectionsToMove.map(s => `${s.label}(${s.range.start.line}-${s.range.end.line})`).join(', ')}`);
			
			// Calculate new document content
			const allLines = document.getText().split('\n');
			const { newLines, movedRanges } = this.calculateMovedText(allLines, sectionsToMove, targetLine);
			
			// Replace document content
			const newContent = newLines.join('\n');
			const fullRange = new vscode.Range(
				document.lineAt(0).range.start,
				document.lineAt(document.lineCount - 1).range.end
			);
			
			const success = await editor.edit(editBuilder => {
				editBuilder.replace(fullRange, newContent);
			});

			if (success) {
				// Highlight all moved sections
				this.highlightMovedSections(editor, movedRanges);
				console.log(`PI-6: Successfully moved ${sectionsToMove.length} sections`);
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
		// Use provider's already-parsed outline if available (respects code blocks)
		if (this.provider && this.provider.findItemAtLine) {
			const item = this.provider.findItemAtLine(lineNumber);
			if (item) {
				return item;
			}
		}
		
		// Fallback: Parse with code block detection
		// This respects code blocks when finding headings
		interface HeadingInfo {
			line: number;
			level: number;
			text: string;
		}
		
		const headings: HeadingInfo[] = [];
		let inCodeBlock = false;
		
		for (let i = 0; i < document.lineCount; i++) {
			const line = document.lineAt(i);
			const lineText = line.text;
			
			// Track code block state
			if (/^(`{3,}|~{3,})/.test(lineText.trim())) {
				inCodeBlock = !inCodeBlock;
				continue;
			}
			
			// Skip heading detection inside code blocks
			if (inCodeBlock) {
				continue;
			}
			
			const match = lineText.match(/^(#{1,6})\s+(.+)$/);
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
	 * Delegates to OutlineItemProcessor for testability.
	 * 
	 * @param items - Array of selected outline items
	 * @returns Filtered array with no redundant descendants
	 */
	private filterRedundantItems(items: readonly OutlineItem[]): OutlineItem[] {
		return this.itemProcessor.filterRedundantItems(items);
	}

	/**
	 * PI-6: Sort items by their appearance in the document (top to bottom).
	 * Delegates to OutlineItemProcessor for testability.
	 * 
	 * @param items - Array of outline items
	 * @returns Sorted array ordered by starting line number
	 */
	private sortItemsByPosition(items: OutlineItem[]): OutlineItem[] {
		return this.itemProcessor.sortItemsByPosition(items);
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
		// Only allow drag for supported data/markup formats
		const editor = vscode.window.activeTextEditor;
		if (!editor) {
			return;
		}

		const validation = await this.validateDocumentForMove(editor.document);
		if (!validation.isValid) {
			console.log(validation.errorMessage);
			return;
		}
		
		// PI-6: Filter out items that are descendants of other selected items
		const filteredSource = this.filterRedundantItems(source);
		
		// PI-6: Sort items by their document position (top to bottom)
		const sortedSource = this.sortItemsByPosition(filteredSource);
		
		// Serialize and set drag data
		const serialized = this.serializeItems(sortedSource);

		dataTransfer.set(
			this.transfer.mimeType,
			new vscode.DataTransferItem(serialized)
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
		// Only allow drop for supported data/markup formats
		const editor = vscode.window.activeTextEditor;
		if (!editor) {
			return;
		}

		const validation = await this.validateDocumentForMove(editor.document);
		if (!validation.isValid) {
			if (validation.errorMessage?.includes('read-only')) {
				vscode.window.showWarningMessage(validation.errorMessage);
			} else {
				console.log(validation.errorMessage);
			}
			return;
		}
		
		// Get the drag data
		const transferItem = dataTransfer.get(this.transfer.mimeType);
		if (!transferItem) {
			console.log('PI-3: No drag data found');
			return;
		}

		try {
			const draggedItems = this.deserializeItems(transferItem.value as string);
			console.log(`PI-3/PI-6: Drop operation - ${draggedItems.length} item(s) dropped`);
			
			if (draggedItems.length === 0) {
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
			// Use moveSections for all cases to ensure consistent behavior with YAML
			await this.moveSections(editor, draggedItems, targetLine);
			
		} catch (error) {
			console.error('Failed to parse drag data:', error);
		}
	}
}
