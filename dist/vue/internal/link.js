import { warnOnce } from "./dev.js";
function resolveTag(as, to, href, fallback) {
  return as ?? (href || to ? "a" : fallback);
}
function linkBindings(as, to, href) {
  if (typeof as === "string") {
    if (as === "a") {
      if (href === void 0 && to !== void 0 && typeof to !== "string") {
        warnOnce("an object `to` needs a router component in `as`; this <a> renders without href.");
      }
      return { href: href ?? (typeof to === "string" ? to : void 0) };
    }
    if (to !== void 0 || href !== void 0) {
      warnOnce(`<${as}> is not a link, so its \`to\`/\`href\` are ignored.`);
    }
    return {};
  }
  if (to === void 0 && href !== void 0) {
    warnOnce("a router component in `as` expects `to`; it received `href` instead.");
  }
  return to !== void 0 ? { to } : { href };
}
function currentValue(current) {
  return current === true ? "page" : current || void 0;
}
export {
  currentValue,
  linkBindings,
  resolveTag
};
