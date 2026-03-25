# Console Tile Rework: Airspace + Confidence

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rework AirspaceTile and ConfidenceTile to have correct semantics and honest data labels while keeping the HADAL tactical visual language.

**Architecture:** Surgical edits to two existing tile components. No new files, no new hooks, no new data pipelines. Both tiles consume data already flowing through ConsolePage props. CSS changes scoped to existing `.console-airspace-*` and `.console-confidence-*` classes in `globals.css`.

**Tech Stack:** React 19 + TypeScript, CSS custom properties, existing `useDataPipeline` types

---

## Truth Layer Audit

### AirspaceTile — Available Real Data

From `AirspaceData` (fetched from `public/airspace.json` every 60s):

| Field | Type | Example | Honest? |
|-------|------|---------|---------|
| `total_notams` | number | 10 | YES |
| `severity_counts` | `Record<string, number>` | `{WARNING:3, CRITICAL:1, ELEVATED:2, INFORMATION:4}` | YES |
| `airports_tracked` | number | 12 | YES |
| `notams[].id` | string | `TEST001/26` | YES |
| `notams[].icao` | string | `OMDB` | YES |
| `notams[].airport` | string | `Dubai International` | YES |
| `notams[].country` | string | `UAE` | YES |
| `notams[].category` | string | `HAZARD` / `AIRSPACE` / `CONFLICT` / `NAVIGATION` / `AIRPORT` | YES |
| `notams[].severity` | string | `CRITICAL` / `WARNING` / `ELEVATED` / `INFORMATION` | YES |
| `notams[].content` | string | full NOTAM text | YES |
| `notams[].valid_until` | ISO string | `2026-03-18T00:00:22` | YES |

**NOT available:** altitude, speed, weapon status, vehicle type, FLIR telemetry, ADS-B tracks.

### ConfidenceTile — Available Real Data

From `Incident[]` (fetched from pipeline every 60s):

| Field | Type | Example | Honest? |
|-------|------|---------|---------|
| `verificationScore` | number (0-100) | 85 | YES — per-incident trust score |
| `verificationBadge` | enum | `VERIFIED` / `LIKELY` / `PARTIAL` / `UNCONFIRMED` | YES |
| `numSources` | number | 3 | YES — corroborating source count |
| `credibility` | number (0-100) | 72 | YES — source credibility |

From `PredictionResult`:

| Field | Type | Honest for confidence? |
|-------|------|----------------------|
| `sufficient` | boolean | YES — tells us if model has enough data |
| `theatreThreatLevel` | number 0-100 | NO for confidence — this is *threat*, not *trust* |
| `global.mean` | number | NO for confidence — this is severity mean, not model quality |

**Current lies in ConfidenceTile:**
1. `modelFit` is derived from `prediction.global.mean * 0.9` — severity mean is NOT model fitness
2. The combined score `(verification + sourceDepth + modelFit) / 3` mixes trust metrics with a fake model metric
3. Band labels (`HIGH TRUST` / `GUARDED` / `FRAGMENTED`) are keyed to the polluted average

---

## File Map

| Action | File | What changes |
|--------|------|-------------|
| Modify | `src/components/console/tiles/AirspaceTile.tsx` | Full rework: severity board layout with NOTAM rows, category/severity breakdown, zone status |
| Modify | `src/components/console/tiles/ConfidenceTile.tsx` | Remove fake modelFit, rebuild as verification distribution + source depth + corroboration |
| Modify | `src/globals.css` | Update `.console-airspace-*` classes for new layout, minor `.console-confidence-*` tweaks |

No new files. No changes to ConsolePage, ConsoleTile wrapper, presets, or other tiles.

**Prerequisite — Type alignment:** The `AirspaceData` interface in `useDataPipeline.ts` does not include `id` on NOTAM objects, but the JSON data has it. The AirspaceTile will use index-based keys (`n-${i}`) to avoid referencing fields not in the type. No type changes needed.

---

## Task 1: Rework AirspaceTile

**Files:**
- Modify: `src/components/console/tiles/AirspaceTile.tsx`
- Modify: `src/globals.css` (`.console-airspace-*` rules)

**Design — NOTAM Severity Board:**

```
┌─────────────────────────────────────────┐
│ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────────┐│
│ │NOTAMS│ │ CRIT │ │ WARN │ │  AIRPORTS ││
│ │  10  │ │   1  │ │   3  │ │    12     ││
│ └──────┘ └──────┘ └──────┘ └──────────┘│
│─────────────────────────────────────────│
│ ▊▊▊▊▊▊▊▊▊▊▊▊▊▊▊▊░░░░░░░░  SEVERITY   │  ← stacked severity bar
│ CRIT 1  WARN 3  ELEV 2  INFO 4         │
│─────────────────────────────────────────│
│ OMDB  UAE   HAZARD     WARNING          │  ← NOTAM rows (up to 6)
│ OIIE  IRN   AIRSPACE   CRITICAL  ←warn │
│ LLBG  ISR   HAZARD     WARNING          │
│ ORBI  IRQ   CONFLICT   ELEVATED         │
│ OEJN  SAU   AIRSPACE   INFORMATION      │
│ OLBA  LBN   HAZARD     WARNING          │
└─────────────────────────────────────────┘
```

- [ ] **Step 1: Rewrite AirspaceTile component**

Replace `AirspaceTile.tsx` with:
- Top: 4-cell stat grid (NOTAMS total, CRITICAL count, WARNING count, AIRPORTS tracked) — all from real `severity_counts` and `airports_tracked`
- Middle: severity distribution bar — horizontal stacked bar showing proportion of CRITICAL/WARNING/ELEVATED/INFO from `severity_counts`
- Bottom: NOTAM list (up to 6 rows) showing `icao`, `country`, `category`, `severity` — all real fields
- Remove the derived `STATE: CONTESTED/GUARDED` label (was honest logic but adds no real data)

```tsx
import type { AirspaceData } from '@/hooks/useDataPipeline'

const SEV_ORDER = ['CRITICAL', 'WARNING', 'ELEVATED', 'INFORMATION'] as const
const SEV_COLORS: Record<string, string> = {
  CRITICAL: 'var(--warn)',
  WARNING: 'rgba(255,208,80,.85)',
  ELEVATED: 'rgba(218,255,74,.6)',
  INFORMATION: 'rgba(218,255,74,.25)',
}

export function AirspaceTile({ airspace }: { airspace: AirspaceData | null }) {
  const total = airspace?.total_notams ?? 0
  const counts = airspace?.severity_counts ?? {}
  const airports = airspace?.airports_tracked ?? 0
  const notams = airspace?.notams?.slice(0, 6) ?? []

  const critical = counts.CRITICAL ?? counts.critical ?? 0
  const warning = counts.WARNING ?? counts.warning ?? 0

  return (
    <div className="console-airspace">
      <div className="console-airspace-grid">
        <div className="console-airspace-cell">
          <span>NOTAMS</span>
          <b>{total}</b>
        </div>
        <div className={`console-airspace-cell${critical > 0 ? ' warn' : ''}`}>
          <span>CRITICAL</span>
          <b>{critical}</b>
        </div>
        <div className="console-airspace-cell">
          <span>WARNING</span>
          <b>{warning}</b>
        </div>
        <div className="console-airspace-cell">
          <span>AIRPORTS</span>
          <b>{airports}</b>
        </div>
      </div>

      {total > 0 && (
        <div className="console-airspace-severity-bar">
          {SEV_ORDER.map(sev => {
            const count = counts[sev] ?? counts[sev.toLowerCase()] ?? 0
            if (!count) return null
            return (
              <div
                key={sev}
                className="console-airspace-severity-seg"
                style={{ flex: count, background: SEV_COLORS[sev] }}
                title={`${sev}: ${count}`}
              />
            )
          })}
        </div>
      )}

      <div className="console-airspace-list">
        {notams.map((notam, i) => (
          <div key={`n-${i}`} className="console-airspace-row">
            <span className="console-airspace-icao">{notam.icao ?? '----'}</span>
            <span>{(notam.country ?? '').toUpperCase()}</span>
            <span>{(notam.category ?? 'NOTAM').toUpperCase()}</span>
            <span className={/CRITICAL/i.test(notam.severity ?? '') ? 'warn' : /WARNING/i.test(notam.severity ?? '') ? 'high' : ''}>
              {(notam.severity ?? 'INFO').toUpperCase()}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Update CSS for new AirspaceTile layout**

In `globals.css`, update `.console-airspace-*` rules:
- Change grid to `repeat(4, minmax(0, 1fr))` for the 4-cell stat row
- Add `.console-airspace-severity-bar` (flex row, 6px height, no border-radius)
- Add `.console-airspace-icao` (monospace, dimmed)
- Update `.console-airspace-row` grid to 4-column: `48px 40px 1fr auto`
- Add `.high` color class for WARNING severity

```css
/* Replace existing .console-airspace-grid rule */
.console-airspace-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 1px;
  background: var(--g07);
  border-bottom: 1px solid var(--g07);
}

/* New severity bar */
.console-airspace-severity-bar {
  display: flex;
  height: 6px;
  border-bottom: 1px solid var(--g07);
}

.console-airspace-severity-seg {
  min-width: 2px;
}

/* Updated row for 4 columns */
.console-airspace-row {
  display: grid;
  grid-template-columns: 48px 40px minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
  padding: 7px 12px;
  border-top: 1px solid var(--g07);
}

.console-airspace-icao {
  font-family: var(--MONO);
  font-size: var(--fs-micro);
  color: var(--g5);
}

.console-airspace-row .high {
  color: rgba(255,208,80,.85);
}

/* Responsive: collapse 4-col to 2-col in narrow tiles */
@container console-tile (max-width: 280px) {
  .console-airspace-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
```

**CSS conflict note:** The shared rule at lines 742-753 of `globals.css` groups `.console-airspace-row` with `.console-situation-row` and `.console-confidence-row`. The `.console-airspace-row` override above will take precedence via specificity for grid layout. The shared rule's `padding`, `font-family`, `font-size`, `color`, and `letter-spacing` base styles are inherited and still correct. No need to split the shared rule.

- [ ] **Step 3: Verify build passes**

Run: `cd /Users/carlosprada/Library/Mobile\ Documents/com~apple~CloudDocs/HADAL && npx vite build 2>&1 | tail -5`
Expected: build succeeds with no type errors

- [ ] **Step 4: Visual check in browser**

Run: dev server, navigate to `/#console`, verify Airspace tile shows real NOTAM data with severity bar and ICAO codes. No FLIR/weapons/altitude labels anywhere.

- [ ] **Step 5: Commit**

```bash
git add src/components/console/tiles/AirspaceTile.tsx src/globals.css
git commit -m "rework: AirspaceTile — NOTAM severity board with honest data labels"
```

---

## Task 2: Rework ConfidenceTile

**Files:**
- Modify: `src/components/console/tiles/ConfidenceTile.tsx`
- Modify: `src/globals.css` (minor `.console-confidence-*` tweaks)

**Design — Verification Trust Surface:**

```
┌─────────────────────────────────────────┐
│ VERIFICATION           CORROBORATION    │
│ ■■■■■□  82%            2.4 SRC/EVT     │
│─────────────────────────────────────────│
│ VERIFIED    ████████████████  6         │  ← badge distribution
│ LIKELY      ██████████        4         │
│ PARTIAL     ████              2         │
│ UNCONFIRMED ██                1         │
│─────────────────────────────────────────│
│ SOURCE DEPTH  ▓▓▓▓▓▓▓▓▓▓░░░░  68      │  ← credibility avg
│─────────────────────────────────────────│
│ MODEL: SUFFICIENT / INSUFFICIENT        │  ← honest boolean only
└─────────────────────────────────────────┘
```

**What changes from current:**
1. Remove `modelFit` — was `prediction.global.mean * 0.9` (severity mean ≠ model fitness)
2. Remove the blended `(verification + sourceDepth + modelFit) / 3` score
3. Keep `verification` average — derived honestly from `verificationScore` / `credibility`
4. Keep `sourceDepth` — derived honestly from `numSources`
5. Add verification badge distribution (count per badge tier) — honest, directly from data
6. Add corroboration ratio (avg `numSources` per event) — honest, directly from data
7. Replace `modelFit` bar with `MODEL: SUFFICIENT` / `INSUFFICIENT` — honest boolean from `prediction.sufficient`
8. Band label keyed to verification average only (not blended)

- [ ] **Step 1: Rewrite ConfidenceTile component**

```tsx
import type { Incident } from '@/hooks/useDataPipeline'
import type { PredictionResult } from '@/lib/prediction/types'

const BADGE_ORDER = ['VERIFIED', 'LIKELY', 'PARTIAL', 'UNCONFIRMED'] as const

function avg(values: number[]) {
  if (!values.length) return 0
  return values.reduce((s, v) => s + v, 0) / values.length
}

export function ConfidenceTile({
  incidents,
  prediction,
}: {
  incidents: Incident[]
  prediction: PredictionResult | null
}) {
  const sample = incidents.slice(0, 50)

  // Honest verification average from real fields
  const verificationAvg = Math.round(
    avg(sample.map(i => i.verificationScore ?? i.credibility ?? 0))
  )

  // Honest corroboration: average sources per event
  const corroboration = sample.length
    ? +(avg(sample.map(i => i.numSources ?? 1))).toFixed(1)
    : 0

  // Honest source depth: average credibility normalized to 0-100
  const sourceDepth = Math.round(
    avg(sample.map(i => Math.min((i.numSources ?? 1) * 20, 100)))
  )

  // Honest badge distribution
  const badgeCounts: Record<string, number> = {}
  for (const badge of BADGE_ORDER) badgeCounts[badge] = 0
  for (const inc of sample) {
    const badge = inc.verificationBadge ?? 'UNCONFIRMED'
    badgeCounts[badge] = (badgeCounts[badge] ?? 0) + 1
  }
  const maxBadgeCount = Math.max(1, ...Object.values(badgeCounts))

  // Band keyed to verification only — no blended fake
  const band = verificationAvg >= 78 ? 'HIGH TRUST'
    : verificationAvg >= 55 ? 'GUARDED'
    : 'FRAGMENTED'

  return (
    <div className="console-confidence">
      <div className="console-confidence-header">
        <div className="console-confidence-metric">
          <span>VERIFICATION</span>
          <b>{verificationAvg}<small>%</small></b>
        </div>
        <div className="console-confidence-metric right">
          <span>CORROBORATION</span>
          <b>{corroboration}<small> SRC/EVT</small></b>
        </div>
      </div>

      <div className="console-confidence-badges">
        {BADGE_ORDER.map(badge => (
          <div key={badge} className="console-confidence-badge-row">
            <span>{badge}</span>
            <div className="console-confidence-track">
              <div
                className="console-confidence-fill"
                style={{ width: `${(badgeCounts[badge] / maxBadgeCount) * 100}%` }}
              />
            </div>
            <b>{badgeCounts[badge]}</b>
          </div>
        ))}
      </div>

      <div className="console-confidence-footer">
        <div className="console-confidence-row">
          <span>SOURCE DEPTH</span>
          <div className="console-confidence-track">
            <div className="console-confidence-fill" style={{ width: `${sourceDepth}%` }} />
          </div>
          <b>{sourceDepth}</b>
        </div>
        <div className="console-confidence-status">
          <span>MODEL</span>
          <b className={prediction?.sufficient ? '' : 'warn'}>
            {prediction?.sufficient ? 'SUFFICIENT' : 'INSUFFICIENT'}
          </b>
          <span className="console-confidence-band">{band}</span>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Update CSS for new ConfidenceTile layout**

In `globals.css`, add/update `.console-confidence-*` rules:

```css
/* Replace .console-confidence-summary with header */
.console-confidence-header {
  display: flex;
  justify-content: space-between;
  padding: 10px 12px 8px;
  border-bottom: 1px solid var(--g07);
}

.console-confidence-metric {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.console-confidence-metric.right {
  text-align: right;
  align-items: flex-end;
}

.console-confidence-metric span {
  font-family: var(--HEAD);
  font-size: var(--fs-micro);
  letter-spacing: .16em;
  color: var(--g3);
}

.console-confidence-metric b {
  font-family: var(--C2);
  font-size: 28px;
  line-height: .9;
  color: var(--g);
}

.console-confidence-metric small {
  font-family: var(--HEAD);
  font-size: 12px;
  color: var(--g5);
}

/* Badge distribution section */
.console-confidence-badges {
  display: flex;
  flex-direction: column;
  border-bottom: 1px solid var(--g07);
}

.console-confidence-badge-row {
  display: grid;
  grid-template-columns: 90px 1fr 28px;
  align-items: center;
  gap: 10px;
  padding: 6px 12px;
  border-top: 1px solid var(--g07);
  font-family: var(--MONO);
  font-size: var(--fs-micro);
  color: var(--g5);
}

.console-confidence-badge-row b {
  justify-self: end;
  font-family: var(--HEAD);
  color: var(--g7);
}

/* Footer with source depth + model status */
.console-confidence-footer {
  padding: 0;
}

.console-confidence-status {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  font-family: var(--HEAD);
  font-size: var(--fs-micro);
  letter-spacing: .14em;
  color: var(--g3);
}

.console-confidence-status b {
  font-family: var(--MONO);
  color: var(--g);
}

.console-confidence-status b.warn {
  color: var(--warn);
}

.console-confidence-band {
  margin-left: auto;
  color: var(--g5);
}
```

- [ ] **Step 3: Remove stale CSS rules**

Remove these stale CSS rules (no longer referenced):
- `.console-confidence-summary` and its child rules (replaced by `.console-confidence-header`)
- `.console-confidence-bars` (replaced by `.console-confidence-badges`)

Keep these — still used by the new component:
- `.console-confidence-track`, `.console-confidence-fill` (reused in badge rows + source depth)
- `.console-confidence-row` (reused for source depth row)

- [ ] **Step 4: Verify build passes**

Run: `cd /Users/carlosprada/Library/Mobile\ Documents/com~apple~CloudDocs/HADAL && npx vite build 2>&1 | tail -5`
Expected: build succeeds with no type errors

- [ ] **Step 5: Visual check in browser**

Navigate to `/#console`. Verify:
- ConfidenceTile shows verification % and corroboration ratio (both derived from real incident fields)
- Badge distribution bars show actual counts of VERIFIED/LIKELY/PARTIAL/UNCONFIRMED
- Source depth bar derived from real numSources
- Model shows SUFFICIENT/INSUFFICIENT (honest boolean)
- No "model fit" percentage pretending severity mean is quality
- No theatre threat level dressed as confidence

- [ ] **Step 6: Commit**

```bash
git add src/components/console/tiles/ConfidenceTile.tsx src/globals.css
git commit -m "rework: ConfidenceTile — honest verification trust surface, remove fake modelFit"
```

---

## What is NOT touched

- `ThreatSignalTile` — KEEP
- `SituationTile` (intelligence/tempo/market) — KEEP
- `ConsoleTile` wrapper — KEEP
- `ConsolePage` orchestrator — KEEP
- `ConsoleToolbar` / `TilePicker` — KEEP
- All other tiles — KEEP
- Data pipeline / types — KEEP
- Presets — KEEP
