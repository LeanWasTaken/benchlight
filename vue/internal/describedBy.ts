/**
 * Joins description ids: the field's hint id first, then the consumer's, without duplicates.
 * Returns `undefined` when there is nothing to reference.
 */
export function mergeDescribedBy(...ids: unknown[]): string | undefined {
  const seen = new Set<string>()
  for (const value of ids) {
    if (typeof value !== 'string') continue
    for (const id of value.split(/\s+/)) if (id) seen.add(id)
  }
  return seen.size ? [...seen].join(' ') : undefined
}
