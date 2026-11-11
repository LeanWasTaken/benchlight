/** CSS dashed-ident for an anchor: `--bl-<id>`, every char outside [A-Za-z0-9_-] becomes '-'. */
export declare function anchorName(id: string): string;
/** Inline style for the element that anchors a panel. */
export declare function triggerAnchorStyle(id: string): {
    anchorName: string;
};
/** Inline style for the panel placed against the anchor with the same id. */
export declare function panelAnchorStyle(id: string): {
    positionAnchor: string;
};
