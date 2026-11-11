export interface RiseDelayOptions {
    base?: number;
    step?: number;
    cap?: number;
}
export declare function riseDelay(index: number, { base, step, cap }?: RiseDelayOptions): {
    '--bl-rise-delay': string;
};
