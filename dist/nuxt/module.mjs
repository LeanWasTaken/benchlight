// nuxt/module.ts
import { addComponent, addImports, createResolver, defineNuxtModule } from "@nuxt/kit";

// dist/vue/components.json
var components_default = [
  "BlAppearanceSwitch",
  "BlButton",
  "BlCheckbox",
  "BlColophon",
  "BlDialog",
  "BlDisclosure",
  "BlEqBars",
  "BlField",
  "BlIndex",
  "BlIndexRow",
  "BlInput",
  "BlLed",
  "BlLinkArrow",
  "BlLog",
  "BlMarquee",
  "BlMedia",
  "BlMeta",
  "BlMeter",
  "BlMsg",
  "BlNumberField",
  "BlPagination",
  "BlPopover",
  "BlPrevNext",
  "BlProgress",
  "BlProse",
  "BlRadio",
  "BlRadioGroup",
  "BlRange",
  "BlReadout",
  "BlSectionHead",
  "BlSegmented",
  "BlSegmentedNav",
  "BlSelect",
  "BlSiteBar",
  "BlSiteBarLink",
  "BlSkipLink",
  "BlSpecPanel",
  "BlSpecRow",
  "BlTabBar",
  "BlTabBarItem",
  "BlTable",
  "BlTabs",
  "BlTelemetry",
  "BlTelemetryCell",
  "BlTextarea",
  "BlToaster",
  "BlToggle",
  "BlTooltip"
];

// js/prepaint-script.mjs
var PREPAINT = "(function(){try{var m=localStorage.getItem('bl-appearance');if(m==='light'||m==='dark')document.documentElement.setAttribute('data-bl-appearance',m)}catch(e){}})()";

// nuxt/module.ts
var AUTO_IMPORTS = [
  "useAppearance",
  "useScrollLifted",
  "useReducedMotion",
  "useMarquee",
  "useFollowScroll",
  "riseDelay",
  "ansiToSegments",
  "useToast"
];
function prefixedName(name, prefix) {
  if (!prefix)
    return name;
  const upper = (text) => text.charAt(0).toUpperCase() + text.slice(1);
  if (/^use[A-Z]/.test(name))
    return `use${upper(prefix)}${name.slice(3)}`;
  return prefix.charAt(0).toLowerCase() + prefix.slice(1) + upper(name);
}
var module_default = defineNuxtModule({
  meta: { name: "benchlight", configKey: "benchlight", compatibility: { nuxt: ">=4.0.0" } },
  defaults: { fonts: true, autoImports: true, prepaint: true },
  setup(options, nuxt) {
    const { resolve } = createResolver(import.meta.url);
    const root = import.meta.url.includes("/dist/nuxt/") ? "../.." : "..";
    const css = [resolve(`${root}/css/index.css`)];
    if (options.fonts)
      css.unshift(resolve(`${root}/css/fonts.css`));
    nuxt.options.css.unshift(...css);
    if (options.prepaint !== false) {
      nuxt.options.app.head.script = [
        { innerHTML: PREPAINT, tagPosition: "head" },
        ...nuxt.options.app.head.script ?? []
      ];
    }
    for (const name of components_default) {
      addComponent({ name, filePath: resolve(`${root}/dist/vue/components/${name}.vue.js`) });
    }
    if (options.autoImports) {
      const prefix = typeof options.autoImports === "object" ? options.autoImports.prefix ?? "Bl" : "Bl";
      const from = resolve(`${root}/dist/vue/index.js`);
      addImports(AUTO_IMPORTS.map((name) => ({ name, as: prefixedName(name, prefix), from })));
    }
    nuxt.options.build.transpile.push("benchlight");
    nuxt.options.vite.optimizeDeps = {
      ...nuxt.options.vite.optimizeDeps,
      exclude: [...nuxt.options.vite.optimizeDeps?.exclude ?? [], "benchlight"]
    };
    nuxt.options.vite.css = {
      ...nuxt.options.vite.css,
      lightningcss: {
        ...nuxt.options.vite.css?.lightningcss,
        exclude: (nuxt.options.vite.css?.lightningcss?.exclude ?? 0) | 4
      }
    };
  }
});
export {
  module_default as default,
  prefixedName
};
