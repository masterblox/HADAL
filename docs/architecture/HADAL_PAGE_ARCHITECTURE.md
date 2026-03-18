# HADAL Page Architecture

This document defines the next-step page and tab architecture for HADAL.

It exists to stop the active app from growing as a single infinite scroll and to give tomorrow's implementation a clear extraction plan.

If there is a conflict between "keep building the scroll" and this document, this document wins.

---

## Why The Current Scroll Stops Working

The active app in [src/App.tsx](/Users/carlosprada/Library/Mobile%20Documents/com~apple~CloudDocs/HADAL/src/App.tsx) is one stacked terminal:

1. Topbar
2. HeroGrid
3. MissileDefenseStrip
4. SepBand
5. ThreatFeed
6. IntelWireSection
7. EconomicSection

That structure creates three immediate problems:

- it mixes primary user tasks with secondary context in one linear journey
- it makes the map/intelligence surface compete with feed and economic modules for attention
- it keeps forcing dense operator modules into one page instead of giving users clear destinations

MIT-style density is acceptable for an internal cockpit. HADAL is not that. HADAL needs a clearer user-facing architecture with obvious entry points and less scroll fatigue.

---

## Current Page Audit

### Primary Modules

- `HeroGrid`
  Main identity and theater-at-a-glance surface. Includes [LeftRail](/Users/carlosprada/Library/Mobile%20Documents/com~apple~CloudDocs/HADAL/src/components/hero/LeftRail.tsx), [GlobeView](/Users/carlosprada/Library/Mobile%20Documents/com~apple~CloudDocs/HADAL/src/components/hero/GlobeView.tsx), and [RightRail](/Users/carlosprada/Library/Mobile%20Documents/com~apple~CloudDocs/HADAL/src/components/hero/RightRail.tsx).

- `ThreatFeed`
  Primary live feed and one of the clearest "daily use" surfaces. See [ThreatFeed](/Users/carlosprada/Library/Mobile%20Documents/com~apple~CloudDocs/HADAL/src/components/feed/ThreatFeed.tsx).

- `IntelWireSection`
  The strongest real destination candidate in the app today. Contains:
  - map
  - airspace tab
  - casualties tab
  - posturing tab
  - map layers panel
  - right-side tactical feed/telemetry
  See [IntelWireSection](/Users/carlosprada/Library/Mobile%20Documents/com~apple~CloudDocs/HADAL/src/components/intel/IntelWireSection.tsx).

### Secondary Modules

- `MissileDefenseStrip`
  Important, but currently more like a summary band than a full destination. See [MissileDefenseStrip](/Users/carlosprada/Library/Mobile%20Documents/com~apple~CloudDocs/HADAL/src/components/missile/MissileDefenseStrip.tsx).

- `EconomicSection`
  Useful context, but not primary for first-contact user flow. See [EconomicSection](/Users/carlosprada/Library/Mobile%20Documents/com~apple~CloudDocs/HADAL/src/components/economic/EconomicSection.tsx).

### Decorative / Transitional Module

- `SepBand`
  Pure separator / atmosphere element. It should not drive page architecture. See [SepBand](/Users/carlosprada/Library/Mobile%20Documents/com~apple~CloudDocs/HADAL/src/components/sep/SepBand.tsx).

### Modules Too Dense For The Current Layout

- `IntelWireSection`
  Already behaves like a full page embedded inside a page.

- `ThreatFeed` + `IntelWireSection`
  These are both primary destinations, but they currently compete vertically.

- `EconomicSection`
  Adds context load at the exact point where users should already be closing the loop on the live intelligence view.

---

## Proposed 3-Page Structure

### Page 1: Overview

Purpose:
- first-stop entry page
- give users the current operating picture fast
- preserve immediate orientation without burying them in deep tooling

Primary modules:
- `Topbar`
- `HeroGrid`
- `MissileDefenseStrip`
- condensed `ThreatFeed`

Secondary modules:
- compact alerts / summary cards derived from `IntelWireSection`

What stays on main:
- hero/theater summary
- kinetic summary
- top live feed slice

What moves out:
- full map workspace
- airspace/casualties/posturing detailed tabs
- full economic section

Why:
- this becomes the "what is happening now" page
- users get orientation, not a whole workstation dumped on them

### Page 2: Operations

Purpose:
- dedicated operational intelligence workspace
- map-first and analyst-first without being the homepage

Primary modules:
- `IntelWireSection`

Secondary modules:
- full `ThreatFeed` if needed as a right/secondary panel later
- prediction placeholder entry point

What moves here:
- full map workspace
- map layers
- right tactical rail
- bottom datalink/footer actions
- airspace tab
- casualties tab
- posturing tab

Why:
- this is already the closest thing to a real application page
- it should stop being buried halfway down the homepage

### Page 3: Analysis

Purpose:
- deeper structured intelligence
- prediction, economics, reporting, and future exports/workflows

Primary modules:
- `EconomicSection`
- prediction placeholder

Secondary modules:
- report/export placeholder
- historical/structured analysis placeholder

What moves here:
- economic intelligence
- future HADAL prediction module
- future `ICEBERG` / narrative-integrity model if adopted
- export / sitrep / analysis workflows

Why:
- this page can own "so what" and "what next" logic
- it keeps the homepage and operations page cleaner

---

## Extraction Map

| Current Section | Keep on Overview | Move to Operations | Move to Analysis | Placeholder Only | Reason |
|---|---|---|---|---|---|
| `Topbar` | Yes | Shared shell | Shared shell | No | Global shell element |
| `HeroGrid` | Yes | No | No | No | Best overview/orientation module |
| `MissileDefenseStrip` | Yes | Optional later drill-down | Optional summary reuse | No | Strong summary band, not a full page by itself yet |
| `SepBand` | Optional reduced divider | No | No | No | Atmosphere only, not a destination |
| `ThreatFeed` | Yes, condensed | Optional full feed later | No | No | Core current-awareness surface |
| `IntelWireSection` | No | Yes | No | No | Already functions as a dedicated workspace |
| `AirspaceTab` | No | Yes | No | No | Operations detail, not homepage content |
| `CasualtiesTab` | No | Yes | No | No | Operations detail, not homepage content |
| `PosturingTab` | No | Yes | No | No | Operations detail, not homepage content |
| `EconomicSection` | No | No | Yes | No | Secondary context and structured analysis |
| Prediction module | No | Entry CTA only | Yes | Yes | Needs a clean home away from scroll clutter |
| Reports / exports | No | No | Yes | Yes | Better as workflow destination than homepage clutter |

---

## Placeholder Page Definitions

### Overview Placeholder

Must contain:
- shell nav
- hero surface
- missile defense strip
- top live feed
- clear CTA into Operations
- clear CTA into Analysis

Can stay stubbed:
- deeper drill-down cards
- richer summary widgets under the hero

### Operations Placeholder

Must contain:
- shell nav
- full `IntelWireSection`
- obvious default state: map tab active
- stable page title and URL

Can stay stubbed:
- advanced cross-panel synchronization
- deeper side workflows

### Analysis Placeholder

Must contain:
- shell nav
- `EconomicSection`
- prediction placeholder card with clear label
- export/report placeholder card with clear label

Can stay stubbed:
- full prediction engine
- full `ICEBERG`
- full report builder

---

## UX Rules For Page Carving

- The homepage must answer "what is happening now?" within seconds.
- The operations page must answer "where is it happening and what is active?".
- The analysis page must answer "what does it mean and what may happen next?".
- Do not bury the map workspace under homepage scroll.
- Do not force live feed, deep ops, and economic context into one linear stack.
- Do not create pages that are only aesthetic wrappers with no job.
- Every page must have a clear user purpose.
- Primary actions must be visible without scroll-hunting.
- Secondary context belongs on secondary pages, not on the homepage by default.

---

## Tomorrow Build Order

### 1. Carve Out Operations First

Reason:
- lowest ambiguity
- highest payoff
- `IntelWireSection` is already page-shaped

Implementation target:
- route/page for Operations
- move `IntelWireSection` there with minimal internal changes

### 2. Rebuild Overview Second

Reason:
- once Operations is removed, the homepage becomes easier to simplify

Implementation target:
- keep `HeroGrid`
- keep `MissileDefenseStrip`
- keep a reduced `ThreatFeed`
- remove deep operational density

### 3. Stub Analysis Third

Reason:
- clear destination needed now, full logic can arrive later

Implementation target:
- route/page
- `EconomicSection`
- prediction placeholder
- report/export placeholder

### 4. Leave These Untouched For Now

- data pipeline in [useDataPipeline.ts](/Users/carlosprada/Library/Mobile%20Documents/com~apple~CloudDocs/HADAL/src/hooks/useDataPipeline.ts)
- current intelligence subcomponents inside `IntelWireSection`
- core visual language / CSS system unless routing forces small layout changes

---

## Final Recommendation

The correct next step is not "add more sections."

It is:

1. make `Overview` the public-facing operating picture
2. make `Operations` the real map/intelligence workspace
3. make `Analysis` the home for prediction, economics, and future user workflows

That gives HADAL a clearer, user-facing product shape without forcing a full redesign tomorrow.
