import { useAppearance } from "../composables/useAppearance.js";
import { mergeLabels } from "../internal/labels.js";
import { Fragment, computed, createElementBlock, createElementVNode, createTextVNode, defineComponent, isRef, onMounted, openBlock, ref, renderList, toDisplayString, unref, useId, vModelRadio, withDirectives } from "vue";
// vue/components/BlAppearanceSwitch.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1 = ["data-ready"];
var _hoisted_2 = { class: "bl-sr-only" };
var _hoisted_3 = { class: "bl-appearance__track" };
var _hoisted_4 = ["value", "aria-label"];
var BlAppearanceSwitch_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ defineComponent({
	__name: "BlAppearanceSwitch",
	props: { labels: {} },
	setup(__props) {
		const props = __props;
		const { mode } = useAppearance();
		const ready = ref(false);
		onMounted(() => {
			ready.value = true;
		});
		const groupName = `bl-appearance-${useId()}`;
		const text = computed(() => mergeLabels({
			legend: "Appearance",
			auto: "Auto",
			light: "Light",
			dark: "Dark"
		}, props.labels));
		const marks = computed(() => mergeLabels({
			auto: "A",
			light: "L",
			dark: "D"
		}, props.labels?.marks));
		const MODES = [
			"auto",
			"light",
			"dark"
		];
		const options = computed(() => MODES.map((value) => ({
			value,
			label: text.value[value],
			mark: marks.value[value]
		})));
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock("fieldset", {
				class: "bl-appearance",
				"data-ready": ready.value ? "" : void 0
			}, [createElementVNode("legend", _hoisted_2, toDisplayString(text.value.legend), 1), createElementVNode("div", _hoisted_3, [(openBlock(true), createElementBlock(Fragment, null, renderList(options.value, (option) => {
				return openBlock(), createElementBlock("label", {
					key: option.value,
					class: "bl-appearance__option"
				}, [withDirectives(createElementVNode("input", {
					"onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => isRef(mode) ? mode.value = $event : null),
					type: "radio",
					name: groupName,
					value: option.value,
					"aria-label": option.label
				}, null, 8, _hoisted_4), [[vModelRadio, unref(mode)]]), createTextVNode(" " + toDisplayString(option.mark), 1)]);
			}), 128))])], 8, _hoisted_1);
		};
	}
});
export { BlAppearanceSwitch_vue_vue_type_script_setup_true_lang_default as default };
