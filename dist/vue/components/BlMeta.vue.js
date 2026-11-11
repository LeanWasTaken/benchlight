import { defineComponent, computed, openBlock, createBlock, resolveDynamicComponent, normalizeClass, withCtx, createElementBlock, Fragment, renderList, toDisplayString } from "vue";
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "BlMeta",
  props: {
    items: {},
    separator: { type: Boolean },
    as: { default: "p" }
  },
  setup(__props) {
    const props = __props;
    const normalized = computed(
      () => props.items.map((item) => typeof item === "string" ? { text: item } : item)
    );
    return (_ctx, _cache) => {
      return openBlock(), createBlock(resolveDynamicComponent(__props.as), {
        class: normalizeClass(["bl-meta", { "bl-meta--sep": __props.separator }])
      }, {
        default: withCtx(() => [
          (openBlock(true), createElementBlock(
            Fragment,
            null,
            renderList(normalized.value, (item, index) => {
              return openBlock(), createElementBlock(
                "span",
                {
                  key: index,
                  class: normalizeClass(item.class)
                },
                toDisplayString(item.text),
                3
                /* TEXT, CLASS */
              );
            }),
            128
            /* KEYED_FRAGMENT */
          ))
        ]),
        _: 1
        /* STABLE */
      }, 8, ["class"]);
    };
  }
});
export {
  _sfc_main as default
};
