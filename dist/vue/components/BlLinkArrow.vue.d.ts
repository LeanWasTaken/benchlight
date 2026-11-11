import type { LinkAs, LinkTo } from '../types.js';
type __VLS_Props = {
    as?: LinkAs;
    to?: LinkTo;
    href?: string;
    direction?: 'left' | 'right' | 'up-right';
    quiet?: boolean;
};
declare var __VLS_7: {}, __VLS_9: {}, __VLS_11: {};
type __VLS_Slots = {} & {
    icon?: (props: typeof __VLS_7) => any;
} & {
    default?: (props: typeof __VLS_9) => any;
} & {
    icon?: (props: typeof __VLS_11) => any;
};
declare const __VLS_base: import("vue").DefineComponent<__VLS_Props, {}, {}, {}, {}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, {}, string, import("vue").PublicProps, Readonly<__VLS_Props> & Readonly<{}>, {
    direction: "left" | "right" | "up-right";
}, {}, {}, {}, string, import("vue").ComponentProvideOptions, false, {}, any>;
declare const __VLS_export: __VLS_WithSlots<typeof __VLS_base, __VLS_Slots>;
declare const _default: typeof __VLS_export;
export default _default;
type __VLS_WithSlots<T, S> = T & {
    new (): {
        $slots: S;
    };
};
