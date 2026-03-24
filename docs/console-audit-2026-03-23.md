# HADAL Console — Full Architecture Audit & Ayn Integration Plan

**Date:** 2026-03-23
**From:** HADAL frontend
**To:** Nikola (Ayn backend)
**Purpose:** Align on Console page build, tile inventory, API contracts, and Ayn engine integration
**Repo:** HADAL (`github.com/carlosprada/hadal`) + Ayn (`github.com/nKOxxx/ayn`)

---

## What This Document Is

We're building a **Console page** — a customizable tile-based workspace where analysts can compose their own operational view by selecting and arranging tiles from available capabilities.

This audit maps **everything we can turn into a tile** from both HADAL's existing frontend and Ayn's engines, proposes the API contracts HADAL needs to consume Ayn data, and lays out the phased implementation plan.

The goal: stop noodling on static previews and start building a real page with real data.

---

## 1. The Concept: Console

**Route:** `#console` — 4th lane in HADAL alongside Overview, Operations, Analysis.

**What it is:** A configurable grid of tiles. Each tile is a self-contained data surface — a chart, a feed, a metric cluster, a map, a table. The analyst picks which tiles they want visible, arranges them in a grid, and saves the layout.

**Why it matters:** The current HADAL shell forces a fixed vertical scroll. Overview shows everything stacked. An analyst doing shift briefing doesn't need the same view as one tracking a developing incident. Console lets them build the view they need.

**Layout model:** CSS Grid, 4 columns × 3 rows, full viewport height. Tiles snap to grid cells and can span multiple cells.

**V1 interaction:** Tile picker sidebar (no drag-and-drop yet). Click to add/remove tiles. 3-4 preset layouts ("Shift Brief", "Incident Focus", "Full Overview"). Saved to localStorage.

---

## 2. What HADAL Already Has (Live on Main)

HADAL's current production build already renders **28 data surfaces** that are tiles in everything but name. They just need the tile frame wrapped around them. No backend changes needed for any of these.

### Current Data Pipeline

| Endpoint | Type | Refresh | Status |
|----------|------|---------|--------|
| `/public/incidents.json` | `Incident[]` — lat/lng, type, source, credibility, casualties, verification | 60s | LIVE |
| `/public/prices.json` | `PriceData` — Brent, Gold, Gas, Bitcoin with 24h change % | 60s | LIVE |
| `/public/airspace.json` | `AirspaceData` — NOTAMs, severity counts, airports tracked | 60s | LIVE |
| `/public/verified_incidents.json` | Verification groups — badge, score, source count | 60s | LIVE |
| `/public/regional_stats.json` | Country-level casualty, missile, airstrike, drone stats | 5min | LIVE |

**Derived locally (pure TypeScript, no backend):**
- `usePrediction()` — sequence model producing threat level (0-100), scenarios with probabilities, cascade risk, time windows (24H/72H/7D), severity distribution percentiles, trend analysis
- Kinetic classification — regex-based missile/drone/cruise tagging from incident titles
- GCC country aggregation — incident counts per country
- Verification merge — dedup + badge assignment from verified groups

### HADAL Tile Inventory (28 tiles)

#### Group A — Direct Adaptation (component exists, wrap in tile frame)

| # | Tile | What It Shows | Data Source |
|---|------|--------------|-------------|
| T01 | **Threat Signal** | Threat level gauge (0-100), 4 signal chips (mean severity, cascade, airspace pressure, reaction window), pipeline status dots (INC/MKT/AIR/VER/PRD), GCC country snapshot | prediction + incidents + pipeline health |
| T02 | **Pressure Globe** | Canvas 2D globe with real-time incident markers plotted by lat/lng, pressure heatmap overlay, radial tick grid | incidents[] (lat/lng coordinates) |
| T03 | **Market Impact** | Brent crude price + 24h change %, Gold price + change, Gas price + change | prices.json |
| T04 | **Airspace Status** | Total NOTAMs count, Critical/High severity count, Airports tracked | airspace.json |
| T05 | **Tempo** | Daily average events, 24H event count, 72H event count | prediction.timeWindows + trendSummary |
| T06 | **Intelligence** | Top actor (most active), Top target country, Escalation rate % | prediction.trendAnalysis |
| T07 | **Kinetic Data** | Kinetic load total + ballistic/cruise/drone breakdown, Country table (UAE, Kuwait, Qatar, Bahrain) with per-country counts and status dots | incidents[] (regex-classified) |
| T08 | **Scenario Outlook** | Dominant scenario name, P(SEVERE) %, P(CRITICAL) %, Top 5 scenario table with probability, timeframe, severity, confidence | prediction.scenarios |
| T09 | **Threat Feed** | Region-filtered (ALL/UAE/GULF/IRAN/RED SEA/ISRAEL) incident priority queue with ID, region, type, severity chip, source, confidence %, verification badge | incidents[] + verified_incidents.json |
| T10 | **Theatre Exchange** | Intercepts count, incidents tracked, countries in scope, pipeline freshness | incidents[] (derived counts) |

#### Group B — Decomposed from Existing Monoliths

These are sections within larger components that become independent tiles when extracted. Same data, just unboxed.

| # | Tile | What It Shows | Extracted From |
|---|------|--------------|---------------|
| T11 | **Prediction Signals** | 5 signal bars: Mean Severity, P(SEVERE), P(CRITICAL), Cascade, Airspace — each with value + severity-colored fill bar | PredictorEngine → signals section |
| T12 | **Severity Distribution** | Percentile fan visualization — P5, P25, P50 (median), P75, P95 with zone markers at 70% and 90%, standard deviation | PredictorEngine → distribution fan |
| T13 | **Cascade Risk** | Contagion score + fill bar, Cluster count, Max chain size, Response latency (median hours), Fast/slow impact comparison bars, Dominant scenario | PredictorEngine → cascade board |
| T14 | **Time Horizons** | 24H / 72H / 7D — each with severity bar + event count bar, Reaction window (median response hours) | PredictorEngine → horizons section |
| T15 | **Kill Chain** | Table: ID, Time, Weapon type (ballistic/drone/cruise), Outcome (INTERCEPT/IMPACT/UNCONFIRMED), Confidence %, Source. Summary: intercepted / impact / unconfirmed counts | KillChainTracker (sub-component of MissileDefenseStrip) |
| T16 | **Event Timeline** | 14-day AreaChart — all events line + kinetic overlay line, day-by-day | AnalysisSection → chart 1 (recharts) |
| T17 | **Geographic Concentration** | Horizontal BarChart — top 8 countries ranked by incident count | AnalysisSection → chart 2 (recharts) |
| T18 | **Type Profile** | RadarChart — incident type distribution (missile, drone, airstrike, ground, diplomatic, etc.) | AnalysisSection → chart 3 (recharts) |
| T19 | **Feed Quality** | Horizontal BarChart — sources ranked by event count, tooltip shows average credibility % | AnalysisSection → chart 4 (recharts) |
| T20 | **Analysis Summary** | 4 stat cards: Total Events (14-day window), Kinetic % of total, Casualties (mil + civ), Countries affected | AnalysisSection → summary strip |
| T21 | **Market Cards** | 4 cards: Brent (CO1/ICE), Gold (XAU/OTC), Gas (NG1/NYMEX), Bitcoin (BTC/XCRY) — each with price, 24h change, sparkline chart, LIVE/SIM status, bullish/bearish | EconomicSection → market cards (recharts sparklines) |
| T22 | **FX Board** | 6-column table: currency pair, description, last price, change %, depth, flow direction | EconomicSection → FX table (static data from gulf-economic.ts) |
| T23 | **Dubai Real Estate** | 5-column table: area (Downtown, Marina, JBR, Palm, Creek Harbour), war premium %, 7D move, bias (RISK BID/SOFTENING), occupancy % | EconomicSection → DRE table (static data) |
| T24 | **Regional Stats** | Country-filtered panel (14 countries) with 4 stat boxes: Casualties, Missiles, Airstrikes, Drones. Country view adds flag, trend badge, recent events list | RegionalPanel (regional_stats.json) |
| T25 | **Regional Casualties** | Single stat box: total casualties, military/civilian split | RegionalPanel → stat box |
| T26 | **Regional Missiles** | Single stat box: launched, intercepted, landed | RegionalPanel → stat box |
| T27 | **Regional Airstrikes** | Single stat box: total strikes | RegionalPanel → stat box |
| T28 | **Regional Drones** | Single stat box: total drones, downed count | RegionalPanel → stat box |

---

## 3. What Ayn Adds (Nikola's Engines)

From `DAILY_FEATURES.md` and the Skyline tab spec, Ayn provides **7 engines** that map to **14 new tiles** in HADAL's Console. These are real capabilities with real data sources — not previews.

### Ayn Engine → HADAL Tile Mapping

#### Argus — Entity Resolution & Threat Intelligence
**Engine:** `src/lib/argus.ts`
**What it does:** Links same entities across events, scores threats 0-100, builds country threat matrix, tracks nations/organizations/military units.

| # | Tile | What HADAL Shows | Size |
|---|------|-----------------|------|
| T29 | **Entity Threats** | Top threats list — entity name, threat score (0-100), level badge (low/medium/high/critical), associated country. Ranked by score. | 1×1 |
| T30 | **Country Threat Matrix** | All tracked countries in a grid — code, threat score, trend indicator (escalating/stable/de-escalating). Color-coded by level. | 2×1 |
| T31 | **Entity Network** | Linked entities visualization — shows how nations, organizations, and military units connect across events. Could be a simple adjacency list/table in V1, graph viz in V2. | 2×2 |

#### Chatter — Social Media & News Intelligence
**Engine:** `src/lib/chatter.ts`
**What it does:** Aggregates from Telegram, Discord, Reddit, Twitter. Extracts hot topics. Assigns urgency levels. Tracks 8 default sources.

| # | Tile | What HADAL Shows | Size |
|---|------|-----------------|------|
| T32 | **Chatter Feed** | Scrolling post list — platform icon, source name, text preview, urgency badge (high/medium/low), timestamp. Filter by platform. | 2×1 |
| T33 | **Hot Topics** | Trending keywords/phrases ranked by mention count with trend arrow. Top 8-10 topics. | 1×1 |
| T34 | **Platform Activity** | Per-platform signal count + online/offline status. TG: X signals, Discord: X signals, etc. Bar or dot indicator per platform. | 1×1 |

#### Ignite — NASA FIRMS Thermal Detection
**Engine:** `src/lib/ignite.ts`
**What it does:** Real-time fire/heat detection from VIIRS and MODIS satellites via NASA FIRMS API. Classifies heat levels, breaks down by country, generates intelligence insights.

| # | Tile | What HADAL Shows | Size |
|---|------|-----------------|------|
| T35 | **Thermal Map** | Heat detections plotted on a map or listed by country — detection count, heat level breakdown (low/medium/high/extreme), satellite source (VIIRS/MODIS), 24h comparison delta | 2×1 |
| T36 | **Heat Anomalies** | Filtered to high/extreme only — potential infrastructure fires, gas flare anomalies, military position indicators. Location, intensity, intelligence assessment. | 1×1 |

#### Chronos — Temporal Change Detection
**Engine:** `src/lib/chronos.ts`
**What it does:** Compares thermal snapshots over time. Detects NEW heat sources (potential new positions), REMOVED sources, INCREASED activity, DECREASED activity. 7-day and 30-day comparison modes.

| # | Tile | What HADAL Shows | Size |
|---|------|-----------------|------|
| T37 | **Change Detection** | Change summary: N new, N removed, N increased, N decreased. Table of changes with location, change type, severity, source classification. Toggle between 7d and 30d. | 2×1 |

#### Skyline — Operational Weather Intelligence
**What it does:** Weather for 14 Gulf cities (Dubai, Tehran, Riyadh, Doha, Muscat, etc.). Current conditions + operation feasibility scores (Drone/Aircraft/Missile/Satellite/Ground 0-100%) + weather alerts with operational impact + 5-day forecast + 77-day history.
**APIs:** OpenWeatherMap (real-time + forecast) + Open-Meteo (free, historical)

| # | Tile | What HADAL Shows | Size |
|---|------|-----------------|------|
| T38 | **Ops Weather** | Selected city: temp, wind, humidity, clouds, visibility. 5 operation score bars (Drone/Aircraft/Missile/Satellite/Ground) each 0-100%. This is the key tile — weather as operational constraint. | 1×1 |
| T39 | **Theatre Weather Grid** | All 14 cities in a compact matrix: city name, temp, wind speed, visibility, top constraint (the lowest-scoring operation type). Scan all cities at once. | 2×1 |
| T40 | **Weather Alerts** | Active advisories: "High Wind — Drone ops NOT RECOMMENDED", "Low Visibility — Aircraft ops degraded", "Sandstorm — ALL OPERATIONS NOT POSSIBLE". Each with affected city, impact tag, recommendation. | 1×1 |

#### Military Signals — ADS-B + AIS Combined
**Engine:** Tab 5 in Ayn
**What it does:** Combined aircraft (ADS-B) and vessel (AIS) tracking.

| # | Tile | What HADAL Shows | Size |
|---|------|-----------------|------|
| T41 | **ADS-B / AIS Signals** | Split view or tabbed: aircraft tracks (ICAO, callsign, type, altitude, speed, heading) + vessel tracks (MMSI, name, type, SOG, COG, AIS gap duration). Anomaly flags (squawk 7700, AIS gap > 30min). | 2×2 |

#### Reports — Briefing Generation
**Engine:** Tab 12 in Ayn
**What it does:** Generates intelligence assessment documents.

| # | Tile | What HADAL Shows | Size |
|---|------|-----------------|------|
| T42 | **Briefing** | Latest generated report: serial number, DTG, classification, situation summary, key judgments, outlook. Structured sections. | 2×1 |

---

## 4. Capability Preview — Revised Honest Status

The original capability preview (`docs/hadal-v2-capability-preview.html`) had 16 tiles. Here's what's real now with Ayn in the picture:

| # | Preview Name | Was | Now | What Changed |
|---|-------------|-----|-----|-------------|
| 01 | Event → Signal → Entity | FORK / architecture diagram | **REAL — Argus** | Argus provides entity resolution, threat scoring, entity linking. No longer a diagram. |
| 02 | Confidence Explanation | PARTIAL | PARTIAL | Verification data exists on incidents. Needs dedicated UI component. |
| 03 | Cross-Source Verification | PARTIAL | **REAL — Chatter extends this** | Verification badges exist + Chatter adds cross-platform corroboration. |
| 04 | Signal Ingestion | FORK / remove | DEFER | Still architecture-only. Venus Trap may provide signal flow viz — evaluate later. |
| 05 | ADS-B Aircraft | REAL | **REAL — Ayn Military Signals** | HADAL has `useOpenSky`, Ayn has combined ADS-B + AIS. |
| 06 | AIS Maritime | FAKE (hardcoded vessels) | **REAL — Ayn Military Signals** | Ayn tab 5 includes AIS tracking. |
| 07 | Satellite | FAKE (char-art) | **REAL — Ignite** | NASA FIRMS thermal detection replaces decorative satellite tile with actual satellite-derived data. |
| 08 | Military Signals | FAKE (no SIGINT) | **PARTIAL — ADS-B/AIS only** | Ayn provides ADS-B + AIS. ELINT/COMINT still doesn't exist — don't overclaim. |
| 09 | Airspace Monitoring | REAL | REAL | airspace.json already provides NOTAMs, severity, airports. |
| 10 | Map-First Operations | REAL | REAL | Globe canvas + live incident markers. |
| 11 | Prediction / Scenario | REAL | REAL | Local prediction engine. |
| 12 | Stats / Intelligence | PARTIAL | **REAL — Argus extends** | HADAL metrics + Argus entity-level intelligence. |
| 13 | Mech Archive | DECORATIVE | DECORATIVE | Brand identity. Not a capability tile. |
| 14 | Reports / Briefing | PARTIAL | **REAL — Ayn Reports** | Ayn reports engine provides actual generated content. |
| 15 | Mini-Services | INFRA diagram | REMOVE | Still an architecture diagram. Not user-facing. |
| 16 | Chatter | FAKE (zero data) | **REAL — Ayn Chatter** | 4 platforms, 8 default sources, urgency levels, hot topics. |
| — | Skyline | NOT IN PREVIEW | **NEW** | Operational weather intelligence — entirely new capability from Ayn. |

**Score: 12 of 16 preview tiles are now backed by real data. 1 removed. 1 deferred. 1 decorative. 1 partial.**

---

## 5. API Contracts — What HADAL Needs from Ayn

HADAL consumes data by polling JSON endpoints. Same pattern as the existing pipeline: `fetch('/endpoint.json').catch(() => fetch('public/endpoint.json'))`, parse, render. No WebSockets needed. No GraphQL.

For each Ayn engine, HADAL needs a single JSON endpoint returning the shape below. Nikola serves these; HADAL polls and renders.

### Argus

**Endpoint:** `/api/argus.json` or equivalent
**Refresh:** 60 seconds
**Shape:**
```json
{
  "threats": [
    {
      "entity": "IRGC",
      "type": "organization",
      "score": 87,
      "level": "critical",
      "country": "iran",
      "linkedEvents": 14,
      "lastSeen": "2026-03-23T14:30:00Z"
    }
  ],
  "countries": [
    {
      "code": "iran",
      "name": "Iran",
      "score": 82,
      "level": "critical",
      "trend": "escalating",
      "entityCount": 6
    }
  ],
  "links": [
    {
      "from": "IRGC",
      "to": "Shahab-3",
      "type": "operates",
      "strength": 0.94
    }
  ],
  "lastUpdated": "2026-03-23T14:30:00Z"
}
```

### Chatter

**Endpoint:** `/api/chatter.json`
**Refresh:** 30 seconds
**Shape:**
```json
{
  "posts": [
    {
      "id": "ch-001",
      "platform": "telegram",
      "source": "Middle East Updates",
      "text": "Reports of military convoy movement near Bandar Abbas port...",
      "urgency": "high",
      "timestamp": "2026-03-23T14:28:00Z",
      "keywords": ["military", "Bandar Abbas", "convoy"]
    }
  ],
  "topics": [
    {
      "keyword": "Bandar Abbas",
      "count": 47,
      "trend": "rising",
      "platforms": ["telegram", "twitter"]
    }
  ],
  "platforms": {
    "telegram": { "sources": 3, "signals": 124, "status": "online" },
    "discord": { "sources": 1, "signals": 38, "status": "online" },
    "reddit": { "sources": 3, "signals": 67, "status": "online" },
    "twitter": { "sources": 2, "signals": 91, "status": "online" }
  },
  "lastUpdated": "2026-03-23T14:28:00Z"
}
```

### Ignite

**Endpoint:** `/api/ignite.json`
**Refresh:** 5 minutes
**Shape:**
```json
{
  "detections": [
    {
      "lat": 27.1834,
      "lng": 56.2741,
      "level": "extreme",
      "satellite": "VIIRS",
      "confidence": 95,
      "country": "iran",
      "frp": 142.3,
      "timestamp": "2026-03-23T13:45:00Z"
    }
  ],
  "byCountry": {
    "iran": { "total": 34, "extreme": 2, "high": 8, "medium": 14, "low": 10 },
    "saudi": { "total": 12, "extreme": 0, "high": 1, "medium": 4, "low": 7 },
    "iraq": { "total": 28, "extreme": 1, "high": 5, "medium": 12, "low": 10 }
  },
  "summary": {
    "totalDetections": 156,
    "extremeCount": 5,
    "delta24h": "+12"
  },
  "insights": [
    "Extreme heat signature near Kharg Island — possible refinery flare anomaly",
    "New cluster of detections in southern Iraq — 3 sources, appeared in last 6h"
  ],
  "lastUpdated": "2026-03-23T13:45:00Z"
}
```

### Chronos

**Endpoint:** `/api/chronos.json`
**Refresh:** 5 minutes
**Shape:**
```json
{
  "comparison": "7d",
  "changes": [
    {
      "lat": 32.6158,
      "lng": 44.0237,
      "type": "new",
      "severity": "high",
      "description": "New heat source — potential military position",
      "firstSeen": "2026-03-20T08:00:00Z",
      "country": "iraq"
    },
    {
      "lat": 27.4891,
      "lng": 52.6150,
      "type": "increased",
      "severity": "medium",
      "description": "Gas flare activity increase — Assaluyeh industrial zone",
      "delta": "+340%",
      "country": "iran"
    }
  ],
  "summary": {
    "new": 8,
    "removed": 3,
    "increased": 12,
    "decreased": 5
  },
  "lastUpdated": "2026-03-23T13:45:00Z"
}
```

### Skyline

**Endpoint:** `/api/skyline.json`
**Refresh:** 5 minutes
**Shape:**
```json
{
  "cities": [
    {
      "name": "Dubai",
      "country": "uae",
      "temp": 34,
      "wind": 18,
      "humidity": 45,
      "clouds": 12,
      "visibility": 9500,
      "conditions": "Clear",
      "ops": {
        "drone": 82,
        "aircraft": 95,
        "missile": 90,
        "satellite": 88,
        "ground": 75
      }
    },
    {
      "name": "Tehran",
      "country": "iran",
      "temp": 22,
      "wind": 35,
      "humidity": 28,
      "clouds": 65,
      "visibility": 4200,
      "conditions": "Windy, Partly Cloudy",
      "ops": {
        "drone": 35,
        "aircraft": 68,
        "missile": 72,
        "satellite": 40,
        "ground": 60
      }
    }
  ],
  "alerts": [
    {
      "city": "Tehran",
      "type": "wind",
      "severity": "warning",
      "message": "High Wind Advisory — Drone ops: NOT RECOMMENDED",
      "impact": ["drone", "satellite"],
      "validUntil": "2026-03-23T20:00:00Z"
    }
  ],
  "lastUpdated": "2026-03-23T14:00:00Z"
}
```

### Military Signals

**Endpoint:** `/api/signals.json`
**Refresh:** 30 seconds
**Shape:**
```json
{
  "aircraft": [
    {
      "icao": "A4F2B8",
      "callsign": "VIPER21",
      "type": "military",
      "acType": "F-35A",
      "alt": 34000,
      "speed": 480,
      "heading": 47.2,
      "lat": 25.276,
      "lng": 55.296,
      "squawk": "7700",
      "anomaly": true,
      "timestamp": "2026-03-23T14:30:00Z"
    }
  ],
  "vessels": [
    {
      "mmsi": "211234567",
      "name": "HORMUZ SPIRIT",
      "type": "crude_tanker",
      "flag": "IR",
      "sog": 8.2,
      "cog": 142,
      "lat": 26.42,
      "lng": 56.18,
      "gap": 47,
      "anomaly": true,
      "timestamp": "2026-03-23T14:28:00Z"
    }
  ],
  "summary": {
    "totalAircraft": 12,
    "militaryAircraft": 3,
    "totalVessels": 31,
    "aisGaps": 4,
    "anomalies": 2
  },
  "lastUpdated": "2026-03-23T14:30:00Z"
}
```

### Reports

**Endpoint:** `/api/report.json`
**Refresh:** On-demand (poll every 5 min, only re-render if serial changes)
**Shape:**
```json
{
  "serial": "HADAL-2026-0323-001",
  "dtg": "20260323143000Z",
  "classification": "TS//SI//NOFORN",
  "distribution": "HADAL OPERATORS ONLY",
  "sections": [
    {
      "title": "1. SITUATION",
      "body": "Theatre threat level ORANGE (67/100). Primary driver: IRGC posture shift. 4 kinetic events in 24h window."
    },
    {
      "title": "2. KEY JUDGMENTS",
      "body": "Escalation dominant (P=34%). Naval blockade risk +4%. ADS-B anomalies correlate SAM activity. Social chatter spike across 3 platforms."
    },
    {
      "title": "3. OUTLOOK",
      "body": "72h: DETERIORATING. Cascade 0.62. Sources: GOV+NEWS+CHATTER+SNSR."
    }
  ],
  "generatedAt": "2026-03-23T14:30:00Z"
}
```

---

## 6. Full Tile Inventory — 42 Tiles

### Summary

| Group | Count | Data Status | Build Phase |
|-------|-------|------------|-------------|
| A: HADAL Core (existing components) | 10 | LIVE | Phase 1 |
| B: HADAL Decomposed (extracted from monoliths) | 18 | LIVE / STATIC | Phase 1-2 |
| C: Ayn-Powered (Nikola provides APIs) | 14 | PENDING API | Phase 2 |
| **Total** | **42** | | |

### Quick Reference Table

| # | Tile | Group | Data | Phase |
|---|------|-------|------|-------|
| T01 | Threat Signal | A | prediction + incidents + health | 1 |
| T02 | Pressure Globe | A | incidents (lat/lng) | 1 |
| T03 | Market Impact | A | prices.json | 1 |
| T04 | Airspace Status | A | airspace.json | 1 |
| T05 | Tempo | A | prediction.timeWindows | 1 |
| T06 | Intelligence | A | prediction.trendAnalysis | 1 |
| T07 | Kinetic Data | A | incidents (regex) | 1 |
| T08 | Scenario Outlook | A | prediction.scenarios | 1 |
| T09 | Threat Feed | A | incidents + verified | 1 |
| T10 | Theatre Exchange | A | incidents (derived) | 1 |
| T11 | Prediction Signals | B | prediction.global | 1 |
| T12 | Severity Distribution | B | prediction.percentiles | 1 |
| T13 | Cascade Risk | B | prediction.cascadeRisk | 1 |
| T14 | Time Horizons | B | prediction.timeWindows | 1 |
| T15 | Kill Chain | B | incidents (kinetic) | 1 |
| T16 | Event Timeline | B | incidents by date | 1 |
| T17 | Geographic Concentration | B | incidents by country | 1 |
| T18 | Type Profile | B | incidents by type | 1 |
| T19 | Feed Quality | B | incidents by source | 1 |
| T20 | Analysis Summary | B | incidents (derived) | 1 |
| T21 | Market Cards | B | prices (sparklines) | 2 |
| T22 | FX Board | B | static (gulf-economic.ts) | 2 |
| T23 | Dubai Real Estate | B | static (gulf-economic.ts) | 2 |
| T24 | Regional Stats | B | regional_stats.json | 2 |
| T25 | Regional Casualties | B | regional_stats.json | 2 |
| T26 | Regional Missiles | B | regional_stats.json | 2 |
| T27 | Regional Airstrikes | B | regional_stats.json | 2 |
| T28 | Regional Drones | B | regional_stats.json | 2 |
| T29 | Entity Threats | C | Argus API | 2 |
| T30 | Country Threat Matrix | C | Argus API | 2 |
| T31 | Entity Network | C | Argus API | 2 |
| T32 | Chatter Feed | C | Chatter API | 2 |
| T33 | Hot Topics | C | Chatter API | 2 |
| T34 | Platform Activity | C | Chatter API | 2 |
| T35 | Thermal Map | C | Ignite API | 2 |
| T36 | Heat Anomalies | C | Ignite API | 2 |
| T37 | Change Detection | C | Chronos API | 2 |
| T38 | Ops Weather | C | Skyline API | 2 |
| T39 | Theatre Weather Grid | C | Skyline API | 2 |
| T40 | Weather Alerts | C | Skyline API | 2 |
| T41 | ADS-B / AIS Signals | C | Military Signals API | 2 |
| T42 | Briefing | C | Reports API | 2 |

---

## 7. Implementation Phases

### Phase 1 — Console Shell + HADAL Tiles

**What ships:** Console page with 20 tiles (T01-T20), all backed by existing HADAL pipeline. No Ayn dependencies. No new backend endpoints.

| Task | Scope |
|------|-------|
| Add `console` to Lane type in `lane-routing.ts` | 1 file, ~5 lines |
| Create `src/pages/ConsolePage.tsx` | New page, lazy-loaded like Operations/Analysis |
| Create `src/components/console/TileRegistry.ts` | Tile definitions array (id, name, category, size constraints, component ref) |
| Create `src/components/console/ConsoleGrid.tsx` | CSS Grid container — 4×3, gap 3px, full viewport |
| Create `src/components/console/TilePicker.tsx` | Sidebar tile selector, toggled by existing sandbox button |
| Create `src/components/console/TileWrapper.tsx` | Tile chrome — number overlay, label bar, status badge, border treatment |
| Extract SituationStrip blocks as tiles | Split 1 component → 4 tiles (T03-T06). Keep SituationStrip intact on Overview page. |
| Extract AnalysisSection charts as tiles | 4 chart tiles + summary strip (T16-T20) |
| Wrap existing components | Globe, Feed, Scenario, Kinetic, SepBand, Kill Chain, PredictorEngine sections |
| Add 3 preset layouts | "Shift Brief" (T01+T02+T08+T09), "Incident Focus" (T09+T07+T15+T16), "Full Overview" (T01-T06) |
| localStorage persistence | Save/load custom tile arrangements |
| Topbar 4th lane button | Add CONSOLE to lane navigation |

**New files:** ~10
**Modified files:** ~5
**New backend endpoints:** 0
**New npm dependencies:** 0

### Phase 2 — Ayn Integration + Remaining HADAL Tiles

**What ships:** Ayn-powered tiles (T29-T42) come online as APIs are confirmed. Remaining HADAL tiles (T21-T28) added. Drag-and-drop reorder.

| Task | Scope |
|------|-------|
| Create `src/hooks/useAynPipeline.ts` | New hook — polls Ayn endpoints, same pattern as `useDataPipeline`. Per-engine health tracking. |
| Build Argus tiles (T29-T31) | Entity Threats, Country Matrix, Entity Network |
| Build Chatter tiles (T32-T34) | Feed, Hot Topics, Platform Activity |
| Build Ignite tiles (T35-T36) | Thermal Map, Heat Anomalies |
| Build Chronos tile (T37) | Change Detection (7d/30d toggle) |
| Build Skyline tiles (T38-T40) | Ops Weather, Theatre Grid, Weather Alerts |
| Build Signals tile (T41) | Combined ADS-B + AIS with anomaly flags |
| Build Reports tile (T42) | Briefing display |
| Add Economic tiles (T21-T23) | Market Cards, FX Board, Dubai RE |
| Add Regional tiles (T24-T28) | Full panel + individual stat boxes |
| Add `@dnd-kit/sortable` | Tile reorder within grid |
| Layout export/import | JSON copy-paste for sharing layouts between analysts |
| Tile size presets | Small (1×1) / Medium (2×1) / Large (2×2) per tile |

**New npm dependency:** `@dnd-kit/core`, `@dnd-kit/sortable`

### Phase 3 — Cross-Tile Intelligence

Once both HADAL and Ayn tiles are live, cross-tile correlations become possible:

| Correlation | What It Enables |
|-------------|----------------|
| Skyline × Prediction | Weather constrains scenario probability — "sandstorm → drone strike P=0" |
| Chronos × Argus | New heat sources linked to entity activity — "new thermal signature in area where IRGC entity was last tracked" |
| Chatter × Threat Feed | Social signal spikes correlated with incident timeline — leading indicator detection |
| Ignite × Globe | Thermal detections overlaid on operations globe |
| Weather Alerts × Kill Chain | Operational feasibility overlay on kinetic data |
| Argus × Scenario Outlook | Entity threat scores as input to scenario probability weighting |

---

## 8. Questions for Nikola

### API & Infrastructure

1. **Hosting:** Are Ayn APIs served from the same origin as HADAL's public JSON files, or does HADAL need CORS headers / a reverse proxy?

2. **Auth:** Do any Ayn endpoints require API keys that the HADAL frontend would need to pass? Or are they open behind the same deployment?

3. **Format:** Are you OK with the JSON shapes proposed in Section 5? If any field names or structures need to change to match what Ayn already produces, flag them.

4. **Endpoint paths:** The proposals use `/api/argus.json`, `/api/chatter.json`, etc. What paths will the real endpoints use?

### Rate Limits & Data

5. **OpenWeatherMap:** 14 cities at 5-minute refresh = ~4,032 API calls/day. Free tier is 1,000 calls/day. Do we need a paid plan, or can Ayn cache and serve from backend?

6. **NASA FIRMS:** Is an API key registered? The free tier should cover Gulf theatre coverage — confirm?

7. **Chatter data:** Is social data real scraping from those 8 sources or currently mock? Any content filtering/moderation before HADAL displays it?

8. **Event frequency:** HADAL's prediction engine needs 5+ events in a 14-day window. What's the current average event rate from the incidents pipeline?

### Prioritization

9. **Which Ayn engines are closest to API-ready?** If we had to pick 3 to integrate first, which would you ship endpoints for soonest?

10. **Skyline specifically:** The operation scores (Drone/Aircraft/Missile/Satellite/Ground 0-100%) — is the scoring logic already built, or is that still planned?

---

## 9. What We're NOT Building

| Item | Reason |
|------|--------|
| Signal Ingestion tile | Architecture diagram, not operator capability. Venus Trap may change this later. |
| Mini-Services tile | Infrastructure topology diagram, not user-facing. |
| Mech Archive as operational tile | Brand identity / visual anchor. Not a data capability. |
| Full ELINT/COMINT/SIGINT UI | Ayn Military Signals covers ADS-B + AIS. No real SIGINT data exists. Don't overclaim on the capability preview. |
| Free-form drag-and-drop in V1 | Overkill for initial tile set. Tile picker + preset layouts gets 80% of the value at 20% complexity. Phase 2 adds reorder. |
| Backend for layout persistence | localStorage is fine until we have user accounts. |
| Skyline historical weather as standalone tile | 77-day history is useful for Chronos correlation (Phase 3), not as a standalone tile. |

---

## 10. Risks

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Ayn API contracts not finalized | 14 tiles blocked (T29-T42) | Phase 1 ships 20 tiles without Ayn. Phase 2 tiles show `AWAITING API` badge + skeleton state until endpoint is live. |
| Prediction engine shows "INSUFFICIENT DATA" | 6 tiles affected (T05, T06, T08, T11-T14) | Confirm event rate. PredictorEngine already has demo fallback with sample incidents. |
| OpenWeatherMap rate limit exceeded | Skyline tiles go stale | Backend caches weather data + serves to HADAL. Reduces API calls from 4K/day to ~300/day. |
| Canvas tiles (globe) don't resize in grid cells | Visual glitch on layout change | Use ResizeObserver to re-initialize canvas dimensions when tile size changes. |
| Chatter content unmoderated | Raw social media displayed to analysts | Confirm Ayn pre-filters content. Add urgency-based filtering on frontend (hide "low" by default). |
| Too many simultaneous API polls from HADAL | Performance / rate limits | Stagger refresh intervals: Chatter 30s, Argus 60s, Ignite/Chronos/Skyline 5min, Reports 5min. |
| SituationStrip extraction breaks Overview page | Regression | Keep SituationStrip component intact on Overview. Console creates separate tile components that read the same data independently. |

---

## 11. Timeline Summary

| Phase | What | Depends On | Tiles |
|-------|------|-----------|-------|
| **Phase 1** | Console shell + HADAL tiles | Nothing — build now | T01-T20 (20 tiles) |
| **Phase 2** | Ayn integration + remaining tiles + reorder | Nikola confirms API contracts | T21-T42 (22 tiles) |
| **Phase 3** | Cross-tile intelligence correlations | Phase 1 + 2 live | Skyline×Prediction, Chronos×Argus, Chatter×Feed, etc. |

**Phase 1 can start immediately.** It uses only existing HADAL data and components. No Ayn dependency. No backend changes. We build the Console shell, wrap existing components in tile frames, and ship a functional 20-tile workspace.

**Phase 2 starts as Ayn endpoints come online.** Each Ayn tile has a skeleton state with an `AWAITING API` badge. When Nikola confirms an endpoint is live, we flip the tile on. No big-bang integration — tiles light up individually.

---

*Carlos — frontend / HADAL*
*Nikola — backend / Ayn*
*2026-03-23*
