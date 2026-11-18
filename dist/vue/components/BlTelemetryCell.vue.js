import { createElementBlock, createElementVNode, defineComponent, openBlock, renderSlot, toDisplayString } from "vue";
// vue/components/BlTelemetryCell.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1 = { class: "bl-telemetry__cell" };
var _hoisted_2 = { class: "bl-telemetry__label" };
var _hoisted_3 = { class: "bl-telemetry__value" };
var BlTelemetryCell_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ defineComponent({
	__name: "BlTelemetryCell",
	props: { label: {} },
	setup(__props) {
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock("div", _hoisted_1, [createElementVNode("span", _hoisted_2, toDisplayString(__props.label), 1), createElementVNode("span", _hoisted_3, [renderSlot(_ctx.$slots, "default")])]);
		};
	}
});
export { BlTelemetryCell_vue_vue_type_script_setup_true_lang_default as default };
