import { defineComponent, unref, openBlock, createElementBlock, normalizeStyle, normalizeClass, toDisplayString, createCommentVNode, createElementVNode, normalizeProps, guardReactiveProps, mergeProps } from "vue";
import { useMeterBar } from "../internal/meterBar.js";
const _hoisted_1 = {
  key: 0,
  class: "bl-meter-field__head"
};
const _hoisted_2 = ["id"];
const _hoisted_3 = {
  key: 1,
  class: "bl-meter-field__value",
  "aria-hidden": "true"
};
const _sfc_main = /* @__PURE__ */ defineComponent({
  ...{ inheritAttrs: false },
  __name: "BlProgress",
  props: {
    value: {},
    label: {},
    ariaLabel: {},
    valueText: {},
    showValue: { type: Boolean }
  },
  setup(__props) {
    const props = __props;
    const { attrs, labelId, indeterminate, fraction, visibleValue, wrapped, barAttrs } = useMeterBar(
      props,
      "progressbar",
      "BlProgress"
    );
    return (_ctx, _cache) => {
      return unref(wrapped) ? (openBlock(), createElementBlock(
        "div",
        {
          key: 0,
          class: normalizeClass(["bl-meter-field", unref(attrs).class]),
          style: normalizeStyle(unref(attrs).style)
        },
        [
          __props.label || unref(visibleValue) !== void 0 ? (openBlock(), createElementBlock("div", _hoisted_1, [
            __props.label ? (openBlock(), createElementBlock("span", {
              key: 0,
              id: unref(labelId),
              class: "bl-meter-field__label"
            }, toDisplayString(__props.label), 9, _hoisted_2)) : createCommentVNode("v-if", true),
            unref(visibleValue) !== void 0 ? (openBlock(), createElementBlock(
              "span",
              _hoisted_3,
              toDisplayString(unref(visibleValue)),
              1
              /* TEXT */
            )) : createCommentVNode("v-if", true)
          ])) : createCommentVNode("v-if", true),
          createElementVNode(
            "div",
            normalizeProps(guardReactiveProps(unref(barAttrs)())),
            [
              createElementVNode(
                "div",
                {
                  class: "bl-meter__fill",
                  style: normalizeStyle(unref(indeterminate) ? void 0 : { "--bl-meter-value": unref(fraction) })
                },
                null,
                4
                /* STYLE */
              )
            ],
            16
            /* FULL_PROPS */
          )
        ],
        6
        /* CLASS, STYLE */
      )) : (openBlock(), createElementBlock(
        "div",
        mergeProps({
          key: 1,
          class: unref(attrs).class,
          style: unref(attrs).style
        }, unref(barAttrs)()),
        [
          createElementVNode(
            "div",
            {
              class: "bl-meter__fill",
              style: normalizeStyle(unref(indeterminate) ? void 0 : { "--bl-meter-value": unref(fraction) })
            },
            null,
            4
            /* STYLE */
          )
        ],
        16
        /* FULL_PROPS */
      ));
    };
  }
});
export {
  _sfc_main as default
};
