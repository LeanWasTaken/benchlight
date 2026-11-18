// vue/composables/riseDelay.ts
function riseDelay(index, { base = 0, step = 60, cap } = {}) {
	return { "--bl-rise-delay": `${base + Math.max(0, cap === void 0 ? index : Math.min(index, cap)) * step}ms` };
}
export { riseDelay };
