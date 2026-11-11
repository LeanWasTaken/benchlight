import { defineComponent, useSlots, useAttrs, shallowRef, onBeforeUpdate, computed, watchEffect, openBlock, createBlock, resolveDynamicComponent, mergeProps, withCtx, createElementBlock, renderSlot, createCommentVNode, createVNode } from "vue";
import { hasContent } from "../internal/slots.js";
import { isDev, warn } from "../internal/dev.js";
import { resolveTag, linkBindings } from "../internal/link.js";
const _hoisted_1 = {
  key: 0,
  class: "bl-btn__icon",
  "aria-hidden": "true"
};
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "BlButton",
  props: {
    as: {},
    to: {},
    href: {},
    variant: { default: "primary" },
    ariaLabel: {},
    pressed: { type: Boolean, default: void 0 },
    pill: { type: Boolean },
    type: { default: "button" },
    disabled: { type: Boolean }
  },
  setup(__props) {
    const props = __props;
    const slots = useSlots();
    const attrs = useAttrs();
    let cache;
    const iconOnlyState = shallowRef(false);
    const hasTextState = shallowRef(false);
    onBeforeUpdate(() => {
      cache = void 0;
    });
    function nodes() {
      if (!cache) {
        cache = slots["default"]?.() ?? [];
        if (isDev) {
          hasTextState.value = hasContent(cache);
          iconOnlyState.value = Boolean(slots["icon"]) && !hasTextState.value;
        }
      }
      return cache;
    }
    function iconOnly() {
      return Boolean(slots["icon"]) && !hasContent(nodes());
    }
    const Nodes = (p) => p.n;
    function blockClick(event) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
    const linkTag = computed(() => resolveTag(props.as, props.to, props.href, "button"));
    const tag = computed(
      () => props.disabled && linkTag.value !== "button" ? "a" : linkTag.value
    );
    const bindings = computed(() => {
      const name = props.ariaLabel === void 0 ? {} : { "aria-label": props.ariaLabel };
      if (tag.value === "button") {
        return {
          ...linkBindings("button", props.to, props.href),
          ...name,
          type: props.type,
          disabled: props.disabled || void 0,
          "aria-pressed": props.pressed === void 0 ? void 0 : String(props.pressed)
        };
      }
      if (props.disabled) {
        return { ...name, "aria-disabled": "true", tabindex: "-1", onClickCapture: blockClick };
      }
      return { ...linkBindings(tag.value, props.to, props.href), ...name };
    });
    if (isDev) {
      const warned = /* @__PURE__ */ new Set();
      const once = (key, message) => {
        if (warned.has(key)) return;
        warned.add(key);
        warn(message);
      };
      watchEffect(
        () => {
          if (props.pressed !== void 0 && tag.value !== "button")
            once(
              "pressed",
              "BlButton: `pressed` is ignored on links; a link cannot be a toggle button."
            );
          if (iconOnlyState.value && props.ariaLabel === void 0 && attrs["aria-labelledby"] === void 0)
            once(
              "name",
              "BlButton: an icon-only button needs an `ariaLabel` (`aria-label`) or `aria-labelledby`."
            );
          if (props.ariaLabel !== void 0 && hasTextState.value)
            once(
              "label",
              "BlButton: `ariaLabel` replaces the visible text as the accessible name; use it for icon-only buttons."
            );
        },
        { flush: "post" }
      );
    }
    return (_ctx, _cache) => {
      return openBlock(), createBlock(resolveDynamicComponent(tag.value), mergeProps(bindings.value, {
        class: ["bl-btn", {
          "bl-btn--secondary": __props.variant === "secondary",
          "bl-btn--danger": __props.variant === "danger",
          "bl-btn--ghost": __props.variant === "ghost",
          "bl-btn--pill": __props.pill,
          "bl-btn--icon": iconOnly()
        }]
      }), {
        default: withCtx(() => [
          _ctx.$slots["icon"] ? (openBlock(), createElementBlock("span", _hoisted_1, [
            renderSlot(_ctx.$slots, "icon")
          ])) : createCommentVNode("v-if", true),
          createVNode(Nodes, {
            n: nodes()
          }, null, 8, ["n"])
        ]),
        _: 3
        /* FORWARDED */
      }, 16, ["class"]);
    };
  }
});
export {
  _sfc_main as default
};
