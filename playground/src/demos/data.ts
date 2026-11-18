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
