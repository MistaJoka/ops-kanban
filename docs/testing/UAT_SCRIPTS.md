# UAT scripts — landscaping owner (T12)

**Run alone:** manual on staging  
**Duration:** ~90 min full; ~30 min smoke (UAT-01,02,06,08,10)  
**Couples:** `MVP_SCOPE.md` acceptance, `PRODUCT_BRIEF.md` success criteria

## Preconditions

- Staging URL, test org “Green Valley Landscaping”
- Tester role: owner
- Mobile phone available for responsive check (UAT-09)

---

## UAT-01 — First login & pipeline

1. Sign up as new owner with business name.
2. Confirm landing on **Job Pipeline** with **9 columns**.
3. Confirm column names match landscaping defaults.

**Pass:** Board usable in &lt; 2 min without docs.  
**Fail severity:** S1

---

## UAT-02 — New inquiry to site visit

1. - New job: `Chen — Weekly mow`, address `10 Elm St`.
2. Drag to **Site visit**.
3. Open card → Property → verify address saved.

**Pass:** Card shows property line on board.  
**Maps:** E2E-JOB-001, PRODUCT_BRIEF #1–3

---

## UAT-03 — Estimate workflow

1. Add 2 line items (mow, edging).
2. Attempt move to **Estimate sent** with $0 → blocked.
3. Add prices → move to **Estimate sent**.

**Pass:** Validation matches office expectation.  
**Maps:** FMEA F-04

---

## UAT-04 — Schedule crew

1. Move to **Approved** → **Scheduled**.
2. Without date → blocked; set Thursday 8am, assign crew lead.

**Pass:** Board shows date chip.  
**Maps:** FMEA F-03

---

## UAT-05 — Complete job & invoice

1. Move through **On site** → **Complete**.
2. Create invoice draft matching estimate.
3. **Mark paid** (manual) → **Closed**.

**Pass:** Card archived/hidden; invoice paid.  
**Maps:** PRODUCT_BRIEF #7–9

---

## UAT-06 — AI summarize & draft

1. Open card in estimating; paste site notes in AI dock.
2. Draft estimate → review line items → approve.
3. Reject a bad AI move (wrong column) → card unchanged.

**Pass:** AI helps but does not bypass approval.  
**Maps:** AI-TOOL-002, AI-LOG-002

---

## UAT-07 — Second user / worker (optional)

1. Invite worker; assign card.
2. Worker can move assigned card, cannot mark paid.

**Pass:** Role matches `SECURITY_RLS.md`.  
**Maps:** SEC-ROLE

---

## UAT-08 — Cross-day office flow

1. Filter **Overdue** and **Scheduled this week**.
2. Search by street name.
3. Sidebar → Help → find pipeline glossary.

**Pass:** Office can run morning review without spreadsheet.  
**Maps:** AI_UTILIZATION morning brief (manual compare)

---

## UAT-09 — Mobile field check

1. Phone browser: open scheduled job card.
2. Read address, next action, scope.

**Pass:** Readable in sunlight; no horizontal scroll on card panel.  
**Maps:** T14

---

## UAT-10 — Trust & data isolation

1. If second test org available: confirm no visibility of Green Valley cards.

**Pass:** No cross-tenant data.  
**Maps:** SEC-RLS, R-01

---

## UAT sign-off form

| Field                   | Value        |
| ----------------------- | ------------ |
| Build version           |              |
| Tester                  |              |
| Date                    |              |
| UAT-01 … 10             | Pass / Fail  |
| Blockers                |              |
| Accepted residual risks | IDs from T01 |
