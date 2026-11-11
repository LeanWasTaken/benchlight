import { type VNode } from 'vue';
import type { DialogCloseEvent, DialogLabels, LabelOverrides } from '../types.js';
type __VLS_Props = {
    title: string;
    description?: string;
    dismissible?: boolean;
    labels?: Partial<LabelOverrides<DialogLabels>>;
};
type __VLS_Slots = {
    default?: () => VNode[];
    footer?: () => VNode[];
};
type __VLS_ModelProps = {
    'open': boolean;
};
type __VLS_PublicProps = __VLS_Props & __VLS_ModelProps;
declare const __VLS_base: import("vue").DefineComponent<__VLS_PublicProps, {}, {}, {}, {}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, {
    close: (payload: DialogCloseEvent) => any;
    "update:open": (value: boolean) => any;
}, string, import("vue").PublicProps, Readonly<__VLS_PublicProps> & Readonly<{
    onClose?: (payload: DialogCloseEvent) => any;
    "onUpdate:open"?: (value: boolean) => any;
}>, {
    dismissible: boolean;
}, {}, {}, {}, string, import("vue").ComponentProvideOptions, false, {}, any>;
declare const __VLS_export: __VLS_WithSlots<typeof __VLS_base, __VLS_Slots>;
declare const _default: typeof __VLS_export;
export default _default;
type __VLS_WithSlots<T, S> = T & {
    new (): {
        $slots: S;
    };
};
