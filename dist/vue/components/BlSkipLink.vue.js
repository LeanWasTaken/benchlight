import { defineComponent, openBlock, createElementBlock, renderSlot, createTextVNode } from "vue";
const _hoisted_1 = ["href"];
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "BlSkipLink",
  props: {
    target: { default: "#main-content" }
  },
  setup(__props) {
    return (_ctx, _cache) => {
      return openBlock(), createElementBlock("a", {
        class: "bl-skip-link",
        href: __props.target
      }, [
        renderSlot(_ctx.$slots, "default", {}, () => [
          _cache[0] || (_cache[0] = createTextVNode(
            "Skip to content",
            -1
            /* CACHED */
          ))
        ])
      ], 8, _hoisted_1);
    };
  }
});
export {
  _sfc_main as default
};
