import { hasContent } from "../internal/slots.js";
import { currentValue, linkBindings, resolveTag } from "../internal/link.js";
import { computed, createBlock, createCommentVNode, createElementBlock, createElementVNode, defineComponent, mergeProps, openBlock, renderSlot, resolveDynamicComponent, unref, withCtx } from "vue";
// vue/components/BlTabBarItem.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1 = {
	key: 0,
	class: "bl-tab-bar__icon",
	"aria-hidden": "true"
};
var _hoisted_2 = { class: "bl-tab-bar__label" };
var BlTabBarItem_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ defineComponent({
	__name: "BlTabBarItem",
	props: {
		as: {},
		to: {},
		href: {},
		current: { type: [Boolean, String] }
	},
	setup(__props) {
		const props = __props;
		const tag = computed(() => resolveTag(props.as, props.to, props.href, "a"));
		return (_ctx, _cache) => {
			return openBlock(), createBlock(resolveDynamicComponent(tag.value), mergeProps(unref(linkBindings)(tag.value, __props.to, __props.href), {
				class: "bl-tab-bar__item",
				"aria-current": unref(currentValue)(__props.current)
			}), {
				default: withCtx(() => [unref(hasContent)(_ctx.$slots["icon"]?.()) ? (openBlock(), createElementBlock("span", _hoisted_1, [renderSlot(_ctx.$slots, "icon")])) : createCommentVNode("v-if", true), createElementVNode("span", _hoisted_2, [renderSlot(_ctx.$slots, "default")])]),
				_: 3
			}, 16, ["aria-current"]);
		};
	}
});
export { BlTabBarItem_vue_vue_type_script_setup_true_lang_default as default };
