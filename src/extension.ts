import * as vscode from 'vscode';
import { MarkdownOutlineProvider } from './markdownOutlineProvider';
import { TreeDragAndDropController } from './treeDragAndDropController';

// Export tree view for testing purposes (PI-2)
export let outlineTreeView: vscode.TreeView<any> | undefined;

/**
 * Activates the Outline Eclipsed extension.
 * 
 * PI-0: Sets up the basic tree view infrastructure and registers event listeners.
 * Behaves like default VS Code Outline view - always visible, shows message when not applicable.
 * Currently supports markdown files only.
 * Future: Will support multiple language providers (JavaScript, TypeScript, Python, etc.)
 * 
 * @param context - The extension context provided by VS Code
 */
export function activate(context: vscode.ExtensionContext) {
	console.log('Outline Eclipsed extension is activating (PI-0)');

	// PI-0: Create markdown-specific provider
	// Future: Factory pattern to create providers based on language
	const markdownProvider = new MarkdownOutlineProvider();

	// PI-3: Create drag and drop controller
	const dragDropController = new TreeDragAndDropController();

	// Register the tree view in the Explorer - always visible like default Outline
	const treeView = vscode.window.createTreeView('outlineEclipsed', {
		treeDataProvider: markdownProvider,
		showCollapseAll: true,
		canSelectMany: true, // PI-6: Enable multi-select for drag and drop
		dragAndDropController: dragDropController // PI-3: Enable drag and drop
	});
	
	// Export tree view for testing (PI-2)
	outlineTreeView = treeView;

	// Update tree view message based on active editor
	const updateTreeViewMessage = (editor: vscode.TextEditor | undefined) => {
		if (!editor) {
			treeView.description = 'No editor active';
		} else if (editor.document.languageId !== 'markdown') {
			treeView.description = `"${editor.document.languageId}" not yet supported in Outline Eclipsed.`;
		} else {
			treeView.description = undefined; // Clear message for markdown files
		}
	};

	// Register command to jump to outline item when clicked
	context.subscriptions.push(
		vscode.commands.registerCommand('outlineEclipsed.gotoItem', (line: number) => {
			const editor = vscode.window.activeTextEditor;
			if (editor) {
				const position = new vscode.Position(line, 0);
				editor.selection = new vscode.Selection(position, position);
				editor.revealRange(new vscode.Range(position, position));
			}
		})
	);

	// PI-3: Register command to select full section range (double-click behavior)
	context.subscriptions.push(
		vscode.commands.registerCommand('outlineEclipsed.selectItem', (line: number) => {
			const editor = vscode.window.activeTextEditor;
			if (!editor || editor.document.languageId !== 'markdown') {
				return;
			}
			
			// Find the outline item at this line
			const item = markdownProvider.findItemAtLine(line);
			if (item) {
				// Select the full range of the section
				const selection = new vscode.Selection(
					item.range.start,
					item.range.end
				);
				editor.selection = selection;
				editor.revealRange(item.range);
			}
		})
	);

	// PI-3: Register command to move section text (for testing and programmatic use)
	context.subscriptions.push(
		vscode.commands.registerCommand('outlineEclipsed.moveSection', async (sourceStartLine: number, targetLine: number) => {
			const editor = vscode.window.activeTextEditor;
			if (!editor || editor.document.languageId !== 'markdown') {
				return false;
			}
			
			return await dragDropController.moveSection(editor, sourceStartLine, targetLine);
		})
	);

	// PI-2: Sync tree view selection with editor cursor position
	const syncTreeViewSelection = async (editor: vscode.TextEditor | undefined) => {
		if (!editor || editor.document.languageId !== 'markdown') {
			return;
		}
		
		const cursorLine = editor.selection.active.line;
		const item = markdownProvider.findItemAtLine(cursorLine);
		
		if (item) {
			// Reveal and select the item in tree view
			console.log(`PI-2: Syncing selection to heading at line ${item.selectionRange.start.line}: ${item.label}`);
			await treeView.reveal(item, { select: true, focus: false });
		}
	};

	// Listen to active editor changes to refresh outline
	context.subscriptions.push(
		vscode.window.onDidChangeActiveTextEditor(editor => {
			updateTreeViewMessage(editor);
			
			if (editor && editor.document.languageId === 'markdown') {
				console.log('PI-0: Markdown editor activated, refreshing outline');
				markdownProvider.refresh(editor.document);
				// PI-2: Sync selection after refresh
				syncTreeViewSelection(editor);
			} else {
				// Clear outline for non-markdown files
				markdownProvider.refresh(undefined);
			}
		})
	);

	// Listen to document changes to refresh outline
	context.subscriptions.push(
		vscode.workspace.onDidChangeTextDocument(event => {
			if (event.document === vscode.window.activeTextEditor?.document &&
			    event.document.languageId === 'markdown') {
				console.log('PI-0: Markdown document changed, refreshing outline');
				markdownProvider.refresh(event.document);
			}
		})
	);

	// PI-2: Listen to cursor position changes to sync tree view selection
	context.subscriptions.push(
		vscode.window.onDidChangeTextEditorSelection(event => {
			if (event.textEditor.document.languageId === 'markdown') {
				syncTreeViewSelection(event.textEditor);
			}
		})
	);

	// Listen to document open events to handle language mode changes
	// When user changes language (e.g., plaintext -> markdown), VS Code fires close + open events
	context.subscriptions.push(
		vscode.workspace.onDidOpenTextDocument(document => {
			// Only process if this is the active document
			if (document === vscode.window.activeTextEditor?.document) {
				console.log(`PI-0: Document opened/language changed: ${document.languageId}`);
				updateTreeViewMessage(vscode.window.activeTextEditor);
				
				if (document.languageId === 'markdown') {
					markdownProvider.refresh(document);
				} else {
					markdownProvider.refresh(undefined);
				}
			}
		})
	);

	// Initial load - set message and refresh if markdown file is open
	updateTreeViewMessage(vscode.window.activeTextEditor);
	if (vscode.window.activeTextEditor?.document.languageId === 'markdown') {
		console.log('PI-0: Initial markdown document detected');
		markdownProvider.refresh(vscode.window.activeTextEditor.document);
		// PI-2: Sync initial selection
		syncTreeViewSelection(vscode.window.activeTextEditor);
	}

	context.subscriptions.push(treeView);
	context.subscriptions.push(dragDropController); // PI-5: Dispose controller on deactivate
	
	console.log('Markdown Outline Reorder extension activated successfully (PI-0)');
}

/**
 * Deactivates the extension.
 * 
 * Clean up resources if needed.
 */
export function deactivate() {
	console.log('Markdown Outline Reorder extension deactivated');
}
