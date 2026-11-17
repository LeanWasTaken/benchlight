import type { Component, InjectionKey, Ref } from 'vue';
export type LinkAs = string | Component;
export type LinkTo = string | object;
/** What `current` accepts on a link-like component; `true` means `'page'`. */
export type LinkCurrent = boolean | 'page' | 'step' | 'location';
/**
 * Link props shared by every link-rendering component.
 * - `as` a component (e.g. RouterLink): receives `to` if set, otherwise `href`.
 * - `as` 'a' (the default when `to` or `href` is set): receives `href`, else a string `to`.
 * - `as` any other tag: receives neither (a dev warning fires if you passed one).
 * Components spell these props out inline rather than extending this type: compiling an
 * imported props type needs TypeScript in the consuming app.
 */
export interface LinkProps {
    as?: LinkAs;
    to?: LinkTo;
    href?: string;
}
export interface SegmentedOption<T> {
    value: T;
    label: string;
    disabled?: boolean;
}
export type SegmentedNavItem = LinkProps & {
    label: string;
    current?: LinkCurrent;
};
export interface SelectOption<T> {
    value: T;
    label: string;
}
export interface SpecRowData extends LinkProps {
    label: string;
    value: string;
    /** open in a new tab; default: true for absolute or protocol-relative URLs */
    external?: boolean;
}
export type MetaItem = string | {
    text: string;
    class?: string;
};
export interface PrevNextItem extends Pick<LinkProps, 'to' | 'href'> {
    title: string;
}
/**
 * A partial label set for a `labels` prop. An `undefined` value falls back to the default, also
 * under `exactOptionalPropertyTypes`. Props spell it `Partial<LabelOverrides<…>>`: Vue compiles
 * a `Partial<>` prop to a runtime `Object` check, and an unresolved alias to none.
 */
export type LabelOverrides<T> = {
    [K in keyof T]?: T[K] | undefined;
};
export interface AppearanceLabels {
    legend: string;
    auto: string;
    light: string;
    dark: string;
    /** The short visible mark beside each option; defaults to A / L / D. */
    marks?: LabelOverrides<{
        auto: string;
        light: string;
        dark: string;
    }>;
}
export interface MarqueeLabels {
    /** Name of the pause toggle; its state is `aria-pressed`, so keep the wording constant. */
    pause: string;
}
export interface PrevNextLabels {
    prev: string;
    next: string;
}
export interface FieldContext {
    id: Readonly<Ref<string>>;
    describedBy: Readonly<Ref<string | undefined>>;
    invalid: Readonly<Ref<boolean>>;
}
export declare const FIELD_CONTEXT: InjectionKey<FieldContext>;
/** What every column kind shares. `Row` is reserved so a later member can take the row. */
export interface ColumnBase<Row extends object> {
    label: string;
    align?: 'start' | 'end' | 'center';
    numeric?: boolean;
    width?: string;
    primary?: boolean;
}
/** A footer total over all rows: a built-in reduction, or a function returning a number. */
export type TableTotal<Row> = 'sum' | 'avg' | 'count' | ((rows: Row[]) => number);
/** A column showing a row field: `key` must be a string key of `Row`; `format` gets `Row[key]`. */
export type KeyColumn<Row extends object> = {
    [K in Extract<keyof Row, string>]-?: ColumnBase<Row> & {
        key: K;
        value?: never;
        slot?: never;
        format?: (value: Row[K], row: Row) => string;
        sortable?: boolean;
        sortBy?: (row: Row) => string | number | null | undefined;
        total?: TableTotal<Row>;
        formatTotal?: (value: number, rows: Row[]) => string;
    };
}[Extract<keyof Row, string>];
/**
 * A computed column: `value(row)` supplies the cell, the sort and the total. `format` gets what
 * `value` returns; inline in a `TableColumn<Row>[]` annotate its parameter, or type the column as
 * `DerivedColumn<Row, V>`.
 */
export interface DerivedColumn<Row extends object, V = unknown> extends ColumnBase<Row> {
    key: string;
    value: (row: Row) => V;
    slot?: never;
    format?(value: V, row: Row): string;
    sortable?: boolean;
    sortBy?: (row: Row) => string | number | null | undefined;
    total?: TableTotal<Row>;
    formatTotal?: (value: number, rows: Row[]) => string;
}
/** A column rendered only by its `cell-<key>` slot (actions, buttons): never sorted or totalled. */
export interface SlotColumn<Row extends object> extends ColumnBase<Row> {
    key: string;
    slot: true;
    value?: never;
    format?: never;
    sortable?: false;
    sortBy?: never;
    total?: never;
    formatTotal?: never;
}
export type TableColumn<Row extends object = Record<string, unknown>> = KeyColumn<Row> | DerivedColumn<Row> | SlotColumn<Row>;
export interface TableSort {
    key: string;
    dir: 'asc' | 'desc';
}
export interface TableLabels {
    total: string;
    empty: string;
    sortStrip: string;
    sortAscending: string;
    sortDescending: string;
    /** Accessible name of the table's pagination. */
    pages: (caption: string) => string;
}
export interface PaginationLabels {
    prev: string;
    next: string;
    page: (n: number) => string;
    pageOf: (page: number, pages: number) => string;
    range: (from: number, to: number, total: number) => string;
}
export interface DialogLabels {
    close: string;
}
export type DialogCloseReason = 'button' | 'backdrop' | 'escape' | 'program' | 'native';
/** Status vocabulary shared by BlMsg, BlLed and toasts. Neutral is the unmarked base (an unlit BlLed). */
export type StatusTone = 'neutral' | 'success' | 'danger';
export type ToastTone = StatusTone;
export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
/** Payload of BlDialog's `close` event. */
export interface DialogCloseEvent {
    reason: DialogCloseReason;
    returnValue: string;
}
export interface ToastAction {
    label: string;
    onClick: () => void;
}
export interface ToastOptions {
    message: string;
    tone?: ToastTone;
    action?: ToastAction;
    duration?: number;
    id?: string;
}
export interface ToasterLabels {
    dismiss: string;
    actionHint: (label: string) => string;
}
/** Which edge of the anchor a panel sits on; `start`/`end` follow the writing mode. */
export type PopoverSide = 'top' | 'bottom' | 'start' | 'end';
/** How a panel lines up along the anchor's edge. */
export type PopoverAlign = 'start' | 'center' | 'end';
/** What BlPopover's `trigger` slot hands over as `bind`, for `v-bind` on the consumer's button. */
export interface PopoverTriggerBind {
    id: string;
    type: 'button';
    'aria-expanded': 'true' | 'false';
    'aria-controls': string;
    popovertarget: string;
    style: {
        anchorName: string;
    };
}
/** What BlTooltip's `trigger` slot hands over as `bind`, for `v-bind` on the described control. */
export interface TooltipTriggerBind {
    'aria-describedby': string;
    style: {
        anchorName: string;
    };
    onPointerenter: (e: PointerEvent) => void;
    onPointerleave: (e: PointerEvent) => void;
    onFocus: (e: FocusEvent) => void;
    onBlur: (e: FocusEvent) => void;
}
export interface TabItem<T extends string | number = string | number> {
    value: T;
    label: string;
    disabled?: boolean;
}
