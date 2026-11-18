import { createElementBlock, defineComponent, openBlock, renderSlot } from "vue";
// vue/components/BlTabBar.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1 = ["aria-label"];
var BlTabBar_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ defineComponent({
	__name: "BlTabBar",
	props: { ariaLabel: { default: "Primary" } },
	setup(__props) {
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock("nav", {
				class: "bl-tab-bar",
				"aria-label": __props.ariaLabel
			}, [renderSlot(_ctx.$slots, "default")], 8, _hoisted_1);
		};
	}
});
export { BlTabBar_vue_vue_type_script_setup_true_lang_default as default };
