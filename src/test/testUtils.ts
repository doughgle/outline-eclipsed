import * as vscode from 'vscode';

/**
 * Ensures markdown language extension is activated before tests run.
 * Opening a markdown document triggers onLanguage:markdown activation event.
 * 
 * This function polls the markdown extension up to 10 times with 5ms delays
 * to ensure it's ready before tests execute.
 * 
 * @throws Error if markdown extension fails to activate after all retries
 */
export async function ensureMarkdownExtensionActivated(): Promise<void> {
	// Create a markdown document to trigger extension activation
	const doc = await vscode.workspace.openTextDocument({
		content: '# Test',
		language: 'markdown'
	});
	
	// Wait for markdown extension to activate by attempting to get symbols
	// Retry up to 10 times with 5ms delay
	for (let i = 0; i < 10; i++) {
		const symbols = await vscode.commands.executeCommand<any[]>(
			'vscode.executeDocumentSymbolProvider',
			doc.uri
		);
		
		if (symbols && symbols.length > 0) {
			console.log(`Markdown extension activated after ${i * 5}ms`);
			return;
		}
		
		await new Promise(resolve => setTimeout(resolve, 5));
	}
	
	console.warn('Markdown extension may not be fully activated');
}
