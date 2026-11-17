import { defineComponent, useModel, inject, useAttrs, ref, onMounted, withDirectives, openBlock, createElementBlock, mergeProps, vModelText, mergeModels } from "vue";
import { FIELD_CONTEXT } from "../types.js";
import { mergeDescribedBy } from "../internal/describedBy.js";
import { controlId } from "../internal/fieldId.js";
import { useFormReset } from "../internal/useFormReset.js";
const _hoisted_1 = ["rows", "disabled"];
const _sfc_main = /* @__PURE__ */ defineComponent({
  ...{ inheritAttrs: false },
  __name: "BlTextarea",
  props: /* @__PURE__ */ mergeModels({
    rows: { default: 4 },
    disabled: { type: Boolean }
  }, {
    "modelValue": { default: "" },
    "modelModifiers": {}
  }),
  emits: ["update:modelValue"],
  setup(__props) {
    const model = useModel(__props, "modelValue");
    const field = inject(FIELD_CONTEXT, null);
    const attrs = useAttrs();
    const el = ref();
    let initial = "";
    onMounted(() => initial = model.value);
    useFormReset(
      el,
      () => {
        if (el.value && el.value.value !== model.value) model.value = el.value.value;
      },
      () => {
        if (el.value) el.value.defaultValue = initial;
      }
    );
    function textareaAttrs() {
      return {
        "aria-invalid": field?.invalid?.value === true ? "true" : void 0,
        ...attrs,
        id: controlId("BlTextarea", field, attrs["id"]),
        "aria-describedby": mergeDescribedBy(field?.describedBy.value, attrs["aria-describedby"])
      };
    }
    return (_ctx, _cache) => {
      return withDirectives((openBlock(), createElementBlock("textarea", mergeProps({
        ref_key: "el",
        ref: el,
        "onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => model.value = $event),
        class: "bl-textarea",
        rows: __props.rows,
        disabled: __props.disabled
      }, textareaAttrs()), null, 16, _hoisted_1)), [
        [vModelText, model.value]
      ]);
    };
  }
});
export {
  _sfc_main as default
};
