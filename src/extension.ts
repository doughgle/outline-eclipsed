import * as vscode from 'vscode';
import { MultiLanguageOutlineProvider } from './multiLanguageOutlineProvider';
import { TreeDragAndDropController } from './treeDragAndDropController';
import { OutlineItem } from './outlineItem';

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

	const updateTreeViewMessage = (editor: vscode.TextEditor | undefined, message?: string) => {
		if (!editor) {
			treeView.description = 'No editor active';
		} else if (message) {
			treeView.description = message;
		} else {
			// Clear description - all languages with symbol providers are supported
			treeView.description = undefined;
		}
	};

	/**
	 * Refresh outline with timeout for language server activation.
	 * If symbols aren't available within 350ms, shows a message.
	 */
	const refreshWithTimeout = async (document: vscode.TextDocument) => {
		const startTime = Date.now();
		
		// Start the refresh
		await provider.refresh(document);
		
		// Check if we got symbols
		if (provider.rootItems.length === 0) {
			const elapsed = Date.now() - startTime;
			const remainingTime = Math.max(0, 350 - elapsed);
			
			// Wait remaining time for symbols to become available
			if (remainingTime > 0) {
				await new Promise(resolve => setTimeout(resolve, remainingTime));
				// Try refresh again
				await provider.refresh(document);
			}
			
			// If still no symbols, show message
			if (provider.rootItems.length === 0) {
				updateTreeViewMessage(
					vscode.window.activeTextEditor,
					`No outline symbols for ${document.languageId}`
				);
			} else {
				// Symbols appeared, clear message
				updateTreeViewMessage(vscode.window.activeTextEditor);
			}
		} else {
			// Got symbols immediately, clear any message
			updateTreeViewMessage(vscode.window.activeTextEditor);
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

	/**
	 * PI-12: Helper function to recursively expand a tree item and all its children.
	 * Expands the given item and then recursively expands all of its descendants in parallel.
	 * 
	 * @param treeView - The tree view instance
	 * @param item - The tree item to expand
	 */
	const expandItemRecursively = async (treeView: vscode.TreeView<OutlineItem>, item: OutlineItem): Promise<void> => {
		if (item.children && item.children.length > 0) {
			try {
				await treeView.reveal(item, { select: false, focus: false, expand: true });
				// Expand all children in parallel for better performance
				await Promise.all(item.children.map((child: OutlineItem) => expandItemRecursively(treeView, child)));
			} catch (error) {
				// Silently ignore reveal errors (e.g., item not in tree)
			}
		}
	};

	// PI-12: Command to expand all nodes in the tree view
	context.subscriptions.push(
		vscode.commands.registerCommand('outlineEclipsed.expandAll', async () => {
			if (!treeView.visible) {
				return;
			}
			
			// Expand all root items in parallel
			await Promise.all(provider.rootItems.map((item: OutlineItem) => expandItemRecursively(treeView, item)));
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
				refreshWithTimeout(editor.document);
				syncTreeViewSelection(editor);
			} else {
				console.log('[TRACE] No editor active');
				provider.refresh(undefined);
			}
		})
	);

	// Listen for diagnostics changes - indicates language server activity
	context.subscriptions.push(
		vscode.languages.onDidChangeDiagnostics(event => {
			const editor = vscode.window.activeTextEditor;
			if (!editor) {
				return;
			}
			
			// Check if diagnostics changed for the active document
			const affectsActiveDoc = event.uris.some(uri => uri.toString() === editor.document.uri.toString());
			if (affectsActiveDoc && provider.rootItems.length === 0) {
				console.log(`[TRACE] Diagnostics changed for ${editor.document.languageId}, refreshing outline`);
				refreshWithTimeout(editor.document);
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
				refreshWithTimeout(document);
				// DON'T call syncTreeViewSelection here - it will be called by onDidChangeTextEditorSelection
				// which fires after the tree view has finished updating
			}
		})
	);

	updateTreeViewMessage(vscode.window.activeTextEditor);
	if (vscode.window.activeTextEditor) {
		console.log(`[TRACE] Initial document detected: ${vscode.window.activeTextEditor.document.languageId}`);
		refreshWithTimeout(vscode.window.activeTextEditor.document);
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
