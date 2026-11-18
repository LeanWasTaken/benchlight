import { currentValue, linkBindings, resolveTag } from "../internal/link.js";
import { computed, createBlock, createCommentVNode, createElementBlock, createElementVNode, defineComponent, mergeProps, normalizeClass, normalizeStyle, openBlock, renderSlot, resolveDynamicComponent, unref, useAttrs, withCtx } from "vue";
// vue/components/BlIndexRow.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1 = {
	key: 0,
	class: "bl-index-row__icon",
	"aria-hidden": "true"
};
var _hoisted_2 = {
	key: 1,
	class: "bl-index-row__meta"
};
var _hoisted_3 = { class: "bl-index-row__title" };
var _hoisted_4 = {
	key: 2,
	class: "bl-index-row__desc"
};
var BlIndexRow_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ defineComponent({
	inheritAttrs: false,
	__name: "BlIndexRow",
	props: {
		as: {},
		to: {},
		href: {},
		current: { type: [Boolean, String] },
		compact: { type: Boolean }
	},
	setup(__props) {
		const props = __props;
		const attrs = useAttrs();
		const ariaCurrent = computed(() => currentValue(props.current));
		const tag = computed(() => resolveTag(props.as, props.to, props.href, "div"));
		const bindings = computed(() => {
			if (tag.value === "div") return linkBindings("div", props.to, props.href);
			if (tag.value === "button") return {
				...linkBindings("button", props.to, props.href),
				type: "button"
			};
			return linkBindings(tag.value, props.to, props.href);
		});
		function linkAttrs() {
			const rest = { ...attrs };
			delete rest.class;
			delete rest.style;
			return {
				...bindings.value,
				...rest,
				...ariaCurrent.value ? { "aria-current": ariaCurrent.value } : {}
			};
		}
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock("li", {
				class: normalizeClass(["bl-index__item", unref(attrs).class]),
				style: normalizeStyle(unref(attrs).style)
			}, [(openBlock(), createBlock(resolveDynamicComponent(tag.value), mergeProps(linkAttrs(), { class: ["bl-index-row", { "bl-index-row--compact": __props.compact }] }), {
				default: withCtx(() => [
					_ctx.$slots["icon"] ? (openBlock(), createElementBlock("span", _hoisted_1, [renderSlot(_ctx.$slots, "icon")])) : createCommentVNode("v-if", true),
					_ctx.$slots["meta"] ? (openBlock(), createElementBlock("span", _hoisted_2, [renderSlot(_ctx.$slots, "meta")])) : createCommentVNode("v-if", true),
					createElementVNode("span", _hoisted_3, [renderSlot(_ctx.$slots, "title")]),
					_ctx.$slots["default"] ? (openBlock(), createElementBlock("span", _hoisted_4, [renderSlot(_ctx.$slots, "default")])) : createCommentVNode("v-if", true)
				]),
				_: 3
			}, 16, ["class"]))], 6);
		};
	}
});
export { BlIndexRow_vue_vue_type_script_setup_true_lang_default as default };
