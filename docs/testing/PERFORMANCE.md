# Performance & reliability (T13)

**Run alone:** `npm run test:perf` (non-blocking MVP gate unless noted)

## MVP baselines (P2 gate, monitor in prod)

| Metric                   | Target                | Test                      |
| ------------------------ | --------------------- | ------------------------- |
| Pipeline first paint     | &lt; 2.5s LCP staging | Lighthouse CI optional    |
| Board with 200 cards     | scroll 60fps desktop  | manual / Playwright trace |
| Card panel open          | &lt; 300ms            | E2E timing soft assert    |
| POST /api/ai/command P95 | &lt; 8s mocked Gemini | k6 or vitest bench        |
| Realtime latency         | &lt; 2s card appear   | E2E-RT-001                |

## Load (post-MVP pilot)

| Scenario                   | Tool                    | Pass                     |
| -------------------------- | ----------------------- | ------------------------ |
| 10 concurrent users, 1 org | k6                      | P95 API &lt; 500ms reads |
| 50 cards/min AI commands   | rate limit triggers 429 | PERF-AI-001              |

## Reliability

| ID      | Case                      | Expected                   | P   |
| ------- | ------------------------- | -------------------------- | --- |
| REL-001 | Supabase brief disconnect | graceful error toast       | P2  |
| REL-002 | Gemini timeout            | AI dock error, board works | P1  |
| REL-003 | Double-submit new job     | one card created           | P1  |

## Soak (Wave 1+)

24h webhook processor idempotency on staging — no duplicate payments.
