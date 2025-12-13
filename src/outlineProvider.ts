import * as vscode from 'vscode';
import { OutlineItem } from './outlineItem';

/**
 * Abstract base class for language-specific outline providers.
 * Provides tree data for the outline view.
 * 
 * PI-0: Stub implementation returns empty tree
 * Future: Subclasses will implement language-specific parsing
 */
export abstract class OutlineProvider implements vscode.TreeDataProvider<OutlineItem> {
    
    protected _onDidChangeTreeData = new vscode.EventEmitter<OutlineItem | undefined | null | void>();
    readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

    protected items: OutlineItem[] = [];
    protected currentDocument: vscode.TextDocument | undefined;
    protected isReadOnly: boolean = false;

    /**
     * Check if a document is read-only.
     * @param document - Document to check
     * @returns Promise resolving to true if read-only
     */
    protected async checkIfReadOnly(document: vscode.TextDocument): Promise<boolean> {
        // Check if the file system scheme supports writing
        const isWritableFS = vscode.workspace.fs.isWritableFileSystem(document.uri.scheme);
        if (isWritableFS === false) {
            return true;
        }
        
        // For file:// scheme, check file permissions
        if (document.uri.scheme === 'file') {
            try {
                const stat = await vscode.workspace.fs.stat(document.uri);
                if (stat.permissions !== undefined && (stat.permissions & vscode.FilePermission.Readonly)) {
                    return true;
                }
            } catch (error) {
                // If we can't stat the file, assume it's writable
            }
        }
        
        return false;
    }

    /**
     * PI-6: Getter for root items (excludes placeholders).
     * Used by tests to verify parsing logic without UI enhancements.
     */
    get rootItems(): OutlineItem[] {
        return this.items;
    }

    /**
     * Refreshes the tree view with the current document.
     * Pass undefined to clear the tree view.
     * 
     * @param document - Document to parse, or undefined to clear
     */
    async refresh(document?: vscode.TextDocument): Promise<void> {
        if (document) {
            this.currentDocument = document;
            this.isReadOnly = await this.checkIfReadOnly(document);
            this.items = await this.parseDocument(document);
        } else {
            // Clear the tree when no document provided
            this.currentDocument = undefined;
            this.isReadOnly = false;
            this.items = [];
        }
        this._onDidChangeTreeData.fire();
    }

    /**
     * Language-specific parsing logic - implemented by subclasses
     * @param document - Document to parse
     * @returns Array of top-level outline items or Promise resolving to array
     */
    protected abstract parseDocument(document: vscode.TextDocument): OutlineItem[] | Promise<OutlineItem[]>;

    /**
     * Required by TreeDataProvider - returns tree item for given element
     * Updates collapsibleState based on current children count (PI-2)
     */
    getTreeItem(element: OutlineItem): vscode.TreeItem {
        // Update collapsibleState based on whether element has children
        // This is necessary because children are added after construction in buildHierarchy
        element.collapsibleState = element.children.length > 0
            ? vscode.TreeItemCollapsibleState.Collapsed
            : vscode.TreeItemCollapsibleState.None;
        
        return element;
    }

    /**
     * Required by TreeDataProvider - returns children for given element.
     * PI-6: Adds 2 placeholder items at end of root items for easy end-of-document drops.
     * Adds read-only warning item at the top when file is read-only.
     */
    getChildren(element?: OutlineItem): Thenable<OutlineItem[]> {
        if (!this.currentDocument) {
            return Promise.resolve([]);
        }

        if (element) {
            return Promise.resolve(element.children);
        } else {
            const result: OutlineItem[] = [];
            
            // Add read-only warning item at the top if file is read-only
            if (this.isReadOnly) {
                result.push(this.createReadOnlyWarningItem());
            }
            
            // Add regular items
            result.push(...this.items);
            
            // PI-6: Add 1 placeholder item at end for drop zone
            const placeholders = this.createPlaceholders();
            result.push(...placeholders);
            
            return Promise.resolve(result);
        }
    }

    /**
     * Creates a warning item to display when file is read-only.
     * Shows at the top of the tree with a clear icon and message.
     * 
     * @returns Warning item for read-only status
     */
    private createReadOnlyWarningItem(): OutlineItem {
        const range = new vscode.Range(0, 0, 0, 0);
        
        const warningItem = new OutlineItem(
            'File is Read-Only',
            0,
            range,
            range,
            [],
            vscode.SymbolKind.Null
        );
        
        // Use a warning/lock icon
        warningItem.iconPath = new vscode.ThemeIcon('lock', new vscode.ThemeColor('problemsWarningIcon.foreground'));
        
        // Override description and tooltip
        warningItem.description = 'Drag & drop disabled';
        const tooltip = new vscode.MarkdownString();
        tooltip.appendMarkdown('$(warning) **This file is read-only**\n\n');
        tooltip.appendMarkdown('Drag and drop operations are disabled.\n\n');
        tooltip.appendMarkdown('Make the file writable to enable editing.');
        warningItem.tooltip = tooltip;
        
        // Remove command so clicking doesn't navigate
        warningItem.command = undefined;
        
        // Mark as warning for identification
        (warningItem as any).isReadOnlyWarning = true;
        warningItem.contextValue = 'readOnlyWarning';
        
        return warningItem;
    }

    /**
     * PI-6: Creates placeholder item for end-of-document drop zone.
     * Creates 1 empty item that appears at the end of the tree view.
     * 
     * @returns Array with 1 placeholder item
     */
    private createPlaceholders(): OutlineItem[] {
        if (!this.currentDocument) {
            return [];
        }

        const doc = this.currentDocument;
        const endLine = doc.lineCount - 1;
        const endChar = doc.lineAt(endLine).text.length;
        
        const range = new vscode.Range(endLine, endChar, endLine, endChar);
        
        // Create 1 placeholder item (1 blank line of drop space)
        const placeholder = new OutlineItem(
            '', // Empty label (invisible)
            0,  // Level 0 (not a real heading)
            range,
            range,
            [],
            vscode.SymbolKind.Null
        );
        
        // Remove icon to make it truly blank
        placeholder.iconPath = undefined;
        
        // Mark as placeholder for identification
        (placeholder as any).isPlaceholder = true;
        
        return [placeholder];
    }

    /**
     * Required by TreeDataProvider - returns parent for given element.
     * PI-2: Needed for TreeView.reveal() to work correctly.
     * 
     * @param element - Item to get parent for
     * @returns Parent item or undefined if element is root
     */
    getParent(element: OutlineItem): vscode.ProviderResult<OutlineItem> {
        return element.parent;
    }

    /**
     * PI-2: Finds the heading that contains the given line number.
     * PI-2 Refactor: Uses Range.contains() for precise position matching.
     * Recursively searches through the tree to find the most specific heading.
     * 
     * @param lineNumber - Line number to search for
     * @returns OutlineItem containing the line, or undefined if not found
     */
    findItemAtLine(lineNumber: number): OutlineItem | undefined {
        return this.searchItems(this.items, lineNumber);
    }

    /**
     * Recursively searches items for the one containing the given line.
     * Returns the most deeply nested item (most specific heading).
     * 
     * @param items - Items to search
     * @param lineNumber - Line number to search for
     * @returns Most specific item containing the line
     */
    private searchItems(items: OutlineItem[], lineNumber: number): OutlineItem | undefined {
        for (const item of items) {
            const position = new vscode.Position(lineNumber, 0);
            
            if (item.range.contains(position)) {
                // Check children first (more specific)
                const childMatch = this.searchItems(item.children, lineNumber);
                // Return child match if found, otherwise return this item
                return childMatch || item;
            }
        }
        return undefined;
    }

    /**
     * PI-12: Get all outline items in a flat list, in document order.
     * Used by keyboard shortcuts to find preceding/following items.
     * 
     * @returns Flattened array of all outline items
     */
    getAllItemsFlattened(): OutlineItem[] {
        const result: OutlineItem[] = [];
        
        const flatten = (items: OutlineItem[]) => {
            for (const item of items) {
                result.push(item);
                if (item.children.length > 0) {
                    flatten(item.children);
                }
            }
        };
        
        flatten(this.items);
        return result;
    }
}
