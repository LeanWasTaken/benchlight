import { type Ref } from 'vue';
export type AppearanceMode = 'auto' | 'light' | 'dark';
export type ResolvedAppearance = 'light' | 'dark';
export declare const APPEARANCE_ATTRIBUTE = "data-bl-appearance";
export declare const APPEARANCE_STORAGE_KEY = "bl-appearance";
/** @internal test helper: drops the shared state so each test starts fresh. */
export declare function resetAppearanceState(): void;
export declare function useAppearance(): {
    mode: Ref<AppearanceMode>;
    resolved: Ref<ResolvedAppearance>;
};
