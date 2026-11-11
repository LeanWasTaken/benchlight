import { defineComponent, useModel, useId, ref, computed, watch, onMounted, onDeactivated, onActivated, onBeforeUnmount, openBlock, createElementBlock, Fragment, renderSlot, createElementVNode, mergeProps, unref, mergeModels } from "vue";
import { triggerAnchorStyle, panelAnchorStyle } from "../internal/anchor.js";
import { warn } from "../internal/dev.js";
const _hoisted_1 = ["data-side", "data-align", "role", "aria-label"];
const _sfc_main = /* @__PURE__ */ defineComponent({
  ...{ inheritAttrs: false },
  __name: "BlPopover",
  props: /* @__PURE__ */ mergeModels({
    side: { default: "bottom" },
    align: { default: "center" },
    ariaLabel: {}
  }, {
    "open": { type: Boolean, ...{ default: false } },
    "openModifiers": {}
  }),
  emits: ["update:open"],
  setup(__props) {
    const open = useModel(__props, "open");
    const uid = useId();
    const panelId = `${uid}-popover`;
    const panel = ref();
    const bind = computed(() => ({
      id: `${uid}-trigger`,
      // A <button> in a <form> defaults to submit: the click would submit instead of opening.
      type: "button",
      "aria-expanded": open.value ? "true" : "false",
      "aria-controls": panelId,
      popovertarget: panelId,
      style: triggerAnchorStyle(uid)
    }));
    let shown = false;
    let clicking = false;
    function onBeforeToggle(event) {
      const next = event.newState === "open";
      shown = next;
      if (open.value !== next) open.value = next;
    }
    function sync() {
      const el = panel.value;
      if (!el || clicking || typeof el.showPopover !== "function") return;
      const want = open.value;
      if (want === shown) return;
      try {
        if (want) el.showPopover();
        else el.hidePopover();
        shown = want;
      } catch {
      }
    }
    watch(open, sync, { flush: "post" });
    function onClickCapture(event) {
      const target = event.target;
      const trigger = target?.closest?.("[popovertarget]");
      if (trigger?.getAttribute("popovertarget") !== panelId) return;
      clicking = true;
      setTimeout(() => {
        clicking = false;
        sync();
      });
    }
    onMounted(() => {
      const el = panel.value;
      el.ownerDocument.addEventListener("click", onClickCapture, true);
      const trigger = el.parentNode?.querySelector(`[aria-controls="${panelId}"]`);
      if (!trigger) {
        warn("BlPopover: the trigger slot rendered no element with `bind`; spread it on a <button>.");
      } else {
        const isButton = trigger instanceof HTMLButtonElement || trigger instanceof HTMLInputElement && trigger.type === "button";
        if (!isButton)
          warn(
            `BlPopover: the trigger is a <${trigger.localName}>; popovertarget only works on a <button>.`
          );
      }
      sync();
    });
    onDeactivated(() => {
      clicking = false;
      if (!shown) return;
      shown = false;
      try {
        panel.value?.hidePopover();
      } catch {
      }
      if (open.value) open.value = false;
    });
    onActivated(sync);
    onBeforeUnmount(() => {
      panel.value?.ownerDocument.removeEventListener("click", onClickCapture, true);
    });
    return (_ctx, _cache) => {
      return openBlock(), createElementBlock(
        Fragment,
        null,
        [
          renderSlot(_ctx.$slots, "trigger", { bind: bind.value }),
          createElementVNode("div", mergeProps(_ctx.$attrs, {
            id: panelId,
            ref_key: "panel",
            ref: panel,
            class: "bl-popover",
            popover: "auto",
            "data-side": __props.side,
            "data-align": __props.align,
            role: __props.ariaLabel ? "group" : void 0,
            "aria-label": __props.ariaLabel || void 0,
            style: unref(panelAnchorStyle)(unref(uid)),
            onBeforetoggle: onBeforeToggle
          }), [
            renderSlot(_ctx.$slots, "default")
          ], 16, _hoisted_1)
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
