import type { Component, InjectionKey, Ref } from 'vue'

export type LinkAs = string | Component
export type LinkTo = string | Record<string, unknown>

export interface SegmentedOption<T> {
  value: T
  label: string
  to?: LinkTo
  href?: string
  current?: boolean
}

export interface SelectOption<T> {
  value: T
  label: string
}

export interface SpecRowData {
  label: string
  value: string
  href?: string
}

export type MetaItem = string | { text: string; class?: string }

export interface PrevNextItem {
  title: string
  to?: LinkTo
  href?: string
}

export interface AppearanceLabels {
  legend: string
  auto: string
  light: string
  dark: string
}

export interface PrevNextLabels {
  nav: string
  prev: string
  next: string
}

export interface FieldContext {
  id: Readonly<Ref<string>>
  describedBy: Readonly<Ref<string | undefined>>
}

// Provided by BlField; form controls (Benchlight's or your own) inject it for id and hint wiring.
export const FIELD_CONTEXT: InjectionKey<FieldContext> = Symbol('bl-field')
