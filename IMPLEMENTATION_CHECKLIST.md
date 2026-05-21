# Implementation Checklist

Landscaping MVP — follow `docs/cursor/PHASED_BUILD_PLAN.md`. Pipeline: `docs/product/DEFAULT_PIPELINE.md`. QA: `docs/testing/README.md`.

## Foundation

- [ ] Create Next.js app
- [ ] Add Supabase
- [ ] Add auth + profiles ↔ auth.users
- [ ] Add organization creation (signup bootstrap)
- [ ] Add primary board (Job Pipeline)
- [ ] Seed 9 landscaping columns (`landscaping-default-columns.ts`)
- [ ] RLS on all MVP tables

## Workspace shell

- [ ] Collapsible sidebar + support routes (`SUPPORT_PAGES.md`)
- [ ] Job Pipeline top bar (filters, search, compact/full toggle)
- [ ] Column groups + horizontal scroll + group jump chips
- [ ] AI command dock (bottom)
- [ ] Brand assets in `public/brand/`

## Kanban

- [ ] Render columns (compact + full pipeline constants)
- [ ] Render cards
- [ ] Create card
- [ ] Edit card
- [ ] Move card
- [ ] Archive card
- [ ] Add activity logs

## Deep card

- [ ] Overview section
- [ ] Customer section
- [ ] Job scope section
- [ ] Quote section
- [ ] Scheduling section
- [ ] Financial section
- [ ] Comments
- [ ] Checklist
- [ ] Activity timeline

## AI

- [ ] Add GEMINI_API_KEY
- [ ] Add AI command API route
- [ ] Add system prompt
- [ ] Add context loader
- [ ] Add tool registry
- [ ] Add risk classifier
- [ ] Add approval engine
- [ ] Add AI tool-call logs
- [ ] Add AI command bar
- [ ] Add card summarization
- [ ] Add create-card command
- [ ] Add move-card command
- [ ] Add quote-draft command

## Testing (parallel — see docs/testing/)

- [ ] Wire Vitest + Playwright per `tests/README.md`
- [ ] P0: SEC-RLS, UNIT-PIPE, E2E R0, AI-INJ
- [ ] Release gate G2 before pilot (`RELEASE_GATES.md`)

## Production hardening

- [ ] Role checks (RLS done in Foundation)
- [ ] Rate limits
- [ ] Error states
- [ ] Loading states
- [ ] Empty states
- [ ] Mobile layout
- [ ] Audit logs
