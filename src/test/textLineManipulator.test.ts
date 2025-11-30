import * as assert from 'assert';
import * as vscode from 'vscode';
import { TextLineManipulator } from '../textLineManipulator';

suite('TextLineManipulator Unit Tests', () => {
	let manipulator: TextLineManipulator;

	setup(() => {
		manipulator = new TextLineManipulator();
	});

	test('determineExtractionBounds - include single trailing blank only', () => {
		const lines = [
			'# A',
			'Content A',
			'',
			'',
			'# B',
			'Content B'
		];
		const range = new vscode.Range(0, 0, 1, 9);
		const bounds = manipulator.determineExtractionBounds(lines, range);
		assert.strictEqual(bounds.start, 0);
		// Only the first trailing blank (line 2) is included; not line 3
		assert.strictEqual(bounds.end, 2);
		assert.strictEqual(bounds.hasLeadingBlank, false);
		assert.strictEqual(bounds.hasTrailingBlank, true);
	});

	test('determineExtractionBounds - no trailing blank present', () => {
		const lines = [
			'# A',
			'Content A',
			'# B'
		];
		const range = new vscode.Range(0, 0, 1, 9);
		const bounds = manipulator.determineExtractionBounds(lines, range);
		assert.strictEqual(bounds.start, 0);
		assert.strictEqual(bounds.end, 1);
		assert.strictEqual(bounds.hasTrailingBlank, false);
	});

	test('determineExtractionBounds - leading blank detected but not included', () => {
		const lines = [
			'',
			'# A',
			'Content A',
			'# B'
		];
		const range = new vscode.Range(1, 0, 2, 9);
		const bounds = manipulator.determineExtractionBounds(lines, range);
		assert.strictEqual(bounds.start, 1);
		assert.strictEqual(bounds.end, 2);
		assert.strictEqual(bounds.hasLeadingBlank, true);
		assert.strictEqual(bounds.hasTrailingBlank, false);
	});

	test('determineExtractionBounds - boundaries at start/end of document', () => {
		const lines = [
			'# A',
			'Content A',
			'',
			'# B',
			'Content B',
			''
		];
		// Start of doc
		const boundsStart = manipulator.determineExtractionBounds(lines, new vscode.Range(0, 0, 1, 9));
		assert.strictEqual(boundsStart.start, 0);
		assert.strictEqual(boundsStart.hasLeadingBlank, false);
		assert.strictEqual(boundsStart.end, 2);
		// End near EOF: trailing blank exists but inclusion should only include immediate one
		const boundsEnd = manipulator.determineExtractionBounds(lines, new vscode.Range(3, 0, 4, 9));
		assert.strictEqual(boundsEnd.end, 5);
		assert.strictEqual(boundsEnd.hasTrailingBlank, true);
	});

	test('Single section move - basic case', () => {
		// GIVEN: Document with three sections
		const lines = [
			'# Section 1',
			'Content 1',
			'',
			'# Section 2',
			'Content 2',
			'',
			'# Section 3',
			'Content 3'
		];

		const sectionsToMove = [{
			range: new vscode.Range(0, 0, 2, 0),
			label: 'Section 1'
		}];

		// WHEN: Moving Section 1 after Section 2
		const { newLines, movedRanges } = manipulator.calculateMovedText(lines, sectionsToMove, 6);

		// THEN: Section 1 should be after Section 2
		assert.strictEqual(newLines[0], '# Section 2');
		assert.strictEqual(newLines[3], '# Section 1');
		assert.strictEqual(movedRanges.length, 1);
		assert.strictEqual(movedRanges[0].start.line, 3);
	});

	test('Multiple sections move in document order', () => {
		// GIVEN: Document with four sections
		const lines = [
			'# Section 1',
			'Content 1',
			'',
			'# Section 2',
			'Content 2',
			'',
			'# Section 3',
			'Content 3',
			'',
			'# Section 4',
			'Content 4'
		];

		const sectionsToMove = [
			{
				range: new vscode.Range(0, 0, 2, 0),
				label: 'Section 1'
			},
			{
				range: new vscode.Range(3, 0, 5, 0),
				label: 'Section 2'
			}
		];

		// WHEN: Moving Section 1 and 2 after Section 3
		const { newLines, movedRanges } = manipulator.calculateMovedText(lines, sectionsToMove, 9);

		// THEN: Sections should maintain their relative order
		assert.strictEqual(newLines[0], '# Section 3');
		assert.strictEqual(newLines[3], '# Section 1');
		assert.strictEqual(newLines[6], '# Section 2');
		assert.strictEqual(movedRanges.length, 2);
	});

	test('Trailing blank line inclusion', () => {
		// GIVEN: Document with section followed by blank line
		const lines = [
			'# Section 1',
			'Content 1',
			'',
			'# Section 2',
			'Content 2'
		];

		const sectionsToMove = [{
			range: new vscode.Range(0, 0, 1, 9),
			label: 'Section 1'
		}];

		// WHEN: Moving section
		const { newLines, movedRanges } = manipulator.calculateMovedText(lines, sectionsToMove, 4);

		// THEN: Blank line should be included in moved section
		assert.strictEqual(newLines.length, 5);
		assert.strictEqual(movedRanges[0].end.line - movedRanges[0].start.line, 2); // 3 lines total
	});

	test('Move to beginning of document', () => {
		// GIVEN: Document with three sections
		const lines = [
			'# Section 1',
			'Content 1',
			'',
			'# Section 2',
			'Content 2',
			'',
			'# Section 3',
			'Content 3'
		];

		const sectionsToMove = [{
			range: new vscode.Range(6, 0, 7, 9),
			label: 'Section 3'
		}];

		// WHEN: Moving Section 3 to beginning
		const { newLines, movedRanges } = manipulator.calculateMovedText(lines, sectionsToMove, 0);

		// THEN: Section 3 should be first
		assert.strictEqual(newLines[0], '# Section 3');
		assert.strictEqual(newLines[2], '# Section 1');
		assert.strictEqual(movedRanges[0].start.line, 0);
	});

	test('Move to end of document', () => {
		// GIVEN: Document with three sections
		const lines = [
			'# Section 1',
			'Content 1',
			'',
			'# Section 2',
			'Content 2',
			'',
			'# Section 3',
			'Content 3'
		];

		const sectionsToMove = [{
			range: new vscode.Range(0, 0, 2, 0),
			label: 'Section 1'
		}];

		// WHEN: Moving Section 1 to end
		const { newLines, movedRanges } = manipulator.calculateMovedText(lines, sectionsToMove, lines.length);

		// THEN: Section 1 should be last
		assert.strictEqual(newLines[0], '# Section 2');
		assert.strictEqual(newLines[5], '# Section 1');
	});

	test('Target adjustment when moving forward', () => {
		// GIVEN: Document with sections
		const lines = [
			'# Section 1',
			'Content 1',
			'',
			'# Section 2',
			'Content 2'
		];

		const sectionsToMove = [{
			range: new vscode.Range(0, 0, 2, 0),
			label: 'Section 1'
		}];

		// WHEN: Moving Section 1 forward
		const { newLines } = manipulator.calculateMovedText(lines, sectionsToMove, 5);

		// THEN: Target should be adjusted for extraction
		assert.strictEqual(newLines[0], '# Section 2');
		assert.strictEqual(newLines[2], '# Section 1');
	});

	test('Preserve blank accumulation at insertion target', () => {
		// GIVEN: Each section carries a trailing blank; moving multiple preserves accumulation
		const lines = [
			'# A', 'A1', '',
			'# B', 'B1', '',
			'# C', 'C1', ''
		];
		const sectionsToMove = [
			{ range: new vscode.Range(0, 0, 2, 9), label: 'A' },
			{ range: new vscode.Range(3, 0, 5, 9), label: 'B' }
		];
		const { newLines } = manipulator.calculateMovedText(lines, sectionsToMove, lines.length);
		
		// THEN: C remains first, then A block (with blank), then B block (with blank)
		assert.strictEqual(newLines.length, 9, 'Should have 9 total lines');
		assert.strictEqual(newLines[0], '# C');
		assert.strictEqual(newLines[1], 'C1');
		assert.strictEqual(newLines[2], '', 'C trailing blank preserved');
		assert.strictEqual(newLines[3], '# A');
		assert.strictEqual(newLines[4], 'A1');
		assert.strictEqual(newLines[5], '', 'A trailing blank preserved');
		assert.strictEqual(newLines[6], '# B');
		assert.strictEqual(newLines[7], 'B1');
		assert.strictEqual(newLines[8], '', 'B trailing blank preserved');
	});

	test('Sections without separators stay adjacent (no auto blank insertion)', () => {
		const lines = [
			'# A', 'A1',
			'# B', 'B1'
		];
		const { newLines } = manipulator.calculateMovedText(lines, [{ range: new vscode.Range(0, 0, 1, 9), label: 'A' }], 4);
		assert.deepStrictEqual(newLines, ['# B', 'B1', '# A', 'A1']);
	});

	test('Move to start does not add leading blank', () => {
		const lines = [
			'# B', 'B1', '',
			'# A', 'A1', ''
		];
		const { newLines } = manipulator.calculateMovedText(lines, [{ range: new vscode.Range(3, 0, 4, 9), label: 'A' }], 0);
		assert.strictEqual(newLines[0], '# A');
		assert.strictEqual(newLines[2], ''); // trailing blank preserved
	});

	test('Move to end preserves existing EOF state (no normalization)', () => {
		const lines = [
			'# A', 'A1', '',
			'# B', 'B1', '',
			'' // extra EOF blank retained in base behavior
		];
		const { newLines } = manipulator.calculateMovedText(lines, [{ range: new vscode.Range(0, 0, 1, 9), label: 'A' }], lines.length);
		// Expect single extra EOF blank still present (no MD047 enforcement here)
		assert.strictEqual(newLines[newLines.length - 1], '');
	});

	test('Empty sections array returns unchanged document', () => {
		// GIVEN: Document with content
		const lines = ['Line 1', 'Line 2', 'Line 3'];

		// WHEN: Moving empty array
		const { newLines, movedRanges } = manipulator.calculateMovedText(lines, [], 1);

		// THEN: Document should be unchanged
		assert.deepStrictEqual(newLines, lines);
		assert.strictEqual(movedRanges.length, 0);
	});

	test('Sections extracted in reverse order to avoid index shifts', () => {
		// GIVEN: Document with sections
		const lines = [
			'# A',
			'Content A',
			'# B',
			'Content B',
			'# C',
			'Content C'
		];

		const sectionsToMove = [
			{
				range: new vscode.Range(0, 0, 1, 9),
				label: 'A'
			},
			{
				range: new vscode.Range(4, 0, 5, 9),
				label: 'C'
			}
		];

		// WHEN: Moving non-adjacent sections to target line 2 (where B starts in original)
		// A ends at line 1 (< 2), so target adjusts: 2 - 2 = 0
		// C ends at line 5 (>= 2), so no further adjustment
		// Result: insert at position 0
		const { newLines } = manipulator.calculateMovedText(lines, sectionsToMove, 2);

		// THEN: Sections move to beginning, maintaining document order
		assert.strictEqual(newLines[0], '# A');
		assert.strictEqual(newLines[2], '# C');
		assert.strictEqual(newLines[4], '# B');
	});
});
