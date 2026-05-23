# CSS dev guardrails — avoid unstyled UI

**Symptom:** Pipeline looks like raw HTML (black background, blue links, default buttons). Create menu and layout “break” after a few coding sessions.

**This is usually not a Tailwind/globals.css bug.** The HTML loads (HTTP 200) but the linked stylesheet returns **404**.

---

## Confirmed failure mode

| Check                                      | Broken        | Healthy            |
| ------------------------------------------ | ------------- | ------------------ |
| `GET /pipeline`                            | 200           | 200                |
| `GET /_next/static/css/app/layout.css?...` | **404**       | 200 (~70KB+)       |
| `.next/BUILD_ID`                           | often present | absent in pure dev |

Verify anytime:

```bash
npm run check:css-health
```

Recovery:

```bash
npm run dev:clean
```

---

## Root cause (source)

Next.js keeps compiled assets in `.next/`. **Production** (`npm run build`) and **development** (`next dev`) write **different shapes** into that folder.

When they mix, dev HTML still references `app/layout.css` but disk holds production chunks (or vice versa) → **CSS 404 → no styles**.

Common triggers during “vibe coding”:

1. **`npm run build` while `next dev` is still running** on port 3000
2. **Starting `next dev` after `npm run build` without clearing `.next`**
3. **Two dev servers** — stale process on :3000 serves bad HTML; new work hits the stale server
4. **`npm run test:regression`** — runs `build` then E2E; old Playwright config reused a poisoned dev server
5. **Manually deleting parts of `.next`** mid-session

Not the cause (usually):

- Editing `globals.css` or component class names
- Dropdown `z-index` / `top-full` tweaks (those affect layout, not stylesheet loading)

---

## What to avoid

| Do not                                               | Do instead                                                     |
| ---------------------------------------------------- | -------------------------------------------------------------- |
| Run `npm run build` with dev server up               | Stop dev → build → `npm run dev:clean` before UI testing       |
| Run `npm run dev` after build without clearing cache | `npm run dev:clean` (kills :3000, removes `.next`, starts dev) |
| Assume green `/pipeline` means CSS OK                | Run `npm run check:css-health`                                 |
| Debug Tailwind first when UI is totally unstyled     | Check CSS URL in Network tab or `check:css-health`             |
| Leave multiple `next dev` terminals open             | One dev server; use `dev:clean` when switching tasks           |

---

## Automated guards (repo)

| Guard                               | When                                                                |
| ----------------------------------- | ------------------------------------------------------------------- |
| `npm run predev`                    | Warns if `.next/BUILD_ID` exists (production cache)                 |
| `npm run postbuild`                 | Same warning after every build                                      |
| `npm run check:css-health`          | Manual / CI script — fails on CSS 404 or tiny bundle                |
| Playwright `global-setup`           | Fails E2E fast if reused server has broken CSS                      |
| `scripts/playwright-dev-server.mjs` | Clears poisoned `.next` before E2E when `CI` or prod cache detected |
| E2E `CSS-001 @smoke`                | Asserts `.ops-toolbar` computed styles + CSS responses 200          |

Skip checks (only if intentional):

```bash
PLAYWRIGHT_SKIP_CSS_CHECK=1 npm run test:e2e:smoke
PLAYWRIGHT_REUSE_DIRTY=1 npm run test:e2e
```

---

## Agent / session checklist

Before claiming UI work is done:

1. `npm run check:css-health` → OK
2. Hard refresh `/pipeline` — Field ledger theme visible
3. Click **Create** — menu opens below + button (not raw unstyled page)

If CSS breaks mid-session: **stop debugging components** → `npm run dev:clean`.

---

## References

- `scripts/check-css-health.mjs`
- `scripts/dev-clean.mjs`
- `docs/roadmap/BUILD_KNOWLEDGE.md` — **LEARN-015**
- E2E: `tests/e2e/css-health.spec.ts` (CSS-001)
