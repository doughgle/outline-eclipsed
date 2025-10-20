import * as assert from 'assert';
import * as vscode from 'vscode';
import { OutlineItem } from '../outlineItem';

suite('OutlineItem - PI-2 Refactor (Range-based)', () => {

	test('Should create OutlineItem with Range properties', () => {
		const range = new vscode.Range(5, 0, 10, 50);
		const selectionRange = new vscode.Range(5, 0, 5, 20);
		const item = new OutlineItem('Test Heading', 1, range, selectionRange);
		
		assert.strictEqual(item.label, 'Test Heading');
		assert.strictEqual(item.level, 1);
		assert.strictEqual(item.range.start.line, 5);
		assert.strictEqual(item.range.end.line, 10);
		assert.strictEqual(item.selectionRange.start.line, 5);
		assert.strictEqual(item.selectionRange.end.line, 5);
		assert.strictEqual(item.children.length, 0);
		assert.strictEqual(item.parent, undefined);
	});

	test('Should create hierarchical structure with children', () => {
		const childRange = new vscode.Range(6, 0, 8, 10);
		const childSelRange = new vscode.Range(6, 0, 6, 15);
		const child = new OutlineItem('Child', 2, childRange, childSelRange);
		
		const parentRange = new vscode.Range(5, 0, 10, 50);
		const parentSelRange = new vscode.Range(5, 0, 5, 20);
		const parent = new OutlineItem('Parent', 1, parentRange, parentSelRange, [child]);
		
		assert.strictEqual(parent.children.length, 1);
		assert.strictEqual(parent.children[0], child);
		
		// Set parent reference
		child.parent = parent;
		assert.strictEqual(child.parent, parent);
	});

	test('Should use symbolKind when provided', () => {
		const range = new vscode.Range(0, 0, 5, 10);
		const selRange = new vscode.Range(0, 0, 0, 10);
		const item = new OutlineItem('Test', 1, range, selRange, [], vscode.SymbolKind.Class);
		
		assert.strictEqual(item.symbolKind, vscode.SymbolKind.Class);
	});

	test('getFullRange should return the range property', () => {
		const range = new vscode.Range(5, 0, 10, 50);
		const selRange = new vscode.Range(5, 0, 5, 20);
		const item = new OutlineItem('Test', 1, range, selRange);
		
		const fullRange = item.getFullRange();
		assert.strictEqual(fullRange.start.line, 5);
		assert.strictEqual(fullRange.end.line, 10);
		assert.strictEqual(fullRange, item.range);
	});

	test('Should set collapsibleState based on children', () => {
		const range1 = new vscode.Range(0, 0, 5, 10);
		const selRange1 = new vscode.Range(0, 0, 0, 10);
		const noChildren = new OutlineItem('No Children', 1, range1, selRange1);
		assert.strictEqual(noChildren.collapsibleState, vscode.TreeItemCollapsibleState.None);

		const childRange = new vscode.Range(1, 0, 3, 10);
		const childSelRange = new vscode.Range(1, 0, 1, 15);
		const child = new OutlineItem('Child', 2, childRange, childSelRange);
		
		const range2 = new vscode.Range(0, 0, 5, 10);
		const selRange2 = new vscode.Range(0, 0, 0, 10);
		const withChildren = new OutlineItem('With Children', 1, range2, selRange2, [child]);
		assert.strictEqual(withChildren.collapsibleState, vscode.TreeItemCollapsibleState.Collapsed);
	});

	test('Should have command configured for navigation', () => {
		const range = new vscode.Range(42, 0, 50, 100);
		const selRange = new vscode.Range(42, 5, 42, 20);
		const item = new OutlineItem('Test', 1, range, selRange);
		
		assert.ok(item.command);
		assert.strictEqual(item.command.command, 'outlineEclipsed.gotoItem');
		assert.strictEqual(item.command.arguments?.[0], 42);
	});
});