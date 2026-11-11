type __VLS_Props = {
    lines: string[];
    follow?: boolean;
    ariaLabel?: string;
    /**
     * Absolute index of `lines[0]`, default 0. When a capped buffer drops its oldest line,
     * advance this by one so surviving rows keep their DOM nodes instead of every row being
     * re-patched (which makes screen readers re-announce the log).
     */
    offset?: number;
};
declare const __VLS_export: import("vue").DefineComponent<__VLS_Props, {}, {}, {}, {}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, {}, string, import("vue").PublicProps, Readonly<__VLS_Props> & Readonly<{}>, {
    ariaLabel: string;
    offset: number;
    follow: boolean;
}, {}, {}, {}, string, import("vue").ComponentProvideOptions, false, {}, any>;
declare const _default: typeof __VLS_export;
export default _default;
