import { computed, createElementBlock, createElementVNode, defineComponent, normalizeClass, openBlock, renderSlot } from "vue";
// vue/components/BlMsg.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1 = ["role"];
var _hoisted_2 = { class: "bl-msg__text" };
var BlMsg_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ defineComponent({
	__name: "BlMsg",
	props: { tone: { default: "neutral" } },
	setup(__props) {
		const props = __props;
		const toneClass = computed(() => props.tone === "neutral" ? void 0 : `bl-msg--${props.tone}`);
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock("p", {
				class: normalizeClass(["bl-msg", toneClass.value]),
				role: __props.tone === "danger" ? "alert" : "status"
			}, [createElementVNode("span", _hoisted_2, [renderSlot(_ctx.$slots, "default")])], 10, _hoisted_1);
		};
	}
});
export { BlMsg_vue_vue_type_script_setup_true_lang_default as default };
