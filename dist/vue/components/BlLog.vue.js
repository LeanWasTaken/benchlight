import { defineComponent, ref, computed, watch, nextTick, openBlock, createElementBlock, Fragment, renderList, mergeProps, toDisplayString, createTextVNode } from "vue";
import { useFollowScroll } from "../composables/useFollowScroll.js";
import { ansiToSegments } from "../utils/ansi.js";
const _hoisted_1 = ["aria-label"];
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "BlLog",
  props: {
    lines: {},
    follow: { type: Boolean, default: true },
    ariaLabel: { default: "Log" },
    offset: { default: 0 }
  },
  setup(__props) {
    const props = __props;
    const element = ref(null);
    const parsed = computed(() => props.lines.map(ansiToSegments));
    const { toBottom } = useFollowScroll(element, { enabled: () => props.follow });
    watch([() => props.lines, () => props.lines.length], async () => {
      await nextTick();
      toBottom();
    });
    return (_ctx, _cache) => {
      return openBlock(), createElementBlock("pre", {
        ref_key: "element",
        ref: element,
        class: "bl-log",
        role: "log",
        tabindex: "0",
        "aria-label": __props.ariaLabel
      }, [
        (openBlock(true), createElementBlock(
          Fragment,
          null,
          renderList(parsed.value, (segments, row) => {
            return openBlock(), createElementBlock(
              Fragment,
              {
                key: __props.offset + row
              },
              [
                (openBlock(true), createElementBlock(
                  Fragment,
                  null,
                  renderList(segments, (segment, index) => {
                    return openBlock(), createElementBlock(
                      "span",
                      mergeProps({ key: index }, { ref_for: true }, segment.className ? { class: segment.className } : {}),
                      toDisplayString(segment.text),
                      17
                      /* TEXT, FULL_PROPS */
                    );
                  }),
                  128
                  /* KEYED_FRAGMENT */
                )),
                createTextVNode(
                  toDisplayString(row < parsed.value.length - 1 ? "\n" : ""),
                  1
                  /* TEXT */
                )
              ],
              64
              /* STABLE_FRAGMENT */
            );
          }),
          128
          /* KEYED_FRAGMENT */
        ))
      ], 8, _hoisted_1);
    };
  }
});
export {
  _sfc_main as default
};
