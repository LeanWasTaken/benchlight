import { defineComponent, useAttrs, useModel, useId, computed, ref, onMounted, onBeforeUnmount, openBlock, createElementBlock, normalizeClass, Fragment, renderList, createElementVNode, createTextVNode, toDisplayString, mergeModels } from "vue";
import { warnOnce } from "../internal/dev.js";
const _hoisted_1 = ["aria-label"];
const _hoisted_2 = ["name", "value", "checked", "disabled", "onChange"];
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "BlSegmented",
  props: /* @__PURE__ */ mergeModels({
    options: {},
    ariaLabel: {},
    compact: { type: Boolean },
    name: {}
  }, {
    "modelValue": {},
    "modelModifiers": {}
  }),
  emits: ["update:modelValue"],
  setup(__props) {
    const props = __props;
    const attrs = useAttrs();
    if (!props.ariaLabel && !attrs["aria-labelledby"])
      warnOnce("BlSegmented: set `ariaLabel` (`aria-label`) to name the group.");
    const model = useModel(__props, "modelValue");
    const generatedName = useId();
    const groupName = computed(() => props.name || generatedName);
    const root = ref();
    let form = null;
    let initial;
    function inputs() {
      return [...root.value?.querySelectorAll("input") ?? []];
    }
    function onReset() {
      inputs().forEach((input, i) => {
        input.defaultChecked = props.options[i]?.value === initial;
      });
      setTimeout(() => {
        const index = inputs().findIndex((input) => input.checked);
        model.value = props.options[index]?.value;
      }, 0);
    }
    onMounted(() => {
      initial = model.value;
      form = root.value?.closest("form") ?? null;
      form?.addEventListener("reset", onReset);
    });
    onBeforeUnmount(() => form?.removeEventListener("reset", onReset));
    return (_ctx, _cache) => {
      return openBlock(), createElementBlock("div", {
        ref_key: "root",
        ref: root,
        class: normalizeClass(["bl-segmented", { "bl-segmented--compact": __props.compact }]),
        role: "radiogroup",
        "aria-label": __props.ariaLabel
      }, [
        (openBlock(true), createElementBlock(
          Fragment,
          null,
          renderList(__props.options, (option) => {
            return openBlock(), createElementBlock("label", {
              key: String(option.value),
              class: "bl-segmented__item"
            }, [
              createElementVNode("input", {
                type: "radio",
                name: groupName.value,
                value: String(option.value),
                checked: option.value === model.value,
                disabled: option.disabled || void 0,
                onChange: ($event) => model.value = option.value
              }, null, 40, _hoisted_2),
              createTextVNode(
                " " + toDisplayString(option.label),
                1
                /* TEXT */
              )
            ]);
          }),
          128
          /* KEYED_FRAGMENT */
        ))
      ], 10, _hoisted_1);
    };
  }
});
export {
  _sfc_main as default
};
