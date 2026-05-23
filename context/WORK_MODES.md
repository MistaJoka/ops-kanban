# Work Modes

Use a work mode to keep Cursor focused.

## Mode 1 — Scout

Use when the task is unclear.

Goal: inspect, summarize, and plan. No edits.

Output:

```txt
What I found:
Relevant files:
Likely task:
Risks:
Recommended next action:
```

## Mode 2 — Patch

Use for a small bug fix or scoped improvement.

Goal: make the smallest safe change.

Rules:

- Touch few files.
- Reuse existing patterns.
- Run one relevant proof.
- Update progress/log docs.

## Mode 3 — Build

Use for implementing a listed roadmap task.

Goal: complete one `TASK-Px-xxx`.

Rules:

- Follow active phase.
- Confirm definition of done.
- Keep changes aligned with product docs.
- Add tests/checks where appropriate.

## Mode 4 — Refactor

Use when code structure is blocking progress.

Goal: improve structure without changing behavior.

Rules:

- Preserve public behavior.
- Keep scope narrow.
- Do not redesign the product.
- Update architecture docs only if needed.

## Mode 5 — UX polish

Use for focused interface improvement.

Goal: make one area clearer, faster, or more mobile-friendly.

Rules:

- Do not change data contracts unless required.
- Keep the board primary.
- Keep card details scannable.
- Preserve operator simplicity.

## Mode 6 — AI capability

Use for AI assistant features.

Goal: add or improve AI behavior safely.

Rules:

- Follow `docs/ai/`.
- Follow `docs/api/APPROVAL_FLOW.md`.
- Make effects reviewable.
- Avoid hidden business-data changes.

## Mode 7 — Audit

Use before merge/release or after a messy session.

Goal: identify drift, missing docs, unsafe changes, or unproven work.

Output:

```txt
Pass:
Fail:
Risk:
Required fixes:
Suggested next task:
```

## Mode chooser

```txt
Need understanding? Scout.
Need tiny fix? Patch.
Need roadmap task? Build.
Need cleaner code? Refactor.
Need better UI? UX polish.
Need AI feature? AI capability.
Need confidence? Audit.
```