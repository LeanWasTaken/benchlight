import { defineComponent, ref, watch, openBlock, createElementBlock, normalizeClass, Fragment, renderList, createElementVNode } from "vue";
import { cssTime } from "../internal/cssTime.js";
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "BlEqBars",
  props: {
    active: { type: Boolean }
  },
  setup(__props) {
    const props = __props;
    const root = ref(null);
    watch(
      () => props.active,
      (active, was) => {
        const bars = root.value?.querySelectorAll(".bl-eq__bar");
        if (!was || active || !bars || !window.matchMedia) return;
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
        const fast = cssTime(
          getComputedStyle(root.value).getPropertyValue("--bl-duration-fast"),
          150
        );
        for (const bar of bars) {
          const from = getComputedStyle(bar).transform;
          if (from && from !== "none")
            bar.animate?.([{ transform: from }, { transform: "none" }], {
              duration: fast,
              easing: "ease"
            });
        }
      },
      { flush: "sync" }
    );
    return (_ctx, _cache) => {
      return openBlock(), createElementBlock(
        "span",
        {
          ref_key: "root",
          ref: root,
          class: normalizeClass(["bl-eq", { "bl-eq--active": __props.active }]),
          "aria-hidden": "true"
        },
        [
          (openBlock(), createElementBlock(
            Fragment,
            null,
            renderList(4, (bar) => {
              return createElementVNode("span", {
                key: bar,
                class: "bl-eq__bar"
              });
            }),
            64
            /* STABLE_FRAGMENT */
          ))
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
