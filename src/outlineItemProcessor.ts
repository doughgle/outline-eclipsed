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
	 * Invariant: No two distinct items should have identical ranges, as each outline
	 * item represents a unique document region. An error is thrown if this invariant
	 * is violated.
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
				// Using VS Code Range methods for precise position matching
				// For true containment, the candidate must be smaller than the other
				// (not just equal to it)
				return other.range.contains(candidate.range) && 
					!other.range.isEqual(candidate.range);
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
				
				// Use Range.isEqual for precise comparison including character positions
				if (itemA.range.isEqual(itemB.range)) {
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
