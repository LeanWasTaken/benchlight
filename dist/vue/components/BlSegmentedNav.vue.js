import { defineComponent, useAttrs, openBlock, createElementBlock, normalizeClass, Fragment, renderList, createBlock, resolveDynamicComponent, mergeProps, unref, withCtx, createTextVNode, toDisplayString } from "vue";
import { warnOnce } from "../internal/dev.js";
import { linkBindings, currentValue } from "../internal/link.js";
const _hoisted_1 = ["aria-label"];
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "BlSegmentedNav",
  props: {
    items: {},
    ariaLabel: {},
    linkAs: { default: "a" },
    compact: { type: Boolean }
  },
  setup(__props) {
    const props = __props;
    const attrs = useAttrs();
    if (!props.ariaLabel && !attrs["aria-labelledby"])
      warnOnce("BlSegmentedNav: set `ariaLabel` (`aria-label`) to name the navigation.");
    function tagFor(item) {
      if (item.to === void 0 && item.href === void 0) {
        warnOnce("BlSegmentedNav: an item has no to/href; every item must link somewhere.");
      }
      return item.as ?? props.linkAs;
    }
    return (_ctx, _cache) => {
      return openBlock(), createElementBlock("nav", {
        class: normalizeClass(["bl-segmented", { "bl-segmented--compact": __props.compact }]),
        "aria-label": __props.ariaLabel
      }, [
        (openBlock(true), createElementBlock(
          Fragment,
          null,
          renderList(__props.items, (item, index) => {
            return openBlock(), createBlock(resolveDynamicComponent(tagFor(item)), mergeProps({ key: index }, { ref_for: true }, unref(linkBindings)(tagFor(item), item.to, item.href), {
              class: "bl-segmented__item",
              "aria-current": unref(currentValue)(item.current)
            }), {
              default: withCtx(() => [
                createTextVNode(
                  toDisplayString(item.label),
                  1
                  /* TEXT */
                )
              ]),
              _: 2
              /* DYNAMIC */
            }, 1040, ["aria-current"]);
          }),
          128
          /* KEYED_FRAGMENT */
        ))
      ], 10, _hoisted_1);
    };
  }
});
export {
  _sfc_main as default
};
