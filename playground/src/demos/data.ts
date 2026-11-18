import type { LightboxItem, TableColumn } from '../../../vue'

export type Client = {
  name: string
  signal: number
  address: string
  uptime: string
  band: string
  channel: number
}

/** Twelve deterministic rows: the same table on every run. */
export const clients: Client[] = Array.from({ length: 12 }, (_, i) => ({
  name: `client-${String(i + 1).padStart(2, '0')}`,
  signal: -40 - ((i * 7) % 35),
  address: `192.168.1.${20 + i}`,
  uptime: `${(i * 5) % 24}h ${(i * 13) % 60}m`,
  band: i % 2 ? '5 GHz' : '2.4 GHz',
  channel: 1 + ((i * 4) % 11)
}))

export const clientColumns: TableColumn<Client>[] = [
  { key: 'name', label: 'Name', sortable: true },
  {
    key: 'signal',
    label: 'Signal',
    numeric: true,
    sortable: true,
    total: 'avg',
    format: (v) => `${v} dBm`,
    formatTotal: (v) => `${v} dBm`
  },
  { key: 'address', label: 'Address' },
  { key: 'uptime', label: 'Uptime', numeric: true }
]

export const clientColumnsWide: TableColumn<Client>[] = [
  ...clientColumns,
  { key: 'band', label: 'Band' },
  { key: 'channel', label: 'Channel', numeric: true }
]

export const logLines = [
  '\x1b[0;32mI (1203) wifi: connected to home-5g, rssi -48\x1b[0m',
  '\x1b[0;33mW (1490) sync: clock skew 3 ms\x1b[0m',
  '\x1b[0;31mE (2011) ota: image too large\x1b[0m',
  'I (2100) main: idle',
  ...Array.from({ length: 16 }, (_, i) => `I (${2200 + i * 40}) main: tick ${i + 1}`)
]

/**
 * A deterministic stand-in photo as an SVG data URI: sky, sun and two hills, `width` x `height`.
 * `hue` picks the palette so a group of them stays distinguishable.
 */
export function photo(width: number, height: number, hue: number): string {
  const [w, h] = [width, height]
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">` +
    `<rect width="${w}" height="${h}" fill="hsl(${hue} 45% 72%)"/>` +
    `<circle cx="${w * 0.72}" cy="${h * 0.3}" r="${Math.min(w, h) / 8}" fill="hsl(${hue + 40} 80% 88%)"/>` +
    `<path d="M0 ${h * 0.7}Q${w * 0.3} ${h * 0.45} ${w * 0.6} ${h * 0.68}T${w} ${h * 0.6}V${h}H0Z" fill="hsl(${hue + 160} 30% 42%)"/>` +
    `<path d="M0 ${h * 0.85}Q${w * 0.5} ${h * 0.7} ${w} ${h * 0.88}V${h}H0Z" fill="hsl(${hue + 170} 35% 28%)"/>` +
    `</svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

export const photos: LightboxItem[] = [
  {
    src: photo(1500, 1000, 200),
    alt: 'Hills under a pale blue sky',
    caption: 'Landscape, 3:2.',
    width: 1500,
    height: 1000
  },
  {
    src: photo(800, 1200, 20),
    alt: 'Hills under a warm sky, portrait',
    caption: 'Portrait, 2:3.',
    width: 800,
    height: 1200
  },
  {
    src: photo(1000, 1000, 120),
    alt: 'Hills under a green sky, square',
    width: 1000,
    height: 1000
  },
  {
    src: photo(2400, 600, 260),
    alt: 'A wide panorama of hills under a violet sky',
    caption: 'Panorama, 4:1.',
    width: 2400,
    height: 600
  }
]

// A measured drawing with labels too small to read at fit; the second lightbox demo renders it
// inline through the default slot (no src).
const [dw, dh, cell] = [2400, 1600, 100]
export const drawingMarkup = (() => {
  let out = `<rect width="${dw}" height="${dh}" fill="#f3efe6"/>`
  for (let x = 0; x <= dw; x += cell)
    out += `<path d="M${x} 0V${dh}" stroke="#9a8f7a" stroke-width="${x % 500 ? 1 : 3}"/>`
  for (let y = 0; y <= dh; y += cell)
    out += `<path d="M0 ${y}H${dw}" stroke="#9a8f7a" stroke-width="${y % 500 ? 1 : 3}"/>`
  for (let y = 0; y < dh; y += cell)
    for (let x = 0; x < dw; x += cell)
      out += `<text x="${x + 8}" y="${y + 20}" font-family="monospace" font-size="13" fill="#4a4236">${String.fromCharCode(65 + x / cell)}${y / cell + 1}</text>`
  out += `<circle cx="1450" cy="650" r="320" fill="none" stroke="#b5532f" stroke-width="6"/>`
  return out
})()
export const drawingThumb = `data:image/svg+xml;utf8,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${dw} ${dh}">${drawingMarkup}</svg>`
)}`

export interface Plate extends LightboxItem {
  title: string
}
export const plates: Plate[] = [
  {
    src: photo(1500, 1000, 30),
    alt: 'Hills under an amber sky',
    title: 'Plate 1: amber hills over the river valley, late on a long summer evening',
    caption: 'Landscape, 3:2.',
    width: 1500,
    height: 1000
  },
  {
    src: photo(1000, 1250, 300),
    alt: 'Hills under a rose sky, portrait',
    title: 'Plate 2: rose hills',
    width: 1000,
    height: 1250
  },
  {
    key: 'drawing',
    alt: 'A survey grid of lettered and numbered cells with one circled area',
    title: 'Plate 3: survey grid',
    caption: 'Drawn inline, no src.',
    width: dw,
    height: dh
  }
]
