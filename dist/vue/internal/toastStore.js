import { reactive } from "vue";
const toastState = reactive({ items: [], cleared: 0, toasters: 0 });
let counter = 0;
let keys = 0;
const MAX_DELAY = 2 ** 31 - 1;
function normDuration(value) {
  return Number.isFinite(value) && value > 0 ? Math.min(value, MAX_DELAY) : 0;
}
function addToast(input) {
  if (typeof window === "undefined") return "";
  const o = typeof input === "string" ? { message: input } : input;
  const record = {
    id: o.id ?? `bl-toast-${++counter}`,
    key: ++keys,
    message: o.message,
    tone: o.tone ?? "neutral",
    action: o.action,
    duration: normDuration(o.duration ?? (o.action ? 0 : 5e3)),
    version: 0
  };
  const i = toastState.items.findIndex((t) => t.id === record.id);
  if (i >= 0) {
    record.version = toastState.items[i].version + 1;
    record.key = toastState.items[i].key;
    toastState.items.splice(i, 1, record);
  } else toastState.items.push(record);
  return record.id;
}
function dismissToast(id) {
  const i = toastState.items.findIndex((t) => t.id === id);
  if (i >= 0) toastState.items.splice(i, 1);
}
function clearToasts() {
  toastState.items.splice(0);
  toastState.cleared++;
}
export {
  addToast,
  clearToasts,
  dismissToast,
  normDuration,
  toastState
};
