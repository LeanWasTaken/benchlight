/**
 * Joins description ids: the field's hint id first, then the consumer's, without duplicates.
 * Returns `undefined` when there is nothing to reference.
 */
export declare function mergeDescribedBy(...ids: unknown[]): string | undefined;
