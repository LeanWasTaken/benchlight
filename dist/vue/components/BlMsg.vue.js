import { defineComponent, computed, openBlock, createElementBlock, normalizeClass, createElementVNode, renderSlot } from "vue";
const _hoisted_1 = ["role"];
const _hoisted_2 = { class: "bl-msg__text" };
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "BlMsg",
  props: {
    tone: { default: "neutral" }
  },
  setup(__props) {
    const props = __props;
    const toneClass = computed(() => props.tone === "neutral" ? void 0 : `bl-msg--${props.tone}`);
    return (_ctx, _cache) => {
      return openBlock(), createElementBlock("p", {
        class: normalizeClass(["bl-msg", toneClass.value]),
        role: __props.tone === "danger" ? "alert" : "status"
      }, [
        createElementVNode("span", _hoisted_2, [
          renderSlot(_ctx.$slots, "default")
        ])
      ], 10, _hoisted_1);
    };
  }
});
export {
  _sfc_main as default
};
