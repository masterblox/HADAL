# GulfWatch Live Feature Match Report — 2026-03-26

## Scope

This report matches Nikola's live GulfWatch feature inventory against the current HADAL repo state.

- **Live source reviewed:** `https://gulfwatch-testing.vercel.app/features.html`
- **Repo truth reviewed:** current `legacy-hadal/main` at `1781c58`
- **Purpose:** determine what HADAL already carries, what is partial, and what is still shell-only or absent

## Match Legend

- **MATCH** — real implemented surface with credible runtime backing in HADAL
- **PARTIAL** — visible in HADAL, but only partly wired, partly static, or framed differently
- **SHELL** — present as a tile/component/surface, but not truly connected to the capability it claims
- **ABSENT** — not meaningfully present in current HADAL runtime

---

## Executive Summary

HADAL currently matches the GulfWatch V2 feature inventory unevenly.

**Strongest matches**
- Incident Feed
- Tactical Map / Maps lane shell
- Prediction Engine
- Missile Defense
- Finance / market impact
- Argus / Chatter / Chronos as visible module surfaces

**Partial but salvageable**
- Ignite
- Skyline
- Airspace / aircraft overlays
- Data export
- Government / verification framing
- Circuit Breaker as inherited logic rather than a surfaced module

**Weak or invalid today**
- Maritime
- Signals as a serious live capability
- Venus Trap

The repo is already organized around the correct lane model for adaptation:
- `Overview` = common operating picture
- `Maps` = geospatial operations lane
- `Console` = analyst workbench

The remaining problem is not overall architecture. It is capability parity and honest surfacing.

---

## 1. Specialized Collection & Analysis Modules

| GulfWatch live feature | HADAL status | Current repo evidence | Notes |
|---|---|---|---|
| Argus | PARTIAL | `src/components/console/tiles/AynFeatureTiles.tsx` (`ArgusTile`), mounted in `src/pages/OverviewPage.tsx` and `src/pages/ConsolePage.tsx` | Visible and derived from incident/verification context, but still presented as a proxy tile rather than a fully surfaced entity-resolution module |
| Chatter | PARTIAL | `src/components/console/tiles/AynFeatureTiles.tsx` (`ChatterTile`), mounted in `src/pages/OverviewPage.tsx` and `src/pages/ConsolePage.tsx` | Visible module shell, but not backed by real Telegram/Discord/Reddit/Twitter collection inside HADAL |
| Ignite | PARTIAL | `src/components/console/tiles/AynFeatureTiles.tsx` (`IgniteTile`), mounted in `src/pages/OverviewPage.tsx` and `src/pages/ConsolePage.tsx` | Present as a module surface; still not equivalent to GulfWatch live FIRMS-backed coverage |
| Chronos | PARTIAL | `src/components/console/tiles/AynFeatureTiles.tsx` (`ChronosTile`), mounted in `src/pages/ConsolePage.tsx` | Visible and incident-derived, but not yet a fully articulated multi-window change-detection system |
| Skyline | SHELL | `src/components/console/tiles/AynFeatureTiles.tsx` (`SkylineTile`) | Tile is honest about missing feed: `NO WEATHER DATA`, `AWAITING SKYLINE MODULE INTEGRATION` |
| Maritime | ABSENT | no active runtime module or lane surface | `FEATURES.md` already marks Maritime as invalid/currently useless |
| Signals | SHELL | `src/components/console/tiles/MilitarySignalsTile.tsx`, mounted in `src/pages/ConsolePage.tsx` | Procedural visual tile only; not a live SIGINT/ELINT capability |
| Venus Trap | SHELL | `src/components/console/tiles/VenusTrapTile.tsx` exists but is not mounted in current lane pages | Exists as a leftover shell, not a live or trusted product capability |

---

## 2. Core Platform Capabilities

| GulfWatch live feature | HADAL status | Current repo evidence | Notes |
|---|---|---|---|
| Incident Feed | MATCH | `src/components/feed/ThreatFeed.tsx`, used in `src/pages/OperationsPage.tsx` | Live incidents are mapped into feed rows with verification badges and fallback data only as supplement |
| Circuit Breaker | PARTIAL | inherited in docs and source hierarchy, not surfaced as a dedicated HADAL runtime module | Capability exists in GulfWatch lineage and feed/verification framing, but HADAL does not yet expose a first-class circuit-breaker surface |
| Tactical Map | PARTIAL | `src/components/intel/LeafletMap.tsx`, `src/components/intel/IntelWireSection.tsx`, `src/pages/OperationsPage.tsx` | Real map workspace exists, but still mixes live incidents with static overlays and hardcoded map-event layers |
| Prediction Engine | MATCH | `src/components/predictor/PredictorEngine.tsx`, `src/components/console/tiles/PredictorEngineTile.tsx` | One of the strongest real HADAL capabilities; local modeling over live pipeline data |
| Missile Defense | MATCH | `src/components/missile/MissileDefenseStrip.tsx`, mounted in `src/pages/OperationsPage.tsx` | Present and integrated as a real lane support surface |
| Finance Panel | MATCH | `src/components/economic/EconomicSection.tsx`, `SituationTile` market mode in Console | Live prices supported; some surrounding economic rows remain static reference/context |
| Data Exports | PARTIAL | `src/components/intel/IwlBottom.tsx`, `src/lib/sitrep-export` | HADAL exposes tactical SITREP export, but not the fuller JSON/CSV/GeoJSON export surface GulfWatch advertises |
| Government Sources | PARTIAL | feed/verification framing in `ThreatFeed.tsx`, verification surfaces, source hierarchy docs | No dedicated government-source module yet, but the source/verification concept is present |

---

## 3. Lane Fit Inside HADAL

### Overview
Best current fit:
- Argus
- Chatter
- Ignite
- threat/verification/report summary
- event timeline / geographic concentration / type profile / feed quality

Reason:
`Overview` is already behaving as the common operating picture and can carry the highest-signal read-mostly modules.

### Maps
Best current fit:
- Tactical Map
- Airspace Status
- aircraft tracking
- casualties / posturing overlays
- missile defense support rail
- full feed support rail

Reason:
The current `Maps` lane already owns the geospatial workspace and should remain the home for map-first capability.

### Console
Best current fit:
- Prediction Engine
- analyst tiles and custom preset layouts
- Chronos
- deeper module interaction
- report/export workflows
- any future action-capable decision-support surfaces

Reason:
`Console` is correctly positioned as the workbench, not the landing shell.

---

## 4. Honest Gap List

### Keep and build on
- `ThreatFeed.tsx`
- `PredictorEngine.tsx`
- `IntelWireSection.tsx`
- `LeafletMap.tsx`
- `EconomicSection.tsx`
- Overview hero shell using the former Console composition

### Needs real wiring, not redesign
- Argus
- Chatter
- Ignite
- Chronos
- Skyline
- government-source surfacing
- export surface depth

### Should stay explicitly demoted or excluded until real
- Maritime
- Signals as live intelligence
- Venus Trap

---

## 5. Bottom Line

Current HADAL is **not missing the architecture**.
Current HADAL is missing **feature parity discipline**.

The right next move is:
1. keep the lane model locked
2. preserve Overview as the common operating picture
3. wire real capability into the partial module set
4. avoid promoting shell-only modules as if they are live

That is the shortest path from the current repo to honest GulfWatch V2 parity.
