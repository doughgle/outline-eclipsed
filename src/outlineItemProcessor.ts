import { OutlineItem } from './outlineItem';

/**
 * Handles selection processing for outline items.
 * Filters redundant nested selections and sorts items by document position.
 * 
 * This class operates purely on OutlineItem objects and can be unit tested
 * without requiring VS Code editor instances or document parsing.
 */
export class OutlineItemProcessor {
	/**
	 * Remove items that are descendants of other selected items.
	 * This prevents moving a section twice (once as parent, once as child).
	 * An item is redundant if its range is contained within another item's range.
	 * 
	 * @param items - Array of selected outline items
	 * @returns Filtered array with no redundant descendants
	 */
	filterRedundantItems(items: readonly OutlineItem[]): OutlineItem[] {
		if (items.length <= 1) {
			return [...items];
		}

		const result: OutlineItem[] = [];
		
		for (const candidate of items) {
			// Check if this candidate is contained within any other item
			const isContainedInAnother = items.some(other => {
				if (other === candidate) {
					return false; // Don't compare item to itself
				}
				
				// Check if candidate's range is fully contained within other's range
				const candidateStart = candidate.range.start.line;
				const candidateEnd = candidate.range.end.line;
				const otherStart = other.range.start.line;
				const otherEnd = other.range.end.line;
				
				return candidateStart >= otherStart && candidateEnd <= otherEnd;
			});
			
			if (!isContainedInAnother) {
				result.push(candidate);
			}
		}
		
		return result;
	}

	/**
	 * Sort items by their appearance in the document (top to bottom).
	 * This ensures consistent ordering when moving multiple items.
	 * 
	 * @param items - Array of outline items
	 * @returns Sorted array ordered by starting line number
	 */
	sortItemsByPosition(items: OutlineItem[]): OutlineItem[] {
		return [...items].sort((a, b) => {
			return a.range.start.line - b.range.start.line;
		});
	}
}
