# MVP scope — landscaping (Wave 0)

Single source of truth for **Wave 0** (lean v1). Frozen capture: `docs/roadmap/MVP_CAPTURE.md`. Build execution: `docs/roadmap/PHASE_TASKS.md` (P0–P6). Feature-rich modules (PayPal, Calendly, DocuSign, SMS, etc.) are **P7–P10 / Waves 1–4** in `PLATFORM_CAPABILITIES.md`.

## Vertical

**Landscaping / lawn-care SMB** — see `VERTICAL_LANDSCAPING.md` and `DEFAULT_PIPELINE.md`.

## In scope

### Product

- [ ] Job Pipeline workspace (sidebar, top bar, board, AI dock) — `WORKSPACE_DESIGN.md`
- [ ] Support pages: Help, Contact, Shortcuts modal, Changelog
- [ ] One operations board; **compact** 9 columns default; **full** 19 optional
- [ ] Deep card: customer/property, job scope, estimate, schedule fields, financial summary
- [ ] Estimates (quote drafts + line items) and invoices (drafts + balance)
- [ ] Schedule via **card dates** (`scheduled_start` / `scheduled_end`), not a full calendar app
- [ ] Activity timeline on every card move and money action
- [ ] AI copilot per `AI_UTILIZATION.md`: board dock + card rail, Tier 1–3 tools, approval modal, inline summary/draft CTAs

### Technical

- [ ] Next.js app (scaffold at build start — not included in blueprint ZIP)
- [ ] Supabase auth, org, RLS on all MVP tables (Phase 1)
- [ ] Signup bootstrap: org + primary board + default columns
- [ ] Realtime: board column/card updates only
- [ ] Gemini 2.5 Flash with tool executor + risk gates (no direct DB writes from model)

### Success criteria

Matches `PRODUCT_BRIEF.md` — a landscaping owner can run inquiry → estimate → schedule → complete → invoice → paid on one board, with AI assist.

## Out of scope for Wave 0 (planned in later waves)

| Feature | Wave | Doc |
|---------|------|-----|
| PayPal / Stripe pay links | 1 | `PLATFORM_CAPABILITIES.md` §4.4 |
| DocuSign / native e-sign | 1–3 | §4.1 |
| Calendly / booking page | 2 | §4.2 |
| SMS/email send (Twilio, Resend) | 2 | §4.3 |
| Full calendar app | 2 | §4.2 |
| Customer portal (approve + pay) | 1–4 | §4.5 |
| QuickBooks sync | 4 | §4.6 |
| Automations | 4 | Wave 4 |
| 19-column full pipeline | 0 optional toggle | `FULL_PIPELINE.md` |
| Customers / Reports pages | 2–4 | Phased build |
| File storage (live) | 3 | Supabase Storage — MVP: tab hidden or empty only (`NO_MOCK_DATA_POLICY.md`) |
| Recurring contracts | 4 | Wave 4 |

Wave 0 uses **manual paid**, **draft-only comms**, **card schedule fields**—by design, not omission.

## MVP pages

| Page | MVP |
|------|-----|
| Landing | Minimal real page or redirect to login — **no demo board, no sample jobs** |
| Login / Signup | Yes |
| Operations board | Yes — primary workspace |
| Card detail modal | Yes |
| Dashboard | Minimal: today’s jobs, overdue, unpaid total |
| Customers | Defer |
| Calendar | Defer |
| Reports | Defer |
| Notifications | Defer (inline approvals on board) |
| Settings | Minimal: org name, pipeline labels (read-only keys) |

## Acceptance scenarios (smoke test)

1. Sign up → org + board + 9 columns exist.
2. Create inquiry card for "Rivera — spring cleanup" with property address.
3. Drag to Site visit → Estimating; add estimate line items.
4. Mark estimate sent → Approved; set scheduled date and crew.
5. Move through On site → Complete; create invoice draft.
6. Mark paid → Closed; card archived.
7. Ask AI to summarize card; draft estimate from notes; move card with approval.
