import { FIELD_CONTEXT } from "../types.js";
import { mergeDescribedBy } from "../internal/describedBy.js";
import { controlId } from "../internal/fieldId.js";
import { useFormReset } from "../internal/useFormReset.js";
import { createElementBlock, defineComponent, inject, mergeModels, mergeProps, onMounted, openBlock, ref, useAttrs, useModel, vModelDynamic, withDirectives } from "vue";
// vue/components/BlInput.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1 = ["type", "disabled"];
var BlInput_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ defineComponent({
	inheritAttrs: false,
	__name: "BlInput",
	props: /*@__PURE__*/ mergeModels({
		type: { default: "text" },
		disabled: { type: Boolean }
	}, {
		"modelValue": { default: "" },
		"modelModifiers": {}
	}),
	emits: ["update:modelValue"],
	setup(__props) {
		const model = useModel(__props, "modelValue");
		const field = inject(FIELD_CONTEXT, null);
		const attrs = useAttrs();
		const el = ref();
		let initial = "";
		onMounted(() => initial = model.value);
		useFormReset(el, () => {
			if (el.value && el.value.value !== model.value) model.value = el.value.value;
		}, () => {
			if (el.value) el.value.defaultValue = initial;
		});
		function inputAttrs() {
			return {
				"aria-invalid": field?.invalid?.value === true ? "true" : void 0,
				...attrs,
				id: controlId("BlInput", field, attrs["id"]),
				"aria-describedby": mergeDescribedBy(field?.describedBy.value, attrs["aria-describedby"])
			};
		}
		return (_ctx, _cache) => {
			return withDirectives((openBlock(), createElementBlock("input", mergeProps({
				ref_key: "el",
				ref: el,
				"onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => model.value = $event),
				class: "bl-input",
				type: __props.type,
				disabled: __props.disabled
			}, inputAttrs()), null, 16, _hoisted_1)), [[vModelDynamic, model.value]]);
		};
	}
});
export { BlInput_vue_vue_type_script_setup_true_lang_default as default };
