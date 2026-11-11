import type { FieldContext } from '../types'
import { warnOnce } from './dev'

// The id a control renders. Inside a BlField the label's `for` and the hint ids point at the
// field's id, so that id always wins; a different consumer `id` is ignored with a warning.
export function controlId(name: string, field: FieldContext | null, id: unknown): unknown {
  if (!field) return id
  if (id !== undefined && id !== field.id.value)
    warnOnce(
      `${name}: \`id\` is ignored inside a BlField, whose label targets the field's id; set \`id\` on BlField instead.`
    )
  return field.id.value
}
