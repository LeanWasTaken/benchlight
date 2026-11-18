import { useMarquee } from "../composables/useMarquee.js";
import { useReducedMotion } from "../composables/useReducedMotion.js";
import { mergeLabels } from "../internal/labels.js";
import { computed, createCommentVNode, createElementBlock, createElementVNode, defineComponent, mergeModels, openBlock, ref, renderSlot, unref, useModel, watch } from "vue";
// vue/components/BlMarquee.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1 = ["data-overflowing", "title"];
var _hoisted_2 = ["aria-pressed", "aria-label"];
var BlMarquee_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ defineComponent({
	__name: "BlMarquee",
	props: /*@__PURE__*/ mergeModels({
		title: {},
		contentKey: {},
		labels: {}
	}, {
		"paused": {
			type: Boolean,
			default: false
		},
		"pausedModifiers": {}
	}),
	emits: ["update:paused"],
	setup(__props, { expose: __expose }) {
		const props = __props;
		const paused = useModel(__props, "paused");
		const container = ref(null);
		const content = ref(null);
		const reduced = useReducedMotion();
		const text = computed(() => mergeLabels({ pause: "Pause scrolling" }, props.labels));
		const { overflowing, refresh } = useMarquee(container, content, { paused: () => paused.value });
		const stoppable = computed(() => overflowing.value && !reduced.value);
		const shownTitle = computed(() => overflowing.value ? props.title : void 0);
		watch(() => props.contentKey, () => refresh(), { flush: "post" });
		__expose({ refresh });
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock("div", {
				class: "bl-marquee",
				"data-overflowing": unref(overflowing) ? "" : void 0,
				title: shownTitle.value
			}, [createElementVNode("div", {
				ref_key: "container",
				ref: container,
				class: "bl-marquee__viewport"
			}, [createElementVNode("div", {
				ref_key: "content",
				ref: content,
				class: "bl-marquee__content"
			}, [renderSlot(_ctx.$slots, "default")], 512)], 512), stoppable.value ? (openBlock(), createElementBlock("button", {
				key: 0,
				type: "button",
				class: "bl-marquee__toggle",
				"aria-pressed": paused.value ? "true" : "false",
				"aria-label": text.value.pause,
				onClick: _cache[0] || (_cache[0] = ($event) => paused.value = !paused.value)
			}, null, 8, _hoisted_2)) : createCommentVNode("v-if", true)], 8, _hoisted_1);
		};
	}
});
export { BlMarquee_vue_vue_type_script_setup_true_lang_default as default };
