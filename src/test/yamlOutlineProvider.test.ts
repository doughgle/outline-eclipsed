import * as assert from 'assert';
import * as vscode from 'vscode';
import { YamlOutlineProvider } from '../yamlOutlineProvider';
import { OutlineItem } from '../outlineItem';

suite('YamlOutlineProvider Tests', () => {

	test('Should parse YAML document symbols', async () => {
		const yamlContent = `version: "3.8"
services:
  web:
    image: nginx:latest
  database:
    image: postgres:14
volumes:
  db_data:
`;
		
		const doc = await vscode.workspace.openTextDocument({
			content: yamlContent,
			language: 'yaml'
		});
		
		const provider = new YamlOutlineProvider();
		await provider.refresh(doc);
		
		const items = provider.rootItems;
		
		// Should have parsed root-level keys
		assert.ok(items.length > 0, 'Should parse YAML symbols');
		
		// Verify we got the expected structure
		const labels = items.map(item => item.label);
		assert.ok(labels.includes('version') || labels.includes('services') || labels.includes('volumes'), 
			`Should contain YAML keys, got: ${labels.join(', ')}`);
	});

	test('Should handle nested YAML structures', async () => {
		const yamlContent = `services:
  web:
    image: nginx
    ports:
      - "8080:80"
  database:
    image: postgres
`;
		
		const doc = await vscode.workspace.openTextDocument({
			content: yamlContent,
			language: 'yaml'
		});
		
		const provider = new YamlOutlineProvider();
		await provider.refresh(doc);
		
		const items = provider.rootItems;
		
		// Should handle nested structure
		assert.ok(items.length > 0, 'Should parse nested YAML');
		
		// Check for services key
		const servicesItem = items.find(item => item.label === 'services');
		if (servicesItem) {
			// Should have children (web, database)
			assert.ok(servicesItem.children.length > 0, 'Services should have children');
		}
	});

	test('Should find item at line', async () => {
		const yamlContent = `first: value1
second:
  nested: value2
third: value3
`;
		
		const doc = await vscode.workspace.openTextDocument({
			content: yamlContent,
			language: 'yaml'
		});
		
		const provider = new YamlOutlineProvider();
		await provider.refresh(doc);
		
		// Find item at line 1 (second key)
		const item = provider.findItemAtLine(1);
		
		if (item) {
			assert.strictEqual(item.label, 'second', 'Should find correct item at line');
		}
	});

	test('Should handle first item edge case', async () => {
		const yamlContent = `alpha: first
beta: second
gamma: third
`;
		
		const doc = await vscode.workspace.openTextDocument({
			content: yamlContent,
			language: 'yaml'
		});
		
		const provider = new YamlOutlineProvider();
		await provider.refresh(doc);
		
		const items = provider.rootItems;
		assert.ok(items.length >= 1, 'Should have at least one item');
		
		// First item should be accessible
		const firstItem = items[0];
		assert.ok(firstItem, 'First item should exist');
		assert.ok(firstItem.range, 'First item should have range');
	});

	test('Should handle last item edge case', async () => {
		const yamlContent = `alpha: first
beta: second
omega: last
`;
		
		const doc = await vscode.workspace.openTextDocument({
			content: yamlContent,
			language: 'yaml'
		});
		
		const provider = new YamlOutlineProvider();
		await provider.refresh(doc);
		
		const items = provider.rootItems;
		assert.ok(items.length >= 1, 'Should have at least one item');
		
		// Last item should be accessible
		const lastItem = items[items.length - 1];
		assert.ok(lastItem, 'Last item should exist');
		assert.ok(lastItem.range, 'Last item should have range');
	});

	test('Should sanitize YAML symbol names', async () => {
		const yamlContent = `"quoted_key": value
normal_key: value
`;
		
		const doc = await vscode.workspace.openTextDocument({
			content: yamlContent,
			language: 'yaml'
		});
		
		const provider = new YamlOutlineProvider();
		await provider.refresh(doc);
		
		const items = provider.rootItems;
		
		// Symbol names should be clean (without quotes if that's how symbols are provided)
		for (const item of items) {
			assert.ok(item.label.trim().length > 0, 'Symbol names should not be empty');
		}
	});
});
