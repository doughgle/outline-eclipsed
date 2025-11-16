import * as vscode from 'vscode';

/**
 * Waits for document symbols to be available for a given document.
 * This is necessary because symbol providers may not be ready immediately after document creation.
 * 
 * @param doc - The document to wait for symbols on
 * @param maxAttempts - Maximum number of attempts (default 10)
 * @param delayMs - Delay between attempts in milliseconds (default 20)
 * @returns Array of symbols once available
 * @throws Error if symbols are not available after max attempts
 */
export async function waitForDocumentSymbols(
	doc: vscode.TextDocument, 
	maxAttempts: number = 10, 
	delayMs: number = 20
): Promise<any[]> {
	for (let i = 0; i < maxAttempts; i++) {
		const symbols = await vscode.commands.executeCommand<any[]>(
			'vscode.executeDocumentSymbolProvider',
			doc.uri
		);
		
		if (symbols && symbols.length > 0) {
			return symbols;
		}
		
		await new Promise(resolve => setTimeout(resolve, delayMs));
	}
	
	throw new Error(`Document symbols not available after ${maxAttempts * delayMs}ms for language: ${doc.languageId}`);
}

/**
 * Ensures markdown language extension is activated before tests run.
 * Opening a markdown document triggers onLanguage:markdown activation event.
 * 
 * This function polls the markdown extension up to 10 times with 20ms delays
 * to ensure it's ready before tests execute.
 * 
 * @throws Error if markdown extension fails to activate after all retries
 */
export async function ensureMarkdownExtensionActivated(): Promise<void> {
	// Create a simple markdown document to trigger extension activation
	const doc = await vscode.workspace.openTextDocument({
		content: '# Test\n\nParagraph',
		language: 'markdown'
	});
	
	// Wait for markdown extension to activate by attempting to get symbols
	// Retry up to 10 times with 20ms delay (up to 200ms total)
	for (let i = 0; i < 10; i++) {
		const symbols = await vscode.commands.executeCommand<any[]>(
			'vscode.executeDocumentSymbolProvider',
			doc.uri
		);
		
		if (symbols && symbols.length > 0) {
			return;
		}
		
		await new Promise(resolve => setTimeout(resolve, 20));
	}
	
	throw new Error('Markdown extension activation timeout - symbol provider not available');
}
