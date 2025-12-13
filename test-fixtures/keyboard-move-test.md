# Keyboard Move Test

This file provides test scenarios for Alt+Up and Alt+Down keyboard shortcuts.

---

## Scenario 1: Boundary - Top of Document

### Already First
This is at the top.

### Second Item
This is second.

**Test**: Select "Already First", press Alt+Up. Should do nothing (no-op).

---

## Scenario 2: Single Item Move Up

### Step A
Content before move.

### Step B
Content in the middle.

### Step C
Content after.

**Test**: Select "Step C" in outline, press Alt+Up. Should move above "Step B".

---

## Scenario 3: Single Item Move Down

### Second Section
More content here.

### First Section
Some content here.

### Third Section
Final content.

**Test**: Select "First Section" in outline, press Alt+Down. Should move below "Second Section".

---

## Scenario 4: Multi-Select Move Up

### Part 1
Content for part 1.

### Part 2
Content for part 2.

### Part 3
Content for part 3.

### Part 4
Content for part 4.

**Test**: Select "Part 3" and "Part 4" in outline (multi-select with Ctrl), press Alt+Up. Both should move as group above "Part 2".

---

## Scenario 5: Multi-Select Move Down

### Alpha
Alpha content.

### Beta
Beta content.

### Gamma
Gamma content.

### Delta
Delta content.

**Test**: Select "Alpha" and "Beta" in outline, press Alt+Down. Both should move as group below "Gamma".

---

## Scenario 6: Nested Headings Move Up

### Parent A
Content for parent A.

#### Child A1
Child content.

#### Child A2
More child content.

### Parent B
Content for parent B.

#### Child B1
Child of B.

**Test**: Select "Parent B" (with all children), press Alt+Up. Entire section should move above "Parent A".

---

## Scenario 7: Nested Headings Move Down

### Section X
Top level content.

#### Subsection X1
Nested content.

### Section Y
Middle content.

### Section Z
Bottom content.

**Test**: Select "Section X" (with children), press Alt+Down. Entire section should move below "Section Y".

---

## Scenario 8: Non-Contiguous Multi-Select

### Item II
Second item.

### Item I
First item.

### Item III
Third item.

### Item IV
Fourth item.

### Item V
Fifth item.

**Test**: Select "Item I" and "Item III" (non-contiguous with Ctrl), press Alt+Down. Both should move as group below "Item II" (the item immediately after the FIRST selected item, not the last).

---

## Scenario 9: Different Heading Levels

# Top Level

Content at top level.

## Level 2B

More level 2 content.

**Test**: Select "Level 2B", press Alt+Up. Should move above "Level 2A" (immediate preceding item regardless of level).

### Level 3A

Content at level 3.

## Level 2A

Content at level 2.

---

## Scenario 10: Boundary - Bottom of Document

### Penultimate
Second to last.

### Already Last
This is at the bottom.

**Test**: Select "Already Last", press Alt+Down. Should do nothing (no-op).
