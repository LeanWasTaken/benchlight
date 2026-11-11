import { defineComponent, openBlock, createElementBlock, createElementVNode, renderSlot, Fragment, renderList, toDisplayString } from "vue";
const _hoisted_1 = { class: "bl-colophon" };
const _hoisted_2 = { class: "bl-col bl-colophon__inner" };
const _hoisted_3 = { class: "bl-colophon__items" };
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "BlColophon",
  props: {
    items: { default: () => [] }
  },
  setup(__props) {
    return (_ctx, _cache) => {
      return openBlock(), createElementBlock("footer", _hoisted_1, [
        createElementVNode("div", _hoisted_2, [
          createElementVNode("div", _hoisted_3, [
            renderSlot(_ctx.$slots, "default", {}, () => [
              (openBlock(true), createElementBlock(
                Fragment,
                null,
                renderList(__props.items, (item) => {
                  return openBlock(), createElementBlock(
                    "span",
                    { key: item },
                    toDisplayString(item),
                    1
                    /* TEXT */
                  );
                }),
                128
                /* KEYED_FRAGMENT */
              ))
            ])
          ]),
          renderSlot(_ctx.$slots, "actions")
        ])
      ]);
    };
  }
});
export {
  _sfc_main as default
};
