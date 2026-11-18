import BlSpecRow_default from "./BlSpecRow.vue.js";
import { Fragment, createBlock, createCommentVNode, createElementBlock, defineComponent, openBlock, renderList, renderSlot } from "vue";
// vue/components/BlSpecPanel.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1 = { class: "bl-spec-panel" };
var BlSpecPanel_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ defineComponent({
	__name: "BlSpecPanel",
	props: { rows: { default: () => [] } },
	setup(__props) {
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock("dl", _hoisted_1, [renderSlot(_ctx.$slots, "default", {}, () => [createCommentVNode(" `!`: an undefined optional prop resolves as absent; `| undefined` in BlSpecRow's\n           props would change its compiled runtime prop types. "), (openBlock(true), createElementBlock(Fragment, null, renderList(__props.rows, (row, index) => {
				return openBlock(), createBlock(BlSpecRow_default, {
					key: index,
					label: row.label,
					value: row.value,
					as: row.as,
					to: row.to,
					href: row.href,
					external: row.external
				}, null, 8, [
					"label",
					"value",
					"as",
					"to",
					"href",
					"external"
				]);
			}), 128))])]);
		};
	}
});
export { BlSpecPanel_vue_vue_type_script_setup_true_lang_default as default };
