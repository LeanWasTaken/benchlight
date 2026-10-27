export declare const colorNames: readonly ["canvas", "surface", "raised", "separator", "control-border", "ink-1", "ink-2", "ink-3", "trace", "copper", "phosphor", "danger", "on-trace", "on-danger"];
export type ColorName = (typeof colorNames)[number];
export type Theme = 'light' | 'dark';
export declare const tokens: {
    readonly color: {
        readonly light: {
            readonly canvas: "#eff1f3";
            readonly surface: "#f8f9fa";
            readonly raised: "#ffffff";
            readonly separator: "#d9dde1";
            readonly 'control-border': "#7f858c";
            readonly 'ink-1': "#1a1d21";
            readonly 'ink-2': "#4e555d";
            readonly 'ink-3': "#646c75";
            readonly trace: "#2151cc";
            readonly copper: "#a6512a";
            readonly phosphor: "#1f7a46";
            readonly danger: "#a42d37";
            readonly 'on-trace': "#ffffff";
            readonly 'on-danger': "#ffffff";
        };
        readonly dark: {
            readonly canvas: "#101214";
            readonly surface: "#16191c";
            readonly raised: "#1c2024";
            readonly separator: "#2a2f35";
            readonly 'control-border': "#69707a";
            readonly 'ink-1': "#e8eaed";
            readonly 'ink-2': "#a2a9b0";
            readonly 'ink-3': "#8a929b";
            readonly trace: "#97b1ff";
            readonly copper: "#e8936a";
            readonly phosphor: "#7bd9a2";
            readonly danger: "#ff9098";
            readonly 'on-trace': "#101214";
            readonly 'on-danger': "#101214";
        };
    };
    readonly font: {
        readonly sans: "Geist, ui-sans-serif, system-ui, sans-serif";
        readonly mono: "'Geist Mono', ui-monospace, SFMono-Regular, monospace";
        readonly display: "'Bricolage Grotesque', 'Avenir Next Condensed', 'Arial Narrow', sans-serif";
    };
    readonly text: {
        readonly micro: "0.6875rem";
        readonly annotation: "0.8125rem";
        readonly small: "0.9375rem";
        readonly body: "1.0625rem";
        readonly heading: "1.25rem";
        readonly 'display-xl': "clamp(2.5rem, 1rem + 7vw, 6rem)";
        readonly 'display-lg': "clamp(1.875rem, 0.75rem + 5vw, 3.375rem)";
        readonly 'display-md': "clamp(1.875rem, 4.5vw, 2.5rem)";
    };
    readonly leading: {
        readonly body: "1.6";
        readonly lede: "1.625";
        readonly heading: "1.3";
        readonly display: "0.95";
        readonly 'display-md': "1.05";
    };
    readonly tracking: {
        readonly annotation: "0.06em";
        readonly nav: "0.08em";
        readonly silkscreen: "0.12em";
        readonly heading: "-0.025em";
        readonly display: "-0.01em";
    };
    readonly radius: {
        readonly chip: "6px";
        readonly card: "12px";
        readonly pill: "9999px";
    };
    readonly layout: {
        readonly column: "1080px";
        readonly prose: "720px";
        readonly gutter: "24px";
        readonly 'gutter-narrow': "16px";
    };
    readonly breakpoint: {
        readonly xs: "480px";
        readonly sm: "640px";
        readonly md: "768px";
        readonly lg: "1024px";
        readonly xl: "1280px";
    };
    readonly ease: {
        readonly out: "cubic-bezier(0.32, 0.72, 0, 1)";
    };
    readonly duration: {
        readonly fast: "150ms";
        readonly base: "200ms";
        readonly rise: "500ms";
        readonly 'rise-step': "60ms";
        readonly 'page-leave': "140ms";
        readonly 'page-enter': "180ms";
    };
    readonly shadow: {
        readonly thumb: "0 1px 2px rgb(0 0 0 / 0.08)";
        readonly float: "0 12px 32px -12px rgb(0 0 0 / 0.3)";
        readonly well: "inset 0 1px 2px rgb(0 0 0 / 0.06)";
        readonly glow: "0 0 8px";
    };
};
export type Tokens = typeof tokens;
