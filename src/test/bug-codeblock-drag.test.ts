import * as assert from 'assert';
import * as vscode from 'vscode';
import { MarkdownOutlineProvider } from '../markdownOutlineProvider';
import { TreeDragAndDropController } from '../treeDragAndDropController';

/**
 * Helper function to ensure markdown extension is activated before tests run.
 * Polls executeDocumentSymbolProvider until it returns results.
 */
async function ensureMarkdownExtensionActivated(): Promise<void> {
	const testDoc = await vscode.workspace.openTextDocument({
		content: '# Test',
		language: 'markdown'
	});
	
	// Poll until extension is ready (max 10 attempts, 100ms apart)
	for (let i = 0; i < 10; i++) {
		const symbols = await vscode.commands.executeCommand<vscode.DocumentSymbol[]>(
			'vscode.executeDocumentSymbolProvider',
			testDoc.uri
		);
		if (symbols && symbols.length > 0) {
			return;
		}
		await new Promise(resolve => setTimeout(resolve, 100));
	}
	throw new Error('Markdown extension failed to activate');
}

suite('Bug: Code Block Drag & Drop', () => {

	suiteSetup(async () => {
		await ensureMarkdownExtensionActivated();
	});

	test('Should include entire code block when dragging heading', async () => {
		// Setup: Create document with heading followed by code block containing #
		const content = `# Top Section

Some content.

### Installation

\`\`\`bash
# Clone the repo
git clone example.com
\`\`\`

### Usage

Usage content.

## Bottom
`;
		
		const document = await vscode.workspace.openTextDocument({
			content: content,
			language: 'markdown'
		});
		
		// Wait for markdown extension
		await new Promise(resolve => setTimeout(resolve, 200));
		
		const provider = new MarkdownOutlineProvider();
		await provider.refresh(document);
		
		const rootItems = provider.rootItems;
		
		// Find "Installation" heading
		const topSection = rootItems.find(item => item.label === 'Top Section');
		assert.ok(topSection, 'Should find Top Section');
		
		const installationHeading = topSection.children.find(item => item.label === 'Installation');
		assert.ok(installationHeading, 'Should find Installation heading');
		
		// Check that range includes the entire code block
		const installationStartLine = installationHeading.range.start.line;
		const installationEndLine = installationHeading.range.end.line;
		
		// Extract the section text
		const sectionText = document.getText(installationHeading.range);
		
		// Verify code block is included
		assert.ok(sectionText.includes('```bash'), 'Should include opening fence');
		assert.ok(sectionText.includes('# Clone the repo'), 'Should include bash comment');
		assert.ok(sectionText.includes('git clone'), 'Should include git command');
		assert.ok(sectionText.includes('```'), 'Should include closing fence');
		
		// Range should end before "Usage" heading (line 12) not at line with # comment
		const usageHeading = topSection.children.find(item => item.label === 'Usage');
		if (usageHeading) {
			assert.ok(installationEndLine < usageHeading.range.start.line, 
				`Installation should end (${installationEndLine}) before Usage starts (${usageHeading.range.start.line})`);
		}
		
		// Now test the actual drag operation
		const editor = await vscode.window.showTextDocument(document);
		const controller = new TreeDragAndDropController(provider);
		
		// Try to move Installation section to the bottom (after Usage)
		const bottomLine = document.lineCount;
		const success = await controller.moveSection(editor, installationStartLine, bottomLine);
		
		assert.ok(success, 'Move operation should succeed');
		
		// Verify the moved section still contains the code block
		// Re-parse the document to get the new structure
		await provider.refresh(editor.document);
		const newRootItems = provider.rootItems;
		
		// Find Installation heading in the new structure (recursively)
		function findItem(items: any[], label: string): any {
			for (const item of items) {
				if (item.label === label) {
					return item;
				}
				const found = findItem(item.children, label);
				if (found) {
					return found;
				}
			}
			return null;
		}
		
		const newInstallationItem = findItem(newRootItems, 'Installation');
		assert.ok(newInstallationItem, 'Should find moved Installation heading');
		
		const movedSection = editor.document.getText(newInstallationItem.range);
		
		// Critical: verify code block is complete
		assert.ok(movedSection.includes('```bash'), 'Moved section should include opening fence');
		assert.ok(movedSection.includes('# Clone the repo'), 'Moved section should include bash comment');
		assert.ok(movedSection.includes('git clone'), 'Moved section should include git command');
		assert.ok(movedSection.includes('```'), 'Moved section should include closing fence');
		
		controller.dispose();
	});
});
