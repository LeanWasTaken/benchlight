import { Fragment, createElementBlock, createElementVNode, defineComponent, openBlock, renderList, renderSlot, toDisplayString } from "vue";
// vue/components/BlColophon.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1 = { class: "bl-colophon" };
var _hoisted_2 = { class: "bl-col bl-colophon__inner" };
var _hoisted_3 = { class: "bl-colophon__items" };
var BlColophon_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ defineComponent({
	__name: "BlColophon",
	props: { items: { default: () => [] } },
	setup(__props) {
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock("footer", _hoisted_1, [createElementVNode("div", _hoisted_2, [createElementVNode("div", _hoisted_3, [renderSlot(_ctx.$slots, "default", {}, () => [(openBlock(true), createElementBlock(Fragment, null, renderList(__props.items, (item) => {
				return openBlock(), createElementBlock("span", { key: item }, toDisplayString(item), 1);
			}), 128))])]), renderSlot(_ctx.$slots, "actions")])]);
		};
	}
});
export { BlColophon_vue_vue_type_script_setup_true_lang_default as default };
