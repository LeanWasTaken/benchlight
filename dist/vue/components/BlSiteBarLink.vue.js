import { currentValue, linkBindings, resolveTag } from "../internal/link.js";
import { computed, createBlock, createElementBlock, defineComponent, mergeProps, normalizeClass, normalizeStyle, openBlock, renderSlot, resolveDynamicComponent, unref, useAttrs, withCtx } from "vue";
// vue/components/BlSiteBarLink.vue?vue&type=script&setup=true&lang.ts
var BlSiteBarLink_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ defineComponent({
	inheritAttrs: false,
	__name: "BlSiteBarLink",
	props: {
		as: {},
		to: {},
		href: {},
		current: { type: [Boolean, String] }
	},
	setup(__props) {
		const props = __props;
		const attrs = useAttrs();
		const ariaCurrent = computed(() => currentValue(props.current));
		const tag = computed(() => resolveTag(props.as, props.to, props.href, "a"));
		function linkAttrs() {
			const rest = { ...attrs };
			delete rest.class;
			delete rest.style;
			return {
				...linkBindings(tag.value, props.to, props.href),
				...rest,
				...ariaCurrent.value ? { "aria-current": ariaCurrent.value } : {}
			};
		}
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock("li", {
				class: normalizeClass(unref(attrs).class),
				style: normalizeStyle(unref(attrs).style)
			}, [(openBlock(), createBlock(resolveDynamicComponent(tag.value), mergeProps(linkAttrs(), { class: "bl-site-bar__link" }), {
				default: withCtx(() => [renderSlot(_ctx.$slots, "default")]),
				_: 3
			}, 16))], 6);
		};
	}
});
export { BlSiteBarLink_vue_vue_type_script_setup_true_lang_default as default };
