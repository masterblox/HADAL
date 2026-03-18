# Repo Map

## Runtime Areas

- [src](/Users/carlosprada/Library/Mobile%20Documents/com~apple~CloudDocs/HADAL/src)
  React/Vite application shell and future modular HADAL frontend.

- [hadal.html](/Users/carlosprada/Library/Mobile%20Documents/com~apple~CloudDocs/HADAL/hadal.html)
  Standalone visual and interaction prototype. Use as design reference, not final architecture.

- [api](/Users/carlosprada/Library/Mobile%20Documents/com~apple~CloudDocs/HADAL/api)
  Serverless endpoints and proxies.

- [scripts](/Users/carlosprada/Library/Mobile%20Documents/com~apple~CloudDocs/HADAL/scripts)
  Data ingestion, enrichment, scoring, and export generation.

- [public](/Users/carlosprada/Library/Mobile%20Documents/com~apple~CloudDocs/HADAL/public)
  Runtime data artifacts and public assets used by the deployed app.

## Archive Areas

- [legacy](/Users/carlosprada/Library/Mobile%20Documents/com~apple~CloudDocs/HADAL/legacy)
  Archived Gulf Watch frontend. Use as a behavioral reference while rebuilding modules in React.

## Project Entry Files

- [README.md](/Users/carlosprada/Library/Mobile%20Documents/com~apple~CloudDocs/HADAL/README.md)
  Project overview and quick navigation.

- [package.json](/Users/carlosprada/Library/Mobile%20Documents/com~apple~CloudDocs/HADAL/package.json)
  Frontend scripts and dependencies.

- [index.html](/Users/carlosprada/Library/Mobile%20Documents/com~apple~CloudDocs/HADAL/index.html)
  Vite app entry.

- [vercel.json](/Users/carlosprada/Library/Mobile%20Documents/com~apple~CloudDocs/HADAL/vercel.json)
  Deployment headers and hosting config.

## Documentation

- [docs](/Users/carlosprada/Library/Mobile%20Documents/com~apple~CloudDocs/HADAL/docs)
  Architecture, references, prompts, and handoff docs.

- [docs/handoff/ENGINEERING_JOURNAL.md](/Users/carlosprada/Library/Mobile%20Documents/com~apple~CloudDocs/HADAL/docs/handoff/ENGINEERING_JOURNAL.md)
  Running log of environment failures, repo issues, and recovery notes.

- [docs/architecture/HADAL_PLATFORM_PLAN.md](/Users/carlosprada/Library/Mobile%20Documents/com~apple~CloudDocs/HADAL/docs/architecture/HADAL_PLATFORM_PLAN.md)
  Macro platform architecture: product lanes, data contracts, frontend module ownership, operational resilience, governance tiers, and 7-phase implementation sequence.

## Working Rules

- Add new non-runtime documents under `docs/`, not the repo root.
- Keep runtime code in `src/`, `api/`, `scripts/`, and `public/`.
- Keep old frontend work in `legacy/`; do not mix it back into the active app.
- Treat `hadal.html` as a prototype and extraction source unless there is an explicit decision to deploy it directly.
