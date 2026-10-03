import type { Component, InjectionKey, Ref } from 'vue'

export type LinkAs = string | Component
// `object`, not an index-signature record: router location types are interfaces, which lack one.
export type LinkTo = string | object

/**
 * Link props shared by every link-rendering component.
 * - `as` a component (e.g. RouterLink): receives `to` if set, otherwise `href`.
 * - `as` 'a' (the default when `to` or `href` is set): receives `href`, else a string `to`.
 * - `as` any other tag: receives neither (a dev warning fires if you passed one).
 * Components spell these props out inline rather than extending this type: compiling an
 * imported props type needs TypeScript in the consuming app.
 */
export interface LinkProps {
  as?: LinkAs
  to?: LinkTo
  href?: string
}

export interface SegmentedOption<T> extends Pick<LinkProps, 'to' | 'href'> {
  value: T
  label: string
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
  /** open in a new tab; default: true for absolute or protocol-relative URLs */
  external?: boolean
}

export type MetaItem = string | { text: string; class?: string }

export interface PrevNextItem extends Pick<LinkProps, 'to' | 'href'> {
  title: string
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
