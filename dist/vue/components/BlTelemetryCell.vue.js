import { defineComponent, openBlock, createElementBlock, createElementVNode, toDisplayString, renderSlot } from "vue";
const _hoisted_1 = { class: "bl-telemetry__cell" };
const _hoisted_2 = { class: "bl-telemetry__label" };
const _hoisted_3 = { class: "bl-telemetry__value" };
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "BlTelemetryCell",
  props: {
    label: {}
  },
  setup(__props) {
    return (_ctx, _cache) => {
      return openBlock(), createElementBlock("div", _hoisted_1, [
        createElementVNode(
          "span",
          _hoisted_2,
          toDisplayString(__props.label),
          1
          /* TEXT */
        ),
        createElementVNode("span", _hoisted_3, [
          renderSlot(_ctx.$slots, "default")
        ])
      ]);
    };
  }
});
export {
  _sfc_main as default
};
