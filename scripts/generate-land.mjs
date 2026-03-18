#!/usr/bin/env node
/**
 * generate-land.mjs — Convert Natural Earth 110m TopoJSON to HADAL globe land data
 *
 * Source: world-atlas npm package (Natural Earth 110m, pre-simplified)
 * Output: src/canvas/land-110m.ts
 *
 * Separates:
 *   - General land polygons (all continents/islands)
 *   - Gulf "hot zone" countries (Saudi Arabia, Yemen, Oman, UAE, Qatar, Kuwait)
 *   - Iran (special orange highlight)
 *   - Iraq (tactical context)
 *
 * Run: node scripts/generate-land.mjs
 * Deterministic — safe to rerun anytime.
 */

import { readFileSync, writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'
import { feature } from 'topojson-client'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')

// ── Load TopoJSON ──
const landTopo = JSON.parse(readFileSync(resolve(ROOT, 'node_modules/world-atlas/land-110m.json'), 'utf-8'))
const countriesTopo = JSON.parse(readFileSync(resolve(ROOT, 'node_modules/world-atlas/countries-110m.json'), 'utf-8'))

// ── Convert to GeoJSON ──
const landGeo = feature(landTopo, landTopo.objects.land)
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

// ── Round coordinates to 1 decimal place (sufficient for 420px globe, R=196) ──
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

// Epsilon = 0.6° — at R=196, 1° ≈ 3.4px, so 0.6° ≈ 2px tolerance
const SIMPLIFY_EPSILON = 0.6

// ── Filter out tiny islands (< 4 points or negligible area) ──
function isSignificant(ring) {
  if (ring.length < 4) return false
  // Rough spherical area estimate — skip rings smaller than ~0.5° extent
  let minLon = Infinity, maxLon = -Infinity, minLat = Infinity, maxLat = -Infinity
  for (const [lon, lat] of ring) {
    if (lon < minLon) minLon = lon
    if (lon > maxLon) maxLon = lon
    if (lat < minLat) minLat = lat
    if (lat > maxLat) maxLat = lat
  }
  const extent = (maxLon - minLon) * (maxLat - minLat)
  return extent > 4 // ~4 square degrees minimum — filters tiny islands invisible at R=196px
}

// ── Build land polygons (exclude special countries) ──
// Strategy: use the countries dataset for everything, so we can exclude Gulf/Iran
const landRings = []
const gulfRings = []
const iraqRings = []
let iranRing = null

for (const feat of countriesGeo.features) {
  const id = feat.id
  const rings = extractRings(feat.geometry)
    .map(r => simplifyRing(roundRing(r), SIMPLIFY_EPSILON))
    .filter(isSignificant)

  if (id === IRAN_ID) {
    iranRing = rings[0] || null // Iran is a single Polygon
  } else if (id === IRAQ_ID) {
    iraqRings.push(...rings)
  } else if (GULF_HOT_IDS.has(id)) {
    gulfRings.push(...rings)
  } else {
    landRings.push(...rings)
  }
}

// ── Stats ──
const totalPoints = landRings.reduce((s, r) => s + r.length, 0)
  + gulfRings.reduce((s, r) => s + r.length, 0)
  + iraqRings.reduce((s, r) => s + r.length, 0)
  + (iranRing ? iranRing.length : 0)

console.log(`Land polygons: ${landRings.length} rings, ${landRings.reduce((s, r) => s + r.length, 0)} points`)
console.log(`Gulf hot zone: ${gulfRings.length} rings, ${gulfRings.reduce((s, r) => s + r.length, 0)} points`)
console.log(`Iraq: ${iraqRings.length} rings, ${iraqRings.reduce((s, r) => s + r.length, 0)} points`)
console.log(`Iran: ${iranRing ? iranRing.length : 0} points`)
console.log(`Total: ${totalPoints} points`)

// ── Serialize to TypeScript ──
function serializeRing(ring) {
  return '[' + ring.map(([lo, la]) => `[${lo},${la}]`).join(',') + ']'
}

function serializeRings(rings) {
  return rings.map(r => '  ' + serializeRing(r)).join(',\n')
}

const output = `// Auto-generated from Natural Earth 110m via scripts/generate-land.mjs
// Source: world-atlas npm package (Natural Earth, public domain)
// Do not edit manually. Rerun: node scripts/generate-land.mjs
//
// Total: ${totalPoints} coordinate pairs
// Land: ${landRings.length} polygons | Gulf: ${gulfRings.length} | Iraq: ${iraqRings.length} | Iran: 1

/** General land polygons — all continents and major islands except Gulf/Iran/Iraq */
export const landPolygons: number[][][] = [
${serializeRings(landRings)}
]

/** Gulf "hot zone" countries: Saudi Arabia, Yemen, Oman, UAE, Qatar, Kuwait */
export const gulfPolygons: number[][][] = [
${serializeRings(gulfRings)}
]

/** Iraq — drawn with standard land style but separated for potential future highlighting */
export const iraqPolygons: number[][][] = [
${serializeRings(iraqRings)}
]

/** Iran — special orange highlight */
export const iranPolygon: number[][] = ${iranRing ? serializeRing(iranRing) : '[]'}
`

const outPath = resolve(ROOT, 'src/canvas/land-110m.ts')
writeFileSync(outPath, output, 'utf-8')
console.log(`\nWritten to ${outPath}`)
