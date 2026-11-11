import type { ToastAction, ToastOptions, ToastTone } from '../types.js';
export interface ToastRecord {
    id: string;
    key: number;
    message: string;
    tone: ToastTone;
    action?: ToastAction | undefined;
    duration: number;
    version: number;
}
export declare const toastState: {
    items: {
        id: string;
        key: number;
        message: string;
        tone: ToastTone;
        action?: {
            label: string;
            onClick: () => void;
        } | undefined;
        duration: number;
        version: number;
    }[];
    cleared: number;
    toasters: number;
};
export declare function normDuration(value: number): number;
export declare function addToast(input: string | ToastOptions): string;
export declare function dismissToast(id: string): void;
export declare function clearToasts(): void;
export declare function resetToastStore(): void;
