// vue/internal/dev.ts
var isDev = typeof process !== "undefined" ? process.env.NODE_ENV !== "production" : false;
function warn(message) {
	if (isDev) console.warn(`[benchlight] ${message}`);
}
var warned = /* @__PURE__ */ new Set();
function warnOnce(message) {
	if (!isDev || warned.has(message)) return;
	warned.add(message);
	warn(message);
}
export { isDev, warn, warnOnce };
