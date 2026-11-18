import { onBeforeUnmount, onMounted } from "vue";
// vue/internal/useFormReset.ts
function formOf(el) {
	if (el.form) return el.form;
	return el.querySelector("input, select, textarea")?.form ?? el.closest("form");
}
function useFormReset(el, after, before) {
	let form = null;
	let timer;
	function onReset(event) {
		before?.();
		clearTimeout(timer);
		timer = setTimeout(() => {
			if (!event.defaultPrevented) after();
		}, 0);
	}
	onMounted(() => {
		form = el.value ? formOf(el.value) : null;
		form?.addEventListener("reset", onReset);
	});
	onBeforeUnmount(() => {
		clearTimeout(timer);
		form?.removeEventListener("reset", onReset);
	});
}
export { useFormReset };
