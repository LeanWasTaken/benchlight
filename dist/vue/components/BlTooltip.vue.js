import { defineComponent, useId, ref, onMounted, onDeactivated, onBeforeUnmount, openBlock, createElementBlock, Fragment, renderSlot, createElementVNode, mergeProps, unref, toDisplayString } from "vue";
import { triggerAnchorStyle, panelAnchorStyle } from "../internal/anchor.js";
import { warn } from "../internal/dev.js";
const _hoisted_1 = ["data-side", "data-align"];
const GRACE = 100;
const _sfc_main = /* @__PURE__ */ defineComponent({
  ...{ inheritAttrs: false },
  __name: "BlTooltip",
  props: {
    text: {},
    side: { default: "top" },
    align: { default: "center" },
    delay: { default: 400 }
  },
  setup(__props) {
    const props = __props;
    const uid = useId();
    const tipId = `${uid}-tooltip`;
    const tip = ref();
    let open = false;
    let focused = false;
    let showTimer;
    let hideTimer;
    function clearTimers() {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
      showTimer = hideTimer = void 0;
    }
    function onKeydown(event) {
      if (event.key !== "Escape" || !open) return;
      event.preventDefault();
      hide();
    }
    function show() {
      clearTimers();
      const el = tip.value;
      if (open || !el) return;
      try {
        el.showPopover();
      } catch {
        return;
      }
      open = true;
      el.ownerDocument.addEventListener("keydown", onKeydown);
    }
    function hide() {
      clearTimers();
      focused = false;
      if (!open) return;
      open = false;
      const el = tip.value;
      el?.ownerDocument.removeEventListener("keydown", onKeydown);
      try {
        el?.hidePopover();
      } catch {
      }
    }
    function onEnter(event) {
      if (event.pointerType === "touch") return;
      clearTimeout(hideTimer);
      hideTimer = void 0;
      if (open || showTimer !== void 0) return;
      showTimer = setTimeout(show, props.delay);
    }
    function onTipEnter(event) {
      if (event.pointerType === "touch") return;
      clearTimeout(hideTimer);
      hideTimer = void 0;
    }
    function onLeave(event) {
      if (event.pointerType === "touch") return;
      clearTimeout(showTimer);
      showTimer = void 0;
      if (!open || focused) return;
      clearTimeout(hideTimer);
      hideTimer = setTimeout(hide, GRACE);
    }
    function focusVisible(el) {
      try {
        return el.matches(":focus-visible");
      } catch {
        return true;
      }
    }
    function onFocus(event) {
      const target = event.currentTarget;
      if (!target || !focusVisible(target)) return;
      show();
      focused = open;
    }
    function onBlur() {
      hide();
    }
    const bind = {
      "aria-describedby": tipId,
      style: triggerAnchorStyle(uid),
      onPointerenter: onEnter,
      onPointerleave: onLeave,
      onFocus,
      onBlur
    };
    onMounted(() => {
      if (!props.text?.trim()) warn("BlTooltip: `text` is empty; the tooltip has nothing to say.");
      const trigger = tip.value?.parentNode?.querySelector(`[aria-describedby~="${tipId}"]`);
      if (trigger?.matches(":disabled"))
        warn(
          "BlTooltip: the trigger is disabled; disabled elements fire no pointer or focus events, so the tooltip never shows."
        );
    });
    onDeactivated(hide);
    onBeforeUnmount(() => {
      clearTimers();
      tip.value?.ownerDocument.removeEventListener("keydown", onKeydown);
      open = false;
    });
    return (_ctx, _cache) => {
      return openBlock(), createElementBlock(
        Fragment,
        null,
        [
          renderSlot(_ctx.$slots, "trigger", { bind }),
          createElementVNode("div", mergeProps(_ctx.$attrs, {
            id: tipId,
            ref_key: "tip",
            ref: tip,
            class: "bl-tooltip",
            popover: "manual",
            role: "tooltip",
            "data-side": __props.side,
            "data-align": __props.align,
            style: unref(panelAnchorStyle)(unref(uid)),
            onPointerenter: onTipEnter,
            onPointerleave: onLeave
          }), toDisplayString(__props.text), 17, _hoisted_1)
        ],
        64
        /* STABLE_FRAGMENT */
      );
    };
  }
});
export {
  _sfc_main as default
};
