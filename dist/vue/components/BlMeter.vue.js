import { warnOnce } from "../internal/dev.js";
import { useMeterBar } from "../internal/meterBar.js";
import { createCommentVNode, createElementBlock, createElementVNode, defineComponent, guardReactiveProps, mergeProps, normalizeClass, normalizeProps, normalizeStyle, openBlock, toDisplayString, unref, watch } from "vue";
// vue/components/BlMeter.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1 = {
	key: 0,
	class: "bl-meter-field__head"
};
var _hoisted_2 = ["id"];
var _hoisted_3 = {
	key: 1,
	class: "bl-meter-field__value",
	"aria-hidden": "true"
};
var BlMeter_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ defineComponent({
	inheritAttrs: false,
	__name: "BlMeter",
	props: {
		value: {},
		label: {},
		ariaLabel: {},
		valueText: {},
		showValue: { type: Boolean }
	},
	setup(__props) {
		const props = __props;
		const { attrs, labelId, fraction, visibleValue, wrapped, barAttrs } = useMeterBar(props, "meter", "BlMeter");
		watch(() => props.value, (value) => {
			if (!(value >= 0 && value <= 1)) warnOnce(`BlMeter: \`value\` is 0 to 1, got ${value}; it renders clamped.`);
		}, { immediate: true });
		return (_ctx, _cache) => {
			return unref(wrapped) ? (openBlock(), createElementBlock("div", {
				key: 0,
				class: normalizeClass(["bl-meter-field", unref(attrs).class]),
				style: normalizeStyle(unref(attrs).style)
			}, [__props.label || unref(visibleValue) !== void 0 ? (openBlock(), createElementBlock("div", _hoisted_1, [__props.label ? (openBlock(), createElementBlock("span", {
				key: 0,
				id: unref(labelId),
				class: "bl-meter-field__label"
			}, toDisplayString(__props.label), 9, _hoisted_2)) : createCommentVNode("v-if", true), unref(visibleValue) !== void 0 ? (openBlock(), createElementBlock("span", _hoisted_3, toDisplayString(unref(visibleValue)), 1)) : createCommentVNode("v-if", true)])) : createCommentVNode("v-if", true), createElementVNode("div", normalizeProps(guardReactiveProps(unref(barAttrs)())), [createElementVNode("div", {
				class: "bl-meter__fill",
				style: normalizeStyle({ "--bl-meter-value": unref(fraction) })
			}, null, 4)], 16)], 6)) : (openBlock(), createElementBlock("div", mergeProps({
				key: 1,
				class: unref(attrs).class,
				style: unref(attrs).style
			}, unref(barAttrs)()), [createElementVNode("div", {
				class: "bl-meter__fill",
				style: normalizeStyle({ "--bl-meter-value": unref(fraction) })
			}, null, 4)], 16));
		};
	}
});
export { BlMeter_vue_vue_type_script_setup_true_lang_default as default };
