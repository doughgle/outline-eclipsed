// Test TypeScript file for PI-9: Description and Tooltip validation
// This file tests outline items with description and tooltip for TypeScript symbols

/**
 * Main application class
 * Demonstrates class symbols in outline
 */
export class Application {
    private name: string;
    private version: number;

    constructor(name: string, version: number) {
        this.name = name;
        this.version = version;
    }

    /**
     * Gets the application name
     */
    public getName(): string {
        return this.name;
    }

    /**
     * Sets the application name
     */
    public setName(name: string): void {
        this.name = name;
    }

    /**
     * Starts the application
     */
    public start(): void {
        console.log(`Starting ${this.name} v${this.version}`);
    }
}

/**
 * Configuration interface
 */
interface Config {
    apiKey: string;
    timeout: number;
    retries: number;
}

/**
 * Utility function to format messages
 */
export function formatMessage(message: string, prefix?: string): string {
    if (prefix) {
        return `${prefix}: ${message}`;
    }
    return message;
}

/**
 * Constants for the application
 */
export const DEFAULT_TIMEOUT = 5000;
export const MAX_RETRIES = 3;

/**
 * Service class for API operations
 */
export class ApiService {
    private config: Config;

    constructor(config: Config) {
        this.config = config;
    }

    /**
     * Fetches data from API
     */
    async fetchData(endpoint: string): Promise<any> {
        // Implementation here
        return null;
    }

    /**
     * Posts data to API
     */
    async postData(endpoint: string, data: any): Promise<void> {
        // Implementation here
    }
}
