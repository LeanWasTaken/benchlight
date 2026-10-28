/** CSS dashed-ident for an anchor: `--bl-<id>`, every char outside [A-Za-z0-9_-] becomes '-'. */
export function anchorName(id: string): string {
  return `--bl-${id.replace(/[^A-Za-z0-9_-]/g, '-')}`
}

/** Inline style for the element that anchors a panel. */
export function triggerAnchorStyle(id: string): { anchorName: string } {
  return { anchorName: anchorName(id) }
}

/** Inline style for the panel placed against the anchor with the same id. */
export function panelAnchorStyle(id: string): { positionAnchor: string } {
  return { positionAnchor: anchorName(id) }
}
