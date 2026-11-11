import type { LabelOverrides, LinkAs, LinkTo, PaginationLabels, TableColumn, TableLabels } from '../types.js';
declare const __VLS_export: <Row extends object, C extends TableColumn<Row> = TableColumn<Row>>(__VLS_props: NonNullable<Awaited<typeof __VLS_setup>>["props"], __VLS_ctx?: __VLS_PrettifyLocal<Pick<NonNullable<Awaited<typeof __VLS_setup>>, "attrs" | "emit" | "slots">>, __VLS_exposed?: NonNullable<Awaited<typeof __VLS_setup>>["expose"], __VLS_setup?: Promise<{
    props: import("vue").PublicProps & __VLS_PrettifyLocal<({
        caption: string;
        captionHidden?: boolean;
        columns: readonly C[];
        rows: readonly Row[];
        rowKey?: Extract<keyof Row, string> | ((row: Row) => string | number);
        scroll?: boolean;
        compact?: boolean;
        pageSize?: number;
        manual?: boolean;
        totalRows?: number;
        totals?: Record<string, string | number>;
        rowLink?: (row: Row) => {
            as?: LinkAs | undefined;
            to?: LinkTo | undefined;
            href?: string | undefined;
        };
        /** What `@row-activate` compiles to. Its presence makes rows interactive (a primary-cell button). */
        onRowActivate?: (row: Row) => void;
        /** Sort collation locale, e.g. `'lv'`. Defaults to `'en'`, so server and client agree. */
        locale?: string;
        labels?: Partial<LabelOverrides<TableLabels>>;
        paginationLabels?: Partial<LabelOverrides<PaginationLabels>>;
    } & {
        sort?: {
            key: string;
            dir: "asc" | "desc";
        } | null;
        page?: number;
    }) & {
        "onUpdate:page"?: (value: number) => any;
        "onUpdate:sort"?: (value: {
            key: string;
            dir: "asc" | "desc";
        } | null) => any;
    }> & (typeof globalThis extends {
        __VLS_PROPS_FALLBACK: infer P;
    } ? P : {});
    expose: (exposed: {}) => void;
    attrs: any;
    slots: {
        [name: `head-${string}`]: ((props: {
            column: C;
        }) => unknown) | undefined;
        caption?: () => unknown;
        empty?: () => unknown;
        footer?: (props: {
            rows: Row[];
        }) => unknown;
    } & { [K in C["key"] as `cell-${K}`]?: (props: {
        row: Row;
        value: Extract<C, {
            key: K;
        }> extends infer T ? T extends Extract<C, {
            key: K;
        }> ? T extends {
            slot: true;
        } ? undefined : T extends {
            value: (row: never) => infer V;
        } ? V : K extends keyof Row ? Row[K] : unknown : never : never;
        column: Extract<C, {
            key: K;
        }>;
    }) => unknown; };
    emit: ((event: "update:page", value: number) => void) & ((event: "update:sort", value: {
        key: string;
        dir: "asc" | "desc";
    } | null) => void);
}>) => import("vue").VNode & {
    __ctx?: NonNullable<Awaited<typeof __VLS_setup>>;
};
declare const _default: typeof __VLS_export;
export default _default;
type __VLS_PrettifyLocal<T> = (T extends any ? {
    [K in keyof T]: T[K];
} : {
    [K in keyof T as K]: T[K];
}) & {};
