import { defineComponent, openBlock, createElementBlock, unref, createElementVNode, renderSlot, createCommentVNode } from "vue";
import { useScrollLifted } from "../composables/useScrollLifted.js";
const _hoisted_1 = ["data-lifted"];
const _hoisted_2 = { class: "bl-col bl-site-bar__inner" };
const _hoisted_3 = ["aria-label"];
const _hoisted_4 = { class: "bl-site-bar__nav" };
const _hoisted_5 = {
  key: 1,
  class: "bl-site-bar__actions"
};
const FADE_CLEARANCE = 16;
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "BlSiteBar",
  props: {
    lift: { type: [Number, Boolean], default: 24 },
    ariaLabel: { default: "Primary" }
  },
  setup(__props) {
    const props = __props;
    const lifted = useScrollLifted(() => props.lift);
    function revealFocused(event) {
      const nav = event.currentTarget;
      const target = event.target;
      if (!(nav instanceof HTMLElement) || !(target instanceof Element)) return;
      if (nav.scrollWidth <= nav.clientWidth) return;
      const box = nav.getBoundingClientRect();
      const link = target.getBoundingClientRect();
      const overLeft = box.left + FADE_CLEARANCE - link.left;
      const overRight = link.right - (box.right - FADE_CLEARANCE);
      let delta = 0;
      if (overLeft > 0) delta = -overLeft;
      else if (overRight > 0) delta = Math.min(overRight, link.left - (box.left + FADE_CLEARANCE));
      if (delta) nav.scrollTo({ left: nav.scrollLeft + delta, behavior: "auto" });
    }
    return (_ctx, _cache) => {
      return openBlock(), createElementBlock("header", {
        class: "bl-site-bar",
        "data-lifted": unref(lifted) ? "" : void 0
      }, [
        createElementVNode("div", _hoisted_2, [
          renderSlot(_ctx.$slots, "brand"),
          _ctx.$slots["nav"] ? (openBlock(), createElementBlock("nav", {
            key: 0,
            class: "bl-site-bar__navwrap",
            "aria-label": __props.ariaLabel,
            onFocusin: revealFocused
          }, [
            createElementVNode("ul", _hoisted_4, [
              renderSlot(_ctx.$slots, "nav")
            ])
          ], 40, _hoisted_3)) : createCommentVNode("v-if", true),
          _ctx.$slots["actions"] ? (openBlock(), createElementBlock("div", _hoisted_5, [
            renderSlot(_ctx.$slots, "actions")
          ])) : createCommentVNode("v-if", true)
        ])
      ], 8, _hoisted_1);
    };
  }
});
export {
  _sfc_main as default
};
