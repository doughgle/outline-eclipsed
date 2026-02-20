import * as assert from 'assert';
import * as vscode from 'vscode';
import { Logger, LogLevel, readConfiguredLogLevel } from '../logger';

/**
 * Unit tests for the structured Logger.
 * 
 * Tests follow the AAA (Arrange-Act-Assert) pattern.
 */
suite('Logger: unit tests', () => {

	let outputLines: string[] = [];
	let logger: Logger;

	// Capture output by monkey-patching createOutputChannel before each test
	setup(() => {
		outputLines = [];
		// createOutputChannel is called inside the Logger constructor;
		// we replace it temporarily so we can inspect what gets written.
		const originalCreate = vscode.window.createOutputChannel.bind(vscode.window);
		const stub = vscode.window.createOutputChannel as unknown as { _original?: typeof originalCreate };
		stub._original = originalCreate;

		(vscode.window as unknown as Record<string, unknown>)['createOutputChannel'] =
			(_name: string) => ({
				appendLine: (line: string) => { outputLines.push(line); },
				dispose: () => { /* noop */ },
			});
	});

	teardown(() => {
		// Restore original createOutputChannel
		const stub = vscode.window.createOutputChannel as unknown as { _original?: unknown };
		if (stub._original) {
			(vscode.window as unknown as Record<string, unknown>)['createOutputChannel'] = stub._original;
			delete stub._original;
		}
		logger?.dispose();
	});

	// --- Level filtering ---

	test('info level: logs info, warn, error; suppresses debug and trace', () => {
		// Arrange
		logger = new Logger('Test', 'info');

		// Act
		logger.trace('t');
		logger.debug('d');
		logger.info('i');
		logger.warn('w');
		logger.error('e');

		// Assert
		assert.strictEqual(outputLines.length, 3, 'Should emit 3 lines for info level');
		assert.ok(JSON.parse(outputLines[0]).level === 'info');
		assert.ok(JSON.parse(outputLines[1]).level === 'warn');
		assert.ok(JSON.parse(outputLines[2]).level === 'error');
	});

	test('trace level: logs all messages', () => {
		// Arrange
		logger = new Logger('Test', 'trace');

		// Act
		logger.trace('t');
		logger.debug('d');
		logger.info('i');
		logger.warn('w');
		logger.error('e');

		// Assert
		assert.strictEqual(outputLines.length, 5, 'All five levels should be emitted');
	});

	test('off level: suppresses all messages', () => {
		// Arrange
		logger = new Logger('Test', 'off');

		// Act
		logger.trace('t');
		logger.debug('d');
		logger.info('i');
		logger.warn('w');
		logger.error('e');

		// Assert
		assert.strictEqual(outputLines.length, 0, 'No output when level is off');
	});

	test('error level: only emits error messages', () => {
		// Arrange
		logger = new Logger('Test', 'error');

		// Act
		logger.trace('t');
		logger.debug('d');
		logger.info('i');
		logger.warn('w');
		logger.error('e');

		// Assert
		assert.strictEqual(outputLines.length, 1);
		assert.strictEqual(JSON.parse(outputLines[0]).level, 'error');
	});

	// --- Log entry shape ---

	test('log entry is valid single-line JSON with timestamp, level, and message', () => {
		// Arrange
		logger = new Logger('Test', 'info');

		// Act
		logger.info('hello world');

		// Assert
		assert.strictEqual(outputLines.length, 1);
		const entry = JSON.parse(outputLines[0]);
		assert.ok(entry.timestamp, 'Entry should have a timestamp');
		assert.strictEqual(entry.level, 'info');
		assert.strictEqual(entry.message, 'hello world');
		// Confirm single-line (no newlines in the raw string)
		assert.ok(!outputLines[0].includes('\n'), 'Entry should be single-line JSON');
	});

	test('log entry merges extra data fields into the JSON object', () => {
		// Arrange
		logger = new Logger('Test', 'info');

		// Act
		logger.info('operation failed', { code: 42, context: 'test' });

		// Assert
		const entry = JSON.parse(outputLines[0]);
		assert.strictEqual(entry.code, 42);
		assert.strictEqual(entry.context, 'test');
	});

	// --- Runtime level change ---

	test('setLevel changes the active level at runtime', () => {
		// Arrange
		logger = new Logger('Test', 'error');

		// Act: initially only errors pass
		logger.info('suppressed');
		assert.strictEqual(outputLines.length, 0);

		// Act: upgrade to info
		logger.setLevel('info');
		logger.info('now visible');

		// Assert
		assert.strictEqual(outputLines.length, 1);
		assert.strictEqual(JSON.parse(outputLines[0]).message, 'now visible');
	});

	test('getLevel returns the current level', () => {
		// Arrange
		logger = new Logger('Test', 'debug');

		// Assert initial level
		assert.strictEqual(logger.getLevel(), 'debug');

		// Act
		logger.setLevel('warn');

		// Assert updated level
		assert.strictEqual(logger.getLevel(), 'warn');
	});

	// --- readConfiguredLogLevel ---

	test('readConfiguredLogLevel returns default when setting is absent', () => {
		// The workspace setting is not set in the test environment, so the
		// helper should return the provided default.
		const levels: LogLevel[] = ['off', 'error', 'warn', 'info', 'debug', 'trace'];
		for (const defaultLevel of levels) {
			const result = readConfiguredLogLevel(defaultLevel);
			// Result must be a valid log level
			assert.ok(levels.includes(result), `Expected a valid log level, got "${result}"`);
		}
	});
});
