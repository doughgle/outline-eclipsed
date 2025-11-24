import * as vscode from 'vscode';

/**
 * Handles pure text manipulation for moving sections of text.
 * Operates on string arrays and Range objects without VS Code API dependencies.
 * 
 * This class is designed for testability - all logic works with plain data structures
 * and can be unit tested without requiring VS Code editor instances.
 */
export class TextLineManipulator {
	/**
	 * Calculate new document content after moving sections.
	 * Handles extraction, target adjustment, and insertion of multiple sections.
	 * 
	 * @param lines - Document content as array of lines
	 * @param sectionsToMove - Sections to move with their ranges and labels
	 * @param targetLine - Destination line number
	 * @returns New document lines and the new ranges for highlighting
	 */
	calculateMovedText(
		lines: string[],
		sectionsToMove: Array<{ range: vscode.Range; label: string }>,
		targetLine: number
	): { newLines: string[]; movedRanges: vscode.Range[] } {
		const allLines = [...lines]; // Work with a copy
		
		// Store sections and their metadata
		interface SectionData {
			lines: string[];
			originalStart: number;
			originalEnd: number;
			label: string;
		}
		const extractedSections: SectionData[] = [];
		
		// Extract sections in reverse order (bottom to top) to avoid line shifts
		const sortedSections = [...sectionsToMove].sort((a, b) => 
			b.range.start.line - a.range.start.line
		);
		
		for (const section of sortedSections) {
			let sectionStart = section.range.start.line;
			let sectionEnd = section.range.end.line;
			
			// Include trailing blank line if it exists
			if (sectionEnd + 1 < allLines.length && allLines[sectionEnd + 1].trim() === '') {
				sectionEnd++;
			}
			
			// Extract the section
			const sectionLines = allLines.slice(sectionStart, sectionEnd + 1);
			extractedSections.unshift({ // Add to front to maintain document order
				lines: sectionLines,
				originalStart: sectionStart,
				originalEnd: sectionEnd,
				label: section.label
			});
			
			// Remove from document
			allLines.splice(sectionStart, sectionEnd - sectionStart + 1);
		}
		
		// Calculate adjusted target position
		// Target is in ORIGINAL document coordinates, must adjust for removed sections
		let adjustedTarget = targetLine;
		for (const section of extractedSections) {
			// If section was entirely before the target, adjust
			if (section.originalEnd < targetLine) {
				const sectionLength = section.originalEnd - section.originalStart + 1;
				adjustedTarget -= sectionLength;
			}
		}
		
		// Clamp to valid range
		adjustedTarget = Math.max(0, Math.min(adjustedTarget, allLines.length));
		
		// Insert all sections at target position in document order
		let currentInsertPos = adjustedTarget;
		const movedRanges: vscode.Range[] = [];
		
		for (const section of extractedSections) {
			allLines.splice(currentInsertPos, 0, ...section.lines);
			
			// Track the new range for highlighting
			const newRange = new vscode.Range(
				currentInsertPos,
				0,
				currentInsertPos + section.lines.length - 1,
				section.lines[section.lines.length - 1].length
			);
			movedRanges.push(newRange);
			
			currentInsertPos += section.lines.length;
		}
		
		return { newLines: allLines, movedRanges };
	}
}
