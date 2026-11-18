import { createElementBlock, createTextVNode, defineComponent, openBlock, renderSlot } from "vue";
// vue/components/BlSkipLink.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1 = ["href"];
var BlSkipLink_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ defineComponent({
	__name: "BlSkipLink",
	props: { target: { default: "#main-content" } },
	setup(__props) {
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock("a", {
				class: "bl-skip-link",
				href: __props.target
			}, [renderSlot(_ctx.$slots, "default", {}, () => [_cache[0] || (_cache[0] = createTextVNode("Skip to content", -1))])], 8, _hoisted_1);
		};
	}
});
export { BlSkipLink_vue_vue_type_script_setup_true_lang_default as default };
