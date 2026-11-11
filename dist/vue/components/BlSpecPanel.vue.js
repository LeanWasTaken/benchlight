import { defineComponent, openBlock, createElementBlock, renderSlot, createCommentVNode, Fragment, renderList, createBlock } from "vue";
import _sfc_main$1 from "./BlSpecRow.vue.js";
const _hoisted_1 = { class: "bl-spec-panel" };
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "BlSpecPanel",
  props: {
    rows: { default: () => [] }
  },
  setup(__props) {
    return (_ctx, _cache) => {
      return openBlock(), createElementBlock("dl", _hoisted_1, [
        renderSlot(_ctx.$slots, "default", {}, () => [
          createCommentVNode(" `!`: an undefined optional prop resolves as absent; `| undefined` in BlSpecRow's\n           props would change its compiled runtime prop types. "),
          (openBlock(true), createElementBlock(
            Fragment,
            null,
            renderList(__props.rows, (row, index) => {
              return openBlock(), createBlock(_sfc_main$1, {
                key: index,
                label: row.label,
                value: row.value,
                as: row.as,
                to: row.to,
                href: row.href,
                external: row.external
              }, null, 8, ["label", "value", "as", "to", "href", "external"]);
            }),
            128
            /* KEYED_FRAGMENT */
          ))
        ])
      ]);
    };
  }
});
export {
  _sfc_main as default
};
