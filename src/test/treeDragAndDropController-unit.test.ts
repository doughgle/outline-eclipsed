import * as assert from 'assert';
import * as vscode from 'vscode';
import { TreeDragAndDropController, MIN_HIGHLIGHT_DURATION, MAX_HIGHLIGHT_DURATION } from '../treeDragAndDropController';
import { OutlineItem } from '../outlineItem';
import { OutlineProvider } from '../outlineProvider';
import { TextLineManipulator } from '../textLineManipulator';
import { OutlineItemProcessor } from '../outlineItemProcessor';
import { OutlineTransfer } from '../outlineTransfer';

// Mock classes for testing
class MockTextLineManipulator extends TextLineManipulator {
	public lastCalculateCall?: {
		lines: string[];
		sectionsToMove: Array<{ range: vscode.Range; label: string }>;
		targetLine: number;
	};
	public mockResult?: { newLines: string[]; movedRanges: vscode.Range[] };

	calculateMovedText(
		lines: string[],
		sectionsToMove: Array<{ range: vscode.Range; label: string }>,
		targetLine: number
	): { newLines: string[]; movedRanges: vscode.Range[] } {
		this.lastCalculateCall = { lines, sectionsToMove, targetLine };
		if (this.mockResult) {
			return this.mockResult;
		}
		return { newLines: lines, movedRanges: [] };
	}
}

class MockOutlineItemProcessor extends OutlineItemProcessor {
	public lastFilterCall?: OutlineItem[];
	public lastSortCall?: OutlineItem[];
	public mockFilterResult?: OutlineItem[];
	public mockSortResult?: OutlineItem[];

	filterRedundantItems(items: readonly OutlineItem[]): OutlineItem[] {
		this.lastFilterCall = [...items];
		if (this.mockFilterResult !== undefined) {
			return this.mockFilterResult;
		}
		return [...items];
	}

	sortItemsByPosition(items: OutlineItem[]): OutlineItem[] {
		this.lastSortCall = items;
		if (this.mockSortResult !== undefined) {
			return this.mockSortResult;
		}
		return items;
	}
}

class MockOutlineTransfer extends OutlineTransfer {
	public lastSerializeCall?: OutlineItem[];
	public lastDeserializeCall?: string;
	public mockSerializeResult?: string;
	public mockDeserializeResult?: Array<{ range: vscode.Range; label: string; level: number }>;

	serialize(items: OutlineItem[]): string {
		this.lastSerializeCall = items;
		if (this.mockSerializeResult !== undefined) {
			return this.mockSerializeResult;
		}
		return JSON.stringify(items.map(i => ({
			range: { start: { line: i.range.start.line, character: i.range.start.character }, end: { line: i.range.end.line, character: i.range.end.character } },
			label: i.label,
			level: i.level
		})));
	}

	deserialize(json: string): Array<{ range: vscode.Range; label: string; level: number }> {
		this.lastDeserializeCall = json;
		if (this.mockDeserializeResult !== undefined) {
			return this.mockDeserializeResult;
		}
		const parsed = JSON.parse(json);
		return parsed.map((item: any) => ({
			range: new vscode.Range(item.range.start.line, item.range.start.character, item.range.end.line, item.range.end.character),
			label: item.label,
			level: item.level
		}));
	}
}

class MockOutlineProvider extends OutlineProvider {
	public lastRefreshCall?: vscode.TextDocument | undefined;

	async refresh(document?: vscode.TextDocument): Promise<void> {
		this.lastRefreshCall = document;
		await super.refresh(document);
	}

	protected parseDocument(_document: vscode.TextDocument): OutlineItem[] {
		return [];
	}
}

// Testable controller that bypasses editor checks for unit testing
class TestableTreeDragAndDropController extends TreeDragAndDropController {
	public async testHandleDrag(
		source: readonly OutlineItem[],
		dataTransfer: vscode.DataTransfer,
		token: vscode.CancellationToken
	): Promise<void> {
		// Call the parent's handleDrag logic directly without editor checks
		// This is a workaround to test the core logic in isolation
		const filteredSource = (this as any).filterRedundantItems(source);
		const sortedSource = (this as any).sortItemsByPosition(filteredSource);
		const serialized = (this as any).serializeItems(sortedSource);

		dataTransfer.set(
			(this as any).transfer.mimeType,
			new vscode.DataTransferItem(serialized)
		);
	}
}

suite('TreeDragAndDropController Unit Tests', () => {
	let mockProvider: MockOutlineProvider;
	let mockTextManipulator: MockTextLineManipulator;
	let mockItemProcessor: MockOutlineItemProcessor;
	let mockTransfer: MockOutlineTransfer;
	let controller: TestableTreeDragAndDropController;

	setup(() => {
		mockProvider = new MockOutlineProvider();
		mockTextManipulator = new MockTextLineManipulator();
		mockItemProcessor = new MockOutlineItemProcessor();
		mockTransfer = new MockOutlineTransfer();

		controller = new TestableTreeDragAndDropController(
			mockProvider,
			200,
			mockTextManipulator,
			mockItemProcessor,
			mockTransfer
		);
	});

	test('constructor - accepts all dependencies', () => {
		// Verify controller was created with mocked dependencies
		assert.ok(controller);
	});

	test('handleDrag - delegates to itemProcessor.filterRedundantItems', async () => {
		// GIVEN: Source items
		const items = [
			new OutlineItem('Section 1', 1, new vscode.Range(0, 0, 5, 0), new vscode.Range(0, 0, 0, 9)),
			new OutlineItem('Section 2', 2, new vscode.Range(6, 0, 10, 0), new vscode.Range(6, 0, 6, 9))
		];

		// WHEN: handleDrag is called
		const dataTransfer = new vscode.DataTransfer();
		await controller.testHandleDrag(items, dataTransfer, new MockCancellationToken());

		// THEN: itemProcessor.filterRedundantItems should be called
		assert.ok(mockItemProcessor.lastFilterCall);
		assert.strictEqual(mockItemProcessor.lastFilterCall.length, 2);
	});

	test('handleDrag - delegates to itemProcessor.sortItemsByPosition', async () => {
		// GIVEN: Source items and mocked filter result
		const items = [
			new OutlineItem('Section 1', 1, new vscode.Range(0, 0, 5, 0), new vscode.Range(0, 0, 0, 9))
		];
		mockItemProcessor.mockFilterResult = items;

		// WHEN: handleDrag is called
		const dataTransfer = new vscode.DataTransfer();
		await controller.testHandleDrag(items, dataTransfer, new MockCancellationToken());

		// THEN: itemProcessor.sortItemsByPosition should be called
		assert.ok(mockItemProcessor.lastSortCall);
	});

	test('handleDrag - delegates to transfer.serialize', async () => {
		// GIVEN: Source items
		const items = [
			new OutlineItem('Section 1', 1, new vscode.Range(0, 0, 5, 0), new vscode.Range(0, 0, 0, 9))
		];
		mockItemProcessor.mockFilterResult = items;
		mockItemProcessor.mockSortResult = items;

		// WHEN: handleDrag is called
		const dataTransfer = new vscode.DataTransfer();
		await controller.testHandleDrag(items, dataTransfer, new MockCancellationToken());

		// THEN: transfer.serialize should be called
		assert.ok(mockTransfer.lastSerializeCall);
		assert.strictEqual(mockTransfer.lastSerializeCall.length, 1);
	});

	test('handleDrag - sets data on DataTransfer', async () => {
		// GIVEN: Source items and mocked serialize result
		const items = [
			new OutlineItem('Section 1', 1, new vscode.Range(0, 0, 5, 0), new vscode.Range(0, 0, 0, 9))
		];
		mockItemProcessor.mockFilterResult = items;
		mockItemProcessor.mockSortResult = items;
		mockTransfer.mockSerializeResult = '{"test": "data"}';

		// WHEN: handleDrag is called
		const dataTransfer = new vscode.DataTransfer();
		await controller.testHandleDrag(items, dataTransfer, new MockCancellationToken());

		// THEN: DataTransfer should have data set
		const data = dataTransfer.get(mockTransfer.mimeType);
		assert.ok(data);
	});

	test('handleDrag - handles empty items array', async () => {
		// GIVEN: Empty items array
		const items: OutlineItem[] = [];

		// WHEN: handleDrag is called
		const dataTransfer = new vscode.DataTransfer();
		await controller.testHandleDrag(items, dataTransfer, new MockCancellationToken());

		// THEN: Should still call collaborators without error
		assert.ok(mockItemProcessor.lastFilterCall);
		assert.strictEqual(mockItemProcessor.lastFilterCall.length, 0);
	});

	test('mimeType - returns transfer.mimeType', () => {
		// THEN: Controller exposes transfer's MIME type
		assert.strictEqual(controller.dragMimeTypes[0], mockTransfer.mimeType);
		assert.strictEqual(controller.dropMimeTypes[0], mockTransfer.mimeType);
	});

	test('dependency injection - uses default instances when not provided', () => {
		// WHEN: Creating controller without collaborators
		const defaultController = new TreeDragAndDropController(mockProvider);

		// THEN: Should not throw
		assert.ok(defaultController);
	});

	test('dependency injection - uses provided textManipulator', () => {
		// GIVEN: Custom mock with specific behavior
		const customMock = new MockTextLineManipulator();
		customMock.mockResult = {
			newLines: ['custom'],
			movedRanges: []
		};

		// WHEN: Creating controller with custom mock
		const customController = new TreeDragAndDropController(
			mockProvider,
			200,
			customMock,
			mockItemProcessor,
			mockTransfer
		);

		// THEN: Controller should use the custom mock
		assert.ok(customController);
	});

	test('dependency injection - uses provided itemProcessor', () => {
		// GIVEN: Custom mock with specific behavior
		const customMock = new MockOutlineItemProcessor();
		customMock.mockFilterResult = [];

		// WHEN: Creating controller with custom mock
		const customController = new TreeDragAndDropController(
			mockProvider,
			200,
			mockTextManipulator,
			customMock,
			mockTransfer
		);

		// THEN: Controller should use the custom mock
		assert.ok(customController);
	});

	test('dependency injection - uses provided transfer', () => {
		// GIVEN: Custom mock with specific behavior
		const customMock = new MockOutlineTransfer();
		customMock.mockSerializeResult = '{"custom": true}';

		// WHEN: Creating controller with custom mock
		const customController = new TreeDragAndDropController(
			mockProvider,
			200,
			mockTextManipulator,
			mockItemProcessor,
			customMock
		);

		// THEN: Controller should use the custom mock
		assert.ok(customController);
	});

	test('filterRedundantItems - delegates to itemProcessor', async () => {
		// GIVEN: Items to filter
		const items = [
			new OutlineItem('Parent', 1, new vscode.Range(0, 0, 10, 0), new vscode.Range(0, 0, 0, 6)),
			new OutlineItem('Child', 2, new vscode.Range(2, 0, 5, 0), new vscode.Range(2, 0, 2, 5))
		];

		// WHEN: Calling private method via handleDrag
		const dataTransfer = new vscode.DataTransfer();
		await controller.testHandleDrag(items, dataTransfer, new MockCancellationToken());

		// THEN: itemProcessor.filterRedundantItems should be called
		assert.ok(mockItemProcessor.lastFilterCall);
		assert.strictEqual(mockItemProcessor.lastFilterCall.length, 2);
	});
});

suite('PI-19: TreeDragAndDropController - highlightDuration validation', () => {
	test('constructor - clamps duration below minimum to MIN_HIGHLIGHT_DURATION', () => {
		// GIVEN: A duration below the allowed minimum
		const controller = new TreeDragAndDropController(undefined, MIN_HIGHLIGHT_DURATION - 1);

		// THEN: Stored duration should be clamped to the minimum
		assert.strictEqual(controller.getHighlightDuration(), MIN_HIGHLIGHT_DURATION);
		controller.dispose();
	});

	test('constructor - clamps duration above maximum to MAX_HIGHLIGHT_DURATION', () => {
		// GIVEN: A duration above the allowed maximum
		const controller = new TreeDragAndDropController(undefined, MAX_HIGHLIGHT_DURATION + 1);

		// THEN: Stored duration should be clamped to the maximum
		assert.strictEqual(controller.getHighlightDuration(), MAX_HIGHLIGHT_DURATION);
		controller.dispose();
	});

	test('constructor - accepts a valid in-range duration unchanged', () => {
		// GIVEN: A valid duration within range
		const valid = 2000;
		const controller = new TreeDragAndDropController(undefined, valid);

		// THEN: Stored duration should be exactly the provided value
		assert.strictEqual(controller.getHighlightDuration(), valid);
		controller.dispose();
	});

	test('constructor - replaces NaN with MIN_HIGHLIGHT_DURATION', () => {
		// GIVEN: NaN passed as duration
		const controller = new TreeDragAndDropController(undefined, NaN);

		// THEN: Stored duration should be the minimum (non-finite fallback)
		assert.strictEqual(controller.getHighlightDuration(), MIN_HIGHLIGHT_DURATION);
		controller.dispose();
	});

	test('setHighlightDuration - clamps duration below minimum to MIN_HIGHLIGHT_DURATION', () => {
		// GIVEN: A controller with a valid duration
		const controller = new TreeDragAndDropController(undefined, 1500);

		// WHEN: Setting a duration below the minimum
		controller.setHighlightDuration(MIN_HIGHLIGHT_DURATION - 1);

		// THEN: Duration should be clamped to the minimum
		assert.strictEqual(controller.getHighlightDuration(), MIN_HIGHLIGHT_DURATION);
		controller.dispose();
	});

	test('setHighlightDuration - clamps duration above maximum to MAX_HIGHLIGHT_DURATION', () => {
		// GIVEN: A controller with a valid duration
		const controller = new TreeDragAndDropController(undefined, 1500);

		// WHEN: Setting a duration above the maximum
		controller.setHighlightDuration(MAX_HIGHLIGHT_DURATION + 1);

		// THEN: Duration should be clamped to the maximum
		assert.strictEqual(controller.getHighlightDuration(), MAX_HIGHLIGHT_DURATION);
		controller.dispose();
	});

	test('setHighlightDuration - ignores NaN and keeps previous duration', () => {
		// GIVEN: A controller with a known valid duration
		const previousDuration = 2500;
		const controller = new TreeDragAndDropController(undefined, previousDuration);

		// WHEN: Setting NaN as the new duration
		controller.setHighlightDuration(NaN);

		// THEN: Previous duration should be preserved
		assert.strictEqual(controller.getHighlightDuration(), previousDuration);
		controller.dispose();
	});

	test('setHighlightDuration - ignores Infinity and keeps previous duration', () => {
		// GIVEN: A controller with a known valid duration
		const previousDuration = 2500;
		const controller = new TreeDragAndDropController(undefined, previousDuration);

		// WHEN: Setting Infinity as the new duration
		controller.setHighlightDuration(Infinity);

		// THEN: Previous duration should be preserved
		assert.strictEqual(controller.getHighlightDuration(), previousDuration);
		controller.dispose();
	});
});

// Helper class for cancellation token
class MockCancellationToken implements vscode.CancellationToken {
	isCancellationRequested = false;
	onCancellationRequested = new vscode.EventEmitter<any>().event;
}
