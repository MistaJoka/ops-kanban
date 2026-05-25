# Inquiry intake runbook

Public customer intake via `/inquiry/{slug}` and related API. Domain: `lib/domain/intake/processIntake.ts`. Schema: migrations `020`, `021`.

---

## URLs

| Surface | Path | API |
| ------- | ---- | --- |
| Public form | `/inquiry/{slug}` | `GET/POST /api/inquiry/[slug]` |
| Settings copy | Settings → Integrations | Inquiry URL + preset links |

Slug is created per org in `inquiry_pages` (auto on first access via `ensureInquiryPage`).

---

## Campaign tracking (`?src=`)

Preset source keys for QR/print/website (Settings → Integrations):

| Key | Label |
| --- | ----- |
| `yard-sign` | Yard sign |
| `truck-wrap` | Truck wrap |
| `business-card` | Business card |
| `website` | Website embed |

Example: `https://your-app.com/inquiry/acme-abc12345-quote?src=yard-sign`

Stored on intake metadata as `source` / `campaign`.

---

## What happens on submit

1. **Rate limit** — public POST throttled (`INT-API-PUB-001`)
2. **Idempotency** — `claimInquiryRequest()` on `inquiry_requests` (duplicate POST returns cached result)
3. **Match open card** — same phone/email attaches message to existing open card (`inquiry.received` activity)
4. **New card** — otherwise `process_intake_create_atomic` RPC creates customer + inquiry column card
5. **Automations** — column-enter automations run on new inquiry cards
6. **SMS path** — inbound Twilio webhook uses same `processIntake()` engine

---

## Operator checklist

- [ ] Migrations `020` and `021` applied on environment
- [ ] Copy inquiry URL from Settings → Integrations
- [ ] Add preset link to yard sign / website / business card
- [ ] Submit test inquiry; confirm card appears in **inquiry** column (or attaches to open job)
- [ ] Duplicate submit returns same card (idempotency)

---

## Troubleshooting

| Symptom | Check |
| ------- | ----- |
| 429 on form | Rate limit — wait and retry |
| No card created | Supabase logs; migration 021 applied; slug active in `inquiry_pages` |
| Duplicate jobs | Should not happen — verify `inquiry_requests` claim-first |
| SMS not attaching | Twilio webhook + customer phone match; `WH-SMS-*` tests |

---

## Tests

- `WH-INQ-*` — intake webhook/form integration
- `INT-IDEM-003` — concurrent inquiry idempotency
- `INT-API-PUB-001` — rate limit

Run: `npm run test:integration -- inquiry`

---

## Related

- [`API_ROUTES.md`](../api/API_ROUTES.md) § Public routes
- [`API_PATTERNS.md`](../api/API_PATTERNS.md) § Idempotency
- [`PILOT_DAY_ONE.md`](./PILOT_DAY_ONE.md)
- LEARN-021 in [`BUILD_KNOWLEDGE.md`](../roadmap/BUILD_KNOWLEDGE.md)
