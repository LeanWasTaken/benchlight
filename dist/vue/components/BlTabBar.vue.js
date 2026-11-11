import { defineComponent, openBlock, createElementBlock, renderSlot } from "vue";
const _hoisted_1 = ["aria-label"];
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "BlTabBar",
  props: {
    ariaLabel: { default: "Primary" }
  },
  setup(__props) {
    return (_ctx, _cache) => {
      return openBlock(), createElementBlock("nav", {
        class: "bl-tab-bar",
        "aria-label": __props.ariaLabel
      }, [
        renderSlot(_ctx.$slots, "default")
      ], 8, _hoisted_1);
    };
  }
});
export {
  _sfc_main as default
};
