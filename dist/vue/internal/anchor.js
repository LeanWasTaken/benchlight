// vue/internal/anchor.ts
/** CSS dashed-ident for an anchor: `--bl-<id>`, every char outside [A-Za-z0-9_-] becomes '-'. */
function anchorName(id) {
	return `--bl-${id.replace(/[^A-Za-z0-9_-]/g, "-")}`;
}
/** Inline style for the element that anchors a panel. */
function triggerAnchorStyle(id) {
	return { anchorName: anchorName(id) };
}
/** Inline style for the panel placed against the anchor with the same id. */
function panelAnchorStyle(id) {
	return { positionAnchor: anchorName(id) };
}
export { anchorName, panelAnchorStyle, triggerAnchorStyle };
