import { defineComponent, openBlock, createElementBlock, normalizeStyle, createElementVNode, renderSlot } from "vue";
const _hoisted_1 = { class: "bl-telemetry__cells" };
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "BlTelemetry",
  props: {
    columns: {}
  },
  setup(__props) {
    return (_ctx, _cache) => {
      return openBlock(), createElementBlock(
        "div",
        {
          class: "bl-telemetry",
          style: normalizeStyle(__props.columns ? { "--bl-telemetry-columns": __props.columns } : void 0)
        },
        [
          _cache[0] || (_cache[0] = createElementVNode(
            "div",
            {
              class: "bl-ruler",
              "aria-hidden": "true"
            },
            null,
            -1
            /* CACHED */
          )),
          createElementVNode("div", _hoisted_1, [
            renderSlot(_ctx.$slots, "default")
          ])
        ],
        4
        /* STYLE */
      );
    };
  }
});
export {
  _sfc_main as default
};
