export function normalizeSearchQuery(query: string) {
  return query.trim().toLocaleLowerCase();
}

/** True when any field contains the already-normalized query; an empty query matches everything. */
export function matchesSearchQuery(
  normalizedQuery: string,
  fields: Array<string | null | undefined>,
) {
  if (!normalizedQuery) return true;
  return fields.some((field) => field?.toLocaleLowerCase().includes(normalizedQuery));
}
