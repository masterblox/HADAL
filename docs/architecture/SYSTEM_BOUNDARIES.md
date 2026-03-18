# System Boundaries

This is the canonical model for how to think about the three systems involved in HADAL.

If any doc, prompt, or diagram conflicts with this file, this file wins.

---

## The Three Systems

### 1. Gulf Watch

Gulf Watch is the **original source system**.

It is the repo and product Nikola created before HADAL.

Its role in this project:

- source of the original product logic
- source of the original feature set
- source of the ingestion and JSON pipeline
- source of the original frontend behavior and workflows

What we inherit from Gulf Watch:

- incident feed logic
- circuit breaker
- cross-source verification
- coordinate enrichment
- finance and airspace fetchers
- reports concept
- prediction concepts
- map and dashboard interactions

What Gulf Watch is **not**:

- not the final HADAL UX
- not the final HADAL architecture
- not the design language we are shipping

Short version:

**Gulf Watch provides the live capability and original product intelligence.**

---

### 2. HADAL

HADAL is the **target product shell**.

Its role in this project:

- the new operator-facing UX
- the new visual system
- the new frontend architecture
- the place where inherited Gulf Watch capability gets reorganized cleanly

What HADAL should own:

- product presentation
- terminal shell
- information hierarchy
- modular frontend boundaries
- clean contracts between data and UI

What HADAL should **not** do:

- should not casually rewrite Nikola's useful feature logic
- should not become another giant prototype file
- should not own business logic in the browser when it belongs in the pipeline

Short version:

**HADAL is the destination product experience.**

---

### 3. MIT

MIT is **not** the source product and **not** the destination product.

MIT is a **selective pattern donor**.

Its role in this project:

- donate specific UI patterns
- donate selected component ideas
- donate selected design-system or realtime patterns if useful

What MIT may contribute:

- co-pilot widget pattern
- logo/component method
- specific layout or interaction patterns
- optional backend/realtime conventions if explicitly chosen

What MIT should **not** contribute:

- core HADAL product logic
- core threat model
- the main application architecture
- broad repo structure by default

Short version:

**MIT contributes selected patterns only.**

---

## Canonical Flow

```text
Gulf Watch
  -> provides feature logic and live capability
  -> gets preserved / adapted
  -> lands inside HADAL

MIT
  -> provides selected patterns only
  -> injects into HADAL where useful
```

Or even shorter:

```text
Gulf Watch = live source
HADAL = target UX
MIT = selective donor
```

---

## Keep / Adapt / Archive Rules

### From Gulf Watch

- keep the capability
- adapt the implementation where needed
- archive the legacy frontend as a reference

### From HADAL

- keep the visual direction
- rebuild the architecture cleanly
- use prototypes as reference, not as permanent structure

### From MIT

- import only what is explicitly useful
- do not let MIT become the main architecture frame

---

## Folder Meaning In This Repo

### Active

- `src/`
  Active HADAL frontend shell.

- `api/`
  Active serverless endpoints and proxies.

- `scripts/`
  Active inherited pipeline and processing logic.

- `public/`
  Active public data artifacts and runtime assets.

### Reference / Archive

- `legacy/`
  Archived Gulf Watch frontend reference.

- `hadal.html`
  HADAL visual and interaction prototype reference.

- `docs/`
  Architecture, reference, prompts, and handoff docs.

---

## Non-Negotiable Interpretation Rules

- Do not describe MIT as the primary source system.
- Do not describe Gulf Watch as just a design reference.
- Do not describe HADAL as just a reskin.
- Do not mix current repo state with speculative future backend plans without labeling them clearly.
- Do not mix workflow tooling ideas with core architecture unless explicitly separated.

---

## One-Sentence Summary

**Gulf Watch provides the original live capability, HADAL becomes the product experience, and MIT contributes only selected patterns.**
