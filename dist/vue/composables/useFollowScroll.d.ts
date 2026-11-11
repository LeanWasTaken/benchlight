import { type MaybeRefOrGetter, type Ref } from 'vue';
export interface FollowScrollOptions {
    /** follow new content at all (default true) */
    enabled?: MaybeRefOrGetter<boolean>;
    /** px from the bottom that still counts as "at the bottom" (default 4) */
    threshold?: number;
}
export declare function useFollowScroll(el: Ref<HTMLElement | null>, { enabled, threshold }?: FollowScrollOptions): {
    pinned: Ref<boolean>;
    toBottom: () => void;
};
