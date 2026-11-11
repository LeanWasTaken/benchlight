import { defineComponent, useModel, useSlots, ref, onMounted, openBlock, createElementBlock, createElementVNode, renderSlot, createTextVNode, toDisplayString, mergeModels } from "vue";
import { warn } from "../internal/dev.js";
const _hoisted_1 = ["name", "open"];
const _hoisted_2 = { class: "bl-disclosure__summary" };
const _hoisted_3 = { class: "bl-disclosure__title" };
const _hoisted_4 = { class: "bl-disclosure__body" };
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "BlDisclosure",
  props: /* @__PURE__ */ mergeModels({
    summary: {},
    name: {}
  }, {
    "open": { type: Boolean, ...{ default: false } },
    "openModifiers": {}
  }),
  emits: ["update:open"],
  setup(__props) {
    const props = __props;
    const open = useModel(__props, "open");
    const slots = useSlots();
    const el = ref();
    function onToggle() {
      const next = el.value?.open ?? false;
      if (next !== open.value) open.value = next;
    }
    onMounted(() => {
      if (!props.summary && !slots["summary"])
        warn("BlDisclosure: pass a summary prop or a summary slot.");
    });
    return (_ctx, _cache) => {
      return openBlock(), createElementBlock("details", {
        ref_key: "el",
        ref: el,
        class: "bl-disclosure",
        name: __props.name,
        open: open.value,
        onToggle
      }, [
        createElementVNode("summary", _hoisted_2, [
          createElementVNode("span", _hoisted_3, [
            renderSlot(_ctx.$slots, "summary", {}, () => [
              createTextVNode(
                toDisplayString(__props.summary),
                1
                /* TEXT */
              )
            ])
          ]),
          _cache[0] || (_cache[0] = createElementVNode(
            "span",
            {
              class: "bl-disclosure__chevron",
              "aria-hidden": "true"
            },
            null,
            -1
            /* CACHED */
          ))
        ]),
        createElementVNode("div", _hoisted_4, [
          renderSlot(_ctx.$slots, "default")
        ])
      ], 40, _hoisted_1);
    };
  }
});
export {
  _sfc_main as default
};
