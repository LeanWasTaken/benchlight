import { createElementBlock, createElementVNode, defineComponent, normalizeStyle, openBlock, renderSlot } from "vue";
// vue/components/BlTelemetry.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1 = { class: "bl-telemetry__cells" };
var BlTelemetry_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ defineComponent({
	__name: "BlTelemetry",
	props: { columns: {} },
	setup(__props) {
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock("div", {
				class: "bl-telemetry",
				style: normalizeStyle(__props.columns ? { "--bl-telemetry-columns": __props.columns } : void 0)
			}, [_cache[0] || (_cache[0] = createElementVNode("div", {
				class: "bl-ruler",
				"aria-hidden": "true"
			}, null, -1)), createElementVNode("div", _hoisted_1, [renderSlot(_ctx.$slots, "default")])], 4);
		};
	}
});
export { BlTelemetry_vue_vue_type_script_setup_true_lang_default as default };
