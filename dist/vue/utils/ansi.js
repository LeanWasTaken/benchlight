const CSI = /\x1b\[([0-?]*)[ -/]*([@-~])/g;
const TRAILING_ESCAPE = /\x1b\[[0-9;]*$/;
const STRAY_ESCAPE = /\x1b/g;
const COLOR = /^(3[0-7]|9[0-7])$/;
function ansiToSegments(line) {
  const segments = [];
  let className;
  let last = 0;
  const push = (raw) => {
    const text = raw.replace(TRAILING_ESCAPE, "").replace(STRAY_ESCAPE, "");
    if (text) segments.push(className ? { text, className } : { text });
  };
  for (const match of line.matchAll(CSI)) {
    push(line.slice(last, match.index));
    last = (match.index ?? 0) + match[0].length;
    if (match[2] !== "m") continue;
    const params = (match[1] ?? "").split(";");
    for (let i = 0; i < params.length; i++) {
      const param = params[i] ?? "";
      if (param === "" || param === "0" || param === "39") className = void 0;
      else if (COLOR.test(param)) className = `bl-ansi-${param}`;
      else if (param === "38" || param === "48") {
        i += params[i + 1] === "5" ? 2 : params[i + 1] === "2" ? 4 : 0;
      }
    }
  }
  push(line.slice(last));
  return segments;
}
export {
  ansiToSegments
};
