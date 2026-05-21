# Landscaping vertical

OpsBoard AI is configured for **landscaping and lawn-care SMBs** (owner-operator through small crews). One universal board tracks every job from first inquiry to paid and closed.

## Target operator

- Residential lawn care, maintenance routes, and one-off installs
- Small hardscape / planting / irrigation projects
- Seasonal work: spring cleanup, mulch, aeration, fall cleanup, snow (post-MVP)

Typical team: 1 owner, 1 office person, 2–8 field workers.

## Terminology (use in UI and AI copy)

| Generic term | Landscaping term |
|--------------|------------------|
| Lead | Inquiry |
| Discovery | Site visit / measure |
| Quote | Estimate |
| Job | Property job |
| Work order | Crew assignment |
| Customer | Homeowner / property manager |
| Pipeline | Job pipeline |

## Job types (MVP: tags in description or title; post-MVP: structured field)

- `maintenance` — recurring mow, trim, blow
- `install` — plants, beds, sod
- `hardscape` — pavers, walls, patios
- `cleanup` — spring/fall, storm debris
- `irrigation` — repair, install, winterize
- `other`

## Card fields (MVP mapping)

Use existing schema; no custom columns required for v1.

| Need | Where |
|------|--------|
| Property address | `customers.address` |
| Homeowner name / phone | `customers.name`, `phone`, `email` |
| Job scope / notes | `cards.description` |
| Service type | Prefix in `cards.title` or first line of description |
| Crew lead | `cards.assigned_to` |
| Job value | `cards.revenue_value` |
| Crew day / window | `cards.scheduled_start`, `scheduled_end` |
| Follow-up date | `cards.due_date` |
| Next step | `cards.next_action` |

## Deep card sections (landscaping labels)

| Section | Landscaping focus |
|---------|-------------------|
| Overview | Job title, column, priority, next action |
| Customer | Homeowner, property address, gate codes in notes |
| Job scope | Turf area, beds, access, photos (files post-MVP) |
| Estimate | Line items: labor, materials, disposal, equipment |
| Schedule | Crew date, start/end, weather hold in comments |
| Financial | Estimate total, invoice, balance due |
| Checklist | Pre-job: mark utilities, materials loaded, etc. |

## AI copilot (landscaping)

The copilot should understand:

- Estimates often need sq ft, visit notes, and material lines
- Weather and crew capacity affect scheduling
- Maintenance vs project jobs have different urgency
- Common next actions: "Schedule site visit", "Send estimate", "Assign Crew A Tuesday"

Example commands:

- "Summarize the Johnson property job and what we owe them next."
- "Draft an estimate from these site notes: 0.25 acre mow, hedge trim front only."
- "What jobs are scheduled tomorrow that are not paid yet?"
- "Move the Miller mulch job to Scheduled for Thursday."

## Post-MVP landscaping features

- Recurring maintenance contracts (route cards)
- Crew calendar with drive-time
- Material catalog and markup
- Before/after photo gallery per property
- HOA / commercial property fields
- QuickBooks / Stripe integrations
