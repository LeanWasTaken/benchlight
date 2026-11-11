function anchorName(id) {
  return `--bl-${id.replace(/[^A-Za-z0-9_-]/g, "-")}`;
}
function triggerAnchorStyle(id) {
  return { anchorName: anchorName(id) };
}
function panelAnchorStyle(id) {
  return { positionAnchor: anchorName(id) };
}
export {
  anchorName,
  panelAnchorStyle,
  triggerAnchorStyle
};
