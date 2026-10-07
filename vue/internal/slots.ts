import { Comment, Fragment, Text, type VNode } from 'vue'

// True when rendered slot content shows anything: `v-if` placeholders (comments) and
// whitespace-only text do not count. Used to drop empty wrappers around optional slots.
export function hasContent(nodes: VNode[] | undefined): boolean {
  return (nodes ?? []).some((node) => {
    if (node.type === Comment) return false
    if (node.type === Text) return typeof node.children === 'string' && node.children.trim() !== ''
    if (node.type === Fragment)
      return Array.isArray(node.children) && hasContent(node.children as VNode[])
    return true
  })
}
