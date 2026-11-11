import { type Ref } from 'vue';
/**
 * Emits a corrected page when total or pageSize leave it out of range, on mount and on change.
 * Only once data exists (total > 0): an empty or still-loading list leaves the page alone.
 */
export declare function useClampedPage(page: Ref<number>, total: () => number, pageSize: () => number): void;
