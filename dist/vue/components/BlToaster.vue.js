import { defineComponent, computed, useId, ref, effectScope, watch, nextTick, onMounted, onBeforeUnmount, openBlock, createBlock, Teleport, createElementVNode, mergeProps, TransitionGroup, withCtx, createElementBlock, Fragment, renderList, normalizeClass, createCommentVNode, unref, toDisplayString, createTextVNode, createVNode } from "vue";
import { warn } from "../internal/dev.js";
import { toastHosts, toastFocus } from "../internal/toastHosts.js";
import { toastState, dismissToast, normDuration } from "../internal/toastStore.js";
import { mergeLabels } from "../internal/labels.js";
import _sfc_main$1 from "./BlButton.vue.js";
const _hoisted_1 = ["aria-label"];
const _hoisted_2 = {
  key: 0,
  class: "bl-toast__mark",
  "aria-hidden": "true"
};
const _hoisted_3 = ["id"];
const _hoisted_4 = {
  key: 1,
  class: "bl-toaster__list"
};
const _sfc_main = /* @__PURE__ */ defineComponent({
  ...{ inheritAttrs: false },
  __name: "BlToaster",
  props: {
    max: { default: 3 },
    ariaLabel: { default: "Notifications" },
    labels: {}
  },
  setup(__props) {
    const props = __props;
    const text = computed(
      () => mergeLabels(
        {
          dismiss: "Dismiss",
          actionHint: (label) => `${label} available`
        },
        props.labels
      )
    );
    const uid = useId();
    const root = ref();
    const status = ref();
    const alert = ref();
    const mounted = ref(false);
    const host = computed(() => toastHosts.value.at(-1) ?? null);
    const visible = computed(() => toastState.items.slice(0, props.max));
    const elements = /* @__PURE__ */ new Map();
    function setItem(id, el) {
      if (el) elements.set(id, el);
      else elements.delete(id);
    }
    function announce(t) {
      const words = t.action ? `${t.message}, ${text.value.actionHint(t.action.label)}` : t.message;
      nextTick(() => speak(t.tone === "danger", words));
    }
    const scope = effectScope();
    function speak(danger, words) {
      const region = danger ? alert.value : status.value;
      if (!region) return;
      const dialog = region.closest("dialog");
      if (dialog && !dialog.open) {
        scope.run(() => {
          const stop2 = watch(
            host,
            () => {
              stop2();
              speak(danger, words);
            },
            { flush: "post" }
          );
        });
        return;
      }
      const p = document.createElement("p");
      p.textContent = words;
      region.append(p);
      setTimeout(() => p.remove(), 7e3);
    }
    watch(
      () => toastState.cleared,
      () => {
        status.value?.replaceChildren();
        alert.value?.replaceChildren();
      }
    );
    const timers = /* @__PURE__ */ new Map();
    let hovered = false;
    let focused = false;
    const paused = () => hovered || focused || document.visibilityState === "hidden";
    function run(id) {
      const timer = timers.get(id);
      if (!timer) return;
      timer.start = Date.now();
      timer.handle = setTimeout(() => dismissToast(id), timer.remaining);
    }
    function arm(t) {
      stop(t.id);
      const duration = normDuration(t.duration);
      if (duration <= 0) return;
      timers.set(t.id, { remaining: duration, start: 0 });
      if (!paused()) run(t.id);
    }
    function stop(id) {
      const timer = timers.get(id);
      if (timer?.handle !== void 0) clearTimeout(timer.handle);
      timers.delete(id);
    }
    function pauseAll() {
      for (const timer of timers.values()) {
        if (timer.handle === void 0) continue;
        clearTimeout(timer.handle);
        timer.handle = void 0;
        timer.remaining -= Date.now() - timer.start;
      }
    }
    function resumeAll() {
      if (paused()) return;
      for (const [id, timer] of timers) if (timer.handle === void 0) run(id);
    }
    function onPointer(event, over) {
      if (event.pointerType !== "mouse") return;
      hovered = over;
      if (over) pauseAll();
      else resumeAll();
    }
    function onVisibility() {
      if (paused()) pauseAll();
      else resumeAll();
    }
    function onFocusIn(event) {
      const from = event.relatedTarget;
      if (from instanceof HTMLElement && !root.value?.contains(from)) toastFocus.returnTarget = from;
      if (!focused) {
        focused = true;
        pauseAll();
      }
    }
    function onFocusOut(event) {
      const to = event.relatedTarget;
      if (to instanceof Node && root.value?.contains(to)) return;
      focused = false;
      resumeAll();
    }
    watch(
      visible,
      (next, prev) => {
        const active = document.activeElement;
        if (!active || !prev) return;
        const keep = new Set(next.map((t) => t.id));
        const gone = prev.findIndex((t) => !keep.has(t.id) && elements.get(t.id)?.contains(active));
        if (gone < 0) return;
        const after = prev.slice(gone + 1).find((t) => keep.has(t.id)) ?? next.at(-1);
        nextTick(() => {
          const back = toastFocus.returnTarget;
          const button = after ? elements.get(after.id)?.querySelector(".bl-toast__dismiss") : null;
          if (button) button.focus({ preventScroll: true });
          else if (back?.isConnected && !back.closest("[inert]")) back.focus({ preventScroll: true });
          else active.blur?.();
          focused = Boolean(root.value?.contains(document.activeElement));
          if (!focused) resumeAll();
        });
      },
      { flush: "pre" }
    );
    function pin(el) {
      const item = el;
      item.style.insetBlockStart = `${item.offsetTop}px`;
    }
    function runAction(t) {
      try {
        t.action?.onClick();
      } finally {
        dismissToast(t.id);
      }
    }
    const seen = /* @__PURE__ */ new Map();
    function sync(list) {
      const ids = new Set(list.map((t) => t.id));
      for (const id of [...timers.keys()]) if (!ids.has(id)) stop(id);
      for (const id of [...seen.keys()]) if (!ids.has(id)) seen.delete(id);
      for (const t of list) {
        const prev = seen.get(t.id);
        if (prev && prev.version === t.version) continue;
        if (!prev || prev.message !== t.message) announce(t);
        seen.set(t.id, { version: t.version, message: t.message });
        arm(t);
      }
    }
    let layer = 0;
    function raise(dialog) {
      const el = root.value;
      if (!el || typeof el.showPopover !== "function") return;
      const exits = dialog.getAnimations?.().filter(
        (a) => "transitionProperty" in a && Number(a.effect?.getComputedTiming().duration ?? 0) > 1
      ) ?? [];
      if (exits.length === 0) return;
      const token = ++layer;
      try {
        el.popover = "manual";
        el.showPopover();
      } catch {
        el.removeAttribute("popover");
        return;
      }
      void Promise.allSettled(exits.map((a) => a.finished)).then(() => {
        if (token === layer) lower();
      });
    }
    function lower() {
      layer++;
      const el = root.value;
      if (!el?.hasAttribute("popover")) return;
      if (el.matches(":popover-open")) el.hidePopover();
      el.removeAttribute("popover");
    }
    watch(
      host,
      (_, prev) => {
        lower();
        const dialog = prev?.closest("dialog");
        if (dialog && !dialog.open) raise(dialog);
      },
      { flush: "post" }
    );
    onMounted(() => {
      if (++toastState.toasters > 1) warn("BlToaster: mount one toaster per page.");
      mounted.value = true;
      document.addEventListener("visibilitychange", onVisibility);
      watch(visible, sync, { immediate: true, flush: "post" });
    });
    onBeforeUnmount(() => {
      lower();
      toastState.toasters--;
      toastFocus.returnTarget = null;
      scope.stop();
      document.removeEventListener("visibilitychange", onVisibility);
      for (const id of [...timers.keys()]) stop(id);
    });
    return (_ctx, _cache) => {
      return openBlock(), createBlock(Teleport, {
        to: host.value ?? "body",
        disabled: !host.value
      }, [
        createElementVNode("section", mergeProps({
          ref_key: "root",
          ref: root,
          class: "bl-toaster",
          "aria-label": __props.ariaLabel
        }, _ctx.$attrs, {
          onPointerenter: _cache[0] || (_cache[0] = ($event) => onPointer($event, true)),
          onPointerleave: _cache[1] || (_cache[1] = ($event) => onPointer($event, false)),
          onFocusin: onFocusIn,
          onFocusout: onFocusOut
        }), [
          mounted.value ? (openBlock(), createBlock(TransitionGroup, {
            key: 0,
            tag: "ol",
            name: "bl-toast",
            class: "bl-toaster__list",
            onBeforeLeave: pin
          }, {
            default: withCtx(() => [
              (openBlock(true), createElementBlock(
                Fragment,
                null,
                renderList(visible.value, (t) => {
                  return openBlock(), createElementBlock(
                    "li",
                    {
                      key: t.id,
                      ref_for: true,
                      ref: (e) => setItem(t.id, e),
                      class: normalizeClass(["bl-toast", t.tone === "neutral" ? void 0 : `bl-toast--${t.tone}`])
                    },
                    [
                      t.tone !== "neutral" ? (openBlock(), createElementBlock("span", _hoisted_2)) : createCommentVNode("v-if", true),
                      createElementVNode("p", {
                        id: `${unref(uid)}-${t.key}`,
                        class: "bl-toast__message"
                      }, toDisplayString(t.message), 9, _hoisted_3),
                      t.action ? (openBlock(), createBlock(_sfc_main$1, {
                        key: 1,
                        class: "bl-toast__action",
                        variant: "ghost",
                        onClick: ($event) => runAction(t)
                      }, {
                        default: withCtx(() => [
                          createTextVNode(
                            toDisplayString(t.action.label),
                            1
                            /* TEXT */
                          )
                        ]),
                        _: 2
                        /* DYNAMIC */
                      }, 1032, ["onClick"])) : createCommentVNode("v-if", true),
                      createVNode(_sfc_main$1, {
                        class: "bl-toast__dismiss",
                        variant: "ghost",
                        "aria-label": text.value.dismiss,
                        "aria-describedby": `${unref(uid)}-${t.key}`,
                        onClick: ($event) => unref(dismissToast)(t.id)
                      }, {
                        icon: withCtx(() => [..._cache[2] || (_cache[2] = [
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
                      }, 8, ["aria-label", "aria-describedby", "onClick"])
                    ],
                    2
                    /* CLASS */
                  );
                }),
                128
                /* KEYED_FRAGMENT */
              ))
            ]),
            _: 1
            /* STABLE */
          })) : (openBlock(), createElementBlock("ol", _hoisted_4)),
          createCommentVNode(" Not atomic (role status/alert default to atomic): speak only the appended line. "),
          createElementVNode(
            "div",
            {
              ref_key: "status",
              ref: status,
              class: "bl-sr-only",
              role: "status",
              "aria-atomic": "false"
            },
            null,
            512
            /* NEED_PATCH */
          ),
          createElementVNode(
            "div",
            {
              ref_key: "alert",
              ref: alert,
              class: "bl-sr-only",
              role: "alert",
              "aria-atomic": "false"
            },
            null,
            512
            /* NEED_PATCH */
          )
        ], 16, _hoisted_1)
      ], 8, ["to", "disabled"]);
    };
  }
});
export {
  _sfc_main as default
};
