import { onBeforeUnmount, ref, toValue, watch } from "vue";
// vue/composables/useFollowScroll.ts
function useFollowScroll(el, { enabled = true, threshold = 4 } = {}) {
	const pinned = ref(true);
	function measure() {
		const node = el.value;
		if (!node) return;
		pinned.value = node.scrollHeight - node.scrollTop - node.clientHeight <= threshold;
	}
	function toBottom() {
		const node = el.value;
		if (node && toValue(enabled) && pinned.value) node.scrollTop = node.scrollHeight;
	}
	let bound = null;
	function unbind() {
		bound?.removeEventListener("scroll", measure);
		bound = null;
	}
	watch(el, (node) => {
		unbind();
		bound = node;
		if (!node) return;
		node.addEventListener("scroll", measure, { passive: true });
		if (toValue(enabled)) node.scrollTop = node.scrollHeight;
		measure();
	}, {
		immediate: true,
		flush: "post"
	});
	onBeforeUnmount(unbind);
	return {
		pinned,
		toBottom
	};
}
export { useFollowScroll };
