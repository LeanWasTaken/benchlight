type __VLS_Props = {
    eyebrow?: string;
    heading?: string;
    level?: 1 | 2 | 3 | 4 | 5 | 6;
    bar?: boolean;
    ruled?: boolean;
};
declare var __VLS_7: {}, __VLS_15: {};
type __VLS_Slots = {} & {
    actions?: (props: typeof __VLS_7) => any;
} & {
    actions?: (props: typeof __VLS_15) => any;
};
declare const __VLS_base: import("vue").DefineComponent<__VLS_Props, {}, {}, {}, {}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, {}, string, import("vue").PublicProps, Readonly<__VLS_Props> & Readonly<{}>, {
    level: 1 | 2 | 3 | 4 | 5 | 6;
}, {}, {}, {}, string, import("vue").ComponentProvideOptions, false, {}, any>;
declare const __VLS_export: __VLS_WithSlots<typeof __VLS_base, __VLS_Slots>;
declare const _default: typeof __VLS_export;
export default _default;
type __VLS_WithSlots<T, S> = T & {
    new (): {
        $slots: S;
    };
};
