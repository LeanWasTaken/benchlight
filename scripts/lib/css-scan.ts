// Removes comments, strings and url() bodies so selectors can be scanned with regexes.
export function stripNoise(css: string): string {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/url\([^)]*\)/g, 'url()')
    .replace(/'(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"/g, '""')
}

export const classNames = (css: string) =>
  [...stripNoise(css).matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)].map((m) => m[1]!)

export const customPropertyDeclarations = (css: string) =>
  [...stripNoise(css).matchAll(/(?:^|[{;\s])(--[\w-]+)\s*:/g)].map((m) => m[1]!)

export const keyframeNames = (css: string) =>
  [...stripNoise(css).matchAll(/@keyframes\s+([\w-]+)/g)].map((m) => m[1]!)

export const propertyNames = (css: string) =>
  [...stripNoise(css).matchAll(/@property\s+(--[\w-]+)/g)].map((m) => m[1]!)
