#!/usr/bin/env node
/**
 * generate-land.mjs — Convert Natural Earth 50m TopoJSON to HADAL globe land data
 *
 * Source: world-atlas npm package (Natural Earth 50m, public domain)
 * Output: src/canvas/land-110m.ts  (filename kept for import compatibility)
 *
 * Separates:
 *   - General land polygons (all continents/islands)
 *   - Gulf "hot zone" countries (Saudi Arabia, Yemen, Oman, UAE, Qatar, Kuwait, Bahrain)
 *   - Iran (special orange highlight)
 *   - Iraq (tactical context)
 *
 * Run: node scripts/generate-land.mjs
 * Deterministic — safe to rerun anytime.
 *
 * Previous source was 110m (~10K raw points, ~4K after simplification).
 * Now using 50m (~97K raw points) with lighter simplification for faithful coastlines
 * at R=260 (560×560 canvas). Target: ~8-14K output points.
 */

import { readFileSync, writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'
import { feature } from 'topojson-client'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')

// ── Load TopoJSON (50m for better coastline fidelity) ──
const countriesTopo = JSON.parse(readFileSync(resolve(ROOT, 'node_modules/world-atlas/countries-50m.json'), 'utf-8'))

// ── Convert to GeoJSON ──
const countriesGeo = feature(countriesTopo, countriesTopo.objects.countries)

// ── Country IDs (ISO 3166-1 numeric) ──
const IRAN_ID = '364'
const IRAQ_ID = '368'
const GULF_HOT_IDS = new Set([
  '682', // Saudi Arabia
  '887', // Yemen
  '512', // Oman
  '784', // UAE
  '634', // Qatar
  '414', // Kuwait
  '048', // Bahrain — small but strategically critical for Gulf intel
])

// All IDs to exclude from general land (drawn separately with special styling)
const SPECIAL_IDS = new Set([IRAN_ID, IRAQ_ID, ...GULF_HOT_IDS])

// ── Extract polygon rings from a GeoJSON geometry ──
function extractRings(geometry) {
  const rings = []
  if (geometry.type === 'Polygon') {
    // Only outer ring (index 0), skip holes
    rings.push(geometry.coordinates[0])
  } else if (geometry.type === 'MultiPolygon') {
    for (const poly of geometry.coordinates) {
      rings.push(poly[0]) // outer ring only
    }
  }
  return rings
}

// ── Round coordinates to 1 decimal place (0.1° ≈ 0.45px at R=260 — sufficient) ──
function roundRing(ring) {
  return ring.map(([lon, lat]) => [
    Math.round(lon * 10) / 10,
    Math.round(lat * 10) / 10,
  ])
}

// ── Douglas-Peucker simplification ──
function dpDist(p, a, b) {
  const dx = b[0] - a[0], dy = b[1] - a[1]
  const lenSq = dx * dx + dy * dy
  if (lenSq === 0) return Math.sqrt((p[0] - a[0]) ** 2 + (p[1] - a[1]) ** 2)
  const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / lenSq))
  return Math.sqrt((p[0] - (a[0] + t * dx)) ** 2 + (p[1] - (a[1] + t * dy)) ** 2)
}

function simplifyRing(ring, epsilon) {
  if (ring.length <= 4) return ring
  let maxDist = 0, maxIdx = 0
  for (let i = 1; i < ring.length - 1; i++) {
    const d = dpDist(ring[i], ring[0], ring[ring.length - 1])
    if (d > maxDist) { maxDist = d; maxIdx = i }
  }
  if (maxDist > epsilon) {
    const left = simplifyRing(ring.slice(0, maxIdx + 1), epsilon)
    const right = simplifyRing(ring.slice(maxIdx), epsilon)
    return [...left.slice(0, -1), ...right]
  }
  return [ring[0], ring[ring.length - 1]]
}

// Epsilon = 0.25° — at R=260, 1° ≈ 4.5px, so 0.25° ≈ 1.1px tolerance
// This preserves detail down to about 1 pixel — the threshold of visibility
const SIMPLIFY_EPSILON = 0.25

// Use a tighter epsilon for the Gulf/Iran/Iraq theatre — the area of interest
// deserves higher fidelity than distant continents
const THEATRE_EPSILON = 0.15

// ── Filter out tiny islands ──
// For special countries (Gulf region), use a much lower threshold to keep
// small but strategically important landmasses (e.g., Bahrain islands)
function isSignificant(ring, isTheatre = false) {
  if (ring.length < 4) return false
  let minLon = Infinity, maxLon = -Infinity, minLat = Infinity, maxLat = -Infinity
  for (const [lon, lat] of ring) {
    if (lon < minLon) minLon = lon
    if (lon > maxLon) maxLon = lon
    if (lat < minLat) minLat = lat
    if (lat > maxLat) maxLat = lat
  }
  const extent = (maxLon - minLon) * (maxLat - minLat)
  // Theatre countries: 0.3 sq° (keeps small Gulf islands)
  // General land: 0.8 sq° (keeps medium islands visible at R=260)
  return extent > (isTheatre ? 0.3 : 0.8)
}

// ── Remove duplicate consecutive points after rounding ──
function dedup(ring) {
  const out = [ring[0]]
  for (let i = 1; i < ring.length; i++) {
    if (ring[i][0] !== ring[i - 1][0] || ring[i][1] !== ring[i - 1][1]) {
      out.push(ring[i])
    }
  }
  return out
}

// ── Build land polygons (exclude special countries) ──
const landRings = []
const gulfRings = []
const iraqRings = []
let iranRings = []

for (const feat of countriesGeo.features) {
  const id = feat.id
  const isTheatre = SPECIAL_IDS.has(id)
  const eps = isTheatre ? THEATRE_EPSILON : SIMPLIFY_EPSILON

  const rings = extractRings(feat.geometry)
    .map(r => dedup(simplifyRing(roundRing(r), eps)))
    .filter(r => isSignificant(r, isTheatre))

  if (id === IRAN_ID) {
    iranRings = rings
  } else if (id === IRAQ_ID) {
    iraqRings.push(...rings)
  } else if (GULF_HOT_IDS.has(id)) {
    gulfRings.push(...rings)
  } else {
    landRings.push(...rings)
  }
}

// For backwards compat, export the largest Iran ring as iranPolygon
// and keep all rings available
const iranRing = iranRings.length > 0
  ? iranRings.reduce((best, r) => r.length > best.length ? r : best, iranRings[0])
  : null

// ── Stats ──
const totalPoints = landRings.reduce((s, r) => s + r.length, 0)
  + gulfRings.reduce((s, r) => s + r.length, 0)
  + iraqRings.reduce((s, r) => s + r.length, 0)
  + iranRings.reduce((s, r) => s + r.length, 0)

console.log(`Land polygons: ${landRings.length} rings, ${landRings.reduce((s, r) => s + r.length, 0)} points`)
console.log(`Gulf hot zone: ${gulfRings.length} rings, ${gulfRings.reduce((s, r) => s + r.length, 0)} points`)
console.log(`Iraq: ${iraqRings.length} rings, ${iraqRings.reduce((s, r) => s + r.length, 0)} points`)
console.log(`Iran: ${iranRings.length} rings, ${iranRings.reduce((s, r) => s + r.length, 0)} points`)
console.log(`Total: ${totalPoints} points`)

// ── Serialize to TypeScript ──
function serializeRing(ring) {
  return '[' + ring.map(([lo, la]) => `[${lo},${la}]`).join(',') + ']'
}

function serializeRings(rings) {
  return rings.map(r => '  ' + serializeRing(r)).join(',\n')
}

const output = `// Auto-generated from Natural Earth 50m via scripts/generate-land.mjs
// Source: world-atlas npm package (Natural Earth, public domain)
// Do not edit manually. Rerun: node scripts/generate-land.mjs
//
// Total: ${totalPoints} coordinate pairs
// Land: ${landRings.length} polygons | Gulf: ${gulfRings.length} | Iraq: ${iraqRings.length} | Iran: ${iranRings.length}
// Source resolution: 50m (upgraded from 110m for coastline fidelity at R=260)
// Simplification: ε=0.25° general, ε=0.15° theatre (Gulf/Iran/Iraq)

/** General land polygons — all continents and major islands except Gulf/Iran/Iraq */
export const landPolygons: number[][][] = [
${serializeRings(landRings)}
]

/** Gulf "hot zone" countries: Saudi Arabia, Yemen, Oman, UAE, Qatar, Kuwait, Bahrain */
export const gulfPolygons: number[][][] = [
${serializeRings(gulfRings)}
]

/** Iraq — drawn with standard land style but separated for potential future highlighting */
export const iraqPolygons: number[][][] = [
${serializeRings(iraqRings)}
]

/** Iran — main polygon (largest ring) for backwards-compatible single-polygon export */
export const iranPolygon: number[][] = ${iranRing ? serializeRing(iranRing) : '[]'}

/** Iran — all rings including islands (Qeshm, Kish, etc.) */
export const iranAllRings: number[][][] = [
${serializeRings(iranRings)}
]
`

const outPath = resolve(ROOT, 'src/canvas/land-110m.ts')
writeFileSync(outPath, output, 'utf-8')
console.log(`\nWritten to ${outPath}`)
console.log(`File size: ${(Buffer.byteLength(output) / 1024).toFixed(1)} KB`)
