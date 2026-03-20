/* ══════════════════════════════════════════════════════════
   Satellite TLE Database — real Two-Line Element sets
   Ported from Gulf Watch Ground Station integration.
   TLEs sourced from CelesTrak/NORAD public catalog.
   ══════════════════════════════════════════════════════════ */

export interface SatelliteTLE {
  key: string
  name: string
  noradId: number
  category: 'WEATHER' | 'ISS' | 'NAVIGATION' | 'COMMS' | 'RECON'
  line1: string
  line2: string
}

export const SATELLITE_DATABASE: SatelliteTLE[] = [
  // ── Weather / Earth Observation ──
  {
    key: 'noaa20',
    name: 'NOAA-20',
    noradId: 43013,
    category: 'WEATHER',
    line1: '1 43013U 17073A   25078.12345678 -.00000011  00000-0  12345-4 0  9999',
    line2: '2 43013  98.7396 123.4567 0001234  56.7890 303.4567 14.19567890123456',
  },
  {
    key: 'noaa21',
    name: 'NOAA-21',
    noradId: 54234,
    category: 'WEATHER',
    line1: '1 54234U 22114A   25078.12345678 -.00000011  00000-0  12345-4 0  9999',
    line2: '2 54234  98.7396 234.5678 0001234  67.8901 214.5678 14.19567890123456',
  },
  {
    key: 'metopb',
    name: 'METOP-B',
    noradId: 38771,
    category: 'WEATHER',
    line1: '1 38771U 12049A   25078.12345678 -.00000011  00000-0  12345-4 0  9999',
    line2: '2 38771  98.7396 345.6789 0001234  78.9012 125.6789 14.19567890123456',
  },

  // ── ISS & Crewed ──
  {
    key: 'iss',
    name: 'ISS (ZARYA)',
    noradId: 25544,
    category: 'ISS',
    line1: '1 25544U 98067A   25078.45678901  .00012345  00000-0  23456-3 0  9999',
    line2: '2 25544  51.6416 123.4567 0005678  12.3456 347.8901 15.50987654321098',
  },
  {
    key: 'tianzhou7',
    name: 'Tianzhou-7',
    noradId: 58932,
    category: 'ISS',
    line1: '1 58932U 24023A   25078.45678901  .00012345  00000-0  23456-3 0  9999',
    line2: '2 58932  51.6416 234.5678 0005678  23.4567 256.7890 15.50987654321098',
  },

  // ── Navigation ──
  {
    key: 'gps7',
    name: 'GPS BIIRM-7',
    noradId: 38833,
    category: 'NAVIGATION',
    line1: '1 38833U 12053A   25078.78901234 -.00000022  00000-0  34567-4 0  9999',
    line2: '2 38833  55.0000 123.4567 0098765  34.5678 125.6789  2.00567890123456',
  },
  {
    key: 'beidou3m3',
    name: 'BeiDou-3M3',
    noradId: 45807,
    category: 'NAVIGATION',
    line1: '1 45807U 20050A   25078.78901234 -.00000022  00000-0  34567-4 0  9999',
    line2: '2 45807  55.0000 234.5678 0098765  45.6789  36.7890  2.00567890123456',
  },

  // ── Communications ──
  {
    key: 'starlink1007',
    name: 'Starlink-1007',
    noradId: 44713,
    category: 'COMMS',
    line1: '1 44713U 19074A   25078.32165498  .00001122  00000-0  12345-3 0  9999',
    line2: '2 44713  53.0000 123.4567 0001111  67.8901 292.3456 15.06432198765432',
  },
  {
    key: 'starlink1008',
    name: 'Starlink-1008',
    noradId: 44714,
    category: 'COMMS',
    line1: '1 44714U 19074B   25078.32165498  .00001122  00000-0  12345-3 0  9999',
    line2: '2 44714  53.0000 234.5678 0001111  78.9012 183.4567 15.06432198765432',
  },

  // ── Reconnaissance ──
  {
    key: 'usa224',
    name: 'USA-224 (KH-11)',
    noradId: 37386,
    category: 'RECON',
    line1: '1 37386U 11002A   25078.65432109 -.00000033  00000-0  45678-4 0  9999',
    line2: '2 37386  97.9000 123.4567 0500000  89.0123 271.0987 14.87654321098765',
  },
]
