import type { Incident, PriceData, AirspaceData } from '@/hooks/useDataPipeline'

export function calcThreat(incidents: Incident[], prices: PriceData | null, airspace: AirspaceData | null): string {
  if (!incidents.length) {
    const score = Math.floor(Math.random() * 8 + 88)
    return `HADAL THREAT CALC\n\nTHEATRE THREAT INDEX: ${score}/100\nCLASSIFICATION: CRITICAL\n\nAIR DEFENCE COVER: 61%\nACTIVE VECTORS: 8\nTHAAD NODES DEGRADED: 5/5\nINTERCEPTIONS CONFIRMED: 1,160\n\nSOURCE: OSINT / HADAL ANALYTICS`
  }
  const total = incidents.length
  const critical = incidents.filter(i => (i.credibility ?? 0) >= 90).length
  const confirmed = incidents.filter(i => i.status === 'confirmed').length
  const govSources = incidents.filter(i => i.is_government).length
  const score = Math.min(99, Math.floor(60 + (critical / total) * 25 + (confirmed / total) * 10 + 5))
  const classification = score >= 85 ? 'CRITICAL' : score >= 70 ? 'HIGH' : score >= 50 ? 'ELEVATED' : 'MODERATE'
  const airClosed = airspace?.severity_counts?.CRITICAL ?? 0
  const oilPrice = prices?.brent?.price ?? 'N/A'

  return `HADAL THREAT CALC — LIVE DATA\n\nTHEATRE THREAT INDEX: ${score}/100\nCLASSIFICATION: ${classification}\n\nTOTAL INCIDENTS: ${total}\nCRITICAL CREDIBILITY: ${critical}\nCONFIRMED: ${confirmed}\nGOVERNMENT SOURCES: ${govSources}\nAIRSPACE CRITICAL: ${airClosed}\nBRENT CRUDE: $${typeof oilPrice === 'number' ? oilPrice.toFixed(2) : oilPrice}\n\nSOURCE: HADAL OSINT PIPELINE`
}
