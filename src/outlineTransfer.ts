import * as vscode from 'vscode';
import { OutlineItem } from './outlineItem';

/**
 * Handles serialization and deserialization of outline items for drag-and-drop transfer.
 * Manages MIME type and JSON conversion of items with Range objects.
 * 
 * This class can be unit tested by verifying JSON round-trip conversion
 * without requiring VS Code DataTransfer objects.
 */
export class OutlineTransfer {
	/**
	 * MIME type identifier for outline item drag-and-drop operations
	 */
	readonly mimeType = 'application/vnd.code.tree.outlineeclipsed';

	/**
	 * Serialize outline items to JSON for data transfer.
	 * Converts vscode.Range objects to plain objects for JSON serialization.
	 * 
	 * @param items - Array of outline items to serialize
	 * @returns JSON string representation
	 */
	serialize(items: OutlineItem[]): string {
		const serialized = items.map(item => ({
			label: item.label,
			level: item.level,
			range: {
				start: { line: item.range.start.line, character: item.range.start.character },
				end: { line: item.range.end.line, character: item.range.end.character }
			},
			selectionRange: {
				start: { line: item.selectionRange.start.line, character: item.selectionRange.start.character },
				end: { line: item.selectionRange.end.line, character: item.selectionRange.end.character }
			}
		}));
		
		return JSON.stringify(serialized);
	}

	/**
	 * Deserialize JSON drag data to typed objects with vscode.Range objects.
	 * Reconstructs Range objects from plain JSON data.
	 * 
	 * @param json - JSON string from data transfer
	 * @returns Array of items with Range objects and metadata
	 */
	deserialize(json: string): Array<{ range: vscode.Range; label: string; level: number }> {
		const parsed = JSON.parse(json);
		
		return parsed.map((itemData: any) => ({
			range: new vscode.Range(
				itemData.range.start.line,
				itemData.range.start.character,
				itemData.range.end.line,
				itemData.range.end.character
			),
			label: itemData.label,
			level: itemData.level
		}));
	}
}
