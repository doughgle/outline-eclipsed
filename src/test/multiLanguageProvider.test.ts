import * as assert from 'assert';
import * as vscode from 'vscode';
import { MultiLanguageOutlineProvider } from '../multiLanguageOutlineProvider';
import { ensureMarkdownExtensionActivated, waitForDocumentSymbols } from './testUtils';

/**
 * Tests for MultiLanguageOutlineProvider
 * 
 * Verifies that the provider correctly delegates to language-specific providers
 * and switches providers when the language changes.
 */
suite('MultiLanguageOutlineProvider - Provider Switching', () => {
	
	suiteSetup(async () => {
		await ensureMarkdownExtensionActivated();
	});

	test('Provider should use MarkdownOutlineProvider for markdown files', async () => {
		const provider = new MultiLanguageOutlineProvider();
		
		const markdownDoc = await vscode.workspace.openTextDocument({
			content: '# Heading 1\n\n## Heading 2',
			language: 'markdown'
		});
		
		await provider.refresh(markdownDoc);
		const rootItems = provider.rootItems;
		
		// Should have parsed markdown headings
		assert.ok(rootItems.length > 0, 'Should have items from markdown');
		
		// Markdown provider strips # prefix, so label should not include it
		const firstLabel = rootItems[0].label;
		assert.ok(!firstLabel.startsWith('#'), 'Markdown provider should strip # prefix');
	});

	test('Provider should switch between different languages', async () => {
		const provider = new MultiLanguageOutlineProvider();
		
		// Start with markdown
		const markdownDoc = await vscode.workspace.openTextDocument({
			content: '# Markdown Heading',
			language: 'markdown'
		});
		
		await provider.refresh(markdownDoc);
		let rootItems = provider.rootItems;
		assert.ok(rootItems.length > 0, 'Should have markdown items');
		
		// Switch to plain text (no symbols)
		const textDoc = await vscode.workspace.openTextDocument({
			content: 'Just plain text',
			language: 'plaintext'
		});
		
		await provider.refresh(textDoc);
		rootItems = provider.rootItems;
		assert.strictEqual(rootItems.length, 0, 'Plain text should have no items');
		
		// Switch back to markdown
		const markdownDoc2 = await vscode.workspace.openTextDocument({
			content: '### Another Heading',
			language: 'markdown'
		});
		
		await provider.refresh(markdownDoc2);
		rootItems = provider.rootItems;
		assert.ok(rootItems.length > 0, 'Should have markdown items again');
	});

	test('Provider should clear when refreshed with undefined', async () => {
		const provider = new MultiLanguageOutlineProvider();
		
		const markdownDoc = await vscode.workspace.openTextDocument({
			content: '# Heading',
			language: 'markdown'
		});
		
		await provider.refresh(markdownDoc);
		let rootItems = provider.rootItems;
		assert.ok(rootItems.length > 0, 'Should have items');
		
		await provider.refresh(undefined);
		rootItems = provider.rootItems;
		assert.strictEqual(rootItems.length, 0, 'Should be cleared');
	});

	test('Provider should delegate findItemAtLine to current provider', async () => {
		const provider = new MultiLanguageOutlineProvider();
		
		const content = '# Heading 1\n\nContent\n\n# Heading 2';
		const markdownDoc = await vscode.workspace.openTextDocument({
			content: content,
			language: 'markdown'
		});
		
		await provider.refresh(markdownDoc);
		
		// Should find item at line 0
		const item = provider.findItemAtLine(0);
		assert.ok(item, 'Should find item at heading line');
		assert.ok(item.label.includes('Heading 1'), 'Should find correct heading');
	});

	test('Provider should parse symbols on first open of Python file', async function() {
		this.timeout(10000); // Allow time for language server
		
		// Create a Python file with a simple function
		const pythonContent = `def hello_world():
    print("Hello, World!")
    return 42

class MyClass:
    def method(self):
        pass

if __name__ == '__main__':
    hello_world()`;

		const doc = await vscode.workspace.openTextDocument({
			content: pythonContent,
			language: 'python'
		});
		
		// Show the document to trigger extension activation
		await vscode.window.showTextDocument(doc);
		
		// Wait for Python language server to provide symbols (allow more time)
		console.log('Waiting for Python symbols...');
		let symbols;
		try {
			symbols = await waitForDocumentSymbols(doc, 50, 100); // 5 seconds max
			console.log(`Got ${symbols.length} symbols from Python language server`);
		} catch (error) {
			console.log('Python language server not available in test environment - skipping test');
			this.skip();
			return;
		}
		
		assert.ok(symbols.length > 0, 'Python language server should provide symbols');
		
		// Now test our provider
		const provider = new MultiLanguageOutlineProvider();
		await provider.refresh(doc);
		
		const rootItems = provider.rootItems;
		console.log(`Provider has ${rootItems.length} root items`);
		
		assert.ok(rootItems.length > 0, 'Provider should have parsed symbols on first open');
		
		// Verify we got the expected symbols
		const labels = rootItems.map(item => item.label);
		console.log(`Root item labels: ${labels.join(', ')}`);
		
		// Should have at least the function and class
		assert.ok(labels.some(l => l.includes('hello_world')), 'Should find hello_world function');
		assert.ok(labels.some(l => l.includes('MyClass')), 'Should find MyClass class');
	});

	test('Provider should parse symbols on first open of JavaScript file', async function() {
		this.timeout(10000);
		
		const jsContent = `function greet(name) {
    return \`Hello, \${name}!\`;
}

class Person {
    constructor(name) {
        this.name = name;
    }
    
    sayHello() {
        console.log(greet(this.name));
    }
}

const person = new Person('World');`;

		const doc = await vscode.workspace.openTextDocument({
			content: jsContent,
			language: 'javascript'
		});
		
		await vscode.window.showTextDocument(doc);
		
		console.log('Waiting for JavaScript symbols...');
		const symbols = await waitForDocumentSymbols(doc);
		console.log(`Got ${symbols.length} symbols from JavaScript language server`);
		assert.ok(symbols.length > 0, 'JavaScript language server should provide symbols');
		
		const provider = new MultiLanguageOutlineProvider();
		await provider.refresh(doc);
		
		const rootItems = provider.rootItems;
		console.log(`Provider has ${rootItems.length} root items`);
		
		assert.ok(rootItems.length > 0, 'Provider should have parsed symbols on first open');
		
		const labels = rootItems.map(item => item.label);
		console.log(`Root item labels: ${labels.join(', ')}`);
	});
});

