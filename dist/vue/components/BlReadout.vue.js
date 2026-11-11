import { defineComponent, openBlock, createElementBlock, createElementVNode, toDisplayString, createCommentVNode } from "vue";
const _hoisted_1 = { class: "bl-readout" };
const _hoisted_2 = { class: "bl-readout__value" };
const _hoisted_3 = {
  key: 0,
  class: "bl-readout__unit"
};
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "BlReadout",
  props: {
    value: {},
    unit: {}
  },
  setup(__props) {
    return (_ctx, _cache) => {
      return openBlock(), createElementBlock("p", _hoisted_1, [
        createElementVNode(
          "span",
          _hoisted_2,
          toDisplayString(__props.value),
          1
          /* TEXT */
        ),
        __props.unit ? (openBlock(), createElementBlock(
          "span",
          _hoisted_3,
          toDisplayString(__props.unit),
          1
          /* TEXT */
        )) : createCommentVNode("v-if", true)
      ]);
    };
  }
});
export {
  _sfc_main as default
};
