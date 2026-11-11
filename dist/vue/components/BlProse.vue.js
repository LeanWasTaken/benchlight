import { defineComponent, openBlock, createBlock, resolveDynamicComponent, withCtx, renderSlot } from "vue";
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "BlProse",
  props: {
    as: { default: "div" }
  },
  setup(__props) {
    return (_ctx, _cache) => {
      return openBlock(), createBlock(resolveDynamicComponent(__props.as), { class: "bl-prose" }, {
        default: withCtx(() => [
          renderSlot(_ctx.$slots, "default")
        ]),
        _: 3
        /* FORWARDED */
      });
    };
  }
});
export {
  _sfc_main as default
};
