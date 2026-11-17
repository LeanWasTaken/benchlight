import type { InjectionKey, Ref } from 'vue';
export interface RadioGroupContext {
    name: Readonly<Ref<string>>;
    model: Ref<string | number | undefined>;
    disabled: Readonly<Ref<boolean>>;
    required: Readonly<Ref<boolean>>;
    /** The group's `form` attribute, forwarded to each radio so a form named from outside owns them. */
    readonly form: string | undefined;
    /** Registers a radio's input and typed value for form reset; returns the unregister call. */
    register: (input: HTMLInputElement, value: () => string | number) => () => void;
}
export declare const RADIO_GROUP_CONTEXT: InjectionKey<RadioGroupContext>;
