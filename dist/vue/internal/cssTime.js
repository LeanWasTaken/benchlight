function cssTime(raw, fallback) {
  const value = (raw ?? "").trim();
  const n = parseFloat(value);
  if (!Number.isFinite(n)) return fallback;
  if (value.endsWith("ms")) return n;
  if (value.endsWith("s")) return n * 1e3;
  return fallback;
}
export {
  cssTime
};
