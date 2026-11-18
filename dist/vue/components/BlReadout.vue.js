import { createCommentVNode, createElementBlock, createElementVNode, defineComponent, openBlock, toDisplayString } from "vue";
// vue/components/BlReadout.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1 = { class: "bl-readout" };
var _hoisted_2 = { class: "bl-readout__value" };
var _hoisted_3 = {
	key: 0,
	class: "bl-readout__unit"
};
var BlReadout_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ defineComponent({
	__name: "BlReadout",
	props: {
		value: {},
		unit: {}
	},
	setup(__props) {
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock("p", _hoisted_1, [createElementVNode("span", _hoisted_2, toDisplayString(__props.value), 1), __props.unit ? (openBlock(), createElementBlock("span", _hoisted_3, toDisplayString(__props.unit), 1)) : createCommentVNode("v-if", true)]);
		};
	}
});
export { BlReadout_vue_vue_type_script_setup_true_lang_default as default };
