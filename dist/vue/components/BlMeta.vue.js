import { Fragment, computed, createBlock, createElementBlock, defineComponent, normalizeClass, openBlock, renderList, resolveDynamicComponent, toDisplayString, withCtx } from "vue";
// vue/components/BlMeta.vue?vue&type=script&setup=true&lang.ts
var BlMeta_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ defineComponent({
	__name: "BlMeta",
	props: {
		items: {},
		separator: { type: Boolean },
		as: { default: "p" }
	},
	setup(__props) {
		const props = __props;
		const normalized = computed(() => props.items.map((item) => typeof item === "string" ? { text: item } : item));
		return (_ctx, _cache) => {
			return openBlock(), createBlock(resolveDynamicComponent(__props.as), { class: normalizeClass(["bl-meta", { "bl-meta--sep": __props.separator }]) }, {
				default: withCtx(() => [(openBlock(true), createElementBlock(Fragment, null, renderList(normalized.value, (item, index) => {
					return openBlock(), createElementBlock("span", {
						key: index,
						class: normalizeClass(item.class)
					}, toDisplayString(item.text), 3);
				}), 128))]),
				_: 1
			}, 8, ["class"]);
		};
	}
});
export { BlMeta_vue_vue_type_script_setup_true_lang_default as default };
