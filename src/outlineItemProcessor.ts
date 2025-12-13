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

	/**
	 * PI-12: Find the outline item immediately preceding the first selected item.
	 * Returns the item that appears right before the first item in the selection.
	 * Used for Alt+Up keyboard shortcut to determine drop target.
	 * 
	 * @param allItems - Complete flat list of all outline items in document order
	 * @param selectedItems - Currently selected items (may be unsorted)
	 * @returns The item immediately before the first selected item, or undefined if at document start
	 */
	findPrecedingItem(allItems: OutlineItem[], selectedItems: OutlineItem[]): OutlineItem | undefined {
		if (selectedItems.length === 0 || allItems.length === 0) {
			return undefined;
		}

		// Find the first selected item (earliest in document)
		const sortedSelection = this.sortItemsByPosition([...selectedItems]);
		const firstSelected = sortedSelection[0];

		// Find its position in the full list
		const firstSelectedIndex = allItems.findIndex(item => 
			item.range.start.line === firstSelected.range.start.line
		);

		if (firstSelectedIndex <= 0) {
			// Already at start of document
			return undefined;
		}

		// Return the item immediately before
		return allItems[firstSelectedIndex - 1];
	}

	/**
	 * PI-12: Find the outline item immediately following the last selected item.
	 * Returns the item that appears right after the last item in the selection.
	 * Used for Alt+Down keyboard shortcut to determine drop target.
	 * 
	 * @param allItems - Complete flat list of all outline items in document order
	 * @param selectedItems - Currently selected items (may be unsorted)
	 * @returns The item immediately after the last selected item, or undefined if at document end
	 */
	findFollowingItem(allItems: OutlineItem[], selectedItems: OutlineItem[]): OutlineItem | undefined {
		if (selectedItems.length === 0 || allItems.length === 0) {
			return undefined;
		}

		// Find the last selected item (latest in document)
		const sortedSelection = this.sortItemsByPosition([...selectedItems]);
		const lastSelected = sortedSelection[sortedSelection.length - 1];

		// Find its position in the full list
		const lastSelectedIndex = allItems.findIndex(item => 
			item.range.start.line === lastSelected.range.start.line
		);

		if (lastSelectedIndex === -1 || lastSelectedIndex >= allItems.length - 1) {
			// Already at end of document
			return undefined;
		}

		// Find the next item that is NOT a child of the last selected item
		// A child's range is contained within the parent's range
		for (let i = lastSelectedIndex + 1; i < allItems.length; i++) {
			const candidate = allItems[i];
			
			// Check if candidate is a descendant of lastSelected
			if (!lastSelected.range.contains(candidate.range)) {
				// Found the next item that's not a child
				return candidate;
			}
		}

		// No following item found (all remaining items are children)
		return undefined;
	}
}
