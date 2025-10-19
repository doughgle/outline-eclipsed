import * as vscode from 'vscode';
import { MarkdownOutlineProvider } from './markdownOutlineProvider';

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

	// Register the tree view in the Explorer - always visible like default Outline
	const treeView = vscode.window.createTreeView('outlineEclipsed', {
		treeDataProvider: markdownProvider,
		showCollapseAll: true,
		canSelectMany: false // PI-0: Single selection only, multi-select in PI-5
	});

	// Update tree view message based on active editor
	const updateTreeViewMessage = (editor: vscode.TextEditor | undefined) => {
		if (!editor) {
			treeView.message = 'No editor active';
		} else if (editor.document.languageId !== 'markdown') {
			treeView.message = 'The active editor cannot provide outline information.';
		} else {
			treeView.message = undefined; // Clear message for markdown files
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

	// Listen to active editor changes to refresh outline
	context.subscriptions.push(
		vscode.window.onDidChangeActiveTextEditor(editor => {
			updateTreeViewMessage(editor);
			
			if (editor && editor.document.languageId === 'markdown') {
				console.log('PI-0: Markdown editor activated, refreshing outline');
				markdownProvider.refresh(editor.document);
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
	}

	context.subscriptions.push(treeView);
	
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
