"use strict";
// Test TypeScript file for PI-9: Description and Tooltip validation
// This file tests outline items with description and tooltip for TypeScript symbols
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiService = exports.MAX_RETRIES = exports.DEFAULT_TIMEOUT = exports.Application = void 0;
exports.formatMessage = formatMessage;
/**
 * Main application class
 * Demonstrates class symbols in outline
 */
class Application {
    name;
    version;
    constructor(name, version) {
        this.name = name;
        this.version = version;
    }
    /**
     * Gets the application name
     */
    getName() {
        return this.name;
    }
    /**
     * Sets the application name
     */
    setName(name) {
        this.name = name;
    }
    /**
     * Starts the application
     */
    start() {
        console.log(`Starting ${this.name} v${this.version}`);
    }
}
exports.Application = Application;
/**
 * Utility function to format messages
 */
function formatMessage(message, prefix) {
    if (prefix) {
        return `${prefix}: ${message}`;
    }
    return message;
}
/**
 * Constants for the application
 */
exports.DEFAULT_TIMEOUT = 5000;
exports.MAX_RETRIES = 3;
/**
 * Service class for API operations
 */
class ApiService {
    config;
    constructor(config) {
        this.config = config;
    }
    /**
     * Fetches data from API
     */
    async fetchData(endpoint) {
        // Implementation here
        return null;
    }
    /**
     * Posts data to API
     */
    async postData(endpoint, data) {
        // Implementation here
    }
}
exports.ApiService = ApiService;
//# sourceMappingURL=sample.js.map