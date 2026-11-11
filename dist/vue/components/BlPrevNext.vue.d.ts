import type { LabelOverrides, LinkAs, PrevNextItem, PrevNextLabels } from '../types.js';
type __VLS_Props = {
    prev?: PrevNextItem | null;
    next?: PrevNextItem | null;
    linkAs?: LinkAs;
    ariaLabel?: string;
    labels?: Partial<LabelOverrides<PrevNextLabels>>;
};
declare const __VLS_export: import("vue").DefineComponent<__VLS_Props, {}, {}, {}, {}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, {}, string, import("vue").PublicProps, Readonly<__VLS_Props> & Readonly<{}>, {
    ariaLabel: string;
    linkAs: LinkAs;
}, {}, {}, {}, string, import("vue").ComponentProvideOptions, false, {}, any>;
declare const _default: typeof __VLS_export;
export default _default;
