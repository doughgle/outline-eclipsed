import * as assert from 'assert';
import * as vscode from 'vscode';
import { OutlineItem } from '../outlineItem';

suite('OutlineItem - Constructor Tests', () => {

	test('Should create OutlineItem with basic properties', () => {
		const item = new OutlineItem('Test Heading', 1, 5, 10);
		
		assert.strictEqual(item.label, 'Test Heading', 'Label should be set correctly');
		assert.strictEqual(item.level, 1, 'Level should be set correctly');
		assert.strictEqual(item.line, 5, 'Line should be set correctly');
		assert.strictEqual(item.endLine, 10, 'End line should be set correctly');
		assert.strictEqual(item.children.length, 0, 'Should have empty children array by default');
		assert.strictEqual(item.symbolKind, undefined, 'Symbol kind should be undefined by default');
		assert.strictEqual(item.parent, undefined, 'Parent should be undefined by default');
	});

	test('Should create OutlineItem with children array', () => {
		const child1 = new OutlineItem('Child 1', 2, 6, 8);
		const child2 = new OutlineItem('Child 2', 2, 9, 10);
		const children = [child1, child2];
		
		const parent = new OutlineItem('Parent', 1, 5, 10, children);
		
		assert.strictEqual(parent.children.length, 2, 'Should have 2 children');
		assert.strictEqual(parent.children[0], child1, 'First child should match');
		assert.strictEqual(parent.children[1], child2, 'Second child should match');
	});

	test('Should create OutlineItem with symbolKind', () => {
		const item = new OutlineItem('Test', 1, 0, 5, [], vscode.SymbolKind.Class);
		
		assert.strictEqual(item.symbolKind, vscode.SymbolKind.Class, 'Symbol kind should be set correctly');
	});

	test('Should handle empty label', () => {
		const item = new OutlineItem('', 1, 0, 5);
		
		assert.strictEqual(item.label, '', 'Should handle empty label');
	});

	test('Should handle same start and end line', () => {
		const item = new OutlineItem('Single Line', 1, 5, 5);
		
		assert.strictEqual(item.line, 5, 'Start line should be 5');
		assert.strictEqual(item.endLine, 5, 'End line should be 5');
	});

	test('Should handle different heading levels', () => {
		const levels = [1, 2, 3, 4, 5, 6];
		
		levels.forEach(level => {
			const item = new OutlineItem(`H${level} Heading`, level, 0, 5);
			assert.strictEqual(item.level, level, `Level ${level} should be set correctly`);
		});
	});
});

suite('OutlineItem - TreeItem Properties', () => {

	test('Should set collapsibleState to None for items without children', () => {
		const item = new OutlineItem('No Children', 1, 0, 5);
		
		assert.strictEqual(item.collapsibleState, vscode.TreeItemCollapsibleState.None, 
			'Items without children should have collapsibleState None');
	});

	test('Should set collapsibleState to Collapsed for items with children', () => {
		const child = new OutlineItem('Child', 2, 1, 3);
		const parent = new OutlineItem('Parent', 1, 0, 5, [child]);
		
		assert.strictEqual(parent.collapsibleState, vscode.TreeItemCollapsibleState.Collapsed, 
			'Items with children should have collapsibleState Collapsed');
	});

	test('Should configure command for navigation', () => {
		const item = new OutlineItem('Test Heading', 1, 42, 50);
		
		assert.ok(item.command, 'Command should be set');
		assert.strictEqual(item.command.command, 'outlineEclipsed.gotoItem', 
			'Command should be outlineEclipsed.gotoItem');
		assert.strictEqual(item.command.title, 'Go to Item', 
			'Command title should be Go to Item');
		assert.ok(Array.isArray(item.command.arguments), 'Command arguments should be an array');
		assert.strictEqual(item.command.arguments?.length, 1, 'Should have one argument');
		assert.strictEqual(item.command.arguments?.[0], 42, 'Argument should be the line number');
	});
});

suite('OutlineItem - Parent Property (PI-2)', () => {

	test('Should allow setting parent property', () => {
		const parent = new OutlineItem('Parent', 1, 0, 10);
		const child = new OutlineItem('Child', 2, 5, 8);
		
		child.parent = parent;
		
		assert.strictEqual(child.parent, parent, 'Parent should be set correctly');
	});

	test('Should allow parent to be undefined', () => {
		const item = new OutlineItem('Root Item', 1, 0, 5);
		
		assert.strictEqual(item.parent, undefined, 'Parent should be undefined for root items');
		
		// Explicitly set to undefined
		item.parent = undefined;
		assert.strictEqual(item.parent, undefined, 'Parent should remain undefined');
	});

	test('Should create hierarchical parent-child relationships', () => {
		const grandparent = new OutlineItem('H1', 1, 0, 20);
		const parent = new OutlineItem('H2', 2, 5, 15);
		const child = new OutlineItem('H3', 3, 10, 12);
		
		// Set up hierarchy
		child.parent = parent;
		parent.parent = grandparent;
		grandparent.children.push(parent);
		parent.children.push(child);
		
		// Verify relationships
		assert.strictEqual(child.parent, parent, 'Child should point to parent');
		assert.strictEqual(parent.parent, grandparent, 'Parent should point to grandparent');
		assert.strictEqual(grandparent.parent, undefined, 'Grandparent should have no parent');
		
		assert.strictEqual(grandparent.children[0], parent, 'Grandparent should contain parent');
		assert.strictEqual(parent.children[0], child, 'Parent should contain child');
	});
});

suite('OutlineItem - getFullRange Method', () => {

	test('Should return range from start line to end line', () => {
		const item = new OutlineItem('Test', 1, 5, 10);
		
		const range = item.getFullRange();
		
		assert.ok(range instanceof vscode.Range, 'Should return a vscode.Range');
		assert.strictEqual(range.start.line, 5, 'Range should start at item line');
		assert.strictEqual(range.start.character, 0, 'Range should start at character 0');
		assert.strictEqual(range.end.line, 10, 'Range should end at item endLine');
		assert.strictEqual(range.end.character, Number.MAX_VALUE, 
			'Range should end at maximum character to include full line');
	});

	test('Should handle single line range', () => {
		const item = new OutlineItem('Single Line', 1, 7, 7);
		
		const range = item.getFullRange();
		
		assert.strictEqual(range.start.line, 7, 'Range should start at line 7');
		assert.strictEqual(range.end.line, 7, 'Range should end at line 7');
		assert.strictEqual(range.start.character, 0, 'Should start at character 0');
		assert.strictEqual(range.end.character, Number.MAX_VALUE, 'Should end at max character');
	});

	test('Should handle line 0 correctly', () => {
		const item = new OutlineItem('First Line', 1, 0, 3);
		
		const range = item.getFullRange();
		
		assert.strictEqual(range.start.line, 0, 'Range should start at line 0');
		assert.strictEqual(range.end.line, 3, 'Range should end at line 3');
	});

	test('Should create valid range for large line numbers', () => {
		const item = new OutlineItem('Large File', 1, 1000, 2000);
		
		const range = item.getFullRange();
		
		assert.strictEqual(range.start.line, 1000, 'Range should start at line 1000');
		assert.strictEqual(range.end.line, 2000, 'Range should end at line 2000');
		assert.ok(range instanceof vscode.Range, 'Should create a valid Range object');
	});
});

suite('OutlineItem - Edge Cases and Complex Scenarios', () => {

	test('Should handle very long labels', () => {
		const longLabel = 'A'.repeat(1000);
		const item = new OutlineItem(longLabel, 1, 0, 5);
		
		assert.strictEqual(item.label, longLabel, 'Should handle very long labels');
		assert.strictEqual(item.label.length, 1000, 'Label length should be preserved');
	});

	test('Should handle special characters in labels', () => {
		const specialLabel = '# 特殊文字 🚀 & <html> "quotes" \'apostrophes\'';
		const item = new OutlineItem(specialLabel, 1, 0, 5);
		
		assert.strictEqual(item.label, specialLabel, 'Should handle special characters');
	});

	test('Should handle negative line numbers gracefully', () => {
		// While this shouldn't happen in practice, OutlineItem should store the value
		const item = new OutlineItem('Test', 1, -1, 5);
		
		assert.strictEqual(item.line, -1, 'Should accept negative line numbers');
		
		// getFullRange() should throw for invalid line numbers (VS Code behavior)
		assert.throws(() => {
			item.getFullRange();
		}, 'Range creation should throw for negative line numbers');
	});

	test('Should work with maximum integer values', () => {
		const maxInt = Number.MAX_SAFE_INTEGER;
		const item = new OutlineItem('Max Int', 1, maxInt, maxInt);
		
		assert.strictEqual(item.line, maxInt, 'Should handle maximum integers');
		assert.strictEqual(item.endLine, maxInt, 'Should handle maximum integers');
	});

	test('Should handle zero-level headings', () => {
		const item = new OutlineItem('Level 0', 0, 0, 5);
		
		assert.strictEqual(item.level, 0, 'Should handle level 0');
	});

});

suite('OutlineItem - SymbolKind Integration', () => {

	test('Should work with all VS Code SymbolKind values', () => {
		const symbolKinds = [
			vscode.SymbolKind.File,
			vscode.SymbolKind.Module,
			vscode.SymbolKind.Namespace,
			vscode.SymbolKind.Package,
			vscode.SymbolKind.Class,
			vscode.SymbolKind.Method,
			vscode.SymbolKind.Property,
			vscode.SymbolKind.Field,
			vscode.SymbolKind.Constructor,
			vscode.SymbolKind.Enum,
			vscode.SymbolKind.Interface,
			vscode.SymbolKind.Function,
			vscode.SymbolKind.Variable,
			vscode.SymbolKind.Constant,
			vscode.SymbolKind.String,
			vscode.SymbolKind.Number,
			vscode.SymbolKind.Boolean,
			vscode.SymbolKind.Array,
			vscode.SymbolKind.Object,
			vscode.SymbolKind.Key,
			vscode.SymbolKind.Null,
			vscode.SymbolKind.EnumMember,
			vscode.SymbolKind.Struct,
			vscode.SymbolKind.Event,
			vscode.SymbolKind.Operator,
			vscode.SymbolKind.TypeParameter
		];

		symbolKinds.forEach((symbolKind, index) => {
			const item = new OutlineItem(`Symbol ${index}`, 1, 0, 5, [], symbolKind);
			assert.strictEqual(item.symbolKind, symbolKind, 
				`Should handle ${vscode.SymbolKind[symbolKind]} symbol kind`);
		});
	});
});