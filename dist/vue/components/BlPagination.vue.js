import { warn } from "../internal/dev.js";
import { mergeLabels } from "../internal/labels.js";
import { useClampedPage } from "../internal/pageClamp.js";
import { clampPage, normSize, pageCount, pageRange } from "../internal/table.js";
import { Fragment, computed, createCommentVNode, createElementBlock, createElementVNode, defineComponent, mergeModels, openBlock, ref, renderList, toDisplayString, useModel, watch } from "vue";
// vue/components/BlPagination.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1 = ["aria-label"];
var _hoisted_2 = { class: "bl-pagination__list" };
var _hoisted_3 = ["aria-disabled"];
var _hoisted_4 = {
	key: 0,
	class: "bl-pagination__gap",
	"aria-hidden": "true"
};
var _hoisted_5 = [
	"aria-label",
	"aria-current",
	"onClick"
];
var _hoisted_6 = { class: "bl-pagination__compact" };
var _hoisted_7 = ["aria-disabled"];
var _hoisted_8 = { class: "bl-pagination__range" };
var _hoisted_9 = {
	class: "bl-sr-only",
	"aria-live": "polite"
};
/** Page navigation. Renders nothing when there is a single page. See README. */
var BlPagination_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ defineComponent({
	__name: "BlPagination",
	props: /*@__PURE__*/ mergeModels({
		total: {},
		pageSize: {},
		ariaLabel: {},
		siblings: { default: 1 },
		labels: {}
	}, {
		"page": { default: 1 },
		"pageModifiers": {}
	}),
	emits: ["update:page"],
	setup(__props) {
		const props = __props;
		const page = useModel(__props, "page");
		const text = computed(() => mergeLabels({
			prev: "Previous",
			next: "Next",
			page: (n) => `Page ${n}`,
			pageOf: (p, of) => `Page ${p} of ${of}`,
			range: (from, to, total) => `${from}–${to} of ${total}`
		}, props.labels));
		watch(() => props.ariaLabel, (name) => {
			if (name === void 0) warn("BlPagination: set `ariaLabel` (`aria-label`) to name the navigation.");
		}, { immediate: true });
		const pages = computed(() => pageCount(props.total, props.pageSize));
		const current = computed(() => clampPage(page.value, props.total, props.pageSize));
		const items = computed(() => pageRange(current.value, pages.value, props.siblings));
		const rangeText = computed(() => {
			const size = normSize(props.pageSize);
			const from = (current.value - 1) * size + 1;
			const to = Math.min(props.total, current.value * size);
			return text.value.range(from, to, props.total);
		});
		useClampedPage(page, () => props.total, () => props.pageSize);
		const announcement = ref("");
		watch(current, () => {
			announcement.value = rangeText.value;
		});
		function go(target) {
			const next = clampPage(target, props.total, props.pageSize);
			if (next === current.value) return;
			page.value = next;
		}
		return (_ctx, _cache) => {
			return pages.value > 1 ? (openBlock(), createElementBlock("nav", {
				key: 0,
				class: "bl-pagination",
				"aria-label": __props.ariaLabel
			}, [
				createElementVNode("ul", _hoisted_2, [
					createElementVNode("li", null, [createElementVNode("button", {
						type: "button",
						class: "bl-pagination__prev",
						"aria-disabled": current.value <= 1 ? "true" : void 0,
						onClick: _cache[0] || (_cache[0] = ($event) => go(current.value - 1))
					}, toDisplayString(text.value.prev), 9, _hoisted_3)]),
					(openBlock(true), createElementBlock(Fragment, null, renderList(items.value, (item, index) => {
						return openBlock(), createElementBlock("li", {
							key: item === "gap" ? `gap-${index}` : item,
							class: "bl-pagination__item"
						}, [item === "gap" ? (openBlock(), createElementBlock("span", _hoisted_4, "…")) : (openBlock(), createElementBlock("button", {
							key: 1,
							type: "button",
							class: "bl-pagination__page",
							"aria-label": text.value.page(item),
							"aria-current": item === current.value ? "page" : void 0,
							onClick: ($event) => go(item)
						}, toDisplayString(item), 9, _hoisted_5))]);
					}), 128)),
					createElementVNode("li", _hoisted_6, toDisplayString(text.value.pageOf(current.value, pages.value)), 1),
					createElementVNode("li", null, [createElementVNode("button", {
						type: "button",
						class: "bl-pagination__next",
						"aria-disabled": current.value >= pages.value ? "true" : void 0,
						onClick: _cache[1] || (_cache[1] = ($event) => go(current.value + 1))
					}, toDisplayString(text.value.next), 9, _hoisted_7)])
				]),
				createElementVNode("p", _hoisted_8, toDisplayString(rangeText.value), 1),
				createElementVNode("p", _hoisted_9, toDisplayString(announcement.value), 1)
			], 8, _hoisted_1)) : createCommentVNode("v-if", true);
		};
	}
});
export { BlPagination_vue_vue_type_script_setup_true_lang_default as default };
