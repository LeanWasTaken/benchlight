import BlPagination_default from "./BlPagination.vue.js";
import { useTableFit } from "../internal/useTableFit.js";
import { warn } from "../internal/dev.js";
import { linkBindings, resolveTag } from "../internal/link.js";
import { clampPage, columnValue, computeTotals, formatCell, nextSort, pageSlice, sortRows } from "../internal/table.js";
import { useClampedPage } from "../internal/pageClamp.js";
import { mergeLabels } from "../internal/labels.js";
import { Fragment, computed, createBlock, createCommentVNode, createElementBlock, createElementVNode, createTextVNode, defineComponent, mergeModels, mergeProps, normalizeClass, normalizeStyle, openBlock, ref, renderList, renderSlot, resolveDynamicComponent, toDisplayString, unref, useAttrs, useId, useModel, useSlots, withCtx } from "vue";
// vue/components/BlTable.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1 = ["data-fit", "data-stacked"];
var _hoisted_2 = {
	key: 0,
	class: "bl-table__sort-strip"
};
var _hoisted_3 = { class: "bl-table__sort-strip-label" };
var _hoisted_4 = ["data-dir", "onClick"];
var _hoisted_5 = {
	key: 0,
	class: "bl-sr-only"
};
var _hoisted_6 = [
	"tabindex",
	"role",
	"aria-labelledby"
];
var _hoisted_7 = ["id"];
var _hoisted_8 = { role: "rowgroup" };
var _hoisted_9 = { role: "row" };
var _hoisted_10 = ["aria-sort"];
var _hoisted_11 = { role: "rowgroup" };
var _hoisted_12 = {
	key: 0,
	role: "row"
};
var _hoisted_13 = ["colspan"];
var _hoisted_14 = ["data-action"];
var _hoisted_15 = ["onClick"];
var _hoisted_16 = ["data-label"];
var _hoisted_17 = {
	class: "bl-table__label",
	"aria-hidden": "true"
};
var _hoisted_18 = {
	key: 0,
	role: "rowgroup"
};
var _hoisted_19 = {
	role: "row",
	class: "bl-table__total"
};
var _hoisted_20 = {
	key: 0,
	role: "rowheader",
	scope: "row",
	class: "bl-table__primary"
};
var _hoisted_21 = ["data-label", "data-empty"];
var _hoisted_22 = {
	class: "bl-table__label",
	"aria-hidden": "true"
};
var INTERACTIVE = "a, button, input, select, textarea, label, [tabindex], [contenteditable]";
var BlTable_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ defineComponent({
	inheritAttrs: false,
	__name: "BlTable",
	props: /*@__PURE__*/ mergeModels({
		caption: {},
		captionHidden: { type: Boolean },
		columns: {},
		rows: {},
		rowKey: { type: [String, Function] },
		scroll: { type: Boolean },
		compact: { type: Boolean },
		pageSize: {},
		manual: { type: Boolean },
		totalRows: {},
		totals: {},
		rowLink: { type: Function },
		onRowActivate: { type: Function },
		locale: {},
		labels: {},
		paginationLabels: {}
	}, {
		"sort": { default: null },
		"sortModifiers": {},
		"page": { default: 1 },
		"pageModifiers": {}
	}),
	emits: ["update:sort", "update:page"],
	setup(__props) {
		const props = __props;
		const sort = useModel(__props, "sort");
		const page = useModel(__props, "page");
		const attrs = useAttrs();
		const TABLE_ATTRS = /* @__PURE__ */ new Set([
			"aria-label",
			"aria-labelledby",
			"aria-describedby",
			"aria-description",
			"aria-details",
			"aria-roledescription",
			"aria-rowcount",
			"aria-colcount"
		]);
		function tableAttrs() {
			return Object.fromEntries(Object.entries(attrs).filter(([key]) => TABLE_ATTRS.has(key)));
		}
		function wrapperAttrs() {
			return Object.fromEntries(Object.entries(attrs).filter(([key]) => !TABLE_ATTRS.has(key)));
		}
		const root = ref(null);
		const table = ref(null);
		const scroller = ref(null);
		const captionId = useId();
		const text = computed(() => mergeLabels({
			total: "Total",
			empty: "No data",
			sortStrip: "Sort by",
			sortAscending: "ascending",
			sortDescending: "descending",
			pages: (title) => `${title}, pages`
		}, props.labels));
		const primaryKey = computed(() => (props.columns.find((c) => c.primary) ?? props.columns[0])?.key);
		const sortable = computed(() => props.columns.filter((c) => c.sortable));
		const sortedRows = computed(() => props.manual ? props.rows.slice() : sortRows(props.rows, props.columns, sort.value, props.locale));
		const totalCount = computed(() => props.manual ? props.totalRows ?? props.rows.length : props.rows.length);
		const currentPage = computed({
			get: () => props.pageSize ? clampPage(page.value, totalCount.value, props.pageSize) : 1,
			set: (value) => {
				page.value = value;
			}
		});
		useClampedPage(page, () => totalCount.value, () => props.pageSize ?? 0);
		const visibleRows = computed(() => props.pageSize && !props.manual ? pageSlice(sortedRows.value, currentPage.value, props.pageSize) : sortedRows.value);
		const fit = useTableFit(root, table, scroller, {
			enabled: () => !props.scroll,
			deps: () => [
				props.rows,
				props.rows.length,
				props.columns,
				visibleRows.value.length,
				currentPage.value,
				props.scroll
			]
		});
		const slots = useSlots();
		const hasAction = computed(() => !!props.rowLink || !!props.onRowActivate);
		if (props.rowLink && props.onRowActivate) warn("BlTable: rowLink and @row-activate are both set; rowLink wins.");
		if (!props.rowKey && (sortable.value.length || hasAction.value)) warn("BlTable: set rowKey so rows keep identity when sorted or paged.");
		if (props.manual && props.pageSize && props.totalRows === void 0) warn("BlTable: manual paging needs totalRows.");
		function linkFor(row) {
			const link = props.rowLink(row);
			const tag = resolveTag(link.as, link.to, link.href, "a");
			return {
				tag,
				bind: linkBindings(tag, link.to, link.href)
			};
		}
		function forward(event) {
			if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
			const target = event.target;
			const row = event.currentTarget;
			const hit = target?.closest(INTERACTIVE);
			if (hit && row.contains(hit)) return;
			if (window.getSelection()?.toString()) return;
			row.querySelector(".bl-table__action")?.click();
		}
		const totalsMap = computed(() => props.manual ? Object.fromEntries(Object.entries(props.totals ?? {}).map(([k, v]) => [k, String(v)])) : computeTotals(props.rows, props.columns));
		const hasFooter = computed(() => !!slots["footer"] || (props.manual ? !!props.totals && Object.keys(props.totals).length > 0 : props.columns.some((c) => c.total)));
		function hasTotal(key) {
			const value = totalsMap.value[key];
			return value !== void 0 && value !== "";
		}
		function totalLabel(key) {
			const value = totalsMap.value[key];
			return value === void 0 || value === "" ? text.value.total : `${text.value.total} · ${value}`;
		}
		function toggleSort(key) {
			sort.value = nextSort(sort.value, key);
			if (props.pageSize) page.value = 1;
		}
		function ariaSort(key) {
			if (sort.value?.key !== key) return void 0;
			return sort.value.dir === "asc" ? "ascending" : "descending";
		}
		function keyOf(row, index) {
			if (typeof props.rowKey === "function") return props.rowKey(row);
			if (props.rowKey) return String(row[props.rowKey]);
			return index;
		}
		function cellClass(column) {
			const align = column.align ?? (column.numeric ? "end" : "start");
			return {
				"bl-table__num": !!column.numeric,
				"bl-table__end": align === "end",
				"bl-table__center": align === "center"
			};
		}
		function minStyle(column) {
			return column.width ? { "--bl-table-col-min": column.width } : void 0;
		}
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock("div", mergeProps({
				ref_key: "root",
				ref: root
			}, wrapperAttrs(), {
				class: ["bl-table", {
					"bl-table--compact": __props.compact,
					"bl-table--scroll": __props.scroll
				}],
				"data-fit": unref(fit).fitted.value ? "" : void 0,
				"data-stacked": unref(fit).stacked.value ? "" : void 0
			}), [
				unref(fit).stacked.value && sortable.value.length ? (openBlock(), createElementBlock("div", _hoisted_2, [createElementVNode("span", _hoisted_3, toDisplayString(text.value.sortStrip), 1), (openBlock(true), createElementBlock(Fragment, null, renderList(sortable.value, (column) => {
					return openBlock(), createElementBlock("button", {
						key: column.key,
						type: "button",
						class: "bl-table__sort",
						"data-dir": sort.value?.key === column.key ? sort.value.dir : void 0,
						onClick: ($event) => toggleSort(column.key)
					}, [
						createTextVNode(toDisplayString(column.label), 1),
						sort.value?.key === column.key ? (openBlock(), createElementBlock("span", _hoisted_5, ", " + toDisplayString(sort.value.dir === "asc" ? text.value.sortAscending : text.value.sortDescending), 1)) : createCommentVNode("v-if", true),
						_cache[2] || (_cache[2] = createElementVNode("svg", {
							class: "bl-table__sort-icon",
							viewBox: "0 0 12 12",
							"aria-hidden": "true"
						}, [createElementVNode("path", {
							d: "M3 7.5 6 4.5l3 3",
							fill: "none",
							stroke: "currentColor",
							"stroke-width": "1.5"
						})], -1))
					], 8, _hoisted_4);
				}), 128))])) : createCommentVNode("v-if", true),
				createElementVNode("div", {
					ref_key: "scroller",
					ref: scroller,
					class: "bl-table__scroller",
					tabindex: __props.scroll && unref(fit).overflowing.value ? 0 : void 0,
					role: __props.scroll && unref(fit).overflowing.value ? "region" : void 0,
					"aria-labelledby": __props.scroll && unref(fit).overflowing.value ? unref(captionId) : void 0
				}, [createElementVNode("table", mergeProps({
					ref_key: "table",
					ref: table,
					role: "table",
					class: "bl-table__table"
				}, tableAttrs()), [
					createElementVNode("caption", {
						id: unref(captionId),
						class: normalizeClass({ "bl-sr-only": __props.captionHidden })
					}, [renderSlot(_ctx.$slots, "caption", {}, () => [createTextVNode(toDisplayString(__props.caption), 1)])], 10, _hoisted_7),
					createElementVNode("thead", _hoisted_8, [createElementVNode("tr", _hoisted_9, [(openBlock(true), createElementBlock(Fragment, null, renderList(__props.columns, (column) => {
						return openBlock(), createElementBlock("th", {
							key: column.key,
							role: "columnheader",
							scope: "col",
							class: normalizeClass(cellClass(column)),
							style: normalizeStyle(column.width ? { width: column.width } : void 0),
							"aria-sort": ariaSort(column.key)
						}, [column.sortable ? (openBlock(), createBlock(resolveDynamicComponent(unref(fit).stacked.value ? "span" : "button"), {
							key: 0,
							type: unref(fit).stacked.value ? void 0 : "button",
							class: "bl-table__sort",
							onClick: ($event) => unref(fit).stacked.value ? void 0 : toggleSort(column.key)
						}, {
							default: withCtx(() => [renderSlot(_ctx.$slots, `head-${column.key}`, { column }, () => [createTextVNode(toDisplayString(column.label), 1)]), _cache[3] || (_cache[3] = createElementVNode("svg", {
								class: "bl-table__sort-icon",
								viewBox: "0 0 12 12",
								"aria-hidden": "true"
							}, [createElementVNode("path", {
								d: "M3 7.5 6 4.5l3 3",
								fill: "none",
								stroke: "currentColor",
								"stroke-width": "1.5"
							})], -1))]),
							_: 2
						}, 1032, ["type", "onClick"])) : renderSlot(_ctx.$slots, `head-${column.key}`, { column }, () => [createTextVNode(toDisplayString(column.label), 1)], void 0, 1)], 14, _hoisted_10);
					}), 128))])]),
					createElementVNode("tbody", _hoisted_11, [!visibleRows.value.length ? (openBlock(), createElementBlock("tr", _hoisted_12, [createElementVNode("td", {
						role: "cell",
						class: "bl-table__empty",
						colspan: __props.columns.length
					}, [renderSlot(_ctx.$slots, "empty", {}, () => [createTextVNode(toDisplayString(text.value.empty), 1)])], 8, _hoisted_13)])) : createCommentVNode("v-if", true), (openBlock(true), createElementBlock(Fragment, null, renderList(visibleRows.value, (row, index) => {
						return openBlock(), createElementBlock("tr", {
							key: keyOf(row, index),
							role: "row",
							"data-action": hasAction.value ? "" : void 0,
							onClick: _cache[0] || (_cache[0] = ($event) => hasAction.value ? forward($event) : void 0)
						}, [(openBlock(true), createElementBlock(Fragment, null, renderList(__props.columns, (column) => {
							return openBlock(), createElementBlock(Fragment, { key: column.key }, [column.key === primaryKey.value ? (openBlock(), createElementBlock("th", {
								key: 0,
								role: "rowheader",
								scope: "row",
								class: normalizeClass(["bl-table__primary", cellClass(column)]),
								style: normalizeStyle(minStyle(column))
							}, [__props.rowLink ? (openBlock(true), createElementBlock(Fragment, { key: 0 }, renderList([linkFor(row)], (link, linkIndex) => {
								return openBlock(), createBlock(resolveDynamicComponent(link.tag), mergeProps({ key: linkIndex }, { ref_for: true }, link.bind, { class: "bl-table__action" }), {
									default: withCtx(() => [renderSlot(_ctx.$slots, `cell-${column.key}`, {
										row,
										value: unref(columnValue)(row, column),
										column
									}, () => [createTextVNode(toDisplayString(unref(formatCell)(row, column)), 1)])]),
									_: 2
								}, 1040);
							}), 128)) : __props.onRowActivate ? (openBlock(), createElementBlock("button", {
								key: 1,
								type: "button",
								class: "bl-table__action",
								onClick: ($event) => __props.onRowActivate(row)
							}, [renderSlot(_ctx.$slots, `cell-${column.key}`, {
								row,
								value: unref(columnValue)(row, column),
								column
							}, () => [createTextVNode(toDisplayString(unref(formatCell)(row, column)), 1)])], 8, _hoisted_15)) : renderSlot(_ctx.$slots, `cell-${column.key}`, {
								row,
								value: unref(columnValue)(row, column),
								column
							}, () => [createTextVNode(toDisplayString(unref(formatCell)(row, column)), 1)], void 0, 2)], 6)) : (openBlock(), createElementBlock("td", {
								key: 1,
								role: "cell",
								class: normalizeClass(cellClass(column)),
								style: normalizeStyle(minStyle(column)),
								"data-label": column.label
							}, [createElementVNode("span", _hoisted_17, toDisplayString(column.label), 1), renderSlot(_ctx.$slots, `cell-${column.key}`, {
								row,
								value: unref(columnValue)(row, column),
								column
							}, () => [createTextVNode(toDisplayString(unref(formatCell)(row, column)), 1)])], 14, _hoisted_16))], 64);
						}), 128))], 8, _hoisted_14);
					}), 128))]),
					hasFooter.value && visibleRows.value.length ? (openBlock(), createElementBlock("tfoot", _hoisted_18, [createElementVNode("tr", _hoisted_19, [renderSlot(_ctx.$slots, "footer", { rows: sortedRows.value }, () => [(openBlock(true), createElementBlock(Fragment, null, renderList(__props.columns, (column) => {
						return openBlock(), createElementBlock(Fragment, { key: column.key }, [column.key === primaryKey.value ? (openBlock(), createElementBlock("th", _hoisted_20, toDisplayString(totalLabel(column.key)), 1)) : (openBlock(), createElementBlock("td", {
							key: 1,
							role: "cell",
							class: normalizeClass(cellClass(column)),
							"data-label": column.label,
							"data-empty": hasTotal(column.key) ? void 0 : ""
						}, [createElementVNode("span", _hoisted_22, toDisplayString(column.label), 1), createTextVNode(" " + toDisplayString(totalsMap.value[column.key] ?? ""), 1)], 10, _hoisted_21))], 64);
					}), 128))])])])) : createCommentVNode("v-if", true)
				], 16)], 8, _hoisted_6),
				__props.pageSize ? (openBlock(), createBlock(BlPagination_default, {
					key: 1,
					page: currentPage.value,
					"onUpdate:page": _cache[1] || (_cache[1] = ($event) => currentPage.value = $event),
					total: totalCount.value,
					"page-size": __props.pageSize,
					"aria-label": text.value.pages(__props.caption),
					labels: __props.paginationLabels
				}, null, 8, [
					"page",
					"total",
					"page-size",
					"aria-label",
					"labels"
				])) : createCommentVNode("v-if", true)
			], 16, _hoisted_1);
		};
	}
});
export { BlTable_vue_vue_type_script_setup_true_lang_default as default };
