import { warnOnce } from "../internal/dev.js";
import { Fragment, computed, createBlock, createCommentVNode, createElementBlock, createTextVNode, defineComponent, normalizeClass, openBlock, renderSlot, resolveDynamicComponent, toDisplayString, watchEffect, withCtx } from "vue";
// vue/components/BlSectionHead.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1 = {
	key: 0,
	class: "bl-section-head__actions"
};
var _hoisted_2 = {
	key: 0,
	class: "bl-section-head__eyebrow"
};
var _hoisted_3 = {
	key: 1,
	class: "bl-section-head__actions"
};
var BlSectionHead_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ defineComponent({
	__name: "BlSectionHead",
	props: {
		eyebrow: {},
		heading: {},
		level: { default: 2 },
		bar: { type: Boolean },
		ruled: { type: Boolean }
	},
	setup(__props) {
		const props = __props;
		const headingTag = computed(() => `h${props.level}`);
		watchEffect(() => {
			if (!(props.bar ? props.eyebrow : props.heading)) warnOnce(props.bar ? "BlSectionHead: `bar` renders the eyebrow as the heading, but `eyebrow` is empty." : "BlSectionHead: `heading` is empty, so the section has no heading.");
		});
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock("div", { class: normalizeClass(["bl-section-head", {
				"bl-section-head--bar": __props.bar,
				"bl-section-head--ruled": __props.ruled
			}]) }, [__props.bar ? (openBlock(), createElementBlock(Fragment, { key: 0 }, [(openBlock(), createBlock(resolveDynamicComponent(headingTag.value), { class: "bl-section-head__eyebrow" }, {
				default: withCtx(() => [createTextVNode(toDisplayString(__props.eyebrow), 1)]),
				_: 1
			})), _ctx.$slots["actions"] ? (openBlock(), createElementBlock("div", _hoisted_1, [renderSlot(_ctx.$slots, "actions")])) : createCommentVNode("v-if", true)], 64)) : (openBlock(), createElementBlock(Fragment, { key: 1 }, [
				__props.eyebrow ? (openBlock(), createElementBlock("p", _hoisted_2, toDisplayString(__props.eyebrow), 1)) : createCommentVNode("v-if", true),
				(openBlock(), createBlock(resolveDynamicComponent(headingTag.value), { class: "bl-section-head__heading" }, {
					default: withCtx(() => [createTextVNode(toDisplayString(__props.heading), 1)]),
					_: 1
				})),
				_ctx.$slots["actions"] ? (openBlock(), createElementBlock("div", _hoisted_3, [renderSlot(_ctx.$slots, "actions")])) : createCommentVNode("v-if", true)
			], 64))], 2);
		};
	}
});
export { BlSectionHead_vue_vue_type_script_setup_true_lang_default as default };
