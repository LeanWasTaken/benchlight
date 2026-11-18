// vue/internal/pageLock.ts
var locks = 0;
function lockPage() {
	if (locks++ > 0) return;
	const root = document.documentElement;
	if (getComputedStyle(root).scrollbarGutter.includes("stable")) return;
	root.style.setProperty("--bl-dialog-gutter", `${Math.max(0, innerWidth - root.clientWidth)}px`);
}
function unlockPage() {
	if (locks === 0 || --locks > 0) return;
	document.documentElement.style.removeProperty("--bl-dialog-gutter");
}
export { lockPage, unlockPage };
