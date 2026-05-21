# Exploratory testing charters (T18)

**Run alone:** 60–90 min sessions; no automation required  
**Couples:** ISTQB exploratory principles, fills gaps automation misses

## Session template

| Field | Content |
|-------|---------|
| Charter ID | EXP-NN |
| Mission | |
| Scope | In / Out |
| Time box | |
| Tester | |
| Build | |
| Findings | Bug IDs |
| Notes | |

---

## EXP-01 — Pipeline chaos

**Mission:** Break the board with rapid drag, filter changes, and concurrent tab.  
**In:** Job Pipeline only. **Out:** AI, settings.  
**Oracles:** No duplicate cards; column counts match; no console errors.  
**Risks:** F-05, F-13.

---

## EXP-02 — Money edge cases

**Mission:** Find invoice/estimate inconsistencies.  
**Cases:** $0.01 lines, tax rounding, delete line after sent, mark paid twice.  
**Risks:** F-08, R-06.

---

## EXP-03 — AI adversarial

**Mission:** Prompt injection, role confusion, ambiguous addresses.  
**Use:** `AI_PROMPT_LIBRARY.md` negative + creative typos.  
**Risks:** R-02, R-03, R-13.

---

## EXP-04 — Landscaping realism

**Mission:** Run one fictional company day (5 jobs, 2 crews, weather block).  
**Oracles:** Owner could run business without spreadsheet.  
**Maps:** UAT combined narrative.

---

## EXP-05 — Mobile field

**Mission:** Use phone on `/pipeline` in bright light / throttled 3G.  
**Oracles:** Readable, tappable, no layout break.

---

## EXP-06 — Security gut check

**Mission:** DevTools tamper org_id, replay requests, back button after logout.  
**Maps:** T03 attack trees.

---

## Session frequency

- Once per sprint during Wave 0 build
- Full EXP-01–06 before pilot launch
