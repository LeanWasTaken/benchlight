// vue/internal/table.ts
function isEmpty(value) {
	return value === null || value === void 0 || value === "" || typeof value === "number" && Number.isNaN(value);
}
var loose = (column) => column;
/** A cell's value: `value(row)` for a derived column, `row[key]` for a key column, none for a slot-only one. */
function columnValue(row, column) {
	const c = loose(column);
	if (c.slot) return void 0;
	if (c.value) return c.value(row);
	return row[c.key];
}
function formatCell(row, column) {
	const c = loose(column);
	if (c.slot) return "";
	const value = columnValue(row, column);
	if (c.format) return c.format(value, row);
	return isEmpty(value) ? "" : String(value);
}
function sortValue(row, column) {
	const c = loose(column);
	const raw = c.sortBy ? c.sortBy(row) : columnValue(row, column);
	if (raw instanceof Date) {
		const time = raw.getTime();
		return Number.isNaN(time) ? null : time;
	}
	if (c.numeric && !isEmpty(raw) && typeof raw !== "number") {
		const n = Number(raw);
		return Number.isNaN(n) ? null : n;
	}
	return raw;
}
function sortRows(rows, columns, sort, locale) {
	const column = sort && columns.find((c) => c.key === sort.key);
	if (!sort || !column || loose(column).slot) return rows.slice();
	const collator = new Intl.Collator(locale ?? "en", {
		numeric: true,
		sensitivity: "base"
	});
	const dir = sort.dir === "desc" ? -1 : 1;
	return rows.map((row, index) => ({
		row,
		index,
		value: sortValue(row, column)
	})).sort((a, b) => {
		const ae = isEmpty(a.value);
		const be = isEmpty(b.value);
		if (ae || be) return ae && be ? a.index - b.index : ae ? 1 : -1;
		const c = typeof a.value === "number" && typeof b.value === "number" ? a.value < b.value ? -1 : a.value > b.value ? 1 : 0 : collator.compare(String(a.value), String(b.value));
		return c !== 0 ? c * dir : a.index - b.index;
	}).map((entry) => entry.row);
}
function nextSort(current, key) {
	if (!current || current.key !== key) return {
		key,
		dir: "asc"
	};
	return current.dir === "asc" ? {
		key,
		dir: "desc"
	} : null;
}
function normSize(pageSize) {
	return Number.isFinite(pageSize) && pageSize >= 1 ? Math.floor(pageSize) : 1;
}
function normTotal(total) {
	return Number.isFinite(total) && total > 0 ? Math.floor(total) : 0;
}
function pageCount(total, pageSize) {
	const size = normSize(pageSize);
	const t = normTotal(total);
	return Math.max(1, Math.ceil(t / size));
}
function clampPage(page, total, pageSize) {
	return Math.min(Math.max(1, Number.isFinite(page) ? Math.trunc(page) : 1), pageCount(total, pageSize));
}
function pageSlice(rows, page, pageSize) {
	const size = normSize(pageSize);
	const start = (page - 1) * size;
	return rows.slice(start, start + size);
}
function pageRange(page, pages, siblings = 1) {
	const shown = /* @__PURE__ */ new Set([1, pages]);
	for (let p = page - siblings; p <= page + siblings; p++) if (p >= 1 && p <= pages) shown.add(p);
	const sorted = [...shown].sort((a, b) => a - b);
	const out = [];
	sorted.forEach((p, i) => {
		const prev = sorted[i - 1];
		if (prev !== void 0 && p - prev === 2) out.push(prev + 1);
		else if (prev !== void 0 && p - prev > 2) out.push("gap");
		out.push(p);
	});
	return out;
}
function computeTotals(rows, columns) {
	const out = {};
	const all = rows.slice();
	for (const column of columns) {
		const c = loose(column);
		const total = c.total;
		if (!total || c.slot) continue;
		const render = (value) => c.formatTotal ? c.formatTotal(value, all) : String(value);
		if (typeof total === "function") {
			out[c.key] = render(total(all));
			continue;
		}
		const values = rows.map((row) => columnValue(row, column)).filter((v) => !isEmpty(v));
		if (total === "count") {
			out[c.key] = render(values.length);
			continue;
		}
		const nums = values.map((v) => typeof v === "number" ? v : Number(v)).filter((n) => !Number.isNaN(n));
		if (total === "avg" && nums.length === 0) {
			out[c.key] = "";
			continue;
		}
		const sum = nums.reduce((a, b) => a + b, 0);
		out[c.key] = render(total === "sum" ? sum : sum / nums.length);
	}
	return out;
}
export { clampPage, columnValue, computeTotals, formatCell, isEmpty, nextSort, normSize, pageCount, pageRange, pageSlice, sortRows };
