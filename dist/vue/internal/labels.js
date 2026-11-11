function mergeLabels(defaults, partial) {
  const merged = { ...defaults };
  if (partial) {
    for (const key of Object.keys(partial)) {
      const value = partial[key];
      if (value !== void 0) merged[key] = value;
    }
  }
  return merged;
}
export {
  mergeLabels
};
