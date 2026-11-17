import { defineComponent, useAttrs, useModel, ref, inject, computed, onMounted, openBlock, createElementBlock, normalizeStyle, unref, normalizeClass, createElementVNode, mergeProps, toDisplayString, mergeModels } from "vue";
import { FIELD_CONTEXT } from "../types.js";
import { mergeDescribedBy } from "../internal/describedBy.js";
import { controlId } from "../internal/fieldId.js";
import { useFormReset } from "../internal/useFormReset.js";
const _hoisted_1 = ["value", "min", "max", "step", "aria-valuetext", "disabled"];
const _hoisted_2 = {
  class: "bl-range__value",
  "aria-hidden": "true"
};
const _sfc_main = /* @__PURE__ */ defineComponent({
  ...{ inheritAttrs: false },
  __name: "BlRange",
  props: /* @__PURE__ */ mergeModels({
    min: { default: 0 },
    max: { default: 100 },
    step: { default: 1 },
    format: {},
    disabled: { type: Boolean }
  }, {
    "modelValue": {},
    "modelModifiers": {}
  }),
  emits: ["update:modelValue"],
  setup(__props) {
    const props = __props;
    const attrs = useAttrs();
    function inputAttrs() {
      const rest = Object.fromEntries(
        Object.entries(attrs).filter(([key]) => key !== "class" && key !== "style")
      );
      return {
        "aria-invalid": field?.invalid?.value === true ? "true" : void 0,
        ...rest,
        id: controlId("BlRange", field, attrs["id"]),
        "aria-describedby": mergeDescribedBy(field?.describedBy.value, attrs["aria-describedby"])
      };
    }
    const model = useModel(__props, "modelValue");
    const el = ref();
    const field = inject(FIELD_CONTEXT, null);
    const current = computed(() => {
      const { min, max, step } = props;
      const raw = Math.min(max, Math.max(min, model.value ?? min));
      const round = (n) => Number(n.toFixed(10));
      const snapped = round(step > 0 ? min + Math.round((raw - min) / step) * step : raw);
      return snapped > max ? round(snapped - step) : snapped;
    });
    let initial = 0;
    onMounted(() => initial = model.value ?? current.value);
    useFormReset(
      el,
      () => {
        if (!el.value) return;
        const value = Number(el.value.value);
        if (value !== model.value) model.value = value;
      },
      () => {
        if (el.value) el.value.defaultValue = String(initial);
      }
    );
    const text = computed(() => props.format ? props.format(current.value) : String(current.value));
    return (_ctx, _cache) => {
      return openBlock(), createElementBlock(
        "div",
        {
          class: normalizeClass(["bl-range", unref(attrs).class]),
          style: normalizeStyle(unref(attrs).style)
        },
        [
          createElementVNode("input", mergeProps({
            ref_key: "el",
            ref: el,
            value: current.value,
            class: "bl-range__input",
            type: "range",
            min: __props.min,
            max: __props.max,
            step: __props.step,
            "aria-valuetext": text.value,
            disabled: __props.disabled
          }, inputAttrs(), {
            onInput: _cache[0] || (_cache[0] = ($event) => model.value = Number($event.target.value))
          }), null, 16, _hoisted_1),
          createElementVNode(
            "span",
            _hoisted_2,
            toDisplayString(text.value),
            1
            /* TEXT */
          )
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
