/**
 * One way of ordering items. Strategies are plain values, so the UI can list
 * them, pick one by id, and chain them.
 * @property id - Stable identifier, used in URLs and stores
 * @property labelKey - i18n key of the human-readable name
 * @property compare - Array.sort comparator, ascending
 */
export interface SortStrategy<T> {
  id: string;
  labelKey: string;
  compare: (a: T, b: T) => number;
}

/**
 * One criterion items must satisfy.
 * @property id - Stable identifier
 * @property test - Returns true when the item passes
 */
export interface FilterStrategy<T> {
  id: string;
  test: (item: T) => boolean;
}

/** Sort direction. */
export type SortDirection = "asc" | "desc";

/**
 * Chains comparators: each one only breaks the ties of the previous ones.
 * @param strategies - The strategies, most significant first
 * @returns A comparator applying them in order
 */
export function chainSorts<T>(
  ...strategies: readonly SortStrategy<T>[]
): (a: T, b: T) => number {
  return (a, b) => {
    for (const strategy of strategies) {
      const result = strategy.compare(a, b);
      if (result !== 0) return result;
    }
    return 0;
  };
}

/**
 * Flips a strategy's order.
 * @param strategy - The strategy to reverse
 * @param direction - "desc" reverses it, "asc" keeps it
 * @returns The strategy in the requested direction
 */
export function withDirection<T>(
  strategy: SortStrategy<T>,
  direction: SortDirection,
): SortStrategy<T> {
  if (direction === "asc") return strategy;
  return { ...strategy, compare: (a, b) => strategy.compare(b, a) };
}

/**
 * Sorts a copy of a list.
 * @param items - The items
 * @param strategies - Sort strategies, most significant first
 * @returns A new, sorted array
 */
export function sortWith<T>(
  items: readonly T[],
  ...strategies: readonly SortStrategy<T>[]
): T[] {
  return [...items].sort(chainSorts(...strategies));
}

/**
 * Keeps the items that pass every filter.
 * @param items - The items
 * @param filters - Filters to combine with AND; an empty list keeps everything
 * @returns A new, filtered array
 */
export function filterWith<T>(
  items: readonly T[],
  filters: readonly FilterStrategy<T>[],
): T[] {
  return items.filter((item) => filters.every((filter) => filter.test(item)));
}

/**
 * Compares nullable numbers ascending, with nulls always last.
 * @param a - First value
 * @param b - Second value
 * @returns The comparison result
 */
export function compareNullableNumbers(
  a: number | null,
  b: number | null,
): number {
  if (a === null && b === null) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  return a - b;
}
