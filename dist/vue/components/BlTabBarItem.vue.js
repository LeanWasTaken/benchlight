import { defineComponent, computed, openBlock, createBlock, resolveDynamicComponent, mergeProps, unref, withCtx, createElementBlock, renderSlot, createCommentVNode, createElementVNode } from "vue";
import { hasContent } from "../internal/slots.js";
import { resolveTag, linkBindings, currentValue } from "../internal/link.js";
const _hoisted_1 = {
  key: 0,
  class: "bl-tab-bar__icon",
  "aria-hidden": "true"
};
const _hoisted_2 = { class: "bl-tab-bar__label" };
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "BlTabBarItem",
  props: {
    as: {},
    to: {},
    href: {},
    current: { type: [Boolean, String] }
  },
  setup(__props) {
    const props = __props;
    const tag = computed(() => resolveTag(props.as, props.to, props.href, "a"));
    return (_ctx, _cache) => {
      return openBlock(), createBlock(resolveDynamicComponent(tag.value), mergeProps(unref(linkBindings)(tag.value, __props.to, __props.href), {
        class: "bl-tab-bar__item",
        "aria-current": unref(currentValue)(__props.current)
      }), {
        default: withCtx(() => [
          unref(hasContent)(_ctx.$slots["icon"]?.()) ? (openBlock(), createElementBlock("span", _hoisted_1, [
            renderSlot(_ctx.$slots, "icon")
          ])) : createCommentVNode("v-if", true),
          createElementVNode("span", _hoisted_2, [
            renderSlot(_ctx.$slots, "default")
          ])
        ]),
        _: 3
        /* FORWARDED */
      }, 16, ["aria-current"]);
    };
  }
});
export {
  _sfc_main as default
};
