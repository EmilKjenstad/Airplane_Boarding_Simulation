/**
 * Helper functions for working with configurable seat group layouts.
 *
 * A seat layout is described as an array of group sizes, e.g.:
 *   [3, 3]     → narrow-body (Boeing 737): 3 left | aisle | 3 right
 *   [2, 4, 2]  → wide-body (Boeing 777):  2 | aisle | 4 | aisle | 2
 *   [3, 3, 3]  → wide-body (Boeing 777-9): 3 | aisle | 3 | aisle | 3
 *   [1, 2]     → private / asymmetric
 *
 * Aisles exist between every adjacent pair of groups.
 * Number of aisles = groups.length - 1.
 */

/** Total number of seat columns across all groups. */
export function totalCols(groups: number[]): number {
  return groups.reduce((a, b) => a + b, 0);
}

/** First column index (0-indexed) of a given group. */
export function groupStartCol(groups: number[], groupIdx: number): number {
  return groups.slice(0, groupIdx).reduce((a, b) => a + b, 0);
}

/** Which group a column belongs to. */
export function colToGroup(col: number, groups: number[]): number {
  let offset = 0;
  for (let g = 0; g < groups.length; g++) {
    offset += groups[g];
    if (col < offset) return g;
  }
  return groups.length - 1;
}

/**
 * Which aisle a passenger assigned to `col` should use.
 * For edge groups (leftmost/rightmost), there is only one adjacent aisle.
 * For middle groups, passengers use the aisle closest to their seat within the group.
 */
export function colToAisle(col: number, groups: number[]): number {
  const numAisles = groups.length - 1;
  if (numAisles === 0) return 0; // single group — shouldn't normally happen

  const g = colToGroup(col, groups);

  if (g === 0) return 0;
  if (g === groups.length - 1) return numAisles - 1;

  // Middle group — pick the nearer aisle
  const start = groupStartCol(groups, g);
  const colInGroup = col - start;
  const groupSize = groups[g];
  return colInGroup < groupSize / 2 ? g - 1 : g;
}

/**
 * "Window distance" — how far this seat is from the nearest window (outer wall).
 * 0 = aisle-adjacent, higher = more window-like.
 * Used for window-middle-aisle and outside-in boarding strategies.
 */
export function windowDistance(col: number, groups: number[]): number {
  const g = colToGroup(col, groups);
  const start = groupStartCol(groups, g);
  const colInGroup = col - start;
  const groupSize = groups[g];

  if (g === 0) {
    // Aisle on the right, window on the left: window = col 0 of group
    return groupSize - 1 - colInGroup;
  }
  if (g === groups.length - 1) {
    // Aisle on the left, window on the right:
    return colInGroup;
  }
  // Middle group: both sides face aisles, "window" is the center
  return Math.min(colInGroup, groupSize - 1 - colInGroup);
}

/** Preset layouts for common aircraft types. */
export const PLANE_PRESETS: { label: string; groups: number[] }[] = [
  { label: 'Narrow-body / Boeing 737 (3+3)', groups: [3, 3] },
  { label: 'Wide-body / Boeing 777 (3+3+3)', groups: [3, 3, 3] },
  { label: 'Wide-body / Boeing 777 (2+4+2)', groups: [2, 4, 2] },
  { label: 'Wide-body / Boeing 777 (2+5+2)', groups: [2, 5, 2] },
  { label: 'Airbus A380 upper deck (2+2)', groups: [2, 2] },
  { label: 'Regional jet (2+2)', groups: [2, 2] },
  { label: 'Regional jet (1+2)', groups: [1, 2] },
  { label: 'Private / asymmetric (1+1)', groups: [1, 1] },
  { label: 'Custom', groups: [] },
];
