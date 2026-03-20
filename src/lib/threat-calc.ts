import type { Incident, PriceData, AirspaceData } from '@/hooks/useDataPipeline'

export function calcThreat(incidents: Incident[], prices: PriceData | null, airspace: AirspaceData | null): string {
  if (!incidents.length) {
    return `HADAL THREAT CALC — NO DATA\n\nTHEATRE THREAT INDEX: —/100\nCLASSIFICATION: UNKNOWN\n\nNO LIVE PIPELINE DATA AVAILABLE\nUNABLE TO COMPUTE THREAT ASSESSMENT\n\nREQUIRED: INCIDENT FEED ACTIVE\nSTATUS: AWAITING DATA\n\nSOURCE: HADAL PIPELINE (OFFLINE)`
  }
  const total = incidents.length

  // Count by verification tiers
  const critical = incidents.filter(i => (i.credibility ?? 0) >= 90).length
  const high = incidents.filter(i => (i.credibility ?? 0) >= 80 && (i.credibility ?? 0) < 90).length
  const confirmed = incidents.filter(i => i.status === 'confirmed').length
  const govSources = incidents.filter(i => i.is_government).length

  // Weighted score: base 40 + credibility component + confirmation component + gov source bonus
  const credComponent = Math.min(35, ((critical * 3 + high * 1.5) / total) * 35)
  const confirmComponent = Math.min(15, (confirmed / total) * 15)
  const govBonus = Math.min(10, (govSources / total) * 10)
  const score = Math.min(99, Math.floor(40 + credComponent + confirmComponent + govBonus))

  const classification = score >= 85 ? 'CRITICAL' : score >= 70 ? 'HIGH' : score >= 50 ? 'ELEVATED' : 'MODERATE'

  // Confidence band based on sample size
  const sampleConf = total >= 50 ? 'HIGH' : total >= 20 ? 'MODERATE' : 'LOW'

  const airClosed = airspace?.severity_counts?.CRITICAL ?? 0
  const oilPrice = prices?.brent?.price ?? null

  return [
    `HADAL THREAT CALC — LIVE DATA`,
    ``,
    `THEATRE THREAT INDEX: ${score}/100`,
    `CLASSIFICATION: ${classification}`,
    `CONFIDENCE: ${sampleConf} (n=${total})`,
    ``,
    `INCIDENT BREAKDOWN:`,
    `  TOTAL: ${total}`,
    `  CRITICAL CREDIBILITY (≥90): ${critical}`,
    `  HIGH CREDIBILITY (≥80): ${high}`,
    `  CONFIRMED: ${confirmed}`,
    `  GOVERNMENT SOURCES: ${govSources}`,
    ``,
    `CONTEXT:`,
    `  AIRSPACE CRITICAL NOTAMS: ${airClosed}`,
    `  BRENT CRUDE: ${oilPrice !== null ? '$' + oilPrice.toFixed(2) : 'N/A'}`,
    ``,
    `SOURCE: HADAL OSINT PIPELINE`,
    `GENERATED: ${new Date().toISOString()}`,
  ].join('\n')
}
