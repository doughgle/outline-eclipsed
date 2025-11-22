import * as vscode from 'vscode';
import { OutlineProvider } from './outlineProvider';
import { OutlineItem } from './outlineItem';
import { MarkdownOutlineProvider } from './markdownOutlineProvider';
import { GenericOutlineProvider } from './genericOutlineProvider';
import { YamlOutlineProvider } from './yamlOutlineProvider';

/**
 * Multi-language outline provider that delegates to language-specific providers.
 * This provider acts as a facade, creating and delegating to the appropriate
 * language-specific provider based on the current document.
 */
export class MultiLanguageOutlineProvider extends OutlineProvider {
    
    private currentDelegate: OutlineProvider;
    private currentLanguageId: string | undefined;

    /**
     * Map of language IDs to provider factory functions.
     * Add custom providers here for languages that need special handling.
     */
    private static readonly CUSTOM_PROVIDERS: { [key: string]: () => OutlineProvider } = {
        'markdown': () => new MarkdownOutlineProvider(),
        'yaml': () => new YamlOutlineProvider(),
    };

    constructor() {
        super();
        // Start with generic provider
        this.currentDelegate = new GenericOutlineProvider();
    }

    /**
     * Creates appropriate provider for the given language.
     * Uses custom provider if available, otherwise uses generic provider.
     */
    private createProviderForLanguage(languageId: string): OutlineProvider {
        const factory = MultiLanguageOutlineProvider.CUSTOM_PROVIDERS[languageId];
        return factory ? factory() : new GenericOutlineProvider();
    }

    /**
     * Refreshes the outline for the given document.
     * Automatically switches to appropriate provider based on language.
     */
    async refresh(document?: vscode.TextDocument): Promise<void> {
        if (!document) {
            this.currentDocument = undefined;
            this.items = [];
            this.currentLanguageId = undefined;
            this._onDidChangeTreeData.fire();
            return;
        }

        // Check if we need to switch providers
        const languageId = document.languageId;
        if (languageId !== this.currentLanguageId) {
            console.log(`Switching provider for language: ${languageId}`);
            this.currentDelegate = this.createProviderForLanguage(languageId);
            this.currentLanguageId = languageId;
        }

        // Delegate to current provider
        await this.currentDelegate.refresh(document);
        
        // Copy results from delegate using public API
        this.currentDocument = document;
        this.items = this.currentDelegate.rootItems;
        
        this._onDidChangeTreeData.fire();
    }

    /**
     * Delegate parseDocument to current provider.
     * This method is abstract in base class but we handle it via delegation in refresh().
     */
    protected parseDocument(document: vscode.TextDocument): OutlineItem[] | Promise<OutlineItem[]> {
        // This shouldn't be called directly since we override refresh()
        // But if it is, delegate to current provider
        return this.currentDelegate.rootItems;
    }

    /**
     * Find item at line - delegate to current provider.
     */
    findItemAtLine(lineNumber: number): OutlineItem | undefined {
        return this.currentDelegate.findItemAtLine(lineNumber);
    }
}
