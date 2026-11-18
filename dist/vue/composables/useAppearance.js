import { effectScope, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
// vue/composables/useAppearance.ts
var APPEARANCE_ATTRIBUTE = "data-bl-appearance";
var APPEARANCE_STORAGE_KEY = "bl-appearance";
var isExplicit = (value) => value === "light" || value === "dark";
function readSaved() {
	const stamped = document.documentElement.getAttribute(APPEARANCE_ATTRIBUTE);
	if (isExplicit(stamped)) return stamped;
	try {
		const stored = localStorage.getItem(APPEARANCE_STORAGE_KEY);
		if (isExplicit(stored)) return stored;
	} catch {}
	return "auto";
}
function applyAttribute(mode) {
	const root = document.documentElement;
	if (mode === "auto") root.removeAttribute(APPEARANCE_ATTRIBUTE);
	else root.setAttribute(APPEARANCE_ATTRIBUTE, mode);
}
function applyAnimated(mode, resolve) {
	if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || typeof document.startViewTransition !== "function") {
		applyAttribute(mode);
		resolve();
	} else document.startViewTransition(async () => {
		applyAttribute(mode);
		resolve();
		await nextTick();
	}).ready.catch(() => {});
}
var shared = null;
function getShared() {
	if (shared) return shared;
	const state = {
		mode: ref("auto"),
		resolved: ref("light"),
		media: null,
		users: 0,
		scope: null,
		resolve: () => {
			state.resolved.value = state.mode.value === "auto" ? state.media?.matches ? "dark" : "light" : state.mode.value;
		}
	};
	shared = state;
	return state;
}
function attach(state) {
	state.users += 1;
	if (state.users > 1) return;
	state.media ??= window.matchMedia("(prefers-color-scheme: dark)");
	state.media.addEventListener("change", state.resolve);
	if (!state.scope) {
		state.mode.value = readSaved();
		applyAttribute(state.mode.value);
		state.scope = effectScope(true);
		state.scope.run(() => watch(state.mode, (value) => {
			applyAnimated(value, state.resolve);
			try {
				localStorage.setItem(APPEARANCE_STORAGE_KEY, value);
			} catch {}
		}));
	}
	state.resolve();
}
function detach(state) {
	state.users -= 1;
	if (state.users === 0) state.media?.removeEventListener("change", state.resolve);
}
function useAppearance() {
	if (typeof window === "undefined") return {
		mode: ref("auto"),
		resolved: ref("light")
	};
	const state = getShared();
	onMounted(() => attach(state));
	onBeforeUnmount(() => detach(state));
	return {
		mode: state.mode,
		resolved: state.resolved
	};
}
export { APPEARANCE_ATTRIBUTE, APPEARANCE_STORAGE_KEY, useAppearance };
