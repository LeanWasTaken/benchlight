import { describe, expect, it } from 'vitest'
import { ansiToSegments } from '../../vue/utils/ansi'

const ESC = '\x1b'

describe('ansiToSegments', () => {
  it('passes plain text through', () => {
    expect(ansiToSegments('plain line')).toEqual([{ text: 'plain line' }])
  })

  it('maps reset-prefixed colour codes and resets', () => {
    expect(ansiToSegments(`${ESC}[0;32mI (12) wifi: up${ESC}[0m`)).toEqual([
      { text: 'I (12) wifi: up', className: 'kd-ansi-32' }
    ])
  })

  it('splits coloured and plain runs', () => {
    expect(ansiToSegments(`${ESC}[1;31mERR${ESC}[0m tail`)).toEqual([
      { text: 'ERR', className: 'kd-ansi-31' },
      { text: ' tail' }
    ])
  })

  it('supports bright colours and default-colour resets', () => {
    expect(ansiToSegments(`${ESC}[94mA${ESC}[39mB`)).toEqual([
      { text: 'A', className: 'kd-ansi-94' },
      { text: 'B' }
    ])
  })

  it('skips 256-colour and truecolour parameters without bogus classes', () => {
    expect(ansiToSegments(`${ESC}[38;5;208mX`)).toEqual([{ text: 'X' }])
    expect(ansiToSegments(`${ESC}[38;5;31mX`)).toEqual([{ text: 'X' }])
    expect(ansiToSegments(`${ESC}[48;5;94mX`)).toEqual([{ text: 'X' }])
    expect(ansiToSegments(`${ESC}[38;2;255;0;0mX${ESC}[34mY`)).toEqual([
      { text: 'X' },
      { text: 'Y', className: 'kd-ansi-34' }
    ])
    expect(ansiToSegments(`${ESC}[38;2;31;32;33mX${ESC}[34mY`)).toEqual([
      { text: 'X' },
      { text: 'Y', className: 'kd-ansi-34' }
    ])
  })

  it('ignores unsupported attributes like underline', () => {
    expect(ansiToSegments(`${ESC}[4munder`)).toEqual([{ text: 'under' }])
  })

  it('drops a line cut off mid-escape and stray ESC bytes', () => {
    expect(ansiToSegments(`cut ${ESC}[3`)).toEqual([{ text: 'cut ' }])
    expect(ansiToSegments(`a${ESC}b`)).toEqual([{ text: 'ab' }])
  })

  it('returns nothing for an empty line', () => {
    expect(ansiToSegments('')).toEqual([])
  })
})
