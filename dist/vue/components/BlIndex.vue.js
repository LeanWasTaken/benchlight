import { createElementBlock, defineComponent, normalizeClass, openBlock, renderSlot } from "vue";
// vue/components/BlIndex.vue?vue&type=script&setup=true&lang.ts
var BlIndex_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ defineComponent({
	__name: "BlIndex",
	props: {
		ruledTop: { type: Boolean },
		grid: { type: Boolean }
	},
	setup(__props) {
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock("ul", { class: normalizeClass(["bl-index", {
				"bl-index--ruled-top": __props.ruledTop,
				"bl-index--grid": __props.grid
			}]) }, [renderSlot(_ctx.$slots, "default")], 2);
		};
	}
});
export { BlIndex_vue_vue_type_script_setup_true_lang_default as default };
