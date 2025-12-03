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
	 * An item is redundant if its range is strictly contained within another item's range.
	 * 
	 * Note: Items with identical ranges are both kept, as they are distinct items
	 * that happen to share the same range boundaries. True containment requires
	 * that one range is strictly smaller than the other.
	 * 
	 * @param items - Array of selected outline items
	 * @returns Filtered array with no redundant descendants
	 * @throws Error if duplicate items with identical ranges are detected (invariant violation)
	 */
	filterRedundantItems(items: readonly OutlineItem[]): OutlineItem[] {
		if (items.length <= 1) {
			return [...items];
		}

		// Assert invariant: no two distinct items should have identical ranges
		// This is a programming error if it occurs, as the outline tree should
		// never contain duplicate range items
		this.assertNoIdenticalRanges(items);

		const result: OutlineItem[] = [];
		
		for (const candidate of items) {
			// Check if this candidate is contained within any other item
			const isContainedInAnother = items.some(other => {
				if (other === candidate) {
					return false; // Don't compare item to itself
				}
				
				// Check if candidate's range is strictly contained within other's range
				// For true containment, the candidate must be smaller than the other
				// (not just equal to it)
				const candidateStart = candidate.range.start.line;
				const candidateEnd = candidate.range.end.line;
				const otherStart = other.range.start.line;
				const otherEnd = other.range.end.line;
				
				// Strictly contained: candidate is within other AND smaller
				return candidateStart >= otherStart && candidateEnd <= otherEnd
					&& (candidateStart > otherStart || candidateEnd < otherEnd);
			});
			
			if (!isContainedInAnother) {
				result.push(candidate);
			}
		}
		
		return result;
	}

	/**
	 * Validates that no two distinct items have identical ranges.
	 * This is an invariant: the outline tree should never contain items
	 * with duplicate ranges, as each item represents a unique document region.
	 * 
	 * @param items - Array of outline items to validate
	 * @throws Error if identical ranges are detected
	 */
	private assertNoIdenticalRanges(items: readonly OutlineItem[]): void {
		for (let i = 0; i < items.length; i++) {
			for (let j = i + 1; j < items.length; j++) {
				const itemA = items[i];
				const itemB = items[j];
				
				if (itemA.range.start.line === itemB.range.start.line &&
					itemA.range.end.line === itemB.range.end.line) {
					throw new Error(
						`Invariant violation: Items "${itemA.label}" and "${itemB.label}" ` +
						`have identical ranges (lines ${itemA.range.start.line}-${itemA.range.end.line}). ` +
						`Each outline item should represent a unique document region.`
					);
				}
			}
		}
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
