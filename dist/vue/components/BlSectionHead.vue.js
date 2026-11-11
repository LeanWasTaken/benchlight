import { defineComponent, computed, watchEffect, openBlock, createElementBlock, normalizeClass, Fragment, createBlock, resolveDynamicComponent, withCtx, createTextVNode, toDisplayString, renderSlot, createCommentVNode } from "vue";
import { warnOnce } from "../internal/dev.js";
const _hoisted_1 = {
  key: 0,
  class: "bl-section-head__actions"
};
const _hoisted_2 = {
  key: 0,
  class: "bl-section-head__eyebrow"
};
const _hoisted_3 = {
  key: 1,
  class: "bl-section-head__actions"
};
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "BlSectionHead",
  props: {
    eyebrow: {},
    heading: {},
    level: { default: 2 },
    bar: { type: Boolean },
    ruled: { type: Boolean }
  },
  setup(__props) {
    const props = __props;
    const headingTag = computed(() => `h${props.level}`);
    watchEffect(() => {
      if (!(props.bar ? props.eyebrow : props.heading)) {
        warnOnce(
          props.bar ? "BlSectionHead: `bar` renders the eyebrow as the heading, but `eyebrow` is empty." : "BlSectionHead: `heading` is empty, so the section has no heading."
        );
      }
    });
    return (_ctx, _cache) => {
      return openBlock(), createElementBlock(
        "div",
        {
          class: normalizeClass(["bl-section-head", { "bl-section-head--bar": __props.bar, "bl-section-head--ruled": __props.ruled }])
        },
        [
          __props.bar ? (openBlock(), createElementBlock(
            Fragment,
            { key: 0 },
            [
              (openBlock(), createBlock(resolveDynamicComponent(headingTag.value), { class: "bl-section-head__eyebrow" }, {
                default: withCtx(() => [
                  createTextVNode(
                    toDisplayString(__props.eyebrow),
                    1
                    /* TEXT */
                  )
                ]),
                _: 1
                /* STABLE */
              })),
              _ctx.$slots["actions"] ? (openBlock(), createElementBlock("div", _hoisted_1, [
                renderSlot(_ctx.$slots, "actions")
              ])) : createCommentVNode("v-if", true)
            ],
            64
            /* STABLE_FRAGMENT */
          )) : (openBlock(), createElementBlock(
            Fragment,
            { key: 1 },
            [
              __props.eyebrow ? (openBlock(), createElementBlock(
                "p",
                _hoisted_2,
                toDisplayString(__props.eyebrow),
                1
                /* TEXT */
              )) : createCommentVNode("v-if", true),
              (openBlock(), createBlock(resolveDynamicComponent(headingTag.value), { class: "bl-section-head__heading" }, {
                default: withCtx(() => [
                  createTextVNode(
                    toDisplayString(__props.heading),
                    1
                    /* TEXT */
                  )
                ]),
                _: 1
                /* STABLE */
              })),
              _ctx.$slots["actions"] ? (openBlock(), createElementBlock("div", _hoisted_3, [
                renderSlot(_ctx.$slots, "actions")
              ])) : createCommentVNode("v-if", true)
            ],
            64
            /* STABLE_FRAGMENT */
          ))
        ],
        2
        /* CLASS */
      );
    };
  }
});
export {
  _sfc_main as default
};
