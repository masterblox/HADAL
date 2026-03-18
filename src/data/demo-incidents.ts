import type { Incident } from '../hooks/useDataPipeline'

/** Demo incidents for rendering when live data is empty or < 5 events.
 *  Tuned for realistic sequence-model output: varied timing, mixed types,
 *  staggered countries — so follow-on probabilities range 25–75% instead
 *  of clustering at 95%. */
export const demoIncidents: Incident[] = [
  // Day 1 — single high-profile event
  { title: 'IRGC Ballistic Launch — Khorramshahr-4 Complex', type: 'missile', source: 'SAT/NRO', credibility: 94, published: new Date(Date.now() - 1 * 86400000).toISOString(), location: { lat: 32.4, lng: 51.6, country: 'Iran' }, casualties: { military: 0, civilian: 0 } },
  // Day 2 — intercept + drone in different countries
  { title: 'UAE Air Defense Intercept — Al Dhafra AB', type: 'intercept', source: 'UAE MoD', credibility: 82, published: new Date(Date.now() - 2 * 86400000).toISOString(), location: { lat: 24.25, lng: 54.55, country: 'UAE' }, casualties: { military: 0, civilian: 0 } },
  { title: 'Houthi Drone Swarm — Red Sea Commercial Lane', type: 'drone', source: 'UKMTO', credibility: 72, published: new Date(Date.now() - 2 * 86400000).toISOString(), location: { lat: 14.8, lng: 42.1, country: 'Yemen' }, casualties: { military: 0, civilian: 2 } },
  // Day 4 — gap day, then missile
  { title: 'Ballistic Salvo — Multi-warhead Tehran Origin', type: 'missile', source: 'MoD', credibility: 88, published: new Date(Date.now() - 4 * 86400000).toISOString(), location: { lat: 24.45, lng: 54.65, country: 'UAE' }, casualties: { military: 3, civilian: 1 } },
  // Day 5 — diplomatic (low-severity, breaks monotone kinetic pattern)
  { title: 'UN Security Council Emergency Session — Gulf Crisis', type: 'diplomatic', source: 'UN', credibility: 95, published: new Date(Date.now() - 5 * 86400000).toISOString(), location: { lat: 40.75, lng: -73.97, country: 'United States' }, casualties: { military: 0, civilian: 0 } },
  // Day 6 — airstrike, different country
  { title: 'CENTCOM Airstrike — IRGC Command Node', type: 'airstrike', source: 'CENTCOM', credibility: 91, published: new Date(Date.now() - 6 * 86400000).toISOString(), location: { lat: 33.3, lng: 44.4, country: 'Iraq' }, casualties: { military: 12, civilian: 0 } },
  // Day 7 — naval
  { title: 'Hormuz Strait Closure — Commercial Traffic Halted', type: 'naval', source: 'UKMTO', credibility: 78, published: new Date(Date.now() - 7 * 86400000).toISOString(), location: { lat: 26.6, lng: 56.2, country: 'Iran' }, casualties: { military: 0, civilian: 0 } },
  // Day 8 — ground op (new type not in old demo)
  { title: 'IDF Ground Incursion — Southern Lebanon', type: 'ground', source: 'IDF', credibility: 85, published: new Date(Date.now() - 8 * 86400000).toISOString(), location: { lat: 33.1, lng: 35.2, country: 'Lebanon' }, casualties: { military: 4, civilian: 0 } },
  // Day 9 — cyber (low severity, different domain)
  { title: 'SCADA Breach — Kharg Island Terminal', type: 'cyber', source: 'CrowdStrike', credibility: 68, published: new Date(Date.now() - 9 * 86400000).toISOString(), location: { lat: 29.2, lng: 50.3, country: 'Iran' }, casualties: { military: 0, civilian: 0 } },
  // Day 10 — drone, spaced from earlier drone
  { title: '6 US Soldiers KIA — Port Shuaiba Drone Attack', type: 'drone', source: 'DoD', credibility: 96, published: new Date(Date.now() - 10 * 86400000).toISOString(), location: { lat: 29.0, lng: 48.2, country: 'Kuwait' }, casualties: { military: 6, civilian: 0 } },
  // Day 11 — missile, different country
  { title: 'Hezbollah Rocket Barrage — Northern Israel', type: 'missile', source: 'IDF', credibility: 87, published: new Date(Date.now() - 11 * 86400000).toISOString(), location: { lat: 33.0, lng: 35.5, country: 'Israel' }, casualties: { military: 1, civilian: 4 } },
  // Day 13 — lone event after gap
  { title: 'Saudi Patriot Engagement — Riyadh Corridor', type: 'intercept', source: 'SPA', credibility: 75, published: new Date(Date.now() - 13 * 86400000).toISOString(), location: { lat: 24.7, lng: 46.7, country: 'Saudi Arabia' }, casualties: { military: 0, civilian: 0 } },
]
