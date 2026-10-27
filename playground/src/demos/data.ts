import type { TableColumn } from '../../../vue'

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
