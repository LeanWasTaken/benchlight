// vue/internal/cssTime.ts
/**
* Reads a CSS time value (`150ms`, `0.15s`, `.15s`) as milliseconds. A minifier may rewrite a
* token from one unit to the other, so a bare parseFloat would read `.15s` as 0.15ms. Anything
* unreadable gives the fallback.
*/
function cssTime(raw, fallback) {
	const value = (raw ?? "").trim();
	const n = parseFloat(value);
	if (!Number.isFinite(n)) return fallback;
	if (value.endsWith("ms")) return n;
	if (value.endsWith("s")) return n * 1e3;
	return fallback;
}
export { cssTime };
