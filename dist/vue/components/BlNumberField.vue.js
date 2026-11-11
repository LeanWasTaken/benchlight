import { defineComponent, useModel, inject, useAttrs, ref, watch, onMounted, withDirectives, openBlock, createElementBlock, mergeProps, mergeModels } from "vue";
import { FIELD_CONTEXT } from "../types.js";
import { mergeDescribedBy } from "../internal/describedBy.js";
import { controlId } from "../internal/fieldId.js";
const _hoisted_1 = ["min", "max", "step", "disabled"];
const _sfc_main = /* @__PURE__ */ defineComponent({
  ...{ inheritAttrs: false },
  __name: "BlNumberField",
  props: /* @__PURE__ */ mergeModels({
    min: {},
    max: {},
    step: {},
    disabled: { type: Boolean }
  }, {
    "modelValue": { default: null },
    "modelModifiers": {}
  }),
  emits: ["update:modelValue"],
  setup(__props) {
    const props = __props;
    const model = useModel(__props, "modelValue");
    const field = inject(FIELD_CONTEXT, null);
    const attrs = useAttrs();
    const input = ref();
    function inputAttrs() {
      return {
        "aria-invalid": field?.invalid?.value === true ? "true" : void 0,
        ...attrs,
        id: controlId("BlNumberField", field, attrs["id"]),
        "aria-describedby": mergeDescribedBy(field?.describedBy.value, attrs["aria-describedby"])
      };
    }
    const show = (value) => typeof value === "number" && Number.isFinite(value) ? String(value) : "";
    const vServerValue = {
      getSSRProps: ({ value }) => ({ value: show(value) })
    };
    function write(value) {
      if (input.value) input.value.value = show(value);
    }
    let typed;
    function onInput() {
      const n = input.value.valueAsNumber;
      const value = Number.isNaN(n) ? null : n;
      typed = { value };
      model.value = value;
    }
    function clamp(n) {
      const { min, max } = props;
      if (min !== void 0 && max !== void 0 && min > max) return n;
      return Math.min(max ?? Infinity, Math.max(min ?? -Infinity, n));
    }
    function onChange() {
      const n = input.value.valueAsNumber;
      const value = Number.isNaN(n) ? null : clamp(n);
      typed = void 0;
      model.value = value;
      write(value);
    }
    function onBlur() {
      typed = void 0;
      if (input.value?.validity.badInput) write(model.value);
    }
    function onWheel(event) {
      const el = event.currentTarget;
      if (document.activeElement === el) el.blur();
    }
    watch(model, (value) => {
      if (typed && Object.is(typed.value, value) && document.activeElement === input.value) return;
      typed = void 0;
      write(value);
    });
    onMounted(() => write(model.value));
    return (_ctx, _cache) => {
      return withDirectives((openBlock(), createElementBlock("input", mergeProps({
        ref_key: "input",
        ref: input,
        class: "bl-input",
        type: "number",
        min: __props.min,
        max: __props.max,
        step: __props.step,
        disabled: __props.disabled
      }, inputAttrs(), {
        onInput,
        onChange,
        onBlur,
        onWheelPassive: onWheel
      }), null, 16, _hoisted_1)), [
        [vServerValue, model.value]
      ]);
    };
  }
});
export {
  _sfc_main as default
};
