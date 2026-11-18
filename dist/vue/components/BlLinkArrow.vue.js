import { linkBindings, resolveTag } from "../internal/link.js";
import { computed, createBlock, createCommentVNode, createElementBlock, createElementVNode, defineComponent, mergeProps, openBlock, renderSlot, resolveDynamicComponent, unref, withCtx } from "vue";
// vue/components/BlLinkArrow.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1 = {
	key: 0,
	class: "bl-link-arrow__icon",
	"aria-hidden": "true"
};
var _hoisted_2 = {
	key: 1,
	class: "bl-link-arrow__icon",
	"aria-hidden": "true"
};
var _hoisted_3 = {
	viewBox: "0 0 12 12",
	fill: "none",
	stroke: "currentColor",
	"stroke-width": "1.5",
	"stroke-linecap": "round",
	"stroke-linejoin": "round",
	"aria-hidden": "true",
	focusable: "false"
};
var _hoisted_4 = {
	key: 0,
	d: "M3 9l6-6M4 3h5v5"
};
var _hoisted_5 = {
	key: 1,
	d: "M2 6h8M6.5 2.5 10 6 6.5 9.5"
};
var BlLinkArrow_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ defineComponent({
	__name: "BlLinkArrow",
	props: {
		as: {},
		to: {},
		href: {},
		direction: { default: "right" },
		quiet: { type: Boolean }
	},
	setup(__props) {
		const props = __props;
		const tag = computed(() => resolveTag(props.as, props.to, props.href, "a"));
		return (_ctx, _cache) => {
			return openBlock(), createBlock(resolveDynamicComponent(tag.value), mergeProps(unref(linkBindings)(tag.value, __props.to, __props.href), { class: ["bl-link-arrow", { "bl-link-arrow--quiet": __props.quiet }] }), {
				default: withCtx(() => [
					__props.direction === "left" ? (openBlock(), createElementBlock("span", _hoisted_1, [renderSlot(_ctx.$slots, "icon", {}, () => [_cache[0] || (_cache[0] = createElementVNode("svg", {
						viewBox: "0 0 12 12",
						fill: "none",
						stroke: "currentColor",
						"stroke-width": "1.5",
						"stroke-linecap": "round",
						"stroke-linejoin": "round",
						"aria-hidden": "true",
						focusable: "false"
					}, [createElementVNode("path", { d: "M10 6H2M5.5 2.5 2 6l3.5 3.5" })], -1))])])) : createCommentVNode("v-if", true),
					renderSlot(_ctx.$slots, "default"),
					__props.direction !== "left" ? (openBlock(), createElementBlock("span", _hoisted_2, [renderSlot(_ctx.$slots, "icon", {}, () => [(openBlock(), createElementBlock("svg", _hoisted_3, [__props.direction === "up-right" ? (openBlock(), createElementBlock("path", _hoisted_4)) : (openBlock(), createElementBlock("path", _hoisted_5))]))])])) : createCommentVNode("v-if", true)
				]),
				_: 3
			}, 16, ["class"]);
		};
	}
});
export { BlLinkArrow_vue_vue_type_script_setup_true_lang_default as default };
