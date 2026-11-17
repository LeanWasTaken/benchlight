import { defineComponent, useModel, inject, useAttrs, ref, onMounted, openBlock, createElementBlock, normalizeStyle, unref, normalizeClass, withDirectives, createElementVNode, mergeProps, Fragment, renderList, toDisplayString, vModelSelect, mergeModels } from "vue";
import { FIELD_CONTEXT } from "../types.js";
import { mergeDescribedBy } from "../internal/describedBy.js";
import { controlId } from "../internal/fieldId.js";
import { useFormReset } from "../internal/useFormReset.js";
const _hoisted_1 = ["disabled"];
const _hoisted_2 = ["value"];
const _sfc_main = /* @__PURE__ */ defineComponent({
  ...{ inheritAttrs: false },
  __name: "BlSelect",
  props: /* @__PURE__ */ mergeModels({
    options: {},
    disabled: { type: Boolean }
  }, {
    "modelValue": {},
    "modelModifiers": {}
  }),
  emits: ["update:modelValue"],
  setup(__props) {
    const props = __props;
    const model = useModel(__props, "modelValue");
    const field = inject(FIELD_CONTEXT, null);
    const attrs = useAttrs();
    const el = ref();
    let initial;
    onMounted(() => initial = model.value);
    useFormReset(
      el,
      () => {
        const index = el.value?.selectedIndex ?? -1;
        if (index < 0) return;
        const value = props.options[index]?.value;
        if (value !== void 0 && value !== model.value) model.value = value;
      },
      () => {
        if (!el.value) return;
        for (const [i, option] of [...el.value.options].entries())
          option.toggleAttribute("selected", props.options[i]?.value === initial);
      }
    );
    function selectAttrs() {
      const rest = {
        "aria-invalid": field?.invalid?.value === true ? "true" : void 0,
        ...attrs
      };
      delete rest.class;
      delete rest.style;
      return {
        ...rest,
        id: controlId("BlSelect", field, attrs["id"]),
        "aria-describedby": mergeDescribedBy(field?.describedBy.value, attrs["aria-describedby"])
      };
    }
    return (_ctx, _cache) => {
      return openBlock(), createElementBlock(
        "span",
        {
          class: normalizeClass(["bl-select-wrap", unref(attrs).class]),
          style: normalizeStyle(unref(attrs).style)
        },
        [
          withDirectives(createElementVNode("select", mergeProps({
            ref_key: "el",
            ref: el,
            "onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => model.value = $event),
            class: "bl-select",
            disabled: __props.disabled
          }, selectAttrs()), [
            (openBlock(true), createElementBlock(
              Fragment,
              null,
              renderList(__props.options, (option) => {
                return openBlock(), createElementBlock("option", {
                  key: String(option.value),
                  value: option.value
                }, toDisplayString(option.label), 9, _hoisted_2);
              }),
              128
              /* KEYED_FRAGMENT */
            ))
          ], 16, _hoisted_1), [
            [vModelSelect, model.value]
          ])
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
