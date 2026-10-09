export const MAX_SEARCH_LENGTH = 25

export function normalizeSearchQuery(value: string): string {
  return value.trim().replace(/\s+/g, " ").slice(0, MAX_SEARCH_LENGTH)
}
