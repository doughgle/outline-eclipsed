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
    
    private _onDidChangeTreeData = new vscode.EventEmitter<OutlineItem | undefined | null | void>();
    readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

    protected items: OutlineItem[] = [];
    protected currentDocument: vscode.TextDocument | undefined;

    /**
     * Refreshes the tree view with the current document.
     * Pass undefined to clear the tree view.
     * 
     * @param document - Document to parse, or undefined to clear
     */
    refresh(document?: vscode.TextDocument): void {
        if (document) {
            this.currentDocument = document;
            this.items = this.parseDocument(document);
        } else {
            // Clear the tree when no document provided
            this.currentDocument = undefined;
            this.items = [];
        }
        this._onDidChangeTreeData.fire();
    }

    /**
     * Language-specific parsing logic - implemented by subclasses
     * @param document - Document to parse
     * @returns Array of top-level outline items
     */
    protected abstract parseDocument(document: vscode.TextDocument): OutlineItem[];

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
     * Required by TreeDataProvider - returns children for given element
     */
    getChildren(element?: OutlineItem): Thenable<OutlineItem[]> {
        if (!this.currentDocument) {
            return Promise.resolve([]);
        }

        if (element) {
            // Return children of the given item
            return Promise.resolve(element.children);
        } else {
            // Return root level items
            return Promise.resolve(this.items);
        }
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
            // Create a position at the start of the line
            const position = new vscode.Position(lineNumber, 0);
            
            // Check if position is within this item's range
            if (item.range.contains(position)) {
                // Check children first (more specific)
                const childMatch = this.searchItems(item.children, lineNumber);
                // Return child match if found, otherwise return this item
                return childMatch || item;
            }
        }
        return undefined;
    }
}
