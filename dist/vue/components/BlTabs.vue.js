import { warn } from "../internal/dev.js";
import { Fragment, computed, createElementBlock, createElementVNode, defineComponent, mergeModels, onMounted, onUpdated, openBlock, ref, renderList, renderSlot, toDisplayString, useId, useModel, useSlots, watch } from "vue";
// vue/components/BlTabs.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1 = ["aria-label"];
var _hoisted_2 = [
	"id",
	"aria-selected",
	"aria-controls",
	"tabindex",
	"disabled",
	"onClick"
];
var _hoisted_3 = [
	"id",
	"aria-labelledby",
	"tabindex",
	"hidden"
];
/**
* Tabs (WAI-ARIA tabs pattern). One dynamic slot `panel-<value>` per item; every panel renders
* and the inactive ones are `hidden`. See README.
*/
var BlTabs_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ defineComponent({
	__name: "BlTabs",
	props: /*@__PURE__*/ mergeModels({
		items: {},
		ariaLabel: {},
		activation: { default: "auto" }
	}, {
		"modelValue": {},
		"modelModifiers": {}
	}),
	emits: ["update:modelValue"],
	setup(__props) {
		const props = __props;
		const model = useModel(__props, "modelValue");
		const slots = useSlots();
		const uid = useId();
		const tabId = (i) => `${uid}-tab-${i}`;
		const panelId = (i) => `${uid}-panel-${i}`;
		const keyOf = (item, i) => `${i}:${typeof item.value}:${item.value}`;
		const root = ref();
		const list = ref();
		const current = computed(() => {
			const value = model.value;
			if (props.items.some((item) => item.value === value && !item.disabled)) return value;
			return props.items.find((item) => !item.disabled)?.value;
		});
		function select(item) {
			if (!item.disabled) model.value = item.value;
		}
		watch(() => props.ariaLabel, (name) => {
			if (name === void 0) warn("BlTabs: set `ariaLabel` (`aria-label`) to name the tablist.");
		}, { immediate: true });
		watch(() => props.items, (items) => {
			const seen = /* @__PURE__ */ new Set();
			for (const item of items) {
				if (seen.has(item.value)) warn(`BlTabs: duplicate value "${item.value}" in items.`);
				seen.add(item.value);
				if (!slots[`panel-${item.value}`]) warn(`BlTabs: item "${item.value}" has no \`panel-${item.value}\` slot.`);
			}
		}, { immediate: true });
		function isRtl(el) {
			const dir = el.closest("[dir]")?.getAttribute("dir")?.toLowerCase();
			if (dir === "rtl" || dir === "ltr") return dir === "rtl";
			return getComputedStyle(el).direction === "rtl";
		}
		function onKeydown(event) {
			if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
			const el = list.value;
			if (!el) return;
			const buttons = [...el.children];
			const from = buttons.indexOf(event.target);
			if (from < 0) return;
			if (event.key === "Enter" || event.key === " ") {
				event.preventDefault();
				select(props.items[from]);
				return;
			}
			const enabled = props.items.flatMap((item, i) => item.disabled ? [] : [i]);
			if (enabled.length === 0) return;
			let to;
			if (event.key === "Home") to = enabled[0];
			else if (event.key === "End") to = enabled.at(-1);
			else if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
				const forward = event.key === "ArrowRight" !== isRtl(el);
				const n = props.items.length;
				for (let step = 1; step <= n; step++) {
					const i = (from + (forward ? step : -step) + n) % n;
					if (!props.items[i].disabled) {
						to = i;
						break;
					}
				}
			}
			if (to === void 0) return;
			event.preventDefault();
			buttons[to]?.focus();
			if (props.activation === "auto") select(props.items[to]);
		}
		const FOCUSABLE = [
			"a[href]",
			"area[href]",
			"button:not([disabled])",
			"input:not([disabled]):not([type=\"hidden\"])",
			"select:not([disabled])",
			"textarea:not([disabled])",
			"iframe",
			"audio[controls]",
			"video[controls]",
			"summary",
			"[contenteditable]:not([contenteditable=\"false\"])",
			"[tabindex]:not([tabindex=\"-1\"])"
		].join(",");
		const plain = ref([]);
		function measure() {
			const next = [...root.value?.children ?? []].slice(1).map((panel) => !panel.querySelector(FOCUSABLE));
			if (next.length !== plain.value.length || next.some((v, i) => v !== plain.value[i])) plain.value = next;
		}
		onMounted(measure);
		onUpdated(measure);
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock("div", {
				ref_key: "root",
				ref: root,
				class: "bl-tabs"
			}, [createElementVNode("div", {
				ref_key: "list",
				ref: list,
				class: "bl-tabs__list",
				role: "tablist",
				"aria-label": __props.ariaLabel,
				onKeydown
			}, [(openBlock(true), createElementBlock(Fragment, null, renderList(__props.items, (item, i) => {
				return openBlock(), createElementBlock("button", {
					id: tabId(i),
					key: keyOf(item, i),
					type: "button",
					role: "tab",
					class: "bl-tabs__tab",
					"aria-selected": item.value === current.value ? "true" : "false",
					"aria-controls": panelId(i),
					tabindex: item.value === current.value ? 0 : -1,
					disabled: item.disabled || void 0,
					onClick: ($event) => select(item)
				}, toDisplayString(item.label), 9, _hoisted_2);
			}), 128))], 40, _hoisted_1), (openBlock(true), createElementBlock(Fragment, null, renderList(__props.items, (item, i) => {
				return openBlock(), createElementBlock("div", {
					id: panelId(i),
					key: keyOf(item, i),
					class: "bl-tabs__panel",
					role: "tabpanel",
					"aria-labelledby": tabId(i),
					tabindex: plain.value[i] ? 0 : void 0,
					hidden: item.value !== current.value
				}, [renderSlot(_ctx.$slots, `panel-${item.value}`)], 8, _hoisted_3);
			}), 128))], 512);
		};
	}
});
export { BlTabs_vue_vue_type_script_setup_true_lang_default as default };
