import * as vscode from 'vscode';
import { MultiLanguageOutlineProvider } from './multiLanguageOutlineProvider';
import { TreeDragAndDropController } from './treeDragAndDropController';
import { OutlineItem } from './outlineItem';
import { OutlineItemProcessor } from './outlineItemProcessor';
import { initializeLogger, getLogger, readConfiguredLogLevel } from './logger';

// Export tree view and provider for testing purposes (PI-2)
export let outlineTreeView: vscode.TreeView<OutlineItem> | undefined;
export let outlineProvider: MultiLanguageOutlineProvider | undefined;

const DEFAULT_HIGHLIGHT_DURATION = 1500;

/** Milliseconds to wait for a language server to deliver symbols after a document opens. */
const SYMBOL_ACTIVATION_TIMEOUT_MS = 350;

/**
 * PI-19: Read the configured highlight duration from VS Code workspace settings.
 * Returns `defaultDuration` when the setting is absent or not a number.
 * Bounds enforcement and NaN guarding are delegated to TreeDragAndDropController.
 */
function readConfiguredHighlightDuration(defaultDuration: number): number {
	const configured = vscode.workspace
		.getConfiguration('outlineEclipsed')
		.get<number | undefined>('highlightDuration');
	if (typeof configured !== 'number') {
		return defaultDuration;
	}
	return configured;
}

/**
 * Activates the Outline Eclipsed extension.
 * 
 * PI-0: Sets up the basic tree view infrastructure and registers event listeners.
 * Behaves like default VS Code Outline view - always visible, shows message when not applicable.
 * Supports markdown files with custom provider, and any language with symbol provider
 * via generic provider.
 * 
 * @param context - The extension context provided by VS Code
 */
export function activate(context: vscode.ExtensionContext) {
	const logger = initializeLogger('Outline Eclipsed', readConfiguredLogLevel('info'));
	context.subscriptions.push(logger);

	logger.info('Outline Eclipsed extension is activating');
	const treeViewId = 'outlineEclipsed';

	// Use multi-language provider that automatically switches between language-specific providers
	const provider = new MultiLanguageOutlineProvider();
	const initialHighlightDuration = readConfiguredHighlightDuration(DEFAULT_HIGHLIGHT_DURATION);
	const dragDropController = new TreeDragAndDropController(provider, initialHighlightDuration);
	const itemProcessor = new OutlineItemProcessor();

	// Update log level and highlight duration when configuration changes at runtime
	context.subscriptions.push(
		vscode.workspace.onDidChangeConfiguration(event => {
			if (event.affectsConfiguration('outlineEclipsed.logLevel')) {
				getLogger().setLevel(readConfiguredLogLevel('info'));
			}
			if (event.affectsConfiguration('outlineEclipsed.highlightDuration')) {
				dragDropController.setHighlightDuration(
					readConfiguredHighlightDuration(DEFAULT_HIGHLIGHT_DURATION)
				);
			}
		})
	);

	const treeView = vscode.window.createTreeView(treeViewId, {
		treeDataProvider: provider,
		showCollapseAll: false, // Using custom collapse all to track state
		canSelectMany: true,
		dragAndDropController: dragDropController
	});
	
	// Export tree view and provider for testing (PI-2)
	outlineTreeView = treeView;
	outlineProvider = provider;

	// Track tree expansion state for toggling between expand/collapse buttons
	// Set tracks which items are currently expanded
	const expandedItems = new Set<OutlineItem>();
	let isApplyingTreeState = false;
	const describeItem = (item: OutlineItem): string =>
		`${item.label ?? '<unnamed>'}@${item.range.start.line}`;
	const setExpandedState = (item: OutlineItem, expanded: boolean, source: string): void => {
		if (expanded) {
			expandedItems.add(item);
		} else {
			expandedItems.delete(item);
		}
		logger.trace('expanded state changed', {
			source, action: expanded ? 'add' : 'delete',
			item: describeItem(item), size: expandedItems.size
		});
	};
	const clearExpandedState = (source: string): void => {
		expandedItems.clear();
		logger.trace('expanded state cleared', { source, size: expandedItems.size });
	};

	const shouldAlwaysExpandOnOpen = (): boolean =>
		vscode.workspace.getConfiguration('outline').get<string>('collapseItems') === 'alwaysExpand';
	
	const updateButtonState = () => {
		// Show "Collapse All" button if any items are expanded
		// Show "Expand All" button if no items are expanded (tree is fully collapsed)
		const hasExpandedItems = expandedItems.size > 0;
		vscode.commands.executeCommand('setContext', 'outlineEclipsed.canExpand', !hasExpandedItems);
		vscode.commands.executeCommand('setContext', 'outlineEclipsed.canCollapse', hasExpandedItems);
		logger.trace('updateButtonState', {
			canExpand: !hasExpandedItems, canCollapse: hasExpandedItems,
			expandedItems: expandedItems.size
		});
	};
	
	// Initialize button state - tree starts fully collapsed
	updateButtonState();

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
		
		await provider.refresh(document);
		
		if (provider.rootItems.length === 0) {
			const elapsed = Date.now() - startTime;
			const remainingTime = Math.max(0, SYMBOL_ACTIVATION_TIMEOUT_MS - elapsed);
			
			if (remainingTime > 0) {
				await new Promise(resolve => setTimeout(resolve, remainingTime));
				await provider.refresh(document);
			}
			
			if (provider.rootItems.length === 0) {
				updateTreeViewMessage(
					vscode.window.activeTextEditor,
					`No outline symbols for ${document.languageId}`
				);
			} else {
				updateTreeViewMessage(vscode.window.activeTextEditor);
			}
		} else {
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
	 * Tracks expanded items for button state management.
	 * 
	 * @param treeView - The tree view instance
	 * @param item - The tree item to expand
	 */
	const expandItemRecursively = async (
		treeView: vscode.TreeView<OutlineItem>, item: OutlineItem
	): Promise<void> => {
		if (item.children && item.children.length > 0) {
			try {
				logger.trace('expandItemRecursively: reveal expand=true', { item: describeItem(item) });
				await treeView.reveal(item, { select: false, focus: false, expand: true });
				setExpandedState(item, true, 'expandItemRecursively');
				// Expand all children in parallel for better performance
				await Promise.all(
					item.children.map((child: OutlineItem) => expandItemRecursively(treeView, child))
				);
			} catch (error) {
				logger.error('expandItemRecursively: reveal failed', {
					item: describeItem(item), error: String(error)
				});
			}
		}
	};

	const applyInitialTreeState = async (): Promise<void> => {
		if (!treeView.visible) {
			updateButtonState();
			return;
		}

		isApplyingTreeState = true;
		try {
			clearExpandedState('applyInitialTreeState:start');

			if (shouldAlwaysExpandOnOpen()) {
				await Promise.all(
					provider.rootItems.map((item: OutlineItem) => expandItemRecursively(treeView, item))
				);
			}

			updateButtonState();
		} finally {
			isApplyingTreeState = false;
		}
	};

	// PI-12: Command to expand all nodes in the tree view
	context.subscriptions.push(
		vscode.commands.registerCommand('outlineEclipsed.expandAll', async () => {
			logger.trace('expandAll: command invoked');
			if (!treeView.visible) {
				logger.trace('expandAll: tree view not visible, skipping');
				return;
			}
			
			isApplyingTreeState = true;
			try {
				logger.trace('expandAll: expanding root items', { count: provider.rootItems.length });
				clearExpandedState('expandAll:start');
				await Promise.all(
					provider.rootItems.map((item: OutlineItem) => expandItemRecursively(treeView, item))
				);
				updateButtonState();
				logger.trace('expandAll: complete', { expandedItems: expandedItems.size });
			} finally {
				isApplyingTreeState = false;
			}
		})
	);

	// PI-12: Command to collapse all nodes in the tree view
	context.subscriptions.push(
		vscode.commands.registerCommand('outlineEclipsed.collapseAll', async () => {
			logger.trace('collapseAll: command invoked');
			if (!treeView.visible) {
				logger.trace('collapseAll: tree view not visible, skipping');
				return;
			}
			
			isApplyingTreeState = true;
			try {
				const collapseAllCommand = `workbench.actions.treeView.${treeViewId}.collapseAll`;
				logger.trace('collapseAll: executing', { command: collapseAllCommand });
				await vscode.commands.executeCommand(collapseAllCommand);
				clearExpandedState('collapseAll:post-command');
				
				// Update button state
				updateButtonState();
				logger.trace('collapseAll: complete', { expandedItems: expandedItems.size });
			} finally {
				isApplyingTreeState = false;
			}
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand(
			'outlineEclipsed.moveSection',
			async (sourceStartLine: number, targetLine: number) => {
				const editor = vscode.window.activeTextEditor;
				if (!editor) {
					return false;
				}
				
				return await dragDropController.moveSection(editor, sourceStartLine, targetLine);
			}
		)
	);

	// PI-18: Command to copy labels of selected outline items to clipboard
	context.subscriptions.push(
		vscode.commands.registerCommand('outlineEclipsed.copyLabels', async () => {
			const selected = [...treeView.selection];
			if (selected.length === 0) {
				return;
			}

			const text = itemProcessor.extractLabels(selected);

			try {
				await vscode.env.clipboard.writeText(text);
				logger.trace('copyLabels: copied labels to clipboard', { count: selected.length });
			} catch (error) {
				logger.error('copyLabels: failed to write to clipboard', { error: String(error) });
			}
		})
	);

	const syncTreeViewSelection = async (editor: vscode.TextEditor | undefined) => {
		if (!editor) {
			logger.trace('syncTreeViewSelection: no editor');
			return;
		}
		
		// BUGFIX: Only sync selection if tree view is visible
		// The reveal() API has a side effect: it auto-shows hidden tree views
		// We respect the user's choice to hide/show the tree view
		if (!treeView.visible) {
			logger.trace('syncTreeViewSelection: tree view not visible, skipping');
			return;
		}

		if (isApplyingTreeState) {
			logger.trace('syncTreeViewSelection: tree state operation in progress, skipping');
			return;
		}
		
		const cursorLine = editor.selection.active.line;
		logger.trace('syncTreeViewSelection: finding item', { line: cursorLine });
		const item = provider.findItemAtLine(cursorLine);
		
		if (item) {
			logger.trace('syncTreeViewSelection: found item, calling reveal()', {
				label: String(item.label)
			});
			try {
				await treeView.reveal(item, { select: true, focus: false, expand: false });
				logger.trace('syncTreeViewSelection: reveal() completed successfully');
			} catch (error) {
				logger.error('syncTreeViewSelection: reveal() failed', { error: String(error) });
			}
		} else {
			logger.trace('syncTreeViewSelection: no item found', { line: cursorLine });
		}
	};

	// PI-12: Listen to tree expansion events to update button state
	context.subscriptions.push(
		treeView.onDidExpandElement((event: vscode.TreeViewExpansionEvent<OutlineItem>) => {
			if (isApplyingTreeState) {
				logger.trace('onDidExpandElement: ignored during apply', { item: describeItem(event.element) });
				return;
			}
			logger.trace('onDidExpandElement', { item: describeItem(event.element) });
			setExpandedState(event.element, true, 'onDidExpandElement');
			updateButtonState();
		})
	);

	// PI-12: Listen to tree collapse events to update button state
	context.subscriptions.push(
		treeView.onDidCollapseElement((event: vscode.TreeViewExpansionEvent<OutlineItem>) => {
			if (isApplyingTreeState) {
				logger.trace('onDidCollapseElement: ignored during apply', {
					item: describeItem(event.element)
				});
				return;
			}
			logger.trace('onDidCollapseElement', { item: describeItem(event.element) });
			setExpandedState(event.element, false, 'onDidCollapseElement');
			updateButtonState();
		})
	);

	context.subscriptions.push(
		vscode.window.onDidChangeActiveTextEditor(async editor => {
			logger.trace('onDidChangeActiveTextEditor');
			updateTreeViewMessage(editor);

			if (editor) {
				logger.trace('editor activated', { languageId: editor.document.languageId });
				await refreshWithTimeout(editor.document);
				clearExpandedState('onDidChangeActiveTextEditor:editor-activated');
				updateButtonState();
				await applyInitialTreeState();
				await syncTreeViewSelection(editor);
			} else {
				logger.trace('no editor active');
				await provider.refresh(undefined);
				clearExpandedState('onDidChangeActiveTextEditor:no-editor');
				updateButtonState();
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
			const affectsActiveDoc = event.uris.some(
				uri => uri.toString() === editor.document.uri.toString()
			);
			if (affectsActiveDoc && provider.rootItems.length === 0) {
				logger.trace('diagnostics changed, refreshing outline', {
					languageId: editor.document.languageId
				});
				refreshWithTimeout(editor.document);
			}
		})
	);

	context.subscriptions.push(
		vscode.workspace.onDidChangeTextDocument(event => {
			if (event.document === vscode.window.activeTextEditor?.document) {
				logger.trace('onDidChangeTextDocument', { languageId: event.document.languageId });
				provider.refresh(event.document);
			}
		})
	);

	context.subscriptions.push(
		vscode.window.onDidChangeTextEditorSelection(event => {
			// BUGFIX: Filter out non-document editors (Output channels, debug consoles, etc.)
			// to prevent feedback loops where logging triggers selection events
			if (event.textEditor.document.uri.scheme !== 'file' && 
			    event.textEditor.document.uri.scheme !== 'untitled') {
				return;
			}
			logger.trace('onDidChangeTextEditorSelection', { line: event.textEditor.selection.active.line });
			syncTreeViewSelection(event.textEditor);
		})
	);

	context.subscriptions.push(
		vscode.workspace.onDidOpenTextDocument(document => {
			if (document === vscode.window.activeTextEditor?.document) {
				logger.trace('onDidOpenTextDocument', { languageId: document.languageId });
				updateTreeViewMessage(vscode.window.activeTextEditor);
				refreshWithTimeout(document);
				// DON'T call syncTreeViewSelection here - it will be called by onDidChangeTextEditorSelection
				// which fires after the tree view has finished updating
			}
		})
	);

	updateTreeViewMessage(vscode.window.activeTextEditor);
	if (vscode.window.activeTextEditor) {
		const initialEditor = vscode.window.activeTextEditor;
		logger.trace('initial document detected', { languageId: initialEditor.document.languageId });
		void (async () => {
			await refreshWithTimeout(initialEditor.document);
			await applyInitialTreeState();
			await syncTreeViewSelection(vscode.window.activeTextEditor);
		})();
	}

	context.subscriptions.push(treeView);
	context.subscriptions.push(dragDropController);
	
	logger.info('Outline Eclipsed extension activated successfully');
}

/**
 * Deactivates the extension.
 * 
 * Clean up resources if needed.
 */
export function deactivate() {
	getLogger().info('Outline Eclipsed extension deactivated');
}

