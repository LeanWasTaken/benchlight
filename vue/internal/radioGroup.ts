import type { InjectionKey, Ref } from 'vue'

// Internal: not exported from the package, so a custom radio cannot skip `register` and break
// form reset.
export interface RadioGroupContext {
  name: Readonly<Ref<string>>
  model: Ref<string | number | undefined>
  disabled: Readonly<Ref<boolean>>
  required: Readonly<Ref<boolean>>
  /** Registers a radio's input and typed value for form reset; returns the unregister call. */
  register: (input: HTMLInputElement, value: () => string | number) => () => void
}

// Provided by BlRadioGroup; each BlRadio injects it for its name, checked state and model.
export const RADIO_GROUP_CONTEXT: InjectionKey<RadioGroupContext> = Symbol('bl-radio-group')
