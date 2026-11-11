import { type MaybeRefOrGetter, type Ref } from 'vue';
/**
 * Ref that is true once the page is scrolled past `threshold` px (a number, `false` to disable, a ref
 * or a getter, re-evaluated on change). `false` on the server and until mounted.
 */
export declare function useScrollLifted(threshold?: MaybeRefOrGetter<number | false>): Ref<boolean>;
