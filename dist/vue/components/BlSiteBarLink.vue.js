import { defineComponent, useAttrs, computed, openBlock, createElementBlock, normalizeStyle, unref, normalizeClass, createBlock, resolveDynamicComponent, mergeProps, withCtx, renderSlot } from "vue";
import { currentValue, resolveTag, linkBindings } from "../internal/link.js";
const _sfc_main = /* @__PURE__ */ defineComponent({
  ...{ inheritAttrs: false },
  __name: "BlSiteBarLink",
  props: {
    as: {},
    to: {},
    href: {},
    current: { type: [Boolean, String] }
  },
  setup(__props) {
    const props = __props;
    const attrs = useAttrs();
    const ariaCurrent = computed(() => currentValue(props.current));
    const tag = computed(() => resolveTag(props.as, props.to, props.href, "a"));
    function linkAttrs() {
      const rest = { ...attrs };
      delete rest.class;
      delete rest.style;
      return {
        ...linkBindings(tag.value, props.to, props.href),
        ...rest,
        ...ariaCurrent.value ? { "aria-current": ariaCurrent.value } : {}
      };
    }
    return (_ctx, _cache) => {
      return openBlock(), createElementBlock(
        "li",
        {
          class: normalizeClass(unref(attrs).class),
          style: normalizeStyle(unref(attrs).style)
        },
        [
          (openBlock(), createBlock(
            resolveDynamicComponent(tag.value),
            mergeProps(linkAttrs(), { class: "bl-site-bar__link" }),
            {
              default: withCtx(() => [
                renderSlot(_ctx.$slots, "default")
              ]),
              _: 3
              /* FORWARDED */
            },
            16
            /* FULL_PROPS */
          ))
        ],
        6
        /* CLASS, STYLE */
      );
    };
  }
});
export {
  _sfc_main as default
};
