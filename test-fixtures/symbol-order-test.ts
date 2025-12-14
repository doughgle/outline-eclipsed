// Test file to verify symbols appear in document order, not alphabetical
// Expected order in outline: Zebra, Monkey, Apple, Dog, Cat, Bear

/**
 * Zebra class - should appear FIRST in outline (line 8)
 */
export class Zebra {
    constructor() {}
    
    /**
     * Zebra method (nested) - should appear before appleMethod
     */
    zebraMethod(): void {}
    
    /**
     * Apple method (nested) - should appear after zebraMethod
     */
    appleMethod(): void {}
}

/**
 * Monkey class - should appear SECOND in outline (line 25)
 */
export class Monkey {
    constructor() {}
}

/**
 * Apple class - should appear THIRD in outline (line 31)
 */
export class Apple {
    constructor() {}
}

/**
 * Dog function - should appear FOURTH in outline (line 37)
 */
export function Dog(): void {}

/**
 * Cat function - should appear FIFTH in outline (line 42)
 */
export function Cat(): void {}

/**
 * Bear constant - should appear SIXTH in outline (line 47)
 */
export const Bear = "bear";
