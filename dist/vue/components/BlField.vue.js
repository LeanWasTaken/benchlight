import { defineComponent, useId, computed, provide, openBlock, createElementBlock, normalizeClass, createElementVNode, toDisplayString, renderSlot, createCommentVNode } from "vue";
import { FIELD_CONTEXT } from "../types.js";
import { mergeDescribedBy } from "../internal/describedBy.js";
const _hoisted_1 = ["for"];
const _hoisted_2 = ["id"];
const _hoisted_3 = ["id"];
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "BlField",
  props: {
    label: {},
    hint: {},
    id: {},
    error: {}
  },
  setup(__props) {
    const props = __props;
    const generated = useId();
    const fieldId = computed(() => props.id ?? generated);
    const hintId = computed(() => `${fieldId.value}-hint`);
    const errorId = computed(() => `${fieldId.value}-error`);
    const invalid = computed(() => !!props.error);
    const describedBy = computed(
      () => mergeDescribedBy(
        props.hint ? hintId.value : void 0,
        invalid.value ? errorId.value : void 0
      )
    );
    provide(FIELD_CONTEXT, { id: fieldId, describedBy, invalid });
    return (_ctx, _cache) => {
      return openBlock(), createElementBlock(
        "div",
        {
          class: normalizeClass(["bl-field", { "bl-field--invalid": invalid.value }])
        },
        [
          createElementVNode("label", {
            class: "bl-field__label",
            for: fieldId.value
          }, toDisplayString(__props.label), 9, _hoisted_1),
          renderSlot(_ctx.$slots, "default", {
            id: fieldId.value,
            describedBy: describedBy.value,
            invalid: invalid.value
          }),
          __props.hint ? (openBlock(), createElementBlock("p", {
            key: 0,
            id: hintId.value,
            class: "bl-field__hint"
          }, toDisplayString(__props.hint), 9, _hoisted_2)) : createCommentVNode("v-if", true),
          __props.error ? (openBlock(), createElementBlock("p", {
            key: 1,
            id: errorId.value,
            class: "bl-field__error"
          }, toDisplayString(__props.error), 9, _hoisted_3)) : createCommentVNode("v-if", true)
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
