import type { LabelOverrides } from '../types.js';
export declare function mergeLabels<T extends object>(defaults: T, partial?: LabelOverrides<T> | null): T;
