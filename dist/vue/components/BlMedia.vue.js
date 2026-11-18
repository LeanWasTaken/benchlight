import { hasContent } from "../internal/slots.js";
import { createBlock, createElementVNode, createVNode, defineComponent, h, normalizeClass, openBlock, renderSlot, resolveDynamicComponent, withCtx } from "vue";
// vue/components/BlMedia.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1 = { class: "bl-media__body" };
var BlMedia_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ defineComponent({
	__name: "BlMedia",
	props: {
		as: { default: "div" },
		align: { default: "start" }
	},
	setup(__props) {
		const Part = (p) => hasContent(p.nodes) ? h("div", { class: `bl-media__${p.part}` }, p.nodes) : null;
		return (_ctx, _cache) => {
			return openBlock(), createBlock(resolveDynamicComponent(__props.as), { class: normalizeClass(["bl-media", { "bl-media--center": __props.align === "center" }]) }, {
				default: withCtx(() => [
					createVNode(Part, {
						part: "figure",
						nodes: _ctx.$slots["figure"]?.()
					}, null, 8, ["nodes"]),
					createElementVNode("div", _hoisted_1, [renderSlot(_ctx.$slots, "default")]),
					createVNode(Part, {
						part: "aside",
						nodes: _ctx.$slots["aside"]?.()
					}, null, 8, ["nodes"])
				]),
				_: 3
			}, 8, ["class"]);
		};
	}
});
export { BlMedia_vue_vue_type_script_setup_true_lang_default as default };
