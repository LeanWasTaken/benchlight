import { defineComponent, useModel, ref, useId, computed, watch, onMounted, onDeactivated, onActivated, onBeforeUnmount, openBlock, createElementBlock, mergeProps, unref, createElementVNode, toDisplayString, createBlock, withCtx, createCommentVNode, renderSlot, createVNode, mergeModels, h } from "vue";
import { warn } from "../internal/dev.js";
import { lockPage, unlockPage } from "../internal/pageLock.js";
import { hasContent } from "../internal/slots.js";
import { toastFocus, pushToastHost, removeToastHost } from "../internal/toastHosts.js";
import { mergeLabels } from "../internal/labels.js";
import _sfc_main$1 from "./BlButton.vue.js";
const _hoisted_1 = ["aria-labelledby", "aria-describedby"];
const _hoisted_2 = { class: "bl-dialog__panel" };
const _hoisted_3 = { class: "bl-dialog__head" };
const _hoisted_4 = ["id"];
const _hoisted_5 = ["id"];
const _hoisted_6 = { class: "bl-dialog__body" };
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "BlDialog",
  props: /* @__PURE__ */ mergeModels({
    title: {},
    description: {},
    dismissible: { type: Boolean, default: true },
    labels: {}
  }, {
    "open": { type: Boolean, ...{ required: true } },
    "openModifiers": {}
  }),
  emits: /* @__PURE__ */ mergeModels(["close"], ["update:open"]),
  setup(__props, { emit: __emit }) {
    const props = __props;
    const open = useModel(__props, "open");
    const emit = __emit;
    const el = ref();
    const toasts = ref();
    let hasFooter = false;
    const Foot = (p) => {
      hasFooter = hasContent(p.nodes);
      return hasFooter ? h("div", { class: "bl-dialog__foot" }, p.nodes) : null;
    };
    const titleId = useId();
    const descId = useId();
    const text = computed(() => mergeLabels({ close: "Close" }, props.labels));
    let isOpen = false;
    let pendingReason = null;
    let opener = null;
    let fallback = null;
    let downOnBackdrop = false;
    function show() {
      const dialog = el.value;
      if (!dialog) return;
      if (isOpen) {
        if (dialog.open) return;
        finish(false);
      }
      if (!props.dismissible && !hasFooter)
        warn("BlDialog: dismissible is false and the footer is empty, so nothing can close it.");
      opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      fallback = opener?.closest(".bl-toaster") ? toastFocus.returnTarget : null;
      lockPage();
      dialog.returnValue = "";
      dialog.showModal();
      isOpen = true;
      if (toasts.value) pushToastHost(toasts.value);
    }
    function closeWith(reason) {
      if (!isOpen) return;
      pendingReason = reason;
      if (toasts.value) removeToastHost(toasts.value);
      el.value?.close();
    }
    function onCancel(event) {
      if (props.dismissible) {
        pendingReason = "escape";
        return;
      }
      event.preventDefault();
      pendingReason = event.cancelable ? null : "escape";
    }
    function onClose() {
      if (isOpen && !el.value?.open) finish(true);
    }
    function finish(sync) {
      isOpen = false;
      const reason = pendingReason ?? "native";
      pendingReason = null;
      if (toasts.value) removeToastHost(toasts.value);
      unlockPage();
      if (sync && open.value) open.value = false;
      emit("close", { reason, returnValue: el.value?.returnValue ?? "" });
      restoreFocus();
    }
    function restoreFocus() {
      const active = document.activeElement;
      const lost = !active || active === document.body || gone(active) || el.value?.contains(active);
      if (lost) returnTarget()?.focus({ preventScroll: true });
      opener = fallback = null;
    }
    function returnTarget() {
      if (opener && !gone(opener)) return opener;
      return fallback && !gone(fallback) ? fallback : null;
    }
    function gone(node) {
      return !node.isConnected || node.closest(".bl-toast-leave-active") !== null;
    }
    function onPointerDown(event) {
      downOnBackdrop = event.target === el.value;
    }
    function onClick(event) {
      const backdrop = downOnBackdrop && event.target === el.value;
      downOnBackdrop = false;
      if (backdrop && props.dismissible) closeWith("backdrop");
    }
    watch(open, (value) => {
      if (value) show();
      else closeWith("program");
    });
    onMounted(() => {
      if (open.value) show();
    });
    let suspended = false;
    onDeactivated(() => {
      if (!isOpen) return;
      suspended = true;
      isOpen = false;
      pendingReason = null;
      if (toasts.value) removeToastHost(toasts.value);
      unlockPage();
      el.value?.close();
      opener = fallback = null;
    });
    onActivated(() => {
      if (!suspended) return;
      suspended = false;
      if (open.value) show();
    });
    onBeforeUnmount(() => {
      if (!isOpen) return;
      isOpen = false;
      if (toasts.value) removeToastHost(toasts.value);
      unlockPage();
      el.value?.close();
      returnTarget()?.focus({ preventScroll: true });
      opener = fallback = null;
    });
    return (_ctx, _cache) => {
      return openBlock(), createElementBlock("dialog", mergeProps({
        ref_key: "el",
        ref: el,
        class: "bl-dialog",
        "aria-labelledby": unref(titleId),
        "aria-describedby": __props.description ? unref(descId) : void 0
      }, { closedby: __props.dismissible ? void 0 : "none" }, {
        onCancel,
        onClose,
        onPointerdown: onPointerDown,
        onClick
      }), [
        createElementVNode("div", _hoisted_2, [
          createElementVNode("div", _hoisted_3, [
            createElementVNode("h2", {
              id: unref(titleId),
              class: "bl-dialog__title"
            }, toDisplayString(__props.title), 9, _hoisted_4),
            __props.dismissible ? (openBlock(), createBlock(_sfc_main$1, {
              key: 0,
              class: "bl-dialog__close",
              variant: "ghost",
              "aria-label": text.value.close,
              onClick: _cache[0] || (_cache[0] = ($event) => closeWith("button"))
            }, {
              icon: withCtx(() => [..._cache[1] || (_cache[1] = [
                createElementVNode(
                  "svg",
                  {
                    viewBox: "0 0 16 16",
                    fill: "none",
                    stroke: "currentColor",
                    "stroke-width": "1.5"
                  },
                  [
                    createElementVNode("path", { d: "M4 4l8 8M12 4l-8 8" })
                  ],
                  -1
                  /* CACHED */
                )
              ])]),
              _: 1
              /* STABLE */
            }, 8, ["aria-label"])) : createCommentVNode("v-if", true)
          ]),
          __props.description ? (openBlock(), createElementBlock("p", {
            key: 0,
            id: unref(descId),
            class: "bl-dialog__description"
          }, toDisplayString(__props.description), 9, _hoisted_5)) : createCommentVNode("v-if", true),
          createElementVNode("div", _hoisted_6, [
            renderSlot(_ctx.$slots, "default")
          ]),
          createVNode(Foot, {
            nodes: _ctx.$slots["footer"]?.()
          }, null, 8, ["nodes"])
        ]),
        createCommentVNode(" Outside the panel: the panel's entry transform would capture the fixed toaster. "),
        createElementVNode(
          "div",
          {
            ref_key: "toasts",
            ref: toasts,
            class: "bl-dialog__toasts"
          },
          null,
          512
          /* NEED_PATCH */
        )
      ], 16, _hoisted_1);
    };
  }
});
export {
  _sfc_main as default
};
