import { defineComponent, computed, openBlock, createElementBlock, createElementVNode, toDisplayString, renderSlot, createBlock, resolveDynamicComponent, mergeProps, unref, withCtx, createTextVNode, Fragment } from "vue";
import { resolveTag, linkBindings } from "../internal/link.js";
const _hoisted_1 = { class: "bl-spec-row" };
const _hoisted_2 = { class: "bl-spec-row__label" };
const _hoisted_3 = { class: "bl-spec-row__value" };
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "BlSpecRow",
  props: {
    label: {},
    value: {},
    as: {},
    to: {},
    href: {},
    external: { type: [Boolean, null], default: null }
  },
  setup(__props) {
    const props = __props;
    const linked = computed(() => !!(props.as || props.to !== void 0 || props.href));
    const tag = computed(() => resolveTag(props.as, props.to, props.href, "a"));
    const isExternal = computed(() => props.external ?? /^(https?:)?\/\//.test(props.href ?? ""));
    return (_ctx, _cache) => {
      return openBlock(), createElementBlock("div", _hoisted_1, [
        createElementVNode(
          "dt",
          _hoisted_2,
          toDisplayString(__props.label),
          1
          /* TEXT */
        ),
        createElementVNode("dd", _hoisted_3, [
          renderSlot(_ctx.$slots, "default", {}, () => [
            linked.value ? (openBlock(), createBlock(resolveDynamicComponent(tag.value), mergeProps({ key: 0 }, unref(linkBindings)(tag.value, __props.to, __props.href), {
              target: isExternal.value ? "_blank" : void 0,
              rel: isExternal.value ? "noopener noreferrer" : void 0
            }), {
              default: withCtx(() => [
                createTextVNode(
                  toDisplayString(__props.value),
                  1
                  /* TEXT */
                )
              ]),
              _: 1
              /* STABLE */
            }, 16, ["target", "rel"])) : (openBlock(), createElementBlock(
              Fragment,
              { key: 1 },
              [
                createTextVNode(
                  toDisplayString(__props.value),
                  1
                  /* TEXT */
                )
              ],
              64
              /* STABLE_FRAGMENT */
            ))
          ])
        ])
      ]);
    };
  }
});
export {
  _sfc_main as default
};
