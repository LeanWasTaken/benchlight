import { defineComponent, useModel, useAttrs, useId, ref, onMounted, onBeforeUnmount, openBlock, createElementBlock, normalizeStyle, unref, normalizeClass, createElementVNode, mergeProps, toDisplayString, createCommentVNode, mergeModels } from "vue";
import { mergeDescribedBy } from "../internal/describedBy.js";
const _hoisted_1 = { class: "bl-toggle__control" };
const _hoisted_2 = ["checked", "disabled", "name", "value"];
const _hoisted_3 = { class: "bl-toggle__label" };
const _hoisted_4 = ["id"];
const _hoisted_5 = ["id"];
const _sfc_main = /* @__PURE__ */ defineComponent({
  ...{ inheritAttrs: false },
  __name: "BlToggle",
  props: /* @__PURE__ */ mergeModels({
    label: {},
    hint: {},
    error: {},
    disabled: { type: Boolean },
    name: {},
    value: {}
  }, {
    "modelValue": { type: Boolean, ...{ default: false } },
    "modelModifiers": {}
  }),
  emits: ["update:modelValue"],
  setup(__props) {
    const props = __props;
    const model = useModel(__props, "modelValue");
    const attrs = useAttrs();
    const hintId = useId();
    const errorId = useId();
    const input = ref();
    function inputAttrs() {
      const rest = { ...attrs };
      delete rest.class;
      delete rest.style;
      return {
        ...props.error ? { "aria-invalid": "true" } : {},
        ...rest,
        "aria-describedby": mergeDescribedBy(
          props.hint ? hintId : void 0,
          props.error ? errorId : void 0,
          rest["aria-describedby"]
        )
      };
    }
    function onChange(event) {
      model.value = event.target.checked;
    }
    let form = null;
    let initial = false;
    function onReset() {
      if (input.value) input.value.defaultChecked = initial;
      setTimeout(() => {
        if (input.value) model.value = input.value.checked;
      }, 0);
    }
    onMounted(() => {
      initial = model.value;
      if (input.value) input.value.defaultChecked = initial;
      form = input.value?.form ?? null;
      form?.addEventListener("reset", onReset);
    });
    onBeforeUnmount(() => form?.removeEventListener("reset", onReset));
    return (_ctx, _cache) => {
      return openBlock(), createElementBlock(
        "div",
        {
          class: normalizeClass(["bl-toggle", unref(attrs).class]),
          style: normalizeStyle(unref(attrs).style)
        },
        [
          createElementVNode("label", _hoisted_1, [
            createElementVNode("input", mergeProps({
              ref_key: "input",
              ref: input,
              class: "bl-toggle__input",
              type: "checkbox",
              role: "switch",
              checked: model.value,
              disabled: __props.disabled,
              name: __props.name,
              value: __props.value
            }, inputAttrs(), { onChange }), null, 16, _hoisted_2),
            _cache[0] || (_cache[0] = createElementVNode(
              "span",
              {
                class: "bl-toggle__track",
                "aria-hidden": "true"
              },
              [
                createElementVNode("span", { class: "bl-toggle__thumb" })
              ],
              -1
              /* CACHED */
            )),
            createElementVNode(
              "span",
              _hoisted_3,
              toDisplayString(__props.label),
              1
              /* TEXT */
            )
          ]),
          __props.hint ? (openBlock(), createElementBlock("span", {
            key: 0,
            id: unref(hintId),
            class: "bl-toggle__hint"
          }, toDisplayString(__props.hint), 9, _hoisted_4)) : createCommentVNode("v-if", true),
          __props.error ? (openBlock(), createElementBlock("span", {
            key: 1,
            id: unref(errorId),
            class: "bl-toggle__error"
          }, toDisplayString(__props.error), 9, _hoisted_5)) : createCommentVNode("v-if", true)
        ],
        6
        /* CLASS, STYLE */
      );
    };
  }
});
export {
  _sfc_main as default
};
