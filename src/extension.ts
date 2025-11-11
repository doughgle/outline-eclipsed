import * as vscode from 'vscode';
import { MarkdownOutlineProvider } from './markdownOutlineProvider';
import { GenericOutlineProvider } from './genericOutlineProvider';
import { OutlineProvider } from './outlineProvider';
import { TreeDragAndDropController } from './treeDragAndDropController';

// Export tree view for testing purposes (PI-2)
export let outlineTreeView: vscode.TreeView<any> | undefined;

/**
 * List of languages that are explicitly supported with custom providers.
 * Markdown gets special handling for heading syntax.
 */
const CUSTOM_LANGUAGE_PROVIDERS: { [key: string]: () => OutlineProvider } = {
	'markdown': () => new MarkdownOutlineProvider(),
};

/**
 * Creates an appropriate outline provider for the given language.
 * Returns a specialized provider if available, otherwise returns a generic provider.
 * 
 * @param languageId - The language ID of the document
 * @returns OutlineProvider instance for the language
 */
function createProviderForLanguage(languageId: string): OutlineProvider {
	// Check if we have a custom provider for this language
	if (CUSTOM_LANGUAGE_PROVIDERS[languageId]) {
		return CUSTOM_LANGUAGE_PROVIDERS[languageId]();
	}
	
	// Use generic provider for all other languages
	return new GenericOutlineProvider();
}

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

	// Start with a generic provider - will be updated when editor changes
	let currentProvider: OutlineProvider = new GenericOutlineProvider();
	let dragDropController = new TreeDragAndDropController(currentProvider);

	const treeView = vscode.window.createTreeView('outlineEclipsed', {
		treeDataProvider: currentProvider,
		showCollapseAll: true,
		canSelectMany: true,
		dragAndDropController: dragDropController
	});
	
	// Export tree view for testing (PI-2)
	outlineTreeView = treeView;

	/**
	 * Updates the provider when the language changes.
	 * This allows supporting multiple languages dynamically.
	 */
	const updateProvider = (languageId: string) => {
		const newProvider = createProviderForLanguage(languageId);
		
		// Only recreate if language provider type changed
		if (newProvider.constructor.name !== currentProvider.constructor.name) {
			console.log(`Switching to ${newProvider.constructor.name} for language: ${languageId}`);
			currentProvider = newProvider;
			dragDropController = new TreeDragAndDropController(currentProvider);
			
			// Update tree view with new provider
			// Note: VS Code doesn't support changing tree data provider dynamically,
			// so we work around this by having the drag controller reference the current provider
			(treeView as any).dataProvider = currentProvider;
		}
		
		return currentProvider;
	};

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
			
			const item = currentProvider.findItemAtLine(line);
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
			return;
		}
		
		// BUGFIX: Only sync selection if tree view is visible
		// The reveal() API has a side effect: it auto-shows hidden tree views
		// We respect the user's choice to hide/show the tree view
		if (!treeView.visible) {
			return;
		}
		
		const cursorLine = editor.selection.active.line;
		const item = currentProvider.findItemAtLine(cursorLine);
		
		if (item) {
			console.log(`Syncing selection to item at line ${item.selectionRange.start.line}: ${item.label}`);
			await treeView.reveal(item, { select: true, focus: false });
		}
	};

	context.subscriptions.push(
		vscode.window.onDidChangeActiveTextEditor(editor => {
			updateTreeViewMessage(editor);
			
			if (editor) {
				console.log(`Editor activated: ${editor.document.languageId}`);
				const provider = updateProvider(editor.document.languageId);
				provider.refresh(editor.document);
				syncTreeViewSelection(editor);
			} else {
				currentProvider.refresh(undefined);
			}
		})
	);

	context.subscriptions.push(
		vscode.workspace.onDidChangeTextDocument(event => {
			if (event.document === vscode.window.activeTextEditor?.document) {
				console.log(`Document changed: ${event.document.languageId}`);
				currentProvider.refresh(event.document);
			}
		})
	);

	context.subscriptions.push(
		vscode.window.onDidChangeTextEditorSelection(event => {
			syncTreeViewSelection(event.textEditor);
		})
	);

	context.subscriptions.push(
		vscode.workspace.onDidOpenTextDocument(document => {
			if (document === vscode.window.activeTextEditor?.document) {
				console.log(`Document opened/language changed: ${document.languageId}`);
				updateTreeViewMessage(vscode.window.activeTextEditor);
				
				const provider = updateProvider(document.languageId);
				provider.refresh(document);
			}
		})
	);

	updateTreeViewMessage(vscode.window.activeTextEditor);
	if (vscode.window.activeTextEditor) {
		console.log(`Initial document detected: ${vscode.window.activeTextEditor.document.languageId}`);
		const provider = updateProvider(vscode.window.activeTextEditor.document.languageId);
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
