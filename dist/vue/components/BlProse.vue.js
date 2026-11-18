import { createBlock, defineComponent, openBlock, renderSlot, resolveDynamicComponent, withCtx } from "vue";
// vue/components/BlProse.vue?vue&type=script&setup=true&lang.ts
var BlProse_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ defineComponent({
	__name: "BlProse",
	props: { as: { default: "div" } },
	setup(__props) {
		return (_ctx, _cache) => {
			return openBlock(), createBlock(resolveDynamicComponent(__props.as), { class: "bl-prose" }, {
				default: withCtx(() => [renderSlot(_ctx.$slots, "default")]),
				_: 3
			});
		};
	}
});
export { BlProse_vue_vue_type_script_setup_true_lang_default as default };
