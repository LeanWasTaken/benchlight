import { defineComponent, useAttrs, useId, ref, inject, onMounted, onBeforeUnmount, openBlock, createElementBlock, normalizeStyle, unref, normalizeClass, createElementVNode, mergeProps, toDisplayString, createCommentVNode } from "vue";
import { mergeDescribedBy } from "../internal/describedBy.js";
import { warnOnce } from "../internal/dev.js";
import { RADIO_GROUP_CONTEXT } from "../internal/radioGroup.js";
const _hoisted_1 = { class: "bl-radio__control" };
const _hoisted_2 = { class: "bl-radio__label" };
const _hoisted_3 = ["id"];
const _sfc_main = /* @__PURE__ */ defineComponent({
  ...{ inheritAttrs: false },
  __name: "BlRadio",
  props: {
    label: {},
    value: {},
    hint: {},
    disabled: { type: Boolean }
  },
  setup(__props) {
    const props = __props;
    const attrs = useAttrs();
    const hintId = useId();
    const input = ref();
    const group = inject(RADIO_GROUP_CONTEXT, null);
    if (!group) {
      warnOnce(
        "BlRadio: must be used inside a BlRadioGroup, which owns its name and model. It renders a plain radio from its attrs."
      );
    }
    function inputAttrs() {
      const rest = { ...attrs };
      delete rest["class"];
      delete rest["style"];
      delete rest["modelValue"];
      delete rest["onUpdate:modelValue"];
      const own = {
        value: props.value,
        "aria-describedby": mergeDescribedBy(
          props.hint ? hintId : void 0,
          rest["aria-describedby"]
        )
      };
      if (!group) return { ...rest, disabled: props.disabled || void 0, ...own };
      return {
        ...rest,
        ...own,
        name: group.name.value,
        checked: group.model.value === props.value,
        disabled: props.disabled || group.disabled.value || void 0,
        required: group.required.value || rest["required"]
      };
    }
    function onChange(event) {
      if (group && event.target.checked) group.model.value = props.value;
    }
    let unregister;
    onMounted(() => {
      if (group && input.value) unregister = group.register(input.value, () => props.value);
    });
    onBeforeUnmount(() => unregister?.());
    return (_ctx, _cache) => {
      return openBlock(), createElementBlock(
        "div",
        {
          class: normalizeClass(["bl-radio", unref(attrs).class]),
          style: normalizeStyle(unref(attrs).style)
        },
        [
          createElementVNode("label", _hoisted_1, [
            createElementVNode(
              "input",
              mergeProps({
                ref_key: "input",
                ref: input,
                class: "bl-radio__input",
                type: "radio"
              }, inputAttrs(), { onChange }),
              null,
              16
              /* FULL_PROPS */
            ),
            _cache[0] || (_cache[0] = createElementVNode(
              "span",
              {
                class: "bl-radio__dot",
                "aria-hidden": "true"
              },
              null,
              -1
              /* CACHED */
            )),
            createElementVNode(
              "span",
              _hoisted_2,
              toDisplayString(__props.label),
              1
              /* TEXT */
            )
          ]),
          __props.hint ? (openBlock(), createElementBlock("span", {
            key: 0,
            id: unref(hintId),
            class: "bl-radio__hint"
          }, toDisplayString(__props.hint), 9, _hoisted_3)) : createCommentVNode("v-if", true)
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
