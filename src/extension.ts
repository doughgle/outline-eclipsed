import * as vscode from 'vscode';
import { MultiLanguageOutlineProvider } from './multiLanguageOutlineProvider';
import { TreeDragAndDropController } from './treeDragAndDropController';

// Export tree view for testing purposes (PI-2)
export let outlineTreeView: vscode.TreeView<any> | undefined;

/**
 * Activates the Outline Eclipsed extension.
 * 
 * PI-0: Sets up the basic tree view infrastructure and registers event listeners.
 * Behaves like default VS Code Outline view - always visible, shows message when not applicable.
 * Supports markdown files with custom provider, and any language with symbol provider via generic provider.
 * 
 * @param context - The extension context provided by VS Code
 */
export function activate(context: vscode.ExtensionContext) {
	console.log('Outline Eclipsed extension is activating');

	// Use multi-language provider that automatically switches between language-specific providers
	const provider = new MultiLanguageOutlineProvider();
	const dragDropController = new TreeDragAndDropController(provider);

	const treeView = vscode.window.createTreeView('outlineEclipsed', {
		treeDataProvider: provider,
		showCollapseAll: true,
		canSelectMany: true,
		dragAndDropController: dragDropController
	});
	
	// Export tree view for testing (PI-2)
	outlineTreeView = treeView;

	const updateTreeViewMessage = (editor: vscode.TextEditor | undefined) => {
		if (!editor) {
			treeView.description = 'No editor active';
		} else {
			// Clear description - all languages with symbol providers are supported
			treeView.description = undefined;
		}
	};

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
			if (!editor) {
				return;
			}
			
			const item = provider.findItemAtLine(line);
			if (item) {
				const selection = new vscode.Selection(
					item.range.start,
					item.range.end
				);
				editor.selection = selection;
				editor.revealRange(item.range);
			}
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('outlineEclipsed.moveSection', async (sourceStartLine: number, targetLine: number) => {
			const editor = vscode.window.activeTextEditor;
			if (!editor) {
				return false;
			}
			
			return await dragDropController.moveSection(editor, sourceStartLine, targetLine);
		})
	);

	const syncTreeViewSelection = async (editor: vscode.TextEditor | undefined) => {
		if (!editor) {
			console.log('[TRACE] syncTreeViewSelection: no editor');
			return;
		}
		
		// BUGFIX: Only sync selection if tree view is visible
		// The reveal() API has a side effect: it auto-shows hidden tree views
		// We respect the user's choice to hide/show the tree view
		if (!treeView.visible) {
			console.log('[TRACE] syncTreeViewSelection: tree view not visible, skipping');
			return;
		}
		
		const cursorLine = editor.selection.active.line;
		console.log(`[TRACE] syncTreeViewSelection: finding item at line ${cursorLine}`);
		const item = provider.findItemAtLine(cursorLine);
		
		if (item) {
			console.log(`[TRACE] syncTreeViewSelection: found item "${item.label}", calling reveal()`);
			try {
				await treeView.reveal(item, { select: true, focus: false });
				console.log(`[TRACE] syncTreeViewSelection: reveal() completed successfully`);
			} catch (error) {
				console.error(`[TRACE] syncTreeViewSelection: reveal() failed:`, error);
			}
		} else {
			console.log(`[TRACE] syncTreeViewSelection: no item found at line ${cursorLine}`);
		}
	};

	context.subscriptions.push(
		vscode.window.onDidChangeActiveTextEditor(editor => {
			console.log('[TRACE] onDidChangeActiveTextEditor');
			updateTreeViewMessage(editor);
			
			if (editor) {
				console.log(`[TRACE] Editor activated: ${editor.document.languageId}`);
				provider.refresh(editor.document);
				syncTreeViewSelection(editor);
			} else {
				console.log('[TRACE] No editor active');
				provider.refresh(undefined);
			}
		})
	);

	context.subscriptions.push(
		vscode.workspace.onDidChangeTextDocument(event => {
			if (event.document === vscode.window.activeTextEditor?.document) {
				console.log(`[TRACE] onDidChangeTextDocument: ${event.document.languageId}`);
				provider.refresh(event.document);
			}
		})
	);

	context.subscriptions.push(
		vscode.window.onDidChangeTextEditorSelection(event => {
			console.log(`[TRACE] onDidChangeTextEditorSelection: line ${event.textEditor.selection.active.line}`);
			syncTreeViewSelection(event.textEditor);
		})
	);

	context.subscriptions.push(
		vscode.workspace.onDidOpenTextDocument(document => {
			if (document === vscode.window.activeTextEditor?.document) {
				console.log(`[TRACE] onDidOpenTextDocument: ${document.languageId}`);
				updateTreeViewMessage(vscode.window.activeTextEditor);
				provider.refresh(document);
				// DON'T call syncTreeViewSelection here - it will be called by onDidChangeTextEditorSelection
				// which fires after the tree view has finished updating
			}
		})
	);

	updateTreeViewMessage(vscode.window.activeTextEditor);
	if (vscode.window.activeTextEditor) {
		console.log(`[TRACE] Initial document detected: ${vscode.window.activeTextEditor.document.languageId}`);
		provider.refresh(vscode.window.activeTextEditor.document);
		syncTreeViewSelection(vscode.window.activeTextEditor);
	}

	context.subscriptions.push(treeView);
	context.subscriptions.push(dragDropController);
	
	console.log('Outline Eclipsed extension activated successfully');
}

/**
 * Deactivates the extension.
 * 
 * Clean up resources if needed.
 */
export function deactivate() {
	console.log('Outline Eclipsed extension deactivated');
}
