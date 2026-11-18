import { clampPage } from "./table.js";
import { watch } from "vue";
// vue/internal/pageClamp.ts
/**
* Emits a corrected page when total or pageSize leave it out of range, on mount and on change.
* Only once data exists (total > 0): an empty or still-loading list leaves the page alone.
*/
function useClampedPage(page, total, pageSize) {
	watch(() => [total(), pageSize()], ([count, size]) => {
		if (!size || count <= 0) return;
		const next = clampPage(page.value, count, size);
		if (next !== page.value) page.value = next;
	}, { immediate: true });
}
export { useClampedPage };
