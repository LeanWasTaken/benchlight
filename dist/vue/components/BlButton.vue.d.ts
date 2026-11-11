import type { LinkAs, LinkTo } from '../types.js';
type __VLS_Props = {
    as?: LinkAs;
    to?: LinkTo;
    href?: string;
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
    ariaLabel?: string;
    pressed?: boolean;
    pill?: boolean;
    type?: 'button' | 'submit' | 'reset';
    disabled?: boolean;
};
declare var __VLS_7: {};
type __VLS_Slots = {} & {
    icon?: (props: typeof __VLS_7) => any;
};
declare const __VLS_base: import("vue").DefineComponent<__VLS_Props, {}, {}, {}, {}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, {}, string, import("vue").PublicProps, Readonly<__VLS_Props> & Readonly<{}>, {
    type: "reset" | "submit" | "button";
    variant: "danger" | "primary" | "secondary" | "ghost";
    pressed: boolean;
}, {}, {}, {}, string, import("vue").ComponentProvideOptions, false, {}, any>;
declare const __VLS_export: __VLS_WithSlots<typeof __VLS_base, __VLS_Slots>;
declare const _default: typeof __VLS_export;
export default _default;
type __VLS_WithSlots<T, S> = T & {
    new (): {
        $slots: S;
    };
};
