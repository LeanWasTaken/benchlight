import { onBeforeUnmount, onMounted, ref, toValue, watch } from "vue";
// vue/composables/useScrollLifted.ts
/**
* Ref that is true once the page is scrolled past `threshold` px (a number, `false` to disable, a ref
* or a getter, re-evaluated on change). `false` on the server and until mounted.
*/
function useScrollLifted(threshold = 24) {
	const lifted = ref(false);
	const update = () => {
		const limit = toValue(threshold);
		lifted.value = limit !== false && window.scrollY > limit;
	};
	onMounted(() => {
		update();
		window.addEventListener("scroll", update, { passive: true });
	});
	watch(() => toValue(threshold), update, { flush: "post" });
	onBeforeUnmount(() => window.removeEventListener("scroll", update));
	return lifted;
}
export { useScrollLifted };
