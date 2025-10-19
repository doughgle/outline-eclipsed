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
     * Refreshes the tree view with the current document
     */
    refresh(document?: vscode.TextDocument): void {
        if (document) {
            this.currentDocument = document;
            this.items = this.parseDocument(document);
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
     */
    getTreeItem(element: OutlineItem): vscode.TreeItem {
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
     * Required by TreeDataProvider - returns parent for given element
     */
    getParent(element: OutlineItem): vscode.ProviderResult<OutlineItem> {
        // TODO: Implement parent lookup in tree structure
        return null;
    }
}
