/* ══════════════════════════════════════════════════════════
   STAGE 2 — IMPACT PROFILER
   Bootstrap resampling adapted from MIT QU-01.
   No parametric Monte Carlo. Empirical distributions only.
   ══════════════════════════════════════════════════════════ */

import type { NormalizedEvent, Percentiles, CategoryProfile, TimeWindowProfile, CascadeRisk, ReactionWindow, Trend, TrendAnalysis, TrendSummary } from './types'

const ITERATIONS = 5000
const MIN_EVENTS = 5
const MIN_CATEGORY = 3
const CLUSTER_WINDOW_MS = 6 * 3600000 // 6h for military events (MIT used 7d for crypto)

// ── Seeded PRNG (xorshift128+ from MIT) ──

function prng(seed?: number) {
  let s = seed ?? (Date.now() ^ (Math.random() * 0xffffffff))
  return function () {
    s ^= s << 13; s ^= s >> 17; s ^= s << 5
    return (s >>> 0) / 0xffffffff
  }
}

// ── Bootstrap resampling ──

function bootstrap(values: number[], iterations: number, rng: () => number): Float64Array {
  const n = values.length
  const results = new Float64Array(iterations)
  for (let i = 0; i < iterations; i++) {
    let sum = 0
    for (let j = 0; j < n; j++) {
      sum += values[Math.floor(rng() * n)]
    }
    results[i] = sum / n
  }
  results.sort()
  return results
}

function percentile(sorted: Float64Array, p: number): number {
  const idx = Math.floor(sorted.length * p)
  return sorted[Math.min(idx, sorted.length - 1)]
}

function extractPercentiles(sorted: Float64Array): Percentiles {
  return {
    p5:  +percentile(sorted, 0.05).toFixed(2),
    p10: +percentile(sorted, 0.10).toFixed(2),
    p25: +percentile(sorted, 0.25).toFixed(2),
    p50: +percentile(sorted, 0.50).toFixed(2),
    p75: +percentile(sorted, 0.75).toFixed(2),
    p90: +percentile(sorted, 0.90).toFixed(2),
    p95: +percentile(sorted, 0.95).toFixed(2),
  }
}

// ── Global profile ──

export function profileGlobal(events: NormalizedEvent[]) {
  const impacts = events.map(e => e.impactPct)
  if (impacts.length < MIN_EVENTS) return null

  const rng0 = prng()
  const sorted = bootstrap(impacts, ITERATIONS, rng0)
  const pctiles = extractPercentiles(sorted)
  const mean = impacts.reduce((s, v) => s + v, 0) / impacts.length
  const stdDev = Math.sqrt(impacts.reduce((s, v) => s + (v - mean) ** 2, 0) / impacts.length)

  return {
    percentiles: pctiles,
    mean: +mean.toFixed(2),
    stdDev: +stdDev.toFixed(2),
    probSevere: +(impacts.filter(v => v > 70).length / impacts.length * 100).toFixed(1),
    probCritical: +(impacts.filter(v => v > 90).length / impacts.length * 100).toFixed(1),
  }
}

// ── Per-category breakdown ──

function detectTrend(events: NormalizedEvent[]): Trend {
  if (events.length < 4) return 'stable'
  const sorted = [...events].sort((a, b) => a.timestamp - b.timestamp)
  const mid = Math.floor(sorted.length / 2)
  const earlyAvg = sorted.slice(0, mid).reduce((s, e) => s + e.severity, 0) / mid
  const lateAvg = sorted.slice(mid).reduce((s, e) => s + e.severity, 0) / (sorted.length - mid)
  const delta = (lateAvg - earlyAvg) / Math.max(earlyAvg, 1) * 100
  if (delta > 15) return 'escalating'
  if (delta < -15) return 'de-escalating'
  return 'stable'
}

export function profileByCategory(events: NormalizedEvent[]): Record<string, CategoryProfile> {
  const groups: Record<string, NormalizedEvent[]> = {}
  for (const e of events) {
    if (!groups[e.type]) groups[e.type] = []
    groups[e.type].push(e)
  }

  const rng0 = prng(42)
  const profiles: Record<string, CategoryProfile> = {}

  for (const [type, typeEvents] of Object.entries(groups)) {
    const severities = typeEvents.map(e => e.severity)
    const mean = severities.reduce((s, v) => s + v, 0) / severities.length

    if (severities.length < MIN_CATEGORY) {
      profiles[type] = {
        count: typeEvents.length,
        meanSeverity: +mean.toFixed(1),
        percentiles: { p10: mean, p50: mean, p90: mean },
        trend: 'stable',
      }
      continue
    }

    const sorted = bootstrap(severities, ITERATIONS, rng0)
    profiles[type] = {
      count: typeEvents.length,
      meanSeverity: +mean.toFixed(1),
      percentiles: {
        p10: +percentile(sorted, 0.10).toFixed(1),
        p50: +percentile(sorted, 0.50).toFixed(1),
        p90: +percentile(sorted, 0.90).toFixed(1),
      },
      trend: detectTrend(typeEvents),
    }
  }

  return profiles
}

// ── Time window profile ──

export function profileByTimeWindow(events: NormalizedEvent[]): {
  h24: TimeWindowProfile; h72: TimeWindowProfile; d7: TimeWindowProfile
} {
  const now = Date.now()
  const windows = {
    h24: events.filter(e => now - e.timestamp <= 24 * 3600000),
    h72: events.filter(e => now - e.timestamp <= 72 * 3600000),
    d7: events.filter(e => now - e.timestamp <= 7 * 86400000),
  }

  function summarize(evts: NormalizedEvent[]): TimeWindowProfile {
    if (evts.length === 0) return { meanSeverity: 0, count: 0 }
    return {
      meanSeverity: +(evts.reduce((s, e) => s + e.severity, 0) / evts.length).toFixed(1),
      count: evts.length,
    }
  }

  return {
    h24: summarize(windows.h24),
    h72: summarize(windows.h72),
    d7: summarize(windows.d7),
  }
}

// ── Cascade risk (adapted from MIT — 6h window instead of 7d) ──

export function analyzeCascadeRisk(events: NormalizedEvent[]): CascadeRisk {
  if (events.length < 5) return { clusterCount: 0, maxClusterSize: 0, contagionScore: 0 }

  const sorted = [...events].sort((a, b) => a.timestamp - b.timestamp)
  let clusterCount = 0
  let maxClusterSize = 0
  const visited = new Set<number>()

  for (let i = 0; i < sorted.length; i++) {
    if (visited.has(i)) continue
    const windowEnd = sorted[i].timestamp + CLUSTER_WINDOW_MS
    const cluster: number[] = [i]
    for (let j = i + 1; j < sorted.length; j++) {
      if (sorted[j].timestamp <= windowEnd) {
        cluster.push(j)
        visited.add(j)
      } else break
    }
    if (cluster.length >= 3) {
      clusterCount++
      maxClusterSize = Math.max(maxClusterSize, cluster.length)
    }
  }

  // Contagion score: how clustered are events?
  const contagionScore = Math.min(100, Math.round(
    (clusterCount / Math.max(1, events.length / 3)) * 50 +
    (maxClusterSize / Math.max(1, events.length)) * 50
  ))

  return { clusterCount, maxClusterSize, contagionScore }
}

// ── Trend analysis (ported from Gulf Watch upstream) ──

export function analyzeTrends(events: NormalizedEvent[]): TrendAnalysis | null {
  if (events.length === 0) return null

  const byDay: Record<string, number> = {}
  const byActor: Record<string, number> = {}
  const byCountry: Record<string, number> = {}
  const byType: Record<string, number> = {}

  for (const e of events) {
    const day = new Date(e.timestamp).toISOString().slice(0, 10)
    byDay[day] = (byDay[day] || 0) + 1
    if (e.actor !== 'unknown') byActor[e.actor] = (byActor[e.actor] || 0) + 1
    byCountry[e.country] = (byCountry[e.country] || 0) + 1
    byType[e.type] = (byType[e.type] || 0) + 1
  }

  const topEntry = (map: Record<string, number>) =>
    Object.entries(map).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Unknown'

  const dailyFrequency = Object.entries(byDay)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date))

  // Escalation rate: last 3 days vs first 3 days
  let escalationRate = 0
  if (dailyFrequency.length >= 6) {
    const earlyCount = dailyFrequency.slice(0, 3).reduce((s, d) => s + d.count, 0)
    const lateCount = dailyFrequency.slice(-3).reduce((s, d) => s + d.count, 0)
    escalationRate = earlyCount > 0 ? +((lateCount - earlyCount) / earlyCount * 100).toFixed(1) : 0
  }

  return {
    mostActiveActor: topEntry(byActor),
    mostTargetedCountry: topEntry(byCountry),
    dominantEventType: topEntry(byType),
    dailyFrequency,
    escalationRate,
  }
}

export function buildTrendSummary(events: NormalizedEvent[], trends: TrendAnalysis): TrendSummary {
  const total = events.length
  const actor = trends.mostActiveActor
  const esc = trends.escalationRate

  const actorPart = actor !== 'Unknown' ? `${actor.toUpperCase()} most active` : 'No clear actor pattern'
  const escPart = esc > 0 ? `${esc}% escalation trend` : 'Stable activity'

  return {
    summary: `Last 14 days: ${total} incidents. ${actorPart}. ${escPart}.`,
    dailyAvg: (total / 14).toFixed(1),
  }
}

// ── Response impact analysis (adapted from MIT) ──

export function analyzeResponseImpact(events: NormalizedEvent[]): ReactionWindow | null {
  const withResponse = events.filter(e => e.responseHours != null && e.responseHours > 0)
  if (withResponse.length < 6) return null

  const times = withResponse.map(e => e.responseHours!).sort((a, b) => a - b)
  const medianTime = times[Math.floor(times.length / 2)]
  const fast = withResponse.filter(e => e.responseHours! <= medianTime)
  const slow = withResponse.filter(e => e.responseHours! > medianTime)

  if (fast.length < 2 || slow.length < 2) return null

  const fastAvg = fast.reduce((s, e) => s + e.severity, 0) / fast.length
  const slowAvg = slow.reduce((s, e) => s + e.severity, 0) / slow.length

  return {
    medianResponseHours: +medianTime.toFixed(1),
    fastResponseImpact: +fastAvg.toFixed(1),
    slowResponseImpact: +slowAvg.toFixed(1),
  }
}
