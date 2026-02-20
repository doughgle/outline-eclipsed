import * as vscode from 'vscode';

/**
 * Supported log levels in increasing verbosity order.
 * 'off' disables all logging.
 */
export type LogLevel = 'off' | 'error' | 'warn' | 'info' | 'debug' | 'trace';

const LOG_LEVEL_ORDER: Record<LogLevel, number> = {
    off: 0,
    error: 1,
    warn: 2,
    info: 3,
    debug: 4,
    trace: 5,
};

/**
 * Structured logger that writes single-line JSON entries to a VS Code output channel.
 *
 * Log level is configurable at runtime. Each log entry is a JSON object with at
 * minimum `timestamp`, `level`, and `message` fields. Callers may supply an
 * additional `data` object whose own enumerable properties are merged into the
 * entry.
 *
 * @example
 * const logger = new Logger('Outline Eclipsed', 'info');
 * logger.info('extension activated');
 * logger.error('reveal failed', { item: 'foo@3', error: String(err) });
 */
export class Logger implements vscode.Disposable {
    private readonly outputChannel: vscode.OutputChannel;
    private level: LogLevel;

    constructor(channelName: string, level: LogLevel = 'info') {
        this.outputChannel = vscode.window.createOutputChannel(channelName);
        this.level = level;
    }

    /** Change the active log level at runtime. */
    setLevel(level: LogLevel): void {
        this.level = level;
    }

    /** Return the currently active log level. */
    getLevel(): LogLevel {
        return this.level;
    }

    private isEnabled(messageLevel: LogLevel): boolean {
        return LOG_LEVEL_ORDER[messageLevel] <= LOG_LEVEL_ORDER[this.level];
    }

    private write(level: LogLevel, message: string, data?: Record<string, unknown>): void {
        if (!this.isEnabled(level)) {
            return;
        }
        const entry: Record<string, unknown> = {
            timestamp: new Date().toISOString(),
            level,
            message,
            ...data,
        };
        this.outputChannel.appendLine(JSON.stringify(entry));
    }

    /** Log an error-level message with optional structured data. */
    error(message: string, data?: Record<string, unknown>): void {
        this.write('error', message, data);
    }

    /** Log a warn-level message with optional structured data. */
    warn(message: string, data?: Record<string, unknown>): void {
        this.write('warn', message, data);
    }

    /** Log an info-level message with optional structured data. */
    info(message: string, data?: Record<string, unknown>): void {
        this.write('info', message, data);
    }

    /** Log a debug-level message with optional structured data. */
    debug(message: string, data?: Record<string, unknown>): void {
        this.write('debug', message, data);
    }

    /** Log a trace-level message with optional structured data. */
    trace(message: string, data?: Record<string, unknown>): void {
        this.write('trace', message, data);
    }

    /** Dispose the underlying output channel. */
    dispose(): void {
        this.outputChannel.dispose();
    }
}

/**
 * Read the configured log level from VS Code workspace settings.
 * Falls back to `defaultLevel` when the setting is absent or invalid.
 */
export function readConfiguredLogLevel(defaultLevel: LogLevel): LogLevel {
    const configured = vscode.workspace
        .getConfiguration('outlineEclipsed')
        .get<string>('logLevel', defaultLevel);
    const validLevels = Object.keys(LOG_LEVEL_ORDER) as LogLevel[];
    return validLevels.includes(configured as LogLevel) ? (configured as LogLevel) : defaultLevel;
}
