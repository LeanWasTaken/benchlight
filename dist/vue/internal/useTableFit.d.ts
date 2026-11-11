import { type Ref } from 'vue';
export declare const FIT_HYSTERESIS = 8;
export declare function decideStacked(stacked: boolean, need: number, avail: number, hysteresis?: number): boolean;
export declare function useTableFit(root: Ref<HTMLElement | null>, table: Ref<HTMLElement | null>, scroller: Ref<HTMLElement | null>, options: {
    enabled: () => boolean;
    deps: () => unknown;
}): {
    stacked: Ref<boolean>;
    fitted: Ref<boolean>;
    overflowing: Ref<boolean>;
    measure: () => void;
};
