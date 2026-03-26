# Localhost / Vercel Debug Workflow

## Purpose

Stop localhost preview, repo state, and Vercel deploy state from drifting into different truths during debugging.

---

## Rule

Never compare localhost to Vercel unless you know the commit and build stamp for both.

The app now surfaces:

- commit SHA
- deploy target (`LOCAL` or `VERCEL`)
- build time

Use that stamp before discussing any bug.

---

## Debug Handshake

### 1. Check local truth

- run local app or local build
- note the visible build stamp in the top bar
- confirm the local git commit with `git rev-parse --short HEAD`

### 2. Check Vercel truth

- open the deployed app
- note the visible build stamp in the top bar
- confirm it matches the pushed commit you expect

### 3. Compare only like-for-like

- if local and Vercel stamps match, compare behavior directly
- if they do not match, do **not** treat differences as bugs yet
- first decide whether the issue is:
  - local-only (uncommitted or unpushed)
  - deploy-only
  - same-commit real bug

---

## Common Failure Mode

The most common confusion loop is:

1. local files change
2. localhost reflects new code
3. Vercel still serves the previous pushed bundle
4. discussion compares both as if they are the same app

That is not a runtime bug. It is a state mismatch.

---

## Required Workflow

Before any “localhost vs Vercel” debugging pass:

1. confirm `git status`
2. confirm local commit SHA
3. confirm deployed build stamp
4. confirm whether Vercel is behind local
5. only then classify the issue

---

## Classification

- **Preview-only issue** — exists in local changes, not pushed yet
- **Deploy-only issue** — exists on Vercel but not in same-commit local build
- **Shared issue** — same bug on same build stamp in both places

Only the third case is a true localhost/Vercel parity bug.
