export interface AnsiSegment {
  text: string
  className?: string
}

// eslint-disable-next-line no-control-regex
const SGR = /\x1b\[([0-9;]*)m/g
// eslint-disable-next-line no-control-regex
const TRAILING_ESCAPE = /\x1b\[[0-9;]*$/
// eslint-disable-next-line no-control-regex
const STRAY_ESCAPE = /\x1b/g
const COLOR = /^(3[0-7]|9[0-7])$/

// Splits one log line into runs coloured by SGR foreground codes (bl-ansi-30…97).
export function ansiToSegments(line: string): AnsiSegment[] {
  const segments: AnsiSegment[] = []
  let className: string | undefined
  let last = 0
  const push = (raw: string) => {
    const text = raw.replace(TRAILING_ESCAPE, '').replace(STRAY_ESCAPE, '')
    if (text) segments.push(className ? { text, className } : { text })
  }
  for (const match of line.matchAll(SGR)) {
    push(line.slice(last, match.index))
    last = (match.index ?? 0) + match[0].length
    const params = (match[1] ?? '').split(';')
    for (let i = 0; i < params.length; i++) {
      const param = params[i] ?? ''
      if (param === '' || param === '0' || param === '39') className = undefined
      else if (COLOR.test(param)) className = `bl-ansi-${param}`
      else if (param === '38' || param === '48') {
        i += params[i + 1] === '5' ? 2 : params[i + 1] === '2' ? 4 : 0
      }
    }
  }
  push(line.slice(last))
  return segments
}
