# Support pages

Static and light-interaction pages inside the app shell. Routes and copy for implementation.

| Route | Title | MVP content |
|-------|-------|-------------|
| `/support/help` | Help & guides | Markdown sections below |
| `/support/contact` | Contact support | Form → email webhook or `mailto:` |
| `/support/changelog` | What’s new | Version list from `CHANGELOG.md` |
| Modal `?` | Keyboard shortcuts | From `WORKSPACE_DESIGN.md` §9 |

Footer on all support pages: Privacy (`/legal/privacy`), Terms (`/legal/terms`).

---

## Help & guides — sections

1. **Run your pipeline** — compact vs full; link to `FULL_PIPELINE.md` glossary table
2. **Create a job** — title format, property, job type
3. **Estimates & invoices** — draft → sent → paid
4. **Crew scheduling** — `scheduled_start`, assignee, blocked column
5. **AI copilot** — what it can/cannot do; approvals
6. **Roles** — owner, manager, worker, viewer

## Contact support

- Fields: name, email, subject, message, optional screenshot
- Copy: “We respond within 1 business day.”
- Landscaping-specific FAQ link anchor on Help page

## What’s new

- Ship with v0.1.0 MVP bullets when built
- Format: date, version, added/changed/fixed

## Legal (minimal stubs)

- Privacy: data stored in Supabase, AI sends job context to Gemini, no sale of PII
- Terms: beta/pilot disclaimer
