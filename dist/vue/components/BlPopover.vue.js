import { panelAnchorStyle, triggerAnchorStyle } from "../internal/anchor.js";
import { warn } from "../internal/dev.js";
import { Fragment, computed, createElementBlock, createElementVNode, defineComponent, mergeModels, mergeProps, onActivated, onBeforeUnmount, onDeactivated, onMounted, openBlock, ref, renderSlot, unref, useId, useModel, watch } from "vue";
// vue/components/BlPopover.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1 = [
	"data-side",
	"data-align",
	"role",
	"aria-label"
];
var BlPopover_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ defineComponent({
	inheritAttrs: false,
	__name: "BlPopover",
	props: /*@__PURE__*/ mergeModels({
		side: { default: "bottom" },
		align: { default: "center" },
		ariaLabel: {}
	}, {
		"open": {
			type: Boolean,
			default: false
		},
		"openModifiers": {}
	}),
	emits: ["update:open"],
	setup(__props) {
		const open = useModel(__props, "open");
		const uid = useId();
		const panelId = `${uid}-popover`;
		const panel = ref();
		const suspended = ref(false);
		const bind = computed(() => ({
			id: `${uid}-trigger`,
			type: "button",
			"aria-expanded": open.value && !suspended.value ? "true" : "false",
			"aria-controls": panelId,
			popovertarget: panelId,
			style: triggerAnchorStyle(uid)
		}));
		let shown = false;
		let clicking = false;
		function onBeforeToggle(event) {
			const next = event.newState === "open";
			shown = next;
			if (suspended.value) return;
			if (open.value !== next) open.value = next;
		}
		function sync() {
			const el = panel.value;
			if (!el || clicking || suspended.value || typeof el.showPopover !== "function") return;
			const want = open.value;
			if (want === shown) return;
			try {
				if (want) el.showPopover();
				else el.hidePopover();
				shown = want;
			} catch {}
		}
		watch(open, sync, { flush: "post" });
		function onClickCapture(event) {
			if ((event.target?.closest?.("[popovertarget]"))?.getAttribute("popovertarget") !== panelId) return;
			clicking = true;
			setTimeout(() => {
				clicking = false;
				sync();
			});
		}
		onMounted(() => {
			const el = panel.value;
			el.ownerDocument.addEventListener("click", onClickCapture, true);
			const trigger = el.parentNode?.querySelector(`[aria-controls="${panelId}"]`);
			if (!trigger) warn("BlPopover: the trigger slot rendered no element with `bind`; spread it on a <button>.");
			else if (!(trigger instanceof HTMLButtonElement || trigger instanceof HTMLInputElement && trigger.type === "button")) warn(`BlPopover: the trigger is a <${trigger.localName}>; popovertarget only works on a <button>.`);
			sync();
		});
		onDeactivated(() => {
			clicking = false;
			suspended.value = true;
			if (!shown) return;
			shown = false;
			try {
				panel.value?.hidePopover();
			} catch {}
		});
		onActivated(() => {
			suspended.value = false;
			sync();
		});
		onBeforeUnmount(() => {
			panel.value?.ownerDocument.removeEventListener("click", onClickCapture, true);
		});
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock(Fragment, null, [renderSlot(_ctx.$slots, "trigger", { bind: bind.value }), createElementVNode("div", mergeProps(_ctx.$attrs, {
				id: panelId,
				ref_key: "panel",
				ref: panel,
				class: "bl-popover",
				popover: "auto",
				"data-side": __props.side,
				"data-align": __props.align,
				role: __props.ariaLabel ? "group" : void 0,
				"aria-label": __props.ariaLabel || void 0,
				style: unref(panelAnchorStyle)(unref(uid)),
				onBeforetoggle: onBeforeToggle
			}), [renderSlot(_ctx.$slots, "default")], 16, _hoisted_1)], 64);
		};
	}
});
export { BlPopover_vue_vue_type_script_setup_true_lang_default as default };
