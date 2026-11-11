import { defineComponent, useModel, inject, useAttrs, withDirectives, openBlock, createElementBlock, mergeProps, vModelText, mergeModels } from "vue";
import { FIELD_CONTEXT } from "../types.js";
import { mergeDescribedBy } from "../internal/describedBy.js";
import { controlId } from "../internal/fieldId.js";
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
