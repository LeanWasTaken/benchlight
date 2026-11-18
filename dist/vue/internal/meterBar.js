import { warn } from "./dev.js";
import { computed, useAttrs, useId, watch } from "vue";
// vue/internal/meterBar.ts
function useMeterBar(props, role, component) {
	const attrs = useAttrs();
	const labelId = useId();
	const indeterminate = computed(() => role === "progressbar" && props.value === null);
	const fraction = computed(() => {
		const value = props.value ?? 0;
		return Number.isNaN(value) ? 0 : Math.min(1, Math.max(0, value));
	});
	const visibleValue = computed(() => props.showValue && !indeterminate.value ? props.valueText ?? `${Math.round(fraction.value * 100)}%` : void 0);
	const wrapped = computed(() => Boolean(props.label) || Boolean(props.showValue));
	function barAttrs() {
		const rest = { ...attrs };
		delete rest.class;
		delete rest.style;
		const labelled = Boolean(props.label);
		return {
			class: indeterminate.value ? "bl-meter bl-meter--indeterminate" : "bl-meter",
			role,
			"aria-label": labelled ? void 0 : props.ariaLabel,
			"aria-labelledby": labelled ? labelId : void 0,
			"aria-valuemin": 0,
			"aria-valuemax": 100,
			"aria-valuenow": indeterminate.value ? void 0 : Math.round(fraction.value * 100),
			"aria-valuetext": indeterminate.value ? void 0 : props.valueText,
			...rest
		};
	}
	watch(() => [
		props.label,
		props.ariaLabel,
		attrs["aria-labelledby"]
	], ([label, ariaLabel, labelledby]) => {
		if (!label && ariaLabel === void 0 && labelledby === void 0) warn(`${component}: set \`label\` (visible) or \`ariaLabel\` (\`aria-label\`) to name it.`);
	}, { immediate: true });
	return {
		attrs,
		labelId,
		indeterminate,
		fraction,
		visibleValue,
		wrapped,
		barAttrs
	};
}
export { useMeterBar };
