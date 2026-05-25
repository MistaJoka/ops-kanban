# Pilot day-one runbook

First-day checklist for a landscaping pilot operator on staging or production.

Couples to [`PILOT_DEPLOY_CHECKLIST.md`](./PILOT_DEPLOY_CHECKLIST.md) and [`INQUIRY_INTAKE.md`](./INQUIRY_INTAKE.md).

---

## Before the operator logs in

1. Apply migrations **`001` → `021`**: `npm run db:migrate`
2. Set `DISABLE_AUTH=false` on production
3. Configure env vars (Supabase, optional Gemini, Sentry, PayPal/Twilio)
4. Run smoke: `npm run test:e2e:smoke`
5. Run `npm run check:no-mock` and `npm run check:doc-sync`

---

## Signup and board

1. Operator signs up at `/signup`
2. Confirm redirect to **Job Pipeline**
3. Confirm **9 empty columns**, **zero cards** (NO_MOCK policy)
4. Pipeline mode: Settings → General → compact (9) or full (19)

---

## First job (manual)

1. On pipeline, create card: e.g. "Rivera — spring cleanup"
2. Add customer phone/email on card Property tab
3. Move through inquiry → estimate → schedule (UAT-02–05 partial)
4. Draft quote on Money tab; optional invoice + mark paid

---

## Public inquiry link

1. Settings → Integrations → copy **Inquiry URL**
2. Copy a preset link (yard sign, website, etc.) with `?src=` tracking
3. Open link in incognito; submit test inquiry
4. Confirm new card or attach to open job on board
5. Optional: embed link on pilot customer website

See [`INQUIRY_INTAKE.md`](./INQUIRY_INTAKE.md) for dedup/idempotency behavior.

---

## AI copilot (optional)

1. Open AI dock on pipeline
2. Try: "What's on the board today?"
3. Tool that changes records → **approval required** → approve via bell

See [`APPROVAL_FLOW.md`](../api/APPROVAL_FLOW.md).

---

## Day-one success criteria

| Check | Expected |
| ----- | -------- |
| Empty board at signup | 0 cards, 9 columns |
| Manual job created | Card visible, movable |
| Inquiry form works | Card or attach from public URL |
| No demo/sample data | Real empty states only |
| Errors visible | Sentry/alerts if configured |

---

## Escalation

- 5xx spike → [`MONITORING.md`](./MONITORING.md)
- Migration failures → verify `SUPABASE_DB_URL` or password; forward-only migrations
- Doc/code mismatch → `npm run check:doc-sync`
