import { defineComponent, computed, openBlock, createElementBlock, createBlock, resolveDynamicComponent, mergeProps, unref, withCtx, createElementVNode, createTextVNode, toDisplayString, createCommentVNode } from "vue";
import { linkBindings } from "../internal/link.js";
import { mergeLabels } from "../internal/labels.js";
const _hoisted_1 = ["aria-label"];
const _hoisted_2 = { class: "bl-prev-next__label" };
const _hoisted_3 = { class: "bl-prev-next__title" };
const _hoisted_4 = { key: 1 };
const _hoisted_5 = { class: "bl-prev-next__label" };
const _hoisted_6 = { class: "bl-prev-next__title" };
const _hoisted_7 = { key: 3 };
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "BlPrevNext",
  props: {
    prev: {},
    next: {},
    linkAs: { default: "a" },
    ariaLabel: { default: "Pagination" },
    labels: {}
  },
  setup(__props) {
    const props = __props;
    const text = computed(
      () => mergeLabels({ prev: "Previous", next: "Next" }, props.labels)
    );
    return (_ctx, _cache) => {
      return __props.prev || __props.next ? (openBlock(), createElementBlock("nav", {
        key: 0,
        class: "bl-prev-next",
        "aria-label": __props.ariaLabel
      }, [
        __props.prev ? (openBlock(), createBlock(
          resolveDynamicComponent(__props.linkAs),
          mergeProps({ key: 0 }, unref(linkBindings)(__props.linkAs, __props.prev.to, __props.prev.href), { class: "bl-prev-next__link bl-prev-next__link--prev" }),
          {
            default: withCtx(() => [
              createElementVNode("span", _hoisted_2, [
                _cache[0] || (_cache[0] = createElementVNode(
                  "span",
                  { class: "bl-prev-next__icon" },
                  [
                    createElementVNode("svg", {
                      viewBox: "0 0 12 12",
                      fill: "none",
                      stroke: "currentColor",
                      "stroke-width": "1.5",
                      "stroke-linecap": "round",
                      "stroke-linejoin": "round",
                      "aria-hidden": "true",
                      focusable: "false"
                    }, [
                      createElementVNode("path", { d: "M10 6H2M5.5 2.5 2 6l3.5 3.5" })
                    ])
                  ],
                  -1
                  /* CACHED */
                )),
                createTextVNode(
                  " " + toDisplayString(text.value.prev),
                  1
                  /* TEXT */
                )
              ]),
              createElementVNode(
                "span",
                _hoisted_3,
                toDisplayString(__props.prev.title),
                1
                /* TEXT */
              )
            ]),
            _: 1
            /* STABLE */
          },
          16
          /* FULL_PROPS */
        )) : (openBlock(), createElementBlock("span", _hoisted_4)),
        __props.next ? (openBlock(), createBlock(
          resolveDynamicComponent(__props.linkAs),
          mergeProps({ key: 2 }, unref(linkBindings)(__props.linkAs, __props.next.to, __props.next.href), { class: "bl-prev-next__link bl-prev-next__link--next" }),
          {
            default: withCtx(() => [
              createElementVNode("span", _hoisted_5, [
                createTextVNode(
                  toDisplayString(text.value.next) + " ",
                  1
                  /* TEXT */
                ),
                _cache[1] || (_cache[1] = createElementVNode(
                  "span",
                  { class: "bl-prev-next__icon" },
                  [
                    createElementVNode("svg", {
                      viewBox: "0 0 12 12",
                      fill: "none",
                      stroke: "currentColor",
                      "stroke-width": "1.5",
                      "stroke-linecap": "round",
                      "stroke-linejoin": "round",
                      "aria-hidden": "true",
                      focusable: "false"
                    }, [
                      createElementVNode("path", { d: "M2 6h8M6.5 2.5 10 6 6.5 9.5" })
                    ])
                  ],
                  -1
                  /* CACHED */
                ))
              ]),
              createElementVNode(
                "span",
                _hoisted_6,
                toDisplayString(__props.next.title),
                1
                /* TEXT */
              )
            ]),
            _: 1
            /* STABLE */
          },
          16
          /* FULL_PROPS */
        )) : (openBlock(), createElementBlock("span", _hoisted_7))
      ], 8, _hoisted_1)) : createCommentVNode("v-if", true);
    };
  }
});
export {
  _sfc_main as default
};
