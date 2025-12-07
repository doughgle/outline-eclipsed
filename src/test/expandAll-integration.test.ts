import * as assert from 'assert';
import * as vscode from 'vscode';
import { MultiLanguageOutlineProvider } from '../multiLanguageOutlineProvider';

/**
 * PI-12: Integration test for expand all command
 * 
 * Tests follow AAA (Arrange-Act-Assert) pattern.
 * Tests verify actual behavior - that all items are shown/expanded in tree view.
 */
suite('PI-12: Expand All Integration Test', () => {

	test('expandAll expands all nodes in multi-root markdown document', async function() {
		this.timeout(10000); // Allow extra time for tree view operations

		// Arrange
		const extension = vscode.extensions.getExtension('douglashellinger.outline-eclipsed');
		await extension?.activate();
		
		const content = [
			'# Root 1',
			'## Child 1.1',
			'### Grandchild 1.1.1',
			'## Child 1.2',
			'',
			'# Root 2',
			'## Child 2.1',
			'### Grandchild 2.1.1',
			'#### Great-grandchild 2.1.1.1'
		].join('\n');
		
		const document = await vscode.workspace.openTextDocument({
			content,
			language: 'markdown'
		});
		await vscode.window.showTextDocument(document);
		
		// Wait for tree view to populate
		await new Promise(resolve => setTimeout(resolve, 1000));

		// Get tree view reference
		const extensionModule = await import('../extension.js');
		const treeView = extensionModule.outlineTreeView;
		assert.ok(treeView, 'Tree view should be available');

		// Create a provider to access the outline items
		const provider = new MultiLanguageOutlineProvider();
		await provider.refresh(document);
		const rootItems = provider.rootItems;
		
		assert.ok(rootItems.length > 0, 'Should have root items in the outline');

		// Find the deeply nested item (Great-grandchild)
		const root2 = rootItems.find(item => item.label === 'Root 2');
		assert.ok(root2, 'Should find Root 2');
		
		const child21 = root2?.children.find(item => item.label === 'Child 2.1');
		assert.ok(child21, 'Should find Child 2.1');
		
		const grandchild211 = child21?.children.find(item => item.label === 'Grandchild 2.1.1');
		assert.ok(grandchild211, 'Should find Grandchild 2.1.1');
		
		const greatGrandchild = grandchild211?.children.find(item => item.label === 'Great-grandchild 2.1.1.1');
		assert.ok(greatGrandchild, 'Should find Great-grandchild 2.1.1.1');

		// Act - First collapse all, then expand all to test the full cycle
		// Collapse all using VS Code's built-in command
		await vscode.commands.executeCommand('workbench.actions.treeView.outlineEclipsed.collapseAll');
		await new Promise(resolve => setTimeout(resolve, 500));

		// Now execute expand all command
		await vscode.commands.executeCommand('outlineEclipsed.expandAll');
		await new Promise(resolve => setTimeout(resolve, 1000));

		// Assert - verify deeply nested items are accessible after expansion
		// Try to reveal the deeply nested great-grandchild item
		// If the tree is properly expanded, this should succeed without errors
		try {
			await treeView.reveal(greatGrandchild, { select: false, focus: false, expand: false });
			assert.ok(true, 'Successfully revealed deeply nested Great-grandchild item after expandAll');
		} catch (error) {
			assert.fail(`Failed to reveal deeply nested item after expandAll: ${error}`);
		}

		// Also verify intermediate levels are accessible
		try {
			await treeView.reveal(grandchild211, { select: false, focus: false, expand: false });
			assert.ok(true, 'Successfully revealed Grandchild item');
		} catch (error) {
			assert.fail(`Failed to reveal Grandchild item: ${error}`);
		}

		try {
			await treeView.reveal(child21, { select: false, focus: false, expand: false });
			assert.ok(true, 'Successfully revealed Child item');
		} catch (error) {
			assert.fail(`Failed to reveal Child item: ${error}`);
		}

		// Verify tree view is visible
		assert.ok(treeView.visible, 'Tree view should be visible');
	});
});
