/* ══════════════════════════════════════════════════════════
   SGP4 Orbital Propagation — Pure Math Engine
   Ported from Gulf Watch Ground Station integration.

   Simplified Keplerian propagation (no J2 perturbation).
   Computes satellite lat/lng/alt from Two-Line Element sets.
   Zero external dependencies.
   ══════════════════════════════════════════════════════════ */

import type { SatelliteTLE } from '@/data/satellite-tle'

// ── Constants ──

const MU = 398600.4418        // Earth gravitational parameter, km³/s²
const EARTH_RADIUS = 6378.135 // km (WGS-84 equatorial)
const J2000 = 2451545.0       // Julian date of J2000.0 epoch
const DEG2RAD = Math.PI / 180
const RAD2DEG = 180 / Math.PI
const TWOPI = 2 * Math.PI
const MINUTES_PER_DAY = 1440

// ── Interfaces ──

export interface TLEElements {
  epochJD: number        // Julian date of TLE epoch
  inclination: number    // radians
  raan: number           // Right Ascension of Ascending Node, radians
  eccentricity: number   // dimensionless (0–1)
  argPerigee: number     // Argument of Perigee, radians
  meanAnomaly: number    // radians
  meanMotion: number     // revolutions per day
}

export interface SatellitePosition {
  key: string
  name: string
  category: string
  noradId: number
  lat: number            // degrees, -90 to 90
  lng: number            // degrees, -180 to 180
  alt: number            // km above Earth surface
  velocity: number       // km/s
  heading: number        // approximate ground-track heading, degrees
}

// ── TLE Parsing ──

export function parseTLE(line1: string, line2: string): TLEElements {
  // Epoch: line1 cols 18–32 (year 2-digit + fractional day)
  const epochYr2 = parseInt(line1.substring(18, 20), 10)
  const epochYear = epochYr2 < 57 ? 2000 + epochYr2 : 1900 + epochYr2
  const epochDay = parseFloat(line1.substring(20, 32))

  // Convert epoch to Julian Date
  const jan1 = Date.UTC(epochYear, 0, 1, 0, 0, 0)
  const epochMs = jan1 + (epochDay - 1) * 86400000
  const epochJD = epochMs / 86400000 + 2440587.5

  // Line 2 orbital elements
  const inclination = parseFloat(line2.substring(8, 16)) * DEG2RAD
  const raan = parseFloat(line2.substring(17, 25)) * DEG2RAD
  const eccentricity = parseFloat('0.' + line2.substring(26, 33))
  const argPerigee = parseFloat(line2.substring(34, 42)) * DEG2RAD
  const meanAnomaly = parseFloat(line2.substring(43, 51)) * DEG2RAD
  const meanMotion = parseFloat(line2.substring(52, 63))

  return { epochJD, inclination, raan, eccentricity, argPerigee, meanAnomaly, meanMotion }
}

// ── Time Utilities ──

export function julianDate(date: Date): number {
  return date.getTime() / 86400000 + 2440587.5
}

/** Greenwich Mean Sidereal Time in degrees */
export function calculateGMST(jd: number): number {
  const T = (jd - J2000) / 36525
  const gmst = 280.46061837
    + 360.98564736629 * (jd - J2000)
    + 0.000387933 * T * T
    - T * T * T / 38710000
  return ((gmst % 360) + 360) % 360
}

// ── Kepler's Equation Solver (Newton-Raphson) ──

function solveKepler(M: number, e: number): number {
  // Eccentric anomaly from mean anomaly
  let E = M
  for (let i = 0; i < 12; i++) {
    const dE = (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E))
    E -= dE
    if (Math.abs(dE) < 1e-10) break
  }
  return E
}

// ── Core Propagation ──

function propagateElements(el: TLEElements, date: Date): { lat: number; lng: number; alt: number; velocity: number; heading: number } | null {
  const jd = julianDate(date)
  const timeSinceEpochMin = (jd - el.epochJD) * MINUTES_PER_DAY

  // Orbital period in minutes
  const period = MINUTES_PER_DAY / el.meanMotion

  // Mean anomaly at requested time
  const M = (el.meanAnomaly + TWOPI * timeSinceEpochMin / period) % TWOPI

  // Solve Kepler's equation for eccentric anomaly
  const E = solveKepler(M, el.eccentricity)

  // True anomaly from eccentric anomaly
  const sinV = Math.sqrt(1 - el.eccentricity * el.eccentricity) * Math.sin(E) / (1 - el.eccentricity * Math.cos(E))
  const cosV = (Math.cos(E) - el.eccentricity) / (1 - el.eccentricity * Math.cos(E))
  const trueAnomaly = Math.atan2(sinV, cosV)

  // Semi-major axis from mean motion (Kepler's third law)
  const nRadSec = el.meanMotion * TWOPI / 86400 // rev/day → rad/s
  const semiMajorAxis = Math.pow(MU / (nRadSec * nRadSec), 1 / 3) // km

  // Orbital radius
  const r = semiMajorAxis * (1 - el.eccentricity * el.eccentricity) / (1 + el.eccentricity * Math.cos(trueAnomaly))

  // Position in orbital plane
  const xOrb = r * Math.cos(trueAnomaly)
  const yOrb = r * Math.sin(trueAnomaly)

  // Rotation matrices: argument of perigee → inclination → RAAN
  const cosW = Math.cos(el.argPerigee)
  const sinW = Math.sin(el.argPerigee)
  const cosI = Math.cos(el.inclination)
  const sinI = Math.sin(el.inclination)
  const cosO = Math.cos(el.raan)
  const sinO = Math.sin(el.raan)

  // ECI coordinates (Earth-Centered Inertial)
  const xECI = (cosO * cosW - sinO * sinW * cosI) * xOrb + (-cosO * sinW - sinO * cosW * cosI) * yOrb
  const yECI = (sinO * cosW + cosO * sinW * cosI) * xOrb + (-sinO * sinW + cosO * cosW * cosI) * yOrb
  const zECI = (sinI * sinW) * xOrb + (sinI * cosW) * yOrb

  // Rotate by GMST to get ECEF (Earth-fixed)
  const gmst = calculateGMST(jd) * DEG2RAD
  const cosG = Math.cos(gmst)
  const sinG = Math.sin(gmst)
  const xECEF = xECI * cosG + yECI * sinG
  const yECEF = -xECI * sinG + yECI * cosG
  const zECEF = zECI

  // Geodetic coordinates
  const lng = Math.atan2(yECEF, xECEF) * RAD2DEG
  const lat = Math.atan2(zECEF, Math.sqrt(xECEF * xECEF + yECEF * yECEF)) * RAD2DEG
  const alt = Math.sqrt(xECEF * xECEF + yECEF * yECEF + zECEF * zECEF) - EARTH_RADIUS

  // Velocity magnitude (vis-viva equation)
  const velocity = Math.sqrt(MU * (2 / r - 1 / semiMajorAxis))

  // Approximate heading from orbital inclination and latitude
  // Ground track heading ≈ function of inclination and current latitude
  const cosLat = Math.cos(lat * DEG2RAD)
  const headingRad = Math.acos(Math.max(-1, Math.min(1, Math.cos(el.inclination) / cosLat)))
  // Determine if ascending or descending
  const heading = zECI >= 0
    ? headingRad * RAD2DEG   // ascending → northeasterly
    : 360 - headingRad * RAD2DEG  // descending → southeasterly

  if (!isFinite(lat) || !isFinite(lng) || !isFinite(alt)) return null

  return { lat, lng: ((lng + 180) % 360) - 180, alt: Math.max(0, alt), velocity, heading: isFinite(heading) ? heading : 0 }
}

// ── Public API ──

export function computePosition(sat: SatelliteTLE, date?: Date): SatellitePosition | null {
  const d = date ?? new Date()
  const el = parseTLE(sat.line1, sat.line2)
  const pos = propagateElements(el, d)
  if (!pos) return null
  return {
    key: sat.key,
    name: sat.name,
    category: sat.category,
    noradId: sat.noradId,
    ...pos,
  }
}

export function getAllPositions(satellites: SatelliteTLE[], date?: Date): SatellitePosition[] {
  const d = date ?? new Date()
  const results: SatellitePosition[] = []
  for (const sat of satellites) {
    const pos = computePosition(sat, d)
    if (pos) results.push(pos)
  }
  return results
}

/** Elevation angle in degrees from observer to satellite */
export function calculateElevation(
  obsLat: number, obsLon: number, obsAlt: number,
  satLat: number, satLon: number, satAlt: number,
): number {
  const lat1 = obsLat * DEG2RAD
  const lat2 = satLat * DEG2RAD
  const dLon = (satLon - obsLon) * DEG2RAD
  const dLat = (satLat - obsLat) * DEG2RAD

  // Haversine for great-circle distance
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const groundDist = EARTH_RADIUS * c

  const dAlt = satAlt - obsAlt
  const slantRange = Math.sqrt(groundDist * groundDist + dAlt * dAlt)
  return Math.asin(dAlt / slantRange) * RAD2DEG
}

/** Filter satellites visible from a ground observer (above minimum elevation angle) */
export function getVisibleSatellites(
  positions: SatellitePosition[],
  obsLat: number,
  obsLon: number,
  minElevation = 5,
): SatellitePosition[] {
  return positions.filter(sat => {
    const elev = calculateElevation(obsLat, obsLon, 0, sat.lat, sat.lng, sat.alt)
    return elev >= minElevation
  })
}
