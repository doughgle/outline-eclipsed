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

suite('OutlineItem - PI-9: Description and Tooltip', () => {

	test('Should not show description for items without document', () => {
		const range = new vscode.Range(5, 0, 5, 50);
		const selRange = new vscode.Range(5, 0, 5, 20);
		const item = new OutlineItem('Test Heading', 1, range, selRange);
		
		// Without document, description should be undefined
		assert.strictEqual(item.description, undefined);
	});

	test('Should extract value for constants when document is provided', async () => {
		// Create a document with a constant
		const document = await vscode.workspace.openTextDocument({
			content: 'const MAX_RETRIES = 3;',
			language: 'javascript'
		});
		
		const range = new vscode.Range(0, 0, 0, 22);
		const selRange = new vscode.Range(0, 6, 0, 17); // MAX_RETRIES
		const item = new OutlineItem('MAX_RETRIES', 1, range, selRange, [], vscode.SymbolKind.Constant, document);
		
		assert.strictEqual(item.description, '3');
	});

	test('Should extract value for variables when document is provided', async () => {
		// Create a document with a variable
		const document = await vscode.workspace.openTextDocument({
			content: 'let timeout = 5000;',
			language: 'javascript'
		});
		
		const range = new vscode.Range(0, 0, 0, 19);
		const selRange = new vscode.Range(0, 4, 0, 11); // timeout
		const item = new OutlineItem('timeout', 1, range, selRange, [], vscode.SymbolKind.Variable, document);
		
		assert.strictEqual(item.description, '5000');
	});

	test('Should extract values from JSON data', async () => {
		// Create a JSON document
		const document = await vscode.workspace.openTextDocument({
			content: '{\n  "name": "test-app",\n  "version": "1.0.0"\n}',
			language: 'json'
		});
		
		const range = new vscode.Range(1, 2, 1, 20);
		const selRange = new vscode.Range(1, 3, 1, 7); // "name"
		const item = new OutlineItem('name', 1, range, selRange, [], vscode.SymbolKind.String, document);
		
		assert.strictEqual(item.description, '"test-app"');
	});

	test('Should truncate long values', async () => {
		// Create a document with a long string value
		const longValue = 'a'.repeat(60);
		const document = await vscode.workspace.openTextDocument({
			content: `const longString = "${longValue}";`,
			language: 'javascript'
		});
		
		const range = new vscode.Range(0, 0, 0, 80);
		const selRange = new vscode.Range(0, 6, 0, 16); // longString
		const item = new OutlineItem('longString', 1, range, selRange, [], vscode.SymbolKind.Constant, document);
		
		// Should be truncated to 50 chars max
		assert.ok(item.description);
		assert.ok(typeof item.description === 'string');
		assert.ok(item.description.length <= 50);
		assert.ok(item.description.endsWith('...'));
	});

	test('Should have tooltip with symbol kind and line information', () => {
		const range = new vscode.Range(5, 0, 10, 50);
		const selRange = new vscode.Range(5, 0, 5, 20);
		const item = new OutlineItem('TestClass', 1, range, selRange, [], vscode.SymbolKind.Class);
		
		// Tooltip should be a MarkdownString with detailed information
		assert.ok(item.tooltip instanceof vscode.MarkdownString);
		const tooltipText = item.tooltip.value;
		assert.ok(tooltipText.includes('TestClass'), 'Tooltip should include symbol name');
		assert.ok(tooltipText.includes('Class'), 'Tooltip should include symbol kind');
		assert.ok(tooltipText.includes('6-11'), 'Tooltip should include line range');
	});

	test('Should have tooltip for markdown heading without symbol kind', () => {
		const range = new vscode.Range(5, 0, 10, 50);
		const selRange = new vscode.Range(5, 0, 5, 20);
		const item = new OutlineItem('# Main Heading', 1, range, selRange);
		
		// Tooltip should be a MarkdownString
		assert.ok(item.tooltip instanceof vscode.MarkdownString);
		const tooltipText = item.tooltip.value;
		assert.ok(tooltipText.includes('# Main Heading'), 'Tooltip should include heading text');
		assert.ok(tooltipText.includes('6-11'), 'Tooltip should include line range');
	});

	test('Should format single-line tooltip differently', () => {
		const range = new vscode.Range(5, 0, 5, 50);
		const selRange = new vscode.Range(5, 0, 5, 20);
		const item = new OutlineItem('shortFunction', 1, range, selRange, [], vscode.SymbolKind.Function);
		
		assert.ok(item.tooltip instanceof vscode.MarkdownString);
		const tooltipText = item.tooltip.value;
		assert.ok(tooltipText.includes('shortFunction'), 'Tooltip should include symbol name');
		assert.ok(tooltipText.includes('Function'), 'Tooltip should include symbol kind');
		assert.ok(tooltipText.includes('6'), 'Tooltip should include line number');
	});

	test('Should not show description for non-constant symbols without document', () => {
		const childRange = new vscode.Range(6, 0, 8, 10);
		const childSelRange = new vscode.Range(6, 0, 6, 15);
		const child = new OutlineItem('Child Method', 2, childRange, childSelRange, [], vscode.SymbolKind.Method);
		
		const parentRange = new vscode.Range(5, 0, 10, 50);
		const parentSelRange = new vscode.Range(5, 0, 5, 20);
		const parent = new OutlineItem('Parent Class', 1, parentRange, parentSelRange, [child], vscode.SymbolKind.Class);
		
		// Without document, description should be undefined for non-constant symbols
		assert.strictEqual(parent.description, undefined);
		assert.strictEqual(child.description, undefined);
	});
});