import { defineComponent, openBlock, createElementBlock, normalizeClass, renderSlot } from "vue";
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "BlIndex",
  props: {
    ruledTop: { type: Boolean },
    grid: { type: Boolean }
  },
  setup(__props) {
    return (_ctx, _cache) => {
      return openBlock(), createElementBlock(
        "ul",
        {
          class: normalizeClass(["bl-index", { "bl-index--ruled-top": __props.ruledTop, "bl-index--grid": __props.grid }])
        },
        [
          renderSlot(_ctx.$slots, "default")
        ],
        2
        /* CLASS */
      );
    };
  }
});
export {
  _sfc_main as default
};
