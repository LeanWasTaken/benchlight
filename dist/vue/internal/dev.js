const isDev = typeof process !== "undefined" && process.env.NODE_ENV !== "production";
function warn(message) {
  if (isDev) console.warn(`[benchlight] ${message}`);
}
const warned = /* @__PURE__ */ new Set();
function warnOnce(message) {
  if (!isDev || warned.has(message)) return;
  warned.add(message);
  warn(message);
}
export {
  isDev,
  warn,
  warnOnce
};
