import { type MaybeRefOrGetter, type Ref } from 'vue';
export interface MarqueeOptions {
    /** scroll speed in px per second */
    speed?: number;
    /** share of each cycle spent paused at either end */
    pause?: number;
    /** extra px scrolled past the end */
    overshoot?: number;
    /** holds the scroll still while true; hover and focus inside the container pause it as well */
    paused?: MaybeRefOrGetter<boolean>;
}
export declare function useMarquee(container: Ref<HTMLElement | null>, content: Ref<HTMLElement | null>, { speed, pause, overshoot, paused }?: MarqueeOptions): {
    overflowing: Ref<boolean>;
    refresh: () => void;
};
