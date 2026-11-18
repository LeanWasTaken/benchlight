import { mergeDescribedBy } from "../internal/describedBy.js";
import { useFormReset } from "../internal/useFormReset.js";
import { createCommentVNode, createElementBlock, createElementVNode, defineComponent, mergeModels, mergeProps, normalizeClass, normalizeStyle, onMounted, openBlock, ref, toDisplayString, unref, useAttrs, useId, useModel, watch } from "vue";
// vue/components/BlCheckbox.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1 = { class: "bl-checkbox__control" };
var _hoisted_2 = [
	"checked",
	"disabled",
	"name",
	"value"
];
var _hoisted_3 = { class: "bl-checkbox__label" };
var _hoisted_4 = ["id"];
var _hoisted_5 = ["id", "role"];
var BlCheckbox_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ defineComponent({
	inheritAttrs: false,
	__name: "BlCheckbox",
	props: /*@__PURE__*/ mergeModels({
		label: {},
		hint: {},
		error: {},
		announce: { type: Boolean },
		disabled: { type: Boolean },
		name: {},
		value: {}
	}, {
		"modelValue": {
			type: Boolean,
			default: false
		},
		"modelModifiers": {},
		"indeterminate": {
			type: Boolean,
			default: false
		},
		"indeterminateModifiers": {}
	}),
	emits: ["update:modelValue", "update:indeterminate"],
	setup(__props) {
		const props = __props;
		const model = useModel(__props, "modelValue");
		const indeterminate = useModel(__props, "indeterminate");
		const attrs = useAttrs();
		const hintId = useId();
		const errorId = useId();
		const input = ref();
		function inputAttrs() {
			const rest = { ...attrs };
			delete rest.class;
			delete rest.style;
			return {
				...props.error ? { "aria-invalid": "true" } : {},
				...rest,
				"aria-describedby": mergeDescribedBy(props.hint ? hintId : void 0, props.error ? errorId : void 0, rest["aria-describedby"])
			};
		}
		function syncIndeterminate() {
			if (input.value) input.value.indeterminate = indeterminate.value;
		}
		watch(indeterminate, syncIndeterminate);
		function onChange(event) {
			model.value = event.target.checked;
			if (indeterminate.value) indeterminate.value = false;
		}
		let initial = false;
		useFormReset(input, () => {
			if (input.value) model.value = input.value.checked;
		}, () => {
			if (input.value) input.value.defaultChecked = initial;
		});
		onMounted(() => {
			syncIndeterminate();
			initial = model.value;
			if (input.value) input.value.defaultChecked = initial;
		});
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock("div", {
				class: normalizeClass(["bl-checkbox", unref(attrs).class]),
				style: normalizeStyle(unref(attrs).style)
			}, [
				createElementVNode("label", _hoisted_1, [
					createElementVNode("input", mergeProps({
						ref_key: "input",
						ref: input,
						class: "bl-checkbox__input",
						type: "checkbox",
						checked: model.value,
						disabled: __props.disabled,
						name: __props.name,
						value: __props.value
					}, inputAttrs(), { onChange }), null, 16, _hoisted_2),
					_cache[0] || (_cache[0] = createElementVNode("span", {
						class: "bl-checkbox__box",
						"aria-hidden": "true"
					}, null, -1)),
					createElementVNode("span", _hoisted_3, toDisplayString(__props.label), 1)
				]),
				__props.hint ? (openBlock(), createElementBlock("span", {
					key: 0,
					id: unref(hintId),
					class: "bl-checkbox__hint"
				}, toDisplayString(__props.hint), 9, _hoisted_4)) : createCommentVNode("v-if", true),
				__props.error ? (openBlock(), createElementBlock("span", {
					key: 1,
					id: unref(errorId),
					class: "bl-checkbox__error",
					role: __props.announce ? "alert" : void 0
				}, toDisplayString(__props.error), 9, _hoisted_5)) : createCommentVNode("v-if", true)
			], 6);
		};
	}
});
export { BlCheckbox_vue_vue_type_script_setup_true_lang_default as default };
