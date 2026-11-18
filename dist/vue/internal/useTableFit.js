import { onBeforeUnmount, onMounted, ref, watch } from "vue";
function decideStacked(stacked, need, avail, hysteresis = 8) {
	return stacked ? need > avail - hysteresis : need > avail;
}
function useTableFit(root, table, scroller, options) {
	const stacked = ref(false);
	const fitted = ref(false);
	const overflowing = ref(false);
	let frame = 0;
	let lastInline = -1;
	let observer;
	let decided = false;
	let disposed = false;
	function apply(next, overflow) {
		if (frame) cancelAnimationFrame(frame);
		frame = requestAnimationFrame(() => {
			stacked.value = next;
			overflowing.value = overflow;
		});
	}
	function measure() {
		if (disposed) return;
		const el = root.value;
		const t = table.value;
		if (!el || !t) return;
		if (!options.enabled()) {
			const s = scroller.value;
			decided = false;
			apply(false, !!s && s.scrollWidth > s.clientWidth + 1);
			return;
		}
		const wasStacked = el.hasAttribute("data-stacked");
		if (wasStacked) el.removeAttribute("data-stacked");
		el.setAttribute("data-measuring", "");
		const need = t.getBoundingClientRect().width;
		if (wasStacked) {
			el.setAttribute("data-stacked", "");
			el.offsetWidth;
		}
		el.removeAttribute("data-measuring");
		const style = getComputedStyle(el);
		const avail = el.clientWidth - (parseFloat(style.paddingLeft) || 0) - (parseFloat(style.paddingRight) || 0);
		decided = decideStacked(decided, need, avail);
		apply(decided, false);
	}
	watch(options.deps, measure, { flush: "post" });
	onMounted(() => {
		fitted.value = true;
		measure();
		if (root.value) {
			const cs = getComputedStyle(root.value);
			lastInline = root.value.clientWidth - (parseFloat(cs.paddingLeft) || 0) - (parseFloat(cs.paddingRight) || 0);
		}
		if (typeof ResizeObserver !== "undefined" && root.value) {
			observer = new ResizeObserver((entries) => {
				const inline = (entries[0]?.contentBoxSize?.[0])?.inlineSize ?? root.value?.clientWidth ?? -1;
				if (inline === lastInline) return;
				lastInline = inline;
				measure();
			});
			observer.observe(root.value);
		}
		document.fonts?.ready.then(measure).catch(() => {});
	});
	onBeforeUnmount(() => {
		disposed = true;
		observer?.disconnect();
		if (frame) cancelAnimationFrame(frame);
	});
	return {
		stacked,
		fitted,
		overflowing,
		measure
	};
}
export { decideStacked, useTableFit };
