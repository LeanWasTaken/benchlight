import { cssTime } from "../internal/cssTime.js";
import { useReducedMotion } from "./useReducedMotion.js";
import { onBeforeUnmount, onMounted, ref, toValue, watch } from "vue";
// vue/composables/useMarquee.ts
function useMarquee(container, content, { speed = 22, pause = .18, overshoot = 14, paused = false } = {}) {
	const overflowing = ref(false);
	const reduced = useReducedMotion();
	let animations = [];
	let resizeTimer = null;
	let measured = "";
	let disposed = false;
	let resizeObserver = null;
	let mutationObserver = null;
	let hovered = false;
	let focused = false;
	function syncPlayState() {
		const hold = hovered || focused || toValue(paused);
		for (const animation of animations) if (hold) animation.pause();
		else animation.play();
	}
	const onPointerEnter = () => {
		hovered = true;
		syncPlayState();
	};
	const onPointerLeave = () => {
		hovered = false;
		syncPlayState();
	};
	const onFocusIn = (event) => {
		focused = true;
		syncPlayState();
		if (event.target instanceof Element) event.target.scrollIntoView?.({
			block: "nearest",
			inline: "nearest"
		});
	};
	const onFocusOut = (event) => {
		focused = event.relatedTarget instanceof Node && !!container.value?.contains(event.relatedTarget);
		if (!focused && container.value) container.value.scrollLeft = 0;
		syncPlayState();
	};
	function stop() {
		for (const animation of animations) animation.cancel();
		animations = [];
	}
	function refresh() {
		const box = container.value;
		const text = content.value;
		const resting = text && animations.length > 0 && !reduced.value ? getComputedStyle(text).transform : "";
		stop();
		if (!box || !text) {
			overflowing.value = false;
			return;
		}
		measured = `${text.scrollWidth}:${box.clientWidth}`;
		const overflow = text.scrollWidth - box.clientWidth;
		overflowing.value = overflow > 1;
		if (!overflowing.value && resting && resting !== "none") text.animate?.([{ transform: resting }, { transform: "none" }], {
			duration: cssTime(getComputedStyle(text).getPropertyValue("--bl-duration-fast"), 150),
			easing: "ease"
		});
		if (!overflowing.value || reduced.value) return;
		const distance = (getComputedStyle(box).direction === "rtl" ? 1 : -1) * (overflow + overshoot);
		const timing = {
			duration: Math.max(5, (overflow + overshoot) / speed) * 1e3,
			iterations: Infinity,
			direction: "alternate",
			easing: "ease-in-out"
		};
		animations = [text.animate([
			{
				transform: "translateX(0)",
				offset: 0
			},
			{
				transform: "translateX(0)",
				offset: pause
			},
			{
				transform: `translateX(${distance}px)`,
				offset: 1 - pause
			},
			{
				transform: `translateX(${distance}px)`,
				offset: 1
			}
		], timing), box.animate([
			{
				"--bl-mask-l": "0%",
				"--bl-mask-r": "88%",
				offset: 0
			},
			{
				"--bl-mask-l": "0%",
				"--bl-mask-r": "88%",
				offset: pause
			},
			{
				"--bl-mask-l": "12%",
				"--bl-mask-r": "100%",
				offset: 1 - pause
			},
			{
				"--bl-mask-l": "12%",
				"--bl-mask-r": "100%",
				offset: 1
			}
		], timing)];
		if (hovered || focused || toValue(paused)) syncPlayState();
	}
	function refreshIfChanged() {
		const box = container.value;
		const text = content.value;
		if (box && text && measured === `${text.scrollWidth}:${box.clientWidth}`) return;
		refresh();
	}
	function schedule(update) {
		if (resizeTimer) clearTimeout(resizeTimer);
		resizeTimer = setTimeout(update, 150);
	}
	const onResize = () => schedule(refresh);
	const onObserved = () => schedule(refreshIfChanged);
	watch(reduced, refresh);
	watch(() => toValue(paused), syncPlayState);
	onMounted(() => {
		refresh();
		const box = container.value;
		box?.addEventListener("pointerenter", onPointerEnter);
		box?.addEventListener("pointerleave", onPointerLeave);
		box?.addEventListener("focusin", onFocusIn);
		box?.addEventListener("focusout", onFocusOut);
		window.addEventListener("resize", onResize, { passive: true });
		if (typeof ResizeObserver !== "undefined") {
			resizeObserver = new ResizeObserver(onObserved);
			if (container.value) resizeObserver.observe(container.value);
			if (content.value) resizeObserver.observe(content.value);
		}
		if (typeof MutationObserver !== "undefined" && content.value) {
			mutationObserver = new MutationObserver(onObserved);
			mutationObserver.observe(content.value, {
				childList: true,
				characterData: true,
				subtree: true
			});
		}
		if (typeof document !== "undefined" && document.fonts?.ready) document.fonts.ready.then(() => {
			if (!disposed) onObserved();
		});
	});
	onBeforeUnmount(() => {
		disposed = true;
		stop();
		const box = container.value;
		box?.removeEventListener("pointerenter", onPointerEnter);
		box?.removeEventListener("pointerleave", onPointerLeave);
		box?.removeEventListener("focusin", onFocusIn);
		box?.removeEventListener("focusout", onFocusOut);
		if (resizeTimer) clearTimeout(resizeTimer);
		window.removeEventListener("resize", onResize);
		resizeObserver?.disconnect();
		mutationObserver?.disconnect();
	});
	return {
		overflowing,
		refresh
	};
}
export { useMarquee };
