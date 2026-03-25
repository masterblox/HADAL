# Overnight Handoff — 2026-03-25

## Current direction

Canonical product direction is now:

```text
GulfWatch V2 = product truth
AYN / HADAL experiment branches = donor only
```

Current intended lane map:

```text
OVERVIEW = former Console hero shell (Mekhead + surrounding modules + lower rail)
MAPS     = current operations route, visibly renamed
CONSOLE  = analyst workbench / editable board
```

## What landed

### Save
- `src/App.tsx`
  - login/access-code gate removed from normal app flow
  - no `?bypass` dependency
  - visible lane title for `operations` changed to `Maps`
- `src/components/topbar/Topbar.tsx`
  - visible nav label changed from `OPERATIONS` to `MAPS`
- `src/components/intel/IwlNav.tsx`
  - workspace copy changed from `OPERATIONS WORKSPACE` to `MAPS WORKSPACE`
- `src/pages/OperationsPage.tsx`
  - page title changed to `Maps`
  - situation/support rails moved into the map lane
  - CTA reframed around Console as analyst workbench
- `src/pages/OverviewPage.tsx`
  - old Overview stack replaced with the former Console hero composition:
    - six sharp bays
    - Mekhead core
    - lower support rail
- `src/pages/ConsolePage.tsx`
  - non-edit posture changed away from forced hero shell into occupied workbench grid
- `src/components/console/ConsoleToolbar.tsx`
  - non-edit mode copy changed to `ANALYST WORKBENCH`
- `src/data/console-presets.ts`
  - default console preset changed to `ANALYSIS`
- `FEATURES.md`
  - repo note now says GulfWatch V2 correction pass is active
  - AYN is treated as donor-only

### Verification completed
- `npx tsc --noEmit` passed
- `npm run build` passed
- local dev server used at `http://127.0.0.1:4185/`

## What is broken right now

### Critical visual issue
Overview is structurally wired to the former Console hero shell, but it is **visually broken**.

Observed symptom:

```text
Top rail and upper support modules show
Mekhead shell is clipped / pinned high
Huge dead void below
The landing spectacle is not reading correctly
```

This is not a lane-role problem anymore. It is now a **layout/sizing/CSS problem** in the reused shell.

Most likely culprit:
- reused `.console-circuit-shell` / `.console-circuit-main` / `.console-core-shell` sizing rules are tuned for the old Console context and are not filling the Overview lane correctly
- the former Console hero shell was re-homed, but not normalized for the Overview page container

## Recommended next CLI pass

### Pass title
`Overview hero shell sizing fix`

### Scope
- `src/pages/OverviewPage.tsx`
- `src/globals.css`

### Goal
Make Overview render exactly like the formerly approved Console hero landing:

```text
Mekhead centered
six surrounding modules visible
lower support rail visible
no giant dead void
```

### Rules
- do **not** redesign the lane architecture again
- do **not** revert the lane-role swap
- do **not** reintroduce the login gate
- do **not** move the hero back into Console

### What to inspect first
- `.console-circuit-shell`
- `.console-circuit-main`
- `.console-core-shell`
- `.console-aux-grid`
- any Overview-specific wrapper constraints
- terminal/container height behavior

## Product decisions locked

```text
OVERVIEW = spectacle / landing
MAPS     = map-first operational lane
CONSOLE  = analyst workbench
```

```text
Gate removed = keep removed
MAPS naming  = keep
Console as workbench = keep
```

## Notes for next owner

- User strongly rejected sparse/empty Overview interpretations.
- The approved landing is the old expensive Mekhead-centered hero view.
- User is okay taking over with Claude CLI from here.
- Priority now is to clean the house and make the product leaner, not to reopen architecture again.
