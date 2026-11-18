import { warnOnce } from "../internal/dev.js";
import { useFormReset } from "../internal/useFormReset.js";
import { Fragment, computed, createElementBlock, createElementVNode, createTextVNode, defineComponent, mergeModels, normalizeClass, onMounted, openBlock, ref, renderList, toDisplayString, useAttrs, useId, useModel } from "vue";
// vue/components/BlSegmented.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1 = ["aria-label"];
var _hoisted_2 = [
	"name",
	"form",
	"value",
	"checked",
	"disabled",
	"onChange"
];
var BlSegmented_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ defineComponent({
	__name: "BlSegmented",
	props: /*@__PURE__*/ mergeModels({
		options: {},
		ariaLabel: {},
		compact: { type: Boolean },
		name: {},
		form: {}
	}, {
		"modelValue": {},
		"modelModifiers": {}
	}),
	emits: ["update:modelValue"],
	setup(__props) {
		const props = __props;
		const attrs = useAttrs();
		if (!props.ariaLabel && !attrs["aria-labelledby"]) warnOnce("BlSegmented: set `ariaLabel` (`aria-label`) to name the group.");
		const model = useModel(__props, "modelValue");
		const generatedName = useId();
		const groupName = computed(() => props.name || generatedName);
		const root = ref();
		let initial;
		function inputs() {
			return [...root.value?.querySelectorAll("input") ?? []];
		}
		useFormReset(root, () => {
			const index = inputs().findIndex((input) => input.checked);
			model.value = props.options[index]?.value;
		}, () => {
			inputs().forEach((input, i) => {
				input.defaultChecked = props.options[i]?.value === initial;
			});
		});
		onMounted(() => {
			initial = model.value;
		});
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock("div", {
				ref_key: "root",
				ref: root,
				class: normalizeClass(["bl-segmented", { "bl-segmented--compact": __props.compact }]),
				role: "radiogroup",
				"aria-label": __props.ariaLabel
			}, [(openBlock(true), createElementBlock(Fragment, null, renderList(__props.options, (option) => {
				return openBlock(), createElementBlock("label", {
					key: String(option.value),
					class: "bl-segmented__item"
				}, [createElementVNode("input", {
					type: "radio",
					name: groupName.value,
					form: __props.form,
					value: String(option.value),
					checked: option.value === model.value,
					disabled: option.disabled || void 0,
					onChange: ($event) => model.value = option.value
				}, null, 40, _hoisted_2), createTextVNode(" " + toDisplayString(option.label), 1)]);
			}), 128))], 10, _hoisted_1);
		};
	}
});
export { BlSegmented_vue_vue_type_script_setup_true_lang_default as default };
