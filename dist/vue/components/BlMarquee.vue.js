import { defineComponent, ref, watch, openBlock, createElementBlock, unref, createElementVNode, renderSlot } from "vue";
import { useMarquee } from "../composables/useMarquee.js";
const _hoisted_1 = ["data-overflowing", "title"];
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "BlMarquee",
  props: {
    title: {},
    contentKey: {},
    paused: { type: Boolean }
  },
  setup(__props, { expose: __expose }) {
    const props = __props;
    const container = ref(null);
    const content = ref(null);
    const { overflowing, refresh } = useMarquee(container, content, {
      paused: () => props.paused === true
    });
    watch(
      () => props.contentKey,
      () => refresh(),
      { flush: "post" }
    );
    __expose({ refresh });
    return (_ctx, _cache) => {
      return openBlock(), createElementBlock("div", {
        ref_key: "container",
        ref: container,
        class: "bl-marquee",
        "data-overflowing": unref(overflowing) ? "" : void 0,
        title: unref(overflowing) ? __props.title : void 0
      }, [
        createElementVNode(
          "div",
          {
            ref_key: "content",
            ref: content,
            class: "bl-marquee__content"
          },
          [
            renderSlot(_ctx.$slots, "default")
          ],
          512
          /* NEED_PATCH */
        )
      ], 8, _hoisted_1);
    };
  }
});
export {
  _sfc_main as default
};
