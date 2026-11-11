interface MeterBarProps {
    value: number | null;
    label?: string | undefined;
    ariaLabel?: string | undefined;
    valueText?: string | undefined;
    showValue?: boolean | undefined;
}
export declare function useMeterBar(props: MeterBarProps, role: 'meter' | 'progressbar', component: string): {
    attrs: import("vue").Attrs;
    labelId: string;
    indeterminate: import("vue").ComputedRef<boolean>;
    fraction: import("vue").ComputedRef<number>;
    visibleValue: import("vue").ComputedRef<string | undefined>;
    wrapped: import("vue").ComputedRef<boolean>;
    barAttrs: () => Record<string, unknown>;
};
export {};
