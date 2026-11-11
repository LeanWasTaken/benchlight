import type { TableColumn, TableSort } from '../types.js';
export type TableRow = Record<string, unknown>;
export declare function isEmpty(value: unknown): boolean;
/** A cell's value: `value(row)` for a derived column, `row[key]` for a key column, none for a slot-only one. */
export declare function columnValue<R extends object>(row: R, column: TableColumn<R>): unknown;
export declare function formatCell<R extends object>(row: R, column: TableColumn<R>): string;
export declare function sortRows<R extends object>(rows: readonly R[], columns: readonly TableColumn<R>[], sort: TableSort | null, locale?: string): R[];
export declare function nextSort(current: TableSort | null, key: string): TableSort | null;
export declare function normSize(pageSize: number): number;
export declare function pageCount(total: number, pageSize: number): number;
export declare function clampPage(page: number, total: number, pageSize: number): number;
export declare function pageSlice<R>(rows: readonly R[], page: number, pageSize: number): R[];
export declare function pageRange(page: number, pages: number, siblings?: number): Array<number | 'gap'>;
export declare function computeTotals<R extends object>(rows: readonly R[], columns: readonly TableColumn<R>[]): Record<string, string>;
