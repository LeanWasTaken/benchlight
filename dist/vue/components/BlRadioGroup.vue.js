import { defineComponent, useModel, useAttrs, useId, ref, computed, provide, onMounted, openBlock, createElementBlock, mergeProps, createElementVNode, toDisplayString, unref, createCommentVNode, renderSlot, mergeModels } from "vue";
import { mergeDescribedBy } from "../internal/describedBy.js";
import { useFormReset } from "../internal/useFormReset.js";
import { RADIO_GROUP_CONTEXT } from "../internal/radioGroup.js";
const _hoisted_1 = { class: "bl-fieldset__legend" };
const _hoisted_2 = ["id"];
const _hoisted_3 = ["id", "role"];
const _sfc_main = /* @__PURE__ */ defineComponent({
  ...{ inheritAttrs: false },
  __name: "BlRadioGroup",
  props: /* @__PURE__ */ mergeModels({
    legend: {},
    hint: {},
    error: {},
    announce: { type: Boolean },
    disabled: { type: Boolean },
    required: { type: Boolean },
    name: {}
  }, {
    "modelValue": { type: [String, Number] },
    "modelModifiers": {}
  }),
  emits: ["update:modelValue"],
  setup(__props) {
    const props = __props;
    const model = useModel(__props, "modelValue");
    const attrs = useAttrs();
    const generatedName = useId();
    const hintId = useId();
    const errorId = useId();
    const root = ref();
    const invalid = computed(() => Boolean(props.error));
    function fieldsetAttrs() {
      return {
        ...invalid.value ? { "aria-invalid": "true" } : {},
        ...props.required ? { "aria-required": "true" } : {},
        ...attrs,
        "aria-describedby": mergeDescribedBy(
          props.hint ? hintId : void 0,
          invalid.value ? errorId : void 0,
          attrs["aria-describedby"]
        )
      };
    }
    const radios = /* @__PURE__ */ new Map();
    let mounted = false;
    let initial;
    function syncDefaults() {
      for (const [input, value] of radios) input.defaultChecked = value() === initial;
    }
    provide(RADIO_GROUP_CONTEXT, {
      name: computed(() => props.name || generatedName),
      model,
      disabled: computed(() => props.disabled),
      required: computed(() => props.required),
      get form() {
        return attrs["form"];
      },
      register(input, value) {
        radios.set(input, value);
        if (mounted) input.defaultChecked = value() === initial;
        return () => radios.delete(input);
      }
    });
    useFormReset(
      root,
      () => {
        let checked;
        for (const [input, value] of radios) if (input.checked) checked = value();
        model.value = checked;
      },
      syncDefaults
    );
    onMounted(() => {
      mounted = true;
      initial = model.value;
      syncDefaults();
    });
    return (_ctx, _cache) => {
      return openBlock(), createElementBlock(
        "fieldset",
        mergeProps({
          ref_key: "root",
          ref: root,
          class: ["bl-fieldset bl-radio-group", { "bl-fieldset--invalid": invalid.value }]
        }, fieldsetAttrs(), { role: "radiogroup" }),
        [
          createElementVNode(
            "legend",
            _hoisted_1,
            toDisplayString(__props.legend),
            1
            /* TEXT */
          ),
          __props.hint ? (openBlock(), createElementBlock("p", {
            key: 0,
            id: unref(hintId),
            class: "bl-fieldset__hint"
          }, toDisplayString(__props.hint), 9, _hoisted_2)) : createCommentVNode("v-if", true),
          invalid.value ? (openBlock(), createElementBlock("p", {
            key: 1,
            id: unref(errorId),
            class: "bl-fieldset__error",
            role: __props.announce ? "alert" : void 0
          }, toDisplayString(__props.error), 9, _hoisted_3)) : createCommentVNode("v-if", true),
          renderSlot(_ctx.$slots, "default")
        ],
        16
        /* FULL_PROPS */
      );
    };
  }
});
export {
  _sfc_main as default
};
