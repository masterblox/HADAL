# Engineering Journal

Purpose: record environment failures, repo state issues, important decisions, and recovery steps so the next human or agent can continue without reconstructing context from terminal output.

## 2026-03-17

### Entry 001

Issue:

- CLI / Playwright setup is already unstable.
- Running `npx playwright install chromium` produced the warning that Playwright was being installed before project dependencies were installed.

Observed output:

```text
WARNING: It looks like you are running 'npx playwright install' without first installing your project's dependencies.
```

Implication:

- Browser automation is not in a clean ready state.
- Any Playwright-based verification should be treated as blocked until dependency state is verified first.

Recommended recovery order:

1. Confirm the working directory is the intended HADAL repo.
2. Run dependency install for the active project before Playwright browser installation.
3. Verify whether Playwright is actually a project dependency or only being used ad hoc.
4. Only then run browser install.

Notes:

- The terminal snippet referenced a different user path: `/Users/masterlox/.../HADAL`.
- The current local workspace in this session is `/Users/carlosprada/Library/Mobile Documents/com~apple~CloudDocs/HADAL`.
- That path mismatch should be checked before assuming both terminals are operating on the same checkout.

### Entry 002

Issue:

- Git state in the current checkout is unhealthy.

Observed output:

```text
fatal: bad object HEAD
```

Implication:

- This checkout may have a damaged `.git` state or partial history issue.
- Do not trust git-based workflow operations in this local copy until HEAD integrity is verified.

Recommended recovery order:

1. Inspect `.git/HEAD`.
2. Check whether the referenced branch or commit exists.
3. Verify object database integrity before attempting normal git operations.
4. If needed, repair from a known-good clone rather than forcing commands in a broken repo.

### Journal Rule

Add new entries with:

- date
- issue
- exact observed output
- implication
- recommended next step

Keep entries short and factual.
