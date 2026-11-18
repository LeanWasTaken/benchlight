import { useFollowScroll } from "../composables/useFollowScroll.js";
import { ansiToSegments } from "../utils/ansi.js";
import { Fragment, computed, createElementBlock, createTextVNode, defineComponent, mergeProps, nextTick, openBlock, ref, renderList, toDisplayString, watch } from "vue";
// vue/components/BlLog.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1 = ["aria-label"];
var BlLog_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ defineComponent({
	__name: "BlLog",
	props: {
		lines: {},
		follow: {
			type: Boolean,
			default: true
		},
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
			}, [(openBlock(true), createElementBlock(Fragment, null, renderList(parsed.value, (segments, row) => {
				return openBlock(), createElementBlock(Fragment, { key: __props.offset + row }, [(openBlock(true), createElementBlock(Fragment, null, renderList(segments, (segment, index) => {
					return openBlock(), createElementBlock("span", mergeProps({ key: index }, { ref_for: true }, segment.className ? { class: segment.className } : {}), toDisplayString(segment.text), 17);
				}), 128)), createTextVNode(toDisplayString(row < parsed.value.length - 1 ? "\n" : ""), 1)], 64);
			}), 128))], 8, _hoisted_1);
		};
	}
});
export { BlLog_vue_vue_type_script_setup_true_lang_default as default };
