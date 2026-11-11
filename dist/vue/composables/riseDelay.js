function riseDelay(index, { base = 0, step = 60, cap } = {}) {
  const n = Math.max(0, cap === void 0 ? index : Math.min(index, cap));
  return { "--bl-rise-delay": `${base + n * step}ms` };
}
export {
  riseDelay
};
