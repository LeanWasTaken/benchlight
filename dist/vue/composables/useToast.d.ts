import type { ToastOptions } from '../types.js';
export declare function useToast(): {
    toast: (input: string | ToastOptions) => string;
    dismiss: (id: string) => void;
    clear: () => void;
};
