import type { LabelOverrides, PaginationLabels } from '../types.js';
/** Page navigation. Renders nothing when there is a single page. See README. */
type __VLS_Props = {
    total: number;
    pageSize: number;
    /** Accessible name of the nav. */
    ariaLabel?: string;
    siblings?: number;
    labels?: Partial<LabelOverrides<PaginationLabels>> | undefined;
};
type __VLS_ModelProps = {
    'page'?: number;
};
type __VLS_PublicProps = __VLS_Props & __VLS_ModelProps;
declare const __VLS_export: import("vue").DefineComponent<__VLS_PublicProps, {}, {}, {}, {}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, {
    "update:page": (value: number) => any;
}, string, import("vue").PublicProps, Readonly<__VLS_PublicProps> & Readonly<{
    "onUpdate:page"?: (value: number) => any;
}>, {
    siblings: number;
}, {}, {}, {}, string, import("vue").ComponentProvideOptions, false, {}, any>;
declare const _default: typeof __VLS_export;
export default _default;
