import { createElementBlock, defineComponent, normalizeClass, openBlock } from "vue";
// vue/components/BlLed.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1 = [
	"role",
	"aria-label",
	"aria-hidden"
];
var BlLed_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ defineComponent({
	__name: "BlLed",
	props: {
		tone: { default: "neutral" },
		ariaLabel: {}
	},
	setup(__props) {
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock("span", {
				class: normalizeClass(["bl-led", {
					"bl-led--on": __props.tone === "success",
					"bl-led--danger": __props.tone === "danger"
				}]),
				role: __props.ariaLabel ? "img" : void 0,
				"aria-label": __props.ariaLabel || void 0,
				"aria-hidden": __props.ariaLabel ? void 0 : "true"
			}, null, 10, _hoisted_1);
		};
	}
});
export { BlLed_vue_vue_type_script_setup_true_lang_default as default };
